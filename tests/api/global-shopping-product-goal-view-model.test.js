const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingProductGoalCharter.js",
    "apps/desktop/src/renderer/core/globalShoppingJumpToPlatformBoundary.js",
    "apps/desktop/src/renderer/core/globalShoppingPriceSourceNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingOfficialPriceAnchorSlot.js",
    "apps/desktop/src/renderer/core/globalShoppingPriceCandidateDisplayBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingProductGoalViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProductGoalViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PRODUCT_GOAL_VIEW_MODEL_VERSION, "4.1.5");
  const model = api.buildGlobalShoppingProductGoalViewModel();
  assert.equal(model.appVersion, "4.1.5");
  assert.equal(model.title, "全球购产品目标与跳转边界");
  assert.equal(model.cards.find((item) => item.cardId === "trusted_price").label, "可信候选价格");
  assert.equal(model.cards.find((item) => item.cardId === "official_anchor").label, "官方价格锚点");
  assert.equal(model.cards.find((item) => item.cardId === "covered_platforms").label, "合法平台候选价");
  assert.equal(model.cards.find((item) => item.cardId === "jump_boundary").label, "平台自行下单");
  assert.ok(model.productGoalRows.length >= 8);
  assert.ok(model.jumpBoundaryRows.length >= 8);
  assert.ok(model.forbiddenCopyRows.some((item) => item.label === "禁止最低价相关承诺"));
  assert.ok(model.forbiddenCopyRows.some((item) => item.label === "禁止自动下单承诺"));
  assert.ok(model.recommendedCopyRows.some((item) => item.label === "价格以跳转后平台实时页面为准"));
  assert.ok(model.caveat.includes("Weishan 不处理付款、下单或出票"));
  const serialized = JSON.stringify(api.buildGlobalShoppingProductGoalViewModel({ realName:"张三", phone:"13800000000", email:"a@example.test", token:"abc", apiKey:"abc", secret:"abc", bookingUrl:"https://blocked.example", paymentUrl:"https://blocked.example", orderUrl:"https://blocked.example" }));
  assert.equal(/张三|13800000000|a@example\.test/.test(serialized), false);
  assert.equal(/"token":"abc"|"apiKey":"abc"|"secret":"abc"/.test(serialized), false);
  assert.equal(/https:\/\/blocked\.example/.test(serialized), false);
  assert.equal(/"bookingUrl":"https?:|"paymentUrl":"https?:|"orderUrl":"https?:/.test(serialized), false);
  console.log("GLOBAL_SHOPPING_PRODUCT_GOAL_VIEW_MODEL PASS");
}
main();
