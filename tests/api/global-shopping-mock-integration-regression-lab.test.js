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

function readySummary(title, resultLabel) {
  return { status:"ready", userFacingSummary:{ title, resultLabel, redacted:true }, rows:[{ rowId:"r1", label:title, value:resultLabel, status:"pass", redacted:true }], redacted:true };
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingMockIntegrationRegressionLab.js"]);
  const api = windowRef.WeishanGlobalShoppingMockIntegrationRegressionLab;
  assert.equal(api.GLOBAL_SHOPPING_MOCK_INTEGRATION_REGRESSION_LAB_VERSION, "4.1.8");

  const ready = api.buildGlobalShoppingMockIntegrationRegressionLab({
    offlineProviderCertificationCenterSummary:readySummary("Offline Provider Certification Center", "离线 Provider 认证中心已准备"),
    mockSandboxQaMatrixSummary:readySummary("Mock Sandbox QA Matrix", "Mock Sandbox QA 矩阵已准备"),
    offlineProviderScenarioLabSummary:readySummary("Offline Provider Scenario Lab", "Offline Provider Scenario Lab 已准备"),
    offlineMockSandboxSessionRunnerSummary:readySummary("Offline Mock Sandbox Session Runner", "离线 Mock Sandbox 会话运行器已准备"),
    safetySentinelSummary:{ status:"pass", redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.regressionSummary.readyForHumanApprovalEvidenceBinder, true);

  const needsReview = api.buildGlobalShoppingMockIntegrationRegressionLab({
    offlineProviderCertificationCenterSummary:readySummary("Offline Provider Certification Center", "离线 Provider 认证中心已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingMockIntegrationRegressionLab({
    offlineProviderCertificationCenterSummary:readySummary("Offline Provider Certification Center", "离线 Provider 认证中心已准备"),
    mockSandboxQaMatrixSummary:readySummary("Mock Sandbox QA Matrix", "Mock Sandbox QA 矩阵已准备"),
    offlineProviderScenarioLabSummary:readySummary("Offline Provider Scenario Lab", "Offline Provider Scenario Lab 已准备"),
    offlineMockSandboxSessionRunnerSummary:readySummary("Offline Mock Sandbox Session Runner", "离线 Mock Sandbox 会话运行器已准备"),
    safetySentinelSummary:{ status:"pass", redacted:true },
    persistRawResponse:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(ready.safety.bookingUrl, null);
  assert.equal(ready.safety.paymentUrl, null);
  assert.equal(ready.safety.orderUrl, null);
  assert.equal(ready.safety.checkoutUrl, null);
  assert.equal(ready.safety.secretStored, false);
  assert.equal(ready.safety.rawResponseStored, false);

  console.log("GLOBAL_SHOPPING_MOCK_INTEGRATION_REGRESSION_LAB PASS");
}

main();
