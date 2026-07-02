;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PRICE_PIPELINE_ORCHESTRATOR_VERSION = "4.0.1";
  const ORCHESTRATOR_NAME = "global_shopping_price_pipeline_orchestrator_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function row(stageId, label, status, message) {
    return {
      stageId:text(stageId || "stage"),
      label:text(label || ""),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      message:text(message || ""),
      redacted:true
    };
  }
  function safety(overrides) {
    return Object.assign({
      fileWrite:false,
      download:false,
      realNameStored:false,
      phoneStored:false,
      emailStored:false,
      identityUpload:false,
      credentialInput:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    }, obj(overrides));
  }
  function api(name) { return window[name] || {}; }
  function resolveSummary(input, key, apiName, methodName, buildInput) {
    const safe = obj(input);
    if (Object.keys(obj(safe[key])).length) return obj(safe[key]);
    const summaryApi = api(apiName);
    return typeof summaryApi[methodName] === "function" ? summaryApi[methodName](buildInput || safe) : {};
  }
  function hasSummaryInput(input, key) {
    return Object.keys(obj(obj(input)[key])).length > 0;
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function linkedSummary(summary) {
    const safe = obj(summary);
    return clone({
      status:text(safe.status || ""),
      title:text(safe.title || obj(safe.userFacingSummary).title || ""),
      userFacingSummary:{
        title:text(obj(safe.userFacingSummary).title || ""),
        resultLabel:text(obj(safe.userFacingSummary).resultLabel || ""),
        caveat:text(obj(safe.userFacingSummary).caveat || ""),
        redacted:true
      },
      redacted:true
    });
  }
  function evaluateGlobalShoppingPricePipeline(input) {
    const safe = obj(input);
    const hasPriceSourceNormalizationInput = Object.keys(obj(safe.priceSourceNormalizer)).length > 0 || Object.keys(obj(safe.priceSourceNormalizationSummary)).length > 0 || toArray(safe.normalizedCandidates).length > 0;
    const providerAdapterRegistrySummary = Object.keys(obj(safe.providerAdapterRegistrySummary)).length ? obj(safe.providerAdapterRegistrySummary) : resolveSummary(safe, "providerAdapterRegistrySummary", "WeishanGlobalShoppingProviderAdapterRegistry", "buildGlobalShoppingProviderAdapterRegistry", safe);
    const firstSandboxProviderConnectorSummary = Object.keys(obj(safe.firstSandboxProviderConnectorSummary)).length ? obj(safe.firstSandboxProviderConnectorSummary) : resolveSummary(safe, "firstSandboxProviderConnector", "WeishanGlobalShoppingFirstSandboxProviderConnector", "buildGlobalShoppingFirstSandboxProviderConnector", {
      adapterRegistry:safe.providerAdapterRegistrySummary || safe.adapterRegistrySummary || safe.adapterRegistry || {},
      adapterShell:safe.firstReadOnlyProviderAdapterShellSummary || safe.adapterShell || {},
      dryRunHarness:safe.providerSandboxDryRunHarnessSummary || safe.dryRunHarness || {},
      safetyKillSwitch:safe.providerSandboxSafetyKillSwitchSummary || safe.safetyKillSwitch || {},
      requestEnvelope:safe.providerRequestEnvelopeSummary || safe.requestEnvelope || {},
      providerRunbook:safe.sandboxProviderRunbookSummary || safe.providerRunbook || {},
      dryRunResponseNormalizer:safe.dryRunProviderResponseNormalizerSummary || safe.dryRunResponseNormalizer || {},
      fixturePayload:obj(safe.fixturePayload || { providerId:"global_fixture_provider", providerName:"Global Shopping Fixture Sandbox", sourceType:"fixture", itemType:"flight", redacted:true }),
      normalizedSourceInputs:toArray(safe.normalizedSourceInputs)
    });
    const legalProviderFixtureSummary = resolveSummary(safe, "legalProviderFixtureSummary", "WeishanGlobalShoppingLegalProviderFixtureAdapter", "buildGlobalShoppingLegalProviderFixtureAdapter", safe);
    const providerCredentialSafetySummary = resolveSummary(safe, "providerCredentialSafetyReview", "WeishanGlobalShoppingProviderCredentialSafetyReview", "buildGlobalShoppingProviderCredentialSafetyReview", safe);
    const sandboxPriceFeedSummary = resolveSummary(safe, "sandboxPriceFeedGate", "WeishanGlobalShoppingSandboxPriceFeedGate", "buildGlobalShoppingSandboxPriceFeedGate", safe);
    const sandboxProviderResponseContractSummary = resolveSummary(safe, "sandboxProviderResponseContract", "WeishanGlobalShoppingSandboxProviderResponseContract", "buildGlobalShoppingSandboxProviderResponseContract", Object.assign({}, safe, {
      providerFixture:legalProviderFixtureSummary,
      credentialSafetyReview:providerCredentialSafetySummary,
      sandboxPriceFeedGate:sandboxPriceFeedSummary,
      normalizedSourceInputs:toArray(legalProviderFixtureSummary.normalizedSourceInputs || safe.normalizedSourceInputs)
    }));
    const readOnlyProviderSandboxConnectorSummary = resolveSummary(safe, "readOnlyProviderSandboxConnector", "WeishanGlobalShoppingReadOnlyProviderSandboxConnector", "buildGlobalShoppingReadOnlyProviderSandboxConnector", {
      providerFixture:legalProviderFixtureSummary,
      providerCredentialSafetyReview:providerCredentialSafetySummary,
      sandboxPriceFeedGate:sandboxPriceFeedSummary,
      providerResponseContract:sandboxProviderResponseContractSummary,
      connectorMode:text(safe.connectorMode || "fixture"),
      fixturePayload:obj(safe.fixturePayload || {
        providerId:obj(legalProviderFixtureSummary).providerId || "global_fixture_provider",
        providerName:obj(legalProviderFixtureSummary).providerName || "Global Shopping Fixture Sandbox",
        connectorMode:"fixture"
      }),
      replayPayload:obj(safe.replayPayload || {})
    });
    const fixtureReplayConsoleSummary = resolveSummary(safe, "fixtureReplayConsole", "WeishanGlobalShoppingFixtureReplayConsole", "buildGlobalShoppingFixtureReplayConsole", {
      connectorSummary:readOnlyProviderSandboxConnectorSummary,
      replayMode:text(safe.replayMode || "fixture"),
      replayPayload:obj(safe.replayPayload || {
        replayId:"fixture_replay_pipeline",
        replayMode:"fixture",
        providerId:obj(legalProviderFixtureSummary).providerId || "global_fixture_provider",
        providerName:obj(legalProviderFixtureSummary).providerName || "Global Shopping Fixture Sandbox",
        redacted:true,
        normalizedSourceInputs:toArray(legalProviderFixtureSummary.normalizedSourceInputs)
      })
    });
    const priceSourceNormalizationSummary = resolveSummary(safe, "priceSourceNormalizer", "WeishanGlobalShoppingPriceSourceNormalizer", "buildGlobalShoppingPriceSourceNormalizer", safe);
    const officialPriceAnchorSummary = resolveSummary(safe, "officialPriceAnchorSlot", "WeishanGlobalShoppingOfficialPriceAnchorSlot", "buildGlobalShoppingOfficialPriceAnchorSlot", {
      normalizedCandidates:toArray(priceSourceNormalizationSummary.normalizedCandidates)
    });
    const sameItemMatcherSummary = resolveSummary(safe, "sameItemMatcher", "WeishanGlobalShoppingSameItemMatcher", "buildGlobalShoppingSameItemMatcher", {
      normalizedCandidates:toArray(priceSourceNormalizationSummary.normalizedCandidates)
    });
    const duplicateCandidateMergerSummary = resolveSummary(safe, "duplicateCandidateMerger", "WeishanGlobalShoppingDuplicateCandidateMerger", "buildGlobalShoppingDuplicateCandidateMerger", {
      sameItemMatcherSummary:sameItemMatcherSummary
    });
    const coveredLowestCandidateBoardSummary = resolveSummary(safe, "coveredLowestCandidateBoard", "WeishanGlobalShoppingCoveredLowestCandidateBoard", "buildGlobalShoppingCoveredLowestCandidateBoard", {
      duplicateCandidateMergerSummary:duplicateCandidateMergerSummary,
      officialPriceAnchorSummary:officialPriceAnchorSummary
    });
    const realProviderSandboxGateSummary = resolveSummary(safe, "realProviderSandboxGateSummary", "WeishanGlobalShoppingReadOnlyRealProviderSandboxGate", "buildGlobalShoppingReadOnlyRealProviderSandboxGate", {
      readOnlyProviderSandboxConnectorSummary:readOnlyProviderSandboxConnectorSummary,
      fixtureReplayConsoleSummary:fixtureReplayConsoleSummary,
      normalizedPriceCandidateBoardSummary:obj(safe.normalizedPriceCandidateBoardSummary || safe.normalizedPriceCandidateBoard),
      sandboxProviderResponseContractSummary:sandboxProviderResponseContractSummary,
      pricePipelineOrchestratorSummary:{ status:"ready" },
      providerCredentialSafetySummary:providerCredentialSafetySummary,
      sandboxPriceFeedSummary:sandboxPriceFeedSummary
    });
    const providerRequestEnvelopeSummary = resolveSummary(safe, "providerRequestEnvelopeSummary", "WeishanGlobalShoppingProviderRequestEnvelopeBuilder", "buildGlobalShoppingProviderRequestEnvelopeBuilder", {
      providerId:obj(legalProviderFixtureSummary).providerId || "global_fixture_provider",
      providerName:obj(legalProviderFixtureSummary).providerName || "Global Shopping Fixture Sandbox",
      requestMode:"sandbox_ready",
      itemType:"flight",
      origin:"SHA",
      destination:"CTU",
      departureDate:"2026-07-15",
      passengerCount:1,
      directOnly:true,
      nonSensitivePreference:"cheapest_direct_first",
      userRegion:"CN",
      destinationRegion:"CN",
      currency:"CNY",
      locale:"zh-CN",
      requestCreatedAt:"redacted_now"
    });
    const providerCallAuditLedgerSummary = resolveSummary(safe, "providerCallAuditLedgerSummary", "WeishanGlobalShoppingProviderCallAuditLedger", "buildGlobalShoppingProviderCallAuditLedger", {
      providerId:obj(legalProviderFixtureSummary).providerId || "global_fixture_provider",
      providerName:obj(legalProviderFixtureSummary).providerName || "Global Shopping Fixture Sandbox",
      requestMode:"sandbox_ready",
      auditEntries:[{ auditId:"audit_1", providerId:obj(legalProviderFixtureSummary).providerId || "global_fixture_provider", providerName:obj(legalProviderFixtureSummary).providerName || "Global Shopping Fixture Sandbox", requestMode:"sandbox_ready", callStatus:"not_sent", redacted:true, timestamp:"redacted_now", safetyStatus:"redacted_safe" }]
    });
    const providerSandboxReadinessViewModelSummary = resolveSummary(safe, "providerSandboxReadinessViewModelSummary", "WeishanGlobalShoppingProviderSandboxReadinessViewModel", "buildGlobalShoppingProviderSandboxReadinessViewModel", {
      realProviderSandboxGateSummary:realProviderSandboxGateSummary,
      providerRequestEnvelopeSummary:providerRequestEnvelopeSummary,
      providerCallAuditLedgerSummary:providerCallAuditLedgerSummary
    });
    const providerSandboxSafetyKillSwitchSummary = resolveSummary(safe, "providerSandboxSafetyKillSwitchSummary", "WeishanGlobalShoppingProviderSandboxSafetyKillSwitch", "buildGlobalShoppingProviderSandboxSafetyKillSwitch", safe);
    const firstReadOnlyProviderAdapterShellSummary = resolveSummary(safe, "firstReadOnlyProviderAdapterShellSummary", "WeishanGlobalShoppingFirstReadOnlyProviderAdapterShell", "buildGlobalShoppingFirstReadOnlyProviderAdapterShell", {
      providerId:obj(legalProviderFixtureSummary).providerId || "global_fixture_provider",
      providerName:obj(legalProviderFixtureSummary).providerName || "Global Shopping Fixture Sandbox",
      adapterMode:"dry_run",
      providerType:"fixture"
    });
    const providerSandboxDryRunHarnessSummary = resolveSummary(safe, "providerSandboxDryRunHarnessSummary", "WeishanGlobalShoppingProviderSandboxDryRunHarness", "buildGlobalShoppingProviderSandboxDryRunHarness", {
      providerId:obj(legalProviderFixtureSummary).providerId || "global_fixture_provider",
      providerName:obj(legalProviderFixtureSummary).providerName || "Global Shopping Fixture Sandbox",
      providerRequestEnvelopeSummary:providerRequestEnvelopeSummary,
      realProviderSandboxGateSummary:realProviderSandboxGateSummary,
      providerCallAuditLedgerSummary:providerCallAuditLedgerSummary,
      providerSandboxSafetyKillSwitchSummary:providerSandboxSafetyKillSwitchSummary
    });
    const providerSandboxDryRunViewModelSummary = resolveSummary(safe, "providerSandboxDryRunViewModelSummary", "WeishanGlobalShoppingProviderSandboxDryRunViewModel", "buildGlobalShoppingProviderSandboxDryRunViewModel", {
      providerSandboxDryRunHarnessSummary:providerSandboxDryRunHarnessSummary,
      firstReadOnlyProviderAdapterShellSummary:firstReadOnlyProviderAdapterShellSummary,
      providerSandboxSafetyKillSwitchSummary:providerSandboxSafetyKillSwitchSummary
    });
    const sandboxHandoffViewModelSummary = resolveSummary(safe, "sandboxHandoffViewModel", "WeishanGlobalShoppingSandboxHandoffViewModel", "buildGlobalShoppingSandboxHandoffViewModel", safe);
    const effectiveProviderAdapterRegistrySummary = Object.keys(providerAdapterRegistrySummary).length ? providerAdapterRegistrySummary : (statusOf(firstSandboxProviderConnectorSummary) === "ready" ? {
      status:"ready",
      userFacingSummary:{
        title:"Provider Adapter 注册表",
        resultLabel:"Adapter Registry 已准备",
        redacted:true
      },
      redacted:true
    } : providerAdapterRegistrySummary);
    const jumpToPlatformHandoffPreviewSummary = Object.keys(obj(safe.jumpToPlatformHandoffPreviewSummary)).length ? obj(safe.jumpToPlatformHandoffPreviewSummary) : (statusOf(sandboxHandoffViewModelSummary) === "ready" ? {
      status:"ready",
      userFacingSummary:{
        title:"跳转至平台查看",
        resultLabel:"跳转预览已准备",
        redacted:true
      },
      redacted:true
    } : {});
    const dryRunResponseNormalizerSummary = obj(safe.dryRunProviderResponseNormalizerSummary || safe.dryRunResponseNormalizer);
    const providerCoverageDashboardSummary = resolveSummary(safe, "providerCoverageDashboardSummary", "WeishanGlobalShoppingProviderCoverageDashboard", "buildGlobalShoppingProviderCoverageDashboard", {
      adapterRegistrySummary:safe.providerAdapterRegistrySummary || safe.adapterRegistrySummary || safe.adapterRegistry || {},
      firstSandboxProviderConnectorSummary:firstSandboxProviderConnectorSummary,
      coveredLowestCandidateBoardSummary:coveredLowestCandidateBoardSummary,
      normalizedSourceInputs:toArray(obj(dryRunResponseNormalizerSummary).normalizedSourceInputs || safe.normalizedSourceInputs)
    });
    const readOnlySourceTrustScoreSummary = resolveSummary(safe, "readOnlySourceTrustScoreSummary", "WeishanGlobalShoppingReadOnlySourceTrustScore", "buildGlobalShoppingReadOnlySourceTrustScore", {
      dryRunProviderResponseNormalizerSummary:dryRunResponseNormalizerSummary,
      sources:toArray(obj(dryRunResponseNormalizerSummary).normalizedSourceInputs || safe.normalizedSourceInputs)
    });
    const providerCoverageViewModelSummary = resolveSummary(safe, "providerCoverageViewModelSummary", "WeishanGlobalShoppingProviderCoverageViewModel", "buildGlobalShoppingProviderCoverageViewModel", {
      firstSandboxProviderConnectorSummary:firstSandboxProviderConnectorSummary,
      providerCoverageDashboardSummary:providerCoverageDashboardSummary,
      readOnlySourceTrustScoreSummary:readOnlySourceTrustScoreSummary,
      safeToProceedWithFirstReadOnlyProviderSandboxIntegration:statusOf(firstSandboxProviderConnectorSummary) === "ready" && statusOf(providerCoverageDashboardSummary) === "ready" && statusOf(readOnlySourceTrustScoreSummary) === "ready"
    });
    const readOnlyProviderSandboxIntegrationGateSummary = resolveSummary(safe, "readOnlyProviderSandboxIntegrationGateSummary", "WeishanGlobalShoppingReadOnlyProviderSandboxIntegrationGate", "buildGlobalShoppingReadOnlyProviderSandboxIntegrationGate", {
      legalProviderFixtureSummary:legalProviderFixtureSummary,
      providerCredentialSafetySummary:providerCredentialSafetySummary,
      sandboxPriceFeedSummary:sandboxPriceFeedSummary,
      firstSandboxProviderConnectorSummary:firstSandboxProviderConnectorSummary,
      providerAdapterRegistrySummary:effectiveProviderAdapterRegistrySummary,
      providerSandboxDryRunHarnessSummary:providerSandboxDryRunHarnessSummary,
      providerSandboxSafetyKillSwitchSummary:providerSandboxSafetyKillSwitchSummary,
      providerCoverageDashboardSummary:providerCoverageDashboardSummary,
      readOnlySourceTrustScoreSummary:readOnlySourceTrustScoreSummary,
      pricePipelineOrchestratorSummary:{ status:"ready", redacted:true },
      jumpToPlatformHandoffPreviewSummary:jumpToPlatformHandoffPreviewSummary
    });
    const sandboxPriceCandidateSessionSummary = resolveSummary(safe, "sandboxPriceCandidateSessionSummary", "WeishanGlobalShoppingSandboxPriceCandidateSession", "buildGlobalShoppingSandboxPriceCandidateSession", {
      readOnlyProviderSandboxIntegrationGateSummary:readOnlyProviderSandboxIntegrationGateSummary,
      firstSandboxProviderConnectorSummary:firstSandboxProviderConnectorSummary,
      providerCoverageDashboardSummary:providerCoverageDashboardSummary,
      readOnlySourceTrustScoreSummary:readOnlySourceTrustScoreSummary,
      pricePipelineOrchestratorSummary:{ status:"ready", officialPriceAnchorSummary:officialPriceAnchorSummary, coveredLowestCandidateBoardSummary:coveredLowestCandidateBoardSummary, redacted:true },
      coveredLowestCandidateBoardSummary:coveredLowestCandidateBoardSummary,
      jumpToPlatformHandoffPreviewSummary:jumpToPlatformHandoffPreviewSummary,
      officialPriceAnchorSummary:officialPriceAnchorSummary
    });
    const sandboxPriceCandidateResultBoardSummary = resolveSummary(safe, "sandboxPriceCandidateResultBoardSummary", "WeishanGlobalShoppingSandboxPriceCandidateResultBoard", "buildGlobalShoppingSandboxPriceCandidateResultBoard", {
      sandboxPriceCandidateSessionSummary:sandboxPriceCandidateSessionSummary,
      officialPriceAnchorSummary:officialPriceAnchorSummary,
      coveredLowestCandidateBoardSummary:coveredLowestCandidateBoardSummary,
      readOnlySourceTrustScoreSummary:readOnlySourceTrustScoreSummary,
      jumpToPlatformHandoffPreviewSummary:jumpToPlatformHandoffPreviewSummary,
      pricePipelineOrchestratorSummary:{ officialPriceAnchorSummary:officialPriceAnchorSummary, coveredLowestCandidateBoardSummary:coveredLowestCandidateBoardSummary, redacted:true }
    });
    const sandboxSessionReplayCenterSummary = resolveSummary(safe, "sandboxSessionReplayCenterSummary", "WeishanGlobalShoppingSandboxSessionReplayCenter", "buildGlobalShoppingSandboxSessionReplayCenter", {
      sandboxPriceCandidateSession:sandboxPriceCandidateSessionSummary,
      sandboxPriceCandidateResultBoard:sandboxPriceCandidateResultBoardSummary,
      firstSandboxProviderConnector:firstSandboxProviderConnectorSummary,
      providerCoverageDashboard:providerCoverageDashboardSummary,
      readOnlySourceTrustScore:readOnlySourceTrustScoreSummary,
      pricePipelineOrchestrator:{ status:"ready", officialPriceAnchorSummary:officialPriceAnchorSummary, coveredLowestCandidateBoardSummary:coveredLowestCandidateBoardSummary, redacted:true },
      coveredLowestCandidateBoard:coveredLowestCandidateBoardSummary,
      sandboxHandoffPreview:jumpToPlatformHandoffPreviewSummary,
      replayMode:"summary_only"
    });
    const providerEvidenceTraceSummary = resolveSummary(safe, "providerEvidenceTraceSummary", "WeishanGlobalShoppingProviderEvidenceTrace", "buildGlobalShoppingProviderEvidenceTrace", {
      sandboxSessionReplayCenter:sandboxSessionReplayCenterSummary,
      firstSandboxProviderConnector:firstSandboxProviderConnectorSummary,
      providerCoverageDashboard:providerCoverageDashboardSummary,
      readOnlySourceTrustScore:readOnlySourceTrustScoreSummary,
      dryRunProviderResponseNormalizer:dryRunResponseNormalizerSummary,
      pricePipelineOrchestrator:{ status:"ready", officialPriceAnchorSummary:officialPriceAnchorSummary, coveredLowestCandidateBoardSummary:coveredLowestCandidateBoardSummary, redacted:true },
      sandboxPriceCandidateResultBoard:sandboxPriceCandidateResultBoardSummary
    });
    const candidateConfidenceExplainerSummary = resolveSummary(safe, "candidateConfidenceExplainerSummary", "WeishanGlobalShoppingCandidateConfidenceExplainer", "buildGlobalShoppingCandidateConfidenceExplainer", {
      providerEvidenceTrace:providerEvidenceTraceSummary,
      readOnlySourceTrustScore:readOnlySourceTrustScoreSummary,
      sandboxPriceCandidateResultBoard:sandboxPriceCandidateResultBoardSummary,
      providerCoverageDashboard:providerCoverageDashboardSummary,
      normalizedPriceCandidateBoard:obj(safe.normalizedPriceCandidateBoardSummary || safe.normalizedPriceCandidateBoard),
      candidateItems:toArray(priceSourceNormalizationSummary.normalizedCandidates)
    });
    const sandboxReplayViewModelSummary = resolveSummary(safe, "sandboxReplayViewModelSummary", "WeishanGlobalShoppingSandboxReplayViewModel", "buildGlobalShoppingSandboxReplayViewModel", {
      sandboxSessionReplayCenter:sandboxSessionReplayCenterSummary,
      providerEvidenceTrace:providerEvidenceTraceSummary,
      candidateConfidenceExplainer:candidateConfidenceExplainerSummary,
      safeToProceedWithReadOnlySandboxUserExplanation:true
    });
    const sandboxCandidateComparisonWorkbenchSummary = resolveSummary(safe, "sandboxCandidateComparisonWorkbenchSummary", "WeishanGlobalShoppingSandboxCandidateComparisonWorkbench", "buildGlobalShoppingSandboxCandidateComparisonWorkbench", {
      sandboxPriceCandidateResultBoard:sandboxPriceCandidateResultBoardSummary,
      providerEvidenceTrace:providerEvidenceTraceSummary,
      candidateConfidenceExplainer:candidateConfidenceExplainerSummary,
      readOnlySourceTrustScore:readOnlySourceTrustScoreSummary,
      normalizedPriceCandidateBoard:obj(safe.normalizedPriceCandidateBoardSummary || safe.normalizedPriceCandidateBoard),
      candidateItems:toArray(priceSourceNormalizationSummary.normalizedCandidates)
    });
    const providerEvidenceComparisonMatrixSummary = resolveSummary(safe, "providerEvidenceComparisonMatrixSummary", "WeishanGlobalShoppingProviderEvidenceComparisonMatrix", "buildGlobalShoppingProviderEvidenceComparisonMatrix", {
      providerEvidenceTrace:providerEvidenceTraceSummary,
      sandboxCandidateComparisonWorkbench:sandboxCandidateComparisonWorkbenchSummary
    });
    const readOnlyHandoffReadinessDrillSummary = resolveSummary(safe, "readOnlyHandoffReadinessDrillSummary", "WeishanGlobalShoppingReadOnlyHandoffReadinessDrill", "buildGlobalShoppingReadOnlyHandoffReadinessDrill", {
      sandboxCandidateComparisonWorkbench:sandboxCandidateComparisonWorkbenchSummary,
      providerEvidenceComparisonMatrix:providerEvidenceComparisonMatrixSummary,
      parameterSource:{
        origin:"SHA",
        destination:"CTU",
        date:"2026-07-15",
        passengerCount:1,
        cabinClass:"economy",
        currency:"CNY",
        locale:"zh-CN",
        region:"CN"
      }
    });
    const sandboxDecisionReviewViewModelSummary = resolveSummary(safe, "sandboxDecisionReviewViewModelSummary", "WeishanGlobalShoppingSandboxDecisionReviewViewModel", "buildGlobalShoppingSandboxDecisionReviewViewModel", {
      sandboxCandidateComparisonWorkbench:sandboxCandidateComparisonWorkbenchSummary,
      providerEvidenceComparisonMatrix:providerEvidenceComparisonMatrixSummary,
      readOnlyHandoffReadinessDrill:readOnlyHandoffReadinessDrillSummary
    });
    const redactedSearchParameterPackSummary = resolveSummary(safe, "redactedSearchParameterPackSummary", "WeishanGlobalShoppingRedactedSearchParameterPack", "buildGlobalShoppingRedactedSearchParameterPack", {
      itemType:text(safe.itemType || "flight"),
      origin:text(safe.origin || "SHA"),
      destination:text(safe.destination || "CTU"),
      departureDate:text(safe.departureDate || "2026-07-15"),
      passengerCount:safe.passengerCount || 1,
      currency:text(safe.currency || "CNY"),
      locale:text(safe.locale || "zh-CN"),
      region:text(safe.region || "CN"),
      candidateId:text(obj(obj(sandboxCandidateComparisonWorkbenchSummary).recommendationSummary).recommendedCandidateId || "candidate_a"),
      sourceType:"sandbox"
    });
    const userConfirmationChecklistSummary = resolveSummary(safe, "userConfirmationChecklistSummary", "WeishanGlobalShoppingUserConfirmationChecklist", "buildGlobalShoppingUserConfirmationChecklist", {});
    const readOnlyPlatformHandoffSimulatorSummary = resolveSummary(safe, "readOnlyPlatformHandoffSimulatorSummary", "WeishanGlobalShoppingReadOnlyPlatformHandoffSimulator", "buildGlobalShoppingReadOnlyPlatformHandoffSimulator", {
      sandboxDecisionReviewViewModel:sandboxDecisionReviewViewModelSummary,
      sandboxCandidateComparisonWorkbench:sandboxCandidateComparisonWorkbenchSummary,
      providerEvidenceComparisonMatrix:providerEvidenceComparisonMatrixSummary,
      readOnlyHandoffReadinessDrill:readOnlyHandoffReadinessDrillSummary,
      redactedSearchParameterPackSummary:redactedSearchParameterPackSummary,
      userConfirmationChecklistSummary:userConfirmationChecklistSummary,
      itemType:text(safe.itemType || "flight"),
      origin:text(safe.origin || "SHA"),
      destination:text(safe.destination || "CTU"),
      departureDate:text(safe.departureDate || "2026-07-15"),
      passengerCount:safe.passengerCount || 1,
      currency:text(safe.currency || "CNY")
    });
    const platformHandoffSimulationViewModelSummary = resolveSummary(safe, "platformHandoffSimulationViewModelSummary", "WeishanGlobalShoppingPlatformHandoffSimulationViewModel", "buildGlobalShoppingPlatformHandoffSimulationViewModel", {
      readOnlyPlatformHandoffSimulatorSummary:readOnlyPlatformHandoffSimulatorSummary,
      redactedSearchParameterPackSummary:redactedSearchParameterPackSummary,
      userConfirmationChecklistSummary:userConfirmationChecklistSummary
    });
    const readOnlyHandoffPacketPreviewSummary = resolveSummary(safe, "readOnlyHandoffPacketPreviewSummary", "WeishanGlobalShoppingReadOnlyHandoffPacketPreview", "buildGlobalShoppingReadOnlyHandoffPacketPreview", {
      sandboxDecisionReviewViewModelSummary:sandboxDecisionReviewViewModelSummary,
      sandboxCandidateComparisonWorkbenchSummary:sandboxCandidateComparisonWorkbenchSummary,
      providerEvidenceComparisonMatrixSummary:providerEvidenceComparisonMatrixSummary,
      readOnlyHandoffReadinessDrillSummary:readOnlyHandoffReadinessDrillSummary,
      readOnlyPlatformHandoffSimulatorSummary:readOnlyPlatformHandoffSimulatorSummary,
      redactedSearchParameterPackSummary:redactedSearchParameterPackSummary,
      userConfirmationChecklistSummary:userConfirmationChecklistSummary
    });
    const platformPreflightSafetyGateSummary = resolveSummary(safe, "platformPreflightSafetyGateSummary", "WeishanGlobalShoppingPlatformPreflightSafetyGate", "buildGlobalShoppingPlatformPreflightSafetyGate", {
      readOnlyHandoffPacketPreviewSummary:readOnlyHandoffPacketPreviewSummary,
      redactedSearchParameterPackSummary:redactedSearchParameterPackSummary,
      userConfirmationChecklistSummary:userConfirmationChecklistSummary,
      sandboxDecisionReviewViewModelSummary:sandboxDecisionReviewViewModelSummary
    });
    const userActionBoundaryReceiptSummary = resolveSummary(safe, "userActionBoundaryReceiptSummary", "WeishanGlobalShoppingUserActionBoundaryReceipt", "buildGlobalShoppingUserActionBoundaryReceipt", {});
    const handoffPacketViewModelSummary = resolveSummary(safe, "handoffPacketViewModelSummary", "WeishanGlobalShoppingHandoffPacketViewModel", "buildGlobalShoppingHandoffPacketViewModel", {
      readOnlyHandoffPacketPreviewSummary:readOnlyHandoffPacketPreviewSummary,
      platformPreflightSafetyGateSummary:platformPreflightSafetyGateSummary,
      userActionBoundaryReceiptSummary:userActionBoundaryReceiptSummary
    });
    const manualPlatformReviewCockpitSummary = resolveSummary(safe, "manualPlatformReviewCockpitSummary", "WeishanGlobalShoppingManualPlatformReviewCockpit", "buildGlobalShoppingManualPlatformReviewCockpit", {
      handoffPacketViewModelSummary:handoffPacketViewModelSummary,
      platformHandoffSimulationViewModelSummary:platformHandoffSimulationViewModelSummary,
      readOnlyHandoffPacketPreviewSummary:readOnlyHandoffPacketPreviewSummary
    });
    const handoffAcceptanceWalkthroughSummary = resolveSummary(safe, "handoffAcceptanceWalkthroughSummary", "WeishanGlobalShoppingHandoffAcceptanceWalkthrough", "buildGlobalShoppingHandoffAcceptanceWalkthrough", {
      readOnlyHandoffPacketPreviewSummary:readOnlyHandoffPacketPreviewSummary,
      userActionBoundaryReceiptSummary:userActionBoundaryReceiptSummary,
      userConfirmationChecklistSummary:userConfirmationChecklistSummary
    });
    const platformRealityCheckBoardSummary = resolveSummary(safe, "platformRealityCheckBoardSummary", "WeishanGlobalShoppingPlatformRealityCheckBoard", "buildGlobalShoppingPlatformRealityCheckBoard", {
      platformPreflightSafetyGateSummary:platformPreflightSafetyGateSummary,
      userActionBoundaryReceiptSummary:userActionBoundaryReceiptSummary,
      readOnlyPlatformHandoffSimulatorSummary:readOnlyPlatformHandoffSimulatorSummary
    });
    const manualPlatformReviewViewModelSummary = resolveSummary(safe, "manualPlatformReviewViewModelSummary", "WeishanGlobalShoppingManualPlatformReviewViewModel", "buildGlobalShoppingManualPlatformReviewViewModel", {
      manualPlatformReviewCockpitSummary:manualPlatformReviewCockpitSummary,
      handoffAcceptanceWalkthroughSummary:handoffAcceptanceWalkthroughSummary,
      platformRealityCheckBoardSummary:platformRealityCheckBoardSummary
    });
    const userFacingManualReviewFlowSummary = resolveSummary(safe, "userFacingManualReviewFlowSummary", "WeishanGlobalShoppingUserFacingManualReviewFlow", "buildGlobalShoppingUserFacingManualReviewFlow", {
      manualPlatformReviewCockpitSummary:manualPlatformReviewCockpitSummary,
      handoffAcceptanceWalkthroughSummary:handoffAcceptanceWalkthroughSummary,
      platformRealityCheckBoardSummary:platformRealityCheckBoardSummary,
      handoffPacketViewModelSummary:handoffPacketViewModelSummary,
      platformPreflightSafetyGateSummary:platformPreflightSafetyGateSummary,
      userActionBoundaryReceiptSummary:userActionBoundaryReceiptSummary
    });
    const platformVerificationProgressTrackerSummary = resolveSummary(safe, "platformVerificationProgressTrackerSummary", "WeishanGlobalShoppingPlatformVerificationProgressTracker", "buildGlobalShoppingPlatformVerificationProgressTracker", safe);
    const safeNextActionPanelSummary = resolveSummary(safe, "safeNextActionPanelSummary", "WeishanGlobalShoppingSafeNextActionPanel", "buildGlobalShoppingSafeNextActionPanel", safe);
    const userManualReviewViewModelSummary = resolveSummary(safe, "userManualReviewViewModelSummary", "WeishanGlobalShoppingUserManualReviewViewModel", "buildGlobalShoppingUserManualReviewViewModel", {
      userFacingManualReviewFlowSummary:userFacingManualReviewFlowSummary,
      platformVerificationProgressTrackerSummary:platformVerificationProgressTrackerSummary,
      safeNextActionPanelSummary:safeNextActionPanelSummary
    });
    const manualPlatformVisitPreparationCenterSummary = resolveSummary(safe, "manualPlatformVisitPreparationCenterSummary", "WeishanGlobalShoppingManualPlatformVisitPreparationCenter", "buildGlobalShoppingManualPlatformVisitPreparationCenter", {
      userManualReviewViewModelSummary:userManualReviewViewModelSummary,
      userFacingManualReviewFlowSummary:userFacingManualReviewFlowSummary,
      platformVerificationProgressTrackerSummary:platformVerificationProgressTrackerSummary,
      safeNextActionPanelSummary:safeNextActionPanelSummary,
      platformRealityCheckBoardSummary:platformRealityCheckBoardSummary,
      manualPlatformReviewCockpitSummary:manualPlatformReviewCockpitSummary
    });
    const externalPlatformBoundaryBriefSummary = resolveSummary(safe, "externalPlatformBoundaryBriefSummary", "WeishanGlobalShoppingExternalPlatformBoundaryBrief", "buildGlobalShoppingExternalPlatformBoundaryBrief", safe);
    const finalUserSafetyChecklistSummary = resolveSummary(safe, "finalUserSafetyChecklistSummary", "WeishanGlobalShoppingFinalUserSafetyChecklist", "buildGlobalShoppingFinalUserSafetyChecklist", safe);
    const platformVisitPreparationViewModelSummary = resolveSummary(safe, "platformVisitPreparationViewModelSummary", "WeishanGlobalShoppingPlatformVisitPreparationViewModel", "buildGlobalShoppingPlatformVisitPreparationViewModel", {
      manualPlatformVisitPreparationCenterSummary:manualPlatformVisitPreparationCenterSummary,
      externalPlatformBoundaryBriefSummary:externalPlatformBoundaryBriefSummary,
      finalUserSafetyChecklistSummary:finalUserSafetyChecklistSummary
    });
    const externalPlatformExitRampPreviewSummary = resolveSummary(safe, "externalPlatformExitRampPreviewSummary", "WeishanGlobalShoppingExternalPlatformExitRampPreview", "buildGlobalShoppingExternalPlatformExitRampPreview", {
      manualPlatformVisitPreparationCenterSummary:manualPlatformVisitPreparationCenterSummary,
      externalPlatformBoundaryBriefSummary:externalPlatformBoundaryBriefSummary,
      finalUserSafetyChecklistSummary:finalUserSafetyChecklistSummary,
      platformVisitPreparationViewModelSummary:platformVisitPreparationViewModelSummary,
      userFacingManualReviewFlowSummary:userFacingManualReviewFlowSummary,
      platformVerificationProgressTrackerSummary:platformVerificationProgressTrackerSummary,
      safeNextActionPanelSummary:safeNextActionPanelSummary,
      userManualReviewViewModelSummary:userManualReviewViewModelSummary
    });
    const manualVisitSafetyBriefSummary = resolveSummary(safe, "manualVisitSafetyBriefSummary", "WeishanGlobalShoppingManualVisitSafetyBrief", "buildGlobalShoppingManualVisitSafetyBrief", safe);
    const readOnlySessionClosurePackSummary = resolveSummary(safe, "readOnlySessionClosurePackSummary", "WeishanGlobalShoppingReadOnlySessionClosurePack", "buildGlobalShoppingReadOnlySessionClosurePack", {
      externalPlatformExitRampPreviewSummary:externalPlatformExitRampPreviewSummary,
      manualVisitSafetyBriefSummary:manualVisitSafetyBriefSummary,
      platformVisitPreparationViewModelSummary:platformVisitPreparationViewModelSummary
    });
    const externalPlatformExitViewModelSummary = resolveSummary(safe, "externalPlatformExitViewModelSummary", "WeishanGlobalShoppingExternalPlatformExitViewModel", "buildGlobalShoppingExternalPlatformExitViewModel", {
      externalPlatformExitRampPreviewSummary:externalPlatformExitRampPreviewSummary,
      manualVisitSafetyBriefSummary:manualVisitSafetyBriefSummary,
      readOnlySessionClosurePackSummary:readOnlySessionClosurePackSummary
    });
    const jumpToPlatformBoundarySummary = resolveSummary(safe, "jumpToPlatformBoundarySummary", "WeishanGlobalShoppingJumpToPlatformBoundary", "buildGlobalShoppingJumpToPlatformBoundary", safe);
    const readOnlyCommerceSessionRecapCenterSummary = resolveSummary(safe, "readOnlyCommerceSessionRecapCenterSummary", "WeishanGlobalShoppingReadOnlyCommerceSessionRecapCenter", "buildGlobalShoppingReadOnlyCommerceSessionRecapCenter", {
      externalPlatformExitRampPreviewSummary:externalPlatformExitRampPreviewSummary,
      manualVisitSafetyBriefSummary:manualVisitSafetyBriefSummary,
      readOnlySessionClosurePackSummary:readOnlySessionClosurePackSummary,
      platformVisitPreparationViewModelSummary:platformVisitPreparationViewModelSummary,
      finalUserSafetyChecklistSummary:finalUserSafetyChecklistSummary,
      userFacingManualReviewFlowSummary:userFacingManualReviewFlowSummary,
      safeNextActionPanelSummary:safeNextActionPanelSummary,
      sandboxCandidateComparisonWorkbenchSummary:sandboxCandidateComparisonWorkbenchSummary,
      providerEvidenceComparisonMatrixSummary:providerEvidenceComparisonMatrixSummary,
      readOnlySourceTrustScoreSummary:readOnlySourceTrustScoreSummary,
      readOnlyHandoffPacketPreviewSummary:readOnlyHandoffPacketPreviewSummary,
      userActionBoundaryReceiptSummary:userActionBoundaryReceiptSummary
    });
    const userTrustClosureSummarySummary = resolveSummary(safe, "userTrustClosureSummarySummary", "WeishanGlobalShoppingUserTrustClosureSummary", "buildGlobalShoppingUserTrustClosureSummary", {});
    const safetyRegressionSentinelSummary = obj(safe.safetyRegressionSummary || safe.safetyRegressionSentinelSummary || { status:"pass", redacted:true });
    const nextFeatureReadinessGateSummary = resolveSummary(safe, "nextFeatureReadinessGateSummary", "WeishanGlobalShoppingNextFeatureReadinessGate", "buildGlobalShoppingNextFeatureReadinessGate", {
      readOnlyCommerceSessionRecapCenterSummary:readOnlyCommerceSessionRecapCenterSummary,
      userTrustClosureSummarySummary:userTrustClosureSummarySummary,
      readOnlySessionClosurePackSummary:readOnlySessionClosurePackSummary,
      externalPlatformExitRampPreviewSummary:externalPlatformExitRampPreviewSummary,
      finalUserSafetyChecklistSummary:finalUserSafetyChecklistSummary,
      safetyRegressionSentinelSummary:safetyRegressionSentinelSummary
    });
    const commerceSessionRecapViewModelSummary = resolveSummary(safe, "commerceSessionRecapViewModelSummary", "WeishanGlobalShoppingCommerceSessionRecapViewModel", "buildGlobalShoppingCommerceSessionRecapViewModel", {
      readOnlyCommerceSessionRecapCenterSummary:readOnlyCommerceSessionRecapCenterSummary,
      userTrustClosureSummarySummary:userTrustClosureSummarySummary,
      nextFeatureReadinessGateSummary:nextFeatureReadinessGateSummary
    });
    const readOnlySandboxProviderIntegrationBlueprintSummary = resolveSummary(safe, "readOnlySandboxProviderIntegrationBlueprintSummary", "WeishanGlobalShoppingReadOnlySandboxProviderIntegrationBlueprint", "buildGlobalShoppingReadOnlySandboxProviderIntegrationBlueprint", {
      nextFeatureReadinessGateSummary:nextFeatureReadinessGateSummary,
      commerceSessionRecapViewModelSummary:commerceSessionRecapViewModelSummary,
      userTrustClosureSummarySummary:userTrustClosureSummarySummary,
      safetyRegressionSentinelSummary:safetyRegressionSentinelSummary,
      providerAdapterRegistrySummary:providerAdapterRegistrySummary,
      firstSandboxProviderConnectorSummary:firstSandboxProviderConnectorSummary,
      providerSandboxDryRunHarnessSummary:providerSandboxDryRunHarnessSummary,
      providerSandboxSafetyKillSwitchSummary:providerSandboxSafetyKillSwitchSummary,
      providerCredentialSafetySummary:providerCredentialSafetySummary,
      readOnlySessionClosurePackSummary:readOnlySessionClosurePackSummary,
      jumpToPlatformBoundarySummary:jumpToPlatformBoundarySummary
    });
    const credentialIsolationReadinessBoardSummary = resolveSummary(safe, "credentialIsolationReadinessBoardSummary", "WeishanGlobalShoppingCredentialIsolationReadinessBoard", "buildGlobalShoppingCredentialIsolationReadinessBoard", safe);
    const providerContractSelectionBoardSummary = resolveSummary(safe, "providerContractSelectionBoardSummary", "WeishanGlobalShoppingProviderContractSelectionBoard", "buildGlobalShoppingProviderContractSelectionBoard", safe);
    const sandboxProviderPlanningViewModelSummary = resolveSummary(safe, "sandboxProviderPlanningViewModelSummary", "WeishanGlobalShoppingSandboxProviderPlanningViewModel", "buildGlobalShoppingSandboxProviderPlanningViewModel", {
      readOnlySandboxProviderIntegrationBlueprintSummary:readOnlySandboxProviderIntegrationBlueprintSummary,
      credentialIsolationReadinessBoardSummary:credentialIsolationReadinessBoardSummary,
      providerContractSelectionBoardSummary:providerContractSelectionBoardSummary
    });
    const providerLegalReviewDossierSummary = resolveSummary(safe, "providerLegalReviewDossierSummary", "WeishanGlobalShoppingProviderLegalReviewDossier", "buildGlobalShoppingProviderLegalReviewDossier", {
      providerContractSelectionBoardSummary:providerContractSelectionBoardSummary,
      readOnlySandboxProviderIntegrationBlueprintSummary:readOnlySandboxProviderIntegrationBlueprintSummary,
      nextFeatureReadinessGateSummary:nextFeatureReadinessGateSummary
    });
    const credentialVaultInterfaceStubSummary = resolveSummary(safe, "credentialVaultInterfaceStubSummary", "WeishanGlobalShoppingCredentialVaultInterfaceStub", "buildGlobalShoppingCredentialVaultInterfaceStub", {
      secretPersistenceGuardPass:safe.secretPersistenceGuardPass !== false
    });
    const sandboxAdapterContractTestbedSummary = resolveSummary(safe, "sandboxAdapterContractTestbedSummary", "WeishanGlobalShoppingSandboxAdapterContractTestbed", "buildGlobalShoppingSandboxAdapterContractTestbed", {
      providerRequestEnvelopeSummary:providerRequestEnvelopeSummary,
      sandboxProviderResponseContractSummary:sandboxProviderResponseContractSummary
    });
    const providerIntegrationPrepViewModelSummary = resolveSummary(safe, "providerIntegrationPrepViewModelSummary", "WeishanGlobalShoppingProviderIntegrationPrepViewModel", "buildGlobalShoppingProviderIntegrationPrepViewModel", {
      providerLegalReviewDossierSummary:providerLegalReviewDossierSummary,
      credentialVaultInterfaceStubSummary:credentialVaultInterfaceStubSummary,
      sandboxAdapterContractTestbedSummary:sandboxAdapterContractTestbedSummary
    });
    const sandboxProviderMockRuntimeSummary = resolveSummary(safe, "sandboxProviderMockRuntimeSummary", "WeishanGlobalShoppingSandboxProviderMockRuntime", "buildGlobalShoppingSandboxProviderMockRuntime", {
      providerLegalReviewDossierSummary:providerLegalReviewDossierSummary,
      credentialVaultInterfaceStubSummary:credentialVaultInterfaceStubSummary,
      sandboxAdapterContractTestbedSummary:sandboxAdapterContractTestbedSummary,
      providerIntegrationPrepViewModelSummary:providerIntegrationPrepViewModelSummary,
      credentialIsolationReadinessBoardSummary:credentialIsolationReadinessBoardSummary,
      providerContractSelectionBoardSummary:providerContractSelectionBoardSummary
    });
    const vaultBoundaryContractSummary = resolveSummary(safe, "vaultBoundaryContractSummary", "WeishanGlobalShoppingVaultBoundaryContract", "buildGlobalShoppingVaultBoundaryContract", {});
    const legalApprovalWorkflowBoardSummary = resolveSummary(safe, "legalApprovalWorkflowBoardSummary", "WeishanGlobalShoppingLegalApprovalWorkflowBoard", "buildGlobalShoppingLegalApprovalWorkflowBoard", {});
    const providerMockRuntimeViewModelSummary = resolveSummary(safe, "providerMockRuntimeViewModelSummary", "WeishanGlobalShoppingProviderMockRuntimeViewModel", "buildGlobalShoppingProviderMockRuntimeViewModel", {
      sandboxProviderMockRuntimeSummary:sandboxProviderMockRuntimeSummary,
      vaultBoundaryContractSummary:vaultBoundaryContractSummary,
      legalApprovalWorkflowBoardSummary:legalApprovalWorkflowBoardSummary
    });
    const mockProviderAdapterRegistryRuntimeSummary = resolveSummary(safe, "mockProviderAdapterRegistryRuntimeSummary", "WeishanGlobalShoppingMockProviderAdapterRegistryRuntime", "buildGlobalShoppingMockProviderAdapterRegistryRuntime", {
      sandboxProviderMockRuntimeSummary:sandboxProviderMockRuntimeSummary,
      sandboxAdapterContractTestbedSummary:sandboxAdapterContractTestbedSummary,
      providerMockRuntimeViewModelSummary:providerMockRuntimeViewModelSummary
    });
    const providerContractReplayHarnessSummary = resolveSummary(safe, "providerContractReplayHarnessSummary", "WeishanGlobalShoppingProviderContractReplayHarness", "buildGlobalShoppingProviderContractReplayHarness", {
      mockProviderAdapterRegistryRuntimeSummary:mockProviderAdapterRegistryRuntimeSummary,
      sandboxAdapterContractTestbedSummary:sandboxAdapterContractTestbedSummary,
      vaultBoundaryContractSummary:vaultBoundaryContractSummary
    });
    const providerLaunchReadinessBoardSummary = resolveSummary(safe, "providerLaunchReadinessBoardSummary", "WeishanGlobalShoppingProviderLaunchReadinessBoard", "buildGlobalShoppingProviderLaunchReadinessBoard", {
      mockProviderAdapterRegistryRuntimeSummary:mockProviderAdapterRegistryRuntimeSummary,
      providerContractReplayHarnessSummary:providerContractReplayHarnessSummary,
      legalApprovalWorkflowBoardSummary:legalApprovalWorkflowBoardSummary,
      vaultBoundaryContractSummary:vaultBoundaryContractSummary,
      providerLegalReviewDossierSummary:providerLegalReviewDossierSummary
    });
    const providerLaunchReadinessViewModelSummary = resolveSummary(safe, "providerLaunchReadinessViewModelSummary", "WeishanGlobalShoppingProviderLaunchReadinessViewModel", "buildGlobalShoppingProviderLaunchReadinessViewModel", {
      mockProviderAdapterRegistryRuntimeSummary:mockProviderAdapterRegistryRuntimeSummary,
      providerContractReplayHarnessSummary:providerContractReplayHarnessSummary,
      providerLaunchReadinessBoardSummary:providerLaunchReadinessBoardSummary
    });
    const humanApprovalSimulationGateSummary = resolveSummary(safe, "humanApprovalSimulationGateSummary", "WeishanGlobalShoppingHumanApprovalSimulationGate", "buildGlobalShoppingHumanApprovalSimulationGate", {
      providerLaunchReadinessBoardSummary:providerLaunchReadinessBoardSummary,
      legalApprovalWorkflowBoardSummary:legalApprovalWorkflowBoardSummary,
      providerContractReplayHarnessSummary:providerContractReplayHarnessSummary,
      vaultBoundaryContractSummary:vaultBoundaryContractSummary
    });
    const mockProviderLaunchDrillSummary = resolveSummary(safe, "mockProviderLaunchDrillSummary", "WeishanGlobalShoppingMockProviderLaunchDrill", "buildGlobalShoppingMockProviderLaunchDrill", {
      mockProviderAdapterRegistryRuntimeSummary:mockProviderAdapterRegistryRuntimeSummary,
      providerContractReplayHarnessSummary:providerContractReplayHarnessSummary,
      providerLaunchReadinessBoardSummary:providerLaunchReadinessBoardSummary,
      humanApprovalSimulationGateSummary:humanApprovalSimulationGateSummary
    });
    const sandboxProviderRollbackPlanSummary = resolveSummary(safe, "sandboxProviderRollbackPlanSummary", "WeishanGlobalShoppingSandboxProviderRollbackPlan", "buildGlobalShoppingSandboxProviderRollbackPlan", {
      mockProviderLaunchDrillSummary:mockProviderLaunchDrillSummary,
      providerLaunchReadinessBoardSummary:providerLaunchReadinessBoardSummary,
      safetyRegressionSummary:safe.safetyRegressionSummary || {}
    });
    const providerLaunchSimulationViewModelSummary = resolveSummary(safe, "providerLaunchSimulationViewModelSummary", "WeishanGlobalShoppingProviderLaunchSimulationViewModel", "buildGlobalShoppingProviderLaunchSimulationViewModel", {
      humanApprovalSimulationGateSummary:humanApprovalSimulationGateSummary,
      mockProviderLaunchDrillSummary:mockProviderLaunchDrillSummary,
      sandboxProviderRollbackPlanSummary:sandboxProviderRollbackPlanSummary
    });
    const providerSandboxPilotControlRoomSummary = resolveSummary(safe, "providerSandboxPilotControlRoomSummary", "WeishanGlobalShoppingProviderSandboxPilotControlRoom", "buildGlobalShoppingProviderSandboxPilotControlRoom", {
      humanApprovalSimulationGateSummary:humanApprovalSimulationGateSummary,
      mockProviderLaunchDrillSummary:mockProviderLaunchDrillSummary,
      sandboxProviderRollbackPlanSummary:sandboxProviderRollbackPlanSummary,
      providerLaunchSimulationViewModelSummary:providerLaunchSimulationViewModelSummary,
      providerLaunchReadinessBoardSummary:providerLaunchReadinessBoardSummary,
      providerContractReplayHarnessSummary:providerContractReplayHarnessSummary,
      mockProviderAdapterRegistryRuntimeSummary:mockProviderAdapterRegistryRuntimeSummary
    });
    const mockProviderIncidentDrillSummary = resolveSummary(safe, "mockProviderIncidentDrillSummary", "WeishanGlobalShoppingMockProviderIncidentDrill", "buildGlobalShoppingMockProviderIncidentDrill", {
      providerSandboxPilotControlRoomSummary:providerSandboxPilotControlRoomSummary,
      mockProviderLaunchDrillSummary:mockProviderLaunchDrillSummary,
      sandboxProviderRollbackPlanSummary:sandboxProviderRollbackPlanSummary,
      safetyRegressionSummary:safe.safetyRegressionSummary || {}
    });
    const productionBlockerMatrixSummary = resolveSummary(safe, "productionBlockerMatrixSummary", "WeishanGlobalShoppingProductionBlockerMatrix", "buildGlobalShoppingProductionBlockerMatrix", {
      providerSandboxPilotControlRoomSummary:providerSandboxPilotControlRoomSummary,
      mockProviderIncidentDrillSummary:mockProviderIncidentDrillSummary,
      providerLaunchReadinessBoardSummary:providerLaunchReadinessBoardSummary,
      credentialVaultInterfaceStubSummary:credentialVaultInterfaceStubSummary,
      providerLegalReviewDossierSummary:providerLegalReviewDossierSummary,
      safetyRegressionSummary:safe.safetyRegressionSummary || {}
    });
    const providerPilotControlViewModelSummary = resolveSummary(safe, "providerPilotControlViewModelSummary", "WeishanGlobalShoppingProviderPilotControlViewModel", "buildGlobalShoppingProviderPilotControlViewModel", {
      providerSandboxPilotControlRoomSummary:providerSandboxPilotControlRoomSummary,
      mockProviderIncidentDrillSummary:mockProviderIncidentDrillSummary,
      productionBlockerMatrixSummary:productionBlockerMatrixSummary
    });
    const pipelineHealth = {
      firstSandboxProviderConnectorReady:statusOf(firstSandboxProviderConnectorSummary) === "ready",
      providerCoverageReady:statusOf(providerCoverageDashboardSummary) === "ready",
      sourceTrustReady:statusOf(readOnlySourceTrustScoreSummary) === "ready",
      providerCoverageViewModelReady:statusOf(providerCoverageViewModelSummary) === "ready",
      readOnlyProviderSandboxIntegrationGateReady:statusOf(readOnlyProviderSandboxIntegrationGateSummary) === "ready",
      sandboxPriceCandidateSessionReady:statusOf(sandboxPriceCandidateSessionSummary) === "ready",
      sandboxPriceCandidateResultBoardReady:statusOf(sandboxPriceCandidateResultBoardSummary) === "ready",
      sandboxSessionReplayCenterReady:statusOf(sandboxSessionReplayCenterSummary) === "ready",
      providerEvidenceTraceReady:statusOf(providerEvidenceTraceSummary) === "ready",
      candidateConfidenceReady:statusOf(candidateConfidenceExplainerSummary) === "ready",
      sandboxReplayViewModelReady:statusOf(sandboxReplayViewModelSummary) === "ready",
      sandboxCandidateComparisonReady:statusOf(sandboxCandidateComparisonWorkbenchSummary) === "ready",
      providerEvidenceMatrixReady:statusOf(providerEvidenceComparisonMatrixSummary) === "ready",
      readOnlyHandoffDrillReady:statusOf(readOnlyHandoffReadinessDrillSummary) === "ready",
      sandboxDecisionReviewReady:statusOf(sandboxDecisionReviewViewModelSummary) === "ready",
      redactedSearchParameterPackReady:statusOf(redactedSearchParameterPackSummary) === "ready",
      userConfirmationChecklistReady:statusOf(userConfirmationChecklistSummary) === "ready",
      readOnlyPlatformHandoffSimulatorReady:statusOf(readOnlyPlatformHandoffSimulatorSummary) === "ready",
      platformHandoffSimulationViewModelReady:statusOf(platformHandoffSimulationViewModelSummary) === "ready",
      readOnlyHandoffPacketPreviewReady:statusOf(readOnlyHandoffPacketPreviewSummary) === "ready",
      platformPreflightSafetyGateReady:statusOf(platformPreflightSafetyGateSummary) === "clear",
      userActionBoundaryReceiptReady:statusOf(userActionBoundaryReceiptSummary) === "ready",
      handoffPacketViewModelReady:statusOf(handoffPacketViewModelSummary) === "ready",
      manualPlatformReviewCockpitReady:statusOf(manualPlatformReviewCockpitSummary) === "ready",
      handoffAcceptanceWalkthroughReady:statusOf(handoffAcceptanceWalkthroughSummary) === "ready",
      platformRealityCheckReady:statusOf(platformRealityCheckBoardSummary) === "ready",
      manualPlatformReviewViewModelReady:statusOf(manualPlatformReviewViewModelSummary) === "ready",
      userFacingManualReviewFlowReady:statusOf(userFacingManualReviewFlowSummary) === "ready",
      platformVerificationProgressTrackerReady:statusOf(platformVerificationProgressTrackerSummary) === "ready",
      safeNextActionPanelReady:statusOf(safeNextActionPanelSummary) === "ready",
      userManualReviewViewModelReady:statusOf(userManualReviewViewModelSummary) === "ready",
      manualPlatformVisitPreparationCenterReady:statusOf(manualPlatformVisitPreparationCenterSummary) === "ready",
      externalPlatformBoundaryBriefReady:statusOf(externalPlatformBoundaryBriefSummary) === "ready",
      finalUserSafetyChecklistReady:statusOf(finalUserSafetyChecklistSummary) === "ready",
      platformVisitPreparationViewModelReady:statusOf(platformVisitPreparationViewModelSummary) === "ready",
      externalPlatformExitRampPreviewReady:statusOf(externalPlatformExitRampPreviewSummary) === "ready",
      manualVisitSafetyBriefReady:statusOf(manualVisitSafetyBriefSummary) === "ready",
      readOnlySessionClosurePackReady:statusOf(readOnlySessionClosurePackSummary) === "ready",
      externalPlatformExitViewModelReady:statusOf(externalPlatformExitViewModelSummary) === "ready",
      readOnlyCommerceSessionRecapCenterReady:statusOf(readOnlyCommerceSessionRecapCenterSummary) === "ready",
      userTrustClosureSummaryReady:statusOf(userTrustClosureSummarySummary) === "ready",
      nextFeatureReadinessGateReady:statusOf(nextFeatureReadinessGateSummary) === "ready",
      commerceSessionRecapViewModelReady:statusOf(commerceSessionRecapViewModelSummary) === "ready",
      readOnlySandboxProviderIntegrationBlueprintReady:statusOf(readOnlySandboxProviderIntegrationBlueprintSummary) === "ready",
      credentialIsolationReadinessReady:statusOf(credentialIsolationReadinessBoardSummary) === "ready",
      providerContractSelectionReady:statusOf(providerContractSelectionBoardSummary) === "ready",
      sandboxProviderPlanningViewModelReady:statusOf(sandboxProviderPlanningViewModelSummary) === "ready",
      providerLegalReviewDossierReady:statusOf(providerLegalReviewDossierSummary) === "ready",
      credentialVaultInterfaceReady:statusOf(credentialVaultInterfaceStubSummary) === "ready",
      sandboxAdapterContractTestbedReady:statusOf(sandboxAdapterContractTestbedSummary) === "ready",
      providerIntegrationPrepViewModelReady:statusOf(providerIntegrationPrepViewModelSummary) === "ready",
      sandboxProviderMockRuntimeReady:statusOf(sandboxProviderMockRuntimeSummary) === "ready",
      vaultBoundaryContractReady:statusOf(vaultBoundaryContractSummary) === "ready",
      legalApprovalWorkflowReady:statusOf(legalApprovalWorkflowBoardSummary) === "ready",
      providerMockRuntimeViewModelReady:statusOf(providerMockRuntimeViewModelSummary) === "ready",
      mockProviderAdapterRegistryRuntimeReady:statusOf(mockProviderAdapterRegistryRuntimeSummary) === "ready",
      providerContractReplayHarnessReady:statusOf(providerContractReplayHarnessSummary) === "ready",
      providerLaunchReadinessBoardReady:statusOf(providerLaunchReadinessBoardSummary) === "ready",
      providerLaunchReadinessViewModelReady:statusOf(providerLaunchReadinessViewModelSummary) === "ready",
      humanApprovalSimulationGateReady:statusOf(humanApprovalSimulationGateSummary) === "ready",
      mockProviderLaunchDrillReady:statusOf(mockProviderLaunchDrillSummary) === "ready",
      sandboxProviderRollbackPlanReady:statusOf(sandboxProviderRollbackPlanSummary) === "ready",
      providerLaunchSimulationViewModelReady:statusOf(providerLaunchSimulationViewModelSummary) === "ready",
      providerSandboxPilotControlRoomReady:statusOf(providerSandboxPilotControlRoomSummary) === "ready",
      mockProviderIncidentDrillReady:statusOf(mockProviderIncidentDrillSummary) === "ready",
      productionBlockerMatrixReady:statusOf(productionBlockerMatrixSummary) === "ready",
      providerPilotControlViewModelReady:statusOf(providerPilotControlViewModelSummary) === "ready",
      providerConnectorReady:statusOf(readOnlyProviderSandboxConnectorSummary) === "ready",
      fixtureReplayReady:statusOf(fixtureReplayConsoleSummary) === "ready",
      providerFixtureReady:statusOf(legalProviderFixtureSummary) === "ready",
      credentialSafetyPass:statusOf(providerCredentialSafetySummary) === "ready",
      sandboxFeedReady:statusOf(sandboxPriceFeedSummary) === "ready",
      responseContractReady:statusOf(sandboxProviderResponseContractSummary) === "ready",
      priceNormalizationReady:hasPriceSourceNormalizationInput && statusOf(priceSourceNormalizationSummary) === "ready",
      officialAnchorReady:statusOf(officialPriceAnchorSummary) === "anchored" || statusOf(officialPriceAnchorSummary) === "ready",
      sameItemMatcherReady:statusOf(sameItemMatcherSummary) === "ready",
      duplicateMergeReady:statusOf(duplicateCandidateMergerSummary) === "merged" || statusOf(duplicateCandidateMergerSummary) === "ready",
      coveredLowestReady:statusOf(coveredLowestCandidateBoardSummary) === "ready",
      realProviderSandboxGateReady:statusOf(realProviderSandboxGateSummary) === "ready",
      providerRequestEnvelopeReady:statusOf(providerRequestEnvelopeSummary) === "ready",
      providerCallAuditLedgerReady:statusOf(providerCallAuditLedgerSummary) === "ready",
      providerSandboxReadinessReady:statusOf(providerSandboxReadinessViewModelSummary) === "ready",
      providerSandboxDryRunReady:statusOf(providerSandboxDryRunHarnessSummary) === "ready",
      providerAdapterShellReady:statusOf(firstReadOnlyProviderAdapterShellSummary) === "ready",
      providerKillSwitchClear:statusOf(providerSandboxSafetyKillSwitchSummary) === "clear",
      providerSandboxDryRunViewModelReady:statusOf(providerSandboxDryRunViewModelSummary) === "ready",
      sandboxHandoffReady:statusOf(sandboxHandoffViewModelSummary) === "ready",
      noRealProvider:safe.realProviderEnabled !== true && safe.productionProviderEnabled !== true && safe.noRealProvider !== false,
      noNetwork:safe.networkEnabled !== true && safe.noNetwork !== false,
      noRawResponsePersistence:obj(sandboxProviderResponseContractSummary.responseHealth).noRawResponsePersistence !== false,
      credentialBoundarySafe:obj(sandboxProviderResponseContractSummary.responseHealth).noRealApiKey !== false,
      noTransactionUrl:obj(sandboxProviderResponseContractSummary.responseHealth).noTransactionUrl !== false,
      noPayment:obj(sandboxProviderResponseContractSummary.responseHealth).noPayment !== false,
      noOrder:safe.order !== true,
      noTicketing:obj(sandboxProviderResponseContractSummary.responseHealth).noTicketing !== false,
      noExternalOpen:safe.openExternal !== true && safe.autoOpen !== true
    };
    const blockedReasons = [];
    if (statusOf(readOnlyProviderSandboxConnectorSummary) === "blocked") blockedReasons.push("provider_connector_blocked");
    if (statusOf(fixtureReplayConsoleSummary) === "blocked") blockedReasons.push("fixture_replay_blocked");
    if (!pipelineHealth.noRealProvider) blockedReasons.push("real_provider_detected");
    if (!pipelineHealth.noNetwork) blockedReasons.push("network_detected");
    if (!pipelineHealth.noRawResponsePersistence) blockedReasons.push("raw_response_persistence_detected");
    if (!pipelineHealth.credentialBoundarySafe) blockedReasons.push("credential_risk_detected");
    if (!pipelineHealth.noTransactionUrl) blockedReasons.push("transaction_url_detected");
    if (!pipelineHealth.noPayment) blockedReasons.push("payment_detected");
    if (!pipelineHealth.noOrder) blockedReasons.push("order_detected");
    if (!pipelineHealth.noTicketing) blockedReasons.push("ticketing_detected");
    if (!pipelineHealth.noExternalOpen) blockedReasons.push("external_open_detected");
    if (statusOf(providerSandboxSafetyKillSwitchSummary) === "blocked") blockedReasons.push("provider_kill_switch_blocked");
    if (hasSummaryInput(safe, "providerLegalReviewDossierSummary") && statusOf(providerLegalReviewDossierSummary) === "blocked") blockedReasons.push("provider_legal_review_blocked");
    if (hasSummaryInput(safe, "credentialVaultInterfaceStubSummary") && statusOf(credentialVaultInterfaceStubSummary) === "blocked") blockedReasons.push("credential_vault_interface_blocked");
    if (hasSummaryInput(safe, "sandboxAdapterContractTestbedSummary") && statusOf(sandboxAdapterContractTestbedSummary) === "blocked") blockedReasons.push("sandbox_adapter_contract_blocked");
    if (hasSummaryInput(safe, "providerIntegrationPrepViewModelSummary") && statusOf(providerIntegrationPrepViewModelSummary) === "blocked") blockedReasons.push("provider_integration_prep_blocked");
    if (hasSummaryInput(safe, "sandboxProviderMockRuntimeSummary") && statusOf(sandboxProviderMockRuntimeSummary) === "blocked") blockedReasons.push("sandbox_provider_mock_runtime_blocked");
    if (hasSummaryInput(safe, "vaultBoundaryContractSummary") && statusOf(vaultBoundaryContractSummary) === "blocked") blockedReasons.push("vault_boundary_contract_blocked");
    if (hasSummaryInput(safe, "legalApprovalWorkflowBoardSummary") && statusOf(legalApprovalWorkflowBoardSummary) === "blocked") blockedReasons.push("legal_approval_workflow_blocked");
    if (hasSummaryInput(safe, "providerMockRuntimeViewModelSummary") && statusOf(providerMockRuntimeViewModelSummary) === "blocked") blockedReasons.push("provider_mock_runtime_view_model_blocked");
    if (hasSummaryInput(safe, "mockProviderAdapterRegistryRuntimeSummary") && statusOf(mockProviderAdapterRegistryRuntimeSummary) === "blocked") blockedReasons.push("mock_provider_adapter_registry_runtime_blocked");
    if (hasSummaryInput(safe, "providerContractReplayHarnessSummary") && statusOf(providerContractReplayHarnessSummary) === "blocked") blockedReasons.push("provider_contract_replay_harness_blocked");
    if (hasSummaryInput(safe, "providerLaunchReadinessBoardSummary") && statusOf(providerLaunchReadinessBoardSummary) === "blocked") blockedReasons.push("provider_launch_readiness_board_blocked");
    if (hasSummaryInput(safe, "providerLaunchReadinessViewModelSummary") && statusOf(providerLaunchReadinessViewModelSummary) === "blocked") blockedReasons.push("provider_launch_readiness_view_model_blocked");
    if (hasSummaryInput(safe, "humanApprovalSimulationGateSummary") && statusOf(humanApprovalSimulationGateSummary) === "blocked") blockedReasons.push("human_approval_simulation_gate_blocked");
    if (hasSummaryInput(safe, "mockProviderLaunchDrillSummary") && statusOf(mockProviderLaunchDrillSummary) === "blocked") blockedReasons.push("mock_provider_launch_drill_blocked");
    if (hasSummaryInput(safe, "sandboxProviderRollbackPlanSummary") && statusOf(sandboxProviderRollbackPlanSummary) === "blocked") blockedReasons.push("sandbox_provider_rollback_plan_blocked");
    if (hasSummaryInput(safe, "providerLaunchSimulationViewModelSummary") && statusOf(providerLaunchSimulationViewModelSummary) === "blocked") blockedReasons.push("provider_launch_simulation_view_model_blocked");
    if (hasSummaryInput(safe, "providerSandboxPilotControlRoomSummary") && statusOf(providerSandboxPilotControlRoomSummary) === "blocked") blockedReasons.push("provider_sandbox_pilot_control_room_blocked");
    if (hasSummaryInput(safe, "mockProviderIncidentDrillSummary") && statusOf(mockProviderIncidentDrillSummary) === "blocked") blockedReasons.push("mock_provider_incident_drill_blocked");
    if (hasSummaryInput(safe, "productionBlockerMatrixSummary") && statusOf(productionBlockerMatrixSummary) === "blocked") blockedReasons.push("production_blocker_matrix_blocked");
    if (hasSummaryInput(safe, "providerPilotControlViewModelSummary") && statusOf(providerPilotControlViewModelSummary) === "blocked") blockedReasons.push("provider_pilot_control_view_model_blocked");
    const review = !pipelineHealth.providerConnectorReady || !pipelineHealth.fixtureReplayReady || !pipelineHealth.providerFixtureReady || !pipelineHealth.credentialSafetyPass || !pipelineHealth.sandboxFeedReady || !pipelineHealth.responseContractReady || !pipelineHealth.priceNormalizationReady || !pipelineHealth.officialAnchorReady || !pipelineHealth.sameItemMatcherReady || !pipelineHealth.duplicateMergeReady || !pipelineHealth.coveredLowestReady || !pipelineHealth.sandboxHandoffReady || !pipelineHealth.readOnlyProviderSandboxIntegrationGateReady || !pipelineHealth.sandboxPriceCandidateSessionReady || !pipelineHealth.sandboxPriceCandidateResultBoardReady || !pipelineHealth.sandboxSessionReplayCenterReady || !pipelineHealth.providerEvidenceTraceReady || !pipelineHealth.candidateConfidenceReady || !pipelineHealth.sandboxReplayViewModelReady || !pipelineHealth.sandboxCandidateComparisonReady || !pipelineHealth.providerEvidenceMatrixReady || !pipelineHealth.readOnlyHandoffDrillReady || !pipelineHealth.sandboxDecisionReviewReady || !pipelineHealth.redactedSearchParameterPackReady || !pipelineHealth.userConfirmationChecklistReady || !pipelineHealth.readOnlyPlatformHandoffSimulatorReady || !pipelineHealth.platformHandoffSimulationViewModelReady || !pipelineHealth.readOnlyHandoffPacketPreviewReady || !pipelineHealth.platformPreflightSafetyGateReady || !pipelineHealth.userActionBoundaryReceiptReady || !pipelineHealth.handoffPacketViewModelReady || !pipelineHealth.manualPlatformReviewCockpitReady || !pipelineHealth.handoffAcceptanceWalkthroughReady || !pipelineHealth.platformRealityCheckReady || !pipelineHealth.manualPlatformReviewViewModelReady || !pipelineHealth.userFacingManualReviewFlowReady || !pipelineHealth.platformVerificationProgressTrackerReady || !pipelineHealth.safeNextActionPanelReady || !pipelineHealth.userManualReviewViewModelReady || !pipelineHealth.manualPlatformVisitPreparationCenterReady || !pipelineHealth.externalPlatformBoundaryBriefReady || !pipelineHealth.finalUserSafetyChecklistReady || !pipelineHealth.platformVisitPreparationViewModelReady || !pipelineHealth.externalPlatformExitRampPreviewReady || !pipelineHealth.manualVisitSafetyBriefReady || !pipelineHealth.readOnlySessionClosurePackReady || !pipelineHealth.externalPlatformExitViewModelReady || !pipelineHealth.providerLegalReviewDossierReady || !pipelineHealth.credentialVaultInterfaceReady || !pipelineHealth.sandboxAdapterContractTestbedReady || !pipelineHealth.providerIntegrationPrepViewModelReady || !pipelineHealth.sandboxProviderMockRuntimeReady || !pipelineHealth.vaultBoundaryContractReady || !pipelineHealth.legalApprovalWorkflowReady || !pipelineHealth.providerMockRuntimeViewModelReady || !pipelineHealth.mockProviderAdapterRegistryRuntimeReady || !pipelineHealth.providerContractReplayHarnessReady || !pipelineHealth.providerLaunchReadinessBoardReady || !pipelineHealth.providerLaunchReadinessViewModelReady || !pipelineHealth.humanApprovalSimulationGateReady || !pipelineHealth.mockProviderLaunchDrillReady || !pipelineHealth.sandboxProviderRollbackPlanReady || !pipelineHealth.providerLaunchSimulationViewModelReady || !pipelineHealth.providerSandboxPilotControlRoomReady || !pipelineHealth.mockProviderIncidentDrillReady || !pipelineHealth.productionBlockerMatrixReady || !pipelineHealth.providerPilotControlViewModelReady;
    return clone({
      pipelineHealth:pipelineHealth,
      pipelineStages:buildGlobalShoppingPricePipelineRows({
        legalProviderFixtureSummary:legalProviderFixtureSummary,
        providerCredentialSafetySummary:providerCredentialSafetySummary,
        sandboxPriceFeedSummary:sandboxPriceFeedSummary,
        sandboxProviderResponseContractSummary:sandboxProviderResponseContractSummary,
        readOnlyProviderSandboxConnectorSummary:readOnlyProviderSandboxConnectorSummary,
        fixtureReplayConsoleSummary:fixtureReplayConsoleSummary,
        priceSourceNormalizationSummary:priceSourceNormalizationSummary,
        officialPriceAnchorSummary:officialPriceAnchorSummary,
        sameItemMatcherSummary:sameItemMatcherSummary,
        duplicateCandidateMergerSummary:duplicateCandidateMergerSummary,
        coveredLowestCandidateBoardSummary:coveredLowestCandidateBoardSummary,
        sandboxHandoffViewModelSummary:sandboxHandoffViewModelSummary
      }),
      readyOutputs:{
        canShowFixtureCandidatePrices:pipelineHealth.responseContractReady && pipelineHealth.priceNormalizationReady,
        canShowFixtureReplay:pipelineHealth.fixtureReplayReady,
        canShowOfficialAnchor:pipelineHealth.officialAnchorReady,
        canShowCoveredLowestCandidate:pipelineHealth.coveredLowestReady,
        canShowSandboxHandoffPreview:pipelineHealth.sandboxHandoffReady,
        canShowProviderSandboxReadiness:pipelineHealth.providerSandboxReadinessReady,
        canShowProviderSandboxDryRun:pipelineHealth.providerSandboxDryRunReady && pipelineHealth.providerAdapterShellReady && pipelineHealth.providerKillSwitchClear && pipelineHealth.providerSandboxDryRunViewModelReady,
        canShowReadOnlyProviderSandboxIntegrationGate:pipelineHealth.readOnlyProviderSandboxIntegrationGateReady,
        canShowSandboxPriceCandidateSession:pipelineHealth.sandboxPriceCandidateSessionReady,
        canShowSandboxPriceCandidateResultBoard:pipelineHealth.sandboxPriceCandidateResultBoardReady,
        canShowSandboxSessionReplayCenter:pipelineHealth.sandboxSessionReplayCenterReady,
        canShowProviderEvidenceTrace:pipelineHealth.providerEvidenceTraceReady,
        canShowCandidateConfidenceExplainer:pipelineHealth.candidateConfidenceReady,
        canShowSandboxReplayViewModel:pipelineHealth.sandboxReplayViewModelReady,
        canShowSandboxCandidateComparisonWorkbench:pipelineHealth.sandboxCandidateComparisonReady,
        canShowProviderEvidenceComparisonMatrix:pipelineHealth.providerEvidenceMatrixReady,
        canShowReadOnlyHandoffReadinessDrill:pipelineHealth.readOnlyHandoffDrillReady,
        canShowSandboxDecisionReviewViewModel:pipelineHealth.sandboxDecisionReviewReady,
        canShowReadOnlyPlatformHandoffSimulator:pipelineHealth.readOnlyPlatformHandoffSimulatorReady,
        canShowRedactedSearchParameterPack:pipelineHealth.redactedSearchParameterPackReady,
        canShowUserConfirmationChecklist:pipelineHealth.userConfirmationChecklistReady,
        canShowPlatformHandoffSimulationViewModel:pipelineHealth.platformHandoffSimulationViewModelReady,
        canShowReadOnlyHandoffPacketPreview:pipelineHealth.readOnlyHandoffPacketPreviewReady,
        canShowPlatformPreflightSafetyGate:pipelineHealth.platformPreflightSafetyGateReady,
        canShowUserActionBoundaryReceipt:pipelineHealth.userActionBoundaryReceiptReady,
        canShowHandoffPacketViewModel:pipelineHealth.handoffPacketViewModelReady,
        canShowManualPlatformReviewCockpit:pipelineHealth.manualPlatformReviewCockpitReady,
        canShowHandoffAcceptanceWalkthrough:pipelineHealth.handoffAcceptanceWalkthroughReady,
        canShowPlatformRealityCheckBoard:pipelineHealth.platformRealityCheckReady,
        canShowManualPlatformReviewViewModel:pipelineHealth.manualPlatformReviewViewModelReady,
        canShowUserFacingManualReviewFlow:pipelineHealth.userFacingManualReviewFlowReady,
        canShowPlatformVerificationProgressTracker:pipelineHealth.platformVerificationProgressTrackerReady,
        canShowSafeNextActionPanel:pipelineHealth.safeNextActionPanelReady,
        canShowUserManualReviewViewModel:pipelineHealth.userManualReviewViewModelReady,
        canShowManualPlatformVisitPreparationCenter:pipelineHealth.manualPlatformVisitPreparationCenterReady,
        canShowExternalPlatformBoundaryBrief:pipelineHealth.externalPlatformBoundaryBriefReady,
        canShowFinalUserSafetyChecklist:pipelineHealth.finalUserSafetyChecklistReady,
        canShowPlatformVisitPreparationViewModel:pipelineHealth.platformVisitPreparationViewModelReady,
        canShowExternalPlatformExitRampPreview:pipelineHealth.externalPlatformExitRampPreviewReady,
        canShowManualVisitSafetyBrief:pipelineHealth.manualVisitSafetyBriefReady,
        canShowReadOnlySessionClosurePack:pipelineHealth.readOnlySessionClosurePackReady,
        canShowExternalPlatformExitViewModel:pipelineHealth.externalPlatformExitViewModelReady,
        canProceedToReadOnlyProviderSandbox:pipelineHealth.providerConnectorReady && pipelineHealth.fixtureReplayReady && pipelineHealth.providerFixtureReady && pipelineHealth.credentialSafetyPass && pipelineHealth.sandboxFeedReady && pipelineHealth.responseContractReady && pipelineHealth.priceNormalizationReady && pipelineHealth.officialAnchorReady && pipelineHealth.sameItemMatcherReady && pipelineHealth.duplicateMergeReady && pipelineHealth.coveredLowestReady && pipelineHealth.sandboxHandoffReady,
        safeToProceedWithFirstRealReadOnlyProviderSandbox:pipelineHealth.providerConnectorReady && pipelineHealth.fixtureReplayReady && pipelineHealth.responseContractReady && pipelineHealth.priceNormalizationReady && pipelineHealth.coveredLowestReady,
        safeToProceedWithFirstReadOnlySandboxDryRun:pipelineHealth.realProviderSandboxGateReady && pipelineHealth.providerRequestEnvelopeReady && pipelineHealth.providerCallAuditLedgerReady && pipelineHealth.providerSandboxReadinessReady,
        safeToProceedWithFirstProviderSandboxFixtureDryRun:pipelineHealth.providerSandboxDryRunReady && pipelineHealth.providerAdapterShellReady && pipelineHealth.providerKillSwitchClear && pipelineHealth.providerSandboxDryRunViewModelReady,
        safeToProceedWithFirstSandboxProviderConnectorImplementation:pipelineHealth.firstSandboxProviderConnectorReady && pipelineHealth.providerCoverageReady && pipelineHealth.sourceTrustReady,
        safeToProceedWithFirstReadOnlyProviderSandboxIntegration:pipelineHealth.firstSandboxProviderConnectorReady && pipelineHealth.providerCoverageReady && pipelineHealth.sourceTrustReady && pipelineHealth.providerCoverageViewModelReady,
        safeToProceedWithSandboxCandidateUserPreview:pipelineHealth.readOnlyProviderSandboxIntegrationGateReady && pipelineHealth.sandboxPriceCandidateSessionReady && pipelineHealth.sandboxPriceCandidateResultBoardReady,
        safeToProceedWithReadOnlySandboxUserExplanation:pipelineHealth.sandboxSessionReplayCenterReady && pipelineHealth.providerEvidenceTraceReady && pipelineHealth.candidateConfidenceReady && pipelineHealth.sandboxReplayViewModelReady,
        safeToProceedWithSandboxDecisionReview:pipelineHealth.sandboxCandidateComparisonReady && pipelineHealth.providerEvidenceMatrixReady && pipelineHealth.readOnlyHandoffDrillReady && pipelineHealth.sandboxDecisionReviewReady,
        safeToProceedWithUserFacingHandoffExplanation:pipelineHealth.sandboxDecisionReviewReady && pipelineHealth.redactedSearchParameterPackReady && pipelineHealth.userConfirmationChecklistReady && pipelineHealth.readOnlyPlatformHandoffSimulatorReady && pipelineHealth.platformHandoffSimulationViewModelReady,
        safeToProceedWithManualPlatformReview:pipelineHealth.readOnlyHandoffPacketPreviewReady && pipelineHealth.platformPreflightSafetyGateReady && pipelineHealth.userActionBoundaryReceiptReady && pipelineHealth.handoffPacketViewModelReady,
        safeToProceedWithManualPlatformUserEducation:pipelineHealth.manualPlatformReviewCockpitReady && pipelineHealth.handoffAcceptanceWalkthroughReady && pipelineHealth.platformRealityCheckReady && pipelineHealth.manualPlatformReviewViewModelReady,
        safeToProceedWithManualExternalPlatformVisitEducation:pipelineHealth.userFacingManualReviewFlowReady && pipelineHealth.platformVerificationProgressTrackerReady && pipelineHealth.safeNextActionPanelReady && pipelineHealth.userManualReviewViewModelReady,
        safeToProceedWithUserLeavingWeishanEducation:pipelineHealth.manualPlatformVisitPreparationCenterReady && pipelineHealth.externalPlatformBoundaryBriefReady && pipelineHealth.finalUserSafetyChecklistReady && pipelineHealth.platformVisitPreparationViewModelReady,
        safeToProceedWithReadOnlySessionClosureEducation:pipelineHealth.externalPlatformExitRampPreviewReady && pipelineHealth.manualVisitSafetyBriefReady && pipelineHealth.readOnlySessionClosurePackReady && pipelineHealth.externalPlatformExitViewModelReady,
        safeToProceedWithReadOnlyProviderSandboxPlanning:pipelineHealth.readOnlyCommerceSessionRecapCenterReady && pipelineHealth.userTrustClosureSummaryReady && pipelineHealth.nextFeatureReadinessGateReady && pipelineHealth.commerceSessionRecapViewModelReady,
        safeToProceedWithProviderLegalAndCredentialReview:pipelineHealth.readOnlySandboxProviderIntegrationBlueprintReady && pipelineHealth.credentialIsolationReadinessReady && pipelineHealth.providerContractSelectionReady && pipelineHealth.sandboxProviderPlanningViewModelReady,
        safeToProceedWithProviderSandboxContractImplementation:pipelineHealth.providerLegalReviewDossierReady && pipelineHealth.credentialVaultInterfaceReady && pipelineHealth.sandboxAdapterContractTestbedReady && pipelineHealth.providerIntegrationPrepViewModelReady,
        safeToProceedWithMockAdapterRuntimeHardening:pipelineHealth.sandboxProviderMockRuntimeReady && pipelineHealth.vaultBoundaryContractReady && pipelineHealth.legalApprovalWorkflowReady && pipelineHealth.providerMockRuntimeViewModelReady && obj(sandboxProviderMockRuntimeSummary).safeToProceedWithMockAdapterRuntimeHardening === true,
        safeToProceedWithHumanProviderSandboxApproval:pipelineHealth.mockProviderAdapterRegistryRuntimeReady && pipelineHealth.providerContractReplayHarnessReady && pipelineHealth.providerLaunchReadinessBoardReady && pipelineHealth.providerLaunchReadinessViewModelReady && obj(providerLaunchReadinessBoardSummary.readinessSummary).readyForHumanSandboxProviderApproval === true,
        safeToProceedWithHumanControlledSandboxProviderPilot:pipelineHealth.humanApprovalSimulationGateReady && pipelineHealth.mockProviderLaunchDrillReady && pipelineHealth.sandboxProviderRollbackPlanReady && pipelineHealth.providerLaunchSimulationViewModelReady,
        safeToProceedWithHumanControlledSandboxProviderPilotPlan:pipelineHealth.providerSandboxPilotControlRoomReady && pipelineHealth.mockProviderIncidentDrillReady && pipelineHealth.productionBlockerMatrixReady && pipelineHealth.providerPilotControlViewModelReady
      },
      blockedReasons:blockedReasons,
      readOnlyProviderSandboxConnectorSummary:clone(readOnlyProviderSandboxConnectorSummary),
      fixtureReplayConsoleSummary:clone(fixtureReplayConsoleSummary),
      legalProviderFixtureSummary:clone(legalProviderFixtureSummary),
      providerCredentialSafetySummary:clone(providerCredentialSafetySummary),
      sandboxPriceFeedSummary:clone(sandboxPriceFeedSummary),
      sandboxProviderResponseContractSummary:clone(sandboxProviderResponseContractSummary),
      priceSourceNormalizationSummary:clone(priceSourceNormalizationSummary),
      officialPriceAnchorSummary:clone(officialPriceAnchorSummary),
      sameItemMatcherSummary:clone(sameItemMatcherSummary),
      duplicateCandidateMergerSummary:clone(duplicateCandidateMergerSummary),
      coveredLowestCandidateBoardSummary:clone(coveredLowestCandidateBoardSummary),
      realProviderSandboxGateSummary:clone(realProviderSandboxGateSummary),
      providerRequestEnvelopeSummary:clone(providerRequestEnvelopeSummary),
      providerCallAuditLedgerSummary:clone(providerCallAuditLedgerSummary),
      providerSandboxReadinessViewModelSummary:clone(providerSandboxReadinessViewModelSummary),
      providerSandboxDryRunHarnessSummary:clone(providerSandboxDryRunHarnessSummary),
      firstReadOnlyProviderAdapterShellSummary:clone(firstReadOnlyProviderAdapterShellSummary),
      providerSandboxSafetyKillSwitchSummary:clone(providerSandboxSafetyKillSwitchSummary),
      providerSandboxDryRunViewModelSummary:clone(providerSandboxDryRunViewModelSummary),
      sandboxHandoffViewModelSummary:clone(sandboxHandoffViewModelSummary),
      firstSandboxProviderConnectorSummary:clone(firstSandboxProviderConnectorSummary),
      providerCoverageDashboardSummary:clone(providerCoverageDashboardSummary),
      readOnlySourceTrustScoreSummary:clone(readOnlySourceTrustScoreSummary),
      providerCoverageViewModelSummary:clone(providerCoverageViewModelSummary),
      readOnlyProviderSandboxIntegrationGateSummary:clone(readOnlyProviderSandboxIntegrationGateSummary),
      sandboxPriceCandidateSessionSummary:clone(sandboxPriceCandidateSessionSummary),
      sandboxPriceCandidateResultBoardSummary:clone(sandboxPriceCandidateResultBoardSummary),
      sandboxSessionReplayCenterSummary:clone(sandboxSessionReplayCenterSummary),
      providerEvidenceTraceSummary:clone(providerEvidenceTraceSummary),
      candidateConfidenceExplainerSummary:clone(candidateConfidenceExplainerSummary),
      sandboxReplayViewModelSummary:clone(sandboxReplayViewModelSummary),
      sandboxCandidateComparisonWorkbenchSummary:clone(sandboxCandidateComparisonWorkbenchSummary),
      providerEvidenceComparisonMatrixSummary:clone(providerEvidenceComparisonMatrixSummary),
      readOnlyHandoffReadinessDrillSummary:clone(readOnlyHandoffReadinessDrillSummary),
      sandboxDecisionReviewViewModelSummary:clone(sandboxDecisionReviewViewModelSummary),
      redactedSearchParameterPackSummary:clone(redactedSearchParameterPackSummary),
      userConfirmationChecklistSummary:clone(userConfirmationChecklistSummary),
      readOnlyPlatformHandoffSimulatorSummary:clone(readOnlyPlatformHandoffSimulatorSummary),
      platformHandoffSimulationViewModelSummary:clone(platformHandoffSimulationViewModelSummary),
      readOnlyHandoffPacketPreviewSummary:clone(readOnlyHandoffPacketPreviewSummary),
      platformPreflightSafetyGateSummary:clone(platformPreflightSafetyGateSummary),
      userActionBoundaryReceiptSummary:clone(userActionBoundaryReceiptSummary),
      handoffPacketViewModelSummary:clone(handoffPacketViewModelSummary),
      manualPlatformReviewCockpitSummary:clone(manualPlatformReviewCockpitSummary),
      handoffAcceptanceWalkthroughSummary:clone(handoffAcceptanceWalkthroughSummary),
      platformRealityCheckBoardSummary:clone(platformRealityCheckBoardSummary),
      manualPlatformReviewViewModelSummary:clone(manualPlatformReviewViewModelSummary),
      userFacingManualReviewFlowSummary:clone(userFacingManualReviewFlowSummary),
      platformVerificationProgressTrackerSummary:clone(platformVerificationProgressTrackerSummary),
      safeNextActionPanelSummary:clone(safeNextActionPanelSummary),
      userManualReviewViewModelSummary:clone(userManualReviewViewModelSummary),
      manualPlatformVisitPreparationCenterSummary:clone(manualPlatformVisitPreparationCenterSummary),
      externalPlatformBoundaryBriefSummary:clone(externalPlatformBoundaryBriefSummary),
      finalUserSafetyChecklistSummary:clone(finalUserSafetyChecklistSummary),
      platformVisitPreparationViewModelSummary:clone(platformVisitPreparationViewModelSummary),
      externalPlatformExitRampPreviewSummary:clone(externalPlatformExitRampPreviewSummary),
      manualVisitSafetyBriefSummary:clone(manualVisitSafetyBriefSummary),
      readOnlySessionClosurePackSummary:clone(readOnlySessionClosurePackSummary),
      externalPlatformExitViewModelSummary:clone(externalPlatformExitViewModelSummary),
      readOnlyCommerceSessionRecapCenterSummary:clone(readOnlyCommerceSessionRecapCenterSummary),
      userTrustClosureSummarySummary:clone(userTrustClosureSummarySummary),
      nextFeatureReadinessGateSummary:clone(nextFeatureReadinessGateSummary),
      commerceSessionRecapViewModelSummary:clone(commerceSessionRecapViewModelSummary),
      readOnlySandboxProviderIntegrationBlueprintSummary:clone(readOnlySandboxProviderIntegrationBlueprintSummary),
      credentialIsolationReadinessBoardSummary:clone(credentialIsolationReadinessBoardSummary),
      providerContractSelectionBoardSummary:clone(providerContractSelectionBoardSummary),
      sandboxProviderPlanningViewModelSummary:clone(sandboxProviderPlanningViewModelSummary),
      providerLegalReviewDossierSummary:clone(providerLegalReviewDossierSummary),
      credentialVaultInterfaceStubSummary:clone(credentialVaultInterfaceStubSummary),
      sandboxAdapterContractTestbedSummary:clone(sandboxAdapterContractTestbedSummary),
      providerIntegrationPrepViewModelSummary:clone(providerIntegrationPrepViewModelSummary),
      sandboxProviderMockRuntimeSummary:clone(sandboxProviderMockRuntimeSummary),
      vaultBoundaryContractSummary:clone(vaultBoundaryContractSummary),
      legalApprovalWorkflowBoardSummary:clone(legalApprovalWorkflowBoardSummary),
      providerMockRuntimeViewModelSummary:clone(providerMockRuntimeViewModelSummary),
      mockProviderAdapterRegistryRuntimeSummary:clone(mockProviderAdapterRegistryRuntimeSummary),
      providerContractReplayHarnessSummary:clone(providerContractReplayHarnessSummary),
      providerLaunchReadinessBoardSummary:clone(providerLaunchReadinessBoardSummary),
      providerLaunchReadinessViewModelSummary:clone(providerLaunchReadinessViewModelSummary),
      humanApprovalSimulationGateSummary:clone(humanApprovalSimulationGateSummary),
      mockProviderLaunchDrillSummary:clone(mockProviderLaunchDrillSummary),
      sandboxProviderRollbackPlanSummary:clone(sandboxProviderRollbackPlanSummary),
      providerLaunchSimulationViewModelSummary:clone(providerLaunchSimulationViewModelSummary),
      providerSandboxPilotControlRoomSummary:clone(providerSandboxPilotControlRoomSummary),
      mockProviderIncidentDrillSummary:clone(mockProviderIncidentDrillSummary),
      productionBlockerMatrixSummary:clone(productionBlockerMatrixSummary),
      providerPilotControlViewModelSummary:clone(providerPilotControlViewModelSummary),
      status:blockedReasons.length ? "blocked" : (review ? "needs_review" : "ready"),
      redacted:true
    });
  }
  function buildGlobalShoppingPricePipelineRows(input) {
    const safe = obj(input);
    return clone([
      row("provider_connector", "Provider Connector", statusOf(safe.readOnlyProviderSandboxConnectorSummary) === "ready" ? "pass" : (statusOf(safe.readOnlyProviderSandboxConnectorSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.readOnlyProviderSandboxConnectorSummary).userFacingSummary).resultLabel || "只读 Provider Connector 仍需复核"),
      row("fixture_replay", "Fixture 回放", statusOf(safe.fixtureReplayConsoleSummary) === "ready" ? "pass" : (statusOf(safe.fixtureReplayConsoleSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.fixtureReplayConsoleSummary).userFacingSummary).resultLabel || "Fixture 回放仍需复核"),
      row("provider_fixture", "Provider fixture", statusOf(safe.legalProviderFixtureSummary) === "ready" ? "pass" : "warning", obj(obj(safe.legalProviderFixtureSummary).userFacingSummary).resultLabel || "Provider fixture 仍需复核"),
      row("credential_safety", "凭据安全", statusOf(safe.providerCredentialSafetySummary) === "ready" ? "pass" : "warning", obj(obj(safe.providerCredentialSafetySummary).userFacingSummary).resultLabel || "Provider 凭据边界仍需复核"),
      row("sandbox_feed", "Sandbox feed", statusOf(safe.sandboxPriceFeedSummary) === "ready" ? "pass" : "warning", obj(obj(safe.sandboxPriceFeedSummary).userFacingSummary).resultLabel || "Sandbox 价格 Feed 仍需复核"),
      row("response_contract", "Provider response contract", statusOf(safe.sandboxProviderResponseContractSummary) === "ready" ? "pass" : (statusOf(safe.sandboxProviderResponseContractSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.sandboxProviderResponseContractSummary).userFacingSummary).resultLabel || "Provider 响应合同仍需复核"),
      row("price_normalization", "价格归一化", statusOf(safe.priceSourceNormalizationSummary) === "ready" ? "pass" : "warning", obj(obj(safe.priceSourceNormalizationSummary).userFacingSummary).resultLabel || "价格归一化仍需复核"),
      row("official_anchor", "官方价锚点", statusOf(safe.officialPriceAnchorSummary) === "anchored" ? "pass" : "warning", obj(obj(safe.officialPriceAnchorSummary).userFacingSummary).resultLabel || "官方价仍需复核"),
      row("same_item", "同款识别", statusOf(safe.sameItemMatcherSummary) === "ready" ? "pass" : "warning", obj(obj(safe.sameItemMatcherSummary).userFacingSummary).resultLabel || "同款识别仍需复核"),
      row("duplicate_merge", "候选合并", /^(merged|ready)$/.test(statusOf(safe.duplicateCandidateMergerSummary)) ? "pass" : "warning", obj(obj(safe.duplicateCandidateMergerSummary).userFacingSummary).resultLabel || "重复候选仍需复核"),
      row("covered_lowest", "已覆盖来源较低候选价", statusOf(safe.coveredLowestCandidateBoardSummary) === "ready" ? "pass" : "warning", obj(obj(safe.coveredLowestCandidateBoardSummary).userFacingSummary).resultLabel || "当前仅比较已覆盖来源中的候选价"),
      row("sandbox_gate", "真实只读 Provider Sandbox 闸门", statusOf(safe.realProviderSandboxGateSummary) === "ready" ? "pass" : (statusOf(safe.realProviderSandboxGateSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.realProviderSandboxGateSummary).userFacingSummary).resultLabel || "仍需复核"),
      row("request_envelope", "Provider 请求封装", statusOf(safe.providerRequestEnvelopeSummary) === "ready" ? "pass" : (statusOf(safe.providerRequestEnvelopeSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.providerRequestEnvelopeSummary).userFacingSummary).resultLabel || "仍需复核"),
      row("audit_ledger", "Provider 调用审计台账", statusOf(safe.providerCallAuditLedgerSummary) === "ready" ? "pass" : (statusOf(safe.providerCallAuditLedgerSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.providerCallAuditLedgerSummary).userFacingSummary).resultLabel || "仍需复核"),
      row("sandbox_readiness", "真实只读 Provider Sandbox 准备", statusOf(safe.providerSandboxReadinessViewModelSummary) === "ready" ? "pass" : (statusOf(safe.providerSandboxReadinessViewModelSummary) === "blocked" ? "blocked" : "warning"), obj(safe.providerSandboxReadinessViewModelSummary).title || "真实只读 Provider Sandbox 准备"),
      row("provider_dry_run", "Provider Sandbox 干跑框架", statusOf(safe.providerSandboxDryRunHarnessSummary) === "ready" ? "pass" : (statusOf(safe.providerSandboxDryRunHarnessSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.providerSandboxDryRunHarnessSummary).userFacingSummary).resultLabel || "干跑框架仍需复核"),
      row("provider_adapter_shell", "第一个只读 Provider Adapter 外壳", statusOf(safe.firstReadOnlyProviderAdapterShellSummary) === "ready" ? "pass" : (statusOf(safe.firstReadOnlyProviderAdapterShellSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.firstReadOnlyProviderAdapterShellSummary).userFacingSummary).resultLabel || "Adapter 外壳仍需复核"),
      row("provider_kill_switch", "Provider Sandbox 安全熔断器", statusOf(safe.providerSandboxSafetyKillSwitchSummary) === "clear" ? "pass" : (statusOf(safe.providerSandboxSafetyKillSwitchSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.providerSandboxSafetyKillSwitchSummary).userFacingSummary).resultLabel || "安全熔断器仍需复核"),
      row("provider_dry_run_view", "Provider Sandbox 干跑准备", statusOf(safe.providerSandboxDryRunViewModelSummary) === "ready" ? "pass" : (statusOf(safe.providerSandboxDryRunViewModelSummary) === "blocked" ? "blocked" : "warning"), obj(safe.providerSandboxDryRunViewModelSummary).title || "Provider Sandbox 干跑准备"),
      row("sandbox_handoff", "Sandbox 跳转预览", statusOf(safe.sandboxHandoffViewModelSummary) === "ready" ? "pass" : "warning", obj(obj(safe.sandboxHandoffViewModelSummary).userFacingSummary).resultLabel || "Sandbox 跳转候选与平台可用性仍需复核"),
      row("sandbox_integration_gate", "只读 Provider Sandbox 接入闸门", statusOf(safe.readOnlyProviderSandboxIntegrationGateSummary) === "ready" ? "pass" : (statusOf(safe.readOnlyProviderSandboxIntegrationGateSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.readOnlyProviderSandboxIntegrationGateSummary).userFacingSummary).resultLabel || "仍需复核"),
      row("sandbox_price_candidate_session", "Sandbox 价格候选会话", statusOf(safe.sandboxPriceCandidateSessionSummary) === "ready" ? "pass" : (statusOf(safe.sandboxPriceCandidateSessionSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.sandboxPriceCandidateSessionSummary).userFacingSummary).resultLabel || "仍需复核"),
      row("sandbox_price_candidate_result_board", "Sandbox 价格候选结果", statusOf(safe.sandboxPriceCandidateResultBoardSummary) === "ready" ? "pass" : (statusOf(safe.sandboxPriceCandidateResultBoardSummary) === "blocked" ? "blocked" : "warning"), obj(safe.sandboxPriceCandidateResultBoardSummary).title || "Sandbox 价格候选结果"),
      row("sandbox_session_replay_center", "Sandbox 会话回放中心", statusOf(safe.sandboxSessionReplayCenterSummary) === "ready" ? "pass" : (statusOf(safe.sandboxSessionReplayCenterSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.sandboxSessionReplayCenterSummary).userFacingSummary).resultLabel || "Sandbox 会话回放仍需复核"),
      row("provider_evidence_trace", "Provider 证据链追踪", statusOf(safe.providerEvidenceTraceSummary) === "ready" ? "pass" : (statusOf(safe.providerEvidenceTraceSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.providerEvidenceTraceSummary).userFacingSummary).resultLabel || "Provider 证据链仍需复核"),
      row("candidate_confidence_explainer", "候选价可信度解释", statusOf(safe.candidateConfidenceExplainerSummary) === "ready" ? "pass" : (statusOf(safe.candidateConfidenceExplainerSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.candidateConfidenceExplainerSummary).userFacingSummary).resultLabel || "候选价可信度仍需复核"),
      row("sandbox_replay_view_model", "Sandbox 会话回放与证据解释", statusOf(safe.sandboxReplayViewModelSummary) === "ready" ? "pass" : (statusOf(safe.sandboxReplayViewModelSummary) === "blocked" ? "blocked" : "warning"), obj(safe.sandboxReplayViewModelSummary).title || "Sandbox 会话回放与证据解释"),
      row("sandbox_candidate_comparison", "Sandbox 候选对比工作台", statusOf(safe.sandboxCandidateComparisonWorkbenchSummary) === "ready" ? "pass" : (statusOf(safe.sandboxCandidateComparisonWorkbenchSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.sandboxCandidateComparisonWorkbenchSummary).userFacingSummary).resultLabel || "候选对比仍需复核"),
      row("provider_evidence_matrix", "Provider 证据对比矩阵", statusOf(safe.providerEvidenceComparisonMatrixSummary) === "ready" ? "pass" : (statusOf(safe.providerEvidenceComparisonMatrixSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.providerEvidenceComparisonMatrixSummary).userFacingSummary).resultLabel || "证据矩阵仍需复核"),
      row("handoff_readiness_drill", "只读跳转交接演练", statusOf(safe.readOnlyHandoffReadinessDrillSummary) === "ready" ? "pass" : (statusOf(safe.readOnlyHandoffReadinessDrillSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.readOnlyHandoffReadinessDrillSummary).userFacingSummary).resultLabel || "交接演练仍需复核"),
      row("sandbox_decision_review", "Sandbox 候选决策复核", statusOf(safe.sandboxDecisionReviewViewModelSummary) === "ready" ? "pass" : (statusOf(safe.sandboxDecisionReviewViewModelSummary) === "blocked" ? "blocked" : "warning"), obj(safe.sandboxDecisionReviewViewModelSummary).title || "Sandbox 候选决策复核"),
      row("handoff_simulator", "只读平台交接模拟器", statusOf(safe.readOnlyPlatformHandoffSimulatorSummary) === "ready" ? "pass" : (statusOf(safe.readOnlyPlatformHandoffSimulatorSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.readOnlyPlatformHandoffSimulatorSummary).userFacingSummary).resultLabel || "交接模拟仍需复核"),
      row("redacted_parameter_pack", "脱敏搜索参数包", statusOf(safe.redactedSearchParameterPackSummary) === "ready" ? "pass" : (statusOf(safe.redactedSearchParameterPackSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.redactedSearchParameterPackSummary).userFacingSummary).resultLabel || "搜索参数包仍需复核"),
      row("user_confirmation_checklist", "用户确认清单", statusOf(safe.userConfirmationChecklistSummary) === "ready" ? "pass" : (statusOf(safe.userConfirmationChecklistSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.userConfirmationChecklistSummary).userFacingSummary).resultLabel || "用户确认清单仍需复核"),
      row("handoff_view_model", "只读平台交接模拟", statusOf(safe.platformHandoffSimulationViewModelSummary) === "ready" ? "pass" : (statusOf(safe.platformHandoffSimulationViewModelSummary) === "blocked" ? "blocked" : "warning"), obj(safe.platformHandoffSimulationViewModelSummary).title || "只读平台交接模拟"),
      row("handoff_packet_preview", "只读交接包预览", statusOf(safe.readOnlyHandoffPacketPreviewSummary) === "ready" ? "pass" : (statusOf(safe.readOnlyHandoffPacketPreviewSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.readOnlyHandoffPacketPreviewSummary).userFacingSummary).resultLabel || "交接包预览仍需复核"),
      row("platform_preflight_gate", "平台跳转前安全预检", statusOf(safe.platformPreflightSafetyGateSummary) === "clear" ? "pass" : (statusOf(safe.platformPreflightSafetyGateSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.platformPreflightSafetyGateSummary).userFacingSummary).resultLabel || "安全预检仍需复核"),
      row("user_action_boundary_receipt", "用户行动边界回执", statusOf(safe.userActionBoundaryReceiptSummary) === "ready" ? "pass" : (statusOf(safe.userActionBoundaryReceiptSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.userActionBoundaryReceiptSummary).userFacingSummary).resultLabel || "边界回执仍需复核"),
      row("handoff_packet_view_model", "只读交接包与安全预检", statusOf(safe.handoffPacketViewModelSummary) === "ready" ? "pass" : (statusOf(safe.handoffPacketViewModelSummary) === "blocked" ? "blocked" : "warning"), obj(safe.handoffPacketViewModelSummary).title || "只读交接包与安全预检"),
      row("manual_platform_review_cockpit", "手动平台复核驾驶舱", statusOf(safe.manualPlatformReviewCockpitSummary) === "ready" ? "pass" : (statusOf(safe.manualPlatformReviewCockpitSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.manualPlatformReviewCockpitSummary).userFacingSummary).resultLabel || "手动平台复核驾驶舱仍需复核"),
      row("handoff_acceptance_walkthrough", "交接包接受演练", statusOf(safe.handoffAcceptanceWalkthroughSummary) === "ready" ? "pass" : (statusOf(safe.handoffAcceptanceWalkthroughSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.handoffAcceptanceWalkthroughSummary).userFacingSummary).resultLabel || "交接包接受演练仍需复核"),
      row("platform_reality_check_board", "平台真实页面复核清单", statusOf(safe.platformRealityCheckBoardSummary) === "ready" ? "pass" : (statusOf(safe.platformRealityCheckBoardSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.platformRealityCheckBoardSummary).userFacingSummary).resultLabel || "平台真实页面复核清单仍需复核"),
      row("manual_platform_review_view_model", "手动平台复核与现实检查", statusOf(safe.manualPlatformReviewViewModelSummary) === "ready" ? "pass" : (statusOf(safe.manualPlatformReviewViewModelSummary) === "blocked" ? "blocked" : "warning"), obj(safe.manualPlatformReviewViewModelSummary).title || "手动平台复核与现实检查"),
      row("user_facing_manual_review_flow", "用户手动复核流程", statusOf(safe.userFacingManualReviewFlowSummary) === "ready" ? "pass" : (statusOf(safe.userFacingManualReviewFlowSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.userFacingManualReviewFlowSummary).userFacingSummary).resultLabel || "用户手动复核流程仍需复核"),
      row("platform_verification_progress_tracker", "平台核对进度追踪", statusOf(safe.platformVerificationProgressTrackerSummary) === "ready" ? "pass" : (statusOf(safe.platformVerificationProgressTrackerSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.platformVerificationProgressTrackerSummary).userFacingSummary).resultLabel || "平台核对进度仍需复核"),
      row("safe_next_action_panel", "安全下一步", statusOf(safe.safeNextActionPanelSummary) === "ready" ? "pass" : (statusOf(safe.safeNextActionPanelSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.safeNextActionPanelSummary).userFacingSummary).resultLabel || "安全下一步仍需复核"),
      row("user_manual_review_view_model", "用户手动复核与安全下一步", statusOf(safe.userManualReviewViewModelSummary) === "ready" ? "pass" : (statusOf(safe.userManualReviewViewModelSummary) === "blocked" ? "blocked" : "warning"), obj(safe.userManualReviewViewModelSummary).title || "用户手动复核与安全下一步"),
      row("manual_platform_visit_preparation_center", "手动访问平台准备中心", statusOf(safe.manualPlatformVisitPreparationCenterSummary) === "ready" ? "pass" : (statusOf(safe.manualPlatformVisitPreparationCenterSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.manualPlatformVisitPreparationCenterSummary).userFacingSummary).resultLabel || "平台访问准备仍需复核"),
      row("external_platform_boundary_brief", "外部平台边界说明", statusOf(safe.externalPlatformBoundaryBriefSummary) === "ready" ? "pass" : (statusOf(safe.externalPlatformBoundaryBriefSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.externalPlatformBoundaryBriefSummary).userFacingSummary).resultLabel || "平台边界说明仍需复核"),
      row("final_user_safety_checklist", "最终用户安全清单", statusOf(safe.finalUserSafetyChecklistSummary) === "ready" ? "pass" : (statusOf(safe.finalUserSafetyChecklistSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.finalUserSafetyChecklistSummary).userFacingSummary).resultLabel || "最终安全清单仍需复核"),
      row("platform_visit_preparation_view_model", "平台访问准备与最终安全清单", statusOf(safe.platformVisitPreparationViewModelSummary) === "ready" ? "pass" : (statusOf(safe.platformVisitPreparationViewModelSummary) === "blocked" ? "blocked" : "warning"), obj(safe.platformVisitPreparationViewModelSummary).title || "平台访问准备与最终安全清单"),
      row("external_platform_exit_ramp_preview", "外部平台退出坡道预览", statusOf(safe.externalPlatformExitRampPreviewSummary) === "ready" ? "pass" : (statusOf(safe.externalPlatformExitRampPreviewSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.externalPlatformExitRampPreviewSummary).userFacingSummary).resultLabel || "外部平台退出坡道仍需复核"),
      row("manual_visit_safety_brief", "手动访问安全简报", statusOf(safe.manualVisitSafetyBriefSummary) === "ready" ? "pass" : (statusOf(safe.manualVisitSafetyBriefSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.manualVisitSafetyBriefSummary).userFacingSummary).resultLabel || "手动访问安全简报仍需复核"),
      row("read_only_session_closure_pack", "只读会话关闭包", statusOf(safe.readOnlySessionClosurePackSummary) === "ready" ? "pass" : (statusOf(safe.readOnlySessionClosurePackSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.readOnlySessionClosurePackSummary).userFacingSummary).resultLabel || "只读会话关闭包仍需复核"),
      row("external_platform_exit_view_model", "外部平台手动访问前最终说明", statusOf(safe.externalPlatformExitViewModelSummary) === "ready" ? "pass" : (statusOf(safe.externalPlatformExitViewModelSummary) === "blocked" ? "blocked" : "warning"), obj(safe.externalPlatformExitViewModelSummary).title || "外部平台手动访问前最终说明"),
      row("read_only_commerce_session_recap_center", "只读全球购会话总结", statusOf(safe.readOnlyCommerceSessionRecapCenterSummary) === "ready" ? "pass" : (statusOf(safe.readOnlyCommerceSessionRecapCenterSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.readOnlyCommerceSessionRecapCenterSummary).userFacingSummary).resultLabel || "会话总结仍需复核"),
      row("user_trust_closure_summary", "用户信任闭环摘要", statusOf(safe.userTrustClosureSummarySummary) === "ready" ? "pass" : (statusOf(safe.userTrustClosureSummarySummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.userTrustClosureSummarySummary).userFacingSummary).resultLabel || "信任闭环摘要仍需复核"),
      row("next_feature_readiness_gate", "下一功能准备闸门", statusOf(safe.nextFeatureReadinessGateSummary) === "ready" ? "pass" : (statusOf(safe.nextFeatureReadinessGateSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.nextFeatureReadinessGateSummary).userFacingSummary).resultLabel || "下一功能准备仍需复核"),
      row("commerce_session_recap_view_model", "只读全球购会话总结与下一步准备", statusOf(safe.commerceSessionRecapViewModelSummary) === "ready" ? "pass" : (statusOf(safe.commerceSessionRecapViewModelSummary) === "blocked" ? "blocked" : "warning"), obj(safe.commerceSessionRecapViewModelSummary).title || "只读全球购会话总结与下一步准备"),
      row("sandbox_provider_integration_blueprint", "只读 Sandbox Provider 接入蓝图", statusOf(safe.readOnlySandboxProviderIntegrationBlueprintSummary) === "ready" ? "pass" : (statusOf(safe.readOnlySandboxProviderIntegrationBlueprintSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.readOnlySandboxProviderIntegrationBlueprintSummary).userFacingSummary).resultLabel || "接入蓝图仍需复核"),
      row("credential_isolation_readiness_board", "凭证隔离准备度", statusOf(safe.credentialIsolationReadinessBoardSummary) === "ready" ? "pass" : (statusOf(safe.credentialIsolationReadinessBoardSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.credentialIsolationReadinessBoardSummary).userFacingSummary).resultLabel || "凭证隔离仍需复核"),
      row("provider_contract_selection_board", "Provider 合同/授权选择板", statusOf(safe.providerContractSelectionBoardSummary) === "ready" ? "pass" : (statusOf(safe.providerContractSelectionBoardSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.providerContractSelectionBoardSummary).userFacingSummary).resultLabel || "Provider 选择仍需复核"),
      row("sandbox_provider_planning_view_model", "只读 Sandbox Provider 接入规划", statusOf(safe.sandboxProviderPlanningViewModelSummary) === "ready" ? "pass" : (statusOf(safe.sandboxProviderPlanningViewModelSummary) === "blocked" ? "blocked" : "warning"), obj(safe.sandboxProviderPlanningViewModelSummary).title || "只读 Sandbox Provider 接入规划"),
      row("provider_legal_review_dossier", "Provider 法务审查档案", statusOf(safe.providerLegalReviewDossierSummary) === "ready" ? "pass" : (statusOf(safe.providerLegalReviewDossierSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.providerLegalReviewDossierSummary).userFacingSummary).resultLabel || "法务审查仍需复核"),
      row("credential_vault_interface_stub", "凭证保险箱接口桩", statusOf(safe.credentialVaultInterfaceStubSummary) === "ready" ? "pass" : (statusOf(safe.credentialVaultInterfaceStubSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.credentialVaultInterfaceStubSummary).userFacingSummary).resultLabel || "凭证接口桩仍需复核"),
      row("sandbox_adapter_contract_testbed", "Sandbox Adapter 合同测试台", statusOf(safe.sandboxAdapterContractTestbedSummary) === "ready" ? "pass" : (statusOf(safe.sandboxAdapterContractTestbedSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.sandboxAdapterContractTestbedSummary).userFacingSummary).resultLabel || "Adapter 合同测试仍需复核"),
      row("provider_integration_prep_view_model", "Provider 接入前准备", statusOf(safe.providerIntegrationPrepViewModelSummary) === "ready" ? "pass" : (statusOf(safe.providerIntegrationPrepViewModelSummary) === "blocked" ? "blocked" : "warning"), obj(safe.providerIntegrationPrepViewModelSummary).title || "Provider 接入前准备"),
      row("sandbox_provider_mock_runtime", "Sandbox Provider Mock Runtime", statusOf(safe.sandboxProviderMockRuntimeSummary) === "ready" ? "pass" : (statusOf(safe.sandboxProviderMockRuntimeSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.sandboxProviderMockRuntimeSummary).userFacingSummary).resultLabel || "Sandbox Provider Mock Runtime 仍需复核"),
      row("vault_boundary_contract", "Vault Boundary Contract", statusOf(safe.vaultBoundaryContractSummary) === "ready" ? "pass" : (statusOf(safe.vaultBoundaryContractSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.vaultBoundaryContractSummary).userFacingSummary).resultLabel || "Vault 边界合同仍需复核"),
      row("legal_approval_workflow_board", "法务审批流程板", statusOf(safe.legalApprovalWorkflowBoardSummary) === "ready" ? "pass" : (statusOf(safe.legalApprovalWorkflowBoardSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.legalApprovalWorkflowBoardSummary).userFacingSummary).resultLabel || "法务审批流程板仍需复核"),
      row("provider_mock_runtime_view_model", "Provider Mock Runtime 与审批准备", statusOf(safe.providerMockRuntimeViewModelSummary) === "ready" ? "pass" : (statusOf(safe.providerMockRuntimeViewModelSummary) === "blocked" ? "blocked" : "warning"), obj(safe.providerMockRuntimeViewModelSummary).title || "Provider Mock Runtime 与审批准备"),
      row("mock_provider_adapter_registry_runtime", "Mock Provider Adapter 注册运行时", statusOf(safe.mockProviderAdapterRegistryRuntimeSummary) === "ready" ? "pass" : (statusOf(safe.mockProviderAdapterRegistryRuntimeSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.mockProviderAdapterRegistryRuntimeSummary).userFacingSummary).resultLabel || "Mock Adapter 注册仍需复核"),
      row("provider_contract_replay_harness", "Provider 合同回放器", statusOf(safe.providerContractReplayHarnessSummary) === "ready" ? "pass" : (statusOf(safe.providerContractReplayHarnessSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.providerContractReplayHarnessSummary).userFacingSummary).resultLabel || "合同回放仍需复核"),
      row("provider_launch_readiness_board", "Provider 启动准备总闸门", statusOf(safe.providerLaunchReadinessBoardSummary) === "ready" ? "pass" : (statusOf(safe.providerLaunchReadinessBoardSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.providerLaunchReadinessBoardSummary).userFacingSummary).resultLabel || "启动准备仍需复核"),
      row("provider_launch_readiness_view_model", "Provider 启动准备与合同回放", statusOf(safe.providerLaunchReadinessViewModelSummary) === "ready" ? "pass" : (statusOf(safe.providerLaunchReadinessViewModelSummary) === "blocked" ? "blocked" : "warning"), obj(safe.providerLaunchReadinessViewModelSummary).title || "Provider 启动准备与合同回放"),
      row("human_approval_simulation_gate", "人工审批模拟闸门", statusOf(safe.humanApprovalSimulationGateSummary) === "ready" ? "pass" : (statusOf(safe.humanApprovalSimulationGateSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.humanApprovalSimulationGateSummary).userFacingSummary).resultLabel || "审批模拟仍需复核"),
      row("mock_provider_launch_drill", "Mock Provider 启动演练", statusOf(safe.mockProviderLaunchDrillSummary) === "ready" ? "pass" : (statusOf(safe.mockProviderLaunchDrillSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.mockProviderLaunchDrillSummary).userFacingSummary).resultLabel || "Mock 启动演练仍需复核"),
      row("sandbox_provider_rollback_plan", "Sandbox Provider 回滚预案", statusOf(safe.sandboxProviderRollbackPlanSummary) === "ready" ? "pass" : (statusOf(safe.sandboxProviderRollbackPlanSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.sandboxProviderRollbackPlanSummary).userFacingSummary).resultLabel || "回滚预案仍需复核"),
      row("provider_launch_simulation_view_model", "Provider 启动模拟与回滚预案", statusOf(safe.providerLaunchSimulationViewModelSummary) === "ready" ? "pass" : (statusOf(safe.providerLaunchSimulationViewModelSummary) === "blocked" ? "blocked" : "warning"), obj(safe.providerLaunchSimulationViewModelSummary).title || "Provider 启动模拟与回滚预案"),
      row("provider_sandbox_pilot_control_room", "Provider Sandbox Pilot 控制室", statusOf(safe.providerSandboxPilotControlRoomSummary) === "ready" ? "pass" : (statusOf(safe.providerSandboxPilotControlRoomSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.providerSandboxPilotControlRoomSummary).userFacingSummary).resultLabel || "Sandbox Pilot 控制室仍需复核"),
      row("mock_provider_incident_drill", "Mock Provider 事故演练", statusOf(safe.mockProviderIncidentDrillSummary) === "ready" ? "pass" : (statusOf(safe.mockProviderIncidentDrillSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.mockProviderIncidentDrillSummary).userFacingSummary).resultLabel || "Mock 事故演练仍需复核"),
      row("production_blocker_matrix", "Production 阻断矩阵", statusOf(safe.productionBlockerMatrixSummary) === "ready" ? "pass" : (statusOf(safe.productionBlockerMatrixSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.productionBlockerMatrixSummary).userFacingSummary).resultLabel || "Production 阻断矩阵仍需复核"),
      row("provider_pilot_control_view_model", "Provider Sandbox Pilot 控制与阻断", statusOf(safe.providerPilotControlViewModelSummary) === "ready" ? "pass" : (statusOf(safe.providerPilotControlViewModelSummary) === "blocked" ? "blocked" : "warning"), obj(safe.providerPilotControlViewModelSummary).title || "Provider Sandbox Pilot 控制与阻断")
    ]);
  }
  function sanitizeGlobalShoppingPricePipelineOrchestrator(orchestrator) {
    const safe = obj(orchestrator);
    const evaluation = evaluateGlobalShoppingPricePipeline(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      orchestratorName:ORCHESTRATOR_NAME,
      appVersion:GLOBAL_SHOPPING_PRICE_PIPELINE_ORCHESTRATOR_VERSION,
      status:status,
      pipelineHealth:clone(evaluation.pipelineHealth),
      pipelineStages:toArray(safe.pipelineStages).length ? toArray(safe.pipelineStages) : evaluation.pipelineStages,
      readyOutputs:clone(evaluation.readyOutputs),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"全球购只读价格流水线",
        resultLabel:status === "ready" ? "只读价格流水线已准备" : (status === "blocked" ? "只读价格流水线已阻断" : "只读价格流水线仍需复核"),
        caveat:"该流水线仅使用 fixture/sandbox 数据，不请求真实平台，不代表真实价格、可订、付款、下单或出票能力。",
        redacted:true
      },
      safety:safety(safe.safety),
      readOnlyProviderSandboxConnectorSummary:linkedSummary(evaluation.readOnlyProviderSandboxConnectorSummary),
      fixtureReplayConsoleSummary:linkedSummary(evaluation.fixtureReplayConsoleSummary),
      legalProviderFixtureSummary:linkedSummary(evaluation.legalProviderFixtureSummary),
      providerCredentialSafetySummary:linkedSummary(evaluation.providerCredentialSafetySummary),
      sandboxPriceFeedSummary:linkedSummary(evaluation.sandboxPriceFeedSummary),
      sandboxProviderResponseContractSummary:linkedSummary(evaluation.sandboxProviderResponseContractSummary),
      priceSourceNormalizationSummary:linkedSummary(evaluation.priceSourceNormalizationSummary),
      officialPriceAnchorSummary:linkedSummary(evaluation.officialPriceAnchorSummary),
      sameItemMatcherSummary:linkedSummary(evaluation.sameItemMatcherSummary),
      duplicateCandidateMergerSummary:linkedSummary(evaluation.duplicateCandidateMergerSummary),
      coveredLowestCandidateBoardSummary:linkedSummary(evaluation.coveredLowestCandidateBoardSummary),
      realProviderSandboxGateSummary:linkedSummary(evaluation.realProviderSandboxGateSummary),
      providerRequestEnvelopeSummary:linkedSummary(evaluation.providerRequestEnvelopeSummary),
      providerCallAuditLedgerSummary:linkedSummary(evaluation.providerCallAuditLedgerSummary),
      providerSandboxReadinessViewModelSummary:linkedSummary(evaluation.providerSandboxReadinessViewModelSummary),
      providerSandboxDryRunHarnessSummary:linkedSummary(evaluation.providerSandboxDryRunHarnessSummary),
      firstReadOnlyProviderAdapterShellSummary:linkedSummary(evaluation.firstReadOnlyProviderAdapterShellSummary),
      providerSandboxSafetyKillSwitchSummary:linkedSummary(evaluation.providerSandboxSafetyKillSwitchSummary),
      providerSandboxDryRunViewModelSummary:linkedSummary(evaluation.providerSandboxDryRunViewModelSummary),
      sandboxHandoffViewModelSummary:linkedSummary(evaluation.sandboxHandoffViewModelSummary),
      firstSandboxProviderConnectorSummary:linkedSummary(evaluation.firstSandboxProviderConnectorSummary),
      providerCoverageDashboardSummary:linkedSummary(evaluation.providerCoverageDashboardSummary),
      readOnlySourceTrustScoreSummary:linkedSummary(evaluation.readOnlySourceTrustScoreSummary),
      providerCoverageViewModelSummary:linkedSummary(evaluation.providerCoverageViewModelSummary),
      readOnlyProviderSandboxIntegrationGateSummary:linkedSummary(evaluation.readOnlyProviderSandboxIntegrationGateSummary),
      sandboxPriceCandidateSessionSummary:linkedSummary(evaluation.sandboxPriceCandidateSessionSummary),
      sandboxPriceCandidateResultBoardSummary:linkedSummary(evaluation.sandboxPriceCandidateResultBoardSummary),
      sandboxSessionReplayCenterSummary:linkedSummary(evaluation.sandboxSessionReplayCenterSummary),
      providerEvidenceTraceSummary:linkedSummary(evaluation.providerEvidenceTraceSummary),
      candidateConfidenceExplainerSummary:linkedSummary(evaluation.candidateConfidenceExplainerSummary),
      sandboxReplayViewModelSummary:linkedSummary(evaluation.sandboxReplayViewModelSummary),
      sandboxCandidateComparisonWorkbenchSummary:linkedSummary(evaluation.sandboxCandidateComparisonWorkbenchSummary),
      providerEvidenceComparisonMatrixSummary:linkedSummary(evaluation.providerEvidenceComparisonMatrixSummary),
      readOnlyHandoffReadinessDrillSummary:linkedSummary(evaluation.readOnlyHandoffReadinessDrillSummary),
      sandboxDecisionReviewViewModelSummary:linkedSummary(evaluation.sandboxDecisionReviewViewModelSummary),
      redactedSearchParameterPackSummary:linkedSummary(evaluation.redactedSearchParameterPackSummary),
      userConfirmationChecklistSummary:linkedSummary(evaluation.userConfirmationChecklistSummary),
      readOnlyPlatformHandoffSimulatorSummary:linkedSummary(evaluation.readOnlyPlatformHandoffSimulatorSummary),
      platformHandoffSimulationViewModelSummary:linkedSummary(evaluation.platformHandoffSimulationViewModelSummary),
      readOnlyHandoffPacketPreviewSummary:linkedSummary(evaluation.readOnlyHandoffPacketPreviewSummary),
      platformPreflightSafetyGateSummary:linkedSummary(evaluation.platformPreflightSafetyGateSummary),
      userActionBoundaryReceiptSummary:linkedSummary(evaluation.userActionBoundaryReceiptSummary),
      handoffPacketViewModelSummary:linkedSummary(evaluation.handoffPacketViewModelSummary),
      manualPlatformReviewCockpitSummary:linkedSummary(evaluation.manualPlatformReviewCockpitSummary),
      handoffAcceptanceWalkthroughSummary:linkedSummary(evaluation.handoffAcceptanceWalkthroughSummary),
      platformRealityCheckBoardSummary:linkedSummary(evaluation.platformRealityCheckBoardSummary),
      manualPlatformReviewViewModelSummary:linkedSummary(evaluation.manualPlatformReviewViewModelSummary),
      userFacingManualReviewFlowSummary:linkedSummary(evaluation.userFacingManualReviewFlowSummary),
      platformVerificationProgressTrackerSummary:linkedSummary(evaluation.platformVerificationProgressTrackerSummary),
      safeNextActionPanelSummary:linkedSummary(evaluation.safeNextActionPanelSummary),
      userManualReviewViewModelSummary:linkedSummary(evaluation.userManualReviewViewModelSummary),
      manualPlatformVisitPreparationCenterSummary:linkedSummary(evaluation.manualPlatformVisitPreparationCenterSummary),
      externalPlatformBoundaryBriefSummary:linkedSummary(evaluation.externalPlatformBoundaryBriefSummary),
      finalUserSafetyChecklistSummary:linkedSummary(evaluation.finalUserSafetyChecklistSummary),
      platformVisitPreparationViewModelSummary:linkedSummary(evaluation.platformVisitPreparationViewModelSummary),
      externalPlatformExitRampPreviewSummary:linkedSummary(evaluation.externalPlatformExitRampPreviewSummary),
      manualVisitSafetyBriefSummary:linkedSummary(evaluation.manualVisitSafetyBriefSummary),
      readOnlySessionClosurePackSummary:linkedSummary(evaluation.readOnlySessionClosurePackSummary),
      externalPlatformExitViewModelSummary:linkedSummary(evaluation.externalPlatformExitViewModelSummary),
      readOnlyCommerceSessionRecapCenterSummary:linkedSummary(evaluation.readOnlyCommerceSessionRecapCenterSummary),
      userTrustClosureSummarySummary:linkedSummary(evaluation.userTrustClosureSummarySummary),
      nextFeatureReadinessGateSummary:linkedSummary(evaluation.nextFeatureReadinessGateSummary),
      commerceSessionRecapViewModelSummary:linkedSummary(evaluation.commerceSessionRecapViewModelSummary),
      readOnlySandboxProviderIntegrationBlueprintSummary:linkedSummary(evaluation.readOnlySandboxProviderIntegrationBlueprintSummary),
      credentialIsolationReadinessBoardSummary:linkedSummary(evaluation.credentialIsolationReadinessBoardSummary),
      providerContractSelectionBoardSummary:linkedSummary(evaluation.providerContractSelectionBoardSummary),
      sandboxProviderPlanningViewModelSummary:linkedSummary(evaluation.sandboxProviderPlanningViewModelSummary),
      providerLegalReviewDossierSummary:linkedSummary(evaluation.providerLegalReviewDossierSummary),
      credentialVaultInterfaceStubSummary:linkedSummary(evaluation.credentialVaultInterfaceStubSummary),
      sandboxAdapterContractTestbedSummary:linkedSummary(evaluation.sandboxAdapterContractTestbedSummary),
      providerIntegrationPrepViewModelSummary:linkedSummary(evaluation.providerIntegrationPrepViewModelSummary),
      sandboxProviderMockRuntimeSummary:linkedSummary(evaluation.sandboxProviderMockRuntimeSummary),
      vaultBoundaryContractSummary:linkedSummary(evaluation.vaultBoundaryContractSummary),
      legalApprovalWorkflowBoardSummary:linkedSummary(evaluation.legalApprovalWorkflowBoardSummary),
      providerMockRuntimeViewModelSummary:linkedSummary(evaluation.providerMockRuntimeViewModelSummary),
      mockProviderAdapterRegistryRuntimeSummary:linkedSummary(evaluation.mockProviderAdapterRegistryRuntimeSummary),
      providerContractReplayHarnessSummary:linkedSummary(evaluation.providerContractReplayHarnessSummary),
      providerLaunchReadinessBoardSummary:linkedSummary(evaluation.providerLaunchReadinessBoardSummary),
      providerLaunchReadinessViewModelSummary:linkedSummary(evaluation.providerLaunchReadinessViewModelSummary),
      humanApprovalSimulationGateSummary:linkedSummary(evaluation.humanApprovalSimulationGateSummary),
      mockProviderLaunchDrillSummary:linkedSummary(evaluation.mockProviderLaunchDrillSummary),
      sandboxProviderRollbackPlanSummary:linkedSummary(evaluation.sandboxProviderRollbackPlanSummary),
      providerLaunchSimulationViewModelSummary:linkedSummary(evaluation.providerLaunchSimulationViewModelSummary),
      providerSandboxPilotControlRoomSummary:linkedSummary(evaluation.providerSandboxPilotControlRoomSummary),
      mockProviderIncidentDrillSummary:linkedSummary(evaluation.mockProviderIncidentDrillSummary),
      productionBlockerMatrixSummary:linkedSummary(evaluation.productionBlockerMatrixSummary),
      providerPilotControlViewModelSummary:linkedSummary(evaluation.providerPilotControlViewModelSummary),
      redactedSearchParameterPackStatus:text(obj(evaluation.redactedSearchParameterPackSummary).status || ""),
      userConfirmationChecklistStatus:text(obj(evaluation.userConfirmationChecklistSummary).status || ""),
      readOnlyPlatformHandoffSimulatorStatus:text(obj(evaluation.readOnlyPlatformHandoffSimulatorSummary).status || ""),
      platformHandoffSimulationViewModelStatus:text(obj(evaluation.platformHandoffSimulationViewModelSummary).status || ""),
      readOnlyHandoffPacketPreviewStatus:text(obj(evaluation.readOnlyHandoffPacketPreviewSummary).status || ""),
      platformPreflightSafetyGateStatus:text(obj(evaluation.platformPreflightSafetyGateSummary).status || ""),
      userActionBoundaryReceiptStatus:text(obj(evaluation.userActionBoundaryReceiptSummary).status || ""),
      handoffPacketViewModelStatus:text(obj(evaluation.handoffPacketViewModelSummary).status || ""),
      manualPlatformReviewCockpitStatus:text(obj(evaluation.manualPlatformReviewCockpitSummary).status || ""),
      handoffAcceptanceWalkthroughStatus:text(obj(evaluation.handoffAcceptanceWalkthroughSummary).status || ""),
      platformRealityCheckStatus:text(obj(evaluation.platformRealityCheckBoardSummary).status || ""),
      manualPlatformReviewViewModelStatus:text(obj(evaluation.manualPlatformReviewViewModelSummary).status || ""),
      userFacingManualReviewFlowStatus:text(obj(evaluation.userFacingManualReviewFlowSummary).status || ""),
      platformVerificationProgressStatus:text(obj(evaluation.platformVerificationProgressTrackerSummary).status || ""),
      safeNextActionPanelStatus:text(obj(evaluation.safeNextActionPanelSummary).status || ""),
      userManualReviewViewModelStatus:text(obj(evaluation.userManualReviewViewModelSummary).status || ""),
      manualPlatformVisitPreparationStatus:text(obj(evaluation.manualPlatformVisitPreparationCenterSummary).status || ""),
      externalPlatformBoundaryStatus:text(obj(evaluation.externalPlatformBoundaryBriefSummary).status || ""),
      finalUserSafetyChecklistStatus:text(obj(evaluation.finalUserSafetyChecklistSummary).status || ""),
      platformVisitPreparationViewModelStatus:text(obj(evaluation.platformVisitPreparationViewModelSummary).status || ""),
      readOnlyCommerceSessionRecapStatus:text(obj(evaluation.readOnlyCommerceSessionRecapCenterSummary).status || ""),
      userTrustClosureSummaryStatus:text(obj(evaluation.userTrustClosureSummarySummary).status || ""),
      nextFeatureReadinessGateStatus:text(obj(evaluation.nextFeatureReadinessGateSummary).status || ""),
      commerceSessionRecapViewModelStatus:text(obj(evaluation.commerceSessionRecapViewModelSummary).status || ""),
      sandboxProviderIntegrationBlueprintStatus:text(obj(evaluation.readOnlySandboxProviderIntegrationBlueprintSummary).status || ""),
      credentialIsolationReadinessStatus:text(obj(evaluation.credentialIsolationReadinessBoardSummary).status || ""),
      providerContractSelectionStatus:text(obj(evaluation.providerContractSelectionBoardSummary).status || ""),
      sandboxProviderPlanningViewModelStatus:text(obj(evaluation.sandboxProviderPlanningViewModelSummary).status || ""),
      providerLegalReviewStatus:text(obj(evaluation.providerLegalReviewDossierSummary).status || ""),
      credentialVaultInterfaceStatus:text(obj(evaluation.credentialVaultInterfaceStubSummary).status || ""),
      sandboxAdapterContractStatus:text(obj(evaluation.sandboxAdapterContractTestbedSummary).status || ""),
      providerIntegrationPrepViewModelStatus:text(obj(evaluation.providerIntegrationPrepViewModelSummary).status || ""),
      sandboxProviderMockRuntimeStatus:text(obj(evaluation.sandboxProviderMockRuntimeSummary).status || ""),
      vaultBoundaryContractStatus:text(obj(evaluation.vaultBoundaryContractSummary).status || ""),
      legalApprovalWorkflowStatus:text(obj(evaluation.legalApprovalWorkflowBoardSummary).status || ""),
      providerMockRuntimeViewModelStatus:text(obj(evaluation.providerMockRuntimeViewModelSummary).status || ""),
      mockProviderAdapterRegistryStatus:text(obj(evaluation.mockProviderAdapterRegistryRuntimeSummary).status || ""),
      providerContractReplayStatus:text(obj(evaluation.providerContractReplayHarnessSummary).status || ""),
      providerLaunchReadinessStatus:text(obj(evaluation.providerLaunchReadinessBoardSummary).status || ""),
      providerLaunchReadinessViewModelStatus:text(obj(evaluation.providerLaunchReadinessViewModelSummary).status || ""),
      humanApprovalSimulationStatus:text(obj(evaluation.humanApprovalSimulationGateSummary).status || ""),
      mockProviderLaunchDrillStatus:text(obj(evaluation.mockProviderLaunchDrillSummary).status || ""),
      sandboxProviderRollbackPlanStatus:text(obj(evaluation.sandboxProviderRollbackPlanSummary).status || ""),
      providerLaunchSimulationViewModelStatus:text(obj(evaluation.providerLaunchSimulationViewModelSummary).status || ""),
      providerSandboxPilotControlStatus:text(obj(evaluation.providerSandboxPilotControlRoomSummary).status || ""),
      mockProviderIncidentDrillStatus:text(obj(evaluation.mockProviderIncidentDrillSummary).status || ""),
      productionBlockerMatrixStatus:text(obj(evaluation.productionBlockerMatrixSummary).status || ""),
      providerPilotControlViewModelStatus:text(obj(evaluation.providerPilotControlViewModelSummary).status || ""),
      safeToProceedWithUserFacingHandoffExplanation:evaluation.readyOutputs.safeToProceedWithUserFacingHandoffExplanation === true,
      safeToProceedWithManualPlatformReview:evaluation.readyOutputs.safeToProceedWithManualPlatformReview === true,
      safeToProceedWithManualPlatformUserEducation:evaluation.readyOutputs.safeToProceedWithManualPlatformUserEducation === true,
      safeToProceedWithManualExternalPlatformVisitEducation:evaluation.readyOutputs.safeToProceedWithManualExternalPlatformVisitEducation === true,
      safeToProceedWithUserLeavingWeishanEducation:evaluation.readyOutputs.safeToProceedWithUserLeavingWeishanEducation === true,
      safeToProceedWithReadOnlySessionClosureEducation:evaluation.readyOutputs.safeToProceedWithReadOnlySessionClosureEducation === true,
      safeToProceedWithReadOnlyProviderSandboxPlanning:evaluation.readyOutputs.safeToProceedWithReadOnlyProviderSandboxPlanning === true,
      safeToProceedWithProviderLegalAndCredentialReview:evaluation.readyOutputs.safeToProceedWithProviderLegalAndCredentialReview === true,
      safeToProceedWithProviderSandboxContractImplementation:evaluation.readyOutputs.safeToProceedWithProviderSandboxContractImplementation === true,
      safeToProceedWithMockAdapterRuntimeHardening:evaluation.readyOutputs.safeToProceedWithMockAdapterRuntimeHardening === true,
      safeToProceedWithHumanProviderSandboxApproval:evaluation.readyOutputs.safeToProceedWithHumanProviderSandboxApproval === true,
      safeToProceedWithHumanControlledSandboxProviderPilot:evaluation.readyOutputs.safeToProceedWithHumanControlledSandboxProviderPilot === true,
      safeToProceedWithHumanControlledSandboxProviderPilotPlan:evaluation.readyOutputs.safeToProceedWithHumanControlledSandboxProviderPilotPlan === true,
      redacted:true
    });
  }
  function buildGlobalShoppingPricePipelineOrchestrator(input) {
    try {
      return sanitizeGlobalShoppingPricePipelineOrchestrator(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingPricePipelineOrchestrator({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingPricePipelineOrchestratorAuditDraft(input) {
    const orchestrator = buildGlobalShoppingPricePipelineOrchestrator(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PRICE_PIPELINE_ORCHESTRATOR_AUDIT_DRAFT",
      orchestratorName:ORCHESTRATOR_NAME,
      appVersion:GLOBAL_SHOPPING_PRICE_PIPELINE_ORCHESTRATOR_VERSION,
      status:orchestrator.status,
      stageCount:orchestrator.pipelineStages.length,
      blockedReasons:orchestrator.blockedReasons,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      fileWrite:false,
      download:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingPricePipelineOrchestrator = {
    GLOBAL_SHOPPING_PRICE_PIPELINE_ORCHESTRATOR_VERSION,
    ORCHESTRATOR_NAME,
    buildGlobalShoppingPricePipelineOrchestrator,
    evaluateGlobalShoppingPricePipeline,
    buildGlobalShoppingPricePipelineRows,
    buildGlobalShoppingPricePipelineOrchestratorAuditDraft,
    sanitizeGlobalShoppingPricePipelineOrchestrator
  };
})();
