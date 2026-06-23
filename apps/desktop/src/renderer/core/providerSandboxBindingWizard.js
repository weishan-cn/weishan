;(function () {
  "use strict";

  const PROVIDER_SANDBOX_BINDING_WIZARD_VERSION = "2.1.68";
  const WIZARD_NAME = "provider_sandbox_binding_wizard_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalizeProviderMode(providerMode) {
    const mode = text(providerMode || "fixture");
    if (mode === "sandbox" || mode === "sandbox_read_only") return "sandbox_read_only";
    if (mode === "production" || mode === "production_disabled") return "production_disabled";
    return "fixture";
  }

  function isRestricted(options) {
    const safe = options && typeof options === "object" ? options : {};
    return safe.restrictedCategory === true || safe.restrictedCategoryDecision === "blocked" || safe.category === "restricted_provider" || safe.category === "restricted_or_blocked";
  }

  function safety() {
    return {
      noSecretInput:true,
      noSecretDisplay:true,
      noSecretPersistence:true,
      productionProviderEnabled:false,
      readOnly:true,
      booking:false,
      payment:false,
      order:false,
      identityUpload:false
    };
  }

  function step(stepId, label, status) {
    return { stepId:stepId, label:label, status:status };
  }

  function buildSteps(providerMode, sandboxDryRunEnabled, hasSecureCredentialReference, blocked) {
    if (blocked) {
      return [
        step("provider_selected", "选择只读 Provider", "blocked"),
        step("sandbox_dry_run", "启用沙盒干跑", "blocked"),
        step("secure_credential_reference", "安全凭据引用", "blocked"),
        step("read_only_refresh_ready", "只读报价刷新准备", "blocked")
      ];
    }
    if (providerMode === "fixture") {
      return [
        step("provider_selected", "选择只读 Provider", "complete"),
        step("sandbox_dry_run", "启用沙盒干跑", "pending"),
        step("secure_credential_reference", "安全凭据引用", "pending"),
        step("read_only_refresh_ready", "只读报价刷新准备", "complete")
      ];
    }
    if (providerMode === "sandbox_read_only") {
      const sandboxReady = sandboxDryRunEnabled === true;
      const referenceReady = hasSecureCredentialReference === true;
      return [
        step("provider_selected", "选择只读 Provider", "complete"),
        step("sandbox_dry_run", "启用沙盒干跑", sandboxReady ? "complete" : "pending"),
        step("secure_credential_reference", "安全凭据引用", referenceReady ? "complete" : "pending"),
        step("read_only_refresh_ready", "只读报价刷新准备", sandboxReady && referenceReady ? "complete" : "pending")
      ];
    }
    return [
      step("provider_selected", "选择只读 Provider", "complete"),
      step("sandbox_dry_run", "启用沙盒干跑", "blocked"),
      step("secure_credential_reference", "安全凭据引用", "blocked"),
      step("read_only_refresh_ready", "只读报价刷新准备", "blocked")
    ];
  }

  function statusFor(providerMode, sandboxDryRunEnabled, hasSecureCredentialReference, blocked) {
    if (blocked) return "blocked";
    if (providerMode === "fixture") return "fixture_ready";
    if (providerMode === "sandbox_read_only") return sandboxDryRunEnabled === true && hasSecureCredentialReference === true ? "sandbox_ready" : "needs_setup";
    return "disabled";
  }

  function missingRequirementsFor(providerMode, sandboxDryRunEnabled, hasSecureCredentialReference, blocked) {
    const missing = [];
    if (blocked) missing.push("当前品类已被安全阻断");
    if (providerMode === "sandbox_read_only") {
      if (sandboxDryRunEnabled !== true) missing.push("需要启用沙盒干跑");
      if (hasSecureCredentialReference !== true) missing.push("需要安全凭据引用");
    }
    if (providerMode === "production_disabled") missing.push("生产 Provider 暂未启用");
    return missing;
  }

  function buildProviderSandboxBindingWizardModel(options) {
    const safe = options && typeof options === "object" ? options : {};
    const providerMode = normalizeProviderMode(safe.providerMode || safe.mode);
    const sandboxDryRunEnabled = safe.sandboxDryRunEnabled === true || safe.dryRunEnabled === true;
    const hasSecureCredentialReference = safe.hasSecureCredentialReference === true;
    const networkDryRunAllowed = providerMode === "sandbox_read_only" && safe.networkDryRunAllowed === true;
    const blocked = isRestricted(safe);
    const status = statusFor(providerMode, sandboxDryRunEnabled, hasSecureCredentialReference, blocked);
    const canAttemptReadOnlyRefresh = status === "fixture_ready" || status === "sandbox_ready";
    const missingRequirements = missingRequirementsFor(providerMode, sandboxDryRunEnabled, hasSecureCredentialReference, blocked);
    const steps = buildSteps(providerMode, sandboxDryRunEnabled, hasSecureCredentialReference, blocked);
    const providerName = text(safe.providerName || (safe.providerId === "trip_com_ctrip_search" ? "Trip.com / Ctrip" : "Google Flights"));
    return clone({
      wizardName:WIZARD_NAME,
      appVersion:PROVIDER_SANDBOX_BINDING_WIZARD_VERSION,
      title:"Provider 沙盒绑定准备",
      providerId:text(safe.providerId || "google_flights_search"),
      providerName:providerName,
      providerMode:providerMode,
      status:status,
      sandboxDryRunEnabled:sandboxDryRunEnabled,
      hasSecureCredentialReference:hasSecureCredentialReference,
      networkDryRunAllowed:networkDryRunAllowed,
      missingRequirements:missingRequirements,
      steps:steps,
      summary:"Provider 沙盒绑定准备：" + status + (missingRequirements.length ? "（" + missingRequirements.join("；") + "）" : ""),
      actions:{
        canAttemptReadOnlyRefresh:canAttemptReadOnlyRefresh,
        canEnableProductionProvider:false,
        canEnterSecretHere:false,
        canSaveSecretHere:false
      },
      safety:safety(),
      productionProviderEnabled:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      autoOpen:false,
      redacted:true
    });
  }

  function evaluateProviderSandboxBindingStep(stepId, options) {
    const model = buildProviderSandboxBindingWizardModel(options);
    const id = text(stepId || "");
    const found = model.steps.find(function (item) { return item.stepId === id; }) || null;
    return clone(found || { stepId:id || "unknown", label:"未知步骤", status:model.status === "blocked" ? "blocked" : "pending" });
  }

  function buildProviderSandboxBindingWizardAuditDraft(options) {
    const model = buildProviderSandboxBindingWizardModel(options);
    return clone({
      eventType:"PROVIDER_SANDBOX_BINDING_WIZARD_AUDIT_DRAFT",
      wizardName:WIZARD_NAME,
      appVersion:PROVIDER_SANDBOX_BINDING_WIZARD_VERSION,
      providerId:model.providerId,
      providerMode:model.providerMode,
      status:model.status,
      stepCount:model.steps.length,
      completedStepCount:model.steps.filter(function (item) { return item.status === "complete"; }).length,
      canAttemptReadOnlyRefresh:model.actions.canAttemptReadOnlyRefresh === true,
      canEnableProductionProvider:false,
      canEnterSecretHere:false,
      canSaveSecretHere:false,
      missingRequirements:model.missingRequirements,
      productionProviderEnabled:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      autoOpen:false,
      safety:safety(),
      redacted:true
    });
  }

  window.WeishanProviderSandboxBindingWizard = {
    PROVIDER_SANDBOX_BINDING_WIZARD_VERSION,
    WIZARD_NAME,
    buildProviderSandboxBindingWizardModel,
    evaluateProviderSandboxBindingStep,
    buildProviderSandboxBindingWizardAuditDraft
  };
})();
