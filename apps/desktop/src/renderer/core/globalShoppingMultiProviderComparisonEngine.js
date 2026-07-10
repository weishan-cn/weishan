;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MULTI_PROVIDER_COMPARISON_ENGINE_VERSION = "4.2.8";
  const ENGINE_NAME = "global_shopping_multi_provider_comparison_engine_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function toArray(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function comparisonApi() {
    return window.WeishanGlobalShoppingComparisonMatrix || {};
  }

  function buildMatrix(input) {
    return typeof comparisonApi().buildGlobalShoppingComparisonMatrix === "function"
      ? comparisonApi().buildGlobalShoppingComparisonMatrix(input)
      : { rows:[], rowCount:0 };
  }

  function priceAdvantage(row) {
    const type = text(row && row.comparisonType || "");
    if (type === "flight") return text(row.ticketPrice || "");
    if (type === "hotel") return text(row.roomPrice || "");
    return text(row.price || "");
  }

  function buildTradeoffs(rows) {
    return rows.slice(0, 3).map(function (row) {
      return {
        provider:text(row.provider || ""),
        strengths:[
          priceAdvantage(row) ? "价格信息入口清晰" : "",
          text(row.tax || "") && text(row.tax || "") !== "unknown" ? "税费层级更明确" : "",
          text(row.trust || row.providerTrust || "") ? "可信度信息可见" : ""
        ].filter(Boolean),
        limitations:[
          text(row.tax || "") === "unknown" ? "税费仍需平台确认" : "",
          !priceAdvantage(row) || /平台页面为准|实时价格/.test(priceAdvantage(row)) ? "暂无真实价格抓取" : ""
        ].filter(Boolean)
      };
    });
  }

  function buildGlobalShoppingMultiProviderComparison(input) {
    const safe = input && typeof input === "object" ? input : {};
    const matrix = buildMatrix({
      category:safe.category,
      candidates:safe.candidates
    });
    const rows = toArray(matrix.rows);
    const winner = rows[0] || null;
    return clone({
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_SHOPPING_MULTI_PROVIDER_COMPARISON_ENGINE_VERSION,
      winner:winner ? {
        provider:text(winner.provider || ""),
        comparisonType:text(winner.comparisonType || ""),
        priceLabel:priceAdvantage(winner),
        trust:text(winner.trust || winner.providerTrust || "")
      } : null,
      alternatives:rows.slice(1, 3).map(function (row) {
        return {
          provider:text(row.provider || ""),
          comparisonType:text(row.comparisonType || ""),
          priceLabel:priceAdvantage(row),
          trust:text(row.trust || row.providerTrust || "")
        };
      }),
      tradeoffs:buildTradeoffs(rows),
      comparisonMatrix:matrix,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingMultiProviderComparisonEngine = {
    GLOBAL_SHOPPING_MULTI_PROVIDER_COMPARISON_ENGINE_VERSION,
    ENGINE_NAME,
    buildGlobalShoppingMultiProviderComparison
  };
})();
