;(function () {
  "use strict";

  const DOMAINS = Object.freeze(["COMMERCE", "TRAVEL", "FINANCE"]);
  const INPUT_KEYS = Object.freeze(["domain", "userTriggered", "scenarios"]);
  const SCENARIO_KEYS = Object.freeze(["scenarioId", "title", "assumptions", "impacts", "advantages", "risks", "limitations", "tradeoffs"]);
  const IMPACT_KEYS = Object.freeze(["cost", "time", "risk", "convenience", "longTerm"]);

  function rejected() { return Object.freeze({ success:false, code:"DECISION_SCENARIO_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && api.guardAndCloneCommerceInput(input); }
  function list(value) { return Array.isArray(value) && value.every(function (item) { return typeof item === "string" && item.length > 0; }) ? Object.freeze(value.slice()) : null; }
  function hasOnly(value, keys) { return Object.getOwnPropertyNames(value).every(function (key) { return keys.indexOf(key) >= 0; }); }

  function normalizeScenario(value) {
    if (!value || Array.isArray(value) || !hasOnly(value, SCENARIO_KEYS) || typeof value.scenarioId !== "string" || !value.scenarioId || typeof value.title !== "string" || !value.title || !value.impacts || Array.isArray(value.impacts) || !hasOnly(value.impacts, IMPACT_KEYS)) return null;
    const assumptions = list(value.assumptions), advantages = list(value.advantages), risks = list(value.risks), limitations = list(value.limitations), tradeoffs = list(value.tradeoffs);
    if (!assumptions || !advantages || !risks || !limitations || !tradeoffs) return null;
    const impacts = {};
    for (const key of IMPACT_KEYS) {
      const items = list(value.impacts[key]);
      if (!items) return null;
      impacts[key] = items;
    }
    return Object.freeze({ scenarioId:value.scenarioId, title:value.title, assumptions, impacts:Object.freeze(impacts), advantages, risks, limitations, tradeoffs, userDefined:true, automaticallyGenerated:false });
  }

  function createDecisionScenarios(input) {
    const checked = guard(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || !hasOnly(checked.value, INPUT_KEYS) || DOMAINS.indexOf(checked.value.domain) < 0 || checked.value.userTriggered !== true || !Array.isArray(checked.value.scenarios) || checked.value.scenarios.length === 0) return rejected();
    const scenarios = checked.value.scenarios.map(normalizeScenario);
    if (scenarios.some(function (scenario) { return !scenario; }) || new Set(scenarios.map(function (scenario) { return scenario.scenarioId; })).size !== scenarios.length) return rejected();
    return Object.freeze({ success:true, scenarios:Object.freeze(scenarios), domain:checked.value.domain, userTriggered:true, generatedFromHistory:false, automaticallyGenerated:false });
  }

  window.WeishanGlobalDecisionScenario = Object.freeze({ DOMAINS, createDecisionScenarios });
})();
