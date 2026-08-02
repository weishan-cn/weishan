;(function () {
  "use strict";

  const KINDS = Object.freeze(["FACT", "ANALYSIS", "RECOMMENDATION"]);
  const ALLOWED_KEYS = Object.freeze(["kind", "code", "summary"]);

  function failure() { return Object.freeze({ success:false, code:"DECISION_KNOWLEDGE_REJECTED" }); }
  function guard(input) {
    const api = window.WeishanGlobalCommerceInputGuard;
    return api && typeof api.guardAndCloneCommerceInput === "function" ? api.guardAndCloneCommerceInput(input) : failure();
  }
  function normalize(item) {
    if (!item || typeof item !== "object" || Array.isArray(item) || Object.getOwnPropertyNames(item).some(function (key) { return ALLOWED_KEYS.indexOf(key) < 0; }) || KINDS.indexOf(item.kind) < 0 || typeof item.code !== "string" || !item.code || typeof item.summary !== "string" || !item.summary) return null;
    return Object.freeze({ kind:item.kind, code:item.code, summary:item.summary });
  }
  function createDecisionKnowledge(input) {
    const checked = guard(input);
    if (!checked.success || !Array.isArray(checked.value)) return failure();
    const output = checked.value.map(normalize);
    return output.some(function (item) { return item === null; }) ? failure() : Object.freeze({ success:true, items:Object.freeze(output) });
  }
  function splitDecisionKnowledge(input) {
    const result = createDecisionKnowledge(input);
    if (!result.success) return result;
    return Object.freeze({ success:true, facts:Object.freeze(result.items.filter(function (item) { return item.kind === "FACT"; })), analysis:Object.freeze(result.items.filter(function (item) { return item.kind === "ANALYSIS"; })), recommendations:Object.freeze(result.items.filter(function (item) { return item.kind === "RECOMMENDATION"; })) });
  }
  window.WeishanGlobalDecisionKnowledge = Object.freeze({ KINDS, createDecisionKnowledge, splitDecisionKnowledge });
})();
