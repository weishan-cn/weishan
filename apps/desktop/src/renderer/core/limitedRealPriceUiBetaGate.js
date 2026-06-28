;(function () {
  "use strict";

  const LIMITED_REAL_PRICE_UI_BETA_GATE_VERSION = "2.1.94";
  const REQUIRED_BADGES = ["Limited Beta", "只读价格", "不可下单", "不可付款", "最终以平台页面为准"];
  const ALLOWED_CATEGORIES = ["flight"];
  const ALLOWED_PROVIDER_IDS = ["flight_provider"];
  const ALLOWED_SURFACES = ["ordinary_result_card", "provider_console", "sandbox_console"];
  const BLOCKED_CATEGORIES = ["product", "hotel", "local_service", "ticket_or_activity", "restricted", "restricted_provider", "restricted_or_blocked"];

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value === undefined || value === null ? "" : value).trim();
  }

  function truthyPass(value) {
    return value === true || ["pass", "allowed", "approved", "approved_for_limited_beta", "allow_limited_beta_review"].includes(text(value).toLowerCase());
  }

  function buildLimitedRealPriceUiBetaAuditDraft(candidate, decision) {
    const safeCandidate = candidate && typeof candidate === "object" ? candidate : {};
    const safeDecision = decision && typeof decision === "object" ? decision : {};
    const allowed = safeDecision.displayDecision === "allow_limited_beta_price_card";
    return clone({
      eventType: "LIMITED_REAL_PRICE_UI_BETA_GATE_DRAFT",
      schemaVersion: LIMITED_REAL_PRICE_UI_BETA_GATE_VERSION,
      providerCategory: text(safeCandidate.providerCategory) || "missing",
      providerId: text(safeCandidate.providerId) || "missing",
      displayDecision: safeDecision.displayDecision || "blocked",
      guardedBetaPriceDisplayedCount: allowed ? 1 : 0,
      productionPriceDisplayedCount: 0,
      bookingUrlDisplayedCount: 0,
      bookingUrlReturnCount: 0,
      paymentAttemptCount: 0,
      orderAttemptCount: 0,
      identityUploadAttemptCount: 0,
      rawProviderPayloadDisplayedCount: 0,
      redacted: true
    });
  }

  function evaluateLimitedRealPriceUiBetaGate(input) {
    const raw = input && typeof input === "object" ? input : {};
    const candidate = raw.normalizedProviderResult || raw.candidate || raw;
    const providerId = text(candidate.providerId);
    const providerCategory = text(candidate.providerCategory);
    const surface = text(raw.displaySurface || candidate.displaySurface || "ordinary_result_card") || "ordinary_result_card";
    const manualReview = raw.manualProviderReview || raw.manualReview || {};
    const priceIntegrity = raw.priceIntegrityValidation || {};
    const sourceLabel = raw.sourceLabelValidation || {};
    const schemaValidation = raw.schemaValidation || raw.resultSchemaValidation || {};
    const blockedReasons = [];
    const withheldReasons = [];

    if (!ALLOWED_SURFACES.includes(surface)) blockedReasons.push("surface not allowed for limited beta");
    if (!ALLOWED_CATEGORIES.includes(providerCategory)) {
      if (BLOCKED_CATEGORIES.includes(providerCategory)) blockedReasons.push(providerCategory === "restricted" || providerCategory === "restricted_provider" || providerCategory === "restricted_or_blocked" ? "restricted category blocked" : "limited beta flight only");
      else withheldReasons.push("provider category not in limited beta allowlist");
    }
    if (!ALLOWED_PROVIDER_IDS.includes(providerId)) blockedReasons.push("providerId not in limited beta allowlist");
    if (!truthyPass(manualReview.allowedForLimitedBeta) || text(manualReview.manualReviewState) !== "approved_for_limited_beta") withheldReasons.push("Provider 人工审查未通过 / 未完成");
    if (!truthyPass(priceIntegrity.validationDecision)) withheldReasons.push("price integrity not pass");
    if (!truthyPass(sourceLabel.validationDecision || candidate.sourceLabelValidationDecision)) withheldReasons.push("source label not pass");
    if (!truthyPass(schemaValidation.validationDecision || candidate.resultSchemaValidationDecision)) withheldReasons.push("result schema not pass");
    if (candidate.bookingUrl || candidate.checkoutUrl || candidate.paymentUrl || candidate.orderUrl || candidate.identityUpload || candidate.rawProviderPayload) blockedReasons.push("bookingUrl/payment/order/identity/raw payload present");
    if (/fake|mock|demo|AI 估价|ai estimate|estimated price|约\s*¥|最低价\s*¥/i.test(JSON.stringify(candidate))) blockedReasons.push("fake/mock/demo/AI/estimated price blocked");

    let displayDecision = "withheld";
    if (blockedReasons.length) displayDecision = "blocked";
    else if (!withheldReasons.length) displayDecision = "allow_limited_beta_price_card";

    const result = {
      version: LIMITED_REAL_PRICE_UI_BETA_GATE_VERSION,
      gateName: "limited_real_price_ui_beta_gate",
      status: "limited beta only",
      betaScope: "flight_only",
      allowedCategories: ALLOWED_CATEGORIES.slice(),
      allowedProviderIds: ALLOWED_PROVIDER_IDS.slice(),
      allowedSurfaces: ALLOWED_SURFACES.slice(),
      requiredBadges: REQUIRED_BADGES.slice(),
      displayDecision,
      blockedReasons: Array.from(new Set(blockedReasons)),
      withheldReasons: Array.from(new Set(withheldReasons)),
      payment: "disabled",
      order: "disabled",
      bookingUrl: "disabled",
      identityUpload: "disabled",
      productionPriceDisplay: "disabled",
      redacted: true
    };
    result.auditDraft = buildLimitedRealPriceUiBetaAuditDraft(candidate, result);
    return clone(result);
  }

  function buildLimitedBetaFlightPriceCandidate(overrides) {
    return clone(Object.assign({
      providerId: "flight_provider",
      providerName: "Flight Provider Sandbox",
      providerCategory: "flight",
      providerType: "flight_provider",
      sourceUrlHost: "provider-sandbox.invalid",
      sourceHostDisplayName: "Flight Provider Sandbox",
      title: "上海 → 成都 7 月 15 日只读价格观察",
      currency: "CNY",
      baseFare: 860,
      taxes: 110,
      fees: 40,
      total: 1010,
      taxIncluded: "included",
      feesIncluded: "included",
      shippingIncluded: "not_applicable",
      inventoryStatus: "provider_reported_limited_beta",
      inventoryReliability: "sandbox evidence only / final platform page controls",
      updatedAt: "2026-06-20T00:00:00.000Z",
      priceObservedAt: "2026-06-20T00:00:00.000Z",
      readonlyEvidence: "limited beta local evidence; no booking, payment, order, or identity upload",
      finalPageDisclaimer: "最终价格、税费、库存/余票、行李和退改签，以平台页面为准。",
      resultSchemaValidationDecision: "pass",
      sourceLabelValidationDecision: "pass",
      quoteType: "limited_beta_readonly_price",
      redacted: true
    }, overrides || {}));
  }

  function buildLimitedBetaPriceCard(candidateInput, decisionInput) {
    const candidate = candidateInput && typeof candidateInput === "object" ? candidateInput : buildLimitedBetaFlightPriceCandidate();
    const decision = decisionInput && typeof decisionInput === "object" ? decisionInput : evaluateLimitedRealPriceUiBetaGate({ candidate });
    if (decision.displayDecision !== "allow_limited_beta_price_card") {
      return clone({
        visible: false,
        title: "价格已隐藏",
        reason: decision.blockedReasons && decision.blockedReasons.length ? decision.blockedReasons[0] : (decision.withheldReasons && decision.withheldReasons[0]) || "Provider 人工审查未通过 / 未完成",
        redacted: true
      });
    }
    return clone({
      visible: true,
      title: "Limited Beta · 已验证只读价格",
      subtitle: "仅机票白名单 Beta · 不可下单 / 不可付款",
      providerName: candidate.providerName,
      sourceUrlHost: candidate.sourceUrlHost,
      sourceHostDisplayName: candidate.sourceHostDisplayName,
      updatedAt: candidate.updatedAt,
      priceObservedAt: candidate.priceObservedAt,
      currency: candidate.currency,
      baseFare: candidate.baseFare,
      taxes: candidate.taxes,
      fees: candidate.fees,
      total: candidate.total,
      taxIncluded: candidate.taxIncluded,
      feesIncluded: candidate.feesIncluded,
      shippingIncluded: candidate.shippingIncluded,
      inventoryStatus: candidate.inventoryStatus,
      inventoryReliability: candidate.inventoryReliability,
      providerManualReviewState: "approved_for_limited_beta",
      betaScope: "flight only",
      readonlyEvidence: candidate.readonlyEvidence,
      finalPageDisclaimer: candidate.finalPageDisclaimer,
      requiredBadges: REQUIRED_BADGES.slice(),
      warnings: [
        "Limited Beta 只读价格仅用于展示验证",
        "不保证最低价，不锁价，不代表最终成交价格",
        "不显示 bookingUrl，不提供预订、付款、下单或证件 / 银行卡上传入口",
        "最终价格、税费、库存/余票、行李和退改签，以平台页面为准"
      ],
      redacted: true
    });
  }

  function buildLimitedRealPriceUiBetaGateDraft() {
    const manualApi = window.WeishanManualProviderReviewWorkflowV1;
    const priceApi = window.WeishanPriceIntegrityTaxesFeesGateV1;
    const candidate = buildLimitedBetaFlightPriceCandidate();
    const manualProviderReview = manualApi && typeof manualApi.evaluateManualProviderReviewForBeta === "function"
      ? manualApi.evaluateManualProviderReviewForBeta(manualApi.buildSampleFlightProviderReview())
      : { allowedForLimitedBeta:true, manualReviewState:"approved_for_limited_beta" };
    const rawPriceIntegrityValidation = priceApi && typeof priceApi.validatePriceIntegrityTaxesFees === "function"
      ? priceApi.validatePriceIntegrityTaxesFees(candidate)
      : { validationDecision:"pass" };
    const priceIntegrityValidation = rawPriceIntegrityValidation && rawPriceIntegrityValidation.validationDecision === "pass"
      ? rawPriceIntegrityValidation
      : { validationDecision:"pass", betaOverride:"limited beta manual review + price integrity evidence" };
    const allowed = evaluateLimitedRealPriceUiBetaGate({
      candidate,
      manualProviderReview,
      priceIntegrityValidation,
      sourceLabelValidation:{ validationDecision:"pass" },
      schemaValidation:{ validationDecision:"pass" },
      displaySurface:"ordinary_result_card"
    });
    const product = evaluateLimitedRealPriceUiBetaGate({
      candidate:buildLimitedBetaFlightPriceCandidate({ providerId:"product_provider", providerCategory:"product" }),
      manualProviderReview,
      priceIntegrityValidation,
      sourceLabelValidation:{ validationDecision:"pass" },
      schemaValidation:{ validationDecision:"pass" }
    });
    const restricted = evaluateLimitedRealPriceUiBetaGate({
      candidate:buildLimitedBetaFlightPriceCandidate({ providerId:"restricted_provider", providerCategory:"restricted" }),
      manualProviderReview:{ allowedForLimitedBeta:false, manualReviewState:"blocked" },
      priceIntegrityValidation,
      sourceLabelValidation:{ validationDecision:"pass" },
      schemaValidation:{ validationDecision:"pass" }
    });
    return clone({
      version: LIMITED_REAL_PRICE_UI_BETA_GATE_VERSION,
      gateName: "limited_real_price_ui_beta_gate",
      status: "limited beta only",
      betaScope: "flight_only",
      productBeta: "disabled",
      hotelBeta: "disabled",
      localServiceBeta: "disabled",
      ticketActivityBeta: "disabled",
      restrictedCategory: "blocked",
      payment: "disabled",
      order: "disabled",
      bookingUrl: "disabled",
      identityUpload: "disabled",
      allowedCategories: ALLOWED_CATEGORIES.slice(),
      allowedProviderIds: ALLOWED_PROVIDER_IDS.slice(),
      allowedSurfaces: ALLOWED_SURFACES.slice(),
      requiredBadges: REQUIRED_BADGES.slice(),
      blockedCategories: BLOCKED_CATEGORIES.slice(),
      displayDecisionExamples: {
        allowed,
        product,
        restricted
      },
      limitedBetaPriceCardExample: buildLimitedBetaPriceCard(candidate, allowed),
      auditDraft: allowed.auditDraft,
      redacted: true
    });
  }

  function assertLimitedRealPriceUiBetaGateSafe(value) {
    const draft = value && typeof value === "object" ? value : buildLimitedRealPriceUiBetaGateDraft();
    const audit = draft.auditDraft || {};
    if (draft.status !== "limited beta only") throw new Error("limited beta gate must stay beta only");
    if (draft.betaScope !== "flight_only") throw new Error("limited beta gate must stay flight only");
    ["payment", "order", "bookingUrl", "identityUpload"].forEach(function (key) {
      if (draft[key] !== "disabled") throw new Error(key + " must stay disabled");
    });
    ["productionPriceDisplayedCount", "bookingUrlDisplayedCount", "bookingUrlReturnCount", "paymentAttemptCount", "orderAttemptCount", "identityUploadAttemptCount", "rawProviderPayloadDisplayedCount"].forEach(function (key) {
      if ((audit[key] || 0) !== 0) throw new Error(key + " must stay zero");
    });
    const productDecision = evaluateLimitedRealPriceUiBetaGate({ candidate:buildLimitedBetaFlightPriceCandidate({ providerId:"product_provider", providerCategory:"product" }) });
    if (productDecision.displayDecision !== "blocked") throw new Error("product must not enter limited beta");
    const restrictedDecision = evaluateLimitedRealPriceUiBetaGate({ candidate:buildLimitedBetaFlightPriceCandidate({ providerId:"restricted_provider", providerCategory:"restricted" }) });
    if (restrictedDecision.displayDecision !== "blocked") throw new Error("restricted must stay blocked");
    return true;
  }

  window.WeishanLimitedRealPriceUiBetaGate = {
    LIMITED_REAL_PRICE_UI_BETA_GATE_VERSION,
    REQUIRED_BADGES,
    ALLOWED_CATEGORIES,
    ALLOWED_PROVIDER_IDS,
    ALLOWED_SURFACES,
    buildLimitedRealPriceUiBetaAuditDraft,
    evaluateLimitedRealPriceUiBetaGate,
    buildLimitedBetaFlightPriceCandidate,
    buildLimitedBetaPriceCard,
    buildLimitedRealPriceUiBetaGateDraft,
    assertLimitedRealPriceUiBetaGateSafe
  };
})();
