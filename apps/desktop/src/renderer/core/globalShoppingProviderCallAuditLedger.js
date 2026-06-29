;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_CALL_AUDIT_LEDGER_VERSION = "2.1.99";
  const LEDGER_NAME = "global_shopping_provider_call_audit_ledger_v1";
  const RESULT_LABELS = {
    ready:"调用审计台账已准备",
    needs_review:"调用审计台账仍需复核",
    blocked:"调用审计台账已阻断",
    failed_safe:"调用审计台账已阻断"
  };

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId || "row"),
      label:text(label || ""),
      value:text(value || ""),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
  }
  function safety(overrides) {
    return Object.assign({
      fileWrite:false,
      download:false,
      realNameStored:false,
      phoneStored:false,
      emailStored:false,
      identityUpload:false,
      credentialInput:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    }, obj(overrides));
  }
  function auditEntries(input) {
    const safe = obj(input);
    const entries = toArray(safe.auditEntries).map(function (item, index) {
      const audit = obj(item);
      return {
        auditId:text(audit.auditId || ("audit_" + (index + 1))),
        providerId:text(audit.providerId || safe.providerId || ""),
        providerName:text(audit.providerName || safe.providerName || ""),
        requestMode:text(audit.requestMode || safe.requestMode || "sandbox_ready"),
        callStatus:/^(not_sent|dry_run|blocked|needs_review)$/.test(text(audit.callStatus || "")) ? text(audit.callStatus) : "not_sent",
        redacted:audit.redacted !== false,
        timestamp:text(audit.timestamp || safe.timestamp || "redacted_now"),
        safetyStatus:text(audit.safetyStatus || "redacted_safe")
      };
    });
    return entries;
  }
  function evaluateGlobalShoppingProviderCallAudit(input) {
    const safe = obj(input);
    const entries = auditEntries(safe);
    const ledger = {
      ledgerId:text(safe.ledgerId || "provider_call_audit_ledger_v2_1_96"),
      inMemoryOnly:safe.inMemoryOnly !== false,
      persisted:false,
      uploaded:false,
      containsRawRequest:false,
      containsRawResponse:false,
      containsApiKey:false,
      containsProductionCredential:false,
      containsUserIdentity:false,
      containsPlatformCredential:false,
      containsPaymentData:false,
      containsTransactionUrl:false,
      auditEntries:entries
    };
    const health = {
      inMemoryOnly:ledger.inMemoryOnly === true,
      noPersistence:safe.persisted !== true && safe.fileWrite !== true,
      noUpload:safe.uploaded !== true,
      noRawRequest:safe.containsRawRequest !== true && safe.rawRequestStored !== true,
      noRawResponse:safe.containsRawResponse !== true && safe.rawResponseStored !== true,
      noApiKey:safe.containsApiKey !== true && safe.realApiKeyDetected !== true,
      noProductionCredential:safe.containsProductionCredential !== true && safe.productionCredentialDetected !== true,
      noUserIdentity:safe.containsUserIdentity !== true && safe.userIdentityDetected !== true,
      noPlatformCredential:safe.containsPlatformCredential !== true && safe.platformCredentialDetected !== true,
      noPaymentData:safe.containsPaymentData !== true && safe.paymentDataDetected !== true,
      noTransactionUrl:safe.containsTransactionUrl !== true && safe.bookingUrl == null && safe.checkoutUrl == null && safe.paymentUrl == null && safe.orderUrl == null
    };
    const blockedReasons = [];
    if (!health.inMemoryOnly) blockedReasons.push("not_in_memory_only");
    if (!health.noPersistence) blockedReasons.push("persistence_detected");
    if (!health.noUpload) blockedReasons.push("upload_detected");
    if (!health.noRawRequest) blockedReasons.push("raw_request_detected");
    if (!health.noRawResponse) blockedReasons.push("raw_response_detected");
    if (!health.noApiKey) blockedReasons.push("api_key_detected");
    if (!health.noProductionCredential) blockedReasons.push("production_credential_detected");
    if (!health.noUserIdentity) blockedReasons.push("user_identity_detected");
    if (!health.noPlatformCredential) blockedReasons.push("platform_credential_detected");
    if (!health.noPaymentData) blockedReasons.push("payment_data_detected");
    if (!health.noTransactionUrl) blockedReasons.push("transaction_url_detected");
    const needsReview = !blockedReasons.length && entries.length === 0;
    return clone({
      auditLedger:ledger,
      auditHealth:health,
      blockedReasons:blockedReasons,
      status:blockedReasons.length ? "blocked" : (needsReview ? "needs_review" : "ready"),
      redacted:true
    });
  }
  function buildGlobalShoppingProviderCallAuditRows(input) {
    const evaluation = evaluateGlobalShoppingProviderCallAudit(input || {});
    const health = evaluation.auditHealth;
    const entries = evaluation.auditLedger.auditEntries;
    const allRedacted = entries.length > 0 && entries.every(function (item) { return item.redacted === true; });
    return clone([
      row("storage", "存储边界", health.inMemoryOnly && health.noPersistence && health.noUpload ? "仅内存对象，不持久化、不上传" : "已阻断风险", health.inMemoryOnly && health.noPersistence && health.noUpload ? "pass" : "blocked"),
      row("request_boundary", "请求边界", health.noRawRequest ? "不保存 raw request" : "已阻断风险", health.noRawRequest ? "pass" : "blocked"),
      row("response_boundary", "响应边界", health.noRawResponse ? "调用审计不保存 raw response" : "已阻断风险", health.noRawResponse ? "pass" : "blocked"),
      row("secret_boundary", "敏感数据边界", health.noApiKey && health.noProductionCredential && health.noUserIdentity && health.noPlatformCredential && health.noPaymentData ? "不包含密钥、身份、平台账号与支付数据" : "已阻断风险", health.noApiKey && health.noProductionCredential && health.noUserIdentity && health.noPlatformCredential && health.noPaymentData ? "pass" : "blocked"),
      row("transaction_boundary", "交易边界", health.noTransactionUrl ? "不包含交易 URL" : "已阻断风险", health.noTransactionUrl ? "pass" : "blocked"),
      row("audit_entries", "审计条目", entries.length ? (allRedacted ? "审计条目已脱敏" : "已阻断风险") : "仍需补充", entries.length ? (allRedacted ? "pass" : "blocked") : "warning")
    ]);
  }
  function sanitizeGlobalShoppingProviderCallAuditLedger(ledger) {
    const safe = obj(ledger);
    const evaluation = evaluateGlobalShoppingProviderCallAudit(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      ledgerName:LEDGER_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_CALL_AUDIT_LEDGER_VERSION,
      status:status,
      auditLedger:clone(evaluation.auditLedger),
      auditHealth:clone(evaluation.auditHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingProviderCallAuditRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"Provider 调用审计台账",
        resultLabel:RESULT_LABELS[status] || RESULT_LABELS.failed_safe,
        caveat:"该台账仅为内存中的脱敏审计摘要，不保存 raw request、raw response、密钥、身份或交易数据。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingProviderCallAuditLedger(input) {
    try {
      return sanitizeGlobalShoppingProviderCallAuditLedger(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingProviderCallAuditLedger({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingProviderCallAuditLedgerAuditDraft(input) {
    const ledger = buildGlobalShoppingProviderCallAuditLedger(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_CALL_AUDIT_LEDGER_AUDIT_DRAFT",
      ledgerName:LEDGER_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_CALL_AUDIT_LEDGER_VERSION,
      status:ledger.status,
      rowCount:ledger.rows.length,
      blockedReasons:ledger.blockedReasons,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      fileWrite:false,
      download:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderCallAuditLedger = {
    GLOBAL_SHOPPING_PROVIDER_CALL_AUDIT_LEDGER_VERSION,
    LEDGER_NAME,
    buildGlobalShoppingProviderCallAuditLedger,
    evaluateGlobalShoppingProviderCallAudit,
    buildGlobalShoppingProviderCallAuditRows,
    buildGlobalShoppingProviderCallAuditLedgerAuditDraft,
    sanitizeGlobalShoppingProviderCallAuditLedger
  };
})();
