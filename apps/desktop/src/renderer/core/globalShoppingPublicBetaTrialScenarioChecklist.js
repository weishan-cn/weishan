;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_SCENARIO_CHECKLIST_VERSION = "4.2.7";
  const CHECKLIST_NAME = "global_shopping_public_beta_trial_scenario_checklist_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, trial_scenario_checklist_only:true };

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function safeMode(value) {
    const mode = text(value || "trial_scenario_checklist_only");
    return ALLOWED_MODES[mode] ? mode : "trial_scenario_checklist_only";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function scenarioCard(scenario) {
    const safe = obj(scenario);
    return {
      scenarioId:text(safe.scenarioId),
      userInputExample:text(safe.userInputExample),
      expectedCategory:text(safe.expectedCategory),
      expectedVisibleSections:toArray(safe.expectedVisibleSections).map(text),
      expectedBlockedCapabilities:toArray(safe.expectedBlockedCapabilities).map(text),
      manualReviewRequired:safe.manualReviewRequired !== false,
      redacted:true
    };
  }
  function buildDefaultScenarios() {
    return [
      {
        scenarioId:"flightSearchReadonly",
        userInputExample:"帮我整理上海到东京的只读候选价",
        expectedCategory:"flight",
        expectedVisibleSections:["Public Beta User Journey", "Category Result Simulator", "Read-Only Comparison Board", "Result Trust Badge"],
        expectedBlockedCapabilities:["provider", "network", "payment", "order", "ticketing", "externalOpen"],
        manualReviewRequired:true
      },
      {
        scenarioId:"hotelSearchReadonly",
        userInputExample:"看一下东京酒店的只读候选价对比",
        expectedCategory:"hotel",
        expectedVisibleSections:["Public Beta User Journey", "Category Result Simulator", "Read-Only Comparison Board", "Result Trust Badge"],
        expectedBlockedCapabilities:["provider", "network", "payment", "order", "ticketing", "externalOpen"],
        manualReviewRequired:true
      },
      {
        scenarioId:"productSearchReadonly",
        userInputExample:"整理一下耳机的只读候选价和官方价锚点",
        expectedCategory:"product",
        expectedVisibleSections:["Public Beta User Journey", "Category Result Simulator", "Read-Only Comparison Board", "Result Trust Badge"],
        expectedBlockedCapabilities:["provider", "network", "payment", "order", "ticketing", "externalOpen"],
        manualReviewRequired:true
      },
      {
        scenarioId:"restrictedCategoryBlocked",
        userInputExample:"直接帮我下单私人飞机",
        expectedCategory:"restricted",
        expectedVisibleSections:["User Boundary Panel", "Manual Review Required"],
        expectedBlockedCapabilities:["provider", "network", "payment", "order", "ticketing", "externalOpen"],
        manualReviewRequired:true
      }
    ];
  }
  function detectBlockedReasons(input) {
    const safe = obj(input);
    const reasons = [];
    [
      "provider",
      "network",
      "key",
      "endpoint",
      "externalOpen",
      "payment",
      "order",
      "ticketing",
      "checkout",
      "booking",
      "createOrder"
    ].forEach(function (key) {
      if (safe[key] === true) reasons.push(key + "_enabled");
    });
    if (safe.externalUrl != null || safe.platformUrl != null || safe.providerUrl != null) reasons.push("external_url_detected");
    if (safe.bookingUrl != null || safe.checkoutUrl != null || safe.paymentUrl != null || safe.orderUrl != null) reasons.push("transaction_url_detected");
    return reasons;
  }

  function buildScenarioSource(input) {
    const safe = obj(input);
    const scenarios = Array.isArray(safe.scenarios) ? safe.scenarios.map(scenarioCard) : buildDefaultScenarios().map(scenarioCard);
    return scenarios;
  }

  function buildGlobalShoppingPublicBetaTrialScenarioRows(input) {
    const safe = obj(input);
    const scenarios = toArray(safe.scenarios);
    const status = safeStatus(safe.status);
    const rows = [
      row("public_beta_trial_scenario_checklist_status", "Trial Scenario Checklist", status === "ready" ? "Trial Scenario Checklist 已准备" : (status === "blocked" ? "Trial Scenario Checklist 已阻断" : "Trial Scenario Checklist 仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("public_beta_trial_scenario_coverage", "Scenario Coverage", "Flight / Hotel / Product / Restricted 场景已覆盖", scenarios.length === 4 ? "pass" : "warning"),
      row("public_beta_trial_scenario_manual_review", "Manual Review Required", "仍需人工视觉验收", "warning")
    ];
    scenarios.forEach(function (scenario) {
      rows.push(row("scenario_" + scenario.scenarioId, scenario.scenarioId, scenario.expectedCategory, scenario.manualReviewRequired === true ? "pass" : "blocked"));
    });
    return clone(rows);
  }

  function buildGlobalShoppingPublicBetaTrialScenarioCards(input) {
    return clone(buildScenarioSource(input));
  }

  function evaluateGlobalShoppingPublicBetaTrialScenarioChecklist(input) {
    const safe = obj(input);
    const scenarios = buildScenarioSource(safe);
    const blockedReasons = detectBlockedReasons(safe);
    scenarios.forEach(function (scenario) {
      if (scenario.manualReviewRequired !== true) blockedReasons.push(scenario.scenarioId + "_manual_review_missing");
      if (scenario.expectedBlockedCapabilities.some(function (capability) {
        return /provider|network|key|endpoint|external|payment|order|ticketing|checkout|booking/i.test(capability);
      }) === false) blockedReasons.push(scenario.scenarioId + "_boundary_missing");
    });
    const ids = scenarios.map(function (scenario) { return scenario.scenarioId; });
    const hasAll = ["flightSearchReadonly", "hotelSearchReadonly", "productSearchReadonly", "restrictedCategoryBlocked"].every(function (id) { return ids.indexOf(id) >= 0; });
    const restricted = scenarios.find(function (scenario) { return scenario.scenarioId === "restrictedCategoryBlocked"; });
    const restrictedBlocked = !!restricted && restricted.expectedCategory === "restricted" && restricted.expectedBlockedCapabilities.length > 0;
    const status = blockedReasons.length ? "blocked" : (!hasAll || !restrictedBlocked ? "needs_review" : "ready");
    return clone({
      checklistName:CHECKLIST_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_SCENARIO_CHECKLIST_VERSION,
      checklistMode:safeMode(safe.checklistMode),
      status,
      title:"Trial Scenario Checklist",
      scenarios,
      rows:buildGlobalShoppingPublicBetaTrialScenarioRows({ status, scenarios }),
      cards:buildGlobalShoppingPublicBetaTrialScenarioCards({ scenarios }),
      manualReviewRequired:true,
      blockedReasons,
      userFacingSummary:{
        title:"Trial Scenario Checklist",
        resultLabel:status === "ready" ? "Trial Scenario Checklist 已准备" : (status === "blocked" ? "Trial Scenario Checklist 已阻断" : "Trial Scenario Checklist 仍需复核"),
        caveat:"Flight / Hotel / Product / Restricted 场景仅做只读试用验证；当前只是 RC 候选，不创建 release、不 push。"
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

  function buildGlobalShoppingPublicBetaTrialScenarioChecklistAuditDraft(input) {
    const safe = evaluateGlobalShoppingPublicBetaTrialScenarioChecklist(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_SCENARIO_CHECKLIST_AUDIT_DRAFT",
      checklistName:CHECKLIST_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_SCENARIO_CHECKLIST_VERSION,
      status:safe.status,
      scenarioCount:toArray(safe.scenarios).length,
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

  function sanitizeGlobalShoppingPublicBetaTrialScenarioChecklist(checklist) {
    return evaluateGlobalShoppingPublicBetaTrialScenarioChecklist(checklist || {});
  }

  function buildGlobalShoppingPublicBetaTrialScenarioChecklist(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaTrialScenarioChecklist(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaTrialScenarioChecklist({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaTrialScenarioChecklist = {
    GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_SCENARIO_CHECKLIST_VERSION,
    CHECKLIST_NAME,
    buildGlobalShoppingPublicBetaTrialScenarioChecklist,
    evaluateGlobalShoppingPublicBetaTrialScenarioChecklist,
    buildGlobalShoppingPublicBetaTrialScenarioRows,
    buildGlobalShoppingPublicBetaTrialScenarioCards,
    buildGlobalShoppingPublicBetaTrialScenarioChecklistAuditDraft,
    sanitizeGlobalShoppingPublicBetaTrialScenarioChecklist
  };
})();
