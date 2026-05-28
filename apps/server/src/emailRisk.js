import fs from "fs";
import path from "path";
import dns from "dns/promises";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const topProviders = JSON.parse(fs.readFileSync(path.join(__dirname, "rules/top-email-providers.json"), "utf8"));
const disposableDomains = JSON.parse(fs.readFileSync(path.join(__dirname, "rules/disposable-email-domains.json"), "utf8"));
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function randomLikeScore(localPart) {
  let score = 0;
  const len = localPart.length;
  const digits = (localPart.match(/\d/g) || []).length;
  const letters = (localPart.match(/[a-z]/gi) || []).length;
  const vowels = (localPart.match(/[aeiou]/gi) || []).length;
  if (len >= 14) score += 15;
  if (digits >= 5) score += 25;
  if (letters >= 8 && vowels <= 1) score += 20;
  if (/^[a-z0-9]{10,}$/i.test(localPart) && digits >= 3) score += 20;
  if (/(.)\1{4,}/.test(localPart)) score += 15;
  if (/test|fake|spam|bot|robot|asdf|qwer/i.test(localPart)) score += 20;
  return Math.min(score, 70);
}

export async function validateEmailRisk(email) {
  const normalized = String(email || "").trim().toLowerCase();
  const result = {
    email: normalized,
    validFormat: false,
    domain: null,
    hasMx: false,
    providerType: "unknown",
    isTopProvider: false,
    isDisposable: false,
    isCorporateLike: false,
    randomLikeScore: 0,
    riskScore: 100,
    riskLevel: "high",
    recommendation: "reject",
    checks: []
  };

  if (!emailRegex.test(normalized)) {
    result.checks.push("Invalid email format");
    return result;
  }

  result.validFormat = true;
  const [localPart, domain] = normalized.split("@");
  result.domain = domain;
  result.isTopProvider = topProviders.includes(domain);
  result.isDisposable = disposableDomains.includes(domain);
  result.isCorporateLike = !result.isTopProvider && !result.isDisposable;
  result.randomLikeScore = randomLikeScore(localPart);

  if (result.isDisposable) result.providerType = "disposable";
  else if (result.isTopProvider) result.providerType = "top_provider";
  else result.providerType = "corporate_or_custom_domain";

  try {
    const mx = await dns.resolveMx(domain);
    result.hasMx = Array.isArray(mx) && mx.length > 0;
  } catch {
    result.hasMx = false;
  }

  let risk = 0;
  if (!result.hasMx) risk += 45;
  if (result.isDisposable) risk += 70;
  if (result.isCorporateLike && result.hasMx) risk -= 15;
  if (result.isTopProvider && result.hasMx) risk -= 10;
  risk += result.randomLikeScore;
  risk = Math.max(0, Math.min(100, risk));

  result.riskScore = risk;
  if (risk <= 25) {
    result.riskLevel = "low";
    result.recommendation = "allow_with_email_verification";
  } else if (risk <= 60) {
    result.riskLevel = "medium";
    result.recommendation = "require_email_verification_or_review";
  } else {
    result.riskLevel = "high";
    result.recommendation = "reject_or_manual_review";
  }

  result.checks.push(result.validFormat ? "Format passed" : "Format failed");
  result.checks.push(result.hasMx ? "MX record found" : "No MX record");
  result.checks.push(result.isTopProvider ? "Top provider" : "Not top provider");
  result.checks.push(result.isDisposable ? "Disposable email domain" : "Not disposable domain");
  result.checks.push(result.isCorporateLike ? "Corporate/custom domain candidate" : "Consumer provider or disposable domain");
  return result;
}
