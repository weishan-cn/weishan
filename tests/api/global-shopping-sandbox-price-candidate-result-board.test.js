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
    "apps/desktop/src/renderer/core/globalShoppingSandboxPriceCandidateResultBoard.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingSandboxPriceCandidateResultBoard;
  assert.equal(api.GLOBAL_SHOPPING_SANDBOX_PRICE_CANDIDATE_RESULT_BOARD_VERSION, "3.7.0");

  const ready = api.buildGlobalShoppingSandboxPriceCandidateResultBoard({
    sandboxPriceCandidateSessionSummary:{ status:"ready", sessionSummary:{ officialSourceCount:1, authorizedSourceCount:0, partnerSourceCount:0, affiliateSourceCount:0, aggregatorSourceCount:0, fixtureSourceCount:1, hasCoveredLowestCandidate:true, providerConnectorReady:true, coverageReady:true, sourceTrustReady:true, pricePipelineReady:true }, sessionBoundary:{ sessionMode:"sandbox_ready" }, redacted:true },
    officialPriceAnchorSummary:{ status:"anchored", redacted:true },
    coveredLowestCandidateBoardSummary:{ status:"ready", redacted:true },
    readOnlySourceTrustScoreSummary:{ status:"ready", userFacingSummary:{ resultLabel:"来源可信度已准备", redacted:true }, redacted:true },
    jumpToPlatformHandoffPreviewSummary:{ status:"ready", userFacingSummary:{ resultLabel:"跳转预览已准备", redacted:true }, redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Sandbox 价格候选结果");
  assert.equal(ready.caveat, "当前仅展示只读 sandbox 候选结果，不代表真实价格、全网最低、最低价保证、锁价、可订、付款、下单或出票能力。");

  const review = api.buildGlobalShoppingSandboxPriceCandidateResultBoard({
    sandboxPriceCandidateSessionSummary:{ status:"needs_review", redacted:true }
  });
  assert.equal(review.status, "needs_review");

  const blocked = api.buildGlobalShoppingSandboxPriceCandidateResultBoard({
    sandboxPriceCandidateSessionSummary:{ status:"ready", redacted:true },
    line:"立即购买"
  });
  assert.equal(blocked.status, "blocked");

  const safeJson = JSON.stringify(ready);
  assert.equal(/https?:\/\/|"(token|secret|key)":"[^"]+"/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_SANDBOX_PRICE_CANDIDATE_RESULT_BOARD PASS");
}

main();
