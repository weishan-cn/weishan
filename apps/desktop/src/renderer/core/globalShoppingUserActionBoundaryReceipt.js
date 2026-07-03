;(function () {
  "use strict";

  const GLOBAL_SHOPPING_USER_ACTION_BOUNDARY_RECEIPT_VERSION = "4.0.8";
  const RECEIPT_NAME = "global_shopping_user_action_boundary_receipt_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawResponse|rawUserText|platformAccount|platformPassword|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
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
  function buildGlobalShoppingUserActionBoundaryReceiptSections() {
    return clone([
      {
        sectionId:"weishan_boundary",
        title:"Weishan 边界",
        status:"pass",
        statement:"Weishan 已提供只读候选、证据摘要和非敏感搜索参数准备。",
        caveat:"Weishan 不能替用户登录、填写身份、付款、下单或出票。",
        redacted:true
      },
      {
        sectionId:"user_only_actions",
        title:"用户自行完成",
        status:"pass",
        statement:"用户必须自行在平台确认实时价格、库存、规则、身份、账号、支付与订单。",
        caveat:"所有最终动作都由用户本人在平台页面完成。",
        redacted:true
      },
      {
        sectionId:"platform_final_authority",
        title:"平台最终依据",
        status:"pass",
        statement:"平台实时页面才是最终价格、库存、规则和订单信息来源。",
        caveat:"候选结果不代表全网最低、最低价保证、锁价、可订或可出票。",
        redacted:true
      },
      {
        sectionId:"receipt_boundary",
        title:"回执性质",
        status:"pass",
        statement:"该回执只是边界说明，不是合同、订单、付款授权或用户签名。",
        caveat:"回执不保存用户确认结果，也不会提交到任何平台。",
        redacted:true
      }
    ]);
  }
  function buildGlobalShoppingUserActionBoundaryReceiptRows(input) {
    const sections = toArray(obj(input).receiptSections).length ? toArray(obj(input).receiptSections) : buildGlobalShoppingUserActionBoundaryReceiptSections();
    return clone(sections.map(function (section) {
      return {
        rowId:text(section.sectionId),
        label:text(section.title),
        value:text(section.statement),
        status:section.status === "blocked" ? "blocked" : (section.status === "warning" ? "warning" : "pass"),
        redacted:true
      };
    }));
  }
  function buildGlobalShoppingUserActionBoundaryReceiptSectionsForSanitize(input) {
    return toArray(obj(input).receiptSections).length ? toArray(obj(input).receiptSections) : buildGlobalShoppingUserActionBoundaryReceiptSections();
  }
  function evaluateGlobalShoppingUserActionBoundaryReceipt(input) {
    const safe = obj(input);
    const receiptSections = buildGlobalShoppingUserActionBoundaryReceiptSectionsForSanitize(safe);
    const blockedReasons = [];
    if (safe.fileWrite === true || safe.persistReceipt === true || safe.canPersistReceipt === true) blockedReasons.push("receipt_persistence_detected");
    if (safe.submitReceipt === true || safe.canSubmitReceipt === true) blockedReasons.push("receipt_submission_detected");
    if (safe.export === true || safe.canExportReceipt === true || safe.download === true || safe.canDownloadReceipt === true) blockedReasons.push("receipt_export_download_detected");
    if (safe.bindUser === true || safe.canBindUser === true) blockedReasons.push("user_binding_detected");
    if (safe.captureSignature === true || safe.canCaptureSignature === true || safe.signatureRequired === true) blockedReasons.push("signature_detected");
    if (safe.authorizePayment === true || safe.canAuthorizePayment === true || safe.paymentAuthorized === true) blockedReasons.push("payment_authorization_detected");
    if (safe.createOrder === true || safe.canCreateOrder === true || safe.order === true) blockedReasons.push("order_creation_detected");
    if (safe.openExternal === true || safe.windowOpen === true || safe.autoOpen === true || safe.canOpenExternalNow === true) blockedReasons.push("external_open_detected");
    if (safe.claimsLowestPrice === true || safe.claimsBestPrice === true || safe.claimsLockedPrice === true || safe.claimsAvailability === true || safe.claimsBookability === true || safe.claimsOfficialEndorsement === true) blockedReasons.push("forbidden_claim_detected");
    const receiptHealth = {
      hasWeishanBoundary:receiptSections.some(function (item) { return item.sectionId === "weishan_boundary"; }),
      hasUserOnlyActions:receiptSections.some(function (item) { return item.sectionId === "user_only_actions"; }),
      hasPlatformFinalAuthority:receiptSections.some(function (item) { return item.sectionId === "platform_final_authority"; }),
      hasNoPaymentAuthorization:receiptSections.some(function (item) { return item.sectionId === "receipt_boundary"; }),
      hasNoOrderCreation:receiptSections.some(function (item) { return item.sectionId === "receipt_boundary"; }),
      hasNoSignatureOrContract:receiptSections.some(function (item) { return item.sectionId === "receipt_boundary"; }),
      noPersistence:safe.fileWrite !== true && safe.persistReceipt !== true && safe.canPersistReceipt !== true,
      noSubmission:safe.submitReceipt !== true && safe.canSubmitReceipt !== true,
      noExportDownload:safe.export !== true && safe.canExportReceipt !== true && safe.download !== true && safe.canDownloadReceipt !== true,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true && safe.autoOpen !== true && safe.canOpenExternalNow !== true,
      noForbiddenClaims:safe.claimsLowestPrice !== true && safe.claimsBestPrice !== true && safe.claimsLockedPrice !== true && safe.claimsAvailability !== true && safe.claimsBookability !== true && safe.claimsOfficialEndorsement !== true
    };
    const needsReview = !receiptHealth.hasWeishanBoundary || !receiptHealth.hasUserOnlyActions || !receiptHealth.hasPlatformFinalAuthority || !receiptHealth.hasNoPaymentAuthorization || !receiptHealth.hasNoOrderCreation || !receiptHealth.hasNoSignatureOrContract;
    const ready = !blockedReasons.length && !needsReview;
    return clone({
      receiptName:RECEIPT_NAME,
      appVersion:GLOBAL_SHOPPING_USER_ACTION_BOUNDARY_RECEIPT_VERSION,
      status:blockedReasons.length ? "blocked" : (ready ? "ready" : "needs_review"),
      receiptBoundary:{
        receiptId:text(safe.receiptId || "user_action_boundary_receipt_v2_2_4"),
        receiptMode:mode(safe.receiptMode || "display_only"),
        displayOnly:true,
        readOnly:true,
        sandboxOnly:true,
        redactedOnly:true,
        productionDisabled:true,
        canPersistReceipt:false,
        canSubmitReceipt:false,
        canExportReceipt:false,
        canDownloadReceipt:false,
        canBindUser:false,
        canCaptureSignature:false,
        canAuthorizePayment:false,
        canCreateOrder:false,
        canOpenExternalNow:false
      },
      receiptSections:receiptSections,
      receiptHealth:receiptHealth,
      rows:buildGlobalShoppingUserActionBoundaryReceiptRows({ receiptSections:receiptSections }),
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"用户行动边界回执",
        resultLabel:blockedReasons.length ? "边界回执已阻断" : (ready ? "边界回执已准备" : "边界回执仍需复核"),
        caveat:"该回执只用于说明行动边界，不是合同、订单、付款授权、用户签名或平台确认。"
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function sanitizeGlobalShoppingUserActionBoundaryReceipt(receipt) {
    const safe = obj(receipt);
    const evaluated = evaluateGlobalShoppingUserActionBoundaryReceipt(safe);
    return clone({
      receiptName:RECEIPT_NAME,
      appVersion:GLOBAL_SHOPPING_USER_ACTION_BOUNDARY_RECEIPT_VERSION,
      status:/^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluated.status,
      receiptBoundary:clone(evaluated.receiptBoundary),
      receiptSections:toArray(safe.receiptSections).length ? toArray(safe.receiptSections) : clone(evaluated.receiptSections),
      receiptHealth:clone(evaluated.receiptHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : clone(evaluated.rows),
      blockedReasons:clone(evaluated.blockedReasons),
      userFacingSummary:clone(evaluated.userFacingSummary),
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingUserActionBoundaryReceipt(input) {
    try {
      return sanitizeGlobalShoppingUserActionBoundaryReceipt(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingUserActionBoundaryReceipt({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingUserActionBoundaryReceiptAuditDraft(input) {
    const receipt = buildGlobalShoppingUserActionBoundaryReceipt(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_USER_ACTION_BOUNDARY_RECEIPT_AUDIT_DRAFT",
      receiptName:RECEIPT_NAME,
      appVersion:GLOBAL_SHOPPING_USER_ACTION_BOUNDARY_RECEIPT_VERSION,
      status:receipt.status,
      blockedReasonCount:receipt.blockedReasons.length,
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

  window.WeishanGlobalShoppingUserActionBoundaryReceipt = {
    GLOBAL_SHOPPING_USER_ACTION_BOUNDARY_RECEIPT_VERSION,
    RECEIPT_NAME,
    buildGlobalShoppingUserActionBoundaryReceipt,
    evaluateGlobalShoppingUserActionBoundaryReceipt,
    buildGlobalShoppingUserActionBoundaryReceiptRows,
    buildGlobalShoppingUserActionBoundaryReceiptSections,
    buildGlobalShoppingUserActionBoundaryReceiptAuditDraft,
    sanitizeGlobalShoppingUserActionBoundaryReceipt
  };
})();
