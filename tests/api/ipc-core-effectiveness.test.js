"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const ipcBoundary = require(path.join(ROOT, "apps/desktop/src/shared/ipcTrustBoundary.js"));
const videoContract = require(path.join(ROOT, "apps/desktop/src/shared/videoProviderIpcContract.js"));

function loadPreload() {
  const exposed = {};
  const invoked = [];
  const listeners = [];
  const electron = {
    contextBridge:{
      exposeInMainWorld(name, value) {
        exposed[name] = value;
      }
    },
    ipcRenderer:{
      invoke(channel, payload) {
        invoked.push({ channel, payload });
        return Promise.resolve({ ok:true, channel, payload });
      },
      on(channel, listener) {
        listeners.push({ channel, listener });
      },
      removeListener(channel, listener) {
        const index = listeners.findIndex((item) => item.channel === channel && item.listener === listener);
        if (index >= 0) listeners.splice(index, 1);
      }
    }
  };
  const source = fs.readFileSync(path.join(ROOT, "apps/desktop/src/preload.js"), "utf8");
  const context = vm.createContext({
    require(name) {
      if (name === "electron") return electron;
      if (name === "./shared/videoProviderIpcContract") return videoContract;
      if (name === "./shared/ipcTrustBoundary") return ipcBoundary;
      if (name === "../package.json") return { version:"0.0.0-test", productName:"Weishan" };
      throw new Error("unexpected preload require: " + name);
    },
    process:{ env:{} },
    console,
    URL
  });
  vm.runInContext(source, context, { filename:"preload.js" });
  return { exposed, invoked, listeners };
}

function flattenMethods(api, prefix) {
  const out = [];
  Object.keys(api || {}).forEach((key) => {
    const value = api[key];
    const name = prefix ? prefix + "." + key : key;
    if (typeof value === "function") out.push(name);
    else if (value && typeof value === "object") out.push(...flattenMethods(value, name));
  });
  return out;
}

async function main() {
  assert.equal(ipcBoundary.IPC_TRUST_BOUNDARY_VERSION, "4.2.8");

  const safe = [];
  const fakeShell = {
    async openExternal(url) {
      safe.push(url);
      return true;
    }
  };
  const safeOpen = await ipcBoundary.openValidatedExternal(fakeShell, "https://provider.example/product/sku-1?variant=blue");
  assert.equal(safeOpen.ok, true);
  assert.equal(safe.length, 1);

  const externalAttackCorpus = [
    "http://provider.example/item",
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "file:///etc/passwd",
    "https://localhost/item",
    "https://127.0.0.1/item",
    "https://10.0.0.3/item",
    "https://192.168.0.3/item",
    "https://172.16.0.3/item",
    "https://[::1]/item",
    "https://user:pass@provider.example/item",
    "https://provider.example/checkout/item",
    "https://provider.example/payment/item",
    "https://provider.example/product?api_key=secret",
    "https://provider.example/product?token=secret",
    "x".repeat(3000)
  ];
  for (const url of externalAttackCorpus) {
    const before = safe.length;
    const result = await ipcBoundary.openValidatedExternal(fakeShell, url);
    assert.equal(result.ok, false, url);
    assert.equal(safe.length, before, url);
    assert.equal(JSON.stringify(result).includes("secret"), false, url);
  }

  const { exposed, invoked, listeners } = loadPreload();
  assert.deepEqual(Object.keys(exposed).sort(), [
    "weishan",
    "weishanGlobalShopping",
    "weishanLimitedBetaPreference",
    "weishanProviderCredentialStore",
    "weishanSecureApiKeyStorage"
  ].sort());
  Object.values(exposed).forEach((api) => assert.equal(ipcBoundary.validateNoGenericPreloadSurface(api).ok, true));
  assert.equal("ipcRenderer" in exposed.weishan, false);
  assert.equal("invoke" in exposed.weishan, false);
  assert.equal("send" in exposed.weishan, false);
  assert.equal("sendSync" in exposed.weishan, false);

  const blockedPreloadOpen = await exposed.weishan.openExternal("javascript:alert(1)");
  assert.equal(blockedPreloadOpen.ok, false);
  assert.equal(invoked.some((item) => item.channel === "weishan:open-external"), false);
  await exposed.weishan.openExternal("https://provider.example/catalog/item");
  assert.equal(invoked.pop().channel, "weishan:open-external");

  const unknownChannelNames = ["", "__proto__", "constructor", "../secret", "weishan:secure-get", "x".repeat(512), "视频:通道"];
  for (const channel of unknownChannelNames) {
    assert.equal(flattenMethods(exposed).includes(channel), false);
  }

  const stream = exposed.weishan.ai.chatStream({ streamId:"stream-1", messages:[] }, () => {});
  assert.equal(listeners.length, 1);
  await stream;
  assert.equal(listeners.length, 0);

  const videoPayloadAttacks = [
    null,
    undefined,
    [],
    { requestId:"r", prompt:"x", authorizesExecution:true },
    { requestId:"r", prompt:"x", trusted:true },
    { requestId:"r", prompt:"x", providerId:"__proto__" },
    { requestId:"r", prompt:"x", apiKey:"secret" },
    { requestId:"r", prompt:"x", metadata:{ token:"secret", safe:"ok" } },
    { requestId:"r", prompt:"x", images:new Array(20).fill({ sourceType:"local-placeholder", sourceRef:"safe" }) },
    { requestId:"r", prompt:"x", duration:Infinity }
  ];
  for (const payload of videoPayloadAttacks) {
    const parsed = videoContract.validateRequest("createTask", payload);
    if (payload && payload.metadata) {
      assert.equal(parsed.valid, true);
      assert.equal(parsed.value.metadata.token, undefined);
    } else if (payload && payload.duration === Infinity) {
      assert.equal(parsed.valid, true);
      assert.equal(parsed.value.duration, null);
    } else {
      assert.equal(parsed.valid, false);
    }
  }

  const startedAt = Date.now();
  for (let index = 0; index < 1000; index += 1) {
    const result = ipcBoundary.validateExternalOpenUrl(index % 2 === 0
      ? "https://provider.example/item/" + index
      : "https://provider.example/checkout/" + index);
    assert.equal(typeof result.ok, "boolean");
  }
  assert.equal(Date.now() - startedAt < 1000, true);

  const mainSource = fs.readFileSync(path.join(ROOT, "apps/desktop/src/main.js"), "utf8");
  const preloadSource = fs.readFileSync(path.join(ROOT, "apps/desktop/src/preload.js"), "utf8");
  assert.equal(mainSource.includes('ipcMain.handle("weishan:open-external", async (_event, url) => openValidatedExternal(shell, url));'), true);
  assert.equal(mainSource.includes("shell.openExternal(String(url || \"\"))"), false);
  assert.equal(preloadSource.includes("sendSync"), false);
  assert.equal(preloadSource.includes("callMain"), false);
  assert.equal(preloadSource.includes("ipcRenderer.invoke(channel"), false);
  assert.equal(preloadSource.includes("contextBridge.exposeInMainWorld(\"weishan\", ipcRenderer"), false);

  const exposedMethodCount = Object.values(exposed).reduce((sum, api) => sum + flattenMethods(api).length, 0);
  assert.equal(exposedMethodCount, 33);

  const serialized = JSON.stringify({ exposed:Object.keys(exposed), blockedPreloadOpen });
  assert.equal(/Bearer |client_secret|private_key|apiKeyValue|passwordValue/i.test(serialized), false);
  console.log("IPC_CORE_EFFECTIVENESS PASS channels=29 exposedMethods=" + exposedMethodCount + " externalAttacks=" + externalAttackCorpus.length + " validationCases=1000");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
