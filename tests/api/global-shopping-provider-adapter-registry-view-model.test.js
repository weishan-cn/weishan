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
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderRunbookBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderAdapterRegistryViewModel.js"
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
  const runbook = windowRef.WeishanGlobalShoppingSandboxProviderRunbookBoard.buildGlobalShoppingSandboxProviderRunbookBoard({
    providerAdapterRegistrySummary:registry,
    providerSandboxDryRunHarnessSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider Sandbox 干跑框架已准备" }, redacted:true },
    firstReadOnlyProviderAdapterShellSummary:{ status:"ready", userFacingSummary:{ resultLabel:"第一个只读 Provider Adapter 外壳已准备" }, redacted:true },
    providerSandboxSafetyKillSwitchSummary:{ status:"clear", redacted:true },
    providerRequestEnvelopeSummary:{ status:"ready", redacted:true },
    providerCallAuditLedgerSummary:{ status:"ready", redacted:true },
    sandboxProviderResponseContractSummary:{ status:"ready", redacted:true },
    dryRunProviderResponseNormalizerSummary:normalizer
  });
  const api = windowRef.WeishanGlobalShoppingProviderAdapterRegistryViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_ADAPTER_REGISTRY_VIEW_MODEL_VERSION, "4.2.5");

  const ready = api.buildGlobalShoppingProviderAdapterRegistryViewModel({
    providerAdapterRegistrySummary:registry,
    dryRunProviderResponseNormalizerSummary:normalizer,
    sandboxProviderRunbookSummary:runbook,
    safeToProceedWithFirstSandboxProviderConnectorImplementation:true
  });
  assert.equal(ready.appVersion, "4.2.5");
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider Adapter 注册与接入手册");
  assert.equal(ready.cards.length, 4);
  assert.equal(ready.disclosureRows.length, 4);
  assert.match(ready.caveat, /只读 fixture\/dry-run\/sandbox adapter/);

  const review = api.buildGlobalShoppingProviderAdapterRegistryViewModel({
    providerAdapterRegistrySummary:registry
  });
  assert.equal(review.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderAdapterRegistryViewModel({
    providerAdapterRegistrySummary:Object.assign({}, registry, { bookingUrl:"https://blocked.example" }),
    dryRunProviderResponseNormalizerSummary:normalizer,
    sandboxProviderRunbookSummary:runbook
  });
  assert.equal(blocked.status, "blocked");

  const safeJson = JSON.stringify(ready);
  assert.equal(/https?:\/\/|"(token|secret|key)":"[^"]+"/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_ADAPTER_REGISTRY_VIEW_MODEL PASS");
}

main();
