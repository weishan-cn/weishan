"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const core = path.join(root, "apps/desktop/src/renderer/core");
const discoveryKeys = [
  "discoveryTitle", "discoveryType", "discoveryProduct", "discoveryHotel", "discoveryFlight", "discoveryStock",
  "discoveryQuery", "discoveryDestination", "discoverySearch", "discoveryMarket", "discoveryBasis", "discoveryIgnored",
  "discoveryProviders", "discoveryCurrencyNotice", "discoveryTotal", "discoveryOpenPlatform", "discoveryConfirmation",
  "discoveryIntentStatus", "discoveryConfirm", "discoveryCancel", "discoveryPending"
];
let cases = 0;

function check(name, run) {
  run();
  cases += 1;
}

function json(value) {
  return JSON.parse(JSON.stringify(value));
}

function load() {
  const store = {};
  const windowRef = {
    navigator:{language:"en-US"},
    WeishanStore:{read:(key, fallback) => Object.prototype.hasOwnProperty.call(store, key) ? store[key] : fallback, write:(key, value) => { store[key] = value; }},
    dispatchEvent() {}
  };
  windowRef.window = windowRef;
  const context = vm.createContext({window:windowRef, CustomEvent:function CustomEvent() {}});
  ["i18n.js", "globalDiscoveryErrorContract.js", "globalDiscoveryInputGuard.js", "globalDiscoveryEngine.js", "globalDiscoveryWorkspace.js"].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(core, file), "utf8"), context, {filename:file});
  });
  return {i18n:windowRef.I18n, workspace:windowRef.WeishanGlobalDiscoveryWorkspace};
}

function productState(workspace) {
  const initial = workspace.createGlobalDiscoveryWorkspaceState();
  const edited = workspace.transitionGlobalDiscoveryWorkspace(initial, {type:"EDIT", query:"Sony Headphones Demo", destination:"Japan"});
  const complete = workspace.runGlobalDiscoveryWorkspace(edited);
  return Object.freeze(Object.assign({}, complete, {
    redirectIntent:workspace.createRedirectIntent(complete.normalizedCandidates[0], complete)
  }));
}

function snapshot(state, workspace) {
  return json({
    workspaceState:state,
    errorCopy:workspace.ERROR_COPY,
    errorDto:workspace.runGlobalDiscoveryWorkspace(Object.assign({}, state, {query:"", destination:""})).error,
    redirectIntent:state.redirectIntent,
    redirectReason:state.redirectIntent.reason,
    payloadSummary:state.redirectIntent.payloadSummary,
    candidates:state.normalizedCandidates,
    providers:state.selectedProviders,
    query:state.query,
    totals:state.normalizedCandidates.map((candidate) => candidate.total),
    currencies:state.normalizedCandidates.map((candidate) => candidate.currency),
    candidateOrder:state.normalizedCandidates.map((candidate) => candidate.candidateId),
    selectedCandidates:state.deduplicatedCandidates.map((candidate) => candidate.candidateId)
  });
}

function main() {
  const {i18n, workspace} = load();
  const state = productState(workspace);
  const baseline = snapshot(state, workspace);
  const rendered = {};

  ["zh", "en", "zh-Hant"].forEach((language) => {
    i18n.setLang(language);
    rendered[language] = workspace.renderGlobalDiscoveryWorkspace(state);
    check(language+" render preserves every non-presentation value", () => assert.deepEqual(snapshot(state, workspace), baseline));
    check(language+" renders all discovery keys without a fallback", () => discoveryKeys.forEach((key) => {
      const value = i18n.t(key);
      assert.notEqual(value, key, language+":"+key);
      assert.notEqual(value, "", language+":"+key);
    }));
  });

  check("three languages produce distinct render-only HTML", () => {
    assert.notEqual(rendered.zh, rendered.en);
    assert.notEqual(rendered.en, rendered["zh-Hant"]);
  });
  check("localized type labels change with language", () => {
    assert.match(rendered.zh, />商品<.*>酒店<.*>机票<.*>股票</);
    assert.match(rendered.en, />Products<.*>Hotels<.*>Flights<.*>Stocks</);
    assert.match(rendered["zh-Hant"], />商品<.*>飯店<.*>機票<.*>股票</);
  });
  check("localized field and market shell changes with language", () => {
    assert.match(rendered.zh, /查询条件.*目标市场\/目的地.*查看平台报价.*目标市场/);
    assert.match(rendered.en, /Search query.*Target market or destination.*View platform quotes.*Target market/);
    assert.match(rendered["zh-Hant"], /查詢條件.*目標市場／目的地.*查看平台報價.*目標市場/);
  });
  check("localized candidate and provider shell changes with language", () => {
    assert.match(rendered.zh, /已选择 3 个离线来源.*总价：.*前往平台/);
    assert.match(rendered.en, /3 offline sources selected.*Total：.*Open platform/);
    assert.match(rendered["zh-Hant"], /已選擇 3 個離線來源.*總價：.*前往平台/);
  });
  check("localized confirmation shell changes with language", () => {
    assert.match(rendered.zh, /确认意图.*取消/);
    assert.match(rendered.en, /Confirm intent.*Cancel/);
    assert.match(rendered["zh-Hant"], /確認意圖.*取消/);
  });
  check("user query remains literal in every language", () => {
    [rendered.zh, rendered.en, rendered["zh-Hant"]].forEach((html) => assert.match(html, /value="Sony Headphones Demo"/));
  });
  check("third-party provider names, prices, and currencies remain literal", () => {
    [rendered.zh, rendered.en, rendered["zh-Hant"]].forEach((html) => {
      assert.match(html, /JP Local Market Demo/);
      assert.match(html, /13970 JPY/);
    });
  });
  check("rendered HTML keeps the same candidate selection and ordering", () => {
    const ids = baseline.candidateOrder;
    [rendered.zh, rendered.en, rendered["zh-Hant"]].forEach((html) => {
      const positions = ids.map((id) => html.indexOf('data-discovery-result="'+id+'"'));
      positions.forEach((position) => assert.ok(position >= 0));
      assert.deepEqual(positions.slice().sort((a, b) => a - b), positions);
    });
  });
  check("all 21 new discovery keys are used by the render-only function", () => {
    const source = fs.readFileSync(path.join(core, "globalDiscoveryWorkspace.js"), "utf8");
    const renderSource = source.slice(source.indexOf("function renderGlobalDiscoveryWorkspace"), source.indexOf("function mountGlobalDiscoveryWorkspace"));
    discoveryKeys.forEach((key) => assert.ok(renderSource.includes(key), key+" must be rendered"));
  });
  check("language-specific rendering does not translate presentation DTO data", () => {
    const view = json(workspace.presentGlobalDiscoveryWorkspace(state));
    ["zh", "en", "zh-Hant"].forEach((language) => {
      i18n.setLang(language);
      workspace.renderGlobalDiscoveryWorkspace(state);
      assert.deepEqual(json(workspace.presentGlobalDiscoveryWorkspace(state)), view);
    });
  });
  console.log("GLOBAL_DISCOVERY_LOCALIZATION_INVARIANTS PASS "+cases);
}

main();
