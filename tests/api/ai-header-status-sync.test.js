const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function createWindow() {
  const store = new Map();
  const listeners = {};
  const window = {
    window:null,
    console,
    __events:listeners,
    addEventListener(type, handler) {
      listeners[type] = listeners[type] || [];
      listeners[type].push(handler);
    },
    removeEventListener(type, handler) {
      listeners[type] = (listeners[type] || []).filter((item) => item !== handler);
    },
    dispatchEvent(event) {
      (listeners[event.type] || []).forEach((handler) => handler(event));
    },
    CustomEvent:function(type, init) {
      this.type = type;
      this.detail = init && init.detail;
    },
    WeishanStore:{
      read(key, fallback) {
        return store.has(key) ? store.get(key) : fallback;
      },
      write(key, value) {
        store.set(key, value);
        return value;
      },
      now() {
        return "2026-07-12T00:00:00.000Z";
      }
    },
    AccountApi:{
      current() {
        return { loggedIn:true, accountId:"acct-1" };
      }
    },
    weishan:{
      secure:{
        get:async function() { return { ok:true, exists:true, value:"unit-test-key" }; }
      },
      ai:{
        testConnector:async function() { return { ok:true, message:"ok" }; },
        chat:async function() { return { ok:true, content:"ok" }; }
      }
    }
  };
  window.window = window;
  return { window, store };
}

function loadApi(window) {
  const context = vm.createContext({ window, console, CustomEvent:window.CustomEvent, setTimeout, clearTimeout });
  const file = path.join(ROOT, "apps/desktop/src/renderer/core/api.js");
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename:file });
  return window.WeishanAPI;
}

function createTopbarDocument() {
  const listeners = {};
  const status = { id:"homeAiStatus", className:"home-ai-status", textContent:"", dataset:{} };
  const actions = {
    querySelector(selector) {
      if (selector === "#homeAiStatus") return status;
      if (selector === "#langSelect") return { id:"langSelect" };
      return null;
    },
    insertBefore(node) {
      return node;
    }
  };
  const topbar = {
    querySelector(selector) {
      if (selector === "h1" || selector === "p") return { textContent:"" };
      if (selector === ".top-actions") return actions;
      if (selector === "#langSelect") return { id:"langSelect" };
      return null;
    }
  };
  return {
    status,
    document:{
      visibilityState:"visible",
      addEventListener(type, handler) {
        listeners[type] = listeners[type] || [];
        listeners[type].push(handler);
      },
      removeEventListener(type, handler) {
        listeners[type] = (listeners[type] || []).filter((item) => item !== handler);
      },
      querySelector(selector) {
        if (selector === ".topbar") return topbar;
        return null;
      },
      createElement() {
        return { id:"", className:"", dataset:{}, textContent:"" };
      },
      __events:listeners
    }
  };
}

function loadHomePage(window, document) {
  const context = vm.createContext({
    window,
    document,
    console,
    requestAnimationFrame:(fn) => fn(),
    setTimeout:(fn) => fn(),
    clearTimeout
  });
  const file = path.join(ROOT, "apps/desktop/src/renderer/routes/HomePage.js");
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename:file });
  return window.HomePage;
}

function loadSettingsPage(window) {
  const context = vm.createContext({ window, console, setTimeout, clearTimeout });
  const file = path.join(ROOT, "apps/desktop/src/renderer/routes/SettingsPage.js");
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename:file });
  return window.SettingsPage;
}

function createSettingsHost() {
  const status = {
    className:"",
    renderCount:0,
    _innerHTML:"",
    get innerHTML() { return this._innerHTML; },
    set innerHTML(value) { this._innerHTML = value; this.renderCount += 1; }
  };
  const pill = { className:"", textContent:"" };
  const provider = { textContent:"" };
  return {
    status,
    host:{
      querySelector(selector) {
        if (selector === "#connectorStatus") return status;
        if (selector === ".connector-pill") return pill;
        if (selector === "#providerDetect") return provider;
        return null;
      }
    }
  };
}

async function main() {
  const { window, store } = createWindow();
  window.WeishanRouter = { current:() => "home" };
  window.CommandApi = {
    snapshot() {
      return { queue:[], history:[], processing:false, brain:window.WeishanAPI ? window.WeishanAPI.connectorSummary().label : "AI 未配置" };
    }
  };
  const api = loadApi(window);

  assert.equal(api.connectorSummary().state, "not_configured");
  assert.equal(api.connectorSummary().label, "AI 未配置");

  store.set(api.connectorKey(), {
    providerType:"openrouter",
    baseUrl:"https://openrouter.ai/api/v1",
    chatModel:"aion-labs/aion-1.0-mini",
    hasApiKey:true,
    testStatus:"saved"
  });
  assert.equal(api.connectorSummary().state, "saved_untested");
  assert.equal(api.connectorSummary().label, "AI 未测试");

  const connectorInput = {
    providerType:"openrouter",
    baseUrl:"https://openrouter.ai/api/v1",
    chatModel:"aion-labs/aion-1.0-mini",
    apiKey:"unit-test-key"
  };
  const testSuccess = await api.testConnector(connectorInput);
  assert.equal(testSuccess.ok, true);
  assert.equal(api.connectorSummary().state, "connected");
  window.weishan.ai.testConnector = async function() { throw new Error("network failed"); };
  await assert.rejects(() => api.testConnector(connectorInput), /network failed/);
  assert.equal(api.connectorSummary().state, "failed");
  assert.notEqual(api.connectorSummary().state, "testing");
  window.weishan.ai.testConnector = async function() { return { ok:true, message:"ok" }; };

  api.setConnectorRuntimeState("testing");
  assert.equal(api.connectorSummary().state, "testing");
  assert.equal(api.connectorSummary().label, "AI 测试中");

  api.saveTest({}, { ok:false, message:"network failed" });
  assert.equal(api.connectorSummary().state, "failed");
  assert.equal(api.connectorSummary().label, "AI 连接失败");

  api.saveTest({}, { ok:true, message:"ok", providerType:"openrouter" });
  const connectedSummary = api.connectorSummary();
  assert.equal(connectedSummary.state, "connected");
  assert.equal(connectedSummary.connected, true);
  assert.match(connectedSummary.label, /^AI 已连接/);

  const subscriptionEvents = [];
  const unsubscribe = api.subscribeConnectorStatus((payload) => {
    subscriptionEvents.push(payload.state);
  });
  api.setConnectorRuntimeState("testing");
  api.saveTest({}, { ok:true, message:"ok", providerType:"openrouter" });
  unsubscribe();
  api.saveTest({}, { ok:false, message:"network failed" });
  assert.deepEqual(Array.from(subscriptionEvents.slice(0, 3)), ["connected", "testing", "connected"]);

  api.saveTest({}, { ok:true, message:"ok", providerType:"openrouter" });

  const { status, document } = createTopbarDocument();
  const homePage = loadHomePage(window, document);
  homePage.__bindHomeAiStatusRuntimeHooksForTest();
  homePage.__syncHomeTopbarForTest({ brain:"AI 未配置" });
  assert.equal(status.dataset.aiState, "connected");
  assert.match(status.textContent, /^AI 已连接/);

  store.set(api.connectorKey(), {
    providerType:"openrouter",
    baseUrl:"https://openrouter.ai/api/v1",
    chatModel:"aion-labs/aion-1.0-mini",
    hasApiKey:true,
    testStatus:"saved"
  });
  homePage.__syncHomeTopbarForTest({ brain:"AI 未配置" });
  assert.equal(status.dataset.aiState, "saved_untested");
  assert.equal(status.textContent, "AI 未测试");

  api.saveTest({}, { ok:false, message:"network failed" });
  homePage.__refreshHomeAiStatusForTest();
  assert.equal(status.dataset.aiState, "failed");
  assert.equal(status.textContent, "AI 连接失败");

  window.weishan.ai.chat = async function() { return { ok:true, content:"ok" }; };
  const chatSuccess = await api.chat([{ role:"user", content:"hello" }]);
  assert.equal(chatSuccess.ok, true);
  assert.equal(status.dataset.aiState, "connected");
  window.weishan.ai.chat = async function() { return { ok:false, error:"network failed" }; };
  const chatFailure = await api.chat([{ role:"user", content:"hello" }]);
  assert.equal(chatFailure.ok, false);
  assert.equal(api.connectorSummary().state, "failed");
  assert.equal(status.dataset.aiState, "failed");
  window.weishan.ai.chat = async function() { return { ok:true, content:"ok" }; };
  await api.chat([{ role:"user", content:"hello" }]);

  window.I18n = {
    t:(key) => key,
    format:(key, vars) => key + JSON.stringify(vars || {})
  };
  const settingsPage = loadSettingsPage(window);
  const settingsView = createSettingsHost();
  window.weishan.ai.testConnector = async function() { throw new Error("network failed"); };
  api.setConnectorRuntimeState("testing");
  await assert.rejects(() => settingsPage.__runConnectorTestForTest(settingsView.host, connectorInput), /network failed/);
  assert.equal(api.connectorSummary().state, "failed");
  assert.notEqual(api.connectorSummary().state, "testing");
  window.weishan.ai.testConnector = async function() { return { ok:true, message:"ok" }; };
  settingsPage.__bindSettingsConnectorStatusRuntimeHooksForTest(settingsView.host);
  settingsPage.__bindSettingsConnectorStatusRuntimeHooksForTest(settingsView.host);
  const settingsRendersBeforeChange = settingsView.status.renderCount;
  api.saveTest({}, { ok:false, message:"network failed" });
  assert.equal(settingsView.status.className, "connector-status connector-failed");
  assert.equal(settingsView.status.renderCount, settingsRendersBeforeChange + 1);
  settingsPage.unmount();
  const settingsRendersBeforeUnmountedChange = settingsView.status.renderCount;
  api.saveTest({}, { ok:true, message:"ok", providerType:"openrouter" });
  assert.equal(settingsView.status.renderCount, settingsRendersBeforeUnmountedChange);

  store.set(api.connectorKey(), {
    providerType:"openrouter",
    baseUrl:"https://openrouter.ai/api/v1",
    chatModel:"aion-labs/aion-1.0-mini",
    hasApiKey:true,
    testStatus:"success"
  });
  window.dispatchEvent(new window.CustomEvent("weishan:route-changed", { detail:{ route:"home" } }));
  assert.equal(status.dataset.aiState, "connected");
  assert.match(status.textContent, /^AI 已连接/);

  homePage.__bindHomeAiStatusRuntimeHooksForTest();
  const focusListeners = window.__events.focus || [];
  const routeListeners = window.__events["weishan:route-changed"] || [];
  const visibilityListeners = document.__events.visibilitychange || [];
  assert.equal(focusListeners.length, 1);
  assert.equal(routeListeners.length, 1);
  assert.equal(visibilityListeners.length, 1);

  homePage.unmount();
  assert.equal((window.__events.focus || []).length, 0);
  assert.equal((window.__events["weishan:route-changed"] || []).length, 0);
  assert.equal((document.__events.visibilitychange || []).length, 0);

  const summaryPayload = api.connectorSummary();
  assert.equal(typeof summaryPayload.connector.hasApiKey, "boolean");
  const apiJson = JSON.stringify(summaryPayload);
  assert.equal(/"apiKey"\s*:|"token"\s*:|"secret"\s*:|"credential"\s*:|"password"\s*:|"authorization"\s*:|"cookie"\s*:/.test(apiJson), false);
  assert.equal(/sk-[a-z0-9_-]+|pk_[a-z0-9_-]+|bearer\s+[a-z0-9._-]+/i.test(apiJson), false);

  console.log("AI_HEADER_STATUS_SYNC PASS");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
