;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PLATFORM_HANDOFF_SIMULATION_VIEW_MODEL_VERSION = "4.0.8";
  const VIEW_MODEL_NAME = "global_shopping_platform_handoff_simulation_view_model_v1";

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
  function resolveSimulator(input) {
    const safe = obj(input);
    if (Object.keys(obj(safe.readOnlyPlatformHandoffSimulatorSummary)).length) return obj(safe.readOnlyPlatformHandoffSimulatorSummary);
    const api = window.WeishanGlobalShoppingReadOnlyPlatformHandoffSimulator || {};
    return typeof api.buildGlobalShoppingReadOnlyPlatformHandoffSimulator === "function" ? api.buildGlobalShoppingReadOnlyPlatformHandoffSimulator(safe) : {};
  }
  function resolvePack(input) {
    const safe = obj(input);
    if (Object.keys(obj(safe.redactedSearchParameterPackSummary)).length) return obj(safe.redactedSearchParameterPackSummary);
    const api = window.WeishanGlobalShoppingRedactedSearchParameterPack || {};
    return typeof api.buildGlobalShoppingRedactedSearchParameterPack === "function" ? api.buildGlobalShoppingRedactedSearchParameterPack(safe) : {};
  }
  function resolveChecklist(input) {
    const safe = obj(input);
    if (Object.keys(obj(safe.userConfirmationChecklistSummary)).length) return obj(safe.userConfirmationChecklistSummary);
    const api = window.WeishanGlobalShoppingUserConfirmationChecklist || {};
    return typeof api.buildGlobalShoppingUserConfirmationChecklist === "function" ? api.buildGlobalShoppingUserConfirmationChecklist(safe) : {};
  }
  function buildGlobalShoppingPlatformHandoffSimulationCards(input) {
    const simulator = resolveSimulator(input);
    const pack = resolvePack(input);
    const checklist = resolveChecklist(input);
    return clone([
      { cardId:"handoff_simulator", label:"交接模拟", value:text(obj(simulator.userFacingSummary).resultLabel || "交接模拟仍需复核"), redacted:true },
      { cardId:"parameter_pack", label:"搜索参数包", value:text(obj(pack.userFacingSummary).resultLabel || "搜索参数包仍需复核"), redacted:true },
      { cardId:"confirmation_checklist", label:"用户确认清单", value:text(obj(checklist.userFacingSummary).resultLabel || "用户确认清单仍需复核"), redacted:true },
      { cardId:"next_step", label:"下一步", value:text(statusOf(simulator) === "ready" && statusOf(pack) === "ready" && statusOf(checklist) === "ready" ? "由用户在平台自行确认实时价格、库存、身份、支付与订单。" : "先补齐交接模拟、搜索参数包与用户确认清单。"), redacted:true }
    ]);
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function buildGlobalShoppingPlatformHandoffSimulationRows(input) {
    return clone(toArray(obj(resolveSimulator(input)).rows).map(function (item) {
      return { rowId:text(item.rowId), label:text(item.label), value:text(item.value), status:item.status || "warning", redacted:true };
    }));
  }
  function buildGlobalShoppingSearchParameterPackRowsForView(input) {
    const pack = resolvePack(input);
    const allowedRows = toArray(pack.allowedParameters).map(function (item) {
      return { rowId:text(item.key), label:text(item.key), value:text(item.valueLabel), status:"pass", redacted:true };
    });
    const blockedRows = toArray(pack.blockedParameters).slice(0, 6).map(function (item) {
      return { rowId:text(item.key), label:text(item.key), value:"敏感字段已阻断", status:"pass", redacted:true };
    });
    return clone(allowedRows.concat(blockedRows));
  }
  function buildGlobalShoppingUserConfirmationChecklistRowsForView(input) {
    const checklist = resolveChecklist(input);
    return clone(toArray(checklist.confirmationItems).map(function (item) {
      return { rowId:text(item.itemId), label:text(item.label), value:text(item.summary), status:"pass", redacted:true };
    }).concat(toArray(checklist.userOnlyActions).map(function (item) {
      return { rowId:text(item.actionId), label:text(item.label), value:text(item.reason), status:"pass", redacted:true };
    })));
  }
  function sanitizeGlobalShoppingPlatformHandoffSimulationViewModel(viewModel) {
    const safe = obj(viewModel);
    const hasExplicitSimulator = Object.keys(obj(safe.readOnlyPlatformHandoffSimulatorSummary)).length > 0;
    const hasExplicitPack = Object.keys(obj(safe.redactedSearchParameterPackSummary)).length > 0;
    const hasExplicitChecklist = Object.keys(obj(safe.userConfirmationChecklistSummary)).length > 0;
    const hasPartialExplicitInput = (hasExplicitSimulator || hasExplicitPack || hasExplicitChecklist) && !(hasExplicitSimulator && hasExplicitPack && hasExplicitChecklist);
    const simulator = resolveSimulator(safe);
    const pack = resolvePack(safe);
    const checklist = resolveChecklist(safe);
    const blocked = statusOf(simulator) === "blocked" || statusOf(pack) === "blocked" || statusOf(checklist) === "blocked" || safe.networkEnabled === true || safe.realEndpointDetected === true || safe.hasRealApiKey === true || safe.rawResponseStored === true || safe.openExternal === true || safe.windowOpen === true || safe.export === true || safe.download === true || safe.payment === true || safe.order === true || safe.ticketing === true || safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl;
    const missing = hasPartialExplicitInput || !Object.keys(simulator).length || !Object.keys(pack).length || !Object.keys(checklist).length;
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status))
      ? text(safe.status)
      : (blocked ? "blocked" : (missing || statusOf(simulator) !== "ready" || statusOf(pack) !== "ready" || statusOf(checklist) !== "ready" ? "needs_review" : "ready"));
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PLATFORM_HANDOFF_SIMULATION_VIEW_MODEL_VERSION,
      status:status,
      title:"只读平台交接模拟",
      readOnlyPlatformHandoffSimulatorSummary:clone(simulator),
      redactedSearchParameterPackSummary:clone(pack),
      userConfirmationChecklistSummary:clone(checklist),
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingPlatformHandoffSimulationCards(safe),
      simulationRows:toArray(safe.simulationRows).length ? toArray(safe.simulationRows) : buildGlobalShoppingPlatformHandoffSimulationRows(safe),
      parameterPackRows:toArray(safe.parameterPackRows).length ? toArray(safe.parameterPackRows) : buildGlobalShoppingSearchParameterPackRowsForView(safe),
      confirmationChecklistRows:toArray(safe.confirmationChecklistRows).length ? toArray(safe.confirmationChecklistRows) : buildGlobalShoppingUserConfirmationChecklistRowsForView(safe),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        { rowId:"simulator", label:"交接模拟", value:"交接模拟不打开平台", status:"pass", redacted:true },
        { rowId:"parameter_pack", label:"搜索参数包", value:"搜索参数包不包含身份或支付信息", status:"pass", redacted:true },
        { rowId:"checklist", label:"用户确认清单", value:"用户必须在平台自行确认实时价格", status:"pass", redacted:true },
        { rowId:"boundary", label:"安全边界", value:"Weishan 不替用户登录、付款、下单或出票", status:"pass", redacted:true }
      ],
      caveat:"当前仅模拟平台交接前的非敏感搜索参数准备和用户确认清单，不打开平台，不填写身份、账号、证件、银行卡或支付信息。",
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingPlatformHandoffSimulationViewModel(input) {
    try {
      return sanitizeGlobalShoppingPlatformHandoffSimulationViewModel(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingPlatformHandoffSimulationViewModel({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingPlatformHandoffSimulationViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingPlatformHandoffSimulationViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PLATFORM_HANDOFF_SIMULATION_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PLATFORM_HANDOFF_SIMULATION_VIEW_MODEL_VERSION,
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

  window.WeishanGlobalShoppingPlatformHandoffSimulationViewModel = {
    GLOBAL_SHOPPING_PLATFORM_HANDOFF_SIMULATION_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingPlatformHandoffSimulationViewModel,
    buildGlobalShoppingPlatformHandoffSimulationCards,
    buildGlobalShoppingPlatformHandoffSimulationRows,
    buildGlobalShoppingSearchParameterPackRowsForView,
    buildGlobalShoppingUserConfirmationChecklistRowsForView,
    buildGlobalShoppingPlatformHandoffSimulationViewModelAuditDraft,
    sanitizeGlobalShoppingPlatformHandoffSimulationViewModel
  };
})();
