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
    "apps/desktop/src/renderer/core/globalShoppingOfficialDomainVerifier.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingOfficialDomainVerifier;
  const verified = api.buildGlobalShoppingOfficialDomainVerification({
    providerId:"apple_official",
    targetUrl:"https://www.apple.com/search/iphone"
  });
  const blocked = api.buildGlobalShoppingOfficialDomainVerification({
    providerId:"apple_official",
    targetUrl:"https://apple.fake.example/search"
  });

  assert.equal(api.GLOBAL_SHOPPING_OFFICIAL_DOMAIN_VERIFIER_VERSION, "4.2.8");
  assert.equal(verified.verified, true);
  assert.equal(verified.trustLevel, "verified");
  assert.equal(blocked.trustLevel, "blocked");
  console.log("GLOBAL_SHOPPING_OFFICIAL_DOMAIN_VERIFIER PASS");
}

main();
