;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_PROVIDER_ADAPTER_CONTRACT_KIT_VERSION = "4.2.4";
  const KIT_NAME = "global_shopping_offline_provider_adapter_contract_kit_v1";

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
  function section(sectionId, label, status, summary, caveat) {
    return {
      sectionId:text(sectionId),
      label:text(label),
      status:safeStatus(status),
      summary:text(summary),
      caveat:text(caveat),
      redacted:true
    };
  }
  function safety() {
    return {
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
    };
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function summaryLabel(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }
  function blockedReasonList(input) {
    const safe = obj(input);
    return [
      safe.generateRealSdk === true ? "real_sdk_generation_detected" : "",
      safe.importRealProviderSdk === true ? "real_provider_sdk_import_detected" : "",
      safe.installDependency === true ? "dependency_install_detected" : "",
      safe.generateEndpoint === true ? "endpoint_generation_detected" : "",
      safe.createProviderClient === true ? "provider_client_creation_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.persistRawRequest === true ? "raw_request_persistence_detected" : "",
      safe.persistRawResponse === true ? "raw_response_persistence_detected" : "",
      safe.persistRawUserText === true ? "raw_user_text_persistence_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingOfflineProviderAdapterContractSections(input) {
    const safe = obj(input);
    const sdkSkeleton = resolveSummary(safe, "readOnlyProviderAdapterSdkSkeletonSummary", "WeishanGlobalShoppingReadOnlyProviderAdapterSdkSkeleton", "buildGlobalShoppingReadOnlyProviderAdapterSdkSkeleton");
    const scenarioLab = resolveSummary(safe, "offlineProviderScenarioLabSummary", "WeishanGlobalShoppingOfflineProviderScenarioLab", "buildGlobalShoppingOfflineProviderScenarioLab");
    const readinessWorkbench = resolveSummary(safe, "providerSandboxReadinessWorkbenchSummary", "WeishanGlobalShoppingProviderSandboxReadinessWorkbench", "buildGlobalShoppingProviderSandboxReadinessWorkbench");
    const commandCenter = resolveSummary(safe, "manualActivationCommandCenterSummary", "WeishanGlobalShoppingManualActivationCommandCenter", "buildGlobalShoppingManualActivationCommandCenter");
    const list = [
      ["adapter_sdk_skeleton", "Read-Only Provider Adapter SDK Skeleton", sdkSkeleton, "只展示只读 adapter SDK 接口骨架，不生成真实 SDK。"],
      ["offline_scenario_lab", "Offline Provider Scenario Lab", scenarioLab, "只展示离线场景合同依赖，不联网。"],
      ["readiness_workbench", "Provider Sandbox Readiness Workbench", readinessWorkbench, "只展示 sandbox readiness，不激活 sandbox。"],
      ["manual_activation_command_center", "Manual Activation Command Center", commandCenter, "只展示人工激活准备，不创建 release 或 push。"]
    ];
    return clone(list.map(function (item) {
      const summary = obj(item[2]);
      const status = !present(summary) ? "needs_review" : (safeStatus(summary.status) === "failed_safe" ? "blocked" : safeStatus(summary.status));
      return section(item[0], item[1], status, summaryLabel(summary, item[1] + " 仍需复核"), item[3]);
    }));
  }

  function buildGlobalShoppingOfflineProviderAdapterContractRows(input) {
    const safe = obj(input);
    const sections = toArray(safe.contractSections).length ? toArray(safe.contractSections) : buildGlobalShoppingOfflineProviderAdapterContractSections(safe);
    const interfaceRows = [
      row("contract_interface_prepare_input", "prepareInput(input)", "只接受脱敏 fixture/mock/dry_run 输入。", "pass"),
      row("contract_interface_normalize_result", "normalizeResult(result)", "只输出脱敏摘要，不返回 raw provider response。", "pass"),
      row("contract_interface_build_audit", "buildAuditDraft()", "只生成只读审计草稿，不写文件、不创建 release。", "pass")
    ];
    const forbiddenCapabilityRows = [
      row("contract_forbidden_real_sdk", "禁止真实 SDK", "不生成真实 SDK，不导入真实 provider SDK。", "pass"),
      row("contract_forbidden_runtime", "禁止运行时接入", "不安装依赖，不创建 provider client，不生成 endpoint。", "pass"),
      row("contract_forbidden_network", "禁止联网与读密钥", "不联网，不读取密钥。", "pass"),
      row("contract_forbidden_release", "禁止发布动作", "不创建 release/tag，不 push。", "pass")
    ];
    return clone([
      row("offline_adapter_contract_kit_status", "Offline Provider Adapter Contract Kit 状态", obj(safe.userFacingSummary).resultLabel || "离线 Adapter 合同仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("offline_adapter_contract_kit_boundary", "合同套件边界", "当前只读、离线、mock，不生成真实 SDK，不读取密钥，不联网。", "pass")
    ].concat(interfaceRows).concat(forbiddenCapabilityRows).concat(sections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingOfflineProviderAdapterContractKit(input) {
    const safe = obj(input);
    const contractSections = buildGlobalShoppingOfflineProviderAdapterContractSections(safe);
    const interfaceRows = [
      row("contract_interface_prepare_input", "prepareInput(input)", "只接受脱敏 fixture/mock/dry_run 输入。", "pass"),
      row("contract_interface_normalize_result", "normalizeResult(result)", "只输出脱敏摘要，不返回 raw provider response。", "pass"),
      row("contract_interface_build_audit", "buildAuditDraft()", "只生成只读审计草稿，不写文件、不创建 release。", "pass")
    ];
    const forbiddenCapabilityRows = [
      row("contract_forbidden_real_sdk", "禁止真实 SDK", "不生成真实 SDK，不导入真实 provider SDK。", "pass"),
      row("contract_forbidden_runtime", "禁止运行时接入", "不安装依赖，不创建 provider client，不生成 endpoint。", "pass"),
      row("contract_forbidden_network", "禁止联网与读密钥", "不联网，不读取密钥。", "pass"),
      row("contract_forbidden_release", "禁止发布动作", "不创建 release/tag，不 push。", "pass")
    ];
    const blockedReasons = blockedReasonList(safe).concat(contractSections.filter(function (item) { return item.status === "blocked"; }).map(function (item) { return item.sectionId + "_blocked"; }));
    const missing = contractSections.some(function (item) { return item.status === "needs_review"; });
    const status = blockedReasons.length ? "blocked" : (missing ? "needs_review" : "ready");
    const kit = {
      kitName:KIT_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_PROVIDER_ADAPTER_CONTRACT_KIT_VERSION,
      status:status,
      kitBoundary:{
        kitId:"global-shopping-offline-provider-adapter-contract-kit",
        kitMode:"contract_kit_only",
        contractKitOnly:true,
        offlineOnly:true,
        mockOnly:true,
        readinessOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canGenerateRealSdk:false,
        canImportRealProviderSdk:false,
        canInstallDependency:false,
        canGenerateEndpoint:false,
        canCreateProviderClient:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canPersistRawRequest:false,
        canPersistRawResponse:false,
        canPersistRawUserText:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false
      },
      kitSummary:{
        hasAdapterSdkSkeleton:contractSections[0].status !== "needs_review",
        hasOfflineScenarioLab:contractSections[1].status !== "needs_review",
        hasReadinessWorkbench:contractSections[2].status !== "needs_review",
        hasManualActivationCommandCenter:contractSections[3].status !== "needs_review",
        contractSectionCount:contractSections.length,
        interfaceRowCount:interfaceRows.length,
        forbiddenCapabilityCount:forbiddenCapabilityRows.length,
        readyForMockSandboxQaMatrix:status === "ready"
      },
      contractSections:contractSections,
      interfaceRows:interfaceRows,
      forbiddenCapabilityRows:forbiddenCapabilityRows,
      rows:[],
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"Offline Provider Adapter Contract Kit",
        resultLabel:status === "ready" ? "离线 Adapter 合同套件已准备" : (status === "blocked" ? "离线 Adapter 合同已阻断" : "离线 Adapter 合同仍需复核"),
        caveat:"该合同套件只展示离线 adapter 合同，不生成真实 SDK，不读取密钥，不联网，不生成 endpoint。"
      },
      safety:safety(),
      redacted:true
    };
    kit.rows = buildGlobalShoppingOfflineProviderAdapterContractRows(kit);
    return clone(kit);
  }

  function buildGlobalShoppingOfflineProviderAdapterContractKitAuditDraft(input) {
    const kit = buildGlobalShoppingOfflineProviderAdapterContractKit(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_PROVIDER_ADAPTER_CONTRACT_KIT_AUDIT_DRAFT",
      kitName:KIT_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_PROVIDER_ADAPTER_CONTRACT_KIT_VERSION,
      status:kit.status,
      contractSectionCount:obj(kit.kitSummary).contractSectionCount || 0,
      blockedReasonCount:toArray(kit.blockedReasons).length,
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

  function sanitizeGlobalShoppingOfflineProviderAdapterContractKit(kit) {
    return evaluateGlobalShoppingOfflineProviderAdapterContractKit(kit || {});
  }

  function buildGlobalShoppingOfflineProviderAdapterContractKit(input) {
    try {
      return evaluateGlobalShoppingOfflineProviderAdapterContractKit(input || {});
    } catch (_) {
      return evaluateGlobalShoppingOfflineProviderAdapterContractKit({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflineProviderAdapterContractKit = {
    GLOBAL_SHOPPING_OFFLINE_PROVIDER_ADAPTER_CONTRACT_KIT_VERSION,
    KIT_NAME,
    buildGlobalShoppingOfflineProviderAdapterContractKit,
    evaluateGlobalShoppingOfflineProviderAdapterContractKit,
    buildGlobalShoppingOfflineProviderAdapterContractRows,
    buildGlobalShoppingOfflineProviderAdapterContractSections,
    buildGlobalShoppingOfflineProviderAdapterContractKitAuditDraft,
    sanitizeGlobalShoppingOfflineProviderAdapterContractKit
  };
})();
