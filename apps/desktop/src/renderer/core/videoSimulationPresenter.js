(function(){
  function createVideoSimulationPresenter(state){const source=state&&typeof state==="object"?state:{};return{tasks:(Array.isArray(source.tasks)?source.tasks:[]).map(row=>({taskId:row.taskId,title:row.title,status:row.status,progress:row.progress,artifactCount:Array.isArray(row.artifacts)?row.artifacts.length:0})),metrics:source.metrics||{taskCount:0,successRate:0,failureRate:0,averageSteps:0,averageLifecycle:0},controls:{canCreate:true,canAdvance:true,canComplete:true,canFail:true,canCancel:true,canReset:true}};}
  window.WeishanVideoSimulationPresenter={createVideoSimulationPresenter};
})();
