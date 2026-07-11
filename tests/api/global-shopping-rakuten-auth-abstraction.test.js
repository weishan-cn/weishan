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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingRakutenAuthAbstraction.js");
  const api = windowRef.WeishanGlobalShoppingRakutenAuthAbstraction;
  const result = api.buildGlobalShoppingRakutenAuthAbstraction({ providerId:"rakuten_japan" });
  const blocked = api.buildGlobalShoppingRakutenAuthAbstraction({ providerId:"rakuten_japan", secret:"x" });

  assert.equal(result.authType, "app_id_access_key");
  assert.equal(result.oauthSupported, false);
  assert.equal(result.securityBoundary.storesAccessKey, false);
  assert.equal(result.requiredFields[0].name, "applicationId");
  assert.equal(result.valid, true);
  assert.equal(blocked.valid, false);
  assert.equal(blocked.invalidReason, "sensitive_runtime_value_forbidden");
  console.log("GLOBAL_SHOPPING_RAKUTEN_AUTH_ABSTRACTION PASS");
}

main();
