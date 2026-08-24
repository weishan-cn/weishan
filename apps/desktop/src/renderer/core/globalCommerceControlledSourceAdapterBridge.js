;(function () {
  "use strict";

  const VERSION = "4.2.8";
  const BRIDGE_NAME = "global_commerce_controlled_source_adapter_bridge_v1";

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function array(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function numberOrNull(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function sourceDefinitions() {
    return {
      cheapshark:{
        sourceId:"cheapshark",
        sourceRole:"CONTROLLED_READONLY_GAME_PRICE_SOURCE",
        roles:["PRODUCT_IDENTITY", "PRICE_EVIDENCE", "AVAILABILITY_EVIDENCE", "EXACT_HANDOFF"],
        authorityPolicy:"TRUSTED_CONTROLLED_READONLY_PROVIDER_PRICE",
        supportsIdentity:"YES",
        supportsVariant:"PARTIAL",
        supportsPrice:"YES",
        supportsCurrency:"YES",
        supportsAvailability:"PARTIAL",
        supportsHandoff:"YES",
        supportedMarkets:["US"],
        commercialRelationshipOptional:true,
        controlledReadStatus:"CONTROLLED_READONLY_IMPLEMENTED",
        adapterImplementationStatus:"IMPLEMENTED",
        maximumEvidenceAuthority:"PROVIDER_PRICE_OBSERVATION",
        priceAuthority:"AUTHORITATIVE",
        freshnessPolicy:{ basis:"observedAt", maxCurrentAgeSeconds:86400, maxRecentAgeSeconds:604800 },
        allowedHandoffHosts:["www.cheapshark.com"],
        limitations:[
          "Game/platform/edition semantics must remain scoped to CheapShark game identity.",
          "Provider deal observation is not a checkout guarantee.",
          "Availability means observed deal availability, not merchant stock authority."
        ]
      },
      daily_dose_tech:{
        sourceId:"daily_dose_tech",
        sourceRole:"PROVIDER_SPECIFIC_PRICE_OBSERVATION_SOURCE",
        roles:["PRODUCT_IDENTITY", "PRICE_EVIDENCE", "PROVIDER_HANDOFF"],
        authorityPolicy:"PROVIDER_SPECIFIC_OBSERVATION_ONLY",
        supportsIdentity:"PARTIAL",
        supportsVariant:"PARTIAL",
        supportsPrice:"YES",
        supportsCurrency:"YES",
        supportsAvailability:"PARTIAL",
        supportsHandoff:"YES",
        supportedMarkets:["GLOBAL"],
        commercialRelationshipOptional:true,
        controlledReadStatus:"CONTROLLED_READONLY_IMPLEMENTED",
        adapterImplementationStatus:"IMPLEMENTED",
        maximumEvidenceAuthority:"PROVIDER_SPECIFIC_PRICE_OBSERVATION",
        priceAuthority:"INDICATIVE",
        freshnessPolicy:{ basis:"observedAt", maxCurrentAgeSeconds:3600, maxRecentAgeSeconds:86400 },
        allowedHandoffHosts:["dailydose.tech"],
        limitations:["Provider-specific observations are not same-provider or cross-provider comparison authority."]
      },
      open_prices:{
        sourceId:"open_prices",
        sourceRole:"PUBLIC_PRICE_EVIDENCE_SOURCE",
        roles:["PRICE_EVIDENCE"],
        authorityPolicy:"OPEN_PUBLIC_EVIDENCE_LIMITED",
        supportsIdentity:"PARTIAL",
        supportsVariant:"PARTIAL",
        supportsPrice:"PARTIAL",
        supportsCurrency:"YES",
        supportsAvailability:"NO",
        supportsHandoff:"PARTIAL",
        supportedMarkets:["EU", "GLOBAL"],
        commercialRelationshipOptional:true,
        controlledReadStatus:"OFFLINE_EVIDENCE_FOUNDATION",
        adapterImplementationStatus:"IMPLEMENTED_LIMITED",
        maximumEvidenceAuthority:"INDICATIVE_PRICE_OBSERVATION",
        priceAuthority:"INDICATIVE",
        freshnessPolicy:{ basis:"observedAt", maxCurrentAgeSeconds:3600, maxRecentAgeSeconds:86400 },
        allowedHandoffHosts:[],
        limitations:["Open public evidence cannot self-upgrade into current merchant authoritative price."]
      },
      multi_network_product_feed:{
        sourceId:"multi_network_product_feed",
        sourceRole:"AUTHORIZED_FEED_EVIDENCE_FOUNDATION",
        roles:["PRODUCT_IDENTITY", "PRICE_EVIDENCE", "HANDOFF_EVIDENCE"],
        authorityPolicy:"ADAPTER_CONTRACT_REQUIRED",
        supportsIdentity:"YES",
        supportsVariant:"YES",
        supportsPrice:"YES",
        supportsCurrency:"YES",
        supportsAvailability:"PARTIAL",
        supportsHandoff:"YES",
        supportedMarkets:["ADAPTER_DEFINED"],
        commercialRelationshipOptional:true,
        controlledReadStatus:"OFFLINE_FOUNDATION_ONLY",
        adapterImplementationStatus:"FOUNDATION_READY",
        maximumEvidenceAuthority:"ADAPTER_CONTRACT_LIMITED",
        priceAuthority:"UNKNOWN",
        freshnessPolicy:{ basis:"observedAt", maxCurrentAgeSeconds:null, maxRecentAgeSeconds:null },
        allowedHandoffHosts:[],
        limitations:["Specific network permissions and hosts must be declared by a reviewed adapter contract."]
      },
      google_books:{
        sourceId:"google_books",
        sourceRole:"OFFICIAL_BOOK_CATALOG_PRICE_EVIDENCE_SOURCE",
        roles:["PRODUCT_IDENTITY", "PRICE_EVIDENCE", "AVAILABILITY_EVIDENCE", "EXACT_HANDOFF"],
        authorityPolicy:"OFFICIAL_CATALOG_SALE_INFO_LIMITED",
        supportsIdentity:"YES",
        supportsVariant:"PARTIAL",
        supportsPrice:"PARTIAL",
        supportsCurrency:"YES",
        supportsAvailability:"PARTIAL",
        supportsHandoff:"YES",
        supportedMarkets:["COUNTRY_PARAMETER_DEFINED"],
        commercialRelationshipOptional:true,
        controlledReadStatus:"READONLY_PUBLIC_API_VALIDATED",
        adapterImplementationStatus:"CONTROLLED_FIXTURE_NORMALIZER",
        maximumEvidenceAuthority:"OFFICIAL_BOOK_SALE_INFO",
        priceAuthority:"AUTHORITATIVE",
        freshnessPolicy:{ basis:"fetchedAt", maxCurrentAgeSeconds:86400, maxRecentAgeSeconds:604800 },
        allowedHandoffHosts:["books.google.com", "play.google.com"],
        limitations:[
          "Book price capability is limited to saleInfo payloads with explicit retail/list price currency.",
          "Catalog identity is strong for ISBN and Google volume id, but edition/format must remain explicit.",
          "Buy/info links are official Google links, not proof that all third-party bookstores have the same current price."
        ]
      },
      ticketmaster_discovery:{
        sourceId:"ticketmaster_discovery",
        sourceRole:"OFFICIAL_EVENT_PRICE_RANGE_EVIDENCE_SOURCE",
        roles:["EVENT_IDENTITY", "PRICE_EVIDENCE", "AVAILABILITY_EVIDENCE", "EXACT_HANDOFF"],
        authorityPolicy:"OFFICIAL_EVENT_PRICE_RANGE_LIMITED",
        supportsIdentity:"YES",
        supportsVariant:"YES",
        supportsPrice:"PARTIAL",
        supportsCurrency:"YES",
        supportsAvailability:"PARTIAL",
        supportsHandoff:"YES",
        supportedMarkets:["MARKET_PARAMETER_DEFINED"],
        commercialRelationshipOptional:true,
        controlledReadStatus:"READONLY_PUBLIC_API_VALIDATED",
        adapterImplementationStatus:"CONTROLLED_FIXTURE_NORMALIZER",
        maximumEvidenceAuthority:"OFFICIAL_EVENT_PRICE_RANGE",
        priceAuthority:"AUTHORITATIVE",
        freshnessPolicy:{ basis:"fetchedAt", maxCurrentAgeSeconds:21600, maxRecentAgeSeconds:86400 },
        allowedHandoffHosts:["www.ticketmaster.com", "ticketmaster.com"],
        limitations:[
          "Ticketmaster is event vertical evidence and must not be mixed into physical-product shopping.",
          "Price ranges and starting-at prices are conditional evidence, not ordinary exact purchasable item prices.",
          "No checkout, ticketing, or order capability is implemented."
        ]
      },
      ebay_sandbox:{
        sourceId:"ebay_sandbox",
        sourceRole:"SANDBOX_MARKETPLACE_LISTING_PRICE_EVIDENCE_SOURCE",
        roles:["LISTING_IDENTITY", "PRICE_EVIDENCE", "SANDBOX_HANDOFF"],
        authorityPolicy:"SANDBOX_TEST_DATA_ONLY",
        supportsIdentity:"PARTIAL",
        supportsVariant:"PARTIAL",
        supportsPrice:"PARTIAL",
        supportsCurrency:"YES",
        supportsAvailability:"PARTIAL",
        supportsHandoff:"YES",
        supportedMarkets:["US_SANDBOX"],
        commercialRelationshipOptional:true,
        controlledReadStatus:"SANDBOX_READONLY_VALIDATED",
        adapterImplementationStatus:"CONTROLLED_FIXTURE_NORMALIZER",
        maximumEvidenceAuthority:"SANDBOX_TEST_DATA",
        priceAuthority:"INDICATIVE",
        freshnessPolicy:{ basis:"fetchedAt", maxCurrentAgeSeconds:3600, maxRecentAgeSeconds:86400 },
        allowedHandoffHosts:["www.sandbox.ebay.com", "sandbox.ebay.com"],
        limitations:[
          "Sandbox data is useful for adapter and Product Truth development but is not real current market price coverage.",
          "Production eBay access and cross-provider display remain separately unauthorized.",
          "No Production keys, Growth Check, EPN, Buy, checkout, payment, or order capability is implemented."
        ]
      }
    };
  }

  function safety() {
    return {
      userDecisionRequired:true,
      executionGate:"CLOSED",
      authorizesExecution:false,
      executed:false,
      productionTraffic:false,
      productionAffected:false,
      checkout:false,
      payment:false,
      order:false,
      booking:false,
      ticketing:false,
      WEISHAN_PAYS_PROVIDER:false,
      PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false
    };
  }

  function failure(code, details) {
    return deepFreeze(Object.assign({
      bridgeName:BRIDGE_NAME,
      appVersion:VERSION,
      status:"FAILED",
      code:code,
      details:Array.isArray(details) ? details.slice() : []
    }, safety()));
  }

  function buildSourceCapabilityInventory() {
    const definitions = sourceDefinitions();
    const sources = Object.keys(definitions).sort().map(function (key) {
      const source = definitions[key];
      return {
        SOURCE_ID:source.sourceId,
        SOURCE_ROLE:source.sourceRole,
        PRODUCT_IDENTITY:source.supportsIdentity,
        VARIANT:source.supportsVariant,
        PRICE:source.supportsPrice,
        CURRENCY:source.supportsCurrency,
        AVAILABILITY:source.supportsAvailability,
        HANDOFF:source.supportsHandoff,
        AUTHORITY:source.authorityPolicy,
        PRICE_AUTHORITY:source.priceAuthority,
        CURRENTLY_USABLE:source.controlledReadStatus === "CONTROLLED_READONLY_IMPLEMENTED" || source.controlledReadStatus === "READONLY_PUBLIC_API_VALIDATED" || source.controlledReadStatus === "SANDBOX_READONLY_VALIDATED",
        CONTROLLED_READ_STATUS:source.controlledReadStatus,
        ADAPTER_IMPLEMENTATION_STATUS:source.adapterImplementationStatus,
        LIMITATIONS:source.limitations.slice()
      };
    });
    return deepFreeze(Object.assign({
      bridgeName:BRIDGE_NAME,
      appVersion:VERSION,
      status:"READY",
      sources:sources,
      sourceCount:sources.length,
      credentialsIncluded:false
    }, safety()));
  }

  function steamProductIdentity(value) {
    const normalized = text(value);
    if (normalized.startsWith("steam:")) {
      return { canonicalProductId:normalized, providerProductId:normalized.slice(6) };
    }
    return normalized ? { canonicalProductId:normalized } : {};
  }

  function cheapSharkVariant(offer) {
    const safe = obj(offer);
    const inputCondition = text(safe.itemCondition || safe.condition || "NEW").toLowerCase();
    return {
      platform:"steam",
      edition:text(safe.edition || "standard").toLowerCase() || "standard",
      condition:inputCondition || "new"
    };
  }

  function genericCondition(value, fallback) {
    const normalized = text(value || fallback || "NEW").toLowerCase();
    if (/refurb/.test(normalized)) return "refurbished";
    if (/used|preowned|pre-owned/.test(normalized)) return "used";
    if (/open[\s-]?box/.test(normalized)) return "open_box";
    return normalized || "new";
  }

  function sourcePolicy(source) {
    return {
      priceAuthority:source.priceAuthority,
      freshnessPolicy:clone(source.freshnessPolicy),
      allowedHandoffHosts:source.allowedHandoffHosts.slice()
    };
  }

  function googleBooksIdentity(offer) {
    const ids = Array.isArray(offer.industryIdentifiers) ? offer.industryIdentifiers : [];
    const isbn13 = ids.find(function (item) { return text(item && item.type).toUpperCase() === "ISBN_13"; });
    const isbn10 = ids.find(function (item) { return text(item && item.type).toUpperCase() === "ISBN_10"; });
    return {
      canonicalProductId:text(offer.canonicalProductId || (offer.id ? "google-books:" + offer.id : "")),
      providerProductId:text(offer.id),
      isbn:text(offer.isbn || (isbn13 && isbn13.identifier) || (isbn10 && isbn10.identifier)),
      title:text(offer.title),
      manufacturer:text(offer.publisher),
      brand:text(offer.publisher)
    };
  }

  function normalizeGoogleBooksOffer(rawOffer, source) {
    const offer = obj(rawOffer);
    const saleInfo = obj(offer.saleInfo);
    const retail = obj(offer.retailPrice || saleInfo.retailPrice || offer.listPrice || saleInfo.listPrice);
    const price = numberOrNull(offer.price || retail.amount);
    const currency = text(offer.currency || retail.currencyCode).toUpperCase();
    const saleability = text(offer.saleability || saleInfo.saleability || "UNKNOWN").toUpperCase();
    return {
      sourceId:source.sourceId,
      sourceRole:source.sourceRole,
      sourceItemId:text(offer.id),
      offerId:text(offer.offerId || offer.id),
      provider:source.sourceId,
      merchant:"Google Books",
      productName:text(offer.title),
      productIdentity:googleBooksIdentity(offer),
      variants:{ format:text(offer.format || offer.printType || "book").toLowerCase() || "book", condition:genericCondition(offer.condition, "NEW") },
      price:price,
      currency:currency,
      priceConditions:array(offer.priceConditions),
      priceConditionStatus:text(offer.priceConditionStatus || "UNCONDITIONAL").toUpperCase(),
      market:text(offer.market || saleInfo.country || "UNKNOWN").toUpperCase(),
      shipping:offer.shipping == null ? 0 : numberOrNull(offer.shipping),
      tax:offer.tax == null ? 0 : numberOrNull(offer.tax),
      fees:offer.fees == null ? 0 : numberOrNull(offer.fees),
      landedTotal:offer.landedTotal == null ? price : numberOrNull(offer.landedTotal),
      availability:saleability === "FOR_SALE" ? "IN_STOCK" : (saleability === "NOT_FOR_SALE" ? "OUT_OF_STOCK" : "UNKNOWN"),
      availabilityAuthority:saleability === "FOR_SALE" || saleability === "NOT_FOR_SALE",
      sourceStatus:text(offer.sourceStatus || "OK").toUpperCase(),
      handoffType:"OFFICIAL_MERCHANT_PRODUCT",
      handoffUrl:text(offer.buyLink || saleInfo.buyLink || offer.infoLink || offer.canonicalVolumeLink),
      allowedHandoffHosts:source.allowedHandoffHosts.slice(),
      sourcePolicy:sourcePolicy(source),
      affiliateEligible:false,
      commissionEligible:false,
      commercialMetadata:{},
      observedAt:text(offer.observedAt),
      fetchedAt:text(offer.fetchedAt),
      providerUpdatedAt:offer.providerUpdatedAt === null ? null : text(offer.providerUpdatedAt),
      cacheStoredAt:text(offer.cacheStoredAt),
      provenance:{
        sourceRecord:text(offer.id),
        adapterName:"global_commerce_google_books_controlled_fixture_normalizer_v1",
        maximumEvidenceAuthority:source.maximumEvidenceAuthority,
        rawAuthorityClaimIgnored:offer.verified === true || offer.authoritative === true
      }
    };
  }

  function normalizeTicketmasterOffer(rawOffer, source) {
    const offer = obj(rawOffer);
    const range = obj(offer.priceRange || (Array.isArray(offer.priceRanges) ? offer.priceRanges[0] : null));
    const min = numberOrNull(offer.price || range.min);
    const max = numberOrNull(offer.priceHigh || range.max);
    return {
      sourceId:source.sourceId,
      sourceRole:source.sourceRole,
      sourceItemId:text(offer.id),
      offerId:text(offer.offerId || offer.id),
      provider:source.sourceId,
      merchant:"Ticketmaster",
      productName:text(offer.name),
      productIdentity:{
        canonicalProductId:text(offer.canonicalProductId || (offer.id ? "ticketmaster-event:" + offer.id : "")),
        providerProductId:text(offer.id),
        title:text(offer.name)
      },
      variants:{ eventDate:text(offer.eventDate || offer.localDate), venue:text(offer.venue || offer.venueName).toLowerCase(), condition:"event_ticket" },
      price:min,
      priceHigh:max,
      currency:text(offer.currency || range.currency).toUpperCase(),
      priceConditions:array(offer.priceConditions),
      priceConditionStatus:"CONDITIONAL",
      priceType:max !== null && max !== min ? "PRICE_RANGE" : "STARTING_AT",
      market:text(offer.market || offer.countryCode || "UNKNOWN").toUpperCase(),
      shipping:null,
      tax:null,
      fees:null,
      landedTotal:null,
      availability:text(offer.availability || "UNKNOWN").toUpperCase(),
      availabilityAuthority:offer.availabilityAuthority === true,
      sourceStatus:text(offer.sourceStatus || "OK").toUpperCase(),
      handoffType:"OFFICIAL_MERCHANT_PRODUCT",
      handoffUrl:text(offer.url),
      allowedHandoffHosts:source.allowedHandoffHosts.slice(),
      sourcePolicy:sourcePolicy(source),
      affiliateEligible:false,
      commissionEligible:false,
      commercialMetadata:{},
      observedAt:text(offer.observedAt),
      fetchedAt:text(offer.fetchedAt),
      providerUpdatedAt:offer.providerUpdatedAt === null ? null : text(offer.providerUpdatedAt),
      cacheStoredAt:text(offer.cacheStoredAt),
      provenance:{
        sourceRecord:text(offer.id),
        adapterName:"global_commerce_ticketmaster_controlled_fixture_normalizer_v1",
        maximumEvidenceAuthority:source.maximumEvidenceAuthority,
        rawAuthorityClaimIgnored:offer.verified === true || offer.authoritative === true
      }
    };
  }

  function normalizeEbaySandboxOffer(rawOffer, source) {
    const offer = obj(rawOffer);
    const priceObj = obj(offer.price);
    const price = numberOrNull(offer.priceValue || priceObj.value);
    const buyingOptions = Array.isArray(offer.buyingOptions) ? offer.buyingOptions.map(text).filter(Boolean) : [];
    return {
      sourceId:source.sourceId,
      sourceRole:source.sourceRole,
      sourceItemId:text(offer.itemId),
      offerId:text(offer.offerId || offer.itemId),
      provider:source.sourceId,
      merchant:text(offer.seller || "eBay Sandbox"),
      productName:text(offer.title),
      productIdentity:{
        canonicalProductId:text(offer.canonicalProductId || (offer.itemId ? "ebay-sandbox:" + offer.itemId : "")),
        providerProductId:text(offer.itemId),
        title:text(offer.title)
      },
      variants:{ condition:genericCondition(offer.condition, "NEW") },
      price:price,
      currency:text(offer.currency || priceObj.currency).toUpperCase(),
      priceConditions:array(offer.priceConditions),
      priceConditionStatus:text(offer.priceConditionStatus || "UNCONDITIONAL").toUpperCase(),
      market:text(offer.market || "US_SANDBOX"),
      shipping:null,
      tax:null,
      fees:null,
      landedTotal:null,
      availability:buyingOptions.length ? "IN_STOCK" : "UNKNOWN",
      availabilityAuthority:false,
      sourceStatus:text(offer.sourceStatus || "OK").toUpperCase(),
      handoffType:"PROVIDER_REDIRECT",
      handoffUrl:text(offer.itemWebUrl),
      allowedHandoffHosts:source.allowedHandoffHosts.slice(),
      sourcePolicy:sourcePolicy(source),
      affiliateEligible:false,
      commissionEligible:false,
      commercialMetadata:{ sandbox:true },
      observedAt:text(offer.observedAt),
      fetchedAt:text(offer.fetchedAt),
      providerUpdatedAt:offer.providerUpdatedAt === null ? null : text(offer.providerUpdatedAt),
      cacheStoredAt:text(offer.cacheStoredAt),
      provenance:{
        sourceRecord:text(offer.itemId),
        adapterName:"global_commerce_ebay_sandbox_controlled_fixture_normalizer_v1",
        maximumEvidenceAuthority:source.maximumEvidenceAuthority,
        sandboxOnly:true,
        buyingOptions:buyingOptions,
        rawAuthorityClaimIgnored:offer.verified === true || offer.authoritative === true
      }
    };
  }

  function normalizeCheapSharkOffer(rawOffer, source) {
    const offer = obj(rawOffer);
    const price = numberOrNull(offer.price);
    const currency = text(offer.currency).toUpperCase();
    const dealId = text(offer.offerId || offer.dealID);
    return {
      sourceId:source.sourceId,
      sourceRole:source.sourceRole,
      sourceItemId:dealId,
      offerId:dealId,
      provider:source.sourceId,
      merchant:text(offer.merchant),
      productName:text(offer.productName),
      productIdentity:steamProductIdentity(offer.canonicalProductIdentity),
      variants:cheapSharkVariant(offer),
      price:price,
      currency:currency,
      priceConditions:array(offer.priceConditions),
      priceConditionStatus:"UNCONDITIONAL",
      market:text(offer.market || "US"),
      shipping:0,
      tax:0,
      fees:0,
      landedTotal:price,
      availability:text(offer.availabilityStatus) === "OFFER_OBSERVED" ? "IN_STOCK" : "UNKNOWN",
      availabilityAuthority:text(offer.availabilityStatus) === "OFFER_OBSERVED",
      sourceStatus:text(offer.sourceStatus || "OK").toUpperCase(),
      handoffType:"PROVIDER_REDIRECT",
      handoffUrl:text(offer.handoffUrl),
      allowedHandoffHosts:source.allowedHandoffHosts.slice(),
      sourcePolicy:{
        priceAuthority:source.priceAuthority,
        freshnessPolicy:clone(source.freshnessPolicy),
        allowedHandoffHosts:source.allowedHandoffHosts.slice()
      },
      affiliateEligible:false,
      commissionEligible:false,
      commercialMetadata:clone(obj(offer.commercialMetadata)),
      observedAt:text(offer.observedAt),
      providerUpdatedAt:offer.providerUpdatedAt === null ? null : text(offer.providerUpdatedAt),
      provenance:{
        sourceRecord:dealId,
        adapterName:"global_commerce_cheapshark_controlled_readonly_adapter_v1",
        maximumEvidenceAuthority:source.maximumEvidenceAuthority,
        rawAuthorityClaimIgnored:offer.verified === true || offer.authoritative === true || text(offer.handoffConfidence)
      }
    };
  }

  function normalizeSourceOffers(input) {
    const safe = obj(input);
    const sourceId = text(safe.sourceId);
    const definitions = sourceDefinitions();
    const source = definitions[sourceId];
    if (!source) return failure("SOURCE_NOT_TRUSTED", [sourceId || "missing_source_id"]);
    const offers = array(safe.offers || obj(safe.sourceResult).offers);
    let normalizedOffers = [];
    if (sourceId === "cheapshark") normalizedOffers = offers.map(function (offer) { return normalizeCheapSharkOffer(offer, source); });
    else if (sourceId === "google_books") normalizedOffers = offers.map(function (offer) { return normalizeGoogleBooksOffer(offer, source); });
    else if (sourceId === "ticketmaster_discovery") normalizedOffers = offers.map(function (offer) { return normalizeTicketmasterOffer(offer, source); });
    else if (sourceId === "ebay_sandbox") normalizedOffers = offers.map(function (offer) { return normalizeEbaySandboxOffer(offer, source); });
    else return failure("SOURCE_BRIDGE_NOT_IMPLEMENTED", [sourceId]);
    return deepFreeze(Object.assign({
      bridgeName:BRIDGE_NAME,
      appVersion:VERSION,
      status:"READY",
      source:clone(source),
      normalizedOffers:normalizedOffers,
      normalizedOfferCount:normalizedOffers.length
    }, safety()));
  }

  function normalizeMultipleSourceOffers(input) {
    const safe = obj(input);
    const sources = array(safe.sources);
    const normalized = [];
    const failures = [];
    sources.forEach(function (sourceInput) {
      const result = normalizeSourceOffers(sourceInput);
      if (result.status === "READY") normalized.push.apply(normalized, result.normalizedOffers);
      else failures.push({ sourceId:text(obj(sourceInput).sourceId), code:result.code || result.status });
    });
    return { normalizedOffers:normalized, failures:failures };
  }

  function buildProductTruthFlow(input) {
    const safe = obj(input);
    const normalized = normalizeSourceOffers(safe);
    if (normalized.status !== "READY") return normalized;
    const productTruth = window.WeishanGlobalCommerceProductTruthPipeline || {};
    if (typeof productTruth.buildGlobalCommerceProductTruthPipeline !== "function") {
      return failure("PRODUCT_TRUTH_PIPELINE_UNAVAILABLE");
    }
    const result = productTruth.buildGlobalCommerceProductTruthPipeline({
      query:safe.query,
      productIdentity:safe.productIdentity,
      requestedVariant:safe.requestedVariant,
      offers:normalized.normalizedOffers,
      now:safe.now
    });
    return deepFreeze(Object.assign({
      bridgeName:BRIDGE_NAME,
      appVersion:VERSION,
      status:result.status === "READY" ? "PRODUCT_TRUTH_READY" : result.status,
      sourceId:normalized.source.sourceId,
      sourceRole:normalized.source.sourceRole,
      source:normalized.source,
      adapterResult:{
        normalizedOfferCount:normalized.normalizedOfferCount,
        sourceRole:normalized.source.sourceRole
      },
      productTruth:result,
      trace:result.recommendation ? {
        sourceId:normalized.source.sourceId,
        sourceRecord:result.recommendation.offerId,
        adapter:"CONTROLLED_SOURCE_ADAPTER_BRIDGE",
        productTruthClassification:"ELIGIBLE",
        comparisonDecision:result.recommendation.reason,
        handoff:result.recommendation.handoffQuality
      } : null,
      controlledAdapterReady:true,
      productionReady:false
    }, safety()));
  }

  function buildMultiSourceProductTruthFlow(input) {
    const safe = obj(input);
    const normalized = normalizeMultipleSourceOffers(safe);
    const productTruth = window.WeishanGlobalCommerceProductTruthPipeline || {};
    if (typeof productTruth.buildGlobalCommerceProductTruthPipeline !== "function") {
      return failure("PRODUCT_TRUTH_PIPELINE_UNAVAILABLE");
    }
    const result = productTruth.buildGlobalCommerceProductTruthPipeline({
      query:safe.query,
      productIdentity:safe.productIdentity,
      requestedVariant:safe.requestedVariant,
      offers:normalized.normalizedOffers,
      now:safe.now
    });
    return deepFreeze(Object.assign({
      bridgeName:BRIDGE_NAME,
      appVersion:VERSION,
      status:result.status === "READY" ? "PRODUCT_TRUTH_READY" : result.status,
      normalizedOfferCount:normalized.normalizedOffers.length,
      sourceFailureCount:normalized.failures.length,
      sourceFailures:normalized.failures,
      productTruth:result,
      controlledAdapterReady:true,
      productionReady:false
    }, safety()));
  }

  function buildAdapterReadinessChecklist(input) {
    const safe = obj(input);
    const sourceId = text(safe.sourceId);
    const source = sourceDefinitions()[sourceId];
    if (!source) return failure("SOURCE_NOT_TRUSTED", [sourceId || "missing_source_id"]);
    const identityReady = source.supportsIdentity === "YES" || source.supportsIdentity === "PARTIAL";
    const priceReady = source.supportsPrice === "YES" || source.supportsPrice === "PARTIAL";
    const handoffReady = source.supportsHandoff === "YES" || source.supportsHandoff === "PARTIAL";
    const productTruthReady = ["cheapshark", "google_books", "ticketmaster_discovery", "ebay_sandbox"].indexOf(source.sourceId) >= 0 && identityReady && priceReady && handoffReady;
    return deepFreeze(Object.assign({
      bridgeName:BRIDGE_NAME,
      appVersion:VERSION,
      status:"READY",
      sourceId:source.sourceId,
      readiness:{
        IDENTITY_READY:identityReady,
        PRICE_READY:priceReady,
        HANDOFF_READY:handoffReady,
        PRODUCT_TRUTH_READY:productTruthReady,
        CONTROLLED_ADAPTER_READY:productTruthReady,
        PRODUCTION_READY:false
      },
      limitations:source.limitations.slice()
    }, safety()));
  }

  window.WeishanGlobalCommerceControlledSourceAdapterBridge = Object.freeze({
    VERSION,
    BRIDGE_NAME,
    buildSourceCapabilityInventory,
    normalizeSourceOffers,
    buildProductTruthFlow,
    buildMultiSourceProductTruthFlow,
    buildAdapterReadinessChecklist
  });
})();
