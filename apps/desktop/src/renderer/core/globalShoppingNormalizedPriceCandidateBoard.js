;(function () {
  "use strict";

  const GLOBAL_SHOPPING_NORMALIZED_PRICE_CANDIDATE_BOARD_VERSION = "2.3.9";
  const BOARD_NAME = "global_shopping_normalized_price_candidate_board_v1";

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
  function card(cardId, label, value) { return { cardId:text(cardId || "card"), label:text(label || ""), value:text(value || ""), redacted:true }; }
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
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function collectDisplayCopy(value) {
    const safe = obj(value);
    const parts = [safe.title, safe.caveat];
    ["cards", "connectorRows", "replayRows", "normalizedPriceRows", "pipelineRows", "disclosureRows"].forEach(function (key) {
      toArray(safe[key]).forEach(function (item) {
        parts.push(obj(item).label, obj(item).value, obj(item).message);
      });
    });
    return parts.map(text).filter(Boolean).join(" ");
  }
  function hasUnsafe(summary) {
    const safe = obj(summary);
    const summarySafety = obj(safe.safety);
    return safe.payment === true || safe.order === true || safe.ticketing === true || safe.rawResponseStored === true || safe.secretStored === true || safe.autoOpen === true || safe.openExternal === true || summarySafety.payment === true || summarySafety.order === true || summarySafety.ticketing === true || summarySafety.rawResponseStored === true || summarySafety.secretStored === true || summarySafety.autoOpen === true || summarySafety.openExternal === true || typeof safe.bookingUrl === "string" && safe.bookingUrl.trim() || typeof safe.checkoutUrl === "string" && safe.checkoutUrl.trim() || typeof safe.paymentUrl === "string" && safe.paymentUrl.trim() || typeof safe.orderUrl === "string" && safe.orderUrl.trim();
  }
  function buildGlobalShoppingNormalizedPriceCandidateCards(input) {
    const safe = obj(input);
    const connectorSummary = obj(safe.readOnlyProviderSandboxConnectorSummary);
    const replaySummary = obj(safe.fixtureReplayConsoleSummary);
    const officialAnchorSummary = obj(safe.officialPriceAnchorSummary);
    const coveredLowestSummary = obj(safe.coveredLowestCandidateBoardSummary);
    return clone([
      card("provider_connector", "Provider Connector", obj(obj(connectorSummary).userFacingSummary).resultLabel || "只读 Provider Connector 仍需复核"),
      card("fixture_replay", "Fixture 回放", obj(obj(replaySummary).userFacingSummary).resultLabel || "Fixture 回放仍需复核"),
      card("official_anchor", "官方参考价", obj(obj(officialAnchorSummary).userFacingSummary).resultLabel || "官方价仍需复核"),
      card("covered_lowest", "已覆盖来源较低候选价", obj(obj(coveredLowestSummary).userFacingSummary).resultLabel || "当前仅比较已覆盖来源中的候选价")
    ]);
  }
  function buildGlobalShoppingFixtureReplayRowsForView(input) {
    const safe = obj(input);
    const replaySummary = obj(safe.fixtureReplayConsoleSummary);
    return clone(toArray(replaySummary.rows).length ? toArray(replaySummary.rows) : [
      row("fixture_replay", "Fixture 回放", obj(obj(replaySummary).userFacingSummary).resultLabel || "Fixture 回放仍需复核", statusOf(replaySummary) === "ready" ? "pass" : "warning")
    ]);
  }
  function buildGlobalShoppingNormalizedPriceCandidateRows(input) {
    const safe = obj(input);
    const officialAnchorSummary = obj(safe.officialPriceAnchorSummary);
    const coveredLowestSummary = obj(safe.coveredLowestCandidateBoardSummary);
    const priceCandidateDisplaySummary = obj(safe.priceCandidateDisplaySummary);
    return clone([
      row("official_anchor", "官方参考价", obj(obj(officialAnchorSummary).userFacingSummary).resultLabel || "官方价仍需复核", statusOf(officialAnchorSummary) === "anchored" ? "pass" : "warning"),
      row("covered_lowest", "已覆盖来源较低候选价", obj(obj(coveredLowestSummary).userFacingSummary).resultLabel || "当前仅比较已覆盖来源中的候选价", statusOf(coveredLowestSummary) === "ready" ? "pass" : "warning"),
      row("candidate_display", "来源与可信度", obj(priceCandidateDisplaySummary).title || "归一化候选展示仍需复核", statusOf(priceCandidateDisplaySummary) === "ready" ? "pass" : "warning"),
      row("fees_status", "税费/运费/服务费状态", "仅展示归一化状态，不代表真实平台最终费用", "pass")
    ]);
  }
  function sanitizeGlobalShoppingNormalizedPriceCandidateBoard(board) {
    const safe = obj(board);
    const connectorSummary = obj(safe.readOnlyProviderSandboxConnectorSummary);
    const replaySummary = obj(safe.fixtureReplayConsoleSummary);
    const pipelineSummary = obj(safe.pricePipelineOrchestratorSummary);
    const officialAnchorSummary = obj(safe.officialPriceAnchorSummary);
    const coveredLowestSummary = obj(safe.coveredLowestCandidateBoardSummary);
    const displaySummary = obj(safe.priceCandidateDisplaySummary);
    const forbiddenCopy = /全网最低|最低价保证|锁价|真实最终价|立即购买|直接下单|一键下单|一键出票/i.test(collectDisplayCopy(safe));
    const unsafe = forbiddenCopy || hasUnsafe(safe) || hasUnsafe(connectorSummary) || hasUnsafe(replaySummary) || hasUnsafe(pipelineSummary) || hasUnsafe(officialAnchorSummary) || hasUnsafe(coveredLowestSummary) || hasUnsafe(displaySummary);
    const blocked = unsafe || statusOf(connectorSummary) === "blocked" || statusOf(replaySummary) === "blocked" || statusOf(pipelineSummary) === "blocked";
    const needsReview = !blocked && (!Object.keys(connectorSummary).length || !Object.keys(replaySummary).length || !Object.keys(pipelineSummary).length);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : (blocked ? "blocked" : (needsReview ? "needs_review" : "ready"));
    return clone({
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_NORMALIZED_PRICE_CANDIDATE_BOARD_VERSION,
      status:status,
      title:"归一化价格候选板",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingNormalizedPriceCandidateCards(safe),
      connectorRows:toArray(safe.connectorRows).length ? toArray(safe.connectorRows) : toArray(connectorSummary.rows),
      replayRows:toArray(safe.replayRows).length ? toArray(safe.replayRows) : buildGlobalShoppingFixtureReplayRowsForView(safe),
      normalizedPriceRows:toArray(safe.normalizedPriceRows).length ? toArray(safe.normalizedPriceRows) : buildGlobalShoppingNormalizedPriceCandidateRows(safe),
      pipelineRows:toArray(safe.pipelineRows).length ? toArray(safe.pipelineRows) : toArray(pipelineSummary.pipelineStages || []),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("read_only_only", "当前仅展示只读 fixture/sandbox 归一化候选", "不请求真实平台，不代表真实价格、锁价、最低价、付款、下单或出票能力", "pass"),
        row("replay_notice", "Replay 不代表真实 provider 调用", "仅用于本地验证价格流水线", "pass"),
        row("connector_notice", "Connector 不读取生产密钥", "不联网、不保存 raw provider response", "pass"),
        row("board_notice", "价格候选板不代表下单能力", "跳转仍 disabled", "pass")
      ],
      caveat:"当前仅展示只读 fixture/sandbox 归一化候选，不请求真实平台，不代表真实价格、锁价、最低价、付款、下单或出票能力。",
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingNormalizedPriceCandidateBoard(input) {
    try {
      return sanitizeGlobalShoppingNormalizedPriceCandidateBoard(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingNormalizedPriceCandidateBoard({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingNormalizedPriceCandidateBoardAuditDraft(input) {
    const board = buildGlobalShoppingNormalizedPriceCandidateBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_NORMALIZED_PRICE_CANDIDATE_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_NORMALIZED_PRICE_CANDIDATE_BOARD_VERSION,
      status:board.status,
      cardCount:board.cards.length,
      connectorRowCount:board.connectorRows.length,
      replayRowCount:board.replayRows.length,
      normalizedRowCount:board.normalizedPriceRows.length,
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

  window.WeishanGlobalShoppingNormalizedPriceCandidateBoard = {
    GLOBAL_SHOPPING_NORMALIZED_PRICE_CANDIDATE_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingNormalizedPriceCandidateBoard,
    buildGlobalShoppingNormalizedPriceCandidateCards,
    buildGlobalShoppingNormalizedPriceCandidateRows,
    buildGlobalShoppingFixtureReplayRowsForView,
    buildGlobalShoppingNormalizedPriceCandidateBoardAuditDraft,
    sanitizeGlobalShoppingNormalizedPriceCandidateBoard
  };
})();
