;(function () {
  "use strict";

  const GLOBAL_SHOPPING_COMPARISON_MATRIX_VERSION = "4.2.8";
  const MATRIX_NAME = "global_shopping_comparison_matrix_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function toArray(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function buildRow(category, item, index) {
    const safe = item && typeof item === "object" ? item : {};
    const landed = safe.landedCostResult && typeof safe.landedCostResult === "object" ? safe.landedCostResult : {};
    const tax = safe.taxSummary && typeof safe.taxSummary === "object" ? safe.taxSummary : {};
    const provider = safe.platformName || "";
    const common = {
      rank:index + 1,
      provider:provider,
      trust: text(safe.trustLevel || ""),
      targetUrl: text(safe.targetUrl || ""),
      confidence: text(((safe.providerRanking || {}).routeConfidence) || "")
    };
    if (category === "flight") {
      return Object.assign(common, {
        comparisonType:"flight",
        ticketPrice:text(safe.priceLabel || "到平台查看实时价格"),
        tax:text(tax.taxConfidence || landed.taxConfidence || "unknown"),
        baggage:text(safe.feeNote || "以平台页面为准"),
        providerTrust:text((safe.trustVerification || {}).status || "")
      });
    }
    if (category === "hotel") {
      return Object.assign(common, {
        comparisonType:"hotel",
        roomPrice:text(safe.priceLabel || "到平台查看实时价格"),
        tax:text(tax.taxConfidence || landed.taxConfidence || "unknown"),
        serviceFee:text(safe.feeNote || "以平台页面为准"),
        cancellation:text(safe.riskNote || "以平台页面为准")
      });
    }
    return Object.assign(common, {
      comparisonType:"product",
      price:text(safe.priceLabel || "价格以平台页面为准"),
      shipping:text(safe.feeNote || "以平台页面为准"),
      tax:text(tax.taxConfidence || landed.taxConfidence || "unknown"),
      trust:text((safe.trustVerification || {}).status || safe.trustLevel || "")
    });
  }

  function buildGlobalShoppingComparisonMatrix(input) {
    const safe = input && typeof input === "object" ? input : {};
    const category = text(safe.category || "product");
    const rows = toArray(safe.candidates).slice(0, 5).map(function (item, index) {
      return buildRow(category, item, index);
    });
    return clone({
      matrixName:MATRIX_NAME,
      appVersion:GLOBAL_SHOPPING_COMPARISON_MATRIX_VERSION,
      category:category,
      rows:rows,
      rowCount:rows.length,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingComparisonMatrix = {
    GLOBAL_SHOPPING_COMPARISON_MATRIX_VERSION,
    MATRIX_NAME,
    buildGlobalShoppingComparisonMatrix
  };
})();
