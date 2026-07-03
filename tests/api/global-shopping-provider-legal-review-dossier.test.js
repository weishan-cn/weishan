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
    "apps/desktop/src/renderer/core/globalShoppingProviderContractSelectionBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySandboxProviderIntegrationBlueprint.js",
    "apps/desktop/src/renderer/core/globalShoppingNextFeatureReadinessGate.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderLegalReviewDossier.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderLegalReviewDossier;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_LEGAL_REVIEW_DOSSIER_VERSION, "4.1.3");
  const ready = api.buildGlobalShoppingProviderLegalReviewDossier({
    providerContractSelectionBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 合同/授权选择板已准备", redacted:true } },
    readOnlySandboxProviderIntegrationBlueprintSummary:{ status:"ready", userFacingSummary:{ resultLabel:"接入蓝图已准备", redacted:true } },
    nextFeatureReadinessGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"下一功能准备闸门已准备", redacted:true } }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.dossierName, "global_shopping_provider_legal_review_dossier_v1");
  assert.equal(ready.userFacingSummary.title, "Provider 法务审查档案");
  assert.equal(ready.legalBoundary.reviewOnly, true);
  assert.equal(ready.legalBoundary.canClaimPartnership, false);
  assert.equal(ready.legalSummary.requirementCount, 11);
  assert.equal(ready.legalReviewSections.some((item) => item.title === "合作/授权/官方背书声明边界"), true);
  assert.equal(ready.rows.some((row) => row.label === "人工审批"), true);
  const isolatedApi = load([
    "apps/desktop/src/renderer/core/globalShoppingProviderLegalReviewDossier.js"
  ]).WeishanGlobalShoppingProviderLegalReviewDossier;
  const needsReview = isolatedApi.buildGlobalShoppingProviderLegalReviewDossier({});
  assert.equal(needsReview.status, "needs_review");
  const blocked = api.buildGlobalShoppingProviderLegalReviewDossier({ claimAuthorization:true });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blockedReasons.includes("authorization_claim_detected"), true);
  const audit = api.buildGlobalShoppingProviderLegalReviewDossierAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" });
  const safeJson = JSON.stringify(audit);
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_LEGAL_REVIEW_DOSSIER PASS");
}

main();
