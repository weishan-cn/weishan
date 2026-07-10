;(function () {
  "use strict";

  const GLOBAL_SHOPPING_LANDED_COST_ENGINE_VERSION = "4.2.8";
  const ENGINE_NAME = "global_shopping_landed_cost_engine_v1";

  function taxRegistryApi() {
    return window.WeishanGlobalShoppingTaxRuleRegistry || {};
  }

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function toArray(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function numberOrNull(value) {
    const next = Number(value);
    return Number.isFinite(next) ? next : null;
  }

  function normalizeFee(item, tier) {
    const safe = item && typeof item === "object" ? item : {};
    return {
      label:text(safe.label || tier),
      currency:text(safe.currency || ""),
      amount:numberOrNull(safe.amount),
      min:numberOrNull(safe.min),
      max:numberOrNull(safe.max),
      note:text(safe.note || ""),
      tier:tier
    };
  }

  function normalizeFees(list, tier) {
    return toArray(list).map(function (item) {
      return normalizeFee(item, tier);
    });
  }

  function normalizeTaxRules(list) {
    return toArray(list).map(function (item) {
      const safe = item && typeof item === "object" ? item : {};
      return {
        label:text(safe.label || "tax_rule"),
        amount:numberOrNull(safe.amount),
        min:numberOrNull(safe.min),
        max:numberOrNull(safe.max),
        level:text(safe.level || "unknown"),
        source:text(safe.source || "unknown"),
        confidence:text(safe.confidence || "unknown"),
        currency:text(safe.currency || "")
      };
    });
  }

  function taxRulesFromContext(safe) {
    if (Array.isArray(safe.taxRules) && safe.taxRules.length) return normalizeTaxRules(safe.taxRules);
    if (typeof taxRegistryApi().buildGlobalShoppingTaxRuleSnapshot !== "function") return [];
    const snapshot = taxRegistryApi().buildGlobalShoppingTaxRuleSnapshot({
      destinationCountry:text((safe.shoppingContext || {}).destinationCountry || safe.destinationCountry || ""),
      sourceCountry:text((safe.shoppingContext || {}).sourceCountry || safe.sourceCountry || "")
    });
    return normalizeTaxRules(snapshot.rules);
  }

  function sumFixed(list) {
    return list.reduce(function (total, item) {
      return total + (Number.isFinite(item.amount) ? item.amount : 0);
    }, 0);
  }

  function sumRange(list, key) {
    return list.reduce(function (total, item) {
      return total + (Number.isFinite(item[key]) ? item[key] : (Number.isFinite(item.amount) ? item.amount : 0));
    }, 0);
  }

  function buildGlobalShoppingLandedCostResult(input) {
    const safe = input && typeof input === "object" ? input : {};
    const productPrice = numberOrNull(safe.productPrice);
    const shippingCost = numberOrNull(safe.shippingCost);
    const confirmedFees = normalizeFees(safe.confirmedFees, "confirmed");
    const estimatedFees = normalizeFees(safe.estimatedFees, "estimated");
    const possibleFees = normalizeFees(safe.possibleFees, "possible");
    const unknownFees = normalizeFees(safe.unknownFees, "unknown");
    const taxRules = taxRulesFromContext(safe);
    const base = (Number.isFinite(productPrice) ? productPrice : 0) + (Number.isFinite(shippingCost) ? shippingCost : 0);
    const confirmedTotal = sumFixed(confirmedFees);
    const estimatedMin = sumRange(estimatedFees, "min");
    const estimatedMax = sumRange(estimatedFees, "max");
    const possibleMin = sumRange(possibleFees, "min");
    const possibleMax = sumRange(possibleFees, "max");
    const taxConfidence = taxRules.reduce(function (level, rule) {
      if (rule.confidence === "unknown") return "unknown";
      if (level === "unknown") return level;
      if (rule.confidence === "possible") return level === "confirmed" ? "possible" : (level === "estimated" ? "possible" : level);
      if (rule.confidence === "estimated") return level === "confirmed" ? "estimated" : level;
      return level;
    }, "confirmed");
    const ruleSource = taxRules.length ? Array.from(new Set(taxRules.map(function (rule) { return rule.source; }).filter(Boolean))) : [];
    return clone({
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_SHOPPING_LANDED_COST_ENGINE_VERSION,
      productPrice:productPrice,
      shippingCost:shippingCost,
      confirmedFees:confirmedFees,
      estimatedFees:estimatedFees,
      possibleFees:possibleFees,
      unknownFees:unknownFees,
      taxRules:taxRules,
      taxConfidence:taxRules.length ? taxConfidence : "unknown",
      ruleSource:ruleSource,
      totalEstimate:{
        currency:text(safe.currency || ""),
        min:base + confirmedTotal + estimatedMin,
        max:base + confirmedTotal + estimatedMax + possibleMax,
        label:"预计到手价"
      },
      confidence:unknownFees.length ? "unknown" : (possibleFees.length ? "possible" : (estimatedFees.length ? "estimated" : "confirmed")),
      feeTiers:["confirmed", "estimated", "possible", "unknown"],
      redacted:true
    });
  }

  window.WeishanGlobalShoppingLandedCostEngine = {
    GLOBAL_SHOPPING_LANDED_COST_ENGINE_VERSION,
    ENGINE_NAME,
    buildGlobalShoppingLandedCostResult
  };
})();
