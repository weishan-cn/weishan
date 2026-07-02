;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_LAUNCH_CANDIDATE_READINESS_BOARD_VERSION = "4.0.3";
  const BOARD_NAME = "flight_workflow_launch_candidate_readiness_board_v1";
  const CAVEAT = "发布候选仍然只覆盖只读候选证据流程，不提供付款、下单或出票能力。";

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
      realNameStored:false, phoneStored:false, emailStored:false, identityUpload:false, credentialInput:false,
      rawUserTextStored:false, rawResponseStored:false, secretStored:false, bookingUrl:null, checkoutUrl:null,
      paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false,
      autoOpen:false, autoRefresh:false, redacted:true
    };
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId || "row"), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function api(name) { return window[name] || {}; }
  function pick(input, directKeys, globalName, fnName) {
    const safe = obj(input);
    for (let i = 0; i < directKeys.length; i += 1) {
      const candidate = obj(safe[directKeys[i]]);
      if (Object.keys(candidate).length) return candidate;
    }
    const loaded = api(globalName);
    return typeof loaded[fnName] === "function" ? loaded[fnName](safe) : {};
  }
  function exitCriteriaOf(input) { return pick(input, ["pilotExitCriteriaSummary", "exitCriteriaSummary"], "WeishanFlightWorkflowReadOnlyPilotExitCriteria", "buildFlightWorkflowReadOnlyPilotExitCriteria"); }
  function releaseReadinessOf(input) { return pick(input, ["releaseReadinessSummary", "releaseReadinessDashboard"], "WeishanFlightWorkflowReleaseReadinessDashboard", "buildFlightWorkflowReleaseReadinessDashboard"); }
  function safetyMatrixOf(input) {
    const safe = obj(input);
    const direct = obj(safe.safetyMatrixSummary || safe.safetyTestMatrixSummary || safe.matrixSummary || safe.safetyMatrix);
    if (Object.keys(direct).length) return direct;
    const dashboard = obj(releaseReadinessOf(safe));
    return obj(dashboard.safetyTestMatrixSummary || dashboard.scenarioSimulationSummary || dashboard.readiness || {});
  }
  function operatorConsoleOf(input) { return pick(input, ["operatorConsoleSummary", "operatorConsole"], "WeishanFlightWorkflowOperatorConsole", "buildFlightWorkflowOperatorConsole"); }
  function supportReadinessOf(input) { return pick(input, ["supportReadinessSummary", "supportReadinessGate"], "WeishanFlightWorkflowSupportReadinessGate", "buildFlightWorkflowSupportReadinessGate"); }
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
  function evaluateFlightWorkflowLaunchCandidateReadiness(input) {
    const safe = obj(input);
    const exitCriteriaSummary = exitCriteriaOf(safe);
    const releaseReadinessSummary = releaseReadinessOf(safe);
    const safetyMatrixSummary = safetyMatrixOf(safe);
    const operatorConsoleSummary = operatorConsoleOf(safe);
    const supportReadinessSummary = supportReadinessOf(safe);
    const noSensitiveDataRisk = safe.noSensitiveDataRisk === false ? false : ![safe, exitCriteriaSummary, releaseReadinessSummary, safetyMatrixSummary, operatorConsoleSummary, supportReadinessSummary].some(hasSensitiveRisk);
    const noTradingRisk = safe.noTradingRisk === false ? false : ![safe, exitCriteriaSummary, releaseReadinessSummary, safetyMatrixSummary, operatorConsoleSummary, supportReadinessSummary].some(hasTradingRisk);
    const pilotExitCriteriaMet = safe.pilotExitCriteriaMet === true || exitCriteriaSummary.status === "met" || obj(exitCriteriaSummary.exitHealth).readyForLaunchCandidate === true;
    const releaseReadinessReady = safe.releaseReadinessReady === true || releaseReadinessSummary.status === "ready" || releaseReadinessSummary.safeForUserFacingBeta === true;
    const safetyMatrixPass = safe.safetyMatrixPass === true || safetyMatrixSummary.status === "pass" || safetyMatrixSummary.overallHealth === "pass";
    const supportReady = safe.supportReady === true || supportReadinessSummary.status === "ready";
    const userFacingCopyReady = safe.userFacingCopyReady === true || releaseReadinessSummary.status === "ready" || releaseReadinessSummary.copyValidationStatus === "pass";
    const forbiddenCapabilitiesVisible = safe.forbiddenCapabilitiesVisible === true || toArray(releaseReadinessSummary.forbiddenCapabilities).length > 0;
    const safeForReadOnlyLaunchCandidate = pilotExitCriteriaMet && releaseReadinessReady && safetyMatrixPass && supportReady && userFacingCopyReady && forbiddenCapabilitiesVisible && noSensitiveDataRisk && noTradingRisk;
    const blockedReasons = [];
    if (!noSensitiveDataRisk) blockedReasons.push("sensitive_data_risk");
    if (!noTradingRisk) blockedReasons.push("trading_risk");
    if (!safetyMatrixPass) blockedReasons.push("safety_matrix_failed");
    if (!supportReady) blockedReasons.push("support_not_ready");
    if (!userFacingCopyReady) blockedReasons.push("user_copy_not_ready");
    if (!forbiddenCapabilitiesVisible) blockedReasons.push("forbidden_capabilities_hidden");
    if (!pilotExitCriteriaMet) blockedReasons.push("pilot_exit_criteria_not_met");
    if (!releaseReadinessReady) blockedReasons.push("release_readiness_not_ready");
    const launchCandidateReadiness = {
      pilotExitCriteriaMet, releaseReadinessReady, safetyMatrixPass, supportReady, userFacingCopyReady,
      forbiddenCapabilitiesVisible, noSensitiveDataRisk, noTradingRisk, safeForReadOnlyLaunchCandidate
    };
    let status = "continue_pilot";
    if (!noSensitiveDataRisk || !noTradingRisk || !safetyMatrixPass) status = "blocked";
    else if (!pilotExitCriteriaMet) status = "continue_pilot";
    else if (!supportReady || !userFacingCopyReady || !forbiddenCapabilitiesVisible || !releaseReadinessReady) status = "needs_review";
    else if (safeForReadOnlyLaunchCandidate) status = "ready";
    const resultLabel = status === "ready" ? "可以进入只读发布候选" : status === "continue_pilot" ? "继续试点观察" : status === "needs_review" ? "需要复核" : "暂不可进入";
    return clone({
      boardName:BOARD_NAME,
      appVersion:FLIGHT_WORKFLOW_LAUNCH_CANDIDATE_READINESS_BOARD_VERSION,
      status:status,
      launchCandidateReadiness:launchCandidateReadiness,
      rows:[
        row("pilot_exit_criteria", "试点退出条件", pilotExitCriteriaMet ? "试点退出条件已满足" : "继续试点观察", pilotExitCriteriaMet ? "pass" : "warning"),
        row("release_readiness", "发布就绪", releaseReadinessReady ? "发布就绪" : "需要复核", releaseReadinessReady ? "pass" : "warning"),
        row("safety_matrix", "安全矩阵", safetyMatrixPass ? "安全矩阵通过" : "已阻断", safetyMatrixPass ? "pass" : "blocked"),
        row("support_ready", "支持准备", supportReady ? "支持准备就绪" : "需要复核", supportReady ? "pass" : "warning"),
        row("user_copy_ready", "发布文案", userFacingCopyReady ? "发布文案就绪" : "需要复核", userFacingCopyReady ? "pass" : "warning"),
        row("forbidden_capabilities", "安全红线", forbiddenCapabilitiesVisible ? "安全红线可见" : "需要复核", forbiddenCapabilitiesVisible ? "pass" : "warning"),
        row("launch_candidate", "Launch Candidate", safeForReadOnlyLaunchCandidate ? "可以进入只读发布候选" : "继续试点观察", safeForReadOnlyLaunchCandidate ? "pass" : (status === "blocked" ? "blocked" : "warning"))
      ],
      blockedReasons:blockedReasons,
      userFacingSummary:{ title:"只读发布候选准备板", resultLabel:resultLabel, caveat:CAVEAT, redacted:true },
      safety:safety(),
      exitCriteriaSummary:clone(exitCriteriaSummary),
      releaseReadinessSummary:clone(releaseReadinessSummary),
      safetyMatrixSummary:clone(safetyMatrixSummary),
      operatorConsoleSummary:clone(operatorConsoleSummary),
      supportReadinessSummary:clone(supportReadinessSummary),
      freezeGateSummary:clone(safe.freezeGateSummary || null),
      evidenceFreezePackSummary:clone(safe.evidenceFreezePackSummary || null),
      launchCandidateStatus:status,
      readyForLaunchCandidate:safeForReadOnlyLaunchCandidate,
      launchCandidateNextStep:safeForReadOnlyLaunchCandidate ? "可以进入只读发布候选" : (status === "continue_pilot" ? "继续试点观察" : status === "needs_review" ? "需要复核" : "暂不可进入"),
      bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true
    });
  }
  function buildFlightWorkflowLaunchCandidateReadinessRows(input) {
    const board = evaluateFlightWorkflowLaunchCandidateReadiness(input || {});
    return clone(board.rows || []);
  }
  function sanitizeFlightWorkflowLaunchCandidateReadinessBoard(board) {
    const safe = obj(board);
    const status = /^(ready|continue_pilot|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    const readiness = Object.assign({
      pilotExitCriteriaMet:false, releaseReadinessReady:false, safetyMatrixPass:false, supportReady:false, userFacingCopyReady:false,
      forbiddenCapabilitiesVisible:false, noSensitiveDataRisk:false, noTradingRisk:false, safeForReadOnlyLaunchCandidate:false
    }, obj(safe.launchCandidateReadiness));
    const summary = obj(safe.userFacingSummary);
    return clone({
      boardName:BOARD_NAME,
      appVersion:FLIGHT_WORKFLOW_LAUNCH_CANDIDATE_READINESS_BOARD_VERSION,
      status:status,
      launchCandidateReadiness:readiness,
      rows:toArray(safe.rows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }),
      blockedReasons:toArray(safe.blockedReasons).map(text),
      userFacingSummary:{ title:"只读发布候选准备板", resultLabel:summary.resultLabel || (status === "ready" ? "可以进入只读发布候选" : status === "continue_pilot" ? "继续试点观察" : status === "needs_review" ? "需要复核" : "暂不可进入"), caveat:summary.caveat || CAVEAT, redacted:true },
      safety:Object.assign(safety(), obj(safe.safety)),
      exitCriteriaSummary:clone(safe.exitCriteriaSummary || null),
      releaseReadinessSummary:clone(safe.releaseReadinessSummary || null),
      safetyMatrixSummary:clone(safe.safetyMatrixSummary || null),
      operatorConsoleSummary:clone(safe.operatorConsoleSummary || null),
      supportReadinessSummary:clone(safe.supportReadinessSummary || null),
      freezeGateSummary:clone(safe.freezeGateSummary || null),
      evidenceFreezePackSummary:clone(safe.evidenceFreezePackSummary || null),
      rcCandidateReviewSummary:clone(safe.rcCandidateReviewSummary || null),
      rcEvidenceReviewSummary:clone(safe.rcEvidenceReviewSummary || null),
      rcReviewStatus:text(safe.rcReviewStatus || (obj(safe.rcCandidateReviewSummary).status || "")),
      rcEvidenceStatus:text(safe.rcEvidenceStatus || (obj(safe.rcEvidenceReviewSummary).status || "")),
      safeToStartRcReview:safe.safeToStartRcReview === true,
      launchCandidateStatus:text(safe.launchCandidateStatus || status),
      readyForLaunchCandidate:safe.readyForLaunchCandidate === true || readiness.safeForReadOnlyLaunchCandidate === true,
      launchCandidateNextStep:text(safe.launchCandidateNextStep || (status === "ready" ? "可以进入只读发布候选" : status === "continue_pilot" ? "继续试点观察" : status === "needs_review" ? "需要复核" : "暂不可进入")),
      bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true
    });
  }
  function buildFlightWorkflowLaunchCandidateReadinessBoard(input) {
    try {
      const board = evaluateFlightWorkflowLaunchCandidateReadiness(input || {});
      return sanitizeFlightWorkflowLaunchCandidateReadinessBoard(board);
    } catch (error) {
      return sanitizeFlightWorkflowLaunchCandidateReadinessBoard({
        status:"failed_safe",
        launchCandidateReadiness:{},
        rows:[],
        blockedReasons:["failed_safe"],
        userFacingSummary:{ title:"只读发布候选准备板", resultLabel:"暂不可进入", caveat:CAVEAT, redacted:true }
      });
    }
  }
  function buildFlightWorkflowLaunchCandidateReadinessBoardAuditDraft(input) {
    const board = buildFlightWorkflowLaunchCandidateReadinessBoard(input || {});
    return clone({
      eventType:"FLIGHT_WORKFLOW_LAUNCH_CANDIDATE_READINESS_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:FLIGHT_WORKFLOW_LAUNCH_CANDIDATE_READINESS_BOARD_VERSION,
      status:board.status,
      safeForReadOnlyLaunchCandidate:board.launchCandidateReadiness.safeForReadOnlyLaunchCandidate === true,
      blockedReasons:board.blockedReasons,
      bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false,
      secretStored:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true
    });
  }

  window.WeishanFlightWorkflowLaunchCandidateReadinessBoard = {
    FLIGHT_WORKFLOW_LAUNCH_CANDIDATE_READINESS_BOARD_VERSION,
    BOARD_NAME,
    buildFlightWorkflowLaunchCandidateReadinessBoard,
    evaluateFlightWorkflowLaunchCandidateReadiness,
    buildFlightWorkflowLaunchCandidateReadinessRows,
    buildFlightWorkflowLaunchCandidateReadinessBoardAuditDraft,
    sanitizeFlightWorkflowLaunchCandidateReadinessBoard
  };
})();
