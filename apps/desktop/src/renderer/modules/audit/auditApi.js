(function(){
  const KEY = "audit.items";
  function list(){ return window.WeishanStore.read(KEY, []); }
  function record(action, payload){ const a = window.AccountApi ? window.AccountApi.current() : { accountId:"local" }; const item={ id:window.WeishanStore.uuid("audit"), action, payload:payload||{}, user_id:a.accountId, createdAt:window.WeishanStore.now() }; window.WeishanStore.write(KEY, [item].concat(list()).slice(0, 2000)); return item; }
  function exportJson(){ return JSON.stringify(list(), null, 2); }
  window.AuditApi = { list, record, exportJson };
})();
