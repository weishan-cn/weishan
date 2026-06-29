const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console, URL }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/readOnlyQuoteRunTimeline.js"]);
  const api = windowRef.WeishanReadOnlyQuoteRunTimeline;
  assert.equal(api.READ_ONLY_QUOTE_RUN_TIMELINE_VERSION, "2.1.98");
  const timeline = api.buildReadOnlyQuoteRunTimeline({ runId:"deterministic-v2.1.98-read-only-sandbox-run", status:"completed" });
  assert.equal(timeline.appVersion, "2.1.98");
  assert.equal(timeline.timelineName, "read_only_quote_run_timeline_v1");
  assert.equal(timeline.rawResponseStored, false);
  assert.equal(timeline.bookingUrl, null);
  assert.equal(timeline.redacted, true);
  assert.equal(timeline.steps.map((step) => step.stepId).join(","), "run_matrix_built,session_created,sandbox_quotes_generated,quotes_normalized,quotes_ranked,session_updated,run_history_sanitized,run_history_persisted,quote_delta_compared,replay_guard_ready,audit_export_ready,selection_ready");
  assert.equal(timeline.summary.includes("Top 3 排序"), true);
  assert.equal(timeline.summary.includes("Read-Only Quote Session"), true);
  assert.equal(timeline.summary.includes("Audit Export"), true);
  const summary = api.summarizeReadOnlyQuoteRunTimeline(timeline);
  assert.equal(summary.status, "completed");
  assert.equal(summary.stepCount, 12);
  const audit = api.buildReadOnlyQuoteRunTimelineAuditDraft(timeline);
  assert.equal(audit.appVersion, "2.1.98");
  assert.equal(audit.redacted, true);
  console.log("READ_ONLY_QUOTE_RUN_TIMELINE PASS");
}
main();
