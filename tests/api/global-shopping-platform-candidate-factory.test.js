const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySearchResultModel.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformCandidateFactory.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingPlatformCandidateFactory;
  const product = api.buildGlobalShoppingPlatformCandidates({
    category:"product",
    normalizedFields:{ productQuery:"iPhone 16 Pro" }
  });
  const flight = api.buildGlobalShoppingPlatformCandidates({
    category:"flight",
    normalizedFields:{ originText:"成都", destinationText:"上海", dateText:"7 月 15 日" }
  });
  const hotel = api.buildGlobalShoppingPlatformCandidates({
    category:"hotel",
    normalizedFields:{ destinationText:"东京" }
  });
  assert.equal(api.GLOBAL_SHOPPING_PLATFORM_CANDIDATE_FACTORY_VERSION, "4.2.7");
  assert.equal(product.length >= 8, true);
  assert.equal(flight.length >= 8, true);
  assert.equal(hotel.length >= 8, true);
  assert.equal(product.every((item) => item.readOnlyCandidate === true), true);
  assert.equal(flight.every((item) => /checkout|payment|order/i.test(item.targetUrl || "") === false), true);
  assert.equal(hotel.some((item) => item.isOfficial === true), true);
  assert.match(flight[0].feeNote, /平台页面/);
  console.log("GLOBAL_SHOPPING_PLATFORM_CANDIDATE_FACTORY PASS");
}

main();
