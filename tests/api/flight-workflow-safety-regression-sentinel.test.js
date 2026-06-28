const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowSafetyRegressionSentinel.js"]);
  const api = windowRef.WeishanFlightWorkflowSafetyRegressionSentinel;
  assert.equal(api.FLIGHT_WORKFLOW_SAFETY_REGRESSION_SENTINEL_VERSION, "2.1.90");
  const safe = api.buildFlightWorkflowSafetyRegressionReport({ bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, autoOpen:false, autoRefresh:false, fileWrite:false, download:false, note:"平台最终为准" });
  assert.equal(safe.sentinelName, "flight_workflow_safety_regression_sentinel_v1");
  assert.equal(safe.status, "pass");
  const cases = [
    ["bookingUrl", "https://blocked.example"], ["checkoutUrl", "https://blocked.example"], ["paymentUrl", "https://blocked.example"], ["orderUrl", "https://blocked.example"],
    ["payment", true], ["order", true], ["ticketing", true], ["identityUpload", true], ["credentialInput", true], ["rawResponseStored", true], ["rawUserTextStored", true], ["secretStored", true], ["autoOpen", true], ["autoRefresh", true], ["fileWrite", true], ["download", true]
  ];
  for (const [key, value] of cases) {
    const input = { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null };
    input[key] = value;
    const report = api.buildFlightWorkflowSafetyRegressionReport(input);
    assert.equal(report.status, "fail", key);
    assert.equal(JSON.stringify(report).includes("https://blocked.example"), false);
  }
  assert.equal(api.buildFlightWorkflowSafetyRegressionReport({ line:"全网最低" }).status, "fail");
  assert.equal(api.buildFlightWorkflowSafetyRegressionReport({ line:"已锁价" }).status, "fail");
  assert.equal(api.buildFlightWorkflowSafetyRegressionReport({ line:"可出票" }).status, "fail");
  assert.equal(api.buildFlightWorkflowSafetyRegressionReport(null).status, "failed_safe");
  const json = JSON.stringify(api.buildFlightWorkflowSafetyRegressionReport({ token:"abc", rawProviderResponse:{ price:1 } }));
  assert.equal(json.includes("abc"), false);
  const pilot = api.buildFlightWorkflowSafetyRegressionReport({ betaExpansionGateSummary:{ bookingUrl:null, payment:false, rawUserTextStored:false, secretStored:false }, publicPilotChecklistSummary:{ download:false, fileWrite:false }, pilotReadinessSummary:{ paymentUrl:null, orderUrl:null }, pilotOnboardingSummary:{ bookingUrl:null, paymentUrl:null, rawUserTextStored:false, secretStored:false }, readOnlyConsentSummary:{ orderUrl:null, fileWrite:false, download:false }, pilotOnboardingViewModel:{ checkoutUrl:null, autoOpen:false } });
  assert.equal(pilot.status, "pass");
  const rc = api.buildFlightWorkflowSafetyRegressionReport({ rcCandidateReviewSummary:{ bookingUrl:null, payment:false, rawUserTextStored:false, secretStored:false }, rcEvidenceReviewSummary:{ orderUrl:null, fileWrite:false, download:false }, rcReviewViewModelSummary:{ checkoutUrl:null, autoOpen:false } });
  assert.equal(rc.status, "pass");
  assert.equal(rc.rcCandidateReviewSummary.bookingUrl, null);
  const copy = api.buildFlightWorkflowSafetyRegressionReport({ rcCopyFinalizationSummary:{ bookingUrl:null, payment:false, rawUserTextStored:false, secretStored:false }, safetyDisclosureReviewSummary:{ orderUrl:null, fileWrite:false, download:false }, rcCopyReviewViewModelSummary:{ checkoutUrl:null, autoOpen:false } });
  assert.equal(copy.status, "pass");
  assert.equal(copy.rcCopyFinalizationSummary.bookingUrl, null);
  const global = api.buildFlightWorkflowSafetyRegressionReport({
    globalShoppingProductGoalSummary:{ status:"aligned", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    jumpToPlatformBoundarySummary:{ status:"safe", safety:{ checkoutUrl:null, autoOpen:false, payment:false, order:false, ticketing:false } },
    globalShoppingProductGoalViewModelSummary:{ status:"aligned", bookingUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false },
    sameItemMatcherSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    duplicateCandidateMergerSummary:{ status:"merged", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    coveredLowestCandidateBoardSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } }
  });
  assert.equal(global.status, "pass");
  assert.equal(global.globalShoppingProductGoalSummary.status, "aligned");
  assert.equal(global.jumpToPlatformBoundarySummary.status, "safe");
  assert.equal(global.sameItemMatcherSummary.status, "ready");
  console.log("FLIGHT_WORKFLOW_SAFETY_REGRESSION_SENTINEL PASS");
}
main();
