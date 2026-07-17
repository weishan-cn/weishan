;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SANDBOX_REPLAY_VIEW_MODEL_VERSION = "4.2.8";
  const VIEW_MODEL_NAME = "global_shopping_sandbox_replay_view_model_v1";

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
  function buildGlobalShoppingSandboxReplayCards(input) {
    const safe = obj(input);
    const replay = obj(safe.sandboxSessionReplayCenter);
    const trace = obj(safe.providerEvidenceTrace);
    const confidence = obj(safe.candidateConfidenceExplainer);
    return clone([
      { cardId:"session_replay", label:"会话回放", value:obj(obj(replay.userFacingSummary)).resultLabel || "Sandbox 会话回放仍需复核", redacted:true },
      { cardId:"evidence_trace", label:"Provider 证据链", value:obj(obj(trace.userFacingSummary)).resultLabel || "Provider 证据链仍需复核", redacted:true },
      { cardId:"confidence_explainer", label:"可信度解释", value:obj(obj(confidence.userFacingSummary)).resultLabel || "候选价可信度仍需复核", redacted:true },
      { cardId:"next_step", label:"下一步", value:safe.safeToProceedWithReadOnlySandboxUserExplanation === true ? "继续只读用户解释链路" : "继续补充回放与证据说明", redacted:true }
    ]);
  }
  function buildGlobalShoppingSandboxReplayRows(input) {
    return clone(toArray(obj(obj(input).sandboxSessionReplayCenter).rows).map(function (item) {
      return row(item.rowId, item.label, item.value, item.status);
    }));
  }
  function buildGlobalShoppingProviderEvidenceRowsForView(input) {
    return clone(toArray(obj(obj(input).providerEvidenceTrace).rows).map(function (item) {
      return row(item.rowId, item.label, item.value, item.status);
    }));
  }
  function buildGlobalShoppingCandidateConfidenceRowsForView(input) {
    return clone(toArray(obj(obj(input).candidateConfidenceExplainer).rows).map(function (item) {
      return row(item.rowId, item.label, item.value, item.status);
    }));
  }
  function evaluateStatus(input) {
    const safe = obj(input);
    const replay = obj(safe.sandboxSessionReplayCenter);
    const trace = obj(safe.providerEvidenceTrace);
    const confidence = obj(safe.candidateConfidenceExplainer);
    const blocked = statusOf(replay) === "blocked" || statusOf(trace) === "blocked" || statusOf(confidence) === "blocked" || safe.realEndpointDetected === true || safe.hasRealApiKey === true || safe.networkEnabled === true || safe.rawResponseStored === true || typeof safe.bookingUrl === "string" || typeof safe.checkoutUrl === "string" || typeof safe.paymentUrl === "string" || typeof safe.orderUrl === "string" || safe.payment === true || safe.order === true || safe.ticketing === true || safe.openExternal === true || safe.download === true || safe.fileWrite === true;
    if (blocked) return "blocked";
    if (!Object.keys(replay).length || !Object.keys(trace).length || !Object.keys(confidence).length) return "needs_review";
    return "ready";
  }
  function sanitizeGlobalShoppingSandboxReplayViewModel(viewModel) {
    const safe = obj(viewModel);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluateStatus(safe);
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_REPLAY_VIEW_MODEL_VERSION,
      status:status,
      title:"Sandbox 会话回放与证据解释",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingSandboxReplayCards(safe),
      replayRows:toArray(safe.replayRows).length ? toArray(safe.replayRows) : buildGlobalShoppingSandboxReplayRows(safe),
      evidenceRows:toArray(safe.evidenceRows).length ? toArray(safe.evidenceRows) : buildGlobalShoppingProviderEvidenceRowsForView(safe),
      confidenceRows:toArray(safe.confidenceRows).length ? toArray(safe.confidenceRows) : buildGlobalShoppingCandidateConfidenceRowsForView(safe),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("replay_boundary", "会话回放", "回放不代表真实平台查询", "pass"),
        row("trace_boundary", "Provider 证据链", "证据链不包含 raw response", "pass"),
        row("confidence_boundary", "可信度解释", "可信度不代表最低价保证", "pass"),
        row("ordering_boundary", "下单边界", "可信度不代表可订或可下单", "pass")
      ],
      caveat:"当前仅展示脱敏 sandbox 会话回放和证据解释，不代表真实平台查询、真实价格、全网最低、锁价、可订、付款、下单或出票能力。",
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingSandboxReplayViewModel(input) {
    try {
      return sanitizeGlobalShoppingSandboxReplayViewModel(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingSandboxReplayViewModel({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingSandboxReplayViewModelAuditDraft(input) {
    const model = buildGlobalShoppingSandboxReplayViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_SANDBOX_REPLAY_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_REPLAY_VIEW_MODEL_VERSION,
      status:model.status,
      cardCount:model.cards.length,
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

  window.WeishanGlobalShoppingSandboxReplayViewModel = {
    GLOBAL_SHOPPING_SANDBOX_REPLAY_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingSandboxReplayViewModel,
    buildGlobalShoppingSandboxReplayCards,
    buildGlobalShoppingSandboxReplayRows,
    buildGlobalShoppingProviderEvidenceRowsForView,
    buildGlobalShoppingCandidateConfidenceRowsForView,
    buildGlobalShoppingSandboxReplayViewModelAuditDraft,
    sanitizeGlobalShoppingSandboxReplayViewModel
  };
})();