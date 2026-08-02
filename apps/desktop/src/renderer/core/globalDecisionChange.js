;(function () {
  "use strict";

  const ALLOWED_KEYS = Object.freeze(["previous", "current"]);
  function rejected() { return Object.freeze({ success:false, code:"DECISION_CHANGE_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && typeof api.guardAndCloneCommerceInput === "function" ? api.guardAndCloneCommerceInput(input) : rejected(); }
  function codes(value) { return Array.isArray(value) ? value.map(function (item) { return item && typeof item === "object" ? item.code || item.type || item.reason : String(item); }).filter(Boolean).sort() : null; }
  function same(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
  function validEvidence(item) { return item && !Array.isArray(item) && Object.getOwnPropertyNames(item).every(function (key) { return ["type", "source", "statement", "confidence", "limitations", "userProvided"].indexOf(key) >= 0; }) && ({ FACT:"USER_PROVIDED", USER_INPUT:"USER_PROVIDED", ASSUMPTION:"DECLARED_ASSUMPTION", ANALYSIS_BASIS:"OFFLINE_CALCULATION", LIMITATION:"DISCLOSED_LIMITATION" })[item.type] === item.source && typeof item.statement === "string" && item.statement && ["HIGH", "MEDIUM", "LOW"].indexOf(item.confidence) >= 0 && Array.isArray(item.limitations) && typeof item.userProvided === "boolean"; }
  function compareDecisionChanges(input) {
    const checked = guard(input);
    if (!checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ALLOWED_KEYS.indexOf(key) < 0; })) return rejected();
    const previous = checked.value.previous, current = checked.value.current;
    if (!previous || !current || typeof previous !== "object" || typeof current !== "object" || Array.isArray(previous) || Array.isArray(current)) return Object.freeze({ success:true, status:"INSUFFICIENT_INFORMATION", categories:Object.freeze(["INSUFFICIENT_INFORMATION"]), reasons:Object.freeze(["A saved decision and current user-provided result are both required."]) });
    const previousFacts = codes(previous.facts), currentFacts = codes(current.facts);
    const previousRisks = codes(previous.risks), currentRisks = codes(current.risks);
    const previousRecommendation = previous.recommendation && previous.recommendation.recommendation;
    const currentRecommendation = current.recommendation && current.recommendation.recommendation;
    if (!previousFacts || !currentFacts || !previousRisks || !currentRisks || typeof previousRecommendation !== "string" || typeof currentRecommendation !== "string" || typeof previous.confidence !== "string" || typeof current.confidence !== "string") return Object.freeze({ success:true, status:"INSUFFICIENT_INFORMATION", categories:Object.freeze(["INSUFFICIENT_INFORMATION"]), reasons:Object.freeze(["Comparable offline decision fields are incomplete."]) });
    const changes = [];
    if (!same(previousFacts, currentFacts)) changes.push("Facts changed based on user-provided current information.");
    if (!same(previousRisks, currentRisks)) changes.push("Risk disclosures changed based on user-provided current information.");
    if (previousRecommendation !== currentRecommendation) changes.push("Recommendation changed because the comparable offline evidence changed.");
    if (previous.confidence !== current.confidence) changes.push("Confidence changed because evidence completeness changed.");
    const categories = [];
    if (!same(previousFacts, currentFacts)) categories.push("FACT_CHANGED");
    if (!same(previousRisks, currentRisks)) categories.push("RISK_CHANGED");
    if (previousRecommendation !== currentRecommendation) categories.push("OPTION_CHANGED");
    if (previousFacts === null || currentFacts === null || previousRisks === null || currentRisks === null) categories.push("INSUFFICIENT_INFORMATION");
    return Object.freeze({ success:true, status:changes.length ? "CHANGED" : "UNCHANGED", categories:Object.freeze(categories), reasons:Object.freeze(changes.length ? changes : ["No change was found in the comparable user-provided information."]) });
  }
  function compareDecisionChangesWithEvidence(input) {
    const checked = guard(input);
    if (!checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["previous", "current", "previousEvidence", "currentEvidence"].indexOf(key) < 0; }) || !Array.isArray(checked.value.previousEvidence) || !Array.isArray(checked.value.currentEvidence) || !checked.value.previousEvidence.length || !checked.value.currentEvidence.length || !checked.value.previousEvidence.every(validEvidence) || !checked.value.currentEvidence.every(validEvidence)) return rejected();
    const base = compareDecisionChanges({ previous:checked.value.previous, current:checked.value.current });
    if (!base.success) return base;
    if (base.status === "INSUFFICIENT_INFORMATION") return Object.freeze({ success:true, status:"INSUFFICIENT_INFORMATION", changes:Object.freeze([]), categories:Object.freeze(["INSUFFICIENT_INFORMATION"]), evidenceRequired:true });
    const previous = checked.value.previous, current = checked.value.current;
    const stable = function (value) { return JSON.stringify(value || null); };
    const categories = base.categories.slice(), changes = base.categories.map(function (category) { return Object.freeze({ category, reason:base.reasons[categories.indexOf(category)], evidence:Object.freeze(checked.value.currentEvidence.slice()) }); });
    if (stable(previous.constraints) !== stable(current.constraints)) { categories.push("CONSTRAINT_CHANGED"); changes.push(Object.freeze({ category:"CONSTRAINT_CHANGED", reason:"Explicit user-provided constraints changed.", evidence:Object.freeze(checked.value.currentEvidence.slice()) })); }
    if (stable(checked.value.previousEvidence) !== stable(checked.value.currentEvidence)) { categories.push("EVIDENCE_CHANGED"); changes.push(Object.freeze({ category:"EVIDENCE_CHANGED", reason:"The supplied evidence set changed.", evidence:Object.freeze(checked.value.currentEvidence.slice()) })); }
    return Object.freeze({ success:true, status:changes.length ? "CHANGED" : "UNCHANGED", changes:Object.freeze(changes), categories:Object.freeze(categories), evidenceRequired:true, automaticDetection:false });
  }
  window.WeishanGlobalDecisionChange = Object.freeze({ compareDecisionChanges, compareDecisionChangesWithEvidence });
})();
