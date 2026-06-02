(function(){
  const COMMERCE_SEARCH_SETTINGS_KEY = "weishan:commerceSearch:settings:v1";

  function nowIso(){
    return new Date().toISOString();
  }

  function storage(){
    try { return window.localStorage || null; } catch (_) { return null; }
  }

  function sanitizeText(value, max){
    return String(value || "")
      .replace(/(bearer|authorization|api[-_ ]?key|token|password|secret|cookie|card\s*number|银行卡|身份证|护照|passport|id\s*number)\s*[:=：]\s*[^,\s;，。]+/gi, "$1=[redacted]")
      .replace(/(^|[^\w-])(\d{13,19})(?=$|[^\w-])/g, "$1[redacted-card]")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max || 180);
  }

  function defaultSettings(){
    return {
      enabled:false,
      providerName:"",
      providerMode:"disabled",
      endpointUrl:"",
      apiKeyConfigured:false,
      lastCheckedAt:""
    };
  }

  function getCommerceSearchSettings(){
    const s = storage();
    if (!s) return defaultSettings();
    try {
      return Object.assign(defaultSettings(), JSON.parse(s.getItem(COMMERCE_SEARCH_SETTINGS_KEY) || "{}"));
    } catch (_) {
      return defaultSettings();
    }
  }

  function saveCommerceSearchSettings(settings){
    const next = Object.assign(defaultSettings(), settings || {}, { lastCheckedAt:nowIso() });
    next.enabled = next.enabled === true;
    next.apiKeyConfigured = next.apiKeyConfigured === true;
    next.providerMode = /^(customEndpoint|manualProvider)$/.test(next.providerMode) ? next.providerMode : "disabled";
    next.providerName = sanitizeText(next.providerName || "", 80);
    next.endpointUrl = sanitizeText(next.endpointUrl || "", 240);
    const s = storage();
    try { if (s) s.setItem(COMMERCE_SEARCH_SETTINGS_KEY, JSON.stringify(next)); } catch (_) {}
    return next;
  }

  function hasCommerceSearchProvider(settings){
    const next = Object.assign(defaultSettings(), settings || getCommerceSearchSettings());
    if (!next.enabled) return false;
    if (next.providerMode === "manualProvider") {
      return !!(window.WeishanCommerceSearchProvider && typeof window.WeishanCommerceSearchProvider.search === "function");
    }
    if (next.providerMode === "customEndpoint") {
      return /^https:\/\//i.test(next.endpointUrl || "") && next.apiKeyConfigured === true;
    }
    return false;
  }

  function missingFieldsForTask(task){
    const category = String(task && task.category || "");
    const text = String(task && task.inputSummary || "");
    const fields = [];
    if (/^(flight|train|hotel)$/.test(category) && !/(\d{4}[-/]\d{1,2}[-/]\d{1,2}|今天|明天|后天|下周|周[一二三四五六日天])/.test(text)) {
      fields.push(category === "hotel" ? "入住日期" : "出行日期");
    }
    return fields;
  }

  function parseRoute(text){
    const raw = String(text || "");
    const match = raw.match(/([\u4e00-\u9fa5A-Za-z]{2,20})\s*到\s*([\u4e00-\u9fa5A-Za-z]{2,20})/);
    return {
      origin:match && match[1] || "",
      destination:match && match[2] || ""
    };
  }

  function parseDate(text){
    const raw = String(text || "");
    const match = raw.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2}|今天|明天|后天|下周[一二三四五六日天]?|周[一二三四五六日天])/);
    return match && match[1] || "";
  }

  function createCommerceSearchRequest(task){
    const route = parseRoute(task && task.inputSummary);
    return {
      taskId:String(task && task.taskId || ""),
      category:String(task && task.category || "generalProcurement"),
      query:sanitizeText(task && task.inputSummary || "", 240),
      origin:route.origin,
      destination:route.destination,
      date:parseDate(task && task.inputSummary || ""),
      passengers:1,
      currency:"CNY",
      locale:"zh-CN",
      missingFields:missingFieldsForTask(task)
    };
  }

  function validateBookingUrl(url){
    try {
      const parsed = new URL(String(url || ""));
      return parsed.protocol === "https:" ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function sanitizeCommerceCandidate(candidate, context){
    const item = candidate && typeof candidate === "object" ? candidate : {};
    const parsedUrl = validateBookingUrl(item.bookingUrl);
    const price = Number(item.price);
    return {
      candidateId:sanitizeText(item.candidateId || ("commerceCandidate-" + Math.random().toString(36).slice(2, 8)), 80),
      sourceName:sanitizeText(item.sourceName || item.provider || "搜索源", 80),
      title:sanitizeText(item.title || "候选方案", 120),
      category:sanitizeText(item.category || context && context.category || "", 60),
      price:Number.isFinite(price) && price >= 0 ? price : null,
      currency:sanitizeText(item.currency || context && context.currency || "CNY", 12),
      priceLabel:sanitizeText(item.priceLabel || (Number.isFinite(price) && price >= 0 ? String(item.currency || context && context.currency || "CNY") + " " + price : ""), 80),
      departTime:sanitizeText(item.departTime || "", 80),
      arriveTime:sanitizeText(item.arriveTime || "", 80),
      duration:sanitizeText(item.duration || "", 80),
      conditions:sanitizeText(item.conditions || "", 160),
      refundPolicySummary:sanitizeText(item.refundPolicySummary || "", 160),
      rating:sanitizeText(item.rating || "", 40),
      reputation:sanitizeText(item.reputation || "", 80),
      riskSummary:sanitizeText(item.riskSummary || (!parsedUrl && item.bookingUrl ? "预订链接不是 https，已阻断打开。" : ""), 160),
      hiddenFeeNote:sanitizeText(item.hiddenFeeNote || "", 160),
      bookingUrl:parsedUrl ? parsedUrl.href : "",
      bookingUrlHost:parsedUrl ? parsedUrl.host : "",
      recommendationReason:sanitizeText(item.recommendationReason || "", 180),
      collectedAt:sanitizeText(item.collectedAt || nowIso(), 40),
      isLiveResult:item.isLiveResult !== false,
      realExecution:false
    };
  }

  function normalizeCommerceSearchResults(raw, context){
    const source = raw && raw.candidates ? raw.candidates : raw;
    const candidates = (Array.isArray(source) ? source : [])
      .map((item) => sanitizeCommerceCandidate(item, context || {}))
      .filter((item) => item.price !== null);
    return {
      ok:true,
      providerName:sanitizeText(raw && raw.providerName || context && context.providerName || "", 80),
      candidates,
      collectedAt:nowIso()
    };
  }

  function sortCommerceCandidates(candidates){
    return (Array.isArray(candidates) ? candidates.slice() : []).sort((a, b) => {
      const priceA = Number.isFinite(Number(a && a.price)) ? Number(a.price) : Number.POSITIVE_INFINITY;
      const priceB = Number.isFinite(Number(b && b.price)) ? Number(b.price) : Number.POSITIVE_INFINITY;
      if (priceA !== priceB) return priceA - priceB;
      return String(b && b.rating || "").localeCompare(String(a && a.rating || ""));
    });
  }

  function createRecommendationFromCandidates(candidates){
    const sorted = sortCommerceCandidates(candidates);
    const top = sorted[0] || null;
    if (!top) {
      return {
        title:"",
        reason:"没有可用候选方案。未生成价格或推荐结论。",
        riskSummary:"搜索源未返回可展示价格。",
        priceMayChange:true
      };
    }
    return {
      candidateId:top.candidateId,
      title:top.title,
      sourceName:top.sourceName,
      price:top.price,
      currency:top.currency,
      priceLabel:top.priceLabel,
      reason:top.recommendationReason || "按当前 provider 返回数据排序，该方案价格最低，同时保留退改、风险和隐性费用复核。",
      riskSummary:top.riskSummary || "价格可能变化，预订前仍需用户确认。",
      priceMayChange:true
    };
  }

  function createCommerceSearchHistoryPayload(action, payload){
    const data = payload || {};
    const candidates = Array.isArray(data.candidates) ? data.candidates : [];
    const sorted = sortCommerceCandidates(candidates);
    const lowest = sorted[0] || {};
    return {
      schemaVersion:"weishan.task.v1",
      module:"commerceAgent",
      action:String(action || "commerceAgent.search").replace(/^commerceAgent\./, ""),
      taskId:sanitizeText(data.taskId || "", 80),
      category:sanitizeText(data.category || "", 60),
      inputSummary:sanitizeText(data.inputSummary || data.query || "", 240),
      candidateCount:candidates.length,
      lowestPrice:lowest.price || "",
      currency:lowest.currency || data.currency || "",
      providerName:sanitizeText(data.providerName || "", 80),
      resultStatus:sanitizeText(data.resultStatus || "", 80),
      realExecution:false,
      createdAt:nowIso()
    };
  }

  async function searchCommerceCandidates(task){
    const settings = getCommerceSearchSettings();
    const request = createCommerceSearchRequest(task);
    if (!hasCommerceSearchProvider(settings)) {
      return {
        ok:false,
        code:"COMMERCE_PROVIDER_NOT_CONFIGURED",
        message:"搜索源未配置，无法返回真实价格。",
        request,
        candidates:[]
      };
    }
    if (request.missingFields && request.missingFields.length) {
      return {
        ok:false,
        code:"COMMERCE_MISSING_FIELDS",
        message:"搜索条件缺失：" + request.missingFields.join("、"),
        request,
        candidates:[]
      };
    }
    if (settings.providerMode === "manualProvider") {
      const raw = await window.WeishanCommerceSearchProvider.search(request);
      const normalized = normalizeCommerceSearchResults(raw, Object.assign({}, request, { providerName:settings.providerName || raw && raw.providerName || "manualProvider" }));
      const candidates = sortCommerceCandidates(normalized.candidates);
      return {
        ok:true,
        providerName:settings.providerName || normalized.providerName || "manualProvider",
        request,
        candidates,
        recommendation:createRecommendationFromCandidates(candidates),
        realExecution:false
      };
    }
    return {
      ok:false,
      code:"COMMERCE_PROVIDER_NOT_CONFIGURED",
      message:"搜索源未配置，无法返回真实价格。",
      request,
      candidates:[]
    };
  }

  window.WeishanCommerceSearch = {
    COMMERCE_SEARCH_SETTINGS_KEY,
    getCommerceSearchSettings,
    saveCommerceSearchSettings,
    hasCommerceSearchProvider,
    createCommerceSearchRequest,
    normalizeCommerceSearchResults,
    sortCommerceCandidates,
    createRecommendationFromCandidates,
    validateBookingUrl,
    sanitizeCommerceCandidate,
    createCommerceSearchHistoryPayload,
    searchCommerceCandidates
  };
})();
