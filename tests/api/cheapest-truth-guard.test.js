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
  const windowRef = load([
    "apps/desktop/src/renderer/core/flightFareBreakdown.js",
    "apps/desktop/src/renderer/core/cheapestTruthGuard.js"
  ]);
  const fareApi = windowRef.WeishanFlightFareBreakdown;
  const api = windowRef.WeishanCheapestTruthGuard;
  assert.equal(api.CHEAPEST_TRUTH_GUARD_VERSION, "4.0.7");

  const limitedBeta = api.decideCheapestTruth({
    fareBreakdown:fareApi.normalizeFlightFareBreakdown({
      totalPayable:1010,
      taxFeeCompleteness:"partial",
      providerPriceType:"limited_beta_price"
    }),
    providerSourceType:"limited_beta_price",
    sourceLabelDecision:"pass",
    priceIntegrityDecision:"pass",
    resultSchemaDecision:"pass",
    manualReviewDecision:"draft"
  });
  assert.equal(limitedBeta.canClaimCheapest, false);
  assert.equal(limitedBeta.canParticipateInCheapestRanking, false);
  assert.match(limitedBeta.blockedReason, /limited_beta_price_not_production/);
  assert.match(limitedBeta.userFacingTruthLabel, /不代表真实最低价/);
  assert.equal(api.assertCheapestTruthGuardSafe(limitedBeta), true);

  const production = api.decideCheapestTruth({
    fareBreakdown:fareApi.normalizeFlightFareBreakdown({
      totalPayable:900,
      taxFeeCompleteness:"complete",
      providerPriceType:"production_price"
    }),
    providerSourceType:"production_price",
    sourceLabelDecision:"pass",
    priceIntegrityDecision:"pass",
    resultSchemaDecision:"pass",
    manualReviewDecision:"approved",
    card:{ providerName:"Trusted Airline", updatedAt:"2026-06-20T00:00:00.000Z" }
  });
  assert.equal(production.canClaimCheapest, true);
  assert.equal(production.canParticipateInCheapestRanking, true);
  assert.equal(production.userFacingTruthLabel, "生产真实最低价候选");
  assert.equal(api.assertCheapestTruthGuardSafe(production), true);

  const incomplete = api.decideCheapestTruth({
    fareBreakdown:fareApi.normalizeFlightFareBreakdown({
      totalPayable:800,
      taxFeeCompleteness:"partial",
      providerPriceType:"production_price"
    }),
    providerSourceType:"production_price",
    sourceLabelDecision:"pass",
    priceIntegrityDecision:"pass",
    resultSchemaDecision:"pass",
    manualReviewDecision:"approved",
    card:{ providerName:"Trusted Airline", updatedAt:"2026-06-20T00:00:00.000Z" }
  });
  assert.equal(incomplete.canClaimCheapest, false);
  assert.equal(incomplete.canParticipateInCheapestRanking, false);
  assert.equal(incomplete.blockedReason, "incomplete_tax_fee");
  assert.equal(api.assertCheapestTruthGuardSafe(incomplete), true);

  const audit = api.buildCheapestTruthGuardAuditDraft(limitedBeta);
  assert.equal(audit.eventType, "CHEAPEST_TRUTH_GUARD_DRAFT");
  assert.equal(audit.redacted, true);

  console.log("CHEAPEST_TRUTH_GUARD_CORE PASS");
}

main();
