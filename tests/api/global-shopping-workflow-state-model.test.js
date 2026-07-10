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
  return window;
}

function main() {
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingWorkflowStateModel.js");
  const api = windowRef.WeishanGlobalShoppingWorkflowStateModel;
  const ranked = api.buildGlobalShoppingWorkflowState({ hasRanking:true });
  const recommended = api.buildGlobalShoppingWorkflowState({ hasRecommendation:true });

  assert.equal(api.GLOBAL_SHOPPING_WORKFLOW_STATE_MODEL_VERSION, "4.2.8");
  assert.equal(ranked.currentStage, "ranking");
  assert.equal(recommended.currentStage, "recommended");
  assert.equal(recommended.terminalState, true);
  assert.equal(Array.isArray(recommended.completedStages), true);
  assert.equal(recommended.completedStages.includes("recommended"), true);
  console.log("GLOBAL_SHOPPING_WORKFLOW_STATE_MODEL PASS");
}

main();
