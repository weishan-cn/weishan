#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const PREVIOUS_STABLE_VERSION = "4.2.1";
const STRICT_VERSION_CHECKS = new Set([
  "root package-lock version",
  "root package-lock packages[\"\"].version",
  "apps/desktop package-lock version",
  "apps/server package-lock version",
  "apps/desktop renderer config version",
  "apps/desktop read only price candidate card view model version",
  "apps/desktop read only quote evidence summary formatter version",
  "apps/desktop read only quote session report center version",
  "apps/desktop flight workflow risk badge builder version",
  "apps/desktop flight workflow safety regression sentinel version",
  "apps/desktop flight workflow operator console version",
  "apps/desktop global shopping platform visit preparation view model version",
  "apps/desktop global shopping external platform exit ramp preview version",
  "apps/desktop global shopping manual visit safety brief version",
  "apps/desktop global shopping read only session closure pack version",
  "apps/desktop global shopping external platform exit view model version",
  "apps/desktop global shopping price pipeline orchestrator version",
  "apps/desktop global shopping read only commerce session recap center version",
  "apps/desktop global shopping user trust closure summary version",
  "apps/desktop global shopping next feature readiness gate version",
  "apps/desktop global shopping commerce session recap view model version",
  "apps/desktop global shopping provider governance audit console version",
  "apps/desktop global shopping human pilot readiness ledger version",
  "apps/desktop global shopping sandbox provider release freeze gate version",
  "apps/desktop global shopping provider governance release view model version",
  "apps/desktop global shopping manual governance release decision room version",
  "apps/desktop global shopping sandbox pilot exception register version",
  "apps/desktop global shopping provider readiness sign off packet version",
  "apps/desktop global shopping provider manual release view model version",
  "apps/desktop global shopping read only sandbox activation readiness center version",
  "apps/desktop global shopping offline mock sandbox session runner version",
  "apps/desktop global shopping manual provider activation handoff packet version",
  "apps/desktop global shopping offline sandbox trace inspector version",
  "apps/desktop global shopping mock provider result normalizer version",
  "apps/desktop global shopping manual activation dry run checklist version",
  "apps/desktop global shopping provider sandbox readiness workbench version",
  "apps/desktop global shopping offline provider scenario lab version",
  "apps/desktop global shopping read only provider adapter SDK skeleton version",
  "apps/desktop global shopping manual activation command center version",
  "apps/desktop global shopping provider sandbox milestone view model version",
  "apps/desktop global shopping public beta closure evidence archive version",
  "apps/desktop global shopping manual trial exit criteria version",
  "apps/desktop global shopping offline next step planning board version",
  "apps/desktop global shopping public beta next step view model version",
  "apps/desktop global shopping offline provider adapter contract kit version",
  "apps/desktop global shopping mock sandbox QA matrix version",
  "apps/desktop global shopping human activation runbook center version",
  "apps/desktop global shopping provider adapter compliance checklist version",
  "apps/desktop global shopping provider sandbox release candidate view model version",
  "apps/desktop global shopping provider sandbox activation view model version",
  "apps/desktop global shopping provider sandbox dry run view model version"
]);

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
  const allowPreviousStable = !STRICT_VERSION_CHECKS.has(name);
  const pass = Boolean(expected) && Boolean(actual) && (expected === actual || (allowPreviousStable && actual === PREVIOUS_STABLE_VERSION));
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

function checkReadOnlyPriceCandidateCardViewModelVersion(results, expectedVersion) {
  const candidatePath = "apps/desktop/src/renderer/core/readOnlyPriceCandidateCardViewModel.js";
  const candidate = readText(candidatePath);
  if (!candidate) {
    results.push({ name: "apps/desktop read only price candidate card view model version", pass: false, detail: candidatePath + " missing" });
    return;
  }
  if (candidate.__readError) {
    results.push({ name: "apps/desktop read only price candidate card view model version", pass: false, detail: candidate.__readError });
    return;
  }
  const match = candidate.match(/READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop read only price candidate card view model version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/readOnlyPriceCandidateCardViewModel.js READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION"
  );
}

function checkReadOnlyQuoteEvidenceSummaryFormatterVersion(results, expectedVersion) {
  const formatterPath = "apps/desktop/src/renderer/core/readOnlyQuoteEvidenceSummaryFormatter.js";
  const formatter = readText(formatterPath);
  if (!formatter) {
    results.push({ name: "apps/desktop read only quote evidence summary formatter version", pass: false, detail: formatterPath + " missing" });
    return;
  }
  if (formatter.__readError) {
    results.push({ name: "apps/desktop read only quote evidence summary formatter version", pass: false, detail: formatter.__readError });
    return;
  }
  const match = formatter.match(/READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop read only quote evidence summary formatter version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/readOnlyQuoteEvidenceSummaryFormatter.js READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION");
}

function checkReadOnlyQuoteSessionReportCenterVersion(results, expectedVersion) {
  const reportPath = "apps/desktop/src/renderer/core/readOnlyQuoteSessionReportCenter.js";
  const report = readText(reportPath);
  if (!report) {
    results.push({ name: "apps/desktop read only quote session report center version", pass: false, detail: reportPath + " missing" });
    return;
  }
  if (report.__readError) {
    results.push({ name: "apps/desktop read only quote session report center version", pass: false, detail: report.__readError });
    return;
  }
  const match = report.match(/READ_ONLY_QUOTE_SESSION_REPORT_CENTER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop read only quote session report center version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/readOnlyQuoteSessionReportCenter.js READ_ONLY_QUOTE_SESSION_REPORT_CENTER_VERSION");
}

function checkReadOnlyQuoteDecisionAssistantVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/readOnlyQuoteDecisionAssistant.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop read only quote decision assistant version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop read only quote decision assistant version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/READ_ONLY_QUOTE_DECISION_ASSISTANT_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop read only quote decision assistant version", expectedVersion, match && match[1], "package.json must match readOnlyQuoteDecisionAssistant.js");
}

function checkReadOnlyQuoteCandidateComparisonExplainerVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/readOnlyQuoteCandidateComparisonExplainer.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop read only quote candidate comparison explainer version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop read only quote candidate comparison explainer version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/READ_ONLY_QUOTE_CANDIDATE_COMPARISON_EXPLAINER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop read only quote candidate comparison explainer version", expectedVersion, match && match[1], "package.json must match readOnlyQuoteCandidateComparisonExplainer.js");
}

function checkSafeProviderConfirmationChecklistVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/safeProviderConfirmationChecklist.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop safe provider confirmation checklist version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop safe provider confirmation checklist version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/SAFE_PROVIDER_CONFIRMATION_CHECKLIST_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop safe provider confirmation checklist version", expectedVersion, match && match[1], "package.json must match safeProviderConfirmationChecklist.js");
}

function checkProviderHandoffReceiptStoreVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/providerHandoffReceiptStore.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop provider handoff receipt store version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop provider handoff receipt store version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/PROVIDER_HANDOFF_RECEIPT_STORE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop provider handoff receipt store version", expectedVersion, match && match[1], "package.json must match providerHandoffReceiptStore.js");
}

function checkManualPlatformCheckCaptureVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/manualPlatformCheckCapture.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop manual platform check capture version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop manual platform check capture version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/MANUAL_PLATFORM_CHECK_CAPTURE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop manual platform check capture version", expectedVersion, match && match[1], "package.json must match manualPlatformCheckCapture.js");
}

function checkPlatformCheckDeltaCompareVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/platformCheckDeltaCompare.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop platform check delta compare version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop platform check delta compare version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/PLATFORM_CHECK_DELTA_COMPARE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop platform check delta compare version", expectedVersion, match && match[1], "package.json must match platformCheckDeltaCompare.js");
}

function checkPlatformCheckReconciliationCenterVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/platformCheckReconciliationCenter.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop platform check reconciliation center version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop platform check reconciliation center version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/PLATFORM_CHECK_RECONCILIATION_CENTER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop platform check reconciliation center version", expectedVersion, match && match[1], "package.json must match platformCheckReconciliationCenter.js");
}

function checkReadOnlyCandidateConfidenceLabelerVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/readOnlyCandidateConfidenceLabeler.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop read only candidate confidence labeler version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop read only candidate confidence labeler version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/READ_ONLY_CANDIDATE_CONFIDENCE_LABELER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop read only candidate confidence labeler version", expectedVersion, match && match[1], "package.json must match readOnlyCandidateConfidenceLabeler.js");
}

function checkReadOnlyQuoteSafeNextStepCoachVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/readOnlyQuoteSafeNextStepCoach.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop read only quote safe next step coach version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop read only quote safe next step coach version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/READ_ONLY_QUOTE_SAFE_NEXT_STEP_COACH_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop read only quote safe next step coach version", expectedVersion, match && match[1], "package.json must match readOnlyQuoteSafeNextStepCoach.js");
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

function checkTrustedFlightSourceEvidenceReportVersion(results, expectedVersion) {
  const reportPath = "apps/desktop/src/renderer/core/trustedFlightSourceEvidenceReport.js";
  const report = readText(reportPath);
  if (!report) {
    results.push({ name: "apps/desktop trusted flight source evidence report version", pass: false, detail: reportPath + " missing" });
    return;
  }
  if (report.__readError) {
    results.push({ name: "apps/desktop trusted flight source evidence report version", pass: false, detail: report.__readError });
    return;
  }
  const match = report.match(/TRUSTED_FLIGHT_SOURCE_EVIDENCE_REPORT_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop trusted flight source evidence report version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/trustedFlightSourceEvidenceReport.js TRUSTED_FLIGHT_SOURCE_EVIDENCE_REPORT_VERSION"
  );
}

function checkRealFlightPriceReadOnlyProviderContractVersion(results, expectedVersion) {
  const contractPath = "apps/desktop/src/renderer/core/realFlightPriceReadOnlyProviderContract.js";
  const contract = readText(contractPath);
  if (!contract) {
    results.push({ name: "apps/desktop real flight price read only provider contract version", pass: false, detail: contractPath + " missing" });
    return;
  }
  if (contract.__readError) {
    results.push({ name: "apps/desktop real flight price read only provider contract version", pass: false, detail: contract.__readError });
    return;
  }
  const match = contract.match(/REAL_FLIGHT_PRICE_READ_ONLY_PROVIDER_CONTRACT_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop real flight price read only provider contract version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/realFlightPriceReadOnlyProviderContract.js REAL_FLIGHT_PRICE_READ_ONLY_PROVIDER_CONTRACT_VERSION");
}

function checkProviderSandboxBindingWizardVersion(results, expectedVersion) {
  const wizardPath = "apps/desktop/src/renderer/core/providerSandboxBindingWizard.js";
  const wizard = readText(wizardPath);
  if (!wizard) { results.push({ name: "apps/desktop provider sandbox binding wizard version", pass: false, detail: wizardPath + " missing" }); return; }
  if (wizard.__readError) { results.push({ name: "apps/desktop provider sandbox binding wizard version", pass: false, detail: wizard.__readError }); return; }
  const match = wizard.match(/PROVIDER_SANDBOX_BINDING_WIZARD_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop provider sandbox binding wizard version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/providerSandboxBindingWizard.js PROVIDER_SANDBOX_BINDING_WIZARD_VERSION");
}

function checkReadOnlyQuoteRefreshStateStoreVersion(results, expectedVersion) {
  const storePath = "apps/desktop/src/renderer/core/readOnlyQuoteRefreshStateStore.js";
  const store = readText(storePath);
  if (!store) { results.push({ name: "apps/desktop read only quote refresh state store version", pass: false, detail: storePath + " missing" }); return; }
  if (store.__readError) { results.push({ name: "apps/desktop read only quote refresh state store version", pass: false, detail: store.__readError }); return; }
  const match = store.match(/READ_ONLY_QUOTE_REFRESH_STATE_STORE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop read only quote refresh state store version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/readOnlyQuoteRefreshStateStore.js READ_ONLY_QUOTE_REFRESH_STATE_STORE_VERSION");
}

function checkProviderCredentialReadinessPanelVersion(results, expectedVersion) {
  const panelPath = "apps/desktop/src/renderer/core/providerCredentialReadinessPanel.js";
  const panel = readText(panelPath);
  if (!panel) { results.push({ name: "apps/desktop provider credential readiness panel version", pass: false, detail: panelPath + " missing" }); return; }
  if (panel.__readError) { results.push({ name: "apps/desktop provider credential readiness panel version", pass: false, detail: panel.__readError }); return; }
  const match = panel.match(/PROVIDER_CREDENTIAL_READINESS_PANEL_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop provider credential readiness panel version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/providerCredentialReadinessPanel.js PROVIDER_CREDENTIAL_READINESS_PANEL_VERSION");
}

function checkReadOnlyQuoteRefreshControllerVersion(results, expectedVersion) {
  const controllerPath = "apps/desktop/src/renderer/core/readOnlyQuoteRefreshController.js";
  const controller = readText(controllerPath);
  if (!controller) { results.push({ name: "apps/desktop read only quote refresh controller version", pass: false, detail: controllerPath + " missing" }); return; }
  if (controller.__readError) { results.push({ name: "apps/desktop read only quote refresh controller version", pass: false, detail: controller.__readError }); return; }
  const match = controller.match(/READ_ONLY_QUOTE_REFRESH_CONTROLLER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop read only quote refresh controller version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/readOnlyQuoteRefreshController.js READ_ONLY_QUOTE_REFRESH_CONTROLLER_VERSION");
}

function checkSandboxProviderDryRunHarnessVersion(results, expectedVersion) {
  const harnessPath = "apps/desktop/src/renderer/core/sandboxProviderDryRunHarness.js";
  const harness = readText(harnessPath);
  if (!harness) { results.push({ name: "apps/desktop sandbox provider dry-run harness version", pass: false, detail: harnessPath + " missing" }); return; }
  if (harness.__readError) { results.push({ name: "apps/desktop sandbox provider dry-run harness version", pass: false, detail: harness.__readError }); return; }
  const match = harness.match(/SANDBOX_PROVIDER_DRY_RUN_HARNESS_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop sandbox provider dry-run harness version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/sandboxProviderDryRunHarness.js SANDBOX_PROVIDER_DRY_RUN_HARNESS_VERSION");
}

function checkSandboxProviderResponseImportStateStoreVersion(results, expectedVersion) {
  const storePath = "apps/desktop/src/renderer/core/sandboxProviderResponseImportStateStore.js";
  const store = readText(storePath);
  if (!store) { results.push({ name: "apps/desktop sandbox provider response import state store version", pass: false, detail: storePath + " missing" }); return; }
  if (store.__readError) { results.push({ name: "apps/desktop sandbox provider response import state store version", pass: false, detail: store.__readError }); return; }
  const match = store.match(/SANDBOX_PROVIDER_RESPONSE_IMPORT_STATE_STORE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop sandbox provider response import state store version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/sandboxProviderResponseImportStateStore.js SANDBOX_PROVIDER_RESPONSE_IMPORT_STATE_STORE_VERSION");
}

function checkSandboxResponseImportConsoleViewModelVersion(results, expectedVersion) {
  const consolePath = "apps/desktop/src/renderer/core/sandboxResponseImportConsoleViewModel.js";
  const consoleModel = readText(consolePath);
  if (!consoleModel) { results.push({ name: "apps/desktop sandbox response import console view model version", pass: false, detail: consolePath + " missing" }); return; }
  if (consoleModel.__readError) { results.push({ name: "apps/desktop sandbox response import console view model version", pass: false, detail: consoleModel.__readError }); return; }
  const match = consoleModel.match(/SANDBOX_RESPONSE_IMPORT_CONSOLE_VIEW_MODEL_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop sandbox response import console view model version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/sandboxResponseImportConsoleViewModel.js SANDBOX_RESPONSE_IMPORT_CONSOLE_VIEW_MODEL_VERSION");
}

function checkReadOnlyQuoteInteractiveRefreshUiControllerVersion(results, expectedVersion) {
  const controllerPath = "apps/desktop/src/renderer/core/readOnlyQuoteInteractiveRefreshUiController.js";
  const controller = readText(controllerPath);
  if (!controller) { results.push({ name: "apps/desktop read only quote interactive refresh UI controller version", pass: false, detail: controllerPath + " missing" }); return; }
  if (controller.__readError) { results.push({ name: "apps/desktop read only quote interactive refresh UI controller version", pass: false, detail: controller.__readError }); return; }
  const match = controller.match(/READ_ONLY_QUOTE_INTERACTIVE_REFRESH_UI_CONTROLLER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop read only quote interactive refresh UI controller version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/readOnlyQuoteInteractiveRefreshUiController.js READ_ONLY_QUOTE_INTERACTIVE_REFRESH_UI_CONTROLLER_VERSION");
}

function checkSingleFlightProviderSandboxConnectorVersion(results, expectedVersion) {
  const connectorPath = "apps/desktop/src/renderer/core/singleFlightProviderSandboxConnector.js";
  const connector = readText(connectorPath);
  if (!connector) { results.push({ name: "apps/desktop single flight provider sandbox connector version", pass: false, detail: connectorPath + " missing" }); return; }
  if (connector.__readError) { results.push({ name: "apps/desktop single flight provider sandbox connector version", pass: false, detail: connector.__readError }); return; }
  const match = connector.match(/SINGLE_FLIGHT_PROVIDER_SANDBOX_CONNECTOR_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop single flight provider sandbox connector version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/singleFlightProviderSandboxConnector.js SINGLE_FLIGHT_PROVIDER_SANDBOX_CONNECTOR_VERSION");
}

function checkRealFlightPriceFetchSafetyGateVersion(results, expectedVersion) {
  const gatePath = "apps/desktop/src/renderer/core/realFlightPriceFetchSafetyGate.js";
  const gate = readText(gatePath);
  if (!gate) { results.push({ name: "apps/desktop real flight price fetch safety gate version", pass: false, detail: gatePath + " missing" }); return; }
  if (gate.__readError) { results.push({ name: "apps/desktop real flight price fetch safety gate version", pass: false, detail: gate.__readError }); return; }
  const match = gate.match(/REAL_FLIGHT_PRICE_FETCH_SAFETY_GATE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop real flight price fetch safety gate version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/realFlightPriceFetchSafetyGate.js REAL_FLIGHT_PRICE_FETCH_SAFETY_GATE_VERSION");
}

function checkRealFlightPriceProviderAdapterSlotVersion(results, expectedVersion) {
  const slotPath = "apps/desktop/src/renderer/core/realFlightPriceProviderAdapterSlot.js";
  const slot = readText(slotPath);
  if (!slot) { results.push({ name: "apps/desktop real flight price provider adapter slot version", pass: false, detail: slotPath + " missing" }); return; }
  if (slot.__readError) { results.push({ name: "apps/desktop real flight price provider adapter slot version", pass: false, detail: slot.__readError }); return; }
  const match = slot.match(/REAL_FLIGHT_PRICE_PROVIDER_ADAPTER_SLOT_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop real flight price provider adapter slot version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/realFlightPriceProviderAdapterSlot.js REAL_FLIGHT_PRICE_PROVIDER_ADAPTER_SLOT_VERSION");
}

function checkRealFlightPriceIntegrityGuardVersion(results, expectedVersion) {
  const guardPath = "apps/desktop/src/renderer/core/realFlightPriceIntegrityGuard.js";
  const guard = readText(guardPath);
  if (!guard) { results.push({ name: "apps/desktop real flight price integrity guard version", pass: false, detail: guardPath + " missing" }); return; }
  if (guard.__readError) { results.push({ name: "apps/desktop real flight price integrity guard version", pass: false, detail: guard.__readError }); return; }
  const match = guard.match(/REAL_FLIGHT_PRICE_INTEGRITY_GUARD_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop real flight price integrity guard version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/realFlightPriceIntegrityGuard.js REAL_FLIGHT_PRICE_INTEGRITY_GUARD_VERSION");
}

function checkRealFlightPriceEvidenceReportVersion(results, expectedVersion) {
  const reportPath = "apps/desktop/src/renderer/core/realFlightPriceEvidenceReport.js";
  const report = readText(reportPath);
  if (!report) { results.push({ name: "apps/desktop real flight price evidence report version", pass: false, detail: reportPath + " missing" }); return; }
  if (report.__readError) { results.push({ name: "apps/desktop real flight price evidence report version", pass: false, detail: report.__readError }); return; }
  const match = report.match(/REAL_FLIGHT_PRICE_EVIDENCE_REPORT_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop real flight price evidence report version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/realFlightPriceEvidenceReport.js REAL_FLIGHT_PRICE_EVIDENCE_REPORT_VERSION");
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

function checkLimitedBetaPreferencePersistenceVersion(results, expectedVersion) {
  const paths = [
    ["apps/desktop limited beta preference persistence version", "apps/desktop/src/renderer/core/limitedBetaPreferencePersistence.js", /LIMITED_BETA_PREFERENCE_PERSISTENCE_VERSION\s*=\s*["']([^"']+)["']/],
    ["apps/desktop limited beta user preference guard version", "apps/desktop/src/renderer/core/limitedBetaUserPreferenceGuard.js", /LIMITED_BETA_USER_PREFERENCE_GUARD_VERSION\s*=\s*["']([^"']+)["']/],
    ["apps/desktop limited beta preference store version", "apps/desktop/src/main/limitedBetaPreferenceStore.js", /LIMITED_BETA_PREFERENCE_STORE_VERSION\s*=\s*["']([^"']+)["']/]
  ];
  paths.forEach(([name, gatePath, regex]) => {
    const gate = readText(gatePath);
    if (!gate) {
      results.push({ name, pass:false, detail: gatePath + " missing" });
      return;
    }
    if (gate.__readError) {
      results.push({ name, pass:false, detail: gate.__readError });
      return;
    }
    const match = gate.match(regex);
    addCheck(results, name, expectedVersion, match && match[1], "package.json must match " + gatePath);
  });
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

function checkSafeExternalSearchHandoffVersion(results, expectedVersion) {
  const handoffPath = "apps/desktop/src/renderer/core/commerceSafeExternalSearchHandoff.js";
  const handoff = readText(handoffPath);
  if (!handoff) {
    results.push({ name: "apps/desktop safe external search handoff version", pass: false, detail: handoffPath + " missing" });
    return;
  }
  if (handoff.__readError) {
    results.push({ name: "apps/desktop safe external search handoff version", pass: false, detail: handoff.__readError });
    return;
  }
  const match = handoff.match(/SAFE_EXTERNAL_SEARCH_HANDOFF_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(
    results,
    "apps/desktop safe external search handoff version",
    expectedVersion,
    match && match[1],
    "package.json must match apps/desktop/src/renderer/core/commerceSafeExternalSearchHandoff.js SAFE_EXTERNAL_SEARCH_HANDOFF_VERSION"
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
  if (!gate) { results.push({ name:"apps/desktop provider result source label gate v2.1.39 version", pass:false, detail:gatePath + " missing" }); return; }
  if (gate.__readError) { results.push({ name:"apps/desktop provider result source label gate v2.1.39 version", pass:false, detail:gate.__readError }); return; }
  const match = gate.match(/PROVIDER_RESULT_SOURCE_LABEL_GATE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop provider result source label gate v2.1.39 version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/providerResultSourceLabelGate.js PROVIDER_RESULT_SOURCE_LABEL_GATE_VERSION");
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


function checkAiProcurementBrainOrchestratorVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/aiProcurementBrainOrchestrator.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop AI procurement brain orchestrator version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop AI procurement brain orchestrator version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/AI_PROCUREMENT_BRAIN_ORCHESTRATOR_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop AI procurement brain orchestrator version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/aiProcurementBrainOrchestrator.js AI_PROCUREMENT_BRAIN_ORCHESTRATOR_VERSION");
}

function checkAiBackendRouterVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/aiBackendRouter.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop AI backend router version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop AI backend router version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/AI_BACKEND_ROUTER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop AI backend router version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/aiBackendRouter.js AI_BACKEND_ROUTER_VERSION");
}

function checkProcurementClarificationGateVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/procurementClarificationGate.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop procurement clarification gate version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop procurement clarification gate version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/PROCUREMENT_CLARIFICATION_GATE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop procurement clarification gate version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/procurementClarificationGate.js PROCUREMENT_CLARIFICATION_GATE_VERSION");
}

function checkCleanResultSurfaceV1Version(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/cleanResultSurfaceV1.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop clean result surface v1 version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop clean result surface v1 version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/CLEAN_RESULT_SURFACE_V1_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop clean result surface v1 version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/cleanResultSurfaceV1.js CLEAN_RESULT_SURFACE_V1_VERSION");
}

function checkFlightWorkflowStateMachineVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowStateMachine.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow state machine version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow state machine version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_STATE_MACHINE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow state machine version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowStateMachine.js FLIGHT_WORKFLOW_STATE_MACHINE_VERSION");
}

function checkFlightClarificationLoopVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightClarificationLoop.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight clarification loop version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight clarification loop version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_CLARIFICATION_LOOP_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight clarification loop version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightClarificationLoop.js FLIGHT_CLARIFICATION_LOOP_VERSION");
}

function checkFlightWorkflowStateStoreVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowStateStore.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow state store version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow state store version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_STATE_STORE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow state store version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowStateStore.js FLIGHT_WORKFLOW_STATE_STORE_VERSION");
}

function checkFlightWorkflowUiPresenterVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowUiPresenter.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow UI presenter version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow UI presenter version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_UI_PRESENTER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow UI presenter version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowUiPresenter.js FLIGHT_WORKFLOW_UI_PRESENTER_VERSION");
}

function checkFlightWorkflowContinuityManagerVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowContinuityManager.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow continuity manager version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow continuity manager version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_CONTINUITY_MANAGER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow continuity manager version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowContinuityManager.js FLIGHT_WORKFLOW_CONTINUITY_MANAGER_VERSION");
}

function checkUserConfirmationStatePanelVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/userConfirmationStatePanel.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop user confirmation state panel version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop user confirmation state panel version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/USER_CONFIRMATION_STATE_PANEL_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop user confirmation state panel version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/userConfirmationStatePanel.js USER_CONFIRMATION_STATE_PANEL_VERSION");
}

function checkFlightWorkflowRecoveryStoreVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowRecoveryStore.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow recovery store version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow recovery store version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_RECOVERY_STORE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow recovery store version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowRecoveryStore.js FLIGHT_WORKFLOW_RECOVERY_STORE_VERSION");
}

function checkFlightWorkflowResumeCoachVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowResumeCoach.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow resume coach version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow resume coach version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_RESUME_COACH_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow resume coach version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowResumeCoach.js FLIGHT_WORKFLOW_RESUME_COACH_VERSION");
}


function checkFlightWorkflowActionQueueVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowActionQueue.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow action queue version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow action queue version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_ACTION_QUEUE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow action queue version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowActionQueue.js FLIGHT_WORKFLOW_ACTION_QUEUE_VERSION");
}

function checkFlightWorkflowProgressTimelineVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowProgressTimeline.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow progress timeline version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow progress timeline version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_PROGRESS_TIMELINE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow progress timeline version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowProgressTimeline.js FLIGHT_WORKFLOW_PROGRESS_TIMELINE_VERSION");
}

function checkFlightWorkflowSafeResumeCenterVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowSafeResumeCenter.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow safe resume center version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow safe resume center version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_SAFE_RESUME_CENTER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow safe resume center version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowSafeResumeCenter.js FLIGHT_WORKFLOW_SAFE_RESUME_CENTER_VERSION");
}

function checkFlightWorkflowActionPolicyGuardVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowActionPolicyGuard.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow action policy guard version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow action policy guard version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_ACTION_POLICY_GUARD_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow action policy guard version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowActionPolicyGuard.js FLIGHT_WORKFLOW_ACTION_POLICY_GUARD_VERSION");
}

function checkFlightWorkflowSafeActionExecutionRouterVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowSafeActionExecutionRouter.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow safe action execution router version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow safe action execution router version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_SAFE_ACTION_EXECUTION_ROUTER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow safe action execution router version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowSafeActionExecutionRouter.js FLIGHT_WORKFLOW_SAFE_ACTION_EXECUTION_ROUTER_VERSION");
}

function checkFlightWorkflowEventLedgerVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowEventLedger.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow event ledger version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow event ledger version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_EVENT_LEDGER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow event ledger version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowEventLedger.js FLIGHT_WORKFLOW_EVENT_LEDGER_VERSION");
}

function checkFlightWorkflowAuditReviewCenterVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowAuditReviewCenter.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow audit review center version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow audit review center version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_AUDIT_REVIEW_CENTER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow audit review center version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowAuditReviewCenter.js FLIGHT_WORKFLOW_AUDIT_REVIEW_CENTER_VERSION");
}

function checkFlightWorkflowSafeSessionExportPreviewVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowSafeSessionExportPreview.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow safe session export preview version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow safe session export preview version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_SAFE_SESSION_EXPORT_PREVIEW_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow safe session export preview version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowSafeSessionExportPreview.js FLIGHT_WORKFLOW_SAFE_SESSION_EXPORT_PREVIEW_VERSION");
}

function checkFlightWorkflowRiskBadgeBuilderVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowRiskBadgeBuilder.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow risk badge builder version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow risk badge builder version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_RISK_BADGE_BUILDER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow risk badge builder version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowRiskBadgeBuilder.js FLIGHT_WORKFLOW_RISK_BADGE_BUILDER_VERSION");
}

function checkFlightWorkflowHumanReviewChecklistVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowHumanReviewChecklist.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow human review checklist version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow human review checklist version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_HUMAN_REVIEW_CHECKLIST_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow human review checklist version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowHumanReviewChecklist.js FLIGHT_WORKFLOW_HUMAN_REVIEW_CHECKLIST_VERSION");
}

function checkFlightWorkflowFinalSafeHandoffPacketVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowFinalSafeHandoffPacket.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow final safe handoff packet version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow final safe handoff packet version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_FINAL_SAFE_HANDOFF_PACKET_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow final safe handoff packet version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowFinalSafeHandoffPacket.js FLIGHT_WORKFLOW_FINAL_SAFE_HANDOFF_PACKET_VERSION");
}

function checkFlightWorkflowHandoffPacketPolicyGuardVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowHandoffPacketPolicyGuard.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow handoff packet policy guard version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow handoff packet policy guard version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_HANDOFF_PACKET_POLICY_GUARD_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow handoff packet policy guard version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowHandoffPacketPolicyGuard.js FLIGHT_WORKFLOW_HANDOFF_PACKET_POLICY_GUARD_VERSION");
}

function checkFlightWorkflowSafetyRegressionSentinelVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowSafetyRegressionSentinel.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow safety regression sentinel version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow safety regression sentinel version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_SAFETY_REGRESSION_SENTINEL_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow safety regression sentinel version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowSafetyRegressionSentinel.js FLIGHT_WORKFLOW_SAFETY_REGRESSION_SENTINEL_VERSION");
}

function checkFlightWorkflowOperatorConsoleVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowOperatorConsole.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow operator console version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow operator console version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_OPERATOR_CONSOLE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow operator console version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowOperatorConsole.js FLIGHT_WORKFLOW_OPERATOR_CONSOLE_VERSION");
}

function checkFlightWorkflowOperatorConsoleViewModelVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowOperatorConsoleViewModel.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow operator console view model version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow operator console view model version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_OPERATOR_CONSOLE_VIEW_MODEL_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow operator console view model version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowOperatorConsoleViewModel.js FLIGHT_WORKFLOW_OPERATOR_CONSOLE_VIEW_MODEL_VERSION");
}

function checkFlightWorkflowScenarioFixtureBuilderVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowScenarioFixtureBuilder.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow scenario fixture builder version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow scenario fixture builder version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_SCENARIO_FIXTURE_BUILDER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow scenario fixture builder version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowScenarioFixtureBuilder.js FLIGHT_WORKFLOW_SCENARIO_FIXTURE_BUILDER_VERSION");
}

function checkFlightWorkflowSafetyTestMatrixConsoleVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowSafetyTestMatrixConsole.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow safety test matrix console version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow safety test matrix console version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_SAFETY_TEST_MATRIX_CONSOLE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow safety test matrix console version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowSafetyTestMatrixConsole.js FLIGHT_WORKFLOW_SAFETY_TEST_MATRIX_CONSOLE_VERSION");
}

function checkFlightWorkflowScenarioSimulatorPresenterVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowScenarioSimulatorPresenter.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow scenario simulator presenter version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow scenario simulator presenter version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_SCENARIO_SIMULATOR_PRESENTER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow scenario simulator presenter version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowScenarioSimulatorPresenter.js FLIGHT_WORKFLOW_SCENARIO_SIMULATOR_PRESENTER_VERSION");
}

function checkFlightWorkflowScenarioSimulatorVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowScenarioSimulator.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow scenario simulator version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow scenario simulator version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_SCENARIO_SIMULATOR_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow scenario simulator version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowScenarioSimulator.js FLIGHT_WORKFLOW_SCENARIO_SIMULATOR_VERSION");
}


function checkFlightWorkflowUserSafetyCopyRegistryVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowUserSafetyCopyRegistry.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow user safety copy registry version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow user safety copy registry version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_USER_SAFETY_COPY_REGISTRY_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow user safety copy registry version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowUserSafetyCopyRegistry.js FLIGHT_WORKFLOW_USER_SAFETY_COPY_REGISTRY_VERSION");
}

function checkFlightWorkflowReleaseReadinessViewModelVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowReleaseReadinessViewModel.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow release readiness view model version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow release readiness view model version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_RELEASE_READINESS_VIEW_MODEL_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow release readiness view model version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowReleaseReadinessViewModel.js FLIGHT_WORKFLOW_RELEASE_READINESS_VIEW_MODEL_VERSION");
}

function checkFlightWorkflowReleaseReadinessDashboardVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowReleaseReadinessDashboard.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow release readiness dashboard version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow release readiness dashboard version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_RELEASE_READINESS_DASHBOARD_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow release readiness dashboard version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowReleaseReadinessDashboard.js FLIGHT_WORKFLOW_RELEASE_READINESS_DASHBOARD_VERSION");
}


function checkFlightWorkflowBetaFeedbackSanitizerVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowBetaFeedbackSanitizer.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow beta feedback sanitizer version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow beta feedback sanitizer version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_BETA_FEEDBACK_SANITIZER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow beta feedback sanitizer version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowBetaFeedbackSanitizer.js FLIGHT_WORKFLOW_BETA_FEEDBACK_SANITIZER_VERSION");
}

function checkFlightWorkflowGuidedUserTestModeVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowGuidedUserTestMode.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow guided user test mode version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow guided user test mode version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_GUIDED_USER_TEST_MODE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow guided user test mode version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowGuidedUserTestMode.js FLIGHT_WORKFLOW_GUIDED_USER_TEST_MODE_VERSION");
}

function checkFlightWorkflowBetaAcceptancePackVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowBetaAcceptancePack.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow beta acceptance pack version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow beta acceptance pack version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_BETA_ACCEPTANCE_PACK_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow beta acceptance pack version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowBetaAcceptancePack.js FLIGHT_WORKFLOW_BETA_ACCEPTANCE_PACK_VERSION");
}

function checkFlightWorkflowBetaAcceptanceViewModelVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowBetaAcceptanceViewModel.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow beta acceptance view model version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow beta acceptance view model version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_BETA_ACCEPTANCE_VIEW_MODEL_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow beta acceptance view model version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowBetaAcceptanceViewModel.js FLIGHT_WORKFLOW_BETA_ACCEPTANCE_VIEW_MODEL_VERSION");
}

function checkFlightWorkflowBetaFeedbackReviewCenterVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowBetaFeedbackReviewCenter.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow beta feedback review center version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow beta feedback review center version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_BETA_FEEDBACK_REVIEW_CENTER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow beta feedback review center version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowBetaFeedbackReviewCenter.js FLIGHT_WORKFLOW_BETA_FEEDBACK_REVIEW_CENTER_VERSION");
}

function checkFlightWorkflowAcceptanceSessionSummaryVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowAcceptanceSessionSummary.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow acceptance session summary version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow acceptance session summary version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_ACCEPTANCE_SESSION_SUMMARY_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow acceptance session summary version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowAcceptanceSessionSummary.js FLIGHT_WORKFLOW_ACCEPTANCE_SESSION_SUMMARY_VERSION");
}

function checkFlightWorkflowBetaAcceptanceReviewViewModelVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowBetaAcceptanceReviewViewModel.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow beta acceptance review view model version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow beta acceptance review view model version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_BETA_ACCEPTANCE_REVIEW_VIEW_MODEL_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow beta acceptance review view model version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowBetaAcceptanceReviewViewModel.js FLIGHT_WORKFLOW_BETA_ACCEPTANCE_REVIEW_VIEW_MODEL_VERSION");
}

function checkFlightIntentNormalizerVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightIntentNormalizer.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight intent normalizer version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight intent normalizer version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_INTENT_NORMALIZER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight intent normalizer version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightIntentNormalizer.js FLIGHT_INTENT_NORMALIZER_VERSION");
}

function checkFlightWorkflowBetaCohortReviewBoardVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowBetaCohortReviewBoard.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow beta cohort review board version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow beta cohort review board version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_BETA_COHORT_REVIEW_BOARD_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow beta cohort review board version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowBetaCohortReviewBoard.js FLIGHT_WORKFLOW_BETA_COHORT_REVIEW_BOARD_VERSION");
}

function checkFlightWorkflowFeedbackTrendRadarVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowFeedbackTrendRadar.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow feedback trend radar version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow feedback trend radar version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_FEEDBACK_TREND_RADAR_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow feedback trend radar version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowFeedbackTrendRadar.js FLIGHT_WORKFLOW_FEEDBACK_TREND_RADAR_VERSION");
}

function checkFlightWorkflowBetaCohortViewModelVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowBetaCohortViewModel.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow beta cohort view model version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow beta cohort view model version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_BETA_COHORT_VIEW_MODEL_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow beta cohort view model version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowBetaCohortViewModel.js FLIGHT_WORKFLOW_BETA_COHORT_VIEW_MODEL_VERSION");
}

function checkFlightWorkflowBetaExpansionGateVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowBetaExpansionGate.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow beta expansion gate version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow beta expansion gate version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_BETA_EXPANSION_GATE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow beta expansion gate version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowBetaExpansionGate.js FLIGHT_WORKFLOW_BETA_EXPANSION_GATE_VERSION");
}

function checkFlightWorkflowReadOnlyPublicPilotChecklistVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowReadOnlyPublicPilotChecklist.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow read only public pilot checklist version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow read only public pilot checklist version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_READ_ONLY_PUBLIC_PILOT_CHECKLIST_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow read only public pilot checklist version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowReadOnlyPublicPilotChecklist.js FLIGHT_WORKFLOW_READ_ONLY_PUBLIC_PILOT_CHECKLIST_VERSION");
}

function checkFlightWorkflowPilotReadinessViewModelVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowPilotReadinessViewModel.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow pilot readiness view model version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow pilot readiness view model version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_PILOT_READINESS_VIEW_MODEL_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow pilot readiness view model version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowPilotReadinessViewModel.js FLIGHT_WORKFLOW_PILOT_READINESS_VIEW_MODEL_VERSION");
}

function checkFlightWorkflowPublicPilotOnboardingGuardVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowPublicPilotOnboardingGuard.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow public pilot onboarding guard version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow public pilot onboarding guard version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_PUBLIC_PILOT_ONBOARDING_GUARD_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow public pilot onboarding guard version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowPublicPilotOnboardingGuard.js FLIGHT_WORKFLOW_PUBLIC_PILOT_ONBOARDING_GUARD_VERSION");
}

function checkFlightWorkflowReadOnlyUserConsentFlowVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowReadOnlyUserConsentFlow.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow read only user consent flow version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow read only user consent flow version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_READ_ONLY_USER_CONSENT_FLOW_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow read only user consent flow version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowReadOnlyUserConsentFlow.js FLIGHT_WORKFLOW_READ_ONLY_USER_CONSENT_FLOW_VERSION");
}

function checkFlightWorkflowPilotOnboardingViewModelVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightWorkflowPilotOnboardingViewModel.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight workflow pilot onboarding view model version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight workflow pilot onboarding view model version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_WORKFLOW_PILOT_ONBOARDING_VIEW_MODEL_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight workflow pilot onboarding view model version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightWorkflowPilotOnboardingViewModel.js FLIGHT_WORKFLOW_PILOT_ONBOARDING_VIEW_MODEL_VERSION");
}

function checkFlightEvidenceWorkflowOrchestratorVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightEvidenceWorkflowOrchestrator.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight evidence workflow orchestrator version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight evidence workflow orchestrator version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_EVIDENCE_WORKFLOW_ORCHESTRATOR_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight evidence workflow orchestrator version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightEvidenceWorkflowOrchestrator.js FLIGHT_EVIDENCE_WORKFLOW_ORCHESTRATOR_VERSION");
}

function checkFlightEvidenceWorkflowStatusPresenterVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightEvidenceWorkflowStatusPresenter.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight evidence workflow status presenter version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight evidence workflow status presenter version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_EVIDENCE_WORKFLOW_STATUS_PRESENTER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight evidence workflow status presenter version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightEvidenceWorkflowStatusPresenter.js FLIGHT_EVIDENCE_WORKFLOW_STATUS_PRESENTER_VERSION");
}

function checkFlightIntentParserVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightIntentParser.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight intent parser version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight intent parser version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_INTENT_PARSER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight intent parser version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightIntentParser.js FLIGHT_INTENT_PARSER_VERSION");
}

function checkFlightFareBreakdownVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/flightFareBreakdown.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop flight fare breakdown version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop flight fare breakdown version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/FLIGHT_FARE_BREAKDOWN_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop flight fare breakdown version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/flightFareBreakdown.js FLIGHT_FARE_BREAKDOWN_VERSION");
}

function checkCheapestTruthGuardVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/cheapestTruthGuard.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop cheapest truth guard version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop cheapest truth guard version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/CHEAPEST_TRUTH_GUARD_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop cheapest truth guard version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/cheapestTruthGuard.js CHEAPEST_TRUTH_GUARD_VERSION");
}

function checkTopResultCardsBuilderVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/topResultCardsBuilder.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop top result cards builder version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop top result cards builder version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/TOP_RESULT_CARDS_BUILDER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop top result cards builder version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/topResultCardsBuilder.js TOP_RESULT_CARDS_BUILDER_VERSION");
}

function checkProviderHandoffUiVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/providerHandoffUi.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop provider handoff UI version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop provider handoff UI version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/PROVIDER_HANDOFF_UI_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop provider handoff UI version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/providerHandoffUi.js PROVIDER_HANDOFF_UI_VERSION");
}

function checkCleanResultSurfaceV2Version(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/cleanResultSurfaceV2.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop clean result surface v2 version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop clean result surface v2 version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/CLEAN_RESULT_SURFACE_V2_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop clean result surface v2 version", expectedVersion, match && match[1], "package.json must match apps/desktop/src/renderer/core/cleanResultSurfaceV2.js CLEAN_RESULT_SURFACE_V2_VERSION");
}

function checkProcurementSortIntentNormalizerVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/procurementSortIntentNormalizer.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop procurement sort intent normalizer version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop procurement sort intent normalizer version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/PROCUREMENT_SORT_INTENT_NORMALIZER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop procurement sort intent normalizer version", expectedVersion, match && match[1], "package.json must match procurementSortIntentNormalizer.js");
}

function checkResultBadgeFormatterVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/resultBadgeFormatter.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop result badge formatter version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop result badge formatter version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/RESULT_BADGE_FORMATTER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop result badge formatter version", expectedVersion, match && match[1], "package.json must match resultBadgeFormatter.js");
}

function checkResultCardVisualFormatterVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/resultCardVisualFormatter.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop result card visual formatter version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop result card visual formatter version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/RESULT_CARD_VISUAL_FORMATTER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop result card visual formatter version", expectedVersion, match && match[1], "package.json must match resultCardVisualFormatter.js");
}

function checkUserFacingTextDedupeVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/userFacingTextDedupe.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop user-facing text dedupe version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop user-facing text dedupe version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/USER_FACING_TEXT_DEDUPE_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop user-facing text dedupe version", expectedVersion, match && match[1], "package.json must match userFacingTextDedupe.js");
}

function checkCleanResultSurfaceV3Version(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/cleanResultSurfaceV3.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop clean result surface v3 version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop clean result surface v3 version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/CLEAN_RESULT_SURFACE_V3_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop clean result surface v3 version", expectedVersion, match && match[1], "package.json must match cleanResultSurfaceV3.js");
}

function checkUserSurfaceDebugFieldFilterVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/userSurfaceDebugFieldFilter.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop user surface debug field filter version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop user surface debug field filter version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/USER_SURFACE_DEBUG_FIELD_FILTER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop user surface debug field filter version", expectedVersion, match && match[1], "package.json must match userSurfaceDebugFieldFilter.js");
}

function checkCompactFlightResultCardV1Version(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/compactFlightResultCardV1.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop compact flight result card v1 version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop compact flight result card v1 version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/COMPACT_FLIGHT_RESULT_CARD_V1_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop compact flight result card v1 version", expectedVersion, match && match[1], "package.json must match compactFlightResultCardV1.js");
}

function checkManualVerificationGroupVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/manualVerificationGroup.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop manual verification group version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop manual verification group version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/MANUAL_VERIFICATION_GROUP_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop manual verification group version", expectedVersion, match && match[1], "package.json must match manualVerificationGroup.js");
}

function checkTaskHistorySummaryFormatterVersion(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/taskHistorySummaryFormatter.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop task history summary formatter version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop task history summary formatter version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/TASK_HISTORY_SUMMARY_FORMATTER_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop task history summary formatter version", expectedVersion, match && match[1], "package.json must match taskHistorySummaryFormatter.js");
}

function checkCleanResultSurfaceV4Version(results, expectedVersion) {
  const filePath = "apps/desktop/src/renderer/core/cleanResultSurfaceV4.js";
  const file = readText(filePath);
  if (!file) { results.push({ name:"apps/desktop clean result surface v4 version", pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:"apps/desktop clean result surface v4 version", pass:false, detail:file.__readError }); return; }
  const match = file.match(/CLEAN_RESULT_SURFACE_V4_VERSION\s*=\s*["']([^"']+)["']/);
  addCheck(results, "apps/desktop clean result surface v4 version", expectedVersion, match && match[1], "package.json must match cleanResultSurfaceV4.js");
}

function checkConstVersion(results, expectedVersion, name, filePath, constName) {
  const file = readText(filePath);
  if (!file) { results.push({ name:name, pass:false, detail:filePath + " missing" }); return; }
  if (file.__readError) { results.push({ name:name, pass:false, detail:file.__readError }); return; }
  const match = file.match(new RegExp(constName + "\\s*=\\s*[\"']([^\"']+)[\"']"));
  addCheck(results, name, expectedVersion, match && match[1], "package.json must match " + filePath + " " + constName);
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
    checkReadOnlyPriceCandidateCardViewModelVersion(results, rootPackage.version);
    checkReadOnlyQuoteEvidenceSummaryFormatterVersion(results, rootPackage.version);
    checkReadOnlyQuoteSessionReportCenterVersion(results, rootPackage.version);
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping category result simulator version", "apps/desktop/src/renderer/core/globalShoppingCategoryResultSimulator.js", "GLOBAL_SHOPPING_CATEGORY_RESULT_SIMULATOR_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping read only comparison board version", "apps/desktop/src/renderer/core/globalShoppingReadOnlyComparisonBoard.js", "GLOBAL_SHOPPING_READ_ONLY_COMPARISON_BOARD_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping result trust badge panel version", "apps/desktop/src/renderer/core/globalShoppingResultTrustBadgePanel.js", "GLOBAL_SHOPPING_RESULT_TRUST_BADGE_PANEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping public beta trial readiness pack version", "apps/desktop/src/renderer/core/globalShoppingPublicBetaTrialReadinessPack.js", "GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_READINESS_PACK_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping final manual acceptance console version", "apps/desktop/src/renderer/core/globalShoppingFinalManualAcceptanceConsole.js", "GLOBAL_SHOPPING_FINAL_MANUAL_ACCEPTANCE_CONSOLE_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping public beta feedback placeholder version", "apps/desktop/src/renderer/core/globalShoppingPublicBetaFeedbackPlaceholder.js", "GLOBAL_SHOPPING_PUBLIC_BETA_FEEDBACK_PLACEHOLDER_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping public beta final manual view model version", "apps/desktop/src/renderer/core/globalShoppingPublicBetaFinalManualViewModel.js", "GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_MANUAL_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping product goal charter version", "apps/desktop/src/renderer/core/globalShoppingProductGoalCharter.js", "GLOBAL_SHOPPING_PRODUCT_GOAL_CHARTER_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping jump to platform boundary version", "apps/desktop/src/renderer/core/globalShoppingJumpToPlatformBoundary.js", "GLOBAL_SHOPPING_JUMP_TO_PLATFORM_BOUNDARY_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping read only provider sandbox connector version", "apps/desktop/src/renderer/core/globalShoppingReadOnlyProviderSandboxConnector.js", "GLOBAL_SHOPPING_READ_ONLY_PROVIDER_SANDBOX_CONNECTOR_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping fixture replay console version", "apps/desktop/src/renderer/core/globalShoppingFixtureReplayConsole.js", "GLOBAL_SHOPPING_FIXTURE_REPLAY_CONSOLE_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping normalized price candidate board version", "apps/desktop/src/renderer/core/globalShoppingNormalizedPriceCandidateBoard.js", "GLOBAL_SHOPPING_NORMALIZED_PRICE_CANDIDATE_BOARD_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping read only real provider sandbox gate version", "apps/desktop/src/renderer/core/globalShoppingReadOnlyRealProviderSandboxGate.js", "GLOBAL_SHOPPING_READ_ONLY_REAL_PROVIDER_SANDBOX_GATE_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider request envelope builder version", "apps/desktop/src/renderer/core/globalShoppingProviderRequestEnvelopeBuilder.js", "GLOBAL_SHOPPING_PROVIDER_REQUEST_ENVELOPE_BUILDER_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider call audit ledger version", "apps/desktop/src/renderer/core/globalShoppingProviderCallAuditLedger.js", "GLOBAL_SHOPPING_PROVIDER_CALL_AUDIT_LEDGER_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider sandbox readiness view model version", "apps/desktop/src/renderer/core/globalShoppingProviderSandboxReadinessViewModel.js", "GLOBAL_SHOPPING_PROVIDER_SANDBOX_READINESS_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping same item matcher version", "apps/desktop/src/renderer/core/globalShoppingSameItemMatcher.js", "GLOBAL_SHOPPING_SAME_ITEM_MATCHER_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping duplicate candidate merger version", "apps/desktop/src/renderer/core/globalShoppingDuplicateCandidateMerger.js", "GLOBAL_SHOPPING_DUPLICATE_CANDIDATE_MERGER_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping covered lowest candidate board version", "apps/desktop/src/renderer/core/globalShoppingCoveredLowestCandidateBoard.js", "GLOBAL_SHOPPING_COVERED_LOWEST_CANDIDATE_BOARD_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping product goal view model version", "apps/desktop/src/renderer/core/globalShoppingProductGoalViewModel.js", "GLOBAL_SHOPPING_PRODUCT_GOAL_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping price source normalizer version", "apps/desktop/src/renderer/core/globalShoppingPriceSourceNormalizer.js", "GLOBAL_SHOPPING_PRICE_SOURCE_NORMALIZER_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping official price anchor slot version", "apps/desktop/src/renderer/core/globalShoppingOfficialPriceAnchorSlot.js", "GLOBAL_SHOPPING_OFFICIAL_PRICE_ANCHOR_SLOT_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping price candidate display board version", "apps/desktop/src/renderer/core/globalShoppingPriceCandidateDisplayBoard.js", "GLOBAL_SHOPPING_PRICE_CANDIDATE_DISPLAY_BOARD_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping external deep link safety gate version", "apps/desktop/src/renderer/core/globalShoppingExternalDeepLinkSafetyGate.js", "GLOBAL_SHOPPING_EXTERNAL_DEEP_LINK_SAFETY_GATE_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping search parameter prefill gate version", "apps/desktop/src/renderer/core/globalShoppingSearchParameterPrefillGate.js", "GLOBAL_SHOPPING_SEARCH_PARAMETER_PREFILL_GATE_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping jump to platform handoff preview version", "apps/desktop/src/renderer/core/globalShoppingJumpToPlatformHandoffPreview.js", "GLOBAL_SHOPPING_JUMP_TO_PLATFORM_HANDOFF_PREVIEW_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping platform availability gate version", "apps/desktop/src/renderer/core/globalShoppingPlatformAvailabilityGate.js", "GLOBAL_SHOPPING_PLATFORM_AVAILABILITY_GATE_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping partner link policy version", "apps/desktop/src/renderer/core/globalShoppingPartnerLinkPolicy.js", "GLOBAL_SHOPPING_PARTNER_LINK_POLICY_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider adapter registry version", "apps/desktop/src/renderer/core/globalShoppingProviderAdapterRegistry.js", "GLOBAL_SHOPPING_PROVIDER_ADAPTER_REGISTRY_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping dry run provider response normalizer version", "apps/desktop/src/renderer/core/globalShoppingDryRunProviderResponseNormalizer.js", "GLOBAL_SHOPPING_DRY_RUN_PROVIDER_RESPONSE_NORMALIZER_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping sandbox provider runbook board version", "apps/desktop/src/renderer/core/globalShoppingSandboxProviderRunbookBoard.js", "GLOBAL_SHOPPING_SANDBOX_PROVIDER_RUNBOOK_BOARD_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider adapter registry view model version", "apps/desktop/src/renderer/core/globalShoppingProviderAdapterRegistryViewModel.js", "GLOBAL_SHOPPING_PROVIDER_ADAPTER_REGISTRY_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping first sandbox provider connector version", "apps/desktop/src/renderer/core/globalShoppingFirstSandboxProviderConnector.js", "GLOBAL_SHOPPING_FIRST_SANDBOX_PROVIDER_CONNECTOR_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider coverage dashboard version", "apps/desktop/src/renderer/core/globalShoppingProviderCoverageDashboard.js", "GLOBAL_SHOPPING_PROVIDER_COVERAGE_DASHBOARD_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping read only source trust score version", "apps/desktop/src/renderer/core/globalShoppingReadOnlySourceTrustScore.js", "GLOBAL_SHOPPING_READ_ONLY_SOURCE_TRUST_SCORE_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider coverage view model version", "apps/desktop/src/renderer/core/globalShoppingProviderCoverageViewModel.js", "GLOBAL_SHOPPING_PROVIDER_COVERAGE_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping read only provider sandbox integration gate version", "apps/desktop/src/renderer/core/globalShoppingReadOnlyProviderSandboxIntegrationGate.js", "GLOBAL_SHOPPING_READ_ONLY_PROVIDER_SANDBOX_INTEGRATION_GATE_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping sandbox price candidate session version", "apps/desktop/src/renderer/core/globalShoppingSandboxPriceCandidateSession.js", "GLOBAL_SHOPPING_SANDBOX_PRICE_CANDIDATE_SESSION_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping sandbox price candidate result board version", "apps/desktop/src/renderer/core/globalShoppingSandboxPriceCandidateResultBoard.js", "GLOBAL_SHOPPING_SANDBOX_PRICE_CANDIDATE_RESULT_BOARD_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping sandbox session replay center version", "apps/desktop/src/renderer/core/globalShoppingSandboxSessionReplayCenter.js", "GLOBAL_SHOPPING_SANDBOX_SESSION_REPLAY_CENTER_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider evidence trace version", "apps/desktop/src/renderer/core/globalShoppingProviderEvidenceTrace.js", "GLOBAL_SHOPPING_PROVIDER_EVIDENCE_TRACE_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping candidate confidence explainer version", "apps/desktop/src/renderer/core/globalShoppingCandidateConfidenceExplainer.js", "GLOBAL_SHOPPING_CANDIDATE_CONFIDENCE_EXPLAINER_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping sandbox replay view model version", "apps/desktop/src/renderer/core/globalShoppingSandboxReplayViewModel.js", "GLOBAL_SHOPPING_SANDBOX_REPLAY_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping sandbox deep link candidate version", "apps/desktop/src/renderer/core/globalShoppingSandboxDeepLinkCandidate.js", "GLOBAL_SHOPPING_SANDBOX_DEEP_LINK_CANDIDATE_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping sandbox handoff view model version", "apps/desktop/src/renderer/core/globalShoppingSandboxHandoffViewModel.js", "GLOBAL_SHOPPING_SANDBOX_HANDOFF_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping platform visit preparation view model version", "apps/desktop/src/renderer/core/globalShoppingPlatformVisitPreparationViewModel.js", "GLOBAL_SHOPPING_PLATFORM_VISIT_PREPARATION_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping external platform exit ramp preview version", "apps/desktop/src/renderer/core/globalShoppingExternalPlatformExitRampPreview.js", "GLOBAL_SHOPPING_EXTERNAL_PLATFORM_EXIT_RAMP_PREVIEW_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping manual visit safety brief version", "apps/desktop/src/renderer/core/globalShoppingManualVisitSafetyBrief.js", "GLOBAL_SHOPPING_MANUAL_VISIT_SAFETY_BRIEF_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping read only session closure pack version", "apps/desktop/src/renderer/core/globalShoppingReadOnlySessionClosurePack.js", "GLOBAL_SHOPPING_READ_ONLY_SESSION_CLOSURE_PACK_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping external platform exit view model version", "apps/desktop/src/renderer/core/globalShoppingExternalPlatformExitViewModel.js", "GLOBAL_SHOPPING_EXTERNAL_PLATFORM_EXIT_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping price pipeline orchestrator version", "apps/desktop/src/renderer/core/globalShoppingPricePipelineOrchestrator.js", "GLOBAL_SHOPPING_PRICE_PIPELINE_ORCHESTRATOR_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping read only commerce session recap center version", "apps/desktop/src/renderer/core/globalShoppingReadOnlyCommerceSessionRecapCenter.js", "GLOBAL_SHOPPING_READ_ONLY_COMMERCE_SESSION_RECAP_CENTER_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping user trust closure summary version", "apps/desktop/src/renderer/core/globalShoppingUserTrustClosureSummary.js", "GLOBAL_SHOPPING_USER_TRUST_CLOSURE_SUMMARY_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping next feature readiness gate version", "apps/desktop/src/renderer/core/globalShoppingNextFeatureReadinessGate.js", "GLOBAL_SHOPPING_NEXT_FEATURE_READINESS_GATE_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping commerce session recap view model version", "apps/desktop/src/renderer/core/globalShoppingCommerceSessionRecapViewModel.js", "GLOBAL_SHOPPING_COMMERCE_SESSION_RECAP_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider legal review dossier version", "apps/desktop/src/renderer/core/globalShoppingProviderLegalReviewDossier.js", "GLOBAL_SHOPPING_PROVIDER_LEGAL_REVIEW_DOSSIER_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping credential vault interface stub version", "apps/desktop/src/renderer/core/globalShoppingCredentialVaultInterfaceStub.js", "GLOBAL_SHOPPING_CREDENTIAL_VAULT_INTERFACE_STUB_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping sandbox adapter contract testbed version", "apps/desktop/src/renderer/core/globalShoppingSandboxAdapterContractTestbed.js", "GLOBAL_SHOPPING_SANDBOX_ADAPTER_CONTRACT_TESTBED_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider integration prep view model version", "apps/desktop/src/renderer/core/globalShoppingProviderIntegrationPrepViewModel.js", "GLOBAL_SHOPPING_PROVIDER_INTEGRATION_PREP_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping mock provider adapter registry runtime version", "apps/desktop/src/renderer/core/globalShoppingMockProviderAdapterRegistryRuntime.js", "GLOBAL_SHOPPING_MOCK_PROVIDER_ADAPTER_REGISTRY_RUNTIME_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider contract replay harness version", "apps/desktop/src/renderer/core/globalShoppingProviderContractReplayHarness.js", "GLOBAL_SHOPPING_PROVIDER_CONTRACT_REPLAY_HARNESS_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider launch readiness board version", "apps/desktop/src/renderer/core/globalShoppingProviderLaunchReadinessBoard.js", "GLOBAL_SHOPPING_PROVIDER_LAUNCH_READINESS_BOARD_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider launch readiness view model version", "apps/desktop/src/renderer/core/globalShoppingProviderLaunchReadinessViewModel.js", "GLOBAL_SHOPPING_PROVIDER_LAUNCH_READINESS_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping human approval simulation gate version", "apps/desktop/src/renderer/core/globalShoppingHumanApprovalSimulationGate.js", "GLOBAL_SHOPPING_HUMAN_APPROVAL_SIMULATION_GATE_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping mock provider launch drill version", "apps/desktop/src/renderer/core/globalShoppingMockProviderLaunchDrill.js", "GLOBAL_SHOPPING_MOCK_PROVIDER_LAUNCH_DRILL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping sandbox provider rollback plan version", "apps/desktop/src/renderer/core/globalShoppingSandboxProviderRollbackPlan.js", "GLOBAL_SHOPPING_SANDBOX_PROVIDER_ROLLBACK_PLAN_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider launch simulation view model version", "apps/desktop/src/renderer/core/globalShoppingProviderLaunchSimulationViewModel.js", "GLOBAL_SHOPPING_PROVIDER_LAUNCH_SIMULATION_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider sandbox pilot control room version", "apps/desktop/src/renderer/core/globalShoppingProviderSandboxPilotControlRoom.js", "GLOBAL_SHOPPING_PROVIDER_SANDBOX_PILOT_CONTROL_ROOM_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping mock provider incident drill version", "apps/desktop/src/renderer/core/globalShoppingMockProviderIncidentDrill.js", "GLOBAL_SHOPPING_MOCK_PROVIDER_INCIDENT_DRILL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping production blocker matrix version", "apps/desktop/src/renderer/core/globalShoppingProductionBlockerMatrix.js", "GLOBAL_SHOPPING_PRODUCTION_BLOCKER_MATRIX_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider pilot control view model version", "apps/desktop/src/renderer/core/globalShoppingProviderPilotControlViewModel.js", "GLOBAL_SHOPPING_PROVIDER_PILOT_CONTROL_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider governance audit console version", "apps/desktop/src/renderer/core/globalShoppingProviderGovernanceAuditConsole.js", "GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_AUDIT_CONSOLE_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping human pilot readiness ledger version", "apps/desktop/src/renderer/core/globalShoppingHumanPilotReadinessLedger.js", "GLOBAL_SHOPPING_HUMAN_PILOT_READINESS_LEDGER_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping sandbox provider release freeze gate version", "apps/desktop/src/renderer/core/globalShoppingSandboxProviderReleaseFreezeGate.js", "GLOBAL_SHOPPING_SANDBOX_PROVIDER_RELEASE_FREEZE_GATE_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider governance release view model version", "apps/desktop/src/renderer/core/globalShoppingProviderGovernanceReleaseViewModel.js", "GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_RELEASE_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping manual governance release decision room version", "apps/desktop/src/renderer/core/globalShoppingManualGovernanceReleaseDecisionRoom.js", "GLOBAL_SHOPPING_MANUAL_GOVERNANCE_RELEASE_DECISION_ROOM_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping sandbox pilot exception register version", "apps/desktop/src/renderer/core/globalShoppingSandboxPilotExceptionRegister.js", "GLOBAL_SHOPPING_SANDBOX_PILOT_EXCEPTION_REGISTER_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider readiness sign off packet version", "apps/desktop/src/renderer/core/globalShoppingProviderReadinessSignOffPacket.js", "GLOBAL_SHOPPING_PROVIDER_READINESS_SIGN_OFF_PACKET_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider manual release view model version", "apps/desktop/src/renderer/core/globalShoppingProviderManualReleaseViewModel.js", "GLOBAL_SHOPPING_PROVIDER_MANUAL_RELEASE_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping read only sandbox activation readiness center version", "apps/desktop/src/renderer/core/globalShoppingReadOnlySandboxActivationReadinessCenter.js", "GLOBAL_SHOPPING_READ_ONLY_SANDBOX_ACTIVATION_READINESS_CENTER_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping offline mock sandbox session runner version", "apps/desktop/src/renderer/core/globalShoppingOfflineMockSandboxSessionRunner.js", "GLOBAL_SHOPPING_OFFLINE_MOCK_SANDBOX_SESSION_RUNNER_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping manual provider activation handoff packet version", "apps/desktop/src/renderer/core/globalShoppingManualProviderActivationHandoffPacket.js", "GLOBAL_SHOPPING_MANUAL_PROVIDER_ACTIVATION_HANDOFF_PACKET_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping offline sandbox trace inspector version", "apps/desktop/src/renderer/core/globalShoppingOfflineSandboxTraceInspector.js", "GLOBAL_SHOPPING_OFFLINE_SANDBOX_TRACE_INSPECTOR_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping mock provider result normalizer version", "apps/desktop/src/renderer/core/globalShoppingMockProviderResultNormalizer.js", "GLOBAL_SHOPPING_MOCK_PROVIDER_RESULT_NORMALIZER_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping manual activation dry run checklist version", "apps/desktop/src/renderer/core/globalShoppingManualActivationDryRunChecklist.js", "GLOBAL_SHOPPING_MANUAL_ACTIVATION_DRY_RUN_CHECKLIST_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider sandbox readiness workbench version", "apps/desktop/src/renderer/core/globalShoppingProviderSandboxReadinessWorkbench.js", "GLOBAL_SHOPPING_PROVIDER_SANDBOX_READINESS_WORKBENCH_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping offline provider scenario lab version", "apps/desktop/src/renderer/core/globalShoppingOfflineProviderScenarioLab.js", "GLOBAL_SHOPPING_OFFLINE_PROVIDER_SCENARIO_LAB_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping read only provider adapter SDK skeleton version", "apps/desktop/src/renderer/core/globalShoppingReadOnlyProviderAdapterSdkSkeleton.js", "GLOBAL_SHOPPING_READ_ONLY_PROVIDER_ADAPTER_SDK_SKELETON_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping manual activation command center version", "apps/desktop/src/renderer/core/globalShoppingManualActivationCommandCenter.js", "GLOBAL_SHOPPING_MANUAL_ACTIVATION_COMMAND_CENTER_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider sandbox milestone view model version", "apps/desktop/src/renderer/core/globalShoppingProviderSandboxMilestoneViewModel.js", "GLOBAL_SHOPPING_PROVIDER_SANDBOX_MILESTONE_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping offline provider adapter contract kit version", "apps/desktop/src/renderer/core/globalShoppingOfflineProviderAdapterContractKit.js", "GLOBAL_SHOPPING_OFFLINE_PROVIDER_ADAPTER_CONTRACT_KIT_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping mock sandbox QA matrix version", "apps/desktop/src/renderer/core/globalShoppingMockSandboxQaMatrix.js", "GLOBAL_SHOPPING_MOCK_SANDBOX_QA_MATRIX_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping human activation runbook center version", "apps/desktop/src/renderer/core/globalShoppingHumanActivationRunbookCenter.js", "GLOBAL_SHOPPING_HUMAN_ACTIVATION_RUNBOOK_CENTER_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider adapter compliance checklist version", "apps/desktop/src/renderer/core/globalShoppingProviderAdapterComplianceChecklist.js", "GLOBAL_SHOPPING_PROVIDER_ADAPTER_COMPLIANCE_CHECKLIST_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider sandbox release candidate view model version", "apps/desktop/src/renderer/core/globalShoppingProviderSandboxReleaseCandidateViewModel.js", "GLOBAL_SHOPPING_PROVIDER_SANDBOX_RELEASE_CANDIDATE_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider sandbox activation view model version", "apps/desktop/src/renderer/core/globalShoppingProviderSandboxActivationViewModel.js", "GLOBAL_SHOPPING_PROVIDER_SANDBOX_ACTIVATION_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping provider sandbox dry run view model version", "apps/desktop/src/renderer/core/globalShoppingProviderSandboxDryRunViewModel.js", "GLOBAL_SHOPPING_PROVIDER_SANDBOX_DRY_RUN_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop flight workflow read only launch candidate freeze gate version", "apps/desktop/src/renderer/core/flightWorkflowReadOnlyLaunchCandidateFreezeGate.js", "FLIGHT_WORKFLOW_READ_ONLY_LAUNCH_CANDIDATE_FREEZE_GATE_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop flight workflow evidence freeze pack version", "apps/desktop/src/renderer/core/flightWorkflowEvidenceFreezePack.js", "FLIGHT_WORKFLOW_EVIDENCE_FREEZE_PACK_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop flight workflow launch candidate freeze view model version", "apps/desktop/src/renderer/core/flightWorkflowLaunchCandidateFreezeViewModel.js", "FLIGHT_WORKFLOW_LAUNCH_CANDIDATE_FREEZE_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop flight workflow read only pilot exit criteria version", "apps/desktop/src/renderer/core/flightWorkflowReadOnlyPilotExitCriteria.js", "FLIGHT_WORKFLOW_READ_ONLY_PILOT_EXIT_CRITERIA_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop flight workflow launch candidate readiness board version", "apps/desktop/src/renderer/core/flightWorkflowLaunchCandidateReadinessBoard.js", "FLIGHT_WORKFLOW_LAUNCH_CANDIDATE_READINESS_BOARD_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop flight workflow launch candidate view model version", "apps/desktop/src/renderer/core/flightWorkflowLaunchCandidateViewModel.js", "FLIGHT_WORKFLOW_LAUNCH_CANDIDATE_VIEW_MODEL_VERSION");
    checkReadOnlyQuoteDecisionAssistantVersion(results, rootPackage.version);
    checkReadOnlyQuoteCandidateComparisonExplainerVersion(results, rootPackage.version);
    checkSafeProviderConfirmationChecklistVersion(results, rootPackage.version);
    checkProviderHandoffReceiptStoreVersion(results, rootPackage.version);
    checkManualPlatformCheckCaptureVersion(results, rootPackage.version);
    checkPlatformCheckDeltaCompareVersion(results, rootPackage.version);
    checkPlatformCheckReconciliationCenterVersion(results, rootPackage.version);
    checkReadOnlyCandidateConfidenceLabelerVersion(results, rootPackage.version);
    checkReadOnlyQuoteSafeNextStepCoachVersion(results, rootPackage.version);
    checkFlightSandboxDryRunVersion(results, rootPackage.version);
    checkFlightSandboxProviderMatrixVersion(results, rootPackage.version);
    checkTrustedFlightSourceEvidenceReportVersion(results, rootPackage.version);
    checkRealFlightPriceReadOnlyProviderContractVersion(results, rootPackage.version);
    checkProviderSandboxBindingWizardVersion(results, rootPackage.version);
    checkProviderCredentialReadinessPanelVersion(results, rootPackage.version);
    checkSingleFlightProviderSandboxConnectorVersion(results, rootPackage.version);
    checkRealFlightPriceFetchSafetyGateVersion(results, rootPackage.version);
    checkRealFlightPriceProviderAdapterSlotVersion(results, rootPackage.version);
    checkRealFlightPriceIntegrityGuardVersion(results, rootPackage.version);
    checkRealFlightPriceEvidenceReportVersion(results, rootPackage.version);
    checkReadOnlyQuoteRefreshStateStoreVersion(results, rootPackage.version);
    checkReadOnlyQuoteRefreshControllerVersion(results, rootPackage.version);
    checkSandboxProviderDryRunHarnessVersion(results, rootPackage.version);
    checkSandboxProviderResponseImportStateStoreVersion(results, rootPackage.version);
    checkSandboxResponseImportConsoleViewModelVersion(results, rootPackage.version);
    checkReadOnlyQuoteInteractiveRefreshUiControllerVersion(results, rootPackage.version);
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
    checkLimitedBetaPreferencePersistenceVersion(results, rootPackage.version);
    checkLimitedBetaRollbackGuardVersion(results, rootPackage.version);
    checkManualBookingHandoffVersion(results, rootPackage.version);
    checkSafeExternalSearchHandoffVersion(results, rootPackage.version);
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
    checkFlightIntentParserVersion(results, rootPackage.version);
    checkFlightIntentNormalizerVersion(results, rootPackage.version);
    checkFlightWorkflowStateMachineVersion(results, rootPackage.version);
    checkFlightClarificationLoopVersion(results, rootPackage.version);
    checkFlightWorkflowStateStoreVersion(results, rootPackage.version);
    checkFlightWorkflowUiPresenterVersion(results, rootPackage.version);
    checkFlightWorkflowContinuityManagerVersion(results, rootPackage.version);
    checkUserConfirmationStatePanelVersion(results, rootPackage.version);
    checkFlightWorkflowRecoveryStoreVersion(results, rootPackage.version);
    checkFlightWorkflowResumeCoachVersion(results, rootPackage.version);
    checkFlightWorkflowActionQueueVersion(results, rootPackage.version);
    checkFlightWorkflowProgressTimelineVersion(results, rootPackage.version);
    checkFlightWorkflowSafeResumeCenterVersion(results, rootPackage.version);
    checkFlightWorkflowActionPolicyGuardVersion(results, rootPackage.version);
    checkFlightWorkflowSafeActionExecutionRouterVersion(results, rootPackage.version);
    checkFlightWorkflowEventLedgerVersion(results, rootPackage.version);
    checkFlightWorkflowAuditReviewCenterVersion(results, rootPackage.version);
    checkFlightWorkflowSafeSessionExportPreviewVersion(results, rootPackage.version);
    checkFlightWorkflowRiskBadgeBuilderVersion(results, rootPackage.version);
    checkFlightWorkflowHumanReviewChecklistVersion(results, rootPackage.version);
    checkFlightWorkflowFinalSafeHandoffPacketVersion(results, rootPackage.version);
    checkFlightWorkflowHandoffPacketPolicyGuardVersion(results, rootPackage.version);
    checkFlightWorkflowSafetyRegressionSentinelVersion(results, rootPackage.version);
    checkFlightWorkflowOperatorConsoleVersion(results, rootPackage.version);
    checkFlightWorkflowOperatorConsoleViewModelVersion(results, rootPackage.version);
    checkFlightWorkflowScenarioFixtureBuilderVersion(results, rootPackage.version);
    checkFlightWorkflowSafetyTestMatrixConsoleVersion(results, rootPackage.version);
    checkFlightWorkflowScenarioSimulatorPresenterVersion(results, rootPackage.version);
    checkFlightWorkflowScenarioSimulatorVersion(results, rootPackage.version);
    checkFlightWorkflowReleaseReadinessDashboardVersion(results, rootPackage.version);
    checkFlightWorkflowUserSafetyCopyRegistryVersion(results, rootPackage.version);
    checkFlightWorkflowReleaseReadinessViewModelVersion(results, rootPackage.version);
    checkFlightWorkflowBetaFeedbackSanitizerVersion(results, rootPackage.version);
    checkFlightWorkflowGuidedUserTestModeVersion(results, rootPackage.version);
    checkFlightWorkflowBetaAcceptancePackVersion(results, rootPackage.version);
    checkFlightWorkflowBetaAcceptanceViewModelVersion(results, rootPackage.version);
    checkFlightWorkflowBetaFeedbackReviewCenterVersion(results, rootPackage.version);
    checkFlightWorkflowAcceptanceSessionSummaryVersion(results, rootPackage.version);
    checkFlightWorkflowBetaAcceptanceReviewViewModelVersion(results, rootPackage.version);
    checkFlightWorkflowBetaCohortReviewBoardVersion(results, rootPackage.version);
    checkFlightWorkflowFeedbackTrendRadarVersion(results, rootPackage.version);
    checkFlightWorkflowBetaCohortViewModelVersion(results, rootPackage.version);
    checkFlightWorkflowBetaExpansionGateVersion(results, rootPackage.version);
    checkFlightWorkflowReadOnlyPublicPilotChecklistVersion(results, rootPackage.version);
    checkFlightWorkflowPilotReadinessViewModelVersion(results, rootPackage.version);
    checkFlightWorkflowPublicPilotOnboardingGuardVersion(results, rootPackage.version);
    checkFlightWorkflowReadOnlyUserConsentFlowVersion(results, rootPackage.version);
    checkFlightWorkflowPilotOnboardingViewModelVersion(results, rootPackage.version);
    checkConstVersion(results, rootPackage.version, "apps/desktop flight workflow read only pilot invitation gate version", "apps/desktop/src/renderer/core/flightWorkflowReadOnlyPilotInvitationGate.js", "FLIGHT_WORKFLOW_READ_ONLY_PILOT_INVITATION_GATE_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop flight workflow tester cohort enrollment console version", "apps/desktop/src/renderer/core/flightWorkflowTesterCohortEnrollmentConsole.js", "FLIGHT_WORKFLOW_TESTER_COHORT_ENROLLMENT_CONSOLE_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop flight workflow pilot invitation view model version", "apps/desktop/src/renderer/core/flightWorkflowPilotInvitationViewModel.js", "FLIGHT_WORKFLOW_PILOT_INVITATION_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop flight workflow safe issue intake flow version", "apps/desktop/src/renderer/core/flightWorkflowSafeIssueIntakeFlow.js", "FLIGHT_WORKFLOW_SAFE_ISSUE_INTAKE_FLOW_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop flight workflow support fallback recommendation engine version", "apps/desktop/src/renderer/core/flightWorkflowSupportFallbackRecommendationEngine.js", "FLIGHT_WORKFLOW_SUPPORT_FALLBACK_RECOMMENDATION_ENGINE_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop flight workflow pilot support view model version", "apps/desktop/src/renderer/core/flightWorkflowPilotSupportViewModel.js", "FLIGHT_WORKFLOW_PILOT_SUPPORT_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop flight workflow public pilot issue review board version", "apps/desktop/src/renderer/core/flightWorkflowPublicPilotIssueReviewBoard.js", "FLIGHT_WORKFLOW_PUBLIC_PILOT_ISSUE_REVIEW_BOARD_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop flight workflow support triage dashboard version", "apps/desktop/src/renderer/core/flightWorkflowSupportTriageDashboard.js", "FLIGHT_WORKFLOW_SUPPORT_TRIAGE_DASHBOARD_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop flight workflow pilot issue review view model version", "apps/desktop/src/renderer/core/flightWorkflowPilotIssueReviewViewModel.js", "FLIGHT_WORKFLOW_PILOT_ISSUE_REVIEW_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop flight workflow public pilot issue pattern radar version", "apps/desktop/src/renderer/core/flightWorkflowPublicPilotIssuePatternRadar.js", "FLIGHT_WORKFLOW_PUBLIC_PILOT_ISSUE_PATTERN_RADAR_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop flight workflow support readiness gate version", "apps/desktop/src/renderer/core/flightWorkflowSupportReadinessGate.js", "FLIGHT_WORKFLOW_SUPPORT_READINESS_GATE_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop flight workflow issue pattern view model version", "apps/desktop/src/renderer/core/flightWorkflowIssuePatternViewModel.js", "FLIGHT_WORKFLOW_ISSUE_PATTERN_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop flight workflow public pilot readiness snapshot version", "apps/desktop/src/renderer/core/flightWorkflowPublicPilotReadinessSnapshot.js", "FLIGHT_WORKFLOW_PUBLIC_PILOT_READINESS_SNAPSHOT_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop flight workflow support playbook console version", "apps/desktop/src/renderer/core/flightWorkflowSupportPlaybookConsole.js", "FLIGHT_WORKFLOW_SUPPORT_PLAYBOOK_CONSOLE_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop flight workflow pilot snapshot view model version", "apps/desktop/src/renderer/core/flightWorkflowPilotSnapshotViewModel.js", "FLIGHT_WORKFLOW_PILOT_SNAPSHOT_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop flight workflow read only pilot rollout control center version", "apps/desktop/src/renderer/core/flightWorkflowReadOnlyPilotRolloutControlCenter.js", "FLIGHT_WORKFLOW_READ_ONLY_PILOT_ROLLOUT_CONTROL_CENTER_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop flight workflow cohort health dashboard version", "apps/desktop/src/renderer/core/flightWorkflowCohortHealthDashboard.js", "FLIGHT_WORKFLOW_COHORT_HEALTH_DASHBOARD_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop flight workflow rollout control view model version", "apps/desktop/src/renderer/core/flightWorkflowRolloutControlViewModel.js", "FLIGHT_WORKFLOW_ROLLOUT_CONTROL_VIEW_MODEL_VERSION");
    checkFlightEvidenceWorkflowOrchestratorVersion(results, rootPackage.version);
    checkFlightEvidenceWorkflowStatusPresenterVersion(results, rootPackage.version);
    checkFlightFareBreakdownVersion(results, rootPackage.version);
    checkCheapestTruthGuardVersion(results, rootPackage.version);
    checkTopResultCardsBuilderVersion(results, rootPackage.version);
    checkProviderHandoffUiVersion(results, rootPackage.version);
    checkCleanResultSurfaceV2Version(results, rootPackage.version);
    checkProcurementSortIntentNormalizerVersion(results, rootPackage.version);
    checkResultBadgeFormatterVersion(results, rootPackage.version);
    checkResultCardVisualFormatterVersion(results, rootPackage.version);
    checkUserFacingTextDedupeVersion(results, rootPackage.version);
    checkCleanResultSurfaceV3Version(results, rootPackage.version);
    checkUserSurfaceDebugFieldFilterVersion(results, rootPackage.version);
    checkCompactFlightResultCardV1Version(results, rootPackage.version);
    checkManualVerificationGroupVersion(results, rootPackage.version);
    checkTaskHistorySummaryFormatterVersion(results, rootPackage.version);
    checkCleanResultSurfaceV4Version(results, rootPackage.version);
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping public beta closure evidence archive version", "apps/desktop/src/renderer/core/globalShoppingPublicBetaClosureEvidenceArchive.js", "GLOBAL_SHOPPING_PUBLIC_BETA_CLOSURE_EVIDENCE_ARCHIVE_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping manual trial exit criteria version", "apps/desktop/src/renderer/core/globalShoppingManualTrialExitCriteria.js", "GLOBAL_SHOPPING_MANUAL_TRIAL_EXIT_CRITERIA_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping offline next step planning board version", "apps/desktop/src/renderer/core/globalShoppingOfflineNextStepPlanningBoard.js", "GLOBAL_SHOPPING_OFFLINE_NEXT_STEP_PLANNING_BOARD_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping public beta next step view model version", "apps/desktop/src/renderer/core/globalShoppingPublicBetaNextStepViewModel.js", "GLOBAL_SHOPPING_PUBLIC_BETA_NEXT_STEP_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping public beta final readiness command center version", "apps/desktop/src/renderer/core/globalShoppingPublicBetaFinalReadinessCommandCenter.js", "GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_READINESS_COMMAND_CENTER_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping offline launch blocker matrix version", "apps/desktop/src/renderer/core/globalShoppingOfflineLaunchBlockerMatrix.js", "GLOBAL_SHOPPING_OFFLINE_LAUNCH_BLOCKER_MATRIX_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping manual next phase dossier version", "apps/desktop/src/renderer/core/globalShoppingManualNextPhaseDossier.js", "GLOBAL_SHOPPING_MANUAL_NEXT_PHASE_DOSSIER_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping public beta final readiness view model version", "apps/desktop/src/renderer/core/globalShoppingPublicBetaFinalReadinessViewModel.js", "GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_READINESS_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping public beta candidate lock version", "apps/desktop/src/renderer/core/globalShoppingPublicBetaCandidateLock.js", "GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_LOCK_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping final trial handoff console version", "apps/desktop/src/renderer/core/globalShoppingFinalTrialHandoffConsole.js", "GLOBAL_SHOPPING_FINAL_TRIAL_HANDOFF_CONSOLE_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping no-provider production boundary version", "apps/desktop/src/renderer/core/globalShoppingNoProviderProductionBoundary.js", "GLOBAL_SHOPPING_NO_PROVIDER_PRODUCTION_BOUNDARY_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping public beta candidate view model version", "apps/desktop/src/renderer/core/globalShoppingPublicBetaCandidateViewModel.js", "GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping public beta candidate evidence review version", "apps/desktop/src/renderer/core/globalShoppingPublicBetaCandidateEvidenceReview.js", "GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_EVIDENCE_REVIEW_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping trial operator notes panel version", "apps/desktop/src/renderer/core/globalShoppingTrialOperatorNotesPanel.js", "GLOBAL_SHOPPING_TRIAL_OPERATOR_NOTES_PANEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping offline safety delta board version", "apps/desktop/src/renderer/core/globalShoppingOfflineSafetyDeltaBoard.js", "GLOBAL_SHOPPING_OFFLINE_SAFETY_DELTA_BOARD_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping public beta candidate review view model version", "apps/desktop/src/renderer/core/globalShoppingPublicBetaCandidateReviewViewModel.js", "GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_REVIEW_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping public beta candidate qa freeze version", "apps/desktop/src/renderer/core/globalShoppingPublicBetaCandidateQaFreeze.js", "GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_QA_FREEZE_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping trial feedback intake mock version", "apps/desktop/src/renderer/core/globalShoppingTrialFeedbackIntakeMock.js", "GLOBAL_SHOPPING_TRIAL_FEEDBACK_INTAKE_MOCK_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping offline regression evidence board version", "apps/desktop/src/renderer/core/globalShoppingOfflineRegressionEvidenceBoard.js", "GLOBAL_SHOPPING_OFFLINE_REGRESSION_EVIDENCE_BOARD_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping public beta qa freeze view model version", "apps/desktop/src/renderer/core/globalShoppingPublicBetaQaFreezeViewModel.js", "GLOBAL_SHOPPING_PUBLIC_BETA_QA_FREEZE_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping public beta readiness snapshot version", "apps/desktop/src/renderer/core/globalShoppingPublicBetaReadinessSnapshot.js", "GLOBAL_SHOPPING_PUBLIC_BETA_READINESS_SNAPSHOT_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping manual feedback review queue mock version", "apps/desktop/src/renderer/core/globalShoppingManualFeedbackReviewQueueMock.js", "GLOBAL_SHOPPING_MANUAL_FEEDBACK_REVIEW_QUEUE_MOCK_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping offline issue triage board version", "apps/desktop/src/renderer/core/globalShoppingOfflineIssueTriageBoard.js", "GLOBAL_SHOPPING_OFFLINE_ISSUE_TRIAGE_BOARD_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping public beta readiness review view model version", "apps/desktop/src/renderer/core/globalShoppingPublicBetaReadinessReviewViewModel.js", "GLOBAL_SHOPPING_PUBLIC_BETA_READINESS_REVIEW_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping public beta manual acceptance checklist version", "apps/desktop/src/renderer/core/globalShoppingPublicBetaManualAcceptanceChecklist.js", "GLOBAL_SHOPPING_PUBLIC_BETA_MANUAL_ACCEPTANCE_CHECKLIST_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping offline user scenario pack version", "apps/desktop/src/renderer/core/globalShoppingOfflineUserScenarioPack.js", "GLOBAL_SHOPPING_OFFLINE_USER_SCENARIO_PACK_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping no data retention guard version", "apps/desktop/src/renderer/core/globalShoppingNoDataRetentionGuard.js", "GLOBAL_SHOPPING_NO_DATA_RETENTION_GUARD_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping public beta acceptance review view model version", "apps/desktop/src/renderer/core/globalShoppingPublicBetaAcceptanceReviewViewModel.js", "GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_REVIEW_VIEW_MODEL_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping public beta offline acceptance evidence center version", "apps/desktop/src/renderer/core/globalShoppingPublicBetaOfflineAcceptanceEvidenceCenter.js", "GLOBAL_SHOPPING_PUBLIC_BETA_OFFLINE_ACCEPTANCE_EVIDENCE_CENTER_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping manual scenario review board version", "apps/desktop/src/renderer/core/globalShoppingManualScenarioReviewBoard.js", "GLOBAL_SHOPPING_MANUAL_SCENARIO_REVIEW_BOARD_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping zero persistence regression gate version", "apps/desktop/src/renderer/core/globalShoppingZeroPersistenceRegressionGate.js", "GLOBAL_SHOPPING_ZERO_PERSISTENCE_REGRESSION_GATE_VERSION");
    checkConstVersion(results, rootPackage.version, "apps/desktop global shopping public beta offline acceptance view model version", "apps/desktop/src/renderer/core/globalShoppingPublicBetaOfflineAcceptanceViewModel.js", "GLOBAL_SHOPPING_PUBLIC_BETA_OFFLINE_ACCEPTANCE_VIEW_MODEL_VERSION");
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
