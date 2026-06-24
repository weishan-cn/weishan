;(function () {
  "use strict";

  const PROVIDER_CREDENTIAL_READINESS_PANEL_VERSION = "2.1.79";
  const PANEL_NAME = "provider_credential_readiness_panel_v1";

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

  function getWizardApi() {
    return window.WeishanProviderSandboxBindingWizard || {};
  }

  function baseSafety() {
    return {
      noSecretInput:true,
      noSecretDisplay:true,
      noSecretPersistence:true,
      noProductionProvider:true,
      readOnly:true,
      booking:false,
      payment:false,
      order:false,
      identityUpload:false
    };
  }

  function evaluateProviderCredentialReadiness(options) {
    const safe = options && typeof options === "object" ? options : {};
    const providerMode = normalizeProviderMode(safe.providerMode || safe.mode);
    const hasSecureCredentialReference = safe.hasSecureCredentialReference === true;
    const sandboxDryRunEnabled = safe.sandboxDryRunEnabled === true || safe.dryRunEnabled === true;
    const networkDryRunAllowed = providerMode === "sandbox_read_only" && safe.networkDryRunAllowed === true;
    const missingRequirements = [];
    const wizardApi = getWizardApi();
    const wizard = typeof wizardApi.buildProviderSandboxBindingWizardModel === "function"
      ? wizardApi.buildProviderSandboxBindingWizardModel(Object.assign({}, safe, { providerMode }))
      : null;
    let status = "disabled";
    let canAttemptReadOnlyRefresh = false;
    let reason = "provider credential readiness disabled";

    if (isRestricted(safe)) {
      status = "blocked";
      reason = "restricted category blocked";
      missingRequirements.push("当前品类已被安全阻断");
    } else if (providerMode === "fixture") {
      status = "fixture_ready";
      reason = "fixture read-only refresh ready";
      canAttemptReadOnlyRefresh = true;
    } else if (providerMode === "sandbox_read_only") {
      if (!sandboxDryRunEnabled) missingRequirements.push("需要启用沙盒干跑");
      if (!hasSecureCredentialReference) missingRequirements.push("需要安全凭据引用");
      if (missingRequirements.length === 0) {
        status = "sandbox_ready";
        reason = "sandbox read-only refresh ready";
        canAttemptReadOnlyRefresh = true;
      } else {
        status = "disabled";
        reason = "sandbox read-only refresh requirements missing";
      }
    } else {
      status = "disabled";
      reason = "production provider disabled";
      missingRequirements.push("生产 Provider 暂未启用");
    }

    const wizardSummary = wizard ? {
      wizardName:wizard.wizardName,
      title:wizard.title,
      status:wizard.status,
      steps:wizard.steps,
      canAttemptReadOnlyRefresh:wizard.actions && wizard.actions.canAttemptReadOnlyRefresh === true,
      canEnableProductionProvider:false,
      canEnterSecretHere:false,
      canSaveSecretHere:false,
      missingRequirements:wizard.missingRequirements || missingRequirements,
      productionProviderEnabled:false,
      redacted:true
    } : {
      wizardName:"provider_sandbox_binding_wizard_v1",
      title:"Provider 沙盒绑定准备",
      status:status,
      steps:[],
      canAttemptReadOnlyRefresh:canAttemptReadOnlyRefresh,
      canEnableProductionProvider:false,
      canEnterSecretHere:false,
      canSaveSecretHere:false,
      missingRequirements:missingRequirements,
      productionProviderEnabled:false,
      redacted:true
    };

    return clone({
      panelName:PANEL_NAME,
      appVersion:PROVIDER_CREDENTIAL_READINESS_PANEL_VERSION,
      providerId:text(safe.providerId || "google_flights_search"),
      providerMode:providerMode,
      status:status,
      reason:reason,
      hasSecureCredentialReference:hasSecureCredentialReference,
      sandboxDryRunEnabled:sandboxDryRunEnabled,
      networkDryRunAllowed:networkDryRunAllowed,
      productionProviderEnabled:false,
      canAttemptReadOnlyRefresh:canAttemptReadOnlyRefresh,
      missingRequirements:missingRequirements,
      wizardSummary:wizardSummary,
      safety:baseSafety(),
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      autoOpen:false,
      redacted:true
    });
  }

  function buildProviderCredentialReadinessPanel(options) {
    return evaluateProviderCredentialReadiness(options);
  }

  function buildProviderCredentialReadinessAuditDraft(options) {
    const readiness = evaluateProviderCredentialReadiness(options);
    return clone({
      eventType:"PROVIDER_CREDENTIAL_READINESS_PANEL_AUDIT_DRAFT",
      panelName:PANEL_NAME,
      appVersion:PROVIDER_CREDENTIAL_READINESS_PANEL_VERSION,
      providerId:readiness.providerId,
      providerMode:readiness.providerMode,
      status:readiness.status,
      hasSecureCredentialReference:readiness.hasSecureCredentialReference === true,
      sandboxDryRunEnabled:readiness.sandboxDryRunEnabled === true,
      networkDryRunAllowed:readiness.networkDryRunAllowed === true,
      productionProviderEnabled:false,
      canAttemptReadOnlyRefresh:readiness.canAttemptReadOnlyRefresh === true,
      missingRequirements:readiness.missingRequirements || [],
      wizardStatus:readiness.wizardSummary && readiness.wizardSummary.status || readiness.status,
      wizardSummary:readiness.wizardSummary || null,
      safety:baseSafety(),
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      autoOpen:false,
      redacted:true
    });
  }

  window.WeishanProviderCredentialReadinessPanel = {
    PROVIDER_CREDENTIAL_READINESS_PANEL_VERSION,
    PANEL_NAME,
    buildProviderCredentialReadinessPanel,
    evaluateProviderCredentialReadiness,
    buildProviderCredentialReadinessAuditDraft
  };
})();
