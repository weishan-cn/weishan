(function(){
  function createVideoWorkspaceDiagnostics(state,eventBus){const source=state&&typeof state==="object"?state:{};return{workspaceVersion:1,controllerVersion:1,stateRevision:Number.isInteger(source.revision)?source.revision:0,runtimeRevision:Number.isInteger(source.runtimeStatus&&source.runtimeStatus.revision)?source.runtimeStatus.revision:0,guardActive:Object.values(source.operations||{}).some((value)=>value==="pending"),eventCount:eventBus&&typeof eventBus.getCount==="function"?eventBus.getCount():0,taskCount:Array.isArray(source.taskOrder)?source.taskOrder.length:0,validationValid:source.validation&&source.validation.valid===true};}
  window.WeishanVideoWorkspaceDiagnostics={createVideoWorkspaceDiagnostics};
})();
