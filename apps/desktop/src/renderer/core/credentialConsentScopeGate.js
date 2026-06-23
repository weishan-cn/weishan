;(function () {
  "use strict";

  const CREDENTIAL_CONSENT_SCOPE_GATE_VERSION = "2.1.57";
  const ALLOWED_SCOPES = ["readonly_search", "readonly_price", "readonly_availability_metadata", "readonly_inventory", "result_analysis", "source_label_display"];
  const FORBIDDEN_SCOPES = ["write_api", "create_order", "payment", "checkout", "booking", "identity_upload", "passport_upload", "bank_card_save", "background_silent_call", "plaintext_key_export", "provider_endpoint_test", "real_network_call"];
  const REQUIRED_CONFIRMATIONS = ["我确认该 API 仅用于只读搜索和价格读取", "我理解 weishan 不会替我付款", "我理解 weishan 不会替我下单", "我理解 weishan 不会上传身份证、护照或银行卡", "我理解最终价格以外部平台页面为准", "我理解当前版本不会连接真实 endpoint", "我理解当前版本不会返回真实价格", "我理解当前版本不会保存或使用真实 API key"];
  const BLOCKED_REASONS = ["real provider disabled", "real network disabled", "real endpoint disabled", "real price disabled", "bookingUrl disabled", "payment disabled", "order disabled", "identity upload disabled", "plaintext key export disabled", "consent submission blocked in this version"];

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function list(value) { return Array.isArray(value) ? value.filter(Boolean) : []; }

  function buildCredentialConsentScopeGate(state) {
    const checked = list(state && state.checkedConfirmations).filter((item) => REQUIRED_CONFIRMATIONS.includes(item));
    const restrictedCategory = state && state.providerCategory === "restricted_provider";
    return clone({
      version: CREDENTIAL_CONSENT_SCOPE_GATE_VERSION,
      gateVersion: CREDENTIAL_CONSENT_SCOPE_GATE_VERSION,
      status: "credential consent gate only",
      phase: "credential_consent_scope_gate",
      mode: "no provider connection",
      consentState: restrictedCategory ? "submitted_blocked" : "draft_ready",
      providerCategory: restrictedCategory ? "restricted_provider" : "flight_provider",
      allowedScopes: ALLOWED_SCOPES,
      forbiddenScopes: FORBIDDEN_SCOPES,
      requiredConfirmations: REQUIRED_CONFIRMATIONS,
      checkedConfirmations: checked,
      checkedConfirmationCount: checked.length,
      allTestConfirmationsChecked: checked.length === REQUIRED_CONFIRMATIONS.length,
      testDraftOnly: true,
      submitRealBindingAllowed: false,
      blockedReasons: restrictedCategory ? ["restricted category blocked"].concat(BLOCKED_REASONS) : BLOCKED_REASONS,
      finalDecision: "no-go",
      realCredentialInput: "disabled",
      realCredentialSave: "disabled",
      realCredentialRead: "disabled",
      realProvider: "disabled",
      realProviderConnection: "disabled",
      realNetwork: "disabled",
      realEndpoint: "disabled",
      realEndpointConnection: "disabled",
      realPrice: "disabled",
      availability: "disabled",
      bookingUrl: "disabled",
      payment: "disabled",
      order: "disabled",
      identityUpload: "disabled",
      plaintextKeyExport: "disabled",
      keychainMode: "disabled",
      safeStorageMode: "disabled",
      envMode: "disabled",
      browserStorageMode: "disabled",
      redacted: true
    });
  }

  function toggleAllTestConfirmations(gate) {
    const next = buildCredentialConsentScopeGate(gate);
    next.checkedConfirmations = REQUIRED_CONFIRMATIONS.slice();
    next.checkedConfirmationCount = next.checkedConfirmations.length;
    next.allTestConfirmationsChecked = true;
    next.consentState = "draft_ready";
    next.finalDecision = "no-go";
    return next;
  }
  function clearTestConfirmations(gate) {
    const next = buildCredentialConsentScopeGate(gate);
    next.checkedConfirmations = [];
    next.checkedConfirmationCount = 0;
    next.allTestConfirmationsChecked = false;
    next.consentState = "draft_ready";
    next.finalDecision = "no-go";
    return next;
  }
  function buildCredentialConsentScopeAuditDraft(gate) {
    const safe = buildCredentialConsentScopeGate(gate);
    return clone({ eventType: "CREDENTIAL_CONSENT_SCOPE_GATE_DRAFT", allowedScopes: safe.allowedScopes, forbiddenScopes: safe.forbiddenScopes, requiredConfirmations: safe.requiredConfirmations, consentState: safe.consentState, finalDecision: safe.finalDecision, consentSubmittedCount: 0, realCredentialUsedCount: 0, realApiKeyInputCount: 0, realApiKeySaveCount: 0, realApiKeyReadCount: 0, providerConnectionCount: 0, networkAttemptCount: 0, realEndpointConnectCount: 0, realPriceDisplayedCount: 0, realPriceReturnCount: 0, bookingUrlDisplayedCount: 0, bookingUrlReturnCount: 0, paymentAttemptCount: 0, orderAttemptCount: 0, identityUploadAttemptCount: 0, redacted: true });
  }
  function assertCredentialConsentScopeGateSafe(gate) {
    const safe = buildCredentialConsentScopeGate(gate);
    const audit = buildCredentialConsentScopeAuditDraft(safe);
    if (JSON.stringify(safe.allowedScopes) !== JSON.stringify(ALLOWED_SCOPES)) throw new Error("credential consent allowed scopes changed");
    for (const scope of FORBIDDEN_SCOPES) if (!safe.forbiddenScopes.includes(scope)) throw new Error("missing forbidden scope: " + scope);
    for (const confirmation of REQUIRED_CONFIRMATIONS) if (!safe.requiredConfirmations.includes(confirmation)) throw new Error("missing required confirmation");
    if (safe.finalDecision !== "no-go") throw new Error("credential consent final decision must stay no-go");
    if (safe.submitRealBindingAllowed !== false) throw new Error("real binding submission must stay blocked");
    ["realProvider", "realNetwork", "realEndpoint", "realPrice", "bookingUrl", "payment", "order", "identityUpload", "plaintextKeyExport"].forEach((key) => { if (safe[key] !== "disabled") throw new Error(key + " must stay disabled"); });
    ["consentSubmittedCount", "realCredentialUsedCount", "realApiKeyInputCount", "realApiKeySaveCount", "realApiKeyReadCount", "providerConnectionCount", "networkAttemptCount", "realEndpointConnectCount", "realPriceDisplayedCount", "realPriceReturnCount", "bookingUrlDisplayedCount", "bookingUrlReturnCount", "paymentAttemptCount", "orderAttemptCount", "identityUploadAttemptCount"].forEach((key) => { if (audit[key] !== 0) throw new Error(key + " must stay zero"); });
    if (safe.redacted !== true || audit.redacted !== true) throw new Error("credential consent audit must stay redacted");
    return true;
  }
  window.WeishanCredentialConsentScopeGate = { CREDENTIAL_CONSENT_SCOPE_GATE_VERSION, ALLOWED_SCOPES, FORBIDDEN_SCOPES, REQUIRED_CONFIRMATIONS, buildCredentialConsentScopeGate, toggleAllTestConfirmations, clearTestConfirmations, buildCredentialConsentScopeAuditDraft, assertCredentialConsentScopeGateSafe };
})();
