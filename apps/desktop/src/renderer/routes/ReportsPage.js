(function(){
  function t(key){ return window.I18n.t(key); }
  function esc(s){ return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function security(){ return window.WeishanEnterpriseSecurity || null; }
  function mount(host){ const sec=security(); if(sec && sec.recordModuleViewOnce) sec.recordModuleViewOnce("reports"); const items=window.ReportApi.list(); const notice=sec && sec.previewNotice ? sec.previewNotice("reports") : ""; host.innerHTML=`<section class="ws-page"><div class="ws-card"><h2>${t("reports")}</h2><p>${t("reportsDesc")}</p><p class="ws-muted">${esc(notice)}</p><button id="genReport" class="ws-btn">${t("generateReport")}</button></div><div class="card-list">${items.map(r=>`<div class='ws-card'><b>${esc(r.type)}</b><p>${esc(r.createdAt)}</p></div>`).join("")}</div></section>`; if(sec && sec.bindModuleCopyAudit) sec.bindModuleCopyAudit(host, "reports"); document.getElementById("genReport").addEventListener("click",()=>{ const r=window.ReportApi.generate("execution"); if(!r.ok) alert(r.error); window.WeishanRouter.refresh(); }); }
  window.ReportsPage = { mount };
})();
