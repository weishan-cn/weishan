;(function () {
  "use strict";

  const LIFECYCLE_VERSION = "2.1.49";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  const commerceKeyLifecycleDraftContract = {
    version: LIFECYCLE_VERSION,
    moduleName: "key_delete_rotate_expiry_draft",
    phase: "key_lifecycle_draft",
    draftStatus: "draft_only",
    implementationStatus: "not_implemented",
    realKeyDelete: "disabled",
    realKeyRotate: "disabled",
    realKeyExpiry: "disabled",
    realKeyRevocation: "disabled",
    realKeyArchive: "disabled",
    realKeyRestore: "disabled",
    keyInput: "disabled",
    keyStorage: "disabled",
    keyRead: "disabled",
    keyWrite: "disabled",
    keychainBackend: "candidate_not_connected",
    safeStorageBackend: "candidate_not_connected",
    encryptedLocalStoreBackend: "candidate_not_connected",
    network: "disabled",
    endpointConnection: "disabled",
    connectionTest: "disabled",
    providerSandbox: "disabled",
    realPrice: "disabled",
    bookingUrl: "disabled",
    order: "disabled",
    payment: "disabled",
    capabilities: {
      canShowLifecycleDraft: true,
      canShowDeleteDraft: true,
      canShowRotateDraft: true,
      canShowExpiryDraft: true,
      canShowStateMachine: true,
      canShowConfirmationRules: true,
      canShowAuditEvents: true,
      canShowProviderBindingImpact: true,
      canShowNextStep: true,
      canDeleteApiKey: false,
      canRotateApiKey: false,
      canExpireApiKey: false,
      canRevokeApiKey: false,
      canArchiveApiKey: false,
      canRestoreApiKey: false,
      canInputApiKey: false,
      canSaveApiKey: false,
      canReadApiKey: false,
      canWriteApiKey: false,
      canUseKeychain: false,
      canUseSafeStorage: false,
      canUseEncryptedLocalStore: false,
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
      canCreateOrder: false,
      canPay: false,
      canUploadIdentity: false,
      canStoreBankCard: false
    }
  };

  function blockedMethod(name, extra) {
    return Object.assign({
      method: name,
      status: "blocked",
      draftStatus: "draft_only",
      allowed: false,
      reason: "key_lifecycle_draft_only"
    }, extra || {});
  }

  function buildKeyLifecycleStateMachineDraft() {
    return clone({
      states: [
        "draft_alias_only",
        "pending_secure_storage",
        "active_readonly",
        "expired",
        "rotation_required",
        "rotation_pending",
        "rotated",
        "deletion_requested",
        "deleted",
        "revoked",
        "disabled",
        "blocked"
      ],
      currentAllowedState: "draft_alias_only",
      currentBlockedStates: [
        "active_readonly",
        "rotation_pending",
        "rotated",
        "deleted",
        "revoked"
      ],
      transitions: [
        { from: "draft_alias_only", to: "pending_secure_storage", status: "blocked" },
        { from: "pending_secure_storage", to: "active_readonly", status: "blocked" },
        { from: "active_readonly", to: "rotation_required", status: "blocked" },
        { from: "rotation_required", to: "rotation_pending", status: "blocked" },
        { from: "rotation_pending", to: "rotated", status: "blocked" },
        { from: "active_readonly", to: "deletion_requested", status: "blocked" },
        { from: "deletion_requested", to: "deleted", status: "blocked" },
        { from: "active_readonly", to: "expired", status: "blocked" },
        { from: "expired", to: "disabled", status: "blocked" }
      ]
    });
  }

  function buildKeyDeleteDraft() {
    return clone({
      deleteRules: [
        "删除前必须二次确认",
        "删除前必须显示 providerName / keyAlias / permissionType",
        "删除前不得显示真实 key",
        "删除后必须禁用对应 provider binding",
        "删除后必须清除可用状态",
        "删除后必须写入脱敏审计事件",
        "删除后不得保留可恢复明文",
        "删除后不得自动重新连接 provider",
        "删除后不得自动测试连接"
      ],
      deleteBlockedReasons: [
        "secure storage 未实现",
        "真实 key 不存在",
        "key read 未开放",
        "key delete 未开放",
        "audit delete event 仍为草案",
        "provider binding disable 仍为草案"
      ],
      deleteMethodDraft: {
        prepareKeyDeleteDraft: blockedMethod("prepareKeyDeleteDraft"),
        confirmKeyDeleteDraft: blockedMethod("confirmKeyDeleteDraft"),
        finalizeKeyDeleteDraft: blockedMethod("finalizeKeyDeleteDraft")
      }
    });
  }

  function buildKeyRotateDraft() {
    return clone({
      rotateRules: [
        "轮换前必须二次确认",
        "轮换前不得显示旧 key",
        "轮换时必须生成新 keyVersion",
        "轮换时必须增加 rotationVersion",
        "轮换成功前旧 key 不得被覆盖",
        "轮换失败不得破坏旧 key",
        "轮换后必须重新通过只读沙箱",
        "轮换后必须写入脱敏审计事件",
        "轮换后不得自动进入付款 / 下单权限"
      ],
      rotateBlockedReasons: [
        "secure storage 未实现",
        "新 key 输入未开放",
        "旧 key 读取未开放",
        "key write 未开放",
        "provider sandbox 未开放",
        "connection test 未开放",
        "audit rotate event 仍为草案"
      ],
      rotateMethodDraft: {
        prepareKeyRotateDraft: blockedMethod("prepareKeyRotateDraft"),
        validateRotationCandidateDraft: blockedMethod("validateRotationCandidateDraft"),
        confirmKeyRotateDraft: blockedMethod("confirmKeyRotateDraft"),
        finalizeKeyRotateDraft: blockedMethod("finalizeKeyRotateDraft")
      }
    });
  }

  function buildKeyExpiryDraft() {
    return clone({
      expiryRules: [
        "key 可以设置 expiresAt",
        "过期前提示用户更新",
        "过期后 provider binding 自动进入 disabled 草案状态",
        "过期后不允许测试连接",
        "过期后不允许读取价格",
        "过期后不允许生成 bookingUrl",
        "过期后必须写入脱敏审计事件",
        "过期提醒不得包含真实 key"
      ],
      expiryBlockedReasons: [
        "secure storage 未实现",
        "key metadata 未真实保存",
        "expiresAt 未真实启用",
        "provider binding disable 仍为草案",
        "notification 未启用"
      ],
      expiryMethodDraft: {
        prepareKeyExpiryDraft: blockedMethod("prepareKeyExpiryDraft"),
        evaluateKeyExpiryDraft: blockedMethod("evaluateKeyExpiryDraft", { status: "draft_only" }),
        markKeyExpiredDraft: blockedMethod("markKeyExpiredDraft")
      }
    });
  }

  function buildKeyLifecycleAuditEventsDraft() {
    return clone({
      eventTypes: [
        "KEY_DELETE_REQUESTED_DRAFT",
        "KEY_DELETE_BLOCKED",
        "KEY_DELETE_CONFIRMED_DRAFT",
        "KEY_DELETE_FINALIZE_BLOCKED",
        "KEY_ROTATE_REQUESTED_DRAFT",
        "KEY_ROTATE_BLOCKED",
        "KEY_ROTATE_CONFIRMED_DRAFT",
        "KEY_ROTATE_FINALIZE_BLOCKED",
        "KEY_EXPIRY_SET_DRAFT",
        "KEY_EXPIRY_EVALUATED_DRAFT",
        "KEY_EXPIRED_BLOCKED",
        "KEY_REVOKE_BLOCKED",
        "PROVIDER_BINDING_DISABLE_DRAFT"
      ],
      auditRules: [
        "不记录真实 key",
        "不记录 secret",
        "不记录 token",
        "不记录 authorization header",
        "不记录 credential query params",
        "不记录旧 key / 新 key",
        "只记录 aliasId / providerId / action / blockedReason / timestamp",
        "所有事件必须 redacted: true"
      ]
    });
  }

  function evaluateKeyLifecycleDraft() {
    return clone({
      allowed: false,
      draftStatus: "draft_only",
      lifecycleStatus: "blocked",
      canDeleteApiKey: false,
      canRotateApiKey: false,
      canExpireApiKey: false,
      canRevokeApiKey: false,
      canInputApiKey: false,
      canSaveApiKey: false,
      canReadApiKey: false,
      canTestConnection: false,
      canUseNetwork: false,
      canReturnPrice: false,
      canReturnBookingUrl: false,
      reason: "key_lifecycle_draft_only",
      nextStep: "readonly_provider_result_schema_gate"
    });
  }

  function buildKeyLifecycleDraft() {
    return clone(Object.assign({}, commerceKeyLifecycleDraftContract, {
      stateMachine: buildKeyLifecycleStateMachineDraft(),
      deleteDraft: buildKeyDeleteDraft(),
      rotateDraft: buildKeyRotateDraft(),
      expiryDraft: buildKeyExpiryDraft(),
      auditEventsDraft: buildKeyLifecycleAuditEventsDraft(),
      evaluation: evaluateKeyLifecycleDraft(),
      display: {
        title: "key 删除 / 轮换 / 过期机制草案",
        lifecycleStatusLine: "生命周期草案：已建立",
        realDeleteLine: "真实删除：未开放",
        realRotateLine: "真实轮换：未开放",
        realExpiryLine: "真实过期：未开放",
        realRevocationLine: "真实吊销：未开放",
        realRestoreLine: "真实恢复：未开放",
        keyInputLine: "真实 API key 输入：未开放",
        keySaveLine: "真实 API key 保存：未开放",
        keyReadLine: "真实 API key 读取：未开放",
        connectionTestLine: "测试连接：未开放",
        providerSandboxLine: "provider 沙箱：未开放",
        realPriceLine: "真实价格：未开放",
        bookingUrlLine: "bookingUrl：未开放",
        nextStepLine: "下一步：只读 provider result schema gate；只读 provider result schema gate：已建立。下一步：provider result source label gate",
        currentVersionLine: "当前版本仍不能输入、保存、读取、删除、轮换或测试真实 API key"
      }
    }));
  }

  function assertKeyLifecycleDraftSafe(draft) {
    const target = draft && typeof draft === "object" ? draft : buildKeyLifecycleDraft();
    const caps = target.capabilities || {};
    const checks = [
      target.draftStatus === "draft_only",
      target.implementationStatus === "not_implemented",
      caps.canDeleteApiKey === false,
      caps.canRotateApiKey === false,
      caps.canExpireApiKey === false,
      caps.canRevokeApiKey === false,
      caps.canInputApiKey === false,
      caps.canSaveApiKey === false,
      caps.canReadApiKey === false,
      caps.canWriteApiKey === false,
      caps.canUseKeychain === false,
      caps.canUseSafeStorage === false,
      caps.canUseEncryptedLocalStore === false,
      caps.canWriteEnv === false,
      caps.canWriteLocalStorage === false,
      caps.canWriteSessionStorage === false,
      caps.canWriteLogs === false,
      caps.canTestConnection === false,
      caps.canConnectEndpoint === false,
      caps.canUseNetwork === false,
      caps.canRunProviderSandbox === false,
      caps.canReturnPrice === false,
      caps.canReturnBookingUrl === false,
      caps.canCreateOrder === false,
      caps.canPay === false,
      caps.canUploadIdentity === false,
      caps.canStoreBankCard === false
    ];
    if (!checks.every(Boolean)) throw new Error("KEY_LIFECYCLE_DRAFT_UNSAFE");
    return true;
  }

  const api = {
    commerceKeyLifecycleDraftContract,
    buildKeyLifecycleDraft,
    buildKeyLifecycleStateMachineDraft,
    buildKeyDeleteDraft,
    buildKeyRotateDraft,
    buildKeyExpiryDraft,
    buildKeyLifecycleAuditEventsDraft,
    evaluateKeyLifecycleDraft,
    assertKeyLifecycleDraftSafe
  };

  if (typeof window !== "undefined") window.WeishanCommerceKeyLifecycleDraft = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
