;(function () {
  "use strict";
  const STATES = Object.freeze(["CREATED", "ACTIVE", "UPDATED", "REVIEWED", "COMPLETED", "ARCHIVED"]);
  const EVENTS = Object.freeze(["CREATE", "ACTIVATE", "UPDATE", "REVIEW", "COMPLETE", "ARCHIVE", "VIEW"]);
  const NEXT = Object.freeze({ CREATED:["ACTIVE", "ARCHIVED"], ACTIVE:["UPDATED", "REVIEWED", "COMPLETED", "ARCHIVED"], UPDATED:["ACTIVE", "REVIEWED", "COMPLETED", "ARCHIVED"], REVIEWED:["ACTIVE", "UPDATED", "COMPLETED", "ARCHIVED"], COMPLETED:["ARCHIVED"], ARCHIVED:[] });
  function rejected(code) { return Object.freeze({ success:false, code:code || "DECISION_LIFECYCLE_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && api.guardAndCloneCommerceInput(input); }
  function createDecisionLifecycle(input) {
    const checked = guard(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["lifecycleId", "memoryId", "domain"].indexOf(key) < 0; }) || typeof checked.value.lifecycleId !== "string" || typeof checked.value.memoryId !== "string" || typeof checked.value.domain !== "string") return rejected();
    return Object.freeze({ success:true, lifecycle:Object.freeze({ lifecycleId:checked.value.lifecycleId, memoryId:checked.value.memoryId, domain:checked.value.domain, state:"CREATED", userTriggered:true, automaticTransitionEnabled:false }) });
  }
  function transitionDecisionLifecycle(input) {
    const checked = guard(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["lifecycle", "nextState", "userTriggered"].indexOf(key) < 0; })) return rejected();
    const value = checked.value, lifecycle = value.lifecycle;
    if (!lifecycle || typeof lifecycle !== "object" || STATES.indexOf(lifecycle.state) < 0 || STATES.indexOf(value.nextState) < 0 || value.userTriggered !== true || NEXT[lifecycle.state].indexOf(value.nextState) < 0) return rejected("DECISION_LIFECYCLE_TRANSITION_REJECTED");
    return Object.freeze({ success:true, lifecycle:Object.freeze({ lifecycleId:lifecycle.lifecycleId, memoryId:lifecycle.memoryId, domain:lifecycle.domain, state:value.nextState, userTriggered:true, automaticTransitionEnabled:false }) });
  }
  function createDecisionVersion(input) {
    const checked = guard(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["versionId", "previousArtifact", "updatedArtifact", "updateSummary", "userTriggered"].indexOf(key) < 0; }) || typeof checked.value.versionId !== "string" || !checked.value.previousArtifact || !checked.value.updatedArtifact || typeof checked.value.updateSummary !== "string" || checked.value.userTriggered !== true) return rejected("DECISION_VERSION_REJECTED");
    return Object.freeze({ success:true, version:Object.freeze({ versionId:checked.value.versionId, previousArtifact:checked.value.previousArtifact, updatedArtifact:checked.value.updatedArtifact, updateSummary:checked.value.updateSummary, userTriggered:true, overwritesPrevious:false }) });
  }
  function appendDecisionTimelineEvent(input) {
    const checked = guard(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["timeline", "eventId", "eventType", "memoryId", "userTriggered"].indexOf(key) < 0; }) || !Array.isArray(checked.value.timeline) || typeof checked.value.eventId !== "string" || EVENTS.indexOf(checked.value.eventType) < 0 || typeof checked.value.memoryId !== "string" || checked.value.userTriggered !== true) return rejected("DECISION_TIMELINE_REJECTED");
    return Object.freeze({ success:true, timeline:Object.freeze(checked.value.timeline.concat([Object.freeze({ eventId:checked.value.eventId, eventType:checked.value.eventType, memoryId:checked.value.memoryId, userTriggered:true, observedBehavior:false })])) });
  }
  function appendDecisionArchiveVersion(input) {
    const checked = guard(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["archive", "version", "userTriggered"].indexOf(key) < 0; }) || !Array.isArray(checked.value.archive) || !checked.value.version || Array.isArray(checked.value.version) || typeof checked.value.version.versionId !== "string" || !checked.value.version.previousArtifact || !checked.value.version.updatedArtifact || typeof checked.value.version.updateSummary !== "string" || checked.value.userTriggered !== true) return rejected("DECISION_ARCHIVE_VERSION_REJECTED");
    const version = Object.freeze({ versionId:checked.value.version.versionId, previousArtifact:checked.value.version.previousArtifact, updatedArtifact:checked.value.version.updatedArtifact, updateSummary:checked.value.version.updateSummary, userTriggered:true, overwritesPrevious:false });
    return Object.freeze({ success:true, archive:Object.freeze(checked.value.archive.concat([version])), appendedVersion:version, overwritesPrevious:false, automaticArchiveUpdate:false });
  }
  window.WeishanGlobalDecisionLifecycle = Object.freeze({ STATES, EVENTS, createDecisionLifecycle, transitionDecisionLifecycle, createDecisionVersion, appendDecisionTimelineEvent, appendDecisionArchiveVersion });
})();
