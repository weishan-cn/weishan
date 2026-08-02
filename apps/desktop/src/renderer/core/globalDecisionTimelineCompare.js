;(function () {
  "use strict";

  function rejected() { return Object.freeze({ success:false, code:"DECISION_TIMELINE_COMPARE_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && api.guardAndCloneCommerceInput(input); }
  function copyDecision(value) { return Object.freeze({ facts:Object.freeze(value.facts.slice()), risks:Object.freeze(value.risks.slice()), alternatives:Object.freeze((value.alternatives || []).slice()), confidence:value.confidence, recommendation:value.recommendation }); }

  function compareDecisionTimeline(input) {
    const checked = guard(input), changeApi = window.WeishanGlobalDecisionChange;
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["previousDecision", "currentDecision", "previousEvidence", "currentEvidence", "userTriggered"].indexOf(key) < 0; }) || !checked.value.previousDecision || !checked.value.currentDecision || checked.value.userTriggered !== true || !changeApi) return rejected();
    const previous = checked.value.previousDecision, current = checked.value.currentDecision;
    if (!Array.isArray(previous.facts) || !Array.isArray(current.facts) || !Array.isArray(previous.risks) || !Array.isArray(current.risks) || !Array.isArray(previous.alternatives) || !Array.isArray(current.alternatives) || !previous.recommendation || !current.recommendation) return rejected();
    const change = changeApi.compareDecisionChangesWithEvidence({ previous:previous, current:current, previousEvidence:checked.value.previousEvidence, currentEvidence:checked.value.currentEvidence });
    if (!change.success) return rejected();
    return Object.freeze({ success:true, comparison:Object.freeze({ previousDecision:copyDecision(previous), currentDecision:copyDecision(current), keptReasons:Object.freeze(change.status === "UNCHANGED" ? ["Comparable user-provided facts, risk disclosures, and evidence did not change."] : []), changedReasons:Object.freeze(change.changes ? change.changes.map(function (item) { return item.reason; }) : change.reasons || []), newRisks:Object.freeze(current.risks.slice()), newAlternatives:Object.freeze(current.alternatives.slice()), changes:change, userTriggered:true, automaticTimelineScan:false }) });
  }

  window.WeishanGlobalDecisionTimelineCompare = Object.freeze({ compareDecisionTimeline });
})();
