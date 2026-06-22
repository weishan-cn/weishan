;(function () {
  "use strict";

  const READ_ONLY_QUOTE_CANDIDATE_RANKING_VERSION = "2.1.51";
  const RANKING_NAME = "read_only_quote_candidate_ranking_v1";
  const CLAIM = "当前导入样本中的低价候选";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }

  function isRankable(quote) {
    return quote && typeof quote === "object" && quote.redacted === true && quote.totalPrice != null && quote.bookingUrl == null && quote.payment !== true && quote.order !== true && quote.identityUpload !== true;
  }

  function sanitizeCandidate(quote, rank) {
    return {
      rank:rank,
      quoteId:text(quote.quoteId || ("quote_" + rank)),
      providerName:text(quote.providerName || ""),
      providerId:text(quote.providerId || ""),
      providerMode:text(quote.providerMode || "sandbox_read_only"),
      fareSource:text(quote.fareSource || "sandbox_read_only_import"),
      route:quote.route && typeof quote.route === "object" ? clone(quote.route) : {},
      departureDate:text(quote.departureDate || ""),
      currency:text(quote.currency || ""),
      baseFare:number(quote.baseFare),
      taxesAndFees:number(quote.taxesAndFees),
      providerFees:number(quote.providerFees),
      totalPrice:number(quote.totalPrice),
      freshnessMinutes:number(quote.freshnessMinutes),
      taxFeeIntegrityStatus:text(quote.taxFeeIntegrityStatus || "complete"),
      safeProviderHandoffReady:quote.safeProviderHandoffReady === true,
      safeProviderHandoffUrl:quote.safeProviderHandoffReady === true ? quote.safeProviderHandoffUrl || null : null,
      safeProviderHandoffDisplayHost:quote.safeProviderHandoffReady === true ? text(quote.safeProviderHandoffDisplayHost || quote.safeProviderHandoffHost || "") : "",
      selected:false,
      showableAsRealPrice:false,
      showableAsCandidateEvidence:true,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      identityUpload:false,
      redacted:true
    };
  }

  function rankReadOnlyQuoteCandidates(quotes, options) {
    const list = Array.isArray(quotes) ? quotes : [];
    const opts = options && typeof options === "object" ? options : {};
    const rankable = list.filter(isRankable).sort(function (a, b) {
      const total = number(a.totalPrice) - number(b.totalPrice);
      if (total !== 0) return total;
      const fresh = (number(a.freshnessMinutes) == null ? 999999 : number(a.freshnessMinutes)) - (number(b.freshnessMinutes) == null ? 999999 : number(b.freshnessMinutes));
      if (fresh !== 0) return fresh;
      return (number(a.providerFees) == null ? 999999 : number(a.providerFees)) - (number(b.providerFees) == null ? 999999 : number(b.providerFees));
    });
    return clone({
      rankingName:RANKING_NAME,
      appVersion:READ_ONLY_QUOTE_CANDIDATE_RANKING_VERSION,
      rankingScope:text(opts.rankingScope || "imported_sandbox_quotes_only"),
      claim:CLAIM,
      rankedCandidates:rankable.map(function (quote, index) { return sanitizeCandidate(quote, index + 1); }),
      canClaimLowestAcrossWeb:false,
      canClaimFinalBookablePrice:false,
      canReplaceMainResultCard:false,
      showableAsRealPrice:false,
      showableAsCandidateEvidence:rankable.length > 0,
      redacted:true
    });
  }

  function buildTopReadOnlyQuoteCandidates(quotes, options) {
    const ranked = rankReadOnlyQuoteCandidates(quotes, options);
    return clone(Object.assign({}, ranked, {
      topCandidates:ranked.rankedCandidates.slice(0, 3)
    }));
  }

  function buildReadOnlyQuoteRankingAuditDraft(quotes, options) {
    const ranking = buildTopReadOnlyQuoteCandidates(quotes, options);
    return clone({
      eventType:"READ_ONLY_QUOTE_CANDIDATE_RANKING_AUDIT_DRAFT",
      rankingName:RANKING_NAME,
      appVersion:READ_ONLY_QUOTE_CANDIDATE_RANKING_VERSION,
      rankingScope:ranking.rankingScope,
      claim:ranking.claim,
      topCandidateCount:ranking.topCandidates.length,
      canClaimLowestAcrossWeb:false,
      canClaimFinalBookablePrice:false,
      canReplaceMainResultCard:false,
      bookingUrl:null,
      payment:false,
      order:false,
      identityUpload:false,
      redacted:true
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
