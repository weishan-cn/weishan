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
    "apps/desktop/src/renderer/core/globalShoppingProviderGovernanceReleaseViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderGovernanceReleaseViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_RELEASE_VIEW_MODEL_VERSION, "4.2.4");

  const ready = api.buildGlobalShoppingProviderGovernanceReleaseViewModel({
    governanceAuditConsoleSummary:{ status:"ready", userFacingSummary:{ resultLabel:"治理审计控制台已准备", redacted:true }, rows:[{ rowId:"audit", label:"治理审计", value:"治理审计控制台已准备", status:"pass", redacted:true }], redacted:true },
    humanPilotReadinessLedgerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Human Pilot 准备台账已准备", redacted:true }, rows:[{ rowId:"ledger", label:"Human Pilot", value:"Human Pilot 准备台账已准备", status:"pass", redacted:true }], redacted:true },
    releaseFreezeGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Release Freeze Gate 已准备", redacted:true }, rows:[{ rowId:"freeze", label:"Release Freeze", value:"Release Freeze Gate 已准备", status:"pass", redacted:true }], redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider Governance 发布审计与冻结闸门");
  assert.equal(ready.cards.length, 4);
  assert.equal(ready.disclosureRows.some((item) => item.value.includes("Manual governance release decision 仍需人工确认")), true);

  const needsReview = api.buildGlobalShoppingProviderGovernanceReleaseViewModel({
    governanceAuditConsoleSummary:{ status:"ready", userFacingSummary:{ resultLabel:"治理审计控制台已准备", redacted:true }, redacted:true }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderGovernanceReleaseViewModel({
    governanceAuditConsoleSummary:{ status:"ready", userFacingSummary:{ resultLabel:"治理审计控制台已准备", redacted:true }, redacted:true },
    humanPilotReadinessLedgerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Human Pilot 准备台账已准备", redacted:true }, redacted:true },
    releaseFreezeGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Release Freeze Gate 已准备", redacted:true }, redacted:true },
    openExternal:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingProviderGovernanceReleaseViewModelAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_RELEASE_VIEW_MODEL PASS");
}

main();
