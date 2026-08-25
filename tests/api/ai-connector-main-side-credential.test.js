const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function createWindow() {
  const store = new Map();
  const secureStore = new Map();
  const calls = { secureGet:0, secureSet:0, secureStatus:0, secureDelete:0, aiTest:0, aiChat:0, aiModels:0 };
  const window = {
    window:null,
    console,
    CustomEvent:function(type, init) { this.type = type; this.detail = init && init.detail; },
    dispatchEvent() {},
    AccountApi:{ current:() => ({ loggedIn:true, accountId:"acct-main-side" }) },
    WeishanStore:{
      read:(key, fallback) => store.has(key) ? store.get(key) : fallback,
      write:(key, value) => { store.set(key, value); return value; },
      now:() => "2026-08-26T00:00:00.000Z"
    },
    weishan:{
      secure:{
        set:async (key, value) => {
          calls.secureSet += 1;
          secureStore.set(String(key || ""), String(value || ""));
          return { ok:true, saved:true, encryptedAtRest:true, sessionOnly:false, plaintextFallback:false };
        },
        status:async (key) => {
          calls.secureStatus += 1;
          if (!key) return { ok:true, available:true, encryptedAtRest:true, sessionOnly:false, plaintextFallback:false };
          return { ok:true, exists:secureStore.has(String(key || "")), encryptedAtRest:true, sessionOnly:false, plaintextFallback:false };
        },
        delete:async (key) => {
          calls.secureDelete += 1;
          secureStore.delete(String(key || ""));
          return { ok:true, deleted:true, encryptedAtRest:true, sessionOnly:false, plaintextFallback:false };
        }
      },
      ai:{
        testConnector:async (connector) => {
          calls.aiTest += 1;
          assert.equal(Object.prototype.hasOwnProperty.call(connector || {}, "apiKey"), false);
          assert.equal(connector.hasRequestApiKey, true);
          assert.equal(connector.credentialRef && connector.credentialRef.credentialClass, "USER_MANAGED_AI_CONNECTOR_SECRET");
          assert.equal(connector.credentialRef && connector.credentialRef.accountId, "acct-main-side");
          return { ok:true, message:"ok", detectedProtocol:"chat-completions-compatible" };
        },
        chat:async (payload) => {
          calls.aiChat += 1;
          assert.equal(Object.prototype.hasOwnProperty.call(payload.connector || {}, "apiKey"), false);
          assert.equal(payload.connector.hasRequestApiKey, true);
          return { ok:true, content:"synthetic response", detectedProtocol:"chat-completions-compatible" };
        },
        listModels:async (connector) => {
          calls.aiModels += 1;
          assert.equal(Object.prototype.hasOwnProperty.call(connector || {}, "apiKey"), false);
          assert.equal(connector.hasRequestApiKey, true);
          return { ok:true, models:["synthetic/model"] };
        }
      }
    }
  };
  window.window = window;
  return { window, store, secureStore, calls };
}

function loadApi(window) {
  const context = vm.createContext({ window, console, CustomEvent:window.CustomEvent, setTimeout, clearTimeout });
  const file = path.join(ROOT, "apps/desktop/src/renderer/core/api.js");
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename:file });
  return window.WeishanAPI;
}

async function main() {
  const { window, store, secureStore, calls } = createWindow();
  const api = loadApi(window);
  const input = {
    providerType:"openrouter",
    baseUrl:"https://openrouter.ai/api/v1",
    chatModel:"synthetic/model",
    apiKey:"SYNTHETIC_AI_CONNECTOR_SECRET_VALUE"
  };

  const saved = await api.saveConnector(input);
  assert.equal(saved.ok, true);
  assert.equal(saved.hasApiKey, true);
  assert.equal(calls.secureSet, 1);
  assert.equal(calls.secureGet, 0);
  assert.equal(JSON.stringify(store.get(api.connectorKey())).includes("SYNTHETIC_AI_CONNECTOR_SECRET_VALUE"), false);

  const request = await api.connectorForRequest({});
  assert.equal(request.hasRequestApiKey, true);
  assert.equal(Object.prototype.hasOwnProperty.call(request, "apiKey"), false);
  assert.equal(JSON.stringify(request).includes("SYNTHETIC_AI_CONNECTOR_SECRET_VALUE"), false);

  const test = await api.testConnector({});
  assert.equal(test.ok, true);
  const chat = await api.chat([{ role:"user", content:"hello" }]);
  assert.equal(chat.ok, true);
  const models = await window.weishan.ai.listModels(await api.connectorForRequest({}));
  assert.deepEqual(models.models, ["synthetic/model"]);

  await api.saveConnector(Object.assign({}, input, { apiKey:"SYNTHETIC_AI_CONNECTOR_REPLACEMENT_SECRET" }));
  assert.equal(calls.secureSet, 2);
  assert.equal(Array.from(secureStore.values()).includes("SYNTHETIC_AI_CONNECTOR_REPLACEMENT_SECRET"), true);
  assert.equal(JSON.stringify(store.get(api.connectorKey())).includes("SYNTHETIC_AI_CONNECTOR_REPLACEMENT_SECRET"), false);

  await api.clearConnector();
  assert.equal(calls.secureDelete, 1);
  assert.equal(api.connectorSummary().state, "not_configured");

  const preloadSource = fs.readFileSync(path.join(ROOT, "apps/desktop/src/preload.js"), "utf8");
  const mainSource = fs.readFileSync(path.join(ROOT, "apps/desktop/src/main.js"), "utf8");
  assert.equal(preloadSource.includes("weishan:secure-get"), false);
  assert.equal(mainSource.includes("weishan:secure-get"), false);
  assert.equal(mainSource.includes("UNAUTHORIZED_CONNECTOR_TRANSPORT_FIELD"), true);
  assert.equal(mainSource.includes("AI_CONNECTOR_ENDPOINT_NOT_ALLOWED"), true);

  console.log("AI_CONNECTOR_MAIN_SIDE_CREDENTIAL PASS rawRendererReadback=0 secureGetCalls=" + calls.secureGet + " aiRequests=" + (calls.aiTest + calls.aiChat + calls.aiModels));
}

main().catch((error) => {
  console.error(error && error.stack || error);
  process.exit(1);
});
