(function(){
  let lastDiagnostics = null;

  function t(key){ return window.I18n.t(key); }
  function esc(s){ return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function label(value){
    if (value === "AI Key") return t("securityAiKey");
    if (value === "账号隔离") return t("securityAccountIsolated");
    if (value === "未登录锁定") return t("securityLoginLocked");
    if (value === "登录后按账号保存。") return t("securitySaveAfterLogin");
    return value;
  }
  function nowIso(){ return new Date().toISOString(); }
  function localTime(value){
    const date = value ? new Date(value) : new Date();
    const valid = Number.isNaN(date.getTime()) ? new Date() : date;
    const pad = (n) => String(n).padStart(2, "0");
    return valid.getFullYear() + "/" + pad(valid.getMonth() + 1) + "/" + pad(valid.getDate()) + " " + pad(valid.getHours()) + ":" + pad(valid.getMinutes()) + ":" + pad(valid.getSeconds());
  }
  function taskProtocol(){ return window.WeishanTaskProtocol || null; }
  function createId(prefix){
    const tp = taskProtocol();
    return tp && tp.createTaskId ? tp.createTaskId(prefix || "diagnostics") : String(prefix || "diagnostics") + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }
  function summarize(text, maxLength){
    const tp = taskProtocol();
    if (tp && tp.summarizeTextSafe) return tp.summarizeTextSafe(text, maxLength || 180);
    const value = String(text || "").replace(/\s+/g, " ").trim();
    const max = Number(maxLength || 180);
    return value.length > max ? value.slice(0, max).trim() + "..." : value;
  }
  function statusLabel(status){
    if (status === "pass") return "通过";
    if (status === "warn") return "警告";
    return "失败";
  }
  function addCheck(items, module, status, detail, suggestion){
    items.push({ module, status, detail, suggestion:suggestion || "" });
  }
  function maskSecretSnippet(line){
    return String(line || "").trim().slice(0, 220)
      .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, (value) => "sk-****" + value.slice(-4))
      .replace(/\b(Bearer\s+)[A-Za-z0-9._~+/=-]{8,}/gi, "$1****")
      .replace(/(["'])[A-Za-z0-9._~+/=-]{12,}\1/g, (value) => value[0] + "****" + value.slice(-5))
      .replace(/BEGIN (?:RSA )?PRIVATE KEY/g, "BEGIN **** PRIVATE KEY");
  }
  function scanSourceTextForSecrets(path, text){
    const rules = [
      { name:"openai-like-key", severity:"fail", pattern:/\bsk-[A-Za-z0-9_-]{16,}\b/g },
      { name:"bearer-token", severity:"fail", pattern:/\b(?:Authorization\s*:\s*)?Bearer\s+[A-Za-z0-9._~+/=-]{20,}/gi },
      { name:"api-key-assignment", severity:"warn", pattern:/\b(?:apiKey|api_key|API_KEY)\b\s*[:=]\s*["'][^"']{8,}["']/g },
      { name:"password-assignment", severity:"warn", pattern:/\b(?:password|PASSWORD)\b\s*[:=]\s*["'][^"']{6,}["']/g },
      { name:"token-assignment", severity:"warn", pattern:/\b(?:token|ACCESS_TOKEN)\b\s*[:=]\s*["'][^"']{8,}["']/g },
      { name:"secret-assignment", severity:"warn", pattern:/\b(?:secret|SECRET_KEY)\b\s*[:=]\s*["'][^"']{8,}["']/g },
      { name:"private-key-block", severity:"fail", pattern:/BEGIN (?:RSA )?PRIVATE KEY/g }
    ];
    const findings = [];
    String(text || "").split(/\r?\n/).forEach((line, index) => {
      const isRedacted = /\[redacted\]|redacted|placeholder|example|dummy|mock|脱敏|示例/i.test(line);
      rules.forEach((rule) => {
        rule.pattern.lastIndex = 0;
        if (!rule.pattern.test(line)) return;
        if (isRedacted && rule.severity === "warn") return;
        findings.push({
          path,
          line:index + 1,
          rule:rule.name,
          severity:isRedacted && rule.severity === "fail" ? "warn" : rule.severity,
          maskedSnippet:maskSecretSnippet(line)
        });
      });
    });
    return findings;
  }
  async function runSecretScanCheck(){
    const files = [
      "../../../package.json",
      "../../../scripts/secret-scan.js",
      "../../../scripts/healthcheck.js",
      "./renderer/core/api.js",
      "./renderer/core/enterpriseSecurity.js",
      "./renderer/core/taskProtocol.js",
      "./renderer/modules/mail/mailApi.js",
      "./renderer/routes/HistoryPage.js",
      "./renderer/routes/SecurityPage.js",
      "./renderer/routes/SettingsPage.js"
    ];
    const findings = [];
    let readable = 0;
    for (const file of files) {
      try {
        const res = await fetch(file, { cache:"no-store" });
        if (!res.ok) continue;
        const text = await res.text();
        readable += 1;
        findings.push(...scanSourceTextForSecrets(file, text));
      } catch (_) {}
    }
    if (!readable) {
      return {
        status:"warn",
        detail:"应用内无法读取源码文件；请在本地运行 npm run secrets:scan。",
        suggestion:"提交前运行 npm run secrets:scan。",
        warnCount:0,
        failCount:0,
        findingCount:0,
        findings:[]
      };
    }
    const failCount = findings.filter((item) => item.severity === "fail").length;
    const warnCount = findings.filter((item) => item.severity === "warn").length;
    return {
      status:failCount ? "fail" : (warnCount ? "warn" : "pass"),
      detail:"已轻量扫描 " + readable + " 个本地源码入口，发现失败 " + failCount + "，警告 " + warnCount + "。",
      suggestion:failCount ? "删除明文密钥，改用 Secure Storage / 环境变量，并重新生成已泄露密钥。" : "提交前继续运行 npm run secrets:scan。",
      warnCount,
      failCount,
      findingCount:findings.length,
      findings:findings.slice(0, 8)
    };
  }
  function localStorageReadable(key){
    try {
      if (!window.localStorage) return false;
      window.localStorage.getItem(key);
      return true;
    } catch (_) {
      return false;
    }
  }
  function historyReadable(){
    try {
      return Boolean(window.HistoryApi && typeof window.HistoryApi.list === "function" && Array.isArray(window.HistoryApi.list()));
    } catch (_) {
      return false;
    }
  }
  async function runChecks(){
    const items = [];
    const modules = [
      ["Home", "HomePage"],
      ["Mail", "MailPage"],
      ["Crawler", "CrawlerPage"],
      ["SoftwareFactory", "BuilderPage"],
      ["Projects", "ProjectsPage"],
      ["Memory", "MemoryPage"],
      ["History", "HistoryPage"],
      ["Audit", "AuditPage"]
    ];
    modules.forEach((item) => {
      addCheck(items, item[0], window[item[1]] ? "pass" : "fail", window[item[1]] ? "页面模块已加载。" : "页面模块未加载。", "确认 index.html 中已加载对应 route 文件。");
    });
    addCheck(items, "EnterpriseSecurity", window.WeishanEnterpriseSecurity ? "pass" : "fail", window.WeishanEnterpriseSecurity ? "企业安全策略 helper 可用。" : "企业安全策略 helper 不可用。", "确认 enterpriseSecurity.js 已加载。");
    addCheck(items, "CollaborationInvite", window.WeishanEnterpriseSecurity && window.WeishanEnterpriseSecurity.canInviteOrganization ? "pass" : "fail", window.WeishanEnterpriseSecurity && window.WeishanEnterpriseSecurity.canInviteOrganization ? "组织邀请策略可用。" : "组织邀请策略缺失。", "确认协作邀请审计 helper 已加载。");
    addCheck(items, "TaskProtocol", window.WeishanTaskProtocol && window.WeishanTaskProtocol.createTaskRecord ? "pass" : "fail", window.WeishanTaskProtocol ? "task protocol helper 可用。" : "task protocol helper 缺失。", "确认 taskProtocol.js 已加载。");
    addCheck(items, "localStorage", localStorageReadable("history.items") ? "pass" : "fail", localStorageReadable("history.items") ? "localStorage 可读取。" : "localStorage 不可读取。", "检查浏览器存储权限。");
    addCheck(items, "history.items", historyReadable() ? "pass" : "fail", historyReadable() ? "HistoryApi.list 可读取。" : "HistoryApi.list 不可读取。", "确认 HistoryApi 已加载且数据可解析。");
    addCheck(items, "memory", localStorageReadable("weishan:memory:v1") ? "pass" : "warn", localStorageReadable("weishan:memory:v1") ? "记忆库本地 key 可读取。" : "记忆库本地 key 暂无或不可读取。", "如需验证记忆数据，可先新增一条记忆。");
    addCheck(items, "projects", localStorageReadable("weishan:projects:v1") ? "pass" : "warn", localStorageReadable("weishan:projects:v1") ? "项目任务本地 key 可读取。" : "项目任务本地 key 暂无或不可读取。", "如需验证项目数据，可先新增一条项目任务。");
    addCheck(items, "artifact", window.HistoryPage ? "pass" : "fail", window.HistoryPage ? "HistoryPage artifact 下载入口可用。" : "HistoryPage 未加载，artifact 下载不可确认。", "确认 HistoryPage 已加载。");
    addCheck(items, "paidModuleGuard", window.WeishanEnterpriseSecurity && window.WeishanEnterpriseSecurity.canAccessModule ? "pass" : "fail", window.WeishanEnterpriseSecurity && window.WeishanEnterpriseSecurity.canAccessModule ? "付费模块访问策略 helper 可用。" : "付费模块访问策略缺失。", "确认 enterpriseSecurity.js 中 paid module guard 已加载。");
    const secretScan = await runSecretScanCheck();
    addCheck(items, "Secret Scan", secretScan.status, secretScan.detail, secretScan.suggestion);
    items[items.length - 1].secretScan = secretScan;
    addCheck(items, "futureChecks", "warn", "PocketBase / Wasabi / Playwright / Gitleaks 为后续检测项，本轮未接入。", "后续可接入真实服务探测和 E2E。");
    return items;
  }
  function counts(items){
    return items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, { pass:0, warn:0, fail:0 });
  }
  function overall(items){
    if (items.some((item) => item.status === "fail")) return "failed";
    if (items.some((item) => item.status === "warn")) return "warning";
    return "done";
  }
  function overallText(status){
    if (status === "done") return "通过";
    if (status === "warning") return "警告";
    return "失败";
  }
  function reportMarkdown(data){
    const items = data.items || [];
    const c = counts(items);
    const secretItem = items.find((item) => item.secretScan);
    const secretScan = secretItem && secretItem.secretScan || { status:"warn", findingCount:0, warnCount:0, failCount:0, findings:[] };
    return [
      "# weishan 自检报告",
      "",
      "检测时间：" + localTime(data.finishedAt || data.createdAt),
      "软件版本：" + (data.version || "weishan local"),
      "运行环境：" + (data.runtime || "desktop renderer"),
      "总体状态：" + overallText(data.status),
      "",
      "## 检测结果",
      "",
      "| 模块 | 状态 | 说明 | 修复建议 |",
      "| --- | --- | --- | --- |",
      ...items.map((item) => "| " + item.module + " | " + statusLabel(item.status) + " | " + item.detail + " | " + (item.suggestion || "-") + " |"),
      "",
      "## 密钥扫描",
      "",
      "- 状态：" + statusLabel(secretScan.status),
      "- 发现数量：" + (secretScan.findingCount || 0),
      "- 警告：" + (secretScan.warnCount || 0),
      "- 失败：" + (secretScan.failCount || 0),
      "- 修复建议：删除明文密钥，改用 Secure Storage / 环境变量，重新生成已泄露密钥，提交前运行 npm run secrets:scan。",
      "",
      "### 脱敏发现",
      "",
      ...(secretScan.findings && secretScan.findings.length ? secretScan.findings.map((item) => "- " + item.severity + " · " + item.path + ":" + item.line + " · " + item.rule + " · " + item.maskedSnippet) : ["- 无"]),
      "",
      "## 已覆盖",
      "",
      "- task protocol",
      "- history",
      "- artifact",
      "- enterprise security",
      "- collaboration invite audit",
      "- secret scan",
      "- localStorage",
      "",
      "## 未覆盖",
      "",
      "- Playwright E2E",
      "- PocketBase 真实连接",
      "- Wasabi 真实连接",
      "- Gitleaks 深度密钥扫描",
      "- GitHub Actions",
      "",
      "## 修复建议",
      "",
      c.fail ? "- 优先修复失败项，再重新运行自检。" : "- 当前没有阻断项，建议在进入下个模块前保留这份报告。",
      c.warn ? "- 警告项多为后续能力或本地数据未初始化，可按需补齐。" : "- 无警告项。"
    ].join("\n");
  }
  function filename(dateLike){
    const date = dateLike ? new Date(dateLike) : new Date();
    const valid = Number.isNaN(date.getTime()) ? new Date() : date;
    const pad = (n) => String(n).padStart(2, "0");
    return "weishan-selfcheck-report-" + valid.getFullYear() + pad(valid.getMonth() + 1) + pad(valid.getDate()) + "-" + pad(valid.getHours()) + pad(valid.getMinutes()) + pad(valid.getSeconds()) + ".md";
  }
  function createArtifact(content, taskId, createdAt){
    const blob = new Blob([content], { type:"text/markdown;charset=utf-8" });
    return {
      artifactId:createId("artifact"),
      taskId,
      type:"markdown",
      title:"weishan 自检报告",
      filename:filename(createdAt),
      mimeType:"text/markdown;charset=utf-8",
      sizeBytes:blob.size,
      content,
      createdAt,
      meta:{ kind:"diagnostics-selfcheck", source:"diagnostics.selfCheck" }
    };
  }
  function downloadArtifact(artifact){
    if (!artifact || typeof artifact.content !== "string") return;
    const blob = new Blob([artifact.content], { type:artifact.mimeType || "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = artifact.filename || "weishan-selfcheck-report.md";
    a.click();
    URL.revokeObjectURL(url);
  }
  function recordDiagnostics(data){
    if (!window.HistoryApi || typeof window.HistoryApi.record !== "function") return null;
    const c = counts(data.items || []);
    return window.HistoryApi.record("diagnostics.selfCheck", {
      schemaVersion:"weishan.task.v1",
      taskId:data.taskId,
      module:"diagnostics",
      action:"selfCheck",
      status:data.status === "failed" ? "failed" : "done",
      createdAt:data.createdAt,
      startedAt:data.startedAt,
      finishedAt:data.finishedAt,
      inputSummary:"本地自检中心一键检查",
      outputSummary:"自检完成：" + overallText(data.status) + "，通过 " + c.pass + "，警告 " + c.warn + "，失败 " + c.fail + "。",
      checkCount:(data.items || []).length,
      passCount:c.pass || 0,
      warnCount:c.warn || 0,
      failCount:c.fail || 0,
      artifacts:data.artifacts || []
    });
  }
  async function createDiagnosticsRun(){
    const createdAt = nowIso();
    const taskId = createId("diagnostics");
    const startedAt = nowIso();
    const items = await runChecks();
    const finishedAt = nowIso();
    const status = overall(items);
    const data = {
      taskId,
      version:"weishan local",
      runtime:"desktop renderer",
      status,
      createdAt,
      startedAt,
      finishedAt,
      items,
      artifacts:[]
    };
    const content = reportMarkdown(data);
    data.artifacts = [createArtifact(content, taskId, finishedAt)];
    recordDiagnostics(data);
    lastDiagnostics = data;
    return data;
  }
  function renderDiagnostics(data){
    if (!data) return `<div class="ws-card"><p class="ws-muted">尚未运行自检。</p></div>`;
    const c = counts(data.items || []);
    return `<div class="ws-card">
      <h3>自检结果 · ${esc(overallText(data.status))}</h3>
      <p class="ws-muted">检测时间：${esc(localTime(data.finishedAt))} · 通过 ${esc(c.pass)} · 警告 ${esc(c.warn)} · 失败 ${esc(c.fail)}</p>
      <div class="card-list">${(data.items || []).map((item) => `<div class="ws-card"><b>${esc(item.module)}</b><p>${esc(statusLabel(item.status))} · ${esc(item.detail)}</p>${item.suggestion ? `<p class="ws-muted">${esc(item.suggestion)}</p>` : ""}</div>`).join("")}</div>
    </div>`;
  }
  function renderSecurityChecks(){
    const checks=window.SecurityApi.checks();
    return checks.map(c=>`<div class="ws-card"><h3>${label(c.name)}</h3><b>${label(c.status)}</b><p>${label(c.detail)}</p></div>`).join("");
  }
  function mount(host){
    host.innerHTML=`<section class="ws-page">
      <div class="ws-card">
        <h2>${t("security")}</h2>
        <p class="ws-muted">${t("securityDesc")}</p>
      </div>
      <div class="ws-card">
        <h3>系统诊断 / 自检中心</h3>
        <p class="ws-muted">一键运行本地检查，生成 Markdown 自检报告，并写入历史记录。</p>
        <div class="ws-row">
          <button id="runSelfCheck" type="button" class="ws-btn">运行自检</button>
          <button id="downloadSelfCheck" type="button" class="ws-btn gray">导出自检报告</button>
        </div>
        <p class="ws-muted">PocketBase / Wasabi / Playwright / Gitleaks 为后续检测项，本轮未接入。</p>
      </div>
      <div id="selfCheckResult">${renderDiagnostics(lastDiagnostics)}</div>
      <div class="card-list">${renderSecurityChecks()}</div>
    </section>`;
    document.getElementById("runSelfCheck").addEventListener("click", async () => {
      document.getElementById("selfCheckResult").innerHTML = `<div class="ws-card"><p class="ws-muted">正在运行自检...</p></div>`;
      const data = await createDiagnosticsRun();
      document.getElementById("selfCheckResult").innerHTML = renderDiagnostics(data);
    });
    document.getElementById("downloadSelfCheck").addEventListener("click", async () => {
      const data = lastDiagnostics || await createDiagnosticsRun();
      document.getElementById("selfCheckResult").innerHTML = renderDiagnostics(data);
      downloadArtifact(data.artifacts && data.artifacts[0]);
    });
  }
  window.SecurityPage = { mount };
})();
