;(function () {
  "use strict";

  const GLOBAL_SHOPPING_FINAL_USER_SAFETY_CHECKLIST_VERSION = "4.2.0";
  const CHECKLIST_NAME = "global_shopping_final_user_safety_checklist_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawResponse|rawUserText|platformAccount|platformPassword|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function safetyItem(itemId, label, category, status, summary, caveat) {
    return {
      itemId:text(itemId),
      label:text(label),
      category:/^(price|availability|fee|policy|identity|payment|order|privacy|platform|decision)$/.test(category) ? category : "decision",
      status:/^(display_only|user_must_verify|platform_only|blocked)$/.test(status) ? status : "user_must_verify",
      summary:text(summary),
      caveat:text(caveat),
      redacted:true
    };
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

  function buildGlobalShoppingFinalUserSafetyChecklistSections(input) {
    const safe = obj(input);
    return clone([
      safetyItem("price_safety", "不要把候选价当最终价", "price", "display_only", safe.priceSafetySummary || "候选价只用于参考，到平台后核对实时价格。", "不要承诺最低价、最终价或已锁价。"),
      safetyItem("availability_safety", "核对库存与可订状态", "availability", "platform_only", safe.availabilitySafetySummary || "库存、余票、房态和可订状态只以平台页面为准。", "Weishan 不保证库存、余票或房态。"),
      safetyItem("fee_policy_safety", "核对税费与退改政策", "fee", "user_must_verify", safe.feePolicySafetySummary || "到平台核对税费、服务费、行李费、退改和售后条款。", "平台政策可能实时变化。"),
      safetyItem("identity_privacy_safety", "不要在 Weishan 填写敏感身份与支付资料", "privacy", "display_only", safe.identityPrivacySafetySummary || "不要在 Weishan 填写身份证、护照、银行卡、平台密码。", "敏感资料只能由用户在平台自行处理。"),
      safetyItem("payment_order_safety", "付款与下单只能在平台完成", "payment", "platform_only", safe.paymentOrderSafetySummary || "任何付款、下单、出票都只能由用户在平台自行完成。", "Weishan 不付款、不下单、不出票。"),
      safetyItem("platform_authority", "平台页面为最终依据", "platform", "display_only", safe.platformAuthoritySummary || "平台页面为最终依据。", "最终价格、库存、条款和订单内容以平台页面为准。"),
      safetyItem("user_decision_boundary", "最终是否继续由用户自行决定", "decision", "display_only", safe.userDecisionSummary || "离开 Weishan 后由用户自行判断是否继续。", "Weishan 不保存最终选择。")
    ]);
  }

  function buildGlobalShoppingFinalUserSafetyRows(input) {
    return buildGlobalShoppingFinalUserSafetyChecklistSections(input).map(function (item) {
      return {
        rowId:item.itemId,
        label:item.label,
        value:item.summary,
        status:item.status === "blocked" ? "blocked" : "pass",
        redacted:true
      };
    });
  }

  function evaluateGlobalShoppingFinalUserSafetyChecklist(input) {
    const safe = obj(input);
    const blocked = safe.persistChecklist === true || safe.submitChecklist === true || safe.syncChecklist === true ||
      safe.openExternal === true || safe.windowOpen === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ||
      safe.payment === true || safe.order === true || safe.ticketing === true ||
      safe.createOrder === true || safe.paymentAuthorization === true ||
      safe.hasForbiddenClaim === true;
    const health = {
      hasPriceSafety:safe.hasPriceSafety !== false,
      hasAvailabilitySafety:safe.hasAvailabilitySafety !== false,
      hasFeePolicySafety:safe.hasFeePolicySafety !== false,
      hasIdentityPrivacySafety:safe.hasIdentityPrivacySafety !== false,
      hasPaymentOrderSafety:safe.hasPaymentOrderSafety !== false,
      hasPlatformFinalAuthority:safe.hasPlatformFinalAuthority !== false,
      hasUserDecisionBoundary:safe.hasUserDecisionBoundary !== false,
      noPersistence:safe.persistChecklist !== true,
      noSubmission:safe.submitChecklist !== true,
      noSync:safe.syncChecklist !== true,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true,
      noRealUrl:!(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl),
      noCheckoutPaymentTicketingOrder:safe.payment !== true && safe.order !== true && safe.ticketing !== true && safe.createOrder !== true && safe.paymentAuthorization !== true,
      noForbiddenClaims:safe.hasForbiddenClaim !== true
    };
    const needsReview = !health.hasPriceSafety || !health.hasAvailabilitySafety || !health.hasFeePolicySafety ||
      !health.hasIdentityPrivacySafety || !health.hasPaymentOrderSafety || !health.hasPlatformFinalAuthority || !health.hasUserDecisionBoundary;
    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      checklistBoundary:{
        checklistId:"final_user_safety_checklist",
        checklistMode:text(safe.checklistMode || "display_only") || "display_only",
        displayOnly:true,
        readOnly:true,
        sandboxOnly:true,
        redactedOnly:true,
        productionDisabled:true,
        canPersistChecklist:false,
        canSubmitChecklist:false,
        canSyncChecklist:false,
        canOpenExternalNow:false,
        canGenerateRealUrl:false,
        canCheckout:false,
        canPay:false,
        canTicket:false,
        canCreateOrder:false,
        canAuthorizePayment:false
      },
      checklistHealth:health,
      blockedReasons:blocked ? [
        safe.persistChecklist === true ? "checklist_persistence_detected" : "",
        safe.submitChecklist === true ? "checklist_submission_detected" : "",
        safe.syncChecklist === true ? "checklist_sync_detected" : "",
        safe.openExternal === true || safe.windowOpen === true ? "external_open_detected" : "",
        safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ? "real_url_detected" : "",
        safe.payment === true || safe.order === true || safe.ticketing === true || safe.createOrder === true || safe.paymentAuthorization === true ? "transaction_detected" : "",
        safe.hasForbiddenClaim === true ? "forbidden_claim_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function sanitizeGlobalShoppingFinalUserSafetyChecklist(checklist) {
    const safe = obj(checklist);
    const evaluation = evaluateGlobalShoppingFinalUserSafetyChecklist(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      checklistName:CHECKLIST_NAME,
      appVersion:GLOBAL_SHOPPING_FINAL_USER_SAFETY_CHECKLIST_VERSION,
      status:status,
      checklistBoundary:clone(evaluation.checklistBoundary),
      safetyItems:toArray(safe.safetyItems).length ? toArray(safe.safetyItems) : buildGlobalShoppingFinalUserSafetyChecklistSections(safe),
      checklistHealth:clone(evaluation.checklistHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingFinalUserSafetyRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"最终用户安全清单",
        resultLabel:status === "ready" ? "最终安全清单已准备" : (status === "blocked" ? "最终安全清单已阻断" : "最终安全清单仍需复核"),
        caveat:"该清单只提醒用户人工核对，不保存勾选，不打开平台，不替用户付款、下单或出票。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingFinalUserSafetyChecklist(input) {
    try {
      return sanitizeGlobalShoppingFinalUserSafetyChecklist(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingFinalUserSafetyChecklist({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingFinalUserSafetyChecklistAuditDraft(input) {
    const checklist = buildGlobalShoppingFinalUserSafetyChecklist(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_FINAL_USER_SAFETY_CHECKLIST_AUDIT_DRAFT",
      checklistName:CHECKLIST_NAME,
      appVersion:GLOBAL_SHOPPING_FINAL_USER_SAFETY_CHECKLIST_VERSION,
      status:checklist.status,
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

  window.WeishanGlobalShoppingFinalUserSafetyChecklist = {
    GLOBAL_SHOPPING_FINAL_USER_SAFETY_CHECKLIST_VERSION,
    CHECKLIST_NAME,
    buildGlobalShoppingFinalUserSafetyChecklist,
    evaluateGlobalShoppingFinalUserSafetyChecklist,
    buildGlobalShoppingFinalUserSafetyRows,
    buildGlobalShoppingFinalUserSafetyChecklistSections,
    buildGlobalShoppingFinalUserSafetyChecklistAuditDraft,
    sanitizeGlobalShoppingFinalUserSafetyChecklist
  };
})();
