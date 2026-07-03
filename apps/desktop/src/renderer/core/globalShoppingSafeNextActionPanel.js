;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SAFE_NEXT_ACTION_PANEL_VERSION = "4.1.7";
  const PANEL_NAME = "global_shopping_safe_next_action_panel_v1";

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

  const SAFE_ACTIONS = ["review", "manual_verify", "read_disclosure", "decide_outside_weishan"];
  const FORBIDDEN_LABELS = ["立即购买", "直接下单", "一键下单", "一键出票", "授权付款", "创建订单", "签署", "同意并下单", "打开平台", "下载交接包", "导出交接包"];

  function actionRow(actionId, label, kind) {
    return { actionId:text(actionId), label:text(label), kind:text(kind), redacted:true };
  }

  function evaluateGlobalShoppingSafeNextActionPanel(input) {
    const safe = obj(input);
    const safeActions = toArray(safe.safeActions).length ? toArray(safe.safeActions) : SAFE_ACTIONS.slice();
    const forbiddenActions = toArray(safe.forbiddenActions).length ? toArray(safe.forbiddenActions) : FORBIDDEN_LABELS.slice();
    const hasBadAction = safeActions.some(function (actionId) { return SAFE_ACTIONS.indexOf(text(actionId)) === -1; }) ||
      forbiddenActions.some(function (label) { return SAFE_ACTIONS.indexOf(text(label)) >= 0; });
    return clone({
      status:hasBadAction || safe.openExternal === true || safe.windowOpen === true || safe.download === true || safe.export === true ? "blocked" : "ready",
      safeActions:safeActions,
      forbiddenActions:forbiddenActions,
      blockedReasons:hasBadAction ? ["forbidden_action_label_executable"] : [],
      redacted:true
    });
  }

  function buildGlobalShoppingSafeNextActionRows(input) {
    const evaluation = evaluateGlobalShoppingSafeNextActionPanel(input);
    const labelMap = {
      review:"查看候选证据",
      manual_verify:"到平台后人工核对实时价格",
      read_disclosure:"查看交接包与平台核对清单",
      decide_outside_weishan:"确认是否继续由用户自行决定"
    };
    return clone(evaluation.safeActions.map(function (actionId) {
      return actionRow(actionId, labelMap[actionId] || actionId, "safe");
    }));
  }

  function buildGlobalShoppingForbiddenNextActionRows(input) {
    const evaluation = evaluateGlobalShoppingSafeNextActionPanel(input);
    return clone(evaluation.forbiddenActions.map(function (label, index) {
      return actionRow("forbidden_" + String(index + 1), label + "：已阻断", "blocked");
    }));
  }

  function sanitizeGlobalShoppingSafeNextActionPanel(panel) {
    const safe = obj(panel);
    const evaluation = evaluateGlobalShoppingSafeNextActionPanel(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      panelName:PANEL_NAME,
      appVersion:GLOBAL_SHOPPING_SAFE_NEXT_ACTION_PANEL_VERSION,
      status:status,
      title:"安全下一步",
      safeActions:toArray(safe.safeActions).length ? toArray(safe.safeActions) : evaluation.safeActions,
      safeActionRows:toArray(safe.safeActionRows).length ? toArray(safe.safeActionRows) : buildGlobalShoppingSafeNextActionRows(safe),
      forbiddenActions:toArray(safe.forbiddenActions).length ? toArray(safe.forbiddenActions) : evaluation.forbiddenActions,
      forbiddenActionRows:toArray(safe.forbiddenActionRows).length ? toArray(safe.forbiddenActionRows) : buildGlobalShoppingForbiddenNextActionRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"安全下一步",
        resultLabel:status === "ready" ? "安全下一步已准备" : (status === "blocked" ? "安全下一步已阻断" : "安全下一步仍需复核"),
        caveat:"下一步只用于复核提醒，不打开平台，不执行购买、下单、付款、出票、签署、下载或导出。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingSafeNextActionPanel(input) {
    try {
      return sanitizeGlobalShoppingSafeNextActionPanel(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingSafeNextActionPanel({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingSafeNextActionPanelAuditDraft(input) {
    const panel = buildGlobalShoppingSafeNextActionPanel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_SAFE_NEXT_ACTION_PANEL_AUDIT_DRAFT",
      panelName:PANEL_NAME,
      appVersion:GLOBAL_SHOPPING_SAFE_NEXT_ACTION_PANEL_VERSION,
      status:panel.status,
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

  window.WeishanGlobalShoppingSafeNextActionPanel = {
    GLOBAL_SHOPPING_SAFE_NEXT_ACTION_PANEL_VERSION,
    PANEL_NAME,
    buildGlobalShoppingSafeNextActionPanel,
    evaluateGlobalShoppingSafeNextActionPanel,
    buildGlobalShoppingSafeNextActionRows,
    buildGlobalShoppingForbiddenNextActionRows,
    buildGlobalShoppingSafeNextActionPanelAuditDraft,
    sanitizeGlobalShoppingSafeNextActionPanel
  };
})();
