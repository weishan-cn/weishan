;(function () {
  "use strict";

  const FLIGHT_CLARIFICATION_LOOP_VERSION = "4.0.9";
  const CLARIFICATION_NAME = "flight_clarification_loop_v1";
  const RESTRICTED_RE = /(枪|武器|火药|炸药|弹药|身份证|护照|银行卡|密码|登录|credential|password|passport|card)/i;
  const CITY_NAMES = ["上海", "成都", "北京", "广州", "深圳", "杭州", "东京", "南京", "重庆", "西安"];

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(/https?:\/\/\S+|token|key|secret|password|身份证|护照|银行卡/ig, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { asksIdentity:false, asksPayment:false, asksCredential:false, booking:false, payment:false, order:false, identityUpload:false, redacted:true }; }

  function normalizeIntent(intent) {
    const safe = intent && typeof intent === "object" ? intent : {};
    const route = safe.route && typeof safe.route === "object" ? safe.route : {};
    const missingFields = toArray(safe.missingFields);
    return clone({
      status:safeText(safe.status || "needs_clarification"),
      intentType:safeText(safe.intentType || "flight"),
      route:{ originCity:safeText(route.originCity || safe.origin || ""), destinationCity:safeText(route.destinationCity || safe.destination || "") },
      routeSummary:safeText(safe.routeSummary || ""),
      tripSummary:safeText(safe.tripSummary || safe.userIntentSummary || ""),
      departureDate:safeText(safe.departureDate || safe.date || ""),
      dateDisplay:safeText(safe.dateDisplay || ""),
      directOnly:safe.directOnly === true,
      sortIntent:safeText(safe.sortIntent || "lowest_price"),
      missingFields:missingFields.map(safeText),
      clarificationQuestions:toArray(safe.clarificationQuestions).map(safeText),
      bookingUrl:null,
      paymentUrl:null,
      orderUrl:null,
      redacted:true
    });
  }

  function deriveMissing(intent) {
    const safe = normalizeIntent(intent || {});
    const missing = [];
    if (!safe.route.originCity) missing.push("origin");
    if (!safe.route.destinationCity) missing.push("destination");
    if (!safe.departureDate) missing.push("departureDate");
    return missing;
  }

  function questionsFor(missing) {
    return missing.map(function (field) {
      if (field === "origin") return "从哪里出发？";
      if (field === "destination") return "到哪里？";
      if (field === "departureDate") return "哪一天出发？";
      return "请补充机票信息。";
    });
  }

  function parseAnswer(answer) {
    const safe = answer && typeof answer === "object" ? answer : { text:answer };
    const rawInput = text(safe.text || safe.answerText || safe.rawText || "");
    if (RESTRICTED_RE.test(rawInput)) return { status:"blocked", normalizedAnswer:{}, blockedReason:"sensitive_or_restricted_answer" };
    const raw = safeText(rawInput);
    const present = CITY_NAMES.filter(function (city) { return raw.indexOf(city) >= 0; });
    const zh = raw.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
    const iso = raw.match(/(2026|2027)-(\d{2})-(\d{2})/);
    const normalized = {
      route:{ originCity:safeText(safe.origin || safe.originCity || ""), destinationCity:safeText(safe.destination || safe.destinationCity || "") },
      departureDate:safeText(safe.departureDate || ""),
      dateDisplay:safeText(safe.dateDisplay || ""),
      directOnly:safe.directOnly === true || /直达|直飞|direct/i.test(raw),
      sortIntent:safeText(safe.sortIntent || (/最便宜|最低价|低价|便宜/.test(raw) ? "lowest_price" : "lowest_price"))
    };
    if (!normalized.route.originCity && present[0]) normalized.route.originCity = present[0];
    if (!normalized.route.destinationCity && present[1]) normalized.route.destinationCity = present[1];
    if (!normalized.departureDate && zh) {
      normalized.departureDate = "2026-" + String(Number(zh[1])).padStart(2, "0") + "-" + String(Number(zh[2])).padStart(2, "0");
      normalized.dateDisplay = Number(zh[1]) + "月" + Number(zh[2]) + "日";
    }
    if (!normalized.departureDate && iso) {
      normalized.departureDate = iso[0];
      normalized.dateDisplay = Number(iso[2]) + "月" + Number(iso[3]) + "日";
    }
    return { status:"ok", normalizedAnswer:normalized };
  }

  function buildFlightClarificationPrompt(intent) {
    try {
      const safeIntent = normalizeIntent(intent || {});
      if (safeIntent.status === "blocked") return clone({ clarificationName:CLARIFICATION_NAME, appVersion:FLIGHT_CLARIFICATION_LOOP_VERSION, status:"blocked", missingFields:[], questions:[], normalizedAnswer:null, mergedIntent:safeIntent, safety:safety(), redacted:true });
      const missing = deriveMissing(safeIntent);
      return clone({ clarificationName:CLARIFICATION_NAME, appVersion:FLIGHT_CLARIFICATION_LOOP_VERSION, status:missing.length ? "needs_answer" : "complete", missingFields:missing, questions:questionsFor(missing), normalizedAnswer:null, mergedIntent:safeIntent, safety:safety(), redacted:true });
    } catch (error) {
      return clone({ clarificationName:CLARIFICATION_NAME, appVersion:FLIGHT_CLARIFICATION_LOOP_VERSION, status:"failed_safe", missingFields:[], questions:[], normalizedAnswer:null, mergedIntent:null, safety:safety(), redacted:true });
    }
  }

  function mergeFlightClarificationAnswer(intent, answer) {
    try {
      const safeIntent = normalizeIntent(intent || {});
      const parsed = parseAnswer(answer || {});
      if (parsed.status === "blocked") return clone({ clarificationName:CLARIFICATION_NAME, appVersion:FLIGHT_CLARIFICATION_LOOP_VERSION, status:"blocked", missingFields:deriveMissing(safeIntent), questions:[], normalizedAnswer:parsed.normalizedAnswer, mergedIntent:Object.assign({}, safeIntent, { status:"blocked" }), safety:safety(), redacted:true });
      const mergedRoute = Object.assign({}, safeIntent.route || {});
      if (parsed.normalizedAnswer.route && parsed.normalizedAnswer.route.originCity) mergedRoute.originCity = parsed.normalizedAnswer.route.originCity;
      if (parsed.normalizedAnswer.route && parsed.normalizedAnswer.route.destinationCity) mergedRoute.destinationCity = parsed.normalizedAnswer.route.destinationCity;
      const mergedInput = Object.assign({}, safeIntent, parsed.normalizedAnswer, { route:mergedRoute });
      if (!parsed.normalizedAnswer.departureDate) mergedInput.departureDate = safeIntent.departureDate || "";
      if (!parsed.normalizedAnswer.dateDisplay) mergedInput.dateDisplay = safeIntent.dateDisplay || "";
      const mergedIntent = normalizeIntent(mergedInput);
      const missing = deriveMissing(mergedIntent);
      mergedIntent.status = missing.length ? "needs_clarification" : "ready";
      mergedIntent.missingFields = missing;
      mergedIntent.clarificationQuestions = questionsFor(missing);
      mergedIntent.routeSummary = mergedRoute.originCity && mergedRoute.destinationCity ? mergedRoute.originCity + " 到 " + mergedRoute.destinationCity : safeIntent.routeSummary || "";
      mergedIntent.tripSummary = [mergedIntent.routeSummary, mergedIntent.dateDisplay, mergedIntent.directOnly ? "直达" : "不限中转", mergedIntent.sortIntent === "lowest_price" ? "最便宜优先" : "综合排序"].filter(Boolean).join(" · ");
      return clone({ clarificationName:CLARIFICATION_NAME, appVersion:FLIGHT_CLARIFICATION_LOOP_VERSION, status:missing.length ? "needs_answer" : "complete", missingFields:missing, questions:questionsFor(missing), normalizedAnswer:parsed.normalizedAnswer, mergedIntent:mergedIntent, safety:safety(), redacted:true });
    } catch (error) {
      return clone({ clarificationName:CLARIFICATION_NAME, appVersion:FLIGHT_CLARIFICATION_LOOP_VERSION, status:"failed_safe", missingFields:[], questions:[], normalizedAnswer:null, mergedIntent:null, safety:safety(), redacted:true });
    }
  }

  function evaluateFlightClarificationCompletion(intent) {
    const prompt = buildFlightClarificationPrompt(intent || {});
    return clone({ clarificationName:CLARIFICATION_NAME, appVersion:FLIGHT_CLARIFICATION_LOOP_VERSION, status:prompt.status === "complete" ? "complete" : prompt.status, complete:prompt.status === "complete", missingFields:prompt.missingFields, questions:prompt.questions, safety:safety(), redacted:true });
  }

  function buildFlightClarificationLoopAuditDraft(input) {
    const prompt = buildFlightClarificationPrompt(input && input.intent || input || {});
    return clone({ eventType:"FLIGHT_CLARIFICATION_LOOP_AUDIT_DRAFT", clarificationName:CLARIFICATION_NAME, appVersion:FLIGHT_CLARIFICATION_LOOP_VERSION, status:prompt.status, missingFields:prompt.missingFields, questionCount:prompt.questions.length, asksIdentity:false, asksPayment:false, asksCredential:false, booking:false, payment:false, order:false, identityUpload:false, redacted:true });
  }

  window.WeishanFlightClarificationLoop = { FLIGHT_CLARIFICATION_LOOP_VERSION, CLARIFICATION_NAME, buildFlightClarificationPrompt, mergeFlightClarificationAnswer, evaluateFlightClarificationCompletion, buildFlightClarificationLoopAuditDraft };
})();
