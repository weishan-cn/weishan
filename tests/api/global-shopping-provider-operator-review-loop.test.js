const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingProviderOperatorReviewLoop.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderOperatorReviewLoop;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_OPERATOR_REVIEW_LOOP_VERSION, "2.3.9");

  const sandboxReady = api.buildGlobalShoppingProviderOperatorReviewLoop({
    providerGovernanceConsoleSummary:{
      consoleStatus:"sandbox_ready",
      missingEvidence:[],
      blockedActions:[],
      allowedNextActions:["continue_sandbox_pilot_review", "monitor_audit_trail"],
      riskReasons:[],
      auditTrailSummary:{ line:"治理控制台已达到 sandbox-ready", redacted:true }
    }
  });
  assert.equal(sandboxReady.status, "sandbox_ready");
  assert.equal(sandboxReady.currentCanContinue, true);
  assert.equal(sandboxReady.allowContinueSandboxPilot, true);
  assert.equal(sandboxReady.mustPause, false);

  const needsEvidence = api.buildGlobalShoppingProviderOperatorReviewLoop({
    providerGovernanceConsoleSummary:{
      consoleStatus:"needs_evidence",
      missingEvidence:["compliance_evidence_pack"],
      blockedActions:[],
      allowedNextActions:["collect_missing_evidence", "human_review_evidence"],
      riskReasons:["evidence_incomplete"],
      auditTrailSummary:{ line:"治理控制台仍需补充证据", redacted:true }
    }
  });
  assert.equal(needsEvidence.status, "needs_evidence");
  assert.equal(needsEvidence.mustPause, true);
  assert.ok(needsEvidence.operatorSummary.missingEvidence.includes("compliance_evidence_pack"));

  const blocked = api.buildGlobalShoppingProviderOperatorReviewLoop({
    providerGovernanceConsoleSummary:{
      consoleStatus:"blocked",
      missingEvidence:[],
      blockedActions:["provider_pilot", "external_handoff", "checkout"],
      allowedNextActions:["pause_and_review_controls"],
      riskReasons:["real_provider_intent_detected"],
      auditTrailSummary:{ line:"治理控制台已阻断高风险动作", redacted:true }
    }
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.currentCanContinue, false);
  assert.equal(blocked.mustPause, true);
  assert.equal(blocked.shouldTriggerKillSwitch, true);
  assert.ok(blocked.blockedActions.includes("provider_pilot"));

  const safeJson = JSON.stringify(api.buildGlobalShoppingProviderOperatorReviewLoop({
    providerGovernanceConsoleSummary:{
      consoleStatus:"ready_for_human_approval",
      allowedNextActions:["request_final_human_approval"],
      blockedActions:[],
      riskReasons:["human_final_confirmation_pending"],
      auditTrailSummary:{ line:"token secret endpoint should be redacted", redacted:true }
    }
  }));
  assert.equal(safeJson.includes("token"), false);
  assert.equal(safeJson.includes("secret"), false);

  console.log("GLOBAL_SHOPPING_PROVIDER_OPERATOR_REVIEW_LOOP PASS");
}

main();
