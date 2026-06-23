const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowRiskBadgeBuilder.js"]);
  const api = windowRef.WeishanFlightWorkflowRiskBadgeBuilder;
  assert.equal(api.FLIGHT_WORKFLOW_RISK_BADGE_BUILDER_VERSION, "2.1.73");
  const model = api.buildFlightWorkflowRiskBadges({ auditReview:{ auditHealth:{ overall:"warning", hasBlockedActions:true, hasConfirmationRequiredActions:true, hasSensitiveInputBlocked:true } }, safeSessionExportPreview:{ status:"ready" }, feedbackReviewSummary:{ status:"ready" }, acceptanceSessionSummary:{ status:"completed" }, betaCohortSummary:{ status:"ready", cohortHealth:{ safeToExpandBeta:true } }, feedbackTrendSummary:{ status:"ready", recommendation:{ recommendationId:"expand_read_only_beta" }, trends:{ overallTrend:"positive" } }, betaExpansionGateSummary:{ status:"approved", decision:{ safeToExpandReadOnlyBeta:true } }, publicPilotChecklistSummary:{ status:"ready", readiness:{ safeForSmallPublicPilot:true }, checklistName:"flight_workflow_read_only_public_pilot_checklist_v1" }, pilotReadinessSummary:{ status:"ready", viewModelName:"flight_workflow_pilot_readiness_view_model_v1" } });
  assert.equal(model.builderName, "flight_workflow_risk_badge_builder_v1");
  const labels = model.badges.map((item) => item.label);
  assert.ok(labels.includes("只读安全"));
  assert.ok(labels.includes("需要二次确认"));
  assert.ok(labels.includes("交易动作已阻断"));
  assert.ok(labels.includes("敏感输入已阻断"));
  assert.ok(labels.includes("可预览脱敏摘要"));
  assert.ok(labels.includes("不可导出"));
  assert.ok(labels.includes("测试反馈可用"));
  assert.ok(labels.includes("验收会话完成"));
  assert.ok(labels.includes("Beta 反馈可扩大测试"));
  assert.ok(labels.includes("可以小范围扩大只读测试"));
  assert.ok(labels.includes("试点检查清单通过"));
  assert.ok(labels.includes("公开试点仍为只读"));
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
