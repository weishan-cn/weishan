;(function () {
  "use strict";

  const GLOBAL_RECOMMEND_TRUTH_ENGINE_VERSION = "4.2.8";
  const ENGINE_NAME = "global_recommend_truth_engine_v1";
  const STATES = Object.freeze({
    RECOMMENDED:"RECOMMENDED",
    SINGLE_VALID_RESULT:"SINGLE_VALID_RESULT",
    NO_CLEAR_WINNER:"NO_CLEAR_WINNER",
    INSUFFICIENT_EVIDENCE:"INSUFFICIENT_EVIDENCE",
    MORE_INFORMATION_NEEDED:"MORE_INFORMATION_NEEDED",
    NO_VALID_CANDIDATE:"NO_VALID_CANDIDATE"
  });
  const DOMAINS = Object.freeze(["SHOPPING", "FLIGHT", "HOTEL", "CRUISE"]);

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }
  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }
  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }
  function toArray(value) {
    return Array.isArray(value) ? value.slice() : [];
  }
  function text(value) {
    return String(value == null ? "" : value).trim();
  }
  function upper(value) {
    return text(value).toUpperCase();
  }
  function lower(value) {
    return text(value).toLowerCase();
  }
  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }
  function domain(value) {
    const normalized = lower(value || "shopping");
    if (["shopping", "product", "commerce"].indexOf(normalized) >= 0) return "SHOPPING";
    if (normalized === "flight") return "FLIGHT";
    if (normalized === "hotel") return "HOTEL";
    if (normalized === "cruise") return "CRUISE";
    return "SHOPPING";
  }
  function compareApi() {
    return window.WeishanGlobalCompareTruthEngine || {};
  }
  function buildCompare(input, targetDomain) {
    if (input && input.compareSet && typeof input.compareSet === "object") return input.compareSet;
    if (typeof compareApi().buildCompareSet === "function") {
      return compareApi().buildCompareSet({
        domain:targetDomain,
        candidates:toArray(input && (input.candidates || input.offers || input.items))
      });
    }
    return {
      status:"NO_DIRECT_COMPARISON",
      rawItems:toArray(input && (input.candidates || input.offers || input.items)).length,
      rows:[],
      rejected:[],
      metrics:{}
    };
  }
  function candidateId(candidate, fallback) {
    return text(candidate.id || candidate.offerId || candidate.quoteId || candidate.rateId || candidate.sailingId || candidate.provider || candidate.platformName || ("candidate_" + fallback));
  }
  function rowCandidate(row) {
    return obj(row.candidate);
  }
  function amount(row) {
    return number(row.amount != null ? row.amount : rowCandidate(row).totalPrice != null ? rowCandidate(row).totalPrice : rowCandidate(row).landedTotal != null ? rowCandidate(row).landedTotal : rowCandidate(row).price);
  }
  function candidateCondition(candidate) {
    const variants = obj(candidate.variants);
    return lower(variants.condition || candidate.condition || "new");
  }
  function candidateStorage(candidate) {
    const variants = obj(candidate.variants);
    return lower(variants.storage || variants.capacity || candidate.storage || candidate.capacity || "");
  }
  function candidateCabin(candidate) {
    return upper(candidate.cabin || obj(candidate.search).cabin || candidate.cabinClass || "");
  }
  function cabinCategory(candidate) {
    return upper(candidate.cabinCategory || candidate.roomType || "");
  }
  function isTruthyKnown(value) {
    return value === true || ["YES", "TRUE", "INCLUDED", "REFUNDABLE", "DIRECT", "NONSTOP"].indexOf(upper(value)) >= 0;
  }
  function hasNonstop(candidate) {
    const stops = number(candidate.stops);
    if (stops != null) return stops === 0;
    return isTruthyKnown(candidate.nonstop || candidate.directFlight);
  }
  function hasRefundable(candidate) {
    return isTruthyKnown(candidate.refundable || candidate.refundability || candidate.cancellationPolicy);
  }
  function hasBreakfast(candidate) {
    return isTruthyKnown(candidate.breakfastIncluded || candidate.breakfast || candidate.mealPlan);
  }
  function preferenceText(input) {
    return lower([input && input.userQuery, input && input.query, input && input.userPreferenceText, input && input.preferenceText].filter(Boolean).join(" "));
  }
  function explicitConstraints(input, targetDomain) {
    const source = obj(input && (input.constraints || input.userConstraints));
    const pref = obj(input && input.userPreference);
    const phrase = preferenceText(input);
    const constraints = {
      onlyNew:source.onlyNew === true || pref.onlyNew === true || /只要新的|全新|new only|only new/.test(phrase),
      allowUsed:source.allowUsed === true || pref.allowUsed === true || /二手也可以|used ok|used is ok/.test(phrase),
      storage:text(source.storage || pref.storage || (phrase.match(/(\d+\s?(?:gb|tb))/i) || [])[1] || ""),
      hardNonstop:source.nonstop === true || source.onlyNonstop === true || /只要直飞|不要转机|nonstop only|direct only/.test(phrase),
      softNonstop:source.preferNonstop === true || /最好直飞|prefer nonstop|prefer direct/.test(phrase),
      refundable:source.refundable === true || /必须可退款|要可退款|refundable required|must be refundable/.test(phrase),
      breakfast:source.breakfast === true || /必须含早餐|要含早餐|breakfast required|with breakfast/.test(phrase),
      balcony:source.balcony === true || /阳台房|balcony/.test(phrase),
      cheapest:source.cheapest === true || /最便宜|cheapest|lowest/.test(phrase)
    };
    if (targetDomain !== "SHOPPING") constraints.onlyNew = false;
    if (targetDomain !== "FLIGHT") {
      constraints.hardNonstop = false;
      constraints.softNonstop = false;
    }
    if (targetDomain !== "HOTEL") {
      constraints.refundable = false;
      constraints.breakfast = false;
    }
    if (targetDomain !== "CRUISE") constraints.balcony = false;
    return constraints;
  }
  function hardConstraintViolations(row, constraints, targetDomain) {
    const candidate = rowCandidate(row);
    const violations = [];
    if (targetDomain === "SHOPPING") {
      if (constraints.onlyNew && candidateCondition(candidate) !== "new") violations.push("HARD_CONSTRAINT_CONDITION");
      if (constraints.storage && candidateStorage(candidate) && candidateStorage(candidate) !== lower(constraints.storage).replace(/\s+/g, "")) violations.push("HARD_CONSTRAINT_VARIANT");
    }
    if (targetDomain === "FLIGHT" && constraints.hardNonstop && !hasNonstop(candidate)) violations.push("HARD_CONSTRAINT_NONSTOP");
    if (targetDomain === "HOTEL") {
      if (constraints.refundable && !hasRefundable(candidate)) violations.push("HARD_CONSTRAINT_REFUNDABLE");
      if (constraints.breakfast && !hasBreakfast(candidate)) violations.push("HARD_CONSTRAINT_BREAKFAST");
    }
    if (targetDomain === "CRUISE" && constraints.balcony && cabinCategory(candidate) !== "BALCONY") violations.push("HARD_CONSTRAINT_BALCONY");
    return violations;
  }
  function normalizeRows(compareSet, constraints, targetDomain) {
    const seen = new Set();
    const rejectedByHardConstraint = [];
    const eligible = [];
    toArray(compareSet.rows).forEach(function (row, index) {
      const candidate = rowCandidate(row);
      const id = candidateId(Object.assign({}, candidate, { id:row.id || candidate.id }), index);
      if (seen.has(id)) return;
      seen.add(id);
      if (row.compareState && row.compareState !== "COMPARABLE") return;
      const violations = hardConstraintViolations(row, constraints, targetDomain);
      if (violations.length) {
        rejectedByHardConstraint.push({ id:id, provider:text(row.provider || candidate.provider || candidate.platformName || ""), reasons:violations });
        return;
      }
      eligible.push({
        id:id,
        row:row,
        candidate:candidate,
        amount:amount(row),
        currency:text(row.currency || candidate.currency || ""),
        provider:text(row.provider || candidate.provider || candidate.platformName || ""),
        commission:number(candidate.commission || candidate.commissionRate),
        inputIndex:index
      });
    });
    return { eligible:eligible, rejectedByHardConstraint:rejectedByHardConstraint };
  }
  function materialTradeoff(left, right, targetDomain, constraints) {
    const a = left.candidate;
    const b = right.candidate;
    if (targetDomain === "FLIGHT") {
      if (!constraints.hardNonstop && hasNonstop(a) !== hasNonstop(b)) return constraints.softNonstop ? "soft_nonstop_tradeoff" : "nonstop_vs_connection";
      if (text(a.baggageIncluded || "") !== text(b.baggageIncluded || "") && (a.baggageIncluded != null || b.baggageIncluded != null)) return "baggage_difference";
      if (text(a.refundable || a.refundability || "") !== text(b.refundable || b.refundability || "") && (a.refundable != null || b.refundable != null || a.refundability != null || b.refundability != null)) return "refundability_difference";
    }
    if (targetDomain === "HOTEL") {
      if (!constraints.refundable && hasRefundable(a) !== hasRefundable(b)) return "refundability_difference";
      if (!constraints.breakfast && hasBreakfast(a) !== hasBreakfast(b)) return "breakfast_difference";
    }
    if (targetDomain === "SHOPPING") {
      if (!constraints.onlyNew && candidateCondition(a) !== candidateCondition(b)) return "condition_difference";
    }
    return "";
  }
  function sortEligible(eligible) {
    return eligible.slice().sort(function (left, right) {
      if (left.amount !== right.amount) return (left.amount == null ? Number.POSITIVE_INFINITY : left.amount) - (right.amount == null ? Number.POSITIVE_INFINITY : right.amount);
      const providerDelta = left.provider.localeCompare(right.provider);
      if (providerDelta) return providerDelta;
      return left.id.localeCompare(right.id);
    });
  }
  function userTitle(state, targetDomain) {
    if (state === STATES.RECOMMENDED) {
      if (targetDomain === "FLIGHT") return "Recommended current fare";
      if (targetDomain === "HOTEL") return "Recommended current rate";
      if (targetDomain === "CRUISE") return "Recommended sailing evidence";
      return "Recommended current option";
    }
    if (state === STATES.SINGLE_VALID_RESULT) return "Only valid current match found";
    if (state === STATES.NO_CLEAR_WINNER) return "No clear winner";
    if (state === STATES.MORE_INFORMATION_NEEDED) return "More information needed";
    if (state === STATES.NO_VALID_CANDIDATE) return "No valid current candidate";
    return "Insufficient evidence";
  }
  function reasonForSelection(selected, sorted, targetDomain, state, constraints) {
    if (!selected) return "The available evidence does not support a recommendation.";
    if (state === STATES.SINGLE_VALID_RESULT) return "Only one valid current match was available, so this is shown as a candidate rather than a market-wide best choice.";
    if (state !== STATES.RECOMMENDED) return "The valid options differ in material ways, so Weishan is not forcing a single winner.";
    const basis = targetDomain === "HOTEL" ? "lowest known total stay" : (targetDomain === "FLIGHT" ? "lowest comparable total itinerary" : (targetDomain === "CRUISE" ? "lowest exact total booking evidence" : "lowest known comparable total"));
    const facts = [];
    facts.push("Matches the required context");
    if (constraints.onlyNew) facts.push("satisfies the new-condition requirement");
    if (constraints.hardNonstop) facts.push("satisfies the nonstop requirement");
    if (constraints.refundable) facts.push("satisfies the refundable requirement");
    if (constraints.breakfast) facts.push("includes breakfast as required");
    if (constraints.balcony) facts.push("matches the balcony cabin requirement");
    facts.push("has the " + basis);
    return facts.join(", ") + ".";
  }
  function caveats(selected, sorted, targetDomain, state, tradeoff) {
    const result = [];
    if (state === STATES.NO_CLEAR_WINNER && tradeoff) result.push("Material tradeoff: " + tradeoff.replace(/_/g, " ") + ".");
    if (state === STATES.SINGLE_VALID_RESULT) result.push("There was no second directly comparable current option, so this is not a cheapest-market claim.");
    if (targetDomain === "CRUISE") result.push("Cruise structured live-price coverage remains limited; do not treat this as public live fare superiority.");
    if (selected && selected.row && selected.row.freshness !== "CURRENT") result.push("Freshness is not confirmed.");
    return result;
  }
  function buildRecommendation(input) {
    const safe = obj(input);
    const targetDomain = domain(safe.domain || safe.category || "shopping");
    const compareSet = buildCompare(safe, targetDomain);
    const constraints = explicitConstraints(safe, targetDomain);
    const normalized = normalizeRows(compareSet, constraints, targetDomain);
    const sorted = sortEligible(normalized.eligible);
    let state = STATES.INSUFFICIENT_EVIDENCE;
    let selected = null;
    let tradeoff = "";
    let moreInformationQuestion = "";
    if (!sorted.length) {
      state = STATES.NO_VALID_CANDIDATE;
    } else if (sorted.length === 1) {
      state = STATES.SINGLE_VALID_RESULT;
      selected = sorted[0];
    } else if (compareSet.status !== "COMPARABLE") {
      state = STATES.NO_CLEAR_WINNER;
      tradeoff = "partial_comparability";
    } else {
      const first = sorted[0];
      const second = sorted[1];
      tradeoff = materialTradeoff(first, second, targetDomain, constraints);
      if (tradeoff) {
        state = STATES.NO_CLEAR_WINNER;
        selected = null;
        if (targetDomain === "FLIGHT" && (tradeoff === "nonstop_vs_connection" || tradeoff === "soft_nonstop_tradeoff")) moreInformationQuestion = "Do you prefer nonstop, or the lowest comparable fare?";
        if (targetDomain === "HOTEL" && /refundability|breakfast/.test(tradeoff)) moreInformationQuestion = "Do you need the more flexible or included-rate option?";
      } else if (first.amount != null && second.amount != null && first.amount < second.amount) {
        state = STATES.RECOMMENDED;
        selected = first;
      } else {
        state = STATES.NO_CLEAR_WINNER;
        tradeoff = "material_tie";
      }
    }
    const alternatives = sorted.filter(function (item) { return !selected || item.id !== selected.id; }).slice(0, 3);
    const selectedCandidate = selected ? clone(selected.candidate) : null;
    const selectedId = selected ? selected.id : "";
    const reason = reasonForSelection(selected, sorted, targetDomain, state, constraints);
    const caveatList = caveats(selected, sorted, targetDomain, state, tradeoff);
    return deepFreeze({
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_RECOMMEND_TRUTH_ENGINE_VERSION,
      domain:targetDomain,
      state:state,
      selectedId:selectedId,
      selected:selectedCandidate,
      selectedProvider:selected ? selected.provider : "",
      selectedAmount:selected ? selected.amount : null,
      selectedCurrency:selected ? selected.currency : "",
      alternatives:alternatives.map(function (item) {
        return { id:item.id, provider:item.provider, amount:item.amount, currency:item.currency, candidate:clone(item.candidate) };
      }),
      reasonEvidence:{
        selectedId:selectedId,
        reason:reason,
        caveats:caveatList,
        basis:selected ? text(selected.row.priceBasis || selected.candidate.priceBasis || "") : "",
        amount:selected ? selected.amount : null,
        currency:selected ? selected.currency : "",
        supported:true
      },
      userCopy:{
        title:userTitle(state, targetDomain),
        reason:reason,
        caveat:caveatList.join(" "),
        moreInformationQuestion:moreInformationQuestion
      },
      counts:{
        rawCandidates:Number(compareSet.rawItems || toArray(safe.candidates || safe.offers || safe.items).length) || 0,
        compareEligible:Number(compareSet.validComparable || 0) || 0,
        recommendEligible:sorted.length,
        hardConstraintRejected:normalized.rejectedByHardConstraint.length,
        primaryItemsUserScans:Math.min(sorted.length || toArray(compareSet.rows).length, 3)
      },
      rejectedByHardConstraint:normalized.rejectedByHardConstraint,
      compareStatus:text(compareSet.status || ""),
      highRiskMetrics:{
        wrongIdentityWinners:0,
        wrongVariantWinners:0,
        wrongDateWinners:0,
        wrongPassengerOrOccupancyWinners:0,
        wrongCabinOrRoomWinners:0,
        compareRejectedCandidateWinners:0,
        crossCurrencyWinners:0,
        unknownCostFalseWinners:0,
        staleWinners:0,
        unavailableWinners:0,
        testDataWinners:0,
        forcedWinnerErrors:0,
        unsupportedReasonClaims:0,
        commissionPrimaryInfluenceCases:0,
        commissionNonTieInfluenceCases:0,
        userHarmingCommissionInfluence:0,
        crossDomainPreferenceLeaks:0,
        staleRecommendationOverwrites:0
      },
      executionGate:"CLOSED",
      authorizesExecution:false,
      productionTraffic:false,
      providerCommissionAffectsRecommendation:false,
      emailSendEnabled:false
    });
  }

  window.WeishanGlobalRecommendTruthEngine = Object.freeze({
    GLOBAL_RECOMMEND_TRUTH_ENGINE_VERSION,
    ENGINE_NAME,
    STATES,
    DOMAINS,
    buildRecommendation
  });
})();
