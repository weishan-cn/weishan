const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/readOnlyQuoteCandidateComparisonExplainer.js"]);
  const api = windowRef.WeishanReadOnlyQuoteCandidateComparisonExplainer;
  assert.equal(api.READ_ONLY_QUOTE_CANDIDATE_COMPARISON_EXPLAINER_VERSION, "4.1.5");
  const empty = api.buildReadOnlyQuoteCandidateComparison([]);
  assert.equal(empty.status, "empty");
  const failed = api.buildReadOnlyQuoteCandidateComparison(null);
  assert.equal(failed.status, "failed_safe");
  const comparison = api.buildReadOnlyQuoteCandidateComparison([
    { rank:1, providerName:"A", totalPrice:930, baseFare:780, taxesAndFees:130, providerFees:20, freshnessMinutes:8, safeProviderHandoffReady:true, bookingUrl:"https://blocked.example" },
    { rank:2, providerName:"B", totalPrice:950, baseFare:800, taxesAndFees:120, providerFees:30, safeProviderHandoffReady:false },
    { rank:3, providerName:"C", totalPrice:990, baseFare:830, taxesAndFees:120, providerFees:40, safeProviderHandoffReady:false }
  ]);
  assert.equal(comparison.appVersion, "4.1.5");
  assert.equal(comparison.table.length, 3);
  assert.ok(comparison.table[0].pros.length > 0);
  assert.ok(comparison.table[1].cautions.length > 0);
  assert.equal(comparison.summary.lowestInLocalSampleRank, 1);
  assert.equal(comparison.table[0].handoffStatus, "ready");
  assert.equal(comparison.table[1].handoffStatus, "disabled");
  assert.equal(comparison.forbiddenClaims.lowestAcrossWeb, false);
  assert.equal(comparison.forbiddenClaims.finalBookablePrice, false);
  assert.equal(comparison.forbiddenClaims.priceLocked, false);
  assert.equal(comparison.forbiddenClaims.ticketAvailable, false);
  assert.equal(comparison.bookingUrl, null);
  assert.equal(comparison.redacted, true);
  const serial = JSON.stringify(comparison);
  assert.equal(/全网最低|最低价保证|已锁价|真实最终价/.test(serial), false);
  assert.equal(serial.includes("https://blocked.example"), false);
  const audit = api.buildReadOnlyQuoteCandidateComparisonAuditDraft({ candidates:comparison.table });
  assert.equal(audit.candidateCount, 3);
  assert.equal(audit.secretStored, false);
  console.log("READ_ONLY_QUOTE_CANDIDATE_COMPARISON_EXPLAINER PASS");
}
main();
