(function(){
  const KEYS=["imageToVideo","textToVideo","referenceImage","duration","resolution","fps","cameraMotion","style","seed","negativePrompt"];
  function createVideoProviderCapabilities(value){const source=value&&typeof value==="object"?value:{};const output={};KEYS.forEach((key)=>output[key]=source[key]===true);return output;}
  window.WeishanVideoProviderCapabilities={KEYS,createVideoProviderCapabilities};
})();
