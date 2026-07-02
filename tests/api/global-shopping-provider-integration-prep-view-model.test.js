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
    "apps/desktop/src/renderer/core/globalShoppingProviderLegalReviewDossier.js",
    "apps/desktop/src/renderer/core/globalShoppingCredentialVaultInterfaceStub.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxAdapterContractTestbed.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderIntegrationPrepViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderIntegrationPrepViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_INTEGRATION_PREP_VIEW_MODEL_VERSION, "3.9.0");
  const ready = api.buildGlobalShoppingProviderIntegrationPrepViewModel({
    providerLegalReviewDossierSummary:{ status:"ready", userFacingSummary:{ resultLabel:"法务审查档案已准备", redacted:true }, rows:[{ rowId:"legal", label:"法务审查", value:"已准备", status:"pass", redacted:true }] },
    credentialVaultInterfaceStubSummary:{ status:"ready", userFacingSummary:{ resultLabel:"凭证接口桩已准备", redacted:true }, rows:[{ rowId:"vault", label:"凭证接口桩", value:"已准备", status:"pass", redacted:true }] },
    sandboxAdapterContractTestbedSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Adapter 合同测试台已准备", redacted:true }, rows:[{ rowId:"contract", label:"Adapter 合同测试", value:"已准备", status:"pass", redacted:true }] }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider 接入前准备");
  assert.equal(ready.cards.length, 4);
  assert.equal(ready.legalReviewRows[0].label, "法务审查");
  assert.equal(ready.credentialVaultRows[0].label, "凭证接口桩");
  assert.equal(ready.adapterContractRows[0].label, "Adapter 合同测试");
  assert.equal(ready.disclosureRows.some((row) => row.value.includes("不接真实 provider")), true);
  const needsReview = api.buildGlobalShoppingProviderIntegrationPrepViewModel({
    providerLegalReviewDossierSummary:{ status:"needs_review", userFacingSummary:{ resultLabel:"法务审查仍需复核", redacted:true } }
  });
  assert.equal(needsReview.status, "needs_review");
  const blocked = api.buildGlobalShoppingProviderIntegrationPrepViewModel({
    providerLegalReviewDossierSummary:{ status:"ready", userFacingSummary:{ resultLabel:"法务审查档案已准备", redacted:true } },
    credentialVaultInterfaceStubSummary:{ status:"ready", userFacingSummary:{ resultLabel:"凭证接口桩已准备", redacted:true } },
    sandboxAdapterContractTestbedSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Adapter 合同测试台已准备", redacted:true } },
    readRealApiKey:true
  });
  assert.equal(blocked.status, "blocked");
  const audit = api.buildGlobalShoppingProviderIntegrationPrepViewModelAuditDraft({ bookingUrl:"https://blocked.example" });
  assert.equal(JSON.stringify(audit).includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_INTEGRATION_PREP_VIEW_MODEL PASS");
}

main();
