const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(file) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window.WeishanGlobalShoppingReadOnlyCandidateEvidenceUnifier;
}

function main() {
  const api = load("apps/desktop/src/renderer/core/globalShoppingReadOnlyCandidateEvidenceUnifier.js");
  assert.equal(api.GLOBAL_SHOPPING_READ_ONLY_CANDIDATE_EVIDENCE_UNIFIER_VERSION, "4.2.2");
  const ready = api.buildGlobalShoppingReadOnlyCandidateEvidenceUnifier({
    candidateId:"candidate-1",
    sourceLabel:"只读样本",
    observedPrice:1234,
    normalizedPrice:1260,
    currency:"CNY",
    evidenceTimestampLabel:"2026-07-02 10:00",
    trustLevel:"medium",
    riskNotes:["当前仍为只读候选证据"]
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.candidateEvidence.readOnly, true);
  assert.equal(ready.bookingUrl, null);
  assert.equal(api.buildGlobalShoppingReadOnlyCandidateEvidenceUnifier({ normalizedPrice:200, currency:"CNY" }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingReadOnlyCandidateEvidenceUnifier({ sourceLabel:"只读样本", observedPrice:100, normalizedPrice:120, currency:"CNY", externalUrl:"https://example.com" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlyCandidateEvidenceUnifier({ sourceLabel:"只读样本", observedPrice:100, normalizedPrice:120, currency:"CNY", bookingUrl:"https://example.com/order" }).status, "blocked");
  console.log("GLOBAL_SHOPPING_READ_ONLY_CANDIDATE_EVIDENCE_UNIFIER PASS");
}

main();
