;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_RC_COPY_REVIEW_VIEW_MODEL_VERSION = "4.2.8";
  const VIEW_MODEL_NAME = "flight_workflow_rc_copy_review_view_model_v1";
  const CAVEAT = "该页面只用于只读 RC 文案定稿与安全披露复核，不保存真实身份、不发送真实邀请、不提供交易能力。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential/ig, "redacted")
      .trim();
  }
  function card(cardId, label, value) { return { cardId:text(cardId || "card"), label:text(label), value:text(value), redacted:true }; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId || "row"), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function api(name) { return window[name] || {}; }
  function copyFinalizationOf(input) {
    const safe = obj(input);
    if (safe.rcCopyFinalizationSummary) return safe.rcCopyFinalizationSummary;
    return typeof api("WeishanFlightWorkflowRcUserFacingCopyFinalization").buildFlightWorkflowRcUserFacingCopyFinalization === "function"
      ? api("WeishanFlightWorkflowRcUserFacingCopyFinalization").buildFlightWorkflowRcUserFacingCopyFinalization(safe)
      : {};
  }
  function disclosureOf(input) {
    const safe = obj(input);
    if (safe.safetyDisclosureReviewSummary) return safe.safetyDisclosureReviewSummary;
    return typeof api("WeishanFlightWorkflowSafetyDisclosureReviewBoard").buildFlightWorkflowSafetyDisclosureReviewBoard === "function"
      ? api("WeishanFlightWorkflowSafetyDisclosureReviewBoard").buildFlightWorkflowSafetyDisclosureReviewBoard(safe)
      : {};
  }
  function releaseRiskOf(input) {
    const safe = obj(input);
    return obj(safe.releaseRiskLedgerSummary);
  }
  function globalShoppingGoalOf(input) {
    return obj(obj(input).globalShoppingProductGoalSummary);
  }
  function jumpBoundaryOf(input) {
    return obj(obj(input).jumpToPlatformBoundarySummary);
  }
  function buildFlightWorkflowRcCopyReviewRows(input) {
    const summary = copyFinalizationOf(input || {});
    return toArray(summary.copyRows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); });
  }
  function buildFlightWorkflowSafetyDisclosureRowsForView(input) {
    const summary = disclosureOf(input || {});
    return toArray(summary.disclosureRows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); });
  }
  function buildFlightWorkflowRcCopyReviewCards(input) {
    const copySummary = copyFinalizationOf(input || {});
    const disclosureSummary = disclosureOf(input || {});
    const globalShoppingGoalSummary = globalShoppingGoalOf(input || {});
    const jumpBoundarySummary = jumpBoundaryOf(input || {});
    return clone([
      card("copy_finalization", "文案定稿", obj(copySummary.userFacingSummary).resultLabel || copySummary.status || "文案仍需复核"),
      card("safety_disclosure", "安全披露", obj(disclosureSummary.userFacingSummary).resultLabel || disclosureSummary.status || "安全披露仍需复核"),
      card("global_shopping_goal", "全球购目标", obj(globalShoppingGoalSummary.userFacingSummary).resultLabel || globalShoppingGoalSummary.status || "产品目标仍需复核"),
      card("jump_boundary", "跳转边界", obj(jumpBoundarySummary.userFacingSummary).resultLabel || jumpBoundarySummary.status || "跳转边界仍需复核"),
      card("forbidden_copy", "禁用措辞", toArray(copySummary.forbiddenCopyFindings).length ? "发现危险文案" : "文案不代表交易能力"),
      card("next_step", "下一步", disclosureSummary.status === "approved" && copySummary.status === "finalized" ? "RC 文案可以定稿" : obj(disclosureSummary.userFacingSummary).resultLabel || obj(copySummary.userFacingSummary).resultLabel || "仍需复核")
    ]);
  }
  function buildFlightWorkflowRcCopyReviewViewModel(input) {
    try {
      const copySummary = copyFinalizationOf(input || {});
      const disclosureSummary = disclosureOf(input || {});
      const releaseRiskSummary = releaseRiskOf(input || {});
      const globalShoppingGoalSummary = globalShoppingGoalOf(input || {});
      const jumpBoundarySummary = jumpBoundaryOf(input || {});
      const status = copySummary.status === "blocked" || disclosureSummary.status === "blocked"
        ? "blocked"
        : copySummary.status === "finalized" && disclosureSummary.status === "approved"
          ? "approved"
          : "needs_review";
      return clone({
        viewModelName:VIEW_MODEL_NAME,
        appVersion:FLIGHT_WORKFLOW_RC_COPY_REVIEW_VIEW_MODEL_VERSION,
        status:status,
        title:"只读 RC 文案定稿与安全披露",
        cards:buildFlightWorkflowRcCopyReviewCards(input || {}),
        copyRows:buildFlightWorkflowRcCopyReviewRows(input || {}),
        disclosureRows:buildFlightWorkflowSafetyDisclosureRowsForView(input || {}),
        riskRows:toArray(releaseRiskSummary.rows || []).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }),
        caveat:CAVEAT,
        rcCopyFinalizationSummary:clone(copySummary),
        safetyDisclosureReviewSummary:clone(disclosureSummary),
        releaseRiskLedgerSummary:clone(releaseRiskSummary),
        globalShoppingProductGoalSummary:clone(globalShoppingGoalSummary),
        jumpToPlatformBoundarySummary:clone(jumpBoundarySummary),
        globalShoppingGoalStatus:text(obj(globalShoppingGoalSummary).status || ""),
        jumpBoundaryStatus:text(obj(jumpBoundarySummary).status || ""),
        safeToProceedWithJumpToPlatformMvp:obj(globalShoppingGoalSummary).safeToProceedWithJumpToPlatformMvp === true && obj(jumpBoundarySummary).safeToProceedWithJumpToPlatformMvp === true,
        bookingUrl:null,
        checkoutUrl:null,
        paymentUrl:null,
        orderUrl:null,
        payment:false,
        order:false,
        ticketing:false,
        fileWrite:false,
        download:false,
        autoOpen:false,
        autoRefresh:false,
        redacted:true
      });
    } catch (error) {
      return clone({
        viewModelName:VIEW_MODEL_NAME,
        appVersion:FLIGHT_WORKFLOW_RC_COPY_REVIEW_VIEW_MODEL_VERSION,
        status:"failed_safe",
        title:"只读 RC 文案定稿与安全披露",
        cards:[],
        copyRows:[],
        disclosureRows:[],
        riskRows:[],
        caveat:CAVEAT,
        bookingUrl:null,
        checkoutUrl:null,
        paymentUrl:null,
        orderUrl:null,
        payment:false,
        order:false,
        ticketing:false,
        fileWrite:false,
        download:false,
        autoOpen:false,
        autoRefresh:false,
        redacted:true
      });
    }
  }
  function buildFlightWorkflowRcCopyReviewViewModelAuditDraft(input) {
    const model = buildFlightWorkflowRcCopyReviewViewModel(input || {});
    return clone({
      eventType:"FLIGHT_WORKFLOW_RC_COPY_REVIEW_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:FLIGHT_WORKFLOW_RC_COPY_REVIEW_VIEW_MODEL_VERSION,
      status:model.status,
      cardCount:model.cards.length,
      copyRowCount:model.copyRows.length,
      disclosureRowCount:model.disclosureRows.length,
      riskRowCount:model.riskRows.length,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      fileWrite:false,
      download:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    });
  }

  window.WeishanFlightWorkflowRcCopyReviewViewModel = {
    FLIGHT_WORKFLOW_RC_COPY_REVIEW_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildFlightWorkflowRcCopyReviewViewModel,
    buildFlightWorkflowRcCopyReviewCards,
    buildFlightWorkflowRcCopyReviewRows,
    buildFlightWorkflowSafetyDisclosureRowsForView,
    buildFlightWorkflowRcCopyReviewViewModelAuditDraft
  };
})();
