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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingUserPreferenceModel.js");
  const api = windowRef.WeishanGlobalShoppingUserPreferenceModel;
  const result = api.buildGlobalShoppingUserPreferenceModel({
    preferredCountry:"JP",
    preferredProvider:"Amazon Japan",
    officialOnly:true,
    cheapestFirst:false,
    explicitPreferenceSource:"user_choice"
  });

  assert.equal(api.GLOBAL_SHOPPING_USER_PREFERENCE_MODEL_VERSION, "4.2.8");
  assert.equal(result.preferredCountry, "JP");
  assert.equal(result.preferredProvider, "Amazon Japan");
  assert.equal(result.officialOnly, true);
  assert.equal(result.cheapestFirst, false);
  console.log("GLOBAL_SHOPPING_USER_PREFERENCE PASS");
}

main();
