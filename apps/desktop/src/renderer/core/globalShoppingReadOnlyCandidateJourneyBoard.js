;(function () {
  "use strict";

  const GLOBAL_SHOPPING_READ_ONLY_CANDIDATE_JOURNEY_BOARD_VERSION = "4.1.0";
  const BOARD_NAME = "global_shopping_read_only_candidate_journey_board_v1";

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
  function truthyUrl(value) { return typeof value === "string" && value.trim().length > 0; }
  function collectDisplayCopy(value) {
    const safe = obj(value);
    const pieces = [
      safe.title,
      safe.note,
      safe.summary,
      safe.description,
      safe.caveat,
      obj(safe.userFacingSummary).title,
      obj(safe.userFacingSummary).resultLabel,
      obj(safe.userFacingSummary).caveat
    ];
    toArray(safe.cards).forEach(function (item) {
      pieces.push(obj(item).label, obj(item).value);
    });
    toArray(safe.journeyRows).forEach(function (item) {
      pieces.push(obj(item).label, obj(item).value);
    });
    toArray(safe.pipelineStageRows).forEach(function (item) {
      pieces.push(obj(item).label, obj(item).value, obj(item).message);
    });
    toArray(safe.disclosureRows).forEach(function (item) {
      pieces.push(obj(item).label, obj(item).value);
    });
    toArray(safe.nextStepRows).forEach(function (item) {
      pieces.push(obj(item).label, obj(item).value);
    });
    return pieces.map(text).filter(Boolean).join(" ");
  }
  function hasUnsafeBoundary(summary) {
    const safe = obj(summary);
    const safetySummary = obj(safe.safety);
    return truthyUrl(safe.bookingUrl) ||
      truthyUrl(safe.checkoutUrl) ||
      truthyUrl(safe.paymentUrl) ||
      truthyUrl(safe.orderUrl) ||
      truthyUrl(safetySummary.bookingUrl) ||
      truthyUrl(safetySummary.checkoutUrl) ||
      truthyUrl(safetySummary.paymentUrl) ||
      truthyUrl(safetySummary.orderUrl) ||
      safe.payment === true ||
      safe.order === true ||
      safe.ticketing === true ||
      safe.autoOpen === true ||
      safe.openExternal === true ||
      safetySummary.payment === true ||
      safetySummary.order === true ||
      safetySummary.ticketing === true ||
      safetySummary.autoOpen === true ||
      safetySummary.openExternal === true ||
      safe.rawResponseStored === true ||
      safetySummary.rawResponseStored === true ||
      safe.secretStored === true ||
      safetySummary.secretStored === true;
  }
  function linkedSummary(summary) {
    const safe = obj(summary);
    return clone({
      status:text(safe.status || ""),
      title:text(safe.title || ""),
      userFacingSummary:{
        title:text(obj(safe.userFacingSummary).title || ""),
        resultLabel:text(obj(safe.userFacingSummary).resultLabel || ""),
        caveat:text(obj(safe.userFacingSummary).caveat || ""),
        redacted:true
      },
      redacted:true
    });
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
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    }, obj(overrides));
  }
  function api(name) { return window[name] || {}; }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function resolvePipeline(input) {
    const safe = obj(input);
    if (Object.keys(obj(safe.pricePipelineOrchestratorSummary)).length) return obj(safe.pricePipelineOrchestratorSummary);
    const orchestratorApi = api("WeishanGlobalShoppingPricePipelineOrchestrator");
    return typeof orchestratorApi.buildGlobalShoppingPricePipelineOrchestrator === "function" ? orchestratorApi.buildGlobalShoppingPricePipelineOrchestrator(safe) : {};
  }
  function buildGlobalShoppingReadOnlyCandidateJourneyCards(input) {
    const safe = obj(input);
    const pipeline = resolvePipeline(safe);
    const connectorSummary = obj(safe.readOnlyProviderSandboxConnectorSummary || pipeline.readOnlyProviderSandboxConnectorSummary);
    const replaySummary = obj(safe.fixtureReplayConsoleSummary || pipeline.fixtureReplayConsoleSummary);
    const coveredLowest = obj(safe.coveredLowestCandidateBoardSummary || pipeline.coveredLowestCandidateBoardSummary);
    const providerSandboxReadiness = obj(safe.providerSandboxReadinessViewModelSummary || pipeline.providerSandboxReadinessViewModelSummary);
    const sandboxHandoff = obj(safe.sandboxHandoffViewModelSummary || pipeline.sandboxHandoffViewModelSummary);
    const providerFixture = obj(safe.legalProviderFixtureSummary || pipeline.legalProviderFixtureSummary);
    return clone([
      card("provider_connector", "Provider Connector", obj(obj(connectorSummary).userFacingSummary).resultLabel || "只读 Provider Connector 仍需复核"),
      card("fixture_replay", "Fixture 回放", obj(obj(replaySummary).userFacingSummary).resultLabel || "Fixture 回放仍需复核"),
      card("provider_fixture", "Provider Fixture", obj(obj(providerFixture).userFacingSummary).resultLabel || "Provider fixture 仍需复核"),
      card("price_pipeline", "价格流水线", obj(obj(pipeline).userFacingSummary).resultLabel || "只读价格流水线仍需复核"),
      card("covered_lowest", "已覆盖来源较低候选价", obj(obj(coveredLowest).userFacingSummary).resultLabel || "当前仅比较已覆盖来源中的候选价"),
      card("provider_sandbox_readiness", "真实只读 Provider Sandbox 准备", obj(providerSandboxReadiness).title || "真实只读 Provider Sandbox 准备"),
      card("sandbox_handoff", "Sandbox 跳转预览", obj(obj(sandboxHandoff).userFacingSummary).resultLabel || obj(sandboxHandoff).title || "Sandbox 跳转候选与平台可用性")
    ]);
  }
  function buildGlobalShoppingPipelineStageRowsForView(input) {
    const pipeline = resolvePipeline(input || {});
    return clone(toArray(pipeline.pipelineStages).map(function (item) {
      return row(item.stageId, item.label, item.message || item.label, item.status);
    }));
  }
  function buildGlobalShoppingReadOnlyCandidateJourneyRows(input) {
    const safe = obj(input);
    const pipeline = resolvePipeline(safe);
    const connectorSummary = obj(safe.readOnlyProviderSandboxConnectorSummary || pipeline.readOnlyProviderSandboxConnectorSummary);
    const replaySummary = obj(safe.fixtureReplayConsoleSummary || pipeline.fixtureReplayConsoleSummary);
    const providerFixture = obj(safe.legalProviderFixtureSummary || pipeline.legalProviderFixtureSummary);
    const credential = obj(safe.providerCredentialSafetySummary || pipeline.providerCredentialSafetySummary);
    const feed = obj(safe.sandboxPriceFeedSummary || pipeline.sandboxPriceFeedSummary);
    const responseContract = obj(safe.sandboxProviderResponseContractSummary || pipeline.sandboxProviderResponseContractSummary);
    const normalization = obj(safe.priceSourceNormalizationSummary || pipeline.priceSourceNormalizationSummary);
    const anchor = obj(safe.officialPriceAnchorSummary || pipeline.officialPriceAnchorSummary);
    const matcher = obj(safe.sameItemMatcherSummary || pipeline.sameItemMatcherSummary);
    const merger = obj(safe.duplicateCandidateMergerSummary || pipeline.duplicateCandidateMergerSummary);
    const coveredLowest = obj(safe.coveredLowestCandidateBoardSummary || pipeline.coveredLowestCandidateBoardSummary);
    const providerSandboxReadiness = obj(safe.providerSandboxReadinessViewModelSummary || pipeline.providerSandboxReadinessViewModelSummary);
    const sandboxHandoff = obj(safe.sandboxHandoffViewModelSummary || pipeline.sandboxHandoffViewModelSummary);
    return clone([
      row("provider_connector", "Provider Connector", obj(obj(connectorSummary).userFacingSummary).resultLabel || "只读 Provider Connector 仍需复核", statusOf(connectorSummary) === "ready" ? "pass" : "warning"),
      row("fixture_replay", "Fixture 回放", obj(obj(replaySummary).userFacingSummary).resultLabel || "Fixture 回放仍需复核", statusOf(replaySummary) === "ready" ? "pass" : "warning"),
      row("provider_fixture", "Provider fixture", obj(obj(providerFixture).userFacingSummary).resultLabel || "Provider fixture 仍需复核", statusOf(providerFixture) === "ready" ? "pass" : "warning"),
      row("credential_safety", "凭据安全", obj(obj(credential).userFacingSummary).resultLabel || "Provider 凭据边界仍需复核", statusOf(credential) === "ready" ? "pass" : "warning"),
      row("sandbox_feed", "Sandbox feed", obj(obj(feed).userFacingSummary).resultLabel || "Sandbox 价格 Feed 仍需复核", statusOf(feed) === "ready" ? "pass" : "warning"),
      row("response_contract", "Provider response contract", obj(obj(responseContract).userFacingSummary).resultLabel || "Provider 响应合同仍需复核", statusOf(responseContract) === "ready" ? "pass" : "warning"),
      row("price_normalization", "价格归一化", obj(obj(normalization).userFacingSummary).resultLabel || "价格归一化仍需复核", statusOf(normalization) === "ready" ? "pass" : "warning"),
      row("official_anchor", "官方价锚点", obj(obj(anchor).userFacingSummary).resultLabel || "官方价仍需复核", statusOf(anchor) === "anchored" ? "pass" : "warning"),
      row("same_item", "同款识别", obj(obj(matcher).userFacingSummary).resultLabel || "同款识别仍需复核", statusOf(matcher) === "ready" ? "pass" : "warning"),
      row("candidate_merge", "候选合并", obj(obj(merger).userFacingSummary).resultLabel || "重复候选仍需复核", /^(merged|ready)$/.test(statusOf(merger)) ? "pass" : "warning"),
      row("covered_lowest", "已覆盖来源较低候选价", obj(obj(coveredLowest).userFacingSummary).resultLabel || "当前仅比较已覆盖来源中的候选价", statusOf(coveredLowest) === "ready" ? "pass" : "warning"),
      row("sandbox_readiness", "真实只读 Provider Sandbox 准备", obj(providerSandboxReadiness).title || "真实只读 Provider Sandbox 准备", statusOf(providerSandboxReadiness) === "ready" ? "pass" : "warning"),
      row("sandbox_handoff", "Sandbox 跳转预览", obj(obj(sandboxHandoff).userFacingSummary).resultLabel || obj(sandboxHandoff).title || "Sandbox 跳转候选与平台可用性", statusOf(sandboxHandoff) === "ready" ? "pass" : "warning")
    ]);
  }
  function sanitizeGlobalShoppingReadOnlyCandidateJourneyBoard(board) {
    const safe = obj(board);
    const pipeline = resolvePipeline(safe);
    const connectorSummary = obj(safe.readOnlyProviderSandboxConnectorSummary || pipeline.readOnlyProviderSandboxConnectorSummary);
    const replaySummary = obj(safe.fixtureReplayConsoleSummary || pipeline.fixtureReplayConsoleSummary);
    const coveredLowest = obj(safe.coveredLowestCandidateBoardSummary || pipeline.coveredLowestCandidateBoardSummary);
    const providerSandboxReadiness = obj(safe.providerSandboxReadinessViewModelSummary || pipeline.providerSandboxReadinessViewModelSummary);
    const sandboxHandoff = obj(safe.sandboxHandoffViewModelSummary || pipeline.sandboxHandoffViewModelSummary);
    const providerFixture = obj(safe.legalProviderFixtureSummary || pipeline.legalProviderFixtureSummary);
    const hasJourneyInput = Object.keys(obj(safe.pricePipelineOrchestratorSummary)).length ||
      Object.keys(obj(safe.readOnlyProviderSandboxConnectorSummary)).length ||
      Object.keys(obj(safe.fixtureReplayConsoleSummary)).length ||
      Object.keys(obj(safe.legalProviderFixtureSummary)).length ||
      Object.keys(obj(safe.coveredLowestCandidateBoardSummary)).length ||
      Object.keys(obj(safe.sandboxHandoffViewModelSummary)).length;
    const displayCopy = collectDisplayCopy(safe);
    const forbiddenCopy = /全网最低|最低价保证|锁价|真实最终价|立即购买|直接下单|一键下单|一键出票/i.test(displayCopy);
    const unsafe = forbiddenCopy || hasUnsafeBoundary(safe) || hasUnsafeBoundary(pipeline) || hasUnsafeBoundary(connectorSummary) || hasUnsafeBoundary(replaySummary) || hasUnsafeBoundary(coveredLowest) || hasUnsafeBoundary(providerSandboxReadiness) || hasUnsafeBoundary(sandboxHandoff) || hasUnsafeBoundary(providerFixture);
    const blocked = statusOf(pipeline) === "blocked" || statusOf(connectorSummary) === "blocked" || statusOf(replaySummary) === "blocked" || statusOf(providerSandboxReadiness) === "blocked" || unsafe;
    const needsReview = !blocked && (!hasJourneyInput || !Object.keys(pipeline).length || !Object.keys(connectorSummary).length || !Object.keys(replaySummary).length || !Object.keys(providerFixture).length || !Object.keys(coveredLowest).length || !Object.keys(sandboxHandoff).length);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : (blocked ? "blocked" : (needsReview ? "needs_review" : "ready"));
    return clone({
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_CANDIDATE_JOURNEY_BOARD_VERSION,
      status:status,
      title:"全球购只读候选旅程",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingReadOnlyCandidateJourneyCards(safe),
      journeyRows:toArray(safe.journeyRows).length ? toArray(safe.journeyRows) : buildGlobalShoppingReadOnlyCandidateJourneyRows(safe),
      pipelineStageRows:toArray(safe.pipelineStageRows).length ? toArray(safe.pipelineStageRows) : buildGlobalShoppingPipelineStageRowsForView(safe),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("provider_connector", "只读 Provider Connector", "不读取生产密钥，不联网，不暴露 raw response", "pass"),
        row("fixture_replay", "Fixture 回放控制台", "Replay 不代表真实 provider 调用", "pass"),
        row("read_only_only", "当前仅展示只读 fixture/sandbox 候选旅程", "不请求真实平台，不处理付款、下单或出票", "pass"),
        row("sandbox_readiness", "真实只读 Provider Sandbox 准备", "当前仅准备真实只读 provider sandbox 的请求封装和审计结构", "pass"),
        row("raw_response", "Raw provider response 不持久化", "仅输出脱敏摘要", "pass"),
        row("price_caveat", "价格流水线不代表真实价格", "价格以未来跳转后平台实时页面为准", "pass")
      ],
      nextStepRows:toArray(safe.nextStepRows).length ? toArray(safe.nextStepRows) : [
        row("view_contract", "查看 Provider 响应合同", "继续只读复核", "pass"),
        row("view_pipeline", "查看价格流水线 / 查看只读候选旅程", "继续只读判断，不打开平台", "pass")
      ],
      caveat:"当前仅展示只读 fixture/sandbox 候选旅程，不请求真实平台，不处理付款、下单或出票。价格以未来跳转后平台实时页面为准。",
      pricePipelineOrchestratorSummary:linkedSummary(pipeline),
      readOnlyProviderSandboxConnectorSummary:linkedSummary(connectorSummary),
      fixtureReplayConsoleSummary:linkedSummary(replaySummary),
      legalProviderFixtureSummary:linkedSummary(providerFixture),
      coveredLowestCandidateBoardSummary:linkedSummary(coveredLowest),
      providerSandboxReadinessViewModelSummary:linkedSummary(providerSandboxReadiness),
      sandboxHandoffViewModelSummary:linkedSummary(sandboxHandoff),
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingReadOnlyCandidateJourneyBoard(input) {
    try {
      return sanitizeGlobalShoppingReadOnlyCandidateJourneyBoard(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingReadOnlyCandidateJourneyBoard({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingReadOnlyCandidateJourneyBoardAuditDraft(input) {
    const board = buildGlobalShoppingReadOnlyCandidateJourneyBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_READ_ONLY_CANDIDATE_JOURNEY_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_CANDIDATE_JOURNEY_BOARD_VERSION,
      status:board.status,
      cardCount:board.cards.length,
      journeyRowCount:board.journeyRows.length,
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

  window.WeishanGlobalShoppingReadOnlyCandidateJourneyBoard = {
    GLOBAL_SHOPPING_READ_ONLY_CANDIDATE_JOURNEY_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingReadOnlyCandidateJourneyBoard,
    buildGlobalShoppingReadOnlyCandidateJourneyCards,
    buildGlobalShoppingReadOnlyCandidateJourneyRows,
    buildGlobalShoppingPipelineStageRowsForView,
    buildGlobalShoppingReadOnlyCandidateJourneyBoardAuditDraft,
    sanitizeGlobalShoppingReadOnlyCandidateJourneyBoard
  };
})();
