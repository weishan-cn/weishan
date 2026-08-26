"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, Object, Array, String, Number, Boolean, RegExp });
  vm.runInContext(
    fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core/accessibilityKeyboardDisplayGuard.js"), "utf8"),
    context,
    { filename:"accessibilityKeyboardDisplayGuard.js" }
  );
  return window.WeishanAccessibilityKeyboardDisplayGuard;
}

function assertZeroMetrics(metrics) {
  Object.keys(metrics).forEach(function (key) {
    assert.equal(metrics[key], 0, key + " should remain zero");
  });
}

function main() {
  const api = load();
  assert.ok(api, "accessibility keyboard display guard should be exposed");
  const sidebarSource = fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/components/Sidebar.js"), "utf8");
  const indexSource = fs.readFileSync(path.join(ROOT, "apps/desktop/src/index.html"), "utf8");
  assert.match(indexSource, /class="ws-skip-link" href="#app"/, "startup shell should expose a keyboard skip link to main content");
  assert.match(indexSource, /accessibilityKeyboardDisplayGuard\.js\?v=4\.2\.9/, "runtime should load the accessibility keyboard display guard");
  assert.match(sidebarSource, /aria-label="\$\{esc\(label\)\}"/, "nav buttons should expose a stable accessible label");
  assert.match(sidebarSource, /aria-current="page"/, "active nav button should expose aria-current page");
  assert.match(sidebarSource, /class="nav-icon" aria-hidden="true"/, "decorative nav icons should be hidden from assistive names");

  const safeElements = [
    { tag:"button", id:"home", text:"Home", width:48, height:48, focusVisible:true },
    { tag:"button", id:"shopping", text:"Global Shopping", width:48, height:48, focusVisible:true },
    { tag:"button", id:"travel", text:"Travel", width:48, height:48, focusVisible:true },
    { tag:"button", id:"deferred-cloud", text:"Cloud & Enterprise", hidden:true, deferredRoute:true, tabIndex:-1, focusVisible:true },
    { tag:"input", id:"search", ariaLabel:"Search request", width:260, height:44, focusVisible:true },
    { role:"button", id:"details", text:"Show details", keyboardFocusable:true, keyboardActivation:true, width:44, height:44, focusVisible:true }
  ];

  const audit = api.auditInteractiveElements(safeElements);
  assert.equal(audit.status, "pass");
  assert.equal(audit.counts.missingInteractiveLabels, 0);
  assert.equal(audit.counts.hiddenFocusableElements, 0);
  assert.equal(audit.counts.keyboardActivationDefects, 0);
  assert.equal(audit.counts.focusVisibleDefects, 0);
  assert.equal(audit.counts.secretValuesInAccessibleNames, 0);

  const unsafeAudit = api.auditInteractiveElements([
    { role:"button", id:"nameless", keyboardFocusable:true, width:44, height:44, focusVisible:false },
    { tag:"button", id:"hidden", hidden:true, tabIndex:0, text:"Hidden button", width:44, height:44 },
    { role:"button", id:"secret-name", text:"client_secret=should-not-leak", keyboardFocusable:true, keyboardActivation:true, width:44, height:44, focusVisible:true }
  ]);
  assert.equal(unsafeAudit.status, "needs_fix");
  assert.equal(unsafeAudit.counts.missingInteractiveLabels, 1);
  assert.equal(unsafeAudit.counts.hiddenFocusableElements, 1);
  assert.equal(unsafeAudit.counts.focusVisibleDefects, 1);
  assert.equal(unsafeAudit.counts.secretValuesInAccessibleNames, 1);
  assert.equal(/should-not-leak/.test(JSON.stringify(unsafeAudit)), false);

  const keyboard = api.buildKeyboardModel(safeElements);
  assert.equal(keyboard.status, "pass");
  assert.equal(keyboard.focusableCount, 5);
  assert.equal(keyboard.hiddenDeferredRouteFocusable, 0);
  assert.equal(keyboard.firstFocusable.id, "home");
  assert.equal(keyboard.lastFocusable.id, "details");

  const badKeyboard = api.buildKeyboardModel([{ tag:"button", id:"cloud", text:"Cloud", deferredRoute:true, tabIndex:0, focusVisible:true }]);
  assert.equal(badKeyboard.status, "needs_fix");
  assert.equal(badKeyboard.hiddenDeferredRouteFocusable, 1);

  const enter = api.handleKeyboardCommand({ key:"Enter" });
  const space = api.handleKeyboardCommand({ key:" " });
  const escape = api.handleKeyboardCommand({ key:"Escape" });
  const arrow = api.handleKeyboardCommand({ key:"ArrowDown" });
  assert.equal(enter.action, "activate");
  assert.equal(space.action, "activate");
  assert.equal(escape.action, "dismiss");
  assert.equal(arrow.action, "move_focus");
  assert.equal(enter.executionGate, "CLOSED");
  assert.equal(enter.authorizesExecution, false);
  assert.equal(enter.productionTraffic, false);

  const wrapForward = api.evaluateFocusTrap(safeElements, 4, { key:"Tab" });
  const wrapBackward = api.evaluateFocusTrap(safeElements, 0, { key:"Tab", shiftKey:true });
  assert.equal(wrapForward.status, "wrapped");
  assert.equal(wrapForward.nextIndex, 0);
  assert.equal(wrapForward.keyboardTrapDefect, 0);
  assert.equal(wrapBackward.nextIndex, 4);
  assert.equal(wrapBackward.keyboardTrapDefect, 0);

  const mobile = api.evaluateDisplayProfile({
    viewportWidth:390,
    viewportHeight:844,
    contentWidth:390,
    zoom:2,
    reflow:true,
    prefersReducedMotion:true,
    animationsDisabled:true,
    forcedColors:true,
    outlineVisible:true
  });
  assert.equal(mobile.layoutMode, "single_column");
  assert.equal(mobile.horizontalOverflow, false);
  assert.equal(mobile.reducedMotionHonored, true);
  assert.equal(mobile.highContrastSafe, true);
  assert.equal(mobile.textScaleSafe, true);

  const overflow = api.evaluateDisplayProfile({ viewportWidth:390, viewportHeight:844, contentWidth:900 });
  assert.equal(overflow.horizontalOverflow, true);

  const installCalls = [];
  const fakeDocument = {
    readyState:"complete",
    documentElement:{ setAttribute:function (name, value) { installCalls.push([name, value]); } },
    getElementById:function (id) {
      if (id !== "app") return null;
      const attrs = {};
      return {
        getAttribute:function (name) { return attrs[name] || ""; },
        setAttribute:function (name, value) { attrs[name] = value; }
      };
    },
    querySelector:function () { return null; }
  };
  const install = api.installRuntimeAccessibilityGuard(fakeDocument);
  assert.equal(install.status, "installed");
  assert.deepEqual(installCalls[0], ["data-weishan-accessibility-keyboard-display", "ready"]);
  assert.equal(install.appRole, "main");

  const suite = api.runAccessibilityKeyboardDisplaySuite();
  assert.equal(suite.moduleName, "accessibility_keyboard_display_guard_v1");
  assert.equal(suite.after.INTERACTIVE_ELEMENTS_CHECKED, 7);
  assert.equal(suite.after.KEYBOARD_FOCUSABLE_COUNT, 6);
  assert.equal(suite.after.SMALL_LAYOUT_MODE, "single_column");
  assert.equal(suite.after.WIDE_LAYOUT_MODE, "wide");
  assertZeroMetrics(suite.zeroMetrics);
  assert.equal(suite.externalEffects.PROVIDER_API_CALLS, 0);
  assert.equal(suite.externalEffects.PROVIDER_CREDENTIAL_MUTATIONS, 0);
  assert.equal(suite.externalEffects.EMAIL_ACTIONS, 0);
  assert.equal(suite.externalEffects.PRODUCTION_TRAFFIC, 0);
  assert.equal(suite.governance.executionGate, "CLOSED");
  assert.equal(suite.governance.authorizesExecution, false);
  assert.equal(suite.governance.EMAIL_SEND_ENABLED, false);

  console.log("ACCESSIBILITY_KEYBOARD_DISPLAY_EFFECTIVENESS PASS keyboard=5 focus=visible display=responsive zeroMetrics=0");
}

main();
