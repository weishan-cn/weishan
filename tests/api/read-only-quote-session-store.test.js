const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function storage(seed) { const map = new Map(Object.entries(seed || {})); return { getItem:k => map.has(k) ? map.get(k) : null, setItem:(k,v) => map.set(k, v), removeItem:k => map.delete(k) }; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/readOnlyQuoteSessionManager.js", "apps/desktop/src/renderer/core/readOnlyQuoteSessionStore.js"]);
  const manager = windowRef.WeishanReadOnlyQuoteSessionManager;
  const api = windowRef.WeishanReadOnlyQuoteSessionStore;
  assert.equal(api.READ_ONLY_QUOTE_SESSION_STORE_VERSION, "2.2.0");
  const mem = storage();
  const session = manager.updateReadOnlyQuoteSession(manager.createReadOnlyQuoteSession({ route:"上海 → 成都" }), { type:"DRY_RUN_COMPLETED", result:{ runId:"r1", dryRunTopCandidates:[{ quoteId:"q1", providerName:"A" }], bookingUrl:"https://blocked.example", token:"abc" } });
  const saved = api.saveReadOnlyQuoteSession(session, mem);
  assert.equal(saved.storageKey, "weishan.readOnlyQuoteSession.v1");
  assert.equal(saved.sessionSummary.bookingUrl, null);
  const loaded = api.loadReadOnlyQuoteSession(mem);
  assert.equal(loaded.available, true);
  assert.equal(loaded.sessionSummary.sessionId, "deterministic-read-only-quote-session-v2.2.0");
  assert.equal(JSON.stringify(loaded).includes("abc"), false);
  assert.equal(JSON.stringify(loaded).includes("token"), false);
  assert.equal(loaded.sessionSummary.rawResponseStored, false);
  assert.equal(loaded.sessionSummary.secretStored, false);
  const cleared = api.clearReadOnlyQuoteSession(mem);
  assert.equal(cleared.available, false);
  const corrupted = storage({ "weishan.readOnlyQuoteSession.v1":"{nope" });
  assert.equal(api.loadReadOnlyQuoteSession(corrupted).reason, "corrupted");
  const mismatch = storage({ "weishan.readOnlyQuoteSession.v1":JSON.stringify({ storeName:"wrong", schemaVersion:"x", sessionSummary:{} }) });
  assert.equal(api.loadReadOnlyQuoteSession(mismatch).reason, "schema mismatch");
  const unsafe = api.sanitizeReadOnlyQuoteSessionForStorage({ sessionId:"x", token:"abc", key:"k", secret:"s", password:"p", session:"bad", auth:"a", bookingUrl:"b", checkoutUrl:"c", paymentUrl:"p", orderUrl:"o", rawResponse:{ a:1 } });
  const serial = JSON.stringify(unsafe);
  assert.equal(serial.includes("abc"), false);
  assert.equal(serial.includes('"bookingUrl":"b"'), false);
  assert.equal(unsafe.sessionSummary.bookingUrl, null);
  assert.equal(unsafe.sessionSummary.checkoutUrl, null);
  assert.equal(unsafe.sessionSummary.paymentUrl, null);
  assert.equal(unsafe.sessionSummary.orderUrl, null);
  assert.equal(unsafe.rawResponseStored, false);
  assert.equal(unsafe.secretStored, false);
  console.log("READ_ONLY_QUOTE_SESSION_STORE PASS");
}
main();
