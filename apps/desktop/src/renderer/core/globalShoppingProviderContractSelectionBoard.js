;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_CONTRACT_SELECTION_BOARD_VERSION = "2.3.3";
  const BOARD_NAME = "global_shopping_provider_contract_selection_board_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawResponse|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function requirement(requirementId, label, status, summary, caveat) {
    return {
      requirementId:text(requirementId),
      label:text(label),
      status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review",
      requiredBeforeRealSandbox:true,
      summary:text(summary),
      caveat:text(caveat),
      redacted:true
    };
  }
  function recommendation(providerType, recommendationLabel, reason, caveat) {
    return {
      providerType:/^(official|authorized|partner|affiliate|aggregator|fixture|unknown)$/.test(providerType) ? providerType : "unknown",
      recommendationLabel:/^(prefer|acceptable_with_review|needs_legal_review|blocked)$/.test(recommendationLabel) ? recommendationLabel : "needs_legal_review",
      reason:text(reason),
      caveat:text(caveat),
      redacted:true
    };
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
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

  function buildGlobalShoppingProviderContractRequirementRows(input) {
    const safe = obj(input);
    return clone([
      requirement("read_only_price_query", "是否允许只读价格查询", safe.readOnlyPriceQueryAllowedKnown === false ? "needs_review" : "pass", "未来接入前必须核对只读查询权限。", "当前不接 provider。"),
      requirement("cache_policy", "是否允许缓存", safe.cachePolicyKnown === false ? "needs_review" : "pass", "缓存策略必须经过合同/法务复核。", "当前不落地缓存。"),
      requirement("display_rights", "是否允许展示平台名称与价格", safe.displayRightsKnown === false ? "needs_review" : "pass", "展示 rights 必须被明确允许。", "当前只输出规划，不代表展示授权已拿到。"),
      requirement("jump_policy", "是否允许用户跳转", safe.jumpPolicyKnown === false ? "needs_review" : "pass", "跳转政策需要和 disclosure 一起核对。", "当前不打开外部平台。"),
      requirement("affiliate_disclosure", "是否要求 affiliate disclosure", safe.affiliateDisclosureKnown === false ? "needs_review" : "pass", "如存在 affiliate 模式，必须先确认披露要求。", "当前不声称合作。"),
      requirement("region_policy", "是否限制地域", safe.regionPolicyKnown === false ? "needs_review" : "pass", "地域限制必须在接入前明确。", "当前不启用 provider。"),
      requirement("brand_authorization", "是否要求品牌授权", safe.brandAuthorizationKnown === false ? "needs_review" : "pass", "品牌与商标使用权限必须先确认。", "当前不声称已授权。"),
      requirement("anti_scraping", "是否禁止爬虫", safe.antiScrapingPolicyMustBeVerified === false ? "blocked" : "pass", "反爬虫 / 自动化限制必须先核对。", "不得把未来接入建立在未核实的抓取路径上。"),
      requirement("no_auto_booking", "是否禁止自动下单", safe.noAutoBookingRequired === false ? "blocked" : "pass", "任何合同都必须保留 no auto-booking 边界。", "本轮不下单。"),
      requirement("no_payment_proxy", "是否禁止支付代理", safe.noPaymentProxyRequired === false ? "blocked" : "pass", "任何合同都必须保留 no payment proxy 边界。", "本轮不付款。"),
      requirement("retention_privacy", "是否存在数据保留与隐私要求", safe.privacyRetentionMustBeVerified === false ? "needs_review" : "pass", "隐私 / 保留政策必须在接入前核对。", "当前不保存真实身份与原始响应。")
    ]);
  }

  function evaluateGlobalShoppingProviderContractSelection(input) {
    const safe = obj(input);
    const providerRequirementRows = safe.omitProviderRequirements === true ? [] : buildGlobalShoppingProviderContractRequirementRows(safe);
    const contractHealth = {
      readOnlyPriceQueryAllowedMustBeVerified:true,
      cachePolicyMustBeVerified:true,
      displayRightsMustBeVerified:true,
      jumpPolicyMustBeVerified:true,
      affiliateDisclosureMustBeVerified:true,
      regionPolicyMustBeVerified:true,
      antiScrapingPolicyMustBeVerified:safe.antiScrapingPolicyMustBeVerified !== false,
      noAutoBookingRequired:safe.noAutoBookingRequired !== false,
      noPaymentProxyRequired:safe.noPaymentProxyRequired !== false,
      privacyRetentionMustBeVerified:safe.privacyRetentionMustBeVerified !== false,
      noPartnershipClaim:safe.claimPartnership !== true,
      noAuthorizationClaim:safe.claimAuthorization !== true,
      noOfficialEndorsementClaim:safe.claimOfficialEndorsement !== true
    };
    const blocked =
      safe.claimPartnership === true ||
      safe.claimAuthorization === true ||
      safe.claimOfficialEndorsement === true ||
      safe.enableProvider === true ||
      safe.callProvider === true ||
      safe.openExternal === true ||
      safe.windowOpen === true ||
      safe.antiScrapingPolicyMustBeVerified === false ||
      safe.noAutoBookingRequired === false ||
      safe.noPaymentProxyRequired === false;
    const needsReview = providerRequirementRows.length === 0;
    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      providerRequirementRows:providerRequirementRows,
      providerTypeRecommendations:[
        recommendation("official", "prefer", "优先评估官方或明确受控的数据 / 合作路径。", "仍需法务与安全复核。"),
        recommendation("authorized", "acceptable_with_review", "可在合同与展示权清晰时评估。", "不代表已授权。"),
        recommendation("partner", "needs_legal_review", "Partner 模式必须先确认合同、品牌和披露义务。", "当前不声称已合作。"),
        recommendation("affiliate", "needs_legal_review", "Affiliate 模式需要额外核对 disclosure、跳转和支付边界。", "不代表已接入。"),
        recommendation("aggregator", "needs_legal_review", "聚合器需重点核对爬虫、缓存、展示与地域规则。", "不得绕过官方限制。"),
        recommendation("fixture", "acceptable_with_review", "Fixture 只适合开发与验证，不代表真实 provider 接入。", "仍需在真实接入前重新核对。"),
        recommendation("unknown", "blocked", "来源不明的 provider 类型不应进入下一阶段。", "必须先明确授权与合同边界。")
      ],
      contractHealth:contractHealth,
      blockedReasons:blocked ? [
        safe.claimPartnership === true ? "partnership_claim_detected" : "",
        safe.claimAuthorization === true ? "authorization_claim_detected" : "",
        safe.claimOfficialEndorsement === true ? "official_endorsement_claim_detected" : "",
        safe.enableProvider === true ? "provider_enablement_detected" : "",
        safe.callProvider === true ? "provider_call_detected" : "",
        safe.openExternal === true || safe.windowOpen === true ? "external_open_detected" : "",
        safe.antiScrapingPolicyMustBeVerified === false ? "anti_scraping_unverified" : "",
        safe.noAutoBookingRequired === false ? "auto_booking_risk_detected" : "",
        safe.noPaymentProxyRequired === false ? "payment_proxy_risk_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingProviderContractSelectionRows(input) {
    const evaluation = evaluateGlobalShoppingProviderContractSelection(input);
    return evaluation.providerRequirementRows.map(function (item) {
      return row(item.requirementId, item.label, item.summary, item.status === "blocked" ? "blocked" : (item.status === "pass" ? "pass" : "warning"));
    });
  }

  function buildGlobalShoppingProviderContractSelectionBoardAuditDraft(input) {
    const board = buildGlobalShoppingProviderContractSelectionBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_CONTRACT_SELECTION_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_CONTRACT_SELECTION_BOARD_VERSION,
      status:board.status,
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

  function sanitizeGlobalShoppingProviderContractSelectionBoard(board) {
    const safe = obj(board);
    const evaluation = evaluateGlobalShoppingProviderContractSelection(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_CONTRACT_SELECTION_BOARD_VERSION,
      status:status,
      contractBoundary:{
        boardId:text(safe.boardId || "global-shopping-provider-contract-selection-board"),
        boardMode:/^(disabled|review_only|planning_only|sandbox_ready)$/.test(text(safe.boardMode)) ? text(safe.boardMode) : "review_only",
        reviewOnly:true,
        planningOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        doesNotClaimPartnership:true,
        doesNotClaimAuthorization:true,
        doesNotClaimOfficialEndorsement:true,
        canStartProviderContract:false,
        canEnableProvider:false,
        canCallProvider:false,
        canOpenExternalNow:false
      },
      providerRequirementRows:toArray(safe.providerRequirementRows).length ? toArray(safe.providerRequirementRows) : evaluation.providerRequirementRows,
      providerTypeRecommendations:toArray(safe.providerTypeRecommendations).length ? toArray(safe.providerTypeRecommendations) : evaluation.providerTypeRecommendations,
      contractHealth:clone(evaluation.contractHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingProviderContractSelectionRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"Provider 合同/授权选择板",
        resultLabel:status === "ready" ? "Provider 选择板已准备" : (status === "blocked" ? "Provider 选择已阻断" : "Provider 选择仍需复核"),
        caveat:"该选择板只用于未来接入前的合同/授权核对，不代表已经合作、授权、背书或接入。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingProviderContractSelectionBoard(input) {
    try {
      return sanitizeGlobalShoppingProviderContractSelectionBoard(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderContractSelectionBoard({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderContractSelectionBoard = {
    GLOBAL_SHOPPING_PROVIDER_CONTRACT_SELECTION_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingProviderContractSelectionBoard,
    evaluateGlobalShoppingProviderContractSelection,
    buildGlobalShoppingProviderContractSelectionRows,
    buildGlobalShoppingProviderContractRequirementRows,
    buildGlobalShoppingProviderContractSelectionBoardAuditDraft,
    sanitizeGlobalShoppingProviderContractSelectionBoard
  };
})();
