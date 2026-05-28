(function(){
  let downloadArtifacts = {};
  let copyRecords = {};
  function esc(s){ return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function t(key){ return window.I18n.t(key); }
  function formatLocalDateTime(value){
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString(undefined, {
      year:"numeric",
      month:"2-digit",
      day:"2-digit",
      hour:"2-digit",
      minute:"2-digit",
      second:"2-digit",
      hour12:false
    });
  }
  function recordTime(record){
    const payload = record && record.payload || {};
    return record && record.createdAt || payload.finishedAt || payload.createdAt || payload.startedAt || "";
  }
  function isEn(){ return window.I18n && window.I18n.getLang && window.I18n.getLang() === "en"; }
  function label(zh, en){ return isEn() ? en : zh; }
  function getHistoryPayload(record){ return record && record.payload && typeof record.payload === "object" ? record.payload : {}; }
  function safeJsonPreview(value){
    try { return JSON.stringify(value || {}, null, 2); } catch (_) { return String(value || ""); }
  }
  function shortText(value, maxLength){
    const text = (typeof value === "string" ? value : safeJsonPreview(value)).replace(/\s+/g, " ").trim();
    const max = Number(maxLength || 220);
    return text.length > max ? text.slice(0, max).trim() + "..." : text;
  }
  function getHistoryStatus(record){ return getHistoryPayload(record).status || ""; }
  function getHistoryModule(record){ return getHistoryPayload(record).module || ""; }
  function getHistoryAction(record){ return getHistoryPayload(record).action || ""; }
  function getHistoryTitle(record){
    const payload = getHistoryPayload(record);
    return payload.title || payload.inputSummary || payload.command || record && record.type || "";
  }
  function getHistoryInputSummary(record){
    const payload = getHistoryPayload(record);
    return payload.inputSummary || payload.command || "";
  }
  function getHistoryOutputSummary(record){
    const payload = getHistoryPayload(record);
    return payload.outputSummary || payload.resultSummary || payload.summary || payload.results || payload.process || "";
  }
  function getHistoryErrorSummary(record){
    const error = getHistoryPayload(record).error;
    if (!error) return "";
    return typeof error === "string" ? error : error.message || safeJsonPreview(error);
  }
  function getHistoryArtifacts(record){
    const artifacts = getHistoryPayload(record).artifacts;
    return Array.isArray(artifacts) ? artifacts.filter(Boolean) : [];
  }
  function formatBytes(value){
    const size = Number(value || 0);
    if (!size) return "";
    if (size < 1024) return size + " B";
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
    return (size / 1024 / 1024).toFixed(1) + " MB";
  }
  function statusClass(status){
    if (status === "done") return "done";
    if (status === "failed") return "error";
    if (status === "running") return "running";
    if (status === "queued") return "";
    return "";
  }
  function metaItem(labelText, value){
    return value ? `<span class="status-pill ${esc(statusClass(value))}">${esc(labelText)}: ${esc(value)}</span>` : "";
  }
  function summaryBlock(title, value){
    const text = shortText(value, 260);
    return text ? `<div class="history-line"><b>${esc(title)}</b><p class="ws-muted">${esc(text)}</p></div>` : "";
  }
  function taskMeta(record){
    const payload = getHistoryPayload(record);
    const rows = [];
    if (payload.taskId) rows.push(`<span class="tag">${esc(label("任务", "Task"))}: ${esc(payload.taskId)}</span>`);
    if (payload.schemaVersion) rows.push(`<span class="tag">${esc(payload.schemaVersion)}</span>`);
    return rows.length ? `<div class="ws-row">${rows.join("")}</div>` : "";
  }
  function artifactBlock(record, recordIndex){
    const artifacts = getHistoryArtifacts(record);
    if (!artifacts.length) return "";
    const rows = artifacts.map((artifact, artifactIndex) => {
      const key = "artifact-" + recordIndex + "-" + artifactIndex;
      const canDownload = typeof artifact.content === "string" && artifact.content.length > 0;
      if (canDownload) downloadArtifacts[key] = { artifact, record };
      return `<div class="history-line">
        <b>${esc(artifact.title || label("产物", "Artifact"))}</b>
        <p class="ws-muted">${esc(artifact.type || "file")}${artifact.sizeBytes ? " · " + esc(formatBytes(artifact.sizeBytes)) : ""}${artifact.filename ? " · " + esc(artifact.filename) : ""}</p>
        ${canDownload ? `<button type="button" class="small green history-artifact-download" data-artifact="${esc(key)}">${esc(label("下载结果", "Download result"))}</button>` : ""}
      </div>`;
    });
    return rows.join("");
  }
  function matchesHistoryQuery(record, query){
    const q = String(query || "").trim().toLowerCase();
    if (!q) return true;
    const payload = getHistoryPayload(record);
    const artifacts = getHistoryArtifacts(record).map(a => [a.title, a.type, a.filename, a.artifactId].join(" ")).join(" ");
    const parts = [
      record && record.type,
      payload.inputSummary,
      payload.outputSummary,
      payload.command,
      payload.module,
      payload.action,
      payload.taskId,
      artifacts,
      safeJsonPreview(record)
    ];
    return parts.join(" ").toLowerCase().includes(q);
  }
  function detailLabel(open){ return open ? label("收起详情", "Collapse details") : label("查看详情", "View details"); }
  function render(items){
    downloadArtifacts = {};
    copyRecords = {};
    return items.map((h, idx)=>{
      const payload = getHistoryPayload(h);
      const status = getHistoryStatus(h);
      const detailId = "historyDetail-" + idx;
      copyRecords[String(idx)] = h;
      return `<div class="ws-card" data-history-index="${esc(idx)}">
        <div class="ws-row">
          <b>${esc(h.type || label("历史记录", "History record"))}</b>
          ${status ? `<span class="status-pill ${esc(statusClass(status))}">${esc(status)}</span>` : ""}
          ${metaItem(label("模块", "Module"), getHistoryModule(h))}
          ${metaItem(label("动作", "Action"), getHistoryAction(h))}
        </div>
        <p class="ws-muted">${esc(formatLocalDateTime(recordTime(h)))}</p>
        ${summaryBlock(label("标题", "Title"), getHistoryTitle(h))}
        ${summaryBlock(label("输入摘要", "Input summary"), getHistoryInputSummary(h))}
        ${summaryBlock(label("输出摘要", "Output summary"), getHistoryOutputSummary(h))}
        ${summaryBlock(label("错误", "Error"), getHistoryErrorSummary(h))}
        ${taskMeta(h)}
        ${artifactBlock(h, idx)}
        <button type="button" class="small gray history-detail-toggle" data-detail="${esc(detailId)}">${esc(detailLabel(false))}</button>
        <pre id="${esc(detailId)}" class="history-detail-json" style="display:none">${esc(safeJsonPreview(payload))}</pre>
      </div>`;
    }).join("") || `<div class='ws-card'>${t("noHistory")}</div>`;
  }
  function listForQuery(query){ return window.HistoryApi.list().filter(item => matchesHistoryQuery(item, query)); }
  function security(){
    return window.WeishanEnterpriseSecurity || null;
  }
  function auditRecord(type, data){
    if (window.HistoryApi && typeof window.HistoryApi.record === "function") {
      window.HistoryApi.record(type, data);
    }
  }
  function alertMessage(text){
    if (typeof window.alert === "function") window.alert(text);
  }
  function confirmMessage(text){
    if (typeof window.confirm !== "function") return false;
    return window.confirm(text);
  }
  function secureDownloadArtifact(record, artifact){
    const sec = security();
    const payload = getHistoryPayload(record);
    const principal = sec && sec.getCurrentSecurityPrincipal ? sec.getCurrentSecurityPrincipal() : { userId:"local-user", displayName:"Local User", companyId:"local-company", companyName:"Local Company", role:"owner", planType:"personal" };
    const scope = sec && sec.classifyDataScope ? sec.classifyDataScope(payload, artifact) : (payload.module || "unknown");
    const decision = sec && sec.canDownload ? sec.canDownload(principal, scope) : { allowed:true, requiresApproval:false, reason:"allowed" };
    const baseAudit = {
      principal,
      payload,
      artifact,
      scope,
      recordType:record && record.type || "",
      sourceType:record && record.type || ""
    };
    if (!decision.allowed && !decision.requiresApproval) {
      const audit = sec && sec.createAuditPayload ? sec.createAuditPayload(Object.assign({}, baseAudit, { action:"download", status:"failed", result:"denied", reason:decision.reason || "denied" })) : {};
      auditRecord("audit.downloadDenied", audit);
      alertMessage(label("下载被拒绝。", "Download denied."));
      return;
    }
    if (decision.requiresApproval) {
      const approved = confirmMessage(label("该下载需要企业授权，是否以本地模拟授权继续？", "This download requires enterprise approval. Continue with local simulated approval?"));
      if (!approved) {
        const rejected = sec && sec.createAuditPayload ? sec.createAuditPayload(Object.assign({}, baseAudit, { action:"download", status:"failed", result:"rejected", reason:decision.reason || "rejected" })) : {};
        auditRecord("audit.downloadRejected", rejected);
        return;
      }
      const approvedAudit = sec && sec.createAuditPayload ? sec.createAuditPayload(Object.assign({}, baseAudit, { action:"download", status:"done", result:"approved", reason:decision.reason || "approved" })) : {};
      auditRecord("audit.downloadApproved", approvedAudit);
    }
    const watermark = sec && sec.createWatermark ? sec.createWatermark(principal, "download", scope) : "";
    const content = sec && sec.applyTextWatermark ? sec.applyTextWatermark(artifact.content, watermark, principal, artifact.mimeType) : artifact.content;
    const audit = sec && sec.createAuditPayload ? sec.createAuditPayload(Object.assign({}, baseAudit, { action:"download", status:"done", result:"downloaded", reason:decision.reason || "allowed", watermark:principal.planType === "enterprise" ? watermark : "" })) : {};
    auditRecord("audit.download", audit);
    const blob = new Blob([content], { type:artifact.mimeType || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = artifact.filename || "weishan-task-output.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
  function recordCopyEvent(record){
    const sec = security();
    const payload = getHistoryPayload(record);
    const principal = sec && sec.getCurrentSecurityPrincipal ? sec.getCurrentSecurityPrincipal() : { userId:"local-user", displayName:"Local User", companyId:"local-company", companyName:"Local Company", role:"owner", planType:"personal" };
    const scope = sec && sec.classifyDataScope ? sec.classifyDataScope(payload, null) : (payload.module || "unknown");
    const audit = sec && sec.createAuditPayload ? sec.createAuditPayload({
      principal,
      payload,
      artifact:{ artifactId:"", filename:"" },
      scope,
      action:"copy",
      status:"done",
      result:"copied",
      reason:"history selection copied",
      recordType:record && record.type || "",
      sourceType:record && record.type || ""
    }) : {};
    auditRecord("audit.copy", audit);
  }
  function recordFromCopyEvent(e){
    const target = e.target && e.target.closest ? e.target.closest("[data-history-index]") : null;
    if (target) return copyRecords[target.getAttribute("data-history-index")];
    const selection = window.getSelection && window.getSelection();
    const node = selection && selection.anchorNode;
    const element = node && (node.nodeType === 1 ? node : node.parentElement);
    const card = element && element.closest ? element.closest("[data-history-index]") : null;
    return card ? copyRecords[card.getAttribute("data-history-index")] : null;
  }
  function bindDetails(host){
    host.addEventListener("click", e=>{
      const btn = e.target && e.target.closest && e.target.closest(".history-detail-toggle");
      if (!btn) return;
      const detail = document.getElementById(btn.getAttribute("data-detail"));
      if (!detail) return;
      const open = detail.style.display === "none";
      detail.style.display = open ? "" : "none";
      btn.textContent = detailLabel(open);
    });
    host.addEventListener("click", e=>{
      const btn = e.target && e.target.closest && e.target.closest(".history-artifact-download");
      if (!btn) return;
      const entry = downloadArtifacts[btn.getAttribute("data-artifact")];
      if (!entry || !entry.artifact || typeof entry.artifact.content !== "string") return;
      secureDownloadArtifact(entry.record, entry.artifact);
    });
    host.addEventListener("copy", e=>{
      const record = recordFromCopyEvent(e);
      if (record) recordCopyEvent(record);
    });
  }
  function mount(host){
    host.innerHTML=`<section class="ws-page"><div class="ws-card"><h2>${t("history")}</h2><p class="ws-muted">${t("historyDesc")}</p><input id="historySearch" class="ws-input" placeholder="${t("historySearchPlaceholder")}"></div><div class="card-list" id="historyList">${render(window.HistoryApi.list())}</div></section>`;
    const list = document.getElementById("historyList");
    bindDetails(list);
    document.getElementById("historySearch").addEventListener("input",e=>{ list.innerHTML=render(listForQuery(e.target.value)); });
  }
  window.HistoryPage = { mount };
})();
