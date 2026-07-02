;(function () {
  "use strict";

  const READ_ONLY_QUOTE_DELTA_COMPARE_VERSION = "4.0.2";
  const COMPARE_NAME = "read_only_quote_delta_compare_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function topCandidatesFrom(run) {
    const safe = run && typeof run === "object" ? run : {};
    if (Array.isArray(safe.topCandidates)) return safe.topCandidates.slice(0, 3);
    if (Array.isArray(safe.dryRunTopCandidates)) return safe.dryRunTopCandidates.slice(0, 3);
    if (safe.ranking && Array.isArray(safe.ranking.topCandidates)) return safe.ranking.topCandidates.slice(0, 3);
    return [];
  }

  function runIdOf(run) {
    const safe = run && typeof run === "object" ? run : {};
    return text(safe.runId || (safe.historyEntry && safe.historyEntry.runId) || "");
  }

  function candidateKey(candidate) {
    const safe = candidate && typeof candidate === "object" ? candidate : {};
    return text(safe.quoteId || "") + "::" + text(safe.providerId || "") + "::" + text(safe.providerName || "");
  }

  function candidateRankMap(candidates) {
    const map = new Map();
    (Array.isArray(candidates) ? candidates : []).forEach(function (candidate, index) {
      const rank = Number(candidate && candidate.rank) || index + 1;
      map.set(candidateKey(candidate), rank);
    });
    return map;
  }

  function normalizeTopCandidate(candidate) {
    const safe = candidate && typeof candidate === "object" ? candidate : {};
    return {
      rank: Number(safe.rank) || null,
      quoteId: text(safe.quoteId || ""),
      providerId: text(safe.providerId || ""),
      providerName: text(safe.providerName || ""),
      providerMode: text(safe.providerMode || "sandbox_read_only"),
      responseShape: text(safe.responseShape || "unsupported"),
      fareSource: text(safe.fareSource || "sandbox_read_only_import"),
      currency: text(safe.currency || ""),
      baseFare: safe.baseFare == null ? null : safe.baseFare,
      taxesAndFees: safe.taxesAndFees == null ? null : safe.taxesAndFees,
      providerFees: safe.providerFees == null ? null : safe.providerFees,
      totalPrice: safe.totalPrice == null ? null : safe.totalPrice,
      freshnessMinutes: safe.freshnessMinutes == null ? null : safe.freshnessMinutes,
      taxFeeIntegrityStatus: text(safe.taxFeeIntegrityStatus || "complete"),
      safeProviderHandoffReady: safe.safeProviderHandoffReady === true,
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

  function compareReadOnlyQuoteRuns(previousRun, currentRun, options) {
    const prevCandidates = topCandidatesFrom(previousRun).map(normalizeTopCandidate);
    const currCandidates = topCandidatesFrom(currentRun).map(normalizeTopCandidate);
    if (prevCandidates.length < 1 || currCandidates.length < 1) {
      return clone({
        compareName: COMPARE_NAME,
        appVersion: READ_ONLY_QUOTE_DELTA_COMPARE_VERSION,
        status: "not_enough_history",
        scope: "local_read_only_sandbox_runs",
        claim: "仅比较本地只读沙盒运行结果",
        previousRunId: runIdOf(previousRun),
        currentRunId: runIdOf(currentRun),
        topCandidateDelta: {
          previousTotalPrice: null,
          currentTotalPrice: null,
          deltaAmount: null,
          deltaDirection: "unknown",
          previousProviderName: "",
          currentProviderName: "",
          providerChanged: false
        },
        rankChanges: [],
        warnings: [
          "价格、库存、税费和规则以平台页面为准。",
          "本对比仅基于本地只读沙盒运行结果，不代表真实最终价。"
        ],
        canClaimLowestAcrossWeb: false,
        canClaimFinalBookablePrice: false,
        canReplaceMainResultCard: false,
        bookingUrl: null,
        payment: false,
        order: false,
        identityUpload: false,
        sessionEventPayload: {
          type: "DELTA_COMPARED",
          eventType: "DELTA_COMPARED",
          status: "not_enough_history",
          claim: "仅比较本地只读沙盒运行结果",
          bookingUrl: null,
          checkoutUrl: null,
          paymentUrl: null,
          orderUrl: null,
          rawResponseStored: false,
          secretStored: false,
          redacted: true
        },
        redacted: true
      });
    }

    const prevTop = prevCandidates[0];
    const currTop = currCandidates[0];
    const previousTotalPrice = number(prevTop.totalPrice);
    const currentTotalPrice = number(currTop.totalPrice);
    const deltaAmount = previousTotalPrice == null || currentTotalPrice == null ? null : currentTotalPrice - previousTotalPrice;
    const deltaDirection = deltaAmount == null ? "unknown" : (deltaAmount > 0 ? "up" : (deltaAmount < 0 ? "down" : "same"));
    const prevMap = candidateRankMap(prevCandidates);
    const currMap = candidateRankMap(currCandidates);
    const rankChanges = Array.from(new Set([].concat(Array.from(prevMap.keys()), Array.from(currMap.keys())))).map(function (key) {
      const previousRank = prevMap.has(key) ? prevMap.get(key) : null;
      const currentRank = currMap.has(key) ? currMap.get(key) : null;
      if (previousRank == null && currentRank == null) return null;
      return {
        quoteId: key.split("::")[0] || "",
        previousRank: previousRank,
        currentRank: currentRank,
        rankDelta: previousRank == null || currentRank == null ? null : currentRank - previousRank
      };
    }).filter(Boolean).slice(0, 3);

    return clone({
      compareName: COMPARE_NAME,
      appVersion: READ_ONLY_QUOTE_DELTA_COMPARE_VERSION,
      status: "compared",
      scope: "local_read_only_sandbox_runs",
      claim: "仅比较本地只读沙盒运行结果",
      previousRunId: runIdOf(previousRun),
      currentRunId: runIdOf(currentRun),
      topCandidateDelta: {
        previousTotalPrice: previousTotalPrice,
        currentTotalPrice: currentTotalPrice,
        deltaAmount: deltaAmount,
        deltaDirection: deltaDirection,
        previousProviderName: text(prevTop.providerName || ""),
        currentProviderName: text(currTop.providerName || ""),
        providerChanged: text(prevTop.providerName || "") !== text(currTop.providerName || "")
      },
      rankChanges: rankChanges,
      warnings: [
        "价格、库存、税费和规则以平台页面为准。",
        "本对比仅基于本地只读沙盒运行结果，不代表真实最终价。"
      ],
      canClaimLowestAcrossWeb: false,
      canClaimFinalBookablePrice: false,
      canReplaceMainResultCard: false,
      bookingUrl: null,
      payment: false,
      order: false,
      identityUpload: false,
      sessionEventPayload: {
        type: "DELTA_COMPARED",
        eventType: "DELTA_COMPARED",
        status: "compared",
        claim: "仅比较本地只读沙盒运行结果",
        previousRunId: runIdOf(previousRun),
        currentRunId: runIdOf(currentRun),
        bookingUrl: null,
        checkoutUrl: null,
        paymentUrl: null,
        orderUrl: null,
        rawResponseStored: false,
        secretStored: false,
        redacted: true
      },
      redacted: true
    });
  }

  function buildReadOnlyQuoteDeltaSummary(delta, options) {
    const safe = delta && typeof delta === "object" ? delta : {};
    const top = safe.topCandidateDelta && typeof safe.topCandidateDelta === "object" ? safe.topCandidateDelta : {};
    const status = text(safe.status || "not_enough_history");
    const summary = status === "compared"
      ? ("本地只读沙盒运行对比：¥" + text(top.previousTotalPrice == null ? "?" : top.previousTotalPrice) + " → ¥" + text(top.currentTotalPrice == null ? "?" : top.currentTotalPrice) + " · " + text(top.deltaDirection || "unknown"))
      : (status === "not_enough_history" ? "本地只读沙盒运行对比：历史不足" : "本地只读沙盒运行对比：安全失败");
    return clone({
      compareName: COMPARE_NAME,
      appVersion: READ_ONLY_QUOTE_DELTA_COMPARE_VERSION,
      status: status,
      scope: text(safe.scope || "local_read_only_sandbox_runs"),
      claim: text(safe.claim || "仅比较本地只读沙盒运行结果"),
      previousRunId: text(safe.previousRunId || ""),
      currentRunId: text(safe.currentRunId || ""),
      topCandidateDelta: clone(top),
      rankChanges: Array.isArray(safe.rankChanges) ? safe.rankChanges.slice(0, 3) : [],
      warnings: Array.isArray(safe.warnings) ? safe.warnings.slice(0, 3) : [
        "价格、库存、税费和规则以平台页面为准。",
        "本对比仅基于本地只读沙盒运行结果，不代表真实最终价。"
      ],
      summary: summary,
      compareStatus: status,
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

  function buildReadOnlyQuoteDeltaCompareAuditDraft(input) {
    const safe = input && typeof input === "object" ? input : {};
    const delta = safe.delta && typeof safe.delta === "object" ? safe.delta : compareReadOnlyQuoteRuns(safe.previousRun, safe.currentRun, safe.options || {});
    return clone(Object.assign({
      eventType: "READ_ONLY_QUOTE_DELTA_COMPARE_AUDIT_DRAFT"
    }, buildReadOnlyQuoteDeltaSummary(delta, safe.options || {}), {
      appVersion: READ_ONLY_QUOTE_DELTA_COMPARE_VERSION,
      redacted: true
    }));
  }

  window.WeishanReadOnlyQuoteDeltaCompare = {
    READ_ONLY_QUOTE_DELTA_COMPARE_VERSION,
    COMPARE_NAME,
    compareReadOnlyQuoteRuns,
    buildReadOnlyQuoteDeltaSummary,
    buildReadOnlyQuoteDeltaCompareAuditDraft
  };
})();