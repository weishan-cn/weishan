const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowSafetyRegressionSentinel.js", "apps/desktop/src/renderer/core/flightWorkflowOperatorConsole.js"]);
  const api = windowRef.WeishanFlightWorkflowOperatorConsole;
  assert.equal(api.FLIGHT_WORKFLOW_OPERATOR_CONSOLE_VERSION, "2.3.5");
  const base = { workflowId:"wf1", workflowStateSummary:{ workflowId:"wf1" }, topCandidates:[{ providerName:"sandbox", bookingUrl:null }], selectedCandidate:{ providerName:"sandbox" }, auditReviewSummary:{ status:"ready", auditHealth:{ overall:"pass" } }, humanReviewChecklistSummary:{ status:"ready" }, finalSafeHandoffPacketSummary:{ status:"ready" }, handoffPacketPolicyDecision:{ status:"allowed" }, safetyRegressionSummary:{ status:"pass", checks:[] }, eventLedgerSummary:{ recentEvents:[{ eventType:"handoff_packet_prepared", status:"ready" }] }, blockedActions:[] };
  const ready = api.buildFlightWorkflowOperatorConsole(base);
  assert.equal(ready.consoleName, "flight_workflow_operator_console_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "可以继续只读流程");
  assert.equal(ready.nextOperatorAction.enabled, true);
  assert.equal(JSON.stringify(ready.sections.map((s) => s.sectionId)), JSON.stringify(["workflow_status", "safety_status", "recent_events", "blocked_actions", "handoff_readiness", "rc_review", "global_shopping_goal", "global_shopping_price", "global_shopping_handoff", "global_shopping_session_recap", "global_shopping_sandbox_provider_planning", "global_shopping_provider_integration_prep", "global_shopping_provider_mock_runtime", "global_shopping_provider_launch_readiness", "global_shopping_provider_launch_simulation", "global_shopping_provider_pilot_control", "global_shopping_decision_review", "pilot_ops", "pilot_readiness", "pilot_onboarding", "issue_review", "issue_pattern"]));
  assert.equal(ready.bookingUrl, null);
  assert.ok(ready.sections.some((section) => section.sectionId === "pilot_ops"));
  const globalRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    legalProviderFixtureSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider fixture 已准备" } },
    providerCredentialSafetySummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 凭据边界安全" } },
    sandboxPriceFeedSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox 价格 Feed 已准备" } },
    sameItemMatcherSummary:{ status:"ready", userFacingSummary:{ resultLabel:"同款识别结构已准备" } },
    duplicateCandidateMergerSummary:{ status:"merged", userFacingSummary:{ resultLabel:"重复候选已合并" } },
    coveredLowestCandidateBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"已覆盖来源候选价合并已准备" } },
    safeToProceedWithDeepLinkSafetyGate:true
  })).sections.find((section) => section.sectionId === "global_shopping_price");
  assert.ok(globalRows.rows.some((item) => item.label === "同款候选识别"));
  assert.ok(globalRows.rows.some((item) => item.label === "Provider fixture"));
  assert.ok(globalRows.rows.some((item) => item.label === "凭据安全"));
  assert.ok(globalRows.rows.some((item) => item.label === "Sandbox 价格 Feed"));
  assert.ok(globalRows.rows.some((item) => item.label === "重复候选合并"));
  assert.ok(globalRows.rows.some((item) => item.label === "已覆盖来源候选价合并"));
  const handoffRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    externalDeepLinkSafetySummary:{ status:"safe", userFacingSummary:{ resultLabel:"跳转安全结构已准备" } },
    searchParameterPrefillSummary:{ status:"safe", userFacingSummary:{ resultLabel:"预填边界安全" } },
    jumpToPlatformHandoffPreviewSummary:{ status:"ready", title:"跳转至平台查看", caveat:"本轮仅展示只读跳转预览，不打开真实平台" },
    safeToProceedWithSandboxDeepLinkCandidate:true
  })).sections.find((section) => section.sectionId === "global_shopping_handoff");
  assert.ok(handoffRows.rows.some((item) => item.label === "跳转安全"));
  assert.ok(handoffRows.rows.some((item) => item.label === "预填边界"));
  assert.ok(handoffRows.rows.some((item) => item.label === "跳转预览"));
  const decisionReviewRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    sandboxCandidateComparisonWorkbenchSummary:{ status:"ready", userFacingSummary:{ resultLabel:"候选对比已准备" } },
    providerEvidenceComparisonMatrixSummary:{ status:"ready", userFacingSummary:{ resultLabel:"证据矩阵已准备" } },
    readOnlyHandoffReadinessDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"交接演练已准备" } },
    sandboxDecisionReviewViewModelSummary:{ status:"ready", title:"Sandbox 候选决策复核" },
    safeToProceedWithSandboxDecisionReview:true
  })).sections.find((section) => section.sectionId === "global_shopping_decision_review");
  assert.ok(decisionReviewRows.rows.some((item) => item.label === "候选对比"));
  assert.ok(decisionReviewRows.rows.some((item) => item.label === "证据矩阵"));
  assert.ok(decisionReviewRows.rows.some((item) => item.label === "交接演练"));
  assert.ok(decisionReviewRows.rows.some((item) => item.label === "安全红线" && item.value === "候选推荐不构成价格承诺"));
  const recapRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    readOnlyCommerceSessionRecapCenterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"只读全球购会话总结已准备", redacted:true } },
    userTrustClosureSummarySummary:{ status:"ready", userFacingSummary:{ resultLabel:"用户信任闭环摘要已准备", redacted:true } },
    nextFeatureReadinessGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"下一功能准备闸门已准备", redacted:true } },
    commerceSessionRecapViewModelSummary:{ status:"ready", title:"只读全球购会话总结与下一步准备", redacted:true },
    safeToProceedWithReadOnlyProviderSandboxPlanning:true
  })).sections.find((section) => section.sectionId === "global_shopping_session_recap");
  assert.ok(recapRows.rows.some((item) => item.label === "会话总结"));
  assert.ok(recapRows.rows.some((item) => item.label === "信任闭环"));
  assert.ok(recapRows.rows.some((item) => item.label === "下一功能准备"));
  assert.ok(recapRows.rows.some((item) => item.label === "安全红线" && item.value === "下一步仍需人工审批"));
  const sandboxPlanningRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    readOnlySandboxProviderIntegrationBlueprintSummary:{ status:"ready", userFacingSummary:{ resultLabel:"接入蓝图已准备", redacted:true } },
    credentialIsolationReadinessBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"凭证隔离准备度已通过", redacted:true } },
    providerContractSelectionBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 选择板已准备", redacted:true } },
    sandboxProviderPlanningViewModelSummary:{ status:"ready", title:"只读 Sandbox Provider 接入规划", redacted:true },
    safeToProceedWithProviderLegalAndCredentialReview:true
  })).sections.find((section) => section.sectionId === "global_shopping_sandbox_provider_planning");
  assert.ok(sandboxPlanningRows.rows.some((item) => item.label === "接入蓝图"));
  assert.ok(sandboxPlanningRows.rows.some((item) => item.label === "凭证隔离"));
  assert.ok(sandboxPlanningRows.rows.some((item) => item.label === "Provider 选择"));
  assert.ok(sandboxPlanningRows.rows.some((item) => item.label === "安全红线" && item.value === "下一步仍需人工法务与安全审批"));
  const providerPrepRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    providerLegalReviewDossierSummary:{ status:"ready", userFacingSummary:{ resultLabel:"法务审查档案已准备", redacted:true } },
    credentialVaultInterfaceStubSummary:{ status:"ready", userFacingSummary:{ resultLabel:"凭证接口桩已准备", redacted:true } },
    sandboxAdapterContractTestbedSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Adapter 合同测试台已准备", redacted:true } },
    providerIntegrationPrepViewModelSummary:{ status:"ready", title:"Provider 接入前准备", redacted:true },
    safeToProceedWithProviderSandboxContractImplementation:true
  })).sections.find((section) => section.sectionId === "global_shopping_provider_integration_prep");
  assert.ok(providerPrepRows.rows.some((item) => item.label === "法务审查"));
  assert.ok(providerPrepRows.rows.some((item) => item.label === "凭证接口桩"));
  assert.ok(providerPrepRows.rows.some((item) => item.label === "Adapter 合同测试"));
  assert.ok(providerPrepRows.rows.some((item) => item.label === "安全红线" && item.value === "下一步仍需人工安全审批"));
  const mockRuntimeRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    sandboxProviderMockRuntimeSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Provider Mock Runtime 已准备", redacted:true }, redacted:true },
    vaultBoundaryContractSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Vault 边界合同已准备", redacted:true }, redacted:true },
    legalApprovalWorkflowBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"法务审批流程板已准备", redacted:true }, redacted:true },
    providerMockRuntimeViewModelSummary:{ status:"ready", title:"Provider Mock Runtime 与审批准备", redacted:true },
    safeToProceedWithMockAdapterRuntimeHardening:true
  })).sections.find((section) => section.sectionId === "global_shopping_provider_mock_runtime");
  assert.ok(mockRuntimeRows.rows.some((item) => item.label === "Mock Runtime"));
  assert.ok(mockRuntimeRows.rows.some((item) => item.label === "Vault 边界"));
  assert.ok(mockRuntimeRows.rows.some((item) => item.label === "法务审批流程"));
  assert.ok(mockRuntimeRows.rows.some((item) => item.label === "安全红线" && item.value === "下一步仍需人工审批"));
  const launchReadinessRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    mockProviderAdapterRegistryRuntimeSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock Adapter 注册运行时已准备", redacted:true }, redacted:true },
    providerContractReplayHarnessSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 合同回放器已准备", redacted:true }, redacted:true },
    providerLaunchReadinessBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 启动准备总闸门已准备", redacted:true }, redacted:true },
    providerLaunchReadinessViewModelSummary:{ status:"ready", title:"Provider 启动准备与合同回放", redacted:true },
    safeToProceedWithHumanProviderSandboxApproval:true
  })).sections.find((section) => section.sectionId === "global_shopping_provider_launch_readiness");
  assert.ok(launchReadinessRows.rows.some((item) => item.label === "Mock Adapter 注册"));
  assert.ok(launchReadinessRows.rows.some((item) => item.label === "合同回放"));
  assert.ok(launchReadinessRows.rows.some((item) => item.label === "启动准备"));
  assert.ok(launchReadinessRows.rows.some((item) => item.label === "安全红线" && item.value === "真实 sandbox provider 仍需人工审批"));
  const pilotControlRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    providerSandboxPilotControlRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Pilot 控制室已准备", redacted:true }, redacted:true },
    mockProviderIncidentDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock 事故演练已准备", redacted:true }, redacted:true },
    productionBlockerMatrixSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Production 阻断矩阵已准备", redacted:true }, redacted:true },
    providerPilotControlViewModelSummary:{ status:"ready", title:"Provider Sandbox Pilot 控制与阻断", redacted:true },
    safeToProceedWithHumanControlledSandboxProviderPilotPlan:true
  })).sections.find((section) => section.sectionId === "global_shopping_provider_pilot_control");
  assert.ok(pilotControlRows.rows.some((item) => item.label === "Pilot 控制室"));
  assert.ok(pilotControlRows.rows.some((item) => item.label === "事故演练"));
  assert.ok(pilotControlRows.rows.some((item) => item.label === "阻断矩阵"));
  assert.ok(pilotControlRows.rows.some((item) => item.label === "安全红线" && item.value === "Human-controlled pilot 仍需人工审批"));
  const rcReady = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, { rcCandidateReviewSummary:{ status:"ready_for_review", userFacingSummary:{ resultLabel:"可以开始 RC 复核", redacted:true }, safeToStartRcReview:true, redacted:true }, rcEvidenceReviewSummary:{ status:"complete", userFacingSummary:{ resultLabel:"证据完整", redacted:true }, redacted:true }, rcReviewStatus:"ready_for_review", rcEvidenceStatus:"complete", safeToStartRcReview:true }));
  assert.ok(rcReady.sections.some((section) => section.sectionId === "rc_review"));
  assert.equal(rcReady.safeToStartRcReview, true);
  const pilotReady = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, { betaExpansionGateSummary:{ status:"approved", redacted:true }, publicPilotChecklistSummary:{ status:"ready", redacted:true }, pilotReadinessSummary:{ status:"ready", redacted:true }, safeForSmallPublicPilot:true, pilotNextStep:"可以小范围只读试点" }));
  assert.equal(pilotReady.pilotReadinessSummary.status, "ready");
  assert.equal(pilotReady.safeForSmallPublicPilot, true);
  const onboardingReady = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, { pilotOnboardingSummary:{ status:"allowed", guardName:"flight_workflow_public_pilot_onboarding_guard_v1", redacted:true }, readOnlyConsentSummary:{ status:"accepted", consentFlowName:"flight_workflow_read_only_user_consent_flow_v1", redacted:true }, pilotEntryStatus:"allowed", canEnterReadOnlyPilot:true, pilotConsentRequired:false }));
  assert.equal(onboardingReady.pilotOnboardingSummary.status, "allowed");
  assert.equal(onboardingReady.readOnlyConsentSummary.status, "accepted");
  const warning = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, { humanReviewChecklistSummary:{ status:"needs_review" } }));
  assert.equal(warning.status, "warning");
  const auditBlocked = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, { auditReviewSummary:{ status:"blocked", auditHealth:{ overall:"blocked" } } }));
  assert.equal(auditBlocked.status, "blocked");
  const packetBlocked = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, { finalSafeHandoffPacketSummary:{ status:"blocked" } }));
  assert.equal(packetBlocked.status, "blocked");
  const sentinelFail = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, { safetyRegressionSummary:{ status:"fail", checks:[] } }));
  assert.equal(sentinelFail.status, "blocked");
  assert.equal(api.buildFlightWorkflowOperatorConsole(null).status, "failed_safe");
  const json = JSON.stringify(api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, { token:"abc", bookingUrl:"https://blocked.example" })));
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("FLIGHT_WORKFLOW_OPERATOR_CONSOLE PASS");
}
main();
