(function(){
  function createVideoSimulationMetrics(tasks){const rows=Array.isArray(tasks)?tasks:[];const completed=rows.filter(row=>row.status==="COMPLETED").length,failed=rows.filter(row=>row.status==="FAILED").length,terminal=completed+failed+rows.filter(row=>row.status==="CANCELLED").length;const steps=rows.reduce((sum,row)=>sum+(Number.isInteger(row.steps)?row.steps:0),0);return{taskCount:rows.length,successRate:terminal?completed/terminal:0,failureRate:terminal?failed/terminal:0,averageSteps:rows.length?steps/rows.length:0,averageLifecycle:rows.length?steps/rows.length:0};}
  window.WeishanVideoSimulationMetrics={createVideoSimulationMetrics};
})();
