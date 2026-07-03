;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SANDBOX_PRICE_CANDIDATE_RESULT_BOARD_VERSION = "4.0.7";
  const BOARD_NAME = "global_shopping_sandbox_price_candidate_result_board_v1";
  const CAVEAT = "当前仅展示只读 sandbox 候选结果，不代表真实价格、全网最低、最低价保证、锁价、可订、付款、下单或出票能力。";
  const FORBIDDEN_CLAIM_RE = /全网最低|最低价保证|已锁价|真实最终价|立即购买|直接下单|一键下单|一键出票/i;
  const FORBIDDEN_SECRET_RE = /token|apiKey|secret/i;
  const SAFE_NEGATION_RE = /不代表|不提供|禁止|不会|不打开|仅展示|只读/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function card(cardId, label, value) { return { cardId:text(cardId || "card"), label:text(label || ""), value:text(value || ""), redacted:true }; }
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
  function containsForbiddenValue(value) {
    if (typeof value === "string") {
      if (FORBIDDEN_SECRET_RE.test(value)) return true;
      return FORBIDDEN_CLAIM_RE.test(value) && !SAFE_NEGATION_RE.test(value);
    }
    if (Array.isArray(value)) return value.some(containsForbiddenValue);
    if (value && typeof value === "object") return Object.values(value).some(containsForbiddenValue);
    return false;
  }
  function buildGlobalShoppingSandboxPriceCandidateResultCards(input) {
    const safe = obj(input);
    const session = obj(safe.sandboxPriceCandidateSessionSummary || safe.sessionSummary);
    const official = obj(safe.officialPriceAnchorSummary || obj(obj(safe.pricePipelineOrchestratorSummary).officialPriceAnchorSummary));
    const coveredLowest = obj(safe.coveredLowestCandidateBoardSummary || obj(obj(safe.pricePipelineOrchestratorSummary).coveredLowestCandidateBoardSummary));
    const trust = obj(safe.readOnlySourceTrustScoreSummary || safe.sourceTrustSummary);
    const handoff = obj(safe.jumpToPlatformHandoffPreviewSummary || safe.handoffPreviewSummary);
    return clone([
      card("official_anchor", "官方参考价", statusOf(official) === "anchored" ? "官方参考价已就绪" : "仍需复核"),
      card("covered_lowest", "已覆盖来源较低候选价", statusOf(coveredLowest) === "ready" ? "已准备" : "仍需复核"),
      card("source_trust", "来源可信度", obj(obj(trust.userFacingSummary)).resultLabel || "仍需复核"),
      card("handoff_preview", "跳转预览", obj(obj(handoff.userFacingSummary)).resultLabel || "仍需复核")
    ]);
  }
  function buildGlobalShoppingSandboxPriceSessionRowsForView(input) {
    const session = obj(obj(input).sandboxPriceCandidateSessionSummary || obj(input).sessionSummary);
    const summary = obj(session.sessionSummary);
    return clone([
      row("session_mode", "会话模式", text(obj(session.sessionBoundary).sessionMode || "disabled"), "pass"),
      row("provider_connector", "Sandbox Provider Connector", summary.providerConnectorReady ? "已准备" : "仍需复核", summary.providerConnectorReady ? "pass" : "warning"),
      row("coverage", "来源覆盖", summary.coverageReady ? "已准备" : "仍需复核", summary.coverageReady ? "pass" : "warning"),
      row("source_trust", "来源可信度", summary.sourceTrustReady ? "已准备" : "仍需复核", summary.sourceTrustReady ? "pass" : "warning"),
      row("pipeline", "价格候选流水线", summary.pricePipelineReady ? "已准备" : "仍需复核", summary.pricePipelineReady ? "pass" : "warning")
    ]);
  }
  function buildGlobalShoppingSandboxPriceCandidateResultRows(input) {
    const session = obj(obj(input).sandboxPriceCandidateSessionSummary || obj(input).sessionSummary);
    const summary = obj(session.sessionSummary);
    return clone([
      row("official_count", "官方来源数", String(summary.officialSourceCount || 0), "pass"),
      row("authorized_count", "授权来源数", String(summary.authorizedSourceCount || 0), "pass"),
      row("partner_count", "合作来源数", String(summary.partnerSourceCount || 0), "pass"),
      row("affiliate_count", "联盟来源数", String(summary.affiliateSourceCount || 0), "pass"),
      row("aggregator_count", "聚合来源数", String(summary.aggregatorSourceCount || 0), "pass"),
      row("fixture_count", "Fixture 来源数", String(summary.fixtureSourceCount || 0), "pass"),
      row("covered_lowest", "已覆盖来源较低候选价", summary.hasCoveredLowestCandidate ? "已准备" : "仍需复核", summary.hasCoveredLowestCandidate ? "pass" : "warning")
    ]);
  }
  function sanitizeGlobalShoppingSandboxPriceCandidateResultBoard(board) {
    const safe = obj(board);
    const session = obj(safe.sandboxPriceCandidateSessionSummary || safe.sessionSummary);
    const official = obj(safe.officialPriceAnchorSummary || obj(obj(safe.pricePipelineOrchestratorSummary).officialPriceAnchorSummary));
    const coveredLowest = obj(safe.coveredLowestCandidateBoardSummary || obj(obj(safe.pricePipelineOrchestratorSummary).coveredLowestCandidateBoardSummary));
    const trust = obj(safe.readOnlySourceTrustScoreSummary || safe.sourceTrustSummary);
    const handoff = obj(safe.jumpToPlatformHandoffPreviewSummary || safe.handoffPreviewSummary);
    const blocked = containsForbiddenValue([
      safe.line,
      safe.label,
      safe.title,
      safe.message,
      safe.summary,
      obj(obj(session.userFacingSummary)).title,
      obj(obj(session.userFacingSummary)).resultLabel,
      obj(obj(session.userFacingSummary)).caveat,
      obj(obj(official.userFacingSummary)).title,
      obj(obj(official.userFacingSummary)).resultLabel,
      obj(obj(trust.userFacingSummary)).title,
      obj(obj(trust.userFacingSummary)).resultLabel,
      obj(obj(handoff.userFacingSummary)).title,
      obj(obj(handoff.userFacingSummary)).resultLabel,
      safe.caveat
    ]) ||
      typeof safe.bookingUrl === "string" ||
      typeof safe.checkoutUrl === "string" ||
      typeof safe.paymentUrl === "string" ||
      typeof safe.orderUrl === "string" ||
      safe.payment === true ||
      safe.order === true ||
      safe.ticketing === true ||
      safe.openExternal === true ||
      safe.windowOpen === true ||
      safe.autoOpen === true ||
      statusOf(session) === "blocked";
    const missingReview = !Object.keys(session).length || statusOf(official) !== "anchored" || statusOf(coveredLowest) !== "ready" || !Object.keys(trust).length || !Object.keys(handoff).length;
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : (blocked ? "blocked" : (missingReview ? "needs_review" : "ready"));
    return clone({
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_PRICE_CANDIDATE_RESULT_BOARD_VERSION,
      status:status,
      title:"Sandbox 价格候选结果",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingSandboxPriceCandidateResultCards(safe),
      sessionRows:toArray(safe.sessionRows).length ? toArray(safe.sessionRows) : buildGlobalShoppingSandboxPriceSessionRowsForView(safe),
      priceCandidateRows:toArray(safe.priceCandidateRows).length ? toArray(safe.priceCandidateRows) : buildGlobalShoppingSandboxPriceCandidateResultRows(safe),
      sourceTrustRows:toArray(safe.sourceTrustRows).length ? toArray(safe.sourceTrustRows) : [row("source_trust", "来源可信度", obj(obj(trust.userFacingSummary)).resultLabel || "仍需复核", statusOf(trust) === "ready" ? "pass" : "warning")],
      handoffRows:toArray(safe.handoffRows).length ? toArray(safe.handoffRows) : [row("handoff_preview", "跳转预览", obj(obj(handoff.userFacingSummary)).resultLabel || "仍需复核", statusOf(handoff) === "ready" ? "pass" : "warning")],
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("not_real_price", "Sandbox 结果不代表真实价格", "仅展示 fixture / dry-run / sandbox 结果", "pass"),
        row("not_lowest", "候选结果不代表全网最低", "不提供最低价保证", "pass"),
        row("not_ordering", "候选结果不代表下单能力", "不付款、不下单、不出票", "pass"),
        row("platform_truth", "价格以未来平台实时页面为准", "跳转预览不打开外部平台", "pass")
      ],
      caveat:CAVEAT,
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingSandboxPriceCandidateResultBoard(input) {
    try {
      return sanitizeGlobalShoppingSandboxPriceCandidateResultBoard(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingSandboxPriceCandidateResultBoard({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingSandboxPriceCandidateResultBoardAuditDraft(input) {
    const board = buildGlobalShoppingSandboxPriceCandidateResultBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_SANDBOX_PRICE_CANDIDATE_RESULT_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_PRICE_CANDIDATE_RESULT_BOARD_VERSION,
      status:board.status,
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

  window.WeishanGlobalShoppingSandboxPriceCandidateResultBoard = {
    GLOBAL_SHOPPING_SANDBOX_PRICE_CANDIDATE_RESULT_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingSandboxPriceCandidateResultBoard,
    buildGlobalShoppingSandboxPriceCandidateResultCards,
    buildGlobalShoppingSandboxPriceCandidateResultRows,
    buildGlobalShoppingSandboxPriceSessionRowsForView,
    buildGlobalShoppingSandboxPriceCandidateResultBoardAuditDraft,
    sanitizeGlobalShoppingSandboxPriceCandidateResultBoard
  };
})();
