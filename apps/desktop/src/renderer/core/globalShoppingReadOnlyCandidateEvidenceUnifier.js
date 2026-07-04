;(function () {
  "use strict";

  const GLOBAL_SHOPPING_READ_ONLY_CANDIDATE_EVIDENCE_UNIFIER_VERSION = "4.1.8";
  const VIEW_NAME = "global_shopping_read_only_candidate_evidence_unifier_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, candidate_evidence_only:true };
  const TRUST_LEVELS = { high:true, medium:true, low:true, needs_review:true };
  const SECRET_TEXT_RE = /token|apiKey|secret|password|credential/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
  function bool(value) { return value === true; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function card(cardId, label, value, tone) {
    return { cardId:text(cardId), label:text(label), value:text(value), tone:/^(info|warning|blocked)$/.test(tone) ? tone : "info", redacted:true };
  }
  function safeMode(value) {
    const mode = text(value || "candidate_evidence_only");
    return ALLOWED_MODES[mode] ? mode : "candidate_evidence_only";
  }
  function safeTrustLevel(value) {
    const trustLevel = text(value || "needs_review");
    return TRUST_LEVELS[trustLevel] ? trustLevel : "needs_review";
  }
  function detectBlockedReasons(input) {
    const safe = obj(input);
    const reasons = [];
    if (safe.externalUrl != null || safe.platformUrl != null || safe.providerUrl != null) reasons.push("external_or_provider_url_detected");
    if (safe.bookingUrl != null || safe.checkoutUrl != null || safe.paymentUrl != null || safe.orderUrl != null) reasons.push("transaction_url_detected");
    if (bool(safe.buyButtonEnabled) || bool(safe.checkoutButtonEnabled) || bool(safe.paymentButtonEnabled)) reasons.push("transaction_button_enabled");
    if (safe.rawRequest != null || safe.rawResponse != null || safe.providerPayload != null) reasons.push("raw_provider_payload_detected");
    if (SECRET_TEXT_RE.test(text(safe.secretValue || safe.apiKeyValue || safe.tokenValue || ""))) reasons.push("secret_or_unsafe_field_detected");
    if (toArray(safe.riskNotes).some(function (item) { return SECRET_TEXT_RE.test(text(item)); })) reasons.push("secret_or_unsafe_field_detected");
    return reasons;
  }
  function buildEvidence(input) {
    const safe = obj(input);
    return {
      candidateId:text(safe.candidateId || safe.quoteId || "candidate-evidence"),
      category:text(safe.category || "全球购候选价"),
      sourceLabel:text(safe.sourceLabel || safe.providerName || ""),
      observedPrice:number(safe.observedPrice),
      normalizedPrice:number(safe.normalizedPrice),
      currency:text(safe.currency || ""),
      taxIncluded:safe.taxIncluded === true ? true : (safe.taxIncluded === false ? false : null),
      shippingIncluded:safe.shippingIncluded === true ? true : (safe.shippingIncluded === false ? false : null),
      serviceFeeIncluded:safe.serviceFeeIncluded === true ? true : (safe.serviceFeeIncluded === false ? false : null),
      officialAnchorAvailable:safe.officialAnchorAvailable === true,
      evidenceTimestampLabel:text(safe.evidenceTimestampLabel || safe.observedAtLabel || safe.timestampLabel || ""),
      trustLevel:safeTrustLevel(safe.trustLevel),
      riskNotes:toArray(safe.riskNotes).map(text).filter(Boolean),
      readOnly:true,
      providerZeroLocked:true,
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
    };
  }

  function evaluateGlobalShoppingReadOnlyCandidateEvidenceUnifier(input) {
    const safe = obj(input);
    const evidence = buildEvidence(safe);
    const blockedReasons = detectBlockedReasons(safe);
    const missingCurrency = !evidence.currency;
    const missingSource = !evidence.sourceLabel;
    const missingObservedPrice = evidence.observedPrice == null;
    const missingNormalizedPrice = evidence.normalizedPrice == null;
    const status = blockedReasons.length
      ? "blocked"
      : (missingCurrency || missingSource || missingObservedPrice || missingNormalizedPrice ? "needs_review" : "ready");
    return clone({
      viewName:VIEW_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_CANDIDATE_EVIDENCE_UNIFIER_VERSION,
      mode:safeMode(safe.mode),
      status,
      title:"Read-Only Candidate Evidence Unifier",
      candidateEvidence:evidence,
      blockedReasons,
      userFacingSummary:{
        title:"候选价证据",
        resultLabel:status === "ready" ? "候选价证据已准备" : (status === "blocked" ? "候选价证据已阻断" : "候选价证据仍需复核"),
        caveat:"当前仍为只读候选证据，以平台实时页面为准。"
      },
      rows:buildGlobalShoppingReadOnlyCandidateEvidenceRows({ status, candidateEvidence:evidence }),
      cards:buildGlobalShoppingReadOnlyCandidateEvidenceCards({ status, candidateEvidence:evidence }),
      safety:{
        readOnly:true,
        providerZeroLocked:true,
        rawUserTextStored:false,
        rawResponseStored:false,
        rawRequestStored:false,
        secretStored:false,
        fileWrite:false,
        download:false,
        openExternal:false,
        windowOpen:false,
        redacted:true
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

  function buildGlobalShoppingReadOnlyCandidateEvidenceRows(input) {
    const safe = obj(input);
    const evidence = safe.candidateEvidence && typeof safe.candidateEvidence === "object" ? safe.candidateEvidence : buildEvidence(safe);
    const status = text(safe.status || "needs_review");
    const label = obj(safe.userFacingSummary).resultLabel || (status === "ready" ? "候选价证据已准备" : (status === "blocked" ? "候选价证据已阻断" : "候选价证据仍需复核"));
    return clone([
      row("candidate_evidence_status", "候选价证据", label, status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("candidate_evidence_source", "来源与时间", (evidence.sourceLabel || "来源待补充") + (evidence.evidenceTimestampLabel ? " / " + evidence.evidenceTimestampLabel : ""), evidence.sourceLabel && evidence.evidenceTimestampLabel ? "pass" : "warning"),
      row("candidate_evidence_trust", "可信度", evidence.trustLevel, evidence.trustLevel === "high" || evidence.trustLevel === "medium" ? "pass" : "warning"),
      row("candidate_evidence_risk", "风险说明", evidence.riskNotes.join(" / ") || "当前仍为只读候选证据", evidence.riskNotes.length ? "warning" : "pass")
    ]);
  }

  function buildGlobalShoppingReadOnlyCandidateEvidenceCards(input) {
    const safe = obj(input);
    const evidence = safe.candidateEvidence && typeof safe.candidateEvidence === "object" ? safe.candidateEvidence : buildEvidence(safe);
    return clone([
      card("candidate_evidence_observed_price", "观察价", evidence.observedPrice == null ? "待补充" : (evidence.currency + " " + String(evidence.observedPrice)), evidence.observedPrice == null ? "warning" : "info"),
      card("candidate_evidence_normalized_price", "归一化价格", evidence.normalizedPrice == null ? "待补充" : (evidence.currency + " " + String(evidence.normalizedPrice)), evidence.normalizedPrice == null ? "warning" : "info"),
      card("candidate_evidence_anchor", "官方价锚点", evidence.officialAnchorAvailable ? "已存在对比参考" : "待补充对比参考", evidence.officialAnchorAvailable ? "info" : "warning")
    ]);
  }

  function buildGlobalShoppingReadOnlyCandidateEvidenceAuditDraft(input) {
    const safe = evaluateGlobalShoppingReadOnlyCandidateEvidenceUnifier(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_READ_ONLY_CANDIDATE_EVIDENCE_UNIFIER_AUDIT_DRAFT",
      viewName:VIEW_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_CANDIDATE_EVIDENCE_UNIFIER_VERSION,
      status:safe.status,
      blockedReasonCount:safe.blockedReasons.length,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      externalUrl:null,
      platformUrl:null,
      providerUrl:null,
      buyButtonEnabled:false,
      checkoutButtonEnabled:false,
      paymentButtonEnabled:false,
      rawRequestStored:false,
      rawResponseStored:false,
      secretStored:false,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingReadOnlyCandidateEvidenceUnifier(input) {
    return evaluateGlobalShoppingReadOnlyCandidateEvidenceUnifier(input || {});
  }

  window.WeishanGlobalShoppingReadOnlyCandidateEvidenceUnifier = {
    GLOBAL_SHOPPING_READ_ONLY_CANDIDATE_EVIDENCE_UNIFIER_VERSION,
    VIEW_NAME,
    buildGlobalShoppingReadOnlyCandidateEvidenceUnifier:sanitizeGlobalShoppingReadOnlyCandidateEvidenceUnifier,
    evaluateGlobalShoppingReadOnlyCandidateEvidenceUnifier,
    buildGlobalShoppingReadOnlyCandidateEvidenceRows,
    buildGlobalShoppingReadOnlyCandidateEvidenceCards,
    buildGlobalShoppingReadOnlyCandidateEvidenceAuditDraft,
    sanitizeGlobalShoppingReadOnlyCandidateEvidenceUnifier
  };
})();
