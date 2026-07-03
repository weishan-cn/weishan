const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console, URL }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function assertSafe(model) {
  assert.equal(model.productionProviderEnabled, false);
  assert.equal(model.bookingUrl, null);
  assert.equal(model.checkoutUrl, null);
  assert.equal(model.paymentUrl, null);
  assert.equal(model.orderUrl, null);
  assert.equal(model.autoOpen, false);
  assert.equal(model.safety.noSecretInput, true);
  assert.equal(model.safety.noSecretDisplay, true);
  assert.equal(model.safety.noSecretPersistence, true);
  assert.equal(model.safety.readOnly, true);
  assert.equal(model.safety.booking, false);
  assert.equal(model.safety.payment, false);
  assert.equal(model.safety.order, false);
  assert.equal(model.safety.identityUpload, false);
  assert.equal(model.redacted, true);
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/providerSandboxBindingWizard.js"]);
  const api = windowRef.WeishanProviderSandboxBindingWizard;
  assert.equal(api.PROVIDER_SANDBOX_BINDING_WIZARD_VERSION, "4.1.2");

  const fixture = api.buildProviderSandboxBindingWizardModel();
  assert.equal(fixture.wizardName, "provider_sandbox_binding_wizard_v1");
  assert.equal(fixture.title, "Provider 沙盒绑定准备");
  assert.equal(fixture.status, "fixture_ready");
  assert.equal(fixture.actions.canAttemptReadOnlyRefresh, true);
  assert.equal(fixture.autoOpen, false);
  assert.equal(fixture.actions.canEnableProductionProvider, false);
  assert.equal(fixture.steps.find((step) => step.stepId === "provider_selected").status, "complete");
  assert.equal(fixture.steps.find((step) => step.stepId === "read_only_refresh_ready").status, "complete");
  assertSafe(fixture);

  const sandboxMissing = api.buildProviderSandboxBindingWizardModel({ providerMode:"sandbox_read_only" });
  assert.equal(sandboxMissing.status, "needs_setup");
  assert.equal(sandboxMissing.actions.canAttemptReadOnlyRefresh, false);
  assert.equal(sandboxMissing.missingRequirements.includes("需要启用沙盒干跑"), true);
  assert.equal(sandboxMissing.missingRequirements.includes("需要安全凭据引用"), true);
  assert.equal(api.evaluateProviderSandboxBindingStep("sandbox_dry_run", sandboxMissing).status, "pending");
  assertSafe(sandboxMissing);

  const sandboxReady = api.buildProviderSandboxBindingWizardModel({ providerMode:"sandbox", sandboxDryRunEnabled:true, hasSecureCredentialReference:true, networkDryRunAllowed:true });
  assert.equal(sandboxReady.providerMode, "sandbox_read_only");
  assert.equal(sandboxReady.status, "sandbox_ready");
  assert.equal(sandboxReady.actions.canAttemptReadOnlyRefresh, true);
  assert.equal(sandboxReady.steps.every((step) => step.status === "complete"), true);
  assertSafe(sandboxReady);

  const production = api.buildProviderSandboxBindingWizardModel({ providerMode:"production" });
  assert.equal(production.providerMode, "production_disabled");
  assert.equal(production.status, "disabled");
  assert.equal(production.actions.canEnableProductionProvider, false);
  assert.equal(production.missingRequirements.includes("生产 Provider 暂未启用"), true);
  assertSafe(production);

  const blocked = api.buildProviderSandboxBindingWizardModel({ restrictedCategoryDecision:"blocked" });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.actions.canAttemptReadOnlyRefresh, false);
  assertSafe(blocked);

  const audit = api.buildProviderSandboxBindingWizardAuditDraft({ providerMode:"fixture" });
  assert.equal(audit.eventType, "PROVIDER_SANDBOX_BINDING_WIZARD_AUDIT_DRAFT");
  assert.equal(audit.canAttemptReadOnlyRefresh, true);
  assert.equal(audit.canEnableProductionProvider, false);
  assertSafe(audit);
  console.log("PROVIDER_SANDBOX_BINDING_WIZARD_CORE PASS");
}

main();
