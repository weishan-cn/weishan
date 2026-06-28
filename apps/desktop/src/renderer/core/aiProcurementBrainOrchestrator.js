(function(){
  const AI_PROCUREMENT_BRAIN_ORCHESTRATOR_VERSION = "2.1.88";

  function text(value){ return String(value || "").trim(); }
  function clone(value){ return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }

  function categoryFromInput(raw, hint){
    const value = text(raw);
    if (hint) return hint;
    if (/枪|武器|身份证.*银行卡|银行卡.*身份证|贷款|护照.*代办/.test(value)) return "restricted_or_blocked";
    if (/机票|航班|直达|中转|上海.*成都|成都.*上海/.test(value)) return "flight";
    if (/酒店|住宿|入住|离店/.test(value)) return "hotel";
    if (/搬家|维修|保洁|服务/.test(value)) return "local_service";
    if (/门票|活动|演唱会|迪士尼|ticket/i.test(value)) return "ticket_or_activity";
    if (/iPhone|电脑|手机|商品|买/.test(value)) return "product";
    if (/机票|酒店|电脑|门票|交通/.test(value)) return "multi_category_plan";
    return "multi_category_plan";
  }

  function normalizedIntent(raw, category){
    const value = text(raw);
    const route = value.match(/([^\s，,。]+?)\s*到\s*([^\s，,。]+?)(?:最便宜|直达|机票|航班|$)/);
    const date = (value.match(/\d{1,2}\s*月\s*\d{1,2}\s*日/) || [""])[0];
    return {
      rawUserInput:value,
      category,
      origin:category === "flight" && route ? route[1] : "",
      destination:category === "flight" && route ? route[2] : "",
      date,
      sortPreference:/最便宜|低价|便宜/.test(value) ? "低价优先" : "按条件筛选",
      redacted:true
    };
  }

  function backendDecision(input, category, restricted){
    const router = window.WeishanAiBackendRouter;
    if (router && typeof router.routeAiBackend === "function") {
      return router.routeAiBackend({
        userAiApiState:input.userAiApiState,
        secureApiKeyStorageState:input.secureApiKeyStorageState,
        networkPolicy:input.networkPolicy,
        taskType:category,
        restrictedCategoryDecision:restricted ? "blocked" : "allow",
        redacted:true
      });
    }
    return { backendDecision:restricted ? "blocked" : "local_rules", reason:restricted ? "restricted" : "local fallback", tokenPlaintextDisplayed:false, tokenLogged:false, networkAllowed:false, paymentDisabled:true, orderDisabled:true, identityUploadDisabled:true, redacted:true };
  }

  function clarificationDecision(input, raw, category){
    const gate = window.WeishanProcurementClarificationGate;
    if (gate && typeof gate.evaluateProcurementClarificationGate === "function") return gate.evaluateProcurementClarificationGate({ rawUserInput:raw, procurementCategory:category, redacted:true });
    return { clarificationDecision:"not_needed", missingFields:[], questionText:"", suggestedQuickReplies:[], redacted:true };
  }

  function orchestrateAiProcurementBrain(input){
    const safeInput = input && typeof input === "object" ? input : {};
    const raw = text(safeInput.rawUserInput || safeInput.text || safeInput.query);
    const category = categoryFromInput(raw, safeInput.currentCategoryHint || safeInput.procurementCategory);
    const restricted = category === "restricted_or_blocked" || text(safeInput.restrictedCategoryDecision) === "blocked";
    const clarify = clarificationDecision(safeInput, raw, category);
    const backend = backendDecision(safeInput, category, restricted);
    let intentStatus = "ready";
    let resultSurfaceMode = "clean_user_results";
    if (restricted) { intentStatus = "blocked"; resultSurfaceMode = "blocked_safety_card"; }
    else if (clarify.clarificationDecision === "ask_user") { intentStatus = "needs_clarification"; resultSurfaceMode = "clarification_prompt"; }
    else if (safeInput.providerReadinessState && safeInput.providerReadinessState.productionProviderReady === false) { intentStatus = "offline_plan_only"; resultSurfaceMode = "offline_plan"; }
    const decision = {
      brainVersion:AI_PROCUREMENT_BRAIN_ORCHESTRATOR_VERSION,
      brainDecisionId:"ai-brain-" + category + "-" + (raw.length || 0),
      intentStatus,
      procurementCategory:restricted ? "restricted_or_blocked" : category,
      confidence:restricted ? 0.98 : (clarify.clarificationDecision === "ask_user" ? 0.58 : 0.86),
      missingFields:clarify.missingFields || [],
      clarificationQuestion:clarify.questionText || "",
      normalizedSearchIntent:normalizedIntent(raw, category),
      resultSurfaceMode,
      preferredReasoningBackend:backend.backendDecision === "blocked" ? "local_rules" : backend.backendDecision,
      backendDecisionReason:backend.reason,
      allowExternalSearch:!restricted && backend.backendDecision !== "blocked",
      allowProviderReadOnly:!restricted && category === "flight",
      allowPayment:false,
      allowOrder:false,
      allowIdentityUpload:false,
      aiBackendDecision:backend,
      clarificationGateDecision:clarify,
      redacted:true
    };
    return clone(decision);
  }

  function buildAiProcurementBrainAuditDraft(input){
    const decision = orchestrateAiProcurementBrain(input || {});
    return clone({
      eventType:"AI_PROCUREMENT_BRAIN_ORCHESTRATOR_DRAFT",
      procurementCategory:decision.procurementCategory,
      intentStatus:decision.intentStatus,
      confidence:decision.confidence,
      missingFields:decision.missingFields,
      clarificationAsked:decision.intentStatus === "needs_clarification",
      preferredReasoningBackend:decision.preferredReasoningBackend,
      backendDecisionReason:decision.backendDecisionReason,
      allowExternalSearch:decision.allowExternalSearch,
      allowProviderReadOnly:decision.allowProviderReadOnly,
      allowPayment:false,
      allowOrder:false,
      allowIdentityUpload:false,
      redacted:true
    });
  }

  function assertAiProcurementBrainSafe(decision){
    const value = decision || orchestrateAiProcurementBrain({ rawUserInput:"帮我买机票" });
    if (value.allowPayment !== false || value.allowOrder !== false || value.allowIdentityUpload !== false) throw new Error("AI procurement brain must keep payment/order/identity disabled");
    if (value.redacted !== true) throw new Error("AI procurement brain must be redacted");
    if (value.intentStatus === "needs_clarification" && !value.clarificationQuestion) throw new Error("clarification status must include a question");
    return true;
  }

  window.WeishanAiProcurementBrainOrchestrator = {
    AI_PROCUREMENT_BRAIN_ORCHESTRATOR_VERSION,
    orchestrateAiProcurementBrain,
    buildAiProcurementBrainAuditDraft,
    assertAiProcurementBrainSafe
  };
})();
