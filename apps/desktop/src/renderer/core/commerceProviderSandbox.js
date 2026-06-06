(function(){
  const CATEGORY_FALLBACK = "product";

  function normalizeCategory(category){
    const raw = String(category || "");
    if (raw === "ecommerce") return "product";
    if (raw === "ticketing") return "ticket";
    if (raw === "serviceBooking") return "service";
    if (raw === "aiModelPricing") return "service";
    if (/^(flight|product|hotel|ticket|service)$/.test(raw)) return raw;
    return CATEGORY_FALLBACK;
  }

  function sanitizeText(value, max){
    return String(value || "")
      .replace(/(bearer|authorization|api[-_ ]?key|token|password|secret|cookie|card\s*number|银行卡|身份证|护照|passport|id\s*number)\s*[:=：]\s*[^,\s;，。]+/gi, "$1=[redacted]")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max || 120);
  }

  function isHttpUrl(value){
    try {
      const url = new URL(String(value || ""));
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
      return false;
    }
  }

  function getProviderGlobalReadiness(provider){
    const item = provider || {};
    const supportedRegions = Array.isArray(item.supportedRegions) ? item.supportedRegions : [];
    const supportedCountries = Array.isArray(item.supportedCountries) ? item.supportedCountries : [];
    const supportedLanguages = Array.isArray(item.supportedLanguages) ? item.supportedLanguages : [];
    const supportedCurrencies = Array.isArray(item.supportedCurrencies) ? item.supportedCurrencies : [];
    const hasGlobalMetadata = supportedRegions.length > 0 &&
      supportedCountries.length > 0 &&
      supportedCurrencies.length > 0;
    return {
      globalReady:hasGlobalMetadata &&
        item.supportsReadOnlySearch === true &&
        item.supportsCrossBorderSearch === true &&
        item.requiresUserAccount !== true &&
        item.requiresIdentityDocument !== true &&
        item.requiresPaymentMethod !== true,
      supportedRegions,
      supportedCountries,
      supportedLanguages,
      supportedCurrencies,
      globalProviderType:item.globalProviderType || "unknown",
      complianceRegion:item.complianceRegion || "unknown",
      requiresUserAccount:item.requiresUserAccount === true,
      requiresIdentityDocument:item.requiresIdentityDocument === true,
      requiresPaymentMethod:item.requiresPaymentMethod === true,
      supportsReadOnlySearch:item.supportsReadOnlySearch === true,
      supportsCrossBorderSearch:item.supportsCrossBorderSearch === true
    };
  }

  function runProviderDryRun(provider, config, adapter, queryContext, connector){
    const p = provider || {};
    const cfg = config || {};
    const a = adapter || {};
    const q = queryContext || {};
    const c = connector || {};
    const next = normalizeCategory(p.category || cfg.category || q.category);
    const mode = a.mode || p.adapterMode || "read_only";
    const connectorType = c.connectorType || p.connectorType || cfg.connectorType || "readonly_search";
    const connectorEnabled = c.enabled === true || p.connectorEnabled === true || cfg.connectorEnabled === true;
    const connectorConfigured = c.configured === true || p.connectorConfigured === true || cfg.connectorConfigured === true;
    const connectorNetworkAllowed = c.networkAllowed === true || p.connectorNetworkAllowed === true || cfg.connectorNetworkAllowed === true;
    const apiKeyPresent = cfg.hasApiKey === true || q.apiKeyConfigured === true;
    const networkAllowed = cfg.allowNetworkSearch === true && q.allowNetworkSearch === true && connectorNetworkAllowed === true;
    const priceAllowed = cfg.allowReturnPrice === true && q.allowReturnPrice === true && c.supportsPrice === true;
    const bookingUrlAllowed = cfg.allowBookingUrl === true && q.allowBookingUrl === true && c.supportsBookingUrl === true;
    const checkoutUrlAllowed = cfg.allowCheckoutUrl === true && q.allowCheckoutUrl === true && c.supportsCheckoutUrl === true;
    const configured = cfg.enabled === true && cfg.configured === true && apiKeyPresent === true;
    const explicitTestProvider = !!(window.WeishanCommerceSearchProvider && typeof window.WeishanCommerceSearchProvider.search === "function" && q.providerMode === "manualProvider");
    const explicitModelTestProvider = !!(window.WeishanOpenRouterModelsProvider && q.providerMode === "openRouterModels");
    const global = getProviderGlobalReadiness(p);
    const checks = [
      { name:"provider enabled", pass:p.enabled === true || cfg.enabled === true },
      { name:"provider configured", pass:p.configured === true || cfg.configured === true },
      { name:"api key present", pass:apiKeyPresent === true },
      { name:"network search allowed", pass:networkAllowed === true },
      { name:"price return allowed", pass:priceAllowed === true },
      { name:"adapter read only", pass:mode === "read_only" },
      { name:"connector read only", pass:connectorType === "readonly_search" },
      { name:"connector enabled", pass:connectorEnabled === true },
      { name:"connector configured", pass:connectorConfigured === true },
      { name:"connector network allowed", pass:connectorNetworkAllowed === true },
      { name:"connector can search", pass:c.supportsSearch === true },
      { name:"connector can return price", pass:c.supportsPrice === true },
      { name:"cannot create order", pass:cfg.allowCreateOrder !== true && p.allowCreateOrder !== true },
      { name:"cannot pay", pass:cfg.allowPay !== true && p.allowPay !== true },
      { name:"cannot save identity", pass:cfg.allowSaveIdentity !== true && p.allowSaveIdentity !== true },
      { name:"connector cannot create order", pass:c.supportsCreateOrder !== true },
      { name:"connector cannot pay", pass:c.supportsPayment !== true },
      { name:"connector cannot save identity", pass:c.supportsIdentityStorage !== true },
      { name:"global metadata present", pass:global.globalReady === true },
      { name:"cross border search supported", pass:global.supportsCrossBorderSearch === true },
      { name:"does not require user account", pass:global.requiresUserAccount !== true },
      { name:"does not require identity document", pass:global.requiresIdentityDocument !== true },
      { name:"does not require payment method", pass:global.requiresPaymentMethod !== true }
    ];
    const canProceedToRealSearch = checks.every((item) => item.pass) &&
      (explicitTestProvider || explicitModelTestProvider);
    const blocked = checks.filter((item) => !item.pass).map((item) => item.name);
    return {
      providerId:sanitizeText(p.id || p.providerId || cfg.providerId || "", 80),
      category:next,
      dryRun:true,
      mode:"read_only",
      connectorStatus:c.connectorStatus || p.connectorStatus || cfg.connectorStatus || "not_configured",
      connectorEnabled,
      connectorConfigured,
      connectorNetworkAllowed,
      connectorType,
      connectorReasonWhenUnavailable:c.reasonWhenUnavailable || p.connectorReasonWhenUnavailable || cfg.connectorReasonWhenUnavailable || "Provider Connector 未启用",
      globalReady:global.globalReady === true,
      networkAllowed,
      priceAllowed,
      bookingUrlAllowed,
      checkoutUrlAllowed,
      createOrderAllowed:false,
      paymentAllowed:false,
      identityStorageAllowed:false,
      canProceedToRealSearch,
      reasonWhenBlocked:canProceedToRealSearch ? "" : "Provider sandbox dry-run 未通过：" + (blocked.join("、") || "真实搜索未启用"),
      checks,
      globalReadiness:global,
      sandboxMode:"dry_run",
      providerReadinessStatus:canProceedToRealSearch ? "ready_for_fixture_validation" : "blocked_before_network",
      apiKeyPresent,
      networkRequestAllowed:networkAllowed,
      configured,
      allowNetworkSearch:cfg.allowNetworkSearch === true,
      allowReturnPrice:cfg.allowReturnPrice === true,
      canCallProvider:canProceedToRealSearch,
      canShowPrice:false,
      canShowBookingButton:false,
      canShowCheckoutButton:false,
      canCreateOrder:false,
      canPay:false,
      canSaveIdentity:false,
      schemaValidationStatus:"not_run",
      reason:canProceedToRealSearch ? "fixture_provider_validation_only" : "provider_dry_run_blocked"
    };
  }

  function getCommerceProviderSandbox(category, settings, config, provider, adapter, connector){
    return runProviderDryRun(Object.assign({ category:normalizeCategory(category) }, provider || {}), config || {}, adapter || {}, Object.assign({}, settings || {}, { category:normalizeCategory(category) }), connector || {});
  }

  function canProviderProceedToRealSearch(providerHealth){
    const h = providerHealth || {};
    const sandbox = h.sandboxHealth || h.dryRunHealth || h;
    return sandbox.canProceedToRealSearch === true;
  }

  function validateProviderResultShape(result){
    const item = result || {};
    const totalPrice = Number(item.totalPrice);
    const candidateUrl = item.url || item.bookingUrl || "";
    const valid = item.isRealProviderResult === true &&
      item.totalPrice !== null &&
      item.totalPrice !== "" &&
      Number.isFinite(totalPrice) &&
      totalPrice >= 0 &&
      !!String(item.currency || "").trim() &&
      isHttpUrl(candidateUrl);
    return {
      valid,
      reason:valid ? "valid_provider_result" : "invalid_provider_result_shape",
      checks:{
        isRealProviderResult:item.isRealProviderResult === true,
        hasTotalPrice:item.totalPrice !== null && item.totalPrice !== "",
        totalPriceIsNumber:Number.isFinite(totalPrice) && totalPrice >= 0,
        hasCurrency:!!String(item.currency || "").trim(),
        hasSafeUrl:isHttpUrl(candidateUrl)
      },
      sanitizedTitle:sanitizeText(item.title || item.name || "", 120)
    };
  }

  function validateProviderResponse(results){
    const items = Array.isArray(results) ? results : [];
    const details = items.map(validateProviderResultShape);
    return {
      schemaValidationStatus:details.every((item) => item.valid) ? "pass" : "fail",
      candidateCount:items.length,
      validCandidateCount:details.filter((item) => item.valid).length,
      invalidCandidateCount:details.filter((item) => !item.valid).length,
      details
    };
  }

  function createSandboxHistoryPayload(action, payload){
    const p = payload || {};
    return {
      module:"commerceAgent",
      action:String(action || "commerceAgent.providerSandboxChecked"),
      taskId:sanitizeText(p.taskId || "", 80),
      category:normalizeCategory(p.category),
      providerReadinessStatus:sanitizeText(p.providerReadinessStatus || "", 80),
      schemaValidationStatus:sanitizeText(p.schemaValidationStatus || "", 80),
      apiKeyPresent:p.apiKeyPresent === true,
      networkRequestAllowed:p.networkRequestAllowed === true || p.networkAllowed === true,
      canProceedToRealSearch:p.canProceedToRealSearch === true,
      realExecution:false,
      createdAt:new Date().toISOString()
    };
  }

  window.WeishanCommerceProviderSandbox = {
    normalizeCategory,
    getCommerceProviderSandbox,
    runProviderDryRun,
    getProviderGlobalReadiness,
    canProviderProceedToRealSearch,
    validateProviderResultShape,
    validateProviderResponse,
    createSandboxHistoryPayload
  };
})();
