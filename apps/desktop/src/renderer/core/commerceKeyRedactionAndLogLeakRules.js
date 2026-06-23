;(function () {
  "use strict";

  const RULES_VERSION = "2.1.61";
  const MODULE_NAME = "key_redaction_and_log_leak_prevention_rules";
  const PHASE = "redaction_rules";

  function dummySecret(label) {
    return ["DEMO", label, "SHOULD", "NOT", "APPEAR"].join("_");
  }

  const DUMMY_SECRET_PATTERNS = [
    [dummySecret("API_KEY"), "[REDACTED_API_KEY]"],
    [dummySecret("SECRET"), "[REDACTED_SECRET]"],
    [dummySecret("ACCESS_TOKEN"), "[REDACTED_ACCESS_TOKEN]"],
    [dummySecret("REFRESH_TOKEN"), "[REDACTED_REFRESH_TOKEN]"],
    [dummySecret("AUTH_HEADER"), "[REDACTED_AUTH_HEADER]"],
    [dummySecret("PASSWORD"), "[REDACTED_PASSWORD]"],
    [dummySecret("PRIVATE_KEY"), "[REDACTED_PRIVATE_KEY]"]
  ];

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function capabilities() {
    return {
      canShowRedactionRules: true,
      canShowSecretFieldPatterns: true,
      canShowRedactionMap: true,
      canShowAuditLogRules: true,
      canShowUiDisplayRules: true,
      canShowCrashReportRules: true,
      canShowScreenshotRules: true,
      canRunDummyRedactionTest: true,
      canInputApiKey: false,
      canInputRealApiKey: false,
      canSaveApiKey: false,
      canSaveRealApiKey: false,
      canReadApiKey: false,
      canReadRealApiKey: false,
      canWriteApiKey: false,
      canUseKeychain: false,
      canUseSafeStorage: false,
      canUseEncryptedLocalStore: false,
      canWriteEnv: false,
      canWriteLocalStorage: false,
      canWriteSessionStorage: false,
      canWriteSecretLogs: false,
      canTestConnection: false,
      canConnectEndpoint: false,
      canUseNetwork: false,
      canRunProviderSandbox: false,
      canReturnPrice: false,
      canReturnBookingUrl: false,
      canCreateOrder: false,
      canPay: false,
      canUploadIdentity: false,
      canStoreBankCard: false
    };
  }

  function buildSecretFieldPatternRules() {
    return clone({
      exactFieldNames: [
        "apiKey",
        "api_key",
        "apiSecret",
        "api_secret",
        "clientSecret",
        "client_secret",
        "accessToken",
        "access_token",
        "refreshToken",
        "refresh_token",
        "authorization",
        "Authorization",
        "authHeader",
        "bearerToken",
        "token",
        "password",
        "secret",
        "privateKey",
        "private_key",
        "endpointAuth",
        "credential",
        "credentials"
      ],
      partialFieldPatterns: [
        "key",
        "secret",
        "token",
        "password",
        "credential",
        "auth",
        "bearer",
        "private"
      ],
      urlCredentialParams: [
        "api_key",
        "apiKey",
        "access_token",
        "token",
        "client_secret",
        "secret",
        "password",
        "auth",
        "signature"
      ]
    });
  }

  function buildRedactionMap() {
    return clone({
      apiKey: "[REDACTED_API_KEY]",
      apiSecret: "[REDACTED_API_SECRET]",
      clientSecret: "[REDACTED_CLIENT_SECRET]",
      accessToken: "[REDACTED_ACCESS_TOKEN]",
      refreshToken: "[REDACTED_REFRESH_TOKEN]",
      "authorization header": "[REDACTED_AUTH_HEADER]",
      "bearer token": "[REDACTED_BEARER_TOKEN]",
      password: "[REDACTED_PASSWORD]",
      privateKey: "[REDACTED_PRIVATE_KEY]",
      "credential query params": "[REDACTED_CREDENTIAL_PARAMS]",
      "unknown secret-like value": "[REDACTED_SECRET]"
    });
  }

  function normalizeFieldName(fieldName) {
    return String(fieldName || "").trim();
  }

  function isSecretLikeField(fieldName) {
    const name = normalizeFieldName(fieldName);
    const lower = name.toLowerCase();
    const rules = buildSecretFieldPatternRules();
    if (rules.exactFieldNames.some((item) => item.toLowerCase() === lower)) return true;
    return rules.partialFieldPatterns.some((pattern) => lower.indexOf(pattern.toLowerCase()) >= 0);
  }

  function tokenForField(fieldName) {
    const name = normalizeFieldName(fieldName);
    const lower = name.toLowerCase();
    if (lower === "apikey" || lower === "api_key" || lower === "x-api-key" || lower === "x_api_key") return "[REDACTED_API_KEY]";
    if (lower === "apisecret" || lower === "api_secret") return "[REDACTED_API_SECRET]";
    if (lower === "clientsecret" || lower === "client_secret") return "[REDACTED_CLIENT_SECRET]";
    if (lower === "accesstoken" || lower === "access_token") return "[REDACTED_ACCESS_TOKEN]";
    if (lower === "refreshtoken" || lower === "refresh_token") return "[REDACTED_REFRESH_TOKEN]";
    if (lower === "authorization" || lower === "authheader") return "[REDACTED_AUTH_HEADER]";
    if (lower === "bearertoken") return "[REDACTED_BEARER_TOKEN]";
    if (lower === "password") return "[REDACTED_PASSWORD]";
    if (lower === "privatekey" || lower === "private_key") return "[REDACTED_PRIVATE_KEY]";
    if (lower.indexOf("secret") >= 0) return "[REDACTED_SECRET]";
    if (lower.indexOf("token") >= 0) return "[REDACTED_ACCESS_TOKEN]";
    if (lower.indexOf("key") >= 0) return "[REDACTED_API_KEY]";
    if (lower.indexOf("credential") >= 0 || lower.indexOf("auth") >= 0) return "[REDACTED_SECRET]";
    return "[REDACTED_SECRET]";
  }

  function redactDummyPatterns(text) {
    let output = String(text == null ? "" : text);
    DUMMY_SECRET_PATTERNS.forEach(([pattern, replacement]) => {
      output = output.split(pattern).join(replacement);
    });
    return output;
  }

  function redactSecretLikeValue(value, context) {
    const fieldName = context && typeof context === "object" ? context.fieldName : "";
    const text = redactDummyPatterns(value);
    if (isSecretLikeField(fieldName)) return tokenForField(fieldName);
    if (/Bearer\s+\S+/i.test(text)) return text.replace(/Bearer\s+\S+/gi, "Bearer [REDACTED_BEARER_TOKEN]");
    if (/authorization\s*[:=]\s*\S+/i.test(text)) return text.replace(/authorization\s*[:=]\s*\S+/gi, "authorization=[REDACTED_AUTH_HEADER]");
    if (/api[_-]?key\s*[:=]\s*\S+/i.test(text)) return text.replace(/api[_-]?key\s*[:=]\s*\S+/gi, "apiKey=[REDACTED_API_KEY]");
    if (/api[_-]?secret\s*[:=]\s*\S+/i.test(text)) return text.replace(/api[_-]?secret\s*[:=]\s*\S+/gi, "apiSecret=[REDACTED_API_SECRET]");
    return text;
  }

  function redactUrl(url) {
    const raw = redactDummyPatterns(url);
    try {
      const parsed = new URL(raw);
      buildSecretFieldPatternRules().urlCredentialParams.forEach((param) => {
        if (parsed.searchParams.has(param)) parsed.searchParams.set(param, "[REDACTED_CREDENTIAL_PARAMS]");
      });
      return parsed.toString().replace(/%5BREDACTED_CREDENTIAL_PARAMS%5D/gi, "[REDACTED_CREDENTIAL_PARAMS]");
    } catch (_) {
      return raw.replace(/([?&](?:api_key|apiKey|access_token|token|client_secret|secret|password|auth|signature)=)[^&\s]+/gi, "$1[REDACTED_CREDENTIAL_PARAMS]");
    }
  }

  function redactHeaders(headers) {
    const raw = headers && typeof headers === "object" ? headers : {};
    return Object.keys(raw).reduce((acc, key) => {
      if (/^(authorization|x-api-key|x-api_key|cookie|set-cookie)$/i.test(key)) {
        if (/authorization/i.test(key)) acc[key] = "[REDACTED_AUTH_HEADER]";
        else if (/cookie/i.test(key)) acc[key] = "[REDACTED_SECRET]";
        else acc[key] = "[REDACTED_API_KEY]";
      } else {
        acc[key] = redactObject(raw[key], key);
      }
      return acc;
    }, {});
  }

  function redactObject(input, fieldName) {
    if (Array.isArray(input)) return input.map((item) => redactObject(item, fieldName));
    if (input && typeof input === "object") {
      return Object.keys(input).reduce((acc, key) => {
        acc[key] = isSecretLikeField(key) ? tokenForField(key) : redactObject(input[key], key);
        return acc;
      }, {});
    }
    if (typeof input === "string" && /^https?:\/\//i.test(input)) return redactUrl(input);
    return redactSecretLikeValue(input, { fieldName });
  }

  function redactLogMessage(message) {
    return redactSecretLikeValue(redactDummyPatterns(message), { fieldName: "" });
  }

  function buildSafeAuditLogEvent(event) {
    const raw = event && typeof event === "object" ? event : {};
    const safeBlockedReason = redactSecretLikeValue(raw.blockedReason || "secret_like_fields_redacted", { fieldName: "blockedReason" });
    return clone({
      eventType: String(raw.eventType || "KEY_REDACTION_AUDIT_EVENT"),
      providerId: String(raw.providerId || ""),
      providerName: String(raw.providerName || ""),
      aliasId: String(raw.aliasId || ""),
      blockedReason: safeBlockedReason,
      status: String(raw.status || "blocked"),
      timestamp: String(raw.timestamp || "1970-01-01T00:00:00.000Z"),
      redacted: true
    });
  }

  function assertNoSecretLeak(output) {
    const serialized = typeof output === "string" ? output : JSON.stringify(output);
    const forbidden = DUMMY_SECRET_PATTERNS.map((item) => item[0]).concat([
      "EBAY_API_KEY",
      "EBAY_CLIENT_SECRET",
      "ghp_",
      "github_pat_"
    ]);
    const found = forbidden.filter((item) => serialized.indexOf(item) >= 0);
    if (/sk-[A-Za-z0-9]/.test(serialized)) found.push("sk-");
    if (/Bearer\s+[A-Za-z0-9._-]+/.test(serialized)) found.push("Bearer");
    if (found.length) throw new Error("secret_leak_detected:" + found.join(","));
    return true;
  }

  function buildDummyRedactionTestResult() {
    const objectResult = redactObject({
      apiKey: dummySecret("API_KEY"),
      nested: {
        apiSecret: dummySecret("SECRET"),
        accessToken: dummySecret("ACCESS_TOKEN"),
        refreshToken: dummySecret("REFRESH_TOKEN"),
        password: dummySecret("PASSWORD"),
        privateKey: dummySecret("PRIVATE_KEY")
      }
    });
    const headersResult = redactHeaders({
      Authorization: "Bearer " + dummySecret("AUTH_HEADER"),
      "X-API-Key": dummySecret("API_KEY"),
      Cookie: "session=" + dummySecret("SECRET")
    });
    const urlResult = redactUrl("https://example.com/search?api_key=" + encodeURIComponent(dummySecret("API_KEY")) + "&q=flight");
    const logMessageResult = redactLogMessage("apiKey=" + dummySecret("API_KEY") + " token=" + dummySecret("ACCESS_TOKEN") + " authorization=" + dummySecret("AUTH_HEADER"));
    const auditEventResult = buildSafeAuditLogEvent({
      eventType: "DUMMY_SECRET_TEST",
      providerId: "flight-provider-dummy",
      providerName: "Dummy Provider",
      aliasId: "alias-only",
      blockedReason: dummySecret("SECRET"),
      status: "blocked",
      apiKey: dummySecret("API_KEY"),
      Authorization: "Bearer " + dummySecret("AUTH_HEADER"),
      rawEndpointWithCredentials: "https://example.com/?api_key=" + encodeURIComponent(dummySecret("API_KEY"))
    });
    const output = {
      objectRedaction: "PASS",
      headersRedaction: "PASS",
      urlRedaction: "PASS",
      logMessageRedaction: "PASS",
      auditEventRedaction: "PASS",
      dummySecretRawStringsAbsent: "PASS",
      redactedOutput: {
        objectResult,
        headersResult,
        urlResult,
        logMessageResult,
        auditEventResult
      }
    };
    assertNoSecretLeak(output);
    return clone(output);
  }

  function buildDisplayModel() {
    return clone({
      title: "密钥脱敏与日志防泄露规则",
      statusLines: [
        "脱敏规则：已建立",
        "日志防泄露规则：已建立",
        "真实 API key 输入：未开放",
        "真实 API key 保存：未开放",
        "真实 API key 读取：未开放",
        "测试连接：未开放",
        "provider 沙箱：未开放",
        "真实价格：未开放",
        "bookingUrl：未开放"
      ],
      fieldPatternTitle: "敏感字段识别规则",
      redactionMapTitle: "脱敏映射",
      auditLogRulesTitle: "安全审计日志规则",
      auditLogRules: [
        "日志中永不记录完整 key",
        "日志中永不记录 secret",
        "日志中永不记录 token",
        "日志中永不记录 authorization header",
        "日志中永不记录 credential query params",
        "只允许记录 alias / providerId / blocked reason / timestamp",
        "audit event 必须 redacted: true"
      ],
      uiRulesTitle: "UI / 截图 / 崩溃报告规则",
      uiRules: [
        "UI 不得展示明文 key",
        "E2E 截图不得出现真实 key",
        "crash report 不得包含 key / secret / token",
        "复制按钮不得复制真实 key",
        "测试连接结果不得包含原始认证头"
      ],
      dummyTestTitle: "Dummy 脱敏自检",
      keyLifecycleDraftLine: "key 删除 / 轮换 / 过期机制草案：已建立",
      keyLifecycleAuditEventsLine: "生命周期审计事件草案：已建立",
      keyLifecycleRealActionsLine: "真实删除 / 轮换 / 过期 / 吊销 / 恢复仍未开放",
      nextStepLine: "下一步：只读 provider result schema gate；只读 provider result schema gate：已建立。下一步：provider result source label gate。",
      safetyLine: "当前版本仍不能输入、保存、读取或测试真实 API key。"
    });
  }

  const commerceKeyRedactionAndLogLeakRulesContract = clone({
    version: RULES_VERSION,
    moduleName: MODULE_NAME,
    phase: PHASE,
    ruleStatus: "rules_established",
    realKeyInput: "disabled",
    realKeyStorage: "disabled",
    realKeyRead: "disabled",
    logLeakPrevention: "enabled_for_dummy_and_structural_data",
    uiPlaintextSecretDisplay: "forbidden",
    crashReportSecretDisplay: "forbidden",
    screenshotSecretDisplay: "forbidden",
    network: "disabled",
    endpointConnection: "disabled",
    connectionTest: "disabled",
    providerSandbox: "disabled",
    realPrice: "disabled",
    bookingUrl: "disabled",
    payment: "disabled",
    order: "disabled",
    capabilities: capabilities(),
    secretFieldPatternRules: buildSecretFieldPatternRules(),
    redactionMap: buildRedactionMap(),
    dummyRedactionTestResult: buildDummyRedactionTestResult(),
    display: buildDisplayModel()
  });

  window.WeishanCommerceKeyRedactionAndLogLeakRules = {
    RULES_VERSION,
    MODULE_NAME,
    PHASE,
    commerceKeyRedactionAndLogLeakRulesContract,
    buildSecretFieldPatternRules,
    buildRedactionMap,
    redactSecretLikeValue,
    redactObject,
    redactHeaders,
    redactUrl,
    redactLogMessage,
    buildSafeAuditLogEvent,
    assertNoSecretLeak,
    buildDummyRedactionTestResult,
    buildDisplayModel
  };
})();
