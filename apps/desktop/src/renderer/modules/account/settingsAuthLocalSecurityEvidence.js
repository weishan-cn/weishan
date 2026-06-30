(function(){
  const SETTINGS_AUTH_LOCAL_SECURITY_EVIDENCE_VERSION = "2.3.9";

  const recoveryNoticeDraft = [
    "本地模式不联网",
    "本地模式不发邮件",
    "本地模式不读取密钥",
    "本地模式不连接云账号",
    "找回密码不会清空表单",
    "找回密码不会跳路由",
    "找回密码不会发送真实邮件",
    "找回密码不会读取 API key",
    "找回密码不会触发 provider 连接"
  ];

  const authSafetyBoundaries = [
    "raw password display forbidden",
    "raw password persistence forbidden",
    "passwordVerifier only",
    "raw token display forbidden",
    "rawApiKey display forbidden",
    "real API key input disabled",
    "real endpoint test disabled",
    "Keychain disabled",
    "safeStorage disabled",
    "cloud auth disabled",
    "provider auth disabled"
  ];

  const accountLocalObjectDraft = {
    accountId:"local account id",
    emailAlias:"local email alias",
    passwordVerifier:"enabled",
    legacyPasswordMigrationState:"compatible",
    localAuthState:"enabled",
    localRecoveryState:"no-network notice only",
    aiKeyConfigState:"locked when unauthenticated",
    createdAt:"local timestamp",
    updatedAt:"local timestamp",
    schemaVersion:SETTINGS_AUTH_LOCAL_SECURITY_EVIDENCE_VERSION,
    redacted:true
  };

  const settingsAuthLocalSecurityEvidenceContract = {
    version:SETTINGS_AUTH_LOCAL_SECURITY_EVIDENCE_VERSION,
    moduleName:"settings_auth_local_security_evidence",
    status:"local auth evidence only",
    mode:"no cloud auth",
    localRegister:"enabled",
    localLogin:"enabled",
    localRecoveryNotice:"enabled",
    passwordVerifier:"enabled",
    legacyPlainPasswordMigration:"compatible",
    realEmailSending:"disabled",
    realNetwork:"disabled",
    realKeyRead:"disabled",
    redacted:true,
    capabilities:{
      canShowLocalAuthEvidence:true,
      canRegisterLocal:true,
      canLoginLocal:true,
      canShowRecoveryNotice:true,
      canSendRealEmail:false,
      canUseNetwork:false,
      canReadRealKey:false,
      canDisplayRawPassword:false,
      canPersistRawPassword:false,
      canDisplayRawToken:false,
      canDisplayRawApiKey:false
    }
  };

  function clone(value){ return JSON.parse(JSON.stringify(value)); }

  function buildSettingsAuthLocalSecurityEvidence(input){
    const raw = input && typeof input === "object" ? input : {};
    return {
      version:SETTINGS_AUTH_LOCAL_SECURITY_EVIDENCE_VERSION,
      contract:clone(settingsAuthLocalSecurityEvidenceContract),
      accountLocalObjectDraft:Object.assign({}, accountLocalObjectDraft, raw.accountLocalObjectDraft || {}),
      recoveryNoticeDraft:recoveryNoticeDraft.slice(),
      authSafetyBoundaries:authSafetyBoundaries.slice(),
      audit:{
        settingsAuthLocalSecurityEvidenceAuditDraft:{
          eventType:"SETTINGS_AUTH_LOCAL_SECURITY_EVIDENCE_DRAFT",
          schemaVersion:SETTINGS_AUTH_LOCAL_SECURITY_EVIDENCE_VERSION,
          localAuthState:"enabled",
          localRecoveryState:"no-network notice only",
          passwordVerifierState:"enabled",
          legacyMigrationState:"compatible",
          aiKeyConfigState:"locked when unauthenticated",
          blockedReason:"cloud_auth_and_secret_access_disabled",
          redacted:true
        },
        redacted:true
      },
      display:{
        title:"settings auth local security evidence",
        establishedLine:"evidence 已建立",
        statusLine:"status: local auth evidence only",
        modeLine:"mode: no cloud auth",
        registerLine:"local register enabled",
        loginLine:"local login enabled",
        recoveryLine:"local recovery notice enabled",
        verifierLine:"passwordVerifier enabled",
        migrationLine:"legacy plain password migration compatible",
        emailLine:"real email sending disabled",
        networkLine:"real network disabled",
        keyLine:"real key read disabled",
        redactedLine:"redacted: true"
      }
    };
  }

  function assertSettingsAuthLocalSecurityEvidenceSafe(evidence){
    const target = evidence && typeof evidence === "object" ? evidence : buildSettingsAuthLocalSecurityEvidence();
    const contract = target.contract || settingsAuthLocalSecurityEvidenceContract;
    const caps = contract.capabilities || {};
    if (contract.status !== "local auth evidence only") throw new Error("settings auth evidence must stay local auth evidence only");
    if (contract.mode !== "no cloud auth") throw new Error("settings auth evidence must stay no cloud auth");
    ["canSendRealEmail", "canUseNetwork", "canReadRealKey", "canDisplayRawPassword", "canPersistRawPassword", "canDisplayRawToken", "canDisplayRawApiKey"].forEach(function(key){
      if (caps[key] !== false) throw new Error(key + " must stay false");
    });
    return true;
  }

  window.WeishanSettingsAuthLocalSecurityEvidence = {
    SETTINGS_AUTH_LOCAL_SECURITY_EVIDENCE_VERSION,
    settingsAuthLocalSecurityEvidenceContract,
    recoveryNoticeDraft,
    authSafetyBoundaries,
    accountLocalObjectDraft,
    buildSettingsAuthLocalSecurityEvidence,
    assertSettingsAuthLocalSecurityEvidenceSafe
  };
})();
