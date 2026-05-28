(function(){
  const MODULE_FILTERS = ["all", "home", "mail", "crawler", "softwareFactory", "project", "memory", "team", "seats", "reports", "audit", "unknown"];
  const STATUS_FILTERS = ["all", "done", "failed", "running", "queued"];
  const ACTION_FILTERS = ["all", "create", "update", "export", "view", "copy", "exportApproved", "exportRejected", "webFetch", "generatePlan", "taskDispatch", "other"];

  function esc(s){ return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function t(key){ return window.I18n.t(key); }
  function isEn(){ return window.I18n && window.I18n.getLang && window.I18n.getLang() === "en"; }
  function label(zh, en){ return isEn() ? en : zh; }
  function nowIso(){ return new Date().toISOString(); }
  function taskProtocol(){ return window.WeishanTaskProtocol || null; }
  function summarize(text, maxLength){
    const tp = taskProtocol();
    return tp && tp.summarizeTextSafe ? tp.summarizeTextSafe(text, maxLength) : String(text || "").replace(/\s+/g, " ").trim().slice(0, maxLength || 160);
  }
  function localTime(value){
    const date = value ? new Date(value) : new Date();
    const valid = Number.isNaN(date.getTime()) ? new Date() : date;
    const pad = (n) => String(n).padStart(2, "0");
    return valid.getFullYear() + "/" + pad(valid.getMonth() + 1) + "/" + pad(valid.getDate()) + " " + pad(valid.getHours()) + ":" + pad(valid.getMinutes()) + ":" + pad(valid.getSeconds());
  }
  function payloadOf(record){ return record && record.payload && typeof record.payload === "object" ? record.payload : {}; }
  function recordTime(record){
    const payload = payloadOf(record);
    return record && record.createdAt || payload.finishedAt || payload.createdAt || payload.startedAt || "";
  }
  function typePart(record, index){
    const parts = String(record && record.type || "").split(".");
    return parts[index] || "";
  }
  function moduleOf(record){
    const payload = payloadOf(record);
    return payload.module || typePart(record, 0) || "unknown";
  }
  function actionOf(record){
    const payload = payloadOf(record);
    return payload.action || typePart(record, 1) || "unknown";
  }
  function statusOf(record){
    const payload = payloadOf(record);
    return payload.status || "";
  }
  function titleOf(record){
    const payload = payloadOf(record);
    return payload.title || payload.inputSummary || payload.command || record && record.type || "";
  }
  function inputSummaryOf(record){
    const payload = payloadOf(record);
    return payload.inputSummary || payload.command || titleOf(record);
  }
  function outputSummaryOf(record){
    const payload = payloadOf(record);
    return payload.outputSummary || payload.resultSummary || payload.summary || payload.results || payload.process || "";
  }
  function taskIdOf(record){
    return payloadOf(record).taskId || "";
  }
  function artifactsOf(record){
    const artifacts = payloadOf(record).artifacts;
    return Array.isArray(artifacts) ? artifacts.filter(Boolean) : [];
  }
  function riskOf(record){
    const status = statusOf(record);
    const text = [record && record.type, actionOf(record)].join(" ").toLowerCase();
    if (status === "failed") return "high";
    if (/delete/.test(text)) return "medium";
    if (/export/.test(text)) return "medium";
    if (artifactsOf(record).length) return "low";
    if (status === "done") return "low";
    return "info";
  }
  function riskLabel(risk){
    if (risk === "high") return label("高", "High");
    if (risk === "medium") return label("中", "Medium");
    if (risk === "low") return label("低", "Low");
    return label("信息", "Info");
  }
  function actionGroup(action){
    if (ACTION_FILTERS.indexOf(action) >= 0 && action !== "all") return action;
    return "other";
  }
  function statusClass(value){
    if (value === "done") return "done";
    if (value === "failed" || value === "high") return "error";
    if (value === "running" || value === "medium") return "running";
    return "";
  }
  function shortText(value, maxLength){
    return summarize(typeof value === "string" ? value : "", maxLength || 180);
  }
  function auditRecord(record){
    const action = actionOf(record);
    return {
      raw:record,
      type:record && record.type || "",
      time:recordTime(record),
      module:moduleOf(record),
      action,
      actionGroup:actionGroup(action),
      status:statusOf(record),
      title:titleOf(record),
      inputSummary:inputSummaryOf(record),
      outputSummary:outputSummaryOf(record),
      taskId:taskIdOf(record),
      artifactCount:artifactsOf(record).length,
      risk:riskOf(record)
    };
  }
  function auditRecords(){
    return (window.HistoryApi && typeof window.HistoryApi.list === "function" ? window.HistoryApi.list() : []).map(auditRecord);
  }
  function currentFilters(){
    return {
      query:String((document.getElementById("auditSearch") || {}).value || "").trim().toLowerCase(),
      module:(document.getElementById("auditModuleFilter") || {}).value || "all",
      status:(document.getElementById("auditStatusFilter") || {}).value || "all",
      action:(document.getElementById("auditActionFilter") || {}).value || "all"
    };
  }
  function matchesQuery(item, query){
    if (!query) return true;
    return [
      item.type,
      item.module,
      item.action,
      item.status,
      item.taskId,
      item.inputSummary,
      item.outputSummary,
      item.title
    ].join(" ").toLowerCase().includes(query);
  }
  function applyFilters(items, filters){
    return items.filter(item => {
      if (filters.module !== "all" && item.module !== filters.module) return false;
      if (filters.status !== "all" && item.status !== filters.status) return false;
      if (filters.action !== "all" && item.actionGroup !== filters.action) return false;
      return matchesQuery(item, filters.query);
    });
  }
  function countBy(items, getter){
    return items.reduce((acc, item) => {
      const key = getter(item) || "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }
  function countLines(title, counts){
    const rows = Object.keys(counts).sort().map(key => "- " + key + "：" + counts[key]);
    return [title].concat(rows.length ? rows : ["- 无"]).join("\n");
  }
  function filename(dateLike){
    const d = dateLike ? new Date(dateLike) : new Date();
    const valid = Number.isNaN(d.getTime()) ? new Date() : d;
    const pad = (n) => String(n).padStart(2, "0");
    return "weishan-audit-report-" + valid.getFullYear() + pad(valid.getMonth() + 1) + pad(valid.getDate()) + "-" + pad(valid.getHours()) + pad(valid.getMinutes()) + pad(valid.getSeconds()) + ".md";
  }
  function textSize(text){ try { return new Blob([String(text || "")]).size; } catch (_) { return String(text || "").length; } }
  function security(){ return window.WeishanEnterpriseSecurity || null; }
  function auditPayload(action, status, result, reason, watermark){
    const sec = security();
    const principal = sec && sec.getCurrentSecurityPrincipal ? sec.getCurrentSecurityPrincipal() : { userId:"local-user", displayName:"Local User", companyId:"local-company", planType:"personal" };
    if (sec && sec.createSecurityAuditPayload) {
      return sec.createSecurityAuditPayload({
        principal,
        action,
        status,
        sourceModule:"audit",
        scope:"audit",
        targetType:"module",
        targetId:"audit",
        result,
        reason,
        watermark,
        inputSummary:"audit " + action,
        outputSummary:"audit " + result
      });
    }
    return { module:"audit", action, status, actorUserId:principal.userId, actorName:principal.displayName, planType:principal.planType, result, reason, watermark, createdAt:nowIso() };
  }
  function filterSummary(filters){
    return [
      "query=" + (filters.query || "all"),
      "module=" + filters.module,
      "status=" + filters.status,
      "action=" + filters.action
    ].join(", ");
  }
  function reportContent(items, filters){
    return [
      "# 审计报告",
      "",
      "生成时间：" + localTime(),
      "记录总数：" + items.length,
      "筛选条件：" + filterSummary(filters),
      "",
      countLines("按模块统计：", countBy(items, item => item.module)),
      "",
      countLines("按状态统计：", countBy(items, item => item.status || "unknown")),
      "",
      countLines("按风险统计：", countBy(items, item => riskLabel(item.risk))),
      "",
      "有产物记录数：" + items.filter(item => item.artifactCount > 0).length,
      "",
      "## 审计记录",
      items.map((item, index) => [
        "### " + (index + 1) + ". " + (item.type || "history.record"),
        "- 时间：" + localTime(item.time),
        "- 类型：" + (item.type || ""),
        "- 模块：" + item.module,
        "- 动作：" + item.action,
        "- 状态：" + (item.status || "unknown"),
        "- 风险：" + riskLabel(item.risk),
        "- 标题 / 输入摘要：" + shortText(item.title || item.inputSummary, 180),
        "- 输出摘要：" + shortText(item.outputSummary, 220),
        "- taskId：" + (item.taskId || ""),
        "- artifact 数量：" + item.artifactCount
      ].join("\n")).join("\n\n") || "暂无审计记录。"
    ].join("\n");
  }
  function createExportRecord(items, filters, artifact){
    const tp = taskProtocol();
    const summary = "导出审计报告，共 " + items.length + " 条记录。";
    if (tp && tp.createTaskRecord) {
      const base = tp.createTaskRecord({
        module:"audit",
        action:"export",
        routeMode:"module",
        title:"审计报告",
        inputSummary:filterSummary(filters),
        outputSummary:summary,
        status:"done",
        source:{ type:"module", module:"audit" },
        target:{ type:"module", module:"audit" },
        executor:{ type:"system", id:"audit.local", label:"Audit Local" },
        meta:{ recordCount:items.length, filters }
      });
      const started = tp.transitionTaskStatus ? tp.transitionTaskStatus(base, "running") : Object.assign({}, base, { status:"running", startedAt:nowIso() });
      const done = tp.transitionTaskStatus ? tp.transitionTaskStatus(started, "done", { outputSummary:summary }) : Object.assign({}, started, { status:"done", finishedAt:nowIso(), outputSummary:summary });
      if (!tp.addTaskArtifact) return Object.assign({}, done, { artifacts:[artifact] });
      return tp.addTaskArtifact(Object.assign({}, done, { artifacts:[] }), artifact);
    }
    const now = nowIso();
    return {
      schemaVersion:"weishan.task.v1",
      taskId:"task-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
      module:"audit",
      action:"export",
      status:"done",
      createdAt:now,
      startedAt:now,
      finishedAt:now,
      inputSummary:filterSummary(filters),
      outputSummary:summary,
      artifacts:[artifact]
    };
  }
  function exportAuditReport(){
    const sec = security();
    const principal = sec && sec.getCurrentSecurityPrincipal ? sec.getCurrentSecurityPrincipal() : { planType:"personal" };
    const access = sec && sec.canAccessModule ? sec.canAccessModule(principal, "audit") : { allowed:true, requiresApproval:false, reason:"allowed" };
    if (access.requiresApproval) {
      const ok = typeof window.confirm === "function" ? window.confirm(label("该导出需要企业授权，是否以本地模拟授权继续？", "This export requires enterprise approval. Continue with local simulated approval?")) : false;
      if (!ok) {
        if (window.HistoryApi && typeof window.HistoryApi.record === "function") window.HistoryApi.record("audit.exportRejected", auditPayload("exportRejected", "failed", "rejected", access.reason, ""));
        return;
      }
      if (window.HistoryApi && typeof window.HistoryApi.record === "function") window.HistoryApi.record("audit.exportApproved", auditPayload("exportApproved", "done", "approved", access.reason, ""));
    }
    const filters = currentFilters();
    const items = applyFilters(auditRecords(), filters);
    const content = reportContent(items, filters);
    const watermark = sec && sec.createModuleWatermark ? sec.createModuleWatermark(principal, "audit", "export") : "";
    const downloadContent = sec && sec.applyTextWatermark ? sec.applyTextWatermark(content, watermark, principal, "text/markdown;charset=utf-8") : content;
    const artifact = {
      type:"markdown",
      title:"审计报告",
      filename:filename(),
      mimeType:"text/markdown;charset=utf-8",
      sizeBytes:textSize(content),
      content,
      meta:{ kind:"audit-report", source:"audit.export" }
    };
    const record = createExportRecord(items, filters, artifact);
    const artifacts = Array.isArray(record.artifacts) ? record.artifacts : [artifact];
    if (window.HistoryApi && typeof window.HistoryApi.record === "function") {
      window.HistoryApi.record("audit.export", {
        schemaVersion:record.schemaVersion || "weishan.task.v1",
        taskId:record.taskId,
        module:"audit",
        action:"export",
        status:"done",
        createdAt:record.createdAt || nowIso(),
        startedAt:record.startedAt || "",
        finishedAt:record.finishedAt || "",
        inputSummary:summarize(filterSummary(filters), 240),
        outputSummary:summarize(record.outputSummary || "", 240),
        recordCount:items.length,
        filters,
        artifacts,
        actorUserId:principal.userId || "",
        actorName:principal.displayName || "",
        companyId:principal.companyId || "",
        planType:principal.planType || "",
        sourceModule:"audit",
        scope:"audit",
        result:"exported",
        reason:access.reason || "allowed",
        watermark:principal.planType === "enterprise" ? watermark : "",
        error:null
      });
    }
    const blob = new Blob([downloadContent], { type:artifact.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = artifact.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    renderList();
  }
  function optionHtml(items, selected){
    return items.map(item => `<option value="${esc(item)}" ${item === selected ? "selected" : ""}>${esc(item === "all" ? label("全部", "All") : item === "other" ? label("其他", "Other") : item)}</option>`).join("");
  }
  function renderRows(items){
    return items.map(item => `<div class="ws-card">
      <div class="ws-row">
        <b>${esc(item.type || label("历史记录", "History record"))}</b>
        ${item.status ? `<span class="status-pill ${esc(statusClass(item.status))}">${esc(item.status)}</span>` : ""}
        <span class="status-pill ${esc(statusClass(item.risk))}">${esc(label("风险", "Risk"))}: ${esc(riskLabel(item.risk))}</span>
        ${item.artifactCount ? `<span class="tag">${esc(label("产物", "Artifacts"))}: ${esc(item.artifactCount)}</span>` : ""}
      </div>
      <p class="ws-muted">${esc(localTime(item.time))} · ${esc(item.module)} · ${esc(item.action)}</p>
      <p><b>${esc(label("摘要", "Summary"))}</b> ${esc(shortText(item.title || item.inputSummary, 180))}</p>
      ${item.outputSummary ? `<p class="ws-muted">${esc(shortText(item.outputSummary, 220))}</p>` : ""}
      ${item.taskId ? `<p class="ws-muted">taskId: ${esc(item.taskId)}</p>` : ""}
    </div>`).join("") || `<div class='ws-card'>${esc(label("暂无审计记录。", "No audit records."))}</div>`;
  }
  function renderList(){
    const list = document.getElementById("auditList");
    if (!list) return;
    list.innerHTML = renderRows(applyFilters(auditRecords(), currentFilters()));
  }
  function mount(host){
    const sec = security();
    if (sec && sec.recordModuleViewOnce) sec.recordModuleViewOnce("audit");
    const notice = sec && sec.previewNotice ? sec.previewNotice("audit") : "";
    host.innerHTML=`<section class="ws-page"><div class="ws-card"><h2>${t("audit")}</h2><p class="ws-muted">${t("auditDesc")}</p><p class="ws-muted">${esc(notice)}</p><div class="ws-row"><input id="auditSearch" class="ws-input" placeholder="${esc(label("搜索类型、模块、动作、摘要或 taskId", "Search type, module, action, summary, or taskId"))}"><select id="auditModuleFilter" class="ws-select">${optionHtml(MODULE_FILTERS, "all")}</select><select id="auditStatusFilter" class="ws-select">${optionHtml(STATUS_FILTERS, "all")}</select><select id="auditActionFilter" class="ws-select">${optionHtml(ACTION_FILTERS, "all")}</select><button id="exportAudit" class="ws-btn">${esc(label("导出审计报告", "Export audit report"))}</button></div></div><div class="card-list" id="auditList">${renderRows(auditRecords())}</div></section>`;
    if (sec && sec.bindModuleCopyAudit) sec.bindModuleCopyAudit(host, "audit");
    ["auditSearch", "auditModuleFilter", "auditStatusFilter", "auditActionFilter"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener(id === "auditSearch" ? "input" : "change", renderList);
    });
    document.getElementById("exportAudit").addEventListener("click", exportAuditReport);
  }
  window.AuditPage = { mount };
})();
