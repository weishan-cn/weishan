;(function () {
  "use strict";

  const GLOBAL_SHOPPING_EXTERNAL_PLATFORM_BOUNDARY_BRIEF_VERSION = "4.2.1";
  const BRIEF_NAME = "global_shopping_external_platform_boundary_brief_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawResponse|rawUserText|platformAccount|platformPassword|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function statement(statementId, label, status, message, caveat) {
    return {
      statementId:text(statementId),
      label:text(label),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      statement:text(message),
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

  function buildGlobalShoppingExternalPlatformBoundarySections(input) {
    const safe = obj(input);
    return clone([
      statement("weishan_not_platform", "Weishan 与平台关系", safe.statesWeishanIsNotPlatform === false ? "warning" : "pass", "Weishan 不代表外部平台。", "该说明不代表平台授权、合作或背书。"),
      statement("platform_final_authority", "平台最终依据", safe.statesPlatformFinalAuthority === false ? "warning" : "pass", "平台页面为最终依据。", "价格、库存、条款和最终订单都以平台页面为准。"),
      statement("no_price_guarantee", "价格边界", safe.statesNoPriceGuarantee === false ? "warning" : "pass", "Weishan 不保证外部平台价格。", "候选价不能视为最终价或最低价保证。"),
      statement("no_availability_guarantee", "库存边界", safe.statesNoAvailabilityGuarantee === false ? "warning" : "pass", "Weishan 不保证库存、余票或房态。", "库存和可订状态只由平台实时页面决定。"),
      statement("no_booking_payment_ticketing", "交易边界", safe.statesNoBookingPaymentTicketing === false ? "warning" : "pass", "Weishan 不代替平台完成登录、身份验证、付款、下单或出票。", "任何交易动作都只能由用户在平台自行完成。"),
      statement("user_manual_decision", "用户决策边界", safe.statesUserManualDecision === false ? "warning" : "pass", "用户必须自行判断是否继续。", "离开 Weishan 后由用户自行完成最终判断。")
    ]);
  }

  function buildGlobalShoppingExternalPlatformBoundaryRows(input) {
    const safe = obj(input);
    return buildGlobalShoppingExternalPlatformBoundarySections(safe).map(function (item) {
      return {
        rowId:item.statementId,
        label:item.label,
        value:item.statement,
        status:item.status,
        redacted:true
      };
    });
  }

  function evaluateGlobalShoppingExternalPlatformBoundaryBrief(input) {
    const safe = obj(input);
    const partnershipClaim = safe.partnershipClaim === true || /合作平台/i.test(text(safe.claims));
    const endorsementClaim = safe.officialEndorsementClaim === true || /官方背书/i.test(text(safe.claims));
    const authorizationClaim = safe.authorizationClaim === true || /平台授权/i.test(text(safe.claims));
    const guaranteeClaim = safe.priceGuaranteeClaim === true || safe.availabilityGuaranteeClaim === true || safe.bookabilityGuaranteeClaim === true;
    const blocked = partnershipClaim || endorsementClaim || authorizationClaim || guaranteeClaim ||
      safe.openExternal === true || safe.windowOpen === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ||
      safe.payment === true || safe.order === true || safe.ticketing === true;
    const health = {
      statesWeishanIsNotPlatform:safe.statesWeishanIsNotPlatform !== false,
      statesPlatformFinalAuthority:safe.statesPlatformFinalAuthority !== false,
      statesNoPriceGuarantee:safe.statesNoPriceGuarantee !== false,
      statesNoAvailabilityGuarantee:safe.statesNoAvailabilityGuarantee !== false,
      statesNoBookingPaymentTicketing:safe.statesNoBookingPaymentTicketing !== false,
      statesUserManualDecision:safe.statesUserManualDecision !== false,
      avoidsPartnershipClaim:!partnershipClaim,
      avoidsOfficialEndorsementClaim:!endorsementClaim,
      avoidsAuthorizationClaim:!authorizationClaim,
      noRealUrl:!(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl),
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true,
      noCheckoutPaymentTicketingOrder:safe.payment !== true && safe.order !== true && safe.ticketing !== true
    };
    const needsReview = !health.statesWeishanIsNotPlatform || !health.statesPlatformFinalAuthority ||
      !health.statesNoPriceGuarantee || !health.statesNoAvailabilityGuarantee ||
      !health.statesNoBookingPaymentTicketing || !health.statesUserManualDecision;
    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      boundaryMode:text(safe.boundaryMode || "display_only") || "display_only",
      boundaryHealth:health,
      blockedReasons:blocked ? [
        partnershipClaim ? "partnership_claim_detected" : "",
        endorsementClaim ? "official_endorsement_claim_detected" : "",
        authorizationClaim ? "authorization_claim_detected" : "",
        guaranteeClaim ? "guarantee_claim_detected" : "",
        safe.openExternal === true || safe.windowOpen === true ? "external_open_detected" : "",
        safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ? "real_url_detected" : "",
        safe.payment === true || safe.order === true || safe.ticketing === true ? "transaction_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function sanitizeGlobalShoppingExternalPlatformBoundaryBrief(brief) {
    const safe = obj(brief);
    const evaluation = evaluateGlobalShoppingExternalPlatformBoundaryBrief(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      briefName:BRIEF_NAME,
      appVersion:GLOBAL_SHOPPING_EXTERNAL_PLATFORM_BOUNDARY_BRIEF_VERSION,
      status:status,
      boundaryMode:/^(disabled|display_only|review_only|sandbox_ready)$/.test(evaluation.boundaryMode) ? evaluation.boundaryMode : "display_only",
      boundaryStatements:toArray(safe.boundaryStatements).length ? toArray(safe.boundaryStatements) : buildGlobalShoppingExternalPlatformBoundarySections(Object.assign({}, safe, evaluation.boundaryHealth)),
      boundaryHealth:clone(evaluation.boundaryHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingExternalPlatformBoundaryRows(Object.assign({}, safe, evaluation.boundaryHealth)),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"外部平台边界说明",
        resultLabel:status === "ready" ? "平台边界说明已准备" : (status === "blocked" ? "平台边界说明已阻断" : "平台边界说明仍需复核"),
        caveat:"该说明只用于解释 Weishan 与外部平台的边界，不代表平台授权、合作、背书、价格保证或下单能力。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingExternalPlatformBoundaryBrief(input) {
    try {
      return sanitizeGlobalShoppingExternalPlatformBoundaryBrief(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingExternalPlatformBoundaryBrief({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingExternalPlatformBoundaryBriefAuditDraft(input) {
    const brief = buildGlobalShoppingExternalPlatformBoundaryBrief(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_EXTERNAL_PLATFORM_BOUNDARY_BRIEF_AUDIT_DRAFT",
      briefName:BRIEF_NAME,
      appVersion:GLOBAL_SHOPPING_EXTERNAL_PLATFORM_BOUNDARY_BRIEF_VERSION,
      status:brief.status,
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

  window.WeishanGlobalShoppingExternalPlatformBoundaryBrief = {
    GLOBAL_SHOPPING_EXTERNAL_PLATFORM_BOUNDARY_BRIEF_VERSION,
    BRIEF_NAME,
    buildGlobalShoppingExternalPlatformBoundaryBrief,
    evaluateGlobalShoppingExternalPlatformBoundaryBrief,
    buildGlobalShoppingExternalPlatformBoundaryRows,
    buildGlobalShoppingExternalPlatformBoundarySections,
    buildGlobalShoppingExternalPlatformBoundaryBriefAuditDraft,
    sanitizeGlobalShoppingExternalPlatformBoundaryBrief
  };
})();
