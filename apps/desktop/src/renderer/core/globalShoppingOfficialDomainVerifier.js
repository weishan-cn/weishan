;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFICIAL_DOMAIN_VERIFIER_VERSION = "4.2.8";
  const ENGINE_NAME = "global_shopping_official_domain_verifier_v1";

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

  function hostFor(urlValue) {
    try {
      return new URL(String(urlValue || "").trim()).hostname.toLowerCase();
    } catch (_) {
      return "";
    }
  }

  function isOfficialHost(host, domains) {
    return domains.some(function (domain) {
      const normalized = text(domain).toLowerCase();
      return normalized && (host === normalized || host.endsWith("." + normalized));
    });
  }

  function buildGlobalShoppingOfficialDomainVerification(input) {
    const safe = obj(input);
    const providerId = text(safe.providerId || obj(safe.provider).providerId || "");
    const provider = providers().find(function (item) {
      return item.providerId === providerId || text(item.name) === text(safe.providerName || obj(safe.provider).name || "");
    }) || null;
    const url = text(safe.targetUrl || safe.url || safe.officialUrl || "");
    const host = hostFor(url);
    const domains = provider && Array.isArray(provider.officialDomains) ? provider.officialDomains.slice() : [];
    if (!provider || !url || !host) {
      return clone({
        engineName:ENGINE_NAME,
        appVersion:GLOBAL_SHOPPING_OFFICIAL_DOMAIN_VERIFIER_VERSION,
        verified:false,
        domain:host,
        trustLevel:"unknown",
        reason:"provider_or_url_missing",
        redacted:true
      });
    }
    if (/localhost|127\.0\.0\.1|0\.0\.0\.0/.test(host) || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      return clone({
        engineName:ENGINE_NAME,
        appVersion:GLOBAL_SHOPPING_OFFICIAL_DOMAIN_VERIFIER_VERSION,
        verified:false,
        domain:host,
        trustLevel:"blocked",
        reason:"unsafe_host_blocked",
        redacted:true
      });
    }
    if (isOfficialHost(host, domains)) {
      return clone({
        engineName:ENGINE_NAME,
        appVersion:GLOBAL_SHOPPING_OFFICIAL_DOMAIN_VERIFIER_VERSION,
        verified:true,
        domain:host,
        trustLevel:"verified",
        reason:"official_domain_match",
        redacted:true
      });
    }
    return clone({
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_SHOPPING_OFFICIAL_DOMAIN_VERIFIER_VERSION,
      verified:false,
      domain:host,
      trustLevel:"blocked",
      reason:"official_domain_mismatch",
      redacted:true
    });
  }

  window.WeishanGlobalShoppingOfficialDomainVerifier = {
    GLOBAL_SHOPPING_OFFICIAL_DOMAIN_VERIFIER_VERSION,
    ENGINE_NAME,
    buildGlobalShoppingOfficialDomainVerification
  };
})();
