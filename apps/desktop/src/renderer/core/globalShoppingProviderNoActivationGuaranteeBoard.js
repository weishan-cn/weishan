;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_NO_ACTIVATION_GUARANTEE_BOARD_VERSION = "4.0.0";
  const BOARD_NAME = "global_shopping_provider_no_activation_guarantee_board_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|providerClient/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe|pass|warning|fail)$/.test(text(value)) ? text(value) : "needs_review"; }
  function safeMode(value) { return /^(disabled|guarantee_only|offline_mock|readonly)$/.test(text(value)) ? text(value) : "guarantee_only"; }
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
      safe.blockRealProcess === true ? "real_block_execution_detected" : "",
      safe.modifyRuntimeConfig === true ? "runtime_config_mutation_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.disableProvider === true ? "provider_disable_detected" : "",
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

  function buildGlobalShoppingProviderNoActivationGuaranteeRules(input) {
    const safe = obj(input);
    const providerFinalSafetySealSummary = resolveSummary(safe, "providerFinalSafetySealSummary", "WeishanGlobalShoppingProviderFinalSafetySeal", "buildGlobalShoppingProviderFinalSafetySeal");
    const offlineActivationWarRoomSummary = resolveSummary(safe, "offlineActivationWarRoomSummary", "WeishanGlobalShoppingOfflineActivationWarRoom", "buildGlobalShoppingOfflineActivationWarRoom");
    const readOnlyProviderReadinessCertificateSummary = resolveSummary(safe, "readOnlyProviderReadinessCertificateSummary", "WeishanGlobalShoppingReadOnlyProviderReadinessCertificate", "buildGlobalShoppingReadOnlyProviderReadinessCertificate");
    const providerActivationBlockerSentinelSummary = resolveSummary(safe, "providerActivationBlockerSentinelSummary", "WeishanGlobalShoppingProviderActivationBlockerSentinel", "buildGlobalShoppingProviderActivationBlockerSentinel");
    const adapterSecurityRegressionGuardSummary = present(safe.adapterSecurityRegressionGuardSummary) ? obj(safe.adapterSecurityRegressionGuardSummary) : {};
    return clone([
      rule("provider_final_safety_seal", "Provider Final Safety Seal", present(providerFinalSafetySealSummary) ? providerFinalSafetySealSummary.status : "needs_review", labelOf(providerFinalSafetySealSummary, "Safety Seal 仍需复核"), "Safety Seal 不生成真实证书、不写文件。"),
      rule("offline_activation_war_room", "Offline Activation War Room", present(offlineActivationWarRoomSummary) ? offlineActivationWarRoomSummary.status : "needs_review", labelOf(offlineActivationWarRoomSummary, "Activation War Room 仍需复核"), "Activation War Room 不激活 sandbox、不启用 provider。"),
      rule("read_only_provider_readiness_certificate", "Read-Only Provider Readiness Certificate", present(readOnlyProviderReadinessCertificateSummary) ? readOnlyProviderReadinessCertificateSummary.status : "needs_review", labelOf(readOnlyProviderReadinessCertificateSummary, "Readiness Certificate 仍需复核"), "Readiness Certificate 不持久化证书。"),
      rule("provider_activation_blocker_sentinel", "Provider Activation Blocker Sentinel", present(providerActivationBlockerSentinelSummary) ? providerActivationBlockerSentinelSummary.status : "needs_review", labelOf(providerActivationBlockerSentinelSummary, "Activation Blockers 仍需复核"), "No-Activation Guarantee 不修改配置、不执行真实阻断。"),
      rule("adapter_security_regression_guard", "Adapter Security Regression Guard", present(adapterSecurityRegressionGuardSummary) ? adapterSecurityRegressionGuardSummary.status : "needs_review", labelOf(adapterSecurityRegressionGuardSummary, "Security Guard 仍需复核"), "No-Activation Guarantee 不创建 provider client、不生成 endpoint。")
    ]);
  }

  function buildGlobalShoppingProviderNoActivationGuaranteeRows(input) {
    const safe = obj(input);
    const rules = toArray(safe.guaranteeRules).length ? toArray(safe.guaranteeRules) : buildGlobalShoppingProviderNoActivationGuaranteeRules(safe);
    return clone([
      row("provider_no_activation_guarantee_board_status", "Provider No-Activation Guarantee Board", obj(safe.userFacingSummary).resultLabel || "Provider No-Activation Guarantee Board 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_no_activation_guarantee_board_boundary", "No-Activation Guarantee 边界", "该 Board 只展示不激活保证检查，不修改配置、不执行真实阻断、不启用 provider。", "pass")
    ].concat(rules.map(function (item) {
      return row(item.ruleId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingProviderNoActivationGuaranteeBoard(input) {
    const safe = obj(input);
    const guaranteeRules = buildGlobalShoppingProviderNoActivationGuaranteeRules(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedRules = guaranteeRules.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewRules = guaranteeRules.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedRules.length ? "blocked" : (needsReviewRules.length ? "needs_review" : "ready");
    const result = {
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_NO_ACTIVATION_GUARANTEE_BOARD_VERSION,
      status:status,
      boardMode:safeMode(safe.boardMode),
      guaranteeBoundary:{
        guaranteeOnly:true,
        offlineMock:true,
        readOnly:true,
        canBlockRealProcess:false,
        canModifyRuntimeConfig:false,
        canEnableProvider:false,
        canDisableProvider:false,
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
      guaranteeSummary:{
        hasFinalSafetySeal:present(resolveSummary(safe, "providerFinalSafetySealSummary", "WeishanGlobalShoppingProviderFinalSafetySeal", "buildGlobalShoppingProviderFinalSafetySeal")),
        hasActivationWarRoom:present(resolveSummary(safe, "offlineActivationWarRoomSummary", "WeishanGlobalShoppingOfflineActivationWarRoom", "buildGlobalShoppingOfflineActivationWarRoom")),
        hasReadinessCertificate:present(resolveSummary(safe, "readOnlyProviderReadinessCertificateSummary", "WeishanGlobalShoppingReadOnlyProviderReadinessCertificate", "buildGlobalShoppingReadOnlyProviderReadinessCertificate")),
        hasActivationBlockerSentinel:present(resolveSummary(safe, "providerActivationBlockerSentinelSummary", "WeishanGlobalShoppingProviderActivationBlockerSentinel", "buildGlobalShoppingProviderActivationBlockerSentinel")),
        hasSecurityRegressionGuard:present(safe.adapterSecurityRegressionGuardSummary),
        guaranteeRuleCount:guaranteeRules.length,
        needsReviewRuleCount:needsReviewRules.length,
        blockedRuleCount:directBlockedReasons.length + blockedRules.length,
        readyForFinalSafetyViewModel:status === "ready",
        humanFinalSafetyReviewRequired:true
      },
      guaranteeRules:guaranteeRules,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedRules.map(function (item) { return item.ruleId + "_blocked"; })),
      userFacingSummary:{
        title:"Provider No-Activation Guarantee Board",
        resultLabel:status === "ready" ? "Provider No-Activation Guarantee Board 已准备" : (status === "blocked" ? "Provider No-Activation Guarantee Board 已阻断" : "Provider No-Activation Guarantee Board 仍需复核"),
        caveat:"该 Board 只展示不激活保证检查，不修改配置、不执行真实阻断、不启用 provider。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingProviderNoActivationGuaranteeRows(result);
    return clone(result);
  }

  function buildGlobalShoppingProviderNoActivationGuaranteeBoardAuditDraft(input) {
    const board = buildGlobalShoppingProviderNoActivationGuaranteeBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_NO_ACTIVATION_GUARANTEE_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_NO_ACTIVATION_GUARANTEE_BOARD_VERSION,
      status:board.status,
      guaranteeRuleCount:obj(board.guaranteeSummary).guaranteeRuleCount || 0,
      blockedRuleCount:obj(board.guaranteeSummary).blockedRuleCount || 0,
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

  function sanitizeGlobalShoppingProviderNoActivationGuaranteeBoard(board) {
    return evaluateGlobalShoppingProviderNoActivationGuaranteeBoard(board || {});
  }

  function buildGlobalShoppingProviderNoActivationGuaranteeBoard(input) {
    try {
      return evaluateGlobalShoppingProviderNoActivationGuaranteeBoard(input || {});
    } catch (_) {
      return evaluateGlobalShoppingProviderNoActivationGuaranteeBoard({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderNoActivationGuaranteeBoard = {
    GLOBAL_SHOPPING_PROVIDER_NO_ACTIVATION_GUARANTEE_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingProviderNoActivationGuaranteeBoard,
    evaluateGlobalShoppingProviderNoActivationGuaranteeBoard,
    buildGlobalShoppingProviderNoActivationGuaranteeRows,
    buildGlobalShoppingProviderNoActivationGuaranteeRules,
    buildGlobalShoppingProviderNoActivationGuaranteeBoardAuditDraft,
    sanitizeGlobalShoppingProviderNoActivationGuaranteeBoard
  };
})();
