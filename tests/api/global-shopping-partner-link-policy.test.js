const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPartnerLinkPolicy.js"]);
  const api = windowRef.WeishanGlobalShoppingPartnerLinkPolicy;
  assert.equal(api.GLOBAL_SHOPPING_PARTNER_LINK_POLICY_VERSION, "2.2.2");
  const safe = api.buildGlobalShoppingPartnerLinkPolicy({ linkRelation:"partner" });
  assert.equal(safe.appVersion, "2.2.2");
  assert.equal(safe.status, "compliant");
  assert.equal(safe.userFacingSummary.title, "合作/联盟链接政策");
  assert.equal(api.buildGlobalShoppingPartnerLinkPolicy({ partnerLinkPolicy:{ disclosesPotentialPartnerLink:false } }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPartnerLinkPolicy({ partnerLinkPolicy:{ claimsOfficialEndorsement:true } }).status, "blocked");
  assert.equal(api.buildGlobalShoppingPartnerLinkPolicy({ partnerLinkPolicy:{ claimsLowestPrice:true } }).status, "blocked");
  assert.equal(api.buildGlobalShoppingPartnerLinkPolicy({ partnerLinkPolicy:{ claimsDirectOrdering:true } }).status, "blocked");
  assert.equal(api.buildGlobalShoppingPartnerLinkPolicy({ bookingUrl:"https://blocked.example" }).status, "blocked");
  const serialized = JSON.stringify(api.buildGlobalShoppingPartnerLinkPolicy({ token:"abc", secret:"abc" }));
  assert.equal(/abc|https:\/\/blocked/.test(serialized), false);
  console.log("GLOBAL_SHOPPING_PARTNER_LINK_POLICY PASS");
}
main();
