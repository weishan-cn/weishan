const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowRiskBadgeBuilder.js"]);
  const api = windowRef.WeishanFlightWorkflowRiskBadgeBuilder;
  assert.equal(api.FLIGHT_WORKFLOW_RISK_BADGE_BUILDER_VERSION, "2.4.0");
  const model = api.buildFlightWorkflowRiskBadges({ auditReview:{ auditHealth:{ overall:"warning", hasBlockedActions:true, hasConfirmationRequiredActions:true, hasSensitiveInputBlocked:true } }, safeSessionExportPreview:{ status:"ready" }, feedbackReviewSummary:{ status:"ready" }, acceptanceSessionSummary:{ status:"completed" }, betaCohortSummary:{ status:"ready", cohortHealth:{ safeToExpandBeta:true } }, feedbackTrendSummary:{ status:"ready", recommendation:{ recommendationId:"expand_read_only_beta" }, trends:{ overallTrend:"positive" } }, betaExpansionGateSummary:{ status:"approved", decision:{ safeToExpandReadOnlyBeta:true } }, publicPilotChecklistSummary:{ status:"ready", readiness:{ safeForSmallPublicPilot:true }, checklistName:"flight_workflow_read_only_public_pilot_checklist_v1" }, pilotReadinessSummary:{ status:"ready", viewModelName:"flight_workflow_pilot_readiness_view_model_v1" } });
  assert.equal(model.builderName, "flight_workflow_risk_badge_builder_v1");
  const labels = model.badges.map((item) => item.label);
  assert.ok(labels.includes("只读安全"));
  assert.ok(labels.includes("需要二次确认"));
  assert.ok(labels.includes("交易动作已阻断"));
  assert.ok(labels.includes("敏感输入已阻断"));
  assert.ok(labels.includes("可预览脱敏摘要"));
  assert.ok(labels.includes("不可导出"));
  assert.ok(labels.includes("测试反馈可用"));
  assert.ok(labels.includes("验收会话完成"));
  assert.ok(labels.includes("Beta 反馈可扩大测试"));
  assert.ok(labels.includes("可以小范围扩大只读测试"));
  assert.ok(labels.includes("试点检查清单通过"));
  assert.ok(labels.includes("公开试点仍为只读"));
  const rolloutLabels = api.buildFlightWorkflowRiskBadges({ pilotOpsSummary:{ status:"healthy", primaryRisk:{ riskId:"none", label:"无主要风险" } }, nextCohortDecisionSummary:{ status:"advance", decision:{ decisionId:"advance_next_cohort" } } }).badges.map((item) => item.label);
  assert.ok(rolloutLabels.includes("试点运行健康"));
  assert.ok(rolloutLabels.includes("下一批可推进"));
  const onboarding = api.buildFlightWorkflowRiskBadges({ pilotOnboardingSummary:{ status:"allowed", decision:{ canEnterReadOnlyPilot:true }, guardName:"flight_workflow_public_pilot_onboarding_guard_v1" }, readOnlyConsentSummary:{ status:"accepted", consentSummary:{ allRequiredAccepted:true }, consentFlowName:"flight_workflow_read_only_user_consent_flow_v1" } });
  const onboardingLabels = onboarding.badges.map((item) => item.label);
  assert.ok(onboardingLabels.includes("已确认只读范围"));
  assert.ok(onboardingLabels.includes("可以进入只读试点"));
  assert.ok(onboardingLabels.includes("只读试点不代表交易授权"));
  const rcLabels = api.buildFlightWorkflowRiskBadges({ rcCandidateReviewSummary:{ status:"ready_for_review", safeToStartRcReview:true, userFacingSummary:{ resultLabel:"可以开始 RC 复核", redacted:true } }, rcEvidenceReviewSummary:{ status:"incomplete", userFacingSummary:{ resultLabel:"证据仍需补充", redacted:true } }, rcReviewStatus:"ready_for_review", rcEvidenceStatus:"incomplete", safeToStartRcReview:true }).badges.map((item) => item.label);
  assert.ok(rcLabels.includes("可以开始 RC 复核"));
  assert.ok(rcLabels.includes("证据仍需补充"));
  const copyLabels = api.buildFlightWorkflowRiskBadges({ rcCopyFinalizationSummary:{ status:"finalized", finalizationName:"flight_workflow_rc_user_facing_copy_finalization_v1" }, safetyDisclosureReviewSummary:{ status:"approved", boardName:"flight_workflow_safety_disclosure_review_board_v1" } }).badges.map((item) => item.label);
  assert.ok(copyLabels.includes("RC 文案可以定稿"));
  assert.ok(copyLabels.includes("安全披露通过"));
  assert.ok(copyLabels.includes("文案不代表交易能力"));
  const missingConsent = api.buildFlightWorkflowRiskBadges({ pilotOnboardingSummary:{ status:"needs_consent", guardName:"flight_workflow_public_pilot_onboarding_guard_v1" }, readOnlyConsentSummary:{ status:"missing_required_items", consentFlowName:"flight_workflow_read_only_user_consent_flow_v1" } });
  assert.ok(missingConsent.badges.map((item) => item.label).includes("仍需确认只读范围"));
  const blockedOnboarding = api.buildFlightWorkflowRiskBadges({ pilotOnboardingSummary:{ status:"blocked", guardName:"flight_workflow_public_pilot_onboarding_guard_v1" } });
  assert.ok(blockedOnboarding.badges.map((item) => item.label).includes("暂不可进入只读试点"));
  const summary = api.summarizeFlightWorkflowRiskBadges(model.badges);
  assert.equal(summary.summaryLabel.includes("只读安全"), true);
  assert.equal(summary.bookingUrl, null);
  const audit = api.buildFlightWorkflowRiskBadgeBuilderAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" });
  const safeJson = JSON.stringify(audit);
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  assert.equal(safeJson.includes("bookingUrl\":null"), true);
  const globalLabels = api.buildFlightWorkflowRiskBadges({
    globalShoppingProductGoalSummary:{ status:"aligned" },
    jumpToPlatformBoundarySummary:{ status:"safe" },
    legalProviderFixtureSummary:{ status:"ready" },
    providerCredentialSafetySummary:{ status:"ready" },
    sandboxPriceFeedSummary:{ status:"ready" },
    providerFixtureViewModelSummary:{ status:"ready" },
    sameItemMatcherSummary:{ status:"ready" },
    duplicateCandidateMergerSummary:{ status:"merged" },
    coveredLowestCandidateBoardSummary:{ status:"ready" },
    externalDeepLinkSafetySummary:{ status:"safe" },
    searchParameterPrefillSummary:{ status:"safe" },
    jumpToPlatformHandoffPreviewSummary:{ status:"ready" },
    sandboxDeepLinkCandidateSummary:{ status:"ready" },
    platformAvailabilitySummary:{ status:"available" },
    partnerLinkPolicySummary:{ status:"compliant" },
    sandboxHandoffViewModelSummary:{ status:"ready", safeToProceedWithPartnerFixtureAdapter:true },
    sandboxProviderResponseContractSummary:{ status:"ready" },
    pricePipelineOrchestratorSummary:{ status:"ready" },
    readOnlyCandidateJourneySummary:{ status:"ready" },
    providerSandboxDryRunHarnessSummary:{ status:"ready" },
    firstReadOnlyProviderAdapterShellSummary:{ status:"ready" },
    providerSandboxSafetyKillSwitchSummary:{ status:"clear" },
    providerSandboxDryRunViewModelSummary:{ status:"ready" },
    sandboxProviderResponseContractStatus:"ready",
    pricePipelineStatus:"ready",
    readOnlyCandidateJourneyStatus:"ready",
    providerSandboxDryRunStatus:"ready",
    providerAdapterShellStatus:"ready",
    providerKillSwitchStatus:"clear",
    providerSandboxDryRunViewModelStatus:"ready",
    safeToProceedWithDeepLinkSafetyGate:true,
    safeToProceedWithReadOnlyPriceProviderSandbox:true,
    safeToProceedWithJumpToPlatformMvp:true,
    safeToProceedWithSandboxDeepLinkCandidate:true,
    safeToProceedWithPartnerFixtureAdapter:true,
    safeToProceedWithFirstProviderSandboxFixtureDryRun:true
  }).badges.map((item) => item.label);
  assert.ok(globalLabels.includes("全球购目标已对齐"));
  assert.ok(globalLabels.includes("Provider fixture 已准备"));
  assert.ok(globalLabels.includes("Provider 凭据边界安全"));
  assert.ok(globalLabels.includes("Sandbox 价格 Feed 已准备"));
  assert.ok(globalLabels.includes("Provider 响应合同已准备"));
  assert.ok(globalLabels.includes("只读价格流水线已准备"));
  assert.ok(globalLabels.includes("全球购只读候选旅程已准备"));
  assert.ok(globalLabels.includes("不读取生产密钥"));
  assert.ok(globalLabels.includes("不保存 raw provider response"));
  assert.ok(globalLabels.includes("Fixture feed 可进入价格归一化"));
  assert.ok(globalLabels.includes("Provider fixture 不代表真实价格"));
  assert.ok(globalLabels.includes("Raw provider response 不持久化"));
  assert.ok(globalLabels.includes("Fixture 数据进入候选旅程"));
  assert.ok(globalLabels.includes("价格流水线不代表真实价格"));
  assert.ok(globalLabels.includes("候选旅程不代表下单能力"));
  assert.ok(globalLabels.includes("Provider Sandbox 干跑框架已准备"));
  assert.ok(globalLabels.includes("第一个只读 Provider Adapter 外壳已准备"));
  assert.ok(globalLabels.includes("Provider Sandbox 安全熔断器未触发"));
  assert.ok(globalLabels.includes("Provider Sandbox 干跑准备"));
  assert.ok(globalLabels.includes("干跑不发送真实请求"));
  assert.ok(globalLabels.includes("Adapter 外壳不包含真实 endpoint"));
  assert.ok(globalLabels.includes("干跑不代表真实价格或下单能力"));
  assert.ok(globalLabels.includes("跳转平台边界安全"));
  assert.ok(globalLabels.includes("同款候选识别已准备"));
  assert.ok(globalLabels.includes("重复候选合并已准备"));
  assert.ok(globalLabels.includes("已覆盖来源较低候选价已准备"));
  assert.ok(globalLabels.includes("跳转前安全门已准备"));
  assert.ok(globalLabels.includes("跳转安全结构已准备"));
  assert.ok(globalLabels.includes("预填边界安全"));
  assert.ok(globalLabels.includes("跳转至平台查看"));
  assert.ok(globalLabels.includes("可带入搜索条件"));
  assert.ok(globalLabels.includes("用户在平台自行下单"));
  assert.ok(globalLabels.includes("不保存平台账号"));
  assert.ok(globalLabels.includes("不保存证件银行卡"));
  assert.ok(globalLabels.includes("跳转预览不代表下单能力"));
  assert.ok(globalLabels.includes("Sandbox 跳转候选已准备"));
  assert.ok(globalLabels.includes("平台候选可展示"));
  assert.ok(globalLabels.includes("合作链接政策合规"));
  assert.ok(globalLabels.includes("合作链接不代表最低价"));
  assert.ok(globalLabels.includes("平台页面为实时价格准绳"));
  assert.ok(globalLabels.includes("Sandbox 跳转不打开真实平台"));
  assert.ok(globalLabels.includes("平台可用不代表官方背书"));
  assert.ok(globalLabels.includes("禁止最低价相关承诺"));
  assert.ok(globalLabels.includes("禁止自动下单承诺"));
  assert.ok(globalLabels.includes("跳转不代表交易能力"));
  const manualReviewLabels = api.buildFlightWorkflowRiskBadges({
    manualPlatformReviewCockpitSummary:{ status:"ready", userFacingSummary:{ resultLabel:"手动平台复核驾驶舱已准备", redacted:true } },
    handoffAcceptanceWalkthroughSummary:{ status:"ready", userFacingSummary:{ resultLabel:"交接包接受演练已准备", redacted:true } },
    platformRealityCheckBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"平台真实页面复核清单已准备", redacted:true } },
    manualPlatformReviewViewModelSummary:{ status:"ready", title:"手动平台复核与现实检查", redacted:true },
    manualPlatformReviewCockpitStatus:"ready",
    handoffAcceptanceWalkthroughStatus:"ready",
    platformRealityCheckStatus:"ready",
    manualPlatformReviewViewModelStatus:"ready",
    safeToProceedWithManualPlatformUserEducation:true
  }).badges.map((item) => item.label);
  assert.ok(manualReviewLabels.includes("手动平台复核驾驶舱已准备"));
  assert.ok(manualReviewLabels.includes("交接包接受演练已准备"));
  assert.ok(manualReviewLabels.includes("平台真实页面复核清单已准备"));
  assert.ok(manualReviewLabels.includes("接受演练不保存用户确认"));
  assert.ok(manualReviewLabels.includes("平台页面才是最终依据"));
  assert.ok(manualReviewLabels.includes("手动复核不代表下单能力"));
  assert.ok(manualReviewLabels.includes("手动平台复核教育已准备"));
  const userManualReviewLabels = api.buildFlightWorkflowRiskBadges({
    userFacingManualReviewFlowSummary:{ status:"ready", userFacingSummary:{ resultLabel:"用户手动复核流程已准备", redacted:true } },
    platformVerificationProgressTrackerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"平台核对进度已准备", redacted:true } },
    safeNextActionPanelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"安全下一步已准备", redacted:true } },
    userManualReviewViewModelSummary:{ status:"ready", title:"用户手动复核与安全下一步", redacted:true },
    userFacingManualReviewFlowStatus:"ready",
    platformVerificationProgressStatus:"ready",
    safeNextActionPanelStatus:"ready",
    userManualReviewViewModelStatus:"ready",
    safeToProceedWithManualExternalPlatformVisitEducation:true
  }).badges.map((item) => item.label);
  assert.ok(userManualReviewLabels.includes("用户手动复核流程已准备"));
  assert.ok(userManualReviewLabels.includes("平台核对进度已准备"));
  assert.ok(userManualReviewLabels.includes("安全下一步已准备"));
  assert.ok(userManualReviewLabels.includes("平台核对进度不保存勾选"));
  assert.ok(userManualReviewLabels.includes("安全下一步不打开平台"));
  assert.ok(userManualReviewLabels.includes("下一步不包含购买、下单、付款或出票"));
  assert.ok(userManualReviewLabels.includes("用户必须自行完成最终平台判断"));
  const recapLabels = api.buildFlightWorkflowRiskBadges({
    readOnlyCommerceSessionRecapCenterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"只读全球购会话总结已准备", redacted:true } },
    userTrustClosureSummarySummary:{ status:"ready", userFacingSummary:{ resultLabel:"用户信任闭环摘要已准备", redacted:true } },
    nextFeatureReadinessGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"下一功能准备闸门已准备", redacted:true } },
    commerceSessionRecapViewModelSummary:{ status:"ready", title:"只读全球购会话总结与下一步准备", redacted:true },
    readOnlyCommerceSessionRecapStatus:"ready",
    userTrustClosureSummaryStatus:"ready",
    nextFeatureReadinessGateStatus:"ready",
    commerceSessionRecapViewModelStatus:"ready",
    safeToProceedWithReadOnlyProviderSandboxPlanning:true
  }).badges.map((item) => item.label);
  assert.ok(recapLabels.includes("只读全球购会话总结已准备"));
  assert.ok(recapLabels.includes("用户信任闭环摘要已准备"));
  assert.ok(recapLabels.includes("下一功能准备闸门已准备"));
  assert.ok(recapLabels.includes("只读全球购会话总结与下一步准备已准备"));
  assert.ok(recapLabels.includes("会话总结不保存、不导出"));
  assert.ok(recapLabels.includes("信任闭环不构成平台确认"));
  assert.ok(recapLabels.includes("下一功能闸门不接真实 provider"));
  assert.ok(recapLabels.includes("下一步仍需人工审批"));
  const providerPrepLabels = api.buildFlightWorkflowRiskBadges({
    providerLegalReviewDossierSummary:{ status:"ready", userFacingSummary:{ resultLabel:"法务审查档案已准备", redacted:true } },
    credentialVaultInterfaceStubSummary:{ status:"ready", userFacingSummary:{ resultLabel:"凭证接口桩已准备", redacted:true } },
    sandboxAdapterContractTestbedSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Adapter 合同测试台已准备", redacted:true } },
    providerIntegrationPrepViewModelSummary:{ status:"ready", title:"Provider 接入前准备", redacted:true },
    providerLegalReviewStatus:"ready",
    credentialVaultInterfaceStatus:"ready",
    sandboxAdapterContractStatus:"ready",
    providerIntegrationPrepViewModelStatus:"ready",
    safeToProceedWithProviderSandboxContractImplementation:true
  }).badges.map((item) => item.label);
  assert.ok(providerPrepLabels.includes("Provider 法务审查档案已准备"));
  assert.ok(providerPrepLabels.includes("凭证保险箱接口桩已准备"));
  assert.ok(providerPrepLabels.includes("Sandbox Adapter 合同测试台已准备"));
  assert.ok(providerPrepLabels.includes("法务审查不代表已合作或已授权"));
  assert.ok(providerPrepLabels.includes("凭证接口桩不读取真实密钥"));
  assert.ok(providerPrepLabels.includes("Adapter 合同测试不请求真实 provider"));
  assert.ok(providerPrepLabels.includes("下一步仍需人工安全审批"));
  const mockRuntimeLabels = api.buildFlightWorkflowRiskBadges({
    sandboxProviderMockRuntimeSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Provider Mock Runtime 已准备", redacted:true } },
    vaultBoundaryContractSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Vault 边界合同已准备", redacted:true } },
    legalApprovalWorkflowBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"法务审批流程板已准备", redacted:true } },
    providerMockRuntimeViewModelSummary:{ status:"ready", title:"Provider Mock Runtime 与审批准备", redacted:true },
    sandboxProviderMockRuntimeStatus:"ready",
    vaultBoundaryContractStatus:"ready",
    legalApprovalWorkflowStatus:"ready",
    providerMockRuntimeViewModelStatus:"ready",
    safeToProceedWithMockAdapterRuntimeHardening:true
  }).badges.map((item) => item.label);
  assert.ok(mockRuntimeLabels.includes("Sandbox Provider Mock Runtime 已准备"));
  const governanceReleaseLabels = api.buildFlightWorkflowRiskBadges({
    providerGovernanceAuditConsoleSummary:{ status:"ready", userFacingSummary:{ resultLabel:"治理审计控制台已准备", redacted:true } },
    humanPilotReadinessLedgerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Human Pilot 准备台账已准备", redacted:true } },
    sandboxProviderReleaseFreezeGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Release Freeze Gate 已准备", redacted:true } },
    providerGovernanceReleaseViewModelSummary:{ status:"ready", title:"Provider Governance 发布审计与冻结闸门", redacted:true },
    providerGovernanceAuditConsoleStatus:"ready",
    humanPilotReadinessLedgerStatus:"ready",
    sandboxProviderReleaseFreezeGateStatus:"ready",
    providerGovernanceReleaseViewModelStatus:"ready",
    safeToProceedWithManualGovernanceReleaseDecision:false
  }).badges.map((item) => item.label);
  assert.ok(governanceReleaseLabels.includes("Provider Governance 审计控制台已准备"));
  assert.ok(governanceReleaseLabels.includes("Human Pilot 准备台账已准备"));
  assert.ok(governanceReleaseLabels.includes("Sandbox Provider Release Freeze Gate 已准备"));
  assert.ok(governanceReleaseLabels.includes("治理审计不写文件、不上传"));
  assert.ok(governanceReleaseLabels.includes("Human Pilot 台账不持久化审批结果"));
  assert.ok(governanceReleaseLabels.includes("Release Freeze Gate 不改 git、不 push"));
  assert.ok(governanceReleaseLabels.includes("Manual governance release decision 仍需人工确认"));
  const providerManualReleaseLabels = api.buildFlightWorkflowRiskBadges({
    manualGovernanceReleaseDecisionRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"人工发布决策室已准备", redacted:true } },
    sandboxPilotExceptionRegisterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"例外登记簿已准备", redacted:true } },
    providerReadinessSignOffPacketSummary:{ status:"ready", userFacingSummary:{ resultLabel:"准备签核包已准备", redacted:true } },
    providerManualReleaseViewModelSummary:{ status:"ready", title:"Provider 人工发布决策与签核", redacted:true },
    manualGovernanceReleaseDecisionRoomStatus:"ready",
    sandboxPilotExceptionRegisterStatus:"ready",
    providerReadinessSignOffPacketStatus:"ready",
    providerManualReleaseViewModelStatus:"ready",
    safeToProceedWithManualProviderSignOffReview:false
  }).badges.map((item) => item.label);
  assert.ok(providerManualReleaseLabels.includes("Manual Governance Release 决策室已准备"));
  assert.ok(providerManualReleaseLabels.includes("Sandbox Pilot 例外登记簿已准备"));
  assert.ok(providerManualReleaseLabels.includes("Provider 准备签核包已准备"));
  assert.ok(providerManualReleaseLabels.includes("人工发布决策不创建 release、不 push"));
  assert.ok(providerManualReleaseLabels.includes("例外登记不持久化审批结果"));
  assert.ok(providerManualReleaseLabels.includes("准备签核包不写文件、不导出"));
  assert.ok(providerManualReleaseLabels.includes("Manual provider sign-off 仍需人工复核"));
  const launchReadinessLabels = api.buildFlightWorkflowRiskBadges({
    mockProviderAdapterRegistryRuntimeSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock Adapter 注册运行时已准备", redacted:true } },
    providerContractReplayHarnessSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 合同回放器已准备", redacted:true } },
    providerLaunchReadinessBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 启动准备总闸门已准备", redacted:true } },
    providerLaunchReadinessViewModelSummary:{ status:"ready", title:"Provider 启动准备与合同回放", redacted:true },
    mockProviderAdapterRegistryStatus:"ready",
    providerContractReplayStatus:"ready",
    providerLaunchReadinessStatus:"ready",
    providerLaunchReadinessViewModelStatus:"ready",
    safeToProceedWithHumanProviderSandboxApproval:true
  }).badges.map((item) => item.label);
  assert.ok(launchReadinessLabels.includes("Mock Provider Adapter 注册运行时已准备"));
  assert.ok(launchReadinessLabels.includes("Provider 合同回放器已准备"));
  assert.ok(launchReadinessLabels.includes("Provider 启动准备总闸门已准备"));
  assert.ok(launchReadinessLabels.includes("Mock Adapter 注册不接真实 provider"));
  assert.ok(launchReadinessLabels.includes("合同回放不回放 raw request 或 raw response"));
  assert.ok(launchReadinessLabels.includes("启动准备不读取密钥、不联网"));
  assert.ok(launchReadinessLabels.includes("真实 sandbox provider 仍需人工审批"));
  const pilotControlLabels = api.buildFlightWorkflowRiskBadges({
    providerSandboxPilotControlRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Pilot 控制室已准备", redacted:true } },
    mockProviderIncidentDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock 事故演练已准备", redacted:true } },
    productionBlockerMatrixSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Production 阻断矩阵已准备", redacted:true } },
    providerPilotControlViewModelSummary:{ status:"ready", title:"Provider Sandbox Pilot 控制与阻断", redacted:true },
    providerSandboxPilotControlStatus:"ready",
    mockProviderIncidentDrillStatus:"ready",
    productionBlockerMatrixStatus:"ready",
    providerPilotControlViewModelStatus:"ready",
    safeToProceedWithHumanControlledSandboxProviderPilotPlan:true
  }).badges.map((item) => item.label);
  assert.ok(pilotControlLabels.includes("Provider Sandbox Pilot 控制室已准备"));
  assert.ok(pilotControlLabels.includes("Mock Provider 事故演练已准备"));
  assert.ok(pilotControlLabels.includes("Production 阻断矩阵已准备"));
  assert.ok(pilotControlLabels.includes("Pilot 控制室不启动真实 provider"));
  assert.ok(pilotControlLabels.includes("事故演练不触发真实告警或回滚"));
  assert.ok(pilotControlLabels.includes("阻断矩阵不修改运行配置"));
  assert.ok(pilotControlLabels.includes("Human-controlled pilot 仍需人工审批"));
  const governanceLabels = api.buildFlightWorkflowRiskBadges({
    humanControlledSandboxProviderPilotPlannerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Pilot 计划器已准备", redacted:true } },
    providerKillSwitchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Kill Switch 演练已准备", redacted:true } },
    complianceEvidencePackSummary:{ status:"ready", userFacingSummary:{ resultLabel:"合规证据包已准备", redacted:true } },
    providerGovernanceConsoleSummary:{ consoleStatus:"ready_for_human_approval", userVisibleSummary:{ resultLabel:"可进入人工最终确认", redacted:true }, redacted:true },
    providerOperatorReviewLoopSummary:{ status:"blocked", userFacingSummary:{ resultLabel:"当前不能继续", redacted:true }, redacted:true },
    providerGovernanceConsoleStatus:"ready_for_human_approval",
    providerOperatorReviewLoopStatus:"blocked",
    safeToProceedWithHumanAuditSandboxPilotReadinessReview:true
  }).badges.map((item) => item.label);
  assert.ok(governanceLabels.includes("Provider Governance Console 等待人工最终确认"));
  assert.ok(governanceLabels.includes("运营复核循环要求暂停"));
  assert.ok(mockRuntimeLabels.includes("Vault 边界合同已准备"));
  assert.ok(mockRuntimeLabels.includes("法务审批流程板已准备"));
  assert.ok(mockRuntimeLabels.includes("Mock Runtime 不接真实 provider"));
  assert.ok(mockRuntimeLabels.includes("Vault 边界不读取或保存真实密钥"));
  assert.ok(mockRuntimeLabels.includes("审批流程不创建任务、不发邮件"));
  assert.ok(mockRuntimeLabels.includes("下一步仍需人工审批"));
  const exitLabels = api.buildFlightWorkflowRiskBadges({
    externalPlatformExitRampPreviewSummary:{ status:"ready" },
    manualVisitSafetyBriefSummary:{ status:"ready" },
    readOnlySessionClosurePackSummary:{ status:"ready" },
    externalPlatformExitViewModelSummary:{ status:"ready", title:"外部平台手动访问前最终说明" }
  }).badges.map((item) => item.label);
  assert.ok(exitLabels.includes("外部平台退出坡道已准备"));
  assert.ok(exitLabels.includes("手动访问安全简报已准备"));
  assert.ok(exitLabels.includes("只读会话关闭包已准备"));
  assert.ok(exitLabels.includes("退出坡道不打开平台"));
  assert.ok(exitLabels.includes("安全简报不保存确认"));
  assert.ok(exitLabels.includes("会话关闭包不导出、不下载"));
  assert.ok(exitLabels.includes("关闭包不是合同、订单或付款授权"));
  const decisionReviewLabels = api.buildFlightWorkflowRiskBadges({
    sandboxCandidateComparisonWorkbenchSummary:{ status:"ready" },
    providerEvidenceComparisonMatrixSummary:{ status:"ready" },
    readOnlyHandoffReadinessDrillSummary:{ status:"ready" },
    sandboxDecisionReviewViewModelSummary:{ status:"ready", title:"Sandbox 候选决策复核" },
    sandboxCandidateComparisonWorkbenchStatus:"ready",
    providerEvidenceComparisonMatrixStatus:"ready",
    readOnlyHandoffReadinessDrillStatus:"ready",
    sandboxDecisionReviewStatus:"ready",
    safeToProceedWithSandboxDecisionReview:true
  }).badges.map((item) => item.label);
  assert.ok(decisionReviewLabels.includes("Sandbox 候选对比已准备"));
  assert.ok(decisionReviewLabels.includes("Provider 证据矩阵已准备"));
  assert.ok(decisionReviewLabels.includes("只读交接演练已准备"));
  assert.ok(decisionReviewLabels.includes("候选推荐不代表最低价保证"));
  assert.ok(decisionReviewLabels.includes("交接演练不打开平台"));
  assert.ok(decisionReviewLabels.includes("参数预览不包含身份或支付信息"));
  assert.ok(decisionReviewLabels.includes("决策复核不代表下单能力"));
  console.log("FLIGHT_WORKFLOW_RISK_BADGE_BUILDER PASS");
}
main();
