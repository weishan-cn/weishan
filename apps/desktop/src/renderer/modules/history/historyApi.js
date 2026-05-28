(function(){
  const KEY = "history.items";
  function list(){ return window.WeishanStore.read(KEY, []); }
  function record(type, payload){ const item = { id:window.WeishanStore.uuid("hist"), type, payload:payload || {}, createdAt:window.WeishanStore.now() }; window.WeishanStore.write(KEY, [item].concat(list()).slice(0, 1000)); return item; }
  function search(q){ const s=String(q||"").toLowerCase(); return list().filter(x => JSON.stringify(x).toLowerCase().includes(s)); }
  function clearPersonal(){ window.WeishanStore.write(KEY, []); }
  window.HistoryApi = { list, record, search, clearPersonal };
})();
