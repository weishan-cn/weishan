;(function () {
  "use strict";

  const GLOBAL_SHOPPING_READ_ONLY_SEARCH_RESULT_PRESENTER_VERSION = "4.2.8";
  const PRESENTER_NAME = "global_shopping_read_only_search_result_presenter_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function rankerApi() { return window.WeishanGlobalShoppingReadOnlySearchResultRanker || {}; }
  function decisionApi() { return window.WeishanGlobalShoppingDecisionEngine || {}; }
  function orchestratorApi() { return window.WeishanGlobalShoppingIntelligenceOrchestrator || {}; }
  function buildRanking(input) {
    return typeof rankerApi().buildGlobalShoppingReadOnlySearchResultRanking === "function"
      ? rankerApi().buildGlobalShoppingReadOnlySearchResultRanking(input)
      : { topResults:[], remainingResults:[], candidateCount:0, rankingSummary:"暂无可排序候选。" };
  }
  function buildDecision(input) {
    return typeof decisionApi().buildGlobalShoppingDecisionResult === "function"
      ? decisionApi().buildGlobalShoppingDecisionResult(input)
      : { recommendation:null, alternatives:[], confidence:{ confidence:"low" }, warnings:[], comparisonMatrix:{ rows:[] } };
  }
  function buildOrchestration(input) {
    return typeof orchestratorApi().buildGlobalShoppingIntelligenceOrchestration === "function"
      ? orchestratorApi().buildGlobalShoppingIntelligenceOrchestration(input)
      : {
          intentClassification:{ intentType:"unknown", confidence:0.3, entities:{} },
          entityExtraction:{ intentType:"unknown", entities:{} },
          workflowState:{ currentStage:"created", completedStages:["created"] },
          decision:null,
          comparison:null,
          confidence:{ confidence:"low" },
          warnings:[]
        };
  }
  function buildGlobalShoppingReadOnlySearchResultPresentation(input) {
    const safe = obj(input);
    const ranking = buildRanking({
      category:safe.category,
      candidates:safe.candidates
    });
    const topResults = Array.isArray(ranking.topResults) ? ranking.topResults : [];
    const decision = buildDecision({
      category:safe.category,
      shoppingContext:topResults[0] && topResults[0].shoppingContext ? topResults[0].shoppingContext : null,
      candidates:topResults.concat(Array.isArray(ranking.remainingResults) ? ranking.remainingResults : []),
      userPreference:safe.userPreference
    });
    const orchestration = buildOrchestration({
      category:safe.category,
      userIntent:text(safe.inputSummary || safe.query || ""),
      inputSummary:text(safe.inputSummary || safe.query || ""),
      shoppingContext:topResults[0] && topResults[0].shoppingContext ? topResults[0].shoppingContext : null,
      regionContext:topResults[0] && topResults[0].regionContext ? topResults[0].regionContext : null,
      providerCandidates:topResults.concat(Array.isArray(ranking.remainingResults) ? ranking.remainingResults : []),
      userPreference:safe.userPreference,
      preferences:safe.userPreference
    });
    const topOne = topResults[0] || null;
    const contextSummary = topOne && topOne.shoppingContext ? topOne.shoppingContext : null;
    return clone({
      presenterName:PRESENTER_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_SEARCH_RESULT_PRESENTER_VERSION,
      category:text(safe.category || ""),
      candidateCount:Number(ranking.candidateCount || 0),
      topResults:topResults,
      remainingResults:Array.isArray(ranking.remainingResults) ? ranking.remainingResults : [],
      recommendation:{
        title:topOne ? "优先查看 " + text(topOne.platformName) : "暂无推荐结果",
        reason:topOne ? text((decision.coverageExplanation || "") || (topOne.recommendationReasonDetail || {}).decisionSummary || (topOne.recommendationReasonDetail || {}).summary || topOne.recommendationReason || ranking.rankingSummary) : "当前没有可展示的只读候选。",
        riskSummary:"Weishan 不收款、不代下单、不保存账号密码，最终价格与规则以平台页面为准。"
      },
      architectureSummary:{
        shoppingContext:contextSummary,
        providerCount:Number(ranking.candidateCount || 0),
        intelligenceLayers:["context", "region_intelligence", "market_profile", "provider_router", "provider_ranking", "provider_onboarding", "official_domain_verification", "adapter_contract", "provider_gateway", "provider_permission", "provider_request_policy", "response_safety_filter", "error_normalizer", "rate_limit_model", "cache_policy", "adapter_sandbox", "response_normalizer", "freshness", "fallback", "landed_cost", "tax_registry", "trust_verification", "recommendation_reasoning", "data_source", "data_freshness", "data_quality", "data_provenance", "recommendation_audit", "provider_intelligence", "provider_coverage", "provider_competition", "provider_health", "provider_policy", "market_category_matrix", "category_intelligence"]
      },
      providerRanking:topOne ? clone(topOne.providerRanking || null) : null,
      taxSummary:topOne ? clone(topOne.taxSummary || null) : null,
      recommendationReason:topOne ? clone(topOne.recommendationReasonDetail || null) : null,
      providerIntelligence:topOne ? clone(topOne.providerIntelligence || null) : null,
      providerCoverage:topOne ? clone(topOne.providerCoverage || null) : null,
      providerHealth:topOne ? clone(topOne.providerHealth || null) : null,
      providerCompetition:topOne ? clone(topOne.providerCompetition || null) : null,
      providerPolicyDecision:topOne ? clone(topOne.providerPolicyDecision || null) : null,
      dataSource:topOne ? clone(topOne.dataSource || null) : null,
      dataFreshness:topOne ? clone(topOne.dataFreshness || null) : null,
      dataQuality:topOne ? clone(topOne.dataQuality || null) : null,
      dataProvenance:topOne ? clone(topOne.dataProvenance || null) : null,
      orchestration:orchestration,
      intentClassification:clone(orchestration.intentClassification || null),
      entityExtraction:clone(orchestration.entityExtraction || null),
      workflowState:clone(orchestration.workflowState || null),
      gatewayDecision:clone(orchestration.gatewayDecision || null),
      decisionResult:decision,
      comparisonMatrix:decision.comparisonMatrix || { rows:[] },
      providerSimulationSummary:clone(decision.providerSimulationSummary || null),
      userFacingSummary:{
        title:"只读搜索结果",
        resultLabel:topResults.length ? "已生成 2-3 条优先查看结果" : "暂无可展示结果",
        caveat:"这些是只读候选入口，不是订单、不是支付对象，也不是 provider response。最终购买、预订和支付都在外部平台完成。",
        workflowLabel:(orchestration.workflowState && orchestration.workflowState.currentStage) ? "任务阶段：" + text(orchestration.workflowState.currentStage) : "任务阶段：created",
        intentLabel:(orchestration.intentClassification && orchestration.intentClassification.intentType) ? "需求识别：" + text(orchestration.intentClassification.intentType) : "需求识别：unknown",
        gatewayLabel:(orchestration.gatewayDecision && orchestration.gatewayDecision.gatewayStatus)
          ? "Provider Gateway：" + text(orchestration.gatewayDecision.gatewayStatus) + " / " + text(orchestration.gatewayDecision.reason || "sandbox_only")
          : "Provider Gateway：sandbox_only",
        sandboxLabel:(decision.providerSimulationSummary && decision.providerSimulationSummary.environment)
          ? "数据环境：" + text(decision.providerSimulationSummary.environment) + "；模拟接入平台：" + text(String(decision.providerSimulationSummary.available || 0)) + "/" + text(String(decision.providerSimulationSummary.providerCount || 0))
          : "数据环境：sandbox",
        dataGovernanceLabel:topOne
          ? "数据来源：" + text(obj(topOne.dataSource).sourceType || "unknown") + "；数据质量：" + text(obj(topOne.dataQuality).qualityLevel || "low") + "；最终价格仍以平台页面为准。"
          : "当前没有可展示的数据治理摘要。",
        providerIntelligenceLabel:topOne
          ? "平台覆盖：" + String(Number(obj(topOne.providerCoverage).coverageScore || 0)) + " 分；市场匹配：" + (topOne.marketMatched === true ? "已匹配" : "需复核") + "；推荐原因：" + text((topOne.recommendationReasonDetail || {}).summary || topOne.recommendationReason || "")
          : "当前没有可展示的平台智能摘要。",
        redacted:true
      },
      redacted:true
    });
  }

  window.WeishanGlobalShoppingReadOnlySearchResultPresenter = {
    GLOBAL_SHOPPING_READ_ONLY_SEARCH_RESULT_PRESENTER_VERSION,
    PRESENTER_NAME,
    buildGlobalShoppingReadOnlySearchResultPresentation
  };
})();
