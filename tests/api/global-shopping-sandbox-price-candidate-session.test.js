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
    "apps/desktop/src/renderer/core/globalShoppingSandboxPriceCandidateSession.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingSandboxPriceCandidateSession;
  assert.equal(api.GLOBAL_SHOPPING_SANDBOX_PRICE_CANDIDATE_SESSION_VERSION, "4.0.9");

  const ready = api.buildGlobalShoppingSandboxPriceCandidateSession({
    readOnlyProviderSandboxIntegrationGateSummary:{ status:"ready", redacted:true },
    firstSandboxProviderConnectorSummary:{ status:"ready", connectorResult:{ officialSourceCount:1 }, redacted:true },
    providerCoverageDashboardSummary:{ status:"ready", redacted:true },
    readOnlySourceTrustScoreSummary:{ status:"ready", redacted:true },
    pricePipelineOrchestratorSummary:{ status:"ready", officialPriceAnchorSummary:{ status:"anchored", redacted:true }, redacted:true },
    coveredLowestCandidateBoardSummary:{ status:"ready", redacted:true },
    jumpToPlatformHandoffPreviewSummary:{ status:"ready", redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Sandbox 价格候选会话");
  assert.equal(ready.userFacingSummary.resultLabel, "Sandbox 价格候选会话已准备");

  const review = api.buildGlobalShoppingSandboxPriceCandidateSession({
    readOnlyProviderSandboxIntegrationGateSummary:{ status:"needs_review", redacted:true }
  });
  assert.equal(review.status, "needs_review");

  const blocked = api.buildGlobalShoppingSandboxPriceCandidateSession({
    readOnlyProviderSandboxIntegrationGateSummary:{ status:"ready", redacted:true },
    payment:true
  });
  assert.equal(blocked.status, "blocked");
  assert.ok(blocked.blockedReasons.includes("payment_detected"));

  const safeJson = JSON.stringify(ready);
  assert.equal(/https?:\/\/|"(token|secret|key)":"[^"]+"/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_SANDBOX_PRICE_CANDIDATE_SESSION PASS");
}

main();
