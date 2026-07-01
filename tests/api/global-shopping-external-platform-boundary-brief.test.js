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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingExternalPlatformBoundaryBrief.js");
  const api = windowRef.WeishanGlobalShoppingExternalPlatformBoundaryBrief;
  assert.equal(api.GLOBAL_SHOPPING_EXTERNAL_PLATFORM_BOUNDARY_BRIEF_VERSION, "2.6.0");

  const ready = api.buildGlobalShoppingExternalPlatformBoundaryBrief({});
  assert.equal(ready.status, "ready");
  assert.equal(ready.boundaryStatements.length >= 6, true);
  assert.equal(ready.boundaryHealth.statesWeishanIsNotPlatform, true);

  assert.equal(api.buildGlobalShoppingExternalPlatformBoundaryBrief({ statesWeishanIsNotPlatform:false }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingExternalPlatformBoundaryBrief({ statesPlatformFinalAuthority:false }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingExternalPlatformBoundaryBrief({ statesNoPriceGuarantee:false }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingExternalPlatformBoundaryBrief({ statesNoAvailabilityGuarantee:false }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingExternalPlatformBoundaryBrief({ statesNoBookingPaymentTicketing:false }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingExternalPlatformBoundaryBrief({ statesUserManualDecision:false }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingExternalPlatformBoundaryBrief({ partnershipClaim:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingExternalPlatformBoundaryBrief({ officialEndorsementClaim:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingExternalPlatformBoundaryBrief({ authorizationClaim:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingExternalPlatformBoundaryBrief({ priceGuaranteeClaim:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingExternalPlatformBoundaryBrief({ bookingUrl:"https://blocked.example" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingExternalPlatformBoundaryBrief({ openExternal:true }).status, "blocked");
  assert.equal(JSON.stringify(ready).includes("secret"), false);
}

main();
