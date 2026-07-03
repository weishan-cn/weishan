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
    "apps/desktop/src/renderer/core/globalShoppingProviderCoverageDashboard.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderCoverageDashboard;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_COVERAGE_DASHBOARD_VERSION, "4.1.0");

  const ready = api.buildGlobalShoppingProviderCoverageDashboard({
    adapterRegistrySummary:{
      adapters:[{
        providerType:"official",
        itemType:"flight",
        region:"CN",
        redacted:true
      }]
    },
    firstSandboxProviderConnectorSummary:{
      connectorName:"global_shopping_first_sandbox_provider_connector_v1",
      redacted:true
    }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Provider 覆盖看板");
  assert.equal(ready.coverageSummary.totalRegisteredAdapters, 1);
  assert.equal(ready.coverageSummary.doesNotClaimWholeNetworkCoverage, true);

  const review = api.buildGlobalShoppingProviderCoverageDashboard({});
  assert.equal(review.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderCoverageDashboard({
    adapterRegistrySummary:{ adapters:[{ providerType:"official", itemType:"flight", redacted:true }] },
    claimsWholeNetworkCoverage:true
  });
  assert.equal(blocked.status, "blocked");
  assert.ok(blocked.blockedReasons.includes("whole_network_coverage_claim_detected"));

  const safeJson = JSON.stringify(ready);
  assert.equal(/https?:\/\/|"(token|secret|key)":"[^"]+"/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_COVERAGE_DASHBOARD PASS");
}

main();
