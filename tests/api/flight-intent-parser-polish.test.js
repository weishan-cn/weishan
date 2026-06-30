const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function assertClean(api, input, expected) {
  const parsed = api.parseFlightIntent(input);
  assert.equal(parsed.origin, expected.origin || "上海");
  assert.equal(parsed.destination, expected.destination || "成都");
  if (expected.departureDate) assert.equal(parsed.departureDate, expected.departureDate);
  if ("directOnly" in expected) assert.equal(parsed.directOnly, expected.directOnly);
  if (expected.sortPreference) assert.equal(parsed.sortPreference, expected.sortPreference);
  assert.doesNotMatch(parsed.destination, /直达|直飞|最便宜|最低价|低价|价格最低/);
  assert.notEqual(parsed.origin, "上海到");
  assert.equal(parsed.cityParseClean, true);
  assert.equal(parsed.audit.eventType, "FLIGHT_INTENT_PARSER_POLISH_DRAFT");
  assert.equal(parsed.audit.redacted, true);
  assert.equal(api.assertFlightIntentParserPolishSafe(parsed), true);
  return parsed;
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightIntentParser.js"]);
  const api = windowRef.WeishanFlightIntentParser;
  assert.equal(api.FLIGHT_INTENT_PARSER_VERSION, "2.3.9");

  assertClean(api, "购买7月15日上海到成都最便宜的直达机票", { departureDate:"7月15日", directOnly:true, sortPreference:"low_price" });
  assertClean(api, "帮我买7月15日上海到成都直飞机票", { departureDate:"7月15日", directOnly:true });
  assertClean(api, "上海到成都最低价机票", { directOnly:false, sortPreference:"low_price" });
  assertClean(api, "上海到成都不要中转", { directOnly:true });

  const audit = api.buildFlightIntentParserPolishAuditDraft({ origin:"上海", destination:"成都", directOnly:true, sortPreference:"low_price", removedDestinationModifiers:["直达"] });
  assert.equal(audit.eventType, "FLIGHT_INTENT_PARSER_POLISH_DRAFT");
  assert.equal(audit.redacted, true);

  console.log("FLIGHT_INTENT_PARSER_POLISH_CORE PASS");
}

main();
