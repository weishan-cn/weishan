;(function () {
  "use strict";

  const LIMITED_BETA_KILL_SWITCH_VERSION = "2.1.31";

  const defaultState = Object.freeze({
    globalLimitedBetaEnabled: true,
    categoryOverrides: Object.freeze({
      flight: true,
      product: false,
      hotel: false,
      local_service: false,
      ticket_or_activity: false,
      restricted_or_blocked: false
    }),
    providerOverrides: Object.freeze({
      flight_provider: true
    }),
    surfaceOverrides: Object.freeze({
      ordinary_result_card: true,
      provider_console: true,
      sandbox_console: true
    }),
    killSwitchState: "enabled",
    reason: "limited beta enabled for flight only",
    actor: "system_guard",
    updatedAt: "local draft",
    redacted: true
  });

  let currentState = clone(defaultState);
  let counters = {
    priceCardHiddenCount: 0,
    restoredCount: 0,
    forcedRollbackCount: 0
  };

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value === undefined || value === null ? "" : value).trim();
  }

  function now() {
    return new Date().toISOString();
  }

  function normalizeCategory(category) {
    const value = text(category).toLowerCase();
    if (value === "restricted" || value === "restricted_provider") return "restricted_or_blocked";
    return value || "flight";
  }

  function buildState(overrides) {
    const next = Object.assign({}, clone(defaultState), clone(overrides || {}));
    next.categoryOverrides = Object.assign({}, clone(defaultState.categoryOverrides), clone(next.categoryOverrides || {}));
    next.providerOverrides = Object.assign({}, clone(defaultState.providerOverrides), clone(next.providerOverrides || {}));
    next.surfaceOverrides = Object.assign({}, clone(defaultState.surfaceOverrides), clone(next.surfaceOverrides || {}));
    next.redacted = true;
    return next;
  }

  function setState(overrides) {
    currentState = buildState(overrides);
    return clone(currentState);
  }

  function turnOffLimitedBeta(reason) {
    counters.priceCardHiddenCount += 1;
    return setState({
      globalLimitedBetaEnabled: false,
      categoryOverrides: { flight:false, product:false, hotel:false, local_service:false, ticket_or_activity:false, restricted_or_blocked:false },
      providerOverrides: { flight_provider:false },
      surfaceOverrides: { ordinary_result_card:false, provider_console:false, sandbox_console:false },
      killSwitchState: "disabled",
      reason: text(reason) || "local user disabled limited beta",
      actor: "local_user",
      updatedAt: now()
    });
  }

  function turnOnLimitedBeta(reason) {
    counters.restoredCount += 1;
    return setState({
      globalLimitedBetaEnabled: true,
      categoryOverrides: { flight:true, product:false, hotel:false, local_service:false, ticket_or_activity:false, restricted_or_blocked:false },
      providerOverrides: { flight_provider:true },
      surfaceOverrides: { ordinary_result_card:true, provider_console:true, sandbox_console:true },
      killSwitchState: "enabled",
      reason: text(reason) || "flight limited beta restored locally",
      actor: "local_user",
      updatedAt: now()
    });
  }

  function forceRollback(reason) {
    counters.priceCardHiddenCount += 1;
    counters.forcedRollbackCount += 1;
    return setState({
      globalLimitedBetaEnabled: false,
      categoryOverrides: { flight:false, product:false, hotel:false, local_service:false, ticket_or_activity:false, restricted_or_blocked:false },
      providerOverrides: { flight_provider:false },
      surfaceOverrides: { ordinary_result_card:false, provider_console:false, sandbox_console:false },
      killSwitchState: "rollback_active",
      reason: text(reason) || "forced rollback to offline planning",
      actor: "local_user",
      updatedAt: now()
    });
  }

  function evaluateLimitedBetaVisibility(context) {
    const input = context && typeof context === "object" ? context : {};
    const state = buildState(input.killSwitchState || currentState);
    const category = normalizeCategory(input.category || input.providerCategory || "flight");
    const providerId = text(input.providerId || "flight_provider");
    const surface = text(input.surface || input.displaySurface || "ordinary_result_card");
    const blockedReasons = [];

    if (state.killSwitchState === "forced_off" || state.killSwitchState === "rollback_active") blockedReasons.push("kill switch forced off / rollback active");
    if (!state.globalLimitedBetaEnabled) blockedReasons.push("global limited beta disabled");
    if (state.categoryOverrides[category] !== true) blockedReasons.push(category === "restricted_or_blocked" ? "restricted beta disabled" : "category beta disabled");
    if (providerId !== "flight_provider" || state.providerOverrides[providerId] !== true) blockedReasons.push("provider beta disabled");
    if (state.surfaceOverrides[surface] !== true) blockedReasons.push("surface beta disabled");

    const visible = blockedReasons.length === 0;
    return clone({
      version: LIMITED_BETA_KILL_SWITCH_VERSION,
      visible,
      priceCardVisible: visible,
      priceCardHidden: !visible,
      displayDecision: visible ? "show_limited_beta_price_card" : "withheld_by_kill_switch",
      fallbackSurface: visible ? "limited_beta_guarded_card" : "offline_planning_only",
      ordinaryResultFallback: visible ? "Limited Beta 只读价格卡片" : "暂无真实价格结果",
      killSwitchState: state.killSwitchState,
      reason: state.reason,
      blockedReasons,
      redacted: true
    });
  }

  function getKillSwitchAuditDraft(action) {
    return clone({
      eventType: "LIMITED_BETA_KILL_SWITCH_AUDIT_DRAFT",
      schemaVersion: LIMITED_BETA_KILL_SWITCH_VERSION,
      globalLimitedBetaEnabled: currentState.globalLimitedBetaEnabled,
      flightBetaEnabled: currentState.categoryOverrides.flight === true,
      providerId: "flight_provider",
      killSwitchState: currentState.killSwitchState,
      action: text(action) || currentState.killSwitchState,
      reason: currentState.reason,
      actor: currentState.actor,
      updatedAt: currentState.updatedAt,
      priceCardHiddenCount: counters.priceCardHiddenCount,
      restoredCount: counters.restoredCount,
      forcedRollbackCount: counters.forcedRollbackCount,
      bookingUrlDisplayedCount: 0,
      paymentAttemptCount: 0,
      orderAttemptCount: 0,
      identityUploadAttemptCount: 0,
      redacted: true
    });
  }

  function buildLimitedBetaKillSwitchDraft() {
    const visible = evaluateLimitedBetaVisibility({ category:"flight", providerId:"flight_provider", surface:"ordinary_result_card" });
    const product = evaluateLimitedBetaVisibility({ category:"product", providerId:"product_provider", surface:"ordinary_result_card" });
    const restricted = evaluateLimitedBetaVisibility({ category:"restricted_or_blocked", providerId:"restricted_provider", surface:"ordinary_result_card" });
    return clone({
      version: LIMITED_BETA_KILL_SWITCH_VERSION,
      status: "active",
      state: currentState,
      flightVisibility: visible,
      productVisibility: product,
      restrictedVisibility: restricted,
      actions: ["关闭 Limited Beta", "恢复 Limited Beta", "强制回滚到离线计划"],
      auditDraft: getKillSwitchAuditDraft("draft"),
      redacted: true
    });
  }

  function assertLimitedBetaKillSwitchSafe(value) {
    const draft = value && typeof value === "object" ? value : buildLimitedBetaKillSwitchDraft();
    const audit = draft.auditDraft || {};
    if (draft.state.categoryOverrides.product !== false) throw new Error("product beta must stay false");
    if (draft.state.categoryOverrides.hotel !== false) throw new Error("hotel beta must stay false");
    if (draft.state.categoryOverrides.local_service !== false) throw new Error("local service beta must stay false");
    if (draft.state.categoryOverrides.ticket_or_activity !== false) throw new Error("ticket/activity beta must stay false");
    if (draft.state.categoryOverrides.restricted_or_blocked !== false) throw new Error("restricted beta must stay false");
    ["bookingUrlDisplayedCount", "paymentAttemptCount", "orderAttemptCount", "identityUploadAttemptCount"].forEach(function (key) {
      if ((audit[key] || 0) !== 0) throw new Error(key + " must stay zero");
    });
    const off = evaluateLimitedBetaVisibility({ category:"flight", providerId:"flight_provider", killSwitchState:turnOffLimitedBeta("assert safe") });
    if (off.priceCardHidden !== true) throw new Error("turn off must hide price card");
    turnOnLimitedBeta("assert restore");
    return true;
  }

  window.WeishanLimitedBetaKillSwitch = {
    LIMITED_BETA_KILL_SWITCH_VERSION,
    getState: function () { return clone(currentState); },
    reset: function () { counters = { priceCardHiddenCount:0, restoredCount:0, forcedRollbackCount:0 }; currentState = clone(defaultState); return clone(currentState); },
    turnOffLimitedBeta,
    turnOnLimitedBeta,
    forceRollback,
    evaluateLimitedBetaVisibility,
    getKillSwitchAuditDraft,
    buildLimitedBetaKillSwitchDraft,
    assertLimitedBetaKillSwitchSafe
  };
})();
