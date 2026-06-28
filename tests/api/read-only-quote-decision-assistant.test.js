const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function serial(value) { return JSON.stringify(value); }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/readOnlyQuoteDecisionAssistant.js"]);
  const api = windowRef.WeishanReadOnlyQuoteDecisionAssistant;
  assert.equal(api.READ_ONLY_QUOTE_DECISION_ASSISTANT_VERSION, "2.1.89");
  const empty = api.buildReadOnlyQuoteDecisionAssistant({ topCandidates:[] });
  assert.equal(empty.status, "empty");
  const malformed = api.buildReadOnlyQuoteDecisionAssistant(null);
  assert.equal(malformed.status, "failed_safe");
  const model = api.buildReadOnlyQuoteDecisionAssistant({ workflowStateSummary:{ status:"evidence_ready" }, clarificationSummary:{ status:"complete" }, continuitySummary:{ status:"resumable", currentStage:"decision", stageLabel:"选择候选", resumePlan:{ nextStepLabel:"确认前往平台", canResume:true } }, confirmationStateSummary:{ labels:["已选择候选"] }, recoverySummary:{ status:"resumable" }, resumeCoachSummary:{ allowedActions:[{ actionId:"provider_handoff", label:"前往平台确认" }] }, currentStage:"decision", workflowStageLabel:"选择候选", nextStepLabel:"确认前往平台", canResumeWorkflow:true, resumeActions:[{ actionId:"provider_handoff", label:"前往平台确认" }], workflowStepList:[{ label:"生成候选证据", status:"completed" }], missingFields:[], clarificationQuestions:[], workflowUserMessage:"候选证据已生成，平台最终为准。", topCandidates:[
    { quoteId:"q1", rank:1, providerName:"A", providerMode:"sandbox_read_only", responseShape:"shape_a", fareSource:"sandbox_read_only_import", currency:"CNY", baseFare:780, taxesAndFees:130, providerFees:20, totalPrice:930, freshnessMinutes:8, safeProviderHandoffReady:false, token:"abc", bookingUrl:"https://blocked.example" },
    { quoteId:"q2", rank:2, providerName:"B", totalPrice:950, baseFare:800, taxesAndFees:120, providerFees:30, freshnessMinutes:4, safeProviderHandoffReady:true },
    { quoteId:"q3", rank:3, providerName:"C", totalPrice:990, baseFare:830, taxesAndFees:120, providerFees:40, freshnessMinutes:12, safeProviderHandoffReady:false }
  ] });
  assert.equal(model.appVersion, "2.1.89");
  assert.equal(model.status, "ready");
  assert.equal(model.recommendedCandidate.rank, 1);
  assert.equal(model.recommendationType, "candidate_evidence_only");
  assert.equal(model.workflowStateSummary.status, "evidence_ready");
  assert.equal(model.clarificationSummary.status, "complete");
  assert.equal(model.workflowStepList[0].label, "生成候选证据");
  assert.equal(model.workflowUserMessage, "候选证据已生成，平台最终为准。");
  assert.equal(model.continuitySummary.status, "resumable");
  assert.equal(model.confirmationStateSummary.labels[0], "已选择候选");
  assert.equal(model.currentStage, "decision");
  assert.equal(model.nextStepLabel, "确认前往平台");
  assert.equal(model.canResumeWorkflow, true);
  assert.equal(model.resumeActions[0].label, "前往平台确认");
  assert.equal(model.comparison.canClaimLowestAcrossWeb, false);
  assert.equal(model.comparison.canClaimFinalBookablePrice, false);
  assert.equal(model.actions.canPayHere, false);
  assert.equal(model.actions.canOrderHere, false);
  assert.equal(model.safety.bookingUrl, null);
  assert.equal(model.safety.rawResponseStored, false);
  assert.equal(model.safety.secretStored, false);
  assert.ok(model.reasoning.riskWarnings.join(" ").includes("仍需平台确认"));
  assert.ok(model.reasoning.riskWarnings.join(" ").includes("平台最终为准"));
  assert.ok(model.reasoning.riskWarnings.join(" ").includes("未锁价"));
  assert.ok(model.reasoning.riskWarnings.join(" ").includes("不代表可出票"));
  assert.equal(/全网最低|最低价保证|已锁价|真实最终价/.test(serial(model)), false);
  assert.equal(serial(model).includes("abc"), false);
  assert.equal(serial(model).includes("https://blocked.example"), false);
  const decision = api.evaluateReadOnlyQuoteCandidateDecision([{ rank:1, totalPrice:100 }]);
  assert.equal(decision.recommendationType, "candidate_evidence_only");
  const audit = api.buildReadOnlyQuoteDecisionAssistantAuditDraft({ topCandidates:[{ rank:1, totalPrice:100 }] });
  assert.equal(audit.bookingUrl, null);
  console.log("READ_ONLY_QUOTE_DECISION_ASSISTANT PASS");
}
main();
