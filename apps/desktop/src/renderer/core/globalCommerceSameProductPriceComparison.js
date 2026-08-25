;(function () {
  "use strict";

  const GLOBAL_COMMERCE_SAME_PRODUCT_PRICE_COMPARISON_VERSION = "4.2.8";
  const ENGINE_NAME = "global_commerce_same_product_price_comparison_v1";

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function validHttpsUrl(value) {
    try {
      return new URL(text(value)).protocol === "https:";
    } catch (_) {
      return false;
    }
  }

  function moneyOrNull(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
  }

  function comparisonPolicy(providerId, scope) {
    const registry = window.WeishanGlobalCommerceProviderRoleRegistry || {};
    return typeof registry.getComparisonPolicy === "function"
      ? registry.getComparisonPolicy(providerId, scope)
      : { allowed:false, reason:"PROVIDER_ROLE_POLICY_UNAVAILABLE" };
  }

  function failure(code, limitations) {
    return deepFreeze({
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_COMMERCE_SAME_PRODUCT_PRICE_COMPARISON_VERSION,
      status:"NOT_COMPARABLE",
      code:code,
      canonicalProductIdentity:null,
      currency:null,
      rankedOffers:[],
      recommendation:null,
      limitations:Array.isArray(limitations) ? limitations.slice() : [],
      userDecisionRequired:true,
      executionGate:"CLOSED",
      authorizesExecution:false,
      executed:false,
      productionAffected:false
    });
  }

  function compareSameProductOffers(input) {
    const safe = input && typeof input === "object" ? input : {};
    const sourceOffers = Array.isArray(safe.offers) ? safe.offers : [];
    if (sourceOffers.length < 2) return failure("INSUFFICIENT_OFFERS", ["At least two provider-returned offers are required."]);

    const identities = new Set();
    const currencies = new Set();
    const providers = new Set();
    const invalid = [];
    sourceOffers.forEach(function (offer, index) {
      const item = offer && typeof offer === "object" ? offer : {};
      const price = item.price;
      if (!text(item.provider)) invalid.push("provider_missing_" + index);
      if (!text(item.canonicalProductIdentity)) invalid.push("canonicalProductIdentity_missing_" + index);
      if (!text(item.offerId)) invalid.push("offerId_missing_" + index);
      if (!text(item.merchant)) invalid.push("merchant_missing_" + index);
      if (typeof price !== "number" || !Number.isFinite(price) || price < 0) invalid.push("price_invalid_" + index);
      if (item.landedTotal != null && moneyOrNull(item.landedTotal) === null) invalid.push("landedTotal_invalid_" + index);
      if (!/^[A-Z]{3}$/.test(text(item.currency))) invalid.push("currency_invalid_" + index);
      if (!validHttpsUrl(item.handoffUrl)) invalid.push("handoffUrl_invalid_" + index);
      if (!Number.isFinite(Date.parse(text(item.observedAt)))) invalid.push("observedAt_invalid_" + index);
      if (item.providerUpdatedAt !== null && !Number.isFinite(Date.parse(text(item.providerUpdatedAt)))) invalid.push("providerUpdatedAt_invalid_" + index);
      if (item.providerUpdatedAt === null && text(item.freshnessStatus) !== "UNKNOWN") invalid.push("freshness_without_provider_timestamp_" + index);
      if (text(item.sourceType) !== "LIVE_PROVIDER_PRICE") invalid.push("sourceType_not_live_provider_price_" + index);
      if (text(item.providerRole) !== "LIVE_COMPARISON_PROVIDER") invalid.push("providerRole_not_live_comparison_" + index);
      if (item.liveOffer !== true) invalid.push("liveOffer_not_authorized_" + index);
      if (item.comparisonEligible !== true) invalid.push("comparison_not_eligible_" + index);
      identities.add(text(item.canonicalProductIdentity));
      currencies.add(text(item.currency));
      providers.add(text(item.provider));
    });
    if (invalid.length) return failure("INVALID_OFFER", invalid);
    if (identities.size !== 1) return failure("PRODUCT_IDENTITY_MISMATCH", ["Offers do not identify the same product."]);
    if (currencies.size !== 1) return failure("CURRENCY_NORMALIZATION_REQUIRED", ["Currency conversion is not authorized."]);

    const scope = providers.size === 1 ? "SAME_PROVIDER" : "CROSS_PROVIDER";
    for (const providerId of providers) {
      const policy = comparisonPolicy(providerId, scope);
      if (policy.allowed !== true) return failure(policy.reason || "PROVIDER_ROLE_NOT_AUTHORIZED", ["Provider role policy does not authorize this comparison."]);
    }

    const offers = clone(sourceOffers);
    const knownLandedCount = offers.filter(function (offer) { return moneyOrNull(offer.landedTotal) !== null; }).length;
    if (knownLandedCount > 0 && knownLandedCount !== offers.length) {
      return failure("LANDED_COST_INCOMPLETE", ["Known landed totals cannot be ranked against unknown shipping/tax/fee totals."]);
    }
    const comparisonBasis = knownLandedCount === offers.length ? "KNOWN_LANDED_TOTAL" : "ITEM_PRICE_ONLY";

    offers.sort(function (left, right) {
      const basisDelta = (comparisonBasis === "KNOWN_LANDED_TOTAL" ? Number(left.landedTotal) - Number(right.landedTotal) : Number(left.price) - Number(right.price));
      if (basisDelta) return basisDelta;
      const priceDelta = Number(left.price) - Number(right.price);
      if (priceDelta) return priceDelta;
      const leftMerchant = text(left.merchant);
      const rightMerchant = text(right.merchant);
      const merchantDelta = leftMerchant < rightMerchant ? -1 : (leftMerchant > rightMerchant ? 1 : 0);
      if (merchantDelta) return merchantDelta;
      const leftOfferId = text(left.offerId);
      const rightOfferId = text(right.offerId);
      return leftOfferId < rightOfferId ? -1 : (leftOfferId > rightOfferId ? 1 : 0);
    });

    const minimum = comparisonBasis === "KNOWN_LANDED_TOTAL" ? Number(offers[0].landedTotal) : Number(offers[0].price);
    const minimumOffers = offers.filter(function (offer) {
      return (comparisonBasis === "KNOWN_LANDED_TOTAL" ? Number(offer.landedTotal) : Number(offer.price)) === minimum;
    });
    let rank = 0;
    let previousPrice = null;
    const rankedOffers = offers.map(function (offer, index) {
      const price = Number(offer.price);
      const rankingValue = comparisonBasis === "KNOWN_LANDED_TOTAL" ? Number(offer.landedTotal) : price;
      if (previousPrice === null || rankingValue !== previousPrice) rank = index + 1;
      previousPrice = rankingValue;
      return Object.assign({}, offer, {
        priceRank:rank,
        comparisonBasis:comparisonBasis,
        comparisonValue:rankingValue,
        comparisonLabel:rankingValue === minimum
          ? (minimumOffers.length > 1 ? "SAME_LOWEST_OBSERVED_PRICE" : "LOWEST_OBSERVED_PRICE")
          : "HIGHER_OBSERVED_PRICE"
      });
    });

    return deepFreeze({
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_COMMERCE_SAME_PRODUCT_PRICE_COMPARISON_VERSION,
      status:minimumOffers.length > 1 ? "EQUIVALENT_LOWEST_OBSERVED_PRICE" : "COMPARABLE",
      code:null,
      canonicalProductIdentity:rankedOffers[0].canonicalProductIdentity,
      currency:rankedOffers[0].currency,
      comparisonBasis:comparisonBasis,
      rankedOffers:rankedOffers,
      recommendation:{
        status:"USER_SELECTION_REQUIRED",
        reason:minimumOffers.length > 1
          ? (comparisonBasis === "KNOWN_LANDED_TOTAL" ? "SAME_KNOWN_LANDED_TOTAL_AMONG_COMPARABLE_OFFERS" : "SAME_OBSERVED_PRICE_AMONG_COMPARABLE_OFFERS")
          : (comparisonBasis === "KNOWN_LANDED_TOTAL" ? "LOWEST_KNOWN_LANDED_TOTAL_WITHIN_COMPARABLE_SET" : "LOWEST_OBSERVED_PRICE_WITHIN_COMPARABLE_SET"),
        lowestObservedOfferId:minimumOffers.length === 1 ? minimumOffers[0].offerId : null,
        equivalentLowestObservedOfferIds:minimumOffers.map(function (offer) { return offer.offerId; })
      },
      limitations:[
        "Observed provider prices are not guaranteed checkout prices.",
        comparisonBasis === "KNOWN_LANDED_TOTAL"
          ? "Ranking used known landed totals supplied by the controlled source."
          : "Tax, fees, availability, and final price remain subject to the destination merchant."
      ],
      userDecisionRequired:true,
      executionGate:"CLOSED",
      authorizesExecution:false,
      executed:false,
      productionAffected:false
    });
  }

  window.WeishanGlobalCommerceSameProductPriceComparison = Object.freeze({
    GLOBAL_COMMERCE_SAME_PRODUCT_PRICE_COMPARISON_VERSION,
    ENGINE_NAME,
    compareSameProductOffers
  });
})();
