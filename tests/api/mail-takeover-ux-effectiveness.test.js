#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const CORE_FILE = "apps/desktop/src/renderer/core/mailTakeoverUserIntelligence.js";
const MAIL_PAGE_FILE = "apps/desktop/src/renderer/routes/MailPage.js";

function loadCore() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL, Date, Intl, performance });
  vm.runInContext(fs.readFileSync(path.join(ROOT, CORE_FILE), "utf8"), context, { filename:CORE_FILE });
  return window.WeishanMailTakeoverUserIntelligence;
}

function msg(id, overrides = {}) {
  return Object.assign({
    messageId:id,
    threadId:id,
    from:"Sender <sender@example.test>",
    to:["me@example.test"],
    subject:"Update",
    bodyText:"FYI.",
    receivedAt:"2026-08-25T08:00:00.000Z",
    unread:true
  }, overrides);
}

const api = loadCore();

const busyMorning = [
  msg("reply-needed", { from:"Client <client@example.test>", subject:"Can you approve the draft?", bodyText:"Could you approve the final draft by 2026-08-26?", threadId:"thread-reply" }),
  msg("flight-cancelled", { from:"Airline <notify@air.example>", subject:"Your flight tomorrow has been cancelled", bodyText:"Your flight MU567 booking ABCD12 has been cancelled tomorrow.", threadId:"trip-abcd12" }),
  msg("invoice-due", { from:"Billing <billing@example.test>", subject:"Invoice INV-7788 due", bodyText:"Invoice INV-7788 amount USD 80 is due by 2026-08-26.", threadId:"bill-7788" }),
  msg("waiting-them-a", { from:"Partner <partner@example.test>", subject:"Proposal review", bodyText:"Can you review this?", receivedAt:"2026-08-24T08:00:00.000Z", threadId:"waiting-them" }),
  msg("waiting-them-b", { from:"Me <me@example.test>", subject:"Re: Proposal review", bodyText:"Reviewed. Please confirm the final version.", direction:"outgoing", receivedAt:"2026-08-25T09:00:00.000Z", threadId:"waiting-them" })
];
for (let i = 0; i < 35; i += 1) {
  busyMorning.push(msg(`newsletter-${i}`, {
    from:`Newsletter ${i} <news${i}@marketing.example>`,
    subject:i % 2 ? "Last chance sale" : "URGENT SALE today",
    bodyText:"Newsletter promotion webinar unsubscribe.",
    bulk:true,
    threadId:`newsletter-${i}`
  }));
}

const view = api.buildZeroLearningViewModel(busyMorning, {
  now:"2026-08-25T08:00:00.000Z",
  userEmails:["me@example.test"]
});

assert.equal(view.firstScreen.mode, "TODAY_FIRST");
assert.equal(view.firstScreen.rawInboxAvailable, true);
assert.equal(view.firstScreen.noMailboxMutation, true);
assert.equal(view.firstScreen.rawInboxItemsUserWouldScan, 40);
assert.equal(view.firstScreen.primaryItemsUserMustScan <= 6, true);
assert.equal(view.firstScreen.scanReduction >= 34, true);
assert.equal(view.firstScreen.lowPriorityHiddenCount >= 35, true);
assert.equal(view.firstScreen.needsAttention.some((item) => item.messageId === "flight-cancelled" && /Travel|changed|Urgent/i.test(`${item.label} ${item.why}`)), true);
assert.equal(view.firstScreen.needsAttention.some((item) => item.messageId === "reply-needed" && /reply|question|direct/i.test(`${item.label} ${item.why}`)), true);
assert.equal(view.firstScreen.waiting.some((item) => item.threadId === "waiting-them"), true);
assert.equal(view.removeIt.todayOverviewMaterialEffect, true);
assert.equal(view.removeIt.noiseReductionMaterialEffect, true);
assert.equal(view.userLanguage.noInternalEnums, true);
assert.equal(view.userLanguage.noAiScore, true);
assert.equal(JSON.stringify(view).includes("NEEDS_REPLY"), false);
assert.equal(JSON.stringify(view).includes("importanceScore"), false);
assert.equal(view.externalEffects.EMAILS_SENT, 0);
assert.equal(view.externalEffects.MAIL_DELETED, 0);
assert.equal(view.externalEffects.MAIL_ARCHIVED, 0);
assert.equal(view.externalEffects.MAIL_LABELS_CHANGED, 0);

const matrix = api.buildFeatureMatrix();
assert.equal(matrix.find((item) => item.feature === "IMPORTANCE").decision, "MERGE");
assert.equal(matrix.find((item) => item.feature === "URGENT").decision, "MERGE");
assert.equal(matrix.find((item) => item.feature === "RAW_INBOX").decision, "KEEP");
assert.equal(matrix.find((item) => item.feature === "TODAY_OVERVIEW").decision, "OPTIMIZE");

const mailPage = fs.readFileSync(path.join(ROOT, MAIL_PAGE_FILE), "utf8");
assert.match(mailPage, /let activeWorkspaceTab = "today"/);
assert.doesNotMatch(mailPage, /\["memory",\s*"mailWorkspaceMemory"/);
assert.match(mailPage, /mail-takeover-reason/);
assert.match(mailPage, /buildZeroLearningViewModel/);

console.log("MAIL_TAKEOVER_UX_EFFECTIVENESS PASS");
