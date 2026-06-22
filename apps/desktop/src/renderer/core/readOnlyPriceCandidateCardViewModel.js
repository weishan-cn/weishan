;(function () {
  "use strict";

  const READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION = "2.1.52";
  const PHASE = "read_only_price_candidate_card_view_model_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
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
    const importedEvidenceBanner = isSandboxImportEvidence ? "只读沙盒导入证据 · 已导入沙盒报价证据 · 导入响应已脱敏 · 仅作为候选证据，不代表已锁价或可出票 · 价格、库存、税费和规则以平台页面为准" : (sandboxImportRejected ? (sandboxImportStatus === "blocked" ? "导入被阻断" : "导入失败，已安全降级") : "");
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
      : { status:"idle", recoveryStatus:"not_loaded", refreshButton:{ label:"刷新只读报价", enabled:true, loading:false, reason:"仅更新候选证据，不代表已锁价或可出票", autoRun:false }, lastRefreshSummary:{ status:refreshStateSummary.lastRefreshStatus || "not_run" }, recoveredEvidenceSummary:{ available:false, source:"local_redacted_state", showableAsRealPrice:false, showableAsCandidateEvidence:false, canReplaceMainResultCard:false }, refreshErrorBanner:"", clearRefreshStateButton:{ label:"清除刷新状态", enabled:false, autoRun:false }, safety:{ bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, booking:false, payment:false, order:false, identityUpload:false, redacted:true }, redacted:true };
    const topCandidates = (Array.isArray(safe.topCandidates) ? safe.topCandidates : (report.rankingPreview && Array.isArray(report.rankingPreview.topCandidates) ? report.rankingPreview.topCandidates : [])).slice(0, 3).map(function (candidate, index) {
      const item = candidate && typeof candidate === "object" ? candidate : {};
      return Object.assign({}, item, { rank:item.rank || index + 1, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, identityUpload:false, redacted:true });
    });
    const rankingPreview = safe.rankingPreview && typeof safe.rankingPreview === "object" ? safe.rankingPreview : (report.rankingPreview && typeof report.rankingPreview === "object" ? report.rankingPreview : {});
    const sourceBreakdown = safe.sourceBreakdown && typeof safe.sourceBreakdown === "object" ? safe.sourceBreakdown : (rankingPreview.sourceBreakdown && typeof rankingPreview.sourceBreakdown === "object" ? rankingPreview.sourceBreakdown : { providerCount: new Set(topCandidates.map(function (candidate) { return text(candidate.providerId || candidate.providerName || ""); }).filter(Boolean)).size, providerIds: Array.from(new Set(topCandidates.map(function (candidate) { return text(candidate.providerId || ""); }).filter(Boolean))), fareSources: Array.from(new Set(topCandidates.map(function (candidate) { return text(candidate.fareSource || ""); }).filter(Boolean))) });
    const rankingExplanation = safe.rankingExplanation || rankingPreview.rankingExplanation || report.rankingPreview && report.rankingPreview.rankingExplanation || "仅按导入样本中的只读候选证据排序，平台最终为准。";
    const selectedCandidate = safe.selectedCandidate && typeof safe.selectedCandidate === "object" ? safe.selectedCandidate : (report.selectedCandidate && typeof report.selectedCandidate === "object" ? report.selectedCandidate : null);
    const selectedSourceSummary = text(safe.selectedSourceSummary || (selectedCandidate && selectedCandidate.selectedSourceSummary) || (selectedCandidate ? "来源：" + (text(selectedCandidate.providerName || "") || "只读沙盒") + " / " + (text(selectedCandidate.responseShape || "") || text(selectedCandidate.fareSource || "导入样本")) : "来源：只读沙盒 / 导入样本"));
    const selectedSafeProviderHandoffUrl = selectedCandidate && selectedCandidate.safeProviderHandoffReady === true ? text(selectedCandidate.safeProviderHandoffUrl || "") : "";
    const canRefresh = normalized.restrictedCategory !== true && providerBindingWizardSummary.actions && providerBindingWizardSummary.actions.canAttemptReadOnlyRefresh === true && !isProductionDisabled && interactiveRefreshState.status !== "refreshing";
    const refreshButton = { label:interactiveRefreshState.refreshButton && interactiveRefreshState.refreshButton.label || "刷新只读报价", enabled:canRefresh && interactiveRefreshState.refreshButton && interactiveRefreshState.refreshButton.enabled !== false, loading:interactiveRefreshState.refreshButton && interactiveRefreshState.refreshButton.loading === true, reason:interactiveRefreshState.refreshButton && interactiveRefreshState.refreshButton.reason || (canRefresh ? "仅更新候选证据，不代表已锁价或可出票" : "当前只读报价刷新未就绪"), autoRun:false, autoRefresh:false, payment:false, order:false, identityUpload:false };
    const safeProviderHandoffUrl = text(selectedSafeProviderHandoffUrl || reportHandoff.safeProviderHandoffUrl || "");
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
      "仅更新候选证据，不代表已锁价或可出票",
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
      priceTruthLabel: titleLabel + " · 平台最终为准 · 未锁价 · 不代表可出票",
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
      sandboxImportSummary: { supported:true, lastPreviewStatus:sandboxImportPreviewStatus, lastImportStatus:sandboxImportStatus, importedEvidenceAvailable:isSandboxImportEvidence === true, rawResponseStored:false, sanitized:true, redacted:true, showableAsRealPrice:false, canReplace:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, payment:false, order:false, identityUpload:false },
      sandboxImportConsoleSummary: { title:"沙盒响应导入", previewActionLabel:"预览导入结果", confirmActionLabel:"确认导入脱敏证据", clearActionLabel:"清除导入状态", rawResponseStored:false, canSaveRawResponse:false, canPasteSecretHere:false, redacted:true },
      sandboxImportPreviewStatus: sandboxImportPreviewStatus,
      sandboxImportLastStatus: sandboxImportStatus,
      sandboxImportBlockedReason: sandboxImportBlockedReason,
      rankingScope: "导入样本范围",
      lowPriceClaim: "当前导入样本中的低价候选",
      topCandidates: topCandidates,
      selectedCandidate: selectedCandidate ? Object.assign({}, selectedCandidate, { selectedSourceSummary:selectedSourceSummary, selectionWarning:selectedCandidate.safeProviderHandoffReady === true ? "平台最终为准，不代表已锁价或可出票" : "当前平台确认链接未通过安全检查", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, identityUpload:false, redacted:true }) : null,
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
    const topCandidates = Array.isArray(card.topCandidates) ? card.topCandidates : [];
    const topCandidatesHtml = topCandidates.length ? '<section class="commerce-read-only-top-candidates" data-commerce-read-only-top-candidates="true"><h5>Top 3 候选报价</h5><p>' + escapeHtml(card.lowPriceClaim || "当前导入样本中的低价候选") + '</p><p>Ranking Scope: ' + escapeHtml(card.rankingScope || "导入样本范围") + '</p><p>' + escapeHtml(card.rankingExplanation || "仅按导入样本中的只读候选证据排序，平台最终为准。") + '</p><p>Source Breakdown: ' + escapeHtml('providerCount=' + ((card.sourceBreakdown && card.sourceBreakdown.providerCount) || 0) + '; providerIds=' + (((card.sourceBreakdown && card.sourceBreakdown.providerIds) || []).join(',')) + '; fareSources=' + (((card.sourceBreakdown && card.sourceBreakdown.fareSources) || []).join(','))) + '</p><ol>' + topCandidates.map(function (candidate) {
      const selected = card.selectedCandidate && card.selectedCandidate.quoteId === candidate.quoteId;
      const price = candidate.totalPrice == null ? "暂无真实价格结果" : "¥" + candidate.totalPrice;
      const sourceLine = (candidate.providerName || "") + " · " + (candidate.responseShape || "unsupported") + " · " + (candidate.fareSource || "sandbox_read_only_import");
      const detailLine = '票面价：' + escapeHtml(candidate.baseFare == null ? "-" : String(candidate.baseFare)) + ' · 税费：' + escapeHtml(candidate.taxesAndFees == null ? "-" : String(candidate.taxesAndFees)) + ' · 平台费：' + escapeHtml(candidate.providerFees == null ? "-" : String(candidate.providerFees));
      return '<li><strong>#' + escapeHtml(String(candidate.rank || "")) + ' ' + escapeHtml(price) + '</strong><p>' + escapeHtml(sourceLine) + '</p><p>' + detailLine + '</p><p>平台最终为准 · 未锁价 · 不代表可出票</p><button type="button" class="cmd-btn gray" data-commerce-select-read-only-quote-candidate="true" data-commerce-select-read-only-quote-candidate-id="' + escapeHtml(candidate.quoteId || "") + '" data-commerce-safe-provider-handoff-url="' + escapeHtml(encodeURIComponent(candidate.safeProviderHandoffUrl || "")) + '" data-commerce-selected-source-summary="' + escapeHtml(encodeURIComponent(candidate.selectedSourceSummary || candidate.sourceSummary || sourceLine)) + '">选择该候选</button>' + (selected ? '<p data-commerce-selected-candidate="true">已选择该候选</p><p data-commerce-selected-source-summary="true">' + escapeHtml(candidate.selectedSourceSummary || candidate.sourceSummary || sourceLine) + '</p>' : '') + '</li>';
    }).join("") + '</ol><p>Selection Evidence</p></section>' : "";
    return `<section class="commerce-read-only-price-candidate-card" aria-label="只读候选价" data-commerce-read-only-price-candidate-card="true">
      <h5>${escapeHtml(card.title || "只读候选价")}</h5>
      <p>${escapeHtml(card.statusLine || "只读候选价；平台最终为准；未锁价；不代表可出票")}</p>
      ${card.importStatusBadge ? `<p data-commerce-sandbox-import-status="true">${escapeHtml(card.importStatusBadge)}</p>` : ""}
      ${card.importedEvidenceBanner ? `<p data-commerce-sandbox-import-banner="true">${escapeHtml(card.importedEvidenceBanner)}</p>` : ""}
      <p class="commerce-read-only-price-candidate-card-price">${escapeHtml(card.priceDisplay || "暂无真实价格结果")}</p>
      <p>${escapeHtml(card.providerName || "Google Flights")} · ${escapeHtml(card.providerType || "flight_search")}</p>
      <p>${escapeHtml(card.routeTitle || "")}</p>
      <ul class="commerce-read-only-price-candidate-card-breakdown">${breakdownLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
      <ul class="commerce-read-only-price-candidate-card-safety">${safetyLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
      ${topCandidatesHtml}
      <p>${escapeHtml(card.safetyNotice || "唯珊不会付款、不会下单、不会上传证件或银行卡。")}</p>
      <p data-commerce-read-only-refresh-summary="true">${escapeHtml(card.interactiveRefreshState && card.interactiveRefreshState.lastRefreshStatusLabel ? ("最近一次刷新：" + card.interactiveRefreshState.lastRefreshStatusLabel) : (card.refreshStateSummary && card.refreshStateSummary.summary || ("最近一次刷新：" + (card.lastRefreshStatusLabel || "未运行"))))}</p>
      ${card.recoveredEvidenceSummary && card.recoveredEvidenceSummary.available ? `<p data-commerce-read-only-recovered-evidence="true">已恢复最近一次只读证据</p>` : ""}
      ${card.refreshErrorBanner ? `<p class="commerce-warning" data-commerce-read-only-refresh-error="true">${escapeHtml(card.refreshErrorBanner)}</p>` : ""}
      <p>${escapeHtml(card.providerBindingWizardSummary && card.providerBindingWizardSummary.title || "Provider 沙盒绑定准备")} · ${escapeHtml(card.providerBindingWizardSummary && card.providerBindingWizardSummary.status || "fixture_ready")}</p>
      <div class="commerce-read-only-price-candidate-card-actions">
        <button type="button" class="cmd-btn gray commerce-read-only-refresh-btn" data-commerce-read-only-quote-refresh="true"${card.refreshButton && card.refreshButton.enabled ? "" : " disabled"}>${escapeHtml(card.refreshButton && card.refreshButton.label || "刷新只读报价")}</button>
        <button type="button" class="cmd-btn gray commerce-clear-read-only-refresh-state-btn" data-commerce-clear-read-only-refresh-state="true"${card.clearRefreshStateButton && card.clearRefreshStateButton.enabled ? "" : " disabled"}>${escapeHtml(card.clearRefreshStateButton && card.clearRefreshStateButton.label || "清除刷新状态")}</button>
        <button type="button" class="cmd-btn gray commerce-safe-provider-handoff-btn" data-commerce-safe-provider-handoff-request="true" data-commerce-safe-provider-handoff-kind="${escapeHtml(card.providerType || "flight_search")}" data-commerce-safe-provider-handoff-url="${escapeHtml(encodeURIComponent(card.safeProviderHandoffUrl || ""))}"${card.confirmationUi && card.confirmationUi.continueButtonDisabled ? " disabled" : ""}>${escapeHtml(card.actionLabel || "去平台确认")}</button>
      </div>
      <p>${escapeHtml(card.refreshButton && card.refreshButton.reason || "仅更新候选证据，不代表已锁价或可出票")}</p>
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
    if (!card.interactiveRefreshState || card.interactiveRefreshState.safety.autoRefresh !== false || card.interactiveRefreshState.safety.autoOpen !== false) throw new Error("read only price candidate card must keep interactive refresh safe");
    if (!card.clearRefreshStateButton || card.clearRefreshStateButton.autoRun !== false) throw new Error("read only price candidate card must expose safe clear refresh state button");
    if (!card.providerBindingWizardSummary || card.providerBindingWizardSummary.productionProviderEnabled !== false) throw new Error("read only price candidate card must expose safe provider binding wizard summary");
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
