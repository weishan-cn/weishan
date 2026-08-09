(function(){
  const V=window.WeishanIntentValidation;
  function collect(){return V.freeze(V.json({
    scope:"CONVERSATION_RESULT_DISPLAY",
    status:"BOUNDARY_DISCLOSED",
    sourceOfTruth:["apps/desktop/src/renderer/routes/HomePage.js#displayAnswer","apps/desktop/src/renderer/modules/command/commandApi.js#runTask"],
    resultDisplay:{externalEffects:false,facts:["Result display only sanitizes and returns text."]},
    commandSubmission:{externalEffects:"INPUT_DEPENDENT",facts:["CommandApi can route an input or save memory depending on classified intent."],limitations:["No blanket no-external-effects claim is valid for every CommandApi input."]},
    deterministic:true
  },true));}
  window.WeishanConversationExternalEffectEvidence=Object.freeze({collect});
})();
