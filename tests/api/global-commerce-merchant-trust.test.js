const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const windowRef = {};
windowRef.window = windowRef;
const context = vm.createContext({ window:windowRef });
["globalCommerceInputGuard.js", "globalCommerceMerchantTrust.js"].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../../apps/desktop/src/renderer/core", file), "utf8"), context);
});
const trust = windowRef.WeishanGlobalCommerceMerchantTrust;
const official = {
  merchantId:"official-demo",
  merchantType:"OFFICIAL",
  official:true,
  authorized:false,
  marketplace:false,
  individual:false,
  verified:true,
  rating:4.5,
  reviewCount:100,
  fraudRisk:"LOW",
  evidence:[
    { type:"OFFICIAL_DECLARATION", value:true, confidence:"HIGH" },
    { type:"PLATFORM_VERIFICATION", value:"declared", confidence:"MEDIUM" }
  ]
};
const first = trust.createMerchantTrustSnapshot(official);
assert.equal(first.success, true);
assert.equal(first.snapshot.trustConfidence, "HIGH");
assert.equal(first.snapshot.trustScore, 89);
assert.equal(first.snapshot.trusted, true);
assert.deepEqual(JSON.parse(JSON.stringify(trust.createMerchantTrustSnapshot({ merchantId:"unknown", merchantType:"UNKNOWN" }).snapshot)), {
  merchantId:"unknown", merchantType:"UNKNOWN", official:false, authorized:false, marketplace:false, individual:false, verified:false, rating:null, reviewCount:0, fraudRisk:"UNKNOWN", evidence:[], trustConfidence:"UNKNOWN", trustScore:0, trusted:false, reasonCodes:["MERCHANT_NOT_VERIFIED", "FRAUD_RISK_UNKNOWN", "LOW_CONFIDENCE_EVIDENCE"]
});
["AUTHORIZED", "MARKETPLACE", "INDIVIDUAL"].forEach((type) => {
  const flag = type.toLowerCase();
  const input = { merchantId:type, merchantType:type, official:false, authorized:false, marketplace:false, individual:false };
  input[flag] = true;
  assert.equal(trust.createMerchantTrustSnapshot(input).success, true);
});
assert.equal(trust.createMerchantTrustSnapshot(Object.assign({}, official, { marketplace:true })).error.code, "TRUST_FLAG_CONFLICT");
assert.equal(trust.createMerchantTrustSnapshot(Object.assign({}, official, { merchantType:"MARKETPLACE", official:false, marketplace:false })).error.code, "TRUST_FLAG_CONFLICT");
assert.equal(trust.createMerchantTrustSnapshot(Object.assign({}, official, { rating:null, reviewCount:1 })).error.code, "TRUST_RATING_INVALID");
assert.equal(trust.createMerchantTrustSnapshot(Object.assign({}, official, { rating:5.01 })).error.code, "TRUST_RATING_INVALID");
assert.equal(trust.createMerchantTrustSnapshot(Object.assign({}, official, { reviewCount:1.5 })).error.code, "TRUST_RATING_INVALID");
assert.equal(trust.createMerchantTrustSnapshot(Object.assign({}, official, { fraudRisk:"AUTO" })).error.code, "TRUST_INPUT_REJECTED");
assert.equal(trust.normalizeTrustEvidence([{ type:"RATING_SUMMARY", value:true, confidence:"LOW" }, { type:"RATING_SUMMARY", value:true, confidence:"LOW" }]).evidence.length, 1);
assert.equal(trust.normalizeTrustEvidence([{ type:"OTHER_DECLARATION", value:"https://unsafe.example", confidence:"LOW" }]).error.code, "TRUST_EVIDENCE_INVALID");
assert.equal(trust.createMerchantTrustSnapshot(Object.assign({}, official, { trustScore:90 })).error.code, "TRUST_SCORE_MISMATCH");
const highRisk = trust.createMerchantTrustSnapshot(Object.assign({}, official, { fraudRisk:"HIGH" }));
assert.equal(highRisk.snapshot.trusted, false);
assert.equal(highRisk.snapshot.reasonCodes.includes("HIGH_FRAUD_RISK_DECLARED"), true);
assert.equal(trust.createMerchantTrustSnapshot(Object.assign({}, official, { rating:4, reviewCount:0 })).snapshot.reasonCodes.includes("RATING_WITHOUT_REVIEWS"), true);
const compared = trust.compareMerchantTrustSnapshots([
  Object.assign({}, official, { merchantId:"low", verified:false, rating:null, reviewCount:0, evidence:[], fraudRisk:"UNKNOWN" }),
  official
]);
assert.deepEqual(JSON.parse(JSON.stringify(compared.snapshots.map((item) => item.merchantId))), ["official-demo", "low"]);
const original = JSON.stringify(official);
trust.createMerchantTrustSnapshot(official);
assert.equal(JSON.stringify(official), original);
first.snapshot.merchantId = "changed";
assert.equal(trust.createMerchantTrustSnapshot(official).snapshot.merchantId, "official-demo");
for (let index = 0; index < 20; index += 1) assert.deepEqual(JSON.parse(JSON.stringify(trust.createMerchantTrustSnapshot(official))), JSON.parse(JSON.stringify(first)));
console.log("GLOBAL_COMMERCE_MERCHANT_TRUST PASS");
