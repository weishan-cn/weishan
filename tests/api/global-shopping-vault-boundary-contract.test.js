const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingVaultBoundaryContract.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingVaultBoundaryContract;
  assert.equal(api.GLOBAL_SHOPPING_VAULT_BOUNDARY_CONTRACT_VERSION, "2.3.3");
  const ready = api.buildGlobalShoppingVaultBoundaryContract({});
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Vault Boundary Contract");
  assert.equal(ready.rows.some((item) => item.value.includes("不读取")), true);
  const needsReview = api.buildGlobalShoppingVaultBoundaryContract({ requireContractClauses:true, contractClauses:[] });
  assert.equal(needsReview.status, "needs_review");
  const blocked = api.buildGlobalShoppingVaultBoundaryContract({ readRealApiKey:true });
  assert.equal(blocked.status, "blocked");
  const guardBlocked = api.buildGlobalShoppingVaultBoundaryContract({ secretPersistenceGuardPass:false });
  assert.equal(guardBlocked.status, "blocked");
  const audit = api.buildGlobalShoppingVaultBoundaryContractAuditDraft({ secret:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_VAULT_BOUNDARY_CONTRACT PASS");
}

main();
