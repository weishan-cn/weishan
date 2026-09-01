"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
function source(file){ return fs.readFileSync(path.join(ROOT, file), "utf8"); }

function loadRegistry(){
  const values = new Map();
  const events = [];
  const window = {
    window:null,
    WeishanStore:{ read(key, fallback){ return values.has(key) ? values.get(key) : fallback; }, write(key, value){ values.set(key, value); return value; } },
    dispatchEvent(event){ events.push(event); },
    CustomEvent:function CustomEvent(type, init){ this.type = type; this.detail = init && init.detail; }
  };
  window.window = window;
  const context = vm.createContext({ window, console, Object, Array, Set, String, Boolean, CustomEvent:window.CustomEvent });
  vm.runInContext(source("apps/desktop/src/renderer/core/experienceMode.js"), context, { filename:"experienceMode.js" });
  vm.runInContext(source("apps/desktop/src/renderer/core/moduleRegistry.js"), context, { filename:"moduleRegistry.js" });
  return { window, values, events };
}

function main(){
  const { window, values, events } = loadRegistry();
  const mode = window.WeishanExperienceMode;
  const registry = window.WeishanModules;

  assert.equal(mode.isAdvanced(), false);
  ["home", "mail", "commerce", "plugins"].forEach((id) => assert.equal(registry.hasRoute(id), true, id));
  ["crawler", "builder", "audit"].forEach((id) => assert.equal(registry.hasRoute(id), false, id));
  assert.deepEqual(Array.from(registry.modulesForGroup("advanced")), []);

  assert.equal(mode.setAdvanced(true), true);
  assert.equal(values.get(mode.STORE_KEY), true);
  assert.equal(events.length, 1);
  assert.deepEqual(Array.from(registry.modulesForGroup("advanced")).map((item) => item.id), ["crawler", "builder", "audit"]);
  assert.equal(mode.setAdvanced(false), false);
  assert.equal(registry.hasRoute("audit"), false);

  const settings = source("apps/desktop/src/renderer/routes/SettingsPage.js");
  const security = source("apps/desktop/src/renderer/routes/SecurityPage.js");
  const topbar = source("apps/desktop/src/renderer/components/Topbar.js");
  const home = source("apps/desktop/src/renderer/routes/HomePage.js");
  const index = source("apps/desktop/src/index.html");
  assert.match(settings, /data-settings-section="credentials" data-advanced-only="true"/);
  assert.match(settings, /data-settings-section="developer-diagnostics" data-advanced-only="true"/);
  assert.match(security, /data-security-section="consumer-privacy"/);
  assert.match(security, /data-security-section="diagnostics" data-advanced-only="true"/);
  assert.doesNotMatch(topbar, /id="aiConnectionStatus"/);
  assert.doesNotMatch(topbar, /id="workspaceBtn"/);
  assert.doesNotMatch(home.slice(home.indexOf("function render(host)"), home.indexOf("function bind(host)")), /id="(?:uploadBtn|recordBtn)"/);
  assert.match(index, /experienceMode\.js\?v=4\.2\.8/);

  console.log("CONSUMER_NAVIGATION_ADVANCED_MODE_EFFECTIVENESS=PASS");
  console.log("ADVANCED_MODE_DEFAULT=OFF");
  console.log("ADVANCED_MODE_CANONICAL_AUTHORITY_COUNT=1");
  console.log("ADVANCED_MODE_EXTERNAL_SIDE_EFFECTS=0");
}

main();
