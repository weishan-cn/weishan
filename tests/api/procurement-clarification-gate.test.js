const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/procurementClarificationGate.js"]);
  const api = windowRef.WeishanProcurementClarificationGate;
  assert.equal(api.PROCUREMENT_CLARIFICATION_GATE_VERSION, "2.1.34");
  const vagueFlight = api.evaluateProcurementClarificationGate({ rawUserInput:"帮我买机票" });
  assert.equal(vagueFlight.clarificationDecision, "ask_user");
  assert.deepEqual(Array.from(vagueFlight.missingFields), ["出发地", "目的地", "日期"]);
  assert.match(vagueFlight.questionText, /出发地.*目的地.*日期/);
  const vagueProduct = api.evaluateProcurementClarificationGate({ rawUserInput:"买 iPhone" });
  assert.equal(vagueProduct.clarificationDecision, "ask_user");
  assert.ok(vagueProduct.missingFields.includes("型号") || vagueProduct.missingFields.includes("购买地区"));
  assert.match(vagueProduct.questionText, /型号|购买地区|收货地/);
  const clearFlight = api.evaluateProcurementClarificationGate({ rawUserInput:"7月15日上海到成都最便宜的直达机票" });
  assert.equal(clearFlight.clarificationDecision, "not_needed");
  const clearProduct = api.evaluateProcurementClarificationGate({ rawUserInput:"iPhone 16 Pro，美国和日本比较，收货到中国" });
  assert.equal(clearProduct.clarificationDecision, "not_needed");
  assert.ok(vagueFlight.suggestedQuickReplies.length <= 3);
  assert.equal(vagueFlight.fakeResultPrevented, true);
  const audit = api.buildProcurementClarificationGateAuditDraft({ rawUserInput:"帮我买机票" });
  assert.equal(audit.eventType, "PROCUREMENT_CLARIFICATION_GATE_DRAFT");
  assert.equal(audit.fakeResultPrevented, true);
  assert.equal(audit.redacted, true);
  assert.equal(api.assertProcurementClarificationGateSafe(vagueFlight), true);
  console.log("PROCUREMENT_CLARIFICATION_GATE_CORE PASS");
}

main();
