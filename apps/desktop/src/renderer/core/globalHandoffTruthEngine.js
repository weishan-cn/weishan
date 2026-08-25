;(function () {
  "use strict";

  const VERSION = "4.2.8";
  const MODULE_NAME = "global_handoff_truth_engine_v1";
  const MAX_URL_LENGTH = 4096;
  const REDIRECT_KEYS = new Set(["redirect", "redirecturi", "redirecturl", "return", "returnurl", "next", "continue", "url", "target", "destination"]);
  const SECRET_KEY_RE = /(?:^|[_-])(api[_-]?key|apikey|token|access[_-]?token|refresh[_-]?token|secret|client[_-]?secret|authorization|password|session|signature|x[_-]?signature)(?:$|[_-])/i;
  const TRANSACTION_SEGMENTS = new Set(["book", "booking", "checkout", "payment", "pay", "order", "purchase", "reserve", "reservation", "ticket", "confirm-order", "confirmorder"]);
  const TRANSACTION_QUERY_KEYS = new Set(["checkout", "payment", "pay", "order", "purchase", "book", "booking", "reserve", "reservation", "ticket"]);
  const PRIVATE_IPV4_RANGES = [
    [10, 0, 0, 0, 10, 255, 255, 255],
    [127, 0, 0, 0, 127, 255, 255, 255],
    [169, 254, 0, 0, 169, 254, 255, 255],
    [172, 16, 0, 0, 172, 31, 255, 255],
    [192, 168, 0, 0, 192, 168, 255, 255],
    [0, 0, 0, 0, 0, 255, 255, 255]
  ];

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function lower(value) {
    return text(value).toLowerCase();
  }

  function arr(value) {
    return Array.isArray(value) ? value : [];
  }

  function add(reasons, reason) {
    if (reason && reasons.indexOf(reason) < 0) reasons.push(reason);
  }

  function normalizeHost(value) {
    return lower(value).replace(/\.$/, "");
  }

  function hostMatches(host, expectedHosts) {
    const normalized = normalizeHost(host);
    const hosts = arr(expectedHosts).map(normalizeHost).filter(Boolean);
    if (!hosts.length) return true;
    return hosts.some(function (expected) {
      return normalized === expected || normalized.endsWith("." + expected);
    });
  }

  function ipv4Number(parts) {
    return (((parts[0] * 256) + parts[1]) * 256 + parts[2]) * 256 + parts[3];
  }

  function isPrivateIpv4(host) {
    const parts = host.split(".").map(function (part) { return Number(part); });
    if (parts.length !== 4 || parts.some(function (part) { return !Number.isInteger(part) || part < 0 || part > 255; })) return false;
    const value = ipv4Number(parts);
    return PRIVATE_IPV4_RANGES.some(function (range) {
      return value >= ipv4Number(range.slice(0, 4)) && value <= ipv4Number(range.slice(4, 8));
    });
  }

  function isPrivateHost(host) {
    const normalized = normalizeHost(host);
    if (!normalized) return true;
    if (normalized === "localhost" || normalized.endsWith(".localhost")) return true;
    if (isPrivateIpv4(normalized)) return true;
    if (normalized === "::1" || normalized === "[::1]") return true;
    if (/^(fc|fd|fe80):/i.test(normalized.replace(/^\[|\]$/g, ""))) return true;
    return false;
  }

  function decodeBounded(value, depth) {
    let current = text(value);
    const seen = new Set([current]);
    for (let index = 0; index < (depth || 2); index += 1) {
      try {
        const next = decodeURIComponent(current);
        if (next === current || seen.has(next)) break;
        current = next;
        seen.add(current);
      } catch (_) {
        break;
      }
    }
    return current;
  }

  function pathSegments(pathname) {
    return text(pathname).split("/").map(function (segment) {
      return lower(decodeBounded(segment, 2));
    }).filter(Boolean);
  }

  function containsTransactionPath(url) {
    const segments = pathSegments(url.pathname);
    return segments.some(function (segment) {
      return TRANSACTION_SEGMENTS.has(segment);
    });
  }

  function containsSecretParam(url) {
    for (const key of url.searchParams.keys()) {
      if (SECRET_KEY_RE.test(key)) return true;
    }
    return false;
  }

  function containsTransactionQuery(url) {
    for (const [key, value] of url.searchParams.entries()) {
      const normalizedKey = lower(key);
      const normalizedValue = lower(value);
      if (TRANSACTION_QUERY_KEYS.has(normalizedKey)) {
        if ((normalizedKey === "checkout" || normalizedKey === "booking") && /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) continue;
        if ((normalizedKey === "checkout" || normalizedKey === "booking") && /^(date|time|day)$/i.test(normalizedValue)) continue;
        return true;
      }
      if (TRANSACTION_QUERY_KEYS.has(normalizedValue)) return true;
    }
    return false;
  }

  function inspectRedirects(url, expectedHosts, reasons) {
    for (const [key, value] of url.searchParams.entries()) {
      const normalizedKey = lower(key).replace(/[-_]/g, "");
      if (!REDIRECT_KEYS.has(normalizedKey)) continue;
      const decoded = decodeBounded(value, 2);
      if (/^[a-z][a-z0-9+.-]*:/i.test(decoded)) {
        const nested = validateDestinationUrl(decoded, { expectedHosts });
        if (!nested.allowed) add(reasons, "redirect_target_blocked");
        if (nested.allowed && !hostMatches(nested.host, expectedHosts)) add(reasons, "redirect_host_not_allowed");
      }
      if (/(\/|%2f)(checkout|payment|pay|order|purchase|book|booking|reserve|reservation|ticket)(\/|$|[?#&=])/i.test(decoded)) {
        add(reasons, "redirect_transaction_blocked");
      }
    }
  }

  function validateDestinationUrl(rawUrl, options) {
    const value = text(rawUrl);
    const reasons = [];
    if (!value) add(reasons, "missing_url");
    if (value.length > MAX_URL_LENGTH) add(reasons, "url_too_long");
    if (/[\u0000-\u001F\u007F]/.test(value)) add(reasons, "control_character_blocked");
    let parsed = null;
    if (!reasons.length) {
      try {
        parsed = new URL(value);
      } catch (_) {
        add(reasons, "malformed_url");
      }
    }
    if (parsed) {
      const host = normalizeHost(parsed.hostname);
      if (parsed.protocol !== "https:") add(reasons, "non_https_blocked");
      if (parsed.username || parsed.password) add(reasons, "userinfo_blocked");
      if (isPrivateHost(host)) add(reasons, "private_or_local_host_blocked");
      if (!hostMatches(host, options && options.expectedHosts)) add(reasons, "host_not_allowed");
      if (containsSecretParam(parsed)) add(reasons, "credential_param_blocked");
      if (containsTransactionPath(parsed)) add(reasons, "transaction_path_blocked");
      if (containsTransactionQuery(parsed)) add(reasons, "transaction_query_blocked");
      inspectRedirects(parsed, options && options.expectedHosts, reasons);
      const decodedFull = decodeBounded(value, 2);
      if (/(https?:\/\/[^/?#\s]+[^?#\s]*\/(?:checkout|payment|pay|order|purchase|book|booking|reserve|reservation|ticket)(?:\/|$|[?#]))/i.test(decodedFull)) {
        add(reasons, "encoded_transaction_blocked");
      }
    }
    return {
      allowed: reasons.length === 0,
      url: reasons.length === 0 ? value : null,
      host: parsed ? normalizeHost(parsed.hostname) : "",
      reasons
    };
  }

  function getIdentity(source, keys) {
    const safe = source || {};
    for (const key of keys) {
      const value = text(safe[key]);
      if (value) return value;
    }
    return "";
  }

  function equalIfBoth(expected, actual) {
    if (!text(expected) || !text(actual)) return null;
    return lower(expected) === lower(actual);
  }

  function requireMatch(reasons, source, context, key, aliases, reason) {
    const expected = getIdentity(source, [key].concat(aliases || []));
    const actual = getIdentity(context, [key].concat(aliases || []));
    const match = equalIfBoth(expected, actual);
    if (match === false) add(reasons, reason);
    return match === true;
  }

  function staleSelectionBlocked(input, reasons) {
    const activeResultSetId = text(input.activeResultSetId);
    const resultSetId = text(input.resultSetId || input.result && input.result.resultSetId);
    const selectedResultId = text(input.selectedResultId);
    const currentResultId = text(input.currentResultId || input.result && (input.result.id || input.result.resultId));
    if (activeResultSetId && resultSetId && activeResultSetId !== resultSetId) add(reasons, "stale_result_set_blocked");
    if (selectedResultId && currentResultId && selectedResultId !== currentResultId) add(reasons, "wrong_selected_result_blocked");
  }

  function classifyShopping(source, context, reasons) {
    const product = requireMatch(reasons, source, context, "productId", ["sku", "providerProductId"], "wrong_product_blocked");
    const variant = requireMatch(reasons, source, context, "variantId", ["variant", "optionId"], "wrong_variant_blocked");
    const seller = requireMatch(reasons, source, context, "sellerId", ["merchantId", "seller"], "wrong_seller_blocked");
    const offer = requireMatch(reasons, source, context, "offerId", ["providerOfferId"], "wrong_offer_blocked");
    if (offer && seller && product && (variant || !getIdentity(source, ["variantId", "variant", "optionId"]))) return "EXACT_OFFER";
    if (product && (variant || !getIdentity(source, ["variantId", "variant", "optionId"]))) return "EXACT_PRODUCT";
    return context && context.searchReconstruction === true ? "SEARCH_RECONSTRUCTION" : "GENERIC";
  }

  function classifyFlight(source, context, reasons) {
    const origin = requireMatch(reasons, source, context, "origin", ["from"], "wrong_flight_origin_blocked");
    const destination = requireMatch(reasons, source, context, "destination", ["to"], "wrong_flight_destination_blocked");
    const date = requireMatch(reasons, source, context, "departureDate", ["date"], "wrong_flight_date_blocked");
    const passengers = requireMatch(reasons, source, context, "passengers", ["adults"], "wrong_passenger_count_blocked");
    const cabin = requireMatch(reasons, source, context, "cabin", ["cabinClass"], "wrong_cabin_blocked");
    if (origin && destination && date && passengers && cabin) return "EXACT_ITINERARY";
    if (origin && destination && date) return "SEARCH_RECONSTRUCTION";
    if (origin && destination) return "ROUTE";
    return "GENERIC";
  }

  function classifyHotel(source, context, reasons) {
    const property = requireMatch(reasons, source, context, "propertyId", ["hotelId"], "wrong_property_blocked");
    const checkIn = requireMatch(reasons, source, context, "checkIn", ["checkin"], "wrong_checkin_blocked");
    const checkOut = requireMatch(reasons, source, context, "checkOut", ["checkout"], "wrong_checkout_blocked");
    const occupancy = requireMatch(reasons, source, context, "occupancy", ["guests", "adults"], "wrong_occupancy_blocked");
    const room = requireMatch(reasons, source, context, "roomId", ["room"], "wrong_room_blocked");
    const rate = requireMatch(reasons, source, context, "rateId", ["ratePlanId"], "wrong_rate_blocked");
    if (property && checkIn && checkOut && occupancy && room && rate) return "EXACT_RATE";
    if (property && checkIn && checkOut && occupancy) return "EXACT_STAY";
    if (property) return "PROPERTY";
    return "GENERIC";
  }

  function classifyCruise(source, context, reasons) {
    const sailing = requireMatch(reasons, source, context, "sailingId", ["voyageId"], "wrong_sailing_blocked");
    const ship = requireMatch(reasons, source, context, "shipId", ["ship"], "wrong_ship_blocked");
    const date = requireMatch(reasons, source, context, "departureDate", ["date"], "wrong_sailing_date_blocked");
    const cabin = requireMatch(reasons, source, context, "cabinCategory", ["cabin"], "wrong_cabin_blocked");
    if (sailing && ship && date && cabin) return "EXACT_SAILING";
    if (sailing && ship && date) return "SAILING";
    return "GENERIC";
  }

  function userCopyFor(domain, exactness, blocked) {
    if (blocked) return { title:"Cannot open this handoff safely", primaryActionLabel:"Blocked for safety", explanation:"This link does not preserve enough trusted context or failed safety checks." };
    if (domain === "shopping") return exactness === "EXACT_OFFER" ? { title:"View this offer on the provider", primaryActionLabel:"Open provider offer", explanation:"Weishan will open the provider page only after your click. Final price and availability stay with the provider." } : { title:"View product on the provider", primaryActionLabel:"Open provider product", explanation:"This handoff preserves the product context. Final terms stay with the provider." };
    if (domain === "flight") return { title:"Confirm flight on provider", primaryActionLabel:"Open flight provider", explanation:"The provider page is for manual confirmation only. Weishan does not book, pay, or ticket." };
    if (domain === "hotel") return { title:"Confirm hotel on provider", primaryActionLabel:"Open hotel provider", explanation:"The provider page is for manual confirmation only. Weishan does not reserve, pay, or book." };
    if (domain === "cruise") return { title:"Confirm sailing on provider", primaryActionLabel:"Open cruise provider", explanation:"The provider page is for manual confirmation only. Weishan does not reserve, pay, or ticket." };
    return { title:"Open provider safely", primaryActionLabel:"Open provider", explanation:"Weishan requires an explicit click and keeps transaction actions disabled." };
  }

  function buildHandoff(input) {
    const safe = input && typeof input === "object" ? input : {};
    const source = safe.result && typeof safe.result === "object" ? safe.result : safe;
    const context = safe.destinationContext && typeof safe.destinationContext === "object" ? safe.destinationContext : {};
    const domain = lower(safe.domain || source.domain || source.itemType || "generic");
    const expectedHosts = arr(safe.expectedHosts).length ? safe.expectedHosts : [safe.expectedHost || source.expectedHost || source.safeProviderHandoffHost].filter(Boolean);
    const urlCheck = validateDestinationUrl(safe.destinationUrl || source.safeProviderHandoffUrl || source.confirmationUrl || source.url, { expectedHosts });
    const reasons = urlCheck.reasons.slice();
    staleSelectionBlocked(safe, reasons);
    let exactness = "GENERIC";
    if (domain === "shopping" || domain === "commerce" || domain === "product") exactness = classifyShopping(source, context, reasons);
    else if (domain === "flight") exactness = classifyFlight(source, context, reasons);
    else if (domain === "hotel") exactness = classifyHotel(source, context, reasons);
    else if (domain === "cruise") exactness = classifyCruise(source, context, reasons);
    else if (context.searchReconstruction === true || source.searchOnly === true) exactness = "SEARCH_RECONSTRUCTION";
    if (source.exactHandoff === true || source.trustedUrl === true) {
      add(reasons, "provider_exactness_claim_ignored");
      reasons.splice(reasons.indexOf("provider_exactness_claim_ignored"), 1);
    }
    const blocked = reasons.length > 0 || !urlCheck.allowed;
    const userCopy = userCopyFor(domain, blocked ? "NONE" : exactness, blocked);
    return clone({
      moduleName:MODULE_NAME,
      version:VERSION,
      status:blocked ? "blocked" : "confirmation_required",
      safe:!blocked,
      destinationUrl:blocked ? null : urlCheck.url,
      destinationHost:urlCheck.host,
      domain,
      exactness:blocked ? "NONE" : exactness,
      userVisibleExactness:blocked ? "Blocked" : userCopy.title,
      userCopy,
      requiresExplicitUserAction:true,
      userConfirmationRequired:true,
      autoOpen:false,
      openExternalRequested:false,
      booking:false,
      checkout:false,
      payment:false,
      order:false,
      ticketing:false,
      highRiskMetrics:{ autoOpenCount:0, bookingActionCount:0, paymentActionCount:0, orderActionCount:0, ticketingActionCount:0 },
      blockedReasons:reasons,
      governance:{
        executionGate:"CLOSED",
        authorizesExecution:false,
        productionTraffic:false,
        WEISHAN_PAYS_PROVIDER:false,
        PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false
      },
      redacted:true
    });
  }

  function assertSafeHandoff(value) {
    const handoff = value && typeof value === "object" ? value : buildHandoff({});
    if (handoff.autoOpen !== false || handoff.requiresExplicitUserAction !== true) throw new Error("handoff must require explicit user action");
    if (handoff.booking || handoff.checkout || handoff.payment || handoff.order || handoff.ticketing) throw new Error("handoff must not enable transaction actions");
    const metrics = handoff.highRiskMetrics || {};
    if (metrics.autoOpenCount !== 0 || metrics.bookingActionCount !== 0 || metrics.paymentActionCount !== 0 || metrics.orderActionCount !== 0 || metrics.ticketingActionCount !== 0) throw new Error("handoff high risk metrics must remain zero");
    if (JSON.stringify(handoff.userCopy || {}).match(/EXACT_|SEARCH_RECONSTRUCTION|GENERIC|NONE/)) throw new Error("raw exactness enums must not leak into user copy");
    return true;
  }

  window.WeishanGlobalHandoffTruthEngine = Object.freeze({
    VERSION,
    MODULE_NAME,
    validateDestinationUrl,
    buildHandoff,
    assertSafeHandoff
  });
})();
