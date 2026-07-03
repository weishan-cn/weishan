;(function () {
  "use strict";

  const READ_ONLY_QUOTE_CANDIDATE_SELECTION_VERSION = "4.1.0";
  const SELECTION_NAME = "read_only_quote_candidate_selection_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }

  function safeHandoff(candidate) {
    const ready = candidate && candidate.safeProviderHandoffReady === true && !!candidate.safeProviderHandoffUrl;
    return {
      ready: ready,
      buttonLabel: "去平台确认",
      buttonDisabled: !ready,
      requiresConfirmation: true,
      safeProviderHandoffUrl: ready ? candidate.safeProviderHandoffUrl : null,
      safeProviderHandoffDisplayHost: ready ? text(candidate.safeProviderHandoffDisplayHost || candidate.safeProviderHandoffHost || "") : "",
      autoOpen: false,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      payment: false,
      order: false,
      identityUpload: false
    };
  }

  function emptySelection(status, reason, ranking) {
    const sourceBreakdown = ranking && ranking.sourceBreakdown ? clone(ranking.sourceBreakdown) : { providerCount: 0, providerIds: [], fareSources: [] };
    return {
      selectionName: SELECTION_NAME,
      appVersion: READ_ONLY_QUOTE_CANDIDATE_SELECTION_VERSION,
      status: status || "idle",
      selected: false,
      selectedQuoteId: null,
      selectedRank: null,
      providerName: "",
      providerMode: "sandbox_read_only",
      responseShape: "unsupported",
      fareSource: "sandbox_read_only_import",
      currency: "",
      totalPrice: null,
      sourceBreakdown: sourceBreakdown,
      selectedSourceSummary: "来源：只读沙盒 / 导入样本",
      selectionWarning: reason || "当前平台确认链接未通过安全检查",
      caveat: "价格、库存、税费和规则以平台页面为准。",
      labels: ["只读候选价", "平台最终为准", "未锁价", "不代表可出票"],
      safeProviderHandoff: safeHandoff(null),
      reason: reason || "",
      redacted: true
    };
  }

  function selectReadOnlyQuoteCandidate(ranking, quoteId, options) {
    const safeRanking = ranking && typeof ranking === "object" ? ranking : {};
    const candidates = Array.isArray(safeRanking.topCandidates) ? safeRanking.topCandidates : (Array.isArray(safeRanking.rankedCandidates) ? safeRanking.rankedCandidates : []);
    const id = text(quoteId || (options && options.quoteId) || "");
    const candidate = candidates.find(function (item) { return item && text(item.quoteId) === id; });
    if (!candidate) return clone(emptySelection("rejected", "candidate not found", safeRanking));
    const sourceSummary = text(candidate.selectedSourceSummary || candidate.sourceSummary || ("来源：" + (text(candidate.providerName || "") || "只读沙盒") + " / " + (text(candidate.responseShape || "") || text(candidate.fareSource || "导入样本"))));
    const warning = candidate.safeProviderHandoffReady === true ? "平台最终为准，不代表已锁价或可出票" : "当前平台确认链接未通过安全检查";
    return clone({
      selectionName: SELECTION_NAME,
      appVersion: READ_ONLY_QUOTE_CANDIDATE_SELECTION_VERSION,
      status: "selected",
      selected: true,
      selectedQuoteId: text(candidate.quoteId),
      selectedRank: candidate.rank || null,
      providerName: text(candidate.providerName || ""),
      providerMode: text(candidate.providerMode || "sandbox_read_only"),
      responseShape: text(candidate.responseShape || "unsupported"),
      fareSource: text(candidate.fareSource || "sandbox_read_only_import"),
      currency: text(candidate.currency || ""),
      totalPrice: candidate.totalPrice == null ? null : candidate.totalPrice,
      sourceBreakdown: clone(safeRanking.sourceBreakdown || { providerCount: 0, providerIds: [], fareSources: [] }),
      selectedSourceSummary: sourceSummary,
      selectionWarning: warning,
      caveat: "价格、库存、税费和规则以平台页面为准。",
      labels: ["只读候选价", "平台最终为准", "未锁价", "不代表可出票"],
      selectedCandidate: Object.assign({}, clone(candidate), {
        selected: true,
        selectedSourceSummary: sourceSummary,
        selectionWarning: warning,
        bookingUrl: null,
        checkoutUrl: null,
        paymentUrl: null,
        orderUrl: null,
        payment: false,
        order: false,
        identityUpload: false,
        redacted: true
      }),
      safeProviderHandoff: safeHandoff(candidate),
      redacted: true
    });
  }

  function buildSelectedReadOnlyQuoteCandidateViewModel(selection, options) {
    const safe = selection && typeof selection === "object" ? selection : {};
    if (safe.selected !== true) return clone(emptySelection(text(safe.status || "idle"), text(safe.reason || ""), safe.sourceBreakdown));
    const selectedCandidate = safe.selectedCandidate && typeof safe.selectedCandidate === "object" ? safe.selectedCandidate : safe;
    const selectedSourceSummary = text(safe.selectedSourceSummary || selectedCandidate.selectedSourceSummary || ("来源：" + (text(selectedCandidate.providerName || "") || "只读沙盒") + " / " + (text(selectedCandidate.responseShape || "") || text(selectedCandidate.fareSource || "导入样本"))));
    const warning = text(safe.selectionWarning || selectedCandidate.selectionWarning || (selectedCandidate.safeProviderHandoffReady === true ? "平台最终为准，不代表已锁价或可出票" : "当前平台确认链接未通过安全检查"));
    return clone(Object.assign({}, safe, {
      selectedSourceSummary: selectedSourceSummary,
      selectionWarning: warning,
      safeProviderHandoff: safeHandoff(selectedCandidate),
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      payment: false,
      order: false,
      identityUpload: false,
      autoOpen: false,
      redacted: true
    }));
  }

  function buildReadOnlyQuoteCandidateSelectionAuditDraft(selection, options) {
    const model = buildSelectedReadOnlyQuoteCandidateViewModel(selection, options);
    return clone({
      eventType: "READ_ONLY_QUOTE_CANDIDATE_SELECTION_AUDIT_DRAFT",
      selectionName: SELECTION_NAME,
      appVersion: READ_ONLY_QUOTE_CANDIDATE_SELECTION_VERSION,
      selected: model.selected === true,
      selectedQuoteId: model.selectedQuoteId || null,
      selectedRank: model.selectedRank || null,
      selectedSourceSummary: model.selectedSourceSummary || null,
      selectionWarning: model.selectionWarning || null,
      requiresConfirmation: true,
      autoOpen: false,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
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
