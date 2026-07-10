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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingDataQualityEngine.js");
  const api = windowRef.WeishanGlobalShoppingDataQualityEngine;
  const high = api.buildGlobalShoppingDataQuality({
    sourceTrust:"high",
    completeness:0.95,
    freshness:{ freshnessLevel:"fresh" },
    officialVerification:true,
    consistency:0.92
  });
  const low = api.buildGlobalShoppingDataQuality({
    sourceTrust:"review",
    completeness:0.3,
    freshness:{ freshnessLevel:"expired" },
    officialVerification:false,
    consistency:0.4
  });

  assert.equal(api.GLOBAL_SHOPPING_DATA_QUALITY_ENGINE_VERSION, "4.2.8");
  assert.equal(high.qualityLevel, "high");
  assert.equal(low.qualityLevel, "low");
  assert.equal(Array.isArray(low.warnings), true);
  console.log("GLOBAL_SHOPPING_DATA_QUALITY_ENGINE PASS");
}

main();
