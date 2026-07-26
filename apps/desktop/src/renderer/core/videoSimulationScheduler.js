(function(){
  function createVideoSimulationScheduler(engine){if(!engine||typeof engine.advance!=="function")throw new Error("simulation_engine_required");return{tick:(taskId)=>engine.advance(taskId),advance:(taskId)=>engine.advance(taskId),step:(taskId)=>engine.advance(taskId)};}
  window.WeishanVideoSimulationScheduler={createVideoSimulationScheduler};
})();
