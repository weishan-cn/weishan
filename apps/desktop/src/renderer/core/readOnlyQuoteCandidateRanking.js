;(function () {
  "use strict";

  const READ_ONLY_QUOTE_CANDIDATE_RANKING_VERSION = "2.1.64";
  const RANKING_NAME = "read_only_quote_candidate_ranking_v1";
  const CLAIM = "当前导入样本中的低价候选";
  const RANKING_EXPLANATION = "仅按导入样本中的只读候选证据排序，平台最终为准。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }

  function isRankable(quote) {
    return quote && typeof quote === "object" && quote.redacted === true && quote.totalPrice != null && quote.bookingUrl == null && quote.payment !== true && quote.order !== true && quote.identityUpload !== true;
  }

  function providerNameSort(a, b) {
    return text(a.providerName || "").localeCompare(text(b.providerName || ""), "zh-Hans-CN", { sensitivity: "base", numeric: true });
  }

  function sourceBreakdownFromQuotes(quotes) {
    const providerIds = Array.from(new Set(quotes.map(function (quote) { return text(quote.providerId || ""); }).filter(Boolean)));
    const fareSources = Array.from(new Set(quotes.map(function (quote) { return text(quote.fareSource || ""); }).filter(Boolean)));
    return { providerCount: providerIds.length, providerIds: providerIds, fareSources: fareSources };
  }

  function sourceSummary(quote) {
    return "来源：" + (text(quote.providerName || "") || "只读沙盒") + " / " + (text(quote.responseShape || "") || text(quote.fareSource || "导入样本"));
  }

  function sanitizeCandidate(quote, rank) {
    return {
      rank: rank,
      quoteId: text(quote.quoteId || ("quote_" + rank)),
      providerName: text(quote.providerName || ""),
      providerId: text(quote.providerId || ""),
      providerMode: text(quote.providerMode || "sandbox_read_only"),
      fareSource: text(quote.fareSource || "sandbox_read_only_import"),
      responseShape: text(quote.responseShape || "unsupported"),
      route: quote.route && typeof quote.route === "object" ? clone(quote.route) : {},
      departureDate: text(quote.departureDate || ""),
      currency: text(quote.currency || ""),
      baseFare: number(quote.baseFare),
      taxesAndFees: number(quote.taxesAndFees),
      providerFees: number(quote.providerFees),
      totalPrice: number(quote.totalPrice),
      freshnessMinutes: number(quote.freshnessMinutes),
      taxFeeIntegrityStatus: text(quote.taxFeeIntegrityStatus || "complete"),
      safeProviderHandoffReady: quote.safeProviderHandoffReady === true,
      safeProviderHandoffUrl: quote.safeProviderHandoffReady === true ? quote.safeProviderHandoffUrl || null : null,
      safeProviderHandoffDisplayHost: quote.safeProviderHandoffReady === true ? text(quote.safeProviderHandoffDisplayHost || quote.safeProviderHandoffHost || "") : "",
      sourceSummary: text(quote.sourceSummary || sourceSummary(quote)),
      selectedSourceSummary: text(quote.selectedSourceSummary || sourceSummary(quote)),
      selected: false,
      showableAsRealPrice: false,
      showableAsCandidateEvidence: true,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    };
  }

  function rankReadOnlyQuoteCandidates(quotes, options) {
    const list = Array.isArray(quotes) ? quotes : [];
    const opts = options && typeof options === "object" ? options : {};
    const rankable = list.filter(isRankable).sort(function (a, b) {
      const totalA = number(a.totalPrice);
      const totalB = number(b.totalPrice);
      if (totalA !== totalB) return (totalA == null ? 999999 : totalA) - (totalB == null ? 999999 : totalB);
      const freshA = number(a.freshnessMinutes);
      const freshB = number(b.freshnessMinutes);
      if (freshA !== freshB) return (freshA == null ? 999999 : freshA) - (freshB == null ? 999999 : freshB);
      const feeA = number(a.providerFees);
      const feeB = number(b.providerFees);
      if (feeA !== feeB) return (feeA == null ? 999999 : feeA) - (feeB == null ? 999999 : feeB);
      return providerNameSort(a, b);
    });
    const sourceBreakdown = sourceBreakdownFromQuotes(rankable);
    return clone({
      rankingName: RANKING_NAME,
      appVersion: READ_ONLY_QUOTE_CANDIDATE_RANKING_VERSION,
      rankingScope: text(opts.rankingScope || "imported_sandbox_quotes_only"),
      claim: CLAIM,
      rankingExplanation: RANKING_EXPLANATION,
      sourceBreakdown: sourceBreakdown,
      providerCount: sourceBreakdown.providerCount,
      providerIds: sourceBreakdown.providerIds.slice(),
      fareSources: sourceBreakdown.fareSources.slice(),
      rankedCandidates: rankable.map(function (quote, index) { return sanitizeCandidate(quote, index + 1); }),
      canClaimLowestAcrossWeb: false,
      canClaimFinalBookablePrice: false,
      canReplaceMainResultCard: false,
      showableAsRealPrice: false,
      showableAsCandidateEvidence: rankable.length > 0,
      redacted: true
    });
  }

  function buildTopReadOnlyQuoteCandidates(quotes, options) {
    const ranked = rankReadOnlyQuoteCandidates(quotes, options);
    return clone(Object.assign({}, ranked, { topCandidates: ranked.rankedCandidates.slice(0, 3) }));
  }

  function buildReadOnlyQuoteRankingAuditDraft(quotes, options) {
    const ranking = buildTopReadOnlyQuoteCandidates(quotes, options);
    return clone({
      eventType: "READ_ONLY_QUOTE_CANDIDATE_RANKING_AUDIT_DRAFT",
      rankingName: RANKING_NAME,
      appVersion: READ_ONLY_QUOTE_CANDIDATE_RANKING_VERSION,
      rankingScope: ranking.rankingScope,
      claim: ranking.claim,
      rankingExplanation: ranking.rankingExplanation,
      sourceBreakdown: ranking.sourceBreakdown,
      topCandidateCount: ranking.topCandidates.length,
      canClaimLowestAcrossWeb: false,
      canClaimFinalBookablePrice: false,
      canReplaceMainResultCard: false,
      bookingUrl: null,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    });
  }

  window.WeishanReadOnlyQuoteCandidateRanking = {
    READ_ONLY_QUOTE_CANDIDATE_RANKING_VERSION,
    RANKING_NAME,
    rankReadOnlyQuoteCandidates,
    buildTopReadOnlyQuoteCandidates,
    buildReadOnlyQuoteRankingAuditDraft
  };
})();
