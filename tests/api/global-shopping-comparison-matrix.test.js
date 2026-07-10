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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingComparisonMatrix.js");
  const api = windowRef.WeishanGlobalShoppingComparisonMatrix;
  const hotel = api.buildGlobalShoppingComparisonMatrix({
    category:"hotel",
    candidates:[{
      platformName:"Booking.com",
      targetUrl:"https://booking.com",
      priceLabel:"到平台查看实时价格",
      feeNote:"含服务费说明",
      riskNote:"取消政策以平台页面为准",
      taxSummary:{ taxConfidence:"estimated" },
      trustVerification:{ status:"ready" },
      trustLevel:"high"
    }]
  });
  const flight = api.buildGlobalShoppingComparisonMatrix({
    category:"flight",
    candidates:[{
      platformName:"Trip.com",
      targetUrl:"https://trip.com",
      priceLabel:"到平台查看实时价格",
      feeNote:"行李规则以平台页面为准",
      taxSummary:{ taxConfidence:"unknown" },
      trustVerification:{ status:"ready" },
      trustLevel:"high"
    }]
  });

  assert.equal(api.GLOBAL_SHOPPING_COMPARISON_MATRIX_VERSION, "4.2.8");
  assert.equal(hotel.rows[0].comparisonType, "hotel");
  assert.equal(flight.rows[0].comparisonType, "flight");
  console.log("GLOBAL_SHOPPING_COMPARISON_MATRIX PASS");
}

main();
