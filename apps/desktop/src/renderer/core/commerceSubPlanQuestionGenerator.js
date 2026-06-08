(function(){
  const QUESTION_GENERATOR_VERSION = "2.0.53";
  const PHASE = "subplan_question_generator";
  const DEFAULT_MODE = "missing_fields_to_questions";

  const CONTRACT = {
    questionGeneratorVersion:QUESTION_GENERATOR_VERSION,
    phase:PHASE,
    defaultMode:DEFAULT_MODE,
    questionPolicy:{
      perSubPlanQuestions:true,
      questionsFromMissingFields:true,
      preserveSubPlanIsolation:true,
      noProviderAccess:true,
      noPriceDuringQuestionGeneration:true,
      noRedirectDuringQuestionGeneration:true,
      noCheckoutDuringQuestionGeneration:true
    },
    capabilities:{
      canGenerateQuestions:true,
      canGroupQuestionsBySubPlan:true,
      canPrioritizeQuestions:true,
      canSuggestAnswerType:true,
      canSuggestOptions:true,
      canAccessProvider:false,
      canUseApiKey:false,
      canUseNetwork:false,
      canReturnRealResults:false,
      canReturnRealPrice:false,
      canReturnMockPrice:false,
      canRedirect:false,
      canCheckout:false,
      canPay:false,
      canSubmitOrder:false
    },
    safety:{
      noRealEndpoint:true,
      noRealApiKey:true,
      noNetworkSearch:true,
      noRealResults:true,
      noRealPrice:true,
      noFakeDemoMockPrice:true,
      noRedirect:true,
      noCheckout:true,
      noPayment:true,
      noOrderSubmit:true,
      noIdentityStorage:true,
      noRawGpsStorage:true,
      noBypassLocalLaw:true
    }
  };

  const QUESTION_TEXT = {
    travel_plan:{
      出发地:"你从哪个城市出发？",
      目的地:"你要去哪个城市或地区？",
      具体出行日期:"具体哪一天出发？",
      出行日期:"具体哪一天出发？",
      返程日期:"需要哪一天返程？",
      入住日期:"酒店哪天入住？",
      离店日期:"酒店哪天离店？",
      "入住 / 离店日期":"酒店哪天入住、哪天离店？",
      人数:"一共几个人出行？",
      儿童年龄:"孩子几岁？",
      预算:"总预算大概是多少？",
      偏好:"是否偏好直飞、酒店星级或特定区域？"
    },
    product:{
      品牌偏好:"你偏好哪个品牌？没有偏好也可以说“都可以”。",
      型号或配置:"你需要什么型号或配置？",
      性能要求:"主要需要什么性能要求，例如内存、硬盘、显卡？",
      预算:"预算大概是多少？",
      用途:"主要用途是什么？",
      购买地区或收货地:"收货地在哪个国家或城市？",
      收货地:"收货地在哪个国家或城市？",
      质量要求:"对质量、保修或版本有什么要求？",
      是否接受二手:"是否接受二手或翻新机？",
      保修要求:"是否需要官方保修或本地保修？"
    },
    ticket:{
      城市:"想看哪个城市的票？",
      日期:"想看哪一天或哪个时间段？",
      场馆:"有指定场馆吗？",
      张数:"需要几张票？",
      座位偏好:"对座位区域有什么偏好？",
      预算:"每张票或总预算大概是多少？",
      "官方票 / 转售票接受范围":"是否只接受官方票？是否接受转售票？"
    },
    local_service:{
      服务地点:"服务地点在哪个城市或区域？",
      预约时间:"想预约哪天、哪个时间段？",
      服务日期:"想预约哪一天？",
      时间段:"想预约哪个时间段？",
      服务类型细节:"具体需要哪种服务？",
      预算:"预算大概是多少？",
      是否需要上门:"是否需要上门服务？"
    }
  };

  const TYPE_BY_FIELD = {
    出发地:"city",
    目的地:"city",
    城市:"city",
    具体出行日期:"date",
    出行日期:"date",
    返程日期:"date",
    入住日期:"date",
    离店日期:"date",
    "入住 / 离店日期":"dateRange",
    日期:"date",
    服务日期:"date",
    预约时间:"dateRange",
    时间段:"preference",
    人数:"number",
    张数:"number",
    儿童年龄:"age",
    预算:"money",
    购买地区或收货地:"location",
    收货地:"location",
    服务地点:"location",
    是否接受二手:"boolean",
    是否需要上门:"boolean",
    偏好:"preference",
    座位偏好:"preference",
    "官方票 / 转售票接受范围":"preference"
  };

  const HIGH_PRIORITY = ["出发地", "目的地", "具体出行日期", "出行日期", "入住日期", "离店日期", "购买地区或收货地", "收货地", "预算", "型号或配置", "性能要求", "城市", "日期", "张数", "服务地点", "预约时间"];
  const MEDIUM_PRIORITY = ["儿童年龄", "人数", "品牌偏好", "用途", "是否接受二手", "场馆", "座位偏好", "服务日期", "时间段", "服务类型细节", "是否需要上门"];

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function compact(items){
    return (Array.isArray(items) ? items : []).map((item) => String(item || "").trim()).filter(Boolean);
  }

  function unique(items){
    return compact(items).filter((item, index, arr) => arr.indexOf(item) === index);
  }

  function categoryOf(subPlan){
    const raw = subPlan && (subPlan.category || subPlan.commerceType || subPlan.intentCategory) || "general_commerce";
    if (raw === "serviceBooking") return "local_service";
    if (raw === "multi_category_travel") return "travel_plan";
    if (raw === "ticketing") return "ticket";
    return raw;
  }

  function safeCapabilities(){
    return {
      canAccessProvider:false,
      canUseApiKey:false,
      canUseNetwork:false,
      canReturnRealResults:false,
      canReturnRealPrice:false,
      canReturnMockPrice:false,
      canRedirect:false,
      canCheckout:false,
      canPay:false,
      canSubmitOrder:false
    };
  }

  function inferAnswerTypeForQuestion(question, missingField){
    return TYPE_BY_FIELD[missingField] || (question && question.answerType) || "text";
  }

  function buildQuestionOptions(question, missingField){
    const type = inferAnswerTypeForQuestion(question, missingField);
    if (type === "boolean") return ["是", "否", "不确定"];
    if (missingField === "偏好") return ["直飞优先", "酒店位置优先", "预算优先", "都可以"];
    if (missingField === "座位偏好") return ["靠前", "中区", "视野优先", "都可以"];
    if (missingField === "官方票 / 转售票接受范围") return ["只接受官方票", "可接受转售票", "不确定"];
    return [];
  }

  function priorityForMissingField(field){
    if (HIGH_PRIORITY.indexOf(field) >= 0) return "high";
    if (MEDIUM_PRIORITY.indexOf(field) >= 0) return "medium";
    return "low";
  }

  function priorityLabel(priority){
    if (priority === "high") return "高";
    if (priority === "medium") return "中";
    return "低";
  }

  function questionTextFor(category, field){
    const table = QUESTION_TEXT[category] || {};
    return table[field] || ("请补充" + field + "。");
  }

  function questionFromMissingField(subPlan, missingField){
    const category = categoryOf(subPlan);
    const field = String(missingField || "").trim();
    const text = questionTextFor(category, field);
    const priority = priorityForMissingField(field);
    const question = {
      questionId:String((subPlan && subPlan.subPlanId) || "subplan") + "-" + field.replace(/\s+/g, "-"),
      priority,
      priorityLabel:priorityLabel(priority),
      missingField:field,
      questionText:text,
      answerType:inferAnswerTypeForQuestion(null, field),
      options:[],
      requiredBeforeProviderSearch:true
    };
    question.options = buildQuestionOptions(question, field);
    return question;
  }

  function priorityRank(priority){
    if (priority === "high") return 0;
    if (priority === "medium") return 1;
    return 2;
  }

  function prioritizeSubPlanQuestions(questions){
    return (Array.isArray(questions) ? questions.slice() : []).sort((a, b) => {
      const rank = priorityRank(a && a.priority) - priorityRank(b && b.priority);
      if (rank !== 0) return rank;
      return String(a && a.questionText || "").localeCompare(String(b && b.questionText || ""), "zh-Hans-CN");
    });
  }

  function generateQuestionsForSubPlan(subPlanMatrix){
    const plan = subPlanMatrix || {};
    const questions = prioritizeSubPlanQuestions(unique(plan.missingFields || []).map((field) => questionFromMissingField(plan, field)));
    return Object.assign({
      subPlanId:plan.subPlanId || "subplan",
      title:plan.title || "子计划",
      category:categoryOf(plan),
      categoryLabel:plan.categoryLabel || plan.title || "子计划",
      questionCount:questions.length,
      questions
    }, safeCapabilities());
  }

  function generateQuestionsForSubPlanMatrix(matrix){
    const plans = Array.isArray(matrix && matrix.subPlanMatrices) ? matrix.subPlanMatrices : [];
    const groups = plans.map(generateQuestionsForSubPlan);
    const total = groups.reduce((sum, group) => sum + Number(group.questionCount || 0), 0);
    return Object.assign({
      questionGeneratorVersion:QUESTION_GENERATOR_VERSION,
      phase:PHASE,
      mode:DEFAULT_MODE,
      overallStatus:"questions_ready",
      overallStatusLabel:"待补充",
      subPlanCount:groups.length,
      questionCount:total,
      subPlanQuestionGroups:groups
    }, safeCapabilities());
  }

  function toSubPlanQuestionDisplayStatus(questionResult){
    const safe = questionResult || {};
    const groups = Array.isArray(safe.subPlanQuestionGroups) ? safe.subPlanQuestionGroups : [];
    return {
      title:"子计划补充问题",
      subtitle:"根据每个子计划的缺失信息生成问题，帮助用户补齐信息。当前不会访问任何真实 provider。",
      overallStatusLabel:"待补充",
      subPlanCountLabel:String(safe.subPlanCount || groups.length || 0),
      questionCountLabel:String(safe.questionCount || groups.reduce((sum, group) => sum + Number(group.questionCount || 0), 0)),
      providerAccessLabel:"否",
      priceLabel:"否",
      redirectLabel:"否",
      groups:groups.map((group) => ({
        title:group.title || "子计划",
        categoryLabel:group.categoryLabel || group.title || "子计划",
        questionCountLabel:String(group.questionCount || (Array.isArray(group.questions) ? group.questions.length : 0)),
        providerAccessLabel:"否",
        priceLabel:"否",
        redirectLabel:"否",
        questions:(Array.isArray(group.questions) ? group.questions : []).map((question) => ({
          text:question.questionText || "",
          priorityLabel:question.priorityLabel || priorityLabel(question.priority),
          answerTypeLabel:answerTypeLabel(question.answerType),
          optionsLabel:Array.isArray(question.options) && question.options.length ? question.options.join(" / ") : "自由填写"
        }))
      })),
      note:"这些问题只用于补齐计划信息，不访问真实 provider，不读取 API key，不连接 endpoint，不发起网络请求，不返回商品、价格或跳转链接。"
    };
  }

  function answerTypeLabel(type){
    const map = {
      city:"城市",
      date:"日期",
      dateRange:"日期范围",
      number:"数字",
      age:"年龄",
      money:"金额",
      preference:"偏好",
      location:"地点",
      boolean:"是 / 否",
      text:"文本"
    };
    return map[type] || "文本";
  }

  function getSubPlanQuestionGeneratorContract(){
    return clone(CONTRACT);
  }

  window.WeishanCommerceSubPlanQuestionGenerator = {
    getSubPlanQuestionGeneratorContract,
    generateQuestionsForSubPlanMatrix,
    generateQuestionsForSubPlan,
    questionFromMissingField,
    prioritizeSubPlanQuestions,
    inferAnswerTypeForQuestion,
    buildQuestionOptions,
    toSubPlanQuestionDisplayStatus
  };
})();
