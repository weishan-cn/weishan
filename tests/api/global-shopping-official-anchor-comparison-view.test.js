const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(file) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window.WeishanGlobalShoppingOfficialAnchorComparisonView;
}

function main() {
  const api = load("apps/desktop/src/renderer/core/globalShoppingOfficialAnchorComparisonView.js");
  assert.equal(api.GLOBAL_SHOPPING_OFFICIAL_ANCHOR_COMPARISON_VIEW_VERSION, "4.0.4");
  const ready = api.buildGlobalShoppingOfficialAnchorComparisonView({
    officialAnchorLabel:"官方价锚点",
    officialAnchorPrice:1399,
    currency:"CNY",
    comparisonNote:"以平台实时页面为准",
    sourceAndTime:"平台公开页面 / 2026-07-02 10:00"
  });
  assert.equal(ready.status, "ready");
  assert.equal(api.buildGlobalShoppingOfficialAnchorComparisonView({ currency:"CNY" }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingOfficialAnchorComparisonView({ officialAnchorLabel:"官方价锚点", officialAnchorPrice:1399, currency:"CNY", officialAnchorUrl:"https://example.com" }).status, "blocked");
  console.log("GLOBAL_SHOPPING_OFFICIAL_ANCHOR_COMPARISON_VIEW PASS");
}

main();
