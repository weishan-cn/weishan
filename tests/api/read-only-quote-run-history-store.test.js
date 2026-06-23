const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function storage() { const map = new Map(); return { getItem:k => map.has(k) ? map.get(k) : null, setItem:(k,v) => map.set(k, v), removeItem:k => map.delete(k) }; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/readOnlyQuoteRunHistoryStore.js"]);
  const api = windowRef.WeishanReadOnlyQuoteRunHistoryStore;
  assert.equal(api.READ_ONLY_QUOTE_RUN_HISTORY_STORE_VERSION, "2.1.69");
  const mem = storage();
  const saved = api.appendReadOnlyQuoteRunHistory({ runId:"r1", status:"completed", topCandidates:[{ quoteId:"q1", providerName:"A", bookingUrl:"https://blocked.example" }] }, mem);
  assert.equal(saved.history.length, 1);
  assert.equal(saved.sessionEventPayload.eventType, "HISTORY_APPENDED");
  assert.equal(saved.sessionEventPayload.bookingUrl, null);
  const loaded = api.loadReadOnlyQuoteRunHistory(mem);
  assert.equal(loaded.totalRunCount, 1);
  assert.equal(loaded.history[0].topCandidates[0].bookingUrl, null);
  console.log("READ_ONLY_QUOTE_RUN_HISTORY_STORE PASS");
}
main();
