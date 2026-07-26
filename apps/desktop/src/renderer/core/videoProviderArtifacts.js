(function(){
  function createVideoProviderArtifact(value){const source=value&&typeof value==="object"?value:{};return{type:typeof source.type==="string"?source.type.slice(0,32):"",mimeType:typeof source.mimeType==="string"?source.mimeType.slice(0,80):"",sizeBytes:Number.isFinite(source.sizeBytes)&&source.sizeBytes>=0?source.sizeBytes:null,availability:source.availability===true,previewMode:source.previewMode==="placeholder"?"placeholder":"unavailable",displayName:typeof source.displayName==="string"?source.displayName.slice(0,160):typeof source.name==="string"?source.name.slice(0,160):""};}
  function createVideoProviderArtifacts(list){return(Array.isArray(list)?list:[]).map(createVideoProviderArtifact);}
  window.WeishanVideoProviderArtifacts={createVideoProviderArtifact,createVideoProviderArtifacts};
})();
