;(function () {
  "use strict";

  const READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION = "2.1.45";
  const PHASE = "read_only_price_candidate_card_view_model_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
    });
  }

  function getRegistryApi() {
    return window.WeishanTrustedFlightSourceRegistry || {};
  }

  function getGateApi() {
    return window.WeishanSafeProviderDeepLinkHandoffGate || {};
  }

  function getConfirmationUiApi() {
    return window.WeishanProviderConfirmationHandoffUi || {};
  }

  function normalizeFlightFields(input) {
    const safe = input && typeof input === "object" ? input : {};
    const task = safe.task && typeof safe.task === "object" ? safe.task : safe;
    const flightFields = safe.flightFields && typeof safe.flightFields === "object" ? safe.flightFields : {};
    const rawTaskText = text(task.rawInput || task.inputSummary || task.title || task.text || safe.rawInput || "");
    const restrictedCategoryDecision = text(safe.restrictedCategoryDecision || task.restrictedCategoryDecision || "");
    const category = text(safe.category || task.category || task.procurementCategory || task.globalProcurementIntent && task.globalProcurementIntent.category || "");
    const restricted = safe.restrictedCategory === true || restrictedCategoryDecision === "blocked" || category === "restricted_or_blocked" || task.status === "blocked";
    return {
      taskTitle: text(task.title || task.rawInput || task.inputSummary || task.text || safe.taskTitle || ""),
      rawTaskText,
      origin: text(flightFields.origin || safe.origin || task.origin || "上海"),
      destination: text(flightFields.destination || safe.destination || task.destination || "成都"),
      departureDate: text(flightFields.date || safe.departureDate || task.departureDate || "2026-07-15"),
      dateDisplay: text(flightFields.dateDisplay || flightFields.date || safe.dateDisplay || task.dateDisplay || "7 月 15 日"),
      directPreference: text(flightFields.directPreference || safe.directPreference || task.directPreference || "直达优先"),
      sortLabel: text(flightFields.goal || safe.sortLabel || task.sortLabel || "低价优先"),
      restrictedCategory: restricted
    };
  }

  function getTrustedSource(providerId) {
    const registryApi = getRegistryApi();
    const registry = typeof registryApi.getTrustedFlightSourceRegistry === "function"
      ? registryApi.getTrustedFlightSourceRegistry()
      : { trustedSources: [] };
    const sources = Array.isArray(registry.trustedSources) ? registry.trustedSources : [];
    const match = sources.find(function (item) {
      return item && item.providerId === providerId;
    }) || sources.find(function (item) {
      return item && item.accessMode === "manual_search_only";
    }) || sources[0] || null;
    return match || {
      providerId: "google_flights_search",
      providerName: "Google Flights",
      providerType: "flight_search",
      accessMode: "manual_search_only",
      safeProviderHandoffUrl: null,
      safeProviderHandoffHost: "google.com",
      productionProvider: "disabled"
    };
  }

  function buildDefaultPriceQuote() {
    return {
      currency: "CNY",
      baseFare: 860,
      taxesAndFees: 110,
      providerFees: 40,
      totalPrice: 1010,
      priceUpdatedAt: "2026-06-20T00:00:00.000Z",
      freshnessStatus: "fresh",
      taxFeeIntegrityStatus: "complete",
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      booking: false,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    };
  }

  function buildReadOnlyPriceCandidateCardViewModel(input) {
    const safe = input && typeof input === "object" ? input : {};
    const normalized = normalizeFlightFields(safe);
    const source = getTrustedSource(text(safe.providerId || safe.source && safe.source.providerId || "google_flights_search"));
    const priceQuote = Object.assign({}, buildDefaultPriceQuote(), safe.priceQuote && typeof safe.priceQuote === "object" ? safe.priceQuote : {});
    const report = safe.report && typeof safe.report === "object" ? safe.report : {};
    const reportProvider = report.provider && typeof report.provider === "object" ? report.provider : {};
    const reportConnector = report.providerConnector && typeof report.providerConnector === "object" ? report.providerConnector : {};
    const providerMode = text(safe.providerMode || reportProvider.providerMode || reportConnector.providerMode || priceQuote.providerMode || "fixture");
    const isSandboxReadOnly = providerMode === "sandbox" || providerMode === "sandbox_read_only";
    const isProductionDisabled = providerMode === "production" || providerMode === "production_disabled";
    const titleLabel = isProductionDisabled ? "生产价格未启用" : (isSandboxReadOnly ? "只读沙盒价" : "只读候选价");
    const candidatePriceLabel = isSandboxReadOnly ? "只读沙盒价" : (isProductionDisabled ? "生产价格未启用" : "候选价");
    const reportHandoff = report.handoff && typeof report.handoff === "object" ? report.handoff : {};
    const safeProviderHandoffUrl = text(reportHandoff.safeProviderHandoffUrl || "");
    const gateApi = getGateApi();
    const gate = typeof gateApi.evaluateSafeProviderDeepLinkHandoff === "function"
      ? gateApi.evaluateSafeProviderDeepLinkHandoff({
        providerId: source.providerId,
        providerName: source.providerName,
        providerType: source.providerType,
        searchOnly: true,
        safeProviderHandoffUrl: safeProviderHandoffUrl || null,
        restrictedCategory: normalized.restrictedCategory
      })
      : {
        status: normalized.restrictedCategory || !safeProviderHandoffUrl ? "blocked" : "confirmation_required",
        candidateDecision: normalized.restrictedCategory || !safeProviderHandoffUrl ? "blocked" : "safe_provider_handoff_ready",
        providerConfirmationLink: normalized.restrictedCategory || !safeProviderHandoffUrl ? "disabled" : "confirmation_required",
        safeProviderHandoffUrl: normalized.restrictedCategory ? null : safeProviderHandoffUrl || null,
        safeProviderHandoffHost: normalized.restrictedCategory || !safeProviderHandoffUrl ? "" : "google.com",
        userConfirmationRequired: true,
        autoOpen: false,
        bookingUrl: null,
        payment: "blocked",
        checkout: "blocked",
        order: "blocked",
        identityUpload: "blocked",
        realProvider: "disabled",
        realNetwork: "disabled",
        redacted: true
      };
    const confirmationUiApi = getConfirmationUiApi();
    const confirmationUi = typeof confirmationUiApi.buildProviderConfirmationHandoffUiModel === "function"
      ? confirmationUiApi.buildProviderConfirmationHandoffUiModel(gate)
      : {
        status: normalized.restrictedCategory || !gate.safeProviderHandoffUrl ? "blocked" : "confirmation_required",
        continueButtonDisabled: normalized.restrictedCategory || !gate.safeProviderHandoffUrl,
        cancelButtonEnabled: true,
        noAutoOpen: true,
        noBookingUrl: true,
        bookingUrl: null,
        noPayment: true,
        noOrder: true,
        noIdentityUpload: true,
        safeProviderHandoffUrl: gate.safeProviderHandoffUrl || null,
        showInMainFlow: false,
        redacted: true
      };
    const visible = normalized.restrictedCategory !== true;
    const routeTitle = normalized.origin + " → " + normalized.destination + " · " + normalized.dateDisplay;
    const breakdownLines = [
      "票面价：" + (priceQuote.baseFare == null ? "未单独提供" : "¥" + priceQuote.baseFare),
      "税费：" + (priceQuote.taxesAndFees == null ? "未单独提供" : "¥" + priceQuote.taxesAndFees),
      "平台服务费：" + (priceQuote.providerFees == null ? "未单独提供" : "¥" + priceQuote.providerFees),
      "最终候选价：" + (priceQuote.totalPrice == null ? "暂无真实价格结果" : "¥" + priceQuote.totalPrice)
    ];
    const safetyLines = [
      "平台最终为准",
      "未锁价",
      "不代表可出票",
      "唯珊不会付款、不会下单、不会上传证件或银行卡",
      "最终价格、库存、税费、行李和退改签以平台页面为准"
    ];
    return clone({
      version: READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION,
      phase: PHASE,
      visible,
      restrictedCategory: normalized.restrictedCategory,
      cardType: "read_only_price_candidate",
      title: titleLabel,
      routeTitle,
      priceDisplay: priceQuote.totalPrice == null ? "暂无真实价格结果" : "¥" + priceQuote.totalPrice,
      priceTruthLabel: titleLabel + " · 平台最终为准 · 未锁价 · 不代表可出票",
      statusLine: titleLabel + "；平台最终为准；未锁价；不代表可出票",
      providerMode: isProductionDisabled ? "production_disabled" : (isSandboxReadOnly ? "sandbox_read_only" : "fixture"),
      providerModeLabel: titleLabel,
      providerName: text(source.providerName || "Google Flights"),
      providerType: text(source.providerType || "flight_search"),
      sourceType: text(source.accessMode || "manual_search_only"),
      sourceHost: text(source.safeProviderHandoffHost || ""),
      sourceUrlHost: text(source.safeProviderHandoffHost || ""),
      candidatePriceSource: text(source.providerName || "Google Flights"),
      candidatePriceSourceMode: text(source.accessMode || "manual_search_only"),
      candidatePriceEvidence: "read_only_candidate_only",
      candidatePriceLabel: candidatePriceLabel,
      platformFinalLabel: "平台最终为准",
      lockStatusLabel: "未锁价",
      ticketEligibilityLabel: "不代表可出票",
      safetyNotice: "唯珊不会付款、不会下单、不会上传证件或银行卡。",
      breakdownLines: breakdownLines,
      safetyLines: safetyLines,
      actionLabel: "去平台确认",
      safeProviderHandoffUrl: gate.safeProviderHandoffUrl || null,
      safeProviderHandoffHost: gate.safeProviderHandoffHost || "",
      providerConfirmationRequired: gate.providerConfirmationLink === "confirmation_required",
      providerConfirmationStatus: confirmationUi.status || "blocked",
      confirmationPromptLine: confirmationUi.summary || "当前平台确认链接未通过安全检查，不能打开平台确认页。",
      noAutoOpen: true,
      noBookingUrl: true,
      bookingUrl: null,
      noPayment: true,
      noOrder: true,
      noIdentityUpload: true,
      priceQuote: {
        currency: text(priceQuote.currency || "CNY"),
        baseFare: priceQuote.baseFare == null ? null : priceQuote.baseFare,
        taxesAndFees: priceQuote.taxesAndFees == null ? null : priceQuote.taxesAndFees,
        providerFees: priceQuote.providerFees == null ? null : priceQuote.providerFees,
        totalPrice: priceQuote.totalPrice == null ? null : priceQuote.totalPrice,
        priceUpdatedAt: text(priceQuote.priceUpdatedAt || ""),
        freshnessStatus: text(priceQuote.freshnessStatus || "fresh"),
        taxFeeIntegrityStatus: text(priceQuote.taxFeeIntegrityStatus || "complete"),
        bookingUrl: null,
        checkoutUrl: null,
        paymentUrl: null,
        orderUrl: null,
        booking: false,
        payment: false,
        order: false,
        identityUpload: false,
        redacted: true
      },
      gate: gate,
      confirmationUi: confirmationUi,
      audit: {
        eventType: "READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_DRAFT",
        version: READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION,
        phase: PHASE,
        visible: visible,
        providerConfirmationRequired: gate.providerConfirmationLink === "confirmation_required",
        safeProviderHandoffUrlDisplayedCount: 0,
        bookingUrlDisplayedCount: 0,
        paymentActionDisplayedCount: 0,
        orderActionDisplayedCount: 0,
        identityUploadAttemptCount: 0,
        realPriceDisplayedCount: 0,
        redacted: true
      },
      redacted: true
    });
  }

  function renderReadOnlyPriceCandidateCardHtml(input) {
    const card = input && typeof input === "object" && input.version ? input : buildReadOnlyPriceCandidateCardViewModel(input);
    if (!card || card.visible !== true) return "";
    const breakdownLines = Array.isArray(card.breakdownLines) ? card.breakdownLines : [];
    const safetyLines = Array.isArray(card.safetyLines) ? card.safetyLines : [];
    return `<section class="commerce-read-only-price-candidate-card" aria-label="只读候选价" data-commerce-read-only-price-candidate-card="true">
      <h5>${escapeHtml(card.title || "只读候选价")}</h5>
      <p>${escapeHtml(card.statusLine || "只读候选价；平台最终为准；未锁价；不代表可出票")}</p>
      <p class="commerce-read-only-price-candidate-card-price">${escapeHtml(card.priceDisplay || "暂无真实价格结果")}</p>
      <p>${escapeHtml(card.providerName || "Google Flights")} · ${escapeHtml(card.providerType || "flight_search")}</p>
      <p>${escapeHtml(card.routeTitle || "")}</p>
      <ul class="commerce-read-only-price-candidate-card-breakdown">${breakdownLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
      <ul class="commerce-read-only-price-candidate-card-safety">${safetyLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
      <p>${escapeHtml(card.safetyNotice || "唯珊不会付款、不会下单、不会上传证件或银行卡。")}</p>
      <div class="commerce-read-only-price-candidate-card-actions">
        <button type="button" class="cmd-btn gray commerce-safe-provider-handoff-btn" data-commerce-safe-provider-handoff-request="true" data-commerce-safe-provider-handoff-kind="${escapeHtml(card.providerType || "flight_search")}" data-commerce-safe-provider-handoff-url="${escapeHtml(encodeURIComponent(card.safeProviderHandoffUrl || ""))}"${card.confirmationUi && card.confirmationUi.continueButtonDisabled ? " disabled" : ""}>${escapeHtml(card.actionLabel || "去平台确认")}</button>
      </div>
      <p>${escapeHtml(card.confirmationPromptLine || "只允许确认后打开可信平台确认页，不自动打开、不付款、不下单。")}</p>
      <p>${escapeHtml(card.platformFinalLabel || "平台最终为准")} · ${escapeHtml(card.lockStatusLabel || "未锁价")} · ${escapeHtml(card.ticketEligibilityLabel || "不代表可出票")}</p>
    </section>`;
  }

  function getReadOnlyPriceCandidateCardViewModelAuditDraft(input) {
    const card = input && typeof input === "object" && input.version ? input : buildReadOnlyPriceCandidateCardViewModel(input);
    return clone(card && card.audit ? card.audit : {
      eventType: "READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_DRAFT",
      version: READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION,
      phase: PHASE,
      visible: false,
      providerConfirmationRequired: false,
      safeProviderHandoffUrlDisplayedCount: 0,
      bookingUrlDisplayedCount: 0,
      paymentActionDisplayedCount: 0,
      orderActionDisplayedCount: 0,
      identityUploadAttemptCount: 0,
      realPriceDisplayedCount: 0,
      redacted: true
    });
  }

  function assertReadOnlyPriceCandidateCardViewModelSafe(value) {
    const card = value && typeof value === "object" ? value : buildReadOnlyPriceCandidateCardViewModel({});
    if (card.redacted !== true) throw new Error("read only price candidate card must stay redacted");
    if (card.noAutoOpen !== true || card.noBookingUrl !== true || card.noPayment !== true || card.noOrder !== true || card.noIdentityUpload !== true) throw new Error("read only price candidate card must keep unsafe actions disabled");
    if (card.bookingUrl !== null) throw new Error("read only price candidate card must not expose bookingUrl");
    if (!Array.isArray(card.breakdownLines) || !card.breakdownLines.length) throw new Error("read only price candidate card must keep price breakdown");
    if (!Array.isArray(card.safetyLines) || !card.safetyLines.length) throw new Error("read only price candidate card must keep safety lines");
    if (card.priceTruthLabel.indexOf("平台最终为准") < 0) throw new Error("read only price candidate card must emphasize platform final");
    if (card.priceTruthLabel.indexOf("未锁价") < 0) throw new Error("read only price candidate card must emphasize not locked");
    if (card.priceTruthLabel.indexOf("不代表可出票") < 0) throw new Error("read only price candidate card must emphasize not ticketable");
    if (card.actionLabel !== "去平台确认") throw new Error("read only price candidate card must keep confirmation action label");
    const serial = JSON.stringify(card);
    if (/fake price|mock price|demo price|AI 估价|全网最低|real final price/i.test(serial)) throw new Error("read only price candidate card must not expose fake or final price claims");
    return true;
  }

  window.WeishanReadOnlyPriceCandidateCardViewModel = {
    READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION,
    PHASE,
    buildReadOnlyPriceCandidateCardViewModel,
    renderReadOnlyPriceCandidateCardHtml,
    getReadOnlyPriceCandidateCardViewModelAuditDraft,
    assertReadOnlyPriceCandidateCardViewModelSafe
  };
})();
