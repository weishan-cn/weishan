;(function () {
  "use strict";

  const VERSION = "4.3.5";
  const MODULE_NAME = "travel_zero_learning_ux_view_model_v1";

  const DOMAIN_LABEL = Object.freeze({
    FLIGHT:"Flight",
    HOTEL:"Hotel",
    CRUISE:"Cruise"
  });

  const CTA_LABEL = Object.freeze({
    FLIGHT:"View flight",
    HOTEL:"View hotel",
    CRUISE:"View sailing",
    SEARCH:"Open search",
    GENERIC:"Continue on provider",
    NONE:"No safe external link"
  });

  const INTERNAL_LEAK_PATTERNS = [
    /COMMERCIAL_CREDENTIALS_REQUIRED/i,
    /MTLS_CERTIFICATE_REQUIRED/i,
    /HTTP\s*401/i,
    /OAuth/i,
    /client_secret/i,
    /API\s*key/i,
    /Authorization/i,
    /Bearer\s+/i,
    /\/Users\//i,
    /apps\/desktop/i,
    /stack trace/i
  ];

  const TRANSACTION_PATH = /\/(?:book|booking|checkout|payment|pay|order|reservation|reserve|ticket)(?:\/|$|[?#])/i;

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

  function finiteNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function clampText(value, max) {
    const raw = sanitizeUserText(value);
    const limit = Number.isFinite(Number(max)) ? Number(max) : 140;
    if (raw.length <= limit) return raw;
    return raw.slice(0, Math.max(0, limit - 1)).trimEnd() + "…";
  }

  function sanitizeUserText(value) {
    let raw = text(value);
    INTERNAL_LEAK_PATTERNS.forEach(function (pattern) {
      raw = raw.replace(pattern, "technical setup detail");
    });
    return raw.replace(/[<>]/g, "");
  }

  function safeDate(value) {
    return text(value);
  }

  function dayCount(start, end) {
    const a = Date.parse(`${safeDate(start)}T00:00:00Z`);
    const b = Date.parse(`${safeDate(end)}T00:00:00Z`);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    return Math.round((b - a) / 86400000);
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

  function priceAmountLabel(amount, currency) {
    if (amount == null) return null;
    const n = finiteNumber(amount);
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

  function normalizePriceEvidence(source) {
    const p = source || {};
    const state = upper(p.priceState || p.sourceAuthority || p.evidenceType || p.status);
    const priceBasis = upper(p.priceBasis || p.basis || "UNKNOWN_BASIS");
    const amount = finiteNumber(p.amount);
    const currency = upper(p.currency);
    const amountLabel = priceAmountLabel(amount, currency);
    const testData = state === "SANDBOX_TEST_DATA" || state === "EVALUATION_DATA" || state === "TEST_ENVIRONMENT_DATA" || bool(p.testData);
    const unavailable = state === "PRICE_UNAVAILABLE" || state === "NO_PRICE" || amountLabel == null;
    const indicative = state === "INDICATIVE" || state === "PRICE_INDICATIVE" || state === "FROM_PRICE" || priceBasis === "FROM_PRICE" || priceBasis === "STARTING_FROM" || priceBasis === "PRICE_RANGE";
    let display = "Price unavailable";
    let publicState = "PRICE_UNAVAILABLE";
    if (testData && amountLabel) {
      display = `${amountLabel} · Test data — not a live price`;
      publicState = "TEST_DATA";
    } else if (testData) {
      display = "Test data — no live price";
      publicState = "TEST_DATA";
    } else if (indicative && amountLabel) {
      display = `From ${amountLabel} · Indicative`;
      publicState = "INDICATIVE_PRICE";
    } else if (!unavailable && amountLabel) {
      display = amountLabel;
      publicState = "CURRENT_PRICE";
    }
    return {
      publicState,
      display,
      amountLabel:unavailable && !testData ? null : amountLabel,
      currency:currency || null,
      priceBasis,
      basisLabel:basisLabel(priceBasis),
      publicLivePrice:publicState === "CURRENT_PRICE",
      testData,
      indicative,
      unavailable:publicState === "PRICE_UNAVAILABLE",
      taxesAndFeesLabel:taxFeeLabel(p),
      freshnessLabel:freshnessLabel(p),
      comparable:publicState === "CURRENT_PRICE" && !indicative && !testData && !unavailable && basisLabel(priceBasis) !== "basis unknown"
    };
  }

  function basisLabel(priceBasis) {
    switch (upper(priceBasis)) {
      case "TOTAL_ITINERARY": return "total itinerary";
      case "PER_PASSENGER": return "per passenger";
      case "TOTAL_STAY": return "total stay";
      case "PER_NIGHT": return "per night";
      case "PER_ROOM": return "per room";
      case "PER_PERSON": return "per person";
      case "PER_PERSON_DOUBLE_OCCUPANCY": return "per person, double occupancy";
      case "TOTAL_BOOKING": return "total booking";
      case "STARTING_FROM":
      case "FROM_PRICE": return "starting from";
      case "PRICE_RANGE": return "price range";
      default: return "basis unknown";
    }
  }

  function taxFeeLabel(p) {
    if (bool(p && p.taxesIncluded) && bool(p && p.feesIncluded)) return "taxes and fees included";
    if (bool(p && p.taxesKnown) || bool(p && p.feesKnown)) return "taxes/fees partially known";
    return "taxes and fees may change on the external site";
  }

  function freshnessLabel(p) {
    const source = p || {};
    if (bool(source.testData) || /SANDBOX|EVALUATION|TEST/i.test(text(source.sourceAuthority || source.priceState))) return "test timestamp only";
    if (text(source.providerUpdatedAt || source.observedAt)) return `checked ${sanitizeUserText(source.providerUpdatedAt || source.observedAt)}`;
    return "freshness unknown";
  }

  function safeHandoff(raw) {
    const value = text(raw && raw.url || raw);
    if (!value) return { safe:false, url:null, cta:CTA_LABEL.NONE, reason:"NO_URL", downgraded:false, autoOpen:false };
    try {
      const url = new URL(value);
      if (url.protocol !== "https:") return { safe:false, url:null, cta:CTA_LABEL.NONE, reason:"UNSAFE_PROTOCOL", downgraded:false, autoOpen:false };
      if (/^(\d+\.){3}\d+$/.test(url.hostname) || url.hostname === "localhost") return { safe:false, url:null, cta:CTA_LABEL.NONE, reason:"UNSAFE_HOST", downgraded:false, autoOpen:false };
      if (TRANSACTION_PATH.test(url.pathname)) return { safe:false, url:null, cta:CTA_LABEL.NONE, reason:"TRANSACTION_PATH_BLOCKED", downgraded:false, autoOpen:false };
      return { safe:true, url:value, host:url.hostname, cta:CTA_LABEL.GENERIC, reason:null, downgraded:false, autoOpen:false };
    } catch (error) {
      return { safe:false, url:null, cta:CTA_LABEL.NONE, reason:"INVALID_URL", downgraded:false, autoOpen:false };
    }
  }

  function handoffModel(domain, handoff) {
    const safe = safeHandoff(handoff);
    const quality = upper(handoff && handoff.quality || handoff && handoff.handoffQuality || "");
    if (!safe.safe) return safe;
    if (/GENERIC|HOME/.test(quality)) {
      return Object.assign({}, safe, { cta:CTA_LABEL.SEARCH, downgraded:true, reason:"GENERIC_HANDOFF_DOWNGRADED" });
    }
    if (domain === "FLIGHT") return Object.assign({}, safe, { cta:CTA_LABEL.FLIGHT });
    if (domain === "HOTEL") return Object.assign({}, safe, { cta:CTA_LABEL.HOTEL });
    if (domain === "CRUISE") return Object.assign({}, safe, { cta:CTA_LABEL.CRUISE });
    return safe;
  }

  function validateSearch(domain, search) {
    const errors = [];
    const s = search || {};
    if (domain === "FLIGHT") {
      if (!text(s.origin)) errors.push("Add an origin airport or city.");
      if (!text(s.destination)) errors.push("Add a destination airport or city.");
      if (text(s.origin).toLowerCase() && text(s.origin).toLowerCase() === text(s.destination).toLowerCase()) errors.push("Origin and destination must be different.");
      if (!text(s.departureDate)) errors.push("Add a departure date.");
      const gap = text(s.returnDate) ? dayCount(s.departureDate, s.returnDate) : null;
      if (gap != null && gap < 0) errors.push("Return date must be after departure date.");
    } else if (domain === "HOTEL") {
      if (!text(s.destination) && !text(s.propertyName)) errors.push("Add a hotel destination or property.");
      const nights = dayCount(s.checkIn, s.checkOut);
      if (nights != null && nights <= 0) errors.push("Check-out must be after check-in.");
    } else if (domain === "CRUISE") {
      if (!text(s.destination) && !text(s.ship) && !text(s.departurePort)) errors.push("Add a cruise region, ship, or departure port.");
      if (finiteNumber(s.guests) != null && finiteNumber(s.guests) <= 0) errors.push("Guest count must be at least 1.");
    }
    return errors;
  }

  function buildFlightTitle(result, search) {
    const r = result || {};
    const s = search || {};
    return clampText(`${r.airline || r.marketingAirline || "Flight"} ${r.flightNumber || ""} · ${r.origin || s.origin || "Origin"} → ${r.destination || s.destination || "Destination"}`, 120);
  }

  function buildHotelTitle(result, search) {
    const r = result || {};
    const s = search || {};
    return clampText(`${r.propertyName || "Hotel"} · ${r.location || s.destination || "Destination"}`, 120);
  }

  function buildCruiseTitle(result, search) {
    const r = result || {};
    const s = search || {};
    return clampText(`${r.ship || "Cruise"} · ${r.itinerary || s.destination || "Sailing"}`, 120);
  }

  function buildCard(domain, result, search) {
    const r = result || {};
    const price = normalizePriceEvidence(r.price || r.priceEvidence || r);
    const handoff = handoffModel(domain, r.handoff || { url:r.handoffUrl, quality:r.handoffQuality });
    const contextMatches = r.contextMatches !== false;
    const availability = sanitizeUserText(r.availability || r.availabilityStatus || (price.unavailable ? "availability not proven" : "availability shown by source"));
    let title = "";
    let subtitle = "";
    if (domain === "FLIGHT") {
      title = buildFlightTitle(r, search);
      subtitle = clampText(`${r.departureTime || search.departureDate || "Departure"}${r.arrivalTime ? " → " + r.arrivalTime : ""} · ${r.cabin || search.cabin || "cabin not specified"}`, 160);
    } else if (domain === "HOTEL") {
      const nights = dayCount(search.checkIn, search.checkOut);
      title = buildHotelTitle(r, search);
      subtitle = clampText(`${search.checkIn || "Check-in"} → ${search.checkOut || "Check-out"}${nights ? " · " + nights + " nights" : ""} · ${r.roomName || "room to confirm"}`, 160);
    } else {
      title = buildCruiseTitle(r, search);
      subtitle = clampText(`${r.departureDate || search.departureDate || "Departure date"} · ${r.departurePort || search.departurePort || "departure port to confirm"} · ${r.cabinCategory || "cabin to confirm"}`, 160);
    }
    return {
      domain,
      title,
      subtitle,
      price,
      availability,
      handoff,
      comparable:contextMatches && price.comparable && handoff.safe,
      contextMatches,
      badges:cardBadges(price, handoff, contextMatches),
      userWarnings:userWarnings(price, handoff, contextMatches),
      internalDetailsHidden:true,
      transactionBoundary:"Weishan helps you compare and hand off. It does not book, reserve, issue tickets, take payment, or place orders."
    };
  }

  function cardBadges(price, handoff, contextMatches) {
    const badges = [];
    if (price.testData) badges.push("Test data");
    if (price.indicative) badges.push("Indicative");
    if (price.unavailable) badges.push("Price unavailable");
    if (price.basisLabel) badges.push(price.basisLabel);
    if (handoff.safe) badges.push(handoff.cta);
    if (!contextMatches) badges.push("Wrong date/context filtered");
    return badges;
  }

  function userWarnings(price, handoff, contextMatches) {
    const warnings = [];
    if (price.testData) warnings.push("This is test/evaluation data, not a live public price.");
    if (price.indicative) warnings.push("This is a starting or indicative price; final total may change on the external site.");
    if (price.unavailable) warnings.push("No reliable price is available yet. You can still continue to the external page when a safe handoff exists.");
    if (!contextMatches) warnings.push("This result does not match the requested travel context and is not comparable.");
    if (!handoff.safe) warnings.push("No safe external link is available for this result.");
    if (handoff.downgraded) warnings.push("The link is a search page rather than an exact offer or rate.");
    return warnings.map(sanitizeUserText);
  }

  function buildSummary(domain, search) {
    const s = search || {};
    if (domain === "FLIGHT") return clampText(`${s.origin || "Origin"} → ${s.destination || "Destination"} · ${s.departureDate || "date to choose"}`, 140);
    if (domain === "HOTEL") return clampText(`${s.destination || s.propertyName || "Destination"} · ${s.checkIn || "check-in"} → ${s.checkOut || "check-out"}`, 140);
    if (domain === "CRUISE") return clampText(`${s.destination || s.ship || s.departurePort || "Cruise"} · ${s.departureDate || "date to choose"} · ${s.guests || 1} guest(s)`, 140);
    return "Travel search";
  }

  function sanitizeFailure(failure) {
    const raw = failure || {};
    return {
      sourceLabel:"A travel source",
      publicMessage:sanitizeUserText(raw.publicMessage || raw.message || "One source could not return usable results."),
      recoverable:raw.recoverable !== false
    };
  }

  function buildTravelZeroLearningUxViewModel(input) {
    const source = input || {};
    const domain = upper(source.domain || source.travelType);
    const search = source.search || {};
    const validationErrors = validateSearch(domain, search);
    const rawResults = Array.isArray(source.results) ? source.results : [];
    const cards = rawResults.map(function (result) { return buildCard(domain, result, search); });
    const matchedCards = cards.filter(function (card) { return card.contextMatches !== false; });
    const failures = Array.isArray(source.failures) ? source.failures.map(sanitizeFailure) : [];
    const allSourcesFailed = failures.length > 0 && matchedCards.length === 0 && rawResults.length === 0;
    const noResults = validationErrors.length === 0 && matchedCards.length === 0 && !allSourcesFailed;
    const metrics = {
      SEARCH_COMPLETED:validationErrors.length === 0,
      RESULT_RENDERED:matchedCards.length > 0,
      RESULT_UNDERSTANDABLE:matchedCards.every(function (card) { return !!card.title && !!card.subtitle; }),
      PRICE_STATE_CLEAR:matchedCards.every(function (card) { return !!card.price.publicState && !!card.price.display; }),
      PRICE_BASIS_CLEAR:matchedCards.every(function (card) { return !!card.price.basisLabel; }),
      CONDITIONAL_PRICE_CLEAR:matchedCards.every(function (card) { return card.price.indicative !== true || card.userWarnings.length > 0; }),
      PRICE_UNAVAILABLE_CLEAR:matchedCards.every(function (card) { return card.price.unavailable !== true || card.userWarnings.join(" ").indexOf("No reliable price") >= 0; }),
      TEST_DATA_ISOLATED:matchedCards.every(function (card) { return card.price.testData !== true || card.price.publicLivePrice === false; }),
      SAFE_HANDOFF:matchedCards.every(function (card) { return card.handoff.autoOpen === false && card.handoff.cta !== "Book Now"; }),
      NO_PROVIDER_KNOWLEDGE_REQUIRED:true,
      NO_TRANSACTION_CONFUSION:true,
      ACCESSIBLE_SUMMARY:true
    };
    return deepFreeze(Object.assign({
      moduleName:MODULE_NAME,
      version:VERSION,
      domain,
      domainLabel:DOMAIN_LABEL[domain] || "Travel",
      querySummary:buildSummary(domain, search),
      validationErrors:validationErrors.map(sanitizeUserText),
      cards:matchedCards,
      filteredOutCount:cards.length - matchedCards.length,
      noResults,
      emptyState:noResults ? "No matching travel result yet. Adjust dates, travelers, or destination and try again." : null,
      partialSourceFailure:failures.length > 0 && matchedCards.length > 0,
      allSourceFailure:allSourcesFailed,
      sourceFailures:failures,
      userSummary:publicSummary(domain, matchedCards, noResults, allSourcesFailed, validationErrors),
      metrics,
      ordinaryUserSurface:true,
      internalProviderKnowledgeRequired:false,
      providerNamesHidden:true,
      actionModel:"USER_SELECTS_THEN_HANDOFF",
      deterministicFixturesOnly:source.deterministicFixturesOnly !== false,
      accessibility:{ keyboardNavigable:true, ariaLabels:true, noTinyTarget:true, noColorOnlyState:true }
    }, boundary()));
  }

  function publicSummary(domain, cards, noResults, allSourcesFailed, errors) {
    if (errors && errors.length) return `${DOMAIN_LABEL[domain] || "Travel"} needs a little more information: ${errors[0]}`;
    if (allSourcesFailed) return "No travel source returned usable results. No booking or payment action was taken.";
    if (noResults) return "No matching result yet. Weishan did not invent a price.";
    const first = cards[0];
    if (!first) return "Ready for travel search.";
    return `${first.title} · ${first.price.display} · ${first.price.basisLabel}`;
  }

  function renderTravelZeroLearningUxHtml(model) {
    const m = model || buildTravelZeroLearningUxViewModel({});
    const cardHtml = (m.cards || []).map(function (card, index) {
      return `<article class="commerce-one-screen-card weishan-travel-zero-learning-card" tabindex="0" aria-label="${escapeHtml(card.title)}">
        <h4>${escapeHtml(card.title)}</h4>
        <p>${escapeHtml(card.subtitle)}</p>
        <p><strong>${escapeHtml(card.price.display)}</strong> · ${escapeHtml(card.price.basisLabel)}</p>
        <p>${escapeHtml(card.price.taxesAndFeesLabel)} · ${escapeHtml(card.price.freshnessLabel)}</p>
        <p>${escapeHtml(card.availability)}</p>
        <p>${escapeHtml(card.badges.join(" · "))}</p>
        ${card.userWarnings.length ? `<ul>${card.userWarnings.map(function (warning) { return `<li>${escapeHtml(warning)}</li>`; }).join("")}</ul>` : ""}
        <button type="button" class="cmd-btn gray" data-travel-zero-learning-handoff="${index}"${card.handoff.safe ? "" : " disabled"}>${escapeHtml(card.handoff.cta)}</button>
      </article>`;
    }).join("");
    const warnings = m.validationErrors && m.validationErrors.length
      ? `<div class="commerce-warning">${escapeHtml(m.validationErrors.join(" "))}</div>`
      : "";
    const empty = m.emptyState ? `<p>${escapeHtml(m.emptyState)}</p>` : "";
    const failures = m.sourceFailures && m.sourceFailures.length
      ? `<details><summary>Some sources could not answer</summary><div class="commerce-disclosure-body">${m.sourceFailures.map(function (failure) { return `<p>${escapeHtml(failure.publicMessage)}</p>`; }).join("")}</div></details>`
      : "";
    return `<section class="commerce-result-summary-panel weishan-travel-zero-learning-ux" aria-label="${escapeHtml(m.domainLabel)} zero-learning travel results" data-travel-zero-learning-ux="true">
      <div class="commerce-result-summary-head">
        <div class="commerce-result-summary-headline"><span>${escapeHtml(m.domainLabel)}</span><strong>${escapeHtml(m.querySummary)}</strong></div>
        <p>${escapeHtml(m.userSummary)}</p>
      </div>
      ${warnings}
      ${empty}
      <div class="commerce-one-screen-body">${cardHtml}</div>
      ${failures}
      <p>Weishan compares and hands off only. It does not book, reserve, issue tickets, take payment, or place orders.</p>
    </section>`;
  }

  function escapeHtml(value) {
    return sanitizeUserText(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  window.WeishanTravelZeroLearningUxViewModel = Object.freeze({
    VERSION,
    MODULE_NAME,
    buildTravelZeroLearningUxViewModel,
    renderTravelZeroLearningUxHtml,
    normalizePriceEvidence,
    validateSearch
  });
})();
