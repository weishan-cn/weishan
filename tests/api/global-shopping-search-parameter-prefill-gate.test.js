const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingSearchParameterPrefillGate.js"]);
  const api = windowRef.WeishanGlobalShoppingSearchParameterPrefillGate;
  assert.equal(api.GLOBAL_SHOPPING_SEARCH_PARAMETER_PREFILL_GATE_VERSION, "2.2.5");
  const safe = api.buildGlobalShoppingSearchParameterPrefillGate({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", passengerCount:1, directOnly:true, nonSensitivePreference:"cheapest_direct_first" });
  assert.equal(safe.appVersion, "2.2.5");
  assert.equal(safe.status, "safe");
  assert.equal(safe.prefillCandidate.allowedParameters.origin, "SHA");
  assert.equal(api.buildGlobalShoppingSearchParameterPrefillGate({ itemType:"hotel", hotelCheckIn:"2026-07-15", hotelCheckOut:"2026-07-16", roomCount:1, guestCount:2 }).status, "safe");
  assert.equal(api.buildGlobalShoppingSearchParameterPrefillGate({ itemType:"product", productBrand:"Sony", productModel:"WH-1000XM6", productSku:"sku-001", quantity:1 }).status, "safe");
  assert.equal(api.buildGlobalShoppingSearchParameterPrefillGate({ realName:"张三" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingSearchParameterPrefillGate({ phone:"13800000000" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingSearchParameterPrefillGate({ email:"a@example.test" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingSearchParameterPrefillGate({ passport:"E123" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingSearchParameterPrefillGate({ idCard:"3101" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingSearchParameterPrefillGate({ bankCard:"6222" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingSearchParameterPrefillGate({ paymentCredential:"pay" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingSearchParameterPrefillGate({ platformPassword:"pw" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingSearchParameterPrefillGate({ platformAccountToken:"tok" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingSearchParameterPrefillGate({ address:"somewhere" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingSearchParameterPrefillGate({ prefillCandidate:{ canBuildRealUrl:true } }).status, "blocked");
  assert.equal(api.buildGlobalShoppingSearchParameterPrefillGate({ prefillCandidate:{ canSubmitForm:true } }).status, "blocked");
  assert.equal(api.buildGlobalShoppingSearchParameterPrefillGate({ prefillCandidate:{ canAutoFillSensitiveData:true } }).status, "blocked");
  const serialized = JSON.stringify(api.buildGlobalShoppingSearchParameterPrefillGate({ token:"abc", secret:"abc", realName:"张三" }));
  assert.equal(/张三|abc/.test(serialized), false);
  console.log("GLOBAL_SHOPPING_SEARCH_PARAMETER_PREFILL_GATE PASS");
}
main();
