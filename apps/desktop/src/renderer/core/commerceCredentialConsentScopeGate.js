(function(){
  const CREDENTIAL_CONSENT_SCOPE_GATE_VERSION = "2.1.20";

  const consentObjectFields = [
    "consentId", "providerId", "providerName", "credentialAlias", "credentialScope", "readonlyOnly", "allowedActionList", "blockedActionList", "consentState", "consentCollectedAt", "consentExpiresAt", "revocationState", "storageBackend", "secretRef", "redacted: true"
  ];

  const credentialScopes = [
    "readonly_search", "readonly_price_query", "readonly_availability_query", "readonly_provider_notice", "no_booking", "no_payment", "no_order", "no_profile_write", "no_identity_upload", "no_bank_card_submit"
  ];

  const consentStates = [
    "not_started", "draft_only", "pending_user_review", "pending_security_review", "blocked", "revoked", "expired", "approved_for_future_readonly"
  ];

  const permissionBoundaries = [
    "允许未来只读搜索", "允许未来只读价格查询", "允许未来只读来源标签读取", "禁止 booking", "禁止 checkout", "禁止 payment", "禁止 order", "禁止写入用户资料", "禁止上传身份证", "禁止上传护照", "禁止提交银行卡", "禁止 provider write action", "禁止 raw token 展示", "禁止 rawApiKey 展示"
  ];

  const blockingRules = [
    "缺用户同意阻断", "缺 providerId 阻断", "缺 credential scope 阻断", "非 readonly scope 阻断", "包含 booking scope 阻断", "包含 payment scope 阻断", "包含 order scope 阻断", "包含 profile write scope 阻断", "包含 identity upload scope 阻断", "缺 secure storage approval 阻断", "缺 redaction rules 阻断", "缺 key lifecycle policy 阻断"
  ];

  const commerceCredentialConsentScopeGateContract = {
    version:CREDENTIAL_CONSENT_SCOPE_GATE_VERSION,
    moduleName:"credential_consent_scope_gate",
    phase:"credential_consent_scope_gate",
    gateStatus:"closed",
    mode:"draft_only",
    realCredentialInput:"disabled",
    realCredentialSave:"disabled",
    realCredentialRead:"disabled",
    credentialLifecycleRealOperations:"disabled",
    keychainMode:"disabled",
    safeStorageMode:"disabled",
    encryptedLocalStoreMode:"disabled",
    envMode:"disabled",
    browserStorageMode:"disabled",
    redacted:true,
    capabilities:{
      canShowCredentialConsentScopeGate:true,
      canShowConsentObjectDraft:true,
      canShowCredentialScopeDraft:true,
      canShowConsentStateDraft:true,
      canShowPermissionBoundaries:true,
      canShowBlockingRules:true,
      canShowAuditDraft:true,
      canInputCredential:false,
      canSaveCredential:false,
      canReadCredential:false,
      canTestConnection:false,
      canDeleteRealCredential:false,
      canRotateRealCredential:false,
      canExpireRealCredential:false,
      canUseKeychain:false,
      canUseSafeStorage:false,
      canUseEncryptedLocalStore:false,
      canWriteEnv:false,
      canWriteLocalStorage:false,
      canWriteSessionStorage:false,
      canUseNetwork:false,
      canConnectEndpoint:false,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false
    },
    display:{
      title:"credential consent scope gate",
      establishedLine:"credential consent scope gate：gate 已建立",
      statusLine:"status: closed",
      modeLine:"mode: draft only",
      inputLine:"real credential input disabled",
      saveLine:"real credential save disabled",
      readLine:"real credential read disabled",
      lifecycleLine:"credential deletion / rotation / expiry real operations disabled",
      keychainLine:"Keychain disabled",
      safeStorageLine:"safeStorage disabled",
      encryptedStoreLine:"encrypted local store disabled",
      envLine:".env disabled",
      browserStorageLine:"localStorage / sessionStorage disabled",
      noApprovedLine:"当前没有 consent 处于 approved_for_future_readonly",
      noInputLine:"UI 不提供输入 key",
      noSaveLine:"UI 不提供保存 key",
      noReadLine:"UI 不提供读取 key",
      noTestLine:"UI 不提供测试连接",
      noLifecycleLine:"UI 不提供删除 / 轮换 / 过期真实操作",
      draftOnlyLine:"当前仅展示只读 consent 草案",
      redactedLine:"redacted: true"
    }
  };

  function clone(value){ return JSON.parse(JSON.stringify(value)); }

  function buildCredentialConsentObjectDraft(){ return { version:CREDENTIAL_CONSENT_SCOPE_GATE_VERSION, fields:consentObjectFields.slice(), redacted:true }; }
  function buildCredentialScopeDraft(){ return { version:CREDENTIAL_CONSENT_SCOPE_GATE_VERSION, credentialScopes:credentialScopes.slice(), redacted:true }; }
  function buildCredentialConsentStateDraft(){ return { version:CREDENTIAL_CONSENT_SCOPE_GATE_VERSION, states:consentStates.slice(), approvedForFutureReadonlyCount:0, redacted:true }; }
  function buildCredentialPermissionBoundaryDraft(){ return { version:CREDENTIAL_CONSENT_SCOPE_GATE_VERSION, boundaries:permissionBoundaries.slice(), redacted:true }; }
  function buildCredentialConsentBlockingRulesDraft(){ return { version:CREDENTIAL_CONSENT_SCOPE_GATE_VERSION, blockingRules:blockingRules.slice(), redacted:true }; }
  function buildCredentialConsentScopeAuditDraft(){
    return { version:CREDENTIAL_CONSENT_SCOPE_GATE_VERSION, credentialConsentScopeAuditDraft:{ eventType:"CREDENTIAL_CONSENT_SCOPE_EVALUATION_DRAFT", schemaVersion:CREDENTIAL_CONSENT_SCOPE_GATE_VERSION, gateState:"closed", consentState:"draft_only", providerId:"none", credentialAlias:"none", blockedReason:"credential_consent_scope_gate_closed", consentCollectedAt:"none", redacted:true }, redacted:true };
  }
  function evaluateCredentialConsentScopeDraft(){
    return { version:CREDENTIAL_CONSENT_SCOPE_GATE_VERSION, allowed:false, gateStatus:"closed", decision:"blocked", blockedReason:"credential_consent_scope_gate_closed", canInputCredential:false, canSaveCredential:false, canReadCredential:false, canTestConnection:false, canUseNetwork:false, redacted:true };
  }
  function assertCredentialConsentScopeGateSafe(gate){
    const target = gate && typeof gate === "object" ? gate : commerceCredentialConsentScopeGateContract;
    const caps = target.capabilities || {};
    if (target.gateStatus !== "closed") throw new Error("credential consent scope gate must stay closed");
    ["realCredentialInput", "realCredentialSave", "realCredentialRead", "credentialLifecycleRealOperations", "keychainMode", "safeStorageMode", "encryptedLocalStoreMode", "envMode", "browserStorageMode"].forEach(function(key){ if (target[key] !== "disabled") throw new Error(key + " must be disabled"); });
    ["canInputCredential", "canSaveCredential", "canReadCredential", "canTestConnection", "canDeleteRealCredential", "canRotateRealCredential", "canExpireRealCredential", "canUseKeychain", "canUseSafeStorage", "canUseEncryptedLocalStore", "canWriteEnv", "canWriteLocalStorage", "canWriteSessionStorage", "canUseNetwork", "canConnectEndpoint", "canCreateOrder", "canPay", "canUploadIdentity"].forEach(function(key){ if (caps[key] !== false) throw new Error(key + " must stay false"); });
    return true;
  }
  function buildCredentialConsentScopeGateDisplay(gate){
    const base = Object.assign({}, commerceCredentialConsentScopeGateContract, gate && typeof gate === "object" ? gate : {});
    return Object.assign({}, clone(base), { consentObjectDraft:buildCredentialConsentObjectDraft(), credentialScopeDraft:buildCredentialScopeDraft(), consentStateDraft:buildCredentialConsentStateDraft(), permissionBoundaries:buildCredentialPermissionBoundaryDraft(), blockingRules:buildCredentialConsentBlockingRulesDraft(), audit:buildCredentialConsentScopeAuditDraft(), evaluation:evaluateCredentialConsentScopeDraft() });
  }

  window.WeishanCommerceCredentialConsentScopeGate = { CREDENTIAL_CONSENT_SCOPE_GATE_VERSION, commerceCredentialConsentScopeGateContract, buildCredentialConsentObjectDraft, buildCredentialScopeDraft, buildCredentialConsentStateDraft, buildCredentialPermissionBoundaryDraft, buildCredentialConsentBlockingRulesDraft, buildCredentialConsentScopeAuditDraft, evaluateCredentialConsentScopeDraft, assertCredentialConsentScopeGateSafe, buildCredentialConsentScopeGateDisplay };
})();
