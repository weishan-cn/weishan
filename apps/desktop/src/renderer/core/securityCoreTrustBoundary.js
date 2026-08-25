;(function () {
  "use strict";

  const VERSION = "4.2.8";
  const MODULE_NAME = "security_core_trust_boundary_v1";
  const TRUST_LEVELS = Object.freeze({
    TRUSTED_INTERNAL_POLICY:"TRUSTED_INTERNAL_POLICY",
    VALIDATED_INTERNAL_STATE:"VALIDATED_INTERNAL_STATE",
    UNTRUSTED_USER_INPUT:"UNTRUSTED_USER_INPUT",
    UNTRUSTED_PROVIDER_CONTENT:"UNTRUSTED_PROVIDER_CONTENT",
    UNTRUSTED_MAIL_CONTENT:"UNTRUSTED_MAIL_CONTENT",
    UNTRUSTED_EXTERNAL_METADATA:"UNTRUSTED_EXTERNAL_METADATA"
  });
  const LIMITS = Object.freeze({ maxDepth:8, maxNodes:800, maxArrayLength:120, maxStringLength:20000, maxLogStringLength:2000 });
  const DANGEROUS_KEYS = Object.freeze(["__proto__", "prototype", "constructor"]);
  const SENSITIVE_KEYS = Object.freeze([
    "token", "accesstoken", "refreshtoken", "apikey", "api_key", "secret", "clientsecret", "client_secret",
    "password", "passwd", "pwd", "authorization", "cookie", "session", "credential", "credentials", "privatekey",
    "private_key", "challengepassword", "challenge_password", "otp", "verificationcode", "verification_code"
  ]);
  const AUTHORITY_KEYS = Object.freeze([
    "trusted", "validated", "isadmin", "admin", "authorizesexecution", "executiongate", "productiontraffic",
    "productionaffected", "safeurl", "exact", "exacthandoff", "trustedurl", "recommended", "current", "live",
    "production", "sendallowed", "autoreply", "archive", "delete", "credentialaccess", "secretaccess"
  ]);
  const SECRET_PATTERNS = Object.freeze([
    /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
    /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}\b/gi,
    /\b(?:api[_ -]?key|token|secret|client[_ -]?secret|authorization|password|passwd|pwd|challenge[_ -]?password)\b\s*[:=：]\s*["']?[^"'\s<>]{4,}/gi,
    /\b(?:otp|one[- ]time(?: password| code)?|verification code|验证码|安全码|code)\b\s*(?:is|为|是|[:：=])?\s*[0-9]{4,8}\b/gi
  ]);

  function text(value) {
    return String(value == null ? "" : value);
  }

  function keyName(value) {
    return text(value).replace(/[^a-z0-9]/gi, "").toLowerCase();
  }

  function isDangerousKey(key) {
    return DANGEROUS_KEYS.indexOf(text(key)) >= 0;
  }

  function isSensitiveKey(key) {
    const normalized = keyName(key);
    return SENSITIVE_KEYS.indexOf(normalized) >= 0;
  }

  function isAuthorityKey(key) {
    const normalized = keyName(key);
    return AUTHORITY_KEYS.indexOf(normalized) >= 0;
  }

  function redactSecretText(value) {
    let output = text(value);
    SECRET_PATTERNS.forEach(function (pattern) {
      output = output.replace(pattern, "[redacted]");
    });
    return output;
  }

  function sanitizePlainText(value, options) {
    const max = options && Number.isFinite(options.maxLength) ? Math.max(0, Math.min(options.maxLength, LIMITS.maxStringLength)) : LIMITS.maxStringLength;
    let output = redactSecretText(text(value))
      .replace(/\u0000/g, "")
      .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
      .replace(/\r\n?/g, "\n");
    if (output.length > max) output = output.slice(0, max) + "…";
    return output;
  }

  function sanitizeHtmlToText(value, options) {
    return sanitizePlainText(text(value)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
      .replace(/<embed[\s\S]*?<\/embed>/gi, " ")
      .replace(/<object[\s\S]*?<\/object>/gi, " ")
      .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, " ")
      .replace(/\b(?:href|src)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, function (match) {
        return /(?:javascript|data):/i.test(match) ? " " : match;
      })
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t\f\v]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim(), options);
  }

  function safeLogText(value) {
    return sanitizePlainText(value, { maxLength:LIMITS.maxLogStringLength })
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\b(?:ERROR|WARN|INFO|DEBUG|FATAL)\b\s*[:|-]/gi, "[level-redacted]");
  }

  function failure(code, stage) {
    return Object.freeze({
      ok:false,
      code:String(code || "SECURITY_CORE_REJECTED"),
      stage:String(stage || "SECURITY_CORE"),
      trustLevel:TRUST_LEVELS.UNTRUSTED_EXTERNAL_METADATA,
      value:null,
      redacted:true,
      authorizesExecution:false,
      productionTraffic:false,
      failClosed:true
    });
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }

  function cloneUntrustedPlain(input, options) {
    const policy = Object.assign({}, LIMITS, options && typeof options === "object" ? options : {});
    const seen = new Set();
    let nodes = 0;
    let droppedAuthorityKeyCount = 0;
    let droppedSensitiveKeyCount = 0;
    function copy(value, depth, key) {
      if (depth > policy.maxDepth) throw new Error("MAX_DEPTH_EXCEEDED");
      if (key && isDangerousKey(key)) throw new Error("DANGEROUS_KEY_REJECTED");
      if (key && isSensitiveKey(key)) { droppedSensitiveKeyCount += 1; return undefined; }
      if (key && isAuthorityKey(key)) { droppedAuthorityKeyCount += 1; return undefined; }
      if (value === null || typeof value === "boolean") return value;
      if (typeof value === "number") {
        if (!Number.isFinite(value)) throw new Error("INVALID_NUMBER");
        return value;
      }
      if (typeof value === "string") return sanitizePlainText(value, { maxLength:policy.maxStringLength });
      if (typeof value === "undefined" || typeof value === "function" || typeof value === "symbol" || typeof value === "bigint") throw new Error("UNSUPPORTED_VALUE_TYPE");
      if (!value || typeof value !== "object" || seen.has(value) || Object.getOwnPropertySymbols(value).length) throw new Error(seen.has(value) ? "CIRCULAR_REFERENCE" : "UNSUPPORTED_VALUE_TYPE");
      const isArray = Array.isArray(value);
      const prototype = Object.getPrototypeOf(value);
      const constructor = prototype && Object.getOwnPropertyDescriptor(prototype, "constructor");
      if (!isArray && prototype !== null && (!constructor || typeof constructor.value !== "function" || constructor.value.name !== "Object")) throw new Error("UNSUPPORTED_OBJECT_PROTOTYPE");
      const names = Object.getOwnPropertyNames(value);
      if (isArray && value.length > policy.maxArrayLength) throw new Error("ARRAY_LIMIT_EXCEEDED");
      seen.add(value);
      nodes += 1;
      if (nodes > policy.maxNodes) throw new Error("NODE_LIMIT_EXCEEDED");
      const output = isArray ? [] : {};
      names.forEach(function (name) {
        if (isArray && name === "length") return;
        if (isArray && /^\d+$/.test(name)) {
          const child = copy(Object.getOwnPropertyDescriptor(value, name).value, depth + 1, null);
          output[name] = child;
          return;
        }
        const descriptor = Object.getOwnPropertyDescriptor(value, name);
        if (!descriptor || descriptor.get || descriptor.set) throw new Error("ACCESSOR_REJECTED");
        const child = copy(descriptor.value, depth + 1, name);
        if (child !== undefined) output[name] = child;
      });
      seen.delete(value);
      return output;
    }
    try {
      const value = deepFreeze(copy(input, 0, null));
      return deepFreeze({
        ok:true,
        value,
        trustLevel:TRUST_LEVELS.VALIDATED_INTERNAL_STATE,
        originalTrustLevel:options && options.trustLevel || TRUST_LEVELS.UNTRUSTED_EXTERNAL_METADATA,
        droppedAuthorityKeyCount,
        droppedSensitiveKeyCount,
        redacted:true,
        authorizesExecution:false,
        productionTraffic:false,
        failClosed:true
      });
    } catch (error) {
      return failure(error && error.message || "INPUT_REJECTED", "CLONE_UNTRUSTED_PLAIN");
    }
  }

  function buildUntrustedContentEnvelope(input, options) {
    const safe = options && typeof options === "object" ? options : {};
    const trustLevel = TRUST_LEVELS[safe.trustLevel] || safe.trustLevel || TRUST_LEVELS.UNTRUSTED_EXTERNAL_METADATA;
    const cloned = cloneUntrustedPlain(input, { trustLevel });
    if (!cloned.ok) return cloned;
    return deepFreeze(Object.assign({}, cloned, {
      contentMayInfluenceUnderstanding:true,
      contentMayAuthorizeAction:false,
      contentMayChangePolicy:false,
      contentMayAccessSecrets:false,
      contentMayTriggerTransaction:false,
      trustLevel:TRUST_LEVELS.VALIDATED_INTERNAL_STATE,
      sourceTrustLevel:trustLevel
    }));
  }

  function buildSecurityCoreAuditSummary() {
    return deepFreeze({
      moduleName:MODULE_NAME,
      version:VERSION,
      trustLevels:Object.keys(TRUST_LEVELS),
      dangerousKeys:DANGEROUS_KEYS.slice(),
      authorityKeys:AUTHORITY_KEYS.slice(),
      secretRedaction:true,
      htmlExecutes:false,
      mailContentAuthority:false,
      providerContentAuthority:false,
      userInputAuthority:false,
      executionGate:"CLOSED",
      authorizesExecution:false,
      productionTraffic:false,
      redacted:true
    });
  }

  window.WeishanSecurityCoreTrustBoundary = Object.freeze({
    VERSION,
    MODULE_NAME,
    TRUST_LEVELS,
    LIMITS,
    DANGEROUS_KEYS,
    SENSITIVE_KEYS,
    AUTHORITY_KEYS,
    isDangerousKey,
    isSensitiveKey,
    isAuthorityKey,
    sanitizePlainText,
    sanitizeHtmlToText,
    redactSecretText,
    safeLogText,
    cloneUntrustedPlain,
    buildUntrustedContentEnvelope,
    buildSecurityCoreAuditSummary
  });
})();
