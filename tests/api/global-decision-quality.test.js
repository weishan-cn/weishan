const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "../../apps/desktop/src/renderer/core");
const windowRef = {}; windowRef.window = windowRef;
const context = vm.createContext({ window:windowRef, Set, Number, Object, Array, String, Boolean, RegExp, Math });
[
  "globalCommerceInputGuard.js", "globalDecisionRiskCoverage.js", "globalDecisionAlternative.js", "globalDecisionConstraint.js", "globalDecisionConfidence.js", "globalDecisionWarning.js", "globalDecisionQuality.js"
].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context));
const quality = windowRef.WeishanGlobalDecisionQuality;
const report = Object.freeze({
  facts:["A total cost and a cancellation policy were supplied."],
  analysis:["Option A balances the supplied cost and policy information."],
  recommendation:"Option A is a reasonable option under the supplied conditions.",
  risks:[{ type:"PRICE_RISK" }, { type:"POLICY_RISK" }],
  alternatives:["Option B"],
  limitations:["Availability was not independently verified."]
});
const input = Object.freeze({ report, constraints:{ goal:"BEST_VALUE" } });
const assessed = quality.assessDecisionQuality(input);
assert.equal(assessed.success, true);
assert.equal(assessed.qualityAssessment.userDecisionRequired, true);
assert.equal(assessed.qualityAssessment.evaluatesUser, false);
assert.equal(assessed.qualityAssessment.constraintClarity.goal, "BEST_VALUE");
assert.equal(assessed.qualityAssessment.constraintClarity.inferredGoal, false);
assert.equal(assessed.qualityAssessment.alternativeCoverage.hasReasonableAlternative, true);
assert.equal(assessed.qualityAssessment.alternativeCoverage.requiresThreeOptions, false);
assert.equal(assessed.qualityAssessment.riskCoverage.predictive, false);
assert.equal(assessed.qualityAssessment.confidenceLevel, "MEDIUM");
assert.equal(assessed.warnings.every((item) => !/guaranteed|must choose|panic/i.test(item)), true);
const v3 = quality.createDecisionReportV3(input);
assert.equal(v3.success, true);
assert.equal(v3.report.userDecisionRequired, true);
assert.deepEqual(JSON.parse(JSON.stringify(v3.report.facts)), ["A total cost and a cancellation policy were supplied."]);
assert.equal("sourceReport" in v3.report, false);
const missing = quality.assessDecisionQuality({ report:Object.assign({}, report, { facts:[] }), constraints:{} });
assert.equal(missing.success, true);
assert.equal(missing.qualityAssessment.missingInformation.some((item) => item.indexOf("MISSING_INFORMATION") === 0), true);
assert.equal(missing.qualityAssessment.confidenceLevel, "LOW");
assert.equal(quality.assessDecisionQuality({ report, constraints:{ goal:"BEST_VALUE", accountId:"blocked" } }).success, false);
assert.equal(quality.assessDecisionQuality({ report, constraints:{ goal:"BEST_VALUE" }, token:"blocked" }).success, false);
const getterInput = { report, constraints:{ goal:"BEST_VALUE" } };
Object.defineProperty(getterInput, "extra", { get() { return "blocked"; } });
assert.equal(quality.assessDecisionQuality(getterInput).success, false);
const reportText = JSON.stringify(report);
quality.createDecisionReportV3(input);
assert.equal(JSON.stringify(report), reportText);
for (let index = 0; index < 20; index += 1) assert.deepEqual(JSON.parse(JSON.stringify(quality.createDecisionReportV3(input))), JSON.parse(JSON.stringify(v3)));
console.log("GLOBAL_DECISION_QUALITY PASS");
