#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const FILES = [
  "apps/desktop/src/renderer/core/emailOpsNormalizer.js",
  "apps/desktop/src/renderer/core/emailOpsClassifier.js",
  "apps/desktop/src/renderer/core/emailOpsActionPolicy.js",
  "apps/desktop/src/renderer/core/emailOpsBugTriage.js",
  "apps/desktop/src/renderer/core/emailOpsControlPlane.js",
  "apps/desktop/src/renderer/core/emailOpsRealMailboxAdapter.js"
];

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL });
  FILES.forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }));
  return window;
}

function raw(id, overrides = {}) {
  return Object.assign({
    id,
    threadId:`thread-${id}`,
    from:"Beta User <user@example.test>",
    to:["support@weishan.ai"],
    subject:"Question",
    text:"How do I use Weishan?",
    receivedAt:"2026-08-25T03:00:00.000Z",
    attachments:[]
  }, overrides);
}

const w = load();
const adapter = w.WeishanEmailOpsRealMailboxAdapter;

assert.equal(adapter.VERSION, "4.2.8");
assert.equal(adapter.MODULE_NAME, "email_ops_real_mailbox_adapter_v1");

{
  const config = adapter.buildCanonicalAddressConfig();
  assert.equal(config.PUBLIC_SUPPORT_ADDRESS, "support@weishan.ai");
  assert.equal(config.PROVIDER_OPERATIONS_ADDRESS, "api@weishan.ai");
  assert.equal(config.EXTRA_PUBLIC_FEEDBACK_ADDRESS_CREATED, false);
  assert.equal(config.INITIAL_BETA_AUTO_ACK, "OFF");
  assert.equal(config.EMAIL_SEND_ENABLED, false);
}

{
  assert.equal(adapter.detectStreamForMailbox("support@weishan.ai"), "USER_SUPPORT_STREAM");
  assert.equal(adapter.detectStreamForMailbox("api@weishan.ai"), "PROVIDER_OPERATIONS_STREAM");
  assert.equal(adapter.detectStreamForMailbox("other@example.test"), "UNKNOWN_STREAM");
}

{
  const provider = adapter.detectMailProviderFromMx(["10 mx2.privateemail.com.", "10 mx1.privateemail.com."]);
  assert.equal(provider.providerId, "privateemail_imap");
  assert.equal(provider.gmailConnectorApplicable, false);
  assert.equal(provider.authState, "AUTH_REQUIRED");
}

{
  const state = adapter.buildConnectionState({
    expectedMailbox:"support@weishan.ai",
    actualMailbox:"",
    authAvailable:false,
    messages:[raw("must-not-read")]
  });
  assert.equal(state.state, "AUTH_REQUIRED");
  assert.equal(state.messages.length, 0);
  assert.equal(state.mailboxMutations.EMAILS_SENT, 0);
}

{
  const state = adapter.buildConnectionState({
    expectedMailbox:"support@weishan.ai",
    actualMailbox:"personal@example.test",
    authAvailable:true,
    messages:[raw("wrong-account")]
  });
  assert.equal(state.state, "WRONG_ACCOUNT");
  assert.equal(state.messages.length, 0);
  assert.equal(state.failClosed, true);
}

{
  const adapted = adapter.adaptProviderMessage(raw("html-1", {
    subject:"<b>Bug</b>",
    html:"<img src='https://tracker.example/pixel'><script>bad()</script>",
    text:"Wrong price. API key: should-not-survive",
    attachments:[{ filename:"debug.js", contentType:"application/javascript", sizeBytes:10 }]
  }), { mailbox:"support@weishan.ai" });
  const normalized = w.WeishanEmailOpsNormalizer.normalizeMailMessage(adapted);
  assert.equal(normalized.rawHtmlRetained, false);
  assert.equal(normalized.bodyRetained, false);
  assert.equal(normalized.attachments[0].bodyLoaded, false);
  assert.equal(normalized.attachments[0].executableOpened, false);
  assert.equal(JSON.stringify(normalized).includes("should-not-survive"), false);
}

{
  const result = adapter.processReadOnlyMailboxSnapshot({
    expectedMailbox:"support@weishan.ai",
    actualMailbox:"support@weishan.ai",
    authAvailable:true,
    limit:10,
    messages:[
      raw("support-bug", { subject:"Wrong hotel total", text:"Bug: hotel total is wrong; expected taxes included, actual missing fees." }),
      raw("support-question", { subject:"How do I compare?", text:"How do I compare laptop prices?" }),
      raw("support-feedback", { subject:"Feature idea", text:"Feature request: add 中文 support." }),
      raw("support-security", { subject:"Security vulnerability", text:"I found a credential leak vulnerability. Please review." }),
      raw("support-noise", { subject:"Thanks", text:"Thanks" }),
      raw("support-provider", { from:"Hotelbeds <support@hotelbeds.com>", subject:"Hotelbeds support", text:"We reviewed your mTLS case." }),
      raw("support-otp", { from:"CJ <security@cj.com>", subject:"Verification code", text:"Your verification code is 123456." }),
      raw("support-bug", { subject:"Wrong hotel total", text:"Duplicate should not create duplicate processing." })
    ]
  });
  assert.equal(result.connectionState, "CONNECTED_READ_ONLY");
  assert.equal(result.mailboxStream, "USER_SUPPORT_STREAM");
  assert.equal(result.processedMessages, 7);
  assert.equal(result.realMailReadValidated, true);
  assert.equal(result.classifications.some((item) => item.category === "USER_BUG_REPORT"), true);
  assert.equal(result.classifications.some((item) => item.category === "USER_QUESTION"), true);
  assert.equal(result.classifications.some((item) => item.category === "USER_FEEDBACK"), true);
  assert.equal(result.classifications.some((item) => item.category === "SECURITY_REPORT"), true);
  assert.equal(result.classifications.some((item) => item.category === "PROVIDER_REPLY"), true);
  assert.equal(result.classifications.some((item) => item.category === "SECURITY_OTP"), true);
  assert.equal(JSON.stringify(result).includes("123456"), false);
  assert.equal(result.externalEffects.EMAILS_SENT, 0);
  assert.equal(result.mailboxMutations.MAIL_LABELS_CHANGED, 0);
  assert.equal(result.mailboxMutations.LINKS_OPENED, 0);
}

{
  const apiStream = adapter.processReadOnlyMailboxSnapshot({
    expectedMailbox:"api@weishan.ai",
    actualMailbox:"api@weishan.ai",
    authAvailable:true,
    messages:[
      raw("api-provider", { to:["api@weishan.ai"], from:"Daisycon <support@daisycon.com>", subject:"API application", text:"Your publisher API application was reviewed." }),
      raw("api-legal", { to:["api@weishan.ai"], subject:"Publisher Agreement", text:"Please accept the legal terms and arbitration agreement." }),
      raw("api-newsletter", { to:["api@weishan.ai"], subject:"Newsletter", text:"unsubscribe promotion webinar." }),
      raw("api-user-bug", { to:["api@weishan.ai"], from:"Beta User <user@example.test>", subject:"Wrong price", text:"Wrong price in shopping result." })
    ]
  });
  assert.equal(apiStream.mailboxStream, "PROVIDER_OPERATIONS_STREAM");
  assert.equal(apiStream.classifications.some((item) => item.category === "PROVIDER_REPLY"), true);
  assert.equal(apiStream.classifications.some((item) => item.category === "LEGAL_CONTRACT"), true);
  assert.equal(apiStream.classifications.some((item) => item.category === "MARKETING"), true);
  assert.equal(apiStream.classifications.some((item) => item.category === "USER_BUG_REPORT"), true);
}

{
  const wrong = adapter.processReadOnlyMailboxSnapshot({
    expectedMailbox:"support@weishan.ai",
    actualMailbox:"api@weishan.ai",
    authAvailable:true,
    messages:[raw("collapse-attempt")]
  });
  assert.equal(wrong.connectionState, "WRONG_ACCOUNT");
  assert.equal(wrong.processedMessages, 0);
  assert.equal(wrong.realMailReadValidated, false);
}

{
  const missing = adapter.processReadOnlyMailboxSnapshot({
    expectedMailbox:"support@weishan.ai",
    actualMailbox:"support@weishan.ai",
    authAvailable:true,
    messages:[raw("malformed", { from:"", subject:"", text:"FYI." })]
  });
  assert.equal(missing.status, "READY_FOR_INTERNAL_EMAIL_OPS");
  assert.equal(missing.classifications[0].category, "UNKNOWN");
  assert.equal(missing.humanQueue.length >= 1, true);
}

{
  const fallback = adapter.buildManualFallbackState({ mailboxAvailable:true });
  assert.equal(fallback.MANUAL_SUPPORT_INBOX_FALLBACK, "AVAILABLE");
  assert.equal(fallback.EMAIL_FEEDBACK_GATE, "PASS_WITH_MANUAL_FALLBACK");
  assert.equal(fallback.EMAIL_SEND_ENABLED, false);
}

console.log("EMAIL_OPS_REAL_MAILBOX_ADAPTER PASS");
