"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");
const {
  HOTELBEDS_EVALUATION_CLASSIFICATION,
  HOTELBEDS_EVALUATION_AVAILABILITY_ENDPOINT,
  HOTELBEDS_CREDENTIAL_DESCRIPTOR,
  createHotelbedsEvaluationReadonlyValidator
} = require(path.join(ROOT, "apps/desktop/src/main/hotelbedsEvaluationReadonlyValidator.js"));

const TEST_API_KEY = "WEISHAN_HOTELBEDS_TEST_IDENTIFIER";
const TEST_API_SECRET = "WEISHAN_HOTELBEDS_TEST_SECRET";

function response(status, payload) {
  return {
    ok:status >= 200 && status < 300,
    status,
    text:async () => JSON.stringify(payload)
  };
}

function credentialStore(overrides = {}) {
  return {
    mainProcess:{
      getProviderCredentialIdentifierForMainProcess(descriptor, identifierType) {
        assert.deepEqual(descriptor, HOTELBEDS_CREDENTIAL_DESCRIPTOR);
        assert.equal(identifierType, "api_key");
        if (overrides.missingIdentifier) return { ok:false, error:"IDENTIFIER_MISSING", redacted:true };
        return { ok:true, value:TEST_API_KEY, metadata:{ valueAvailable:true }, redacted:true };
      },
      async withCredentialBundle(descriptor, types, callback) {
        assert.deepEqual(descriptor, HOTELBEDS_CREDENTIAL_DESCRIPTOR);
        assert.deepEqual(types, ["api_secret"]);
        const value = await callback({ api_secret:TEST_API_SECRET });
        assert.equal(JSON.stringify(value).includes(TEST_API_SECRET), false);
        assert.equal(JSON.stringify(value).includes(TEST_API_KEY), false);
        return { ok:true, value, redacted:true };
      }
    }
  };
}

function hotelbedsResponse() {
  return {
    auditData:{ timestamp:"2026-08-24 10:00:00.000" },
    hotels:{
      hotels:[{
        code:3424,
        name:"As Americas",
        destinationCode:"CEN",
        rooms:[{
          code:"DBL.ST",
          name:"Double Standard",
          rates:[{
            rateKey:"20261010|20261011|W|59|3424|DBL.ST|ID_B2B_26|BB||1~2~0||N",
            rateType:"BOOKABLE",
            boardCode:"BB",
            boardName:"BED AND BREAKFAST",
            paymentType:"AT_WEB",
            net:"230.52",
            currency:"EUR",
            cancellationPolicies:[{ amount:"230.52", from:"2026-10-09T00:00:00+02:00" }]
          }]
        }]
      }]
    }
  };
}

async function main() {
  const requests = [];
  const validator = createHotelbedsEvaluationReadonlyValidator({
    credentialStore:credentialStore(),
    nowSeconds:() => 1790000000,
    nowIso:() => "2026-08-24T10:05:00.000Z",
    fetchImpl:async (url, init) => {
      requests.push({ url, init });
      assert.equal(url, HOTELBEDS_EVALUATION_AVAILABILITY_ENDPOINT);
      assert.equal(init.method, "POST");
      assert.equal(init.headers["Api-key"], TEST_API_KEY);
      assert.equal(typeof init.headers["X-Signature"], "string");
      assert.match(init.headers["X-Signature"], /^[a-f0-9]{64}$/);
      assert.equal(init.headers.Accept, "application/json");
      assert.equal(init.headers["Content-Type"], "application/json");
      const body = JSON.parse(init.body);
      assert.equal(body.occupancies[0].adults, 2);
      assert.equal(body.occupancies[0].children, 0);
      assert.deepEqual(body.hotels.hotel, [3424, 168]);
      return response(200, hotelbedsResponse());
    }
  });

  const result = await validator.validate();
  assert.equal(result.ok, true);
  assert.equal(result.classification, HOTELBEDS_EVALUATION_CLASSIFICATION);
  assert.equal(result.availability, "PASS");
  assert.equal(result.hotelReturned, true);
  assert.equal(result.rateReturned, true);
  assert.equal(result.priceCurrencyReturned, true);
  assert.equal(result.cancellationReturned, true);
  assert.equal(result.evidence.hotel.code, "3424");
  assert.equal(result.evidence.hotel.name, "As Americas");
  assert.equal(result.evidence.room.code, "DBL.ST");
  assert.deepEqual(result.evidence.rate.price, { value:"230.52", currency:"EUR" });
  assert.equal(result.evidence.priceTruth.domain, "HOTEL");
  assert.equal(result.evidence.priceTruth.sourceType, "EVALUATION");
  assert.equal(result.evidence.priceTruth.dataClass, "SANDBOX_TEST_DATA");
  assert.equal(result.evidence.priceTruth.propertyIdentityValidated, true);
  assert.equal(result.evidence.priceTruth.stayContextValidated, true);
  assert.equal(result.evidence.priceTruth.roomRateIdentityValidated, true);
  assert.equal(result.evidence.priceTruth.priceCurrencyValidated, true);
  assert.equal(result.evidence.priceTruth.publicBetaEligible, false);
  assert.equal(result.evidence.priceTruth.productionRate, false);
  assert.equal(result.evidence.realCurrentMarketPrice, false);
  assert.equal(result.evidence.evaluationData, true);
  assert.equal(result.requestCount, 1);
  assert.equal(result.signaturePersisted, false);
  assert.equal(result.rawResponsePersisted, false);
  assert.equal(result.executionGate, "CLOSED");
  assert.equal(result.authorizesExecution, false);
  assert.equal(result.productionTraffic, false);
  assert.equal(result.booking, false);
  assert.equal(result.payment, false);

  const serialized = JSON.stringify(result);
  for (const forbidden of [TEST_API_KEY, TEST_API_SECRET, "X-Signature", "Api-key", "Authorization"]) {
    assert.equal(serialized.includes(forbidden), false, forbidden + " leaked");
  }
  assert.equal(requests.length, 1);

  const missingIdentifier = await createHotelbedsEvaluationReadonlyValidator({
    credentialStore:credentialStore({ missingIdentifier:true }),
    fetchImpl:async () => response(500, {})
  }).validate();
  assert.equal(missingIdentifier.ok, false);
  assert.equal(missingIdentifier.error.code, "IDENTIFIER_MISSING");
  assert.equal(missingIdentifier.requestCount, 0);

  const httpFailure = await createHotelbedsEvaluationReadonlyValidator({
    credentialStore:credentialStore(),
    fetchImpl:async () => response(403, { error:TEST_API_SECRET })
  }).validate();
  assert.equal(httpFailure.ok, false);
  assert.equal(httpFailure.error.code, "HTTP_ERROR");
  assert.equal(httpFailure.error.status, 403);
  assert.equal(httpFailure.requestCount, 1);
  assert.equal(JSON.stringify(httpFailure).includes(TEST_API_SECRET), false);

  const moduleSource = require("node:fs").readFileSync(path.join(ROOT, "apps/desktop/src/main/hotelbedsEvaluationReadonlyValidator.js"), "utf8");
  assert.equal(moduleSource.includes("hotel-api/1.0/bookings"), false);
  assert.equal(moduleSource.includes("hotel-api/1.0/checkrates"), false);
  assert.equal(moduleSource.includes("ipcMain"), false);

  console.log("HOTELBEDS_EVALUATION_READONLY_VALIDATOR PASS requests=1 classification=SANDBOX_TEST_DATA");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
