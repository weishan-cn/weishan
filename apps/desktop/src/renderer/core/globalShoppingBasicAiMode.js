(function(){
  const VERSION = "4.3.7";
  const SAFE_AI_STATES = Object.freeze(["CONNECTED", "NOT_CONFIGURED", "INVALID", "UNAVAILABLE"]);
  const CAPABILITY_FLAGS = Object.freeze({
    GLOBAL_SHOPPING_BASIC_SEARCH_REQUIRES_AI:"NO",
    GLOBAL_SHOPPING_PRICE_RETRIEVAL_REQUIRES_AI:"NO",
    GLOBAL_SHOPPING_SOURCE_DISPLAY_REQUIRES_AI:"NO",
    GLOBAL_SHOPPING_BASIC_FILTER_REQUIRES_AI:"NO",
    GLOBAL_SHOPPING_BASIC_SORT_REQUIRES_AI:"NO",
    GLOBAL_SHOPPING_COMPARE_REQUIRES_AI:"NO",
    GLOBAL_SHOPPING_DETERMINISTIC_RECOMMEND_REQUIRES_AI:"NO",
    GLOBAL_SHOPPING_HANDOFF_REQUIRES_AI:"NO",
    GLOBAL_SHOPPING_AI_ANALYSIS_REQUIRES_AI:"YES",
    GLOBAL_SHOPPING_AI_TRADEOFF_REQUIRES_AI:"YES",
    GLOBAL_SHOPPING_AI_PERSONALIZED_ADVICE_REQUIRES_AI:"YES",
    GLOBAL_SHOPPING_AI_EXPLANATION_REQUIRES_AI:"YES"
  });
  const HIGH_RISK_ZERO_METRICS = Object.freeze({
    BASIC_SEARCH_BLOCKED_WITHOUT_AI:0,
    PRICE_RETRIEVAL_BLOCKED_WITHOUT_AI:0,
    COMPARE_BLOCKED_WITHOUT_AI:0,
    HANDOFF_BLOCKED_WITHOUT_AI:0,
    AI_SEARCH_FAILURE_ERASES_BASIC_RESULTS:0,
    AI_FAILURE_ERASES_COMPARE_RESULTS:0,
    AI_FABRICATED_PRODUCTS:0,
    AI_FABRICATED_PRICES:0,
    AI_FABRICATED_PROVIDERS:0,
    AI_FABRICATED_HANDOFFS:0,
    AI_RECOMMENDS_COMPARE_REJECTED_CANDIDATE:0,
    AI_RECOMMENDS_UNAVAILABLE_CANDIDATE:0,
    AI_RECOMMENDS_STALE_CANDIDATE:0,
    AI_RECOMMENDS_TEST_DATA_AS_LIVE:0,
    AI_CROSS_CURRENCY_FALSE_WINNERS:0,
    AI_UNKNOWN_PRICE_FALSE_WINNERS:0,
    AI_PROMPT_INJECTION_POLICY_BYPASSES:0,
    AI_AUTHORITY_BYPASSES:0,
    AI_SECRET_VISIBLE_TO_RENDERER:0,
    AI_CONTENT_ANALYTICS_LEAKS:0,
    RAW_QUERY_ANALYTICS_LEAKS:0,
    COMMISSION_PRIMARY_INFLUENCE:0,
    AUTO_PURCHASE_ACTIONS:0
  });
  const BASIC_EVENTS = Object.freeze(["shopping_search_started", "shopping_search_completed", "shopping_compare_used", "shopping_handoff_clicked"]);
  const AI_EVENTS = Object.freeze(["shopping_ai_analysis_requested", "shopping_ai_analysis_completed"]);
  const AI_ONLY_ACTIONS = Object.freeze(["AI_ANALYZE", "AI_TRADEOFF", "AI_PERSONALIZED_ADVICE", "AI_EXPLAIN_RECOMMENDATION"]);
  const DANGEROUS_AI_KEYS = Object.freeze(["purchase", "order", "payment", "authorized", "trusted", "executionGate", "productionTraffic", "handoffUrl", "url", "bookingUrl", "checkoutUrl", "apiKey", "token", "secret", "authorization"]);
  const SECRET_VALUE = /(?:sk-[A-Za-z0-9_-]{8,}|Bearer\s+[A-Za-z0-9._-]+|-----BEGIN\s+(?:RSA\s+)?PRIVATE KEY-----|password\s*[:=]|token\s*[:=]|secret\s*[:=]|api[_-]?key\s*[:=]|otp\s*[:=])/i;
  const URL_VALUE = /\bhttps?:\/\/[^\s]+/i;

  function freeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { freeze(value[key]); });
    return Object.freeze(value);
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function numberOrNull(value) {
    if (value == null) return null;
    if (typeof value === "string" && value.trim() === "") return null;
    if (Array.isArray(value) || (typeof value === "object" && !(value instanceof Number))) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value == null ? null : value));
  }

  function normalizeAiState(input) {
    if (typeof input === "string") {
      const direct = text(input).toUpperCase();
      if (direct === "READY") return "CONNECTED";
      return SAFE_AI_STATES.indexOf(direct) >= 0 ? direct : "NOT_CONFIGURED";
    }
    const raw = text(input && (input.state || input.aiState || input.status)).toUpperCase();
    if (raw === "READY") return "CONNECTED";
    return SAFE_AI_STATES.indexOf(raw) >= 0 ? raw : "NOT_CONFIGURED";
  }

  function canonicalCandidate(raw, index) {
    const item = raw && typeof raw === "object" ? raw : {};
    const total = numberOrNull(item.totalComparablePrice != null ? item.totalComparablePrice : item.totalLandedCost != null ? item.totalLandedCost : item.landedTotal != null ? item.landedTotal : item.totalPrice != null ? item.totalPrice : item.price);
    const price = numberOrNull(item.price != null ? item.price : item.totalPrice);
    const currency = text(item.currency).toUpperCase();
    const environment = text(item.sourceEnvironment || item.environment || item.sourceType).toUpperCase();
    const availability = text(item.availability || item.availabilityStatus).toUpperCase();
    const evidenceStatus = text(item.evidenceStatus || item.status || item.validationStatus).toUpperCase();
    const condition = text(item.condition || item.itemCondition || item.variants && item.variants.condition).toLowerCase();
    const variant = text(item.variantKey || item.variant || item.sku || item.productVariant || item.variants && JSON.stringify(item.variants));
    const source = text(item.provider || item.providerName || item.source || item.sourceName || item.merchant);
    const handoffUrl = text(item.handoffUrl || item.itemUrl || item.productUrl || item.url);
    const freshness = text(item.freshness || item.freshnessStatus || item.priceFreshness).toUpperCase();
    const comparable = item.comparable === true || item.compareEligible === true || item.eligible === true || evidenceStatus === "ACCEPTED" || evidenceStatus === "READY" || evidenceStatus === "VALID";
    const testData = item.testData === true || item.sandbox === true || item.isTest === true || /SANDBOX|TEST|EVALUATION|DEMO/.test(environment + " " + evidenceStatus);
    const stale = item.stale === true || freshness === "STALE" || evidenceStatus === "STALE";
    const unavailable = item.unavailable === true || availability === "OUT_OF_STOCK" || availability === "UNAVAILABLE" || evidenceStatus === "UNAVAILABLE";
    const rejected = item.rejected === true || item.compareRejected === true || evidenceStatus === "REJECTED" || evidenceStatus === "BLOCKED";
    return freeze({
      id:text(item.id || item.offerId || item.candidateId || item.quoteId || ("candidate-" + index)),
      title:text(item.title || item.productName || item.name || item.itemTitle || "Unknown product"),
      source,
      variant,
      condition,
      price,
      totalComparablePrice:total,
      currency,
      availability:availability || "UNKNOWN",
      freshness:freshness || "UNKNOWN",
      handoffUrl,
      comparable,
      rejected,
      unavailable,
      stale,
      testData,
      commissionEligible:item.commissionEligible === true,
      commissionRate:numberOrNull(item.commissionRate || item.commission),
      evidence:clone(item.evidence || item)
    });
  }

  function normalizeCandidates(input) {
    const raw = Array.isArray(input) ? input : [];
    return freeze(raw.slice(0, 5000).map(canonicalCandidate));
  }

  function hasSafeHandoffUrl(candidate) {
      if (!candidate.handoffUrl || candidate.rejected || candidate.unavailable || candidate.stale || candidate.testData) return false;
      try {
        const url = new URL(candidate.handoffUrl);
        if (url.protocol !== "https:") return false;
        if (/\/(?:checkout|cart|order|payment|pay|booking|reserve)(?:\/|$)/i.test(url.pathname)) return false;
        if (/(?:token|secret|api[_-]?key|password|authorization|otp)=/i.test(url.search)) return false;
        return true;
      } catch (_) {
        return false;
      }
  }

  function eligibleForBasic(candidate) {
    return candidate && candidate.comparable === true && candidate.rejected !== true && candidate.unavailable !== true && candidate.stale !== true && candidate.testData !== true && candidate.totalComparablePrice !== null && !!candidate.currency && hasSafeHandoffUrl(candidate);
  }

  function buildDeterministicComparison(candidates, options) {
    const list = normalizeCandidates(candidates);
    const filter = text(options && options.filter).toLowerCase();
    const filtered = filter ? list.filter(function (candidate) {
      return [candidate.title, candidate.source, candidate.variant, candidate.condition].join(" ").toLowerCase().indexOf(filter) >= 0;
    }) : list.slice();
    const currencies = Array.from(new Set(filtered.filter(eligibleForBasic).map(function (candidate) { return candidate.currency; })));
    const comparable = currencies.length === 1
      ? filtered.filter(eligibleForBasic).slice().sort(function (left, right) {
        return left.totalComparablePrice - right.totalComparablePrice || left.title.localeCompare(right.title) || left.id.localeCompare(right.id);
      })
      : [];
    const clearWinner = comparable.length > 0 && (comparable.length === 1 || comparable[0].totalComparablePrice < comparable[1].totalComparablePrice);
    const status = filtered.length === 0 ? "NO_RESULT" : currencies.length > 1 ? "NO_CLEAR_WINNER" : clearWinner ? "CLEAR_WINNER" : "NO_CLEAR_WINNER";
    return freeze({
      status,
      candidates:filtered,
      comparableCandidates:comparable,
      currency:currencies.length === 1 ? currencies[0] : "",
      deterministicRecommendation:clearWinner ? {
        candidateId:comparable[0].id,
        title:comparable[0].title,
        reason:"当前可比结果中，这个总价最低。",
        reasonCode:"LOWEST_COMPARABLE_TOTAL_PRICE",
        requiresAi:false,
        commissionUsedForRanking:false
      } : null,
      noClearWinner:!clearWinner,
      blockedReasons:freeze({
        crossCurrency:currencies.length > 1,
        unknownPrice:filtered.some(function (candidate) { return candidate.totalComparablePrice === null; }),
        unsafeHandoff:filtered.some(function (candidate) { return candidate.handoffUrl && !hasSafeHandoffUrl(candidate); }),
        stale:filtered.some(function (candidate) { return candidate.stale; }),
        unavailable:filtered.some(function (candidate) { return candidate.unavailable; }),
        testData:filtered.some(function (candidate) { return candidate.testData; })
      })
    });
  }

  function safeHandoffCandidates(candidates) {
    return freeze(normalizeCandidates(candidates).filter(hasSafeHandoffUrl));
  }

  function capabilityMatrix() {
    const rows = [
      ["SEARCH_PRODUCTS", true, false, true, "Provider/source retrieval"],
      ["RETRIEVE_PRICE", true, false, true, "Provider adapters / source truth"],
      ["DISPLAY_PRICE", true, false, true, "Price normalization truth"],
      ["FILTER", false, false, true, "Structured candidate fields"],
      ["SORT", false, false, true, "Comparable total price truth"],
      ["COMPARE", true, false, true, "Frozen Compare truth"],
      ["DETERMINISTIC_RECOMMEND", true, false, true, "Frozen Recommend truth"],
      ["AI_ANALYZE", true, true, false, "AI grounded in Compare/Recommend truth"],
      ["AI_TRADEOFF", true, true, false, "AI grounded in evidence/preferences"],
      ["AI_PERSONALIZED_ADVICE", true, true, false, "Explicit current user preference only"],
      ["AI_EXPLAIN_RECOMMENDATION", true, true, false, "AI explanation over eligible evidence"],
      ["HANDOFF", true, false, true, "Frozen Handoff truth"]
    ];
    return freeze(rows.map(function (row) {
      return { capability:row[0], requiresShoppingSource:row[1], requiresAi:row[2], availableWithoutAi:row[3], truthAuthority:row[4], status:"ENFORCED" };
    }));
  }

  function moduleInventory() {
    return freeze([
      { module:"Search routing", capability:"product/search intent routing", aiDependency:"NO for basic", sourceOfTruth:"Search / source retrieval", userEffect:"Shopping opens and searches without AI", removeItResult:"Search degraded", decision:"KEEP" },
      { module:"Shopping source retrieval", capability:"trusted product/price evidence", aiDependency:"NO", sourceOfTruth:"Provider/source truth", userEffect:"Prices can display without AI", removeItResult:"No evidence", decision:"KEEP" },
      { module:"Price normalization", capability:"price/currency/availability/freshness truth", aiDependency:"NO", sourceOfTruth:"Adapter normalizer", userEffect:"No invented prices", removeItResult:"Unsafe comparison", decision:"KEEP" },
      { module:"Compare", capability:"deterministic compatibility and ordering", aiDependency:"NO", sourceOfTruth:"Compare truth", userEffect:"Structured comparison works without AI", removeItResult:"No truthful compare", decision:"KEEP" },
      { module:"Recommend", capability:"deterministic clear winner when evidence proves it", aiDependency:"NO", sourceOfTruth:"Recommend truth", userEffect:"Lowest comparable total can be named", removeItResult:"No basic advice", decision:"KEEP" },
      { module:"AI connector", capability:"intent/tradeoff/explanation", aiDependency:"YES for AI analysis only", sourceOfTruth:"User-managed AI service", userEffect:"JIT Connect AI prompt for advanced analysis", removeItResult:"Basic mode still works", decision:"OPTIMIZE" },
      { module:"Handoff", capability:"safe exact external open", aiDependency:"NO", sourceOfTruth:"Handoff truth", userEffect:"User can continue safely without AI", removeItResult:"No external continuation", decision:"KEEP" },
      { module:"Analytics", capability:"coarse usage measurement", aiDependency:"NO", sourceOfTruth:"Anonymous analytics allowlist", userEffect:"No raw query/content leakage", removeItResult:"Less product insight", decision:"OPTIMIZE" }
    ]);
  }

  function containsDangerousKey(value) {
    if (!value || typeof value !== "object") return false;
    return Object.keys(value).some(function (key) {
      return DANGEROUS_AI_KEYS.indexOf(key) >= 0 || containsDangerousKey(value[key]);
    });
  }

  function scanUnsafeText(value) {
    if (typeof value === "string") return SECRET_VALUE.test(value) || URL_VALUE.test(value);
    if (!value || typeof value !== "object") return false;
    return Object.keys(value).some(function (key) { return scanUnsafeText(value[key]); });
  }

  function validateAiOutput(output, comparison, userPreference) {
    const safeComparison = comparison || buildDeterministicComparison([]);
    if (!output || typeof output !== "object" || Array.isArray(output)) return freeze({ ok:false, code:"AI_OUTPUT_INVALID", explanation:null });
    if (containsDangerousKey(output) || scanUnsafeText(output)) return freeze({ ok:false, code:"AI_OUTPUT_AUTHORITY_OR_SECRET_REJECTED", explanation:null });
    const recommendedId = text(output.recommendedCandidateId || output.candidateId);
    const eligibleIds = new Set(safeComparison.comparableCandidates.map(function (candidate) { return candidate.id; }));
    if (recommendedId && !eligibleIds.has(recommendedId)) return freeze({ ok:false, code:"AI_RECOMMENDED_INELIGIBLE_CANDIDATE", explanation:null });
    if (safeComparison.deterministicRecommendation && recommendedId && recommendedId !== safeComparison.deterministicRecommendation.candidateId && !text(userPreference)) {
      return freeze({ ok:false, code:"AI_CONTRADICTED_CLEAR_DETERMINISTIC_WINNER", explanation:null });
    }
    const claims = Array.isArray(output.claims) ? output.claims : [];
    const evidenceKeys = new Set(safeComparison.candidates.flatMap(function (candidate) {
      return Object.keys(candidate.evidence || {}).concat(["title", "source", "price", "totalComparablePrice", "currency", "availability", "freshness", "variant", "condition"]);
    }));
    const unsupported = claims.filter(function (claim) {
      const field = text(claim && claim.field);
      return !field || !evidenceKeys.has(field);
    });
    if (unsupported.length) return freeze({ ok:false, code:"AI_UNSUPPORTED_CLAIM_REJECTED", explanation:null });
    return freeze({
      ok:true,
      code:"AI_ANALYSIS_GROUNDED",
      explanation:{
        summary:text(output.summary || output.explanation || "这些候选各有取舍。").slice(0, 500),
        recommendedCandidateId:recommendedId || (safeComparison.deterministicRecommendation && safeComparison.deterministicRecommendation.candidateId) || "",
        claims:claims.slice(0, 12).map(function (claim) { return { field:text(claim.field), value:text(claim.value).slice(0, 160) }; }),
        requiresAi:true,
        grounded:true
      }
    });
  }

  function requestAiAnalysis(input) {
    const options = input && typeof input === "object" ? input : {};
    const aiState = normalizeAiState(options.aiState || options);
    const candidates = normalizeCandidates(options.candidates || []);
    const comparison = buildDeterministicComparison(candidates, options);
    if (aiState !== "CONNECTED") {
      return freeze({
        status:"AI_REQUIRED",
        aiState,
        promptTitle:"连接 AI 服务以获得智能分析",
        promptBody:"连接后，Weishan 可以根据你的需求分析差异、权衡优缺点并给出建议。",
        primaryActionLabel:"连接 AI 服务",
        basicResultsPreserved:true,
        comparison
      });
    }
    const validation = validateAiOutput(options.aiOutput || {}, comparison, text(options.userPreference));
    if (!validation.ok) {
      return freeze({ status:"AI_FAILED_SAFE", aiState, errorClass:"AI_ANALYSIS_UNAVAILABLE", basicResultsPreserved:true, comparison, validation });
    }
    return freeze({ status:"AI_ANALYSIS_READY", aiState, basicResultsPreserved:true, comparison, analysis:validation.explanation });
  }

  function validateAiIntentOutput(output) {
    const allowed = ["category", "brandPreference", "budget", "requiredFeatures", "optionalFeatures", "conditionPreference", "sortPreference"];
    if (!output || typeof output !== "object" || Array.isArray(output) || containsDangerousKey(output) || scanUnsafeText(output)) return freeze({ ok:false, value:{}, rejected:true });
    const value = {};
    Object.keys(output).forEach(function (key) {
      if (allowed.indexOf(key) >= 0) value[key] = Array.isArray(output[key]) ? output[key].map(text).filter(Boolean).slice(0, 12) : text(output[key]).slice(0, 160);
    });
    return freeze({ ok:true, value, rejected:false, droppedUnknownFields:Object.keys(output).filter(function (key) { return allowed.indexOf(key) < 0; }).length });
  }

  function sanitizeAnalyticsEvent(name, payload) {
    const eventName = text(name);
    if (BASIC_EVENTS.indexOf(eventName) < 0 && AI_EVENTS.indexOf(eventName) < 0) return freeze({ ok:false, code:"UNKNOWN_EVENT" });
    const safe = {
      eventName,
      moduleId:"SHOPPING",
      actionClass:AI_EVENTS.indexOf(eventName) >= 0 ? "AI_ANALYSIS" : eventName.indexOf("handoff") >= 0 ? "HANDOFF" : eventName.indexOf("compare") >= 0 ? "COMPARE" : "SEARCH",
      outcome:["SUCCESS", "PARTIAL", "NO_RESULT", "FAILURE", "SAFE_BLOCK", "CANCELLED"].indexOf(text(payload && payload.outcome).toUpperCase()) >= 0 ? text(payload.outcome).toUpperCase() : "SUCCESS",
      resultCountBucket:text(payload && payload.resultCountBucket) || "UNKNOWN",
      errorClassSafe:text(payload && payload.errorClassSafe) || "NONE"
    };
    return freeze({ ok:true, event:safe, rawQueryCollected:false, aiContentCollected:false, credentialCollected:false, fullUrlCollected:false });
  }

  function buildViewModel(input) {
    const options = input && typeof input === "object" ? input : {};
    const candidates = normalizeCandidates(options.candidates || options.results || []);
    const comparison = buildDeterministicComparison(candidates, options);
    const handoff = safeHandoffCandidates(candidates);
    const aiState = normalizeAiState(options.aiState || options);
    return freeze({
      version:VERSION,
      capabilityFlags:CAPABILITY_FLAGS,
      highRiskZeroMetrics:HIGH_RISK_ZERO_METRICS,
      aiState,
      modeLabel:aiState === "CONNECTED" ? "Shopping + AI analysis" : "Shopping works without AI",
      userFacingTitle:"购物可直接搜索；需要更深入分析时再连接 AI 服务",
      basicPipeline:["SEARCH", "PRICE_RESULTS", "COMPARE", "DETERMINISTIC_RECOMMEND_IF_CLEAR", "USER_SELECTS", "HANDOFF"],
      aiPipeline:["SEARCH", "COMPARE", "AI_GROUNDED_ANALYSIS", "ADVISE", "USER_SELECTS", "HANDOFF"],
      basicAvailable:true,
      aiAnalysisAvailable:aiState === "CONNECTED",
      connectAiPrompt:aiState === "CONNECTED" ? null : { title:"连接 AI 服务以获得智能分析", body:"搜索、价格、比较和安全跳转不需要 AI；深度权衡和个性化建议需要 AI。", actionLabel:"连接 AI 服务" },
      candidates,
      comparison,
      handoffCandidates:handoff,
      analytics:{ basicMode:"COARSE_ONLY", aiMode:"COARSE_ONLY", rawQuery:"EXCLUDED", analysisText:"EXCLUDED", fullUrl:"EXCLUDED", credentials:"EXCLUDED" },
      authority:{ aiPriceSource:false, aiProvider:false, aiHandoffAuthority:false, aiTransactionAuthority:false, userSelectsBeforeHandoff:true, commissionPrimaryInfluence:false }
    });
  }

  window.WeishanGlobalShoppingBasicAiMode = freeze({
    VERSION,
    CAPABILITY_FLAGS,
    HIGH_RISK_ZERO_METRICS,
    AI_ONLY_ACTIONS,
    normalizeAiState,
    normalizeCandidates,
    buildDeterministicComparison,
    safeHandoffCandidates,
    capabilityMatrix,
    moduleInventory,
    validateAiOutput,
    requestAiAnalysis,
    validateAiIntentOutput,
    sanitizeAnalyticsEvent,
    buildViewModel
  });
})();
