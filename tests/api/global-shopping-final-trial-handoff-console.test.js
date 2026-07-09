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

function summary(title, status, extra) {
  return Object.assign({
    status:status || "manual_review_required",
    title,
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : status === "needs_review" ? " 仍需复核" : " 需人工复核"), redacted:true },
    rows:[{ rowId:title, label:title, value:title, status:status === "blocked" ? "blocked" : "warning", redacted:true }],
    redacted:true
  }, extra || {});
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingFinalTrialHandoffConsole.js"]);
  const api = windowRef.WeishanGlobalShoppingFinalTrialHandoffConsole;
  assert.equal(api.GLOBAL_SHOPPING_FINAL_TRIAL_HANDOFF_CONSOLE_VERSION, "4.2.7");

  const good = api.buildGlobalShoppingFinalTrialHandoffConsole({
    publicBetaCandidateLockSummary:summary("Public Beta Candidate Lock", "manual_review_required", { candidateLockStatus:"manual_review_required" }),
    manualNextPhaseDossierSummary:summary("Manual Next-Phase Dossier", "manual_review_required", { dossierStatus:"manual_review_required" }),
    manualLaunchHandoffPackSummary:summary("Manual Launch Handoff Pack", "ready"),
    publicBetaStabilityAuditSummary:summary("Public Beta Stability Audit", "ready"),
    publicBetaClosureEvidenceArchiveSummary:summary("Public Beta Closure Evidence Archive", "manual_review_required", { archiveStatus:"manual_review_required" })
  });
  assert.equal(good.handoffStatus, "manual_review_required");
  assert.equal(good.nextManualAction, "manual_review_required");
  assert.equal(good.manualReviewRequired, true);
  assert.equal(good.handoffSummary, "最终试用交接仅为只读摘要，不生成文件");
  assert.equal(good.externalUrl, null);
  assert.equal(good.buyButtonEnabled, false);

  const review = api.buildGlobalShoppingFinalTrialHandoffConsole({
    publicBetaCandidateLockSummary:summary("Public Beta Candidate Lock", "needs_review", { candidateLockStatus:"needs_review" })
  });
  assert.equal(review.handoffStatus, "needs_review");

  const blocked = api.buildGlobalShoppingFinalTrialHandoffConsole({
    publicBetaCandidateLockSummary:summary("Public Beta Candidate Lock", "manual_review_required", { candidateLockStatus:"manual_review_required" }),
    manualNextPhaseDossierSummary:summary("Manual Next-Phase Dossier", "manual_review_required", { dossierStatus:"manual_review_required" }),
    manualLaunchHandoffPackSummary:summary("Manual Launch Handoff Pack", "ready"),
    publicBetaStabilityAuditSummary:summary("Public Beta Stability Audit", "ready"),
    publicBetaClosureEvidenceArchiveSummary:summary("Public Beta Closure Evidence Archive", "manual_review_required", { archiveStatus:"manual_review_required" }),
    uploadEnabled:true
  });
  assert.equal(blocked.handoffStatus, "blocked");
  assert.equal(blocked.blockedCapabilities.includes("upload"), true);
  console.log("GLOBAL_SHOPPING_FINAL_TRIAL_HANDOFF_CONSOLE PASS");
}

main();
