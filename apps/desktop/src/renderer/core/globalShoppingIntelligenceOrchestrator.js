;(function () {
  "use strict";

  const GLOBAL_SHOPPING_INTELLIGENCE_ORCHESTRATOR_VERSION = "4.2.8";
  const ORCHESTRATOR_NAME = "global_shopping_intelligence_orchestrator_v1";

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

  function intentApi() {
    return window.WeishanGlobalShoppingIntentClassifier || {};
  }

  function entityApi() {
    return window.WeishanGlobalShoppingEntityExtractor || {};
  }

  function workflowApi() {
    return window.WeishanGlobalShoppingWorkflowStateModel || {};
  }

  function decisionApi() {
    return window.WeishanGlobalShoppingDecisionEngine || {};
  }

  function multiComparisonApi() {
    return window.WeishanGlobalShoppingMultiProviderComparisonEngine || {};
  }
  function gatewayApi() {
    return window.WeishanGlobalShoppingProviderGateway || {};
  }
  function healthSimulatorApi() {
    return window.WeishanGlobalShoppingProviderHealthSimulator || {};
  }

  function buildIntent(input) {
    return typeof intentApi().buildGlobalShoppingIntentClassification === "function"
      ? intentApi().buildGlobalShoppingIntentClassification(input)
      : { intentType:"unknown", confidence:0.3, entities:{} };
  }

  function buildEntities(input) {
    return typeof entityApi().buildGlobalShoppingEntityExtraction === "function"
      ? entityApi().buildGlobalShoppingEntityExtraction(input)
      : { intentType:"unknown", entities:{} };
  }

  function buildWorkflow(input) {
    return typeof workflowApi().buildGlobalShoppingWorkflowState === "function"
      ? workflowApi().buildGlobalShoppingWorkflowState(input)
      : { currentStage:"created", completedStages:["created"] };
  }

  function buildDecision(input) {
    return typeof decisionApi().buildGlobalShoppingDecisionResult === "function"
      ? decisionApi().buildGlobalShoppingDecisionResult(input)
      : { recommendation:null, alternatives:[], confidence:{ confidence:"low" }, warnings:[], audit:null };
  }

  function buildComparison(input) {
    return typeof multiComparisonApi().buildGlobalShoppingMultiProviderComparison === "function"
      ? multiComparisonApi().buildGlobalShoppingMultiProviderComparison(input)
      : { winner:null, alternatives:[], tradeoffs:[], comparisonMatrix:{ rows:[] } };
  }
  function buildGatewayDecision(input) {
    const safe = obj(input);
    const candidates = toArray(safe.providerCandidates || []);
    const first = obj(candidates[0]);
    const providerId = text(first.providerId || "");
    const operation = text(first.category || safe.category || "") === "flight"
      ? "searchFlights"
      : (text(first.category || safe.category || "") === "hotel" ? "searchHotels" : "searchProducts");
    if (!providerId || typeof gatewayApi().buildGlobalShoppingProviderGatewayResult !== "function") {
      return {
        providerReady:false,
        reason:"sandbox_only",
        gatewayStatus:"sandbox",
        providerId:providerId
      };
    }
    const gatewayResult = gatewayApi().buildGlobalShoppingProviderGatewayResult({
      providerId:providerId,
      operation:operation,
      payload:{ query:text(safe.userIntent || "") },
      regionContext:safe.regionContext
    });
    return {
      providerReady:gatewayResult.status === "sandbox",
      reason:gatewayResult.status === "sandbox" ? "sandbox_only" : "request_blocked",
      gatewayStatus:gatewayResult.status,
      providerId:providerId,
      metadata:gatewayResult.metadata || {},
      audit:gatewayResult.audit || null
    };
  }

  function buildProviderHealthMap(candidates) {
    const list = toArray(candidates);
    const map = {};
    list.forEach(function (item) {
      const providerId = text(item.providerId || "");
      if (!providerId || typeof healthSimulatorApi().buildGlobalShoppingProviderHealthSimulation !== "function") return;
      map[providerId] = healthSimulatorApi().buildGlobalShoppingProviderHealthSimulation({
        providerId:providerId,
        provider:item.providerSummary || item.provider || item,
        payload:{ simulatedHealthStatus:text(obj(item.providerHealth).healthStatus || "healthy") }
      });
    });
    return map;
  }

  function inferRegionContext(input, candidates) {
    const safe = obj(input);
    const first = obj(candidates[0]);
    return safe.regionContext || first.regionContext || obj(first.shoppingContext).regionContext || null;
  }

  function inferShoppingContext(input, candidates) {
    const safe = obj(input);
    const first = obj(candidates[0]);
    return safe.shoppingContext || first.shoppingContext || null;
  }

  function inferMarketProfile(input, shoppingContext) {
    const safe = obj(input);
    if (safe.marketProfile) return safe.marketProfile;
    return {
      country:text(obj(shoppingContext).preferredMarket || obj(shoppingContext).destinationCountry || ""),
      currency:text(obj(shoppingContext).currency || ""),
      language:text(obj(shoppingContext).language || "")
    };
  }

  function buildGlobalShoppingIntelligenceOrchestration(input) {
    const safe = obj(input);
    const userIntent = text(safe.userIntent || safe.query || safe.inputSummary || "");
    const providerCandidates = toArray(safe.providerCandidates || safe.candidates);
    const shoppingContext = inferShoppingContext(safe, providerCandidates);
    const regionContext = inferRegionContext(safe, providerCandidates);
    const marketProfile = inferMarketProfile(safe, shoppingContext);
    const intentClassification = buildIntent({ userIntent:userIntent });
    const entityExtraction = buildEntities({
      userIntent:userIntent,
      intentClassification:intentClassification
    });
    const comparison = buildComparison({
      category:text(safe.category || intentClassification.intentType || "product"),
      candidates:providerCandidates
    });
    const decision = buildDecision({
      category:text(safe.category || intentClassification.intentType || "product"),
      candidates:providerCandidates,
      shoppingContext:shoppingContext,
      regionContext:regionContext,
      marketProfile:marketProfile,
      userPreference:safe.preferences || safe.userPreference
    });
    const gatewayDecision = buildGatewayDecision({
      category:text(safe.category || intentClassification.intentType || "product"),
      providerCandidates:providerCandidates,
      userIntent:userIntent,
      regionContext:regionContext
    });
    const providerHealthMap = buildProviderHealthMap(providerCandidates);
    const workflowState = buildWorkflow({
      stage:decision && decision.recommendation ? "recommended" : (comparison && comparison.winner ? "comparing" : "ranking"),
      hasRecommendation:!!(decision && decision.recommendation),
      hasComparison:!!(comparison && comparison.winner),
      hasRanking:providerCandidates.length > 0
    });
    const recommendationList = [];
    if (decision && decision.recommendation) recommendationList.push(decision.recommendation);
    recommendationList.push.apply(recommendationList, toArray(decision && decision.alternatives));
    return clone({
      orchestratorName:ORCHESTRATOR_NAME,
      appVersion:GLOBAL_SHOPPING_INTELLIGENCE_ORCHESTRATOR_VERSION,
      intentClassification:intentClassification,
      entityExtraction:entityExtraction,
      workflowState:workflowState,
      shoppingContext:shoppingContext,
      regionContext:regionContext,
      marketProfile:marketProfile,
      gatewayDecision:gatewayDecision,
      providerHealthMap:providerHealthMap,
      decision:decision,
      recommendations:recommendationList,
      comparison:comparison,
      confidence:obj(decision).confidence || { confidence:"low" },
      audit:obj(decision).audit || null,
      warnings:toArray(obj(decision).warnings),
      redacted:true
    });
  }

  window.WeishanGlobalShoppingIntelligenceOrchestrator = {
    GLOBAL_SHOPPING_INTELLIGENCE_ORCHESTRATOR_VERSION,
    ORCHESTRATOR_NAME,
    buildGlobalShoppingIntelligenceOrchestration
  };
})();
