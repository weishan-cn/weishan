(function(){
  const COMMERCE_SEARCH_SETTINGS_KEY = "weishan:commerceSearch:settings:v1";
  const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

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
    next.providerMode = /^(customEndpoint|manualProvider|openRouterModels)$/.test(next.providerMode) ? next.providerMode : "disabled";
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
    if (next.providerMode === "openRouterModels") return true;
    return false;
  }

  function isAiModelPricingTask(taskOrRequest){
    return String(taskOrRequest && taskOrRequest.category || "") === "aiModelPricing";
  }

  function missingFieldsForTask(task){
    const category = String(task && task.category || "");
    const text = String(task && task.inputSummary || "");
    const fields = [];
    if (/^(flight|train|hotel|cruise)$/.test(category) && !/(\d{4}[-/]\d{1,2}[-/]\d{1,2}|今天|明天|后天|下周|周[一二三四五六日天])/.test(text)) {
      fields.push(category === "hotel" ? "入住日期" : "出行日期");
    }
    if (category === "privateJet" && !/(飞|到|起飞|机场|from|to)/i.test(text)) fields.push("起降机场");
    return fields;
  }

  function cleanPlaceName(value, side){
    let next = String(value || "");
    if (side === "origin") next = next.replace(/.*?(?:今天|明天|后天|下周[一二三四五六日天]?|周[一二三四五六日天])/, "");
    return sanitizeText(next
      .replace(/^(帮我|请|想|我要|需要|找|买|购买|订|预定|预订|订票|买票|从|出发|低价|最便宜|的)+/g, "")
      .replace(/(机票|飞机票|航空票|航班|酒店|住宿|火车票|高铁票|邮轮|游轮|公务机|私人飞机|包机|商品|电商|低价|最便宜|的).*$/g, "")
      .trim(), 40);
  }

  function parseRoute(text){
    const raw = String(text || "");
    const match = raw.match(/([\u4e00-\u9fa5A-Za-z]{2,24})\s*(?:到|飞往|飞|去)\s*([\u4e00-\u9fa5A-Za-z]{2,24})/);
    return {
      origin:match ? cleanPlaceName(match[1], "origin") : "",
      destination:match ? cleanPlaceName(match[2], "destination") : ""
    };
  }

  function parseDate(text){
    const raw = String(text || "");
    const match = raw.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2}|今天|明天|后天|下周[一二三四五六日天]?|周[一二三四五六日天])/);
    return match && match[1] || "";
  }

  function createCommerceSearchRequest(task){
    const route = parseRoute(task && task.inputSummary);
    const category = String(task && task.category || "generalProcurement");
    return {
      taskId:String(task && task.taskId || ""),
      category,
      query:sanitizeText(task && task.inputSummary || "", 240),
      origin:route.origin,
      destination:route.destination,
      date:parseDate(task && task.inputSummary || ""),
      passengers:1,
      currency:category === "aiModelPricing" ? "USD" : "CNY",
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

  function validateOpenRouterModelUrl(url){
    const parsed = validateBookingUrl(url);
    if (!parsed) return null;
    return parsed.host === "openrouter.ai" || parsed.host.endsWith(".openrouter.ai") ? parsed : null;
  }

  function parseTokenPrice(value){
    if (value === null || value === undefined || value === "") return null;
    const num = Number(value);
    return Number.isFinite(num) && num >= 0 ? num : null;
  }

  function pricePerMillionValue(value){
    const num = parseTokenPrice(value);
    return num === null ? null : num * 1000000;
  }

  function compactUsd(value){
    const num = Number(value);
    if (!Number.isFinite(num)) return "";
    return "$" + num.toFixed(num >= 1 ? 4 : 6).replace(/0+$/, "").replace(/\.$/, "");
  }

  function pricePerMillionLabel(value){
    const num = pricePerMillionValue(value);
    return num === null ? "价格字段不可解析" : compactUsd(num) + " / 1M tokens";
  }

  function openRouterModelUrl(modelId, rawUrl){
    if (rawUrl) {
      const explicit = validateOpenRouterModelUrl(rawUrl);
      return explicit ? explicit.href : "";
    }
    const explicit = validateOpenRouterModelUrl(rawUrl);
    if (explicit) return explicit.href;
    const safeId = String(modelId || "").trim();
    if (!safeId) return "";
    return "https://openrouter.ai/models/" + encodeURIComponent(safeId);
  }

  function normalizeOpenRouterModel(model){
    const item = model && typeof model === "object" ? model : {};
    const modelId = sanitizeText(item.id || item.slug || "", 120);
    const name = sanitizeText(item.name || modelId || "OpenRouter model", 140);
    const pricing = item.pricing && typeof item.pricing === "object" ? item.pricing : {};
    const promptToken = parseTokenPrice(pricing.prompt);
    const completionToken = parseTokenPrice(pricing.completion);
    const promptMillion = pricePerMillionValue(pricing.prompt);
    const completionMillion = pricePerMillionValue(pricing.completion);
    const hasParsedPricing = promptMillion !== null || completionMillion !== null;
    const price = hasParsedPricing ? (promptMillion || 0) + (completionMillion || 0) : null;
    const contextLength = Number(item.context_length || item.contextLength || 0);
    const bookingUrl = openRouterModelUrl(modelId, item.canonical_url || item.href || item.bookingUrl);
    const parsedUrl = validateOpenRouterModelUrl(bookingUrl);
    const description = sanitizeText(item.description || item.architecture && item.architecture.modality || "", 180);
    return {
      candidateId:modelId || ("openrouterModel-" + Math.random().toString(36).slice(2, 8)),
      sourceName:"OpenRouter",
      title:name,
      modelId,
      category:"aiModelPricing",
      price,
      currency:"USD",
      priceLabel:hasParsedPricing ? "输入：" + pricePerMillionLabel(pricing.prompt) + " · 输出：" + pricePerMillionLabel(pricing.completion) : "价格字段不可解析",
      promptPricePerToken:promptToken === null ? "" : String(promptToken),
      completionPricePerToken:completionToken === null ? "" : String(completionToken),
      promptPricePerMillion:promptMillion === null ? "" : promptMillion,
      completionPricePerMillion:completionMillion === null ? "" : completionMillion,
      inputPriceLabel:pricePerMillionLabel(pricing.prompt),
      outputPriceLabel:pricePerMillionLabel(pricing.completion),
      contextLength:Number.isFinite(contextLength) && contextLength > 0 ? contextLength : "",
      departTime:"",
      arriveTime:"",
      duration:"",
      conditions:[description, contextLength ? "上下文长度 " + contextLength : ""].filter(Boolean).join(" · "),
      refundPolicySummary:"模型调用按平台计费规则结算；无下单或付款动作。",
      rating:"",
      reputation:"OpenRouter 模型目录",
      riskSummary:hasParsedPricing ? "模型价格可能变化，实际调用费用以平台结算为准。" : "价格字段不可解析，未生成价格结论。",
      hiddenFeeNote:"实际成本可能受路由、缓存、最小计费单位或平台规则影响。",
      bookingUrl:parsedUrl ? parsedUrl.href : "",
      bookingUrlHost:parsedUrl ? parsedUrl.host : "",
      recommendationReason:hasParsedPricing ? "按当前结果中的输入/输出综合成本排序；不能视为绝对最优。" : "缺少可解析 pricing 字段，仅展示模型信息，不生成价格推荐。",
      collectedAt:nowIso(),
      isLiveResult:true,
      realExecution:false
    };
  }

  function sanitizeCommerceCandidate(candidate, context){
    const item = candidate && typeof candidate === "object" ? candidate : {};
    const parsedUrl = validateBookingUrl(item.bookingUrl);
    const price = Number(item.price);
    return {
      candidateId:sanitizeText(item.candidateId || ("commerceCandidate-" + Math.random().toString(36).slice(2, 8)), 80),
      sourceName:sanitizeText(item.sourceName || item.provider || "搜索源", 80),
      title:sanitizeText(item.title || "候选方案", 120),
      modelId:sanitizeText(item.modelId || "", 120),
      category:sanitizeText(item.category || context && context.category || "", 60),
      price:Number.isFinite(price) && price >= 0 ? price : null,
      currency:sanitizeText(item.currency || context && context.currency || "CNY", 12),
      priceLabel:sanitizeText(item.priceLabel || (Number.isFinite(price) && price >= 0 ? String(item.currency || context && context.currency || "CNY") + " " + price : ""), 120),
      promptPricePerToken:item.promptPricePerToken === undefined ? "" : sanitizeText(item.promptPricePerToken, 40),
      completionPricePerToken:item.completionPricePerToken === undefined ? "" : sanitizeText(item.completionPricePerToken, 40),
      promptPricePerMillion:item.promptPricePerMillion === undefined || item.promptPricePerMillion === "" ? "" : Number(item.promptPricePerMillion),
      completionPricePerMillion:item.completionPricePerMillion === undefined || item.completionPricePerMillion === "" ? "" : Number(item.completionPricePerMillion),
      inputPriceLabel:sanitizeText(item.inputPriceLabel || "", 80),
      outputPriceLabel:sanitizeText(item.outputPriceLabel || "", 80),
      contextLength:item.contextLength === undefined || item.contextLength === "" ? "" : Number(item.contextLength),
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
      .filter((item) => item.price !== null || isAiModelPricingTask(context) && item.modelId);
    return {
      ok:true,
      providerName:sanitizeText(raw && raw.providerName || context && context.providerName || "", 80),
      candidates,
      collectedAt:nowIso()
    };
  }

  function modelCost(candidate){
    const prompt = Number.isFinite(Number(candidate && candidate.promptPricePerMillion)) ? Number(candidate.promptPricePerMillion) : Number.POSITIVE_INFINITY;
    const completion = Number.isFinite(Number(candidate && candidate.completionPricePerMillion)) ? Number(candidate.completionPricePerMillion) : Number.POSITIVE_INFINITY;
    return prompt + completion;
  }

  function sortCommerceCandidates(candidates){
    return (Array.isArray(candidates) ? candidates.slice() : []).sort((a, b) => {
      if (String(a && a.category || b && b.category || "") === "aiModelPricing") {
        const costA = modelCost(a);
        const costB = modelCost(b);
        if (costA !== costB) return costA - costB;
        const ctxA = Number.isFinite(Number(a && a.contextLength)) ? Number(a.contextLength) : 0;
        const ctxB = Number.isFinite(Number(b && b.contextLength)) ? Number(b.contextLength) : 0;
        if (ctxA !== ctxB) return ctxB - ctxA;
      }
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
      promptPricePerMillion:top.promptPricePerMillion || "",
      completionPricePerMillion:top.completionPricePerMillion || "",
      inputPriceLabel:top.inputPriceLabel || "",
      outputPriceLabel:top.outputPriceLabel || "",
      reason:top.recommendationReason || (top.category === "aiModelPricing" ? "按当前结果中的输入/输出综合成本排序；不能视为绝对最优。" : "按当前 provider 返回数据排序，该方案价格最低，同时保留退改、风险和隐性费用复核。"),
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
      lowestPromptPricePerMillion:lowest.promptPricePerMillion || "",
      lowestCompletionPricePerMillion:lowest.completionPricePerMillion || "",
      currency:lowest.currency || data.currency || "",
      providerName:sanitizeText(data.providerName || "", 80),
      resultStatus:sanitizeText(data.resultStatus || "", 80),
      realExecution:false,
      createdAt:nowIso()
    };
  }

  function normalizeOpenRouterModelsResponse(raw){
    const source = raw && Array.isArray(raw.data) ? raw.data : raw && Array.isArray(raw.models) ? raw.models : Array.isArray(raw) ? raw : [];
    const candidates = source.map(normalizeOpenRouterModel).filter((item) => item.modelId);
    return {
      ok:true,
      providerName:"OpenRouter",
      candidates,
      collectedAt:nowIso()
    };
  }

  async function fetchOpenRouterModels(){
    if (window.WeishanOpenRouterModelsProvider && typeof window.WeishanOpenRouterModelsProvider.fetchModels === "function") {
      return window.WeishanOpenRouterModelsProvider.fetchModels();
    }
    if (window.WeishanOpenRouterModelsProvider && typeof window.WeishanOpenRouterModelsProvider.search === "function") {
      return window.WeishanOpenRouterModelsProvider.search();
    }
    if (typeof fetch !== "function") throw new Error("OpenRouter models fetch is unavailable.");
    const res = await fetch(OPENROUTER_MODELS_URL, {
      method:"GET",
      headers:{ "Accept":"application/json" }
    });
    if (!res || !res.ok) throw new Error("OpenRouter models API unavailable.");
    return res.json();
  }

  async function searchOpenRouterModels(request){
    try {
      const raw = await fetchOpenRouterModels();
      const normalized = normalizeOpenRouterModelsResponse(raw);
      const candidates = sortCommerceCandidates(normalized.candidates);
      return {
        ok:true,
        providerName:"OpenRouter",
        request,
        candidates,
        recommendation:createRecommendationFromCandidates(candidates),
        realExecution:false
      };
    } catch (_) {
      return {
        ok:false,
        code:"OPENROUTER_MODELS_UNAVAILABLE",
        message:"OpenRouter 搜索源不可用，无法返回真实价格。",
        providerName:"OpenRouter",
        request,
        candidates:[]
      };
    }
  }

  async function searchCommerceCandidates(task){
    const settings = getCommerceSearchSettings();
    const request = createCommerceSearchRequest(task);
    if (isAiModelPricingTask(request)) return searchOpenRouterModels(request);
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
    validateOpenRouterModelUrl,
    sanitizeCommerceCandidate,
    normalizeOpenRouterModel,
    normalizeOpenRouterModelsResponse,
    createCommerceSearchHistoryPayload,
    searchCommerceCandidates
  };
})();
