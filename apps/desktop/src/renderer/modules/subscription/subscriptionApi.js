(function(){
  function key(){ const a = window.AccountApi.current(); return a.loggedIn ? "subscription." + a.accountId : "subscription.local"; }
  function current(){ const a=window.AccountApi.current(); return window.WeishanStore.read(key(), { subscription_id:"LOCAL_FREE", owner_type:"user", owner_id:a.accountId || "local", plan_id:"FREE_LOCAL", plan_group:"free", status:"active", billing_cycle:"none", payment_status:"none", storage_quota_gb:0, member_limit:0, auto_renew:false }); }
  function setPlan(planId, group){
    const p = window.PlansData.get(planId);
    const a = window.AccountApi.current();
    const next = { subscription_id:window.WeishanStore.uuid("sub"), owner_type:p && p.plan_type === "enterprise" ? "organization" : "user", owner_id:a.accountId || "local", plan_id:planId, plan_group:group || (p && p.plan_type === "enterprise" ? "enterprise" : "pro"), status:"active", billing_cycle:"monthly", payment_status:"paid", storage_quota_gb:p ? p.storage_quota_gb : 0, member_limit:p ? p.member_limit : 0, start_at:window.WeishanStore.now(), expire_at:"", auto_renew:false };
    window.WeishanStore.write(key(), next);
    return next;
  }
  window.SubscriptionApi = { current, setPlan };
})();
