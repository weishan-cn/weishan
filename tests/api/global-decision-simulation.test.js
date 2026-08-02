const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "../../apps/desktop/src/renderer/core");
const windowRef = {}; windowRef.window = windowRef;
const context = vm.createContext({ window:windowRef, Set, Number, Object, Array, String, Boolean, RegExp, Math });
[
  "globalCommerceInputGuard.js", "globalDecisionScenario.js", "globalDecisionAssumption.js", "globalDecisionImpact.js", "globalDecisionTradeoff.js", "globalDecisionSimulation.js"
].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context));
const simulationApi = windowRef.WeishanGlobalDecisionSimulation;
const scenario = Object.freeze({
  scenarioId:"OPTION_A", title:"Option A", assumptions:["The supplied budget and schedule remain applicable."],
  impacts:{ cost:["Total cost is based on the supplied estimate."], time:["Travel time uses the supplied itinerary."], risk:["Cancellation terms should be reviewed."], convenience:["The route has one connection."], longTerm:["Long-term effect depends on the stated usage period."] },
  advantages:["The supplied total cost is lower."], risks:["Availability may change."], limitations:["No provider or live availability information was used."], tradeoffs:["Lower cost may require less flexibility."]
});
const input = Object.freeze({ domain:"TRAVEL", userTriggered:true, scenarios:[scenario, Object.assign({}, scenario, { scenarioId:"OPTION_B", title:"Option B" })] });
const simulated = simulationApi.simulateDecisionScenarios(input);
assert.equal(simulated.success, true);
assert.equal(simulated.domain, "TRAVEL");
assert.equal(simulated.userTriggered, true);
assert.equal(simulated.automaticallyGenerated, false);
assert.equal(simulated.recommendationAffected, false);
assert.equal(simulated.behaviorHistoryRead, false);
assert.equal(simulated.simulations.length, 2);
assert.equal(simulated.simulations[0].assumptions.hiddenAssumptions, false);
assert.equal(simulated.simulations[0].impactAreas.longTerm.assumptionsBased, true);
assert.equal(simulated.simulations[0].impactAreas.longTerm.prediction, false);
assert.equal(simulated.simulations[0].tradeoffs.uniqueBestAnswer, false);
assert.equal(simulated.simulations[0].userDecisionRequired, true);
for (const domain of ["COMMERCE", "FINANCE"]) {
  const domainResult = simulationApi.simulateDecisionScenarios(Object.assign({}, input, { domain }));
  assert.equal(domainResult.success, true);
  assert.equal(domainResult.simulations[0].financialAdvice, false);
  assert.equal(domainResult.simulations[0].returnPrediction, false);
  assert.equal(domainResult.simulations[0].tradeInstruction, false);
}
const report = Object.freeze({ facts:["User-provided fact."], analysis:["User-provided analysis."], recommendation:"Review the supplied options.", risks:["Availability may change."], limitations:["Offline information only."], confidence:"MEDIUM" });
const v4 = simulationApi.createDecisionReportV4({ report, simulation:simulated });
assert.equal(v4.success, true);
assert.equal(v4.report.userDecisionRequired, true);
assert.equal(v4.report.simulation.length, 2);
assert.equal(v4.report.tradeoffs.length, 2);
assert.equal("recommendationAffected" in v4.report, false);
assert.equal(simulationApi.simulateDecisionScenarios(Object.assign({}, input, { userTriggered:false })).success, false);
assert.equal(simulationApi.simulateDecisionScenarios(Object.assign({}, input, { accessToken:"blocked" })).success, false);
const getterInput = { domain:"TRAVEL", userTriggered:true, scenarios:[scenario] };
Object.defineProperty(getterInput, "extra", { get() { return "blocked"; } });
assert.equal(simulationApi.simulateDecisionScenarios(getterInput).success, false);
const sourceText = JSON.stringify(input); simulationApi.simulateDecisionScenarios(input); assert.equal(JSON.stringify(input), sourceText);
for (let index = 0; index < 20; index += 1) assert.deepEqual(JSON.parse(JSON.stringify(simulationApi.simulateDecisionScenarios(input))), JSON.parse(JSON.stringify(simulated)));
console.log("GLOBAL_DECISION_SIMULATION PASS");
