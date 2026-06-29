const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderRequestEnvelopeBuilder.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderRequestEnvelopeBuilder;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_REQUEST_ENVELOPE_BUILDER_VERSION, "2.2.5");

  const ready = api.buildGlobalShoppingProviderRequestEnvelopeBuilder({
    providerId:"provider_1",
    providerName:"Fixture Provider",
    requestMode:"sandbox_ready",
    itemType:"flight",
    origin:"SHA",
    destination:"CTU",
    departureDate:"2026-07-15",
    passengerCount:1,
    directOnly:true,
    userRegion:"CN",
    destinationRegion:"CN",
    currency:"CNY",
    locale:"zh-CN"
  });
  assert.equal(ready.appVersion, "2.2.5");
  assert.equal(ready.status, "ready");
  assert.equal(ready.requestEnvelope.canSendRequestNow, false);
  assert.equal(ready.requestEnvelope.canAttachRealApiKey, false);
  assert.equal(ready.requestEnvelope.carriesOnlyNonSensitiveSearchParameters, true);

  assert.equal(api.buildGlobalShoppingProviderRequestEnvelopeBuilder({ providerId:"provider_1" }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingProviderRequestEnvelopeBuilder({ providerId:"provider_1", requestMode:"sandbox_ready", itemType:"flight", origin:"SHA", destination:"CTU", sendRequestNow:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingProviderRequestEnvelopeBuilder({ providerId:"provider_1", requestMode:"sandbox_ready", itemType:"flight", origin:"SHA", destination:"CTU", realApiKeyPresent:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingProviderRequestEnvelopeBuilder({ providerId:"provider_1", requestMode:"sandbox_ready", itemType:"flight", origin:"SHA", destination:"CTU", rawUserTextDetected:true }).status, "blocked");

  const safeJson = JSON.stringify(api.buildGlobalShoppingProviderRequestEnvelopeBuilder({ token:"abc", secret:"def", bookingUrl:"https://blocked.example" }));
  assert.equal(/abc|def|https?://blocked|paymentUrl|orderUrl|checkoutUrl/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_REQUEST_ENVELOPE_BUILDER PASS");
}

main();
