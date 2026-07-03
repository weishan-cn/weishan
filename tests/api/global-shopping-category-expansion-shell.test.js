const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(file) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window.WeishanGlobalShoppingCategoryExpansionShell;
}

function category(id) {
  return {
    readonlySearchIntent:id + " readonly search",
    candidateEvidence:id + " evidence",
    feeNormalization:id + " fee normalization",
    officialAnchor:id + " official anchor",
    riskNotes:["manual review only"],
    userBoundary:"Manual Review Required"
  };
}

function main() {
  const api = load("apps/desktop/src/renderer/core/globalShoppingCategoryExpansionShell.js");
  assert.equal(api.GLOBAL_SHOPPING_CATEGORY_EXPANSION_SHELL_VERSION, "4.1.3");
  const ready = api.buildGlobalShoppingCategoryExpansionShell({
    flight:category("flight"),
    hotel:category("hotel"),
    product:category("product")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "Flight / Hotel / Product 只读外壳已准备");
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.buyButtonEnabled, false);
  assert.equal(api.buildGlobalShoppingCategoryExpansionShell({
    flight:category("flight"),
    hotel:category("hotel")
  }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingCategoryExpansionShell({
    flight:Object.assign(category("flight"), { providerRequest:true }),
    hotel:category("hotel"),
    product:category("product")
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_CATEGORY_EXPANSION_SHELL PASS");
}

main();
