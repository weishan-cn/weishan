const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "../../apps/desktop/src/renderer/core");
const windowRef = {};
windowRef.window = windowRef;
const context = vm.createContext({ window:windowRef, Set, Number, Object, Array, String, Boolean, RegExp, Math });
[
  "globalCommerceInputGuard.js", "globalCommercePricing.js", "globalCommerceAvailability.js", "globalCommerceMerchantTrust.js", "globalCommerceDecision.js",
  "globalDecisionKnowledge.js", "globalDecisionExplanation.js", "globalDecisionRisk.js", "globalDecisionRecommendation.js", "globalDecisionCommerceAdapter.js",
  "globalDecisionOrchestrator.js", "globalDecisionMemoryArtifact.js", "globalDecisionMemory.js", "globalDecisionChange.js", "globalDecisionAssistant.js"
].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context));

const memoryApi = windowRef.WeishanGlobalDecisionMemory;
const changeApi = windowRef.WeishanGlobalDecisionChange;
const assistant = windowRef.WeishanGlobalDecisionAssistant;
const priorArtifact = { question:"Should I revisit this hotel comparison?", facts:[{ code:"TOTAL_COST" }], analysis:[{ code:"OLD_ANALYSIS" }], recommendation:{ recommendation:"hotel-old", whyRecommended:"Past declared evidence supported it.", advantages:["Past value"], risks:["Past evidence was limited."], alternatives:["hotel-a"], confidence:"MEDIUM" }, risks:[{ type:"DATA_LIMITATION", reason:"Past evidence was limited." }], alternatives:["hotel-a", "hotel-b"], confidence:"MEDIUM" };
const saved = memoryApi.saveDecisionMemory([], { memoryId:"archive-hotel-1", title:"Hotel comparison", domain:"COMMERCE", summary:"User saved hotel decision.", memoryType:"COMPARISON_RECORD", decisionArtifact:priorArtifact });
assert.equal(saved.success, true);
const candidate = (id, confidence, status, type, fraud) => ({ candidateId:id, pricing:{ currency:"JPY", basePrice:100, tax:10, shipping:0, priceConfidence:confidence }, availability:{ status, quantity:status === "OUT_OF_STOCK" ? 0 : 1, regionRestricted:false, shippingAvailable:true, preorder:false, backorder:false }, merchantTrust:{ merchantId:"merchant-" + id, merchantType:type, official:type === "OFFICIAL", authorized:type === "AUTHORIZED", marketplace:type === "MARKETPLACE", individual:type === "INDIVIDUAL", verified:type === "OFFICIAL", rating:type === "OFFICIAL" ? 4.7 : null, reviewCount:type === "OFFICIAL" ? 100 : 0, fraudRisk:fraud, evidence:type === "OFFICIAL" ? [{ type:"OFFICIAL_DECLARATION", value:true, confidence:"HIGH" }] : [] } });
const currentCandidates = [candidate("hotel-a", "HIGH", "IN_STOCK", "OFFICIAL", "LOW"), candidate("hotel-b", "MEDIUM", "LIMITED", "MARKETPLACE", "UNKNOWN"), candidate("hotel-c", "LOW", "OUT_OF_STOCK", "INDIVIDUAL", "HIGH")];
const action = { memories:saved.memories, memoryId:"archive-hotel-1", newQuestion:"How does the saved hotel decision compare now?", updatedConstraints:{ budget:"user-provided" }, updatedPreferences:{ riskTolerance:"user-provided" }, context:{ businessType:"HOTEL", region:"JP", currency:"JPY", constraints:{ budget:"user-provided" }, userProvidedPreferences:{ riskTolerance:"user-provided" } }, currentCandidates };
const result = assistant.continuePersonalDecision(action);
assert.equal(result.success, true);
assert.equal(result.assistantResult.userTriggered, true);
assert.equal(result.assistantResult.automaticRecalculation, false);
assert.equal(result.assistantResult.userDecisionRequired, true);
assert.equal(result.assistantResult.changes.status, "CHANGED");
assert.equal(result.assistantResult.recommendation.recommendation, "hotel-a");
assert.equal(JSON.stringify(result).includes("merchantId"), false);
assert.equal(JSON.stringify(result).includes("budget"), false);
assert.equal(changeApi.compareDecisionChanges({ previous:priorArtifact, current:priorArtifact }).status, "UNCHANGED");
assert.equal(changeApi.compareDecisionChanges({ previous:{}, current:{} }).status, "INSUFFICIENT_INFORMATION");
assert.equal(assistant.continuePersonalDecision(Object.assign({}, action, { accountId:"blocked" })).success, false);
const deleted = memoryApi.deleteDecisionMemory(saved.memories, "archive-hotel-1");
assert.equal(assistant.continuePersonalDecision(Object.assign({}, action, { memories:deleted.memories })).code, "DECISION_MEMORY_NOT_FOUND");
const inputJson = JSON.stringify(action);
assistant.continuePersonalDecision(action);
assert.equal(JSON.stringify(action), inputJson);
for (let index = 0; index < 20; index += 1) assert.deepEqual(JSON.parse(JSON.stringify(assistant.continuePersonalDecision(action))), JSON.parse(JSON.stringify(result)));
const getterInput = {};
Object.defineProperty(getterInput, "memoryId", { get() { throw new Error("getter must not execute"); } });
assert.equal(assistant.continuePersonalDecision(getterInput).success, false);
console.log("GLOBAL_DECISION_ASSISTANT PASS");
