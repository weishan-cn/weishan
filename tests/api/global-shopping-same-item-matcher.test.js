const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingPriceSourceNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingSameItemMatcher.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingSameItemMatcher;
  assert.equal(api.GLOBAL_SHOPPING_SAME_ITEM_MATCHER_VERSION, "4.0.6");
  const matcher = api.buildGlobalShoppingSameItemMatcher();
  assert.equal(matcher.appVersion, "4.0.6");
  assert.equal(matcher.status, "ready");
  assert.equal(matcher.userFacingSummary.title, "同款候选识别");
  assert.ok(matcher.matchedGroups.length >= 1);
  assert.ok(matcher.rows.length >= 1);
  assert.equal(matcher.matchHealth.noRealProvider, true);
  assert.equal(matcher.matchHealth.noNetwork, true);
  assert.equal(matcher.safety.bookingUrl, null);
  const exactFlight = api.evaluateGlobalShoppingSameItemMatch({
    itemType:"flight",
    flightNumber:"MU5101",
    departureDate:"2026-08-08",
    originAirport:"PVG",
    destinationAirport:"NRT",
    cabinClass:"economy",
    baggageRule:"1 checked"
  });
  assert.equal(exactFlight.matchType, "exact");
  assert.equal(exactFlight.matchConfidence, "high");
  const review = api.buildGlobalShoppingSameItemMatcher({ normalizedCandidates:[{ candidateId:"p1", itemType:"product", brand:"Sony" }] });
  assert.equal(review.status, "needs_review");
  const blocked = api.buildGlobalShoppingSameItemMatcher({ bookingUrl:"https://blocked.example" });
  assert.equal(blocked.status, "blocked");
  const serialized = JSON.stringify(api.buildGlobalShoppingSameItemMatcher({ token:"abc", secret:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(/abc|https:\/\/blocked\.example/.test(serialized), false);
  console.log("GLOBAL_SHOPPING_SAME_ITEM_MATCHER PASS");
}

main();
