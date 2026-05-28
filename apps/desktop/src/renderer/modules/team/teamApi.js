(function(){
  const KEY = "team.members";
  function members(){ return window.WeishanStore.read(KEY, []); }
  function activeMembers(){ return members().filter(m => m.status === "active"); }
  function invite(email, role){
    const gate = window.WeishanPermissions.requirePaid("team");
    if (!gate.ok) return { ok:false, error:gate.message };
    const sub = window.SubscriptionApi.current();
    if (sub.member_limit && activeMembers().length >= sub.member_limit) return { ok:false, error:"当前企业套餐最多支持 " + sub.member_limit + " 名成员。如需继续邀请，请升级企业套餐。" };
    const item = { id:window.WeishanStore.uuid("member"), email, role:role||"member", status:"active", createdAt:window.WeishanStore.now() };
    window.WeishanStore.write(KEY, [item].concat(members()));
    window.AuditApi.record("team.invite", { email, role:item.role });
    return { ok:true, member:item };
  }
  window.TeamApi = { members, activeMembers, invite };
})();
