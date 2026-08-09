(function(){
  const V=window.WeishanIntentValidation;
  function collect(){return V.freeze(V.json({
    scope:"CONVERSATION_RESULT_DISPLAY",
    status:"BOUNDARY_DISCLOSED",
    sourceOfTruth:["apps/desktop/src/renderer/routes/HomePage.js#displayAnswer","apps/desktop/src/renderer/modules/command/commandApi.js#runTask"],
    resultDisplay:{createsWorkspace:false,facts:["The result-display functions receive task output and create no Workspace or Project."]},
    commandSubmission:{createsWorkspace:"INPUT_DEPENDENT",facts:["Commerce dispatch may construct a commerce completion workspace object."],limitations:["No blanket no-Workspace claim is valid for every CommandApi input."]},
    deterministic:true
  },true));}
  window.WeishanConversationWorkspaceEvidence=Object.freeze({collect});
})();
