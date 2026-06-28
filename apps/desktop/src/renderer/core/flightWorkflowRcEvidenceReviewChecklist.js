;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_RC_EVIDENCE_REVIEW_CHECKLIST_VERSION = "2.1.91";
  const CHECKLIST_NAME = "flight_workflow_rc_evidence_review_checklist_v1";
  const CAVEAT = "该清单只复核只读证据，不生成真实导出文件，不代表真实交易或出票能力。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|身份证|护照|银行卡|passport/ig, "redacted")
      .trim();
  }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId || "row"), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
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
  function freezeGateOf(input) {
    const safe = obj(input);
    return first(
      safe.freezeGateSummary,
      typeof api("WeishanFlightWorkflowReadOnlyLaunchCandidateFreezeGate").buildFlightWorkflowReadOnlyLaunchCandidateFreezeGate === "function"
        ? api("WeishanFlightWorkflowReadOnlyLaunchCandidateFreezeGate").buildFlightWorkflowReadOnlyLaunchCandidateFreezeGate(safe)
        : null
    );
  }
  function evidencePackOf(input) {
    const safe = obj(input);
    return first(
      safe.evidenceFreezePackSummary,
      typeof api("WeishanFlightWorkflowEvidenceFreezePack").buildFlightWorkflowEvidenceFreezePack === "function"
        ? api("WeishanFlightWorkflowEvidenceFreezePack").buildFlightWorkflowEvidenceFreezePack(safe)
        : null
    );
  }
  function releaseReadinessOf(input) {
    const safe = obj(input);
    return first(
      safe.releaseReadinessSummary,
      typeof api("WeishanFlightWorkflowReleaseReadinessDashboard").buildFlightWorkflowReleaseReadinessDashboard === "function"
        ? api("WeishanFlightWorkflowReleaseReadinessDashboard").buildFlightWorkflowReleaseReadinessDashboard(safe)
        : null
    );
  }
  function launchCandidateOf(input) {
    const safe = obj(input);
    return first(
      safe.launchCandidateReadinessSummary,
      typeof api("WeishanFlightWorkflowLaunchCandidateReadinessBoard").buildFlightWorkflowLaunchCandidateReadinessBoard === "function"
        ? api("WeishanFlightWorkflowLaunchCandidateReadinessBoard").buildFlightWorkflowLaunchCandidateReadinessBoard(safe)
        : null
    );
  }
  function pilotExitCriteriaOf(input) {
    const safe = obj(input);
    return first(
      safe.pilotExitCriteriaSummary,
      typeof api("WeishanFlightWorkflowReadOnlyPilotExitCriteria").buildFlightWorkflowReadOnlyPilotExitCriteria === "function"
        ? api("WeishanFlightWorkflowReadOnlyPilotExitCriteria").buildFlightWorkflowReadOnlyPilotExitCriteria(safe)
        : null
    );
  }
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
  function hasSecretRisk(value) {
    const safe = obj(value);
    const nested = obj(safe.safety);
    return safe.secretStored === true || safe.rawResponseStored === true || safe.rawUserTextStored === true ||
      nested.secretStored === true || nested.rawResponseStored === true || nested.rawUserTextStored === true ||
      typeof safe.token === "string" || typeof safe.apiKey === "string" || typeof safe.secret === "string" || typeof safe.password === "string" ||
      typeof nested.token === "string" || typeof nested.apiKey === "string" || typeof nested.secret === "string" || typeof nested.password === "string" ||
      obj(safe.rawProviderResponse) && Object.keys(obj(safe.rawProviderResponse)).length > 0 ||
      obj(safe.rawPayload) && Object.keys(obj(safe.rawPayload)).length > 0;
  }
  function buildFlightWorkflowRcEvidenceReviewRows(input) {
    return clone(evaluateFlightWorkflowRcEvidenceCompleteness(input || {}).rows || []);
  }
  function evaluateFlightWorkflowRcEvidenceCompleteness(input) {
    const safe = obj(input);
    const freezeGateSummary = freezeGateOf(safe);
    const evidenceFreezePackSummary = evidencePackOf(safe);
    const releaseReadinessSummary = releaseReadinessOf(safe);
    const launchCandidateReadinessSummary = launchCandidateOf(safe);
    const pilotExitCriteriaSummary = pilotExitCriteriaOf(safe);
    const values = [safe, freezeGateSummary, evidenceFreezePackSummary, releaseReadinessSummary, launchCandidateReadinessSummary, pilotExitCriteriaSummary];
    const evidenceCompleteness = {
      hasReleaseReadiness:Object.keys(releaseReadinessSummary).length > 0,
      hasLaunchCandidateSummary:Object.keys(launchCandidateReadinessSummary).length > 0,
      hasSafetySummary:Object.keys(evidenceFreezePackSummary).length > 0,
      hasPilotSummary:Object.keys(pilotExitCriteriaSummary).length > 0,
      hasFreezeDecision:Object.keys(obj(freezeGateSummary.freezeDecision)).length > 0 || text(freezeGateSummary.status) !== "",
      hasBlockedReasonReview:safe.hasBlockedReasonReview === true || toArray(freezeGateSummary.blockedReasons).length > 0 || toArray(evidenceFreezePackSummary.rows).length > 0,
      noSensitiveDataRisk:safe.noSensitiveDataRisk === false ? false : !values.some(hasSensitiveRisk),
      noSecretRisk:safe.noSecretRisk === false ? false : !values.some(hasSecretRisk),
      noTradingRisk:safe.noTradingRisk === false ? false : !values.some(hasTradingRisk)
    };
    const missingEvidence = [];
    if (!evidenceCompleteness.hasReleaseReadiness) missingEvidence.push("release_readiness");
    if (!evidenceCompleteness.hasLaunchCandidateSummary) missingEvidence.push("launch_candidate_summary");
    if (!evidenceCompleteness.hasSafetySummary) missingEvidence.push("safety_summary");
    if (!evidenceCompleteness.hasPilotSummary) missingEvidence.push("pilot_summary");
    if (!evidenceCompleteness.hasFreezeDecision) missingEvidence.push("freeze_decision");
    const reviewNotes = [];
    if (!evidenceCompleteness.hasBlockedReasonReview) reviewNotes.push("需要补充 blocked reason review");
    let status = "complete";
    if (!evidenceCompleteness.noSensitiveDataRisk || !evidenceCompleteness.noSecretRisk || !evidenceCompleteness.noTradingRisk) status = "blocked";
    else if (missingEvidence.length) status = "incomplete";
    else if (!evidenceCompleteness.hasBlockedReasonReview) status = "needs_review";
    return clone({
      checklistName:CHECKLIST_NAME,
      appVersion:FLIGHT_WORKFLOW_RC_EVIDENCE_REVIEW_CHECKLIST_VERSION,
      status:status,
      evidenceCompleteness:evidenceCompleteness,
      rows:[
        row("release_readiness", "发布就绪证据", evidenceCompleteness.hasReleaseReadiness ? "证据完整" : "证据仍需补充", evidenceCompleteness.hasReleaseReadiness ? "pass" : "warning"),
        row("launch_candidate", "候选复核证据", evidenceCompleteness.hasLaunchCandidateSummary ? "证据完整" : "证据仍需补充", evidenceCompleteness.hasLaunchCandidateSummary ? "pass" : "warning"),
        row("safety", "安全证据", evidenceCompleteness.hasSafetySummary ? "证据完整" : "证据仍需补充", evidenceCompleteness.hasSafetySummary ? "pass" : "warning"),
        row("pilot", "试点证据", evidenceCompleteness.hasPilotSummary ? "证据完整" : "证据仍需补充", evidenceCompleteness.hasPilotSummary ? "pass" : "warning"),
        row("freeze_decision", "冻结决策", evidenceCompleteness.hasFreezeDecision ? "证据完整" : "证据仍需补充", evidenceCompleteness.hasFreezeDecision ? "pass" : "warning"),
        row("blocked_reason_review", "阻断原因复核", evidenceCompleteness.hasBlockedReasonReview ? "已复核" : "需要复核", evidenceCompleteness.hasBlockedReasonReview ? "pass" : "warning"),
        row("safety_redline", "安全红线", evidenceCompleteness.noSensitiveDataRisk && evidenceCompleteness.noSecretRisk && evidenceCompleteness.noTradingRisk ? "安全红线正常" : "已阻断", evidenceCompleteness.noSensitiveDataRisk && evidenceCompleteness.noSecretRisk && evidenceCompleteness.noTradingRisk ? "pass" : "blocked")
      ],
      missingEvidence:missingEvidence,
      reviewNotes:reviewNotes,
      userFacingSummary:{
        title:"只读 RC 证据复核清单",
        resultLabel:status === "complete" ? "证据完整" : status === "incomplete" ? "证据仍需补充" : status === "needs_review" ? "需要复核" : "已阻断",
        caveat:CAVEAT,
        redacted:true
      },
      rcCopyFinalizationSummary:clone(safe.rcCopyFinalizationSummary || null),
      safetyDisclosureReviewSummary:clone(safe.safetyDisclosureReviewSummary || null),
      rcCopyReviewStatus:text(safe.rcCopyReviewStatus || safe.rcCopyFinalizationSummary && safe.rcCopyFinalizationSummary.status || ""),
      safetyDisclosureStatus:text(safe.safetyDisclosureStatus || safe.safetyDisclosureReviewSummary && safe.safetyDisclosureReviewSummary.status || ""),
      safeToFinalizeUserFacingCopy:safe.safeToFinalizeUserFacingCopy === true,
      freezeGateSummary:clone(freezeGateSummary),
      evidenceFreezePackSummary:clone(evidenceFreezePackSummary),
      releaseReadinessSummary:clone(releaseReadinessSummary),
      launchCandidateReadinessSummary:clone(launchCandidateReadinessSummary),
      pilotExitCriteriaSummary:clone(pilotExitCriteriaSummary),
      safety:safety(),
      redacted:true
    });
  }
  function sanitizeFlightWorkflowRcEvidenceReviewChecklist(checklist) {
    const safe = obj(checklist);
    const status = /^(complete|incomplete|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    const evidenceCompleteness = Object.assign({
      hasReleaseReadiness:false,
      hasLaunchCandidateSummary:false,
      hasSafetySummary:false,
      hasPilotSummary:false,
      hasFreezeDecision:false,
      hasBlockedReasonReview:false,
      noSensitiveDataRisk:false,
      noSecretRisk:false,
      noTradingRisk:false
    }, obj(safe.evidenceCompleteness));
    const summary = obj(safe.userFacingSummary);
    return clone({
      checklistName:CHECKLIST_NAME,
      appVersion:FLIGHT_WORKFLOW_RC_EVIDENCE_REVIEW_CHECKLIST_VERSION,
      status:status,
      evidenceCompleteness:evidenceCompleteness,
      rows:toArray(safe.rows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }),
      missingEvidence:toArray(safe.missingEvidence).map(text),
      reviewNotes:toArray(safe.reviewNotes).map(text),
      userFacingSummary:{
        title:"只读 RC 证据复核清单",
        resultLabel:summary.resultLabel || (status === "complete" ? "证据完整" : status === "incomplete" ? "证据仍需补充" : status === "needs_review" ? "需要复核" : "已阻断"),
        caveat:summary.caveat || CAVEAT,
        redacted:true
      },
      rcCopyFinalizationSummary:clone(safe.rcCopyFinalizationSummary || null),
      safetyDisclosureReviewSummary:clone(safe.safetyDisclosureReviewSummary || null),
      rcCopyReviewStatus:text(safe.rcCopyReviewStatus || ""),
      safetyDisclosureStatus:text(safe.safetyDisclosureStatus || ""),
      safeToFinalizeUserFacingCopy:safe.safeToFinalizeUserFacingCopy === true,
      freezeGateSummary:clone(safe.freezeGateSummary || null),
      evidenceFreezePackSummary:clone(safe.evidenceFreezePackSummary || null),
      releaseReadinessSummary:clone(safe.releaseReadinessSummary || null),
      launchCandidateReadinessSummary:clone(safe.launchCandidateReadinessSummary || null),
      pilotExitCriteriaSummary:clone(safe.pilotExitCriteriaSummary || null),
      safety:Object.assign(safety(), obj(safe.safety)),
      redacted:true
    });
  }
  function buildFlightWorkflowRcEvidenceReviewChecklist(input) {
    try {
      return sanitizeFlightWorkflowRcEvidenceReviewChecklist(evaluateFlightWorkflowRcEvidenceCompleteness(input || {}));
    } catch (error) {
      return sanitizeFlightWorkflowRcEvidenceReviewChecklist({
        status:"failed_safe",
        evidenceCompleteness:{},
        rows:[],
        missingEvidence:[],
        reviewNotes:["failed_safe"],
        userFacingSummary:{ title:"只读 RC 证据复核清单", resultLabel:"已阻断", caveat:CAVEAT, redacted:true }
      });
    }
  }
  function buildFlightWorkflowRcEvidenceReviewChecklistAuditDraft(input) {
    const checklist = buildFlightWorkflowRcEvidenceReviewChecklist(input || {});
    return clone({
      eventType:"FLIGHT_WORKFLOW_RC_EVIDENCE_REVIEW_CHECKLIST_AUDIT_DRAFT",
      checklistName:CHECKLIST_NAME,
      appVersion:FLIGHT_WORKFLOW_RC_EVIDENCE_REVIEW_CHECKLIST_VERSION,
      status:checklist.status,
      missingEvidenceCount:checklist.missingEvidence.length,
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

  window.WeishanFlightWorkflowRcEvidenceReviewChecklist = {
    FLIGHT_WORKFLOW_RC_EVIDENCE_REVIEW_CHECKLIST_VERSION,
    CHECKLIST_NAME,
    buildFlightWorkflowRcEvidenceReviewChecklist,
    evaluateFlightWorkflowRcEvidenceCompleteness,
    buildFlightWorkflowRcEvidenceReviewRows,
    buildFlightWorkflowRcEvidenceReviewChecklistAuditDraft,
    sanitizeFlightWorkflowRcEvidenceReviewChecklist
  };
})();
