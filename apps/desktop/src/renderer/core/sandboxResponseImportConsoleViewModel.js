;(function () {
  "use strict";

  const SANDBOX_RESPONSE_IMPORT_CONSOLE_VIEW_MODEL_VERSION = "2.1.53";
  const CONSOLE_NAME = "sandbox_response_import_console_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
  function getHarnessApi() { return window.WeishanSandboxProviderDryRunHarness || {}; }
  function getMultiImportApi() { return window.WeishanMultiSandboxQuoteImportProcessor || {}; }
  function getRankingApi() { return window.WeishanReadOnlyQuoteCandidateRanking || {}; }
  function getSelectionApi() { return window.WeishanReadOnlyQuoteCandidateSelection || {}; }
  function getDryRunApi() { return window.WeishanMultiProviderSandboxDryRunOrchestrator || {}; }

  function safety() {
    return {
      noRawResponsePersistence: true,
      noSecretPersistence: true,
      noSecretDisplay: true,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      autoOpen: false,
      payment: false,
      order: false,
      identityUpload: false
    };
  }

  function messages() {
    return {
      helper: "仅支持只读沙盒响应样本。导入前会先校验并脱敏。支持多 Provider 沙盒报价导入。",
      caveat: "导入结果仅作为候选证据，不代表已锁价或可出票。",
      platformFinal: "平台最终为准。",
      runSandbox: "支持运行沙盒只读报价。"
    };
  }

  function actions(status) {
    return {
      canPreview: status !== "accepted",
      canImport: status === "preview_ready" || status === "partial_preview_ready",
      canClear: true,
      canPasteSecretHere: false,
      canSaveRawResponse: false
    };
  }

  function emptyPreview(status, reason) {
    return {
      available: false,
      validationStatus: status || "not_run",
      providerId: "",
      providerName: "",
      providerMode: "sandbox_read_only",
      responseShape: "unsupported",
      fareSource: "",
      currency: "",
      baseFare: null,
      taxesAndFees: null,
      providerFees: null,
      totalPrice: null,
      taxFeeIntegrityStatus: "not_run",
      freshnessStatus: "not_run",
      safeProviderHandoffReady: false,
      blockedReason: reason || "",
      warnings: []
    };
  }

  function sanitizeReason(reason) {
    return text(reason || "sandbox response import did not pass validation").replace(/token|key|secret|password|session|auth|credential/gi, "sensitive-field");
  }

  function sourceSummary(item) {
    return "来源：" + (text(item.providerName || "") || "只读沙盒") + " / " + (text(item.responseShape || "") || text(item.fareSource || "导入样本"));
  }

  function previewFromQuote(quote, status, reason) {
    const safe = quote && typeof quote === "object" ? quote : {};
    return {
      available: !!quote,
      validationStatus: status || (quote ? "accepted" : "not_run"),
      providerId: text(safe.providerId || ""),
      providerName: text(safe.providerName || ""),
      providerMode: text(safe.providerMode || "sandbox_read_only"),
      responseShape: text(safe.responseShape || "unsupported"),
      fareSource: text(safe.fareSource || ""),
      currency: text(safe.currency || ""),
      baseFare: number(safe.baseFare),
      taxesAndFees: number(safe.taxesAndFees),
      providerFees: number(safe.providerFees),
      totalPrice: number(safe.totalPrice),
      taxFeeIntegrityStatus: text(safe.taxFeeIntegrityStatus || (quote ? "complete" : "not_run")),
      freshnessStatus: text(safe.freshnessStatus || (quote ? "fresh" : "not_run")),
      safeProviderHandoffReady: safe.safeProviderHandoffReady === true,
      blockedReason: quote ? "" : sanitizeReason(reason),
      warnings: quote && safe.safeProviderHandoffReady !== true ? ["当前平台确认链接未通过安全检查"] : [],
      sourceSummary: sourceSummary(safe)
    };
  }

  function previewFromResult(result) {
    const safe = result && typeof result === "object" ? result : {};
    if (Array.isArray(safe.quotes)) {
      const first = safe.quotes[0] || null;
      const status = safe.status === "accepted" || safe.status === "partial" ? "accepted" : text(safe.status || "failed_safe");
      return previewFromQuote(first, status, safe.errors && safe.errors[0] && safe.errors[0].reason);
    }
    const quote = safe.sanitizedQuote || safe.normalizedQuote || null;
    const status = text(safe.importStatus || safe.status || "failed_safe");
    return previewFromQuote(quote, status === "accepted" ? "accepted" : (status === "blocked" ? "blocked" : (status === "failed_safe" ? "failed_safe" : "rejected")), safe.reason || (Array.isArray(safe.blockedReasons) ? safe.blockedReasons.join("; ") : ""));
  }

  function rankingFromQuotes(quotes) {
    const rankingApi = getRankingApi();
    return typeof rankingApi.buildTopReadOnlyQuoteCandidates === "function"
      ? rankingApi.buildTopReadOnlyQuoteCandidates(quotes || [], { rankingScope: "imported_sandbox_quotes_only" })
      : { rankingName: "read_only_quote_candidate_ranking_v1", appVersion: SANDBOX_RESPONSE_IMPORT_CONSOLE_VIEW_MODEL_VERSION, rankingScope: "imported_sandbox_quotes_only", claim: "当前导入样本中的低价候选", rankingExplanation: "仅按导入样本中的只读候选证据排序，平台最终为准。", sourceBreakdown: { providerCount: 0, providerIds: [], fareSources: [] }, topCandidates: [], canClaimLowestAcrossWeb: false, canClaimFinalBookablePrice: false, canReplaceMainResultCard: false, redacted: true };
  }

  function buildMultiQuotePreview(importResult, ranking) {
    const safe = importResult && typeof importResult === "object" ? importResult : {};
    const sourceBreakdown = ranking && ranking.sourceBreakdown ? ranking.sourceBreakdown : { providerCount: 0, providerIds: [], fareSources: [] };
    return {
      title: "多 Provider 沙盒报价导入",
      totalInputCount: number(safe.totalInputCount) || 0,
      acceptedCount: number(safe.acceptedCount) || 0,
      rejectedCount: number(safe.rejectedCount) || 0,
      blockedCount: number(safe.blockedCount) || 0,
      status: text(safe.status || "not_run"),
      quotes: Array.isArray(safe.quotes) ? safe.quotes : [],
      topCandidates: ranking && Array.isArray(ranking.topCandidates) ? ranking.topCandidates : [],
      sourceBreakdown: sourceBreakdown,
      rankingExplanation: ranking && ranking.rankingExplanation ? ranking.rankingExplanation : "仅按导入样本中的只读候选证据排序，平台最终为准。",
      rawResponseStored: false,
      redacted: true
    };
  }

  function buildSandboxResponseImportConsoleModel(input) {
    const safe = input && typeof input === "object" ? input : {};
    const status = text(safe.status || "idle");
    const ranking = safe.rankingPreview && typeof safe.rankingPreview === "object" ? safe.rankingPreview : rankingFromQuotes([]);
    const multiQuotePreview = safe.multiQuotePreview && typeof safe.multiQuotePreview === "object" ? safe.multiQuotePreview : buildMultiQuotePreview(null, ranking);
    const sandboxDryRunSummary = safe.sandboxDryRunSummary && typeof safe.sandboxDryRunSummary === "object" ? safe.sandboxDryRunSummary : null;
    const runTimelineSummary = safe.runTimelineSummary && typeof safe.runTimelineSummary === "object" ? safe.runTimelineSummary : (sandboxDryRunSummary && sandboxDryRunSummary.runTimelineSummary && typeof sandboxDryRunSummary.runTimelineSummary === "object" ? sandboxDryRunSummary.runTimelineSummary : null);
    const providerRunMatrix = safe.providerRunMatrix && typeof safe.providerRunMatrix === "object" ? safe.providerRunMatrix : (sandboxDryRunSummary && sandboxDryRunSummary.providerRunMatrix && typeof sandboxDryRunSummary.providerRunMatrix === "object" ? sandboxDryRunSummary.providerRunMatrix : null);
    const dryRunTopCandidates = Array.isArray(safe.dryRunTopCandidates) ? safe.dryRunTopCandidates : (sandboxDryRunSummary && Array.isArray(sandboxDryRunSummary.dryRunTopCandidates) ? sandboxDryRunSummary.dryRunTopCandidates : (Array.isArray(ranking.topCandidates) ? ranking.topCandidates : []));
    const dryRunButton = safe.dryRunButton && typeof safe.dryRunButton === "object" ? safe.dryRunButton : { label:"运行沙盒只读报价", enabled:true, loading:false, autoRun:false };
    const dryRunStatus = text(safe.dryRunStatus || (sandboxDryRunSummary && sandboxDryRunSummary.status) || (runTimelineSummary && runTimelineSummary.status) || "not_run");
    return clone({
      consoleName: CONSOLE_NAME,
      appVersion: SANDBOX_RESPONSE_IMPORT_CONSOLE_VIEW_MODEL_VERSION,
      status: status,
      title: "多 Provider 沙盒报价导入",
      inputMode: "json_text_or_array",
      importScopeLabel: "导入样本范围",
      lowPriceClaim: "当前导入样本中的低价候选",
      rawInputStored: false,
      preview: safe.preview && typeof safe.preview === "object" ? safe.preview : emptyPreview("not_run", ""),
      multiQuotePreview: multiQuotePreview,
      rankingPreview: ranking,
      sourceBreakdown: ranking.sourceBreakdown || { providerCount: 0, providerIds: [], fareSources: [] },
      rankingExplanation: ranking.rankingExplanation || "仅按导入样本中的只读候选证据排序，平台最终为准。",
      sandboxDryRunSummary: sandboxDryRunSummary,
      runTimelineSummary: runTimelineSummary,
      providerRunMatrix: providerRunMatrix,
      dryRunStatus: dryRunStatus,
      dryRunButton: dryRunButton,
      dryRunTopCandidates: dryRunTopCandidates,
      selectedCandidate: safe.selectedCandidate && typeof safe.selectedCandidate === "object" ? safe.selectedCandidate : null,
      actions: Object.assign({ canDryRun: dryRunButton.enabled !== false }, actions(status)),
      safety: safety(),
      messages: messages(),
      redacted: true
    });
  }

  function parseSandboxResponseImportText(rawInput, options) {
    const multiApi = getMultiImportApi();
    if (typeof multiApi.parseMultiSandboxQuoteImportText === "function") {
      const parsed = multiApi.parseMultiSandboxQuoteImportText(rawInput, options);
      if (parsed.status === "accepted") return clone({ status: "accepted", value: parsed.values && parsed.values.length === 1 ? parsed.values[0] : parsed.values, values: parsed.values, reason: "", rawInputStored: false, rawResponseStored: false, redacted: true });
      return clone({ status: parsed.status || "failed_safe", value: null, values: [], reason: sanitizeReason(parsed.reason), rawInputStored: false, rawResponseStored: false, redacted: true });
    }
    const harnessApi = getHarnessApi();
    const rawText = text(rawInput);
    try {
      if (typeof harnessApi.validateRawSandboxResponseBeforeParse === "function") {
        const rawValidation = harnessApi.validateRawSandboxResponseBeforeParse(rawText, options);
        if (rawValidation.status === "blocked") return clone({ status: "blocked", value: null, values: [], reason: sanitizeReason(rawValidation.reason), rawInputStored: false, rawResponseStored: false, redacted: true });
        if (rawValidation.status === "failed_safe") return clone({ status: "failed_safe", value: null, values: [], reason: sanitizeReason(rawValidation.reason), rawInputStored: false, rawResponseStored: false, redacted: true });
      }
      const parsed = JSON.parse(rawText);
      return clone({ status: "accepted", value: parsed, values: Array.isArray(parsed) ? parsed : [parsed], reason: "", rawInputStored: false, rawResponseStored: false, redacted: true });
    } catch (error) {
      return clone({ status: "failed_safe", value: null, values: [], reason: "malformed JSON safe downgrade", rawInputStored: false, rawResponseStored: false, redacted: true });
    }
  }

  function buildSandboxResponseValidationPreview(rawInput, options) {
    const parsed = parseSandboxResponseImportText(rawInput, options);
    if (parsed.status === "blocked" || parsed.status === "failed_safe") {
      return buildSandboxResponseImportConsoleModel({
        status: parsed.status,
        preview: emptyPreview(parsed.status, parsed.reason),
        multiQuotePreview: buildMultiQuotePreview({ status: parsed.status, totalInputCount: 0, acceptedCount: 0, rejectedCount: 0, blockedCount: parsed.status === "blocked" ? 1 : 0, quotes: [] }, rankingFromQuotes([]))
      });
    }
    const multiApi = getMultiImportApi();
    const importResult = typeof multiApi.buildMultiSandboxQuoteImportPreview === "function"
      ? multiApi.buildMultiSandboxQuoteImportPreview(rawInput, options)
      : null;
    const result = importResult || (function () {
      const harnessApi = getHarnessApi();
      return typeof harnessApi.importSandboxProviderReadOnlyResponse === "function"
        ? harnessApi.importSandboxProviderReadOnlyResponse(parsed.value, options)
        : { status: "failed_safe", importStatus: "failed_safe", reason: "sandbox harness unavailable", rawResponseStored: false, sanitized: true, redacted: true };
    })();
    const quotes = Array.isArray(result.quotes) ? result.quotes : (result.sanitizedQuote || result.normalizedQuote ? [result.sanitizedQuote || result.normalizedQuote] : []);
    const ranking = rankingFromQuotes(quotes);
    const preview = previewFromResult(result);
    const ready = result.status === "accepted" || result.status === "partial" || preview.validationStatus === "accepted";
    return buildSandboxResponseImportConsoleModel({
      status: ready ? "preview_ready" : preview.validationStatus,
      preview: preview,
      multiQuotePreview: buildMultiQuotePreview(result, ranking),
      rankingPreview: ranking,
      sourceBreakdown: ranking.sourceBreakdown,
      rankingExplanation: ranking.rankingExplanation
    });
  }

  function buildSandboxResponseImportResult(rawInput, options) {
    const previewModel = buildSandboxResponseValidationPreview(rawInput, options);
    if (previewModel.preview.validationStatus !== "accepted") {
      return clone(Object.assign({}, previewModel, { status: previewModel.preview.validationStatus, importResult: null }));
    }
    const safeOptions = options && typeof options === "object" ? options : {};
    const multiApi = getMultiImportApi();
    const result = typeof multiApi.importMultiSandboxQuotes === "function"
      ? multiApi.importMultiSandboxQuotes(rawInput, options)
      : null;
    const parsed = result ? null : parseSandboxResponseImportText(rawInput, options);
    const fallbackResult = result || (function () {
      const harnessApi = getHarnessApi();
      return typeof harnessApi.importSandboxProviderReadOnlyResponse === "function"
        ? harnessApi.importSandboxProviderReadOnlyResponse(parsed.value, options)
        : { status: "failed_safe", importStatus: "failed_safe", reason: "sandbox harness unavailable", rawResponseStored: false, sanitized: true, redacted: true };
    })();
    const quotes = Array.isArray(fallbackResult.quotes) ? fallbackResult.quotes : (fallbackResult.sanitizedQuote || fallbackResult.normalizedQuote ? [fallbackResult.sanitizedQuote || fallbackResult.normalizedQuote] : []);
    const ranking = rankingFromQuotes(quotes);
    const firstQuote = quotes[0] || null;
    const importStatus = text(fallbackResult.status || fallbackResult.importStatus || "failed_safe");
    return clone(Object.assign({}, buildSandboxResponseImportConsoleModel({
      status: importStatus,
      preview: previewFromResult(fallbackResult),
      multiQuotePreview: buildMultiQuotePreview(fallbackResult, ranking),
      rankingPreview: ranking,
      sourceBreakdown: ranking.sourceBreakdown,
      rankingExplanation: ranking.rankingExplanation,
      sandboxDryRunSummary: safeOptions.sandboxDryRunSummary || previewModel.sandboxDryRunSummary || null,
      runTimelineSummary: safeOptions.runTimelineSummary || previewModel.runTimelineSummary || null,
      providerRunMatrix: safeOptions.providerRunMatrix || previewModel.providerRunMatrix || null,
      dryRunStatus: safeOptions.dryRunStatus || previewModel.dryRunStatus || "not_run",
      dryRunButton: safeOptions.dryRunButton || previewModel.dryRunButton || { label:"运行沙盒只读报价", enabled:true, loading:false, autoRun:false },
      dryRunTopCandidates: safeOptions.dryRunTopCandidates || previewModel.dryRunTopCandidates || []
    }), {
      importResult: {
        status: importStatus,
        sanitizedQuote: firstQuote,
        multiQuoteImportResult: fallbackResult,
        rankingPreview: ranking,
        rawInputStored: false,
        rawResponseStored: false,
        sanitized: true,
        redacted: true,
        bookingUrl: null,
        checkoutUrl: null,
        paymentUrl: null,
        orderUrl: null,
        autoOpen: false,
        payment: false,
        order: false,
        identityUpload: false
      }
    }));
  }

  function reduceSandboxResponseImportConsoleEvent(state, event) {
    const current = buildSandboxResponseImportConsoleModel(state);
    const safeEvent = event && typeof event === "object" ? event : {};
    const type = text(safeEvent.type);
    if (type === "INPUT_CHANGED") return buildSandboxResponseImportConsoleModel({ status: "editing", preview: emptyPreview("not_run", "") });
    if (type === "DRY_RUN_REQUESTED") {
      const dryRunApi = getDryRunApi();
      const task = safeEvent.task && typeof safeEvent.task === "object" ? safeEvent.task : { title: safeEvent.rawInput || safeEvent.text || "" };
      const dryRun = typeof dryRunApi.runMultiProviderSandboxDryRun === "function" ? dryRunApi.runMultiProviderSandboxDryRun(task, safeEvent.options || {}) : null;
      return buildSandboxResponseImportConsoleModel(Object.assign({}, current, {
        status: dryRun && dryRun.status === "blocked" ? "blocked" : (dryRun && dryRun.status === "failed_safe" ? "failed_safe" : "dry_run_ready"),
        sandboxDryRunSummary: dryRun,
        runTimelineSummary: dryRun && dryRun.runTimelineSummary ? dryRun.runTimelineSummary : null,
        providerRunMatrix: dryRun && dryRun.providerRunMatrix ? dryRun.providerRunMatrix : null,
        dryRunStatus: dryRun && dryRun.status ? dryRun.status : "not_run",
        dryRunButton: { label: "运行沙盒只读报价", enabled: true, loading: false, autoRun: false },
        dryRunTopCandidates: dryRun && Array.isArray(dryRun.dryRunTopCandidates) ? dryRun.dryRunTopCandidates : (dryRun && dryRun.ranking && Array.isArray(dryRun.ranking.topCandidates) ? dryRun.ranking.topCandidates : [])
      }));
    }
    if (type === "PREVIEW_REQUESTED") return buildSandboxResponseValidationPreview(safeEvent.rawInput || safeEvent.text || "", safeEvent.options || {});
    if (type === "IMPORT_CONFIRMED") return buildSandboxResponseImportResult(safeEvent.rawInput || safeEvent.text || "", safeEvent.options || {});
    if (type === "CANDIDATE_SELECTED") {
      const selectionApi = getSelectionApi();
      const ranking = current.rankingPreview || {};
      const selection = typeof selectionApi.selectReadOnlyQuoteCandidate === "function" ? selectionApi.selectReadOnlyQuoteCandidate(ranking, safeEvent.quoteId || safeEvent.selectedQuoteId || "", safeEvent.options || {}) : null;
      return buildSandboxResponseImportConsoleModel(Object.assign({}, current, { status: selection && selection.selected ? "candidate_selected" : "selection_rejected", selectedCandidate: selection }));
    }
    if (type === "IMPORT_REJECTED") return buildSandboxResponseImportConsoleModel({ status: "rejected", preview: emptyPreview("rejected", sanitizeReason(safeEvent.reason)) });
    if (type === "IMPORT_BLOCKED") return buildSandboxResponseImportConsoleModel({ status: "blocked", preview: emptyPreview("blocked", sanitizeReason(safeEvent.reason)) });
    if (type === "PARSE_FAILED_SAFE") return buildSandboxResponseImportConsoleModel({ status: "failed_safe", preview: emptyPreview("failed_safe", sanitizeReason(safeEvent.reason || "malformed JSON safe downgrade")) });
    if (type === "CLEAR_REQUESTED") return buildSandboxResponseImportConsoleModel({ status: "cleared", preview: emptyPreview("not_run", "") });
    return current;
  }

  function buildSandboxResponseImportConsoleAuditDraft(input) {
    const model = buildSandboxResponseImportConsoleModel(input);
    return clone({
      eventType: "SANDBOX_RESPONSE_IMPORT_CONSOLE_AUDIT_DRAFT",
      consoleName: CONSOLE_NAME,
      appVersion: SANDBOX_RESPONSE_IMPORT_CONSOLE_VIEW_MODEL_VERSION,
      status: model.status,
      validationStatus: model.preview.validationStatus,
      totalInputCount: model.multiQuotePreview.totalInputCount,
      topCandidateCount: model.rankingPreview && Array.isArray(model.rankingPreview.topCandidates) ? model.rankingPreview.topCandidates.length : 0,
      sourceBreakdown: model.sourceBreakdown,
      rankingExplanation: model.rankingExplanation,
      dryRunStatus: model.dryRunStatus,
      dryRunButton: model.dryRunButton,
      dryRunTopCandidates: Array.isArray(model.dryRunTopCandidates) ? model.dryRunTopCandidates : [],
      sandboxDryRunSummary: model.sandboxDryRunSummary || null,
      runTimelineSummary: model.runTimelineSummary || null,
      providerRunMatrix: model.providerRunMatrix || null,
      rawInputStored: false,
      rawResponseStored: false,
      canPasteSecretHere: false,
      canSaveRawResponse: false,
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

  window.WeishanSandboxResponseImportConsoleViewModel = {
    SANDBOX_RESPONSE_IMPORT_CONSOLE_VIEW_MODEL_VERSION,
    CONSOLE_NAME,
    buildSandboxResponseImportConsoleModel,
    parseSandboxResponseImportText,
    buildSandboxResponseValidationPreview,
    buildSandboxResponseImportResult,
    reduceSandboxResponseImportConsoleEvent,
    buildSandboxResponseImportConsoleAuditDraft
  };
})();
