const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function storage(seed) { const data = Object.assign({}, seed || {}); return { getItem:(key) => Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null, setItem:(key, value) => { data[key] = String(value); }, removeItem:(key) => { delete data[key]; }, data }; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowStateMachine.js", "apps/desktop/src/renderer/core/flightWorkflowStateStore.js"]);
  const api = windowRef.WeishanFlightWorkflowStateStore;
  assert.equal(api.FLIGHT_WORKFLOW_STATE_STORE_VERSION, "4.0.7");
  const fake = storage();
  const state = windowRef.WeishanFlightWorkflowStateMachine.createFlightWorkflowState({ intent:{ status:"ready", route:{ originCity:"上海", destinationCity:"成都" }, departureDate:"2026-07-15" }, bookingUrl:"https://blocked.example", token:"abc" });
  const saved = api.saveFlightWorkflowState(state, fake);
  assert.equal(saved.status, "saved");
  assert.equal(saved.state.bookingUrl, null);
  assert.equal(JSON.stringify(saved).includes("abc"), false);
  const loaded = api.loadFlightWorkflowState(fake);
  assert.equal(loaded.status, "loaded");
  assert.equal(loaded.state.rawResponseStored, false);
  const health = api.buildFlightWorkflowStateStorageHealth(fake);
  assert.equal(health.status, "available");
  fake.setItem(api.STORAGE_KEY, "{bad json");
  const corrupted = api.loadFlightWorkflowState(fake);
  assert.equal(corrupted.reason, "corrupted_storage");
  const cleared = api.clearFlightWorkflowState(fake);
  assert.equal(cleared.reason, "cleared");
  const store = api.createFlightWorkflowStateStore(fake);
  assert.equal(store.storageKey, "weishan.flightWorkflowState.v1");
  console.log("FLIGHT_WORKFLOW_STATE_STORE PASS");
}
main();
