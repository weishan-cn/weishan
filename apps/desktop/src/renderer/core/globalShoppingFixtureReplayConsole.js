;(function () {
  "use strict";

  const GLOBAL_SHOPPING_FIXTURE_REPLAY_CONSOLE_VERSION = "2.2.2";
  const CONSOLE_NAME = "global_shopping_fixture_replay_console_v1";
  const RESULT_LABELS = {
    ready:"Fixture 回放已准备",
    needs_review:"Fixture 回放仍需复核",
    blocked:"Fixture 回放已阻断",
    failed_safe:"Fixture 回放已阻断"
  };

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function bool(value) { return value === true; }
  function present(value) { return value === true || (typeof value === "string" && value.trim().length > 0); }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId || "row"),
      label:text(label || ""),
      value:text(value || ""),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
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
  function replayMode(input) {
    const safe = obj(input);
    const value = text(safe.replayMode || obj(safe.replayPayload).replayMode || obj(safe.connectorSummary).connectorBoundary && obj(safe.connectorSummary).connectorBoundary.connectorMode || "");
    return /^(fixture|sandbox|replay_only|disabled)$/.test(value) ? value : "disabled";
  }
  function summaryCounts(payload) {
    const safe = obj(payload);
    const normalized = toArray(safe.normalizedSourceInputs);
    const official = toArray(safe.officialFixturePrices || safe.officialPrices);
    const authorized = toArray(safe.authorizedFixturePrices);
    const partner = toArray(safe.partnerFixturePrices);
    const affiliate = toArray(safe.affiliateFixturePrices);
    const aggregator = toArray(safe.aggregatorFixturePrices);
    const officialCount = official.length || (safe.officialFixturePrice ? 1 : 0);
    return {
      replayedSourceCount:normalized.length || officialCount + authorized.length + partner.length + affiliate.length + aggregator.length,
      officialSourceCount:officialCount,
      authorizedSourceCount:authorized.length,
      partnerSourceCount:partner.length,
      affiliateSourceCount:affiliate.length,
      aggregatorSourceCount:aggregator.length,
      fixtureSourceCount:officialCount + authorized.length + partner.length + affiliate.length + aggregator.length,
      hasOfficialSource:officialCount > 0,
      hasCoveredCandidateSource:authorized.length + partner.length + affiliate.length + aggregator.length > 0
    };
  }
  function evaluateGlobalShoppingFixtureReplay(input) {
    const safe = obj(input);
    const connectorSummary = obj(safe.connectorSummary || safe.readOnlyProviderSandboxConnectorSummary);
    const replayPayload = obj(safe.replayPayload);
    const replaySummary = summaryCounts(replayPayload);
    const replaySession = {
      replayId:text(safe.replayId || replayPayload.replayId || "fixture_replay_session"),
      replayMode:replayMode(safe),
      providerId:text(replayPayload.providerId || obj(connectorSummary.connectorBoundary).providerId || "global_fixture_provider"),
      providerName:text(replayPayload.providerName || obj(connectorSummary.connectorBoundary).providerName || "Global Shopping Fixture Sandbox"),
      fixtureOnly:true,
      sandboxOnly:true,
      readOnly:true,
      redacted:true,
      rawResponseStored:false,
      rawResponseExposedToRenderer:false,
      canCallNetwork:false,
      canWriteReplayFile:false,
      canLoadExternalReplayFile:false,
      canEnterProviderResponseContract:Object.keys(connectorSummary).length > 0 && Object.keys(replayPayload).length > 0,
      canEnterPricePipeline:Object.keys(connectorSummary).length > 0 && Object.keys(replayPayload).length > 0 && replaySummary.replayedSourceCount > 0
    };
    const replayHealth = {
      hasConnector:Object.keys(connectorSummary).length > 0,
      hasReplayPayload:Object.keys(replayPayload).length > 0,
      hasRedaction:safe.redacted !== false && replayPayload.redacted !== false,
      noNetwork:bool(safe.networkEnabled || replayPayload.networkEnabled) !== true,
      noRawPersistence:bool(safe.rawResponseStored || replayPayload.rawResponseStored) !== true,
      noRendererRawLeak:bool(safe.rawResponseExposedToRenderer || replayPayload.rawResponseExposedToRenderer) !== true,
      noFileWrite:bool(safe.fileWrite || replayPayload.fileWrite || safe.writeReplayFile || replayPayload.writeReplayFile) !== true,
      noExternalReplayFile:bool(safe.externalReplayFile || replayPayload.externalReplayFile || safe.loadExternalReplayFile || replayPayload.loadExternalReplayFile) !== true,
      noTransactionUrl:present(safe.bookingUrl) || present(safe.checkoutUrl) || present(safe.paymentUrl) || present(safe.orderUrl) || present(replayPayload.bookingUrl) ? false : true,
      noPayment:bool(safe.payment || replayPayload.payment) !== true,
      noOrder:bool(safe.order || replayPayload.order) !== true,
      noTicketing:bool(safe.ticketing || replayPayload.ticketing) !== true
    };
    const blockedReasons = [];
    if (!replayHealth.hasRedaction) blockedReasons.push("redaction_missing");
    if (!replayHealth.noNetwork) blockedReasons.push("network_detected");
    if (!replayHealth.noRawPersistence) blockedReasons.push("raw_persistence_detected");
    if (!replayHealth.noRendererRawLeak) blockedReasons.push("renderer_raw_leak_detected");
    if (!replayHealth.noFileWrite) blockedReasons.push("file_write_detected");
    if (!replayHealth.noExternalReplayFile) blockedReasons.push("external_replay_file_detected");
    if (!replayHealth.noTransactionUrl) blockedReasons.push("transaction_url_detected");
    if (!replayHealth.noPayment) blockedReasons.push("payment_detected");
    if (!replayHealth.noOrder) blockedReasons.push("order_detected");
    if (!replayHealth.noTicketing) blockedReasons.push("ticketing_detected");
    const needsReview = !replayHealth.hasConnector || !replayHealth.hasReplayPayload;
    return clone({
      replaySession:replaySession,
      replaySummary:replaySummary,
      replayHealth:replayHealth,
      blockedReasons:blockedReasons,
      status:blockedReasons.length ? "blocked" : (needsReview ? "needs_review" : "ready"),
      redacted:true
    });
  }
  function buildGlobalShoppingFixtureReplayRows(input) {
    const evaluation = evaluateGlobalShoppingFixtureReplay(input || {});
    const health = evaluation.replayHealth;
    const summary = evaluation.replaySummary;
    return clone([
      row("connector", "Provider Connector", health.hasConnector ? "已接入只读 Connector" : "仍需补充", health.hasConnector ? "pass" : "warning"),
      row("replay_payload", "Replay Payload", health.hasReplayPayload ? "已具备回放摘要" : "仍需补充", health.hasReplayPayload ? "pass" : "warning"),
      row("redaction", "脱敏状态", health.hasRedaction ? "回放数据已脱敏" : "已阻断风险", health.hasRedaction ? "pass" : "blocked"),
      row("summary", "回放来源", "共 " + summary.replayedSourceCount + " 个来源，官方 " + summary.officialSourceCount + " 个", summary.replayedSourceCount > 0 ? "pass" : "warning"),
      row("pipeline", "价格流水线", evaluation.replaySession.canEnterPricePipeline ? "可进入价格流水线" : "仍需复核", evaluation.replaySession.canEnterPricePipeline ? "pass" : "warning"),
      row("boundary", "安全边界", health.noNetwork && health.noRawPersistence && health.noRendererRawLeak && health.noFileWrite && health.noExternalReplayFile && health.noTransactionUrl && health.noPayment && health.noOrder && health.noTicketing ? "不联网 / 不落盘 / 不加载外部回放 / 无交易能力" : "已阻断风险", health.noNetwork && health.noRawPersistence && health.noRendererRawLeak && health.noFileWrite && health.noExternalReplayFile && health.noTransactionUrl && health.noPayment && health.noOrder && health.noTicketing ? "pass" : "blocked")
    ]);
  }
  function sanitizeGlobalShoppingFixtureReplayConsole(consoleModel) {
    const safe = obj(consoleModel);
    const evaluation = evaluateGlobalShoppingFixtureReplay(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_FIXTURE_REPLAY_CONSOLE_VERSION,
      status:status,
      replaySession:clone(evaluation.replaySession),
      replaySummary:clone(evaluation.replaySummary),
      replayHealth:clone(evaluation.replayHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingFixtureReplayRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"Fixture 回放控制台",
        resultLabel:RESULT_LABELS[status] || RESULT_LABELS.failed_safe,
        caveat:"Fixture 回放仅用于本地验证价格流水线，不代表真实 provider 调用、真实价格、付款、下单或出票能力。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingFixtureReplayConsole(input) {
    try {
      return sanitizeGlobalShoppingFixtureReplayConsole(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingFixtureReplayConsole({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingFixtureReplayConsoleAuditDraft(input) {
    const consoleModel = buildGlobalShoppingFixtureReplayConsole(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_FIXTURE_REPLAY_CONSOLE_AUDIT_DRAFT",
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_FIXTURE_REPLAY_CONSOLE_VERSION,
      status:consoleModel.status,
      rowCount:consoleModel.rows.length,
      blockedReasons:consoleModel.blockedReasons,
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

  window.WeishanGlobalShoppingFixtureReplayConsole = {
    GLOBAL_SHOPPING_FIXTURE_REPLAY_CONSOLE_VERSION,
    CONSOLE_NAME,
    buildGlobalShoppingFixtureReplayConsole,
    evaluateGlobalShoppingFixtureReplay,
    buildGlobalShoppingFixtureReplayRows,
    buildGlobalShoppingFixtureReplayConsoleAuditDraft,
    sanitizeGlobalShoppingFixtureReplayConsole
  };
})();
