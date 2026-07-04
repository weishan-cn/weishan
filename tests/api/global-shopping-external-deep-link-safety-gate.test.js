const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingExternalDeepLinkSafetyGate.js"]);
  const api = windowRef.WeishanGlobalShoppingExternalDeepLinkSafetyGate;
  assert.equal(api.GLOBAL_SHOPPING_EXTERNAL_DEEP_LINK_SAFETY_GATE_VERSION, "4.2.5");
  const safe = api.buildGlobalShoppingExternalDeepLinkSafetyGate({ allowedDomain:"sandbox.platform.invalid", sourceType:"major_platform", sourceName:"Sandbox Platform", userConfirmationRequired:true, sandboxUrl:"sandbox://preview", disclosureText:"价格以跳转后平台实时页面为准。用户需在平台自行确认价格、登录、填写资料并完成下单。" });
  assert.equal(safe.appVersion, "4.2.5");
  assert.equal(safe.status, "safe");
  assert.equal(api.buildGlobalShoppingExternalDeepLinkSafetyGate({ sourceType:"major_platform" }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingExternalDeepLinkSafetyGate({ allowedDomain:"sandbox.platform.invalid" }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingExternalDeepLinkSafetyGate({ allowedDomain:"sandbox.platform.invalid", sourceType:"major_platform", canOpenExternalNow:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingExternalDeepLinkSafetyGate({ allowedDomain:"sandbox.platform.invalid", sourceType:"major_platform", windowOpen:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingExternalDeepLinkSafetyGate({ allowedDomain:"sandbox.platform.invalid", sourceType:"major_platform", bookingUrl:"https://blocked.example" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingExternalDeepLinkSafetyGate({ allowedDomain:"sandbox.platform.invalid", sourceType:"major_platform", checkoutUrl:"https://blocked.example" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingExternalDeepLinkSafetyGate({ allowedDomain:"sandbox.platform.invalid", sourceType:"major_platform", paymentUrl:"https://blocked.example" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingExternalDeepLinkSafetyGate({ allowedDomain:"sandbox.platform.invalid", sourceType:"major_platform", orderUrl:"https://blocked.example" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingExternalDeepLinkSafetyGate({ allowedDomain:"sandbox.platform.invalid", sourceType:"major_platform", payment:true }).status, "blocked");
  assert.equal(safe.deepLinkCandidate.requiresUserConfirmation, true);
  assert.equal(safe.deepLinkCandidate.platformRealtimePageIsSourceOfTruth, true);
  assert.equal(safe.deepLinkCandidate.userCompletesCheckoutOnPlatform, true);
  assert.equal(safe.deepLinkCandidate.noAccountCredentialStored, true);
  assert.equal(safe.deepLinkCandidate.noIdentityDocumentStored, true);
  assert.equal(safe.deepLinkCandidate.noBankCardStored, true);
  assert.equal(safe.deepLinkCandidate.noPaymentCredentialStored, true);
  const serialized = JSON.stringify(api.buildGlobalShoppingExternalDeepLinkSafetyGate({ allowedDomain:"sandbox.platform.invalid", sourceType:"major_platform", token:"abc", apiKey:"abc", secret:"abc", realName:"张三" }));
  assert.equal(/张三|abc/.test(serialized), false);
  assert.equal(/bookingUrl":"https?:|paymentUrl":"https?:|orderUrl":"https?:/.test(serialized), false);
  console.log("GLOBAL_SHOPPING_EXTERNAL_DEEP_LINK_SAFETY_GATE PASS");
}
main();
