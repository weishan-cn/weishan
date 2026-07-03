const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingReadOnlyRealProviderSandboxGate.js"]);
  const api = windowRef.WeishanGlobalShoppingReadOnlyRealProviderSandboxGate;
  assert.equal(api.GLOBAL_SHOPPING_READ_ONLY_REAL_PROVIDER_SANDBOX_GATE_VERSION, "4.1.6");

  const ready = api.buildGlobalShoppingReadOnlyRealProviderSandboxGate({
    readOnlyProviderSandboxConnectorSummary:{ status:"ready" },
    fixtureReplayConsoleSummary:{ status:"ready" },
    normalizedPriceCandidateBoardSummary:{ status:"ready" },
    providerResponseContractSummary:{ status:"ready" },
    pricePipelineOrchestratorSummary:{ status:"ready" },
    providerCredentialSafetySummary:{ status:"ready" },
    sandboxPriceFeedSummary:{ status:"ready" }
  });
  assert.equal(ready.appVersion, "4.1.6");
  assert.equal(ready.status, "ready");
  assert.equal(ready.sandboxReadiness.safeToPrepareReadOnlyProviderSandbox, true);
  assert.equal(ready.readinessRows.length, 8);

  assert.equal(api.buildGlobalShoppingReadOnlyRealProviderSandboxGate({ providerCredentialSafetySummary:{ status:"ready" } }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingReadOnlyRealProviderSandboxGate({
    readOnlyProviderSandboxConnectorSummary:{ status:"ready" }, fixtureReplayConsoleSummary:{ status:"ready" }, normalizedPriceCandidateBoardSummary:{ status:"ready" }, providerResponseContractSummary:{ status:"ready" }, pricePipelineOrchestratorSummary:{ status:"ready" }, providerCredentialSafetySummary:{ status:"ready" }, sandboxPriceFeedSummary:{ status:"ready" }, networkEnabled:true
  }).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlyRealProviderSandboxGate({
    readOnlyProviderSandboxConnectorSummary:{ status:"ready" }, fixtureReplayConsoleSummary:{ status:"ready" }, normalizedPriceCandidateBoardSummary:{ status:"ready" }, providerResponseContractSummary:{ status:"ready" }, pricePipelineOrchestratorSummary:{ status:"ready" }, providerCredentialSafetySummary:{ status:"ready" }, sandboxPriceFeedSummary:{ status:"ready" }, bookingUrl:"https://blocked.example"
  }).status, "blocked");

  const safeJson = JSON.stringify(api.buildGlobalShoppingReadOnlyRealProviderSandboxGate({ token:"abc", secret:"def", bookingUrl:"https://blocked.example" }));
  assert.equal(/abc|def|https?://blocked|paymentUrl|orderUrl|checkoutUrl/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_READ_ONLY_REAL_PROVIDER_SANDBOX_GATE PASS");
}

main();
