const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function item(usability="good", clarity="good", understood=true, status="ready") { return { feedbackReviewSummary:{ status, feedbackHealth:{ safetyCopyUnderstood:understood }, ratingSummary:{ usabilityRating:usability, clarityRating:clarity }, redacted:true } }; }
function main() {
  const api = load(["apps/desktop/src/renderer/core/flightWorkflowBetaCohortReviewBoard.js"]).WeishanFlightWorkflowBetaCohortReviewBoard;
  assert.equal(api.FLIGHT_WORKFLOW_BETA_COHORT_REVIEW_BOARD_VERSION, "2.1.88");
  assert.equal(api.buildFlightWorkflowBetaCohortReviewBoard({ sessions:[] }).status, "needs_more_feedback");
  assert.equal(api.buildFlightWorkflowBetaCohortReviewBoard({ sessions:[item(), item()] }).status, "needs_more_feedback");
  const ready = api.buildFlightWorkflowBetaCohortReviewBoard({ sessions:[item(), item(), item("ok", "good", true), item("good", "ok", true)] });
  assert.equal(ready.status, "ready");
  assert.equal(ready.cohortHealth.safeToExpandBeta, true);
  assert.ok(ready.rows.length >= 5);
  assert.ok(ready.findings.some((x) => x.title === "可以扩大只读测试"));
  assert.equal(api.buildFlightWorkflowBetaCohortReviewBoard({ sessions:[item("good", "good", false), item(), item()] }).status, "needs_review");
  assert.equal(api.buildFlightWorkflowBetaCohortReviewBoard({ sessions:[item("bad"), item("bad"), item()] }).status, "needs_review");
  assert.equal(api.buildFlightWorkflowBetaCohortReviewBoard({ sessions:[item("good", "bad"), item("good", "bad"), item()] }).status, "needs_review");
  assert.match(api.buildFlightWorkflowBetaCohortReviewBoard({ sessions:[item(), item(), item("good", "good", true, "blocked")] }).status, /needs_review|blocked/);
  assert.equal(api.buildFlightWorkflowBetaCohortReviewBoard({ rawUserTextStored:true, sessions:[item(), item(), item()] }).status, "blocked");
  assert.equal(api.buildFlightWorkflowBetaCohortReviewBoard({ secretStored:true, sessions:[item(), item(), item()] }).status, "blocked");
  const blockedUrl = api.buildFlightWorkflowBetaCohortReviewBoard({ bookingUrl:"https://blocked.example", sessions:[item(), item(), item()] });
  assert.equal(blockedUrl.status, "blocked");
  const json = JSON.stringify(api.buildFlightWorkflowBetaCohortReviewBoard({ sessions:[item()], token:"abc", secret:"hidden", rawUserText:"raw feedback" }));
  assert.equal(/abc|hidden|raw feedback|https:\/\//.test(json), false);
  assert.equal(ready.bookingUrl, null);
  assert.equal(ready.paymentUrl, null);
  assert.equal(ready.orderUrl, null);
  console.log("FLIGHT_WORKFLOW_BETA_COHORT_REVIEW_BOARD PASS");
}
main();
