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
  "apps/desktop/src/renderer/core/limitedBetaRollbackGuard.js"
]);

const api = windowRef.WeishanLimitedBetaRollbackGuard;

function main() {
  assert.equal(api.LIMITED_BETA_ROLLBACK_GUARD_VERSION, "2.1.78");

  const safe = api.evaluateLimitedBetaRollbackGuard({
    providerCategory:"flight",
    providerId:"flight_provider",
    manualReviewState:"approved_for_limited_beta",
    schemaValidation:"pass",
    sourceLabelValidation:"pass",
    priceIntegrityValidation:"pass"
  });
  assert.equal(safe.rollbackDecision, "not_needed");
  assert.equal(safe.fallbackSurface, "offline_planning_only");
  assert.equal(safe.bookingUrlHidden, true);
  assert.equal(safe.paymentDisabled, true);
  assert.equal(safe.orderDisabled, true);
  assert.equal(safe.identityUploadDisabled, true);
  assert.equal(api.buildRollbackAuditDraft(safe).redacted, true);

  const bookingUrl = api.evaluateLimitedBetaRollbackGuard({
    providerCategory:"flight",
    providerId:"flight_provider",
    bookingUrl:"https://example.invalid/book"
  });
  assert.equal(bookingUrl.rollbackDecision, "rollback_active");
  assert.equal(bookingUrl.fallbackSurface, "offline_planning_only");
  assert.equal(bookingUrl.ordinaryResultFallback, "暂无真实价格结果");
  assert.equal(bookingUrl.triggers.includes("bookingUrl/payment/order url present"), true);

  const restricted = api.evaluateLimitedBetaRollbackGuard({
    providerCategory:"restricted",
    providerId:"restricted_provider"
  });
  assert.equal(restricted.rollbackDecision, "rollback_active");
  assert.equal(restricted.triggers.includes("restricted category"), true);

  const fakePrice = api.evaluateLimitedBetaRollbackGuard({
    providerCategory:"flight",
    providerId:"flight_provider",
    priceSource:"AI estimated price"
  });
  assert.equal(fakePrice.rollbackDecision, "rollback_active");
  assert.equal(fakePrice.triggers.includes("fake/mock/demo/AI price detected"), true);

  const draft = api.buildLimitedBetaRollbackGuardDraft();
  assert.equal(draft.triggers.includes("bookingUrl trigger: enabled"), true);
  assert.equal(draft.triggers.includes("network attempt trigger: enabled"), true);
  assert.equal(draft.currentRollbackDecision.rollbackDecision, "not_needed");
  assert.equal(api.assertLimitedBetaRollbackGuardSafe(draft), true);

  console.log("LIMITED_BETA_ROLLBACK_GUARD_CORE PASS");
}

main();
