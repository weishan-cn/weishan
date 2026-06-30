;(function () {
  "use strict";

  const GLOBAL_SHOPPING_VAULT_BOUNDARY_CONTRACT_VERSION = "2.3.3";
  const CONTRACT_NAME = "global_shopping_vault_boundary_contract_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawResponse|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function clause(clauseId, label, status, summary, caveat) {
    return {
      clauseId:text(clauseId),
      label:text(label),
      status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review",
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

  function buildGlobalShoppingVaultBoundaryClauses(input) {
    const evaluation = evaluateGlobalShoppingVaultBoundaryContract(input);
    return clone([
      clause("secure_backend_only", "仅允许安全后端或系统保险箱", evaluation.contractHealth.secureBackendRequired ? "pass" : "blocked", "真实凭证未来只能由安全后端或系统保险箱处理。", "renderer/browser/log/git/export 都不能接触真实密钥。"),
      clause("no_renderer_read", "renderer 不读取真实密钥", evaluation.contractHealth.noRead && evaluation.contractHealth.noInput ? "pass" : "blocked", "当前页面层不读取、不输入任何真实 provider key。", "出现 key 输入框或读取动作必须 blocked。"),
      clause("no_browser_storage", "浏览器存储与日志不保存密钥", evaluation.contractHealth.noBrowserStorage && evaluation.contractHealth.noLog && evaluation.contractHealth.noExport && evaluation.contractHealth.noCommit ? "pass" : "blocked", "localStorage / sessionStorage / 日志 / 导出 / git 均不得保存密钥。", "只允许脱敏元数据。"),
      clause("no_mutation", "不提供写入/删除/轮换接口", evaluation.contractHealth.noWrite && evaluation.contractHealth.noDelete && evaluation.contractHealth.noRotate ? "pass" : "blocked", "当前合同只定义边界，不提供 write/delete/rotate。", "真实凭证修改只能在未来安全后端中处理。"),
      clause("secret_persistence_guard", "secret persistence guard", evaluation.contractHealth.secretPersistenceGuardPass ? "pass" : "blocked", "secret persistence guard 必须通过。", "guard 失败时整个合同 blocked。")
    ]);
  }

  function evaluateGlobalShoppingVaultBoundaryContract(input) {
    const safe = obj(input);
    const blocked =
      safe.readRealApiKey === true ||
      safe.readVaultSecret === true ||
      safe.writeCredential === true ||
      safe.storeCredential === true ||
      safe.deleteCredential === true ||
      safe.rotateCredential === true ||
      safe.showCredentialInput === true ||
      safe.exposeCredential === true ||
      safe.exposeCredentialToRenderer === true ||
      safe.persistCredentialInBrowserStorage === true ||
      safe.logCredential === true ||
      safe.exportCredential === true ||
      safe.commitCredential === true ||
      safe.enableProductionProvider === true ||
      safe.secretPersistenceGuardPass === false;

    const contractHealth = {
      secureBackendRequired:safe.secureBackendRequired !== false,
      systemVaultRequired:safe.systemVaultRequired !== false,
      noRead:safe.readRealApiKey !== true && safe.readVaultSecret !== true,
      noWrite:safe.writeCredential !== true && safe.storeCredential !== true,
      noDelete:safe.deleteCredential !== true,
      noRotate:safe.rotateCredential !== true,
      noInput:safe.showCredentialInput !== true,
      noExposure:safe.exposeCredential !== true && safe.exposeCredentialToRenderer !== true,
      noBrowserStorage:safe.persistCredentialInBrowserStorage !== true,
      noLog:safe.logCredential !== true,
      noExport:safe.exportCredential !== true,
      noCommit:safe.commitCredential !== true,
      noProductionEnablement:safe.enableProductionProvider !== true,
      secretPersistenceGuardPass:safe.secretPersistenceGuardPass !== false
    };

    const clauses = toArray(safe.contractClauses);
    const needsReview = clauses.length > 0 ? clauses.some(function (item) { return !item || !text(item.label || item.clauseId); }) : false;
    const clauseMissing = clauses.length === 0 && safe.requireContractClauses === true;

    return clone({
      status:blocked ? "blocked" : ((needsReview || clauseMissing) ? "needs_review" : "ready"),
      contractHealth:contractHealth,
      blockedReasons:blocked ? [
        safe.readRealApiKey === true || safe.readVaultSecret === true ? "vault_read_detected" : "",
        safe.writeCredential === true || safe.storeCredential === true ? "vault_write_detected" : "",
        safe.deleteCredential === true ? "vault_delete_detected" : "",
        safe.rotateCredential === true ? "vault_rotate_detected" : "",
        safe.showCredentialInput === true ? "credential_input_detected" : "",
        safe.exposeCredential === true || safe.exposeCredentialToRenderer === true ? "credential_exposure_detected" : "",
        safe.persistCredentialInBrowserStorage === true ? "browser_storage_detected" : "",
        safe.logCredential === true ? "credential_logging_detected" : "",
        safe.exportCredential === true ? "credential_export_detected" : "",
        safe.commitCredential === true ? "credential_commit_detected" : "",
        safe.enableProductionProvider === true ? "production_provider_enablement_detected" : "",
        safe.secretPersistenceGuardPass === false ? "secret_persistence_guard_failed" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingVaultBoundaryRows(input) {
    const evaluation = evaluateGlobalShoppingVaultBoundaryContract(input);
    return clone(buildGlobalShoppingVaultBoundaryClauses(input).map(function (item) {
      return row(item.clauseId, item.label, item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    }).concat([
      row("vault_boundary_title", "Vault Boundary Contract", evaluation.status === "ready" ? "Vault 边界合同已准备" : "Vault 边界合同仍需复核", evaluation.status === "blocked" ? "blocked" : (evaluation.status === "ready" ? "pass" : "warning")),
      row("vault_boundary_guard", "Vault 边界不读取或保存真实密钥", "不读取、不输入、不保存、不导出真实 key", evaluation.contractHealth.noRead && evaluation.contractHealth.noWrite && evaluation.contractHealth.noExposure ? "pass" : "blocked")
    ]));
  }

  function buildGlobalShoppingVaultBoundaryContractAuditDraft(input) {
    const contract = buildGlobalShoppingVaultBoundaryContract(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_VAULT_BOUNDARY_CONTRACT_AUDIT_DRAFT",
      contractName:CONTRACT_NAME,
      appVersion:GLOBAL_SHOPPING_VAULT_BOUNDARY_CONTRACT_VERSION,
      status:contract.status,
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

  function sanitizeGlobalShoppingVaultBoundaryContract(contract) {
    const safe = obj(contract);
    const evaluation = evaluateGlobalShoppingVaultBoundaryContract(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      contractName:CONTRACT_NAME,
      appVersion:GLOBAL_SHOPPING_VAULT_BOUNDARY_CONTRACT_VERSION,
      status:status,
      title:"Vault Boundary Contract",
      contractBoundary:{
        contractId:text(safe.contractId || "global-shopping-vault-boundary-contract"),
        contractMode:/^(disabled|planning_only|boundary_only|review_only)$/.test(text(safe.contractMode)) ? text(safe.contractMode) : "boundary_only",
        readOnly:true,
        planningOnly:true,
        boundaryOnly:true,
        productionDisabled:true,
        canReadRealApiKey:false,
        canStoreCredential:false,
        canWriteCredential:false,
        canDeleteCredential:false,
        canRotateCredential:false,
        canShowCredentialInput:false,
        canEnableProductionProvider:false
      },
      contractHealth:clone(evaluation.contractHealth),
      contractClauses:toArray(safe.contractClauses).length ? toArray(safe.contractClauses) : buildGlobalShoppingVaultBoundaryClauses(safe),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingVaultBoundaryRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"Vault Boundary Contract",
        resultLabel:status === "ready" ? "Vault 边界合同已准备" : (status === "blocked" ? "Vault 边界合同已阻断" : "Vault 边界合同仍需复核"),
        caveat:"当前只定义 vault 边界，不读取或保存真实密钥，不提供任何真实凭证处理。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingVaultBoundaryContract(input) {
    try {
      return sanitizeGlobalShoppingVaultBoundaryContract(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingVaultBoundaryContract({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingVaultBoundaryContract = {
    GLOBAL_SHOPPING_VAULT_BOUNDARY_CONTRACT_VERSION,
    CONTRACT_NAME,
    buildGlobalShoppingVaultBoundaryContract,
    evaluateGlobalShoppingVaultBoundaryContract,
    buildGlobalShoppingVaultBoundaryRows,
    buildGlobalShoppingVaultBoundaryClauses,
    buildGlobalShoppingVaultBoundaryContractAuditDraft,
    sanitizeGlobalShoppingVaultBoundaryContract
  };
})();
