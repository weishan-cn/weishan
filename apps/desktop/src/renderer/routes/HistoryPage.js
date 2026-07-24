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
  function userStatus(status){
    if (status === "done") return label("已完成", "Completed");
    if (status === "failed") return label("未完成", "Not completed");
    if (status === "running") return label("正在处理", "Working");
    return label("正在准备", "Preparing");
  }
  function resultType(record){
    const payload = getHistoryPayload(record);
    const text = [payload.title, payload.inputSummary, payload.command, payload.module, record && record.type].join(" ");
    if (/视频|video/i.test(text)) return label("视频方案", "Video plan");
    if (/合同|协议|contract/i.test(text)) return label("文档草稿", "Document draft");
    if (/旅行|行程|机票|酒店|travel|flight|hotel/i.test(text)) return label("旅行计划", "Travel plan");
    if (/采购|商品|commerce|shopping/i.test(text)) return label("采购建议", "Purchase advice");
    return label("文字结果", "Written result");
  }
  function metaItem(labelText, value){
    return value ? `<span class="status-pill ${esc(statusClass(value))}">${esc(labelText)}: ${esc(value)}</span>` : "";
  }
  function summaryBlock(title, value){
    const text = shortText(value, 260);
    return text ? `<div class="history-line"><b>${esc(title)}</b><p class="ws-muted">${esc(text)}</p></div>` : "";
  }
  function developerInfo(record, detailId){
    const payload = getHistoryPayload(record);
    const rows = [];
    [["taskId", payload.taskId], ["schemaVersion", payload.schemaVersion], ["module", payload.module], ["action", payload.action], ["dispatch", payload.route], ["artifact", getHistoryArtifacts(record).map((item) => item.artifactId).filter(Boolean).join(", ")]].forEach((row) => {
      if (row[1]) rows.push(`<div><dt>${esc(row[0])}</dt><dd>${esc(row[1])}</dd></div>`);
    });
    return rows.length ? `<details class="history-more-info"><summary>${esc(label("更多", "More"))}</summary><details class="history-technical-info"><summary>${esc(label("技术详情", "Technical details"))}</summary><details id="${esc(detailId)}" class="history-developer-info"><summary>${esc(label("开发者信息", "Developer information"))}</summary><dl>${rows.join("")}</dl></details></details></details>` : "";
  }
  function downloadFileName(record, artifact){
    const payload = getHistoryPayload(record);
    const text = [payload.title, payload.inputSummary, payload.command, artifact && artifact.title].filter(Boolean).join(" ");
    const safe = String(text || label("Weishan 结果", "Weishan result")).replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim().slice(0, 56);
    const suffix = /视频|video/i.test(text) ? label("视频方案", "video plan") : /旅行|行程|机票|酒店|travel|flight|hotel/i.test(text) ? label("旅行计划", "travel plan") : /采购|商品|MacBook|commerce|shopping/i.test(text) ? label("采购建议", "purchase advice") : /合同|协议|contract/i.test(text) ? label("合同草稿", "contract draft") : label("结果", "result");
    const extension = /\.([a-z0-9]{1,8})$/i.exec(String(artifact && artifact.filename || ""));
    return (safe || suffix) + (safe && safe !== suffix ? " " + suffix : "") + "." + (extension ? extension[1] : "md");
  }
  function downloadLabel(record, artifact){
    const text = [getHistoryTitle(record), artifact && artifact.title, artifact && artifact.type].join(" ");
    if (/合同|协议|document|docx|pdf/i.test(text)) return label("导出文档", "Export document");
    if (/视频|video/i.test(text)) return label("下载方案", "Download plan");
    return label("保存到电脑", "Save to computer");
  }
  function artifactBlock(record, recordIndex){
    const artifacts = getHistoryArtifacts(record);
    if (!artifacts.length) return "";
    const rows = artifacts.map((artifact, artifactIndex) => {
      const key = "artifact-" + recordIndex + "-" + artifactIndex;
      const canDownload = typeof artifact.content === "string" && artifact.content.length > 0;
      if (canDownload) downloadArtifacts[key] = { artifact, record };
      return `<div class="history-line">
        <b>${esc(artifact.title || resultType(record))}</b>
        <p class="ws-muted">${esc(resultType(record))}${artifact.sizeBytes ? " · " + esc(formatBytes(artifact.sizeBytes)) : ""}</p>
        ${canDownload ? `<button type="button" class="small green history-artifact-download" data-artifact="${esc(key)}">${esc(downloadLabel(record, artifact))}</button>` : ""}
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
        <div class="ws-row"><b>${esc(getHistoryTitle(h) || label("历史记录", "History record"))}</b>${status ? `<span class="status-pill ${esc(statusClass(status))}">${esc(userStatus(status))}</span>` : ""}</div>
        <p class="ws-muted">${esc(formatLocalDateTime(recordTime(h)))}</p>
        ${summaryBlock(label("你的需求", "Your request"), getHistoryInputSummary(h))}
        ${summaryBlock(label("生成结果", "Result"), getHistoryOutputSummary(h))}
        ${summaryBlock(label("结果类型", "Result type"), resultType(h))}
        ${summaryBlock(label("提示", "Note"), getHistoryErrorSummary(h))}
        ${artifactBlock(h, idx)}
        <button type="button" class="small gray history-detail-toggle" data-detail="${esc(detailId)}">${esc(detailLabel(false))}</button>
        <div id="${esc(detailId)}" class="history-detail-json" style="display:none">${summaryBlock(label("你的需求", "Your request"), getHistoryInputSummary(h))}${summaryBlock(label("生成结果", "Result"), getHistoryOutputSummary(h))}${developerInfo(h, detailId + "Developer")}</div>
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
    a.download = downloadFileName(record, artifact);
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
