#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

function readJson(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (error) {
    return { __readError: error.message };
  }
}

function readText(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  try {
    return fs.readFileSync(fullPath, "utf8");
  } catch (error) {
    return { __readError: error.message };
  }
}

function addCheck(results, name, expected, actual, detail) {
  const pass = Boolean(expected) && Boolean(actual) && expected === actual;
  results.push({
    name,
    pass,
    detail: pass ? `${expected}` : `${detail || "version mismatch"}: expected ${expected || "missing"}, got ${actual || "missing"}`
  });
}

function checkRendererConfigVersion(results, expectedVersion) {
  const configPath = "apps/desktop/src/renderer/core/config.js";
  const config = readText(configPath);
  if (!config) {
    results.push({ name: "apps/desktop renderer config version", pass: false, detail: configPath + " missing" });
    return;
  }
  if (config.__readError) {
    results.push({ name: "apps/desktop renderer config version", pass: false, detail: config.__readError });
    return;
  }
  const match = config.match(/version:\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop renderer config version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/config.js window.WeishanConfig.version"
  );
}

function checkFlightProviderCandidatesVersion(results, expectedVersion) {
  const candidatesPath = "apps/desktop/src/renderer/core/commerceFlightProviderCandidates.js";
  const candidates = readText(candidatesPath);
  if (!candidates) {
    results.push({ name: "apps/desktop flight provider candidates registry version", pass: false, detail: candidatesPath + " missing" });
    return;
  }
  if (candidates.__readError) {
    results.push({ name: "apps/desktop flight provider candidates registry version", pass: false, detail: candidates.__readError });
    return;
  }
  const match = candidates.match(/CONTRACT_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop flight provider candidates registry version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceFlightProviderCandidates.js CONTRACT_VERSION"
  );
}

function checkFlightLowestOffersVersion(results, expectedVersion) {
  const lowestPath = "apps/desktop/src/renderer/core/commerceFlightLowestOffersContract.js";
  const lowest = readText(lowestPath);
  if (!lowest) {
    results.push({ name: "apps/desktop flight lowest offers contract version", pass: false, detail: lowestPath + " missing" });
    return;
  }
  if (lowest.__readError) {
    results.push({ name: "apps/desktop flight lowest offers contract version", pass: false, detail: lowest.__readError });
    return;
  }
  const match = lowest.match(/CONTRACT_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop flight lowest offers contract version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceFlightLowestOffersContract.js CONTRACT_VERSION"
  );
}

function checkFlightProviderApprovalVersion(results, expectedVersion) {
  const approvalPath = "apps/desktop/src/renderer/core/commerceFlightProviderApproval.js";
  const approval = readText(approvalPath);
  if (!approval) {
    results.push({ name: "apps/desktop flight provider approval version", pass: false, detail: approvalPath + " missing" });
    return;
  }
  if (approval.__readError) {
    results.push({ name: "apps/desktop flight provider approval version", pass: false, detail: approval.__readError });
    return;
  }
  const match = approval.match(/APPROVAL_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop flight provider approval version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceFlightProviderApproval.js APPROVAL_VERSION"
  );
}

function checkFlightReadonlyStubPermissionVersion(results, expectedVersion) {
  const permissionPath = "apps/desktop/src/renderer/core/commerceFlightReadonlyStubPermission.js";
  const permission = readText(permissionPath);
  if (!permission) {
    results.push({ name: "apps/desktop flight readonly stub permission version", pass: false, detail: permissionPath + " missing" });
    return;
  }
  if (permission.__readError) {
    results.push({ name: "apps/desktop flight readonly stub permission version", pass: false, detail: permission.__readError });
    return;
  }
  const match = permission.match(/PERMISSION_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop flight readonly stub permission version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceFlightReadonlyStubPermission.js PERMISSION_VERSION"
  );
}

function checkFlightReadonlyStubAdapterVersion(results, expectedVersion) {
  const adapterPath = "apps/desktop/src/renderer/core/commerceFlightReadonlyStubAdapter.js";
  const adapter = readText(adapterPath);
  if (!adapter) {
    results.push({ name: "apps/desktop flight readonly stub adapter version", pass: false, detail: adapterPath + " missing" });
    return;
  }
  if (adapter.__readError) {
    results.push({ name: "apps/desktop flight readonly stub adapter version", pass: false, detail: adapter.__readError });
    return;
  }
  const match = adapter.match(/ADAPTER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop flight readonly stub adapter version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceFlightReadonlyStubAdapter.js ADAPTER_VERSION"
  );
}

function checkFlightSandboxDryRunVersion(results, expectedVersion) {
  const sandboxPath = "apps/desktop/src/renderer/core/commerceFlightSandboxDryRun.js";
  const sandbox = readText(sandboxPath);
  if (!sandbox) {
    results.push({ name: "apps/desktop flight sandbox dry run version", pass: false, detail: sandboxPath + " missing" });
    return;
  }
  if (sandbox.__readError) {
    results.push({ name: "apps/desktop flight sandbox dry run version", pass: false, detail: sandbox.__readError });
    return;
  }
  const match = sandbox.match(/SANDBOX_DRY_RUN_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop flight sandbox dry run version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceFlightSandboxDryRun.js SANDBOX_DRY_RUN_VERSION"
  );
}


function checkFlightSandboxProviderMatrixVersion(results, expectedVersion) {
  const matrixPath = "apps/desktop/src/renderer/core/commerceFlightSandboxProviderMatrix.js";
  const matrix = readText(matrixPath);
  if (!matrix) {
    results.push({ name: "apps/desktop flight sandbox provider matrix version", pass: false, detail: matrixPath + " missing" });
    return;
  }
  if (matrix.__readError) {
    results.push({ name: "apps/desktop flight sandbox provider matrix version", pass: false, detail: matrix.__readError });
    return;
  }
  const match = matrix.match(/MATRIX_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop flight sandbox provider matrix version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceFlightSandboxProviderMatrix.js MATRIX_VERSION"
  );
}

function checkSecureKeyStoragePlanVersion(results, expectedVersion) {
  const planPath = "apps/desktop/src/renderer/core/commerceSecureKeyStoragePlan.js";
  const plan = readText(planPath);
  if (!plan) {
    results.push({ name: "apps/desktop secure key storage plan version", pass: false, detail: planPath + " missing" });
    return;
  }
  if (plan.__readError) {
    results.push({ name: "apps/desktop secure key storage plan version", pass: false, detail: plan.__readError });
    return;
  }
  const match = plan.match(/SECURE_KEY_STORAGE_PLAN_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop secure key storage plan version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceSecureKeyStoragePlan.js SECURE_KEY_STORAGE_PLAN_VERSION"
  );
}

function checkSecureStorageDesignGateVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/commerceSecureStorageDesignGate.js";
  const gate = readText(gatePath);
  if (!gate) {
    results.push({ name: "apps/desktop secure storage design gate version", pass: false, detail: gatePath + " missing" });
    return;
  }
  if (gate.__readError) {
    results.push({ name: "apps/desktop secure storage design gate version", pass: false, detail: gate.__readError });
    return;
  }
  const match = gate.match(/GATE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop secure storage design gate version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceSecureStorageDesignGate.js GATE_VERSION"
  );
}

function checkLocalSecureStorageInterfaceDraftVersion(results, expectedVersion) {
  const draftPath = "apps/desktop/src/renderer/core/commerceLocalSecureStorageInterfaceDraft.js";
  const draft = readText(draftPath);
  if (!draft) {
    results.push({ name: "apps/desktop local secure storage interface draft version", pass: false, detail: draftPath + " missing" });
    return;
  }
  if (draft.__readError) {
    results.push({ name: "apps/desktop local secure storage interface draft version", pass: false, detail: draft.__readError });
    return;
  }
  const match = draft.match(/DRAFT_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop local secure storage interface draft version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceLocalSecureStorageInterfaceDraft.js DRAFT_VERSION"
  );
}

function checkGlobalProcurementQuickSummaryVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/globalProcurementQuickSummary.js";
  const file = readText(filePath);
  if (!file) {
    results.push({ name: "apps/desktop global procurement quick summary version", pass: false, detail: filePath + " missing" });
    return;
  }
  if (file.__readError) {
    results.push({ name: "apps/desktop global procurement quick summary version", pass: false, detail: file.__readError });
    return;
  }
  const match = file.match(/GLOBAL_PROCUREMENT_QUICK_SUMMARY_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop global procurement quick summary version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/globalProcurementQuickSummary.js GLOBAL_PROCUREMENT_QUICK_SUMMARY_VERSION"
  );
}

function checkGlobalProcurementUserFacingResultCardsVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/globalProcurementUserFacingResultCards.js";
  const file = readText(filePath);
  if (!file) {
    results.push({ name: "apps/desktop global procurement user-facing result cards version", pass: false, detail: filePath + " missing" });
    return;
  }
  if (file.__readError) {
    results.push({ name: "apps/desktop global procurement user-facing result cards version", pass: false, detail: file.__readError });
    return;
  }
  const match = file.match(/GLOBAL_PROCUREMENT_USER_FACING_RESULT_CARDS_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop global procurement user-facing result cards version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/globalProcurementUserFacingResultCards.js GLOBAL_PROCUREMENT_USER_FACING_RESULT_CARDS_VERSION"
  );
}

function checkGlobalProcurementDecisionWorkspaceVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/commerceGlobalProcurementDecisionWorkspace.js";
  const file = readText(filePath);
  if (!file) {
    results.push({ name: "apps/desktop global procurement decision workspace version", pass: false, detail: filePath + " missing" });
    return;
  }
  if (file.__readError) {
    results.push({ name: "apps/desktop global procurement decision workspace version", pass: false, detail: file.__readError });
    return;
  }
  const match = file.match(/DECISION_WORKSPACE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop global procurement decision workspace version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceGlobalProcurementDecisionWorkspace.js DECISION_WORKSPACE_VERSION"
  );
}

function checkUserApiPriorityPolicyVersion(results, expectedVersion) {
  const policyPath = "apps/desktop/src/renderer/core/commerceUserApiPriorityPolicy.js";
  const policy = readText(policyPath);
  if (!policy) {
    results.push({ name: "apps/desktop user API priority policy version", pass: false, detail: policyPath + " missing" });
    return;
  }
  if (policy.__readError) {
    results.push({ name: "apps/desktop user API priority policy version", pass: false, detail: policy.__readError });
    return;
  }
  const match = policy.match(/POLICY_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop user API priority policy version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceUserApiPriorityPolicy.js POLICY_VERSION"
  );
}

function checkApiBindingSafeShellVersion(results, expectedVersion) {
  const shellPath = "apps/desktop/src/renderer/core/commerceApiBindingSafeShell.js";
  const shell = readText(shellPath);
  if (!shell) {
    results.push({ name: "apps/desktop API binding safe shell version", pass: false, detail: shellPath + " missing" });
    return;
  }
  if (shell.__readError) {
    results.push({ name: "apps/desktop API binding safe shell version", pass: false, detail: shell.__readError });
    return;
  }
  const match = shell.match(/SHELL_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop API binding safe shell version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceApiBindingSafeShell.js SHELL_VERSION"
  );
}

function checkUserApiProviderCatalogVersion(results, expectedVersion) {
  const catalogPath = "apps/desktop/src/renderer/core/commerceUserApiProviderCatalog.js";
  const catalog = readText(catalogPath);
  if (!catalog) {
    results.push({ name: "apps/desktop user API provider catalog version", pass: false, detail: catalogPath + " missing" });
    return;
  }
  if (catalog.__readError) {
    results.push({ name: "apps/desktop user API provider catalog version", pass: false, detail: catalog.__readError });
    return;
  }
  const match = catalog.match(/CATALOG_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop user API provider catalog version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceUserApiProviderCatalog.js CATALOG_VERSION"
  );
}

function checkApiBindingMockFormVersion(results, expectedVersion) {
  const formPath = "apps/desktop/src/renderer/core/commerceApiBindingMockForm.js";
  const form = readText(formPath);
  if (!form) {
    results.push({ name: "apps/desktop API binding mock form version", pass: false, detail: formPath + " missing" });
    return;
  }
  if (form.__readError) {
    results.push({ name: "apps/desktop API binding mock form version", pass: false, detail: form.__readError });
    return;
  }
  const match = form.match(/FORM_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop API binding mock form version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceApiBindingMockForm.js FORM_VERSION"
  );
}

function checkApiBindingPermissionChecklistVersion(results, expectedVersion) {
  const checklistPath = "apps/desktop/src/renderer/core/commerceApiBindingPermissionChecklist.js";
  const checklist = readText(checklistPath);
  if (!checklist) {
    results.push({ name: "apps/desktop API binding permission checklist version", pass: false, detail: checklistPath + " missing" });
    return;
  }
  if (checklist.__readError) {
    results.push({ name: "apps/desktop API binding permission checklist version", pass: false, detail: checklist.__readError });
    return;
  }
  const match = checklist.match(/CHECKLIST_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop API binding permission checklist version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceApiBindingPermissionChecklist.js CHECKLIST_VERSION"
  );
}

function checkApiBindingReadinessStatusVersion(results, expectedVersion) {
  const readinessPath = "apps/desktop/src/renderer/core/commerceApiBindingReadinessStatus.js";
  const readiness = readText(readinessPath);
  if (!readiness) {
    results.push({ name: "apps/desktop API binding readiness status version", pass: false, detail: readinessPath + " missing" });
    return;
  }
  if (readiness.__readError) {
    results.push({ name: "apps/desktop API binding readiness status version", pass: false, detail: readiness.__readError });
    return;
  }
  const match = readiness.match(/READINESS_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop API binding readiness status version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceApiBindingReadinessStatus.js READINESS_VERSION"
  );
}

function checkKeyRedactionAndLogLeakRulesVersion(results, expectedVersion) {
  const rulesPath = "apps/desktop/src/renderer/core/commerceKeyRedactionAndLogLeakRules.js";
  const rules = readText(rulesPath);
  if (!rules) {
    results.push({ name: "apps/desktop key redaction and log leak rules version", pass: false, detail: rulesPath + " missing" });
    return;
  }
  if (rules.__readError) {
    results.push({ name: "apps/desktop key redaction and log leak rules version", pass: false, detail: rules.__readError });
    return;
  }
  const match = rules.match(/RULES_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop key redaction and log leak rules version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceKeyRedactionAndLogLeakRules.js RULES_VERSION"
  );
}

function checkKeyLifecycleDraftVersion(results, expectedVersion) {
  const lifecyclePath = "apps/desktop/src/renderer/core/commerceKeyLifecycleDraft.js";
  const lifecycle = readText(lifecyclePath);
  if (!lifecycle) {
    results.push({ name: "apps/desktop key lifecycle draft version", pass: false, detail: lifecyclePath + " missing" });
    return;
  }
  if (lifecycle.__readError) {
    results.push({ name: "apps/desktop key lifecycle draft version", pass: false, detail: lifecycle.__readError });
    return;
  }
  const match = lifecycle.match(/LIFECYCLE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop key lifecycle draft version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceKeyLifecycleDraft.js LIFECYCLE_VERSION"
  );
}

function checkProviderEndpointAllowlistGateVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/commerceProviderEndpointAllowlistGate.js";
  const gate = readText(gatePath);
  if (!gate) {
    results.push({ name: "apps/desktop provider endpoint allowlist gate version", pass: false, detail: gatePath + " missing" });
    return;
  }
  if (gate.__readError) {
    results.push({ name: "apps/desktop provider endpoint allowlist gate version", pass: false, detail: gate.__readError });
    return;
  }
  const match = gate.match(/ALLOWLIST_GATE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop provider endpoint allowlist gate version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceProviderEndpointAllowlistGate.js ALLOWLIST_GATE_VERSION"
  );
}

function checkReadonlyProviderSandboxGateVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/commerceReadonlyProviderSandboxGate.js";
  const gate = readText(gatePath);
  if (!gate) {
    results.push({ name: "apps/desktop readonly provider sandbox gate version", pass: false, detail: gatePath + " missing" });
    return;
  }
  if (gate.__readError) {
    results.push({ name: "apps/desktop readonly provider sandbox gate version", pass: false, detail: gate.__readError });
    return;
  }
  const match = gate.match(/READONLY_PROVIDER_SANDBOX_GATE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop readonly provider sandbox gate version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceReadonlyProviderSandboxGate.js READONLY_PROVIDER_SANDBOX_GATE_VERSION"
  );
}

function checkPackagePair(results, label, packagePath, lockPath, options = {}) {
  const pkg = readJson(packagePath);
  const lock = readJson(lockPath);

  if (!pkg) {
    results.push({ name: `${label} package`, pass: false, detail: `${packagePath} missing` });
    return;
  }
  if (!lock) {
    results.push({ name: `${label} lock`, pass: false, detail: `${lockPath} missing` });
    return;
  }
  if (pkg.__readError || lock.__readError) {
    results.push({
      name: `${label} json parse`,
      pass: false,
      detail: pkg.__readError || lock.__readError
    });
    return;
  }

  addCheck(results, `${label} package-lock version`, pkg.version, lock.version, `${packagePath} must match ${lockPath}`);

  if (options.checkRootPackageEntry && lock.packages && lock.packages[""]) {
    addCheck(
      results,
      `${label} package-lock packages[\"\"].version`,
      pkg.version,
      lock.packages[""].version,
      `${packagePath} must match ${lockPath} packages[""].version`
    );
  }
}


function checkReadonlyProviderResultSchemaGateVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/commerceReadonlyProviderResultSchemaGate.js";
  const gate = readText(gatePath);
  if (!gate) {
    results.push({ name: "apps/desktop readonly provider result schema gate version", pass: false, detail: gatePath + " missing" });
    return;
  }
  if (gate.__readError) {
    results.push({ name: "apps/desktop readonly provider result schema gate version", pass: false, detail: gate.__readError });
    return;
  }
  const match = gate.match(/READONLY_PROVIDER_RESULT_SCHEMA_GATE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop readonly provider result schema gate version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceReadonlyProviderResultSchemaGate.js READONLY_PROVIDER_RESULT_SCHEMA_GATE_VERSION"
  );
}

function checkProviderResultSourceLabelGateVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/commerceProviderResultSourceLabelGate.js";
  const gate = readText(gatePath);
  if (!gate) {
    results.push({ name: "apps/desktop provider result source label gate version", pass: false, detail: gatePath + " missing" });
    return;
  }
  if (gate.__readError) {
    results.push({ name: "apps/desktop provider result source label gate version", pass: false, detail: gate.__readError });
    return;
  }
  const match = gate.match(/PROVIDER_RESULT_SOURCE_LABEL_GATE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop provider result source label gate version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceProviderResultSourceLabelGate.js PROVIDER_RESULT_SOURCE_LABEL_GATE_VERSION"
  );
}

function checkPriceIntegrityTaxesFeesGateVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/commercePriceIntegrityTaxesFeesGate.js";
  const gate = readText(gatePath);
  if (!gate) {
    results.push({ name: "apps/desktop price integrity taxes fees gate version", pass: false, detail: gatePath + " missing" });
    return;
  }
  if (gate.__readError) {
    results.push({ name: "apps/desktop price integrity taxes fees gate version", pass: false, detail: gate.__readError });
    return;
  }
  const match = gate.match(/PRICE_INTEGRITY_TAXES_FEES_GATE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop price integrity taxes fees gate version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commercePriceIntegrityTaxesFeesGate.js PRICE_INTEGRITY_TAXES_FEES_GATE_VERSION"
  );
}

function checkPriceIntegrityTaxesFeesGateV1Version(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/priceIntegrityTaxesFeesGate.js";
  const gate = readText(gatePath);
  if (!gate) {
    results.push({ name: "apps/desktop price integrity taxes fees gate v1 version", pass: false, detail: gatePath + " missing" });
    return;
  }
  if (gate.__readError) {
    results.push({ name: "apps/desktop price integrity taxes fees gate v1 version", pass: false, detail: gate.__readError });
    return;
  }
  const match = gate.match(/PRICE_INTEGRITY_TAXES_FEES_GATE_V1_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop price integrity taxes fees gate v1 version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/priceIntegrityTaxesFeesGate.js PRICE_INTEGRITY_TAXES_FEES_GATE_V1_VERSION"
  );
}

function checkRealPriceDisplayGateVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/realPriceDisplayGate.js";
  const gate = readText(gatePath);
  if (!gate) {
    results.push({ name: "apps/desktop real price display gate version", pass: false, detail: gatePath + " missing" });
    return;
  }
  if (gate.__readError) {
    results.push({ name: "apps/desktop real price display gate version", pass: false, detail: gate.__readError });
    return;
  }
  const match = gate.match(/REAL_PRICE_DISPLAY_GATE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop real price display gate version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/realPriceDisplayGate.js REAL_PRICE_DISPLAY_GATE_VERSION"
  );
}

function checkBookingUrlDomainSafetyGateVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/commerceBookingUrlDomainSafetyGate.js";
  const gate = readText(gatePath);
  if (!gate) {
    results.push({ name: "apps/desktop bookingUrl domain safety gate version", pass: false, detail: gatePath + " missing" });
    return;
  }
  if (gate.__readError) {
    results.push({ name: "apps/desktop bookingUrl domain safety gate version", pass: false, detail: gate.__readError });
    return;
  }
  const match = gate.match(/BOOKING_URL_DOMAIN_SAFETY_GATE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop bookingUrl domain safety gate version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceBookingUrlDomainSafetyGate.js BOOKING_URL_DOMAIN_SAFETY_GATE_VERSION"
  );
}

function checkManualProviderReviewWorkflowVersion(results, expectedVersion) {
  const workflowPath = "apps/desktop/src/renderer/core/commerceManualProviderReviewWorkflow.js";
  const workflow = readText(workflowPath);
  if (!workflow) {
    results.push({ name: "apps/desktop manual provider review workflow version", pass: false, detail: workflowPath + " missing" });
    return;
  }
  if (workflow.__readError) {
    results.push({ name: "apps/desktop manual provider review workflow version", pass: false, detail: workflow.__readError });
    return;
  }
  const match = workflow.match(/MANUAL_PROVIDER_REVIEW_WORKFLOW_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop manual provider review workflow version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceManualProviderReviewWorkflow.js MANUAL_PROVIDER_REVIEW_WORKFLOW_VERSION"
  );
}

function checkManualProviderReviewWorkflowV1Version(results, expectedVersion) {
  const workflowPath = "apps/desktop/src/renderer/core/manualProviderReviewWorkflowV1.js";
  const workflow = readText(workflowPath);
  if (!workflow) {
    results.push({ name: "apps/desktop manual provider review workflow v1 version", pass: false, detail: workflowPath + " missing" });
    return;
  }
  if (workflow.__readError) {
    results.push({ name: "apps/desktop manual provider review workflow v1 version", pass: false, detail: workflow.__readError });
    return;
  }
  const match = workflow.match(/MANUAL_PROVIDER_REVIEW_WORKFLOW_V1_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop manual provider review workflow v1 version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/manualProviderReviewWorkflowV1.js MANUAL_PROVIDER_REVIEW_WORKFLOW_V1_VERSION"
  );
}

function checkLimitedRealPriceUiBetaGateVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/limitedRealPriceUiBetaGate.js";
  const gate = readText(gatePath);
  if (!gate) {
    results.push({ name: "apps/desktop limited real price UI beta gate version", pass: false, detail: gatePath + " missing" });
    return;
  }
  if (gate.__readError) {
    results.push({ name: "apps/desktop limited real price UI beta gate version", pass: false, detail: gate.__readError });
    return;
  }
  const match = gate.match(/LIMITED_REAL_PRICE_UI_BETA_GATE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop limited real price UI beta gate version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/limitedRealPriceUiBetaGate.js LIMITED_REAL_PRICE_UI_BETA_GATE_VERSION"
  );
}

function checkLimitedBetaKillSwitchVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/limitedBetaKillSwitch.js";
  const gate = readText(gatePath);
  if (!gate) {
    results.push({ name: "apps/desktop limited beta kill switch version", pass: false, detail: gatePath + " missing" });
    return;
  }
  if (gate.__readError) {
    results.push({ name: "apps/desktop limited beta kill switch version", pass: false, detail: gate.__readError });
    return;
  }
  const match = gate.match(/LIMITED_BETA_KILL_SWITCH_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop limited beta kill switch version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/limitedBetaKillSwitch.js LIMITED_BETA_KILL_SWITCH_VERSION"
  );
}

function checkLimitedBetaRollbackGuardVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/limitedBetaRollbackGuard.js";
  const gate = readText(gatePath);
  if (!gate) {
    results.push({ name: "apps/desktop limited beta rollback guard version", pass: false, detail: gatePath + " missing" });
    return;
  }
  if (gate.__readError) {
    results.push({ name: "apps/desktop limited beta rollback guard version", pass: false, detail: gate.__readError });
    return;
  }
  const match = gate.match(/LIMITED_BETA_ROLLBACK_GUARD_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop limited beta rollback guard version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/limitedBetaRollbackGuard.js LIMITED_BETA_ROLLBACK_GUARD_VERSION"
  );
}

function checkManualBookingHandoffVersion(results, expectedVersion) {
  const handoffPath = "apps/desktop/src/renderer/core/manualBookingHandoff.js";
  const handoff = readText(handoffPath);
  if (!handoff) {
    results.push({ name: "apps/desktop manual booking handoff version", pass: false, detail: handoffPath + " missing" });
    return;
  }
  if (handoff.__readError) {
    results.push({ name: "apps/desktop manual booking handoff version", pass: false, detail: handoff.__readError });
    return;
  }
  const match = handoff.match(/MANUAL_BOOKING_HANDOFF_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop manual booking handoff version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/manualBookingHandoff.js MANUAL_BOOKING_HANDOFF_VERSION"
  );
}

function checkProviderActivationReadinessGateVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/commerceProviderActivationReadinessGate.js";
  const gate = readText(gatePath);
  if (!gate) {
    results.push({ name: "apps/desktop provider activation readiness gate version", pass: false, detail: gatePath + " missing" });
    return;
  }
  if (gate.__readError) {
    results.push({ name: "apps/desktop provider activation readiness gate version", pass: false, detail: gate.__readError });
    return;
  }
  const match = gate.match(/PROVIDER_ACTIVATION_READINESS_GATE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop provider activation readiness gate version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceProviderActivationReadinessGate.js PROVIDER_ACTIVATION_READINESS_GATE_VERSION"
  );
}

function checkCredentialConsentScopeGateVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/commerceCredentialConsentScopeGate.js";
  const gate = readText(gatePath);
  if (!gate) {
    results.push({ name: "apps/desktop credential consent scope gate version", pass: false, detail: gatePath + " missing" });
    return;
  }
  if (gate.__readError) {
    results.push({ name: "apps/desktop credential consent scope gate version", pass: false, detail: gate.__readError });
    return;
  }
  const match = gate.match(/CREDENTIAL_CONSENT_SCOPE_GATE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop credential consent scope gate version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceCredentialConsentScopeGate.js CREDENTIAL_CONSENT_SCOPE_GATE_VERSION"
  );
}

function checkCredentialConsentScopeGateCoreVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/credentialConsentScopeGate.js";
  const gate = readText(gatePath);
  if (!gate) {
    results.push({ name: "apps/desktop credential consent scope gate core version", pass: false, detail: gatePath + " missing" });
    return;
  }
  if (gate.__readError) {
    results.push({ name: "apps/desktop credential consent scope gate core version", pass: false, detail: gate.__readError });
    return;
  }
  const match = gate.match(/CREDENTIAL_CONSENT_SCOPE_GATE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop credential consent scope gate core version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/credentialConsentScopeGate.js CREDENTIAL_CONSENT_SCOPE_GATE_VERSION"
  );
}

function checkReadonlyAdapterContractGateVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/commerceReadonlyAdapterContractGate.js";
  const gate = readText(gatePath);
  if (!gate) {
    results.push({ name: "apps/desktop read-only adapter contract gate version", pass: false, detail: gatePath + " missing" });
    return;
  }
  if (gate.__readError) {
    results.push({ name: "apps/desktop read-only adapter contract gate version", pass: false, detail: gate.__readError });
    return;
  }
  const match = gate.match(/READONLY_ADAPTER_CONTRACT_GATE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop read-only adapter contract gate version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceReadonlyAdapterContractGate.js READONLY_ADAPTER_CONTRACT_GATE_VERSION"
  );
}

function checkReadOnlyProviderAdapterContractVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/readOnlyProviderAdapterContract.js";
  const gate = readText(gatePath);
  if (!gate) {
    results.push({ name: "apps/desktop read-only provider adapter contract version", pass: false, detail: gatePath + " missing" });
    return;
  }
  if (gate.__readError) {
    results.push({ name: "apps/desktop read-only provider adapter contract version", pass: false, detail: gate.__readError });
    return;
  }
  const match = gate.match(/READ_ONLY_PROVIDER_ADAPTER_CONTRACT_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop read-only provider adapter contract version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/readOnlyProviderAdapterContract.js READ_ONLY_PROVIDER_ADAPTER_CONTRACT_VERSION"
  );
}

function checkFlightReadOnlyProviderAdapterV1Version(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/adapters/flightReadOnlyProviderAdapterV1.js";
  const gate = readText(gatePath);
  if (!gate) {
    results.push({ name: "apps/desktop flight read-only provider adapter v1 version", pass: false, detail: gatePath + " missing" });
    return;
  }
  if (gate.__readError) {
    results.push({ name: "apps/desktop flight read-only provider adapter v1 version", pass: false, detail: gate.__readError });
    return;
  }
  const match = gate.match(/FLIGHT_READONLY_PROVIDER_ADAPTER_V1_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop flight read-only provider adapter v1 version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/adapters/flightReadOnlyProviderAdapterV1.js FLIGHT_READONLY_PROVIDER_ADAPTER_V1_VERSION"
  );
}


function checkProviderEndpointAllowlistEnforcementVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/providerEndpointAllowlistEnforcement.js";
  const gate = readText(gatePath);
  if (!gate) { results.push({ name:"apps/desktop provider endpoint allowlist enforcement version", pass:false, detail:gatePath + " missing" }); return; }
  if (gate.__readError) { results.push({ name:"apps/desktop provider endpoint allowlist enforcement version", pass:false, detail:gate.__readError }); return; }
  const match = gate.match(/PROVIDER_ENDPOINT_ALLOWLIST_ENFORCEMENT_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop provider endpoint allowlist enforcement version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/providerEndpointAllowlistEnforcement.js PROVIDER_ENDPOINT_ALLOWLIST_ENFORCEMENT_VERSION");
}

function checkProviderSandboxRealKeyDryRunGateVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/providerSandboxRealKeyDryRunGate.js";
  const gate = readText(gatePath);
  if (!gate) { results.push({ name:"apps/desktop provider sandbox real-key dry run gate version", pass:false, detail:gatePath + " missing" }); return; }
  if (gate.__readError) { results.push({ name:"apps/desktop provider sandbox real-key dry run gate version", pass:false, detail:gate.__readError }); return; }
  const match = gate.match(/PROVIDER_SANDBOX_REAL_KEY_DRY_RUN_GATE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop provider sandbox real-key dry run gate version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/providerSandboxRealKeyDryRunGate.js PROVIDER_SANDBOX_REAL_KEY_DRY_RUN_GATE_VERSION");
}

function checkProviderSandboxResponseSchemaGateVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/providerSandboxResponseSchemaGate.js";
  const gate = readText(gatePath);
  if (!gate) { results.push({ name:"apps/desktop provider sandbox response schema gate version", pass:false, detail:gatePath + " missing" }); return; }
  if (gate.__readError) { results.push({ name:"apps/desktop provider sandbox response schema gate version", pass:false, detail:gate.__readError }); return; }
  const match = gate.match(/PROVIDER_SANDBOX_RESPONSE_SCHEMA_GATE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop provider sandbox response schema gate version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/providerSandboxResponseSchemaGate.js PROVIDER_SANDBOX_RESPONSE_SCHEMA_GATE_VERSION");
}

function checkRealProviderResultSchemaValidationVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/realProviderResultSchemaValidation.js";
  const gate = readText(gatePath);
  if (!gate) { results.push({ name:"apps/desktop real provider result schema validation version", pass:false, detail:gatePath + " missing" }); return; }
  if (gate.__readError) { results.push({ name:"apps/desktop real provider result schema validation version", pass:false, detail:gate.__readError }); return; }
  const match = gate.match(/REAL_PROVIDER_RESULT_SCHEMA_VALIDATION_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop real provider result schema validation version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/realProviderResultSchemaValidation.js REAL_PROVIDER_RESULT_SCHEMA_VALIDATION_VERSION");
}

function checkProviderResultSourceLabelGateV2128Version(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/providerResultSourceLabelGate.js";
  const gate = readText(gatePath);
  if (!gate) { results.push({ name:"apps/desktop provider result source label gate v2.1.31 version", pass:false, detail:gatePath + " missing" }); return; }
  if (gate.__readError) { results.push({ name:"apps/desktop provider result source label gate v2.1.31 version", pass:false, detail:gate.__readError }); return; }
  const match = gate.match(/PROVIDER_RESULT_SOURCE_LABEL_GATE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop provider result source label gate v2.1.31 version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/providerResultSourceLabelGate.js PROVIDER_RESULT_SOURCE_LABEL_GATE_VERSION");
}

function checkProviderGateMatrixDashboardVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/commerceProviderGateMatrixDashboard.js";
  const gate = readText(gatePath);
  if (!gate) { results.push({ name:"apps/desktop provider gate matrix dashboard version", pass:false, detail:gatePath + " missing" }); return; }
  if (gate.__readError) { results.push({ name:"apps/desktop provider gate matrix dashboard version", pass:false, detail:gate.__readError }); return; }
  const match = gate.match(/PROVIDER_GATE_MATRIX_DASHBOARD_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop provider gate matrix dashboard version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/commerceProviderGateMatrixDashboard.js PROVIDER_GATE_MATRIX_DASHBOARD_VERSION");
}

function checkProviderNoNetworkRuntimeGuardVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/commerceProviderNoNetworkRuntimeGuard.js";
  const gate = readText(gatePath);
  if (!gate) { results.push({ name:"apps/desktop provider no-network runtime guard version", pass:false, detail:gatePath + " missing" }); return; }
  if (gate.__readError) { results.push({ name:"apps/desktop provider no-network runtime guard version", pass:false, detail:gate.__readError }); return; }
  const match = gate.match(/PROVIDER_NO_NETWORK_RUNTIME_GUARD_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop provider no-network runtime guard version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/commerceProviderNoNetworkRuntimeGuard.js PROVIDER_NO_NETWORK_RUNTIME_GUARD_VERSION");
}

function checkOfflineProviderFixtureValidationHarnessVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/commerceOfflineProviderFixtureValidationHarness.js";
  const gate = readText(gatePath);
  if (!gate) { results.push({ name:"apps/desktop offline provider fixture validation harness version", pass:false, detail:gatePath + " missing" }); return; }
  if (gate.__readError) { results.push({ name:"apps/desktop offline provider fixture validation harness version", pass:false, detail:gate.__readError }); return; }
  const match = gate.match(/OFFLINE_PROVIDER_FIXTURE_VALIDATION_HARNESS_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop offline provider fixture validation harness version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/commerceOfflineProviderFixtureValidationHarness.js OFFLINE_PROVIDER_FIXTURE_VALIDATION_HARNESS_VERSION");
}

function checkProviderComplianceDecisionEngineVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/commerceProviderComplianceDecisionEngine.js";
  const gate = readText(gatePath);
  if (!gate) { results.push({ name:"apps/desktop provider compliance decision engine version", pass:false, detail:gatePath + " missing" }); return; }
  if (gate.__readError) { results.push({ name:"apps/desktop provider compliance decision engine version", pass:false, detail:gate.__readError }); return; }
  const match = gate.match(/PROVIDER_COMPLIANCE_DECISION_ENGINE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop provider compliance decision engine version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/commerceProviderComplianceDecisionEngine.js PROVIDER_COMPLIANCE_DECISION_ENGINE_VERSION");
}

function checkOfflineProviderFixtureRunnerVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/commerceOfflineProviderFixtureRunner.js";
  const gate = readText(gatePath);
  if (!gate) { results.push({ name:"apps/desktop offline provider fixture runner version", pass:false, detail:gatePath + " missing" }); return; }
  if (gate.__readError) { results.push({ name:"apps/desktop offline provider fixture runner version", pass:false, detail:gate.__readError }); return; }
  const match = gate.match(/OFFLINE_PROVIDER_FIXTURE_RUNNER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop offline provider fixture runner version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/commerceOfflineProviderFixtureRunner.js OFFLINE_PROVIDER_FIXTURE_RUNNER_VERSION");
}

function checkNoNetworkSentinelAuditVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/commerceNoNetworkSentinelAudit.js";
  const gate = readText(gatePath);
  if (!gate) { results.push({ name:"apps/desktop no-network sentinel audit version", pass:false, detail:gatePath + " missing" }); return; }
  if (gate.__readError) { results.push({ name:"apps/desktop no-network sentinel audit version", pass:false, detail:gate.__readError }); return; }
  const match = gate.match(/NO_NETWORK_SENTINEL_AUDIT_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop no-network sentinel audit version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/commerceNoNetworkSentinelAudit.js NO_NETWORK_SENTINEL_AUDIT_VERSION");
}

function checkProviderComplianceEvidenceReportVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/commerceProviderComplianceEvidenceReport.js";
  const gate = readText(gatePath);
  if (!gate) { results.push({ name:"apps/desktop provider compliance evidence report version", pass:false, detail:gatePath + " missing" }); return; }
  if (gate.__readError) { results.push({ name:"apps/desktop provider compliance evidence report version", pass:false, detail:gate.__readError }); return; }
  const match = gate.match(/PROVIDER_COMPLIANCE_EVIDENCE_REPORT_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop provider compliance evidence report version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/commerceProviderComplianceEvidenceReport.js PROVIDER_COMPLIANCE_EVIDENCE_REPORT_VERSION");
}

function checkLocalSafetyEvidenceConsoleVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/commerceLocalSafetyEvidenceConsole.js";
  const gate = readText(gatePath);
  if (!gate) { results.push({ name:"apps/desktop local safety evidence console version", pass:false, detail:gatePath + " missing" }); return; }
  if (gate.__readError) { results.push({ name:"apps/desktop local safety evidence console version", pass:false, detail:gate.__readError }); return; }
  const match = gate.match(/LOCAL_SAFETY_EVIDENCE_CONSOLE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop local safety evidence console version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/commerceLocalSafetyEvidenceConsole.js LOCAL_SAFETY_EVIDENCE_CONSOLE_VERSION");
}

function checkManualUiAcceptanceAssistantVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/commerceManualUiAcceptanceAssistant.js";
  const gate = readText(gatePath);
  if (!gate) { results.push({ name:"apps/desktop manual UI acceptance assistant version", pass:false, detail:gatePath + " missing" }); return; }
  if (gate.__readError) { results.push({ name:"apps/desktop manual UI acceptance assistant version", pass:false, detail:gate.__readError }); return; }
  const match = gate.match(/MANUAL_UI_ACCEPTANCE_ASSISTANT_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop manual UI acceptance assistant version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/commerceManualUiAcceptanceAssistant.js MANUAL_UI_ACCEPTANCE_ASSISTANT_VERSION");
}

function checkNoSecretPersistenceGuardVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/commerceNoSecretPersistenceGuard.js";
  const gate = readText(gatePath);
  if (!gate) { results.push({ name:"apps/desktop no-secret persistence guard version", pass:false, detail:gatePath + " missing" }); return; }
  if (gate.__readError) { results.push({ name:"apps/desktop no-secret persistence guard version", pass:false, detail:gate.__readError }); return; }
  const match = gate.match(/NO_SECRET_PERSISTENCE_GUARD_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop no-secret persistence guard version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/commerceNoSecretPersistenceGuard.js NO_SECRET_PERSISTENCE_GUARD_VERSION");
}

function checkSettingsAuthLocalSecurityEvidenceVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/modules/account/settingsAuthLocalSecurityEvidence.js";
  const gate = readText(gatePath);
  if (!gate) { results.push({ name:"apps/desktop settings auth local security evidence version", pass:false, detail:gatePath + " missing" }); return; }
  if (gate.__readError) { results.push({ name:"apps/desktop settings auth local security evidence version", pass:false, detail:gate.__readError }); return; }
  const match = gate.match(/SETTINGS_AUTH_LOCAL_SECURITY_EVIDENCE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop settings auth local security evidence version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/modules/account/settingsAuthLocalSecurityEvidence.js SETTINGS_AUTH_LOCAL_SECURITY_EVIDENCE_VERSION");
}

function checkProviderConnectionReadinessConsoleVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/providerConnectionReadinessConsole.js";
  const gate = readText(gatePath);
  if (!gate) { results.push({ name:"apps/desktop provider connection readiness console version", pass:false, detail:gatePath + " missing" }); return; }
  if (gate.__readError) { results.push({ name:"apps/desktop provider connection readiness console version", pass:false, detail:gate.__readError }); return; }
  const match = gate.match(/PROVIDER_CONNECTION_READINESS_CONSOLE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop provider connection readiness console version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/providerConnectionReadinessConsole.js PROVIDER_CONNECTION_READINESS_CONSOLE_VERSION");
}

function checkProviderConnectionReadinessDecisionEngineVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/providerConnectionReadinessDecisionEngine.js";
  const gate = readText(gatePath);
  if (!gate) { results.push({ name:"apps/desktop provider connection readiness decision engine version", pass:false, detail:gatePath + " missing" }); return; }
  if (gate.__readError) { results.push({ name:"apps/desktop provider connection readiness decision engine version", pass:false, detail:gate.__readError }); return; }
  const match = gate.match(/PROVIDER_CONNECTION_READINESS_DECISION_ENGINE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop provider connection readiness decision engine version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/providerConnectionReadinessDecisionEngine.js PROVIDER_CONNECTION_READINESS_DECISION_ENGINE_VERSION");
}


function checkSecureApiKeyStorageMainVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/main/secureApiKeyStorage.js";
  const file = readText(filePath);
  if (!file) {
    results.push({ name: "apps/desktop secure API key storage main version", pass: false, detail: filePath + " missing" });
    return;
  }
  if (file.__readError) {
    results.push({ name: "apps/desktop secure API key storage main version", pass: false, detail: file.__readError });
    return;
  }
  const match = file.match(/SECURE_API_KEY_STORAGE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop secure API key storage main version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/main/secureApiKeyStorage.js SECURE_API_KEY_STORAGE_VERSION");
}

function checkSecureApiKeyStorageConsoleVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/commerceSecureApiKeyStorageConsole.js";
  const file = readText(filePath);
  if (!file) {
    results.push({ name: "apps/desktop secure API key storage console version", pass: false, detail: filePath + " missing" });
    return;
  }
  if (file.__readError) {
    results.push({ name: "apps/desktop secure API key storage console version", pass: false, detail: file.__readError });
    return;
  }
  const match = file.match(/SECURE_API_KEY_STORAGE_CONSOLE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop secure API key storage console version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/commerceSecureApiKeyStorageConsole.js SECURE_API_KEY_STORAGE_CONSOLE_VERSION");
}

function runVersionCheck() {
  const results = [];

  const rootPackage = readJson("package.json");

  checkPackagePair(results, "root", "package.json", "package-lock.json", { checkRootPackageEntry: true });
  checkPackagePair(results, "apps/desktop", "apps/desktop/package.json", "apps/desktop/package-lock.json");
  checkPackagePair(results, "apps/server", "apps/server/package.json", "apps/server/package-lock.json");

  if (rootPackage && !rootPackage.__readError) {
    checkRendererConfigVersion(results, rootPackage.version);
    checkFlightLowestOffersVersion(results, rootPackage.version);
    checkFlightProviderCandidatesVersion(results, rootPackage.version);
    checkFlightProviderApprovalVersion(results, rootPackage.version);
    checkFlightReadonlyStubPermissionVersion(results, rootPackage.version);
    checkFlightReadonlyStubAdapterVersion(results, rootPackage.version);
    checkFlightSandboxDryRunVersion(results, rootPackage.version);
    checkFlightSandboxProviderMatrixVersion(results, rootPackage.version);
    checkSecureKeyStoragePlanVersion(results, rootPackage.version);
    checkSecureStorageDesignGateVersion(results, rootPackage.version);
    checkLocalSecureStorageInterfaceDraftVersion(results, rootPackage.version);
    checkGlobalProcurementQuickSummaryVersion(results, rootPackage.version);
    checkGlobalProcurementUserFacingResultCardsVersion(results, rootPackage.version);
    checkGlobalProcurementDecisionWorkspaceVersion(results, rootPackage.version);
    checkUserApiPriorityPolicyVersion(results, rootPackage.version);
    checkApiBindingSafeShellVersion(results, rootPackage.version);
    checkUserApiProviderCatalogVersion(results, rootPackage.version);
    checkApiBindingMockFormVersion(results, rootPackage.version);
    checkApiBindingPermissionChecklistVersion(results, rootPackage.version);
    checkApiBindingReadinessStatusVersion(results, rootPackage.version);
    checkKeyRedactionAndLogLeakRulesVersion(results, rootPackage.version);
    checkKeyLifecycleDraftVersion(results, rootPackage.version);
    checkProviderEndpointAllowlistGateVersion(results, rootPackage.version);
    checkReadonlyProviderSandboxGateVersion(results, rootPackage.version);
    checkReadonlyProviderResultSchemaGateVersion(results, rootPackage.version);
    checkProviderResultSourceLabelGateVersion(results, rootPackage.version);
    checkPriceIntegrityTaxesFeesGateVersion(results, rootPackage.version);
    checkPriceIntegrityTaxesFeesGateV1Version(results, rootPackage.version);
    checkRealPriceDisplayGateVersion(results, rootPackage.version);
    checkBookingUrlDomainSafetyGateVersion(results, rootPackage.version);
    checkManualProviderReviewWorkflowVersion(results, rootPackage.version);
    checkManualProviderReviewWorkflowV1Version(results, rootPackage.version);
    checkLimitedRealPriceUiBetaGateVersion(results, rootPackage.version);
    checkLimitedBetaKillSwitchVersion(results, rootPackage.version);
    checkLimitedBetaRollbackGuardVersion(results, rootPackage.version);
    checkManualBookingHandoffVersion(results, rootPackage.version);
    checkProviderActivationReadinessGateVersion(results, rootPackage.version);
    checkCredentialConsentScopeGateVersion(results, rootPackage.version);
    checkCredentialConsentScopeGateCoreVersion(results, rootPackage.version);
    checkReadonlyAdapterContractGateVersion(results, rootPackage.version);
    checkReadOnlyProviderAdapterContractVersion(results, rootPackage.version);
    checkFlightReadOnlyProviderAdapterV1Version(results, rootPackage.version);
    checkProviderEndpointAllowlistEnforcementVersion(results, rootPackage.version);
    checkProviderSandboxRealKeyDryRunGateVersion(results, rootPackage.version);
    checkProviderSandboxResponseSchemaGateVersion(results, rootPackage.version);
    checkRealProviderResultSchemaValidationVersion(results, rootPackage.version);
    checkProviderResultSourceLabelGateV2128Version(results, rootPackage.version);
    checkProviderGateMatrixDashboardVersion(results, rootPackage.version);
    checkProviderNoNetworkRuntimeGuardVersion(results, rootPackage.version);
    checkOfflineProviderFixtureValidationHarnessVersion(results, rootPackage.version);
    checkProviderComplianceDecisionEngineVersion(results, rootPackage.version);
    checkOfflineProviderFixtureRunnerVersion(results, rootPackage.version);
    checkNoNetworkSentinelAuditVersion(results, rootPackage.version);
    checkProviderComplianceEvidenceReportVersion(results, rootPackage.version);
    checkLocalSafetyEvidenceConsoleVersion(results, rootPackage.version);
    checkManualUiAcceptanceAssistantVersion(results, rootPackage.version);
    checkNoSecretPersistenceGuardVersion(results, rootPackage.version);
    checkSettingsAuthLocalSecurityEvidenceVersion(results, rootPackage.version);
    checkProviderConnectionReadinessConsoleVersion(results, rootPackage.version);
    checkProviderConnectionReadinessDecisionEngineVersion(results, rootPackage.version);
    checkSecureApiKeyStorageMainVersion(results, rootPackage.version);
    checkSecureApiKeyStorageConsoleVersion(results, rootPackage.version);
  }

  results.forEach((item) => {
    const prefix = item.pass ? "[PASS]" : "[FAIL]";
    console.log(`${prefix} ${item.name} - ${item.detail}`);
  });

  const failed = results.filter((item) => !item.pass);
  if (failed.length > 0) {
    console.log(`VERSION_CHECK FAIL (${failed.length} failed)`);
    return 1;
  }

  console.log("VERSION_CHECK PASS");
  return 0;
}

if (require.main === module) {
  process.exitCode = runVersionCheck();
}

module.exports = { runVersionCheck };
