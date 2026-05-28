const { existsSync, readFileSync, readdirSync, statSync } = require("fs");
const { join, relative } = require("path");

const root = join(__dirname, "..");
const DEFAULT_TARGETS = ["apps", "scripts", "package.json", "README.md"];
const SKIP_DIRS = new Set([".git", "node_modules", "dist", "build", "out", "coverage"]);

const RULES = [
  { name:"openai-like-key", severity:"fail", pattern:/\bsk-[A-Za-z0-9_-]{16,}\b/g },
  { name:"bearer-token", severity:"fail", pattern:/\b(?:Authorization\s*:\s*)?Bearer\s+[A-Za-z0-9._~+/=-]{20,}/gi },
  { name:"api-key-assignment", severity:"warn", pattern:/\b(?:apiKey|api_key|API_KEY)\b\s*[:=]\s*["'][^"']{8,}["']/g },
  { name:"password-assignment", severity:"warn", pattern:/\b(?:password|PASSWORD)\b\s*[:=]\s*["'][^"']{6,}["']/g },
  { name:"token-assignment", severity:"warn", pattern:/\b(?:token|ACCESS_TOKEN)\b\s*[:=]\s*["'][^"']{8,}["']/g },
  { name:"secret-assignment", severity:"warn", pattern:/\b(?:secret|SECRET_KEY)\b\s*[:=]\s*["'][^"']{8,}["']/g },
  { name:"private-key-block", severity:"fail", pattern:/BEGIN (?:RSA )?PRIVATE KEY/g }
];

function shouldSkipPath(fullPath) {
  const rel = relative(root, fullPath);
  return rel.split(/[\\/]/).some((part) => SKIP_DIRS.has(part));
}

function walkPath(target, files) {
  const full = join(root, target);
  if (!existsSync(full) || shouldSkipPath(full)) return files;
  const stat = statSync(full);
  if (stat.isDirectory()) {
    readdirSync(full).forEach((entry) => walkPath(join(target, entry), files));
    return files;
  }
  if (/\.(js|json|html|md|env|txt|yml|yaml|toml)$/i.test(full) && !/package-lock\.json$/i.test(full)) files.push(full);
  return files;
}

function isLikelyRedaction(line) {
  return /\[redacted\]|redacted|placeholder|example|dummy|mock|脱敏|示例/i.test(line);
}

function maskSnippet(line) {
  const text = String(line || "").trim().slice(0, 220);
  return text
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, (value) => "sk-****" + value.slice(-4))
    .replace(/\b(Bearer\s+)[A-Za-z0-9._~+/=-]{8,}/gi, "$1****")
    .replace(/(["'])[A-Za-z0-9._~+/=-]{12,}\1/g, (value) => value[0] + "****" + value.slice(-5))
    .replace(/BEGIN (?:RSA )?PRIVATE KEY/g, "BEGIN **** PRIVATE KEY");
}

function scanLine(line, file, lineNumber) {
  const findings = [];
  RULES.forEach((rule) => {
    rule.pattern.lastIndex = 0;
    if (!rule.pattern.test(line)) return;
    const redactionLine = isLikelyRedaction(line);
    const severity = redactionLine && rule.severity === "fail" ? "warn" : rule.severity;
    if (redactionLine && rule.severity === "warn") return;
    findings.push({
      file,
      line:lineNumber,
      rule:rule.name,
      severity,
      maskedSnippet:maskSnippet(line)
    });
  });
  return findings;
}

function runSecretScan(options) {
  const opts = options || {};
  const targets = opts.targets || DEFAULT_TARGETS;
  const files = targets.reduce((acc, target) => walkPath(target, acc), []);
  const findings = [];
  files.forEach((fullPath) => {
    let text = "";
    try {
      text = readFileSync(fullPath, "utf8");
    } catch (_) {
      return;
    }
    const rel = relative(root, fullPath);
    text.split(/\r?\n/).forEach((line, index) => {
      findings.push(...scanLine(line, rel, index + 1));
    });
  });
  const counts = findings.reduce((acc, item) => {
    acc[item.severity] = (acc[item.severity] || 0) + 1;
    return acc;
  }, { warn:0, fail:0 });
  const status = counts.fail > 0 ? "FAIL" : (counts.warn > 0 ? "WARN" : "PASS");
  return { status, findings, counts, scannedFiles:files.length };
}

function printSecretScan(result) {
  result.findings.forEach((item) => {
    console.log("[" + item.severity.toUpperCase() + "] " + item.file + ":" + item.line + " " + item.rule + " - " + item.maskedSnippet);
  });
  console.log("SECRET_SCAN " + result.status);
}

if (require.main === module) {
  const result = runSecretScan();
  printSecretScan(result);
  if (result.status === "FAIL") process.exitCode = 1;
}

module.exports = { runSecretScan };
