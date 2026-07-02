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

function readySummary(title, resultLabel) {
  return {
    status:"ready",
    title,
    userFacingSummary:{ title, resultLabel, redacted:true },
    bookingUrl:null,
    checkoutUrl:null,
    paymentUrl:null,
    orderUrl:null,
    payment:false,
    order:false,
    ticketing:false,
    autoOpen:false,
    autoRefresh:false,
    fileWrite:false,
    download:false,
    redacted:true
  };
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingUserFacingSafetyReceipt.js"]);
  const api = windowRef.WeishanGlobalShoppingUserFacingSafetyReceipt;
  assert.equal(api.GLOBAL_SHOPPING_USER_FACING_SAFETY_RECEIPT_VERSION, "4.0.3");
  const ready = api.buildGlobalShoppingUserFacingSafetyReceipt({
    providerDistributionFreezeConsoleSummary:readySummary("Provider Distribution Freeze Console", "Provider Distribution Freeze Console 已准备"),
    finalUserTrustSummarySummary:readySummary("Final User Trust Summary", "Final User Trust Summary 已准备"),
    providerSafetyDistributionMatrixSummary:readySummary("Provider Safety Distribution Matrix", "Provider Safety Distribution Matrix 已准备"),
    providerDistributionReadinessViewModelSummary:readySummary("Provider Distribution Readiness Review", "Provider Distribution Readiness Review 已准备")
  });
  assert.equal(ready.receiptName, "global_shopping_user_facing_safety_receipt_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "User-Facing Safety Receipt");
  assert.equal(ready.receiptSummary.readyForOfflineReleaseCandidateClosurePack, true);
  assert.equal(ready.rows.some((row) => row.value === "Safety Receipt 不生成真实回执文件。"), true);
  assert.equal(api.buildGlobalShoppingUserFacingSafetyReceipt({}).status, "needs_review");
  const blocked = api.buildGlobalShoppingUserFacingSafetyReceipt({
    providerDistributionFreezeConsoleSummary:readySummary("Provider Distribution Freeze Console", "Provider Distribution Freeze Console 已准备"),
    finalUserTrustSummarySummary:readySummary("Final User Trust Summary", "Final User Trust Summary 已准备"),
    providerSafetyDistributionMatrixSummary:readySummary("Provider Safety Distribution Matrix", "Provider Safety Distribution Matrix 已准备"),
    providerDistributionReadinessViewModelSummary:readySummary("Provider Distribution Readiness Review", "Provider Distribution Readiness Review 已准备"),
    generateRealReceiptFile:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blockedReasons.includes("real_receipt_file_detected"), true);
  console.log("GLOBAL_SHOPPING_USER_FACING_SAFETY_RECEIPT PASS");
}

main();
