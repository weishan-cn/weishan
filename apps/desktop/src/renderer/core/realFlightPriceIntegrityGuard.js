;(function () {
  "use strict";

  const REAL_FLIGHT_PRICE_INTEGRITY_GUARD_VERSION = "4.2.7";
  const CAVEAT = "价格、库存、税费和规则以平台页面为准。";
  const STALE_MINUTES = 24 * 60;

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function isIntegrityObject(value) {
    return !!(value && typeof value === "object" && value.integrityName === "real_flight_price_integrity_guard_v1" && "showableAsRealPrice" in value && "showableAsCandidateEvidence" in value);
  }

  function evaluateRealFlightPriceIntegrity(priceQuoteInput) {
    const priceQuote = priceQuoteInput && typeof priceQuoteInput === "object" ? priceQuoteInput : {};
    const baseFare = number(priceQuote.baseFare);
    const taxesAndFees = number(priceQuote.taxesAndFees);
    const providerFees = priceQuote.providerFees == null || priceQuote.providerFees === "" ? 0 : number(priceQuote.providerFees);
    const totalPrice = number(priceQuote.totalPrice);
    const currency = text(priceQuote.currency);
    const priceUpdatedAt = text(priceQuote.priceUpdatedAt);
    const freshnessMinutes = priceQuote.freshnessMinutes == null || priceQuote.freshnessMinutes === "" ? null : number(priceQuote.freshnessMinutes);
    const breakdownTotal = (baseFare == null || taxesAndFees == null || totalPrice == null || providerFees == null) ? null : baseFare + taxesAndFees + providerFees;
    const totalMatchesBreakdown = breakdownTotal !== null ? Math.abs(totalPrice - breakdownTotal) < 0.0001 : false;
    const hasCompleteTaxFee = baseFare != null && taxesAndFees != null && providerFees != null;
    let taxFeeIntegrityStatus = "incomplete";
    if (baseFare == null || taxesAndFees == null || totalPrice == null) {
      taxFeeIntegrityStatus = "inconsistent";
    } else if (hasCompleteTaxFee && totalMatchesBreakdown) {
      taxFeeIntegrityStatus = "complete";
    } else if (!totalMatchesBreakdown) {
      taxFeeIntegrityStatus = "inconsistent";
    }
    let freshnessStatus = "unknown_fixture";
    if (!priceUpdatedAt || priceUpdatedAt === "fixture_null_time") {
      freshnessStatus = "unknown_fixture";
    } else if (freshnessMinutes == null) {
      freshnessStatus = "unknown_fixture";
    } else if (freshnessMinutes < 0 || !Number.isFinite(freshnessMinutes)) {
      freshnessStatus = "invalid";
    } else if (freshnessMinutes <= STALE_MINUTES) {
      freshnessStatus = "fresh";
    } else {
      freshnessStatus = "stale";
    }
    const showableAsRealPrice = totalMatchesBreakdown && taxFeeIntegrityStatus === "complete" && freshnessStatus === "fresh" && !!currency;
    const showableAsCandidateEvidence = totalMatchesBreakdown && taxFeeIntegrityStatus !== "inconsistent" && freshnessStatus !== "invalid";
    return clone({
      integrityName: "real_flight_price_integrity_guard_v1",
      appVersion: REAL_FLIGHT_PRICE_INTEGRITY_GUARD_VERSION,
      totalMatchesBreakdown: totalMatchesBreakdown,
      taxFeeIntegrityStatus: taxFeeIntegrityStatus,
      freshnessStatus: freshnessStatus,
      showableAsRealPrice: showableAsRealPrice,
      showableAsCandidateEvidence: showableAsCandidateEvidence,
      userFacingCaveatRequired: true,
      caveat: CAVEAT,
      redacted: true
    });
  }

  function summarizeRealFlightPriceIntegrity(priceQuoteInput) {
    const integrity = isIntegrityObject(priceQuoteInput) ? clone(priceQuoteInput) : evaluateRealFlightPriceIntegrity(priceQuoteInput);
    return clone({
      integrityName: integrity.integrityName,
      appVersion: integrity.appVersion,
      totalMatchesBreakdown: integrity.totalMatchesBreakdown,
      taxFeeIntegrityStatus: integrity.taxFeeIntegrityStatus,
      freshnessStatus: integrity.freshnessStatus,
      showableAsRealPrice: integrity.showableAsRealPrice,
      showableAsCandidateEvidence: integrity.showableAsCandidateEvidence,
      userFacingCaveatRequired: integrity.userFacingCaveatRequired,
      caveat: integrity.caveat,
      redacted: true
    });
  }

  function buildRealFlightPriceIntegrityAuditDraft(priceQuoteInput) {
    const integrity = isIntegrityObject(priceQuoteInput) ? clone(priceQuoteInput) : evaluateRealFlightPriceIntegrity(priceQuoteInput);
    return clone({
      eventType: "REAL_FLIGHT_PRICE_INTEGRITY_GUARD_DRAFT",
      integrityName: integrity.integrityName,
      appVersion: REAL_FLIGHT_PRICE_INTEGRITY_GUARD_VERSION,
      totalMatchesBreakdown: integrity.totalMatchesBreakdown,
      taxFeeIntegrityStatus: integrity.taxFeeIntegrityStatus,
      freshnessStatus: integrity.freshnessStatus,
      showableAsRealPrice: integrity.showableAsRealPrice,
      showableAsCandidateEvidence: integrity.showableAsCandidateEvidence,
      userFacingCaveatRequired: integrity.userFacingCaveatRequired,
      caveat: integrity.caveat,
      bookingUrlDisplayedCount: 0,
      paymentAttemptCount: 0,
      orderAttemptCount: 0,
      identityUploadAttemptCount: 0,
      rawTokenDisplayedCount: 0,
      rawApiKeyDisplayedCount: 0,
      redacted: true
    });
  }

  function assertRealFlightPriceIntegrityGuardSafe(value) {
    const integrity = value && typeof value === "object" ? value : evaluateRealFlightPriceIntegrity({ baseFare: 860, taxesAndFees: 110, providerFees: 40, totalPrice: 1010, currency: "CNY", priceUpdatedAt: "2026-06-20T00:00:00.000Z", freshnessMinutes: 120 });
    if (integrity.redacted !== true) throw new Error("real flight price integrity guard must stay redacted");
    if (integrity.userFacingCaveatRequired !== true) throw new Error("real flight price integrity guard must require caveat");
    if (integrity.caveat !== CAVEAT) throw new Error("real flight price integrity guard must keep caveat");
    return true;
  }

  window.WeishanRealFlightPriceIntegrityGuard = {
    REAL_FLIGHT_PRICE_INTEGRITY_GUARD_VERSION,
    evaluateRealFlightPriceIntegrity,
    summarizeRealFlightPriceIntegrity,
    buildRealFlightPriceIntegrityAuditDraft,
    assertRealFlightPriceIntegrityGuardSafe
  };
})();
