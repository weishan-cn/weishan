(function(){
  function createVideoWorkspaceRuntimeStatus(value){const source=value&&typeof value==="object"?value:{};return{runtimeReady:source.runtimeReady===true,gatewayReady:source.available===true,providerHostReady:source.providerHostReady===true,taskCount:Number.isInteger(source.activeTaskCount)&&source.activeTaskCount>=0?source.activeTaskCount:0,available:source.available===true,mode:typeof source.mode==="string"?source.mode:"unavailable"};}
  window.WeishanVideoWorkspaceRuntimeStatus={createVideoWorkspaceRuntimeStatus};
})();
