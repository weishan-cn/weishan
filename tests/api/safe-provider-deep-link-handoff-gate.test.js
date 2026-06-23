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

async function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/safeProviderDeepLinkHandoffGate.js"]);
  const api = windowRef.WeishanSafeProviderDeepLinkHandoffGate;
  assert.equal(api.SAFE_PROVIDER_DEEP_LINK_HANDOFF_GATE_VERSION, "2.1.62");

  const safe = api.evaluateSafeProviderDeepLinkHandoff({
    providerId: "google_flights_search",
    providerName: "Google Flights",
    searchOnly: true,
    safeProviderHandoffUrl: "https://www.google.com/travel/flights"
  });
  assert.equal(safe.status, "confirmation_required");
  assert.equal(safe.candidateDecision, "safe_provider_handoff_ready");
  assert.equal(safe.providerConfirmationLink, "confirmation_required");
  assert.equal(safe.safeProviderHandoffUrl.startsWith("https://www.google.com/travel/flights"), true);
  assert.equal(safe.userConfirmationRequired, true);
  assert.equal(safe.autoOpen, false);
  assert.equal(safe.bookingUrl, null);
  assert.equal(safe.payment, "blocked");
  assert.equal(safe.checkout, "blocked");
  assert.equal(safe.order, "blocked");
  assert.equal(safe.identityUpload, "blocked");
  assert.equal(safe.realProvider, "disabled");
  assert.equal(safe.realNetwork, "disabled");
  assert.equal(safe.redacted, true);

  const blocked = api.evaluateSafeProviderDeepLinkHandoff({
    providerId: "unknown",
    providerName: "Unknown",
    searchOnly: true,
    safeProviderHandoffUrl: "http://bit.ly/should-block?apiKey=secret",
    restrictedCategory: true
  });
  assert.equal(blocked.candidateDecision, "blocked");
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.autoOpen, false);
  assert.equal(blocked.bookingUrl, null);
  assert.equal(blocked.providerConfirmationLink, "disabled");
  assert.equal(blocked.redacted, true);
  assert.equal(blocked.blockedReasons.includes("non-https blocked"), true);
  assert.equal(blocked.blockedReasons.includes("short URL blocked"), true);
  assert.equal(blocked.blockedReasons.includes("credential params blocked"), true);
  assert.equal(blocked.blockedReasons.includes("restricted category blocked"), true);

  const missingUrlBlocked = api.evaluateSafeProviderDeepLinkHandoff({
    providerId: "google_flights_search",
    providerName: "Google Flights",
    searchOnly: true
  });
  assert.equal(missingUrlBlocked.status, "blocked");
  assert.equal(missingUrlBlocked.providerConfirmationLink, "disabled");
  assert.equal(missingUrlBlocked.safeProviderHandoffUrl, null);
  assert.equal(missingUrlBlocked.blockedReasons.includes("missing safe provider handoff url"), true);

  const audit = api.getSafeProviderDeepLinkHandoffGateAuditDraft({ providerId: "google_flights_search", searchOnly: true, url: "https://www.google.com/travel/flights" });
  assert.equal(audit.eventType, "SAFE_PROVIDER_HANDOFF_URL_GATE_DRAFT");
  assert.equal(audit.userConfirmationRequired, true);
  assert.equal(audit.autoOpen, false);
  assert.equal(audit.safeProviderHandoffUrlDisplayedCount, 0);
  assert.equal(audit.bookingUrlDisplayedCount, 0);
  assert.equal(audit.paymentActionDisplayedCount, 0);
  assert.equal(audit.orderActionDisplayedCount, 0);
  assert.equal(audit.identityUploadAttemptCount, 0);
  assert.equal(audit.redacted, true);

  assert.equal(api.assertSafeProviderDeepLinkHandoffGateSafe(safe), true);
  assert.equal(JSON.stringify(safe).includes("bookingUrl"), true);
  assert.equal(JSON.stringify(safe).includes("safeProviderHandoffUrl"), true);
  assert.equal(JSON.stringify(safe).includes("rawApiKey"), false);
  assert.equal(typeof api.openTrustedProviderHandoffUrl, "function");

  const confirmationBlocked = await Promise.resolve(api.openTrustedProviderHandoffUrl("https://www.google.com/travel/flights"));
  assert.equal(confirmationBlocked.ok, false);
  assert.equal(confirmationBlocked.confirmed, false);
  assert.equal(confirmationBlocked.reason, "user_confirmation_required");

  windowRef.__WEISHAN_TEST_OPEN_EXTERNAL__ = () => ({ ok: true });
  const confirmationOpened = await Promise.resolve(api.openTrustedProviderHandoffUrl("https://www.google.com/travel/flights", { userConfirmed: true }));
  assert.equal(confirmationOpened.ok, true);
  assert.equal(confirmationOpened.confirmed, true);
  assert.equal(confirmationOpened.url.startsWith("https://www.google.com/travel/flights"), true);

  console.log("SAFE_PROVIDER_DEEP_LINK_HANDOFF_GATE_CORE PASS");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
