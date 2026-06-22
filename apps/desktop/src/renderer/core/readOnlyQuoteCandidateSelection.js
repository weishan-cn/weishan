;(function () {
  "use strict";

  const READ_ONLY_QUOTE_CANDIDATE_SELECTION_VERSION = "2.1.51";
  const SELECTION_NAME = "read_only_quote_candidate_selection_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }

  function safeHandoff(candidate) {
    const ready = candidate && candidate.safeProviderHandoffReady === true && !!candidate.safeProviderHandoffUrl;
    return {
      ready:ready,
      buttonLabel:"去平台确认",
      buttonDisabled:!ready,
      requiresConfirmation:true,
      safeProviderHandoffUrl:ready ? candidate.safeProviderHandoffUrl : null,
      safeProviderHandoffDisplayHost:ready ? text(candidate.safeProviderHandoffDisplayHost || candidate.safeProviderHandoffHost || "") : "",
      autoOpen:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      identityUpload:false
    };
  }

  function emptySelection(status, reason) {
    return {
      selectionName:SELECTION_NAME,
      appVersion:READ_ONLY_QUOTE_CANDIDATE_SELECTION_VERSION,
      status:status || "idle",
      selected:false,
      selectedQuoteId:null,
      selectedRank:null,
      providerName:"",
      providerMode:"sandbox_read_only",
      fareSource:"sandbox_read_only_import",
      currency:"",
      totalPrice:null,
      caveat:"价格、库存、税费和规则以平台页面为准。",
      labels:["只读候选价", "平台最终为准", "未锁价", "不代表可出票"],
      safeProviderHandoff:safeHandoff(null),
      reason:reason || "",
      redacted:true
    };
  }

  function selectReadOnlyQuoteCandidate(ranking, quoteId, options) {
    const safeRanking = ranking && typeof ranking === "object" ? ranking : {};
    const candidates = Array.isArray(safeRanking.topCandidates) ? safeRanking.topCandidates : (Array.isArray(safeRanking.rankedCandidates) ? safeRanking.rankedCandidates : []);
    const id = text(quoteId || (options && options.quoteId) || "");
    const candidate = candidates.find(function (item) { return item && text(item.quoteId) === id; });
    if (!candidate) return clone(emptySelection("rejected", "candidate not found"));
    return clone({
      selectionName:SELECTION_NAME,
      appVersion:READ_ONLY_QUOTE_CANDIDATE_SELECTION_VERSION,
      status:"selected",
      selected:true,
      selectedQuoteId:text(candidate.quoteId),
      selectedRank:candidate.rank || null,
      providerName:text(candidate.providerName || ""),
      providerMode:text(candidate.providerMode || "sandbox_read_only"),
      fareSource:text(candidate.fareSource || "sandbox_read_only_import"),
      currency:text(candidate.currency || ""),
      totalPrice:candidate.totalPrice == null ? null : candidate.totalPrice,
      caveat:"价格、库存、税费和规则以平台页面为准。",
      labels:["只读候选价", "平台最终为准", "未锁价", "不代表可出票"],
      selectedCandidate:Object.assign({}, clone(candidate), { selected:true, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, identityUpload:false, redacted:true }),
      safeProviderHandoff:safeHandoff(candidate),
      redacted:true
    });
  }

  function buildSelectedReadOnlyQuoteCandidateViewModel(selection, options) {
    const safe = selection && typeof selection === "object" ? selection : {};
    if (safe.selected !== true) return clone(emptySelection(text(safe.status || "idle"), text(safe.reason || "")));
    return clone(Object.assign({}, safe, {
      safeProviderHandoff:safeHandoff(safe.selectedCandidate || safe),
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      identityUpload:false,
      autoOpen:false,
      redacted:true
    }));
  }

  function buildReadOnlyQuoteCandidateSelectionAuditDraft(selection, options) {
    const model = buildSelectedReadOnlyQuoteCandidateViewModel(selection, options);
    return clone({
      eventType:"READ_ONLY_QUOTE_CANDIDATE_SELECTION_AUDIT_DRAFT",
      selectionName:SELECTION_NAME,
      appVersion:READ_ONLY_QUOTE_CANDIDATE_SELECTION_VERSION,
      selected:model.selected === true,
      selectedQuoteId:model.selectedQuoteId || null,
      selectedRank:model.selectedRank || null,
      requiresConfirmation:true,
      autoOpen:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      identityUpload:false,
      redacted:true
    });
  }

  window.WeishanReadOnlyQuoteCandidateSelection = {
    READ_ONLY_QUOTE_CANDIDATE_SELECTION_VERSION,
    SELECTION_NAME,
    selectReadOnlyQuoteCandidate,
    buildSelectedReadOnlyQuoteCandidateViewModel,
    buildReadOnlyQuoteCandidateSelectionAuditDraft
  };
})();
