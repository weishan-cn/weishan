;(function () {
  "use strict";

  const GLOBAL_SHOPPING_ENTITY_EXTRACTOR_VERSION = "4.2.8";
  const EXTRACTOR_NAME = "global_shopping_entity_extractor_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function matchFirst(query, pattern) {
    const match = text(query).match(pattern);
    return match ? text(match[1] || match[0]) : "";
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
    "ARGENTINA":"AR",
    "NETHERLANDS":"NL",
    "UNITED KINGDOM":"GB",
    "EU":"EU"
  };

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

  function normalizeCountryCode(value) {
    const raw = text(value);
    if (!raw) return "";
    return COUNTRY_LABEL_TO_CODE[raw] || COUNTRY_LABEL_TO_CODE[raw.toUpperCase()] || "";
  }

  function categoryFromQuery(query, intentType) {
    const safe = text(query);
    if (/耳机|headphone|headphones|降噪耳机/i.test(safe)) return "headphones";
    if (/手机|iphone|android|smartphone/i.test(safe)) return "smartphones";
    if (/可口可乐|coca[-\s]?cola|饮料/i.test(safe)) return "grocery";
    if (/相机|camera/i.test(safe)) return "camera";
    if (/酒店|hotel|住宿/i.test(safe)) return "hotel";
    if (/机票|flight|航班/i.test(safe)) return "flight";
    return intentType || "unknown";
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

  function extractDestinationCountry(query) {
    const safe = text(query);
    const match = safe.match(/(?:收货到|寄到|送到|发往|运到|到达|寄往)\s*(美国|日本|中国|韩国|新加坡|法国|德国|英国|阿根廷|荷兰|欧盟|United Kingdom|Argentina|Netherlands|US|USA|JP|CN|KR|SG|FR|DE|GB|AR|NL|EU)/i);
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
    const directMatches = safe.match(/\b(?:United Kingdom|Argentina|Netherlands|US|USA|JP|CN|KR|SG|FR|DE|GB|AR|NL|EU)\b|美国|日本|中国|韩国|新加坡|法国|德国|英国|阿根廷|荷兰|欧盟/gi) || [];
    directMatches.forEach(function (part) {
      const code = normalizeCountryCode(part);
      if (code) markets.push(code);
    });
    return uniqueList(markets);
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
    const multiWord = safe.match(/(iPhone\s*\d+(?:\s*(?:Pro|Plus|Mini|Max))?|PlayStation-?\d+(?:\s*Pro)?|MacBook\s+Pro|Nintendo\s+Switch|可口可乐|Coca[-\s]?Cola)/i);
    if (multiWord && multiWord[1]) candidates.push(multiWord[1]);
    const tokenMatches = safe.match(/\b[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+\b|\b[A-Za-z]{1,8}\d[A-Za-z0-9-]{1,16}\b|\b[A-Z]\d{3,6}[A-Z0-9]{0,4}\b/g) || [];
    candidates.push.apply(candidates, tokenMatches);
    for (let i = 0; i < candidates.length; i += 1) {
      const candidate = cleanModelToken(candidates[i]);
      if (isLikelyModelToken(candidate)) return candidate;
    }
    return "";
  }

  function buildGlobalShoppingEntityExtraction(input) {
    const safe = text(input && (input.userIntent || input.query || input.inputSummary || input.text));
    const classification = input && input.intentClassification || {};
    const intentType = text(classification.intentType || "");
    const brand = matchFirst(safe, BRAND_PATTERN);
    const budgetInfo = extractBudget(safe);
    const destinationCountry = extractDestinationCountry(safe);
    const comparisonMarkets = extractComparisonMarkets(safe);
    const entities = {
      brand:brand,
      model:extractModel(safe, brand),
      category:categoryFromQuery(safe, intentType || "unknown"),
      productName:/可口可乐|coca[-\s]?cola/i.test(safe) ? "Coca-Cola" : "",
      country:matchFirst(safe, /(日本|美国|中国|韩国|新加坡|法国|德国|英国|阿根廷|荷兰)/i),
      destinationCountry:destinationCountry,
      comparisonMarkets:comparisonMarkets,
      budget:budgetInfo.budget,
      currency:budgetInfo.currency,
      city:matchFirst(safe, /(东京|大阪|上海|成都|北京|香港|首尔|新加坡|纽约|洛杉矶)/i),
      date:matchFirst(safe, /(\d{1,2}\s*月\s*\d{1,2}\s*日|\d{4}-\d{1,2}-\d{1,2})/i),
      stayDate:matchFirst(safe, /(入住.*?\d{1,2}\s*月\s*\d{1,2}\s*日|\d{4}-\d{1,2}-\d{1,2})/i),
      destination:matchFirst(safe, /(去|到|住在)(东京|大阪|上海|成都|北京|香港|首尔|新加坡|纽约|洛杉矶)/i)
    };
    return clone({
      extractorName:EXTRACTOR_NAME,
      appVersion:GLOBAL_SHOPPING_ENTITY_EXTRACTOR_VERSION,
      intentType:intentType || "unknown",
      entities:entities,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingEntityExtractor = {
    GLOBAL_SHOPPING_ENTITY_EXTRACTOR_VERSION,
    EXTRACTOR_NAME,
    buildGlobalShoppingEntityExtraction
  };
})();
