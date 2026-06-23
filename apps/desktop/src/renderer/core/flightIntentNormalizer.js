;(function () {
  "use strict";

  const FLIGHT_INTENT_NORMALIZER_VERSION = "2.1.72";
  const NORMALIZER_NAME = "flight_intent_normalizer_v1";
  const RESTRICTED_RE = /(帮我买枪|买枪|枪支|武器|火药|炸药|弹药|firearm|weapon|ammunition|explosive)/i;
  const FLIGHT_RE = /(机票|航班|飞机|飞|flight|到)/i;
  const CITY_NAMES = ["上海", "成都", "北京", "广州", "深圳", "杭州", "东京", "南京", "重庆", "西安"];

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }

  function sanitizeText(value) {
    return text(value).replace(/(token|key|secret|password|bookingUrl|paymentUrl|orderUrl)\s*[:=]\s*\S+/ig, "$1:redacted");
  }

  function parseRoute(raw) {
    const value = sanitizeText(raw);
    const present = CITY_NAMES.map(function (city) { return { city, index:value.indexOf(city) }; }).filter(function (item) { return item.index >= 0; }).sort(function (a, b) { return a.index - b.index; });
    const routeMatch = value.match(/([\u4e00-\u9fa5\d月日\s]{1,20})\s*到\s*([\u4e00-\u9fa5]{1,20})/);
    if (routeMatch) {
      const leftCities = present.filter(function (item) { return item.index < value.indexOf("到"); });
      const rightCities = present.filter(function (item) { return item.index > value.indexOf("到"); });
      const origin = leftCities.length ? leftCities[leftCities.length - 1].city : (CITY_NAMES.find(function (city) { return routeMatch[1].indexOf(city) >= 0; }) || "");
      const destination = rightCities.length ? rightCities[0].city : (CITY_NAMES.find(function (city) { return routeMatch[2].indexOf(city) >= 0; }) || "");
      return { originCity: origin, destinationCity: destination };
    }
    return { originCity: present[0] && present[0].city || "", destinationCity: present[1] && present[1].city || "" };
  }

  function parseDate(raw) {
    const value = sanitizeText(raw);
    const zh = value.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
    if (zh) {
      const month = String(Number(zh[1])).padStart(2, "0");
      const day = String(Number(zh[2])).padStart(2, "0");
      return { departureDate: "2026-" + month + "-" + day, dateDisplay: Number(zh[1]) + "月" + Number(zh[2]) + "日" };
    }
    const iso = value.match(/(2026|2027)-(\d{2})-(\d{2})/);
    if (iso) return { departureDate: iso[0], dateDisplay: Number(iso[2]) + "月" + Number(iso[3]) + "日" };
    return { departureDate: "", dateDisplay: "" };
  }

  function buildQuestions(missing) {
    return missing.map(function (field) {
      if (field === "origin") return "请补充出发地。";
      if (field === "destination") return "请补充目的地。";
      if (field === "departureDate") return "请补充出发日期。";
      return "请补充机票查询条件。";
    });
  }

  function normalizeFlightIntent(input) {
    const safe = input && typeof input === "object" ? input : { rawText: input };
    const rawText = sanitizeText(safe.rawText || safe.rawInput || safe.inputSummary || safe.title || safe.text || "");
    if (RESTRICTED_RE.test(rawText)) {
      return clone({ normalizerName:NORMALIZER_NAME, appVersion:FLIGHT_INTENT_NORMALIZER_VERSION, status:"blocked", intentType:"restricted", userIntentSummary:"已安全阻断", route:{ originCity:"", destinationCity:"" }, routeSummary:"", tripSummary:"", departureDate:"", dateDisplay:"", directOnly:false, sortIntent:"unknown", missingFields:[], clarificationQuestions:[], safety:{ dryRunAllowed:false, networkAllowed:false, booking:false, payment:false, order:false, identityUpload:false, rawTextStored:false, redacted:true }, bookingUrl:null, paymentUrl:null, orderUrl:null, provider:null, redacted:true });
    }
    if (!FLIGHT_RE.test(rawText)) {
      return clone({ normalizerName:NORMALIZER_NAME, appVersion:FLIGHT_INTENT_NORMALIZER_VERSION, status:"not_flight", intentType:"not_flight", userIntentSummary:"不是机票请求", route:{ originCity:"", destinationCity:"" }, routeSummary:"", tripSummary:"", departureDate:"", dateDisplay:"", directOnly:false, sortIntent:"unknown", missingFields:[], clarificationQuestions:[], safety:{ dryRunAllowed:false, networkAllowed:false, booking:false, payment:false, order:false, identityUpload:false, rawTextStored:false, redacted:true }, bookingUrl:null, paymentUrl:null, orderUrl:null, provider:null, redacted:true });
    }
    const route = parseRoute(rawText);
    const date = parseDate(rawText);
    const missingFields = [];
    if (!route.originCity) missingFields.push("origin");
    if (!route.destinationCity) missingFields.push("destination");
    if (!date.departureDate) missingFields.push("departureDate");
    const sortIntent = /(最便宜|最低价|低价|便宜)/.test(rawText) ? "lowest_price" : "balanced";
    const directOnly = /(直达|直飞|direct)/i.test(rawText);
    const routeSummary = route.originCity && route.destinationCity ? route.originCity + " 到 " + route.destinationCity : "";
    const tripSummary = [routeSummary, date.dateDisplay, directOnly ? "直达" : "不限中转", sortIntent === "lowest_price" ? "最便宜优先" : "综合排序"].filter(Boolean).join(" · ");
    const status = missingFields.length ? "needs_clarification" : "ready";
    return clone({ normalizerName:NORMALIZER_NAME, appVersion:FLIGHT_INTENT_NORMALIZER_VERSION, status, intentType:"flight", userIntentSummary:tripSummary || "机票请求", route, routeSummary, tripSummary, departureDate:date.departureDate, dateDisplay:date.dateDisplay, directOnly, sortIntent, missingFields, clarificationQuestions:buildQuestions(missingFields), safety:{ dryRunAllowed:status === "ready", networkAllowed:false, booking:false, payment:false, order:false, identityUpload:false, rawTextStored:false, redacted:true }, bookingUrl:null, paymentUrl:null, orderUrl:null, provider:null, redacted:true });
  }

  function detectFlightIntentCompleteness(input) {
    const intent = normalizeFlightIntent(input);
    return clone({ status:intent.status, complete:intent.status === "ready", missingFields:intent.missingFields || [], clarificationQuestions:intent.clarificationQuestions || [], dryRunAllowed:intent.safety && intent.safety.dryRunAllowed === true, redacted:true });
  }

  function buildFlightIntentClarification(input) {
    const intent = normalizeFlightIntent(input);
    return clone({ status:intent.status === "needs_clarification" ? "needs_clarification" : intent.status, title:intent.status === "blocked" ? "已安全阻断" : "需要补充信息", missingFields:intent.missingFields || [], clarificationQuestions:intent.clarificationQuestions || [], routeSummary:intent.routeSummary || "", tripSummary:intent.tripSummary || "", dryRunAllowed:false, redacted:true });
  }

  function buildFlightIntentNormalizerAuditDraft(input) {
    const intent = normalizeFlightIntent(input);
    return clone({ eventType:"FLIGHT_INTENT_NORMALIZER_AUDIT_DRAFT", normalizerName:NORMALIZER_NAME, appVersion:FLIGHT_INTENT_NORMALIZER_VERSION, status:intent.status, intentType:intent.intentType, routeSummary:intent.routeSummary, tripSummary:intent.tripSummary, missingFields:intent.missingFields, dryRunAllowed:intent.safety && intent.safety.dryRunAllowed === true, networkAllowed:false, booking:false, payment:false, order:false, rawTextStored:false, redacted:true });
  }

  window.WeishanFlightIntentNormalizer = { FLIGHT_INTENT_NORMALIZER_VERSION, NORMALIZER_NAME, normalizeFlightIntent, detectFlightIntentCompleteness, buildFlightIntentClarification, buildFlightIntentNormalizerAuditDraft };
})();
