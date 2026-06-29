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
    "apps/desktop/src/renderer/core/globalShoppingProviderAdapterRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingDryRunProviderResponseNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderRunbookBoard.js"
  ]);
  const registry = windowRef.WeishanGlobalShoppingProviderAdapterRegistry.buildGlobalShoppingProviderAdapterRegistry({
    registryMode:"dry_run",
    adapterShells:[{
      adapterId:"global_fixture_provider_dry_run",
      providerId:"global_fixture_provider",
      providerName:"Global Shopping Fixture Sandbox",
      providerType:"fixture",
      adapterMode:"dry_run",
      readOnly:true,
      sandboxOnly:true,
      productionDisabled:true,
      redactedOutputOnly:true
    }]
  });
  const normalizer = windowRef.WeishanGlobalShoppingDryRunProviderResponseNormalizer.buildGlobalShoppingDryRunProviderResponseNormalizer({
    adapterRegistry:registry,
    dryRunHarness:{ status:"ready", redacted:true },
    responseMode:"dry_run",
    redactedResponseSummary:{ responseMode:"dry_run", redacted:true },
    fixturePrices:[{ title:"SHA-CTU Fixture", basePrice:920, taxAmount:120, currency:"CNY" }]
  });
  const api = windowRef.WeishanGlobalShoppingSandboxProviderRunbookBoard;
  assert.equal(api.GLOBAL_SHOPPING_SANDBOX_PROVIDER_RUNBOOK_BOARD_VERSION, "2.2.8");

  const ready = api.buildGlobalShoppingSandboxProviderRunbookBoard({
    providerAdapterRegistrySummary:registry,
    providerSandboxDryRunHarnessSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider Sandbox 干跑框架已准备" }, redacted:true },
    firstReadOnlyProviderAdapterShellSummary:{ status:"ready", userFacingSummary:{ resultLabel:"第一个只读 Provider Adapter 外壳已准备" }, redacted:true },
    providerSandboxSafetyKillSwitchSummary:{ status:"clear", userFacingSummary:{ resultLabel:"Provider Sandbox 安全熔断器未触发" }, redacted:true },
    providerRequestEnvelopeSummary:{ status:"ready", redacted:true },
    providerCallAuditLedgerSummary:{ status:"ready", redacted:true },
    sandboxProviderResponseContractSummary:{ status:"ready", redacted:true },
    dryRunProviderResponseNormalizerSummary:normalizer
  });
  assert.equal(ready.appVersion, "2.2.8");
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Sandbox Provider 接入运行手册");
  assert.equal(ready.runbookStages.length, 6);
  assert.equal(ready.rows.length, 6);

  const review = api.buildGlobalShoppingSandboxProviderRunbookBoard({
    providerAdapterRegistrySummary:registry,
    providerSandboxDryRunHarnessSummary:{ status:"needs_review", redacted:true }
  });
  assert.equal(review.status, "needs_review");

  const blocked = api.buildGlobalShoppingSandboxProviderRunbookBoard({
    providerAdapterRegistrySummary:registry,
    providerSandboxDryRunHarnessSummary:{ status:"ready", redacted:true },
    firstReadOnlyProviderAdapterShellSummary:{ status:"ready", redacted:true },
    providerSandboxSafetyKillSwitchSummary:{ status:"blocked", redacted:true },
    noNetwork:false
  });
  assert.equal(blocked.status, "blocked");
  assert.ok(blocked.blockedReasons.includes("kill_switch_blocked"));

  const safeJson = JSON.stringify(ready);
  assert.equal(/https?:\/\/|"(token|secret|key)":"[^"]+"/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_SANDBOX_PROVIDER_RUNBOOK_BOARD PASS");
}

main();
