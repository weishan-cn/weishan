const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingSandboxReplayViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingSandboxReplayViewModel;
  assert.equal(api.GLOBAL_SHOPPING_SANDBOX_REPLAY_VIEW_MODEL_VERSION, "4.2.2");
  const ready = api.buildGlobalShoppingSandboxReplayViewModel({
    sandboxSessionReplayCenter:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox 会话回放已准备" }, rows:[{ rowId:"r1", label:"会话", value:"ok", status:"pass" }] },
    providerEvidenceTrace:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 证据链已准备" }, rows:[{ rowId:"e1", label:"证据", value:"ok", status:"pass" }] },
    candidateConfidenceExplainer:{ status:"ready", userFacingSummary:{ resultLabel:"候选价可信度解释已准备" }, rows:[{ rowId:"c1", label:"可信度", value:"ok", status:"pass" }] },
    safeToProceedWithReadOnlySandboxUserExplanation:true
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.cards.length, 4);
  assert.equal(ready.disclosureRows.length, 4);
  assert.equal(api.buildGlobalShoppingSandboxReplayViewModel({}).status, "needs_review");
  assert.equal(api.buildGlobalShoppingSandboxReplayViewModel({ sandboxSessionReplayCenter:{ status:"blocked" } }).status, "blocked");
  assert.equal(api.buildGlobalShoppingSandboxReplayViewModel({ sandboxSessionReplayCenter:{ status:"ready" }, providerEvidenceTrace:{ status:"ready" }, candidateConfidenceExplainer:{ status:"ready" }, bookingUrl:"https://x" }).status, "blocked");
  assert.equal(/token|secret|apiKey/i.test(JSON.stringify(ready)), false);
  console.log("GLOBAL_SHOPPING_SANDBOX_REPLAY_VIEW_MODEL PASS");
}
main();