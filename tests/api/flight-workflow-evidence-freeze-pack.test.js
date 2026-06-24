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
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowEvidenceFreezePack.js"]);
  const api = windowRef.WeishanFlightWorkflowEvidenceFreezePack;
  assert.equal(api.FLIGHT_WORKFLOW_EVIDENCE_FREEZE_PACK_VERSION, "2.1.84");
  const pack = api.buildFlightWorkflowEvidenceFreezePack({
    releaseReadinessSummary:{ status:"ready", safeForUserFacingBeta:true },
    launchCandidateReadinessSummary:{ status:"ready", launchCandidateReadiness:{ safeForReadOnlyLaunchCandidate:true } },
    safetyRegressionSummary:{ status:"pass" },
    operatorConsoleSummary:{ status:"ready" },
    pilotOpsSummary:{ status:"healthy" },
    supportReadinessSummary:{ status:"ready" }
  });
  assert.equal(pack.status, "ready");
  assert.equal(pack.safeToFreeze, true);
  assert.equal(pack.userFacingSummary.resultLabel, "证据冻结包已就绪");
  assert.equal(pack.freezePackNextStep, "可以冻结证据包");
  assert.equal(pack.canWriteFile, false);
  assert.equal(pack.canDownload, false);
  const audit = api.buildFlightWorkflowEvidenceFreezePackAuditDraft({ releaseReadinessSummary:{ status:"ready", safeForUserFacingBeta:true }, launchCandidateReadinessSummary:{ status:"ready", launchCandidateReadiness:{ safeForReadOnlyLaunchCandidate:true } }, safetyRegressionSummary:{ status:"pass" }, operatorConsoleSummary:{ status:"ready" }, pilotOpsSummary:{ status:"healthy" }, supportReadinessSummary:{ status:"ready" } });
  assert.equal(audit.eventType, "FLIGHT_WORKFLOW_EVIDENCE_FREEZE_PACK_AUDIT_DRAFT");
  assert.equal(audit.status, "ready");
  assert.equal(audit.safeToFreeze, true);
  assert.equal(audit.fileWrite, false);
  assert.equal(audit.download, false);
  assert.equal(audit.secretStored, false);
  console.log("FLIGHT_WORKFLOW_EVIDENCE_FREEZE_PACK PASS");
}

main();
