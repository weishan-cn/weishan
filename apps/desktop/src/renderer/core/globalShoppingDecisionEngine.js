;(function () {
  "use strict";

  const GLOBAL_SHOPPING_DECISION_ENGINE_VERSION = "4.2.8";
  const ENGINE_NAME = "global_shopping_decision_engine_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function toArray(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function confidenceApi() {
    return window.WeishanGlobalShoppingConfidenceEngine || {};
  }

  function comparisonApi() {
    return window.WeishanGlobalShoppingComparisonMatrix || {};
  }
  function recommendApi() {
    return window.WeishanGlobalRecommendTruthEngine || {};
  }

  function userPreferenceApi() {
    return window.WeishanGlobalShoppingUserPreferenceModel || {};
  }

  function auditApi() {
    return window.WeishanGlobalShoppingRecommendationAudit || {};
  }
  function validationApi() {
    return window.WeishanGlobalShoppingRealDataValidationEngine || {};
  }
  function intelligenceApi() {
    return window.WeishanGlobalShoppingProviderIntelligenceRegistry || {};
  }
  function coverageApi() {
    return window.WeishanGlobalShoppingProviderCoverageEngine || {};
  }
  function competitionApi() {
    return window.WeishanGlobalShoppingProviderCompetitionEngine || {};
  }
  function healthApi() {
    return window.WeishanGlobalShoppingProviderHealthEngine || {};
  }
  function policyApi() {
    return window.WeishanGlobalShoppingProviderPolicyEngine || {};
  }
  function productionReadinessApi() {
    return window.WeishanGlobalShoppingProviderProductionReadiness || {};
  }

  function buildPreference(input) {
    if (typeof userPreferenceApi().buildGlobalShoppingUserPreferenceModel === "function") {
      return userPreferenceApi().buildGlobalShoppingUserPreferenceModel(input);
    }
    return {
      preferredCountry:"",
      preferredProvider:"",
      cheapestFirst:true,
      officialOnly:false,
      fastestDelivery:false,
      lowestRisk:true
    };
  }

  function buildConfidence(candidate) {
    if (typeof confidenceApi().buildGlobalShoppingConfidence === "function") {
      return confidenceApi().buildGlobalShoppingConfidence({ candidate:candidate });
    }
    return { confidence:"low", rationale:"当前主要依赖规则推断与只读入口。" };
  }

  function buildMatrix(category, candidates) {
    if (typeof comparisonApi().buildGlobalShoppingComparisonMatrix === "function") {
      return comparisonApi().buildGlobalShoppingComparisonMatrix({ category:category, candidates:candidates });
    }
    return { rows:[], rowCount:0 };
  }

  function buildAudit(input) {
    if (typeof auditApi().buildGlobalShoppingRecommendationAudit === "function") {
      return auditApi().buildGlobalShoppingRecommendationAudit(input);
    }
    return null;
  }
  function buildRealDataValidation(input) {
    if (typeof validationApi().buildGlobalShoppingRealDataValidation === "function") {
      return validationApi().buildGlobalShoppingRealDataValidation(input);
    }
    return null;
  }
  function buildProviderIntelligence(input) {
    if (typeof intelligenceApi().getGlobalShoppingProviderIntelligence === "function") {
      return intelligenceApi().getGlobalShoppingProviderIntelligence(input).providerIntelligence;
    }
    return null;
  }
  function buildProviderCoverage(input) {
    if (typeof coverageApi().buildGlobalShoppingProviderCoverage === "function") {
      return coverageApi().buildGlobalShoppingProviderCoverage(input);
    }
    return null;
  }
  function buildProviderCompetition(input) {
    if (typeof competitionApi().buildGlobalShoppingProviderCompetition === "function") {
      return competitionApi().buildGlobalShoppingProviderCompetition(input);
    }
    return null;
  }
  function buildProviderHealth(input) {
    if (typeof healthApi().buildGlobalShoppingProviderHealth === "function") {
      return healthApi().buildGlobalShoppingProviderHealth(input);
    }
    return null;
  }
  function buildPolicyDecision(input) {
    if (typeof policyApi().buildGlobalShoppingProviderPolicyDecision === "function") {
      return policyApi().buildGlobalShoppingProviderPolicyDecision(input).policyDecision;
    }
    return null;
  }
  function buildProductionReadiness(input) {
    if (typeof productionReadinessApi().buildGlobalShoppingProviderProductionReadiness === "function") {
      return productionReadinessApi().buildGlobalShoppingProviderProductionReadiness(input);
    }
    return null;
  }

  function buildRegionalExplanation(candidate) {
    const safe = obj(candidate);
    if (!safe || !Object.keys(safe).length) return "";
    if (text(safe.regionReason || "")) return text(safe.regionReason || "");
    const context = obj(safe.regionContext || obj(safe.shoppingContext).regionContext);
    if (text(context.market || "") && text(context.language || "")) {
      return "根据当前市场 " + text(context.market) + " 与语言 " + text(context.language) + " 进行只读候选排序。";
    }
    return "";
  }

  function chooseCandidate(candidates, preference) {
    const list = toArray(candidates);
    if (!list.length) return null;
    if (preference.officialOnly) {
      return list.find(function (item) { return item && item.isOfficial === true; }) || list[0];
    }
    if (preference.preferredProvider) {
      return list.find(function (item) { return text(item.platformName) === preference.preferredProvider; }) || list[0];
    }
    return list[0];
  }
  function buildTruthRecommendation(input, category, candidates, userPreference) {
    if (typeof recommendApi().buildRecommendation !== "function") return null;
    return recommendApi().buildRecommendation({
      domain:"shopping",
      category:category,
      candidates:candidates,
      userPreference:userPreference,
      userQuery:text(input && (input.userQuery || input.query || input.preferenceText || ""))
    });
  }
  function isSelectableTruthRecommendation(truth) {
    const state = text(obj(truth).state || "");
    return state === "RECOMMENDED" || state === "SINGLE_VALID_RESULT";
  }
  function chooseCandidateFromTruth(truth) {
    const selected = obj(obj(truth).selected);
    return Object.keys(selected).length ? selected : null;
  }

  function warningList(candidate, confidence, preference) {
    const warnings = [];
    const taxConfidence = text(obj(candidate.taxSummary).taxConfidence || obj(candidate.landedCostResult).taxConfidence || "unknown");
    if (taxConfidence === "unknown") warnings.push("税费仍需到平台页面确认。");
    if (!candidate.priceLabel || /平台页面为准|实时价格/.test(candidate.priceLabel)) warnings.push("当前没有真实价格抓取，价格以平台页面为准。");
    if (text(obj(candidate.trustVerification).status || "") !== "ready") warnings.push("官方链接验证未完全通过，建议人工复核。");
    if (text(obj(candidate.adapterStatus).sourceType || "") === "sandbox") warnings.push("当前结果来自 sandbox adapter 模拟，不代表真实平台实时返回。");
    if (text(obj(candidate.priceFreshness).freshnessLevel || "") === "unknown") warnings.push("当前没有真实价格抓取时间，价格时效仅保留 unknown 标记。");
    if (obj(candidate.fallbackInfo).usedFallback === true && text(obj(candidate.fallbackInfo).fallbackProviderName || "")) warnings.push("如当前平台不可用，建议切换到 " + text(obj(candidate.fallbackInfo).fallbackProviderName) + " 查看。");
    if (preference.officialOnly && candidate.isOfficial !== true) warnings.push("当前推荐未完全满足仅官网偏好。");
    if (confidence.confidence === "low") warnings.push("当前推荐主要依赖规则推断，不代表最终购买建议。");
    return warnings;
  }

  function buildProviderSimulationSummary(candidates, recommendation) {
    const list = toArray(candidates);
    const hasRealReadonly = text(obj(recommendation).sourceType || "") === "rakuten_official_api";
    return {
      providerCount:list.length,
      available:list.filter(function (item) {
        const healthStatus = text(obj(item.providerHealth).healthStatus || "");
        return !/^(disabled|timeout)$/.test(healthStatus);
      }).length,
      fallbackUsed:Boolean(obj(recommendation && recommendation.fallbackInfo).usedFallback),
      environment:hasRealReadonly ? "real_provider_readonly" : "sandbox",
      redacted:true
    };
  }

  function buildProviderOperationalSummary(recommendation, providerSimulationSummary) {
    const summary = obj(obj(recommendation).providerOperationalSummary);
    const status = text(summary.status || "");
    if (status) return clone(summary);
    const productionReadiness = obj(recommendation && recommendation.productionReadiness);
    if (Object.keys(productionReadiness).length) {
      return {
        providerId:text(obj(obj(recommendation).providerSummary).providerId || ""),
        status:text(productionReadiness.configurationState || productionReadiness.adapterStatus || "unknown"),
        adapterVersion:text(productionReadiness.adapterVersion || ""),
        readinessLevel:text(productionReadiness.readinessLevel || "unknown"),
        featureFlagState:text(productionReadiness.featureFlagState || "unknown"),
        label:text(productionReadiness.readinessLevel || "") === "sandbox" ? "Sandbox" : (text(productionReadiness.readinessLevel || "") === "ready" ? "准备接入" : (text(productionReadiness.readinessLevel || "") === "blocked" ? "已禁用" : "未知")),
        stageLabel:text(productionReadiness.readinessLevel || "") === "sandbox" ? "测试环境" : (text(productionReadiness.readinessLevel || "") === "ready" ? "生产准备中" : "状态未知"),
        redacted:true
      };
    }
    const environment = text(obj(providerSimulationSummary).environment || "sandbox");
    return {
      providerId:text(obj(obj(recommendation).providerSummary).providerId || ""),
      status:environment === "sandbox" ? "sandbox" : "ready",
      adapterVersion:text(obj(obj(recommendation).providerVersionCheck).adapterVersion || ""),
      readinessLevel:environment === "sandbox" ? "sandbox" : "ready",
      featureFlagState:text(obj(obj(recommendation).featureFlagCheck).flagState || obj(obj(recommendation).featureFlagCheck).effectiveState || "unknown"),
      label:environment === "sandbox" ? "模拟接入" : "已连接",
      stageLabel:environment === "sandbox" ? "测试环境" : "测试环境",
      redacted:true
    };
  }

  function buildGlobalShoppingDecisionResult(input) {
    const safe = obj(input);
    const category = text(safe.category || "product");
    const candidates = toArray(safe.candidates);
    const userPreference = buildPreference(safe.userPreference);
    const truthRecommendation = buildTruthRecommendation(safe, category, candidates, userPreference);
    const recommendation = truthRecommendation
      ? (isSelectableTruthRecommendation(truthRecommendation) ? chooseCandidateFromTruth(truthRecommendation) : null)
      : chooseCandidate(candidates, userPreference);
    const alternatives = candidates.filter(function (item) {
      return recommendation ? item !== recommendation : true;
    }).slice(0, 2);
    const confidence = recommendation ? buildConfidence(recommendation) : { confidence:"low", rationale:"当前没有可推荐的只读候选。" };
    const comparisonMatrix = buildMatrix(category, candidates);
    const landedCost = obj(recommendation && recommendation.landedCostResult);
    const taxSummary = obj(recommendation && recommendation.taxSummary);
    const dataQuality = obj(recommendation && recommendation.dataQuality);
    const dataSource = obj(recommendation && recommendation.dataSource);
    const realDataValidation = obj(recommendation && recommendation.realDataValidation) || obj(recommendation ? buildRealDataValidation({
      providerId:text(obj(obj(recommendation).providerSummary).providerId || recommendation.providerId || ""),
      title:text(recommendation.title || ""),
      price:recommendation.price,
      currency:text(recommendation.currency || ""),
      availability:text(recommendation.availability || ""),
      officialUrl:text(recommendation.officialUrl || recommendation.targetUrl || ""),
      dataFreshness:recommendation.dataFreshness || recommendation.priceFreshness,
      officialDomainStatus:recommendation.officialDomainStatus || recommendation.trustVerification,
      responseProvenance:recommendation.responseProvenance,
      dataQuality:dataQuality,
      sourceType:text(recommendation.sourceType || ""),
      expectedCurrency:text(obj(recommendation.shoppingContext).currency || "")
    }) : null);
    const providerIntelligence = obj(recommendation && recommendation.providerIntelligence) || obj(buildProviderIntelligence({
      providerId:text(obj(recommendation && recommendation.providerSummary).providerId || ""),
      provider:{
        providerId:text(obj(recommendation && recommendation.providerSummary).providerId || ""),
        name:text(recommendation && recommendation.platformName || ""),
        trustLevel:text(recommendation && recommendation.trustLevel || ""),
        categories:toArray(obj(recommendation && recommendation.providerSummary).categories),
        capabilities:toArray(obj(recommendation && recommendation.providerSummary).capabilityModel && obj(recommendation.providerSummary.capabilityModel).summary && obj(recommendation.providerSummary.capabilityModel).summary.available),
        officialDomains:toArray(obj(recommendation && recommendation.providerSummary).officialDomains)
      }
    }));
    const providerCoverage = obj(recommendation && recommendation.providerCoverage) || obj(recommendation ? buildProviderCoverage({
      provider:{
        countries:[text(obj(obj(recommendation.shoppingContext).regionContext).country || obj(recommendation.shoppingContext).preferredMarket || obj(recommendation.shoppingContext).destinationCountry || "")],
        categories:[category],
        languages:[text(obj(obj(recommendation.shoppingContext).regionContext).language || obj(recommendation.shoppingContext).language || "")]
      },
      market:{
        country:text(obj(obj(recommendation.shoppingContext).regionContext).country || obj(recommendation.shoppingContext).preferredMarket || ""),
        destinationCountry:text(obj(recommendation.shoppingContext).destinationCountry || ""),
        preferredMarket:text(obj(recommendation.shoppingContext).preferredMarket || ""),
        language:text(obj(recommendation.shoppingContext).language || "")
      },
      category:category
    }) : null);
    const providerHealth = obj(recommendation && recommendation.providerHealth) || obj(recommendation ? buildProviderHealth({
      adapterStatus:recommendation.adapterStatus,
      dataQuality:dataQuality,
      freshness:recommendation.dataFreshness || recommendation.priceFreshness
    }) : null);
    const policyDecision = buildPolicyDecision({
      candidates:candidates,
      userPreference:userPreference
    });
    const competitionSummary = obj(recommendation && recommendation.providerCompetition) || obj(buildProviderCompetition({
      providers:candidates.map(function (item) {
        return Object.assign({}, obj(item.providerIntelligence), {
          providerId:text(obj(item.providerSummary).providerId || ""),
          name:text(item.platformName || ""),
          trustLevel:text(item.trustLevel || "")
        });
      })
    }));
    const coverageExplanation = recommendation
      ? "平台覆盖：" + String(Number(providerCoverage.coverageScore || 0)) + " 分；市场匹配：" + (recommendation.marketMatched === true ? "已匹配" : "需复核") + "。"
      : "";
    const decisionId = recommendation
      ? text(obj(recommendation.dataProvenance).decisionId || text(recommendation.platformName || "") + ":" + category)
      : "";
    const auditReference = decisionId ? "audit:" + decisionId : "";
    const productionReadiness = obj(recommendation && recommendation.productionReadiness) || obj(recommendation ? buildProductionReadiness({
      providerId:text(obj(obj(recommendation).providerSummary).providerId || ""),
      configuration:recommendation.configurationCheck,
      featureFlag:recommendation.featureFlagCheck,
      version:recommendation.providerVersionCheck,
      compliance:{ allowed:true, reason:"sandbox_read_only_allowed" },
      permissionAllowed:obj(recommendation.permissionResult).allowed !== false,
      transactionAllowed:false,
      adapterStatus:{
        status:text(obj(recommendation.adapterStatus).status || obj(recommendation.providerHealth).healthStatus || "sandbox"),
        stage:text(obj(recommendation.adapterStatus).sourceType || "sandbox")
      }
    }) : null);
    const audit = recommendation ? buildAudit({
      decisionId:decisionId,
      provider:text(recommendation.platformName || ""),
      region:text(obj(recommendation.regionContext).market || obj(obj(recommendation.shoppingContext).regionContext).market || obj(recommendation.shoppingContext).preferredMarket || ""),
      gatewayPath:text(obj(recommendation.gatewayDecision).gatewayStatus || "sandbox"),
      permissionResult:obj(recommendation.permissionResult),
      providerStatus:text(obj(recommendation.providerSummary).status || text(obj(recommendation.providerHealth).healthStatus || "unknown")),
      providerConfigurationState:text(obj(productionReadiness).configurationState || text(obj(obj(recommendation.configurationCheck)).status || "")),
      providerVersionState:text(obj(productionReadiness).versionState || text(obj(obj(recommendation.providerVersionCheck)).status || "")),
      featureFlagState:text(obj(productionReadiness).featureFlagState || text(obj(obj(recommendation.featureFlagCheck)).flagState || obj(obj(recommendation.featureFlagCheck)).effectiveState || "")),
      productionReadinessState:text(obj(productionReadiness).readinessLevel || ""),
      providerVersion:text(obj(obj(recommendation.providerVersionCheck)).adapterVersion || ""),
      rankingFactors:toArray(obj(recommendation.providerRanking).rankingReason),
      confidence:confidence.confidence,
      warnings:warningList(recommendation, confidence, userPreference).concat(toArray(realDataValidation.warnings || [])),
      dataQuality:dataQuality,
      dataSource:dataSource,
      realDataValidation:realDataValidation
    }) : null;
    const providerSimulationSummary = buildProviderSimulationSummary(candidates, recommendation);
    const providerOperationalSummary = buildProviderOperationalSummary(recommendation, providerSimulationSummary);
    return clone({
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_SHOPPING_DECISION_ENGINE_VERSION,
      recommendation:recommendation ? {
        platformName:text(recommendation.platformName || ""),
        title:text(recommendation.title || ""),
        targetUrl:text(recommendation.targetUrl || ""),
        confidence:confidence.confidence,
        priceLabel:text(recommendation.priceLabel || ""),
        estimatedLandedCost:text((landedCost.totalEstimate || {}).label || "预计到手价"),
        taxConfidence:text(taxSummary.taxConfidence || landedCost.taxConfidence || "unknown"),
        trustStatus:text(obj(recommendation.trustVerification).status || ""),
        recommendationReason:text(recommendation.recommendationReason || ""),
        regionalExplanation:buildRegionalExplanation(recommendation),
        providerIntelligence:clone(providerIntelligence),
        coverageExplanation:coverageExplanation,
        competitionSummary:clone(competitionSummary),
        providerHealth:clone(providerHealth),
        providerOperationalSummary:clone(providerOperationalSummary),
        policyDecision:clone(policyDecision),
        dataQuality:clone(dataQuality),
        dataSource:clone(dataSource),
        realDataValidation:clone(realDataValidation),
        auditReference:auditReference,
        adapterStatus:clone(recommendation.adapterStatus || null),
        priceFreshness:clone(recommendation.priceFreshness || null),
        availabilityFreshness:clone(recommendation.availabilityFreshness || null),
        fallbackInfo:clone(recommendation.fallbackInfo || null),
        sourceType:text(recommendation.sourceType || "")
      } : null,
      recommendationState:text(obj(truthRecommendation).state || (recommendation ? "RECOMMENDED" : "NO_VALID_CANDIDATE")),
      recommendationTruth:clone(truthRecommendation),
      alternatives:alternatives.map(function (item) {
        return {
          platformName:text(item.platformName || ""),
          title:text(item.title || ""),
          targetUrl:text(item.targetUrl || ""),
          priceLabel:text(item.priceLabel || ""),
          trustStatus:text(obj(item.trustVerification).status || ""),
          sourceType:text(item.sourceType || ""),
          fallbackInfo:clone(item.fallbackInfo || null)
        };
      }),
      rankingExplanation:recommendation ? toArray(obj(recommendation.providerRanking).rankingReason) : [],
      costSummary:recommendation ? {
        priceLabel:text(recommendation.priceLabel || ""),
        landedCostLabel:text((landedCost.totalEstimate || {}).label || "预计到手价"),
        taxConfidence:text(taxSummary.taxConfidence || landedCost.taxConfidence || "unknown"),
        feeNote:text(recommendation.feeNote || ""),
        freshness:clone(recommendation.priceFreshness || null)
      } : null,
      regionalExplanation:recommendation ? buildRegionalExplanation(recommendation) : "",
      providerIntelligence:clone(providerIntelligence),
      coverageExplanation:coverageExplanation,
      competitionSummary:clone(competitionSummary),
      providerHealth:clone(providerHealth),
      providerSimulationSummary:providerSimulationSummary,
      providerOperationalSummary:providerOperationalSummary,
      productionReadiness:clone(productionReadiness),
      policyDecision:clone(policyDecision),
      confidence:confidence,
      warnings:recommendation ? warningList(recommendation, confidence, userPreference).concat(toArray(dataQuality.warnings || [])).concat(toArray(realDataValidation.warnings || [])) : ["当前没有可用推荐结果。"],
      dataQuality:clone(dataQuality),
      dataSource:clone(dataSource),
      realDataValidation:clone(realDataValidation),
      auditReference:auditReference,
      recommendationAudit:audit,
      comparisonMatrix:comparisonMatrix,
      userPreference:userPreference,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingDecisionEngine = {
    GLOBAL_SHOPPING_DECISION_ENGINE_VERSION,
    ENGINE_NAME,
    buildGlobalShoppingDecisionResult
  };
})();
