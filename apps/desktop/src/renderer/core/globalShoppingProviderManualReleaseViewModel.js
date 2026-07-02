;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_MANUAL_RELEASE_VIEW_MODEL_VERSION = "4.0.2";
  const VIEW_MODEL_NAME = "global_shopping_provider_manual_release_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function card(cardId, label, value) { return { cardId:text(cardId), label:text(label), value:text(value), redacted:true }; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }

  function buildGlobalShoppingSandboxPilotExceptionRowsForView(input) {
    const register = resolveSummary(input, "sandboxPilotExceptionRegisterSummary", "WeishanGlobalShoppingSandboxPilotExceptionRegister", "buildGlobalShoppingSandboxPilotExceptionRegister");
    return toArray(register.rows).length ? clone(register.rows) : clone([row("exception_register_missing", "例外登记", "例外登记仍需复核", "warning")]);
  }

  function buildGlobalShoppingProviderReadinessSignOffRowsForView(input) {
    const packet = resolveSummary(input, "providerReadinessSignOffPacketSummary", "WeishanGlobalShoppingProviderReadinessSignOffPacket", "buildGlobalShoppingProviderReadinessSignOffPacket");
    return toArray(packet.rows).length ? clone(packet.rows) : clone([row("signoff_packet_missing", "准备签核", "准备签核仍需复核", "warning")]);
  }

  function buildGlobalShoppingProviderManualReleaseRows(input) {
    const room = resolveSummary(input, "manualGovernanceReleaseDecisionRoomSummary", "WeishanGlobalShoppingManualGovernanceReleaseDecisionRoom", "buildGlobalShoppingManualGovernanceReleaseDecisionRoom");
    return toArray(room.rows).length ? clone(room.rows) : clone([row("manual_decision_missing", "人工发布决策", "人工发布决策仍需复核", "warning")]);
  }

  function buildGlobalShoppingProviderManualReleaseCards(input) {
    const safe = obj(input);
    const room = resolveSummary(safe, "manualGovernanceReleaseDecisionRoomSummary", "WeishanGlobalShoppingManualGovernanceReleaseDecisionRoom", "buildGlobalShoppingManualGovernanceReleaseDecisionRoom");
    const register = resolveSummary(safe, "sandboxPilotExceptionRegisterSummary", "WeishanGlobalShoppingSandboxPilotExceptionRegister", "buildGlobalShoppingSandboxPilotExceptionRegister");
    const packet = resolveSummary(safe, "providerReadinessSignOffPacketSummary", "WeishanGlobalShoppingProviderReadinessSignOffPacket", "buildGlobalShoppingProviderReadinessSignOffPacket");
    return clone([
      card("manual_decision", "人工发布决策", obj(room.userFacingSummary).resultLabel || "人工发布决策仍需复核"),
      card("exception_register", "例外登记", obj(register.userFacingSummary).resultLabel || "例外登记仍需复核"),
      card("sign_off_packet", "准备签核", obj(packet.userFacingSummary).resultLabel || "准备签核仍需复核"),
      card("risk_disclosure", "风险说明", "Manual provider sign-off 仍需人工复核")
    ]);
  }

  function sanitizeGlobalShoppingProviderManualReleaseViewModel(viewModel) {
    const safe = obj(viewModel);
    const manualGovernanceReleaseDecisionRoomSummary = resolveSummary(safe, "manualGovernanceReleaseDecisionRoomSummary", "WeishanGlobalShoppingManualGovernanceReleaseDecisionRoom", "buildGlobalShoppingManualGovernanceReleaseDecisionRoom");
    const sandboxPilotExceptionRegisterSummary = resolveSummary(safe, "sandboxPilotExceptionRegisterSummary", "WeishanGlobalShoppingSandboxPilotExceptionRegister", "buildGlobalShoppingSandboxPilotExceptionRegister");
    const providerReadinessSignOffPacketSummary = resolveSummary(safe, "providerReadinessSignOffPacketSummary", "WeishanGlobalShoppingProviderReadinessSignOffPacket", "buildGlobalShoppingProviderReadinessSignOffPacket");
    const blocked = safe.startRealProvider === true || safe.startPilot === true || safe.showCredentialInput === true || safe.readApiKey === true ||
      safe.network === true || safe.generateEndpoint === true || safe.openExternal === true || safe.windowOpen === true || safe.enableProductionProvider === true ||
      safe.createApprovalTask === true || safe.sendEmail === true || safe.openExternalDocument === true || safe.executeRollback === true || safe.modifyRuntimeConfig === true ||
      safe.enableProvider === true || safe.disableProvider === true || safe.download === true || safe.exportRealFile === true || safe.createRelease === true ||
      safe.createTag === true || safe.push === true || safe.payment === true || safe.order === true || safe.ticketing === true ||
      !!(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl) ||
      statusOf(manualGovernanceReleaseDecisionRoomSummary) === "blocked" || statusOf(sandboxPilotExceptionRegisterSummary) === "blocked" ||
      statusOf(providerReadinessSignOffPacketSummary) === "blocked";
    const missing = !present(manualGovernanceReleaseDecisionRoomSummary) || !present(sandboxPilotExceptionRegisterSummary) || !present(providerReadinessSignOffPacketSummary);
    const status = blocked ? "blocked" : (missing ? "needs_review" : "ready");
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_MANUAL_RELEASE_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider 人工发布决策与签核",
      cards:buildGlobalShoppingProviderManualReleaseCards({
        manualGovernanceReleaseDecisionRoomSummary:manualGovernanceReleaseDecisionRoomSummary,
        sandboxPilotExceptionRegisterSummary:sandboxPilotExceptionRegisterSummary,
        providerReadinessSignOffPacketSummary:providerReadinessSignOffPacketSummary
      }),
      manualDecisionRows:buildGlobalShoppingProviderManualReleaseRows({ manualGovernanceReleaseDecisionRoomSummary:manualGovernanceReleaseDecisionRoomSummary }),
      exceptionRegisterRows:buildGlobalShoppingSandboxPilotExceptionRowsForView({ sandboxPilotExceptionRegisterSummary:sandboxPilotExceptionRegisterSummary }),
      signOffPacketRows:buildGlobalShoppingProviderReadinessSignOffRowsForView({ providerReadinessSignOffPacketSummary:providerReadinessSignOffPacketSummary }),
      disclosureRows:[
        row("manual_release_no_release", "人工发布决策不创建 release、不 push", "人工发布决策不创建 release、不 push", "pass"),
        row("exception_register_no_persistence", "例外登记不持久化审批结果", "例外登记不持久化审批结果", "pass"),
        row("signoff_packet_no_export", "准备签核包不写文件、不导出", "准备签核包不写文件、不导出", "pass"),
        row("manual_signoff_required", "Manual provider sign-off 仍需人工复核", "Manual provider sign-off 仍需人工复核", "warning")
      ],
      manualGovernanceReleaseDecisionRoomSummary:clone(manualGovernanceReleaseDecisionRoomSummary),
      sandboxPilotExceptionRegisterSummary:clone(sandboxPilotExceptionRegisterSummary),
      providerReadinessSignOffPacketSummary:clone(providerReadinessSignOffPacketSummary),
      caveat:"当前只展示 provider 人工发布决策、例外登记和准备签核，不接真实 provider，不读取密钥，不联网，不创建 release，不创建 tag，不 push。"
    });
  }

  function buildGlobalShoppingProviderManualReleaseViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderManualReleaseViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_MANUAL_RELEASE_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_MANUAL_RELEASE_VIEW_MODEL_VERSION,
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

  function buildGlobalShoppingProviderManualReleaseViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderManualReleaseViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderManualReleaseViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderManualReleaseViewModel = {
    GLOBAL_SHOPPING_PROVIDER_MANUAL_RELEASE_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderManualReleaseViewModel,
    buildGlobalShoppingProviderManualReleaseCards,
    buildGlobalShoppingProviderManualReleaseRows,
    buildGlobalShoppingSandboxPilotExceptionRowsForView,
    buildGlobalShoppingProviderReadinessSignOffRowsForView,
    buildGlobalShoppingProviderManualReleaseViewModelAuditDraft,
    sanitizeGlobalShoppingProviderManualReleaseViewModel
  };
})();
