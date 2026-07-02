const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderCredentialSafetyReview.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderCredentialSafetyReview;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_CREDENTIAL_SAFETY_REVIEW_VERSION, "4.0.2");
  const ready = api.buildGlobalShoppingProviderCredentialSafetyReview({ providerStatus:"fixture", fixtureCredentialsOnly:true, sandboxOnly:true });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Provider 凭据安全复核");
  assert.equal(api.buildGlobalShoppingProviderCredentialSafetyReview({ providerStatus:"fixture", canReadProductionKey:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingProviderCredentialSafetyReview({ providerStatus:"fixture", secretStored:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingProviderCredentialSafetyReview({ providerStatus:"fixture", openExternal:true }).status, "blocked");
  const serialized = JSON.stringify(api.buildGlobalShoppingProviderCredentialSafetyReview({ providerStatus:"fixture", token:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(/abc|https:\/\/blocked/.test(serialized), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_CREDENTIAL_SAFETY_REVIEW PASS");
}
main();
