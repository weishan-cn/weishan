;(function () {
  "use strict";

  const VERSION = "4.3.6";
  const MODULE_NAME = "unified_desktop_flow_view_model_v1";

  const DOMAINS = Object.freeze({
    SHOPPING:"SHOPPING",
    FLIGHT:"FLIGHT",
    HOTEL:"HOTEL",
    CRUISE:"CRUISE",
    UNKNOWN:"UNKNOWN"
  });

  const DOMAIN_LABELS = Object.freeze({
    SHOPPING:"Shopping",
    FLIGHT:"Flight",
    HOTEL:"Hotel",
    CRUISE:"Cruise",
    UNKNOWN:"Needs clarification"
  });

  const DOMAIN_CHIPS = Object.freeze({
    SHOPPING:"Product",
    FLIGHT:"Flight",
    HOTEL:"Hotel",
    CRUISE:"Cruise",
    UNKNOWN:"Clarify"
  });

  const INTERNAL_PATTERNS = [
    /SANDBOX_TEST_DATA/i,
    /COMMERCIAL_BLOCKED/i,
    /FOUNDATION_ONLY/i,
    /MTLS_[A-Z0-9_]+/i,
    /COMMERCIAL_CREDENTIALS_REQUIRED/i,
    /HTTP\s*401/i,
    /OAuth/i,
    /client_secret/i,
    /API\s*key/i,
    /Authorization/i,
    /Bearer\s+\S*/i,
    /\/Users\/\S*/i,
    /apps\/desktop/i,
    /stack trace/i
  ];

  const TRANSACTION_SEGMENTS = Object.freeze(["book", "booking", "checkout", "payment", "pay", "order", "purchase", "reservation", "reserve", "ticket"]);

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

  function sanitize(value) {
    let raw = text(value);
    INTERNAL_PATTERNS.forEach(function (pattern) {
      raw = raw.replace(pattern, "technical setup detail");
    });
    return raw.replace(/[<>]/g, "");
  }

  function finite(value) {
    if (value == null || (typeof value === "string" && value.trim() === "")) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function evidenceStates(source) {
    const p = source || {};
    return [p.priceState, p.evidenceType, p.sourceAuthority, p.status, p.freshness, p.environment]
      .map(upper)
      .filter(Boolean);
  }

  function includesState(states, pattern) {
    return states.some(function (state) { return pattern.test(state); });
  }

  function availabilityState(item) {
    const raw = upper(item && (item.availability || item.availabilityState || item.stockStatus || item.inventoryStatus));
    if (!raw) return { available:false, status:"UNKNOWN_AVAILABILITY", comparable:false };
    if (/OUT_OF_STOCK|SOLD_OUT|UNAVAILABLE|NOT_AVAILABLE|NO_AVAILABILITY/.test(raw)) return { available:false, status:raw, comparable:false };
    if (/UNKNOWN|CHECK_PROVIDER|LIMITED_UNKNOWN/.test(raw)) return { available:false, status:raw, comparable:false };
    if (/AVAILABLE|IN_STOCK|ON_SALE/.test(raw)) return { available:true, status:raw, comparable:true };
    return { available:false, status:raw, comparable:false };
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
      RESERVATION:false,
      WEISHAN_PAYS_PROVIDER:false,
      PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false
    };
  }

  function classifyDomain(input) {
    const raw = text(input && (input.domain || input.intentCategory || input.intentType || input.category));
    const query = text(input && (input.query || input.userRequest || input.inputSummary || input.text));
    const value = `${raw} ${query}`;
    if (/cruise|邮轮|游轮|sailing|cabin/i.test(value)) return DOMAINS.CRUISE;
    if (/flight|机票|航班|飞机票|经济舱|公务舱|头等舱|往返|单程/i.test(value)) return DOMAINS.FLIGHT;
    if (/hotel|酒店|住宿|入住|check-?in|民宿/i.test(value)) return DOMAINS.HOTEL;
    if (/shopping|product|商品|买|购买|比价|iPhone|MacBook|耳机|相机|家电|电脑/i.test(value)) return DOMAINS.SHOPPING;
    return DOMAINS.UNKNOWN;
  }

  function routeDomain(input) {
    const localRouter = typeof window !== "undefined" && window.WeishanCommerceLocalIntentRouter;
    const query = text(input && (input.query || input.userRequest || input.inputSummary || input.text));
    if (localRouter && typeof localRouter.routeCommerceIntentLocally === "function" && query) {
      const route = localRouter.routeCommerceIntentLocally(query);
      const category = text(route && route.intentCategory);
      if (category === "product" || category === "complex_product" || category === "general_commerce") return DOMAINS.SHOPPING;
      if (category === "flight") return DOMAINS.FLIGHT;
      if (category === "hotel") return DOMAINS.HOTEL;
      if (category === "cruise") return DOMAINS.CRUISE;
    }
    return classifyDomain(input);
  }

  function amountLabel(amount, currency) {
    const n = finite(amount);
    const c = upper(currency);
    if (n == null || n < 0 || !c || c === "UNKNOWN" || c === "XXX") return null;
    try {
      return new Intl.NumberFormat("en-US", {
        style:"currency",
        currency:c,
        maximumFractionDigits:n % 1 === 0 ? 0 : 2
      }).format(n);
    } catch (error) {
      return `${n.toFixed(n % 1 === 0 ? 0 : 2)} ${c}`;
    }
  }

  function basisLabel(domain, basis) {
    const b = upper(basis || "UNKNOWN_BASIS");
    if (b === "TOTAL_ITEM" || b === "OFFER_TOTAL" || b === "ITEM_PRICE") return "item price";
    if (b === "TOTAL_ITINERARY") return "total itinerary";
    if (b === "PER_PASSENGER") return "per passenger";
    if (b === "TOTAL_STAY") return "total stay";
    if (b === "PER_NIGHT") return "per night";
    if (b === "TOTAL_BOOKING") return "total booking";
    if (b === "PER_PERSON_DOUBLE_OCCUPANCY") return "per person, double occupancy";
    if (b === "PER_PERSON") return "per person";
    if (b === "FROM_PRICE" || b === "STARTING_FROM") return "starting from";
    if (domain === DOMAINS.SHOPPING) return "product price basis unknown";
    if (domain === DOMAINS.FLIGHT) return "flight price basis unknown";
    if (domain === DOMAINS.HOTEL) return "hotel price basis unknown";
    if (domain === DOMAINS.CRUISE) return "cruise price basis unknown";
    return "price basis unknown";
  }

  function priceState(domain, source) {
    const p = source || {};
    const states = evidenceStates(p);
    const basis = upper(p.priceBasis || p.basis || p.priceBasisType || "UNKNOWN_BASIS");
    const label = amountLabel(p.amount, p.currency);
    const isTest = p.testData === true || includesState(states, /SANDBOX_TEST_DATA|EVALUATION_DATA|TEST_ENVIRONMENT_DATA|SANDBOX|TEST_ENVIRONMENT/);
    const isStale = includesState(states, /STALE|EXPIRED/);
    const isIndicative = includesState(states, /INDICATIVE|PRICE_INDICATIVE|FROM_PRICE|STARTING_FROM|PRICE_RANGE/) || basis === "FROM_PRICE" || basis === "STARTING_FROM" || basis === "PRICE_RANGE";
    const unavailable = !label || includesState(states, /PRICE_UNAVAILABLE|NO_PRICE|MISSING_PRICE/);
    let publicState = "PRICE_UNAVAILABLE";
    let display = "Price unavailable";
    if (isTest && label) {
      publicState = "TEST_DATA";
      display = `${label} · Test data — not live`;
    } else if (isTest) {
      publicState = "TEST_DATA";
      display = "Test data — no live price";
    } else if (isStale && label) {
      publicState = "STALE_PRICE";
      display = `${label} · Stale — verify on provider`;
    } else if (isIndicative && label) {
      publicState = "INDICATIVE_PRICE";
      display = `From ${label} · Indicative`;
    } else if (!unavailable) {
      publicState = "CURRENT_PRICE";
      display = label;
    }
    return {
      publicState,
      display,
      amountLabel:label,
      currency:upper(p.currency) || null,
      basisLabel:basisLabel(domain, basis),
      comparable:publicState === "CURRENT_PRICE" && basis.indexOf("UNKNOWN") < 0,
      testData:isTest,
      stale:isStale,
      indicative:isIndicative,
      unavailable:publicState === "PRICE_UNAVAILABLE",
      sourceCurrencyPreserved:true,
      fxConverted:false
    };
  }

  function hostnameIsUnsafe(hostname) {
    const host = text(hostname).toLowerCase().replace(/^\[|\]$/g, "");
    if (!host || host === "localhost" || host.endsWith(".localhost")) return true;
    if (host === "::1" || host.startsWith("fe80:") || host.startsWith("fc") || host.startsWith("fd")) return true;
    const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!ipv4) return false;
    const parts = ipv4.slice(1).map(Number);
    if (parts.some(function (part) { return part < 0 || part > 255; })) return true;
    if (parts[0] === 10 || parts[0] === 127 || parts[0] === 0) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    return false;
  }

  function hasTransactionIntent(url) {
    const segments = url.pathname.split("/").map(function (segment) {
      try { return decodeURIComponent(segment).toLowerCase(); } catch (error) { return segment.toLowerCase(); }
    }).filter(Boolean);
    if (segments.some(function (segment) { return TRANSACTION_SEGMENTS.includes(segment); })) return true;
    const params = Array.from(url.searchParams.entries());
    if (params.some(function (entry) { return TRANSACTION_SEGMENTS.includes(text(entry[0]).toLowerCase()); })) return true;
    const decodedSearch = (() => {
      try { return decodeURIComponent(url.search || ""); } catch (error) { return url.search || ""; }
    })().toLowerCase();
    return /\/(?:book|booking|checkout|payment|pay|order|purchase|reservation|reserve|ticket)(?:\/|$|[?#])/.test(decodedSearch);
  }

  function safeHandoff(input, domain) {
    const raw = text(input && (input.url || input.handoffUrl || input.itemWebUrl));
    const quality = upper(input && (input.quality || input.handoffQuality || input.exactness));
    if (!raw) return { safe:false, cta:"No safe external link", url:null, exactness:"NO_HANDOFF", autoOpen:false, reason:"NO_URL" };
    try {
      const url = new URL(raw);
      if (url.username || url.password) return { safe:false, cta:"No safe external link", url:null, exactness:"NO_HANDOFF", autoOpen:false, reason:"URL_USERINFO_BLOCKED" };
      if (url.protocol !== "https:") return { safe:false, cta:"No safe external link", url:null, exactness:"NO_HANDOFF", autoOpen:false, reason:"UNSAFE_PROTOCOL" };
      if (hostnameIsUnsafe(url.hostname)) return { safe:false, cta:"No safe external link", url:null, exactness:"NO_HANDOFF", autoOpen:false, reason:"UNSAFE_HOST" };
      if (hasTransactionIntent(url)) return { safe:false, cta:"No safe external link", url:null, exactness:"NO_HANDOFF", autoOpen:false, reason:"TRANSACTION_PATH_BLOCKED" };
      if (/GENERIC|HOME|SEARCH/.test(quality)) return { safe:true, cta:"Open search", url:raw, host:url.hostname, exactness:"SEARCH_HANDOFF", autoOpen:false, reason:null };
      if (domain === DOMAINS.SHOPPING) return { safe:true, cta:/OFFER/.test(quality) ? "View offer" : "View product", url:raw, host:url.hostname, exactness:quality || "EXACT_PRODUCT_HANDOFF", autoOpen:false, reason:null };
      if (domain === DOMAINS.FLIGHT) return { safe:true, cta:"View flight", url:raw, host:url.hostname, exactness:quality || "EXACT_ITINERARY_HANDOFF", autoOpen:false, reason:null };
      if (domain === DOMAINS.HOTEL) return { safe:true, cta:"View hotel", url:raw, host:url.hostname, exactness:quality || "EXACT_STAY_HANDOFF", autoOpen:false, reason:null };
      if (domain === DOMAINS.CRUISE) return { safe:true, cta:"View sailing", url:raw, host:url.hostname, exactness:quality || "EXACT_SAILING_HANDOFF", autoOpen:false, reason:null };
      return { safe:true, cta:"Continue on provider", url:raw, host:url.hostname, exactness:quality || "HANDOFF", autoOpen:false, reason:null };
    } catch (error) {
      return { safe:false, cta:"No safe external link", url:null, exactness:"NO_HANDOFF", autoOpen:false, reason:"INVALID_URL" };
    }
  }

  function identityFor(domain, item, query) {
    const i = item || {};
    if (domain === DOMAINS.SHOPPING) return sanitize(i.productName || i.title || i.model || query || "Product request");
    if (domain === DOMAINS.FLIGHT) return sanitize(i.route || `${i.origin || "Origin"} → ${i.destination || "Destination"}`);
    if (domain === DOMAINS.HOTEL) return sanitize(i.propertyName || i.location || i.destination || "Hotel stay");
    if (domain === DOMAINS.CRUISE) return sanitize(i.ship || i.sailing || i.itinerary || "Cruise sailing");
    return sanitize(query || "Request");
  }

  function contextFor(domain, item) {
    const i = item || {};
    if (domain === DOMAINS.SHOPPING) return sanitize([i.variant, i.condition, i.region].filter(Boolean).join(" · ") || "variant and availability must match");
    if (domain === DOMAINS.FLIGHT) return sanitize([i.date || i.departureDate, i.cabin, i.stops, i.duration].filter(Boolean).join(" · ") || "date, passengers, cabin and itinerary must match");
    if (domain === DOMAINS.HOTEL) return sanitize([i.checkIn && i.checkOut ? `${i.checkIn} → ${i.checkOut}` : "", i.roomName, i.refundability].filter(Boolean).join(" · ") || "dates, occupancy, room and rate must match");
    if (domain === DOMAINS.CRUISE) return sanitize([i.departureDate, i.duration, i.cabinCategory, i.occupancyBasis].filter(Boolean).join(" · ") || "sailing, cabin, occupancy and duration must match");
    return "constraints to confirm";
  }

  function conditionsFor(domain, item) {
    const i = item || {};
    const rows = [];
    if (domain === DOMAINS.SHOPPING) rows.push(["Variant", i.variant || "must match"], ["Condition", i.condition || "must match"], ["Availability", i.availability || "unknown"]);
    if (domain === DOMAINS.FLIGHT) rows.push(["Stops", i.stops || "unknown"], ["Cabin", i.cabin || "unknown"], ["Conditions", i.conditions || "airline page final"]);
    if (domain === DOMAINS.HOTEL) rows.push(["Room/rate", i.roomName || i.ratePlan || "unknown"], ["Refundability", i.refundability || "unknown"], ["Taxes/fees", i.taxesAndFees || "may change"]);
    if (domain === DOMAINS.CRUISE) rows.push(["Sailing", i.sailing || i.itinerary || "must match"], ["Cabin", i.cabinCategory || "unknown"], ["Cost completeness", i.costCompleteness || "unknown"]);
    return rows.map(function (row) { return { label:row[0], value:sanitize(row[1]) }; });
  }

  function resultShell(domain, item, query) {
    const price = priceState(domain, item && (item.price || item.priceEvidence || item));
    const handoff = safeHandoff(item && (item.handoff || item), domain);
    const availability = availabilityState(item);
    const comparable = item && item.contextMatches === false ? false : price.comparable && availability.comparable;
    return {
      domain,
      domainLabel:DOMAIN_LABELS[domain],
      identity:identityFor(domain, item, query),
      secondaryContext:contextFor(domain, item),
      price,
      availability,
      conditions:conditionsFor(domain, item),
      handoff,
      comparable,
      recommendationReason:recommendationReason(domain, comparable, price),
      noProviderKnowledgeRequired:true,
      transactionBoundary:"External site completes any purchase, booking, ticketing, or payment."
    };
  }

  function recommendationReason(domain, comparable, price) {
    if (!comparable) return "Not ranked as cheapest because the context or price is not fully comparable.";
    if (domain === DOMAINS.SHOPPING) return "Comparable product evidence with user-benefit ranking.";
    if (domain === DOMAINS.FLIGHT) return "Comparable itinerary evidence for the requested dates and cabin.";
    if (domain === DOMAINS.HOTEL) return "Comparable stay evidence for the requested dates, occupancy, room, and rate.";
    if (domain === DOMAINS.CRUISE) return "Comparable sailing evidence for the requested cabin and occupancy.";
    return "Comparable evidence.";
  }

  function buildUnifiedDesktopFlowViewModel(input) {
    const source = input || {};
    const query = sanitize(source.query || source.userRequest || source.inputSummary || "");
    const domain = routeDomain(source);
    const previousDomain = upper(source.previousDomain || "");
    const rawResults = Array.isArray(source.results) ? source.results : [];
    const shells = rawResults.map(function (item) { return resultShell(domain, item, query); });
    const sourceFailures = (Array.isArray(source.failures) ? source.failures : []).map(function (failure) {
      return { publicMessage:sanitize(failure && (failure.publicMessage || failure.message) || "One source could not answer."), recoverable:failure && failure.recoverable !== false };
    });
    const switched = previousDomain && previousDomain !== domain && domain !== DOMAINS.UNKNOWN;
    return deepFreeze(Object.assign({
      moduleName:MODULE_NAME,
      version:VERSION,
      request:query,
      domain,
      domainLabel:DOMAIN_LABELS[domain],
      domainChip:DOMAIN_CHIPS[domain],
      highLevelFlow:["Ask", "Understand", "Search", "Compare", "Recommend", "Handoff"],
      understoodSummary:understoodSummary(domain, source.constraints || source.search || source.entities || {}, query),
      structuredEdit:{ visibleAfterUnderstanding:true, clutteredFirstScreen:false, fields:structuredFields(domain) },
      domainSwitching:{ switched, staleConstraintsCleared:switched, clearedDomains:switched ? [previousDomain] : [] },
      results:shells,
      compareRows:compareRows(domain),
      partialSourceFailure:sourceFailures.length > 0 && shells.length > 0,
      allSourceFailure:sourceFailures.length > 0 && shells.length === 0,
      noResults:sourceFailures.length === 0 && shells.length === 0,
      sourceFailures,
      recommendationPolicy:{ userBenefitFirst:true, commissionTieBreakerOnly:true, commissionAffectsRecommendation:false },
      ordinaryUserSurface:true,
      noProviderKnowledgeRequired:true,
      noTransactionConfusion:true,
      safeHandoffOnly:true,
      providerNamesHidden:true,
      deterministicFixturesOnly:source.deterministicFixturesOnly !== false,
      accessibility:{ keyboardNavigable:true, labels:true, noColorOnlyState:true },
      performance:{ expensiveRerenderLoop:false }
    }, boundary()));
  }

  function understoodSummary(domain, constraints, query) {
    const c = constraints || {};
    if (domain === DOMAINS.SHOPPING) return sanitize(c.productName || c.model || query || "Product request");
    if (domain === DOMAINS.FLIGHT) return sanitize(`${c.origin || "Origin"} → ${c.destination || "Destination"} · ${c.departureDate || c.date || "date to choose"} · ${c.travelers || c.passengers || "traveler(s)"} · ${c.cabin || "cabin to confirm"}`);
    if (domain === DOMAINS.HOTEL) return sanitize(`${c.destination || c.propertyName || "Destination"} · ${c.checkIn || "check-in"} → ${c.checkOut || "check-out"} · ${c.guests || "guest(s)"}`);
    if (domain === DOMAINS.CRUISE) return sanitize(`${c.departurePort || c.destination || "Cruise"} · ${c.departureDate || "date to choose"} · ${c.duration || "duration"} · ${c.cabinCategory || "cabin to confirm"}`);
    return "Tell Weishan what you want to buy or where you want to go.";
  }

  function structuredFields(domain) {
    if (domain === DOMAINS.SHOPPING) return ["product", "variant", "condition", "region", "budget"];
    if (domain === DOMAINS.FLIGHT) return ["origin", "destination", "dates", "travelers", "cabin"];
    if (domain === DOMAINS.HOTEL) return ["destination", "dates", "guests", "room", "refundability"];
    if (domain === DOMAINS.CRUISE) return ["departure port", "sailing date", "duration", "guests", "cabin"];
    return ["request"];
  }

  function compareRows(domain) {
    if (domain === DOMAINS.SHOPPING) return ["price", "condition", "variant", "availability", "handoff"];
    if (domain === DOMAINS.FLIGHT) return ["price", "stops", "duration", "times", "cabin", "conditions"];
    if (domain === DOMAINS.HOTEL) return ["total/nightly", "room/rate", "refundability", "taxes/fees", "meal"];
    if (domain === DOMAINS.CRUISE) return ["sailing", "duration", "cabin", "occupancy basis", "cost completeness"];
    return [];
  }

  function renderUnifiedDesktopFlowHtml(model) {
    const m = model || buildUnifiedDesktopFlowViewModel({});
    const results = (m.results || []).map(function (item, index) {
      const conditions = (item.conditions || []).map(function (condition) {
        return `<li><span>${escapeHtml(condition.label)}</span><strong>${escapeHtml(condition.value)}</strong></li>`;
      }).join("");
      return `<article class="commerce-one-screen-card weishan-unified-result-shell" tabindex="0" aria-label="${escapeHtml(item.domainLabel)} result">
        <h4>${escapeHtml(item.identity)}</h4>
        <p>${escapeHtml(item.secondaryContext)}</p>
        <p><strong>${escapeHtml(item.price.display)}</strong> · ${escapeHtml(item.price.basisLabel)}</p>
        <ul class="commerce-mini-list" aria-label="Material conditions">${conditions}</ul>
        <p>${escapeHtml(item.recommendationReason)}</p>
        <button type="button" class="cmd-btn gray" data-unified-handoff="${index}"${item.handoff.safe ? "" : " disabled"}>${escapeHtml(item.handoff.cta)}</button>
      </article>`;
    }).join("");
    const failures = (m.sourceFailures || []).map(function (failure) {
      return `<li>${escapeHtml(failure.publicMessage || "One source could not answer.")}</li>`;
    }).join("");
    const emptyState = m.noResults ? `<div class="commerce-empty-state" role="status">No comparable result yet. Refine the request or try again; Weishan will not invent a price.</div>` : "";
    const failureState = failures ? `<div class="commerce-empty-state" role="status"><p>Some sources could not answer safely. Weishan will not invent a price.</p><ul>${failures}</ul></div>` : "";
    return `<section class="commerce-result-summary-panel weishan-unified-desktop-flow" aria-label="Unified Weishan flow" data-unified-desktop-flow="true">
      <div class="commerce-result-summary-head">
        <div class="commerce-result-summary-headline"><span>One Weishan</span><strong>${escapeHtml(m.domainLabel)} · ${escapeHtml(m.understoodSummary)}</strong></div>
        <p>${escapeHtml(m.highLevelFlow.join(" → "))}</p>
      </div>
      <p>Ask once. Weishan understands the domain, compares only compatible evidence, and hands you off safely.</p>
      <div class="commerce-one-screen-body">${results || emptyState}${failureState}</div>
      <p>Weishan does not check out, book, reserve, issue tickets, place orders, or take payment.</p>
    </section>`;
  }

  function escapeHtml(value) {
    return sanitize(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  window.WeishanUnifiedDesktopFlowViewModel = Object.freeze({
    VERSION,
    MODULE_NAME,
    DOMAINS,
    buildUnifiedDesktopFlowViewModel,
    renderUnifiedDesktopFlowHtml,
    routeDomain,
    priceState,
    safeHandoff
  });
})();
