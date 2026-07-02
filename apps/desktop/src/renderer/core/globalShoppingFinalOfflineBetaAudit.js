;(function () {
  "use strict";

  const GLOBAL_SHOPPING_FINAL_OFFLINE_BETA_AUDIT_VERSION = "4.0.4";
  const AUDIT_NAME = "global_shopping_final_offline_beta_audit_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, final_offline_beta_audit_only:true };
  const SAFE_KEYS = ["noProvider", "noNetwork", "noKey", "noEndpoint", "noExternalOpen", "noPayment", "noOrder", "noTicketing", "noRawPersistence", "noReleaseMutation", "userCopySafe"];

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function safeMode(value) {
    const mode = text(value || "final_offline_beta_audit_only");
    return ALLOWED_MODES[mode] ? mode : "final_offline_beta_audit_only";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (safe[key] && typeof safe[key] === "object") return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }

  function buildGlobalShoppingFinalOfflineBetaAuditRows(input) {
    const safe = obj(input);
    const rows = [
      row("final_offline_beta_audit_status", "Final Offline Beta Audit", safe.status === "ready" ? "最终离线审计通过" : (safe.status === "blocked" ? "Final Offline Beta Audit 已阻断" : "Final Offline Beta Audit 仍需复核"), safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("final_offline_beta_audit_manual_review", "Manual Review Required", "仍需人工复核后再决定是否进入下一阶段", safe.manualReviewRequired === true ? "warning" : "blocked")
    ];
    SAFE_KEYS.forEach(function (key) {
      rows.push(row("audit_" + key, key, safe[key] === true ? "true" : "false", safe[key] === true ? "pass" : "blocked"));
    });
    return clone(rows);
  }

  function buildGlobalShoppingFinalOfflineBetaAuditSections(input) {
    const safe = obj(input);
    return clone([
      { sectionId:"operator_console", title:"Public Beta Operator Console", status:safeStatus(obj(safe.publicBetaOperatorConsoleSummary).status), redacted:true },
      { sectionId:"category_shell", title:"Category Expansion Shell", status:safeStatus(obj(safe.categoryExpansionShellSummary).status), redacted:true },
      { sectionId:"final_gate", title:"Public Beta Final Gate", status:safeStatus(obj(safe.publicBetaFinalGateSummary).status), redacted:true },
      { sectionId:"rc_board", title:"RC Confidence Board", status:safeStatus(obj(safe.releaseCandidateConfidenceBoardSummary).status), redacted:true },
      { sectionId:"safety_copy", title:"Public Beta Safety Copy Center", status:safeStatus(obj(safe.publicBetaSafetyCopyCenterSummary).status), redacted:true }
    ]);
  }

  function buildGlobalShoppingFinalOfflineBetaAuditDraft(input) {
    const safe = obj(input);
    return clone({
      eventType:"GLOBAL_SHOPPING_FINAL_OFFLINE_BETA_AUDIT_DRAFT",
      auditName:AUDIT_NAME,
      appVersion:GLOBAL_SHOPPING_FINAL_OFFLINE_BETA_AUDIT_VERSION,
      status:safeStatus(safe.status),
      safeCheckCount:SAFE_KEYS.length,
      manualReviewRequired:true,
      fileWrite:false,
      export:false,
      download:false,
      upload:false,
      mail:false,
      openExternal:false,
      release:false,
      tag:false,
      push:false,
      redacted:true
    });
  }

  function evaluateGlobalShoppingFinalOfflineBetaAudit(input) {
    const safe = obj(input);
    const publicBetaOperatorConsoleSummary = resolveSummary(safe, "publicBetaOperatorConsoleSummary", "WeishanGlobalShoppingPublicBetaOperatorConsole", "buildGlobalShoppingPublicBetaOperatorConsole");
    const categoryExpansionShellSummary = resolveSummary(safe, "categoryExpansionShellSummary", "WeishanGlobalShoppingCategoryExpansionShell", "buildGlobalShoppingCategoryExpansionShell");
    const publicBetaFinalGateSummary = resolveSummary(safe, "publicBetaFinalGateSummary", "WeishanGlobalShoppingPublicBetaFinalGate", "buildGlobalShoppingPublicBetaFinalGate");
    const releaseCandidateConfidenceBoardSummary = resolveSummary(safe, "releaseCandidateConfidenceBoardSummary", "WeishanGlobalShoppingReleaseCandidateConfidenceBoard", "buildGlobalShoppingReleaseCandidateConfidenceBoard");
    const publicBetaSafetyCopyCenterSummary = resolveSummary(safe, "publicBetaSafetyCopyCenterSummary", "WeishanGlobalShoppingPublicBetaSafetyCopyCenter", "buildGlobalShoppingPublicBetaSafetyCopyCenter");
    const base = {
      noProvider:safe.noProvider !== false,
      noNetwork:safe.noNetwork !== false,
      noKey:safe.noKey !== false,
      noEndpoint:safe.noEndpoint !== false,
      noExternalOpen:safe.noExternalOpen !== false,
      noPayment:safe.noPayment !== false,
      noOrder:safe.noOrder !== false,
      noTicketing:safe.noTicketing !== false,
      noRawPersistence:safe.noRawPersistence !== false,
      noReleaseMutation:safe.noReleaseMutation !== false,
      userCopySafe:safe.userCopySafe !== false,
      manualReviewRequired:true
    };
    const missingSummary =
      !Object.keys(publicBetaOperatorConsoleSummary).length ||
      !Object.keys(categoryExpansionShellSummary).length ||
      !Object.keys(publicBetaFinalGateSummary).length ||
      !Object.keys(releaseCandidateConfidenceBoardSummary).length ||
      !Object.keys(publicBetaSafetyCopyCenterSummary).length;
    const blockedSummary =
      safeStatus(publicBetaOperatorConsoleSummary.status) === "blocked" ||
      safeStatus(categoryExpansionShellSummary.status) === "blocked" ||
      safeStatus(publicBetaFinalGateSummary.status) === "blocked" ||
      safeStatus(releaseCandidateConfidenceBoardSummary.status) === "blocked" ||
      safeStatus(publicBetaSafetyCopyCenterSummary.status) === "blocked";
    const safeFailed = SAFE_KEYS.some(function (key) { return base[key] !== true; });
    const status = blockedSummary || safeFailed ? "blocked" : (missingSummary ? "needs_review" : "ready");
    return clone({
      auditName:AUDIT_NAME,
      appVersion:GLOBAL_SHOPPING_FINAL_OFFLINE_BETA_AUDIT_VERSION,
      status,
      auditMode:safeMode(safe.auditMode),
      title:"Final Offline Beta Audit",
      publicBetaOperatorConsoleSummary,
      categoryExpansionShellSummary,
      publicBetaFinalGateSummary,
      releaseCandidateConfidenceBoardSummary,
      publicBetaSafetyCopyCenterSummary,
      rows:buildGlobalShoppingFinalOfflineBetaAuditRows(Object.assign({ status }, base)),
      sections:buildGlobalShoppingFinalOfflineBetaAuditSections({
        publicBetaOperatorConsoleSummary,
        categoryExpansionShellSummary,
        publicBetaFinalGateSummary,
        releaseCandidateConfidenceBoardSummary,
        publicBetaSafetyCopyCenterSummary
      }),
      auditDraft:buildGlobalShoppingFinalOfflineBetaAuditDraft({ status }),
      userFacingSummary:{
        title:"Final Offline Beta Audit",
        resultLabel:status === "ready" ? "最终离线审计通过" : (status === "blocked" ? "Final Offline Beta Audit 已阻断" : "Final Offline Beta Audit 仍需复核"),
        caveat:"仍需人工复核后再决定是否进入下一阶段。"
      },
      externalUrl:null,
      platformUrl:null,
      providerUrl:null,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      buyButtonEnabled:false,
      checkoutButtonEnabled:false,
      paymentButtonEnabled:false,
      redacted:true
    }, base));
  }

  function sanitizeGlobalShoppingFinalOfflineBetaAudit(audit) {
    return evaluateGlobalShoppingFinalOfflineBetaAudit(audit || {});
  }

  function buildGlobalShoppingFinalOfflineBetaAudit(input) {
    try {
      return evaluateGlobalShoppingFinalOfflineBetaAudit(input || {});
    } catch (_) {
      return evaluateGlobalShoppingFinalOfflineBetaAudit({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingFinalOfflineBetaAudit = {
    GLOBAL_SHOPPING_FINAL_OFFLINE_BETA_AUDIT_VERSION,
    AUDIT_NAME,
    buildGlobalShoppingFinalOfflineBetaAudit,
    evaluateGlobalShoppingFinalOfflineBetaAudit,
    buildGlobalShoppingFinalOfflineBetaAuditRows,
    buildGlobalShoppingFinalOfflineBetaAuditSections,
    buildGlobalShoppingFinalOfflineBetaAuditDraft,
    sanitizeGlobalShoppingFinalOfflineBetaAudit
  };
})();
