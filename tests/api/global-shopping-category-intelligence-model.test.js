const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(file) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL });
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingCategoryIntelligenceModel.js");
  const api = windowRef.WeishanGlobalShoppingCategoryIntelligenceModel;
  const result = api.getGlobalShoppingCategoryIntelligence({ query:"帮我找东京酒店" });
  assert.equal(api.GLOBAL_SHOPPING_CATEGORY_INTELLIGENCE_MODEL_VERSION, "4.2.8");
  assert.equal(result.categoryIntelligence.categoryId, "hotel");
  assert.equal(Array.isArray(result.categoryIntelligence.providers), true);
  console.log("GLOBAL_SHOPPING_CATEGORY_INTELLIGENCE_MODEL PASS");
}

main();
