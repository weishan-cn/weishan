;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SANDBOX_PROVIDER_RUNBOOK_BOARD_VERSION = "4.0.9";
  const BOARD_NAME = "global_shopping_sandbox_provider_runbook_board_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function card(cardId, label, value) { return { cardId:text(cardId || "card"), label:text(label || ""), value:text(value || ""), redacted:true }; }
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
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function stage(stageId, label, status, instruction) {
    return {
      stageId:text(stageId || "stage"),
      label:text(label || ""),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      instruction:text(instruction || ""),
      redacted:true
    };
  }

  function computeRunbookHealth(input) {
    const safe = obj(input);
    const registry = obj(safe.providerAdapterRegistrySummary);
    const harness = obj(safe.providerSandboxDryRunHarnessSummary);
    const adapterShell = obj(safe.firstReadOnlyProviderAdapterShellSummary);
    const killSwitch = obj(safe.providerSandboxSafetyKillSwitchSummary);
    const envelope = obj(safe.providerRequestEnvelopeSummary);
    const ledger = obj(safe.providerCallAuditLedgerSummary);
    const responseContract = obj(safe.sandboxProviderResponseContractSummary);
    const normalizer = obj(safe.dryRunProviderResponseNormalizerSummary);
    return {
      adapterRegistryReady:statusOf(registry) === "ready",
      dryRunHarnessReady:statusOf(harness) === "ready",
      adapterShellReady:statusOf(adapterShell) === "ready",
      killSwitchClear:statusOf(killSwitch) === "clear",
      requestEnvelopeReady:statusOf(envelope) === "ready",
      auditLedgerReady:statusOf(ledger) === "ready",
      responseContractReady:statusOf(responseContract) === "ready",
      responseNormalizerReady:statusOf(normalizer) === "ready",
      noRealEndpoint:safe.noRealEndpoint !== false,
      noRealApiKey:safe.noRealApiKey !== false,
      noNetwork:safe.noNetwork !== false,
      noRawPersistence:safe.noRawPersistence !== false,
      noTransaction:safe.noTransaction !== false,
      noPaymentOrderTicketing:safe.noPaymentOrderTicketing !== false
    };
  }

  function buildGlobalShoppingSandboxProviderRunbookRows(input) {
    const safe = obj(input);
    const runbookHealth = computeRunbookHealth(safe);
    return clone([
      row("registry", "Adapter 注册表", runbookHealth.adapterRegistryReady ? "Adapter 注册表已准备" : "仍需复核", runbookHealth.adapterRegistryReady ? "pass" : "warning"),
      row("dry_run", "干跑框架", runbookHealth.dryRunHarnessReady ? "Provider Sandbox 干跑框架已准备" : "仍需复核", runbookHealth.dryRunHarnessReady ? "pass" : "warning"),
      row("adapter_shell", "Adapter 外壳", runbookHealth.adapterShellReady ? "第一个只读 Provider Adapter 外壳已准备" : "仍需复核", runbookHealth.adapterShellReady ? "pass" : "warning"),
      row("response_normalizer", "响应归一化", runbookHealth.responseNormalizerReady ? "Dry-run 响应归一化已准备" : "仍需复核", runbookHealth.responseNormalizerReady ? "pass" : "warning"),
      row("safety", "安全边界", runbookHealth.noRealEndpoint && runbookHealth.noRealApiKey && runbookHealth.noNetwork && runbookHealth.noRawPersistence ? "不接真实 endpoint / key / network / raw persistence" : "已阻断", runbookHealth.noRealEndpoint && runbookHealth.noRealApiKey && runbookHealth.noNetwork && runbookHealth.noRawPersistence ? "pass" : "blocked"),
      row("transaction", "交易边界", runbookHealth.noTransaction && runbookHealth.noPaymentOrderTicketing ? "不生成交易链接，不付款、不下单、不出票" : "已阻断", runbookHealth.noTransaction && runbookHealth.noPaymentOrderTicketing ? "pass" : "blocked")
    ]);
  }

  function buildGlobalShoppingSandboxProviderRunbookCards(input) {
    const safe = obj(input);
    const registry = obj(safe.providerAdapterRegistrySummary);
    const harness = obj(safe.providerSandboxDryRunHarnessSummary);
    const normalizer = obj(safe.dryRunProviderResponseNormalizerSummary);
    return clone([
      card("registry", "Adapter 注册表", obj(registry.userFacingSummary).resultLabel || "Adapter 注册表仍需复核"),
      card("dry_run", "干跑框架", obj(harness.userFacingSummary).resultLabel || "干跑框架仍需复核"),
      card("response_normalizer", "响应归一化", obj(normalizer.userFacingSummary).resultLabel || "响应归一化仍需复核"),
      card("next_step", "下一步", safe.safeToProceedWithFirstSandboxProviderConnectorImplementation === true ? "继续只读 connector implementation 设计" : "继续只读复核")
    ]);
  }

  function sanitizeGlobalShoppingSandboxProviderRunbookBoard(board) {
    const safe = obj(board);
    const registry = obj(safe.providerAdapterRegistrySummary);
    const harness = obj(safe.providerSandboxDryRunHarnessSummary);
    const adapterShell = obj(safe.firstReadOnlyProviderAdapterShellSummary);
    const killSwitch = obj(safe.providerSandboxSafetyKillSwitchSummary);
    const envelope = obj(safe.providerRequestEnvelopeSummary);
    const ledger = obj(safe.providerCallAuditLedgerSummary);
    const responseContract = obj(safe.sandboxProviderResponseContractSummary);
    const normalizer = obj(safe.dryRunProviderResponseNormalizerSummary);
    const runbookHealth = computeRunbookHealth(safe);
    const blockedReasons = [];
    if (statusOf(killSwitch) === "blocked" || runbookHealth.killSwitchClear === false && Object.keys(killSwitch).length) blockedReasons.push("kill_switch_blocked");
    if (!runbookHealth.noRealEndpoint) blockedReasons.push("real_endpoint_detected");
    if (!runbookHealth.noRealApiKey) blockedReasons.push("real_api_key_detected");
    if (!runbookHealth.noNetwork) blockedReasons.push("network_detected");
    if (!runbookHealth.noRawPersistence) blockedReasons.push("raw_persistence_detected");
    if (!runbookHealth.noTransaction) blockedReasons.push("transaction_url_detected");
    if (!runbookHealth.noPaymentOrderTicketing) blockedReasons.push("payment_order_ticketing_detected");
    const blocked = blockedReasons.length > 0;
    const needsReview = !blocked && (!Object.keys(registry).length || !Object.keys(harness).length || !Object.keys(adapterShell).length || !Object.keys(envelope).length || !Object.keys(ledger).length || !Object.keys(responseContract).length || !Object.keys(normalizer).length || !runbookHealth.adapterRegistryReady || !runbookHealth.dryRunHarnessReady || !runbookHealth.adapterShellReady || !runbookHealth.requestEnvelopeReady || !runbookHealth.auditLedgerReady || !runbookHealth.responseContractReady || !runbookHealth.responseNormalizerReady || !runbookHealth.killSwitchClear);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : (blocked ? "blocked" : (needsReview ? "needs_review" : "ready"));
    const runbookStages = toArray(safe.runbookStages).length ? toArray(safe.runbookStages) : [
      stage("registry", "Adapter 注册表", runbookHealth.adapterRegistryReady ? "pass" : "warning", "只允许注册 disabled / fixture / dry_run / sandbox_ready 的只读 adapter。"),
      stage("dry_run", "干跑框架", runbookHealth.dryRunHarnessReady ? "pass" : "warning", "先完成只读 fixture/dry-run 生命周期复核，不发送真实请求。"),
      stage("adapter_shell", "Adapter 外壳", runbookHealth.adapterShellReady ? "pass" : "warning", "Adapter 外壳只能输出脱敏摘要，不包含真实 endpoint、key 或 SDK。"),
      stage("kill_switch", "安全熔断器", blocked ? "blocked" : (runbookHealth.killSwitchClear ? "pass" : "warning"), "任何真实 provider、network、raw persistence 或交易能力都必须被阻断。"),
      stage("request_envelope", "请求封装与审计", runbookHealth.requestEnvelopeReady && runbookHealth.auditLedgerReady ? "pass" : "warning", "只保留脱敏 envelope / audit draft，不保存 raw request / response。"),
      stage("response_normalizer", "响应归一化", runbookHealth.responseContractReady && runbookHealth.responseNormalizerReady ? "pass" : "warning", "只归一化脱敏 fixture/dry-run 响应摘要，不暴露 raw provider response。")
    ];
    return clone({
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_PROVIDER_RUNBOOK_BOARD_VERSION,
      status:status,
      title:"Sandbox Provider 接入运行手册",
      runbookStages:runbookStages,
      runbookHealth:runbookHealth,
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingSandboxProviderRunbookCards(safe),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingSandboxProviderRunbookRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : blockedReasons,
      userFacingSummary:{
        title:"Sandbox Provider 接入运行手册",
        resultLabel:status === "ready" ? "接入手册已准备" : (status === "needs_review" ? "接入手册仍需复核" : "接入手册已阻断"),
        caveat:"该运行手册只用于准备未来只读 sandbox provider 接入，不执行真实接入、不联网、不读取真实密钥。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingSandboxProviderRunbookBoard(input) {
    try {
      return sanitizeGlobalShoppingSandboxProviderRunbookBoard(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingSandboxProviderRunbookBoard({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingSandboxProviderRunbookBoardAuditDraft(input) {
    const board = buildGlobalShoppingSandboxProviderRunbookBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_SANDBOX_PROVIDER_RUNBOOK_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_PROVIDER_RUNBOOK_BOARD_VERSION,
      status:board.status,
      blockedReasons:board.blockedReasons,
      stageCount:board.runbookStages.length,
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

  window.WeishanGlobalShoppingSandboxProviderRunbookBoard = {
    GLOBAL_SHOPPING_SANDBOX_PROVIDER_RUNBOOK_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingSandboxProviderRunbookBoard,
    buildGlobalShoppingSandboxProviderRunbookCards,
    buildGlobalShoppingSandboxProviderRunbookRows,
    buildGlobalShoppingSandboxProviderRunbookBoardAuditDraft,
    sanitizeGlobalShoppingSandboxProviderRunbookBoard
  };
})();
