;(function () {
  "use strict";

  const ENGINE_NAME = "weishan_global_discovery_engine_v1";
  const DOMAINS = Object.freeze(["product", "hotel", "flight", "stock"]);
  const PROVIDER_CAPABILITIES = Object.freeze(["search", "redirect", "availability", "price", "shipping", "tax", "inventory"]);
  const REDIRECT_CONTRACT = Object.freeze({
    type:"external_platform_redirect",
    userInitiatedRequired:true,
    opensExternalPlatform:true,
    createsOrder:false,
    acceptsPayment:false,
    managesFulfillment:false,
    storesPaymentData:false
  });

  const COUNTRY_ALIASES = Object.freeze({
    jp:"JP", japan:"JP", "日本":"JP", us:"US", usa:"US", "united states":"US",
    cn:"CN", china:"CN", "中国":"CN", gb:"GB", uk:"GB", "united kingdom":"GB",
    de:"DE", germany:"DE", fr:"FR", france:"FR", sg:"SG", singapore:"SG"
  });
  const EXCHANGE_REGIONS = Object.freeze({ TSE:"JP", NYSE:"US", NASDAQ:"US", SSE:"CN", SZSE:"CN", HKEX:"HK", LSE:"GB" });

  function object(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function list(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function number(value) { const result = Number(value); return Number.isFinite(result) ? result : null; }
  function bool(value) { return value === true; }
  function unique(values) { return values.filter(function (value, index) { return value && values.indexOf(value) === index; }); }
  function country(value) {
    const raw = text(value).toLowerCase();
    if (!raw) return "";
    return COUNTRY_ALIASES[raw] || (/^[a-z]{2}$/i.test(raw) ? raw.toUpperCase() : "");
  }
  function currency(value) { const raw = text(value).toUpperCase(); return /^[A-Z]{3}$/.test(raw) ? raw : ""; }
  function safeUrl(value) {
    const raw = text(value);
    return /^(?:https|fixture):\/\/[^\s]+$/i.test(raw) ? raw : null;
  }
  function safeDomain(value) { return DOMAINS.indexOf(text(value)) >= 0 ? text(value) : ""; }
  function safeCapabilityMap(value) {
    const source = object(value), result = {};
    PROVIDER_CAPABILITIES.forEach(function (key) { result[key] = source[key] === true; });
    return result;
  }

  function resolveDiscoveryRegion(input) {
    const safe = object(input), domain = safeDomain(safe.domain), paymentRegion = country(safe.paymentRegion);
    let primary = "", source = "unresolved", markets = [];
    if (domain === "product") {
      primary = country(safe.shippingDestination);
      source = primary ? "shipping_destination" : "unresolved";
      markets = primary ? [primary] : [];
    } else if (domain === "hotel") {
      primary = country(safe.hotelCountry || safe.destination);
      source = primary ? "hotel_country" : "unresolved";
      markets = primary ? [primary] : [];
    } else if (domain === "flight") {
      const departure = country(safe.departureCountry || safe.departure);
      const arrival = country(safe.arrivalCountry || safe.arrival);
      primary = arrival || departure || paymentRegion;
      source = arrival ? "arrival" : (departure ? "departure" : (paymentRegion ? "payment_region" : "unresolved"));
      markets = unique([departure, arrival, paymentRegion]);
    } else if (domain === "stock") {
      const exchange = text(safe.exchange).toUpperCase();
      primary = country(safe.region) || EXCHANGE_REGIONS[exchange] || paymentRegion;
      source = country(safe.region) ? "market_region" : (EXCHANGE_REGIONS[exchange] ? "exchange" : (paymentRegion ? "payment_region" : "unresolved"));
      markets = unique([primary, paymentRegion]);
    }
    return Object.freeze({
      domain:domain || "unknown",
      primaryMarket:primary || null,
      markets:Object.freeze(markets),
      paymentRegion:paymentRegion || null,
      source:source,
      userLocationIgnored:true,
      resolved:!!primary
    });
  }

  function createProviderCapabilityContract(input) {
    const safe = object(input), domains = unique(list(safe.domains).map(safeDomain)), markets = unique(list(safe.markets).map(country));
    return Object.freeze({
      providerId:text(safe.providerId),
      displayName:text(safe.displayName || safe.providerId),
      domains:Object.freeze(domains),
      markets:Object.freeze(markets),
      capabilities:Object.freeze(safeCapabilityMap(safe.capabilities)),
      declaredOnly:true,
      networkAccessGranted:false,
      credentialAccessGranted:false,
      paymentAccessGranted:false,
      orderAccessGranted:false
    });
  }

  function validateProviderCapabilityContract(input) {
    const contract = createProviderCapabilityContract(input);
    const valid = !!contract.providerId && contract.domains.length > 0 && contract.markets.length > 0 && contract.capabilities.search === true && contract.capabilities.redirect === true;
    return Object.freeze({ valid:valid, contract:contract, code:valid ? "PROVIDER_CAPABILITY_CONTRACT_OK" : "PROVIDER_CAPABILITY_CONTRACT_INVALID" });
  }

  function selectDiscoveryProviders(input) {
    const safe = object(input), region = resolveDiscoveryRegion(safe), domain = region.domain;
    const selected = list(safe.providers).map(validateProviderCapabilityContract).filter(function (entry) {
      return entry.valid && entry.contract.domains.indexOf(domain) >= 0 && entry.contract.markets.some(function (market) { return region.markets.indexOf(market) >= 0; });
    }).map(function (entry) {
      const contract = entry.contract;
      return Object.freeze({
        providerId:contract.providerId,
        displayName:contract.displayName,
        matchedMarkets:Object.freeze(contract.markets.filter(function (market) { return region.markets.indexOf(market) >= 0; })),
        capabilities:contract.capabilities,
        declaredOnly:true
      });
    });
    return Object.freeze({ region:region, providers:Object.freeze(selected), providerCalls:0, networkRequests:0 });
  }

  function totalFor(domain, source) {
    const safe = object(source), explicit = number(safe.total);
    if (explicit !== null) return explicit;
    if (domain === "product") return [safe.price, safe.shipping, safe.tax].reduce(function (sum, value) { const item = number(value); return item === null ? sum : sum + item; }, 0);
    if (domain === "hotel") return [safe.subtotal, safe.tax, safe.fees, safe.cityTax].reduce(function (sum, value) { const item = number(value); return item === null ? sum : sum + item; }, 0);
    if (domain === "flight") return [safe.subtotal, safe.tax, safe.fees, safe.fuel, safe.baggageFee].reduce(function (sum, value) { const item = number(value); return item === null ? sum : sum + item; }, 0);
    return number(safe.lastPrice);
  }

  function createRedirectIntent(source) {
    const safe = object(source), url = safeUrl(safe.redirectUrl);
    return Object.freeze({
      type:REDIRECT_CONTRACT.type,
      provider:text(safe.provider),
      redirectUrl:url,
      available:!!url,
      userInitiatedRequired:true,
      createsOrder:false,
      acceptsPayment:false,
      executesRedirect:false
    });
  }

  function normalizeDiscoveryCandidate(domain, input) {
    const safe = object(input), normalizedDomain = safeDomain(domain), total = totalFor(normalizedDomain, safe);
    const common = {
      candidateId:text(safe.candidateId || safe.id),
      provider:text(safe.provider),
      currency:currency(safe.currency),
      total:total,
      redirectUrl:safeUrl(safe.redirectUrl),
      redirect:createRedirectIntent(safe),
      readOnly:true,
      checkoutAvailable:false,
      paymentAvailable:false,
      orderAvailable:false
    };
    let dto;
    if (normalizedDomain === "product") dto = Object.assign(common, { title:text(safe.title), price:number(safe.price), shipping:number(safe.shipping), tax:number(safe.tax), seller:text(safe.seller), deliveryDays:number(safe.deliveryDays), officialSeller:bool(safe.officialSeller) });
    else if (normalizedDomain === "hotel") dto = Object.assign(common, { hotelName:text(safe.hotelName), roomType:text(safe.roomType), checkIn:text(safe.checkIn), checkOut:text(safe.checkOut), subtotal:number(safe.subtotal), tax:number(safe.tax), fees:number(safe.fees), cityTax:number(safe.cityTax), cancelPolicy:text(safe.cancelPolicy), breakfast:bool(safe.breakfast) });
    else if (normalizedDomain === "flight") dto = Object.assign(common, { airline:text(safe.airline), departure:text(safe.departure), arrival:text(safe.arrival), stops:number(safe.stops), baggage:text(safe.baggage), subtotal:number(safe.subtotal), tax:number(safe.tax), fees:number(safe.fees), fuel:number(safe.fuel), baggageFee:number(safe.baggageFee), durationMinutes:number(safe.durationMinutes) });
    else if (normalizedDomain === "stock") dto = Object.assign(common, { symbol:text(safe.symbol), exchange:text(safe.exchange), lastPrice:number(safe.lastPrice), changePercent:number(safe.changePercent), region:country(safe.region) });
    else dto = common;
    return Object.freeze(dto);
  }

  function normalizeDiscoveryCandidates(input) {
    const safe = object(input), domain = safeDomain(safe.domain);
    return Object.freeze(list(safe.candidates).map(function (candidate) { return normalizeDiscoveryCandidate(domain, candidate); }));
  }

  function comparableCandidates(candidates) {
    const values = list(candidates).filter(function (candidate) { return number(candidate.total) !== null; });
    const currencies = unique(values.map(function (candidate) { return candidate.currency; }));
    return Object.freeze({ candidates:Object.freeze(values), currencyComparable:currencies.length <= 1, currency:currencies[0] || null });
  }

  function valueScore(domain, candidate) {
    let score = 0;
    if (candidate.officialSeller === true) score += 25;
    if (domain === "product" && number(candidate.deliveryDays) !== null) score += Math.max(0, 20 - number(candidate.deliveryDays));
    if (domain === "hotel" && /free|免费/i.test(candidate.cancelPolicy)) score += 20;
    if (domain === "flight" && number(candidate.stops) !== null) score += Math.max(0, 20 - number(candidate.stops) * 8);
    if (candidate.total !== null) score += Math.max(0, 35 - candidate.total / 1000);
    return score;
  }
  function flexibilityScore(domain, candidate) {
    if (domain === "hotel") return /free|免费/i.test(candidate.cancelPolicy) ? 100 : 0;
    if (domain === "flight") return number(candidate.stops) === null ? 0 : Math.max(0, 100 - number(candidate.stops) * 25);
    if (domain === "product") return candidate.officialSeller === true ? 60 : 40;
    return 0;
  }
  function pick(candidates, scorer, comparator) {
    return list(candidates).slice().sort(function (left, right) { return comparator(scorer(left), scorer(right)); })[0] || null;
  }
  function candidateReference(candidate) { return candidate ? Object.freeze({ candidateId:candidate.candidateId, provider:candidate.provider, redirect:candidate.redirect }) : null; }

  function buildDiscoveryComparison(input) {
    const safe = object(input), domain = safeDomain(safe.domain), comparable = comparableCandidates(normalizeDiscoveryCandidates(safe));
    const rows = comparable.candidates.slice().sort(function (left, right) { return left.total - right.total; });
    const recommendations = {
      bestPrice:comparable.currencyComparable ? candidateReference(pick(rows, function (candidate) { return candidate.total; }, function (left, right) { return left - right; })) : null,
      bestValue:candidateReference(pick(rows, function (candidate) { return valueScore(domain, candidate); }, function (left, right) { return right - left; })),
      bestFlexibility:candidateReference(pick(rows, function (candidate) { return flexibilityScore(domain, candidate); }, function (left, right) { return right - left; }))
    };
    return Object.freeze({
      domain:domain,
      currencyComparable:comparable.currencyComparable,
      currency:comparable.currency,
      candidates:Object.freeze(rows),
      recommendations:Object.freeze(recommendations),
      noLowestPriceGuarantee:true,
      finalTermsOnExternalPlatform:true
    });
  }

  function createGlobalDiscoveryPlan(input) {
    const safe = object(input), providerSelection = selectDiscoveryProviders(safe), comparison = buildDiscoveryComparison(safe);
    return Object.freeze({
      engineName:ENGINE_NAME,
      mode:"architecture_only",
      domain:safeDomain(safe.domain),
      query:text(safe.query),
      region:providerSelection.region,
      providerSelection:providerSelection.providers,
      comparison:comparison,
      redirectContract:REDIRECT_CONTRACT,
      execution:{ providerCalls:0, networkRequests:0, externalRedirects:0 },
      boundaries:{ payments:false, orders:false, fulfillment:false, supportManagement:false, paymentDataStored:false },
      userLocationIgnored:true
    });
  }

  function guardFailure(code) { return Object.freeze({ ok:false, error:Object.freeze({ code:"NORMALIZATION_REJECTED", stage:"INPUT_GUARD", recoverable:true, userMessage:"输入内容不符合安全要求。", detailsSummary:code }) }); }
  function guarded(fn) { return function (input) { const guard=window.WeishanGlobalDiscoveryInputGuard; const checked=guard && typeof guard.guardAndCloneInput === "function" ? guard.guardAndCloneInput(input) : { valid:true, value:input }; return checked.valid ? fn(checked.value) : guardFailure(checked.code); }; }
  function guardedCandidate(domain, input) { const guard=window.WeishanGlobalDiscoveryInputGuard; const checked=guard && typeof guard.guardAndCloneInput === "function" ? guard.guardAndCloneInput(input) : { valid:true, value:input }; return checked.valid ? normalizeDiscoveryCandidate(domain, checked.value) : guardFailure(checked.code); }
  window.WeishanGlobalDiscoveryEngine = {
    ENGINE_NAME,
    DOMAINS,
    PROVIDER_CAPABILITIES,
    REDIRECT_CONTRACT,
    resolveDiscoveryRegion:guarded(resolveDiscoveryRegion),
    createProviderCapabilityContract:guarded(createProviderCapabilityContract),
    validateProviderCapabilityContract:guarded(validateProviderCapabilityContract),
    selectDiscoveryProviders:guarded(selectDiscoveryProviders),
    normalizeDiscoveryCandidate:guardedCandidate,
    normalizeDiscoveryCandidates:guarded(normalizeDiscoveryCandidates),
    buildDiscoveryComparison:guarded(buildDiscoveryComparison),
    createRedirectIntent:guarded(createRedirectIntent),
    createGlobalDiscoveryPlan:guarded(createGlobalDiscoveryPlan)
  };
})();
