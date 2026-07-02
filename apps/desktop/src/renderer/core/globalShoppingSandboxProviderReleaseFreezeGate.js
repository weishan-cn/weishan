;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SANDBOX_PROVIDER_RELEASE_FREEZE_GATE_VERSION = "4.0.1";
  const GATE_NAME = "global_shopping_sandbox_provider_release_freeze_gate_v1";

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
  function gate(gateId, label, status, severity, ownerRole, summary, caveat) {
    return {
      gateId:text(gateId),
      label:text(label),
      status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review",
      severity:/^(hard_blocker|review_required|info)$/.test(severity) ? severity : "review_required",
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

  function buildGlobalShoppingSandboxProviderReleaseFreezeGates(input) {
    const safe = obj(input);
    const governanceAuditConsoleSummary = resolveSummary(safe, "governanceAuditConsoleSummary", "WeishanGlobalShoppingProviderGovernanceAuditConsole", "buildGlobalShoppingProviderGovernanceAuditConsole");
    const humanPilotReadinessLedgerSummary = resolveSummary(safe, "humanPilotReadinessLedgerSummary", "WeishanGlobalShoppingHumanPilotReadinessLedger", "buildGlobalShoppingHumanPilotReadinessLedger");
    const productionBlockerMatrixSummary = resolveSummary(safe, "productionBlockerMatrixSummary", "WeishanGlobalShoppingProductionBlockerMatrix", "buildGlobalShoppingProductionBlockerMatrix");
    const providerKillSwitchDrillSummary = resolveSummary(safe, "providerKillSwitchDrillSummary", "WeishanGlobalShoppingProviderKillSwitchDrill", "buildGlobalShoppingProviderKillSwitchDrill");
    const complianceEvidencePackSummary = resolveSummary(safe, "complianceEvidencePackSummary", "WeishanGlobalShoppingComplianceEvidencePack", "buildGlobalShoppingComplianceEvidencePack");
    const verifyE2eBuildSummary = obj(safe.verifyE2eBuildSummary || safe.verifySummary || {});
    const verifyStatus = text(verifyE2eBuildSummary.status || "");

    return clone([
      gate("governance_audit_console", "Governance Audit Console", normalize(governanceAuditConsoleSummary), "review_required", "operator", labelOf(governanceAuditConsoleSummary, "治理审计仍需复核"), "只展示治理审计，不改 git。"),
      gate("human_pilot_readiness_ledger", "Human Pilot Readiness Ledger", normalize(humanPilotReadinessLedgerSummary), "review_required", "release_manager", labelOf(humanPilotReadinessLedgerSummary, "Human Pilot 准备仍需复核"), "只展示人工准备，不启动 pilot。"),
      gate("production_blocker_matrix", "Production Blocker Matrix", normalize(productionBlockerMatrixSummary), "hard_blocker", "security", labelOf(productionBlockerMatrixSummary, "Production 阻断矩阵仍需复核"), "只展示阻断条件，不禁用 provider。"),
      gate("provider_kill_switch_drill", "Provider Kill Switch Drill", normalize(providerKillSwitchDrillSummary), "hard_blocker", "incident_commander", labelOf(providerKillSwitchDrillSummary, "Kill Switch 演练仍需复核"), "只做 mock 演练，不停服务。"),
      gate("compliance_evidence_pack", "Compliance Evidence Pack", normalize(complianceEvidencePackSummary), "hard_blocker", "security", labelOf(complianceEvidencePackSummary, "合规证据仍需复核"), "只读证据摘要，不导出文件。"),
      gate("verify_e2e_build_summary", "Verify / E2E / Build Summary", !present(verifyE2eBuildSummary) ? "needs_review" : ((verifyStatus === "blocked" || verifyStatus === "fail" || verifyStatus === "failed_safe") ? "blocked" : ((verifyStatus === "ready" || verifyStatus === "pass" || verifyStatus === "all_passed") ? "pass" : "warning")), "hard_blocker", "qa", text(verifyE2eBuildSummary.summaryLabel || verifyE2eBuildSummary.resultLabel || verifyStatus || "验证链仍需复核"), "只展示验证摘要，不创建 tag，不 push。")
    ]);
  }

  function buildGlobalShoppingSandboxProviderReleaseFreezeRows(input) {
    const safe = obj(input);
    const evaluation = Array.isArray(safe.freezeGates) ? {
      freezeGates:safe.freezeGates.slice(),
      userFacingSummary:obj(safe.userFacingSummary),
      status:text(safe.status || "needs_review")
    } : evaluateGlobalShoppingSandboxProviderReleaseFreezeGate(input);
    return clone([
      row("release_freeze_status", "Release Freeze 状态", obj(evaluation.userFacingSummary).resultLabel || "Release Freeze 仍需复核", evaluation.status === "ready" ? "pass" : (evaluation.status === "blocked" ? "blocked" : "warning")),
      row("release_freeze_git_boundary", "Git 边界", "Release Freeze Gate 不改 git、不创建 tag、不 push。", "pass"),
      row("release_freeze_runtime_boundary", "运行边界", "不改配置、不停服务、不启用 provider、不读 key、不联网。", "pass")
    ].concat(toArray(evaluation.freezeGates).map(function (item) {
      return row(item.gateId, item.label, item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingSandboxProviderReleaseFreezeGate(input) {
    const safe = obj(input);
    const freezeGates = buildGlobalShoppingSandboxProviderReleaseFreezeGates(safe);
    const blockedBoundary = safe.modifyGit === true || safe.createTag === true || safe.deleteTag === true || safe.push === true ||
      safe.modifyRuntimeConfig === true || safe.stopService === true || safe.disableProvider === true || safe.startRealProvider === true ||
      safe.enableProvider === true || safe.readApiKey === true || safe.network === true || safe.generateEndpoint === true;
    const hardBlockers = freezeGates.filter(function (item) { return item.status === "blocked"; });
    const reviewGates = freezeGates.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = blockedBoundary || hardBlockers.length ? "blocked" :
      (reviewGates.length ? "needs_review" : "ready");
    const freezeSummary = {
      hasGovernanceAuditConsole:freezeGates[0].status !== "needs_review",
      hasHumanPilotReadinessLedger:freezeGates[1].status !== "needs_review",
      hasProductionBlockerMatrix:freezeGates[2].status !== "needs_review",
      hasKillSwitchDrill:freezeGates[3].status !== "needs_review",
      hasComplianceEvidencePack:freezeGates[4].status !== "needs_review",
      hasVerifyE2eBuildSummary:freezeGates[5].status !== "needs_review",
      freezeGateCount:freezeGates.length,
      hardBlockerCount:hardBlockers.length,
      needsReviewGateCount:reviewGates.length,
      readyForManualReleaseDecision:status === "ready",
      manualReleaseDecisionRequired:true
    };

    return clone({
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_PROVIDER_RELEASE_FREEZE_GATE_VERSION,
      status:status,
      freezeBoundary:{
        gateId:"global-shopping-sandbox-provider-release-freeze-gate",
        gateMode:"freeze_gate_only",
        freezeGateOnly:true,
        readinessOnly:true,
        mockOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canModifyGit:false,
        canCreateTag:false,
        canDeleteTag:false,
        canPush:false,
        canModifyRuntimeConfig:false,
        canStopService:false,
        canDisableProvider:false,
        canStartRealProvider:false,
        canEnableProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canGenerateEndpoint:false
      },
      freezeSummary:freezeSummary,
      freezeGates:freezeGates,
      freezeHealth:{
        noGitModification:safe.modifyGit !== true,
        noTagCreation:safe.createTag !== true,
        noTagDeletion:safe.deleteTag !== true,
        noPush:safe.push !== true,
        noRuntimeConfigModification:safe.modifyRuntimeConfig !== true,
        noServiceStop:safe.stopService !== true,
        noProviderDisablement:safe.disableProvider !== true,
        noRealProviderStart:safe.startRealProvider !== true,
        noProviderEnablement:safe.enableProvider !== true,
        noApiKeyRead:safe.readApiKey !== true,
        noNetworkCall:safe.network !== true,
        noEndpointGeneration:safe.generateEndpoint !== true,
        manualReleaseDecisionRequired:true,
        noForbiddenClaims:true
      },
      rows:buildGlobalShoppingSandboxProviderReleaseFreezeRows({
        freezeGates:freezeGates,
        userFacingSummary:{
          resultLabel:status === "ready" ? "Release Freeze Gate 已准备" : (status === "blocked" ? "Release Freeze 已阻断" : "Release Freeze 仍需复核")
        },
        status:status
      }),
      blockedReasons:[]
        .concat(blockedBoundary ? [
          safe.modifyGit === true ? "git_modification_detected" : "",
          safe.createTag === true ? "tag_creation_detected" : "",
          safe.deleteTag === true ? "tag_deletion_detected" : "",
          safe.push === true ? "push_detected" : "",
          safe.modifyRuntimeConfig === true ? "runtime_config_modification_detected" : "",
          safe.stopService === true ? "service_stop_detected" : "",
          safe.disableProvider === true ? "provider_disablement_detected" : "",
          safe.startRealProvider === true ? "real_provider_start_detected" : "",
          safe.enableProvider === true ? "provider_enablement_detected" : "",
          safe.readApiKey === true ? "api_key_read_detected" : "",
          safe.network === true ? "network_detected" : "",
          safe.generateEndpoint === true ? "endpoint_generation_detected" : ""
        ].filter(Boolean) : [])
        .concat(hardBlockers.map(function (item) { return item.gateId + "_blocked"; })),
      userFacingSummary:{
        title:"Sandbox Provider Release Freeze Gate",
        resultLabel:status === "ready" ? "Release Freeze Gate 已准备" : (status === "blocked" ? "Release Freeze 已阻断" : "Release Freeze 仍需复核"),
        caveat:"该闸门只展示 sandbox provider 发布冻结判断，不改 git，不创建 tag，不 push，不修改配置。"
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingSandboxProviderReleaseFreezeGateAuditDraft(input) {
    const gateSummary = evaluateGlobalShoppingSandboxProviderReleaseFreezeGate(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_SANDBOX_PROVIDER_RELEASE_FREEZE_GATE_AUDIT_DRAFT",
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_PROVIDER_RELEASE_FREEZE_GATE_VERSION,
      status:gateSummary.status,
      freezeGateCount:obj(gateSummary.freezeSummary).freezeGateCount || 0,
      hardBlockerCount:obj(gateSummary.freezeSummary).hardBlockerCount || 0,
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

  function sanitizeGlobalShoppingSandboxProviderReleaseFreezeGate(gateSummary) {
    return evaluateGlobalShoppingSandboxProviderReleaseFreezeGate(gateSummary || {});
  }

  function buildGlobalShoppingSandboxProviderReleaseFreezeGate(input) {
    try {
      return sanitizeGlobalShoppingSandboxProviderReleaseFreezeGate(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingSandboxProviderReleaseFreezeGate({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingSandboxProviderReleaseFreezeGate = {
    GLOBAL_SHOPPING_SANDBOX_PROVIDER_RELEASE_FREEZE_GATE_VERSION,
    GATE_NAME,
    buildGlobalShoppingSandboxProviderReleaseFreezeGate,
    evaluateGlobalShoppingSandboxProviderReleaseFreezeGate,
    buildGlobalShoppingSandboxProviderReleaseFreezeRows,
    buildGlobalShoppingSandboxProviderReleaseFreezeGates,
    buildGlobalShoppingSandboxProviderReleaseFreezeGateAuditDraft,
    sanitizeGlobalShoppingSandboxProviderReleaseFreezeGate
  };
})();
