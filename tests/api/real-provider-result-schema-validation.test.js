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

const windowRef = loadRendererCore([
  "apps/desktop/src/renderer/core/providerResultSourceLabelGate.js",
  "apps/desktop/src/renderer/core/realProviderResultSchemaValidation.js"
]);
const api = windowRef.WeishanRealProviderResultSchemaValidation;

function expectBlocked(overrides, hit) {
  const result = api.validateRealProviderResultSchema(api.buildValidRealProviderShapedResult(overrides));
  assert.equal(result.validationDecision, "blocked");
  assert.equal(result.resultDisplayDecision, "blocked");
  if (hit) assert.equal(JSON.stringify(result).includes(hit), true);
  assert.equal(result.ordinaryResultExposure, "disabled");
  assert.equal(result.priceExposure, "disabled");
  assert.equal(result.availabilityExposure, "disabled");
  assert.equal(result.bookingUrlExposure, "disabled");
  assert.equal(result.rawPayloadExposure, "forbidden");
  assert.equal(api.assertRealProviderResultSchemaValidationSafe(result), true);
  return result;
}

function main() {
  assert.equal(api.REAL_PROVIDER_RESULT_SCHEMA_VALIDATION_VERSION, "2.1.34");
  const draft = api.buildRealProviderResultSchemaValidationDraft();
  assert.equal(draft.status, "validation gate only");
  assert.equal(draft.mode, "no ordinary result exposure");
  assert.equal(draft.realProviderResultDisplay, "disabled");
  assert.equal(draft.realPriceDisplay, "disabled");
  assert.equal(draft.bookingUrlDisplay, "disabled");
  assert.equal(draft.rawProviderPayloadDisplay, "forbidden");

  const valid = api.validateRealProviderResultSchema(api.buildValidRealProviderShapedResult());
  assert.equal(valid.validationDecision, "withheld");
  assert.equal(valid.resultDisplayDecision, "withheld");
  assert.equal(valid.sourceLabelValidation, "pass");
  assert.equal(valid.withheldReasons.includes("validated result is console-only"), true);
  assert.equal(valid.ordinaryResultExposure, "disabled");
  assert.equal(valid.priceExposure, "disabled");
  assert.equal(valid.availabilityExposure, "disabled");
  assert.equal(valid.bookingUrlExposure, "disabled");
  assert.equal(valid.auditDraft.eventType, "REAL_PROVIDER_RESULT_SCHEMA_VALIDATION_DRAFT");
  for (const key of ["ordinaryResultExposureCount", "priceExposureCount", "availabilityExposureCount", "bookingUrlExposureCount", "rawPayloadExposureCount", "realPriceDisplayedCount", "rawProviderPayloadDisplayedCount", "paymentAttemptCount", "orderAttemptCount", "identityUploadAttemptCount"]) {
    assert.equal(valid.auditDraft[key], 0);
  }

  for (const field of ["providerId", "providerName", "providerCategory", "sourceUrlHost", "updatedAt", "readonlyEvidence"]) {
    const sample = api.buildValidRealProviderShapedResult();
    delete sample[field];
    const blocked = api.validateRealProviderResultSchema(sample);
    assert.equal(blocked.validationDecision, "blocked");
    assert.equal(blocked.missingRequiredFields.includes(field), true);
  }

  assert.equal(expectBlocked({ bookingUrl:"https://provider-sandbox.invalid/book" }).forbiddenFieldHits.includes("bookingUrl"), true);
  assert.equal(expectBlocked({ checkoutUrl:"https://provider-sandbox.invalid/checkout" }).forbiddenFieldHits.includes("checkoutUrl"), true);
  assert.equal(expectBlocked({ paymentUrl:"https://provider-sandbox.invalid/pay" }).forbiddenFieldHits.includes("paymentUrl"), true);
  assert.equal(expectBlocked({ orderUrl:"https://provider-sandbox.invalid/order" }).forbiddenFieldHits.includes("orderUrl"), true);
  assert.equal(expectBlocked({ rawProviderPayload:{ hidden:true } }).forbiddenFieldHits.includes("rawProviderPayload"), true);
  assert.equal(expectBlocked({ rawHeaders:{ authorization:"Bearer SHOULD_NOT_APPEAR" } }).forbiddenFieldHits.includes("rawHeaders"), true);
  assert.equal(expectBlocked({ rawToken:"SHOULD_NOT_APPEAR" }).forbiddenFieldHits.includes("rawToken"), true);
  assert.equal(expectBlocked({ passengerIdentity:"SHOULD_NOT_APPEAR" }).forbiddenFieldHits.includes("passengerIdentity"), true);
  assert.equal(expectBlocked({ paymentToken:"SHOULD_NOT_APPEAR" }).forbiddenFieldHits.includes("paymentToken"), true);
  assert.equal(expectBlocked({ title:"fake price 999" }).blockedReasons.includes("fake/mock/demo/AI price blocked"), true);
  assert.equal(expectBlocked({ title:"mock price 999" }).blockedReasons.includes("fake/mock/demo/AI price blocked"), true);
  assert.equal(expectBlocked({ title:"demo price 999" }).blockedReasons.includes("fake/mock/demo/AI price blocked"), true);
  assert.equal(expectBlocked({ title:"AI estimated price 999" }).blockedReasons.includes("fake/mock/demo/AI price blocked"), true);
  assert.equal(JSON.stringify(valid).includes("SHOULD_NOT_APPEAR"), false);

  console.log("REAL_PROVIDER_RESULT_SCHEMA_VALIDATION_CORE PASS");
}
main();
