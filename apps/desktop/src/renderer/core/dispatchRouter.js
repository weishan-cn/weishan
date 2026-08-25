(function(){
  const DISPATCH_MODULES = {
    mail:"mail",
    crawler:"crawler",
    softwareFactory:"softwareFactory",
    document:"document",
    ppt:"ppt",
    codex:"codex",
    model:"model",
    chat:"chat",
    desktopAssistant:"desktopAssistant",
    commerceAgent:"commerceAgent",
    coordination:"coordination"
  };

  const DISPATCH_ACTIONS = {
    mailOpen:"mail.open",
    mailSummarize:"mail.summarize",
    mailDraftReply:"mail.draftReply",
    mailExtractTodos:"mail.extractTodos",
    mailTranslate:"mail.translate",
    crawlerOpen:"crawler.open",
    crawlerWebFetch:"crawler.webFetch",
    softwareFactoryOpen:"softwareFactory.open",
    softwareFactoryGeneratePlan:"softwareFactory.generatePlan",
    documentGenerateDraft:"document.generateDraft",
    pptGenerateOutline:"ppt.generateOutline",
    codexGenerateInstruction:"codex.generateInstruction",
    chatAnswer:"chat.answer",
    chatMockAnswer:"chat.mockAnswer",
    chatAnswered:"chat.answered",
    modelStatus:"model.status",
    modelSelect:"model.select",
    desktopAssistantPlan:"desktopAssistant.plan",
    desktopAssistantPaused:"desktopAssistant.paused",
    commerceAgentPlan:"commerceAgent.plan",
    coordinationPlan:"coordination.plan"
  };
  const MODEL_SELECTION_KEY = "weishan:model:selected:v1";
  const AVAILABLE_MODELS = [
    {
      id:"weishan-auto",
      name:"weishan 自动选择",
      provider:"weishan",
      mode:"gateway_required",
      description:"由 weishan 根据任务类型选择合适模型或模块；普通问答需要后端 AI 网关接通。"
    },
    {
      id:"gpt-compatible",
      name:"GPT-compatible",
      provider:"model_gateway",
      mode:"not_connected",
      description:"未来可由 weishan API 层接入，客户端不保存 provider key。"
    },
    {
      id:"claude-compatible",
      name:"Claude-compatible",
      provider:"model_gateway",
      mode:"not_connected",
      description:"未来可由 weishan API 层接入，客户端不保存 provider key。"
    },
    {
      id:"gemini-compatible",
      name:"Gemini-compatible",
      provider:"model_gateway",
      mode:"not_connected",
      description:"未来可由 weishan API 层接入，客户端不保存 provider key。"
    },
    {
      id:"local-model",
      name:"本地模型",
      provider:"local",
      mode:"not_connected",
      description:"未来可接本地模型服务。"
    }
  ];
  const DISPATCH_STATUS = {
    pending:"pending",
    prefilled:"prefilled",
    confirmed:"confirmed",
    executed:"executed",
    failed:"failed",
    cancelled:"cancelled"
  };
  const DISPATCH_HISTORY_ACTIONS = {
    pending:"dispatch.pending",
    confirmed:"dispatch.confirmed",
    executed:"dispatch.executed",
    failed:"dispatch.failed",
    cancelled:"dispatch.cancelled"
  };
  const PENDING_DISPATCH_KEY = "weishan:dispatch:pending:v1";

  const MODULE_KEYWORDS = [
    { module:"mail", keywords:[/邮件|邮箱|收件箱|回复邮件|总结邮件|提取待办|翻译邮件/i, /\b(mail|email|inbox|reply)\b/i] },
    { module:"crawler", keywords:[/抓取|网页|网址|链接|爬取/i, /\b(URL|crawler|fetch|scrape)\b/i, /https?:\/\//i] },
    { module:"softwareFactory", keywords:[/软件|工具|系统|桌面工具|生成软件|软件工厂|应用/i, /\b(software|factory|app)\b/i] },
    { module:"ppt", keywords:[/PPT|幻灯片|演示|路演/i, /\b(slide|slides|presentation|deck)\b/i] },
    { module:"codex", keywords:[/Codex|给\s*Codex|精确指令|开发指令|修复指令|测试指令/i] },
    { module:"document", keywords:[/文档|合同|协议|报告|说明书|计划书|合作协议/i, /\b(memo|document|doc|report|proposal)\b/i] }
  ];

  function redactDispatchText(text){
    return String(text || "")
      .replace(/(bearer|authorization|api[-_ ]?key|token|password|secret|cookie|providerBody|provider body)\s*[:=]\s*[^,\s;]+/gi, "$1=[redacted]")
      .replace(/sk-[A-Za-z0-9._-]+/g, "sk-[redacted]");
  }

  function sanitizeDispatchText(text){
    return redactDispatchText(text)
      .replace(/\s+/g, " ")
      .trim();
  }

  function summarizeDispatchText(text, maxLength){
    const clean = sanitizeDispatchText(text);
    const max = Number(maxLength || 160);
    return clean.length > max ? clean.slice(0, max).trim() + "..." : clean;
  }

  function hasKeyword(text, item){
    return item.keywords.some((pattern) => pattern.test(text));
  }

  function detectModules(text){
    return MODULE_KEYWORDS.filter((item) => hasKeyword(text, item)).map((item) => item.module);
  }

  function modelKeyword(text){
    return /模型|GPT|Claude|Gemini|DeepSeek|Qwen|通义|Kimi|本地模型|切换模型|选择模型|\bmodel\b/i.test(String(text || ""));
  }

  function modelAction(text){
    const raw = String(text || "");
    if (/切换|选择|使用|换到|switch|select|use/i.test(raw)) return DISPATCH_ACTIONS.modelSelect;
    return DISPATCH_ACTIONS.modelStatus;
  }

  function desktopAssistantApi(){
    return window.WeishanDesktopAssistant || null;
  }

  function commerceAgentApi(){
    return window.WeishanCommerceAgent || null;
  }

  function commerceLocalIntentRouterApi(){
    return window.WeishanCommerceLocalIntentRouter || null;
  }

  function commerceComplexIntentSplitPlannerApi(){
    return window.WeishanCommerceComplexIntentSplitPlanner || null;
  }
  function commerceSubPlanGateMatrixApi(){
    return window.WeishanCommerceSubPlanGateMatrix || null;
  }
  function commerceSubPlanQuestionGeneratorApi(){
    return window.WeishanCommerceSubPlanQuestionGenerator || null;
  }
  function commerceSubPlanAnswerCollectorApi(){
    return window.WeishanCommerceSubPlanAnswerCollector || null;
  }
  function commerceSubPlanCompletionWorkspaceApi(){
    return window.WeishanCommerceSubPlanCompletionWorkspace || null;
  }
  function commerceSubPlanDraftReviewSummaryApi(){
    return window.WeishanCommerceSubPlanDraftReviewSummary || null;
  }
  function commerceSubPlanDraftConfirmationApi(){
    return window.WeishanCommerceSubPlanDraftConfirmation || null;
  }

  function applyComplexCommerceLocalIntent(commercePlan, route){
    if (!commercePlan || !route || route.aiFallbackRequired !== true) return commercePlan;
    const protectedCategories = new Set(["cruise", "privateJet", "train", "domain", "aiModelPricing"]);
    const map = {
      multi_category_travel:"复合旅行计划",
      complex_product:"复杂商品采购",
      general_commerce:"多类别全球采购"
    };
    if (!protectedCategories.has(commercePlan.category)) {
      commercePlan.categoryLabel = map[route.intentCategory] || commercePlan.categoryLabel || "多类别全球采购";
    }
    commercePlan.commerceAiIntentUnderstanding = route.commerceAiIntentUnderstanding || {};
    commercePlan.complexIntentSummary = {
      categories:route.categories || [],
      destination:route.destination || "",
      timeHint:route.timeHint || "",
      travelerHint:route.travelerHint || "",
      budgetHint:route.budgetHint || "",
      optimizationGoal:route.optimizationGoal || "",
      useCaseHint:route.useCaseHint || ""
    };
    return commercePlan;
  }

  function attachComplexCommerceSplit(commercePlan, input, route){
    if (!commercePlan) return commercePlan;
    const planner = commerceComplexIntentSplitPlannerApi();
    if (planner && planner.splitComplexCommerceIntent) {
      commercePlan.commerceComplexIntentSplit = planner.splitComplexCommerceIntent(input, route || commercePlan.commerceLocalIntentRoute || null);
    }
    return commercePlan;
  }

  function attachSubPlanGateMatrix(commercePlan){
    if (!commercePlan || !commercePlan.commerceComplexIntentSplit) return commercePlan;
    const matrix = commerceSubPlanGateMatrixApi();
    if (matrix && matrix.buildSubPlanGateMatrix) {
      commercePlan.commerceSubPlanGateMatrix = matrix.buildSubPlanGateMatrix(commercePlan.commerceComplexIntentSplit, commercePlan.providerHealth || null);
    }
    return commercePlan;
  }

  function attachSubPlanQuestions(commercePlan){
    if (!commercePlan || !commercePlan.commerceSubPlanGateMatrix) return commercePlan;
    const generator = commerceSubPlanQuestionGeneratorApi();
    if (generator && generator.generateQuestionsForSubPlanMatrix) {
      commercePlan.commerceSubPlanQuestions = generator.generateQuestionsForSubPlanMatrix(commercePlan.commerceSubPlanGateMatrix);
    }
    return commercePlan;
  }

  function latestQuestionCommercePlan(){
    const api = commerceAgentApi();
    if (!api || !api.getCommerceTasks) return null;
    return (api.getCommerceTasks() || []).find((task) => task && task.commerceSubPlanQuestions && Array.isArray(task.commerceSubPlanQuestions.subPlanQuestionGroups)) || null;
  }

  function latestDraftReviewCommercePlan(){
    const api = commerceAgentApi();
    if (!api || !api.getCommerceTasks) return null;
    return (api.getCommerceTasks() || []).find((task) => task && (task.commerceSubPlanDraftConfirmation || task.commerceSubPlanDraftReviewSummary)) || null;
  }

  function hasCollectedSubPlanAnswers(answerCollection){
    return Boolean(answerCollection && Number(answerCollection.completedFieldCount || 0) > 0);
  }

  function cloneDispatchValue(value){
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function looksLikeSubPlanDraftConfirmationOrRevision(text){
    return /确认|没问题|这样可以|都确认|先不确认|改成|修改|调整|修正|更正|品牌优先|内存至少|硬盘至少|不要转机|优先直飞/i.test(String(text || ""));
  }

  function ensureDraftReviewContextForConfirmation(commercePlan, input){
    if (!commercePlan || !looksLikeSubPlanDraftConfirmationOrRevision(input)) return commercePlan;
    const previousPlan = latestDraftReviewCommercePlan();
    if (!previousPlan) return commercePlan;
    commercePlan.commerceComplexIntentSplit = cloneDispatchValue(previousPlan.commerceComplexIntentSplit) || null;
    commercePlan.commerceSubPlanGateMatrix = cloneDispatchValue(previousPlan.commerceSubPlanGateMatrix) || null;
    commercePlan.commerceSubPlanQuestions = cloneDispatchValue(previousPlan.commerceSubPlanQuestions) || null;
    commercePlan.commerceSubPlanAnswerCollection = cloneDispatchValue(previousPlan.commerceSubPlanAnswerCollection) || null;
    commercePlan.commerceSubPlanCompletionWorkspace = cloneDispatchValue(previousPlan.commerceSubPlanCompletionWorkspace) || null;
    commercePlan.commerceSubPlanDraftReviewSummary = cloneDispatchValue(previousPlan.commerceSubPlanDraftReviewSummary) || null;
    return commercePlan;
  }


  function prefillSubPlanAnswersFromLatestQuestion(commercePlan, input){
    if (!commercePlan || Number(commercePlan.commerceSubPlanAnswerCollection && commercePlan.commerceSubPlanAnswerCollection.completedFieldCount || 0) > 0) return commercePlan;
    const collector = commerceSubPlanAnswerCollectorApi();
    const previousPlan = latestQuestionCommercePlan();
    const previousQuestions = previousPlan && previousPlan.commerceSubPlanQuestions || null;
    if (!collector || !collector.collectSubPlanAnswers || !previousPlan || !previousQuestions) return commercePlan;
    const previousDraft = hasCollectedSubPlanAnswers(previousPlan.commerceSubPlanAnswerCollection) ? previousPlan.commerceSubPlanAnswerCollection : null;
    const collected = collector.collectSubPlanAnswers(input, cloneDispatchValue(previousQuestions), previousDraft);
    if (!collected || Number(collected.completedFieldCount || 0) <= 0) return commercePlan;
    commercePlan.commerceComplexIntentSplit = cloneDispatchValue(previousPlan.commerceComplexIntentSplit) || null;
    commercePlan.commerceSubPlanGateMatrix = cloneDispatchValue(previousPlan.commerceSubPlanGateMatrix) || null;
    commercePlan.commerceSubPlanQuestions = cloneDispatchValue(previousQuestions) || null;
    commercePlan.commerceSubPlanAnswerCollection = collected;
    commercePlan.answerCollectorSourceTaskId = previousPlan.taskId || "";
    return commercePlan;
  }

  function reconcileSubPlanAnswerContext(commercePlan, input){
    if (!commercePlan || Number(commercePlan.commerceSubPlanAnswerCollection && commercePlan.commerceSubPlanAnswerCollection.completedFieldCount || 0) > 0) return commercePlan;
    const collector = commerceSubPlanAnswerCollectorApi();
    const previousPlan = latestQuestionCommercePlan();
    const previousQuestions = previousPlan && previousPlan.commerceSubPlanQuestions || null;
    if (!collector || !collector.collectSubPlanAnswers || !previousPlan || !previousQuestions) return commercePlan;
    const retryDraft = hasCollectedSubPlanAnswers(previousPlan.commerceSubPlanAnswerCollection) ? previousPlan.commerceSubPlanAnswerCollection : null;
    const retry = collector.collectSubPlanAnswers(input, cloneDispatchValue(previousQuestions), retryDraft);
    if (!retry || Number(retry.completedFieldCount || 0) <= 0) return commercePlan;
    commercePlan.commerceComplexIntentSplit = cloneDispatchValue(previousPlan.commerceComplexIntentSplit) || null;
    commercePlan.commerceSubPlanGateMatrix = cloneDispatchValue(previousPlan.commerceSubPlanGateMatrix) || null;
    commercePlan.commerceSubPlanQuestions = cloneDispatchValue(previousQuestions) || null;
    commercePlan.commerceSubPlanAnswerCollection = retry;
    commercePlan.answerCollectorSourceTaskId = previousPlan.taskId || "";
    return commercePlan;
  }

  function attachSubPlanAnswers(commercePlan, input){
    if (commercePlan && Number(commercePlan.commerceSubPlanAnswerCollection && commercePlan.commerceSubPlanAnswerCollection.completedFieldCount || 0) > 0) return commercePlan;
    const collector = commerceSubPlanAnswerCollectorApi();
    if (!collector || !collector.collectSubPlanAnswers) return commercePlan;
    const previousPlan = latestQuestionCommercePlan();
    const previousQuestions = previousPlan && previousPlan.commerceSubPlanQuestions || null;
    const previousAnswerDraft = previousPlan && hasCollectedSubPlanAnswers(previousPlan.commerceSubPlanAnswerCollection) ? previousPlan.commerceSubPlanAnswerCollection : null;
    const previousAnswerAttempt = previousQuestions ? collector.collectSubPlanAnswers(input, cloneDispatchValue(previousQuestions), previousAnswerDraft) : null;
    const answerLike = previousPlan && (looksLikeSubPlanAnswer(input) || previousAnswerAttempt && Number(previousAnswerAttempt.completedFieldCount || 0) > 0);
    const baseQuestions = answerLike ? cloneDispatchValue(previousQuestions) : commercePlan && commercePlan.commerceSubPlanQuestions || previousQuestions || null;
    if (!baseQuestions) return commercePlan;
    commercePlan.commerceSubPlanQuestions = baseQuestions;
    if (answerLike && previousPlan) {
      commercePlan.commerceComplexIntentSplit = cloneDispatchValue(previousPlan.commerceComplexIntentSplit) || null;
      commercePlan.commerceSubPlanGateMatrix = cloneDispatchValue(previousPlan.commerceSubPlanGateMatrix) || null;
    }
    commercePlan.commerceSubPlanAnswerCollection = answerLike && previousAnswerAttempt && Number(previousAnswerAttempt.completedFieldCount || 0) > 0 ? previousAnswerAttempt : collector.collectSubPlanAnswers(input, baseQuestions, answerLike ? previousAnswerDraft : null);
    commercePlan.answerCollectorSourceTaskId = answerLike && previousPlan ? previousPlan.taskId || "" : "";
    return commercePlan;
  }

  function attachSubPlanCompletionWorkspace(commercePlan){
    if (!commercePlan) return commercePlan;
    const workspace = commerceSubPlanCompletionWorkspaceApi();
    if (workspace && workspace.buildSubPlanCompletionWorkspace) {
      commercePlan.commerceSubPlanCompletionWorkspace = workspace.buildSubPlanCompletionWorkspace({
        commerceComplexIntentSplit:commercePlan.commerceComplexIntentSplit || null,
        commerceSubPlanGateMatrix:commercePlan.commerceSubPlanGateMatrix || null,
        commerceSubPlanQuestions:commercePlan.commerceSubPlanQuestions || null,
        commerceSubPlanAnswerCollection:commercePlan.commerceSubPlanAnswerCollection || null
      });
    }
    return commercePlan;
  }

  function attachSubPlanDraftReviewSummary(commercePlan, input){
    if (!commercePlan) return commercePlan;
    ensureDraftReviewContextForConfirmation(commercePlan, input);
    const review = commerceSubPlanDraftReviewSummaryApi();
    if (review && review.buildSubPlanDraftReviewSummary) {
      commercePlan.commerceSubPlanDraftReviewSummary = review.buildSubPlanDraftReviewSummary({
        commerceComplexIntentSplit:commercePlan.commerceComplexIntentSplit || null,
        commerceSubPlanGateMatrix:commercePlan.commerceSubPlanGateMatrix || null,
        commerceSubPlanQuestions:commercePlan.commerceSubPlanQuestions || null,
        commerceSubPlanAnswerCollection:commercePlan.commerceSubPlanAnswerCollection || null,
        commerceSubPlanCompletionWorkspace:commercePlan.commerceSubPlanCompletionWorkspace || null
      });
    }
    return commercePlan;
  }

  function attachSubPlanDraftConfirmation(commercePlan, input){
    if (!commercePlan) return commercePlan;
    const confirmation = commerceSubPlanDraftConfirmationApi();
    if (confirmation && confirmation.buildSubPlanDraftConfirmation) {
      ensureDraftReviewContextForConfirmation(commercePlan, input);
      const previousPlan = latestDraftReviewCommercePlan();
      commercePlan.commerceSubPlanDraftConfirmation = confirmation.buildSubPlanDraftConfirmation({
        input,
        commerceSubPlanDraftReviewSummary:commercePlan.commerceSubPlanDraftReviewSummary || null,
        previousConfirmation:previousPlan && previousPlan.commerceSubPlanDraftConfirmation || null
      });
    }
    return commercePlan;
  }

  function looksLikeSubPlanAnswer(text){
    return /从[^，。,.、\s]+出发|\d{1,2}\s*月\s*\d{1,2}\s*日\s*(?:出发|入住|离店)|孩子\s*[0-9一二三四五六七八九十]+\s*岁|品牌(?:都可以|不限|无所谓)|\d+\s*G\s*内存|\d+\s*T\s*硬盘|收货地|不接受二手|接受二手|周[一二三四五六日天](?:上午|下午|晚上)?|[一二两三四五六七八九十0-9]+\s*张|中区|预算\s*\d+\s*以内|不需要上门|需要上门/i.test(String(text || ""));
  }

  function isCommerceAgentCommand(text){
    const raw = String(text || "");
    if (looksLikeSubPlanAnswer(raw) && latestQuestionCommercePlan()) return true;
    if (looksLikeSubPlanDraftConfirmationOrRevision(raw) && latestDraftReviewCommercePlan()) return true;
    const router = commerceLocalIntentRouterApi();
    if (router && router.routeCommerceIntentLocally) {
      const route = router.routeCommerceIntentLocally(raw);
      if (route && route.canTriggerCommercePlan === true && route.intentCategory !== "unknown") return true;
    }
    const api = commerceAgentApi();
    if (api && api.classifyCommerceIntent) {
      const result = api.classifyCommerceIntent(raw);
      if (result && result.isCommerceIntent) return true;
    }
    const purchaseIntent = /全球采购|采购代理|自动采购|比价|价格比较|平台比较|最便宜方案|性价比最高|可预订|可下单|低价|最便宜|帮我买|帮我订|帮我预定|帮我预订|帮我比较|我想买|订下周|直接下单|下单|付款|采购|购买|买|预定|预订|订票|买票|订|找最便宜|最便宜.*(?:机票|酒店|域名|方案|API|平台|商品|邮轮|游轮|公务机|包机)|OpenRouter.*价格|模型平台.*价格/i.test(raw);
    const commerceObject = /酒店|住宿|机票|飞机票|航空票|火车票|高铁票|航班|电商|商品|SaaS|AI 模型|模型平台|API|门票|票务|服务预约|域名|MacBook|ChatGPT API|采购渠道|邮轮|游轮|cruise|公务机|私人飞机|包机|private jet|charter flight/i.test(raw);
    const assistedSearchPurchase = /帮我(?:找|买|购买|订|预定|预订|比较).*(?:机票|飞机票|航空票|酒店|住宿|火车票|高铁票|航班|商品|MacBook|iPhone|华为|手机|电脑|域名|ChatGPT API|API 方案|模型平台|采购渠道|最便宜|低价|性价比|邮轮|游轮|公务机|包机|私人飞机)/i.test(raw);
    const objectWithPurchase = /(?:机票|飞机票|航空票|航班|酒店|住宿|商品|电商|MacBook|iPhone|华为|手机|电脑|邮轮|游轮|公务机|私人飞机|包机).*(?:找|买|购买|订|预定|预订|订票|买票|比价|最便宜|低价)|(?:找|买|购买|订|预定|预订|订票|买票|比价|最便宜|低价).*(?:机票|飞机票|航空票|航班|酒店|住宿|商品|电商|MacBook|iPhone|华为|手机|电脑|邮轮|游轮|公务机|私人飞机|包机)/i.test(raw);
    const flightSearchIntent = /(?:查|查一下|查询|看一下|找).{0,20}(?:机票|飞机票|航空票|航班)|(\d{4}[-/]\d{1,2}[-/]\d{1,2}|今天|明天|后天|下周[一二三四五六日天]?|周[一二三四五六日天]).{0,20}[\u4e00-\u9fa5A-Za-z]{2,24}\s*(?:飞往|飞|到|去)\s*[\u4e00-\u9fa5A-Za-z]{2,24}/i.test(raw);
    const directOrderRisk = /直接下单|下单并付款|提交订单|自动付款|付款|支付|提交.*询价表|提交.*询价|上传.*(?:护照|身份证)|(?:护照|身份证).*(?:预订|预定|订|上传)/i.test(raw);
    const regulatedCommerceRisk = /大麻|cannabis|marijuana|THC|枪|枪支|firearm|gun|weapon|ammunition|处方药|controlled medication|prescription drug|成人服务|adult service|赌博|gambling|casino|烟草|电子烟|tobacco|nicotine|vape|酒精|酒类|alcohol|危险品|hazardous|地区限制|restricted goods/i.test(raw);
    return regulatedCommerceRisk || directOrderRisk || flightSearchIntent || objectWithPurchase || (purchaseIntent && commerceObject) || assistedSearchPurchase || /全球采购|采购代理|自动采购|比价|平台比较|价格比较/i.test(raw);
  }

  function isDesktopAssistantCommand(text){
    const raw = String(text || "");
    const api = desktopAssistantApi();
    if (api && api.classifyDesktopOperation) {
      const result = api.classifyDesktopOperation(raw);
      if (result && result.isDesktopOperation) return true;
    }
    return /操作电脑|接管电脑|桌面助手|电脑操作|自动操作|打开软件|启动软件|打开浏览器|打开\s*(?:Google\s*)?Chrome|启动\s*(?:Google\s*)?Chrome|打开\s*Safari|启动\s*Safari|打开\s*Finder|打开\s*WPS(?:\s*Office)?|打开\s*备忘录|打开\s*Notes|打开\s*Preview|聚焦\s*(?:Chrome|Safari|Finder|WPS|Notes|Preview)|打开\s*终端|打开\s*Terminal|点击|输入|复制|粘贴|切换窗口|保存文件|删除.*文件|发送邮件|提交表单|付款|安装软件|输入密码|desktop assistant|control computer|operate computer|open\s*(?:Google\s*)?Chrome|open\s*Safari|open\s*Finder|open\s*Notes|open\s*Preview|open\s*app|focus\s*app|click|type|paste|copy|switch window/i.test(raw);
  }

  function selectedModelId(){
    try {
      return (window.localStorage && window.localStorage.getItem(MODEL_SELECTION_KEY)) || "weishan-auto";
    } catch (_) {
      return "weishan-auto";
    }
  }

  function modelById(id){
    const target = String(id || "").toLowerCase();
    return AVAILABLE_MODELS.find((model) => model.id.toLowerCase() === target || model.name.toLowerCase() === target) || null;
  }

  function inferModelId(text){
    const raw = String(text || "").toLowerCase();
    if (/claude/.test(raw)) return "claude-compatible";
    if (/gemini/.test(raw)) return "gemini-compatible";
    if (/本地|local/.test(raw)) return "local-model";
    if (/gpt|openai/.test(raw)) return "gpt-compatible";
    if (/deepseek|qwen|通义|kimi/.test(raw)) return "weishan-auto";
    return selectedModelId();
  }

  function selectModel(modelId){
    const model = modelById(modelId) || modelById("weishan-auto");
    try {
      if (window.localStorage) window.localStorage.setItem(MODEL_SELECTION_KEY, model.id);
    } catch (_) {}
    return model;
  }

  function extractUrl(text){
    const match = String(text || "").match(/https?:\/\/[^\s，。；,;]+/i);
    return match ? match[0] : "";
  }

  function mailAction(text){
    if (/回复|draft\s*reply/i.test(text)) return DISPATCH_ACTIONS.mailDraftReply;
    if (/待办|todo/i.test(text)) return DISPATCH_ACTIONS.mailExtractTodos;
    if (/翻译|translate/i.test(text)) return DISPATCH_ACTIONS.mailTranslate;
    if (/总结|摘要|summary|summarize/i.test(text)) return DISPATCH_ACTIONS.mailSummarize;
    return DISPATCH_ACTIONS.mailOpen;
  }

  function classifyCommand(text){
    const raw = String(text || "");
    const modules = detectModules(raw);
    const uniqueModules = Array.from(new Set(modules));

    if (uniqueModules.includes("codex") && /给\s*Codex|Codex.*(指令|修复|开发|测试)/i.test(raw)) {
      return {
        module:DISPATCH_MODULES.codex,
        action:DISPATCH_ACTIONS.codexGenerateInstruction,
        routeMode:"console",
        modules:[DISPATCH_MODULES.codex],
        targetRoute:"home",
        confidence:"rule"
      };
    }

    if (uniqueModules.length > 1) {
      return {
        module:DISPATCH_MODULES.coordination,
        action:DISPATCH_ACTIONS.coordinationPlan,
        routeMode:"console",
        modules:uniqueModules,
        confidence:"rule",
        targetRoute:"home"
      };
    }

    if (isCommerceAgentCommand(raw)) {
      const localIntentRouter = commerceLocalIntentRouterApi();
      const commerceLocalIntentRoute = localIntentRouter && localIntentRouter.routeCommerceIntentLocally ? localIntentRouter.routeCommerceIntentLocally(raw) : null;
      return {
        module:DISPATCH_MODULES.commerceAgent,
        action:DISPATCH_ACTIONS.commerceAgentPlan,
        routeMode:"console",
        modules:[DISPATCH_MODULES.commerceAgent],
        targetRoute:"commerce",
        confidence:"rule",
        commerceLocalIntentRoute
      };
    }

    if (isDesktopAssistantCommand(raw) && !/邮件接管|抓取中心|软件工厂/i.test(raw)) {
      return {
        module:DISPATCH_MODULES.desktopAssistant,
        action:DISPATCH_ACTIONS.desktopAssistantPaused,
        routeMode:"console",
        modules:[DISPATCH_MODULES.desktopAssistant],
        targetRoute:"home",
        confidence:"rule"
      };
    }

    if (modelKeyword(raw) && !/(VPN|付款|支付|地区|网络).*(怎么|如何|是不是|为什么|解决)|(?:怎么|如何|是不是|为什么|解决).*(VPN|付款|支付|地区|网络)/i.test(raw)) {
      return {
        module:DISPATCH_MODULES.model,
        action:modelAction(raw),
        routeMode:"console",
        modules:[DISPATCH_MODULES.model],
        targetRoute:"home",
        confidence:"rule",
        selectedModelId:inferModelId(raw)
      };
    }

    const module = uniqueModules[0] || DISPATCH_MODULES.chat;
    if (module === "mail") return { module, action:mailAction(raw), routeMode:"module", modules:[module], targetRoute:"mail", confidence:"rule" };
    if (module === "crawler") return { module, action:extractUrl(raw) ? DISPATCH_ACTIONS.crawlerWebFetch : DISPATCH_ACTIONS.crawlerOpen, routeMode:"module", modules:[module], targetRoute:"crawler", confidence:"rule" };
    if (module === "softwareFactory") return { module, action:DISPATCH_ACTIONS.softwareFactoryGeneratePlan, routeMode:"module", modules:[module], targetRoute:"builder", confidence:"rule" };
    if (module === "document") return { module, action:DISPATCH_ACTIONS.documentGenerateDraft, routeMode:"console", modules:[module], targetRoute:"home", confidence:"rule" };
    if (module === "ppt") return { module, action:DISPATCH_ACTIONS.pptGenerateOutline, routeMode:"console", modules:[module], targetRoute:"home", confidence:"rule" };
    if (module === "codex") return { module, action:DISPATCH_ACTIONS.codexGenerateInstruction, routeMode:"console", modules:[module], targetRoute:"home", confidence:"rule" };
    return { module:DISPATCH_MODULES.chat, action:DISPATCH_ACTIONS.chatAnswer, routeMode:"console", modules:[DISPATCH_MODULES.chat], targetRoute:"home", confidence:"fallback" };
  }

  function createDispatchPlan(text){
    const intent = classifyCommand(text);
    const cleanInput = sanitizeDispatchText(text);
    const title = summarizeDispatchText(cleanInput, 80) || "weishan dispatch task";
    const url = extractUrl(cleanInput);
    const plan = Object.assign({}, intent, {
      schemaVersion:"weishan.dispatch.v1",
      title,
      inputSummary:summarizeDispatchText(cleanInput, 240),
      source:"home",
      url,
      executionMode:intent.routeMode === "module" ? "module_confirm_required" : "dispatch_plan",
      realExecution:false,
      requiresUserConfirmation:intent.routeMode === "module",
      mockSafeExecutionAllowed:intent.module === DISPATCH_MODULES.mail || intent.module === DISPATCH_MODULES.softwareFactory || (intent.module === DISPATCH_MODULES.crawler && /^https?:\/\/(example\.com|e2e-local|mock\.local)(?:[/:?#]|$)/i.test(url || "")),
      createdAt:new Date().toISOString()
    });
    if (intent.module === DISPATCH_MODULES.desktopAssistant) {
      const api = desktopAssistantApi();
      const desktopPlan = api && api.createDesktopOperationPlan ? api.createDesktopOperationPlan(cleanInput) : null;
      plan.executionMode = "desktop_assistant_plan_only";
      plan.realExecution = false;
      plan.requiresUserConfirmation = true;
      plan.mockSafeExecutionAllowed = false;
      plan.desktopOperationPlan = desktopPlan;
      plan.riskLevel = desktopPlan && desktopPlan.riskLevel || "low";
      plan.requiresSecondConfirm = desktopPlan && desktopPlan.requiresSecondConfirm === true;
    }
    if (intent.module === DISPATCH_MODULES.commerceAgent) {
      const api = commerceAgentApi();
      const localIntentRouter = commerceLocalIntentRouterApi();
      const commerceLocalIntentRoute = intent.commerceLocalIntentRoute || (localIntentRouter && localIntentRouter.routeCommerceIntentLocally ? localIntentRouter.routeCommerceIntentLocally(cleanInput) : null);
      const commercePlan = api && api.createCommercePlan ? api.createCommercePlan(cleanInput) : null;
      if (commercePlan && commerceLocalIntentRoute) commercePlan.commerceLocalIntentRoute = commerceLocalIntentRoute;
      applyComplexCommerceLocalIntent(commercePlan, commerceLocalIntentRoute);
      attachComplexCommerceSplit(commercePlan, cleanInput, commerceLocalIntentRoute);
      attachSubPlanGateMatrix(commercePlan);
      attachSubPlanQuestions(commercePlan);
      prefillSubPlanAnswersFromLatestQuestion(commercePlan, cleanInput);
      if (!commercePlan.commerceSubPlanAnswerCollection || Number(commercePlan.commerceSubPlanAnswerCollection.completedFieldCount || 0) <= 0) attachSubPlanAnswers(commercePlan, cleanInput);
      reconcileSubPlanAnswerContext(commercePlan, cleanInput);
      attachSubPlanCompletionWorkspace(commercePlan);
      attachSubPlanDraftReviewSummary(commercePlan, cleanInput);
      attachSubPlanDraftConfirmation(commercePlan, cleanInput);
      plan.executionMode = "commerce_agent_plan_only";
      plan.realExecution = false;
      plan.requiresUserConfirmation = true;
      plan.mockSafeExecutionAllowed = false;
      plan.commercePlan = commercePlan;
      plan.commerceLocalIntentRoute = commerceLocalIntentRoute;
      plan.category = commercePlan && commercePlan.category || "";
      plan.riskLevel = commercePlan && commercePlan.riskLevel || "medium";
    }
    if (intent.module === DISPATCH_MODULES.model) {
      plan.selectedModelId = intent.selectedModelId || inferModelId(cleanInput);
    }
    if (plan.module === DISPATCH_MODULES.coordination) plan.stepQueue = createCoordinationStepQueue(plan.modules, cleanInput);
    return plan;
  }

  function dispatchId(){
    return "dispatch-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function storage(){
    try {
      if (window.sessionStorage) return window.sessionStorage;
    } catch (_) {}
    try {
      if (window.localStorage) return window.localStorage;
    } catch (_) {}
    return null;
  }

  function actionLabel(action){
    const map = {
      "mail.open":"打开邮件接管",
      "mail.summarize":"总结邮件",
      "mail.draftReply":"生成回复草稿",
      "mail.extractTodos":"提取邮件待办",
      "mail.translate":"翻译邮件",
      "crawler.open":"打开抓取中心",
      "crawler.webFetch":"抓取网页",
      "softwareFactory.open":"打开软件工厂",
      "softwareFactory.generatePlan":"生成软件方案",
      "document.generateDraft":"生成文档草稿",
      "ppt.generateOutline":"生成 PPT 大纲",
      "codex.generateInstruction":"生成 Codex 指令",
      "model.status":"查看模型状态",
      "model.select":"选择模型",
      "desktopAssistant.plan":"生成桌面操作计划",
      "desktopAssistant.paused":"桌面助手接管暂停",
      "commerceAgent.plan":"生成全球采购计划",
      "chat.answer":"普通问答",
      "coordination.plan":"生成多模块协调计划"
    };
    return map[action] || action || "调度任务";
  }

  function prefillForPlan(plan, text){
    const summary = summarizeDispatchText(text, 240);
    if (plan.module === "crawler") {
      return {
        url:plan.url || extractUrl(text),
        taskTitle:"抓取中心任务",
        taskDescription:summary,
        draftRequirement:"",
        suggestedAction:actionLabel(plan.action)
      };
    }
    if (plan.module === "softwareFactory") {
      return {
        url:"",
        taskTitle:"软件工厂任务",
        taskDescription:summary,
        draftRequirement:summarizeDispatchText(text, 700),
        suggestedAction:actionLabel(plan.action)
      };
    }
    if (plan.module === "mail") {
      return {
        url:"",
        taskTitle:"邮件接管任务",
        taskDescription:summary,
        draftRequirement:"",
        suggestedAction:actionLabel(plan.action)
      };
    }
    return {
      url:"",
      taskTitle:plan.title || "首页调度任务",
      taskDescription:summary,
      draftRequirement:"",
      suggestedAction:actionLabel(plan.action)
    };
  }

  function createPendingPayload(plan, text){
    const safePlan = plan || {};
    const now = new Date().toISOString();
    return {
      schemaVersion:"weishan.dispatch.pending.v1",
      dispatchId:dispatchId(),
      createdAt:now,
      updatedAt:now,
      source:"home",
      targetModule:safePlan.module || "unknown",
      targetRoute:safePlan.targetRoute || "home",
      action:safePlan.action || "",
      inputSummary:summarizeDispatchText(text, 240),
      prefill:prefillForPlan(safePlan, text),
      status:DISPATCH_STATUS.pending,
      executionMode:safePlan.executionMode || "module_confirm_required",
      mockSafeExecutionAllowed:safePlan.mockSafeExecutionAllowed === true,
      realExecution:false,
      requiresUserConfirmation:true
    };
  }

  function savePendingPayload(payload){
    const s = storage();
    if (!s || !payload) return payload;
    try { s.setItem(PENDING_DISPATCH_KEY, JSON.stringify(payload)); } catch (_) {}
    window.WeishanDispatchPayload = payload;
    return payload;
  }

  function readPendingPayload(targetModule){
    let payload = window.WeishanDispatchPayload || null;
    if (!payload) {
      const s = storage();
      try {
        const raw = s && s.getItem(PENDING_DISPATCH_KEY);
        payload = raw ? JSON.parse(raw) : null;
      } catch (_) {
        payload = null;
      }
    }
    if (!payload || payload.schemaVersion !== "weishan.dispatch.pending.v1") return null;
    if (targetModule && payload.targetModule !== targetModule) return null;
    return payload;
  }

  function clearPendingPayload(dispatchIdValue){
    const current = readPendingPayload();
    if (dispatchIdValue && current && current.dispatchId !== dispatchIdValue) return false;
    const s = storage();
    try { if (s) s.removeItem(PENDING_DISPATCH_KEY); } catch (_) {}
    if (!dispatchIdValue || (window.WeishanDispatchPayload && window.WeishanDispatchPayload.dispatchId === dispatchIdValue)) {
      window.WeishanDispatchPayload = null;
    }
    return true;
  }

  function updatePendingPayload(dispatchIdValue, patch){
    const current = readPendingPayload();
    if (!current || (dispatchIdValue && current.dispatchId !== dispatchIdValue)) return null;
    const next = Object.assign({}, current, patch || {}, {
      dispatchId:current.dispatchId,
      schemaVersion:current.schemaVersion,
      prefill:Object.assign({}, current.prefill || {}, patch && patch.prefill || {}),
      realExecution:patch && Object.prototype.hasOwnProperty.call(patch, "realExecution") ? !!patch.realExecution : false,
      requiresUserConfirmation:patch && Object.prototype.hasOwnProperty.call(patch, "requiresUserConfirmation") ? !!patch.requiresUserConfirmation : true,
      updatedAt:new Date().toISOString()
    });
    savePendingPayload(next);
    return next;
  }

  function createDispatchHistoryPayload(payload, historyAction, extra){
    const data = payload || {};
    const detail = extra || {};
    return {
      schemaVersion:"weishan.task.v1",
      module:"dispatch",
      action:String(historyAction || "").replace(/^dispatch\./, "") || "event",
      status:detail.status || data.status || "",
      dispatchId:data.dispatchId || "",
      targetModule:data.targetModule || "",
      targetRoute:data.targetRoute || "",
      inputSummary:summarizeDispatchText(data.inputSummary || "", 240),
      outputSummary:summarizeDispatchText(detail.outputSummary || "", 240),
      executionMode:summarizeDispatchText(detail.executionMode || "manual_confirmation_only", 120),
      realExecution:detail.realExecution === true,
      createdAt:detail.createdAt || new Date().toISOString()
    };
  }

  function recordDispatchHistory(historyAction, payload, extra){
    if (!window.HistoryApi || typeof window.HistoryApi.record !== "function") return null;
    return window.HistoryApi.record(historyAction, createDispatchHistoryPayload(payload, historyAction, extra));
  }

  function confirmPendingPayload(dispatchIdValue, extra){
    const next = updatePendingPayload(dispatchIdValue, {
      status:DISPATCH_STATUS.confirmed,
      realExecution:false,
      requiresUserConfirmation:true
    });
    if (next) {
      recordDispatchHistory(DISPATCH_HISTORY_ACTIONS.confirmed, next, Object.assign({
        status:DISPATCH_STATUS.confirmed,
        executionMode:"manual_confirmation_only",
        realExecution:false,
        outputSummary:"用户已确认首页调度任务，等待模块内继续执行。"
      }, extra || {}));
    }
    return next;
  }

  function cancelPendingPayload(dispatchIdValue, extra){
    const next = updatePendingPayload(dispatchIdValue, {
      status:DISPATCH_STATUS.cancelled,
      realExecution:false,
      requiresUserConfirmation:true
    });
    if (next) {
      recordDispatchHistory(DISPATCH_HISTORY_ACTIONS.cancelled, next, Object.assign({
        status:DISPATCH_STATUS.cancelled,
        executionMode:"cancelled_by_user",
        realExecution:false,
        outputSummary:"用户已取消首页调度任务。"
      }, extra || {}));
    }
    return next;
  }

  function markPendingExecuted(dispatchIdValue, extra){
    const next = updatePendingPayload(dispatchIdValue, {
      status:DISPATCH_STATUS.executed,
      executionMode:extra && extra.executionMode || "module_confirmed_execution",
      outputSummary:extra && extra.outputSummary || "",
      realExecution:!!(extra && extra.realExecution),
      requiresUserConfirmation:true
    });
    if (next) {
      recordDispatchHistory(DISPATCH_HISTORY_ACTIONS.executed, next, Object.assign({
        status:DISPATCH_STATUS.executed,
        executionMode:"module_confirmed_execution",
        outputSummary:"模块已执行确认后的调度任务。"
      }, extra || {}));
    }
    return next;
  }

  function markPendingFailed(dispatchIdValue, extra){
    const next = updatePendingPayload(dispatchIdValue, {
      status:DISPATCH_STATUS.failed,
      executionMode:extra && extra.executionMode || "module_confirmed_execution",
      outputSummary:extra && extra.outputSummary || "",
      realExecution:false,
      requiresUserConfirmation:true
    });
    if (next) {
      recordDispatchHistory(DISPATCH_HISTORY_ACTIONS.failed, next, Object.assign({
        status:DISPATCH_STATUS.failed,
        executionMode:"module_confirmed_execution",
        realExecution:false,
        outputSummary:"调度任务执行失败。"
      }, extra || {}));
    }
    return next;
  }

  function createCoordinationStepQueue(modules, text){
    return (modules || []).map((module, index) => ({
      stepId:"step-" + (index + 1),
      module,
      action:module === "crawler" ? DISPATCH_ACTIONS.crawlerWebFetch :
        module === "softwareFactory" ? DISPATCH_ACTIONS.softwareFactoryGeneratePlan :
        module === "ppt" ? DISPATCH_ACTIONS.pptGenerateOutline :
        module === "document" ? DISPATCH_ACTIONS.documentGenerateDraft :
        module === "mail" ? DISPATCH_ACTIONS.mailOpen :
        module + ".open",
      status:"planned",
      inputSummary:summarizeDispatchText(text, 180),
      realExecution:false,
      requiresUserConfirmation:true
    }));
  }

  function buildDocumentDraft(text, intent){
    const topic = summarizeDispatchText(text, 120) || "文档";
    return [
      "# 文档草稿",
      "",
      "## 1. 标题",
      topic,
      "",
      "## 2. 背景",
      "本草稿基于首页调度中心的本地规则生成，适合作为后续人工完善的初稿。",
      "",
      "## 3. 目标",
      "- 明确文档目的",
      "- 梳理关键信息",
      "- 形成可继续编辑的结构",
      "",
      "## 4. 主要内容",
      "- 事项概述：" + topic,
      "- 适用对象：待补充",
      "- 关键条款 / 要点：待人工确认",
      "",
      "## 5. 下一步",
      "- 补充具体事实和数据",
      "- 检查法律、财务或业务边界",
      "- 交由相关负责人确认"
    ].join("\n");
  }

  function buildPptOutline(text){
    const topic = summarizeDispatchText(text, 120) || "PPT";
    return [
      "# PPT 大纲",
      "",
      "## 封面",
      "- 标题：" + topic,
      "- 副标题：本地生成的大纲草案",
      "",
      "## 目录",
      "1. 核心问题",
      "2. 目标用户",
      "3. 方案概览",
      "4. 执行步骤",
      "5. 风险与对策",
      "6. 总结",
      "",
      "## 核心问题",
      "- 当前要解决什么问题",
      "- 为什么现在需要解决",
      "",
      "## 方案",
      "- 方案一：本地优先执行",
      "- 方案二：模块化协作",
      "- 方案三：历史记录与产物沉淀",
      "",
      "## 执行步骤",
      "- 明确输入",
      "- 分配模块",
      "- 生成结果",
      "- 验证并沉淀历史",
      "",
      "## 风险与对策",
      "- 信息不足：用待确认问题补齐",
      "- 执行范围过大：拆分阶段",
      "- 数据敏感：只保留安全摘要",
      "",
      "## 总结",
      "- 本大纲为 Markdown 文本产物，不是真实 PPTX。"
    ].join("\n");
  }

  function buildCodexInstruction(text){
    const goal = summarizeDispatchText(text, 180) || "请完成指定代码任务";
    return [
      "# Codex 精确指令",
      "",
      "工作目录：",
      "cd <your-weishan-project>",
      "",
      "修改目标：",
      goal,
      "",
      "允许修改文件：",
      "- 根据任务相关模块小范围修改",
      "- 优先修改最接近问题的文件",
      "",
      "禁止修改文件：",
      "- 不要修改无关业务页面",
      "- 不要修改 package-lock.json",
      "- 不要写入真实密钥、token、cookie、password",
      "",
      "检查命令：",
      "- npm run verify",
      "- git diff --check",
      "",
      "安全边界：",
      "- 不读取或输出 AI key、prompt、messages、provider body",
      "- 不上传用户文件或源码",
      "",
      "提交要求：",
      "- 不 commit",
      "- 不 push"
    ].join("\n");
  }

  function buildCoordinationPlan(text, modules){
    const clean = summarizeDispatchText(text, 180);
    const queue = createCoordinationStepQueue(modules, text);
    const steps = queue.map((step, index) => (index + 1) + ". " + step.module + "：准备模块任务，等待用户确认后执行。realExecution=false");
    return [
      "# 多模块协调计划",
      "",
      "## 用户目标",
      clean,
      "",
      "## 涉及模块",
      (modules || []).map((module) => "- " + module).join("\n"),
      "",
      "## 执行顺序",
      steps.join("\n"),
      "",
      "## Step Queue",
      queue.map((step) => "- " + step.stepId + " · " + step.module + " · " + step.action + " · " + step.status + " · realExecution=false").join("\n"),
      "",
      "## v1 边界",
      "- 首页仅生成协调计划，不真实跨模块执行。",
      "- 抓取任务不会在首页访问外网。",
      "- PPT / 文档产物为 Markdown 文本，不是真实 PPTX / DOCX。"
    ].join("\n");
  }

  function buildSoftwareFactoryPlan(text){
    const clean = summarizeDispatchText(text, 180);
    return [
      "# 软件工厂调度草案",
      "",
      "## 识别结果",
      "已识别为软件工厂任务。",
      "",
      "## 可复制需求",
      clean,
      "",
      "## 建议下一步",
      "- 打开软件工厂模块",
      "- 粘贴上述需求",
      "- 生成正式软件方案文档",
      "",
      "本调度计划不会直接调用软件工厂业务函数。"
    ].join("\n");
  }

  function buildModuleDispatchPlan(plan, text){
    if (plan.module === "mail") {
      return "已识别为邮件接管任务，可从邮件接管模块继续执行：总结、回复、待办或翻译。本轮首页不直接调用 Mail AI。";
    }
    if (plan.module === "crawler") {
      return [
        "已识别为抓取中心任务。",
        plan.url ? "URL：" + plan.url : "未识别到明确 URL。",
        "请进入抓取中心执行真实抓取；本轮首页不会访问外网。"
      ].join("\n");
    }
    if (plan.module === "softwareFactory") return buildSoftwareFactoryPlan(text);
    return "已生成模块调度计划。";
  }

  function buildModelStatus(gatewayStatus){
    const selected = modelById(selectedModelId()) || modelById("weishan-auto");
    const status = gatewayStatus || {};
    const configuredText = status.configured ? "已接通" : "未接通";
    return [
      "# 模型状态",
      "",
      "当前模型：" + selected.name + "（" + selected.mode + "）",
      "AI 网关：" + configuredText,
      "联网搜索能力：" + (status.supportsSearch ? "已启用" : "未启用"),
      "",
      "## 可用模型入口",
      AVAILABLE_MODELS.map((model) => "- " + model.name + " · " + model.provider + " · " + model.mode + " · " + model.description).join("\n"),
      "",
      "客户端不保存 provider key。真实模型调用需后端模型网关配置；未接通时无法可靠回答普通问答。"
    ].join("\n");
  }

  function buildModelSelect(plan){
    const selected = selectModel(plan && plan.selectedModelId || "weishan-auto");
    return [
      "# 模型选择",
      "",
      "已切换到 " + selected.name + "。",
      "",
      "模式：" + selected.mode,
      "说明：" + selected.description,
      "",
      "已保存模型偏好。真实调用需后端模型网关接通。客户端不保存 provider key，未调用真实模型。realExecution=false"
    ].join("\n");
  }

  function buildDesktopAssistantPlan(plan, text){
    const api = desktopAssistantApi();
    const operationPlan = plan && plan.desktopOperationPlan || (api && api.createDesktopOperationPlan ? api.createDesktopOperationPlan(text) : null);
    if (!operationPlan) {
      return [
        "桌面助手接管能力已暂停。当前不会控制浏览器、鼠标、键盘或系统 App。",
        "realExecution=false"
      ].join("\n");
    }
    if (operationPlan.riskLevel === "high") {
      return [
        "高风险操作已阻断：不会删除、发送、上传、付款、提交表单或输入密码。",
        "module: desktopAssistant",
        "action: desktopAssistant.paused",
        "realExecution=false"
      ].join("\n");
    }
    return [
      "桌面助手接管能力已暂停。当前不会控制浏览器、鼠标、键盘或系统 App。",
      "module: desktopAssistant",
      "action: desktopAssistant.paused",
      "realExecution=false"
    ].join("\n");
  }

  function buildCommerceAgentPlan(plan, text){
    const api = commerceAgentApi();
    const commercePlan = plan && plan.commercePlan || (api && api.createCommercePlan ? api.createCommercePlan(text) : null);
    if (!commercePlan) {
      return [
        "# 全球采购计划",
        "",
        "全球采购模块尚未加载。realExecution=false",
        "本轮不会真实搜索、下单、付款或提交订单。"
      ].join("\n");
    }
    const scope = (commercePlan.searchScope || []).slice(0, 4).join(" / ");
    const criteria = (commercePlan.decisionCriteria || []).slice(0, 6).join(" / ");
    return [
      "路由判断：全球采购",
      "已生成采购计划：commerceAgent / commerceAgent.plan",
      "realExecution=false",
      "当前仅生成搜索与推荐计划，未下单、未付款、未提交订单。",
      "",
      "需求：" + commercePlan.inputSummary,
      "分类：" + (commercePlan.categoryLabel || commercePlan.category),
      "状态：" + (commercePlan.status || "planned"),
      "搜索范围：" + scope,
      "比较维度：" + criteria,
      "决策目标：同等条件下价格最低，同时综合评分、信誉、售后、退改政策、时效、地区限制、风险和隐性费用。",
      "下一步：进入全球采购模块查看计划。"
    ].join("\n");
  }

  function resultForPlan(plan, text){
    if (plan.module === "document") return buildDocumentDraft(text, plan);
    if (plan.module === "ppt") return buildPptOutline(text, plan);
    if (plan.module === "codex") return buildCodexInstruction(text, plan);
    if (plan.module === "model" && plan.action === DISPATCH_ACTIONS.modelSelect) return buildModelSelect(plan);
    if (plan.module === "model") return buildModelStatus();
    if (plan.module === "desktopAssistant") return buildDesktopAssistantPlan(plan, text);
    if (plan.module === "commerceAgent") return buildCommerceAgentPlan(plan, text);
    if (plan.module === "coordination") return buildCoordinationPlan(text, plan.modules);
    if (plan.module === "softwareFactory" || plan.module === "mail" || plan.module === "crawler") return buildModuleDispatchPlan(plan, text);
    return "AI 网关未接通，无法可靠回答。你仍可使用本地调度：文档草稿、PPT 大纲、Codex 指令、邮件接管、抓取中心、软件工厂和 coordination step queue。";
  }

  function timestamp(){
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
  }

  function filenameForPlan(plan){
    const ts = timestamp();
    if (plan.module === "document") return "weishan-document-draft-" + ts + ".md";
    if (plan.module === "ppt") return "weishan-ppt-outline-" + ts + ".md";
    if (plan.module === "codex") return "weishan-codex-instruction-" + ts + ".md";
    if (plan.module === "model") return "weishan-model-status-" + ts + ".md";
    if (plan.module === "chat") return "weishan-chat-answer-" + ts + ".md";
    if (plan.module === "desktopAssistant") return "weishan-desktop-operation-plan-" + ts + ".md";
    if (plan.module === "commerceAgent") return "weishan-commerce-plan-" + ts + ".md";
    if (plan.module === "coordination") return "weishan-coordination-plan-" + ts + ".md";
    return "weishan-" + plan.module + "-dispatch-plan-" + ts + ".md";
  }

  function byteSize(text){
    const value = String(text || "");
    try { return new Blob([value]).size; } catch (_) { return value.length; }
  }

  function createDispatchArtifact(plan, result){
    const content = redactDispatchText(result).trim();
    return {
      type:"markdown",
      title:(plan.module === "coordination" ? "多模块协调计划" : plan.module + " dispatch artifact"),
      filename:filenameForPlan(plan),
      mimeType:"text/markdown;charset=utf-8",
      sizeBytes:byteSize(content),
      content,
      meta:{
        kind:"home-dispatch",
        module:plan.module,
        action:plan.action,
        source:"home.dispatchRouter"
      }
    };
  }

  window.WeishanDispatchRouter = {
    DISPATCH_MODULES,
    DISPATCH_ACTIONS,
    DISPATCH_STATUS,
    DISPATCH_HISTORY_ACTIONS,
    MODEL_SELECTION_KEY,
    AVAILABLE_MODELS,
    classifyCommand,
    createDispatchPlan,
    buildDocumentDraft,
    buildPptOutline,
    buildCodexInstruction,
    buildCoordinationPlan,
    buildCommerceAgentPlan,
    createDispatchArtifact,
    createPendingPayload,
    savePendingPayload,
    readPendingPayload,
    clearPendingPayload,
    updatePendingPayload,
    confirmPendingPayload,
    cancelPendingPayload,
    markPendingExecuted,
    markPendingFailed,
    createDispatchHistoryPayload,
    recordDispatchHistory,
    selectedModelId,
    selectModel,
    modelById,
    createCoordinationStepQueue,
    sanitizeDispatchText,
    summarizeDispatchText,
    resultForPlan
  };
})();
