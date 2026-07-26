(function(){
  const TYPES=["WorkspaceInitialized","WorkspaceDisposed","DraftChanged","ValidationChanged","TaskCreated","TaskUpdated","TaskCompleted","TaskFailed","TaskCancelled","TaskSelected","ArtifactsLoaded","RuntimeStatusChanged","CapabilitiesChanged","ErrorRaised","ErrorCleared"];
  function plain(value){ return !!value&&Object.prototype.toString.call(value)==="[object Object]"; }
  function copy(value){ const output={};["taskId","status","code","valid"].forEach((key)=>{const item=plain(value)?value[key]:undefined;if(item===null||typeof item==="string"||typeof item==="number"||typeof item==="boolean")output[key]=item;});return output; }
  function createVideoWorkspaceEvent(type,payload){ const name=TYPES.includes(type)?type:"ErrorRaised"; return Object.freeze({type:name,payload:Object.freeze(copy(payload)),version:1}); }
  function createVideoWorkspaceEventBus(){ const listeners=new Set();let count=0;function emit(type,payload){const event=createVideoWorkspaceEvent(type,payload);count+=1;listeners.forEach((listener)=>{try{listener(event);}catch(_){}});return event;}function subscribe(listener){if(typeof listener!=="function")throw new Error("invalid_listener");listeners.add(listener);return()=>listeners.delete(listener);}function getCount(){return count;}function dispose(){listeners.clear();}return{emit,subscribe,getCount,dispose}; }
  window.WeishanVideoWorkspaceEvents={TYPES,createVideoWorkspaceEvent,createVideoWorkspaceEventBus};
})();
