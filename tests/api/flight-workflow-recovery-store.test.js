const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function memoryStorage() { const store = new Map(); return { getItem:k => store.has(k) ? store.get(k) : null, setItem:(k,v) => store.set(k, String(v)), removeItem:k => store.delete(k) }; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowContinuityManager.js", "apps/desktop/src/renderer/core/flightWorkflowRecoveryStore.js"]);
  const api = windowRef.WeishanFlightWorkflowRecoveryStore;
  assert.equal(api.FLIGHT_WORKFLOW_RECOVERY_STORE_VERSION, "3.9.0");
  const storage = memoryStorage();
  const saved = api.saveFlightWorkflowRecoveryState({ flightIntentSummary:{ route:{ originCity:"上海", destinationCity:"成都" }, departureDate:"2026-07-15" }, selectedCandidate:{ rank:1, token:"abc", bookingUrl:"https://blocked.example" } }, storage);
  assert.equal(saved.status, "saved");
  assert.equal(saved.state.bookingUrl, null);
  assert.equal(JSON.stringify(saved).includes("abc"), false);
  const loaded = api.loadFlightWorkflowRecoveryState(storage);
  assert.equal(loaded.status, "loaded");
  assert.equal(loaded.state.currentStage, "decision");
  storage.setItem(api.STORAGE_KEY, "{");
  const corrupt = api.loadFlightWorkflowRecoveryState(storage);
  assert.equal(corrupt.reason, "corrupted_storage");
  const cleared = api.clearFlightWorkflowRecoveryState(storage);
  assert.equal(cleared.reason, "cleared");
  console.log("FLIGHT_WORKFLOW_RECOVERY_STORE PASS");
}
main();
