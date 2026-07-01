;(function () {
  "use strict";

  const GLOBAL_SHOPPING_NO_ACTIVATION_COMPLIANCE_SEAL_VERSION = "3.7.0";
  const SEAL_NAME = "global_shopping_no_activation_compliance_seal_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|providerClient|rawTrace|rawResponse|rawRequest|rawUserText/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe|pass|warning|fail)$/.test(text(value)) ? text(value) : "needs_review"; }
  function safeMode(value) { return /^(disabled|compliance_seal_only|offline_mock|readonly)$/.test(text(value)) ? text(value) : "compliance_seal_only"; }
  function rule(ruleId, label, status, summary, caveat) {
    return { ruleId:text(ruleId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function safety() {
    return {
      fileWrite:false,
      download:false,
      upload:false,
      mail:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      rawRequestStored:false,
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
  function labelOf(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }
  function blockedReasons(input) {
    const safe = obj(input);
    return [
      safe.generateSealFile === true ? "seal_file_generation_detected" : "",
      safe.persistSeal === true ? "seal_persistence_detected" : "",
      safe.modifyRuntimeConfig === true ? "runtime_config_mutation_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.disableProvider === true ? "provider_disable_detected" : "",
      safe.executeRealBlock === true ? "real_block_execution_detected" : "",
      safe.createProviderClient === true ? "provider_client_detected" : "",
      safe.createEndpoint === true ? "endpoint_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.persistRawRequest === true ? "raw_request_persistence_detected" : "",
      safe.persistRawResponse === true ? "raw_response_persistence_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.booking === true ? "booking_detected" : "",
      safe.payment === true ? "payment_detected" : "",
      safe.order === true ? "order_detected" : "",
      safe.checkout === true ? "checkout_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingNoActivationComplianceSealRules(input) {
    const safe = obj(input);
    const offlineProviderGovernanceClosureBoardSummary = resolveSummary(safe, "offlineProviderGovernanceClosureBoardSummary", "WeishanGlobalShoppingOfflineProviderGovernanceClosureBoard", "buildGlobalShoppingOfflineProviderGovernanceClosureBoard");
    const providerNoActivationGuaranteeBoardSummary = resolveSummary(safe, "providerNoActivationGuaranteeBoardSummary", "WeishanGlobalShoppingProviderNoActivationGuaranteeBoard", "buildGlobalShoppingProviderNoActivationGuaranteeBoard");
    const providerActivationBlockerSentinelSummary = resolveSummary(safe, "providerActivationBlockerSentinelSummary", "WeishanGlobalShoppingProviderActivationBlockerSentinel", "buildGlobalShoppingProviderActivationBlockerSentinel");
    const adapterSecurityRegressionGuardSummary = present(safe.adapterSecurityRegressionGuardSummary) ? obj(safe.adapterSecurityRegressionGuardSummary) : {};
    const safetySentinelSummary = present(safe.safetySentinelSummary) ? obj(safe.safetySentinelSummary) : {};
    return clone([
      rule("offline_provider_governance_closure_board", "Offline Provider Governance Closure Board", present(offlineProviderGovernanceClosureBoardSummary) ? offlineProviderGovernanceClosureBoardSummary.status : "needs_review", labelOf(offlineProviderGovernanceClosureBoardSummary, "Governance Closure Board 仍需复核"), "Governance Closure 不保存真实治理结论。"),
      rule("provider_no_activation_guarantee_board", "Provider No-Activation Guarantee Board", present(providerNoActivationGuaranteeBoardSummary) ? providerNoActivationGuaranteeBoardSummary.status : "needs_review", labelOf(providerNoActivationGuaranteeBoardSummary, "No-Activation Guarantee 仍需复核"), "No-Activation Seal 不生成真实封条、不执行真实阻断。"),
      rule("provider_activation_blocker_sentinel", "Provider Activation Blocker Sentinel", present(providerActivationBlockerSentinelSummary) ? providerActivationBlockerSentinelSummary.status : "needs_review", labelOf(providerActivationBlockerSentinelSummary, "Provider Activation Blocker Sentinel 仍需复核"), "Activation Blocker 不修改配置、不启用 provider。"),
      rule("adapter_security_regression_guard", "Adapter Security Regression Guard", present(adapterSecurityRegressionGuardSummary) ? adapterSecurityRegressionGuardSummary.status : "needs_review", labelOf(adapterSecurityRegressionGuardSummary, "Adapter Security Regression Guard 仍需复核"), "Security Guard 不创建 provider client、不生成 endpoint。"),
      rule("safety_regression_sentinel", "Safety Regression Sentinel", present(safetySentinelSummary) ? safetySentinelSummary.status : "needs_review", labelOf(safetySentinelSummary, "Safety Regression Sentinel 仍需复核"), "Safety Sentinel 不写文件、不联网。")
    ]);
  }

  function buildGlobalShoppingNoActivationComplianceSealRows(input) {
    const safe = obj(input);
    const rules = toArray(safe.sealRules).length ? toArray(safe.sealRules) : buildGlobalShoppingNoActivationComplianceSealRules(safe);
    return clone([
      row("no_activation_compliance_seal_status", "No-Activation Compliance Seal", obj(safe.userFacingSummary).resultLabel || "No-Activation Compliance Seal 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("no_activation_compliance_seal_boundary", "No-Activation Seal 边界", "该 Seal 只展示不激活合规封条，不生成真实封条、不执行真实阻断、不修改配置。", "pass")
    ].concat(rules.map(function (item) {
      return row(item.ruleId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingNoActivationComplianceSeal(input) {
    const safe = obj(input);
    const sealRules = buildGlobalShoppingNoActivationComplianceSealRules(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedRules = sealRules.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewRules = sealRules.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedRules.length ? "blocked" : (needsReviewRules.length ? "needs_review" : "ready");
    const result = {
      sealName:SEAL_NAME,
      appVersion:GLOBAL_SHOPPING_NO_ACTIVATION_COMPLIANCE_SEAL_VERSION,
      status:status,
      sealMode:safeMode(safe.sealMode),
      complianceBoundary:{
        complianceSealOnly:true,
        offlineMock:true,
        readOnly:true,
        canGenerateSealFile:false,
        canPersistSeal:false,
        canModifyRuntimeConfig:false,
        canEnableProvider:false,
        canDisableProvider:false,
        canExecuteRealBlock:false,
        canCreateProviderClient:false,
        canCreateEndpoint:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canPersistRawRequest:false,
        canPersistRawResponse:false,
        canWriteFile:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canBook:false,
        canPay:false,
        canOrder:false,
        canCheckout:false
      },
      complianceSummary:{
        hasGovernanceClosureBoard:present(resolveSummary(safe, "offlineProviderGovernanceClosureBoardSummary", "WeishanGlobalShoppingOfflineProviderGovernanceClosureBoard", "buildGlobalShoppingOfflineProviderGovernanceClosureBoard")),
        hasNoActivationGuarantee:present(resolveSummary(safe, "providerNoActivationGuaranteeBoardSummary", "WeishanGlobalShoppingProviderNoActivationGuaranteeBoard", "buildGlobalShoppingProviderNoActivationGuaranteeBoard")),
        hasActivationBlockerSentinel:present(resolveSummary(safe, "providerActivationBlockerSentinelSummary", "WeishanGlobalShoppingProviderActivationBlockerSentinel", "buildGlobalShoppingProviderActivationBlockerSentinel")),
        hasSecurityRegressionGuard:present(safe.adapterSecurityRegressionGuardSummary),
        hasSafetySentinel:present(safe.safetySentinelSummary),
        sealRuleCount:sealRules.length,
        needsReviewRuleCount:needsReviewRules.length,
        blockedRuleCount:directBlockedReasons.length + blockedRules.length,
        readyForFinalReadinessHandoffSimulator:status === "ready",
        humanGovernanceClosureReviewRequired:true
      },
      sealRules:sealRules,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedRules.map(function (item) { return item.ruleId + "_blocked"; })),
      userFacingSummary:{
        title:"No-Activation Compliance Seal",
        resultLabel:status === "ready" ? "No-Activation Compliance Seal 已准备" : (status === "blocked" ? "No-Activation Compliance Seal 已阻断" : "No-Activation Compliance Seal 仍需复核"),
        caveat:"该 Seal 只展示不激活合规封条，不生成真实封条、不执行真实阻断、不修改配置。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingNoActivationComplianceSealRows(result);
    return clone(result);
  }

  function buildGlobalShoppingNoActivationComplianceSealAuditDraft(input) {
    const seal = buildGlobalShoppingNoActivationComplianceSeal(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_NO_ACTIVATION_COMPLIANCE_SEAL_AUDIT_DRAFT",
      sealName:SEAL_NAME,
      appVersion:GLOBAL_SHOPPING_NO_ACTIVATION_COMPLIANCE_SEAL_VERSION,
      status:seal.status,
      sealRuleCount:obj(seal.complianceSummary).sealRuleCount || 0,
      blockedRuleCount:obj(seal.complianceSummary).blockedRuleCount || 0,
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
      rawRequestStored:false,
      secretStored:false,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingNoActivationComplianceSeal(seal) {
    return evaluateGlobalShoppingNoActivationComplianceSeal(seal || {});
  }

  function buildGlobalShoppingNoActivationComplianceSeal(input) {
    try {
      return evaluateGlobalShoppingNoActivationComplianceSeal(input || {});
    } catch (_) {
      return evaluateGlobalShoppingNoActivationComplianceSeal({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingNoActivationComplianceSeal = {
    GLOBAL_SHOPPING_NO_ACTIVATION_COMPLIANCE_SEAL_VERSION,
    SEAL_NAME,
    buildGlobalShoppingNoActivationComplianceSeal,
    evaluateGlobalShoppingNoActivationComplianceSeal,
    buildGlobalShoppingNoActivationComplianceSealRows,
    buildGlobalShoppingNoActivationComplianceSealRules,
    buildGlobalShoppingNoActivationComplianceSealAuditDraft,
    sanitizeGlobalShoppingNoActivationComplianceSeal
  };
})();
