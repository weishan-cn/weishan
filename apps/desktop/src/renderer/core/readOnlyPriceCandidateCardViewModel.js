;(function () {
  "use strict";

  const READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION = "2.1.58";
  const PHASE = "read_only_price_candidate_card_view_model_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

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
    const decisionAssistant = typeof decisionApi.buildReadOnlyQuoteDecisionAssistant === "function" ? decisionApi.buildReadOnlyQuoteDecisionAssistant({ topCandidates:dryRunTopCandidates, selectedCandidate:selectedCandidate, sessionSummary:sessionSummary, runHistorySummary:runHistorySummary, quoteDeltaSummary:quoteDeltaSummary, replaySummary:replaySummary }) : null;
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
    const reportCenterModel = typeof reportCenterApi.buildReadOnlyQuoteSessionReportCenter === "function" ? reportCenterApi.buildReadOnlyQuoteSessionReportCenter({ sessionSummary:sessionSummary, auditExportPreview:auditExportPreview, topCandidates:dryRunTopCandidates, selectedCandidate:selectedCandidate, runHistorySummary:runHistorySummary, quoteDeltaSummary:quoteDeltaSummary, replaySummary:replaySummary, routeSummary:normalized.origin + " → " + normalized.destination, departureDate:normalized.departureDate, handoffChecklistSummary:handoffChecklist, handoffReceiptSummary:handoffReceipt, manualPlatformCheckSummary:manualPlatformCheck, platformCheckDeltaSummary:platformCheckDeltaSummary, manualPlatformCheckEvidence:manualPlatformCheck, platformCheckDelta:platformCheckDelta }) : null;
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
      sandboxImportSummary: { supported:true, lastPreviewStatus:sandboxImportPreviewStatus, lastImportStatus:sandboxImportStatus, importedEvidenceAvailable:isSandboxImportEvidence === true, rawResponseStored:false, sanitized:true, redacted:true, showableAsRealPrice:false, canReplace:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, payment:false, order:false, identityUpload:false, dryRunStatus:dryRunStatus, providerRunMatrix:sandboxDryRunSummary && sandboxDryRunSummary.providerRunMatrix || null, runTimelineSummary:runTimelineSummary, sandboxDryRunSummary:sandboxDryRunSummary, dryRunTopCandidates:dryRunTopCandidates, runHistorySummary:runHistorySummary, quoteDeltaSummary:quoteDeltaSummary, replaySummary:replaySummary, sessionSummary:sessionSummary, sessionStatus:sessionStatus, sessionId:sessionId, auditExportPreview:auditExportPreview, auditExportReady:auditExportReady, sessionRecoverySummary:sessionRecoverySummary, reportCenterSummary:reportCenterSummary, userFacingEvidenceSummary:userFacingEvidenceSummary, safetyReportSummary:safetyReportSummary, evidenceSummaryWarnings:evidenceSummaryWarnings, selectedCandidateUserSummary:selectedCandidateUserSummary, decisionAssistantSummary:decisionAssistantSummary, candidateComparisonSummary:candidateComparisonSummary, recommendationExplanation:recommendationExplanation, decisionSafetyWarnings:decisionSafetyWarnings, candidateComparisonTable:candidateComparisonTable, providerConfirmationWarning:providerConfirmationWarning, handoffChecklistSummary:handoffChecklist, handoffReceiptSummary:handoffReceipt, manualPlatformCheckSummary:manualPlatformCheck, platformCheckDeltaSummary:platformCheckDeltaSummary, platformCheckDelta:platformCheckDelta, platformCheckWarnings:platformCheckDeltaSummary && platformCheckDeltaSummary.warnings || ["平台最终为准"], reportCenterStatus:reportCenterStatus, lastRunId:lastRunId, compareStatus:compareStatus, replayStatus:replayStatus },
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
      handoffChecklistSummary: handoffChecklist,
      handoffReceiptSummary: handoffReceipt,
      manualPlatformCheckSummary: manualPlatformCheck,
      platformCheckDeltaSummary: platformCheckDeltaSummary,
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
    const handoffChecklistHtml = card.handoffChecklistSummary ? '<section class="commerce-safe-provider-confirmation-checklist" data-commerce-safe-provider-confirmation-checklist="true"><h5>前往平台确认前检查</h5><p>Safe Provider Confirmation Checklist</p><ul>' + (Array.isArray(card.handoffChecklistSummary.checklistItems) ? card.handoffChecklistSummary.checklistItems : []).map(function(item){ return '<li>' + escapeHtml(item.label || item.itemId || '') + '：' + escapeHtml(item.status || '') + '</li>'; }).join('') + '</ul><p>唯珊不会付款、不会下单、不会上传证件或银行卡</p><p>平台最终为准</p><p>bookingUrl: null</p></section>' : '';
    const handoffReceiptHtml = card.handoffReceiptSummary ? '<section class="commerce-provider-handoff-receipt" data-commerce-provider-handoff-receipt="true"><h5>生成本地 handoff receipt</h5><p>Handoff Receipt</p><p>本地 handoff receipt · ' + escapeHtml(card.handoffReceiptSummary.displayHost || card.safeProviderHandoffHost || '可信平台') + '</p><p>rawUrlStored: false</p><p>secretStored: false</p><p>bookingUrl: null</p></section>' : '';
    const manualPlatformCheckHtml = '<section class="commerce-manual-platform-check" data-commerce-manual-platform-check="true"><h5>记录平台核对结果</h5><p>Platform Check Evidence</p><label>observedTotalPrice <input data-commerce-manual-platform-check-total="true" aria-label="observedTotalPrice" value="' + escapeHtml(card.manualPlatformCheckSummary && card.manualPlatformCheckSummary.observedTotalPrice != null ? String(card.manualPlatformCheckSummary.observedTotalPrice) : '') + '"></label><label>currency <input data-commerce-manual-platform-check-currency="true" aria-label="currency" value="' + escapeHtml(card.manualPlatformCheckSummary && card.manualPlatformCheckSummary.observedCurrency || 'CNY') + '"></label><label>userNote <textarea data-commerce-manual-platform-check-note="true" aria-label="userNote"></textarea></label><button type="button" class="cmd-btn gray" data-commerce-manual-platform-check-save="true">记录平台核对结果</button><div data-commerce-manual-platform-check-output="true"><p>平台核对结果已记录</p><p>' + escapeHtml(card.platformCheckDeltaSummary && card.platformCheckDeltaSummary.line || '平台核对差异：暂无可比较的手动平台核对结果') + '</p><p>平台核对差异</p><p>平台最终为准</p><p>该结果由用户手动记录，仅用于本地核对，不代表唯珊完成预订或付款。</p><p>payment: false</p><p>order: false</p><p>identityUpload: false</p></div></section>';
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
      ${handoffChecklistHtml}
      ${handoffReceiptHtml}
      ${manualPlatformCheckHtml}
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
    if (!card.interactiveRefreshState || card.interactiveRefreshState.safety.autoRefresh !== false || card.interactiveRefreshState.safety.autoOpen !== false) throw new Error("read only price candidate card must keep interactive refresh safe");
    if (!card.clearRefreshStateButton || card.clearRefreshStateButton.autoRun !== false) throw new Error("read only price candidate card must expose safe clear refresh state button");
    if (!card.providerBindingWizardSummary || card.providerBindingWizardSummary.productionProviderEnabled !== false) throw new Error("read only price candidate card must expose safe provider binding wizard summary");
    if (!card.dryRunButton || typeof card.dryRunButton.label !== "string" || card.dryRunButton.autoRun !== false) throw new Error("read only price candidate card must expose safe dry run button");
    if (card.sandboxDryRunSummary && (card.sandboxDryRunSummary.rawResponseStored !== false || card.sandboxDryRunSummary.autoOpen !== false)) throw new Error("read only price candidate card must keep sandbox dry run safe");
    if (card.sandboxImportSummary && (card.sandboxImportSummary.rawResponseStored !== false || card.sandboxImportSummary.showableAsRealPrice !== false || card.sandboxImportSummary.autoOpen !== false)) throw new Error("read only price candidate card must keep sandbox import safe");
    const serial = JSON.stringify(card);
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
