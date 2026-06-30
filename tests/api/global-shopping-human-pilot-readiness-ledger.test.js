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
    "apps/desktop/src/renderer/core/globalShoppingHumanPilotReadinessLedger.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingHumanPilotReadinessLedger;
  assert.equal(api.GLOBAL_SHOPPING_HUMAN_PILOT_READINESS_LEDGER_VERSION, "2.3.9");

  const ready = api.buildGlobalShoppingHumanPilotReadinessLedger({
    governanceAuditConsoleSummary:{ status:"ready", userFacingSummary:{ resultLabel:"治理审计控制台已准备", redacted:true }, redacted:true },
    humanControlledPilotPlannerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Pilot 计划器已准备", redacted:true }, redacted:true },
    launchReadinessBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"启动准备总闸门已准备", redacted:true }, redacted:true },
    legalApprovalWorkflowSummary:{ status:"ready", userFacingSummary:{ resultLabel:"法务审批流程板已准备", redacted:true }, redacted:true },
    complianceEvidencePackSummary:{ status:"ready", userFacingSummary:{ resultLabel:"合规证据包已准备", redacted:true }, redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "Human Pilot 准备台账已准备");
  assert.equal(ready.rows.some((item) => item.value.includes("台账不持久化、不保存审批结果、不创建审批任务、不发邮件。")), true);

  const needsReview = api.buildGlobalShoppingHumanPilotReadinessLedger({
    governanceAuditConsoleSummary:{ status:"ready", userFacingSummary:{ resultLabel:"治理审计控制台已准备", redacted:true }, redacted:true }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingHumanPilotReadinessLedger({
    governanceAuditConsoleSummary:{ status:"ready", userFacingSummary:{ resultLabel:"治理审计控制台已准备", redacted:true }, redacted:true },
    readApiKey:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingHumanPilotReadinessLedgerAuditDraft({ secret:"abc", orderUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_HUMAN_PILOT_READINESS_LEDGER PASS");
}

main();
