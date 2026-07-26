(function(){
  const METHODS=["createTask","queryTask","cancelTask","listTasks","downloadArtifacts","getCapabilities","getStatus","dispose"];
  function validateVideoProviderContract(value){if(!value||typeof value!=="object"||Array.isArray(value))return{valid:false,missing:METHODS.slice(),extra:[]};const names=Object.getOwnPropertyNames(value),extra=names.filter((name)=>!METHODS.includes(name)),missing=METHODS.filter((name)=>{const descriptor=Object.getOwnPropertyDescriptor(value,name);return!descriptor||typeof descriptor.value!=="function"||descriptor.get||descriptor.set;});return{valid:missing.length===0&&extra.length===0,missing,extra};}
  window.WeishanVideoProviderContracts={METHODS,validateVideoProviderContract};
})();
