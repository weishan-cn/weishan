(function(){
  const PRICE_INTEGRITY_TAXES_FEES_GATE_VERSION = "2.1.55";

  const priceQuoteRequiredFields = [
    "providerId",
    "providerName",
    "sourceUrlHost",
    "currency",
    "baseFare",
    "taxes",
    "fees",
    "total",
    "priceObservedAt",
    "updatedAt",
    "readonlyEvidence",
    "taxFeeCompleteness",
    "quoteType",
    "redacted: true"
  ];

  const displayPrerequisites = [
    "没有 providerId 不显示价格",
    "没有 providerName 不显示价格",
    "没有 sourceUrlHost 不显示价格",
    "没有 currency 不显示价格",
    "没有 total 不显示价格",
    "没有 taxes / fees 完整性信息不显示价格",
    "没有 updatedAt 不显示价格",
    "没有 readonlyEvidence 不显示价格",
    "没有 source label gate 通过不显示价格",
    "没有 result schema gate 通过不显示价格"
  ];

  const currentPricePolicy = [
    "当前版本仍隐藏价格",
    "当前只显示“暂无真实价格结果”",
    "当前不得显示 fake price",
    "当前不得显示 mock price",
    "当前不得显示 demo price",
    "当前不得显示 AI 估价",
    "当前不得显示最低价 / 约 ¥xxx / estimated price",
    "当前不得根据不完整来源计算最低价"
  ];

  const taxFeeRules = [
    "baseFare、taxes、fees、total 必须可追溯",
    "税费缺失则 price withheld",
    "税费未知则 price withheld",
    "币种缺失则 price withheld",
    "更新时间缺失则 price withheld",
    "provider evidence 缺失则 price withheld",
    "source label 缺失则 price withheld"
  ];

  const riskSignals = [
    "priceIntegrityRiskScanDraft",
    "missingCurrency",
    "missingTaxes",
    "missingFees",
    "missingUpdatedAt",
    "missingReadonlyEvidence",
    "untrustedSourceHost",
    "estimatedPriceDetected",
    "mockPriceDetected",
    "bookingUrlDetected",
    "rawProviderPayloadDetected",
    "redacted: true"
  ];

  const linkage = [
    "provider result source label gate",
    "只读 provider result schema gate",
    "只读 provider sandbox gate",
    "provider endpoint allowlist gate",
    "密钥脱敏规则",
    "API 绑定准备状态"
  ];

  const commercePriceIntegrityTaxesFeesGateContract = {
    version:PRICE_INTEGRITY_TAXES_FEES_GATE_VERSION,
    moduleName:"price_integrity_taxes_fees_gate",
    phase:"price_integrity_taxes_fees_gate",
    gateStatus:"closed",
    mode:"draft_only",
    realPriceDisplay:"guarded_sandbox_test_only",
    realProviderPrice:"withheld_until_manual_review",
    taxFeeVerification:"price_integrity_validation_only",
    realProviderResultRead:"disabled",
    realNetwork:"disabled",
    realBookingUrlDisplay:"disabled",
    capabilities:{
      canShowPriceIntegrityGate:true,
      canShowRequiredQuoteFields:true,
      canShowDisplayPrerequisites:true,
      canShowCurrentPricePolicy:true,
      canShowTaxFeeCompletenessRules:true,
      canShowRiskScanDraft:true,
      canShowAuditDraft:true,
      canReadRealProviderResult:false,
      canDisplayRealPrice:true,
      canCalculateLowestPrice:false,
      canDisplayAvailability:false,
      canDisplayBookingUrl:false,
      canUseNetwork:false,
      canConnectEndpoint:false,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false,
      canInputApiKey:false,
      canSaveApiKey:false,
      canReadApiKey:false
    },
    display:{
      title:"Price Integrity / Taxes / Fees Gate V1",
      establishedLine:"price integrity / taxes / fees gate：已建立",
      gateStatusLine:"status: price integrity validation only",
      modeLine:"schemaVersion: price_integrity_v1",
      realPriceLine:"sandbox/test price display: guarded only",
      providerPriceLine:"production price display: disabled",
      taxFeeLine:"tax fee completeness required",
      safetyLine:"只有 schema/source label/price integrity 全部通过的 sandbox/test provider price 才能进入 guarded card；不显示 fake/mock/demo/AI 估价，不显示 bookingUrl。"
    }
  };

  function clone(value){ return JSON.parse(JSON.stringify(value)); }

  function buildPriceQuoteRequiredFieldsDraft(){
    return {
      version:PRICE_INTEGRITY_TAXES_FEES_GATE_VERSION,
      requiredFields:priceQuoteRequiredFields.slice(),
      currentStatus:"draft_only",
      redacted:true
    };
  }

  function buildPriceDisplayPrerequisitesDraft(){
    return {
      version:PRICE_INTEGRITY_TAXES_FEES_GATE_VERSION,
      prerequisites:displayPrerequisites.slice(),
      decisionWithoutPrerequisites:"price withheld",
      redacted:true
    };
  }

  function buildCurrentPricePolicyDraft(){
    return {
      version:PRICE_INTEGRITY_TAXES_FEES_GATE_VERSION,
      policy:currentPricePolicy.slice(),
      currentVisibleResult:"暂无真实价格结果",
      canShowFakePrice:false,
      canShowMockPrice:false,
      canShowDemoPrice:false,
      canShowAiEstimate:false,
      redacted:true
    };
  }

  function buildTaxFeeCompletenessRulesDraft(){
    return {
      version:PRICE_INTEGRITY_TAXES_FEES_GATE_VERSION,
      rules:taxFeeRules.slice(),
      missingTaxesDecision:"price withheld",
      missingFeesDecision:"price withheld",
      missingCurrencyDecision:"price withheld",
      missingEvidenceDecision:"price withheld",
      redacted:true
    };
  }

  function buildPriceIntegrityRiskScanDraft(){
    return {
      version:PRICE_INTEGRITY_TAXES_FEES_GATE_VERSION,
      priceIntegrityRiskScanDraft:riskSignals.slice(),
      currentRiskLevel:"blocked",
      bookingUrlDetected:"blocked",
      rawProviderPayloadDetected:"blocked",
      redacted:true
    };
  }

  function buildPriceIntegrityAuditDraft(){
    return {
      version:PRICE_INTEGRITY_TAXES_FEES_GATE_VERSION,
      priceIntegrityAuditDraft:{
        eventType:"PRICE_INTEGRITY_EVALUATION_DRAFT",
        schemaVersion:PRICE_INTEGRITY_TAXES_FEES_GATE_VERSION,
        gateState:"closed",
        withheldReason:"price_integrity_gate_closed",
        providerId:"none",
        sourceUrlHost:"none",
        priceObservedAt:"none",
        taxFeeCompleteness:"none",
        redacted:true
      },
      allowedFields:["eventType", "schemaVersion", "gateState", "withheldReason", "providerId", "sourceUrlHost", "priceObservedAt", "taxFeeCompleteness", "redacted"],
      forbiddenFields:["raw provider payload", "bookingUrl", "checkoutUrl", "paymentUrl", "apiKey", "token", "secret"],
      redacted:true
    };
  }

  function evaluatePriceIntegrityDraft(input){
    const data = input && typeof input === "object" ? input : {};
    const missing = ["providerId", "providerName", "sourceUrlHost", "currency", "total", "updatedAt", "readonlyEvidence"].filter(function(key){ return !data[key]; });
    if (!data.taxFeeCompleteness) missing.push("taxFeeCompleteness");
    return {
      version:PRICE_INTEGRITY_TAXES_FEES_GATE_VERSION,
      allowed:false,
      gateStatus:"closed",
      mode:"draft_only",
      decision:"price withheld",
      withheldReason:missing.length ? "missing_" + missing[0] : "price_integrity_gate_closed",
      missingFields:missing,
      canDisplayRealPrice:false,
      canDisplayBookingUrl:false,
      canUseNetwork:false,
      redacted:true
    };
  }

  function buildPriceIntegrityV1Display(){
    const api = window.WeishanPriceIntegrityTaxesFeesGateV1;
    if (!api || typeof api.buildPriceIntegrityTaxesFeesGateV1Draft !== "function") return null;
    return api.buildPriceIntegrityTaxesFeesGateV1Draft();
  }

  function assertPriceIntegrityTaxesFeesGateSafe(gate){
    const target = gate && typeof gate === "object" ? gate : commercePriceIntegrityTaxesFeesGateContract;
    const caps = target.capabilities || {};
    if (target.gateStatus !== "closed") throw new Error("price integrity gate must stay closed");
    if (target.mode !== "draft_only") throw new Error("price integrity gate must stay draft only");
    [
      ["realNetwork", "disabled"],
      ["realBookingUrlDisplay", "disabled"]
    ].forEach(function(pair){
      if (target[pair[0]] !== pair[1]) throw new Error(pair[0] + " must be " + pair[1]);
    });
    [
      "canReadRealProviderResult",
      "canCalculateLowestPrice",
      "canDisplayAvailability",
      "canDisplayBookingUrl",
      "canUseNetwork",
      "canConnectEndpoint",
      "canCreateOrder",
      "canPay",
      "canUploadIdentity",
      "canInputApiKey",
      "canSaveApiKey",
      "canReadApiKey"
    ].forEach(function(key){
      if (caps[key] !== false) throw new Error(key + " must be false");
    });
    const evaluation = evaluatePriceIntegrityDraft({ providerId:"draft", providerName:"draft", currency:"CNY", total:"demo price", bookingUrl:"https://example.invalid/checkout" });
    if (evaluation.allowed !== false || evaluation.canDisplayRealPrice !== false || evaluation.canDisplayBookingUrl !== false) {
      throw new Error("price integrity evaluation must remain withheld");
    }
    return true;
  }

  function buildPriceIntegrityTaxesFeesGateDisplay(gate){
    const v1 = buildPriceIntegrityV1Display();
    const base = Object.assign({}, commercePriceIntegrityTaxesFeesGateContract, gate && typeof gate === "object" ? gate : {});
    return Object.assign({}, clone(base), {
      v1,
      quoteRequiredFields:buildPriceQuoteRequiredFieldsDraft(),
      displayPrerequisites:buildPriceDisplayPrerequisitesDraft(),
      currentPricePolicy:buildCurrentPricePolicyDraft(),
      taxFeeCompletenessRules:buildTaxFeeCompletenessRulesDraft(),
      riskScan:buildPriceIntegrityRiskScanDraft(),
      audit:buildPriceIntegrityAuditDraft(),
      linkage:linkage.slice(),
      evaluation:evaluatePriceIntegrityDraft({})
    });
  }

  window.WeishanCommercePriceIntegrityTaxesFeesGate = {
    PRICE_INTEGRITY_TAXES_FEES_GATE_VERSION,
    commercePriceIntegrityTaxesFeesGateContract,
    buildPriceQuoteRequiredFieldsDraft,
    buildPriceDisplayPrerequisitesDraft,
    buildCurrentPricePolicyDraft,
    buildTaxFeeCompletenessRulesDraft,
    buildPriceIntegrityRiskScanDraft,
    buildPriceIntegrityAuditDraft,
    evaluatePriceIntegrityDraft,
    buildPriceIntegrityV1Display,
    assertPriceIntegrityTaxesFeesGateSafe,
    buildPriceIntegrityTaxesFeesGateDisplay
  };
})();
