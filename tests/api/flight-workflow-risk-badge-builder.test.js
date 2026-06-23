const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowRiskBadgeBuilder.js"]);
  const api = windowRef.WeishanFlightWorkflowRiskBadgeBuilder;
  assert.equal(api.FLIGHT_WORKFLOW_RISK_BADGE_BUILDER_VERSION, "2.1.70");
  const model = api.buildFlightWorkflowRiskBadges({ auditReview:{ auditHealth:{ overall:"warning", hasBlockedActions:true, hasConfirmationRequiredActions:true, hasSensitiveInputBlocked:true } }, safeSessionExportPreview:{ status:"ready" } });
  assert.equal(model.builderName, "flight_workflow_risk_badge_builder_v1");
  const labels = model.badges.map((item) => item.label);
  assert.ok(labels.includes("只读安全"));
  assert.ok(labels.includes("需要二次确认"));
  assert.ok(labels.includes("交易动作已阻断"));
  assert.ok(labels.includes("敏感输入已阻断"));
  assert.ok(labels.includes("可预览脱敏摘要"));
  assert.ok(labels.includes("不可导出"));
  const summary = api.summarizeFlightWorkflowRiskBadges(model.badges);
  assert.equal(summary.summaryLabel.includes("只读安全"), true);
  assert.equal(summary.bookingUrl, null);
  const audit = api.buildFlightWorkflowRiskBadgeBuilderAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" });
  const safeJson = JSON.stringify(audit);
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  assert.equal(safeJson.includes("bookingUrl\":null"), true);
  console.log("FLIGHT_WORKFLOW_RISK_BADGE_BUILDER PASS");
}
main();
