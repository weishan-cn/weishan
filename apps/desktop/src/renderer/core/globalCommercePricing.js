;(function () {
  "use strict";

  const AMOUNT_FIELDS = Object.freeze(["basePrice", "tax", "shipping", "discount", "promotion", "coupon", "membershipSavings"]);
  const CONFIDENCE = Object.freeze(["HIGH", "MEDIUM", "LOW", "UNKNOWN"]);

  function error(code, stage, userMessage, detailsSummary) {
    return Object.freeze({ success:false, error:Object.freeze({ code, stage, recoverable:true, userMessage, detailsSummary }) });
  }

  function guard(input) {
    const api = window.WeishanGlobalCommerceInputGuard;
    return api && typeof api.guardAndCloneCommerceInput === "function"
      ? api.guardAndCloneCommerceInput(input)
      : error("COMMERCE_INPUT_REJECTED", "INPUT_GUARD", "Commerce input could not be processed safely.", "The commerce input did not satisfy the public boundary contract.");
  }

  function own(object, key) { return Object.prototype.hasOwnProperty.call(object, key); }
  function money(value) { return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.round((value + Number.EPSILON) * 100) / 100 : null; }
  function currency(value) { return typeof value === "string" && /^[A-Z]{3}$/.test(value.trim().toUpperCase()) ? value.trim().toUpperCase() : null; }

  function createPriceSnapshot(input) {
    const checked = guard(input);
    if (!checked.success) return checked;
    const source = checked.value;
    if (!source || typeof source !== "object" || Array.isArray(source)) return error("PRICE_INPUT_REJECTED", "PRICING", "Price input is invalid.", "A price snapshot must be an object.");

    const normalizedCurrency = currency(source.currency);
    if (!normalizedCurrency) return error("PRICE_CURRENCY_INVALID", "PRICING", "Price currency is invalid.", "Currency must be a three-letter code.");

    const values = {};
    for (const field of AMOUNT_FIELDS) {
      const value = own(source, field) ? money(source[field]) : (field === "basePrice" ? null : 0);
      if (value === null) return error("PRICE_AMOUNT_INVALID", "PRICING", "Price amount is invalid.", "All monetary fields must be finite non-negative numbers.");
      values[field] = value;
    }

    const calculated = Math.max(0, Math.round((values.basePrice + values.tax + values.shipping - values.discount - values.promotion - values.coupon - values.membershipSavings + Number.EPSILON) * 100) / 100);
    if (own(source, "effectivePrice")) {
      const provided = money(source.effectivePrice);
      if (provided === null || provided !== calculated) return error("PRICE_EFFECTIVE_MISMATCH", "PRICING", "Price total could not be verified.", "Provided effective price does not match the offline calculation.");
    }

    let historicalPrice = null;
    if (own(source, "historicalPrice") && source.historicalPrice !== null) {
      historicalPrice = money(source.historicalPrice);
      if (historicalPrice === null) return error("PRICE_AMOUNT_INVALID", "PRICING", "Price amount is invalid.", "Historical price must be a finite non-negative number.");
    }

    const confidence = own(source, "priceConfidence") ? source.priceConfidence : "UNKNOWN";
    if (typeof confidence !== "string" || CONFIDENCE.indexOf(confidence) < 0) return error("PRICE_INPUT_REJECTED", "PRICING", "Price confidence is invalid.", "Price confidence must use a supported declared value.");

    const priceChangeAmount = historicalPrice === null ? null : Math.round((calculated - historicalPrice + Number.EPSILON) * 100) / 100;
    const priceChangePercent = historicalPrice === null || historicalPrice === 0 ? null : Math.round((((calculated - historicalPrice) / historicalPrice) * 100 + Number.EPSILON) * 100) / 100;
    return Object.freeze({
      success:true,
      snapshot:Object.freeze({
        currency:normalizedCurrency,
        basePrice:values.basePrice,
        tax:values.tax,
        shipping:values.shipping,
        discount:values.discount,
        promotion:values.promotion,
        coupon:values.coupon,
        membershipSavings:values.membershipSavings,
        effectivePrice:calculated,
        historicalPrice,
        priceConfidence:confidence,
        priceChangeAmount,
        priceChangePercent,
        calculated:true
      })
    });
  }

  function validatePriceSnapshot(input) { return createPriceSnapshot(input); }

  function calculateEffectivePrice(input) {
    const result = createPriceSnapshot(input);
    return result.success ? Object.freeze({ success:true, effectivePrice:result.snapshot.effectivePrice }) : result;
  }

  function comparePriceSnapshots(input) {
    const checked = guard(input);
    if (!checked.success) return checked;
    if (!Array.isArray(checked.value)) return error("PRICE_INPUT_REJECTED", "COMPARISON", "Price comparison input is invalid.", "Price comparison requires an array.");
    const snapshots = [];
    for (const source of checked.value) {
      const result = createPriceSnapshot(source);
      if (!result.success) return result;
      snapshots.push(result.snapshot);
    }
    const currencies = Array.from(new Set(snapshots.map(function (snapshot) { return snapshot.currency; })));
    const comparable = currencies.length <= 1;
    const ordered = comparable
      ? snapshots.map(function (snapshot, index) { return { snapshot, index }; }).sort(function (left, right) { return left.snapshot.effectivePrice - right.snapshot.effectivePrice || left.index - right.index; }).map(function (entry) { return entry.snapshot; })
      : snapshots.slice();
    return Object.freeze({
      success:true,
      comparable,
      currency:currencies.length === 1 ? currencies[0] : null,
      snapshots:Object.freeze(ordered),
      cheapest:comparable ? (ordered[0] || null) : null,
      bestPrice:comparable ? (ordered[0] || null) : null,
      reasonCodes:Object.freeze(comparable ? [] : ["PRICE_NOT_COMPARABLE"])
    });
  }

  function createPricingAssessment(input) {
    const checked = guard(input);
    if (!checked.success) return checked;
    const source = checked.value;
    if (!source || typeof source !== "object" || Array.isArray(source) || !Array.isArray(source.snapshots)) return error("PRICE_INPUT_REJECTED", "ASSESSMENT", "Pricing assessment input is invalid.", "Pricing assessment requires snapshot entries.");
    const comparison = comparePriceSnapshots(source.snapshots);
    if (!comparison.success) return comparison;
    return Object.freeze({
      success:true,
      pricing:Object.freeze({
        comparable:comparison.comparable,
        currency:comparison.currency,
        snapshots:comparison.snapshots,
        cheapest:comparison.cheapest,
        bestPrice:comparison.bestPrice,
        reasonCodes:comparison.reasonCodes
      })
    });
  }

  window.WeishanGlobalCommercePricing = Object.freeze({
    CONFIDENCE,
    createPriceSnapshot,
    validatePriceSnapshot,
    calculateEffectivePrice,
    comparePriceSnapshots,
    createPricingAssessment
  });
})();
