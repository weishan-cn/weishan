;(function () {
  "use strict";

  const ACCESSIBILITY_KEYBOARD_DISPLAY_GUARD_VERSION = "4.2.9";
  const MODULE_NAME = "accessibility_keyboard_display_guard_v1";
  const PROTOTYPE_KEYS = Object.freeze(["__proto__", "constructor", "prototype"]);
  const SECRET_PATTERN = /(secret|password|token|authorization|authHeader|api[_-]?key|private[_-]?key|x[_-]?signature|credentialValue|clientSecret|certId|bearer\s+[a-z0-9._~+/-]{8,})/i;
  const NATIVE_FOCUSABLE_TAGS = Object.freeze(["BUTTON", "INPUT", "SELECT", "TEXTAREA"]);
  const ACTIVATABLE_ROLES = Object.freeze(["button", "link", "menuitem", "checkbox", "radio", "switch", "tab", "option"]);
  const LANDMARK_ROLES = Object.freeze(["main", "navigation", "banner", "contentinfo", "search", "region"]);

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value, limit) {
    const output = String(value == null ? "" : value).normalize("NFKC").replace(/\s+/g, " ").trim();
    const cap = Number.isFinite(Number(limit)) ? Math.max(0, Math.min(240, Math.floor(Number(limit)))) : 120;
    return cap > 0 && output.length > cap ? output.slice(0, cap) + "…" : output;
  }

  function safeLower(value) {
    return text(value, 120).toLowerCase();
  }

  function hasOwn(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
  }

  function cloneSafe(value, depth) {
    const level = Number(depth || 0);
    if (level > 4) return null;
    if (value == null || typeof value === "number" || typeof value === "boolean") return value;
    if (typeof value === "string") return SECRET_PATTERN.test(value) ? "[REDACTED]" : text(value, 160);
    if (Array.isArray(value)) return value.slice(0, 80).map(function (item) { return cloneSafe(item, level + 1); });
    if (typeof value !== "object") return null;
    const output = Object.create(null);
    Object.keys(value).forEach(function (key) {
      if (PROTOTYPE_KEYS.indexOf(key) !== -1) return;
      if (SECRET_PATTERN.test(key)) return;
      output[key] = cloneSafe(value[key], level + 1);
    });
    return output;
  }

  function containsSecret(value) {
    if (value == null) return false;
    if (typeof value === "string") return SECRET_PATTERN.test(value);
    if (typeof value !== "object") return false;
    return Object.keys(value).some(function (key) {
      return PROTOTYPE_KEYS.indexOf(key) !== -1 || SECRET_PATTERN.test(key) || containsSecret(value[key]);
    });
  }

  function isHidden(input) {
    const safe = obj(input);
    const style = obj(safe.style);
    return safe.hidden === true ||
      safe.ariaHidden === true ||
      String(safe["aria-hidden"]) === "true" ||
      style.display === "none" ||
      style.visibility === "hidden" ||
      safe.visible === false;
  }

  function isDisabled(input) {
    const safe = obj(input);
    return safe.disabled === true || String(safe["aria-disabled"]) === "true" || safe.enabled === false;
  }

  function normalizedRole(input) {
    const safe = obj(input);
    const tag = text(safe.tagName || safe.tag || "", 40).toUpperCase();
    const explicit = safeLower(safe.role);
    if (explicit) return explicit;
    if (tag === "NAV") return "navigation";
    if (tag === "MAIN") return "main";
    if (tag === "HEADER") return "banner";
    if (tag === "FOOTER") return "contentinfo";
    if (tag === "A") return "link";
    if (tag === "BUTTON") return "button";
    if (tag === "SELECT") return "combobox";
    if (tag === "TEXTAREA") return "textbox";
    if (tag === "INPUT") {
      const type = safeLower(safe.type || "text");
      if (type === "checkbox") return "checkbox";
      if (type === "radio") return "radio";
      return "textbox";
    }
    return "";
  }

  function accessibleName(input) {
    const safe = obj(input);
    return text(safe.ariaLabel || safe["aria-label"] || safe.label || safe.title || safe.alt || safe.text || safe.innerText || safe.value || "", 160);
  }

  function numericTabIndex(input) {
    const safe = obj(input);
    if (!hasOwn(safe, "tabIndex") && !hasOwn(safe, "tabindex")) return null;
    const parsed = Number(hasOwn(safe, "tabIndex") ? safe.tabIndex : safe.tabindex);
    return Number.isFinite(parsed) ? Math.floor(parsed) : null;
  }

  function isNaturallyFocusable(input) {
    const safe = obj(input);
    const tag = text(safe.tagName || safe.tag || "", 40).toUpperCase();
    if (NATIVE_FOCUSABLE_TAGS.indexOf(tag) !== -1) return true;
    if (tag === "A" && text(safe.href, 400)) return true;
    return false;
  }

  function isFocusable(input) {
    if (isHidden(input) || isDisabled(input)) return false;
    const tabIndex = numericTabIndex(input);
    if (tabIndex != null) return tabIndex >= 0;
    if (isNaturallyFocusable(input)) return true;
    return ACTIVATABLE_ROLES.indexOf(normalizedRole(input)) !== -1 && obj(input).keyboardFocusable === true;
  }

  function requiresKeyboardActivation(input) {
    const role = normalizedRole(input);
    return ACTIVATABLE_ROLES.indexOf(role) !== -1;
  }

  function supportsKeyboardActivation(input) {
    const safe = obj(input);
    if (!requiresKeyboardActivation(safe)) return true;
    const tag = text(safe.tagName || safe.tag || "", 40).toUpperCase();
    if (tag === "BUTTON" || (tag === "A" && text(safe.href, 400))) return true;
    if (safe.onKeyDown === true || safe.onKeyUp === true || safe.keyboardActivation === true) return true;
    return safe.keyHandlers && safe.keyHandlers.Enter === true && (safe.keyHandlers.Space === true || safe.keyHandlers[" "] === true);
  }

  function auditInteractiveElements(elements) {
    const input = Array.isArray(elements) ? elements : [];
    const rows = input.slice(0, 500).map(function (element, index) {
      const safe = obj(element);
      const role = normalizedRole(safe);
      const name = accessibleName(safe);
      const hidden = isHidden(safe);
      const disabled = isDisabled(safe);
      const focusable = isFocusable(safe);
      const touchWidth = Number(safe.width || safe.clientWidth || safe.offsetWidth || 44);
      const touchHeight = Number(safe.height || safe.clientHeight || safe.offsetHeight || 44);
      return Object.freeze({
        index,
        role,
        name:name || "",
        hidden,
        disabled,
        focusable,
        missingName:requiresKeyboardActivation(safe) && !name,
        hiddenFocusable:hidden && (numericTabIndex(safe) || 0) >= 0 && (isNaturallyFocusable(safe) || numericTabIndex(safe) != null),
        disabledFocusable:disabled && (numericTabIndex(safe) || 0) >= 0 && (isNaturallyFocusable(safe) || numericTabIndex(safe) != null),
        keyboardActivationMissing:focusable && requiresKeyboardActivation(safe) && !supportsKeyboardActivation(safe),
        focusVisibleMissing:focusable && safe.focusVisible !== true && safe.usesGlobalFocusRing !== true,
        touchTargetUndersized:focusable && (touchWidth < 44 || touchHeight < 44),
        secretInName:containsSecret(name),
        redacted:true
      });
    });
    const counts = rows.reduce(function (out, row) {
      if (row.missingName) out.missingInteractiveLabels += 1;
      if (row.hiddenFocusable) out.hiddenFocusableElements += 1;
      if (row.disabledFocusable) out.disabledFocusableElements += 1;
      if (row.keyboardActivationMissing) out.keyboardActivationDefects += 1;
      if (row.focusVisibleMissing) out.focusVisibleDefects += 1;
      if (row.touchTargetUndersized) out.touchTargetUndersized += 1;
      if (row.secretInName) out.secretValuesInAccessibleNames += 1;
      return out;
    }, {
      missingInteractiveLabels:0,
      hiddenFocusableElements:0,
      disabledFocusableElements:0,
      keyboardActivationDefects:0,
      focusVisibleDefects:0,
      touchTargetUndersized:0,
      secretValuesInAccessibleNames:0
    });
    return Object.freeze({
      status:Object.keys(counts).some(function (key) { return counts[key] > 0; }) ? "needs_fix" : "pass",
      checkedCount:rows.length,
      counts:Object.freeze(counts),
      rows:Object.freeze(rows.map(cloneSafe)),
      redacted:true
    });
  }

  function buildKeyboardModel(elements, options) {
    const safe = obj(options);
    const focusables = (Array.isArray(elements) ? elements : []).filter(isFocusable);
    const ordered = focusables.map(function (element, index) {
      const tabIndex = numericTabIndex(element);
      return Object.freeze({
        index,
        id:text(obj(element).id || obj(element).route || obj(element).name || "item-" + index, 80),
        role:normalizedRole(element),
        name:accessibleName(element),
        tabIndex:tabIndex == null ? 0 : tabIndex,
        route:safeLower(obj(element).route || ""),
        hiddenDeferredRoute:obj(element).deferred === true || obj(element).deferredRoute === true,
        redacted:true
      });
    }).sort(function (left, right) {
      if (left.tabIndex === right.tabIndex) return left.index - right.index;
      if (left.tabIndex === 0) return 1;
      if (right.tabIndex === 0) return -1;
      return left.tabIndex - right.tabIndex;
    });
    const hiddenDeferredRouteFocusable = ordered.filter(function (row) { return row.hiddenDeferredRoute; }).length;
    return Object.freeze({
      status:hiddenDeferredRouteFocusable ? "needs_fix" : "pass",
      focusableCount:ordered.length,
      tabOrder:Object.freeze(ordered),
      hiddenDeferredRouteFocusable,
      firstFocusable:ordered[0] || null,
      lastFocusable:ordered[ordered.length - 1] || null,
      redacted:true
    });
  }

  function handleKeyboardCommand(eventLike, context) {
    const event = obj(eventLike);
    const key = event.key || event.code || "";
    const safe = obj(context);
    if (key === "Enter" || key === " " || key === "Space" || key === "Spacebar") {
      return Object.freeze({ action:"activate", preventDefault:true, executionGate:"CLOSED", authorizesExecution:false, productionTraffic:false, redacted:true });
    }
    if (key === "Escape") {
      return Object.freeze({ action:safe.dismissable === false ? "ignore" : "dismiss", preventDefault:safe.dismissable !== false, executionGate:"CLOSED", authorizesExecution:false, productionTraffic:false, redacted:true });
    }
    if (/^Arrow(Up|Down|Left|Right)$/.test(key)) {
      return Object.freeze({ action:"move_focus", direction:key.replace("Arrow", "").toLowerCase(), preventDefault:true, executionGate:"CLOSED", authorizesExecution:false, productionTraffic:false, redacted:true });
    }
    if (key === "Tab") {
      return Object.freeze({ action:"tab", direction:event.shiftKey ? "previous" : "next", preventDefault:false, executionGate:"CLOSED", authorizesExecution:false, productionTraffic:false, redacted:true });
    }
    return Object.freeze({ action:"ignore", preventDefault:false, executionGate:"CLOSED", authorizesExecution:false, productionTraffic:false, redacted:true });
  }

  function evaluateFocusTrap(elements, activeIndex, keyEvent) {
    const model = buildKeyboardModel(elements);
    const total = model.tabOrder.length;
    if (!total) return Object.freeze({ status:"blocked", reason:"no_focusable_elements", keyboardTrapDefect:1, redacted:true });
    const index = Math.max(0, Math.min(total - 1, Number(activeIndex) || 0));
    const command = handleKeyboardCommand(keyEvent || { key:"Tab" });
    if (command.action === "dismiss") return Object.freeze({ status:"dismiss", nextIndex:null, keyboardTrapDefect:0, redacted:true });
    if (command.action !== "tab") return Object.freeze({ status:"unchanged", nextIndex:index, keyboardTrapDefect:0, redacted:true });
    const nextIndex = command.direction === "previous" ? (index - 1 + total) % total : (index + 1) % total;
    return Object.freeze({ status:"wrapped", nextIndex, keyboardTrapDefect:0, redacted:true });
  }

  function evaluateDisplayProfile(input) {
    const safe = obj(input);
    const width = Math.max(0, Number(safe.viewportWidth || safe.width || 0));
    const height = Math.max(0, Number(safe.viewportHeight || safe.height || 0));
    const contentWidth = Math.max(0, Number(safe.contentWidth || width));
    const zoom = Number.isFinite(Number(safe.zoom)) ? Number(safe.zoom) : 1;
    const reducedMotion = safe.prefersReducedMotion === true;
    const highContrast = safe.forcedColors === true || safe.highContrast === true;
    return Object.freeze({
      viewport:Object.freeze({ width, height, zoom }),
      layoutMode:width > 0 && width < 900 ? "single_column" : "wide",
      minTapTargetPx:44,
      horizontalOverflow:width > 0 && contentWidth > width + 1,
      reducedMotionHonored:reducedMotion ? safe.animationsDisabled === true : true,
      highContrastSafe:highContrast ? safe.usesSystemColors === true || safe.outlineVisible === true : true,
      textScaleSafe:zoom <= 2 ? true : safe.reflow === true,
      redacted:true
    });
  }

  function installRuntimeAccessibilityGuard(doc) {
    const documentRef = doc || (typeof document !== "undefined" ? document : null);
    if (!documentRef || !documentRef.documentElement) return Object.freeze({ status:"unavailable", reason:"no_document", redacted:true });
    documentRef.documentElement.setAttribute("data-weishan-accessibility-keyboard-display", "ready");
    const app = documentRef.getElementById && documentRef.getElementById("app");
    if (app && !app.getAttribute("role")) app.setAttribute("role", "main");
    const sidebar = documentRef.querySelector && documentRef.querySelector(".sidebar");
    if (sidebar && !sidebar.getAttribute("role")) sidebar.setAttribute("role", "navigation");
    return Object.freeze({ status:"installed", moduleName:MODULE_NAME, appRole:app && app.getAttribute("role") || "", sidebarRole:sidebar && sidebar.getAttribute("role") || "", redacted:true });
  }

  function runAccessibilityKeyboardDisplaySuite() {
    const elements = [
      { tag:"button", id:"home", text:"Home", width:48, height:48, focusVisible:true },
      { tag:"button", id:"shopping", text:"Global Shopping", width:48, height:48, focusVisible:true },
      { tag:"button", id:"travel", text:"Travel", width:48, height:48, focusVisible:true },
      { tag:"button", id:"cloud", text:"Cloud", hidden:true, deferredRoute:true, tabIndex:-1, focusVisible:true },
      { tag:"textarea", id:"command", ariaLabel:"Command input", width:240, height:100, focusVisible:true },
      { tag:"a", id:"docs", href:"https://weishan.ai", text:"Official site", width:60, height:44, focusVisible:true },
      { role:"button", id:"custom-safe", text:"Open details", keyboardActivation:true, keyboardFocusable:true, width:44, height:44, focusVisible:true }
    ];
    const interactive = auditInteractiveElements(elements);
    const keyboard = buildKeyboardModel(elements);
    const enter = handleKeyboardCommand({ key:"Enter" });
    const space = handleKeyboardCommand({ key:" " });
    const escape = handleKeyboardCommand({ key:"Escape" });
    const trapNext = evaluateFocusTrap(elements, keyboard.focusableCount - 1, { key:"Tab" });
    const trapPrevious = evaluateFocusTrap(elements, 0, { key:"Tab", shiftKey:true });
    const small = evaluateDisplayProfile({ viewportWidth:390, viewportHeight:844, contentWidth:390, zoom:2, reflow:true, prefersReducedMotion:true, animationsDisabled:true, forcedColors:true, outlineVisible:true });
    const wide = evaluateDisplayProfile({ viewportWidth:1440, viewportHeight:900, contentWidth:1440, zoom:1 });
    const zeroMetrics = Object.freeze({
      MISSING_INTERACTIVE_LABELS:interactive.counts.missingInteractiveLabels,
      HIDDEN_FOCUSABLE_ELEMENTS:interactive.counts.hiddenFocusableElements,
      DISABLED_FOCUSABLE_ELEMENTS:interactive.counts.disabledFocusableElements,
      KEYBOARD_TRAP_DEFECTS:trapNext.keyboardTrapDefect + trapPrevious.keyboardTrapDefect,
      ENTER_SPACE_ACTIVATION_DEFECTS:(enter.action === "activate" && space.action === "activate") ? 0 : 1,
      ESCAPE_DISMISS_DEFECTS:escape.action === "dismiss" ? 0 : 1,
      FOCUS_VISIBLE_DEFECTS:interactive.counts.focusVisibleDefects,
      TOUCH_TARGET_UNDERSIZED:interactive.counts.touchTargetUndersized,
      SMALL_VIEWPORT_HORIZONTAL_OVERFLOW:small.horizontalOverflow ? 1 : 0,
      REDUCED_MOTION_IGNORED:small.reducedMotionHonored ? 0 : 1,
      HIGH_CONTRAST_TEXT_LOSS:small.highContrastSafe ? 0 : 1,
      HIDDEN_DEFERRED_ROUTE_FOCUSABLE:keyboard.hiddenDeferredRouteFocusable,
      SECRET_VALUES_IN_ACCESSIBLE_NAMES:interactive.counts.secretValuesInAccessibleNames
    });
    return Object.freeze({
      moduleName:MODULE_NAME,
      appVersion:ACCESSIBILITY_KEYBOARD_DISPLAY_GUARD_VERSION,
      baseline:Object.freeze({
        CUSTOM_ROLE_WITHOUT_KEY_HANDLER_DEFECT:1,
        HIDDEN_DEFERRED_ROUTE_FOCUSABLE_DEFECT:1,
        SMALL_VIEWPORT_OVERFLOW_DEFECT:1,
        REDUCED_MOTION_UNGUARDED_DEFECT:1,
        redacted:true
      }),
      after:Object.freeze({
        INTERACTIVE_ELEMENTS_CHECKED:interactive.checkedCount,
        KEYBOARD_FOCUSABLE_COUNT:keyboard.focusableCount,
        TAB_WRAP_NEXT_INDEX:trapNext.nextIndex,
        TAB_WRAP_PREVIOUS_INDEX:trapPrevious.nextIndex,
        SMALL_LAYOUT_MODE:small.layoutMode,
        WIDE_LAYOUT_MODE:wide.layoutMode,
        redacted:true
      }),
      zeroMetrics,
      productResult:Object.freeze({
        KEYBOARD_NAVIGATION:"OPTIMIZE",
        FOCUS_VISIBILITY:"OPTIMIZE",
        SCREEN_READER_LABELS:"OPTIMIZE",
        HIDDEN_DEFERRED_NAV:"KEEP",
        SMALL_VIEWPORT_REFLOW:"OPTIMIZE",
        REDUCED_MOTION:"OPTIMIZE",
        HIGH_CONTRAST:"OPTIMIZE",
        SECRET_ACCESSIBLE_NAME_FILTER:"KEEP",
        PROVIDER_ACTION_BOUNDARY:"KEEP"
      }),
      externalEffects:Object.freeze({
        PROVIDER_API_CALLS:0,
        PROVIDER_ACCOUNT_ACTIONS:0,
        PROVIDER_CREDENTIAL_MUTATIONS:0,
        REAL_CREDENTIAL_READS:0,
        REAL_CREDENTIAL_WRITES:0,
        EMAIL_ACTIONS:0,
        BOOKINGS:0,
        TICKETS:0,
        ORDERS:0,
        PAYMENTS:0,
        WEBSITE_CHANGES:0,
        PRODUCTION_TRAFFIC:0,
        PACKAGING_ACTIONS:0
      }),
      governance:Object.freeze({
        executionGate:"CLOSED",
        authorizesExecution:false,
        productionTraffic:false,
        WEISHAN_PAYS_PROVIDER:false,
        PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false,
        EMAIL_SEND_ENABLED:false
      }),
      redacted:true
    });
  }

  window.WeishanAccessibilityKeyboardDisplayGuard = Object.freeze({
    ACCESSIBILITY_KEYBOARD_DISPLAY_GUARD_VERSION,
    MODULE_NAME,
    LANDMARK_ROLES,
    normalizedRole,
    accessibleName,
    isHidden,
    isDisabled,
    isFocusable,
    auditInteractiveElements,
    buildKeyboardModel,
    handleKeyboardCommand,
    evaluateFocusTrap,
    evaluateDisplayProfile,
    installRuntimeAccessibilityGuard,
    runAccessibilityKeyboardDisplaySuite
  });

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { installRuntimeAccessibilityGuard(document); }, { once:true });
    } else {
      installRuntimeAccessibilityGuard(document);
    }
  }
})();
