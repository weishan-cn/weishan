const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "../../apps/desktop/src/renderer/core");
const windowRef = {}; windowRef.window = windowRef;
const context = vm.createContext({ window:windowRef, Set, Number, Object, Array, String, Boolean, RegExp, Math });
[
  "globalCommerceInputGuard.js", "globalCommercePricing.js", "globalCommerceAvailability.js", "globalCommerceMerchantTrust.js", "globalCommerceDecision.js", "globalDecisionKnowledge.js", "globalDecisionExplanation.js", "globalDecisionRisk.js", "globalDecisionRecommendation.js", "globalDecisionCommerceAdapter.js", "globalDecisionDomainRegistry.js", "globalDecisionDomainAdapter.js", "globalDecisionTravelAdapter.js", "globalDecisionFinanceAdapter.js", "globalDecisionOrchestrator.js"
].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context));
const registry = windowRef.WeishanGlobalDecisionDomainRegistry;
const contract = windowRef.WeishanGlobalDecisionDomainAdapter;
const commerce = windowRef.WeishanGlobalDecisionCommerceAdapter;
const orchestrator = windowRef.WeishanGlobalDecisionOrchestrator;
assert.deepEqual(JSON.parse(JSON.stringify(registry.listDecisionDomains().map((item) => item.domainName))), ["COMMERCE", "TRAVEL", "FINANCE"]);
assert.deepEqual(JSON.parse(JSON.stringify(registry.discoverDecisionCapabilities("I need a hotel comparison").availableDomains)), ["TRAVEL"]);
assert.equal(registry.discoverDecisionCapabilities("I need a hotel comparison").automaticSelection, false);
assert.equal(contract.validateDomainAdapter(commerce).success, true);
assert.equal(contract.REQUIRED_METHODS.every((name) => typeof commerce[name] === "function"), true);
const candidate = { candidateId:"item-a", pricing:{ currency:"USD", basePrice:10, priceConfidence:"HIGH" }, availability:{ status:"IN_STOCK", quantity:1, regionRestricted:false, shippingAvailable:true, preorder:false, backorder:false }, merchantTrust:{ merchantId:"merchant-a", merchantType:"OFFICIAL", official:true, authorized:false, marketplace:false, individual:false, verified:true, rating:4.8, reviewCount:100, fraudRisk:"LOW", evidence:[{ type:"OFFICIAL_DECLARATION", value:true, confidence:"HIGH" }] } };
const commerceReport = orchestrator.createMultiDomainDecisionReport({ domain:"COMMERCE", input:{ candidate, alternatives:["item-b", "item-c"] } });
assert.equal(commerceReport.success, true);
assert.equal(commerceReport.report.domain, "COMMERCE");
assert.equal(commerceReport.report.limitations.length, 1);
assert.equal(commerceReport.report.userDecisionRequired, true);
assert.equal(orchestrator.createMultiDomainDecisionReport({ domain:"UNKNOWN", input:{} }).code, "DECISION_DOMAIN_UNSUPPORTED");
assert.equal(registry.discoverDecisionCapabilities({}).success, false);
console.log("GLOBAL_DECISION_DOMAIN PASS");
