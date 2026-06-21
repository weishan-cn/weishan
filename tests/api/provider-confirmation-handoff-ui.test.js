const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename: file });
  }
  return window;
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/providerConfirmationHandoffUi.js"]);
  const api = windowRef.WeishanProviderConfirmationHandoffUi;
  assert.equal(api.PROVIDER_CONFIRMATION_HANDOFF_UI_VERSION, "2.1.41");

  const ui = api.buildProviderConfirmationHandoffUiModel({ candidateDecision: "confirmation_stub" });
  assert.equal(ui.phase, "provider_confirmation_handoff_ui_stub");
  assert.equal(ui.title, "前往平台确认");
  assert.equal(ui.status, "stub only");
  assert.equal(ui.continueButtonDisabled, true);
  assert.equal(ui.cancelButtonEnabled, true);
  assert.equal(ui.noAutoOpen, true);
  assert.equal(ui.noBookingUrl, true);
  assert.equal(ui.noPayment, true);
  assert.equal(ui.noOrder, true);
  assert.equal(ui.noIdentityUpload, true);
  assert.equal(ui.showInMainFlow, false);
  assert.equal(ui.redacted, true);

  const summary = api.buildProviderConfirmationSummary({ candidateDecision: "confirmation_stub" });
  assert.equal(summary.title, "前往平台确认");
  assert.equal(summary.status, "stub only");
  assert.equal(summary.noBookingUrl, true);
  assert.equal(summary.noPayment, true);
  assert.equal(summary.noOrder, true);
  assert.equal(summary.noIdentityUpload, true);
  assert.equal(summary.redacted, true);

  const audit = api.getProviderConfirmationHandoffUiAuditDraft({ candidateDecision: "confirmation_stub" });
  assert.equal(audit.eventType, "PROVIDER_CONFIRMATION_HANDOFF_UI_DRAFT");
  assert.equal(audit.continueButtonDisabled, true);
  assert.equal(audit.cancelButtonEnabled, true);
  assert.equal(audit.noAutoOpen, true);
  assert.equal(audit.noBookingUrl, true);
  assert.equal(audit.noPayment, true);
  assert.equal(audit.noOrder, true);
  assert.equal(audit.noIdentityUpload, true);
  assert.equal(audit.redacted, true);

  assert.equal(api.assertProviderConfirmationHandoffUiSafe(ui), true);
  assert.equal(JSON.stringify(ui).includes("bookingUrl"), true);

  console.log("PROVIDER_CONFIRMATION_HANDOFF_UI_CORE PASS");
}

main();
