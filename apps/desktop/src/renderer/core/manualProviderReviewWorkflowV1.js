;(function () {
  "use strict";

  const MANUAL_PROVIDER_REVIEW_WORKFLOW_V1_VERSION = "2.1.80";
  const REVIEW_STATES = [
    "not_started",
    "docs_pending",
    "terms_pending",
    "readonly_permission_pending",
    "privacy_review_pending",
    "security_review_pending",
    "sandbox_evidence_pending",
    "blocked",
    "rejected",
    "approved_for_limited_beta",
    "approved_for_future_readonly"
  ];
  const REVIEW_OBJECT_FIELDS = [
    "providerId",
    "providerName",
    "providerCategory",
    "providerRegion",
    "sourceHost",
    "apiDocsStatus",
    "termsStatus",
    "readonlyPermissionStatus",
    "privacyReviewStatus",
    "securityReviewStatus",
    "sandboxEvidenceStatus",
    "priceIntegrityStatus",
    "sourceLabelStatus",
    "bookingUrlPolicyStatus",
    "manualReviewState",
    "reviewerRole",
    "reviewedAt",
    "blockedReason",
    "redacted: true"
  ];
  const REQUIRED_PASS_FIELDS = [
    "apiDocsStatus",
    "termsStatus",
    "readonlyPermissionStatus",
    "privacyReviewStatus",
    "securityReviewStatus",
    "sandboxEvidenceStatus",
    "priceIntegrityStatus",
    "sourceLabelStatus"
  ];
  const BLOCKED_CATEGORIES = ["restricted", "restricted_provider", "restricted_or_blocked"];
  const NON_BETA_CATEGORIES = ["hotel", "product", "local_service", "ticket_or_activity"];

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value === undefined || value === null ? "" : value).trim();
  }

  function isPass(value) {
    return ["pass", "reviewed", "allowed", "approved", "complete", "completed"].includes(text(value).toLowerCase());
  }

  function hasForbiddenWriteSurface(review) {
    return Boolean(
      review.bookingUrl ||
      review.checkoutUrl ||
      review.paymentUrl ||
      review.orderUrl ||
      review.identityUpload ||
      review.passengerIdentity ||
      review.passportNumber ||
      review.bankCardNumber
    );
  }

  function buildManualProviderReviewAuditDraft(review, evaluation) {
    const safeReview = review && typeof review === "object" ? review : {};
    const safeEvaluation = evaluation && typeof evaluation === "object" ? evaluation : {};
    return clone({
      eventType: "MANUAL_PROVIDER_REVIEW_WORKFLOW_V1_DRAFT",
      schemaVersion: MANUAL_PROVIDER_REVIEW_WORKFLOW_V1_VERSION,
      providerId: text(safeReview.providerId) || "none",
      providerCategory: text(safeReview.providerCategory) || "missing",
      manualReviewState: safeEvaluation.manualReviewState || "not_started",
      evaluationDecision: safeEvaluation.decision || "blocked",
      blockedReason: safeEvaluation.blockedReason || "manual_review_not_started",
      approvedForLimitedBetaCount: safeEvaluation.manualReviewState === "approved_for_limited_beta" ? 1 : 0,
      approvedForFutureReadonlyCount: safeEvaluation.manualReviewState === "approved_for_future_readonly" ? 1 : 0,
      fullProductionApprovalCount: 0,
      paymentApprovalCount: 0,
      orderApprovalCount: 0,
      bookingUrlApprovalCount: 0,
      identityUploadApprovalCount: 0,
      redacted: true
    });
  }

  function evaluateManualProviderReviewForBeta(reviewObject) {
    const review = reviewObject && typeof reviewObject === "object" ? reviewObject : {};
    const providerId = text(review.providerId);
    const providerCategory = text(review.providerCategory);
    const categoryLower = providerCategory.toLowerCase();
    const missing = REQUIRED_PASS_FIELDS.filter(function (field) { return !isPass(review[field]); });
    const blockedReasons = [];

    if (!providerId) blockedReasons.push("missing providerId");
    if (!providerCategory) blockedReasons.push("missing providerCategory");
    if (BLOCKED_CATEGORIES.includes(categoryLower)) blockedReasons.push("restricted category blocked");
    if (NON_BETA_CATEGORIES.includes(categoryLower)) blockedReasons.push("limited beta flight only");
    if (providerId !== "flight_provider" || providerCategory !== "flight") blockedReasons.push("provider not eligible for flight limited beta");
    if (missing.length) blockedReasons.push("manual review prerequisites incomplete");
    if (hasForbiddenWriteSurface(review)) blockedReasons.push("write / booking / payment / identity surface present");
    if (text(review.manualReviewState).toLowerCase() === "rejected") blockedReasons.push("manual review rejected");

    const allowed = blockedReasons.length === 0;
    const manualReviewState = allowed ? "approved_for_limited_beta" : (BLOCKED_CATEGORIES.includes(categoryLower) ? "blocked" : "docs_pending");
    const result = {
      version: MANUAL_PROVIDER_REVIEW_WORKFLOW_V1_VERSION,
      workflowName: "manual_provider_review_workflow_v1",
      status: "local manual review workflow only",
      mode: "limited beta review only",
      decision: allowed ? "allow_limited_beta_review" : "blocked",
      allowedForLimitedBeta: allowed,
      allowedForFutureReadonly: false,
      fullProductionApproval: false,
      paymentApproval: false,
      orderApproval: false,
      bookingUrlApproval: false,
      identityUploadApproval: false,
      manualReviewState,
      blockedReason: blockedReasons[0] || "none",
      blockedReasons: Array.from(new Set(blockedReasons)),
      missingFields: missing,
      reviewObjectFields: REVIEW_OBJECT_FIELDS.slice(),
      reviewStates: REVIEW_STATES.slice(),
      betaApprovalRules: [
        "providerId must be flight_provider",
        "providerCategory must be flight",
        "all manual review statuses must pass / reviewed / allowed",
        "restricted categories are always blocked",
        "hotel/product/local service/ticket activity are not allowed in this beta",
        "bookingUrl/payment/order/identity upload remain disabled"
      ],
      capabilities: {
        canApproveFlightForLimitedBeta: allowed,
        canApproveFullProduction: false,
        canDisplayBookingUrl: false,
        canCreateOrder: false,
        canPay: false,
        canUploadIdentity: false,
        canConnectProductionProvider: false
      },
      redacted: true
    };
    result.auditDraft = buildManualProviderReviewAuditDraft(review, result);
    return clone(result);
  }

  function buildSampleFlightProviderReview() {
    return clone({
      providerId: "flight_provider",
      providerName: "Flight Provider Sandbox",
      providerCategory: "flight",
      providerRegion: "global",
      sourceHost: "provider-sandbox.invalid",
      apiDocsStatus: "reviewed",
      termsStatus: "allowed",
      readonlyPermissionStatus: "allowed",
      privacyReviewStatus: "pass",
      securityReviewStatus: "pass",
      sandboxEvidenceStatus: "pass",
      priceIntegrityStatus: "pass",
      sourceLabelStatus: "pass",
      bookingUrlPolicyStatus: "disabled",
      manualReviewState: "approved_for_limited_beta",
      reviewerRole: "local reviewer",
      reviewedAt: "local draft",
      redacted: true
    });
  }

  function buildSampleRejectedProviderReview() {
    return clone({
      providerId: "product_provider",
      providerName: "Product Provider Candidate",
      providerCategory: "product",
      apiDocsStatus: "reviewed",
      termsStatus: "allowed",
      readonlyPermissionStatus: "allowed",
      privacyReviewStatus: "pass",
      securityReviewStatus: "pass",
      sandboxEvidenceStatus: "pass",
      priceIntegrityStatus: "pass",
      sourceLabelStatus: "pass",
      manualReviewState: "blocked",
      blockedReason: "limited beta flight only",
      redacted: true
    });
  }

  function buildManualProviderReviewWorkflowV1Draft() {
    const flightReview = buildSampleFlightProviderReview();
    const flightEvaluation = evaluateManualProviderReviewForBeta(flightReview);
    const rejectedReview = buildSampleRejectedProviderReview();
    const rejectedEvaluation = evaluateManualProviderReviewForBeta(rejectedReview);
    return clone({
      version: MANUAL_PROVIDER_REVIEW_WORKFLOW_V1_VERSION,
      workflowName: "manual_provider_review_workflow_v1",
      status: "local manual review workflow only",
      mode: "limited beta review only",
      productionActivation: "disabled",
      payment: "disabled",
      order: "disabled",
      bookingUrl: "disabled",
      identityUpload: "disabled",
      reviewObjectFields: REVIEW_OBJECT_FIELDS.slice(),
      reviewStates: REVIEW_STATES.slice(),
      betaApprovalRules: flightEvaluation.betaApprovalRules,
      blockedRules: ["restricted categories blocked", "non-flight categories blocked", "production activation disabled", "payment/order/bookingUrl/identity disabled"],
      sampleFlightProviderReview: flightReview,
      sampleFlightProviderEvaluation: flightEvaluation,
      sampleRejectedProviderReview: rejectedReview,
      sampleRejectedProviderEvaluation: rejectedEvaluation,
      auditDraft: flightEvaluation.auditDraft,
      redacted: true
    });
  }

  function assertManualProviderReviewWorkflowV1Safe(value) {
    const draft = value && typeof value === "object" ? value : buildManualProviderReviewWorkflowV1Draft();
    const audit = draft.auditDraft || {};
    if (draft.status !== "local manual review workflow only") throw new Error("manual review workflow v1 must stay local only");
    if (draft.mode !== "limited beta review only") throw new Error("manual review workflow v1 must stay limited beta only");
    ["productionActivation", "payment", "order", "bookingUrl", "identityUpload"].forEach(function (key) {
      if (draft[key] !== "disabled") throw new Error(key + " must stay disabled");
    });
    ["fullProductionApprovalCount", "paymentApprovalCount", "orderApprovalCount", "bookingUrlApprovalCount", "identityUploadApprovalCount"].forEach(function (key) {
      if ((audit[key] || 0) !== 0) throw new Error(key + " must stay zero");
    });
    const productDecision = evaluateManualProviderReviewForBeta(buildSampleRejectedProviderReview());
    if (productDecision.allowedForLimitedBeta !== false || productDecision.manualReviewState === "approved_for_limited_beta") {
      throw new Error("non-flight provider must not enter limited beta");
    }
    const restrictedDecision = evaluateManualProviderReviewForBeta({ providerId:"restricted_provider", providerCategory:"restricted" });
    if (restrictedDecision.manualReviewState !== "blocked") throw new Error("restricted provider must stay blocked");
    return true;
  }

  window.WeishanManualProviderReviewWorkflowV1 = {
    MANUAL_PROVIDER_REVIEW_WORKFLOW_V1_VERSION,
    REVIEW_STATES,
    REVIEW_OBJECT_FIELDS,
    buildManualProviderReviewAuditDraft,
    evaluateManualProviderReviewForBeta,
    buildSampleFlightProviderReview,
    buildSampleRejectedProviderReview,
    buildManualProviderReviewWorkflowV1Draft,
    assertManualProviderReviewWorkflowV1Safe
  };
})();
