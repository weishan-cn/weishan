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

function readySummary(resultLabel) {
  return { status:"ready", userFacingSummary:{ resultLabel, redacted:true }, rows:[{ rowId:"ready", label:"状态", value:resultLabel, status:"pass", redacted:true }], redacted:true };
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingProviderSandboxActivationViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderSandboxActivationViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_SANDBOX_ACTIVATION_VIEW_MODEL_VERSION, "4.1.4");

  const ready = api.buildGlobalShoppingProviderSandboxActivationViewModel({
    readOnlySandboxActivationReadinessCenterSummary:readySummary("Sandbox 激活准备中心已准备"),
    offlineMockSandboxSessionRunnerSummary:readySummary("离线 Mock 会话运行器已准备"),
    manualProviderActivationHandoffPacketSummary:readySummary("人工 Provider 激活交接包已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider Sandbox 激活准备与离线演练");
  assert.equal(ready.cards.length, 4);
  assert.equal(ready.disclosureRows.some((item) => item.value.includes("Manual sandbox activation 仍需人工复核")), true);

  const needsReview = api.buildGlobalShoppingProviderSandboxActivationViewModel({
    readOnlySandboxActivationReadinessCenterSummary:readySummary("Sandbox 激活准备中心已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderSandboxActivationViewModel({
    readOnlySandboxActivationReadinessCenterSummary:readySummary("Sandbox 激活准备中心已准备"),
    offlineMockSandboxSessionRunnerSummary:readySummary("离线 Mock 会话运行器已准备"),
    manualProviderActivationHandoffPacketSummary:readySummary("人工 Provider 激活交接包已准备"),
    openExternal:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingProviderSandboxActivationViewModelAuditDraft({ secret:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_SANDBOX_ACTIVATION_VIEW_MODEL PASS");
}

main();
