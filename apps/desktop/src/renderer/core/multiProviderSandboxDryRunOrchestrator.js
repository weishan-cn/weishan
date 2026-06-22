;(function () {
  "use strict";

  const MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION = "2.1.53";
  const ORCHESTRATOR_NAME = "multi_provider_sandbox_dry_run_orchestrator_v1";
  const RUN_ID = "deterministic-v2.1.53-read-only-sandbox-run";

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
      runId: RUN_ID,
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
      ? timelineApi.buildReadOnlyQuoteRunTimeline(runResult, { runId: RUN_ID })
      : { timelineName: "read_only_quote_run_timeline_v1", appVersion: MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION, runId: RUN_ID, status: status, steps: [], summary: "构建 Provider 运行矩阵 · 生成只读沙盒报价 · 报价归一化 · Top 3 排序 · 候选选择准备", rawResponseStored: false,
      autoOpen: false, productionProviderEnabled: false, bookingUrl: null, payment: false, order: false, identityUpload: false, redacted: true };
    return clone(runResult);
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
