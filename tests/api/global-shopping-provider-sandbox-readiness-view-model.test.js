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
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyRealProviderSandboxGate.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRequestEnvelopeBuilder.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCallAuditLedger.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderSandboxReadinessViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderSandboxReadinessViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_SANDBOX_READINESS_VIEW_MODEL_VERSION, "4.0.9");

  const gate = windowRef.WeishanGlobalShoppingReadOnlyRealProviderSandboxGate.buildGlobalShoppingReadOnlyRealProviderSandboxGate({
    readOnlyProviderSandboxConnectorSummary:{ status:"ready" }, fixtureReplayConsoleSummary:{ status:"ready" }, normalizedPriceCandidateBoardSummary:{ status:"ready" }, providerResponseContractSummary:{ status:"ready" }, pricePipelineOrchestratorSummary:{ status:"ready" }, providerCredentialSafetySummary:{ status:"ready" }, sandboxPriceFeedSummary:{ status:"ready" }
  });
  const envelope = windowRef.WeishanGlobalShoppingProviderRequestEnvelopeBuilder.buildGlobalShoppingProviderRequestEnvelopeBuilder({ providerId:"provider_1", requestMode:"sandbox_ready", itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", passengerCount:1, userRegion:"CN" });
  const ledger = windowRef.WeishanGlobalShoppingProviderCallAuditLedger.buildGlobalShoppingProviderCallAuditLedger({ auditEntries:[{ auditId:"audit_1", providerId:"provider_1", requestMode:"sandbox_ready", callStatus:"dry_run", redacted:true, timestamp:"redacted_now", safetyStatus:"redacted_safe" }] });

  const ready = api.buildGlobalShoppingProviderSandboxReadinessViewModel({ realProviderSandboxGateSummary:gate, providerRequestEnvelopeSummary:envelope, providerCallAuditLedgerSummary:ledger });
  assert.equal(ready.appVersion, "4.0.9");
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "真实只读 Provider Sandbox 准备");
  assert.equal(ready.cards.length, 4);
  assert.equal(ready.disclosureRows.length, 4);
  assert.match(ready.caveat, /不发送请求，不读取真实密钥，不保存 raw response/);

  assert.equal(api.buildGlobalShoppingProviderSandboxReadinessViewModel({ realProviderSandboxGateSummary:gate, providerRequestEnvelopeSummary:envelope }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingProviderSandboxReadinessViewModel({ realProviderSandboxGateSummary:{ status:"blocked" }, providerRequestEnvelopeSummary:envelope, providerCallAuditLedgerSummary:ledger }).status, "blocked");
  assert.equal(api.buildGlobalShoppingProviderSandboxReadinessViewModel({ realProviderSandboxGateSummary:gate, providerRequestEnvelopeSummary:envelope, providerCallAuditLedgerSummary:ledger, openExternal:true }).status, "blocked");

  const safeJson = JSON.stringify(ready);
  assert.equal(/https?:\/\/|"(token|secret)":"[^"]+"/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_SANDBOX_READINESS_VIEW_MODEL PASS");
}

main();
