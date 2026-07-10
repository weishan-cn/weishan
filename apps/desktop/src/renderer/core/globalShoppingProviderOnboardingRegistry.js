;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_ONBOARDING_REGISTRY_VERSION = "4.2.8";
  const REGISTRY_NAME = "global_shopping_provider_onboarding_registry_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
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

  function normalizeProvider(provider) {
    return {
      providerId:text(provider.providerId || ""),
      name:text(provider.name || ""),
      countries:Array.isArray(provider.countries) ? provider.countries.slice() : [],
      languages:Array.isArray(provider.languages) ? provider.languages.slice() : [],
      categories:Array.isArray(provider.categories) ? provider.categories.slice() : [],
      officialDomains:Array.isArray(provider.officialDomains) ? provider.officialDomains.slice() : [],
      capabilities:Array.isArray(provider.capabilities) ? provider.capabilities.slice() : [],
      adapterStatus:text(provider.onboardingStatus || provider.status || "sandbox"),
      redacted:true
    };
  }

  function listGlobalShoppingProviderOnboardingRecords() {
    return clone(providers().map(normalizeProvider));
  }

  function getGlobalShoppingProviderOnboarding(input) {
    const providerId = text((input && input.providerId) || input || "");
    const record = providers().map(normalizeProvider).find(function (item) {
      return item.providerId === providerId;
    }) || null;
    return clone({
      registryName:REGISTRY_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_ONBOARDING_REGISTRY_VERSION,
      record:record,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderOnboardingRegistry = {
    GLOBAL_SHOPPING_PROVIDER_ONBOARDING_REGISTRY_VERSION,
    REGISTRY_NAME,
    listGlobalShoppingProviderOnboardingRecords,
    getGlobalShoppingProviderOnboarding
  };
})();
