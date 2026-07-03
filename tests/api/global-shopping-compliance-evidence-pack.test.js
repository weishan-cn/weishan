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
    "apps/desktop/src/renderer/core/globalShoppingProductionBlockerMatrix.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderLegalReviewDossier.js",
    "apps/desktop/src/renderer/core/globalShoppingVaultBoundaryContract.js",
    "apps/desktop/src/renderer/core/globalShoppingComplianceEvidencePack.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingComplianceEvidencePack;
  assert.equal(api.GLOBAL_SHOPPING_COMPLIANCE_EVIDENCE_PACK_VERSION, "4.1.2");

  const ready = api.buildGlobalShoppingComplianceEvidencePack({
    humanControlledSandboxProviderPilotPlannerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Pilot 计划器已准备", redacted:true } },
    providerKillSwitchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Kill Switch 演练已准备", redacted:true } },
    productionBlockerMatrixSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Production 阻断矩阵已准备", redacted:true } },
    legalReviewDossierSummary:{ status:"ready", userFacingSummary:{ resultLabel:"法务审查档案已准备", redacted:true } },
    vaultBoundaryContractSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Vault 边界已准备", redacted:true } },
    safetySentinelSummary:{ status:"pass", redacted:true },
    verifySummary:{ status:"pass", summaryLabel:"验证链摘要已准备", redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.evidenceSummary.readyForHumanAuditReview, true);
  assert.equal(ready.rows.some((item) => item.value.includes("不写文件")), true);

  const needsReview = api.buildGlobalShoppingComplianceEvidencePack({
    humanControlledSandboxProviderPilotPlannerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Pilot 计划器已准备", redacted:true } }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingComplianceEvidencePack({
    humanControlledSandboxProviderPilotPlannerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Pilot 计划器已准备", redacted:true } },
    providerKillSwitchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Kill Switch 演练已准备", redacted:true } },
    productionBlockerMatrixSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Production 阻断矩阵已准备", redacted:true } },
    legalReviewDossierSummary:{ status:"ready", userFacingSummary:{ resultLabel:"法务审查档案已准备", redacted:true } },
    vaultBoundaryContractSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Vault 边界已准备", redacted:true } },
    safetySentinelSummary:{ status:"pass", redacted:true },
    verifySummary:{ status:"pass", summaryLabel:"验证链摘要已准备", redacted:true },
    exportRealFile:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingComplianceEvidencePackAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_COMPLIANCE_EVIDENCE_PACK PASS");
}

main();
