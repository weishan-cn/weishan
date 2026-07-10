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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingProviderPermissionModel.js");
  const api = windowRef.WeishanGlobalShoppingProviderPermissionModel;
  const defaultModel = api.buildGlobalShoppingProviderPermissionModel({ providerId:"amazon_japan", operation:"getPrice" });
  const sandboxModel = api.buildGlobalShoppingProviderPermissionModel({ providerId:"amazon_japan", operation:"getPrice", mode:"read_only_sandbox" });

  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_PERMISSION_MODEL_VERSION, "4.2.8");
  assert.equal(defaultModel.allowed, false);
  assert.equal(defaultModel.requiredPermission, "price_read");
  assert.equal(sandboxModel.allowed, true);
  assert.equal(sandboxModel.permissions.find((item) => item.permission === "price_read").status, "read_only_allowed");
  console.log("GLOBAL_SHOPPING_PROVIDER_PERMISSION_MODEL PASS");
}

main();
