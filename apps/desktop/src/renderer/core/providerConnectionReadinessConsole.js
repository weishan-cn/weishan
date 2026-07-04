;(function () {
  "use strict";

  const PROVIDER_CONNECTION_READINESS_CONSOLE_VERSION = "4.2.3";

  const CATEGORY_DEFINITIONS = {
    flight_provider: {
      displayName: "机票 Provider",
      category: "flight",
      candidateDirections: ["用户自带 API", "weishan 候选只读价格源", "官方航空公司渠道", "合规 OTA 只读接口"],
      gaps: ["manual provider review workflow: v1", "manual review state: approved_for_limited_beta", "limited real price UI beta: flight_only", "limited beta kill switch: active", "rollback guard: active", "manual booking handoff: manual-only", "beta rollback state: not_needed", "limited beta display gate: draft-ready", "limited beta price display: guarded only", "real credential not connected", "production provider activation disabled", "endpoint allowlist enforcement draft-ready", "sandbox real-key dry run gate draft-ready", "sandbox response schema gate draft-ready", "real provider result schema validation draft-ready", "provider result source label gate draft-ready", "price integrity / taxes / fees gate draft-ready", "real price display gate guarded-display-ready", "production price display disabled", "bookingUrl display disabled", "sandbox dry run transport simulated only", "read-only adapter contract draft-ready", "credential consent scope gate draft-ready", "no-secret persistence guard 必须持续 PASS", "no-network runtime guard 必须持续 PASS"]
    },
    hotel_provider: {
      displayName: "酒店 Provider",
      category: "hotel",
      candidateDirections: ["用户自带 API", "weishan 候选只读房价源", "酒店官网渠道", "合规 OTA 只读接口"],
      gaps: ["房价字段 schema 未完成", "税费 / 清洁费 / 服务费规则未完成", "取消政策字段未完成", "入住人实名字段不得保存", "bookingUrl safety gate 未完成", "provider review 未完成"]
    },
    product_provider: {
      displayName: "商品 Provider",
      category: "product",
      candidateDirections: ["用户自带 API", "官方商城", "合规电商平台只读搜索接口", "品牌官网"],
      gaps: ["正品来源规则未完成", "保修 / 退货 / 物流 / 税费字段未完成", "库存字段不得伪造", "checkoutUrl 禁止", "payment/order 禁止", "counterfeit / stolen goods guard 必须保持"]
    },
    local_service_provider: {
      displayName: "本地服务 Provider",
      category: "local_service",
      candidateDirections: ["用户自带 API", "官方服务商目录", "合规本地服务平台只读接口", "人工核验来源"],
      gaps: ["服务商资质字段未完成", "评价来源规则未完成", "报价不得伪造", "合同 / 保险字段只做提示", "不提交地址 / 身份证 / 银行卡", "不代付 / 不下单"]
    },
    ticket_activity_provider: {
      displayName: "门票 / 活动 Provider",
      category: "ticket_or_activity",
      candidateDirections: ["用户自带 API", "官方票务渠道", "合规票务平台只读接口", "景区 / 活动官网"],
      gaps: ["官方渠道识别未完成", "票种 / 日期 / 人数 / 退改规则字段未完成", "真实票价不得伪造", "bookingUrl safety gate 未完成", "不跳转付款", "不下单"]
    },
    restricted_provider: {
      displayName: "受限品类",
      category: "restricted_or_blocked",
      candidateDirections: ["不允许接入", "不允许展示搜索入口", "不允许复制采购条件", "不允许外部搜索", "不允许购买路径"],
      gaps: ["永久 blocked", "不进入 provider 接入准备流程", "不显示外部搜索入口", "不显示复制搜索条件", "不显示购买建议", "不提供规避建议"]
    }
  };

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function list(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
  }

  function buildDecision(providerCategory) {
    const engine = window.WeishanProviderConnectionReadinessDecisionEngine;
    const input = {
      providerCategory,
      featureFlags: { restrictedCategory: providerCategory === "restricted_provider" },
      safetyGates: {
        endpointAllowlist: providerCategory === "flight_provider",
        sandboxGate: providerCategory === "flight_provider",
        schemaGate: providerCategory === "flight_provider" || providerCategory === "restricted_provider",
        sourceLabelGate: providerCategory === "flight_provider",
        priceIntegrityGate: providerCategory === "flight_provider"
      },
      credentialState: {
        secureStorageImplementationReady: providerCategory !== "restricted_provider",
        realCredentialConnected: false,
        consentApproved: false,
        consentState: providerCategory === "flight_provider" ? "draft_ready" : "missing"
      },
      adapterState: { readonlyAdapterApproved: false, adapterContractState: providerCategory === "flight_provider" ? "draft_ready" : "missing", flightAdapterV1State: providerCategory === "flight_provider" ? "offline_fixture_ready" : "not_started", endpointAllowlistEnforcementState: providerCategory === "flight_provider" ? "draft_ready" : "missing", sandboxRealKeyDryRunGateState: providerCategory === "flight_provider" ? "draft_ready" : "missing", sandboxResponseSchemaGateState: providerCategory === "flight_provider" ? "draft_ready" : "missing", realProviderResultSchemaValidationState: providerCategory === "flight_provider" ? "draft_ready" : "missing", providerResultSourceLabelGateState: providerCategory === "flight_provider" ? "draft_ready" : "missing", sandboxDryRunTransport: providerCategory === "flight_provider" ? "simulated_only" : "disabled" },
      manualReviewState: { approved: false }
    };
    const decision = engine && typeof engine.evaluateProviderConnectionReadiness === "function"
      ? engine.evaluateProviderConnectionReadiness(input)
      : {
        decision: providerCategory === "restricted_provider" ? "blocked" : "no-go",
        reasons: providerCategory === "restricted_provider" ? ["restricted category is permanently blocked"] : ["readiness requirements missing"],
        missingRequirements: providerCategory === "restricted_provider" ? [] : ["endpoint allowlist", "sandbox gate", "schema gate", "source label gate", "price integrity gate", "credential consent", "manual provider review"],
        forbiddenActions: providerCategory === "restricted_provider" ? ["provider connection", "external search", "copy procurement condition", "purchase advice"] : [],
        nextAllowedSteps: providerCategory === "restricted_provider" ? ["show restricted safety block only"] : ["complete readiness gates"],
        auditDraft: {
          eventType: "PROVIDER_CONNECTION_READINESS_CONSOLE_DRAFT",
          providerCategory,
          decision: providerCategory === "restricted_provider" ? "blocked" : "no-go",
          missingRequirements: [],
          forbiddenActions: [],
          approvedProviderCount: 0,
          connectedProviderCount: 0,
          realProviderCallCount: 0,
          networkAttemptCount: 0,
          realApiKeyReadCount: 0,
          realEndpointConnectCount: 0,
          realPriceDisplayedCount: 0,
          realPriceReturnCount: 0,
          bookingUrlDisplayedCount: 0,
          bookingUrlReturnCount: 0,
          paymentAttemptCount: 0,
          orderAttemptCount: 0,
          identityUploadAttemptCount: 0,
          redacted: true
        },
        redacted: true
      };
    if (engine && typeof engine.assertProviderConnectionReadinessDecisionSafe === "function") {
      engine.assertProviderConnectionReadinessDecisionSafe(decision);
    }
    return decision;
  }

  function providerStatus(providerCategory) {
    return providerCategory === "restricted_provider" ? "blocked" : "not_ready";
  }

  function finalDecision(providerCategory) {
    if (providerCategory === "flight_provider") return "limited-beta-ready";
    return providerCategory === "restricted_provider" ? "blocked" : "no-go";
  }

  function buildProviderRow(providerCategory) {
    const definition = CATEGORY_DEFINITIONS[providerCategory];
    const decision = buildDecision(providerCategory);
    const restricted = providerCategory === "restricted_provider";
    const manualApi = window.WeishanManualProviderReviewWorkflowV1;
    const betaApi = window.WeishanLimitedRealPriceUiBetaGate;
    const killApi = window.WeishanLimitedBetaKillSwitch;
    const rollbackApi = window.WeishanLimitedBetaRollbackGuard;
    const handoffApi = window.WeishanManualBookingHandoff;
    const preferenceApi = window.WeishanLimitedBetaPreferencePersistence;
    const preferenceGuardApi = window.WeishanLimitedBetaUserPreferenceGuard;
    const manualReview = providerCategory === "flight_provider" && manualApi && typeof manualApi.evaluateManualProviderReviewForBeta === "function"
      ? manualApi.evaluateManualProviderReviewForBeta(manualApi.buildSampleFlightProviderReview())
      : { allowedForLimitedBeta:false, manualReviewState:restricted ? "blocked" : "not_started", blockedReason:restricted ? "restricted category blocked" : "limited beta flight only", redacted:true };
    const betaDecision = betaApi && typeof betaApi.evaluateLimitedRealPriceUiBetaGate === "function"
      ? betaApi.evaluateLimitedRealPriceUiBetaGate({
        candidate: betaApi.buildLimitedBetaFlightPriceCandidate ? betaApi.buildLimitedBetaFlightPriceCandidate({ providerId:providerCategory, providerCategory:definition.category }) : { providerId:providerCategory, providerCategory:definition.category },
        manualProviderReview: manualReview,
        priceIntegrityValidation:{ validationDecision:providerCategory === "flight_provider" ? "pass" : "withheld" },
        sourceLabelValidation:{ validationDecision:providerCategory === "flight_provider" ? "pass" : "withheld" },
        schemaValidation:{ validationDecision:providerCategory === "flight_provider" ? "pass" : "withheld" },
        displaySurface:"ordinary_result_card"
      })
      : { displayDecision:providerCategory === "flight_provider" ? "allow_limited_beta_price_card" : (restricted ? "blocked" : "withheld"), redacted:true };
    const limitedBetaReady = providerCategory === "flight_provider" && manualReview.manualReviewState === "approved_for_limited_beta" && betaDecision.displayDecision === "allow_limited_beta_price_card";
    const preferenceDraft = preferenceApi && typeof preferenceApi.buildPersistenceDraft === "function" ? preferenceApi.buildPersistenceDraft() : null;
    const killVisibility = killApi && typeof killApi.evaluateLimitedBetaVisibility === "function"
      ? killApi.evaluateLimitedBetaVisibility({ category:definition.category, providerCategory:definition.category, providerId:providerCategory === "flight_provider" ? "flight_provider" : providerCategory, surface:"ordinary_result_card" })
      : { priceCardVisible:limitedBetaReady, killSwitchState:restricted ? "blocked" : "enabled", priceCardHidden:!limitedBetaReady, redacted:true };
    const rollbackDecision = rollbackApi && typeof rollbackApi.evaluateLimitedBetaRollbackGuard === "function"
      ? rollbackApi.evaluateLimitedBetaRollbackGuard({
        providerCategory: definition.category,
        providerId: providerCategory === "flight_provider" ? "flight_provider" : providerCategory,
        schemaValidation:{ validationDecision:providerCategory === "flight_provider" ? "pass" : "withheld" },
        sourceLabelValidation:{ validationDecision:providerCategory === "flight_provider" ? "pass" : "withheld" },
        priceIntegrityValidation:{ validationDecision:providerCategory === "flight_provider" ? "pass" : "withheld" },
        manualProviderReview: manualReview,
        killSwitchState: killVisibility.killSwitchState
      })
      : { rollbackDecision:restricted ? "rollback_active" : "not_needed", fallbackSurface:"offline_planning_only", redacted:true };
    const handoff = handoffApi && typeof handoffApi.buildManualBookingHandoff === "function"
      ? handoffApi.buildManualBookingHandoff({ providerCategory:definition.category, providerId:providerCategory === "flight_provider" ? "flight_provider" : providerCategory, rollbackDecision:rollbackDecision.rollbackDecision })
      : { status:providerCategory === "flight_provider" ? "manual_only" : (restricted ? "blocked" : "not_allowed"), redacted:true };
    const preferenceDecision = preferenceGuardApi && typeof preferenceGuardApi.evaluateLimitedBetaUserPreferenceGuard === "function" ? preferenceGuardApi.evaluateLimitedBetaUserPreferenceGuard({ persistedPreference:preferenceDraft && preferenceDraft.preference, currentRequestCategory:definition.category, providerId:providerCategory === "flight_provider" ? "flight_provider" : providerCategory, restrictedDecision:restricted ? "blocked" : "allow", rollbackDecision:rollbackDecision.rollbackDecision, userConfirmationState:preferenceDraft && preferenceDraft.preference && preferenceDraft.preference.restoreConfirmationPending ? "missing" : "confirmed" }) : { preferenceDecision:"allow", confirmationRequired:false, persistedPreferenceLoaded:false, persistedPreferenceValid:true, redacted:true };
    const killSwitchAllows = limitedBetaReady && killVisibility.priceCardVisible === true && rollbackDecision.rollbackDecision === "not_needed" && preferenceDecision.preferenceDecision === "allow";
    const rowFinalDecision = restricted ? "blocked" : (providerCategory !== "flight_provider" ? "no-go" : (rollbackDecision.rollbackDecision === "rollback_active" ? "limited-beta-rollback-active" : (preferenceDecision.preferenceDecision === "withheld" || preferenceDecision.preferenceDecision === "confirmation_required" || killVisibility.killSwitchState === "disabled" ? "limited-beta-disabled-by-user-preference" : (killSwitchAllows ? "limited-beta-ready" : (limitedBetaReady ? "limited-beta-disabled-by-kill-switch" : "no-go")))));
    return clone({
      providerCategory,
      providerLabel: definition.displayName,
      providerName: definition.displayName,
      providerType: definition.category,
      displayName: definition.displayName,
      currentStatus: limitedBetaReady ? "limited_beta_ready" : providerStatus(providerCategory),
      candidateDirections: definition.candidateDirections,
      canPrepare: restricted ? ["安全阻断说明", "受限品类审计证据"] : ["只读 schema 草案", "离线 fixture", "人工审核材料", "安全闸门检查清单"],
      currentGaps: definition.gaps,
      forbiddenActions: restricted
        ? ["provider 接入", "外部搜索入口", "复制采购条件", "购买建议", "规避建议", "payment/order/identity upload"]
        : ["real provider connection", "real network", "real API key", "real endpoint", "real price", "availability", "bookingUrl", "payment", "order", "identity upload"],
      nextStageRequirements: restricted
        ? ["保持永久 blocked", "只展示安全阻断", "不进入接入准备流程"]
        : ["完成 endpoint allowlist", "完成 sandbox gate", "完成 result schema gate", "完成 source label gate", "完成 price integrity gate", "连接真实凭据前完成人工 consent", "完成人工审核"],
      readinessMatrix: {
        providerType: definition.displayName,
        currentStatus: providerStatus(providerCategory),
        readonlyAdapter: restricted ? "not allowed" : (providerCategory === "flight_provider" ? "draft-ready" : "missing"),
        endpointAllowlist: restricted ? "not allowed" : (providerCategory === "flight_provider" ? "draft-ready" : "not_started"),
        endpointAllowlistEnforcement: restricted ? "not allowed" : (providerCategory === "flight_provider" ? "draft-ready" : "not_started"),
        sandboxGate: restricted ? "not allowed" : (providerCategory === "flight_provider" ? "controlled dry-run ready" : "not_started"),
        sandboxRealKeyDryRunGate: restricted ? "not allowed" : (providerCategory === "flight_provider" ? "draft-ready" : "not_started"),
        sandboxDryRunTransport: restricted ? "not allowed" : (providerCategory === "flight_provider" ? "simulated only" : "disabled"),
        schemaGate: restricted ? "not allowed" : (providerCategory === "flight_provider" ? "draft-ready" : "not_started"),
        sourceLabelGate: restricted ? "not allowed" : (providerCategory === "flight_provider" ? "draft-ready" : "not_started"),
        sandboxResponseSchemaGate: restricted ? "not allowed" : (providerCategory === "flight_provider" ? "draft-ready" : "not_started"),
        realProviderResultSchemaValidation: restricted ? "not allowed" : (providerCategory === "flight_provider" ? "draft-ready" : "not_started"),
        providerResultSourceLabelGate: restricted ? "not allowed" : (providerCategory === "flight_provider" ? "draft-ready" : "not_started"),
        priceIntegrityGate: restricted ? "not allowed" : (providerCategory === "flight_provider" ? "draft-ready" : "not_started"),
        priceIntegrityTaxesFeesGate: restricted ? "not allowed" : (providerCategory === "flight_provider" ? "draft-ready" : "not_started"),
        realPriceDisplayGate: restricted ? "not allowed" : (providerCategory === "flight_provider" ? "guarded-display-ready" : "not_started"),
        sandboxTestPriceDisplay: restricted ? "not allowed" : (providerCategory === "flight_provider" ? "guarded only" : "not_started"),
        manualProviderReviewWorkflow: restricted ? "not allowed" : (providerCategory === "flight_provider" ? "v1" : "not allowed"),
        manualReviewState: manualReview.manualReviewState || (restricted ? "blocked" : "not_started"),
        limitedRealPriceUiBeta: restricted ? "blocked" : (providerCategory === "flight_provider" ? "flight_only" : "not allowed"),
        limitedBetaKillSwitch: restricted ? "blocked" : (providerCategory === "flight_provider" ? "active" : "not allowed"),
        limitedBetaStatePersistence: restricted ? "blocked" : (providerCategory === "flight_provider" ? "active" : "not allowed"),
        userPreferenceGuard: restricted ? "blocked" : "active",
        persistedPreferenceLoaded: preferenceDecision.persistedPreferenceLoaded === true ? "true" : "false",
        persistedPreferenceValid: preferenceDecision.persistedPreferenceValid !== false ? "true" : "false",
        restoreConfirmationRequired: "true",
        betaPreferenceState: preferenceDraft && preferenceDraft.preference ? preferenceDraft.preference.killSwitchState : "enabled",
        rollbackGuard: "active",
        manualBookingHandoff: restricted ? "blocked" : (providerCategory === "flight_provider" ? "manual-only" : "not allowed"),
        betaRollbackState: restricted ? "rollback_active" : rollbackDecision.rollbackDecision,
        limitedBetaDisplayGate: restricted ? "blocked" : (providerCategory === "flight_provider" ? "draft-ready" : "not allowed"),
        limitedBetaPriceDisplay: restricted ? "blocked" : (providerCategory === "flight_provider" ? "guarded only" : "not allowed"),
        productionPriceDisplay: "disabled",
        bookingUrlDisplay: "disabled",
        bookingUrlSafety: restricted ? "not allowed" : "closed",
        credentialStorage: restricted ? "not allowed" : "secure storage implementation ready",
        credentialConsent: restricted ? "not allowed" : (providerCategory === "flight_provider" ? "draft-ready" : "missing"),
        flightAdapterV1: restricted ? "not allowed" : (providerCategory === "flight_provider" ? "offline fixture ready" : "not_started"),
        endpointAllowlistEnforcement: restricted ? "not allowed" : (providerCategory === "flight_provider" ? "draft-ready" : "not_started"),
        sandboxRealKeyDryRunGate: restricted ? "not allowed" : (providerCategory === "flight_provider" ? "draft-ready" : "not_started"),
        sandboxDryRunTransport: restricted ? "not allowed" : (providerCategory === "flight_provider" ? "simulated only" : "disabled"),
        realCredentialConnected: restricted ? "not allowed" : "no",
        manualReview: restricted ? "not allowed" : "missing",
        finalDecision: rowFinalDecision
      },
      credentialStorage: restricted ? {
        secureStorageImplementation: "not allowed",
        realCredentialConnected: "not allowed",
        credentialConsent: "not allowed",
        credentialPlaintextDisplay: "disabled",
        credentialExport: "disabled",
        finalDecision: "blocked"
      } : {
        secureStorageImplementation: "ready",
        realCredentialConnected: "no",
        credentialConsent: providerCategory === "flight_provider" ? "draft-ready" : "missing",
        readonlyAdapterContract: providerCategory === "flight_provider" ? "draft-ready" : "missing",
        flightAdapterV1: providerCategory === "flight_provider" ? "offline fixture ready" : "not_started",
        endpointAllowlistEnforcement: providerCategory === "flight_provider" ? "draft-ready" : "not_started",
        sandboxRealKeyDryRunGate: providerCategory === "flight_provider" ? "draft-ready" : "not_started",
        sandboxResponseSchemaGate: providerCategory === "flight_provider" ? "draft-ready" : "not_started",
        realProviderResultSchemaValidation: providerCategory === "flight_provider" ? "draft-ready" : "not_started",
        providerResultSourceLabelGate: providerCategory === "flight_provider" ? "draft-ready" : "not_started",
        priceIntegrityTaxesFeesGate: providerCategory === "flight_provider" ? "draft-ready" : "not_started",
        realPriceDisplayGate: providerCategory === "flight_provider" ? "guarded-display-ready" : "not_started",
        manualProviderReviewWorkflow: providerCategory === "flight_provider" ? "v1" : "not allowed",
        manualReviewState: manualReview.manualReviewState || "not_started",
        limitedRealPriceUiBeta: providerCategory === "flight_provider" ? "flight_only" : "not allowed",
        limitedBetaKillSwitch: providerCategory === "flight_provider" ? "active" : "not allowed",
        limitedBetaStatePersistence: providerCategory === "flight_provider" ? "active" : "not allowed",
        userPreferenceGuard: "active",
        persistedPreferenceLoaded: preferenceDecision.persistedPreferenceLoaded === true ? "true" : "false",
        persistedPreferenceValid: preferenceDecision.persistedPreferenceValid !== false ? "true" : "false",
        restoreConfirmationRequired: "true",
        betaPreferenceState: preferenceDraft && preferenceDraft.preference ? preferenceDraft.preference.killSwitchState : "enabled",
        rollbackGuard: "active",
        manualBookingHandoff: providerCategory === "flight_provider" ? "manual-only" : "not allowed",
        betaRollbackState: rollbackDecision.rollbackDecision,
        limitedBetaDisplayGate: providerCategory === "flight_provider" ? "draft-ready" : "not allowed",
        limitedBetaPriceDisplay: providerCategory === "flight_provider" ? "guarded only" : "not allowed",
        sandboxTestPriceDisplay: providerCategory === "flight_provider" ? "guarded only" : "not_started",
        productionPriceDisplay: "disabled",
        bookingUrlDisplay: "disabled",
        sandboxDryRunTransport: providerCategory === "flight_provider" ? "simulated only" : "disabled",
        credentialPlaintextDisplay: "disabled",
        credentialExport: "disabled",
        finalDecision: rowFinalDecision
      },
      decision,
      manualReview,
      limitedBetaDisplayGateDecision: betaDecision,
      limitedBetaKillSwitch: killVisibility,
      rollbackGuard: rollbackDecision,
      manualBookingHandoff: handoff,
      limitedBetaStatePersistence: preferenceDraft,
      userPreferenceGuard: preferenceDecision,
      finalDecision: rowFinalDecision,
      decisionReason: rowFinalDecision === "limited-beta-ready" ? "flight limited beta guarded display ready" : (decision.decisionReason || (restricted ? "restricted category blocked" : "readiness gates incomplete")),
      missingRequiredGates: decision.missingRequirements || [],
      realProvider: "disabled",
      realNetwork: "disabled",
      realApiKey: "disabled",
      realEndpoint: "disabled",
      realPrice: providerCategory === "flight_provider" ? "limited_beta_guarded_only" : "disabled",
      availability: "disabled",
      bookingUrl: "disabled",
      payment: "disabled",
      order: "disabled",
      identityUpload: "disabled",
      redacted: true
    });
  }

  function buildProviderConnectionReadinessConsole() {
    const providerCategories = Object.keys(CATEGORY_DEFINITIONS);
    const rows = providerCategories.map(buildProviderRow);
    const auditDraft = {
      eventType: "PROVIDER_CONNECTION_READINESS_CONSOLE_DRAFT",
      providerCategory: "all",
      decision: "readiness_console_only",
      missingRequirements: rows.reduce((all, row) => all.concat(row.currentGaps || []), []),
      forbiddenActions: ["real provider", "real network", "real API key", "real endpoint", "production price", "availability write", "bookingUrl", "payment", "order", "identity upload"],
      approvedProviderCount: 0,
      connectedProviderCount: 0,
      realProviderCallCount: 0,
      networkAttemptCount: 0,
      realApiKeyReadCount: 0,
      realEndpointConnectCount: 0,
      realPriceDisplayedCount: 0,
      realPriceReturnCount: 0,
      bookingUrlDisplayedCount: 0,
      bookingUrlReturnCount: 0,
      paymentAttemptCount: 0,
      orderAttemptCount: 0,
      identityUploadAttemptCount: 0,
      redacted: true
    };
    return clone({
      consoleVersion: PROVIDER_CONNECTION_READINESS_CONSOLE_VERSION,
      phase: "provider_connection_readiness_console",
      status: "readiness console only",
      mode: "offline planning only",
      realProvider: "disabled",
      realNetwork: "disabled",
      realApiKey: "disabled",
      realEndpoint: "disabled",
      realPrice: "limited_beta_guarded_only",
      availability: "disabled",
      bookingUrl: "disabled",
      payment: "disabled",
      order: "disabled",
      identityUpload: "disabled",
      providerCategories,
      categoryRows: rows,
      providerRows: rows,
      readinessMatrix: {
        columns: ["provider category", "provider type", "current status", "credential consent scope gate", "read-only adapter contract", "flight adapter v1", "endpoint allowlist enforcement", "sandbox real-key dry run gate", "sandbox response schema gate", "real provider result schema validation", "provider result source label gate", "price integrity / taxes / fees gate", "manual provider review workflow", "manual review state", "limited real price UI beta", "limited beta kill switch", "limited beta state persistence", "user preference guard", "persisted preference loaded", "persisted preference valid", "restore confirmation required", "beta preference state", "rollback guard", "manual booking handoff", "beta rollback state", "limited beta display gate", "limited beta price display", "production price display", "bookingUrl display", "sandbox dry run transport", "schema gate", "source label gate", "credential storage", "final decision"],
        rows: rows.map((row) => [
          row.providerCategory,
          row.providerType,
          row.currentStatus,
          row.readinessMatrix.credentialConsent,
          row.readinessMatrix.readonlyAdapter,
          row.readinessMatrix.flightAdapterV1,
          row.readinessMatrix.endpointAllowlistEnforcement || row.readinessMatrix.endpointAllowlist,
          row.readinessMatrix.sandboxRealKeyDryRunGate || row.readinessMatrix.sandboxGate,
          row.readinessMatrix.sandboxResponseSchemaGate,
          row.readinessMatrix.realProviderResultSchemaValidation,
          row.readinessMatrix.providerResultSourceLabelGate,
          row.readinessMatrix.priceIntegrityTaxesFeesGate || row.readinessMatrix.priceIntegrityGate,
          row.readinessMatrix.manualProviderReviewWorkflow,
          row.readinessMatrix.manualReviewState,
          row.readinessMatrix.limitedRealPriceUiBeta,
          row.readinessMatrix.limitedBetaKillSwitch,
          row.readinessMatrix.limitedBetaStatePersistence,
          row.readinessMatrix.userPreferenceGuard,
          row.readinessMatrix.persistedPreferenceLoaded,
          row.readinessMatrix.persistedPreferenceValid,
          row.readinessMatrix.restoreConfirmationRequired,
          row.readinessMatrix.betaPreferenceState,
          row.readinessMatrix.rollbackGuard,
          row.readinessMatrix.manualBookingHandoff,
          row.readinessMatrix.betaRollbackState,
          row.readinessMatrix.limitedBetaDisplayGate,
          row.readinessMatrix.limitedBetaPriceDisplay,
          row.readinessMatrix.productionPriceDisplay,
          row.readinessMatrix.bookingUrlDisplay,
          row.readinessMatrix.sandboxDryRunTransport,
          row.readinessMatrix.schemaGate,
          row.readinessMatrix.sourceLabelGate,
          row.readinessMatrix.credentialStorage,
          row.finalDecision
        ])
      },
      auditDraft,
      display: {
        title: "Provider 接入准备控制台",
        statusLine: "status: readiness console only",
        modeLine: "mode: offline planning only",
        realProviderLine: "real provider disabled",
        realNetworkLine: "real network disabled",
        realApiKeyLine: "real API key disabled",
        realEndpointLine: "real endpoint disabled",
        realPriceLine: "limited beta real price guarded only; production price disabled",
        availabilityLine: "availability disabled",
        bookingUrlLine: "bookingUrl disabled",
        paymentLine: "payment disabled",
        orderLine: "order disabled",
        identityUploadLine: "identity upload disabled",
        consentLine: "credential consent scope gate: draft-ready",
        adapterLine: "read-only adapter contract: draft-ready",
        flightAdapterLine: "flight adapter v1: offline fixture ready",
        redactedLine: "redacted: true"
      },
      redacted: true
    });
  }

  function assertProviderConnectionReadinessConsoleSafe(consoleState) {
    const safe = consoleState && typeof consoleState === "object" ? consoleState : {};
    const audit = safe.auditDraft || {};
    if (safe.status !== "readiness console only") throw new Error("provider readiness console must stay readiness only");
    if (safe.mode !== "offline planning only") throw new Error("provider readiness console must stay offline only");
    ["realProvider", "realNetwork", "realApiKey", "realEndpoint", "availability", "bookingUrl", "payment", "order", "identityUpload"].forEach((key) => {
      if (safe[key] !== "disabled") throw new Error("provider readiness console must keep " + key + " disabled");
    });
    if (safe.realPrice !== "limited_beta_guarded_only" && safe.realPrice !== "guarded_sandbox_test_only" && safe.realPrice !== "disabled") throw new Error("provider readiness console must only allow guarded limited beta display");
    const allowedFinalDecisions = ["no-go", "blocked", "limited-beta-ready", "limited-beta-disabled-by-user-preference", "limited-beta-disabled-by-kill-switch", "limited-beta-rollback-active"];
    const allowedFlightDecisions = ["limited-beta-ready", "limited-beta-disabled-by-user-preference", "limited-beta-disabled-by-kill-switch", "limited-beta-rollback-active"];
    list(safe.providerRows).forEach((row) => {
      if (allowedFinalDecisions.indexOf(row.finalDecision) < 0) throw new Error("provider readiness final decision must stay in the approved offline/limited-beta set");
      if (row.providerCategory === "restricted_provider" && row.finalDecision !== "blocked") throw new Error("restricted provider must stay blocked");
      if (row.providerCategory === "flight_provider" && allowedFlightDecisions.indexOf(row.finalDecision) < 0) throw new Error("flight provider must stay limited-beta-ready or explicitly disabled/rollback");
      if (row.providerCategory !== "restricted_provider" && row.providerCategory !== "flight_provider" && row.finalDecision !== "no-go") throw new Error("non-flight provider must stay no-go");
    });
    if (audit.realProviderCallCount !== 0 || audit.networkAttemptCount !== 0 || audit.realApiKeyReadCount !== 0 || audit.realEndpointConnectCount !== 0 || audit.realPriceDisplayedCount !== 0 || audit.realPriceReturnCount !== 0 || audit.bookingUrlDisplayedCount !== 0 || audit.bookingUrlReturnCount !== 0 || audit.paymentAttemptCount !== 0 || audit.orderAttemptCount !== 0 || audit.identityUploadAttemptCount !== 0) {
      throw new Error("provider readiness audit counters must stay zero");
    }
    if (audit.redacted !== true || safe.redacted !== true) throw new Error("provider readiness console must stay redacted");
    return true;
  }

  window.WeishanProviderConnectionReadinessConsole = {
    PROVIDER_CONNECTION_READINESS_CONSOLE_VERSION,
    CATEGORY_DEFINITIONS,
    buildProviderConnectionReadinessConsole,
    assertProviderConnectionReadinessConsoleSafe
  };
})();
