;(function () {
  "use strict";

  const SAFE_PROVIDER_DEEP_LINK_HANDOFF_GATE_VERSION = "4.2.8";
  const PHASE = "safe_provider_handoff_url_gate_v1";
  const TRUSTED_HOSTS = ["google.com", "trip.com", "ctrip.com", "skyscanner.com", "kayak.com", "expedia.com", "booking.com"];
  const SOURCE_TRUSTED_HOSTS = Object.freeze({
    prijsprofeet_public_api:["ah.nl", "aldi.nl", "dekamarkt.nl", "dirk.nl", "ekoplaza.nl", "hoogvliet.com", "hoogvliet.nl", "jumbo.com", "lidl.nl", "plus.nl", "vomar.nl"],
    prijsprofeet_attribution:["prijsprofeet.nl"],
    tienda_centro_public_api:["tiendacentro.com"],
    meblostan_public_api:["meblostan.pl"]
  });
  const SOURCE_EXACT_HOSTS = Object.freeze({ tienda_centro_public_api:true, meblostan_public_api:true });
  const SHORT_URL_HOSTS = ["bit.ly", "t.co", "tinyurl.com", "goo.gl", "ow.ly", "is.gd", "buff.ly", "cutt.ly", "short.link"];
  const CREDENTIAL_PARAMS = /(api[_-]?key|apikey|token|access[_-]?token|refresh[_-]?token|secret|client[_-]?secret|authorization|password)=/i;
  const BLOCKED_PATH_PATTERN = /(checkout|payment|order|identity|book)/i;
  const BLOCKED_QUERY_PATTERN = /(?:^|[?&#])(redirect|return|returnUrl|next|target|url|continue|checkout|payment|order|booking)=/i;

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function hostFromUrl(url) {
    try {
      return new URL(text(url)).hostname.toLowerCase();
    } catch (_) {
      return "";
    }
  }

  function pathFromUrl(url) {
    try {
      return new URL(text(url)).pathname.toLowerCase();
    } catch (_) {
      return "";
    }
  }

  function queryFromUrl(url) {
    try {
      return new URL(text(url)).search.toLowerCase();
    } catch (_) {
      return "";
    }
  }

  function hasCredentialParams(value) {
    return CREDENTIAL_PARAMS.test(text(value));
  }

  function isTrustedHost(host, trustedHosts, exactOnly) {
    return (Array.isArray(trustedHosts) ? trustedHosts : TRUSTED_HOSTS).some((trusted) => host === trusted || (!exactOnly && host.endsWith(`.${trusted}`)));
  }

  function buildDefaultSafeProviderHandoffUrl(candidate) {
    const safe = candidate && typeof candidate === "object" ? candidate : {};
    if (text(safe.safeProviderHandoffUrl || safe.confirmationUrl || safe.url || "")) {
      return text(safe.safeProviderHandoffUrl || safe.confirmationUrl || safe.url || "");
    }
    return "";
  }

  function sanitizeSafeProviderHandoffUrl(url, options) {
    const value = text(url);
    const sourceType = text(options && options.sourceType);
    const trustedHosts = SOURCE_TRUSTED_HOSTS[sourceType] || TRUSTED_HOSTS;
    const exactOnly = SOURCE_EXACT_HOSTS[sourceType] === true;
    const truthEngine = window.WeishanGlobalHandoffTruthEngine;
    if (truthEngine && typeof truthEngine.validateDestinationUrl === "function") {
      const checked = truthEngine.validateDestinationUrl(value, { expectedHosts: trustedHosts });
      if (!checked.allowed) return "";
    }
    if (!value) return "";
    if (!/^https:\/\//i.test(value)) return "";
    const host = hostFromUrl(value);
    if (!host || !isTrustedHost(host, trustedHosts, exactOnly)) return "";
    if (SHORT_URL_HOSTS.includes(host)) return "";
    if (hasCredentialParams(value)) return "";
    if (BLOCKED_PATH_PATTERN.test(pathFromUrl(value))) return "";
    if (BLOCKED_QUERY_PATTERN.test(queryFromUrl(value))) return "";
    try {
      const decoded = decodeURIComponent(value);
      if (BLOCKED_PATH_PATTERN.test(decoded) || BLOCKED_QUERY_PATTERN.test(decoded)) return "";
    } catch (_) {
      return "";
    }
    return value;
  }

  function evaluateSafeProviderHandoffUrl(candidateInput) {
    const candidate = candidateInput && typeof candidateInput === "object" ? candidateInput : {};
    const safeUrl = buildDefaultSafeProviderHandoffUrl(candidate);
    const truthEngine = window.WeishanGlobalHandoffTruthEngine;
    const truth = truthEngine && typeof truthEngine.buildHandoff === "function"
      ? truthEngine.buildHandoff({
        domain: candidate.providerType === "flight_search" ? "flight" : (candidate.domain || "generic"),
        destinationUrl: safeUrl,
        expectedHosts: TRUSTED_HOSTS,
        result: candidate,
        destinationContext: candidate.destinationContext || {
          origin: candidate.origin,
          destination: candidate.destination,
          departureDate: candidate.departureDate,
          searchReconstruction: candidate.searchOnly === true
        },
        resultSetId: candidate.resultSetId,
        activeResultSetId: candidate.activeResultSetId,
        selectedResultId: candidate.selectedResultId,
        currentResultId: candidate.currentResultId
      })
      : null;
    const normalizedUrl = truth ? truth.destinationUrl || "" : sanitizeSafeProviderHandoffUrl(safeUrl);
    const host = hostFromUrl(normalizedUrl || safeUrl);
    const blockedReasons = [];
    const restrictedCategory = candidate.restrictedCategory === true || candidate.category === "restricted_provider" || candidate.category === "restricted_or_blocked";
    const safeSearchOnly = candidate.searchOnly === true || candidate.kind === "search_only" || candidate.providerKind === "search_only" || candidate.confirmationRequired !== false;

    if (!safeUrl) blockedReasons.push("missing safe provider handoff url");
    if (safeUrl && !/^https:\/\//i.test(safeUrl)) blockedReasons.push("non-https blocked");
    if (host && SHORT_URL_HOSTS.includes(host)) blockedReasons.push("short URL blocked");
    if (host && !isTrustedHost(host)) blockedReasons.push("unknown host blocked");
    if (hasCredentialParams(safeUrl) || hasCredentialParams(JSON.stringify(candidate))) blockedReasons.push("credential params blocked");
    if (BLOCKED_PATH_PATTERN.test(pathFromUrl(safeUrl))) blockedReasons.push("transaction path blocked");
    if (BLOCKED_QUERY_PATTERN.test(queryFromUrl(safeUrl))) blockedReasons.push("redirect or transaction query blocked");
    try {
      const decodedSafeUrl = decodeURIComponent(safeUrl);
      if (safeUrl && (BLOCKED_PATH_PATTERN.test(decodedSafeUrl) || BLOCKED_QUERY_PATTERN.test(decodedSafeUrl))) blockedReasons.push("encoded transaction redirect blocked");
    } catch (_) {
      if (safeUrl) blockedReasons.push("malformed encoded url blocked");
    }
    if (restrictedCategory) blockedReasons.push("restricted category blocked");
    if (truth && Array.isArray(truth.blockedReasons)) {
      truth.blockedReasons.forEach((reason) => {
        if (blockedReasons.indexOf(reason) < 0) blockedReasons.push(reason);
      });
    }

    const allowed = blockedReasons.length === 0 && safeSearchOnly && !!normalizedUrl && (!truth || truth.safe === true);
    const decision = allowed ? "safe_provider_handoff_ready" : "blocked";

    return clone({
      version: SAFE_PROVIDER_DEEP_LINK_HANDOFF_GATE_VERSION,
      gateName: PHASE,
      status: allowed ? "confirmation_required" : "blocked",
      candidateDecision: decision,
      providerConfirmationLink: allowed ? "confirmation_required" : "disabled",
      safeProviderHandoffUrl: allowed ? normalizedUrl : null,
      safeProviderHandoffHost: allowed ? host : "",
      userConfirmationRequired: true,
      autoOpen: false,
      bookingUrl: null,
      payment: "blocked",
      checkout: "blocked",
      order: "blocked",
      identityUpload: "blocked",
      credentialParams: "blocked",
      shortUrl: "blocked",
      unknownHost: "blocked",
      restrictedCategory: "blocked",
      realProvider: "disabled",
      realNetwork: "disabled",
      trustedHosts: TRUSTED_HOSTS.slice(),
      blockedReasons: blockedReasons,
      openExternalRequested: false,
      exactness: truth && truth.exactness || (allowed ? "SEARCH_RECONSTRUCTION" : "NONE"),
      userVisibleExactness: truth && truth.userVisibleExactness || (allowed ? "Confirm on provider" : "Blocked"),
      requiresExplicitUserAction: true,
      highRiskMetrics: truth && truth.highRiskMetrics || { autoOpenCount:0, bookingActionCount:0, paymentActionCount:0, orderActionCount:0, ticketingActionCount:0 },
      redacted: true,
      audit: {
        eventType: "SAFE_PROVIDER_HANDOFF_URL_GATE_DRAFT",
        version: SAFE_PROVIDER_DEEP_LINK_HANDOFF_GATE_VERSION,
        gateName: PHASE,
        candidateDecision: decision,
        userConfirmationRequired: true,
        autoOpen: false,
        safeProviderHandoffUrlDisplayedCount: 0,
        bookingUrlDisplayedCount: 0,
        paymentActionDisplayedCount: 0,
        orderActionDisplayedCount: 0,
        identityUploadAttemptCount: 0,
        blockedReasonCount: blockedReasons.length,
        redacted: true
      }
    });
  }

  function evaluateSafeProviderDeepLinkHandoff(candidateInput) {
    return evaluateSafeProviderHandoffUrl(candidateInput);
  }

  function buildSafeProviderHandoffUrlGate(candidateInput) {
    const gate = evaluateSafeProviderHandoffUrl(candidateInput);
    return clone(Object.assign({}, gate, {
      summaryLine: gate.candidateDecision === "safe_provider_handoff_ready"
        ? "只读安全候选：先确认，再打开可信平台确认页。"
        : "当前链接被阻断，不允许自动打开平台确认页。",
      confirmationButtonLabel: "确认打开可信平台确认页",
      cancelButtonLabel: "取消"
    }));
  }

  function buildProviderDeepLinkHandoffDraft(candidateInput) {
    return buildSafeProviderHandoffUrlGate(candidateInput);
  }

  function getSafeProviderDeepLinkHandoffGateAuditDraft(candidateInput) {
    const gate = evaluateSafeProviderHandoffUrl(candidateInput || {});
    return clone(gate.audit || {
      eventType: "SAFE_PROVIDER_HANDOFF_URL_GATE_DRAFT",
      version: SAFE_PROVIDER_DEEP_LINK_HANDOFF_GATE_VERSION,
      gateName: PHASE,
      candidateDecision: gate.candidateDecision || "blocked",
      userConfirmationRequired: true,
      autoOpen: false,
      safeProviderHandoffUrlDisplayedCount: 0,
      bookingUrlDisplayedCount: 0,
      paymentActionDisplayedCount: 0,
      orderActionDisplayedCount: 0,
      identityUploadAttemptCount: 0,
      blockedReasonCount: Array.isArray(gate.blockedReasons) ? gate.blockedReasons.length : 0,
      redacted: true
    });
  }

  function openTrustedProviderHandoffUrl(url, options) {
    const sourceType = text(options && options.sourceType);
    const safeUrl = sanitizeSafeProviderHandoffUrl(url, { sourceType });
    const userConfirmed = options && typeof options === "object" && options.userConfirmed === true;
    if (!userConfirmed) {
      return Promise.resolve({
        ok: false,
        confirmed: false,
        reason: "user_confirmation_required",
        gate: evaluateSafeProviderHandoffUrl({ safeProviderHandoffUrl: url })
      });
    }
    if (!safeUrl) {
      return Promise.resolve({ ok: false, confirmed: true, gate: evaluateSafeProviderHandoffUrl({ safeProviderHandoffUrl: url }) });
    }
    if (typeof window.__WEISHAN_TEST_OPEN_EXTERNAL__ === "function") {
      return Promise.resolve(window.__WEISHAN_TEST_OPEN_EXTERNAL__(safeUrl)).then(() => ({ ok: true, confirmed: true, url: safeUrl })).catch(() => ({ ok: false, confirmed: true, url: safeUrl }));
    }
    if (window.WeishanAPI && typeof window.WeishanAPI.openExternal === "function") {
      return Promise.resolve(window.WeishanAPI.openExternal(safeUrl)).then(() => ({ ok: true, confirmed: true, url: safeUrl })).catch(() => ({ ok: false, confirmed: true, url: safeUrl }));
    }
    if (window.weishan && typeof window.weishan.openExternal === "function") {
      return Promise.resolve(window.weishan.openExternal(safeUrl)).then(() => ({ ok: true, confirmed: true, url: safeUrl })).catch(() => ({ ok: false, confirmed: true, url: safeUrl }));
    }
    return Promise.resolve({ ok: false, confirmed: true, url: safeUrl });
  }

  function assertSafeProviderDeepLinkHandoffGateSafe(value) {
    const gate = value && typeof value === "object" ? value : evaluateSafeProviderHandoffUrl({});
    if (gate.redacted !== true) throw new Error("safe provider handoff gate must stay redacted");
    if (gate.autoOpen !== false) throw new Error("safe provider handoff gate must not auto open");
    if (gate.bookingUrl !== null) throw new Error("safe provider handoff gate must not expose bookingUrl");
    if (gate.payment !== "blocked" || gate.checkout !== "blocked" || gate.order !== "blocked" || gate.identityUpload !== "blocked") throw new Error("safe provider handoff gate must block payment/order/identity");
    if (gate.providerConfirmationLink !== "confirmation_required" && gate.providerConfirmationLink !== "disabled") throw new Error("provider confirmation link must stay confirmation required or disabled");
    const audit = gate.audit || {};
    if (audit.redacted !== true || audit.autoOpen !== false || audit.bookingUrlDisplayedCount !== 0 || audit.paymentActionDisplayedCount !== 0 || audit.orderActionDisplayedCount !== 0) throw new Error("safe provider handoff gate audit must stay redacted and zeroed");
    if (gate.safeProviderHandoffUrl && !sanitizeSafeProviderHandoffUrl(gate.safeProviderHandoffUrl)) throw new Error("safe provider handoff gate must only allow trusted safe urls");
    return true;
  }

  window.WeishanSafeProviderDeepLinkHandoffGate = {
    SAFE_PROVIDER_DEEP_LINK_HANDOFF_GATE_VERSION,
    PHASE,
    TRUSTED_HOSTS,
    SOURCE_TRUSTED_HOSTS,
    SOURCE_EXACT_HOSTS,
    buildSafeProviderHandoffUrlGate,
    sanitizeSafeProviderHandoffUrl,
    evaluateSafeProviderHandoffUrl,
    evaluateSafeProviderDeepLinkHandoff,
    buildProviderDeepLinkHandoffDraft,
    getSafeProviderDeepLinkHandoffGateAuditDraft,
    openTrustedProviderHandoffUrl,
    assertSafeProviderDeepLinkHandoffGateSafe
  };
  window.WeishanSafeProviderHandoffUrlGate = window.WeishanSafeProviderDeepLinkHandoffGate;
})();
