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
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySourceTrustScore.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingReadOnlySourceTrustScore;
  assert.equal(api.GLOBAL_SHOPPING_READ_ONLY_SOURCE_TRUST_SCORE_VERSION, "2.2.8");

  const ready = api.buildGlobalShoppingReadOnlySourceTrustScore({
    sources:[
      { sourceId:"official_1", sourceName:"Official Fixture", sourceType:"official", basePrice:900, currency:"CNY", lastCheckedAt:"redacted_now", redacted:true },
      { sourceId:"partner_1", sourceName:"Partner Fixture", sourceType:"partner", basePrice:899, currency:"CNY", lastCheckedAt:"redacted_now", redacted:true }
    ]
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "只读来源可信度评分");
  assert.equal(ready.trustScores[0].sourceType, "official");
  assert.equal(ready.trustHealth.doesNotTreatLowestPriceAsBest, true);

  const review = api.buildGlobalShoppingReadOnlySourceTrustScore({});
  assert.equal(review.status, "needs_review");

  const blocked = api.buildGlobalShoppingReadOnlySourceTrustScore({
    claimsOfficialEndorsement:true,
    sources:[{ sourceId:"official_1", sourceName:"Official Fixture", sourceType:"official", basePrice:900, currency:"CNY", lastCheckedAt:"redacted_now", redacted:true }]
  });
  assert.equal(blocked.status, "blocked");
  assert.ok(blocked.blockedReasons.includes("official_endorsement_claim_detected"));

  const safeJson = JSON.stringify(ready);
  assert.equal(/https?:\/\/|"(token|secret|key)":"[^"]+"/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_READ_ONLY_SOURCE_TRUST_SCORE PASS");
}

main();
