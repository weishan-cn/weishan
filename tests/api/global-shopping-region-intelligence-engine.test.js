const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(file) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingRegionIntelligenceEngine.js");
  const api = windowRef.WeishanGlobalShoppingRegionIntelligenceEngine;
  const explicit = api.buildGlobalShoppingRegionContext({
    userSelectedCountry:"JP",
    language:"ja-JP",
    currency:"JPY"
  });
  const gps = api.buildGlobalShoppingRegionContext({
    gpsRegion:"US",
    systemLanguage:"en-US"
  });
  const inferred = api.buildGlobalShoppingRegionContext({
    systemLanguage:"de-DE"
  });

  assert.equal(api.GLOBAL_SHOPPING_REGION_INTELLIGENCE_ENGINE_VERSION, "4.2.8");
  assert.equal(explicit.country, "JP");
  assert.equal(explicit.source.country, "user_selected_country");
  assert.equal(gps.country, "US");
  assert.equal(gps.source.country, "gps_region");
  assert.equal(inferred.country, "DE");
  assert.equal(inferred.language, "de-DE");
  console.log("GLOBAL_SHOPPING_REGION_INTELLIGENCE_ENGINE PASS");
}

main();
