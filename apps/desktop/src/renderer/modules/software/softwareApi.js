(function(){
  const KEY = "software.plans";
  function list(){ return window.WeishanStore.read(KEY, []); }
  function createPlan(data){ const item=Object.assign({ id:window.WeishanStore.uuid("soft"), status:"draft", createdAt:window.WeishanStore.now() }, data||{}); window.WeishanStore.write(KEY, [item].concat(list())); window.HistoryApi.record("software.createPlan", item); return item; }
  function reportBug(data){ const item=Object.assign({ id:window.WeishanStore.uuid("bug"), status:"local_draft", uploadRequiresConfirm:true, createdAt:window.WeishanStore.now() }, data||{}); window.WeishanStore.write("software.bugs", [item].concat(window.WeishanStore.read("software.bugs", []))); return item; }
  window.SoftwareApi = { list, createPlan, reportBug };
})();
