const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
function loadRendererCore(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL });
  for (const file of files) {
    const source = fs.readFileSync(path.join(ROOT, file), "utf8");
    vm.runInContext(source, context, { filename:file });
  }
  return window;
}
function assertNoDangerousSurface(value) {
  const serialized = JSON.stringify(value);
  assert.equal(/bookingUrl"\s*:\s*"https?:/i.test(serialized), false);
  assert.equal(/checkoutUrl|paymentUrl|orderUrl/i.test(serialized), false);
  assert.equal(/sk-[A-Za-z0-9_-]{12,}|rawApiKey"\s*:\s*"[^"]+|rawToken"\s*:\s*"[^"]+/i.test(serialized), false);
}
const windowRef = loadRendererCore(["apps/desktop/src/renderer/core/providerEndpointAllowlistEnforcement.js"]);
const api = windowRef.WeishanProviderEndpointAllowlistEnforcement;

function expectBlocked(endpointCandidate, reason) {
  const decision = api.validateEndpointCandidate({ providerId:"flight_provider", endpointCandidate });
  assert.equal(decision.finalDecision, "blocked");
  assert.equal(decision.blockedReason, reason);
  assert.equal(decision.networkAttemptCount, 0);
  assert.equal(decision.realEndpointConnectCount, 0);
  assert.equal(decision.redacted, true);
  assert.equal(api.assertEndpointAllowlistEnforcementSafe(decision), true);
  return decision;
}
function main() {
  assert.equal(api.PROVIDER_ENDPOINT_ALLOWLIST_ENFORCEMENT_VERSION, "4.0.6");
  const draft = api.buildEndpointAllowlistEnforcementDraft("flight_provider");
  assert.equal(draft.status, "endpoint allowlist enforcement only");
  assert.equal(draft.mode, "sandbox allowlist only");
  assert.equal(draft.productionEndpoint, "disabled");
  assert.equal(draft.arbitraryEndpoint, "disabled");
  assert.equal(draft.redirect, "disabled");
  assert.equal(draft.credentialQueryParams, "disabled");
  assert.equal(draft.paymentOrderCheckoutEndpoint, "disabled");
  assert.equal(draft.identityUploadEndpoint, "disabled");
  assert.equal(draft.redacted, true);
  assert.equal(draft.flightProviderAllowlistDraft.allowedSandboxHosts.includes("provider-sandbox.invalid"), true);
  assert.equal(draft.flightProviderAllowlistDraft.allowedSandboxPaths.includes("/sandbox/dry-run"), true);

  const allowed = api.validateEndpointCandidate({ providerId:"flight_provider", endpointCandidate:"https://provider-sandbox.invalid/sandbox/dry-run" });
  assert.equal(allowed.finalDecision, "allowlisted_sandbox_only");
  assert.equal(allowed.matchedProvider, "flight_provider");
  assert.equal(allowed.matchedHost, "provider-sandbox.invalid");
  assert.equal(allowed.matchedPath, "/sandbox/dry-run");
  assert.equal(allowed.redirectPolicy, "disabled");
  assert.equal(allowed.credentialQueryParamPolicy, "disabled");
  assert.equal(allowed.networkAttemptCount, 0);
  assert.equal(allowed.realEndpointConnectCount, 0);
  assert.equal(allowed.auditDraft.eventType, "ENDPOINT_ALLOWLIST_ENFORCEMENT_V1_DRAFT");
  assert.equal(allowed.auditDraft.networkAttemptCount, 0);
  assert.equal(allowed.auditDraft.realEndpointConnectCount, 0);
  assert.equal(allowed.auditDraft.redacted, true);

  expectBlocked("https://production-provider.invalid/sandbox/dry-run", "production_endpoint_disabled");
  expectBlocked("https://unlisted-sandbox.invalid/sandbox/dry-run", "arbitrary_endpoint_disabled");
  expectBlocked("http://provider-sandbox.invalid/sandbox/dry-run", "http_endpoint_disabled");
  expectBlocked("https://192.168.1.10/sandbox/dry-run", "ip_endpoint_disabled");
  expectBlocked("https://localhost/sandbox/dry-run", "internal_host_disabled");
  expectBlocked("https://provider-sandbox.invalid/sandbox/dry-run?apiKey=SHOULD_REDACT", "credential_query_params_disabled");
  expectBlocked("https://provider-sandbox.invalid/sandbox/payment", "payment_checkout_endpoint_disabled");
  expectBlocked("https://provider-sandbox.invalid/sandbox/order", "order_booking_endpoint_disabled");
  expectBlocked("https://provider-sandbox.invalid/sandbox/identity-upload", "identity_upload_endpoint_disabled");
  const redirectBlocked = api.validateEndpointCandidate({ providerId:"flight_provider", endpointCandidate:"https://provider-sandbox.invalid/sandbox/dry-run", redirectTarget:"https://provider-sandbox.invalid/sandbox/search" });
  assert.equal(redirectBlocked.finalDecision, "blocked");
  assert.equal(redirectBlocked.blockedReason, "redirect_disabled");
  assert.equal(redirectBlocked.auditDraft.redirectBlockedCount, 1);

  const redacted = api.validateEndpointCandidate({ providerId:"flight_provider", endpointCandidate:"https://provider-sandbox.invalid/sandbox/dry-run?token=SHOULD_NOT_APPEAR" });
  assert.equal(JSON.stringify(redacted).includes("SHOULD_NOT_APPEAR"), false);
  assertNoDangerousSurface(draft);
  assertNoDangerousSurface(allowed);
  assertNoDangerousSurface(redirectBlocked);
  console.log("PROVIDER_ENDPOINT_ALLOWLIST_ENFORCEMENT_CORE PASS");
}
main();
