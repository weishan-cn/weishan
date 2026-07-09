;(function () {
  "use strict";

  const GLOBAL_SHOPPING_READ_ONLY_SEARCH_RESULT_PRESENTER_VERSION = "4.2.7";
  const PRESENTER_NAME = "global_shopping_read_only_search_result_presenter_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function rankerApi() { return window.WeishanGlobalShoppingReadOnlySearchResultRanker || {}; }
  function buildRanking(input) {
    return typeof rankerApi().buildGlobalShoppingReadOnlySearchResultRanking === "function"
      ? rankerApi().buildGlobalShoppingReadOnlySearchResultRanking(input)
      : { topResults:[], remainingResults:[], candidateCount:0, rankingSummary:"暂无可排序候选。" };
  }
  function buildGlobalShoppingReadOnlySearchResultPresentation(input) {
    const safe = obj(input);
    const ranking = buildRanking({
      category:safe.category,
      candidates:safe.candidates
    });
    const topResults = Array.isArray(ranking.topResults) ? ranking.topResults : [];
    const topOne = topResults[0] || null;
    return clone({
      presenterName:PRESENTER_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_SEARCH_RESULT_PRESENTER_VERSION,
      category:text(safe.category || ""),
      candidateCount:Number(ranking.candidateCount || 0),
      topResults:topResults,
      remainingResults:Array.isArray(ranking.remainingResults) ? ranking.remainingResults : [],
      recommendation:{
        title:topOne ? "优先查看 " + text(topOne.platformName) : "暂无推荐结果",
        reason:topOne ? text(topOne.recommendationReason || ranking.rankingSummary) : "当前没有可展示的只读候选。",
        riskSummary:"Weishan 不收款、不代下单、不保存账号密码，最终价格与规则以平台页面为准。"
      },
      userFacingSummary:{
        title:"只读搜索结果",
        resultLabel:topResults.length ? "已生成 2-3 条优先查看结果" : "暂无可展示结果",
        caveat:"这些是只读候选入口，不是订单、不是支付对象，也不是 provider response。最终购买、预订和支付都在外部平台完成。",
        redacted:true
      },
      redacted:true
    });
  }

  window.WeishanGlobalShoppingReadOnlySearchResultPresenter = {
    GLOBAL_SHOPPING_READ_ONLY_SEARCH_RESULT_PRESENTER_VERSION,
    PRESENTER_NAME,
    buildGlobalShoppingReadOnlySearchResultPresentation
  };
})();
