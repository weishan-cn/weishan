"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, Object, Array, String, Number, Boolean, RegExp });
  vm.runInContext(
    fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core/errorEmptyRecoveryUx.js"), "utf8"),
    context,
    { filename:"errorEmptyRecoveryUx.js" }
  );
  return window.WeishanErrorEmptyRecoveryUx;
}

function assertZeroMetrics(metrics) {
  Object.keys(metrics).forEach(function (key) {
    assert.equal(metrics[key], 0, key + " should remain zero");
  });
}

function assertNoLeaks(value) {
  const serialized = JSON.stringify({
    title:value.title,
    message:value.message,
    whatHappened:value.whatHappened,
    whatStillWorks:value.whatStillWorks,
    nextStep:value.nextStep,
    ariaLabel:value.ariaLabel
  });
  assert.equal(/ETIMEDOUT|ECONNRESET|AUTH_REQUIRED|BLOCKED_POLICY|RETRY_EXHAUSTED|CREDENTIAL_MISSING|executionGate|authorizesExecution/.test(serialized), false);
  assert.equal(/super-secret|abc123|stack trace|client_secret=abc|token=abc|<script/i.test(serialized), false);
}

function main() {
  const api = load();
  assert.ok(api, "error empty recovery UX module should be exposed");

  const indexSource = fs.readFileSync(path.join(ROOT, "apps/desktop/src/index.html"), "utf8");
  const verifySource = fs.readFileSync(path.join(ROOT, "scripts/verify.js"), "utf8");
  const styleSource = fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/styles/app.css"), "utf8");
  assert.match(indexSource, /errorEmptyRecoveryUx\.js\?v=4\.3\.0/, "runtime should load error/empty recovery UX guard");
  assert.match(verifySource, /error-empty-recovery-ux-effectiveness\.test\.js/, "verify should register focused recovery UX tests");
  assert.match(styleSource, /\.ws-recovery-state/, "recovery card style should exist");
  assert.match(styleSource, /min-height:44px/, "recovery actions should preserve touch target size");
  assert.match(styleSource, /forced-colors: active/, "recovery UI should preserve high-contrast support");

  const initial = api.presentRecoveryState({ kind:"INITIAL_EMPTY", domain:"home" });
  assert.equal(initial.failure, false);
  assert.equal(initial.noResults, false);
  assert.equal(initial.role, "status");
  assert.match(initial.message, /Enter|输入/);

  const noResults = api.presentRecoveryState({ kind:"NO_RESULTS", domain:"shopping" });
  assert.equal(noResults.failure, false);
  assert.equal(noResults.noResults, true);
  assert.equal(noResults.actions[0].id, "modify_request");

  const failure = api.presentRecoveryState({ kind:"ALL_SOURCES_FAILED", domain:"flight" });
  assert.equal(failure.failure, true);
  assert.equal(failure.noResults, false);
  assert.equal(failure.role, "alert");

  const partial = api.presentRecoveryState({ kind:"PARTIAL_RESULTS", domain:"hotel", validResultCount:2 });
  assert.equal(partial.failure, false);
  assert.equal(partial.partialResults, true);
  assert.equal(partial.completeResultsClaimed, false);
  assert.equal(partial.validResultCount, 2);
  assert.equal(partial.actions.some((item) => item.id === "continue_available"), true);

  const blocked = api.presentRecoveryState({ kind:"BLOCKED_POLICY", domain:"provider" });
  assert.equal(blocked.actions.some((item) => item.id === "retry"), false);
  assert.equal(blocked.failure, true);

  const configuration = api.presentRecoveryState({ kind:"CREDENTIAL_MISSING", domain:"settings" });
  assert.equal(configuration.actions[0].id, "open_settings");
  assert.equal(configuration.productionTraffic, false);
  assert.equal(configuration.authorizesExecution, false);

  const mailDisconnected = api.presentRecoveryState({ kind:"MAIL_NOT_CONNECTED", domain:"mail" });
  const mailEmpty = api.presentRecoveryState({ kind:"MAIL_NO_ATTENTION", domain:"mail" });
  const mailFailure = api.presentRecoveryState({ kind:"MAIL_READ_FAILURE", domain:"mail" });
  assert.equal(mailDisconnected.state, "MAIL_NOT_CONNECTED");
  assert.equal(mailEmpty.noResults, true);
  assert.equal(mailEmpty.failure, false);
  assert.equal(mailFailure.failure, true);
  assert.notEqual(mailDisconnected.title, mailEmpty.title);
  assert.notEqual(mailFailure.title, mailEmpty.title);

  const genericHandoff = api.presentRecoveryState({ kind:"GENERIC_HANDOFF", domain:"handoff" });
  const unsafeHandoff = api.presentRecoveryState({ kind:"UNSAFE_HANDOFF_BLOCKED", domain:"handoff", message:"http://127.0.0.1?token=abc123" });
  assert.equal(genericHandoff.exactHandoff, false);
  assert.equal(unsafeHandoff.exactHandoff, false);
  assert.equal(unsafeHandoff.actions.some((item) => item.id === "choose_other_source"), true);
  assertNoLeaks(unsafeHandoff);

  const redacted = api.presentRecoveryState({
    kind:"TIMEOUT",
    domain:"shopping",
    message:"ETIMEDOUT HTTP 500 client_secret=abc token=abc123 <script>alert(1)</script> Error: stack trace at Bad.fn (/tmp/leak.js:1)"
  });
  assert.equal(redacted.secretExposed, false);
  assert.equal(redacted.technicalDetailExposed, false);
  assertNoLeaks(redacted);

  const zh = api.presentRecoveryState({ kind:"NO_RESULTS", domain:"shopping", locale:"zh-CN" });
  assert.equal(zh.failure, false);
  assert.equal(zh.actions[0].keyboardAccessible, true);
  assert.ok(/没有|暂时/.test(zh.title + zh.message));

  const deduped = api.dedupeVisibleErrors(new Array(100).fill({ kind:"TIMEOUT", domain:"shopping" }));
  assert.equal(deduped.bounded, true);
  assert.equal(deduped.visible.length, 1);
  assert.equal(deduped.duplicateErrorAccumulation, 0);

  const transitionSuccess = api.transitionRecoveryState(
    { requestId:"search-a", errors:[redacted], loading:true, retrying:true },
    { requestId:"search-a", status:"success" }
  );
  assert.equal(transitionSuccess.oldErrorsCleared, true);
  assert.equal(transitionSuccess.current.errors.length, 0);
  assert.equal(transitionSuccess.current.loading, false);
  assert.equal(transitionSuccess.current.retrying, false);

  const stale = api.transitionRecoveryState(
    { requestId:"newer", state:"SUCCESS", errors:[] },
    { requestId:"older", kind:"TIMEOUT" }
  );
  assert.equal(stale.status, "stale_error_ignored");
  assert.equal(stale.staleErrorsReused, 0);

  const card = api.renderRecoveryCard({ kind:"PARTIAL_RESULTS", domain:"cruise" });
  assert.match(card, /role="status"/);
  assert.match(card, /ws-recovery-action/);
  assert.equal(/<script|client_secret|api_key|token=/.test(card), false);

  [partial, blocked, configuration, mailDisconnected, mailFailure, genericHandoff].forEach(function (state) {
    state.actions.forEach(function (item) {
      assert.equal(item.type, "button");
      assert.equal(item.role, "button");
      assert.equal(item.keyboardAccessible, true);
      assert.equal(item.focusVisible, true);
      assert.equal(item.minTargetPx >= 44, true);
      assert.equal(item.authorizesExecution, false);
      assert.equal(item.productionTraffic, false);
    });
  });

  const suite = api.runErrorEmptyRecoveryUxSuite();
  assert.equal(suite.moduleName, "error_empty_recovery_ux_v1");
  assert.equal(suite.status, "pass");
  assert.equal(suite.recovery.WHAT_HAPPENED_PRESENT, true);
  assert.equal(suite.recovery.WHAT_STILL_WORKS_PRESENT, true);
  assert.equal(suite.recovery.DUPLICATE_ERRORS_BOUNDED, true);
  assert.equal(suite.recovery.OLD_ERRORS_CLEAR_ON_SUCCESS, true);
  assert.equal(suite.language.noInternalJargon, true);
  assert.equal(suite.accessibility.keyboardActions, "pass");
  assert.equal(suite.domains.shopping, "pass");
  assert.equal(suite.domains.flight, "pass");
  assert.equal(suite.domains.hotel, "pass");
  assert.equal(suite.domains.cruise, "pass");
  assert.equal(suite.domains.mail, "pass");
  assert.equal(suite.domains.handoff, "pass");
  assertZeroMetrics(suite.zeroMetrics);
  assert.equal(suite.externalEffects.PROVIDER_API_CALLS, 0);
  assert.equal(suite.externalEffects.PROVIDER_CREDENTIAL_MUTATIONS, 0);
  assert.equal(suite.externalEffects.EMAIL_ACTIONS, 0);
  assert.equal(suite.externalEffects.PRODUCTION_TRAFFIC, 0);
  assert.equal(suite.governance.executionGate, "CLOSED");
  assert.equal(suite.governance.authorizesExecution, false);
  assert.equal(suite.governance.productionTraffic, false);
  assert.equal(suite.governance.EMAIL_SEND_ENABLED, false);

  console.log("ERROR_EMPTY_RECOVERY_UX_EFFECTIVENESS PASS zeroMetrics=0 domains=8 recovery=actionable");
}

main();
