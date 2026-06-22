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
  const windowRef = load(["apps/desktop/src/renderer/core/aiBackendRouter.js"]);
  const api = windowRef.WeishanAiBackendRouter;
  assert.equal(api.AI_BACKEND_ROUTER_VERSION, "2.1.55");
  assert.equal(api.routeAiBackend({ userAiApiState:{ aiApiTokenConfigured:true }, networkPolicy:{ enabled:true } }).backendDecision, "user_ai_token");
  assert.equal(api.routeAiBackend({ networkPolicy:{ enabled:true } }).backendDecision, "safe_network_search");
  assert.equal(api.routeAiBackend({ networkPolicy:{ enabled:false } }).backendDecision, "local_rules");
  assert.equal(api.routeAiBackend({ taskType:"restricted_or_blocked", restrictedCategoryDecision:"blocked", userAiApiState:{ aiApiTokenConfigured:true } }).backendDecision, "blocked");
  const decision = api.routeAiBackend({ userAiApiState:{ aiApiTokenConfigured:true }, networkPolicy:{ enabled:true } });
  assert.equal(decision.tokenReadMode, "secure_proxy_only");
  assert.equal(decision.tokenPlaintextDisplayed, false);
  assert.equal(decision.tokenLogged, false);
  assert.equal(decision.paymentDisabled, true);
  assert.equal(decision.orderDisabled, true);
  assert.equal(decision.identityUploadDisabled, true);
  const audit = api.buildAiBackendRouterAuditDraft({ userAiApiState:{ aiApiTokenConfigured:true } });
  assert.equal(audit.eventType, "AI_BACKEND_ROUTER_DRAFT");
  assert.equal(audit.tokenPlaintextDisplayed, false);
  assert.equal(audit.tokenLogged, false);
  assert.equal(audit.redacted, true);
  assert.equal(api.assertAiBackendRouterSafe(decision), true);
  console.log("AI_BACKEND_ROUTER_CORE PASS");
}

main();
