const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/readOnlyQuoteReplayGuard.js"]);
  const api = windowRef.WeishanReadOnlyQuoteReplayGuard;
  assert.equal(api.READ_ONLY_QUOTE_REPLAY_GUARD_VERSION, "3.2.0");
  const replay = api.replayLastReadOnlyQuoteRun({ history:[{ runId:"r1", topCandidates:[{ quoteId:"q1", providerName:"A" }] }] });
  assert.equal(replay.status, "available");
  assert.equal(replay.sessionEventPayload.eventType, "REPLAY_COMPLETED");
  assert.equal(replay.replaySource, "local_redacted_run_history");
  assert.equal(replay.bookingUrl, null);
  const failed = api.replayLastReadOnlyQuoteRun({ corrupted:true, history:[] });
  assert.equal(failed.status, "failed_safe");
  console.log("READ_ONLY_QUOTE_REPLAY_GUARD PASS");
}
main();
