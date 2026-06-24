const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
function loadRendererCore(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

const windowRef = loadRendererCore(["apps/desktop/src/renderer/core/providerResultSourceLabelGate.js"]);
const api = windowRef.WeishanProviderResultSourceLabelGate;

function expectBlocked(overrides, reason) {
  const result = api.validateProviderResultSourceLabel(api.buildValidSandboxSourceLabel(overrides));
  assert.equal(result.validationDecision, "blocked");
  if (reason) assert.equal(result.blockedReasons.includes(reason), true);
  assert.equal(result.redacted, true);
  assert.equal(api.assertProviderResultSourceLabelGateSafe(result), true);
  return result;
}

function main() {
  assert.equal(api.PROVIDER_RESULT_SOURCE_LABEL_GATE_VERSION, "2.1.78");
  const draft = api.buildProviderResultSourceLabelGateDraft();
  assert.equal(draft.status, "source label validation only");
  assert.equal(draft.mode, "required before display");
  assert.equal(draft.sourceLabelRequired, true);
  assert.equal(draft.unknownSource, "blocked");
  assert.equal(draft.shortUrl, "blocked");
  assert.equal(draft.credentialParams, "blocked");
  assert.equal(draft.rawAiEstimate, "blocked");
  assert.equal(draft.publicSearchMasquerade, "blocked");
  assert.equal(draft.requiredFields.includes("providerId"), true);
  assert.equal(draft.allowedSourceType.includes("sandbox_provider"), true);
  assert.equal(draft.blockedSourceType.includes("public_search_result_as_provider"), true);

  const valid = api.validateProviderResultSourceLabel(api.buildValidSandboxSourceLabel());
  assert.equal(valid.validationDecision, "pass");
  assert.equal(valid.sourceTrustState, "sandbox_verified");
  assert.equal(valid.sourceUrlHost, "provider-sandbox.invalid");
  assert.equal(valid.auditDraft.eventType, "PROVIDER_RESULT_SOURCE_LABEL_GATE_DRAFT");
  assert.equal(valid.auditDraft.unknownSourceBlockedCount, 0);
  assert.equal(valid.auditDraft.shortUrlBlockedCount, 0);
  assert.equal(valid.auditDraft.credentialParamBlockedCount, 0);
  assert.equal(valid.auditDraft.rawAiEstimateBlockedCount, 0);
  assert.equal(valid.auditDraft.publicSearchMasqueradeBlockedCount, 0);
  assert.equal(valid.auditDraft.redacted, true);

  for (const field of ["providerId", "providerName", "sourceUrlHost", "updatedAt", "readonlyEvidence"]) {
    const sample = api.buildValidSandboxSourceLabel();
    delete sample[field];
    const blocked = api.validateProviderResultSourceLabel(sample);
    assert.equal(blocked.validationDecision, "blocked");
    assert.equal(blocked.blockedReasons.includes("missing " + field), true);
  }

  expectBlocked({ sourceUrlHost:"unknown.example.com" }, "unknown host");
  expectBlocked({ sourceUrlHost:"bit.ly" }, "short URL blocked");
  expectBlocked({ sourceUrl:"https://provider-sandbox.invalid/result?apiKey=SHOULD_NOT_APPEAR" }, "credential params blocked");
  expectBlocked({ sourceType:"raw_ai_estimate" }, "raw AI estimate blocked");
  expectBlocked({ sourceType:"public_search_result_as_provider" }, "public search result cannot masquerade as provider result");
  expectBlocked({ sourceTrustState:"blocked" }, "sourceTrustState blocked");
  const credential = expectBlocked({ credentialQueryParams:"token=SHOULD_NOT_APPEAR" }, "credential params blocked");
  assert.equal(credential.auditDraft.credentialParamBlockedCount, 1);
  assert.equal(JSON.stringify(credential).includes("SHOULD_NOT_APPEAR"), false);

  console.log("PROVIDER_RESULT_SOURCE_LABEL_GATE_CORE PASS");
}
main();
