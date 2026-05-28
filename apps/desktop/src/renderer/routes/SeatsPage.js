(function(){
  function t(key){ return window.I18n.t(key); }
  function esc(s){ return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function security(){ return window.WeishanEnterpriseSecurity || null; }
  function mount(host){ const sec=security(); if(sec && sec.recordModuleViewOnce) sec.recordModuleViewOnce("seats"); const sub=window.SubscriptionApi.current(); const used=window.TeamApi.activeMembers().length; const notice=sec && sec.previewNotice ? sec.previewNotice("seats") : ""; host.innerHTML=`<section class="ws-page"><div class="ws-card"><h2>${t("seats")}</h2><p class="ws-muted">${esc(notice)}</p><p>${t("seatsUsed")}：${used} / ${sub.member_limit}</p><p>${t("seatsDesc")}</p></div></section>`; if(sec && sec.bindModuleCopyAudit) sec.bindModuleCopyAudit(host, "seats"); }
  window.SeatsPage = { mount };
})();
