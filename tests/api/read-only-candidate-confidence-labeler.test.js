const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(file){ const window = {}; window.window = window; vm.runInContext(fs.readFileSync(path.join(ROOT,file), "utf8"), vm.createContext({ window, console }), { filename:file }); return window; }
const api = load("apps/desktop/src/renderer/core/readOnlyCandidateConfidenceLabeler.js").WeishanReadOnlyCandidateConfidenceLabeler;
function label(status, deltaDirection, evidence) {
  return api.buildReadOnlyCandidateConfidenceLabel({ safeProviderHandoffReady:true, reconciliationSummary:{ status }, platformCheckDelta:{ deltaDirection }, manualPlatformCheckEvidence:evidence || { status:"accepted" } });
}
assert.equal(label("matched", "same").appVersion, "4.2.0");
assert.equal(label("matched", "same").confidenceLabel, "高一致");
assert.equal(label("price_changed", "up").confidenceLabel, "有差异");
assert.equal(label("needs_recheck", "up").confidenceLabel, "需重新核对");
assert.equal(label("no_platform_check", "unknown", null).confidenceLabel, "不可确认");
assert.equal(label("blocked", "unknown", { status:"blocked", sensitiveInputBlocked:true }).status, "blocked");
assert.ok(label("matched", "same").reasons.length > 0);
assert.ok(label("matched", "same").warnings.includes("平台最终为准。"));
assert.equal(label("matched", "same").requiresUserConfirmation, true);
assert.equal(label("matched", "same").canPayHere, false);
assert.equal(label("matched", "same").bookingUrl, null);
console.log("READ_ONLY_CANDIDATE_CONFIDENCE_LABELER PASS");
