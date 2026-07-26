(function(){
  function text(value,max){return typeof value==="string"?value.trim().slice(0,max):"";}
  function createVideoWorkspaceArtifactPreview(value){const source=value&&typeof value==="object"?value:{};const type=text(source.type,32);return{type,width:Number.isInteger(source.width)&&source.width>0?source.width:null,height:Number.isInteger(source.height)&&source.height>0?source.height:null,duration:Number.isFinite(source.duration)&&source.duration>=0?source.duration:null,mimeType:text(source.mimeType,80),availability:source.availability===true,previewMode:source.availability===true&&["image","video","gif","cover"].includes(type)?"placeholder":"unavailable"};}
  function createVideoWorkspaceArtifactPreviews(list){return(Array.isArray(list)?list:[]).map(createVideoWorkspaceArtifactPreview);}
  window.WeishanVideoWorkspaceArtifacts={createVideoWorkspaceArtifactPreview,createVideoWorkspaceArtifactPreviews};
})();
