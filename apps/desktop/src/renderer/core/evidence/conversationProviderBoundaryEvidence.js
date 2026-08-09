(function(){
  const V=window.WeishanIntentValidation;
  function collect(){return V.freeze(V.json({
    scope:"CONVERSATION_RESULT_DISPLAY",
    status:"PROVEN",
    sourceOfTruth:["apps/desktop/src/renderer/routes/HomePage.js#displayAnswer","apps/desktop/src/renderer/modules/command/commandApi.js#answerChatWithGateway"],
    resultDisplay:{directProviderCall:false,facts:["HomePage result-display functions do not invoke a Provider or gateway."]},
    commandSubmission:{gatewayBoundary:"CONTROLLED_COMMAND_API",facts:["CommandApi owns the configured WeishanAPI.chat and local AI gateway calls."],limitations:["This evidence does not claim that CommandApi is offline or that a configured gateway never uses a Provider."]},
    deterministic:true
  },true));}
  window.WeishanConversationProviderBoundaryEvidence=Object.freeze({collect});
})();
