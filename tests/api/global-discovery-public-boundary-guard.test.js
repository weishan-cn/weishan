const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const windowRef = {};
windowRef.window = windowRef;
const context = vm.createContext({ window:windowRef });
["globalDiscoveryErrorContract.js", "globalDiscoveryInputGuard.js", "globalDiscoveryEngine.js", "globalDiscoveryWorkspace.js"].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, "apps/desktop/src/renderer/core", file), "utf8"), context));

const api = windowRef.WeishanGlobalDiscoveryWorkspace;

function blockedWorkspace(input) {
  const result = api.createGlobalDiscoveryWorkspaceState(input);
  assert.equal(result.error.code, "NORMALIZATION_REJECTED");
  assert.equal(Object.prototype.hasOwnProperty.call(result.error, "stack"), false);
}

function blockedRedirect(candidate) {
  const result = api.createRedirectIntent(candidate, api.createGlobalDiscoveryWorkspaceState());
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { status:"REJECTED", code:"NORMALIZATION_REJECTED", allowed:false, requiresUserConfirmation:true });
}

function blockedDedup(candidate) {
  const result = api.deduplicateGlobalDiscoveryCandidates("product", [candidate], "JP");
  assert.equal(Array.isArray(result), true);
  assert.equal(result.length, 0);
  assert.equal(Object.isFrozen(result), true);
}

function getterObject(key) {
  const value = {};
  Object.defineProperty(value, key, { get() { throw new Error("getter must not run"); } });
  return value;
}

function setterObject(key) {
  const value = {};
  Object.defineProperty(value, key, { set() {} });
  return value;
}

function pollutedObject(key) {
  const value = {};
  Object.defineProperty(value, key, { value:"blocked", enumerable:true });
  return value;
}

function circularObject() {
  const value = {};
  value.self = value;
  return value;
}

function main() {
  blockedWorkspace(getterObject("businessType"));
  blockedWorkspace(getterObject("fixtures"));
  blockedWorkspace(setterObject("query"));
  blockedWorkspace(circularObject());
  blockedWorkspace(pollutedObject("__proto__"));
  blockedWorkspace({ callback() {} });
  const symbolWorkspace = {};
  symbolWorkspace[Symbol("unsafe")] = true;
  blockedWorkspace(symbolWorkspace);
  const defaultState = api.createGlobalDiscoveryWorkspaceState();
  assert.equal(defaultState.businessType, "product");
  assert.equal(defaultState.query, "Sony Headphones Demo");
  const unsupported = api.runGlobalDiscoveryWorkspace(api.createGlobalDiscoveryWorkspaceState({ businessType:"car" }));
  assert.equal(unsupported.error.code, "UNSUPPORTED_BUSINESS_TYPE");

  blockedRedirect(getterObject("redirectUrl"));
  blockedRedirect(setterObject("redirectUrl"));
  blockedRedirect(circularObject());
  blockedRedirect(pollutedObject("constructor"));
  blockedRedirect({ redirectUrl:{ toString() { throw new Error("toString must not run"); } } });
  blockedRedirect({ redirectUrl:{ valueOf() { throw new Error("valueOf must not run"); } } });
  blockedRedirect({ callback() {} });
  const symbolRedirect = {};
  symbolRedirect[Symbol("unsafe")] = true;
  blockedRedirect(symbolRedirect);
  const successful = api.runGlobalDiscoveryWorkspace(defaultState);
  const redirect = api.createRedirectIntent(successful.normalizedCandidates[0], successful);
  assert.equal(redirect.status, "CREATED");
  assert.equal(api.updateRedirectIntent(redirect, "CANCEL").status, "CANCELLED");
  assert.equal(api.createRedirectIntent({ candidateId:"bad", redirectUrl:"javascript:blocked" }, successful).code, "REDIRECT_REJECTED");

  blockedDedup(circularObject());
  blockedDedup(getterObject("title"));
  blockedDedup({ toJSON() { throw new Error("toJSON must not run"); } });
  blockedDedup(pollutedObject("prototype"));
  blockedDedup({ callback() {} });
  const symbolCandidate = {};
  symbolCandidate[Symbol("unsafe")] = true;
  blockedDedup(symbolCandidate);
  const first = { title:"Same", variant:"A", provider:"First" };
  const duplicate = { title:"Same", variant:"A", provider:"Second" };
  const later = { title:"Later", variant:"A", provider:"Third" };
  const original = JSON.stringify([first, duplicate, later]);
  const deduplicated = api.deduplicateGlobalDiscoveryCandidates("product", [first, duplicate, later], "JP");
  assert.equal(JSON.stringify([first, duplicate, later]), original);
  assert.equal(deduplicated.length, 2);
  assert.equal(deduplicated[0].candidate.provider, "First");
  assert.equal(deduplicated[0].offers.length, 2);
  assert.equal(deduplicated[1].candidate.provider, "Third");
  deduplicated[0].candidate.provider = "Mutated";
  assert.equal(api.deduplicateGlobalDiscoveryCandidates("product", [first, duplicate, later], "JP")[0].candidate.provider, "First");
  console.log("GLOBAL_DISCOVERY_PUBLIC_BOUNDARY_GUARD PASS");
}

main();
