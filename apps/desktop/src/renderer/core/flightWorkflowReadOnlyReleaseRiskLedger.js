;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_READ_ONLY_RELEASE_RISK_LEDGER_VERSION = "2.2.4";
  const LEDGER_NAME = "flight_workflow_read_only_release_risk_ledger_v1";
  const CAVEAT = "该风险台账只用于只读发布候选判断，不代表真实交易、订单、客服工单或出票能力。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|身份证|护照|银行卡|passport/ig, "redacted")
      .trim();
  }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function risk(riskId, category, label, severity, status, message) {
    return {
      riskId:text(riskId || "risk"),
      category:/^(safety|evidence|ui_copy|regression|provider_boundary|release_process)$/.test(category) ? category : "release_process",
      label:text(label),
      severity:/^(low|medium|high|blocked)$/.test(severity) ? severity : "medium",
      status:/^(open|needs_review|closed|blocked)$/.test(status) ? status : "needs_review",
      message:text(message),
      redacted:true
    };
  }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId || "row"),
      label:text(label),
      value:text(value),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
  }
  function safety() {
    return {
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
    };
  }
  function api(name) { return window[name] || {}; }
  function first() {
    for (let index = 0; index < arguments.length; index += 1) {
      const value = obj(arguments[index]);
      if (Object.keys(value).length) return value;
    }
    return {};
  }
  function auditPackOf(input) {
    const safe = obj(input);
    return first(
      safe.rcRegressionAuditSummary,
      typeof api("WeishanFlightWorkflowRcRegressionAuditPack").buildFlightWorkflowRcRegressionAuditPack === "function"
        ? api("WeishanFlightWorkflowRcRegressionAuditPack").buildFlightWorkflowRcRegressionAuditPack(safe)
        : null
    );
  }
  function candidateReviewOf(input) {
    const safe = obj(input);
    return first(safe.rcCandidateReviewSummary);
  }
  function evidenceChecklistOf(input) {
    const safe = obj(input);
    return first(safe.rcEvidenceReviewSummary);
  }
  function sentinelOf(input) {
    const safe = obj(input);
    return first(safe.safetyRegressionSummary);
  }
  function riskBadgeOf(input) {
    const safe = obj(input);
    return first(safe.riskBadgeSummary);
  }
  function freezeGateOf(input) {
    const safe = obj(input);
    return first(safe.freezeGateSummary);
  }
  function evidencePackOf(input) {
    const safe = obj(input);
    return first(safe.evidenceFreezePackSummary);
  }
  function buildFlightWorkflowReleaseRiskRows(input) {
    return clone(evaluateFlightWorkflowReleaseRiskLedger(input || {}).rows || []);
  }
  function evaluateFlightWorkflowReleaseRiskLedger(input) {
    const safe = obj(input);
    const rcRegressionAuditSummary = auditPackOf(safe);
    const rcCandidateReviewSummary = candidateReviewOf(safe);
    const rcEvidenceReviewSummary = evidenceChecklistOf(safe);
    const safetyRegressionSummary = sentinelOf(safe);
    const riskBadgeSummary = riskBadgeOf(safe);
    const freezeGateSummary = freezeGateOf(safe);
    const evidenceFreezePackSummary = evidencePackOf(safe);

    const risks = [];
    if (obj(rcRegressionAuditSummary.auditHealth).noSensitiveDataRisk === false) risks.push(risk("sensitive_data", "safety", "敏感数据风险", "blocked", "blocked", "存在敏感数据风险，已阻断。"));
    if (obj(rcRegressionAuditSummary.auditHealth).noTradingRisk === false) risks.push(risk("trading_risk", "provider_boundary", "交易风险", "blocked", "blocked", "检测到付款、下单或出票风险，已阻断。"));
    if (obj(rcRegressionAuditSummary.auditHealth).noSecretRisk === false) risks.push(risk("secret_risk", "safety", "密钥风险", "blocked", "blocked", "检测到 token/key/secret 风险，已阻断。"));
    if (obj(rcRegressionAuditSummary.auditHealth).noExternalOpenRisk === false) risks.push(risk("external_open_risk", "provider_boundary", "外部打开风险", "blocked", "blocked", "检测到自动打开外部平台风险，已阻断。"));
    if (obj(rcRegressionAuditSummary.auditHealth).noFileWriteRisk === false) risks.push(risk("file_write_risk", "release_process", "文件写入风险", "blocked", "blocked", "检测到文件写入风险，已阻断。"));
    if (obj(rcRegressionAuditSummary.auditHealth).noDownloadRisk === false) risks.push(risk("download_risk", "release_process", "下载风险", "blocked", "blocked", "检测到下载风险，已阻断。"));
    if (rcEvidenceReviewSummary.status === "incomplete") risks.push(risk("evidence_incomplete", "evidence", "证据仍需补充", "medium", "needs_review", "只读证据链仍需补充。"));
    if (rcRegressionAuditSummary.status === "needs_review") risks.push(risk("regression_incomplete", "regression", "回归仍需复核", "medium", "needs_review", "RC 回归审计仍需复核。"));
    if (safe.copyValidationStatus === "warning" || safe.copyValidationStatus === "needs_review" || obj(safe.rcCopyFinalizationSummary).status === "needs_review" || obj(safe.safetyDisclosureReviewSummary).status === "needs_review") risks.push(risk("ui_copy_gap", "ui_copy", "UI 文案仍需复核", "low", "open", "只读文案仍需统一复核。"));
    if (obj(safe.rcCopyFinalizationSummary).status === "blocked" || obj(safe.safetyDisclosureReviewSummary).status === "blocked") risks.push(risk("copy_disclosure_blocked", "safety", "文案或安全披露已阻断", "blocked", "blocked", "检测到危险文案或安全披露风险，已阻断。"));
    if (freezeGateSummary.status === "needs_review") risks.push(risk("freeze_gate_review", "release_process", "冻结检查仍需复核", "medium", "needs_review", "发布候选冻结检查仍需复核。"));
    if (evidenceFreezePackSummary.status === "needs_review") risks.push(risk("evidence_pack_review", "evidence", "证据冻结仍需复核", "medium", "needs_review", "证据冻结包仍需复核。"));
    if (!risks.length) risks.push(risk("no_open_risks", "release_process", "暂无阻断风险", "low", "closed", "当前未发现阻断风险。"));

    const blockedRisks = risks.filter(function (item) { return item.status === "blocked"; }).length;
    const reviewRisks = risks.filter(function (item) { return item.status === "needs_review"; }).length;
    const warningRisks = risks.filter(function (item) { return item.status === "open"; }).length;
    const closedRisks = risks.filter(function (item) { return item.status === "closed"; }).length;
    const blockedReasons = risks.filter(function (item) { return item.status === "blocked"; }).map(function (item) { return item.riskId; });

    let status = "clear";
    if (blockedRisks > 0) status = "blocked";
    else if (reviewRisks > 0) status = "needs_review";
    else if (warningRisks > 0) status = "open_risks";

    const riskSummary = {
      totalRisks:risks.length,
      blockedRisks:blockedRisks,
      reviewRisks:reviewRisks,
      warningRisks:warningRisks,
      closedRisks:closedRisks,
      safeToContinueReleaseCandidate:status === "clear"
    };

    return clone({
      ledgerName:LEDGER_NAME,
      appVersion:FLIGHT_WORKFLOW_READ_ONLY_RELEASE_RISK_LEDGER_VERSION,
      status:status,
      riskSummary:riskSummary,
      risks:risks,
      rows:[
        row("regression", "回归审计", rcRegressionAuditSummary.userFacingSummary && rcRegressionAuditSummary.userFacingSummary.resultLabel || "仍需复核", status === "blocked" ? "blocked" : (rcRegressionAuditSummary.status === "passed" ? "pass" : "warning")),
        row("release_risk", "发布风险", status === "clear" ? "暂无阻断风险" : status === "open_risks" ? "存在开放风险" : status === "needs_review" ? "存在待复核风险" : "发布风险已阻断", status === "blocked" ? "blocked" : (status === "clear" ? "pass" : "warning")),
        row("safety", "安全红线", blockedRisks ? "已阻断" : "安全红线正常", blockedRisks ? "blocked" : "pass"),
        row("provider_boundary", "Provider 边界", blockedReasons.some(function (item) { return /trading|external_open/.test(item); }) ? "已阻断" : "边界正常", blockedReasons.some(function (item) { return /trading|external_open/.test(item); }) ? "blocked" : "pass"),
        row("next_step", "下一步", status === "clear" ? "暂无阻断风险" : status === "open_risks" ? "存在开放风险" : status === "needs_review" ? "存在待复核风险" : "发布风险已阻断", status === "blocked" ? "blocked" : (status === "clear" ? "pass" : "warning"))
      ],
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"只读发布风险台账",
        resultLabel:status === "clear" ? "暂无阻断风险" : status === "open_risks" ? "存在开放风险" : status === "needs_review" ? "存在待复核风险" : "已阻断",
        caveat:CAVEAT,
        redacted:true
      },
      rcCopyFinalizationSummary:clone(safe.rcCopyFinalizationSummary || null),
      safetyDisclosureReviewSummary:clone(safe.safetyDisclosureReviewSummary || null),
      rcCopyReviewStatus:text(safe.rcCopyReviewStatus || safe.rcCopyFinalizationSummary && safe.rcCopyFinalizationSummary.status || ""),
      safetyDisclosureStatus:text(safe.safetyDisclosureStatus || safe.safetyDisclosureReviewSummary && safe.safetyDisclosureReviewSummary.status || ""),
      safeToFinalizeUserFacingCopy:safe.safeToFinalizeUserFacingCopy === true,
      globalShoppingProductGoalSummary:clone(safe.globalShoppingProductGoalSummary || null),
      jumpToPlatformBoundarySummary:clone(safe.jumpToPlatformBoundarySummary || null),
      globalShoppingGoalStatus:text(safe.globalShoppingGoalStatus || safe.globalShoppingProductGoalSummary && safe.globalShoppingProductGoalSummary.status || ""),
      jumpBoundaryStatus:text(safe.jumpBoundaryStatus || safe.jumpToPlatformBoundarySummary && safe.jumpToPlatformBoundarySummary.status || ""),
      safeToProceedWithJumpToPlatformMvp:safe.safeToProceedWithJumpToPlatformMvp === true,
      rcRegressionAuditSummary:clone(rcRegressionAuditSummary),
      rcCandidateReviewSummary:clone(rcCandidateReviewSummary),
      rcEvidenceReviewSummary:clone(rcEvidenceReviewSummary),
      safetyRegressionSummary:clone(safetyRegressionSummary),
      riskBadgeSummary:clone(riskBadgeSummary),
      freezeGateSummary:clone(freezeGateSummary),
      evidenceFreezePackSummary:clone(evidenceFreezePackSummary),
      safety:safety(),
      redacted:true
    });
  }
  function sanitizeFlightWorkflowReadOnlyReleaseRiskLedger(ledger) {
    const safe = obj(ledger);
    const status = /^(clear|open_risks|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    const summary = obj(safe.userFacingSummary);
    return clone({
      ledgerName:LEDGER_NAME,
      appVersion:FLIGHT_WORKFLOW_READ_ONLY_RELEASE_RISK_LEDGER_VERSION,
      status:status,
      riskSummary:Object.assign({
        totalRisks:0,
        blockedRisks:0,
        reviewRisks:0,
        warningRisks:0,
        closedRisks:0,
        safeToContinueReleaseCandidate:false
      }, obj(safe.riskSummary)),
      risks:toArray(safe.risks).map(function (item) { return risk(item.riskId, item.category, item.label, item.severity, item.status, item.message); }),
      rows:toArray(safe.rows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }),
      blockedReasons:toArray(safe.blockedReasons).map(text),
      userFacingSummary:{
        title:"只读发布风险台账",
        resultLabel:summary.resultLabel || (status === "clear" ? "暂无阻断风险" : status === "open_risks" ? "存在开放风险" : status === "needs_review" ? "存在待复核风险" : "已阻断"),
        caveat:summary.caveat || CAVEAT,
        redacted:true
      },
      rcCopyFinalizationSummary:clone(safe.rcCopyFinalizationSummary || null),
      safetyDisclosureReviewSummary:clone(safe.safetyDisclosureReviewSummary || null),
      rcCopyReviewStatus:text(safe.rcCopyReviewStatus || ""),
      safetyDisclosureStatus:text(safe.safetyDisclosureStatus || ""),
      safeToFinalizeUserFacingCopy:safe.safeToFinalizeUserFacingCopy === true,
      globalShoppingProductGoalSummary:clone(safe.globalShoppingProductGoalSummary || null),
      jumpToPlatformBoundarySummary:clone(safe.jumpToPlatformBoundarySummary || null),
      globalShoppingGoalStatus:text(safe.globalShoppingGoalStatus || ""),
      jumpBoundaryStatus:text(safe.jumpBoundaryStatus || ""),
      safeToProceedWithJumpToPlatformMvp:safe.safeToProceedWithJumpToPlatformMvp === true,
      rcRegressionAuditSummary:clone(safe.rcRegressionAuditSummary || null),
      rcCandidateReviewSummary:clone(safe.rcCandidateReviewSummary || null),
      rcEvidenceReviewSummary:clone(safe.rcEvidenceReviewSummary || null),
      safetyRegressionSummary:clone(safe.safetyRegressionSummary || null),
      riskBadgeSummary:clone(safe.riskBadgeSummary || null),
      freezeGateSummary:clone(safe.freezeGateSummary || null),
      evidenceFreezePackSummary:clone(safe.evidenceFreezePackSummary || null),
      safety:Object.assign(safety(), obj(safe.safety)),
      redacted:true
    });
  }
  function buildFlightWorkflowReadOnlyReleaseRiskLedger(input) {
    try {
      return sanitizeFlightWorkflowReadOnlyReleaseRiskLedger(evaluateFlightWorkflowReleaseRiskLedger(input || {}));
    } catch (error) {
      return sanitizeFlightWorkflowReadOnlyReleaseRiskLedger({
        status:"failed_safe",
        risks:[],
        rows:[],
        blockedReasons:["failed_safe"],
        userFacingSummary:{ title:"只读发布风险台账", resultLabel:"已阻断", caveat:CAVEAT, redacted:true }
      });
    }
  }
  function buildFlightWorkflowReleaseRiskLedgerAuditDraft(input) {
    const ledger = buildFlightWorkflowReadOnlyReleaseRiskLedger(input || {});
    return clone({
      eventType:"FLIGHT_WORKFLOW_READ_ONLY_RELEASE_RISK_LEDGER_AUDIT_DRAFT",
      ledgerName:LEDGER_NAME,
      appVersion:FLIGHT_WORKFLOW_READ_ONLY_RELEASE_RISK_LEDGER_VERSION,
      status:ledger.status,
      riskCount:ledger.risks.length,
      blockedRiskCount:ledger.riskSummary.blockedRisks,
      safeToFinalizeUserFacingCopy:ledger.safeToFinalizeUserFacingCopy === true,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      fileWrite:false,
      download:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    });
  }

  window.WeishanFlightWorkflowReadOnlyReleaseRiskLedger = {
    FLIGHT_WORKFLOW_READ_ONLY_RELEASE_RISK_LEDGER_VERSION,
    LEDGER_NAME,
    buildFlightWorkflowReadOnlyReleaseRiskLedger,
    evaluateFlightWorkflowReleaseRiskLedger,
    buildFlightWorkflowReleaseRiskRows,
    buildFlightWorkflowReleaseRiskLedgerAuditDraft,
    sanitizeFlightWorkflowReadOnlyReleaseRiskLedger
  };
})();
