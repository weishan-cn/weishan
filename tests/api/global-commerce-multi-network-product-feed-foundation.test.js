"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const FILES = [
  "apps/desktop/src/renderer/core/globalCommerceInputGuard.js",
  "apps/desktop/src/renderer/core/globalShoppingPriceFreshnessModel.js",
  "apps/desktop/src/renderer/core/globalCommercePriceEvidence.js",
  "apps/desktop/src/renderer/core/globalCommerceFeedSecurity.js",
  "apps/desktop/src/renderer/core/globalCommerceFeedSourceDescriptor.js",
  "apps/desktop/src/renderer/core/globalCommerceFeedAdapterContract.js",
  "apps/desktop/src/renderer/core/globalCommerceFeedNormalizer.js"
];

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, URL, AbortController, setTimeout, clearTimeout, console });
  FILES.forEach(function (file) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  });
  return window;
}
function json(value) { return JSON.parse(JSON.stringify(value)); }
function descriptor(overrides) {
  return Object.assign({
    sourceId:"synthetic_network_feed", provider:"synthetic_provider", network:"Synthetic Network", merchant:"Synthetic Merchant",
    program:"Synthetic Program", environment:"fixture", feedId:"feed-001", sourceType:"SYNTHETIC_FIXTURE",
    sourceUrl:"https://feed.synthetic-network.invalid/catalog/feed-001", allowedSourceHosts:["feed.synthetic-network.invalid"],
    retrievedAt:"2026-08-20T08:00:00.000Z", providerUpdatedAt:"UNKNOWN", feedGeneratedAt:"UNKNOWN",
    authorizationClass:"CANDIDATE_FIXTURE_ONLY", comparisonPermission:"ALLOWED", displayPermission:"ALLOWED",
    cachePermission:"LIMITED", providerCostPolicy:"FREE_AUTHORIZED", attributionRequirement:"REQUIRED", handoffRequirement:"REQUIRED"
  }, overrides || {});
}
function mappings() {
  return {
    productName:"title", gtin:"gtin", ean:null, upc:null, isbn:null, mpn:"mpn", manufacturer:"manufacturer",
    merchantSku:"merchant_sku", networkProductId:"network_product_id", canonicalProductUrl:"canonical_url",
    variantSize:"size", variantColor:"color", variantStorage:"storage", variantConfiguration:"configuration", variantRegion:"region",
    merchant:"merchant", seller:"seller", currentPrice:"current_price", salePrice:"sale_price", listPrice:"list_price",
    currency:"currency", itemCondition:"condition", availability:"availability", quantity:"quantity", minimumOrderQuantity:"moq",
    priceConditions:"conditions", shippingInclusion:"shipping", taxInclusion:"tax", handoffUrl:"deeplink",
    observedAt:"observed_at", providerUpdatedAt:"provider_updated_at", feedGeneratedAt:"feed_generated_at", offerId:"offer_id"
  };
}
function contract(overrides) {
  const base = {
    contractId:"synthetic-feed-adapter-v1", adapterVersion:"1.0.0", sourceDescriptor:descriptor(),
    endpointHostPolicy:{ allowedHosts:["feed.synthetic-network.invalid", "go.synthetic-network.invalid"] },
    credentialRequirement:"NONE", feedFormat:"JSON", fieldMappings:mappings(),
    availabilityMapping:{ available:"IN_STOCK", unavailable:"OUT_OF_STOCK" },
    itemConditionMapping:{ new:"NEW", used:"USED", refurb:"REFURBISHED" },
    priceConditionsComplete:true, availabilityAuthority:true, handoffType:"AFFILIATE_HANDOFF",
    attributionMetadata:{ required:true, label:"Synthetic Network" },
    rateLimitMetadata:{ maxRequests:10, windowSeconds:60, automaticPolling:false },
    rawResponseLimits:{ maxBytes:131072, maxRows:100 }, cachePolicy:{ mode:"TTL", ttlSeconds:3600 }
  };
  return Object.assign(base, overrides || {});
}
function record(overrides) {
  return Object.assign({
    title:"Synthetic Headphones", gtin:"09506000134352", mpn:"HP-1", manufacturer:"Synthetic Audio",
    merchant_sku:"SKU-1", network_product_id:"NP-1", canonical_url:"https://feed.synthetic-network.invalid/products/np-1",
    size:null, color:"black", storage:null, configuration:"standard", region:"CN",
    merchant:"Synthetic Merchant", seller:"Synthetic Seller", current_price:129.99, sale_price:null, list_price:159.99,
    currency:"USD", condition:"new", availability:"available", quantity:5, moq:1, conditions:[],
    shipping:"EXCLUDED", tax:"UNKNOWN", deeplink:"https://go.synthetic-network.invalid/click/offer-1",
    observed_at:"2026-08-20T07:59:00.000Z", provider_updated_at:null, feed_generated_at:null, offer_id:"offer-1",
    commercialMetadata:{ commission:0.05, epc:0.2, payout:"5%" }
  }, overrides || {});
}

function main() {
  const window = load();
  const security = window.WeishanGlobalCommerceFeedSecurity;
  const sources = window.WeishanGlobalCommerceFeedSourceDescriptor;
  const adapters = window.WeishanGlobalCommerceFeedAdapterContract;
  const normalizer = window.WeishanGlobalCommerceFeedNormalizer;

  const source = sources.createSourceDescriptor(descriptor());
  assert.equal(source.success, true);
  assert.equal(source.descriptor.provider, "synthetic_provider");
  assert.equal(source.descriptor.network, "Synthetic Network");
  assert.equal(source.descriptor.merchant, "Synthetic Merchant");
  assert.equal(source.descriptor.providerUpdatedAt, "UNKNOWN");
  assert.equal(source.descriptor.feedGeneratedAt, "UNKNOWN");
  assert.equal(source.descriptor.providerTimestampKnown, false);
  assert.equal(source.descriptor.executionGate, "CLOSED");
  assert.equal(source.descriptor.authorizesExecution, false);
  assert.equal(source.descriptor.productionTraffic, false);
  assert.equal(source.descriptor.providerCostPolicy, "FREE_AUTHORIZED");
  assert.equal(source.descriptor.WEISHAN_PAYS_PROVIDER, false);
  assert.equal(source.descriptor.PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION, false);
  assert.equal(Object.isFrozen(source), true);
  assert.equal(Object.isFrozen(source.descriptor), true);
  assert.equal(sources.createSourceDescriptor(descriptor({ comparisonPermission:"" })).error.code, "SOURCE_DESCRIPTOR_INCOMPLETE");
  assert.equal(sources.createSourceDescriptor(descriptor({ sourceUrl:"http://feed.synthetic-network.invalid/x" })).error.code, "SOURCE_URL_NOT_ALLOWED");
  assert.equal(sources.createSourceDescriptor(descriptor({ sourceUrl:"https://localhost/x" })).error.code, "SOURCE_URL_NOT_ALLOWED");
  assert.equal(sources.createSourceDescriptor(descriptor({ allowedSourceHosts:["feed.synthetic-network.invalid", "127.0.0.1"] })).error.code, "SOURCE_HOST_POLICY_INVALID");
  assert.equal(sources.createSourceDescriptor(descriptor({ retrievedAt:"UNKNOWN" })).error.code, "SOURCE_DESCRIPTOR_INCOMPLETE");
  assert.equal(sources.createSourceDescriptor(descriptor({ sourceId:"unsafe\u0000source" })).error.code, "SOURCE_DESCRIPTOR_INCOMPLETE");

  const adapter = adapters.createAdapterContract(contract());
  assert.equal(adapter.success, true);
  assert.equal(adapter.contract.feedFormat, "JSON");
  assert.equal(adapter.contract.credentialRequirement, "NONE");
  assert.equal(adapter.contract.networkDownloadImplemented, false);
  assert.equal(adapter.contract.scheduledPolling, false);
  assert.equal(adapter.contract.productionTraffic, false);
  assert.equal(adapter.contract.endpointHostPolicy.arbitraryHostAllowed, false);
  assert.equal(Object.isFrozen(adapter.contract.fieldMappings), true);
  const missingMapping = mappings(); delete missingMapping.currency;
  assert.equal(adapters.createAdapterContract(contract({ fieldMappings:missingMapping })).error.code, "FIELD_MAPPING_NOT_EXPLICIT");
  assert.equal(adapters.createAdapterContract(contract({ endpointHostPolicy:{ allowedHosts:["localhost"] } })).error.code, "ENDPOINT_HOST_POLICY_INVALID");
  assert.equal(adapters.createAdapterContract(contract({ endpointHostPolicy:{ allowedHosts:["go.synthetic-network.invalid", "127.0.0.1"] } })).error.code, "ENDPOINT_HOST_POLICY_INVALID");
  assert.equal(adapters.createAdapterContract(contract({ contractId:"" })).error.code, "ADAPTER_IDENTITY_REQUIRED");
  assert.equal(adapters.createAdapterContract(contract({ availabilityMapping:{ available:"YES" } })).error.code, "SEMANTIC_MAPPING_INVALID");
  assert.equal(adapters.createAdapterContract(contract({ cachePolicy:{ mode:"TTL", ttlSeconds:0 } })).error.code, "CACHE_POLICY_INVALID");
  assert.equal(adapters.createAdapterContract(contract({ rateLimitMetadata:{ maxRequests:10, windowSeconds:60, automaticPolling:true } })).error.code, "RATE_LIMIT_METADATA_INVALID");

  const jsonRows = security.parseFeedPayload({ format:"JSON", payload:JSON.stringify([{ id:"1", price:10 }]) });
  assert.equal(jsonRows.success, true);
  assert.equal(jsonRows.rowCount, 1);
  assert.deepEqual(json(jsonRows.rows[0]), { id:"1", price:10 });
  const csvRows = security.parseFeedPayload({ format:"CSV", payload:"id,title,price\n1,\"Headphones, Black\",129.99\n" });
  assert.equal(csvRows.success, true);
  assert.equal(csvRows.rows[0].title, "Headphones, Black");
  const xmlRows = security.parseFeedPayload({ format:"XML", payload:"<feed><item><id>1</id><title>Headphones &amp; Case</title></item></feed>" });
  assert.equal(xmlRows.success, true);
  assert.equal(xmlRows.rows[0].title, "Headphones & Case");
  assert.equal(security.parseFeedPayload({ format:"XML", payload:'<!DOCTYPE x [<!ENTITY e SYSTEM "file:///etc/passwd">]><feed><item><id>&e;</id></item></feed>' }).error.code, "XML_EXTERNAL_CONTENT_REJECTED");
  assert.equal(security.parseFeedPayload({ format:"XML", payload:"<feed><item><id>&unknown;</id></item></feed>" }).error.code, "XML_ENTITY_REJECTED");
  assert.equal(security.parseFeedPayload({ format:"CSV", payload:"id,id\n1,2\n" }).error.code, "CSV_HEADER_REJECTED");
  assert.equal(security.parseFeedPayload({ format:"JSON", payload:"{bad}" }).error.code, "MALFORMED_JSON");
  assert.equal(security.parseFeedPayload({ format:"JSON", payload:JSON.stringify([{ apiKey:"must-not-persist" }]) }).success, false);
  assert.equal(security.parseFeedPayload({ format:"JSON", payload:"[]", limits:{ maxBytes:1024, maxRows:10, maxFields:10, maxFieldLength:100 } }).success, true);
  assert.equal(security.parseFeedPayload({ format:"JSON", payload:"x".repeat(1025), limits:{ maxBytes:1024 } }).error.code, "PAYLOAD_TOO_LARGE");
  const getter = {};
  Object.defineProperty(getter, "format", { get:function () { throw new Error("must not execute"); } });
  assert.equal(security.parseFeedPayload(getter).success, false);
  const setter = { payload:"[]" };
  Object.defineProperty(setter, "format", { set:function () {}, enumerable:true });
  assert.equal(security.parseFeedPayload(setter).success, false);
  const pollutedPrototype = { inheritedPollution:true };
  const polluted = Object.create(pollutedPrototype);
  polluted.format = "JSON"; polluted.payload = "[]";
  assert.equal(security.parseFeedPayload(polluted).success, false);
  assert.equal(security.parseFeedPayload({ format:"JSON", payload:'[{"__proto__":{"polluted":true}}]' }).success, false);
  assert.equal(security.validateHttpsUrl("https://go.synthetic-network.invalid/click/1", ["go.synthetic-network.invalid"]).success, true);
  ["http://go.synthetic-network.invalid/x", "file:///tmp/x", "data:text/plain,x", "javascript:alert(1)", "https://localhost/x", "https://127.0.0.1/x", "https://evil.invalid/x"].forEach(function (url) {
    assert.equal(security.validateHttpsUrl(url, ["go.synthetic-network.invalid"]).success, false);
  });
  assert.equal(security.validateRedirectChain("https://go.synthetic-network.invalid/a", ["https://go.synthetic-network.invalid/b"], ["go.synthetic-network.invalid"]).success, true);
  assert.equal(security.validateRedirectChain("https://go.synthetic-network.invalid/a", ["https://evil.invalid/b"], ["go.synthetic-network.invalid"]).error.code, "REDIRECT_ESCAPE_REJECTED");

  const normalized = normalizer.normalizeFeedOffer({ adapterContract:contract(), record:record() });
  assert.equal(normalized.success, true);
  assert.equal(normalized.offer.network, "Synthetic Network");
  assert.equal(normalized.offer.merchant, "Synthetic Merchant");
  assert.equal(normalized.offer.seller, "Synthetic Seller");
  assert.equal(normalized.offer.productIdentity.gtin, "09506000134352");
  assert.equal(normalized.offer.identityBasis, "GLOBAL_IDENTIFIER");
  assert.equal(normalized.offer.exactSameProductEligible, true);
  assert.equal(normalized.offer.variants.color, "black");
  assert.equal(normalized.offer.variants.configuration, "standard");
  assert.equal(normalized.offer.price, 129.99);
  assert.equal(normalized.offer.priceType, "CURRENT");
  assert.equal(normalized.offer.listPrice, 159.99);
  assert.equal(normalized.offer.currency, "USD");
  assert.equal(normalized.offer.itemCondition, "NEW");
  assert.equal(normalized.offer.availability, "IN_STOCK");
  assert.equal(normalized.offer.shippingInclusion, "EXCLUDED");
  assert.equal(normalized.offer.taxInclusion, "UNKNOWN");
  assert.equal(normalized.offer.landedPrice, null);
  assert.equal(normalized.offer.handoffType, "AFFILIATE_HANDOFF");
  assert.equal(normalized.offer.comparisonEligible, true);
  assert.equal(normalized.offer.providerEligibility, "ELIGIBLE");
  assert.equal(normalized.offer.currentPurchaseAuthority, false);
  assert.equal(normalized.offer.liveOffer, false);
  assert.equal(normalized.offer.providerUpdatedAt, "UNKNOWN");
  assert.equal(normalized.offer.feedGeneratedAt, "UNKNOWN");
  assert.equal(normalized.offer.provenance.network, "Synthetic Network");
  assert.equal(normalized.offer.provenance.merchant, "Synthetic Merchant");
  assert.equal(normalized.offer.provenance.program, "Synthetic Program");
  assert.equal(normalized.offer.provenance.feedId, "feed-001");
  assert.equal(normalized.evidence.evidenceType, "AUTHORIZED_AFFILIATE_CATALOG");
  assert.equal(normalized.evidence.executionGate, "CLOSED");
  assert.equal(normalized.evidence.authorizesExecution, false);
  assert.equal(normalized.productionTraffic, false);
  assert.equal(Object.isFrozen(normalized.offer.provenance), true);

  const sale = normalizer.normalizeFeedOffer({ adapterContract:contract(), record:record({ sale_price:99.99, conditions:["COUPON"] }) });
  assert.equal(sale.success, true);
  assert.equal(sale.offer.price, 99.99);
  assert.equal(sale.offer.priceType, "SALE");
  assert.equal(sale.offer.conditionalPrice, true);
  assert.equal(sale.offer.comparisonEligible, false);
  assert.deepEqual(json(sale.offer.priceConditions), ["COUPON"]);
  assert.equal(sale.evidence.priceConditionStatus, "CONDITIONAL");
  ["MEMBERSHIP", "NEW_USER", "APP_ONLY", "LOGIN_ONLY", "SUBSCRIPTION", "GROUP_BUY", "TRADE_IN", "FINANCING", "BUNDLE", "LOYALTY", "REGION_SPECIFIC", "QUANTITY", "SHIPPING_EXCLUSIVE", "TAX_EXCLUSIVE"].forEach(function (condition) {
    const result = normalizer.normalizeFeedOffer({ adapterContract:contract(), record:record({ conditions:[condition] }) });
    assert.equal(result.success, true);
    assert.equal(result.offer.comparisonEligible, false);
  });
  assert.equal(normalizer.normalizeFeedOffer({ adapterContract:contract(), record:record({ current_price:null, sale_price:null, list_price:199 }) }).error.code, "CURRENT_PRICE_REQUIRED");
  assert.equal(normalizer.normalizeFeedOffer({ adapterContract:contract(), record:record({ currency:"US" }) }).error.code, "CURRENCY_NORMALIZATION_REQUIRED");
  assert.equal(normalizer.normalizeFeedOffer({ adapterContract:contract(), record:record({ current_price:-1 }) }).error.code, "CURRENT_PRICE_REQUIRED");
  assert.equal(normalizer.normalizeFeedOffer({ adapterContract:contract(), record:record({ current_price:NaN }) }).error.code, "FEED_RECORD_INPUT_REJECTED");
  assert.equal(normalizer.normalizeFeedOffer({ adapterContract:contract(), record:record({ current_price:Infinity }) }).error.code, "FEED_RECORD_INPUT_REJECTED");
  assert.equal(normalizer.normalizeFeedOffer({ adapterContract:contract(), record:record({ provider_updated_at:"not-a-date" }) }).error.code, "PROVIDER_TIMESTAMP_INVALID");
  assert.equal(normalizer.normalizeFeedOffer({ adapterContract:contract(), record:record({ gtin:null, mpn:null, merchant_sku:null, network_product_id:null, title:"Title only" }) }).error.code, "PRODUCT_IDENTITY_REQUIRED");
  const skuOnly = normalizer.normalizeFeedOffer({ adapterContract:contract(), record:record({ gtin:null, mpn:null, network_product_id:null }) });
  assert.equal(skuOnly.success, true);
  assert.equal(skuOnly.offer.identityBasis, "MERCHANT_SCOPED_SKU");
  assert.equal(skuOnly.offer.exactSameProductEligible, false);
  assert.equal(skuOnly.offer.comparisonEligible, false);
  const unknownAvailability = normalizer.normalizeFeedOffer({ adapterContract:contract(), record:record({ availability:"ships soon" }) });
  assert.equal(unknownAvailability.offer.availability, "UNKNOWN");
  const noAuthority = normalizer.normalizeFeedOffer({ adapterContract:contract({ availabilityAuthority:false }), record:record() });
  assert.equal(noAuthority.offer.availability, "UNKNOWN");
  const used = normalizer.normalizeFeedOffer({ adapterContract:contract(), record:record({ condition:"used" }) });
  const refurbished = normalizer.normalizeFeedOffer({ adapterContract:contract(), record:record({ condition:"refurb" }) });
  assert.equal(used.offer.itemCondition, "USED");
  assert.equal(refurbished.offer.itemCondition, "REFURBISHED");
  assert.equal(used.offer.comparisonEligible, false);
  assert.equal(refurbished.offer.comparisonEligible, false);
  const paidDeferred = normalizer.normalizeFeedOffer({ adapterContract:contract({ sourceDescriptor:descriptor({ providerCostPolicy:"PAID_PROVIDER_DEFERRED" }) }), record:record() });
  assert.equal(paidDeferred.success, true);
  assert.equal(paidDeferred.offer.providerEligibility, "PAID_PROVIDER_DEFERRED");
  assert.equal(paidDeferred.offer.comparisonEligible, false);
  assert.equal(normalizer.normalizeFeedOffer({ adapterContract:contract(), record:record({ deeplink:"https://127.0.0.1/x" }) }).error.code, "HANDOFF_NOT_AUTHORIZED");
  assert.equal(normalizer.normalizeFeedOffer({ adapterContract:contract(), record:record({ deeplink:"file:///tmp/x" }) }).error.code, "HANDOFF_NOT_AUTHORIZED");

  const commissionChanged = normalizer.normalizeFeedOffer({ adapterContract:contract(), record:record({ commercialMetadata:{ commission:0.99, epc:999, payout:"99%" } }) });
  assert.equal(commissionChanged.success, true);
  assert.notDeepEqual(json(normalized.commercialMetadata), json(commissionChanged.commercialMetadata));
  assert.deepEqual(json(normalized.offer), json(commissionChanged.offer));
  assert.deepEqual(json(normalized.evidence), json(commissionChanged.evidence));
  assert.equal(commissionChanged.PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION, false);

  const duplicate = normalizer.normalizeFeedOffer({ adapterContract:contract(), record:record() });
  const conflict = normalizer.normalizeFeedOffer({ adapterContract:contract(), record:record({ current_price:130.99 }) });
  const otherCurrency = normalizer.normalizeFeedOffer({ adapterContract:contract(), record:record({ currency:"EUR" }) });
  let reconciled = normalizer.reconcileObservations([normalized, duplicate]);
  assert.equal(reconciled.success, true);
  assert.equal(reconciled.groups[0].status, "DUPLICATE_OBSERVATION");
  assert.equal(reconciled.groups[0].observations.length, 2);
  reconciled = normalizer.reconcileObservations([normalized, conflict]);
  assert.equal(reconciled.groups[0].status, "PRICE_EVIDENCE_CONFLICT");
  assert.equal(reconciled.groups[0].observations.length, 2);
  reconciled = normalizer.reconcileObservations([normalized, otherCurrency]);
  assert.equal(reconciled.groups[0].status, "CURRENCY_NORMALIZATION_REQUIRED");
  const revoked = normalizer.invalidateSourceObservations([normalized, sale], "synthetic_network_feed");
  assert.equal(revoked.success, true);
  assert.equal(revoked.deletedCount, 0);
  assert.equal(revoked.observations.every(function (item) { return item.active === false && item.invalidationReason === "SOURCE_REVOKED"; }), true);
  assert.equal(normalized.offer.price, 129.99);

  const sourceText = FILES.slice(3).map(function (file) { return fs.readFileSync(path.join(ROOT, file), "utf8"); }).join("\n");
  assert.equal(/\bfetch\s*\(/.test(sourceText), false);
  assert.equal(/XMLHttpRequest|WebSocket|EventSource/.test(sourceText), false);
  assert.equal(sourceText.includes("Awin"), false);
  assert.equal(sourceText.includes("Commission Factory"), false);
  assert.equal(sourceText.includes("TradeDoubler"), false);
  assert.equal(sourceText.includes("PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false"), true);
  assert.equal(sourceText.includes('executionGate:"CLOSED"'), true);
  assert.equal(sourceText.includes("productionTraffic:false"), true);

  console.log("global commerce multi-network product feed foundation tests: PASS");
}

main();
