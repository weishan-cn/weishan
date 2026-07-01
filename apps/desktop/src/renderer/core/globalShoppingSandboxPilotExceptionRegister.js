;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SANDBOX_PILOT_EXCEPTION_REGISTER_VERSION = "2.8.0";
  const REGISTER_NAME = "global_shopping_sandbox_pilot_exception_register_v1";

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
  function labelOf(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function category(categoryId, label, status, severity, ownerRole, summary, caveat) {
    return {
      categoryId:text(categoryId),
      label:text(label),
      status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review",
      severity:/^(hard_exception|review_required|info)$/.test(severity) ? severity : "review_required",
      ownerRole:text(ownerRole || "human_reviewer"),
      summary:text(summary),
      caveat:text(caveat),
      redacted:true
    };
  }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId),
      label:text(label),
      value:text(value),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
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
  function normalize(summary) {
    const status = statusOf(summary);
    if (!present(summary)) return "needs_review";
    if (status === "blocked" || status === "fail" || status === "failed_safe") return "blocked";
    if (status === "ready" || status === "pass" || status === "approved" || status === "allowed" || status === "clear") return "pass";
    return "warning";
  }

  function buildGlobalShoppingSandboxPilotExceptionCategories(input) {
    const safe = obj(input);
    const manualDecisionRoomSummary = resolveSummary(safe, "manualDecisionRoomSummary", "WeishanGlobalShoppingManualGovernanceReleaseDecisionRoom", "buildGlobalShoppingManualGovernanceReleaseDecisionRoom");
    const productionBlockerMatrixSummary = resolveSummary(safe, "productionBlockerMatrixSummary", "WeishanGlobalShoppingProductionBlockerMatrix", "buildGlobalShoppingProductionBlockerMatrix");
    const releaseFreezeGateSummary = resolveSummary(safe, "releaseFreezeGateSummary", "WeishanGlobalShoppingSandboxProviderReleaseFreezeGate", "buildGlobalShoppingSandboxProviderReleaseFreezeGate");
    const humanPilotLedgerSummary = resolveSummary(safe, "humanPilotLedgerSummary", "WeishanGlobalShoppingHumanPilotReadinessLedger", "buildGlobalShoppingHumanPilotReadinessLedger");
    const killSwitchDrillSummary = resolveSummary(safe, "killSwitchDrillSummary", "WeishanGlobalShoppingProviderKillSwitchDrill", "buildGlobalShoppingProviderKillSwitchDrill");
    return clone([
      category("manual_decision_room", "Manual Governance Release 决策室", normalize(manualDecisionRoomSummary), "review_required", "release_manager", labelOf(manualDecisionRoomSummary, "人工发布决策仍需复核"), "决策室只展示状态，不保存决策。"),
      category("production_blocker_matrix", "Production Blocker Matrix", normalize(productionBlockerMatrixSummary), "hard_exception", "security", labelOf(productionBlockerMatrixSummary, "Production 阻断矩阵仍需复核"), "只展示阻断条件，不改配置。"),
      category("release_freeze_gate", "Release Freeze Gate", normalize(releaseFreezeGateSummary), "hard_exception", "security", labelOf(releaseFreezeGateSummary, "Release Freeze 仍需复核"), "只展示冻结条件，不改 git。"),
      category("human_pilot_ledger", "Human Pilot 准备台账", normalize(humanPilotLedgerSummary), "review_required", "operator", labelOf(humanPilotLedgerSummary, "Human Pilot 准备仍需复核"), "只读台账，不保存审批结果。"),
      category("kill_switch_drill", "Kill Switch Drill", normalize(killSwitchDrillSummary), "hard_exception", "incident_commander", labelOf(killSwitchDrillSummary, "Kill Switch 演练仍需复核"), "只做 mock 演练，不停服务。")
    ]);
  }

  function buildGlobalShoppingSandboxPilotExceptionRows(input) {
    const safe = obj(input);
    const evaluation = Array.isArray(safe.exceptionCategories) ? {
      exceptionCategories:safe.exceptionCategories.slice(),
      userFacingSummary:obj(safe.userFacingSummary),
      status:text(safe.status || "needs_review")
    } : evaluateGlobalShoppingSandboxPilotExceptionRegister(input);
    return clone([
      row("sandbox_exception_status", "例外登记状态", obj(evaluation.userFacingSummary).resultLabel || "例外登记仍需复核", evaluation.status === "ready" ? "pass" : (evaluation.status === "blocked" ? "blocked" : "warning")),
      row("sandbox_exception_boundary", "登记边界", "不持久化例外，不创建审批任务，不发邮件。", "pass"),
      row("sandbox_exception_runtime", "运行边界", "不启动 pilot / provider，不改配置，不改 git。", "pass")
    ].concat(toArray(evaluation.exceptionCategories).map(function (item) {
      return row(item.categoryId, item.label, item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingSandboxPilotExceptionRegister(input) {
    const safe = obj(input);
    const exceptionCategories = buildGlobalShoppingSandboxPilotExceptionCategories(safe);
    const blockedBoundary = safe.persistException === true || safe.persistApprovalResult === true || safe.createApprovalTask === true ||
      safe.sendEmail === true || safe.openExternalDocument === true || safe.startPilot === true || safe.startRealProvider === true ||
      safe.enableProvider === true || safe.modifyRuntimeConfig === true || safe.modifyGit === true;
    const hardExceptions = exceptionCategories.filter(function (item) { return item.status === "blocked"; });
    const reviewExceptions = exceptionCategories.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = blockedBoundary || hardExceptions.length ? "blocked" : (reviewExceptions.length ? "needs_review" : "ready");
    const exceptionSummary = {
      hasManualDecisionRoom:exceptionCategories[0].status !== "needs_review",
      hasProductionBlockerMatrix:exceptionCategories[1].status !== "needs_review",
      hasReleaseFreezeGate:exceptionCategories[2].status !== "needs_review",
      hasHumanPilotLedger:exceptionCategories[3].status !== "needs_review",
      hasKillSwitchDrill:exceptionCategories[4].status !== "needs_review",
      exceptionCount:exceptionCategories.length,
      hardExceptionCount:hardExceptions.length,
      reviewRequiredExceptionCount:reviewExceptions.length,
      readyForReadinessSignOffPacket:status === "ready",
      manualExceptionApprovalRequired:true
    };
    return clone({
      registerName:REGISTER_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_PILOT_EXCEPTION_REGISTER_VERSION,
      status:status,
      exceptionBoundary:{
        registerId:"global-shopping-sandbox-pilot-exception-register",
        registerMode:"exception_register_only",
        exceptionRegisterOnly:true,
        readinessOnly:true,
        mockOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canPersistException:false,
        canPersistApprovalResult:false,
        canCreateApprovalTask:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canStartPilot:false,
        canStartRealProvider:false,
        canEnableProvider:false,
        canModifyRuntimeConfig:false,
        canModifyGit:false
      },
      exceptionSummary:exceptionSummary,
      exceptionCategories:exceptionCategories,
      exceptionHealth:{
        noExceptionPersistence:safe.persistException !== true,
        noApprovalPersistence:safe.persistApprovalResult !== true,
        noApprovalTaskCreation:safe.createApprovalTask !== true,
        noEmailSend:safe.sendEmail !== true,
        noExternalDocumentOpen:safe.openExternalDocument !== true,
        noPilotStart:safe.startPilot !== true,
        noRealProviderStart:safe.startRealProvider !== true,
        noProviderEnablement:safe.enableProvider !== true,
        noRuntimeConfigModification:safe.modifyRuntimeConfig !== true,
        noGitModification:safe.modifyGit !== true,
        manualExceptionApprovalRequired:true,
        noForbiddenClaims:true
      },
      rows:buildGlobalShoppingSandboxPilotExceptionRows({
        exceptionCategories:exceptionCategories,
        userFacingSummary:{
          resultLabel:status === "ready" ? "例外登记簿已准备" : (status === "blocked" ? "例外登记已阻断" : "例外登记仍需复核")
        },
        status:status
      }),
      blockedReasons:[]
        .concat(blockedBoundary ? [
          safe.persistException === true ? "exception_persistence_detected" : "",
          safe.persistApprovalResult === true ? "approval_persistence_detected" : "",
          safe.createApprovalTask === true ? "approval_task_creation_detected" : "",
          safe.sendEmail === true ? "email_send_detected" : "",
          safe.openExternalDocument === true ? "external_document_open_detected" : "",
          safe.startPilot === true ? "pilot_start_detected" : "",
          safe.startRealProvider === true ? "real_provider_start_detected" : "",
          safe.enableProvider === true ? "provider_enablement_detected" : "",
          safe.modifyRuntimeConfig === true ? "runtime_config_modification_detected" : "",
          safe.modifyGit === true ? "git_modification_detected" : ""
        ].filter(Boolean) : [])
        .concat(hardExceptions.map(function (item) { return item.categoryId + "_blocked"; })),
      userFacingSummary:{
        title:"Sandbox Pilot 例外登记簿",
        resultLabel:status === "ready" ? "例外登记簿已准备" : (status === "blocked" ? "例外登记已阻断" : "例外登记仍需复核"),
        caveat:"该登记簿只展示 sandbox pilot 例外状态，不持久化例外，不创建审批任务，不启动 pilot。"
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingSandboxPilotExceptionRegisterAuditDraft(input) {
    const register = evaluateGlobalShoppingSandboxPilotExceptionRegister(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_SANDBOX_PILOT_EXCEPTION_REGISTER_AUDIT_DRAFT",
      registerName:REGISTER_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_PILOT_EXCEPTION_REGISTER_VERSION,
      status:register.status,
      exceptionCount:obj(register.exceptionSummary).exceptionCount || 0,
      hardExceptionCount:obj(register.exceptionSummary).hardExceptionCount || 0,
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

  function sanitizeGlobalShoppingSandboxPilotExceptionRegister(register) {
    return evaluateGlobalShoppingSandboxPilotExceptionRegister(register || {});
  }

  function buildGlobalShoppingSandboxPilotExceptionRegister(input) {
    try {
      return sanitizeGlobalShoppingSandboxPilotExceptionRegister(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingSandboxPilotExceptionRegister({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingSandboxPilotExceptionRegister = {
    GLOBAL_SHOPPING_SANDBOX_PILOT_EXCEPTION_REGISTER_VERSION,
    REGISTER_NAME,
    buildGlobalShoppingSandboxPilotExceptionRegister,
    evaluateGlobalShoppingSandboxPilotExceptionRegister,
    buildGlobalShoppingSandboxPilotExceptionRows,
    buildGlobalShoppingSandboxPilotExceptionCategories,
    buildGlobalShoppingSandboxPilotExceptionRegisterAuditDraft,
    sanitizeGlobalShoppingSandboxPilotExceptionRegister
  };
})();
