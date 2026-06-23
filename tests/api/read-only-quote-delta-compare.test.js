const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/readOnlyQuoteDeltaCompare.js"]);
  const api = windowRef.WeishanReadOnlyQuoteDeltaCompare;
  assert.equal(api.READ_ONLY_QUOTE_DELTA_COMPARE_VERSION, "2.1.72");
  const delta = api.compareReadOnlyQuoteRuns({ runId:"r1", topCandidates:[{ quoteId:"q1", providerName:"A", totalPrice:1000 }] }, { runId:"r2", topCandidates:[{ quoteId:"q1", providerName:"A", totalPrice:930 }] });
  assert.equal(delta.status, "compared");
  assert.equal(delta.claim, "仅比较本地只读沙盒运行结果");
  assert.equal(delta.sessionEventPayload.eventType, "DELTA_COMPARED");
  assert.equal(delta.bookingUrl, null);
  const summary = api.buildReadOnlyQuoteDeltaSummary(delta);
  assert.equal(summary.canClaimFinalBookablePrice, false);
  console.log("READ_ONLY_QUOTE_DELTA_COMPARE PASS");
}
main();
