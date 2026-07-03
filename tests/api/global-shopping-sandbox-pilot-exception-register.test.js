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
    "apps/desktop/src/renderer/core/globalShoppingSandboxPilotExceptionRegister.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingSandboxPilotExceptionRegister;
  assert.equal(api.GLOBAL_SHOPPING_SANDBOX_PILOT_EXCEPTION_REGISTER_VERSION, "4.1.7");

  const ready = api.buildGlobalShoppingSandboxPilotExceptionRegister({
    manualDecisionRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"人工发布决策室已准备", redacted:true }, redacted:true },
    productionBlockerMatrixSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Production 阻断矩阵已准备", redacted:true }, redacted:true },
    releaseFreezeGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Release Freeze Gate 已准备", redacted:true }, redacted:true },
    humanPilotLedgerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Human Pilot 准备台账已准备", redacted:true }, redacted:true },
    killSwitchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Kill Switch 演练已准备", redacted:true }, redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Sandbox Pilot 例外登记簿");
  assert.equal(ready.exceptionSummary.readyForReadinessSignOffPacket, true);
  assert.equal(ready.rows.some((item) => item.value.includes("不持久化例外，不创建审批任务，不发邮件。")), true);

  const needsReview = api.buildGlobalShoppingSandboxPilotExceptionRegister({
    manualDecisionRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"人工发布决策室已准备", redacted:true }, redacted:true }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingSandboxPilotExceptionRegister({
    manualDecisionRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"人工发布决策室已准备", redacted:true }, redacted:true },
    productionBlockerMatrixSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Production 阻断矩阵已准备", redacted:true }, redacted:true },
    releaseFreezeGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Release Freeze Gate 已准备", redacted:true }, redacted:true },
    humanPilotLedgerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Human Pilot 准备台账已准备", redacted:true }, redacted:true },
    killSwitchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Kill Switch 演练已准备", redacted:true }, redacted:true },
    createApprovalTask:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingSandboxPilotExceptionRegisterAuditDraft({ secret:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_SANDBOX_PILOT_EXCEPTION_REGISTER PASS");
}

main();
