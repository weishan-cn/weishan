;(function () {
  "use strict";

  const SANDBOX_RESPONSE_IMPORT_CONSOLE_VIEW_MODEL_VERSION = "2.1.50";
  const CONSOLE_NAME = "sandbox_response_import_console_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
  function getHarnessApi() { return window.WeishanSandboxProviderDryRunHarness || {}; }

  function safety() {
    return {
      noRawResponsePersistence:true,
      noSecretPersistence:true,
      noSecretDisplay:true,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      autoOpen:false,
      payment:false,
      order:false,
      identityUpload:false
    };
  }

  function messages() {
    return {
      helper:"仅支持只读沙盒响应样本。导入前会先校验并脱敏。",
      caveat:"导入结果仅作为候选证据，不代表已锁价或可出票。",
      platformFinal:"价格、库存、税费和规则以平台页面为准。"
    };
  }

  function actions(status) {
    return {
      canPreview:status !== "accepted",
      canImport:status === "preview_ready",
      canClear:true,
      canPasteSecretHere:false,
      canSaveRawResponse:false
    };
  }

  function emptyPreview(status, reason) {
    return {
      available:false,
      validationStatus:status || "not_run",
      providerId:"",
      providerName:"",
      providerMode:"sandbox_read_only",
      fareSource:"",
      currency:"",
      baseFare:null,
      taxesAndFees:null,
      providerFees:null,
      totalPrice:null,
      taxFeeIntegrityStatus:"not_run",
      freshnessStatus:"not_run",
      safeProviderHandoffReady:false,
      blockedReason:reason || "",
      warnings:[]
    };
  }

  function sanitizeReason(reason) {
    const value = text(reason || "sandbox response import did not pass validation");
    return value.replace(/token|key|secret|password|session|auth|credential/gi, "sensitive-field");
  }

  function previewFromResult(result) {
    const safe = result && typeof result === "object" ? result : {};
    const quote = safe.sanitizedQuote || safe.normalizedQuote || {};
    const validation = safe.validation || {};
    const integrity = validation.integrity || {};
    const status = text(safe.importStatus || safe.status || "failed_safe");
    return {
      available:true,
      validationStatus:status === "accepted" ? "accepted" : (status === "blocked" ? "blocked" : (status === "failed_safe" ? "failed_safe" : "rejected")),
      providerId:text(quote.providerId || safe.providerId || ""),
      providerName:text(quote.providerName || safe.providerName || ""),
      providerMode:text(quote.providerMode || "sandbox_read_only"),
      fareSource:text(quote.fareSource || ""),
      currency:text(quote.currency || ""),
      baseFare:number(quote.baseFare),
      taxesAndFees:number(quote.taxesAndFees),
      providerFees:number(quote.providerFees),
      totalPrice:number(quote.totalPrice),
      taxFeeIntegrityStatus:text(quote.taxFeeIntegrityStatus || integrity.taxFeeIntegrityStatus || (status === "accepted" ? "complete" : "not_run")),
      freshnessStatus:text(quote.freshnessStatus || integrity.freshnessStatus || (status === "accepted" ? "fresh" : "not_run")),
      safeProviderHandoffReady:safe.safeProviderHandoffReady === true || quote.safeProviderHandoffReady === true,
      blockedReason:status === "accepted" ? "" : sanitizeReason(safe.reason || (Array.isArray(safe.blockedReasons) ? safe.blockedReasons.join("; ") : "")),
      warnings:status === "accepted" && !(safe.safeProviderHandoffReady === true || quote.safeProviderHandoffReady === true) ? ["当前平台确认链接未通过安全检查"] : []
    };
  }

  function buildSandboxResponseImportConsoleModel(input) {
    const safe = input && typeof input === "object" ? input : {};
    const status = text(safe.status || "idle");
    return clone({
      consoleName:CONSOLE_NAME,
      appVersion:SANDBOX_RESPONSE_IMPORT_CONSOLE_VIEW_MODEL_VERSION,
      status:status,
      title:"沙盒响应导入",
      inputMode:"json_text",
      rawInputStored:false,
      preview:safe.preview && typeof safe.preview === "object" ? safe.preview : emptyPreview("not_run", ""),
      actions:actions(status),
      safety:safety(),
      messages:messages(),
      redacted:true
    });
  }

  function parseSandboxResponseImportText(rawInput, options) {
    const harnessApi = getHarnessApi();
    const rawText = text(rawInput);
    try {
      if (typeof harnessApi.validateRawSandboxResponseBeforeParse === "function") {
        const rawValidation = harnessApi.validateRawSandboxResponseBeforeParse(rawText, options);
        if (rawValidation.status === "blocked") return clone({ status:"blocked", value:null, reason:sanitizeReason(rawValidation.reason), rawInputStored:false, rawResponseStored:false, redacted:true });
        if (rawValidation.status === "failed_safe") return clone({ status:"failed_safe", value:null, reason:sanitizeReason(rawValidation.reason), rawInputStored:false, rawResponseStored:false, redacted:true });
      }
      const parsed = JSON.parse(rawText);
      return clone({ status:"accepted", value:parsed, reason:"", rawInputStored:false, rawResponseStored:false, redacted:true });
    } catch (error) {
      return clone({ status:"failed_safe", value:null, reason:"malformed JSON safe downgrade", rawInputStored:false, rawResponseStored:false, redacted:true });
    }
  }

  function buildSandboxResponseValidationPreview(rawInput, options) {
    const parsed = parseSandboxResponseImportText(rawInput, options);
    if (parsed.status === "blocked" || parsed.status === "failed_safe") {
      return buildSandboxResponseImportConsoleModel({
        status:parsed.status,
        preview:emptyPreview(parsed.status, parsed.reason)
      });
    }
    const harnessApi = getHarnessApi();
    const result = typeof harnessApi.importSandboxProviderReadOnlyResponse === "function"
      ? harnessApi.importSandboxProviderReadOnlyResponse(parsed.value, options)
      : { status:"failed_safe", importStatus:"failed_safe", reason:"sandbox harness unavailable", rawResponseStored:false, sanitized:true, redacted:true };
    const preview = previewFromResult(result);
    return buildSandboxResponseImportConsoleModel({
      status:preview.validationStatus === "accepted" ? "preview_ready" : preview.validationStatus,
      preview:preview
    });
  }

  function buildSandboxResponseImportResult(rawInput, options) {
    const previewModel = buildSandboxResponseValidationPreview(rawInput, options);
    if (previewModel.preview.validationStatus !== "accepted") {
      return clone(Object.assign({}, previewModel, { status:previewModel.preview.validationStatus, importResult:null }));
    }
    const parsed = parseSandboxResponseImportText(rawInput, options);
    const harnessApi = getHarnessApi();
    const result = typeof harnessApi.importSandboxProviderReadOnlyResponse === "function"
      ? harnessApi.importSandboxProviderReadOnlyResponse(parsed.value, options)
      : { status:"failed_safe", importStatus:"failed_safe", reason:"sandbox harness unavailable", rawResponseStored:false, sanitized:true, redacted:true };
    return clone(Object.assign({}, buildSandboxResponseImportConsoleModel({
      status:result.importStatus === "accepted" ? "accepted" : text(result.importStatus || result.status || "failed_safe"),
      preview:previewFromResult(result)
    }), {
      importResult:{
        status:text(result.importStatus || result.status || "failed_safe"),
        sanitizedQuote:result.sanitizedQuote || result.normalizedQuote || null,
        rawInputStored:false,
        rawResponseStored:false,
        sanitized:true,
        redacted:true,
        bookingUrl:null,
        checkoutUrl:null,
        paymentUrl:null,
        orderUrl:null,
        autoOpen:false,
        payment:false,
        order:false,
        identityUpload:false
      }
    }));
  }

  function reduceSandboxResponseImportConsoleEvent(state, event) {
    const current = buildSandboxResponseImportConsoleModel(state);
    const safeEvent = event && typeof event === "object" ? event : {};
    const type = text(safeEvent.type);
    if (type === "INPUT_CHANGED") return buildSandboxResponseImportConsoleModel({ status:"editing", preview:emptyPreview("not_run", "") });
    if (type === "PREVIEW_REQUESTED") return buildSandboxResponseValidationPreview(safeEvent.rawInput || safeEvent.text || "", safeEvent.options || {});
    if (type === "IMPORT_CONFIRMED") return buildSandboxResponseImportResult(safeEvent.rawInput || safeEvent.text || "", safeEvent.options || {});
    if (type === "IMPORT_REJECTED") return buildSandboxResponseImportConsoleModel({ status:"rejected", preview:emptyPreview("rejected", sanitizeReason(safeEvent.reason)) });
    if (type === "IMPORT_BLOCKED") return buildSandboxResponseImportConsoleModel({ status:"blocked", preview:emptyPreview("blocked", sanitizeReason(safeEvent.reason)) });
    if (type === "PARSE_FAILED_SAFE") return buildSandboxResponseImportConsoleModel({ status:"failed_safe", preview:emptyPreview("failed_safe", sanitizeReason(safeEvent.reason || "malformed JSON safe downgrade")) });
    if (type === "CLEAR_REQUESTED") return buildSandboxResponseImportConsoleModel({ status:"cleared", preview:emptyPreview("not_run", "") });
    return current;
  }

  function buildSandboxResponseImportConsoleAuditDraft(input) {
    const model = buildSandboxResponseImportConsoleModel(input);
    return clone({
      eventType:"SANDBOX_RESPONSE_IMPORT_CONSOLE_AUDIT_DRAFT",
      consoleName:CONSOLE_NAME,
      appVersion:SANDBOX_RESPONSE_IMPORT_CONSOLE_VIEW_MODEL_VERSION,
      status:model.status,
      validationStatus:model.preview.validationStatus,
      rawInputStored:false,
      rawResponseStored:false,
      canPasteSecretHere:false,
      canSaveRawResponse:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      autoOpen:false,
      payment:false,
      order:false,
      identityUpload:false,
      redacted:true
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
