const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function ready(extra = {}) { return Object.assign({ betaExpansionApproved:true, publicPilotChecklistReady:true, releaseReadinessReady:true, safetyCopyReady:true, forbiddenCapabilitiesVisible:true, userConsentReady:true, noBlockedSafetyRisk:true }, extra); }
function main() {
  const api = load(["apps/desktop/src/renderer/core/flightWorkflowPublicPilotOnboardingGuard.js"]).WeishanFlightWorkflowPublicPilotOnboardingGuard;
  assert.equal(api.FLIGHT_WORKFLOW_PUBLIC_PILOT_ONBOARDING_GUARD_VERSION, "4.2.8");
  const allowed = api.buildFlightWorkflowPublicPilotOnboardingGuard(ready());
  assert.equal(allowed.status, "allowed");
  assert.equal(allowed.decision.decisionId, "allow_read_only_pilot_entry");
  assert.equal(allowed.decision.canEnterReadOnlyPilot, true);
  assert.equal(api.buildFlightWorkflowPublicPilotOnboardingGuard(ready({ userConsentReady:false })).status, "needs_consent");
  assert.equal(api.buildFlightWorkflowPublicPilotOnboardingGuard(ready({ betaExpansionApproved:false })).status, "needs_internal_testing");
  assert.equal(api.buildFlightWorkflowPublicPilotOnboardingGuard(ready({ publicPilotChecklistReady:false })).status, "needs_review");
  assert.equal(api.buildFlightWorkflowPublicPilotOnboardingGuard(ready({ safetyCopyReady:false })).status, "needs_review");
  assert.equal(api.buildFlightWorkflowPublicPilotOnboardingGuard(ready({ forbiddenCapabilitiesVisible:false })).status, "needs_review");
  assert.equal(api.buildFlightWorkflowPublicPilotOnboardingGuard(ready({ noBlockedSafetyRisk:false })).status, "blocked");
  assert.equal(api.buildFlightWorkflowPublicPilotOnboardingGuard(ready({ rawUserTextStored:true })).status, "blocked");
  assert.equal(api.buildFlightWorkflowPublicPilotOnboardingGuard(ready({ secretStored:true })).status, "blocked");
  assert.equal(api.buildFlightWorkflowPublicPilotOnboardingGuard(ready({ bookingUrl:"https://blocked.example" })).status, "blocked");
  assert.ok(api.buildFlightWorkflowPublicPilotOnboardingGuard(ready({ safetyCopyReady:false })).unmetRequirements.includes("safetyCopyReady"));
  const json = JSON.stringify(api.buildFlightWorkflowPublicPilotOnboardingGuard(ready({ token:"abc123", apiKey:"hidden-value", secret:"secret-value" })));
  assert.equal(json.includes("abc123"), false);
  assert.equal(json.includes("hidden-value"), false);
  assert.equal(json.includes("secret-value"), false);
  assert.equal(allowed.bookingUrl, null);
  assert.equal(allowed.paymentUrl, null);
  assert.equal(allowed.orderUrl, null);
  console.log("FLIGHT_WORKFLOW_PUBLIC_PILOT_ONBOARDING_GUARD PASS");
}
main();
