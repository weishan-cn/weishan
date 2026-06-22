const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename: file });
  }
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/safeProviderDeepLinkHandoffGate.js",
    "apps/desktop/src/renderer/core/providerConfirmationHandoffUi.js"
  ]);
  const gateApi = windowRef.WeishanSafeProviderDeepLinkHandoffGate;
  const api = windowRef.WeishanProviderConfirmationHandoffUi;
  assert.equal(api.PROVIDER_CONFIRMATION_HANDOFF_UI_VERSION, "2.1.55");

  const gate = gateApi.evaluateSafeProviderDeepLinkHandoff({
    providerId: "google_flights_search",
    providerName: "Google Flights",
    searchOnly: true,
    safeProviderHandoffUrl: "https://www.google.com/travel/flights"
  });
  const ui = api.buildProviderConfirmationHandoffUiModel(gate);
  assert.equal(ui.phase, "provider_confirmation_handoff_ui_stub");
  assert.equal(ui.title, "前往平台确认");
  assert.equal(ui.status, "confirmation_required");
  assert.equal(ui.candidateDecision, "safe_provider_handoff_ready");
  assert.equal(ui.providerConfirmationLink, "confirmation_required");
  assert.equal(ui.continueButtonDisabled, false);
  assert.equal(ui.cancelButtonEnabled, true);
  assert.equal(ui.noAutoOpen, true);
  assert.equal(ui.noBookingUrl, true);
  assert.equal(ui.noPayment, true);
  assert.equal(ui.noOrder, true);
  assert.equal(ui.noIdentityUpload, true);
  assert.equal(ui.showInMainFlow, false);
  assert.equal(ui.redacted, true);

  const summary = api.buildProviderConfirmationSummary(gate);
  assert.equal(summary.title, "前往平台确认");
  assert.equal(summary.status, "confirmation_required");
  assert.equal(summary.candidateDecision, "safe_provider_handoff_ready");
  assert.equal(summary.noBookingUrl, true);
  assert.equal(summary.noPayment, true);
  assert.equal(summary.noOrder, true);
  assert.equal(summary.noIdentityUpload, true);
  assert.equal(summary.redacted, true);

  const html = api.renderProviderConfirmationHandoffHtml(gate);
  assert.equal(html.includes("确认打开可信平台确认页"), true);
  assert.equal(html.includes("取消"), true);
  assert.equal(html.includes("bookingUrl"), true);
  assert.equal(html.includes("payment：blocked"), true);
  assert.equal(html.includes("order：blocked"), true);

  const audit = api.getProviderConfirmationHandoffUiAuditDraft(gate);
  assert.equal(audit.eventType, "PROVIDER_CONFIRMATION_HANDOFF_UI_DRAFT");
  assert.equal(audit.candidateDecision, "safe_provider_handoff_ready");
  assert.equal(audit.providerConfirmationLink, "confirmation_required");
  assert.equal(audit.continueButtonDisabled, false);
  assert.equal(audit.cancelButtonEnabled, true);
  assert.equal(audit.noAutoOpen, true);
  assert.equal(audit.noBookingUrl, true);
  assert.equal(audit.noPayment, true);
  assert.equal(audit.noOrder, true);
  assert.equal(audit.noIdentityUpload, true);
  assert.equal(audit.redacted, true);

  assert.equal(api.assertProviderConfirmationHandoffUiSafe(ui), true);
  assert.equal(JSON.stringify(ui).includes("bookingUrl"), true);
  assert.equal(JSON.stringify(ui).includes("safeProviderHandoffUrl"), true);

  console.log("PROVIDER_CONFIRMATION_HANDOFF_UI_CORE PASS");
}

main();
