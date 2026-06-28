const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/userConfirmationStatePanel.js"]);
  const api = windowRef.WeishanUserConfirmationStatePanel;
  assert.equal(api.USER_CONFIRMATION_STATE_PANEL_VERSION, "2.1.95");
  const panel = api.buildUserConfirmationStatePanel({ selectedCandidate:{ rank:1 }, handoffChecklistSummary:{ status:"accepted" }, handoffReceiptSummary:{ status:"confirmed", userConfirmed:true }, manualPlatformCheckSummary:{ status:"recorded" } });
  assert.equal(panel.status, "ready");
  assert.equal(panel.confirmations.candidateSelected, true);
  assert.equal(panel.confirmations.safetyChecklistAccepted, true);
  assert.equal(panel.confirmations.platformCheckRecorded, true);
  assert.ok(panel.labels.includes("已选择候选"));
  assert.ok(panel.labels.includes("已确认安全提示"));
  assert.ok(panel.labels.includes("已记录平台核对结果"));
  assert.equal(panel.safety.canPayHere, false);
  const empty = api.buildUserConfirmationStatePanel({});
  assert.equal(empty.nextRequiredConfirmation.confirmationType, "select_candidate");
  const audit = api.buildUserConfirmationStateAuditDraft(panel);
  assert.equal(audit.canOrderHere, false);
  console.log("USER_CONFIRMATION_STATE_PANEL PASS");
}
main();
