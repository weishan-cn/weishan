;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_RC_USER_FACING_COPY_FINALIZATION_VERSION = "4.0.0";
  const FINALIZATION_NAME = "flight_workflow_rc_user_facing_copy_finalization_v1";
  const CAVEAT = "该定稿只覆盖只读 RC 候选文案，不代表真实账号、客服工单、交易请求或出票能力。";
  const RECOMMENDED_COPY = {
    primaryDisclaimer:"当前为只读候选证据流程，不提供付款、下单或出票能力。",
    providerDisclaimer:"真实平台与供应商接口当前未启用，页面仅展示候选证据和复核状态。",
    priceDisclaimer:"价格仅为候选展示，不代表真实最终价、锁价或最低价保证。",
    safetyDisclaimer:"请勿输入身份证、护照、银行卡、支付凭证或平台登录凭据。"
  };

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
    if (Array.isArray(value)) {
      value.forEach(function (item) { collectText(item, bucket); });
      return;
    }
    if (typeof value === "object") {
      Object.keys(value).forEach(function (key) {
        if (/bookingUrl|checkoutUrl|paymentUrl|orderUrl|token|apiKey|key|secret|password|credential|identity|passport|bank|card/i.test(key)) return;
        collectText(value[key], bucket);
      });
    }
  }
  function copyCorpus(input) {
    const safe = obj(input);
    const bucket = [];
    collectText(safe.userSafetyCopySummary, bucket);
    collectText(safe.forbiddenCapabilitySummary, bucket);
    collectText(safe.rcRegressionViewModelSummary, bucket);
    collectText(safe.releaseRiskLedgerSummary, bucket);
    collectText(safe.rcRegressionAuditSummary, bucket);
    collectText(safe.rcCandidateReviewSummary, bucket);
    collectText(safe.rcEvidenceReviewSummary, bucket);
    collectText(safe.operatorConsoleSummary, bucket);
    collectText(safe.readOnlyQuoteSummary, bucket);
    collectText(safe.candidateCardSummary, bucket);
    collectText(safe.copyText, bucket);
    collectText(safe.copyRows, bucket);
    return bucket.join("\n");
  }
  function contains(corpus, pattern) { return pattern.test(corpus); }
  function hasForbiddenGuaranteeClaim(corpus) {
    return /全网最低|真实最终价已确认|已锁价|锁价成功/.test(corpus) ||
      (/最低价保证/.test(corpus) && !/不代表真实最终价、锁价或最低价保证/.test(corpus));
  }
  function evaluateFlightWorkflowRcUserFacingCopy(input) {
    const safe = obj(input);
    const corpus = copyCorpus(safe);
    const copyHealth = {
      hasReadOnlyDisclosure:contains(corpus, /只读候选证据流程|只读 RC|只读候选证据/i),
      hasNoBookingDisclosure:contains(corpus, /不提供付款、下单或出票能力|不付款、不下单、不出票|bookingUrl:? ?null/i),
      hasNoPaymentDisclosure:contains(corpus, /不提供付款、下单或出票能力|不付款/i),
      hasNoTicketingDisclosure:contains(corpus, /不提供付款、下单或出票能力|不出票/i),
      hasNoPriceGuaranteeDisclosure:contains(corpus, /不代表真实最终价、锁价或最低价保证|不代表真实最终价|最低价保证/i),
      hasNoLockPriceDisclosure:contains(corpus, /不代表真实最终价、锁价或最低价保证|锁价/i),
      hasProviderDisabledDisclosure:contains(corpus, /真实平台与供应商接口当前未启用|provider.*未启用|供应商接口当前未启用/i),
      hasSafetyBoundaryDisclosure:contains(corpus, /请勿输入身份证、护照、银行卡、支付凭证或平台登录凭据|不保存真实身份、不发送真实邀请、不提供交易能力/i),
      hasRcReviewDisclosure:contains(corpus, /该页面只用于只读 RC 文案定稿与安全披露复核|文案不代表交易能力|RC 文案/i),
      noForbiddenPurchaseCopy:!contains(corpus, /立即购买|直接下单|一键出票|马上付款|去付款|提交订单/),
      noForbiddenTicketingCopy:!contains(corpus, /可出票|可以出票|立即出票|出票保证|出票成功/),
      noForbiddenGuaranteeCopy:!hasForbiddenGuaranteeClaim(corpus),
      noSensitiveDataRequestCopy:!contains(corpus, /请输入身份证|请输入护照|请输入银行卡|请输入支付凭证|请输入平台登录凭据|上传身份证|上传护照|上传银行卡/)
    };

    const forbiddenCopyFindings = [];
    if (!copyHealth.noForbiddenPurchaseCopy) forbiddenCopyFindings.push("forbidden_purchase_copy");
    if (!copyHealth.noForbiddenTicketingCopy) forbiddenCopyFindings.push("forbidden_ticketing_copy");
    if (!copyHealth.noForbiddenGuaranteeCopy) forbiddenCopyFindings.push("forbidden_guarantee_copy");
    if (!copyHealth.noSensitiveDataRequestCopy) forbiddenCopyFindings.push("sensitive_data_request_copy");

    let status = "finalized";
    if (forbiddenCopyFindings.length) status = "blocked";
    else if (!copyHealth.hasReadOnlyDisclosure || !copyHealth.hasNoBookingDisclosure || !copyHealth.hasNoPaymentDisclosure || !copyHealth.hasNoTicketingDisclosure || !copyHealth.hasNoPriceGuaranteeDisclosure || !copyHealth.hasNoLockPriceDisclosure || !copyHealth.hasProviderDisabledDisclosure || !copyHealth.hasSafetyBoundaryDisclosure || !copyHealth.hasRcReviewDisclosure) status = "needs_review";

    return clone({
      finalizationName:FINALIZATION_NAME,
      appVersion:FLIGHT_WORKFLOW_RC_USER_FACING_COPY_FINALIZATION_VERSION,
      status:status,
      copyHealth:copyHealth,
      copyRows:[
        row("read_only", "只读声明", copyHealth.hasReadOnlyDisclosure ? "只读声明已出现" : "缺少只读声明", copyHealth.hasReadOnlyDisclosure ? "pass" : "warning"),
        row("payment", "禁用付款/下单/出票", copyHealth.hasNoPaymentDisclosure && copyHealth.hasNoTicketingDisclosure ? "禁用交易能力已说明" : "缺少交易禁用说明", copyHealth.hasNoPaymentDisclosure && copyHealth.hasNoTicketingDisclosure ? "pass" : "warning"),
        row("price", "价格说明", copyHealth.hasNoPriceGuaranteeDisclosure && copyHealth.hasNoLockPriceDisclosure ? "价格说明已出现" : "缺少价格说明", copyHealth.hasNoPriceGuaranteeDisclosure && copyHealth.hasNoLockPriceDisclosure ? "pass" : "warning"),
        row("provider", "Provider 说明", copyHealth.hasProviderDisabledDisclosure ? "Provider 未启用已说明" : "缺少 Provider 禁用说明", copyHealth.hasProviderDisabledDisclosure ? "pass" : "warning"),
        row("safety", "敏感信息说明", copyHealth.hasSafetyBoundaryDisclosure && copyHealth.noSensitiveDataRequestCopy ? "敏感信息提示正常" : "敏感信息提示仍需复核", copyHealth.hasSafetyBoundaryDisclosure && copyHealth.noSensitiveDataRequestCopy ? "pass" : "blocked"),
        row("forbidden_copy", "禁用措辞", forbiddenCopyFindings.length ? "发现危险文案，已阻断" : "未发现危险文案", forbiddenCopyFindings.length ? "blocked" : "pass"),
        row("next_step", "下一步", status === "finalized" ? "文案可以定稿" : status === "needs_review" ? "文案仍需复核" : "文案已阻断", status === "blocked" ? "blocked" : (status === "finalized" ? "pass" : "warning"))
      ],
      forbiddenCopyFindings:forbiddenCopyFindings,
      recommendedCopy:clone(RECOMMENDED_COPY),
      userFacingSummary:{
        title:"只读 RC 用户可见文案定稿",
        resultLabel:status === "finalized" ? "文案可以定稿" : status === "needs_review" ? "文案仍需复核" : "文案已阻断",
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
  function sanitizeFlightWorkflowRcUserFacingCopyFinalization(finalization) {
    const safe = obj(finalization);
    const status = /^(finalized|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    return clone({
      finalizationName:FINALIZATION_NAME,
      appVersion:FLIGHT_WORKFLOW_RC_USER_FACING_COPY_FINALIZATION_VERSION,
      status:status,
      copyHealth:Object.assign({
        hasReadOnlyDisclosure:false,
        hasNoBookingDisclosure:false,
        hasNoPaymentDisclosure:false,
        hasNoTicketingDisclosure:false,
        hasNoPriceGuaranteeDisclosure:false,
        hasNoLockPriceDisclosure:false,
        hasProviderDisabledDisclosure:false,
        hasSafetyBoundaryDisclosure:false,
        hasRcReviewDisclosure:false,
        noForbiddenPurchaseCopy:true,
        noForbiddenTicketingCopy:true,
        noForbiddenGuaranteeCopy:true,
        noSensitiveDataRequestCopy:true
      }, obj(safe.copyHealth)),
      copyRows:toArray(safe.copyRows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }),
      forbiddenCopyFindings:toArray(safe.forbiddenCopyFindings).map(text),
      recommendedCopy:Object.assign({}, RECOMMENDED_COPY, obj(safe.recommendedCopy)),
      userFacingSummary:{
        title:"只读 RC 用户可见文案定稿",
        resultLabel:obj(safe.userFacingSummary).resultLabel || (status === "finalized" ? "文案可以定稿" : status === "needs_review" ? "文案仍需复核" : "文案已阻断"),
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
  function buildFlightWorkflowRcUserFacingCopyFinalization(input) {
    try {
      return sanitizeFlightWorkflowRcUserFacingCopyFinalization(evaluateFlightWorkflowRcUserFacingCopy(input || {}));
    } catch (error) {
      return sanitizeFlightWorkflowRcUserFacingCopyFinalization({
        status:"failed_safe",
        forbiddenCopyFindings:["failed_safe"],
        userFacingSummary:{ title:"只读 RC 用户可见文案定稿", resultLabel:"文案已阻断", caveat:CAVEAT, redacted:true }
      });
    }
  }
  function buildFlightWorkflowRcUserFacingCopyRows(input) {
    return clone(buildFlightWorkflowRcUserFacingCopyFinalization(input || {}).copyRows || []);
  }
  function buildFlightWorkflowRcUserFacingCopyFinalizationAuditDraft(input) {
    const finalization = buildFlightWorkflowRcUserFacingCopyFinalization(input || {});
    return clone({
      eventType:"FLIGHT_WORKFLOW_RC_USER_FACING_COPY_FINALIZATION_AUDIT_DRAFT",
      finalizationName:FINALIZATION_NAME,
      appVersion:FLIGHT_WORKFLOW_RC_USER_FACING_COPY_FINALIZATION_VERSION,
      status:finalization.status,
      findingCount:finalization.forbiddenCopyFindings.length,
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

  window.WeishanFlightWorkflowRcUserFacingCopyFinalization = {
    FLIGHT_WORKFLOW_RC_USER_FACING_COPY_FINALIZATION_VERSION,
    FINALIZATION_NAME,
    buildFlightWorkflowRcUserFacingCopyFinalization,
    evaluateFlightWorkflowRcUserFacingCopy,
    buildFlightWorkflowRcUserFacingCopyRows,
    buildFlightWorkflowRcUserFacingCopyFinalizationAuditDraft,
    sanitizeFlightWorkflowRcUserFacingCopyFinalization
  };
})();
