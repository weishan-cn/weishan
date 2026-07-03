const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  files.forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }));
  return window;
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingRedactedSearchParameterPack.js"]);
  const api = windowRef.WeishanGlobalShoppingRedactedSearchParameterPack;
  assert.equal(api.GLOBAL_SHOPPING_REDACTED_SEARCH_PARAMETER_PACK_VERSION, "4.1.5");
  const ready = api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", passengerCount:1, cabinClass:"economy", directOnly:true, currency:"CNY", locale:"zh-CN", region:"CN", candidateId:"candidate_a", sourceType:"official", trustLabel:"trusted", confidenceLabel:"high" });
  assert.equal(ready.appVersion, "4.1.5");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "搜索参数包已准备");
  assert.ok(ready.allowedParameters.some((item) => item.key === "origin"));
  assert.ok(ready.allowedParameters.some((item) => item.key === "destination"));
  assert.ok(ready.allowedParameters.some((item) => item.key === "departureDate"));
  assert.ok(ready.blockedParameters.some((item) => item.key === "realName"));
  assert.ok(ready.blockedParameters.some((item) => item.key === "platformPassword"));
  assert.ok(ready.blockedParameters.some((item) => item.key === "paymentCredential"));
  assert.ok(ready.blockedParameters.some((item) => item.key === "bookingUrl"));
  assert.equal(ready.parameterHealth.noIdentity, true);
  assert.equal(ready.parameterHealth.noTransactionUrl, true);
  assert.equal(ready.parameterHealth.noExternalOpen, true);
  assert.equal(ready.parameterBoundary.canGenerateRealUrl, false);
  assert.equal(ready.parameterBoundary.canOpenExternalNow, false);
  assert.equal(ready.parameterBoundary.canPersistPack, false);
  assert.equal(ready.parameterBoundary.canCarryIdentity, false);
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"hotel", destination:"上海", hotelCheckIn:"2026-07-15", hotelCheckOut:"2026-07-16", roomCount:1, guestCount:2 }).status, "ready");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"product", productBrand:"Apple", productModel:"iPhone", productSku:"A1", quantity:1, destinationRegion:"CN" }).status, "ready");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"local_service", serviceCategory:"car", city:"上海", date:"2026-07-15", partySize:2 }).status, "ready");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight" }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", realName:"Alice" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", phone:"123" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", email:"a@example.com" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", passport:"P1" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", idCard:"1234" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", bankCard:"1234" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", platformAccount:"alice" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", platformPassword:"pw" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", paymentCredential:"cc" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", address:"x" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", preciseLocation:"x" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", rawUserText:"购买最便宜" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", apiKey:"sk-test" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", token:"abc" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", secret:"abc" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", bookingUrl:"https://blocked.example" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", checkoutUrl:"https://blocked.example" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", paymentUrl:"https://blocked.example" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", orderUrl:"https://blocked.example" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", persistPack:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", export:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", openExternal:true }).status, "blocked");
  const safeJson = JSON.stringify(api.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", token:"abc", secret:"def" }));
  assert.equal(/abc|def|sk-test|token|secret/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_REDACTED_SEARCH_PARAMETER_PACK PASS");
}

main();
