(function(){
  "use strict";

  const VERSION = "1.1.0";

  const DESTINATIONS = Object.freeze({
    MAIL:"MAIL",
    COMMERCE:"COMMERCE",
    CHAT:"CHAT",
    CLARIFY:"CLARIFY",
    MIXED:"MIXED"
  });

  const SEARCH_DOMAINS = Object.freeze({
    SHOPPING:"SHOPPING",
    FLIGHT:"FLIGHT",
    HOTEL:"HOTEL",
    CRUISE:"CRUISE",
    MAIL:"MAIL",
    UNKNOWN:"UNKNOWN"
  });

  const SEARCH_OUTCOMES = Object.freeze({
    READY:"READY",
    CLARIFY:"CLARIFY",
    MIXED:"MIXED",
    NO_RESULT:"NO_RESULT",
    SOURCE_FAILURE:"SOURCE_FAILURE",
    REJECTED:"REJECTED"
  });

  const ROUTING_CASES = Object.freeze([
    { id:"mail-reply-waiting-zh", text:"谁还在等我回复？", expected:"MAIL", kind:"clear" },
    { id:"mail-invoice-product-zh", text:"找上个月苹果电脑发票", expected:"MAIL", kind:"clear" },
    { id:"mail-hotel-confirmation-zh", text:"帮我找东京酒店确认邮件", expected:"MAIL", kind:"clear" },
    { id:"mail-order-receipt-en", text:"Find my MacBook order receipt email", expected:"MAIL", kind:"clear" },
    { id:"shopping-macbook-zh", text:"帮我买一台性价比高的 MacBook，美国和日本比较，收货到中国", expected:"COMMERCE", kind:"clear" },
    { id:"shopping-phone-zh", text:"买华为手机，中国购买，收货到成都", expected:"COMMERCE", kind:"clear" },
    { id:"shopping-model-short-zh", text:"MacBook Air M4 16+512 哪里便宜", expected:"COMMERCE", kind:"clear" },
    { id:"shopping-phone-variant-zh", text:"iPhone 17 Pro 512GB 哪里便宜", expected:"COMMERCE", kind:"clear" },
    { id:"shopping-console-en", text:"PS5 slim cheapest price", expected:"COMMERCE", kind:"clear" },
    { id:"flight-search-zh", text:"查 7 月 15 日成都到北京机票", expected:"COMMERCE", kind:"clear" },
    { id:"flight-booking-zh", text:"帮我预定 7 月 15 日成都到北京机票", expected:"COMMERCE", kind:"clear" },
    { id:"flight-date-route-zh", text:"上海到成都7月15日机票", expected:"COMMERCE", kind:"clear" },
    { id:"flight-people-cabin-zh", text:"成都到东京下周两个人经济舱", expected:"COMMERCE", kind:"clear" },
    { id:"hotel-price-zh", text:"比较东京酒店价格", expected:"COMMERCE", kind:"clear" },
    { id:"hotel-stay-date-zh", text:"东京9月10日住3晚酒店", expected:"COMMERCE", kind:"clear" },
    { id:"hotel-room-night-zh", text:"上海两个人一间房三晚住宿价格", expected:"COMMERCE", kind:"clear" },
    { id:"cruise-search-zh", text:"帮我找上海出发的邮轮", expected:"COMMERCE", kind:"clear" },
    { id:"cruise-cabin-zh", text:"10月香港出发阳台房邮轮价格", expected:"COMMERCE", kind:"clear" },
    { id:"ambiguous-hotel-fragment", text:"东京酒店", expected:"CLARIFY", kind:"ambiguous" },
    { id:"ambiguous-product-fragment", text:"MacBook", expected:"CLARIFY", kind:"ambiguous" },
    { id:"ambiguous-invoice-fragment", text:"发票", expected:"CLARIFY", kind:"ambiguous" },
    { id:"ambiguous-place-fragment", text:"东京", expected:"CLARIFY", kind:"ambiguous" },
    { id:"mixed-hotel-and-email", text:"帮我找便宜的东京酒店，再找一下之前的确认邮件", expected:"MIXED", kind:"mixed" },
    { id:"mixed-product-and-invoice", text:"比较 MacBook 价格，然后找上个月那张发票", expected:"MIXED", kind:"mixed" },
    { id:"mixed-flight-confirmation", text:"查成都到东京机票，然后找机票确认邮件", expected:"MIXED", kind:"mixed" }
  ]);

  const FEATURE_MATRIX = Object.freeze([
    { feature:"Single Home command entry", decision:"KEEP", reason:"Core zero-learning entry; it should stay one obvious box." },
    { feature:"Static Home model/module cards", decision:"DELETE", reason:"Already removed from the default surface; they competed with the primary composer." },
    { feature:"Search domain classifier", decision:"OPTIMIZE", reason:"Shopping, flight, hotel, cruise, and mail searches now share one deterministic scope contract." },
    { feature:"Shopping and travel workspaces", decision:"KEEP", reason:"Underlying modules hold the real price/handoff foundations and must not be deleted." },
    { feature:"Mail takeover module", decision:"KEEP", reason:"Required for invoices, receipts, confirmations, and reply intelligence, but never read from global search without an explicit mail intent." },
    { feature:"Shopping/Mail and Travel/Mail intent boundary", decision:"OPTIMIZE", reason:"Ambiguous product/travel evidence needs deterministic, privacy-safe arbitration." },
    { feature:"Mixed intent single-hop routing", decision:"REPLACE", reason:"A single confident module is unsafe when one request contains commerce plus mailbox evidence." },
    { feature:"Search request identity and stale-result handling", decision:"KEEP", reason:"Prevents slow old results from overwriting the newest search state." },
    { feature:"Deep enterprise sidebar items", decision:"DEFER", reason:"Useful later, but less important than routing correctness for public beta." }
  ]);

  function text(value){
    return String(value == null ? "" : value).trim();
  }

  function normalizeSearchQuery(value){
    return text(value)
      .normalize("NFKC")
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 240);
  }

  function freeze(value){
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function(key){ freeze(value[key]); });
    return Object.freeze(value);
  }

  function countSignals(raw, patterns){
    return patterns.reduce(function(count, pattern){
      pattern.lastIndex = 0;
      return count + (pattern.test(raw) ? 1 : 0);
    }, 0);
  }

  const MAIL_CONTEXT = [
    /邮件|邮箱|收件箱|发件箱|未读|已读|回复|待回复|等我回复|谁.*回复|跟进|抄送|转发|邮件附件|邮箱附件/i,
    /\b(mail|email|inbox|reply|replies|follow[-\s]?up|message)\b/i
  ];
  const MAIL_EVIDENCE = [
    /发票|票据|收据|账单|付款凭证|订单确认|确认邮件|预订确认|酒店确认|机票确认|行程单|电子票|退款通知|物流通知|快递通知/i,
    /\b(invoice|receipt|billing|bill|order confirmation|booking confirmation|reservation confirmation|itinerary|e-?ticket|refund notice)\b/i
  ];
  const SHOPPING_OBJECT = [
    /商品|产品|电商|MacBook|iPhone|iPad|华为|小米|三星|PS5|Switch|手机|电脑|笔记本|耳机|相机|家电|显卡|键盘|价格|比价|最便宜|性价比|采购|购买|买/i,
    /\b(product|shopping|price|compare|buy|purchase|retailer|deal|laptop|phone|camera|macbook|iphone|ipad|ps5|nintendo|console)\b/i
  ];
  const SHOPPING_VARIANT = [
    /\b(?:M[1-9]|Pro|Air|Max|Ultra|Slim)\b/i,
    /\b\d+\s*(?:GB|TB|G|T)\b/i,
    /\b\d+\+\d+\b/i,
    /英寸|寸|内存|硬盘|容量|颜色|黑色|白色/i
  ];
  const FLIGHT_OBJECT = [
    /机票|航班|飞机票|经济舱|商务舱|头等舱|直飞|转机|出发机场|到达机场|成都到|上海到|北京到|东京到|飞/i,
    /\b(flight|airfare|airline|airport|economy|business class|cabin|nonstop|layover|from .+ to)\b/i
  ];
  const HOTEL_OBJECT = [
    /酒店|住宿|入住|离店|住\d*晚|一间房|双床|大床房|房间|checkin|check-in|checkout|check-out/i,
    /\b(hotel|stay|room|nights?|check-?in|checkout|lodging|accommodation)\b/i
  ];
  const CRUISE_OBJECT = [
    /邮轮|游轮|船票|航线|阳台房|内舱房|海景房|登船|岸上观光/i,
    /\b(cruise|sailing|cabin|balcony cabin|oceanview|inside cabin|embark)\b/i
  ];
  const ACTION_INTENT = [
    /帮我|查|查询|看一下|找|搜索|比较|比价|买|购买|订|预订|预定|推荐|分析|筛选|多少钱|价格|最便宜|低价|哪里便宜/i,
    /\b(find|search|compare|buy|book|recommend|analyze|price|cheapest|lowest price|look up)\b/i
  ];
  const ADVICE_INTENT = [
    /怎么|如何|怎样|哪种方式|最经济|更经济|攻略|建议|优缺点|值不值得/i,
    /\b(how|advice|suggestion|worth it|cheapest way|best way|pros and cons)\b/i
  ];
  const STRONG_MAIL_ONLY = [
    /谁还在等我回复|等我回复|未回复|待回复|总结.*邮件|提取.*待办|翻译.*邮件|回复.*邮件/i,
    /\b(who.*waiting.*reply|waiting.*for.*my.*reply|summarize.*email|draft.*reply)\b/i
  ];
  const MIXED_SEPARATORS = [
    /然后|再|另外|同时|并且|顺便|之后|接着/i,
    /\b(then|also|and then|after that|meanwhile)\b/i
  ];
  const ROUTE_HINT = [
    /[\u4e00-\u9fa5A-Za-z]+到[\u4e00-\u9fa5A-Za-z]+/,
    /\b[A-Z]{3}\s*(?:-|to)\s*[A-Z]{3}\b/i
  ];
  const DATE_OR_TRAVEL_CONTEXT = [
    /今天|明天|后天|下周|下个月|\d+\s*月\s*\d+\s*日|\d{4}-\d{1,2}-\d{1,2}|周末/i,
    /\b(today|tomorrow|next week|next month|depart|departure|return|adults?|people|travellers?)\b/i
  ];

  function signalCounts(input){
    const raw = normalizeSearchQuery(input);
    const mailContext = countSignals(raw, MAIL_CONTEXT);
    const mailEvidence = countSignals(raw, MAIL_EVIDENCE);
    const shoppingObject = countSignals(raw, SHOPPING_OBJECT);
    const shoppingVariant = countSignals(raw, SHOPPING_VARIANT);
    const flightObject = countSignals(raw, FLIGHT_OBJECT);
    const hotelObject = countSignals(raw, HOTEL_OBJECT);
    const cruiseObject = countSignals(raw, CRUISE_OBJECT);
    const actionIntent = countSignals(raw, ACTION_INTENT);
    const adviceIntent = countSignals(raw, ADVICE_INTENT);
    const strongMail = countSignals(raw, STRONG_MAIL_ONLY);
    const mixedSeparator = countSignals(raw, MIXED_SEPARATORS);
    const routeHint = countSignals(raw, ROUTE_HINT);
    const dateOrTravelContext = countSignals(raw, DATE_OR_TRAVEL_CONTEXT);
    const travelObject = flightObject + hotelObject + cruiseObject + routeHint;
    const commerceObject = shoppingObject + travelObject;
    return freeze({
      mailContext,
      mailEvidence,
      shoppingObject,
      shoppingVariant,
      flightObject,
      hotelObject,
      cruiseObject,
      routeHint,
      dateOrTravelContext,
      travelObject,
      commerceObject,
      actionIntent,
      adviceIntent,
      strongMail,
      mixedSeparator,
      hasMail:mailContext > 0 || mailEvidence > 0 || strongMail > 0,
      hasCommerceOrTravel:commerceObject > 0,
      hasAction:actionIntent > 0
    });
  }

  function strongestCommerceDomain(s){
    const scores = [
      { domain:SEARCH_DOMAINS.FLIGHT, score:s.flightObject * 3 + s.routeHint * 2 + (s.dateOrTravelContext > 0 && s.routeHint > 0 ? 2 : 0) },
      { domain:SEARCH_DOMAINS.HOTEL, score:s.hotelObject * 3 + (s.dateOrTravelContext > 0 && s.hotelObject > 0 ? 1 : 0) },
      { domain:SEARCH_DOMAINS.CRUISE, score:s.cruiseObject * 4 },
      { domain:SEARCH_DOMAINS.SHOPPING, score:s.shoppingObject * 3 + s.shoppingVariant }
    ].sort(function(a, b){ return b.score - a.score; });
    return scores[0].score > 0 ? scores[0].domain : SEARCH_DOMAINS.UNKNOWN;
  }

  function searchDomainParts(s){
    const domains = [];
    if (s.shoppingObject > 0) domains.push(SEARCH_DOMAINS.SHOPPING);
    if (s.flightObject > 0 || s.routeHint > 0) domains.push(SEARCH_DOMAINS.FLIGHT);
    if (s.hotelObject > 0) domains.push(SEARCH_DOMAINS.HOTEL);
    if (s.cruiseObject > 0) domains.push(SEARCH_DOMAINS.CRUISE);
    if (s.hasMail) domains.push(SEARCH_DOMAINS.MAIL);
    return Array.from(new Set(domains));
  }

  function hasEnoughSearchSpecificity(raw, s, domain){
    if (domain === SEARCH_DOMAINS.MAIL) return s.strongMail > 0 || s.mailContext > 0 || (s.mailEvidence > 0 && s.actionIntent > 0);
    if (domain === SEARCH_DOMAINS.SHOPPING) return s.hasAction || s.shoppingVariant > 0 || /\b\d+\s*(?:GB|TB)\b/i.test(raw) || /\biPhone\s*\d+\b/i.test(raw);
    if (domain === SEARCH_DOMAINS.FLIGHT) return s.hasAction || (s.routeHint > 0 && s.dateOrTravelContext > 0) || /经济舱|商务舱|直飞|两个人|adults?|cabin/i.test(raw);
    if (domain === SEARCH_DOMAINS.HOTEL) return s.hasAction || (s.hotelObject > 0 && s.dateOrTravelContext > 0) || /住\d*晚|一间房|两个人|room|night/i.test(raw);
    if (domain === SEARCH_DOMAINS.CRUISE) return s.hasAction || /阳台房|内舱房|海景房|\d+\s*晚|出发|balcony|cabin/i.test(raw);
    return false;
  }

  function classifySearchScope(input, options){
    const raw = text(input);
    const normalizedQuery = normalizeSearchQuery(input);
    const s = signalCounts(normalizedQuery);
    const reasons = [];
    const contextDomain = options && options.contextDomain ? String(options.contextDomain).toUpperCase() : "";
    const parts = searchDomainParts(s);
    let domain = SEARCH_DOMAINS.UNKNOWN;
    let destination = DESTINATIONS.CHAT;
    let outcome = SEARCH_OUTCOMES.READY;
    let decisionType = "CLEAR";
    let confidence = "fallback";
    let safeToRouteConfidently = false;
    const bareAmbiguousToken = /^(苹果|东京|酒店|机票|发票|订单|MacBook|iPhone|邮轮|cruise|hotel|flight|invoice|order)$/i.test(normalizedQuery);

    if (!normalizedQuery) {
      outcome = SEARCH_OUTCOMES.CLARIFY;
      destination = DESTINATIONS.CLARIFY;
      decisionType = "CLARIFY";
      confidence = "low";
      reasons.push("empty_input");
    } else if (/^https?:\/\//i.test(normalizedQuery)) {
      outcome = SEARCH_OUTCOMES.CLARIFY;
      destination = DESTINATIONS.CLARIFY;
      decisionType = "CLARIFY";
      confidence = "safe";
      reasons.push("url_requires_explicit_action");
    } else if (bareAmbiguousToken) {
      outcome = SEARCH_OUTCOMES.CLARIFY;
      destination = DESTINATIONS.CLARIFY;
      decisionType = "CLARIFY";
      confidence = "safe";
      reasons.push("bare_object_requires_scope");
    } else if (s.strongMail > 0) {
      domain = SEARCH_DOMAINS.MAIL;
      destination = DESTINATIONS.MAIL;
      confidence = "high";
      safeToRouteConfidently = true;
      reasons.push("strong_mail_workflow");
    } else if (s.hasMail && s.hasCommerceOrTravel && s.mixedSeparator > 0) {
      domain = SEARCH_DOMAINS.UNKNOWN;
      destination = DESTINATIONS.MIXED;
      outcome = SEARCH_OUTCOMES.MIXED;
      decisionType = "MIXED_INTENT";
      confidence = "safe";
      reasons.push("commerce_or_travel_plus_mail_evidence");
    } else if (s.mailEvidence > 0 && s.hasCommerceOrTravel && !s.hasAction) {
      domain = SEARCH_DOMAINS.MAIL;
      destination = DESTINATIONS.MAIL;
      confidence = "high";
      safeToRouteConfidently = true;
      reasons.push("product_or_travel_evidence_document");
    } else if (s.mailEvidence > 0 && s.hasCommerceOrTravel && /发票|invoice|receipt|确认邮件|confirmation|行程单|itinerary/i.test(normalizedQuery)) {
      domain = SEARCH_DOMAINS.MAIL;
      destination = DESTINATIONS.MAIL;
      confidence = "high";
      safeToRouteConfidently = true;
      reasons.push("specific_evidence_request");
    } else if (s.hasMail && !s.hasCommerceOrTravel) {
      domain = SEARCH_DOMAINS.MAIL;
      destination = DESTINATIONS.MAIL;
      confidence = "high";
      safeToRouteConfidently = true;
      reasons.push("mail_context");
    } else if (contextDomain === SEARCH_DOMAINS.MAIL && (s.mailEvidence > 0 || s.mailContext > 0)) {
      domain = SEARCH_DOMAINS.MAIL;
      destination = DESTINATIONS.MAIL;
      confidence = "high";
      safeToRouteConfidently = true;
      reasons.push("explicit_mail_context");
    } else if (s.hasCommerceOrTravel && s.adviceIntent > 0 && s.actionIntent === 0) {
      domain = strongestCommerceDomain(s);
      destination = DESTINATIONS.CHAT;
      confidence = "high";
      safeToRouteConfidently = true;
      reasons.push("advice_question_not_price_search");
    } else if (s.hasCommerceOrTravel) {
      domain = strongestCommerceDomain(s);
      if (hasEnoughSearchSpecificity(normalizedQuery, s, domain)) {
        destination = DESTINATIONS.COMMERCE;
        confidence = "high";
        safeToRouteConfidently = true;
        reasons.push(domain === SEARCH_DOMAINS.SHOPPING ? "shopping_search_or_compare" : "travel_search_or_compare");
      } else {
        destination = DESTINATIONS.CLARIFY;
        outcome = SEARCH_OUTCOMES.CLARIFY;
        decisionType = "CLARIFY";
        confidence = "safe";
        reasons.push("object_without_action_or_specificity");
      }
    } else {
      destination = DESTINATIONS.CHAT;
      confidence = "fallback";
      safeToRouteConfidently = true;
      reasons.push("general_chat_or_local_capability");
    }

    return freeze({
      version:VERSION,
      query:raw.slice(0, 240),
      normalizedQuery,
      domain,
      requestedDomains:parts,
      destination,
      outcome,
      decisionType,
      confidence,
      reasons:reasons.slice(),
      signals:s,
      safeToRouteConfidently,
      needsClarification:outcome === SEARCH_OUTCOMES.CLARIFY || outcome === SEARCH_OUTCOMES.MIXED,
      readsMailbox:false,
      mailAccessRequiresConfirmation:destination === DESTINATIONS.MAIL,
      externalEffects:false,
      providerCalls:false,
      productionTraffic:false
    });
  }

  function classifyHomeIntent(input){
    const decision = classifySearchScope(input, {});
    return freeze({
      version:VERSION,
      destination:decision.destination,
      decisionType:decision.decisionType,
      confidence:decision.confidence,
      reasons:decision.reasons.slice(),
      signals:decision.signals,
      searchScope:decision,
      safeToRouteConfidently:decision.safeToRouteConfidently,
      externalEffects:false,
      readsMailbox:false,
      providerCalls:false,
      productionTraffic:false
    });
  }

  function expectedHandled(expected, actual){
    if (expected === "MAIL") return actual.destination === DESTINATIONS.MAIL;
    if (expected === "COMMERCE") return actual.destination === DESTINATIONS.COMMERCE;
    if (expected === "CLARIFY") return actual.destination === DESTINATIONS.CLARIFY && actual.safeToRouteConfidently === false;
    if (expected === "MIXED") return actual.destination === DESTINATIONS.MIXED && actual.decisionType === "MIXED_INTENT";
    return actual.destination === expected;
  }

  function evaluateRoutingCorpus(cases){
    const corpus = Array.isArray(cases) && cases.length ? cases : ROUTING_CASES;
    const evaluated = corpus.map(function(item){
      const actual = classifyHomeIntent(item.text);
      const ok = expectedHandled(item.expected, actual);
      const wrongConfident = !ok && actual.safeToRouteConfidently === true;
      return freeze(Object.assign({}, item, { actual, ok, wrongConfident }));
    });
    const metrics = {
      TOTAL_ROUTING_CASES:evaluated.length,
      CLEAR_CASES:evaluated.filter(function(item){ return item.kind === "clear"; }).length,
      CLEAR_CORRECT:evaluated.filter(function(item){ return item.kind === "clear" && item.ok; }).length,
      AMBIGUOUS_CASES:evaluated.filter(function(item){ return item.kind === "ambiguous"; }).length,
      AMBIGUOUS_SAFE:evaluated.filter(function(item){ return item.kind === "ambiguous" && item.ok; }).length,
      WRONG_CONFIDENT:evaluated.filter(function(item){ return item.wrongConfident; }).length,
      MIXED_INTENT_CASES:evaluated.filter(function(item){ return item.kind === "mixed"; }).length,
      MIXED_INTENT_SAFELY_HANDLED:evaluated.filter(function(item){ return item.kind === "mixed" && item.ok; }).length
    };
    metrics.PASS = metrics.WRONG_CONFIDENT === 0 &&
      metrics.CLEAR_CORRECT === metrics.CLEAR_CASES &&
      metrics.AMBIGUOUS_SAFE === metrics.AMBIGUOUS_CASES &&
      metrics.MIXED_INTENT_SAFELY_HANDLED === metrics.MIXED_INTENT_CASES;
    return freeze({ version:VERSION, metrics, cases:evaluated });
  }

  function evaluateSearchCorpus(cases){
    const corpus = Array.isArray(cases) ? cases : [];
    const evaluated = corpus.map(function(item){
      const actual = classifySearchScope(item.text, item.options || {});
      const ok = item.expectedOutcome ?
        actual.outcome === item.expectedOutcome :
        actual.domain === item.expectedDomain && actual.destination === item.expectedDestination;
      const wrongConfident = !ok && actual.safeToRouteConfidently === true;
      return freeze(Object.assign({}, item, { actual, ok, wrongConfident }));
    });
    const clear = evaluated.filter(function(item){ return item.kind === "clear"; });
    const ambiguous = evaluated.filter(function(item){ return item.kind === "ambiguous"; });
    const mixed = evaluated.filter(function(item){ return item.kind === "mixed"; });
    const metrics = {
      TOTAL_ROUTING_CASES:evaluated.length,
      CLEAR_CASES:clear.length,
      CLEAR_CORRECT:clear.filter(function(item){ return item.ok; }).length,
      AMBIGUOUS_CASES:ambiguous.length,
      AMBIGUOUS_SAFE:ambiguous.filter(function(item){ return item.ok && item.actual.safeToRouteConfidently === false; }).length,
      MIXED_INTENT_CASES:mixed.length,
      MIXED_INTENT_SAFE:mixed.filter(function(item){ return item.ok && item.actual.outcome === SEARCH_OUTCOMES.MIXED; }).length,
      WRONG_CONFIDENT:evaluated.filter(function(item){ return item.wrongConfident; }).length,
      MAIL_READS_FROM_GLOBAL_SEARCH:evaluated.filter(function(item){ return item.actual.readsMailbox === true; }).length,
      PROVIDER_CALLS:evaluated.filter(function(item){ return item.actual.providerCalls === true; }).length,
      EXTERNAL_EFFECTS:evaluated.filter(function(item){ return item.actual.externalEffects === true; }).length
    };
    metrics.PASS = metrics.WRONG_CONFIDENT === 0 &&
      metrics.CLEAR_CORRECT === metrics.CLEAR_CASES &&
      metrics.AMBIGUOUS_SAFE === metrics.AMBIGUOUS_CASES &&
      metrics.MIXED_INTENT_SAFE === metrics.MIXED_INTENT_CASES &&
      metrics.MAIL_READS_FROM_GLOBAL_SEARCH === 0 &&
      metrics.PROVIDER_CALLS === 0 &&
      metrics.EXTERNAL_EFFECTS === 0;
    return freeze({ version:VERSION, metrics, cases:evaluated });
  }

  function buildFeatureDecisionMatrix(){
    return freeze(FEATURE_MATRIX.map(function(item){ return Object.assign({}, item); }));
  }

  function createSearchState(initial){
    return {
      schemaVersion:"weishan.search.state.v1",
      sequence:0,
      activeRequestId:"",
      activeDomain:initial && initial.activeDomain || SEARCH_DOMAINS.UNKNOWN,
      normalizedQuery:"",
      status:"idle",
      loading:false,
      results:[],
      error:null,
      lastCompletedRequestId:"",
      staleResultIgnored:false
    };
  }

  function requestIdFor(sequence, domain){
    return "search-" + String(sequence).padStart(4, "0") + "-" + String(domain || SEARCH_DOMAINS.UNKNOWN).toLowerCase();
  }

  function beginSearch(state, input, options){
    const current = state || createSearchState();
    const scope = classifySearchScope(input, options || {});
    const sameActive = current.loading === true &&
      current.normalizedQuery === scope.normalizedQuery &&
      current.activeDomain === scope.domain;
    if (sameActive) return freeze(Object.assign({}, current, { duplicateSuppressed:true, scope }));
    const nextSequence = Number(current.sequence || 0) + 1;
    return freeze({
      schemaVersion:"weishan.search.state.v1",
      sequence:nextSequence,
      activeRequestId:requestIdFor(nextSequence, scope.domain),
      activeDomain:scope.domain,
      normalizedQuery:scope.normalizedQuery,
      status:scope.needsClarification ? "clarify" : "loading",
      loading:scope.needsClarification === false,
      results:[],
      error:null,
      scope,
      lastCompletedRequestId:"",
      staleResultIgnored:false,
      duplicateSuppressed:false
    });
  }

  function completeSearch(state, requestId, payload){
    const current = state || createSearchState();
    if (!requestId || requestId !== current.activeRequestId) {
      return freeze(Object.assign({}, current, { staleResultIgnored:true }));
    }
    const results = Array.isArray(payload && payload.results) ? payload.results.slice(0, 50) : [];
    const status = results.length ? "ready" : "no_result";
    return freeze(Object.assign({}, current, {
      status,
      loading:false,
      results,
      error:null,
      lastCompletedRequestId:requestId,
      noResult:results.length === 0,
      userMessage:results.length ? "已找到可展示的候选结果。" : "没有找到足够可信的结果；我不会编造价格或来源。"
    }));
  }

  function failSearch(state, requestId, error){
    const current = state || createSearchState();
    if (!requestId || requestId !== current.activeRequestId) {
      return freeze(Object.assign({}, current, { staleResultIgnored:true }));
    }
    const code = String(error && error.code || "SOURCE_FAILURE").replace(/[^A-Z0-9_]/gi, "_").slice(0, 48) || "SOURCE_FAILURE";
    return freeze(Object.assign({}, current, {
      status:"source_failure",
      loading:false,
      error:{ code, safe:true },
      userMessage:"搜索源暂时不可用；我不会把失败说成没有结果，也不会编造答案。"
    }));
  }

  function switchSearchDomain(state, domain){
    const current = state || createSearchState();
    const nextSequence = Number(current.sequence || 0) + 1;
    const safeDomain = SEARCH_DOMAINS[String(domain || "").toUpperCase()] || SEARCH_DOMAINS.UNKNOWN;
    return freeze({
      schemaVersion:"weishan.search.state.v1",
      sequence:nextSequence,
      activeRequestId:requestIdFor(nextSequence, safeDomain),
      activeDomain:safeDomain,
      normalizedQuery:"",
      status:"idle",
      loading:false,
      results:[],
      error:null,
      lastCompletedRequestId:"",
      staleResultIgnored:false
    });
  }

  function buildNoResultState(scope){
    const safeScope = scope || classifySearchScope("", {});
    return freeze({
      schemaVersion:"weishan.search.noResult.v1",
      domain:safeScope.domain,
      normalizedQuery:safeScope.normalizedQuery,
      status:"no_result",
      results:[],
      providerClaims:false,
      fabricated:false,
      userMessage:"没有找到足够可信的结果；可以换关键词、补充日期/地点/型号，或稍后重试。"
    });
  }

  window.WeishanHomeUnifiedIntentRouter = freeze({
    VERSION,
    DESTINATIONS,
    SEARCH_DOMAINS,
    SEARCH_OUTCOMES,
    classifyHomeIntent,
    classifySearchScope,
    normalizeSearchQuery,
    evaluateRoutingCorpus,
    evaluateSearchCorpus,
    buildFeatureDecisionMatrix,
    signals:signalCounts,
    createSearchState,
    beginSearch,
    completeSearch,
    failSearch,
    switchSearchDomain,
    buildNoResultState,
    ROUTING_CASES:ROUTING_CASES.map(function(item){ return Object.assign({}, item); })
  });
})();
