;(function () {
  "use strict";

  const GLOBAL_SHOPPING_INTENT_CLASSIFIER_VERSION = "4.2.8";
  const CLASSIFIER_NAME = "global_shopping_intent_classifier_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  const BRAND_PATTERN = /(Apple|苹果|Sony|索尼|Nintendo|任天堂|Fujifilm|富士|Samsung|三星|Canon|佳能|PlayStation)/i;
  const COUNTRY_LABEL_TO_CODE = {
    "美国":"US",
    "日本":"JP",
    "中国":"CN",
    "韩国":"KR",
    "新加坡":"SG",
    "法国":"FR",
    "德国":"DE",
    "英国":"GB",
    "阿根廷":"AR",
    "荷兰":"NL",
    "波兰":"PL",
    "欧盟":"EU",
    "US":"US",
    "USA":"US",
    "JP":"JP",
    "CN":"CN",
    "KR":"KR",
    "SG":"SG",
    "FR":"FR",
    "DE":"DE",
    "GB":"GB",
    "AR":"AR",
    "NL":"NL",
    "PL":"PL",
    "ARGENTINA":"AR",
    "NETHERLANDS":"NL",
    "POLAND":"PL",
    "POLSKA":"PL",
    "UNITED KINGDOM":"GB",
    "EU":"EU"
  };

  function normalizeCountryCode(value) {
    const raw = text(value);
    if (!raw) return "";
    return COUNTRY_LABEL_TO_CODE[raw] || COUNTRY_LABEL_TO_CODE[raw.toUpperCase()] || "";
  }

  function normalizeCurrency(value) {
    const raw = text(value);
    if (!raw) return "";
    if (/^(美元|美金|USD)$/i.test(raw)) return "USD";
    if (/^(日元|JPY)$/i.test(raw)) return "JPY";
    if (/^(人民币|CNY)$/i.test(raw)) return "CNY";
    if (/^(欧元|EUR)$/i.test(raw)) return "EUR";
    if (/^(英镑|GBP)$/i.test(raw)) return "GBP";
    return raw.toUpperCase();
  }

  function uniqueList(values) {
    const seen = {};
    return (Array.isArray(values) ? values : []).map(text).filter(function (item) {
      if (!item) return false;
      const key = item.toUpperCase();
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function cleanModelToken(value) {
    return text(value).replace(/[，。,.!?)]+$/g, "");
  }

  function isLikelyModelToken(value) {
    const token = cleanModelToken(value);
    if (!token) return false;
    if (/^(US|USA|JP|CN|KR|SG|FR|DE|GB|EU|USD|JPY|CNY|EUR|GBP)$/i.test(token)) return false;
    if (/^\d+(?:\.\d+)?$/.test(token)) return false;
    if (/RUN|VAGUE|PRODUCT|FLIGHT|HOTEL|SMOKE|TEST|CASE/i.test(token) && (token.match(/-/g) || []).length >= 2) return false;
    if (/^(美元|美金|日元|人民币|欧元|英镑|耳机|降噪耳机|商品|平台|价格|预算)$/i.test(token)) return false;
    if (/^iPhone\s*\d+(?:\s*(?:Pro|Plus|Mini|Max))?$/i.test(token)) return true;
    if (/^PlayStation-?\d+(?:\s*Pro)?$/i.test(token)) return true;
    if ((token.match(/-/g) || []).length > 2) return false;
    if (/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+$/.test(token) && /[A-Za-z]/.test(token) && /\d/.test(token)) return true;
    if (/^[A-Za-z]{1,8}\d[A-Za-z0-9-]{1,16}$/.test(token)) return true;
    if (/^[A-Z]\d{3,6}[A-Z0-9]{0,4}$/.test(token)) return true;
    return false;
  }

  function extractModel(query, brand) {
    const safe = text(query);
    const brandToken = text(brand).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const brandPattern = brandToken
      ? new RegExp("\\b" + brandToken + "\\b\\s+([A-Za-z0-9][A-Za-z0-9-]{1,24}(?:\\s+(?:Pro|Plus|Mini|Max))?)", "i")
      : null;
    const candidates = [];
    const brandMatch = brandPattern ? safe.match(brandPattern) : null;
    if (brandMatch && brandMatch[1]) candidates.push(brandMatch[1]);
    const multiWord = safe.match(/\b(iPhone\s*\d+(?:\s*(?:Pro|Plus|Mini|Max))?|PlayStation-?\d+(?:\s*Pro)?|MacBook\s+Pro|Nintendo\s+Switch)\b/i);
    if (multiWord && multiWord[1]) candidates.push(multiWord[1]);
    const tokenMatches = safe.match(/\b[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+\b|\b[A-Za-z]{1,8}\d[A-Za-z0-9-]{1,16}\b|\b[A-Z]\d{3,6}[A-Z0-9]{0,4}\b/g) || [];
    candidates.push.apply(candidates, tokenMatches);
    for (let i = 0; i < candidates.length; i += 1) {
      const candidate = cleanModelToken(candidates[i]);
      if (isLikelyModelToken(candidate)) return candidate;
    }
    return "";
  }

  function extractBudget(query) {
    const safe = text(query);
    const match = safe.match(/预算\s*([0-9]+(?:\.[0-9]+)?)\s*(美元|美金|USD|日元|JPY|人民币|CNY|欧元|EUR|英镑|GBP)?/i);
    if (!match) return { budget:null, currency:"" };
    const amount = Number(match[1]);
    return {
      budget:Number.isFinite(amount) ? amount : null,
      currency:normalizeCurrency(match[2] || "")
    };
  }

  function extractDestinationCountry(query) {
    const safe = text(query);
    const match = safe.match(/(?:收货到|寄到|送到|发往|运到|到达|寄往)\s*(美国|日本|中国|韩国|新加坡|法国|德国|英国|阿根廷|荷兰|波兰|欧盟|United Kingdom|Argentina|Netherlands|Poland|Polska|US|USA|JP|CN|KR|SG|FR|DE|GB|AR|NL|PL|EU)/i);
    return normalizeCountryCode(match && (match[1] || match[0]));
  }

  function extractComparisonMarkets(query) {
    const safe = text(query);
    const markets = [];
    const compareMatch = safe.match(/比较\s*([^，。,.\s]+(?:和|与|及)[^，。,.\s]+).*?(?:平台|市场|价格|商品)/i);
    if (compareMatch && compareMatch[1]) {
      compareMatch[1].split(/和|与|及/).forEach(function (part) {
        const code = normalizeCountryCode(part);
        if (code) markets.push(code);
      });
    }
    const directMatches = safe.match(/\b(?:United Kingdom|Argentina|Netherlands|Poland|Polska|US|USA|JP|CN|KR|SG|FR|DE|GB|AR|NL|PL|EU)\b|美国|日本|中国|韩国|新加坡|法国|德国|英国|阿根廷|荷兰|波兰|欧盟/gi) || [];
    directMatches.forEach(function (part) {
      const code = normalizeCountryCode(part);
      if (code) markets.push(code);
    });
    return uniqueList(markets);
  }

  function detectIntentType(query) {
    if (/(酒店|住宿|hotel|room|入住|民宿)/i.test(query)) return "hotel";
    if (/(机票|航班|flight|机酒|出发|返程|票价)/i.test(query)) return "flight";
    if (/(套餐|travel package|自由行|度假包|行程套餐)/i.test(query)) return "travel-package";
    if (/(商品|价格|比价|iPhone|MacBook|switch|耳机|可口可乐|Coca[-\s]?Cola|咖啡桌|茶几|扶手椅|椅子|家具|coffee\s+table|armchair|官网|电商)/i.test(query)) return "product";
    return "unknown";
  }

  function detectConfidence(intentType, query) {
    if (!query) return 0.2;
    if (intentType === "unknown") return 0.35;
    if (intentType === "travel-package") return 0.7;
    if (intentType === "hotel" || intentType === "flight") return 0.88;
    return 0.82;
  }

  function buildEntities(query, intentType) {
    const entities = {};
    const safe = text(query);
    const brandMatch = safe.match(BRAND_PATTERN);
    const brand = brandMatch ? brandMatch[1] : "";
    const productMatch = safe.match(/(iPhone\s*\d+(?:\s*(?:Pro|Plus|Mini|Max))?|MacBook\s*Pro|Nintendo\s*Switch|可口可乐|Coca[-\s]?Cola|白蜡木咖啡桌|咖啡桌|茶几|扶手椅|椅子|coffee\s+table|armchair)/i);
    if (productMatch) entities.product = /可口可乐|coca/i.test(productMatch[1]) ? "Coca-Cola" : productMatch[1];
    if (brand) entities.brand = brand;
    const model = extractModel(safe, brand);
    if (model) entities.model = model;
    const cityMatches = safe.match(/东京|大阪|上海|成都|北京|香港|首尔|新加坡|纽约|洛杉矶/gi) || [];
    if (cityMatches[0]) entities.primaryLocation = cityMatches[0];
    if (cityMatches[1]) entities.secondaryLocation = cityMatches[1];
    const dateMatch = safe.match(/(\d{1,2}\s*月\s*\d{1,2}\s*日|\d{4}-\d{1,2}-\d{1,2})/);
    if (dateMatch) entities.date = dateMatch[1];
    if (intentType === "hotel" && cityMatches[0]) entities.destination = cityMatches[0];
    if (intentType === "flight") {
      if (cityMatches[0]) entities.origin = cityMatches[0];
      if (cityMatches[1]) entities.destination = cityMatches[1];
    }
    const budgetInfo = extractBudget(safe);
    if (budgetInfo.budget != null) entities.budget = budgetInfo.budget;
    if (budgetInfo.currency) entities.currency = budgetInfo.currency;
    const destinationCountry = extractDestinationCountry(safe);
    if (destinationCountry) entities.destinationCountry = destinationCountry;
    const comparisonMarkets = extractComparisonMarkets(safe);
    if (comparisonMarkets.length) entities.comparisonMarkets = comparisonMarkets;
    return entities;
  }

  function buildGlobalShoppingIntentClassification(input) {
    const safe = text(input && (input.userIntent || input.query || input.inputSummary || input.text));
    const intentType = detectIntentType(safe);
    return clone({
      classifierName:CLASSIFIER_NAME,
      appVersion:GLOBAL_SHOPPING_INTENT_CLASSIFIER_VERSION,
      intentType:intentType,
      confidence:detectConfidence(intentType, safe),
      entities:buildEntities(safe, intentType),
      redacted:true
    });
  }

  window.WeishanGlobalShoppingIntentClassifier = {
    GLOBAL_SHOPPING_INTENT_CLASSIFIER_VERSION,
    CLASSIFIER_NAME,
    buildGlobalShoppingIntentClassification
  };
})();
