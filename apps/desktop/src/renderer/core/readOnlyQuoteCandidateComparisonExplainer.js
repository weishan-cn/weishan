;(function () {
  "use strict";

  const READ_ONLY_QUOTE_CANDIDATE_COMPARISON_EXPLAINER_VERSION = "4.0.3";
  const EXPLAINER_NAME = "read_only_quote_candidate_comparison_explainer_v1";
  const FORBIDDEN_NAME_RE = /(rawProviderResponse|rawResponse|rawPayload|token|key|secret|password|auth|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|identity|passport|bank|card)/i;
  const FORBIDDEN_TEXT_RE = /全网最低|最低价保证|真实最终价|已锁价|可以出票|可直接出票|付款|下单/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }

  function safeText(value) {
    return text(value).replace(FORBIDDEN_TEXT_RE, "本地只读候选证据");
  }

  function stripUnsafe(value) {
    if (Array.isArray(value)) return value.map(stripUnsafe).filter(function (item) { return item !== undefined; });
    if (!value || typeof value !== "object") return value;
    const result = {};
    Object.keys(value).forEach(function (name) {
      if (FORBIDDEN_NAME_RE.test(name)) return;
      const next = stripUnsafe(value[name]);
      if (next !== undefined) result[name] = next;
    });
    return result;
  }

  function normalizeCandidate(candidate, index) {
    const safe = stripUnsafe(candidate && typeof candidate === "object" ? candidate : {}) || {};
    return {
      rank: number(safe.rank) || index + 1,
      quoteId: safeText(safe.quoteId || ""),
      providerName: safeText(safe.providerName || safe.selectedProviderName || "只读候选"),
      providerMode: safeText(safe.providerMode || "sandbox_read_only"),
      responseShape: safeText(safe.responseShape || "unsupported"),
      fareSource: safeText(safe.fareSource || "sandbox_read_only_import"),
      currency: safeText(safe.currency || "CNY"),
      totalPrice: number(safe.totalPrice),
      baseFare: number(safe.baseFare),
      taxesAndFees: number(safe.taxesAndFees),
      providerFees: number(safe.providerFees),
      freshnessMinutes: number(safe.freshnessMinutes),
      safeProviderHandoffReady: safe.safeProviderHandoffReady === true,
      redacted: true
    };
  }

  function sortedCandidates(candidates) {
    return (Array.isArray(candidates) ? candidates : []).slice(0, 3).map(normalizeCandidate);
  }

  function priceComplete(candidate) {
    return candidate.totalPrice != null && candidate.baseFare != null && candidate.taxesAndFees != null && candidate.providerFees != null;
  }

  function explainReadOnlyQuoteCandidate(candidate, options) {
    const safeOptions = options && typeof options === "object" ? options : {};
    const item = normalizeCandidate(candidate, number(safeOptions.index) || 0);
    const pros = [];
    const cautions = [
      "平台最终为准",
      "未锁价",
      "不代表可出票"
    ];
    if (priceComplete(item)) pros.push("价格拆分完整。");
    if (item.totalPrice != null) pros.push("可用于本地只读候选对比。");
    if (item.freshnessMinutes != null) pros.push("包含 freshness 证据。");
    if (item.safeProviderHandoffReady === true) {
      pros.push("平台确认链接已通过安全检查。");
    } else {
      cautions.push("当前候选的平台确认链接不可用。");
    }
    return clone(Object.assign({}, item, {
      handoffStatus: item.safeProviderHandoffReady ? "ready" : "disabled",
      pros: pros.length ? pros.map(safeText) : ["仅作为本地只读候选证据。"],
      cautions: cautions.map(safeText),
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      redacted: true
    }));
  }

  function buildReadOnlyQuoteComparisonTable(candidates, options) {
    return sortedCandidates(candidates).map(function (candidate, index) {
      return explainReadOnlyQuoteCandidate(candidate, Object.assign({}, options || {}, { index: index }));
    });
  }

  function buildSummary(table) {
    const priced = table.filter(function (candidate) { return candidate.totalPrice != null; }).slice().sort(function (a, b) { return a.totalPrice - b.totalPrice; });
    const lowest = priced[0] || null;
    return {
      lowestInLocalSampleRank: lowest ? lowest.rank : null,
      lowestInLocalSampleProvider: lowest ? lowest.providerName : "",
      lowestInLocalSampleTotal: lowest ? lowest.totalPrice : null,
      caveat: "仅比较本地只读候选样本，平台最终为准。"
    };
  }

  function buildReadOnlyQuoteCandidateComparison(candidates, options) {
    try {
      if (!Array.isArray(candidates)) {
        return clone({
          explainerName: EXPLAINER_NAME,
          appVersion: READ_ONLY_QUOTE_CANDIDATE_COMPARISON_EXPLAINER_VERSION,
          status: "failed_safe",
          scope: "top_read_only_candidates",
          table: [],
          summary: buildSummary([]),
          forbiddenClaims: { lowestAcrossWeb:false, finalBookablePrice:false, priceLocked:false, ticketAvailable:false },
          bookingUrl: null,
          checkoutUrl: null,
          paymentUrl: null,
          orderUrl: null,
          redacted: true
        });
      }
      const table = buildReadOnlyQuoteComparisonTable(candidates, options);
      return clone({
        explainerName: EXPLAINER_NAME,
        appVersion: READ_ONLY_QUOTE_CANDIDATE_COMPARISON_EXPLAINER_VERSION,
        status: table.length ? "ready" : "empty",
        scope: "top_read_only_candidates",
        table: table,
        summary: buildSummary(table),
        forbiddenClaims: {
          lowestAcrossWeb: false,
          finalBookablePrice: false,
          priceLocked: false,
          ticketAvailable: false
        },
        bookingUrl: null,
        checkoutUrl: null,
        paymentUrl: null,
        orderUrl: null,
        redacted: true
      });
    } catch (error) {
      return clone({
        explainerName: EXPLAINER_NAME,
        appVersion: READ_ONLY_QUOTE_CANDIDATE_COMPARISON_EXPLAINER_VERSION,
        status: "failed_safe",
        scope: "top_read_only_candidates",
        table: [],
        summary: buildSummary([]),
        forbiddenClaims: { lowestAcrossWeb:false, finalBookablePrice:false, priceLocked:false, ticketAvailable:false },
        bookingUrl: null,
        checkoutUrl: null,
        paymentUrl: null,
        orderUrl: null,
        redacted: true
      });
    }
  }

  function buildReadOnlyQuoteCandidateComparisonAuditDraft(input) {
    const safe = input && typeof input === "object" ? input : {};
    const comparison = buildReadOnlyQuoteCandidateComparison(Array.isArray(safe.candidates) ? safe.candidates : safe.topCandidates, safe.options || {});
    return clone({
      eventType: "READ_ONLY_QUOTE_CANDIDATE_COMPARISON_AUDIT_DRAFT",
      explainerName: EXPLAINER_NAME,
      appVersion: READ_ONLY_QUOTE_CANDIDATE_COMPARISON_EXPLAINER_VERSION,
      status: comparison.status,
      candidateCount: comparison.table.length,
      lowestInLocalSampleRank: comparison.summary.lowestInLocalSampleRank,
      forbiddenClaims: comparison.forbiddenClaims,
      rawResponseStored: false,
      secretStored: false,
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

  window.WeishanReadOnlyQuoteCandidateComparisonExplainer = {
    READ_ONLY_QUOTE_CANDIDATE_COMPARISON_EXPLAINER_VERSION,
    EXPLAINER_NAME,
    buildReadOnlyQuoteCandidateComparison,
    explainReadOnlyQuoteCandidate,
    buildReadOnlyQuoteComparisonTable,
    buildReadOnlyQuoteCandidateComparisonAuditDraft
  };
})();
