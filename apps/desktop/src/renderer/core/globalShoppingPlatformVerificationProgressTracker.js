;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PLATFORM_VERIFICATION_PROGRESS_TRACKER_VERSION = "2.3.9";
  const TRACKER_NAME = "global_shopping_platform_verification_progress_tracker_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawResponse|rawUserText|platformAccount|platformPassword|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function safety(overrides) {
    return Object.assign({
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
    }, obj(overrides));
  }
  function item(itemId, label, status, summary) {
    const allowed = /^(display_only|not_started|user_must_verify|platform_only|blocked)$/.test(status) ? status : "user_must_verify";
    return { itemId:text(itemId), label:text(label), status:allowed, summary:text(summary), redacted:true };
  }

  function buildGlobalShoppingPlatformVerificationProgressSummary(input) {
    const safe = obj(input);
    return clone({
      hasPriceVerification:safe.hasPriceVerification !== false,
      hasFeeVerification:safe.hasFeeVerification !== false,
      hasAvailabilityVerification:safe.hasAvailabilityVerification !== false,
      hasPolicyVerification:safe.hasPolicyVerification !== false,
      hasIdentityVerification:safe.hasIdentityVerification !== false,
      hasPaymentVerification:safe.hasPaymentVerification !== false,
      hasFinalOrderVerification:safe.hasFinalOrderVerification !== false,
      doesPersistProgress:safe.progressStored === true || safe.progressPersistence === true,
      doesSubmitProgress:safe.progressSubmitted === true || safe.progressSync === true,
      redacted:true
    });
  }

  function evaluateGlobalShoppingPlatformVerificationProgressTracker(input) {
    const safe = obj(input);
    const summary = buildGlobalShoppingPlatformVerificationProgressSummary(safe);
    const blocked = summary.doesPersistProgress ||
      summary.doesSubmitProgress ||
      safe.openExternal === true || safe.windowOpen === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ||
      safe.payment === true || safe.order === true || safe.ticketing === true ||
      safe.hasPaidState === true || safe.hasOrderedState === true || safe.hasTicketedState === true ||
      safe.hasLockedPriceState === true || safe.hasBookableState === true;
    const needsReview = !summary.hasPriceVerification ||
      !summary.hasFeeVerification ||
      !summary.hasAvailabilityVerification ||
      !summary.hasPolicyVerification ||
      !summary.hasIdentityVerification ||
      !summary.hasPaymentVerification ||
      !summary.hasFinalOrderVerification;
    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      progressSummary:summary,
      blockedReasons:blocked ? ["progress_tracker_boundary_blocked"] : [],
      redacted:true
    });
  }

  function buildGlobalShoppingPlatformVerificationProgressRows(input) {
    const safe = obj(input);
    return clone([
      item("price", "实时价格", "user_must_verify", safe.priceSummary || "到平台后人工核对实时价格"),
      item("fee", "税费/服务费/行李费/运费", "user_must_verify", safe.feeSummary || "到平台后人工核对全部附加费用"),
      item("availability", "库存/余票/房态", "platform_only", safe.availabilitySummary || "库存与余票只以平台页面为准"),
      item("currency", "币种/汇率", "user_must_verify", safe.currencySummary || "到平台后人工核对币种与汇率"),
      item("policy", "退改/退款/售后", "platform_only", safe.policySummary || "条款与售后只以平台页面为准"),
      item("supplier", "供应商/航司/酒店/卖家", "platform_only", safe.supplierSummary || "到平台后确认真实供应方"),
      item("account", "登录账号", "user_must_verify", safe.accountSummary || "用户自行登录平台账号"),
      item("identity", "身份证件", "user_must_verify", safe.identitySummary || "用户自行填写身份与证件"),
      item("payment", "支付方式", "user_must_verify", safe.paymentSummary || "用户自行选择并确认支付方式"),
      item("final_order", "最终订单", "user_must_verify", safe.finalOrderSummary || "用户自行核对最终订单内容")
    ]);
  }

  function sanitizeGlobalShoppingPlatformVerificationProgressTracker(tracker) {
    const safe = obj(tracker);
    const evaluation = evaluateGlobalShoppingPlatformVerificationProgressTracker(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      trackerName:TRACKER_NAME,
      appVersion:GLOBAL_SHOPPING_PLATFORM_VERIFICATION_PROGRESS_TRACKER_VERSION,
      status:status,
      title:"平台核对进度追踪",
      progressSummary:clone(evaluation.progressSummary),
      progressRows:toArray(safe.progressRows).length ? toArray(safe.progressRows) : buildGlobalShoppingPlatformVerificationProgressRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"平台核对进度追踪",
        resultLabel:status === "ready" ? "平台核对进度已准备" : (status === "blocked" ? "平台核对进度已阻断" : "平台核对进度仍需复核"),
        caveat:"平台核对进度只做只读提示，不保存勾选，不提交确认，不构成订单、付款授权或签名。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingPlatformVerificationProgressTracker(input) {
    try {
      return sanitizeGlobalShoppingPlatformVerificationProgressTracker(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingPlatformVerificationProgressTracker({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingPlatformVerificationProgressTrackerAuditDraft(input) {
    const tracker = buildGlobalShoppingPlatformVerificationProgressTracker(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PLATFORM_VERIFICATION_PROGRESS_TRACKER_AUDIT_DRAFT",
      trackerName:TRACKER_NAME,
      appVersion:GLOBAL_SHOPPING_PLATFORM_VERIFICATION_PROGRESS_TRACKER_VERSION,
      status:tracker.status,
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

  window.WeishanGlobalShoppingPlatformVerificationProgressTracker = {
    GLOBAL_SHOPPING_PLATFORM_VERIFICATION_PROGRESS_TRACKER_VERSION,
    TRACKER_NAME,
    buildGlobalShoppingPlatformVerificationProgressTracker,
    evaluateGlobalShoppingPlatformVerificationProgressTracker,
    buildGlobalShoppingPlatformVerificationProgressRows,
    buildGlobalShoppingPlatformVerificationProgressSummary,
    buildGlobalShoppingPlatformVerificationProgressTrackerAuditDraft,
    sanitizeGlobalShoppingPlatformVerificationProgressTracker
  };
})();
