;(function () {
  "use strict";

  const MULTI_SANDBOX_QUOTE_IMPORT_PROCESSOR_VERSION = "4.0.0";
  const PROCESSOR_NAME = "multi_sandbox_quote_import_processor_v1";
  const SENSITIVE_RAW_RE = /(token|key|secret|password|session|auth)/i;
  const TX_URL_RE = /"(bookingUrl|checkoutUrl|paymentUrl|orderUrl)"\s*:\s*"[^"]+"/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
  function hasSensitiveText(rawText) { return SENSITIVE_RAW_RE.test(text(rawText)); }
  function hasTransactionUrl(rawText) { return TX_URL_RE.test(text(rawText)); }
  function getHarnessApi() { return window.WeishanSandboxProviderDryRunHarness || {}; }
  function getNormalizerApi() { return window.WeishanProviderSandboxQuoteNormalizer || {}; }

  function emptyResult(status, extra) {
    return clone(Object.assign({
      processorName: PROCESSOR_NAME,
      appVersion: MULTI_SANDBOX_QUOTE_IMPORT_PROCESSOR_VERSION,
      status: status || "failed_safe",
      totalInputCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      blockedCount: 0,
      quotes: [],
      errors: [],
      warnings: [],
      sourceBreakdown: { providerCount: 0, providerIds: [], fareSources: [] },
      rawResponseStored: false,
      redacted: true
    }, extra || {}));
  }

  function sanitizeReason(reason) {
    return text(reason || "sandbox quote import did not pass validation").replace(/token|key|secret|password|session|auth|credential/gi, "sensitive-field");
  }

  function parseMultiSandboxQuoteImportText(rawInput) {
    const rawText = typeof rawInput === "string" ? rawInput : JSON.stringify(rawInput || {});
    if (hasSensitiveText(rawText)) return clone({ status: "blocked", values: [], reason: "sensitive-field detected", rawResponseStored: false, redacted: true });
    try {
      const parsed = typeof rawInput === "string" ? JSON.parse(rawInput) : rawInput;
      return clone({ status: "accepted", values: Array.isArray(parsed) ? parsed : [parsed], reason: "", rawResponseStored: false, redacted: true });
    } catch (_) {
      return clone({ status: "failed_safe", values: [], reason: "malformed JSON safe downgrade", rawResponseStored: false, redacted: true });
    }
  }

  function normalizeRawQuote(rawQuote, options, index) {
    const normalizerApi = getNormalizerApi();
    if (typeof normalizerApi.normalizeProviderSandboxQuote === "function") {
      return normalizerApi.normalizeProviderSandboxQuote(rawQuote, options);
    }
    const raw = rawQuote && typeof rawQuote === "object" ? rawQuote : {};
    const quoteId = text(raw.quoteId || "quote_" + (index + 1));
    return clone({
      normalizerName: "provider_sandbox_quote_normalizer_v1",
      appVersion: MULTI_SANDBOX_QUOTE_IMPORT_PROCESSOR_VERSION,
      status: "rejected",
      reason: "provider sandbox quote normalizer unavailable",
      quoteId: quoteId,
      providerId: text(raw.providerId || ""),
      providerName: text(raw.providerName || ""),
      providerMode: text(raw.providerMode || "sandbox_read_only"),
      fareSource: text(raw.fareSource || "sandbox_read_only_import"),
      responseShape: text(raw.responseShape || "unsupported"),
      route: clone(raw.route || {}),
      departureDate: text(raw.departureDate || ""),
      currency: text(raw.currency || ""),
      baseFare: number(raw.baseFare),
      taxesAndFees: number(raw.taxesAndFees),
      providerFees: number(raw.providerFees),
      totalPrice: number(raw.totalPrice),
      priceUpdatedAt: text(raw.priceUpdatedAt || ""),
      freshnessMinutes: number(raw.freshnessMinutes),
      freshnessStatus: "unknown",
      taxFeeIntegrityStatus: "incomplete",
      safeProviderHandoffReady: false,
      safeProviderHandoffUrl: null,
      safeProviderHandoffHost: "",
      handoffCandidate: null,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      booking: false,
      payment: false,
      order: false,
      identityUpload: false,
      rawResponseStored: false,
      redacted: true
    });
  }

  function sanitizeQuote(normalizedQuote, harnessResult, index) {
    const normalized = normalizedQuote && typeof normalizedQuote === "object" ? normalizedQuote : {};
    const harness = harnessResult && typeof harnessResult === "object" ? harnessResult : {};
    const safeReady = harness.safeProviderHandoffReady === true || normalized.safeProviderHandoffReady === true;
    const safeUrl = safeReady ? text(harness.safeProviderHandoffUrl || normalized.safeProviderHandoffUrl || "") : "";
    const quoteId = text(normalized.quoteId || "sandbox_quote_" + (index + 1));
    const providerName = text(normalized.providerName || harness.providerName || "");
    const responseShape = text(normalized.responseShape || harness.responseShape || "unsupported");
    const fareSource = text(normalized.fareSource || harness.fareSource || "sandbox_read_only_import");
    const sourceSummary = "来源：" + (providerName || "只读沙盒") + " / " + (responseShape || "导入样本");
    return clone({
      quoteId: quoteId,
      providerId: text(normalized.providerId || harness.providerId || ""),
      providerName: providerName,
      providerMode: text(normalized.providerMode || harness.providerMode || "sandbox_read_only"),
      fareSource: fareSource,
      responseShape: responseShape,
      route: clone(normalized.route || {}),
      departureDate: text(normalized.departureDate || ""),
      currency: text(normalized.currency || "").toUpperCase(),
      baseFare: number(normalized.baseFare),
      taxesAndFees: number(normalized.taxesAndFees),
      providerFees: number(normalized.providerFees) == null ? 0 : number(normalized.providerFees),
      totalPrice: number(normalized.totalPrice),
      priceUpdatedAt: text(normalized.priceUpdatedAt || ""),
      freshnessMinutes: number(normalized.freshnessMinutes) == null ? 0 : number(normalized.freshnessMinutes),
      freshnessStatus: text(normalized.freshnessStatus || "fresh"),
      taxFeeIntegrityStatus: text(normalized.taxFeeIntegrityStatus || "complete"),
      safeProviderHandoffReady: safeReady,
      safeProviderHandoffUrl: safeReady ? safeUrl : null,
      safeProviderHandoffDisplayHost: safeReady ? text(harness.safeProviderHandoffHost || normalized.safeProviderHandoffHost || "") : "",
      selectedSourceSummary: sourceSummary,
      sourceSummary: sourceSummary,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      booking: false,
      payment: false,
      order: false,
      identityUpload: false,
      rawResponseStored: false,
      redacted: true
    });
  }

  function sanitizeMultiSandboxQuoteImportResult(result) {
    const safe = result && typeof result === "object" ? result : emptyResult("failed_safe");
    const quotes = Array.isArray(safe.quotes) ? safe.quotes.map(function (quote) {
      return Object.assign({}, quote, { bookingUrl: null, checkoutUrl: null, paymentUrl: null, orderUrl: null, booking: false, payment: false, order: false, identityUpload: false, rawResponseStored: false, redacted: true });
    }) : [];
    const providerIds = Array.from(new Set(quotes.map(function (quote) { return text(quote.providerId); }).filter(Boolean)));
    const fareSources = Array.from(new Set(quotes.map(function (quote) { return text(quote.fareSource); }).filter(Boolean)));
    return clone({
      processorName: PROCESSOR_NAME,
      appVersion: MULTI_SANDBOX_QUOTE_IMPORT_PROCESSOR_VERSION,
      status: text(safe.status || "failed_safe"),
      totalInputCount: number(safe.totalInputCount) || 0,
      acceptedCount: number(safe.acceptedCount) || 0,
      rejectedCount: number(safe.rejectedCount) || 0,
      blockedCount: number(safe.blockedCount) || 0,
      quotes: quotes,
      sourceBreakdown: { providerCount: providerIds.length, providerIds: providerIds, fareSources: fareSources },
      errors: Array.isArray(safe.errors) ? safe.errors.map(function (error) { return { quoteIndex: error.quoteIndex == null ? null : error.quoteIndex, status: text(error.status || "rejected"), reason: sanitizeReason(error.reason), rawResponseStored: false, redacted: true }; }) : [],
      warnings: Array.isArray(safe.warnings) ? safe.warnings.map(sanitizeReason) : [],
      rawResponseStored: false,
      redacted: true
    });
  }

  function importMultiSandboxQuotes(rawInput, options) {
    const parsed = parseMultiSandboxQuoteImportText(rawInput, options);
    if (parsed.status === "blocked") return emptyResult("blocked", { errors: [{ quoteIndex: null, status: "blocked", reason: parsed.reason, rawResponseStored: false, redacted: true }], blockedCount: 1 });
    if (parsed.status === "failed_safe") return emptyResult("failed_safe", { errors: [{ quoteIndex: null, status: "failed_safe", reason: parsed.reason, rawResponseStored: false, redacted: true }] });

    const harnessApi = getHarnessApi();
    const quotes = [];
    const errors = [];
    let rejectedCount = 0;
    let blockedCount = 0;

    parsed.values.forEach(function (rawQuote, index) {
      const normalized = normalizeRawQuote(rawQuote, options, index);
      if (!normalized || normalized.status !== "normalized") {
        const status = text(normalized && normalized.status || "rejected");
        if (status === "blocked") blockedCount += 1; else rejectedCount += 1;
        errors.push({ quoteIndex: index, status: status === "blocked" ? "blocked" : "rejected", reason: sanitizeReason(normalized && (normalized.reason || normalized.validationReasons && normalized.validationReasons.join("; ")) || "provider sandbox quote rejected"), rawResponseStored: false, redacted: true });
        return;
      }
      const harnessResult = typeof harnessApi.importSandboxProviderReadOnlyResponse === "function"
        ? harnessApi.importSandboxProviderReadOnlyResponse(normalized, options)
        : { status: "failed_safe", importStatus: "failed_safe", reason: "sandbox harness unavailable", rawResponseStored: false, redacted: true };
      const status = text(harnessResult.importStatus || harnessResult.status || "failed_safe");
      if (status === "accepted") {
        quotes.push(sanitizeQuote(normalized, harnessResult, index));
        return;
      }
      if (status === "blocked") blockedCount += 1; else rejectedCount += 1;
      errors.push({ quoteIndex: index, status: status === "blocked" ? "blocked" : "rejected", reason: sanitizeReason(harnessResult.reason || normalized.reason || (Array.isArray(harnessResult.blockedReasons) ? harnessResult.blockedReasons.join("; ") : "")), rawResponseStored: false, redacted: true });
    });

    let status = "accepted";
    if (!quotes.length && blockedCount > 0) status = "blocked";
    else if (!quotes.length && rejectedCount > 0) status = "rejected";
    else if (quotes.length && (rejectedCount > 0 || blockedCount > 0)) status = "partial";

    return sanitizeMultiSandboxQuoteImportResult({
      status: status,
      totalInputCount: parsed.values.length,
      acceptedCount: quotes.length,
      rejectedCount: rejectedCount,
      blockedCount: blockedCount,
      quotes: quotes,
      errors: errors,
      warnings: quotes.some(function (quote) { return quote.safeProviderHandoffReady !== true; }) ? ["部分候选缺少已通过安全检查的平台确认链接"] : [],
      rawResponseStored: false,
      redacted: true
    });
  }

  function buildMultiSandboxQuoteImportPreview(rawInput, options) {
    return importMultiSandboxQuotes(rawInput, options);
  }

  function buildMultiSandboxQuoteImportAuditDraft(input) {
    const result = input && input.processorName === PROCESSOR_NAME ? input : importMultiSandboxQuotes(input || {});
    const sourceBreakdown = result && result.sourceBreakdown && typeof result.sourceBreakdown === "object" ? result.sourceBreakdown : { providerCount: 0, providerIds: [], fareSources: [] };
    return clone({
      eventType: "MULTI_SANDBOX_QUOTE_IMPORT_AUDIT_DRAFT",
      processorName: PROCESSOR_NAME,
      appVersion: MULTI_SANDBOX_QUOTE_IMPORT_PROCESSOR_VERSION,
      status: text(result.status || "failed_safe"),
      totalInputCount: number(result.totalInputCount) || 0,
      acceptedCount: number(result.acceptedCount) || 0,
      rejectedCount: number(result.rejectedCount) || 0,
      blockedCount: number(result.blockedCount) || 0,
      sourceBreakdown: clone(sourceBreakdown),
      rawResponseStored: false,
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
