(function(){
  function createVideoSimulationAssets(taskId){const id=typeof taskId==="string"?taskId:"simulation";return[{type:"cover",name:id+"-cover",mimeType:"image/png",availability:false,previewMode:"placeholder"},{type:"video",name:id+"-video",mimeType:"video/mp4",availability:false,previewMode:"placeholder"},{type:"gif",name:id+"-preview",mimeType:"image/gif",availability:false,previewMode:"placeholder"}];}
  window.WeishanVideoSimulationAssets={createVideoSimulationAssets};
})();
