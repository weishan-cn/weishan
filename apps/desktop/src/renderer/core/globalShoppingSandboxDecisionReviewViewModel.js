;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SANDBOX_DECISION_REVIEW_VIEW_MODEL_VERSION = "4.1.7";
  const VIEW_MODEL_NAME = "global_shopping_sandbox_decision_review_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId || "row"), label:text(label || ""), value:text(value || ""), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
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
      sensitiveStored:false,
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
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function buildGlobalShoppingSandboxDecisionReviewCards(input) {
    const safe = obj(input);
    const comparison = obj(safe.sandboxCandidateComparisonWorkbench);
    const matrix = obj(safe.providerEvidenceComparisonMatrix);
    const drill = obj(safe.readOnlyHandoffReadinessDrill);
    return clone([
      { cardId:"candidate_comparison", label:"候选对比", value:text(obj(obj(comparison.userFacingSummary)).resultLabel || "候选对比仍需复核"), redacted:true },
      { cardId:"evidence_matrix", label:"证据矩阵", value:text(obj(obj(matrix.userFacingSummary)).resultLabel || "证据矩阵仍需复核"), redacted:true },
      { cardId:"handoff_drill", label:"交接演练", value:text(obj(obj(drill.userFacingSummary)).resultLabel || "交接演练仍需复核"), redacted:true },
      { cardId:"next_step", label:"下一步", value:text(obj(obj(comparison.recommendationSummary)).reason || "继续补充候选与证据后复核"), redacted:true }
    ]);
  }
  function buildGlobalShoppingSandboxDecisionReviewRows(input) {
    return clone(toArray(obj(obj(input).sandboxCandidateComparisonWorkbench).candidateRows).map(function (item) {
      return row(item.candidateId, item.sourceName + " / " + item.confidenceLabel, item.caveat || item.recommendationLabel, item.confidenceLabel === "high" ? "pass" : "warning");
    }));
  }
  function buildGlobalShoppingEvidenceMatrixRowsForView(input) {
    return clone(toArray(obj(obj(input).providerEvidenceComparisonMatrix).matrixRows).map(function (item) {
      return row(item.candidateId, item.sourceName + " / 证据矩阵", item.caveat || "当前矩阵只展示脱敏 sandbox 证据摘要。", item.completenessLabel === "完整" ? "pass" : "warning");
    }));
  }
  function buildGlobalShoppingHandoffDrillRowsForView(input) {
    return clone(toArray(obj(obj(input).readOnlyHandoffReadinessDrill).rows).map(function (item) {
      return row(item.rowId, item.label, item.value, item.status);
    }));
  }
  function sanitizeGlobalShoppingSandboxDecisionReviewViewModel(viewModel) {
    const safe = obj(viewModel);
    const comparison = obj(safe.sandboxCandidateComparisonWorkbench);
    const matrix = obj(safe.providerEvidenceComparisonMatrix);
    const drill = obj(safe.readOnlyHandoffReadinessDrill);
    const blocked = statusOf(comparison) === "blocked" || statusOf(matrix) === "blocked" || statusOf(drill) === "blocked" || safe.realEndpointDetected === true || safe.hasRealApiKey === true || safe.networkEnabled === true || safe.rawResponseStored === true || typeof safe.bookingUrl === "string" || typeof safe.checkoutUrl === "string" || typeof safe.paymentUrl === "string" || typeof safe.orderUrl === "string" || safe.payment === true || safe.order === true || safe.ticketing === true || safe.openExternal === true || safe.download === true || safe.fileWrite === true;
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : (blocked ? "blocked" : (!Object.keys(comparison).length || !Object.keys(matrix).length || !Object.keys(drill).length ? "needs_review" : "ready"));
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_DECISION_REVIEW_VIEW_MODEL_VERSION,
      status:status,
      title:"Sandbox 候选决策复核",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingSandboxDecisionReviewCards(safe),
      comparisonRows:toArray(safe.comparisonRows).length ? toArray(safe.comparisonRows) : buildGlobalShoppingSandboxDecisionReviewRows(safe),
      evidenceMatrixRows:toArray(safe.evidenceMatrixRows).length ? toArray(safe.evidenceMatrixRows) : buildGlobalShoppingEvidenceMatrixRowsForView(safe),
      handoffDrillRows:toArray(safe.handoffDrillRows).length ? toArray(safe.handoffDrillRows) : buildGlobalShoppingHandoffDrillRowsForView(safe),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("comparison_ready", "候选对比", "候选推荐不代表最低价保证", "pass"),
        row("matrix_ready", "证据矩阵", "当前仅用于复核 sandbox 候选", "pass"),
        row("handoff_ready", "交接演练", "参数预览不包含身份或支付信息", "pass"),
        row("decision_review", "下一步", "决策复核不代表下单能力", "pass")
      ],
      caveat:"当前仅用于复核 sandbox 候选，不代表真实价格、全网最低、锁价、可订、付款、下单或出票能力。",
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingSandboxDecisionReviewViewModel(input) {
    try {
      return sanitizeGlobalShoppingSandboxDecisionReviewViewModel(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingSandboxDecisionReviewViewModel({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingSandboxDecisionReviewViewModelAuditDraft(input) {
    const model = buildGlobalShoppingSandboxDecisionReviewViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_SANDBOX_DECISION_REVIEW_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_DECISION_REVIEW_VIEW_MODEL_VERSION,
      status:model.status,
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
      sensitiveStored:false,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingSandboxDecisionReviewViewModel = {
    GLOBAL_SHOPPING_SANDBOX_DECISION_REVIEW_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingSandboxDecisionReviewViewModel,
    buildGlobalShoppingSandboxDecisionReviewCards,
    buildGlobalShoppingSandboxDecisionReviewRows,
    buildGlobalShoppingEvidenceMatrixRowsForView,
    buildGlobalShoppingHandoffDrillRowsForView,
    buildGlobalShoppingSandboxDecisionReviewViewModelAuditDraft,
    sanitizeGlobalShoppingSandboxDecisionReviewViewModel
  };
})();
