;(function () {
  "use strict";

  const SANDBOX_PROVIDER_DRY_RUN_HARNESS_VERSION = "2.2.4";
  const HARNESS_NAME = "sandbox_provider_dry_run_harness_v1";
  const SAFE_FARE_SOURCES = ["sandbox_read_only_import", "sandbox_read_only", "fixture_read_only"];
  const UNSAFE_NAME_RE = /(token|key|secret|password|session|auth|credential)/i;
  const TRANSACTION_NAME_RE = /(bookingUrl|checkoutUrl|paymentUrl|orderUrl|ticketUrl|reservationUrl)/i;
  const TRANSACTION_VALUE_RE = /(checkout|payment|pay|order|booking|ticket|reserve)/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
  function hasOwn(obj, key) { return Object.prototype.hasOwnProperty.call(obj || {}, key); }
  function getRegistryApi() { return window.WeishanTrustedFlightSourceRegistry || {}; }
  function getGateApi() { return window.WeishanSafeProviderDeepLinkHandoffGate || {}; }
  function getContractApi() { return window.WeishanRealFlightPriceReadOnlyProviderContract || {}; }
  function getIntegrityApi() { return window.WeishanRealFlightPriceIntegrityGuard || {}; }

  function blockedStatus(reason, extra) {
    return clone(Object.assign({
      harnessName:HARNESS_NAME,
      appVersion:SANDBOX_PROVIDER_DRY_RUN_HARNESS_VERSION,
      status:"blocked",
      importStatus:"blocked",
      reason:reason || "sandbox import blocked",
      blockedReasons:reason ? [reason] : ["sandbox import blocked"],
      normalizedQuote:null,
      sanitizedQuote:null,
      safeProviderHandoffReady:false,
      safeProviderHandoffUrl:null,
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
    }, extra || {}));
  }

  function walkUnsafeFields(value, path, findings) {
    if (!value || typeof value !== "object") return;
    Object.keys(value).forEach(function (name) {
      const full = path ? path + "." + name : name;
      if (UNSAFE_NAME_RE.test(name)) findings.unsafeNames.push(full);
      const next = value[name];
      if (TRANSACTION_NAME_RE.test(name) && next != null && text(next) !== "") findings.transactionNames.push(full);
      if (typeof next === "string" && TRANSACTION_VALUE_RE.test(next)) findings.transactionValues.push(full);
      if (next && typeof next === "object") walkUnsafeFields(next, full, findings);
    });
  }

  function detectUnsafe(rawResponse) {
    const findings = { unsafeNames:[], transactionNames:[], transactionValues:[] };
    walkUnsafeFields(rawResponse, "", findings);
    return findings;
  }

  function detectSensitiveFieldsInSandboxResponse(rawInput) {
    const rawText = typeof rawInput === "string" ? rawInput : JSON.stringify(rawInput || {});
    const sensitive = UNSAFE_NAME_RE.test(rawText);
    const transaction = /"(?:bookingUrl|checkoutUrl|paymentUrl|orderUrl|ticketUrl|reservationUrl)"\s*:\s*"[^"]+"/i.test(rawText);
    return clone({
      sensitiveDetected:sensitive,
      transactionDetected:transaction,
      blocked:sensitive || transaction,
      reason:sensitive ? "sensitive credential-like field detected" : (transaction ? "transaction URL field detected" : ""),
      rawInputStored:false,
      rawResponseStored:false,
      redacted:true
    });
  }

  function validateRawSandboxResponseBeforeParse(rawInput) {
    try {
      const findings = detectSensitiveFieldsInSandboxResponse(rawInput);
      if (findings.sensitiveDetected) return blockedStatus("sensitive credential-like field detected", { detection:findings });
      if (findings.transactionDetected) return blockedStatus("transaction URL field detected", { detection:findings });
      if (typeof rawInput === "string") JSON.parse(rawInput);
      return clone({ status:"accepted", importStatus:"accepted", reason:"raw sandbox response passed pre-parse scan", rawInputStored:false, rawResponseStored:false, redacted:true });
    } catch (error) {
      return blockedStatus("malformed JSON safe downgrade", { status:"failed_safe", importStatus:"failed_safe", lastImportStatus:"failed_safe", errorCode:"SANDBOX_IMPORT_PARSE_FAILED_SAFE" });
    }
  }

  function buildSandboxResponseBlockedPreview(reason, options) {
    const opts = options && typeof options === "object" ? options : {};
    return blockedStatus(reason || "sandbox response import blocked", {
      providerId:text(opts.providerId || ""),
      providerName:text(opts.providerName || ""),
      preview:{ available:true, validationStatus:"blocked", blockedReason:reason || "sandbox response import blocked", rawResponseStored:false, redacted:true }
    });
  }

  function getMultiProviderRegistryApi() {
    return window.WeishanMultiProviderSandboxAdapterRegistry || {};
  }

  function getTrustedSource(providerId) {
    const registryApi = getRegistryApi();
    const trusted = typeof registryApi.getTrustedFlightSourceById === "function" ? registryApi.getTrustedFlightSourceById(providerId) : null;
    if (trusted && trusted.sourceBlocked !== true && trusted.accessMode !== "blocked") return trusted;
    const multiRegistryApi = getMultiProviderRegistryApi();
    if (typeof multiRegistryApi.getSandboxAdapterProfile === "function") {
      const profile = multiRegistryApi.getSandboxAdapterProfile(providerId);
      if (profile && profile.status !== "blocked") {
        return {
          providerId: text(profile.providerId || providerId),
          providerName: text(profile.providerName || providerId || "Unknown provider"),
          providerType: text(profile.adapterType === "search_handoff_only" ? "flight_search" : "flight_search"),
          accessMode: text(profile.providerMode || "sandbox_read_only"),
          safeProviderHandoffUrl: profile.safeProviderHandoffUrl || null,
          safeProviderHandoffHost: profile.safeProviderHandoffUrl ? text(new URL(profile.safeProviderHandoffUrl).hostname) : "",
          sourceBlocked: false,
          unknownProviderBlocked: false,
          redacted: true
        };
      }
    }
    return trusted || { providerId:text(providerId), providerName:text(providerId || "Unknown provider"), accessMode:"blocked", sourceBlocked:true, safeProviderHandoffUrl:null, safeProviderHandoffHost:"", redacted:true };
  }

  function buildSafeHandoff(raw, trusted) {
    const candidate = raw && typeof raw.handoffCandidate === "object" ? raw.handoffCandidate : {};
    const sourceUrl = text(candidate.safeProviderHandoffUrl || trusted.safeProviderHandoffUrl || "");
    const gateApi = getGateApi();
    const gateInput = {
      providerId:text(trusted.providerId || candidate.providerId || raw.providerId),
      providerName:text(trusted.providerName || candidate.providerName || raw.providerName),
      providerType:text(trusted.providerType || candidate.providerType || "flight_search"),
      searchOnly:true,
      safeProviderHandoffUrl:sourceUrl || null,
      restrictedCategory:false,
      fareSource:text(raw.fareSource || "sandbox_read_only_import")
    };
    const gate = typeof gateApi.evaluateSafeProviderDeepLinkHandoff === "function"
      ? gateApi.evaluateSafeProviderDeepLinkHandoff(gateInput)
      : { providerConfirmationLink:sourceUrl ? "confirmation_required" : "disabled", safeProviderHandoffUrl:sourceUrl || null, safeProviderHandoffHost:"", autoOpen:false, bookingUrl:null, payment:"blocked", checkout:"blocked", order:"blocked", identityUpload:"blocked", redacted:true };
    const ready = gate && gate.providerConfirmationLink === "confirmation_required" && !!gate.safeProviderHandoffUrl;
    return clone({
      gate:gate,
      safeProviderHandoffReady:ready,
      safeProviderHandoffUrl:ready ? gate.safeProviderHandoffUrl : null,
      safeProviderHandoffHost:ready ? text(gate.safeProviderHandoffHost || trusted.safeProviderHandoffHost || "") : "",
      reason:ready ? "安全平台确认链接已通过检查" : "当前平台确认链接未通过安全检查"
    });
  }

  function normalizeSandboxProviderDryRunQuote(rawResponse, options) {
    const raw = rawResponse && typeof rawResponse === "object" ? rawResponse : {};
    const opts = options && typeof options === "object" ? options : {};
    const providerId = text(raw.providerId || opts.providerId || "google_flights_search");
    const trusted = getTrustedSource(providerId);
    const handoff = buildSafeHandoff(raw, trusted);
    const origin = text(raw.origin || raw.route && raw.route.origin || opts.origin || "上海");
    const destination = text(raw.destination || raw.route && raw.route.destination || opts.destination || "成都");
    const baseFare = number(raw.baseFare);
    const taxesAndFees = number(raw.taxesAndFees);
    const providerFees = hasOwn(raw, "providerFees") ? number(raw.providerFees) : 0;
    const totalPrice = number(raw.totalPrice);
    const quote = {
      providerId:text(trusted.providerId || providerId),
      providerName:text(raw.providerName || trusted.providerName || "Google Flights"),
      providerMode:"sandbox_read_only",
      fareSource:text(raw.fareSource || "sandbox_read_only_import"),
      route:{ origin:origin, destination:destination, display:origin + " → " + destination },
      departureDate:text(raw.departureDate || raw.date || opts.departureDate || ""),
      currency:text(raw.currency || opts.currency || "").toUpperCase(),
      baseFare:baseFare,
      taxesAndFees:taxesAndFees,
      providerFees:providerFees == null ? 0 : providerFees,
      totalPrice:totalPrice,
      priceUpdatedAt:text(raw.priceUpdatedAt || raw.updatedAt || ""),
      freshnessMinutes:raw.freshnessMinutes == null ? 0 : number(raw.freshnessMinutes),
      freshnessStatus:"fresh",
      taxFeeIntegrityStatus:"complete",
      handoffType:"registry_gate_required",
      safeProviderHandoffReady:handoff.safeProviderHandoffReady,
      safeProviderHandoffUrl:handoff.safeProviderHandoffUrl,
      safeProviderHandoffHost:handoff.safeProviderHandoffHost,
      handoffCandidate:{ providerId:text(trusted.providerId || providerId), providerName:text(trusted.providerName || raw.providerName), providerType:text(trusted.providerType || "flight_search"), searchOnly:true, safeProviderHandoffUrl:handoff.safeProviderHandoffUrl, redacted:true },
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      booking:false,
      payment:false,
      order:false,
      identityUpload:false,
      rawResponseStored:false,
      sanitized:true,
      redacted:true
    };
    return clone(quote);
  }

  function validateSandboxProviderDryRunQuote(quoteInput, options) {
    const quote = quoteInput && typeof quoteInput === "object" ? quoteInput : {};
    const opts = options && typeof options === "object" ? options : {};
    const reasons = [];
    if (opts.productionProviderEnabled === true || quote.providerMode === "production" || quote.providerMode === "production_enabled") reasons.push("production provider disabled");
    const source = getTrustedSource(quote.providerId);
    if (source.sourceBlocked === true || source.accessMode === "blocked") reasons.push("unknown provider blocked");
    if (!SAFE_FARE_SOURCES.includes(text(quote.fareSource))) reasons.push("unsupported read-only fare source");
    if (!text(quote.currency)) reasons.push("currency required");
    if (!text(quote.priceUpdatedAt) && text(quote.fareSource) !== "fixture_read_only") reasons.push("priceUpdatedAt required");
    const baseFare = number(quote.baseFare);
    const taxesAndFees = number(quote.taxesAndFees);
    const providerFees = quote.providerFees == null ? 0 : number(quote.providerFees);
    const totalPrice = number(quote.totalPrice);
    if (baseFare == null || taxesAndFees == null || providerFees == null || totalPrice == null || Math.abs(totalPrice - baseFare - taxesAndFees - providerFees) > 0.0001) reasons.push("totalPrice must equal baseFare + taxesAndFees + providerFees");
    const contractApi = getContractApi();
    const contractInput = { providerId:quote.providerId, providerName:quote.providerName, route:text(quote.route && quote.route.display || quote.route || ""), departureDate:quote.departureDate, currency:quote.currency, baseFare:quote.baseFare, taxesAndFees:quote.taxesAndFees, providerFees:quote.providerFees, totalPrice:quote.totalPrice, priceUpdatedAt:quote.priceUpdatedAt, fareSource:quote.fareSource, handoffCandidate:Object.assign({}, quote.handoffCandidate || {}, { redacted:true }) };
    const contract = typeof contractApi.validateRealFlightPriceProviderResponse === "function" ? contractApi.validateRealFlightPriceProviderResponse(contractInput) : { validationDecision:reasons.length ? "blocked" : "pass", forbiddenFieldViolations:[], missingFields:[], totalMatchesBreakdown:reasons.length === 0, redacted:true };
    if (contract.validationDecision !== "pass") reasons.push("read-only provider contract rejected response");
    const integrityApi = getIntegrityApi();
    const integrity = typeof integrityApi.evaluateRealFlightPriceIntegrity === "function" ? integrityApi.evaluateRealFlightPriceIntegrity(quote) : { totalMatchesBreakdown:reasons.length === 0, showableAsCandidateEvidence:reasons.length === 0, showableAsRealPrice:false, redacted:true };
    if (integrity.totalMatchesBreakdown !== true) reasons.push("price integrity guard rejected response");
    return clone({
      harnessName:HARNESS_NAME,
      appVersion:SANDBOX_PROVIDER_DRY_RUN_HARNESS_VERSION,
      validationDecision:reasons.length ? "rejected" : "pass",
      status:reasons.length ? "rejected" : "accepted",
      reasons:reasons,
      providerTrusted:!(source.sourceBlocked === true || source.accessMode === "blocked"),
      safeProviderHandoffReady:quote.safeProviderHandoffReady === true,
      safeProviderHandoffUrl:quote.safeProviderHandoffReady === true ? quote.safeProviderHandoffUrl || null : null,
      contract:contract,
      integrity:integrity,
      showableAsRealPrice:false,
      showableAsCandidateEvidence:reasons.length === 0 && integrity.showableAsCandidateEvidence === true,
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
    });
  }

  function importSandboxProviderReadOnlyResponse(rawResponse, options) {
    try {
      if (typeof rawResponse === "string") {
        const rawValidation = validateRawSandboxResponseBeforeParse(rawResponse, options);
        if (rawValidation.status === "blocked" || rawValidation.status === "failed_safe") return rawValidation;
      }
      const raw = typeof rawResponse === "string" ? JSON.parse(rawResponse) : (rawResponse && typeof rawResponse === "object" ? rawResponse : {});
      const findings = detectUnsafe(raw);
      if (findings.unsafeNames.length) return blockedStatus("provider response contains unsafe credential-shaped fields", { unsafeFieldCount:findings.unsafeNames.length });
      if (findings.transactionNames.length || findings.transactionValues.length) return blockedStatus("provider response contains transaction URL fields", { transactionFieldCount:findings.transactionNames.length + findings.transactionValues.length });
      const quote = normalizeSandboxProviderDryRunQuote(raw, options);
      const validation = validateSandboxProviderDryRunQuote(quote, options);
      if (validation.status !== "accepted") {
        return clone(Object.assign({}, validation, { importStatus:"rejected", normalizedQuote:null, sanitizedQuote:null, reason:validation.reasons.join("; ") || "sandbox import rejected", blockedReasons:validation.reasons, safeProviderHandoffUrl:null, safeProviderHandoffReady:false }));
      }
      return clone({
        harnessName:HARNESS_NAME,
        appVersion:SANDBOX_PROVIDER_DRY_RUN_HARNESS_VERSION,
        status:"accepted",
        importStatus:"accepted",
        lastImportStatus:"accepted",
        reason:quote.safeProviderHandoffReady ? "sandbox response imported as read-only candidate evidence" : "sandbox response imported; provider handoff disabled by safety gate",
        normalizedQuote:quote,
        sanitizedQuote:quote,
        validation:validation,
        safeProviderHandoffReady:quote.safeProviderHandoffReady === true,
        safeProviderHandoffUrl:quote.safeProviderHandoffReady === true ? quote.safeProviderHandoffUrl || null : null,
        rawResponseStored:false,
        sanitized:true,
        redacted:true,
        bookingUrl:null,
        checkoutUrl:null,
        paymentUrl:null,
        orderUrl:null,
        booking:false,
        autoOpen:false,
        payment:false,
        order:false,
        identityUpload:false
      });
    } catch (error) {
      return blockedStatus("sandbox import failed safe", { status:"failed_safe", importStatus:"failed_safe", lastImportStatus:"failed_safe", errorCode:"SANDBOX_IMPORT_FAILED_SAFE" });
    }
  }

  function buildSandboxProviderDryRunHarnessStatus(options) {
    const opts = options && typeof options === "object" ? options : {};
    return clone({
      harnessName:HARNESS_NAME,
      appVersion:SANDBOX_PROVIDER_DRY_RUN_HARNESS_VERSION,
      title:"Sandbox Provider Dry-Run Harness",
      status:"ready",
      providerId:text(opts.providerId || "google_flights_search"),
      providerMode:"sandbox_read_only",
      readOnly:true,
      canImportSanitizedResponse:true,
      canStoreRawResponse:false,
      rawResponseStored:false,
      productionProviderEnabled:false,
      networkAttemptCount:0,
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

  function buildSandboxProviderDryRunAuditDraft(input) {
    const result = input && input.harnessName === HARNESS_NAME ? input : importSandboxProviderReadOnlyResponse(input || {});
    return clone({
      eventType:"SANDBOX_PROVIDER_DRY_RUN_IMPORT_AUDIT_DRAFT",
      harnessName:HARNESS_NAME,
      appVersion:SANDBOX_PROVIDER_DRY_RUN_HARNESS_VERSION,
      status:result.status || "failed_safe",
      importStatus:result.importStatus || result.status || "failed_safe",
      sanitized:result.sanitized === true,
      rawResponseStored:false,
      safeProviderHandoffReady:result.safeProviderHandoffReady === true,
      showableAsRealPrice:false,
      showableAsCandidateEvidence:!!(result.normalizedQuote && result.status === "accepted"),
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

  window.WeishanSandboxProviderDryRunHarness = {
    SANDBOX_PROVIDER_DRY_RUN_HARNESS_VERSION,
    HARNESS_NAME,
    buildSandboxProviderDryRunHarnessStatus,
    validateRawSandboxResponseBeforeParse,
    detectSensitiveFieldsInSandboxResponse,
    buildSandboxResponseBlockedPreview,
    importSandboxProviderReadOnlyResponse,
    normalizeSandboxProviderDryRunQuote,
    validateSandboxProviderDryRunQuote,
    buildSandboxProviderDryRunAuditDraft
  };
})();
