;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_SCENARIO_SIMULATOR_PRESENTER_VERSION = "4.0.6";
  const PRESENTER_NAME = "flight_workflow_scenario_simulator_presenter_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(/https?:\/\/\S+|token|apiKey|secret|password|身份证|护照|银行卡|credential|passport|cardNumber/ig, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }

  function matrixSummaryOf(input) {
    const safe = input && typeof input === "object" ? input : {};
    return safe.matrixSummary && typeof safe.matrixSummary === "object" ? safe.matrixSummary : (window.WeishanFlightWorkflowSafetyTestMatrixConsole && typeof window.WeishanFlightWorkflowSafetyTestMatrixConsole.buildFlightWorkflowSafetyTestMatrixConsole === "function"
      ? window.WeishanFlightWorkflowSafetyTestMatrixConsole.buildFlightWorkflowSafetyTestMatrixConsole({ results: toArray(safe.results) })
      : { overallHealth: "unknown", scenarioCount: 0, passedCount: 0, warningCount: 0, failedCount: 0, blockedCount: 0, rows: [], failedRows: [], userFacingSummary: { title: "安全测试矩阵", resultLabel: "未知", caveat: "场景模拟仅用于安全回归，不代表真实票价、库存或可出票。", redacted: true }, redacted: true });
  }

  function buildScenarioSimulationStatusCards(input) {
    const safe = input && typeof input === "object" ? input : {};
    const summary = safe.simulationSummary && typeof safe.simulationSummary === "object" ? safe.simulationSummary : (safe.summary && typeof safe.summary === "object" ? safe.summary : {});
    const matrixSummary = matrixSummaryOf(safe);
    return clone([
      { cardId: "scenario_count", label: "场景数", value: String(summary.scenarioCount || matrixSummary.scenarioCount || toArray(safe.results).length || 0), redacted: true },
      { cardId: "passed", label: "通过", value: String(summary.passedCount || matrixSummary.passedCount || 0), redacted: true },
      { cardId: "warning", label: "警告", value: String(summary.warningCount || matrixSummary.warningCount || 0), redacted: true },
      { cardId: "failed", label: "失败", value: String(summary.failedCount || matrixSummary.failedCount || 0), redacted: true }
    ]);
  }

  function buildScenarioSimulationRows(input) {
    const safe = input && typeof input === "object" ? input : {};
    const results = toArray(safe.results || safe.scenarioSimulationResults || (safe.simulationSummary && safe.simulationSummary.results) || []);
    return clone(results.map(function (result) {
      return {
        scenarioId: safeText(result.scenarioId || ""),
        scenarioLabel: safeText(result.scenarioLabel || ""),
        expectedOutcome: safeText(result.expectedOutcome || ""),
        actualOutcome: safeText(result.actualOutcome || ""),
        status: safeText(result.status || ""),
        message: safeText(result.actualOutcome || result.message || ""),
        redacted: true
      };
    }));
  }

  function buildFlightWorkflowScenarioSimulatorPresenter(input) {
    const safe = input && typeof input === "object" ? input : {};
    const simulationSummary = safe.simulationSummary && typeof safe.simulationSummary === "object" ? safe.simulationSummary : (safe.summary && typeof safe.summary === "object" ? safe.summary : null);
    const matrixSummary = matrixSummaryOf(safe);
    const rows = buildScenarioSimulationRows(safe);
    const statusCards = buildScenarioSimulationStatusCards({ simulationSummary: simulationSummary, matrixSummary: matrixSummary, results: rows });
    const failedRows = toArray(rows).filter(function (row) { return row.status === "fail" || row.status === "failed_safe" || row.status === "blocked"; });
    const status = matrixSummary.overallHealth === "fail" ? "fail" : (matrixSummary.overallHealth === "warning" ? "warning" : (matrixSummary.overallHealth === "pass" ? "pass" : (simulationSummary && simulationSummary.status || "failed_safe")));
    return clone({
      presenterName: PRESENTER_NAME,
      appVersion: FLIGHT_WORKFLOW_SCENARIO_SIMULATOR_PRESENTER_VERSION,
      status: status,
      title: "机票工作流场景模拟",
      statusCards: statusCards,
      rows: rows,
      failedRows: failedRows,
      matrixSummaryLabel: safeText(matrixSummary.userFacingSummary && matrixSummary.userFacingSummary.resultLabel || matrixSummary.resultLabel || "未知"),
      caveat: "场景模拟仅用于安全回归，不代表真实票价、库存或可出票。",
      redacted: true
    });
  }

  function buildFlightWorkflowScenarioSimulatorPresenterAuditDraft(input) {
    const presenter = buildFlightWorkflowScenarioSimulatorPresenter(input || {});
    return clone({
      eventType: "FLIGHT_WORKFLOW_SCENARIO_SIMULATOR_PRESENTER_AUDIT_DRAFT",
      presenterName: PRESENTER_NAME,
      appVersion: FLIGHT_WORKFLOW_SCENARIO_SIMULATOR_PRESENTER_VERSION,
      status: presenter.status,
      title: presenter.title,
      statusCardCount: presenter.statusCards.length,
      rowCount: presenter.rows.length,
      failedRowCount: presenter.failedRows.length,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      payment: false,
      order: false,
      ticketing: false,
      identityUpload: false,
      rawResponseStored: false,
      rawUserTextStored: false,
      secretStored: false,
      fileWrite: false,
      download: false,
      redacted: true
    });
  }

  window.WeishanFlightWorkflowScenarioSimulatorPresenter = {
    FLIGHT_WORKFLOW_SCENARIO_SIMULATOR_PRESENTER_VERSION,
    PRESENTER_NAME,
    buildFlightWorkflowScenarioSimulatorPresenter,
    buildScenarioSimulationStatusCards,
    buildScenarioSimulationRows,
    buildFlightWorkflowScenarioSimulatorPresenterAuditDraft
  };
})();
