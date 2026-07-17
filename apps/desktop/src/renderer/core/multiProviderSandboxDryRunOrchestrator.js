;(function () {
  "use strict";

  const MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION = "4.2.8";
  const ORCHESTRATOR_NAME = "multi_provider_sandbox_dry_run_orchestrator_v1";
  const RUN_ID = "deterministic-v2.4.1-read-only-sandbox-run";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function getMatrixApi() { return window.WeishanSandboxProviderRunMatrix || {}; }
  function getNormalizerApi() { return window.WeishanProviderSandboxQuoteNormalizer || {}; }
  function getImportApi() { return window.WeishanMultiSandboxQuoteImportProcessor || {}; }
  function getRankingApi() { return window.WeishanReadOnlyQuoteCandidateRanking || {}; }
  function getSelectionApi() { return window.WeishanReadOnlyQuoteCandidateSelection || {}; }
  function getTimelineApi() { return window.WeishanReadOnlyQuoteRunTimeline || {}; }
  function getHistoryStoreApi() { return window.WeishanReadOnlyQuoteRunHistoryStore || {}; }
  function getDeltaCompareApi() { return window.WeishanReadOnlyQuoteDeltaCompare || {}; }
  function getReplayGuardApi() { return window.WeishanReadOnlyQuoteReplayGuard || {}; }
  function getSessionApi() { return window.WeishanReadOnlyQuoteSessionManager || {}; }
  function getAuditExportApi() { return window.WeishanReadOnlyQuoteAuditExport || {}; }
  function makeRunId(runIndex) {
    const index = Number(runIndex);
    return RUN_ID + (Number.isFinite(index) && index > 0 ? "-" + index : "");
  }

  function isRestrictedTask(task) {
    const raw = text(task && (task.rawInput || task.inputSummary || task.title || task.text || ""));
    const guard = task && task.globalProcurementRestrictedCategoryGuard;
    return task && (task.restrictedCategory === true || text(task.restrictedCategoryDecision) === "blocked" || (guard && guard.decision === "blocked") || /(枪|武器|火药|炸药|弹药|firearm|weapon|ammunition|explosive)/i.test(raw));
  }

  function buildMultiProviderSandboxDryRunRequest(task, options) {
    const safeTask = task && typeof task === "object" ? task : {};
    const safeOptions = options && typeof options === "object" ? options : {};
    return clone({
      origin: text(safeOptions.origin || safeTask.origin || safeTask.flightFields && safeTask.flightFields.origin || "上海"),
      destination: text(safeOptions.destination || safeTask.destination || safeTask.flightFields && safeTask.flightFields.destination || "成都"),
      departureDate: text(safeOptions.departureDate || safeTask.departureDate || safeTask.flightFields && safeTask.flightFields.date || "2026-07-15"),
      tripType: text(safeOptions.tripType || safeTask.tripType || "one_way"),
      passengerCount: Number(safeOptions.passengerCount || safeTask.passengerCount || 1) || 1,
      cabinClass: text(safeOptions.cabinClass || safeTask.cabinClass || "economy"),
      directOnly: safeOptions.directOnly === true || safeTask.directOnly === true,
      sortIntent: text(safeOptions.sortIntent || safeTask.sortIntent || safeTask.flightFields && safeTask.flightFields.goal || "低价优先"),
      runMode: "read_only_sandbox"
    });
  }

  function deterministicRawQuotes(request, matrix) {
    const providers = Array.isArray(matrix && matrix.providers) ? matrix.providers : [];
    const map = {
      flight_provider_trusted_fixture: { providerName: "Trusted Flight Fixture", providerMode: "fixture", fareSource: "fixture_read_only", responseShape: "weishan_normalized_quote", baseFare: 860, taxesAndFees: 110, providerFees: 40, totalPrice: 1010, priceUpdatedAt: "2026-06-20T00:00:00.000Z", freshnessMinutes: 15 },
      trip_com_sandbox_stub: { providerName: "Trip.com Sandbox Stub", providerMode: "sandbox_read_only", fareSource: "sandbox_read_only_import", responseShape: "trip_com_stub_quote", trip: { from: request.origin, to: request.destination, date: request.departureDate }, price: { currency: "CNY", fare: 820, tax: 120, serviceFee: 35, total: 975 }, freshness: { updatedAt: "2026-06-20T00:00:00.000Z", minutes: 10 }, route: { origin: request.origin, destination: request.destination, display: request.origin + " → " + request.destination }, departureDate: request.departureDate, currency: "CNY", baseFare: 820, taxesAndFees: 120, providerFees: 35, totalPrice: 975, priceUpdatedAt: "2026-06-20T00:00:00.000Z", freshnessMinutes: 10 },
      airline_official_sandbox_stub: { providerName: "Airline Official Sandbox Stub", providerMode: "sandbox_read_only", fareSource: "sandbox_read_only_import", responseShape: "airline_official_stub_quote", origin: request.origin, destination: request.destination, departOn: request.departureDate, money: { currency: "CNY", base: 780, taxes: 130, fees: 20, grandTotal: 930 }, updatedAt: "2026-06-20T00:00:00.000Z", freshnessMinutes: 8, route: { origin: request.origin, destination: request.destination, display: request.origin + " → " + request.destination }, departureDate: request.departureDate, currency: "CNY", baseFare: 780, taxesAndFees: 130, providerFees: 20, totalPrice: 930, priceUpdatedAt: "2026-06-20T00:00:00.000Z" }
    };
    return providers.filter(function (provider) { return provider && provider.status === "runnable"; }).map(function (provider) {
      const template = map[provider.providerId];
      if (!template) return null;
      return Object.assign({}, template, {
        providerId: provider.providerId,
        providerName: template.providerName,
        providerMode: template.providerMode,
        fareSource: template.fareSource,
        route: template.route || { origin: request.origin, destination: request.destination, display: request.origin + " → " + request.destination },
        departureDate: template.departureDate || request.departureDate,
        currency: template.currency || "CNY",
        baseFare: template.baseFare,
        taxesAndFees: template.taxesAndFees,
        providerFees: template.providerFees,
        totalPrice: template.totalPrice,
        priceUpdatedAt: template.priceUpdatedAt,
        freshnessMinutes: template.freshnessMinutes,
        handoffCandidate: { providerId: provider.providerId, providerName: provider.providerName, providerType: provider.adapterType === "fixture_read_only" ? "fixture" : "flight_search", safeProviderHandoffUrl: null, redacted: true },
        redacted: true
      });
    }).filter(Boolean);
  }

  function buildMultiProviderSandboxDryRunResult(quotes, options) {
    const safeOptions = options && typeof options === "object" ? options : {};
    const importApi = getImportApi();
    const rankingApi = getRankingApi();
    const selectionApi = getSelectionApi();
    const timelineApi = getTimelineApi();
    const rawQuotes = Array.isArray(quotes) ? quotes.slice() : [];
    const importResult = typeof importApi.importMultiSandboxQuotes === "function"
      ? importApi.importMultiSandboxQuotes(JSON.stringify(rawQuotes), safeOptions)
      : { status: "failed_safe", quotes: [], acceptedCount: 0, rejectedCount: 0, blockedCount: 0, sourceBreakdown: { providerCount: 0, providerIds: [], fareSources: [] }, rawResponseStored: false,
      autoOpen: false, redacted: true };
    const normalizedQuotes = Array.isArray(rawQuotes) ? rawQuotes.slice() : [];
    const ranking = typeof rankingApi.buildTopReadOnlyQuoteCandidates === "function"
      ? rankingApi.buildTopReadOnlyQuoteCandidates(normalizedQuotes, { rankingScope: "imported_sandbox_quotes_only" })
      : { rankingName: "read_only_quote_candidate_ranking_v1", appVersion: MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION, rankingScope: "imported_sandbox_quotes_only", claim: "当前导入样本中的低价候选", rankingExplanation: "仅按本次沙盒运行和导入样本中的只读候选证据排序，平台最终为准。", sourceBreakdown: { providerCount: 0, providerIds: [], fareSources: [] }, topCandidates: [], redacted: true };
    const selectedCandidate = ranking.topCandidates && ranking.topCandidates.length && typeof selectionApi.selectReadOnlyQuoteCandidate === "function"
      ? selectionApi.selectReadOnlyQuoteCandidate(ranking, ranking.topCandidates[0].quoteId, safeOptions)
      : null;
    const status = normalizedQuotes.length ? "completed" : (importResult.status === "blocked" ? "blocked" : "failed_safe");
    const runResult = {
      orchestratorName: ORCHESTRATOR_NAME,
      appVersion: MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION,
      status: status,
      runMode: "read_only_sandbox",
      runId: makeRunId(safeOptions.runIndex),
      providerRunMatrix: safeOptions.providerRunMatrix || null,
      generatedQuoteCount: normalizedQuotes.length,
      acceptedQuoteCount: normalizedQuotes.length,
      rejectedQuoteCount: 0,
      blockedQuoteCount: 0,
      ranking: ranking,
      selectedCandidate: selectedCandidate,
      evidence: { userFacingRealPriceEnabled: false, showableAsRealPrice: false, showableAsCandidateEvidence: true, canReplaceMainResultCard: false },
      safety: { productionProviderEnabled: false, networkAllowed: false, bookingUrl: null, checkoutUrl: null, paymentUrl: null, orderUrl: null, autoOpen: false, payment: false, order: false, identityUpload: false },
      dryRunTopCandidates: Array.isArray(ranking.topCandidates) ? ranking.topCandidates.slice(0, 3) : [],
      quotes: normalizedQuotes,
      rawResponseStored: false,
      autoOpen: false,
      redacted: true
    };
    runResult.runTimelineSummary = typeof timelineApi.buildReadOnlyQuoteRunTimeline === "function"
      ? timelineApi.buildReadOnlyQuoteRunTimeline(runResult, { runId: makeRunId(safeOptions.runIndex) })
      : { timelineName: "read_only_quote_run_timeline_v1", appVersion: MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION, runId: makeRunId(safeOptions.runIndex), status: status, steps: [], summary: "构建 Provider 运行矩阵 · 生成只读沙盒报价 · 报价归一化 · Top 3 排序 · 候选选择准备", rawResponseStored: false,
      autoOpen: false, productionProviderEnabled: false, bookingUrl: null, payment: false, order: false, identityUpload: false, redacted: true };
    return clone(decorateMultiProviderSandboxDryRunResult(runResult, safeOptions));
  }

  function decorateMultiProviderSandboxDryRunResult(result, options) {
    const safeResult = clone(result || {});
    const safeOptions = options && typeof options === "object" ? options : {};
    const historyApi = getHistoryStoreApi();
    const deltaApi = getDeltaCompareApi();
    const replayApi = getReplayGuardApi();
    const timelineApi = getTimelineApi();
    const sessionApi = getSessionApi();
    const auditExportApi = getAuditExportApi();
    const storageLike = safeOptions.storageLike || (typeof window !== "undefined" && window.localStorage ? window.localStorage : null);
    const existingHistory = typeof historyApi.loadReadOnlyQuoteRunHistory === "function" ? historyApi.loadReadOnlyQuoteRunHistory(storageLike) : { history: [] };
    const existingList = Array.isArray(existingHistory.history) ? existingHistory.history.slice() : [];
    const nextIndex = Number(safeOptions.runIndex) || Number(safeResult.runIndex) || (existingList.length + 1);
    const currentRunId = text(safeOptions.runId || safeResult.runId || makeRunId(nextIndex));
    safeResult.runIndex = nextIndex;
    safeResult.runId = currentRunId;
    const syntheticEntry = typeof historyApi.sanitizeReadOnlyQuoteRunHistoryEntry === "function"
      ? historyApi.sanitizeReadOnlyQuoteRunHistoryEntry(Object.assign({}, safeResult, { runId: currentRunId, runIndex: nextIndex }))
      : { historyEntryName:"read_only_quote_run_history_entry_v1", appVersion:MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION, runId:currentRunId, runIndex:nextIndex, runMode:"read_only_sandbox", status:text(safeResult.status || "not_run"), topCandidates:Array.isArray(safeResult.dryRunTopCandidates) ? safeResult.dryRunTopCandidates.slice(0, 3) : [], selectedCandidate:safeResult.selectedCandidate || null, timelineSummary:safeResult.runTimelineSummary || null, rawResponseStored:false, productionProviderEnabled:false, networkAllowed:false, redacted:true };
    let historyState = existingHistory;
    if (safeOptions.persistToHistory === true && typeof historyApi.appendReadOnlyQuoteRunHistory === "function") {
      historyState = historyApi.appendReadOnlyQuoteRunHistory(safeResult, storageLike, { runIndex: nextIndex });
    }
    const historyList = Array.isArray(historyState.history) ? historyState.history.slice() : existingList.slice();
    const previousRun = historyList.length > 1 ? historyList[historyList.length - 2] : (existingList.length ? existingList[existingList.length - 1] : null);
    const currentRun = historyList.length && text(historyList[historyList.length - 1].runId || "") === currentRunId ? historyList[historyList.length - 1] : syntheticEntry;
    const historySummary = typeof historyApi.buildReadOnlyQuoteRunHistorySummary === "function" ? historyApi.buildReadOnlyQuoteRunHistorySummary(historyState) : { historyStoreName:"read_only_quote_run_history_store_v1", appVersion:MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION, totalRunCount:historyList.length, latestRunId:historyList.length ? text(historyList[historyList.length - 1].runId || currentRunId) : currentRunId, latestRunIndex:historyList.length ? Number(historyList[historyList.length - 1].runIndex || historyList.length) : nextIndex, latestStatus:historyList.length ? text(historyList[historyList.length - 1].status || safeResult.status || "not_run") : text(safeResult.status || "not_run"), latestTopCandidateCount:historyList.length && Array.isArray(historyList[historyList.length - 1].topCandidates) ? historyList[historyList.length - 1].topCandidates.length : (Array.isArray(currentRun.topCandidates) ? currentRun.topCandidates.length : 0), recentRunIds:historyList.map(function (entry) { return text(entry.runId || ""); }), summary:historyList.length ? ("运行历史：最近一次沙盒运行 " + text(historyList[historyList.length - 1].runId || "未命名") + " · " + text(historyList[historyList.length - 1].status || "not_run") + " · Top 3 候选报价 " + String((historyList[historyList.length - 1].topCandidates || []).length || 0)) : "运行历史：暂无本地只读沙盒运行记录", redacted:true };
    const delta = previousRun && typeof deltaApi.compareReadOnlyQuoteRuns === "function" ? deltaApi.compareReadOnlyQuoteRuns(previousRun, currentRun, safeOptions) : null;
    const deltaSummary = typeof deltaApi.buildReadOnlyQuoteDeltaSummary === "function" ? deltaApi.buildReadOnlyQuoteDeltaSummary(delta || { status: historyList.length > 1 ? "compared" : "not_enough_history", previousRunId: previousRun ? text(previousRun.runId || "") : null, currentRunId: currentRunId, topCandidateDelta: { previousTotalPrice: null, currentTotalPrice: null, deltaAmount: null, deltaDirection: "unknown", previousProviderName: "", currentProviderName: "", providerChanged: false }, rankChanges: [], warnings:["价格、库存、税费和规则以平台页面为准。", "本对比仅基于本地只读沙盒运行结果，不代表真实最终价。"], canClaimLowestAcrossWeb:false, canClaimFinalBookablePrice:false, canReplaceMainResultCard:false, bookingUrl:null, payment:false, order:false, identityUpload:false, redacted:true }, safeOptions) : { compareName:"read_only_quote_delta_compare_v1", appVersion:MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION, status: historyList.length > 1 ? "compared" : "not_enough_history", scope:"local_read_only_sandbox_runs", claim:"仅比较本地只读沙盒运行结果", previousRunId: previousRun ? text(previousRun.runId || "") : null, currentRunId: currentRunId, topCandidateDelta:{ previousTotalPrice:null, currentTotalPrice:null, deltaAmount:null, deltaDirection:"unknown", previousProviderName:"", currentProviderName:"", providerChanged:false }, rankChanges:[], warnings:["价格、库存、税费和规则以平台页面为准。", "本对比仅基于本地只读沙盒运行结果，不代表真实最终价。"], canClaimLowestAcrossWeb:false, canClaimFinalBookablePrice:false, canReplaceMainResultCard:false, bookingUrl:null, payment:false, order:false, identityUpload:false, redacted:true, summary: historyList.length > 1 ? "本地只读沙盒运行对比：存在差异" : "本地只读沙盒运行对比：历史不足", compareStatus: historyList.length > 1 ? "compared" : "not_enough_history" };
    const replayState = typeof replayApi.evaluateReadOnlyQuoteReplayAvailability === "function" ? replayApi.evaluateReadOnlyQuoteReplayAvailability(historyState, safeOptions) : { replayGuardName:"read_only_quote_replay_guard_v1", appVersion:MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION, status:historyList.length ? "available" : "unavailable", replaySource:"local_redacted_run_history", replayedRunId:historyList.length ? text(historyList[historyList.length - 1].runId || currentRunId) : null, replayedCandidateCount:currentRun.topCandidates.length, canReplay:historyList.length > 0 && currentRun.topCandidates.length > 0, userTriggeredOnly:true, autoReplay:false, autoOpen:false, bookingUrl:null, payment:false, order:false, identityUpload:false, redacted:true };
    const replaySummary = typeof replayApi.replayLastReadOnlyQuoteRun === "function" ? replayApi.replayLastReadOnlyQuoteRun(historyState, safeOptions) : Object.assign({}, replayState, { replaySummary: historyList.length ? "Replay 只恢复候选证据，不重新请求 provider" : "Replay Guard：暂无可回放的本地脱敏运行历史", replayedRun: historyList.length ? syntheticEntry : null });
    let quoteSession = typeof sessionApi.createReadOnlyQuoteSession === "function" ? sessionApi.createReadOnlyQuoteSession({
      userIntentSummary: safeResult.request || {},
      route: safeResult.request ? [safeResult.request.origin, safeResult.request.destination].filter(Boolean).join(" → ") : "",
      departureDate: safeResult.request && safeResult.request.departureDate || "",
      directOnly: safeResult.request && safeResult.request.directOnly === true,
      sortIntent: safeResult.request && safeResult.request.sortIntent || ""
    }) : null;
    if (quoteSession && typeof sessionApi.updateReadOnlyQuoteSession === "function") {
      quoteSession = sessionApi.updateReadOnlyQuoteSession(quoteSession, { type:"DRY_RUN_COMPLETED", result:safeResult, runId:currentRunId });
      quoteSession = sessionApi.updateReadOnlyQuoteSession(quoteSession, { type:"HISTORY_APPENDED", historySummary:historySummary, runId:currentRunId });
      quoteSession = sessionApi.updateReadOnlyQuoteSession(quoteSession, { type:"DELTA_COMPARED", deltaSummary:deltaSummary, runId:currentRunId });
      quoteSession = sessionApi.updateReadOnlyQuoteSession(quoteSession, { type:"REPLAY_COMPLETED", replaySummary:replaySummary, runId:currentRunId });
      if (safeResult.selectedCandidate) quoteSession = sessionApi.updateReadOnlyQuoteSession(quoteSession, { type:"CANDIDATE_SELECTED", selectedCandidate:safeResult.selectedCandidate, runId:currentRunId });
    }
    const sessionSummary = quoteSession && typeof sessionApi.buildReadOnlyQuoteSessionSummary === "function" ? sessionApi.buildReadOnlyQuoteSessionSummary(quoteSession) : null;
    const auditExportPreview = sessionSummary && typeof auditExportApi.buildReadOnlyQuoteAuditExportPreview === "function" ? auditExportApi.buildReadOnlyQuoteAuditExportPreview(Object.assign({}, safeResult, { sessionSummary:sessionSummary, runHistorySummary:historySummary, quoteDeltaSummary:deltaSummary, replaySummary:replaySummary })) : null;
    const timelineInput = Object.assign({}, safeResult, { runHistorySummary: historySummary, quoteDeltaSummary: deltaSummary, replaySummary: replaySummary, sessionSummary: sessionSummary, auditExportReady: !!auditExportPreview, lastRunId: historySummary.latestRunId || currentRunId, compareStatus: deltaSummary.compareStatus || deltaSummary.status || "not_enough_history", replayStatus: replayState.status || "unavailable", replayReady: replayState.canReplay === true });
    safeResult.runTimelineSummary = typeof timelineApi.buildReadOnlyQuoteRunTimeline === "function"
      ? timelineApi.buildReadOnlyQuoteRunTimeline(timelineInput, { runId: currentRunId, runIndex: nextIndex, runHistorySummary: historySummary, quoteDeltaSummary: deltaSummary, replaySummary: replaySummary, sessionSummary: sessionSummary, auditExportReady: !!auditExportPreview })
      : { timelineName: "read_only_quote_run_timeline_v1", appVersion: MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION, runId: currentRunId, status: text(safeResult.status || "completed"), steps: [], summary: "构建 Provider 运行矩阵 · 生成只读沙盒报价 · 报价归一化 · Top 3 排序 · 候选选择准备 · Run History · Quote Delta Compare · Replay Guard", rawResponseStored: false, productionProviderEnabled: false, bookingUrl: null, payment: false, order: false, identityUpload: false, redacted: true };
    safeResult.historyEntry = syntheticEntry;
    safeResult.runHistorySummary = historySummary;
    safeResult.quoteDeltaSummary = deltaSummary;
    safeResult.replaySummary = replaySummary;
    safeResult.lastRunId = historySummary.latestRunId || currentRunId;
    safeResult.compareStatus = deltaSummary.compareStatus || deltaSummary.status || "not_enough_history";
    safeResult.replayStatus = replayState.status || "unavailable";
    safeResult.replayReady = replayState.canReplay === true;
    safeResult.quoteSession = quoteSession;
    safeResult.sessionSummary = sessionSummary;
    safeResult.sessionStatus = sessionSummary && sessionSummary.status || "";
    safeResult.sessionId = sessionSummary && sessionSummary.sessionId || "";
    safeResult.auditExportPreview = auditExportPreview;
    safeResult.auditExportReady = !!auditExportPreview;
    safeResult.sessionRecoverySummary = sessionSummary ? { title:"Session Recovery", available:true, sessionId:sessionSummary.sessionId, status:sessionSummary.status, replaySource:"local_redacted_run_history", autoOpen:false, networkAllowed:false, redacted:true } : null;
    safeResult.sessionEventPayload = {
      type: "DRY_RUN_COMPLETED",
      eventType: "DRY_RUN_COMPLETED",
      runId: currentRunId,
      sessionId: safeResult.sessionId,
      rawResponseStored: false,
      secretStored: false,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      redacted: true
    };
    safeResult.history = historyList;
    safeResult.rawResponseStored = false;
    safeResult.autoOpen = false;
    safeResult.redacted = true;
    return clone(safeResult);
  }

  function runMultiProviderSandboxDryRun(task, options) {
    try {
      const safeTask = task && typeof task === "object" ? task : {};
      const safeOptions = options && typeof options === "object" ? options : {};
      if (!safeTask || typeof safeTask !== "object" || (!text(safeTask.title) && !text(safeTask.origin) && !text(safeTask.destination) && !text(safeTask.departureDate) && !text(safeTask.rawInput) && !text(safeTask.inputSummary))) {
        return clone({
          orchestratorName: ORCHESTRATOR_NAME,
          appVersion: MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION,
          status: "failed_safe",
          runMode: "read_only_sandbox",
          runId: RUN_ID,
          providerRunMatrix: null,
          generatedQuoteCount: 0,
          acceptedQuoteCount: 0,
          rejectedQuoteCount: 0,
          blockedQuoteCount: 0,
          ranking: { rankingName: "read_only_quote_candidate_ranking_v1", appVersion: MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION, rankingScope: "imported_sandbox_quotes_only", claim: "当前导入样本中的低价候选", rankingExplanation: "仅按本次沙盒运行和导入样本中的只读候选证据排序，平台最终为准。", sourceBreakdown: { providerCount: 0, providerIds: [], fareSources: [] }, topCandidates: [], redacted: true },
          selectedCandidate: null,
          evidence: { userFacingRealPriceEnabled: false, showableAsRealPrice: false, showableAsCandidateEvidence: true, canReplaceMainResultCard: false },
          safety: { productionProviderEnabled: false, networkAllowed: false, bookingUrl: null, checkoutUrl: null, paymentUrl: null, orderUrl: null, autoOpen: false, payment: false, order: false, identityUpload: false },
          dryRunTopCandidates: [],
          quotes: [],
          runTimelineSummary: { timelineName: "read_only_quote_run_timeline_v1", appVersion: MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION, runId: RUN_ID, status: "failed_safe", steps: [], summary: "构建 Provider 运行矩阵 · 生成只读沙盒报价 · 报价归一化 · Top 3 排序 · 候选选择准备", rawResponseStored: false,
      autoOpen: false, productionProviderEnabled: false, bookingUrl: null, payment: false, order: false, identityUpload: false, redacted: true },
          rawResponseStored: false,
      autoOpen: false,
          redacted: true
        });
      }
      const request = buildMultiProviderSandboxDryRunRequest(safeTask, safeOptions);
      if (!safeTask || typeof safeTask !== "object" || !text(request.origin) || !text(request.destination) || !text(request.departureDate)) {
        return clone({
          orchestratorName: ORCHESTRATOR_NAME,
          appVersion: MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION,
          status: "failed_safe",
          runMode: "read_only_sandbox",
          runId: RUN_ID,
          providerRunMatrix: null,
          generatedQuoteCount: 0,
          acceptedQuoteCount: 0,
          rejectedQuoteCount: 0,
          blockedQuoteCount: 0,
          ranking: { rankingName: "read_only_quote_candidate_ranking_v1", appVersion: MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION, rankingScope: "imported_sandbox_quotes_only", claim: "当前导入样本中的低价候选", rankingExplanation: "仅按本次沙盒运行和导入样本中的只读候选证据排序，平台最终为准。", sourceBreakdown: { providerCount: 0, providerIds: [], fareSources: [] }, topCandidates: [], redacted: true },
          selectedCandidate: null,
          evidence: { userFacingRealPriceEnabled: false, showableAsRealPrice: false, showableAsCandidateEvidence: true, canReplaceMainResultCard: false },
          safety: { productionProviderEnabled: false, networkAllowed: false, bookingUrl: null, checkoutUrl: null, paymentUrl: null, orderUrl: null, autoOpen: false, payment: false, order: false, identityUpload: false },
          dryRunTopCandidates: [],
          quotes: [],
          runTimelineSummary: { timelineName: "read_only_quote_run_timeline_v1", appVersion: MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION, runId: RUN_ID, status: "failed_safe", steps: [], summary: "构建 Provider 运行矩阵 · 生成只读沙盒报价 · 报价归一化 · Top 3 排序 · 候选选择准备", rawResponseStored: false,
      autoOpen: false, productionProviderEnabled: false, bookingUrl: null, payment: false, order: false, identityUpload: false, redacted: true },
          rawResponseStored: false,
      autoOpen: false,
          redacted: true
        });
      }
      if (isRestrictedTask(safeTask)) {
        return clone({
          orchestratorName: ORCHESTRATOR_NAME,
          appVersion: MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION,
          status: "blocked",
          runMode: "read_only_sandbox",
          runId: RUN_ID,
          providerRunMatrix: typeof getMatrixApi().buildSandboxProviderRunMatrix === "function" ? getMatrixApi().buildSandboxProviderRunMatrix(safeOptions) : null,
          generatedQuoteCount: 0,
          acceptedQuoteCount: 0,
          rejectedQuoteCount: 0,
          blockedQuoteCount: 0,
          ranking: { rankingName: "read_only_quote_candidate_ranking_v1", appVersion: MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION, rankingScope: "imported_sandbox_quotes_only", claim: "当前导入样本中的低价候选", rankingExplanation: "仅按本次沙盒运行和导入样本中的只读候选证据排序，平台最终为准。", sourceBreakdown: { providerCount: 0, providerIds: [], fareSources: [] }, topCandidates: [], redacted: true },
          selectedCandidate: null,
          evidence: { userFacingRealPriceEnabled: false, showableAsRealPrice: false, showableAsCandidateEvidence: true, canReplaceMainResultCard: false },
          safety: { productionProviderEnabled: false, networkAllowed: false, bookingUrl: null, checkoutUrl: null, paymentUrl: null, orderUrl: null, autoOpen: false, payment: false, order: false, identityUpload: false },
          dryRunTopCandidates: [],
          quotes: [],
          runTimelineSummary: { timelineName: "read_only_quote_run_timeline_v1", appVersion: MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION, runId: RUN_ID, status: "blocked", steps: [], summary: "构建 Provider 运行矩阵 · 生成只读沙盒报价 · 报价归一化 · Top 3 排序 · 候选选择准备", rawResponseStored: false,
      autoOpen: false, productionProviderEnabled: false, bookingUrl: null, payment: false, order: false, identityUpload: false, redacted: true },
          rawResponseStored: false,
      autoOpen: false,
          redacted: true
        });
      }
      const matrixApi = getMatrixApi();
      const providerRunMatrix = typeof matrixApi.buildSandboxProviderRunMatrix === "function"
        ? matrixApi.buildSandboxProviderRunMatrix(safeOptions)
        : { matrixName: "sandbox_provider_run_matrix_v1", appVersion: MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION, runMode: "read_only_sandbox", providers: [], runnableCount: 0, disabledCount: 0, handoffOnlyCount: 0, productionProviderEnabled: false, networkAllowed: false, booking: false, payment: false, order: false, identityUpload: false, redacted: true };
      const rawQuotes = deterministicRawQuotes(request, providerRunMatrix);
      const normalizedApi = getNormalizerApi();
      const normalizedQuotes = rawQuotes.map(function (quote, index) {
        if (typeof normalizedApi.normalizeProviderSandboxQuote === "function") {
          return normalizedApi.normalizeProviderSandboxQuote(quote, { providerId: quote.providerId, providerMode: quote.providerMode, fareSource: quote.fareSource, origin: request.origin, destination: request.destination, departureDate: request.departureDate });
        }
        return Object.assign({}, quote, { quoteId: "quote_" + (index + 1), bookingUrl: null, checkoutUrl: null, paymentUrl: null, orderUrl: null, booking: false, payment: false, order: false, identityUpload: false, rawResponseStored: false,
      autoOpen: false, redacted: true });
      });
      const result = buildMultiProviderSandboxDryRunResult(normalizedQuotes, Object.assign({}, safeOptions, { providerRunMatrix: providerRunMatrix }));
      result.providerRunMatrix = providerRunMatrix;
      result.request = request;
      return clone(result);
    } catch (error) {
      return clone({
        orchestratorName: ORCHESTRATOR_NAME,
        appVersion: MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION,
        status: "failed_safe",
        runMode: "read_only_sandbox",
        runId: RUN_ID,
        providerRunMatrix: null,
        generatedQuoteCount: 0,
        acceptedQuoteCount: 0,
        rejectedQuoteCount: 0,
        blockedQuoteCount: 0,
        ranking: { rankingName: "read_only_quote_candidate_ranking_v1", appVersion: MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION, rankingScope: "imported_sandbox_quotes_only", claim: "当前导入样本中的低价候选", rankingExplanation: "仅按本次沙盒运行和导入样本中的只读候选证据排序，平台最终为准。", sourceBreakdown: { providerCount: 0, providerIds: [], fareSources: [] }, topCandidates: [], redacted: true },
        selectedCandidate: null,
        evidence: { userFacingRealPriceEnabled: false, showableAsRealPrice: false, showableAsCandidateEvidence: true, canReplaceMainResultCard: false },
        safety: { productionProviderEnabled: false, networkAllowed: false, bookingUrl: null, checkoutUrl: null, paymentUrl: null, orderUrl: null, autoOpen: false, payment: false, order: false, identityUpload: false },
        dryRunTopCandidates: [],
        quotes: [],
        runTimelineSummary: { timelineName: "read_only_quote_run_timeline_v1", appVersion: MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION, runId: RUN_ID, status: "failed_safe", steps: [], summary: "构建 Provider 运行矩阵 · 生成只读沙盒报价 · 报价归一化 · Top 3 排序 · 候选选择准备", rawResponseStored: false,
      autoOpen: false, productionProviderEnabled: false, bookingUrl: null, payment: false, order: false, identityUpload: false, redacted: true },
        rawResponseStored: false,
      autoOpen: false,
        redacted: true
      });
    }
  }

  function buildMultiProviderSandboxDryRunAuditDraft(input) {
    const result = input && input.orchestratorName === ORCHESTRATOR_NAME ? input : runMultiProviderSandboxDryRun(input || {}, {});
    const matrix = result.providerRunMatrix && typeof result.providerRunMatrix === "object" ? result.providerRunMatrix : null;
    return clone({
      eventType: "MULTI_PROVIDER_SANDBOX_DRY_RUN_AUDIT_DRAFT",
      orchestratorName: ORCHESTRATOR_NAME,
      appVersion: MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION,
      runId: text(result.runId || RUN_ID),
      status: text(result.status || "failed_safe"),
      runMode: "read_only_sandbox",
      providerCount: matrix && Number(matrix.providerCount != null ? matrix.providerCount : (Array.isArray(matrix.providers) ? matrix.providers.length : 0)) || 0,
      runnableCount: matrix ? Number(matrix.runnableCount || 0) : 0,
      generatedQuoteCount: Number(result.generatedQuoteCount || 0),
      acceptedQuoteCount: Number(result.acceptedQuoteCount || 0),
      rejectedQuoteCount: Number(result.rejectedQuoteCount || 0),
      blockedQuoteCount: Number(result.blockedQuoteCount || 0),
      selectedQuoteId: result.selectedCandidate && result.selectedCandidate.selectedQuoteId ? text(result.selectedCandidate.selectedQuoteId) : null,
      rawResponseStored: false,
      autoOpen: false,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      autoOpen: false,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    });
  }

  window.WeishanMultiProviderSandboxDryRunOrchestrator = {
    MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION,
    ORCHESTRATOR_NAME,
    RUN_ID,
    buildMultiProviderSandboxDryRunRequest,
    buildMultiProviderSandboxDryRunResult,
    runMultiProviderSandboxDryRun,
    buildMultiProviderSandboxDryRunAuditDraft
  };
})();
