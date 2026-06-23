;(function () {
  "use strict";

  const CATALOG_VERSION = "2.1.73";
  const PHASE = "user_api_provider_catalog";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function defaultCapabilities() {
    return {
      canShowProviderCatalog: true,
      canShowProviderTypes: true,
      canShowReadOnlyCapability: true,
      canShowPermissionBoundary: true,
      canRecommendProviderCategory: true,
      canShowFutureBindingPath: true,
      canInputRealApiKey: false,
      canSaveRealApiKey: false,
      canReadRealApiKey: false,
      canTestConnection: false,
      canConnectEndpoint: false,
      canUseNetwork: false,
      canReturnPrice: false,
      canReturnBookingUrl: false,
      canCreateOrder: false,
      canPay: false,
      canUploadIdentity: false,
      canStoreIdentity: false,
      canStorePassport: false,
      canStoreBankCard: false
    };
  }

  function normalizeUserApiProviderCatalogContract(contract) {
    const raw = contract && typeof contract === "object" ? contract : {};
    return clone({
      catalogVersion: String(raw.catalogVersion || CATALOG_VERSION),
      phase: String(raw.phase || PHASE),
      catalogStatus: String(raw.catalogStatus || "catalog_only"),
      realApiConnectionMode: String(raw.realApiConnectionMode || "disabled"),
      apiKeyInputMode: String(raw.apiKeyInputMode || "disabled"),
      apiKeyStorageMode: String(raw.apiKeyStorageMode || "disabled"),
      endpointConnectionMode: String(raw.endpointConnectionMode || "disabled"),
      networkMode: String(raw.networkMode || "disabled"),
      priceMode: String(raw.priceMode || "disabled_without_binding"),
      bookingUrlMode: String(raw.bookingUrlMode || "disabled_without_binding"),
      orderMode: String(raw.orderMode || "disabled"),
      paymentMode: String(raw.paymentMode || "disabled"),
      identityUploadMode: String(raw.identityUploadMode || "disabled"),
      identityStorageMode: String(raw.identityStorageMode || "disabled"),
      bankCardStorageMode: String(raw.bankCardStorageMode || "disabled"),
      capabilities: Object.assign(defaultCapabilities(), raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {})
    });
  }

  function provider(providerId, providerName, category, regionScope, providerType, riskLevel, notes, nextReviewSteps) {
    return {
      providerId,
      providerName,
      category,
      regionScope,
      providerType,
      bindingStatus: "not_bound",
      readOnlyCapability: "potential",
      writeCapability: "disabled",
      orderCapability: "disabled",
      paymentCapability: "disabled",
      identityUploadCapability: "disabled",
      apiKeyInput: "disabled",
      apiKeyStorage: "disabled",
      endpointConnection: "disabled",
      networkConnection: "disabled",
      priceReturn: "disabled_without_binding",
      bookingUrlReturn: "disabled_without_binding",
      riskLevel,
      notes,
      nextReviewSteps
    };
  }

  function buildUserApiProviderCatalog() {
    return clone([
      provider("trip_com_flight_partner", "Trip.com API / Partner API", "flight", "global_cn", "travel_partner_api", "medium", "机票 / 航旅 API 目录项，仅表示未来可评估。", ["平台身份确认", "官方域名 / allowlist 审查", "只读价格字段审查"]),
      provider("skyscanner_partner", "Skyscanner API / Partner API", "flight", "global", "flight_meta_partner_api", "medium", "机票比价目录项，尚未绑定。", ["Partner 条款审查", "API 文档审查", "只读权限审查"]),
      provider("amadeus_gds", "Amadeus / GDS 类", "flight", "global", "gds_api", "high", "GDS 类能力复杂，需单独合规与条款审查。", ["GDS 条款审查", "费用字段审查", "人工批准"]),
      provider("expedia_partner_flight", "Expedia Partner Solutions", "flight", "global", "travel_partner_api", "medium", "航旅目录项，尚未接入。", ["Partner 条款审查", "只读字段审查"]),
      provider("airline_official_apis", "Airline official APIs", "flight", "regional_global", "official_airline_api", "medium", "航空公司官网 API 目录项。", ["官方身份确认", "接口范围审查"]),
      provider("booking_partner", "Booking / partner source", "hotel", "global", "hotel_partner_source", "medium", "酒店目录项，尚未绑定。", ["Partner 条款审查", "取消政策字段审查"]),
      provider("agoda_partner", "Agoda / partner source", "hotel", "global_apac", "hotel_partner_source", "medium", "酒店目录项，尚未绑定。", ["Partner 条款审查", "税费字段审查"]),
      provider("expedia_partner_hotel", "Expedia Partner Solutions", "hotel", "global", "hotel_partner_api", "medium", "酒店 Partner 目录项。", ["Partner 条款审查", "价格字段审查"]),
      provider("trip_com_hotel_partner", "Trip.com hotel partner", "hotel", "global_cn", "hotel_partner_api", "medium", "Trip.com 酒店目录项。", ["酒店条款审查", "库存字段审查"]),
      provider("hotel_official_apis", "Hotel official APIs", "hotel", "regional_global", "official_hotel_api", "medium", "酒店官方 API 目录项。", ["官方身份确认", "隐私政策审查"]),
      provider("amazon_product_advertising", "Amazon Product Advertising API", "commerce", "global", "product_advertising_api", "medium", "商品 / 电商目录项，尚未绑定。", ["联盟条款审查", "商品价格字段审查"]),
      provider("ebay_browse_api", "eBay Browse API", "commerce", "global", "marketplace_browse_api", "medium", "商品搜索目录项，尚未绑定。", ["Browse API 条款审查", "只读搜索字段审查"]),
      provider("walmart_api", "Walmart API", "commerce", "us", "marketplace_api", "medium", "电商目录项，尚未绑定。", ["区域合规审查", "库存字段审查"]),
      provider("jd_open_platform", "京东联盟 / 京东开放平台", "commerce", "cn", "marketplace_affiliate_api", "medium", "国内电商目录项，尚未绑定。", ["联盟条款审查", "佣金与价格字段审查"]),
      provider("taobao_tmall_open", "淘宝 / 天猫开放平台", "commerce", "cn", "marketplace_open_api", "medium", "国内电商目录项，尚未绑定。", ["开放平台条款审查", "商品字段审查"]),
      provider("pinduoduo_open", "拼多多开放平台", "commerce", "cn", "marketplace_open_api", "medium", "国内电商目录项，尚未绑定。", ["开放平台条款审查", "价格字段审查"]),
      provider("google_shopping_merchant_source", "Google Shopping / Merchant source", "commerce", "global", "shopping_merchant_source", "medium", "商品目录项，尚未绑定。", ["Merchant source 审查", "价格字段审查"]),
      provider("google_business_places_like", "Google Business / Places-like source", "local_service", "global", "places_like_source", "medium", "本地服务目录项，尚未绑定。", ["本地法律合规审查", "商户信息字段审查"]),
      provider("event_ticket_provider_apis", "Event / ticket provider APIs", "local_service", "regional_global", "ticket_provider_api", "high", "门票目录项，风险较高，需单独审查。", ["票务条款审查", "转售风险审查"]),
      provider("regional_local_service_providers", "Regional local service providers", "local_service", "regional", "local_service_provider_api", "medium", "区域本地服务目录项，尚未绑定。", ["区域合规审查", "服务条款审查"])
    ]);
  }

  function summarizeUserApiProviderCatalog(catalog) {
    const list = Array.isArray(catalog) ? catalog : buildUserApiProviderCatalog();
    const countByCategory = (category) => list.filter((item) => item.category === category).length;
    return clone({
      totalProviders: list.length,
      flightProviders: countByCategory("flight"),
      hotelProviders: countByCategory("hotel"),
      commerceProviders: countByCategory("commerce"),
      localServiceProviders: countByCategory("local_service"),
      boundProviders: 0,
      providersWithReadOnlyPotential: list.filter((item) => item.readOnlyCapability === "potential").length,
      providersWithWriteEnabled: 0,
      providersWithOrderEnabled: 0,
      providersWithPaymentEnabled: 0,
      providersWithIdentityUploadEnabled: 0,
      overallStatus: "catalog_only_no_binding",
      reason: "provider_catalog_available_but_no_real_api_binding"
    });
  }

  function resolveProviderCatalogForIntent(intent) {
    const text = String(intent || "").toLowerCase();
    const catalog = buildUserApiProviderCatalog();
    let category = "commerce";
    if (/机票|航班|flight|airline/.test(text)) category = "flight";
    else if (/酒店|hotel|住宿|booking|agoda/.test(text)) category = "hotel";
    else if (/门票|演唱会|ticket|本地|local|服务|places/.test(text)) category = "local_service";
    else if (/商品|电脑|手机|电商|amazon|ebay|京东|淘宝|天猫|拼多多|walmart/.test(text)) category = "commerce";
    return clone({
      intent: String(intent || ""),
      recommendedCategory: category,
      providers: catalog.filter((item) => item.category === category),
      connectionMode: "catalog_only",
      noRealApiBinding: true,
      noNetwork: true
    });
  }

  function assertUserApiProviderCatalogSafe(catalog, summary) {
    const list = Array.isArray(catalog) ? catalog : buildUserApiProviderCatalog();
    const safeSummary = summary && typeof summary === "object" ? summary : summarizeUserApiProviderCatalog(list);
    const violations = [];
    list.forEach((item) => {
      if (item.bindingStatus !== "not_bound") violations.push(item.providerId + ":binding");
      if (item.apiKeyInput !== "disabled") violations.push(item.providerId + ":key_input");
      if (item.apiKeyStorage !== "disabled") violations.push(item.providerId + ":key_storage");
      if (item.endpointConnection !== "disabled") violations.push(item.providerId + ":endpoint");
      if (item.networkConnection !== "disabled") violations.push(item.providerId + ":network");
      if (item.writeCapability !== "disabled") violations.push(item.providerId + ":write");
      if (item.orderCapability !== "disabled") violations.push(item.providerId + ":order");
      if (item.paymentCapability !== "disabled") violations.push(item.providerId + ":payment");
      if (item.identityUploadCapability !== "disabled") violations.push(item.providerId + ":identity");
    });
    if (safeSummary.boundProviders !== 0) violations.push("summary:boundProviders");
    if (safeSummary.providersWithPaymentEnabled !== 0) violations.push("summary:payment");
    if (safeSummary.providersWithOrderEnabled !== 0) violations.push("summary:order");
    if (violations.length) throw new Error("user_api_provider_catalog_violation:" + violations.join(","));
    return true;
  }

  function groupUserApiProviderCatalog(catalog) {
    const list = Array.isArray(catalog) ? catalog : buildUserApiProviderCatalog();
    return clone({
      flight: list.filter((item) => item.category === "flight"),
      hotel: list.filter((item) => item.category === "hotel"),
      commerce: list.filter((item) => item.category === "commerce"),
      localService: list.filter((item) => item.category === "local_service")
    });
  }

  function buildUserApiProviderCatalogDisplay(catalog) {
    const list = Array.isArray(catalog) ? catalog : buildUserApiProviderCatalog();
    const summary = summarizeUserApiProviderCatalog(list);
    return clone({
      title: "可绑定 API 平台目录",
      currentStatusLine: "平台目录已建立，但尚未绑定任何真实 API。",
      providerTypeLine: "可选平台类型：机票 / 酒店 / 商品 / 本地服务",
      boundLine: "已绑定 API：0",
      priceLine: "可返回真实价格：0",
      orderLine: "可下单：0",
      paymentLine: "可付款：0",
      explanationLine: "绑定 API 后，weishan 可优先使用用户授权平台的只读价格结果。",
      safetyLine: "当前版本只展示平台目录和权限说明，不保存真实 API key，不测试连接。",
      groupLabels: {
        flight: "机票 / 航旅",
        hotel: "酒店",
        commerce: "商品 / 电商",
        localService: "本地服务 / 门票"
      },
      capabilityLines: [
        "只读潜力：可评估",
        "写入能力：禁用",
        "下单能力：禁用",
        "支付能力：禁用",
        "身份资料上传：禁用",
        "API key 输入：禁用",
        "endpoint 连接：禁用"
      ],
      summary,
      groups: groupUserApiProviderCatalog(list)
    });
  }

  window.WeishanCommerceUserApiProviderCatalog = {
    CATALOG_VERSION,
    PHASE,
    commerceUserApiProviderCatalogContract: normalizeUserApiProviderCatalogContract(),
    normalizeUserApiProviderCatalogContract,
    buildUserApiProviderCatalog,
    summarizeUserApiProviderCatalog,
    resolveProviderCatalogForIntent,
    assertUserApiProviderCatalogSafe,
    groupUserApiProviderCatalog,
    buildUserApiProviderCatalogDisplay
  };
})();
