;(function () {
  "use strict";

  const GLOBAL_SHOPPING_COMPLIANCE_EVIDENCE_PACK_VERSION = "4.0.6";
  const PACK_NAME = "global_shopping_compliance_evidence_pack_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function category(categoryId, label, status, ownerRole, summary, caveat) {
    return {
      categoryId:text(categoryId),
      label:text(label),
      status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review",
      ownerRole:text(ownerRole || "human_reviewer"),
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
  function resolveSummary(input, key, apiName, methodName, buildInput) {
    const safe = obj(input);
    if (Object.keys(obj(safe[key])).length) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? api[methodName](buildInput || safe) : {};
  }
  function present(summary) { return Object.keys(obj(summary)).length > 0; }
  function statusForSummary(summary) {
    const status = statusOf(summary);
    if (!present(summary)) return "needs_review";
    if (status === "blocked" || status === "fail" || status === "failed_safe") return "blocked";
    if (status === "ready" || status === "pass" || status === "approved" || status === "allowed" || status === "clear") return "pass";
    return "needs_review";
  }

  function buildGlobalShoppingComplianceEvidenceCategories(input) {
    const safe = obj(input);
    const planner = obj(safe.humanControlledSandboxProviderPilotPlannerSummary);
    const killSwitch = obj(safe.providerKillSwitchDrillSummary);
    const blockers = obj(safe.productionBlockerMatrixSummary);
    const legal = obj(safe.legalReviewDossierSummary || safe.providerLegalReviewDossierSummary);
    const vault = obj(safe.vaultBoundaryContractSummary);
    const sentinel = obj(safe.safetySentinelSummary || safe.safetyRegressionSummary);
    const verify = obj(safe.verifySummary);
    return clone([
      category("human_controlled_pilot_planner", "人工控制 Pilot 计划", statusForSummary(planner), "release_manager", obj(obj(planner).userFacingSummary).resultLabel || "Pilot 计划器仍需复核", "只展示人工控制计划，不启动真实 provider。"),
      category("kill_switch_drill", "Kill Switch 演练", statusForSummary(killSwitch), "incident_commander", obj(obj(killSwitch).userFacingSummary).resultLabel || "Kill Switch 演练仍需复核", "只做 mock 演练，不禁用真实 provider。"),
      category("production_blockers", "Production 阻断条件", statusForSummary(blockers), "security", obj(obj(blockers).userFacingSummary).resultLabel || "Production 阻断矩阵仍需复核", "只展示阻断条件，不修改配置。"),
      category("legal_review", "法务审查档案", statusForSummary(legal), "legal", obj(obj(legal).userFacingSummary).resultLabel || "法务审查档案仍需复核", "只展示法务证据摘要，不创建审批任务。"),
      category("vault_boundary", "Vault 边界合同", statusForSummary(vault), "security", obj(obj(vault).userFacingSummary).resultLabel || "Vault 边界仍需复核", "不读取真实 key，不展示密钥输入框。"),
      category("safety_sentinel", "安全回归", !present(sentinel) ? "needs_review" : (text(sentinel.status || "") === "pass" ? "pass" : (text(sentinel.status || "") === "fail" || text(sentinel.status || "") === "failed_safe" ? "blocked" : "needs_review")), "security", text(sentinel.status || "安全回归仍需复核"), "只读扫描，不保存 raw provider 数据。"),
      category("verify_summary", "验证链摘要", !present(verify) ? "needs_review" : ((text(verify.status || "") === "ready" || text(verify.status || "") === "pass" || text(verify.status || "") === "all_passed") ? "pass" : (text(verify.status || "") === "blocked" || text(verify.status || "") === "fail" ? "blocked" : "needs_review")), "qa", text(verify.summaryLabel || verify.resultLabel || verify.status || "验证链摘要仍需复核"), "只展示验证状态摘要，不导出真实文件。")
    ]);
  }

  function evaluateGlobalShoppingComplianceEvidencePack(input) {
    const safe = obj(input);
    const humanControlledSandboxProviderPilotPlannerSummary = resolveSummary(safe, "humanControlledSandboxProviderPilotPlannerSummary", "WeishanGlobalShoppingHumanControlledSandboxProviderPilotPlanner", "buildGlobalShoppingHumanControlledSandboxProviderPilotPlanner", safe);
    const providerKillSwitchDrillSummary = resolveSummary(safe, "providerKillSwitchDrillSummary", "WeishanGlobalShoppingProviderKillSwitchDrill", "buildGlobalShoppingProviderKillSwitchDrill", safe);
    const productionBlockerMatrixSummary = resolveSummary(safe, "productionBlockerMatrixSummary", "WeishanGlobalShoppingProductionBlockerMatrix", "buildGlobalShoppingProductionBlockerMatrix", safe);
    const legalReviewDossierSummary = resolveSummary(safe, "legalReviewDossierSummary", "WeishanGlobalShoppingProviderLegalReviewDossier", "buildGlobalShoppingProviderLegalReviewDossier", safe);
    const vaultBoundaryContractSummary = resolveSummary(safe, "vaultBoundaryContractSummary", "WeishanGlobalShoppingVaultBoundaryContract", "buildGlobalShoppingVaultBoundaryContract", safe);
    const safetySentinelSummary = Object.keys(obj(safe.safetySentinelSummary)).length ? obj(safe.safetySentinelSummary) :
      (Object.keys(obj(safe.safetyRegressionSummary)).length ? obj(safe.safetyRegressionSummary) :
        ((window.WeishanFlightWorkflowSafetyRegressionSentinel || {}).buildFlightWorkflowSafetyRegressionReport ? window.WeishanFlightWorkflowSafetyRegressionSentinel.buildFlightWorkflowSafetyRegressionReport(safe) : {}));
    const verifySummary = obj(safe.verifySummary || safe.verifyStatusSummary || safe.validationSummary);
    const evidenceCategories = buildGlobalShoppingComplianceEvidenceCategories({
      humanControlledSandboxProviderPilotPlannerSummary:humanControlledSandboxProviderPilotPlannerSummary,
      providerKillSwitchDrillSummary:providerKillSwitchDrillSummary,
      productionBlockerMatrixSummary:productionBlockerMatrixSummary,
      legalReviewDossierSummary:legalReviewDossierSummary,
      vaultBoundaryContractSummary:vaultBoundaryContractSummary,
      safetySentinelSummary:safetySentinelSummary,
      verifySummary:verifySummary
    });
    const evidenceHealth = {
      noFileWrite:safe.fileWrite !== true,
      noDownload:safe.download !== true,
      noRealExport:safe.exportRealFile !== true,
      noEvidenceUpload:safe.uploadEvidence !== true,
      noEmailSend:safe.sendEmail !== true,
      noExternalDocumentOpen:safe.openExternalDocument !== true,
      noRawUserTextPersistence:safe.persistRawUserText !== true,
      noRawProviderRequestPersistence:safe.persistRawProviderRequest !== true,
      noRawProviderResponsePersistence:safe.persistRawProviderResponse !== true,
      noSecretIncluded:safe.includeSecret !== true && text(safe.secret || "") === "",
      noRealProviderStart:safe.startRealProvider !== true,
      noProviderEnablement:safe.enableProvider !== true,
      noForbiddenClaims:text(safe.forbiddenClaim || "") === ""
    };
    const blocked = evidenceCategories.some(function (item) { return item.status === "blocked"; }) ||
      !evidenceHealth.noFileWrite ||
      !evidenceHealth.noDownload ||
      !evidenceHealth.noRealExport ||
      !evidenceHealth.noEvidenceUpload ||
      !evidenceHealth.noEmailSend ||
      !evidenceHealth.noExternalDocumentOpen ||
      !evidenceHealth.noRawUserTextPersistence ||
      !evidenceHealth.noRawProviderRequestPersistence ||
      !evidenceHealth.noRawProviderResponsePersistence ||
      !evidenceHealth.noSecretIncluded ||
      !evidenceHealth.noRealProviderStart ||
      !evidenceHealth.noProviderEnablement ||
      !evidenceHealth.noForbiddenClaims;
    const needsReview = evidenceCategories.some(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const evidenceSummary = {
      hasHumanControlledPilotPlanner:present(humanControlledSandboxProviderPilotPlannerSummary),
      hasKillSwitchDrill:present(providerKillSwitchDrillSummary),
      hasProductionBlockerMatrix:present(productionBlockerMatrixSummary),
      hasLegalReviewDossier:present(legalReviewDossierSummary),
      hasVaultBoundaryContract:present(vaultBoundaryContractSummary),
      hasSafetySentinel:present(safetySentinelSummary),
      hasVerifySummary:present(verifySummary),
      evidenceCategoryCount:evidenceCategories.length,
      missingEvidenceCount:evidenceCategories.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; }).length,
      blockedEvidenceCount:evidenceCategories.filter(function (item) { return item.status === "blocked"; }).length,
      readyForHumanAuditReview:false
    };
    evidenceSummary.readyForHumanAuditReview =
      evidenceSummary.hasHumanControlledPilotPlanner &&
      evidenceSummary.hasKillSwitchDrill &&
      evidenceSummary.hasProductionBlockerMatrix &&
      evidenceSummary.hasLegalReviewDossier &&
      evidenceSummary.hasVaultBoundaryContract &&
      evidenceSummary.hasSafetySentinel &&
      evidenceSummary.hasVerifySummary &&
      evidenceSummary.missingEvidenceCount === 0 &&
      evidenceSummary.blockedEvidenceCount === 0 &&
      !blocked;
    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      humanControlledSandboxProviderPilotPlannerSummary:clone(humanControlledSandboxProviderPilotPlannerSummary),
      providerKillSwitchDrillSummary:clone(providerKillSwitchDrillSummary),
      productionBlockerMatrixSummary:clone(productionBlockerMatrixSummary),
      legalReviewDossierSummary:clone(legalReviewDossierSummary),
      vaultBoundaryContractSummary:clone(vaultBoundaryContractSummary),
      safetySentinelSummary:clone(safetySentinelSummary),
      verifySummary:clone(verifySummary),
      evidenceSummary:evidenceSummary,
      evidenceCategories:evidenceCategories,
      evidenceHealth:evidenceHealth,
      blockedReasons:blocked ? [
        !evidenceHealth.noFileWrite ? "file_write_detected" : "",
        !evidenceHealth.noDownload ? "download_detected" : "",
        !evidenceHealth.noRealExport ? "real_export_detected" : "",
        !evidenceHealth.noEvidenceUpload ? "evidence_upload_detected" : "",
        !evidenceHealth.noEmailSend ? "email_send_detected" : "",
        !evidenceHealth.noExternalDocumentOpen ? "external_document_open_detected" : "",
        !evidenceHealth.noRawUserTextPersistence ? "raw_user_text_persistence_detected" : "",
        !evidenceHealth.noRawProviderRequestPersistence ? "raw_provider_request_persistence_detected" : "",
        !evidenceHealth.noRawProviderResponsePersistence ? "raw_provider_response_persistence_detected" : "",
        !evidenceHealth.noSecretIncluded ? "secret_included_detected" : "",
        !evidenceHealth.noRealProviderStart ? "real_provider_start_detected" : "",
        !evidenceHealth.noProviderEnablement ? "provider_enablement_detected" : "",
        !evidenceHealth.noForbiddenClaims ? "forbidden_claim_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingComplianceEvidenceRows(input) {
    const evaluation = evaluateGlobalShoppingComplianceEvidencePack(input);
    return clone(evaluation.evidenceCategories.map(function (item) {
      return row(item.categoryId, item.label, item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    }).concat([
      row("compliance_evidence_boundary", "证据包边界", "该证据包只展示合规证据摘要，不写文件，不下载，不上传，不包含密钥或 raw provider 数据。", evaluation.status === "blocked" ? "blocked" : "pass")
    ]));
  }

  function buildGlobalShoppingComplianceEvidencePackAuditDraft(input) {
    const pack = buildGlobalShoppingComplianceEvidencePack(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_COMPLIANCE_EVIDENCE_PACK_AUDIT_DRAFT",
      packName:PACK_NAME,
      appVersion:GLOBAL_SHOPPING_COMPLIANCE_EVIDENCE_PACK_VERSION,
      status:pack.status,
      evidenceCategoryCount:obj(pack.evidenceSummary).evidenceCategoryCount || 0,
      blockedEvidenceCount:obj(pack.evidenceSummary).blockedEvidenceCount || 0,
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

  function sanitizeGlobalShoppingComplianceEvidencePack(pack) {
    const safe = obj(pack);
    const evaluation = evaluateGlobalShoppingComplianceEvidencePack(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      packName:PACK_NAME,
      appVersion:GLOBAL_SHOPPING_COMPLIANCE_EVIDENCE_PACK_VERSION,
      status:status,
      evidenceBoundary:{
        packId:text(safe.packId || "global-shopping-compliance-evidence-pack"),
        packMode:/^(disabled|evidence_only|readiness_only|mock)$/.test(text(safe.packMode)) ? text(safe.packMode) : "evidence_only",
        evidenceOnly:true,
        readinessOnly:true,
        mockOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canWriteFile:false,
        canDownload:false,
        canExportRealFile:false,
        canUploadEvidence:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canPersistRawUserText:false,
        canPersistRawProviderRequest:false,
        canPersistRawProviderResponse:false,
        canIncludeSecret:false,
        canStartRealProvider:false,
        canEnableProvider:false
      },
      evidenceSummary:clone(evaluation.evidenceSummary),
      evidenceCategories:clone(evaluation.evidenceCategories),
      evidenceHealth:clone(evaluation.evidenceHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingComplianceEvidenceRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"合规证据包",
        resultLabel:status === "ready" ? "合规证据包已准备" : (status === "blocked" ? "合规证据已阻断" : "合规证据仍需复核"),
        caveat:"该证据包只展示合规证据摘要，不写文件，不下载，不上传，不包含密钥或 raw provider 数据。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingComplianceEvidencePack(input) {
    try {
      return sanitizeGlobalShoppingComplianceEvidencePack(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingComplianceEvidencePack({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingComplianceEvidencePack = {
    GLOBAL_SHOPPING_COMPLIANCE_EVIDENCE_PACK_VERSION,
    PACK_NAME,
    buildGlobalShoppingComplianceEvidencePack,
    evaluateGlobalShoppingComplianceEvidencePack,
    buildGlobalShoppingComplianceEvidenceRows,
    buildGlobalShoppingComplianceEvidenceCategories,
    buildGlobalShoppingComplianceEvidencePackAuditDraft,
    sanitizeGlobalShoppingComplianceEvidencePack
  };
})();
