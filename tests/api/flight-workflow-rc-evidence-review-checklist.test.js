const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowRcEvidenceReviewChecklist.js"]);
  const api = windowRef.WeishanFlightWorkflowRcEvidenceReviewChecklist;
  assert.equal(api.FLIGHT_WORKFLOW_RC_EVIDENCE_REVIEW_CHECKLIST_VERSION, "2.1.97");
  const ready = api.buildFlightWorkflowRcEvidenceReviewChecklist({
    freezeGateSummary:{ status:"ready_to_freeze", freezeDecision:{ safeToFreeze:true }, blockedReasons:["none"], redacted:true },
    evidenceFreezePackSummary:{ status:"ready", rows:[{ rowId:"e1", label:"证据", value:"ready", status:"pass", redacted:true }], redacted:true },
    releaseReadinessSummary:{ status:"ready", redacted:true },
    launchCandidateReadinessSummary:{ status:"ready", redacted:true },
    pilotExitCriteriaSummary:{ status:"met", redacted:true }
  });
  assert.equal(ready.status, "complete");
  assert.equal(ready.userFacingSummary.resultLabel, "证据完整");
  assert.equal(ready.safety.download, false);
  const blocked = api.buildFlightWorkflowRcEvidenceReviewChecklist({ rawResponseStored:true });
  assert.equal(blocked.status, "blocked");
  const audit = api.buildFlightWorkflowRcEvidenceReviewChecklistAuditDraft({ token:"abc" });
  assert.equal(audit.eventType, "FLIGHT_WORKFLOW_RC_EVIDENCE_REVIEW_CHECKLIST_AUDIT_DRAFT");
  assert.equal(JSON.stringify(audit).includes("abc"), false);
  console.log("FLIGHT_WORKFLOW_RC_EVIDENCE_REVIEW_CHECKLIST PASS");
}
main();
