(function(){
  const VALUES={CREATED:0,QUEUED:20,GENERATING:55,POST_PROCESSING:85,COMPLETED:100,FAILED:0,CANCELLED:0};
  function getVideoSimulationProgress(status){return Object.prototype.hasOwnProperty.call(VALUES,status)?VALUES[status]:0;}
  window.WeishanVideoSimulationProgress={getVideoSimulationProgress};
})();
