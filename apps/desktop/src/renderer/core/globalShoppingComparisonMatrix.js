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

  function compareTruthApi() {
    return window.WeishanGlobalCompareTruthEngine || {};
  }

  function buildTruthSet(category, candidates) {
    return typeof compareTruthApi().buildCompareSet === "function"
      ? compareTruthApi().buildCompareSet({ domain:category, candidates:candidates })
      : null;
  }

  function naturalUnknown(value, fallback) {
    const result = text(value);
    return result || fallback || "Not provided";
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

  function buildTruthRow(category, truthRow, index) {
    const safe = truthRow && truthRow.candidate && typeof truthRow.candidate === "object" ? truthRow.candidate : {};
    const base = buildRow(category, safe, index);
    const amount = truthRow && truthRow.amount != null ? String(truthRow.amount) : "";
    const currency = text(truthRow && truthRow.currency || "");
    const priceLabel = amount && currency ? amount + " " + currency : naturalUnknown(base.price || base.ticketPrice || base.roomPrice, "Price not provided");
    const common = Object.assign(base, {
      rank:index + 1,
      provider:text((truthRow && truthRow.provider) || base.provider || ""),
      compareState:text(truthRow && truthRow.compareState || "UNKNOWN"),
      priceBasis:text(truthRow && truthRow.priceBasis || ""),
      availability:text(truthRow && truthRow.availability || ""),
      freshness:text(truthRow && truthRow.freshness || ""),
      materialDifferences:Array.isArray(truthRow && truthRow.userReasons) ? truthRow.userReasons.slice() : []
    });
    if (category === "flight") return Object.assign(common, { ticketPrice:priceLabel });
    if (category === "hotel") return Object.assign(common, { roomPrice:priceLabel });
    return Object.assign(common, { price:priceLabel });
  }

  function buildGlobalShoppingComparisonMatrix(input) {
    const safe = input && typeof input === "object" ? input : {};
    const category = text(safe.category || "product");
    const candidates = toArray(safe.candidates);
    const truthSet = buildTruthSet(category, candidates);
    if (truthSet) {
      const rows = toArray(truthSet.rows).map(function (item, index) {
        return buildTruthRow(category, item, index);
      });
      return clone({
        matrixName:MATRIX_NAME,
        appVersion:GLOBAL_SHOPPING_COMPARISON_MATRIX_VERSION,
        category:category,
        compareStatus:truthSet.status,
        rows:rows,
        rowCount:rows.length,
        rejectedRows:toArray(truthSet.rejected),
        scanReduction:{
          rawItems:truthSet.rawItems,
          validComparable:truthSet.validComparable,
          partial:truthSet.partial,
          notComparable:truthSet.notComparable,
          primaryItemsUserScans:truthSet.primaryItemsUserScans
        },
        userCopy:truthSet.userCopy,
        compareTruth:truthSet,
        redacted:true
      });
    }
    const rows = candidates.slice(0, 5).map(function (item, index) {
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
