(function(){
  function list(){ return window.WeishanStore.read("reports.items", []); }
  function generate(type){ const gate=window.WeishanPermissions.requirePaid("reports"); if(!gate.ok) return { ok:false, error:gate.message }; const item={ id:window.WeishanStore.uuid("report"), type:type||"execution", status:"ready", createdAt:window.WeishanStore.now() }; window.WeishanStore.write("reports.items", [item].concat(list())); window.AuditApi.record("reports.generate", item); return { ok:true, report:item }; }
  window.ReportApi = { list, generate };
})();
