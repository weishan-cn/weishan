(function(){
  const DRAFT_ACTION_BAR_VERSION = "2.0.59";
  const PHASE = "subplan_draft_review_action_bar";
  const DEFAULT_MODE = "suggest_next_draft_actions";

  const CONTRACT = {
    draftActionBarVersion: DRAFT_ACTION_BAR_VERSION,
    phase: PHASE,
    defaultMode: DEFAULT_MODE,
    actionPolicy: {
      suggestConfirmationPhrases: true,
      suggestRevisionPhrases: true,
      suggestReturnToQuestions: true,
      suggestSafetyReview: true,
      preserveSubPlanIsolation: true,
      temporarySessionOnly: true,
      noLongTermStorage: true,
      noProviderAccess: true,
      noPriceDuringActionSuggestion: true,
      noRedirectDuringActionSuggestion: true,
      noCheckoutDuringActionSuggestion: true
    },
    capabilities: {
      canShowActionSuggestions: true,
      canShowConfirmationExamples: true,
      canShowRevisionExamples: true,
      canShowSafetyReminder: true,
      canAccessProvider: false,
      canUseApiKey: false,
      canUseNetwork: false,
      canReturnRealResults: false,
      canReturnRealPrice: false,
      canReturnMockPrice: false,
      canRedirect: false,
      canCheckout: false,
      canPay: false,
      canSubmitOrder: false,
      canStoreIdentity: false
    },
    safety: {
      noRealEndpoint: true,
      noRealApiKey: true,
      noNetworkSearch: true,
      noRealResults: true,
      noRealPrice: true,
      noFakeDemoMockPrice: true,
      noRedirect: true,
      noCheckout: true,
      noPayment: true,
      noOrderSubmit: true,
      noIdentityStorage: true,
      noRawGpsStorage: true,
      noBypassLocalLaw: true
    }
  };

  const ACTION_SUGGESTIONS = [
    "确认全部草稿",
    "只确认旅行计划",
    "只确认商品采购计划",
    "修改旅行计划",
    "修改商品采购计划",
    "返回补充问题",
    "查看安全边界"
  ];

  const CONFIRMATION_EXAMPLES = [
    "两个都确认",
    "草稿没问题",
    "旅行和电脑都确认",
    "确认旅行计划",
    "电脑计划确认",
    "旅行计划先不确认，电脑计划确认"
  ];

  const REVISION_EXAMPLES = [
    "酒店入住日期改成7月13日",
    "离店日期改成7月17日",
    "出发地改成都双流",
    "孩子改成9岁",
    "电脑品牌优先苹果",
    "预算改成8000以内",
    "内存至少32G",
    "收货地改上海",
    "不接受二手"
  ];

  const SAFETY_ITEMS = [
    "确认草稿不代表已经接入 provider",
    "当前不会搜索真实平台",
    "当前不会访问真实 provider",
    "不访问真实 provider",
    "当前不会连接 endpoint",
    "不连接 endpoint",
    "当前不会读取 API key",
    "不读取 API key",
    "当前不会发起网络搜索",
    "当前不会返回真实商品结果",
    "当前不会返回价格",
    "当前不会跳转购买或预订",
    "当前不会下单或付款"
  ];

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function asList(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
  }

  function unique(items) {
    return Array.from(new Set(asList(items).map((item) => String(item || "").trim()).filter(Boolean)));
  }

  function reviewItems(reviewSummary) {
    return asList(reviewSummary && reviewSummary.reviewItems);
  }

  function confirmationItems(confirmationState) {
    return asList(confirmationState && confirmationState.confirmationItems);
  }

  function confirmedCount(confirmationState) {
    if (!confirmationState) return 0;
    if (typeof confirmationState.confirmedCount === "number") return confirmationState.confirmedCount;
    return confirmationItems(confirmationState).filter((item) => item && item.confirmationState === "confirmed").length;
  }

  function revisedCount(confirmationState) {
    if (!confirmationState) return 0;
    if (typeof confirmationState.revisedCount === "number") return confirmationState.revisedCount;
    return confirmationItems(confirmationState).filter((item) => item && item.confirmationState === "revised_waiting_confirmation").length;
  }

  function pendingCount(reviewSummary, confirmationState) {
    if (confirmationState && typeof confirmationState.pendingCount === "number") return confirmationState.pendingCount;
    return Math.max(0, reviewItems(reviewSummary).length - confirmedCount(confirmationState) - revisedCount(confirmationState));
  }

  function buildConfirmationSuggestions(reviewSummary, confirmationState) {
    const total = reviewItems(reviewSummary).length;
    const confirmed = confirmedCount(confirmationState);
    const guidance = [];
    if (confirmed > 0) guidance.push("已确认的子计划可以继续修改");
    if (confirmed > 0) guidance.push("未确认的子计划仍可确认");
    if (confirmed > 0) guidance.push("下一步仍需完成当地法律合规确认、Provider 审批和 Connector Gate");
    if (!total) guidance.push("查看草稿复核摘要");
    return {
      title: "确认草稿",
      prompts: ACTION_SUGGESTIONS.slice(0, 3),
      examples: CONFIRMATION_EXAMPLES,
      guidance: unique(guidance)
    };
  }

  function buildRevisionSuggestions(reviewSummary, confirmationState) {
    const hasRevision = revisedCount(confirmationState) > 0 || asList(confirmationState && confirmationState.revisions).length > 0;
    const guidance = hasRevision ? [
      "有修正待复核",
      "可以确认旅行计划，也可以说“两个都确认”",
      "可以说“确认旅行计划”或“两个都确认”",
      "可以继续修改其它字段"
    ] : [
      "可以继续修改任一子计划草稿",
      "修改后仍需要重新复核并确认"
    ];
    if (!reviewItems(reviewSummary).length) guidance.unshift("先补充问题");
    return {
      title: "修改草稿",
      prompts: ACTION_SUGGESTIONS.slice(3, 5),
      examples: REVISION_EXAMPLES,
      guidance: unique(guidance)
    };
  }

  function buildQuestionReturnSuggestions(questionResult, completionWorkspace) {
    const hasQuestions = asList(questionResult && questionResult.subPlanQuestionGroups).length > 0;
    const hasWorkspace = asList(completionWorkspace && completionWorkspace.workspaceItems).length > 0;
    return {
      title: "返回补充问题",
      prompts: ["返回补充问题", "查看草稿复核摘要"],
      examples: ["返回补充问题"],
      guidance: unique([
        hasQuestions || hasWorkspace ? "可以返回补充问题" : "先补充问题",
        "查看草稿复核摘要"
      ])
    };
  }

  function buildSafetyActionReminder() {
    return {
      title: "查看安全边界",
      prompts: ["查看安全边界"],
      items: SAFETY_ITEMS
    };
  }

  function buildSubPlanDraftActionBar(context) {
    const source = context || {};
    const reviewSummary = source.commerceSubPlanDraftReviewSummary || source.draftReviewSummary || null;
    const confirmationState = source.commerceSubPlanDraftConfirmation || source.confirmationState || null;
    const questionResult = source.commerceSubPlanQuestions || source.questionResult || null;
    const completionWorkspace = source.commerceSubPlanCompletionWorkspace || source.completionWorkspace || null;
    const confirmation = buildConfirmationSuggestions(reviewSummary, confirmationState);
    const revision = buildRevisionSuggestions(reviewSummary, confirmationState);
    const questionReturn = buildQuestionReturnSuggestions(questionResult, completionWorkspace);
    const safetyReminder = buildSafetyActionReminder();
    const hasReview = reviewItems(reviewSummary).length > 0;
    const status = revisedCount(confirmationState) > 0 ? "revision_waiting_review" :
      confirmedCount(confirmationState) > 0 ? "confirmation_available" :
      hasReview ? "draft_ready_for_action" : "waiting_for_questions";
    const statusLabel = status === "revision_waiting_review" ? "有修正待复核" :
      status === "confirmation_available" ? "草稿已部分或全部确认" :
      status === "draft_ready_for_action" ? "草稿可确认或修正" : "等待补充问题";
    const displayGuidance = unique([]
      .concat(confirmation.guidance)
      .concat(revision.guidance)
      .concat(questionReturn.guidance));
    return Object.assign({
      contract: clone(CONTRACT),
      draftActionBarVersion: DRAFT_ACTION_BAR_VERSION,
      phase: PHASE,
      defaultMode: DEFAULT_MODE,
      title: "草稿下一步动作",
      subtitle: "你可以确认草稿，也可以说明要修改哪一项。当前不会访问任何真实 provider。",
      status,
      statusLabel,
      actionSuggestions: ACTION_SUGGESTIONS,
      confirmationSuggestions: confirmation,
      revisionSuggestions: revision,
      questionReturnSuggestions: questionReturn,
      safetyReminder,
      displayItems: unique(displayGuidance.length ? displayGuidance : ["先补充问题", "查看草稿复核摘要", "当前不会访问真实 provider"]),
      displayExamples: unique(CONFIRMATION_EXAMPLES.concat(["酒店入住日期改成7月13日", "电脑品牌优先苹果，预算改成8000以内", "返回补充问题"])),
      safetyItems: SAFETY_ITEMS,
      providerAccessLabel: "否",
      priceLabel: "否",
      redirectLabel: "否",
      temporarySessionOnly: true,
      noLongTermStorage: true,
      rawFieldsHiddenFromUserUi: true
    }, clone(CONTRACT.actionPolicy), clone(CONTRACT.capabilities), clone(CONTRACT.safety));
  }

  function toSubPlanDraftActionBarDisplayStatus(actionBar) {
    const source = actionBar || buildSubPlanDraftActionBar({});
    return {
      title: source.title || "草稿下一步动作",
      subtitle: source.subtitle || "你可以确认草稿，也可以说明要修改哪一项。当前不会访问任何真实 provider。",
      statusLabel: source.statusLabel || "等待补充问题",
      actionLabels: ACTION_SUGGESTIONS,
      guidance: unique(source.displayItems && source.displayItems.length ? source.displayItems : ["先补充问题", "查看草稿复核摘要", "当前不会访问真实 provider"]),
      examples: unique(source.displayExamples && source.displayExamples.length ? source.displayExamples : CONFIRMATION_EXAMPLES.concat(REVISION_EXAMPLES.slice(0, 2), ["返回补充问题"])),
      safetyItems: unique(source.safetyItems && source.safetyItems.length ? source.safetyItems : SAFETY_ITEMS),
      providerAccessLabel: source.providerAccessLabel || "否",
      priceLabel: source.priceLabel || "否",
      redirectLabel: source.redirectLabel || "否"
    };
  }

  const api = {
    getSubPlanDraftActionBarContract: function(){ return clone(CONTRACT); },
    buildSubPlanDraftActionBar,
    buildConfirmationSuggestions,
    buildRevisionSuggestions,
    buildQuestionReturnSuggestions,
    buildSafetyActionReminder,
    toSubPlanDraftActionBarDisplayStatus
  };

  if (typeof window !== "undefined") {
    window.WeishanCommerceSubPlanDraftActionBar = api;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
