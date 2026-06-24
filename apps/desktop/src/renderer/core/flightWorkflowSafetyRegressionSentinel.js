;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_SAFETY_REGRESSION_SENTINEL_VERSION = "2.1.77";
  const SENTINEL_NAME = "flight_workflow_safety_regression_sentinel_v1";
  const FORBIDDEN_TEXT_RE = /https?:\/\/\S+|token|apiKey|secret|password|身份证|护照|银行卡|credential|passport|cardNumber/ig;
  const SECRET_VALUE_RE = /token|apiKey|secret|password|sk-|pk-|live_|prod_/i;
  const CLAIM_RE = /全网最低|最低价保证|已锁价|可出票|真实最终价/i;
  const TRADING_URL_RE = /bookingUrl|checkoutUrl|paymentUrl|orderUrl/i;
  const TRUE_RISK_RE = /payment|order|ticketing|identityUpload|credentialInput|autoOpen|autoRefresh|rawResponseStored|rawUserTextStored|secretStored|fileWrite|download/i;
  const SECRET_NAME_RE = /token|apiKey|secret|password|auth|credential|rawProviderResponse|rawResponse|rawPayload|rawText|rawUserText|rawInput/i;
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(FORBIDDEN_TEXT_RE, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }; }
  function failure(checkId, field, riskType) { return { checkId:checkId, field:safeText(field || ""), riskType:safeText(riskType || checkId), redacted:true }; }
  function addUnique(list, item) { if (!list.some(function (entry) { return entry.checkId === item.checkId && entry.field === item.field && entry.riskType === item.riskType; })) list.push(item); }
  function scanFlightWorkflowSafetyObject(obj, options) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return clone({ status:"failed_safe", failures:[failure("malformed_input", "input", "malformed_input")], warnings:[], redacted:true });
    const failures = [];
    const warnings = [];
    function visit(value, key, path) {
      if (value == null) return;
      const name = String(key || "");
      const fieldPath = path || name || "root";
      if (TRADING_URL_RE.test(name) && value !== null && value !== false && value !== "") addUnique(failures, failure("no_trading_urls", fieldPath, "trading_url_non_null"));
      if (/(payment|order|ticketing)$/i.test(name) && value === true) addUnique(failures, failure("no_payment_order_ticketing", fieldPath, "transaction_flag_true"));
      if (/(identityUpload|credentialInput)$/i.test(name) && value === true) addUnique(failures, failure("no_identity_or_credentials", fieldPath, "identity_or_credential_true"));
      if (/(rawResponseStored|rawUserTextStored|secretStored)$/i.test(name) && value === true) addUnique(failures, failure("no_secret_or_raw_response", fieldPath, "secret_or_raw_storage_true"));
      if (/(autoOpen|autoRefresh)$/i.test(name) && value === true) addUnique(failures, failure("no_auto_open_or_refresh", fieldPath, "auto_action_true"));
      if (/(fileWrite|download)$/i.test(name) && value === true) addUnique(failures, failure("no_export_or_file_write", fieldPath, "file_or_download_true"));
      if (SECRET_NAME_RE.test(name) && value && value !== false) addUnique(failures, failure("no_secret_or_raw_response", fieldPath, "secret_or_raw_field_present"));
      if (typeof value === "string") {
        if (SECRET_VALUE_RE.test(value)) addUnique(failures, failure("no_secret_or_raw_response", fieldPath, "secret_like_text"));
        if (CLAIM_RE.test(value)) addUnique(failures, failure("no_final_price_claims", fieldPath, "forbidden_price_or_ticketing_claim"));
      }
      if (Array.isArray(value)) value.forEach(function (child, index) { visit(child, name, fieldPath + "[" + index + "]"); });
      else if (value && typeof value === "object") Object.keys(value).forEach(function (childKey) { visit(value[childKey], childKey, fieldPath === "root" ? childKey : fieldPath + "." + childKey); });
    }
    Object.keys(obj).forEach(function (key) { visit(obj[key], key, key); });
    if (options && options.warnUnknown === true) warnings.push({ warningId:"unknown_fields_reviewed", message:"发现未知字段但未发现安全风险。", redacted:true });
    return clone({ status:failures.length ? "fail" : (warnings.length ? "warning" : "pass"), failures:failures, warnings:warnings, redacted:true });
  }
  function check(checkId, label, failures, message) {
    const failed = failures.some(function (item) { return item.checkId === checkId || (checkId === "no_export_or_file_write" && item.checkId === "no_export_or_file_write"); });
    return { checkId:checkId, label:label, status:failed ? "fail" : "pass", message:safeText(message || (failed ? "发现安全回归风险。" : "安全回归通过。")), redacted:true };
  }
  function buildFlightWorkflowSafetyRegressionReport(input) {
    try {
      if (!input || typeof input !== "object" || Array.isArray(input)) return sanitizeReport({ sentinelName:SENTINEL_NAME, appVersion:FLIGHT_WORKFLOW_SAFETY_REGRESSION_SENTINEL_VERSION, status:"failed_safe", checks:[], failures:[failure("malformed_input", "input", "malformed_input")], warnings:[], safety:safety(), redacted:true });
      const scan = scanFlightWorkflowSafetyObject(input, {});
      const failures = scan.failures || [];
      const checks = [
        check("no_trading_urls", "无交易链接", failures),
        check("no_payment_order_ticketing", "无付款/下单/出票", failures),
        check("no_identity_or_credentials", "无证件/银行卡/登录凭据", failures),
        check("no_secret_or_raw_response", "无密钥或原始响应", failures),
        check("no_auto_open_or_refresh", "无自动打开或自动刷新", failures),
        check("no_final_price_claims", "无最终价或出票承诺", failures),
        check("no_export_or_file_write", "无真实导出或写文件", failures)
      ];
      const status = failures.length ? "fail" : (scan.warnings && scan.warnings.length ? "warning" : "pass");
      return sanitizeReport({ sentinelName:SENTINEL_NAME, appVersion:FLIGHT_WORKFLOW_SAFETY_REGRESSION_SENTINEL_VERSION, status:status, checks:checks, failures:failures, warnings:scan.warnings || [], safety:safety(), redacted:true });
    } catch (error) {
      return sanitizeReport({ sentinelName:SENTINEL_NAME, appVersion:FLIGHT_WORKFLOW_SAFETY_REGRESSION_SENTINEL_VERSION, status:"failed_safe", checks:[], failures:[failure("failed_safe", "sentinel", "failed_safe")], warnings:[], safety:safety(), redacted:true });
    }
  }
  function sanitizeReport(report) {
    const safe = report && typeof report === "object" ? report : {};
    return clone({ sentinelName:SENTINEL_NAME, appVersion:FLIGHT_WORKFLOW_SAFETY_REGRESSION_SENTINEL_VERSION, status:safe.status || "failed_safe", checks:toArray(safe.checks).map(function (item) { return { checkId:safeText(item.checkId || ""), label:safeText(item.label || ""), status:item.status === "fail" ? "fail" : "pass", message:safeText(item.message || ""), redacted:true }; }), failures:toArray(safe.failures).map(function (item) { return failure(item.checkId || "failure", item.field || "", item.riskType || "risk"); }), warnings:toArray(safe.warnings).map(function (item) { return { warningId:safeText(item.warningId || "warning"), message:safeText(item.message || ""), redacted:true }; }), safety:Object.assign(safety(), safe.safety || {}), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true });
  }
  function runFlightWorkflowSafetyRegressionSentinel(input) { return buildFlightWorkflowSafetyRegressionReport(input); }
  function buildFlightWorkflowSafetyRegressionSentinelAuditDraft(input) { const report = buildFlightWorkflowSafetyRegressionReport(input || {}); return clone({ eventType:"FLIGHT_WORKFLOW_SAFETY_REGRESSION_SENTINEL_AUDIT_DRAFT", sentinelName:SENTINEL_NAME, appVersion:FLIGHT_WORKFLOW_SAFETY_REGRESSION_SENTINEL_VERSION, status:report.status, failureCount:report.failures.length, warningCount:report.warnings.length, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }); }
  window.WeishanFlightWorkflowSafetyRegressionSentinel = { FLIGHT_WORKFLOW_SAFETY_REGRESSION_SENTINEL_VERSION, SENTINEL_NAME, runFlightWorkflowSafetyRegressionSentinel, scanFlightWorkflowSafetyObject, buildFlightWorkflowSafetyRegressionReport, buildFlightWorkflowSafetyRegressionSentinelAuditDraft };
})();
