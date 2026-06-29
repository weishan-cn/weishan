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
  "apps/desktop/src/renderer/core/manualBookingHandoff.js"
]);

const api = windowRef.WeishanManualBookingHandoff;

function main() {
  assert.equal(api.MANUAL_BOOKING_HANDOFF_VERSION, "2.2.6");

  const handoff = api.buildManualBookingHandoff();
  assert.equal(handoff.status, "manual_only");
  assert.equal(handoff.providerCategory, "flight");
  assert.equal(handoff.providerId, "flight_provider");
  assert.equal(handoff.noAutoOpen, true);
  assert.equal(handoff.noBookingUrl, true);
  assert.equal(handoff.noPayment, true);
  assert.equal(handoff.noOrder, true);
  assert.equal(handoff.noIdentityUpload, true);
  assert.equal(handoff.noBankCardSave, true);
  assert.equal(handoff.userMustVerifyOnOfficialPlatform, true);
  assert.equal(handoff.copyPayload.includes("【weishan 人工核对清单】"), true);
  assert.equal(handoff.copyPayload.includes("weishan 不自动跳转、不付款、不下单"), true);
  assert.equal(handoff.auditDraft.eventType, "MANUAL_BOOKING_HANDOFF_AUDIT_DRAFT");
  assert.equal(handoff.auditDraft.autoOpenAttemptCount, 0);
  assert.equal(handoff.auditDraft.bookingUrlGeneratedCount, 0);
  assert.equal(handoff.auditDraft.paymentAttemptCount, 0);
  assert.equal(handoff.auditDraft.orderAttemptCount, 0);
  assert.equal(handoff.auditDraft.identityUploadAttemptCount, 0);
  assert.equal(handoff.auditDraft.redacted, true);

  const rollback = api.buildManualBookingHandoff({ rollbackActive:true });
  assert.equal(rollback.priceEvidenceSummary.total, "价格已隐藏");
  assert.equal(rollback.priceEvidenceSummary.taxes, "价格已隐藏");
  assert.equal(rollback.priceEvidenceSummary.fees, "价格已隐藏");
  assert.equal(rollback.copyPayload.includes("价格：价格已隐藏"), true);

  const product = api.buildManualBookingHandoff({ providerCategory:"product", providerId:"product_provider" });
  assert.equal(product.status, "not_allowed");
  assert.equal(product.copyPayload, "");

  const restricted = api.buildManualBookingHandoff({ providerCategory:"restricted_or_blocked", providerId:"restricted_provider" });
  assert.equal(restricted.status, "blocked");
  assert.equal(restricted.copyPayload, "");

  assert.equal(api.assertManualBookingHandoffSafe(handoff), true);

  console.log("MANUAL_BOOKING_HANDOFF_CORE PASS");
}

main();
