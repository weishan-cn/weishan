;(function () {
  "use strict";

  const GLOBAL_SHOPPING_READ_ONLY_HANDOFF_READINESS_DRILL_VERSION = "3.6.0";
  const DRILL_NAME = "global_shopping_read_only_handoff_readiness_drill_v1";
  const ALLOWED = ["origin", "destination", "date", "passengerCount", "cabinClass", "hotelCheckIn", "hotelCheckOut", "roomCount", "guestCount", "productBrand", "productModel", "quantity", "currency", "locale", "region"];
  const BLOCKED = ["realName", "phone", "email", "passport", "idCard", "bankCard", "platformPassword", "paymentCredential"];

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function allowedMode(value) {
    const mode = text(value || "disabled");
    return /^(disabled|parameter_preview|dry_run|sandbox_ready)$/.test(mode) ? mode : "disabled";
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
      sensitiveStored:false,
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
  function buildGlobalShoppingReadOnlyHandoffParameterPreview(input) {
    const safe = obj(input);
    const source = obj(safe.parameterSource || safe.searchParameters || safe);
    const allowedParameters = ALLOWED.filter(function (key) { return source[key] != null && source[key] !== ""; });
    const blockedParameters = BLOCKED.filter(function (key) { return source[key] != null && source[key] !== ""; });
    const missingParameters = ["origin", "destination", "date"].filter(function (key) { return source[key] == null || source[key] === ""; });
    return clone({
      allowedParameters:allowedParameters,
      blockedParameters:blockedParameters,
      missingParameters:missingParameters,
      readinessLabel:blockedParameters.length ? "blocked" : (allowedParameters.length ? (missingParameters.length ? "needs_review" : "ready") : "needs_review"),
      caveat:"当前仅预览非敏感搜索参数准备度，不生成真实链接，不打开平台，不填写身份或支付信息。"
    });
  }
  function buildGlobalShoppingReadOnlyHandoffReadinessRows(input) {
    const preview = buildGlobalShoppingReadOnlyHandoffParameterPreview(input);
    return clone([
      { rowId:"allowed_parameters", label:"允许参数", value:text(preview.allowedParameters.join(", ") || "无"), status:preview.allowedParameters.length ? "pass" : "warning", redacted:true },
      { rowId:"blocked_parameters", label:"阻断参数", value:text(preview.blockedParameters.join(", ") || "无"), status:preview.blockedParameters.length ? "blocked" : "pass", redacted:true },
      { rowId:"missing_parameters", label:"缺失参数", value:text(preview.missingParameters.join(", ") || "无"), status:preview.missingParameters.length ? "warning" : "pass", redacted:true }
    ]);
  }
  function evaluateGlobalShoppingReadOnlyHandoffReadiness(input) {
    const safe = obj(input);
    const preview = buildGlobalShoppingReadOnlyHandoffParameterPreview(safe);
    const blockedReasons = [];
    if (typeof safe.bookingUrl === "string" || typeof safe.checkoutUrl === "string" || typeof safe.paymentUrl === "string" || typeof safe.orderUrl === "string") blockedReasons.push("real_url_detected");
    if (safe.openExternal === true || safe.windowOpen === true || safe.autoOpen === true) blockedReasons.push("external_open_detected");
    if (safe.download === true || safe.export === true || safe.canDownload === true || safe.canExport === true) blockedReasons.push("download_export_detected");
    if (preview.blockedParameters.length) blockedReasons.push("sensitive_parameter_detected");
    if (safe.checkout === true || safe.payment === true || safe.order === true || safe.ticketing === true) blockedReasons.push("transaction_capability_detected");
    const handoffHealth = {
      hasComparisonWorkbench:Object.keys(obj(safe.sandboxCandidateComparisonWorkbench)).length > 0,
      hasRecommendedCandidate:!!text(obj(obj(safe.sandboxCandidateComparisonWorkbench).recommendationSummary).recommendedCandidateId),
      hasEvidenceMatrix:Object.keys(obj(safe.providerEvidenceComparisonMatrix)).length > 0,
      hasAllowedParameters:preview.allowedParameters.length > 0,
      noRealUrl:typeof safe.bookingUrl !== "string" && typeof safe.checkoutUrl !== "string" && typeof safe.paymentUrl !== "string" && typeof safe.orderUrl !== "string",
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true && safe.autoOpen !== true,
      noDownloadExport:safe.download !== true && safe.export !== true && safe.canDownload !== true && safe.canExport !== true,
      noIdentityCarry:preview.blockedParameters.indexOf("realName") === -1 && preview.blockedParameters.indexOf("phone") === -1 && preview.blockedParameters.indexOf("email") === -1 && preview.blockedParameters.indexOf("passport") === -1 && preview.blockedParameters.indexOf("idCard") === -1 && preview.blockedParameters.indexOf("bankCard") === -1,
      noPlatformCredentialCarry:preview.blockedParameters.indexOf("platformPassword") === -1,
      noPaymentCredentialCarry:preview.blockedParameters.indexOf("paymentCredential") === -1,
      noCheckoutPaymentTicketing:safe.checkout !== true && safe.payment !== true && safe.order !== true && safe.ticketing !== true
    };
    const needsReview = !handoffHealth.hasComparisonWorkbench || !handoffHealth.hasRecommendedCandidate || !handoffHealth.hasEvidenceMatrix || !handoffHealth.hasAllowedParameters;
    return clone({
      drillName:DRILL_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_HANDOFF_READINESS_DRILL_VERSION,
      status:blockedReasons.length ? "blocked" : (needsReview ? "needs_review" : "ready"),
      handoffBoundary:{
        drillId:text(safe.drillId || "handoff_readiness_v2_2_2"),
        drillMode:allowedMode(safe.drillMode || "parameter_preview"),
        readOnly:true,
        parameterPreviewOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canGenerateRealUrl:false,
        canOpenExternalNow:false,
        canDownload:false,
        canExport:false,
        canPersistSensitiveParams:false,
        canCarryIdentity:false,
        canCarryPlatformCredential:false,
        canCarryPaymentCredential:false,
        canCheckout:false,
        canPay:false,
        canTicket:false
      },
      parameterPreview:preview,
      handoffHealth:handoffHealth,
      blockedReasons:blockedReasons,
      redacted:true
    });
  }
  function sanitizeGlobalShoppingReadOnlyHandoffReadinessDrill(drill) {
    const safe = obj(drill);
    const evaluated = evaluateGlobalShoppingReadOnlyHandoffReadiness(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluated.status;
    return clone({
      drillName:DRILL_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_HANDOFF_READINESS_DRILL_VERSION,
      status:status,
      handoffBoundary:clone(evaluated.handoffBoundary),
      parameterPreview:clone(evaluated.parameterPreview),
      handoffHealth:clone(evaluated.handoffHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingReadOnlyHandoffReadinessRows(safe),
      blockedReasons:clone(evaluated.blockedReasons),
      userFacingSummary:{
        title:"只读跳转交接演练",
        resultLabel:status === "ready" ? "交接演练已准备" : (status === "needs_review" ? "交接演练仍需复核" : "交接演练已阻断"),
        caveat:"当前只演练非敏感搜索参数准备度，不生成真实链接，不打开平台，不填写身份、账号、证件、银行卡或支付信息。"
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingReadOnlyHandoffReadinessDrill(input) {
    try {
      return sanitizeGlobalShoppingReadOnlyHandoffReadinessDrill(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingReadOnlyHandoffReadinessDrill({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingReadOnlyHandoffReadinessDrillAuditDraft(input) {
    const drill = buildGlobalShoppingReadOnlyHandoffReadinessDrill(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_READ_ONLY_HANDOFF_READINESS_DRILL_AUDIT_DRAFT",
      drillName:DRILL_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_HANDOFF_READINESS_DRILL_VERSION,
      status:drill.status,
      blockedReasons:drill.blockedReasons,
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
      sensitiveStored:false,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingReadOnlyHandoffReadinessDrill = {
    GLOBAL_SHOPPING_READ_ONLY_HANDOFF_READINESS_DRILL_VERSION,
    DRILL_NAME,
    buildGlobalShoppingReadOnlyHandoffReadinessDrill,
    evaluateGlobalShoppingReadOnlyHandoffReadiness,
    buildGlobalShoppingReadOnlyHandoffReadinessRows,
    buildGlobalShoppingReadOnlyHandoffParameterPreview,
    buildGlobalShoppingReadOnlyHandoffReadinessDrillAuditDraft,
    sanitizeGlobalShoppingReadOnlyHandoffReadinessDrill
  };
})();
