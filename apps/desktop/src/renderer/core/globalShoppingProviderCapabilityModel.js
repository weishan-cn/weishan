;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_CAPABILITY_MODEL_VERSION = "4.2.8";
  const MODEL_NAME = "global_shopping_provider_capability_model_v1";
  const CAPABILITY_KEYS = ["search", "price", "availability", "officialProduct", "taxInfo", "shippingEstimate"];
  const VALID_STATUS = { available:true, planned:true, disabled:true };

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function toArray(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function normalizeStatus(value, fallback) {
    const next = text(value || fallback);
    return VALID_STATUS[next] ? next : fallback;
  }

  function hasCapability(capabilities, names) {
    return names.some(function (name) {
      return capabilities.indexOf(name) >= 0;
    });
  }

  function deriveStatus(provider, explicit, key, defaults) {
    const capabilities = toArray(provider.capabilities);
    if (explicit[key]) return normalizeStatus(explicit[key], "disabled");
    if (key === "search") return hasCapability(capabilities, ["search"]) ? "available" : "planned";
    if (key === "price") return hasCapability(capabilities, ["price", "price_compare", "inventory_reference", "cross_border_reference"]) ? "planned" : defaults[key];
    if (key === "availability") return hasCapability(capabilities, ["inventory_reference", "detail_page", "official_referral"]) ? "planned" : defaults[key];
    if (key === "officialProduct") return hasCapability(capabilities, ["official_store", "official_referral"]) ? "available" : defaults[key];
    if (key === "taxInfo") return hasCapability(capabilities, ["tax_info"]) ? "planned" : defaults[key];
    if (key === "shippingEstimate") return hasCapability(capabilities, ["cross_border_reference", "shipping_estimate"]) ? "planned" : defaults[key];
    return defaults[key];
  }

  function summarize(model) {
    const summary = { available:[], planned:[], disabled:[] };
    CAPABILITY_KEYS.forEach(function (key) {
      summary[model[key]].push(key);
    });
    return summary;
  }

  function buildGlobalShoppingProviderCapabilityModel(input) {
    const safe = obj(input);
    const explicit = obj(safe.capabilityStatus);
    const defaults = {
      search:"planned",
      price:"planned",
      availability:"planned",
      officialProduct:"disabled",
      taxInfo:"disabled",
      shippingEstimate:"planned"
    };
    const model = {
      modelName:MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_CAPABILITY_MODEL_VERSION,
      providerId:text(safe.providerId || ""),
      search:deriveStatus(safe, explicit, "search", defaults),
      price:deriveStatus(safe, explicit, "price", defaults),
      availability:deriveStatus(safe, explicit, "availability", defaults),
      officialProduct:deriveStatus(safe, explicit, "officialProduct", defaults),
      taxInfo:deriveStatus(safe, explicit, "taxInfo", defaults),
      shippingEstimate:deriveStatus(safe, explicit, "shippingEstimate", defaults)
    };
    model.summary = summarize(model);
    model.redacted = true;
    return clone(model);
  }

  window.WeishanGlobalShoppingProviderCapabilityModel = {
    GLOBAL_SHOPPING_PROVIDER_CAPABILITY_MODEL_VERSION,
    MODEL_NAME,
    CAPABILITY_KEYS,
    buildGlobalShoppingProviderCapabilityModel
  };
})();
