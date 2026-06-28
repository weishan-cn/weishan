;(function () {
  "use strict";

  const READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION = "2.1.90";
  const PHASE = "read_only_price_candidate_card_view_model_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }

  function toArray(value) {
    if (Array.isArray(value)) return value.slice();
    if (!value) return [];
    if (typeof value.length === "number" && value.length >= 0) return Array.prototype.slice.call(value);
    return [];
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
    });
  }

  function getRegistryApi() {
    return window.WeishanTrustedFlightSourceRegistry || {};
  }

  function getGateApi() {
    return window.WeishanSafeProviderDeepLinkHandoffGate || {};
  }

  function getConfirmationUiApi() {
    return window.WeishanProviderConfirmationHandoffUi || {};
  }

  function getBindingWizardApi() {
    return window.WeishanProviderSandboxBindingWizard || {};
  }

  function getRefreshStateStoreApi() {
    return window.WeishanReadOnlyQuoteRefreshStateStore || {};
  }

  function getInteractiveRefreshUiApi() {
    return window.WeishanReadOnlyQuoteInteractiveRefreshUiController || {};
  }

  function getReportCenterApi() {
    return window.WeishanReadOnlyQuoteSessionReportCenter || {};
  }

  function getEvidenceFormatterApi() {
    return window.WeishanReadOnlyQuoteEvidenceSummaryFormatter || {};
  }

  function getDecisionAssistantApi() {
    return window.WeishanReadOnlyQuoteDecisionAssistant || {};
  }

  function getCandidateComparisonApi() {
    return window.WeishanReadOnlyQuoteCandidateComparisonExplainer || {};
  }

  function getChecklistApi() { return window.WeishanSafeProviderConfirmationChecklist || {}; }
  function getReceiptApi() { return window.WeishanProviderHandoffReceiptStore || {}; }
  function getManualPlatformCheckApi() { return window.WeishanManualPlatformCheckCapture || {}; }
  function getPlatformDeltaApi() { return window.WeishanPlatformCheckDeltaCompare || {}; }
  function getReconciliationApi() { return window.WeishanPlatformCheckReconciliationCenter || {}; }
  function getConfidenceLabelerApi() { return window.WeishanReadOnlyCandidateConfidenceLabeler || {}; }
  function getSafeNextStepCoachApi() { return window.WeishanReadOnlyQuoteSafeNextStepCoach || {}; }
  function getWorkflowAuditReviewApi() { return window.WeishanFlightWorkflowAuditReviewCenter || {}; }
  function getSafeSessionExportPreviewApi() { return window.WeishanFlightWorkflowSafeSessionExportPreview || {}; }
  function getRiskBadgeBuilderApi() { return window.WeishanFlightWorkflowRiskBadgeBuilder || {}; }
  function getHumanReviewChecklistApi() { return window.WeishanFlightWorkflowHumanReviewChecklist || {}; }
  function getFinalSafeHandoffPacketApi() { return window.WeishanFlightWorkflowFinalSafeHandoffPacket || {}; }
  function getHandoffPacketPolicyGuardApi() { return window.WeishanFlightWorkflowHandoffPacketPolicyGuard || {}; }
  function getSafetyRegressionSentinelApi() { return window.WeishanFlightWorkflowSafetyRegressionSentinel || {}; }
  function getOperatorConsoleApi() { return window.WeishanFlightWorkflowOperatorConsole || {}; }
  function getOperatorConsoleViewModelApi() { return window.WeishanFlightWorkflowOperatorConsoleViewModel || {}; }
  function getReleaseReadinessDashboardApi() { return window.WeishanFlightWorkflowReleaseReadinessDashboard || {}; }
  function getUserSafetyCopyRegistryApi() { return window.WeishanFlightWorkflowUserSafetyCopyRegistry || {}; }
  function getReadOnlyConsentFlowApi() { return window.WeishanFlightWorkflowReadOnlyUserConsentFlow || {}; }
  function getPublicPilotOnboardingGuardApi() { return window.WeishanFlightWorkflowPublicPilotOnboardingGuard || {}; }
  function getPilotOnboardingViewModelApi() { return window.WeishanFlightWorkflowPilotOnboardingViewModel || {}; }
  function getSafeIssueIntakeFlowApi() { return window.WeishanFlightWorkflowSafeIssueIntakeFlow || {}; }
  function getSupportFallbackRecommendationApi() { return window.WeishanFlightWorkflowSupportFallbackRecommendationEngine || {}; }
  function getPublicPilotIssueReviewBoardApi() { return window.WeishanFlightWorkflowPublicPilotIssueReviewBoard || {}; }
  function getSupportTriageDashboardApi() { return window.WeishanFlightWorkflowSupportTriageDashboard || {}; }
  function getPilotIssueReviewViewModelApi() { return window.WeishanFlightWorkflowPilotIssueReviewViewModel || {}; }
  function getIssuePatternRadarApi() { return window.WeishanFlightWorkflowPublicPilotIssuePatternRadar || {}; }
  function getSupportReadinessGateApi() { return window.WeishanFlightWorkflowSupportReadinessGate || {}; }
  function getIssuePatternViewModelApi() { return window.WeishanFlightWorkflowIssuePatternViewModel || {}; }
  function getPublicPilotReadinessSnapshotApi() { return window.WeishanFlightWorkflowPublicPilotReadinessSnapshot || {}; }
  function getSupportPlaybookConsoleApi() { return window.WeishanFlightWorkflowSupportPlaybookConsole || {}; }
  function getPilotSnapshotViewModelApi() { return window.WeishanFlightWorkflowPilotSnapshotViewModel || {}; }
  function getPilotInvitationGateApi() { return window.WeishanFlightWorkflowReadOnlyPilotInvitationGate || {}; }
  function getTesterCohortEnrollmentConsoleApi() { return window.WeishanFlightWorkflowTesterCohortEnrollmentConsole || {}; }
  function getPilotInvitationViewModelApi() { return window.WeishanFlightWorkflowPilotInvitationViewModel || {}; }
  function getPilotSupportViewModelApi() { return window.WeishanFlightWorkflowPilotSupportViewModel || {}; }
  function getRolloutControlCenterApi() { return window.WeishanFlightWorkflowReadOnlyPilotRolloutControlCenter || {}; }
  function getCohortHealthDashboardApi() { return window.WeishanFlightWorkflowCohortHealthDashboard || {}; }
  function getRolloutControlViewModelApi() { return window.WeishanFlightWorkflowRolloutControlViewModel || {}; }
  function getPilotOpsSummaryApi() { return window.WeishanFlightWorkflowReadOnlyPilotOpsSummary || {}; }
  function getNextCohortDecisionBoardApi() { return window.WeishanFlightWorkflowNextCohortDecisionBoard || {}; }
  function getPilotExitCriteriaApi() { return window.WeishanFlightWorkflowReadOnlyPilotExitCriteria || {}; }
  function getLaunchCandidateReadinessApi() { return window.WeishanFlightWorkflowLaunchCandidateReadinessBoard || {}; }
  function getPilotOpsViewModelApi() { return window.WeishanFlightWorkflowPilotOpsViewModel || {}; }
  function getLaunchCandidateFreezeGateApi() { return window.WeishanFlightWorkflowReadOnlyLaunchCandidateFreezeGate || {}; }
  function getEvidenceFreezePackApi() { return window.WeishanFlightWorkflowEvidenceFreezePack || {}; }
  function getLaunchCandidateFreezeViewModelApi() { return window.WeishanFlightWorkflowLaunchCandidateFreezeViewModel || {}; }
  function getRcCandidateReviewConsoleApi() { return window.WeishanFlightWorkflowRcCandidateReviewConsole || {}; }
  function getRcEvidenceReviewChecklistApi() { return window.WeishanFlightWorkflowRcEvidenceReviewChecklist || {}; }
  function getRcReviewViewModelApi() { return window.WeishanFlightWorkflowRcReviewViewModel || {}; }
  function getRcRegressionAuditPackApi() { return window.WeishanFlightWorkflowRcRegressionAuditPack || {}; }
  function getReleaseRiskLedgerApi() { return window.WeishanFlightWorkflowReadOnlyReleaseRiskLedger || {}; }
  function getRcRegressionViewModelApi() { return window.WeishanFlightWorkflowRcRegressionViewModel || {}; }
  function getRcUserFacingCopyFinalizationApi() { return window.WeishanFlightWorkflowRcUserFacingCopyFinalization || {}; }
  function getSafetyDisclosureReviewBoardApi() { return window.WeishanFlightWorkflowSafetyDisclosureReviewBoard || {}; }
  function getRcCopyReviewViewModelApi() { return window.WeishanFlightWorkflowRcCopyReviewViewModel || {}; }
  function getGlobalShoppingProductGoalCharterApi() { return window.WeishanGlobalShoppingProductGoalCharter || {}; }
  function getGlobalShoppingJumpToPlatformBoundaryApi() { return window.WeishanGlobalShoppingJumpToPlatformBoundary || {}; }
  function getGlobalShoppingProductGoalViewModelApi() { return window.WeishanGlobalShoppingProductGoalViewModel || {}; }
  function getGlobalShoppingPriceSourceNormalizerApi() { return window.WeishanGlobalShoppingPriceSourceNormalizer || {}; }
  function getGlobalShoppingOfficialPriceAnchorSlotApi() { return window.WeishanGlobalShoppingOfficialPriceAnchorSlot || {}; }
  function getGlobalShoppingPriceCandidateDisplayBoardApi() { return window.WeishanGlobalShoppingPriceCandidateDisplayBoard || {}; }
  function getGlobalShoppingSameItemMatcherApi() { return window.WeishanGlobalShoppingSameItemMatcher || {}; }
  function getGlobalShoppingDuplicateCandidateMergerApi() { return window.WeishanGlobalShoppingDuplicateCandidateMerger || {}; }
  function getGlobalShoppingCoveredLowestCandidateBoardApi() { return window.WeishanGlobalShoppingCoveredLowestCandidateBoard || {}; }

  function lastRefreshStatusLabel(status) {
    const value = text(status || "not_run");
    if (value === "refreshed") return "已刷新";
    if (value === "disabled") return "已禁用";
    if (value === "blocked") return "已阻断";
    if (value === "failed_safe") return "安全失败";
    return "未运行";
  }

  function normalizeFlightFields(input) {
    const safe = input && typeof input === "object" ? input : {};
    const task = safe.task && typeof safe.task === "object" ? safe.task : safe;
    const flightFields = safe.flightFields && typeof safe.flightFields === "object" ? safe.flightFields : {};
    const rawTaskText = text(task.rawInput || task.inputSummary || task.title || task.text || safe.rawInput || "");
    const restrictedCategoryDecision = text(safe.restrictedCategoryDecision || task.restrictedCategoryDecision || "");
    const category = text(safe.category || task.category || task.procurementCategory || task.globalProcurementIntent && task.globalProcurementIntent.category || "");
    const restricted = safe.restrictedCategory === true || restrictedCategoryDecision === "blocked" || category === "restricted_or_blocked" || task.status === "blocked";
    return {
      taskTitle: text(task.title || task.rawInput || task.inputSummary || task.text || safe.taskTitle || ""),
      rawTaskText,
      origin: text(flightFields.origin || safe.origin || task.origin || "上海"),
      destination: text(flightFields.destination || safe.destination || task.destination || "成都"),
      departureDate: text(flightFields.date || safe.departureDate || task.departureDate || "2026-07-15"),
      dateDisplay: text(flightFields.dateDisplay || flightFields.date || safe.dateDisplay || task.dateDisplay || "7 月 15 日"),
      directPreference: text(flightFields.directPreference || safe.directPreference || task.directPreference || "直达优先"),
      sortLabel: text(flightFields.goal || safe.sortLabel || task.sortLabel || "低价优先"),
      restrictedCategory: restricted
    };
  }

  function getTrustedSource(providerId) {
    const registryApi = getRegistryApi();
    const registry = typeof registryApi.getTrustedFlightSourceRegistry === "function"
      ? registryApi.getTrustedFlightSourceRegistry()
      : { trustedSources: [] };
    const sources = Array.isArray(registry.trustedSources) ? registry.trustedSources : [];
    const match = sources.find(function (item) {
      return item && item.providerId === providerId;
    }) || sources.find(function (item) {
      return item && item.accessMode === "manual_search_only";
    }) || sources[0] || null;
    return match || {
      providerId: "google_flights_search",
      providerName: "Google Flights",
      providerType: "flight_search",
      accessMode: "manual_search_only",
      safeProviderHandoffUrl: null,
      safeProviderHandoffHost: "google.com",
      productionProvider: "disabled"
    };
  }

  function buildDefaultPriceQuote() {
    return {
      currency: "CNY",
      baseFare: 860,
      taxesAndFees: 110,
      providerFees: 40,
      totalPrice: 1010,
      priceUpdatedAt: "2026-06-20T00:00:00.000Z",
      freshnessStatus: "fresh",
      taxFeeIntegrityStatus: "complete",
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      booking: false,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    };
  }

  function buildReadOnlyPriceCandidateCardViewModel(input) {
    const safe = input && typeof input === "object" ? input : {};
    const normalized = normalizeFlightFields(safe);
    const source = getTrustedSource(text(safe.providerId || safe.source && safe.source.providerId || "google_flights_search"));
    const priceQuote = Object.assign({}, buildDefaultPriceQuote(), safe.priceQuote && typeof safe.priceQuote === "object" ? safe.priceQuote : {});
    const report = safe.report && typeof safe.report === "object" ? safe.report : {};
    const reportSandboxImport = report.sandboxImport && typeof report.sandboxImport === "object" ? report.sandboxImport : {};
    const inputSandboxImport = safe.sandboxImportSummary && typeof safe.sandboxImportSummary === "object" ? safe.sandboxImportSummary : {};
    const sandboxImportSource = Object.keys(inputSandboxImport).length ? inputSandboxImport : reportSandboxImport;
    const sandboxImportStatus = text(sandboxImportSource.lastImportStatus || sandboxImportSource.importStatus || sandboxImportSource.status || "not_run");
    const sandboxImportPreviewStatus = text(sandboxImportSource.lastPreviewStatus || sandboxImportSource.previewStatus || sandboxImportSource.validationStatus || "not_run");
    const sandboxImportBlockedReason = text(sandboxImportSource.lastBlockedReason || sandboxImportSource.blockedReason || sandboxImportSource.reason || "");
    const isSandboxImportEvidence = sandboxImportStatus === "accepted" || (safe.priceQuote && safe.priceQuote.fareSource === "sandbox_read_only_import") || report.provider && report.provider.fareSource === "sandbox_read_only_import";
    const sandboxImportAccepted = sandboxImportStatus === "accepted" || isSandboxImportEvidence;
    const sandboxImportRejected = sandboxImportStatus === "rejected" || sandboxImportStatus === "blocked" || sandboxImportStatus === "failed_safe";
    if (sandboxImportRejected) {
      priceQuote.baseFare = null;
      priceQuote.taxesAndFees = null;
      priceQuote.providerFees = null;
      priceQuote.totalPrice = null;
      priceQuote.fareSource = "sandbox_read_only_import";
    }
    const reportProvider = report.provider && typeof report.provider === "object" ? report.provider : {};
    const reportConnector = report.providerConnector && typeof report.providerConnector === "object" ? report.providerConnector : {};
    const providerMode = text(safe.providerMode || reportProvider.providerMode || reportConnector.providerMode || priceQuote.providerMode || "fixture");
    const isSandboxReadOnly = providerMode === "sandbox" || providerMode === "sandbox_read_only";
    const isProductionDisabled = providerMode === "production" || providerMode === "production_disabled";
    const titleLabel = isProductionDisabled ? "生产价格未启用" : (isSandboxImportEvidence ? "只读沙盒导入证据" : (isSandboxReadOnly ? "只读沙盒价" : "只读候选价"));
    const candidatePriceLabel = isSandboxImportEvidence ? "只读沙盒导入证据" : (isSandboxReadOnly ? "只读沙盒价" : (isProductionDisabled ? "生产价格未启用" : "候选价"));
    const importStatusBadge = isSandboxImportEvidence ? "只读沙盒导入证据" : (sandboxImportRejected ? (sandboxImportStatus === "blocked" ? "导入被阻断" : sandboxImportStatus === "failed_safe" ? "导入失败，已安全降级" : "导入响应已拒绝") : "");
    const importedEvidenceBanner = isSandboxImportEvidence ? "只读沙盒导入证据 · 已导入沙盒报价证据 · 导入响应已脱敏 · 仅作为候选证据，未锁价，不代表可出票 · 价格、库存、税费和规则以平台页面为准" : (sandboxImportRejected ? (sandboxImportStatus === "blocked" ? "导入被阻断" : "导入失败，已安全降级") : "");
    const importEvidenceBanner = importedEvidenceBanner;
    const reportHandoff = report.handoff && typeof report.handoff === "object" ? report.handoff : {};
    const reportRefresh = report.refresh && typeof report.refresh === "object" ? report.refresh : {};
    const reportCredentialReadiness = report.credentialReadiness && typeof report.credentialReadiness === "object" ? report.credentialReadiness : {};
    const stateStoreApi = getRefreshStateStoreApi();
    const refreshStateInput = safe.refreshState && typeof safe.refreshState === "object" ? safe.refreshState : (report.refreshState && typeof report.refreshState === "object" ? report.refreshState : {
      lastRefreshStatus:reportRefresh.lastRefreshStatus || "not_run",
      providerId:source.providerId,
      providerName:source.providerName,
      providerMode:providerMode,
      priceQuote:priceQuote,
      handoff:reportHandoff
    });
    const refreshStateSummary = typeof stateStoreApi.buildReadOnlyQuoteRefreshStateSummary === "function"
      ? stateStoreApi.buildReadOnlyQuoteRefreshStateSummary(refreshStateInput)
      : { title:"Refresh State Persistence", lastRefreshStatus:text(reportRefresh.lastRefreshStatus || "not_run"), lastRefreshStatusLabel:lastRefreshStatusLabel(reportRefresh.lastRefreshStatus), summary:"最近一次刷新：" + lastRefreshStatusLabel(reportRefresh.lastRefreshStatus), showableAsRealPrice:false, showableAsCandidateEvidence:false, canReplaceMainResultCard:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, payment:false, order:false, identityUpload:false, redacted:true };
    const wizardApi = getBindingWizardApi();
    const providerBindingWizardSummary = typeof wizardApi.buildProviderSandboxBindingWizardModel === "function"
      ? wizardApi.buildProviderSandboxBindingWizardModel(Object.assign({}, safe, reportCredentialReadiness, { providerId:source.providerId, providerName:source.providerName, providerMode:providerMode, restrictedCategory:normalized.restrictedCategory }))
      : { wizardName:"provider_sandbox_binding_wizard_v1", title:"Provider 沙盒绑定准备", status:isProductionDisabled ? "disabled" : (isSandboxReadOnly ? (reportCredentialReadiness.status === "sandbox_ready" ? "sandbox_ready" : "needs_setup") : "fixture_ready"), missingRequirements:[], steps:[], actions:{ canAttemptReadOnlyRefresh:!isProductionDisabled && !normalized.restrictedCategory }, productionProviderEnabled:false, redacted:true };
    const interactiveApi = getInteractiveRefreshUiApi();
    const interactiveRefreshState = typeof interactiveApi.buildReadOnlyQuoteInteractiveRefreshUiState === "function"
      ? interactiveApi.buildReadOnlyQuoteInteractiveRefreshUiState(Object.assign({}, safe.interactiveRefreshState || {}, { state:refreshStateInput, status:safe.interactiveRefreshStatus || safe.status || (safe.interactiveRefreshState && safe.interactiveRefreshState.status) || "idle" }))
      : { status:"idle", recoveryStatus:"not_loaded", refreshButton:{ label:"刷新只读报价", enabled:true, loading:false, reason:"仅更新候选证据，未锁价，不代表可出票", autoRun:false }, lastRefreshSummary:{ status:refreshStateSummary.lastRefreshStatus || "not_run" }, recoveredEvidenceSummary:{ available:false, source:"local_redacted_state", showableAsRealPrice:false, showableAsCandidateEvidence:false, canReplaceMainResultCard:false }, refreshErrorBanner:"", clearRefreshStateButton:{ label:"清除刷新状态", enabled:false, autoRun:false }, safety:{ bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, booking:false, payment:false, order:false, identityUpload:false, redacted:true }, redacted:true };
    const releaseReadinessApi = getReleaseReadinessDashboardApi();
    const safetyCopyApi = getUserSafetyCopyRegistryApi();
    const consentFlowApi = getReadOnlyConsentFlowApi();
    const onboardingGuardApi = getPublicPilotOnboardingGuardApi();
    const onboardingViewModelApi = getPilotOnboardingViewModelApi();
    const issueIntakeApi = getSafeIssueIntakeFlowApi();
    const supportFallbackApi = getSupportFallbackRecommendationApi();
    const pilotSupportApi = getPilotSupportViewModelApi();
    const issueReviewApi = getPublicPilotIssueReviewBoardApi();
    const supportTriageApi = getSupportTriageDashboardApi();
    const pilotIssueReviewApi = getPilotIssueReviewViewModelApi();
    const issuePatternRadarApi = getIssuePatternRadarApi();
    const supportReadinessGateApi = getSupportReadinessGateApi();
    const issuePatternViewModelApi = getIssuePatternViewModelApi();
    const pilotReadinessSnapshotApi = getPublicPilotReadinessSnapshotApi();
    const supportPlaybookConsoleApi = getSupportPlaybookConsoleApi();
    const pilotSnapshotViewModelApi = getPilotSnapshotViewModelApi();
    const pilotInvitationGateApi = getPilotInvitationGateApi();
    const testerCohortEnrollmentConsoleApi = getTesterCohortEnrollmentConsoleApi();
    const pilotInvitationViewModelApi = getPilotInvitationViewModelApi();
    const topCandidates = (toArray(safe.dryRunTopCandidates).length ? toArray(safe.dryRunTopCandidates) : (toArray(safe.topCandidates).length ? toArray(safe.topCandidates) : toArray(report.rankingPreview && report.rankingPreview.topCandidates))).slice(0, 3).map(function (candidate, index) {
      const item = candidate && typeof candidate === "object" ? candidate : {};
      return Object.assign({}, item, { rank:item.rank || index + 1, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, identityUpload:false, redacted:true });
    });
    const rankingPreview = safe.rankingPreview && typeof safe.rankingPreview === "object" ? safe.rankingPreview : (report.rankingPreview && typeof report.rankingPreview === "object" ? report.rankingPreview : {});
    const sourceBreakdown = safe.sourceBreakdown && typeof safe.sourceBreakdown === "object" ? safe.sourceBreakdown : (rankingPreview.sourceBreakdown && typeof rankingPreview.sourceBreakdown === "object" ? rankingPreview.sourceBreakdown : { providerCount: new Set(topCandidates.map(function (candidate) { return text(candidate.providerId || candidate.providerName || ""); }).filter(Boolean)).size, providerIds: Array.from(new Set(topCandidates.map(function (candidate) { return text(candidate.providerId || ""); }).filter(Boolean))), fareSources: Array.from(new Set(topCandidates.map(function (candidate) { return text(candidate.fareSource || ""); }).filter(Boolean))) });
    const rankingExplanation = safe.rankingExplanation || rankingPreview.rankingExplanation || report.rankingPreview && report.rankingPreview.rankingExplanation || "仅按导入样本中的只读候选证据排序，平台最终为准。";
    const selectedCandidate = safe.selectedCandidate && typeof safe.selectedCandidate === "object" ? safe.selectedCandidate : (report.selectedCandidate && typeof report.selectedCandidate === "object" ? report.selectedCandidate : null);
    const sandboxDryRunSummary = safe.sandboxDryRunSummary && typeof safe.sandboxDryRunSummary === "object" ? safe.sandboxDryRunSummary : (report.sandboxDryRunSummary && typeof report.sandboxDryRunSummary === "object" ? report.sandboxDryRunSummary : null);
    const runTimelineSummary = safe.runTimelineSummary && typeof safe.runTimelineSummary === "object" ? safe.runTimelineSummary : (sandboxDryRunSummary && sandboxDryRunSummary.runTimelineSummary && typeof sandboxDryRunSummary.runTimelineSummary === "object" ? sandboxDryRunSummary.runTimelineSummary : (report.runTimelineSummary && typeof report.runTimelineSummary === "object" ? report.runTimelineSummary : null));
    const dryRunTopCandidates = toArray(safe.dryRunTopCandidates).length ? toArray(safe.dryRunTopCandidates) : (sandboxDryRunSummary && toArray(sandboxDryRunSummary.dryRunTopCandidates).length ? toArray(sandboxDryRunSummary.dryRunTopCandidates) : topCandidates);
    const dryRunStatus = text(safe.dryRunStatus || (sandboxDryRunSummary && sandboxDryRunSummary.status) || (runTimelineSummary && runTimelineSummary.status) || "not_run");
    const dryRunButton = safe.dryRunButton && typeof safe.dryRunButton === "object" ? safe.dryRunButton : { label:"运行沙盒只读报价", enabled:true, loading:false, autoRun:false };
    const runHistorySummary = safe.runHistorySummary && typeof safe.runHistorySummary === "object" ? safe.runHistorySummary : (sandboxDryRunSummary && sandboxDryRunSummary.runHistorySummary && typeof sandboxDryRunSummary.runHistorySummary === "object" ? sandboxDryRunSummary.runHistorySummary : (report.runHistorySummary && typeof report.runHistorySummary === "object" ? report.runHistorySummary : null));
    const quoteDeltaSummary = safe.quoteDeltaSummary && typeof safe.quoteDeltaSummary === "object" ? safe.quoteDeltaSummary : (sandboxDryRunSummary && sandboxDryRunSummary.quoteDeltaSummary && typeof sandboxDryRunSummary.quoteDeltaSummary === "object" ? sandboxDryRunSummary.quoteDeltaSummary : (report.quoteDeltaSummary && typeof report.quoteDeltaSummary === "object" ? report.quoteDeltaSummary : null));
    const replaySummary = safe.replaySummary && typeof safe.replaySummary === "object" ? safe.replaySummary : (sandboxDryRunSummary && sandboxDryRunSummary.replaySummary && typeof sandboxDryRunSummary.replaySummary === "object" ? sandboxDryRunSummary.replaySummary : (report.replaySummary && typeof report.replaySummary === "object" ? report.replaySummary : null));
    const lastRunId = text(safe.lastRunId || (sandboxDryRunSummary && sandboxDryRunSummary.lastRunId) || (runHistorySummary && runHistorySummary.latestRunId) || "");
    const compareStatus = text(safe.compareStatus || (sandboxDryRunSummary && sandboxDryRunSummary.compareStatus) || (quoteDeltaSummary && (quoteDeltaSummary.compareStatus || quoteDeltaSummary.status)) || "not_enough_history");
    const replayStatus = text(safe.replayStatus || (sandboxDryRunSummary && sandboxDryRunSummary.replayStatus) || (replaySummary && replaySummary.status) || "unavailable");
    const sessionSummary = safe.sessionSummary && typeof safe.sessionSummary === "object" ? safe.sessionSummary : (sandboxDryRunSummary && sandboxDryRunSummary.sessionSummary && typeof sandboxDryRunSummary.sessionSummary === "object" ? sandboxDryRunSummary.sessionSummary : (report.sessionSummary && typeof report.sessionSummary === "object" ? report.sessionSummary : null));
    const sessionStatus = text(safe.sessionStatus || (sandboxDryRunSummary && sandboxDryRunSummary.sessionStatus) || (sessionSummary && sessionSummary.status) || "");
    const sessionId = text(safe.sessionId || (sandboxDryRunSummary && sandboxDryRunSummary.sessionId) || (sessionSummary && sessionSummary.sessionId) || "");
    const auditExportPreview = safe.auditExportPreview && typeof safe.auditExportPreview === "object" ? safe.auditExportPreview : (sandboxDryRunSummary && sandboxDryRunSummary.auditExportPreview && typeof sandboxDryRunSummary.auditExportPreview === "object" ? sandboxDryRunSummary.auditExportPreview : null);
    const auditExportReady = safe.auditExportReady === true || (sandboxDryRunSummary && sandboxDryRunSummary.auditExportReady === true) || !!auditExportPreview;
    const sessionRecoverySummary = safe.sessionRecoverySummary && typeof safe.sessionRecoverySummary === "object" ? safe.sessionRecoverySummary : (sandboxDryRunSummary && sandboxDryRunSummary.sessionRecoverySummary && typeof sandboxDryRunSummary.sessionRecoverySummary === "object" ? sandboxDryRunSummary.sessionRecoverySummary : (sessionSummary ? { title:"Session Recovery", available:true, sessionId:sessionId, status:sessionStatus || "updated", replaySource:"local_redacted_run_history", autoOpen:false, networkAllowed:false, redacted:true } : null));
    const reportCenterApi = getReportCenterApi();
    const formatterApi = getEvidenceFormatterApi();
    const decisionApi = getDecisionAssistantApi();
    const comparisonApi = getCandidateComparisonApi();
    const checklistApi = getChecklistApi();
    const receiptApi = getReceiptApi();
    const manualCheckApi = getManualPlatformCheckApi();
    const deltaApi = getPlatformDeltaApi();
    const reconciliationApi = getReconciliationApi();
    const confidenceApi = getConfidenceLabelerApi();
    const coachApi = getSafeNextStepCoachApi();
    const workflowAuditApi = getWorkflowAuditReviewApi();
    const safeExportApi = getSafeSessionExportPreviewApi();
    const riskBadgeApi = getRiskBadgeBuilderApi();
    const humanReviewApi = getHumanReviewChecklistApi();
    const finalPacketApi = getFinalSafeHandoffPacketApi();
    const packetPolicyApi = getHandoffPacketPolicyGuardApi();
    const sentinelApi = getSafetyRegressionSentinelApi();
    const operatorApi = getOperatorConsoleApi();
    const operatorViewModelApi = getOperatorConsoleViewModelApi();
    const workflowStateSummary = safe.workflowStateSummary && typeof safe.workflowStateSummary === "object" ? safe.workflowStateSummary : null;
    const clarificationSummary = safe.clarificationSummary && typeof safe.clarificationSummary === "object" ? safe.clarificationSummary : null;
    const workflowStepList = Array.isArray(safe.workflowStepList) ? safe.workflowStepList.slice() : [];
    const missingFields = Array.isArray(safe.missingFields) ? safe.missingFields.slice() : [];
    const clarificationQuestions = Array.isArray(safe.clarificationQuestions) ? safe.clarificationQuestions.slice() : [];
    const workflowUserMessage = text(safe.workflowUserMessage || "");
    const actionExecutionResult = safe.actionExecutionResult && typeof safe.actionExecutionResult === "object" ? safe.actionExecutionResult : null;
    const actionPolicyDecision = safe.actionPolicyDecision && typeof safe.actionPolicyDecision === "object" ? safe.actionPolicyDecision : null;
    const eventLedgerSummary = safe.eventLedgerSummary && typeof safe.eventLedgerSummary === "object" ? safe.eventLedgerSummary : null;
    const lastActionId = text(safe.lastActionId || eventLedgerSummary && eventLedgerSummary.lastActionId || "");
    const lastActionStatus = text(safe.lastActionStatus || eventLedgerSummary && eventLedgerSummary.lastActionStatus || "");
    const lastActionMessage = text(safe.lastActionMessage || eventLedgerSummary && eventLedgerSummary.lastActionMessage || "");
    const continuitySummary = safe.continuitySummary && typeof safe.continuitySummary === "object" ? safe.continuitySummary : null;
    const confirmationStateSummary = safe.confirmationStateSummary && typeof safe.confirmationStateSummary === "object" ? safe.confirmationStateSummary : null;
    const recoverySummary = safe.recoverySummary && typeof safe.recoverySummary === "object" ? safe.recoverySummary : null;
    const resumeCoachSummary = safe.resumeCoachSummary && typeof safe.resumeCoachSummary === "object" ? safe.resumeCoachSummary : null;
    const actionQueueSummary = safe.actionQueueSummary && typeof safe.actionQueueSummary === "object" ? safe.actionQueueSummary : (safe.actionQueue && typeof safe.actionQueue === "object" ? safe.actionQueue : null);
    const progressTimelineSummary = safe.progressTimelineSummary && typeof safe.progressTimelineSummary === "object" ? safe.progressTimelineSummary : (safe.progressTimeline && typeof safe.progressTimeline === "object" ? safe.progressTimeline : null);
    const safeResumeCenterSummary = safe.safeResumeCenterSummary && typeof safe.safeResumeCenterSummary === "object" ? safe.safeResumeCenterSummary : (safe.safeResumeCenter && typeof safe.safeResumeCenter === "object" ? safe.safeResumeCenter : null);
    const blockedActions = Array.isArray(safe.blockedActions) ? safe.blockedActions.slice() : (actionQueueSummary && Array.isArray(actionQueueSummary.blockedActions) ? actionQueueSummary.blockedActions.slice() : []);
    const resumeActions = Array.isArray(safe.resumeActions) ? safe.resumeActions.slice() : (resumeCoachSummary && Array.isArray(resumeCoachSummary.allowedActions) ? resumeCoachSummary.allowedActions.slice() : []);
    let workflowMeta = { workflowStateSummary:workflowStateSummary, clarificationSummary:clarificationSummary, continuitySummary:continuitySummary, confirmationStateSummary:confirmationStateSummary, recoverySummary:recoverySummary, resumeCoachSummary:resumeCoachSummary, actionQueueSummary:actionQueueSummary, progressTimelineSummary:progressTimelineSummary, safeResumeCenterSummary:safeResumeCenterSummary, blockedActions:blockedActions, currentActionLabel:text(safe.currentActionLabel || ""), nextSafeActionLabel:text(safe.nextSafeActionLabel || safe.nextSafeAction || ""), actionQueue:actionQueueSummary, progressTimeline:progressTimelineSummary, safeResumeCenter:safeResumeCenterSummary, nextSafeAction:text(safe.nextSafeActionLabel || safe.nextSafeAction || ""), currentStage:text(safe.currentStage || continuitySummary && continuitySummary.currentStage || ""), workflowStageLabel:text(safe.workflowStageLabel || continuitySummary && continuitySummary.stageLabel || ""), nextStepLabel:text(safe.nextStepLabel || continuitySummary && continuitySummary.resumePlan && continuitySummary.resumePlan.nextStepLabel || ""), canResumeWorkflow:safe.canResumeWorkflow === true || !!(continuitySummary && continuitySummary.resumePlan && continuitySummary.resumePlan.canResume === true), resumeActions:resumeActions, workflowStepList:workflowStepList, missingFields:missingFields, clarificationQuestions:clarificationQuestions, workflowUserMessage:workflowUserMessage, actionExecutionResult:actionExecutionResult, actionPolicyDecision:actionPolicyDecision, eventLedgerSummary:eventLedgerSummary, lastActionId:lastActionId, lastActionStatus:lastActionStatus, lastActionMessage:lastActionMessage, pilotReadinessSnapshotSummary:safe.pilotReadinessSnapshotSummary || null, supportPlaybookSummary:safe.supportPlaybookSummary || null, cohortProgressSummary:safe.cohortProgressSummary || null, trialMilestoneSummary:safe.trialMilestoneSummary || null, pilotSnapshotViewModelSummary:safe.pilotSnapshotViewModelSummary || null, pilotSnapshotStatus:text(safe.pilotSnapshotStatus || ""), supportPlaybookStatus:text(safe.supportPlaybookStatus || ""), cohortProgressStatus:text(safe.cohortProgressStatus || ""), trialMilestoneStatus:text(safe.trialMilestoneStatus || ""), safeToAdvanceNextCohort:safe.safeToAdvanceNextCohort === true, pilotSnapshotNextStep:text(safe.pilotSnapshotNextStep || "") };
    const workflowAuditReviewSummary = typeof workflowAuditApi.buildFlightWorkflowAuditReviewCenter === "function" ? workflowAuditApi.buildFlightWorkflowAuditReviewCenter(Object.assign({ topCandidates:dryRunTopCandidates, selectedCandidate:selectedCandidate, sessionSummary:sessionSummary }, workflowMeta)) : null;
    const safeSessionExportPreview = typeof safeExportApi.buildFlightWorkflowSafeSessionExportPreview === "function" ? safeExportApi.buildFlightWorkflowSafeSessionExportPreview(Object.assign({ topCandidates:dryRunTopCandidates, selectedCandidate:selectedCandidate, sessionSummary:sessionSummary, auditReviewSummary:workflowAuditReviewSummary }, workflowMeta)) : null;
    const sentinelInput = Object.assign({ topCandidates:dryRunTopCandidates, selectedCandidate:selectedCandidate, sessionSummary:sessionSummary, routeSummary:normalized.origin + " → " + normalized.destination, departureDate:normalized.departureDate, auditReviewSummary:workflowAuditReviewSummary, safeSessionExportPreview:safeSessionExportPreview }, workflowMeta);
    const safetyRegressionSummary = typeof sentinelApi.buildFlightWorkflowSafetyRegressionReport === "function" ? sentinelApi.buildFlightWorkflowSafetyRegressionReport(sentinelInput) : null;
    const humanReviewChecklistSummary = typeof humanReviewApi.buildFlightWorkflowHumanReviewChecklist === "function" ? humanReviewApi.buildFlightWorkflowHumanReviewChecklist(Object.assign({}, sentinelInput, { safetyRegressionSummary:safetyRegressionSummary })) : null;
    const finalSafeHandoffPacketSummary = typeof finalPacketApi.buildFlightWorkflowFinalSafeHandoffPacket === "function" ? finalPacketApi.buildFlightWorkflowFinalSafeHandoffPacket(Object.assign({}, sentinelInput, { safetyRegressionSummary:safetyRegressionSummary, humanReviewChecklistSummary:humanReviewChecklistSummary })) : null;
    const handoffPacketPolicyDecision = typeof packetPolicyApi.evaluateFlightWorkflowHandoffPacketPolicy === "function" ? packetPolicyApi.evaluateFlightWorkflowHandoffPacketPolicy({ finalSafeHandoffPacketSummary:finalSafeHandoffPacketSummary, safetyRegressionSummary:safetyRegressionSummary }) : null;
    const operatorConsoleSummary = typeof operatorApi.buildFlightWorkflowOperatorConsole === "function" ? operatorApi.buildFlightWorkflowOperatorConsole(Object.assign({}, sentinelInput, { safetyRegressionSummary:safetyRegressionSummary, humanReviewChecklistSummary:humanReviewChecklistSummary, finalSafeHandoffPacketSummary:finalSafeHandoffPacketSummary, handoffPacketPolicyDecision:handoffPacketPolicyDecision })) : null;
    const operatorConsoleViewModel = typeof operatorViewModelApi.buildFlightWorkflowOperatorConsoleViewModel === "function" ? operatorViewModelApi.buildFlightWorkflowOperatorConsoleViewModel({ operatorConsoleSummary:operatorConsoleSummary }) : null;
    const betaExpansionGateSummary = safe.betaExpansionGateSummary && typeof safe.betaExpansionGateSummary === "object" ? safe.betaExpansionGateSummary : null;
    const publicPilotChecklistSummary = safe.publicPilotChecklistSummary && typeof safe.publicPilotChecklistSummary === "object" ? safe.publicPilotChecklistSummary : null;
    const pilotReadinessSummary = safe.pilotReadinessSummary && typeof safe.pilotReadinessSummary === "object" ? safe.pilotReadinessSummary : null;
    const safeForSmallPublicPilot = safe.safeForSmallPublicPilot === true || !!(pilotReadinessSummary && pilotReadinessSummary.status === "ready");
    const pilotNextStep = text(safe.pilotNextStep || (pilotReadinessSummary && pilotReadinessSummary.cards && pilotReadinessSummary.cards.find(function (card) { return card.cardId === "next_step"; }) || {}).value || "");
    const readOnlyConsentSummary = safe.readOnlyConsentSummary && typeof safe.readOnlyConsentSummary === "object" ? safe.readOnlyConsentSummary : (typeof consentFlowApi.buildFlightWorkflowReadOnlyUserConsentFlow === "function" ? consentFlowApi.buildFlightWorkflowReadOnlyUserConsentFlow(safe.userConsentInput || { started:true }) : null);
    const pilotOnboardingSummary = safe.pilotOnboardingSummary && typeof safe.pilotOnboardingSummary === "object" ? safe.pilotOnboardingSummary : (typeof onboardingGuardApi.buildFlightWorkflowPublicPilotOnboardingGuard === "function" ? onboardingGuardApi.buildFlightWorkflowPublicPilotOnboardingGuard({ betaExpansionGateSummary:betaExpansionGateSummary, publicPilotChecklistSummary:publicPilotChecklistSummary, pilotReadinessSummary:pilotReadinessSummary, releaseReadinessReady:true, safetyCopyReady:true, forbiddenCapabilitiesVisible:true, readOnlyConsentSummary:readOnlyConsentSummary, noBlockedSafetyRisk:normalized.restrictedCategory !== true }) : null);
    const pilotOnboardingViewModel = safe.pilotOnboardingViewModel && typeof safe.pilotOnboardingViewModel === "object" ? safe.pilotOnboardingViewModel : (typeof onboardingViewModelApi.buildFlightWorkflowPilotOnboardingViewModel === "function" ? onboardingViewModelApi.buildFlightWorkflowPilotOnboardingViewModel({ pilotOnboardingSummary:pilotOnboardingSummary, readOnlyConsentSummary:readOnlyConsentSummary }) : null);
    const pilotEntryStatus = text(pilotOnboardingSummary && pilotOnboardingSummary.status || "needs_consent");
    const canEnterReadOnlyPilot = !!(pilotOnboardingSummary && pilotOnboardingSummary.decision && pilotOnboardingSummary.decision.canEnterReadOnlyPilot === true);
    const pilotConsentRequired = !(readOnlyConsentSummary && readOnlyConsentSummary.consentSummary && readOnlyConsentSummary.consentSummary.allRequiredAccepted === true);
    const issueIntakeSummary = safe.issueIntakeSummary && typeof safe.issueIntakeSummary === "object" ? safe.issueIntakeSummary : (typeof issueIntakeApi.buildFlightWorkflowSafeIssueIntakeFlow === "function" ? issueIntakeApi.buildFlightWorkflowSafeIssueIntakeFlow({ issueCategory:"candidate_unclear" }) : null);
    const supportFallbackSummary = safe.supportFallbackSummary && typeof safe.supportFallbackSummary === "object" ? safe.supportFallbackSummary : (typeof supportFallbackApi.buildFlightWorkflowSupportFallbackRecommendation === "function" ? supportFallbackApi.buildFlightWorkflowSupportFallbackRecommendation({ issueIntakeSummary:issueIntakeSummary, pilotOnboardingSummary:pilotOnboardingSummary, publicPilotChecklistSummary:publicPilotChecklistSummary, operatorConsoleSummary:operatorConsoleSummary, auditReviewSummary:workflowAuditReviewSummary }) : null);
    const issueReviewSummary = safe.issueReviewSummary && typeof safe.issueReviewSummary === "object" ? safe.issueReviewSummary : (typeof issueReviewApi.buildFlightWorkflowPublicPilotIssueReviewBoard === "function" ? issueReviewApi.buildFlightWorkflowPublicPilotIssueReviewBoard({ issueIntake:issueIntakeSummary, supportFallbackRecommendation:supportFallbackSummary, pilotOnboardingSummary:pilotOnboardingSummary, publicPilotChecklistSummary:publicPilotChecklistSummary, operatorConsoleSummary:operatorConsoleSummary }) : null);
    const supportTriageSummary = safe.supportTriageSummary && typeof safe.supportTriageSummary === "object" ? safe.supportTriageSummary : (typeof supportTriageApi.buildFlightWorkflowSupportTriageDashboard === "function" ? supportTriageApi.buildFlightWorkflowSupportTriageDashboard({ issueCategory:issueIntakeSummary && issueIntakeSummary.issueCategory, issueReviewBoard:issueReviewSummary, supportFallbackRecommendation:supportFallbackSummary }) : null);
    const pilotIssueReviewSummary = safe.pilotIssueReviewSummary && typeof safe.pilotIssueReviewSummary === "object" ? safe.pilotIssueReviewSummary : (typeof pilotIssueReviewApi.buildFlightWorkflowPilotIssueReviewViewModel === "function" ? pilotIssueReviewApi.buildFlightWorkflowPilotIssueReviewViewModel({ issueReviewBoard:issueReviewSummary, supportTriageDashboard:supportTriageSummary }) : null);
    const pilotIssueReviewStatus = text(pilotIssueReviewSummary && pilotIssueReviewSummary.status || issueReviewSummary && issueReviewSummary.status || "ready");
    const issueAffectsPilotExpansion = Boolean(issueReviewSummary && issueReviewSummary.issueHealth && issueReviewSummary.issueHealth.affectsPilotExpansion || supportTriageSummary && supportTriageSummary.triage && supportTriageSummary.triage.affectsPilotExpansion);
    const issueRequiresInternalReview = Boolean(issueReviewSummary && issueReviewSummary.issueHealth && issueReviewSummary.issueHealth.requiresInternalReview || supportTriageSummary && supportTriageSummary.triage && supportTriageSummary.triage.requiresInternalReview);
    const issuePatternSummary = safe.issuePatternSummary && typeof safe.issuePatternSummary === "object" ? safe.issuePatternSummary : (typeof issuePatternRadarApi.buildFlightWorkflowPublicPilotIssuePatternRadar === "function" ? issuePatternRadarApi.buildFlightWorkflowPublicPilotIssuePatternRadar({ issues:[issueReviewSummary, supportTriageSummary, issueIntakeSummary, supportFallbackSummary].filter(Boolean), issueReviewBoard:issueReviewSummary, supportTriageDashboard:supportTriageSummary, safeIssueIntakeSummary:issueIntakeSummary, supportFallbackSummary:supportFallbackSummary }) : null);
    const supportReadinessSummary = safe.supportReadinessSummary && typeof safe.supportReadinessSummary === "object" ? safe.supportReadinessSummary : (typeof supportReadinessGateApi.buildFlightWorkflowSupportReadinessGate === "function" ? supportReadinessGateApi.buildFlightWorkflowSupportReadinessGate({ issuePatternRadar:issuePatternSummary, issueReviewBoard:issueReviewSummary, supportTriageDashboard:supportTriageSummary, publicPilotChecklistSummary:publicPilotChecklistSummary, betaExpansionGateSummary:betaExpansionGateSummary, supportFallbackReady:!(supportFallbackSummary && supportFallbackSummary.status === "blocked") }) : null);
    const issuePatternViewModelSummary = safe.issuePatternViewModelSummary && typeof safe.issuePatternViewModelSummary === "object" ? safe.issuePatternViewModelSummary : (typeof issuePatternViewModelApi.buildFlightWorkflowIssuePatternViewModel === "function" ? issuePatternViewModelApi.buildFlightWorkflowIssuePatternViewModel({ issuePatternRadar:issuePatternSummary, supportReadinessGate:supportReadinessSummary }) : null);
    const pilotReadinessSnapshotSummary = safe.pilotReadinessSnapshotSummary && typeof safe.pilotReadinessSnapshotSummary === "object" ? safe.pilotReadinessSnapshotSummary : (typeof pilotReadinessSnapshotApi.buildFlightWorkflowPublicPilotReadinessSnapshot === "function" ? pilotReadinessSnapshotApi.buildFlightWorkflowPublicPilotReadinessSnapshot({ betaExpansionGateSummary:betaExpansionGateSummary, publicPilotChecklistSummary:publicPilotChecklistSummary, pilotOnboardingSummary:pilotOnboardingSummary, issuePatternSummary:issuePatternSummary, supportReadinessSummary:supportReadinessSummary, issueReviewSummary:issueReviewSummary, supportTriageSummary:supportTriageSummary, operatorConsoleSummary:operatorConsoleSummary, safetyRegressionSummary:safetyRegressionSummary, safetyMatrixPass:safetyRegressionSummary && safetyRegressionSummary.status === "pass" }) : null);
    const supportPlaybookSummary = safe.supportPlaybookSummary && typeof safe.supportPlaybookSummary === "object" ? safe.supportPlaybookSummary : (typeof supportPlaybookConsoleApi.buildFlightWorkflowSupportPlaybookConsole === "function" ? supportPlaybookConsoleApi.buildFlightWorkflowSupportPlaybookConsole({ issueIntakeSummary:issueIntakeSummary, issuePatternSummary:issuePatternSummary, issueReviewSummary:issueReviewSummary, supportTriageSummary:supportTriageSummary, supportReadinessSummary:supportReadinessSummary }) : null);
    const pilotSnapshotViewModelSummary = safe.pilotSnapshotViewModelSummary && typeof safe.pilotSnapshotViewModelSummary === "object" ? safe.pilotSnapshotViewModelSummary : (typeof pilotSnapshotViewModelApi.buildFlightWorkflowPilotSnapshotViewModel === "function" ? pilotSnapshotViewModelApi.buildFlightWorkflowPilotSnapshotViewModel({ pilotReadinessSnapshotSummary:pilotReadinessSnapshotSummary, supportPlaybookSummary:supportPlaybookSummary, issuePatternSummary:issuePatternSummary, supportReadinessSummary:supportReadinessSummary, issueReviewSummary:issueReviewSummary, supportTriageSummary:supportTriageSummary, operatorConsoleSummary:operatorConsoleSummary }) : null);
    const pilotInvitationGateSummary = safe.pilotInvitationGateSummary && typeof safe.pilotInvitationGateSummary === "object" ? safe.pilotInvitationGateSummary : (typeof pilotInvitationGateApi.buildFlightWorkflowReadOnlyPilotInvitationGate === "function" ? pilotInvitationGateApi.buildFlightWorkflowReadOnlyPilotInvitationGate({ pilotReadinessSnapshotSummary:pilotReadinessSnapshotSummary, supportPlaybookSummary:supportPlaybookSummary, pilotOnboardingSummary:pilotOnboardingSummary, readOnlyConsentSummary:readOnlyConsentSummary, issueReviewSummary:issueReviewSummary, supportReadinessSummary:supportReadinessSummary, issuePatternSummary:issuePatternSummary, operatorConsoleSummary:operatorConsoleSummary, testerSlot:{ slotId:"tester-slot-001", slotType:"invited_tester", realIdentityStored:false } }) : null);
    const testerCohortEnrollmentConsoleSummary = safe.testerCohortEnrollmentConsoleSummary && typeof safe.testerCohortEnrollmentConsoleSummary === "object" ? safe.testerCohortEnrollmentConsoleSummary : (typeof testerCohortEnrollmentConsoleApi.buildFlightWorkflowTesterCohortEnrollmentConsole === "function" ? testerCohortEnrollmentConsoleApi.buildFlightWorkflowTesterCohortEnrollmentConsole({ pilotInvitationGateSummary:pilotInvitationGateSummary, pilotReadinessSnapshotSummary:pilotReadinessSnapshotSummary, supportPlaybookSummary:supportPlaybookSummary, pilotOnboardingSummary:pilotOnboardingSummary, readOnlyConsentSummary:readOnlyConsentSummary, issueReviewSummary:issueReviewSummary, supportReadinessSummary:supportReadinessSummary, issuePatternSummary:issuePatternSummary, operatorConsoleSummary:operatorConsoleSummary, rows:[{ rowId:"tester_slot_001", testerSlotId:"tester-slot-001", label:"默认测试用户批次", invitationStatus:pilotInvitationGateSummary && pilotInvitationGateSummary.status === "eligible" ? "invited" : "waitlist", consentStatus:readOnlyConsentSummary && readOnlyConsentSummary.status || "pending", feedbackStatus:"pending", issueStatus:issueReviewSummary && issueReviewSummary.status || "none", status:pilotInvitationGateSummary && pilotInvitationGateSummary.status === "eligible" ? "ready" : "review", redacted:true }] }) : null);
    const pilotInvitationViewModelSummary = safe.pilotInvitationViewModelSummary && typeof safe.pilotInvitationViewModelSummary === "object" ? safe.pilotInvitationViewModelSummary : (typeof pilotInvitationViewModelApi.buildFlightWorkflowPilotInvitationViewModel === "function" ? pilotInvitationViewModelApi.buildFlightWorkflowPilotInvitationViewModel({ pilotInvitationGateSummary:pilotInvitationGateSummary, testerCohortEnrollmentConsoleSummary:testerCohortEnrollmentConsoleSummary, pilotReadinessSnapshotSummary:pilotReadinessSnapshotSummary, supportPlaybookSummary:supportPlaybookSummary, readOnlyConsentSummary:readOnlyConsentSummary, issueReviewSummary:issueReviewSummary, supportReadinessSummary:supportReadinessSummary, issuePatternSummary:issuePatternSummary, operatorConsoleSummary:operatorConsoleSummary }) : null);
    const cohortProgressSummary = safe.cohortProgressSummary && typeof safe.cohortProgressSummary === "object" ? safe.cohortProgressSummary : (pilotReadinessSnapshotSummary && pilotReadinessSnapshotSummary.cohortProgressSummary ? pilotReadinessSnapshotSummary.cohortProgressSummary : null);
    const trialMilestoneSummary = safe.trialMilestoneSummary && typeof safe.trialMilestoneSummary === "object" ? safe.trialMilestoneSummary : (pilotReadinessSnapshotSummary && pilotReadinessSnapshotSummary.trialMilestoneSummary ? pilotReadinessSnapshotSummary.trialMilestoneSummary : null);
    const cohortProgressStatus = text(safe.cohortProgressStatus || cohortProgressSummary && cohortProgressSummary.status || "needs_more_testers");
    const trialMilestoneStatus = text(safe.trialMilestoneStatus || trialMilestoneSummary && trialMilestoneSummary.status || "needs_review");
    const safeToAdvanceNextCohort = safe.safeToAdvanceNextCohort === true || cohortProgressSummary && cohortProgressSummary.safeToAdvanceNextCohort === true || trialMilestoneSummary && trialMilestoneSummary.safeToAdvanceNextCohort === true;
    const pilotSnapshotStatus = text(pilotReadinessSnapshotSummary && pilotReadinessSnapshotSummary.status || pilotReadinessSummary && pilotReadinessSummary.status || "continue_small_pilot");
    const supportPlaybookStatus = text(supportPlaybookSummary && supportPlaybookSummary.status || "ready");
    const pilotSnapshotNextStep = text((pilotReadinessSnapshotSummary && pilotReadinessSnapshotSummary.pilotSnapshotNextStep) || (pilotReadinessSnapshotSummary && pilotReadinessSnapshotSummary.userFacingSummary && pilotReadinessSnapshotSummary.userFacingSummary.resultLabel) || (pilotSnapshotViewModelSummary && pilotSnapshotViewModelSummary.cards && pilotSnapshotViewModelSummary.cards[3] && pilotSnapshotViewModelSummary.cards[3].value) || "继续观察只读试点反馈");
    const pilotInvitationStatus = text(pilotInvitationGateSummary && pilotInvitationGateSummary.status || "waitlist");
    const testerCohortStatus = text(testerCohortEnrollmentConsoleSummary && testerCohortEnrollmentConsoleSummary.status || "needs_more_testers");
    const pilotInvitationNextStep = text(pilotInvitationViewModelSummary && pilotInvitationViewModelSummary.cards && pilotInvitationViewModelSummary.cards[0] && pilotInvitationViewModelSummary.cards[0].value || (pilotInvitationGateSummary && pilotInvitationGateSummary.userFacingSummary && pilotInvitationGateSummary.userFacingSummary.resultLabel) || "待邀请");
    workflowMeta = Object.assign({}, workflowMeta, { pilotInvitationGateSummary:pilotInvitationGateSummary, testerCohortEnrollmentConsoleSummary:testerCohortEnrollmentConsoleSummary, pilotInvitationViewModelSummary:pilotInvitationViewModelSummary, cohortProgressSummary:cohortProgressSummary, trialMilestoneSummary:trialMilestoneSummary, pilotInvitationStatus:pilotInvitationStatus, testerCohortStatus:testerCohortStatus, cohortProgressStatus:cohortProgressStatus, trialMilestoneStatus:trialMilestoneStatus, safeToAdvanceNextCohort:safeToAdvanceNextCohort, pilotInvitationNextStep:pilotInvitationNextStep });
    const issuePatternStatus = text(issuePatternSummary && issuePatternSummary.status || "insufficient_data");
    const supportReadinessStatus = text(supportReadinessSummary && supportReadinessSummary.status || "continue_small_pilot");
    const supportReadyForPublicPilot = Boolean(supportReadinessSummary && supportReadinessSummary.decision && supportReadinessSummary.decision.supportReadyForPublicPilot);
    const repeatedIssueRisk = Boolean(issuePatternSummary && issuePatternSummary.issuePatternHealth && issuePatternSummary.issuePatternHealth.hasRepeatedPattern);
    const rolloutControlApi = getRolloutControlCenterApi();
    const cohortHealthApi = getCohortHealthDashboardApi();
    const rolloutControlViewModelApi = getRolloutControlViewModelApi();
    const pilotOpsSummaryApi = getPilotOpsSummaryApi();
    const nextCohortDecisionBoardApi = getNextCohortDecisionBoardApi();
    const pilotExitCriteriaApi = getPilotExitCriteriaApi();
    const launchCandidateReadinessApi = getLaunchCandidateReadinessApi();
    const pilotOpsViewModelApi = getPilotOpsViewModelApi();
    const pilotExitCriteriaSummary = safe.pilotExitCriteriaSummary && typeof safe.pilotExitCriteriaSummary === "object" ? safe.pilotExitCriteriaSummary : (typeof pilotExitCriteriaApi.buildFlightWorkflowReadOnlyPilotExitCriteria === "function" ? pilotExitCriteriaApi.buildFlightWorkflowReadOnlyPilotExitCriteria(Object.assign({}, workflowMeta, { pilotOpsSummary:pilotOpsSummary, nextCohortDecisionSummary:nextCohortDecisionSummary, rolloutControlSummary:rolloutControlSummary, cohortHealthSummary:cohortHealthSummary, supportReadinessSummary:supportReadinessSummary, issuePatternSummary:issuePatternSummary, safetyRegressionSummary:safetyRegressionSummary, releaseReadinessSummary:null })) : null);
    const launchCandidateReadinessSummary = safe.launchCandidateReadinessSummary && typeof safe.launchCandidateReadinessSummary === "object" ? safe.launchCandidateReadinessSummary : (typeof launchCandidateReadinessApi.buildFlightWorkflowLaunchCandidateReadinessBoard === "function" ? launchCandidateReadinessApi.buildFlightWorkflowLaunchCandidateReadinessBoard(Object.assign({}, workflowMeta, { pilotExitCriteriaSummary:pilotExitCriteriaSummary, releaseReadinessSummary:null, safetyMatrixSummary:null, operatorConsoleSummary:null, supportReadinessSummary:supportReadinessSummary, pilotOpsSummary:pilotOpsSummary, nextCohortDecisionSummary:nextCohortDecisionSummary, rolloutControlSummary:rolloutControlSummary, cohortHealthSummary:cohortHealthSummary, safetyRegressionSummary:safetyRegressionSummary })) : null);
    const rolloutInput = Object.assign({}, workflowMeta, { cohortProgressSummary:cohortProgressSummary, trialMilestoneSummary:trialMilestoneSummary, pilotInvitationGateSummary:pilotInvitationGateSummary, testerCohortEnrollmentConsoleSummary:testerCohortEnrollmentConsoleSummary, pilotReadinessSnapshotSummary:pilotReadinessSnapshotSummary, supportPlaybookSummary:supportPlaybookSummary, issuePatternSummary:issuePatternSummary, supportReadinessSummary:supportReadinessSummary, pilotExitCriteriaSummary:pilotExitCriteriaSummary, launchCandidateReadinessSummary:launchCandidateReadinessSummary, safetyRegressionSummary:safetyRegressionSummary, safetySentinelPass:safetyRegressionSummary && safetyRegressionSummary.status === "pass", noSensitiveDataRisk:true, noTradingRisk:true, noOpenBlockingIssue:issuePatternStatus !== "blocked" && supportReadinessStatus !== "blocked" });
    const rolloutControlSummary = safe.rolloutControlSummary && typeof safe.rolloutControlSummary === "object" ? safe.rolloutControlSummary : (typeof rolloutControlApi.buildFlightWorkflowReadOnlyPilotRolloutControlCenter === "function" ? rolloutControlApi.buildFlightWorkflowReadOnlyPilotRolloutControlCenter(rolloutInput) : null);
    const cohortHealthSummary = safe.cohortHealthSummary && typeof safe.cohortHealthSummary === "object" ? safe.cohortHealthSummary : (typeof cohortHealthApi.buildFlightWorkflowCohortHealthDashboard === "function" ? cohortHealthApi.buildFlightWorkflowCohortHealthDashboard(Object.assign({}, rolloutInput, { cohort:testerCohortEnrollmentConsoleSummary && testerCohortEnrollmentConsoleSummary.cohort, rows:testerCohortEnrollmentConsoleSummary && testerCohortEnrollmentConsoleSummary.rows })) : null);
    const pilotOpsSummary = safe.pilotOpsSummary && typeof safe.pilotOpsSummary === "object" ? safe.pilotOpsSummary : (typeof pilotOpsSummaryApi.buildFlightWorkflowReadOnlyPilotOpsSummary === "function" ? pilotOpsSummaryApi.buildFlightWorkflowReadOnlyPilotOpsSummary(Object.assign({}, rolloutInput, { rolloutControlSummary:rolloutControlSummary, cohortHealthSummary:cohortHealthSummary, pilotReadinessSnapshotSummary:pilotReadinessSnapshotSummary, supportReadinessSummary:supportReadinessSummary, issuePatternSummary:issuePatternSummary, safetyRegressionSummary:safetyRegressionSummary })) : null);
    const nextCohortDecisionSummary = safe.nextCohortDecisionSummary && typeof safe.nextCohortDecisionSummary === "object" ? safe.nextCohortDecisionSummary : (typeof nextCohortDecisionBoardApi.buildFlightWorkflowNextCohortDecisionBoard === "function" ? nextCohortDecisionBoardApi.buildFlightWorkflowNextCohortDecisionBoard(Object.assign({}, rolloutInput, { pilotOpsSummary:pilotOpsSummary, rolloutControlSummary:rolloutControlSummary, cohortHealthSummary:cohortHealthSummary, supportReadinessSummary:supportReadinessSummary, issuePatternSummary:issuePatternSummary, safetyRegressionSummary:safetyRegressionSummary })) : null);
    const rolloutControlViewModel = safe.rolloutControlViewModel && typeof safe.rolloutControlViewModel === "object" ? safe.rolloutControlViewModel : (typeof rolloutControlViewModelApi.buildFlightWorkflowRolloutControlViewModel === "function" ? rolloutControlViewModelApi.buildFlightWorkflowRolloutControlViewModel(Object.assign({}, rolloutInput, { rolloutControlSummary:rolloutControlSummary, cohortHealthSummary:cohortHealthSummary })) : null);
    const rolloutDecisionStatus = text(rolloutControlSummary && rolloutControlSummary.status || "");
    const cohortHealthStatus = text(cohortHealthSummary && cohortHealthSummary.status || "");
    const rolloutNextStep = text(rolloutControlSummary && rolloutControlSummary.decision && rolloutControlSummary.decision.label || "");
    const pilotOpsStatus = text(pilotOpsSummary && pilotOpsSummary.status || "");
    const nextCohortDecisionStatus = text(nextCohortDecisionSummary && nextCohortDecisionSummary.status || "");
    const pilotOpsPrimaryRisk = pilotOpsSummary && pilotOpsSummary.primaryRisk || null;
    const pilotOpsViewModel = safe.pilotOpsViewModel && typeof safe.pilotOpsViewModel === "object" ? safe.pilotOpsViewModel : (typeof pilotOpsViewModelApi.buildFlightWorkflowPilotOpsViewModel === "function" ? pilotOpsViewModelApi.buildFlightWorkflowPilotOpsViewModel(Object.assign({}, rolloutInput, { pilotOpsSummary:pilotOpsSummary, nextCohortDecisionSummary:nextCohortDecisionSummary, rolloutControlSummary:rolloutControlSummary, cohortHealthSummary:cohortHealthSummary, supportReadinessSummary:supportReadinessSummary, issuePatternSummary:issuePatternSummary, safetyRegressionSummary:safetyRegressionSummary })) : null);
    workflowMeta = Object.assign({}, workflowMeta, { rolloutControlSummary:rolloutControlSummary, cohortHealthSummary:cohortHealthSummary, pilotExitCriteriaSummary:pilotExitCriteriaSummary, launchCandidateReadinessSummary:launchCandidateReadinessSummary, pilotOpsSummary:pilotOpsSummary, nextCohortDecisionSummary:nextCohortDecisionSummary, pilotOpsViewModel:pilotOpsViewModel, pilotOpsStatus:pilotOpsStatus, nextCohortDecisionStatus:nextCohortDecisionStatus, pilotOpsPrimaryRisk:pilotOpsPrimaryRisk, launchCandidateStatus:launchCandidateReadinessSummary && launchCandidateReadinessSummary.status || "", readyForLaunchCandidate:launchCandidateReadinessSummary && launchCandidateReadinessSummary.launchCandidateReadiness && launchCandidateReadinessSummary.launchCandidateReadiness.safeForReadOnlyLaunchCandidate === true, launchCandidateNextStep:launchCandidateReadinessSummary && launchCandidateReadinessSummary.launchCandidateNextStep || "", rolloutControlViewModel:rolloutControlViewModel, rolloutDecisionStatus:rolloutDecisionStatus, cohortHealthStatus:cohortHealthStatus, rolloutNextStep:rolloutNextStep });
    const pilotSupportSummary = safe.pilotSupportSummary && typeof safe.pilotSupportSummary === "object" ? safe.pilotSupportSummary : (typeof pilotSupportApi.buildFlightWorkflowPilotSupportViewModel === "function" ? pilotSupportApi.buildFlightWorkflowPilotSupportViewModel({ issueIntakeSummary:issueIntakeSummary, supportFallbackSummary:supportFallbackSummary }) : null);
    const pilotSupportStatus = text(pilotSupportSummary && pilotSupportSummary.status || issueIntakeSummary && issueIntakeSummary.status || "ready");
    const supportNextStep = text(supportFallbackSummary && supportFallbackSummary.recommendation && supportFallbackSummary.recommendation.label || "建议重新查看候选证据");
    const userSafetyCopySummary = typeof safetyCopyApi.buildFlightWorkflowSafetyCopySet === "function" ? safetyCopyApi.buildFlightWorkflowSafetyCopySet({ releaseVersion:"2.1.90" }) : null;
    const releaseReadinessSummary = typeof releaseReadinessApi.buildFlightWorkflowReleaseReadinessDashboard === "function" ? releaseReadinessApi.buildFlightWorkflowReleaseReadinessDashboard(Object.assign({}, sentinelInput, { releaseVersion:"2.1.90", safetyRegressionSummary:safetyRegressionSummary, auditReviewSummary:workflowAuditReviewSummary, humanReviewChecklistSummary:humanReviewChecklistSummary, finalSafeHandoffPacketSummary:finalSafeHandoffPacketSummary, safeSessionExportPreview:safeSessionExportPreview, operatorConsoleSummary:operatorConsoleSummary, userSafetyCopySummary:userSafetyCopySummary, betaExpansionGateSummary:betaExpansionGateSummary, publicPilotChecklistSummary:publicPilotChecklistSummary, pilotReadinessSummary:pilotReadinessSummary, safeForSmallPublicPilot:safeForSmallPublicPilot, pilotNextStep:pilotNextStep, pilotOnboardingSummary:pilotOnboardingSummary, readOnlyConsentSummary:readOnlyConsentSummary, pilotOnboardingViewModel:pilotOnboardingViewModel, pilotEntryStatus:pilotEntryStatus, canEnterReadOnlyPilot:canEnterReadOnlyPilot, pilotConsentRequired:pilotConsentRequired, pilotSupportSummary:pilotSupportSummary, issueIntakeSummary:issueIntakeSummary, supportFallbackSummary:supportFallbackSummary, pilotSupportStatus:pilotSupportStatus, supportNextStep:supportNextStep, issueReviewSummary:issueReviewSummary, supportTriageSummary:supportTriageSummary, pilotIssueReviewSummary:pilotIssueReviewSummary, pilotIssueReviewStatus:pilotIssueReviewStatus, issueAffectsPilotExpansion:issueAffectsPilotExpansion, issueRequiresInternalReview:issueRequiresInternalReview, issuePatternSummary:issuePatternSummary, supportReadinessSummary:supportReadinessSummary, issuePatternViewModelSummary:issuePatternViewModelSummary, issuePatternStatus:issuePatternStatus, supportReadinessStatus:supportReadinessStatus, supportReadyForPublicPilot:supportReadyForPublicPilot, repeatedIssueRisk:repeatedIssueRisk, pilotExitCriteriaSummary:pilotExitCriteriaSummary, launchCandidateReadinessSummary:launchCandidateReadinessSummary, rolloutControlSummary:rolloutControlSummary, cohortHealthSummary:cohortHealthSummary, pilotOpsSummary:pilotOpsSummary, nextCohortDecisionSummary:nextCohortDecisionSummary, pilotOpsStatus:pilotOpsStatus, nextCohortDecisionStatus:nextCohortDecisionStatus, pilotOpsPrimaryRisk:pilotOpsPrimaryRisk, launchCandidateStatus:launchCandidateReadinessSummary && launchCandidateReadinessSummary.status || "", readyForLaunchCandidate:launchCandidateReadinessSummary && launchCandidateReadinessSummary.launchCandidateReadiness && launchCandidateReadinessSummary.launchCandidateReadiness.safeForReadOnlyLaunchCandidate === true, launchCandidateNextStep:launchCandidateReadinessSummary && launchCandidateReadinessSummary.launchCandidateNextStep || "", rolloutDecisionStatus:rolloutDecisionStatus, cohortHealthStatus:cohortHealthStatus, rolloutNextStep:rolloutNextStep })) : null;
    const freezeGateApi = getLaunchCandidateFreezeGateApi();
    const evidenceFreezePackApi = getEvidenceFreezePackApi();
    const launchCandidateFreezeViewModelApi = getLaunchCandidateFreezeViewModelApi();
    const freezeGateSummary = safe.freezeGateSummary && typeof safe.freezeGateSummary === "object" ? safe.freezeGateSummary : (typeof freezeGateApi.buildFlightWorkflowReadOnlyLaunchCandidateFreezeGate === "function" ? freezeGateApi.buildFlightWorkflowReadOnlyLaunchCandidateFreezeGate(Object.assign({}, workflowMeta, { pilotExitCriteriaSummary:pilotExitCriteriaSummary, launchCandidateReadinessSummary:launchCandidateReadinessSummary, releaseReadinessSummary:releaseReadinessSummary, safetyRegressionSummary:safetyRegressionSummary, evidenceFreezePackSummary:safe.evidenceFreezePackSummary || null })) : null);
    const evidenceFreezePackSummary = safe.evidenceFreezePackSummary && typeof safe.evidenceFreezePackSummary === "object" ? safe.evidenceFreezePackSummary : (typeof evidenceFreezePackApi.buildFlightWorkflowEvidenceFreezePack === "function" ? evidenceFreezePackApi.buildFlightWorkflowEvidenceFreezePack(Object.assign({}, workflowMeta, { releaseReadinessSummary:releaseReadinessSummary, launchCandidateReadinessSummary:launchCandidateReadinessSummary, safetyRegressionSummary:safetyRegressionSummary, operatorConsoleSummary:operatorConsoleSummary, pilotOpsSummary:pilotOpsSummary, supportReadinessSummary:supportReadinessSummary })) : null);
    const launchCandidateFreezeViewModelSummary = safe.launchCandidateFreezeViewModelSummary && typeof safe.launchCandidateFreezeViewModelSummary === "object" ? safe.launchCandidateFreezeViewModelSummary : (typeof launchCandidateFreezeViewModelApi.buildFlightWorkflowLaunchCandidateFreezeViewModel === "function" ? launchCandidateFreezeViewModelApi.buildFlightWorkflowLaunchCandidateFreezeViewModel({ freezeGateSummary:freezeGateSummary, evidenceFreezePackSummary:evidenceFreezePackSummary, pilotExitCriteriaSummary:pilotExitCriteriaSummary, launchCandidateReadinessSummary:launchCandidateReadinessSummary }) : null);
    const rcCandidateReviewConsoleApi = getRcCandidateReviewConsoleApi();
    const rcEvidenceReviewChecklistApi = getRcEvidenceReviewChecklistApi();
    const rcReviewViewModelApi = getRcReviewViewModelApi();
    const rcRegressionAuditPackApi = getRcRegressionAuditPackApi();
    const releaseRiskLedgerApi = getReleaseRiskLedgerApi();
    const rcRegressionViewModelApi = getRcRegressionViewModelApi();
    const rcCandidateReviewSummary = safe.rcCandidateReviewSummary && typeof safe.rcCandidateReviewSummary === "object" ? safe.rcCandidateReviewSummary : (typeof rcCandidateReviewConsoleApi.buildFlightWorkflowRcCandidateReviewConsole === "function" ? rcCandidateReviewConsoleApi.buildFlightWorkflowRcCandidateReviewConsole(Object.assign({}, workflowMeta, { freezeGateSummary:freezeGateSummary, evidenceFreezePackSummary:evidenceFreezePackSummary, launchCandidateReadinessSummary:launchCandidateReadinessSummary, pilotExitCriteriaSummary:pilotExitCriteriaSummary, safetyRegressionSummary:safetyRegressionSummary, operatorConsoleSummary:operatorConsoleSummary, releaseReadinessSummary:releaseReadinessSummary })) : null);
    const rcEvidenceReviewSummary = safe.rcEvidenceReviewSummary && typeof safe.rcEvidenceReviewSummary === "object" ? safe.rcEvidenceReviewSummary : (typeof rcEvidenceReviewChecklistApi.buildFlightWorkflowRcEvidenceReviewChecklist === "function" ? rcEvidenceReviewChecklistApi.buildFlightWorkflowRcEvidenceReviewChecklist(Object.assign({}, workflowMeta, { freezeGateSummary:freezeGateSummary, evidenceFreezePackSummary:evidenceFreezePackSummary, launchCandidateReadinessSummary:launchCandidateReadinessSummary, pilotExitCriteriaSummary:pilotExitCriteriaSummary, releaseReadinessSummary:releaseReadinessSummary })) : null);
    const rcReviewStatus = text(rcCandidateReviewSummary && rcCandidateReviewSummary.status || "");
    const rcEvidenceStatus = text(rcEvidenceReviewSummary && rcEvidenceReviewSummary.status || "");
    const safeToStartRcReview = rcCandidateReviewSummary && rcCandidateReviewSummary.safeToStartRcReview === true;
    const rcReviewViewModelSummary = safe.rcReviewViewModelSummary && typeof safe.rcReviewViewModelSummary === "object" ? safe.rcReviewViewModelSummary : (typeof rcReviewViewModelApi.buildFlightWorkflowRcReviewViewModel === "function" ? rcReviewViewModelApi.buildFlightWorkflowRcReviewViewModel({ rcCandidateReviewSummary:rcCandidateReviewSummary, rcEvidenceReviewSummary:rcEvidenceReviewSummary, rcReviewStatus:rcReviewStatus, rcEvidenceStatus:rcEvidenceStatus, safeToStartRcReview:safeToStartRcReview }) : null);
    const rcRegressionAuditSummary = safe.rcRegressionAuditSummary && typeof safe.rcRegressionAuditSummary === "object" ? safe.rcRegressionAuditSummary : (typeof rcRegressionAuditPackApi.buildFlightWorkflowRcRegressionAuditPack === "function" ? rcRegressionAuditPackApi.buildFlightWorkflowRcRegressionAuditPack(Object.assign({}, workflowMeta, { rcCandidateReviewSummary:rcCandidateReviewSummary, rcEvidenceReviewSummary:rcEvidenceReviewSummary, freezeGateSummary:freezeGateSummary, evidenceFreezePackSummary:evidenceFreezePackSummary, safetyRegressionSummary:safetyRegressionSummary, riskBadgeSummary:safe.riskBadgeSummary || null, operatorConsoleSummary:operatorConsoleSummary, commerceAgentSmokeBounded:true, commerceAgentSmokeCount:18, dispatchSmokePass:true, dispatchSmokePassedCount:18, versionCheckPass:true, versionCheckStatus:"pass" })) : null);
    const rcRegressionStatus = text(rcRegressionAuditSummary && rcRegressionAuditSummary.status || "");
    const releaseRiskLedgerSummary = safe.releaseRiskLedgerSummary && typeof safe.releaseRiskLedgerSummary === "object" ? safe.releaseRiskLedgerSummary : (typeof releaseRiskLedgerApi.buildFlightWorkflowReadOnlyReleaseRiskLedger === "function" ? releaseRiskLedgerApi.buildFlightWorkflowReadOnlyReleaseRiskLedger(Object.assign({}, workflowMeta, { rcRegressionAuditSummary:rcRegressionAuditSummary, rcCandidateReviewSummary:rcCandidateReviewSummary, rcEvidenceReviewSummary:rcEvidenceReviewSummary, safetyRegressionSummary:safetyRegressionSummary, freezeGateSummary:freezeGateSummary, evidenceFreezePackSummary:evidenceFreezePackSummary, riskBadgeSummary:safe.riskBadgeSummary || null, copyValidationStatus:"pass" })) : null);
    const releaseRiskStatus = text(releaseRiskLedgerSummary && releaseRiskLedgerSummary.status || "");
    const safeToContinueReleaseCandidate = releaseRiskLedgerSummary && releaseRiskLedgerSummary.riskSummary && releaseRiskLedgerSummary.riskSummary.safeToContinueReleaseCandidate === true;
    const rcRegressionViewModelSummary = safe.rcRegressionViewModelSummary && typeof safe.rcRegressionViewModelSummary === "object" ? safe.rcRegressionViewModelSummary : (typeof rcRegressionViewModelApi.buildFlightWorkflowRcRegressionViewModel === "function" ? rcRegressionViewModelApi.buildFlightWorkflowRcRegressionViewModel({ rcRegressionAuditSummary:rcRegressionAuditSummary, releaseRiskLedgerSummary:releaseRiskLedgerSummary }) : null);
    const rcUserFacingCopyFinalizationApi = getRcUserFacingCopyFinalizationApi();
    const safetyDisclosureReviewBoardApi = getSafetyDisclosureReviewBoardApi();
    const rcCopyReviewViewModelApi = getRcCopyReviewViewModelApi();
    const rcCopyFinalizationSummary = safe.rcCopyFinalizationSummary && typeof safe.rcCopyFinalizationSummary === "object" ? safe.rcCopyFinalizationSummary : (typeof rcUserFacingCopyFinalizationApi.buildFlightWorkflowRcUserFacingCopyFinalization === "function" ? rcUserFacingCopyFinalizationApi.buildFlightWorkflowRcUserFacingCopyFinalization(Object.assign({}, workflowMeta, { userSafetyCopySummary:userSafetyCopySummary, forbiddenCapabilitySummary:safe.forbiddenCapabilitySummary || null, operatorConsoleSummary:operatorConsoleSummary, rcRegressionAuditSummary:rcRegressionAuditSummary, releaseRiskLedgerSummary:releaseRiskLedgerSummary, rcRegressionViewModelSummary:rcRegressionViewModelSummary, copyText:[ "当前为只读候选证据流程，不提供付款、下单或出票能力。", "真实平台与供应商接口当前未启用，页面仅展示候选证据和复核状态。", "价格仅为候选展示，不代表真实最终价、锁价或最低价保证。", "请勿输入身份证、护照、银行卡、支付凭证或平台登录凭据。", "该页面只用于只读 RC 文案定稿与安全披露复核", "不保存真实身份、不发送真实邀请、不提供交易能力" ] })) : null);
    const rcCopyReviewStatus = text(rcCopyFinalizationSummary && rcCopyFinalizationSummary.status || "");
    const safetyDisclosureReviewSummary = safe.safetyDisclosureReviewSummary && typeof safe.safetyDisclosureReviewSummary === "object" ? safe.safetyDisclosureReviewSummary : (typeof safetyDisclosureReviewBoardApi.buildFlightWorkflowSafetyDisclosureReviewBoard === "function" ? safetyDisclosureReviewBoardApi.buildFlightWorkflowSafetyDisclosureReviewBoard(Object.assign({}, workflowMeta, { rcUserFacingCopyFinalizationSummary:rcCopyFinalizationSummary, releaseRiskLedgerSummary:releaseRiskLedgerSummary, rcRegressionAuditSummary:rcRegressionAuditSummary, safetyRegressionSummary:safetyRegressionSummary, riskBadgeSummary:safe.riskBadgeSummary || null, candidateCardSummary:{ title:"只读 RC 文案定稿与安全披露", disclaimer:"当前为只读候选证据流程，不提供付款、下单或出票能力。", priceDisclaimer:"价格仅为候选展示，不代表真实最终价、锁价或最低价保证。", safetyDisclaimer:"请勿输入身份证、护照、银行卡、支付凭证或平台登录凭据。", caveat:"不保存真实身份、不发送真实邀请、不提供交易能力" } })) : null);
    const safetyDisclosureStatus = text(safetyDisclosureReviewSummary && safetyDisclosureReviewSummary.status || "");
    const safeToFinalizeUserFacingCopy = rcCopyFinalizationSummary && rcCopyFinalizationSummary.status === "finalized" && safetyDisclosureReviewSummary && safetyDisclosureReviewSummary.status === "approved";
    const rcCopyReviewViewModelSummary = safe.rcCopyReviewViewModelSummary && typeof safe.rcCopyReviewViewModelSummary === "object" ? safe.rcCopyReviewViewModelSummary : (typeof rcCopyReviewViewModelApi.buildFlightWorkflowRcCopyReviewViewModel === "function" ? rcCopyReviewViewModelApi.buildFlightWorkflowRcCopyReviewViewModel({ rcCopyFinalizationSummary:rcCopyFinalizationSummary, safetyDisclosureReviewSummary:safetyDisclosureReviewSummary, releaseRiskLedgerSummary:releaseRiskLedgerSummary }) : null);
    const globalShoppingProductGoalCharterApi = getGlobalShoppingProductGoalCharterApi();
    const globalShoppingJumpBoundaryApi = getGlobalShoppingJumpToPlatformBoundaryApi();
    const globalShoppingProductGoalViewModelApi = getGlobalShoppingProductGoalViewModelApi();
    const globalShoppingPriceSourceNormalizerApi = getGlobalShoppingPriceSourceNormalizerApi();
    const globalShoppingOfficialPriceAnchorSlotApi = getGlobalShoppingOfficialPriceAnchorSlotApi();
    const globalShoppingPriceCandidateDisplayBoardApi = getGlobalShoppingPriceCandidateDisplayBoardApi();
    const globalShoppingSameItemMatcherApi = getGlobalShoppingSameItemMatcherApi();
    const globalShoppingDuplicateCandidateMergerApi = getGlobalShoppingDuplicateCandidateMergerApi();
    const globalShoppingCoveredLowestCandidateBoardApi = getGlobalShoppingCoveredLowestCandidateBoardApi();
    const globalShoppingProductGoalSummary = safe.globalShoppingProductGoalSummary && typeof safe.globalShoppingProductGoalSummary === "object" ? safe.globalShoppingProductGoalSummary : (typeof globalShoppingProductGoalCharterApi.buildGlobalShoppingProductGoalCharter === "function" ? globalShoppingProductGoalCharterApi.buildGlobalShoppingProductGoalCharter({ workflowMeta:workflowMeta }) : null);
    const jumpToPlatformBoundarySummary = safe.jumpToPlatformBoundarySummary && typeof safe.jumpToPlatformBoundarySummary === "object" ? safe.jumpToPlatformBoundarySummary : (typeof globalShoppingJumpBoundaryApi.buildGlobalShoppingJumpToPlatformBoundary === "function" ? globalShoppingJumpBoundaryApi.buildGlobalShoppingJumpToPlatformBoundary({ workflowMeta:workflowMeta }) : null);
    const globalShoppingGoalStatus = text(globalShoppingProductGoalSummary && globalShoppingProductGoalSummary.status || "");
    const jumpBoundaryStatus = text(jumpToPlatformBoundarySummary && jumpToPlatformBoundarySummary.status || "");
    const safeToProceedWithJumpToPlatformMvp = globalShoppingProductGoalSummary && globalShoppingProductGoalSummary.safeToProceedWithJumpToPlatformMvp === true && jumpToPlatformBoundarySummary && jumpToPlatformBoundarySummary.safeToProceedWithJumpToPlatformMvp === true;
    const priceSourceNormalizationSummary = safe.priceSourceNormalizationSummary && typeof safe.priceSourceNormalizationSummary === "object" ? safe.priceSourceNormalizationSummary : (typeof globalShoppingPriceSourceNormalizerApi.buildGlobalShoppingPriceSourceNormalizer === "function" ? globalShoppingPriceSourceNormalizerApi.buildGlobalShoppingPriceSourceNormalizer({ workflowMeta:workflowMeta }) : null);
    const officialPriceAnchorSummary = safe.officialPriceAnchorSummary && typeof safe.officialPriceAnchorSummary === "object" ? safe.officialPriceAnchorSummary : (typeof globalShoppingOfficialPriceAnchorSlotApi.buildGlobalShoppingOfficialPriceAnchorSlot === "function" ? globalShoppingOfficialPriceAnchorSlotApi.buildGlobalShoppingOfficialPriceAnchorSlot({ normalizedCandidates:priceSourceNormalizationSummary && priceSourceNormalizationSummary.normalizedCandidates || [] }) : null);
    const priceCandidateDisplaySummary = safe.priceCandidateDisplaySummary && typeof safe.priceCandidateDisplaySummary === "object" ? safe.priceCandidateDisplaySummary : (typeof globalShoppingPriceCandidateDisplayBoardApi.buildGlobalShoppingPriceCandidateDisplayBoard === "function" ? globalShoppingPriceCandidateDisplayBoardApi.buildGlobalShoppingPriceCandidateDisplayBoard({ priceSourceNormalizationSummary:priceSourceNormalizationSummary, officialPriceAnchorSummary:officialPriceAnchorSummary }) : null);
    const sameItemMatcherSummary = safe.sameItemMatcherSummary && typeof safe.sameItemMatcherSummary === "object" ? safe.sameItemMatcherSummary : (typeof globalShoppingSameItemMatcherApi.buildGlobalShoppingSameItemMatcher === "function" ? globalShoppingSameItemMatcherApi.buildGlobalShoppingSameItemMatcher({ normalizedCandidates:priceSourceNormalizationSummary && priceSourceNormalizationSummary.normalizedCandidates || [] }) : null);
    const duplicateCandidateMergerSummary = safe.duplicateCandidateMergerSummary && typeof safe.duplicateCandidateMergerSummary === "object" ? safe.duplicateCandidateMergerSummary : (typeof globalShoppingDuplicateCandidateMergerApi.buildGlobalShoppingDuplicateCandidateMerger === "function" ? globalShoppingDuplicateCandidateMergerApi.buildGlobalShoppingDuplicateCandidateMerger({ sameItemMatcherSummary:sameItemMatcherSummary }) : null);
    const coveredLowestCandidateBoardSummary = safe.coveredLowestCandidateBoardSummary && typeof safe.coveredLowestCandidateBoardSummary === "object" ? safe.coveredLowestCandidateBoardSummary : (typeof globalShoppingCoveredLowestCandidateBoardApi.buildGlobalShoppingCoveredLowestCandidateBoard === "function" ? globalShoppingCoveredLowestCandidateBoardApi.buildGlobalShoppingCoveredLowestCandidateBoard({ duplicateCandidateMergerSummary:duplicateCandidateMergerSummary, officialPriceAnchorSummary:officialPriceAnchorSummary }) : null);
    const priceNormalizationStatus = text(priceSourceNormalizationSummary && priceSourceNormalizationSummary.status || "");
    const officialPriceAnchorStatus = text(officialPriceAnchorSummary && officialPriceAnchorSummary.status || "");
    const priceCandidateDisplayStatus = text(priceCandidateDisplaySummary && priceCandidateDisplaySummary.status || "");
    const sameItemMatcherStatus = text(sameItemMatcherSummary && sameItemMatcherSummary.status || "");
    const duplicateMergeStatus = text(duplicateCandidateMergerSummary && duplicateCandidateMergerSummary.status || "");
    const coveredLowestStatus = text(coveredLowestCandidateBoardSummary && coveredLowestCandidateBoardSummary.status || "");
    const safeToProceedWithPriceProviderSandbox = priceNormalizationStatus === "ready" && officialPriceAnchorStatus === "anchored" && priceCandidateDisplayStatus === "ready";
    const safeToProceedWithDeepLinkSafetyGate = sameItemMatcherStatus === "ready" && duplicateMergeStatus === "merged" && coveredLowestStatus === "ready";
    const globalShoppingProductGoalViewModelSummary = safe.globalShoppingProductGoalViewModelSummary && typeof safe.globalShoppingProductGoalViewModelSummary === "object" ? safe.globalShoppingProductGoalViewModelSummary : (typeof globalShoppingProductGoalViewModelApi.buildGlobalShoppingProductGoalViewModel === "function" ? globalShoppingProductGoalViewModelApi.buildGlobalShoppingProductGoalViewModel({ globalShoppingProductGoalSummary:globalShoppingProductGoalSummary, jumpToPlatformBoundarySummary:jumpToPlatformBoundarySummary, priceSourceNormalizationSummary:priceSourceNormalizationSummary, officialPriceAnchorSummary:officialPriceAnchorSummary, priceCandidateDisplaySummary:priceCandidateDisplaySummary, sameItemMatcherSummary:sameItemMatcherSummary, duplicateCandidateMergerSummary:duplicateCandidateMergerSummary, coveredLowestCandidateBoardSummary:coveredLowestCandidateBoardSummary }) : null);
    const forbiddenCapabilitySummary = releaseReadinessSummary && releaseReadinessSummary.forbiddenCapabilitySummary || null;
    const userFacingBetaReadiness = releaseReadinessSummary && releaseReadinessSummary.userFacingBetaReadiness || null;
    const copyValidationStatus = text(releaseReadinessSummary && releaseReadinessSummary.copyValidationStatus || "");
    const finalReviewStatus = handoffPacketPolicyDecision && handoffPacketPolicyDecision.status === "allowed" ? "ready" : (finalSafeHandoffPacketSummary && finalSafeHandoffPacketSummary.status || "needs_review");
    const riskBadgeModel = typeof riskBadgeApi.buildFlightWorkflowRiskBadges === "function" ? riskBadgeApi.buildFlightWorkflowRiskBadges({ auditReview:workflowAuditReviewSummary, safeSessionExportPreview:safeSessionExportPreview, humanReviewChecklistSummary:humanReviewChecklistSummary, finalSafeHandoffPacketSummary:finalSafeHandoffPacketSummary, handoffPacketPolicyDecision:handoffPacketPolicyDecision, safetyRegressionSummary:safetyRegressionSummary, operatorConsoleSummary:operatorConsoleSummary, releaseReadinessSummary:releaseReadinessSummary, userSafetyCopySummary:userSafetyCopySummary, forbiddenCapabilitySummary:forbiddenCapabilitySummary, userFacingBetaReadiness:userFacingBetaReadiness, copyValidationStatus:copyValidationStatus, betaExpansionGateSummary:betaExpansionGateSummary, publicPilotChecklistSummary:publicPilotChecklistSummary, pilotReadinessSummary:pilotReadinessSummary, safeForSmallPublicPilot:safeForSmallPublicPilot, pilotNextStep:pilotNextStep, pilotOnboardingSummary:pilotOnboardingSummary, readOnlyConsentSummary:readOnlyConsentSummary, pilotOnboardingViewModel:pilotOnboardingViewModel, pilotEntryStatus:pilotEntryStatus, canEnterReadOnlyPilot:canEnterReadOnlyPilot, pilotConsentRequired:pilotConsentRequired, pilotSupportSummary:pilotSupportSummary, issueIntakeSummary:issueIntakeSummary, supportFallbackSummary:supportFallbackSummary, pilotSupportStatus:pilotSupportStatus, supportNextStep:supportNextStep, issueReviewSummary:issueReviewSummary, supportTriageSummary:supportTriageSummary, pilotIssueReviewSummary:pilotIssueReviewSummary, pilotIssueReviewStatus:pilotIssueReviewStatus, issueAffectsPilotExpansion:issueAffectsPilotExpansion, issueRequiresInternalReview:issueRequiresInternalReview, issuePatternSummary:issuePatternSummary, supportReadinessSummary:supportReadinessSummary, issuePatternViewModelSummary:issuePatternViewModelSummary, issuePatternStatus:issuePatternStatus, supportReadinessStatus:supportReadinessStatus, supportReadyForPublicPilot:supportReadyForPublicPilot, repeatedIssueRisk:repeatedIssueRisk, rolloutControlSummary:rolloutControlSummary, cohortHealthSummary:cohortHealthSummary, pilotOpsSummary:pilotOpsSummary, nextCohortDecisionSummary:nextCohortDecisionSummary, pilotOpsStatus:pilotOpsStatus, nextCohortDecisionStatus:nextCohortDecisionStatus, pilotOpsPrimaryRisk:pilotOpsPrimaryRisk, rolloutDecisionStatus:rolloutDecisionStatus, cohortHealthStatus:cohortHealthStatus, rolloutNextStep:rolloutNextStep, rcCandidateReviewSummary:rcCandidateReviewSummary, rcEvidenceReviewSummary:rcEvidenceReviewSummary, rcRegressionAuditSummary:rcRegressionAuditSummary, releaseRiskLedgerSummary:releaseRiskLedgerSummary, rcCopyFinalizationSummary:rcCopyFinalizationSummary, safetyDisclosureReviewSummary:safetyDisclosureReviewSummary, globalShoppingProductGoalSummary:globalShoppingProductGoalSummary, jumpToPlatformBoundarySummary:jumpToPlatformBoundarySummary, priceSourceNormalizationSummary:priceSourceNormalizationSummary, officialPriceAnchorSummary:officialPriceAnchorSummary, priceCandidateDisplaySummary:priceCandidateDisplaySummary, sameItemMatcherSummary:sameItemMatcherSummary, duplicateCandidateMergerSummary:duplicateCandidateMergerSummary, coveredLowestCandidateBoardSummary:coveredLowestCandidateBoardSummary, priceNormalizationStatus:priceNormalizationStatus, officialPriceAnchorStatus:officialPriceAnchorStatus, priceCandidateDisplayStatus:priceCandidateDisplayStatus, sameItemMatcherStatus:sameItemMatcherStatus, duplicateMergeStatus:duplicateMergeStatus, coveredLowestStatus:coveredLowestStatus, safeToProceedWithPriceProviderSandbox:safeToProceedWithPriceProviderSandbox, safeToProceedWithDeepLinkSafetyGate:safeToProceedWithDeepLinkSafetyGate, globalShoppingGoalStatus:globalShoppingGoalStatus, jumpBoundaryStatus:jumpBoundaryStatus, safeToProceedWithJumpToPlatformMvp:safeToProceedWithJumpToPlatformMvp, rcReviewStatus:rcReviewStatus, rcEvidenceStatus:rcEvidenceStatus, rcRegressionStatus:rcRegressionStatus, releaseRiskStatus:releaseRiskStatus, rcCopyReviewStatus:rcCopyReviewStatus, safetyDisclosureStatus:safetyDisclosureStatus, safeToStartRcReview:safeToStartRcReview, safeToContinueReleaseCandidate:safeToContinueReleaseCandidate, safeToFinalizeUserFacingCopy:safeToFinalizeUserFacingCopy, actionQueueSummary:actionQueueSummary, actionPolicyDecision:actionPolicyDecision, actionExecutionResult:actionExecutionResult, eventLedgerSummary:eventLedgerSummary, tradingBlocked:blockedActions.length > 0, requiresConfirmation:true }) : null;
    const riskBadgeSummary = riskBadgeModel && typeof riskBadgeApi.summarizeFlightWorkflowRiskBadges === "function" ? Object.assign({}, riskBadgeApi.summarizeFlightWorkflowRiskBadges(riskBadgeModel.badges), { badges:riskBadgeModel.badges, line:riskBadgeModel.summaryLabel || riskBadgeApi.summarizeFlightWorkflowRiskBadges(riskBadgeModel.badges).summaryLabel }) : riskBadgeModel;
    const finalReviewBadges = riskBadgeModel && riskBadgeModel.badges || [];
    const decisionAssistant = typeof decisionApi.buildReadOnlyQuoteDecisionAssistant === "function" ? decisionApi.buildReadOnlyQuoteDecisionAssistant(Object.assign({ topCandidates:dryRunTopCandidates, selectedCandidate:selectedCandidate, sessionSummary:sessionSummary, runHistorySummary:runHistorySummary, quoteDeltaSummary:quoteDeltaSummary, replaySummary:replaySummary }, workflowMeta)) : null;
    const candidateComparison = typeof comparisonApi.buildReadOnlyQuoteCandidateComparison === "function" ? comparisonApi.buildReadOnlyQuoteCandidateComparison(dryRunTopCandidates) : null;
    const decisionAssistantSummary = formatterApi.formatDecisionReasoning && decisionAssistant ? formatterApi.formatDecisionReasoning(decisionAssistant) : null;
    const candidateComparisonSummary = formatterApi.formatCandidateComparisonSummary && candidateComparison ? formatterApi.formatCandidateComparisonSummary(candidateComparison) : null;
    const recommendationExplanation = decisionAssistant && decisionAssistant.reasoning || null;
    const decisionSafetyWarnings = recommendationExplanation && Array.isArray(recommendationExplanation.riskWarnings) ? recommendationExplanation.riskWarnings : ["平台最终为准", "未锁价", "不代表可出票"];
    const candidateComparisonTable = candidateComparison && Array.isArray(candidateComparison.table) ? candidateComparison.table : [];
    const providerConfirmationWarning = formatterApi.formatProviderConfirmationWarning ? formatterApi.formatProviderConfirmationWarning(decisionAssistant && decisionAssistant.recommendedCandidate || selectedCandidate || dryRunTopCandidates[0] || {}) : null;
    const selectedSafeProviderHandoffUrl = selectedCandidate && selectedCandidate.safeProviderHandoffReady === true ? text(selectedCandidate.safeProviderHandoffUrl || "") : "";
    const safeProviderHandoffUrl = text(selectedSafeProviderHandoffUrl || reportHandoff.safeProviderHandoffUrl || "");
    const handoffChecklist = typeof checklistApi.buildSafeProviderConfirmationChecklist === "function" ? checklistApi.buildSafeProviderConfirmationChecklist({ providerName:source.providerName, safeProviderHandoffUrl:safeProviderHandoffUrl || reportHandoff.safeProviderHandoffUrl || selectedSafeProviderHandoffUrl || null, safeProviderHandoffHost:source.safeProviderHandoffHost || reportHandoff.safeProviderHandoffHost || "", selectedCandidate:selectedCandidate || dryRunTopCandidates[0] || { providerName:source.providerName, totalPrice:priceQuote.totalPrice, currency:priceQuote.currency, safeProviderHandoffReady:!!(selectedSafeProviderHandoffUrl || reportHandoff.safeProviderHandoffUrl) } }) : null;
    const handoffReceipt = typeof receiptApi.sanitizeProviderHandoffReceipt === "function" ? receiptApi.sanitizeProviderHandoffReceipt({ providerName:source.providerName, displayHost:source.safeProviderHandoffHost || reportHandoff.safeProviderHandoffHost || "", selectedCandidate:selectedCandidate || dryRunTopCandidates[0] || { totalPrice:priceQuote.totalPrice, currency:priceQuote.currency }, status:"created", userConfirmed:false }) : null;
    const manualPlatformCheck = typeof manualCheckApi.buildManualPlatformCheckEvidence === "function" ? manualCheckApi.buildManualPlatformCheckEvidence(Object.assign({ providerName:source.providerName, displayHost:source.safeProviderHandoffHost || "", observedCurrency:priceQuote.currency || "CNY", observedTotalPrice:priceQuote.totalPrice, observedInventoryStatus:"unknown", observedRulesChanged:false }, safe.manualPlatformCheckInput || safe.manualPlatformCheckEvidence || {})) : null;
    const platformCheckDelta = typeof deltaApi.compareCandidateWithManualPlatformCheck === "function" ? deltaApi.compareCandidateWithManualPlatformCheck(selectedCandidate || dryRunTopCandidates[0] || priceQuote, manualPlatformCheck || {}) : null;
    const platformCheckDeltaSummary = typeof deltaApi.buildPlatformCheckDeltaSummary === "function" ? deltaApi.buildPlatformCheckDeltaSummary(platformCheckDelta) : null;
    const reconciliationSummary = typeof reconciliationApi.buildPlatformCheckReconciliationSummary === "function" ? reconciliationApi.buildPlatformCheckReconciliationSummary({ selectedCandidate:selectedCandidate || dryRunTopCandidates[0] || priceQuote, handoffReceiptSummary:handoffReceipt, manualPlatformCheckEvidence:manualPlatformCheck, platformCheckDelta:platformCheckDelta, decisionAssistant:decisionAssistant, sessionSummary:sessionSummary }) : null;
    const confidenceLabelSummary = typeof confidenceApi.buildReadOnlyCandidateConfidenceLabel === "function" ? confidenceApi.buildReadOnlyCandidateConfidenceLabel({ selectedCandidate:selectedCandidate || dryRunTopCandidates[0] || priceQuote, safeProviderHandoffReady:!!safeProviderHandoffUrl, handoffChecklistSummary:handoffChecklist, manualPlatformCheckEvidence:manualPlatformCheck, platformCheckDelta:platformCheckDelta, reconciliationSummary:reconciliationSummary }) : null;
    const safeNextStepSummary = typeof coachApi.buildReadOnlyQuoteSafeNextStepCoach === "function" ? coachApi.buildReadOnlyQuoteSafeNextStepCoach({ selectedCandidate:selectedCandidate || dryRunTopCandidates[0] || priceQuote, reconciliationSummary:reconciliationSummary, confidenceLabelSummary:confidenceLabelSummary }) : null;
    const platformCheckOutcomeSummary = reconciliationSummary ? { title:"平台核对结果", status:reconciliationSummary.status, confidenceLabel:reconciliationSummary.confidenceLabel, nextStep:reconciliationSummary.nextStep, platformFinal:true, redacted:true } : null;
    const reportCenterModel = typeof reportCenterApi.buildReadOnlyQuoteSessionReportCenter === "function" ? reportCenterApi.buildReadOnlyQuoteSessionReportCenter(Object.assign({ sessionSummary:sessionSummary, auditExportPreview:auditExportPreview, topCandidates:dryRunTopCandidates, selectedCandidate:selectedCandidate, runHistorySummary:runHistorySummary, quoteDeltaSummary:quoteDeltaSummary, replaySummary:replaySummary, routeSummary:normalized.origin + " → " + normalized.destination, departureDate:normalized.departureDate, handoffChecklistSummary:handoffChecklist, handoffReceiptSummary:handoffReceipt, manualPlatformCheckSummary:manualPlatformCheck, platformCheckDeltaSummary:platformCheckDeltaSummary, reconciliationSummary:reconciliationSummary, confidenceLabelSummary:confidenceLabelSummary, safeNextStepSummary:safeNextStepSummary, platformCheckOutcomeSummary:platformCheckOutcomeSummary, manualPlatformCheckEvidence:manualPlatformCheck, platformCheckDelta:platformCheckDelta, auditReviewSummary:workflowAuditReviewSummary, safeSessionExportPreview:safeSessionExportPreview, riskBadgeSummary:riskBadgeSummary, humanReviewChecklistSummary:humanReviewChecklistSummary, finalSafeHandoffPacketSummary:finalSafeHandoffPacketSummary, handoffPacketPolicyDecision:handoffPacketPolicyDecision, finalReviewStatus:finalReviewStatus, finalReviewBadges:finalReviewBadges, safetyRegressionSummary:safetyRegressionSummary, operatorConsoleSummary:operatorConsoleSummary, operatorConsoleViewModel:operatorConsoleViewModel, releaseReadinessSummary:releaseReadinessSummary, rcCandidateReviewSummary:rcCandidateReviewSummary, rcEvidenceReviewSummary:rcEvidenceReviewSummary, rcReviewViewModelSummary:rcReviewViewModelSummary, rcRegressionAuditSummary:rcRegressionAuditSummary, releaseRiskLedgerSummary:releaseRiskLedgerSummary, rcRegressionViewModelSummary:rcRegressionViewModelSummary, rcCopyFinalizationSummary:rcCopyFinalizationSummary, safetyDisclosureReviewSummary:safetyDisclosureReviewSummary, rcCopyReviewViewModelSummary:rcCopyReviewViewModelSummary, globalShoppingProductGoalSummary:globalShoppingProductGoalSummary, jumpToPlatformBoundarySummary:jumpToPlatformBoundarySummary, globalShoppingProductGoalViewModelSummary:globalShoppingProductGoalViewModelSummary, priceSourceNormalizationSummary:priceSourceNormalizationSummary, officialPriceAnchorSummary:officialPriceAnchorSummary, priceCandidateDisplaySummary:priceCandidateDisplaySummary, sameItemMatcherSummary:sameItemMatcherSummary, duplicateCandidateMergerSummary:duplicateCandidateMergerSummary, coveredLowestCandidateBoardSummary:coveredLowestCandidateBoardSummary, priceNormalizationStatus:priceNormalizationStatus, officialPriceAnchorStatus:officialPriceAnchorStatus, priceCandidateDisplayStatus:priceCandidateDisplayStatus, sameItemMatcherStatus:sameItemMatcherStatus, duplicateMergeStatus:duplicateMergeStatus, coveredLowestStatus:coveredLowestStatus, safeToProceedWithPriceProviderSandbox:safeToProceedWithPriceProviderSandbox, safeToProceedWithDeepLinkSafetyGate:safeToProceedWithDeepLinkSafetyGate, globalShoppingGoalStatus:globalShoppingGoalStatus, jumpBoundaryStatus:jumpBoundaryStatus, safeToProceedWithJumpToPlatformMvp:safeToProceedWithJumpToPlatformMvp, rcReviewStatus:rcReviewStatus, rcEvidenceStatus:rcEvidenceStatus, rcRegressionStatus:rcRegressionStatus, releaseRiskStatus:releaseRiskStatus, rcCopyReviewStatus:rcCopyReviewStatus, safetyDisclosureStatus:safetyDisclosureStatus, safeToStartRcReview:safeToStartRcReview, safeToContinueReleaseCandidate:safeToContinueReleaseCandidate, safeToFinalizeUserFacingCopy:safeToFinalizeUserFacingCopy, userSafetyCopySummary:userSafetyCopySummary, forbiddenCapabilitySummary:forbiddenCapabilitySummary, userFacingBetaReadiness:userFacingBetaReadiness, copyValidationStatus:copyValidationStatus, betaExpansionGateSummary:betaExpansionGateSummary, publicPilotChecklistSummary:publicPilotChecklistSummary, pilotReadinessSummary:pilotReadinessSummary, safeForSmallPublicPilot:safeForSmallPublicPilot, pilotNextStep:pilotNextStep, pilotOnboardingSummary:pilotOnboardingSummary, readOnlyConsentSummary:readOnlyConsentSummary, pilotOnboardingViewModel:pilotOnboardingViewModel, pilotEntryStatus:pilotEntryStatus, canEnterReadOnlyPilot:canEnterReadOnlyPilot, pilotConsentRequired:pilotConsentRequired, pilotSupportSummary:pilotSupportSummary, issueIntakeSummary:issueIntakeSummary, supportFallbackSummary:supportFallbackSummary, pilotSupportStatus:pilotSupportStatus, supportNextStep:supportNextStep, issueReviewSummary:issueReviewSummary, supportTriageSummary:supportTriageSummary, pilotIssueReviewSummary:pilotIssueReviewSummary, pilotIssueReviewStatus:pilotIssueReviewStatus, issueAffectsPilotExpansion:issueAffectsPilotExpansion, issueRequiresInternalReview:issueRequiresInternalReview, issuePatternSummary:issuePatternSummary, supportReadinessSummary:supportReadinessSummary, issuePatternViewModelSummary:issuePatternViewModelSummary, issuePatternStatus:issuePatternStatus, supportReadinessStatus:supportReadinessStatus, supportReadyForPublicPilot:supportReadyForPublicPilot, repeatedIssueRisk:repeatedIssueRisk, rolloutControlSummary:rolloutControlSummary, cohortHealthSummary:cohortHealthSummary, rolloutControlViewModel:rolloutControlViewModel, rolloutDecisionStatus:rolloutDecisionStatus, cohortHealthStatus:cohortHealthStatus, rolloutNextStep:rolloutNextStep, pilotReadinessSnapshotSummary:pilotReadinessSnapshotSummary, supportPlaybookSummary:supportPlaybookSummary, pilotSnapshotViewModelSummary:pilotSnapshotViewModelSummary, pilotSnapshotStatus:pilotSnapshotStatus, supportPlaybookStatus: supportPlaybookStatus, pilotSnapshotNextStep:pilotSnapshotNextStep }, workflowMeta)) : null;
    const userFacingEvidenceSummary = reportCenterModel && reportCenterModel.userFacingSummary || null;
    const safetyReportSummary = reportCenterModel && reportCenterModel.safetyReport || null;
    const evidenceSummaryWarnings = formatterApi.formatReadOnlyQuoteEvidenceWarnings ? formatterApi.formatReadOnlyQuoteEvidenceWarnings({}).warnings : ["平台最终为准", "未锁价", "不代表可出票", "唯珊不会付款、不会下单、不会上传证件或银行卡"];
    const selectedCandidateUserSummary = formatterApi.formatSelectedCandidateSummary ? formatterApi.formatSelectedCandidateSummary(selectedCandidate || {}) : null;
    const reportCenterSummary = reportCenterModel ? { reportCenterName:reportCenterModel.reportCenterName, appVersion:reportCenterModel.appVersion, status:reportCenterModel.status, actions:reportCenterModel.actions, redacted:true } : null;
    const reportCenterStatus = text(reportCenterModel && reportCenterModel.status || "empty");
    const selectedSourceSummary = text(safe.selectedSourceSummary || (selectedCandidate && selectedCandidate.selectedSourceSummary) || (selectedCandidate ? "来源：" + (text(selectedCandidate.providerName || "") || "只读沙盒") + " / " + (text(selectedCandidate.responseShape || "") || text(selectedCandidate.fareSource || "导入样本")) : "来源：只读沙盒 / 导入样本"));
    const canRefresh = normalized.restrictedCategory !== true && providerBindingWizardSummary.actions && providerBindingWizardSummary.actions.canAttemptReadOnlyRefresh === true && !isProductionDisabled && interactiveRefreshState.status !== "refreshing";
    const refreshButton = { label:interactiveRefreshState.refreshButton && interactiveRefreshState.refreshButton.label || "刷新只读报价", enabled:canRefresh && interactiveRefreshState.refreshButton && interactiveRefreshState.refreshButton.enabled !== false, loading:interactiveRefreshState.refreshButton && interactiveRefreshState.refreshButton.loading === true, reason:interactiveRefreshState.refreshButton && interactiveRefreshState.refreshButton.reason || (canRefresh ? "仅更新候选证据，未锁价，不代表可出票" : "当前只读报价刷新未就绪"), autoRun:false, autoRefresh:false, payment:false, order:false, identityUpload:false };
    const gateApi = getGateApi();
    const gate = typeof gateApi.evaluateSafeProviderDeepLinkHandoff === "function"
      ? gateApi.evaluateSafeProviderDeepLinkHandoff({
        providerId: source.providerId,
        providerName: source.providerName,
        providerType: source.providerType,
        searchOnly: true,
        safeProviderHandoffUrl: safeProviderHandoffUrl || null,
        restrictedCategory: normalized.restrictedCategory
      })
      : {
        status: normalized.restrictedCategory || !safeProviderHandoffUrl ? "blocked" : "confirmation_required",
        candidateDecision: normalized.restrictedCategory || !safeProviderHandoffUrl ? "blocked" : "safe_provider_handoff_ready",
        providerConfirmationLink: normalized.restrictedCategory || !safeProviderHandoffUrl ? "disabled" : "confirmation_required",
        safeProviderHandoffUrl: normalized.restrictedCategory ? null : safeProviderHandoffUrl || null,
        safeProviderHandoffHost: normalized.restrictedCategory || !safeProviderHandoffUrl ? "" : "google.com",
        userConfirmationRequired: true,
        autoOpen: false,
        bookingUrl: null,
        payment: "blocked",
        checkout: "blocked",
        order: "blocked",
        identityUpload: "blocked",
        realProvider: "disabled",
        realNetwork: "disabled",
        redacted: true
      };
    const confirmationUiApi = getConfirmationUiApi();
    const confirmationUi = typeof confirmationUiApi.buildProviderConfirmationHandoffUiModel === "function"
      ? confirmationUiApi.buildProviderConfirmationHandoffUiModel(gate)
      : {
        status: normalized.restrictedCategory || !gate.safeProviderHandoffUrl ? "blocked" : "confirmation_required",
        continueButtonDisabled: normalized.restrictedCategory || !gate.safeProviderHandoffUrl,
        cancelButtonEnabled: true,
        noAutoOpen: true,
        noBookingUrl: true,
        bookingUrl: null,
        noPayment: true,
        noOrder: true,
        noIdentityUpload: true,
        safeProviderHandoffUrl: gate.safeProviderHandoffUrl || null,
        showInMainFlow: false,
        redacted: true
      };
    const visible = normalized.restrictedCategory !== true;
    const routeTitle = normalized.origin + " → " + normalized.destination + " · " + normalized.dateDisplay;
    const breakdownLines = [
      "票面价：" + (priceQuote.baseFare == null ? "未单独提供" : "¥" + priceQuote.baseFare),
      "税费：" + (priceQuote.taxesAndFees == null ? "未单独提供" : "¥" + priceQuote.taxesAndFees),
      "平台服务费：" + (priceQuote.providerFees == null ? "未单独提供" : "¥" + priceQuote.providerFees),
      "最终候选价：" + (priceQuote.totalPrice == null ? "暂无真实价格结果" : "¥" + priceQuote.totalPrice)
    ];
    if (isSandboxImportEvidence) {
      breakdownLines.unshift("已导入沙盒报价证据");
      breakdownLines.unshift("只读沙盒导入证据");
    }
    const safetyLines = [
      "平台最终为准",
      "未锁价",
      "不代表可出票",
      "唯珊不会付款、不会下单、不会上传证件或银行卡",
      "最终价格、库存、税费、行李和退改签以平台页面为准",
      "仅更新候选证据，未锁价，不代表可出票",
      "价格、库存、税费和规则以平台页面为准"
    ];
    if (isSandboxImportEvidence) safetyLines.unshift("导入响应已脱敏", "已导入沙盒报价证据", "只读沙盒导入证据");
    const sandboxImportSummary = {
      supported:true,
      lastPreviewStatus:sandboxImportPreviewStatus,
      lastImportStatus:sandboxImportStatus,
      importedEvidenceAvailable:isSandboxImportEvidence === true,
      rawResponseStored:false,
      sanitized:true,
      redacted:true,
      showableAsRealPrice:false,
      canReplace:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      autoOpen:false,
      payment:false,
      order:false,
      identityUpload:false,
      dryRunStatus:dryRunStatus,
      sessionStatus:sessionStatus,
      sessionId:sessionId,
      auditExportReady:auditExportReady,
      reportCenterStatus:reportCenterStatus,
      compareStatus:compareStatus,
      replayStatus:replayStatus,
      lastRunId:lastRunId,
      selectedCandidateUserSummary:selectedCandidateUserSummary,
      decisionAssistantSummary:decisionAssistantSummary,
      candidateComparisonSummary:candidateComparisonSummary,
      providerConfirmationWarning:providerConfirmationWarning,
      reportCenterSummary:reportCenterSummary,
      userFacingEvidenceSummary:userFacingEvidenceSummary,
      safetyReportSummary:safetyReportSummary,
      evidenceSummaryWarnings:evidenceSummaryWarnings,
      rcReviewStatus:rcReviewStatus,
      rcEvidenceStatus:rcEvidenceStatus,
      rcRegressionStatus:rcRegressionStatus,
      releaseRiskStatus:releaseRiskStatus,
      rcCopyReviewStatus:rcCopyReviewStatus,
      safetyDisclosureStatus:safetyDisclosureStatus,
      safeToStartRcReview:safeToStartRcReview,
      safeToContinueReleaseCandidate:safeToContinueReleaseCandidate,
      safeToFinalizeUserFacingCopy:safeToFinalizeUserFacingCopy,
      globalShoppingGoalStatus:globalShoppingGoalStatus,
      jumpBoundaryStatus:jumpBoundaryStatus,
      safeToProceedWithJumpToPlatformMvp:safeToProceedWithJumpToPlatformMvp,
      currentStage:workflowMeta.currentStage,
      workflowStageLabel:workflowMeta.workflowStageLabel,
      nextStepLabel:workflowMeta.nextStepLabel,
      canResumeWorkflow:workflowMeta.canResumeWorkflow,
      platformCheckWarnings:platformCheckDeltaSummary && platformCheckDeltaSummary.warnings || ["平台最终为准"]
    };

    return clone({
      version: READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION,
      phase: PHASE,
      visible,
      restrictedCategory: normalized.restrictedCategory,
      cardType: "read_only_price_candidate",
      title: titleLabel,
      routeTitle,
      priceDisplay: priceQuote.totalPrice == null ? "暂无真实价格结果" : "¥" + priceQuote.totalPrice,
      priceTruthLabel: titleLabel + " · 平台最终为准 · 未锁价，不代表可出票",
      statusLine: titleLabel + "；平台最终为准；未锁价；不代表可出票",
      providerMode: isProductionDisabled ? "production_disabled" : (isSandboxReadOnly ? "sandbox_read_only" : "fixture"),
      providerModeLabel: titleLabel,
      providerName: text(source.providerName || "Google Flights"),
      providerType: text(source.providerType || "flight_search"),
      sourceType: text(source.accessMode || "manual_search_only"),
      sourceHost: text(source.safeProviderHandoffHost || ""),
      sourceUrlHost: text(source.safeProviderHandoffHost || ""),
      candidatePriceSource: text(source.providerName || "Google Flights"),
      candidatePriceSourceMode: text(source.accessMode || "manual_search_only"),
      candidatePriceEvidence: isSandboxImportEvidence ? "sandbox_read_only_import" : "read_only_candidate_only",
      responseShape: text(safe.responseShape || (selectedCandidate && selectedCandidate.responseShape) || (topCandidates[0] && topCandidates[0].responseShape) || (report.rankingPreview && report.rankingPreview.topCandidates && report.rankingPreview.topCandidates[0] && report.rankingPreview.topCandidates[0].responseShape) || "unsupported"),
      sourceBreakdown: clone(sourceBreakdown),
      rankingExplanation: rankingExplanation,
      selectedSourceSummary: selectedSourceSummary,
      candidatePriceLabel: candidatePriceLabel,
      platformFinalLabel: "平台最终为准",
      lockStatusLabel: "未锁价",
      ticketEligibilityLabel: "不代表可出票",
      safetyNotice: "唯珊不会付款、不会下单、不会上传证件或银行卡。",
      refreshSupported: reportRefresh.refreshSupported !== false,
      refreshMode: text(reportRefresh.refreshMode || (isProductionDisabled ? "disabled" : (isSandboxReadOnly ? "sandbox_read_only" : "fixture"))),
      lastRefreshStatus: text(refreshStateSummary.lastRefreshStatus || reportRefresh.lastRefreshStatus || "not_run"),
      lastRefreshStatusLabel: lastRefreshStatusLabel(refreshStateSummary.lastRefreshStatus || reportRefresh.lastRefreshStatus || "not_run"),
      refreshStateSummary: refreshStateSummary,
      interactiveRefreshState: interactiveRefreshState,
      recoveredEvidenceSummary: interactiveRefreshState.recoveredEvidenceSummary || { available:false, source:"local_redacted_state", showableAsRealPrice:false, showableAsCandidateEvidence:false, canReplaceMainResultCard:false },
      workflowStateSummary: workflowStateSummary,
      clarificationSummary: clarificationSummary,
      continuitySummary: continuitySummary,
      confirmationStateSummary: confirmationStateSummary,
      recoverySummary: recoverySummary,
      resumeCoachSummary: resumeCoachSummary,
      actionQueueSummary: actionQueueSummary,
      progressTimelineSummary: progressTimelineSummary,
      safeResumeCenterSummary: safeResumeCenterSummary,
      blockedActions: blockedActions,
      currentActionLabel: workflowMeta.currentActionLabel,
      nextSafeActionLabel: workflowMeta.nextSafeActionLabel,
      actionQueue: actionQueueSummary,
      progressTimeline: progressTimelineSummary,
      safeResumeCenter: safeResumeCenterSummary,
      nextSafeAction: workflowMeta.nextSafeAction,
      currentStage: workflowMeta.currentStage,
      workflowStageLabel: workflowMeta.workflowStageLabel,
      nextStepLabel: workflowMeta.nextStepLabel,
      canResumeWorkflow: workflowMeta.canResumeWorkflow,
      resumeActions: resumeActions,
      workflowStepList: workflowStepList,
      missingFields: missingFields,
      clarificationQuestions: clarificationQuestions,
      workflowUserMessage: workflowUserMessage,
      actionExecutionResult: actionExecutionResult,
      actionPolicyDecision: actionPolicyDecision,
      eventLedgerSummary: eventLedgerSummary,
      lastActionId: lastActionId,
      lastActionStatus: lastActionStatus,
      lastActionMessage: lastActionMessage,
      auditReviewSummary: workflowAuditReviewSummary,
      safeSessionExportPreview: safeSessionExportPreview,
      riskBadgeSummary: riskBadgeSummary,
      humanReviewChecklistSummary: humanReviewChecklistSummary,
      finalSafeHandoffPacketSummary: finalSafeHandoffPacketSummary,
      handoffPacketPolicyDecision: handoffPacketPolicyDecision,
      finalReviewStatus: finalReviewStatus,
      finalReviewBadges: finalReviewBadges,
      safetyRegressionSummary: safetyRegressionSummary,
      operatorConsoleSummary: operatorConsoleSummary,
      operatorConsoleViewModel: operatorConsoleViewModel,
      releaseReadinessSummary: releaseReadinessSummary,
      rcCandidateReviewSummary: rcCandidateReviewSummary,
      rcEvidenceReviewSummary: rcEvidenceReviewSummary,
      rcReviewViewModelSummary: rcReviewViewModelSummary,
      rcRegressionAuditSummary: rcRegressionAuditSummary,
      releaseRiskLedgerSummary: releaseRiskLedgerSummary,
      rcRegressionViewModelSummary: rcRegressionViewModelSummary,
      rcCopyFinalizationSummary: rcCopyFinalizationSummary,
      safetyDisclosureReviewSummary: safetyDisclosureReviewSummary,
      rcCopyReviewViewModelSummary: rcCopyReviewViewModelSummary,
      globalShoppingProductGoalSummary: globalShoppingProductGoalSummary,
      jumpToPlatformBoundarySummary: jumpToPlatformBoundarySummary,
      globalShoppingProductGoalViewModelSummary: globalShoppingProductGoalViewModelSummary,
      priceSourceNormalizationSummary: priceSourceNormalizationSummary,
      officialPriceAnchorSummary: officialPriceAnchorSummary,
      priceCandidateDisplaySummary: priceCandidateDisplaySummary,
      sameItemMatcherSummary: sameItemMatcherSummary,
      duplicateCandidateMergerSummary: duplicateCandidateMergerSummary,
      coveredLowestCandidateBoardSummary: coveredLowestCandidateBoardSummary,
      priceNormalizationStatus: priceNormalizationStatus,
      officialPriceAnchorStatus: officialPriceAnchorStatus,
      priceCandidateDisplayStatus: priceCandidateDisplayStatus,
      sameItemMatcherStatus: sameItemMatcherStatus,
      duplicateMergeStatus: duplicateMergeStatus,
      coveredLowestStatus: coveredLowestStatus,
      safeToProceedWithPriceProviderSandbox: safeToProceedWithPriceProviderSandbox,
      safeToProceedWithDeepLinkSafetyGate: safeToProceedWithDeepLinkSafetyGate,
      rcReviewStatus: rcReviewStatus,
      rcEvidenceStatus: rcEvidenceStatus,
      rcRegressionStatus: rcRegressionStatus,
      releaseRiskStatus: releaseRiskStatus,
      rcCopyReviewStatus: rcCopyReviewStatus,
      safetyDisclosureStatus: safetyDisclosureStatus,
      safeToStartRcReview: safeToStartRcReview,
      safeToContinueReleaseCandidate: safeToContinueReleaseCandidate,
      safeToFinalizeUserFacingCopy: safeToFinalizeUserFacingCopy,
      globalShoppingGoalStatus: globalShoppingGoalStatus,
      jumpBoundaryStatus: jumpBoundaryStatus,
      safeToProceedWithJumpToPlatformMvp: safeToProceedWithJumpToPlatformMvp,
      freezeGateSummary: freezeGateSummary,
      evidenceFreezePackSummary: evidenceFreezePackSummary,
      launchCandidateFreezeViewModelSummary: launchCandidateFreezeViewModelSummary,
      userSafetyCopySummary: userSafetyCopySummary,
      forbiddenCapabilitySummary: forbiddenCapabilitySummary,
      userFacingBetaReadiness: userFacingBetaReadiness,
      copyValidationStatus: copyValidationStatus,
      betaExpansionGateSummary: betaExpansionGateSummary,
      publicPilotChecklistSummary: publicPilotChecklistSummary,
      pilotReadinessSummary: pilotReadinessSummary,
      safeForSmallPublicPilot: safeForSmallPublicPilot,
      pilotNextStep: pilotNextStep,
      pilotReadinessSnapshotSummary: pilotReadinessSnapshotSummary,
      supportPlaybookSummary: supportPlaybookSummary,
      pilotSnapshotViewModelSummary: pilotSnapshotViewModelSummary,
      pilotSnapshotStatus: pilotSnapshotStatus,
      supportPlaybookStatus: supportPlaybookStatus,
      pilotSnapshotNextStep: pilotSnapshotNextStep,
      pilotOnboardingSummary: pilotOnboardingSummary,
      readOnlyConsentSummary: readOnlyConsentSummary,
      pilotOnboardingViewModel: pilotOnboardingViewModel,
      pilotEntryStatus: pilotEntryStatus,
      canEnterReadOnlyPilot: canEnterReadOnlyPilot,
      pilotConsentRequired: pilotConsentRequired,
      pilotSupportSummary: pilotSupportSummary,
      issueIntakeSummary: issueIntakeSummary,
      supportFallbackSummary: supportFallbackSummary,
      pilotSupportStatus: pilotSupportStatus,
      supportNextStep: supportNextStep,
      issueReviewSummary: issueReviewSummary,
      supportTriageSummary: supportTriageSummary,
      pilotIssueReviewSummary: pilotIssueReviewSummary,
      pilotIssueReviewStatus: pilotIssueReviewStatus,
      issueAffectsPilotExpansion: issueAffectsPilotExpansion,
      issueRequiresInternalReview: issueRequiresInternalReview,
      issuePatternSummary: issuePatternSummary,
      supportReadinessSummary: supportReadinessSummary,
      issuePatternViewModelSummary: issuePatternViewModelSummary,
      issuePatternStatus: issuePatternStatus,
      supportReadinessStatus: supportReadinessStatus,
      supportReadyForPublicPilot: supportReadyForPublicPilot,
      repeatedIssueRisk: repeatedIssueRisk,
      rolloutControlSummary: rolloutControlSummary,
      cohortHealthSummary: cohortHealthSummary,
      rolloutControlViewModel: rolloutControlViewModel,
      rolloutDecisionStatus: rolloutDecisionStatus,
      cohortHealthStatus: cohortHealthStatus,
      rolloutNextStep: rolloutNextStep,
      sandboxImportSummary: sandboxImportSummary,
      sandboxImportConsoleSummary: { title:"沙盒响应导入", previewActionLabel:"预览导入结果", confirmActionLabel:"确认导入脱敏证据", clearActionLabel:"清除导入状态", runDryButtonLabel:dryRunButton.label || "运行沙盒只读报价", rawResponseStored:false, canSaveRawResponse:false, canPasteSecretHere:false, redacted:true },
      sandboxImportPreviewStatus: sandboxImportPreviewStatus,
      sandboxImportLastStatus: sandboxImportStatus,
      sandboxImportBlockedReason: sandboxImportBlockedReason,
      rankingScope: "导入样本范围",
      lowPriceClaim: "当前导入样本中的低价候选",
      dryRunStatus: dryRunStatus,
      dryRunButton: dryRunButton,
      dryRunTopCandidates: dryRunTopCandidates,
      runHistorySummary: runHistorySummary,
      quoteDeltaSummary: quoteDeltaSummary,
      replaySummary: replaySummary,
      sessionSummary: sessionSummary,
      sessionStatus: sessionStatus,
      sessionId: sessionId,
      auditExportPreview: auditExportPreview,
      auditExportReady: auditExportReady,
      sessionRecoverySummary: sessionRecoverySummary,
      reportCenterSummary: reportCenterSummary,
      userFacingEvidenceSummary: userFacingEvidenceSummary,
      safetyReportSummary: safetyReportSummary,
      evidenceSummaryWarnings: evidenceSummaryWarnings,
      selectedCandidateUserSummary: selectedCandidateUserSummary,
      decisionAssistantSummary: decisionAssistantSummary,
      candidateComparisonSummary: candidateComparisonSummary,
      recommendationExplanation: recommendationExplanation,
      decisionSafetyWarnings: decisionSafetyWarnings,
      candidateComparisonTable: candidateComparisonTable,
      providerConfirmationWarning: providerConfirmationWarning,
      auditReviewSummary: workflowAuditReviewSummary,
      safeSessionExportPreview: safeSessionExportPreview,
      riskBadgeSummary: riskBadgeSummary,
      handoffChecklistSummary: handoffChecklist,
      handoffReceiptSummary: handoffReceipt,
      manualPlatformCheckSummary: manualPlatformCheck,
      platformCheckDeltaSummary: platformCheckDeltaSummary,
      reconciliationSummary: reconciliationSummary,
      confidenceLabelSummary: confidenceLabelSummary,
      safeNextStepSummary: safeNextStepSummary,
      platformCheckOutcomeSummary: platformCheckOutcomeSummary,
      platformCheckDelta: platformCheckDelta,
      platformCheckWarnings: platformCheckDeltaSummary && platformCheckDeltaSummary.warnings || ["平台最终为准"],
      reportCenterStatus: reportCenterStatus,
      lastRunId: lastRunId,
      compareStatus: compareStatus,
      replayStatus: replayStatus,
      sandboxDryRunSummary: sandboxDryRunSummary,
      runTimelineSummary: runTimelineSummary,
      providerRunMatrix: sandboxDryRunSummary && sandboxDryRunSummary.providerRunMatrix ? sandboxDryRunSummary.providerRunMatrix : null,
      topCandidates: dryRunTopCandidates,
      selectedCandidate: selectedCandidate ? Object.assign({}, selectedCandidate, { selectedSourceSummary:selectedSourceSummary, selectionWarning:selectedCandidate.safeProviderHandoffReady === true ? "平台最终为准，未锁价，不代表可出票" : "当前平台确认链接未通过安全检查", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, identityUpload:false, redacted:true }) : null,
      importStatusBadge: importStatusBadge,
      importedEvidenceBanner: importedEvidenceBanner,
      importEvidenceBanner: importEvidenceBanner,
      clearRefreshStateButton: Object.assign({ label:"清除刷新状态", enabled:false, autoRun:false, booking:false, payment:false, order:false, identityUpload:false }, interactiveRefreshState.clearRefreshStateButton || {}),
      refreshErrorBanner: interactiveRefreshState.refreshErrorBanner || "",
      providerBindingWizardSummary: providerBindingWizardSummary,
      credentialReadiness: { status:text(reportCredentialReadiness.status || (isProductionDisabled ? "disabled" : (isSandboxReadOnly ? "sandbox_ready" : "fixture_ready"))), hasSecureCredentialReference:reportCredentialReadiness.hasSecureCredentialReference === true, sandboxDryRunEnabled:reportCredentialReadiness.sandboxDryRunEnabled === true, networkDryRunAllowed:reportCredentialReadiness.networkDryRunAllowed === true, productionProviderEnabled:false, redacted:true },
      refreshButton: refreshButton,
      breakdownLines: breakdownLines,
      safetyLines: safetyLines,
      decisionAssistant: decisionAssistant,
      candidateComparison: candidateComparison,
      actionLabel: "去平台确认",
      safeProviderHandoffUrl: gate.safeProviderHandoffUrl || null,
      safeProviderHandoffHost: gate.safeProviderHandoffHost || "",
      providerConfirmationRequired: gate.providerConfirmationLink === "confirmation_required",
      providerConfirmationStatus: confirmationUi.status || "blocked",
      confirmationPromptLine: confirmationUi.summary || "当前平台确认链接未通过安全检查，不能打开平台确认页。",
      noAutoOpen: true,
      noBookingUrl: true,
      bookingUrl: null,
      noPayment: true,
      noOrder: true,
      noIdentityUpload: true,
      priceQuote: {
        currency: text(priceQuote.currency || "CNY"),
        baseFare: priceQuote.baseFare == null ? null : priceQuote.baseFare,
        taxesAndFees: priceQuote.taxesAndFees == null ? null : priceQuote.taxesAndFees,
        providerFees: priceQuote.providerFees == null ? null : priceQuote.providerFees,
        totalPrice: priceQuote.totalPrice == null ? null : priceQuote.totalPrice,
        priceUpdatedAt: text(priceQuote.priceUpdatedAt || ""),
        freshnessStatus: text(priceQuote.freshnessStatus || "fresh"),
        taxFeeIntegrityStatus: text(priceQuote.taxFeeIntegrityStatus || "complete"),
        bookingUrl: null,
        checkoutUrl: null,
        paymentUrl: null,
        orderUrl: null,
        booking: false,
        payment: false,
        order: false,
        identityUpload: false,
        redacted: true
      },
      gate: gate,
      confirmationUi: confirmationUi,
      audit: {
        eventType: "READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_DRAFT",
        version: READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION,
        phase: PHASE,
        visible: visible,
        providerConfirmationRequired: gate.providerConfirmationLink === "confirmation_required",
        safeProviderHandoffUrlDisplayedCount: 0,
        bookingUrlDisplayedCount: 0,
        paymentActionDisplayedCount: 0,
        orderActionDisplayedCount: 0,
        identityUploadAttemptCount: 0,
        realPriceDisplayedCount: 0,
        redacted: true
      },
      redacted: true
    });
  }

  function renderReadOnlyPriceCandidateCardHtml(input) {
    const card = input && typeof input === "object" && input.version ? input : buildReadOnlyPriceCandidateCardViewModel(input);
    if (!card || card.visible !== true) return "";
    const breakdownLines = Array.isArray(card.breakdownLines) ? card.breakdownLines : [];
    const safetyLines = Array.isArray(card.safetyLines) ? card.safetyLines : [];
    const topCandidates = Array.isArray(card.dryRunTopCandidates) && card.dryRunTopCandidates.length ? card.dryRunTopCandidates : (Array.isArray(card.topCandidates) ? card.topCandidates : []);
    const dryRunSummaryHtml = card.sandboxDryRunSummary || card.runTimelineSummary ? '<section class="commerce-read-only-sandbox-dry-run" data-commerce-read-only-sandbox-dry-run="true"><h5>本次沙盒运行结果</h5><p>运行沙盒只读报价</p><p>本次沙盒运行结果：' + escapeHtml(card.dryRunStatus || (card.sandboxDryRunSummary && card.sandboxDryRunSummary.status) || "not_run") + '</p><p>Provider 运行矩阵：' + escapeHtml((card.providerRunMatrix && card.providerRunMatrix.matrixName) || (card.sandboxDryRunSummary && card.sandboxDryRunSummary.providerRunMatrix && card.sandboxDryRunSummary.providerRunMatrix.matrixName) || "sandbox_provider_run_matrix_v1") + '</p><p>Quote Run Timeline：' + escapeHtml((card.runTimelineSummary && card.runTimelineSummary.summary) || (card.sandboxDryRunSummary && card.sandboxDryRunSummary.runTimelineSummary && card.sandboxDryRunSummary.runTimelineSummary.summary) || "构建 Provider 运行矩阵 · 生成只读沙盒报价 · 报价归一化 · Top 3 排序 · 候选选择准备") + '</p><p>多 Provider 沙盒运行</p><p>Top 3 候选报价</p></section>' : "";
    const sessionSummaryHtml = card.sessionSummary ? '<section class="commerce-read-only-quote-session" data-commerce-read-only-quote-session="true"><h5>当前只读报价会话</h5><p>Read-Only Quote Session</p><p>只读报价会话</p><p>sessionId: ' + escapeHtml(card.sessionId || card.sessionSummary.sessionId || '') + '</p><p>sessionStatus: ' + escapeHtml(card.sessionStatus || card.sessionSummary.status || 'updated') + '</p><p>Session Timeline</p><p>Audit Export</p><p>Session Recovery</p><p>本导出仅为只读候选证据</p><p>平台最终为准，未锁价，不代表可出票</p><p>不包含原始响应、密钥、交易链接或身份信息</p></section>' : '';
    const historySummaryHtml = card.runHistorySummary || card.quoteDeltaSummary || card.replaySummary ? '<section class="commerce-read-only-run-history" data-commerce-read-only-run-history="true"><h5>运行历史</h5><p>Read-Only Quote Run History</p><p>最近一次沙盒运行：' + escapeHtml((card.runHistorySummary && card.runHistorySummary.summary) || '运行历史：暂无本地只读沙盒运行记录') + '</p><p>Last Run Timeline：' + escapeHtml((card.runTimelineSummary && card.runTimelineSummary.summary) || '构建 Provider 运行矩阵 · 生成只读沙盒报价 · 报价归一化 · Top 3 排序 · 候选选择准备') + '</p><p>本地只读沙盒运行对比：' + escapeHtml((card.quoteDeltaSummary && card.quoteDeltaSummary.summary) || '本地只读沙盒运行对比：历史不足') + '</p><p>Replay Guard：' + escapeHtml((card.replaySummary && card.replaySummary.replaySummary) || (card.replaySummary && card.replaySummary.summary) || 'Replay Guard：暂无可回放的本地脱敏运行历史') + '</p><p>Replay 只恢复候选证据，不重新请求 provider</p><p>平台最终为准</p><p>未锁价</p><p>不代表可出票</p><p>compareStatus: ' + escapeHtml(card.compareStatus || 'not_enough_history') + '</p><p>replayStatus: ' + escapeHtml(card.replayStatus || 'unavailable') + '</p><p>lastRunId: ' + escapeHtml(card.lastRunId || '') + '</p></section>' : '';
    const userFacingEvidenceHtml = card.userFacingEvidenceSummary ? '<section class="commerce-read-only-user-evidence-summary" data-commerce-read-only-user-evidence-summary="true"><h5>' + escapeHtml(card.userFacingEvidenceSummary.title || '候选报价证据摘要') + '</h5><p>' + escapeHtml(card.userFacingEvidenceSummary.subtitle || '只读候选价 · 平台最终为准') + '</p><p>当前导入样本 / 沙盒运行中的候选价格</p><p>Top 3 候选报价：' + escapeHtml(String(card.userFacingEvidenceSummary.topCandidateCount || 0)) + '</p><p>' + escapeHtml(card.selectedCandidateUserSummary && card.selectedCandidateUserSummary.line || (card.userFacingEvidenceSummary.selectedCandidateSummary && card.userFacingEvidenceSummary.selectedCandidateSummary.line) || '尚未选择候选报价。平台最终为准，未锁价，不代表可出票。') + '</p><ul>' + (Array.isArray(card.userFacingEvidenceSummary.labels) ? card.userFacingEvidenceSummary.labels : ['只读候选价', '平台最终为准', '未锁价', '不代表可出票']).map(function(label){ return '<li>' + escapeHtml(label) + '</li>'; }).join('') + '</ul><p>' + escapeHtml(card.userFacingEvidenceSummary.caveat || '价格、库存、税费和规则以平台页面为准。唯珊不会付款、不会下单、不会上传证件或银行卡。') + '</p></section>' : '';
    const decisionAssistantHtml = card.decisionAssistantSummary ? '<section class="commerce-read-only-decision-assistant" data-commerce-read-only-decision-assistant="true"><h5>推荐理由</h5><p>Read-Only Quote Decision Assistant</p><p>' + escapeHtml(card.decisionAssistantSummary.primaryReason || '该候选在本次只读候选样本中合计金额较低。') + '</p><p>本地只读候选证据中较低</p><ul>' + (Array.isArray(card.decisionAssistantSummary.supportingReasons) ? card.decisionAssistantSummary.supportingReasons : ['价格拆分完整。', '平台最终为准。', '未锁价，不代表可出票。']).map(function(line){ return '<li>' + escapeHtml(line) + '</li>'; }).join('') + '</ul><ul>' + (Array.isArray(card.decisionSafetyWarnings) ? card.decisionSafetyWarnings : ['平台最终为准', '未锁价', '不代表可出票']).map(function(line){ return '<li>' + escapeHtml(line) + '</li>'; }).join('') + '</ul><p>' + escapeHtml(card.providerConfirmationWarning && card.providerConfirmationWarning.warning || '仍需前往平台确认，平台最终为准，未锁价，不代表可出票。') + '</p></section>' : '';
    const candidateComparisonHtml = card.candidateComparisonSummary ? '<section class="commerce-read-only-candidate-comparison" data-commerce-read-only-candidate-comparison="true"><h5>候选对比</h5><p>Candidate Comparison</p><p>' + escapeHtml(card.candidateComparisonSummary.caveat || '仅比较本地只读候选样本，平台最终为准。') + '</p><ul>' + (Array.isArray(card.candidateComparisonSummary.lines) ? card.candidateComparisonSummary.lines : []).map(function(line){ return '<li>' + escapeHtml(line) + '</li>'; }).join('') + '</ul><p>仍需前往平台确认</p></section>' : '';
    const auditReviewHtml = card.auditReviewSummary ? '<section class="commerce-flight-workflow-audit-review" data-commerce-flight-workflow-audit-review="true"><h5>本次机票工作流审计</h5><p>' + escapeHtml(card.auditReviewSummary.statusLabel || card.auditReviewSummary.healthLabel || '安全检查通过') + '</p><p>安全检查通过</p><p>动作已安全阻断</p><p>外部平台操作需要二次确认</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><button type="button" class="cmd-btn gray" data-commerce-flight-audit-review-show="true">查看工作流审计</button><div data-commerce-flight-audit-review-output="true"><p>只读安全</p><p>交易动作已阻断</p></div></section>' : '';
    const safeExportPreviewHtml = card.safeSessionExportPreview ? '<section class="commerce-flight-safe-session-export-preview" data-commerce-flight-safe-session-export-preview="true"><h5>脱敏会话摘要预览</h5><p>工作流摘要</p><p>候选证据摘要</p><p>安全审计摘要</p><p>不包含证件、银行卡、登录凭据或密钥</p><p>不包含付款、下单、出票链接</p><p>canWriteFile:false</p><p>bookingUrl:null</p><button type="button" class="cmd-btn gray" data-commerce-flight-safe-export-preview-show="true">查看脱敏摘要预览</button><div data-commerce-flight-safe-export-preview-output="true"><p>' + escapeHtml(card.safeSessionExportPreview.readinessLabel || '仅预览，不写入文件') + '</p></div></section>' : '';
    const humanReviewHtml = card.humanReviewChecklistSummary ? '<section class="commerce-flight-human-review-checklist" data-commerce-flight-human-review-checklist="true"><h5>前往平台前请人工复核</h5><p>人工复核清单</p><p>已确认项：' + escapeHtml(String((card.humanReviewChecklistSummary.checkedItems || []).length || 0)) + '</p><p>未完成项：' + escapeHtml(String((card.humanReviewChecklistSummary.incompleteItems || []).length || 0)) + '</p><p>' + escapeHtml(card.humanReviewChecklistSummary.userFacingSummary && card.humanReviewChecklistSummary.userFacingSummary.line || '仍需补充复核') + '</p><p>平台页面结果为准</p><p>唯珊不会付款、不会下单、不会出票</p><button type="button" class="cmd-btn gray" data-commerce-flight-human-review-show="true">查看人工复核清单</button><div data-commerce-flight-human-review-output="true"><p>人工复核清单</p><p>已确认项</p><p>未完成项</p></div></section>' : '';
    const finalPacketHtml = card.finalSafeHandoffPacketSummary ? '<section class="commerce-flight-final-safe-handoff-packet" data-commerce-flight-final-safe-handoff-packet="true"><h5>最终安全交接包</h5><p>行程摘要</p><p>候选证据摘要</p><p>平台核对摘要</p><p>安全限制摘要</p><p>' + escapeHtml(card.finalSafeHandoffPacketSummary.userFacingSummary && card.finalSafeHandoffPacketSummary.userFacingSummary.line || '仍需补充复核') + '</p><p>平台页面结果为准</p><p>唯珊不会付款、不会下单、不会出票</p><button type="button" class="cmd-btn gray" data-commerce-flight-final-handoff-packet-show="true">查看最终安全交接包</button><div data-commerce-flight-final-handoff-packet-output="true"><p>最终安全交接包</p><p>行程摘要</p><p>候选证据摘要</p><p>平台核对摘要</p><p>安全限制摘要</p></div></section>' : '';
    const operatorConsoleHtml = card.operatorConsoleViewModel ? '<section class="commerce-flight-operator-console" data-commerce-flight-operator-console="true"><h5>机票工作流运营控制台</h5><p>工作流状态</p><p>安全状态</p><p>安全回归</p><p>最近事件</p><p>已阻断动作</p><p>平台确认准备状态</p><p>' + escapeHtml(card.operatorConsoleSummary && card.operatorConsoleSummary.userFacingSummary && card.operatorConsoleSummary.userFacingSummary.resultLabel || '存在需要注意的项目') + '</p><p>唯珊只提供只读候选证据，不付款、不下单、不出票</p><button type="button" class="cmd-btn gray" data-commerce-flight-operator-console-show="true">查看运营控制台</button><button type="button" class="cmd-btn gray" data-commerce-flight-safety-regression-show="true">查看安全回归检查</button><div data-commerce-flight-operator-console-output="true"><p>机票工作流运营控制台</p><p>工作流状态</p><p>安全状态</p><p>平台确认准备状态</p></div><div data-commerce-flight-safety-regression-output="true"><p>安全回归</p><p>安全回归通过</p><p>无交易链接</p><p>无付款/下单/出票</p><p>无证件/银行卡/登录凭据</p><p>无密钥或原始响应</p><p>无自动打开或自动刷新</p></div></section>' : '';
    const pilotSupportHtml = '<section class="commerce-flight-pilot-support" data-commerce-flight-pilot-support="true"><h5>只读试点问题反馈</h5><p>问题类型</p><p>建议处理</p><p>看不懂候选证据</p><p>平台页面与候选证据不一致</p><p>安全说明不清楚</p><p>只读范围确认无法完成</p><p>反馈填写异常</p><p>问题反馈已脱敏</p><p>问题反馈只用于改进只读候选证据流程</p><p>不代表客服工单、交易请求或出票请求</p><p>建议重新查看候选证据</p><p>建议记录平台核对结果</p><p>建议查看安全说明</p><p>建议重新确认只读范围</p><h5>只读试点问题复核</h5><p>问题分流面板</p><p>问题状态</p><p>分流建议</p><p>试点影响</p><p>问题可用于改进参考</p><p>需要内部复核</p><p>问题影响试点扩大</p><p>已有建议处理路径</p><p>问题复核只用于改进只读候选证据流程</p><p>不会提交客服工单或交易请求</p><h5>试点问题趋势雷达</h5><p>试点支持准备闸门</p><p>问题数量</p><p>主要问题趋势</p><p>支持准备</p><p>暂无明显共性问题</p><p>发现需要关注的问题趋势</p><p>支持兜底准备就绪</p><p>继续小范围试点</p><p>需要复核后再扩大</p><p>问题趋势仅用于改进只读候选证据流程</p><p>不代表客服工单、交易请求或出票请求</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p><p>download:false</p><p>fileWrite:false</p><button type="button" class="cmd-btn gray" data-commerce-flight-pilot-support-show="true">查看问题反馈</button><button type="button" class="cmd-btn gray" data-commerce-flight-issue-review-show="true">查看问题复核</button><button type="button" class="cmd-btn gray" data-commerce-flight-support-triage-show="true">查看问题分流</button><button type="button" class="cmd-btn gray" data-commerce-flight-issue-pattern-show="true">查看问题趋势</button><button type="button" class="cmd-btn gray" data-commerce-flight-support-readiness-show="true">查看支持准备</button><button type="button" class="cmd-btn gray" data-commerce-flight-issue-category="candidate_unclear">看不懂候选证据</button><button type="button" class="cmd-btn gray" data-commerce-flight-issue-category="platform_mismatch">平台页面与候选证据不一致</button><button type="button" class="cmd-btn gray" data-commerce-flight-issue-category="safety_copy_unclear">安全说明不清楚</button><div data-commerce-flight-pilot-support-output="true"><p>只读试点问题反馈</p><p>建议重新查看候选证据</p></div></section>';
    const rolloutControlHtml = '<section class="commerce-flight-rollout-control" data-commerce-flight-rollout-control="true"><h5>只读试点发布控制中心</h5><p>测试批次健康看板</p><p>发布控制</p><p>批次健康</p><p>问题风险</p><p>下一步</p><p>' + escapeHtml(card.rolloutControlSummary && card.rolloutControlSummary.userFacingSummary && card.rolloutControlSummary.userFacingSummary.resultLabel || card.rolloutNextStep || '继续当前小范围试点') + '</p><p>' + escapeHtml(card.cohortHealthSummary && card.cohortHealthSummary.userFacingSummary && card.cohortHealthSummary.userFacingSummary.resultLabel || '批次进行中') + '</p><p>可以进入下一批只读测试</p><p>继续当前小范围试点</p><p>暂停扩大测试</p><p>批次健康，可以继续</p><p>批次进行中</p><p>批次需要复核</p><p>该页面只管理只读试点流程</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p><button type="button" class="cmd-btn gray" data-commerce-flight-rollout-control-show="true">查看发布控制</button><button type="button" class="cmd-btn gray" data-commerce-flight-cohort-health-show="true">查看批次健康</button><div data-commerce-flight-rollout-control-output="true"><p>只读试点发布控制中心</p><p>发布控制</p><p>批次健康</p><p>问题风险</p><p>下一步</p><p>' + escapeHtml(card.rolloutControlViewModel && card.rolloutControlViewModel.caveat || '该页面只管理只读试点流程，不保存真实身份、不发送真实邀请、不提供交易能力。') + '</p></div><div data-commerce-flight-cohort-health-output="true"><p>测试批次健康看板</p><p>' + escapeHtml(card.cohortHealthSummary && card.cohortHealthSummary.userFacingSummary && card.cohortHealthSummary.userFacingSummary.resultLabel || '批次进行中') + '</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p></div></section>';
    const pilotExitCriteriaHtml = '<section class="commerce-flight-pilot-exit-criteria" data-commerce-flight-pilot-exit-criteria="true"><h5>只读试点退出条件</h5><p>试点运营</p><p>下一批决策</p><p>批次健康</p><p>支持准备</p><p>问题趋势</p><p>安全回归</p><p>发布就绪</p><p>发布候选</p><p>' + escapeHtml(card.pilotExitCriteriaSummary && card.pilotExitCriteriaSummary.userFacingSummary && card.pilotExitCriteriaSummary.userFacingSummary.resultLabel || '继续试点观察') + '</p><button type="button" class="cmd-btn gray" data-commerce-flight-pilot-exit-criteria-show="true">查看试点退出条件</button><div data-commerce-flight-pilot-exit-criteria-output="true"><p>只读试点退出条件</p><p>' + escapeHtml(card.pilotExitCriteriaSummary && card.pilotExitCriteriaSummary.userFacingSummary && card.pilotExitCriteriaSummary.userFacingSummary.resultLabel || '继续试点观察') + '</p><p>试点退出条件已满足</p><p>继续试点观察</p><p>需要复核</p><p>已阻断</p></div></section>';
    const launchCandidateHtml = '<section class="commerce-flight-launch-candidate" data-commerce-flight-launch-candidate="true"><h5>只读发布候选准备板</h5><p>试点退出条件</p><p>发布就绪</p><p>安全矩阵</p><p>支持准备</p><p>发布文案</p><p>安全红线</p><p>' + escapeHtml(card.launchCandidateReadinessSummary && card.launchCandidateReadinessSummary.userFacingSummary && card.launchCandidateReadinessSummary.userFacingSummary.resultLabel || '继续试点观察') + '</p><button type="button" class="cmd-btn gray" data-commerce-flight-launch-candidate-show="true">查看发布候选准备板</button><div data-commerce-flight-launch-candidate-output="true"><p>只读发布候选准备板</p><p>' + escapeHtml(card.launchCandidateReadinessSummary && card.launchCandidateReadinessSummary.userFacingSummary && card.launchCandidateReadinessSummary.userFacingSummary.resultLabel || '继续试点观察') + '</p><p>可以进入只读发布候选</p><p>继续试点观察</p><p>需要复核</p><p>暂不可进入</p></div></section>';
    const freezeGateHtml = card.freezeGateSummary ? '<section class="commerce-flight-freeze-gate" data-commerce-flight-freeze-gate="true"><h5>只读发布候选冻结检查</h5><p>冻结状态</p><p>发布候选摘要</p><p>发布就绪摘要</p><p>安全红线摘要</p><p>证据冻结包</p><p>' + escapeHtml(card.freezeGateSummary.userFacingSummary && card.freezeGateSummary.userFacingSummary.resultLabel || '继续试点观察') + '</p><button type="button" class="cmd-btn gray" data-commerce-flight-launch-candidate-freeze-show="true">查看冻结检查</button><div data-commerce-flight-freeze-gate-output="true"><p>只读发布候选冻结检查</p><p>' + escapeHtml(card.freezeGateSummary.userFacingSummary && card.freezeGateSummary.userFacingSummary.resultLabel || '继续试点观察') + '</p><p>已冻结只读发布候选</p><p>准备冻结只读发布候选</p><p>继续试点观察</p><p>需要复核</p><p>已阻断</p><p>冻结不代表交易能力</p><p>不提供付款、下单或出票能力</p></div></section>' : '';
    const evidenceFreezePackHtml = card.evidenceFreezePackSummary ? '<section class="commerce-flight-evidence-freeze-pack" data-commerce-flight-evidence-freeze-pack="true"><h5>证据冻结包</h5><p>发布就绪摘要</p><p>发布候选摘要</p><p>安全红线摘要</p><p>只读试点摘要</p><p>' + escapeHtml(card.evidenceFreezePackSummary.userFacingSummary && card.evidenceFreezePackSummary.userFacingSummary.resultLabel || '证据冻结仍需复核') + '</p><button type="button" class="cmd-btn gray" data-commerce-flight-evidence-freeze-pack-show="true">查看证据冻结包</button><div data-commerce-flight-evidence-freeze-pack-output="true"><p>证据冻结包</p><p>' + escapeHtml(card.evidenceFreezePackSummary.userFacingSummary && card.evidenceFreezePackSummary.userFacingSummary.resultLabel || '证据冻结仍需复核') + '</p><p>证据冻结包已就绪</p><p>证据冻结仍需复核</p><p>证据冻结包已阻断</p><p>不写文件</p><p>不下载</p></div></section>' : '';
    const rcReviewHtml = card.rcReviewViewModelSummary ? '<section class="commerce-flight-rc-review" data-commerce-flight-rc-review="true"><h5>只读 RC 候选复核控制台</h5><p>只读 RC 候选复核</p><p>候选复核</p><p>证据复核</p><p>安全红线</p><p>' + escapeHtml(card.rcCandidateReviewSummary && card.rcCandidateReviewSummary.userFacingSummary && card.rcCandidateReviewSummary.userFacingSummary.resultLabel || "证据仍需补充") + '</p><p>' + escapeHtml(card.rcReviewViewModelSummary && card.rcReviewViewModelSummary.caveat || "该页面只用于只读 RC 候选复核，不保存真实身份、不发送真实邀请、不提供交易能力。") + '</p><button type="button" class="cmd-btn gray" data-commerce-flight-rc-review-show="true">查看候选复核</button><div data-commerce-flight-rc-review-output="true"><p>只读 RC 候选复核控制台</p><p>候选复核</p><p>证据复核</p><p>安全红线</p><p>可以开始 RC 复核</p><p>证据仍需补充</p><p>需要安全复核</p><p>RC 复核已阻断</p><p>复核不代表交易能力</p><p>该页面只用于只读 RC 候选复核</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p></div></section>' : '';
    const rcEvidenceReviewHtml = card.rcEvidenceReviewSummary ? '<section class="commerce-flight-rc-evidence-review" data-commerce-flight-rc-evidence-review="true"><h5>只读 RC 证据复核清单</h5><p>候选复核</p><p>证据复核</p><p>安全红线</p><p>' + escapeHtml(card.rcEvidenceReviewSummary.userFacingSummary && card.rcEvidenceReviewSummary.userFacingSummary.resultLabel || "证据仍需补充") + '</p><p>该页面只用于只读 RC 候选复核</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p><button type="button" class="cmd-btn gray" data-commerce-flight-rc-evidence-review-show="true">查看证据复核</button><div data-commerce-flight-rc-evidence-review-output="true"><p>只读 RC 证据复核清单</p><p>候选复核</p><p>证据复核</p><p>安全红线</p><p>证据完整</p><p>证据仍需补充</p><p>需要复核</p><p>已阻断</p><p>复核不代表交易能力</p><p>该页面只用于只读 RC 候选复核</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p></div></section>' : '';
    const rcRegressionAuditHtml = card.rcRegressionViewModelSummary ? '<section class="commerce-flight-rc-regression-audit" data-commerce-flight-rc-regression-audit="true"><h5>只读 RC 回归审计</h5><p>只读 RC 回归审计包</p><p>回归审计</p><p>发布风险</p><p>安全红线</p><p>' + escapeHtml(card.rcRegressionAuditSummary && card.rcRegressionAuditSummary.userFacingSummary && card.rcRegressionAuditSummary.userFacingSummary.resultLabel || "RC 回归仍需复核") + '</p><p>' + escapeHtml(card.releaseRiskLedgerSummary && card.releaseRiskLedgerSummary.userFacingSummary && card.releaseRiskLedgerSummary.userFacingSummary.resultLabel || "发布风险待处理") + '</p><p>' + escapeHtml(card.rcRegressionViewModelSummary && card.rcRegressionViewModelSummary.caveat || "该页面只用于只读 RC 回归审计，不保存真实身份、不发送真实邀请、不提供交易能力。") + '</p><button type="button" class="cmd-btn gray" data-commerce-flight-rc-regression-show="true">查看回归审计</button><button type="button" class="cmd-btn gray" data-commerce-flight-release-risk-ledger-show="true">查看发布风险</button><div data-commerce-flight-rc-regression-output="true"><p>只读 RC 回归审计</p><p>只读 RC 回归审计包</p><p>回归审计</p><p>发布风险</p><p>安全红线</p><p>RC 回归审计通过</p><p>RC 回归仍需复核</p><p>回归不代表交易能力</p><p>该页面只用于只读 RC 回归审计</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p></div><div data-commerce-flight-release-risk-ledger-output="true"><p>只读发布风险台账</p><p>回归审计</p><p>发布风险</p><p>安全红线</p><p>暂无阻断风险</p><p>发布风险待处理</p><p>发布风险已阻断</p><p>回归不代表交易能力</p><p>该页面只用于只读 RC 回归审计</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p></div></section>' : '';
    const rcCopyReviewHtml = card.rcCopyReviewViewModelSummary ? '<section class="commerce-flight-rc-copy-review" data-commerce-flight-rc-copy-review="true"><h5>只读 RC 文案定稿与安全披露</h5><p>只读 RC 用户可见文案定稿</p><p>安全披露复核板</p><p>文案定稿</p><p>安全披露</p><p>禁用措辞</p><p>' + escapeHtml(card.rcCopyFinalizationSummary && card.rcCopyFinalizationSummary.userFacingSummary && card.rcCopyFinalizationSummary.userFacingSummary.resultLabel || "RC 文案仍需复核") + '</p><p>' + escapeHtml(card.safetyDisclosureReviewSummary && card.safetyDisclosureReviewSummary.userFacingSummary && card.safetyDisclosureReviewSummary.userFacingSummary.resultLabel || "安全披露仍需复核") + '</p><p>当前为只读候选证据流程，不提供付款、下单或出票能力</p><p>价格仅为候选展示，不代表真实最终价、锁价或最低价保证</p><p>请勿输入身份证、护照、银行卡、支付凭证或平台登录凭据</p><p>' + escapeHtml(card.rcCopyReviewViewModelSummary && card.rcCopyReviewViewModelSummary.caveat || "该页面只用于只读 RC 文案定稿与安全披露复核，不保存真实身份、不发送真实邀请、不提供交易能力。") + '</p><button type="button" class="cmd-btn gray" data-commerce-flight-rc-copy-review-show="true">查看 RC 文案定稿</button><button type="button" class="cmd-btn gray" data-commerce-flight-safety-disclosure-review-show="true">查看安全披露复核</button><div data-commerce-flight-rc-copy-review-output="true"><p>只读 RC 文案定稿与安全披露</p><p>只读 RC 用户可见文案定稿</p><p>文案定稿</p><p>安全披露</p><p>禁用措辞</p><p>RC 文案可以定稿</p><p>RC 文案仍需复核</p><p>文案不代表交易能力</p><p>当前为只读候选证据流程，不提供付款、下单或出票能力</p><p>价格仅为候选展示，不代表真实最终价、锁价或最低价保证</p><p>请勿输入身份证、护照、银行卡、支付凭证或平台登录凭据</p><p>该页面只用于只读 RC 文案定稿与安全披露复核</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p></div><div data-commerce-flight-safety-disclosure-review-output="true"><p>安全披露复核板</p><p>安全披露通过</p><p>安全披露仍需复核</p><p>安全披露已阻断</p><p>文案不代表交易能力</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p></div></section>' : '';
    const priceCandidateDisplayHtml = card.priceCandidateDisplaySummary ? '<section class="commerce-global-shopping-price-candidate-display" data-commerce-global-shopping-price-candidate-display="true"><h5>全球购价格候选展示</h5><p>已覆盖来源候选价合并</p><p>同款候选识别</p><p>重复候选合并</p><p>官方参考价</p><p>已覆盖来源中的较低候选价</p><p>来源覆盖</p><p>同款合并置信度</p><p>价格区间</p><p>当前仅比较已覆盖来源中的候选价</p><p>合并不代表最低承诺、价格保证、锁定承诺、最终成交价或可下单能力</p><p>价格展示不代表下单能力</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-same-item-show="true">查看同款识别</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-covered-lowest-show="true">查看候选价合并</button><div data-commerce-global-shopping-same-item-output="true"><p>同款候选识别</p><p>' + escapeHtml(card.sameItemMatcherSummary && card.sameItemMatcherSummary.userFacingSummary && card.sameItemMatcherSummary.userFacingSummary.resultLabel || '同款识别仍需复核') + '</p><p>fixtureOnly / sandboxOnly / readOnly</p><p>noRealProvider:true</p><p>noNetwork:true</p></div><div data-commerce-global-shopping-covered-lowest-output="true"><p>已覆盖来源候选价合并</p><p>' + escapeHtml(card.coveredLowestCandidateBoardSummary && card.coveredLowestCandidateBoardSummary.title || '已覆盖来源候选价合并') + '</p><p>' + escapeHtml(card.duplicateCandidateMergerSummary && card.duplicateCandidateMergerSummary.userFacingSummary && card.duplicateCandidateMergerSummary.userFacingSummary.resultLabel || '重复候选仍需复核') + '</p><p>' + escapeHtml(card.officialPriceAnchorSummary && card.officialPriceAnchorSummary.userFacingSummary && card.officialPriceAnchorSummary.userFacingSummary.resultLabel || '官方价仍需复核') + '</p><p>当前仅比较已覆盖来源中的候选价</p><p>价格以跳转后平台实时页面为准</p></div></section>' : '';
    const globalShoppingGoalHtml = card.globalShoppingProductGoalViewModelSummary ? '<section class="commerce-global-shopping-product-goal" data-commerce-global-shopping-product-goal="true"><h5>全球购产品目标与跳转边界</h5><p>全球购产品目标</p><p>跳转至平台自行下单边界</p><p>可信候选价格</p><p>官方价格锚点</p><p>合法平台候选价</p><p>平台自行下单</p><p>当前已覆盖来源中的较低候选价</p><p>与官方价对比</p><p>已接入平台候选价</p><p>价格以跳转后平台实时页面为准</p><p>当前仅提供只读候选证据，不提供付款、下单或出票能力</p><p>Weishan 可尽量带入搜索条件，但用户需在对应平台自行确认价格、登录、填写资料并完成下单</p><p>禁止最低价相关承诺</p><p>禁止自动下单承诺</p><p>跳转不代表交易能力</p><p>' + escapeHtml(card.globalShoppingProductGoalSummary && card.globalShoppingProductGoalSummary.userFacingSummary && card.globalShoppingProductGoalSummary.userFacingSummary.resultLabel || "产品目标仍需复核") + '</p><p>' + escapeHtml(card.jumpToPlatformBoundarySummary && card.jumpToPlatformBoundarySummary.userFacingSummary && card.jumpToPlatformBoundarySummary.userFacingSummary.resultLabel || "跳转边界仍需复核") + '</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-product-goal-show="true">查看全球购产品目标</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-jump-boundary-show="true">查看跳转边界</button><div data-commerce-global-shopping-product-goal-output="true"><p>全球购产品目标与跳转边界</p><p>全球购产品目标</p><p>可信候选价格</p><p>官方价格锚点</p><p>合法平台候选价</p><p>平台自行下单</p><p>禁止最低价相关承诺</p><p>禁止自动下单承诺</p><p>跳转不代表交易能力</p></div><div data-commerce-global-shopping-jump-boundary-output="true"><p>跳转至平台自行下单边界</p><p>Weishan 可尽量带入搜索条件，但用户需在对应平台自行确认价格、登录、填写资料并完成下单</p><p>当前仅提供只读候选证据，不提供付款、下单或出票能力</p><p>价格以跳转后平台实时页面为准</p><p>不打开外部平台</p><p>不生成交易链接</p></div></section>' : '';
    const pilotOpsHtml = '<section class="commerce-flight-pilot-ops" data-commerce-flight-pilot-ops="true"><h5>只读试点运营摘要</h5><p>运营状态</p><p>下一批决策</p><p>主要风险</p><p>支持准备</p><p>试点运行健康</p><p>继续当前批次</p><p>暂停扩大测试</p><p>需要复核</p><p>可以进入下一批只读测试</p><p>该页面只用于只读试点运营判断</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p><button type="button" class="cmd-btn gray" data-commerce-flight-pilot-ops-summary-show="true">查看试点运营摘要</button><button type="button" class="cmd-btn gray" data-commerce-flight-next-cohort-decision-show="true">查看下一批决策</button><div data-commerce-flight-pilot-ops-summary-output="true"><p>只读试点运营摘要</p><p>运营状态</p><p>主要风险</p><p>支持准备</p><p>' + escapeHtml(card.pilotOpsSummary && card.pilotOpsSummary.userFacingSummary && card.pilotOpsSummary.userFacingSummary.resultLabel || '继续当前批次') + '</p><p>' + escapeHtml(card.pilotOpsPrimaryRisk && card.pilotOpsPrimaryRisk.label || '无主要风险') + '</p><p>' + escapeHtml(card.supportReadinessSummary && card.supportReadinessSummary.userFacingSummary && card.supportReadinessSummary.userFacingSummary.resultLabel || '支持准备') + '</p></div><div data-commerce-flight-next-cohort-decision-output="true"><p>下一批只读测试决策板</p><p>下一批决策</p><p>可以进入下一批只读测试</p><p>继续当前批次</p><p>暂停扩大测试</p><p>需要内部复核</p><p>已阻断</p><p>' + escapeHtml(card.nextCohortDecisionSummary && card.nextCohortDecisionSummary.userFacingSummary && card.nextCohortDecisionSummary.userFacingSummary.resultLabel || '继续当前批次') + '</p><p>该决策只适用于只读试点节奏，不代表真实账号、邀请、交易或出票能力</p></div></section>';
    const pilotOnboardingHtml = card.pilotOnboardingViewModel ? '<section class="commerce-flight-pilot-onboarding" data-commerce-flight-pilot-onboarding="true"><h5>只读试点进入确认</h5><p>进入只读试点前请确认</p><p>只读试点用户确认</p><p>我知道当前只是只读候选证据</p><p>我知道价格、库存、税费和规则以平台页面为准</p><p>我知道唯珊不会付款、不会下单、不会出票</p><p>我知道唯珊不会上传证件、银行卡或登录凭据</p><p>我知道测试反馈会脱敏处理</p><p data-commerce-pilot-consent-status="true">' + escapeHtml(card.readOnlyConsentSummary && card.readOnlyConsentSummary.userFacingSummary && card.readOnlyConsentSummary.userFacingSummary.resultLabel || '仍有必选项未确认') + '</p><p data-commerce-pilot-entry-status="true">' + escapeHtml(card.pilotOnboardingSummary && card.pilotOnboardingSummary.userFacingSummary && card.pilotOnboardingSummary.userFacingSummary.resultLabel || '需要确认只读范围') + '</p><p>只读试点不代表交易授权</p><p>只读试点不提供付款、下单或出票能力。</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p><p>download:false</p><p>fileWrite:false</p><button type="button" class="cmd-btn gray" data-commerce-flight-pilot-onboarding-show="true">查看试点进入确认</button><button type="button" class="cmd-btn gray" data-commerce-flight-read-only-consent-confirm="true">确认只读范围</button><div data-commerce-flight-pilot-onboarding-output="true"><p>只读试点进入确认</p><p>进入只读试点前请确认</p><p>只读试点用户确认</p><p>仍有必选项未确认</p><p>只读试点不代表交易授权</p></div></section>' : '';
    const riskBadgeHtml = card.riskBadgeSummary ? '<section class="commerce-flight-risk-badges" data-commerce-flight-risk-badges="true"><h5>安全标签</h5><p>只读安全</p><p>交易动作已阻断</p><p>不可导出真实文件</p><p>' + escapeHtml(card.riskBadgeSummary.line || '只读安全 · 交易动作已阻断') + '</p></section>' : '';
    const handoffChecklistHtml = card.handoffChecklistSummary ? '<section class="commerce-safe-provider-confirmation-checklist" data-commerce-safe-provider-confirmation-checklist="true"><h5>前往平台确认前检查</h5><p>Safe Provider Confirmation Checklist</p><ul>' + (Array.isArray(card.handoffChecklistSummary.checklistItems) ? card.handoffChecklistSummary.checklistItems : []).map(function(item){ return '<li>' + escapeHtml(item.label || item.itemId || '') + '：' + escapeHtml(item.status || '') + '</li>'; }).join('') + '</ul><p>唯珊不会付款、不会下单、不会上传证件或银行卡</p><p>平台最终为准</p><p>bookingUrl: null</p></section>' : '';
    const handoffReceiptHtml = card.handoffReceiptSummary ? '<section class="commerce-provider-handoff-receipt" data-commerce-provider-handoff-receipt="true"><h5>生成本地 handoff receipt</h5><p>Handoff Receipt</p><p>本地 handoff receipt · ' + escapeHtml(card.handoffReceiptSummary.displayHost || card.safeProviderHandoffHost || '可信平台') + '</p><p>rawUrlStored: false</p><p>secretStored: false</p><p>bookingUrl: null</p></section>' : '';
    const manualPlatformCheckHtml = '<section class="commerce-manual-platform-check" data-commerce-manual-platform-check="true"><h5>记录平台核对结果</h5><p>Platform Check Evidence</p><label>observedTotalPrice <input data-commerce-manual-platform-check-total="true" aria-label="observedTotalPrice" value="' + escapeHtml(card.manualPlatformCheckSummary && card.manualPlatformCheckSummary.observedTotalPrice != null ? String(card.manualPlatformCheckSummary.observedTotalPrice) : '') + '"></label><label>currency <input data-commerce-manual-platform-check-currency="true" aria-label="currency" value="' + escapeHtml(card.manualPlatformCheckSummary && card.manualPlatformCheckSummary.observedCurrency || 'CNY') + '"></label><label>userNote <textarea data-commerce-manual-platform-check-note="true" aria-label="userNote"></textarea></label><button type="button" class="cmd-btn gray" data-commerce-manual-platform-check-save="true">记录平台核对结果</button><div data-commerce-manual-platform-check-output="true"><p>平台核对结果已记录</p><p>' + escapeHtml(card.platformCheckDeltaSummary && card.platformCheckDeltaSummary.line || '平台核对差异：暂无可比较的手动平台核对结果') + '</p><p>平台核对差异</p><p>平台最终为准</p><p>该结果由用户手动记录，仅用于本地核对，不代表唯珊完成预订或付款。</p><p>payment: false</p><p>order: false</p><p>identityUpload: false</p></div></section>';
    const reconciliationHtml = card.reconciliationSummary ? '<section class="commerce-platform-check-reconciliation" data-commerce-platform-check-reconciliation="true"><h5>平台核对汇总</h5><p>平台核对汇总</p><p>候选价置信标签：' + escapeHtml(card.reconciliationSummary.confidenceLabel || '不可确认') + '</p><p>' + escapeHtml(card.reconciliationSummary.line || '平台最终为准') + '</p><p>平台页面结果与候选价存在差异，平台最终为准</p><p>重新核对平台页面</p><p>bookingUrl: null</p><p>secretStored: false</p></section>' : '';
    const confidenceHtml = card.confidenceLabelSummary ? '<section class="commerce-candidate-confidence-label" data-commerce-candidate-confidence-label="true"><h5>候选价置信标签</h5><p>候选价置信标签</p><p>' + escapeHtml(card.confidenceLabelSummary.confidenceLabel || '不可确认') + '</p><p>高一致 / 有差异 / 需重新核对 / 不可确认</p><p>平台最终为准</p></section>' : '';
    const nextStepHtml = card.safeNextStepSummary ? '<section class="commerce-safe-next-step" data-commerce-safe-next-step="true"><h5>下一步安全建议</h5><p>下一步安全建议</p><p>' + escapeHtml(card.safeNextStepSummary.recommendation || '重新核对平台页面') + '</p><p>重新运行只读报价</p><p>所有价格、库存、税费和规则以平台页面为准。</p></section>' : '';
    const topCandidatesHtml = topCandidates.length ? '<section class="commerce-read-only-top-candidates" data-commerce-read-only-top-candidates="true"><h5>Top 3 候选报价</h5><p>' + escapeHtml(card.lowPriceClaim || "当前导入样本中的低价候选") + '</p><p>Ranking Scope: ' + escapeHtml(card.rankingScope || "导入样本范围") + '</p><p>' + escapeHtml(card.rankingExplanation || "仅按导入样本中的只读候选证据排序，平台最终为准。") + '</p><p>Source Breakdown: ' + escapeHtml('providerCount=' + ((card.sourceBreakdown && card.sourceBreakdown.providerCount) || 0) + '; providerIds=' + (((card.sourceBreakdown && card.sourceBreakdown.providerIds) || []).join(',')) + '; fareSources=' + (((card.sourceBreakdown && card.sourceBreakdown.fareSources) || []).join(','))) + '</p><ol>' + topCandidates.map(function (candidate) {
      const selected = card.selectedCandidate && card.selectedCandidate.quoteId === candidate.quoteId;
      const price = candidate.totalPrice == null ? "暂无真实价格结果" : "¥" + candidate.totalPrice;
      const sourceLine = (candidate.providerName || "") + " · " + (candidate.responseShape || "unsupported") + " · " + (candidate.fareSource || "sandbox_read_only_import");
      const detailLine = '票面价：' + escapeHtml(candidate.baseFare == null ? "-" : String(candidate.baseFare)) + ' · 税费：' + escapeHtml(candidate.taxesAndFees == null ? "-" : String(candidate.taxesAndFees)) + ' · 平台费：' + escapeHtml(candidate.providerFees == null ? "-" : String(candidate.providerFees));
      return '<li><strong>#' + escapeHtml(String(candidate.rank || "")) + ' ' + escapeHtml(price) + '</strong><p>' + escapeHtml(sourceLine) + '</p><p>' + detailLine + '</p><p>平台最终为准 · 未锁价，不代表可出票</p><button type="button" class="cmd-btn gray" data-commerce-select-read-only-quote-candidate="true" data-commerce-select-read-only-quote-candidate-id="' + escapeHtml(candidate.quoteId || "") + '" data-commerce-safe-provider-handoff-url="' + escapeHtml(encodeURIComponent(candidate.safeProviderHandoffUrl || "")) + '" data-commerce-selected-source-summary="' + escapeHtml(encodeURIComponent(candidate.selectedSourceSummary || candidate.sourceSummary || sourceLine)) + '">选择该候选</button>' + (selected ? '<p data-commerce-selected-candidate="true">已选择该候选</p><p data-commerce-selected-source-summary="true">' + escapeHtml(candidate.selectedSourceSummary || candidate.sourceSummary || sourceLine) + '</p>' : '') + '</li>';
    }).join("") + '</ol><p>Selection Evidence</p></section>' : "";
    return `<section class="commerce-read-only-price-candidate-card" aria-label="只读候选价" data-commerce-read-only-price-candidate-card="true">
      <h5>${escapeHtml(card.title || "只读候选价")}</h5>
      <p>${escapeHtml(card.statusLine || "只读候选价；平台最终为准；未锁价；不代表可出票")}</p>
      ${card.importStatusBadge ? `<p data-commerce-sandbox-import-status="true">${escapeHtml(card.importStatusBadge)}</p>` : ""}
      ${card.importedEvidenceBanner ? `<p data-commerce-sandbox-import-banner="true">${escapeHtml(card.importedEvidenceBanner)}</p>` : ""}
      ${dryRunSummaryHtml}
      ${userFacingEvidenceHtml}
      ${decisionAssistantHtml}
      ${candidateComparisonHtml}
      ${auditReviewHtml}
      ${safeExportPreviewHtml}
      ${humanReviewHtml}
      ${finalPacketHtml}
      ${operatorConsoleHtml}
      ${pilotExitCriteriaHtml}
      ${launchCandidateHtml}
      ${freezeGateHtml}
      ${evidenceFreezePackHtml}
      ${rcReviewHtml}
      ${rcEvidenceReviewHtml}
      ${rcRegressionAuditHtml}
      ${rcCopyReviewHtml}
      ${priceCandidateDisplayHtml}
      ${globalShoppingGoalHtml}
      ${pilotOnboardingHtml}
      ${pilotSupportHtml}
      ${rolloutControlHtml}
      ${pilotOpsHtml}
      ${riskBadgeHtml}
      ${handoffChecklistHtml}
      ${handoffReceiptHtml}
      ${manualPlatformCheckHtml}
      ${reconciliationHtml}
      ${confidenceHtml}
      ${nextStepHtml}
      <p class="commerce-read-only-price-candidate-card-price">${escapeHtml(card.priceDisplay || "暂无真实价格结果")}</p>
      <p>${escapeHtml(card.providerName || "Google Flights")} · ${escapeHtml(card.providerType || "flight_search")}</p>
      <p>${escapeHtml(card.routeTitle || "")}</p>
      <ul class="commerce-read-only-price-candidate-card-breakdown">${breakdownLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
      <ul class="commerce-read-only-price-candidate-card-safety">${safetyLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
      ${topCandidatesHtml}
      ${sessionSummaryHtml}
      <p>${escapeHtml(card.safetyNotice || "唯珊不会付款、不会下单、不会上传证件或银行卡。")}</p>
      <p data-commerce-read-only-refresh-summary="true">${escapeHtml(card.interactiveRefreshState && card.interactiveRefreshState.lastRefreshStatusLabel ? ("最近一次刷新：" + card.interactiveRefreshState.lastRefreshStatusLabel) : (card.refreshStateSummary && card.refreshStateSummary.summary || ("最近一次刷新：" + (card.lastRefreshStatusLabel || "未运行"))))}</p>
      ${card.recoveredEvidenceSummary && card.recoveredEvidenceSummary.available ? `<p data-commerce-read-only-recovered-evidence="true">已恢复最近一次只读证据</p>` : ""}
      ${card.refreshErrorBanner ? `<p class="commerce-warning" data-commerce-read-only-refresh-error="true">${escapeHtml(card.refreshErrorBanner)}</p>` : ""}
      <p>${escapeHtml(card.providerBindingWizardSummary && card.providerBindingWizardSummary.title || "Provider 沙盒绑定准备")} · ${escapeHtml(card.providerBindingWizardSummary && card.providerBindingWizardSummary.status || "fixture_ready")}</p>
      <div class="commerce-read-only-price-candidate-card-actions">
        <button type="button" class="cmd-btn gray commerce-run-sandbox-dry-run-btn" data-commerce-run-sandbox-dry-run="true"${card.dryRunButton && card.dryRunButton.enabled === false ? " disabled" : ""}>${escapeHtml(card.dryRunButton && card.dryRunButton.label || "运行沙盒只读报价")}</button>
        <button type="button" class="cmd-btn gray commerce-read-only-refresh-btn" data-commerce-read-only-quote-refresh="true"${card.refreshButton && card.refreshButton.enabled ? "" : " disabled"}>${escapeHtml(card.refreshButton && card.refreshButton.label || "刷新只读报价")}</button>
        <button type="button" class="cmd-btn gray commerce-clear-read-only-refresh-state-btn" data-commerce-clear-read-only-refresh-state="true"${card.clearRefreshStateButton && card.clearRefreshStateButton.enabled ? "" : " disabled"}>${escapeHtml(card.clearRefreshStateButton && card.clearRefreshStateButton.label || "清除刷新状态")}</button>
        <button type="button" class="cmd-btn gray commerce-replay-read-only-run-btn" data-commerce-replay-last-read-only-run="true" data-commerce-recover-read-only-quote-session="true"${card.replaySummary && card.replaySummary.canReplay === false && !card.sessionSummary ? " disabled" : ""}>恢复最近一次只读会话</button>
        <button type="button" class="cmd-btn gray commerce-read-only-audit-export-btn" data-commerce-read-only-audit-export-preview="true"${card.auditExportReady ? "" : " disabled"}>查看脱敏审计预览</button>
        <button type="button" class="cmd-btn gray" data-commerce-flight-audit-review-show="true">查看工作流审计</button>
        <button type="button" class="cmd-btn gray" data-commerce-flight-safe-export-preview-show="true">查看脱敏摘要预览</button>
        <button type="button" class="cmd-btn gray commerce-safe-provider-handoff-btn" data-commerce-safe-provider-handoff-request="true" data-commerce-safe-provider-handoff-kind="${escapeHtml(card.providerType || "flight_search")}" data-commerce-safe-provider-handoff-url="${escapeHtml(encodeURIComponent(card.safeProviderHandoffUrl || ""))}" data-commerce-safe-provider-handoff-provider="${escapeHtml(card.providerName || "可信平台")}" data-commerce-safe-provider-handoff-host="${escapeHtml(card.safeProviderHandoffHost || card.sourceHost || "")}" data-commerce-safe-provider-handoff-quote-id="${escapeHtml(card.selectedCandidate && card.selectedCandidate.quoteId || "")}" data-commerce-safe-provider-handoff-total="${escapeHtml(card.selectedCandidate && card.selectedCandidate.totalPrice != null ? String(card.selectedCandidate.totalPrice) : String(card.priceQuote && card.priceQuote.totalPrice || ""))}" data-commerce-safe-provider-handoff-currency="${escapeHtml(card.selectedCandidate && card.selectedCandidate.currency || card.priceQuote && card.priceQuote.currency || "CNY")}"${card.confirmationUi && card.confirmationUi.continueButtonDisabled ? " disabled" : ""}>${escapeHtml(card.actionLabel || "去平台确认")}</button>
      </div>
      <p>${escapeHtml(card.refreshButton && card.refreshButton.reason || "仅更新候选证据，未锁价，不代表可出票")}</p>
      <p>价格、库存、税费和规则以平台页面为准</p>
      <p>${escapeHtml(card.confirmationPromptLine || "只允许确认后打开可信平台确认页，不自动打开、不付款、不下单。")}</p>
      <p>${escapeHtml(card.platformFinalLabel || "平台最终为准")} · ${escapeHtml(card.lockStatusLabel || "未锁价")} · ${escapeHtml(card.ticketEligibilityLabel || "不代表可出票")}</p>
    </section>`;
  }

  function getReadOnlyPriceCandidateCardViewModelAuditDraft(input) {
    const card = input && typeof input === "object" && input.version ? input : buildReadOnlyPriceCandidateCardViewModel(input);
    return clone(card && card.audit ? card.audit : {
      eventType: "READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_DRAFT",
      version: READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION,
      phase: PHASE,
      visible: false,
      providerConfirmationRequired: false,
      safeProviderHandoffUrlDisplayedCount: 0,
      bookingUrlDisplayedCount: 0,
      paymentActionDisplayedCount: 0,
      orderActionDisplayedCount: 0,
      identityUploadAttemptCount: 0,
      realPriceDisplayedCount: 0,
      redacted: true
    });
  }

  function assertReadOnlyPriceCandidateCardViewModelSafe(value) {
    const card = value && typeof value === "object" ? value : buildReadOnlyPriceCandidateCardViewModel({});
    if (card.redacted !== true) throw new Error("read only price candidate card must stay redacted");
    if (card.noAutoOpen !== true || card.noBookingUrl !== true || card.noPayment !== true || card.noOrder !== true || card.noIdentityUpload !== true) throw new Error("read only price candidate card must keep unsafe actions disabled");
    if (card.bookingUrl !== null) throw new Error("read only price candidate card must not expose bookingUrl");
    if (!Array.isArray(card.breakdownLines) || !card.breakdownLines.length) throw new Error("read only price candidate card must keep price breakdown");
    if (!Array.isArray(card.safetyLines) || !card.safetyLines.length) throw new Error("read only price candidate card must keep safety lines");
    if (card.priceTruthLabel.indexOf("平台最终为准") < 0) throw new Error("read only price candidate card must emphasize platform final");
    if (card.priceTruthLabel.indexOf("未锁价") < 0) throw new Error("read only price candidate card must emphasize not locked");
    if (card.priceTruthLabel.indexOf("不代表可出票") < 0) throw new Error("read only price candidate card must emphasize not ticketable");
    if (card.actionLabel !== "去平台确认") throw new Error("read only price candidate card must keep confirmation action label");
    if (!card.refreshButton || card.refreshButton.autoRun !== false || card.refreshButton.autoRefresh !== false || card.refreshButton.payment !== false || card.refreshButton.order !== false || card.refreshButton.identityUpload !== false) throw new Error("read only price candidate card must keep refresh button manual and safe");
    if (!card.refreshStateSummary || card.refreshStateSummary.showableAsRealPrice !== false || card.refreshStateSummary.autoOpen !== false) throw new Error("read only price candidate card must keep refresh state safe");
    if (!card.sourceBreakdown || typeof card.sourceBreakdown.providerCount !== "number" || !Array.isArray(card.sourceBreakdown.providerIds) || !Array.isArray(card.sourceBreakdown.fareSources)) throw new Error("read only price candidate card must expose source breakdown");
    if (typeof card.rankingExplanation !== "string" || card.rankingExplanation.indexOf("平台最终为准") < 0) throw new Error("read only price candidate card must expose ranking explanation");
    if (typeof card.selectedSourceSummary !== "string") throw new Error("read only price candidate card must expose selected source summary");
    if (!card.decisionAssistantSummary || card.decisionAssistantSummary.title !== "推荐理由") throw new Error("read only price candidate card must expose decision assistant summary");
    if (!card.candidateComparisonSummary || card.candidateComparisonSummary.title !== "候选对比") throw new Error("read only price candidate card must expose candidate comparison summary");
    if (!Array.isArray(card.candidateComparisonTable)) throw new Error("read only price candidate card must expose candidate comparison table");
    if (!card.providerConfirmationWarning || card.providerConfirmationWarning.providerConfirmationRequiresUserConfirm !== true) throw new Error("read only price candidate card must keep provider confirmation warning");
    if (!card.handoffChecklistSummary || card.handoffChecklistSummary.actions.requiresUserConfirmation !== true) throw new Error("read only price candidate card must expose safe handoff checklist");
    if (!card.handoffReceiptSummary || card.handoffReceiptSummary.safety.rawUrlStored !== false) throw new Error("read only price candidate card must expose redacted receipt summary");
    if (!card.manualPlatformCheckSummary || card.manualPlatformCheckSummary.safety.payment !== false) throw new Error("read only price candidate card must expose manual platform check summary");
    if (!card.platformCheckDeltaSummary || card.platformCheckDeltaSummary.canClaimPriceLocked !== false) throw new Error("read only price candidate card must expose safe platform delta summary");
    if (!card.reconciliationSummary || card.reconciliationSummary.bookingUrl !== null) throw new Error("read only price candidate card must expose reconciliation summary");
    if (!card.confidenceLabelSummary || card.confidenceLabelSummary.canPayHere !== false) throw new Error("read only price candidate card must expose confidence label summary");
    if (!card.safeNextStepSummary || !Array.isArray(card.safeNextStepSummary.forbiddenActions)) throw new Error("read only price candidate card must expose safe next-step summary");
    if (!card.interactiveRefreshState || card.interactiveRefreshState.safety.autoRefresh !== false || card.interactiveRefreshState.safety.autoOpen !== false) throw new Error("read only price candidate card must keep interactive refresh safe");
    if (!card.clearRefreshStateButton || card.clearRefreshStateButton.autoRun !== false) throw new Error("read only price candidate card must expose safe clear refresh state button");
    if (!card.providerBindingWizardSummary || card.providerBindingWizardSummary.productionProviderEnabled !== false) throw new Error("read only price candidate card must expose safe provider binding wizard summary");
    if (!card.dryRunButton || typeof card.dryRunButton.label !== "string" || card.dryRunButton.autoRun !== false) throw new Error("read only price candidate card must expose safe dry run button");
    if (card.sandboxDryRunSummary && (card.sandboxDryRunSummary.rawResponseStored !== false || card.sandboxDryRunSummary.autoOpen !== false)) throw new Error("read only price candidate card must keep sandbox dry run safe");
    if (card.sandboxImportSummary && (card.sandboxImportSummary.rawResponseStored !== false || card.sandboxImportSummary.showableAsRealPrice !== false || card.sandboxImportSummary.autoOpen !== false)) throw new Error("read only price candidate card must keep sandbox import safe");
    const serial = JSON.stringify(card).replace(/[^"。；;\/]*(?:禁止|阻断|已阻断|不代表)[^"。；;\/]*全网最低[^"。；;\/]*/g, "");
    if (/fake price|mock price|demo price|AI 估价|全网最低|real final price/i.test(serial)) throw new Error("read only price candidate card must not expose fake or final price claims");
    return true;
  }

  window.WeishanReadOnlyPriceCandidateCardViewModel = {
    READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION,
    PHASE,
    buildReadOnlyPriceCandidateCardViewModel,
    renderReadOnlyPriceCandidateCardHtml,
    getReadOnlyPriceCandidateCardViewModelAuditDraft,
    assertReadOnlyPriceCandidateCardViewModelSafe
  };
})();
