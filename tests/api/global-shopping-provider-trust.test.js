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
    "apps/desktop/src/renderer/core/globalShoppingProviderRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderTrustRegistry.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderTrustRegistry;
  const ready = api.buildGlobalShoppingProviderTrustSummary({
    providerId:"apple_official",
    targetUrl:"https://www.apple.com/search/iphone"
  });
  const blocked = api.buildGlobalShoppingProviderTrustSummary({
    providerId:"apple_official",
    targetUrl:"https://apple.fake-checkout.example/search/iphone"
  });
  const review = api.buildGlobalShoppingProviderTrustSummary({
    providerId:"unknown_provider",
    targetUrl:"https://example.com/search"
  });

  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_TRUST_REGISTRY_VERSION, "4.2.8");
  assert.equal(ready.status, "ready");
  assert.equal(ready.officialMatch, true);
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.unknownDomainBlocked, true);
  assert.equal(review.status, "needs_review");
  console.log("GLOBAL_SHOPPING_PROVIDER_TRUST PASS");
}

main();
