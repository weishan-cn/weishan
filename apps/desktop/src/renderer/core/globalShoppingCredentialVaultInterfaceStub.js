;(function () {
  "use strict";

  const GLOBAL_SHOPPING_CREDENTIAL_VAULT_INTERFACE_STUB_VERSION = "4.2.1";
  const STUB_NAME = "global_shopping_credential_vault_interface_stub_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawResponse|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function method(methodId, label, summary, caveat) {
    return {
      methodId:text(methodId),
      label:text(label),
      implemented:false,
      allowedInCurrentVersion:false,
      futureOnly:true,
      summary:text(summary),
      caveat:text(caveat),
      redacted:true
    };
  }
  function safety(overrides) {
    return Object.assign({
      fileWrite:false,
      download:false,
      realNameStored:false,
      phoneStored:false,
      emailStored:false,
      identityUpload:false,
      credentialInput:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    }, obj(overrides));
  }

  function buildGlobalShoppingCredentialVaultInterfaceMethods() {
    return clone([
      method("resolve_secure_backend_ref", "解析安全后端引用", "未来只允许安全后端或系统安全存储解析凭证引用。", "当前版本不实现真实读取。"),
      method("load_sandbox_provider_credential", "读取 sandbox provider 凭证", "未来只允许在额外审批后由安全存储层读取。", "当前 renderer 永远不能接触 key。"),
      method("rotate_sandbox_provider_credential", "轮换 sandbox provider 凭证", "未来只允许后端或系统安全存储层处理轮换。", "当前版本不实现写入或轮换。"),
      method("delete_sandbox_provider_credential", "删除 sandbox provider 凭证", "未来只允许安全存储层执行删除。", "当前版本不实现删除。"),
      method("audit_credential_boundary", "审计凭证边界", "未来只允许输出脱敏元数据审计。", "当前版本不输出任何真实密钥。")
    ]);
  }

  function evaluateGlobalShoppingCredentialVaultInterfaceStub(input) {
    const safe = obj(input);
    const blocked =
      safe.readRealApiKey === true ||
      safe.storeCredential === true ||
      safe.writeCredential === true ||
      safe.deleteCredential === true ||
      safe.rotateCredential === true ||
      safe.exposeCredentialToRenderer === true ||
      safe.persistCredentialInBrowserStorage === true ||
      safe.logCredential === true ||
      safe.exportCredential === true ||
      safe.commitCredential === true ||
      safe.showCredentialInput === true ||
      safe.enableProductionProvider === true ||
      safe.secretPersistenceGuardPass === false;
    const vaultHealth = {
      interfaceOnly:true,
      noApiKeyRead:safe.readRealApiKey !== true,
      noCredentialStorage:safe.storeCredential !== true,
      noCredentialWrite:safe.writeCredential !== true,
      noCredentialDelete:safe.deleteCredential !== true,
      noCredentialRotation:safe.rotateCredential !== true,
      noRendererExposure:safe.exposeCredentialToRenderer !== true,
      noBrowserStorage:safe.persistCredentialInBrowserStorage !== true,
      noCredentialLogging:safe.logCredential !== true,
      noCredentialExport:safe.exportCredential !== true,
      noCredentialCommit:safe.commitCredential !== true,
      noCredentialInputUi:safe.showCredentialInput !== true,
      noProductionProviderEnablement:safe.enableProductionProvider !== true,
      secretPersistenceGuardPass:safe.secretPersistenceGuardPass !== false
    };
    return clone({
      status:blocked ? "blocked" : "ready",
      interfaceMethods:buildGlobalShoppingCredentialVaultInterfaceMethods(),
      vaultHealth:vaultHealth,
      blockedReasons:blocked ? [
        safe.readRealApiKey === true ? "api_key_read_detected" : "",
        safe.storeCredential === true ? "credential_storage_detected" : "",
        safe.writeCredential === true ? "credential_write_detected" : "",
        safe.deleteCredential === true ? "credential_delete_detected" : "",
        safe.rotateCredential === true ? "credential_rotation_detected" : "",
        safe.exposeCredentialToRenderer === true ? "renderer_exposure_detected" : "",
        safe.persistCredentialInBrowserStorage === true ? "browser_storage_detected" : "",
        safe.logCredential === true ? "credential_logging_detected" : "",
        safe.exportCredential === true ? "credential_export_detected" : "",
        safe.commitCredential === true ? "credential_commit_detected" : "",
        safe.showCredentialInput === true ? "credential_input_ui_detected" : "",
        safe.enableProductionProvider === true ? "production_provider_enablement_detected" : "",
        safe.secretPersistenceGuardPass === false ? "secret_persistence_guard_failed" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingCredentialVaultInterfaceRows(input) {
    const evaluation = evaluateGlobalShoppingCredentialVaultInterfaceStub(input);
    return clone([
      row("renderer_boundary", "renderer 不接触密钥", "当前 renderer 永远不能接触 key", evaluation.vaultHealth.noRendererExposure ? "pass" : "blocked"),
      row("storage_boundary", "浏览器存储不保存密钥", "localStorage / sessionStorage 不保存 key", evaluation.vaultHealth.noBrowserStorage ? "pass" : "blocked"),
      row("logging_boundary", "日志不打印密钥", "日志与审计仅保留脱敏元数据", evaluation.vaultHealth.noCredentialLogging ? "pass" : "blocked"),
      row("fixture_boundary", "fixture / export / git 不包含密钥", "测试 fixture、导出包与 git 不包含 key", evaluation.vaultHealth.noCredentialExport && evaluation.vaultHealth.noCredentialCommit ? "pass" : "blocked"),
      row("production_boundary", "不启用 production provider", "当前只是接口桩，不启用 production provider", evaluation.vaultHealth.noProductionProviderEnablement ? "pass" : "blocked"),
      row("guard_status", "secret persistence guard", evaluation.vaultHealth.secretPersistenceGuardPass ? "secret persistence guard 已通过" : "secret persistence guard 已阻断", evaluation.vaultHealth.secretPersistenceGuardPass ? "pass" : "blocked")
    ]);
  }

  function buildGlobalShoppingCredentialVaultInterfaceStubAuditDraft(input) {
    const stub = buildGlobalShoppingCredentialVaultInterfaceStub(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_CREDENTIAL_VAULT_INTERFACE_STUB_AUDIT_DRAFT",
      stubName:STUB_NAME,
      appVersion:GLOBAL_SHOPPING_CREDENTIAL_VAULT_INTERFACE_STUB_VERSION,
      status:stub.status,
      methodCount:toArray(stub.interfaceMethods).length,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      fileWrite:false,
      download:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingCredentialVaultInterfaceStub(stub) {
    const safe = obj(stub);
    const evaluation = evaluateGlobalShoppingCredentialVaultInterfaceStub(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      stubName:STUB_NAME,
      appVersion:GLOBAL_SHOPPING_CREDENTIAL_VAULT_INTERFACE_STUB_VERSION,
      status:status,
      vaultBoundary:{
        stubId:text(safe.stubId || "global-shopping-credential-vault-interface-stub"),
        stubMode:/^(disabled|interface_only|planning_only|sandbox_ready)$/.test(text(safe.stubMode)) ? text(safe.stubMode) : "interface_only",
        interfaceOnly:true,
        planningOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canReadRealApiKey:false,
        canStoreCredential:false,
        canWriteCredential:false,
        canDeleteCredential:false,
        canRotateCredential:false,
        canExposeCredentialToRenderer:false,
        canPersistCredentialInBrowserStorage:false,
        canLogCredential:false,
        canExportCredential:false,
        canCommitCredential:false,
        canShowCredentialInput:false,
        canEnableProductionProvider:false
      },
      interfaceMethods:toArray(safe.interfaceMethods).length ? toArray(safe.interfaceMethods) : evaluation.interfaceMethods,
      vaultHealth:clone(evaluation.vaultHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingCredentialVaultInterfaceRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"凭证保险箱接口桩",
        resultLabel:status === "ready" ? "凭证接口桩已准备" : (status === "blocked" ? "凭证接口桩已阻断" : "凭证接口桩仍需复核"),
        caveat:"当前只是接口桩，不读取、不输入、不保存、不显示任何真实 provider 密钥。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingCredentialVaultInterfaceStub(input) {
    try {
      return sanitizeGlobalShoppingCredentialVaultInterfaceStub(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingCredentialVaultInterfaceStub({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingCredentialVaultInterfaceStub = {
    GLOBAL_SHOPPING_CREDENTIAL_VAULT_INTERFACE_STUB_VERSION,
    STUB_NAME,
    buildGlobalShoppingCredentialVaultInterfaceStub,
    evaluateGlobalShoppingCredentialVaultInterfaceStub,
    buildGlobalShoppingCredentialVaultInterfaceRows,
    buildGlobalShoppingCredentialVaultInterfaceMethods,
    buildGlobalShoppingCredentialVaultInterfaceStubAuditDraft,
    sanitizeGlobalShoppingCredentialVaultInterfaceStub
  };
})();
