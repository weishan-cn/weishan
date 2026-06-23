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

function ranking(url) {
  return {
    topCandidates:[{
      rank:1,
      quoteId:"q1",
      providerName:"Trusted Flight Fixture",
      providerMode:"sandbox_read_only",
      fareSource:"sandbox_read_only_import",
      currency:"CNY",
      totalPrice:980,
      safeProviderHandoffReady:!!url,
      safeProviderHandoffUrl:url || null,
      safeProviderHandoffDisplayHost:url ? "google.com" : "",
      bookingUrl:null,
      payment:false,
      order:false,
      identityUpload:false,
      redacted:true
    }]
  };
}

function assertNoUnsafe(model) {
  assert.equal(model.safeProviderHandoff.requiresConfirmation, true);
  assert.equal(model.safeProviderHandoff.autoOpen, false);
  assert.equal(model.safeProviderHandoff.bookingUrl, null);
  assert.equal(model.safeProviderHandoff.checkoutUrl, null);
  assert.equal(model.safeProviderHandoff.paymentUrl, null);
  assert.equal(model.safeProviderHandoff.orderUrl, null);
  assert.equal(model.safeProviderHandoff.payment, false);
  assert.equal(model.safeProviderHandoff.order, false);
  assert.equal(model.safeProviderHandoff.identityUpload, false);
  assert.equal(model.redacted, true);
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/readOnlyQuoteCandidateSelection.js"]);
  const api = windowRef.WeishanReadOnlyQuoteCandidateSelection;
  assert.equal(api.READ_ONLY_QUOTE_CANDIDATE_SELECTION_VERSION, "2.1.63");

  const selected = api.selectReadOnlyQuoteCandidate(ranking("https://www.google.com/travel/flights"), "q1");
  assert.equal(selected.selected, true);
  assert.equal(selected.selectedQuoteId, "q1");
  assert.equal(selected.selectedRank, 1);
  assert.equal(selected.selectedCandidate.totalPrice, 980);
  assert.equal(selected.safeProviderHandoff.ready, true);
  assert.equal(selected.safeProviderHandoff.buttonDisabled, false);
  assertNoUnsafe(selected);

  const missingHandoff = api.selectReadOnlyQuoteCandidate(ranking(null), "q1");
  assert.equal(missingHandoff.selected, true);
  assert.equal(missingHandoff.safeProviderHandoff.ready, false);
  assert.equal(missingHandoff.safeProviderHandoff.buttonDisabled, true);
  assertNoUnsafe(missingHandoff);

  const invalid = api.selectReadOnlyQuoteCandidate(ranking(null), "missing");
  assert.equal(invalid.selected, false);
  assert.equal(invalid.status, "rejected");
  assert.equal(invalid.safeProviderHandoff.buttonDisabled, true);
  assertNoUnsafe(invalid);

  const viewModel = api.buildSelectedReadOnlyQuoteCandidateViewModel(selected);
  assert.equal(viewModel.bookingUrl, null);
  assert.equal(viewModel.checkoutUrl, null);
  assert.equal(viewModel.paymentUrl, null);
  assert.equal(viewModel.orderUrl, null);
  assert.equal(viewModel.payment, false);
  assert.equal(viewModel.order, false);
  assert.equal(viewModel.identityUpload, false);
  assert.equal(viewModel.autoOpen, false);
  console.log("READ_ONLY_QUOTE_CANDIDATE_SELECTION PASS");
}

main();
