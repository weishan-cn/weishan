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

  function detectIntentType(query) {
    if (/(酒店|住宿|hotel|room|入住|民宿)/i.test(query)) return "hotel";
    if (/(机票|航班|flight|机酒|出发|返程|票价)/i.test(query)) return "flight";
    if (/(套餐|travel package|自由行|度假包|行程套餐)/i.test(query)) return "travel-package";
    if (/(商品|价格|比价|iPhone|MacBook|switch|耳机|官网|电商)/i.test(query)) return "product";
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
    const productMatch = safe.match(/\b(iPhone\s*16\s*Pro|MacBook\s*Pro|Nintendo\s*Switch)\b/i);
    if (productMatch) entities.product = productMatch[1];
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
