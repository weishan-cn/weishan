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
    "apps/desktop/src/renderer/core/globalShoppingOfficialPriceAnchorSlot.js",
    "apps/desktop/src/renderer/core/globalShoppingSameItemMatcher.js",
    "apps/desktop/src/renderer/core/globalShoppingDuplicateCandidateMerger.js",
    "apps/desktop/src/renderer/core/globalShoppingCoveredLowestCandidateBoard.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingCoveredLowestCandidateBoard;
  assert.equal(api.GLOBAL_SHOPPING_COVERED_LOWEST_CANDIDATE_BOARD_VERSION, "4.0.6");
  const board = api.buildGlobalShoppingCoveredLowestCandidateBoard();
  assert.equal(board.appVersion, "4.0.6");
  assert.equal(board.status, "ready");
  assert.equal(board.title, "已覆盖来源候选价合并");
  assert.equal(board.cards.find((item) => item.cardId === "official_price").label, "官方参考价");
  assert.equal(board.cards.find((item) => item.cardId === "covered_lowest").label, "已覆盖来源中的较低候选价");
  assert.ok(board.mergedCandidateRows.length >= 1);
  assert.ok(board.priceRangeRows.length >= 1);
  assert.ok(board.coverageRows.length >= 1);
  assert.ok(board.disclosureRows.length >= 3);
  assert.equal(board.safety.bookingUrl, null);
  const review = api.buildGlobalShoppingCoveredLowestCandidateBoard({
    duplicateCandidateMergerSummary:{ status:"needs_review", mergedCandidates:[] },
    officialPriceAnchorSummary:{ officialAnchor:{ hasOfficialPrice:false } }
  });
  assert.equal(review.status, "needs_review");
  const blocked = api.buildGlobalShoppingCoveredLowestCandidateBoard({ bookingUrl:"https://blocked.example" });
  assert.equal(blocked.status, "blocked");
  const serialized = JSON.stringify(api.buildGlobalShoppingCoveredLowestCandidateBoard({ secret:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(/abc|https:\/\/blocked\.example/.test(serialized), false);
  console.log("GLOBAL_SHOPPING_COVERED_LOWEST_CANDIDATE_BOARD PASS");
}

main();
