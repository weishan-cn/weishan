;(function () {
  "use strict";

  const GLOBAL_SHOPPING_CATEGORY_RESULT_SIMULATOR_VERSION = "4.1.7";
  const SIMULATOR_NAME = "global_shopping_category_result_simulator_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, category_result_simulator_only:true };
  const REQUIRED_CATEGORIES = ["flight", "hotel", "product"];
  const SECRET_RE = /token|apiKey|key|secret|password|credential/i;
  const BLOCKED_RUNTIME_RE = /provider|network|endpoint|openExternal|window\.open/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function safeMode(value) {
    const mode = text(value || "category_result_simulator_only");
    return ALLOWED_MODES[mode] ? mode : "category_result_simulator_only";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function card(cardId, label, value, tone) {
    return { cardId:text(cardId), label:text(label), value:text(value), tone:/^(info|warning|blocked)$/.test(tone) ? tone : "info", redacted:true };
  }
  function bool(value) { return value === true; }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function blockedClaimText(value) { return BLOCKED_RUNTIME_RE.test(text(value)); }
  function hasRuntimeBoundaryViolation(input) {
    const safe = obj(input);
    const directFlags = [
      safe.provider,
      safe.network,
      safe.endpoint,
      safe.openExternal,
      safe.windowOpen,
      safe["window.open"]
    ];
    if (directFlags.some(function (value) { return value != null && value !== false; })) return true;
    return [
      safe.categoryLabel,
      safe.sourceLabel,
      safe.candidateLabel,
      safe.normalizedPriceLabel,
      safe.evidenceLabel,
      safe.riskLabel
    ].some(function (value) { return blockedClaimText(value); });
  }

  function sanitizeCandidate(input, categoryId) {
    const safe = obj(input);
    return {
      categoryId:text(categoryId),
      candidateId:text(safe.candidateId || safe.quoteId || (categoryId + "-candidate")),
      categoryLabel:text(safe.categoryLabel || (categoryId.charAt(0).toUpperCase() + categoryId.slice(1)) + " 候选结果"),
      sourceLabel:text(safe.sourceLabel || safe.providerName || (categoryId + " mock source")),
      candidateLabel:text(safe.candidateLabel || safe.title || (categoryId + " readonly candidate")),
      normalizedPriceLabel:text(safe.normalizedPriceLabel || safe.priceLabel || "待补充"),
      evidenceLabel:text(safe.evidenceLabel || "只读候选证据"),
      riskLabel:text(safe.riskLabel || "需要人工复核"),
      externalUrl:null,
      platformUrl:null,
      providerUrl:null,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      buyButtonEnabled:false,
      checkoutButtonEnabled:false,
      paymentButtonEnabled:false,
      manualReviewRequired:true,
      readOnly:true,
      providerZeroLocked:true,
      redacted:true
    };
  }

  function detectBlockedReasons(input) {
    const safe = obj(input);
    const reasons = [];
    if (safe.externalUrl != null || safe.platformUrl != null || safe.providerUrl != null) reasons.push("external_url_detected");
    if (safe.bookingUrl != null || safe.checkoutUrl != null || safe.paymentUrl != null || safe.orderUrl != null) reasons.push("transaction_url_detected");
    if (bool(safe.buyButtonEnabled) || bool(safe.checkoutButtonEnabled) || bool(safe.paymentButtonEnabled)) reasons.push("transaction_button_enabled");
    if (safe.rawRequest != null || safe.rawResponse != null || safe.providerPayload != null) reasons.push("raw_provider_payload_detected");
    if (SECRET_RE.test(text(safe.token || safe.apiKey || safe.key || safe.secret || ""))) reasons.push("secret_detected");
    if (hasRuntimeBoundaryViolation(safe)) reasons.push("runtime_boundary_violation");
    return reasons;
  }

  function buildCategoryMap(input) {
    const safe = obj(input);
    const categories = {};
    REQUIRED_CATEGORIES.forEach(function (categoryId) {
      const source = present(safe[categoryId]) ? safe[categoryId] : obj(obj(safe.categories)[categoryId]);
      if (present(source)) categories[categoryId] = sanitizeCandidate(source, categoryId);
    });
    return categories;
  }

  function buildGlobalShoppingCategoryResultRows(input) {
    const safe = obj(input);
    const categories = present(safe.categories) ? obj(safe.categories) : buildCategoryMap(safe);
    const status = safeStatus(safe.status);
    const rows = [
      row("category_result_simulator_status", "Category Result Simulator", status === "ready" ? "Category Result Simulator 已准备" : (status === "blocked" ? "Category Result Simulator 已阻断" : "Category Result Simulator 仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("category_result_simulator_boundary", "Manual Review Required", "仍需人工复核，不代表真实最低价或最终成交价", "warning")
    ];
    REQUIRED_CATEGORIES.forEach(function (categoryId) {
      const category = obj(categories[categoryId]);
      rows.push(row(
        "category_result_" + categoryId,
        categoryId,
        category.categoryLabel || (categoryId + " missing"),
        present(category) ? "pass" : "warning"
      ));
    });
    return clone(rows);
  }

  function buildGlobalShoppingCategoryResultCards(input) {
    const categories = present(obj(input).categories) ? obj(obj(input).categories) : buildCategoryMap(input);
    return clone(REQUIRED_CATEGORIES.map(function (categoryId) {
      const category = obj(categories[categoryId]);
      return card(
        "category_result_card_" + categoryId,
        category.categoryLabel || (categoryId + " missing"),
        present(category) ? ((category.normalizedPriceLabel || "待补充") + " / " + (category.evidenceLabel || "只读候选证据")) : "needs review",
        present(category) ? "info" : "warning"
      );
    }));
  }

  function evaluateGlobalShoppingCategoryResultSimulator(input) {
    const safe = obj(input);
    const categories = buildCategoryMap(safe);
    const blockedReasons = detectBlockedReasons(safe);
    REQUIRED_CATEGORIES.forEach(function (categoryId) {
      if (present(categories[categoryId])) {
        blockedReasons.push.apply(blockedReasons, detectBlockedReasons(categories[categoryId]).map(function (reason) { return categoryId + "_" + reason; }));
      }
    });
    const missingCategory = REQUIRED_CATEGORIES.some(function (categoryId) { return !present(categories[categoryId]); });
    const status = blockedReasons.length ? "blocked" : (missingCategory ? "needs_review" : "ready");
    return clone({
      simulatorName:SIMULATOR_NAME,
      appVersion:GLOBAL_SHOPPING_CATEGORY_RESULT_SIMULATOR_VERSION,
      simulatorMode:safeMode(safe.simulatorMode),
      status,
      title:"Category Result Simulator",
      categories,
      rows:buildGlobalShoppingCategoryResultRows({ status, categories }),
      cards:buildGlobalShoppingCategoryResultCards({ categories }),
      blockedReasons:blockedReasons,
      manualReviewRequired:true,
      userFacingSummary:{
        title:"Category Result Simulator",
        resultLabel:status === "ready" ? "Category Result Simulator 已准备" : (status === "blocked" ? "Category Result Simulator 已阻断" : "Category Result Simulator 仍需复核"),
        caveat:"Flight / Hotel / Product 仅展示只读 mock candidate，不代表真实最低价或最终成交价。"
      },
      externalUrl:null,
      platformUrl:null,
      providerUrl:null,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      buyButtonEnabled:false,
      checkoutButtonEnabled:false,
      paymentButtonEnabled:false,
      redacted:true
    });
  }

  function buildGlobalShoppingCategoryResultSimulatorAuditDraft(input) {
    const safe = evaluateGlobalShoppingCategoryResultSimulator(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_CATEGORY_RESULT_SIMULATOR_AUDIT_DRAFT",
      simulatorName:SIMULATOR_NAME,
      appVersion:GLOBAL_SHOPPING_CATEGORY_RESULT_SIMULATOR_VERSION,
      status:safe.status,
      categoryCount:Object.keys(obj(safe.categories)).length,
      blockedReasonCount:toArray(safe.blockedReasons).length,
      manualReviewRequired:true,
      externalUrl:null,
      platformUrl:null,
      providerUrl:null,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      buyButtonEnabled:false,
      checkoutButtonEnabled:false,
      paymentButtonEnabled:false,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingCategoryResultSimulator(simulator) {
    return evaluateGlobalShoppingCategoryResultSimulator(simulator || {});
  }

  window.WeishanGlobalShoppingCategoryResultSimulator = {
    GLOBAL_SHOPPING_CATEGORY_RESULT_SIMULATOR_VERSION,
    SIMULATOR_NAME,
    buildGlobalShoppingCategoryResultSimulator:sanitizeGlobalShoppingCategoryResultSimulator,
    evaluateGlobalShoppingCategoryResultSimulator,
    buildGlobalShoppingCategoryResultRows,
    buildGlobalShoppingCategoryResultCards,
    buildGlobalShoppingCategoryResultSimulatorAuditDraft,
    sanitizeGlobalShoppingCategoryResultSimulator
  };
})();
