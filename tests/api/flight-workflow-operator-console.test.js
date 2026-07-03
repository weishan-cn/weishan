const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowSafetyRegressionSentinel.js", "apps/desktop/src/renderer/core/flightWorkflowOperatorConsole.js"]);
  const api = windowRef.WeishanFlightWorkflowOperatorConsole;
  assert.equal(api.FLIGHT_WORKFLOW_OPERATOR_CONSOLE_VERSION, "4.0.9");
  const base = { workflowId:"wf1", workflowStateSummary:{ workflowId:"wf1" }, topCandidates:[{ providerName:"sandbox", bookingUrl:null }], selectedCandidate:{ providerName:"sandbox" }, auditReviewSummary:{ status:"ready", auditHealth:{ overall:"pass" } }, humanReviewChecklistSummary:{ status:"ready" }, finalSafeHandoffPacketSummary:{ status:"ready" }, handoffPacketPolicyDecision:{ status:"allowed" }, safetyRegressionSummary:{ status:"pass", checks:[] }, eventLedgerSummary:{ recentEvents:[{ eventType:"handoff_packet_prepared", status:"ready" }] }, blockedActions:[] };
  const ready = api.buildFlightWorkflowOperatorConsole(base);
  assert.equal(ready.consoleName, "flight_workflow_operator_console_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "可以继续只读流程");
  assert.equal(ready.nextOperatorAction.enabled, true);
  assert.equal(JSON.stringify(ready.sections.map((s) => s.sectionId)), JSON.stringify(["workflow_status", "safety_status", "recent_events", "blocked_actions", "handoff_readiness", "rc_review", "global_shopping_goal", "global_shopping_public_beta_review", "global_shopping_price", "global_shopping_handoff", "global_shopping_session_recap", "global_shopping_sandbox_provider_planning", "global_shopping_provider_integration_prep", "global_shopping_provider_mock_runtime", "global_shopping_provider_launch_readiness", "global_shopping_provider_launch_simulation", "global_shopping_provider_pilot_control", "global_shopping_provider_pilot_governance", "global_shopping_provider_governance_release", "global_shopping_provider_manual_release", "global_shopping_provider_sandbox_milestone", "global_shopping_provider_sandbox_release_candidate", "global_shopping_provider_certification", "global_shopping_provider_offline_release", "global_shopping_provider_offline_launch", "global_shopping_provider_final_launch_review", "global_shopping_provider_final_review_console", "global_shopping_provider_final_safety_review", "global_shopping_provider_governance_closure_review", "global_shopping_provider_distribution_readiness_review", "global_shopping_provider_distribution_closure_review", "global_shopping_provider_trust_closure_review", "global_shopping_provider_public_release_review", "global_shopping_provider_launch_readiness_final_review", "global_shopping_provider_sandbox_activation", "global_shopping_decision_review", "pilot_ops", "pilot_readiness", "pilot_onboarding", "issue_review", "issue_pattern"]));
  assert.equal(ready.bookingUrl, null);
  assert.ok(ready.sections.some((section) => section.sectionId === "pilot_ops"));
  const launchControlRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    providerLaunchAuditSnapshotSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider Launch Audit Snapshot 已准备", redacted:true } },
    offlinePolicyReplayCenterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Offline Policy Replay Center 已准备", redacted:true } },
    humanActivationFinalDossierSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Human Activation Final Dossier 已准备", redacted:true } },
    adapterLaunchBoundaryVerifierSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Adapter Launch Boundary Verifier 已准备", redacted:true } },
    providerFinalLaunchReviewViewModelSummary:{ status:"ready", title:"Provider Final Launch Review", redacted:true },
    safeToProceedWithHumanFinalLaunchReview:true
  })).sections.find((section) => section.sectionId === "global_shopping_provider_final_launch_review");
  assert.ok(launchControlRows.rows.some((item) => item.label === "Launch Audit"));
  assert.ok(launchControlRows.rows.some((item) => item.label === "Policy Replay"));
  assert.ok(launchControlRows.rows.some((item) => item.label === "Final Dossier"));
  assert.ok(launchControlRows.rows.some((item) => item.label === "Boundary Verifier"));
  const finalReviewConsoleRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    finalOfflineLaunchReviewConsoleSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Final Offline Launch Review Console 已准备", redacted:true } },
    providerActivationBlockerSentinelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider Activation Blocker Sentinel 已准备", redacted:true } },
    readOnlyReleaseEvidenceSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Read-Only Release Evidence Summary 已准备", redacted:true } },
    offlineProviderReadinessDecisionMatrixSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Offline Provider Readiness Decision Matrix 已准备", redacted:true } },
    providerFinalReviewConsoleViewModelSummary:{ status:"ready", title:"Provider Final Review Console", redacted:true },
    safeToProceedWithFinalOfflineProviderReview:true
  })).sections.find((section) => section.sectionId === "global_shopping_provider_final_review_console");
  assert.ok(finalReviewConsoleRows.rows.some((item) => item.label === "Final Review"));
  assert.ok(finalReviewConsoleRows.rows.some((item) => item.label === "Activation Blockers"));
  assert.ok(finalReviewConsoleRows.rows.some((item) => item.label === "Evidence Summary"));
  assert.ok(finalReviewConsoleRows.rows.some((item) => item.label === "Decision Matrix"));
  const finalSafetyRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    providerFinalSafetySealSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider Final Safety Seal 已准备", redacted:true } },
    offlineActivationWarRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Offline Activation War Room 已准备", redacted:true } },
    readOnlyProviderReadinessCertificateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Read-Only Provider Readiness Certificate 已准备", redacted:true } },
    providerNoActivationGuaranteeBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider No-Activation Guarantee Board 已准备", redacted:true } },
    providerFinalSafetyViewModelSummary:{ status:"ready", title:"Provider Final Safety Review", redacted:true },
    safeToProceedWithHumanFinalSafetyReview:true
  })).sections.find((section) => section.sectionId === "global_shopping_provider_final_safety_review");
  assert.ok(finalSafetyRows.rows.some((item) => item.label === "Safety Seal"));
  assert.ok(finalSafetyRows.rows.some((item) => item.label === "Activation War Room"));
  assert.ok(finalSafetyRows.rows.some((item) => item.label === "Readiness Certificate"));
  assert.ok(finalSafetyRows.rows.some((item) => item.label === "No-Activation Guarantee"));
  const governanceClosureRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    offlineProviderGovernanceClosureBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Offline Provider Governance Closure Board 已准备", redacted:true }, redacted:true },
    noActivationComplianceSealSummary:{ status:"ready", userFacingSummary:{ resultLabel:"No-Activation Compliance Seal 已准备", redacted:true }, redacted:true },
    finalReadinessHandoffSimulatorSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Final Readiness Handoff Simulator 已准备", redacted:true }, redacted:true },
    providerGovernanceClosureEvidenceLedgerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider Governance Closure Evidence Ledger 已准备", redacted:true }, redacted:true },
    providerGovernanceClosureViewModelSummary:{ status:"ready", title:"Provider Governance Closure Review", redacted:true },
    safeToProceedWithHumanGovernanceClosureReview:true
  })).sections.find((section) => section.sectionId === "global_shopping_provider_governance_closure_review");
  assert.ok(governanceClosureRows.rows.some((item) => item.label === "Governance Closure" && item.value === "Offline Provider Governance Closure Board 已准备"));
  assert.ok(governanceClosureRows.rows.some((item) => item.label === "No-Activation Seal" && item.value === "No-Activation Compliance Seal 已准备"));
  assert.ok(governanceClosureRows.rows.some((item) => item.label === "Final Handoff" && item.value === "Final Readiness Handoff Simulator 已准备"));
  assert.ok(governanceClosureRows.rows.some((item) => item.label === "Closure Evidence" && item.value === "Provider Governance Closure Evidence Ledger 已准备"));
  assert.ok(governanceClosureRows.rows.some((item) => item.label === "Closure view" && item.value === "Provider Governance Closure Review"));
  const distributionReadinessRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    offlineDistributionReadinessCenterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Offline Distribution Readiness Center 已准备", redacted:true } },
    noActivationEnforcementLedgerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"No-Activation Enforcement Ledger 已准备", redacted:true } },
    finalUserTrustSummarySummary:{ status:"ready", userFacingSummary:{ resultLabel:"Final User Trust Summary 已准备", redacted:true } },
    providerSafetyDistributionMatrixSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider Safety Distribution Matrix 已准备", redacted:true } },
    providerDistributionReadinessViewModelSummary:{ status:"ready", title:"Provider Distribution Readiness Review", redacted:true },
    safeToProceedWithHumanDistributionReadinessReview:true
  })).sections.find((section) => section.sectionId === "global_shopping_provider_distribution_readiness_review");
  assert.ok(distributionReadinessRows.rows.some((item) => item.label === "Distribution Readiness" && item.value === "Offline Distribution Readiness Center 已准备"));
  assert.ok(distributionReadinessRows.rows.some((item) => item.label === "No-Activation Enforcement" && item.value === "No-Activation Enforcement Ledger 已准备"));
  assert.ok(distributionReadinessRows.rows.some((item) => item.label === "User Trust Summary" && item.value === "Final User Trust Summary 已准备"));
  assert.ok(distributionReadinessRows.rows.some((item) => item.label === "Safety Matrix" && item.value === "Provider Safety Distribution Matrix 已准备"));
  assert.ok(distributionReadinessRows.rows.some((item) => item.label === "Readiness view" && item.value === "Provider Distribution Readiness Review"));
  const distributionClosureRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    providerDistributionFreezeConsoleSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider Distribution Freeze Console 已准备", redacted:true } },
    userFacingSafetyReceiptSummary:{ status:"ready", userFacingSummary:{ resultLabel:"User-Facing Safety Receipt 已准备", redacted:true } },
    offlineReleaseCandidateClosurePackSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Offline Release Candidate Closure Pack 已准备", redacted:true } },
    providerNoProductionGuaranteeMatrixSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider No-Production Guarantee Matrix 已准备", redacted:true } },
    providerDistributionClosureViewModelSummary:{ status:"ready", title:"Provider Distribution Closure Review", redacted:true },
    safeToProceedWithHumanDistributionClosureReview:true
  })).sections.find((section) => section.sectionId === "global_shopping_provider_distribution_closure_review");
  assert.ok(distributionClosureRows.rows.some((item) => item.label === "Distribution Freeze" && item.value === "Provider Distribution Freeze Console 已准备"));
  assert.ok(distributionClosureRows.rows.some((item) => item.label === "Safety Receipt" && item.value === "User-Facing Safety Receipt 已准备"));
  assert.ok(distributionClosureRows.rows.some((item) => item.label === "RC Closure Pack" && item.value === "Offline Release Candidate Closure Pack 已准备"));
  assert.ok(distributionClosureRows.rows.some((item) => item.label === "No-Production Guarantee" && item.value === "Provider No-Production Guarantee Matrix 已准备"));
  assert.ok(distributionClosureRows.rows.some((item) => item.label === "Closure view" && item.value === "Provider Distribution Closure Review"));
  const publicReleaseRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    providerReadOnlyPublicReleaseCenterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider Read-Only Public Release Center 已准备", redacted:true }, redacted:true },
    trustClosureExportPreviewSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Trust Closure Export Preview 已准备", redacted:true }, redacted:true },
    finalNoProviderBoundaryReceiptSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Final No-Provider Boundary Receipt 已准备", redacted:true }, redacted:true },
    publicSafetyStatementPreviewSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Safety Statement Preview 已准备", redacted:true }, redacted:true },
    providerPublicReleaseViewModelSummary:{ status:"ready", title:"Provider Public Release Review", redacted:true },
    safeToProceedWithHumanPublicReleaseReview:true
  })).sections.find((section) => section.sectionId === "global_shopping_provider_public_release_review");
  assert.ok(publicReleaseRows.rows.some((item) => item.label === "Public Release" && item.value === "Provider Read-Only Public Release Center 已准备"));
  assert.ok(publicReleaseRows.rows.some((item) => item.label === "Export Preview" && item.value === "Trust Closure Export Preview 已准备"));
  assert.ok(publicReleaseRows.rows.some((item) => item.label === "No-Provider Receipt" && item.value === "Final No-Provider Boundary Receipt 已准备"));
  assert.ok(publicReleaseRows.rows.some((item) => item.label === "Safety Statement" && item.value === "Public Safety Statement Preview 已准备"));
  assert.ok(publicReleaseRows.rows.some((item) => item.label === "Release view" && item.value === "Provider Public Release Review"));
  const launchReadinessFinalRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    publicReleaseEvidenceConsoleSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Release Evidence Console 已准备", redacted:true }, redacted:true },
    noProviderUserAssurancePanelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"No-Provider User Assurance Panel 已准备", redacted:true }, redacted:true },
    offlineLaunchReadinessFinalizerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Offline Launch Readiness Finalizer 已准备", redacted:true }, redacted:true },
    userSafePublicClaimVerifierSummary:{ status:"ready", userFacingSummary:{ resultLabel:"User-Safe Public Claim Verifier 已准备", redacted:true }, redacted:true },
    providerLaunchReadinessFinalViewModelSummary:{ status:"ready", title:"Provider Launch Readiness Final Review", redacted:true },
    safeToProceedWithHumanLaunchReadinessFinalReview:true
  })).sections.find((section) => section.sectionId === "global_shopping_provider_launch_readiness_final_review");
  assert.ok(launchReadinessFinalRows.rows.some((item) => item.label === "Release Evidence" && item.value === "Public Release Evidence Console 已准备"));
  assert.ok(launchReadinessFinalRows.rows.some((item) => item.label === "User Assurance" && item.value === "No-Provider User Assurance Panel 已准备"));
  assert.ok(launchReadinessFinalRows.rows.some((item) => item.label === "Launch Finalizer" && item.value === "Offline Launch Readiness Finalizer 已准备"));
  assert.ok(launchReadinessFinalRows.rows.some((item) => item.label === "Claim Verifier" && item.value === "User-Safe Public Claim Verifier 已准备"));
  assert.ok(launchReadinessFinalRows.rows.some((item) => item.label === "Final view" && item.value === "Provider Launch Readiness Final Review"));
  assert.ok(launchReadinessFinalRows.rows.some((item) => item.label === "安全红线" && item.value === "Human launch readiness final review 仍需人工复核"));
  const publicBetaRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    globalShoppingReadOnlyPublicBetaShellSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Global Shopping Read-Only Public Beta Shell 已准备", redacted:true }, redacted:true },
    providerZeroRuntimeLockSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider-Zero Runtime Lock 已准备", redacted:true }, redacted:true },
    userTrustLaunchBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"User Trust Launch Board 已准备", redacted:true }, redacted:true },
    publicBetaSafetyCopyCenterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Beta Safety Copy Center 已准备", redacted:true }, redacted:true },
    globalShoppingPublicBetaViewModelSummary:{ status:"ready", title:"Global Shopping Public Beta Review", redacted:true },
    safeToProceedWithHumanPublicBetaReview:true
  })).sections.find((section) => section.sectionId === "global_shopping_public_beta_review");
  assert.ok(publicBetaRows.rows.some((item) => item.label === "Public Beta" && item.value === "Global Shopping Read-Only Public Beta Shell 已准备"));
  assert.ok(publicBetaRows.rows.some((item) => item.label === "Provider-Zero Lock" && item.value === "Provider-Zero Runtime Lock 已准备"));
  assert.ok(publicBetaRows.rows.some((item) => item.label === "User Trust Launch" && item.value === "User Trust Launch Board 已准备"));
  assert.ok(publicBetaRows.rows.some((item) => item.label === "Safety Copy" && item.value === "Public Beta Safety Copy Center 已准备"));
  assert.ok(publicBetaRows.rows.some((item) => item.label === "Final view" && item.value === "Global Shopping Public Beta Review"));
  assert.ok(publicBetaRows.rows.some((item) => item.label === "安全红线" && item.value === "Human public beta review 仍需人工复核"));
  const trustClosureRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    providerPublicTrustClosureCenterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider Public Trust Closure Center 已准备", redacted:true }, redacted:true },
    offlineReleaseMemorySnapshotSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Offline Release Memory Snapshot 已准备", redacted:true }, redacted:true },
    noProviderExecutionFinalGuardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"No-Provider-Execution Final Guard 已准备", redacted:true }, redacted:true },
    userVisibleSafetyBoundaryExplainerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"User-Visible Safety Boundary Explainer 已准备", redacted:true }, redacted:true },
    providerTrustClosureViewModelSummary:{ status:"ready", title:"Provider Trust Closure Review", redacted:true },
    safeToProceedWithHumanTrustClosureReview:true
  })).sections.find((section) => section.sectionId === "global_shopping_provider_trust_closure_review");
  assert.ok(trustClosureRows.rows.some((item) => item.label === "Public Trust Closure" && item.value === "Provider Public Trust Closure Center 已准备"));
  assert.ok(trustClosureRows.rows.some((item) => item.label === "Release Memory" && item.value === "Offline Release Memory Snapshot 已准备"));
  assert.ok(trustClosureRows.rows.some((item) => item.label === "No-Provider Guard" && item.value === "No-Provider-Execution Final Guard 已准备"));
  assert.ok(trustClosureRows.rows.some((item) => item.label === "Safety Boundary" && item.value === "User-Visible Safety Boundary Explainer 已准备"));
  assert.ok(trustClosureRows.rows.some((item) => item.label === "Closure view" && item.value === "Provider Trust Closure Review"));
  assert.ok(trustClosureRows.rows.some((item) => item.label === "安全红线" && item.value === "Human trust closure review 仍需人工复核"));
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
  const governanceRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    humanControlledSandboxProviderPilotPlannerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Pilot 计划器已准备", redacted:true } },
    providerKillSwitchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Kill Switch 演练已准备", redacted:true } },
    complianceEvidencePackSummary:{ status:"ready", userFacingSummary:{ resultLabel:"合规证据包已准备", redacted:true } },
    providerPilotGovernanceViewModelSummary:{ status:"ready", title:"Provider Pilot 治理与合规证据", redacted:true },
    providerGovernanceConsoleSummary:{ consoleStatus:"ready_for_human_approval", userVisibleSummary:{ resultLabel:"可进入人工最终确认", redacted:true }, allowedNextActions:["request_final_human_approval"], blockedActions:[], redacted:true },
    providerOperatorReviewLoopSummary:{ status:"ready_for_human_approval", userFacingSummary:{ resultLabel:"等待人工最终确认", redacted:true }, redacted:true },
    safeToProceedWithHumanAuditSandboxPilotReadinessReview:true
  })).sections.find((section) => section.sectionId === "global_shopping_provider_pilot_governance");
  assert.ok(governanceRows.rows.some((item) => item.label === "Pilot 计划器"));
  assert.ok(governanceRows.rows.some((item) => item.label === "Kill Switch"));
  assert.ok(governanceRows.rows.some((item) => item.label === "合规证据包"));
  assert.ok(governanceRows.rows.some((item) => item.label === "治理控制台" && item.value === "可进入人工最终确认"));
  assert.ok(governanceRows.rows.some((item) => item.label === "运营复核循环" && item.value === "等待人工最终确认"));
  assert.ok(governanceRows.rows.some((item) => item.label === "允许下一步" && item.value === "request_final_human_approval"));
  const governanceReleaseRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    providerGovernanceAuditConsoleSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider Governance 审计控制台已准备", redacted:true }, redacted:true },
    humanPilotReadinessLedgerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Human Pilot 准备台账已准备", redacted:true }, redacted:true },
    sandboxProviderReleaseFreezeGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Provider Release Freeze Gate 已准备", redacted:true }, redacted:true },
    providerGovernanceReleaseViewModelSummary:{ status:"ready", title:"Provider Governance 发布审计与冻结闸门", redacted:true },
    safeToProceedWithManualGovernanceReleaseDecision:false
  })).sections.find((section) => section.sectionId === "global_shopping_provider_governance_release");
  assert.ok(governanceReleaseRows.rows.some((item) => item.label === "治理审计" && item.value === "Provider Governance 审计控制台已准备"));
  assert.ok(governanceReleaseRows.rows.some((item) => item.label === "Human Pilot 台账" && item.value === "Human Pilot 准备台账已准备"));
  assert.ok(governanceReleaseRows.rows.some((item) => item.label === "Release Freeze" && item.value === "Sandbox Provider Release Freeze Gate 已准备"));
  assert.ok(governanceReleaseRows.rows.some((item) => item.label === "安全红线" && item.value === "Manual governance release decision 仍需人工确认"));
  const providerCertificationRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    offlineProviderCertificationCenterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"离线 Provider 认证中心已准备", redacted:true }, redacted:true },
    mockIntegrationRegressionLabSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock 集成回归实验室已准备", redacted:true }, redacted:true },
    humanApprovalEvidenceBinderSummary:{ status:"ready", userFacingSummary:{ resultLabel:"人工审批证据夹已准备", redacted:true }, redacted:true },
    adapterBoundaryLockSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Adapter 边界锁已准备", redacted:true }, redacted:true },
    providerCertificationViewModelSummary:{ status:"ready", title:"Provider 离线认证与边界锁", redacted:true },
    safeToProceedWithHumanCertificationReview:true
  })).sections.find((section) => section.sectionId === "global_shopping_provider_certification");
  assert.ok(providerCertificationRows.rows.some((item) => item.label === "Certification Center" && item.value === "离线 Provider 认证中心已准备"));
  assert.ok(providerCertificationRows.rows.some((item) => item.label === "Regression Lab" && item.value === "Mock 集成回归实验室已准备"));
  assert.ok(providerCertificationRows.rows.some((item) => item.label === "Evidence Binder" && item.value === "人工审批证据夹已准备"));
  assert.ok(providerCertificationRows.rows.some((item) => item.label === "Boundary Lock" && item.value === "Adapter 边界锁已准备"));
  assert.ok(providerCertificationRows.rows.some((item) => item.label === "认证视图" && item.value === "Provider 离线认证与边界锁"));
  assert.ok(providerCertificationRows.rows.some((item) => item.label === "安全红线" && item.value === "Human certification review 仍需人工复核"));
  const offlineReleaseRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    providerOfflineReleaseGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider Offline Release Gate 已准备", redacted:true }, redacted:true },
    providerCertificationFreezeLedgerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider Certification Freeze Ledger 已准备", redacted:true }, redacted:true },
    sandboxActivationReviewPacketSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Activation Review Packet 已准备", redacted:true }, redacted:true },
    adapterBoundaryDiffInspectorSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Adapter Boundary Diff Inspector 已准备", redacted:true }, redacted:true },
    providerOfflineReleaseViewModelSummary:{ status:"ready", title:"Provider 离线发布闸门与激活复核", redacted:true },
    safeToProceedWithManualOfflineReleaseReview:true
  })).sections.find((section) => section.sectionId === "global_shopping_provider_offline_release");
  assert.ok(offlineReleaseRows.rows.some((item) => item.label === "Offline Release Gate" && item.value === "Provider Offline Release Gate 已准备"));
  assert.ok(offlineReleaseRows.rows.some((item) => item.label === "Certification Freeze" && item.value === "Provider Certification Freeze Ledger 已准备"));
  assert.ok(offlineReleaseRows.rows.some((item) => item.label === "Activation Review" && item.value === "Sandbox Activation Review Packet 已准备"));
  assert.ok(offlineReleaseRows.rows.some((item) => item.label === "Boundary Diff" && item.value === "Adapter Boundary Diff Inspector 已准备"));
  assert.ok(offlineReleaseRows.rows.some((item) => item.label === "发布视图" && item.value === "Provider 离线发布闸门与激活复核"));
  assert.ok(offlineReleaseRows.rows.some((item) => item.label === "安全红线" && item.value === "Manual offline release review 仍需人工复核"));
  const providerManualReleaseRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    manualGovernanceReleaseDecisionRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"人工发布决策室已准备", redacted:true }, redacted:true },
    sandboxPilotExceptionRegisterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"例外登记簿已准备", redacted:true }, redacted:true },
    providerReadinessSignOffPacketSummary:{ status:"ready", userFacingSummary:{ resultLabel:"准备签核包已准备", redacted:true }, redacted:true },
    providerManualReleaseViewModelSummary:{ status:"ready", title:"Provider 人工发布决策与签核", redacted:true },
    safeToProceedWithManualProviderSignOffReview:false
  })).sections.find((section) => section.sectionId === "global_shopping_provider_manual_release");
  assert.ok(providerManualReleaseRows.rows.some((item) => item.label === "人工发布决策" && item.value === "人工发布决策室已准备"));
  assert.ok(providerManualReleaseRows.rows.some((item) => item.label === "例外登记" && item.value === "例外登记簿已准备"));
  assert.ok(providerManualReleaseRows.rows.some((item) => item.label === "准备签核" && item.value === "准备签核包已准备"));
  assert.ok(providerManualReleaseRows.rows.some((item) => item.label === "人工发布视图" && item.value === "Provider 人工发布决策与签核"));
  assert.ok(providerManualReleaseRows.rows.some((item) => item.label === "安全红线" && item.value === "Manual provider sign-off 仍需人工复核"));
  const providerSandboxActivationRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    readOnlySandboxActivationReadinessCenterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox 激活准备中心已准备", redacted:true }, redacted:true },
    offlineMockSandboxSessionRunnerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"离线 Mock 会话运行器已准备", redacted:true }, redacted:true },
    manualProviderActivationHandoffPacketSummary:{ status:"ready", userFacingSummary:{ resultLabel:"人工 Provider 激活交接包已准备", redacted:true }, redacted:true },
    providerSandboxActivationViewModelSummary:{ status:"ready", title:"Provider Sandbox 激活准备与离线演练", redacted:true },
    safeToProceedWithManualSandboxActivationReview:false
  })).sections.find((section) => section.sectionId === "global_shopping_provider_sandbox_activation");
  assert.ok(providerSandboxActivationRows.rows.some((item) => item.label === "Sandbox 激活准备" && item.value === "Sandbox 激活准备中心已准备"));
  assert.ok(providerSandboxActivationRows.rows.some((item) => item.label === "离线 Mock 会话" && item.value === "离线 Mock 会话运行器已准备"));
  assert.ok(providerSandboxActivationRows.rows.some((item) => item.label === "人工激活交接" && item.value === "人工 Provider 激活交接包已准备"));
  assert.ok(providerSandboxActivationRows.rows.some((item) => item.label === "激活视图" && item.value === "Provider Sandbox 激活准备与离线演练"));
  assert.ok(providerSandboxActivationRows.rows.some((item) => item.label === "安全红线" && item.value === "Manual sandbox activation 仍需人工复核"));
  const providerSandboxMilestoneRows = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, {
    providerSandboxReadinessWorkbenchSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Readiness Workbench 已准备", redacted:true }, redacted:true },
    offlineProviderScenarioLabSummary:{ status:"ready", userFacingSummary:{ resultLabel:"离线场景实验室已准备", redacted:true }, redacted:true },
    readOnlyProviderAdapterSdkSkeletonSummary:{ status:"ready", userFacingSummary:{ resultLabel:"只读 Adapter SDK 骨架已准备", redacted:true }, redacted:true },
    manualActivationCommandCenterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"人工激活指挥中心已准备", redacted:true }, redacted:true },
    providerSandboxMilestoneViewModelSummary:{ status:"ready", title:"Provider Sandbox 里程碑工作台", redacted:true },
    safeToProceedWithHumanSandboxMilestoneReview:true
  })).sections.find((section) => section.sectionId === "global_shopping_provider_sandbox_milestone");
  assert.ok(providerSandboxMilestoneRows.rows.some((item) => item.label === "Readiness Workbench" && item.value === "Sandbox Readiness Workbench 已准备"));
  assert.ok(providerSandboxMilestoneRows.rows.some((item) => item.label === "Offline Scenario Lab" && item.value === "离线场景实验室已准备"));
  assert.ok(providerSandboxMilestoneRows.rows.some((item) => item.label === "Adapter SDK Skeleton" && item.value === "只读 Adapter SDK 骨架已准备"));
  assert.ok(providerSandboxMilestoneRows.rows.some((item) => item.label === "Command Center" && item.value === "人工激活指挥中心已准备"));
  assert.ok(providerSandboxMilestoneRows.rows.some((item) => item.label === "里程碑视图" && item.value === "Provider Sandbox 里程碑工作台"));
  assert.ok(providerSandboxMilestoneRows.rows.some((item) => item.label === "安全红线" && item.value === "Human sandbox milestone review 仍需人工复核"));
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
