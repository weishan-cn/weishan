;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_PUBLIC_PILOT_READINESS_SNAPSHOT_VERSION = "2.1.78";
  const SNAPSHOT_NAME = "flight_workflow_public_pilot_readiness_snapshot_v1";
  const CAVEAT = "该快照只适用于只读候选证据流程，不代表真实票价、库存或可出票。";
  const SENSITIVE_RE = /https?:\/\/\S+|(?:token|apiKey|key|secret|password|credential|cardNumber)\s*[:=]?\s*\S+|身份证|护照|银行卡|passport|raw feedback|rawUserText/ig;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).replace(SENSITIVE_RE, "redacted").trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true }; }
  function first() { for (let index = 0; index < arguments.length; index += 1) { const value = obj(arguments[index]); if (Object.keys(value).length) return value; } return {}; }
  function hasTradingUrl(value) {
    const safe = obj(value);
    return Boolean(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || (safe.safety && (safe.safety.bookingUrl || safe.safety.checkoutUrl || safe.safety.paymentUrl || safe.safety.orderUrl)));
  }
  function beta(input) { const safe = obj(input); return first(safe.betaExpansionGateSummary, safe.betaExpansionGate, safe.expansionGateSummary); }
  function checklist(input) { const safe = obj(input); return first(safe.publicPilotChecklistSummary, safe.publicPilotChecklist, safe.pilotReadinessSummary, safe.pilotReadinessViewModel); }
  function onboarding(input) { const safe = obj(input); return first(safe.pilotOnboardingSummary, safe.pilotOnboardingGuard, safe.pilotOnboardingViewModel); }
  function issuePattern(input) { const safe = obj(input); return first(safe.issuePatternSummary, safe.issuePatternRadar, safe.issuePatternViewModelSummary); }
  function supportReadiness(input) { const safe = obj(input); return first(safe.supportReadinessSummary, safe.supportReadinessGate); }
  function issueReview(input) { const safe = obj(input); return first(safe.issueReviewSummary, safe.issueReviewBoard, safe.publicPilotIssueReviewBoard); }
  function triage(input) { const safe = obj(input); return first(safe.supportTriageSummary, safe.supportTriageDashboard); }
  function operator(input) { const safe = obj(input); return first(safe.operatorConsoleSummary, safe.operatorConsoleViewModel); }
  function sentinel(input) { const safe = obj(input); return first(safe.safetyRegressionSummary, safe.safetyRegressionSentinel); }
  function sentinelPass(value) { return obj(value).status === "pass"; }
  function buildHealth(input) {
    const safe = obj(input);
    const betaSummary = beta(safe);
    const checklistSummary = checklist(safe);
    const onboardingSummary = onboarding(safe);
    const issuePatternSummary = issuePattern(safe);
    const supportReadinessSummary = supportReadiness(safe);
    const issueReviewSummary = issueReview(safe);
    const triageSummary = triage(safe);
    const operatorSummary = operator(safe);
    const sentinelSummary = sentinel(safe);
    const safetySummary = obj(safe.safety || sentinelSummary.safety || {});
    const blockedRisk = safe.rawUserTextStored === true || safe.rawResponseStored === true || safe.secretStored === true || safetySummary.rawUserTextStored === true || safetySummary.rawResponseStored === true || safetySummary.secretStored === true || hasTradingUrl(safe) || hasTradingUrl(betaSummary) || hasTradingUrl(checklistSummary) || hasTradingUrl(onboardingSummary) || hasTradingUrl(issuePatternSummary) || hasTradingUrl(supportReadinessSummary) || hasTradingUrl(issueReviewSummary) || hasTradingUrl(triageSummary) || hasTradingUrl(operatorSummary) || hasTradingUrl(sentinelSummary);
    const safetyMatrixPass = safe.safetyMatrixPass === true || obj(safe.safetyTestMatrixSummary).status === "pass" || obj(safe.safetyTestMatrixSummary).status === "ready" || sentinelPass(sentinelSummary) || sentinelPass(safe.safetyRegressionSummary);
    const betaExpansionApproved = safe.betaExpansionApproved === true || betaSummary.status === "approved" || obj(betaSummary.decision).safeToExpandReadOnlyBeta === true;
    const onboardingReady = safe.onboardingReady === true || obj(onboardingSummary.decision).canEnterReadOnlyPilot === true || onboardingSummary.status === "allowed";
    const supportReady = safe.supportReady === true || supportReadinessSummary.status === "ready" || supportReadinessSummary.status === "continue_small_pilot";
    const issuePatternStable = safe.issuePatternStable === true || issuePatternSummary.status === "ready";
    const noBlockedSafetyRisk = !blockedRisk && !hasTradingUrl(safe);
    let status = "needs_review";
    if (!noBlockedSafetyRisk || !safetyMatrixPass || sentinelSummary.status === "fail" || sentinelSummary.status === "failed_safe" || supportReadinessSummary.status === "blocked" || issueReviewSummary.status === "blocked" || triageSummary.status === "blocked" || operatorSummary.status === "blocked") {
      status = "blocked";
    } else if (issuePatternSummary.status === "needs_review" || supportReadinessSummary.status === "needs_review" || issueReviewSummary.status === "needs_review" || triageSummary.status === "needs_internal_review" || operatorSummary.status === "warning") {
      status = "needs_review";
    } else if (betaSummary.status === "continue_internal_testing" || checklistSummary.status === "needs_internal_testing" || onboardingSummary.status === "needs_internal_testing" || !betaExpansionApproved || !onboardingReady || !supportReady || !issuePatternStable) {
      status = "continue_small_pilot";
    } else {
      status = "ready";
    }
    const safeToContinuePublicPilot = status === "ready" || status === "continue_small_pilot";
    return clone({
      status: status,
      snapshotHealth: {
        betaExpansionApproved: betaExpansionApproved,
        onboardingReady: onboardingReady,
        supportReady: supportReady,
        issuePatternStable: issuePatternStable,
        safetyMatrixPass: safetyMatrixPass,
        noBlockedSafetyRisk: noBlockedSafetyRisk,
        safeToContinuePublicPilot: safeToContinuePublicPilot
      },
      betaExpansionSummary: clone(betaSummary),
      publicPilotChecklistSummary: clone(checklistSummary),
      pilotOnboardingSummary: clone(onboardingSummary),
      issuePatternSummary: clone(issuePatternSummary),
      supportReadinessSummary: clone(supportReadinessSummary),
      issueReviewSummary: clone(issueReviewSummary),
      supportTriageSummary: clone(triageSummary),
      operatorConsoleSummary: clone(operatorSummary),
      safetyRegressionSummary: clone(sentinelSummary),
      redacted: true
    });
  }
  function row(rowId, label, value, status) { return { rowId: rowId, label: text(label), value: text(value), status: /^(pass|warning|blocked)$/.test(status) ? status : "pass", redacted: true }; }
  function buildFlightWorkflowPublicPilotSnapshotRows(input) {
    const health = buildHealth(input || {});
    const betaSummary = obj(health.betaExpansionSummary);
    const checklistSummary = obj(health.publicPilotChecklistSummary);
    const onboardingSummary = obj(health.pilotOnboardingSummary);
    const issuePatternSummary = obj(health.issuePatternSummary);
    const supportReadinessSummary = obj(health.supportReadinessSummary);
    const issueReviewSummary = obj(health.issueReviewSummary);
    const triageSummary = obj(health.supportTriageSummary);
    const operatorSummary = obj(health.operatorConsoleSummary);
    const sentinelSummary = obj(health.safetyRegressionSummary);
    const resultLabel = health.status === "ready" ? "可以继续只读试点" : (health.status === "continue_small_pilot" ? "继续小范围观察" : (health.status === "blocked" ? "暂不可继续" : "需要复核"));
    return clone([
      row("beta_expansion", "beta expansion gate", obj(betaSummary.userFacingSummary).resultLabel || obj(betaSummary.decision).label || betaSummary.status || "continue_internal_testing", betaSummary.status === "blocked" ? "blocked" : (betaSummary.status === "approved" ? "pass" : "warning")),
      row("onboarding", "pilot onboarding guard", obj(onboardingSummary.userFacingSummary).resultLabel || obj(onboardingSummary.decision).label || onboardingSummary.status || "needs_review", onboardingSummary.status === "allowed" ? "pass" : (onboardingSummary.status === "blocked" ? "blocked" : "warning")),
      row("support", "support readiness gate", obj(supportReadinessSummary.userFacingSummary).resultLabel || obj(supportReadinessSummary.decision).label || supportReadinessSummary.status || "continue_small_pilot", supportReadinessSummary.status === "ready" ? "pass" : (supportReadinessSummary.status === "blocked" ? "blocked" : "warning")),
      row("issue_pattern", "issue pattern radar", obj(issuePatternSummary.userFacingSummary).resultLabel || obj(issuePatternSummary.patternSummary).message || issuePatternSummary.status || "insufficient_data", issuePatternSummary.status === "ready" ? "pass" : (issuePatternSummary.status === "needs_review" ? "warning" : "pass")),
      row("issue_review", "issue review board", obj(issueReviewSummary.userFacingSummary).resultLabel || issueReviewSummary.status || "ready", issueReviewSummary.status === "blocked" ? "blocked" : (issueReviewSummary.status === "needs_review" ? "warning" : "pass")),
      row("support_triage", "support triage dashboard", obj(triageSummary.userFacingSummary).resultLabel || obj(triageSummary.triage).label || triageSummary.status || "ready", triageSummary.status === "blocked" ? "blocked" : (triageSummary.status === "needs_internal_review" ? "warning" : "pass")),
      row("operator_console", "operator console", obj(operatorSummary.userFacingSummary).resultLabel || operatorSummary.status || "ready", operatorSummary.status === "blocked" ? "blocked" : (operatorSummary.status === "warning" ? "warning" : "pass")),
      row("safety_regression", "safety regression sentinel", sentinelSummary.status === "pass" ? "通过" : (sentinelSummary.status === "warning" ? "存在警告" : "已阻断"), sentinelSummary.status === "fail" || sentinelSummary.status === "failed_safe" ? "blocked" : (sentinelSummary.status === "warning" ? "warning" : "pass")),
      row("next_step", "下一步", resultLabel, health.status === "blocked" ? "blocked" : (health.status === "needs_review" ? "warning" : "pass"))
    ]);
  }
  function sanitizeFlightWorkflowPublicPilotReadinessSnapshot(snapshot) {
    const safe = obj(snapshot);
    const status = /^(ready|continue_small_pilot|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    const snapshotHealth = Object.assign({ betaExpansionApproved:false, onboardingReady:false, supportReady:false, issuePatternStable:false, safetyMatrixPass:false, noBlockedSafetyRisk:false, safeToContinuePublicPilot:false }, obj(safe.snapshotHealth));
    const summaryLabel = status === "ready" ? "可以继续只读试点" : (status === "continue_small_pilot" ? "继续小范围观察" : (status === "blocked" ? "暂不可继续" : "需要复核"));
    return clone({
      snapshotName: SNAPSHOT_NAME,
      appVersion: FLIGHT_WORKFLOW_PUBLIC_PILOT_READINESS_SNAPSHOT_VERSION,
      status: status,
      snapshotHealth: snapshotHealth,
      rows: Array.isArray(safe.rows) ? safe.rows.map(function (item) { return row(item.rowId, item.label, item.value, item.status); }) : [],
      userFacingSummary: Object.assign({ title: "只读试点状态快照", resultLabel: summaryLabel, caveat: CAVEAT, redacted: true }, safe.userFacingSummary || {}),
      safety: Object.assign(safety(), safe.safety || {}),
      pilotSnapshotStatus: text(safe.pilotSnapshotStatus || status),
      supportPlaybookStatus: text(safe.supportPlaybookStatus || "ready"),
      pilotSnapshotNextStep: text(safe.pilotSnapshotNextStep || summaryLabel),
      redacted: true
    });
  }
  function buildFlightWorkflowPublicPilotReadinessSnapshot(input) {
    try {
      const health = buildHealth(input || {});
      const label = health.status === "ready" ? "可以继续只读试点" : (health.status === "continue_small_pilot" ? "继续小范围观察" : (health.status === "blocked" ? "暂不可继续" : "需要复核"));
      return sanitizeFlightWorkflowPublicPilotReadinessSnapshot({
        status: health.status,
        snapshotHealth: health.snapshotHealth,
        rows: buildFlightWorkflowPublicPilotSnapshotRows(input || {}),
        userFacingSummary: { title: "只读试点状态快照", resultLabel: label, caveat: CAVEAT, redacted: true },
        safety: safety(),
        pilotSnapshotStatus: health.status,
        supportPlaybookStatus: obj(input && input.supportPlaybookSummary).status || "ready",
        pilotSnapshotNextStep: label
      });
    } catch (error) {
      return sanitizeFlightWorkflowPublicPilotReadinessSnapshot({ status: "failed_safe", rows: [], snapshotHealth: {}, userFacingSummary: { title: "只读试点状态快照", resultLabel: "需要复核", caveat: CAVEAT, redacted: true } });
    }
  }
  function buildFlightWorkflowPublicPilotSnapshotAuditDraft(input) {
    const snapshot = buildFlightWorkflowPublicPilotReadinessSnapshot(input || {});
    return clone({
      eventType: "FLIGHT_WORKFLOW_PUBLIC_PILOT_READINESS_SNAPSHOT_AUDIT_DRAFT",
      snapshotName: SNAPSHOT_NAME,
      appVersion: FLIGHT_WORKFLOW_PUBLIC_PILOT_READINESS_SNAPSHOT_VERSION,
      status: snapshot.status,
      rowCount: snapshot.rows.length,
      safetyMatrixPass: snapshot.snapshotHealth.safetyMatrixPass === true,
      safeToContinuePublicPilot: snapshot.snapshotHealth.safeToContinuePublicPilot === true,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      rawUserTextStored: false,
      rawResponseStored: false,
      secretStored: false,
      fileWrite: false,
      download: false,
      autoOpen: false,
      autoRefresh: false,
      redacted: true
    });
  }
  function buildFlightWorkflowPublicPilotSnapshotRowsAlias(input) { return buildFlightWorkflowPublicPilotSnapshotRows(input || {}); }
  function evaluateFlightWorkflowPublicPilotSnapshotHealthAlias(input) { return buildHealth(input || {}); }

  window.WeishanFlightWorkflowPublicPilotReadinessSnapshot = {
    FLIGHT_WORKFLOW_PUBLIC_PILOT_READINESS_SNAPSHOT_VERSION,
    SNAPSHOT_NAME,
    buildFlightWorkflowPublicPilotReadinessSnapshot,
    evaluateFlightWorkflowPublicPilotSnapshotHealth: evaluateFlightWorkflowPublicPilotSnapshotHealthAlias,
    buildFlightWorkflowPublicPilotSnapshotRows: buildFlightWorkflowPublicPilotSnapshotRowsAlias,
    buildFlightWorkflowPublicPilotSnapshotAuditDraft,
    sanitizeFlightWorkflowPublicPilotReadinessSnapshot
  };
})();
