;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_LEGAL_REVIEW_DOSSIER_VERSION = "4.2.2";
  const DOSSIER_NAME = "global_shopping_provider_legal_review_dossier_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawResponse|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function safeSummaryLabel(summary, fallback) {
    return text(obj(obj(summary).userFacingSummary).resultLabel || obj(summary).title || fallback || "");
  }
  function section(sectionId, title, status, summary, caveat) {
    return {
      sectionId:text(sectionId),
      title:text(title),
      status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review",
      requiredBeforeRealSandbox:true,
      summary:text(summary),
      caveat:text(caveat),
      redacted:true
    };
  }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId),
      label:text(label),
      value:text(value),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
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

  function buildGlobalShoppingProviderLegalReviewSections(input) {
    const safe = obj(input);
    const evaluation = evaluateGlobalShoppingProviderLegalReviewDossier(safe);
    const blocked = evaluation.status === "blocked";
    const ready = !blocked && evaluation.status === "ready";
    function passOrReview(summary, caveat) {
      return blocked ? "blocked" : (ready ? "pass" : "needs_review");
    }
    return clone([
      section("read_only_query_permission", "只读价格查询权限", passOrReview(), "未来接入前必须人工核对是否允许只读价格查询。", "当前档案只记录待核对边界，不代表已获许可。"),
      section("display_permission", "平台名称与价格展示权限", passOrReview(), "未来接入前必须人工核对是否允许展示平台名称与价格。", "当前不声称已有展示授权。"),
      section("cache_and_retention", "缓存与数据保留要求", passOrReview(), "未来接入前必须人工核对缓存、隐私与数据保留要求。", "当前不落地 provider 原始响应。"),
      section("jump_and_affiliate", "跳转与 affiliate disclosure", passOrReview(), "未来接入前必须人工核对是否允许跳转、是否需要 affiliate disclosure。", "当前不打开外部平台，不声称合作。"),
      section("region_restriction", "地域限制", passOrReview(), "未来接入前必须人工核对是否存在地域限制。", "当前不启用 provider。"),
      section("anti_scraping", "反爬虫与自动化限制", passOrReview(), "未来接入前必须人工核对是否禁止爬虫与自动化调用。", "当前不联网、不抓取真实平台。"),
      section("no_auto_booking", "自动下单边界", blocked ? "blocked" : "pass", "未来接入前必须明确禁止自动下单与出票。", "本轮保持 no booking / no ticketing。"),
      section("no_payment_proxy", "支付代理边界", blocked ? "blocked" : "pass", "未来接入前必须明确禁止支付代理。", "本轮保持 no payment。"),
      section("brand_and_api_authorization", "品牌与 API 授权", passOrReview(), "未来接入前必须人工核对品牌、商标和 API 授权要求。", "当前不声称已授权。"),
      section("no_claims", "合作/授权/官方背书声明边界", blocked ? "blocked" : "pass", "当前不得声称已合作、已授权或获得官方背书。", "档案已准备不代表合作或授权成立。"),
      section("manual_approval", "人工法务与安全审批", blocked ? "blocked" : "pass", "下一步仍需人工法务和安全审批。", "档案已准备不代表可以开始真实接入。")
    ]);
  }

  function evaluateGlobalShoppingProviderLegalReviewDossier(input) {
    const safe = obj(input);
    const providerContractSelectionBoardSummary = resolveSummary(safe, "providerContractSelectionBoardSummary", "WeishanGlobalShoppingProviderContractSelectionBoard", "buildGlobalShoppingProviderContractSelectionBoard", safe);
    const integrationBlueprintSummary = resolveSummary(safe, "readOnlySandboxProviderIntegrationBlueprintSummary", "WeishanGlobalShoppingReadOnlySandboxProviderIntegrationBlueprint", "buildGlobalShoppingReadOnlySandboxProviderIntegrationBlueprint", safe);
    const nextFeatureReadinessGateSummary = resolveSummary(safe, "nextFeatureReadinessGateSummary", "WeishanGlobalShoppingNextFeatureReadinessGate", "buildGlobalShoppingNextFeatureReadinessGate", safe);
    const blocked =
      safe.claimPartnership === true ||
      safe.claimAuthorization === true ||
      safe.claimOfficialEndorsement === true ||
      safe.enableProvider === true ||
      safe.callProvider === true ||
      safe.openExternal === true ||
      safe.windowOpen === true ||
      safe.startContractNow === true ||
      safe.canStartContractNow === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl;
    const legalSummary = {
      hasProviderContractSelectionBoard:Object.keys(providerContractSelectionBoardSummary).length > 0,
      hasIntegrationBlueprint:Object.keys(integrationBlueprintSummary).length > 0,
      hasNextFeatureReadinessGate:Object.keys(nextFeatureReadinessGateSummary).length > 0,
      requirementCount:11,
      missingReviewCount:0,
      blockedRiskCount:blocked ? 1 : 0,
      legalReviewRequired:true,
      securityReviewRequired:true,
      manualApprovalRequired:true
    };
    legalSummary.missingReviewCount =
      (legalSummary.hasProviderContractSelectionBoard ? 0 : 1) +
      (legalSummary.hasIntegrationBlueprint ? 0 : 1) +
      (legalSummary.hasNextFeatureReadinessGate ? 0 : 1);
    const needsReview =
      !legalSummary.hasProviderContractSelectionBoard ||
      !legalSummary.hasIntegrationBlueprint ||
      !legalSummary.hasNextFeatureReadinessGate;
    const legalHealth = {
      readOnlyQueryPermissionMustBeVerified:true,
      priceDisplayPermissionMustBeVerified:true,
      cachePolicyMustBeVerified:true,
      jumpPolicyMustBeVerified:true,
      affiliateDisclosureMustBeVerified:true,
      regionalRestrictionMustBeVerified:true,
      antiScrapingPolicyMustBeVerified:true,
      noAutoBookingRequired:true,
      noPaymentProxyRequired:true,
      privacyRetentionMustBeVerified:true,
      noPartnershipClaim:safe.claimPartnership !== true,
      noAuthorizationClaim:safe.claimAuthorization !== true,
      noOfficialEndorsementClaim:safe.claimOfficialEndorsement !== true,
      noProviderEnablement:safe.enableProvider !== true,
      noProviderCall:safe.callProvider !== true
    };
    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      providerContractSelectionBoardSummary:providerContractSelectionBoardSummary,
      readOnlySandboxProviderIntegrationBlueprintSummary:integrationBlueprintSummary,
      nextFeatureReadinessGateSummary:nextFeatureReadinessGateSummary,
      legalSummary:legalSummary,
      legalHealth:legalHealth,
      blockedReasons:blocked ? [
        safe.startContractNow === true || safe.canStartContractNow === true ? "contract_start_detected" : "",
        safe.claimPartnership === true ? "partnership_claim_detected" : "",
        safe.claimAuthorization === true ? "authorization_claim_detected" : "",
        safe.claimOfficialEndorsement === true ? "official_endorsement_claim_detected" : "",
        safe.enableProvider === true ? "provider_enablement_detected" : "",
        safe.callProvider === true ? "provider_call_detected" : "",
        safe.openExternal === true || safe.windowOpen === true ? "external_open_detected" : "",
        safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ? "transaction_url_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingProviderLegalReviewRows(input) {
    const safe = obj(input);
    const evaluation = evaluateGlobalShoppingProviderLegalReviewDossier(safe);
    const sections = buildGlobalShoppingProviderLegalReviewSections(safe);
    return clone(sections.map(function (item) {
      return row(item.sectionId, item.title, item.summary, item.status === "blocked" ? "blocked" : (item.status === "pass" ? "pass" : "warning"));
    }).concat([
      row("provider_contract_selection_board", "Provider 合同/授权选择板", safeSummaryLabel(evaluation.providerContractSelectionBoardSummary, "Provider 选择仍需复核"), evaluation.legalSummary.hasProviderContractSelectionBoard ? "pass" : "warning"),
      row("integration_blueprint", "只读 Sandbox Provider 接入蓝图", safeSummaryLabel(evaluation.readOnlySandboxProviderIntegrationBlueprintSummary, "接入蓝图仍需复核"), evaluation.legalSummary.hasIntegrationBlueprint ? "pass" : "warning"),
      row("next_feature_gate", "下一功能准备闸门", safeSummaryLabel(evaluation.nextFeatureReadinessGateSummary, "下一功能准备仍需复核"), evaluation.legalSummary.hasNextFeatureReadinessGate ? "pass" : "warning"),
      row("manual_approval_required", "人工审批", "下一步仍需人工法务与安全审批", evaluation.status === "blocked" ? "blocked" : "pass")
    ]));
  }

  function buildGlobalShoppingProviderLegalReviewDossierAuditDraft(input) {
    const dossier = buildGlobalShoppingProviderLegalReviewDossier(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_LEGAL_REVIEW_DOSSIER_AUDIT_DRAFT",
      dossierName:DOSSIER_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_LEGAL_REVIEW_DOSSIER_VERSION,
      status:dossier.status,
      blockedReasonCount:toArray(dossier.blockedReasons).length,
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

  function sanitizeGlobalShoppingProviderLegalReviewDossier(dossier) {
    const safe = obj(dossier);
    const evaluation = evaluateGlobalShoppingProviderLegalReviewDossier(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      dossierName:DOSSIER_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_LEGAL_REVIEW_DOSSIER_VERSION,
      status:status,
      legalBoundary:{
        dossierId:text(safe.dossierId || "global-shopping-provider-legal-review-dossier"),
        dossierMode:/^(disabled|review_only|planning_only|sandbox_ready)$/.test(text(safe.dossierMode)) ? text(safe.dossierMode) : "review_only",
        reviewOnly:true,
        planningOnly:true,
        readOnly:true,
        sandboxOnly:true,
        redactedOnly:true,
        productionDisabled:true,
        canStartContractNow:false,
        canClaimPartnership:false,
        canClaimAuthorization:false,
        canClaimOfficialEndorsement:false,
        canEnableProvider:false,
        canCallProvider:false,
        canOpenExternalNow:false
      },
      legalSummary:clone(evaluation.legalSummary),
      legalReviewSections:toArray(safe.legalReviewSections).length ? toArray(safe.legalReviewSections) : buildGlobalShoppingProviderLegalReviewSections(safe),
      legalHealth:clone(evaluation.legalHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingProviderLegalReviewRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      providerContractSelectionBoardSummary:clone(evaluation.providerContractSelectionBoardSummary),
      readOnlySandboxProviderIntegrationBlueprintSummary:clone(evaluation.readOnlySandboxProviderIntegrationBlueprintSummary),
      nextFeatureReadinessGateSummary:clone(evaluation.nextFeatureReadinessGateSummary),
      userFacingSummary:{
        title:"Provider 法务审查档案",
        resultLabel:status === "ready" ? "法务审查档案已准备" : (status === "blocked" ? "法务审查已阻断" : "法务审查仍需复核"),
        caveat:"该档案只用于未来 provider 接入前的人工法务和安全审查，不代表合作、授权、背书或已接入。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingProviderLegalReviewDossier(input) {
    try {
      return sanitizeGlobalShoppingProviderLegalReviewDossier(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderLegalReviewDossier({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderLegalReviewDossier = {
    GLOBAL_SHOPPING_PROVIDER_LEGAL_REVIEW_DOSSIER_VERSION,
    DOSSIER_NAME,
    buildGlobalShoppingProviderLegalReviewDossier,
    evaluateGlobalShoppingProviderLegalReviewDossier,
    buildGlobalShoppingProviderLegalReviewRows,
    buildGlobalShoppingProviderLegalReviewSections,
    buildGlobalShoppingProviderLegalReviewDossierAuditDraft,
    sanitizeGlobalShoppingProviderLegalReviewDossier
  };
})();
