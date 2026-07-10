;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PLATFORM_CANDIDATE_FACTORY_VERSION = "4.2.8";
  const FACTORY_NAME = "global_shopping_platform_candidate_factory_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function encode(value) { return encodeURIComponent(String(value == null ? "" : value).trim()); }
  function modelApi() { return window.WeishanGlobalShoppingReadOnlySearchResultModel || {}; }
  function contextApi() { return window.WeishanGlobalShoppingContextEngine || {}; }
  function regionApi() { return window.WeishanGlobalShoppingRegionIntelligenceEngine || {}; }
  function marketApi() { return window.WeishanGlobalShoppingMarketProfileRegistry || {}; }
  function onboardingApi() { return window.WeishanGlobalShoppingProviderOnboardingRegistry || {}; }
  function officialDomainApi() { return window.WeishanGlobalShoppingOfficialDomainVerifier || {}; }
  function regionalSelectorApi() { return window.WeishanGlobalShoppingRegionalProviderSelector || {}; }
  function dataSourceApi() { return window.WeishanGlobalShoppingDataSourceModel || {}; }
  function dataFreshnessApi() { return window.WeishanGlobalShoppingDataFreshnessEngine || {}; }
  function dataQualityApi() { return window.WeishanGlobalShoppingDataQualityEngine || {}; }
  function provenanceApi() { return window.WeishanGlobalShoppingDataProvenance || {}; }
  function intelligenceRegistryApi() { return window.WeishanGlobalShoppingProviderIntelligenceRegistry || {}; }
  function coverageApi() { return window.WeishanGlobalShoppingProviderCoverageEngine || {}; }
  function categoryIntelligenceApi() { return window.WeishanGlobalShoppingCategoryIntelligenceModel || {}; }
  function competitionApi() { return window.WeishanGlobalShoppingProviderCompetitionEngine || {}; }
  function healthApi() { return window.WeishanGlobalShoppingProviderHealthEngine || {}; }
  function policyApi() { return window.WeishanGlobalShoppingProviderPolicyEngine || {}; }
  function marketCategoryMatrixApi() { return window.WeishanGlobalShoppingMarketCategoryMatrix || {}; }
  function capabilityApi() { return window.WeishanGlobalShoppingProviderCapabilityModel || {}; }
  function adapterResolverApi() { return window.WeishanGlobalShoppingAdapterCapabilityResolver || {}; }
  function routerApi() { return window.WeishanGlobalShoppingProviderRouter || {}; }
  function rankingApi() { return window.WeishanGlobalShoppingProviderRankingEngine || {}; }
  function realPriceApi() { return window.WeishanGlobalShoppingRealPriceResultModel || {}; }
  function taxRuleApi() { return window.WeishanGlobalShoppingTaxRuleRegistry || {}; }
  function landedCostApi() { return window.WeishanGlobalShoppingLandedCostEngine || {}; }
  function trustApi() { return window.WeishanGlobalShoppingProviderTrustRegistry || {}; }
  function recommendationApi() { return window.WeishanGlobalShoppingRecommendationReasonEngine || {}; }
  function contractApi() { return window.WeishanGlobalShoppingProviderAdapterContract || {}; }
  function sandboxApi() { return window.WeishanGlobalShoppingSandboxProviderAdapter || {}; }
  function normalizerApi() { return window.WeishanGlobalShoppingProviderResponseNormalizer || {}; }
  function priceFreshnessApi() { return window.WeishanGlobalShoppingPriceFreshnessModel || {}; }
  function availabilityFreshnessApi() { return window.WeishanGlobalShoppingAvailabilityFreshnessModel || {}; }
  function fallbackApi() { return window.WeishanGlobalShoppingProviderFallbackEngine || {}; }
  function buildModel(input) {
    return typeof modelApi().buildGlobalShoppingReadOnlySearchResultModel === "function"
      ? modelApi().buildGlobalShoppingReadOnlySearchResultModel(input)
      : input;
  }
  function buildContext(input) {
    return typeof contextApi().buildGlobalShoppingContext === "function"
      ? contextApi().buildGlobalShoppingContext(input)
      : {
        userRegion:"US",
        destinationCountry:"US",
        language:"en-US",
        currency:"USD",
        preferredMarket:"US",
        confidence:0.68,
        source:{ userRegion:"fallback", destinationCountry:"fallback", language:"fallback", currency:"fallback", preferredMarket:"fallback" }
      };
  }
  function buildRegionContext(input) {
    return typeof regionApi().buildGlobalShoppingRegionContext === "function"
      ? regionApi().buildGlobalShoppingRegionContext(input)
      : null;
  }
  function buildMarketProfile(input) {
    return typeof marketApi().getGlobalShoppingMarketProfile === "function"
      ? marketApi().getGlobalShoppingMarketProfile(input)
      : { marketProfile:null };
  }
  function buildOnboardingRecord(providerId) {
    return typeof onboardingApi().getGlobalShoppingProviderOnboarding === "function"
      ? onboardingApi().getGlobalShoppingProviderOnboarding({ providerId:providerId })
      : { record:null };
  }
  function buildOfficialDomainStatus(input) {
    return typeof officialDomainApi().buildGlobalShoppingOfficialDomainVerification === "function"
      ? officialDomainApi().buildGlobalShoppingOfficialDomainVerification(input)
      : { verified:false, trustLevel:"unknown", reason:"verifier_unavailable" };
  }
  function buildRegionalCandidates(input) {
    return typeof regionalSelectorApi().buildGlobalShoppingRegionalProviderCandidates === "function"
      ? regionalSelectorApi().buildGlobalShoppingRegionalProviderCandidates(input)
      : { candidates:[] };
  }
  function buildDataSource(input) {
    return typeof dataSourceApi().buildGlobalShoppingDataSourceModel === "function"
      ? dataSourceApi().buildGlobalShoppingDataSourceModel(input)
      : null;
  }
  function buildDataFreshness(input) {
    return typeof dataFreshnessApi().buildGlobalShoppingDataFreshness === "function"
      ? dataFreshnessApi().buildGlobalShoppingDataFreshness(input)
      : null;
  }
  function buildDataQuality(input) {
    return typeof dataQualityApi().buildGlobalShoppingDataQuality === "function"
      ? dataQualityApi().buildGlobalShoppingDataQuality(input)
      : null;
  }
  function buildDataProvenance(input) {
    return typeof provenanceApi().buildGlobalShoppingDataProvenance === "function"
      ? provenanceApi().buildGlobalShoppingDataProvenance(input)
      : null;
  }
  function buildProviderIntelligence(input) {
    return typeof intelligenceRegistryApi().getGlobalShoppingProviderIntelligence === "function"
      ? intelligenceRegistryApi().getGlobalShoppingProviderIntelligence(input).providerIntelligence
      : null;
  }
  function buildProviderCoverage(input) {
    return typeof coverageApi().buildGlobalShoppingProviderCoverage === "function"
      ? coverageApi().buildGlobalShoppingProviderCoverage(input)
      : null;
  }
  function buildCategoryIntelligence(input) {
    return typeof categoryIntelligenceApi().getGlobalShoppingCategoryIntelligence === "function"
      ? categoryIntelligenceApi().getGlobalShoppingCategoryIntelligence(input).categoryIntelligence
      : null;
  }
  function buildProviderCompetition(input) {
    return typeof competitionApi().buildGlobalShoppingProviderCompetition === "function"
      ? competitionApi().buildGlobalShoppingProviderCompetition(input)
      : null;
  }
  function buildProviderHealth(input) {
    return typeof healthApi().buildGlobalShoppingProviderHealth === "function"
      ? healthApi().buildGlobalShoppingProviderHealth(input)
      : null;
  }
  function buildProviderPolicyDecision(input) {
    return typeof policyApi().buildGlobalShoppingProviderPolicyDecision === "function"
      ? policyApi().buildGlobalShoppingProviderPolicyDecision(input).policyDecision
      : null;
  }
  function buildMarketCategoryMatrix(input) {
    return typeof marketCategoryMatrixApi().buildGlobalShoppingMarketCategoryMatrix === "function"
      ? marketCategoryMatrixApi().buildGlobalShoppingMarketCategoryMatrix(input)
      : null;
  }
  function buildRoute(input) {
    return typeof routerApi().buildGlobalShoppingProviderRoute === "function"
      ? routerApi().buildGlobalShoppingProviderRoute(input)
      : { candidateProviders:[] };
  }
  function buildRealPriceResult(input) {
    return typeof realPriceApi().buildGlobalShoppingRealPriceResult === "function"
      ? realPriceApi().buildGlobalShoppingRealPriceResult(input)
      : input;
  }
  function buildCapabilityModel(input) {
    return typeof capabilityApi().buildGlobalShoppingProviderCapabilityModel === "function"
      ? capabilityApi().buildGlobalShoppingProviderCapabilityModel(input)
      : null;
  }
  function buildRanking(input) {
    return typeof rankingApi().buildGlobalShoppingRankedProviderList === "function"
      ? rankingApi().buildGlobalShoppingRankedProviderList(input)
      : { rankedProviders:[] };
  }
  function buildAdapterCapability(input) {
    return typeof adapterResolverApi().buildGlobalShoppingAdapterCapabilityResult === "function"
      ? adapterResolverApi().buildGlobalShoppingAdapterCapabilityResult(input)
      : null;
  }
  function buildTaxRules(input) {
    return typeof taxRuleApi().buildGlobalShoppingTaxRuleSnapshot === "function"
      ? taxRuleApi().buildGlobalShoppingTaxRuleSnapshot(input)
      : { rules:[] };
  }
  function buildLandedCost(input) {
    return typeof landedCostApi().buildGlobalShoppingLandedCostResult === "function"
      ? landedCostApi().buildGlobalShoppingLandedCostResult(input)
      : null;
  }
  function buildTrustSummary(input) {
    return typeof trustApi().buildGlobalShoppingProviderTrustSummary === "function"
      ? trustApi().buildGlobalShoppingProviderTrustSummary(input)
      : { status:"needs_review", trustLevel:"review", officialMatch:false, unknownDomainBlocked:false };
  }
  function buildRecommendationReason(input) {
    return typeof recommendationApi().buildGlobalShoppingRecommendationReason === "function"
      ? recommendationApi().buildGlobalShoppingRecommendationReason(input)
      : { reasons:[], summary:"基础只读候选可供进一步比对" };
  }
  function buildAdapterContract(input) {
    return typeof contractApi().buildGlobalShoppingProviderAdapterContract === "function"
      ? contractApi().buildGlobalShoppingProviderAdapterContract(input)
      : null;
  }
  function createSandboxAdapter(input) {
    return typeof sandboxApi().createGlobalShoppingSandboxProviderAdapter === "function"
      ? sandboxApi().createGlobalShoppingSandboxProviderAdapter(input)
      : null;
  }
  function buildNormalizedResponse(input) {
    return typeof normalizerApi().buildGlobalShoppingNormalizedProviderResponse === "function"
      ? normalizerApi().buildGlobalShoppingNormalizedProviderResponse(input)
      : { normalizedResults:[] };
  }
  function buildPriceFreshness(input) {
    return typeof priceFreshnessApi().buildGlobalShoppingPriceFreshnessModel === "function"
      ? priceFreshnessApi().buildGlobalShoppingPriceFreshnessModel(input)
      : { freshnessLevel:"unknown" };
  }
  function buildAvailabilityFreshness(input) {
    return typeof availabilityFreshnessApi().buildGlobalShoppingAvailabilityFreshnessModel === "function"
      ? availabilityFreshnessApi().buildGlobalShoppingAvailabilityFreshnessModel(input)
      : { freshnessLevel:"unknown", availabilityStatus:"unknown" };
  }
  function buildFallbackInfo(input) {
    return typeof fallbackApi().buildGlobalShoppingProviderFallbackPlan === "function"
      ? fallbackApi().buildGlobalShoppingProviderFallbackPlan(input)
      : null;
  }
  function normalizeCategory(value) {
    const category = text(value || "product");
    if (category === "ecommerce") return "product";
    return /^(product|flight|hotel)$/.test(category) ? category : "product";
  }
  function extractQuery(input) {
    const safe = obj(input);
    const normalized = obj(safe.normalizedFields);
    return text(
      normalized.productQuery
      || normalized.normalizedQuery
      || normalized.need
      || safe.inputSummary
      || safe.query
      || "全球购搜索"
    );
  }
  function flightQuery(fields, fallback) {
    const origin = text(fields.originText || fields.origin || "");
    const destination = text(fields.destinationText || fields.destination || "");
    const dateText = text(fields.dateText || fields.timing || "");
    return [origin, destination, dateText].filter(Boolean).join(" ").trim() || fallback;
  }
  function hotelQuery(fields, fallback) {
    return text(fields.destinationText || fields.destination || fallback || "酒店搜索");
  }
  function productQuery(fields, fallback) {
    return text(fields.productQuery || fields.normalizedQuery || fallback || "商品搜索");
  }
  function fillTemplate(template, query) {
    return text(template).replace(/\{query\}/g, encode(query));
  }
  function landedCostFor(category, context, taxRuleSnapshot) {
    if (category !== "product") {
      return buildLandedCost({
        currency:context.currency,
        shoppingContext:context,
        taxRules:taxRuleSnapshot.rules,
        confirmedFees:[],
        estimatedFees:[],
        possibleFees:[{ label:"平台展示的税费/服务费", currency:context.currency, note:"最终费用以平台页面为准" }],
        unknownFees:[{ label:"地区附加费用", currency:context.currency, note:"当前暂无确定金额" }]
      });
    }
    return buildLandedCost({
      currency:context.currency,
      shoppingContext:context,
      taxRules:taxRuleSnapshot.rules,
      confirmedFees:[],
      estimatedFees:[],
      possibleFees:[{ label:"跨境运输与平台附加费", currency:context.currency, note:"可能随地区与平台变化" }],
      unknownFees:[{ label:"进口税费与清关费用", currency:context.currency, note:"当前仅保留规则层说明，最终费用以平台页面为准" }]
    });
  }
  function sandboxMethod(category) {
    if (category === "flight") return "searchFlights";
    if (category === "hotel") return "searchHotels";
    return "searchProducts";
  }
  function buildGlobalShoppingPlatformCandidates(input) {
    const safe = obj(input);
    const category = normalizeCategory(safe.category);
    const normalizedFields = obj(safe.normalizedFields);
    const query = category === "flight" ? flightQuery(normalizedFields, extractQuery(safe)) : (category === "hotel" ? hotelQuery(normalizedFields, extractQuery(safe)) : productQuery(normalizedFields, extractQuery(safe)));
    const shoppingContext = buildContext({
      query:query,
      userSelectedCountry:safe.userSelectedCountry || normalizedFields.userSelectedCountry,
      destinationCountry:safe.destinationCountry || normalizedFields.destinationCountry || normalizedFields.shippingCountry,
      sourceCountry:safe.sourceCountry || normalizedFields.sourceCountry,
      language:safe.language || normalizedFields.language,
      currency:safe.currency || normalizedFields.currency,
      preferredMarket:safe.preferredMarket || normalizedFields.preferredMarket,
      systemLanguage:(typeof navigator !== "undefined" && navigator.language) ? navigator.language : "",
      systemRegion:(typeof navigator !== "undefined" && navigator.language) ? String(navigator.language).split("-")[1] : ""
    });
    const regionContext = shoppingContext.regionContext || buildRegionContext({
      userSelectedCountry:safe.userSelectedCountry || normalizedFields.userSelectedCountry,
      gpsRegion:safe.gpsRegion,
      ipRegion:safe.ipRegion,
      systemRegion:safe.systemRegion || shoppingContext.userRegion,
      language:shoppingContext.language,
      currency:shoppingContext.currency,
      preferredMarket:shoppingContext.preferredMarket
    });
    const route = buildRoute({
      shoppingContext:shoppingContext,
      userIntent:{ category:category, query:query }
    });
    const ranking = buildRanking({
      shoppingContext:shoppingContext,
      userIntent:{ category:category, query:query },
      providers:Array.isArray(route.candidateProviders) ? route.candidateProviders : []
    });
    const routedProviders = Array.isArray(ranking.rankedProviders) ? ranking.rankedProviders.slice(0, 10) : [];
    const marketProfile = obj(buildMarketProfile({ country:shoppingContext.preferredMarket || shoppingContext.destinationCountry }).marketProfile);
    const regionalSelection = buildRegionalCandidates({
      regionContext:regionContext,
      category:category,
      providers:routedProviders,
      userPreference:safe.userPreference
    });
    const regionalMap = {};
    (regionalSelection.candidates || []).forEach(function (item) {
      regionalMap[item.providerId] = item;
    });
    const categoryIntelligence = buildCategoryIntelligence({ categoryId:category, query:query });
    const policyDecision = buildProviderPolicyDecision({
      candidates:routedProviders.map(function (provider) {
        return {
          providerId:provider.providerId,
          platformName:provider.name,
          trustLevel:provider.trustLevel,
          marketMatched:toArray(provider.countries).indexOf(shoppingContext.preferredMarket || shoppingContext.destinationCountry) >= 0,
          isOfficial:toArray(provider.capabilities).indexOf("official_store") >= 0 || toArray(provider.capabilities).indexOf("official_referral") >= 0,
          dataQuality:{ qualityScore:text(provider.trustLevel || "") === "high" ? 88 : 72 },
          providerCoverage:{ coverageScore:Math.min(100, Math.round((toArray(provider.countries).length * 8) + (toArray(provider.categories).length * 12))) }
        };
      }),
      userPreference:safe.userPreference
    });
    const competitionSummary = buildProviderCompetition({
      providers:routedProviders.map(function (provider) {
        const intelligence = buildProviderIntelligence({ provider:provider });
        return Object.assign({}, intelligence, {
          providerId:provider.providerId,
          name:provider.name,
          trustLevel:provider.trustLevel
        });
      })
    });
    const marketCategoryMatrix = buildMarketCategoryMatrix({
      market:shoppingContext.preferredMarket || shoppingContext.destinationCountry,
      categoryId:category
    });
    return clone(routedProviders.map(function (provider, index) {
      const template = obj(provider.searchTemplates)[category] || obj(provider.searchTemplates).product || "";
      const capabilityModel = buildCapabilityModel(provider);
      const adapterCapability = buildAdapterCapability({
        provider:provider,
        capabilityModel:capabilityModel
      });
      const adapterContract = buildAdapterContract({ providerId:provider.providerId });
      const sandboxAdapter = createSandboxAdapter({
        provider:provider,
        capabilityModel:capabilityModel
      });
      const searchMethod = sandboxMethod(category);
      const sandboxResponse = sandboxAdapter && typeof sandboxAdapter[searchMethod] === "function"
        ? sandboxAdapter[searchMethod]({ query:query, currency:shoppingContext.currency, category:category })
        : {};
      const normalizedResponse = buildNormalizedResponse({
        providerId:provider.providerId,
        category:category,
        currency:shoppingContext.currency,
        officialUrl:fillTemplate(template, query),
        response:sandboxResponse
      });
      const normalizedResult = obj((normalizedResponse.normalizedResults || [])[0]);
      const targetUrl = text(normalizedResult.officialUrl || fillTemplate(template, query));
      const officialDomainStatus = buildOfficialDomainStatus({
        providerId:provider.providerId,
        providerName:provider.name,
        targetUrl:targetUrl
      });
      const trustSummary = buildTrustSummary({
        providerId:provider.providerId,
        providerName:provider.name,
        targetUrl:targetUrl
      });
      const taxRuleSnapshot = buildTaxRules({
        destinationCountry:shoppingContext.destinationCountry,
        sourceCountry:shoppingContext.sourceCountry
      });
      const landedCostResult = landedCostFor(category, shoppingContext, taxRuleSnapshot);
      const realPriceResult = buildRealPriceResult({
        provider:provider.name,
        productTitle:text(normalizedResult.title || query),
        currency:shoppingContext.currency,
        availability:text(normalizedResult.availability || "visit_platform"),
        sourceType:text(normalizedResult.sourceType || "sandbox"),
        officialUrl:targetUrl,
        trustLevel:provider.trustLevel
      });
      const priceFreshness = buildPriceFreshness({
        fetchedAt:text(normalizedResult.timestamp || "")
      });
      const availabilityFreshness = buildAvailabilityFreshness({
        checkedAt:text(normalizedResult.timestamp || ""),
        availabilityStatus:text(normalizedResult.availability || "unknown")
      });
      const dataSource = buildDataSource({
        providerId:provider.providerId,
        sourceType:text(normalizedResult.sourceType || "sandbox"),
        sourceStatus:text(sandboxResponse.status || "planned"),
        trustLevel:provider.trustLevel,
        lastChecked:text(normalizedResult.timestamp || "")
      });
      const dataFreshness = buildDataFreshness({
        timestamp:text(normalizedResult.timestamp || "")
      });
      const fallbackInfo = buildFallbackInfo({
        currentProvider:provider,
        candidateProviders:routedProviders,
        providerId:provider.providerId,
        adapterAvailable:adapterCapability ? adapterCapability.searchCategories.length > 0 : true,
        searchAvailable:sandboxResponse.available !== false
      });
      const regionMatch = obj(regionalMap[provider.providerId]);
      const onboardingRecord = obj(buildOnboardingRecord(provider.providerId).record);
      const adapterStatus = {
        contractName:text(adapterContract && adapterContract.contractName || ""),
        method:searchMethod,
        status:text(sandboxResponse.status || "planned"),
        available:sandboxResponse.available === true,
        sourceType:text(sandboxResponse.sourceType || "sandbox"),
        dataConfidence:text(sandboxResponse.dataConfidence || "mock")
      };
      const dataQuality = buildDataQuality({
        sourceTrust:provider.trustLevel,
        completeness:[
          text(normalizedResult.title || query),
          targetUrl,
          text(normalizedResult.sourceType || "sandbox"),
          text(normalizedResult.timestamp || "")
        ].filter(Boolean).length / 4,
        freshness:dataFreshness,
        officialVerification:officialDomainStatus.verified === true,
        consistency:(trustSummary.status === "ready" && officialDomainStatus.verified === true) ? 0.92 : 0.58
      });
      const dataProvenance = buildDataProvenance({
        decisionId:provider.providerId + ":" + category + ":" + String(index + 1),
        providerId:provider.providerId,
        source:text(normalizedResult.sourceType || "sandbox"),
        timestamp:text(normalizedResult.timestamp || ""),
        transformations:["provider_sandbox_adapter", "provider_response_normalizer", "platform_candidate_factory"]
      });
      const providerIntelligence = buildProviderIntelligence({
        provider:provider,
        lastReview:text(normalizedResult.timestamp || "2026-07-10")
      });
      const providerCoverage = buildProviderCoverage({
        provider:provider,
        market:{
          country:shoppingContext.preferredMarket || shoppingContext.destinationCountry,
          destinationCountry:shoppingContext.destinationCountry,
          preferredMarket:shoppingContext.preferredMarket,
          language:shoppingContext.language
        },
        category:category
      });
      const providerHealth = buildProviderHealth({
        adapterStatus:adapterStatus,
        dataQuality:dataQuality,
        freshness:dataFreshness
      });
      const recommendationDetail = buildRecommendationReason({
        provider:provider,
        shoppingContext:shoppingContext,
        providerRanking:{
          totalScore:provider.totalScore,
          dimensionScores:provider.dimensionScores,
          rankingReason:provider.rankingReason,
          matchedCapabilities:provider.matchedCapabilities
        },
        landedCostResult:landedCostResult,
        adapterStatus:adapterStatus,
        fallbackInfo:fallbackInfo
      });
      const feeNote = category === "product"
        ? "数据来自 sandbox adapter 模拟；价格以平台页面为准，税费层级仅做规则说明。"
        : (category === "flight"
          ? "数据来自 sandbox adapter 模拟；票价、税费和舱位以平台页面为准。"
          : "数据来自 sandbox adapter 模拟；房价、税费和取消政策以平台页面为准。");
      return buildModel({
        platformName:provider.name,
        title:text(normalizedResult.title || query),
        price:normalizedResult.price,
        priceLabel:category === "product" ? "价格以平台页面为准" : "到平台查看实时价格",
        currency:shoppingContext.currency,
        isOfficial:provider.capabilities.indexOf("official_store") >= 0 || provider.capabilities.indexOf("official_referral") >= 0,
        targetUrl:targetUrl,
        feeNote:feeNote,
        riskNote:"Weishan 只做只读搜索、分析、比价和跳转；当前结果来自 sandbox adapter 模拟，不收款、不代下单、不保存账号密码。",
        recommendationReason:recommendationDetail.summary,
        category:category,
        sourceType:text(normalizedResult.sourceType || "sandbox"),
        trustLevel:provider.trustLevel,
        sourceRank:index + 1,
        updatedAt:text(normalizedResult.timestamp || ""),
        shoppingContext:shoppingContext,
        regionContext:regionContext,
        marketMatched:regionMatch.marketMatched === true,
        regionReason:text(regionMatch.regionReason || ""),
        officialDomainStatus:officialDomainStatus,
        dataSource:dataSource,
        dataFreshness:dataFreshness,
        dataQuality:dataQuality,
        dataProvenance:dataProvenance,
        providerIntelligence:providerIntelligence,
        providerCoverage:providerCoverage,
        providerSummary:{
          providerId:provider.providerId,
          routeConfidence:provider.routeConfidence,
          routingScore:provider.routingScore,
          routingReasons:provider.routingReasons,
          categories:provider.categories,
          officialDomains:provider.officialDomains,
          capabilityModel:capabilityModel,
          adapterContract:adapterContract,
          marketProfile:marketProfile,
          onboardingRecord:onboardingRecord
        },
        providerRanking:{
          providerId:provider.providerId,
          totalScore:provider.totalScore,
          rankingReason:provider.rankingReason,
          matchedCapabilities:provider.matchedCapabilities,
          dimensionScores:provider.dimensionScores
        },
        realPriceResult:realPriceResult,
        landedCostResult:landedCostResult,
        taxSummary:{
          taxConfidence:landedCostResult.taxConfidence,
          ruleSource:landedCostResult.ruleSource,
          rules:taxRuleSnapshot.rules
        },
        trustVerification:trustSummary,
        recommendationReasonDetail:recommendationDetail,
        adapterStatus:adapterStatus,
        adapterCapability:adapterCapability,
        priceFreshness:priceFreshness,
        availabilityFreshness:availabilityFreshness,
        fallbackInfo:fallbackInfo,
        providerIntelligence:providerIntelligence,
        providerCoverage:providerCoverage,
        providerHealth:providerHealth,
        providerCompetition:competitionSummary,
        providerPolicyDecision:policyDecision,
        marketCategoryMatrix:marketCategoryMatrix,
        categoryIntelligence:categoryIntelligence,
        dataSource:dataSource,
        dataFreshness:dataFreshness,
        dataQuality:dataQuality,
        dataProvenance:dataProvenance
      });
    }));
  }

  window.WeishanGlobalShoppingPlatformCandidateFactory = {
    GLOBAL_SHOPPING_PLATFORM_CANDIDATE_FACTORY_VERSION,
    FACTORY_NAME,
    buildGlobalShoppingPlatformCandidates
  };
})();
