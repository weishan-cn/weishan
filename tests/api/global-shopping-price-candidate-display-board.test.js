const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingPriceSourceNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingOfficialPriceAnchorSlot.js",
    "apps/desktop/src/renderer/core/globalShoppingSameItemMatcher.js",
    "apps/desktop/src/renderer/core/globalShoppingDuplicateCandidateMerger.js",
    "apps/desktop/src/renderer/core/globalShoppingCoveredLowestCandidateBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingPriceCandidateDisplayBoard.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingPriceCandidateDisplayBoard;
  assert.equal(api.GLOBAL_SHOPPING_PRICE_CANDIDATE_DISPLAY_BOARD_VERSION, "2.1.90");
  const board = api.buildGlobalShoppingPriceCandidateDisplayBoard();
  assert.equal(board.appVersion, "2.1.90");
  assert.equal(board.status, "ready");
  assert.equal(board.title, "全球购价格候选展示");
  assert.equal(board.cards.find((item) => item.cardId === "official_price").label, "官方参考价");
  assert.equal(board.cards.find((item) => item.cardId === "covered_lowest").label, "已覆盖来源中的较低候选价");
  assert.equal(board.cards.find((item) => item.cardId === "display_board").label, "已覆盖来源候选价合并");
  assert.equal(board.sameItemMatcherSummary.userFacingSummary.title, "同款候选识别");
  assert.equal(board.duplicateCandidateMergerSummary.userFacingSummary.title, "重复候选合并");
  assert.equal(board.coveredLowestCandidateBoardSummary.title, "已覆盖来源候选价合并");
  assert.equal(board.cards.find((item) => item.cardId === "price_completeness").label, "税费/运费/服务费状态");
  assert.equal(board.cards.find((item) => item.cardId === "merge_confidence").label, "同款合并置信度");
  assert.ok(board.officialPriceRows.length >= 2);
  assert.ok(board.candidatePriceRows.length >= 2);
  assert.ok(board.comparisonRows.length >= 1);
  assert.ok(board.disclosureRows.length >= 3);
  assert.equal(board.safeToProceedWithDeepLinkSafetyGate, true);
  assert.equal(api.buildGlobalShoppingPriceCandidateDisplayBoard({ officialPriceAnchorSummary:{ officialAnchor:{ hasOfficialPrice:false }, status:"missing_official" }, priceSourceNormalizationSummary:{ status:"ready", normalizedCandidates:[] } }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPriceCandidateDisplayBoard({ copy:"全网最低" }).status, "blocked");
  const serialized = JSON.stringify(api.buildGlobalShoppingPriceCandidateDisplayBoard({ realName:"张三", token:"abc", secret:"abc", bookingUrl:"https://blocked.example", paymentUrl:"https://blocked.example", orderUrl:"https://blocked.example" }));
  assert.equal(/张三|https:\/\/blocked\.example|"(token|secret)":"abc"/.test(serialized), false);
  console.log("GLOBAL_SHOPPING_PRICE_CANDIDATE_DISPLAY_BOARD PASS");
}
main();
