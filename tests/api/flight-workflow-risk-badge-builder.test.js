const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowRiskBadgeBuilder.js"]);
  const api = windowRef.WeishanFlightWorkflowRiskBadgeBuilder;
  assert.equal(api.FLIGHT_WORKFLOW_RISK_BADGE_BUILDER_VERSION, "4.2.8");
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
    offlineSandboxTraceInspectorSummary:{ status:"ready" },
    mockProviderResultNormalizerSummary:{ status:"ready" },
    manualActivationDryRunChecklistSummary:{ status:"ready" },
    sandboxProviderResponseContractStatus:"ready",
    pricePipelineStatus:"ready",
    readOnlyCandidateJourneyStatus:"ready",
    providerSandboxDryRunStatus:"ready",
    providerAdapterShellStatus:"ready",
    providerKillSwitchStatus:"clear",
    providerSandboxDryRunViewModelStatus:"ready",
    offlineSandboxTraceInspectorStatus:"ready",
    mockProviderResultNormalizerStatus:"ready",
    manualActivationDryRunChecklistStatus:"ready",
    providerSandboxReadinessWorkbenchSummary:{ status:"ready" },
    offlineProviderScenarioLabSummary:{ status:"ready" },
    readOnlyProviderAdapterSdkSkeletonSummary:{ status:"ready" },
    manualActivationCommandCenterSummary:{ status:"ready" },
    providerSandboxMilestoneViewModelSummary:{ status:"ready" },
    providerSandboxReadinessWorkbenchStatus:"ready",
    offlineProviderScenarioLabStatus:"ready",
    readOnlyProviderAdapterSdkSkeletonStatus:"ready",
    manualActivationCommandCenterStatus:"ready",
    providerSandboxMilestoneViewModelStatus:"ready",
    safeToProceedWithDeepLinkSafetyGate:true,
    safeToProceedWithReadOnlyPriceProviderSandbox:true,
    safeToProceedWithJumpToPlatformMvp:true,
    safeToProceedWithSandboxDeepLinkCandidate:true,
    safeToProceedWithPartnerFixtureAdapter:true,
    safeToProceedWithFirstProviderSandboxFixtureDryRun:true,
    safeToProceedWithHumanSandboxMilestoneReview:true,
    categoryResultSimulatorSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Category Result Simulator 已准备", redacted:true } },
    readOnlyComparisonBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Read-Only Comparison Board 已准备", redacted:true } },
    resultTrustBadgePanelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Result Trust Badge 已准备", redacted:true } }
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
  assert.ok(globalLabels.includes("Provider Sandbox 离线 Dry-run"));
  assert.ok(globalLabels.includes("离线 Sandbox Trace 检查器已准备"));
  assert.ok(globalLabels.includes("Mock Provider 结果归一化器已准备"));
  assert.ok(globalLabels.includes("人工激活 Dry-run 检查清单已准备"));
  assert.ok(globalLabels.includes("离线 Trace 检查不保存 raw trace"));
  assert.ok(globalLabels.includes("Mock 结果归一化不处理真实 provider response"));
  assert.ok(globalLabels.includes("激活 Dry-run 不激活 sandbox、不创建 release"));
  assert.ok(globalLabels.includes("Manual sandbox dry-run 仍需人工复核"));
  assert.ok(globalLabels.includes("干跑不发送真实请求"));
  assert.ok(globalLabels.includes("Adapter 外壳不包含真实 endpoint"));
  assert.ok(globalLabels.includes("干跑不代表真实价格或下单能力"));
  assert.ok(globalLabels.includes("Provider Sandbox Readiness Workbench 已准备"));
  assert.ok(globalLabels.includes("Offline Provider Scenario Lab 已准备"));
  assert.ok(globalLabels.includes("Read-Only Provider Adapter SDK Skeleton 已准备"));
  assert.ok(globalLabels.includes("Manual Activation Command Center 已准备"));
  assert.ok(globalLabels.includes("Readiness Workbench 不激活 sandbox"));
  assert.ok(globalLabels.includes("Offline Scenario Lab 不联网、不读密钥"));
  assert.ok(globalLabels.includes("Adapter SDK Skeleton 不生成 endpoint、不导入真实 SDK"));
  assert.ok(globalLabels.includes("Command Center 不创建 release、不 push"));
  assert.ok(globalLabels.includes("Human sandbox milestone review 仍需人工复核"));
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
  assert.ok(globalLabels.includes("Category Result Simulator 已准备"));
  assert.ok(globalLabels.includes("Read-Only Comparison Board 已准备"));
  assert.ok(globalLabels.includes("Result Trust Badge 已准备"));
  assert.ok(globalLabels.includes("Category Result Simulator / Read-Only Comparison Board / Result Trust Badge"));
  const publicBetaRcLabels = api.buildFlightWorkflowRiskBadges({
    publicBetaRcConsoleSummary:{ status:"manual_review_required", rcStatus:"manual_review_required", userFacingSummary:{ resultLabel:"Public Beta RC Console 进入人工复核", redacted:true } },
    offlineTrialReleaseGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Offline Trial Release Gate 已准备", redacted:true } },
    publicBetaRcViewModelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Beta RC Console / Offline Trial Release Gate 已准备", redacted:true } },
    safeToProceedWithManualRcReview:true
  }).badges.map((item) => item.label);
  assert.ok(publicBetaRcLabels.includes("Public Beta RC Console 进入人工复核"));
  assert.ok(publicBetaRcLabels.includes("Offline Trial Release Gate 已准备"));
  assert.ok(publicBetaRcLabels.includes("Public Beta RC Console / Offline Trial Release Gate 已准备"));
  assert.ok(publicBetaRcLabels.includes("No Release Mutation / 当前只是 RC 候选，不创建 release、不 push"));
  assert.ok(publicBetaRcLabels.includes("No Transaction / 仍然不接真实 provider、不联网、不启用交易"));
  assert.ok(publicBetaRcLabels.includes("人工复核通过后才能进入下一阶段"));
  const publicBetaStabilityLabels = api.buildFlightWorkflowRiskBadges({
    publicBetaStabilityAuditSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Beta Stability Audit 已准备", redacted:true } },
    manualLaunchHandoffPackSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Manual Launch Handoff Pack 已准备", redacted:true } },
    manualLaunchHandoffViewModelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Beta Stability Audit / Manual Launch Handoff Pack 已准备", redacted:true } },
    safeToProceedWithManualLaunchHandoffReview:true
  }).badges.map((item) => item.label);
  assert.ok(publicBetaStabilityLabels.includes("Public Beta Stability Audit 已准备"));
  assert.ok(publicBetaStabilityLabels.includes("Manual Launch Handoff Pack 已准备"));
  assert.ok(publicBetaStabilityLabels.includes("Public Beta Stability Audit / Manual Launch Handoff Pack 已准备"));
  assert.ok(publicBetaStabilityLabels.includes("Locked Capabilities / 不自动发布、不接 provider、不启用交易"));
  assert.ok(publicBetaStabilityLabels.includes("Continue Testing / 可继续人工试用和问题记录"));
  assert.ok(publicBetaStabilityLabels.includes("既有 secret scan WARN 仅作为已知警告展示"));
  const publicBetaManualQaLabels = api.buildFlightWorkflowRiskBadges({
    publicBetaManualQaReportCenterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Beta Manual QA Report Center 已准备", redacted:true } },
    trialFeedbackSafetyGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Trial Feedback Safety Gate 已准备", redacted:true } },
    publicBetaRcEvidenceSnapshotSummary:{ status:"ready", userFacingSummary:{ resultLabel:"RC Evidence Snapshot 已准备", redacted:true } },
    publicBetaManualQaViewModelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Beta Manual QA ViewModel 已准备", redacted:true } },
    safeToProceedWithManualQaReview:true
  }).badges.map((item) => item.label);
  assert.ok(publicBetaManualQaLabels.includes("Public Beta Manual QA Report Center 已准备"));
  assert.ok(publicBetaManualQaLabels.includes("Trial Feedback Safety Gate 已准备"));
  assert.ok(publicBetaManualQaLabels.includes("RC Evidence Snapshot 已准备"));
  assert.ok(publicBetaManualQaLabels.includes("Public Beta Manual QA ViewModel 已准备"));
  assert.ok(publicBetaManualQaLabels.includes("反馈仍为草稿，不发送、不上传、不保存用户原文"));
  assert.ok(publicBetaManualQaLabels.includes("RC 证据快照不写文件、不导出"));
  assert.ok(publicBetaManualQaLabels.includes("人工 QA 后再决定下一阶段"));
  const trialOperationsLabels = api.buildFlightWorkflowRiskBadges({
    publicBetaTrialOperationsConsoleSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Beta Trial Operations Console 已准备", redacted:true } },
    manualQaScenarioRunnerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Manual QA Scenario Runner 已准备", redacted:true } },
    offlineFeedbackReviewBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Offline Feedback Review Board 已准备", redacted:true } },
    publicBetaTrialOperationsViewModelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Beta Trial Operations View Model 已准备", redacted:true } },
    safeToProceedWithManualTrialOperationsReview:true
  }).badges.map((item) => item.label);
  assert.ok(trialOperationsLabels.includes("Public Beta Trial Operations Console 已准备"));
  assert.ok(trialOperationsLabels.includes("Manual QA Scenario Runner 已准备"));
  assert.ok(trialOperationsLabels.includes("Offline Feedback Review Board 已准备"));
  assert.ok(trialOperationsLabels.includes("Public Beta Trial Operations View Model 已准备"));
  assert.ok(trialOperationsLabels.includes("Flight / Hotel / Product / Restricted / Feedback / No-Transaction / No-Provider 场景已覆盖"));
  assert.ok(trialOperationsLabels.includes("反馈仍保持关闭，不发送、不上传、不保存用户原文"));
  assert.ok(trialOperationsLabels.includes("下一步只能人工复核或继续测试"));
  assert.ok(trialOperationsLabels.includes("不自动发布、不接 provider、不启用交易"));
  const qaOperationsLabels = api.buildFlightWorkflowRiskBadges({
    publicBetaFreezeEvidenceSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Beta Freeze Evidence Summary 已准备", redacted:true } },
    manualTrialIssueReviewBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Manual Trial Issue Review Board 已准备", redacted:true } },
    offlineAcceptanceSnapshotSummary:{ status:"needs_review", userFacingSummary:{ resultLabel:"Offline Acceptance Snapshot 仍需复核", redacted:true } },
    publicBetaAcceptanceSnapshotViewModelSummary:{ status:"needs_review", userFacingSummary:{ resultLabel:"Public Beta Acceptance Snapshot View Model 仍需复核", redacted:true } },
    publicBetaAcceptanceReviewConsoleSummary:{ status:"manual_review_required", userFacingSummary:{ resultLabel:"Public Beta Acceptance Review Console 需人工复核", redacted:true } },
    offlineTrialClosureBoardSummary:{ status:"manual_review_required", userFacingSummary:{ resultLabel:"Offline Trial Closure Board 需人工复核", redacted:true } },
    noLaunchAssuranceGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"No-Launch Assurance Gate 已准备", redacted:true } },
    publicBetaClosureReviewViewModelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Beta Closure Review View Model 已准备", redacted:true } },
    safeToProceedWithManualAcceptanceSnapshotReview:false,
    safeToProceedWithManualClosureReview:true
  }).badges.map((item) => item.label);
  assert.ok(qaOperationsLabels.includes("Public Beta Freeze Evidence Summary 已准备"));
  assert.ok(qaOperationsLabels.includes("Manual Trial Issue Review Board 已准备"));
  assert.ok(qaOperationsLabels.includes("Offline Acceptance Snapshot 仍需复核"));
  assert.ok(qaOperationsLabels.includes("Public Beta Acceptance Snapshot View Model 仍需复核"));
  assert.ok(qaOperationsLabels.includes("Freeze Evidence / 冻结证据仅为只读摘要，不修改配置"));
  assert.ok(qaOperationsLabels.includes("Issue Review / 问题复核仅为离线视图，不创建真实 issue"));
  assert.ok(qaOperationsLabels.includes("Acceptance Snapshot / 验收快照不写文件、不导出"));
  assert.ok(qaOperationsLabels.includes("仍需人工复核后再决定下一阶段"));
  assert.ok(qaOperationsLabels.includes("Public Beta Acceptance Review Console 需人工复核"));
  assert.ok(qaOperationsLabels.includes("Offline Trial Closure Board 需人工复核"));
  assert.ok(qaOperationsLabels.includes("No-Launch Assurance Gate 已准备"));
  assert.ok(qaOperationsLabels.includes("Public Beta Closure Review View Model 已准备"));
  assert.ok(qaOperationsLabels.includes("当前不发布、不创建 release、不 push"));
  assert.ok(qaOperationsLabels.includes("试用闭环仅为离线视图，不关闭真实任务"));
  assert.ok(qaOperationsLabels.includes("仍不允许启用 provider、付款、下单或发布"));
  assert.ok(qaOperationsLabels.includes("验收复核后仍需人工决定下一阶段"));
  const offlineAcceptanceLabels = api.buildFlightWorkflowRiskBadges({
    publicBetaOfflineAcceptanceEvidenceCenterSummary:{ status:"manual_review_required", userFacingSummary:{ resultLabel:"Public Beta Offline Acceptance Evidence Center 需人工复核", redacted:true } },
    manualScenarioReviewBoardSummary:{ status:"manual_review_required", userFacingSummary:{ resultLabel:"Manual Scenario Review Board 需人工复核", redacted:true } },
    zeroPersistenceRegressionGateSummary:{ status:"manual_review_required", userFacingSummary:{ resultLabel:"Zero-Persistence Regression Gate 需人工复核", redacted:true } },
    publicBetaOfflineAcceptanceViewModelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Beta Offline Acceptance ViewModel 已准备", redacted:true } },
    safeToProceedWithManualOfflineAcceptanceReview:false
  }).badges.map((item) => item.label);
  assert.ok(offlineAcceptanceLabels.includes("离线验收证据需人工复核"));
  assert.ok(offlineAcceptanceLabels.includes("人工场景复核需人工复核"));
  assert.ok(offlineAcceptanceLabels.includes("零持久化回归需人工复核"));
  assert.ok(offlineAcceptanceLabels.includes("离线验收视图可人工复核"));
  assert.ok(offlineAcceptanceLabels.includes("Offline Acceptance Evidence / Scenario Review / Zero Persistence"));
  assert.ok(offlineAcceptanceLabels.includes("离线验收证据中心仅为只读展示，不生成证据文件"));
  assert.ok(offlineAcceptanceLabels.includes("人工场景复核板仅为样例复核，不保存场景输入或复核结果"));
  assert.ok(offlineAcceptanceLabels.includes("零持久化回归门确认不保存反馈、用户原文、场景输入、验收记录或证据文件"));
  assert.ok(offlineAcceptanceLabels.includes("provider、联网、外部打开、付款、下单、出票、release、push、launch、反馈提交、上传、issue/task 创建仍保持关闭"));
  const finalAcceptanceLabels = api.buildFlightWorkflowRiskBadges({
    publicBetaFinalAcceptanceLockSummary:{ status:"manual_review_required", userFacingSummary:{ resultLabel:"Public Beta Final Acceptance Lock 需人工复核", redacted:true } },
    offlineReleaseCandidateAuditSummary:{ status:"manual_review_required", userFacingSummary:{ resultLabel:"Offline Release Candidate Audit 需人工复核", redacted:true } },
    zeroActionSafetyConsoleSummary:{ status:"manual_review_required", userFacingSummary:{ resultLabel:"Zero-Action Safety Console 需人工复核", redacted:true } },
    publicBetaFinalAcceptanceViewModelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Beta Final Acceptance ViewModel 已准备", redacted:true } },
    safeToProceedWithManualFinalAcceptanceReview:false
  }).badges.map((item) => item.label);
  assert.ok(finalAcceptanceLabels.includes("最终人工验收锁定需人工复核"));
  assert.ok(finalAcceptanceLabels.includes("离线 RC 审计需人工复核"));
  assert.ok(finalAcceptanceLabels.includes("零动作安全控制台需人工复核"));
  assert.ok(finalAcceptanceLabels.includes("最终人工验收视图可人工复核"));
  assert.ok(finalAcceptanceLabels.includes("Final Acceptance / Release Candidate Audit / Zero Action Safety"));
  assert.ok(finalAcceptanceLabels.includes("最终人工验收锁定仅为只读展示，不保存验收记录"));
  assert.ok(finalAcceptanceLabels.includes("离线 RC 审计不创建 release、不生成审计文件"));
  assert.ok(finalAcceptanceLabels.includes("零动作安全控制台确认没有任何真实动作执行入口"));
  assert.ok(finalAcceptanceLabels.includes("provider、联网、外部打开、付款、下单、出票、release、push、launch、反馈提交、上传、issue/task 创建仍保持关闭"));
  const closureArchiveLabels = api.buildFlightWorkflowRiskBadges({
    publicBetaClosureEvidenceArchiveSummary:{ status:"manual_review_required", archiveStatus:"manual_review_required", userFacingSummary:{ resultLabel:"Public Beta Closure Evidence Archive 需人工复核", redacted:true } },
    manualTrialExitCriteriaSummary:{ status:"manual_review_required", exitCriteriaStatus:"manual_review_required", userFacingSummary:{ resultLabel:"Manual Trial Exit Criteria 需人工复核", redacted:true } },
    offlineNextStepPlanningBoardSummary:{ status:"manual_review_required", planningStatus:"manual_review_required", userFacingSummary:{ resultLabel:"Offline Next-Step Planning Board 需人工复核", redacted:true } },
    publicBetaNextStepViewModelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Beta Closure Evidence Archive / Manual Trial Exit Criteria / Offline Next-Step Planning Board 已准备", redacted:true } },
    publicBetaFinalReadinessCommandCenterSummary:{ status:"manual_review_required", userFacingSummary:{ resultLabel:"Public Beta Final Readiness Command Center 需人工复核", redacted:true } },
    offlineLaunchBlockerMatrixSummary:{ status:"blocked", userFacingSummary:{ resultLabel:"Offline Launch Blocker Matrix 已保持阻断", redacted:true } },
    manualNextPhaseDossierSummary:{ status:"manual_review_required", userFacingSummary:{ resultLabel:"Manual Next-Phase Dossier 需人工复核", redacted:true } },
    publicBetaFinalReadinessViewModelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Beta Final Readiness ViewModel 已准备", redacted:true } },
    publicBetaCandidateLockSummary:{ status:"manual_review_required", userFacingSummary:{ resultLabel:"Public Beta Candidate Lock 需人工复核", redacted:true } },
    finalTrialHandoffConsoleSummary:{ status:"manual_review_required", userFacingSummary:{ resultLabel:"Final Trial Handoff Console 需人工复核", redacted:true } },
    noProviderProductionBoundarySummary:{ status:"manual_review_required", userFacingSummary:{ resultLabel:"No-Provider Production Boundary 需人工复核", redacted:true } },
    publicBetaCandidateViewModelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Beta Candidate ViewModel 已准备", redacted:true } },
    safeToProceedWithManualNextStepReview:true
  }).badges.map((item) => item.label);
  assert.ok(closureArchiveLabels.includes("闭环证据需人工复核"));
  assert.ok(closureArchiveLabels.includes("退出标准需人工复核"));
  assert.ok(closureArchiveLabels.includes("下一步规划待人工决定"));
  assert.ok(closureArchiveLabels.includes("最终准备需人工复核"));
  assert.ok(closureArchiveLabels.includes("发布阻断矩阵已锁定"));
  assert.ok(closureArchiveLabels.includes("下一阶段资料需人工复核"));
  assert.ok(closureArchiveLabels.includes("最终准备视图可人工复核"));
  assert.ok(closureArchiveLabels.includes("候选锁定需人工复核"));
  assert.ok(closureArchiveLabels.includes("最终试用交接需人工复核"));
  assert.ok(closureArchiveLabels.includes("生产边界需人工复核"));
  assert.ok(closureArchiveLabels.includes("候选视图可人工复核"));
  const candidateEvidenceLabels = api.buildFlightWorkflowRiskBadges({
    publicBetaCandidateEvidenceReviewSummary:{ status:"manual_review_required", userFacingSummary:{ resultLabel:"Public Beta Candidate Evidence Review 需人工复核", redacted:true } },
    trialOperatorNotesPanelSummary:{ status:"manual_review_required", userFacingSummary:{ resultLabel:"Trial Operator Notes Panel 需人工复核", redacted:true } },
    offlineSafetyDeltaBoardSummary:{ status:"manual_review_required", userFacingSummary:{ resultLabel:"Offline Safety Delta Board 需人工复核", redacted:true } },
    publicBetaCandidateReviewViewModelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Beta Candidate Review ViewModel 已准备", redacted:true } },
    safeToProceedWithManualCandidateEvidenceReview:true
  }).badges.map((item) => item.label);
  assert.ok(candidateEvidenceLabels.includes("候选证据需人工复核"));
  assert.ok(candidateEvidenceLabels.includes("运营备注需人工复核"));
  assert.ok(candidateEvidenceLabels.includes("安全边界差异需人工复核"));
  assert.ok(candidateEvidenceLabels.includes("候选证据视图可人工复核"));
  const qaFreezeLabels = api.buildFlightWorkflowRiskBadges({
    publicBetaCandidateQaFreezeSummary:{ status:"manual_review_required", userFacingSummary:{ resultLabel:"Public Beta Candidate QA Freeze 需人工复核", redacted:true } },
    trialFeedbackIntakeMockSummary:{ status:"manual_review_required", userFacingSummary:{ resultLabel:"Trial Feedback Intake Mock 需人工复核", redacted:true } },
    offlineRegressionEvidenceBoardSummary:{ status:"manual_review_required", userFacingSummary:{ resultLabel:"Offline Regression Evidence Board 需人工复核", redacted:true } },
    publicBetaQaFreezeViewModelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Beta QA Freeze ViewModel 已准备", redacted:true } },
    safeToProceedWithManualQaFreezeReview:true
  }).badges.map((item) => item.label);
  assert.ok(qaFreezeLabels.includes("QA 冻结需人工复核"));
  assert.ok(qaFreezeLabels.includes("反馈入口需人工复核"));
  assert.ok(qaFreezeLabels.includes("回归证据需人工复核"));
  assert.ok(qaFreezeLabels.includes("QA 冻结视图可人工复核"));
  const offlineLaunchLabels = api.buildFlightWorkflowRiskBadges({
    offlineLaunchDecisionSimulatorSummary:{ status:"ready", userFacingSummary:{ resultLabel:"离线发布决策模拟器已准备", redacted:true } },
    sandboxActivationReceiptLedgerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox 激活回执台账已准备", redacted:true } },
    adapterSecurityRegressionGuardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Adapter 安全回归守卫已准备", redacted:true } },
    providerOfflineLaunchChecklistSummary:{ status:"ready", userFacingSummary:{ resultLabel:"离线 Launch Checklist 已准备", redacted:true } },
    providerOfflineLaunchViewModelSummary:{ status:"ready", title:"Provider 离线 Launch 决策与安全守卫", redacted:true },
    offlineLaunchDecisionSimulatorStatus:"ready",
    sandboxActivationReceiptLedgerStatus:"ready",
    adapterSecurityRegressionGuardStatus:"ready",
    providerOfflineLaunchChecklistStatus:"ready",
    providerOfflineLaunchViewModelStatus:"ready",
    safeToProceedWithManualOfflineLaunchDecisionReview:true
  }).badges.map((item) => item.label);
  assert.ok(offlineLaunchLabels.includes("Offline Launch Decision Simulator 已准备"));
  assert.ok(offlineLaunchLabels.includes("Sandbox Activation Receipt Ledger 已准备"));
  assert.ok(offlineLaunchLabels.includes("Adapter Security Regression Guard 已准备"));
  assert.ok(offlineLaunchLabels.includes("Provider Offline Launch Checklist 已准备"));
  assert.ok(offlineLaunchLabels.includes("Launch Decision 不保存真实决策"));
  assert.ok(offlineLaunchLabels.includes("Activation Receipt Ledger 不保存真实回执"));
  assert.ok(offlineLaunchLabels.includes("Security Guard 不修改配置、不启用 provider"));
  assert.ok(offlineLaunchLabels.includes("Launch Checklist 不创建 release、不 push"));
  assert.ok(offlineLaunchLabels.includes("Manual offline launch decision 仍需人工复核"));
  const launchControlLabels = api.buildFlightWorkflowRiskBadges({
    offlineProviderLaunchControlTowerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"离线 Launch 控制塔已准备", redacted:true } },
    adapterPolicyEngineSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Adapter 策略引擎已准备", redacted:true } },
    humanReleaseEvidenceTimelineSummary:{ status:"ready", userFacingSummary:{ resultLabel:"人工发布证据时间线已准备", redacted:true } },
    sandboxActivationFinalReviewBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox 激活终审板已准备", redacted:true } },
    providerLaunchControlViewModelSummary:{ status:"ready", title:"Provider Launch Control Tower", redacted:true },
    offlineProviderLaunchControlTowerStatus:"ready",
    adapterPolicyEngineStatus:"ready",
    humanReleaseEvidenceTimelineStatus:"ready",
    sandboxActivationFinalReviewBoardStatus:"ready",
    providerLaunchControlViewModelStatus:"ready",
    safeToProceedWithHumanLaunchControlReview:true
  }).badges.map((item) => item.label);
  assert.ok(launchControlLabels.includes("Offline Provider Launch Control Tower 已准备"));
  assert.ok(launchControlLabels.includes("Adapter Policy Engine 已准备"));
  assert.ok(launchControlLabels.includes("Human Release Evidence Timeline 已准备"));
  assert.ok(launchControlLabels.includes("Sandbox Activation Final Review Board 已准备"));
  assert.ok(launchControlLabels.includes("Launch Control 不保存真实决策"));
  assert.ok(launchControlLabels.includes("Adapter Policy 不修改配置、不启用 provider"));
  assert.ok(launchControlLabels.includes("Evidence Timeline 不持久化时间线"));
  assert.ok(launchControlLabels.includes("Final Review 不激活 sandbox"));
  assert.ok(launchControlLabels.includes("Human launch control review 仍需人工复核"));
  const finalLaunchReviewLabels = api.buildFlightWorkflowRiskBadges({
    providerLaunchAuditSnapshotSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider Launch Audit Snapshot 已准备", redacted:true } },
    offlinePolicyReplayCenterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Offline Policy Replay Center 已准备", redacted:true } },
    humanActivationFinalDossierSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Human Activation Final Dossier 已准备", redacted:true } },
    adapterLaunchBoundaryVerifierSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Adapter Launch Boundary Verifier 已准备", redacted:true } },
    providerFinalLaunchReviewViewModelSummary:{ status:"ready", title:"Provider Final Launch Review", redacted:true },
    providerLaunchAuditSnapshotStatus:"ready",
    offlinePolicyReplayCenterStatus:"ready",
    humanActivationFinalDossierStatus:"ready",
    adapterLaunchBoundaryVerifierStatus:"ready",
    providerFinalLaunchReviewViewModelStatus:"ready",
    safeToProceedWithHumanFinalLaunchReview:true
  }).badges.map((item) => item.label);
  assert.ok(finalLaunchReviewLabels.includes("Provider Launch Audit Snapshot 已准备"));
  assert.ok(finalLaunchReviewLabels.includes("Offline Policy Replay Center 已准备"));
  assert.ok(finalLaunchReviewLabels.includes("Human Activation Final Dossier 已准备"));
  assert.ok(finalLaunchReviewLabels.includes("Adapter Launch Boundary Verifier 已准备"));
  assert.ok(finalLaunchReviewLabels.includes("Launch Audit 不写文件、不保存真实决策"));
  assert.ok(finalLaunchReviewLabels.includes("Policy Replay 不修改配置、不启用 provider"));
  assert.ok(finalLaunchReviewLabels.includes("Final Dossier 不持久化档案"));
  assert.ok(finalLaunchReviewLabels.includes("Boundary Verifier 不生成 endpoint、不读取密钥"));
  assert.ok(finalLaunchReviewLabels.includes("Human final launch review 仍需人工复核"));
  const launchReadinessFinalLabels = api.buildFlightWorkflowRiskBadges({
    publicReleaseEvidenceConsoleSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Release Evidence Console 已准备", redacted:true } },
    noProviderUserAssurancePanelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"No-Provider User Assurance Panel 已准备", redacted:true } },
    offlineLaunchReadinessFinalizerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Offline Launch Readiness Finalizer 已准备", redacted:true } },
    userSafePublicClaimVerifierSummary:{ status:"ready", userFacingSummary:{ resultLabel:"User-Safe Public Claim Verifier 已准备", redacted:true } },
    providerLaunchReadinessFinalViewModelSummary:{ status:"ready", title:"Provider Launch Readiness Final Review", redacted:true },
    publicReleaseEvidenceConsoleStatus:"ready",
    noProviderUserAssurancePanelStatus:"ready",
    offlineLaunchReadinessFinalizerStatus:"ready",
    userSafePublicClaimVerifierStatus:"ready",
    providerLaunchReadinessFinalViewModelStatus:"ready",
    safeToProceedWithHumanLaunchReadinessFinalReview:true
  }).badges.map((item) => item.label);
  assert.ok(launchReadinessFinalLabels.includes("Public Release Evidence Console 已准备"));
  assert.ok(launchReadinessFinalLabels.includes("No-Provider User Assurance Panel 已准备"));
  assert.ok(launchReadinessFinalLabels.includes("Offline Launch Readiness Finalizer 已准备"));
  assert.ok(launchReadinessFinalLabels.includes("User-Safe Public Claim Verifier 已准备"));
  assert.ok(launchReadinessFinalLabels.includes("Release Evidence 不生成真实证据文件"));
  assert.ok(launchReadinessFinalLabels.includes("User Assurance 不生成真实用户保证书"));
  assert.ok(launchReadinessFinalLabels.includes("Launch Finalizer 不执行真实 launch"));
  assert.ok(launchReadinessFinalLabels.includes("Claim Verifier 不承诺最低价、最终价或官方背书"));
  assert.ok(launchReadinessFinalLabels.includes("Human launch readiness final review 仍需人工复核"));
  const publicBetaLabels = api.buildFlightWorkflowRiskBadges({
    globalShoppingReadOnlyPublicBetaShellSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Global Shopping Read-Only Public Beta Shell 已准备", redacted:true } },
    providerZeroRuntimeLockSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider-Zero Runtime Lock 已准备", redacted:true } },
    userTrustLaunchBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"User Trust Launch Board 已准备", redacted:true } },
    publicBetaSafetyCopyCenterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Beta Safety Copy Center 已准备", redacted:true } },
    globalShoppingPublicBetaUserFacingCopyPolishSummary:{ status:"ready", userFacingSummary:{ resultLabel:"全球购 Public Beta 已准备", redacted:true } },
    globalShoppingProviderZeroStatusPanelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider-Zero Status Panel 已准备", redacted:true } },
    publicBetaUserJourneyShellSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Beta User Journey 已准备", redacted:true } },
    safeSearchIntentMatrixSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Safe Search Intent Matrix 已准备", redacted:true } },
    publicBetaUserBoundaryPanelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"User Boundary Panel 已准备", redacted:true } },
    publicBetaFinalGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Beta Final Gate 已准备", redacted:true } },
    releaseCandidateConfidenceBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"RC Confidence Board 已准备", redacted:true } },
    publicBetaFinalViewModelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"下一步仍需人工复核", redacted:true } },
    publicBetaTrialReadinessPackSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Beta Trial Readiness Pack 已准备", redacted:true } },
    finalManualAcceptanceConsoleSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Final Manual Acceptance Console 已准备", redacted:true } },
    publicBetaFeedbackPlaceholderSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Feedback Placeholder 已准备", redacted:true } },
    publicBetaFinalManualViewModelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Beta Final Manual View Model 已准备", redacted:true } },
    globalShoppingPublicBetaViewModelSummary:{ status:"ready", title:"Global Shopping Public Beta Review", redacted:true },
    safeToProceedWithHumanPublicBetaReview:true,
    safeToProceedWithManualPublicBetaReview:true,
    safeToProceedWithManualTrialReview:true
  }).badges.map((item) => item.label);
  assert.ok(publicBetaLabels.includes("全球购 Public Beta 已准备"));
  assert.ok(publicBetaLabels.includes("Provider-Zero Status Panel 已准备"));
  assert.ok(publicBetaLabels.includes("Public Beta User Journey 已准备"));
  assert.ok(publicBetaLabels.includes("Safe Search Intent Matrix 已准备"));
  assert.ok(publicBetaLabels.includes("User Boundary Panel 已准备"));
  assert.ok(publicBetaLabels.includes("Global Shopping Read-Only Public Beta Shell 已准备"));
  assert.ok(publicBetaLabels.includes("Provider-Zero Runtime Lock 已准备"));
  assert.ok(publicBetaLabels.includes("User Trust Launch Board 已准备"));
  assert.ok(publicBetaLabels.includes("Public Beta Safety Copy Center 已准备"));
  assert.ok(publicBetaLabels.includes("Public Beta Final Gate 已准备"));
  assert.ok(publicBetaLabels.includes("RC Confidence Board 已准备"));
  assert.ok(publicBetaLabels.includes("Public Beta Trial Readiness Pack 已准备"));
  assert.ok(publicBetaLabels.includes("Final Manual Acceptance Console 已准备"));
  assert.ok(publicBetaLabels.includes("Feedback Placeholder 已准备"));
  assert.ok(publicBetaLabels.includes("Public Beta Final Manual View Model 已准备"));
  assert.ok(publicBetaLabels.includes("全球购 Public Beta / 只读候选价 / 官方价锚点 / 费用归一化"));
  assert.ok(publicBetaLabels.includes("Provider-Zero：未接入真实供应商 / 未读取密钥 / 未联网调用 / 未生成订单"));
  assert.ok(publicBetaLabels.includes("Public Beta 只提供候选价证据，不付款、不下单、不出票"));
  assert.ok(publicBetaLabels.includes("只读搜索计划 / 候选价整理 / 费用归一化步骤 / 官方价锚点步骤 / 用户边界确认"));
  assert.ok(publicBetaLabels.includes("Safe Search Intent Matrix 只允许只读搜索计划"));
  assert.ok(publicBetaLabels.includes("不保存账号、证件或支付信息 / 用户需在对应平台自行完成下单"));
  assert.ok(publicBetaLabels.includes("Provider-Zero Lock 不接真实 provider、不读密钥、不联网"));
  assert.ok(publicBetaLabels.includes("User Trust Launch 不执行真实 launch"));
  assert.ok(publicBetaLabels.includes("Safety Copy 不承诺最低价、最终价或官方背书"));
  assert.ok(publicBetaLabels.includes("Human public beta review 仍需人工复核"));
  assert.ok(publicBetaLabels.includes("下一步仍需人工复核"));
  assert.ok(publicBetaLabels.includes("Public Beta Trial Readiness Pack / Final Manual Acceptance Console / Feedback Placeholder"));
  assert.ok(publicBetaLabels.includes("试用范围：只读候选价、费用归一化、官方价锚点"));
  assert.ok(publicBetaLabels.includes("锁定能力：provider、联网、付款、下单、出票"));
  assert.ok(publicBetaLabels.includes("反馈入口暂不发送、不上传、不保存用户原文"));
  assert.ok(publicBetaLabels.includes("不自动通过 / 不自动发布 / 不保存反馈内容"));
  const finalReviewConsoleLabels = api.buildFlightWorkflowRiskBadges({
    finalOfflineLaunchReviewConsoleSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Final Offline Launch Review Console 已准备", redacted:true } },
    providerActivationBlockerSentinelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider Activation Blocker Sentinel 已准备", redacted:true } },
    readOnlyReleaseEvidenceSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Read-Only Release Evidence Summary 已准备", redacted:true } },
    offlineProviderReadinessDecisionMatrixSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Offline Provider Readiness Decision Matrix 已准备", redacted:true } },
    providerFinalReviewConsoleViewModelSummary:{ status:"ready", title:"Provider Final Review Console", redacted:true },
    finalOfflineLaunchReviewConsoleStatus:"ready",
    providerActivationBlockerSentinelStatus:"ready",
    readOnlyReleaseEvidenceSummaryStatus:"ready",
    offlineProviderReadinessDecisionMatrixStatus:"ready",
    providerFinalReviewConsoleViewModelStatus:"ready",
    safeToProceedWithFinalOfflineProviderReview:true
  }).badges.map((item) => item.label);
  assert.ok(finalReviewConsoleLabels.includes("Final Offline Launch Review Console 已准备"));
  assert.ok(finalReviewConsoleLabels.includes("Provider Activation Blocker Sentinel 已准备"));
  assert.ok(finalReviewConsoleLabels.includes("Read-Only Release Evidence Summary 已准备"));
  assert.ok(finalReviewConsoleLabels.includes("Offline Provider Readiness Decision Matrix 已准备"));
  assert.ok(finalReviewConsoleLabels.includes("Final Review 不保存真实决策"));
  assert.ok(finalReviewConsoleLabels.includes("Activation Blocker 不修改配置、不启用 provider"));
  assert.ok(finalReviewConsoleLabels.includes("Evidence Summary 不写文件、不上传"));
  assert.ok(finalReviewConsoleLabels.includes("Decision Matrix 不创建 release、不 push"));
  assert.ok(finalReviewConsoleLabels.includes("Final offline provider review 仍需人工复核"));
  const governanceClosureLabels = api.buildFlightWorkflowRiskBadges({
    offlineProviderGovernanceClosureBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Offline Provider Governance Closure Board 已准备", redacted:true } },
    noActivationComplianceSealSummary:{ status:"ready", userFacingSummary:{ resultLabel:"No-Activation Compliance Seal 已准备", redacted:true } },
    finalReadinessHandoffSimulatorSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Final Readiness Handoff Simulator 已准备", redacted:true } },
    providerGovernanceClosureEvidenceLedgerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider Governance Closure Evidence Ledger 已准备", redacted:true } },
    providerGovernanceClosureViewModelSummary:{ status:"ready", title:"Provider Governance Closure Review", redacted:true },
    offlineProviderGovernanceClosureBoardStatus:"ready",
    noActivationComplianceSealStatus:"ready",
    finalReadinessHandoffSimulatorStatus:"ready",
    providerGovernanceClosureEvidenceLedgerStatus:"ready",
    providerGovernanceClosureViewModelStatus:"ready",
    safeToProceedWithHumanGovernanceClosureReview:true
  }).badges.map((item) => item.label);
  assert.ok(governanceClosureLabels.includes("Offline Provider Governance Closure Board 已准备"));
  assert.ok(governanceClosureLabels.includes("No-Activation Compliance Seal 已准备"));
  assert.ok(governanceClosureLabels.includes("Final Readiness Handoff Simulator 已准备"));
  assert.ok(governanceClosureLabels.includes("Provider Governance Closure Evidence Ledger 已准备"));
  assert.ok(governanceClosureLabels.includes("Governance Closure 不保存真实治理结论"));
  assert.ok(governanceClosureLabels.includes("No-Activation Seal 不生成真实封条、不执行真实阻断"));
  assert.ok(governanceClosureLabels.includes("Final Handoff 不执行真实交接"));
  assert.ok(governanceClosureLabels.includes("Closure Evidence 不持久化台账、不保存真实 evidence"));
  assert.ok(governanceClosureLabels.includes("Human governance closure review 仍需人工复核"));
  const distributionReadinessLabels = api.buildFlightWorkflowRiskBadges({
    offlineDistributionReadinessCenterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Offline Distribution Readiness Center 已准备", redacted:true } },
    noActivationEnforcementLedgerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"No-Activation Enforcement Ledger 已准备", redacted:true } },
    finalUserTrustSummarySummary:{ status:"ready", userFacingSummary:{ resultLabel:"Final User Trust Summary 已准备", redacted:true } },
    providerSafetyDistributionMatrixSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider Safety Distribution Matrix 已准备", redacted:true } },
    providerDistributionReadinessViewModelSummary:{ status:"ready", title:"Provider Distribution Readiness Review", redacted:true },
    offlineDistributionReadinessCenterStatus:"ready",
    noActivationEnforcementLedgerStatus:"ready",
    finalUserTrustSummaryStatus:"ready",
    providerSafetyDistributionMatrixStatus:"ready",
    providerDistributionReadinessViewModelStatus:"ready",
    safeToProceedWithHumanDistributionReadinessReview:true
  }).badges.map((item) => item.label);
  assert.ok(distributionReadinessLabels.includes("Offline Distribution Readiness Center 已准备"));
  assert.ok(distributionReadinessLabels.includes("No-Activation Enforcement Ledger 已准备"));
  assert.ok(distributionReadinessLabels.includes("Final User Trust Summary 已准备"));
  assert.ok(distributionReadinessLabels.includes("Provider Safety Distribution Matrix 已准备"));
  assert.ok(distributionReadinessLabels.includes("Distribution Readiness 不创建真实分发包"));
  assert.ok(distributionReadinessLabels.includes("No-Activation Enforcement 不执行真实阻断"));
  assert.ok(distributionReadinessLabels.includes("User Trust Summary 不写文件、不保存用户原文"));
  assert.ok(distributionReadinessLabels.includes("Safety Distribution Matrix 不启用 provider、不激活 sandbox"));
  assert.ok(distributionReadinessLabels.includes("Human distribution readiness review 仍需人工复核"));
  const trustClosureLabels = api.buildFlightWorkflowRiskBadges({
    providerPublicTrustClosureCenterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider Public Trust Closure Center 已准备", redacted:true } },
    offlineReleaseMemorySnapshotSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Offline Release Memory Snapshot 已准备", redacted:true } },
    noProviderExecutionFinalGuardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"No-Provider-Execution Final Guard 已准备", redacted:true } },
    userVisibleSafetyBoundaryExplainerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"User-Visible Safety Boundary Explainer 已准备", redacted:true } },
    providerTrustClosureViewModelSummary:{ status:"ready", title:"Provider Trust Closure Review", redacted:true },
    providerPublicTrustClosureCenterStatus:"ready",
    offlineReleaseMemorySnapshotStatus:"ready",
    noProviderExecutionFinalGuardStatus:"ready",
    userVisibleSafetyBoundaryExplainerStatus:"ready",
    providerTrustClosureViewModelStatus:"ready",
    safeToProceedWithHumanTrustClosureReview:true
  }).badges.map((item) => item.label);
  assert.ok(trustClosureLabels.includes("Provider Public Trust Closure Center 已准备"));
  assert.ok(trustClosureLabels.includes("Offline Release Memory Snapshot 已准备"));
  assert.ok(trustClosureLabels.includes("No-Provider-Execution Final Guard 已准备"));
  assert.ok(trustClosureLabels.includes("User-Visible Safety Boundary Explainer 已准备"));
  assert.ok(trustClosureLabels.includes("Public Trust Closure 不生成真实公开声明"));
  assert.ok(trustClosureLabels.includes("Release Memory 不持久化记忆快照"));
  assert.ok(trustClosureLabels.includes("No-Provider Guard 不执行真实阻断、不打开平台"));
  assert.ok(trustClosureLabels.includes("Safety Boundary 不承诺最低价、最终价或官方背书"));
  assert.ok(trustClosureLabels.includes("Human trust closure review 仍需人工复核"));
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
  const providerCertificationLabels = api.buildFlightWorkflowRiskBadges({
    offlineProviderCertificationCenterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"离线 Provider 认证中心已准备", redacted:true } },
    mockIntegrationRegressionLabSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock 集成回归实验室已准备", redacted:true } },
    humanApprovalEvidenceBinderSummary:{ status:"ready", userFacingSummary:{ resultLabel:"人工审批证据夹已准备", redacted:true } },
    adapterBoundaryLockSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Adapter 边界锁已准备", redacted:true } },
    providerCertificationViewModelSummary:{ status:"ready", title:"Provider 离线认证与边界锁", redacted:true },
    offlineProviderCertificationCenterStatus:"ready",
    mockIntegrationRegressionLabStatus:"ready",
    humanApprovalEvidenceBinderStatus:"ready",
    adapterBoundaryLockStatus:"ready",
    providerCertificationViewModelStatus:"ready",
    safeToProceedWithHumanCertificationReview:true
  }).badges.map((item) => item.label);
  assert.ok(providerCertificationLabels.includes("Offline Provider Certification Center 已准备"));
  assert.ok(providerCertificationLabels.includes("Mock Integration Regression Lab 已准备"));
  assert.ok(providerCertificationLabels.includes("Human Approval Evidence Binder 已准备"));
  assert.ok(providerCertificationLabels.includes("Adapter Boundary Lock 已准备"));
  assert.ok(providerCertificationLabels.includes("Certification Center 不生成真实认证文件"));
  assert.ok(providerCertificationLabels.includes("Regression Lab 不运行真实 provider"));
  assert.ok(providerCertificationLabels.includes("Evidence Binder 不写文件、不上传"));
  assert.ok(providerCertificationLabels.includes("Boundary Lock 不修改配置、不启用 provider"));
  assert.ok(providerCertificationLabels.includes("Human certification review 仍需人工复核"));
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
  const readinessReviewLabels = api.buildFlightWorkflowRiskBadges({
    publicBetaReadinessSnapshotSummary:{ status:"manual_review_required", userFacingSummary:{ resultLabel:"Public Beta Readiness Snapshot 需人工复核", redacted:true } },
    manualFeedbackReviewQueueMockSummary:{ status:"manual_review_required", userFacingSummary:{ resultLabel:"Manual Feedback Review Queue Mock 需人工复核", redacted:true } },
    offlineIssueTriageBoardSummary:{ status:"manual_review_required", userFacingSummary:{ resultLabel:"Offline Issue Triage Board 需人工复核", redacted:true } },
    publicBetaReadinessReviewViewModelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Public Beta Readiness Review ViewModel 已准备", redacted:true } }
  }).badges.map((item) => item.label);
  assert.ok(readinessReviewLabels.includes("Public Beta Readiness Snapshot 需人工复核"));
  assert.ok(readinessReviewLabels.includes("Manual Feedback Review Queue Mock 需人工复核"));
  assert.ok(readinessReviewLabels.includes("Offline Issue Triage Board 需人工复核"));
  assert.ok(readinessReviewLabels.includes("Public Beta Readiness Review ViewModel 已准备"));
  assert.ok(readinessReviewLabels.includes("Readiness Snapshot / Feedback Review Queue / Issue Triage"));
  assert.ok(readinessReviewLabels.includes("准备快照仅为只读展示，不生成文件"));
  assert.ok(readinessReviewLabels.includes("反馈复核队列仅为 Mock，不保存、不上传、不创建 issue/task"));
  assert.ok(readinessReviewLabels.includes("问题分级仅为离线展示，不创建真实任务"));
  console.log("FLIGHT_WORKFLOW_RISK_BADGE_BUILDER PASS");
}
main();
