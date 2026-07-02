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
    "apps/desktop/src/renderer/core/globalShoppingManualGovernanceReleaseDecisionRoom.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingManualGovernanceReleaseDecisionRoom;
  assert.equal(api.GLOBAL_SHOPPING_MANUAL_GOVERNANCE_RELEASE_DECISION_ROOM_VERSION, "4.0.2");

  const ready = api.buildGlobalShoppingManualGovernanceReleaseDecisionRoom({
    governanceAuditConsoleSummary:{ status:"ready", userFacingSummary:{ resultLabel:"治理审计控制台已准备", redacted:true }, redacted:true },
    humanPilotReadinessLedgerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Human Pilot 准备台账已准备", redacted:true }, redacted:true },
    releaseFreezeGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Release Freeze Gate 已准备", redacted:true }, redacted:true },
    governanceReleaseViewModelSummary:{ status:"ready", title:"Provider Governance 发布审计与冻结闸门", redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Manual Governance Release 决策室");
  assert.equal(ready.decisionSummary.readyForExceptionRegister, true);
  assert.equal(ready.rows.some((item) => item.value.includes("不保存决策，不创建 release，不创建 tag，不 push。")), true);

  const needsReview = api.buildGlobalShoppingManualGovernanceReleaseDecisionRoom({
    governanceAuditConsoleSummary:{ status:"ready", userFacingSummary:{ resultLabel:"治理审计控制台已准备", redacted:true }, redacted:true }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingManualGovernanceReleaseDecisionRoom({
    governanceAuditConsoleSummary:{ status:"ready", userFacingSummary:{ resultLabel:"治理审计控制台已准备", redacted:true }, redacted:true },
    humanPilotReadinessLedgerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Human Pilot 准备台账已准备", redacted:true }, redacted:true },
    releaseFreezeGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Release Freeze Gate 已准备", redacted:true }, redacted:true },
    governanceReleaseViewModelSummary:{ status:"ready", title:"Provider Governance 发布审计与冻结闸门", redacted:true },
    push:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingManualGovernanceReleaseDecisionRoomAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_MANUAL_GOVERNANCE_RELEASE_DECISION_ROOM PASS");
}

main();
