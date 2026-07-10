;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_TRUST_REGISTRY_VERSION = "4.2.8";
  const REGISTRY_NAME = "global_shopping_provider_trust_registry_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function registryApi() {
    return window.WeishanGlobalShoppingProviderRegistry || {};
  }

  function providers() {
    return typeof registryApi().listGlobalShoppingProviders === "function"
      ? registryApi().listGlobalShoppingProviders()
      : [];
  }

  function hostname(urlValue) {
    try {
      return new URL(String(urlValue || "").trim()).hostname.toLowerCase();
    } catch (_) {
      return "";
    }
  }

  function isOfficialDomain(host, domains) {
    return domains.some(function (domain) {
      const normalized = text(domain).toLowerCase();
      return host === normalized || host.endsWith("." + normalized);
    });
  }

  function buildGlobalShoppingProviderTrustSummary(input) {
    const safe = obj(input);
    const providerId = text(safe.providerId || "");
    const url = text(safe.targetUrl || safe.officialUrl || "");
    const host = hostname(url);
    const provider = providers().find(function (item) {
      return item.providerId === providerId || text(item.name) === text(safe.providerName || "");
    }) || null;
    const domains = provider ? provider.officialDomains : [];
    const officialMatch = provider ? isOfficialDomain(host, domains) : false;
    let status = "needs_review";
    if (!provider || !host) status = "needs_review";
    else if (!officialMatch) status = "blocked";
    else status = "ready";
    return clone({
      registryName:REGISTRY_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_TRUST_REGISTRY_VERSION,
      providerId:provider ? provider.providerId : providerId,
      providerName:provider ? provider.name : text(safe.providerName || ""),
      targetHost:host,
      officialDomains:domains.slice(),
      officialMatch:officialMatch,
      status:status,
      trustLevel:provider ? provider.trustLevel : "review",
      unknownDomainBlocked:!officialMatch,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderTrustRegistry = {
    GLOBAL_SHOPPING_PROVIDER_TRUST_REGISTRY_VERSION,
    REGISTRY_NAME,
    buildGlobalShoppingProviderTrustSummary
  };
})();
