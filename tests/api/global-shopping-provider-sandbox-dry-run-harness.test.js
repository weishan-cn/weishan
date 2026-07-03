const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyRealProviderSandboxGate.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRequestEnvelopeBuilder.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCallAuditLedger.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderSandboxSafetyKillSwitch.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderSandboxDryRunHarness.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderSandboxDryRunHarness;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_SANDBOX_DRY_RUN_HARNESS_VERSION, "4.1.4");

  const gate = windowRef.WeishanGlobalShoppingReadOnlyRealProviderSandboxGate.buildGlobalShoppingReadOnlyRealProviderSandboxGate({
    readOnlyProviderSandboxConnectorSummary:{ status:"ready" },
    fixtureReplayConsoleSummary:{ status:"ready" },
    normalizedPriceCandidateBoardSummary:{ status:"ready" },
    providerResponseContractSummary:{ status:"ready" },
    pricePipelineOrchestratorSummary:{ status:"ready" },
    providerCredentialSafetySummary:{ status:"ready" },
    sandboxPriceFeedSummary:{ status:"ready" }
  });
  const envelope = windowRef.WeishanGlobalShoppingProviderRequestEnvelopeBuilder.buildGlobalShoppingProviderRequestEnvelopeBuilder({
    providerId:"provider_1",
    providerName:"Fixture Provider",
    requestMode:"sandbox_ready",
    itemType:"flight",
    origin:"SHA",
    destination:"CTU",
    departureDate:"2026-07-15",
    passengerCount:1,
    userRegion:"CN"
  });
  const ledger = windowRef.WeishanGlobalShoppingProviderCallAuditLedger.buildGlobalShoppingProviderCallAuditLedger({
    providerId:"provider_1",
    auditEntries:[{ auditId:"audit_1", providerId:"provider_1", requestMode:"sandbox_ready", callStatus:"dry_run", redacted:true, timestamp:"redacted_now", safetyStatus:"redacted_safe" }]
  });
  const killSwitch = windowRef.WeishanGlobalShoppingProviderSandboxSafetyKillSwitch.buildGlobalShoppingProviderSandboxSafetyKillSwitch({});

  const ready = api.buildGlobalShoppingProviderSandboxDryRunHarness({
    providerId:"provider_1",
    providerName:"Fixture Provider",
    providerRequestEnvelopeSummary:envelope,
    realProviderSandboxGateSummary:gate,
    providerCallAuditLedgerSummary:ledger,
    providerSandboxSafetyKillSwitchSummary:killSwitch
  });
  assert.equal(ready.appVersion, "4.1.4");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Provider Sandbox 干跑框架");
  assert.equal(ready.rows.length, 8);
  assert.match(ready.userFacingSummary.caveat, /不发送真实请求/);

  assert.equal(api.buildGlobalShoppingProviderSandboxDryRunHarness({
    providerRequestEnvelopeSummary:envelope,
    realProviderSandboxGateSummary:gate,
    providerCallAuditLedgerSummary:ledger
  }).status, "ready");
  assert.equal(api.buildGlobalShoppingProviderSandboxDryRunHarness({
    providerRequestEnvelopeSummary:envelope,
    realProviderSandboxGateSummary:gate,
    providerCallAuditLedgerSummary:ledger,
    providerSandboxSafetyKillSwitchSummary:killSwitch,
    networkEnabled:true
  }).status, "blocked");

  const safeJson = JSON.stringify(ready);
  assert.equal(/https?:\/\/|"(token|secret)":"[^"]+"/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_SANDBOX_DRY_RUN_HARNESS PASS");
}

main();
