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
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyHandoffPacketPreview.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformPreflightSafetyGate.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingPlatformPreflightSafetyGate;
  const ready = api.buildGlobalShoppingPlatformPreflightSafetyGate({
    readOnlyHandoffPacketPreviewSummary:{ status:"ready", userFacingSummary:{ resultLabel:"交接包预览已准备", redacted:true }, redacted:true },
    redactedSearchParameterPackSummary:{ status:"ready", redacted:true },
    userConfirmationChecklistSummary:{ status:"ready", redacted:true },
    sandboxDecisionReviewViewModelSummary:{ status:"ready", redacted:true }
  });
  assert.equal(api.GLOBAL_SHOPPING_PLATFORM_PREFLIGHT_SAFETY_GATE_VERSION, "2.2.4");
  assert.equal(ready.status, "clear");
  assert.equal(ready.userFacingSummary.resultLabel, "安全预检未触发阻断");
  assert.equal(ready.preflightBoundary.canOpenExternalNow, false);
  assert.equal(api.buildGlobalShoppingPlatformPreflightSafetyGate({ bookingUrl:"https://blocked.example" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingPlatformPreflightSafetyGate({}).status, "needs_review");
}

main();
