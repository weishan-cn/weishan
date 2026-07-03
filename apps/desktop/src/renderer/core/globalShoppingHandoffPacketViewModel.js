;(function () {
  "use strict";

  const GLOBAL_SHOPPING_HANDOFF_PACKET_VIEW_MODEL_VERSION = "4.1.7";
  const VIEW_MODEL_NAME = "global_shopping_handoff_packet_view_model_v1";

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
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function resolveSummary(input, key, apiName, methodName, buildInput) {
    const safe = obj(input);
    if (Object.keys(obj(safe[key])).length) return obj(safe[key]);
    const summaryApi = window[apiName] || {};
    return typeof summaryApi[methodName] === "function" ? summaryApi[methodName](buildInput || safe) : {};
  }
  function buildGlobalShoppingHandoffPacketCards(input) {
    const safe = obj(input);
    const packet = resolveSummary(safe, "readOnlyHandoffPacketPreviewSummary", "WeishanGlobalShoppingReadOnlyHandoffPacketPreview", "buildGlobalShoppingReadOnlyHandoffPacketPreview", safe);
    const preflight = resolveSummary(safe, "platformPreflightSafetyGateSummary", "WeishanGlobalShoppingPlatformPreflightSafetyGate", "buildGlobalShoppingPlatformPreflightSafetyGate", safe);
    const receipt = resolveSummary(safe, "userActionBoundaryReceiptSummary", "WeishanGlobalShoppingUserActionBoundaryReceipt", "buildGlobalShoppingUserActionBoundaryReceipt", safe);
    return clone([
      { cardId:"handoff_packet", label:"交接包预览", value:text(obj(packet.userFacingSummary).resultLabel || "交接包预览仍需复核"), redacted:true },
      { cardId:"preflight_safety", label:"安全预检", value:text(obj(preflight.userFacingSummary).resultLabel || "安全预检仍需复核"), redacted:true },
      { cardId:"user_boundary", label:"行动边界回执", value:text(obj(receipt.userFacingSummary).resultLabel || "行动边界回执仍需复核"), redacted:true },
      { cardId:"next_step", label:"下一步", value:text(statusOf(packet) === "ready" && statusOf(preflight) === "clear" && statusOf(receipt) === "ready" ? "用户可以在平台自行完成最终确认。" : "先补齐交接包、安全预检和边界回执。"), redacted:true }
    ]);
  }
  function buildGlobalShoppingHandoffPacketRows(input) {
    return clone(toArray(obj(resolveSummary(input, "readOnlyHandoffPacketPreviewSummary", "WeishanGlobalShoppingReadOnlyHandoffPacketPreview", "buildGlobalShoppingReadOnlyHandoffPacketPreview", input)).rows).map(function (item) {
      return { rowId:text(item.rowId), label:text(item.label), value:text(item.value), status:item.status || "warning", redacted:true };
    }));
  }
  function buildGlobalShoppingPreflightSafetyRowsForView(input) {
    return clone(toArray(obj(resolveSummary(input, "platformPreflightSafetyGateSummary", "WeishanGlobalShoppingPlatformPreflightSafetyGate", "buildGlobalShoppingPlatformPreflightSafetyGate", input)).rows).map(function (item) {
      return { rowId:text(item.rowId), label:text(item.label), value:text(item.value), status:item.status || "warning", redacted:true };
    }));
  }
  function buildGlobalShoppingUserActionBoundaryRowsForView(input) {
    return clone(toArray(obj(resolveSummary(input, "userActionBoundaryReceiptSummary", "WeishanGlobalShoppingUserActionBoundaryReceipt", "buildGlobalShoppingUserActionBoundaryReceipt", input)).rows).map(function (item) {
      return { rowId:text(item.rowId), label:text(item.label), value:text(item.value), status:item.status || "warning", redacted:true };
    }));
  }
  function sanitizeGlobalShoppingHandoffPacketViewModel(viewModel) {
    const safe = obj(viewModel);
    const packet = resolveSummary(safe, "readOnlyHandoffPacketPreviewSummary", "WeishanGlobalShoppingReadOnlyHandoffPacketPreview", "buildGlobalShoppingReadOnlyHandoffPacketPreview", safe);
    const preflight = resolveSummary(safe, "platformPreflightSafetyGateSummary", "WeishanGlobalShoppingPlatformPreflightSafetyGate", "buildGlobalShoppingPlatformPreflightSafetyGate", safe);
    const receipt = resolveSummary(safe, "userActionBoundaryReceiptSummary", "WeishanGlobalShoppingUserActionBoundaryReceipt", "buildGlobalShoppingUserActionBoundaryReceipt", safe);
    const blocked = statusOf(packet) === "blocked" || statusOf(preflight) === "blocked" || statusOf(receipt) === "blocked" || safe.networkEnabled === true || safe.realEndpointDetected === true || safe.hasRealApiKey === true || safe.rawResponseStored === true || safe.openExternal === true || safe.windowOpen === true || safe.export === true || safe.download === true || safe.payment === true || safe.order === true || safe.ticketing === true || safe.captureSignature === true || safe.authorizePayment === true || safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl;
    const missing = !Object.keys(packet).length || !Object.keys(preflight).length || !Object.keys(receipt).length;
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status))
      ? text(safe.status)
      : (blocked ? "blocked" : (missing || statusOf(packet) !== "ready" || statusOf(preflight) !== "clear" || statusOf(receipt) !== "ready" ? "needs_review" : "ready"));
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_HANDOFF_PACKET_VIEW_MODEL_VERSION,
      status:status,
      title:"只读交接包与安全预检",
      readOnlyHandoffPacketPreviewSummary:clone(packet),
      platformPreflightSafetyGateSummary:clone(preflight),
      userActionBoundaryReceiptSummary:clone(receipt),
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingHandoffPacketCards(safe),
      packetRows:toArray(safe.packetRows).length ? toArray(safe.packetRows) : buildGlobalShoppingHandoffPacketRows(safe),
      preflightRows:toArray(safe.preflightRows).length ? toArray(safe.preflightRows) : buildGlobalShoppingPreflightSafetyRowsForView(safe),
      boundaryReceiptRows:toArray(safe.boundaryReceiptRows).length ? toArray(safe.boundaryReceiptRows) : buildGlobalShoppingUserActionBoundaryRowsForView(safe),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        { rowId:"packet_preview", label:"交接包", value:"交接包不导出、不下载、不上传", status:"pass", redacted:true },
        { rowId:"preflight_gate", label:"安全预检", value:"安全预检不打开平台", status:"pass", redacted:true },
        { rowId:"boundary_receipt", label:"边界回执", value:"回执不是订单、合同或付款授权", status:"pass", redacted:true },
        { rowId:"user_action", label:"最终确认", value:"用户必须在平台自行完成最终确认", status:"pass", redacted:true }
      ],
      caveat:"当前只展示只读交接包、安全预检和行动边界，不打开平台，不导出文件，不构成订单、付款授权或用户签名。",
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingHandoffPacketViewModel(input) {
    try {
      return sanitizeGlobalShoppingHandoffPacketViewModel(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingHandoffPacketViewModel({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingHandoffPacketViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingHandoffPacketViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_HANDOFF_PACKET_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_HANDOFF_PACKET_VIEW_MODEL_VERSION,
      status:viewModel.status,
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

  window.WeishanGlobalShoppingHandoffPacketViewModel = {
    GLOBAL_SHOPPING_HANDOFF_PACKET_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingHandoffPacketViewModel,
    buildGlobalShoppingHandoffPacketCards,
    buildGlobalShoppingHandoffPacketRows,
    buildGlobalShoppingPreflightSafetyRowsForView,
    buildGlobalShoppingUserActionBoundaryRowsForView,
    buildGlobalShoppingHandoffPacketViewModelAuditDraft,
    sanitizeGlobalShoppingHandoffPacketViewModel
  };
})();
