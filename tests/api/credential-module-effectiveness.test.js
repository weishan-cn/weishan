const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const Module = require("module");

function loadSecureStorageWithElectronMock(options = {}) {
  const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), "weishan-credential-core-"));
  const encryptionAvailable = options.encryptionAvailable !== false;
  const fakeSafeStorage = {
    isEncryptionAvailable: () => encryptionAvailable,
    encryptString: (value) => Buffer.from("enc:" + Buffer.from(String(value), "utf8").toString("base64"), "utf8"),
    decryptString: (buffer) => {
      const text = Buffer.from(buffer).toString("utf8");
      if (!text.startsWith("enc:")) throw new Error("synthetic decrypt failure");
      return Buffer.from(text.slice(4), "base64").toString("utf8");
    }
  };
  const electronMock = {
    app: { getPath: (name) => name === "userData" ? storageDir : storageDir },
    safeStorage: fakeSafeStorage
  };

  const secureStoragePath = path.join(__dirname, "../../apps/desktop/src/main/secureStorage.js");
  const originalLoad = Module._load;
  delete require.cache[secureStoragePath];
  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === "electron") return electronMock;
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    return {
      storageDir,
      api: require(secureStoragePath)
    };
  } finally {
    Module._load = originalLoad;
  }
}

function readStore(storageDir) {
  const file = path.join(storageDir, "secure-storage.json");
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function serialized(value) {
  return JSON.stringify(value);
}

async function main() {
  const syntheticAiSecret = "WEISHAN_SYNTHETIC_AI_CONNECTOR_SECRET_123456";
  const syntheticMailSecret = "WEISHAN_SYNTHETIC_MAIL_AUTHORIZATION_CODE_123456";

  const { storageDir, api } = loadSecureStorageWithElectronMock();
  const status = api.secureStatus();
  assert.equal(status.ok, true);
  assert.equal(status.encryptedAtRest, true);
  assert.equal(status.plaintextFallback, false);
  assert.deepEqual(status.allowedCredentialClasses.sort(), ["MAIL_CREDENTIAL", "USER_MANAGED_AI_CONNECTOR_SECRET"]);

  const classifier = api._testOnly.classifySecureKey;
  assert.equal(classifier("ai.provider.user-1.apiKey").credentialClass, "USER_MANAGED_AI_CONNECTOR_SECRET");
  assert.equal(classifier("mail.account.api-weishan.ai.authorizationCode").credentialClass, "MAIL_CREDENTIAL");
  assert.equal(classifier("provider.hotelbeds.evaluation.api_secret"), null);
  assert.equal(classifier("hotelbeds.evaluation.Weishan.mtls_private_key"), null);
  assert.equal(classifier("__proto__.polluted"), null);
  assert.equal(classifier("../secret"), null);

  const aiKey = "ai.provider.user-1.apiKey";
  const aiSet = api.secureSet(aiKey, syntheticAiSecret);
  assert.equal(aiSet.ok, true);
  assert.equal(aiSet.credentialClass, "USER_MANAGED_AI_CONNECTOR_SECRET");
  assert.equal(aiSet.rawReadbackAllowed, true);
  assert.equal(aiSet.plaintextFallback, false);

  const aiGet = api.secureGet(aiKey);
  assert.equal(aiGet.ok, true);
  assert.equal(aiGet.exists, true);
  assert.equal(aiGet.value, syntheticAiSecret);
  assert.equal(aiGet.credentialClass, "USER_MANAGED_AI_CONNECTOR_SECRET");

  const storeAfterAi = serialized(readStore(storageDir));
  assert.equal(storeAfterAi.includes(syntheticAiSecret), false);
  assert.equal(/WEISHAN_SYNTHETIC_AI_CONNECTOR_SECRET/.test(storeAfterAi), false);

  const mailKey = "mail.account.api-weishan.ai.authorizationCode";
  const mailSet = api.secureSet(mailKey, syntheticMailSecret);
  assert.equal(mailSet.ok, true);
  assert.equal(mailSet.credentialClass, "MAIL_CREDENTIAL");
  assert.equal(mailSet.rawReadbackAllowed, false);

  const mailGet = api.secureGet(mailKey);
  assert.equal(mailGet.ok, false);
  assert.equal(mailGet.error, "RAW_READBACK_BLOCKED");
  assert.equal(mailGet.value, "");
  assert.equal(mailGet.credentialClass, "MAIL_CREDENTIAL");
  assert.equal(mailGet.rawReadbackAllowed, false);

  const storeAfterMail = serialized(readStore(storageDir));
  assert.equal(storeAfterMail.includes(syntheticMailSecret), false);
  assert.equal(/WEISHAN_SYNTHETIC_MAIL_AUTHORIZATION_CODE/.test(storeAfterMail), false);

  const blockedKeys = [
    "provider.hotelbeds.evaluation.api_secret",
    "commerce.provider.credential",
    "hotelbeds.evaluation.Weishan.mtls_private_key",
    "hotelbeds.evaluation.Weishan.mtls_challenge_password",
    "mail.account.api-weishan.ai.client_secret",
    "ai.provider.user-1.access_token",
    "constructor.prototype.apiKey",
    "x".repeat(260)
  ];
  blockedKeys.forEach((key) => {
    assert.equal(api.secureSet(key, "WEISHAN_SYNTHETIC_BLOCKED_SECRET_123456").ok, false, key);
    assert.equal(api.secureGet(key).ok, false, key);
    assert.equal(api.secureDelete(key).ok, false, key);
  });

  const beforeDelete = Object.keys(readStore(storageDir));
  const deleted = api.secureDelete(aiKey);
  assert.equal(deleted.ok, true);
  assert.equal(api.secureGet(aiKey).exists, false);
  const afterDelete = Object.keys(readStore(storageDir));
  assert.equal(beforeDelete.includes(mailKey), true);
  assert.equal(afterDelete.includes(mailKey), true);
  assert.equal(afterDelete.includes(aiKey), false);

  for (let i = 0; i < 1000; i += 1) {
    const key = "ai.provider.user-" + i + ".apiKey";
    const policy = classifier(key);
    assert.equal(policy && policy.credentialClass, "USER_MANAGED_AI_CONNECTOR_SECRET");
  }

  const unavailable = loadSecureStorageWithElectronMock({ encryptionAvailable:false }).api;
  assert.equal(unavailable.secureStatus().plaintextFallback, false);
  assert.equal(unavailable.secureSet("ai.provider.user-2.apiKey", syntheticAiSecret).error, "STORAGE_UNAVAILABLE");
  assert.equal(unavailable.secureGet("ai.provider.user-2.apiKey").error, "STORAGE_UNAVAILABLE");
  assert.equal(unavailable.secureDelete("ai.provider.user-2.apiKey").error, "STORAGE_UNAVAILABLE");

  const channels = [];
  api.registerSecureStorageHandlers({ handle:(channel) => channels.push(channel) });
  assert.deepEqual(channels.sort(), [
    "weishan:secure-delete",
    "weishan:secure-get",
    "weishan:secure-set",
    "weishan:secure-status"
  ]);

  console.log("CREDENTIAL_MODULE_EFFECTIVENESS PASS rawProviderReadback=0 mailReadback=0 aiConnectorLegacyReadback=1 blockedNamespaces=" + blockedKeys.length + " namespaceValidations=1000");
}

main().catch((error) => {
  console.error(error && error.stack || error);
  process.exit(1);
});
