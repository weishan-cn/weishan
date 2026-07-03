const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightClarificationLoop.js"]);
  const api = windowRef.WeishanFlightClarificationLoop;
  assert.equal(api.FLIGHT_CLARIFICATION_LOOP_VERSION, "4.1.0");
  const prompt = api.buildFlightClarificationPrompt({ status:"needs_clarification", route:{ destinationCity:"成都" }, departureDate:"" });
  assert.equal(prompt.status, "needs_answer");
  assert.deepEqual(Array.from(prompt.questions), ["从哪里出发？", "哪一天出发？"]);
  assert.equal(prompt.safety.asksIdentity, false);
  const merged = api.mergeFlightClarificationAnswer(prompt.mergedIntent, { text:"上海，7月15日，直达" });
  assert.equal(merged.status, "complete");
  assert.equal(merged.mergedIntent.status, "ready");
  assert.equal(merged.mergedIntent.routeSummary, "上海 到 成都");
  assert.equal(merged.mergedIntent.departureDate, "2026-07-15");
  assert.equal(merged.safety.asksPayment, false);
  const blocked = api.mergeFlightClarificationAnswer(prompt.mergedIntent, { text:"我的护照和银行卡" });
  assert.equal(blocked.status, "blocked");
  assert.equal(JSON.stringify(blocked).includes("护照"), false);
  const audit = api.buildFlightClarificationLoopAuditDraft(prompt.mergedIntent);
  assert.equal(audit.asksCredential, false);
  console.log("FLIGHT_CLARIFICATION_LOOP PASS");
}
main();
