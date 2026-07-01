;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_OFFLINE_LAUNCH_CHECKLIST_VERSION = "3.5.0";
  const CHECKLIST_NAME = "global_shopping_provider_offline_launch_checklist_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe)$/.test(text(value)) ? text(value) : "needs_review"; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function section(sectionId, label, status, summary, caveat) {
    return { sectionId:text(sectionId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
  }
  function safety() {
    return {
      fileWrite:false,
      download:false,
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
    };
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function labelOf(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }
  function blockedReasons(input) {
    const safe = obj(input);
    return [
      safe.persistChecklistResult === true ? "checklist_persistence_detected" : "",
      safe.createTask === true ? "task_creation_detected" : "",
      safe.sendEmail === true ? "send_email_detected" : "",
      safe.openExternalDocument === true ? "external_document_open_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.startRealProvider === true ? "real_provider_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingProviderOfflineLaunchChecklistSections(input) {
    const safe = obj(input);
    const offlineLaunchDecisionSimulatorSummary = resolveSummary(safe, "offlineLaunchDecisionSimulatorSummary", "WeishanGlobalShoppingOfflineLaunchDecisionSimulator", "buildGlobalShoppingOfflineLaunchDecisionSimulator");
    const sandboxActivationReceiptLedgerSummary = resolveSummary(safe, "sandboxActivationReceiptLedgerSummary", "WeishanGlobalShoppingSandboxActivationReceiptLedger", "buildGlobalShoppingSandboxActivationReceiptLedger");
    const adapterSecurityRegressionGuardSummary = resolveSummary(safe, "adapterSecurityRegressionGuardSummary", "WeishanGlobalShoppingAdapterSecurityRegressionGuard", "buildGlobalShoppingAdapterSecurityRegressionGuard");
    const providerOfflineReleaseGateSummary = resolveSummary(safe, "providerOfflineReleaseGateSummary", "WeishanGlobalShoppingProviderOfflineReleaseGate", "buildGlobalShoppingProviderOfflineReleaseGate");
    const providerCertificationFreezeLedgerSummary = resolveSummary(safe, "providerCertificationFreezeLedgerSummary", "WeishanGlobalShoppingProviderCertificationFreezeLedger", "buildGlobalShoppingProviderCertificationFreezeLedger");
    return clone([
      section("launch_decision_simulator", "Offline Launch Decision Simulator", present(offlineLaunchDecisionSimulatorSummary) ? offlineLaunchDecisionSimulatorSummary.status : "needs_review", labelOf(offlineLaunchDecisionSimulatorSummary, "离线发布决策仍需复核"), "只展示离线发布决策，不保存真实决策。"),
      section("activation_receipt_ledger", "Sandbox Activation Receipt Ledger", present(sandboxActivationReceiptLedgerSummary) ? sandboxActivationReceiptLedgerSummary.status : "needs_review", labelOf(sandboxActivationReceiptLedgerSummary, "Sandbox 激活回执仍需复核"), "只展示回执台账，不保存真实回执。"),
      section("security_regression_guard", "Adapter Security Regression Guard", present(adapterSecurityRegressionGuardSummary) ? adapterSecurityRegressionGuardSummary.status : "needs_review", labelOf(adapterSecurityRegressionGuardSummary, "Adapter 安全回归仍需复核"), "只展示安全回归状态，不修改配置。"),
      section("offline_release_gate", "Provider Offline Release Gate", present(providerOfflineReleaseGateSummary) ? providerOfflineReleaseGateSummary.status : "needs_review", labelOf(providerOfflineReleaseGateSummary, "离线发布闸门仍需复核"), "只展示离线发布闸门，不创建 release。"),
      section("certification_freeze_ledger", "Provider Certification Freeze Ledger", present(providerCertificationFreezeLedgerSummary) ? providerCertificationFreezeLedgerSummary.status : "needs_review", labelOf(providerCertificationFreezeLedgerSummary, "认证冻结仍需复核"), "只展示冻结台账，不持久化台账。")
    ]);
  }

  function buildGlobalShoppingProviderOfflineLaunchChecklistRows(input) {
    const safe = obj(input);
    const checklistSections = toArray(safe.checklistSections).length ? toArray(safe.checklistSections) : buildGlobalShoppingProviderOfflineLaunchChecklistSections(safe);
    return clone([
      row("provider_offline_launch_checklist_status", "Provider Offline Launch Checklist 状态", obj(safe.userFacingSummary).resultLabel || "离线 Launch Checklist 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_offline_launch_checklist_boundary", "离线 Launch Checklist 边界", "该清单只展示离线 launch 检查项，不保存结果，不创建 release，不 push，不激活 sandbox。", "pass")
    ].concat(checklistSections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingProviderOfflineLaunchChecklist(input) {
    const safe = obj(input);
    const checklistSections = buildGlobalShoppingProviderOfflineLaunchChecklistSections(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedChecklistSections = checklistSections.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe"; });
    const missingChecklistSections = checklistSections.filter(function (item) { return item.status === "needs_review"; });
    const status = directBlockedReasons.length || blockedChecklistSections.length ? "blocked" : (missingChecklistSections.length ? "needs_review" : "ready");
    const result = {
      checklistName:CHECKLIST_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_OFFLINE_LAUNCH_CHECKLIST_VERSION,
      status:status,
      checklistBoundary:{
        checklistId:"global-shopping-provider-offline-launch-checklist",
        checklistMode:"checklist_only",
        checklistOnly:true,
        offlineOnly:true,
        mockOnly:true,
        readinessOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canPersistChecklistResult:false,
        canCreateTask:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canActivateSandbox:false,
        canStartRealProvider:false,
        canEnableProvider:false,
        canReadApiKey:false,
        canCallNetwork:false
      },
      checklistSummary:{
        hasLaunchDecisionSimulator:checklistSections[0].status !== "needs_review",
        hasActivationReceiptLedger:checklistSections[1].status !== "needs_review",
        hasSecurityRegressionGuard:checklistSections[2].status !== "needs_review",
        hasOfflineReleaseGate:checklistSections[3].status !== "needs_review",
        hasCertificationFreezeLedger:checklistSections[4].status !== "needs_review",
        checklistSectionCount:checklistSections.length,
        missingChecklistSectionCount:missingChecklistSections.length,
        blockedChecklistSectionCount:blockedChecklistSections.length,
        readyForOfflineLaunchViewModel:status === "ready",
        manualLaunchReviewRequired:true
      },
      checklistSections:checklistSections,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedChecklistSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"Provider Offline Launch Checklist",
        resultLabel:status === "ready" ? "离线 Launch Checklist 已准备" : (status === "blocked" ? "离线 Launch Checklist 已阻断" : "离线 Launch Checklist 仍需复核"),
        caveat:"该清单只展示离线 launch 检查项，不保存结果，不创建 release，不 push，不激活 sandbox。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingProviderOfflineLaunchChecklistRows(result);
    return clone(result);
  }

  function buildGlobalShoppingProviderOfflineLaunchChecklistAuditDraft(input) {
    const checklist = buildGlobalShoppingProviderOfflineLaunchChecklist(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_OFFLINE_LAUNCH_CHECKLIST_AUDIT_DRAFT",
      checklistName:CHECKLIST_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_OFFLINE_LAUNCH_CHECKLIST_VERSION,
      status:checklist.status,
      checklistSectionCount:obj(checklist.checklistSummary).checklistSectionCount || 0,
      blockedChecklistSectionCount:obj(checklist.checklistSummary).blockedChecklistSectionCount || 0,
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

  function sanitizeGlobalShoppingProviderOfflineLaunchChecklist(checklist) {
    return evaluateGlobalShoppingProviderOfflineLaunchChecklist(checklist || {});
  }

  function buildGlobalShoppingProviderOfflineLaunchChecklist(input) {
    try {
      return evaluateGlobalShoppingProviderOfflineLaunchChecklist(input || {});
    } catch (_) {
      return evaluateGlobalShoppingProviderOfflineLaunchChecklist({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderOfflineLaunchChecklist = {
    GLOBAL_SHOPPING_PROVIDER_OFFLINE_LAUNCH_CHECKLIST_VERSION,
    CHECKLIST_NAME,
    buildGlobalShoppingProviderOfflineLaunchChecklist,
    evaluateGlobalShoppingProviderOfflineLaunchChecklist,
    buildGlobalShoppingProviderOfflineLaunchChecklistRows,
    buildGlobalShoppingProviderOfflineLaunchChecklistSections,
    buildGlobalShoppingProviderOfflineLaunchChecklistAuditDraft,
    sanitizeGlobalShoppingProviderOfflineLaunchChecklist
  };
})();
