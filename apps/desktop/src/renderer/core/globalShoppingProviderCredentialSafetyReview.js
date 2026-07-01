;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_CREDENTIAL_SAFETY_REVIEW_VERSION = "3.4.0";
  const REVIEW_NAME = "global_shopping_provider_credential_safety_review_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId || "row"), label:text(label || ""), value:text(value || ""), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function safety() {
    return {
      fileWrite:false,
      download:false,
      realNameStored:false,
      phoneStored:false,
      emailStored:false,
      identityUpload:false,
      credentialInput:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    };
  }
  function evaluateGlobalShoppingProviderCredentialSafetyReview(input) {
    const safe = obj(input);
    const review = obj(safe.providerCredentialSafetyReview);
    const policy = {
      productionKeyReadDisabled: review.productionKeyReadDisabled !== false && safe.canReadProductionKey !== true,
      fixtureCredentialsOnly: review.fixtureCredentialsOnly !== false && safe.fixtureCredentialsOnly !== false,
      sandboxOnly: review.sandboxOnly !== false && safe.sandboxOnly !== false,
      noCredentialPrompt: review.noCredentialPrompt !== false && safe.credentialInput !== true,
      noPlaintextLogging: review.noPlaintextLogging !== false,
      noSecretPersistence: review.noSecretPersistence !== false && safe.secretStored !== true,
      noRawResponsePersistence: review.noRawResponsePersistence !== false && safe.rawResponseStored !== true,
      noExternalOpen: review.noExternalOpen !== false && safe.openExternal !== true && safe.windowOpen !== true,
      noCheckout: review.noCheckout !== false && safe.checkout !== true,
      noPayment: review.noPayment !== false && safe.payment !== true,
      noTicketing: review.noTicketing !== false && safe.ticketing !== true
    };
    const blockedReasons = [];
    Object.keys(policy).forEach(function (key) {
      if (policy[key] !== true) blockedReasons.push(key);
    });
    let status = "ready";
    if (blockedReasons.length) status = "blocked";
    else if (text(safe.providerStatus || review.providerStatus || "fixture") === "unknown") status = "needs_review";
    return clone({
      reviewName:REVIEW_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_CREDENTIAL_SAFETY_REVIEW_VERSION,
      status:status,
      credentialSafetyReview:{
        providerStatus:text(safe.providerStatus || review.providerStatus || "fixture"),
        fixtureCredentialsOnly:true,
        sandboxOnly:true,
        productionKeyReadDisabled:true,
        noCredentialPrompt:true,
        noPlaintextLogging:true,
        noSecretPersistence:true,
        noRawResponsePersistence:true,
        noExternalOpen:true,
        noCheckout:true,
        noPayment:true,
        noTicketing:true
      },
      credentialSafetyHealth:policy,
      blockedReasons:blockedReasons,
      redacted:true
    });
  }
  function buildGlobalShoppingProviderCredentialSafetyReviewRows(input) {
    const model = evaluateGlobalShoppingProviderCredentialSafetyReview(input || {});
    const health = model.credentialSafetyHealth;
    return clone([
      row("fixture_only", "凭据范围", health.fixtureCredentialsOnly ? "仅允许 fixture / sandbox 占位凭据" : "检测到非 fixture 凭据风险", health.fixtureCredentialsOnly ? "pass" : "blocked"),
      row("no_prod_key", "生产密钥读取", health.productionKeyReadDisabled ? "不读取生产密钥" : "检测到生产密钥读取风险", health.productionKeyReadDisabled ? "pass" : "blocked"),
      row("no_credential_prompt", "凭据输入", health.noCredentialPrompt ? "不要求输入真实 provider 凭据" : "检测到凭据输入风险", health.noCredentialPrompt ? "pass" : "blocked"),
      row("no_secret_persist", "secret 持久化", health.noSecretPersistence ? "不保存 token/key/secret" : "检测到 secret 持久化风险", health.noSecretPersistence ? "pass" : "blocked"),
      row("no_raw_response", "原始响应", health.noRawResponsePersistence ? "不保存 raw provider response" : "检测到原始响应持久化风险", health.noRawResponsePersistence ? "pass" : "blocked"),
      row("transaction_boundary", "交易边界", health.noExternalOpen && health.noCheckout && health.noPayment && health.noTicketing ? "不打开真实平台 / 不付款 / 不下单 / 不出票" : "检测到交易能力风险", health.noExternalOpen && health.noCheckout && health.noPayment && health.noTicketing ? "pass" : "blocked")
    ]);
  }
  function sanitizeGlobalShoppingProviderCredentialSafetyReview(review) {
    const safe = obj(review);
    const evaluation = evaluateGlobalShoppingProviderCredentialSafetyReview(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      reviewName:REVIEW_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_CREDENTIAL_SAFETY_REVIEW_VERSION,
      status:status,
      credentialSafetyReview:evaluation.credentialSafetyReview,
      credentialSafetyHealth:evaluation.credentialSafetyHealth,
      rows:toArray(safe.rows).length ? toArray(safe.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }) : buildGlobalShoppingProviderCredentialSafetyReviewRows(evaluation),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"Provider 凭据安全复核",
        resultLabel:status === "ready" ? "Provider 凭据边界安全" : (status === "needs_review" ? "Provider 凭据边界仍需复核" : "Provider 凭据边界已阻断"),
        caveat:"当前只允许 fixture / sandbox 占位凭据说明，不读取生产密钥，不记录 token/key/secret，不代表真实 provider 接入能力。",
        redacted:true
      },
      safety:safety(),
      redacted:true
    });
  }
  function buildGlobalShoppingProviderCredentialSafetyReview(input) {
    try {
      return sanitizeGlobalShoppingProviderCredentialSafetyReview(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingProviderCredentialSafetyReview({ status:"failed_safe", blockedReasons:["failed_safe"] });
    }
  }
  function buildGlobalShoppingProviderCredentialSafetyReviewAuditDraft(input) {
    const model = buildGlobalShoppingProviderCredentialSafetyReview(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_CREDENTIAL_SAFETY_REVIEW_AUDIT_DRAFT",
      reviewName:REVIEW_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_CREDENTIAL_SAFETY_REVIEW_VERSION,
      status:model.status,
      blockedReasonCount:model.blockedReasons.length,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      fileWrite:false,
      download:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderCredentialSafetyReview = {
    GLOBAL_SHOPPING_PROVIDER_CREDENTIAL_SAFETY_REVIEW_VERSION,
    REVIEW_NAME,
    buildGlobalShoppingProviderCredentialSafetyReview,
    evaluateGlobalShoppingProviderCredentialSafetyReview,
    buildGlobalShoppingProviderCredentialSafetyReviewRows,
    buildGlobalShoppingProviderCredentialSafetyReviewAuditDraft,
    sanitizeGlobalShoppingProviderCredentialSafetyReview
  };
})();
