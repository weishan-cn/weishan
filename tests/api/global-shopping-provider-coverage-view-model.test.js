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
    "apps/desktop/src/renderer/core/globalShoppingProviderCoverageViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderCoverageViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_COVERAGE_VIEW_MODEL_VERSION, "4.2.2");

  const ready = api.buildGlobalShoppingProviderCoverageViewModel({
    firstSandboxProviderConnectorSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Connector 已准备", redacted:true }, rows:[{ rowId:"connector", label:"Connector", value:"ready", status:"pass", redacted:true }] },
    providerCoverageDashboardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 覆盖结构已准备", redacted:true }, coverageRows:[{ rowId:"coverage", label:"Coverage", value:"1", status:"pass", redacted:true }] },
    readOnlySourceTrustScoreSummary:{ status:"ready", userFacingSummary:{ resultLabel:"来源可信度评分已准备", redacted:true }, rows:[{ rowId:"trust", label:"Trust", value:"official / high / 90", status:"pass", redacted:true }] },
    safeToProceedWithFirstReadOnlyProviderSandboxIntegration:true
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider 覆盖与来源可信度");
  assert.equal(ready.cards.length, 4);
  assert.equal(ready.caveat.includes("fixture/dry-run/sandbox"), true);

  const review = api.buildGlobalShoppingProviderCoverageViewModel({});
  assert.equal(review.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderCoverageViewModel({
    firstSandboxProviderConnectorSummary:{ status:"blocked", userFacingSummary:{ resultLabel:"已阻断", redacted:true } }
  });
  assert.equal(blocked.status, "blocked");

  const safeJson = JSON.stringify(ready);
  assert.equal(/https?:\/\/|"(token|secret|key)":"[^"]+"/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_COVERAGE_VIEW_MODEL PASS");
}

main();
