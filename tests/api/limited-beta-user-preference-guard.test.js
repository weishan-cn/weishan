const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
function load(files) {
  const window = { addEventListener() {}, dispatchEvent() {} };
  window.window = window;
  const context = vm.createContext({ window, console, CustomEvent:function(type, init){ this.type = type; this.detail = init && init.detail; } });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function pref(overrides) {
  return Object.assign({
    schemaVersion:"2.1.82",
    globalLimitedBetaEnabled:true,
    killSwitchState:"enabled",
    rollbackState:"not_needed",
    restoreConfirmationPending:false,
    categoryOverrides:{ flight:true, product:false, hotel:false, local_service:false, ticket_or_activity:false, restricted_or_blocked:false },
    paymentDisabled:true,
    orderDisabled:true,
    bookingUrlDisabled:true,
    identityUploadDisabled:true,
    redacted:true
  }, overrides || {});
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/limitedBetaPreferencePersistence.js", "apps/desktop/src/renderer/core/limitedBetaUserPreferenceGuard.js"]);
  const api = windowRef.WeishanLimitedBetaUserPreferenceGuard;
  assert.equal(api.LIMITED_BETA_USER_PREFERENCE_GUARD_VERSION, "2.1.82");

  assert.equal(api.evaluateLimitedBetaUserPreferenceGuard({ persistedPreference:pref(), currentRequestCategory:"flight", providerId:"flight_provider", userConfirmationState:"confirmed" }).preferenceDecision, "allow");
  assert.equal(api.evaluateLimitedBetaUserPreferenceGuard({ persistedPreference:pref({ globalLimitedBetaEnabled:false, killSwitchState:"disabled" }), currentRequestCategory:"flight", providerId:"flight_provider", userConfirmationState:"confirmed" }).preferenceDecision, "withheld");
  assert.equal(api.evaluateLimitedBetaUserPreferenceGuard({ persistedPreference:pref({ restoreConfirmationPending:true }), currentRequestCategory:"flight", providerId:"flight_provider", userConfirmationState:"missing" }).preferenceDecision, "confirmation_required");
  assert.equal(api.evaluateLimitedBetaUserPreferenceGuard({ persistedPreference:pref({ restoreConfirmationPending:true }), currentRequestCategory:"flight", providerId:"flight_provider", userConfirmationState:"confirmed" }).preferenceDecision, "allow");
  assert.notEqual(api.evaluateLimitedBetaUserPreferenceGuard({ persistedPreference:pref({ categoryOverrides:{ flight:true, product:true } }), currentRequestCategory:"product", providerId:"product_provider", userConfirmationState:"confirmed" }).preferenceDecision, "allow");
  assert.notEqual(api.evaluateLimitedBetaUserPreferenceGuard({ persistedPreference:pref(), currentRequestCategory:"hotel", providerId:"hotel_provider", userConfirmationState:"confirmed" }).preferenceDecision, "allow");
  assert.notEqual(api.evaluateLimitedBetaUserPreferenceGuard({ persistedPreference:pref(), currentRequestCategory:"local_service", providerId:"local_service_provider", userConfirmationState:"confirmed" }).preferenceDecision, "allow");
  assert.notEqual(api.evaluateLimitedBetaUserPreferenceGuard({ persistedPreference:pref(), currentRequestCategory:"ticket_or_activity", providerId:"ticket_activity_provider", userConfirmationState:"confirmed" }).preferenceDecision, "allow");
  assert.notEqual(api.evaluateLimitedBetaUserPreferenceGuard({ persistedPreference:pref(), currentRequestCategory:"flight", providerId:"flight_provider", restrictedDecision:"blocked", userConfirmationState:"confirmed" }).preferenceDecision, "allow");
  assert.notEqual(api.evaluateLimitedBetaUserPreferenceGuard({ persistedPreference:pref({ rollbackState:"rollback_active" }), currentRequestCategory:"flight", providerId:"flight_provider", rollbackDecision:"rollback_active", userConfirmationState:"confirmed" }).preferenceDecision, "allow");
  assert.notEqual(api.evaluateLimitedBetaUserPreferenceGuard({ persistedPreference:pref({ killSwitchState:"forced_off", rollbackState:"forced_off" }), currentRequestCategory:"flight", providerId:"flight_provider", rollbackDecision:"forced_off", userConfirmationState:"confirmed" }).preferenceDecision, "allow");
  assert.notEqual(api.evaluateLimitedBetaUserPreferenceGuard({ persistedPreference:{ bad:true }, currentRequestCategory:"flight", providerId:"flight_provider", userConfirmationState:"confirmed" }).preferenceDecision, "allow");
  assert.notEqual(api.evaluateLimitedBetaUserPreferenceGuard({ persistedPreference:pref({ bookingUrlDisabled:false }), currentRequestCategory:"flight", providerId:"flight_provider", userConfirmationState:"confirmed" }).preferenceDecision, "allow");
  const audit = api.buildLimitedBetaUserPreferenceGuardDraft().auditDraft;
  assert.equal(audit.paymentDisabled, true);
  assert.equal(audit.orderDisabled, true);
  assert.equal(audit.bookingUrlDisabled, true);
  assert.equal(audit.identityUploadDisabled, true);
  assert.equal(audit.redacted, true);
  assert.equal(api.assertLimitedBetaUserPreferenceGuardSafe(), true);
  console.log("LIMITED_BETA_USER_PREFERENCE_GUARD_CORE PASS");
}

main();
