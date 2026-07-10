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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingProviderResponseSafetyFilter.js");
  const api = windowRef.WeishanGlobalShoppingProviderResponseSafetyFilter;
  const result = api.buildGlobalShoppingProviderResponseSafetyFilter({
    providerId:"amazon_japan",
    token:"sk-live-blocked",
    contactEmail:"user@example.com",
    nested:{ authorization:"Bearer blocked", title:"Nintendo Switch" }
  });

  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_RESPONSE_SAFETY_FILTER_VERSION, "4.2.8");
  assert.equal(result.safe, false);
  assert.equal(result.filteredFields.includes("token"), true);
  assert.equal(result.filteredFields.includes("contactEmail"), true);
  assert.equal(result.filteredResult.nested.authorization, "[redacted]");
  console.log("GLOBAL_SHOPPING_PROVIDER_RESPONSE_SAFETY_FILTER PASS");
}

main();
