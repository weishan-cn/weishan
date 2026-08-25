(function(){
  "use strict";

  const VERSION = "1.0.0";

  const DESTINATIONS = Object.freeze({
    MAIL:"MAIL",
    COMMERCE:"COMMERCE",
    CHAT:"CHAT",
    CLARIFY:"CLARIFY",
    MIXED:"MIXED"
  });

  const ROUTING_CASES = Object.freeze([
    { id:"mail-reply-waiting-zh", text:"谁还在等我回复？", expected:"MAIL", kind:"clear" },
    { id:"mail-invoice-product-zh", text:"找上个月苹果电脑发票", expected:"MAIL", kind:"clear" },
    { id:"mail-hotel-confirmation-zh", text:"帮我找东京酒店确认邮件", expected:"MAIL", kind:"clear" },
    { id:"mail-order-receipt-en", text:"Find my MacBook order receipt email", expected:"MAIL", kind:"clear" },
    { id:"shopping-macbook-zh", text:"帮我买一台性价比高的 MacBook，美国和日本比较，收货到中国", expected:"COMMERCE", kind:"clear" },
    { id:"shopping-phone-zh", text:"买华为手机，中国购买，收货到成都", expected:"COMMERCE", kind:"clear" },
    { id:"flight-search-zh", text:"查 7 月 15 日成都到北京机票", expected:"COMMERCE", kind:"clear" },
    { id:"flight-booking-zh", text:"帮我预定 7 月 15 日成都到北京机票", expected:"COMMERCE", kind:"clear" },
    { id:"hotel-price-zh", text:"比较东京酒店价格", expected:"COMMERCE", kind:"clear" },
    { id:"cruise-search-zh", text:"帮我找上海出发的邮轮", expected:"COMMERCE", kind:"clear" },
    { id:"ambiguous-hotel-fragment", text:"东京酒店", expected:"CLARIFY", kind:"ambiguous" },
    { id:"ambiguous-product-fragment", text:"MacBook", expected:"CLARIFY", kind:"ambiguous" },
    { id:"mixed-hotel-and-email", text:"帮我找便宜的东京酒店，再找一下之前的确认邮件", expected:"MIXED", kind:"mixed" },
    { id:"mixed-product-and-invoice", text:"比较 MacBook 价格，然后找上个月那张发票", expected:"MIXED", kind:"mixed" }
  ]);

  const FEATURE_MATRIX = Object.freeze([
    { feature:"Single Home command entry", decision:"KEEP", reason:"Core zero-learning entry; it should stay one obvious box." },
    { feature:"Static Home model/module cards", decision:"DELETE", reason:"Already removed from the default surface; they competed with the primary composer." },
    { feature:"Shopping and travel workspaces", decision:"KEEP", reason:"Underlying modules hold the real price/handoff foundations and must not be deleted." },
    { feature:"Mail takeover module", decision:"KEEP", reason:"Required for invoices, receipts, confirmations, and reply intelligence." },
    { feature:"Shopping/Mail and Travel/Mail intent boundary", decision:"OPTIMIZE", reason:"Ambiguous product/travel evidence needs deterministic, privacy-safe arbitration." },
    { feature:"Mixed intent single-hop routing", decision:"REPLACE", reason:"A single confident module is unsafe when one request contains commerce plus mailbox evidence." },
    { feature:"Deep enterprise sidebar items", decision:"DEFER", reason:"Useful later, but less important than routing correctness for public beta." }
  ]);

  function text(value){
    return String(value == null ? "" : value).trim();
  }

  function freeze(value){
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function(key){ freeze(value[key]); });
    return Object.freeze(value);
  }

  function countSignals(raw, patterns){
    return patterns.reduce(function(count, pattern){ return count + (pattern.test(raw) ? 1 : 0); }, 0);
  }

  const MAIL_CONTEXT = [
    /邮件|邮箱|收件箱|发件箱|未读|已读|回复|待回复|等我回复|谁.*回复|跟进|抄送|转发|邮件附件|邮箱附件/i,
    /\b(mail|email|inbox|reply|replies|follow[-\s]?up|message)\b/i
  ];
  const MAIL_EVIDENCE = [
    /发票|票据|收据|账单|付款凭证|订单确认|确认邮件|预订确认|酒店确认|机票确认|行程单|电子票|退款通知|物流通知|快递通知/i,
    /\b(invoice|receipt|billing|bill|order confirmation|booking confirmation|reservation confirmation|itinerary|e-?ticket|refund notice)\b/i
  ];
  const COMMERCE_OBJECT = [
    /商品|产品|电商|MacBook|iPhone|手机|电脑|耳机|相机|家电|显卡|键盘|价格|比价|最便宜|性价比|采购|购买|买/i,
    /\b(product|shopping|price|compare|buy|purchase|retailer|deal|laptop|phone|camera)\b/i
  ];
  const TRAVEL_OBJECT = [
    /机票|航班|飞机票|酒店|住宿|入住|离店|邮轮|游轮|船票|旅行|行程|目的地|出发|到北京|到上海|到东京/i,
    /\b(flight|airfare|hotel|stay|check-?in|checkout|cruise|travel|itinerary|fare)\b/i
  ];
  const ACTION_INTENT = [
    /帮我|查|查询|看一下|找|搜索|比较|比价|买|购买|订|预订|预定|推荐|分析|筛选|多少钱|价格|最便宜|低价/i,
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

  function signals(input){
    const raw = text(input);
    const mailContext = countSignals(raw, MAIL_CONTEXT);
    const mailEvidence = countSignals(raw, MAIL_EVIDENCE);
    const commerceObject = countSignals(raw, COMMERCE_OBJECT);
    const travelObject = countSignals(raw, TRAVEL_OBJECT);
    const actionIntent = countSignals(raw, ACTION_INTENT);
    const adviceIntent = countSignals(raw, ADVICE_INTENT);
    const strongMail = countSignals(raw, STRONG_MAIL_ONLY);
    const mixedSeparator = countSignals(raw, MIXED_SEPARATORS);
    return freeze({
      mailContext,
      mailEvidence,
      commerceObject,
      travelObject,
      actionIntent,
      adviceIntent,
      strongMail,
      mixedSeparator,
      hasMail:mailContext > 0 || mailEvidence > 0 || strongMail > 0,
      hasCommerceOrTravel:commerceObject > 0 || travelObject > 0,
      hasAction:actionIntent > 0
    });
  }

  function classifyHomeIntent(input){
    const raw = text(input);
    const s = signals(raw);
    const reasons = [];
    let destination = DESTINATIONS.CHAT;
    let decisionType = "CLEAR";
    let confidence = "fallback";

    if (!raw) {
      return freeze({ version:VERSION, destination:DESTINATIONS.CLARIFY, decisionType:"CLARIFY", confidence:"low", reasons:["empty_input"], signals:s });
    }

    if (s.strongMail > 0) {
      destination = DESTINATIONS.MAIL;
      confidence = "high";
      reasons.push("strong_mail_workflow");
    } else if (s.hasMail && s.hasCommerceOrTravel && s.mixedSeparator > 0) {
      destination = DESTINATIONS.MIXED;
      decisionType = "MIXED_INTENT";
      confidence = "safe";
      reasons.push("commerce_or_travel_plus_mail_evidence");
    } else if (s.mailEvidence > 0 && s.hasCommerceOrTravel && !s.hasAction) {
      destination = DESTINATIONS.MAIL;
      confidence = "high";
      reasons.push("product_or_travel_evidence_document");
    } else if (s.mailEvidence > 0 && s.hasCommerceOrTravel && /发票|invoice|receipt|确认邮件|confirmation|行程单|itinerary/i.test(raw)) {
      destination = DESTINATIONS.MAIL;
      confidence = "high";
      reasons.push("specific_evidence_request");
    } else if (s.hasMail && !s.hasCommerceOrTravel) {
      destination = DESTINATIONS.MAIL;
      confidence = "high";
      reasons.push("mail_context");
    } else if (s.hasCommerceOrTravel && s.adviceIntent > 0 && s.actionIntent === 0) {
      destination = DESTINATIONS.CHAT;
      confidence = "high";
      reasons.push("advice_question_not_price_search");
    } else if (s.hasCommerceOrTravel && s.hasAction) {
      destination = DESTINATIONS.COMMERCE;
      confidence = "high";
      reasons.push(s.travelObject > 0 ? "travel_search_or_compare" : "shopping_search_or_compare");
    } else if (s.hasCommerceOrTravel && !s.hasAction) {
      destination = DESTINATIONS.CLARIFY;
      decisionType = "CLARIFY";
      confidence = "safe";
      reasons.push("object_without_action_or_mail_context");
    } else {
      destination = DESTINATIONS.CHAT;
      confidence = "fallback";
      reasons.push("general_chat_or_local_capability");
    }

    return freeze({
      version:VERSION,
      destination,
      decisionType,
      confidence,
      reasons:reasons.slice(),
      signals:s,
      safeToRouteConfidently:destination !== DESTINATIONS.CLARIFY && destination !== DESTINATIONS.MIXED,
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

  function buildFeatureDecisionMatrix(){
    return freeze(FEATURE_MATRIX.map(function(item){ return Object.assign({}, item); }));
  }

  window.WeishanHomeUnifiedIntentRouter = freeze({
    VERSION,
    DESTINATIONS,
    classifyHomeIntent,
    evaluateRoutingCorpus,
    buildFeatureDecisionMatrix,
    signals,
    ROUTING_CASES:ROUTING_CASES.map(function(item){ return Object.assign({}, item); })
  });
})();
