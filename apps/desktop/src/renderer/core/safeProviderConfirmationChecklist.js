;(function () {
  "use strict";

  const SAFE_PROVIDER_CONFIRMATION_CHECKLIST_VERSION = "2.1.72";
  const CHECKLIST_NAME = "safe_provider_confirmation_checklist_v1";
  const FORBIDDEN_NAME_RE = /(token|key|secret|password|auth|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|passport|idCard|bank|card|rawUrl|rawResponse|rawHtml|screenshot)/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
  function hostFrom(value) { try { return text(value) ? new URL(text(value)).hostname : ""; } catch (_) { return ""; } }
  function stripUnsafe(value) {
    if (Array.isArray(value)) return value.map(stripUnsafe).filter(function (item) { return item !== undefined; });
    if (!value || typeof value !== "object") return value;
    const result = {};
    Object.keys(value).forEach(function (name) {
      const raw = value[name];
      const allowedNullUrl = /Url$/.test(name) && raw === null;
      if (FORBIDDEN_NAME_RE.test(name) && !allowedNullUrl) return;
      const next = stripUnsafe(raw);
      if (next !== undefined) result[name] = next;
    });
    return result;
  }
  function selectedSummary(candidate) {
    const safe = stripUnsafe(candidate && typeof candidate === "object" ? candidate : {}) || {};
    return {
      quoteId: text(safe.quoteId || safe.selectedQuoteId || ""),
      rank: number(safe.rank || safe.selectedRank),
      providerName: text(safe.providerName || safe.selectedProviderName || ""),
      currency: text(safe.currency || "CNY"),
      totalPrice: number(safe.totalPrice || safe.selectedTotalPrice),
      safeProviderHandoffReady: safe.safeProviderHandoffReady === true,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      redacted: true
    };
  }
  function evaluateSafeProviderConfirmationReadiness(input) {
    try {
      const safe = input && typeof input === "object" ? input : {};
      const selected = selectedSummary(safe.selectedCandidate || safe.candidate || {});
      const url = text(safe.safeProviderHandoffUrl || safe.providerConfirmationUrl || (safe.gate && safe.gate.safeProviderHandoffUrl) || "");
      const gateStatus = text(safe.safeHandoffGateStatus || safe.status || (safe.gate && safe.gate.status) || "");
      const candidateDecision = text(safe.candidateDecision || (safe.gate && safe.gate.candidateDecision) || "");
      const host = text(safe.displayHost || safe.safeProviderHandoffHost || (safe.gate && safe.gate.safeProviderHandoffHost) || hostFrom(url));
      const hasSelected = !!(selected.quoteId || selected.providerName || selected.totalPrice != null || safe.selectedCandidate || safe.candidate);
      const unsafe = !url || gateStatus === "blocked" || candidateDecision === "blocked" || /payment|checkout|order|booking/i.test(url);
      const status = !hasSelected ? "disabled" : (!url ? "disabled" : (unsafe ? "blocked" : "ready"));
      return clone({ status, hasSelectedCandidate:hasSelected, safeHandoffReady:status === "ready", displayHost:host, selectedCandidateSummary:selected, redacted:true });
    } catch (error) {
      return clone({ status:"failed_safe", hasSelectedCandidate:false, safeHandoffReady:false, displayHost:"", selectedCandidateSummary:null, redacted:true });
    }
  }
  function buildSafeProviderConfirmationChecklist(input) {
    try {
      const safe = input && typeof input === "object" ? input : {};
      const readiness = evaluateSafeProviderConfirmationReadiness(safe);
      const providerName = text(safe.providerName || (safe.selectedCandidate && safe.selectedCandidate.providerName) || "可信平台");
      const selected = readiness.selectedCandidateSummary || selectedSummary(safe.selectedCandidate || {});
      const gatePass = readiness.status === "ready";
      return clone({
        checklistName: CHECKLIST_NAME,
        appVersion: SAFE_PROVIDER_CONFIRMATION_CHECKLIST_VERSION,
        status: readiness.status,
        providerName,
        displayHost: readiness.displayHost,
        selectedQuoteId: selected.quoteId || "",
        selectedCandidateSummary: selected,
        checklistItems: [
          { itemId:"external_platform_notice", label:"将打开外部可信平台页面", status:"pass" },
          { itemId:"no_payment_by_weishan", label:"唯珊不会付款、不会下单", status:"pass" },
          { itemId:"no_identity_upload", label:"唯珊不会上传证件或银行卡", status:"pass" },
          { itemId:"platform_final_terms", label:"价格、库存、税费和规则以平台页面为准", status:"pass" },
          { itemId:"safe_handoff_gate", label:"平台确认链接已通过安全检查", status:gatePass ? "pass" : "blocked" }
        ],
        actions: { canContinueToProvider:gatePass, requiresUserConfirmation:true, canPayHere:false, canOrderHere:false, canUploadIdentityHere:false },
        safety: { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, payment:false, order:false, identityUpload:false, redacted:true },
        redacted: true
      });
    } catch (error) {
      return clone({ checklistName:CHECKLIST_NAME, appVersion:SAFE_PROVIDER_CONFIRMATION_CHECKLIST_VERSION, status:"failed_safe", providerName:"", displayHost:"", selectedQuoteId:"", selectedCandidateSummary:null, checklistItems:[], actions:{ canContinueToProvider:false, requiresUserConfirmation:true, canPayHere:false, canOrderHere:false, canUploadIdentityHere:false }, safety:{ bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, payment:false, order:false, identityUpload:false, redacted:true }, redacted:true });
    }
  }
  function sanitizeSafeProviderConfirmationChecklist(input) {
    const model = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    return clone(Object.assign({}, model, { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true }));
  }
  function buildSafeProviderConfirmationChecklistAuditDraft(input) {
    const checklist = buildSafeProviderConfirmationChecklist(input);
    return clone({ eventType:"SAFE_PROVIDER_CONFIRMATION_CHECKLIST_AUDIT_DRAFT", checklistName:CHECKLIST_NAME, appVersion:SAFE_PROVIDER_CONFIRMATION_CHECKLIST_VERSION, status:checklist.status, selectedQuoteId:checklist.selectedQuoteId, displayHost:checklist.displayHost, canContinueToProvider:checklist.actions.canContinueToProvider, requiresUserConfirmation:true, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, payment:false, order:false, identityUpload:false, secretStored:false, redacted:true });
  }
  window.WeishanSafeProviderConfirmationChecklist = { SAFE_PROVIDER_CONFIRMATION_CHECKLIST_VERSION, CHECKLIST_NAME, buildSafeProviderConfirmationChecklist, evaluateSafeProviderConfirmationReadiness, buildSafeProviderConfirmationChecklistAuditDraft, sanitizeSafeProviderConfirmationChecklist };
})();
