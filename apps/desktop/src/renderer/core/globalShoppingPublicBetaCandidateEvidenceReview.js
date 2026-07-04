;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_EVIDENCE_REVIEW_VERSION = "4.2.4";
  const REVIEW_NAME = "global_shopping_public_beta_candidate_evidence_review_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, candidate_evidence_review_only:true };
  const LOCKED_CAPABILITIES = ["provider", "network", "external_open", "payment", "order", "ticketing", "release", "push", "launch"];
  const BLOCKED_TEXT_RE = /production_ready|auto_release|auto_launch|auto_publish|ready_to_publish|enable_provider|enable_payment|enable_order|boundaryExpanded|safetyBoundaryRelaxed/i;
  const SECRET_NAME_RE = /(^|[^a-z])(token|secret|api[_ -]?key|password)([^a-z]|$)/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function unique(values) {
    return values.filter(Boolean).filter(function (value, index, array) { return array.indexOf(value) === index; });
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function section(sectionId, label, value) {
    return { sectionId:text(sectionId), label:text(label), value:text(value), redacted:true };
  }
  function safeMode(value) {
    const mode = text(value || "candidate_evidence_review_only");
    return ALLOWED_MODES[mode] ? mode : "candidate_evidence_review_only";
  }
  function normalizeStatus(value, fallback) {
    const status = text(value || fallback || "needs_review");
    if (/^(pass|ready)$/.test(status)) return "ready";
    if (status === "manual_review_required") return "manual_review_required";
    if (/^(warn|warning)$/.test(status)) return "needs_review";
    return /^(ready|needs_review|blocked|failed_safe|manual_review_required)$/.test(status) ? status : "needs_review";
  }
  function hasTruthyUrl(value) {
    const normalized = text(value);
    return normalized && normalized !== "null";
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function blockedReasons(input) {
    const safe = obj(input);
    const blocked = [];
    if (safe.evidencePersistence === true || safe.archivePersistence === true || safe.notesPersistence === true || safe.persisted === true) blocked.push("evidence persistence");
    if (safe.fileWrite === true || safe.writeFile === true) blocked.push("file write");
    if (safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true || safe.enableProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.payment === true || safe.authorizePayment === true || safe.enablePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true || safe.enableOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    if (safe.rawProviderPersistence === true || safe.rawRequestPersistence === true || safe.rawResponsePersistence === true) blocked.push("raw persistence");
    if (safe.rawUserTextPersistence === true || safe.savedRawUserText === true) blocked.push("raw user text persistence");
    ["status", "summary", "title", "subtitle", "evidenceReviewStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe publish language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingPublicBetaCandidateEvidenceReview(input) {
    const safe = obj(input);
    const publicBetaCandidateLockSummary = resolveSummary(safe, "publicBetaCandidateLockSummary", "WeishanGlobalShoppingPublicBetaCandidateLock", "buildGlobalShoppingPublicBetaCandidateLock");
    const finalTrialHandoffConsoleSummary = resolveSummary(safe, "finalTrialHandoffConsoleSummary", "WeishanGlobalShoppingFinalTrialHandoffConsole", "buildGlobalShoppingFinalTrialHandoffConsole");
    const noProviderProductionBoundarySummary = resolveSummary(safe, "noProviderProductionBoundarySummary", "WeishanGlobalShoppingNoProviderProductionBoundary", "buildGlobalShoppingNoProviderProductionBoundary");
    const publicBetaCandidateViewModelSummary = resolveSummary(safe, "publicBetaCandidateViewModelSummary", "WeishanGlobalShoppingPublicBetaCandidateViewModel", "buildGlobalShoppingPublicBetaCandidateViewModel");
    const publicBetaFinalReadinessCommandCenterSummary = resolveSummary(safe, "publicBetaFinalReadinessCommandCenterSummary", "WeishanGlobalShoppingPublicBetaFinalReadinessCommandCenter", "buildGlobalShoppingPublicBetaFinalReadinessCommandCenter");
    const summaries = [
      publicBetaCandidateLockSummary,
      finalTrialHandoffConsoleSummary,
      noProviderProductionBoundarySummary,
      publicBetaCandidateViewModelSummary,
      publicBetaFinalReadinessCommandCenterSummary
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const statuses = [
      normalizeStatus(obj(publicBetaCandidateLockSummary).candidateLockStatus || obj(publicBetaCandidateLockSummary).status, "needs_review"),
      normalizeStatus(obj(finalTrialHandoffConsoleSummary).handoffStatus || obj(finalTrialHandoffConsoleSummary).status, "needs_review"),
      normalizeStatus(obj(noProviderProductionBoundarySummary).boundaryStatus || obj(noProviderProductionBoundarySummary).status, "needs_review"),
      normalizeStatus(obj(publicBetaCandidateViewModelSummary).status, "needs_review"),
      normalizeStatus(obj(publicBetaFinalReadinessCommandCenterSummary).finalReadinessStatus || obj(publicBetaFinalReadinessCommandCenterSummary).status, "needs_review")
    ];
    const blocked = blockedReasons(safe);
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status !== "ready" && status !== "manual_review_required"; });
    const evidenceReviewStatus = blocked.length || upstreamBlocked
      ? "blocked"
      : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");
    const knownWarnings = unique(
      []
        .concat(Array.isArray(safe.knownWarnings) ? safe.knownWarnings : [])
        .concat(Array.isArray(obj(publicBetaCandidateLockSummary).knownWarnings) ? obj(publicBetaCandidateLockSummary).knownWarnings : [])
        .concat(Array.isArray(obj(publicBetaFinalReadinessCommandCenterSummary).knownWarnings) ? obj(publicBetaFinalReadinessCommandCenterSummary).knownWarnings : [])
        .filter(function (item) { return /secret scan WARN/i.test(text(item)); })
    );

    return clone({
      reviewName:REVIEW_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_EVIDENCE_REVIEW_VERSION,
      reviewMode:safeMode(safe.reviewMode),
      evidenceReviewStatus:evidenceReviewStatus,
      status:evidenceReviewStatus,
      candidateScopeEvidence:text(obj(publicBetaCandidateLockSummary.userFacingSummary).resultLabel || "Public Beta Candidate Lock 仍需复核"),
      handoffEvidence:text(obj(finalTrialHandoffConsoleSummary.userFacingSummary).resultLabel || "Final Trial Handoff Console 仍需复核"),
      productionBoundaryEvidence:text(obj(noProviderProductionBoundarySummary.userFacingSummary).resultLabel || "No-Provider Production Boundary 仍需复核"),
      finalReadinessEvidence:text(obj(publicBetaFinalReadinessCommandCenterSummary.userFacingSummary).resultLabel || "Public Beta Final Readiness Command Center 仍需复核"),
      lockedCapabilities:LOCKED_CAPABILITIES.slice(),
      knownWarnings:knownWarnings,
      manualReviewRequired:true,
      blockedCapabilities:blocked,
      publicBetaCandidateLockSummary:publicBetaCandidateLockSummary,
      finalTrialHandoffConsoleSummary:finalTrialHandoffConsoleSummary,
      noProviderProductionBoundarySummary:noProviderProductionBoundarySummary,
      publicBetaCandidateViewModelSummary:publicBetaCandidateViewModelSummary,
      publicBetaFinalReadinessCommandCenterSummary:publicBetaFinalReadinessCommandCenterSummary,
      userFacingSummary:{
        title:"Public Beta Candidate Evidence Review",
        resultLabel:evidenceReviewStatus === "blocked" ? "Public Beta Candidate Evidence Review 已阻断" : (evidenceReviewStatus === "needs_review" ? "Public Beta Candidate Evidence Review 仍需复核" : "Public Beta Candidate Evidence Review 需人工复核"),
        caveat:"候选证据仅为只读复核，不写文件"
      },
      externalUrl:null,
      platformUrl:null,
      providerUrl:null,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      buyButtonEnabled:false,
      checkoutButtonEnabled:false,
      paymentButtonEnabled:false,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaCandidateEvidenceRows(input) {
    const safe = evaluateGlobalShoppingPublicBetaCandidateEvidenceReview(input || {});
    return clone([
      row("public_beta_candidate_evidence_review", "Public Beta Candidate Evidence Review", safe.userFacingSummary.resultLabel, safe.evidenceReviewStatus === "blocked" ? "blocked" : "warning"),
      row("candidate_scope_evidence", "Candidate Evidence", safe.candidateScopeEvidence, "warning"),
      row("trial_handoff_evidence", "Trial Handoff", safe.handoffEvidence, "warning"),
      row("production_boundary_evidence", "Production Boundary", safe.productionBoundaryEvidence, "warning"),
      row("final_readiness_evidence", "Final Readiness", safe.finalReadinessEvidence, "warning"),
      row("candidate_evidence_manual_review", "Manual Review Required", "候选证据仅为只读复核，不写文件", "warning")
    ]);
  }

  function buildGlobalShoppingPublicBetaCandidateEvidenceSections(input) {
    const safe = evaluateGlobalShoppingPublicBetaCandidateEvidenceReview(input || {});
    return clone([
      section("public_beta_candidate_evidence_review", "Public Beta Candidate Evidence Review", safe.userFacingSummary.resultLabel),
      section("candidate_evidence", "Candidate Evidence", safe.candidateScopeEvidence),
      section("trial_handoff", "Trial Handoff", safe.handoffEvidence),
      section("safety_boundary", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push、launch 仍保持关闭")
    ]);
  }

  function buildGlobalShoppingPublicBetaCandidateEvidenceReviewAuditDraft(input) {
    const safe = evaluateGlobalShoppingPublicBetaCandidateEvidenceReview(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_EVIDENCE_REVIEW_AUDIT_DRAFT",
      reviewName:REVIEW_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_EVIDENCE_REVIEW_VERSION,
      evidenceReviewStatus:safe.evidenceReviewStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaCandidateEvidenceReview(review) {
    const safe = evaluateGlobalShoppingPublicBetaCandidateEvidenceReview(review || {});
    safe.rows = buildGlobalShoppingPublicBetaCandidateEvidenceRows(safe);
    safe.sections = buildGlobalShoppingPublicBetaCandidateEvidenceSections(safe);
    safe.externalUrl = null;
    safe.platformUrl = null;
    safe.providerUrl = null;
    safe.bookingUrl = null;
    safe.checkoutUrl = null;
    safe.paymentUrl = null;
    safe.orderUrl = null;
    safe.buyButtonEnabled = false;
    safe.checkoutButtonEnabled = false;
    safe.paymentButtonEnabled = false;
    return safe;
  }

  function buildGlobalShoppingPublicBetaCandidateEvidenceReview(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaCandidateEvidenceReview(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaCandidateEvidenceReview({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaCandidateEvidenceReview = {
    GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_EVIDENCE_REVIEW_VERSION,
    REVIEW_NAME,
    buildGlobalShoppingPublicBetaCandidateEvidenceReview,
    evaluateGlobalShoppingPublicBetaCandidateEvidenceReview,
    buildGlobalShoppingPublicBetaCandidateEvidenceRows,
    buildGlobalShoppingPublicBetaCandidateEvidenceSections,
    buildGlobalShoppingPublicBetaCandidateEvidenceReviewAuditDraft,
    sanitizeGlobalShoppingPublicBetaCandidateEvidenceReview
  };
})();
