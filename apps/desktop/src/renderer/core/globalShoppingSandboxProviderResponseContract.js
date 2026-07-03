;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SANDBOX_PROVIDER_RESPONSE_CONTRACT_VERSION = "4.1.6";
  const CONTRACT_NAME = "global_shopping_sandbox_provider_response_contract_v1";
  const RESULT_LABELS = {
    ready:"Provider 响应合同已准备",
    needs_review:"Provider 响应合同仍需复核",
    blocked:"Provider 响应合同已阻断",
    failed_safe:"Provider 响应合同已阻断"
  };

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
  function bool(value) { return value === true; }
  function present(value) {
    return value === true || (typeof value === "string" && value.trim().length > 0);
  }
  function responseMode(input) {
    const safe = obj(input);
    const fixture = obj(safe.providerFixture);
    const payload = obj(safe.mockProviderPayload);
    const explicit = text(safe.responseMode || payload.responseMode || fixture.responseMode || fixture.providerStatus || "");
    if (explicit === "sandbox") return "sandbox";
    if (explicit === "fixture") return "fixture";
    return "disabled";
  }
  function providerInfo(input) {
    const safe = obj(input);
    const fixture = obj(safe.providerFixture);
    const payload = obj(safe.mockProviderPayload);
    return {
      providerId:text(fixture.providerId || payload.providerId || "global_fixture_provider"),
      providerName:text(fixture.providerName || payload.providerName || "Global Shopping Fixture Sandbox")
    };
  }
  function normalizedSummary(input) {
    const safe = obj(input);
    const normalizedSourceInputs = toArray(safe.normalizedSourceInputs);
    const officialFixturePrice = obj(safe.officialFixturePrice);
    const authorizedFixturePrices = toArray(safe.authorizedFixturePrices);
    const partnerFixturePrices = toArray(safe.partnerFixturePrices);
    const affiliateFixturePrices = toArray(safe.affiliateFixturePrices);
    const aggregatorFixturePrices = toArray(safe.aggregatorFixturePrices);
    const officialSourceCount = officialFixturePrice.title || officialFixturePrice.basePrice != null ? 1 : 0;
    const authorizedSourceCount = authorizedFixturePrices.length;
    const partnerSourceCount = partnerFixturePrices.length;
    const affiliateSourceCount = affiliateFixturePrices.length;
    const aggregatorSourceCount = aggregatorFixturePrices.length;
    const fixtureSourceCount = officialSourceCount + authorizedSourceCount + partnerSourceCount + affiliateSourceCount + aggregatorSourceCount;
    return {
      sourceInputCount:normalizedSourceInputs.length,
      officialSourceCount:officialSourceCount,
      authorizedSourceCount:authorizedSourceCount,
      partnerSourceCount:partnerSourceCount,
      affiliateSourceCount:affiliateSourceCount,
      aggregatorSourceCount:aggregatorSourceCount,
      fixtureSourceCount:fixtureSourceCount,
      hasOfficialSource:officialSourceCount > 0,
      hasCoveredCandidateSources:authorizedSourceCount + partnerSourceCount + affiliateSourceCount + aggregatorSourceCount > 0,
      canEnterPricePipeline:normalizedSourceInputs.length > 0 || fixtureSourceCount > 0
    };
  }
  function boundary(input) {
    const safe = obj(input);
    const payload = obj(safe.mockProviderPayload);
    const provider = providerInfo(safe);
    return {
      providerId:provider.providerId,
      providerName:provider.providerName,
      responseMode:responseMode(safe),
      fixtureOnly:true,
      sandboxOnly:true,
      readOnly:true,
      productionDisabled:true,
      rawResponseStored:false,
      rawResponseExposedToRenderer:false,
      rawResponseLogged:false,
      canContainRealApiKey:false,
      canContainUserIdentity:false,
      canContainPaymentData:false,
      canContainBookingUrl:false,
      canContainCheckoutUrl:false,
      canContainPaymentUrl:false,
      canContainOrderUrl:false,
      canTriggerCheckout:false,
      canTriggerPayment:false,
      canTriggerTicketing:false,
      detectedStorageFlags:{
        rawResponseStored:bool(payload.rawResponseStored || safe.rawResponseStored),
        rawResponseExposedToRenderer:bool(payload.rawResponseExposedToRenderer || safe.rawResponseExposedToRenderer),
        rawResponseLogged:bool(payload.rawResponseLogged || safe.rawResponseLogged),
        realApiKey:bool(payload.realApiKeyDetected || safe.realApiKeyDetected),
        userIdentity:bool(payload.userIdentityDetected || safe.userIdentityDetected),
        paymentData:bool(payload.paymentDataDetected || safe.paymentDataDetected),
        transactionUrl:present(payload.bookingUrl) || present(payload.checkoutUrl) || present(payload.paymentUrl) || present(payload.orderUrl) || present(safe.bookingUrl) || present(safe.checkoutUrl) || present(safe.paymentUrl) || present(safe.orderUrl),
        checkout:bool(payload.checkout || safe.checkout),
        payment:bool(payload.payment || safe.payment),
        ticketing:bool(payload.ticketing || safe.ticketing)
      }
    };
  }
  function evaluateGlobalShoppingSandboxProviderResponse(input) {
    const safe = obj(input);
    const fixture = obj(safe.providerFixture);
    const credentialSafetyReview = obj(safe.credentialSafetyReview);
    const sandboxPriceFeedGate = obj(safe.sandboxPriceFeedGate);
    const summary = normalizedSummary(safe);
    const responseBoundary = boundary(safe);
    const detected = obj(responseBoundary.detectedStorageFlags);
    const health = {
      hasProviderFixture:Object.keys(fixture).length > 0,
      hasCredentialSafety:Object.keys(credentialSafetyReview).length > 0,
      hasSandboxFeedGate:Object.keys(sandboxPriceFeedGate).length > 0,
      hasNormalizedSummary:summary.sourceInputCount > 0 || summary.fixtureSourceCount > 0,
      noRawResponsePersistence:detected.rawResponseStored !== true,
      noRawResponseRendererLeak:detected.rawResponseExposedToRenderer !== true,
      noRawResponseLogging:detected.rawResponseLogged !== true,
      noRealApiKey:detected.realApiKey !== true,
      noUserIdentity:detected.userIdentity !== true,
      noPaymentData:detected.paymentData !== true,
      noTransactionUrl:detected.transactionUrl !== true,
      noCheckout:detected.checkout !== true,
      noPayment:detected.payment !== true,
      noTicketing:detected.ticketing !== true
    };
    const blockedReasons = [];
    if (!health.noRawResponsePersistence) blockedReasons.push("raw_response_persistence_detected");
    if (!health.noRawResponseRendererLeak) blockedReasons.push("raw_response_renderer_leak_detected");
    if (!health.noRawResponseLogging) blockedReasons.push("raw_response_logging_detected");
    if (!health.noRealApiKey) blockedReasons.push("real_api_key_detected");
    if (!health.noUserIdentity) blockedReasons.push("user_identity_detected");
    if (!health.noPaymentData) blockedReasons.push("payment_data_detected");
    if (!health.noTransactionUrl) blockedReasons.push("transaction_url_detected");
    if (!health.noCheckout) blockedReasons.push("checkout_capability_detected");
    if (!health.noPayment) blockedReasons.push("payment_capability_detected");
    if (!health.noTicketing) blockedReasons.push("ticketing_capability_detected");
    const needsReview = !health.hasProviderFixture || !health.hasCredentialSafety || !health.hasSandboxFeedGate || !health.hasNormalizedSummary;
    return clone({
      responseBoundary:responseBoundary,
      normalizedSummary:summary,
      responseHealth:health,
      blockedReasons:blockedReasons,
      status:blockedReasons.length ? "blocked" : (needsReview ? "needs_review" : "ready"),
      redacted:true
    });
  }
  function buildGlobalShoppingSandboxProviderResponseRows(input) {
    const evaluation = evaluateGlobalShoppingSandboxProviderResponse(input || {});
    const health = evaluation.responseHealth;
    const summary = evaluation.normalizedSummary;
    return clone([
      row("provider_fixture", "Provider Fixture", health.hasProviderFixture ? "已接入 fixture" : "仍需补充", health.hasProviderFixture ? "pass" : "warning"),
      row("credential_safety", "凭据安全", health.hasCredentialSafety ? "已具备凭据安全复核" : "仍需补充", health.hasCredentialSafety ? "pass" : "warning"),
      row("sandbox_feed", "Sandbox Feed", health.hasSandboxFeedGate ? "已具备 Sandbox Feed 闸门" : "仍需补充", health.hasSandboxFeedGate ? "pass" : "warning"),
      row("normalized_sources", "归一化摘要", summary.canEnterPricePipeline ? "可进入价格流水线" : "仍需复核", summary.canEnterPricePipeline ? "pass" : "warning"),
      row("raw_response", "Raw provider response", health.noRawResponsePersistence && health.noRawResponseRendererLeak && health.noRawResponseLogging ? "不持久化 / 不渲染 / 不记录" : "已阻断风险", health.noRawResponsePersistence && health.noRawResponseRendererLeak && health.noRawResponseLogging ? "pass" : "blocked"),
      row("transaction_boundary", "交易边界", health.noTransactionUrl && health.noCheckout && health.noPayment && health.noTicketing ? "无交易 URL / 无支付 / 无出票" : "已阻断风险", health.noTransactionUrl && health.noCheckout && health.noPayment && health.noTicketing ? "pass" : "blocked")
    ]);
  }
  function sanitizeGlobalShoppingSandboxProviderResponseContract(contract) {
    const safe = obj(contract);
    const evaluation = evaluateGlobalShoppingSandboxProviderResponse(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      contractName:CONTRACT_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_PROVIDER_RESPONSE_CONTRACT_VERSION,
      status:status,
      responseBoundary:clone(evaluation.responseBoundary),
      normalizedSummary:clone(evaluation.normalizedSummary),
      responseHealth:clone(evaluation.responseHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingSandboxProviderResponseRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"Sandbox Provider 响应合同",
        resultLabel:RESULT_LABELS[status] || RESULT_LABELS.failed_safe,
        caveat:"当前只允许只读 fixture/sandbox provider 摘要进入价格流水线，不保存 raw response，不代表真实价格、可订或可下单能力。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingSandboxProviderResponseContract(input) {
    try {
      return sanitizeGlobalShoppingSandboxProviderResponseContract(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingSandboxProviderResponseContract({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingSandboxProviderResponseContractAuditDraft(input) {
    const contract = buildGlobalShoppingSandboxProviderResponseContract(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_SANDBOX_PROVIDER_RESPONSE_CONTRACT_AUDIT_DRAFT",
      contractName:CONTRACT_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_PROVIDER_RESPONSE_CONTRACT_VERSION,
      status:contract.status,
      rowCount:contract.rows.length,
      blockedReasons:contract.blockedReasons,
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

  window.WeishanGlobalShoppingSandboxProviderResponseContract = {
    GLOBAL_SHOPPING_SANDBOX_PROVIDER_RESPONSE_CONTRACT_VERSION,
    CONTRACT_NAME,
    buildGlobalShoppingSandboxProviderResponseContract,
    evaluateGlobalShoppingSandboxProviderResponse,
    buildGlobalShoppingSandboxProviderResponseRows,
    buildGlobalShoppingSandboxProviderResponseContractAuditDraft,
    sanitizeGlobalShoppingSandboxProviderResponseContract
  };
})();
