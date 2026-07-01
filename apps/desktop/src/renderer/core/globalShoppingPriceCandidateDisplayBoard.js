;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PRICE_CANDIDATE_DISPLAY_BOARD_VERSION = "3.7.0";
  const BOARD_NAME = "global_shopping_price_candidate_display_board_v1";
  const CAVEAT = "当前仅展示只读 fixture 候选价，价格以跳转后平台实时页面为准，不代表最终成交价、锁定承诺、最低承诺或可下单能力。";
  const FORBIDDEN_RE = /全网最低|最低价保证|已锁价|真实最终价|立即购买|直接下单|一键下单|一键出票|lowest price guarantee|locked price/i;
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) { return String(value == null ? "" : value).replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted").trim(); }
  function safety(overrides) { return Object.assign({ fileWrite:false, download:false, realNameStored:false, phoneStored:false, emailStored:false, identityUpload:false, credentialInput:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, autoOpen:false, autoRefresh:false, redacted:true }, obj(overrides)); }
  function normalizerApi() { return window.WeishanGlobalShoppingPriceSourceNormalizer || {}; }
  function anchorApi() { return window.WeishanGlobalShoppingOfficialPriceAnchorSlot || {}; }
  function matcherApi() { return window.WeishanGlobalShoppingSameItemMatcher || {}; }
  function mergerApi() { return window.WeishanGlobalShoppingDuplicateCandidateMerger || {}; }
  function coveredBoardApi() { return window.WeishanGlobalShoppingCoveredLowestCandidateBoard || {}; }
  function buildNormalizer(input) { const api = normalizerApi(); return obj(input).priceSourceNormalizationSummary || obj(input).normalizer || (typeof api.buildGlobalShoppingPriceSourceNormalizer === "function" ? api.buildGlobalShoppingPriceSourceNormalizer(input || {}) : { normalizedCandidates:[] }); }
  function buildAnchor(input, normalizer) { const api = anchorApi(); return obj(input).officialPriceAnchorSummary || obj(input).officialAnchorSlot || (typeof api.buildGlobalShoppingOfficialPriceAnchorSlot === "function" ? api.buildGlobalShoppingOfficialPriceAnchorSlot(Object.assign({}, obj(input), { normalizedCandidates:normalizer.normalizedCandidates || [] })) : null); }
  function buildMatcher(input, normalizer) { const api = matcherApi(); return obj(input).sameItemMatcherSummary || (typeof api.buildGlobalShoppingSameItemMatcher === "function" ? api.buildGlobalShoppingSameItemMatcher(Object.assign({}, obj(input), { normalizedCandidates:normalizer.normalizedCandidates || [] })) : null); }
  function buildMerger(input, matcher) { const api = mergerApi(); return obj(input).duplicateCandidateMergerSummary || (typeof api.buildGlobalShoppingDuplicateCandidateMerger === "function" ? api.buildGlobalShoppingDuplicateCandidateMerger(Object.assign({}, obj(input), { sameItemMatcherSummary:matcher })) : null); }
  function buildCoveredBoard(input, merger, anchor) { const api = coveredBoardApi(); return obj(input).coveredLowestCandidateBoardSummary || (typeof api.buildGlobalShoppingCoveredLowestCandidateBoard === "function" ? api.buildGlobalShoppingCoveredLowestCandidateBoard(Object.assign({}, obj(input), { duplicateCandidateMergerSummary:merger, officialPriceAnchorSummary:anchor })) : null); }
  function unsafe(input) {
    const rawSerial = JSON.stringify(input || {});
    const serial = rawSerial
      .replace(/不代表[^"。；;]*全网最低[^"。；;]*/g, "")
      .replace(/不代表[^"。；;]*锁价[^"。；;]*/g, "")
      .replace(/不代表[^"。；;]*真实最终价[^"。；;]*/g, "");
    const safe = obj(input); const safeSafety = obj(safe.safety);
    return FORBIDDEN_RE.test(serial) || Boolean(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || safeSafety.bookingUrl || safeSafety.checkoutUrl || safeSafety.paymentUrl || safeSafety.orderUrl || safe.payment === true || safe.order === true || safe.ticketing === true || safe.autoOpen === true || safe.openExternal === true || safeSafety.payment === true || safeSafety.order === true || safeSafety.ticketing === true || safeSafety.autoOpen === true);
  }
  function card(cardId, label, value) { return { cardId:text(cardId), label:text(label), value:text(value), redacted:true }; }
  function row(rowId, label, value, status) { return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function buildGlobalShoppingPriceCandidateCards(input) {
    const normalizer = buildNormalizer(input || {});
    const anchor = buildAnchor(input || {}, normalizer) || {};
    const matcher = buildMatcher(input || {}, normalizer) || {};
    const merger = buildMerger(input || {}, matcher) || {};
    const coveredBoard = buildCoveredBoard(input || {}, merger, anchor) || {};
    const coverage = obj(obj(input).providerCoverageDashboardSummary);
    const trust = obj(obj(input).readOnlySourceTrustScoreSummary);
    const official = obj(anchor.officialAnchor);
    const merged = toArray(merger.mergedCandidates)[0] || {};
    const candidates = toArray(normalizer.normalizedCandidates);
    return clone([
      card("official_price", "官方参考价", official.hasOfficialPrice ? (official.officialCurrency + " " + official.officialNormalizedTotal) : "缺少官方价"),
      card("covered_lowest", "已覆盖来源中的较低候选价", merged.lowestCoveredNormalizedTotal == null ? "仍需复核" : String(merged.lowestCoveredNormalizedTotal)),
      card("coverage", "来源覆盖", merged.sourceCount == null ? "仍需复核" : String(merged.sourceCount)),
      card("merge_confidence", "同款合并置信度", merged.matchConfidence || "needs_review"),
      card("price_completeness", "税费/运费/服务费状态", candidates.every(function (item) { return item.priceCompleteness === "complete"; }) ? "complete" : "needs_review"),
      card("display_board", "已覆盖来源候选价合并", coveredBoard.title || "已覆盖来源候选价合并"),
      card("provider_coverage", "Provider 覆盖看板", obj(obj(coverage.userFacingSummary)).resultLabel || "Provider 覆盖仍需复核"),
      card("source_trust", "只读来源可信度评分", obj(obj(trust.userFacingSummary)).resultLabel || "来源可信度仍需复核")
    ]);
  }
  function buildGlobalShoppingPriceCandidateRows(input) {
    const normalizer = buildNormalizer(input || {});
    return clone(toArray(normalizer.normalizedCandidates).map(function (item) { return row(item.candidateId, item.sourceName, (item.currency || "") + " " + (item.normalizedTotal == null ? "需复核" : item.normalizedTotal), item.priceCompleteness === "complete" ? "pass" : "warning"); }));
  }
  function buildGlobalShoppingOfficialPriceRowsForView(input) {
    const normalizer = buildNormalizer(input || {});
    const anchor = buildAnchor(input || {}, normalizer) || {};
    const official = obj(anchor.officialAnchor);
    return clone([ row("official_price", "官方参考价", official.hasOfficialPrice ? official.officialCurrency + " " + official.officialNormalizedTotal : "缺少官方价", official.hasOfficialPrice ? "pass" : "warning"), row("official_caveat", "价格以跳转后平台实时页面为准", official.officialPriceCaveat || "官方价仅作参考，价格以官方平台实时页面为准。", "pass") ]);
  }
  function sanitizeGlobalShoppingPriceCandidateDisplayBoard(board) {
    const safe = obj(board);
    const normalizer = buildNormalizer(safe);
    const anchor = buildAnchor(safe, normalizer) || {};
    const matcher = buildMatcher(safe, normalizer) || {};
    const merger = buildMerger(safe, matcher) || {};
    const coveredBoard = buildCoveredBoard(safe, merger, anchor) || {};
    const missingCandidates = !toArray(normalizer.normalizedCandidates).length;
    const missingOfficial = !obj(anchor.officialAnchor).hasOfficialPrice;
    const blocked = unsafe(safe) || normalizer.status === "blocked" || anchor.status === "blocked" || matcher.status === "blocked" || merger.status === "blocked" || coveredBoard.status === "blocked";
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : (blocked ? "blocked" : (missingCandidates || missingOfficial ? "needs_review" : "ready"));
    return clone({
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_PRICE_CANDIDATE_DISPLAY_BOARD_VERSION,
      status:status,
      title:"全球购价格候选展示",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingPriceCandidateCards(safe),
      officialPriceRows:toArray(safe.officialPriceRows).length ? toArray(safe.officialPriceRows) : buildGlobalShoppingOfficialPriceRowsForView(safe),
      candidatePriceRows:toArray(safe.candidatePriceRows).length ? toArray(safe.candidatePriceRows) : buildGlobalShoppingPriceCandidateRows(safe),
      comparisonRows:toArray(anchor.rows),
      disclosureRows:[
        row("fixture_only", "当前仅展示只读 fixture 候选价", "fixtureOnly / sandboxOnly / readOnly", "pass"),
        row("covered_only", "当前仅比较已覆盖来源中的候选价", "covered sources only", "pass"),
        row("not_lowest_claim", "合并不代表最低承诺", "not a lowest-price promise", "pass"),
        row("platform_realtime", "价格以跳转后平台实时页面为准", "价格展示不代表下单能力", "pass")
      ],
      caveat:CAVEAT,
      priceSourceNormalizationSummary:clone(normalizer),
      officialPriceAnchorSummary:clone(anchor),
      sameItemMatcherSummary:clone(matcher),
      duplicateCandidateMergerSummary:clone(merger),
      coveredLowestCandidateBoardSummary:clone(coveredBoard),
      providerCoverageDashboardSummary:clone(obj(safe.providerCoverageDashboardSummary)),
      readOnlySourceTrustScoreSummary:clone(obj(safe.readOnlySourceTrustScoreSummary)),
      sameItemMatcherStatus:text(matcher.status || ""),
      duplicateMergeStatus:text(merger.status || ""),
      coveredLowestStatus:text(coveredBoard.status || ""),
      safeToProceedWithDeepLinkSafetyGate:matcher.status === "ready" && merger.status === "merged" && coveredBoard.status === "ready",
      blockedReasons:blocked ? ["unsafe_price_candidate_display_detected"] : [],
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingPriceCandidateDisplayBoard(input) { try { return sanitizeGlobalShoppingPriceCandidateDisplayBoard(input || {}); } catch (error) { return sanitizeGlobalShoppingPriceCandidateDisplayBoard({ status:"failed_safe" }); } }
  function buildGlobalShoppingPriceCandidateDisplayBoardAuditDraft(input) { const board = buildGlobalShoppingPriceCandidateDisplayBoard(input || {}); return clone({ eventType:"GLOBAL_SHOPPING_PRICE_CANDIDATE_DISPLAY_BOARD_AUDIT_DRAFT", boardName:BOARD_NAME, appVersion:GLOBAL_SHOPPING_PRICE_CANDIDATE_DISPLAY_BOARD_VERSION, status:board.status, cardCount:board.cards.length, candidateRowCount:board.candidatePriceRows.length, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, autoOpen:false, fileWrite:false, download:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, redacted:true }); }
  window.WeishanGlobalShoppingPriceCandidateDisplayBoard = { GLOBAL_SHOPPING_PRICE_CANDIDATE_DISPLAY_BOARD_VERSION, BOARD_NAME, buildGlobalShoppingPriceCandidateDisplayBoard, buildGlobalShoppingPriceCandidateCards, buildGlobalShoppingPriceCandidateRows, buildGlobalShoppingOfficialPriceRowsForView, buildGlobalShoppingPriceCandidateDisplayBoardAuditDraft, sanitizeGlobalShoppingPriceCandidateDisplayBoard };
})();
