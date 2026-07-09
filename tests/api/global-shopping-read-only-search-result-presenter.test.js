const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySearchResultModel.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformCandidateFactory.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySearchResultRanker.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySearchResultPresenter.js"
  ]);
  const factory = windowRef.WeishanGlobalShoppingPlatformCandidateFactory;
  const api = windowRef.WeishanGlobalShoppingReadOnlySearchResultPresenter;
  const presentation = api.buildGlobalShoppingReadOnlySearchResultPresentation({
    category:"hotel",
    candidates:factory.buildGlobalShoppingPlatformCandidates({
      category:"hotel",
      normalizedFields:{ destinationText:"东京" }
    })
  });
  assert.equal(api.GLOBAL_SHOPPING_READ_ONLY_SEARCH_RESULT_PRESENTER_VERSION, "4.2.7");
  assert.equal(presentation.topResults.length, 3);
  assert.equal(presentation.candidateCount >= 8, true);
  assert.match(presentation.recommendation.title, /优先查看/);
  assert.match(presentation.userFacingSummary.caveat, /只读候选入口/);
  console.log("GLOBAL_SHOPPING_READ_ONLY_SEARCH_RESULT_PRESENTER PASS");
}

main();
