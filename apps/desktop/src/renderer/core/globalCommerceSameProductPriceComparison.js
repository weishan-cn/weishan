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

    offers.sort(function (left, right) {
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

    const minimum = Number(offers[0].price);
    const minimumOffers = offers.filter(function (offer) { return Number(offer.price) === minimum; });
    let rank = 0;
    let previousPrice = null;
    const rankedOffers = offers.map(function (offer, index) {
      const price = Number(offer.price);
      if (previousPrice === null || price !== previousPrice) rank = index + 1;
      previousPrice = price;
      return Object.assign({}, offer, {
        priceRank:rank,
        comparisonLabel:price === minimum
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
      rankedOffers:rankedOffers,
      recommendation:{
        status:"USER_SELECTION_REQUIRED",
        reason:minimumOffers.length > 1
          ? "SAME_OBSERVED_PRICE_AMONG_COMPARABLE_OFFERS"
          : "LOWEST_OBSERVED_PRICE_WITHIN_COMPARABLE_SET",
        lowestObservedOfferId:minimumOffers.length === 1 ? minimumOffers[0].offerId : null,
        equivalentLowestObservedOfferIds:minimumOffers.map(function (offer) { return offer.offerId; })
      },
      limitations:[
        "Observed provider prices are not guaranteed checkout prices.",
        "Tax, fees, availability, and final price remain subject to the destination merchant."
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
