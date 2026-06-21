const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/aiBackendRouter.js",
    "apps/desktop/src/renderer/core/procurementClarificationGate.js",
    "apps/desktop/src/renderer/core/aiProcurementBrainOrchestrator.js"
  ]);
  const api = windowRef.WeishanAiProcurementBrainOrchestrator;
  assert.equal(api.AI_PROCUREMENT_BRAIN_ORCHESTRATOR_VERSION, "2.1.35");
  const clearFlight = api.orchestrateAiProcurementBrain({ rawUserInput:"7月15日上海到成都最便宜的直达机票", userAiApiState:{ aiApiTokenConfigured:false }, networkPolicy:{ enabled:true } });
  assert.equal(clearFlight.intentStatus, "ready");
  assert.equal(clearFlight.procurementCategory, "flight");
  assert.equal(clearFlight.resultSurfaceMode, "clean_user_results");
  const vagueFlight = api.orchestrateAiProcurementBrain({ rawUserInput:"帮我买机票" });
  assert.equal(vagueFlight.intentStatus, "needs_clarification");
  assert.match(vagueFlight.clarificationQuestion, /出发地.*目的地.*日期/);
  const vagueProduct = api.orchestrateAiProcurementBrain({ rawUserInput:"买 iPhone" });
  assert.equal(vagueProduct.intentStatus, "needs_clarification");
  const blocked = api.orchestrateAiProcurementBrain({ rawUserInput:"帮我买枪" });
  assert.equal(blocked.intentStatus, "blocked");
  assert.equal(blocked.procurementCategory, "restricted_or_blocked");
  const token = api.orchestrateAiProcurementBrain({ rawUserInput:"7月15日上海到成都最便宜的直达机票", userAiApiState:{ aiApiTokenConfigured:true } });
  assert.equal(token.preferredReasoningBackend, "user_ai_token");
  const noToken = api.orchestrateAiProcurementBrain({ rawUserInput:"7月15日上海到成都最便宜的直达机票", networkPolicy:{ enabled:true } });
  assert.ok(["safe_network_search", "local_rules"].includes(noToken.preferredReasoningBackend));
  const localOnly = api.orchestrateAiProcurementBrain({ rawUserInput:"7月15日上海到成都最便宜的直达机票", networkPolicy:{ enabled:false } });
  assert.equal(localOnly.preferredReasoningBackend, "local_rules");
  assert.equal(vagueFlight.allowPayment, false);
  assert.equal(vagueFlight.allowOrder, false);
  assert.equal(vagueFlight.allowIdentityUpload, false);
  const audit = api.buildAiProcurementBrainAuditDraft({ rawUserInput:"帮我买机票" });
  assert.equal(audit.eventType, "AI_PROCUREMENT_BRAIN_ORCHESTRATOR_DRAFT");
  assert.equal(audit.clarificationAsked, true);
  assert.equal(audit.allowPayment, false);
  assert.equal(audit.allowOrder, false);
  assert.equal(audit.allowIdentityUpload, false);
  assert.equal(audit.redacted, true);
  assert.equal(api.assertAiProcurementBrainSafe(vagueFlight), true);
  console.log("AI_PROCUREMENT_BRAIN_ORCHESTRATOR_CORE PASS");
}

main();
