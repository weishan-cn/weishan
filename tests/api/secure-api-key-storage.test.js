const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  createSecureApiKeyStorageService,
  registerSecureApiKeyStorageHandlers,
  SECURE_API_KEY_STORAGE_VERSION,
  PROVIDER_CREDENTIAL_STORE_VERSION,
  STORE_FILE,
  DEFAULT_TEST_CREDENTIAL,
  DEFAULT_SELF_TEST_CREDENTIAL
} = require("../../apps/desktop/src/main/secureApiKeyStorage");
const {
  createMacOSSecureEntry,
  lockedCredentialTargetFromEnvironment,
  normalizeLockedCredentialTarget
} = require("../../apps/desktop/src/main/providerCredentialSecureEntry");
const {
  createProviderCredentialStoreMenuAction
} = require("../../apps/desktop/src/main/providerCredentialStoreMenuAction");
const {
  createMacOSIdentifierEntry,
  lockedIdentifierTargetFromEnvironment,
  normalizeLockedIdentifierTarget
} = require("../../apps/desktop/src/main/providerCredentialIdentifierEntry");
const {
  createProviderCredentialIdentifierMenuAction
} = require("../../apps/desktop/src/main/providerCredentialIdentifierMenuAction");

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

async function credentialMatches(service, descriptor, credentialType, expected) {
  return service.mainProcess.withCredentialBundle(descriptor, [credentialType], async (credentials) => ({
    matches:credentials[credentialType] === expected
  }));
}

async function main() {
  assert.equal(SECURE_API_KEY_STORAGE_VERSION, "4.2.7");
  assert.equal(PROVIDER_CREDENTIAL_STORE_VERSION, "1.0.0");

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
  assert.equal(diskRecord.storageVersion, "4.2.7");
  assert.equal(diskRecord.encryptionProvider, "electron_safeStorage");
  assert.equal(Object.prototype.hasOwnProperty.call(diskRecord, "credential"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(diskRecord, "apiKey"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(diskRecord, "rawKey"), false);

  const listed = service.listProviderKeys();
  assert.equal(listed.ok, true);
  assert.equal(listed.metadataOnly, true);
  assert.equal(listed.slots.length, 5);
  assert.equal(listed.slots.some((slot) => slot.providerId === "product_provider_key"), false);
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

  const commerceCredential = service.saveProviderKey("product_provider_key");
  assert.equal(commerceCredential.ok, false);
  assert.equal(commerceCredential.error, "PROVIDER_NOT_ALLOWED");
  assertMetadataOnly(commerceCredential);

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

  safeStorage.available = true;
  const descriptor = { provider:"ebay", environment:"sandbox", application:"Weishan Global Commerce" };
  const productionDescriptor = { provider:"ebay", environment:"production", application:"Weishan Global Commerce" };
  const otherProviderDescriptor = { provider:"ticketmaster", environment:"sandbox", application:"Weishan Global Commerce" };
  const otherApplicationDescriptor = { provider:"ebay", environment:"sandbox", application:"Weishan Travel" };
  const firstBundle = {
    client_id:"WEISHAN_PROVIDER_STORE_TEST_CLIENT_A",
    client_secret:"WEISHAN_PROVIDER_STORE_TEST_SECRET_A"
  };
  const rotatedBundle = {
    client_id:"WEISHAN_PROVIDER_STORE_TEST_CLIENT_B",
    client_secret:"WEISHAN_PROVIDER_STORE_TEST_SECRET_B"
  };
  const auditEvents = [];
  const isolatedStorageDir = fs.mkdtempSync(path.join(os.tmpdir(), "weishan-provider-credential-store-"));
  const isolated = createSecureApiKeyStorageService({
    storageDir:isolatedStorageDir,
    safeStorage:createFakeSafeStorage(),
    audit:(event) => auditEvents.push(event)
  });

  const providerStatus = isolated.providerCredentialStoreStatus();
  assert.equal(providerStatus.ok, true);
  assert.equal(providerStatus.status, "ready");
  assert.equal(providerStatus.rendererSecretAccess, false);
  assert.equal(providerStatus.ipcSecretRead, false);
  assert.equal(providerStatus.ipcSecretWrite, false);
  assert.equal(providerStatus.identifierEntryAvailable, false);
  assert.equal(providerStatus.executionGate, "CLOSED");
  assert.equal(providerStatus.authorizesExecution, false);
  assert.equal(providerStatus.productionTraffic, false);
  assert.equal(Object.prototype.hasOwnProperty.call(isolated.mainProcess, "getCredentialForMainProcess"), false);
  assert.equal(typeof isolated.mainProcess.ingestProviderCredential, "function");
  assert.equal(typeof isolated.mainProcess.bindProviderCredentialIdentifier, "function");
  assert.equal(typeof isolated.mainProcess.getProviderCredentialIdentifierForMainProcess, "function");

  const hotelbedsIdentifierDescriptor = { provider:"hotelbeds", environment:"evaluation", application:"Weishan" };
  const hotelbedsApiKey = "0123456789abcdef0123456789abcdef";
  const boundHotelbedsApiKey = isolated.mainProcess.bindProviderCredentialIdentifier({
    source:"main_process_runtime",
    descriptor:hotelbedsIdentifierDescriptor,
    identifierType:"api_key",
    value:hotelbedsApiKey
  });
  assert.equal(boundHotelbedsApiKey.ok, true);
  assert.equal(boundHotelbedsApiKey.operation, "PROVIDER_CREDENTIAL_IDENTIFIER_BIND");
  assert.equal(boundHotelbedsApiKey.metadata.provider, "hotelbeds");
  assert.equal(boundHotelbedsApiKey.metadata.environment, "evaluation");
  assert.equal(boundHotelbedsApiKey.metadata.application, "Weishan");
  assert.equal(boundHotelbedsApiKey.metadata.identifierType, "api_key");
  assert.equal(boundHotelbedsApiKey.metadata.secret, false);
  assert.equal(boundHotelbedsApiKey.metadata.valueAvailable, true);
  assert.equal(boundHotelbedsApiKey.metadata.valueLast4, "cdef");
  assert.equal(boundHotelbedsApiKey.valueReturned, false);
  assert.equal(JSON.stringify(boundHotelbedsApiKey).includes(hotelbedsApiKey), false);
  const listedHotelbedsIdentifier = isolated.listProviderCredentialIdentifierMetadata(hotelbedsIdentifierDescriptor);
  assert.equal(listedHotelbedsIdentifier.ok, true);
  assert.equal(listedHotelbedsIdentifier.records.length, 1);
  assert.equal(listedHotelbedsIdentifier.records[0].identifierType, "api_key");
  assert.equal(JSON.stringify(listedHotelbedsIdentifier).includes(hotelbedsApiKey), false);
  const fetchedHotelbedsIdentifier = isolated.mainProcess.getProviderCredentialIdentifierForMainProcess(hotelbedsIdentifierDescriptor, "api_key");
  assert.equal(fetchedHotelbedsIdentifier.ok, true);
  assert.equal(fetchedHotelbedsIdentifier.value, hotelbedsApiKey);
  assert.equal(fetchedHotelbedsIdentifier.metadata.secret, false);
  const blockedSecretLikeIdentifier = isolated.mainProcess.bindProviderCredentialIdentifier({
    source:"main_process_runtime",
    descriptor:hotelbedsIdentifierDescriptor,
    identifierType:"api_key",
    value:"sk-should-not-be-bound-as-identifier"
  });
  assert.equal(blockedSecretLikeIdentifier.ok, false);
  assert.equal(blockedSecretLikeIdentifier.error, "INVALID_IDENTIFIER_VALUE");
  const blockedUntrustedIdentifier = isolated.mainProcess.bindProviderCredentialIdentifier({
    source:"renderer",
    descriptor:hotelbedsIdentifierDescriptor,
    identifierType:"api_key",
    value:"0123456789abcdef0123456789abcdef"
  });
  assert.equal(blockedUntrustedIdentifier.ok, false);
  assert.equal(blockedUntrustedIdentifier.error, "UNTRUSTED_IDENTIFIER_SOURCE");

  const unavailableMenuAction = createProviderCredentialStoreMenuAction({
    getService:() => null,
    lockedCredentialTargetFromEnvironment
  });
  const unavailableMenuResult = await unavailableMenuAction();
  assert.equal(unavailableMenuResult.ok, false);
  assert.equal(unavailableMenuResult.error, "SECURE_ENTRY_SERVICE_UNAVAILABLE");
  assertMetadataOnly(unavailableMenuResult);

  const menuCalls = [];
  const lockedMenuAction = createProviderCredentialStoreMenuAction({
    getService:() => ({
      beginProviderCredentialSecureEntry(defaults) {
        menuCalls.push(defaults);
        return Promise.resolve({
          ok:true,
          operation:"SECURE_PROVIDER_CREDENTIAL_INGEST",
          action:"create",
          metadata:[{
            provider:"hotelbeds",
            environment:"evaluation",
            application:"Weishan",
            credentialType:"api_secret",
            status:"active",
            redacted:true
          }],
          secretCount:1,
          redacted:true
        });
      }
    }),
    getEnvironment:() => ({
      WEISHAN_PROVIDER_CREDENTIAL_ENTRY_MODE:"locked",
      WEISHAN_PROVIDER_CREDENTIAL_PROVIDER:"hotelbeds",
      WEISHAN_PROVIDER_CREDENTIAL_ENVIRONMENT:"evaluation",
      WEISHAN_PROVIDER_CREDENTIAL_APPLICATION:"Weishan",
      WEISHAN_PROVIDER_CREDENTIAL_TYPES:"api_secret",
      WEISHAN_PROVIDER_CREDENTIAL_OPERATION:"create"
    }),
    lockedCredentialTargetFromEnvironment
  });
  const lockedMenuResult = await lockedMenuAction();
  assert.equal(lockedMenuResult.ok, true);
  assert.equal(lockedMenuResult.operation, "SECURE_PROVIDER_CREDENTIAL_INGEST");
  assert.equal(lockedMenuResult.secretCount, 1);
  assert.deepEqual(menuCalls, [{
    lockedMetadata:true,
    provider:"hotelbeds",
    environment:"evaluation",
    application:"Weishan",
    operation:"create",
    credentialTypes:["api_secret"]
  }]);
  assertMetadataOnly(lockedMenuResult);

  const invalidMenuAction = createProviderCredentialStoreMenuAction({
    getService:() => ({
      beginProviderCredentialSecureEntry(defaults) {
        menuCalls.push(defaults);
        return Promise.resolve({ ok:false, error:"INVALID_APPLICATION_IDENTIFIER", redacted:true });
      }
    }),
    getEnvironment:() => ({
      WEISHAN_PROVIDER_CREDENTIAL_ENTRY_MODE:"locked",
      WEISHAN_PROVIDER_CREDENTIAL_PROVIDER:"hotelbeds",
      WEISHAN_PROVIDER_CREDENTIAL_ENVIRONMENT:"evaluation",
      WEISHAN_PROVIDER_CREDENTIAL_APPLICATION:"application",
      WEISHAN_PROVIDER_CREDENTIAL_TYPES:"api_secret"
    }),
    lockedCredentialTargetFromEnvironment
  });
  const invalidMenuResult = await invalidMenuAction();
  assert.equal(invalidMenuResult.ok, false);
  assert.equal(invalidMenuResult.error, "INVALID_APPLICATION_IDENTIFIER");
  assertMetadataOnly(invalidMenuResult);

  const unavailableIdentifierMenuAction = createProviderCredentialIdentifierMenuAction({
    getService:() => null,
    lockedIdentifierTargetFromEnvironment
  });
  const unavailableIdentifierMenuResult = await unavailableIdentifierMenuAction();
  assert.equal(unavailableIdentifierMenuResult.ok, false);
  assert.equal(unavailableIdentifierMenuResult.error, "IDENTIFIER_ENTRY_SERVICE_UNAVAILABLE");
  assertMetadataOnly(unavailableIdentifierMenuResult);

  const identifierMenuCalls = [];
  const lockedIdentifierMenuAction = createProviderCredentialIdentifierMenuAction({
    getService:() => ({
      beginProviderCredentialIdentifierEntry(defaults) {
        identifierMenuCalls.push(defaults);
        return Promise.resolve({
          ok:true,
          operation:"PROVIDER_CREDENTIAL_IDENTIFIER_BIND",
          metadata:{
            provider:"hotelbeds",
            environment:"evaluation",
            application:"Weishan",
            identifierType:"api_key",
            status:"bound",
            secret:false,
            valueAvailable:true,
            redacted:true
          },
          valueReturned:false,
          redacted:true
        });
      }
    }),
    getEnvironment:() => ({
      WEISHAN_PROVIDER_IDENTIFIER_ENTRY_MODE:"locked",
      WEISHAN_PROVIDER_IDENTIFIER_PROVIDER:"hotelbeds",
      WEISHAN_PROVIDER_IDENTIFIER_ENVIRONMENT:"evaluation",
      WEISHAN_PROVIDER_IDENTIFIER_APPLICATION:"Weishan",
      WEISHAN_PROVIDER_IDENTIFIER_TYPE:"api_key"
    }),
    lockedIdentifierTargetFromEnvironment
  });
  const lockedIdentifierMenuResult = await lockedIdentifierMenuAction();
  assert.equal(lockedIdentifierMenuResult.ok, true);
  assert.equal(lockedIdentifierMenuResult.operation, "PROVIDER_CREDENTIAL_IDENTIFIER_BIND");
  assert.equal(lockedIdentifierMenuResult.valueReturned, false);
  assert.deepEqual(identifierMenuCalls, [{
    lockedMetadata:true,
    provider:"hotelbeds",
    environment:"evaluation",
    application:"Weishan",
    identifierType:"api_key"
  }]);
  assertMetadataOnly(lockedIdentifierMenuResult);

  const stored = isolated.mainProcess.ingestProviderCredential({
    operation:"create",
    source:"secure_entry_zone",
    descriptor,
    credentialType:"client_secret",
    secret:firstBundle.client_secret
  });
  assert.equal(stored.ok, true);
  assert.equal(stored.operation, "SECURE_PROVIDER_CREDENTIAL_INGEST");
  assert.equal(stored.action, "create");
  assert.equal(stored.metadata.redacted, true);
  assert.equal(stored.metadata.secretAvailable, true);
  assert.equal(stored.secretReturned, false);
  assert.equal(stored.metadataOnly, true);
  assert.equal(JSON.stringify(stored).includes(firstBundle.client_secret), false);
  assert.equal(JSON.stringify(stored).includes(firstBundle.client_id), false);
  assert.equal(isolated.mainProcess.ingestProviderCredential({
    operation:"create",
    source:"secure_entry_zone",
    descriptor,
    credentialType:"client_secret",
    secret:"WEISHAN_DUPLICATE_SECRET"
  }).error, "CREDENTIAL_ALREADY_EXISTS");
  assert.equal(isolated.mainProcess.ingestProviderCredential({
    operation:"replace",
    source:"secure_entry_zone",
    descriptor,
    credentialType:"client_id",
    secret:firstBundle.client_id
  }).error, "CREDENTIAL_MISSING_FOR_REPLACE");
  const clientIdCreate = isolated.mainProcess.ingestProviderCredential({
    operation:"create",
    source:"secure_entry_zone",
    descriptor,
    credentialType:"client_id",
    secret:firstBundle.client_id
  });
  assert.equal(clientIdCreate.ok, true);
  assert.equal(JSON.stringify(clientIdCreate).includes(firstBundle.client_id), false);
  const poisonedRequest = {};
  Object.defineProperty(poisonedRequest, "operation", { enumerable:true, get() { throw new Error("must not execute"); } });
  assert.equal(isolated.mainProcess.ingestProviderCredential(poisonedRequest).error, "INVALID_INGEST_REQUEST");
  assert.equal(isolated.mainProcess.ingestProviderCredential({
    operation:"create",
    source:"secure_entry_zone",
    descriptor:{ provider:"sk-real-looking-provider-token", environment:"sandbox", application:"Weishan Global Commerce" },
    credentialType:"client_secret",
    secret:"WEISHAN_METADATA_REJECTED_SECRET"
  }).error, "INVALID_CREDENTIAL_DESCRIPTOR");
  assert.equal(isolated.mainProcess.ingestProviderCredential({
    operation:"create",
    source:"secure_entry_zone",
    descriptor:{ provider:"hotelbeds", environment:"sandbox", application:"sk-real-looking-application-token" },
    credentialType:"client_secret",
    secret:"WEISHAN_METADATA_REJECTED_SECRET"
  }).error, "INVALID_CREDENTIAL_DESCRIPTOR");
  assert.equal(isolated.mainProcess.ingestProviderCredential({
    operation:"create",
    source:"renderer",
    descriptor:{ provider:"hotelbeds", environment:"sandbox", application:"Weishan" },
    credentialType:"client_secret",
    secret:"WEISHAN_RENDERER_REJECTED_SECRET"
  }).error, "UNTRUSTED_CREDENTIAL_SOURCE");

  const providerDiskText = fs.readFileSync(isolated.storagePath(), "utf8");
  assert.equal(providerDiskText.includes(firstBundle.client_id), false);
  assert.equal(providerDiskText.includes(firstBundle.client_secret), false);
  assert.equal(providerDiskText.includes('"credential"'), false);
  assert.equal(fs.statSync(isolated.storagePath()).mode & 0o777, 0o600);
  assert.deepEqual(fs.readdirSync(isolatedStorageDir).filter((name) => /\.(?:tmp|lock)$/.test(name)), []);

  const sandboxSecret = await credentialMatches(isolated, descriptor, "client_secret", firstBundle.client_secret);
  assert.deepEqual(sandboxSecret, { ok:true, value:{ matches:true }, redacted:true });
  const missingProduction = await credentialMatches(isolated, productionDescriptor, "client_secret", "unused");
  assert.equal(missingProduction.ok, false);
  assert.equal(missingProduction.error, "CREDENTIAL_MISSING");
  const missingOtherProvider = await credentialMatches(isolated, otherProviderDescriptor, "client_secret", "unused");
  assert.equal(missingOtherProvider.ok, false);
  assert.equal(missingOtherProvider.error, "CREDENTIAL_MISSING");
  const missingOtherApplication = await credentialMatches(isolated, otherApplicationDescriptor, "client_secret", "unused");
  assert.equal(missingOtherApplication.ok, false);
  assert.equal(missingOtherApplication.error, "CREDENTIAL_MISSING");
  assert.equal((await credentialMatches(isolated, descriptor, "client_id", firstBundle.client_id)).value.matches, true);
  assert.equal(isolated.mainProcess.putCredentialBundle(otherApplicationDescriptor, { client_secret:"WEISHAN_OTHER_APP_SECRET" }, "secure_entry_zone").ok, true);
  assert.equal((await credentialMatches(isolated, otherApplicationDescriptor, "client_secret", "WEISHAN_OTHER_APP_SECRET")).value.matches, true);
  assert.equal((await credentialMatches(isolated, descriptor, "client_secret", firstBundle.client_secret)).value.matches, true);
  assert.equal(isolated.mainProcess.putCredentialBundle(otherProviderDescriptor, { client_secret:"WEISHAN_OTHER_PROVIDER_SECRET" }, "secure_entry_zone").ok, true);
  assert.equal((await credentialMatches(isolated, otherProviderDescriptor, "client_secret", "WEISHAN_OTHER_PROVIDER_SECRET")).value.matches, true);

  const runtimeUse = await isolated.mainProcess.withCredentialBundle(descriptor, ["client_id", "client_secret"], async (credentials) => ({
    authenticated:credentials.client_id === firstBundle.client_id && credentials.client_secret === firstBundle.client_secret,
    secretReturned:false
  }));
  assert.deepEqual(runtimeUse, { ok:true, value:{ authenticated:true, secretReturned:false }, redacted:true });
  const blockedRuntimeLeak = await isolated.mainProcess.withCredentialBundle(descriptor, ["client_secret"], async (credentials) => ({ leaked:credentials.client_secret }));
  assert.equal(blockedRuntimeLeak.ok, false);
  assert.equal(blockedRuntimeLeak.error, "RUNTIME_RESULT_SECRET_LEAK_BLOCKED");
  const blockedBufferLeak = await isolated.mainProcess.withCredentialBundle(descriptor, ["client_secret"], async (credentials) => Buffer.from(credentials.client_secret));
  assert.equal(blockedBufferLeak.ok, false);
  assert.equal(blockedBufferLeak.error, "RUNTIME_RESULT_SECRET_LEAK_BLOCKED");
  const blockedAccessorResult = await isolated.mainProcess.withCredentialBundle(descriptor, ["client_secret"], async () => Object.defineProperty({}, "value", { get() { return "hidden"; } }));
  assert.equal(blockedAccessorResult.ok, false);
  assert.equal(blockedAccessorResult.error, "RUNTIME_RESULT_SECRET_LEAK_BLOCKED");
  const blockedFunctionResult = await isolated.mainProcess.withCredentialBundle(descriptor, ["client_secret"], async (credentials) => () => credentials.client_secret);
  assert.equal(blockedFunctionResult.ok, false);
  assert.equal(blockedFunctionResult.error, "RUNTIME_RESULT_SECRET_LEAK_BLOCKED");
  const blockedSymbolResult = await isolated.mainProcess.withCredentialBundle(descriptor, ["client_secret"], async (credentials) => Symbol(credentials.client_secret));
  assert.equal(blockedSymbolResult.ok, false);
  assert.equal(blockedSymbolResult.error, "RUNTIME_RESULT_SECRET_LEAK_BLOCKED");
  const blockedCircularLeak = await isolated.mainProcess.withCredentialBundle(descriptor, ["client_secret"], async (credentials) => {
    const result = { nested:{ secret:credentials.client_secret } };
    result.self = result;
    return result;
  });
  assert.equal(blockedCircularLeak.ok, false);
  assert.equal(blockedCircularLeak.error, "RUNTIME_RESULT_SECRET_LEAK_BLOCKED");
  const sanitizedThrownError = await isolated.mainProcess.withCredentialBundle(descriptor, ["client_secret"], async (credentials) => {
    throw new Error("failure " + credentials.client_secret, { cause:credentials.client_secret });
  });
  assert.equal(sanitizedThrownError.ok, false);
  assert.equal(sanitizedThrownError.error, "RUNTIME_CALLBACK_FAILED");
  assert.equal(JSON.stringify(sanitizedThrownError).includes(firstBundle.client_secret), false);
  const partialMissing = await isolated.mainProcess.withCredentialBundle(descriptor, ["client_id", "refresh_token"], async () => ({ unreachable:true }));
  assert.equal(partialMissing.ok, false);
  assert.equal(partialMissing.error, "CREDENTIAL_MISSING");

  const replaced = isolated.mainProcess.ingestProviderCredential({
    operation:"rotate",
    source:"secure_entry_zone",
    descriptor,
    credentialType:"client_secret",
    secret:rotatedBundle.client_secret
  });
  assert.equal(replaced.ok, true);
  assert.equal(replaced.action, "rotate");
  assert.equal(replaced.metadata.rotationVersion, 2);
  const replacedClientId = isolated.mainProcess.ingestProviderCredential({
    operation:"replace",
    source:"secure_entry_zone",
    descriptor,
    credentialType:"client_id",
    secret:rotatedBundle.client_id
  });
  assert.equal(replacedClientId.ok, true);
  assert.equal((await credentialMatches(isolated, descriptor, "client_secret", rotatedBundle.client_secret)).value.matches, true);
  assert.equal((await credentialMatches(isolated, descriptor, "client_id", rotatedBundle.client_id)).value.matches, true);
  const rotatedDiskText = fs.readFileSync(isolated.storagePath(), "utf8");
  assert.equal(rotatedDiskText.includes(firstBundle.client_secret), false);
  assert.equal(rotatedDiskText.includes(rotatedBundle.client_secret), false);
  assert.equal(fs.statSync(isolated.storagePath()).mode & 0o777, 0o600);
  assert.deepEqual(fs.readdirSync(isolatedStorageDir).filter((name) => /\.(?:tmp|lock)$/.test(name)), []);

  const conflictStore = JSON.parse(fs.readFileSync(isolated.storagePath(), "utf8"));
  fs.writeFileSync(isolated.storagePath() + ".lock", "", { mode:0o600 });
  const busyWrite = isolated.mainProcess.putCredentialBundle(descriptor, { client_secret:"WEISHAN_PROVIDER_STORE_TEST_SECRET_BUSY" }, "secure_entry_zone");
  assert.equal(busyWrite.ok, false);
  assert.equal(busyWrite.error, "CREDENTIAL_STORE_BUSY");
  assert.equal(JSON.parse(fs.readFileSync(isolated.storagePath(), "utf8")).storageRevision, conflictStore.storageRevision);
  fs.unlinkSync(isolated.storagePath() + ".lock");

  const atomicDir = fs.mkdtempSync(path.join(os.tmpdir(), "weishan-provider-credential-atomic-"));
  const atomicBaseline = createSecureApiKeyStorageService({ storageDir:atomicDir, safeStorage:createFakeSafeStorage() });
  assert.equal(atomicBaseline.mainProcess.putCredentialBundle(descriptor, firstBundle, "secure_entry_zone").ok, true);
  const failingFs = Object.create(fs);
  failingFs.renameSync = () => { throw Object.assign(new Error("disk full"), { code:"ENOSPC" }); };
  const atomicFailure = createSecureApiKeyStorageService({ storageDir:atomicDir, safeStorage:createFakeSafeStorage(), fs:failingFs });
  const failedRotation = atomicFailure.mainProcess.putCredentialBundle(descriptor, rotatedBundle, "secure_entry_zone");
  assert.equal(failedRotation.ok, false);
  assert.equal(failedRotation.error, "CREDENTIAL_STORE_WRITE_FAILED");
  assert.equal((await credentialMatches(atomicBaseline, descriptor, "client_secret", firstBundle.client_secret)).value.matches, true);
  assert.deepEqual(fs.readdirSync(atomicDir).filter((name) => /\.(?:tmp|lock)$/.test(name)), []);

  const metadataList = isolated.listProviderCredentialMetadata({ provider:"ebay", environment:"sandbox", application:"Weishan Global Commerce" });
  assert.equal(metadataList.ok, true);
  assert.equal(metadataList.metadataOnly, true);
  assert.equal(metadataList.records.length, 2);
  assert.equal(JSON.stringify(metadataList).includes("encryptedBlob"), false);
  assert.equal(JSON.stringify(metadataList).includes(rotatedBundle.client_secret), false);

  const revoked = isolated.mainProcess.markCredentialBundleRevoked(descriptor);
  assert.equal(revoked.ok, true);
  assert.equal(revoked.revokedCount, 2);
  const revokedRead = await credentialMatches(isolated, descriptor, "client_secret", "unused");
  assert.equal(revokedRead.ok, false);
  assert.equal(revokedRead.error, "CREDENTIAL_REVOKED");
  const revokedDisk = JSON.parse(fs.readFileSync(isolated.storagePath(), "utf8"));
  const revokedRecords = Object.values(revokedDisk.providerCredentialRecords).filter((record) => record.provider === descriptor.provider && record.environment === descriptor.environment && record.application === descriptor.application);
  assert.equal(revokedRecords.every((record) => record.encryptedBlob === ""), true);

  const deletedBundle = isolated.mainProcess.deleteCredentialBundle(descriptor);
  assert.equal(deletedBundle.ok, true);
  assert.equal(deletedBundle.deletedCount, 2);
  const remainingEbayMetadata = isolated.listProviderCredentialMetadata({ provider:"ebay" }).records;
  assert.equal(remainingEbayMetadata.length, 1);
  assert.equal(remainingEbayMetadata[0].application, "Weishan Travel");

  const corruptedDir = fs.mkdtempSync(path.join(os.tmpdir(), "weishan-provider-credential-corrupted-"));
  const corrupted = createSecureApiKeyStorageService({ storageDir:corruptedDir, safeStorage:createFakeSafeStorage() });
  fs.writeFileSync(corrupted.storagePath(), "{not-json", { mode:0o600 });
  const corruptedBefore = fs.readFileSync(corrupted.storagePath(), "utf8");
  assert.equal(corrupted.providerCredentialStoreStatus().status, "corrupted");
  assert.equal(corrupted.listProviderCredentialMetadata({}).error, "CREDENTIAL_STORE_CORRUPTED");
  assert.equal((await credentialMatches(corrupted, descriptor, "client_secret", "unused")).error, "CREDENTIAL_STORE_CORRUPTED");
  assert.equal(corrupted.mainProcess.putCredentialBundle(descriptor, firstBundle, "secure_entry_zone").error, "CREDENTIAL_STORE_CORRUPTED");
  assert.equal(fs.readFileSync(corrupted.storagePath(), "utf8"), corruptedBefore);

  const invalidPayloadDir = fs.mkdtempSync(path.join(os.tmpdir(), "weishan-provider-credential-invalid-payload-"));
  const invalidPayload = createSecureApiKeyStorageService({ storageDir:invalidPayloadDir, safeStorage:createFakeSafeStorage() });
  assert.equal(invalidPayload.mainProcess.putCredentialBundle(descriptor, firstBundle, "secure_entry_zone").ok, true);
  const invalidPayloadStore = JSON.parse(fs.readFileSync(invalidPayload.storagePath(), "utf8"));
  const invalidPayloadRecord = Object.values(invalidPayloadStore.providerCredentialRecords).find((record) => record.credentialType === "client_secret");
  invalidPayloadRecord.encryptedBlob = "bm90LWVuY3J5cHRlZA==";
  fs.writeFileSync(invalidPayload.storagePath(), JSON.stringify(invalidPayloadStore), { mode:0o600 });
  const invalidPayloadRead = await credentialMatches(invalidPayload, descriptor, "client_secret", "unused");
  assert.equal(invalidPayloadRead.ok, false);
  assert.equal(invalidPayloadRead.error, "DECRYPT_FAILED");

  const getterBundle = {};
  Object.defineProperty(getterBundle, "client_secret", { enumerable:true, get() { throw new Error("must not execute"); } });
  const rejectedGetterBundle = isolated.mainProcess.putCredentialBundle(descriptor, getterBundle, "secure_entry_zone");
  assert.equal(rejectedGetterBundle.ok, false);
  assert.equal(rejectedGetterBundle.error, "INVALID_CREDENTIAL_BUNDLE");

  assert.equal(auditEvents.length > 0, true);
  assert.equal(auditEvents.every((event) => event.redacted === true), true);
  assert.equal(JSON.stringify(auditEvents).includes(firstBundle.client_secret), false);
  assert.equal(JSON.stringify(auditEvents).includes(rotatedBundle.client_secret), false);

  const untrusted = isolated.mainProcess.putCredentialBundle(descriptor, firstBundle, "renderer");
  assert.equal(untrusted.ok, false);
  assert.equal(untrusted.error, "UNTRUSTED_CREDENTIAL_SOURCE");

  const promptValues = ["ebay", "sandbox", "Weishan Global Commerce", "client_id,client_secret", "WEISHAN_SECURE_ENTRY_CLIENT", "WEISHAN_SECURE_ENTRY_SECRET"];
  const promptLabels = [];
  const secureEntry = createMacOSSecureEntry({
    platform:"darwin",
    execFile:(_file, args, _options, callback) => {
      promptLabels.push(String(args[args.indexOf("--") + 1] || ""));
      assert.equal(args.some((arg) => /WEISHAN_SECURE_ENTRY_(?:CLIENT|SECRET)/.test(String(arg))), false);
      callback(null, promptValues.shift() + "\n", "");
    }
  });
  const collected = await secureEntry.collectCredentialBundle();
  assert.equal(collected.ok, true);
  assert.deepEqual(collected.descriptor, descriptor);
  assert.equal(collected.credentials.client_id, "WEISHAN_SECURE_ENTRY_CLIENT");
  assert.equal(collected.credentials.client_secret, "WEISHAN_SECURE_ENTRY_SECRET");
  assert.deepEqual(promptLabels.slice(-2), [
    "ebay / sandbox / Weishan Global Commerce / client_id",
    "ebay / sandbox / Weishan Global Commerce / client_secret"
  ]);
  assert.equal(promptLabels.some((label) => /WEISHAN_SECURE_ENTRY_(?:CLIENT|SECRET)/.test(label)), false);

  const lockedTarget = {
    lockedMetadata:true,
    provider:"EBAY",
    environment:"SANDBOX",
    application:"Weishan Global Commerce",
    operation:"create",
    credentialTypes:["CLIENT_SECRET"]
  };
  const normalizedLockedTarget = normalizeLockedCredentialTarget(lockedTarget);
  assert.equal(normalizedLockedTarget.ok, true);
  assert.deepEqual(normalizedLockedTarget.descriptor, descriptor);
  assert.deepEqual(Array.from(normalizedLockedTarget.credentialTypes), ["client_secret"]);
  assert.equal(Object.isFrozen(normalizedLockedTarget.descriptor), true);
  assert.equal(Object.isFrozen(normalizedLockedTarget.credentialTypes), true);

  const lockedPromptLabels = [];
  const lockedSecureEntry = createMacOSSecureEntry({
    platform:"darwin",
    hostApplicationName:"Electron",
    execFile:(_file, args, _options, callback) => {
      assert.equal(String(args[1] || "").includes("tell application hostAppName"), true);
      lockedPromptLabels.push(String(args[args.indexOf("--") + 1] || ""));
      assert.equal(args.slice(args.indexOf("--") + 1).includes("Electron"), true);
      callback(null, "__WEISHAN_SECURE_ENTRY_CANCELLED__\n", "");
    }
  });
  const lockedCancelled = await lockedSecureEntry.collectCredentialBundle(lockedTarget);
  assert.equal(lockedCancelled.ok, false);
  assert.equal(lockedCancelled.error, "SECURE_ENTRY_CANCELLED");
  assert.deepEqual(lockedPromptLabels, ["ebay / sandbox / Weishan Global Commerce / client_secret"]);
  assert.equal(lockedPromptLabels.some((label) => /Credential target [1-4]\/4/.test(label)), false);

  const lockedFromEnvironment = lockedCredentialTargetFromEnvironment({
    WEISHAN_PROVIDER_CREDENTIAL_ENTRY_MODE:"locked",
    WEISHAN_PROVIDER_CREDENTIAL_PROVIDER:"EBAY",
    WEISHAN_PROVIDER_CREDENTIAL_ENVIRONMENT:"SANDBOX",
    WEISHAN_PROVIDER_CREDENTIAL_APPLICATION:"Weishan Global Commerce",
    WEISHAN_PROVIDER_CREDENTIAL_TYPES:"CLIENT_SECRET"
  });
  assert.deepEqual(lockedFromEnvironment, lockedTarget);
  assert.equal(lockedCredentialTargetFromEnvironment({}), null);
  assert.equal(normalizeLockedCredentialTarget({ ...lockedTarget, operation:"overwrite" }).error, "INVALID_SECURE_ENTRY_OPERATION");
  assert.equal(normalizeLockedCredentialTarget({ ...lockedTarget, application:"application" }).error, "INVALID_APPLICATION_IDENTIFIER");
  assert.equal(normalizeLockedCredentialTarget({ ...lockedTarget, credentialTypes:["credentialType"] }).error, "INVALID_CREDENTIAL_TYPE");

  const beginEntryStorageDir = fs.mkdtempSync(path.join(os.tmpdir(), "weishan-provider-credential-begin-entry-"));
  const beginEntryService = createSecureApiKeyStorageService({
    storageDir:beginEntryStorageDir,
    safeStorage:createFakeSafeStorage(),
    secureEntry:{
      async collectCredentialBundle() {
        return {
          ok:true,
          descriptor:{ provider:"hotelbeds", environment:"evaluation", application:"Weishan" },
          operation:"create",
          credentials:{ api_secret:"WEISHAN_HOTELBEDS_TEST_SECRET" },
          redacted:true
        };
      }
    }
  });
  const beginEntryStored = await beginEntryService.beginProviderCredentialSecureEntry();
  assert.equal(beginEntryStored.ok, true);
  assert.equal(beginEntryStored.operation, "SECURE_PROVIDER_CREDENTIAL_INGEST");
  assert.equal(beginEntryStored.action, "create");
  assert.equal(beginEntryStored.secretCount, 1);
  assert.equal(JSON.stringify(beginEntryStored).includes("WEISHAN_HOTELBEDS_TEST_SECRET"), false);
  assert.equal((await credentialMatches(beginEntryService, { provider:"hotelbeds", environment:"evaluation", application:"Weishan" }, "api_secret", "WEISHAN_HOTELBEDS_TEST_SECRET")).value.matches, true);
  const beginEntryDuplicate = await beginEntryService.beginProviderCredentialSecureEntry();
  assert.equal(beginEntryDuplicate.ok, false);
  assert.equal(beginEntryDuplicate.error, "CREDENTIAL_ALREADY_EXISTS");
  const beginEntryReplace = createSecureApiKeyStorageService({
    storageDir:beginEntryStorageDir,
    safeStorage:createFakeSafeStorage(),
    secureEntry:{
      async collectCredentialBundle() {
        return {
          ok:true,
          descriptor:{ provider:"hotelbeds", environment:"evaluation", application:"Weishan" },
          operation:"rotate",
          credentials:{ api_secret:"WEISHAN_HOTELBEDS_TEST_SECRET_ROTATED" },
          redacted:true
        };
      }
    }
  });
  const beginEntryRotated = await beginEntryReplace.beginProviderCredentialSecureEntry();
  assert.equal(beginEntryRotated.ok, true);
  assert.equal(beginEntryRotated.action, "rotate");
  assert.equal((await credentialMatches(beginEntryReplace, { provider:"hotelbeds", environment:"evaluation", application:"Weishan" }, "api_secret", "WEISHAN_HOTELBEDS_TEST_SECRET_ROTATED")).value.matches, true);
  assert.equal(fs.readFileSync(beginEntryReplace.storagePath(), "utf8").includes("WEISHAN_HOTELBEDS_TEST_SECRET_ROTATED"), false);

  const identifierPromptLabels = [];
  const identifierEntry = createMacOSIdentifierEntry({
    platform:"darwin",
    execFile:(_file, args, _options, callback) => {
      identifierPromptLabels.push(String(args[args.indexOf("--") + 1] || ""));
      assert.equal(args.some((arg) => String(arg).includes(hotelbedsApiKey)), false);
      callback(null, hotelbedsApiKey + "\n", "");
    }
  });
  const identifierCollected = await identifierEntry.collectIdentifierBinding({
    lockedMetadata:true,
    provider:"hotelbeds",
    environment:"evaluation",
    application:"Weishan",
    identifierType:"api_key"
  });
  assert.equal(identifierCollected.ok, true);
  assert.deepEqual(identifierCollected.descriptor, hotelbedsIdentifierDescriptor);
  assert.equal(identifierCollected.identifierType, "api_key");
  assert.equal(identifierCollected.value, hotelbedsApiKey);
  assert.deepEqual(identifierPromptLabels, ["hotelbeds / evaluation / Weishan / api_key"]);
  assert.equal(identifierPromptLabels.some((label) => label.includes(hotelbedsApiKey)), false);

  const lockedIdentifierTarget = lockedIdentifierTargetFromEnvironment({
    WEISHAN_PROVIDER_IDENTIFIER_ENTRY_MODE:"locked",
    WEISHAN_PROVIDER_IDENTIFIER_PROVIDER:"HOTELBEDS",
    WEISHAN_PROVIDER_IDENTIFIER_ENVIRONMENT:"EVALUATION",
    WEISHAN_PROVIDER_IDENTIFIER_APPLICATION:"Weishan",
    WEISHAN_PROVIDER_IDENTIFIER_TYPE:"API_KEY"
  });
  assert.deepEqual(lockedIdentifierTarget, {
    lockedMetadata:true,
    provider:"HOTELBEDS",
    environment:"EVALUATION",
    application:"Weishan",
    identifierType:"API_KEY"
  });
  assert.equal(lockedIdentifierTargetFromEnvironment({}), null);
  assert.equal(normalizeLockedIdentifierTarget(lockedIdentifierTarget).identifierType, "api_key");
  assert.equal(normalizeLockedIdentifierTarget({ ...lockedIdentifierTarget, application:"application" }).error, "INVALID_APPLICATION_IDENTIFIER");
  assert.equal(normalizeLockedIdentifierTarget({ ...lockedIdentifierTarget, identifierType:"credentialType" }).error, "INVALID_IDENTIFIER_TYPE");

  const beginIdentifierStorageDir = fs.mkdtempSync(path.join(os.tmpdir(), "weishan-provider-identifier-begin-entry-"));
  const beginIdentifierService = createSecureApiKeyStorageService({
    storageDir:beginIdentifierStorageDir,
    safeStorage:createFakeSafeStorage(),
    identifierEntry:{
      async collectIdentifierBinding() {
        return {
          ok:true,
          descriptor:hotelbedsIdentifierDescriptor,
          identifierType:"api_key",
          value:hotelbedsApiKey,
          redacted:true
        };
      }
    }
  });
  assert.equal(beginIdentifierService.providerCredentialStoreStatus().identifierEntryAvailable, true);
  const beginIdentifierBound = await beginIdentifierService.beginProviderCredentialIdentifierEntry();
  assert.equal(beginIdentifierBound.ok, true);
  assert.equal(beginIdentifierBound.operation, "PROVIDER_CREDENTIAL_IDENTIFIER_BIND");
  assert.equal(beginIdentifierBound.metadata.provider, "hotelbeds");
  assert.equal(beginIdentifierBound.metadata.identifierType, "api_key");
  assert.equal(beginIdentifierBound.metadata.secret, false);
  assert.equal(beginIdentifierBound.metadata.valueAvailable, true);
  assert.equal(beginIdentifierBound.valueReturned, false);
  assert.equal(JSON.stringify(beginIdentifierBound).includes(hotelbedsApiKey), false);
  assert.equal(beginIdentifierService.mainProcess.getProviderCredentialIdentifierForMainProcess(hotelbedsIdentifierDescriptor, "api_key").value, hotelbedsApiKey);
  assert.equal(fs.readFileSync(beginIdentifierService.storagePath(), "utf8").includes(hotelbedsApiKey), true);

  const ticketmasterPromptValues = ["ticketmaster", "development", "api_1-App", "api_key", "WEISHAN_TICKETMASTER_TEST_KEY"];
  const ticketmasterPromptLabels = [];
  const ticketmasterSecureEntry = createMacOSSecureEntry({
    platform:"darwin",
    execFile:(_file, args, _options, callback) => {
      ticketmasterPromptLabels.push(String(args[args.indexOf("--") + 1] || ""));
      assert.equal(args.some((arg) => String(arg).includes("WEISHAN_TICKETMASTER_TEST_KEY")), false);
      callback(null, ticketmasterPromptValues.shift() + "\n", "");
    }
  });
  const ticketmasterCollected = await ticketmasterSecureEntry.collectCredentialBundle();
  assert.equal(ticketmasterCollected.ok, true);
  assert.deepEqual(ticketmasterCollected.descriptor, {
    provider:"ticketmaster",
    environment:"development",
    application:"api_1-App"
  });
  assert.deepEqual(ticketmasterPromptLabels.slice(0, 4), [
    "Credential target 1/4 — Provider identifier",
    "Credential target 2/4 — Environment",
    "Credential target 3/4 — Application name",
    "Credential target 4/4 — Credential types, comma separated"
  ]);
  assert.equal(ticketmasterPromptLabels.at(-1), "ticketmaster / development / api_1-App / api_key");
  assert.equal(ticketmasterPromptLabels.some((label) => label.includes("WEISHAN_TICKETMASTER_TEST_KEY")), false);

  const shiftedMetadataValues = ["development", "development"];
  const shiftedMetadataLabels = [];
  const shiftedMetadataSecureEntry = createMacOSSecureEntry({
    platform:"darwin",
    execFile:(_file, args, _options, callback) => {
      shiftedMetadataLabels.push(String(args[args.indexOf("--") + 1] || ""));
      callback(null, shiftedMetadataValues.shift() + "\n", "");
    }
  });
  const shiftedMetadataResult = await shiftedMetadataSecureEntry.collectCredentialBundle();
  assert.equal(shiftedMetadataResult.ok, false);
  assert.equal(shiftedMetadataResult.error, "PROVIDER_ENVIRONMENT_COLLISION");
  assert.equal(shiftedMetadataLabels.length, 2);

  const invalidTypeValues = ["ticketmaster", "development", "api_1-App", "type → api_key"];
  const invalidTypeLabels = [];
  const invalidTypeSecureEntry = createMacOSSecureEntry({
    platform:"darwin",
    execFile:(_file, args, _options, callback) => {
      invalidTypeLabels.push(String(args[args.indexOf("--") + 1] || ""));
      callback(null, invalidTypeValues.shift() + "\n", "");
    }
  });
  const invalidTypeResult = await invalidTypeSecureEntry.collectCredentialBundle();
  assert.equal(invalidTypeResult.ok, false);
  assert.equal(invalidTypeResult.error, "INVALID_CREDENTIAL_TYPE");
  assert.equal(invalidTypeLabels.length, 4);

  let missingApplicationPromptCount = 0;
  const missingApplicationSecureEntry = createMacOSSecureEntry({
    platform:"darwin",
    execFile:(_file, _args, _options, callback) => {
      missingApplicationPromptCount += 1;
      callback(null, ["ticketmaster", "development", ""][missingApplicationPromptCount - 1] + "\n", "");
    }
  });
  const missingApplicationResult = await missingApplicationSecureEntry.collectCredentialBundle();
  assert.equal(missingApplicationResult.ok, false);
  assert.equal(missingApplicationResult.error, "METADATA_REQUIRED");
  assert.equal(missingApplicationPromptCount, 3);

  const ipcChannels = [];
  registerSecureApiKeyStorageHandlers({ handle:(channel) => ipcChannels.push(channel) }, {
    storageDir:fs.mkdtempSync(path.join(os.tmpdir(), "weishan-provider-credential-ipc-")),
    safeStorage:createFakeSafeStorage()
  });
  assert.deepEqual(ipcChannels.sort(), [
    "provider-credential:list-identifier-metadata",
    "provider-credential:list-metadata",
    "provider-credential:status",
    "secure-api-key:get-status",
    "secure-api-key:list",
    "secure-api-key:self-test"
  ]);
  assert.equal(ipcChannels.some((channel) => /(?:put|get-secret|save|rotate|delete|secure-entry)/.test(channel)), false);

  const preloadSource = fs.readFileSync(path.join(__dirname, "../../apps/desktop/src/preload.js"), "utf8");
  assert.equal(preloadSource.includes("provider-credential:status"), true);
  assert.equal(preloadSource.includes("provider-credential:list-metadata"), true);
  assert.equal(preloadSource.includes("provider-credential:begin-secure-entry"), false);
  assert.equal(preloadSource.includes("secure-api-key:save"), false);
  assert.equal(preloadSource.includes("secure-api-key:rotate"), false);
  assert.equal(preloadSource.includes("secure-api-key:delete"), false);

  const rendererSources = [
    "../../apps/desktop/src/renderer/routes/HomePage.js",
    "../../apps/desktop/src/renderer/routes/CommerceAgentPage.js",
    "../../apps/desktop/src/renderer/core/commerceSecureApiKeyStorageConsole.js"
  ].map((file) => fs.readFileSync(path.join(__dirname, file), "utf8")).join("\n");
  assert.equal(rendererSources.includes("data-secure-api-key-sandbox-input"), false);
  assert.equal(rendererSources.includes("bridge.saveProviderKey"), false);
  assert.equal(rendererSources.includes("bridge.rotateProviderKey"), false);
  assert.equal(rendererSources.includes("bridge.deleteProviderKey"), false);

  const genericSecureStorageSource = fs.readFileSync(path.join(__dirname, "../../apps/desktop/src/main/secureStorage.js"), "utf8");
  assert.equal(genericSecureStorageSource.includes("provider|commerce"), true);
  assert.equal(genericSecureStorageSource.includes("credential|secret|token"), true);

  console.log("SECURE_API_KEY_STORAGE_CORE PASS providerCredentialIngestion=provider_neutral");
}

main().catch((error) => {
  console.error(error && error.name || "Error");
  process.exit(1);
});
