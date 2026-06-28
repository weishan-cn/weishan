const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightIntentNormalizer.js"]);
  const api = windowRef.WeishanFlightIntentNormalizer;
  assert.equal(api.FLIGHT_INTENT_NORMALIZER_VERSION, "2.1.95");
  const ready = api.normalizeFlightIntent({ rawText:"帮我查7月15日上海到成都最便宜的直达机票" });
  assert.equal(ready.normalizerName, "flight_intent_normalizer_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.route.originCity, "上海");
  assert.equal(ready.route.destinationCity, "成都");
  assert.equal(ready.departureDate, "2026-07-15");
  assert.equal(ready.sortIntent, "lowest_price");
  assert.equal(ready.directOnly, true);
  assert.equal(ready.safety.dryRunAllowed, true);
  assert.equal(ready.safety.networkAllowed, false);
  assert.equal(ready.bookingUrl, null);
  const incomplete = api.normalizeFlightIntent({ rawText:"帮我查7月15日机票" });
  assert.equal(incomplete.status, "needs_clarification");
  assert.ok(incomplete.missingFields.includes("origin"));
  assert.ok(incomplete.missingFields.includes("destination"));
  assert.equal(incomplete.safety.dryRunAllowed, false);
  const blocked = api.normalizeFlightIntent({ rawText:"帮我买枪" });
  assert.equal(blocked.status, "blocked");
  const nonFlight = api.normalizeFlightIntent({ rawText:"帮我买一台电脑" });
  assert.equal(nonFlight.status, "not_flight");
  const audit = api.buildFlightIntentNormalizerAuditDraft({ rawText:"上海到成都7月15日最便宜直达" });
  assert.equal(audit.networkAllowed, false);
  assert.equal(audit.rawTextStored, false);
  assert.equal(/bookingUrl.*https/i.test(JSON.stringify(ready)), false);
  console.log("FLIGHT_INTENT_NORMALIZER_CORE PASS");
}
main();
