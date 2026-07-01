;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SANDBOX_ADAPTER_CONTRACT_TESTBED_VERSION = "3.2.0";
  const TESTBED_NAME = "global_shopping_sandbox_adapter_contract_testbed_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawResponse|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function contractCase(caseId, label, adapterMode, status, summary, caveat) {
    return {
      caseId:text(caseId),
      label:text(label),
      adapterMode:/^(fixture|dry_run|sandbox_ready|disabled)$/.test(adapterMode) ? adapterMode : "disabled",
      status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review",
      requiredBeforeRealSandbox:true,
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

  function buildGlobalShoppingSandboxAdapterContractCases(input) {
    const evaluation = evaluateGlobalShoppingSandboxAdapterContractTestbed(input);
    const reqStatus = evaluation.contractHealth.hasRedactedRequestEnvelopeContract ? "pass" : "needs_review";
    const respStatus = evaluation.contractHealth.hasRedactedResponseSummaryContract ? "pass" : "needs_review";
    const blocked = evaluation.status === "blocked";
    return clone([
      contractCase("fixture_contract", "Fixture adapter 合同", "fixture", blocked ? "blocked" : reqStatus, "输入必须是脱敏 request envelope，输出必须是脱敏 provider response summary。", "Fixture 合同测试不代表真实 provider 接入。"),
      contractCase("dry_run_contract", "Dry-run adapter 合同", "dry_run", blocked ? "blocked" : (reqStatus === "pass" && respStatus === "pass" ? "pass" : "needs_review"), "Dry-run adapter 只能消费脱敏输入，不能泄露 raw response。", "Dry-run 合同测试不发送真实请求。"),
      contractCase("sandbox_ready_contract", "Sandbox-ready adapter 合同", "sandbox_ready", blocked ? "blocked" : respStatus, "Sandbox-ready adapter 仍然必须保持 no real URL / no transaction URL / no external open。", "该合同只描述未来边界，不代表当前已可接通。")
    ]);
  }

  function evaluateGlobalShoppingSandboxAdapterContractTestbed(input) {
    const safe = obj(input);
    const providerRequestEnvelopeSummary = resolveSummary(safe, "providerRequestEnvelopeSummary", "WeishanGlobalShoppingProviderRequestEnvelopeBuilder", "buildGlobalShoppingProviderRequestEnvelopeBuilder", safe);
    const sandboxProviderResponseContractSummary = resolveSummary(safe, "sandboxProviderResponseContractSummary", "WeishanGlobalShoppingSandboxProviderResponseContract", "buildGlobalShoppingSandboxProviderResponseContract", safe);
    const blocked =
      safe.rawResponse === true ||
      safe.rawResponseStored === true ||
      safe.realUrl === true ||
      safe.readApiKey === true ||
      safe.transactionUrl === true ||
      safe.checkout === true ||
      safe.payment === true ||
      safe.order === true ||
      safe.ticketing === true ||
      safe.rendererRawLeak === true ||
      safe.openExternal === true ||
      safe.windowOpen === true ||
      safe.network === true ||
      safe.realEndpoint === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl;
    const contractHealth = {
      hasRedactedRequestEnvelopeContract:Object.keys(providerRequestEnvelopeSummary).length > 0,
      hasRedactedResponseSummaryContract:Object.keys(sandboxProviderResponseContractSummary).length > 0,
      noRawResponse:safe.rawResponse !== true && safe.rawResponseStored !== true,
      noRealUrl:safe.realUrl !== true,
      noApiKey:safe.readApiKey !== true,
      noTransactionUrl:safe.transactionUrl !== true && !(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl),
      noCheckoutPaymentTicketingOrder:safe.checkout !== true && safe.payment !== true && safe.order !== true && safe.ticketing !== true,
      noRendererRawLeak:safe.rendererRawLeak !== true,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true,
      noNetworkCall:safe.network !== true,
      noRealEndpoint:safe.realEndpoint !== true
    };
    const needsReview =
      !contractHealth.hasRedactedRequestEnvelopeContract ||
      !contractHealth.hasRedactedResponseSummaryContract;
    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      providerRequestEnvelopeSummary:providerRequestEnvelopeSummary,
      sandboxProviderResponseContractSummary:sandboxProviderResponseContractSummary,
      contractHealth:contractHealth,
      blockedReasons:blocked ? [
        safe.rawResponse === true || safe.rawResponseStored === true ? "raw_response_detected" : "",
        safe.realUrl === true ? "real_url_detected" : "",
        safe.readApiKey === true ? "api_key_detected" : "",
        safe.transactionUrl === true || safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ? "transaction_url_detected" : "",
        safe.checkout === true || safe.payment === true || safe.order === true || safe.ticketing === true ? "transaction_capability_detected" : "",
        safe.rendererRawLeak === true ? "renderer_raw_leak_detected" : "",
        safe.openExternal === true || safe.windowOpen === true ? "external_open_detected" : "",
        safe.network === true ? "network_detected" : "",
        safe.realEndpoint === true ? "real_endpoint_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingSandboxAdapterContractRows(input) {
    const evaluation = evaluateGlobalShoppingSandboxAdapterContractTestbed(input);
    return clone([
      row("request_envelope_contract", "脱敏 request envelope 合同", evaluation.contractHealth.hasRedactedRequestEnvelopeContract ? "request envelope 合同已准备" : "缺少脱敏 request envelope 合同", evaluation.contractHealth.hasRedactedRequestEnvelopeContract ? "pass" : "warning"),
      row("response_summary_contract", "脱敏 provider response summary 合同", evaluation.contractHealth.hasRedactedResponseSummaryContract ? "response summary 合同已准备" : "缺少脱敏 provider response summary 合同", evaluation.contractHealth.hasRedactedResponseSummaryContract ? "pass" : "warning"),
      row("raw_response_boundary", "raw response 边界", "不允许 raw response / raw response persistence", evaluation.contractHealth.noRawResponse ? "pass" : "blocked"),
      row("transaction_boundary", "交易链接与交易动作边界", "不允许真实 URL、交易 URL、checkout/payment/order/ticketing", evaluation.contractHealth.noTransactionUrl && evaluation.contractHealth.noCheckoutPaymentTicketingOrder ? "pass" : "blocked"),
      row("network_boundary", "网络与 endpoint 边界", "不联网、不读 key、不用真实 endpoint、不打开平台", evaluation.contractHealth.noApiKey && evaluation.contractHealth.noNetworkCall && evaluation.contractHealth.noRealEndpoint && evaluation.contractHealth.noExternalOpen ? "pass" : "blocked")
    ]);
  }

  function buildGlobalShoppingSandboxAdapterContractTestbedAuditDraft(input) {
    const testbed = buildGlobalShoppingSandboxAdapterContractTestbed(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_SANDBOX_ADAPTER_CONTRACT_TESTBED_AUDIT_DRAFT",
      testbedName:TESTBED_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_ADAPTER_CONTRACT_TESTBED_VERSION,
      status:testbed.status,
      caseCount:toArray(testbed.contractCases).length,
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

  function sanitizeGlobalShoppingSandboxAdapterContractTestbed(testbed) {
    const safe = obj(testbed);
    const evaluation = evaluateGlobalShoppingSandboxAdapterContractTestbed(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      testbedName:TESTBED_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_ADAPTER_CONTRACT_TESTBED_VERSION,
      status:status,
      testbedBoundary:{
        testbedId:text(safe.testbedId || "global-shopping-sandbox-adapter-contract-testbed"),
        testbedMode:/^(disabled|contract_only|dry_run|sandbox_ready)$/.test(text(safe.testbedMode)) ? text(safe.testbedMode) : "contract_only",
        contractOnly:true,
        readOnly:true,
        sandboxOnly:true,
        redactedOnly:true,
        productionDisabled:true,
        canCallNetwork:false,
        canReadApiKey:false,
        canUseRealEndpoint:false,
        canOpenExternalNow:false,
        canGenerateTransactionUrl:false,
        canCheckout:false,
        canPay:false,
        canTicket:false,
        canCreateOrder:false
      },
      contractCases:toArray(safe.contractCases).length ? toArray(safe.contractCases) : buildGlobalShoppingSandboxAdapterContractCases(safe),
      contractHealth:clone(evaluation.contractHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingSandboxAdapterContractRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      providerRequestEnvelopeSummary:clone(evaluation.providerRequestEnvelopeSummary),
      sandboxProviderResponseContractSummary:clone(evaluation.sandboxProviderResponseContractSummary),
      userFacingSummary:{
        title:"Sandbox Adapter 合同测试台",
        resultLabel:status === "ready" ? "Adapter 合同测试台已准备" : (status === "blocked" ? "Adapter 合同测试台已阻断" : "Adapter 合同测试台仍需复核"),
        caveat:"该测试台只验证未来 adapter 的只读合同，不接真实 provider，不联网，不读取密钥。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingSandboxAdapterContractTestbed(input) {
    try {
      return sanitizeGlobalShoppingSandboxAdapterContractTestbed(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingSandboxAdapterContractTestbed({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingSandboxAdapterContractTestbed = {
    GLOBAL_SHOPPING_SANDBOX_ADAPTER_CONTRACT_TESTBED_VERSION,
    TESTBED_NAME,
    buildGlobalShoppingSandboxAdapterContractTestbed,
    evaluateGlobalShoppingSandboxAdapterContractTestbed,
    buildGlobalShoppingSandboxAdapterContractRows,
    buildGlobalShoppingSandboxAdapterContractCases,
    buildGlobalShoppingSandboxAdapterContractTestbedAuditDraft,
    sanitizeGlobalShoppingSandboxAdapterContractTestbed
  };
})();
