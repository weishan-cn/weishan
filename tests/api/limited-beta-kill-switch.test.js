const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function loadRendererCore(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

const windowRef = loadRendererCore([
  "apps/desktop/src/renderer/core/limitedBetaKillSwitch.js"
]);

const api = windowRef.WeishanLimitedBetaKillSwitch;

function main() {
  api.reset();
  assert.equal(api.LIMITED_BETA_KILL_SWITCH_VERSION, "4.0.6");

  const draft = api.buildLimitedBetaKillSwitchDraft();
  assert.equal(draft.state.globalLimitedBetaEnabled, true);
  assert.equal(draft.state.categoryOverrides.flight, true);
  assert.equal(draft.state.categoryOverrides.product, false);
  assert.equal(draft.state.categoryOverrides.hotel, false);
  assert.equal(draft.state.categoryOverrides.local_service, false);
  assert.equal(draft.state.categoryOverrides.ticket_or_activity, false);
  assert.equal(draft.state.categoryOverrides.restricted_or_blocked, false);
  assert.equal(draft.state.providerOverrides.flight_provider, true);
  assert.equal(draft.state.surfaceOverrides.ordinary_result_card, true);
  assert.equal(draft.state.killSwitchState, "enabled");
  assert.equal(draft.auditDraft.eventType, "LIMITED_BETA_KILL_SWITCH_AUDIT_DRAFT");
  assert.equal(draft.auditDraft.bookingUrlDisplayedCount, 0);
  assert.equal(draft.auditDraft.paymentAttemptCount, 0);
  assert.equal(draft.auditDraft.orderAttemptCount, 0);
  assert.equal(draft.auditDraft.identityUploadAttemptCount, 0);
  assert.equal(draft.auditDraft.redacted, true);

  const visible = api.evaluateLimitedBetaVisibility({
    category:"flight",
    providerId:"flight_provider",
    surface:"ordinary_result_card"
  });
  assert.equal(visible.priceCardVisible, true);
  assert.equal(visible.reason, "limited beta enabled for flight only");

  const product = api.evaluateLimitedBetaVisibility({
    category:"product",
    providerId:"product_provider",
    surface:"ordinary_result_card"
  });
  assert.equal(product.priceCardVisible, false);
  assert.equal(product.blockedReasons.includes("category beta disabled"), true);

  const off = api.turnOffLimitedBeta("test disable");
  assert.equal(off.globalLimitedBetaEnabled, false);
  assert.equal(api.evaluateLimitedBetaVisibility({ category:"flight", providerId:"flight_provider", surface:"ordinary_result_card" }).priceCardVisible, false);

  const requested = api.turnOnLimitedBeta("test restore flight");
  assert.equal(requested.globalLimitedBetaEnabled, false);
  assert.equal(requested.restoreConfirmationPending, true);
  assert.equal(api.evaluateLimitedBetaVisibility({ category:"flight", providerId:"flight_provider", surface:"ordinary_result_card" }).priceCardVisible, false);
  const on = api.confirmRestoreLimitedBeta("test confirmed restore flight");
  assert.equal(on.globalLimitedBetaEnabled, true);
  assert.equal(on.categoryOverrides.flight, true);
  assert.equal(on.categoryOverrides.product, false);
  assert.equal(api.evaluateLimitedBetaVisibility({ category:"flight", providerId:"flight_provider", surface:"ordinary_result_card" }).priceCardVisible, true);

  const rollback = api.forceRollback("test rollback");
  assert.equal(rollback.killSwitchState, "rollback_active");
  assert.equal(api.evaluateLimitedBetaVisibility({ category:"flight", providerId:"flight_provider", surface:"ordinary_result_card" }).priceCardVisible, false);
  assert.equal(api.assertLimitedBetaKillSwitchSafe(draft), true);

  console.log("LIMITED_BETA_KILL_SWITCH_CORE PASS");
}

main();
