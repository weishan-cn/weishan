const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { createLimitedBetaPreferenceStore, LIMITED_BETA_PREFERENCE_STORE_VERSION } = require("../../apps/desktop/src/main/limitedBetaPreferenceStore");

function tmpdir() { return fs.mkdtempSync(path.join(os.tmpdir(), "weishan-limited-beta-pref-")); }

function main() {
  const dir = tmpdir();
  const service = createLimitedBetaPreferenceStore({ baseDir:dir });
  const initial = service.getLimitedBetaPreference();
  assert.equal(initial.preference.schemaVersion, "2.1.92");
  assert.equal(LIMITED_BETA_PREFERENCE_STORE_VERSION, "2.1.92");
  assert.equal(initial.preference.globalLimitedBetaEnabled, true);
  assert.equal(initial.preference.categoryOverrides.flight, true);
  assert.equal(initial.preference.categoryOverrides.product, false);
  assert.equal(initial.preference.paymentDisabled, true);
  assert.equal(initial.preference.orderDisabled, true);
  assert.equal(initial.preference.bookingUrlDisabled, true);
  assert.equal(initial.preference.identityUploadDisabled, true);

  const off = service.turnOffLimitedBetaPreference("test turn off");
  assert.equal(off.preference.globalLimitedBetaEnabled, false);
  assert.equal(off.preference.killSwitchState, "disabled");
  const reloaded = createLimitedBetaPreferenceStore({ baseDir:dir }).getLimitedBetaPreference();
  assert.equal(reloaded.preference.globalLimitedBetaEnabled, false);
  assert.equal(reloaded.preference.killSwitchState, "disabled");

  const rollback = service.forceRollbackLimitedBetaPreference("test rollback");
  assert.equal(rollback.preference.killSwitchState, "rollback_active");
  assert.equal(rollback.preference.rollbackState, "rollback_active");

  const cleared = service.clearLimitedBetaPreference();
  assert.equal(cleared.preference.globalLimitedBetaEnabled, true);
  assert.equal(cleared.preference.categoryOverrides.flight, true);
  assert.equal(cleared.preference.categoryOverrides.product, false);

  fs.writeFileSync(service.storagePath(), "{ malformed");
  const recovered = service.getLimitedBetaPreference();
  assert.equal(recovered.safeFallbackApplied, true);
  assert.equal(recovered.preference.lastAction, "auto_recovered_invalid_state");

  const unsafe = service.setLimitedBetaPreferenceDraft({
    schemaVersion:"2.1.92",
    globalLimitedBetaEnabled:true,
    killSwitchState:"enabled",
    categoryOverrides:{ product:true, hotel:true, local_service:true, ticket_or_activity:true, restricted_or_blocked:true },
    paymentDisabled:false,
    orderDisabled:false,
    bookingUrlDisabled:false,
    identityUploadDisabled:false
  });
  assert.equal(unsafe.preference.categoryOverrides.product, false);
  assert.equal(unsafe.preference.categoryOverrides.hotel, false);
  assert.equal(unsafe.preference.categoryOverrides.local_service, false);
  assert.equal(unsafe.preference.categoryOverrides.ticket_or_activity, false);
  assert.equal(unsafe.preference.categoryOverrides.restricted_or_blocked, false);
  assert.equal(unsafe.preference.paymentDisabled, true);
  assert.equal(unsafe.preference.orderDisabled, true);
  assert.equal(unsafe.preference.bookingUrlDisabled, true);
  assert.equal(unsafe.preference.identityUploadDisabled, true);

  const fileText = fs.readFileSync(service.storagePath(), "utf8");
  assert.equal(fileText.includes("apiKey"), false);
  assert.equal(fileText.includes("endpoint"), false);
  assert.equal(fileText.includes("rawProviderPayload"), false);
  const audit = service.getLimitedBetaPreferenceAuditDraft("test");
  assert.equal(audit.localStorageWriteCount, 0);
  assert.equal(audit.sessionStorageWriteCount, 0);
  assert.equal(audit.envWriteCount, 0);
  assert.equal(audit.secretPersistedCount, 0);
  assert.equal(audit.endpointPersistedCount, 0);
  assert.equal(audit.rawPayloadPersistedCount, 0);
  assert.equal(audit.redacted, true);
  console.log("LIMITED_BETA_PREFERENCE_PERSISTENCE_CORE PASS");
}

main();
