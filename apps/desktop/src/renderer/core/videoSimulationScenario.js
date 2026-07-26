(function(){
  const STEPS=["CREATED","QUEUED","GENERATING","POST_PROCESSING","COMPLETED"];
  function nextVideoSimulationStatus(status){const index=STEPS.indexOf(status);return index<0||index===STEPS.length-1?status:STEPS[index+1];}
  function createVideoSimulationScenario(){return{steps:STEPS.slice(),next:nextVideoSimulationStatus};}
  window.WeishanVideoSimulationScenario={STEPS,nextVideoSimulationStatus,createVideoSimulationScenario};
})();
