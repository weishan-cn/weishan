;(function () {
  "use strict";

  const POLICY_VERSION = "4.1.5";
  const PHASE = "user_api_priority_search_policy";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function defaultCapabilities() {
    return {
      canDetectUserApiBinding: true,
      canPreferUserApiWhenBound: true,
      canFallbackToCandidateProviders: true,
      canShowSearchMode: true,
      canShowSourceLabel: true,
      canShowTrustedPriceOnly: true,
      canUseReadOnlyUserApi: false,
      canUseWriteApi: false,
      canCreateOrder: false,
      canPay: false,
      canUploadIdentity: false,
      canStoreIdentity: false,
      canStoreBankCard: false
    };
  }

  function normalizeCommerceUserApiPriorityPolicyContract(policy) {
    const raw = policy && typeof policy === "object" ? policy : {};
    return clone({
      policyVersion: String(raw.policyVersion || POLICY_VERSION),
      phase: String(raw.phase || PHASE),
      policyStatus: String(raw.policyStatus || "policy_only"),
      defaultSearchMode: String(raw.defaultSearchMode || "external_candidate_fallback"),
      userApiMode: String(raw.userApiMode || "not_bound"),
      candidateProviderMode: String(raw.candidateProviderMode || "available"),
      realPriceMode: String(raw.realPriceMode || "unavailable_without_bound_api"),
      paymentMode: String(raw.paymentMode || "disabled"),
      orderMode: String(raw.orderMode || "disabled"),
      identityStorageMode: String(raw.identityStorageMode || "disabled"),
      capabilities: Object.assign(defaultCapabilities(), raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {})
    });
  }

  function getUserApiBindingState(binding) {
    const raw = binding && typeof binding === "object" ? binding : {};
    if (raw.status === "bound_readonly_fixture" && (raw.__fixture === true || raw.apiType === "readonly_fixture")) {
      return clone({
        status: "bound_readonly_fixture",
        hasUserApi: true,
        providerName: String(raw.providerName || "Trip.com API fixture"),
        apiType: "readonly_fixture",
        canReadPrice: raw.canReadPrice !== false,
        canWrite: false,
        canCreateOrder: false,
        canPay: false,
        canUploadIdentity: false,
        canStoreIdentity: false
      });
    }
    return clone({
      status: "not_bound",
      hasUserApi: false,
      providerName: null,
      apiType: null,
      canReadPrice: false,
      canWrite: false,
      canCreateOrder: false,
      canPay: false,
      canUploadIdentity: false,
      canStoreIdentity: false
    });
  }

  function resolveCommerceSearchMode(options) {
    const raw = options && typeof options === "object" ? options : {};
    const userApiBindingState = getUserApiBindingState(raw.userApiBindingState);
    const hasCandidates = raw.candidateProviders !== "unavailable";
    if (userApiBindingState.status === "bound_readonly_fixture" && userApiBindingState.canReadPrice === true) {
      return clone({
        mode: "user_api_readonly_first",
        userApi: "bound",
        providerName: userApiBindingState.providerName || "Trip.com API fixture",
        candidateProviders: hasCandidates ? "available" : "unavailable",
        realPriceResults: "fixture_only",
        resultSource: "user_bound_api",
        canShowPrice: true,
        canShowBookingUrl: true,
        canPay: false,
        canCreateOrder: false,
        canStoreIdentity: false,
        canUploadIdentity: false,
        canUseWriteApi: false
      });
    }
    return clone({
      mode: "candidate_provider_fallback",
      userApi: "not_bound",
      candidateProviders: hasCandidates ? "available" : "unavailable",
      realPriceResults: "unavailable",
      resultSource: "weishan_candidate_platforms_or_external_search",
      canShowPrice: false,
      canShowBookingUrl: false,
      canPay: false,
      canCreateOrder: false,
      canStoreIdentity: false,
      canUploadIdentity: false,
      canUseWriteApi: false
    });
  }

  function buildSearchModeDisplay(searchMode) {
    const safe = searchMode && typeof searchMode === "object" ? searchMode : resolveCommerceSearchMode();
    if (safe.mode === "user_api_readonly_first") {
      return clone({
        title: "当前搜索模式",
        userApiLine: "用户 API：已启用",
        candidateProviderLine: "weishan 候选平台：可用",
        realPriceLine: "真实价格结果：fixture 结构可用",
        providerLine: "来源平台：" + String(safe.providerName || "Trip.com API fixture"),
        futureLine: "点击价格：跳转平台确认和付款",
        sourceLine: "结果来源：用户绑定 API"
      });
    }
    return clone({
      title: "当前搜索模式",
      userApiLine: "用户 API：未绑定",
      candidateProviderLine: "weishan 候选平台：可用",
      realPriceLine: "真实价格结果：暂无",
      futureLine: "绑定 API 后，将优先使用用户授权平台的只读价格结果",
      sourceLine: "未绑定 API 时，可使用 weishan 候选平台和外部搜索入口。"
    });
  }

  function buildPriceSourceLabel(result) {
    const raw = result && typeof result === "object" ? result : {};
    return clone({
      source: String(raw.resultSource || "外部搜索入口"),
      providerName: String(raw.providerName || "未接入真实价格源"),
      sourceType: String(raw.sourceType || "external_search_fallback"),
      lastUpdatedAt: raw.lastUpdatedAt || null,
      includesTax: raw.includesTax === true,
      includesFees: raw.includesFees === true,
      includesShipping: raw.includesShipping === true,
      baggageInfo: raw.baggageInfo || "",
      finalPriceNotice: raw.finalPriceNotice || "最终价格以跳转页面为准"
    });
  }

  window.WeishanCommerceUserApiPriorityPolicy = {
    POLICY_VERSION,
    PHASE,
    commerceUserApiPriorityPolicyContract: normalizeCommerceUserApiPriorityPolicyContract(),
    normalizeCommerceUserApiPriorityPolicyContract,
    getUserApiBindingState,
    resolveCommerceSearchMode,
    buildSearchModeDisplay,
    buildPriceSourceLabel
  };
})();
