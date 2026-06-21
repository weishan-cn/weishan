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
  const windowRef = load(["apps/desktop/src/renderer/core/safeProviderDeepLinkHandoffGate.js"]);
  const api = windowRef.WeishanSafeProviderDeepLinkHandoffGate;
  assert.equal(api.SAFE_PROVIDER_DEEP_LINK_HANDOFF_GATE_VERSION, "2.1.41");

  const safe = api.evaluateSafeProviderDeepLinkHandoff({
    providerId: "google_flights_search",
    providerName: "Google Flights",
    searchOnly: true,
    url: "https://www.google.com/travel/flights"
  });
  assert.equal(safe.status, "skeleton only");
  assert.equal(safe.candidateDecision, "confirmation_stub");
  assert.equal(safe.providerConfirmationLink, "disabled");
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
    url: "http://bit.ly/should-block?apiKey=secret",
    restrictedCategory: true
  });
  assert.equal(blocked.candidateDecision, "blocked");
  assert.equal(blocked.autoOpen, false);
  assert.equal(blocked.bookingUrl, null);
  assert.equal(blocked.providerConfirmationLink, "disabled");
  assert.equal(blocked.redacted, true);
  assert.equal(blocked.blockedReasons.includes("non-https blocked"), true);
  assert.equal(blocked.blockedReasons.includes("short URL blocked"), true);
  assert.equal(blocked.blockedReasons.includes("credential params blocked"), true);
  assert.equal(blocked.blockedReasons.includes("restricted category blocked"), true);

  const audit = api.getSafeProviderDeepLinkHandoffGateAuditDraft({ providerId: "google_flights_search", searchOnly: true, url: "https://www.google.com/travel/flights" });
  assert.equal(audit.eventType, "SAFE_PROVIDER_DEEP_LINK_HANDOFF_GATE_DRAFT");
  assert.equal(audit.userConfirmationRequired, true);
  assert.equal(audit.autoOpen, false);
  assert.equal(audit.bookingUrlDisplayedCount, 0);
  assert.equal(audit.paymentActionDisplayedCount, 0);
  assert.equal(audit.orderActionDisplayedCount, 0);
  assert.equal(audit.identityUploadAttemptCount, 0);
  assert.equal(audit.redacted, true);

  assert.equal(api.assertSafeProviderDeepLinkHandoffGateSafe(safe), true);
  assert.equal(JSON.stringify(safe).includes("bookingUrl"), true);
  assert.equal(JSON.stringify(safe).includes("rawApiKey"), false);

  console.log("SAFE_PROVIDER_DEEP_LINK_HANDOFF_GATE_CORE PASS");
}

main();
