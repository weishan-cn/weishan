#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const CORE_FILE = "apps/desktop/src/renderer/core/smartMailAuthAiGating.js";
const I18N_FILE = "apps/desktop/src/renderer/core/i18n.js";
const MAIL_PAGE_FILE = "apps/desktop/src/renderer/routes/MailPage.js";
const DISPATCH_FILE = "apps/desktop/src/renderer/core/dispatchRouter.js";

function loadCore() {
  const store = new Map();
  const secureDeleted = [];
  const window = {
    localStorage:{
      getItem:(key) => store.has(key) ? store.get(key) : null,
      setItem:(key, value) => store.set(key, String(value)),
      removeItem:(key) => store.delete(key)
    },
    WeishanStore:{
      read:(key, fallback) => store.has("weishan.v2." + key) ? JSON.parse(store.get("weishan.v2." + key)) : fallback,
      write:(key, value) => {
        store.set("weishan.v2." + key, JSON.stringify(value));
        return value;
      },
      remove:(key) => store.delete("weishan.v2." + key)
    },
    SecureStorageApi:{ delete:async (key) => { secureDeleted.push(key); return { ok:true }; } },
    MailApi:{
      activeAccount:() => null,
      removeAccount:(email) => store.set("removed.mail", email),
      deleteAuthorizationCode:async (email) => {
        secureDeleted.push("mail.account." + email + ".authorizationCode");
        return { ok:true };
      }
    },
    WeishanAPI:{
      connectorSummary:() => ({ state:"not_configured" })
    }
  };
  window.window = window;
  const context = vm.createContext({ window, console, Date });
  vm.runInContext(fs.readFileSync(path.join(ROOT, CORE_FILE), "utf8"), context, { filename:CORE_FILE });
  return { api:window.WeishanSmartMailAuthAiGating, window, store, secureDeleted };
}

const { api, window, store, secureDeleted } = loadCore();

assert.equal(api.evaluatePolicy({ mailState:"NOT_CONNECTED", aiState:"NOT_CONFIGURED" }).userFacingName.zh, "智能邮件");
assert.equal(api.evaluatePolicy({ mailState:"NOT_CONNECTED", aiState:"NOT_CONFIGURED" }).userFacingName.en, "Smart Mail");
assert.equal(api.evaluatePolicy({ mailState:"NOT_CONNECTED", aiState:"NOT_CONFIGURED" }).firstRunAccountRequired, false);
assert.equal(api.evaluatePolicy({ mailState:"CONNECTED", aiState:"NOT_CONFIGURED" }).smartMailBasicReadingRequiresAi, false);
assert.equal(api.evaluatePolicy({ mailState:"CONNECTED", aiState:"CONNECTED" }).mailContentAnalytics, false);
assert.equal(api.evaluatePolicy({ mailState:"CONNECTED", aiState:"CONNECTED" }).aiRawKeyVisibleToRenderer, false);
assert.equal(api.evaluatePolicy({ mailState:"CONNECTED", aiState:"CONNECTED" }).mailCredentialRawReadbackToRenderer, false);

const noMailNoAi = api.connectionSurface({ mailState:"NOT_CONNECTED", aiState:"NOT_CONFIGURED" });
assert.equal(noMailNoAi.mode, "CONNECT_MAILBOX_FIRST");
assert.match(noMailNoAi.zhTitle, /连接邮箱/);
assert.equal(noMailNoAi.showAiSetup, false);

const mailYesAiNo = api.connectionSurface({ mailState:"CONNECTED", aiState:"NOT_CONFIGURED" });
assert.equal(mailYesAiNo.mode, "BASIC_MAIL_WITH_AI_JIT");
assert.match(mailYesAiNo.zhMessage, /阅读邮件/);
assert.equal(api.capabilityDecision("READ_MAIL", { mailState:"CONNECTED", aiState:"NOT_CONFIGURED" }).available, true);
assert.equal(api.capabilityDecision("OPEN_THREAD", { mailState:"CONNECTED", aiState:"NOT_CONFIGURED" }).available, true);
assert.equal(api.capabilityDecision("BASIC_SEARCH", { mailState:"CONNECTED", aiState:"NOT_CONFIGURED" }).available, true);
assert.equal(api.capabilityDecision("SUMMARY", { mailState:"CONNECTED", aiState:"NOT_CONFIGURED" }).status, "CONNECT_AI_SERVICE");
assert.equal(api.capabilityDecision("TRANSLATE", { mailState:"CONNECTED", aiState:"NOT_CONFIGURED" }).status, "CONNECT_AI_SERVICE");
assert.equal(api.capabilityDecision("GENERATE_DRAFT", { mailState:"CONNECTED", aiState:"NOT_CONFIGURED" }).status, "CONNECT_AI_SERVICE");

const noMailAiYes = api.connectionSurface({ mailState:"NOT_CONNECTED", aiState:"CONNECTED" });
assert.equal(noMailAiYes.mode, "CONNECT_MAILBOX_FIRST");
assert.equal(api.capabilityDecision("READ_MAIL", { mailState:"NOT_CONNECTED", aiState:"CONNECTED" }).available, false);
assert.equal(api.capabilityDecision("READ_MAIL", { mailState:"NOT_CONNECTED", aiState:"CONNECTED" }).status, "CONNECT_MAILBOX");

const full = api.connectionSurface({ mailState:"CONNECTED", aiState:"CONNECTED" });
assert.equal(full.mode, "FULL_SMART_MAIL");
assert.equal(api.capabilityDecision("SUMMARY", { mailState:"CONNECTED", aiState:"CONNECTED" }).available, true);
assert.equal(api.capabilityDecision("SEND", { mailState:"CONNECTED", aiState:"CONNECTED" }).status, "EXPLICIT_USER_CONFIRMATION_REQUIRED");
assert.equal(api.capabilityDecision("DELETE", { mailState:"CONNECTED", aiState:"CONNECTED" }).status, "EXPLICIT_USER_CONFIRMATION_REQUIRED");

for (let i = 0; i < 10; i += 1) {
  const restored = api.classifyRestore({ validAuth:true, hasCredential:true });
  assert.equal(restored.mailState, "CONNECTED");
  assert.equal(restored.promptReconnect, false);
}
assert.equal(api.classifyRestore({ authInvalid:true, hasCredential:true }).promptReconnect, true);
assert.equal(api.classifyRestore({ timeout:true, hasCredential:true }).promptReconnect, false);
assert.equal(api.classifyRestore({ networkError:true, hasCredential:true }).promptReconnect, false);

const safeAnalytics = api.sanitizeAnalyticsEvent({
  name:"SMART_MAIL_AI_ACTION_REQUESTED",
  metadata:{
    capability:"SUMMARY",
    subject:"Secret invoice",
    body:"mail body",
    rawSearch:"find passport",
    token:"tok",
    count:1
  }
});
assert.equal(safeAnalytics.name, "SMART_MAIL_AI_ACTION_REQUESTED");
assert.equal(safeAnalytics.contentIncluded, false);
assert.equal(Object.prototype.hasOwnProperty.call(safeAnalytics.metadata, "subject"), false);
assert.equal(Object.prototype.hasOwnProperty.call(safeAnalytics.metadata, "body"), false);
assert.equal(Object.prototype.hasOwnProperty.call(safeAnalytics.metadata, "rawSearch"), false);
assert.equal(Object.prototype.hasOwnProperty.call(safeAnalytics.metadata, "token"), false);
assert.equal(safeAnalytics.metadata.capability, "SUMMARY");
assert.equal(safeAnalytics.metadata.count, 1);
assert.equal(api.sanitizeAnalyticsEvent({ name:"MAIL_BODY_CAPTURED", metadata:{ body:"x" } }), null);

store.set("weishan.v2.account.current", JSON.stringify({ loggedIn:true, email:"user@example.test" }));
store.set("weishan.v2.api.connector.acct", JSON.stringify({ hasApiKey:true }));
store.set("weishan.v2.settings.userControl.v1", JSON.stringify({ analyticsEnabled:false }));
api.rememberConnection({ email:"user@example.test", connected:true }, { mailState:"CONNECTED", consentGiven:true });
api.disconnectMailbox({ email:"user@example.test", connected:true }).then((result) => {
  assert.equal(result.ok, true);
  assert.equal(result.mailAccessStopped, true);
  assert.equal(result.aiConnectorRemoved, false);
  assert.equal(result.analyticsChanged, false);
  assert.equal(result.unrelatedUserDataDeleted, false);
  assert.equal(store.get("removed.mail"), "user@example.test");
  assert.equal(store.has("weishan.v2.smartMail.connection.v1"), false);
  assert.equal(store.has("weishan.v2.settings.userControl.v1"), true);
  assert.equal(secureDeleted.length >= 1, true);

  const audit = api.audit();
  Object.keys(audit).forEach((key) => assert.equal(audit[key], 0, key));

  const i18nSource = fs.readFileSync(path.join(ROOT, I18N_FILE), "utf8");
  const mailPageSource = fs.readFileSync(path.join(ROOT, MAIL_PAGE_FILE), "utf8");
  const dispatchSource = fs.readFileSync(path.join(ROOT, DISPATCH_FILE), "utf8");
  assert.match(i18nSource, /mail:"智能邮件"/);
  assert.match(i18nSource, /mail:"Smart Mail"/);
  assert.match(i18nSource, /mailWorkspaceTitle:"智能邮件"/);
  assert.match(i18nSource, /mailWorkspaceTitle:"Smart Mail"/);
  assert.match(i18nSource, /mailAuthorizePrimary:"授权邮箱"/);
  assert.match(i18nSource, /mailAuthorizePrimary:"Authorize mailbox"/);
  assert.doesNotMatch(i18nSource, /mailWorkspaceTitle:"邮件接管"|mailWorkspaceTitle:"Mail Takeover"|mailButton:"邮件接管"|mailButton:"Mail Takeover"/);
  assert.doesNotMatch(mailPageSource, /邮件接管模块|Mail AI/);
  assert.match(mailPageSource, /id="mailAuthorizeBtn"/);
  assert.match(mailPageSource, /id="mailConnectForm"/);
  assert.match(mailPageSource, /showMailAuthForm \? "" : "is-collapsed"/);
  assert.match(mailPageSource, /mailAuthExpanded = !res\.ok/);
  assert.match(mailPageSource, /data-open-ai-settings/);
  assert.match(mailPageSource, /disconnectMailbox/);
  assert.doesNotMatch(dispatchSource, /"mail\.open":"打开邮件接管"|taskTitle:"邮件接管任务"/);

  console.log("SMART_MAIL_AUTH_AI_GATING_EFFECTIVENESS PASS highRiskZeroMetrics=0 connectionMatrix=PASS authPersistence=PASS aiGating=PASS");
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
