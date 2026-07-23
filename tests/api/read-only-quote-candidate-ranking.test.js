const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

function quote(id, totalPrice, freshnessMinutes, providerFees, extra = {}) {
  return Object.assign({
    quoteId:id,
    providerName:"Trusted Flight Fixture",
    providerMode:"sandbox_read_only",
    fareSource:"sandbox_read_only_import",
    currency:"CNY",
    baseFare:totalPrice - providerFees - 100,
    taxesAndFees:100,
    providerFees,
    totalPrice,
    freshnessMinutes,
    taxFeeIntegrityStatus:"complete",
    safeProviderHandoffReady:true,
    safeProviderHandoffUrl:"https://www.google.com/travel/flights",
    bookingUrl:null,
    payment:false,
    order:false,
    identityUpload:false,
    redacted:true
  }, extra);
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/readOnlyQuoteCandidateRanking.js"]);
  const api = windowRef.WeishanReadOnlyQuoteCandidateRanking;
  assert.equal(api.READ_ONLY_QUOTE_CANDIDATE_RANKING_VERSION, "4.2.8");

  const ranking = api.buildTopReadOnlyQuoteCandidates([
    quote("q-high", 1200, 3, 20),
    quote("q-low", 980, 20, 40),
    quote("q-mid", 1010, 10, 30),
    quote("q-fourth", 1300, 1, 10)
  ]);
  assert.equal(ranking.rankingScope, "imported_sandbox_quotes_only");
  assert.equal(ranking.claim, "当前导入样本中的低价候选");
  assert.equal(ranking.canClaimLowestAcrossWeb, false);
  assert.equal(ranking.canClaimFinalBookablePrice, false);
  assert.equal(ranking.canReplaceMainResultCard, false);
  assert.equal(JSON.stringify(ranking.topCandidates.map((item) => item.quoteId)), JSON.stringify(["q-low", "q-mid", "q-high"]));
  assert.equal(ranking.topCandidates.length, 3);
  assert.equal(ranking.topCandidates[0].bookingUrl, null);

  const freshnessTie = api.buildTopReadOnlyQuoteCandidates([
    quote("fresh-20", 1000, 20, 30),
    quote("fresh-5", 1000, 5, 30)
  ]);
  assert.equal(JSON.stringify(freshnessTie.topCandidates.map((item) => item.quoteId)), JSON.stringify(["fresh-5", "fresh-20"]));

  const feeTie = api.buildTopReadOnlyQuoteCandidates([
    quote("fee-40", 1000, 5, 40),
    quote("fee-10", 1000, 5, 10)
  ]);
  assert.equal(JSON.stringify(feeTie.topCandidates.map((item) => item.quoteId)), JSON.stringify(["fee-10", "fee-40"]));

  const filtered = api.buildTopReadOnlyQuoteCandidates([
    quote("valid", 1000, 5, 10),
    quote("blocked", 900, 1, 1, { redacted:false }),
    quote("unsafe", 800, 1, 1, { bookingUrl:"https://example.com/booking" })
  ]);
  assert.equal(JSON.stringify(filtered.topCandidates.map((item) => item.quoteId)), JSON.stringify(["valid"]));
  assert.equal(JSON.stringify(ranking).includes("全网最低"), false);
  console.log("READ_ONLY_QUOTE_CANDIDATE_RANKING PASS");
}

main();
