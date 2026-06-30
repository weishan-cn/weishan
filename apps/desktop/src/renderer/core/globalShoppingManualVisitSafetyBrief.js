;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MANUAL_VISIT_SAFETY_BRIEF_VERSION = "2.4.0";
  const BRIEF_NAME = "global_shopping_manual_visit_safety_brief_v1";

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
      confirmationStored:false,
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

  function evaluateGlobalShoppingManualVisitSafetyBrief(input) {
    const safe = obj(input);
    const blocked =
      safe.openExternal === true || safe.windowOpen === true || safe.autoOpen === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ||
      safe.persistConfirmation === true || safe.signatureCapture === true || safe.confirmationUpload === true ||
      safe.download === true || safe.export === true || safe.fileWrite === true ||
      safe.payment === true || safe.order === true || safe.ticketing === true ||
      safe.hasForbiddenClaim === true;
    const health = {
      statesNoPlatformOpen:safe.statesNoPlatformOpen !== false,
      statesNoGeneratedLink:safe.statesNoGeneratedLink !== false,
      statesNoConfirmationPersistence:safe.statesNoConfirmationPersistence !== false,
      statesNoSensitiveDataEntry:safe.statesNoSensitiveDataEntry !== false,
      statesPlatformFinalAuthority:safe.statesPlatformFinalAuthority !== false,
      statesUserOwnsFinalDecision:safe.statesUserOwnsFinalDecision !== false,
      noRealUrl:!(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl),
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true && safe.autoOpen !== true,
      noConfirmationPersistence:safe.persistConfirmation !== true && safe.signatureCapture !== true && safe.confirmationUpload !== true,
      noExportDownloadWrite:safe.download !== true && safe.export !== true && safe.fileWrite !== true,
      noTransaction:safe.payment !== true && safe.order !== true && safe.ticketing !== true,
      noForbiddenClaims:safe.hasForbiddenClaim !== true
    };
    const needsReview = !health.statesNoPlatformOpen || !health.statesNoGeneratedLink || !health.statesNoConfirmationPersistence || !health.statesNoSensitiveDataEntry || !health.statesPlatformFinalAuthority || !health.statesUserOwnsFinalDecision;
    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      briefHealth:health,
      blockedReasons:blocked ? [
        safe.openExternal === true || safe.windowOpen === true || safe.autoOpen === true ? "external_open_detected" : "",
        safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ? "real_url_detected" : "",
        safe.persistConfirmation === true || safe.signatureCapture === true || safe.confirmationUpload === true ? "confirmation_persistence_detected" : "",
        safe.download === true || safe.export === true || safe.fileWrite === true ? "export_download_write_detected" : "",
        safe.payment === true || safe.order === true || safe.ticketing === true ? "transaction_detected" : "",
        safe.hasForbiddenClaim === true ? "forbidden_claim_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingManualVisitSafetyBriefStatements(input) {
    const safe = obj(input);
    const evaluation = evaluateGlobalShoppingManualVisitSafetyBrief(safe);
    return clone([
      statement("final_scope", "当前说明范围", evaluation.briefHealth.statesNoPlatformOpen ? "pass" : "warning", "当前只展示离开 Weishan 前的最终说明。", "该说明不打开平台，不生成链接。"),
      statement("no_confirmation_save", "确认保存边界", evaluation.briefHealth.statesNoConfirmationPersistence ? "pass" : "warning", "安全简报不保存确认。", "不保存确认、签名或最终选择。"),
      statement("no_sensitive_entry", "敏感信息边界", evaluation.briefHealth.statesNoSensitiveDataEntry ? "pass" : "warning", "不要在 Weishan 输入身份证、护照、银行卡、平台账号或平台密码。", "敏感信息只能由用户在平台自行处理。"),
      statement("platform_final_authority", "平台最终依据", evaluation.briefHealth.statesPlatformFinalAuthority ? "pass" : "warning", "平台页面为最终依据。", "价格、库存、税费、退改和最终订单都以平台页面为准。"),
      statement("user_final_decision", "用户最终判断", evaluation.briefHealth.statesUserOwnsFinalDecision ? "pass" : "warning", "离开 Weishan 后由用户自行判断是否继续。", "Weishan 不代替用户登录、付款、下单或出票。")
    ]);
  }

  function buildGlobalShoppingManualVisitSafetyBriefRows(input) {
    return buildGlobalShoppingManualVisitSafetyBriefStatements(input).map(function (item) {
      return { rowId:item.statementId, label:item.label, value:item.statement, status:item.status, redacted:true };
    });
  }

  function sanitizeGlobalShoppingManualVisitSafetyBrief(brief) {
    const safe = obj(brief);
    const evaluation = evaluateGlobalShoppingManualVisitSafetyBrief(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      briefName:BRIEF_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_VISIT_SAFETY_BRIEF_VERSION,
      status:status,
      briefStatements:toArray(safe.briefStatements).length ? toArray(safe.briefStatements) : buildGlobalShoppingManualVisitSafetyBriefStatements(safe),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingManualVisitSafetyBriefRows(safe),
      briefHealth:clone(evaluation.briefHealth),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"手动访问安全简报",
        resultLabel:status === "ready" ? "手动访问安全简报已准备" : (status === "blocked" ? "手动访问安全简报已阻断" : "手动访问安全简报仍需复核"),
        caveat:"当前只展示离开 Weishan 前的最终说明，不打开平台，不生成链接，不保存确认，不构成订单、付款授权或签名。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingManualVisitSafetyBrief(input) {
    try {
      return sanitizeGlobalShoppingManualVisitSafetyBrief(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingManualVisitSafetyBrief({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingManualVisitSafetyBriefAuditDraft(input) {
    const brief = buildGlobalShoppingManualVisitSafetyBrief(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_MANUAL_VISIT_SAFETY_BRIEF_AUDIT_DRAFT",
      briefName:BRIEF_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_VISIT_SAFETY_BRIEF_VERSION,
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

  window.WeishanGlobalShoppingManualVisitSafetyBrief = {
    GLOBAL_SHOPPING_MANUAL_VISIT_SAFETY_BRIEF_VERSION,
    BRIEF_NAME,
    buildGlobalShoppingManualVisitSafetyBrief,
    evaluateGlobalShoppingManualVisitSafetyBrief,
    buildGlobalShoppingManualVisitSafetyBriefStatements,
    buildGlobalShoppingManualVisitSafetyBriefRows,
    buildGlobalShoppingManualVisitSafetyBriefAuditDraft,
    sanitizeGlobalShoppingManualVisitSafetyBrief
  };
})();
