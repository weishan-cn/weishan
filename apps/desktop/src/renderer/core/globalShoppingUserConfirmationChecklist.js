;(function () {
  "use strict";

  const GLOBAL_SHOPPING_USER_CONFIRMATION_CHECKLIST_VERSION = "4.0.1";
  const CHECKLIST_NAME = "global_shopping_user_confirmation_checklist_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function mode(value) {
    const next = text(value || "display_only");
    return /^(disabled|display_only|dry_run|sandbox_ready)$/.test(next) ? next : "display_only";
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
  function buildConfirmationItems() {
    return clone([
      { itemId:"price_confirmation", label:"确认平台实时价格", actor:"user", required:true, category:"price", summary:"用户必须在平台页面自行确认最终展示价格。", caveat:"Weishan 不提供价格承诺或锁价承诺。"},
      { itemId:"fee_confirmation", label:"确认税费与附加费用", actor:"user", required:true, category:"fee", summary:"用户必须自行确认税费、行李、运费、服务费等附加费用。", caveat:"附加费用以平台页面最终展示为准。"},
      { itemId:"availability_confirmation", label:"确认库存或可订状态", actor:"user", required:true, category:"availability", summary:"用户必须自行确认库存、房态、余票或可订状态。", caveat:"Weishan 不承诺可订或可出票。"},
      { itemId:"identity_confirmation", label:"确认是否需要真实身份", actor:"user", required:true, category:"identity", summary:"用户必须自行判断平台是否要求身份证、护照或其他真实身份资料。", caveat:"Weishan 不替用户填写身份资料。"},
      { itemId:"account_confirmation", label:"确认是否需要平台登录", actor:"user", required:true, category:"account", summary:"用户必须自行判断是否需要平台账号登录。", caveat:"Weishan 不替用户登录或保存平台账号密码。"},
      { itemId:"payment_confirmation", label:"确认是否需要支付", actor:"user", required:true, category:"payment", summary:"用户必须自行判断是否愿意在平台支付。", caveat:"Weishan 不替用户付款或保存支付资料。"},
      { itemId:"policy_confirmation", label:"确认退改与售后条款", actor:"user", required:true, category:"policy", summary:"用户必须自行确认退款、改签、售后或服务条款。", caveat:"条款以平台实时页面和订单页说明为准。"},
      { itemId:"order_confirmation", label:"确认最终订单信息", actor:"user", required:true, category:"order", summary:"用户必须自行确认最终订单信息后再决定是否下单。", caveat:"Weishan 不替用户创建订单、下单或出票。"},
      { itemId:"safety_confirmation", label:"确认只读安全边界", actor:"user", required:true, category:"safety", summary:"用户必须理解 Weishan 只提供只读候选证据和交接说明。", caveat:"Weishan 不替用户登录、付款、下单或出票。"}
    ].map(function (item) {
      return Object.assign(item, { summary:text(item.summary), caveat:text(item.caveat), redacted:true });
    }));
  }
  function buildGlobalShoppingUserOnlyActionRows() {
    return clone([
      { actionId:"login_platform", label:"平台登录", reason:"必须由用户本人在平台完成。", weishanCanDo:false },
      { actionId:"fill_identity", label:"填写真实身份", reason:"必须由用户本人判断并填写。", weishanCanDo:false },
      { actionId:"enter_payment", label:"填写支付资料", reason:"必须由用户本人在平台完成。", weishanCanDo:false },
      { actionId:"submit_order", label:"确认下单", reason:"必须由用户本人决定是否提交。", weishanCanDo:false }
    ].map(function (item) { return Object.assign(item, { label:text(item.label), reason:text(item.reason), redacted:true }); }));
  }
  function buildGlobalShoppingUserConfirmationChecklistRows() {
    return clone(buildConfirmationItems().map(function (item) {
      return {
        rowId:text(item.itemId),
        label:text(item.label),
        value:text(item.summary),
        status:"pass",
        redacted:true
      };
    }));
  }
  function evaluateGlobalShoppingUserConfirmationChecklist(input) {
    const safe = obj(input);
    const confirmationItems = buildConfirmationItems();
    const userOnlyActions = buildGlobalShoppingUserOnlyActionRows();
    const checklistHealth = {
      hasPriceConfirmation:confirmationItems.some(function (item) { return item.category === "price"; }),
      hasFeeConfirmation:confirmationItems.some(function (item) { return item.category === "fee"; }),
      hasAvailabilityConfirmation:confirmationItems.some(function (item) { return item.category === "availability"; }),
      hasIdentityConfirmation:confirmationItems.some(function (item) { return item.category === "identity"; }),
      hasAccountConfirmation:confirmationItems.some(function (item) { return item.category === "account"; }),
      hasPaymentConfirmation:confirmationItems.some(function (item) { return item.category === "payment"; }),
      hasPolicyConfirmation:confirmationItems.some(function (item) { return item.category === "policy"; }),
      hasOrderConfirmation:confirmationItems.some(function (item) { return item.category === "order"; }),
      noPersistence:safe.persistUserConfirmation !== true && safe.canPersistUserConfirmation !== true,
      noSubmission:safe.submitUserConfirmation !== true && safe.canSubmitUserConfirmation !== true,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true && safe.autoOpen !== true && safe.canOpenExternalNow !== true,
      noCheckoutPaymentTicketing:safe.checkout !== true && safe.payment !== true && safe.ticketing !== true && safe.canCheckout !== true && safe.canPay !== true && safe.canTicket !== true && safe.createOrder !== true && safe.canCreateOrder !== true,
      doesNotMakeDecisionForUser:safe.makeDecisionForUser !== true && safe.doesNotMakeDecisionForUser !== false
    };
    const blockedReasons = [];
    if (!checklistHealth.noPersistence) blockedReasons.push("confirmation_persistence_detected");
    if (!checklistHealth.noSubmission) blockedReasons.push("confirmation_submission_detected");
    if (!checklistHealth.noExternalOpen) blockedReasons.push("external_open_detected");
    if (!checklistHealth.noCheckoutPaymentTicketing) blockedReasons.push("transaction_capability_detected");
    if (!checklistHealth.doesNotMakeDecisionForUser) blockedReasons.push("decision_override_detected");
    const needsReview = !checklistHealth.hasPriceConfirmation || !checklistHealth.hasFeeConfirmation || !checklistHealth.hasAvailabilityConfirmation || !checklistHealth.hasIdentityConfirmation || !checklistHealth.hasAccountConfirmation || !checklistHealth.hasPaymentConfirmation || !checklistHealth.hasPolicyConfirmation || !checklistHealth.hasOrderConfirmation;
    return clone({
      checklistName:CHECKLIST_NAME,
      appVersion:GLOBAL_SHOPPING_USER_CONFIRMATION_CHECKLIST_VERSION,
      status:blockedReasons.length ? "blocked" : (needsReview ? "needs_review" : "ready"),
      checklistBoundary:{
        checklistId:text(safe.checklistId || "user_confirmation_checklist_v2_2_3"),
        checklistMode:mode(safe.checklistMode || "display_only"),
        displayOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canPersistUserConfirmation:false,
        canSubmitUserConfirmation:false,
        canOpenExternalNow:false,
        canCheckout:false,
        canPay:false,
        canTicket:false,
        canCreateOrder:false,
        doesNotMakeDecisionForUser:true
      },
      confirmationItems:confirmationItems,
      userOnlyActions:userOnlyActions,
      checklistHealth:checklistHealth,
      rows:buildGlobalShoppingUserConfirmationChecklistRows().concat(userOnlyActions.map(function (item) {
        return { rowId:text(item.actionId), label:text(item.label), value:text(item.reason), status:"pass", redacted:true };
      })),
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"用户确认清单",
        resultLabel:blockedReasons.length ? "用户确认清单已阻断" : (needsReview ? "用户确认清单仍需复核" : "用户确认清单已准备"),
        caveat:"清单只提醒用户到平台自行确认，不替用户登录、填写身份、付款、下单或出票。"
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function sanitizeGlobalShoppingUserConfirmationChecklist(checklist) {
    const safe = obj(checklist);
    const evaluated = evaluateGlobalShoppingUserConfirmationChecklist(safe);
    return clone({
      checklistName:CHECKLIST_NAME,
      appVersion:GLOBAL_SHOPPING_USER_CONFIRMATION_CHECKLIST_VERSION,
      status:/^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluated.status,
      checklistBoundary:clone(evaluated.checklistBoundary),
      confirmationItems:clone(evaluated.confirmationItems),
      userOnlyActions:clone(evaluated.userOnlyActions),
      checklistHealth:clone(evaluated.checklistHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : clone(evaluated.rows),
      blockedReasons:clone(evaluated.blockedReasons),
      userFacingSummary:clone(evaluated.userFacingSummary),
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingUserConfirmationChecklist(input) {
    try {
      return sanitizeGlobalShoppingUserConfirmationChecklist(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingUserConfirmationChecklist({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingUserConfirmationChecklistAuditDraft(input) {
    const checklist = buildGlobalShoppingUserConfirmationChecklist(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_USER_CONFIRMATION_CHECKLIST_AUDIT_DRAFT",
      checklistName:CHECKLIST_NAME,
      appVersion:GLOBAL_SHOPPING_USER_CONFIRMATION_CHECKLIST_VERSION,
      status:checklist.status,
      blockedReasonCount:checklist.blockedReasons.length,
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

  window.WeishanGlobalShoppingUserConfirmationChecklist = {
    GLOBAL_SHOPPING_USER_CONFIRMATION_CHECKLIST_VERSION,
    CHECKLIST_NAME,
    buildGlobalShoppingUserConfirmationChecklist,
    evaluateGlobalShoppingUserConfirmationChecklist,
    buildGlobalShoppingUserConfirmationChecklistRows,
    buildGlobalShoppingUserOnlyActionRows:buildGlobalShoppingUserOnlyActionRows,
    buildGlobalShoppingUserConfirmationChecklistAuditDraft,
    sanitizeGlobalShoppingUserConfirmationChecklist
  };
})();
