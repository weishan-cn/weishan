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
    "apps/desktop/src/renderer/core/globalShoppingLegalApprovalWorkflowBoard.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingLegalApprovalWorkflowBoard;
  assert.equal(api.GLOBAL_SHOPPING_LEGAL_APPROVAL_WORKFLOW_BOARD_VERSION, "2.3.4");
  const allStages = [
    "法务审查", "安全审查", "隐私审查", "凭证隔离审查", "Provider 合同审查",
    "数据保留审查", "反爬/平台政策审查", "只读范围审查", "禁止自动下单/支付代理审查", "最终人工 release gate"
  ].map((label, index) => ({ stageId:"s" + index, label, status:"pass", summary:label + " 已准备", redacted:true }));
  const ready = api.buildGlobalShoppingLegalApprovalWorkflowBoard({ approvalStages:allStages });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "法务审批流程板");
  const needsReview = api.buildGlobalShoppingLegalApprovalWorkflowBoard({ approvalStages:allStages.slice(0, 9) });
  assert.equal(needsReview.status, "needs_review");
  const blocked = api.buildGlobalShoppingLegalApprovalWorkflowBoard({ approvalStages:allStages, sendEmail:true });
  assert.equal(blocked.status, "blocked");
  const audit = api.buildGlobalShoppingLegalApprovalWorkflowBoardAuditDraft({ key:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_LEGAL_APPROVAL_WORKFLOW_BOARD PASS");
}

main();
