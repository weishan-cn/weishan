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
  const windowRef = load(["apps/desktop/src/renderer/core/realFlightPriceIntegrityGuard.js"]);
  const api = windowRef.WeishanRealFlightPriceIntegrityGuard;

  assert.equal(api.REAL_FLIGHT_PRICE_INTEGRITY_GUARD_VERSION, "2.1.72");

  const complete = api.evaluateRealFlightPriceIntegrity({
    providerId: "real_flight_fixture",
    providerName: "Real Flight Fixture",
    route: "上海 -> 成都",
    departureDate: "2026-07-15",
    currency: "CNY",
    baseFare: 860,
    taxesAndFees: 110,
    providerFees: 40,
    totalPrice: 1010,
    priceUpdatedAt: "2026-06-20T00:00:00.000Z",
    freshnessMinutes: 120,
    taxFeeIntegrityStatus: "complete",
    handoffCandidate: { providerConfirmationLink: "confirmation_required", safeProviderHandoffUrl: "https://www.google.com/travel/flights", redacted: true },
    redacted: true
  });
  assert.equal(complete.totalMatchesBreakdown, true);
  assert.equal(complete.taxFeeIntegrityStatus, "complete");
  assert.equal(complete.freshnessStatus, "fresh");
  assert.equal(complete.showableAsRealPrice, true);
  assert.equal(complete.showableAsCandidateEvidence, true);
  assert.equal(complete.userFacingCaveatRequired, true);
  assert.equal(complete.caveat, "价格、库存、税费和规则以平台页面为准。");

  const inconsistent = api.evaluateRealFlightPriceIntegrity({
    providerId: "real_flight_fixture",
    providerName: "Real Flight Fixture",
    route: "上海 -> 成都",
    departureDate: "2026-07-15",
    currency: "CNY",
    baseFare: 860,
    taxesAndFees: 110,
    providerFees: 40,
    totalPrice: 1009,
    priceUpdatedAt: "2026-06-20T00:00:00.000Z",
    freshnessMinutes: 120,
    handoffCandidate: { providerConfirmationLink: "confirmation_required", safeProviderHandoffUrl: "https://www.google.com/travel/flights", redacted: true },
    redacted: true
  });
  assert.equal(inconsistent.totalMatchesBreakdown, false);
  assert.equal(inconsistent.taxFeeIntegrityStatus, "inconsistent");
  assert.equal(inconsistent.showableAsRealPrice, false);

  const missingCurrency = api.evaluateRealFlightPriceIntegrity({
    providerId: "real_flight_fixture",
    providerName: "Real Flight Fixture",
    route: "上海 -> 成都",
    departureDate: "2026-07-15",
    baseFare: 860,
    taxesAndFees: 110,
    providerFees: 40,
    totalPrice: 1010,
    priceUpdatedAt: "2026-06-20T00:00:00.000Z",
    freshnessMinutes: 120,
    handoffCandidate: { providerConfirmationLink: "confirmation_required", safeProviderHandoffUrl: "https://www.google.com/travel/flights", redacted: true },
    redacted: true
  });
  assert.equal(missingCurrency.freshnessStatus, "fresh");
  assert.equal(missingCurrency.showableAsRealPrice, false);

  const stale = api.evaluateRealFlightPriceIntegrity({
    providerId: "real_flight_fixture",
    providerName: "Real Flight Fixture",
    route: "上海 -> 成都",
    departureDate: "2026-07-15",
    currency: "CNY",
    baseFare: 860,
    taxesAndFees: 110,
    providerFees: 40,
    totalPrice: 1010,
    priceUpdatedAt: "2026-06-20T00:00:00.000Z",
    freshnessMinutes: 2000,
    handoffCandidate: { providerConfirmationLink: "confirmation_required", safeProviderHandoffUrl: "https://www.google.com/travel/flights", redacted: true },
    redacted: true
  });
  assert.equal(stale.freshnessStatus, "stale");
  assert.equal(stale.showableAsRealPrice, false);
  assert.equal(stale.showableAsCandidateEvidence, true);

  const unknown = api.evaluateRealFlightPriceIntegrity({
    providerId: "real_flight_fixture",
    providerName: "Real Flight Fixture",
    route: "上海 -> 成都",
    departureDate: "2026-07-15",
    currency: "CNY",
    baseFare: 860,
    taxesAndFees: 110,
    providerFees: 40,
    totalPrice: 1010,
    priceUpdatedAt: "fixture_null_time",
    freshnessMinutes: null,
    handoffCandidate: { providerConfirmationLink: "confirmation_required", safeProviderHandoffUrl: "https://www.google.com/travel/flights", redacted: true },
    redacted: true
  });
  assert.equal(unknown.freshnessStatus, "unknown_fixture");
  assert.equal(unknown.showableAsRealPrice, false);
  assert.equal(unknown.showableAsCandidateEvidence, true);

  const summary = api.summarizeRealFlightPriceIntegrity(complete);
  assert.equal(summary.totalMatchesBreakdown, true);
  assert.equal(summary.showableAsCandidateEvidence, true);
  assert.equal(summary.redacted, true);

  const audit = api.buildRealFlightPriceIntegrityAuditDraft(complete);
  assert.equal(audit.eventType, "REAL_FLIGHT_PRICE_INTEGRITY_GUARD_DRAFT");
  assert.equal(audit.appVersion, "2.1.72");
  assert.equal(audit.bookingUrlDisplayedCount, 0);
  assert.equal(audit.paymentAttemptCount, 0);
  assert.equal(audit.orderAttemptCount, 0);
  assert.equal(audit.identityUploadAttemptCount, 0);
  assert.equal(audit.rawTokenDisplayedCount, 0);
  assert.equal(audit.rawApiKeyDisplayedCount, 0);
  assert.equal(audit.redacted, true);

  assert.equal(api.assertRealFlightPriceIntegrityGuardSafe(complete), true);

  console.log("REAL_FLIGHT_PRICE_INTEGRITY_GUARD_CORE PASS");
}

main();
