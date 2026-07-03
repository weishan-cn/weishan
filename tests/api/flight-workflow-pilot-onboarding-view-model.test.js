const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyUserConsentFlow.js",
    "apps/desktop/src/renderer/core/flightWorkflowPublicPilotOnboardingGuard.js",
    "apps/desktop/src/renderer/core/flightWorkflowPilotOnboardingViewModel.js"
  ]);
  const api = windowRef.WeishanFlightWorkflowPilotOnboardingViewModel;
  assert.equal(api.FLIGHT_WORKFLOW_PILOT_ONBOARDING_VIEW_MODEL_VERSION, "4.1.1");
  const vmModel = api.buildFlightWorkflowPilotOnboardingViewModel({ betaExpansionApproved:true, publicPilotChecklistReady:true, releaseReadinessReady:true, safetyCopyReady:true, forbiddenCapabilitiesVisible:true, userConsentReady:true, noBlockedSafetyRisk:true, acceptedItems:{ read_only_scope:true, platform_final:true, no_transaction:true, no_identity_upload:true, feedback_redacted:true } });
  assert.equal(vmModel.title, "只读试点进入确认");
  assert.ok(vmModel.cards.some((x) => x.cardId === "entry"));
  assert.ok(vmModel.cards.some((x) => x.cardId === "consent"));
  assert.ok(vmModel.cards.some((x) => x.cardId === "safety"));
  assert.ok(vmModel.cards.some((x) => x.cardId === "next_step"));
  assert.ok(vmModel.consentRows.length >= 5);
  assert.ok(vmModel.riskRows.length >= 1);
  assert.match(vmModel.caveat, /不提供付款、下单或出票能力/);
  const json = JSON.stringify(api.buildFlightWorkflowPilotOnboardingViewModel({ token:"abc123", bookingUrl:"https://blocked.example", paymentUrl:"https://pay.example", orderUrl:"https://order.example" }));
  assert.equal(json.includes("abc123"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  assert.equal(json.includes("https://pay.example"), false);
  assert.equal(json.includes("https://order.example"), false);
  assert.equal(vmModel.bookingUrl, null);
  assert.equal(vmModel.paymentUrl, null);
  assert.equal(vmModel.orderUrl, null);
  console.log("FLIGHT_WORKFLOW_PILOT_ONBOARDING_VIEW_MODEL PASS");
}
main();
