;(function () {
  "use strict";

  const MULTI_SANDBOX_QUOTE_IMPORT_PROCESSOR_VERSION = "2.1.51";
  const PROCESSOR_NAME = "multi_sandbox_quote_import_processor_v1";
  const SENSITIVE_RAW_RE = /(token|key|secret|password|session|auth)/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
  function getHarnessApi() { return window.WeishanSandboxProviderDryRunHarness || {}; }
  function getRegistryApi() { return window.WeishanTrustedFlightSourceRegistry || {}; }
  function getGateApi() { return window.WeishanSafeProviderDeepLinkHandoffGate || {}; }

  function emptyResult(status, extra) {
    return clone(Object.assign({
      processorName:PROCESSOR_NAME,
      appVersion:MULTI_SANDBOX_QUOTE_IMPORT_PROCESSOR_VERSION,
      status:status || "failed_safe",
      totalInputCount:0,
      acceptedCount:0,
      rejectedCount:0,
      blockedCount:0,
      quotes:[],
      errors:[],
      warnings:[],
      rawResponseStored:false,
      redacted:true
    }, extra || {}));
  }

  function sanitizeReason(reason) {
    return text(reason || "sandbox quote import did not pass validation").replace(/token|key|secret|password|session|auth|credential/gi, "sensitive-field");
  }

  function parseMultiSandboxQuoteImportText(rawInput) {
    const rawText = typeof rawInput === "string" ? rawInput : JSON.stringify(rawInput || {});
    if (SENSITIVE_RAW_RE.test(rawText)) {
      return clone({ status:"blocked", values:[], reason:"sensitive-field detected", rawResponseStored:false, redacted:true });
    }
    try {
      const parsed = typeof rawInput === "string" ? JSON.parse(rawInput) : rawInput;
      const values = Array.isArray(parsed) ? parsed : [parsed];
      return clone({ status:"accepted", values:values, reason:"", rawResponseStored:false, redacted:true });
    } catch (_) {
      return clone({ status:"failed_safe", values:[], reason:"malformed JSON safe downgrade", rawResponseStored:false, redacted:true });
    }
  }

  function getTrustedSource(providerId) {
    const registryApi = getRegistryApi();
    if (typeof registryApi.getTrustedFlightSourceById === "function") return registryApi.getTrustedFlightSourceById(providerId);
    return { providerId:text(providerId), providerName:text(providerId || "Unknown provider"), providerType:"unknown", sourceBlocked:true, accessMode:"blocked", safeProviderHandoffUrl:null, safeProviderHandoffHost:"", redacted:true };
  }

  function deriveSafeHandoff(rawQuote, normalizedQuote) {
    const raw = rawQuote && typeof rawQuote === "object" ? rawQuote : {};
    const normalized = normalizedQuote && typeof normalizedQuote === "object" ? normalizedQuote : {};
    const handoffCandidate = raw.handoffCandidate && typeof raw.handoffCandidate === "object" ? raw.handoffCandidate : (normalized.handoffCandidate && typeof normalized.handoffCandidate === "object" ? normalized.handoffCandidate : {});
    const candidateProviderId = text(handoffCandidate.providerId || normalized.handoffCandidate && normalized.handoffCandidate.providerId || normalized.providerId || raw.providerId);
    const trusted = getTrustedSource(candidateProviderId);
    const sourceUrl = text(handoffCandidate.safeProviderHandoffUrl || trusted.safeProviderHandoffUrl || "");
    const gateApi = getGateApi();
    const gateInput = {
      providerId:text(trusted.providerId || candidateProviderId),
      providerName:text(trusted.providerName || handoffCandidate.providerName || normalized.providerName || raw.providerName),
      providerType:text(trusted.providerType || handoffCandidate.providerType || "flight_search"),
      searchOnly:true,
      safeProviderHandoffUrl:sourceUrl || null,
      restrictedCategory:false,
      fareSource:text(normalized.fareSource || raw.fareSource || "sandbox_read_only_import")
    };
    const gate = typeof gateApi.evaluateSafeProviderDeepLinkHandoff === "function"
      ? gateApi.evaluateSafeProviderDeepLinkHandoff(gateInput)
      : { providerConfirmationLink:sourceUrl ? "confirmation_required" : "disabled", safeProviderHandoffUrl:sourceUrl || null, safeProviderHandoffHost:"", autoOpen:false, redacted:true };
    const ready = gate && gate.providerConfirmationLink === "confirmation_required" && !!gate.safeProviderHandoffUrl;
    return clone({
      ready:ready,
      url:ready ? gate.safeProviderHandoffUrl : null,
      displayHost:ready ? text(gate.safeProviderHandoffHost || trusted.safeProviderHandoffHost || "") : "",
      reason:ready ? "" : "当前平台确认链接未通过安全检查"
    });
  }

  function sanitizeQuote(rawQuote, harnessResult, index) {
    const normalized = harnessResult && (harnessResult.sanitizedQuote || harnessResult.normalizedQuote) || {};
    const handoff = deriveSafeHandoff(rawQuote, normalized);
    const quoteId = text(normalized.quoteId || rawQuote && rawQuote.quoteId || ("sandbox_quote_" + (index + 1)));
    return clone({
      quoteId:quoteId,
      providerId:text(normalized.providerId || rawQuote && rawQuote.providerId || ""),
      providerName:text(normalized.providerName || rawQuote && rawQuote.providerName || ""),
      providerMode:text(normalized.providerMode || "sandbox_read_only"),
      fareSource:text(normalized.fareSource || "sandbox_read_only_import"),
      route:normalized.route && typeof normalized.route === "object" ? clone(normalized.route) : {},
      departureDate:text(normalized.departureDate || ""),
      currency:text(normalized.currency || ""),
      baseFare:number(normalized.baseFare),
      taxesAndFees:number(normalized.taxesAndFees),
      providerFees:number(normalized.providerFees),
      totalPrice:number(normalized.totalPrice),
      priceUpdatedAt:text(normalized.priceUpdatedAt || ""),
      freshnessMinutes:number(normalized.freshnessMinutes),
      freshnessStatus:text(normalized.freshnessStatus || "fresh"),
      taxFeeIntegrityStatus:text(normalized.taxFeeIntegrityStatus || "complete"),
      safeProviderHandoffReady:handoff.ready === true,
      safeProviderHandoffUrl:handoff.ready === true ? handoff.url : null,
      safeProviderHandoffDisplayHost:handoff.ready === true ? handoff.displayHost : "",
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      booking:false,
      payment:false,
      order:false,
      identityUpload:false,
      rawResponseStored:false,
      redacted:true
    });
  }

  function sanitizeMultiSandboxQuoteImportResult(result) {
    const safe = result && typeof result === "object" ? result : emptyResult("failed_safe");
    return clone({
      processorName:PROCESSOR_NAME,
      appVersion:MULTI_SANDBOX_QUOTE_IMPORT_PROCESSOR_VERSION,
      status:text(safe.status || "failed_safe"),
      totalInputCount:number(safe.totalInputCount) || 0,
      acceptedCount:number(safe.acceptedCount) || 0,
      rejectedCount:number(safe.rejectedCount) || 0,
      blockedCount:number(safe.blockedCount) || 0,
      quotes:Array.isArray(safe.quotes) ? safe.quotes.map(function (quote) {
        return Object.assign({}, quote, {
          bookingUrl:null,
          checkoutUrl:null,
          paymentUrl:null,
          orderUrl:null,
          booking:false,
          payment:false,
          order:false,
          identityUpload:false,
          rawResponseStored:false,
          redacted:true
        });
      }) : [],
      errors:Array.isArray(safe.errors) ? safe.errors.map(function (error) {
        return { quoteIndex:error.quoteIndex == null ? null : error.quoteIndex, status:text(error.status || "rejected"), reason:sanitizeReason(error.reason), rawResponseStored:false, redacted:true };
      }) : [],
      warnings:Array.isArray(safe.warnings) ? safe.warnings.map(sanitizeReason) : [],
      rawResponseStored:false,
      redacted:true
    });
  }

  function importMultiSandboxQuotes(rawInput, options) {
    const parsed = parseMultiSandboxQuoteImportText(rawInput, options);
    if (parsed.status === "blocked") return emptyResult("blocked", { errors:[{ quoteIndex:null, status:"blocked", reason:parsed.reason, rawResponseStored:false, redacted:true }], blockedCount:1 });
    if (parsed.status === "failed_safe") return emptyResult("failed_safe", { errors:[{ quoteIndex:null, status:"failed_safe", reason:parsed.reason, rawResponseStored:false, redacted:true }] });
    const harnessApi = getHarnessApi();
    const quotes = [];
    const errors = [];
    let rejectedCount = 0;
    let blockedCount = 0;
    parsed.values.forEach(function (rawQuote, index) {
      const result = typeof harnessApi.importSandboxProviderReadOnlyResponse === "function"
        ? harnessApi.importSandboxProviderReadOnlyResponse(rawQuote, options)
        : { status:"failed_safe", importStatus:"failed_safe", reason:"sandbox harness unavailable", rawResponseStored:false, redacted:true };
      const status = text(result.importStatus || result.status || "failed_safe");
      if (status === "accepted") {
        quotes.push(sanitizeQuote(rawQuote, result, index));
        return;
      }
      if (status === "blocked") blockedCount += 1;
      else rejectedCount += 1;
      errors.push({ quoteIndex:index, status:status === "blocked" ? "blocked" : "rejected", reason:sanitizeReason(result.reason || (Array.isArray(result.blockedReasons) ? result.blockedReasons.join("; ") : "")), rawResponseStored:false, redacted:true });
    });
    let status = "accepted";
    if (!quotes.length && blockedCount > 0) status = "blocked";
    else if (!quotes.length && rejectedCount > 0) status = "rejected";
    else if (quotes.length && (rejectedCount > 0 || blockedCount > 0)) status = "partial";
    return sanitizeMultiSandboxQuoteImportResult({
      status:status,
      totalInputCount:parsed.values.length,
      acceptedCount:quotes.length,
      rejectedCount:rejectedCount,
      blockedCount:blockedCount,
      quotes:quotes,
      errors:errors,
      warnings:quotes.some(function (quote) { return quote.safeProviderHandoffReady !== true; }) ? ["部分候选缺少已通过安全检查的平台确认链接"] : [],
      rawResponseStored:false,
      redacted:true
    });
  }

  function buildMultiSandboxQuoteImportPreview(rawInput, options) {
    return importMultiSandboxQuotes(rawInput, options);
  }

  function buildMultiSandboxQuoteImportAuditDraft(input) {
    const result = input && input.processorName === PROCESSOR_NAME ? input : importMultiSandboxQuotes(input || {});
    return clone({
      eventType:"MULTI_SANDBOX_QUOTE_IMPORT_AUDIT_DRAFT",
      processorName:PROCESSOR_NAME,
      appVersion:MULTI_SANDBOX_QUOTE_IMPORT_PROCESSOR_VERSION,
      status:text(result.status || "failed_safe"),
      totalInputCount:number(result.totalInputCount) || 0,
      acceptedCount:number(result.acceptedCount) || 0,
      rejectedCount:number(result.rejectedCount) || 0,
      blockedCount:number(result.blockedCount) || 0,
      rawResponseStored:false,
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

  window.WeishanMultiSandboxQuoteImportProcessor = {
    MULTI_SANDBOX_QUOTE_IMPORT_PROCESSOR_VERSION,
    PROCESSOR_NAME,
    parseMultiSandboxQuoteImportText,
    buildMultiSandboxQuoteImportPreview,
    importMultiSandboxQuotes,
    sanitizeMultiSandboxQuoteImportResult,
    buildMultiSandboxQuoteImportAuditDraft
  };
})();
