;(function () {
  "use strict";

  const CONTRACT_VERSION = "2.1.90";
  const PHASE = "flight_provider_candidate_registry";
  const DEFAULT_TRUST_STATUS = "candidate_only";
  const DEFAULT_MANUAL_REVIEW_STATUS = "not_reviewed";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function defaultCapabilities() {
    return {
      canUseApiKey: false,
      canUseNetworkApi: false,
      canReturnPrice: false,
      canReturnBookingUrl: false,
      canOpenBookingUrl: false,
      canCreateOrder: false,
      canPay: false,
      canStoreIdentity: false,
      canStorePassport: false,
      canStoreBankCard: false
    };
  }

  function defaultSafety() {
    return {
      noRealEndpoint: true,
      noRealApiKey: true,
      noNetworkSearch: true,
      noRealResults: true,
      noRealPrice: true,
      noFakeDemoMockPrice: true,
      noBookingUrl: true,
      noRedirect: true,
      noCheckout: true,
      noPayment: true,
      noOrderSubmit: true,
      noIdentityStorage: true,
      noPassportStorage: true,
      noBankCardStorage: true
    };
  }

  function defaultDomainSafetyRules() {
    return {
      allowedDomains: [
        "google.com",
        "google.com/travel/flights",
        "trip.com",
        "ctrip.com",
        "skyscanner.com",
        "kayak.com",
        "expedia.com",
        "booking.com"
      ],
      blockedRules: [
        "短链接",
        "非 HTTPS",
        "拼写相似的仿冒域名",
        "AI 生成域名",
        "私聊付款",
        "先转账出票",
        "低价异常",
        "无主体信息",
        "和搜索意图无关",
        "成人 / 赌博 / 武器 / 毒品等高风险域名"
      ]
    };
  }

  function defaultCandidateProfiles() {
    return [
      {
        providerId: "google_flights",
        providerName: "Google Flights",
        providerType: "flight_search_candidate",
        regionScope: ["global"],
        supportedLanguages: ["zh-CN", "en"],
        supportedCurrencies: ["CNY", "USD", "HKD", "SGD"],
        officialDomains: ["google.com", "google.com/travel/flights"],
        searchEntryUrl: "https://www.google.com/travel/flights",
        apiStatus: "not_connected",
        priceStatus: "not_available",
        bookingUrlStatus: "not_available",
        sandboxDryRunStatus: "shell_ready",
        trustStatus: DEFAULT_TRUST_STATUS,
        manualReviewStatus: DEFAULT_MANUAL_REVIEW_STATUS,
        riskLevel: "low",
        notes: "候选平台只作档案，不连接 API，不返回价格，不生成 booking 链接。",
        capabilities: defaultCapabilities(),
        safety: defaultSafety()
      },
      {
        providerId: "trip_com_ctrip",
        providerName: "Trip.com / 携程",
        providerType: "flight_search_candidate",
        regionScope: ["global", "China outbound"],
        supportedLanguages: ["zh-CN", "en"],
        supportedCurrencies: ["CNY", "USD", "HKD", "SGD"],
        officialDomains: ["trip.com", "ctrip.com"],
        searchEntryUrl: "https://www.trip.com/flights/search/",
        apiStatus: "not_connected",
        priceStatus: "not_available",
        bookingUrlStatus: "not_available",
        sandboxDryRunStatus: "shell_ready",
        trustStatus: DEFAULT_TRUST_STATUS,
        manualReviewStatus: DEFAULT_MANUAL_REVIEW_STATUS,
        riskLevel: "low",
        notes: "候选平台只作档案，不连接 API，不返回价格，不生成 booking 链接。",
        capabilities: defaultCapabilities(),
        safety: defaultSafety()
      },
      {
        providerId: "skyscanner",
        providerName: "Skyscanner",
        providerType: "flight_search_candidate",
        regionScope: ["global"],
        supportedLanguages: ["zh-CN", "en"],
        supportedCurrencies: ["CNY", "USD", "GBP", "EUR"],
        officialDomains: ["skyscanner.com"],
        searchEntryUrl: "https://www.skyscanner.com/flights",
        apiStatus: "not_connected",
        priceStatus: "not_available",
        bookingUrlStatus: "not_available",
        sandboxDryRunStatus: "shell_ready",
        trustStatus: DEFAULT_TRUST_STATUS,
        manualReviewStatus: DEFAULT_MANUAL_REVIEW_STATUS,
        riskLevel: "low",
        notes: "候选平台只作档案，不连接 API，不返回价格，不生成 booking 链接。",
        capabilities: defaultCapabilities(),
        safety: defaultSafety()
      },
      {
        providerId: "kayak",
        providerName: "Kayak",
        providerType: "flight_search_candidate",
        regionScope: ["global"],
        supportedLanguages: ["en"],
        supportedCurrencies: ["USD", "CNY", "EUR", "GBP"],
        officialDomains: ["kayak.com"],
        searchEntryUrl: "https://www.kayak.com/flights",
        apiStatus: "not_connected",
        priceStatus: "not_available",
        bookingUrlStatus: "not_available",
        sandboxDryRunStatus: "shell_ready",
        trustStatus: DEFAULT_TRUST_STATUS,
        manualReviewStatus: DEFAULT_MANUAL_REVIEW_STATUS,
        riskLevel: "low",
        notes: "候选平台只作档案，不连接 API，不返回价格，不生成 booking 链接。",
        capabilities: defaultCapabilities(),
        safety: defaultSafety()
      },
      {
        providerId: "expedia",
        providerName: "Expedia",
        providerType: "flight_search_candidate",
        regionScope: ["global"],
        supportedLanguages: ["en"],
        supportedCurrencies: ["USD", "CNY", "EUR", "GBP"],
        officialDomains: ["expedia.com"],
        searchEntryUrl: "https://www.expedia.com/Flights",
        apiStatus: "not_connected",
        priceStatus: "not_available",
        bookingUrlStatus: "not_available",
        sandboxDryRunStatus: "shell_ready",
        trustStatus: DEFAULT_TRUST_STATUS,
        manualReviewStatus: DEFAULT_MANUAL_REVIEW_STATUS,
        riskLevel: "low",
        notes: "候选平台只作档案，不连接 API，不返回价格，不生成 booking 链接。",
        capabilities: defaultCapabilities(),
        safety: defaultSafety()
      },
      {
        providerId: "booking_flights",
        providerName: "Booking Flights",
        providerType: "flight_search_candidate",
        regionScope: ["global"],
        supportedLanguages: ["en"],
        supportedCurrencies: ["USD", "CNY", "EUR", "GBP"],
        officialDomains: ["booking.com"],
        searchEntryUrl: "https://www.booking.com/flights",
        apiStatus: "not_connected",
        priceStatus: "not_available",
        bookingUrlStatus: "not_available",
        trustStatus: DEFAULT_TRUST_STATUS,
        manualReviewStatus: DEFAULT_MANUAL_REVIEW_STATUS,
        riskLevel: "low",
        notes: "候选平台只作档案，不连接 API，不返回价格，不生成 booking 链接。",
        capabilities: defaultCapabilities(),
        safety: defaultSafety()
      },
      {
        providerId: "airline_official_website",
        providerName: "航司官网占位",
        providerType: "flight_search_candidate",
        regionScope: ["carrier-specific"],
        supportedLanguages: ["varies by carrier"],
        supportedCurrencies: ["varies by carrier"],
        officialDomains: ["airline-official-website.placeholder"],
        searchEntryUrl: "https://www.google.com/search?q=airline+official+website+flight+search",
        apiStatus: "not_connected",
        priceStatus: "not_available",
        bookingUrlStatus: "not_available",
        sandboxDryRunStatus: "shell_ready",
        trustStatus: DEFAULT_TRUST_STATUS,
        manualReviewStatus: DEFAULT_MANUAL_REVIEW_STATUS,
        riskLevel: "medium",
        notes: "候选平台只作档案，不连接 API，不返回价格，不生成 booking 链接。",
        capabilities: defaultCapabilities(),
        safety: defaultSafety()
      }
    ];
  }

  function normalizeCandidate(candidate) {
    const raw = candidate && typeof candidate === "object" ? candidate : {};
    return clone({
      providerId: String(raw.providerId || ""),
      providerName: String(raw.providerName || ""),
      providerType: String(raw.providerType || "flight_search_candidate"),
      regionScope: Array.isArray(raw.regionScope) ? raw.regionScope.slice() : [],
      supportedLanguages: Array.isArray(raw.supportedLanguages) ? raw.supportedLanguages.slice() : [],
      supportedCurrencies: Array.isArray(raw.supportedCurrencies) ? raw.supportedCurrencies.slice() : [],
      officialDomains: Array.isArray(raw.officialDomains) ? raw.officialDomains.slice() : [],
      searchEntryUrl: String(raw.searchEntryUrl || ""),
      apiStatus: String(raw.apiStatus || "not_connected"),
      priceStatus: String(raw.priceStatus || "not_available"),
      bookingUrlStatus: String(raw.bookingUrlStatus || "not_available"),
      sandboxDryRunStatus: String(raw.sandboxDryRunStatus || "shell_ready"),
      trustStatus: String(raw.trustStatus || DEFAULT_TRUST_STATUS),
      manualReviewStatus: String(raw.manualReviewStatus || DEFAULT_MANUAL_REVIEW_STATUS),
      riskLevel: String(raw.riskLevel || "low"),
      notes: String(raw.notes || ""),
      capabilities: Object.assign(defaultCapabilities(), raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      safety: Object.assign(defaultSafety(), raw.safety && typeof raw.safety === "object" ? raw.safety : {})
    });
  }

  function normalizeFlightProviderCandidatesRegistry(registry) {
    const raw = registry && typeof registry === "object" ? registry : {};
    const candidateProfiles = Array.isArray(raw.candidateProfiles) && raw.candidateProfiles.length ? raw.candidateProfiles.map(normalizeCandidate) : defaultCandidateProfiles().map(normalizeCandidate);
    return clone({
      contractVersion: String(raw.contractVersion || CONTRACT_VERSION),
      phase: String(raw.phase || PHASE),
      registryStatus: String(raw.registryStatus || "candidate_registry_only"),
      candidateCount: Number.isFinite(Number(raw.candidateCount)) ? Number(raw.candidateCount) : candidateProfiles.length,
      trustStatus: String(raw.trustStatus || DEFAULT_TRUST_STATUS),
      manualReviewStatus: String(raw.manualReviewStatus || DEFAULT_MANUAL_REVIEW_STATUS),
      domainSafetyRules: Object.assign(defaultDomainSafetyRules(), raw.domainSafetyRules && typeof raw.domainSafetyRules === "object" ? raw.domainSafetyRules : {}),
      candidateProfiles,
      capabilities: Object.assign(defaultCapabilities(), raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      safety: Object.assign(defaultSafety(), raw.safety && typeof raw.safety === "object" ? raw.safety : {}),
      display: Object.assign({
        summaryTitle: "候选平台档案与白名单规则",
        currentStatusLine: "当前状态：候选平台档案已整理，暂不接入真实价格源。",
        introLine: "这些只是候选平台档案，不代表已接入。当前不读取 API key，不连接 endpoint，不返回价格，不生成 booking 链接。",
        trustedRoutesLine: "默认优先保留官方平台、知名旅行平台和已人工审核白名单。",
        candidateCountLabel: "候选平台",
        allowlistTitle: "默认优先域名白名单",
        blockedRulesTitle: "默认阻断规则",
        capabilityLine: "API key 不可用 / 网络搜索不可用 / 价格不可用 / booking 链接不可用 / 下单不可用 / 付款不可用 / 身份证 / 护照 / 银行卡不可保存",
        sandboxDryRunStatusLine: "Sandbox Dry Run：外壳可用，真实连接未启用",
        readonlyStubAdapterStatusLine: "可用",
        approvalStatusLine: "审批状态：未审查",
        readonlyStubPermissionLine: "只读适配器开发许可：未授予",
        readOnlyPriceSourceLine: "只读价格源：未启用",
        bookingUrlStatusLine: "bookingUrl：未启用",
        tradeStatusLine: "付款 / 下单：不支持"
      }, raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function describeFlightProviderCandidatesRegistry(registry) {
    const safe = normalizeFlightProviderCandidatesRegistry(registry);
    return {
      summaryTitle: safe.display.summaryTitle || "候选平台档案与白名单规则",
      currentStatusLine: safe.display.currentStatusLine || "当前状态：候选平台档案已整理，暂不接入真实价格源。",
      introLine: safe.display.introLine || "这些只是候选平台档案，不代表已接入。当前不读取 API key，不连接 endpoint，不返回价格，不生成 booking 链接。",
      trustedRoutesLine: safe.display.trustedRoutesLine || "默认优先保留官方平台、知名旅行平台和已人工审核白名单。",
      candidateCountLabel: `${safe.candidateProfiles.length} 个候选平台`,
      allowlistTitle: safe.display.allowlistTitle || "默认优先域名白名单",
      blockedRulesTitle: safe.display.blockedRulesTitle || "默认阻断规则",
      approvalStatusLine: safe.display.approvalStatusLine || "审批状态：未审查",
      readonlyStubPermissionLine: safe.display.readonlyStubPermissionLine || "只读适配器开发许可：未授予",
      readonlyStubAdapterStatusLine: safe.display.readonlyStubAdapterStatusLine || "可用",
      readOnlyPriceSourceLine: safe.display.readOnlyPriceSourceLine || "只读价格源：未启用",
      bookingUrlStatusLine: safe.display.bookingUrlStatusLine || "bookingUrl：未启用",
      tradeStatusLine: safe.display.tradeStatusLine || "付款 / 下单：不支持",
      sandboxDryRunStatusLine: safe.display.sandboxDryRunStatusLine || "Sandbox Dry Run：外壳可用，真实连接未启用",
      allowlistDomains: Array.isArray(safe.domainSafetyRules.allowedDomains) ? safe.domainSafetyRules.allowedDomains.slice() : [],
      blockedRules: Array.isArray(safe.domainSafetyRules.blockedRules) ? safe.domainSafetyRules.blockedRules.slice() : [],
      candidateProfiles: safe.candidateProfiles.map((profile) => ({
        providerId: profile.providerId,
        providerName: profile.providerName,
        providerTypeLabel: profile.providerType || "flight_search_candidate",
        regionScopeLabel: Array.isArray(profile.regionScope) ? profile.regionScope.join(" / ") : String(profile.regionScope || ""),
        supportedLanguagesLabel: Array.isArray(profile.supportedLanguages) ? profile.supportedLanguages.join(" / ") : String(profile.supportedLanguages || ""),
        supportedCurrenciesLabel: Array.isArray(profile.supportedCurrencies) ? profile.supportedCurrencies.join(" / ") : String(profile.supportedCurrencies || ""),
        officialDomainsLabel: Array.isArray(profile.officialDomains) ? profile.officialDomains.join(" / ") : String(profile.officialDomains || ""),
        searchEntryUrlLabel: String(profile.searchEntryUrl || ""),
        apiStatusLabel: profile.apiStatus === "not_connected" ? "未连接" : profile.apiStatus,
        priceStatusLabel: profile.priceStatus === "not_available" ? "不可用" : profile.priceStatus,
        bookingUrlStatusLabel: profile.bookingUrlStatus === "not_available" ? "不可用" : profile.bookingUrlStatus,
        sandboxDryRunStatusLabel: profile.sandboxDryRunStatus === "shell_ready" ? "外壳可用，真实连接未启用" : profile.sandboxDryRunStatus,
        trustStatusLabel: profile.trustStatus === DEFAULT_TRUST_STATUS ? "仅候选" : profile.trustStatus,
        manualReviewStatusLabel: profile.manualReviewStatus === DEFAULT_MANUAL_REVIEW_STATUS ? "未审查" : profile.manualReviewStatus,
        approvalStatusLabel: safe.display.approvalStatusLine || "审批状态：未审查",
        readonlyStubPermissionStatusLabel: safe.display.readonlyStubPermissionLine || "只读适配器开发许可：未授予",
        readonlyStubAdapterStatusLabel: safe.display.readonlyStubAdapterStatusLine || "可用",
        readOnlyPriceSourceStatusLabel: safe.display.readOnlyPriceSourceLine || "只读价格源：未启用",
        tradeStatusLabel: safe.display.tradeStatusLine || "付款 / 下单：不支持",
        riskLevelLabel: profile.riskLevel === "low" ? "低风险" : profile.riskLevel,
        capabilityLine: safe.display.capabilityLine || "API key 不可用 / 网络搜索不可用 / 价格不可用 / booking 链接不可用 / 下单不可用 / 付款不可用 / 身份证 / 护照 / 银行卡不可保存",
        notes: profile.notes || ""
      }))
    };
  }

  function isAllowedFlightProviderCandidateDomain(domain) {
    const registry = normalizeFlightProviderCandidatesRegistry();
    const value = String(domain || "").toLowerCase().trim();
    if (!value) return false;
    return Array.isArray(registry.domainSafetyRules.allowedDomains) && registry.domainSafetyRules.allowedDomains.some((item) => {
      const normalized = String(item || "").toLowerCase().trim();
      return normalized && (value === normalized || value.endsWith("." + normalized) || value.includes(normalized));
    });
  }

  window.WeishanCommerceFlightProviderCandidates = {
    CONTRACT_VERSION,
    PHASE,
    DEFAULT_TRUST_STATUS,
    DEFAULT_MANUAL_REVIEW_STATUS,
    defaultCapabilities,
    defaultSafety,
    defaultDomainSafetyRules,
    defaultCandidateProfiles,
    getFlightProviderCandidatesRegistry: normalizeFlightProviderCandidatesRegistry,
    normalizeFlightProviderCandidatesRegistry,
    describeFlightProviderCandidatesRegistry,
    isAllowedFlightProviderCandidateDomain
  };
})();
