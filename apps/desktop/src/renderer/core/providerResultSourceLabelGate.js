;(function () {
  "use strict";

  const PROVIDER_RESULT_SOURCE_LABEL_GATE_VERSION = "4.1.6";
  const REQUIRED_FIELDS = ["providerId", "providerName", "providerCategory", "sourceType", "sourceUrlHost", "sourceHostDisplayName", "providerRegion", "updatedAt", "resultObservedAt", "readonlyEvidence", "evidenceType", "sourceTrustState", "redacted"];
  const ALLOWED_SOURCE_TYPES = ["sandbox_provider", "user_bound_api", "weishan_readonly_provider", "manual_reviewed_source", "no_provider", "blocked_unknown_source"];
  const PASSABLE_SOURCE_TYPES = ["sandbox_provider", "no_provider"];
  const BLOCKED_SOURCE_TYPES = ["blocked_unknown_source", "raw_ai_estimate", "unknown_site", "short_url", "public_search_result_as_provider", "unreviewed_provider"];
  const ALLOWED_SOURCE_TRUST_STATES = ["sandbox_verified", "draft_only"];
  const BLOCKED_SOURCE_TRUST_STATES = ["blocked"];
  const SANDBOX_HOSTS = ["provider-sandbox.invalid", "flight-provider-sandbox.invalid", "sandbox.invalid", "no-provider.invalid"];
  const SHORT_URL_HOSTS = ["bit.ly", "t.co", "tinyurl.com", "goo.gl", "ow.ly", "is.gd", "buff.ly", "cutt.ly", "short.link"];
  const CREDENTIAL_PARAM_RE = /(^|[?&])(api[_-]?key|apikey|token|access[_-]?token|refresh[_-]?token|secret|client[_-]?secret|authorization|password)=/i;

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function text(value) { return String(value === undefined || value === null ? "" : value).trim(); }
  function isShortUrlHost(host) { return SHORT_URL_HOSTS.includes(text(host).toLowerCase()); }
  function hasCredentialParams(value) { return CREDENTIAL_PARAM_RE.test(text(value)); }
  function sourceHostAllowed(label) {
    const host = text(label && label.sourceUrlHost).toLowerCase();
    if (!host) return false;
    if (SANDBOX_HOSTS.includes(host)) return true;
    return false;
  }
  function missingRequiredFields(label) {
    return REQUIRED_FIELDS.filter(function (field) {
      if (field === "redacted") return !label || label.redacted !== true;
      return !text(label && label[field]);
    });
  }
  function buildAuditDraft(label, decision) {
    const safe = decision || {};
    return clone({
      eventType: "PROVIDER_RESULT_SOURCE_LABEL_GATE_DRAFT",
      providerCategory: text(label && label.providerCategory) || "flight",
      providerId: text(label && label.providerId) || "flight_provider",
      validationDecision: safe.validationDecision || "blocked",
      sourceType: text(label && label.sourceType) || "missing",
      sourceTrustState: text(label && label.sourceTrustState) || "missing",
      sourceUrlHost: text(label && label.sourceUrlHost) || "missing",
      sourceHostDisplayName: text(label && label.sourceHostDisplayName) || "missing",
      resultObservedAt: text(label && label.resultObservedAt) || "missing",
      blockedReasons: safe.blockedReasons || [],
      unknownSourceBlockedCount: (safe.blockedReasons || []).includes("unknown source blocked") ? 1 : 0,
      shortUrlBlockedCount: (safe.blockedReasons || []).includes("short URL blocked") ? 1 : 0,
      credentialParamBlockedCount: (safe.blockedReasons || []).includes("credential params blocked") ? 1 : 0,
      rawAiEstimateBlockedCount: (safe.blockedReasons || []).includes("raw AI estimate blocked") ? 1 : 0,
      publicSearchMasqueradeBlockedCount: (safe.blockedReasons || []).includes("public search result cannot masquerade as provider result") ? 1 : 0,
      redacted: true
    });
  }
  function validateProviderResultSourceLabel(labelInput) {
    const label = labelInput && typeof labelInput === "object" ? labelInput : {};
    const blockedReasons = [];
    const missing = missingRequiredFields(label);
    missing.forEach(function (field) { blockedReasons.push("missing " + field); });
    const sourceType = text(label.sourceType);
    const trustState = text(label.sourceTrustState);
    const host = text(label.sourceUrlHost).toLowerCase();
    const rawUrl = text(label.sourceUrl || label.rawProviderUrl || label.sourceUrlHost);

    if (!ALLOWED_SOURCE_TYPES.includes(sourceType)) blockedReasons.push("unknown source blocked");
    if (BLOCKED_SOURCE_TYPES.includes(sourceType)) {
      if (sourceType === "raw_ai_estimate") blockedReasons.push("raw AI estimate blocked");
      else if (sourceType === "public_search_result_as_provider") blockedReasons.push("public search result cannot masquerade as provider result");
      else if (sourceType === "short_url") blockedReasons.push("short URL blocked");
      else blockedReasons.push("unknown source blocked");
    }
    if (PASSABLE_SOURCE_TYPES.indexOf(sourceType) === -1) blockedReasons.push("sourceType not currently passable");
    if (BLOCKED_SOURCE_TRUST_STATES.includes(trustState)) blockedReasons.push("sourceTrustState blocked");
    if (ALLOWED_SOURCE_TRUST_STATES.indexOf(trustState) === -1) blockedReasons.push("sourceTrustState not allowed");
    if (host && !sourceHostAllowed(label)) blockedReasons.push("unknown host");
    if (isShortUrlHost(host)) blockedReasons.push("short URL blocked");
    if (hasCredentialParams(rawUrl)) blockedReasons.push("credential params blocked");
    if (label.rawProviderPayload || label.rawResponse || label.rawHeaders) blockedReasons.push("raw provider payload blocked");
    if (label.credentialQueryParams || hasCredentialParams(JSON.stringify(label))) blockedReasons.push("credential params blocked");

    const decision = blockedReasons.length ? "blocked" : "pass";
    const result = {
      version: PROVIDER_RESULT_SOURCE_LABEL_GATE_VERSION,
      gateName: "provider_result_source_label_gate",
      status: "source label validation only",
      validationDecision: decision,
      blockedReasons: Array.from(new Set(blockedReasons)),
      sourceTrustState: trustState || "missing",
      sourceUrlHost: host || "missing",
      sourceHostDisplayName: text(label.sourceHostDisplayName) || "missing",
      resultObservedAt: text(label.resultObservedAt) || "missing",
      readonlyEvidence: text(label.readonlyEvidence) || "missing",
      redacted: true
    };
    result.auditDraft = buildAuditDraft(label, result);
    return clone(result);
  }
  function buildValidSandboxSourceLabel(overrides) {
    return clone(Object.assign({
      providerId: "flight_provider",
      providerName: "Flight Provider Sandbox",
      providerCategory: "flight",
      sourceType: "sandbox_provider",
      sourceUrlHost: "provider-sandbox.invalid",
      sourceHostDisplayName: "Provider Sandbox",
      providerRegion: "sandbox",
      updatedAt: "2026-06-20T00:00:00.000Z",
      resultObservedAt: "2026-06-20T00:00:00.000Z",
      readonlyEvidence: "simulated sandbox response schema validation only",
      evidenceType: "sandbox_fixture",
      sourceTrustState: "sandbox_verified",
      redacted: true
    }, overrides || {}));
  }
  function buildProviderResultSourceLabelGateDraft() {
    const valid = buildValidSandboxSourceLabel();
    const validation = validateProviderResultSourceLabel(valid);
    return clone({
      version: PROVIDER_RESULT_SOURCE_LABEL_GATE_VERSION,
      gateName: "provider_result_source_label_gate",
      status: "source label validation only",
      mode: "required before display",
      sourceLabelRequired: true,
      unknownSource: "blocked",
      shortUrl: "blocked",
      credentialParams: "blocked",
      rawAiEstimate: "blocked",
      publicSearchMasquerade: "blocked",
      requiredFields: REQUIRED_FIELDS,
      allowedSourceType: ALLOWED_SOURCE_TYPES,
      currentlyPassableSourceType: PASSABLE_SOURCE_TYPES,
      blockedSourceType: BLOCKED_SOURCE_TYPES,
      sourceTrustState: ["sandbox_verified", "draft_only", "pending_manual_review", "blocked"],
      validSandboxSourceLabel: valid,
      validationExample: validation,
      auditDraft: validation.auditDraft,
      redacted: true
    });
  }
  function assertProviderResultSourceLabelGateSafe(value) {
    const decision = value && value.gateName ? value : validateProviderResultSourceLabel(value || buildValidSandboxSourceLabel());
    if (decision.redacted !== true) throw new Error("source label gate must stay redacted");
    const audit = decision.auditDraft || {};
    if (audit.redacted !== true) throw new Error("source label audit must stay redacted");
    return true;
  }

  window.WeishanProviderResultSourceLabelGate = {
    PROVIDER_RESULT_SOURCE_LABEL_GATE_VERSION,
    REQUIRED_FIELDS,
    ALLOWED_SOURCE_TYPES,
    BLOCKED_SOURCE_TYPES,
    buildValidSandboxSourceLabel,
    validateProviderResultSourceLabel,
    buildProviderResultSourceLabelGateDraft,
    buildAuditDraft,
    assertProviderResultSourceLabelGateSafe
  };
})();
