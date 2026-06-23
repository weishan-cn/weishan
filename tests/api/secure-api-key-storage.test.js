const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  createSecureApiKeyStorageService,
  SECURE_API_KEY_STORAGE_VERSION,
  STORE_FILE,
  DEFAULT_TEST_CREDENTIAL,
  DEFAULT_SELF_TEST_CREDENTIAL
} = require("../../apps/desktop/src/main/secureApiKeyStorage");

function createFakeSafeStorage() {
  return {
    available:true,
    isEncryptionAvailable() {
      return this.available === true;
    },
    encryptString(value) {
      return Buffer.from("encrypted:" + Buffer.from(String(value), "utf8").toString("base64"), "utf8");
    },
    decryptString(buffer) {
      const raw = Buffer.from(buffer).toString("utf8");
      assert.equal(raw.startsWith("encrypted:"), true);
      return Buffer.from(raw.slice("encrypted:".length), "base64").toString("utf8");
    }
  };
}

function makeService() {
  const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), "weishan-secure-api-key-storage-"));
  const safeStorage = createFakeSafeStorage();
  const service = createSecureApiKeyStorageService({ storageDir, safeStorage });
  return { storageDir, safeStorage, service, storePath:path.join(storageDir, STORE_FILE) };
}

function assertNoPlaintext(value, plaintext) {
  assert.equal(JSON.stringify(value).includes(plaintext), false);
}

function assertMetadataOnly(value) {
  const serialized = JSON.stringify(value);
  assert.equal(/"encryptedBlob"\s*:/.test(serialized), false);
  assert.equal(/WEISHAN_TEST_CREDENTIAL_PLACEHOLDER_000000/.test(serialized), false);
  assert.equal(/WEISHAN_LOCAL_STORAGE_SELF_TEST_VALUE_000000/.test(serialized), false);
  assert.equal(/sk-real-looking-key/.test(serialized), false);
}

function main() {
  assert.equal(SECURE_API_KEY_STORAGE_VERSION, "2.1.74");

  const { service, safeStorage, storePath } = makeService();
  const initial = service.getProviderKeyStatus("flight_provider_key");
  assert.equal(initial.ok, true);
  assert.equal(initial.metadata.status, "empty");
  assert.equal(initial.metadata.redacted, true);
  assertMetadataOnly(initial);

  const saved = service.saveProviderKey("flight_provider_key");
  assert.equal(saved.ok, true);
  assert.equal(saved.metadata.status, "saved");
  assert.equal(saved.metadata.providerId, "flight_provider_key");
  assert.equal(saved.metadata.keyFingerprint.length, 12);
  assert.equal(saved.metadata.keyLast4, "0000");
  assert.equal(saved.metadata.storage, "encrypted local only");
  assert.equal(saved.metadata.finalDecision, "storage-ready");
  assert.equal(saved.metadata.redacted, true);
  assertMetadataOnly(saved);

  const diskText = fs.readFileSync(storePath, "utf8");
  assert.equal(diskText.includes(DEFAULT_TEST_CREDENTIAL), false);
  assert.equal(diskText.includes(DEFAULT_SELF_TEST_CREDENTIAL), false);
  const diskRecord = JSON.parse(diskText).records.flight_provider_key;
  assert.equal(typeof diskRecord.encryptedBlob, "string");
  assert.equal(diskRecord.redacted, true);
  assert.equal(diskRecord.storageVersion, "2.1.74");
  assert.equal(diskRecord.encryptionProvider, "electron_safeStorage");
  assert.equal(Object.prototype.hasOwnProperty.call(diskRecord, "credential"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(diskRecord, "apiKey"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(diskRecord, "rawKey"), false);

  const listed = service.listProviderKeys();
  assert.equal(listed.ok, true);
  assert.equal(listed.metadataOnly, true);
  assert.equal(listed.slots.length, 6);
  assert.equal(listed.slots.some((slot) => slot.providerId === "flight_provider_sandbox_key"), true);
  assert.equal(listed.auditDraft.plaintextPersistedCount, 0);
  assert.equal(listed.auditDraft.plaintextDisplayedCount, 0);
  assert.equal(listed.auditDraft.plaintextExportedCount, 0);
  assert.equal(listed.auditDraft.localStorageSecretCount, 0);
  assert.equal(listed.auditDraft.sessionStorageSecretCount, 0);
  assert.equal(listed.auditDraft.realProviderCallCount, 0);
  assert.equal(listed.auditDraft.networkAttemptCount, 0);
  assert.equal(listed.auditDraft.realEndpointConnectCount, 0);
  assert.equal(listed.auditDraft.realPriceDisplayedCount, 0);
  assert.equal(listed.auditDraft.bookingUrlDisplayedCount, 0);
  assert.equal(listed.auditDraft.redacted, true);
  assertMetadataOnly(listed);

  const beforeFingerprint = saved.metadata.keyFingerprint;
  const rotated = service.rotateProviderKey("flight_provider_key");
  assert.equal(rotated.ok, true);
  assert.equal(rotated.metadata.status, "saved");
  assert.notEqual(rotated.metadata.keyFingerprint, beforeFingerprint);
  assertMetadataOnly(rotated);

  const deleted = service.deleteProviderKey("flight_provider_key");
  assert.equal(deleted.ok, true);
  assert.equal(deleted.metadata.status, "empty");
  assert.equal(deleted.metadata.finalDecision, "storage-missing");
  assertMetadataOnly(deleted);

  const restricted = service.saveProviderKey("restricted_provider");
  assert.equal(restricted.ok, false);
  assert.equal(restricted.error, "PROVIDER_NOT_ALLOWED");
  assertMetadataOnly(restricted);

  const fakeRealLooking = "sk-" + "real-looking-key-1234567890";
  const realLooking = service.saveProviderKey("flight_provider_key", fakeRealLooking);
  assert.equal(realLooking.ok, false);
  assert.equal(realLooking.error, "PRODUCTION_KEY_RISK_BLOCKED");
  assert.equal(realLooking.metadata.status, "blocked_production_key_risk");
  assertNoPlaintext(realLooking, fakeRealLooking);

  const sandboxSaved = service.saveProviderKey("flight_provider_sandbox_key", "WEISHAN_SANDBOX_TEST_KEY_ABC123");
  assert.equal(sandboxSaved.ok, true);
  assert.equal(sandboxSaved.metadata.status, "sandbox_saved");
  assert.equal(sandboxSaved.metadata.providerId, "flight_provider_sandbox_key");
  assert.equal(sandboxSaved.metadata.finalDecision, "sandbox-key-ready");
  assert.equal(sandboxSaved.metadata.keyLast4, "C123");
  assertMetadataOnly(sandboxSaved);

  const selfTest = service.runSecureStorageSelfTest();
  assert.equal(selfTest.ok, true);
  assert.equal(selfTest.status, "PASS");
  assert.equal(selfTest.diskPlaintextAbsent, true);
  assert.equal(selfTest.encryptedBlobPlaintextAbsent, true);
  assert.equal(selfTest.metadataOnly, true);
  assert.equal(selfTest.providerNetworkDisabled, true);
  assert.equal(selfTest.endpointConnectDisabled, true);
  assert.equal(selfTest.realPriceDisabled, true);
  assert.equal(selfTest.bookingUrlDisabled, true);
  assert.equal(selfTest.redacted, true);
  assertMetadataOnly(selfTest);

  safeStorage.available = false;
  const unavailableSave = service.saveProviderKey("hotel_provider_key");
  assert.equal(unavailableSave.ok, false);
  assert.equal(unavailableSave.error, "STORAGE_UNAVAILABLE");
  assert.equal(unavailableSave.metadata.status, "storage_unavailable");
  assertMetadataOnly(unavailableSave);
  const unavailableSelfTest = service.runSecureStorageSelfTest();
  assert.equal(unavailableSelfTest.ok, false);
  assert.equal(unavailableSelfTest.error, "STORAGE_UNAVAILABLE");
  assert.equal(unavailableSelfTest.plaintextFallback, false);
  assert.equal(unavailableSelfTest.redacted, true);
  assertMetadataOnly(unavailableSelfTest);

  console.log("SECURE_API_KEY_STORAGE_CORE PASS");
}

main();
