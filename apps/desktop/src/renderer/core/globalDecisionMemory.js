;(function () {
  "use strict";

  const MEMORY_TYPES = Object.freeze(["DECISION_RECORD", "WATCH_ITEM", "COMPARISON_RECORD", "REFERENCE_NOTE"]);
  const ALLOWED_KEYS = Object.freeze(["memoryId", "title", "domain", "summary", "memoryType", "decisionArtifact"]);
  function rejected(code) { return Object.freeze({ success:false, code:code || "DECISION_MEMORY_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && typeof api.guardAndCloneCommerceInput === "function" ? api.guardAndCloneCommerceInput(input) : rejected(); }
  function createDecisionMemory(input) {
    const checked = guard(input);
    const artifactApi = window.WeishanGlobalDecisionMemoryArtifact;
    if (!checked.success || !checked.value || Array.isArray(checked.value) || !artifactApi || Object.getOwnPropertyNames(checked.value).some(function (key) { return ALLOWED_KEYS.indexOf(key) < 0; })) return rejected();
    const value = checked.value;
    if (typeof value.memoryId !== "string" || !value.memoryId || typeof value.title !== "string" || !value.title || typeof value.domain !== "string" || !value.domain || typeof value.summary !== "string" || !value.summary || MEMORY_TYPES.indexOf(value.memoryType) < 0) return rejected();
    const artifact = artifactApi.createDecisionMemoryArtifact(value.decisionArtifact);
    if (!artifact.success) return artifact;
    return Object.freeze({ success:true, memory:Object.freeze({ memoryId:value.memoryId, title:value.title, domain:value.domain, summary:value.summary, memoryType:value.memoryType, decisionArtifact:artifact.artifact, createdByUser:true, trackingEnabled:false, storage:"CALLER_MANAGED_OFFLINE" }) });
  }
  function saveDecisionMemory(memories, input) {
    const checked = guard(memories);
    if (!checked.success || !Array.isArray(checked.value)) return rejected("DECISION_MEMORY_COLLECTION_REJECTED");
    const result = createDecisionMemory(input);
    if (!result.success || checked.value.some(function (memory) { return memory && memory.memoryId === result.memory.memoryId; })) return result.success ? rejected("DECISION_MEMORY_DUPLICATE") : result;
    return Object.freeze({ success:true, memories:Object.freeze(checked.value.concat([result.memory])) });
  }
  function deleteDecisionMemory(memories, memoryId) {
    const checked = guard(memories);
    const id = guard(memoryId);
    if (!checked.success || !Array.isArray(checked.value) || !id.success || typeof id.value !== "string" || !id.value) return rejected("DECISION_MEMORY_COLLECTION_REJECTED");
    const next = checked.value.filter(function (memory) { return !memory || memory.memoryId !== id.value; });
    return checked.value.length === next.length ? rejected("DECISION_MEMORY_NOT_FOUND") : Object.freeze({ success:true, memories:Object.freeze(next) });
  }
  function continueDecision(memories, memoryId) {
    const checked = guard(memories);
    const id = guard(memoryId);
    if (!checked.success || !Array.isArray(checked.value) || !id.success || typeof id.value !== "string") return rejected("DECISION_MEMORY_COLLECTION_REJECTED");
    const memory = checked.value.find(function (item) { return item && item.memoryId === id.value; });
    return memory ? Object.freeze({ success:true, continuation:Object.freeze({ memoryId:memory.memoryId, title:memory.title, domain:memory.domain, decisionArtifact:memory.decisionArtifact, recalculationRequested:false }) }) : rejected("DECISION_MEMORY_NOT_FOUND");
  }
  window.WeishanGlobalDecisionMemory = Object.freeze({ MEMORY_TYPES, createDecisionMemory, saveDecisionMemory, deleteDecisionMemory, continueDecision });
})();
