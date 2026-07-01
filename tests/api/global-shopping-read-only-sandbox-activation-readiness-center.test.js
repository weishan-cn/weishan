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
  return { status:"ready", userFacingSummary:{ resultLabel, redacted:true }, redacted:true };
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySandboxActivationReadinessCenter.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingReadOnlySandboxActivationReadinessCenter;
  assert.equal(api.GLOBAL_SHOPPING_READ_ONLY_SANDBOX_ACTIVATION_READINESS_CENTER_VERSION, "2.6.0");

  const ready = api.buildGlobalShoppingReadOnlySandboxActivationReadinessCenter({
    manualGovernanceReleaseDecisionRoomSummary:readySummary("人工发布决策室已准备"),
    sandboxPilotExceptionRegisterSummary:readySummary("例外登记簿已准备"),
    providerReadinessSignOffPacketSummary:readySummary("准备签核包已准备"),
    providerManualReleaseViewModelSummary:{ status:"ready", title:"Provider 人工发布决策与签核", redacted:true },
    releaseFreezeGateSummary:readySummary("Release Freeze Gate 已准备"),
    humanPilotReadinessLedgerSummary:readySummary("Human Pilot 准备台账已准备"),
    governanceAuditConsoleSummary:readySummary("Provider Governance 审计控制台已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.activationGates.length, 7);
  assert.equal(ready.activationSummary.manualActivationStillRequired, true);

  const needsReview = api.buildGlobalShoppingReadOnlySandboxActivationReadinessCenter({
    manualGovernanceReleaseDecisionRoomSummary:readySummary("人工发布决策室已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingReadOnlySandboxActivationReadinessCenter({
    manualGovernanceReleaseDecisionRoomSummary:readySummary("人工发布决策室已准备"),
    sandboxPilotExceptionRegisterSummary:readySummary("例外登记簿已准备"),
    providerReadinessSignOffPacketSummary:readySummary("准备签核包已准备"),
    providerManualReleaseViewModelSummary:{ status:"ready", title:"Provider 人工发布决策与签核", redacted:true },
    releaseFreezeGateSummary:readySummary("Release Freeze Gate 已准备"),
    humanPilotReadinessLedgerSummary:readySummary("Human Pilot 准备台账已准备"),
    governanceAuditConsoleSummary:readySummary("Provider Governance 审计控制台已准备"),
    readApiKey:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingReadOnlySandboxActivationReadinessCenterAuditDraft({ secret:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_READ_ONLY_SANDBOX_ACTIVATION_READINESS_CENTER PASS");
}

main();
