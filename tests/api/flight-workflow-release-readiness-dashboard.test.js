const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function readyInput(extra = {}) {
  return Object.assign({
    releaseVersion:"4.2.1",
    scenarioSimulationSuite:{ status:"pass", summary:{ scenarioCount:2, warningCount:0, failedCount:0, blockedCount:0 }, results:[], redacted:true },
    matrixSummary:{ status:"pass", overallHealth:"pass", scenarioCount:2, passedCount:2, warningCount:0, failedCount:0, blockedCount:0, userFacingSummary:{ resultLabel:"全部通过", redacted:true }, redacted:true },
    safetyRegressionSummary:{ status:"pass", checks:[], failures:[], warnings:[], redacted:true },
    auditReviewSummary:{ status:"ready", auditHealth:{ overall:"pass" }, userFacingSummary:{ resultLabel:"安全检查通过", redacted:true }, redacted:true },
    humanReviewChecklistSummary:{ status:"ready", redacted:true },
    finalSafeHandoffPacketSummary:{ status:"ready", redacted:true },
    safeSessionExportPreview:{ status:"ready", canWriteFile:false, download:false, redacted:true },
    operatorConsoleSummary:{ status:"ready", readiness:{ workflowReady:true, evidenceReady:true, auditReady:true, checklistReady:true, handoffPacketReady:true, safetyRegressionPass:true }, userFacingSummary:{ resultLabel:"可以继续只读流程", redacted:true }, redacted:true }, betaExpansionGateSummary:{ status:"approved", decision:{ safeToExpandReadOnlyBeta:true }, redacted:true }, publicPilotChecklistSummary:{ status:"ready", readiness:{ safeForSmallPublicPilot:true }, redacted:true }, pilotReadinessSummary:{ status:"ready", title:"只读公开试点准备状态", redacted:true }, safeForSmallPublicPilot:true, pilotNextStep:"可以小范围只读试点", pilotOnboardingSummary:{ status:"allowed", redacted:true }, readOnlyConsentSummary:{ status:"accepted", consentSummary:{ allRequiredAccepted:true }, redacted:true }, pilotOnboardingViewModel:{ status:"allowed", redacted:true }, pilotEntryStatus:"allowed", canEnterReadOnlyPilot:true, pilotConsentRequired:false
  }, extra);
}
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/flightWorkflowUserSafetyCopyRegistry.js",
    "apps/desktop/src/renderer/core/flightWorkflowSafetyRegressionSentinel.js",
    "apps/desktop/src/renderer/core/flightWorkflowAuditReviewCenter.js",
    "apps/desktop/src/renderer/core/flightWorkflowHumanReviewChecklist.js",
    "apps/desktop/src/renderer/core/flightWorkflowFinalSafeHandoffPacket.js",
    "apps/desktop/src/renderer/core/flightWorkflowOperatorConsole.js",
    "apps/desktop/src/renderer/core/flightWorkflowSafetyTestMatrixConsole.js",
    "apps/desktop/src/renderer/core/flightWorkflowReleaseReadinessDashboard.js"
  ]);
  const api = windowRef.WeishanFlightWorkflowReleaseReadinessDashboard;
  assert.equal(api.FLIGHT_WORKFLOW_RELEASE_READINESS_DASHBOARD_VERSION, "4.2.1");
  const ready = api.buildFlightWorkflowReleaseReadinessDashboard(readyInput());
  assert.equal(ready.status, "ready");
  assert.equal(ready.safeForUserFacingBeta, true);
  assert.equal(ready.userFacingBetaReadiness, "ready");
  assert.ok(ready.forbiddenCapabilities.length >= 4);
  assert.equal(ready.bookingUrl, null);
  assert.equal(ready.payment, false);
  assert.equal(ready.safeForSmallPublicPilot, true);
  assert.equal(ready.pilotReadinessSummary.status, "ready");
  assert.equal(ready.publicPilotChecklistSummary.status, "ready");
  assert.equal(ready.pilotOnboardingSummary.status, "allowed");
  assert.equal(ready.readOnlyConsentSummary.status, "accepted");
  assert.equal(ready.canEnterReadOnlyPilot, true);
  const warning = api.buildFlightWorkflowReleaseReadinessDashboard(readyInput({ humanReviewChecklistSummary:{ status:"needs_review", redacted:true } }));
  assert.equal(warning.status, "warning");
  assert.equal(warning.safeForUserFacingBeta, false);
  const matrixWarning = api.buildFlightWorkflowReleaseReadinessDashboard(readyInput({ matrixSummary:{ status:"warning", overallHealth:"warning", scenarioCount:2, passedCount:1, warningCount:1, failedCount:0, blockedCount:0, userFacingSummary:{ resultLabel:"存在警告", redacted:true }, redacted:true } }));
  assert.equal(matrixWarning.status, "warning");
  const sentinelFail = api.buildFlightWorkflowReleaseReadinessDashboard(readyInput({ safetyRegressionSummary:{ status:"fail", failures:[{ checkId:"no_trading_urls", field:"bookingUrl", riskType:"trading_url", redacted:true }], checks:[], warnings:[], redacted:true } }));
  assert.equal(sentinelFail.status, "blocked");
  const matrixFail = api.buildFlightWorkflowReleaseReadinessDashboard(readyInput({ matrixSummary:{ status:"fail", overallHealth:"fail", scenarioCount:1, passedCount:0, warningCount:0, failedCount:1, blockedCount:0, userFacingSummary:{ resultLabel:"存在失败项", redacted:true }, redacted:true } }));
  assert.equal(matrixFail.status, "blocked");
  const forbidden = api.buildFlightWorkflowReleaseReadinessDashboard(readyInput({ userFacingSafetyCopy:{ headline:"全网最低 已锁价" } }));
  assert.equal(forbidden.status, "blocked");
  const auditBlocked = api.buildFlightWorkflowReleaseReadinessDashboard(readyInput({ auditReviewSummary:{ status:"blocked", auditHealth:{ overall:"blocked" }, redacted:true } }));
  assert.equal(auditBlocked.status, "blocked");
  const malformed = api.buildFlightWorkflowReleaseReadinessDashboard(null);
  assert.equal(malformed.status, "failed_safe");
  const json = JSON.stringify(api.buildFlightWorkflowReleaseReadinessDashboard(readyInput({ token:"abc", bookingUrl:"https://blocked.example" })));
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("FLIGHT_WORKFLOW_RELEASE_READINESS_DASHBOARD PASS");
}
main();
