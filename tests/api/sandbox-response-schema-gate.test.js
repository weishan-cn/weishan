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

const windowRef = loadRendererCore(["apps/desktop/src/renderer/core/providerSandboxResponseSchemaGate.js"]);
const api = windowRef.WeishanProviderSandboxResponseSchemaGate;

function blockedWith(overrides) {
  const result = api.validateSandboxResponseSchema(api.buildValidSandboxResponse(overrides));
  assert.equal(result.validationDecision, "blocked");
  assert.equal(result.ordinaryResultExposure, "disabled");
  assert.equal(result.priceExposure, "disabled");
  assert.equal(result.availabilityExposure, "disabled");
  assert.equal(result.bookingUrlExposure, "disabled");
  assert.equal(result.rawPayloadExposure, "forbidden");
  assert.equal(api.assertSandboxResponseSchemaGateSafe(result), true);
  return result;
}

function main() {
  assert.equal(api.PROVIDER_SANDBOX_RESPONSE_SCHEMA_GATE_VERSION, "4.0.9");
  const draft = api.buildProviderSandboxResponseSchemaGateDraft();
  assert.equal(draft.status, "schema validation only");
  assert.equal(draft.mode, "console-only");
  assert.equal(draft.schemaVersion, "provider_result_schema_v1");
  assert.equal(draft.requiredFields.includes("providerId"), true);
  assert.equal(draft.forbiddenFields.includes("bookingUrl"), true);

  const valid = api.validateSandboxResponseSchema(api.buildValidSandboxResponse());
  assert.equal(valid.validationDecision, "pass");
  assert.equal(JSON.stringify(valid.missingRequiredFields), "[]");
  assert.equal(JSON.stringify(valid.forbiddenFieldHits), "[]");
  assert.equal(valid.withheldReasons.includes("schema pass is console-only and withheld from ordinary result surface"), true);
  assert.equal(valid.ordinaryResultExposure, "disabled");
  assert.equal(valid.priceExposure, "disabled");
  assert.equal(valid.availabilityExposure, "disabled");
  assert.equal(valid.bookingUrlExposure, "disabled");
  assert.equal(valid.rawPayloadExposure, "forbidden");
  assert.equal(valid.auditDraft.eventType, "SANDBOX_RESPONSE_SCHEMA_GATE_DRAFT");
  for (const key of ["ordinaryResultExposureCount", "priceExposureCount", "availabilityExposureCount", "bookingUrlExposureCount", "rawPayloadExposureCount", "realPriceDisplayedCount", "realProviderCallCount", "networkAttemptCount"]) {
    assert.equal(valid.auditDraft[key], 0);
  }

  for (const field of ["providerId", "providerName", "sourceUrlHost", "updatedAt", "readonlyEvidence"]) {
    const sample = api.buildValidSandboxResponse();
    delete sample[field];
    const blocked = api.validateSandboxResponseSchema(sample);
    assert.equal(blocked.validationDecision, "blocked");
    assert.equal(blocked.missingRequiredFields.includes(field), true);
  }

  assert.equal(blockedWith({ bookingUrl:"https://provider-sandbox.invalid/book" }).forbiddenFieldHits.includes("bookingUrl"), true);
  assert.equal(blockedWith({ paymentUrl:"https://provider-sandbox.invalid/pay" }).forbiddenFieldHits.includes("paymentUrl"), true);
  assert.equal(blockedWith({ orderUrl:"https://provider-sandbox.invalid/order" }).forbiddenFieldHits.includes("orderUrl"), true);
  assert.equal(blockedWith({ rawProviderPayload:{ hidden:true } }).forbiddenFieldHits.includes("rawProviderPayload"), true);
  assert.equal(blockedWith({ authorizationHeader:"Bearer SHOULD_NOT_APPEAR" }).forbiddenFieldHits.includes("authorizationHeader"), true);
  assert.equal(blockedWith({ passengerIdentity:"SHOULD_NOT_APPEAR" }).forbiddenFieldHits.includes("passengerIdentity"), true);

  const pricePresent = api.validateSandboxResponseSchema(api.buildValidSandboxResponse({ price: 1234, availability:"withheld" }));
  assert.equal(pricePresent.validationDecision, "pass");
  assert.equal(pricePresent.priceExposure, "disabled");
  assert.equal(pricePresent.availabilityExposure, "disabled");
  assert.equal(pricePresent.ordinaryResultExposure, "disabled");
  assert.equal(JSON.stringify(pricePresent).includes("SHOULD_NOT_APPEAR"), false);

  console.log("SANDBOX_RESPONSE_SCHEMA_GATE_CORE PASS");
}
main();
