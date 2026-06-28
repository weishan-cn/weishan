const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function memory(){ const m = new Map(); return { getItem:k=>m.has(k)?m.get(k):null, setItem:(k,v)=>m.set(k,v), removeItem:k=>m.delete(k) }; }
function load(file){ const window = {}; window.window = window; vm.runInContext(fs.readFileSync(path.join(ROOT,file), "utf8"), vm.createContext({ window, console, URL }), { filename:file }); return window; }
const api = load("apps/desktop/src/renderer/core/providerHandoffReceiptStore.js").WeishanProviderHandoffReceiptStore;
const store = memory();
const saved = api.saveProviderHandoffReceipt({ status:"confirmed", providerName:"Trip", safeProviderHandoffUrl:"https://trip.example/path?token=abc", selectedCandidate:{ quoteId:"q1", rank:1, totalPrice:100, currency:"CNY" }, userConfirmed:true }, store);
assert.equal(saved.appVersion, "2.1.96");
assert.equal(saved.safety.rawUrlStored, false);
assert.equal(saved.safety.secretStored, false);
assert.equal(saved.safety.bookingUrl, null);
assert.equal(saved.safety.payment, false);
assert.equal(saved.safety.order, false);
assert.equal(saved.safety.identityUpload, false);
assert.equal(JSON.stringify(saved).includes("token=abc"), false);
assert.equal(api.loadProviderHandoffReceipt(store).receiptName, "provider_handoff_receipt_v1");
api.clearProviderHandoffReceipt(store);
assert.equal(api.loadProviderHandoffReceipt(store), null);
store.setItem(api.STORAGE_KEY, "not json");
assert.equal(api.loadProviderHandoffReceipt(store), null);
store.setItem(api.STORAGE_KEY, JSON.stringify({ receiptName:"wrong", appVersion:"2.1.96" }));
assert.equal(api.loadProviderHandoffReceipt(store), null);
console.log("PROVIDER_HANDOFF_RECEIPT_STORE PASS");
