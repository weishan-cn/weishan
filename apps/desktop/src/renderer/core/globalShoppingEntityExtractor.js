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

  function buildGlobalShoppingEntityExtraction(input) {
    const safe = text(input && (input.userIntent || input.query || input.inputSummary || input.text));
    const classification = input && input.intentClassification || {};
    const intentType = text(classification.intentType || "");
    const entities = {
      brand:matchFirst(safe, /\b(Apple|苹果|Sony|索尼|Nintendo|任天堂)\b/i),
      model:matchFirst(safe, /\b(iPhone\s*16\s*Pro|MacBook\s*Pro|Nintendo\s*Switch)\b/i),
      category:intentType || "unknown",
      country:matchFirst(safe, /(日本|美国|中国|韩国|新加坡|法国|德国)/i),
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
