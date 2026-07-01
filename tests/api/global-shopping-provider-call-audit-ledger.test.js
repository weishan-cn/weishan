const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderCallAuditLedger.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderCallAuditLedger;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_CALL_AUDIT_LEDGER_VERSION, "3.6.0");

  const ready = api.buildGlobalShoppingProviderCallAuditLedger({
    providerId:"provider_1",
    providerName:"Fixture Provider",
    requestMode:"sandbox_ready",
    auditEntries:[{ auditId:"audit_1", providerId:"provider_1", providerName:"Fixture Provider", requestMode:"sandbox_ready", callStatus:"dry_run", redacted:true, timestamp:"redacted_now", safetyStatus:"redacted_safe" }]
  });
  assert.equal(ready.appVersion, "3.6.0");
  assert.equal(ready.status, "ready");
  assert.equal(ready.auditLedger.inMemoryOnly, true);
  assert.equal(ready.auditLedger.auditEntries.length, 1);

  assert.equal(api.buildGlobalShoppingProviderCallAuditLedger({}).status, "needs_review");
  assert.equal(api.buildGlobalShoppingProviderCallAuditLedger({ auditEntries:[{ auditId:"audit_1", redacted:true }], persisted:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingProviderCallAuditLedger({ auditEntries:[{ auditId:"audit_1", redacted:true }], rawResponseStored:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingProviderCallAuditLedger({ auditEntries:[{ auditId:"audit_1", redacted:true }], bookingUrl:"https://blocked.example" }).status, "blocked");

  const safeJson = JSON.stringify(api.buildGlobalShoppingProviderCallAuditLedger({ token:"abc", secret:"def", rawResponseStored:true }));
  assert.equal(/abc|def|bookingUrl|paymentUrl|orderUrl|checkoutUrl/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_CALL_AUDIT_LEDGER PASS");
}

main();
