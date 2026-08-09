;(function () {
  "use strict";

  const STATUSES = Object.freeze(["IN_STOCK", "LIMITED", "OUT_OF_STOCK", "PREORDER", "BACKORDER", "UNKNOWN"]);
  const RANK = Object.freeze({ IN_STOCK:0, LIMITED:1, PREORDER:2, BACKORDER:3, UNKNOWN:4, OUT_OF_STOCK:5 });

  function error(code, stage, userMessage, detailsSummary) {
    return Object.freeze({ success:false, error:Object.freeze({ code, stage, recoverable:true, userMessage, detailsSummary }) });
  }

  function guard(input) {
    const api = window.WeishanGlobalCommerceInputGuard;
    return api && typeof api.guardAndCloneCommerceInput === "function"
      ? api.guardAndCloneCommerceInput(input)
      : error("COMMERCE_INPUT_REJECTED", "INPUT_GUARD", "Commerce input could not be processed safely.", "The commerce input did not satisfy the public boundary contract.");
  }

  function own(object, key) { return Object.prototype.hasOwnProperty.call(object, key); }
  function boolean(value, fallback) { return value === undefined ? fallback : (typeof value === "boolean" ? value : null); }
  function region(value) { return typeof value === "string" && value.trim() ? value.trim().toUpperCase() : null; }

  function regions(value) {
    if (value === undefined) return Object.freeze([]);
    if (!Array.isArray(value)) return null;
    const output = [];
    for (const item of value) {
      const normalized = region(item);
      if (!normalized) return null;
      if (output.indexOf(normalized) < 0) output.push(normalized);
    }
    return Object.freeze(output);
  }

  function delivery(value) {
    if (value === undefined || value === null) return null;
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const minDays = value.minDays;
    const maxDays = value.maxDays;
    if (!Number.isSafeInteger(minDays) || !Number.isSafeInteger(maxDays) || minDays < 0 || maxDays < 0 || minDays > maxDays) return false;
    return Object.freeze({ minDays, maxDays });
  }

  function decide(snapshot) {
    const restricted = snapshot.regionRestricted;
    const requested = snapshot.requestedRegion;
    if (restricted && !requested) return Object.freeze({ purchasable:false, reasonCodes:Object.freeze(["REGION_REQUIRED"]) });
    if (restricted && snapshot.blockedRegions.indexOf(requested) >= 0) return Object.freeze({ purchasable:false, reasonCodes:Object.freeze(["REGION_BLOCKED"]) });
    if (restricted && snapshot.allowedRegions.length && snapshot.allowedRegions.indexOf(requested) < 0) return Object.freeze({ purchasable:false, reasonCodes:Object.freeze(["REGION_NOT_ALLOWED"]) });
    if (!snapshot.shippingAvailable) return Object.freeze({ purchasable:false, reasonCodes:Object.freeze(["SHIPPING_UNAVAILABLE"]) });
    if (snapshot.status === "OUT_OF_STOCK") return Object.freeze({ purchasable:false, reasonCodes:Object.freeze(["OUT_OF_STOCK"]) });
    if (snapshot.status === "PREORDER") return Object.freeze({ purchasable:true, reasonCodes:Object.freeze(["PREORDER_AVAILABLE"]) });
    if (snapshot.status === "BACKORDER") return Object.freeze({ purchasable:true, reasonCodes:Object.freeze(["BACKORDER_AVAILABLE"]) });
    if (snapshot.status === "LIMITED") return Object.freeze({ purchasable:true, reasonCodes:Object.freeze(["LIMITED_STOCK"]) });
    if (snapshot.status === "IN_STOCK") return Object.freeze({ purchasable:true, reasonCodes:Object.freeze(["IN_STOCK"]) });
    return Object.freeze({ purchasable:false, reasonCodes:Object.freeze(["AVAILABILITY_UNKNOWN"]) });
  }

  function createAvailabilitySnapshot(input) {
    const checked = guard(input);
    if (!checked.success) return checked;
    const source = checked.value;
    if (!source || typeof source !== "object" || Array.isArray(source)) return error("AVAILABILITY_INPUT_INVALID", "AVAILABILITY", "Availability input is invalid.", "Availability snapshot must be an object.");

    const status = source.status;
    if (typeof status !== "string" || STATUSES.indexOf(status) < 0) return error("AVAILABILITY_STATUS_INVALID", "AVAILABILITY", "Availability status is invalid.", "Availability status must use a supported declared value.");
    const quantity = own(source, "quantity") ? source.quantity : null;
    if (quantity !== null && (!Number.isSafeInteger(quantity) || quantity < 0)) return error("AVAILABILITY_INPUT_INVALID", "AVAILABILITY", "Availability quantity is invalid.", "Quantity must be null or a non-negative safe integer.");

    const regionRestricted = boolean(source.regionRestricted, false);
    const shippingAvailable = boolean(source.shippingAvailable, null);
    const preorder = boolean(source.preorder, false);
    const backorder = boolean(source.backorder, false);
    const requestedRegion = own(source, "requestedRegion") ? region(source.requestedRegion) : null;
    const allowedRegions = regions(source.allowedRegions);
    const blockedRegions = regions(source.blockedRegions);
    const estimatedDelivery = delivery(source.estimatedDelivery);
    if (regionRestricted === null || shippingAvailable === null || preorder === null || backorder === null || (own(source, "requestedRegion") && !requestedRegion) || !allowedRegions || !blockedRegions || estimatedDelivery === false) return error("AVAILABILITY_INPUT_INVALID", "AVAILABILITY", "Availability input is invalid.", "Availability fields must use the declared offline contract.");

    if (status === "OUT_OF_STOCK" && (quantity !== null && quantity > 0)) return error("AVAILABILITY_CONFLICT", "AVAILABILITY", "Availability fields conflict.", "Out of stock cannot have positive quantity.");
    if (status === "IN_STOCK" && quantity !== null && quantity === 0) return error("AVAILABILITY_CONFLICT", "AVAILABILITY", "Availability fields conflict.", "In stock requires positive quantity when quantity is declared.");
    if (status === "PREORDER" && !preorder) return error("AVAILABILITY_CONFLICT", "AVAILABILITY", "Availability fields conflict.", "Preorder status requires preorder.");
    if (status === "BACKORDER" && !backorder) return error("AVAILABILITY_CONFLICT", "AVAILABILITY", "Availability fields conflict.", "Backorder status requires backorder.");
    if (preorder && backorder) return error("AVAILABILITY_CONFLICT", "AVAILABILITY", "Availability fields conflict.", "Preorder and backorder cannot both be true.");

    const declared = Object.freeze({ status, quantity, regionRestricted, requestedRegion, allowedRegions, blockedRegions, shippingAvailable, preorder, backorder, estimatedDelivery });
    const outcome = decide(declared);
    return Object.freeze({ success:true, snapshot:Object.freeze(Object.assign({}, declared, outcome)) });
  }

  function validateAvailabilitySnapshot(input) { return createAvailabilitySnapshot(input); }

  function determinePurchasability(input) {
    const result = createAvailabilitySnapshot(input);
    return result.success
      ? Object.freeze({ success:true, purchasable:result.snapshot.purchasable, status:result.snapshot.status, reasonCodes:result.snapshot.reasonCodes, estimatedDelivery:result.snapshot.estimatedDelivery })
      : result;
  }

  function compareAvailabilitySnapshots(input) {
    const checked = guard(input);
    if (!checked.success) return checked;
    if (!Array.isArray(checked.value)) return error("AVAILABILITY_INPUT_INVALID", "COMPARISON", "Availability comparison input is invalid.", "Availability comparison requires an array.");
    const snapshots = [];
    for (const source of checked.value) {
      const result = createAvailabilitySnapshot(source);
      if (!result.success) return result;
      snapshots.push(result.snapshot);
    }
    const ordered = snapshots.map(function (snapshot, index) { return { snapshot, index }; }).sort(function (left, right) {
      return Number(right.snapshot.purchasable) - Number(left.snapshot.purchasable) || RANK[left.snapshot.status] - RANK[right.snapshot.status] || left.index - right.index;
    }).map(function (entry) { return entry.snapshot; });
    return Object.freeze({ success:true, snapshots:Object.freeze(ordered) });
  }

  function createAvailabilityAssessment(input) {
    const result = createAvailabilitySnapshot(input);
    return result.success ? Object.freeze({ success:true, availability:result.snapshot }) : result;
  }

  window.WeishanGlobalCommerceAvailability = Object.freeze({
    STATUSES,
    createAvailabilitySnapshot,
    validateAvailabilitySnapshot,
    determinePurchasability,
    compareAvailabilitySnapshots,
    createAvailabilityAssessment
  });
})();
