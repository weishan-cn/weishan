;(function () {
  "use strict";

  const GLOBAL_SHOPPING_READ_ONLY_SEARCH_RESULT_RANKER_VERSION = "4.2.7";
  const RANKER_NAME = "global_shopping_read_only_search_result_ranker_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function score(item) {
    const safe = item && typeof item === "object" ? item : {};
    let total = 0;
    total += safe.isOfficial === true ? 25 : 0;
    total += safe.trustLevel === "high" ? 20 : (safe.trustLevel === "medium" ? 12 : 6);
    total += safe.sourceType === "official" ? 14 : (safe.sourceType === "major_platform" ? 10 : 4);
    total += /官网|官方/.test(text(safe.platformName)) ? 8 : 0;
    total += /实时价格/.test(text(safe.priceLabel)) ? 5 : 2;
    total += /税费|运费|规则|取消/.test(text(safe.feeNote)) ? 4 : 0;
    return total;
  }
  function buildGlobalShoppingReadOnlySearchResultRanking(input) {
    const safe = input && typeof input === "object" ? input : {};
    const candidates = toArray(safe.candidates).map(function (item) {
      const next = Object.assign({}, item || {});
      next.rankingScore = score(next);
      return next;
    }).sort(function (a, b) {
      return Number(b.rankingScore || 0) - Number(a.rankingScore || 0);
    });
    return clone({
      rankerName:RANKER_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_SEARCH_RESULT_RANKER_VERSION,
      category:text(safe.category || ""),
      topResults:candidates.slice(0, 3),
      remainingResults:candidates.slice(3),
      candidateCount:candidates.length,
      rankingSummary:candidates.length ? "默认优先展示可信度更高、入口更直接、规则更清晰的 2-3 个只读候选。" : "暂无可排序候选。",
      redacted:true
    });
  }

  window.WeishanGlobalShoppingReadOnlySearchResultRanker = {
    GLOBAL_SHOPPING_READ_ONLY_SEARCH_RESULT_RANKER_VERSION,
    RANKER_NAME,
    buildGlobalShoppingReadOnlySearchResultRanking
  };
})();
