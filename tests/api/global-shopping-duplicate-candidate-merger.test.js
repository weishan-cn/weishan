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
    "apps/desktop/src/renderer/core/globalShoppingSameItemMatcher.js",
    "apps/desktop/src/renderer/core/globalShoppingDuplicateCandidateMerger.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingDuplicateCandidateMerger;
  assert.equal(api.GLOBAL_SHOPPING_DUPLICATE_CANDIDATE_MERGER_VERSION, "3.2.0");
  const merger = api.buildGlobalShoppingDuplicateCandidateMerger();
  assert.equal(merger.appVersion, "3.2.0");
  assert.equal(merger.status, "merged");
  assert.equal(merger.userFacingSummary.title, "重复候选合并");
  assert.ok(merger.mergedCandidates.length >= 1);
  assert.equal(merger.mergedCandidates[0].officialCandidateId.length > 0, true);
  assert.equal(merger.mergeHealth.hasCoveredLowestCandidate, true);
  assert.equal(merger.safety.bookingUrl, null);
  const review = api.buildGlobalShoppingDuplicateCandidateMerger({
    sameItemMatcherSummary:{
      matchedGroups:[{
        groupId:"g1",
        canonicalItemId:"product:review",
        itemType:"product",
        matchType:"manual_review",
        matchConfidence:"needs_review",
        candidates:[{ candidateId:"p1", sourceType:"official", normalizedTotal:1000, currency:"CNY", title:"A" }],
        officialCandidateId:"p1",
        sourceCandidateIds:["p1"],
        matchWarnings:["missing_product_key_fields"]
      }]
    }
  });
  assert.equal(review.status, "needs_review");
  const blocked = api.buildGlobalShoppingDuplicateCandidateMerger({ payment:true });
  assert.equal(blocked.status, "blocked");
  const serialized = JSON.stringify(api.buildGlobalShoppingDuplicateCandidateMerger({ token:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(/abc|https:\/\/blocked\.example/.test(serialized), false);
  console.log("GLOBAL_SHOPPING_DUPLICATE_CANDIDATE_MERGER PASS");
}

main();
