const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console, URL }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/trustedFlightSourceRegistry.js",
    "apps/desktop/src/renderer/core/multiProviderSandboxAdapterRegistry.js",
    "apps/desktop/src/renderer/core/sandboxProviderRunMatrix.js"
  ]);
  const api = windowRef.WeishanSandboxProviderRunMatrix;
  assert.equal(api.SANDBOX_PROVIDER_RUN_MATRIX_VERSION, "4.2.1");
  const matrix = api.buildSandboxProviderRunMatrix();
  assert.equal(matrix.appVersion, "4.2.1");
  assert.equal(matrix.runMode, "read_only_sandbox");
  assert.equal(matrix.productionProviderEnabled, false);
  assert.equal(matrix.networkAllowed, false);
  assert.equal(matrix.providers.find((row) => row.providerId === "flight_provider_trusted_fixture").status, "runnable");
  assert.equal(matrix.providers.find((row) => row.providerId === "trip_com_sandbox_stub").status, "runnable");
  assert.equal(matrix.providers.find((row) => row.providerId === "airline_official_sandbox_stub").status, "runnable");
  assert.equal(matrix.providers.find((row) => row.providerId === "google_flights_search").status, "handoff_only");
  assert.equal(api.evaluateSandboxProviderRunEligibility("unknown_provider", { providers: matrix.providers }).status, "blocked");
  const audit = api.buildSandboxProviderRunMatrixAuditDraft();
  assert.equal(audit.appVersion, "4.2.1");
  assert.equal(audit.bookingUrl, null);
  assert.equal(audit.identityUpload, false);
  console.log("SANDBOX_PROVIDER_RUN_MATRIX PASS");
}
main();
