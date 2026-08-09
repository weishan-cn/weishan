;(function () {
  "use strict";

  function error(code, stage, userMessage, detailsSummary) {
    return Object.freeze({ success:false, error:Object.freeze({ code, stage, recoverable:true, userMessage, detailsSummary }) });
  }

  function guard(input) {
    const api = window.WeishanGlobalCommerceInputGuard;
    return api && typeof api.guardAndCloneCommerceInput === "function"
      ? api.guardAndCloneCommerceInput(input)
      : error("COMMERCE_INPUT_REJECTED", "INPUT_GUARD", "Commerce input could not be processed safely.", "The commerce input did not satisfy the public boundary contract.");
  }

  function pricingAssessment(value) {
    const pricing = window.WeishanGlobalCommercePricing;
    if (!pricing) return error("COMMERCE_ASSESSMENT_UNAVAILABLE", "ASSESSMENT", "Commerce assessment is unavailable.", "Pricing Core is not loaded.");
    if (Array.isArray(value)) return pricing.createPricingAssessment({ snapshots:value });
    if (value && typeof value === "object" && Array.isArray(value.snapshots)) return pricing.createPricingAssessment({ snapshots:value.snapshots });
    const result = pricing.createPriceSnapshot(value);
    if (!result.success) return result;
    return Object.freeze({
      success:true,
      pricing:Object.freeze({
        comparable:true,
        currency:result.snapshot.currency,
        snapshots:Object.freeze([result.snapshot]),
        cheapest:result.snapshot,
        bestPrice:result.snapshot,
        reasonCodes:Object.freeze([])
      })
    });
  }

  function createCommerceAssessment(input) {
    const checked = guard(input);
    if (!checked.success) return checked;
    const source = checked.value;
    if (!source || typeof source !== "object" || Array.isArray(source)) return error("COMMERCE_ASSESSMENT_INPUT_INVALID", "ASSESSMENT", "Commerce assessment input is invalid.", "Pricing and availability inputs are required.");

    const pricing = pricingAssessment(source.pricing);
    if (!pricing.success) return pricing;

    const availabilityApi = window.WeishanGlobalCommerceAvailability;
    if (!availabilityApi) return error("COMMERCE_ASSESSMENT_UNAVAILABLE", "ASSESSMENT", "Commerce assessment is unavailable.", "Availability Core is not loaded.");
    const availabilityInput = Object.assign({}, source.availability || {});
    if (source.requestedRegion !== undefined) availabilityInput.requestedRegion = source.requestedRegion;
    const availability = availabilityApi.createAvailabilitySnapshot(availabilityInput);
    if (!availability.success) return availability;

    const bestPrice = pricing.pricing.bestPrice;
    return Object.freeze({
      success:true,
      pricing:pricing.pricing,
      availability:availability.snapshot,
      commerceState:Object.freeze({
        priceValid:true,
        availabilityValid:true,
        comparable:pricing.pricing.comparable,
        purchasable:availability.snapshot.purchasable,
        currency:bestPrice ? bestPrice.currency : null,
        effectivePrice:bestPrice ? bestPrice.effectivePrice : null,
        availabilityStatus:availability.snapshot.status,
        reasonCodes:availability.snapshot.reasonCodes
      })
    });
  }

  window.WeishanGlobalCommerceAssessment = Object.freeze({ createCommerceAssessment });
})();
