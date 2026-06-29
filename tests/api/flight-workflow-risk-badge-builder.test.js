const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowRiskBadgeBuilder.js"]);
  const api = windowRef.WeishanFlightWorkflowRiskBadgeBuilder;
  assert.equal(api.FLIGHT_WORKFLOW_RISK_BADGE_BUILDER_VERSION, "2.2.7");
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
