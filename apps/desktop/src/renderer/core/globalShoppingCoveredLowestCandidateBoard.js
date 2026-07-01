;(function () {
  "use strict";

  const GLOBAL_SHOPPING_COVERED_LOWEST_CANDIDATE_BOARD_VERSION = "3.3.0";
  const BOARD_NAME = "global_shopping_covered_lowest_candidate_board_v1";
  const CAVEAT = "当前仅比较已覆盖来源中的候选价，不代表最低承诺、价格保证、锁定承诺、最终成交价或可下单能力。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function safety(overrides) {
    return Object.assign({
      fileWrite:false,
      download:false,
      realNameStored:false,
      phoneStored:false,
      emailStored:false,
      identityUpload:false,
      credentialInput:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    }, obj(overrides));
  }
  function mergerApi() { return window.WeishanGlobalShoppingDuplicateCandidateMerger || {}; }
  function anchorApi() { return window.WeishanGlobalShoppingOfficialPriceAnchorSlot || {}; }
  function duplicateMergerSummary(input) {
    const safe = obj(input);
    if (safe.duplicateCandidateMergerSummary && typeof safe.duplicateCandidateMergerSummary === "object") return safe.duplicateCandidateMergerSummary;
    const api = mergerApi();
    return typeof api.buildGlobalShoppingDuplicateCandidateMerger === "function" ? api.buildGlobalShoppingDuplicateCandidateMerger(safe) : {};
  }
  function officialAnchorSummary(input) {
    const safe = obj(input);
    if (safe.officialPriceAnchorSummary && typeof safe.officialPriceAnchorSummary === "object") return safe.officialPriceAnchorSummary;
    const api = anchorApi();
    return typeof api.buildGlobalShoppingOfficialPriceAnchorSlot === "function" ? api.buildGlobalShoppingOfficialPriceAnchorSlot(safe) : {};
  }
  function unsafe(input) {
    const safe = obj(input);
    const safeSafety = obj(safe.safety);
    const serial = JSON.stringify(safe);
    return /全网最低|最低价保证|已锁价|真实最终价|立即购买|直接下单|一键下单|一键出票/i.test(serial) ||
      safe.payment === true || safe.order === true || safe.ticketing === true || safe.autoOpen === true || safe.openExternal === true ||
      safeSafety.payment === true || safeSafety.order === true || safeSafety.ticketing === true || safeSafety.autoOpen === true ||
      Boolean(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || safeSafety.bookingUrl || safeSafety.checkoutUrl || safeSafety.paymentUrl || safeSafety.orderUrl);
  }
  function card(cardId, label, value) { return { cardId:text(cardId), label:text(label), value:text(value), redacted:true }; }
  function row(rowId, label, value, status) { return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function buildGlobalShoppingCoveredLowestCards(input) {
    const merger = duplicateMergerSummary(input || {});
    const anchor = officialAnchorSummary(input || {});
    const merged = toArray(merger.mergedCandidates)[0] || {};
    const officialAnchor = obj(anchor.officialAnchor);
    return clone([
      card("official_price", "官方参考价", officialAnchor.hasOfficialPrice ? String(officialAnchor.officialNormalizedTotal) : "仍需复核"),
      card("covered_lowest", "已覆盖来源中的较低候选价", merged.lowestCoveredNormalizedTotal == null ? "仍需复核" : String(merged.lowestCoveredNormalizedTotal)),
      card("coverage", "来源覆盖", merged.sourceCount == null ? "仍需复核" : String(merged.sourceCount)),
      card("merge_confidence", "同款合并置信度", merged.matchConfidence || "needs_review")
    ]);
  }
  function buildGlobalShoppingMergedCandidateRowsForView(input) {
    const merger = duplicateMergerSummary(input || {});
    return clone(toArray(merger.mergedCandidates).map(function (item) {
      return row(item.mergedCandidateId, item.title || item.canonicalItemId, "lowest:" + (item.lowestCoveredNormalizedTotal == null ? "review" : item.lowestCoveredNormalizedTotal), item.matchConfidence === "high" ? "pass" : "warning");
    }));
  }
  function buildGlobalShoppingCoveredLowestRows(input) {
    const merger = duplicateMergerSummary(input || {});
    return clone(toArray(merger.mergedCandidates).map(function (item) {
      return row(item.mergedCandidateId + "_range", "价格区间", item.priceRange || "仍需复核", item.priceRange ? "pass" : "warning");
    }));
  }
  function buildCoverageRows(input) {
    const merger = duplicateMergerSummary(input || {});
    return clone(toArray(merger.mergedCandidates).map(function (item) {
      return row(item.mergedCandidateId + "_coverage", "来源覆盖", "official:" + (item.officialCandidateId ? "1" : "0") + " / total:" + String(item.sourceCount || 0), item.sourceCount > 0 ? "pass" : "warning");
    }));
  }
  function buildDisclosureRows() {
    return clone([
      row("covered_only", "当前仅比较已覆盖来源中的候选价", "covered sources only", "pass"),
      row("not_lowest_claim", "合并不代表最低承诺", "not a lowest-price promise", "pass"),
      row("not_ordering", "价格展示不代表可下单能力", "read only only", "pass")
    ]);
  }
  function sanitizeGlobalShoppingCoveredLowestCandidateBoard(board) {
    const safe = obj(board);
    const merger = duplicateMergerSummary(safe);
    const merged = toArray(merger.mergedCandidates);
    const hasCoveredLowest = merged.some(function (item) { return item.lowestCoveredNormalizedTotal != null; });
    const blocked = unsafe(safe) || merger.status === "blocked";
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status))
      ? text(safe.status)
      : (blocked ? "blocked" : ((!merged.length || !hasCoveredLowest) ? "needs_review" : "ready"));
    return clone({
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_COVERED_LOWEST_CANDIDATE_BOARD_VERSION,
      status:status,
      title:"已覆盖来源候选价合并",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingCoveredLowestCards(safe),
      mergedCandidateRows:toArray(safe.mergedCandidateRows).length ? toArray(safe.mergedCandidateRows) : buildGlobalShoppingMergedCandidateRowsForView(safe),
      priceRangeRows:toArray(safe.priceRangeRows).length ? toArray(safe.priceRangeRows) : buildGlobalShoppingCoveredLowestRows(safe),
      coverageRows:toArray(safe.coverageRows).length ? toArray(safe.coverageRows) : buildCoverageRows(safe),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : buildDisclosureRows(),
      caveat:CAVEAT,
      duplicateCandidateMergerSummary:clone(merger),
      officialPriceAnchorSummary:clone(officialAnchorSummary(safe)),
      externalDeepLinkSafetySummary:clone(safe.externalDeepLinkSafetySummary || null),
      searchParameterPrefillSummary:clone(safe.searchParameterPrefillSummary || null),
      jumpToPlatformHandoffPreviewSummary:clone(safe.jumpToPlatformHandoffPreviewSummary || null),
      sandboxDeepLinkCandidateSummary:clone(safe.sandboxDeepLinkCandidateSummary || null),
      platformAvailabilitySummary:clone(safe.platformAvailabilitySummary || null),
      partnerLinkPolicySummary:clone(safe.partnerLinkPolicySummary || null),
      sandboxHandoffViewModelSummary:clone(safe.sandboxHandoffViewModelSummary || null),
      legalProviderFixtureSummary:clone(safe.legalProviderFixtureSummary || null),
      providerCredentialSafetySummary:clone(safe.providerCredentialSafetySummary || null),
      sandboxPriceFeedSummary:clone(safe.sandboxPriceFeedSummary || null),
      externalDeepLinkSafetyStatus:text(safe.externalDeepLinkSafetyStatus || obj(safe.externalDeepLinkSafetySummary).status || ""),
      searchPrefillStatus:text(safe.searchPrefillStatus || obj(safe.searchParameterPrefillSummary).status || ""),
      handoffPreviewStatus:text(safe.handoffPreviewStatus || obj(safe.jumpToPlatformHandoffPreviewSummary).status || ""),
      sandboxDeepLinkStatus:text(safe.sandboxDeepLinkStatus || obj(safe.sandboxDeepLinkCandidateSummary).status || ""),
      platformAvailabilityStatus:text(safe.platformAvailabilityStatus || obj(safe.platformAvailabilitySummary).status || ""),
      partnerLinkPolicyStatus:text(safe.partnerLinkPolicyStatus || obj(safe.partnerLinkPolicySummary).status || ""),
      sandboxHandoffStatus:text(safe.sandboxHandoffStatus || obj(safe.sandboxHandoffViewModelSummary).status || ""),
      legalProviderFixtureStatus:text(safe.legalProviderFixtureStatus || obj(safe.legalProviderFixtureSummary).status || ""),
      providerCredentialSafetyStatus:text(safe.providerCredentialSafetyStatus || obj(safe.providerCredentialSafetySummary).status || ""),
      sandboxPriceFeedStatus:text(safe.sandboxPriceFeedStatus || obj(safe.sandboxPriceFeedSummary).status || ""),
      safeToProceedWithReadOnlyPriceProviderSandbox:safe.safeToProceedWithReadOnlyPriceProviderSandbox === true,
      safeToProceedWithSandboxDeepLinkCandidate:safe.safeToProceedWithSandboxDeepLinkCandidate === true,
      safeToProceedWithPartnerFixtureAdapter:safe.safeToProceedWithPartnerFixtureAdapter === true,
      blockedReasons:blocked ? ["unsafe_covered_lowest_board_detected"] : [],
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingCoveredLowestCandidateBoard(input) {
    try {
      return sanitizeGlobalShoppingCoveredLowestCandidateBoard(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingCoveredLowestCandidateBoard({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingCoveredLowestCandidateBoardAuditDraft(input) {
    const board = buildGlobalShoppingCoveredLowestCandidateBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_COVERED_LOWEST_CANDIDATE_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_COVERED_LOWEST_CANDIDATE_BOARD_VERSION,
      status:board.status,
      cardCount:board.cards.length,
      mergedCandidateRowCount:board.mergedCandidateRows.length,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      fileWrite:false,
      download:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingCoveredLowestCandidateBoard = {
    GLOBAL_SHOPPING_COVERED_LOWEST_CANDIDATE_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingCoveredLowestCandidateBoard,
    buildGlobalShoppingCoveredLowestCards,
    buildGlobalShoppingCoveredLowestRows,
    buildGlobalShoppingMergedCandidateRowsForView,
    buildGlobalShoppingCoveredLowestCandidateBoardAuditDraft,
    sanitizeGlobalShoppingCoveredLowestCandidateBoard
  };
})();
