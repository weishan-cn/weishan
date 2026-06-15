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
    checkUserApiPriorityPolicyVersion(results, rootPackage.version);
    checkApiBindingSafeShellVersion(results, rootPackage.version);
    checkUserApiProviderCatalogVersion(results, rootPackage.version);
    checkApiBindingMockFormVersion(results, rootPackage.version);
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
