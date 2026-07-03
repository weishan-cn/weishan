;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_LAUNCH_CANDIDATE_FREEZE_VIEW_MODEL_VERSION = "4.0.8";
  const VIEW_MODEL_NAME = "flight_workflow_launch_candidate_freeze_view_model_v1";
  const CAVEAT = "该页面只用于只读发布候选冻结判断，不保存真实身份、不发送真实邀请、不提供交易能力。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|身份证|护照|银行卡|passport/ig, "redacted")
      .trim();
  }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function card(cardId, label, value) { return { cardId:text(cardId || "card"), label:text(label), value:text(value), redacted:true }; }
  function row(rowId, label, value, status) { return { rowId:text(rowId || "row"), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function api(name) { return window[name] || {}; }
  function freezeGateOf(input) {
    const safe = obj(input);
    if (safe.freezeGateSummary) return safe.freezeGateSummary;
    const loaded = api("WeishanFlightWorkflowReadOnlyLaunchCandidateFreezeGate");
    return typeof loaded.buildFlightWorkflowReadOnlyLaunchCandidateFreezeGate === "function" ? loaded.buildFlightWorkflowReadOnlyLaunchCandidateFreezeGate(safe) : {};
  }
  function evidencePackOf(input) {
    const safe = obj(input);
    if (safe.evidenceFreezePackSummary) return safe.evidenceFreezePackSummary;
    const loaded = api("WeishanFlightWorkflowEvidenceFreezePack");
    return typeof loaded.buildFlightWorkflowEvidenceFreezePack === "function" ? loaded.buildFlightWorkflowEvidenceFreezePack(safe) : {};
  }
  function launchCandidateOf(input) {
    const safe = obj(input);
    if (safe.launchCandidateReadinessSummary) return safe.launchCandidateReadinessSummary;
    const loaded = api("WeishanFlightWorkflowLaunchCandidateReadinessBoard");
    return typeof loaded.buildFlightWorkflowLaunchCandidateReadinessBoard === "function" ? loaded.buildFlightWorkflowLaunchCandidateReadinessBoard(safe) : {};
  }
  function buildFreezeGateRowsForView(input) {
    const gate = freezeGateOf(input || {});
    return toArray(gate.rows).length ? clone(gate.rows) : [
      row("pilot_exit_criteria", "试点退出条件", gate.freezeDecision && gate.freezeDecision.safeToFreeze ? "试点退出条件已满足" : "继续试点观察", gate.freezeDecision && gate.freezeDecision.safeToFreeze ? "pass" : "warning"),
      row("freeze_status", "冻结状态", gate.status === "frozen" ? "已冻结只读发布候选" : gate.status === "ready_to_freeze" ? "准备冻结只读发布候选" : "继续试点观察", gate.status === "frozen" ? "pass" : (gate.status === "blocked" ? "blocked" : "warning"))
    ];
  }
  function buildEvidencePackRowsForView(input) {
    const pack = evidencePackOf(input || {});
    return toArray(pack.rows).length ? clone(pack.rows) : [
      row("release_readiness", "发布就绪", pack.releaseReady ? "发布就绪" : "需要复核", pack.releaseReady ? "pass" : "warning"),
      row("launch_candidate", "发布候选", pack.launchCandidateReady ? "发布候选已准备" : "继续试点观察", pack.launchCandidateReady ? "pass" : "warning")
    ];
  }
  function buildRiskRows(input) {
    const gate = freezeGateOf(input || {});
    const pack = evidencePackOf(input || {});
    return [
      row("safety", "安全红线", gate.status === "blocked" || pack.status === "blocked" ? "已阻断" : "安全红线正常", gate.status === "blocked" || pack.status === "blocked" ? "blocked" : "pass"),
      row("next_step", "下一步", gate.freezeGateNextStep || pack.freezePackNextStep || "继续试点观察", gate.status === "frozen" || pack.status === "ready" ? "pass" : (gate.status === "blocked" || pack.status === "blocked" ? "blocked" : "warning"))
    ];
  }
  function sanitizeFlightWorkflowLaunchCandidateFreezeViewModel(vm) {
    const safe = obj(vm);
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:FLIGHT_WORKFLOW_LAUNCH_CANDIDATE_FREEZE_VIEW_MODEL_VERSION,
      status:text(safe.status || "needs_review"),
      title:"只读发布候选冻结检查",
      cards:toArray(safe.cards).map(function (item) { return card(item.cardId || "card", item.label || "", item.value || ""); }),
      freezeGateRows:toArray(safe.freezeGateRows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }),
      evidencePackRows:toArray(safe.evidencePackRows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }),
      riskRows:toArray(safe.riskRows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }),
      caveat:text(safe.caveat || CAVEAT),
      freezeGateSummary:clone(safe.freezeGateSummary || null),
      evidenceFreezePackSummary:clone(safe.evidenceFreezePackSummary || null),
      pilotExitCriteriaSummary:clone(safe.pilotExitCriteriaSummary || null),
      launchCandidateReadinessSummary:clone(safe.launchCandidateReadinessSummary || null),
      rcCandidateReviewSummary:clone(safe.rcCandidateReviewSummary || null),
      rcEvidenceReviewSummary:clone(safe.rcEvidenceReviewSummary || null),
      rcReviewStatus:text(safe.rcReviewStatus || (obj(safe.rcCandidateReviewSummary).status || obj(safe.freezeGateSummary).rcReviewStatus || obj(safe.evidenceFreezePackSummary).rcReviewStatus || "")),
      rcEvidenceStatus:text(safe.rcEvidenceStatus || (obj(safe.rcEvidenceReviewSummary).status || obj(safe.freezeGateSummary).rcEvidenceStatus || obj(safe.evidenceFreezePackSummary).rcEvidenceStatus || "")),
      safeToStartRcReview:safe.safeToStartRcReview === true || obj(safe.rcCandidateReviewSummary).safeToStartRcReview === true || obj(safe.freezeGateSummary).safeToStartRcReview === true || obj(safe.evidenceFreezePackSummary).safeToStartRcReview === true,
      bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true
    });
  }
  function buildFlightWorkflowLaunchCandidateFreezeViewModel(input) {
    try {
      const gate = freezeGateOf(input || {});
      const pack = evidencePackOf(input || {});
      const launchCandidate = launchCandidateOf(input || {});
      const status = gate.status === "blocked" || pack.status === "blocked" ? "blocked" : (gate.status === "frozen" ? "frozen" : (gate.status === "ready_to_freeze" || pack.status === "ready" ? "ready_to_freeze" : (gate.status === "needs_review" || pack.status === "needs_review" ? "needs_review" : "continue_pilot")));
      return sanitizeFlightWorkflowLaunchCandidateFreezeViewModel({
        status:status,
        title:"只读发布候选冻结检查",
        cards:buildFlightWorkflowLaunchCandidateFreezeCards(input || {}),
        freezeGateRows:buildFreezeGateRowsForView(input || {}),
        evidencePackRows:buildEvidencePackRowsForView(input || {}),
        riskRows:buildRiskRows(input || {}),
        caveat:CAVEAT,
        freezeGateSummary:gate,
        evidenceFreezePackSummary:pack,
        pilotExitCriteriaSummary:gate.pilotExitCriteriaSummary || launchCandidate.pilotExitCriteriaSummary || null,
        launchCandidateReadinessSummary:gate.launchCandidateReadinessSummary || launchCandidate,
        rcCandidateReviewSummary:input && input.rcCandidateReviewSummary || null,
        rcEvidenceReviewSummary:input && input.rcEvidenceReviewSummary || null,
        rcReviewStatus:input && input.rcReviewStatus || gate.rcReviewStatus || pack.rcReviewStatus || "",
        rcEvidenceStatus:input && input.rcEvidenceStatus || gate.rcEvidenceStatus || pack.rcEvidenceStatus || "",
        safeToStartRcReview:input && input.safeToStartRcReview === true || gate.safeToStartRcReview === true || pack.safeToStartRcReview === true,
        redacted:true
      });
    } catch (error) {
      return sanitizeFlightWorkflowLaunchCandidateFreezeViewModel({ status:"failed_safe", title:"只读发布候选冻结检查", cards:[], freezeGateRows:[], evidencePackRows:[], riskRows:[], caveat:CAVEAT });
    }
  }
  function buildFlightWorkflowLaunchCandidateFreezeCards(input) {
    const gate = freezeGateOf(input || {});
    const pack = evidencePackOf(input || {});
    return clone([
      card("freeze_gate", "冻结状态", obj(gate.userFacingSummary).resultLabel || "继续试点观察"),
      card("evidence_pack", "证据包", obj(pack.userFacingSummary).resultLabel || "证据冻结仍需复核"),
      card("safety", "安全红线", gate.status === "blocked" || pack.status === "blocked" ? "已阻断" : "安全红线正常"),
      card("next_step", "下一步", gate.freezeGateNextStep || pack.freezePackNextStep || "继续试点观察")
    ]);
  }
  function buildFlightWorkflowLaunchCandidateFreezeViewModelAuditDraft(input) {
    const vm = buildFlightWorkflowLaunchCandidateFreezeViewModel(input || {});
    return clone({
      eventType:"FLIGHT_WORKFLOW_LAUNCH_CANDIDATE_FREEZE_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:FLIGHT_WORKFLOW_LAUNCH_CANDIDATE_FREEZE_VIEW_MODEL_VERSION,
      status:vm.status,
      cardCount:vm.cards.length,
      freezeGateRowCount:vm.freezeGateRows.length,
      evidencePackRowCount:vm.evidencePackRows.length,
      riskRowCount:vm.riskRows.length,
      bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false, secretStored:false,
      fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true
    });
  }

  window.WeishanFlightWorkflowLaunchCandidateFreezeViewModel = {
    FLIGHT_WORKFLOW_LAUNCH_CANDIDATE_FREEZE_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildFlightWorkflowLaunchCandidateFreezeViewModel,
    buildFlightWorkflowLaunchCandidateFreezeCards,
    buildFlightWorkflowLaunchCandidateFreezeViewModelAuditDraft,
    buildFlightWorkflowLaunchCandidateFreezeRowsForView:buildFreezeGateRowsForView,
    buildFlightWorkflowEvidenceFreezePackRowsForView:buildEvidencePackRowsForView,
    sanitizeFlightWorkflowLaunchCandidateFreezeViewModel
  };
})();
