(function(){
  const STORAGE_KEY = "weishan:repair:v1";
  const SCHEMA_VERSION = "weishan.repair.v1";
  const RECENT_WINDOW_MS = 15000;
  const recentFingerprints = {};
  let installed = false;

  function nowIso(){ return new Date().toISOString(); }
  function appVersion(){ return window.WEISHAN_BUILD_MARKER || "weishan local"; }
  function createId(prefix){
    const tp = window.WeishanTaskProtocol;
    if (tp && tp.createTaskId) return tp.createTaskId(prefix || "repair");
    return String(prefix || "repair") + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }
  function readItems(){
    try {
      const raw = window.localStorage && window.localStorage.getItem(STORAGE_KEY);
      const items = raw ? JSON.parse(raw) : [];
      return Array.isArray(items) ? items : [];
    } catch (_) {
      return [];
    }
  }
  function writeItems(items){
    try {
      if (!window.localStorage) return;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(items) ? items.slice(0, 200) : []));
    } catch (_) {}
  }
  function sanitizeRepairText(value, maxLength){
    const max = Number(maxLength || 500);
    let text = String(value || "").replace(/\s+/g, " ").trim();
    text = text
      .replace(/\bsk-[A-Za-z0-9_-]{6,}\b/g, "sk-****")
      .replace(/\b(Bearer\s+)[A-Za-z0-9._~+/=-]{6,}/gi, "$1****")
      .replace(/\b(api[_-]?key|token|password|secret|cookie|authorization)\b\s*[:=]\s*['\"]?[^,'\"}\s]+/gi, "$1=[redacted]")
      .replace(/BEGIN (?:RSA )?PRIVATE KEY[\s\S]*?END (?:RSA )?PRIVATE KEY/gi, "BEGIN [redacted] PRIVATE KEY");
    return text.length > max ? text.slice(0, max).trim() + "..." : text;
  }
  function sanitizeStack(stack){
    const lines = String(stack || "").split(/\r?\n/).slice(0, 6);
    return lines.map((line) => {
      const clean = sanitizeRepairText(line, 220);
      const match = clean.match(/(?:at\s+)?([A-Za-z0-9_$.[\]<>-]+)?\s*\(?([^()\s]+\.js)(?::(\d+))?(?::(\d+))?\)?/);
      if (!match) return clean.replace(/\/Users\/[^/\s)]+/g, "/Users/[redacted]");
      const fn = match[1] || "anonymous";
      const file = (match[2] || "").split("/").slice(-1)[0];
      const row = match[3] || "";
      const col = match[4] || "";
      return [fn, file, row, col].filter(Boolean).join(":");
    }).filter(Boolean).join(" | ");
  }
  function hashString(text){
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(36);
  }
  function createRepairFingerprint(issue){
    return hashString([
      issue && issue.module || "unknown",
      issue && issue.action || "unknown",
      issue && issue.errorName || "Error",
      issue && issue.errorMessageSummary || ""
    ].join("|"));
  }
  function normalizeIssue(issue){
    const createdAt = issue.createdAt || nowIso();
    const normalized = {
      repairId:issue.repairId || createId("repair"),
      schemaVersion:SCHEMA_VERSION,
      createdAt,
      updatedAt:issue.updatedAt || createdAt,
      status:issue.status || "detected",
      severity:issue.severity || "medium",
      module:issue.module || "unknown",
      action:issue.action || "unknown",
      errorName:issue.errorName || "Error",
      errorMessageSummary:sanitizeRepairText(issue.errorMessageSummary || issue.message || "", 500),
      stackSummary:sanitizeStack(issue.stackSummary || issue.stack || ""),
      fingerprint:issue.fingerprint || "",
      source:issue.source || "manual",
      repairSummary:sanitizeRepairText(issue.repairSummary || "", 500),
      verificationSummary:sanitizeRepairText(issue.verificationSummary || "", 500),
      telemetryReady:Boolean(issue.telemetryReady),
      uploaded:false,
      runId:sanitizeRepairText(issue.runId || "", 120)
    };
    normalized.fingerprint = normalized.fingerprint || createRepairFingerprint(normalized);
    return normalized;
  }
  function listRepairIssues(){ return readItems(); }
  function saveRepairIssue(issue){
    const next = normalizeIssue(issue || {});
    const items = readItems();
    const index = items.findIndex((item) => item.repairId === next.repairId);
    if (index >= 0) items[index] = Object.assign({}, items[index], next, { updatedAt:nowIso() });
    else items.unshift(next);
    writeItems(items);
    return index >= 0 ? items[index] : next;
  }
  function historyRecord(type, payload){
    if (!window.HistoryApi || typeof window.HistoryApi.record !== "function") return null;
    return window.HistoryApi.record(type, payload);
  }
  function historyPayload(issue, type, outputSummary, artifacts){
    return {
      schemaVersion:"weishan.task.v1",
      taskId:issue.repairId,
      module:"repair",
      action:type.replace(/^repair\./, ""),
      status:issue.status === "failed" ? "failed" : "done",
      createdAt:issue.createdAt,
      startedAt:issue.createdAt,
      finishedAt:nowIso(),
      inputSummary:sanitizeRepairText(issue.errorName + " · " + issue.errorMessageSummary, 180),
      outputSummary:sanitizeRepairText(outputSummary || issue.repairSummary || issue.verificationSummary || "修护记录已更新。", 220),
      repairId:issue.repairId,
      fingerprint:issue.fingerprint,
      source:issue.source,
      severity:issue.severity,
      artifacts:Array.isArray(artifacts) ? artifacts : []
    };
  }
  function errorFromUnknown(error){
    if (error && error.reason) return errorFromUnknown(error.reason);
    if (error && error.error) return errorFromUnknown(error.error);
    if (error instanceof Error) return error;
    const fallback = new Error(sanitizeRepairText(error && error.message || error || "Unknown runtime error"));
    if (error && error.stack) fallback.stack = error.stack;
    if (error && error.name) fallback.name = error.name;
    return fallback;
  }
  function recordRuntimeError(error, meta){
    const err = errorFromUnknown(error);
    const issue = normalizeIssue({
      module:meta && meta.module || "runtime",
      action:meta && meta.action || "runtimeError",
      errorName:err.name || "Error",
      errorMessageSummary:err.message || "Runtime error",
      stackSummary:err.stack || "",
      source:meta && meta.source || "runtime",
      severity:meta && meta.severity || "medium",
      runId:meta && meta.runId || ""
    });
    const last = recentFingerprints[issue.fingerprint] || 0;
    const now = Date.now();
    if (now - last < RECENT_WINDOW_MS) return null;
    recentFingerprints[issue.fingerprint] = now;
    const saved = saveRepairIssue(issue);
    historyRecord("repair.bugDetected", historyPayload(saved, "repair.bugDetected", "检测到运行错误，已生成本地脱敏修护记录。"));
    return saved;
  }
  function createManualRepairIssue(input){
    const issue = saveRepairIssue({
      module:input && input.module || "repair",
      action:input && input.action || "manual",
      errorName:input && input.errorName || "ManualRepairIssue",
      errorMessageSummary:input && input.errorMessageSummary || input && input.message || "Manual repair test issue",
      stackSummary:input && input.stackSummary || "",
      source:input && input.source || "manual",
      severity:input && input.severity || "low",
      runId:input && input.runId || ""
    });
    historyRecord("repair.bugDetected", historyPayload(issue, "repair.bugDetected", "已生成本地修护记录。"));
    return issue;
  }
  function updateIssue(repairId, fields, historyType, summary){
    const items = readItems();
    const index = items.findIndex((item) => item.repairId === repairId);
    if (index < 0) return null;
    const next = normalizeIssue(Object.assign({}, items[index], fields || {}, { updatedAt:nowIso() }));
    items[index] = next;
    writeItems(items);
    if (historyType) historyRecord(historyType, historyPayload(next, historyType, summary));
    return next;
  }
  function markRepairSuggested(repairId, repairSummary){
    return updateIssue(repairId, {
      status:"suggested",
      repairSummary:sanitizeRepairText(repairSummary || "建议修护：保留本地脱敏记录，等待人工确认修复。", 500),
      telemetryReady:true
    }, "repair.suggested", "已记录建议修护摘要。");
  }
  function markRepairVerified(repairId, verificationSummary){
    return updateIssue(repairId, {
      status:"verified",
      verificationSummary:sanitizeRepairText(verificationSummary || "验证通过：本地修护流程记录完整。", 500),
      telemetryReady:true
    }, "repair.verified", "已记录修护验证结果。");
  }
  function createSafeTelemetryPayload(issue){
    const item = normalizeIssue(issue || {});
    return {
      schemaVersion:SCHEMA_VERSION,
      repairId:item.repairId,
      createdAt:item.createdAt,
      appVersion:appVersion(),
      module:item.module,
      action:item.action,
      severity:item.severity,
      errorName:item.errorName,
      errorMessageSummary:item.errorMessageSummary,
      stackSummary:item.stackSummary,
      fingerprint:item.fingerprint,
      repairSummary:item.repairSummary,
      verificationSummary:item.verificationSummary,
      source:item.source,
      clientMode:"local",
      uploadMode:"pending_manual_or_cloud_opt_in"
    };
  }
  function reportFilename(issue, ext){
    const date = new Date(issue.updatedAt || issue.createdAt || nowIso());
    const pad = (n) => String(n).padStart(2, "0");
    const stamp = date.getFullYear() + pad(date.getMonth() + 1) + pad(date.getDate()) + "-" + pad(date.getHours()) + pad(date.getMinutes()) + pad(date.getSeconds());
    return "weishan-repair-report-" + stamp + "." + (ext || "md");
  }
  function createRepairReportArtifact(issue, format){
    const item = normalizeIssue(issue || {});
    const telemetry = createSafeTelemetryPayload(item);
    const asJson = format === "json";
    const content = asJson ? JSON.stringify(telemetry, null, 2) : [
      "# weishan 修护报告",
      "",
      "生成时间：" + nowIso(),
      "修护 ID：" + item.repairId,
      "状态：" + item.status,
      "模块：" + item.module,
      "动作：" + item.action,
      "错误类型：" + item.errorName,
      "脱敏摘要：" + item.errorMessageSummary,
      "堆栈摘要：" + item.stackSummary,
      "指纹：" + item.fingerprint,
      "修护摘要：" + (item.repairSummary || "未填写"),
      "验证状态：" + (item.verificationSummary || "未验证"),
      "",
      "## 安全 telemetry payload",
      "",
      "```json",
      JSON.stringify(telemetry, null, 2),
      "```",
      "",
      "本报告不包含源码、密钥、prompt、messages、provider body、邮件正文、cookie、token、password 或本地文件内容。"
    ].join("\n");
    const artifact = {
      artifactId:createId("artifact"),
      taskId:item.repairId,
      type:asJson ? "json" : "markdown",
      title:asJson ? "修护 telemetry JSON" : "修护报告",
      filename:reportFilename(item, asJson ? "json" : "md"),
      mimeType:asJson ? "application/json;charset=utf-8" : "text/markdown;charset=utf-8",
      sizeBytes:new Blob([content]).size,
      content,
      createdAt:nowIso(),
      meta:{ kind:"repair-report", source:"repair.reportExported" }
    };
    historyRecord("repair.reportExported", historyPayload(item, "repair.reportExported", "已生成本地修护报告。", [artifact]));
    return artifact;
  }
  function installRepairErrorCapture(){
    if (installed || typeof window === "undefined") return;
    installed = true;
    window.addEventListener("error", (event) => {
      recordRuntimeError(event && (event.error || event.message), { source:"runtime", module:"renderer", action:"window.error" });
    });
    window.addEventListener("unhandledrejection", (event) => {
      recordRuntimeError(event && event.reason, { source:"runtime", module:"renderer", action:"unhandledrejection" });
    });
  }
  function cleanupE2ERepairIssues(runId){
    const id = String(runId || "");
    if (!id) return;
    writeItems(readItems().filter((item) => item.runId !== id && JSON.stringify(item || {}).indexOf(id) < 0));
  }

  window.WeishanRepairCenter = {
    STORAGE_KEY,
    SCHEMA_VERSION,
    sanitizeRepairText,
    sanitizeStack,
    createRepairFingerprint,
    listRepairIssues,
    saveRepairIssue,
    recordRuntimeError,
    createManualRepairIssue,
    markRepairSuggested,
    markRepairVerified,
    createSafeTelemetryPayload,
    createRepairReportArtifact,
    installRepairErrorCapture,
    cleanupE2ERepairIssues
  };
})();
