;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFICIAL_PRICE_ANCHOR_SLOT_VERSION = "4.2.0";
  const SLOT_NAME = "global_shopping_official_price_anchor_slot_v1";
  const OFFICIAL_CAVEAT = "官方价仅作参考，价格以官方平台实时页面为准。";
  const COMPARISON_CAVEAT = "当前仅比较已覆盖来源中的候选价，不代表最低承诺或锁定承诺。";
  const SUMMARY_CAVEAT = "官方价格只作为参考锚点，不代表最终成交价、锁定承诺、价格保证或可下单能力。";
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) { return String(value == null ? "" : value).replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted").trim(); }
  function safety(overrides) { return Object.assign({ fileWrite:false, download:false, realNameStored:false, phoneStored:false, emailStored:false, identityUpload:false, credentialInput:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, autoOpen:false, autoRefresh:false, redacted:true }, obj(overrides)); }
  function normalizerApi() { return window.WeishanGlobalShoppingPriceSourceNormalizer || {}; }
  function candidates(input) {
    const safe = obj(input);
    if (toArray(safe.normalizedCandidates).length) return toArray(safe.normalizedCandidates);
    if (safe.normalizer && toArray(safe.normalizer.normalizedCandidates).length) return toArray(safe.normalizer.normalizedCandidates);
    const api = normalizerApi();
    return typeof api.normalizeGlobalShoppingPriceSources === "function" ? api.normalizeGlobalShoppingPriceSources(safe) : [];
  }
  function unsafe(input) {
    const safe = obj(input); const safeSafety = obj(safe.safety); const serial = JSON.stringify(safe);
    return Boolean(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || safeSafety.bookingUrl || safeSafety.checkoutUrl || safeSafety.paymentUrl || safeSafety.orderUrl || safe.payment === true || safe.order === true || safe.ticketing === true || safeSafety.payment === true || safeSafety.order === true || safeSafety.ticketing === true || /全网最低|lowest price guarantee|lowest guarantee|最低价保证|已锁价|locked price/i.test(serial));
  }
  function row(rowId, label, value, status) { return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function evaluateGlobalShoppingOfficialPriceAnchor(input) {
    const list = candidates(input || {});
    const official = list.find(function (item) { return item && item.sourceType === "official"; }) || null;
    const blockedReasons = [];
    if (unsafe(input)) blockedReasons.push("unsafe_official_price_anchor_capability_detected");
    const illegalOfficial = list.find(function (item) { return item && item.asOfficial === true && item.sourceType !== "official"; });
    if (illegalOfficial) blockedReasons.push("official_anchor_must_use_official_source");
    if (!official) return clone({ status:blockedReasons.length ? "blocked" : "missing_official", official:null, candidates:list, blockedReasons:blockedReasons, redacted:true });
    const missing = official.normalizedTotal == null || !official.currency || !official.lastCheckedAt || !official.priceCompleteness || !official.confidence;
    return clone({ status:blockedReasons.length ? "blocked" : (missing ? "needs_review" : "anchored"), official:official, candidates:list, blockedReasons:blockedReasons, redacted:true });
  }
  function buildComparison(evaluation) {
    const official = evaluation.official;
    const comparable = toArray(evaluation.candidates).filter(function (item) { return item && item.candidateId !== (official && official.candidateId) && item.normalizedTotal != null; }).sort(function (a, b) { return Number(a.normalizedTotal) - Number(b.normalizedTotal); });
    const lowest = comparable[0] || null;
    const delta = official && lowest ? Number(lowest.normalizedTotal) - Number(official.normalizedTotal) : null;
    const percent = official && lowest && official.normalizedTotal ? Math.round((delta / Number(official.normalizedTotal)) * 10000) / 100 : null;
    return { hasComparableCandidates:Boolean(lowest), lowestCoveredCandidateId:lowest ? lowest.candidateId : "", lowestCoveredNormalizedTotal:lowest ? lowest.normalizedTotal : null, priceDelta:delta, priceDeltaPercent:percent, comparedToOfficialLabel:lowest ? "已覆盖来源中的较低候选价与官方参考价对比" : "暂无可比较候选价", comparisonCaveat:COMPARISON_CAVEAT, redacted:true };
  }
  function buildGlobalShoppingOfficialPriceComparisonRows(input) {
    const evaluation = evaluateGlobalShoppingOfficialPriceAnchor(input || {});
    const comparison = buildComparison(evaluation);
    return clone([ row("official_reference", "官方参考价", evaluation.official ? String(evaluation.official.normalizedTotal) : "缺少官方价", evaluation.official ? "pass" : "warning"), row("covered_lowest", "已覆盖来源中的较低候选价", comparison.lowestCoveredNormalizedTotal == null ? "仍需复核" : String(comparison.lowestCoveredNormalizedTotal), comparison.hasComparableCandidates ? "pass" : "warning"), row("official_delta", "与官方价对比", comparison.priceDelta == null ? "仍需复核" : String(comparison.priceDelta), comparison.hasComparableCandidates ? "pass" : "warning") ]);
  }
  function sanitizeGlobalShoppingOfficialPriceAnchorSlot(slot) {
    const safe = obj(slot);
    const evaluation = evaluateGlobalShoppingOfficialPriceAnchor(safe);
    const official = evaluation.official;
    const comparison = buildComparison(evaluation);
    const status = /^(anchored|missing_official|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : evaluation.status;
    return clone({ slotName:SLOT_NAME, appVersion:GLOBAL_SHOPPING_OFFICIAL_PRICE_ANCHOR_SLOT_VERSION, status:status, officialAnchor:{ hasOfficialPrice:Boolean(official), candidateId:official ? official.candidateId : "", sourceName:official ? official.sourceName : "", officialBasePrice:official ? official.basePrice : null, officialNormalizedTotal:official ? official.normalizedTotal : null, officialCurrency:official ? official.currency : "", officialLastCheckedAt:official ? official.lastCheckedAt : "", officialPriceCompleteness:official ? official.priceCompleteness : "", officialPriceConfidence:official ? official.confidence : "", officialPriceCaveat:OFFICIAL_CAVEAT, redacted:true }, comparison:comparison, rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingOfficialPriceComparisonRows(safe), blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons, userFacingSummary:{ title:"官方价格锚点", resultLabel:status === "anchored" ? "官方价锚点已建立" : status === "missing_official" ? "缺少官方价" : status === "blocked" ? "官方价已阻断" : "官方价仍需复核", caveat:SUMMARY_CAVEAT, redacted:true }, safety:safety(safe.safety), redacted:true });
  }
  function buildGlobalShoppingOfficialPriceAnchorSlot(input) { try { const evaluation = evaluateGlobalShoppingOfficialPriceAnchor(input || {}); return sanitizeGlobalShoppingOfficialPriceAnchorSlot(Object.assign({}, obj(input), { status:evaluation.status, normalizedCandidates:evaluation.candidates, blockedReasons:evaluation.blockedReasons })); } catch (error) { return sanitizeGlobalShoppingOfficialPriceAnchorSlot({ status:"failed_safe", blockedReasons:["failed_safe"] }); } }
  function buildGlobalShoppingOfficialPriceAnchorSlotAuditDraft(input) { const slot = buildGlobalShoppingOfficialPriceAnchorSlot(input || {}); return clone({ eventType:"GLOBAL_SHOPPING_OFFICIAL_PRICE_ANCHOR_SLOT_AUDIT_DRAFT", slotName:SLOT_NAME, appVersion:GLOBAL_SHOPPING_OFFICIAL_PRICE_ANCHOR_SLOT_VERSION, status:slot.status, hasOfficialPrice:slot.officialAnchor.hasOfficialPrice, rowCount:slot.rows.length, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, autoOpen:false, fileWrite:false, download:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, redacted:true }); }
  window.WeishanGlobalShoppingOfficialPriceAnchorSlot = { GLOBAL_SHOPPING_OFFICIAL_PRICE_ANCHOR_SLOT_VERSION, SLOT_NAME, buildGlobalShoppingOfficialPriceAnchorSlot, evaluateGlobalShoppingOfficialPriceAnchor, buildGlobalShoppingOfficialPriceComparisonRows, buildGlobalShoppingOfficialPriceAnchorSlotAuditDraft, sanitizeGlobalShoppingOfficialPriceAnchorSlot };
})();
