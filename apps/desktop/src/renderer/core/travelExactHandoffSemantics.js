;(function () {
  "use strict";

  const VERSION = "4.3.4";
  const MODULE_NAME = "travel_exact_handoff_semantics_v1";

  const QUALITY = Object.freeze({
    FLIGHT:["EXACT_OFFER_HANDOFF", "EXACT_ITINERARY_HANDOFF", "EXACT_SEARCH_RECONSTRUCTION", "ROUTE_SEARCH", "GENERIC_HOME", "NO_HANDOFF"],
    HOTEL:["EXACT_RATE_HANDOFF", "EXACT_STAY_HANDOFF", "EXACT_PROPERTY_HANDOFF", "PROPERTY_SEARCH", "OTA_SEARCH", "GENERIC_HOME", "NO_HANDOFF"],
    CRUISE:["EXACT_SAILING_CABIN_HANDOFF", "EXACT_SAILING_HANDOFF", "ITINERARY_SEARCH_HANDOFF", "CRUISE_SEARCH_HANDOFF", "GENERIC_HOME", "NO_HANDOFF"]
  });

  const STRENGTH = Object.freeze({
    STRONG:"STRONG",
    PARTIAL:"PARTIAL",
    WEAK:"WEAK",
    NONE:"NONE"
  });

  const TRANSACTION_PATH = /\/(?:book|booking|checkout|payment|pay|order|reservation|reserve)(?:\/|$|[?#])/i;

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function upper(value) {
    return text(value).toUpperCase();
  }

  function bool(value) {
    return value === true;
  }

  function boundary() {
    return {
      executionGate:"CLOSED",
      authorizesExecution:false,
      productionTraffic:false,
      productionAffected:false,
      BOOKING:false,
      ORDER:false,
      PAYMENT:false,
      TICKETING:false,
      WEISHAN_PAYS_PROVIDER:false,
      PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false
    };
  }

  function safeUrl(value, allowedHosts) {
    const raw = text(value);
    if (!raw) return { ok:false, reason:"NO_URL", host:null, url:null };
    try {
      const url = new URL(raw);
      const host = url.hostname.toLowerCase();
      const allowed = Array.isArray(allowedHosts) ? allowedHosts.map(function (item) { return text(item).toLowerCase(); }).filter(Boolean) : [];
      if (url.protocol !== "https:") return { ok:false, reason:"UNSAFE_PROTOCOL", host:host, url:null };
      if (/^(\d+\.){3}\d+$/.test(host) || host === "localhost") return { ok:false, reason:"UNSAFE_HOST", host:host, url:null };
      if (TRANSACTION_PATH.test(url.pathname)) return { ok:false, reason:"TRANSACTION_PATH_BLOCKED", host:host, url:null };
      if (allowed.length && allowed.indexOf(host) < 0) return { ok:false, reason:"HOST_NOT_ALLOWED", host:host, url:null };
      return { ok:true, reason:null, host:host, url:raw };
    } catch (error) {
      return { ok:false, reason:"INVALID_URL", host:null, url:null };
    }
  }

  function qualityFor(type, requested, context) {
    const normalizedType = upper(type);
    const requestedQuality = upper(requested);
    if (!QUALITY[normalizedType] || QUALITY[normalizedType].indexOf(requestedQuality) < 0) return "NO_HANDOFF";
    if (requestedQuality === "NO_HANDOFF") return "NO_HANDOFF";
    if (requestedQuality === "GENERIC_HOME") return "GENERIC_HOME";

    const ctx = context || {};
    if (normalizedType === "FLIGHT") {
      if ((requestedQuality === "EXACT_OFFER_HANDOFF" || requestedQuality === "EXACT_ITINERARY_HANDOFF") &&
        bool(ctx.offerPreserved) && bool(ctx.originPreserved) && bool(ctx.destinationPreserved) && bool(ctx.departureDatePreserved) &&
        bool(ctx.passengersPreserved) && bool(ctx.cabinPreserved)) return requestedQuality;
      if (requestedQuality === "EXACT_SEARCH_RECONSTRUCTION" && bool(ctx.originPreserved) && bool(ctx.destinationPreserved) &&
        bool(ctx.departureDatePreserved) && bool(ctx.passengersPreserved) && bool(ctx.cabinPreserved)) return requestedQuality;
      if (bool(ctx.originPreserved) && bool(ctx.destinationPreserved)) return "ROUTE_SEARCH";
      return "GENERIC_HOME";
    }

    if (normalizedType === "HOTEL") {
      if (requestedQuality === "EXACT_RATE_HANDOFF" && bool(ctx.propertyPreserved) && bool(ctx.checkInPreserved) &&
        bool(ctx.checkOutPreserved) && bool(ctx.occupancyPreserved) && bool(ctx.roomPreserved) && bool(ctx.ratePreserved)) return requestedQuality;
      if (requestedQuality === "EXACT_STAY_HANDOFF" && bool(ctx.propertyPreserved) && bool(ctx.checkInPreserved) &&
        bool(ctx.checkOutPreserved) && bool(ctx.occupancyPreserved)) return requestedQuality;
      if (bool(ctx.propertyPreserved)) return "EXACT_PROPERTY_HANDOFF";
      if (bool(ctx.locationPreserved)) return "PROPERTY_SEARCH";
      return "GENERIC_HOME";
    }

    if (normalizedType === "CRUISE") {
      if (requestedQuality === "EXACT_SAILING_CABIN_HANDOFF" && bool(ctx.sailingPreserved) && bool(ctx.shipPreserved) &&
        bool(ctx.departureDatePreserved) && bool(ctx.occupancyPreserved) && bool(ctx.cabinCategoryPreserved)) return requestedQuality;
      if ((requestedQuality === "EXACT_SAILING_HANDOFF" || requestedQuality === "EXACT_SAILING_CABIN_HANDOFF") &&
        bool(ctx.sailingPreserved) && bool(ctx.shipPreserved) && bool(ctx.departureDatePreserved)) return "EXACT_SAILING_HANDOFF";
      if (bool(ctx.itineraryPreserved) || bool(ctx.departurePortPreserved)) return "ITINERARY_SEARCH_HANDOFF";
      return "CRUISE_SEARCH_HANDOFF";
    }

    return "NO_HANDOFF";
  }

  function strengthFor(type, quality) {
    const normalizedType = upper(type);
    if (quality === "NO_HANDOFF") return STRENGTH.NONE;
    if (quality === "GENERIC_HOME") return STRENGTH.NONE;
    if (normalizedType === "FLIGHT") {
      if (quality === "EXACT_OFFER_HANDOFF" || quality === "EXACT_ITINERARY_HANDOFF") return STRENGTH.STRONG;
      if (quality === "EXACT_SEARCH_RECONSTRUCTION") return STRENGTH.PARTIAL;
      if (quality === "ROUTE_SEARCH") return STRENGTH.WEAK;
    }
    if (normalizedType === "HOTEL") {
      if (quality === "EXACT_RATE_HANDOFF" || quality === "EXACT_STAY_HANDOFF") return STRENGTH.STRONG;
      if (quality === "EXACT_PROPERTY_HANDOFF") return STRENGTH.PARTIAL;
      if (quality === "PROPERTY_SEARCH" || quality === "OTA_SEARCH") return STRENGTH.WEAK;
    }
    if (normalizedType === "CRUISE") {
      if (quality === "EXACT_SAILING_CABIN_HANDOFF") return STRENGTH.STRONG;
      if (quality === "EXACT_SAILING_HANDOFF") return STRENGTH.PARTIAL;
      if (quality === "ITINERARY_SEARCH_HANDOFF" || quality === "CRUISE_SEARCH_HANDOFF") return STRENGTH.WEAK;
    }
    return STRENGTH.NONE;
  }

  function classifyTravelHandoff(input) {
    const source = input || {};
    const travelType = upper(source.travelType);
    const checked = safeUrl(source.handoffUrl, source.allowedHosts);
    if (!QUALITY[travelType]) {
      return deepFreeze(Object.assign({ moduleName:MODULE_NAME, version:VERSION, success:false, code:"UNSUPPORTED_TRAVEL_TYPE", travelType:travelType || null }, boundary()));
    }
    if (!checked.ok) {
      return deepFreeze(Object.assign({
        moduleName:MODULE_NAME,
        version:VERSION,
        success:true,
        travelType:travelType,
        handoffQuality:"NO_HANDOFF",
        strength:STRENGTH.NONE,
        url:null,
        host:checked.host,
        safe:false,
        downgraded:true,
        downgradeReason:checked.reason,
        ephemeral:bool(source.ephemeral),
        autoOpen:false
      }, boundary()));
    }
    const quality = qualityFor(travelType, source.requestedQuality, source.context || {});
    return deepFreeze(Object.assign({
      moduleName:MODULE_NAME,
      version:VERSION,
      success:true,
      travelType:travelType,
      handoffQuality:quality,
      strength:strengthFor(travelType, quality),
      url:quality === "NO_HANDOFF" || quality === "GENERIC_HOME" ? null : checked.url,
      host:checked.host,
      safe:quality !== "NO_HANDOFF" && quality !== "GENERIC_HOME",
      downgraded:quality !== upper(source.requestedQuality),
      downgradeReason:quality !== upper(source.requestedQuality) ? "CONTEXT_LOSS" : null,
      ephemeral:bool(source.ephemeral),
      autoOpen:false
    }, boundary()));
  }

  function buildExactHandoffMatrix() {
    return deepFreeze(Object.assign({
      moduleName:MODULE_NAME,
      version:VERSION,
      status:"READY",
      flight:["exact offer", "exact itinerary", "search reconstruction", "lost date/passenger/cabin downgrade", "generic home is none", "unsafe URL blocked"],
      hotel:["exact rate", "exact stay", "property only downgrade", "lost dates/occupancy downgrade", "generic OTA home is none", "unsafe URL blocked"],
      cruise:["exact sailing cabin", "exact sailing only", "wrong date/cabin downgrade", "generic cruise line home is none", "unsafe URL blocked"],
      noAutoBooking:true
    }, boundary()));
  }

  window.WeishanTravelExactHandoffSemantics = Object.freeze({
    VERSION,
    MODULE_NAME,
    QUALITY,
    STRENGTH,
    classifyTravelHandoff,
    buildExactHandoffMatrix
  });
})();
