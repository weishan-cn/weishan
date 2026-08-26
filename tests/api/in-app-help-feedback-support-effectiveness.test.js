"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const source = fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core/inAppHelpFeedbackSupport.js"), "utf8");
const context = vm.createContext({ window:{}, URLSearchParams });
vm.runInContext(source, context, { filename:"inAppHelpFeedbackSupport.js" });
const api = context.window.WeishanInAppHelpFeedbackSupport;
assert(api, "Help & Feedback support API must be exposed");

assert.equal(api.CONSUMER_SUPPORT_ADDRESS, "support@weishan.ai");
assert.equal(api.PROVIDER_OPERATIONS_ADDRESS, "api@weishan.ai");
assert.equal(api.audit().USER_VISIBLE_API_ADDRESSES, 0);
assert.equal(api.audit().FIRST_RUN_ACCOUNT_REQUIRED, "NO");
assert.equal(api.audit().EMAIL_SEND_ENABLED, false);

const diagnosticAttack = {
  appVersion:"4.2.8",
  platformClass:"desktop",
  locale:"zh-CN",
  moduleId:"mail",
  safeErrorClass:"AUTH_REQUIRED",
  buildType:"SOURCE_DEV",
  rawQuery:"Find my invoice from John for $12,500",
  mailSubject:"Private subject",
  mailBody:"Private body",
  sender:"john@example.test",
  recipient:"api@weishan.ai",
  draft:"private draft",
  summary:"private summary",
  translation:"private translation",
  attachmentName:"passport.pdf",
  fullUrl:"https://example.test/order?id=123&token=secret",
  apiKey:"sk-test-secret",
  token:"Bearer token",
  password:"password: secret",
  oauthToken:"oauth token",
  authorization:"Authorization: Bearer value",
  cookie:"session=value",
  privateKey:"-----BEGIN PRIVATE KEY-----",
  otp:"123456",
  ipAddress:"203.0.113.1",
  macAddress:"00:11:22:33:44:55",
  hardwareSerial:"SERIAL",
  deviceFingerprint:"fingerprint",
  stack:"Error\n at file.js:1",
  rawHttpError:"HTTP 500",
  internalEnum:"executionGate",
  analyticsHistory:[{ event:"search", query:"private" }],
  __proto__:"polluted",
  constructor:"evil",
  prototype:"evil"
};
const diagnostics = api.safeDiagnostics(diagnosticAttack, { include:true });
assert.equal(diagnostics.included, true);
assert.deepEqual(Object.keys(diagnostics.diagnostics).sort(), ["appVersion", "buildType", "locale", "moduleId", "platformClass", "safeErrorClass"].sort());
const serializedDiagnostics = JSON.stringify(diagnostics);
assert.equal(/invoice from John|Private subject|Private body|passport|sk-test|Bearer|PRIVATE KEY|203\.0\.113|00:11|fingerprint|HTTP 500|executionGate/i.test(serializedDiagnostics), false);
assert(diagnostics.rejectedFields.includes("UNKNOWN_FIELD_REJECTED"));
assert.equal(/rawQuery|mailBody|fullUrl|stack|deviceFingerprint|internalEnum/i.test(serializedDiagnostics), false);

const offDiagnostics = api.safeDiagnostics(diagnosticAttack, { include:false });
assert.equal(offDiagnostics.included, false);
assert.equal(JSON.stringify(offDiagnostics.diagnostics), "{}");
const decodeMailto = (value) => decodeURIComponent(String(value).replace(/\+/g, " "));

const draft = api.buildSupportMailto({
  category:"bug",
  feedbackText:"The app did not recover after retry. <script>alert(1)</script> executionGate=OPEN deleteAll=true",
  contactEmail:"user@example.test",
  includeDiagnostics:true,
  diagnostics:diagnosticAttack
});
assert.equal(draft.ok, true);
assert.equal(draft.recipient, "support@weishan.ai");
assert.equal(draft.requiresUserAction, true);
assert.equal(draft.autoSend, false);
assert.equal(draft.deliveryConfirmedByApp, false);
assert.equal(draft.falseSentState, 0);
assert(draft.url.startsWith("mailto:support@weishan.ai?"));
assert.equal(/api@weishan\.ai/.test(draft.url), false);
const decodedDraft = decodeMailto(draft.url);
assert.equal(/Private subject|Find my invoice|sk-test|Bearer|PRIVATE KEY|fullUrl|stack/i.test(decodedDraft), false);
assert.equal(/<script>|alert\(1\)|executionGate=OPEN|deleteAll=true/i.test(decodedDraft), false);
assert.match(decodedDraft, /The app did not recover after retry/);
assert.equal(/executionGate|deleteAll/i.test(decodedDraft), false);
assert.match(decodedDraft, /\[redacted-authority\]/);
assert.match(decodedDraft, /\[redacted-html\]/);

const secretFeedbackDraft = api.buildSupportMailto({
  category:"bug",
  feedbackText:"token=abc123 apiKey=key123 Authorization: Bearer raw-secret password: hunter2 oauth=abc private_key=-----BEGIN PRIVATE KEY-----abc-----END PRIVATE KEY-----",
  includeDiagnostics:false
});
const decodedSecretFeedback = decodeMailto(secretFeedbackDraft.url);
assert.equal(/abc123|key123|raw-secret|hunter2|BEGIN PRIVATE KEY|END PRIVATE KEY/i.test(decodedSecretFeedback), false);
assert.match(decodedSecretFeedback, /token=\[redacted\]/);
assert.match(decodedSecretFeedback, /apiKey=\[redacted\]/);
assert.match(decodedSecretFeedback, /Authorization=\[redacted\]/);
assert.match(decodedSecretFeedback, /password=\[redacted\]/);
assert.equal(api.analyticsEvent("feedback_started", "bug").feedbackText, null);
assert.equal(api.analyticsEvent("feedback_started", "bug").contactEmail, null);
assert.equal(api.analyticsEvent("unknown_event", "bug"), null);

const headerInjection = api.buildSupportMailto({
  category:"bug\r\nBcc: attacker@example.test",
  feedbackText:"Hello\r\nBcc: attacker@example.test",
  contactEmail:"bad@example.test\r\nCc: attacker@example.test",
  includeDiagnostics:false
});
assert.equal(/attacker@example\.test/i.test(headerInjection.url), false);
assert.equal(/bcc=|cc=|to=/i.test(headerInjection.url), false);
assert.equal(headerInjection.recipient, "support@weishan.ai");

const longFeedback = api.sanitizeFeedbackText("x".repeat(50000));
assert.equal(longFeedback.value.length, 5000);
assert.equal(longFeedback.tooLong, true);
assert.equal(longFeedback.authorityGranted, false);

const model = api.buildHelpFeedbackViewModel({ moduleId:"settings" });
assert.equal(model.titleZh, "帮助与反馈");
assert.equal(model.titleEn, "Help & Feedback");
assert.equal(model.location, "Settings");
assert.equal(model.categoryCount, 4);
assert.equal(model.accountRequired, false);
assert.equal(model.providerOperationsAddressVisibleToNormalUser, false);
assert.equal(model.helpTopics.some((topic) => /智能邮件/.test(topic.titleZh) && /Smart Mail/.test(topic.titleEn)), true);
assert.equal(/Mail Takeover|邮箱接管/.test(JSON.stringify(model.helpTopics)), false);
assert.equal(/Cloud|Enterprise|Billing|Team/.test(JSON.stringify(model.helpTopics)), false);
assert.equal(/搜索原文|raw queries/.test(model.diagnosticDisclosureZh + model.diagnosticDisclosureEn), true);

const matrix = api.buildFeatureMatrix();
[
  "HELP_DISCOVERABILITY",
  "FEEDBACK_ENTRY",
  "BUG_REPORT",
  "FEATURE_SUGGESTION",
  "GENERAL_SUPPORT",
  "SAFE_DIAGNOSTICS",
  "MAIL_CONTENT_EXCLUSION",
  "SEARCH_CONTENT_EXCLUSION",
  "HEADER_INJECTION_GUARD",
  "SUPPORT_CONTENT_AUTHORITY",
  "ACCESSIBILITY",
  "CHINESE",
  "ENGLISH",
  "ZERO_LEARNING"
].forEach((key) => assert.equal(matrix[key], "OPTIMIZE", key));

const escalation = api.supportEscalationMatrix();
assert.equal(escalation.length >= 11, true);
assert(escalation.some((item) => item.scenario === "AI not connected" && /RECOVER_IN_PRODUCT/.test(item.defaultEscalation)));
assert(escalation.some((item) => item.scenario === "unexpected app defect" && item.defaultEscalation === "OFFER_SUPPORT"));

const inventory = api.buildSupportModuleInventory();
assert.equal(inventory.some((item) => item.module === "Settings Help & Feedback card" && item.decision === "OPTIMIZE"), true);
assert.equal(inventory.some((item) => /Provider\/API/.test(item.module) && item.decision === "KEEP"), true);

const audit = api.audit();
[
  "MAIL_CONTENT_IN_DIAGNOSTICS",
  "SEARCH_QUERY_IN_DIAGNOSTICS",
  "CREDENTIALS_IN_DIAGNOSTICS",
  "SECRETS_IN_DIAGNOSTICS",
  "FULL_URLS_IN_DIAGNOSTICS",
  "STACK_TRACES_IN_DIAGNOSTICS",
  "SCREENSHOTS_AUTO_CAPTURED",
  "ANALYTICS_HISTORY_IN_DIAGNOSTICS",
  "FEEDBACK_TEXT_IN_ANALYTICS",
  "CONTACT_INFO_IN_ANALYTICS",
  "RAW_INTERNAL_ENUMS_VISIBLE",
  "RAW_HTTP_ERRORS_VISIBLE",
  "HEADER_INJECTION_CASES",
  "SUPPORT_CONTENT_AUTHORITY_BYPASSES",
  "SUPPORT_ACTIONS_AUTO_SENT",
  "FALSE_FEEDBACK_SENT_CONFIRMATIONS",
  "HIDDEN_CLOUD_HELP_EXPOSED",
  "USER_VISIBLE_API_SUPPORT_ADDRESS",
  "KEYBOARD_DEAD_ENDS",
  "SECRET_VALUES_IN_ACCESSIBLE_NAMES"
].forEach((key) => assert.equal(audit[key], 0, key));

for (let index = 0; index < 1000; index += 1) {
  const attack = Object.assign({}, diagnosticAttack, { rawQuery:"private search " + index, apiKey:"api_key=secret-" + index });
  const result = api.safeDiagnostics(attack, { include:true });
  assert.equal(/private search|secret-/i.test(JSON.stringify(result)), false);
}

console.log("IN_APP_HELP_FEEDBACK_SUPPORT_EFFECTIVENESS PASS diagnosticAttackCases=1000 safeDiagnosticCases=6 highRiskZeroMetrics=0 supportRecipient=support@weishan.ai");
