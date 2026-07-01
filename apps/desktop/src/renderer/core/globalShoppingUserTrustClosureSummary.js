;(function () {
  "use strict";

  const GLOBAL_SHOPPING_USER_TRUST_CLOSURE_SUMMARY_VERSION = "2.9.0";
  const SUMMARY_NAME = "global_shopping_user_trust_closure_summary_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawResponse|rawUserText|platformAccount|platformPassword|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function statement(statementId, label, status, message, caveat) {
    return { statementId:text(statementId), label:text(label), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", statement:text(message), caveat:text(caveat), redacted:true };
  }
  function safety(overrides) {
    return Object.assign({
      fileWrite:false,
      download:false,
      export:false,
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
    }, obj(overrides));
  }

  function evaluateGlobalShoppingUserTrustClosureSummary(input) {
    const safe = obj(input);
    const blocked =
      safe.persistSummary === true || safe.submitSummary === true || safe.export === true || safe.download === true ||
      safe.bindUser === true || safe.captureSignature === true || safe.paymentAuthorization === true || safe.createOrder === true ||
      safe.openExternal === true || safe.windowOpen === true || safe.autoOpen === true || safe.hasForbiddenClaim === true;
    const trustHealth = {
      statesReadOnlyCandidateEvidenceOnly:safe.statesReadOnlyCandidateEvidenceOnly !== false,
      statesNoRealProviderRequest:safe.statesNoRealProviderRequest !== false,
      statesNoExternalOpen:safe.statesNoExternalOpen !== false,
      statesNoIdentityPaymentStorage:safe.statesNoIdentityPaymentStorage !== false,
      statesNoBookingPaymentTicketing:safe.statesNoBookingPaymentTicketing !== false,
      statesUserMustVerifyOnPlatform:safe.statesUserMustVerifyOnPlatform !== false,
      statesPlatformFinalAuthority:safe.statesPlatformFinalAuthority !== false,
      noPersistence:safe.persistSummary !== true,
      noSubmission:safe.submitSummary !== true,
      noExportDownload:safe.export !== true && safe.download !== true,
      noUserBinding:safe.bindUser !== true,
      noSignature:safe.captureSignature !== true,
      noPaymentAuthorization:safe.paymentAuthorization !== true,
      noOrderCreation:safe.createOrder !== true,
      noForbiddenClaims:safe.hasForbiddenClaim !== true
    };
    const needsReview =
      !trustHealth.statesReadOnlyCandidateEvidenceOnly || !trustHealth.statesNoRealProviderRequest || !trustHealth.statesNoExternalOpen ||
      !trustHealth.statesNoIdentityPaymentStorage || !trustHealth.statesNoBookingPaymentTicketing || !trustHealth.statesUserMustVerifyOnPlatform ||
      !trustHealth.statesPlatformFinalAuthority;
    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      trustHealth:trustHealth,
      blockedReasons:blocked ? [
        safe.persistSummary === true ? "summary_persistence_detected" : "",
        safe.submitSummary === true ? "summary_submission_detected" : "",
        safe.export === true || safe.download === true ? "export_download_detected" : "",
        safe.bindUser === true ? "user_binding_detected" : "",
        safe.captureSignature === true ? "signature_detected" : "",
        safe.paymentAuthorization === true ? "payment_authorization_detected" : "",
        safe.createOrder === true ? "order_creation_detected" : "",
        safe.openExternal === true || safe.windowOpen === true || safe.autoOpen === true ? "external_open_detected" : "",
        safe.hasForbiddenClaim === true ? "forbidden_claim_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingUserTrustClosureSections(input) {
    const evaluation = evaluateGlobalShoppingUserTrustClosureSummary(input);
    return clone([
      statement("read_only_candidate_evidence", "只读候选证据", evaluation.trustHealth.statesReadOnlyCandidateEvidenceOnly ? "pass" : "warning", "Weishan 只做只读候选和证据整理。", "不代表真实价格、锁价或可订。"),
      statement("no_real_provider_request", "未请求真实 provider", evaluation.trustHealth.statesNoRealProviderRequest ? "pass" : "warning", "Weishan 没有请求真实平台或 production provider。", "当前链路仍是只读、安全、可审计。"),
      statement("no_external_open", "未打开外部平台", evaluation.trustHealth.statesNoExternalOpen ? "pass" : "warning", "Weishan 没有打开平台，也不生成真实平台链接。", "用户需自行到平台查看。"),
      statement("no_identity_payment_storage", "未保存身份或支付信息", evaluation.trustHealth.statesNoIdentityPaymentStorage ? "pass" : "warning", "Weishan 没有保存身份、支付或平台账号信息。", "不保存真实姓名、手机号、邮箱、证件、银行卡或平台凭据。"),
      statement("no_booking_payment_ticketing", "未下单、付款、出票", evaluation.trustHealth.statesNoBookingPaymentTicketing ? "pass" : "warning", "Weishan 没有下单、付款或出票。", "所有交易动作仍由用户在平台自行完成。"),
      statement("platform_final_authority", "平台页面为最终依据", evaluation.trustHealth.statesUserMustVerifyOnPlatform && evaluation.trustHealth.statesPlatformFinalAuthority ? "pass" : "warning", "用户仍需自行到平台确认，平台页面为最终依据。", "该摘要不构成平台确认、合同、订单、付款授权或签名。")
    ]);
  }

  function buildGlobalShoppingUserTrustClosureRows(input) {
    return buildGlobalShoppingUserTrustClosureSections(input).map(function (item) {
      return { rowId:item.statementId, label:item.label, value:item.statement, status:item.status, redacted:true };
    });
  }

  function sanitizeGlobalShoppingUserTrustClosureSummary(summary) {
    const safe = obj(summary);
    const evaluation = evaluateGlobalShoppingUserTrustClosureSummary(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      summaryName:SUMMARY_NAME,
      appVersion:GLOBAL_SHOPPING_USER_TRUST_CLOSURE_SUMMARY_VERSION,
      status:status,
      trustBoundary:{
        summaryId:text(safe.summaryId || "global-shopping-user-trust-closure-summary"),
        summaryMode:/^(disabled|display_only|review_only|sandbox_ready)$/.test(text(safe.summaryMode)) ? text(safe.summaryMode) : "display_only",
        displayOnly:true,
        readOnly:true,
        sandboxOnly:true,
        redactedOnly:true,
        productionDisabled:true,
        canPersistSummary:false,
        canSubmitSummary:false,
        canExportSummary:false,
        canDownloadSummary:false,
        canBindUser:false,
        canCaptureSignature:false,
        canAuthorizePayment:false,
        canCreateOrder:false,
        canOpenExternalNow:false
      },
      trustStatements:toArray(safe.trustStatements).length ? toArray(safe.trustStatements) : buildGlobalShoppingUserTrustClosureSections(safe),
      trustHealth:clone(evaluation.trustHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingUserTrustClosureRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"用户信任闭环摘要",
        resultLabel:status === "ready" ? "信任闭环摘要已准备" : (status === "blocked" ? "信任闭环摘要已阻断" : "信任闭环摘要仍需复核"),
        caveat:"该摘要只说明 Weishan 的只读边界，不保存、不提交、不构成平台确认、合同、订单、付款授权或签名。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingUserTrustClosureSummary(input) {
    try {
      return sanitizeGlobalShoppingUserTrustClosureSummary(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingUserTrustClosureSummary({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingUserTrustClosureSummaryAuditDraft(input) {
    const summary = buildGlobalShoppingUserTrustClosureSummary(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_USER_TRUST_CLOSURE_SUMMARY_AUDIT_DRAFT",
      summaryName:SUMMARY_NAME,
      appVersion:GLOBAL_SHOPPING_USER_TRUST_CLOSURE_SUMMARY_VERSION,
      status:summary.status,
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

  window.WeishanGlobalShoppingUserTrustClosureSummary = {
    GLOBAL_SHOPPING_USER_TRUST_CLOSURE_SUMMARY_VERSION,
    SUMMARY_NAME,
    buildGlobalShoppingUserTrustClosureSummary,
    evaluateGlobalShoppingUserTrustClosureSummary,
    buildGlobalShoppingUserTrustClosureRows,
    buildGlobalShoppingUserTrustClosureSections,
    buildGlobalShoppingUserTrustClosureSummaryAuditDraft,
    sanitizeGlobalShoppingUserTrustClosureSummary
  };
})();
