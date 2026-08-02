;(function () {
  "use strict";
  const PATTERN_IDS = Object.freeze(["PRICE_NOT_BEST", "TOTAL_COST", "RISK_REWARD", "LONG_TERM_VALUE"]);
  const PATTERNS = Object.freeze([
    Object.freeze({ patternId:"PRICE_NOT_BEST", principle:"Lowest price is not automatically the best choice.", dimensions:Object.freeze(["price", "risk", "limitations"]) }),
    Object.freeze({ patternId:"TOTAL_COST", principle:"Compare total cost rather than a single displayed amount.", dimensions:Object.freeze(["base", "fees", "tax", "shipping"]) }),
    Object.freeze({ patternId:"RISK_REWARD", principle:"Review expected value together with disclosed risks.", dimensions:Object.freeze(["benefits", "risks", "confidence"]) }),
    Object.freeze({ patternId:"LONG_TERM_VALUE", principle:"Consider long-term value alongside immediate cost.", dimensions:Object.freeze(["durability", "support", "limitations"]) })
  ]);
  function listDecisionPatterns() { return Object.freeze(PATTERNS.map(function (pattern) { return Object.freeze({ patternId:pattern.patternId, principle:pattern.principle, dimensions:Object.freeze(pattern.dimensions.slice()), personalLearningEnabled:false, rankingInfluenceEnabled:false }); })); }
  function findDecisionPattern(patternId) {
    const api = window.WeishanGlobalCommerceInputGuard;
    const checked = api && api.guardAndCloneCommerceInput(patternId);
    if (!checked || !checked.success || typeof checked.value !== "string") return Object.freeze({ success:false, code:"DECISION_PATTERN_NOT_FOUND" });
    const pattern = PATTERNS.find(function (item) { return item.patternId === checked.value; });
    return pattern ? Object.freeze({ success:true, pattern:Object.freeze({ patternId:pattern.patternId, principle:pattern.principle, dimensions:Object.freeze(pattern.dimensions.slice()), personalLearningEnabled:false, rankingInfluenceEnabled:false }) }) : Object.freeze({ success:false, code:"DECISION_PATTERN_NOT_FOUND" });
  }
  window.WeishanGlobalDecisionPattern = Object.freeze({ PATTERN_IDS, listDecisionPatterns, findDecisionPattern });
})();
