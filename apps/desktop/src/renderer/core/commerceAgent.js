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
      contractVersion:"2.0.80",
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
        summaryTitle:"机票搜索条件已整理",
        currentStatusLine:"当前状态：未接入真实机票价格源，暂不能返回实时价格。",
        priceStateLine:"价格状态：暂未接入真实机票价格源，当前不能显示最低价两家。",
        futureLine:"接入真实只读价格源后，weishan 会只展示通过安全检查的最低价前 2 家。最终价格、库存、出票规则和付款以外部平台为准。"
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
      contractVersion:"2.0.80",
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
      approvalVersion:"2.0.80",
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
      permissionVersion:"2.0.80",
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
      adapterVersion:"2.0.80",
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
    if (/酒店|民宿|住宿|Hotel/i.test(raw)) return "hotel";
    if (/机票|航班|飞机票|航空票|订机票|预定机票|预订机票|买机票|订票|flight/i.test(raw)) return "flight";
    if (/(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}月\d{1,2}日|今天|明天|后天|下周[一二三四五六日天]?|周[一二三四五六日天]).{0,20}[\u4e00-\u9fa5A-Za-z]{2,24}\s*(?:飞往|飞|到|去)\s*[\u4e00-\u9fa5A-Za-z]{2,24}/i.test(raw)) return "flight";
    if (/[\u4e00-\u9fa5A-Za-z]{2,24}\s*(?:飞往|飞|到|去)\s*[\u4e00-\u9fa5A-Za-z]{2,24}.{0,20}(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}月\d{1,2}日|今天|明天|后天|下周[一二三四五六日天]?|周[一二三四五六日天])/i.test(raw)) return "flight";
    if (/火车票|高铁票|动车票|train/i.test(raw)) return "train";
    if (/OpenRouter|ChatGPT|API|SaaS|模型|model|订阅|会员|AI 平台|AI模型/i.test(raw)) return "aiModelPricing";
    if (/门票|演唱会|展览|票务|ticket/i.test(raw)) return "ticketing";
    if (/预约|保洁|维修|咨询|service/i.test(raw)) return "serviceBooking";
    if (/域名|domain/i.test(raw)) return "domain";
    if (/MacBook|iPhone|华为|苹果|电脑|手机|商品|电商|买|购买|采购|purchase|shopping/i.test(raw)) return "ecommerce";
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
      /(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}月\d{1,2}日|今天|明天|后天|下周[一二三四五六日天]?|周[一二三四五六日天]).{0,20}[\u4e00-\u9fa5A-Za-z]{2,24}\s*(?:飞往|飞|到|去)\s*[\u4e00-\u9fa5A-Za-z]{2,24}/i.test(raw) ||
      /[\u4e00-\u9fa5A-Za-z]{2,24}\s*(?:飞往|飞|到|去)\s*[\u4e00-\u9fa5A-Za-z]{2,24}.{0,20}(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}月\d{1,2}日|今天|明天|后天|下周[一二三四五六日天]?|周[一二三四五六日天])/i.test(raw)
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
    if (side === "origin") next = next.replace(/.*?(?:\d{1,2}月\d{1,2}日|今天|明天|后天|下周[一二三四五六日天]?|周[一二三四五六日天])/, "");
    next = next
      .replace(/^(帮我|请|想|我要|需要|找|买|购买|订|预定|预订|订票|买票|从|出发|低价|最便宜|的)+/g, "")
      .replace(/(机票|飞机票|航空票|航班|酒店|住宿|火车票|高铁票|邮轮|游轮|公务机|私人飞机|包机|商品|电商|低价|最便宜|的).*$/g, "")
      .trim();
    return sanitizeCommerceInput(next).slice(0, 40);
  }

  function extractCommerceFields(text){
    const raw = String(text || "");
    const datePattern = "(\\d{4}[-/]\\d{1,2}[-/]\\d{1,2}|\\d{1,2}月\\d{1,2}日|今天|明天|后天|下周[一二三四五六日天]?|周[一二三四五六日天])";
    const placePattern = "([\\u4e00-\\u9fa5A-Za-z]{2,24})";
    const dateMatch = raw.match(new RegExp(datePattern));
    let routeMatch = raw.match(new RegExp(datePattern + "\\s*" + placePattern + "\\s*(?:到|飞往|飞|去)\\s*" + placePattern, "i"));
    if (routeMatch) {
      return {
        originText:cleanPlaceName(routeMatch[2], "origin"),
        destinationText:cleanPlaceName(routeMatch[3], "destination"),
        dateText:routeMatch[1] || ""
      };
    }
    routeMatch = raw.match(new RegExp(placePattern + "\\s*(?:到|飞往|飞|去)\\s*" + placePattern + "\\s*" + datePattern, "i"));
    if (routeMatch) {
      return {
        originText:cleanPlaceName(routeMatch[1], "origin"),
        destinationText:cleanPlaceName(routeMatch[2], "destination"),
        dateText:routeMatch[3] || ""
      };
    }
    routeMatch = raw.match(/([\u4e00-\u9fa5A-Za-z]{2,24})\s*(?:到|飞往|飞|去)\s*([\u4e00-\u9fa5A-Za-z]{2,24})/);
    return {
      originText:routeMatch ? cleanPlaceName(routeMatch[1], "origin") : "",
      destinationText:routeMatch ? cleanPlaceName(routeMatch[2], "destination") : "",
      dateText:dateMatch && dateMatch[1] || ""
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

  function normalizedFields(text, category){
    const fields = extractCommerceFields(text);
    return {
      need:sanitizeCommerceInput(text),
      category,
      categoryLabel:CATEGORY_LABELS[category] || CATEGORY_LABELS.generalProcurement,
      originText:fields.originText,
      destinationText:fields.destinationText,
      dateText:fields.dateText,
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
    if (/^(flight|train|hotel)$/.test(category) && !/(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}月\d{1,2}日|今天|明天|后天|下周|周[一二三四五六日天])/.test(raw)) {
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

  function taskStatusFromText(text){
    return /直接下单|下单并付款|支付|付款|自动付款|提交订单|提交.*询价表|提交.*询价|上传.*(?:护照|身份证)|(?:护照|身份证).*(?:预订|预定|订|上传)/i.test(String(text || "")) ? "blocked" : "planned";
  }

  function createCommerceTask(input){
    const clean = sanitizeCommerceInput(input);
    const category = getCommerceCategory(clean);
    const status = taskStatusFromText(clean);
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
      normalizedFields:normalizedFields(clean, category),
      decisionCriteria:getCommerceDecisionCriteria(category),
      candidateSchema:createMockSafeCandidateSchema(category),
      recommendationTemplate:createRecommendationTemplate(category),
      executionBoundary:createCommerceExecutionBoundary(),
      riskNotice:createCommerceRiskNotice(),
      riskLevel:status === "blocked" ? "high" : "medium",
      missingFields:missingFieldsForTask(clean, category),
      searchStatus:"no_provider",
      searchProviderName:"",
      providerHealth:[],
      complianceHealth:{},
      flightLowestOffersContract:category === "flight" ? createFlightLowestOffersContract() : null,
      flightProviderCandidatesRegistry:category === "flight" ? createFlightProviderCandidatesRegistry() : null,
      flightProviderApprovalStatus:category === "flight" ? createFlightProviderApprovalStatus() : null,
      flightReadonlyStubPermission:category === "flight" ? createFlightReadonlyStubPermission() : null,
      flightReadonlyStubAdapter:category === "flight" ? createFlightReadonlyStubAdapter() : null,
      canShowPrice:false,
      canShowBookingButton:false,
      canShowCheckoutButton:false,
      candidates:[],
      recommendation:null,
      searchErrorMessage:"",
      searchResultSummary:null,
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
    const category = base.category || getCommerceCategory(input);
    const createdAt = base.createdAt || nowIso();
    return {
      schemaVersion:base.schemaVersion || "weishan.commerceAgent.task.v1",
      taskId:String(base.taskId || createTaskId()),
      inputSummary:input,
      category,
      categoryLabel:base.categoryLabel || CATEGORY_LABELS[category] || CATEGORY_LABELS.generalProcurement,
      status:String(base.status || taskStatusFromText(input)),
      intent:String(base.intent || "search_compare_recommend_before_confirm"),
      searchScope:Array.isArray(base.searchScope) ? base.searchScope : getCommerceSearchScope(category),
      normalizedFields:base.normalizedFields || normalizedFields(input, category),
      decisionCriteria:Array.isArray(base.decisionCriteria) ? base.decisionCriteria : getCommerceDecisionCriteria(category),
      candidateSchema:Array.isArray(base.candidateSchema) ? base.candidateSchema : createMockSafeCandidateSchema(category),
      recommendationTemplate:base.recommendationTemplate || createRecommendationTemplate(category),
      executionBoundary:Array.isArray(base.executionBoundary) ? base.executionBoundary : createCommerceExecutionBoundary(),
      riskNotice:Array.isArray(base.riskNotice) ? base.riskNotice : createCommerceRiskNotice(),
      riskLevel:String(base.riskLevel || (base.status === "blocked" ? "high" : "medium")),
      missingFields:Array.isArray(base.missingFields) ? base.missingFields : missingFieldsForTask(input, category),
      searchStatus:String(base.searchStatus || "no_provider"),
      searchProviderName:String(base.searchProviderName || ""),
      providerHealth:Array.isArray(base.providerHealth) ? base.providerHealth : [],
      complianceHealth:base.complianceHealth && typeof base.complianceHealth === "object" ? base.complianceHealth : {},
      flightLowestOffersContract:category === "flight" ? createFlightLowestOffersContract(base.flightLowestOffersContract) : null,
      flightProviderCandidatesRegistry:category === "flight" ? createFlightProviderCandidatesRegistry(base.flightProviderCandidatesRegistry) : null,
      flightProviderApprovalStatus:category === "flight" ? createFlightProviderApprovalStatus(base.flightProviderApprovalStatus) : null,
      flightReadonlyStubPermission:category === "flight" ? createFlightReadonlyStubPermission(base.flightReadonlyStubPermission) : null,
      flightReadonlyStubAdapter:category === "flight" ? createFlightReadonlyStubAdapter(base.flightReadonlyStubAdapter) : null,
      canShowPrice:base.canShowPrice === true,
      canShowBookingButton:base.canShowBookingButton === true,
      canShowCheckoutButton:base.canShowCheckoutButton === true,
      candidates:Array.isArray(base.candidates) ? base.candidates : [],
      recommendation:base.recommendation || null,
      searchErrorMessage:sanitizeCommerceInput(base.searchErrorMessage || ""),
      searchResultSummary:base.searchResultSummary || null,
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
      searchStatus:safe.searchStatus,
      searchProviderName:safe.searchProviderName,
      flightLowestOffersContract:safe.category === "flight" ? safe.flightLowestOffersContract : null,
      flightProviderCandidatesRegistry:safe.category === "flight" ? safe.flightProviderCandidatesRegistry : null,
      flightProviderApprovalStatus:safe.category === "flight" ? safe.flightProviderApprovalStatus : null,
      flightReadonlyStubPermission:safe.category === "flight" ? safe.flightReadonlyStubPermission : null,
      flightReadonlyStubAdapter:safe.category === "flight" ? safe.flightReadonlyStubAdapter : null,
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
    if (category === "flight") return done ? "机票搜索已完成" : "机票搜索已生成";
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
