const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const api = load(["apps/desktop/src/renderer/core/flightWorkflowSupportFallbackRecommendationEngine.js"]).WeishanFlightWorkflowSupportFallbackRecommendationEngine;
  assert.equal(api.FLIGHT_WORKFLOW_SUPPORT_FALLBACK_RECOMMENDATION_ENGINE_VERSION, "2.1.82");
  const cases = { candidate_unclear:"review_evidence", platform_mismatch:"record_platform_check", safety_copy_unclear:"review_safety_copy", consent_blocked:"retry_consent", feedback_error:"internal_review" };
  for (const [category, rec] of Object.entries(cases)) {
    const result = api.buildFlightWorkflowSupportFallbackRecommendation({ issueIntakeSummary:{ status:"ready", issueCategory:category } });
    assert.equal(result.recommendation.recommendationId, rec);
  }
  const blocked = api.buildFlightWorkflowSupportFallbackRecommendation({ issueIntakeSummary:{ status:"blocked", issueCategory:"other" } });
  assert.ok(["internal_review", "blocked"].includes(blocked.recommendation.recommendationId));
  for (const label of ["付款", "下单", "出票", "上传证件或银行卡", "输入登录凭据"]) assert.ok(blocked.blockedActions.includes(label));
  assert.equal(blocked.bookingUrl, null);
  assert.equal(/token|key|secret/i.test(JSON.stringify(blocked.recommendation)), false);
  console.log("FLIGHT_WORKFLOW_SUPPORT_FALLBACK_RECOMMENDATION_ENGINE PASS");
}
main();
