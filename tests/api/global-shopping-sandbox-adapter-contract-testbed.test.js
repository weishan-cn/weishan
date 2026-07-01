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
    "apps/desktop/src/renderer/core/globalShoppingProviderRequestEnvelopeBuilder.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderResponseContract.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxAdapterContractTestbed.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingSandboxAdapterContractTestbed;
  assert.equal(api.GLOBAL_SHOPPING_SANDBOX_ADAPTER_CONTRACT_TESTBED_VERSION, "2.6.0");
  const ready = api.buildGlobalShoppingSandboxAdapterContractTestbed({
    providerRequestEnvelopeSummary:{ status:"ready", userFacingSummary:{ resultLabel:"request envelope 合同已准备", redacted:true } },
    sandboxProviderResponseContractSummary:{ status:"ready", userFacingSummary:{ resultLabel:"response summary 合同已准备", redacted:true } }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.testbedName, "global_shopping_sandbox_adapter_contract_testbed_v1");
  assert.equal(ready.userFacingSummary.title, "Sandbox Adapter 合同测试台");
  assert.equal(ready.contractCases.length, 3);
  assert.equal(ready.contractHealth.noNetworkCall, true);
  assert.equal(ready.rows.some((row) => row.label === "网络与 endpoint 边界"), true);
  const isolatedApi = load([
    "apps/desktop/src/renderer/core/globalShoppingSandboxAdapterContractTestbed.js"
  ]).WeishanGlobalShoppingSandboxAdapterContractTestbed;
  const needsReview = isolatedApi.buildGlobalShoppingSandboxAdapterContractTestbed({});
  assert.equal(needsReview.status, "needs_review");
  const blocked = api.buildGlobalShoppingSandboxAdapterContractTestbed({ network:true, readApiKey:true, bookingUrl:"https://blocked.example" });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blockedReasons.includes("network_detected"), true);
  assert.equal(blocked.blockedReasons.includes("api_key_detected"), true);
  assert.equal(blocked.blockedReasons.includes("transaction_url_detected"), true);
  const audit = api.buildGlobalShoppingSandboxAdapterContractTestbedAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" });
  const safeJson = JSON.stringify(audit);
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_SANDBOX_ADAPTER_CONTRACT_TESTBED PASS");
}

main();
