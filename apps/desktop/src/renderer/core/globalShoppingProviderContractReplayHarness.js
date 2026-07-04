;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_CONTRACT_REPLAY_HARNESS_VERSION = "4.2.6";
  const HARNESS_NAME = "global_shopping_provider_contract_replay_harness_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function timelineStep(stepId, label, status, summary, caveat) {
    return {
      stepId:text(stepId),
      label:text(label),
      status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review",
      summary:text(summary),
      caveat:text(caveat),
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
  function resolveSummary(input, key, apiName, methodName, buildInput) {
    const safe = obj(input);
    if (Object.keys(obj(safe[key])).length) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? api[methodName](buildInput || safe) : {};
  }

  function buildReplayCases(input) {
    const provided = toArray(obj(input).replayCases);
    const defaults = provided.length ? provided : [
      { caseId:"fixture_contract_case", label:"Fixture contract case", status:"pass", summary:"Fixture contract case 已脱敏，可用于回放。", caveat:"不回放 raw request/raw response。" },
      { caseId:"dry_run_contract_case", label:"Dry-run contract case", status:"pass", summary:"Dry-run contract case 仅保留 contract 级摘要。", caveat:"不读取 key，不使用真实 endpoint。" },
      { caseId:"boundary_guard_case", label:"Boundary guard case", status:"needs_review", summary:"边界守卫 case 仍需人工核对。", caveat:"当前只回放脱敏 contract case。" }
    ];
    return defaults.map(function (item, index) {
      const safe = obj(item);
      return timelineStep(
        safe.caseId || ("replay_case_" + index),
        safe.label || "Contract case",
        safe.status || "needs_review",
        safe.summary || "Contract case 仍需人工复核。",
        safe.caveat || "只回放脱敏 contract case。"
      );
    });
  }

  function evaluateGlobalShoppingProviderContractReplayHarness(input) {
    const safe = obj(input);
    const mockAdapterRegistryRuntimeSummary = resolveSummary(safe, "mockProviderAdapterRegistryRuntimeSummary", "WeishanGlobalShoppingMockProviderAdapterRegistryRuntime", "buildGlobalShoppingMockProviderAdapterRegistryRuntime", safe);
    const sandboxAdapterContractTestbedSummary = resolveSummary(safe, "sandboxAdapterContractTestbedSummary", "WeishanGlobalShoppingSandboxAdapterContractTestbed", "buildGlobalShoppingSandboxAdapterContractTestbed", safe);
    const vaultBoundaryContractSummary = resolveSummary(safe, "vaultBoundaryContractSummary", "WeishanGlobalShoppingVaultBoundaryContract", "buildGlobalShoppingVaultBoundaryContract", safe);
    const replayTimeline = buildGlobalShoppingProviderContractReplayTimeline(Object.assign({}, safe, {
      mockProviderAdapterRegistryRuntimeSummary:mockAdapterRegistryRuntimeSummary,
      sandboxAdapterContractTestbedSummary:sandboxAdapterContractTestbedSummary,
      vaultBoundaryContractSummary:vaultBoundaryContractSummary
    }));
    const blocked =
      statusOf(mockAdapterRegistryRuntimeSummary) === "blocked" ||
      statusOf(sandboxAdapterContractTestbedSummary) === "blocked" ||
      statusOf(vaultBoundaryContractSummary) === "blocked" ||
      safe.replayRawRequest === true ||
      safe.replayRawResponse === true ||
      safe.readApiKey === true ||
      safe.network === true ||
      safe.realEndpoint === true ||
      safe.openExternal === true ||
      safe.windowOpen === true ||
      safe.transactionUrl === true ||
      safe.checkout === true ||
      safe.payment === true ||
      safe.order === true ||
      safe.ticketing === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl;
    const replayHealth = {
      noRawRequestReplay:safe.replayRawRequest !== true,
      noRawResponseReplay:safe.replayRawResponse !== true,
      noApiKeyRead:safe.readApiKey !== true,
      noNetworkCall:safe.network !== true,
      noRealEndpoint:safe.realEndpoint !== true,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true,
      noTransactionUrl:safe.transactionUrl !== true && !(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl),
      noCheckoutPaymentTicketingOrder:safe.checkout !== true && safe.payment !== true && safe.order !== true && safe.ticketing !== true,
      noForbiddenClaims:text(safe.forbiddenClaim || "") === ""
    };
    const replaySummary = {
      hasMockAdapterRegistryRuntime:Object.keys(mockAdapterRegistryRuntimeSummary).length > 0,
      hasSandboxAdapterContractTestbed:Object.keys(sandboxAdapterContractTestbedSummary).length > 0,
      hasVaultBoundaryContract:Object.keys(vaultBoundaryContractSummary).length > 0,
      replayCaseCount:replayTimeline.length,
      passedCaseCount:replayTimeline.filter(function (item) { return item.status === "pass"; }).length,
      needsReviewCaseCount:replayTimeline.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; }).length,
      blockedCaseCount:replayTimeline.filter(function (item) { return item.status === "blocked"; }).length,
      readyForLaunchReadinessGate:false
    };
    replaySummary.readyForLaunchReadinessGate =
      replaySummary.hasMockAdapterRegistryRuntime &&
      replaySummary.hasSandboxAdapterContractTestbed &&
      replaySummary.hasVaultBoundaryContract &&
      replaySummary.blockedCaseCount === 0;
    const needsReview =
      !replaySummary.hasMockAdapterRegistryRuntime ||
      !replaySummary.hasSandboxAdapterContractTestbed ||
      !replaySummary.hasVaultBoundaryContract ||
      replayTimeline.some(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      mockProviderAdapterRegistryRuntimeSummary:clone(mockAdapterRegistryRuntimeSummary),
      sandboxAdapterContractTestbedSummary:clone(sandboxAdapterContractTestbedSummary),
      vaultBoundaryContractSummary:clone(vaultBoundaryContractSummary),
      replaySummary:replaySummary,
      replayTimeline:replayTimeline,
      replayHealth:replayHealth,
      blockedReasons:blocked ? [
        !replayHealth.noRawRequestReplay ? "raw_request_replay_detected" : "",
        !replayHealth.noRawResponseReplay ? "raw_response_replay_detected" : "",
        !replayHealth.noApiKeyRead ? "api_key_read_detected" : "",
        !replayHealth.noNetworkCall ? "network_detected" : "",
        !replayHealth.noRealEndpoint ? "real_endpoint_detected" : "",
        !replayHealth.noExternalOpen ? "external_open_detected" : "",
        !replayHealth.noTransactionUrl ? "transaction_url_detected" : "",
        !replayHealth.noCheckoutPaymentTicketingOrder ? "transaction_capability_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingProviderContractReplayTimeline(input) {
    const safe = obj(input);
    const mockAdapterRegistryRuntimeSummary = obj(safe.mockProviderAdapterRegistryRuntimeSummary);
    const sandboxAdapterContractTestbedSummary = obj(safe.sandboxAdapterContractTestbedSummary);
    const vaultBoundaryContractSummary = obj(safe.vaultBoundaryContractSummary);
    return clone([
      timelineStep("mock_adapter_registry", "Mock Adapter 注册运行时", Object.keys(mockAdapterRegistryRuntimeSummary).length ? (statusOf(mockAdapterRegistryRuntimeSummary) === "ready" ? "pass" : statusOf(mockAdapterRegistryRuntimeSummary)) : "needs_review", obj(obj(mockAdapterRegistryRuntimeSummary).userFacingSummary).resultLabel || "Mock Adapter 注册仍需复核", "Registry 只允许 mock/fixture/dry-run/contract-only adapter。"),
      timelineStep("adapter_contract_testbed", "Sandbox Adapter 合同测试台", Object.keys(sandboxAdapterContractTestbedSummary).length ? (statusOf(sandboxAdapterContractTestbedSummary) === "ready" ? "pass" : statusOf(sandboxAdapterContractTestbedSummary)) : "needs_review", obj(obj(sandboxAdapterContractTestbedSummary).userFacingSummary).resultLabel || "Adapter 合同测试仍需复核", "只回放脱敏 contract case。"),
      timelineStep("vault_boundary_contract", "Vault Boundary Contract", Object.keys(vaultBoundaryContractSummary).length ? (statusOf(vaultBoundaryContractSummary) === "ready" ? "pass" : statusOf(vaultBoundaryContractSummary)) : "needs_review", obj(obj(vaultBoundaryContractSummary).userFacingSummary).resultLabel || "Vault 边界仍需复核", "不读取 key，不保存 secret。")
    ].concat(buildReplayCases(safe)));
  }

  function buildGlobalShoppingProviderContractReplayRows(input) {
    const evaluation = evaluateGlobalShoppingProviderContractReplayHarness(input);
    return clone(evaluation.replayTimeline.map(function (item) {
      return row(item.stepId, item.label, item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    }).concat([
      row("replay_boundary", "合同回放边界", "该回放器只回放脱敏 contract case，不回放 raw request/raw response，不读取密钥，不联网，不打开平台。", evaluation.status === "blocked" ? "blocked" : "pass")
    ]));
  }

  function runGlobalShoppingProviderContractReplay(input) {
    const harness = buildGlobalShoppingProviderContractReplayHarness(input || {});
    return clone({
      harnessName:HARNESS_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_CONTRACT_REPLAY_HARNESS_VERSION,
      status:harness.status,
      replaySummary:harness.replaySummary,
      replayTimeline:harness.replayTimeline,
      rows:harness.rows,
      blockedReasons:harness.blockedReasons,
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
    });
  }

  function buildGlobalShoppingProviderContractReplayHarnessAuditDraft(input) {
    const harness = buildGlobalShoppingProviderContractReplayHarness(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_CONTRACT_REPLAY_HARNESS_AUDIT_DRAFT",
      harnessName:HARNESS_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_CONTRACT_REPLAY_HARNESS_VERSION,
      status:harness.status,
      replayCaseCount:obj(harness.replaySummary).replayCaseCount || 0,
      blockedCaseCount:obj(harness.replaySummary).blockedCaseCount || 0,
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

  function sanitizeGlobalShoppingProviderContractReplayHarness(harness) {
    const safe = obj(harness);
    const evaluation = evaluateGlobalShoppingProviderContractReplayHarness(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      harnessName:HARNESS_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_CONTRACT_REPLAY_HARNESS_VERSION,
      status:status,
      replayBoundary:{
        replayId:text(safe.replayId || "global-shopping-provider-contract-replay"),
        replayMode:/^(disabled|contract_replay|mock|dry_run)$/.test(text(safe.replayMode)) ? text(safe.replayMode) : "contract_replay",
        contractReplayOnly:true,
        mockOnly:true,
        dryRunOnly:true,
        readOnly:true,
        sandboxOnly:true,
        redactedOnly:true,
        productionDisabled:true,
        canReplayRawRequest:false,
        canReplayRawResponse:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canUseRealEndpoint:false,
        canOpenExternalNow:false,
        canGenerateTransactionUrl:false,
        canCheckout:false,
        canPay:false,
        canTicket:false,
        canCreateOrder:false
      },
      replaySummary:clone(evaluation.replaySummary),
      replayTimeline:clone(evaluation.replayTimeline),
      replayHealth:clone(evaluation.replayHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingProviderContractReplayRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"Provider 合同回放器",
        resultLabel:status === "ready" ? "合同回放器已准备" : (status === "blocked" ? "合同回放已阻断" : "合同回放仍需复核"),
        caveat:"该回放器只回放脱敏 contract case，不回放 raw request/raw response，不读取密钥，不联网，不打开平台。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingProviderContractReplayHarness(input) {
    try {
      return sanitizeGlobalShoppingProviderContractReplayHarness(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderContractReplayHarness({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderContractReplayHarness = {
    GLOBAL_SHOPPING_PROVIDER_CONTRACT_REPLAY_HARNESS_VERSION,
    HARNESS_NAME,
    buildGlobalShoppingProviderContractReplayHarness,
    evaluateGlobalShoppingProviderContractReplayHarness,
    runGlobalShoppingProviderContractReplay,
    buildGlobalShoppingProviderContractReplayRows,
    buildGlobalShoppingProviderContractReplayTimeline,
    buildGlobalShoppingProviderContractReplayHarnessAuditDraft,
    sanitizeGlobalShoppingProviderContractReplayHarness
  };
})();
