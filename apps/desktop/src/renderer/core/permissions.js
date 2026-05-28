(function(){
  function sub(){ return window.SubscriptionApi ? window.SubscriptionApi.current() : { plan_group:"free" }; }
  function aiMode(){ return window.WeishanConfig.planMode[sub().plan_group || "free"] || "A"; }
  function paidModules(){ return ["team","seats","reports","audit"]; }
  function canUse(id) {
    if (!paidModules().includes(id)) return true;
    return ["team","enterprise","institution"].includes(sub().plan_group) || sub().status === "active_enterprise";
  }
  function requirePaid(id) {
    if (canUse(id)) return { ok:true };
    return { ok:false, title:"付费后启用", message:"该功能属于团队或企业协作能力。升级后可使用团队与席位、审计日志、报告中心和团队协作。" };
  }
  function isLoggedIn(){ return !!(window.AccountApi && window.AccountApi.current().loggedIn); }
  window.WeishanPermissions = { aiMode, canUse, requirePaid, paidModules, isLoggedIn };
})();
