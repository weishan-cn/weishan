;(function () {
  "use strict";

  const DRAFT_VERSION = "2.1.38";
  const DRAFT_NAME = "local_secure_storage_interface_draft";
  const PHASE = "local_secure_storage_interface_draft";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function disabledCapabilities() {
    return {
      canShowInterfaceDraft: true,
      canShowDataModelDraft: true,
      canShowMethodDraft: true,
      canShowBackendCandidates: true,
      canShowAuditDraft: true,
      canShowRedactionDraft: true,
      canInputApiKey: false,
      canSaveApiKey: false,
      canReadApiKey: false,
      canDeleteApiKey: false,
      canRotateApiKey: false,
      canUseKeychain: false,
      canUseSafeStorage: false,
      canWriteEncryptedLocalStore: false,
      canWriteEnv: false,
      canWriteLocalStorage: false,
      canWriteSessionStorage: false,
      canWriteLogs: false,
      canTestConnection: false,
      canConnectEndpoint: false,
      canUseNetwork: false,
      canRunProviderSandbox: false,
      canReturnPrice: false,
      canReturnBookingUrl: false,
      canOpenBookingUrl: false,
      canCreateOrder: false,
      canPay: false,
      canUploadIdentity: false,
      canStoreIdentity: false,
      canStorePassport: false,
      canStoreBankCard: false
    };
  }

  function buildLocalSecureStorageDataModelDraft() {
    return clone({
      keyAliasModel: {
        keyAliasId: "field:keyAliasId",
        providerId: "field:providerId",
        providerName: "field:providerName",
        permissionType: "field:permissionType_readonly_only",
        region: "field:region",
        currency: "field:currency",
        status: "field:status_draft_only",
        displayName: "field:displayName",
        maskedPreview: "field:maskedPreview_redacted_only",
        createdAt: "field:createdAt",
        updatedAt: "field:updatedAt"
      },
      keySecretModel: {
        secretRef: "field:secretRef_reference_only",
        encryptedPayloadRef: "field:encryptedPayloadRef_reference_only",
        backendType: "field:backendType_candidate_only",
        keyVersion: "field:keyVersion",
        rotationVersion: "field:rotationVersion",
        rotationRequiredAt: "field:rotationRequiredAt",
        lastReadAt: "field:lastReadAt_disabled",
        status: "field:status_not_stored"
      },
      providerBindingModel: {
        bindingId: "field:bindingId",
        providerId: "field:providerId",
        providerName: "field:providerName",
        keyAliasId: "field:keyAliasId",
        endpointAllowlistStatus: "field:endpointAllowlistStatus_not_approved",
        sandboxStatus: "field:sandboxStatus_disabled",
        readonlyPriceStatus: "field:readonlyPriceStatus_disabled",
        bookingUrlStatus: "field:bookingUrlStatus_disabled",
        allowCreateOrder: false,
        allowPayment: false,
        allowIdentityUpload: false,
        status: "draft_only"
      }
    });
  }

  function blockedMethod(name, reason) {
    return clone({
      methodName: name,
      status: name === "prepareKeyAliasDraft" ? "draft_only" : "blocked",
      allowed: false,
      canPersist: false,
      canReadSecret: false,
      canUseNetwork: false,
      canReturnPrice: false,
      canReturnBookingUrl: false,
      reason
    });
  }

  function buildLocalSecureStorageMethodDraft() {
    return clone({
      prepareKeyAliasDraft: blockedMethod("prepareKeyAliasDraft", "alias_draft_only_no_real_key"),
      prepareSecretWriteDraft: blockedMethod("prepareSecretWriteDraft", "secret_write_blocked"),
      prepareSecretReadDraft: blockedMethod("prepareSecretReadDraft", "secret_read_blocked"),
      prepareSecretDeleteDraft: blockedMethod("prepareSecretDeleteDraft", "secret_delete_blocked"),
      prepareSecretRotateDraft: blockedMethod("prepareSecretRotateDraft", "secret_rotate_blocked"),
      prepareConnectionTestDraft: blockedMethod("prepareConnectionTestDraft", "endpoint_connection_disabled"),
      prepareProviderSandboxDraft: blockedMethod("prepareProviderSandboxDraft", "provider_sandbox_disabled"),
      prepareRealPriceReadDraft: blockedMethod("prepareRealPriceReadDraft", "real_price_read_blocked"),
      prepareBookingUrlDraft: blockedMethod("prepareBookingUrlDraft", "booking_url_disabled")
    });
  }

  function buildLocalSecureStorageBackendCandidates() {
    return clone([
      { backendType: "macOS Keychain", candidateStatus: "candidate_only", connected: false, canRead: false, canWrite: false, canDelete: false, canRotate: false, displayLine: "macOS Keychain：候选，未连接" },
      { backendType: "Electron safeStorage + encrypted file", candidateStatus: "candidate_only", connected: false, canRead: false, canWrite: false, canDelete: false, canRotate: false, displayLine: "Electron safeStorage + encrypted file：候选，未实现" },
      { backendType: "encrypted local config", candidateStatus: "candidate_only", connected: false, canRead: false, canWrite: false, canDelete: false, canRotate: false, displayLine: "encrypted local config：候选，未实现" },
      { backendType: "enterprise managed secret", candidateStatus: "candidate_only", connected: false, canRead: false, canWrite: false, canDelete: false, canRotate: false, displayLine: "enterprise managed secret：候选，未实现" }
    ]);
  }

  function buildLocalSecureStorageAuditDraft() {
    return clone({
      auditStatus: "draft_only",
      events: [
        "KEY_ALIAS_CREATED_DRAFT",
        "KEY_WRITE_BLOCKED",
        "KEY_READ_BLOCKED",
        "KEY_DELETE_BLOCKED",
        "KEY_ROTATE_BLOCKED",
        "CONNECTION_TEST_BLOCKED",
        "PROVIDER_SANDBOX_BLOCKED",
        "REAL_PRICE_BLOCKED",
        "BOOKING_URL_BLOCKED"
      ],
      rules: [
        "审计日志不得记录 key 明文",
        "审计日志不得记录 secret 明文",
        "审计日志不得记录 access token",
        "审计日志只允许记录 key alias",
        "错误信息必须先经过脱敏函数"
      ]
    });
  }

  function redactSecretLikeValue(value) {
    const text = String(value == null ? "" : value);
    return text
      .replace(/sk-[A-Za-z0-9_-]+|api[_-]?key=[^&\s]+/gi, "[REDACTED_API_KEY]")
      .replace(/api[_-]?secret=[^&\s]+|client[_-]?secret=[^&\s]+/gi, "[REDACTED_API_SECRET]")
      .replace(/access[_-]?token=[^&\s]+|refresh[_-]?token=[^&\s]+/gi, "[REDACTED_ACCESS_TOKEN]")
      .replace(/authorization:\s*bearer\s+[A-Za-z0-9._-]+/gi, "authorization: [REDACTED_AUTH_HEADER]");
  }

  function redactObject(input) {
    if (Array.isArray(input)) return input.map(redactObject);
    if (!input || typeof input !== "object") return redactSecretLikeValue(input);
    return Object.keys(input).reduce((acc, key) => {
      if (/api.?key|api.?secret|access.?token|refresh.?token|authorization|password|secret/i.test(key)) {
        if (/authorization/i.test(key)) acc[key] = "[REDACTED_AUTH_HEADER]";
        else if (/secret|password/i.test(key)) acc[key] = "[REDACTED_API_SECRET]";
        else if (/token/i.test(key)) acc[key] = "[REDACTED_ACCESS_TOKEN]";
        else acc[key] = "[REDACTED_API_KEY]";
      } else {
        acc[key] = redactObject(input[key]);
      }
      return acc;
    }, {});
  }

  function redactHeaders(headers) {
    return redactObject(headers || {});
  }

  function redactUrl(url) {
    return redactSecretLikeValue(String(url || "")).replace(/([?&](?:key|token|api_key|client_secret)=)[^&\s]+/gi, "$1[REDACTED_CREDENTIAL_PARAMS]");
  }

  function buildLocalSecureStorageRedactionDraft() {
    const demoObject = redactObject({
      apiKey: "sample key placeholder",
      apiSecret: "sample secret placeholder",
      accessToken: "sample token placeholder",
      authorization: "sample authorization header"
    });
    return clone({
      redactionStatus: "draft_only",
      placeholders: {
        apiKey: "[REDACTED_API_KEY]",
        apiSecret: "[REDACTED_API_SECRET]",
        accessToken: "[REDACTED_ACCESS_TOKEN]",
        authorizationHeader: "[REDACTED_AUTH_HEADER]",
        credentialParams: "[REDACTED_CREDENTIAL_PARAMS]"
      },
      functions: [
        "redactSecretLikeValue",
        "redactObject",
        "redactHeaders",
        "redactUrl"
      ],
      sampleRedactedObject: demoObject,
      sampleRedactedUrl: redactUrl("https://example.invalid/search?credential=sample-placeholder")
    });
  }

  function buildLocalSecureStorageInterfaceDraft(input) {
    const raw = input && typeof input === "object" ? input : {};
    return clone(Object.assign({
      version: DRAFT_VERSION,
      draftName: DRAFT_NAME,
      phase: PHASE,
      draftStatus: "draft_only",
      implementationStatus: "not_implemented",
      realKeyStorage: "disabled",
      keyInputMode: "disabled",
      keySaveMode: "disabled",
      keyReadMode: "disabled",
      keyDeleteMode: "disabled",
      keyRotationMode: "disabled",
      keychainMode: "disabled",
      safeStorageMode: "disabled",
      encryptedLocalStoreMode: "disabled",
      endpointMode: "disabled",
      networkMode: "disabled",
      priceMode: "disabled",
      bookingUrlMode: "disabled",
      orderMode: "disabled",
      paymentMode: "disabled",
      identityStorageMode: "disabled",
      keyRedactionAndLogLeakRules: "established",
      nextRequiredStep: "readonly_provider_result_schema_gate",
      capabilities: disabledCapabilities(),
      dataModelDraft: buildLocalSecureStorageDataModelDraft(),
      methodDraft: buildLocalSecureStorageMethodDraft(),
      backendCandidates: buildLocalSecureStorageBackendCandidates(),
      auditDraft: buildLocalSecureStorageAuditDraft(),
      redactionDraft: buildLocalSecureStorageRedactionDraft(),
      display: {
        title: "本机安全存储接口草案",
        currentStatusLine: "接口草案：已建立",
        implementationLine: "真实实现：未启用",
        keyInputLine: "真实 API key 输入：未开放",
        keySaveLine: "真实 API key 保存：未开放",
        keyReadLine: "真实 API key 读取：未开放",
        keyDeleteRotateLine: "删除 / 轮换：未开放",
        connectionTestLine: "测试连接：未开放",
        providerSandboxLine: "provider 沙箱：未开放",
        priceLine: "真实价格：未开放",
        bookingUrlLine: "bookingUrl：未开放",
        redactionRulesLine: "密钥脱敏与日志防泄露规则：已建立",
        keyLifecycleDraftLine: "key 删除 / 轮换 / 过期机制草案：已建立",
        keyLifecycleRealActionsLine: "真实删除 / 轮换 / 过期仍未开放",
        nextStepLine: "下一步：只读 provider result schema gate；只读 provider result schema gate：已建立。下一步：provider result source label gate",
        safetyLine: "当前版本仍不能输入、保存、读取或测试真实 API key。"
      }
    }, raw, {
      version: DRAFT_VERSION,
      draftName: DRAFT_NAME,
      phase: PHASE,
      draftStatus: "draft_only",
      implementationStatus: "not_implemented",
      capabilities: Object.assign(disabledCapabilities(), raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}, disabledCapabilities()),
      dataModelDraft: raw.dataModelDraft && typeof raw.dataModelDraft === "object" ? raw.dataModelDraft : buildLocalSecureStorageDataModelDraft(),
      methodDraft: raw.methodDraft && typeof raw.methodDraft === "object" ? raw.methodDraft : buildLocalSecureStorageMethodDraft(),
      backendCandidates: Array.isArray(raw.backendCandidates) ? raw.backendCandidates.slice() : buildLocalSecureStorageBackendCandidates(),
      auditDraft: raw.auditDraft && typeof raw.auditDraft === "object" ? raw.auditDraft : buildLocalSecureStorageAuditDraft(),
      redactionDraft: raw.redactionDraft && typeof raw.redactionDraft === "object" ? raw.redactionDraft : buildLocalSecureStorageRedactionDraft(),
      display: Object.assign({}, {
        title: "本机安全存储接口草案",
        currentStatusLine: "接口草案：已建立",
        implementationLine: "真实实现：未启用",
        keyInputLine: "真实 API key 输入：未开放",
        keySaveLine: "真实 API key 保存：未开放",
        keyReadLine: "真实 API key 读取：未开放",
        keyDeleteRotateLine: "删除 / 轮换：未开放",
        connectionTestLine: "测试连接：未开放",
        providerSandboxLine: "provider 沙箱：未开放",
        priceLine: "真实价格：未开放",
        bookingUrlLine: "bookingUrl：未开放",
        redactionRulesLine: "密钥脱敏与日志防泄露规则：已建立",
        keyLifecycleDraftLine: "key 删除 / 轮换 / 过期机制草案：已建立",
        keyLifecycleRealActionsLine: "真实删除 / 轮换 / 过期仍未开放",
        nextStepLine: "下一步：只读 provider result schema gate；只读 provider result schema gate：已建立。下一步：provider result source label gate",
        safetyLine: "当前版本仍不能输入、保存、读取或测试真实 API key。"
      }, raw.display && typeof raw.display === "object" ? raw.display : {})
    }));
  }

  function evaluateLocalSecureStorageInterfaceDraft(input) {
    const draft = buildLocalSecureStorageInterfaceDraft(input);
    return clone({
      allowed: false,
      draftStatus: draft.draftStatus,
      implementationStatus: draft.implementationStatus,
      gateStatus: "closed",
      nextRequiredStep: "readonly_provider_result_schema_gate",
      safetySummary: "本机安全存储接口仍为草案；key 生命周期草案已建立，但不能输入、保存、读取、删除、轮换或测试真实 API key，不能连接 endpoint，不能联网，不能返回价格或 bookingUrl。"
    });
  }

  function assertLocalSecureStorageInterfaceDraftSafe(input) {
    const draft = buildLocalSecureStorageInterfaceDraft(input);
    const issues = [];
    if (draft.version !== DRAFT_VERSION) issues.push("version");
    if (draft.draftStatus !== "draft_only") issues.push("draftStatus");
    if (draft.implementationStatus !== "not_implemented") issues.push("implementationStatus");
    [
      "canInputApiKey",
      "canSaveApiKey",
      "canReadApiKey",
      "canDeleteApiKey",
      "canRotateApiKey",
      "canUseKeychain",
      "canUseSafeStorage",
      "canWriteEncryptedLocalStore",
      "canWriteEnv",
      "canWriteLocalStorage",
      "canWriteSessionStorage",
      "canWriteLogs",
      "canTestConnection",
      "canConnectEndpoint",
      "canUseNetwork",
      "canReturnPrice",
      "canReturnBookingUrl",
      "canOpenBookingUrl",
      "canCreateOrder",
      "canPay",
      "canUploadIdentity",
      "canStoreBankCard"
    ].forEach((name) => {
      if (draft.capabilities[name] !== false) issues.push(name);
    });
    const serialized = JSON.stringify(draft);
    if (/sk-[A-Za-z0-9]|api[_-]?key\s*[:=]\s*[A-Za-z0-9_-]{8,}/i.test(serialized)) {
      issues.push("unredacted_secret");
    }
    if (issues.length) throw new Error("local_secure_storage_interface_draft_violation:" + issues.join(","));
    return true;
  }

  window.WeishanCommerceLocalSecureStorageInterfaceDraft = {
    DRAFT_VERSION,
    DRAFT_NAME,
    PHASE,
    commerceLocalSecureStorageInterfaceDraftContract: buildLocalSecureStorageInterfaceDraft(),
    buildLocalSecureStorageInterfaceDraft,
    buildLocalSecureStorageDataModelDraft,
    buildLocalSecureStorageMethodDraft,
    buildLocalSecureStorageBackendCandidates,
    buildLocalSecureStorageAuditDraft,
    buildLocalSecureStorageRedactionDraft,
    evaluateLocalSecureStorageInterfaceDraft,
    assertLocalSecureStorageInterfaceDraftSafe,
    redactSecretLikeValue,
    redactObject,
    redactHeaders,
    redactUrl
  };
})();
