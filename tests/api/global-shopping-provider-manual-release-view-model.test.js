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
    "apps/desktop/src/renderer/core/globalShoppingProviderManualReleaseViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderManualReleaseViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_MANUAL_RELEASE_VIEW_MODEL_VERSION, "4.0.1");

  const ready = api.buildGlobalShoppingProviderManualReleaseViewModel({
    manualGovernanceReleaseDecisionRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"人工发布决策室已准备", redacted:true }, rows:[{ rowId:"decision", label:"人工发布决策", value:"人工发布决策室已准备", status:"pass", redacted:true }], redacted:true },
    sandboxPilotExceptionRegisterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"例外登记簿已准备", redacted:true }, rows:[{ rowId:"exception", label:"例外登记", value:"例外登记簿已准备", status:"pass", redacted:true }], redacted:true },
    providerReadinessSignOffPacketSummary:{ status:"ready", userFacingSummary:{ resultLabel:"准备签核包已准备", redacted:true }, rows:[{ rowId:"signoff", label:"准备签核", value:"准备签核包已准备", status:"pass", redacted:true }], redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider 人工发布决策与签核");
  assert.equal(ready.cards.length, 4);
  assert.equal(ready.disclosureRows.some((item) => item.value.includes("Manual provider sign-off 仍需人工复核")), true);

  const needsReview = api.buildGlobalShoppingProviderManualReleaseViewModel({
    manualGovernanceReleaseDecisionRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"人工发布决策室已准备", redacted:true }, redacted:true }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderManualReleaseViewModel({
    manualGovernanceReleaseDecisionRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"人工发布决策室已准备", redacted:true }, redacted:true },
    sandboxPilotExceptionRegisterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"例外登记簿已准备", redacted:true }, redacted:true },
    providerReadinessSignOffPacketSummary:{ status:"ready", userFacingSummary:{ resultLabel:"准备签核包已准备", redacted:true }, redacted:true },
    openExternal:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingProviderManualReleaseViewModelAuditDraft({ secret:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_MANUAL_RELEASE_VIEW_MODEL PASS");
}

main();
