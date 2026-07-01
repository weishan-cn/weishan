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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingCredentialVaultInterfaceStub.js"]);
  const api = windowRef.WeishanGlobalShoppingCredentialVaultInterfaceStub;
  assert.equal(api.GLOBAL_SHOPPING_CREDENTIAL_VAULT_INTERFACE_STUB_VERSION, "2.6.0");
  const ready = api.buildGlobalShoppingCredentialVaultInterfaceStub({});
  assert.equal(ready.status, "ready");
  assert.equal(ready.stubName, "global_shopping_credential_vault_interface_stub_v1");
  assert.equal(ready.userFacingSummary.title, "凭证保险箱接口桩");
  assert.equal(ready.vaultBoundary.canReadRealApiKey, false);
  assert.equal(ready.vaultBoundary.canShowCredentialInput, false);
  assert.equal(ready.interfaceMethods.length, 5);
  assert.equal(ready.rows.some((row) => row.label === "renderer 不接触密钥"), true);
  const blocked = api.buildGlobalShoppingCredentialVaultInterfaceStub({ readRealApiKey:true, showCredentialInput:true });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blockedReasons.includes("api_key_read_detected"), true);
  assert.equal(blocked.blockedReasons.includes("credential_input_ui_detected"), true);
  const audit = api.buildGlobalShoppingCredentialVaultInterfaceStubAuditDraft({ secret:"abc" });
  assert.equal(JSON.stringify(audit).includes("abc"), false);
  console.log("GLOBAL_SHOPPING_CREDENTIAL_VAULT_INTERFACE_STUB PASS");
}

main();
