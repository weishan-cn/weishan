(function(){
  const WORKSPACE_VERSION = "2.0.56";
  const PHASE = "subplan_completion_workspace";
  const DEFAULT_MODE = "guided_subplan_completion";

  const CONTRACT = {
    completionWorkspaceVersion:WORKSPACE_VERSION,
    phase:PHASE,
    defaultMode:DEFAULT_MODE,
    workspacePolicy:{
      summarizeSubPlans:true,
      showCompletedFields:true,
      showRemainingFields:true,
      showNextQuestions:true,
      showNextActions:true,
      reviewCompletedAndRemainingFields:true,
      preserveSubPlanIsolation:true,
      temporarySessionOnly:true,
      noLongTermStorage:true,
      temporaryDraftOnly:true,
      noLongTermAnswerStorage:true,
      noProviderAccess:true,
      noPriceDuringCompletion:true,
      noRedirectDuringCompletion:true,
      noCheckoutDuringCompletion:true,
      noPriceDuringWorkspace:true,
      noRedirectDuringWorkspace:true,
      noCheckoutDuringWorkspace:true
    },
    capabilities:{
      canBuildCompletionWorkspace:true,
      canShowSubPlanProgress:true,
      canShowCompletedFields:true,
      canShowRemainingFields:true,
      canShowNextQuestions:true,
      canShowNextActions:true,
      canSummarizeCompletedFields:true,
      canSummarizeRemainingFields:true,
      canPickNextQuestion:true,
      canBuildNextActions:true,
      canComputeOverallCompletionStatus:true,
      canAccessProvider:false,
      canUseApiKey:false,
      canUseNetwork:false,
      canReturnRealResults:false,
      canReturnRealPrice:false,
      canReturnMockPrice:false,
      canRedirect:false,
      canCheckout:false,
      canPay:false,
      canSubmitOrder:false,
      canStoreIdentity:false
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
      noLongTermAnswerStorage:true,
      noBypassLocalLaw:true
    }
  };

  function clone(value){ return JSON.parse(JSON.stringify(value || null)); }
  function list(value){ return Array.isArray(value) ? value : []; }
  function text(value){ return String(value || "").trim(); }
  function unique(items){
    const seen = new Set();
    return list(items).map(text).filter(Boolean).filter((item) => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    });
  }
  function normalizeFieldName(field){
    const raw = text(field);
    if (/出发地/.test(raw)) return "出发地";
    if (/具体出行日期|出行日期/.test(raw)) return "出行日期";
    if (/入住/.test(raw)) return "入住日期";
    if (/离店/.test(raw)) return "离店日期";
    if (/儿童年龄|孩子/.test(raw)) return "儿童年龄";
    if (/品牌/.test(raw)) return "品牌偏好";
    if (/性能/.test(raw)) return "性能要求";
    if (/收货地|购买地区/.test(raw)) return "收货地";
    if (/二手|翻新/.test(raw)) return "是否接受二手";
    if (/城市/.test(raw)) return "城市";
    if (/日期|时间段/.test(raw)) return "日期 / 时间段";
    if (/张数/.test(raw)) return "张数";
    if (/座位/.test(raw)) return "座位偏好";
    if (/服务地点|地点/.test(raw)) return "服务地点";
    if (/预约时间|服务时间/.test(raw)) return "预约时间";
    if (/预算/.test(raw)) return "预算";
    if (/上门/.test(raw)) return "是否需要上门";
    if (/型号|配置/.test(raw)) return "型号或配置";
    if (/用途/.test(raw)) return "用途";
    return raw;
  }
  function subPlanId(item, fallback){
    return text(item && (item.subPlanId || item.id || item.title)) || "subplan-" + (fallback + 1);
  }
  function fieldValueMap(answerDraft){
    if (answerDraft && answerDraft.fieldValues && typeof answerDraft.fieldValues === "object") return answerDraft.fieldValues;
    return {};
  }
  function findBySubPlanId(items, id, title){
    const targetId = text(id);
    const targetTitle = text(title);
    return list(items).find((item) => text(item && (item.subPlanId || item.id)) === targetId) ||
      list(items).find((item) => text(item && item.title) === targetTitle) || null;
  }
  function questionField(question){
    return normalizeFieldName(question && (question.missingField || question.field || question.questionText));
  }
  function questionText(question){
    return text(question && (question.questionText || question.text || question.missingField));
  }
  function summarizeCompletedFields(answerDraft){
    const values = fieldValueMap(answerDraft);
    return Object.keys(values).filter((key) => text(values[key])).map((key) => ({
      field:normalizeFieldName(key),
      value:text(values[key]),
      label:normalizeFieldName(key) + "：" + text(values[key])
    }));
  }
  function summarizeRemainingFields(matrixPlan, questionGroup, answerDraft){
    const completed = new Set(summarizeCompletedFields(answerDraft).map((item) => item.field));
    const fromMatrix = list(matrixPlan && matrixPlan.missingFields).map(normalizeFieldName);
    const fromQuestions = list(questionGroup && questionGroup.questions).map(questionField);
    return unique(fromMatrix.concat(fromQuestions)).filter((field) => field && !completed.has(field));
  }
  function nextQuestionsForSubPlan(questionGroup, answerDraft){
    const completed = new Set(summarizeCompletedFields(answerDraft).map((item) => item.field));
    return list(questionGroup && questionGroup.questions)
      .filter((question) => !completed.has(questionField(question)))
      .map((question) => ({
        field:questionField(question),
        questionText:questionText(question),
        priorityLabel:text(question && question.priorityLabel) || "中",
        answerTypeLabel:text(question && question.answerType) || "text",
        options:list(question && question.options).map(text).filter(Boolean)
      }))
      .filter((question) => question.questionText);
  }
  function pickNextQuestionForSubPlan(questionGroup, answerDraft){
    return nextQuestionsForSubPlan(questionGroup, answerDraft)[0] || null;
  }
  function buildCompletionNextActions(subPlan, remainingFields, gateStatus){
    const actions = [];
    const fields = unique(remainingFields);
    if (fields.length) {
      actions.push("继续回答：" + fields[0]);
      if (fields[1]) actions.push("继续回答：" + fields[1]);
    } else {
      actions.push("检查子计划草稿是否准确");
    }
    actions.push("完成当地法律合规确认");
    actions.push("等待 provider 接入审批完成");
    if (gateStatus !== "ready") actions.push("通过 Connector Gate 前仍不可访问真实 provider");
    return unique(actions);
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
      canSubmitOrder:false,
      canStoreIdentity:false
    };
  }
  function categoryLabel(item){
    return text(item && (item.categoryLabel || item.category || item.title)) || "子计划";
  }
  function buildCompletionItemForSubPlan(subPlan, matrixPlan, questionGroup, answerDraft, index){
    const id = subPlanId(subPlan || matrixPlan || questionGroup || answerDraft, index || 0);
    const title = text((subPlan || {}).title) || text((matrixPlan || {}).title) || text((questionGroup || {}).title) || text((answerDraft || {}).title) || "子计划";
    const completedFields = summarizeCompletedFields(answerDraft);
    const remainingFields = summarizeRemainingFields(matrixPlan || subPlan, questionGroup, answerDraft);
    const nextQuestions = nextQuestionsForSubPlan(questionGroup, answerDraft);
    const nextQuestion = pickNextQuestionForSubPlan(questionGroup, answerDraft);
    const total = completedFields.length + remainingFields.length;
    const completenessPercent = total ? Math.round(completedFields.length / total * 100) : 0;
    const gateStatus = remainingFields.length ? "blocked" : "waiting_for_gate_review";
    const nextActions = buildCompletionNextActions(subPlan || matrixPlan || questionGroup, remainingFields, gateStatus);
    return Object.assign({
      subPlanId:id,
      title,
      categoryLabel:categoryLabel(subPlan || matrixPlan || questionGroup),
      status:remainingFields.length ? "needs_more_answers" : "answers_complete_gate_blocked",
      statusLabel:remainingFields.length ? "待补充" : "已补齐，等待 gate 审查",
      completedFields,
      remainingFields,
      completedFieldCount:completedFields.length,
      remainingFieldCount:remainingFields.length,
      completenessPercent,
      completenessLabel:String(completenessPercent) + "%",
      nextQuestion,
      nextQuestions,
      nextActions,
      providerAccess:false,
      price:false,
      redirect:false
    }, safeCapabilities());
  }
  function computeOverallCompletionStatus(workspaceItems){
    const items = list(workspaceItems);
    const completed = items.reduce((sum, item) => sum + Number(item.completedFieldCount || 0), 0);
    const remaining = items.reduce((sum, item) => sum + Number(item.remainingFieldCount || 0), 0);
    if (!items.length) return { status:"waiting_for_plan", label:"待补充", completedFieldCount:0, remainingFieldCount:0 };
    if (remaining === 0 && completed > 0) return { status:"answers_complete_gate_blocked", label:"已补齐，等待 gate 审查", completedFieldCount:completed, remainingFieldCount:remaining };
    if (completed > 0) return { status:"partially_completed", label:"部分补齐", completedFieldCount:completed, remainingFieldCount:remaining };
    return { status:"waiting_for_answers", label:"待补充", completedFieldCount:completed, remainingFieldCount:remaining };
  }
  function subPlansFromContext(context){
    const drafts = list(context && context.commerceSubPlanAnswerCollection && context.commerceSubPlanAnswerCollection.subPlanDrafts);
    if (drafts.length) return drafts;
    const splitPlans = list(context && context.commerceComplexIntentSplit && context.commerceComplexIntentSplit.subPlans);
    if (splitPlans.length) return splitPlans;
    const matrixPlans = list(context && context.commerceSubPlanGateMatrix && context.commerceSubPlanGateMatrix.subPlanMatrices);
    if (matrixPlans.length) return matrixPlans;
    const questionGroups = list(context && context.commerceSubPlanQuestions && context.commerceSubPlanQuestions.subPlanQuestionGroups);
    if (questionGroups.length) return questionGroups;
    return [];
  }
  function buildSubPlanCompletionWorkspace(context){
    const source = context || {};
    const matrixPlans = list(source.commerceSubPlanGateMatrix && source.commerceSubPlanGateMatrix.subPlanMatrices);
    const questionGroups = list(source.commerceSubPlanQuestions && source.commerceSubPlanQuestions.subPlanQuestionGroups);
    const answerSource = source.commerceSubPlanAnswerCollection || source.commerceSubPlanAnswerCollector || {};
    const answerDrafts = list(answerSource.subPlanDrafts || answerSource.subPlanAnswerDraft && answerSource.subPlanAnswerDraft.subPlanDrafts);
    const plans = subPlansFromContext(source);
    const workspaceItems = plans.map((plan, index) => {
      const id = subPlanId(plan, index);
      const matrixPlan = findBySubPlanId(matrixPlans, id, plan && plan.title);
      const questionGroup = findBySubPlanId(questionGroups, id, plan && plan.title);
      const answerDraft = findBySubPlanId(answerDrafts, id, plan && plan.title);
      return buildCompletionItemForSubPlan(plan, matrixPlan, questionGroup, answerDraft, index);
    });
    const overall = computeOverallCompletionStatus(workspaceItems);
    const nextQuestionCount = workspaceItems.reduce((sum, item) => sum + Number(list(item.nextQuestions).length), 0);
    return Object.assign({
      completionWorkspaceVersion:WORKSPACE_VERSION,
      phase:PHASE,
      defaultMode:DEFAULT_MODE,
      status:overall.status,
      statusLabel:overall.label,
      subPlanCount:workspaceItems.length,
      completedFieldCount:overall.completedFieldCount,
      remainingFieldCount:overall.remainingFieldCount,
      nextQuestionCount,
      workspaceItems,
      temporarySessionOnly:true,
      noLongTermStorage:true,
      temporaryDraftOnly:true,
      noLongTermAnswerStorage:true,
      providerAccess:false,
      price:false,
      redirect:false
    }, safeCapabilities());
  }
  function toSubPlanCompletionWorkspaceDisplayStatus(workspace){
    const result = workspace || buildSubPlanCompletionWorkspace({});
    const items = list(result.workspaceItems);
    return {
      title:"子计划补齐工作台",
      subtitle:"把已回答字段、仍缺字段、下一问题和下一步动作集中到每个子计划下。当前只整理临时计划草稿。",
      overallStatusLabel:result.statusLabel || "待补充",
      subPlanCountLabel:String(result.subPlanCount || items.length || 0),
      completedFieldCountLabel:String(result.completedFieldCount || 0),
      remainingFieldCountLabel:String(result.remainingFieldCount || 0),
      nextQuestionCountLabel:String(result.nextQuestionCount || 0),
      providerAccessLabel:"否",
      priceLabel:"否",
      redirectLabel:"否",
      items:items.map((item) => ({
        title:item.title || "子计划",
        categoryLabel:item.categoryLabel || item.title || "子计划",
        statusLabel:item.statusLabel || "待补充",
        completedFields:list(item.completedFields).map((field) => field.label || (field.field + "：" + field.value)).filter(Boolean),
        remainingFields:list(item.remainingFields),
        completedFieldCountLabel:String(item.completedFieldCount || 0),
        remainingFieldCountLabel:String(item.remainingFieldCount || 0),
        completenessLabel:item.completenessLabel || "0%",
        nextQuestionLabel:item.nextQuestion && item.nextQuestion.questionText || "暂无下一问题",
        nextQuestions:list(item.nextQuestions).map((question) => question.questionText).filter(Boolean),
        nextActions:list(item.nextActions),
        providerAccessLabel:"否",
        priceLabel:"否",
        redirectLabel:"否"
      })),
      note:"该工作台只整理计划草稿，不长期保存用户答案，不访问真实 provider，不读取 API key，不连接 endpoint，不发起网络请求，不返回商品、价格或跳转链接。"
    };
  }

  window.WeishanCommerceSubPlanCompletionWorkspace = {
    getSubPlanCompletionWorkspaceContract:function(){ return clone(CONTRACT); },
    buildSubPlanCompletionWorkspace,
    buildCompletionItemForSubPlan,
    summarizeCompletedFields,
    summarizeRemainingFields,
    pickNextQuestionForSubPlan,
    buildCompletionNextActions,
    computeOverallCompletionStatus,
    toSubPlanCompletionWorkspaceDisplayStatus
  };
})();
