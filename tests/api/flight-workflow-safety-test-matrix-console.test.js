const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowSafetyTestMatrixConsole.js"]);
  const api = windowRef.WeishanFlightWorkflowSafetyTestMatrixConsole;
  assert.equal(api.FLIGHT_WORKFLOW_SAFETY_TEST_MATRIX_CONSOLE_VERSION, "4.2.4");
  const rows = api.buildFlightWorkflowSafetyTestMatrixRows([
    { scenarioId:"complete_flight_request", scenarioLabel:"完整机票请求", status:"pass", expectedOutcome:"pass", actualOutcome:"完成", safetyChecks:{ noTradingUrl:true, noPaymentOrderTicketing:true, noIdentityOrCredential:true, noSecretOrRawResponse:true, noAutoOpen:true, noFileWriteOrDownload:true, noFinalPriceClaim:true } },
    { scenarioId:"missing_date", scenarioLabel:"缺少日期", status:"warning", expectedOutcome:"warning", actualOutcome:"需要补充日期", safetyChecks:{ noTradingUrl:true, noPaymentOrderTicketing:true, noIdentityOrCredential:true, noSecretOrRawResponse:true, noAutoOpen:true, noFileWriteOrDownload:true, noFinalPriceClaim:true } },
    { scenarioId:"illegal_trading_url_injection", scenarioLabel:"非法交易链接阻断", status:"blocked", expectedOutcome:"blocked", actualOutcome:"已阻断安全违规", bookingUrl:"https://blocked.example" }
  ]);
  assert.equal(rows.length, 3);
  assert.equal(rows[2].status, "blocked");
  assert.equal(rows[2].safetyChecks.noTradingUrl, false);
  const health = api.evaluateFlightWorkflowSafetyTestMatrixHealth(rows);
  assert.equal(health.scenarioCount, 3);
  assert.equal(health.passedCount, 1);
  assert.equal(health.warningCount, 1);
  assert.equal(health.blockedCount, 1);
  assert.equal(health.overallHealth, "fail");
  const consoleModel = api.buildFlightWorkflowSafetyTestMatrixConsole({ results: rows });
  assert.equal(consoleModel.matrixName, "flight_workflow_safety_test_matrix_console_v1");
  assert.equal(consoleModel.status, "fail");
  assert.equal(consoleModel.userFacingSummary.title, "安全测试矩阵");
  assert.equal(consoleModel.userFacingSummary.caveat, "该矩阵仅为本地安全回归检查，不代表真实票价或可出票。");
  assert.equal(consoleModel.failedRows.length, 1);
  const sanitized = api.sanitizeFlightWorkflowSafetyTestMatrixConsole({ rows:[{ scenarioId:"x", scenarioLabel:"y", bookingUrl:"https://blocked.example", status:"pass" }], failedRows:[{ scenarioId:"x", status:"blocked" }], bookingUrl:"https://blocked.example" });
  assert.equal(sanitized.bookingUrl, null);
  assert.equal(sanitized.rows[0].bookingUrl, undefined);
  assert.equal(sanitized.rows[0].status, "pass");
  assert.equal(sanitized.redacted, true);
  console.log("FLIGHT_WORKFLOW_SAFETY_TEST_MATRIX_CONSOLE PASS");
}
main();
