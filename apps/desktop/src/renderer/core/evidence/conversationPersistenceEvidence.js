(function(){
  const V=window.WeishanIntentValidation;
  function collect(){return V.freeze(V.json({
    scope:"CONVERSATION_RESULT_DISPLAY",
    status:"BOUNDARY_DISCLOSED",
    sourceOfTruth:["apps/desktop/src/renderer/routes/HomePage.js#displayAnswer","apps/desktop/src/renderer/modules/command/commandApi.js#enqueue","apps/desktop/src/renderer/modules/command/commandApi.js#runTask"],
    resultDisplay:{directPersistence:false,facts:["HomePage displayAnswer and displayLogText only transform supplied task data."]},
    commandSubmission:{directPersistence:true,facts:["CommandApi enqueue saves a queue record.","CommandApi runTask saves completed tasks to command history and HistoryApi when available."],limitations:["CONVERSATION_RESULT_DISPLAY is not evidence that CommandApi submission is persistence-free."]},
    deterministic:true
  },true));}
  window.WeishanConversationPersistenceEvidence=Object.freeze({collect});
})();
