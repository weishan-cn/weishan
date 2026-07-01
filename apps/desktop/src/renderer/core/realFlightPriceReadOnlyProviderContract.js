;(function () {
  "use strict";

  const REAL_FLIGHT_PRICE_READ_ONLY_PROVIDER_CONTRACT_VERSION = "3.6.0";
  const CONTRACT_NAME = "real_flight_price_read_only_provider_contract_v1";
  const REQUIRED_RESPONSE_FIELDS = [
    "providerId",
    "providerName",
    "route",
    "departureDate",
    "currency",
    "baseFare",
    "taxesAndFees",
    "totalPrice",
    "priceUpdatedAt",
    "fareSource",
    "handoffCandidate"
  ];
  const FORBIDDEN_FIELDS = [
    "bookingUrl",
    "checkoutUrl",
    "paymentUrl",
    "orderUrl",
    "passport",
    "idCard",
    "bankCard",
    "token",
    "apiKey",
    "credentialValue"
  ];
  const ALLOWED_FARE_SOURCES = ["read_only_provider", "sandbox_read_only", "sandbox_read_only_stub", "sandbox_read_only_import", "fixture_read_only"];

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj || {}, key);
  }

  function number(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (value == null || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function normalizeRealFlightPriceProviderResponse(response) {
    const safe = response && typeof response === "object" ? response : {};
    const baseFare = number(safe.baseFare);
    const taxesAndFees = number(safe.taxesAndFees);
    const providerFees = hasOwn(safe, "providerFees") ? number(safe.providerFees) : 0;
    const totalPrice = number(safe.totalPrice);
    return clone({
      providerId: text(safe.providerId),
      providerName: text(safe.providerName),
      route: text(safe.route),
      departureDate: text(safe.departureDate),
      currency: text(safe.currency).toUpperCase(),
      baseFare: baseFare,
      taxesAndFees: taxesAndFees,
      providerFees: providerFees == null ? null : providerFees,
      totalPrice: totalPrice,
      priceUpdatedAt: text(safe.priceUpdatedAt),
      fareSource: text(safe.fareSource),
      handoffCandidate: clone(safe.handoffCandidate || null),
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      booking: false,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    });
  }

  function totalMatchesBreakdown(normalized) {
    const baseFare = number(normalized.baseFare);
    const taxesAndFees = number(normalized.taxesAndFees);
    const providerFees = hasOwn(normalized, "providerFees") ? number(normalized.providerFees) : 0;
    const totalPrice = number(normalized.totalPrice);
    if (baseFare == null || taxesAndFees == null || totalPrice == null) return false;
    const sum = baseFare + taxesAndFees + (providerFees == null ? 0 : providerFees);
    return Math.abs(totalPrice - sum) < 0.0001;
  }

  function validateRealFlightPriceProviderResponse(response) {
    const normalized = normalizeRealFlightPriceProviderResponse(response);
    const missingFields = REQUIRED_RESPONSE_FIELDS.filter((field) => !text(normalized[field]) && normalized[field] !== 0 && normalized[field] !== false && !(field === "handoffCandidate" && normalized[field] != null));
    const forbiddenFieldsPresent = FORBIDDEN_FIELDS.filter((field) => hasOwn(response || {}, field));
    const forbiddenFieldViolations = [];
    if (normalized.bookingUrl !== null || normalized.checkoutUrl !== null || normalized.paymentUrl !== null || normalized.orderUrl !== null) {
      forbiddenFieldViolations.push("bookingUrl/paymentUrl/checkoutUrl/orderUrl must stay null");
    }
    if (normalized.booking === true || normalized.payment === true || normalized.order === true || normalized.identityUpload === true) {
      forbiddenFieldViolations.push("booking/payment/order/identityUpload must stay false");
    }
    if (!ALLOWED_FARE_SOURCES.includes(normalized.fareSource)) {
      forbiddenFieldViolations.push("fareSource must be a read-only source");
    }
    if (!text(normalized.currency)) {
      forbiddenFieldViolations.push("currency must be present");
    }
    if (!text(normalized.priceUpdatedAt)) {
      forbiddenFieldViolations.push("priceUpdatedAt must be present");
    }
    const totalMatches = totalMatchesBreakdown(normalized);
    if (!totalMatches) {
      forbiddenFieldViolations.push("totalPrice must equal baseFare + taxesAndFees + providerFees");
    }
    if (normalized.handoffCandidate && normalized.handoffCandidate.redacted !== true) {
      forbiddenFieldViolations.push("handoffCandidate must stay redacted");
    }
    const validationDecision = forbiddenFieldsPresent.length || forbiddenFieldViolations.length || missingFields.length ? "blocked" : "pass";
    return clone({
      contractName: CONTRACT_NAME,
      appVersion: REAL_FLIGHT_PRICE_READ_ONLY_PROVIDER_CONTRACT_VERSION,
      mode: "read_only",
      readOnly: true,
      validationDecision: validationDecision,
      totalMatchesBreakdown: totalMatches,
      requiredResponseFields: REQUIRED_RESPONSE_FIELDS.slice(),
      forbiddenFields: FORBIDDEN_FIELDS.slice(),
      missingFields: missingFields,
      forbiddenFieldsPresent: forbiddenFieldsPresent,
      forbiddenFieldViolations: forbiddenFieldViolations,
      capabilities: {
        searchFlights: true,
        readPrice: true,
        readTaxesAndFees: true,
        readFreshness: true,
        booking: false,
        payment: false,
        order: false,
        identityUpload: false
      },
      booking: false,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true,
      normalizedResponse: normalized
    });
  }

  function buildRealFlightPriceProviderContractAuditDraft(response) {
    const validation = validateRealFlightPriceProviderResponse(response);
    return clone({
      eventType: "REAL_FLIGHT_PRICE_READ_ONLY_PROVIDER_CONTRACT_DRAFT",
      contractName: CONTRACT_NAME,
      appVersion: REAL_FLIGHT_PRICE_READ_ONLY_PROVIDER_CONTRACT_VERSION,
      mode: "read_only",
      readOnly: true,
      validationDecision: validation.validationDecision,
      totalMatchesBreakdown: validation.totalMatchesBreakdown,
      requiredResponseFieldCount: REQUIRED_RESPONSE_FIELDS.length,
      forbiddenFieldCount: FORBIDDEN_FIELDS.length,
      missingFieldCount: validation.missingFields.length,
      forbiddenFieldViolationCount: validation.forbiddenFieldViolations.length,
      bookingDisplayedCount: 0,
      paymentDisplayedCount: 0,
      orderDisplayedCount: 0,
      identityUploadDisplayedCount: 0,
      rawTokenDisplayedCount: 0,
      rawApiKeyDisplayedCount: 0,
      redacted: true
    });
  }

  function getRealFlightPriceReadOnlyProviderContract() {
    return clone({
      contractName: CONTRACT_NAME,
      appVersion: REAL_FLIGHT_PRICE_READ_ONLY_PROVIDER_CONTRACT_VERSION,
      mode: "read_only",
      readOnly: true,
      capabilities: {
        searchFlights: true,
        readPrice: true,
        readTaxesAndFees: true,
        readFreshness: true,
        booking: false,
        payment: false,
        order: false,
        identityUpload: false
      },
      requiredResponseFields: REQUIRED_RESPONSE_FIELDS.slice(),
      forbiddenFields: FORBIDDEN_FIELDS.slice(),
      redacted: true
    });
  }

  function assertRealFlightPriceReadOnlyProviderContractSafe(value) {
    const contract = value && typeof value === "object" ? value : getRealFlightPriceReadOnlyProviderContract();
    const caps = contract.capabilities || {};
    if (contract.redacted !== true) throw new Error("real flight price provider contract must stay redacted");
    if (contract.readOnly !== true || contract.mode !== "read_only") throw new Error("real flight price provider contract must stay read only");
    if (caps.booking !== false || caps.payment !== false || caps.order !== false || caps.identityUpload !== false) throw new Error("real flight price provider contract must block booking/payment/order/identity upload");
    if (contract.requiredResponseFields.indexOf("priceUpdatedAt") === -1) throw new Error("real flight price provider contract must require priceUpdatedAt");
    if (contract.forbiddenFields.indexOf("bookingUrl") === -1 || contract.forbiddenFields.indexOf("apiKey") === -1) throw new Error("real flight price provider contract must keep forbidden fields");
    return true;
  }

  window.WeishanRealFlightPriceReadOnlyProviderContract = {
    REAL_FLIGHT_PRICE_READ_ONLY_PROVIDER_CONTRACT_VERSION,
    getRealFlightPriceReadOnlyProviderContract,
    validateRealFlightPriceProviderResponse,
    normalizeRealFlightPriceProviderResponse,
    buildRealFlightPriceProviderContractAuditDraft,
    assertRealFlightPriceReadOnlyProviderContractSafe
  };
})();
