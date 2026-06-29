;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PLATFORM_REALITY_CHECK_BOARD_VERSION = "2.2.8";
  const BOARD_NAME = "global_shopping_platform_reality_check_board_v1";

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
  function item(itemId, label, summary, status) {
    return {
      itemId:text(itemId),
      label:text(label),
      summary:text(summary),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
  }
  function buildGlobalShoppingPlatformRealityCheckItems(input) {
    const safe = obj(input);
    const platformPreflightSafetyGateSummary = resolveSummary(safe, "platformPreflightSafetyGateSummary", "WeishanGlobalShoppingPlatformPreflightSafetyGate", "buildGlobalShoppingPlatformPreflightSafetyGate", safe);
    const userActionBoundaryReceiptSummary = resolveSummary(safe, "userActionBoundaryReceiptSummary", "WeishanGlobalShoppingUserActionBoundaryReceipt", "buildGlobalShoppingUserActionBoundaryReceipt", safe);
    const readOnlyPlatformHandoffSimulatorSummary = resolveSummary(safe, "readOnlyPlatformHandoffSimulatorSummary", "WeishanGlobalShoppingReadOnlyPlatformHandoffSimulator", "buildGlobalShoppingReadOnlyPlatformHandoffSimulator", safe);
    return clone([
      item("preflight", "平台跳转前安全预检", obj(obj(platformPreflightSafetyGateSummary).userFacingSummary).resultLabel || "安全预检仍需复核", statusOf(platformPreflightSafetyGateSummary) === "clear" ? "pass" : (statusOf(platformPreflightSafetyGateSummary) === "blocked" ? "blocked" : "warning")),
      item("boundary", "用户行动边界回执", obj(obj(userActionBoundaryReceiptSummary).userFacingSummary).resultLabel || "边界回执仍需复核", statusOf(userActionBoundaryReceiptSummary) === "ready" ? "pass" : (statusOf(userActionBoundaryReceiptSummary) === "blocked" ? "blocked" : "warning")),
      item("simulator", "只读平台交接模拟器", obj(obj(readOnlyPlatformHandoffSimulatorSummary).userFacingSummary).resultLabel || "交接模拟仍需复核", statusOf(readOnlyPlatformHandoffSimulatorSummary) === "ready" ? "pass" : (statusOf(readOnlyPlatformHandoffSimulatorSummary) === "blocked" ? "blocked" : "warning")),
      item("truth", "最终页面依据", "平台页面才是最终依据", "pass"),
      item("non_transactional", "非交易承诺", "手动复核不代表下单能力", "pass")
    ]);
  }
  function sanitizeGlobalShoppingPlatformRealityCheckBoard(input) {
    const safe = obj(input);
    const platformPreflightSafetyGateSummary = resolveSummary(safe, "platformPreflightSafetyGateSummary", "WeishanGlobalShoppingPlatformPreflightSafetyGate", "buildGlobalShoppingPlatformPreflightSafetyGate", safe);
    const userActionBoundaryReceiptSummary = resolveSummary(safe, "userActionBoundaryReceiptSummary", "WeishanGlobalShoppingUserActionBoundaryReceipt", "buildGlobalShoppingUserActionBoundaryReceipt", safe);
    const readOnlyPlatformHandoffSimulatorSummary = resolveSummary(safe, "readOnlyPlatformHandoffSimulatorSummary", "WeishanGlobalShoppingReadOnlyPlatformHandoffSimulator", "buildGlobalShoppingReadOnlyPlatformHandoffSimulator", safe);
    const blocked = statusOf(platformPreflightSafetyGateSummary) === "blocked" ||
      statusOf(userActionBoundaryReceiptSummary) === "blocked" ||
      statusOf(readOnlyPlatformHandoffSimulatorSummary) === "blocked" ||
      safe.networkEnabled === true || safe.realEndpointDetected === true || safe.hasRealApiKey === true ||
      safe.rawResponseStored === true || safe.openExternal === true || safe.windowOpen === true ||
      safe.export === true || safe.download === true || safe.payment === true || safe.order === true || safe.ticketing === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl;
    const missing = !Object.keys(platformPreflightSafetyGateSummary).length ||
      !Object.keys(userActionBoundaryReceiptSummary).length ||
      !Object.keys(readOnlyPlatformHandoffSimulatorSummary).length;
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status))
      ? text(safe.status)
      : (blocked ? "blocked" : (missing || statusOf(platformPreflightSafetyGateSummary) !== "clear" || statusOf(userActionBoundaryReceiptSummary) !== "ready" || statusOf(readOnlyPlatformHandoffSimulatorSummary) !== "ready" ? "needs_review" : "ready"));
    return clone({
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_PLATFORM_REALITY_CHECK_BOARD_VERSION,
      status:status,
      title:"平台真实页面复核清单",
      platformPreflightSafetyGateSummary:clone(platformPreflightSafetyGateSummary),
      userActionBoundaryReceiptSummary:clone(userActionBoundaryReceiptSummary),
      readOnlyPlatformHandoffSimulatorSummary:clone(readOnlyPlatformHandoffSimulatorSummary),
      checklistItems:toArray(safe.checklistItems).length ? toArray(safe.checklistItems) : buildGlobalShoppingPlatformRealityCheckItems(safe),
      userFacingSummary:{
        title:"平台真实页面复核清单",
        resultLabel:status === "ready" ? "平台真实页面复核清单已准备" : (status === "blocked" ? "平台真实页面复核清单已阻断" : "平台真实页面复核清单仍需复核"),
        caveat:"该清单只提醒用户在平台真实页面完成最终核对，不打开外部平台，不保存平台帐号、身份、支付信息或真实页面响应。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingPlatformRealityCheckBoard(input) {
    try {
      return sanitizeGlobalShoppingPlatformRealityCheckBoard(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingPlatformRealityCheckBoard({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingPlatformRealityCheckBoardAuditDraft(input) {
    const board = buildGlobalShoppingPlatformRealityCheckBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PLATFORM_REALITY_CHECK_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_PLATFORM_REALITY_CHECK_BOARD_VERSION,
      status:board.status,
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

  window.WeishanGlobalShoppingPlatformRealityCheckBoard = {
    GLOBAL_SHOPPING_PLATFORM_REALITY_CHECK_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingPlatformRealityCheckBoard,
    buildGlobalShoppingPlatformRealityCheckItems,
    buildGlobalShoppingPlatformRealityCheckBoardAuditDraft,
    sanitizeGlobalShoppingPlatformRealityCheckBoard
  };
})();
