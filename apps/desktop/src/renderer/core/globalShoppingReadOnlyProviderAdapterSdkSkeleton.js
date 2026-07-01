;(function () {
  "use strict";

  const GLOBAL_SHOPPING_READ_ONLY_PROVIDER_ADAPTER_SDK_SKELETON_VERSION = "3.7.0";
  const SKELETON_NAME = "global_shopping_read_only_provider_adapter_sdk_skeleton_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe)$/.test(text(value)) ? text(value) : "needs_review"; }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId),
      label:text(label),
      value:text(value),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function blockedReasonList(input) {
    const safe = obj(input);
    return [
      safe.generateRealEndpoint === true ? "real_endpoint_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.importRealProviderSdk === true ? "real_provider_sdk_import_detected" : "",
      safe.installDependency === true ? "dependency_install_detected" : "",
      safe.createProviderClient === true ? "provider_client_creation_detected" : "",
      safe.storeCredential === true ? "credential_storage_detected" : "",
      safe.persistRawRequest === true ? "raw_request_persistence_detected" : "",
      safe.persistRawResponse === true ? "raw_response_persistence_detected" : "",
      safe.openExternal === true || safe.windowOpen === true || safe.openExternalNow === true ? "external_open_detected" : "",
      safe.checkout === true || safe.payment === true || safe.order === true || safe.ticketing === true ? "transaction_capability_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingReadOnlyProviderAdapterInterfaceRows(input) {
    const safe = obj(input);
    const scenarioLab = resolveSummary(safe, "offlineProviderScenarioLabSummary", "WeishanGlobalShoppingOfflineProviderScenarioLab", "buildGlobalShoppingOfflineProviderScenarioLab");
    return clone([
      row("sdk_interface_prepare_input", "prepareInput(input)", "只接受脱敏 mock/fixture/dry_run 输入。", present(scenarioLab) ? "pass" : "warning"),
      row("sdk_interface_normalize_result", "normalizeResult(result)", "只输出脱敏摘要，不返回 raw provider response。", "pass"),
      row("sdk_interface_emit_audit", "buildAuditDraft()", "只生成只读审计草稿，不写文件、不下载。", "pass")
    ]);
  }

  function buildGlobalShoppingReadOnlyProviderAdapterContractRows(input) {
    const safe = obj(input);
    const replayHarness = resolveSummary(safe, "providerContractReplayHarnessSummary", "WeishanGlobalShoppingProviderContractReplayHarness", "buildGlobalShoppingProviderContractReplayHarness");
    const vaultBoundary = resolveSummary(safe, "vaultBoundaryContractSummary", "WeishanGlobalShoppingVaultBoundaryContract", "buildGlobalShoppingVaultBoundaryContract");
    const contractTestbed = resolveSummary(safe, "sandboxAdapterContractTestbedSummary", "WeishanGlobalShoppingSandboxAdapterContractTestbed", "buildGlobalShoppingSandboxAdapterContractTestbed");
    return clone([
      row("sdk_contract_replay", "合同回放", present(replayHarness) ? "只回放脱敏 contract case。" : "合同回放仍需复核", present(replayHarness) ? "pass" : "warning"),
      row("sdk_contract_vault_boundary", "Vault 边界", present(vaultBoundary) ? "不读取密钥，不保存 secret。" : "Vault 边界仍需复核", present(vaultBoundary) ? "pass" : "warning"),
      row("sdk_contract_testbed", "Adapter 合同测试台", present(contractTestbed) ? "只验证 skeleton/contract 行为，不创建 provider client。" : "Adapter 合同测试台仍需复核", present(contractTestbed) ? "pass" : "warning")
    ]);
  }

  function buildGlobalShoppingReadOnlyProviderAdapterSdkForbiddenRows() {
    return clone([
      row("sdk_forbidden_endpoint", "禁止生成真实 endpoint", "不生成真实 endpoint", "pass"),
      row("sdk_forbidden_sdk_import", "禁止导入真实 SDK", "不导入真实 provider SDK，不安装依赖。", "pass"),
      row("sdk_forbidden_network", "禁止联网与创建 client", "不联网，不创建 provider client。", "pass"),
      row("sdk_forbidden_storage", "禁止凭证与 raw 持久化", "不存凭证，不保存 raw request/response。", "pass")
    ]);
  }

  function evaluateGlobalShoppingReadOnlyProviderAdapterSdkSkeleton(input) {
    const safe = obj(input);
    const scenarioLab = resolveSummary(safe, "offlineProviderScenarioLabSummary", "WeishanGlobalShoppingOfflineProviderScenarioLab", "buildGlobalShoppingOfflineProviderScenarioLab");
    const replayHarness = resolveSummary(safe, "providerContractReplayHarnessSummary", "WeishanGlobalShoppingProviderContractReplayHarness", "buildGlobalShoppingProviderContractReplayHarness");
    const vaultBoundary = resolveSummary(safe, "vaultBoundaryContractSummary", "WeishanGlobalShoppingVaultBoundaryContract", "buildGlobalShoppingVaultBoundaryContract");
    const contractTestbed = resolveSummary(safe, "sandboxAdapterContractTestbedSummary", "WeishanGlobalShoppingSandboxAdapterContractTestbed", "buildGlobalShoppingSandboxAdapterContractTestbed");
    const interfaceRows = buildGlobalShoppingReadOnlyProviderAdapterInterfaceRows(Object.assign({}, safe, { offlineProviderScenarioLabSummary:scenarioLab }));
    const contractRows = buildGlobalShoppingReadOnlyProviderAdapterContractRows(Object.assign({}, safe, { providerContractReplayHarnessSummary:replayHarness, vaultBoundaryContractSummary:vaultBoundary, sandboxAdapterContractTestbedSummary:contractTestbed }));
    const forbiddenCapabilityRows = buildGlobalShoppingReadOnlyProviderAdapterSdkForbiddenRows();
    const blockedReasons = blockedReasonList(safe);
    const missing = !present(scenarioLab) || !present(replayHarness) || !present(vaultBoundary) || !present(contractTestbed);
    const status = blockedReasons.length ? "blocked" : (missing ? "needs_review" : "ready");
    return clone({
      skeletonName:SKELETON_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_PROVIDER_ADAPTER_SDK_SKELETON_VERSION,
      status:status,
      sdkBoundary:{
        skeletonId:"global-shopping-read-only-provider-adapter-sdk-skeleton",
        skeletonMode:"skeleton_only",
        skeletonOnly:true,
        contractOnly:true,
        readinessOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canGenerateRealEndpoint:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canImportRealProviderSdk:false,
        canInstallDependency:false,
        canCreateProviderClient:false,
        canStoreCredential:false,
        canPersistRawRequest:false,
        canPersistRawResponse:false,
        canOpenExternalNow:false,
        canCheckout:false,
        canPay:false,
        canTicket:false,
        canCreateOrder:false
      },
      sdkSummary:{
        hasOfflineScenarioLab:present(scenarioLab),
        hasContractReplayHarness:present(replayHarness),
        hasVaultBoundaryContract:present(vaultBoundary),
        hasSandboxAdapterContractTestbed:present(contractTestbed),
        interfaceRowCount:interfaceRows.length,
        contractRowCount:contractRows.length,
        forbiddenCapabilityCount:forbiddenCapabilityRows.length,
        readyForManualActivationCommandCenter:status === "ready"
      },
      interfaceRows:interfaceRows,
      contractRows:contractRows,
      forbiddenCapabilityRows:forbiddenCapabilityRows,
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"Read-Only Provider Adapter SDK Skeleton",
        resultLabel:status === "ready" ? "只读 Adapter SDK 骨架已准备" : (status === "blocked" ? "只读 Adapter SDK 骨架已阻断" : "只读 Adapter SDK 骨架仍需复核"),
        caveat:"该 SDK 只是接口骨架，不生成真实 endpoint，不读取密钥，不联网，不导入真实 provider SDK。"
      },
      safety:{
        fileWrite:false,
        download:false,
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
      },
      redacted:true
    });
  }

  function buildGlobalShoppingReadOnlyProviderAdapterSdkSkeletonAuditDraft(input) {
    const skeleton = buildGlobalShoppingReadOnlyProviderAdapterSdkSkeleton(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_READ_ONLY_PROVIDER_ADAPTER_SDK_SKELETON_AUDIT_DRAFT",
      skeletonName:SKELETON_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_PROVIDER_ADAPTER_SDK_SKELETON_VERSION,
      status:skeleton.status,
      interfaceRowCount:toArray(skeleton.interfaceRows).length,
      contractRowCount:toArray(skeleton.contractRows).length,
      forbiddenCapabilityCount:toArray(skeleton.forbiddenCapabilityRows).length,
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

  function sanitizeGlobalShoppingReadOnlyProviderAdapterSdkSkeleton(skeleton) {
    return evaluateGlobalShoppingReadOnlyProviderAdapterSdkSkeleton(skeleton || {});
  }

  function buildGlobalShoppingReadOnlyProviderAdapterSdkSkeleton(input) {
    try {
      return evaluateGlobalShoppingReadOnlyProviderAdapterSdkSkeleton(input || {});
    } catch (_) {
      return evaluateGlobalShoppingReadOnlyProviderAdapterSdkSkeleton({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingReadOnlyProviderAdapterSdkSkeleton = {
    GLOBAL_SHOPPING_READ_ONLY_PROVIDER_ADAPTER_SDK_SKELETON_VERSION,
    SKELETON_NAME,
    buildGlobalShoppingReadOnlyProviderAdapterSdkSkeleton,
    evaluateGlobalShoppingReadOnlyProviderAdapterSdkSkeleton,
    buildGlobalShoppingReadOnlyProviderAdapterInterfaceRows,
    buildGlobalShoppingReadOnlyProviderAdapterContractRows,
    buildGlobalShoppingReadOnlyProviderAdapterSdkSkeletonAuditDraft,
    sanitizeGlobalShoppingReadOnlyProviderAdapterSdkSkeleton
  };
})();
