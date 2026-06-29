const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowSafetyRegressionSentinel.js", "apps/desktop/src/renderer/core/flightWorkflowOperatorConsole.js"]);
  const api = windowRef.WeishanFlightWorkflowOperatorConsole;
  assert.equal(api.FLIGHT_WORKFLOW_OPERATOR_CONSOLE_VERSION, "2.1.98");
  const base = { workflowId:"wf1", workflowStateSummary:{ workflowId:"wf1" }, topCandidates:[{ providerName:"sandbox", bookingUrl:null }], selectedCandidate:{ providerName:"sandbox" }, auditReviewSummary:{ status:"ready", auditHealth:{ overall:"pass" } }, humanReviewChecklistSummary:{ status:"ready" }, finalSafeHandoffPacketSummary:{ status:"ready" }, handoffPacketPolicyDecision:{ status:"allowed" }, safetyRegressionSummary:{ status:"pass", checks:[] }, eventLedgerSummary:{ recentEvents:[{ eventType:"handoff_packet_prepared", status:"ready" }] }, blockedActions:[] };
  const ready = api.buildFlightWorkflowOperatorConsole(base);
  assert.equal(ready.consoleName, "flight_workflow_operator_console_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "可以继续只读流程");
  assert.equal(ready.nextOperatorAction.enabled, true);
  assert.equal(JSON.stringify(ready.sections.map((s) => s.sectionId)), JSON.stringify(["workflow_status", "safety_status", "recent_events", "blocked_actions", "handoff_readiness", "rc_review", "global_shopping_goal", "global_shopping_price", "global_shopping_handoff", "pilot_ops", "pilot_readiness", "pilot_onboarding", "issue_review", "issue_pattern"]));
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
