;(function () {
  "use strict";

  const PROVIDER_CONNECTION_READINESS_CONSOLE_VERSION = "2.1.26";

  const CATEGORY_DEFINITIONS = {
    flight_provider: {
      displayName: "机票 Provider",
      category: "flight",
      candidateDirections: ["用户自带 API", "weishan 候选只读价格源", "官方航空公司渠道", "合规 OTA 只读接口"],
      gaps: ["provider endpoint allowlist 未完成", "read-only adapter contract draft-ready", "sandbox gate 未完成", "result schema gate 未完成", "source label gate 未完成", "price integrity / taxes / fees gate 未完成", "bookingUrl domain safety gate 未完成", "manual provider review 未完成", "credential consent scope gate draft-ready", "no-secret persistence guard 必须持续 PASS", "no-network runtime guard 必须持续 PASS"]
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
        endpointAllowlist: false,
        sandboxGate: false,
        schemaGate: providerCategory !== "restricted_provider" ? false : true,
        sourceLabelGate: false,
        priceIntegrityGate: false
      },
      credentialState: {
        secureStorageImplementationReady: providerCategory !== "restricted_provider",
        realCredentialConnected: false,
        consentApproved: false,
        consentState: providerCategory === "flight_provider" ? "draft_ready" : "missing"
      },
      adapterState: { readonlyAdapterApproved: false, adapterContractState: providerCategory === "flight_provider" ? "draft_ready" : "missing", flightAdapterV1State: providerCategory === "flight_provider" ? "offline_fixture_ready" : "not_started" },
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
    return providerCategory === "restricted_provider" ? "blocked" : "no-go";
  }

  function buildProviderRow(providerCategory) {
    const definition = CATEGORY_DEFINITIONS[providerCategory];
    const decision = buildDecision(providerCategory);
    const restricted = providerCategory === "restricted_provider";
    return clone({
      providerCategory,
      providerLabel: definition.displayName,
      providerName: definition.displayName,
      providerType: definition.category,
      displayName: definition.displayName,
      currentStatus: providerStatus(providerCategory),
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
        endpointAllowlist: restricted ? "not allowed" : "missing",
        sandboxGate: restricted ? "not allowed" : "missing",
        schemaGate: restricted ? "not allowed" : "draft",
        sourceLabelGate: restricted ? "not allowed" : "draft",
        priceIntegrityGate: restricted ? "not allowed" : "draft",
        bookingUrlSafety: restricted ? "not allowed" : "closed",
        credentialStorage: restricted ? "not allowed" : "secure storage implementation ready",
        credentialConsent: restricted ? "not allowed" : (providerCategory === "flight_provider" ? "draft-ready" : "missing"),
        flightAdapterV1: restricted ? "not allowed" : (providerCategory === "flight_provider" ? "offline fixture ready" : "not_started"),
        realCredentialConnected: restricted ? "not allowed" : "no",
        manualReview: restricted ? "not allowed" : "missing",
        finalDecision: decision.finalDecision || finalDecision(providerCategory)
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
        credentialPlaintextDisplay: "disabled",
        credentialExport: "disabled",
        finalDecision: "no-go"
      },
      decision,
      finalDecision: decision.finalDecision || finalDecision(providerCategory),
      decisionReason: decision.decisionReason || (restricted ? "restricted category blocked" : "readiness gates incomplete"),
      missingRequiredGates: decision.missingRequirements || [],
      realProvider: "disabled",
      realNetwork: "disabled",
      realApiKey: "disabled",
      realEndpoint: "disabled",
      realPrice: "disabled",
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
      forbiddenActions: ["real provider", "real network", "real API key", "real endpoint", "real price", "availability", "bookingUrl", "payment", "order", "identity upload"],
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
      realPrice: "disabled",
      availability: "disabled",
      bookingUrl: "disabled",
      payment: "disabled",
      order: "disabled",
      identityUpload: "disabled",
      providerCategories,
      categoryRows: rows,
      providerRows: rows,
      readinessMatrix: {
        columns: ["provider category", "provider type", "current status", "credential consent scope gate", "read-only adapter contract", "flight adapter v1", "endpoint allowlist", "sandbox gate", "schema gate", "credential storage", "final decision"],
        rows: rows.map((row) => [
          row.providerCategory,
          row.providerType,
          row.currentStatus,
          row.readinessMatrix.credentialConsent,
          row.readinessMatrix.readonlyAdapter,
          row.readinessMatrix.flightAdapterV1,
          row.readinessMatrix.endpointAllowlist,
          row.readinessMatrix.sandboxGate,
          row.readinessMatrix.schemaGate,
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
        realPriceLine: "real price disabled",
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
    ["realProvider", "realNetwork", "realApiKey", "realEndpoint", "realPrice", "availability", "bookingUrl", "payment", "order", "identityUpload"].forEach((key) => {
      if (safe[key] !== "disabled") throw new Error("provider readiness console must keep " + key + " disabled");
    });
    list(safe.providerRows).forEach((row) => {
      if (row.finalDecision !== "no-go" && row.finalDecision !== "blocked") throw new Error("provider readiness final decision must stay no-go or blocked");
      if (row.providerCategory === "restricted_provider" && row.finalDecision !== "blocked") throw new Error("restricted provider must stay blocked");
      if (row.providerCategory !== "restricted_provider" && row.finalDecision !== "no-go") throw new Error("normal provider must stay no-go");
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
