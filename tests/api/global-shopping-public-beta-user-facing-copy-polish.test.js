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

function readySummary(title, resultLabel) {
  return {
    status:"ready",
    title,
    userFacingSummary:{ title, resultLabel, redacted:true },
    rows:[{ rowId:title.toLowerCase().replace(/[^a-z0-9]+/g, "_"), label:title, value:resultLabel, status:"pass", redacted:true }],
    externalUrl:null,
    platformUrl:null,
    providerUrl:null,
    bookingUrl:null,
    checkoutUrl:null,
    paymentUrl:null,
    orderUrl:null,
    payment:false,
    order:false,
    ticketing:false,
    buyButtonEnabled:false,
    checkoutButtonEnabled:false,
    paymentButtonEnabled:false,
    redacted:true
  };
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaUserFacingCopyPolish.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaUserFacingCopyPolish;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_USER_FACING_COPY_POLISH_VERSION, "4.1.5");
  const ready = api.buildGlobalShoppingPublicBetaUserFacingCopyPolish({
    globalShoppingReadOnlyPublicBetaShellSummary:readySummary("Global Shopping Read-Only Public Beta Shell", "Global Shopping Read-Only Public Beta Shell 已准备"),
    publicBetaSafetyCopyCenterSummary:readySummary("Public Beta Safety Copy Center", "Public Beta Safety Copy Center 已准备"),
    userTrustLaunchBoardSummary:readySummary("User Trust Launch Board", "User Trust Launch Board 已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.appVersion, "4.1.5");
  assert.equal(ready.userFacingSummary.title, "全球购 Public Beta");
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.platformUrl, null);
  assert.equal(ready.providerUrl, null);
  assert.equal(ready.bookingUrl, null);
  assert.equal(ready.payment, false);
  assert.equal(ready.order, false);
  assert.equal(ready.buyButtonEnabled, false);
  assert.equal(ready.checkoutButtonEnabled, false);
  assert.equal(ready.paymentButtonEnabled, false);
  assert.equal(ready.rows.some((item) => item.label === "只读候选价" && item.value === "当前已覆盖来源中的较低候选价"), true);
  assert.equal(ready.rows.some((item) => item.label === "费用归一化" && item.value === "费用归一化"), true);
  assert.equal(api.buildGlobalShoppingPublicBetaUserFacingCopyPolish({
    globalShoppingReadOnlyPublicBetaShellSummary:readySummary("Global Shopping Read-Only Public Beta Shell", "Global Shopping Read-Only Public Beta Shell 已准备")
  }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPublicBetaUserFacingCopyPolish({
    globalShoppingReadOnlyPublicBetaShellSummary:readySummary("Global Shopping Read-Only Public Beta Shell", "Global Shopping Read-Only Public Beta Shell 已准备"),
    publicBetaSafetyCopyCenterSummary:readySummary("Public Beta Safety Copy Center", "Public Beta Safety Copy Center 已准备"),
    userTrustLaunchBoardSummary:readySummary("User Trust Launch Board", "User Trust Launch Board 已准备"),
    copyCandidates:["立即购买"]
  }).status, "blocked");
  assert.equal(api.buildGlobalShoppingPublicBetaUserFacingCopyPolish({
    globalShoppingReadOnlyPublicBetaShellSummary:readySummary("Global Shopping Read-Only Public Beta Shell", "Global Shopping Read-Only Public Beta Shell 已准备"),
    publicBetaSafetyCopyCenterSummary:readySummary("Public Beta Safety Copy Center", "Public Beta Safety Copy Center 已准备"),
    userTrustLaunchBoardSummary:readySummary("User Trust Launch Board", "User Trust Launch Board 已准备"),
    persistRawUserText:true
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_USER_FACING_COPY_POLISH PASS");
}

main();
