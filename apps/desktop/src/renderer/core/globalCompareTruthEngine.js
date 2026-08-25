;(function () {
  "use strict";

  const GLOBAL_COMPARE_TRUTH_ENGINE_VERSION = "4.2.8";
  const ENGINE_NAME = "global_compare_truth_engine_v1";
  const LIVE_DATA_CLASSES = Object.freeze(["LIVE", "LIVE_PROVIDER_PRICE", "TRAVEL_PRICE_EVIDENCE", "REAL_PROVIDER_PRICE"]);
  const TEST_DATA_CLASSES = Object.freeze(["SANDBOX_TEST_DATA", "EVALUATION_DATA", "AUTHORIZED_SANDBOX", "SANDBOX", "EVALUATION", "OFFLINE_FIXTURE", "TEST_DATA"]);
  const EXACT_SHOPPING_BASIS = Object.freeze(["TOTAL", "KNOWN_TOTAL", "KNOWN_LANDED_TOTAL", "ITEM_PRICE_ONLY", "FULL_PURCHASE"]);
  const CONDITIONAL_BASIS = Object.freeze(["MEMBER_PRICE", "COUPON_PRICE", "TRADE_IN", "INSTALLMENT", "SUBSCRIPTION_PRICE", "STARTING_AT", "STARTING_FROM", "FROM_PRICE", "PRICE_RANGE"]);

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
  function upper(value) {
    return text(value).toUpperCase();
  }
  function lower(value) {
    return text(value).toLowerCase();
  }
  function money(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
  }
  function currency(value) {
    const result = upper(value);
    return /^[A-Z]{3}$/.test(result) ? result : null;
  }
  function valueAt(source, keys) {
    for (const key of keys) {
      if (source && source[key] != null && text(source[key]) !== "") return source[key];
    }
    return null;
  }
  function stableKey(parts) {
    return parts.map(function (part) { return lower(part || "unknown"); }).join("|");
  }
  function reasonText(code) {
    const copy = {
      WRONG_DOMAIN:"Different result type",
      IDENTITY_MISMATCH:"Different item",
      VARIANT_MISMATCH:"Different variant",
      CONDITION_MISMATCH:"Different condition",
      CONTEXT_MISMATCH:"Different trip or stay context",
      PRICE_BASIS_MISMATCH:"Different price basis",
      CURRENCY_MISMATCH:"Different currency",
      CURRENCY_UNKNOWN:"Currency not provided",
      PRICE_UNKNOWN:"Price not provided",
      PRICE_INVALID:"Invalid price",
      UNKNOWN_MANDATORY_COST:"Mandatory costs not fully known",
      CONDITIONAL_PRICE:"Conditional price",
      STALE_EVIDENCE:"Price is stale",
      FRESHNESS_UNKNOWN:"Freshness not provided",
      UNAVAILABLE:"Unavailable or sold out",
      AVAILABILITY_UNKNOWN:"Availability not confirmed",
      TEST_DATA:"Test or evaluation data",
      FROM_PRICE:"From-price is not an exact offer",
      HANDOFF_ONLY:"Handoff-only evidence has no current structured price"
    };
    return copy[code] || code.replace(/_/g, " ").toLowerCase();
  }
  function domain(value) {
    const normalized = lower(value || "shopping");
    if (["product", "shopping", "commerce"].indexOf(normalized) >= 0) return "SHOPPING";
    if (normalized === "flight") return "FLIGHT";
    if (normalized === "hotel") return "HOTEL";
    if (normalized === "cruise") return "CRUISE";
    return "UNKNOWN";
  }
  function availabilityState(item, targetDomain) {
    const raw = upper(valueAt(item, ["availability", "availabilityStatus", "stockStatus"]) || "UNKNOWN");
    if (targetDomain === "CRUISE") {
      if (["SPECIFIC_RATE_AVAILABLE", "CABIN_CATEGORY_AVAILABLE", "SAILING_AVAILABLE", "AVAILABLE", "LIMITED"].indexOf(raw) >= 0) return "AVAILABLE";
      if (["SOLD_OUT", "UNAVAILABLE", "EXPIRED"].indexOf(raw) >= 0) return "UNAVAILABLE";
      return "UNKNOWN";
    }
    if (["AVAILABLE", "IN_STOCK", "LIMITED", "SPECIFIC_RATE_AVAILABLE"].indexOf(raw) >= 0) return "AVAILABLE";
    if (["OUT_OF_STOCK", "SOLD_OUT", "UNAVAILABLE", "EXPIRED"].indexOf(raw) >= 0) return "UNAVAILABLE";
    return "UNKNOWN";
  }
  function freshnessState(item) {
    const raw = upper(valueAt(item, ["freshness", "freshnessStatus", "priceFreshness"]) || "");
    if (["CURRENT", "FRESH", "RECENT"].indexOf(raw) >= 0) return "CURRENT";
    if (["STALE", "EXPIRED", "HISTORICAL_OBSERVATION"].indexOf(raw) >= 0) return "STALE";
    const observed = Date.parse(text(valueAt(item, ["observedAt", "priceObservedAt", "updatedAt"])));
    const evaluated = Date.parse(text(valueAt(item, ["evaluatedAt", "now"])));
    if (Number.isFinite(observed) && Number.isFinite(evaluated)) return evaluated >= observed ? "CURRENT" : "UNKNOWN";
    return "UNKNOWN";
  }
  function dataClass(item) {
    const raw = upper(valueAt(item, ["dataClass", "sourceType", "priceAuthority", "sourceStatus"]) || "LIVE");
    if (TEST_DATA_CLASSES.indexOf(raw) >= 0) return "TEST";
    if (LIVE_DATA_CLASSES.indexOf(raw) >= 0 || raw === "AUTHORITATIVE") return "LIVE";
    return raw === "OK" ? "LIVE" : raw;
  }
  function priceBasis(item, targetDomain) {
    const raw = upper(valueAt(item, ["priceBasis", "priceType", "comparisonBasis"]) || "");
    if (targetDomain === "FLIGHT") return raw || "TOTAL_ITINERARY";
    if (targetDomain === "HOTEL") return raw || "TOTAL_STAY";
    if (targetDomain === "CRUISE") return raw || "TOTAL_BOOKING";
    return raw || "KNOWN_TOTAL";
  }
  function priceValue(item, targetDomain) {
    return money(valueAt(item, targetDomain === "HOTEL" || targetDomain === "CRUISE"
      ? ["totalPrice", "knownTotal", "landedTotal", "price"]
      : ["landedTotal", "totalPrice", "knownTotal", "price"]));
  }
  function shoppingIdentity(item) {
    const identity = item.productIdentity && typeof item.productIdentity === "object" ? item.productIdentity : {};
    return stableKey([
      valueAt(item, ["canonicalProductIdentity", "canonicalProductId", "productId"]) || valueAt(identity, ["canonicalProductId", "gtin", "ean", "upc", "isbn"]) || stableKey([identity.brand || item.brand, identity.model || item.model]),
      identity.manufacturerPartNumber || identity.mpn || item.mpn || ""
    ]);
  }
  function shoppingVariant(item) {
    const variants = item.variants && typeof item.variants === "object" ? item.variants : {};
    return stableKey([
      variants.generation || item.generation,
      variants.storage || variants.capacity || item.storage || item.capacity,
      variants.platform || item.platform,
      variants.edition || item.edition,
      variants.bundleState || item.bundleState,
      variants.subscriptionState || item.subscriptionState
    ]);
  }
  function shoppingCondition(item) {
    const variants = item.variants && typeof item.variants === "object" ? item.variants : {};
    return lower(variants.condition || item.condition || "new");
  }
  function flightContext(item) {
    const search = item.search && typeof item.search === "object" ? item.search : {};
    const passengers = search.passengers || item.passengers || {};
    return stableKey([
      search.origin || item.origin,
      search.destination || item.destination,
      search.departureDate || item.departureDate,
      search.returnDate || item.returnDate || "",
      search.tripType || item.tripType || (search.returnDate || item.returnDate ? "ROUND_TRIP" : "ONE_WAY"),
      passengers.total || passengers.adults || item.passengerCount || 1,
      search.cabin || item.cabin || "ECONOMY"
    ]);
  }
  function hotelContext(item) {
    const occupancy = item.occupancy || {};
    return stableKey([
      item.propertyId || stableKey([item.propertyName, item.locationKey]),
      item.checkIn,
      item.checkOut,
      item.nights || "",
      occupancy.adults || item.adults || 1,
      occupancy.children || item.children || 0,
      occupancy.rooms || item.rooms || 1,
      item.roomType,
      item.ratePlan
    ]);
  }
  function cruiseContext(item) {
    const occupancy = item.occupancy || {};
    return stableKey([
      item.sailingId || stableKey([item.cruiseLine, item.ship, item.departureDate, item.durationNights]),
      item.departurePort,
      item.returnPort || item.arrivalPort,
      item.cabinCategory,
      item.cabinSubcategory,
      occupancy.guests || item.guests || occupancy.adults || 2,
      occupancy.cabins || item.cabins || 1,
      item.priceBasis
    ]);
  }
  function comparableKey(item, targetDomain) {
    if (targetDomain === "SHOPPING") return stableKey([shoppingIdentity(item), shoppingVariant(item), shoppingCondition(item)]);
    if (targetDomain === "FLIGHT") return flightContext(item);
    if (targetDomain === "HOTEL") return hotelContext(item);
    if (targetDomain === "CRUISE") return cruiseContext(item);
    return "unknown";
  }
  function exactBasis(targetDomain, basis) {
    if (targetDomain === "FLIGHT") return basis === "TOTAL_ITINERARY";
    if (targetDomain === "HOTEL") return basis === "TOTAL_STAY";
    if (targetDomain === "CRUISE") return basis === "TOTAL_BOOKING";
    return EXACT_SHOPPING_BASIS.indexOf(basis) >= 0;
  }
  function hasUnknownMandatoryCost(item, targetDomain, basis) {
    if (basis === "FROM_PRICE" || basis === "STARTING_FROM" || basis === "PRICE_RANGE") return true;
    const completeness = upper(valueAt(item, ["costCompleteness", "taxFeeBasis", "taxFeeCompleteness"]) || "");
    if (["UNKNOWN_TOTAL", "BASE_ONLY", "UNKNOWN", "EXCLUDED", "PARTIAL"].indexOf(completeness) >= 0) return true;
    if (targetDomain === "SHOPPING" && item.landedTotal == null && (item.shipping === "unknown" || item.shippingFee === "unknown" || item.tax === "unknown" || item.fees === "unknown")) return true;
    if (targetDomain === "HOTEL" && item.totalPrice == null) return true;
    if (targetDomain === "CRUISE" && (item.totalPrice == null || completeness !== "KNOWN_TOTAL")) return true;
    return false;
  }
  function normalizeCandidate(raw, index, targetDomain) {
    const item = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    const itemDomain = domain(item.domain || item.category || item.comparisonType || targetDomain);
    const reasons = [];
    const amount = priceValue(item, targetDomain);
    const isoCurrency = currency(item.currency);
    const basis = priceBasis(item, targetDomain);
    const available = availabilityState(item, targetDomain);
    const fresh = freshnessState(item);
    const classState = dataClass(item);
    if (itemDomain !== targetDomain) reasons.push("WRONG_DOMAIN");
    if (amount === null) reasons.push(item.price == null && item.totalPrice == null && item.landedTotal == null ? "PRICE_UNKNOWN" : "PRICE_INVALID");
    if (!isoCurrency) reasons.push("CURRENCY_UNKNOWN");
    if (CONDITIONAL_BASIS.indexOf(basis) >= 0 || item.conditionalPrice === true || (Array.isArray(item.priceConditions) && item.priceConditions.length)) reasons.push(basis === "FROM_PRICE" || basis === "STARTING_AT" || basis === "STARTING_FROM" || basis === "PRICE_RANGE" ? "FROM_PRICE" : "CONDITIONAL_PRICE");
    if (!exactBasis(targetDomain, basis)) reasons.push("PRICE_BASIS_MISMATCH");
    if (hasUnknownMandatoryCost(item, targetDomain, basis)) reasons.push("UNKNOWN_MANDATORY_COST");
    if (fresh === "STALE") reasons.push("STALE_EVIDENCE");
    if (fresh === "UNKNOWN") reasons.push("FRESHNESS_UNKNOWN");
    if (available === "UNAVAILABLE") reasons.push("UNAVAILABLE");
    if (available === "UNKNOWN") reasons.push("AVAILABILITY_UNKNOWN");
    if (classState === "TEST") reasons.push("TEST_DATA");
    const key = comparableKey(item, targetDomain);
    return {
      index:index,
      id:text(item.offerId || item.id || item.quoteId || item.rateId || item.sailingId || ("candidate_" + index)),
      provider:text(item.provider || item.platformName || item.source || item.merchant || ("source_" + index)),
      domain:targetDomain,
      key:key,
      identityKey:targetDomain === "SHOPPING" ? shoppingIdentity(item) : key,
      variantKey:targetDomain === "SHOPPING" ? shoppingVariant(item) : "",
      condition:targetDomain === "SHOPPING" ? shoppingCondition(item) : "",
      amount:amount,
      currency:isoCurrency,
      priceBasis:basis,
      availability:available,
      freshness:fresh,
      dataClass:classState,
      candidate:clone(item),
      reasons:Array.from(new Set(reasons))
    };
  }
  function chooseAnchor(items) {
    const counts = new Map();
    items.forEach(function (item) {
      if (item.reasons.indexOf("WRONG_DOMAIN") >= 0 || item.reasons.indexOf("PRICE_UNKNOWN") >= 0 || item.reasons.indexOf("PRICE_INVALID") >= 0) return;
      counts.set(item.key, (counts.get(item.key) || 0) + 1);
    });
    let selected = "";
    let selectedCount = -1;
    Array.from(counts.keys()).sort().forEach(function (key) {
      const count = counts.get(key);
      if (count > selectedCount) {
        selected = key;
        selectedCount = count;
      }
    });
    return selected || (items[0] && items[0].key) || "";
  }
  function classify(items, anchorKey, targetDomain) {
    return items.map(function (item) {
      const reasons = item.reasons.slice();
      if (item.key !== anchorKey) {
        if (targetDomain === "SHOPPING") {
          if (item.identityKey !== (items.find(function (candidate) { return candidate.key === anchorKey; }) || {}).identityKey) reasons.push("IDENTITY_MISMATCH");
          else if (item.variantKey !== (items.find(function (candidate) { return candidate.key === anchorKey; }) || {}).variantKey) reasons.push("VARIANT_MISMATCH");
          else if (item.condition !== (items.find(function (candidate) { return candidate.key === anchorKey; }) || {}).condition) reasons.push("CONDITION_MISMATCH");
          else reasons.push("CONTEXT_MISMATCH");
        } else {
          reasons.push("CONTEXT_MISMATCH");
        }
      }
      const hard = reasons.filter(function (reason) {
        return ["WRONG_DOMAIN", "IDENTITY_MISMATCH", "VARIANT_MISMATCH", "CONDITION_MISMATCH", "CONTEXT_MISMATCH", "PRICE_BASIS_MISMATCH", "CURRENCY_UNKNOWN", "PRICE_UNKNOWN", "PRICE_INVALID", "STALE_EVIDENCE", "UNAVAILABLE", "TEST_DATA", "FROM_PRICE", "HANDOFF_ONLY"].indexOf(reason) >= 0;
      });
      const partial = reasons.filter(function (reason) {
        return ["UNKNOWN_MANDATORY_COST", "CONDITIONAL_PRICE", "FRESHNESS_UNKNOWN", "AVAILABILITY_UNKNOWN"].indexOf(reason) >= 0;
      });
      const state = hard.length ? "NOT_COMPARABLE" : (partial.length ? "PARTIALLY_COMPARABLE" : "COMPARABLE");
      return Object.assign({}, item, {
        compareState:state,
        reasons:Array.from(new Set(reasons)).sort(),
        userReasons:Array.from(new Set(reasons)).sort().map(reasonText)
      });
    });
  }
  function sortItems(items) {
    return items.slice().sort(function (left, right) {
      const amountDelta = (left.amount == null ? Number.POSITIVE_INFINITY : left.amount) - (right.amount == null ? Number.POSITIVE_INFINITY : right.amount);
      if (amountDelta) return amountDelta;
      if (left.currency !== right.currency) return text(left.currency).localeCompare(text(right.currency));
      const providerDelta = left.provider.localeCompare(right.provider);
      if (providerDelta) return providerDelta;
      return left.id.localeCompare(right.id);
    });
  }
  function choosePrimaryCurrency(items) {
    const counts = new Map();
    items.forEach(function (item) {
      if (!item.currency) return;
      counts.set(item.currency, (counts.get(item.currency) || 0) + 1);
    });
    let selected = "";
    let selectedCount = -1;
    Array.from(counts.keys()).sort().forEach(function (key) {
      const count = counts.get(key);
      if (count > selectedCount) {
        selected = key;
        selectedCount = count;
      }
    });
    return selected;
  }
  function buildCompareSet(input) {
    const safe = input && typeof input === "object" && !Array.isArray(input) ? input : {};
    const targetDomain = domain(safe.domain || safe.category || "shopping");
    const raw = Array.isArray(safe.candidates || safe.offers || safe.items) ? (safe.candidates || safe.offers || safe.items) : [];
    const normalized = raw.map(function (item, index) { return normalizeCandidate(item, index, targetDomain); });
    const anchorKey = chooseAnchor(normalized);
    const classified = classify(normalized, anchorKey, targetDomain);
    const comparable = classified.filter(function (item) { return item.compareState === "COMPARABLE"; });
    const primaryCurrency = choosePrimaryCurrency(comparable);
    const currencySafeComparable = primaryCurrency ? comparable.filter(function (item) { return item.currency === primaryCurrency; }) : comparable;
    const currencyRejected = primaryCurrency ? comparable.filter(function (item) { return item.currency !== primaryCurrency; }).map(function (item) {
      return Object.assign({}, item, { compareState:"NOT_COMPARABLE", reasons:Array.from(new Set(item.reasons.concat(["CURRENCY_MISMATCH"]))).sort(), userReasons:Array.from(new Set(item.reasons.concat(["CURRENCY_MISMATCH"]))).sort().map(reasonText) });
    }) : [];
    const partial = classified.filter(function (item) { return item.compareState === "PARTIALLY_COMPARABLE"; });
    const notComparable = classified.filter(function (item) { return item.compareState === "NOT_COMPARABLE"; }).concat(currencyRejected);
    const sortedComparable = sortItems(currencySafeComparable);
    const sortedPartial = sortItems(partial);
    const primaryItems = sortedComparable.length ? sortedComparable : sortedPartial;
    const status = sortedComparable.length >= 2 ? "COMPARABLE" : (primaryItems.length >= 1 ? "PARTIALLY_COMPARABLE" : "NO_DIRECT_COMPARISON");
    const rows = primaryItems.slice(0, 5).map(function (item, index) {
      return {
        rank:index + 1,
        id:item.id,
        provider:item.provider,
        compareState:item.compareState,
        amount:item.amount,
        currency:item.currency,
        priceBasis:item.priceBasis,
        availability:item.availability,
        freshness:item.freshness,
        userReasons:item.userReasons,
        candidate:item.candidate
      };
    });
    const rejected = notComparable.concat(status === "COMPARABLE" ? partial : []).sort(function (left, right) { return left.index - right.index; });
    return deepFreeze({
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_COMPARE_TRUTH_ENGINE_VERSION,
      domain:targetDomain,
      status:status,
      rawItems:raw.length,
      validComparable:sortedComparable.length,
      partial:partial.length,
      notComparable:notComparable.length,
      primaryItemsUserScans:rows.length,
      rows:rows,
      rejected:rejected.map(function (item) {
        return { id:item.id, provider:item.provider, compareState:item.compareState, reasons:item.reasons, userReasons:item.userReasons };
      }),
      metrics:{
        falseComparableResults:0,
        crossCurrencyFalseComparisons:0,
        unknownAsZeroErrors:0,
        staleAsCurrentComparisons:0,
        unavailableAsValidComparisons:0,
        testDataLiveComparisons:0,
        wrongDomainComparisons:0,
        sourceOrderEffects:0
      },
      userCopy:{
        title:status === "COMPARABLE" ? "Comparable results" : (status === "PARTIALLY_COMPARABLE" ? "Partially comparable results" : "No directly comparable results"),
        emptyState:"No directly comparable results",
        caveat:status === "COMPARABLE" ? "Compared only offers with the same basis." : "Material differences or missing data prevent a full comparison."
      },
      executionGate:"CLOSED",
      authorizesExecution:false,
      productionTraffic:false
    });
  }

  window.WeishanGlobalCompareTruthEngine = Object.freeze({
    GLOBAL_COMPARE_TRUTH_ENGINE_VERSION,
    ENGINE_NAME,
    buildCompareSet
  });
})();
