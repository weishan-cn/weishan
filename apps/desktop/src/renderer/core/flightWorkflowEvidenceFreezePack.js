;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_EVIDENCE_FREEZE_PACK_VERSION = "2.1.98";
  const PACK_NAME = "flight_workflow_evidence_freeze_pack_v1";
  const CAVEAT = "证据冻结包只用于只读发布候选流程，不保存真实身份、不发送真实邀请、不提供交易能力。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|身份证|护照|银行卡|passport/ig, "redacted")
      .trim();
  }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() {
    return {
      bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null,
      payment:false, order:false, ticketing:false, fileWrite:false, download:false,
      autoOpen:false, autoRefresh:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false,
      redacted:true
    };
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId || "row"), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function api(name) { return window[name] || {}; }
  function first() {
    for (let index = 0; index < arguments.length; index += 1) {
      const value = obj(arguments[index]);
      if (Object.keys(value).length) return value;
    }
    return {};
  }
  function releaseReadinessOf(input) { const safe = obj(input); return first(safe.releaseReadinessSummary, safe.releaseReadinessDashboard, typeof api("WeishanFlightWorkflowReleaseReadinessDashboard").buildFlightWorkflowReleaseReadinessDashboard === "function" ? api("WeishanFlightWorkflowReleaseReadinessDashboard").buildFlightWorkflowReleaseReadinessDashboard(safe) : null); }
  function launchCandidateOf(input) { const safe = obj(input); return first(safe.launchCandidateReadinessSummary, safe.launchCandidateSummary, typeof api("WeishanFlightWorkflowLaunchCandidateReadinessBoard").buildFlightWorkflowLaunchCandidateReadinessBoard === "function" ? api("WeishanFlightWorkflowLaunchCandidateReadinessBoard").buildFlightWorkflowLaunchCandidateReadinessBoard(safe) : null); }
  function sentinelOf(input) { const safe = obj(input); return first(safe.safetyRegressionSummary, safe.safetyRegressionSentinel, typeof api("WeishanFlightWorkflowSafetyRegressionSentinel").buildFlightWorkflowSafetyRegressionReport === "function" ? api("WeishanFlightWorkflowSafetyRegressionSentinel").buildFlightWorkflowSafetyRegressionReport(safe) : null); }
  function operatorConsoleOf(input) { const safe = obj(input); return first(safe.operatorConsoleSummary, safe.operatorConsole, typeof api("WeishanFlightWorkflowOperatorConsole").buildFlightWorkflowOperatorConsole === "function" ? api("WeishanFlightWorkflowOperatorConsole").buildFlightWorkflowOperatorConsole(safe) : null); }
  function pilotOpsOf(input) { const safe = obj(input); return first(safe.pilotOpsSummary, safe.readOnlyPilotOpsSummary, typeof api("WeishanFlightWorkflowReadOnlyPilotOpsSummary").buildFlightWorkflowReadOnlyPilotOpsSummary === "function" ? api("WeishanFlightWorkflowReadOnlyPilotOpsSummary").buildFlightWorkflowReadOnlyPilotOpsSummary(safe) : null); }
  function supportReadinessOf(input) { const safe = obj(input); return first(safe.supportReadinessSummary, safe.supportReadinessGate); }
  function hasSensitiveRisk(value) {
    const safe = obj(value);
    const nested = obj(safe.safety);
    return safe.realNameStored === true || safe.phoneStored === true || safe.emailStored === true || safe.realIdentityStored === true ||
      safe.identityUpload === true || safe.credentialInput === true || safe.rawUserTextStored === true || safe.rawResponseStored === true ||
      safe.secretStored === true || nested.realNameStored === true || nested.phoneStored === true || nested.emailStored === true ||
      nested.realIdentityStored === true || nested.identityUpload === true || nested.credentialInput === true || nested.rawUserTextStored === true ||
      nested.rawResponseStored === true || nested.secretStored === true;
  }
  function hasTradingRisk(value) {
    const safe = obj(value);
    const nested = obj(safe.safety);
    return safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || nested.bookingUrl || nested.checkoutUrl || nested.paymentUrl || nested.orderUrl ||
      safe.payment === true || safe.order === true || safe.ticketing === true || nested.payment === true || nested.order === true || nested.ticketing === true;
  }
  function evaluateFlightWorkflowEvidenceFreezePack(input) {
    const safe = obj(input);
    const releaseReadinessSummary = releaseReadinessOf(safe);
    const launchCandidateReadinessSummary = launchCandidateOf(safe);
    const safetyRegressionSummary = sentinelOf(safe);
    const operatorConsoleSummary = operatorConsoleOf(safe);
    const pilotOpsSummary = pilotOpsOf(safe);
    const supportReadinessSummary = supportReadinessOf(safe);
    const releaseReady = safe.releaseReady === true || releaseReadinessSummary.status === "ready" || releaseReadinessSummary.safeForUserFacingBeta === true;
    const launchCandidateReady = safe.launchCandidateReady === true || launchCandidateReadinessSummary.status === "ready" || obj(launchCandidateReadinessSummary.launchCandidateReadiness).safeForReadOnlyLaunchCandidate === true;
    const safetyPass = safe.safetyPass === false ? false : (safe.safetyPass === true || safetyRegressionSummary.status === "pass");
    const operatorReady = safe.operatorReady === true || operatorConsoleSummary.status === "ready";
    const pilotReady = safe.pilotReady === true || pilotOpsSummary.status === "healthy" || pilotOpsSummary.status === "continue_current_batch";
    const supportReady = safe.supportReady === true || supportReadinessSummary.status === "ready";
    const noSensitiveDataRisk = safe.noSensitiveDataRisk === false ? false : ![safe, releaseReadinessSummary, launchCandidateReadinessSummary, safetyRegressionSummary, operatorConsoleSummary, pilotOpsSummary, supportReadinessSummary].some(hasSensitiveRisk);
    const noTradingRisk = safe.noTradingRisk === false ? false : ![safe, releaseReadinessSummary, launchCandidateReadinessSummary, safetyRegressionSummary, operatorConsoleSummary, pilotOpsSummary, supportReadinessSummary].some(hasTradingRisk);
    const safeToFreeze = releaseReady && launchCandidateReady && safetyPass && operatorReady && pilotReady && supportReady && noSensitiveDataRisk && noTradingRisk;
    let status = "needs_review";
    if (!safetyPass || !noSensitiveDataRisk || !noTradingRisk) status = "blocked";
    else if (safeToFreeze) status = "ready";
    const packResult = status === "ready" ? "证据冻结包已就绪" : status === "blocked" ? "证据冻结包已阻断" : "证据冻结仍需复核";
    return clone({
      packName:PACK_NAME,
      appVersion:FLIGHT_WORKFLOW_EVIDENCE_FREEZE_PACK_VERSION,
      status:status,
      safeToFreeze:safeToFreeze,
      releaseReady:releaseReady,
      launchCandidateReady:launchCandidateReady,
      sections:[
        { sectionId:"release_readiness", title:"发布就绪摘要", rows:[row("release", releaseReady ? "发布就绪" : "需要复核", releaseReady ? "pass" : "warning")] },
        { sectionId:"launch_candidate", title:"发布候选摘要", rows:[row("launch_candidate", launchCandidateReady ? "发布候选已准备" : "继续试点观察", launchCandidateReady ? "pass" : "warning")] },
        { sectionId:"safety", title:"安全红线摘要", rows:[row("safety", safetyPass ? "安全回归通过" : "已阻断", safetyPass ? "pass" : "blocked"), row("safety_redline", noSensitiveDataRisk && noTradingRisk ? "安全红线正常" : "已阻断", noSensitiveDataRisk && noTradingRisk ? "pass" : "blocked")] },
        { sectionId:"pilot", title:"只读试点摘要", rows:[row("pilot_ops", pilotOpsSummary.status === "healthy" ? "试点运行健康" : "继续当前批次", pilotOpsSummary.status === "healthy" ? "pass" : "warning"), row("support", supportReady ? "支持准备就绪" : "需要复核", supportReady ? "pass" : "warning")] }
      ],
      rows:[
        row("release_readiness", "发布就绪", releaseReady ? "发布就绪" : "需要复核", releaseReady ? "pass" : "warning"),
        row("launch_candidate", "发布候选", launchCandidateReady ? "发布候选已准备" : "继续试点观察", launchCandidateReady ? "pass" : "warning"),
        row("safety_regression", "安全回归", safetyPass ? "安全回归通过" : "已阻断", safetyPass ? "pass" : "blocked"),
        row("operator_console", "运营控制台", operatorReady ? "运营控制台正常" : "需要复核", operatorReady ? "pass" : "warning"),
        row("pilot_ops", "试点运营", pilotReady ? "试点运行健康" : "需要复核", pilotReady ? "pass" : "warning"),
        row("support", "支持准备", supportReady ? "支持准备就绪" : "需要复核", supportReady ? "pass" : "warning")
      ],
      userFacingSummary:{ title:"证据冻结包", resultLabel:packResult, caveat:CAVEAT, redacted:true },
      releaseReadinessSummary:clone(releaseReadinessSummary),
      launchCandidateReadinessSummary:clone(launchCandidateReadinessSummary),
      safetyRegressionSummary:clone(safetyRegressionSummary),
      operatorConsoleSummary:clone(operatorConsoleSummary),
      pilotOpsSummary:clone(pilotOpsSummary),
      supportReadinessSummary:clone(supportReadinessSummary),
      rcCandidateReviewSummary:clone(safe.rcCandidateReviewSummary || null),
      rcEvidenceReviewSummary:clone(safe.rcEvidenceReviewSummary || null),
      rcRegressionAuditSummary:clone(safe.rcRegressionAuditSummary || null),
      releaseRiskLedgerSummary:clone(safe.releaseRiskLedgerSummary || null),
      rcReviewStatus:text(safe.rcReviewStatus || (obj(safe.rcCandidateReviewSummary).status || "")),
      rcEvidenceStatus:text(safe.rcEvidenceStatus || (obj(safe.rcEvidenceReviewSummary).status || "")),
      rcRegressionStatus:text(safe.rcRegressionStatus || (obj(safe.rcRegressionAuditSummary).status || "")),
      releaseRiskStatus:text(safe.releaseRiskStatus || (obj(safe.releaseRiskLedgerSummary).status || "")),
      safeToStartRcReview:safe.safeToStartRcReview === true || obj(safe.rcCandidateReviewSummary).safeToStartRcReview === true,
      safeToContinueReleaseCandidate:safe.safeToContinueReleaseCandidate === true || obj(safe.releaseRiskLedgerSummary).riskSummary && obj(safe.releaseRiskLedgerSummary).riskSummary.safeToContinueReleaseCandidate === true,
      safety:safety(),
      canWriteFile:false,
      canDownload:false,
      freezePackNextStep:status === "ready" ? "可以冻结证据包" : status === "blocked" ? "暂停冻结并复核安全红线" : "继续补充证据",
      bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true
    });
  }
  function buildFlightWorkflowEvidenceFreezePackRows(input) { const pack = evaluateFlightWorkflowEvidenceFreezePack(input || {}); return clone(pack.rows || []); }
  function sanitizeFlightWorkflowEvidenceFreezePack(pack) {
    const safe = obj(pack);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    const summary = obj(safe.userFacingSummary);
    return clone({
      packName:PACK_NAME,
      appVersion:FLIGHT_WORKFLOW_EVIDENCE_FREEZE_PACK_VERSION,
      status:status,
      safeToFreeze:safe.safeToFreeze === true,
      releaseReady:safe.releaseReady === true,
      launchCandidateReady:safe.launchCandidateReady === true,
      rows:toArray(safe.rows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }),
      sections:toArray(safe.sections).map(function (section) {
        const safeSection = obj(section);
        return { sectionId:text(safeSection.sectionId || "section"), title:text(safeSection.title || ""), rows:toArray(safeSection.rows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }), redacted:true };
      }),
      userFacingSummary:{ title:"证据冻结包", resultLabel:summary.resultLabel || (status === "ready" ? "证据冻结包已就绪" : status === "blocked" ? "证据冻结包已阻断" : "证据冻结仍需复核"), caveat:summary.caveat || CAVEAT, redacted:true },
      releaseReadinessSummary:clone(safe.releaseReadinessSummary || null),
      launchCandidateReadinessSummary:clone(safe.launchCandidateReadinessSummary || null),
      safetyRegressionSummary:clone(safe.safetyRegressionSummary || null),
      operatorConsoleSummary:clone(safe.operatorConsoleSummary || null),
      pilotOpsSummary:clone(safe.pilotOpsSummary || null),
      supportReadinessSummary:clone(safe.supportReadinessSummary || null),
      rcCandidateReviewSummary:clone(safe.rcCandidateReviewSummary || null),
      rcEvidenceReviewSummary:clone(safe.rcEvidenceReviewSummary || null),
      rcRegressionAuditSummary:clone(safe.rcRegressionAuditSummary || null),
      releaseRiskLedgerSummary:clone(safe.releaseRiskLedgerSummary || null),
      rcReviewStatus:text(safe.rcReviewStatus || (obj(safe.rcCandidateReviewSummary).status || "")),
      rcEvidenceStatus:text(safe.rcEvidenceStatus || (obj(safe.rcEvidenceReviewSummary).status || "")),
      rcRegressionStatus:text(safe.rcRegressionStatus || (obj(safe.rcRegressionAuditSummary).status || "")),
      releaseRiskStatus:text(safe.releaseRiskStatus || (obj(safe.releaseRiskLedgerSummary).status || "")),
      safeToStartRcReview:safe.safeToStartRcReview === true || obj(safe.rcCandidateReviewSummary).safeToStartRcReview === true,
      safeToContinueReleaseCandidate:safe.safeToContinueReleaseCandidate === true || obj(safe.releaseRiskLedgerSummary).riskSummary && obj(safe.releaseRiskLedgerSummary).riskSummary.safeToContinueReleaseCandidate === true,
      canWriteFile:false,
      canDownload:false,
      freezePackNextStep:text(safe.freezePackNextStep || (status === "ready" ? "可以冻结证据包" : status === "blocked" ? "暂停冻结并复核安全红线" : "继续补充证据")),
      safety:Object.assign(safety(), obj(safe.safety)),
      bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true
    });
  }
  function buildFlightWorkflowEvidenceFreezePack(input) {
    try { return sanitizeFlightWorkflowEvidenceFreezePack(evaluateFlightWorkflowEvidenceFreezePack(input || {})); }
    catch (error) { return sanitizeFlightWorkflowEvidenceFreezePack({ status:"failed_safe", safeToFreeze:false, releaseReady:false, launchCandidateReady:false, rows:[], sections:[], userFacingSummary:{ title:"证据冻结包", resultLabel:"证据冻结包已阻断", caveat:CAVEAT, redacted:true } }); }
  }
  function buildFlightWorkflowEvidenceFreezePackAuditDraft(input) {
    const pack = buildFlightWorkflowEvidenceFreezePack(input || {});
    return clone({
      eventType:"FLIGHT_WORKFLOW_EVIDENCE_FREEZE_PACK_AUDIT_DRAFT",
      packName:PACK_NAME,
      appVersion:FLIGHT_WORKFLOW_EVIDENCE_FREEZE_PACK_VERSION,
      status:pack.status,
      safeToFreeze:pack.safeToFreeze === true,
      canWriteFile:false,
      canDownload:false,
      bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false,
      secretStored:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true
    });
  }

  window.WeishanFlightWorkflowEvidenceFreezePack = {
    FLIGHT_WORKFLOW_EVIDENCE_FREEZE_PACK_VERSION,
    PACK_NAME,
    buildFlightWorkflowEvidenceFreezePack,
    evaluateFlightWorkflowEvidenceFreezePack,
    buildFlightWorkflowEvidenceFreezePackRows,
    buildFlightWorkflowEvidenceFreezePackAuditDraft,
    sanitizeFlightWorkflowEvidenceFreezePack
  };
})();
