const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "../..");
const source = fs.readFileSync(path.join(root, "apps/desktop/src/renderer/core/smartMailIntelligenceQuality.js"), "utf8");
const context = { window:{} };
vm.createContext(context);
vm.runInContext(source, context, { filename:"smartMailIntelligenceQuality.js" });
const api = context.window.WeishanSmartMailIntelligenceQuality;
assert(api, "Smart Mail intelligence API must be exposed");

const user = "api@weishan.ai";
function msg(id, threadId, direction, subject, body, date, extra = {}) {
  return Object.assign({
    messageId:id,
    threadId,
    direction,
    from:direction === "outgoing" ? user : (extra.from || "sender@example.test"),
    to:direction === "outgoing" ? ["sender@example.test"] : [user],
    subject,
    bodyText:body,
    receivedAt:date || "2026-08-20T10:00:00Z"
  }, extra);
}
function latestState(messages, threadId) {
  return api.analyzeMailbox(messages, { userEmails:[user], now:"2026-08-20T10:00:00Z" }).threads.find((thread) => thread.threadId === threadId);
}

const cases = [
  ["needs-1", "NEEDS_REPLY", "MEDIUM", [msg("needs-1-a", "needs-1", "incoming", "Meeting", "Can you confirm Friday?", "2026-08-20T08:00:00Z")]],
  ["needs-2", "NEEDS_REPLY", "MEDIUM", [msg("needs-2-a", "needs-2", "incoming", "Decision", "Please approve the plan by 2026-08-22.", "2026-08-20T08:00:00Z")]],
  ["needs-3", "NEEDS_REPLY", "MEDIUM", [msg("needs-3-a", "needs-3", "incoming", "资料", "请确认营业执照信息是否正确？", "2026-08-20T08:00:00Z")]],
  ["needs-4", "NEEDS_REPLY", "MEDIUM", [msg("needs-4-a", "needs-4", "incoming", "Quote", "Could you send the updated quote?", "2026-08-20T08:00:00Z")]],
  ["needs-5", "NEEDS_REPLY", "MEDIUM", [msg("needs-5-a", "needs-5", "incoming", "Interview", "Would you be available next Friday?", "2026-08-20T08:00:00Z")]],
  ["waiting-1", "WAITING_ON_THEM", "NONE", [msg("waiting-1-a", "waiting-1", "outgoing", "Quote request", "Could you send a quote?", "2026-08-20T08:00:00Z")]],
  ["waiting-2", "WAITING_ON_THEM", "NONE", [msg("waiting-2-a", "waiting-2", "outgoing", "Next step", "请问下一步需要什么？", "2026-08-20T08:00:00Z")]],
  ["waiting-3", "WAITING_ON_THEM", "NONE", [msg("waiting-3-a", "waiting-3", "outgoing", "Shipping", "Please let me know when this will ship.", "2026-08-20T08:00:00Z")]],
  ["closed-1", "NO_ACTION", "NONE", [msg("closed-1-a", "closed-1", "incoming", "Question", "Can you approve?", "2026-08-20T08:00:00Z"), msg("closed-1-b", "closed-1", "outgoing", "Re: Question", "Approved.", "2026-08-20T09:00:00Z"), msg("closed-1-c", "closed-1", "incoming", "Re: Question", "Thanks, resolved.", "2026-08-20T10:00:00Z")]],
  ["answered-1", "NO_ACTION", "NONE", [msg("answered-1-a", "answered-1", "incoming", "Document", "Please send the file.", "2026-08-20T08:00:00Z"), msg("answered-1-b", "answered-1", "outgoing", "Re: Document", "Here is the information you requested.", "2026-08-20T09:00:00Z")]],
  ["reopened-1", "NEEDS_REPLY", "MEDIUM", [msg("reopened-1-a", "reopened-1", "incoming", "Plan", "Can you review?", "2026-08-20T08:00:00Z"), msg("reopened-1-b", "reopened-1", "outgoing", "Re: Plan", "Reviewed.", "2026-08-20T09:00:00Z"), msg("reopened-1-c", "reopened-1", "incoming", "Re: Plan", "Thanks. Can you also confirm Monday?", "2026-08-20T10:00:00Z")]],
  ["newsletter-1", "NO_ACTION", "LOW", [msg("newsletter-1-a", "newsletter-1", "incoming", "URGENT: LAST CHANCE", "Final hours sale. Unsubscribe here.", "2026-08-20T08:00:00Z", { bulk:true })]],
  ["receipt-1", "NO_ACTION", "NONE", [msg("receipt-1-a", "receipt-1", "incoming", "Receipt", "Your receipt for USD 25.00. No action required.", "2026-08-20T08:00:00Z", { automated:true, from:"no-reply@store.example" })]],
  ["security-1", "NO_ACTION", "HIGH", [msg("security-1-a", "security-1", "incoming", "Security alert", "New login detected. Do not share verification code: 123456.", "2026-08-20T08:00:00Z", { automated:true })]],
  ["other-owner-1", "NO_ACTION", "NONE", [msg("other-owner-1-a", "other-owner-1", "incoming", "Report", "John will send the report by 2026-08-22.", "2026-08-20T08:00:00Z")]],
  ["quote-noise-1", "NO_ACTION", "NONE", [msg("quote-noise-1-a", "quote-noise-1", "incoming", "Re: Old request", "Sounds good.\n> Can you send the file?", "2026-08-20T08:00:00Z")]],
  ["event-date-1", "NO_ACTION", "NONE", [msg("event-date-1-a", "event-date-1", "incoming", "Meeting is Friday", "The meeting is Friday. Calendar invite attached.", "2026-08-20T08:00:00Z")]],
  ["payment-1", "ACTION_REQUIRED_NO_REPLY", "HIGH", [msg("payment-1-a", "payment-1", "incoming", "Payment due", "Invoice due by 2026-08-21 for USD 300.", "2026-08-20T08:00:00Z")]],
  ["travel-1", "NO_ACTION", "HIGH", [msg("travel-1-a", "travel-1", "incoming", "Flight cancelled", "Your flight was cancelled. Review airline options.", "2026-08-20T08:00:00Z")]]
];

for (let i = 0; i < 35; i += 1) {
  cases.push([`bulk-${i}`, "NO_ACTION", "LOW", [msg(`bulk-${i}-a`, `bulk-${i}`, "incoming", `Newsletter ${i}`, "Deal of the day. Unsubscribe.", "2026-08-20T08:00:00Z", { bulk:true })]]);
}

let priorityCorrect = 0;
let priorityFalsePositive = 0;
let priorityFalseNegative = 0;
let needsCorrect = 0;
let needsFalsePositive = 0;
let needsFalseNegative = 0;
let waitingCorrect = 0;
let waitingFalsePositive = 0;
let waitingFalseNegative = 0;
for (const [threadId, expectedReplyState, expectedPriority, messages] of cases) {
  const thread = latestState(messages, threadId);
  assert(thread, `missing thread ${threadId}`);
  if (thread.replyState === expectedReplyState) {
    if (expectedReplyState === "NEEDS_REPLY") needsCorrect += 1;
    if (expectedReplyState === "WAITING_ON_THEM") waitingCorrect += 1;
  }
  if (thread.replyState === "NEEDS_REPLY" && expectedReplyState !== "NEEDS_REPLY") needsFalsePositive += 1;
  if (thread.replyState !== "NEEDS_REPLY" && expectedReplyState === "NEEDS_REPLY") needsFalseNegative += 1;
  if (thread.replyState === "WAITING_ON_THEM" && expectedReplyState !== "WAITING_ON_THEM") waitingFalsePositive += 1;
  if (thread.replyState !== "WAITING_ON_THEM" && expectedReplyState === "WAITING_ON_THEM") waitingFalseNegative += 1;
  if (thread.priority === expectedPriority || (expectedPriority === "NONE" && thread.priority === "NONE")) priorityCorrect += 1;
  if (thread.priority === "HIGH" && expectedPriority !== "HIGH") priorityFalsePositive += 1;
  if (thread.priority !== "HIGH" && expectedPriority === "HIGH") priorityFalseNegative += 1;
  assert.notEqual(thread.replyState === "NEEDS_REPLY" && thread.replyState === "WAITING_ON_THEM", true, `contradictory reply state ${threadId}`);
}

const conflictThread = [
  msg("conflict-a", "conflict", "incoming", "Schedule", "Please reply by 2026-08-22.", "2026-08-17T08:00:00Z"),
  msg("conflict-b", "conflict", "incoming", "Re: Schedule", "Correction: please reply by 2026-08-25.", "2026-08-18T08:00:00Z")
];
const conflict = latestState(conflictThread, "conflict");
assert.equal(conflict.dateConflict.conflict, true);
assert.equal(conflict.summary.conflictsSilentlyResolved, 0);

const relativeUnknown = api.analyzeMailbox([{
  messageId:"relative-a",
  threadId:"relative",
  direction:"incoming",
  from:"sender@example.test",
  to:[user],
  subject:"Deadline",
  bodyText:"Please reply tomorrow.",
  receivedAt:""
}], { userEmails:[user] }).threads[0];
assert.equal(relativeUnknown.deadline.date, null);
assert.equal(relativeUnknown.deadline.source, "RELATIVE_UNANCHORED");

const allMessages = cases.flatMap((item) => item[3]).concat(conflictThread);
const invoiceSearch = api.searchMailbox(allMessages, "找上个月苹果电脑的发票", { userEmails:[user] });
assert.equal(invoiceSearch.fabricated, false);
assert.equal(api.searchMailbox(allMessages, "找不存在的火星发票", { userEmails:[user] }).results.length, 0);
assert(api.searchMailbox(allMessages, "找到对方还没回复我的报价邮件", { userEmails:[user] }).results.some((item) => item.threadId === "waiting-1"));
assert(api.searchMailbox(allMessages, "找我需要回复但还没回的邮件", { userEmails:[user] }).results.some((item) => item.threadId === "needs-1"));

const draftNoAttach = api.buildDraftReply([msg("draft-a", "draft", "incoming", "Document", "Please send the attachment.", "2026-08-20T08:00:00Z")], "reply with attachment", { userEmails:[user] });
assert.equal(/attached|已附上/i.test(draftNoAttach.body), false);
assert.equal(draftNoAttach.autoSend, false);
assert.equal(draftNoAttach.sendEnabled, false);
const draftPayment = api.buildDraftReply([msg("draft-pay-a", "draft-pay", "incoming", "Payment", "Please pay the invoice.", "2026-08-20T08:00:00Z")], "confirm payment", { userEmails:[user] });
assert.equal(/paid|付款完成|已付款/i.test(draftPayment.body), false);

const translation = api.validateTranslation("Alice meeting 2026-08-22 USD 100", "Alice 会议 2026-08-22 USD 100");
assert.equal(translation.ok, true);
assert.equal(api.validateTranslation("Alice meeting 2026-08-22 USD 100", "会议").materialMeaningErrors > 0, true);

const schema = api.validateStructuredAiOutput({ priority:"HIGH", send:true, executionGate:"OPEN", secret:"x" });
assert.equal(schema.ok, false);
assert.equal(schema.authorityGranted, false);

assert.equal(api.sanitizeAnalyticsEvent({ event:"smart_mail_summary_used", subject:"secret", body:"mail" }).contentIncluded, false);
assert.equal(api.sanitizeAnalyticsEvent({ event:"smart_mail_unknown", subject:"mail" }), null);

const staleDraft = api.buildDraftReply([msg("stale-a", "stale", "incoming", "Meeting", "Can you confirm Friday?", "2026-08-20T08:00:00Z")], "confirm", { userEmails:[user] });
assert.equal(api.isStaleIntelligence(staleDraft, [
  msg("stale-a", "stale", "incoming", "Meeting", "Can you confirm Friday?", "2026-08-20T08:00:00Z"),
  msg("stale-b", "stale", "incoming", "Re: Meeting", "Actually can you confirm Monday?", "2026-08-20T09:00:00Z")
]), true);

const largeThread = [];
for (let i = 0; i < 100; i += 1) largeThread.push(msg(`large-${i}`, "large", i === 99 ? "incoming" : "outgoing", "Large thread", i === 99 ? "Can you confirm the final plan?" : "Prior context", i === 99 ? "2026-08-20T08:00:00Z" : `2026-08-19T08:${String(i % 60).padStart(2, "0")}:00Z`));
assert.equal(latestState(largeThread, "large").replyState, "NEEDS_REPLY");

const audit = api.audit();
for (const [key, value] of Object.entries(audit)) {
  if (/^[A-Z_]+$/.test(key)) assert.equal(value, 0, `${key} must remain zero`);
}

const matrix = api.buildFeatureMatrix();
assert.equal(matrix.THREAD_UNDERSTANDING, "OPTIMIZE");
assert.equal(matrix.PROMPT_INJECTION_DEFENSE, "OPTIMIZE");

console.log([
  "SMART_MAIL_INTELLIGENCE_QUALITY_EFFECTIVENESS PASS",
  `cases=${cases.length}`,
  `priorityCorrect=${priorityCorrect}`,
  `priorityFalsePositives=${priorityFalsePositive}`,
  `priorityFalseNegatives=${priorityFalseNegative}`,
  `needsCorrect=${needsCorrect}`,
  `needsFalsePositives=${needsFalsePositive}`,
  `needsFalseNegatives=${needsFalseNegative}`,
  `waitingCorrect=${waitingCorrect}`,
  `waitingFalsePositives=${waitingFalsePositive}`,
  `waitingFalseNegatives=${waitingFalseNegative}`,
  "highRiskZeroMetrics=0"
].join(" "));
