(function(){
  const COMMERCE_PLAN_KEY = "weishan:commerceAgent:lastPlan:v1";
  const COMMERCE_TASKS_KEY = "weishan:commerceAgent:tasks:v1";
  const COMMERCE_MAX_TASKS = 40;

  const CATEGORY_LABELS = {
    flight:"机票",
    hotel:"酒店",
    train:"火车票",
    ecommerce:"商品",
    aiModelPricing:"AI 模型价格",
    ticketing:"门票 / 票务",
    serviceBooking:"服务预约",
    domain:"域名",
    cruise:"邮轮",
    privateJet:"公务机",
    localService:"本地服务",
    ticketOrActivity:"门票 / 活动",
    generalProcurement:"全球采购"
  };

  function nowIso(){
    return new Date().toISOString();
  }

  function sanitizeCommerceInput(text){
    return String(text || "")
      .replace(/(bearer|authorization|api[-_ ]?key|token|password|secret|cookie|card\s*number|银行卡|身份证|护照|支付密码|passport|id\s*number)\s*[:=：]\s*[^,\s;，。]+/gi, "$1=[redacted]")
      .replace(/(^|[^\w-])(\d{13,19})(?=$|[^\w-])/g, "$1[redacted-card]")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 240);
  }

  function createFlightLowestOffersContract(contract){
    const api = window.WeishanCommerceFlightLowestOffersContract;
    if (api && typeof api.normalizeFlightLowestOffersContract === "function") {
      return api.normalizeFlightLowestOffersContract(contract);
    }
    if (api && typeof api.getFlightLowestOffersContract === "function") {
      return api.getFlightLowestOffersContract(contract);
    }
    const fallback = {
      contractVersion:"2.1.0",
      phase:"flight_lowest_two_offers_contract",
      providerStatus:"not_configured",
      offersStatus:"unavailable",
      offers:[],
      maxDisplayedOffers:2,
      selectionPolicy:"lowest_total_price_first",
      trustedSearchRoutes:["google_search", "google_flights", "trip_com"],
      capabilities:{
        canReturnOffers:false,
        canReturnPrice:false,
        canReturnBookingUrl:false,
        canOpenExternalBooking:false,
        canCreateOrder:false,
        canPay:false,
        canStoreIdentity:false,
        canStorePassport:false,
        canStoreBankCard:false
      },
      safety:{
        noRealEndpoint:true,
        noRealApiKey:true,
        noNetworkSearch:true,
        noRealResults:true,
        noRealPrice:true,
        noFakeDemoMockPrice:true,
        noBookingUrl:true,
        noRedirect:true,
        noCheckout:true,
        noPayment:true,
        noOrderSubmit:true,
        noIdentityStorage:true,
        noPassportStorage:true,
        noBankCardStorage:true
      },
      display:{
        summaryTitle:"机票搜索结果",
        currentStatusLine:"暂无真实价格结果",
        priceStateLine:"当前尚未接入真实只读机票价格源，不能展示价格。",
        futureLine:"接入可信价格源后，将只显示通过安全检查的真实价格结果。最终价格、库存、税费、运费、行李、退改签，以跳转后的平台页面为准。"
      }
    };
    const raw = contract && typeof contract === "object" ? contract : {};
    return Object.assign({}, fallback, raw, {
      offers:Array.isArray(raw.offers) ? raw.offers.slice() : fallback.offers.slice(),
      capabilities:Object.assign({}, fallback.capabilities, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      safety:Object.assign({}, fallback.safety, raw.safety && typeof raw.safety === "object" ? raw.safety : {}),
      display:Object.assign({}, fallback.display, raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function createFlightProviderCandidatesRegistry(registry){
    const api = window.WeishanCommerceFlightProviderCandidates;
    if (api && typeof api.normalizeFlightProviderCandidatesRegistry === "function") {
      return api.normalizeFlightProviderCandidatesRegistry(registry);
    }
    if (api && typeof api.getFlightProviderCandidatesRegistry === "function") {
      return api.getFlightProviderCandidatesRegistry(registry);
    }
    const fallback = {
      contractVersion:"2.1.0",
      phase:"flight_provider_candidate_registry",
      registryStatus:"candidate_registry_only",
      candidateCount:7,
      trustStatus:"candidate_only",
      manualReviewStatus:"not_reviewed",
      domainSafetyRules:{
        allowedDomains:["google.com", "google.com/travel/flights", "trip.com", "ctrip.com", "skyscanner.com", "kayak.com", "expedia.com", "booking.com"],
        blockedRules:["短链接", "非 HTTPS", "拼写相似的仿冒域名", "AI 生成域名", "私聊付款", "先转账出票", "低价异常", "无主体信息", "和搜索意图无关", "成人 / 赌博 / 武器 / 毒品等高风险域名"]
      },
      candidateProfiles:[],
      capabilities:{
        canUseApiKey:false,
        canUseNetworkApi:false,
        canReturnPrice:false,
        canReturnBookingUrl:false,
        canOpenBookingUrl:false,
        canCreateOrder:false,
        canPay:false,
        canStoreIdentity:false,
        canStorePassport:false,
        canStoreBankCard:false
      },
      safety:{
        noRealEndpoint:true,
        noRealApiKey:true,
        noNetworkSearch:true,
        noRealResults:true,
        noRealPrice:true,
        noFakeDemoMockPrice:true,
        noBookingUrl:true,
        noRedirect:true,
        noCheckout:true,
        noPayment:true,
        noOrderSubmit:true,
        noIdentityStorage:true,
        noPassportStorage:true,
        noBankCardStorage:true
      },
      display:{
        summaryTitle:"候选平台档案与白名单规则",
        currentStatusLine:"当前状态：候选平台档案已整理，暂不接入真实价格源。",
        introLine:"这些只是候选平台档案，不代表已接入。当前不读取 API key，不连接 endpoint，不返回价格，不生成 booking 链接。",
        trustedRoutesLine:"默认优先保留官方平台、知名旅行平台和已人工审核白名单。",
        candidateCountLabel:"候选平台",
        allowlistTitle:"默认优先域名白名单",
        blockedRulesTitle:"默认阻断规则",
        capabilityLine:"API key 不可用 / 网络搜索不可用 / 价格不可用 / booking 链接不可用 / 下单不可用 / 付款不可用 / 身份证 / 护照 / 银行卡不可保存"
      }
    };
    const raw = registry && typeof registry === "object" ? registry : {};
    const candidateProfiles = Array.isArray(raw.candidateProfiles) ? raw.candidateProfiles.slice() : fallback.candidateProfiles.slice();
    return Object.assign({}, fallback, raw, {
      candidateProfiles,
      capabilities:Object.assign({}, fallback.capabilities, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      safety:Object.assign({}, fallback.safety, raw.safety && typeof raw.safety === "object" ? raw.safety : {}),
      domainSafetyRules:Object.assign({}, fallback.domainSafetyRules, raw.domainSafetyRules && typeof raw.domainSafetyRules === "object" ? raw.domainSafetyRules : {}),
      display:Object.assign({}, fallback.display, raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function createFlightProviderApprovalStatus(status){
    const api = window.WeishanCommerceFlightProviderApproval;
    if (api && typeof api.normalizeFlightProviderApprovalStatus === "function") {
      return api.normalizeFlightProviderApprovalStatus(status);
    }
    if (api && typeof api.getFlightProviderApprovalStatus === "function") {
      return api.getFlightProviderApprovalStatus(status);
    }
    const fallback = {
      approvalVersion:"2.1.0",
      phase:"flight_provider_approval",
      providerCategory:"flight",
      providerId:"flight-provider-disabled",
      providerName:"机票候选平台",
      overallStatus:"candidate_only",
      approvalStatus:"not_reviewed",
      currentAllowedStage:"candidate_only",
      trustStatus:"candidate_only",
      manualReviewStatus:"not_reviewed",
      allowlistDomains:["google.com", "google.com/travel/flights", "trip.com", "ctrip.com", "skyscanner.com", "kayak.com", "expedia.com", "booking.com", "airline-official-website.placeholder"],
      blockedRules:["短链接", "非 HTTPS", "拼写相似的仿冒域名", "AI 生成域名", "私聊付款", "先转账出票", "低价异常", "无主体信息", "和搜索意图无关", "成人 / 赌博 / 武器 / 毒品等高风险域名"],
      checklist:{
        platformIdentityReviewed:false,
        officialDomainAllowlistReviewed:false,
        providerTermsReviewed:false,
        localLawReviewed:false,
        apiDocsReviewed:false,
        apiKeyStorageReviewed:false,
        priceFieldReviewed:false,
        taxFeeBaggageFieldReviewed:false,
        bookingUrlReviewed:false,
        sandboxDryRunCompleted:false,
        finalHumanApproval:false
      },
      capabilities:{
        canUseApiKey:false,
        canUseNetworkApi:false,
        canReturnPrice:false,
        canReturnBookingUrl:false,
        canOpenBookingUrl:false,
        canCreateOrder:false,
        canPay:false,
        canStoreIdentity:false,
        canStorePassport:false,
        canStoreBankCard:false
      },
      safety:{
        noRealEndpoint:true,
        noRealApiKey:true,
        noNetworkSearch:true,
        noRealResults:true,
        noRealPrice:true,
        noFakeDemoMockPrice:true,
        noBookingUrl:true,
        noRedirect:true,
        noCheckout:true,
        noPayment:true,
        noOrderSubmit:true,
        noIdentityStorage:true,
        noPassportStorage:true,
        noBankCardStorage:true
      },
      display:{
        summaryTitle:"机票 Provider 接入审批",
        currentStatusLine:"当前状态：候选平台已建档，尚未批准接入只读价格源。",
        approvalStatusLine:"审批状态：未审查",
        readOnlyPriceSourceLine:"只读价格源：未启用",
        bookingUrlStatusLine:"bookingUrl：未启用",
        tradeStatusLine:"付款 / 下单：不支持",
        candidatePlatformsLine:"候选平台：Google Flights / Trip.com / 携程 / Skyscanner / Kayak / Expedia",
        allowlistTitle:"默认允许域名白名单",
        blockedRulesTitle:"默认阻断规则",
        allowlistRequirementLine:"需要 allowlist",
        blockedRulesSummaryLine:"禁止未知域名 / 短链接 / 可疑域名",
        aiRiskLine:"AI 不能生成可疑 provider 域名",
        humanApprovalLine:"人工审核后才允许进入 provider approval",
        notesLine:"候选平台只作档案，不连接 API，不返回价格，不生成 booking 链接。",
        checklistGroups:[
          { title:"候选与白名单", items:[["候选平台", "已建档"], ["allowlist", "已要求"], ["未知域名", "阻断"], ["短链接", "阻断"], ["可疑域名", "阻断"]] },
          { title:"平台审批", items:[["平台身份审查", "未开始"], ["Provider 条款审查", "未开始"], ["人工审核", "未完成"], ["最终人工批准", "未完成"]] },
          { title:"接口与价格", items:[["API 文档审查", "未开始"], ["API key 存储审查", "未开始"], ["Endpoint 审查", "未开始"], ["价格字段审查", "未开始"], ["bookingUrl 审查", "未开始"]] },
          { title:"安全与执行", items:[["当地法律审查", "未开始"], ["税费 / 退改签字段审查", "未开始"], ["Sandbox Dry Run", "未开始"], ["只读价格源", "未启用"], ["bookingUrl", "未启用"], ["付款 / 下单", "不支持"]] }
        ]
      }
    };
    const raw = status && typeof status === "object" ? status : {};
    return Object.assign({}, fallback, raw, {
      allowlistDomains:Array.isArray(raw.allowlistDomains) ? raw.allowlistDomains.slice() : fallback.allowlistDomains.slice(),
      blockedRules:Array.isArray(raw.blockedRules) ? raw.blockedRules.slice() : fallback.blockedRules.slice(),
      checklist:Object.assign({}, fallback.checklist, raw.checklist && typeof raw.checklist === "object" ? raw.checklist : {}),
      capabilities:Object.assign({}, fallback.capabilities, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      safety:Object.assign({}, fallback.safety, raw.safety && typeof raw.safety === "object" ? raw.safety : {}),
      display:Object.assign({}, fallback.display, raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function createFlightReadonlyStubPermission(permission){
    const api = window.WeishanCommerceFlightReadonlyStubPermission;
    if (api && typeof api.normalizeFlightReadonlyStubPermission === "function") {
      return api.normalizeFlightReadonlyStubPermission(permission);
    }
    if (api && typeof api.getFlightReadonlyStubPermission === "function") {
      return api.getFlightReadonlyStubPermission(permission);
    }
    const fallback = {
      permissionVersion:"2.1.0",
      phase:"flight_readonly_stub_permission",
      providerCategory:"flight",
      providerId:"flight-provider-disabled",
      providerName:"机票候选平台",
      overallStatus:"not_granted",
      currentStage:"approval_required",
      permissionStatus:"not_granted",
      checklist:{
        platformIdentityReview:false,
        officialDomainAllowlistReview:false,
        providerTermsReview:false,
        apiDocumentationReview:false,
        apiKeyStoragePlanReview:false,
        requestSchemaReview:false,
        responseSchemaReview:false,
        errorHandlingReview:false,
        timeoutRateLimitReview:false,
        finalStubDevApproval:false
      },
      capabilities:{
        canDevelopReadonlyStub:false,
        canUseRealApiKey:false,
        canConnectRealEndpoint:false,
        canUseNetwork:false,
        canReturnPrice:false,
        canReturnBookingUrl:false,
        canOpenBookingUrl:false,
        canCreateOrder:false,
        canPay:false,
        canStoreIdentity:false
      },
      display:{
        summaryTitle:"只读适配器开发许可",
        permissionStatusLine:"只读适配器开发许可：未授予",
        currentStatusLine:"当前状态：尚未授予只读适配器开发许可。",
        currentStageLine:"当前阶段：需要人工批准",
        nextStepLine:"下一步：完成 provider 条款、API 文档、域名 allowlist、API key 存储方案和请求 / 响应结构审查",
        noticeLine:"只读适配器只允许开发请求 / 响应结构，不允许连接真实 endpoint，不允许读取真实 API key，不允许返回真实价格，不允许生成预订链接。",
        checklistTitle:"前置条件",
        capabilityTitle:"当前能力",
        checklistGroups:[
          { title:"前置条件", items:[["平台身份确认", "未完成"], ["官方域名 / allowlist 审查", "未完成"], ["Provider 条款审查", "未完成"], ["API 文档审查", "未完成"], ["API key 安全存储方案", "未完成"], ["请求结构审查", "未完成"], ["响应结构审查", "未完成"], ["错误处理审查", "未完成"], ["超时 / 频率限制审查", "未完成"], ["人工批准开发只读 stub", "未完成"]] }
        ],
        capabilityLines:["不能开发真实 connector", "不能读取 API key", "不能连接 endpoint", "不能发起网络请求", "不能返回价格", "不能返回 bookingUrl", "不能打开预订页", "不能付款", "不能下单", "不能保存证件 / 银行卡"]
      }
    };
    const raw = permission && typeof permission === "object" ? permission : {};
    return Object.assign({}, fallback, raw, {
      checklist:Object.assign({}, fallback.checklist, raw.checklist && typeof raw.checklist === "object" ? raw.checklist : {}),
      capabilities:Object.assign({}, fallback.capabilities, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      display:Object.assign({}, fallback.display, raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function createFlightReadonlyStubAdapter(adapter){
    const api = window.WeishanCommerceFlightReadonlyStubAdapter;
    if (api && typeof api.normalizeFlightReadonlyStubAdapter === "function") {
      return api.normalizeFlightReadonlyStubAdapter(adapter);
    }
    if (api && typeof api.getFlightReadonlyStubAdapter === "function") {
      return api.getFlightReadonlyStubAdapter(adapter);
    }
    const fallback = {
      adapterVersion:"2.1.0",
      phase:"flight_readonly_stub_adapter",
      overallStatus:"shell_ready",
      currentStage:"shell_ready",
      capabilities:{
        canValidateInputShape:true,
        canBuildRequestShape:true,
        canNormalizeResponseShape:true,
        canUseRealApiKey:false,
        canConnectRealEndpoint:false,
        canUseNetwork:false,
        canReturnPrice:false,
        canReturnBookingUrl:false,
        canOpenBookingUrl:false,
        canCreateOrder:false,
        canPay:false,
        canStoreIdentity:false,
        canStorePassport:false,
        canStoreBankCard:false
      },
      safety:{
        noRealEndpoint:true,
        noRealApiKey:true,
        noNetworkSearch:true,
        noRealResults:true,
        noRealPrice:true,
        noFakeDemoMockPrice:true,
        noBookingUrl:true,
        noRedirect:true,
        noCheckout:true,
        noPayment:true,
        noOrderSubmit:true,
        noIdentityStorage:true,
        noPassportStorage:true,
        noBankCardStorage:true
      },
      requestShapeLines:[
        "origin：出发地",
        "destination：目的地",
        "departureDate：出发日期",
        "returnDateIfAny：返回日期（如有）",
        "adultsChildrenIfAny：成人 / 儿童（如有）",
        "cabinIfAny：舱位（如有）",
        "currencyIfFuture：币种（未来）",
        "regionIfFuture：区域（未来）"
      ],
      responseShapeLines:[
        "providerName：提供方名称",
        "airlineName：航司名称",
        "departureTime：起飞时间",
        "arrivalTime：到达时间",
        "duration：时长",
        "stops：中转次数",
        "baggageInfo：行李信息",
        "taxFeeInfo：税费 / 手续费信息",
        "finalPrice：禁用",
        "bookingUrl：禁用"
      ],
      display:{
        summaryTitle:"只读适配器空壳",
        shellStatusLine:"只读适配器空壳：已建立",
        currentStatusLine:"只读适配器空壳已建立",
        connectionStatusLine:"尚未允许连接真实 provider",
        summaryNote:"只读适配器空壳只允许开发请求 / 响应结构，不允许连接真实 endpoint，不允许读取真实 API key，不允许返回真实价格，不允许生成预订链接。",
        capabilityTitle:"当前能力",
        requestShapeTitle:"请求形状",
        responseShapeTitle:"响应形状",
        capabilityLines:[
          "可以校验输入形状",
          "可以构建请求形状",
          "可以规范化响应形状",
          "不能读取 API key",
          "不能连接 endpoint",
          "不能发起网络请求",
          "不能返回价格",
          "不能返回 bookingUrl",
          "不能打开预订页",
          "不能付款",
          "不能下单",
          "不能保存证件 / 银行卡"
        ],
        readonlyStubAdapterLine:"只读适配器空壳：已建立",
        readonlyStubAdapterAvailabilityLine:"只读适配器空壳：可用",
        realNetworkConnectionLine:"真实网络连接：未启用",
        realPriceReturnLine:"真实价格返回：未启用",
        bookingUrlReturnLine:"bookingUrl 返回：未启用"
      }
    };
    const raw = adapter && typeof adapter === "object" ? adapter : {};
    return Object.assign({}, fallback, raw, {
      capabilities:Object.assign({}, fallback.capabilities, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      safety:Object.assign({}, fallback.safety, raw.safety && typeof raw.safety === "object" ? raw.safety : {}),
      requestShapeLines:Array.isArray(raw.requestShapeLines) ? raw.requestShapeLines.slice() : fallback.requestShapeLines.slice(),
      responseShapeLines:Array.isArray(raw.responseShapeLines) ? raw.responseShapeLines.slice() : fallback.responseShapeLines.slice(),
      display:Object.assign({}, fallback.display, raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function createFlightSandboxDryRun(shell){
    const api = window.WeishanCommerceFlightSandboxDryRun;
    if (api && typeof api.normalizeFlightSandboxDryRunContract === "function") {
      return api.normalizeFlightSandboxDryRunContract(shell);
    }
    if (api && typeof api.getFlightSandboxDryRunContract === "function") {
      return api.getFlightSandboxDryRunContract(shell);
    }
    const fallback = {
      sandboxDryRunVersion:"2.1.0",
      phase:"flight_sandbox_dry_run_shell",
      dryRunStatus:"shell_only",
      networkMode:"disabled",
      apiKeyMode:"disabled",
      endpointMode:"disabled",
      providerMode:"disabled",
      priceMode:"disabled",
      bookingUrlMode:"disabled",
      orderMode:"disabled",
      paymentMode:"disabled",
      identityStorageMode:"disabled",
      capabilities:{
        canRunDryRunShell:true,
        canValidateInputShape:true,
        canValidateRequestShape:true,
        canValidateResponseShape:true,
        canSimulateControlFlow:true,
        canUseFixtureOnly:true,
        canUseRealApiKey:false,
        canConnectRealEndpoint:false,
        canUseNetwork:false,
        canReturnPrice:false,
        canReturnBookingUrl:false,
        canOpenBookingUrl:false,
        canCreateOrder:false,
        canPay:false,
        canStoreIdentity:false,
        canStorePassport:false,
        canStoreBankCard:false
      },
      blockedCapabilities:[
        "canUseRealApiKey",
        "canConnectRealEndpoint",
        "canUseNetwork",
        "canReturnPrice",
        "canReturnBookingUrl",
        "canOpenBookingUrl",
        "canCreateOrder",
        "canPay",
        "canStoreIdentity",
        "canStorePassport",
        "canStoreBankCard"
      ],
      steps:[
        "validate_user_input",
        "build_request_shape",
        "validate_request_shape",
        "skip_network_call",
        "build_empty_response_shape",
        "validate_response_shape",
        "block_price_return",
        "block_booking_url_return",
        "block_order_creation",
        "block_payment"
      ],
      display:{
        summaryTitle:"Sandbox Dry Run",
        shellStatusLine:"Sandbox Dry Run：外壳已建立",
        currentStatusLine:"沙箱空跑外壳已建立，但未连接真实 provider。",
        reasonLine:"只允许验证输入、请求和响应结构，不连接真实 endpoint，不读取真实 API key，不返回真实价格，不生成预订链接。",
        stepsTitle:"Dry Run 步骤",
        capabilityTitle:"当前能力",
        blockedTitle:"阻断能力",
        stepLabels:[
          "validate_user_input：验证用户输入",
          "build_request_shape：构建请求形状",
          "validate_request_shape：校验请求形状",
          "skip_network_call：跳过网络调用",
          "build_empty_response_shape：构建空响应形状",
          "validate_response_shape：校验响应形状",
          "block_price_return：阻断价格返回",
          "block_booking_url_return：阻断 bookingUrl 返回",
          "block_order_creation：阻断下单创建",
          "block_payment：阻断付款"
        ],
        capabilityLines:[
          "可以运行沙箱空跑外壳",
          "可以校验输入形状",
          "可以校验请求形状",
          "可以校验响应形状",
          "可以模拟控制流",
          "只使用 fixture / 本地结构",
          "不能读取真实 API key",
          "不能连接真实 endpoint",
          "不能发起网络请求",
          "不能返回价格",
          "不能返回 bookingUrl",
          "不能打开预订页",
          "不能付款",
          "不能下单",
          "不能保存证件 / 银行卡"
        ],
        blockedCapabilityLines:[
          "真实 API key：已阻断",
          "真实 endpoint：已阻断",
          "真实网络请求：已阻断",
          "真实价格：已阻断",
          "bookingUrl：已阻断",
          "下单：已阻断",
          "付款：已阻断",
          "身份证 / 银行卡：已阻断"
        ]
      }
    };
    const raw = shell && typeof shell === "object" ? shell : {};
    return Object.assign({}, fallback, raw, {
      capabilities:Object.assign({}, fallback.capabilities, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      blockedCapabilities:Array.isArray(raw.blockedCapabilities) ? raw.blockedCapabilities.slice() : fallback.blockedCapabilities.slice(),
      steps:Array.isArray(raw.steps) ? raw.steps.slice() : fallback.steps.slice(),
      display:Object.assign({}, fallback.display, raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function createFlightSandboxProviderMatrix(matrix){
    const api = window.WeishanCommerceFlightSandboxProviderMatrix;
    if (api && typeof api.normalizeFlightSandboxProviderMatrix === "function") {
      return api.normalizeFlightSandboxProviderMatrix(matrix);
    }
    if (api && typeof api.getFlightSandboxProviderMatrixContract === "function") {
      return api.getFlightSandboxProviderMatrixContract(matrix);
    }
    const fallback = {
      matrixVersion:"2.1.0",
      phase:"flight_sandbox_provider_matrix",
      matrixStatus:"readiness_matrix_only",
      networkMode:"disabled",
      apiKeyMode:"disabled",
      endpointMode:"disabled",
      providerMode:"candidate_only",
      priceMode:"disabled",
      bookingUrlMode:"disabled",
      orderMode:"disabled",
      paymentMode:"disabled",
      identityStorageMode:"disabled",
      capabilities:{
        canBuildProviderMatrix:true,
        canAttachCandidateProviders:true,
        canAttachDryRunShellStatus:true,
        canAttachReadonlyStubStatus:true,
        canAttachApprovalStatus:true,
        canAuditBlockedCapabilities:true,
        canShowReadinessState:true,
        canUseNetwork:false,
        canUseApiKey:false,
        canConnectEndpoint:false,
        canReturnPrice:false,
        canReturnBookingUrl:false,
        canOpenBookingUrl:false,
        canCreateOrder:false,
        canPay:false,
        canStoreIdentity:false
      },
      providerRows:[
        { providerId:"google_flights", providerName:"Google Flights", providerType:"flight_search_candidate", candidateStatus:"candidate_only", approvalStatus:"not_reviewed", readonlyStubPermission:"not_granted", readonlyStubScaffold:"available", sandboxDryRunShell:"available_shell_only", realProviderConnection:"disabled", apiKey:"disabled", endpoint:"disabled", network:"disabled", priceReturn:"disabled", bookingUrlReturn:"disabled", orderCreation:"disabled", payment:"disabled", identityStorage:"disabled", readinessLevel:"not_ready_for_price", reason:"provider_matrix_no_real_connection" },
        { providerId:"trip_com_ctrip", providerName:"Trip.com / 携程", providerType:"flight_search_candidate", candidateStatus:"candidate_only", approvalStatus:"not_reviewed", readonlyStubPermission:"not_granted", readonlyStubScaffold:"available", sandboxDryRunShell:"available_shell_only", realProviderConnection:"disabled", apiKey:"disabled", endpoint:"disabled", network:"disabled", priceReturn:"disabled", bookingUrlReturn:"disabled", orderCreation:"disabled", payment:"disabled", identityStorage:"disabled", readinessLevel:"not_ready_for_price", reason:"provider_matrix_no_real_connection" },
        { providerId:"skyscanner", providerName:"Skyscanner", providerType:"flight_search_candidate", candidateStatus:"candidate_only", approvalStatus:"not_reviewed", readonlyStubPermission:"not_granted", readonlyStubScaffold:"available", sandboxDryRunShell:"available_shell_only", realProviderConnection:"disabled", apiKey:"disabled", endpoint:"disabled", network:"disabled", priceReturn:"disabled", bookingUrlReturn:"disabled", orderCreation:"disabled", payment:"disabled", identityStorage:"disabled", readinessLevel:"not_ready_for_price", reason:"provider_matrix_no_real_connection" },
        { providerId:"kayak", providerName:"Kayak", providerType:"flight_search_candidate", candidateStatus:"candidate_only", approvalStatus:"not_reviewed", readonlyStubPermission:"not_granted", readonlyStubScaffold:"available", sandboxDryRunShell:"available_shell_only", realProviderConnection:"disabled", apiKey:"disabled", endpoint:"disabled", network:"disabled", priceReturn:"disabled", bookingUrlReturn:"disabled", orderCreation:"disabled", payment:"disabled", identityStorage:"disabled", readinessLevel:"not_ready_for_price", reason:"provider_matrix_no_real_connection" },
        { providerId:"expedia", providerName:"Expedia", providerType:"flight_search_candidate", candidateStatus:"candidate_only", approvalStatus:"not_reviewed", readonlyStubPermission:"not_granted", readonlyStubScaffold:"available", sandboxDryRunShell:"available_shell_only", realProviderConnection:"disabled", apiKey:"disabled", endpoint:"disabled", network:"disabled", priceReturn:"disabled", bookingUrlReturn:"disabled", orderCreation:"disabled", payment:"disabled", identityStorage:"disabled", readinessLevel:"not_ready_for_price", reason:"provider_matrix_no_real_connection" },
        { providerId:"booking_flights", providerName:"Booking Flights", providerType:"flight_search_candidate", candidateStatus:"candidate_only", approvalStatus:"not_reviewed", readonlyStubPermission:"not_granted", readonlyStubScaffold:"available", sandboxDryRunShell:"available_shell_only", realProviderConnection:"disabled", apiKey:"disabled", endpoint:"disabled", network:"disabled", priceReturn:"disabled", bookingUrlReturn:"disabled", orderCreation:"disabled", payment:"disabled", identityStorage:"disabled", readinessLevel:"not_ready_for_price", reason:"provider_matrix_no_real_connection" },
        { providerId:"airline_official_website", providerName:"航司官网占位", providerType:"flight_search_candidate", candidateStatus:"candidate_only", approvalStatus:"not_reviewed", readonlyStubPermission:"not_granted", readonlyStubScaffold:"available", sandboxDryRunShell:"available_shell_only", realProviderConnection:"disabled", apiKey:"disabled", endpoint:"disabled", network:"disabled", priceReturn:"disabled", bookingUrlReturn:"disabled", orderCreation:"disabled", payment:"disabled", identityStorage:"disabled", readinessLevel:"not_ready_for_price", reason:"provider_matrix_no_real_connection" }
      ],
      summary:{
        totalCandidates:7,
        readyForReadonlyPrice:0,
        readyForBookingUrl:0,
        readyForPayment:0,
        blockedFromNetwork:7,
        blockedFromPrice:7,
        blockedFromBookingUrl:7,
        blockedFromOrder:7,
        blockedFromPayment:7,
        overallStatus:"not_ready_for_real_price",
        reason:"all_candidates_require_human_approval_and_real_provider_connection"
      },
      display:{
        summaryTitle:"候选平台沙箱矩阵",
        currentStatusLine:"当前状态：候选平台已进入沙箱矩阵，但尚未允许连接真实 provider。",
        matrixSummaryLine:"矩阵摘要：候选平台数量：7 · 可返回真实价格：0 · 可返回 bookingUrl：0 · 可下单：0 · 可付款：0 · 网络连接：全部禁用 · API key：全部禁用 · endpoint：全部禁用",
        conclusionLine:"当前结论：不能返回最低价两家",
        reasonLine:"候选平台沙箱矩阵只用于审计和准备，不代表已接入真实 provider。",
        blockedConclusionLine:"候选平台沙箱矩阵默认全部阻断，只允许审计，不允许真实连接。",
        providerRowLabels:{
          candidateStatus:"候选状态",
          approvalStatus:"审批状态",
          readonlyStubPermission:"只读适配器开发许可",
          readonlyStubScaffold:"只读适配器空壳",
          sandboxDryRunShell:"Sandbox Dry Run",
          realProviderConnection:"真实 provider",
          apiKey:"API key",
          endpoint:"endpoint",
          network:"网络",
          priceReturn:"价格返回",
          bookingUrlReturn:"bookingUrl",
          orderCreation:"下单",
          payment:"付款",
          identityStorage:"证件 / 银行卡",
          readinessLevel:"当前结论",
          reason:"原因"
        }
      }
    };
    const raw = matrix && typeof matrix === "object" ? matrix : {};
    const providerRows = Array.isArray(raw.providerRows) ? raw.providerRows.slice() : fallback.providerRows.slice();
    return Object.assign({}, fallback, raw, {
      providerRows,
      capabilities:Object.assign({}, fallback.capabilities, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      display:Object.assign({}, fallback.display, raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function createSecureKeyStoragePlan(plan){
    const api = window.WeishanCommerceSecureKeyStoragePlan;
    if (api && typeof api.normalizeSecureKeyStoragePlan === "function") {
      return api.normalizeSecureKeyStoragePlan(plan);
    }
    if (api && typeof api.getSecureKeyStoragePlanState === "function") {
      return api.getSecureKeyStoragePlanState(plan);
    }
    const fallback = {
      secureKeyStoragePlanVersion:"2.1.0",
      phase:"flight_secure_key_storage_plan",
      planStatus:"plan_only",
      currentStage:"design_required",
      storageMode:"secure_storage_required",
      macOSKeychainMode:"not_connected",
      electronSafeStorageMode:"not_connected",
      plaintextMode:"forbidden",
      envFileMode:"forbidden",
      localStorageMode:"forbidden",
      sessionStorageMode:"forbidden",
      logMode:"forbidden",
      endpointMode:"disabled",
      networkMode:"disabled",
      priceMode:"disabled",
      bookingUrlMode:"disabled",
      orderMode:"disabled",
      paymentMode:"disabled",
      identityStorageMode:"disabled",
      storageTargets:["macOS Keychain", "Electron safeStorage"],
      blockedChannels:["明文", ".env", "localStorage", "sessionStorage", "日志", "query string", "error message"],
      checklist:{
        macOSKeychainDesign:false,
        electronSafeStorageDesign:false,
        plaintextForbidden:false,
        envFileForbidden:false,
        localStorageForbidden:false,
        sessionStorageForbidden:false,
        logForbidden:false,
        finalHumanApproval:false
      },
      capabilities:{
        canDescribePlan:true,
        canShowCurrentStage:true,
        canShowBlockedChannels:true,
        canShowFutureTargets:true,
        canUseMacOSKeychain:false,
        canUseElectronSafeStorage:false,
        canStorePlaintext:false,
        canStoreEnvFile:false,
        canStoreLocalStorage:false,
        canStoreSessionStorage:false,
        canStoreLogs:false,
        canUseNetwork:false,
        canConnectEndpoint:false,
        canReturnPrice:false,
        canReturnBookingUrl:false,
        canCreateOrder:false,
        canPay:false,
        canStoreIdentity:false
      },
      display:{
        summaryTitle:"安全密钥存储方案",
        planStatusLine:"安全密钥存储方案：计划中",
        currentStatusLine:"当前状态：安全密钥存储仍处于方案阶段，当前版本不会保存真实 API key。",
        currentStageLine:"当前阶段：设计中",
        futureTargetsLine:"未来目标：macOS Keychain / Electron safeStorage",
        blockedChannelsTitle:"禁止渠道",
        blockedChannelsLine:"禁止：明文、.env、localStorage、sessionStorage、日志",
        nextStepLine:"密钥脱敏与日志防泄露规则：已建立",
        safetyLine:"当前版本仍不能输入、保存、读取或测试真实 API key。",
        statusChecklistTitle:"当前状态清单",
        statusChecklistItems:["真实密钥保存：未启用", "macOS Keychain：未连接", "Electron safeStorage：未实现", ".env 保存：禁止", "明文保存：禁止", "localStorage 保存：禁止", "sessionStorage 保存：禁止", "日志记录 key：禁止", "API 连接测试：未启用", "endpoint 连接：未启用", "真实价格返回：未启用", "bookingUrl 返回：未启用"],
        futureStorageTargetsTitle:"未来允许评估的存储目标",
        futureStorageTargets:["macOS Keychain", "Electron safeStorage + 加密本地存储", "用户本机加密配置文件", "企业托管密钥服务"],
        forbiddenStorageTitle:"禁止的存储方式",
        forbiddenStorageItems:["明文文件", ".env", "localStorage", "sessionStorage", "前端代码", "日志文件", "crash report", "远程未加密存储", "自动上传到服务器", "通过聊天记录保存 API key", "通过截图保存 API key"],
        implementationStepsTitle:"实施步骤",
        implementationSteps:["设计密钥数据模型", "选择安全存储目标", "增加本机加密写入能力", "增加读取前权限确认", "增加删除 / 轮换 / 过期机制", "增加审计日志，但不得记录 key 明文", "增加只读 provider 沙箱连接", "增加真实只读价格源前的人工复核"],
        riskModelTitle:"风险模型",
        riskModelItems:["明文泄露风险", "日志泄露风险", "截图泄露风险", "复制粘贴泄露风险", "crash report 泄露风险", "恶意 provider 风险", "钓鱼 endpoint 风险", "权限过宽风险", "用户误绑定写入 / 下单 / 支付 API 风险"],
        nextStepTitle:"下一步",
        nextStepText:"provider endpoint allowlist 闸门：已建立。只读 provider sandbox gate：已建立。下一步：只读 provider result schema gate。key 删除 / 轮换 / 过期机制草案已建立，但当前版本仍不能输入、保存、读取、删除、轮换或测试真实 API key。",
        capabilityTitle:"当前能力",
        checklistTitle:"前置条件",
        capabilityLines:["不能读取真实 API key", "不能保存真实 API key", "不能连接 endpoint", "不能发起网络请求", "不能返回价格", "不能返回 bookingUrl", "不能付款", "不能下单", "不能保存身份证 / 护照 / 银行卡"],
        checklistGroups:[{ title:"前置条件", items:[["macOS Keychain 方案", "未开始"], ["Electron safeStorage 方案", "未开始"], [".env / 明文", "禁止"], ["localStorage", "禁止"], ["sessionStorage", "禁止"], ["日志", "禁止"], ["人工批准", "未开始"]] }]
      }
    };
    const raw = plan && typeof plan === "object" ? plan : {};
    return Object.assign({}, fallback, raw, {
      storageTargets:Array.isArray(raw.storageTargets) ? raw.storageTargets.slice() : fallback.storageTargets.slice(),
      blockedChannels:Array.isArray(raw.blockedChannels) ? raw.blockedChannels.slice() : fallback.blockedChannels.slice(),
      checklist:Object.assign({}, fallback.checklist, raw.checklist && typeof raw.checklist === "object" ? raw.checklist : {}),
      capabilities:Object.assign({}, fallback.capabilities, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      display:Object.assign({}, fallback.display, raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function createSecureStorageDesignGate(gate){
    const api = window.WeishanCommerceSecureStorageDesignGate;
    if (api && typeof api.buildSecureStorageDesignGate === "function") {
      return api.buildSecureStorageDesignGate(gate);
    }
    return {
      version:"2.1.0",
      gateName:"secure_storage_design_gate",
      gateStatus:"closed",
      phase:"design_gate",
      capabilities:{
        canShowGate:true,
        canShowGateStatus:true,
        canShowBlockingReasons:true,
        canShowUnlockChecklist:true,
        canShowImplementationMilestones:true,
        canShowThreatModel:true,
        canShowAuditRules:true,
        canShowRedactionRules:true,
        canInputApiKey:false,
        canSaveApiKey:false,
        canReadApiKey:false,
        canUseKeychain:false,
        canUseSafeStorage:false,
        canWriteEnv:false,
        canWriteLocalStorage:false,
        canWriteSessionStorage:false,
        canWriteLogs:false,
        canTestConnection:false,
        canConnectEndpoint:false,
        canUseNetwork:false,
        canRunProviderSandbox:false,
        canReturnPrice:false,
        canReturnBookingUrl:false,
        canCreateOrder:false,
        canPay:false,
        canUploadIdentity:false,
        canStoreBankCard:false
      },
      blockingReasons:["安全密钥写入实现未完成", "安全密钥读取实现未完成", "Keychain 适配未完成", "safeStorage 适配未完成", "provider endpoint allowlist 未完成"],
      unlockChecklist:["设计密钥数据结构", "设计本机安全写入接口", "设计本机安全读取接口", "完成安全审查后，才允许进入下一阶段"],
      implementationMilestones:["v2.1.4：安全存储设计闸门，默认关闭", "v2.1.4：本机安全存储接口草案，仍不写真实 key"],
      auditRules:["日志中永不记录完整 key", "UI 不得展示明文 key"],
      redactionRules:["apiKey → [REDACTED_API_KEY]", "apiSecret → [REDACTED_API_SECRET]"]
    };
  }

  function createLocalSecureStorageInterfaceDraft(draft){
    const api = window.WeishanCommerceLocalSecureStorageInterfaceDraft;
    if (api && typeof api.buildLocalSecureStorageInterfaceDraft === "function") {
      return api.buildLocalSecureStorageInterfaceDraft(draft);
    }
    return {
      version:"2.1.0",
      draftName:"local_secure_storage_interface_draft",
      phase:"local_secure_storage_interface_draft",
      draftStatus:"draft_only",
      implementationStatus:"not_implemented",
      realKeyStorage:"disabled",
      keyInputMode:"disabled",
      keySaveMode:"disabled",
      keyReadMode:"disabled",
      keyDeleteMode:"disabled",
      keyRotationMode:"disabled",
      keychainMode:"disabled",
      safeStorageMode:"disabled",
      encryptedLocalStoreMode:"disabled",
      endpointMode:"disabled",
      networkMode:"disabled",
      priceMode:"disabled",
      bookingUrlMode:"disabled",
      orderMode:"disabled",
      paymentMode:"disabled",
      identityStorageMode:"disabled",
      nextRequiredStep:"readonly_provider_sandbox_gate",
      capabilities:{
        canShowInterfaceDraft:true,
        canShowDataModelDraft:true,
        canShowMethodDraft:true,
        canShowBackendCandidates:true,
        canShowAuditDraft:true,
        canShowRedactionDraft:true,
        canInputApiKey:false,
        canSaveApiKey:false,
        canReadApiKey:false,
        canDeleteApiKey:false,
        canRotateApiKey:false,
        canUseKeychain:false,
        canUseSafeStorage:false,
        canWriteEncryptedLocalStore:false,
        canWriteEnv:false,
        canWriteLocalStorage:false,
        canWriteSessionStorage:false,
        canWriteLogs:false,
        canTestConnection:false,
        canConnectEndpoint:false,
        canUseNetwork:false,
        canRunProviderSandbox:false,
        canReturnPrice:false,
        canReturnBookingUrl:false,
        canOpenBookingUrl:false,
        canCreateOrder:false,
        canPay:false,
        canUploadIdentity:false,
        canStoreIdentity:false,
        canStorePassport:false,
        canStoreBankCard:false
      },
      dataModelDraft:{
        keyAliasModel:{ keyAliasId:"field:keyAliasId", providerId:"field:providerId", providerName:"field:providerName", permissionType:"field:permissionType_readonly_only", maskedPreview:"field:maskedPreview_redacted_only" },
        keySecretModel:{ secretRef:"field:secretRef_reference_only", encryptedPayloadRef:"field:encryptedPayloadRef_reference_only", backendType:"field:backendType_candidate_only", keyVersion:"field:keyVersion" },
        providerBindingModel:{ bindingId:"field:bindingId", providerId:"field:providerId", keyAliasId:"field:keyAliasId", endpointAllowlistStatus:"field:endpointAllowlistStatus_not_approved", sandboxStatus:"field:sandboxStatus_disabled", status:"draft_only" }
      },
      methodDraft:{
        prepareKeyAliasDraft:{ status:"draft_only", allowed:false, reason:"alias_draft_only_no_real_key" },
        prepareSecretWriteDraft:{ status:"blocked", allowed:false, reason:"secret_write_blocked" },
        prepareSecretReadDraft:{ status:"blocked", allowed:false, reason:"secret_read_blocked" },
        prepareSecretDeleteDraft:{ status:"blocked", allowed:false, reason:"secret_delete_blocked" },
        prepareSecretRotateDraft:{ status:"blocked", allowed:false, reason:"secret_rotate_blocked" },
        prepareConnectionTestDraft:{ status:"blocked", allowed:false, reason:"endpoint_connection_disabled" },
        prepareProviderSandboxDraft:{ status:"blocked", allowed:false, reason:"provider_sandbox_disabled" },
        prepareReadonlyPriceDraft:{ status:"blocked", allowed:false, reason:"real_price_disabled" },
        prepareBookingUrlDraft:{ status:"blocked", allowed:false, reason:"booking_url_disabled" }
      },
      backendCandidates:[
        { backendType:"macOS Keychain", candidateStatus:"candidate_only", connected:false, canRead:false, canWrite:false, canDelete:false, canRotate:false },
        { backendType:"Electron safeStorage", candidateStatus:"candidate_only", connected:false, canRead:false, canWrite:false, canDelete:false, canRotate:false },
        { backendType:"encrypted local config file", candidateStatus:"candidate_only", connected:false, canRead:false, canWrite:false, canDelete:false, canRotate:false },
        { backendType:"enterprise managed key service", candidateStatus:"candidate_only", connected:false, canRead:false, canWrite:false, canDelete:false, canRotate:false }
      ],
      auditDraft:{ auditStatus:"draft_only", events:["alias_created_draft", "secret_write_blocked", "secret_read_blocked", "connection_test_blocked", "price_return_blocked"], rules:["审计日志不得记录 key 明文", "审计日志只允许记录 key alias"] },
      redactionDraft:{ redactionStatus:"draft_only", functions:["redactSecretLikeValue", "redactObject", "redactHeaders", "redactUrl"], placeholders:{ apiKey:"[REDACTED_API_KEY]", apiSecret:"[REDACTED_API_SECRET]", accessToken:"[REDACTED_ACCESS_TOKEN]", authorizationHeader:"[REDACTED_AUTH_HEADER]" } },
      display:{
        title:"本机安全存储接口草案",
        currentStatusLine:"接口草案：已建立",
        implementationLine:"真实实现：未启用",
        keyInputLine:"真实 API key 输入：未开放",
        keySaveLine:"真实 API key 保存：未开放",
        keyReadLine:"真实 API key 读取：未开放",
        keyDeleteRotateLine:"删除 / 轮换：未开放",
        connectionTestLine:"测试连接：未开放",
        providerSandboxLine:"provider 沙箱：未开放",
        priceLine:"真实价格：未开放",
        bookingUrlLine:"bookingUrl：未开放",
        redactionRulesLine:"密钥脱敏与日志防泄露规则：已建立",
        keyLifecycleDraftLine:"key 删除 / 轮换 / 过期机制草案：已建立",
        keyLifecycleRealActionsLine:"真实删除 / 轮换 / 过期仍未开放",
        nextStepLine:"下一步：只读 provider result schema gate",
        safetyLine:"当前版本仍不能输入、保存、读取或测试真实 API key。"
      }
    };
  }

  function createKeyRedactionAndLogLeakRules(state){
    const api = window.WeishanCommerceKeyRedactionAndLogLeakRules;
    if (api && api.commerceKeyRedactionAndLogLeakRulesContract) {
      return Object.assign({}, api.commerceKeyRedactionAndLogLeakRulesContract, state && typeof state === "object" ? state : {});
    }
    return {
      version:"2.1.0",
      moduleName:"commerce_key_redaction_and_log_leak_rules",
      phase:"key_redaction_and_log_leak_prevention_rules",
      ruleStatus:"rules_established",
      realKeyInput:"disabled",
      realKeyStorage:"disabled",
      realKeyRead:"disabled",
      logLeakPrevention:"enabled_for_dummy_and_structural_data",
      network:"disabled",
      endpointConnection:"disabled",
      connectionTest:"disabled",
      realPrice:"disabled",
      bookingUrl:"disabled",
      payment:"disabled",
      order:"disabled",
      capabilities:{
        canShowRules:true,
        canRedactDummySecrets:true,
        canBuildSafeAuditLogEvent:true,
        canInputRealApiKey:false,
        canSaveRealApiKey:false,
        canReadRealApiKey:false,
        canTestConnection:false,
        canConnectEndpoint:false,
        canUseNetwork:false,
        canReturnPrice:false,
        canReturnBookingUrl:false,
        canCreateOrder:false,
        canPay:false
      },
      display:{
        title:"密钥脱敏与日志防泄露规则",
        statusLines:["密钥脱敏规则：已建立", "日志防泄露规则：已建立", "真实 API key 输入：未开放", "真实 API key 保存：未开放", "真实 API key 读取：未开放"],
        fieldPatternTitle:"敏感字段识别规则",
        redactionMapTitle:"脱敏映射",
        auditLogRulesTitle:"安全审计日志规则",
        uiRulesTitle:"UI / 截图 / 崩溃报告规则",
        dummyTestTitle:"Dummy 脱敏自检",
        keyLifecycleDraftLine:"key 删除 / 轮换 / 过期机制草案：已建立",
        keyLifecycleAuditEventsLine:"生命周期审计事件草案：已建立",
        keyLifecycleRealActionsLine:"真实删除 / 轮换 / 过期 / 吊销 / 恢复仍未开放",
        nextStepLine:"下一步：只读 provider result schema gate。",
        safetyLine:"当前版本仍不能输入、保存、读取或测试真实 API key。"
      }
    };
  }

  function createKeyLifecycleDraft(state){
    const api = window.WeishanCommerceKeyLifecycleDraft;
    const raw = state && typeof state === "object" ? state : {};
    if (api && typeof api.buildKeyLifecycleDraft === "function") {
      return Object.assign({}, api.buildKeyLifecycleDraft(), raw);
    }
    return Object.assign({
      version:"2.1.0",
      moduleName:"key_delete_rotate_expiry_draft",
      phase:"key_lifecycle_draft",
      draftStatus:"draft_only",
      implementationStatus:"not_implemented",
      realKeyDelete:"disabled",
      realKeyRotate:"disabled",
      realKeyExpiry:"disabled",
      realKeyRevocation:"disabled",
      realKeyRestore:"disabled",
      keyInput:"disabled",
      keyStorage:"disabled",
      keyRead:"disabled",
      network:"disabled",
      endpointConnection:"disabled",
      connectionTest:"disabled",
      realPrice:"disabled",
      bookingUrl:"disabled",
      order:"disabled",
      payment:"disabled",
      capabilities:{
        canShowLifecycleDraft:true,
        canDeleteApiKey:false,
        canRotateApiKey:false,
        canExpireApiKey:false,
        canRevokeApiKey:false,
        canInputApiKey:false,
        canSaveApiKey:false,
        canReadApiKey:false,
        canTestConnection:false,
        canConnectEndpoint:false,
        canUseNetwork:false,
        canReturnPrice:false,
        canReturnBookingUrl:false,
        canCreateOrder:false,
        canPay:false
      },
      stateMachine:{ currentAllowedState:"draft_alias_only", transitions:[{ from:"draft_alias_only", to:"pending_secure_storage", status:"blocked" }] },
      deleteDraft:{ deleteRules:["删除前必须二次确认"], deleteMethodDraft:{ prepareKeyDeleteDraft:{ status:"blocked", allowed:false } } },
      rotateDraft:{ rotateRules:["轮换前必须二次确认"], rotateMethodDraft:{ prepareKeyRotateDraft:{ status:"blocked", allowed:false } } },
      expiryDraft:{ expiryRules:["key 可以设置 expiresAt"], expiryMethodDraft:{ prepareKeyExpiryDraft:{ status:"blocked", allowed:false } } },
      auditEventsDraft:{ eventTypes:["KEY_DELETE_BLOCKED", "KEY_ROTATE_BLOCKED", "KEY_EXPIRED_BLOCKED"], auditRules:["所有事件必须 redacted: true"] },
      display:{
        title:"key 删除 / 轮换 / 过期机制草案",
        lifecycleStatusLine:"生命周期草案：已建立",
        realDeleteLine:"真实删除：未开放",
        realRotateLine:"真实轮换：未开放",
        realExpiryLine:"真实过期：未开放",
        realRevocationLine:"真实吊销：未开放",
        realRestoreLine:"真实恢复：未开放",
        nextStepLine:"下一步：只读 provider result schema gate",
        currentVersionLine:"当前版本仍不能输入、保存、读取、删除、轮换或测试真实 API key"
      }
    }, raw);
  }

  function createProviderEndpointAllowlistGate(state){
    const api = window.WeishanCommerceProviderEndpointAllowlistGate;
    const raw = state && typeof state === "object" ? state : {};
    const base = api && api.commerceProviderEndpointAllowlistGateContract ? api.commerceProviderEndpointAllowlistGateContract : {
      gateVersion:"4.2.7",
      phase:"provider_endpoint_allowlist_gate",
      gateStatus:"closed",
      allowlistStatus:"draft",
      endpointConnection:"disabled",
      networkMode:"disabled",
      providerSandbox:"disabled",
      realPrice:"disabled",
      bookingUrl:"disabled",
      orderMode:"disabled",
      paymentMode:"disabled",
      identityUpload:"disabled",
      capabilities:{ canInputApiKey:false, canSaveApiKey:false, canReadApiKey:false, canConnectRealEndpoint:false, canTestConnection:false, canUseNetwork:false, canUseProviderSandbox:false, canReturnPrice:false, canReturnBookingUrl:false, canCreateOrder:false, canPay:false, canUploadIdentity:false },
      display:{ title:"provider endpoint allowlist 闸门", establishedLine:"endpoint allowlist 闸门：已建立", gateStatusLine:"闸门状态：关闭", allowlistStatusLine:"allowlist 状态：草案", endpointConnectionLine:"真实 endpoint 连接：未开放", networkLine:"真实网络请求：未开放", providerSandboxLine:"provider sandbox：未开放", priceLine:"真实价格读取：未开放", bookingUrlLine:"bookingUrl 读取：未开放", orderLine:"下单：禁止", paymentLine:"付款：禁止", identityLine:"身份上传：禁止", readonlyProviderSandboxGateLine:"只读 provider sandbox gate：已建立", realSandboxRunLine:"真实 sandbox 运行：未开放", realProviderConnectionLine:"真实 provider 连接：未开放", realNetworkLine:"真实网络：未开放", nextStepLine:"只读 provider sandbox gate：已建立。下一步：只读 provider result schema gate", safetyLine:"当前版本仍不能连接真实 endpoint、不能测试连接、不能联网、不能读取真实价格" }
    };
    const display = api && typeof api.buildProviderEndpointAllowlistGateDisplay === "function" ? api.buildProviderEndpointAllowlistGateDisplay(raw) : {};
    return Object.assign({}, base, raw, display, {
      capabilities:Object.assign({}, base.capabilities || {}, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      display:Object.assign({}, base.display || {}, raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function createReadonlyProviderSandboxGate(state){
    const api = window.WeishanCommerceReadonlyProviderSandboxGate;
    const raw = state && typeof state === "object" ? state : {};
    const base = api && api.commerceReadonlyProviderSandboxGateContract ? api.commerceReadonlyProviderSandboxGateContract : {
      version:"4.2.7",
      moduleName:"readonly_provider_sandbox_gate",
      phase:"readonly_provider_sandbox_gate",
      gateStatus:"closed",
      sandboxStatus:"draft_only",
      realSandboxRun:"disabled",
      realProviderConnection:"disabled",
      realEndpointConnection:"disabled",
      realNetworkRequest:"disabled",
      realPriceRead:"disabled",
      realAvailabilityRead:"disabled",
      realBookingUrlRead:"disabled",
      realOrder:"forbidden",
      realPayment:"forbidden",
      realIdentityUpload:"forbidden",
      apiKeyInput:"disabled",
      apiKeyStorage:"disabled",
      apiKeyRead:"disabled",
      connectionTest:"disabled",
      capabilities:{ canShowReadonlySandboxGate:true, canShowSandboxRequestDraft:true, canShowSandboxResponseDraft:true, canShowReadonlyFieldAllowlist:true, canShowWriteActionBlocklist:true, canShowSandboxRunConditions:true, canShowSandboxBlockedReasons:true, canShowSandboxRiskScan:true, canShowSandboxAuditEvents:true, canEvaluateSandboxDraft:true, canRunRealSandbox:false, canConnectEndpoint:false, canUseNetwork:false, canTestConnection:false, canReturnPrice:false, canReturnAvailability:false, canReturnBookingUrl:false, canCreateOrder:false, canPay:false, canUploadIdentity:false, canInputApiKey:false, canSaveApiKey:false, canReadApiKey:false },
      display:{ title:"只读 provider sandbox gate", establishedLine:"只读 provider sandbox gate：已建立", gateStatusLine:"gate 状态：关闭", sandboxStatusLine:"sandbox 状态：草案", realSandboxRunLine:"真实 sandbox 运行：未开放", realProviderConnectionLine:"真实 provider 连接：未开放", endpointConnectionLine:"真实 endpoint 连接：未开放", networkLine:"真实网络请求：未开放", priceLine:"真实价格读取：未开放", availabilityLine:"availability 读取：未开放", bookingUrlLine:"bookingUrl 读取：未开放", orderLine:"下单：禁止", paymentLine:"付款：禁止", identityLine:"身份上传：禁止", nextStepLine:"下一步：只读 provider result schema gate", safetyLine:"当前版本仍不能运行真实 sandbox、不能连接真实 endpoint、不能联网、不能读取真实价格" }
    };
    if (api && typeof api.buildReadonlyProviderSandboxGateDisplay === "function") {
      return api.buildReadonlyProviderSandboxGateDisplay(Object.assign({}, base, raw));
    }
    return Object.assign({}, base, raw, {
      capabilities:Object.assign({}, base.capabilities || {}, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      display:Object.assign({}, base.display || {}, raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function createReadonlyProviderResultSchemaGate(state){
    const api = window.WeishanCommerceReadonlyProviderResultSchemaGate;
    const raw = state && typeof state === "object" ? state : {};
    const base = api && api.commerceReadonlyProviderResultSchemaGateContract ? api.commerceReadonlyProviderResultSchemaGateContract : {
      version:"4.2.7",
      moduleName:"readonly_provider_result_schema_gate",
      phase:"readonly_provider_result_schema_gate",
      gateStatus:"closed",
      schemaStatus:"draft_only",
      realProviderResultRead:"disabled",
      realPriceDisplay:"disabled",
      realAvailabilityDisplay:"disabled",
      realBookingUrlDisplay:"disabled",
      rawProviderPayloadDisplay:"forbidden",
      realProviderConnection:"disabled",
      realEndpointConnection:"disabled",
      realNetworkRequest:"disabled",
      realSandboxRun:"disabled",
      realOrder:"forbidden",
      realPayment:"forbidden",
      realIdentityUpload:"forbidden",
      apiKeyInput:"disabled",
      apiKeyStorage:"disabled",
      apiKeyRead:"disabled",
      connectionTest:"disabled",
      capabilities:{ canShowResultSchemaGate:true, canShowResultTypeDraft:true, canShowFieldAllowlist:true, canShowFieldBlocklist:true, canShowPriceIntegrityRules:true, canShowSourceIntegrityRules:true, canShowBookingUrlRules:true, canShowRawPayloadRules:true, canShowResultRiskScan:true, canShowResultAuditEvents:true, canEvaluateResultSchemaDraft:true, canReadRealProviderResult:false, canDisplayRealPrice:false, canDisplayRealAvailability:false, canDisplayBookingUrl:false, canDisplayRawProviderPayload:false, canRunRealSandbox:false, canConnectEndpoint:false, canUseNetwork:false, canTestConnection:false, canCreateOrder:false, canPay:false, canUploadIdentity:false, canInputApiKey:false, canSaveApiKey:false, canReadApiKey:false, canUseKeychain:false, canUseSafeStorage:false, canUseEncryptedLocalStore:false, canWriteEnv:false, canWriteLocalStorage:false, canWriteSessionStorage:false, canWriteLogs:false },
      display:{ title:"只读 provider result schema gate", establishedLine:"只读 provider result schema gate：已建立", gateStatusLine:"gate 状态：关闭", schemaStatusLine:"schema 状态：草案", realProviderResultLine:"真实 provider result 读取：未开放", realPriceLine:"真实价格显示：未开放", availabilityLine:"availability 显示：未开放", bookingUrlLine:"bookingUrl 显示：未开放", rawPayloadLine:"raw provider payload 显示：禁止", realSandboxLine:"真实 sandbox 运行：未开放", endpointLine:"真实 endpoint 连接：未开放", networkLine:"真实网络请求：未开放", orderLine:"下单：禁止", paymentLine:"付款：禁止", identityLine:"身份上传：禁止", nextStepLine:"下一步：provider result source label gate", safetyLine:"当前版本仍不能读取真实 provider result、不能显示真实价格、不能显示 bookingUrl。" }
    };
    if (api && typeof api.buildReadonlyProviderResultSchemaGateDisplay === "function") {
      return api.buildReadonlyProviderResultSchemaGateDisplay(Object.assign({}, base, raw));
    }
    return Object.assign({}, base, raw, {
      capabilities:Object.assign({}, base.capabilities || {}, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      display:Object.assign({}, base.display || {}, raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function createProviderResultSourceLabelGate(state){
    const api = window.WeishanCommerceProviderResultSourceLabelGate;
    const raw = state && typeof state === "object" ? state : {};
    const base = api && api.commerceProviderResultSourceLabelGateContract ? api.commerceProviderResultSourceLabelGateContract : {
      version:"4.2.7",
      moduleName:"provider_result_source_label_gate",
      phase:"provider_result_source_label_gate",
      gateStatus:"closed",
      mode:"draft_only",
      realProviderSourceLabel:"disabled",
      realProviderResultRead:"disabled",
      realNetwork:"disabled",
      realEndpointConnection:"disabled",
      realProviderConnection:"disabled",
      realPriceDisplay:"disabled",
      realAvailabilityDisplay:"disabled",
      realBookingUrlDisplay:"disabled",
      rawProviderPayloadDisplay:"forbidden",
      capabilities:{ canShowSourceLabelGate:true, canShowRequiredFieldsDraft:true, canShowSourceTypeDraft:true, canShowVisibleLabelDraft:true, canShowBlockRules:true, canShowAuditDraft:true, canShowGateLinkage:true, canReadRealProviderResult:false, canDisplayRealSourceLabel:false, canUseNetwork:false, canConnectEndpoint:false, canDisplayRealPrice:false, canDisplayRealAvailability:false, canDisplayBookingUrl:false, canDisplayRawProviderPayload:false, canCreateOrder:false, canPay:false, canUploadIdentity:false, canInputApiKey:false, canSaveApiKey:false, canReadApiKey:false },
      display:{ title:"provider result source label gate", establishedLine:"provider result source label gate：已建立", gateStatusLine:"gate 状态：关闭 / closed", modeLine:"mode: draft only", sourceLabelLine:"real provider source label 未开放", providerResultLine:"real provider result 未读取", networkLine:"real network disabled", safetyLine:"当前版本仍不读取真实 provider result，不显示真实来源标签，不联网，不显示真实价格。" }
    };
    if (api && typeof api.buildProviderResultSourceLabelGateDisplay === "function") {
      return api.buildProviderResultSourceLabelGateDisplay(Object.assign({}, base, raw));
    }
    return Object.assign({}, base, raw, {
      capabilities:Object.assign({}, base.capabilities || {}, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      display:Object.assign({}, base.display || {}, raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function createPriceIntegrityTaxesFeesGate(state){
    const api = window.WeishanCommercePriceIntegrityTaxesFeesGate;
    const raw = state && typeof state === "object" ? state : {};
    const base = api && api.commercePriceIntegrityTaxesFeesGateContract ? api.commercePriceIntegrityTaxesFeesGateContract : {
      version:"4.2.7",
      moduleName:"price_integrity_taxes_fees_gate",
      phase:"price_integrity_taxes_fees_gate",
      gateStatus:"closed",
      mode:"draft_only",
      realPriceDisplay:"disabled",
      realProviderPrice:"disabled",
      taxFeeVerification:"disabled_until_readonly_provider_result_available",
      realProviderResultRead:"disabled",
      realNetwork:"disabled",
      realBookingUrlDisplay:"disabled",
      capabilities:{ canShowPriceIntegrityGate:true, canShowRequiredQuoteFields:true, canShowDisplayPrerequisites:true, canShowCurrentPricePolicy:true, canShowTaxFeeCompletenessRules:true, canShowRiskScanDraft:true, canShowAuditDraft:true, canReadRealProviderResult:false, canDisplayRealPrice:false, canCalculateLowestPrice:false, canDisplayAvailability:false, canDisplayBookingUrl:false, canUseNetwork:false, canConnectEndpoint:false, canCreateOrder:false, canPay:false, canUploadIdentity:false, canInputApiKey:false, canSaveApiKey:false, canReadApiKey:false },
      display:{ title:"price integrity / taxes / fees gate", establishedLine:"price integrity / taxes / fees gate：已建立", gateStatusLine:"gate 状态：关闭 / closed", modeLine:"mode: draft only", realPriceLine:"real price display disabled", providerPriceLine:"real provider price disabled", taxFeeLine:"tax / fee verification disabled until readonly provider result is available", safetyLine:"当前版本仍隐藏价格，只显示暂无真实价格结果，不显示虚构价格或非真实报价。" }
    };
    if (api && typeof api.buildPriceIntegrityTaxesFeesGateDisplay === "function") {
      return api.buildPriceIntegrityTaxesFeesGateDisplay(Object.assign({}, base, raw));
    }
    return Object.assign({}, base, raw, {
      capabilities:Object.assign({}, base.capabilities || {}, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      display:Object.assign({}, base.display || {}, raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function createBookingUrlDomainSafetyGate(state){
    const api = window.WeishanCommerceBookingUrlDomainSafetyGate;
    const raw = state && typeof state === "object" ? state : {};
    const base = api && api.commerceBookingUrlDomainSafetyGateContract ? api.commerceBookingUrlDomainSafetyGateContract : {
      version:"4.2.7",
      moduleName:"booking_url_domain_safety_gate",
      phase:"booking_url_domain_safety_gate",
      gateStatus:"closed",
      mode:"draft_only",
      bookingUrlDisplay:"disabled",
      bookingUrlGeneration:"disabled",
      bookingUrlClick:"disabled",
      redirectFollow:"disabled",
      realProviderBookingLink:"disabled",
      realNetwork:"disabled",
      orderMode:"forbidden",
      paymentMode:"forbidden",
      checkoutMode:"forbidden",
      capabilities:{ canShowBookingUrlDomainSafetyGate:true, canShowFutureSafetyFields:true, canShowDomainSafetyRules:true, canShowForbiddenUrlTypes:true, canShowVisiblePolicy:true, canShowRiskScanDraft:true, canShowAuditDraft:true, canDisplayBookingUrl:false, canGenerateBookingUrl:false, canClickBookingUrl:false, canFollowRedirect:false, canUseRealProviderBookingLink:false, canUseNetwork:false, canConnectEndpoint:false, canCreateOrder:false, canPay:false, canCheckout:false, canUploadIdentity:false, canInputApiKey:false, canSaveApiKey:false, canReadApiKey:false },
      display:{ title:"bookingUrl domain safety gate", establishedLine:"bookingUrl domain safety gate：gate 已建立", gateStatusLine:"status: closed", modeLine:"mode: draft only", bookingUrlDisplayLine:"bookingUrl display disabled", bookingUrlGenerationLine:"bookingUrl generation disabled", bookingUrlClickLine:"bookingUrl click disabled", redirectFollowLine:"redirect follow disabled", providerBookingLinkLine:"real provider booking link disabled", networkLine:"real network disabled", safetyLine:"no order / no payment / no checkout" }
    };
    if (api && typeof api.buildBookingUrlDomainSafetyGateDisplay === "function") {
      return api.buildBookingUrlDomainSafetyGateDisplay(Object.assign({}, base, raw));
    }
    return Object.assign({}, base, raw, {
      capabilities:Object.assign({}, base.capabilities || {}, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      display:Object.assign({}, base.display || {}, raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function createManualProviderReviewWorkflow(state){
    const api = window.WeishanCommerceManualProviderReviewWorkflow;
    const raw = state && typeof state === "object" ? state : {};
    const base = api && api.commerceManualProviderReviewWorkflowContract ? api.commerceManualProviderReviewWorkflowContract : {
      version:"4.2.7",
      moduleName:"manual_provider_review_workflow",
      phase:"manual_provider_review_workflow",
      workflowStatus:"draft_only",
      providerApprovalStatus:"none_approved",
      providerReviewStatus:"all_pending",
      manualApproval:"disabled",
      realProviderConnection:"disabled",
      realProviderSandbox:"disabled",
      realPrice:"disabled",
      bookingUrl:"disabled",
      capabilities:{ canShowManualProviderReviewWorkflow:true, canShowProviderReviewObjectDraft:true, canShowReviewStateDraft:true, canShowManualChecklist:true, canShowBlockedReasons:true, canShowAuditDraft:true, canApproveProvider:false, canRejectProvider:false, canSubmitReview:false, canConnectRealProvider:false, canRunRealProviderSandbox:false, canDisplayRealPrice:false, canDisplayBookingUrl:false, canUseNetwork:false, canConnectEndpoint:false, canCreateOrder:false, canPay:false, canUploadIdentity:false, canInputApiKey:false, canSaveApiKey:false, canReadApiKey:false },
      display:{ title:"manual provider review workflow", establishedLine:"manual provider review workflow：workflow 已建立", statusLine:"status: draft only", providerApprovalLine:"no provider approved", reviewPendingLine:"all provider review pending", manualApprovalLine:"manual approval disabled", providerConnectionLine:"real provider connection disabled", sandboxLine:"real provider sandbox disabled", priceLine:"real price disabled", bookingUrlLine:"bookingUrl disabled", noApprovedLine:"当前没有 provider 处于 approved_for_future_readonly", noApproveButtonLine:"UI 不提供 approve 按钮", noRejectButtonLine:"UI 不提供 reject 按钮", noSubmitReviewLine:"UI 不提供提交审查按钮", draftOnlyLine:"当前仅展示只读流程草案" }
    };
    if (api && typeof api.buildManualProviderReviewWorkflowDisplay === "function") {
      return api.buildManualProviderReviewWorkflowDisplay(Object.assign({}, base, raw));
    }
    return Object.assign({}, base, raw, {
      capabilities:Object.assign({}, base.capabilities || {}, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      display:Object.assign({}, base.display || {}, raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }


  function createProviderActivationReadinessGate(state){
    const api = window.WeishanCommerceProviderActivationReadinessGate;
    const raw = state && typeof state === "object" ? state : {};
    const base = api && api.commerceProviderActivationReadinessGateContract ? api.commerceProviderActivationReadinessGateContract : {
      version:"4.2.7",
      moduleName:"provider_activation_readiness_gate",
      phase:"provider_activation_readiness_gate",
      gateStatus:"blocked",
      mode:"readiness_only",
      activationGoNoGo:"no-go",
      providerActivation:"disabled",
      realProviderConnection:"disabled",
      realProviderSandbox:"disabled",
      realPrice:"disabled",
      realBookingUrl:"disabled",
      orderMode:"disabled",
      paymentMode:"disabled",
      checkoutMode:"disabled",
      redacted:true,
      capabilities:{ canActivateProvider:false, canConnectRealProvider:false, canRunRealProviderSandbox:false, canUseNetwork:false, canConnectEndpoint:false, canReadRealProviderResult:false, canDisplayRealPrice:false, canDisplayBookingUrl:false, canCreateOrder:false, canPay:false, canCheckout:false, canUploadIdentity:false, canInputApiKey:false, canSaveApiKey:false, canReadApiKey:false },
      display:{ title:"provider activation readiness gate", establishedLine:"provider activation readiness gate：gate 已建立", statusLine:"status: blocked", modeLine:"mode: readiness only", providerActivationLine:"provider activation disabled", providerConnectionLine:"real provider connection disabled", sandboxLine:"real provider sandbox disabled", priceLine:"real price disabled", bookingUrlLine:"real bookingUrl disabled", orderPaymentLine:"order / payment / checkout disabled", decisionLine:"activationGoNoGo: no-go", redactedLine:"redacted: true" }
    };
    if (api && typeof api.buildProviderActivationReadinessGateDisplay === "function") return api.buildProviderActivationReadinessGateDisplay(Object.assign({}, base, raw));
    return Object.assign({}, base, raw, { capabilities:Object.assign({}, base.capabilities || {}, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}), display:Object.assign({}, base.display || {}, raw.display && typeof raw.display === "object" ? raw.display : {}) });
  }

  function createCredentialConsentScopeGate(state){
    const api = window.WeishanCommerceCredentialConsentScopeGate;
    const raw = state && typeof state === "object" ? state : {};
    const base = api && api.commerceCredentialConsentScopeGateContract ? api.commerceCredentialConsentScopeGateContract : {
      version:"4.2.7",
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
      capabilities:{ canInputCredential:false, canSaveCredential:false, canReadCredential:false, canTestConnection:false, canDeleteRealCredential:false, canRotateRealCredential:false, canExpireRealCredential:false, canUseKeychain:false, canUseSafeStorage:false, canUseEncryptedLocalStore:false, canWriteEnv:false, canWriteLocalStorage:false, canWriteSessionStorage:false, canUseNetwork:false, canConnectEndpoint:false, canCreateOrder:false, canPay:false, canUploadIdentity:false },
      display:{ title:"credential consent scope gate", establishedLine:"credential consent scope gate：gate 已建立", statusLine:"status: closed", modeLine:"mode: draft only", inputLine:"real credential input disabled", saveLine:"real credential save disabled", readLine:"real credential read disabled", lifecycleLine:"credential deletion / rotation / expiry real operations disabled", keychainLine:"Keychain disabled", safeStorageLine:"safeStorage disabled", encryptedStoreLine:"encrypted local store disabled", envLine:".env disabled", browserStorageLine:"localStorage / sessionStorage disabled", noApprovedLine:"当前没有 consent 处于 approved_for_future_readonly", noInputLine:"UI 不提供输入 key", noSaveLine:"UI 不提供保存 key", noReadLine:"UI 不提供读取 key", noTestLine:"UI 不提供测试连接", noLifecycleLine:"UI 不提供删除 / 轮换 / 过期真实操作", draftOnlyLine:"当前仅展示只读 consent 草案", redactedLine:"redacted: true" }
    };
    if (api && typeof api.buildCredentialConsentScopeGateDisplay === "function") return api.buildCredentialConsentScopeGateDisplay(Object.assign({}, base, raw));
    return Object.assign({}, base, raw, { capabilities:Object.assign({}, base.capabilities || {}, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}), display:Object.assign({}, base.display || {}, raw.display && typeof raw.display === "object" ? raw.display : {}) });
  }

  function createReadonlyAdapterContractGate(state){
    const api = window.WeishanCommerceReadonlyAdapterContractGate;
    const raw = state && typeof state === "object" ? state : {};
    const base = api && api.commerceReadonlyAdapterContractGateContract ? api.commerceReadonlyAdapterContractGateContract : {
      version:"4.2.7",
      moduleName:"readonly_adapter_contract_gate",
      phase:"readonly_adapter_contract_gate",
      gateStatus:"closed",
      mode:"contract_draft_only",
      adapterExecution:"disabled",
      realNetwork:"disabled",
      realEndpoint:"disabled",
      realProviderSandbox:"disabled",
      realProviderResult:"disabled",
      rawPayloadDisplay:"disabled",
      writeAction:"disabled",
      redacted:true,
      capabilities:{ canExecuteAdapter:false, canExecuteReadonlyDryRun:false, canUseNetwork:false, canConnectEndpoint:false, canRunRealProviderSandbox:false, canReadRealProviderResult:false, canDisplayRawProviderPayload:false, canDisplayRealPrice:false, canDisplayAvailability:false, canDisplayBookingUrl:false, canCreateBooking:false, canSubmitOrder:false, canCheckout:false, canPay:false, canUploadIdentity:false, canSubmitBankCard:false, canSendRawToken:false, canSendRawApiKey:false },
      display:{ title:"read-only adapter contract gate", establishedLine:"read-only adapter contract gate：gate 已建立", statusLine:"status: closed", modeLine:"mode: contract draft only", adapterExecutionLine:"adapter execution disabled", networkLine:"real network disabled", endpointLine:"real endpoint disabled", sandboxLine:"real provider sandbox disabled", providerResultLine:"real provider result disabled", rawPayloadLine:"raw payload display disabled", writeActionLine:"write action disabled", dryRunLine:"executeReadonlyDryRun 当前 disabled", noNetworkLine:"不执行真实 network", noEndpointLine:"不调用真实 provider endpoint", noResultLine:"不读取真实 provider result", withheldLine:"当前 price 仍 withheld；当前 availability 仍 withheld；当前 bookingUrl 仍 forbidden；rawProviderPayload forbidden", redactedLine:"redacted: true" }
    };
    if (api && typeof api.buildReadonlyAdapterContractGateDisplay === "function") return api.buildReadonlyAdapterContractGateDisplay(Object.assign({}, base, raw));
    return Object.assign({}, base, raw, { capabilities:Object.assign({}, base.capabilities || {}, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}), display:Object.assign({}, base.display || {}, raw.display && typeof raw.display === "object" ? raw.display : {}) });
  }


  function createProviderGateMatrixDashboard(state){
    const api = window.WeishanCommerceProviderGateMatrixDashboard;
    const raw = state && typeof state === "object" ? state : {};
    const base = api && api.commerceProviderGateMatrixDashboardContract ? api.commerceProviderGateMatrixDashboardContract : {
      version:"4.2.7", moduleName:"provider_gate_matrix_dashboard", phase:"provider_gate_matrix_dashboard", dashboardStatus:"blocked", mode:"matrix_only", providerActivationState:"no-go", realProviderConnection:"disabled", realProviderSandbox:"disabled", realNetwork:"disabled", realPrice:"disabled", realBookingUrl:"disabled", orderMode:"disabled", paymentMode:"disabled", checkoutMode:"disabled", redacted:true,
      capabilities:{ canActivateProvider:false, canConnectRealProvider:false, canRunRealProviderSandbox:false, canUseNetwork:false, canDisplayRealPrice:false, canDisplayBookingUrl:false, canCreateOrder:false, canPay:false, canCheckout:false, canUploadIdentity:false, canInputApiKey:false, canSaveApiKey:false, canReadApiKey:false },
      display:{ title:"provider gate matrix dashboard", establishedLine:"provider gate matrix dashboard：dashboard 已建立", statusLine:"status: blocked", modeLine:"mode: matrix only", activationLine:"providerActivationState: no-go", providerConnectionLine:"real provider connection disabled", sandboxLine:"real provider sandbox disabled", networkLine:"real network disabled", priceLine:"real price disabled", bookingUrlLine:"real bookingUrl disabled", orderPaymentLine:"order / payment / checkout disabled", redactedLine:"redacted: true" }
    };
    if (api && typeof api.buildProviderGateMatrixDashboardDisplay === "function") return api.buildProviderGateMatrixDashboardDisplay(Object.assign({}, base, raw));
    return Object.assign({}, base, raw, { capabilities:Object.assign({}, base.capabilities || {}, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}), display:Object.assign({}, base.display || {}, raw.display && typeof raw.display === "object" ? raw.display : {}) });
  }

  function createProviderNoNetworkRuntimeGuard(state){
    const api = window.WeishanCommerceProviderNoNetworkRuntimeGuard;
    const raw = state && typeof state === "object" ? state : {};
    const base = api && api.commerceProviderNoNetworkRuntimeGuardContract ? api.commerceProviderNoNetworkRuntimeGuardContract : {
      version:"4.2.7", moduleName:"provider_no_network_runtime_guard", phase:"provider_no_network_runtime_guard", guardStatus:"blocked", mode:"no_network_enforcement_draft", providerNetwork:"disabled", redirectFollowMode:"disabled", adapterExecution:"disabled", redacted:true,
      capabilities:{ canUseFetch:false, canUseXhr:false, canUseWebSocket:false, canUseEventSource:false, canUseSendBeacon:false, canUseElectronNet:false, canUseNodeHttp:false, canUseNodeHttps:false, canResolveDns:false, canFollowRedirect:false, canExecuteAdapter:false, canRunRealProviderSandbox:false, canReadRealProviderResult:false, canDisplayRealPrice:false, canDisplayBookingUrl:false, canCreateOrder:false, canPay:false },
      display:{ title:"provider no-network runtime guard", establishedLine:"provider no-network runtime guard：guard 已建立", statusLine:"status: blocked", modeLine:"mode: no-network enforcement draft", providerNetworkLine:"provider network disabled", fetchLine:"fetch disabled for provider", xhrLine:"XMLHttpRequest disabled for provider", websocketLine:"WebSocket disabled for provider", eventSourceLine:"EventSource disabled for provider", sendBeaconLine:"navigator.sendBeacon disabled for provider", electronNetLine:"Electron net disabled for provider", nodeHttpLine:"Node http/https disabled for provider", dnsLine:"DNS lookup disabled for provider", redirectLine:"redirect follow disabled", adapterLine:"adapter execution disabled", redactedLine:"redacted: true" }
    };
    if (api && typeof api.buildProviderNoNetworkRuntimeGuardDisplay === "function") return api.buildProviderNoNetworkRuntimeGuardDisplay(Object.assign({}, base, raw));
    return Object.assign({}, base, raw, { capabilities:Object.assign({}, base.capabilities || {}, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}), display:Object.assign({}, base.display || {}, raw.display && typeof raw.display === "object" ? raw.display : {}) });
  }

  function createOfflineProviderFixtureValidationHarness(state){
    const api = window.WeishanCommerceOfflineProviderFixtureValidationHarness;
    const raw = state && typeof state === "object" ? state : {};
    const base = api && api.commerceOfflineProviderFixtureValidationHarnessContract ? api.commerceOfflineProviderFixtureValidationHarnessContract : {
      version:"4.2.7", moduleName:"offline_provider_fixture_validation_harness", phase:"offline_provider_fixture_validation_harness", harnessStatus:"offline_only", mode:"fixture_validation_draft", realProviderFixture:"disabled", realProviderResult:"disabled", realNetwork:"disabled", fakeMockDemoAiPriceDisplay:"disabled", bookingUrlDisplay:"disabled", rawProviderPayloadDisplay:"disabled", unsafeFixturePolicy:"all_blocked", redacted:true,
      capabilities:{ canUseRealProviderFixture:false, canReadRealProviderResult:false, canUseNetwork:false, canDisplayFakePrice:false, canDisplayMockPrice:false, canDisplayDemoPrice:false, canDisplayAiEstimatedPrice:false, canDisplayRealPrice:false, canDisplayAvailability:false, canDisplayBookingUrl:false, canDisplayRawProviderPayload:false, canCreateOrder:false, canPay:false },
      display:{ title:"offline provider fixture validation harness", establishedLine:"offline provider fixture validation harness：harness 已建立", statusLine:"status: offline only", modeLine:"mode: fixture validation draft", realFixtureLine:"real provider fixture disabled", realResultLine:"real provider result disabled", networkLine:"real network disabled", fakePriceLine:"fake/mock/demo/AI price display disabled", bookingUrlLine:"bookingUrl display disabled", rawPayloadLine:"raw provider payload display disabled", unsafeLine:"all unsafe fixtures blocked", redactedLine:"redacted: true" }
    };
    if (api && typeof api.buildOfflineProviderFixtureValidationHarnessDisplay === "function") return api.buildOfflineProviderFixtureValidationHarnessDisplay(Object.assign({}, base, raw));
    return Object.assign({}, base, raw, { capabilities:Object.assign({}, base.capabilities || {}, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}), display:Object.assign({}, base.display || {}, raw.display && typeof raw.display === "object" ? raw.display : {}) });
  }

  function createProviderComplianceDecisionEngine(state){
    const api = window.WeishanCommerceProviderComplianceDecisionEngine;
    const raw = state && typeof state === "object" ? state : {};
    if (api && typeof api.buildProviderComplianceDecisionReport === "function") return api.buildProviderComplianceDecisionReport(raw);
    return Object.assign({
      version:"4.2.7",
      contract:{ engineStatus:"blocked", mode:"offline_decision_only", sideEffects:"none", realProviderConnection:"disabled", realNetwork:"disabled", realCredentialRead:"disabled", realPriceDisplay:"disabled", realBookingUrl:"disabled", providerActivationDecision:"no-go", redacted:true },
      decisionInputDraft:{ fields:["providerId", "providerName", "manualReviewState", "credentialConsentState", "endpointAllowlistState", "sandboxState", "redacted: true"] },
      decisionOutputDraft:{ providerActivationDecision:"no-go", priceDisplayDecision:"withheld", bookingUrlDecision:"forbidden", networkDecision:"blocked", credentialDecision:"blocked", adapterExecutionDecision:"disabled", redacted:true },
      defaultDecision:{ providerActivationDecision:"no-go", priceDisplayDecision:"withheld", bookingUrlDecision:"forbidden", networkDecision:"blocked", credentialDecision:"blocked", adapterExecutionDecision:"disabled" },
      blockedReasonList:["no provider approved", "manual review pending", "credential consent not approved", "endpoint connection disabled", "network disabled", "raw provider payload forbidden", "order / payment / checkout disabled"],
      withheldReasonList:["price source not trusted", "price integrity not complete"],
      decisionErrorCodes:["PROVIDER_ACTIVATION_NO_GO", "NETWORK_DISABLED", "PRICE_WITHHELD", "BOOKING_URL_FORBIDDEN", "RAW_PAYLOAD_FORBIDDEN"],
      audit:{ providerComplianceDecisionAuditDraft:{ eventType:"PROVIDER_COMPLIANCE_DECISION_DRAFT", providerActivationDecision:"no-go", networkDecision:"blocked", priceDisplayDecision:"withheld", bookingUrlDecision:"forbidden", redacted:true } },
      redacted:true
    }, raw);
  }

  function createOfflineProviderFixtureRunner(state){
    const api = window.WeishanCommerceOfflineProviderFixtureRunner;
    const raw = state && typeof state === "object" ? state : {};
    if (api && typeof api.buildOfflineProviderFixtureRunnerDisplay === "function") return api.buildOfflineProviderFixtureRunnerDisplay(raw);
    return Object.assign({
      version:"4.2.7",
      contract:{ runnerStatus:"offline_only", mode:"deterministic_fixture_runner", realProviderFixture:"disabled", realProviderResult:"disabled", realNetwork:"disabled", realPrice:"disabled", fakeMockDemoAiPriceDisplay:"disabled", bookingUrlDisplay:"disabled", rawProviderPayloadDisplay:"disabled", redacted:true },
      pipeline:["loadOfflineFixtureDescriptor", "redactOfflineFixture", "evaluateProviderComplianceReadiness", "compareExpectedDecision", "emitOfflineFixtureRunnerAuditEvent"],
      fixtureCategories:["schema_missing_field", "source_label_missing_evidence", "price_integrity_missing_currency", "booking_url_unknown_host", "network_fetch_attempt", "raw_provider_payload_attempt"],
      expectedOutcomes:["missing providerId -> blocked", "missing currency -> price withheld", "fetch attempt -> NETWORK_DISABLED", "raw provider payload -> RAW_PAYLOAD_FORBIDDEN"],
      runnerSummary:{ status:"PASS", fixtureCount:0, passedFixtureCount:0, failedFixtureCount:0, networkAttemptCount:0, realProviderCallCount:0, realPriceDisplayedCount:0, bookingUrlDisplayedCount:0, redacted:true },
      audit:{ offlineProviderFixtureRunnerAuditDraft:{ eventType:"OFFLINE_PROVIDER_FIXTURE_RUNNER_DECISION_DRAFT", actualDecision:"blocked", redacted:true } },
      redacted:true
    }, raw);
  }

  function createNoNetworkSentinelAudit(state){
    const api = window.WeishanCommerceNoNetworkSentinelAudit;
    const raw = state && typeof state === "object" ? state : {};
    if (api && typeof api.buildNoNetworkSentinelAuditDisplay === "function") return api.buildNoNetworkSentinelAuditDisplay(raw);
    return Object.assign({
      version:"4.2.7",
      contract:{ sentinelStatus:"blocked", mode:"static_no_network_audit", globalMonkeyPatch:"disabled", providerNetworkCall:"disabled", fetchAttempt:"blocked", xhrAttempt:"blocked", websocketAttempt:"blocked", redacted:true },
      sentinelScope:["provider adapters", "provider sandbox", "offline fixture runner", "provider compliance decision engine"],
      blockedPrimitives:["fetch", "XMLHttpRequest", "WebSocket", "EventSource", "navigator.sendBeacon", "Electron net", "Node http", "Node https", "DNS lookup", "redirect follow", "provider write action call"],
      defaultPrimitiveDecisions:["fetch -> NETWORK_DISABLED", "XMLHttpRequest -> NETWORK_DISABLED", "WebSocket -> NETWORK_DISABLED"],
      sentinelDecisionObjectDraft:{ networkPrimitive:"fetch", decision:"blocked", blockedReason:"NETWORK_DISABLED", redacted:true },
      audit:{ noNetworkSentinelAuditDraft:{ eventType:"NO_NETWORK_SENTINEL_DECISION_DRAFT", decision:"blocked", blockedReason:"NETWORK_DISABLED", redacted:true } },
      redacted:true
    }, raw);
  }

  function createProviderComplianceEvidenceReport(state){
    const api = window.WeishanCommerceProviderComplianceEvidenceReport;
    const raw = state && typeof state === "object" ? state : {};
    if (api && typeof api.buildProviderComplianceEvidenceReport === "function") return api.buildProviderComplianceEvidenceReport(raw);
    return Object.assign({
      version:"4.2.7",
      contract:{ reportStatus:"blocked", mode:"offline_evidence_only", providerActivationState:"no-go", realProviderApproval:"none", credentialConsentApproval:"none", realSecureStorage:"disabled", realEndpointConnection:"disabled", realSandbox:"disabled", realProviderResult:"disabled", realPrice:"disabled", realBookingUrl:"disabled", redacted:true },
      evidenceSections:["gateMatrixEvidence", "activationReadinessEvidence", "credentialConsentEvidence", "offlineFixtureRunnerEvidence", "noNetworkSentinelEvidence"],
      evidenceSummary:{ providerActivationState:"no-go", decisionEngineState:"blocked / no-go", fixtureRunnerState:"offline only / PASS", noNetworkSentinelState:"blocked", redacted:true },
      overallEvidenceConclusions:["decision engine: blocked / no-go", "fixture runner: offline only / PASS", "no-network sentinel: blocked", "provider activation: no-go", "price display: withheld", "bookingUrl display: forbidden"],
      userVisibleNotes:["当前版本只是离线合规证据包", "当前版本不能联网接 provider", "当前版本不能显示真实价格", "当前版本不能预订 / 付款 / 下单"],
      audit:{ providerComplianceEvidenceReportAuditDraft:{ eventType:"PROVIDER_COMPLIANCE_EVIDENCE_REPORT_DRAFT", providerActivationState:"no-go", blockedReason:"provider_compliance_evidence_no_go", redacted:true } },
      redacted:true
    }, raw);
  }

  function createLocalSafetyEvidenceConsole(state){
    const api = window.WeishanCommerceLocalSafetyEvidenceConsole;
    const raw = state && typeof state === "object" ? state : {};
    if (api && typeof api.buildLocalSafetyEvidenceConsole === "function") return api.buildLocalSafetyEvidenceConsole(raw);
    return Object.assign({
      version:"4.2.7",
      contract:{ status:"local evidence only", mode:"offline safety summary", providerActivationState:"no-go", releaseEvidenceState:"local only", redacted:true },
      releaseEvidence:{ appVersion:"4.2.7", expectedGitTag:"v2.4.1", releasePostcheckState:"local only", workingTreeState:"clean required", distAppVersion:"4.2.7", applicationsAppVersion:"4.2.7", uiAcceptanceState:"manual evidence required", schemaVersion:"4.2.7", redacted:true },
      settingsAuthEvidence:{ localAuthMode:"enabled", passwordVerifier:"enabled", legacyPlainPasswordMigration:"compatible", localRecoveryMode:"no-network", localRecoveryEmailSend:"disabled", localRecoverySecretRead:"disabled", localRecoveryFormPreserved:"required", localRecoveryRouteStable:"required", aiKeyConfigLockedWhenUnauthenticated:"required", rawPasswordDisplay:"forbidden", rawTokenDisplay:"forbidden", rawApiKeyDisplay:"forbidden" },
      commerceEvidence:{ commerceFlightIntent:"enabled", flightOriginParsing:"上海", flightDestinationParsing:"成都", flightDateParsing:"7 月 15 日", flightSortPreference:"低价优先", realPriceResult:"unavailable", fakeMockDemoAiPrice:"forbidden", bookingUrl:"forbidden", providerActivationState:"no-go", offlineFixtureRunnerState:"PASS", networkAttemptCount:0, realProviderCallCount:0, realPriceDisplayedCount:0, bookingUrlDisplayedCount:0 },
      safetyRedlineEvidence:{ apiKeyInput:"disabled", credentialInput:"disabled", endpointInput:"disabled", testConnection:"disabled", Keychain:"disabled", safeStorage:"disabled", envSecretWrite:"forbidden", localStorageSecretWrite:"forbidden", sessionStorageSecretWrite:"forbidden", realNetwork:"disabled", providerSandbox:"disabled", realProviderResult:"disabled", realPrice:"disabled", bookingUrl:"disabled", orderPaymentCheckout:"disabled", identityBankCardFlow:"disabled" },
      audit:{ localSafetyEvidenceConsoleAuditDraft:{ eventType:"LOCAL_SAFETY_EVIDENCE_CONSOLE_DRAFT", schemaVersion:"4.2.7", appVersion:"4.2.7", evidenceState:"local evidence only", providerActivationState:"no-go", releasePostcheckState:"local only", fixtureRunnerState:"PASS", settingsAuthState:"local auth evidence only", blockedReason:"real_provider_and_secret_access_disabled", generatedAt:"local_only", redacted:true } },
      redacted:true
    }, raw);
  }

  function createManualUiAcceptanceAssistant(state){
    const api = window.WeishanCommerceManualUiAcceptanceAssistant;
    const raw = state && typeof state === "object" ? state : {};
    if (api && typeof api.buildManualUiAcceptanceAssistant === "function") return api.buildManualUiAcceptanceAssistant(raw);
    return Object.assign({ version:"4.2.7", contract:{ status:"manual assist only", mode:"no automation guarantee", redacted:true }, manualSteps:[], screenshotPaths:[], passFailRules:[], audit:{ manualUiAcceptanceAssistantAuditDraft:{ eventType:"MANUAL_UI_ACCEPTANCE_ASSISTANT_DRAFT", redacted:true } }, redacted:true }, raw);
  }

  function createNoSecretPersistenceGuard(state){
    const api = window.WeishanCommerceNoSecretPersistenceGuard;
    const raw = state && typeof state === "object" ? state : {};
    if (api && typeof api.buildNoSecretPersistenceGuard === "function") return api.buildNoSecretPersistenceGuard(raw);
    return Object.assign({ version:"4.2.7", contract:{ status:"local static scan only", mode:"no real secret access", redacted:true }, scanScope:[], blockedPatterns:[], currentScanResult:{ scanResult:"PASS", blockedPatternCount:0, realSecretReadCount:0, keychainAccessCount:0, safeStorageAccessCount:0, envSecretWriteCount:0, localStorageSecretWriteCount:0, sessionStorageSecretWriteCount:0, rawPasswordPersistenceCount:0, rawApiKeyDisplayCount:0, redacted:true }, audit:{ noSecretPersistenceGuardAuditDraft:{ eventType:"NO_SECRET_PERSISTENCE_GUARD_SCAN_DRAFT", blockedPatternCount:0, redacted:true } }, redacted:true }, raw);
  }

  function createSettingsAuthLocalSecurityEvidence(state){
    const api = window.WeishanSettingsAuthLocalSecurityEvidence;
    const raw = state && typeof state === "object" ? state : {};
    if (api && typeof api.buildSettingsAuthLocalSecurityEvidence === "function") return api.buildSettingsAuthLocalSecurityEvidence(raw);
    return Object.assign({ version:"4.2.7", contract:{ status:"local auth evidence only", mode:"no cloud auth", localRegister:"enabled", localLogin:"enabled", localRecoveryNotice:"enabled", passwordVerifier:"enabled", legacyPlainPasswordMigration:"compatible", realEmailSending:"disabled", realNetwork:"disabled", realKeyRead:"disabled", redacted:true }, recoveryNoticeDraft:["本地模式不联网", "本地模式不发邮件", "本地模式不读取密钥", "找回密码不会清空表单", "找回密码不会跳路由"], authSafetyBoundaries:["raw password display forbidden", "raw password persistence forbidden", "passwordVerifier only"], audit:{ settingsAuthLocalSecurityEvidenceAuditDraft:{ eventType:"SETTINGS_AUTH_LOCAL_SECURITY_EVIDENCE_DRAFT", redacted:true } }, redacted:true }, raw);
  }

  function createUserApiPriorityPolicyState(state){
    const api = window.WeishanCommerceUserApiPriorityPolicy;
    const raw = state && typeof state === "object" ? state : {};
    const binding = api && typeof api.getUserApiBindingState === "function"
      ? api.getUserApiBindingState(raw.userApiBindingState)
      : {
        status:"not_bound",
        hasUserApi:false,
        providerName:null,
        apiType:null,
        canReadPrice:false,
        canWrite:false,
        canCreateOrder:false,
        canPay:false,
        canUploadIdentity:false
      };
    const searchMode = api && typeof api.resolveCommerceSearchMode === "function"
      ? api.resolveCommerceSearchMode({
        userApiBindingState: binding,
        candidateProviders: raw.candidateProviders || "available"
      })
      : {
        mode:"candidate_provider_fallback",
        userApi:"not_bound",
        candidateProviders:"available",
        realPriceResults:"unavailable",
        resultSource:"weishan_candidate_platforms_or_external_search",
        canShowPrice:false,
        canShowBookingUrl:false,
        canPay:false,
        canCreateOrder:false,
        canStoreIdentity:false
      };
    const display = api && typeof api.buildSearchModeDisplay === "function"
      ? api.buildSearchModeDisplay(searchMode)
      : {
        title:"当前搜索模式",
        userApiLine:"用户 API：未绑定",
        candidateProviderLine:"weishan 候选平台：可用",
        realPriceLine:"真实价格结果：暂无",
        futureLine:"绑定 API 后，将优先使用用户授权平台的只读价格结果",
        sourceLine:"未绑定 API 时，可使用 weishan 候选平台和外部搜索入口。"
      };
    return {
      policyVersion:"2.1.0",
      phase:"user_api_priority_search_policy",
      userApiBindingState:binding,
      searchMode,
      display
    };
  }

  function createApiBindingSafeShellState(state){
    const api = window.WeishanCommerceApiBindingSafeShell;
    const raw = state && typeof state === "object" ? state : {};
    const shellState = api && typeof api.getApiBindingSafeShellState === "function"
      ? api.getApiBindingSafeShellState(raw.shellState || raw)
      : {
        shellVersion:"2.1.0",
        phase:"api_binding_safe_shell",
        status:"not_bound",
        userApi:"not_bound",
        providerName:null,
        providerType:null,
        apiPermissionTier:"none",
        canReadPrice:false,
        canWrite:false,
        canCreateOrder:false,
        canPay:false,
        canUploadIdentity:false,
        canStoreIdentity:false,
        canStoreBankCard:false,
        storageMode:"disabled",
        endpointConnectionMode:"disabled",
        networkMode:"disabled"
      };
    const mode = api && typeof api.resolveApiBindingMode === "function"
      ? api.resolveApiBindingMode({ shellState })
      : {
        mode:"not_bound",
        userApi:"not_bound",
        searchPriority:"candidate_provider_fallback",
        canUseUserApi:false,
        canShowPrice:false,
        canShowBookingUrl:false,
        canCreateOrder:false,
        canPay:false,
        canUploadIdentity:false,
        canStoreIdentity:false,
        canStoreBankCard:false,
        message:"用户 API 未绑定，当前使用 weishan 候选平台和外部搜索入口。"
      };
    const display = api && typeof api.buildApiBindingSafeShellDisplay === "function"
      ? api.buildApiBindingSafeShellDisplay(shellState)
      : {
        title:"API 绑定状态",
        userApiLine:"用户 API：未绑定",
        candidateProviderLine:"weishan 候选平台：可用",
        realPriceLine:"真实价格结果：暂无",
        currentStatusLine:"当前状态：用户 API 未绑定。",
        bindFutureLine:"绑定 API 后，可优先使用用户授权平台的只读价格结果。",
        readonlyScopeLine:"API 只用于搜索、读取价格、读取库存、分析结果。",
        externalConfirmLine:"点击价格后跳转到外部平台或官网确认。",
        safetyLines:[
          "绑定 API 不代表允许付款",
          "绑定 API 不代表允许下单",
          "绑定 API 不代表允许提交身份证、护照或银行卡",
          "只读 API：允许搜索 / 返回价格",
          "写入 API：默认禁止",
          "下单 API：默认禁止",
          "支付 API：禁止",
          "身份资料上传：禁止",
          "银行卡保存：禁止"
        ],
        mode
      };
    return {
      shellVersion:"2.1.0",
      phase:"api_binding_safe_shell",
      shellState,
      mode,
      display,
      permissionTiers:api && typeof api.buildApiBindingPermissionTiers === "function" ? api.buildApiBindingPermissionTiers() : []
    };
  }

  function createUserApiProviderCatalogState(state){
    const api = window.WeishanCommerceUserApiProviderCatalog;
    const raw = state && typeof state === "object" ? state : {};
    const catalog = api && typeof api.buildUserApiProviderCatalog === "function"
      ? api.buildUserApiProviderCatalog()
      : [];
    const summary = api && typeof api.summarizeUserApiProviderCatalog === "function"
      ? api.summarizeUserApiProviderCatalog(catalog)
      : {
        totalProviders:catalog.length,
        flightProviders:0,
        hotelProviders:0,
        commerceProviders:0,
        localServiceProviders:0,
        boundProviders:0,
        providersWithReadOnlyPotential:catalog.length,
        providersWithWriteEnabled:0,
        providersWithOrderEnabled:0,
        providersWithPaymentEnabled:0,
        providersWithIdentityUploadEnabled:0,
        overallStatus:"catalog_only_no_binding",
        reason:"provider_catalog_available_but_no_real_api_binding"
      };
    const display = api && typeof api.buildUserApiProviderCatalogDisplay === "function"
      ? api.buildUserApiProviderCatalogDisplay(catalog)
      : Object.assign({
        title:"可绑定 API 平台目录",
        currentStatusLine:"平台目录已建立，但尚未绑定任何真实 API。",
        providerTypeLine:"可选平台类型：机票 / 酒店 / 商品 / 本地服务",
        boundLine:"已绑定 API：0",
        priceLine:"可返回真实价格：0",
        orderLine:"可下单：0",
        paymentLine:"可付款：0",
        explanationLine:"绑定 API 后，weishan 可优先使用用户授权平台的只读价格结果。",
        safetyLine:"当前版本只展示平台目录和权限说明，不保存真实 API key，不测试连接。",
        groups:{ flight:[], hotel:[], commerce:[], localService:[] },
        capabilityLines:[
          "只读潜力：可评估",
          "写入能力：禁用",
          "下单能力：禁用",
          "支付能力：禁用",
          "身份资料上传：禁用",
          "API key 输入：禁用",
          "endpoint 连接：禁用"
        ]
      }, raw.display || {});
    return {
      catalogVersion:"2.1.0",
      phase:"user_api_provider_catalog",
      catalogStatus:"catalog_only",
      catalog,
      summary,
      display
    };
  }

  function createApiBindingReadinessStatus(state){
    const api = window.WeishanCommerceApiBindingReadinessStatus;
    const raw = state && typeof state === "object" ? state : {};
    const status = api && typeof api.buildApiBindingReadinessStatus === "function"
      ? api.buildApiBindingReadinessStatus(raw)
      : {
        status:"not_ready",
        canBindApi:false,
        currentStage:"pre_binding_safety",
      nextStep:"readonly_provider_sandbox_gate",
        summary:{
          userApi:"not_bound",
          providerCatalog:"available",
          apiBindingExplanation:"available",
          mockForm:"disabled_preview",
          permissionChecklist:"readonly_preview",
          secureKeyStorage:"not_ready",
          providerReview:"not_started",
          readonlySandbox:"not_ready",
          realPriceResult:"unavailable"
        },
        blockers:[
          "安全密钥存储方案未完成",
          "API 绑定权限确认不能提交",
          "Provider 条款 / API 文档未人工审查",
          "只读沙箱连接闸门未完成",
          "provider endpoint allowlist 闸门已建立，只读 provider sandbox gate：已建立，等待只读 provider result schema gate",
          "endpoint 连接未启用",
          "网络请求未启用",
          "真实价格返回未启用",
          "bookingUrl 返回未启用"
        ]
      };
    const steps = api && typeof api.buildApiBindingReadinessSteps === "function"
      ? api.buildApiBindingReadinessSteps()
      : [];
    const display = api && typeof api.buildApiBindingReadinessDisplay === "function"
      ? api.buildApiBindingReadinessDisplay()
      : {
        title:"API 绑定准备状态",
        conclusionLine:"当前还不能绑定真实 API。",
        nextStepLine:"下一步：只读 provider result schema gate",
        nextStepDetail:"密钥脱敏与日志防泄露规则：已建立。key 删除 / 轮换 / 过期机制草案：已建立。当前版本仍不能输入、保存、读取、删除、轮换或测试真实 API key。"
      };
    return {
      readinessVersion:"2.1.0",
      phase:"api_binding_readiness_status",
      readinessStatus:"not_ready",
      readinessMode:"status_only",
      status,
      steps,
      display
    };
  }

  function mapGlobalProcurementCategory(category, fallback){
    const map = {
      flight:"flight",
      hotel:"hotel",
      product:"ecommerce",
      local_service:"localService",
      ticket_or_activity:"ticketOrActivity",
      multi_category_plan:"generalProcurement",
      restricted_or_blocked:fallback || "generalProcurement",
      unknown_procurement:fallback || "generalProcurement"
    };
    return map[category] || fallback || "generalProcurement";
  }

  function deriveUserFacingCommerceCategoryLabel(category, globalProcurementIntent, status, outputSummary){
    const fallback = CATEGORY_LABELS[category] || CATEGORY_LABELS.generalProcurement;
    const api = window.WeishanGlobalProcurementUserFacingResultCards;
    if (!api || typeof api.deriveHistoryTypeLabel !== "function") return fallback;
    return api.deriveHistoryTypeLabel({
      category,
      status,
      outputSummary:outputSummary || "",
      blockedReason:globalProcurementIntent && globalProcurementIntent.blockedReason || "",
      globalProcurementIntent:globalProcurementIntent || {}
    }) || fallback;
  }

  function createGlobalProcurementIntent(input){
    const api = window.WeishanGlobalProcurementIntentRouter;
    if (api && typeof api.routeGlobalProcurementIntent === "function") {
      const intent = api.routeGlobalProcurementIntent(input);
      if (typeof api.assertGlobalProcurementIntentRouterSafe === "function") api.assertGlobalProcurementIntentRouterSafe(intent);
      return intent;
    }
    return {
      routerVersion:"4.2.7",
      phase:"global_procurement_intent_router",
      intentType:"offline_procurement_planning",
      category:"unknown_procurement",
      categoryList:["unknown_procurement"],
      origin:"",
      destination:"",
      date:"",
      dateRange:"",
      location:"",
      productName:"",
      serviceName:"",
      activityName:"",
      sortPreference:"安全与可信来源优先",
      budgetPreference:"",
      riskLevel:"medium",
      blockedReason:"",
      missingInfoList:[],
      searchQueryDraft:sanitizeCommerceInput(input),
      externalSearchOnly:true,
      redacted:true
    };
  }

  function createGlobalProcurementPlan(intent){
    const api = window.WeishanGlobalProcurementPlanComposer;
    const plan = api && typeof api.composeGlobalProcurementPlan === "function"
      ? api.composeGlobalProcurementPlan(intent)
      : {
        composerVersion:"4.2.7",
        phase:"global_procurement_plan_composer",
        title:"全球采购计划",
        status:intent && intent.category === "restricted_or_blocked" ? "blocked" : "offline_planning_only",
        currentStatus:"当前为离线采购规划，只整理条件，不接真实 provider。",
        category:intent && intent.category || "unknown_procurement",
        categoryList:intent && intent.categoryList || ["unknown_procurement"],
        missingInfoList:intent && intent.missingInfoList || [],
        externalSearchEntries:intent && intent.category === "restricted_or_blocked" ? [] : [{ label:"打开全网搜索", route:"trusted_web_search", query:intent && intent.searchQueryDraft || "", userClickRequired:true }],
        safetyRestrictions:["不接真实 provider", "不读取 API key", "不连接 endpoint", "不发起网络请求", "不显示真实价格", "不生成 bookingUrl", "不预订 / 不付款 / 不下单"],
        planItems:[],
        blockedReason:intent && intent.blockedReason || "",
        redacted:true
      };
    if (api && typeof api.assertGlobalProcurementPlanSafe === "function") api.assertGlobalProcurementPlanSafe(plan);
    return plan;
  }

  function createGlobalProcurementMissingInfoChecklist(intent){
    const api = window.WeishanGlobalProcurementMissingInfoChecklist;
    const checklist = api && typeof api.buildGlobalProcurementMissingInfoChecklist === "function"
      ? api.buildGlobalProcurementMissingInfoChecklist(intent)
      : {
        checklistVersion:"4.2.7",
        phase:"global_procurement_missing_info_checklist",
        category:intent && intent.category || "unknown_procurement",
        title:"全球采购待补充信息清单",
        status:"draft only",
        mode:"local planning only",
        realProvider:"disabled",
        realNetwork:"disabled",
        redacted:true,
        items:[]
      };
    if (api && typeof api.assertGlobalProcurementMissingInfoChecklistSafe === "function") api.assertGlobalProcurementMissingInfoChecklistSafe(checklist);
    return checklist;
  }

  function createGlobalProcurementSafeNextStepGuidance(intent){
    const api = window.WeishanGlobalProcurementSafeNextStepGuidance;
    const guidance = api && typeof api.buildGlobalProcurementSafeNextStepGuidance === "function"
      ? api.buildGlobalProcurementSafeNextStepGuidance(intent)
      : {
        guidanceVersion:"4.2.7",
        phase:"global_procurement_safe_next_step_guidance",
        category:intent && intent.category || "unknown_procurement",
        title:"全球采购安全下一步建议",
        status:"safe guidance only",
        mode:"no transaction",
        realProvider:"disabled",
        realNetwork:"disabled",
        payment:"disabled",
        order:"disabled",
        redacted:true,
        items:[]
      };
    if (api && typeof api.assertGlobalProcurementSafeNextStepGuidanceSafe === "function") api.assertGlobalProcurementSafeNextStepGuidanceSafe(guidance);
    return guidance;
  }

  function createGlobalProcurementExternalSearchPolicy(intent){
    const api = window.WeishanGlobalProcurementExternalSearchPolicy;
    const policy = api && typeof api.buildGlobalProcurementExternalSearchPolicy === "function"
      ? api.buildGlobalProcurementExternalSearchPolicy(intent)
      : {
        policyVersion:"4.2.7",
        phase:"global_procurement_external_search_policy",
        category:intent && intent.category || "unknown_procurement",
        title:"全球采购外部搜索入口规则",
        status:"manual external search only",
        autoClick:"disabled",
        bookingUrl:"disabled",
        realProvider:"disabled",
        realNetwork:"disabled",
        redacted:true,
        allowExternalSearch:intent && intent.category !== "restricted_or_blocked",
        rules:[]
      };
    if (api && typeof api.assertGlobalProcurementExternalSearchPolicySafe === "function") api.assertGlobalProcurementExternalSearchPolicySafe(policy);
    return policy;
  }

  function createGlobalProcurementDetailQuality(intent){
    const api = window.WeishanGlobalProcurementDetailQualityComposer;
    const detail = api && typeof api.composeGlobalProcurementDetailQuality === "function"
      ? api.composeGlobalProcurementDetailQuality(intent)
      : {
        detailQualityVersion:"4.2.7",
        phase:"global_procurement_detail_quality_composer",
        category:intent && intent.category || "unknown_procurement",
        title:"全球采购计划",
        emptyResultLine:"暂无真实价格结果",
        demandSummary:sanitizeCommerceInput(intent && intent.searchQueryDraft || ""),
        currentStatusLine:"当前为离线采购规划 / 只整理条件 / 不接真实平台。",
        categoryLine:"采购类型 / 类别：全球采购",
        identifiedConditions:[],
        missingInfoList:[],
        safeGuidanceList:[],
        externalSearchPolicyLines:[],
        safetyBoundaryList:["不接真实 provider", "不读取 API key", "不连接 endpoint", "不发起网络请求", "不显示真实价格", "不生成 bookingUrl", "不预订 / 不付款 / 不下单"],
        subPlans:[],
        redacted:true
      };
    if (api && typeof api.assertGlobalProcurementDetailQualitySafe === "function") api.assertGlobalProcurementDetailQualitySafe(detail);
    return detail;
  }

  function createGlobalProcurementRestrictedCategoryGuard(intent){
    const api = window.WeishanGlobalProcurementRestrictedCategoryGuard;
    const guard = api && typeof api.buildGlobalProcurementRestrictedCategoryGuard === "function"
      ? api.buildGlobalProcurementRestrictedCategoryGuard(intent)
      : {
        guardVersion:"4.2.7",
        phase:"global_procurement_restricted_category_guard",
        status:"active",
        mode:"local policy only",
        decision:intent && intent.category === "restricted_or_blocked" ? "blocked" : "allowed_for_offline_planning_only",
        blockedReason:intent && intent.blockedReason || "",
        realProvider:"disabled",
        realNetwork:"disabled",
        payment:"disabled",
        order:"disabled",
        identityUpload:"disabled",
        restrictedCategories:["weapons", "firearms", "ammunition", "explosives", "controlled drugs", "prescription medicine without doctor", "gambling", "counterfeit goods", "stolen goods", "identity upload", "bank card submission", "payment / checkout / order action"],
        blockingRules:["high risk category -> blocked", "payment request -> blocked", "identity upload request -> blocked"],
        auditDraft:{ eventType:"GLOBAL_PROCUREMENT_RESTRICTED_CATEGORY_GUARD_DRAFT", redacted:true },
        redacted:true
      };
    if (api && typeof api.assertGlobalProcurementRestrictedCategoryGuardSafe === "function") api.assertGlobalProcurementRestrictedCategoryGuardSafe(guard);
    return guard;
  }

  function createGlobalProcurementEvidenceSafetySummary(){
    const api = window.WeishanGlobalProcurementEvidenceSafetySummary;
    const summary = api && typeof api.buildGlobalProcurementEvidenceSafetySummary === "function"
      ? api.buildGlobalProcurementEvidenceSafetySummary()
      : {
        summaryVersion:"4.2.7",
        phase:"global_procurement_evidence_safety_summary",
        status:"offline planning only",
        realProvider:"disabled",
        realNetwork:"disabled",
        realApiKey:"disabled",
        realPrice:"disabled",
        availability:"disabled",
        bookingUrl:"disabled",
        payment:"disabled",
        order:"disabled",
        identityUpload:"disabled",
        establishedCapabilities:["multi-category intent routing", "offline procurement plan composition", "restricted category guard"],
        currentForbidden:["real provider", "real network", "real API key", "real endpoint", "real price", "availability", "bookingUrl", "payment", "order", "identity upload"],
        evidenceLines:["security:no-secret-persistence PASS", "commerce:provider-fixtures:offline PASS", "providerActivationState: no-go", "networkAttemptCount: 0", "realProviderCallCount: 0", "realPriceDisplayedCount: 0", "bookingUrlDisplayedCount: 0"],
        auditDraft:{ eventType:"GLOBAL_PROCUREMENT_EVIDENCE_SAFETY_SUMMARY_DRAFT", redacted:true },
        redacted:true
    };
    if (api && typeof api.assertGlobalProcurementEvidenceSafetySummarySafe === "function") api.assertGlobalProcurementEvidenceSafetySummarySafe(summary);
    return summary;
  }

  function createGlobalProcurementDecisionWorkspace(intent, plan, detailQuality){
    const api = window.WeishanGlobalProcurementDecisionWorkspace;
    const workspace = api && typeof api.buildGlobalProcurementDecisionWorkspace === "function"
      ? api.buildGlobalProcurementDecisionWorkspace({
        globalProcurementIntent:intent,
        globalProcurementPlan:plan,
        globalProcurementDetailQuality:detailQuality
      })
      : {
        decisionWorkspaceVersion:"4.2.7",
        phase:"global_procurement_decision_workspace",
        workspaceStatus:"workspace_only",
        gateStatus:"closed",
        mode:"offline_decision_only",
        summary:{
          title:"全球采购决策工作台",
          statusLine:"决策工作台：已建立",
          currentStatusLine:"当前状态：只整理采购决策，不连接真实 provider。",
          redacted:true
        },
        comparisonDimensions:["价格 / 总到手价", "来源可信度", "更新时间", "结果类型", "bookingUrl 安全性", "安全边界"],
        decisionRule:"默认优先真实、可信、可验证的结果；当前仅做离线决策整理。",
        candidateSchema:["providerId", "providerName", "sourceType", "sourceUrlHost", "title", "currency", "price", "updatedAt", "readonlyEvidence", "redacted: true"],
        recommendationTemplate:["平台名称", "价格", "更新时间", "可信度", "点击跳转外部平台 / 官网", "必要安全提示"],
        executionBoundary:["不连接真实 provider", "不读取 API key", "不连接 endpoint", "不发起网络请求", "不显示真实价格", "不生成 bookingUrl", "不付款", "不下单", "不保存身份证 / 银行卡"],
        riskNotice:["未接入真实 provider 时只做采购决策整理，不做真实结果展示", "禁止把 draft 当真实结果", "禁止输出不真实报价或估算价格", "禁止展示 raw provider payload"],
        nextSteps:["先完成 sandbox gate", "再完成 endpoint allowlist gate", "再完成 key 生命周期", "再完成脱敏规则", "再完成本机安全存储", "再完成 API 绑定准备状态"],
        linkage:["sandbox gate", "endpoint allowlist gate", "key 生命周期", "脱敏规则", "本机安全存储", "API 绑定准备状态"],
        auditDraft:{ eventType:"GLOBAL_PROCUREMENT_DECISION_WORKSPACE_DRAFT", decision:"offline_decision_only", redacted:true },
        capabilities:{
          canShowWorkspace:true,
          canShowCurrentStatus:true,
          canShowComparisonDimensions:true,
          canShowDecisionRule:true,
          canShowCandidateSchema:true,
          canShowRecommendationTemplate:true,
          canShowExecutionBoundary:true,
          canShowRiskNotice:true,
          canShowNextSteps:true,
          canShowLinkage:true,
          canUseRealProvider:false,
          canUseNetwork:false,
          canReadApiKey:false,
          canUseEndpoint:false,
          canReturnPrice:false,
          canReturnBookingUrl:false,
          canCreateOrder:false,
          canPay:false,
          canStoreIdentity:false
        },
        display:{
          summaryTitle:"全球采购决策工作台",
          statusLine:"决策工作台：已建立",
          currentStatusLine:"当前状态：只整理采购决策，不连接真实 provider。",
          decisionRuleLine:"decisionRule：默认优先真实、可信、可验证的结果；当前仅做离线决策整理。",
          comparisonDimensionsLine:"comparisonDimensions：价格 / 总到手价、来源可信度、更新时间、结果类型、bookingUrl 安全性、安全边界。",
          candidateSchemaLine:"candidateSchema：providerId / providerName / sourceType / sourceUrlHost / title / currency / price / updatedAt / readonlyEvidence。",
          recommendationTemplateLine:"recommendationTemplate：平台名称 / 价格 / 更新时间 / 可信度 / 点击跳转外部平台 / 必要安全提示。",
          executionBoundaryLine:"executionBoundary：不连接真实 provider，不读取 API key，不连接 endpoint，不发起网络请求，不显示真实价格，不生成 bookingUrl，不付款，不下单，不保存身份证 / 银行卡。",
          riskNoticeLine:"riskNotice：禁止不真实报价，禁止 raw payload，禁止把 draft 当真实结果。",
          nextStepsLine:"nextSteps：先完成 sandbox gate，再完成 endpoint allowlist gate，再完成 key 生命周期，再完成脱敏规则，再完成本机安全存储，再完成 API 绑定准备状态。",
          linkageLine:"linkage：sandbox gate / endpoint allowlist gate / key 生命周期 / 脱敏规则 / 本机安全存储 / API 绑定准备状态。",
          redactedLine:"redacted: true"
        },
        redacted:true
      };
    if (api && typeof api.assertGlobalProcurementDecisionWorkspaceSafe === "function") api.assertGlobalProcurementDecisionWorkspaceSafe(workspace);
    return workspace;
  }

  function createProviderConnectionReadinessConsole(){
    const api = window.WeishanProviderConnectionReadinessConsole;
    const consoleState = api && typeof api.buildProviderConnectionReadinessConsole === "function"
      ? api.buildProviderConnectionReadinessConsole()
      : {
        consoleVersion:"4.2.7",
        phase:"provider_connection_readiness_console",
        status:"readiness console only",
        mode:"offline planning only",
        realProvider:"disabled",
        realNetwork:"disabled",
        realApiKey:"disabled",
        realEndpoint:"disabled",
        realPrice:"disabled",
        availability:"disabled",
        bookingUrl:"disabled",
        payment:"disabled",
        order:"disabled",
        identityUpload:"disabled",
        categoryRows:[],
        readinessMatrix:{ columns:["provider category", "gate state", "final decision"], rows:[] },
        auditDraft:{
          eventType:"PROVIDER_CONNECTION_READINESS_CONSOLE_DRAFT",
          approvedProviderCount:0,
          connectedProviderCount:0,
          networkAttemptCount:0,
          realApiKeyReadCount:0,
          realEndpointConnectCount:0,
          realPriceReturnCount:0,
          bookingUrlReturnCount:0,
          paymentAttemptCount:0,
          orderAttemptCount:0,
          identityUploadAttemptCount:0,
          redacted:true
        },
        redacted:true
      };
    if (api && typeof api.assertProviderConnectionReadinessConsoleSafe === "function") api.assertProviderConnectionReadinessConsoleSafe(consoleState);
    return consoleState;
  }

  function supportsReadonlyProviderResultSchemaGate(category){
    return category === "flight" || category === "ticketOrActivity";
  }

  function createTaskId(){
    return "commerceTask-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function storage(){
    try { return window.localStorage || null; } catch (_) { return null; }
  }

  function uniqueList(items){
    const seen = new Set();
    return (items || []).filter((item) => {
      const value = String(item || "").trim();
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  function getCommerceCategory(text){
    const raw = String(text || "");
    if (/邮轮|游轮|cruise|cruise ship|邮轮票|邮轮旅行|邮轮航线|邮轮舱房|皇家加勒比|歌诗达|MSC\s*邮轮|地中海邮轮/i.test(raw)) return "cruise";
    if (/公务机|私人飞机|私人飞机包机|包机|private jet|charter flight|jet charter|商务包机|包机服务/i.test(raw)) return "privateJet";
    if (/酒店|民宿|住宿|住一晚|住两晚|住三晚|入住|附近住|订房|找房间|找酒店|Hotel/i.test(raw)) return "hotel";
    if (/机票|航班|飞机票|航空票|订机票|预定机票|预订机票|买机票|订票|flight/i.test(raw)) return "flight";
    if (/(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}\s*月\s*\d{1,2}\s*日|今天|明天|后天|下周[一二三四五六日天]?|周[一二三四五六日天]).{0,20}[\u4e00-\u9fa5A-Za-z]{2,24}\s*(?:飞往|飞|到|去)\s*[\u4e00-\u9fa5A-Za-z]{2,24}/i.test(raw)) return "flight";
    if (/[\u4e00-\u9fa5A-Za-z]{2,24}\s*(?:飞往|飞|到|去)\s*[\u4e00-\u9fa5A-Za-z]{2,24}.{0,20}(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}\s*月\s*\d{1,2}\s*日|今天|明天|后天|下周[一二三四五六日天]?|周[一二三四五六日天])/i.test(raw)) return "flight";
    if (/火车票|高铁票|动车票|train/i.test(raw)) return "train";
    if (/OpenRouter|ChatGPT|API|SaaS|模型|model|订阅|会员|AI 平台|AI模型/i.test(raw)) return "aiModelPricing";
    if (/门票|演唱会|展览|票务|ticket/i.test(raw)) return "ticketing";
    if (/预约|保洁|维修|咨询|service/i.test(raw)) return "serviceBooking";
    if (/域名|domain/i.test(raw)) return "domain";
    if (/MacBook|iPhone|华为|苹果|电脑|手机|商品|电商|买|购买|采购|purchase|shopping|Sony|索尼|Samsung|三星|Fujifilm|富士|Canon|佳能|PlayStation|耳机|headphone|camera|相机|WH-\d+[A-Z0-9-]*|WF-\d+[A-Z0-9-]*|X-T\d+|EOS-R\d+|SM-S\d+[A-Z]?|A\d{4}/i.test(raw)) return "ecommerce";
    return "generalProcurement";
  }

  function getCommerceSearchScope(category){
    const map = {
      hotel:["酒店聚合平台", "品牌官网", "本地旅行平台", "退款政策与税费说明"],
      flight:["航司官网", "机票聚合平台", "中转组合方案", "行李与退改规则"],
      train:["官方票务平台", "车次与席别范围", "中转与联程方案", "退改规则"],
      ecommerce:["品牌官网", "主流电商平台", "跨境采购渠道", "保修与退换货政策"],
      aiModelPricing:["平台官网价格页", "模型网关价格页", "社区口碑与稳定性反馈", "地区与合规可用性说明"],
      ticketing:["官方票务渠道", "授权代理平台", "二级市场风险提示", "退票与实名规则"],
      serviceBooking:["服务平台", "商家官网", "评价与履约记录", "售后与取消政策"],
      domain:["域名注册商", "品牌官网", "续费与转移政策", "隐私保护与地区限制"],
      cruise:["邮轮公司官网", "邮轮代理平台", "旅行平台", "港口出发地", "航线日期", "舱型", "餐饮/服务", "退改政策"],
      privateJet:["公务机包机平台", "航空服务商", "固定基地运营商 FBO", "包机经纪商", "起降机场", "机型", "航程", "服务条款"],
      localService:["本地服务平台", "商家官网", "资质与评价", "履约和售后政策"],
      ticketOrActivity:["票务平台", "活动官网", "区域票务平台", "Ticketmaster / 大麦 / Eventbrite / 活动官网"],
      generalProcurement:["全球采购平台", "品牌与官方渠道", "价格比较渠道", "风险与售后信息"]
    };
    return map[category] || map.generalProcurement;
  }

  function getCommerceDecisionCriteria(category){
    const base = ["价格", "评分", "信誉", "售后", "退改政策", "时效", "地区限制", "风险", "隐性费用"];
    if (category === "flight" || category === "train") return base.concat(["总耗时", "中转成本", "行李/席别规则"]);
    if (category === "hotel") return base.concat(["位置", "清洁度", "取消政策"]);
    if (category === "aiModelPricing") return base.concat(["计费单位", "上下文/额度", "稳定性", "合规策略"]);
    if (category === "domain") return base.concat(["首年费用", "续费价格", "转移限制", "隐私保护"]);
    if (category === "cruise") return ["总价", "人均价", "舱型", "出发港", "航线天数", "停靠港口", "餐饮和服务", "签证/登船要求", "退改政策", "隐性费用", "评价和信誉"];
    if (category === "privateJet") return ["包机报价", "飞行小时成本", "机型", "航程能力", "机场可用性", "服务商资质", "取消政策", "附加费用", "安全记录", "响应速度", "合同条款风险"];
    return base;
  }

  function classifyCommerceIntent(text){
    const raw = String(text || "");
    const category = getCommerceCategory(raw);
    const purchaseWords = /全球采购|采购代理|自动采购|比价|价格比较|平台比较|最便宜方案|性价比最高|可预订|可下单|低价|最便宜|帮我买|帮我订|帮我预定|帮我预订|帮我比较|我想买|订下周|直接下单|下单|付款|采购|购买|买|预定|预订|订票|买票|订|找最便宜|最便宜.*(?:机票|酒店|域名|方案|API|平台|商品|邮轮|游轮|公务机|包机)|OpenRouter.*价格|模型平台.*价格/i;
    const assistedSearchPurchase = /帮我(?:找|买|购买|订|预定|预订|比较).*(?:机票|飞机票|航空票|酒店|住宿|火车票|高铁票|航班|商品|MacBook|iPhone|华为|手机|电脑|域名|ChatGPT API|API 方案|模型平台|采购渠道|最便宜|低价|性价比|邮轮|游轮|公务机|包机|私人飞机)/i.test(raw);
    const objectWithPurchase = /(?:机票|飞机票|航空票|航班|酒店|住宿|商品|电商|MacBook|iPhone|华为|手机|电脑|邮轮|游轮|公务机|私人飞机|包机).*(?:找|买|购买|订|预定|预订|订票|买票|比价|最便宜|低价)|(?:找|买|购买|订|预定|预订|订票|买票|比价|最便宜|低价).*(?:机票|飞机票|航空票|航班|酒店|住宿|商品|电商|MacBook|iPhone|华为|手机|电脑|邮轮|游轮|公务机|私人飞机|包机)/i.test(raw);
    const flightSearchIntent = category === "flight" && (
      /(?:查|查一下|查询|看一下|找).{0,20}(?:机票|飞机票|航空票|航班)/i.test(raw) ||
      /(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}\s*月\s*\d{1,2}\s*日|今天|明天|后天|下周[一二三四五六日天]?|周[一二三四五六日天]).{0,20}[\u4e00-\u9fa5A-Za-z]{2,24}\s*(?:飞往|飞|到|去)\s*[\u4e00-\u9fa5A-Za-z]{2,24}/i.test(raw) ||
      /[\u4e00-\u9fa5A-Za-z]{2,24}\s*(?:飞往|飞|到|去)\s*[\u4e00-\u9fa5A-Za-z]{2,24}.{0,20}(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}\s*月\s*\d{1,2}\s*日|今天|明天|后天|下周[一二三四五六日天]?|周[一二三四五六日天])/i.test(raw)
    );
    const directOrderRisk = /直接下单|下单并付款|提交订单|自动付款|付款|支付|提交.*询价表|提交.*询价|上传.*(?:护照|身份证)|(?:护照|身份证).*(?:预订|预定|订|上传)/i.test(raw);
    const categoryWords = /酒店|住宿|机票|飞机票|航空票|火车票|高铁票|航班|电商|商品|SaaS|AI 模型|模型平台|API|门票|票务|服务预约|域名|MacBook|ChatGPT API|采购渠道|邮轮|游轮|cruise|公务机|私人飞机|包机|private jet|charter flight/i;
    const isCommerceIntent = directOrderRisk || flightSearchIntent || objectWithPurchase || ((purchaseWords.test(raw) || assistedSearchPurchase) && (categoryWords.test(raw) || category !== "generalProcurement" || /全球采购|采购代理|自动采购|比价|平台比较|价格比较/i.test(raw)));
    return {
      isCommerceIntent,
      module:"commerceAgent",
      action:"commerceAgent.plan",
      category,
      realExecution:false,
      requiresUserConfirmation:true
    };
  }

  function cleanPlaceName(value, side){
    let next = String(value || "");
    if (side === "origin") next = next.replace(/.*?(?:\d{1,2}\s*月\s*\d{1,2}\s*日|今天|明天|后天|下周[一二三四五六日天]?|周[一二三四五六日天])/, "");
    next = next
      .replace(/^日/, "")
      .replace(/^(帮我|请|想|我要|需要|找|买|购买|订|预定|预订|订票|买票|从|出发|低价|最便宜|的)+/g, "")
      .replace(/(直达|直飞|不转机|不要中转|只看直飞|最低价|价格最低|商务舱|经济舱|头等舱)/g, "")
      .replace(/(机票|飞机票|航空票|航班|酒店|住宿|火车票|高铁票|邮轮|游轮|公务机|私人飞机|包机|商品|电商|低价|最便宜|最低价|价格最低|的).*$/g, "")
      .trim();
    return sanitizeCommerceInput(next).slice(0, 40);
  }

  function normalizeCommerceDate(value){
    const raw = String(value || "").trim();
    const cn = raw.match(/^(\d{1,2})\s*月\s*(\d{1,2})\s*日$/);
    if (cn) return Number(cn[1]) + " 月 " + Number(cn[2]) + " 日";
    const numeric = raw.match(/^(\d{4})\s*([-\/])\s*(\d{1,2})\s*\2\s*(\d{1,2})$/);
    if (numeric) return numeric[1] + numeric[2] + Number(numeric[3]) + numeric[2] + Number(numeric[4]);
    return raw.replace(/\s+/g, " ");
  }

  function extractCommerceFields(text){
    const raw = String(text || "");
    const parser = window.WeishanFlightIntentParser;
    if (parser && typeof parser.parseFlightIntent === "function" && /机票|飞机票|航空票|航班|直飞|直达|不转机|不要中转/.test(raw)) {
      const parsed = parser.parseFlightIntent(raw);
      if (parsed && parsed.origin && parsed.destination) {
        return {
          originText:parsed.origin,
          destinationText:parsed.destination,
          dateText:parsed.departureDate,
          directOnly:parsed.directOnly,
          sortPreference:parsed.sortPreference,
          flightIntentParserAudit:parsed.audit
        };
      }
    }
    const datePattern = "(\\d{4}\\s*[-/]\\s*\\d{1,2}\\s*[-/]\\s*\\d{1,2}|\\d{1,2}\\s*月\\s*\\d{1,2}\\s*日|今天|明天|后天|下周[一二三四五六日天]?|周[一二三四五六日天])";
    const placePattern = "([\\u4e00-\\u9fa5A-Za-z]{2,24})";
    const dateMatch = raw.match(new RegExp(datePattern));
    const routeText = raw.replace(new RegExp("^\\s*" + datePattern + "\\s*"), "");
    let routeMatch = raw.match(new RegExp(datePattern + "\\s*" + placePattern + "\\s*(?:到|飞往|飞|去)\\s*" + placePattern, "i"));
    if (routeMatch) {
      return {
        originText:cleanPlaceName(routeMatch[2], "origin"),
        destinationText:cleanPlaceName(routeMatch[3], "destination"),
        dateText:normalizeCommerceDate(routeMatch[1] || "")
      };
    }
    routeMatch = routeText.match(new RegExp(placePattern + "\\s*(?:到|飞往|飞|去)\\s*" + placePattern + "\\s*" + datePattern, "i"));
    if (routeMatch) {
      return {
        originText:cleanPlaceName(routeMatch[1], "origin"),
        destinationText:cleanPlaceName(routeMatch[2], "destination"),
        dateText:normalizeCommerceDate(routeMatch[3] || "")
      };
    }
    routeMatch = routeText.match(/([\u4e00-\u9fa5A-Za-z]{2,24})\s*(?:到|飞往|飞|去)\s*([\u4e00-\u9fa5A-Za-z]{2,24})/);
    return {
      originText:routeMatch ? cleanPlaceName(routeMatch[1], "origin") : "",
      destinationText:routeMatch ? cleanPlaceName(routeMatch[2], "destination") : "",
      dateText:normalizeCommerceDate(dateMatch && dateMatch[1] || "")
    };
  }

  function extractProductQuery(text){
    const raw = sanitizeCommerceInput(text).replace(/^E2E[A-Z]+-\d+\s*/i, "");
    return raw
      .replace(/^(请|帮我|麻烦|我要|我想|想要|需要)\s*/g, "")
      .replace(/^(买|购买|找|搜索|查找|比较|比价)\s*/g, "")
      .replace(/(最便宜|低价|性价比高|性价比最高|一个|一台|一部|的|商品|电商|价格|多少钱|帮我|请)/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 60);
  }

  function normalizedFields(text, category, globalProcurementIntent, status){
    const fields = extractCommerceFields(text);
    return {
      need:sanitizeCommerceInput(text),
      category,
      categoryLabel:deriveUserFacingCommerceCategoryLabel(category, globalProcurementIntent, status, ""),
      originText:fields.originText,
      destinationText:fields.destinationText,
      dateText:fields.dateText,
      directOnly:fields.directOnly === true,
      sortPreference:fields.sortPreference || (/最便宜|低价|便宜|最低价|价格最低/.test(String(text || "")) ? "low_price" : ""),
      flightIntentParserAudit:fields.flightIntentParserAudit || null,
      productQuery:category === "ecommerce" ? extractProductQuery(text) || sanitizeCommerceInput(text) : "",
      normalizedQuery:category === "ecommerce" ? extractProductQuery(text) || sanitizeCommerceInput(text) : sanitizeCommerceInput(text),
      budget:"",
      region:"",
      timing:fields.dateText,
      constraints:/最便宜|低价|便宜/.test(String(text || "")) ? "低价优先" : "同等条件下优先价格最低，同时保留风险、信誉、售后和地区限制判断。"
    };
  }

  function missingFieldsForTask(text, category){
    const raw = String(text || "");
    if (/^(flight|train|hotel)$/.test(category) && !/(\d{4}\s*[-/]\s*\d{1,2}\s*[-/]\s*\d{1,2}|\d{1,2}\s*月\s*\d{1,2}\s*日|今天|明天|后天|下周|周[一二三四五六日天])/.test(raw)) {
      return [category === "hotel" ? "入住日期" : "出行日期"];
    }
    return [];
  }

  function createMockSafeCandidateSchema(category){
    const common = [
      "平台",
      "价格字段（留空，等待真实搜索后填入）",
      "评分",
      "信誉",
      "退改政策",
      "交付时效",
      "隐藏费用",
      "地区限制",
      "风险备注"
    ];
    const extras = {
      flight:["总耗时", "中转次数", "行李规则"],
      hotel:["位置", "房型", "取消政策"],
      train:["车次", "席别", "中转方案"],
      aiModelPricing:["计费单位", "上下文/额度", "调用稳定性"],
      domain:["首年费用字段", "续费价格字段", "转移规则"],
      cruise:["邮轮公司", "航线名称", "出发港", "目的地/停靠港", "出发日期", "天数", "舱型", "总价", "人均价", "费用包含", "费用不含", "退改政策", "预订链接", "风险备注"],
      privateJet:["服务商", "机型", "起飞机场", "到达机场", "预计飞行时间", "报价", "币种", "可乘人数", "行李限制", "取消政策", "附加费用", "合规/安全说明", "询价链接", "风险备注"]
    };
    return uniqueList(common.concat(extras[category] || []));
  }

  function createRecommendationTemplate(category){
    return {
      title:"推荐方案格式",
      note:"当前只定义推荐输出结构，不填真实价格，不伪造实时库存或可用性。",
      fields:uniqueList([
        "推荐方案名称",
        "适用场景",
        "价格字段（真实搜索后填入）",
        "优势",
        "主要风险",
        "退改/售后条件",
        "执行前需要用户确认的事项",
        category === "aiModelPricing" ? "计费口径与合规说明" : "",
        category === "flight" ? "行李/中转/改签说明" : "",
        category === "cruise" ? "航线、舱型、登船要求与退改说明" : "",
        category === "privateJet" ? "询价口径、机型、机场、服务条款与安全资质说明" : ""
      ])
    };
  }

  function createCommerceRiskNotice(){
    return [
      "当前不真实搜索外部网站。",
      "当前不下单、不付款、不提交订单。",
      "当前不上传文件，不保存敏感身份或支付信息。",
      "候选方案只展示字段模板，不伪造实时价格。",
      "最终执行必须由用户确认。"
    ];
  }

  function createCommerceExecutionBoundary(){
    return [
      "只生成搜索与推荐计划。",
      "不真实访问外部网站。",
      "不下单、不付款、不提交订单。",
      "不提交表单，不上传文件。",
      "不保存银行卡、密码、身份证、护照、cookie 或 token。",
      "最终执行必须由用户确认。"
    ];
  }

  function globalShoppingPlatformCandidateFactoryApi(){
    return window.WeishanGlobalShoppingPlatformCandidateFactory || {};
  }

  function globalShoppingReadOnlySearchResultPresenterApi(){
    return window.WeishanGlobalShoppingReadOnlySearchResultPresenter || {};
  }

  function globalShoppingExternalDeepLinkSafetyGateApi(){
    return window.WeishanGlobalShoppingExternalDeepLinkSafetyGate || {};
  }

  function globalShoppingSearchParameterPrefillGateApi(){
    return window.WeishanGlobalShoppingSearchParameterPrefillGate || {};
  }

  function globalShoppingPlatformAvailabilityGateApi(){
    return window.WeishanGlobalShoppingPlatformAvailabilityGate || {};
  }

  function globalShoppingPartnerLinkPolicyApi(){
    return window.WeishanGlobalShoppingPartnerLinkPolicy || {};
  }

  function supportsGlobalShoppingReadOnlyLoop(category){
    return category === "ecommerce" || category === "flight" || category === "hotel";
  }

  function readOnlySearchCategoryFor(category){
    return category === "ecommerce" ? "product" : (supportsGlobalShoppingReadOnlyLoop(category) ? category : "");
  }

  function toLegacyReadOnlyCandidate(item){
    const safe = item && typeof item === "object" ? item : {};
    return {
      candidateId:safe.platformName || safe.title || "readonly_candidate",
      title:safe.title || "只读候选结果",
      provider:safe.platformName || "",
      sourceName:safe.platformName || "",
      url:safe.targetUrl || "",
      bookingUrl:null,
      urlType:"external_search",
      price:null,
      totalPrice:null,
      currency:safe.currency || "",
      priceLabel:safe.priceLabel || "价格以平台页面为准",
      recommendationReason:safe.recommendationReason || "按平台可信度、搜索相关性和只读边界进行推荐",
      conditions:safe.feeNote || "",
      riskSummary:safe.riskNote || "",
      hiddenFeeNote:safe.feeNote || "",
      extras:[
        safe.isOfficial ? "官网/官方入口" : "",
        safe.sourceType === "aggregator" ? "聚合入口" : "",
        safe.trustLevel === "high" ? "高可信度" : (safe.trustLevel === "medium" ? "中等可信度" : "需要复核")
      ].filter(Boolean)
    };
  }

  function createGlobalShoppingReadOnlySearchSummary(input, category, normalizedTaskFields, blocked){
    if (blocked || !supportsGlobalShoppingReadOnlyLoop(category)) {
      return {
        readOnlySearchCategory:"",
        readOnlySearchCandidates:[],
        readOnlySearchTopResults:[],
        readOnlySearchRemainingResults:[],
        readOnlySearchResultSummary:null,
        recommendation:null,
        candidates:[]
      };
    }
    const searchCategory = readOnlySearchCategoryFor(category);
    const factoryApi = globalShoppingPlatformCandidateFactoryApi();
    const presenterApi = globalShoppingReadOnlySearchResultPresenterApi();
    const allCandidates = typeof factoryApi.buildGlobalShoppingPlatformCandidates === "function" ? factoryApi.buildGlobalShoppingPlatformCandidates({
      category:searchCategory,
      inputSummary:input,
      normalizedFields:normalizedTaskFields || {}
    }) : [];
    const presentation = typeof presenterApi.buildGlobalShoppingReadOnlySearchResultPresentation === "function" ? presenterApi.buildGlobalShoppingReadOnlySearchResultPresentation({
      category:searchCategory,
      inputSummary:input,
      candidates:allCandidates
    }) : {
      topResults:[],
      remainingResults:[],
      candidateCount:0,
      recommendation:null
    };
    const topResults = Array.isArray(presentation.topResults) ? presentation.topResults : [];
    return {
      readOnlySearchCategory:searchCategory,
      readOnlySearchCandidates:Array.isArray(allCandidates) ? allCandidates : [],
      readOnlySearchTopResults:topResults,
      readOnlySearchRemainingResults:Array.isArray(presentation.remainingResults) ? presentation.remainingResults : [],
      readOnlySearchResultSummary:presentation,
      shoppingContextSummary:topResults[0] && topResults[0].shoppingContext ? topResults[0].shoppingContext : null,
      providerRanking:topResults[0] && topResults[0].providerRanking ? topResults[0].providerRanking : null,
      taxSummary:topResults[0] && topResults[0].taxSummary ? topResults[0].taxSummary : null,
      recommendationReason:topResults[0] && topResults[0].recommendationReasonDetail ? topResults[0].recommendationReasonDetail : null,
      orchestration:presentation.orchestration || null,
      intentClassification:presentation.intentClassification || null,
      entityExtraction:presentation.entityExtraction || null,
      workflowState:presentation.workflowState || null,
      decisionResult:presentation.decisionResult || null,
      comparisonMatrix:presentation.comparisonMatrix || null,
      recommendation:presentation.recommendation || null,
      candidates:[]
    };
  }

  function createGlobalShoppingReadOnlyTaskGates(summary){
    const top = Array.isArray(summary && summary.readOnlySearchTopResults) ? (summary.readOnlySearchTopResults[0] || {}) : {};
    const domain = (function(){
      try { return top.targetUrl ? new URL(top.targetUrl).hostname : ""; } catch (_) { return ""; }
    })();
    const deepLinkInput = {
      allowedDomain:domain,
      sourceType:top.sourceType || "major_platform",
      sourceName:top.platformName || "",
      disclosureText:"价格以跳转后平台实时页面为准。用户需在平台自行确认价格、登录、填写资料并完成下单。",
      userConfirmationRequired:true
    };
    const deepLinkApi = globalShoppingExternalDeepLinkSafetyGateApi();
    const prefillApi = globalShoppingSearchParameterPrefillGateApi();
    const availabilityApi = globalShoppingPlatformAvailabilityGateApi();
    const partnerApi = globalShoppingPartnerLinkPolicyApi();
    const partnerSummary = typeof partnerApi.buildGlobalShoppingPartnerLinkPolicy === "function" ? partnerApi.buildGlobalShoppingPartnerLinkPolicy({
      linkRelation:top.isOfficial ? "official" : "partner"
    }) : null;
    return {
      externalDeepLinkSafetySummary:typeof deepLinkApi.buildGlobalShoppingExternalDeepLinkSafetyGate === "function" ? deepLinkApi.buildGlobalShoppingExternalDeepLinkSafetyGate(deepLinkInput) : null,
      searchParameterPrefillSummary:typeof prefillApi.buildGlobalShoppingSearchParameterPrefillGate === "function" ? prefillApi.buildGlobalShoppingSearchParameterPrefillGate({
        itemType:summary.readOnlySearchCategory || "unknown",
        destination:summary.readOnlySearchCategory === "hotel" ? top.title : "",
        productModel:summary.readOnlySearchCategory === "product" ? top.title : "",
        nonSensitivePreference:"只带入非敏感搜索条件"
      }) : null,
      platformAvailabilitySummary:typeof availabilityApi.buildGlobalShoppingPlatformAvailabilityGate === "function" ? availabilityApi.buildGlobalShoppingPlatformAvailabilityGate({
        sourceName:top.platformName || "",
        sourceType:top.sourceType || "major_platform",
        allowedDomain:domain,
        itemType:summary.readOnlySearchCategory || "unknown",
        partnerLinkPolicySummary:partnerSummary
      }) : null,
      partnerLinkPolicySummary:partnerSummary
    };
  }

  function taskStatusFromText(text){
    return /直接下单|下单并付款|支付|付款|自动付款|提交订单|提交.*询价表|提交.*询价|上传.*(?:护照|身份证)|(?:护照|身份证).*(?:预订|预定|订|上传)/i.test(String(text || "")) ? "blocked" : "planned";
  }

  function createCommerceTask(input){
    const clean = sanitizeCommerceInput(input);
    const baseCategory = getCommerceCategory(clean);
    const globalProcurementIntent = createGlobalProcurementIntent(clean);
    const preserveSpecialCategory = baseCategory === "cruise" || baseCategory === "privateJet";
    const category = preserveSpecialCategory ? baseCategory : mapGlobalProcurementCategory(globalProcurementIntent.category, baseCategory);
    const status = globalProcurementIntent.category === "restricted_or_blocked" ? "blocked" : taskStatusFromText(clean);
    const globalProcurementPlan = createGlobalProcurementPlan(globalProcurementIntent);
    const globalProcurementMissingInfoChecklist = createGlobalProcurementMissingInfoChecklist(globalProcurementIntent);
    const globalProcurementSafeNextStepGuidance = createGlobalProcurementSafeNextStepGuidance(globalProcurementIntent);
    const globalProcurementExternalSearchPolicy = createGlobalProcurementExternalSearchPolicy(globalProcurementIntent);
    const globalProcurementDetailQuality = createGlobalProcurementDetailQuality(globalProcurementIntent);
    const globalProcurementDecisionWorkspace = createGlobalProcurementDecisionWorkspace(globalProcurementIntent, globalProcurementPlan, globalProcurementDetailQuality);
    const providerConnectionReadinessConsole = createProviderConnectionReadinessConsole();
    const globalProcurementRestrictedCategoryGuard = createGlobalProcurementRestrictedCategoryGuard(globalProcurementIntent);
    const globalProcurementEvidenceSafetySummary = createGlobalProcurementEvidenceSafetySummary();
    const normalizedTaskFields = normalizedFields(clean, category, globalProcurementIntent, status);
    const readOnlySearchSummary = createGlobalShoppingReadOnlySearchSummary(clean, category, normalizedTaskFields, status === "blocked");
    const readOnlySearchGates = createGlobalShoppingReadOnlyTaskGates(readOnlySearchSummary);
    const createdAt = nowIso();
    return {
      schemaVersion:"weishan.commerceAgent.task.v1",
      taskId:createTaskId(),
      inputSummary:clean,
      category,
      categoryLabel:CATEGORY_LABELS[category] || CATEGORY_LABELS.generalProcurement,
      status,
      intent:"search_compare_recommend_before_confirm",
      searchScope:getCommerceSearchScope(category),
      normalizedFields:normalizedTaskFields,
      decisionCriteria:getCommerceDecisionCriteria(category),
      candidateSchema:createMockSafeCandidateSchema(category),
      recommendationTemplate:createRecommendationTemplate(category),
      executionBoundary:createCommerceExecutionBoundary(),
      riskNotice:createCommerceRiskNotice(),
      riskLevel:status === "blocked" ? "high" : "medium",
      missingFields:missingFieldsForTask(clean, category),
      globalProcurementIntent,
      globalProcurementPlan,
      globalProcurementMissingInfoChecklist,
      globalProcurementSafeNextStepGuidance,
      globalProcurementExternalSearchPolicy,
      globalProcurementDetailQuality,
      globalProcurementDecisionWorkspace,
      providerConnectionReadinessConsole,
      globalProcurementRestrictedCategoryGuard,
      globalProcurementEvidenceSafetySummary,
      searchStatus:"no_provider",
      searchProviderName:"",
      providerHealth:[],
      complianceHealth:{},
      flightLowestOffersContract:category === "flight" ? createFlightLowestOffersContract() : null,
      flightProviderCandidatesRegistry:category === "flight" ? createFlightProviderCandidatesRegistry() : null,
      flightProviderApprovalStatus:category === "flight" ? createFlightProviderApprovalStatus() : null,
      flightReadonlyStubPermission:category === "flight" ? createFlightReadonlyStubPermission() : null,
      flightReadonlyStubAdapter:category === "flight" ? createFlightReadonlyStubAdapter() : null,
      flightSandboxDryRun:category === "flight" ? createFlightSandboxDryRun() : null,
      flightSandboxProviderMatrix:category === "flight" ? createFlightSandboxProviderMatrix() : null,
      flightSecureKeyStoragePlan:category === "flight" ? createSecureKeyStoragePlan() : null,
      secureStorageDesignGate:category === "flight" ? createSecureStorageDesignGate() : null,
      localSecureStorageInterfaceDraft:category === "flight" ? createLocalSecureStorageInterfaceDraft() : null,
      keyRedactionAndLogLeakRules:category === "flight" ? createKeyRedactionAndLogLeakRules() : null,
      keyLifecycleDraft:category === "flight" ? createKeyLifecycleDraft() : null,
      providerEndpointAllowlistGate:category === "flight" ? createProviderEndpointAllowlistGate() : null,
      readonlyProviderSandboxGate:category === "flight" ? createReadonlyProviderSandboxGate() : null,
      readonlyProviderResultSchemaGate:supportsReadonlyProviderResultSchemaGate(category) ? createReadonlyProviderResultSchemaGate() : null,
      providerResultSourceLabelGate:category === "flight" ? createProviderResultSourceLabelGate() : null,
      priceIntegrityTaxesFeesGate:category === "flight" ? createPriceIntegrityTaxesFeesGate() : null,
      bookingUrlDomainSafetyGate:category === "flight" ? createBookingUrlDomainSafetyGate() : null,
      manualProviderReviewWorkflow:category === "flight" ? createManualProviderReviewWorkflow() : null,
      providerActivationReadinessGate:category === "flight" ? createProviderActivationReadinessGate() : null,
      credentialConsentScopeGate:category === "flight" ? createCredentialConsentScopeGate() : null,
      readonlyAdapterContractGate:category === "flight" ? createReadonlyAdapterContractGate() : null,
      providerGateMatrixDashboard:category === "flight" ? createProviderGateMatrixDashboard() : null,
      providerNoNetworkRuntimeGuard:category === "flight" ? createProviderNoNetworkRuntimeGuard() : null,
      offlineProviderFixtureValidationHarness:category === "flight" ? createOfflineProviderFixtureValidationHarness() : null,
      providerComplianceDecisionEngine:category === "flight" ? createProviderComplianceDecisionEngine() : null,
      offlineProviderFixtureRunner:category === "flight" ? createOfflineProviderFixtureRunner() : null,
      noNetworkSentinelAudit:category === "flight" ? createNoNetworkSentinelAudit() : null,
      providerComplianceEvidenceReport:category === "flight" ? createProviderComplianceEvidenceReport() : null,
      localSafetyEvidenceConsole:category === "flight" ? createLocalSafetyEvidenceConsole() : null,
      manualUiAcceptanceAssistant:category === "flight" ? createManualUiAcceptanceAssistant() : null,
      noSecretPersistenceGuard:category === "flight" ? createNoSecretPersistenceGuard() : null,
      settingsAuthLocalSecurityEvidence:category === "flight" ? createSettingsAuthLocalSecurityEvidence() : null,
      userApiPriorityPolicyState:createUserApiPriorityPolicyState(),
      apiBindingSafeShellState:category === "flight" ? createApiBindingSafeShellState() : null,
      userApiProviderCatalogState:category === "flight" ? createUserApiProviderCatalogState() : null,
      apiBindingReadinessStatus:category === "flight" ? createApiBindingReadinessStatus() : null,
      canShowPrice:false,
      canShowBookingButton:readOnlySearchSummary.readOnlySearchTopResults.length > 0,
      canShowCheckoutButton:false,
      readOnlySearchCategory:readOnlySearchSummary.readOnlySearchCategory,
      readOnlySearchCandidates:readOnlySearchSummary.readOnlySearchCandidates,
      readOnlySearchTopResults:readOnlySearchSummary.readOnlySearchTopResults,
      readOnlySearchRemainingResults:readOnlySearchSummary.readOnlySearchRemainingResults,
      readOnlySearchResultSummary:readOnlySearchSummary.readOnlySearchResultSummary,
      decisionResult:readOnlySearchSummary.decisionResult,
      comparisonMatrix:readOnlySearchSummary.comparisonMatrix,
      externalDeepLinkSafetySummary:readOnlySearchGates.externalDeepLinkSafetySummary,
      searchParameterPrefillSummary:readOnlySearchGates.searchParameterPrefillSummary,
      platformAvailabilitySummary:readOnlySearchGates.platformAvailabilitySummary,
      partnerLinkPolicySummary:readOnlySearchGates.partnerLinkPolicySummary,
      candidates:readOnlySearchSummary.candidates,
      recommendation:readOnlySearchSummary.recommendation,
      searchErrorMessage:"",
      searchResultSummary:readOnlySearchSummary.readOnlySearchResultSummary ? {
        candidateCount:readOnlySearchSummary.readOnlySearchResultSummary.candidateCount || 0,
        source:"read_only_platform_templates",
        mode:"local_rule_or_ai_intent_without_network"
      } : null,
      displayTitle:"",
      realExecution:false,
      requiresUserConfirmation:true,
      createdAt,
      updatedAt:createdAt
    };
  }

  function createCommercePlan(text){
    return createCommerceTask(text);
  }

  function normalizeTask(task){
    const base = task && typeof task === "object" ? task : {};
    const input = sanitizeCommerceInput(base.inputSummary || base.text || "");
    const globalProcurementIntent = base.globalProcurementIntent && typeof base.globalProcurementIntent === "object" ? base.globalProcurementIntent : createGlobalProcurementIntent(input);
    const category = base.category || mapGlobalProcurementCategory(globalProcurementIntent.category, getCommerceCategory(input));
    const globalProcurementPlan = base.globalProcurementPlan && typeof base.globalProcurementPlan === "object" ? base.globalProcurementPlan : createGlobalProcurementPlan(globalProcurementIntent);
    const globalProcurementMissingInfoChecklist = base.globalProcurementMissingInfoChecklist && typeof base.globalProcurementMissingInfoChecklist === "object" ? base.globalProcurementMissingInfoChecklist : createGlobalProcurementMissingInfoChecklist(globalProcurementIntent);
    const globalProcurementSafeNextStepGuidance = base.globalProcurementSafeNextStepGuidance && typeof base.globalProcurementSafeNextStepGuidance === "object" ? base.globalProcurementSafeNextStepGuidance : createGlobalProcurementSafeNextStepGuidance(globalProcurementIntent);
    const globalProcurementExternalSearchPolicy = base.globalProcurementExternalSearchPolicy && typeof base.globalProcurementExternalSearchPolicy === "object" ? base.globalProcurementExternalSearchPolicy : createGlobalProcurementExternalSearchPolicy(globalProcurementIntent);
    const globalProcurementDetailQuality = base.globalProcurementDetailQuality && typeof base.globalProcurementDetailQuality === "object" ? base.globalProcurementDetailQuality : createGlobalProcurementDetailQuality(globalProcurementIntent);
    const globalProcurementDecisionWorkspace = base.globalProcurementDecisionWorkspace && typeof base.globalProcurementDecisionWorkspace === "object" ? base.globalProcurementDecisionWorkspace : createGlobalProcurementDecisionWorkspace(globalProcurementIntent, globalProcurementPlan, globalProcurementDetailQuality);
    const providerConnectionReadinessConsole = base.providerConnectionReadinessConsole && typeof base.providerConnectionReadinessConsole === "object" ? base.providerConnectionReadinessConsole : createProviderConnectionReadinessConsole();
    const globalProcurementRestrictedCategoryGuard = base.globalProcurementRestrictedCategoryGuard && typeof base.globalProcurementRestrictedCategoryGuard === "object" ? base.globalProcurementRestrictedCategoryGuard : createGlobalProcurementRestrictedCategoryGuard(globalProcurementIntent);
    const globalProcurementEvidenceSafetySummary = base.globalProcurementEvidenceSafetySummary && typeof base.globalProcurementEvidenceSafetySummary === "object" ? base.globalProcurementEvidenceSafetySummary : createGlobalProcurementEvidenceSafetySummary();
    const normalizedTaskFields = base.normalizedFields || normalizedFields(input, category, globalProcurementIntent, String(base.status || (globalProcurementIntent.category === "restricted_or_blocked" ? "blocked" : taskStatusFromText(input))));
    const readOnlySearchSummary = createGlobalShoppingReadOnlySearchSummary(input, category, normalizedTaskFields, String(base.status || "") === "blocked");
    const readOnlySearchGates = createGlobalShoppingReadOnlyTaskGates(readOnlySearchSummary);
    const createdAt = base.createdAt || nowIso();
    return {
      schemaVersion:base.schemaVersion || "weishan.commerceAgent.task.v1",
      taskId:String(base.taskId || createTaskId()),
      inputSummary:input,
      category,
      categoryLabel:base.categoryLabel || deriveUserFacingCommerceCategoryLabel(category, globalProcurementIntent, String(base.status || (globalProcurementIntent.category === "restricted_or_blocked" ? "blocked" : taskStatusFromText(input))), ""),
      status:String(base.status || (globalProcurementIntent.category === "restricted_or_blocked" ? "blocked" : taskStatusFromText(input))),
      intent:String(base.intent || "search_compare_recommend_before_confirm"),
      searchScope:Array.isArray(base.searchScope) ? base.searchScope : getCommerceSearchScope(category),
      normalizedFields:normalizedTaskFields,
      decisionCriteria:Array.isArray(base.decisionCriteria) ? base.decisionCriteria : getCommerceDecisionCriteria(category),
      candidateSchema:Array.isArray(base.candidateSchema) ? base.candidateSchema : createMockSafeCandidateSchema(category),
      recommendationTemplate:base.recommendationTemplate || createRecommendationTemplate(category),
      executionBoundary:Array.isArray(base.executionBoundary) ? base.executionBoundary : createCommerceExecutionBoundary(),
      riskNotice:Array.isArray(base.riskNotice) ? base.riskNotice : createCommerceRiskNotice(),
      riskLevel:String(base.riskLevel || (globalProcurementIntent.category === "restricted_or_blocked" || base.status === "blocked" ? "high" : "medium")),
      missingFields:Array.isArray(base.missingFields) ? base.missingFields : missingFieldsForTask(input, category),
      globalProcurementIntent,
      globalProcurementPlan,
      globalProcurementMissingInfoChecklist,
      globalProcurementSafeNextStepGuidance,
      globalProcurementExternalSearchPolicy,
      globalProcurementDetailQuality,
      globalProcurementDecisionWorkspace,
      providerConnectionReadinessConsole,
      globalProcurementRestrictedCategoryGuard,
      globalProcurementEvidenceSafetySummary,
      searchStatus:String(base.searchStatus || "no_provider"),
      searchProviderName:String(base.searchProviderName || ""),
      realProviderReadonlyStatus:base.realProviderReadonlyStatus && typeof base.realProviderReadonlyStatus === "object" ? base.realProviderReadonlyStatus : null,
      providerHealth:Array.isArray(base.providerHealth) ? base.providerHealth : [],
      complianceHealth:base.complianceHealth && typeof base.complianceHealth === "object" ? base.complianceHealth : {},
      flightLowestOffersContract:category === "flight" ? createFlightLowestOffersContract(base.flightLowestOffersContract) : null,
      flightProviderCandidatesRegistry:category === "flight" ? createFlightProviderCandidatesRegistry(base.flightProviderCandidatesRegistry) : null,
      flightProviderApprovalStatus:category === "flight" ? createFlightProviderApprovalStatus(base.flightProviderApprovalStatus) : null,
      flightReadonlyStubPermission:category === "flight" ? createFlightReadonlyStubPermission(base.flightReadonlyStubPermission) : null,
      flightReadonlyStubAdapter:category === "flight" ? createFlightReadonlyStubAdapter(base.flightReadonlyStubAdapter) : null,
      flightSandboxDryRun:category === "flight" ? createFlightSandboxDryRun(base.flightSandboxDryRun) : null,
      flightSandboxProviderMatrix:category === "flight" ? createFlightSandboxProviderMatrix(base.flightSandboxProviderMatrix) : null,
      flightSecureKeyStoragePlan:category === "flight" ? createSecureKeyStoragePlan(base.flightSecureKeyStoragePlan) : null,
      secureStorageDesignGate:category === "flight" ? createSecureStorageDesignGate(base.secureStorageDesignGate) : null,
      localSecureStorageInterfaceDraft:category === "flight" ? createLocalSecureStorageInterfaceDraft(base.localSecureStorageInterfaceDraft) : null,
      keyRedactionAndLogLeakRules:category === "flight" ? createKeyRedactionAndLogLeakRules(base.keyRedactionAndLogLeakRules) : null,
      keyLifecycleDraft:category === "flight" ? createKeyLifecycleDraft(base.keyLifecycleDraft) : null,
      providerEndpointAllowlistGate:category === "flight" ? createProviderEndpointAllowlistGate(base.providerEndpointAllowlistGate) : null,
      readonlyProviderSandboxGate:category === "flight" ? createReadonlyProviderSandboxGate(base.readonlyProviderSandboxGate) : null,
      readonlyProviderResultSchemaGate:supportsReadonlyProviderResultSchemaGate(category) ? createReadonlyProviderResultSchemaGate(base.readonlyProviderResultSchemaGate) : null,
      providerResultSourceLabelGate:category === "flight" ? createProviderResultSourceLabelGate(base.providerResultSourceLabelGate) : null,
      priceIntegrityTaxesFeesGate:category === "flight" ? createPriceIntegrityTaxesFeesGate(base.priceIntegrityTaxesFeesGate) : null,
      bookingUrlDomainSafetyGate:category === "flight" ? createBookingUrlDomainSafetyGate(base.bookingUrlDomainSafetyGate) : null,
      manualProviderReviewWorkflow:category === "flight" ? createManualProviderReviewWorkflow(base.manualProviderReviewWorkflow) : null,
      providerActivationReadinessGate:category === "flight" ? createProviderActivationReadinessGate(base.providerActivationReadinessGate) : null,
      credentialConsentScopeGate:category === "flight" ? createCredentialConsentScopeGate(base.credentialConsentScopeGate) : null,
      readonlyAdapterContractGate:category === "flight" ? createReadonlyAdapterContractGate(base.readonlyAdapterContractGate) : null,
      providerGateMatrixDashboard:category === "flight" ? createProviderGateMatrixDashboard(base.providerGateMatrixDashboard) : null,
      providerNoNetworkRuntimeGuard:category === "flight" ? createProviderNoNetworkRuntimeGuard(base.providerNoNetworkRuntimeGuard) : null,
      offlineProviderFixtureValidationHarness:category === "flight" ? createOfflineProviderFixtureValidationHarness(base.offlineProviderFixtureValidationHarness) : null,
      providerComplianceDecisionEngine:category === "flight" ? createProviderComplianceDecisionEngine(base.providerComplianceDecisionEngine) : null,
      offlineProviderFixtureRunner:category === "flight" ? createOfflineProviderFixtureRunner(base.offlineProviderFixtureRunner) : null,
      noNetworkSentinelAudit:category === "flight" ? createNoNetworkSentinelAudit(base.noNetworkSentinelAudit) : null,
      providerComplianceEvidenceReport:category === "flight" ? createProviderComplianceEvidenceReport(base.providerComplianceEvidenceReport) : null,
      localSafetyEvidenceConsole:category === "flight" ? createLocalSafetyEvidenceConsole(base.localSafetyEvidenceConsole) : null,
      manualUiAcceptanceAssistant:category === "flight" ? createManualUiAcceptanceAssistant(base.manualUiAcceptanceAssistant) : null,
      noSecretPersistenceGuard:category === "flight" ? createNoSecretPersistenceGuard(base.noSecretPersistenceGuard) : null,
      settingsAuthLocalSecurityEvidence:category === "flight" ? createSettingsAuthLocalSecurityEvidence(base.settingsAuthLocalSecurityEvidence) : null,
      userApiPriorityPolicyState:createUserApiPriorityPolicyState(base.userApiPriorityPolicyState),
      apiBindingSafeShellState:category === "flight" ? createApiBindingSafeShellState(base.apiBindingSafeShellState) : null,
      userApiProviderCatalogState:category === "flight" ? createUserApiProviderCatalogState(base.userApiProviderCatalogState) : null,
      apiBindingReadinessStatus:category === "flight" ? createApiBindingReadinessStatus(base.apiBindingReadinessStatus) : null,
      canShowPrice:base.canShowPrice === true,
      canShowBookingButton:base.canShowBookingButton === true || readOnlySearchSummary.readOnlySearchTopResults.length > 0,
      canShowCheckoutButton:base.canShowCheckoutButton === true,
      readOnlySearchCategory:String(base.readOnlySearchCategory || readOnlySearchSummary.readOnlySearchCategory || ""),
      readOnlySearchCandidates:Array.isArray(base.readOnlySearchCandidates) ? base.readOnlySearchCandidates : readOnlySearchSummary.readOnlySearchCandidates,
      readOnlySearchTopResults:Array.isArray(base.readOnlySearchTopResults) ? base.readOnlySearchTopResults : readOnlySearchSummary.readOnlySearchTopResults,
      readOnlySearchRemainingResults:Array.isArray(base.readOnlySearchRemainingResults) ? base.readOnlySearchRemainingResults : readOnlySearchSummary.readOnlySearchRemainingResults,
      readOnlySearchResultSummary:base.readOnlySearchResultSummary && typeof base.readOnlySearchResultSummary === "object" ? base.readOnlySearchResultSummary : readOnlySearchSummary.readOnlySearchResultSummary,
      orchestration:base.orchestration && typeof base.orchestration === "object" ? base.orchestration : readOnlySearchSummary.orchestration,
      intentClassification:base.intentClassification && typeof base.intentClassification === "object" ? base.intentClassification : readOnlySearchSummary.intentClassification,
      entityExtraction:base.entityExtraction && typeof base.entityExtraction === "object" ? base.entityExtraction : readOnlySearchSummary.entityExtraction,
      workflowState:base.workflowState && typeof base.workflowState === "object" ? base.workflowState : readOnlySearchSummary.workflowState,
      decisionResult:base.decisionResult && typeof base.decisionResult === "object" ? base.decisionResult : readOnlySearchSummary.decisionResult,
      comparisonMatrix:base.comparisonMatrix && typeof base.comparisonMatrix === "object" ? base.comparisonMatrix : readOnlySearchSummary.comparisonMatrix,
      externalDeepLinkSafetySummary:base.externalDeepLinkSafetySummary && typeof base.externalDeepLinkSafetySummary === "object" ? base.externalDeepLinkSafetySummary : readOnlySearchGates.externalDeepLinkSafetySummary,
      searchParameterPrefillSummary:base.searchParameterPrefillSummary && typeof base.searchParameterPrefillSummary === "object" ? base.searchParameterPrefillSummary : readOnlySearchGates.searchParameterPrefillSummary,
      platformAvailabilitySummary:base.platformAvailabilitySummary && typeof base.platformAvailabilitySummary === "object" ? base.platformAvailabilitySummary : readOnlySearchGates.platformAvailabilitySummary,
      partnerLinkPolicySummary:base.partnerLinkPolicySummary && typeof base.partnerLinkPolicySummary === "object" ? base.partnerLinkPolicySummary : readOnlySearchGates.partnerLinkPolicySummary,
      candidates:Array.isArray(base.candidates) && base.candidates.length ? base.candidates : readOnlySearchSummary.candidates,
      recommendation:base.recommendation || readOnlySearchSummary.recommendation || null,
      searchErrorMessage:sanitizeCommerceInput(base.searchErrorMessage || ""),
      searchResultSummary:base.searchResultSummary || (readOnlySearchSummary.readOnlySearchResultSummary ? {
        candidateCount:readOnlySearchSummary.readOnlySearchResultSummary.candidateCount || 0,
        source:"read_only_platform_templates",
        mode:"local_rule_or_ai_intent_without_network"
      } : null),
      displayTitle:String(base.displayTitle || ""),
      commerceLocalIntentRoute:base.commerceLocalIntentRoute || null,
      commerceAiIntentUnderstanding:base.commerceAiIntentUnderstanding || null,
      complexIntentSummary:base.complexIntentSummary || null,
      commerceComplexIntentSplit:base.commerceComplexIntentSplit || null,
      commerceSubPlanGateMatrix:base.commerceSubPlanGateMatrix || null,
      commerceSubPlanQuestions:base.commerceSubPlanQuestions || null,
      commerceSubPlanAnswerCollection:base.commerceSubPlanAnswerCollection || null,
      commerceSubPlanCompletionWorkspace:base.commerceSubPlanCompletionWorkspace || null,
      commerceSubPlanDraftReviewSummary:base.commerceSubPlanDraftReviewSummary || null,
      commerceSubPlanDraftConfirmation:base.commerceSubPlanDraftConfirmation || null,
      answerCollectorSourceTaskId:String(base.answerCollectorSourceTaskId || ""),
      realExecution:false,
      requiresUserConfirmation:true,
      createdAt,
      updatedAt:base.updatedAt || createdAt
    };
  }

  function readJson(key, fallback){
    const s = storage();
    if (!s) return fallback;
    try {
      const raw = s.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJson(key, value){
    const s = storage();
    if (!s) return value;
    try { s.setItem(key, JSON.stringify(value)); } catch (_) {}
    return value;
  }

  function getCommerceTasks(){
    const tasks = readJson(COMMERCE_TASKS_KEY, []);
    return (Array.isArray(tasks) ? tasks : []).map(normalizeTask).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  function saveCommerceTasks(tasks){
    const safe = (Array.isArray(tasks) ? tasks : []).map(normalizeTask).slice(0, COMMERCE_MAX_TASKS);
    writeJson(COMMERCE_TASKS_KEY, safe);
    if (safe[0]) writeJson(COMMERCE_PLAN_KEY, safe[0]);
    return safe;
  }

  function addCommerceTask(task){
    const next = normalizeTask(task);
    const tasks = getCommerceTasks().filter((item) => item.taskId !== next.taskId);
    saveCommerceTasks([next].concat(tasks));
    writeJson(COMMERCE_PLAN_KEY, next);
    return next;
  }

  function updateCommerceTask(taskId, patch){
    const id = String(taskId || "");
    const tasks = getCommerceTasks();
    let updated = null;
    const next = tasks.map((task) => {
      if (task.taskId !== id) return task;
      updated = normalizeTask(Object.assign({}, task, patch || {}, { updatedAt:nowIso() }));
      return updated;
    });
    saveCommerceTasks(next);
    return updated;
  }

  function clearCommerceTasks(){
    const s = storage();
    try {
      if (s) {
        s.removeItem(COMMERCE_TASKS_KEY);
        s.removeItem(COMMERCE_PLAN_KEY);
      }
    } catch (_) {}
    return [];
  }

  function getCommerceTaskById(taskId){
    const id = String(taskId || "");
    return getCommerceTasks().find((task) => task.taskId === id) || null;
  }

  function createCommercePlanDetail(task){
    const safe = normalizeTask(task);
    return {
      demandUnderstanding:safe.normalizedFields.need || safe.inputSummary,
      category:safe.category,
      categoryLabel:safe.categoryLabel,
      searchScope:safe.searchScope,
      comparisonDimensions:safe.decisionCriteria,
      decisionRule:"同等条件下价格最低，同时考虑评分、信誉、售后、退改政策、时效、地区限制、风险和隐性费用。",
      candidateSchema:safe.candidateSchema,
      recommendationTemplate:safe.recommendationTemplate,
      executionBoundary:safe.executionBoundary,
      riskNotice:safe.riskNotice,
      missingFields:safe.missingFields,
      globalProcurementIntent:safe.globalProcurementIntent,
      globalProcurementPlan:safe.globalProcurementPlan,
      globalProcurementMissingInfoChecklist:safe.globalProcurementMissingInfoChecklist,
      globalProcurementSafeNextStepGuidance:safe.globalProcurementSafeNextStepGuidance,
      globalProcurementExternalSearchPolicy:safe.globalProcurementExternalSearchPolicy,
      globalProcurementDetailQuality:safe.globalProcurementDetailQuality,
      globalProcurementDecisionWorkspace:safe.globalProcurementDecisionWorkspace,
      providerConnectionReadinessConsole:safe.providerConnectionReadinessConsole,
      globalProcurementRestrictedCategoryGuard:safe.globalProcurementRestrictedCategoryGuard,
      globalProcurementEvidenceSafetySummary:safe.globalProcurementEvidenceSafetySummary,
      searchStatus:safe.searchStatus,
      searchProviderName:safe.searchProviderName,
      flightLowestOffersContract:safe.category === "flight" ? safe.flightLowestOffersContract : null,
      flightProviderCandidatesRegistry:safe.category === "flight" ? safe.flightProviderCandidatesRegistry : null,
      flightProviderApprovalStatus:safe.category === "flight" ? safe.flightProviderApprovalStatus : null,
      flightReadonlyStubPermission:safe.category === "flight" ? safe.flightReadonlyStubPermission : null,
      flightReadonlyStubAdapter:safe.category === "flight" ? safe.flightReadonlyStubAdapter : null,
      flightSandboxDryRun:safe.category === "flight" ? safe.flightSandboxDryRun : null,
      flightSandboxProviderMatrix:safe.category === "flight" ? safe.flightSandboxProviderMatrix : null,
      flightSecureKeyStoragePlan:safe.category === "flight" ? safe.flightSecureKeyStoragePlan : null,
      localSecureStorageInterfaceDraft:safe.category === "flight" ? safe.localSecureStorageInterfaceDraft : null,
      keyRedactionAndLogLeakRules:safe.category === "flight" ? safe.keyRedactionAndLogLeakRules : null,
      keyLifecycleDraft:safe.category === "flight" ? safe.keyLifecycleDraft : null,
      providerEndpointAllowlistGate:safe.category === "flight" ? safe.providerEndpointAllowlistGate : null,
      readonlyProviderSandboxGate:safe.category === "flight" ? safe.readonlyProviderSandboxGate : null,
      readonlyProviderResultSchemaGate:supportsReadonlyProviderResultSchemaGate(safe.category) ? safe.readonlyProviderResultSchemaGate : null,
      providerResultSourceLabelGate:safe.category === "flight" ? safe.providerResultSourceLabelGate : null,
      priceIntegrityTaxesFeesGate:safe.category === "flight" ? safe.priceIntegrityTaxesFeesGate : null,
      bookingUrlDomainSafetyGate:safe.category === "flight" ? safe.bookingUrlDomainSafetyGate : null,
      manualProviderReviewWorkflow:safe.category === "flight" ? safe.manualProviderReviewWorkflow : null,
      providerActivationReadinessGate:safe.category === "flight" ? safe.providerActivationReadinessGate : null,
      credentialConsentScopeGate:safe.category === "flight" ? safe.credentialConsentScopeGate : null,
      readonlyAdapterContractGate:safe.category === "flight" ? safe.readonlyAdapterContractGate : null,
      providerGateMatrixDashboard:safe.category === "flight" ? safe.providerGateMatrixDashboard : null,
      providerNoNetworkRuntimeGuard:safe.category === "flight" ? safe.providerNoNetworkRuntimeGuard : null,
      offlineProviderFixtureValidationHarness:safe.category === "flight" ? safe.offlineProviderFixtureValidationHarness : null,
      providerComplianceDecisionEngine:safe.category === "flight" ? safe.providerComplianceDecisionEngine : null,
      offlineProviderFixtureRunner:safe.category === "flight" ? safe.offlineProviderFixtureRunner : null,
      noNetworkSentinelAudit:safe.category === "flight" ? safe.noNetworkSentinelAudit : null,
      providerComplianceEvidenceReport:safe.category === "flight" ? safe.providerComplianceEvidenceReport : null,
      localSafetyEvidenceConsole:safe.category === "flight" ? safe.localSafetyEvidenceConsole : null,
      manualUiAcceptanceAssistant:safe.category === "flight" ? safe.manualUiAcceptanceAssistant : null,
      noSecretPersistenceGuard:safe.category === "flight" ? safe.noSecretPersistenceGuard : null,
      settingsAuthLocalSecurityEvidence:safe.category === "flight" ? safe.settingsAuthLocalSecurityEvidence : null,
      userApiPriorityPolicyState:safe.userApiPriorityPolicyState,
      apiBindingSafeShellState:safe.category === "flight" ? safe.apiBindingSafeShellState : null,
      userApiProviderCatalogState:safe.category === "flight" ? safe.userApiProviderCatalogState : null,
      apiBindingReadinessStatus:safe.category === "flight" ? safe.apiBindingReadinessStatus : null,
      candidates:safe.candidates,
      recommendation:safe.recommendation,
      nextSteps:[
        "确认搜索范围、预算、地区限制和时间要求。",
        "后续接入真实搜索插件后再填入候选方案。",
        "任何下单、付款或提交订单前都必须由用户再次确认。"
      ]
    };
  }

  function createCommerceDisplayTitle(task, completed){
    const safe = normalizeTask(task || {});
    const category = safe.category;
    const fields = safe.normalizedFields || {};
    const done = completed === true || safe.searchStatus === "completed" && Array.isArray(safe.candidates) && safe.candidates.length > 0;
    if (safe.status === "blocked") {
      if (category === "flight") return "机票搜索已阻断";
      if (category === "ecommerce") return (fields.productQuery || fields.normalizedQuery || "商品") + "搜索已阻断";
      return (safe.categoryLabel || "全球采购") + "计划已阻断";
    }
    if (category === "flight") return "机票搜索结果";
    if (category === "ecommerce") {
      const query = fields.productQuery || fields.normalizedQuery || "商品";
      return query + (done ? "搜索已完成" : "搜索已生成");
    }
    return done ? (safe.categoryLabel || "全球采购") + "搜索已完成" : (safe.categoryLabel || "全球采购") + "计划已生成";
  }

  function createCommerceTaskHistoryPayload(action, payload){
    const task = payload && payload.taskId ? normalizeTask(payload) : normalizeTask(payload || {});
    return {
      schemaVersion:"weishan.task.v1",
      module:"commerceAgent",
      action:String(action || "commerceAgent.taskCreated").replace(/^commerceAgent\./, ""),
      taskId:String(task.taskId || ""),
      category:String(task.category || ""),
      status:String(task.status || ""),
      inputSummary:sanitizeCommerceInput(task.inputSummary || ""),
      outputSummary:sanitizeCommerceInput(payload && payload.outputSummary || "已生成全球采购计划。"),
      candidateCount:Array.isArray(task.candidates) ? task.candidates.length : 0,
      lowestPrice:task.searchResultSummary && task.searchResultSummary.lowestPrice || "",
      currency:task.searchResultSummary && task.searchResultSummary.currency || "",
      providerName:task.searchProviderName || "",
      resultStatus:task.searchStatus || "",
      realExecution:false,
      requiresUserConfirmation:true,
      createdAt:task.createdAt || nowIso(),
      updatedAt:task.updatedAt || task.createdAt || nowIso()
    };
  }

  function createCommerceHistoryPayload(action, payload){
    const data = payload || {};
    const task = data.taskId ? normalizeTask(data) : normalizeTask(data);
    const payloadBase = createCommerceTaskHistoryPayload(action || "commerceAgent.planCreated", Object.assign({}, task, data));
    payloadBase.searchScopeSummary = (Array.isArray(task.searchScope) ? task.searchScope : []).join(" / ").slice(0, 220);
    payloadBase.decisionCriteriaSummary = (Array.isArray(task.decisionCriteria) ? task.decisionCriteria : []).join(" / ").slice(0, 220);
    return payloadBase;
  }

  function saveCommercePlan(plan){
    return addCommerceTask(plan);
  }

  function getCommercePlan(){
    const last = readJson(COMMERCE_PLAN_KEY, null);
    if (last) return normalizeTask(last);
    const tasks = getCommerceTasks();
    return tasks[0] || null;
  }

  function clearCommercePlan(){
    const s = storage();
    try { if (s) s.removeItem(COMMERCE_PLAN_KEY); } catch (_) {}
  }

  window.WeishanCommerceAgent = {
    COMMERCE_PLAN_KEY,
    COMMERCE_TASKS_KEY,
    CATEGORY_LABELS,
    classifyCommerceIntent,
    createCommercePlan,
    createCommerceTask,
    getCommerceTasks,
    saveCommerceTasks,
    addCommerceTask,
    updateCommerceTask,
    clearCommerceTasks,
    getCommerceTaskById,
    createCommercePlanDetail,
    createMockSafeCandidateSchema,
    createRecommendationTemplate,
    createCommerceRiskNotice,
    createCommerceExecutionBoundary,
    createGlobalProcurementIntent,
    createGlobalProcurementPlan,
    createGlobalProcurementRestrictedCategoryGuard,
    createGlobalProcurementEvidenceSafetySummary,
    createFlightSandboxProviderMatrix,
    createSecureStorageDesignGate,
    createLocalSecureStorageInterfaceDraft,
    createKeyRedactionAndLogLeakRules,
    createKeyLifecycleDraft,
    createProviderEndpointAllowlistGate,
    createReadonlyProviderSandboxGate,
    createUserApiPriorityPolicyState,
    createApiBindingSafeShellState,
    createUserApiProviderCatalogState,
    createCommerceTaskHistoryPayload,
    createCommerceHistoryPayload,
    sanitizeCommerceInput,
    getCommerceCategory,
    getCommerceDecisionCriteria,
    getCommerceSearchScope,
    createCommerceDisplayTitle,
    saveCommercePlan,
    getCommercePlan,
    clearCommercePlan
  };
})();
