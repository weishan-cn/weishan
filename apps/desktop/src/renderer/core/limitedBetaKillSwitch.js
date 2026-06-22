;(function () {
  "use strict";

  const LIMITED_BETA_KILL_SWITCH_VERSION = "2.1.47";
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value === undefined || value === null ? "" : value).trim(); }
  function now() { return new Date().toISOString(); }
  function defaultState() {
    return {
      schemaVersion: LIMITED_BETA_KILL_SWITCH_VERSION,
      preferenceVersion: 1,
      globalLimitedBetaEnabled: true,
      categoryOverrides: { flight:true, product:false, hotel:false, local_service:false, ticket_or_activity:false, restricted_or_blocked:false },
      providerOverrides: { flight_provider:true },
      surfaceOverrides: { ordinary_result_card:true, provider_console:true, sandbox_console:true },
      killSwitchState: "enabled",
      rollbackState: "not_needed",
      lastAction: "initial_default",
      reason: "limited beta enabled for flight only",
      actor: "system_guard",
      updatedAt: now(),
      requiresUserConfirmationForRestore: true,
      restoreConfirmationPending: false,
      allowedBetaScope: "flight_only",
      paymentDisabled: true,
      orderDisabled: true,
      bookingUrlDisabled: true,
      identityUploadDisabled: true,
      redacted: true
    };
  }
  let currentState = defaultState();
  let counters = { priceCardHiddenCount:0, restoredCount:0, forcedRollbackCount:0, restoreRequestCount:0 };
  function normalizeCategory(category) {
    const value = text(category).toLowerCase();
    if (value === "restricted" || value === "restricted_provider") return "restricted_or_blocked";
    if (value === "ticket" || value === "activity") return "ticket_or_activity";
    return value || "flight";
  }
  function sanitizeState(input) {
    const raw = input && typeof input === "object" ? clone(input.preference || input) : defaultState();
    const next = Object.assign(defaultState(), raw || {});
    next.schemaVersion = LIMITED_BETA_KILL_SWITCH_VERSION;
    next.categoryOverrides = Object.assign(defaultState().categoryOverrides, next.categoryOverrides || {});
    next.categoryOverrides.product = false;
    next.categoryOverrides.hotel = false;
    next.categoryOverrides.local_service = false;
    next.categoryOverrides.ticket_or_activity = false;
    next.categoryOverrides.restricted_or_blocked = false;
    next.providerOverrides = Object.assign(defaultState().providerOverrides, next.providerOverrides || {});
    next.surfaceOverrides = Object.assign(defaultState().surfaceOverrides, next.surfaceOverrides || {});
    next.paymentDisabled = true;
    next.orderDisabled = true;
    next.bookingUrlDisabled = true;
    next.identityUploadDisabled = true;
    next.requiresUserConfirmationForRestore = true;
    next.allowedBetaScope = "flight_only";
    next.redacted = true;
    if (!["enabled", "disabled", "forced_off", "rollback_active"].includes(next.killSwitchState)) next.killSwitchState = "disabled";
    if (!["not_needed", "rollback_active", "forced_off"].includes(next.rollbackState)) next.rollbackState = "not_needed";
    if (next.killSwitchState === "rollback_active") next.rollbackState = "rollback_active";
    if (next.killSwitchState === "forced_off") next.rollbackState = "forced_off";
    const on = next.globalLimitedBetaEnabled === true && next.killSwitchState === "enabled" && next.rollbackState === "not_needed";
    next.globalLimitedBetaEnabled = on;
    next.categoryOverrides.flight = on;
    next.providerOverrides.flight_provider = on;
    next.surfaceOverrides.ordinary_result_card = on;
    next.surfaceOverrides.provider_console = on;
    next.surfaceOverrides.sandbox_console = on;
    return next;
  }
  function persistence() { return window.WeishanLimitedBetaPreferencePersistence || null; }
  function guard() { return window.WeishanLimitedBetaUserPreferenceGuard || null; }
  function applyPreference(pref) { currentState = sanitizeState(pref); return clone(currentState); }
  function loadFromPersistence() {
    const api = persistence();
    if (api && typeof api.getCurrentPreferenceSync === "function") applyPreference(api.getCurrentPreferenceSync());
    return clone(currentState);
  }
  function setState(overrides) { currentState = sanitizeState(Object.assign({}, currentState, overrides || {}, { updatedAt:now(), redacted:true })); return clone(currentState); }
  function turnOffLimitedBeta(reason) {
    counters.priceCardHiddenCount += 1;
    const next = setState({ globalLimitedBetaEnabled:false, killSwitchState:"disabled", rollbackState:"not_needed", lastAction:"turn_off", reason:text(reason) || "local user disabled limited beta", actor:"local_user", categoryOverrides:{ flight:false, product:false, hotel:false, local_service:false, ticket_or_activity:false, restricted_or_blocked:false }, providerOverrides:{ flight_provider:false }, surfaceOverrides:{ ordinary_result_card:false, provider_console:false, sandbox_console:false } });
    const api = persistence();
    if (api && typeof api.turnOffLimitedBetaPreference === "function") api.turnOffLimitedBetaPreference(reason);
    return next;
  }
  function requestRestoreLimitedBeta(reason) {
    counters.restoreRequestCount += 1;
    const next = setState({ lastAction:"restore_requested", reason:text(reason) || "restore requested; waiting for explicit confirmation", actor:"local_user", restoreConfirmationPending:true });
    const api = persistence();
    if (api && typeof api.requestRestoreLimitedBetaPreference === "function") api.requestRestoreLimitedBetaPreference(reason);
    return next;
  }
  function confirmRestoreLimitedBeta(reason) {
    counters.restoredCount += 1;
    const next = setState({ globalLimitedBetaEnabled:true, killSwitchState:"enabled", rollbackState:"not_needed", lastAction:"restore_confirmed", reason:text(reason) || "local user confirmed flight limited beta restore", actor:"local_user", restoreConfirmationPending:false, categoryOverrides:{ flight:true, product:false, hotel:false, local_service:false, ticket_or_activity:false, restricted_or_blocked:false }, providerOverrides:{ flight_provider:true }, surfaceOverrides:{ ordinary_result_card:true, provider_console:true, sandbox_console:true } });
    const api = persistence();
    if (api && typeof api.confirmRestoreLimitedBetaPreference === "function") api.confirmRestoreLimitedBetaPreference(reason);
    return next;
  }
  function turnOnLimitedBeta(reason) { return requestRestoreLimitedBeta(reason); }
  function forceRollback(reason) {
    counters.priceCardHiddenCount += 1;
    counters.forcedRollbackCount += 1;
    const next = setState({ globalLimitedBetaEnabled:false, killSwitchState:"rollback_active", rollbackState:"rollback_active", lastAction:"force_rollback", reason:text(reason) || "forced rollback to offline planning", actor:"local_user", categoryOverrides:{ flight:false, product:false, hotel:false, local_service:false, ticket_or_activity:false, restricted_or_blocked:false }, providerOverrides:{ flight_provider:false }, surfaceOverrides:{ ordinary_result_card:false, provider_console:false, sandbox_console:false } });
    const api = persistence();
    if (api && typeof api.forceRollbackLimitedBetaPreference === "function") api.forceRollbackLimitedBetaPreference(reason);
    return next;
  }
  function clearLimitedBetaPreference() {
    const next = setState(defaultState());
    next.lastAction = "clear_preferences";
    const api = persistence();
    if (api && typeof api.clearLimitedBetaPreference === "function") api.clearLimitedBetaPreference();
    return clone(next);
  }
  function reloadPersistedPreference() {
    const api = persistence();
    if (api && typeof api.loadPersistedPreference === "function") api.loadPersistedPreference().then(loadFromPersistence);
    return loadFromPersistence();
  }
  function evaluateLimitedBetaVisibility(context) {
    loadFromPersistence();
    const input = context && typeof context === "object" ? context : {};
    const state = sanitizeState(input.killSwitchState || currentState);
    const category = normalizeCategory(input.category || input.providerCategory || "flight");
    const providerId = text(input.providerId || "flight_provider");
    const surface = text(input.surface || input.displaySurface || "ordinary_result_card");
    const blockedReasons = [];
    if (state.killSwitchState === "forced_off" || state.killSwitchState === "rollback_active") blockedReasons.push("kill switch forced off / rollback active");
    if (!state.globalLimitedBetaEnabled) blockedReasons.push("global limited beta disabled");
    if (state.categoryOverrides[category] !== true) blockedReasons.push(category === "restricted_or_blocked" ? "restricted beta disabled" : "category beta disabled");
    if (providerId !== "flight_provider" || state.providerOverrides[providerId] !== true) blockedReasons.push("provider beta disabled");
    if (state.surfaceOverrides[surface] !== true) blockedReasons.push("surface beta disabled");
    const guardApi = guard();
    const guardDecision = guardApi && typeof guardApi.evaluateLimitedBetaUserPreferenceGuard === "function" ? guardApi.evaluateLimitedBetaUserPreferenceGuard({ persistedPreference:state, currentRequestCategory:category, providerId, rollbackDecision:state.rollbackState, userConfirmationState:state.restoreConfirmationPending ? "missing" : "confirmed" }) : null;
    if (guardDecision && guardDecision.preferenceDecision !== "allow" && guardDecision.preferenceDecision !== "confirmation_required") blockedReasons.push(guardDecision.blockedReason || "user preference guard blocked");
    const visible = blockedReasons.length === 0;
    return clone({ version:LIMITED_BETA_KILL_SWITCH_VERSION, visible, priceCardVisible:visible, priceCardHidden:!visible, displayDecision:visible ? "show_limited_beta_price_card" : "withheld_by_kill_switch", fallbackSurface:visible ? "limited_beta_guarded_card" : "offline_planning_only", ordinaryResultFallback:visible ? "Limited Beta 只读价格卡片" : "暂无真实价格结果", killSwitchState:state.killSwitchState, rollbackState:state.rollbackState, reason:state.reason, blockedReasons, persistedPreferenceLoaded:Boolean(persistence()), preferenceDecision:guardDecision && guardDecision.preferenceDecision || (visible ? "allow" : "withheld"), confirmationRequired:guardDecision && guardDecision.confirmationRequired === true, redacted:true });
  }
  function getKillSwitchAuditDraft(action) {
    loadFromPersistence();
    return clone({ eventType:"LIMITED_BETA_KILL_SWITCH_AUDIT_DRAFT", schemaVersion:LIMITED_BETA_KILL_SWITCH_VERSION, globalLimitedBetaEnabled:currentState.globalLimitedBetaEnabled, flightBetaEnabled:currentState.categoryOverrides.flight === true, providerId:"flight_provider", killSwitchState:currentState.killSwitchState, rollbackState:currentState.rollbackState, action:text(action) || currentState.lastAction || currentState.killSwitchState, reason:currentState.reason, actor:currentState.actor, updatedAt:currentState.updatedAt, priceCardHiddenCount:counters.priceCardHiddenCount, restoredCount:counters.restoredCount, restoreRequestCount:counters.restoreRequestCount, forcedRollbackCount:counters.forcedRollbackCount, bookingUrlDisplayedCount:0, paymentAttemptCount:0, orderAttemptCount:0, identityUploadAttemptCount:0, redacted:true });
  }
  function buildLimitedBetaKillSwitchDraft() {
    loadFromPersistence();
    return clone({ version:LIMITED_BETA_KILL_SWITCH_VERSION, status:"active", state:currentState, flightVisibility:evaluateLimitedBetaVisibility({ category:"flight", providerId:"flight_provider", surface:"ordinary_result_card" }), productVisibility:evaluateLimitedBetaVisibility({ category:"product", providerId:"product_provider", surface:"ordinary_result_card" }), restrictedVisibility:evaluateLimitedBetaVisibility({ category:"restricted_or_blocked", providerId:"restricted_provider", surface:"ordinary_result_card" }), actions:["关闭 Limited Beta", "恢复 Limited Beta", "确认恢复 Limited Beta", "强制回滚到离线计划"], restoreConfirmationPending:currentState.restoreConfirmationPending === true, auditDraft:getKillSwitchAuditDraft("draft"), redacted:true });
  }
  function assertLimitedBetaKillSwitchSafe(value) {
    const draft = value && typeof value === "object" ? value : buildLimitedBetaKillSwitchDraft();
    const state = draft.state || currentState;
    if (state.categoryOverrides.product !== false) throw new Error("product beta must stay false");
    if (state.categoryOverrides.hotel !== false) throw new Error("hotel beta must stay false");
    if (state.categoryOverrides.local_service !== false) throw new Error("local service beta must stay false");
    if (state.categoryOverrides.ticket_or_activity !== false) throw new Error("ticket/activity beta must stay false");
    if (state.categoryOverrides.restricted_or_blocked !== false) throw new Error("restricted beta must stay false");
    const audit = draft.auditDraft || getKillSwitchAuditDraft("assert");
    ["bookingUrlDisplayedCount", "paymentAttemptCount", "orderAttemptCount", "identityUploadAttemptCount"].forEach(function (key) { if ((audit[key] || 0) !== 0) throw new Error(key + " must stay zero"); });
    return true;
  }
  if (window.addEventListener) window.addEventListener("weishan:limited-beta-preference-updated", loadFromPersistence);
  loadFromPersistence();
  window.WeishanLimitedBetaKillSwitch = { LIMITED_BETA_KILL_SWITCH_VERSION, getState:function(){ loadFromPersistence(); return clone(currentState); }, reset:function(){ counters = { priceCardHiddenCount:0, restoredCount:0, forcedRollbackCount:0, restoreRequestCount:0 }; currentState = defaultState(); return clone(currentState); }, applyPreference, reloadPersistedPreference, turnOffLimitedBeta, turnOnLimitedBeta, requestRestoreLimitedBeta, confirmRestoreLimitedBeta, forceRollback, clearLimitedBetaPreference, evaluateLimitedBetaVisibility, getKillSwitchAuditDraft, buildLimitedBetaKillSwitchDraft, assertLimitedBetaKillSwitchSafe };
})();
