;(function () {
  "use strict";

  const GLOBAL_SHOPPING_CATEGORY_EXPANSION_SHELL_VERSION = "4.0.5";
  const SHELL_NAME = "global_shopping_category_expansion_shell_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, category_expansion_only:true };
  const REQUIRED_CATEGORIES = ["flight", "hotel", "product"];

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|endpoint|providerClient|rawRequest|rawResponse|rawUserText/ig, "redacted")
      .trim();
  }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function safeMode(value) {
    const mode = text(value || "category_expansion_only");
    return ALLOWED_MODES[mode] ? mode : "category_expansion_only";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function card(cardId, label, value) {
    return { cardId:text(cardId), label:text(label), value:text(value), redacted:true };
  }
  function buildCategory(input, categoryId) {
    const safe = obj(input);
    return {
      categoryId,
      readonlySearchIntent:text(safe.readonlySearchIntent || categoryId + " readonly search"),
      candidateEvidence:text(safe.candidateEvidence || "candidate evidence ready"),
      feeNormalization:text(safe.feeNormalization || "fee normalization ready"),
      officialAnchor:text(safe.officialAnchor || "official anchor ready"),
      riskNotes:toArray(safe.riskNotes).map(text),
      userBoundary:text(safe.userBoundary || "Manual Review Required"),
      providerRequest:false,
      liveApi:false,
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
    };
  }
  function categoryBlocked(category) {
    const safe = obj(category);
    return safe.providerRequest === true ||
      safe.liveApi === true ||
      safe.externalUrl != null ||
      safe.platformUrl != null ||
      safe.providerUrl != null ||
      safe.checkout === true ||
      safe.booking === true ||
      safe.payment === true ||
      safe.order === true ||
      safe.ticketing === true ||
      safe.bookingUrl != null ||
      safe.checkoutUrl != null ||
      safe.paymentUrl != null ||
      safe.orderUrl != null ||
      safe.buyButtonEnabled === true ||
      safe.checkoutButtonEnabled === true ||
      safe.paymentButtonEnabled === true;
  }

  function buildGlobalShoppingCategoryExpansionRows(input) {
    const safe = obj(input);
    const categories = obj(safe.categories);
    const rows = [
      row("category_expansion_shell_status", "Category Expansion Shell", safe.status === "ready" ? "Flight / Hotel / Product 只读外壳已准备" : (safe.status === "blocked" ? "Category Expansion Shell 已阻断" : "Category Expansion Shell 仍需复核"), safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("category_expansion_shell_boundary", "Category Boundary", "flight / hotel / product 仅保留 readonlySearchIntent / candidateEvidence / feeNormalization / officialAnchor / riskNotes / userBoundary", "pass")
    ];
    REQUIRED_CATEGORIES.forEach(function (key) {
      rows.push(row("category_" + key, key, categories[key] ? key + " readonly shell ready" : key + " missing", categories[key] ? "pass" : "warning"));
    });
    return clone(rows);
  }

  function buildGlobalShoppingCategoryExpansionCards(input) {
    const categories = obj(obj(input).categories);
    return clone(REQUIRED_CATEGORIES.map(function (key) {
      return card("category_" + key, key, categories[key] ? "readonly ready" : "needs review");
    }));
  }

  function buildGlobalShoppingCategoryExpansionShellAuditDraft(input) {
    const safe = obj(input);
    return clone({
      eventType:"GLOBAL_SHOPPING_CATEGORY_EXPANSION_SHELL_AUDIT_DRAFT",
      shellName:SHELL_NAME,
      appVersion:GLOBAL_SHOPPING_CATEGORY_EXPANSION_SHELL_VERSION,
      status:safeStatus(safe.status),
      categoryCount:Object.keys(obj(safe.categories)).length,
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

  function evaluateGlobalShoppingCategoryExpansionShell(input) {
    const safe = obj(input);
    const intentMatrix = obj(safe.safeSearchIntentMatrixSummary);
    const userBoundaryPanel = obj(safe.publicBetaUserBoundaryPanelSummary);
    const categories = {};
    REQUIRED_CATEGORIES.forEach(function (key) {
      if (safe[key] && typeof safe[key] === "object") categories[key] = buildCategory(safe[key], key);
      else if (safe.categories && safe.categories[key] && typeof safe.categories[key] === "object") categories[key] = buildCategory(safe.categories[key], key);
    });
    const missing = REQUIRED_CATEGORIES.filter(function (key) { return !categories[key]; });
    const blocked = REQUIRED_CATEGORIES.some(function (key) { return categories[key] && categoryBlocked(categories[key]); }) ||
      safeStatus(intentMatrix.status) === "blocked" ||
      safeStatus(userBoundaryPanel.status) === "blocked";
    const status = blocked ? "blocked" : ((missing.length || !Object.keys(intentMatrix).length || !Object.keys(userBoundaryPanel).length) ? "needs_review" : "ready");
    return clone({
      shellName:SHELL_NAME,
      appVersion:GLOBAL_SHOPPING_CATEGORY_EXPANSION_SHELL_VERSION,
      status,
      shellMode:safeMode(safe.shellMode),
      title:"Category Expansion Shell",
      categories,
      manualReviewRequired:true,
      rows:buildGlobalShoppingCategoryExpansionRows({ status, categories }),
      cards:buildGlobalShoppingCategoryExpansionCards({ categories }),
      auditDraft:buildGlobalShoppingCategoryExpansionShellAuditDraft({ status, categories }),
      blockedReasons:blocked ? ["category_boundary_violation"] : [],
      userFacingSummary:{
        title:"Category Expansion Shell",
        resultLabel:status === "ready" ? "Flight / Hotel / Product 只读外壳已准备" : (status === "blocked" ? "Category Expansion Shell 已阻断" : "Category Expansion Shell 仍需复核"),
        caveat:"Flight / Hotel / Product 仍为只读外壳，只生成只读搜索计划，不提供真实 provider、支付或下单能力。"
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

  function sanitizeGlobalShoppingCategoryExpansionShell(shell) {
    return evaluateGlobalShoppingCategoryExpansionShell(shell || {});
  }

  function buildGlobalShoppingCategoryExpansionShell(input) {
    try {
      return evaluateGlobalShoppingCategoryExpansionShell(input || {});
    } catch (_) {
      return evaluateGlobalShoppingCategoryExpansionShell({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingCategoryExpansionShell = {
    GLOBAL_SHOPPING_CATEGORY_EXPANSION_SHELL_VERSION,
    SHELL_NAME,
    buildGlobalShoppingCategoryExpansionShell,
    evaluateGlobalShoppingCategoryExpansionShell,
    buildGlobalShoppingCategoryExpansionRows,
    buildGlobalShoppingCategoryExpansionCards,
    buildGlobalShoppingCategoryExpansionShellAuditDraft,
    sanitizeGlobalShoppingCategoryExpansionShell
  };
})();
