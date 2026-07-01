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
    "apps/desktop/src/renderer/core/globalShoppingHumanControlledSandboxProviderPilotPlanner.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderKillSwitchDrill.js",
    "apps/desktop/src/renderer/core/globalShoppingComplianceEvidencePack.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderPilotGovernanceViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderGovernanceConsole.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderGovernanceConsole;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_CONSOLE_VERSION, "2.3.7");

  const readyForApproval = api.buildGlobalShoppingProviderGovernanceConsole({
    humanControlledSandboxProviderPilotPlannerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Pilot 计划器已准备", redacted:true } },
    providerKillSwitchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Kill Switch 演练已准备", redacted:true } },
    complianceEvidencePackSummary:{ status:"ready", evidenceSummary:{ missingEvidenceCount:0, hasVerifySummary:true, hasSafetySentinel:true }, userFacingSummary:{ resultLabel:"合规证据包已准备", redacted:true } },
    providerPilotGovernanceViewModelSummary:{ status:"ready", title:"Provider Pilot 治理与合规证据", redacted:true },
    humanApprovalSimulationGateSummary:{ status:"needs_review", userFacingSummary:{ resultLabel:"等待人工最终确认", redacted:true } }
  });
  assert.equal(readyForApproval.consoleStatus, "ready_for_human_approval");
  assert.equal(readyForApproval.humanReviewRequired, true);
  assert.ok(readyForApproval.allowedNextActions.includes("request_final_human_approval"));

  const needsEvidence = api.buildGlobalShoppingProviderGovernanceConsole({
    humanControlledSandboxProviderPilotPlannerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Pilot 计划器已准备", redacted:true } },
    providerKillSwitchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Kill Switch 演练已准备", redacted:true } },
    providerPilotGovernanceViewModelSummary:{ status:"ready", title:"Provider Pilot 治理与合规证据", redacted:true }
  });
  assert.equal(needsEvidence.consoleStatus, "needs_evidence");
  assert.ok(needsEvidence.missingEvidence.includes("compliance_evidence_pack"));
  assert.equal(JSON.stringify(needsEvidence.allowedNextActions), JSON.stringify(["collect_missing_evidence", "human_review_evidence"]));

  const needsReview = api.buildGlobalShoppingProviderGovernanceConsole({
    humanControlledSandboxProviderPilotPlannerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Pilot 计划器已准备", redacted:true } },
    providerKillSwitchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Kill Switch 演练已准备", redacted:true } },
    complianceEvidencePackSummary:{ status:"ready", evidenceSummary:{ missingEvidenceCount:0, hasVerifySummary:true, hasSafetySentinel:true }, userFacingSummary:{ resultLabel:"合规证据包已准备", redacted:true } },
    providerPilotGovernanceViewModelSummary:{ status:"ready", title:"Provider Pilot 治理与合规证据", redacted:true }
  });
  assert.equal(needsReview.consoleStatus, "needs_review");
  assert.equal(needsReview.humanReviewRequired, true);

  const blockedByKillSwitch = api.buildGlobalShoppingProviderGovernanceConsole({
    killSwitchActive:true,
    humanControlledSandboxProviderPilotPlannerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Pilot 计划器已准备", redacted:true } },
    providerKillSwitchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Kill Switch 演练已准备", redacted:true } },
    complianceEvidencePackSummary:{ status:"ready", evidenceSummary:{ missingEvidenceCount:0, hasVerifySummary:true, hasSafetySentinel:true }, userFacingSummary:{ resultLabel:"合规证据包已准备", redacted:true } },
    providerPilotGovernanceViewModelSummary:{ status:"ready", title:"Provider Pilot 治理与合规证据", redacted:true },
    humanApprovalSimulationGateSummary:{ status:"approved", userFacingSummary:{ resultLabel:"人工审批通过", redacted:true } }
  });
  assert.equal(blockedByKillSwitch.consoleStatus, "blocked");
  assert.ok(blockedByKillSwitch.blockedActions.includes("provider_pilot"));
  assert.ok(blockedByKillSwitch.blockedActions.includes("external_handoff"));
  assert.ok(blockedByKillSwitch.blockedActions.includes("checkout"));

  const blockedByRealProvider = api.buildGlobalShoppingProviderGovernanceConsole({
    startRealProvider:true,
    complianceEvidencePackSummary:{ status:"ready", evidenceSummary:{ missingEvidenceCount:0, hasVerifySummary:true, hasSafetySentinel:true }, userFacingSummary:{ resultLabel:"合规证据包已准备", redacted:true } },
    humanApprovalSimulationGateSummary:{ status:"approved", userFacingSummary:{ resultLabel:"人工审批通过", redacted:true } }
  });
  assert.equal(blockedByRealProvider.consoleStatus, "blocked");
  assert.ok(blockedByRealProvider.riskReasons.includes("real_provider_intent_detected"));

  const blockedByExport = api.buildGlobalShoppingProviderGovernanceConsole({
    download:true,
    complianceEvidencePackSummary:{ status:"ready", evidenceSummary:{ missingEvidenceCount:0, hasVerifySummary:true, hasSafetySentinel:true }, userFacingSummary:{ resultLabel:"合规证据包已准备", redacted:true } },
    humanApprovalSimulationGateSummary:{ status:"approved", userFacingSummary:{ resultLabel:"人工审批通过", redacted:true } }
  });
  assert.equal(blockedByExport.consoleStatus, "blocked");

  const blockedByTransaction = api.buildGlobalShoppingProviderGovernanceConsole({
    orderSubmit:true,
    complianceEvidencePackSummary:{ status:"ready", evidenceSummary:{ missingEvidenceCount:0, hasVerifySummary:true, hasSafetySentinel:true }, userFacingSummary:{ resultLabel:"合规证据包已准备", redacted:true } },
    humanApprovalSimulationGateSummary:{ status:"approved", userFacingSummary:{ resultLabel:"人工审批通过", redacted:true } }
  });
  assert.equal(blockedByTransaction.consoleStatus, "blocked");

  const sandboxReady = api.buildGlobalShoppingProviderGovernanceConsole({
    humanControlledSandboxProviderPilotPlannerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Pilot 计划器已准备", redacted:true } },
    providerKillSwitchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Kill Switch 演练已准备", redacted:true } },
    complianceEvidencePackSummary:{ status:"ready", evidenceSummary:{ missingEvidenceCount:0, hasVerifySummary:true, hasSafetySentinel:true }, userFacingSummary:{ resultLabel:"合规证据包已准备", redacted:true } },
    providerPilotGovernanceViewModelSummary:{ status:"ready", title:"Provider Pilot 治理与合规证据", redacted:true },
    humanApprovalSimulationGateSummary:{ status:"approved", userFacingSummary:{ resultLabel:"人工审批通过", redacted:true } },
    humanApprovalGranted:true
  });
  assert.equal(sandboxReady.consoleStatus, "sandbox_ready");
  assert.equal(sandboxReady.sandboxStatus, "sandbox_only");

  const safeJson = JSON.stringify(api.buildGlobalShoppingProviderGovernanceConsole({ token:"abc", secret:"def", bookingUrl:"https://blocked.example" }));
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("def"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);

  console.log("GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_CONSOLE PASS");
}

main();
