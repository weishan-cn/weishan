;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_RELEASE_READINESS_VIEW_MODEL_VERSION = "3.2.0";
  const VIEW_MODEL_NAME = "flight_workflow_release_readiness_view_model_v1";
  const SENSITIVE_TEXT_RE = /https?:\/\/\S+|token|apiKey|secret|password|身份证号|护照号|银行卡号|credential|passport|cardNumber/ig;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(SENSITIVE_TEXT_RE, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }; }
  function dashboardOf(input) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.releaseReadinessSummary) return safe.releaseReadinessSummary;
    if (safe.dashboardSummary) return safe.dashboardSummary;
    const api = window.WeishanFlightWorkflowReleaseReadinessDashboard || {};
    return typeof api.buildFlightWorkflowReleaseReadinessDashboard === "function" ? api.buildFlightWorkflowReleaseReadinessDashboard(safe) : { status:"failed_safe", releaseReady:false, safeForUserFacingBeta:false, readiness:{}, cards:[], checklistRows:[], forbiddenCapabilities:[], userFacingSummary:{ resultLabel:"发布已安全阻断", redacted:true }, redacted:true };
  }
  function valueFor(status) {
    if (status === "ready" || status === "pass") return "可以进入只读 Beta 验收";
    if (status === "warning") return "存在需要注意的项目";
    return "暂不可验收";
  }
  function card(cardId, label, status, detail) { return { cardId:cardId, label:safeText(label), value:valueFor(status), status:safeText(status || "failed_safe"), detail:safeText(detail || ""), redacted:true }; }
  function buildFlightWorkflowReleaseReadinessCards(input) {
    const dashboard = dashboardOf(input);
    const readiness = dashboard.readiness || {};
    return clone([
      card("release_status", "发布状态", dashboard.status, dashboard.userFacingSummary && dashboard.userFacingSummary.resultLabel || ""),
      card("safety_boundary", "安全红线", readiness.matrixBlocked || dashboard.status === "blocked" ? "blocked" : "ready", "当前仍是只读候选证据流程"),
      card("safety_matrix", "安全矩阵", readiness.matrixBlocked ? "blocked" : (readiness.warningCount ? "warning" : "ready"), "本地安全矩阵"),
      card("user_review", "用户复核摘要", readiness.operatorReady ? "ready" : (dashboard.status === "warning" ? "warning" : dashboard.status), "人工复核与平台页面核对")
    ]);
  }
  function buildFlightWorkflowReleaseReadinessRows(input) {
    const dashboard = dashboardOf(input);
    const rows = toArray(dashboard.checklistRows).map(function (row) { return { label:safeText(row.label || row.checkId || ""), value:safeText(row.value || (row.passed ? "通过" : "需复核")), status:row.passed ? "pass" : "warning", redacted:true }; });
    return clone(rows.length ? rows : [
      { label:"当前仍是只读候选证据流程", value:"通过", status:"pass", redacted:true },
      { label:"不代表真实票价、库存或可出票", value:"通过", status:"pass", redacted:true },
      { label:"唯珊不会付款、不会下单、不会出票", value:"通过", status:"pass", redacted:true },
      { label:"唯珊不会上传证件、银行卡或登录凭据", value:"通过", status:"pass", redacted:true }
    ]);
  }
  function buildFlightWorkflowForbiddenCapabilityRows(input) {
    const dashboard = dashboardOf(input);
    const list = toArray(dashboard.forbiddenCapabilities).length ? toArray(dashboard.forbiddenCapabilities) : ["付款", "下单", "出票", "证件银行卡上传", "自动打开交易页", "真实 provider 请求", "写文件或下载"];
    return clone(list.map(function (item) { return { capability:safeText(item), status:"仍被禁止", redacted:true }; }));
  }
  function buildFlightWorkflowReleaseReadinessViewModel(input) {
    const dashboard = dashboardOf(input || {});
    return clone({ viewModelName:VIEW_MODEL_NAME, appVersion:FLIGHT_WORKFLOW_RELEASE_READINESS_VIEW_MODEL_VERSION, status:dashboard.status || "failed_safe", title:"机票工作流发布就绪总览", subtitle:"当前仍是只读候选证据流程", releaseVersion:safeText(dashboard.releaseVersion || FLIGHT_WORKFLOW_RELEASE_READINESS_VIEW_MODEL_VERSION), safeForUserFacingBeta:dashboard.safeForUserFacingBeta === true, betaAcceptanceSummary:dashboard.betaAcceptanceSummary || null, guidedUserTestSummary:dashboard.guidedUserTestSummary || null, feedbackSanitizerSummary:dashboard.feedbackSanitizerSummary || null, betaAcceptanceReady:dashboard.betaAcceptanceReady === true, guidedUserTestStatus:safeText(dashboard.guidedUserTestStatus || "not_started"), statusCards:buildFlightWorkflowReleaseReadinessCards({ releaseReadinessSummary:dashboard }), rows:buildFlightWorkflowReleaseReadinessRows({ releaseReadinessSummary:dashboard }), forbiddenCapabilityRows:buildFlightWorkflowForbiddenCapabilityRows({ releaseReadinessSummary:dashboard }), sections:[{ sectionId:"release_status", title:"发布状态", redacted:true }, { sectionId:"safety_boundary", title:"安全红线", redacted:true }, { sectionId:"safety_matrix", title:"安全矩阵", redacted:true }, { sectionId:"user_review", title:"用户复核摘要", redacted:true }, { sectionId:"forbidden_capabilities", title:"仍被禁止的能力", redacted:true }], betaReadinessLabel:dashboard.safeForUserFacingBeta === true ? "可以进入只读 Beta 验收" : (dashboard.status === "warning" ? "存在需要注意的项目" : "暂不可验收"), caveat:"不代表真实票价、库存或可出票。唯珊不会付款、不会下单、不会出票。唯珊不会上传证件、银行卡或登录凭据。", userFacingSafetyCopy:"当前仍是只读候选证据流程", safety:safety(), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true });
  }
  function buildFlightWorkflowReleaseReadinessViewModelAuditDraft(input) {
    const vm = buildFlightWorkflowReleaseReadinessViewModel(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_RELEASE_READINESS_VIEW_MODEL_AUDIT_DRAFT", viewModelName:VIEW_MODEL_NAME, appVersion:FLIGHT_WORKFLOW_RELEASE_READINESS_VIEW_MODEL_VERSION, status:vm.status, title:vm.title, statusCardCount:vm.statusCards.length, forbiddenCapabilityRowCount:vm.forbiddenCapabilityRows.length, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, identityUpload:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true });
  }

  window.WeishanFlightWorkflowReleaseReadinessViewModel = { FLIGHT_WORKFLOW_RELEASE_READINESS_VIEW_MODEL_VERSION, VIEW_MODEL_NAME, buildFlightWorkflowReleaseReadinessViewModel, buildFlightWorkflowReleaseReadinessCards, buildFlightWorkflowReleaseReadinessRows, buildFlightWorkflowForbiddenCapabilityRows, buildFlightWorkflowReleaseReadinessViewModelAuditDraft };
})();
