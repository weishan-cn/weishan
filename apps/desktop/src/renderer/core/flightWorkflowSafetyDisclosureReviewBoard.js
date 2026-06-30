;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_SAFETY_DISCLOSURE_REVIEW_BOARD_VERSION = "2.4.1";
  const BOARD_NAME = "flight_workflow_safety_disclosure_review_board_v1";
  const CAVEAT = "该复核板只检查只读 RC 安全披露，不代表真实交易、订单、客服工单或出票能力。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential/ig, "redacted")
      .trim();
  }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId || "row"),
      label:text(label),
      value:text(value),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
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
  function collectText(value, bucket) {
    if (value == null) return;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      const next = text(value);
      if (next) bucket.push(next);
      return;
    }
    if (Array.isArray(value)) return value.forEach(function (item) { collectText(item, bucket); });
    if (typeof value === "object") {
      Object.keys(value).forEach(function (key) {
        if (/bookingUrl|checkoutUrl|paymentUrl|orderUrl|token|apiKey|key|secret|password|credential|identity|passport|bank|card/i.test(key)) return;
        collectText(value[key], bucket);
      });
    }
  }
  function disclosureCorpus(input) {
    const safe = obj(input);
    const bucket = [];
    collectText(safe.rcUserFacingCopyFinalizationSummary, bucket);
    collectText(safe.releaseRiskLedgerSummary, bucket);
    collectText(safe.rcRegressionAuditSummary, bucket);
    collectText(safe.safetyRegressionSummary, bucket);
    collectText(safe.riskBadgeSummary, bucket);
    collectText(safe.candidateCardSummary, bucket);
    collectText(safe.readOnlyQuoteSummary, bucket);
    collectText(safe.operatorConsoleSummary, bucket);
    collectText(safe.disclosureText, bucket);
    return bucket.join("\n");
  }
  function hasTradingCapabilityClaim(corpus) {
    return /可出票|可以出票|出票保证|全网最低|真实最终价已确认|已锁价/.test(corpus) ||
      (/最低价保证/.test(corpus) && !/不代表真实最终价、锁价或最低价保证/.test(corpus));
  }
  function evaluateFlightWorkflowSafetyDisclosureReview(input) {
    const safe = obj(input);
    const corpus = disclosureCorpus(safe);
    const disclosureHealth = {
      readOnlyDisclosureVisible:/只读候选证据流程|只读 RC|只读候选证据/i.test(corpus),
      providerDisabledDisclosureVisible:/真实平台与供应商接口当前未启用|provider.*未启用|供应商接口当前未启用/i.test(corpus),
      identitySafetyDisclosureVisible:/请勿输入身份证、护照、银行卡、支付凭证或平台登录凭据|不保存真实身份/i.test(corpus),
      paymentDisabledDisclosureVisible:/不提供付款、下单或出票能力|不付款/i.test(corpus),
      orderDisabledDisclosureVisible:/不提供付款、下单或出票能力|不下单/i.test(corpus),
      ticketingDisabledDisclosureVisible:/不提供付款、下单或出票能力|不出票/i.test(corpus),
      priceGuaranteeDisabledDisclosureVisible:/不代表真实最终价、锁价或最低价保证|最低价保证/i.test(corpus),
      lockPriceDisabledDisclosureVisible:/不代表真实最终价、锁价或最低价保证|锁价/i.test(corpus),
      noDangerousButtonCopy:!/立即购买|直接下单|一键出票|去付款|提交订单/.test(corpus),
      noSensitiveDataPrompt:!/请输入身份证|请输入护照|请输入银行卡|请输入支付凭证|请输入平台登录凭据|上传身份证|上传护照|上传银行卡/.test(corpus),
      noTradingCapabilityClaim:!hasTradingCapabilityClaim(corpus)
    };

    const blockedReasons = [];
    if (!disclosureHealth.noDangerousButtonCopy) blockedReasons.push("dangerous_button_copy");
    if (!disclosureHealth.noSensitiveDataPrompt) blockedReasons.push("sensitive_data_prompt");
    if (!disclosureHealth.noTradingCapabilityClaim) blockedReasons.push("trading_capability_claim");

    let status = "approved";
    if (blockedReasons.length) status = "blocked";
    else if (!disclosureHealth.readOnlyDisclosureVisible || !disclosureHealth.providerDisabledDisclosureVisible || !disclosureHealth.paymentDisabledDisclosureVisible || !disclosureHealth.orderDisabledDisclosureVisible || !disclosureHealth.ticketingDisabledDisclosureVisible) status = "needs_review";

    return clone({
      boardName:BOARD_NAME,
      appVersion:FLIGHT_WORKFLOW_SAFETY_DISCLOSURE_REVIEW_BOARD_VERSION,
      status:status,
      disclosureHealth:disclosureHealth,
      disclosureRows:[
        row("read_only", "只读声明", disclosureHealth.readOnlyDisclosureVisible ? "只读声明可见" : "缺少只读声明", disclosureHealth.readOnlyDisclosureVisible ? "pass" : "warning"),
        row("provider_disabled", "Provider 未启用", disclosureHealth.providerDisabledDisclosureVisible ? "Provider 禁用说明可见" : "缺少 Provider 禁用说明", disclosureHealth.providerDisabledDisclosureVisible ? "pass" : "warning"),
        row("identity_safety", "敏感信息披露", disclosureHealth.identitySafetyDisclosureVisible && disclosureHealth.noSensitiveDataPrompt ? "敏感信息披露正常" : "敏感信息披露仍需复核", disclosureHealth.identitySafetyDisclosureVisible && disclosureHealth.noSensitiveDataPrompt ? "pass" : "blocked"),
        row("payment_order_ticketing", "交易能力说明", disclosureHealth.paymentDisabledDisclosureVisible && disclosureHealth.orderDisabledDisclosureVisible && disclosureHealth.ticketingDisabledDisclosureVisible ? "禁用交易能力已说明" : "缺少交易能力说明", disclosureHealth.paymentDisabledDisclosureVisible && disclosureHealth.orderDisabledDisclosureVisible && disclosureHealth.ticketingDisabledDisclosureVisible ? "pass" : "warning"),
        row("price_copy", "价格披露", disclosureHealth.priceGuaranteeDisabledDisclosureVisible && disclosureHealth.lockPriceDisabledDisclosureVisible && disclosureHealth.noTradingCapabilityClaim ? "价格披露正常" : "价格披露仍需复核", disclosureHealth.noTradingCapabilityClaim ? "pass" : "blocked"),
        row("dangerous_copy", "危险按钮词", disclosureHealth.noDangerousButtonCopy ? "未发现危险按钮词" : "发现危险按钮词，已阻断", disclosureHealth.noDangerousButtonCopy ? "pass" : "blocked"),
        row("next_step", "下一步", status === "approved" ? "安全披露通过" : status === "needs_review" ? "安全披露仍需复核" : "安全披露已阻断", status === "blocked" ? "blocked" : (status === "approved" ? "pass" : "warning"))
      ],
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"安全披露复核板",
        resultLabel:status === "approved" ? "安全披露通过" : status === "needs_review" ? "安全披露仍需复核" : "安全披露已阻断",
        caveat:CAVEAT,
        redacted:true
      },
      globalShoppingProductGoalSummary:clone(obj(input).globalShoppingProductGoalSummary || null),
      jumpToPlatformBoundarySummary:clone(obj(input).jumpToPlatformBoundarySummary || null),
      globalShoppingGoalStatus:text(obj(input).globalShoppingGoalStatus || obj(obj(input).globalShoppingProductGoalSummary).status || ""),
      jumpBoundaryStatus:text(obj(input).jumpBoundaryStatus || obj(obj(input).jumpToPlatformBoundarySummary).status || ""),
      safeToProceedWithJumpToPlatformMvp:obj(input).safeToProceedWithJumpToPlatformMvp === true,
      safety:safety(),
      redacted:true
    });
  }
  function sanitizeFlightWorkflowSafetyDisclosureReviewBoard(board) {
    const safe = obj(board);
    const status = /^(approved|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    return clone({
      boardName:BOARD_NAME,
      appVersion:FLIGHT_WORKFLOW_SAFETY_DISCLOSURE_REVIEW_BOARD_VERSION,
      status:status,
      disclosureHealth:Object.assign({
        readOnlyDisclosureVisible:false,
        providerDisabledDisclosureVisible:false,
        identitySafetyDisclosureVisible:false,
        paymentDisabledDisclosureVisible:false,
        orderDisabledDisclosureVisible:false,
        ticketingDisabledDisclosureVisible:false,
        priceGuaranteeDisabledDisclosureVisible:false,
        lockPriceDisabledDisclosureVisible:false,
        noDangerousButtonCopy:true,
        noSensitiveDataPrompt:true,
        noTradingCapabilityClaim:true
      }, obj(safe.disclosureHealth)),
      disclosureRows:toArray(safe.disclosureRows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }),
      blockedReasons:toArray(safe.blockedReasons).map(text),
      userFacingSummary:{
        title:"安全披露复核板",
        resultLabel:obj(safe.userFacingSummary).resultLabel || (status === "approved" ? "安全披露通过" : status === "needs_review" ? "安全披露仍需复核" : "安全披露已阻断"),
        caveat:obj(safe.userFacingSummary).caveat || CAVEAT,
        redacted:true
      },
      globalShoppingProductGoalSummary:clone(safe.globalShoppingProductGoalSummary || null),
      jumpToPlatformBoundarySummary:clone(safe.jumpToPlatformBoundarySummary || null),
      globalShoppingGoalStatus:text(safe.globalShoppingGoalStatus || ""),
      jumpBoundaryStatus:text(safe.jumpBoundaryStatus || ""),
      safeToProceedWithJumpToPlatformMvp:safe.safeToProceedWithJumpToPlatformMvp === true,
      safety:Object.assign(safety(), obj(safe.safety)),
      redacted:true
    });
  }
  function buildFlightWorkflowSafetyDisclosureReviewBoard(input) {
    try {
      return sanitizeFlightWorkflowSafetyDisclosureReviewBoard(evaluateFlightWorkflowSafetyDisclosureReview(input || {}));
    } catch (error) {
      return sanitizeFlightWorkflowSafetyDisclosureReviewBoard({
        status:"failed_safe",
        blockedReasons:["failed_safe"],
        userFacingSummary:{ title:"安全披露复核板", resultLabel:"安全披露已阻断", caveat:CAVEAT, redacted:true }
      });
    }
  }
  function buildFlightWorkflowSafetyDisclosureRows(input) {
    return clone(buildFlightWorkflowSafetyDisclosureReviewBoard(input || {}).disclosureRows || []);
  }
  function buildFlightWorkflowSafetyDisclosureReviewBoardAuditDraft(input) {
    const board = buildFlightWorkflowSafetyDisclosureReviewBoard(input || {});
    return clone({
      eventType:"FLIGHT_WORKFLOW_SAFETY_DISCLOSURE_REVIEW_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:FLIGHT_WORKFLOW_SAFETY_DISCLOSURE_REVIEW_BOARD_VERSION,
      status:board.status,
      blockedReasonCount:board.blockedReasons.length,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      fileWrite:false,
      download:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    });
  }

  window.WeishanFlightWorkflowSafetyDisclosureReviewBoard = {
    FLIGHT_WORKFLOW_SAFETY_DISCLOSURE_REVIEW_BOARD_VERSION,
    BOARD_NAME,
    buildFlightWorkflowSafetyDisclosureReviewBoard,
    evaluateFlightWorkflowSafetyDisclosureReview,
    buildFlightWorkflowSafetyDisclosureRows,
    buildFlightWorkflowSafetyDisclosureReviewBoardAuditDraft,
    sanitizeFlightWorkflowSafetyDisclosureReviewBoard
  };
})();
