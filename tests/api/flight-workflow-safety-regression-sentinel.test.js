const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowSafetyRegressionSentinel.js"]);
  const api = windowRef.WeishanFlightWorkflowSafetyRegressionSentinel;
  assert.equal(api.FLIGHT_WORKFLOW_SAFETY_REGRESSION_SENTINEL_VERSION, "2.1.68");
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
  console.log("FLIGHT_WORKFLOW_SAFETY_REGRESSION_SENTINEL PASS");
}
main();
