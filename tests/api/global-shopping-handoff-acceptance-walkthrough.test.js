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
  return window;
}

function main() {
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingHandoffAcceptanceWalkthrough.js");
  const api = windowRef.WeishanGlobalShoppingHandoffAcceptanceWalkthrough;
  assert.equal(api.GLOBAL_SHOPPING_HANDOFF_ACCEPTANCE_WALKTHROUGH_VERSION, "4.1.3");
  const ready = api.buildGlobalShoppingHandoffAcceptanceWalkthrough({
    readOnlyHandoffPacketPreviewSummary:{ status:"ready", userFacingSummary:{ resultLabel:"交接包预览已准备", redacted:true }, redacted:true },
    userActionBoundaryReceiptSummary:{ status:"ready", userFacingSummary:{ resultLabel:"边界回执已准备", redacted:true }, redacted:true },
    userConfirmationChecklistSummary:{ status:"ready", userFacingSummary:{ resultLabel:"用户确认清单已准备", redacted:true }, redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "交接包接受演练");
  assert.equal(ready.userFacingSummary.resultLabel, "交接包接受演练已准备");
  assert.equal(ready.walkthroughSteps.some((item) => item.summary === "接受演练不保存用户确认"), true);
  assert.equal(api.buildGlobalShoppingHandoffAcceptanceWalkthrough({ payment:true }).status, "blocked");
}

main();
