const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console, URL }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function assertSafety(panel) {
  assert.equal(panel.productionProviderEnabled, false);
  assert.equal(panel.bookingUrl, null);
  assert.equal(panel.checkoutUrl, null);
  assert.equal(panel.paymentUrl, null);
  assert.equal(panel.orderUrl, null);
  assert.equal(panel.autoOpen, false);
  assert.equal(panel.redacted, true);
  assert.equal(panel.safety.noSecretInput, true);
  assert.equal(panel.safety.noSecretDisplay, true);
  assert.equal(panel.safety.noSecretPersistence, true);
  assert.equal(panel.safety.noProductionProvider, true);
  assert.equal(panel.safety.readOnly, true);
  assert.equal(panel.safety.booking, false);
  assert.equal(panel.safety.payment, false);
  assert.equal(panel.safety.order, false);
  assert.equal(panel.safety.identityUpload, false);
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/providerSandboxBindingWizard.js", "apps/desktop/src/renderer/core/providerCredentialReadinessPanel.js"]);
  const api = windowRef.WeishanProviderCredentialReadinessPanel;
  assert.equal(api.PROVIDER_CREDENTIAL_READINESS_PANEL_VERSION, "2.1.91");

  const fixture = api.buildProviderCredentialReadinessPanel();
  assert.equal(fixture.panelName, "provider_credential_readiness_panel_v1");
  assert.equal(fixture.appVersion, "2.1.91");
  assert.equal(fixture.providerMode, "fixture");
  assert.equal(fixture.status, "fixture_ready");
  assert.equal(fixture.canAttemptReadOnlyRefresh, true);
  assert.equal(fixture.networkDryRunAllowed, false);
  assert.equal(fixture.missingRequirements.length, 0);
  assert.equal(fixture.wizardSummary.title, "Provider 沙盒绑定准备");
  assert.equal(fixture.wizardSummary.status, "fixture_ready");
  assertSafety(fixture);

  const sandboxMissing = api.evaluateProviderCredentialReadiness({ providerMode:"sandbox_read_only" });
  assert.equal(sandboxMissing.status, "disabled");
  assert.equal(sandboxMissing.missingRequirements.includes("需要安全凭据引用"), true);
  assert.equal(sandboxMissing.missingRequirements.includes("需要启用沙盒干跑"), true);
  assert.equal(sandboxMissing.wizardSummary.status, "needs_setup");
  assert.equal(sandboxMissing.canAttemptReadOnlyRefresh, false);
  assertSafety(sandboxMissing);

  const sandboxReady = api.evaluateProviderCredentialReadiness({ providerMode:"sandbox", hasSecureCredentialReference:true, sandboxDryRunEnabled:true, networkDryRunAllowed:true });
  assert.equal(sandboxReady.providerMode, "sandbox_read_only");
  assert.equal(sandboxReady.status, "sandbox_ready");
  assert.equal(sandboxReady.canAttemptReadOnlyRefresh, true);
  assert.equal(sandboxReady.networkDryRunAllowed, true);
  assert.equal(sandboxReady.wizardSummary.status, "sandbox_ready");
  assertSafety(sandboxReady);

  const production = api.evaluateProviderCredentialReadiness({ providerMode:"production", hasSecureCredentialReference:true, sandboxDryRunEnabled:true, networkDryRunAllowed:true });
  assert.equal(production.providerMode, "production_disabled");
  assert.equal(production.status, "disabled");
  assert.equal(production.canAttemptReadOnlyRefresh, false);
  assert.equal(production.productionProviderEnabled, false);
  assert.equal(production.missingRequirements.includes("生产 Provider 暂未启用"), true);
  assertSafety(production);

  const blocked = api.evaluateProviderCredentialReadiness({ restrictedCategoryDecision:"blocked" });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.canAttemptReadOnlyRefresh, false);
  assertSafety(blocked);

  const audit = api.buildProviderCredentialReadinessAuditDraft({ providerMode:"fixture" });
  assert.equal(audit.eventType, "PROVIDER_CREDENTIAL_READINESS_PANEL_AUDIT_DRAFT");
  assert.equal(audit.canAttemptReadOnlyRefresh, true);
  assertSafety(audit);

  const forbidden = ["tok" + "en", "k" + "ey", "sec" + "ret"];
  const serialized = JSON.stringify({ fixture, sandboxMissing, sandboxReady, production, blocked, audit });
  for (const word of forbidden) assert.equal(serialized.includes(word), false);
  console.log("PROVIDER_CREDENTIAL_READINESS_PANEL_CORE PASS");
}

main();
