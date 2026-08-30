(function(){
  "use strict";

  const VERSION = "1.0.0";
  const MIN_COMPARABLE_REAL_OFFERS = 2;

  function text(value, max){
    const normalized = String(value == null ? "" : value).normalize("NFKC").trim();
    return normalized && normalized.length <= (max || 240) && !/[\u0000-\u001f\u007f]/.test(normalized) ? normalized : "";
  }
  function key(value){
    return text(value, 300).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  }
  function https(value){
    try { const parsed = new URL(text(value, 1000)); return parsed.protocol === "https:" && !parsed.username && !parsed.password ? parsed.toString() : ""; } catch (_) { return ""; }
  }
  function identity(item){
    const safe = item && typeof item === "object" ? item : {};
    const explicit = key(safe.canonicalProductIdentity || safe.ean || safe.gtin);
    if (explicit) return explicit;
    const evidence = safe.truthEvidence && typeof safe.truthEvidence === "object" ? safe.truthEvidence : {};
    return key([safe.brand, evidence.productName || safe.title, evidence.variant || safe.variant, safe.condition || evidence.condition || "NEW"].filter(Boolean).join(" | "));
  }
  function authoritativeIdentity(item){
    const raw = text(item && (item.canonicalProductIdentity || item.ean || item.gtin), 300).toLowerCase();
    return /^(?:ean|gtin|upc|isbn|barcode)\s*:/.test(raw) || /^\d{8,14}$/.test(raw);
  }
  function merchant(item){
    return key(item && (item.merchantId || item.retailer || item.merchant || item.platformName));
  }
  function market(item, fallback){
    return key(item && (item.market || item.destinationMarket || item.destinationCountry) || fallback);
  }
  function validOffer(item, fallbackMarket){
    const safe = item && typeof item === "object" ? item : {};
    const evidence = safe.truthEvidence && typeof safe.truthEvidence === "object" ? safe.truthEvidence : {};
    const price = Number(safe.totalPrice !== undefined ? safe.totalPrice : safe.price);
    const currency = text(safe.currency || evidence.currency, 3).toUpperCase();
    const retrievedAt = text(safe.retrievedAt || evidence.retrievedAt, 80);
    const handoffUrl = https(safe.targetUrl || safe.officialUrl || evidence.deepLink);
    const productIdentity = identity(safe);
    const merchantIdentity = merchant(safe);
    const targetMarket = market(safe, fallbackMarket);
    if (evidence.evidenceTruthClass !== "REAL_PROVIDER_PRICE" || evidence.displayAsLiveCurrentPrice !== true) return null;
    if (!Number.isFinite(price) || price <= 0 || !/^[A-Z]{3}$/.test(currency) || !Number.isFinite(Date.parse(retrievedAt))) return null;
    if (!handoffUrl || !productIdentity || !merchantIdentity || !targetMarket) return null;
    if (String(safe.availability || evidence.availabilityStatus || "").toUpperCase() === "OUT_OF_STOCK") return null;
    return Object.freeze({
      offer:safe, price, currency, retrievedAt, handoffUrl, productIdentity, productIdentityAuthoritative:authoritativeIdentity(safe), merchantIdentity, targetMarket,
      condition:key(safe.condition || evidence.condition || "NEW"),
      quantity:key(safe.quantity || evidence.variant || safe.variant || "")
    });
  }
  function compareOffers(input){
    const safe = input && typeof input === "object" ? input : {};
    const fallbackMarket = text(safe.market, 80);
    const deduped = new Map();
    (Array.isArray(safe.offers) ? safe.offers : []).forEach(function(item){
      const offer = validOffer(item, fallbackMarket);
      if (!offer) return;
      const dedupeKey = [offer.merchantIdentity, offer.productIdentity, offer.condition, offer.quantity, offer.handoffUrl].join("|");
      if (!deduped.has(dedupeKey)) deduped.set(dedupeKey, offer);
    });
    const groups = new Map();
    Array.from(deduped.values()).forEach(function(offer){
      // productIdentity already includes the variant for derived identities, while
      // authoritative identifiers such as EAN identify the exact sellable item.
      // Keeping a second free-text quantity key here split the same EAN when two
      // retailers formatted an equivalent quantity differently (for example
      // "150 g" versus "150g").
      const quantityKey = offer.productIdentityAuthoritative ? "" : offer.quantity;
      const groupKey = [offer.targetMarket, offer.productIdentity, offer.condition, quantityKey, offer.currency].join("|");
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey).push(offer);
    });
    const comparisonGroups = Array.from(groups.entries()).map(function(entry){
      const offers = entry[1];
      const merchants = new Set(offers.map(function(offer){ return offer.merchantIdentity; }));
      const directlyComparable = merchants.size >= MIN_COMPARABLE_REAL_OFFERS;
      const ranked = offers.slice().sort(function(left, right){ return left.price - right.price || left.merchantIdentity.localeCompare(right.merchantIdentity); });
      const lower = directlyComparable && ranked.length > 1 && ranked[0].price < ranked[1].price ? ranked[0] : null;
      return Object.freeze({
        comparisonGroupId:entry[0], status:directlyComparable ? "READY" : "INSUFFICIENT_OFFERS",
        comparableVerifiedOfferCount:merchants.size, offers:Object.freeze(ranked),
        lowerVerifiedOffer:lower, lowerVerifiedOfferLabel:lower ? "当前已验证报价中较低" : ""
      });
    });
    const ready = comparisonGroups.filter(function(group){ return group.status === "READY"; });
    const firstReady = ready[0] || null;
    const firstReadyPrices = firstReady ? firstReady.offers.map(function(offer){ return offer.price; }) : [];
    const firstReadyIsTie = firstReadyPrices.length > 1 && firstReadyPrices.every(function(price){ return price === firstReadyPrices[0]; });
    const maxCount = comparisonGroups.reduce(function(max, group){ return Math.max(max, group.comparableVerifiedOfferCount); }, 0);
    return Object.freeze({
      version:VERSION,
      status:ready.length ? "READY" : (deduped.size ? "INSUFFICIENT_OFFERS" : "NO_VERIFIED_OFFERS"),
      comparisonGroupCount:comparisonGroups.length,
      comparableVerifiedOfferCountMax:maxCount,
      groups:Object.freeze(comparisonGroups),
      lowerVerifiedOffer:firstReady ? firstReady.lowerVerifiedOffer : null,
      lowerVerifiedOfferLabel:firstReady ? firstReady.lowerVerifiedOfferLabel : "",
      userFacingSummary:ready.length
        ? (firstReadyIsTie ? "已找到至少 2 个独立商户的可比较验证报价；当前最低报价并列。" : "已找到至少 2 个独立商户的可比较验证报价。")
        : (deduped.size ? "仅找到 1 个已验证报价，暂不足以比较。" : "当前没有找到可验证的实时报价。"),
      globalCheapestClaim:false,
      executionGate:"CLOSED",
      authorizesExecution:false
    });
  }

  window.WeishanRealPriceMultiMerchantComparison = Object.freeze({ VERSION, MIN_COMPARABLE_REAL_OFFERS, compareOffers });
})();
