(function(){
  const DRAFT_REVIEW_VERSION = "2.0.57";
  const PHASE = "subplan_draft_review_summary";
  const DEFAULT_MODE = "review_completed_subplan_drafts";

  const CONTRACT = {
    draftReviewVersion:DRAFT_REVIEW_VERSION,
    phase:PHASE,
    defaultMode:DEFAULT_MODE,
    reviewPolicy:{
      summarizeSubPlanDrafts:true,
      showUserConfirmableSummary:true,
      showConfirmedFields:true,
      showUnconfirmedFields:true,
      showRemainingRisks:true,
      preserveSubPlanIsolation:true,
      temporarySessionOnly:true,
      noLongTermStorage:true,
      noProviderAccess:true,
      noPriceDuringReview:true,
      noRedirectDuringReview:true,
      noCheckoutDuringReview:true
    },
    capabilities:{
      canBuildDraftReviewSummary:true,
      canShowConfirmableDraft:true,
      canShowConfirmedFields:true,
      canShowUnconfirmedFields:true,
      canShowRemainingRisks:true,
      canSuggestReviewActions:true,
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
  function normalizeFieldName(field){
    const raw = text(field);
    if (/出发地/.test(raw)) return "出发地";
    if (/具体出行日期|出行日期/.test(raw)) return "出行日期";
    if (/入住/.test(raw)) return "入住日期";
    if (/离店/.test(raw)) return "离店日期";
    if (/儿童年龄|孩子/.test(raw)) return "儿童年龄";
    if (/商品需求|需求|用途/.test(raw)) return raw;
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
    return raw;
  }
  function subPlanId(item, fallback){
    return text(item && (item.subPlanId || item.id || item.title)) || "subplan-" + (fallback + 1);
  }
  function findBySubPlanId(items, id, title){
    const targetId = text(id);
    const targetTitle = text(title);
    return list(items).find((item) => text(item && (item.subPlanId || item.id)) === targetId) ||
      list(items).find((item) => text(item && item.title) === targetTitle) || null;
  }
  function categoryKind(item){
    const raw = [item && item.category, item && item.categoryLabel, item && item.title, item && item.subPlanType].join(" ");
    if (/travel|旅行|机票|酒店|复合旅行/.test(raw)) return "travel";
    if (/ticket|门票|票务/.test(raw)) return "ticket";
    if (/service|本地服务|服务/.test(raw)) return "service";
    if (/product|ecommerce|商品|采购/.test(raw)) return "product";
    return "general";
  }
  function categoryValue(item, field){
    if (!item || !field) return "";
    return text(item[field] || item[field + "Hint"] || "");
  }
  function productDemandFromSubPlan(subPlan){
    const source = subPlan || {};
    const useCase = text(source.useCaseHint || source.usageHint || source.useCase || "");
    const title = text(source.productHint || source.item || source.product || source.title || "");
    if (/剪视频/.test(useCase) || /剪视频/.test(title)) return "适合剪视频的电脑";
    if (/华为/.test(title)) return "华为手机";
    if (/商品/.test(title) || /采购/.test(title)) return "";
    return title;
  }
  function planHintFields(subPlan){
    const kind = categoryKind(subPlan);
    const fields = [];
    if (kind === "travel") {
      const destination = text(subPlan && (subPlan.destination || subPlan.destinationHint));
      const time = text(subPlan && (subPlan.timeHint || subPlan.travelDate));
      const traveler = text(subPlan && (subPlan.travelerHint || subPlan.peopleHint));
      const budget = text(subPlan && (subPlan.budgetHint || subPlan.budget));
      const goal = text(subPlan && (subPlan.optimizationGoal || subPlan.goal));
      if (destination) fields.push("目的地：" + destination);
      if (time) fields.push("时间条件：" + time);
      if (traveler) fields.push("人员条件：" + traveler);
      if (budget) fields.push("预算：" + budget);
      if (goal) fields.push("优化目标：" + goal);
    } else if (kind === "product") {
      const demand = productDemandFromSubPlan(subPlan);
      const budget = text(subPlan && (subPlan.budgetHint || subPlan.budget));
      const useCase = text(subPlan && (subPlan.useCaseHint || subPlan.usageHint || subPlan.useCase));
      const goal = text(subPlan && (subPlan.optimizationGoal || subPlan.goal));
      if (demand) fields.push("商品需求：" + demand);
      if (budget) fields.push("预算：" + budget);
      if (useCase) fields.push("用途条件：" + useCase);
      if (goal) fields.push("优化目标：" + goal);
    }
    return fields;
  }
  function labelField(field){
    if (!field) return "";
    if (typeof field === "string") return field;
    const label = text(field.label) || (normalizeFieldName(field.field) + "：" + text(field.value));
    return label.replace(/(\d+)\s*G内存/gi, "$1G 内存").replace(/(\d+)\s*T硬盘/gi, "$1T 硬盘");
  }
  function summarizeConfirmableFields(completionItem, subPlan){
    const labels = list(completionItem && completionItem.completedFields).map(labelField).filter(Boolean);
    return unique(labels.concat(planHintFields(subPlan)));
  }
  function summarizeUnconfirmedFields(completionItem){
    const remaining = list(completionItem && completionItem.remainingFields).map(normalizeFieldName).filter(Boolean);
    return unique(remaining);
  }
  function summarizeRemainingRisks(subPlan, gateStatus){
    const risks = [
      "当地法律合规未确认",
      "Provider 审批未完成",
      "Connector Gate 已阻断",
      "当前不能访问真实平台，不能返回价格"
    ];
    if (gateStatus === "needs_more_answers") risks.unshift("仍有子计划信息待确认");
    return unique(risks);
  }
  function buildDraftReviewActions(reviewItem){
    const actions = [];
    if (list(reviewItem && reviewItem.unconfirmedFields).length) actions.push("先回答补充问题");
    else actions.push("用户确认草稿是否准确");
    actions.push("完成当地法律合规确认");
    actions.push("等待 provider 接入审批完成");
    return unique(actions);
  }
  function reviewTitle(subPlan, completionItem){
    return text(completionItem && completionItem.title) || text(subPlan && subPlan.title) || "子计划";
  }
  function buildDraftReviewItemForSubPlan(subPlan, completionItem, gateStatus, index){
    const id = subPlanId(subPlan || completionItem, index || 0);
    const title = reviewTitle(subPlan, completionItem);
    const confirmableSummary = summarizeConfirmableFields(completionItem, subPlan);
    const unconfirmedFields = summarizeUnconfirmedFields(completionItem);
    const status = unconfirmedFields.length ? "needs_more_information" : "ready_to_confirm";
    const item = Object.assign({
      subPlanId:id,
      title,
      category:categoryKind(subPlan || completionItem),
      categoryLabel:text(completionItem && completionItem.categoryLabel) || text(subPlan && (subPlan.categoryLabel || subPlan.category)) || title,
      reviewStatus:status,
      reviewStatusLabel:status === "ready_to_confirm" ? "可复核 / 等待确认" : "仍需补充",
      confirmableSummary,
      unconfirmedFields,
      remainingRisks:summarizeRemainingRisks(subPlan, status),
      canProceedToProviderReview:false,
      providerAccess:false,
      price:false,
      redirect:false
    }, safeCapabilities());
    item.reviewActions = buildDraftReviewActions(item);
    return item;
  }
  function computeDraftReviewOverallStatus(reviewItems){
    const items = list(reviewItems);
    const ready = items.filter((item) => item.reviewStatus === "ready_to_confirm").length;
    const needs = items.length - ready;
    if (!items.length) return { status:"waiting_for_plan", label:"仍需补充", readyCount:0, needsCount:0 };
    if (needs > 0) return { status:"needs_more_information", label:"仍需补充", readyCount:ready, needsCount:needs };
    return { status:"ready_for_user_review", label:"等待用户复核", readyCount:ready, needsCount:needs };
  }
  function subPlansFromContext(context){
    const source = context || {};
    const splitPlans = list(source.commerceComplexIntentSplit && source.commerceComplexIntentSplit.subPlans);
    if (splitPlans.length) return splitPlans;
    const workspaceItems = list(source.commerceSubPlanCompletionWorkspace && source.commerceSubPlanCompletionWorkspace.workspaceItems);
    if (workspaceItems.length) return workspaceItems;
    const drafts = list(source.commerceSubPlanAnswerCollection && source.commerceSubPlanAnswerCollection.subPlanDrafts);
    if (drafts.length) return drafts;
    const matrixPlans = list(source.commerceSubPlanGateMatrix && source.commerceSubPlanGateMatrix.subPlanMatrices);
    if (matrixPlans.length) return matrixPlans;
    return [];
  }
  function buildSubPlanDraftReviewSummary(context){
    const source = context || {};
    const workspace = source.commerceSubPlanCompletionWorkspace || {};
    const workspaceItems = list(workspace.workspaceItems);
    const plans = subPlansFromContext(source);
    const reviewItems = plans.map((plan, index) => {
      const id = subPlanId(plan, index);
      const completionItem = findBySubPlanId(workspaceItems, id, plan && plan.title);
      return buildDraftReviewItemForSubPlan(plan, completionItem || plan, completionItem && completionItem.status || "", index);
    });
    const overall = computeDraftReviewOverallStatus(reviewItems);
    return Object.assign({
      draftReviewVersion:DRAFT_REVIEW_VERSION,
      phase:PHASE,
      defaultMode:DEFAULT_MODE,
      mode:DEFAULT_MODE,
      overallStatus:overall.status,
      overallStatusLabel:overall.label,
      subPlanCount:reviewItems.length,
      reviewItemCount:reviewItems.length,
      readyReviewItemCount:overall.readyCount,
      needsMoreInformationCount:overall.needsCount,
      canProceedToProviderReview:false,
      reviewItems,
      temporarySessionOnly:true,
      noLongTermStorage:true,
      providerAccess:false,
      price:false,
      redirect:false
    }, safeCapabilities());
  }
  function toSubPlanDraftReviewDisplayStatus(reviewSummary){
    const result = reviewSummary || buildSubPlanDraftReviewSummary({});
    const items = list(result.reviewItems);
    return {
      title:"子计划草稿复核摘要",
      subtitle:"把已补齐的信息整理成可复核摘要，供用户确认。当前不会访问任何真实 provider。",
      overallStatusLabel:result.overallStatusLabel || "仍需补充",
      subPlanCountLabel:String(result.subPlanCount || items.length || 0),
      readyReviewItemCountLabel:String(result.readyReviewItemCount || 0),
      needsMoreInformationCountLabel:String(result.needsMoreInformationCount || 0),
      providerAccessLabel:"否",
      priceLabel:"否",
      redirectLabel:"否",
      items:items.map((item) => ({
        title:item.title || "子计划",
        categoryLabel:item.categoryLabel || item.title || "子计划",
        reviewStatusLabel:item.reviewStatusLabel || "仍需补充",
        confirmPrompt:"请确认以下" + (item.title || "子计划") + "是否准确",
        confirmableFields:list(item.confirmableSummary),
        unconfirmedFields:list(item.unconfirmedFields),
        remainingRisks:list(item.remainingRisks),
        reviewActions:list(item.reviewActions),
        providerAccessLabel:"否",
        priceLabel:"否",
        redirectLabel:"否"
      })),
      note:"该复核摘要只用于确认计划草稿，不访问真实 provider，不读取 API key，不连接 endpoint，不发起网络请求，不返回商品、价格或跳转链接。"
    };
  }

  window.WeishanCommerceSubPlanDraftReviewSummary = {
    getSubPlanDraftReviewContract:function(){ return clone(CONTRACT); },
    buildSubPlanDraftReviewSummary,
    buildDraftReviewItemForSubPlan,
    summarizeConfirmableFields,
    summarizeUnconfirmedFields,
    summarizeRemainingRisks,
    buildDraftReviewActions,
    computeDraftReviewOverallStatus,
    toSubPlanDraftReviewDisplayStatus
  };
})();
