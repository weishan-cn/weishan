#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");

const includeExtensions = new Set([
  ".js",
  ".json",
  ".html",
  ".css",
  ".md",
  ".yml",
  ".yaml"
]);

const excludedParts = [
  "node_modules/",
  "apps/desktop/dist/",
  "dist/",
  "coverage/",
  ".git/",
  "playwright-report/",
  "test-results/"
];

const allowedFixturePatterns = [
  /DEMO_[A-Z_]+_SHOULD_NOT_APPEAR/,
  /\[REDACTED_[A-Z_]+\]/,
  /dummy secret/i,
  /local-ui-check-v219@example\.local/
];

const allowedPolicyTextPatterns = [
  /Keychain disabled/i,
  /Keychain access disabled/i,
  /safeStorage disabled/i,
  /safeStorage access disabled/i,
  /endpoint connection disabled/i,
  /provider credential persistence forbidden/i,
  /endpoint secret persistence forbidden/i,
  /localStorage secret write forbidden/i,
  /sessionStorage secret write forbidden/i,
  /real API key read disabled/i,
  /credential input disabled/i
];

const dangerousExecutablePatterns = [
  /localStorage\s*\.\s*setItem\s*\(/i,
  /sessionStorage\s*\.\s*setItem\s*\(/i,
  /writeFile(?:Sync)?\s*\(/i,
  /keytar\s*\./i,
  /safeStorage\s*\.\s*(?:encryptString|decryptString)\s*\(/i,
  /security\s+(?:find|add)-generic-password/i
];

const blockedChecks = [
  {
    name:"localStorage.setItem apiKey",
    counter:"localStorageSecretWriteCount",
    pattern:/localStorage\s*\.\s*setItem\s*\(\s*["'][^"']*(?:apiKey|api_key|rawApiKey)[^"']*["']/i
  },
  {
    name:"localStorage.setItem token",
    counter:"localStorageSecretWriteCount",
    pattern:/localStorage\s*\.\s*setItem\s*\(\s*["'][^"']*(?:token|rawToken)[^"']*["']/i
  },
  {
    name:"localStorage.setItem password",
    counter:"rawPasswordPersistenceCount",
    pattern:/localStorage\s*\.\s*setItem\s*\(\s*["'][^"']*password[^"']*["']/i
  },
  {
    name:"sessionStorage.setItem apiKey",
    counter:"sessionStorageSecretWriteCount",
    pattern:/sessionStorage\s*\.\s*setItem\s*\(\s*["'][^"']*(?:apiKey|api_key|rawApiKey)[^"']*["']/i
  },
  {
    name:"sessionStorage.setItem token",
    counter:"sessionStorageSecretWriteCount",
    pattern:/sessionStorage\s*\.\s*setItem\s*\(\s*["'][^"']*(?:token|rawToken)[^"']*["']/i
  },
  {
    name:"sessionStorage.setItem password",
    counter:"rawPasswordPersistenceCount",
    pattern:/sessionStorage\s*\.\s*setItem\s*\(\s*["'][^"']*password[^"']*["']/i
  },
  {
    name:"writeFile .env",
    counter:"envSecretWriteCount",
    pattern:/writeFile(?:Sync)?\s*\([^)]*\.env/i
  },
  {
    name:"rawApiKey display",
    counter:"rawApiKeyDisplayCount",
    pattern:/(?:innerText|textContent|innerHTML|value)\s*=\s*[^;\n]*(?:rawApiKey|apiKey)/i
  },
  {
    name:"rawToken display",
    counter:"rawApiKeyDisplayCount",
    pattern:/(?:innerText|textContent|innerHTML|value)\s*=\s*[^;\n]*(?:rawToken|accessToken|refreshToken)/i
  },
  {
    name:"raw password display",
    counter:"rawPasswordPersistenceCount",
    pattern:/(?:innerText|textContent|innerHTML)\s*=\s*[^;\n]*password/i
  },
  {
    name:"Keychain secret read",
    counter:"keychainAccessCount",
    pattern:/(?:keytar\s*\.|require\(["']keytar["']\)|from\s+["']keytar["']|Keychain\s*\.\s*(?:getPassword|findCredential)|Keychain.*(?:apiKey|rawApiKey|accessToken|refreshToken|providerSecret))/i
  },
  {
    name:"safeStorage secret read",
    counter:"safeStorageAccessCount",
    pattern:/safeStorage\s*\.\s*decryptString\s*\([^;\n]*(?:apiKey|rawApiKey|accessToken|refreshToken|providerSecret|credentialSecret)/i
  },
  {
    name:"provider credential persisted",
    counter:"providerCredentialPersistedCount",
    pattern:/(?:(?:localStorage|sessionStorage)\s*\.\s*setItem\s*\([^;\n]*(?:providerCredential|credentialSecret|secretRef|providerSecret)|writeFile(?:Sync)?\s*\([^;\n]*(?:providerCredential|credentialSecret|secretRef|providerSecret))/i
  },
  {
    name:"endpoint secret persisted",
    counter:"endpointSecretPersistedCount",
    pattern:/(?:(?:localStorage|sessionStorage)\s*\.\s*setItem\s*\([^;\n]*(?:endpointSecret|providerEndpointSecret)|writeFile(?:Sync)?\s*\([^;\n]*(?:endpointSecret|providerEndpointSecret))/i
  }
];

const counters = {
  blockedPatternCount:0,
  allowedPolicyTextCount:0,
  allowedTestAssertionCount:0,
  allowedTestFixtureCount:0,
  realSecretReadCount:0,
  keychainAccessCount:0,
  safeStorageAccessCount:0,
  envSecretWriteCount:0,
  localStorageSecretWriteCount:0,
  sessionStorageSecretWriteCount:0,
  rawPasswordPersistenceCount:0,
  rawApiKeyDisplayCount:0,
  providerCredentialPersistedCount:0,
  endpointSecretPersistedCount:0
};

function listTrackedFiles() {
  return childProcess.execFileSync("git", ["ls-files"], {
    cwd:ROOT,
    encoding:"utf8",
    stdio:["ignore", "pipe", "pipe"]
  }).split(/\r?\n/).filter(Boolean);
}

function shouldScan(file) {
  const normalized = file.replace(/\\/g, "/");
  if (excludedParts.some((part) => normalized.includes(part))) return false;
  if (normalized === "scripts/healthcheck.js") return false;
  if (/(^|\/)\.env(?:\.|$)/.test(normalized)) return true;
  return includeExtensions.has(path.extname(normalized));
}

function isAllowedFixture(line) {
  return allowedFixturePatterns.some((pattern) => pattern.test(line));
}

function isDocumentationOnlyLine(line) {
  return /(?:未启用|未开放|未连接|未实现|禁止|不得|不会|不能|no real|disabled|forbidden|not enabled|not connected|not implemented|redacted)/i.test(line);
}

function isAllowedPolicyTextLine(line) {
  return allowedPolicyTextPatterns.some((pattern) => pattern.test(line)) || isDocumentationOnlyLine(line);
}

function isExecutableDangerousLine(line) {
  return dangerousExecutablePatterns.some((pattern) => pattern.test(line));
}

function isScannerRuleMetadataLine(file, line) {
  return file.replace(/\\/g, "/") === "scripts/security-no-secret-persistence.js"
    && (/^\s*(?:name|counter|pattern|sample)\s*:/.test(line) || /\bsample\s*:/.test(line));
}

function matchingBlockedChecks(line) {
  return blockedChecks.filter((check) => check.pattern.test(line));
}

function runSelfTests() {
  const allowedPolicySamples = [
    "Keychain disabled",
    "safeStorage disabled",
    "endpoint connection disabled",
    "provider credential persistence forbidden",
    "endpoint secret persistence forbidden",
    "localStorage secret write forbidden",
    "sessionStorage secret write forbidden"
  ];
  allowedPolicySamples.forEach((sample) => {
    if (!isAllowedPolicyTextLine(sample)) throw new Error("allowed policy text not recognized: " + sample);
    counters.allowedPolicyTextCount += 1;
  });

  const dangerousSamples = [
    { name:"localStorage.setItem apiKey", sample:'localStorage.setItem("apiKey", "x")' },
    { name:"sessionStorage.setItem token", sample:'sessionStorage.setItem("token", "x")' },
    { name:"safeStorage secret read", sample:'safeStorage.decryptString(apiKeyBuffer)' },
    { name:"Keychain secret read", sample:'keytar.getPassword("provider", "apiKey")' },
    { name:"writeFile .env", sample:'writeFileSync(".env", "API_KEY=x")' },
    { name:"provider credential persisted", sample:'localStorage.setItem("providerCredential", "x")' },
    { name:"endpoint secret persisted", sample:'writeFileSync("config.json", endpointSecret)' }
  ];
  dangerousSamples.forEach(({ name, sample }) => {
    const found = matchingBlockedChecks(sample).some((check) => check.name === name);
    if (!found) throw new Error("dangerous sample not detected: " + name);
    counters.allowedTestAssertionCount += 1;
  });
}

function main() {
  runSelfTests();
  const files = listTrackedFiles().filter(shouldScan);
  const violations = [];

  files.forEach((file) => {
    const normalized = file.replace(/\\/g, "/");
    if (/(^|\/)\.env$/.test(normalized)) {
      counters.envSecretWriteCount += 1;
      counters.blockedPatternCount += 1;
      violations.push({ file, check:"tracked .env file" });
      return;
    }

    const full = path.join(ROOT, file);
    let text = "";
    try {
      text = fs.readFileSync(full, "utf8");
    } catch (_) {
      return;
    }

    text.split(/\r?\n/).forEach((line, index) => {
      if (isAllowedFixture(line)) {
        counters.allowedTestFixtureCount += 1;
        return;
      }
      if (isScannerRuleMetadataLine(normalized, line)) return;

      const matches = matchingBlockedChecks(line);
      if (!matches.length) {
        if (isAllowedPolicyTextLine(line)) counters.allowedPolicyTextCount += 1;
        return;
      }
      if (isAllowedPolicyTextLine(line) && !isExecutableDangerousLine(line)) {
        counters.allowedPolicyTextCount += 1;
        return;
      }
      matches.forEach((check) => {
        counters[check.counter] += 1;
        counters.blockedPatternCount += 1;
        violations.push({ file, line:index + 1, check:check.name });
      });
    });
  });

  console.log(violations.length ? "NO_SECRET_PERSISTENCE_GUARD FAIL" : "NO_SECRET_PERSISTENCE_GUARD PASS");
  console.log("mode=local_static_scan_only");
  console.log("network=disabled");
  console.log("scannedFileCount=" + files.length);
  console.log("blockedPatternCount=" + counters.blockedPatternCount);
  console.log("allowedPolicyTextCount=" + counters.allowedPolicyTextCount);
  console.log("allowedTestAssertionCount=" + counters.allowedTestAssertionCount);
  console.log("allowedTestFixtureCount=" + counters.allowedTestFixtureCount);
  console.log("realSecretReadCount=" + counters.realSecretReadCount);
  console.log("keychainAccessCount=" + counters.keychainAccessCount);
  console.log("safeStorageAccessCount=" + counters.safeStorageAccessCount);
  console.log("envSecretWriteCount=" + counters.envSecretWriteCount);
  console.log("localStorageSecretWriteCount=" + counters.localStorageSecretWriteCount);
  console.log("sessionStorageSecretWriteCount=" + counters.sessionStorageSecretWriteCount);
  console.log("rawPasswordPersistenceCount=" + counters.rawPasswordPersistenceCount);
  console.log("rawApiKeyDisplayCount=" + counters.rawApiKeyDisplayCount);
  console.log("providerCredentialPersistedCount=" + counters.providerCredentialPersistedCount);
  console.log("endpointSecretPersistedCount=" + counters.endpointSecretPersistedCount);
  console.log("redacted=true");

  violations.slice(0, 40).forEach((violation) => {
    console.error(`${violation.file}${violation.line ? ":" + violation.line : ""} ${violation.check}`);
  });

  if (violations.length) process.exit(1);
}

main();
