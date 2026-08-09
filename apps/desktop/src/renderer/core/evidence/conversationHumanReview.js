(function(){
  const V=window.WeishanIntentValidation;
  const KEYS=["approvalId","destination","evidenceVersion","reviewStatus","approvedScopes","rejectedScopes","limitations","reviewedAt"];
  function createPendingReview(){return V.freeze(V.json({
    approvalId:"HA-EVIDENCE-CONVERSATION-003",
    destination:"CONVERSATION_READ_ONLY",
    evidenceVersion:"1.1",
    reviewStatus:"PENDING",
    approvedScopes:[],
    rejectedScopes:[],
    limitations:["No automatic approval is permitted.","The authoritative scope is CONVERSATION_RESULT_DISPLAY only."],
    reviewedAt:null
  },true));}
  function buildClosure(records){
    const x=V.json(records,true);
    const blockers=[];
    if(!x.persistence||x.persistence.commandSubmission.directPersistence===true) blockers.push("COMMAND_SUBMISSION_PERSISTS");
    if(!x.workspace||x.workspace.commandSubmission.createsWorkspace==="INPUT_DEPENDENT") blockers.push("COMMAND_SUBMISSION_WORKSPACE_DEPENDENT");
    if(!x.externalEffects||x.externalEffects.commandSubmission.externalEffects==="INPUT_DEPENDENT") blockers.push("COMMAND_SUBMISSION_EFFECT_DEPENDENT");
    if(!x.provider||x.provider.resultDisplay.directProviderCall!==false) blockers.push("PROVIDER_BYPASS_EVIDENCE_MISSING");
    if(!x.scheduler||x.scheduler.resultDisplay.schedulerSubmission!==false) blockers.push("SCHEDULER_EVIDENCE_MISSING");
    if(!x.rollback||x.rollback.rollbackRequired!==false) blockers.push("ROLLBACK_EVIDENCE_MISSING");
    if(!x.humanReview||x.humanReview.reviewStatus!=="PENDING") blockers.push("HUMAN_REVIEW_BOUNDARY_INVALID");
    return V.freeze({destination:"CONVERSATION_READ_ONLY",status:blockers.length?"REMAINS_NOT_READY":"READY_FOR_HUMAN_REVIEW",blockers,productionAffected:false,executed:false,authorizesExecution:false});
  }
  window.WeishanConversationHumanReview=Object.freeze({KEYS:Object.freeze(KEYS),createPendingReview,buildClosure});
})();
