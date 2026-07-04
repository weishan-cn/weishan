;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_SAFETY_TEST_MATRIX_CONSOLE_VERSION = "4.1.8";
  const MATRIX_NAME = "flight_workflow_safety_test_matrix_console_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(/https?:\/\/\S+|token|apiKey|secret|password|身份证|护照|银行卡|credential|passport|cardNumber/ig, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() {
    return {
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      autoOpen: false,
      autoRefresh: false,
      payment: false,
      order: false,
      ticketing: false,
      identityUpload: false,
      credentialInput: false,
      rawResponseStored: false,
      rawUserTextStored: false,
      secretStored: false,
      fileWrite: false,
      download: false,
      redacted: true
    };
  }

  function matrixRow(result) {
    const safe = result && typeof result === "object" ? result : {};
    const safetyChecks = safe.safetyChecks && typeof safe.safetyChecks === "object" ? safe.safetyChecks : {};
    const status = text(safe.status || "warning");
    return {
      scenarioId: safeText(safe.scenarioId || ""),
      scenarioLabel: safeText(safe.scenarioLabel || safe.scenarioId || ""),
      expectedOutcome: safeText(safe.expectedOutcome || ""),
      actualOutcome: safeText(safe.actualOutcome || ""),
      status: status,
      safetyChecks: {
        noTradingUrl: safetyChecks.noTradingUrl === true,
        noPaymentOrderTicketing: safetyChecks.noPaymentOrderTicketing === true,
        noIdentityOrCredential: safetyChecks.noIdentityOrCredential === true,
        noSecretOrRawResponse: safetyChecks.noSecretOrRawResponse === true,
        noAutoOpen: safetyChecks.noAutoOpen === true,
        noFileWriteOrDownload: safetyChecks.noFileWriteOrDownload === true,
        noFinalPriceClaim: safetyChecks.noFinalPriceClaim === true
      },
      message: safeText(safe.message || safe.actualOutcome || "已记录"),
      redacted: true
    };
  }

  function evaluateFlightWorkflowSafetyTestMatrixHealth(results) {
    const rows = buildFlightWorkflowSafetyTestMatrixRows(results || []);
    const scenarioCount = rows.length;
    const passedCount = rows.filter(function (row) { return row.status === "pass"; }).length;
    const warningCount = rows.filter(function (row) { return row.status === "warning"; }).length;
    const failedCount = rows.filter(function (row) { return row.status === "fail"; }).length;
    const blockedCount = rows.filter(function (row) { return row.status === "blocked"; }).length;
    const overallHealth = scenarioCount === 0 ? "unknown" : (failedCount || blockedCount ? "fail" : (warningCount ? "warning" : "pass"));
    return clone({ overallHealth: overallHealth, scenarioCount: scenarioCount, passedCount: passedCount, warningCount: warningCount, failedCount: failedCount, blockedCount: blockedCount, redacted: true });
  }

  function rowStatus(result) {
    const safe = result && typeof result === "object" ? result : {};
    if (safe.status === "failed_safe") return "blocked";
    if (safe.status === "fail") return "fail";
    if (safe.status === "warning") return "warning";
    if (safe.actualOutcome && /阻断/.test(String(safe.actualOutcome))) return "blocked";
    return "pass";
  }

  function checkSafety(result) {
    const safe = result && typeof result === "object" ? result : {};
    const urls = safe.safety || {};
    const scenarioSafe = safe.scenarioSimulationSummary && safe.scenarioSimulationSummary.safety || {};
    const noTradingUrl = [safe.bookingUrl, safe.checkoutUrl, safe.paymentUrl, safe.orderUrl, urls.bookingUrl, urls.checkoutUrl, urls.paymentUrl, urls.orderUrl, scenarioSafe.bookingUrl, scenarioSafe.checkoutUrl, scenarioSafe.paymentUrl, scenarioSafe.orderUrl].every(function (value) { return value == null || value === false || value === ""; });
    const noPaymentOrderTicketing = [safe.payment, safe.order, safe.ticketing, urls.payment, urls.order, urls.ticketing, scenarioSafe.payment, scenarioSafe.order, scenarioSafe.ticketing].every(function (value) { return value !== true; });
    const noIdentityOrCredential = [safe.identityUpload, safe.credentialInput, urls.identityUpload, urls.credentialInput, scenarioSafe.identityUpload, scenarioSafe.credentialInput].every(function (value) { return value !== true; });
    const noSecretOrRawResponse = [safe.rawResponseStored, safe.rawUserTextStored, safe.secretStored, urls.rawResponseStored, urls.rawUserTextStored, urls.secretStored, scenarioSafe.rawResponseStored, scenarioSafe.rawUserTextStored, scenarioSafe.secretStored].every(function (value) { return value !== true; });
    const noAutoOpen = [safe.autoOpen, urls.autoOpen, scenarioSafe.autoOpen].every(function (value) { return value !== true; });
    const noFileWriteOrDownload = [safe.fileWrite, safe.download, urls.fileWrite, urls.download, scenarioSafe.fileWrite, scenarioSafe.download].every(function (value) { return value !== true; });
    const noFinalPriceClaim = !/全网最低|最低价保证|已锁价|可出票|真实最终价/i.test(JSON.stringify(safe));
    return { noTradingUrl: noTradingUrl, noPaymentOrderTicketing: noPaymentOrderTicketing, noIdentityOrCredential: noIdentityOrCredential, noSecretOrRawResponse: noSecretOrRawResponse, noAutoOpen: noAutoOpen, noFileWriteOrDownload: noFileWriteOrDownload, noFinalPriceClaim: noFinalPriceClaim };
  }

  function buildFlightWorkflowSafetyTestMatrixRows(results) {
    return toArray(results).map(function (result) {
      const checks = checkSafety(result);
      const status = rowStatus(result);
      const message = status === "pass"
        ? "安全测试通过。"
        : (status === "warning"
          ? "存在警告，已安全降级。"
          : (status === "blocked"
            ? "已阻断安全违规。"
            : "存在失败项，已阻断。"));
      return clone({
        scenarioId: safeText(result && result.scenarioId || ""),
        scenarioLabel: safeText(result && result.scenarioLabel || ""),
        expectedOutcome: safeText(result && result.expectedOutcome || ""),
        actualOutcome: safeText(result && result.actualOutcome || ""),
        status: status,
        safetyChecks: checks,
        message: safeText(result && result.message || message),
        redacted: true
      });
    });
  }

  function summarizeMatrixRows(rows) {
    const list = toArray(rows);
    const health = evaluateFlightWorkflowSafetyTestMatrixHealth(list);
    return clone({
      matrixName: MATRIX_NAME,
      appVersion: FLIGHT_WORKFLOW_SAFETY_TEST_MATRIX_CONSOLE_VERSION,
      status: health.overallHealth === "fail" ? "fail" : (health.overallHealth === "warning" ? "warning" : "pass"),
      overallHealth: health.overallHealth,
      scenarioCount: health.scenarioCount,
      passedCount: health.passedCount,
      warningCount: health.warningCount,
      failedCount: health.failedCount,
      blockedCount: health.blockedCount,
      userFacingSummary: {
        title: "安全测试矩阵",
        resultLabel: health.overallHealth === "pass" ? "全部通过" : (health.overallHealth === "warning" ? "存在警告" : (health.overallHealth === "fail" ? "存在失败项" : "未知")),
        caveat: "该矩阵仅为本地安全回归检查，不代表真实票价或可出票。",
        redacted: true
      },
      redacted: true
    });
  }

  function stripReleaseField(value) { return value && typeof value === "object" ? clone(value) : (value == null ? null : safeText(value)); }

  function buildFlightWorkflowSafetyTestMatrixConsole(input) {
    const safe = input && typeof input === "object" ? input : {};
    const rows = buildFlightWorkflowSafetyTestMatrixRows(safe.results || safe.scenarioSimulationResults || []);
    const health = evaluateFlightWorkflowSafetyTestMatrixHealth(rows);
    const failedRows = rows.filter(function (row) { return row.status === "fail" || row.status === "blocked"; });
    return clone({
      matrixName: MATRIX_NAME,
      appVersion: FLIGHT_WORKFLOW_SAFETY_TEST_MATRIX_CONSOLE_VERSION,
      status: health.overallHealth === "fail" ? "fail" : (health.overallHealth === "warning" ? "warning" : "pass"),
      overallHealth: health.overallHealth,
      scenarioCount: health.scenarioCount,
      passedCount: health.passedCount,
      warningCount: health.warningCount,
      failedCount: health.failedCount,
      blockedCount: health.blockedCount,
      rows: rows,
      failedRows: failedRows,
      releaseReadinessSummary: stripReleaseField(safe.releaseReadinessSummary || null),
      userSafetyCopySummary: stripReleaseField(safe.userSafetyCopySummary || null),
      forbiddenCapabilitySummary: stripReleaseField(safe.forbiddenCapabilitySummary || null),
      userFacingBetaReadiness: stripReleaseField(safe.userFacingBetaReadiness || null),
      copyValidationStatus: safeText(safe.copyValidationStatus || ""),
      userFacingSummary: {
        title: "安全测试矩阵",
        resultLabel: health.overallHealth === "pass" ? "全部通过" : (health.overallHealth === "warning" ? "存在警告" : (health.overallHealth === "fail" ? "存在失败项" : "未知")),
        caveat: "该矩阵仅为本地安全回归检查，不代表真实票价或可出票。",
        redacted: true
      },
      safety: safety(),
      redacted: true
    });
  }

  function buildFlightWorkflowSafetyTestMatrixConsoleAuditDraft(input) {
    const matrix = buildFlightWorkflowSafetyTestMatrixConsole(input || {});
    return clone({
      eventType: "FLIGHT_WORKFLOW_SAFETY_TEST_MATRIX_CONSOLE_AUDIT_DRAFT",
      matrixName: MATRIX_NAME,
      appVersion: FLIGHT_WORKFLOW_SAFETY_TEST_MATRIX_CONSOLE_VERSION,
      status: matrix.status,
      overallHealth: matrix.overallHealth,
      scenarioCount: matrix.scenarioCount,
      failedCount: matrix.failedCount,
      blockedCount: matrix.blockedCount,
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

  function sanitizeFlightWorkflowSafetyTestMatrixConsole(matrix) {
    const safe = matrix && typeof matrix === "object" ? matrix : {};
    return clone({
      matrixName: MATRIX_NAME,
      appVersion: FLIGHT_WORKFLOW_SAFETY_TEST_MATRIX_CONSOLE_VERSION,
      status: safe.status || "failed_safe",
      overallHealth: safe.overallHealth || "unknown",
      scenarioCount: Number(safe.scenarioCount || 0),
      passedCount: Number(safe.passedCount || 0),
      warningCount: Number(safe.warningCount || 0),
      failedCount: Number(safe.failedCount || 0),
      blockedCount: Number(safe.blockedCount || 0),
      rows: toArray(safe.rows).map(function (row) { return clone(rowStatus(row) && { scenarioId: safeText(row.scenarioId || ""), scenarioLabel: safeText(row.scenarioLabel || ""), expectedOutcome: safeText(row.expectedOutcome || ""), actualOutcome: safeText(row.actualOutcome || ""), status: rowStatus(row), safetyChecks: checkSafety(row), message: safeText(row.message || ""), redacted: true }); }),
      failedRows: toArray(safe.failedRows).map(function (row) { return clone({ scenarioId: safeText(row.scenarioId || ""), scenarioLabel: safeText(row.scenarioLabel || ""), expectedOutcome: safeText(row.expectedOutcome || ""), actualOutcome: safeText(row.actualOutcome || ""), status: rowStatus(row), safetyChecks: checkSafety(row), message: safeText(row.message || ""), redacted: true }); }),
      userFacingSummary: Object.assign({ title: "安全测试矩阵", resultLabel: "未知", caveat: "该矩阵仅为本地安全回归检查，不代表真实票价或可出票。" }, clone(safe.userFacingSummary || {})),
      releaseReadinessSummary: stripReleaseField(safe.releaseReadinessSummary || null),
      userSafetyCopySummary: stripReleaseField(safe.userSafetyCopySummary || null),
      forbiddenCapabilitySummary: stripReleaseField(safe.forbiddenCapabilitySummary || null),
      userFacingBetaReadiness: stripReleaseField(safe.userFacingBetaReadiness || null),
      copyValidationStatus: safeText(safe.copyValidationStatus || ""),
      safety: Object.assign(safety(), clone(safe.safety || {})),
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      autoOpen: false,
      autoRefresh: false,
      payment: false,
      order: false,
      ticketing: false,
      identityUpload: false,
      credentialInput: false,
      rawResponseStored: false,
      rawUserTextStored: false,
      secretStored: false,
      fileWrite: false,
      download: false,
      redacted: true
    });
  }

  window.WeishanFlightWorkflowSafetyTestMatrixConsole = {
    FLIGHT_WORKFLOW_SAFETY_TEST_MATRIX_CONSOLE_VERSION,
    MATRIX_NAME,
    buildFlightWorkflowSafetyTestMatrixConsole,
    buildFlightWorkflowSafetyTestMatrixRows,
    evaluateFlightWorkflowSafetyTestMatrixHealth,
    buildFlightWorkflowSafetyTestMatrixConsoleAuditDraft,
    sanitizeFlightWorkflowSafetyTestMatrixConsole,
    summarizeMatrixRows
  };
})();
