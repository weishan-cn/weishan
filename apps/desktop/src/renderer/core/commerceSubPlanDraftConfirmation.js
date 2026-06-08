;(function () {
  "use strict";

  const CONTRACT = Object.freeze({
    draftConfirmationVersion: "2.0.58",
    phase: "subplan_draft_confirmation_revision_router",
    defaultMode: "confirm_or_revise_subplan_drafts",
    confirmationPolicy: Object.freeze({
      detectUserConfirmation: true,
      detectUserRevision: true,
      mapConfirmationToSubPlan: true,
      mapRevisionToSubPlanField: true,
      preserveSubPlanIsolation: true,
      temporarySessionOnly: true,
      noLongTermStorage: true,
      noProviderAccess: true,
      noPriceDuringConfirmation: true,
      noRedirectDuringConfirmation: true,
      noCheckoutDuringConfirmation: true
    }),
    capabilities: Object.freeze({
      canDetectConfirmation: true,
      canDetectRevision: true,
      canMapConfirmationToSubPlan: true,
      canMapRevisionToField: true,
      canUpdateDraftConfirmationStatus: true,
      canShowConfirmationSummary: true,
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
    }),
    safety: Object.freeze({
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
    })
  });

  const KIND_LABELS = {
    travel: "旅行计划",
    product: "商品采购计划",
    ticket: "门票计划",
    local_service: "本地服务计划",
    hotel: "酒店计划",
    flight: "机票计划",
    general: "全球采购计划"
  };

  const FIELD_ALIASES = {
    travel: {
      departure: "出发地",
      travelDate: "出行日期",
      checkInDate: "入住日期",
      checkOutDate: "离店日期",
      childAge: "儿童年龄",
      hotelArea: "酒店区域偏好",
      flightPreference: "航班偏好",
      budget: "预算"
    },
    product: {
      brandPreference: "品牌偏好",
      performanceRequirement: "性能要求",
      shippingLocation: "收货地",
      acceptsSecondHand: "是否接受二手",
      budget: "预算",
      useCase: "用途条件"
    },
    ticket: {
      city: "城市",
      dateTime: "日期 / 时间段",
      quantity: "张数",
      seatPreference: "座位偏好",
      budget: "预算"
    },
    local_service: {
      serviceLocation: "服务地点",
      appointmentTime: "预约时间",
      budget: "预算",
      homeService: "是否需要上门"
    }
  };

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function asList(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
  }

  function unique(values) {
    return Array.from(new Set(asList(values).map((item) => String(item).trim()).filter(Boolean)));
  }

  function normalizeInput(value) {
    return String(value || "").replace(/s+/g, " ").trim();
  }

  function getReviewItems(summary) {
    return asList(summary && summary.reviewItems);
  }

  function getSubPlanKind(item) {
    const raw = String(item && (item.kind || item.category || item.categoryLabel || item.title) || "");
    if (/旅行|机票|酒店|travel|flight|hotel/i.test(raw)) return "travel";
    if (/商品|电脑|手机|product/i.test(raw)) return "product";
    if (/门票|票务|演唱会|ticket/i.test(raw)) return "ticket";
    if (/本地服务|理发|local/i.test(raw)) return "local_service";
    return "general";
  }

  function getSubPlanTitle(item) {
    const kind = getSubPlanKind(item);
    return item && (item.title || item.subPlanTitle || KIND_LABELS[kind]) || KIND_LABELS[kind] || "子计划";
  }

  function getSubPlanId(item, index) {
    return item && (item.id || item.subPlanId || item.key) || getSubPlanKind(item) + "_" + (index + 1);
  }

  function itemMatchesKind(item, kind) {
    return getSubPlanKind(item) === kind;
  }

  function targetedKindsFromInput(input) {
    const text = normalizeInput(input);
    const kinds = [];
    if (/旅行|行程|机票|酒店|东京|入住|离店|出发|孩子|直飞|转机/.test(text)) kinds.push("travel");
    if (/商品|电脑|手机|品牌|内存|硬盘|显卡|二手|收货|剪视频/.test(text)) kinds.push("product");
    if (/门票|票|演唱会|座位|张/.test(text)) kinds.push("ticket");
    if (/理发|本地服务|预约|上门|服务地点|高新区/.test(text)) kinds.push("local_service");
    return unique(kinds);
  }

  function detectNegativeKinds(input) {
    const text = normalizeInput(input);
    const negativeKinds = [];
    if (/旅行[^，。,.]*?(先不确认|不确认|还要改)|机票酒店[^，。,.]*?(先不确认|不确认|还要改)/.test(text)) negativeKinds.push("travel");
    if (/(电脑|商品)[^，。,.]*?(先不确认|不确认|还要改)/.test(text)) negativeKinds.push("product");
    if (/门票[^，。,.]*?(先不确认|不确认|还要改)/.test(text)) negativeKinds.push("ticket");
    if (/(理发|本地服务)[^，。,.]*?(先不确认|不确认|还要改)/.test(text)) negativeKinds.push("local_service");
    return negativeKinds;
  }

  function detectDraftConfirmationIntent(input, draftReviewSummary) {
    const text = normalizeInput(input);
    const reviewItems = getReviewItems(draftReviewSummary);
    const hasConfirmationWord = /(确认|没问题|这样可以|可以了|都确认|确认一下|草稿可以|计划可以)/.test(text);
    const hasRevisionWord = /(改成|修改|调整|优先|不接受|接受二手|不要|至少|补充|改为)/.test(text);
    if (!hasConfirmationWord || hasRevisionWord && !/(确认|没问题|这样可以|都确认)/.test(text)) {
      return {
        hasConfirmation: false,
        globalConfirmation: false,
        targetKinds: [],
        targetIds: [],
        confirmationText: ""
      };
    }

    const negativeKinds = detectNegativeKinds(text);
    let targetKinds = targetedKindsFromInput(text).filter((kind) => !negativeKinds.includes(kind));
    const globalConfirmation = /(都确认|全部确认|两个都确认|草稿没问题|这样可以|都可以|确认所有|确认全部)/.test(text) || (hasConfirmationWord && targetKinds.length === 0);
    if (globalConfirmation) {
      targetKinds = unique(reviewItems.map(getSubPlanKind).filter((kind) => !negativeKinds.includes(kind)));
    }

    const targetIds = reviewItems
      .map((item, index) => ({ item, id: getSubPlanId(item, index), kind: getSubPlanKind(item) }))
      .filter(({ kind }) => targetKinds.includes(kind))
      .map(({ id }) => id);

    return {
      hasConfirmation: targetIds.length > 0,
      globalConfirmation,
      targetKinds,
      targetIds,
      confirmationText: text
    };
  }

  function labelForField(kind, field) {
    return (FIELD_ALIASES[kind] && FIELD_ALIASES[kind][field]) || field;
  }

  function addRevision(revisions, reviewItems, kind, field, value) {
    if (!value) return;
    reviewItems.forEach((item, index) => {
      if (!itemMatchesKind(item, kind)) return;
      revisions.push({
        subPlanId: getSubPlanId(item, index),
        subPlanTitle: getSubPlanTitle(item),
        kind,
        field,
        label: labelForField(kind, field),
        value: String(value).trim()
      });
    });
  }

  function firstMatch(text, patterns) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) return match[1].trim();
    }
    return "";
  }

  function detectDraftRevisionIntent(input, draftReviewSummary) {
    return {
      hasRevision: mapRevisionToSubPlanField(input, getReviewItems(draftReviewSummary)).length > 0
    };
  }

  function mapRevisionToSubPlanField(input, reviewItems) {
    const text = normalizeInput(input);
    const revisions = [];
    if (!text) return revisions;

    addRevision(revisions, reviewItems, "travel", "departure", firstMatch(text, [/出发地?改成([^，。,.]+)/, /从([^，。,.]+)出发/ ]));
    addRevision(revisions, reviewItems, "travel", "travelDate", firstMatch(text, [/出行日期改成([^，。,.]+)/, /(?:改成)?([^，。,.]+)出发/ ]));
    addRevision(revisions, reviewItems, "travel", "checkInDate", firstMatch(text, [/入住日期改成([^，。,.]+)/, /酒店[^，。,.]*入住[^0-9一二三四五六七八九十]*([^，。,.]+)/ ]));
    addRevision(revisions, reviewItems, "travel", "checkOutDate", firstMatch(text, [/离店日期改成([^，。,.]+)/, /酒店[^，。,.]*离店[^0-9一二三四五六七八九十]*([^，。,.]+)/ ]));
    addRevision(revisions, reviewItems, "travel", "childAge", firstMatch(text, [/孩子(?:年龄)?改成([^，。,.]+)/, /孩子([^，。,.]*?岁)/ ]));
    addRevision(revisions, reviewItems, "travel", "hotelArea", firstMatch(text, [/酒店区域(?:优先|改成)?([^，。,.]+)/ ]));
    if (/不要转机|优先直飞|直飞/.test(text)) addRevision(revisions, reviewItems, "travel", "flightPreference", /不要转机/.test(text) ? "不要转机" : "优先直飞");

    addRevision(revisions, reviewItems, "product", "budget", firstMatch(text, [/(?:电脑|商品)?预算(?:改成|调整为|为)?([^，。,.]+以内)/ ]));
    const brandValue = firstMatch(text, [/(?:电脑|商品)?品牌(?:优先|改成|偏好)?([^，。,.s]+)/ ]);
    if (brandValue) addRevision(revisions, reviewItems, "product", "brandPreference", /优先/.test(text) && !/都可以/.test(brandValue) ? brandValue + "优先" : brandValue);
    if (/品牌都可以|电脑品牌都可以|都可以/.test(text) && /品牌|电脑/.test(text)) addRevision(revisions, reviewItems, "product", "brandPreference", "都可以");
    const performanceParts = [];
    const memory = firstMatch(text, [/内存(?:至少|要|改成)?s*([^，。,.、]+?)(?:，|。|,|s|$)/ ]);
    const storage = firstMatch(text, [/硬盘(?:至少|要|改成)?s*([^，。,.、]+?)(?:，|。|,|s|$)/ ]);
    const gpu = firstMatch(text, [/显卡(?:要|改成)?s*([^，。,.、]+?)(?:，|。|,|s|$)/ ]);
    if (memory) performanceParts.push("内存" + memory);
    if (storage) performanceParts.push("硬盘" + storage);
    if (gpu) performanceParts.push("显卡" + gpu);
    if (performanceParts.length) addRevision(revisions, reviewItems, "product", "performanceRequirement", performanceParts.join(" / "));
    addRevision(revisions, reviewItems, "product", "shippingLocation", firstMatch(text, [/收货地(?:改成|为)?([^，。,.]+)/ ]));
    if (/不接受二手|不要二手|不考虑二手|不接受翻新/.test(text)) addRevision(revisions, reviewItems, "product", "acceptsSecondHand", "不接受");
    if (!/不接受二手|不要二手|不考虑二手|不接受翻新/.test(text) && /可以接受二手|接受二手|接受翻新/.test(text)) addRevision(revisions, reviewItems, "product", "acceptsSecondHand", "接受");

    addRevision(revisions, reviewItems, "ticket", "city", firstMatch(text, [/城市(?:改成|为)?([^，。,.]+)/, /(?:门票|演唱会).*?在([^，。,.]+?)(?:，|。|,|$)/ ]));
    addRevision(revisions, reviewItems, "ticket", "dateTime", firstMatch(text, [/(?:日期|时间段)(?:改成|为)?([^，。,.]+)/, /(周[^，。,.]+)/ ]));
    addRevision(revisions, reviewItems, "ticket", "quantity", firstMatch(text, [/(d+张|一张|两张|三张|四张|五张)/ ]));
    addRevision(revisions, reviewItems, "ticket", "seatPreference", firstMatch(text, [/座位(?:要|偏好|改成)?([^，。,.]+)/ ]));
    addRevision(revisions, reviewItems, "ticket", "budget", firstMatch(text, [/预算(?:每张)?([^，。,.]+以内)/, /(每张[^，。,.]+以内)/ ]));

    addRevision(revisions, reviewItems, "local_service", "serviceLocation", firstMatch(text, [/服务地点(?:改成|为)?([^，。,.]+)/, /地点(?:改成|为)?([^，。,.]+)/, /在([^，。,.]+?)(?:，|。|,|$)/ ]));
    addRevision(revisions, reviewItems, "local_service", "appointmentTime", firstMatch(text, [/预约时间(?:改成|为)?([^，。,.]+)/, /(明天[^，。,.]+)/ ]));
    addRevision(revisions, reviewItems, "local_service", "budget", firstMatch(text, [/预算([^，。,.]+以内)/ ]));
    if (/不需要上门|不用上门/.test(text)) addRevision(revisions, reviewItems, "local_service", "homeService", "不需要");
    if (/需要上门/.test(text)) addRevision(revisions, reviewItems, "local_service", "homeService", "需要");

    return revisions;
  }

  function mapConfirmationToSubPlan(input, reviewItems) {
    const detected = detectDraftConfirmationIntent(input, { reviewItems });
    if (!detected.hasConfirmation) return [];
    return reviewItems
      .map((item, index) => ({ item, id: getSubPlanId(item, index), kind: getSubPlanKind(item) }))
      .filter(({ id }) => detected.targetIds.includes(id))
      .map(({ item, id, kind }) => ({
        subPlanId: id,
        subPlanTitle: getSubPlanTitle(item),
        kind,
        confirmationText: detected.globalConfirmation ? "已确认全部子计划草稿" : "已确认" + getSubPlanTitle(item)
      }));
  }

  function fieldMatches(label, revision) {
    const normalized = String(label || "").split("：")[0].trim();
    return normalized === revision.label || normalized === revision.field;
  }

  function applyDraftRevisionToReviewItem(reviewItem, revision) {
    const item = clone(reviewItem) || {};
    const source = unique(item.confirmableSummary || item.confirmableFields || []);
    const revisionLabel = revision.label + "：" + revision.value;
    let replaced = false;
    const currentDraftSummary = source.map((entry) => {
      if (fieldMatches(entry, revision)) {
        replaced = true;
        return revisionLabel;
      }
      return entry;
    });
    if (!replaced) currentDraftSummary.push(revisionLabel);
    item.currentDraftSummary = unique(currentDraftSummary);
    item.revisions = unique(asList(item.revisions).concat([revisionLabel]));
    item.confirmationState = "revised_waiting_confirmation";
    item.confirmationStateLabel = "已修正待复核";
    return item;
  }

  function mergePreviousState(previousConfirmation) {
    const confirmedIds = new Set();
    const revisionsById = new Map();
    asList(previousConfirmation && previousConfirmation.confirmationItems).forEach((item) => {
      if (item.confirmationState === "confirmed") confirmedIds.add(item.subPlanId);
      if (item.confirmationState === "revised_waiting_confirmation") {
        revisionsById.set(item.subPlanId, asList(item.revisionFields));
      }
    });
    return { confirmedIds, revisionsById };
  }

  function computeDraftConfirmationStatus(reviewItems, confirmations, revisions, previousConfirmation) {
    if (!reviewItems.length) {
      return { status: "waiting_for_draft_review", statusLabel: "等待草稿复核摘要" };
    }
    if (revisions.length) return { status: "has_revision_waiting_review", statusLabel: "有修正待复核" };
    const previous = mergePreviousState(previousConfirmation);
    const confirmedIds = new Set(previous.confirmedIds);
    confirmations.forEach((item) => confirmedIds.add(item.subPlanId));
    const confirmedCount = reviewItems.filter((item, index) => confirmedIds.has(getSubPlanId(item, index))).length;
    if (confirmedCount === reviewItems.length) return { status: "confirmed_gate_blocked", statusLabel: "已确认但仍受 gate 阻断" };
    if (confirmedCount > 0) return { status: "partially_confirmed", statusLabel: "已部分确认" };
    return { status: "waiting_confirmation", statusLabel: "等待确认" };
  }

  function buildDraftConfirmationActions(status) {
    const actions = [];
    if (status === "has_revision_waiting_review") {
      actions.push("继续确认修正后的子计划草稿");
    } else if (status === "waiting_confirmation" || status === "partially_confirmed") {
      actions.push("继续确认每个子计划草稿是否准确");
    } else if (status === "confirmed_gate_blocked") {
      actions.push("进入当地法律合规和 provider 接入审批复核");
    } else {
      actions.push("先生成子计划草稿复核摘要");
    }
    actions.push("完成当地法律合规确认");
    actions.push("等待 provider 接入审批完成");
    actions.push("通过 Connector Gate 前仍不可访问真实 provider");
    return unique(actions);
  }

  function safetyLabels() {
    return {
      providerAccessLabel: "否",
      apiKeyLabel: "否",
      networkLabel: "否",
      realResultsLabel: "否",
      realPriceLabel: "否",
      mockPriceLabel: "否",
      redirectLabel: "否",
      checkoutLabel: "否",
      identityStorageLabel: "否"
    };
  }

  function buildSubPlanDraftConfirmation(context) {
    const input = context && (context.input || context.userInput || context.commandText) || "";
    const draftReviewSummary = context && (context.commerceSubPlanDraftReviewSummary || context.draftReviewSummary) || null;
    const previousConfirmation = context && context.previousConfirmation || null;
    const reviewItems = getReviewItems(draftReviewSummary);
    const confirmations = mapConfirmationToSubPlan(input, reviewItems);
    const revisions = mapRevisionToSubPlanField(input, reviewItems);
    const previous = mergePreviousState(previousConfirmation);
    const overallStatus = computeDraftConfirmationStatus(reviewItems, confirmations, revisions, previousConfirmation);
    const confirmationById = new Map(confirmations.map((item) => [item.subPlanId, item]));
    const revisionsById = new Map(previous.revisionsById);
    revisions.forEach((revision) => {
      const list = revisionsById.get(revision.subPlanId) || [];
      list.push(revision.label + "：" + revision.value);
      revisionsById.set(revision.subPlanId, unique(list));
    });

    const confirmationItems = reviewItems.map((item, index) => {
      const subPlanId = getSubPlanId(item, index);
      const kind = getSubPlanKind(item);
      const title = getSubPlanTitle(item);
      const itemRevisions = asList(revisionsById.get(subPlanId));
      const isConfirmed = previous.confirmedIds.has(subPlanId) || confirmationById.has(subPlanId);
      let workingItem = clone(item) || {};
      revisions.filter((revision) => revision.subPlanId === subPlanId).forEach((revision) => {
        workingItem = applyDraftRevisionToReviewItem(workingItem, revision);
      });
      const currentDraftSummary = unique(workingItem.currentDraftSummary || item.confirmableSummary || item.confirmableFields || []);
      const state = itemRevisions.length ? "revised_waiting_confirmation" : isConfirmed ? "confirmed" : "pending_confirmation";
      const stateLabel = state === "confirmed" ? "已确认" : state === "revised_waiting_confirmation" ? "已修正待复核" : "待确认";
      const userConfirmationLabel = isConfirmed ? (confirmationById.get(subPlanId) && confirmationById.get(subPlanId).confirmationText || "已确认" + title) : "待用户确认";
      return Object.assign({
        subPlanId,
        title,
        kind,
        categoryLabel: item.categoryLabel || item.category || KIND_LABELS[kind] || title,
        confirmationState: state,
        confirmationStatusLabel: stateLabel,
        userConfirmationLabel,
        currentDraftSummary,
        revisionFields: itemRevisions,
        remainingRisks: unique(item.remainingRisks || []),
        reviewActions: unique(buildDraftConfirmationActions(overallStatus.status).concat(item.reviewActions || [])),
        providerAccess: false,
        returnPrice: false,
        redirectToPurchase: false
      }, safetyLabels());
    });

    const confirmedCount = confirmationItems.filter((item) => item.confirmationState === "confirmed").length;
    const revisedCount = confirmationItems.filter((item) => item.confirmationState === "revised_waiting_confirmation").length;

    return Object.assign({
      contract: clone(CONTRACT),
      draftConfirmationVersion: CONTRACT.draftConfirmationVersion,
      phase: CONTRACT.phase,
      defaultMode: CONTRACT.defaultMode,
      status: overallStatus.status,
      statusLabel: overallStatus.statusLabel,
      subPlanCount: reviewItems.length,
      confirmedCount,
      revisedCount,
      pendingCount: Math.max(0, reviewItems.length - confirmedCount - revisedCount),
      confirmations,
      revisions,
      confirmationItems,
      nextActions: buildDraftConfirmationActions(overallStatus.status),
      note: "该确认与修正只更新临时计划草稿，不访问真实 provider，不读取 API key，不连接 endpoint，不发起网络请求，不返回商品、价格或跳转链接。",
      temporarySessionOnly: true,
      noLongTermStorage: true,
      noProviderAccess: true,
      noPriceDuringConfirmation: true,
      noRedirectDuringConfirmation: true,
      noCheckoutDuringConfirmation: true,
      rawFieldsHiddenFromUserUi: true
    }, safetyLabels(), clone(CONTRACT.safety));
  }

  function toSubPlanDraftConfirmationDisplayStatus(result) {
    const source = result || buildSubPlanDraftConfirmation({});
    return {
      title: "子计划草稿确认与修正",
      subtitle: "用户确认或修正只更新临时计划草稿；确认后仍必须经过当地法律合规、provider 审批和 Connector Gate。",
      statusLabel: source.statusLabel || "等待确认",
      subPlanCountLabel: String(source.subPlanCount || 0),
      confirmedCountLabel: String(source.confirmedCount || 0),
      revisedCountLabel: String(source.revisedCount || 0),
      pendingCountLabel: String(source.pendingCount || 0),
      providerAccessLabel: source.providerAccessLabel || "否",
      priceLabel: source.realPriceLabel || "否",
      redirectLabel: source.redirectLabel || "否",
      note: source.note || "该确认与修正只更新临时计划草稿，不访问真实 provider，不读取 API key，不连接 endpoint，不发起网络请求，不返回商品、价格或跳转链接。",
      items: asList(source.confirmationItems).map((item) => ({
        title: item.title,
        categoryLabel: item.categoryLabel,
        confirmationStatusLabel: item.confirmationStatusLabel,
        userConfirmationLabel: item.userConfirmationLabel,
        currentDraftSummary: unique(item.currentDraftSummary),
        revisionFields: unique(item.revisionFields),
        remainingRisks: unique(item.remainingRisks),
        reviewActions: unique(item.reviewActions),
        providerAccessLabel: item.providerAccessLabel || "否",
        priceLabel: item.realPriceLabel || "否",
        redirectLabel: item.redirectLabel || "否"
      }))
    };
  }

  function getSubPlanDraftConfirmationContract() {
    return clone(CONTRACT);
  }

  const api = {
    getSubPlanDraftConfirmationContract,
    buildSubPlanDraftConfirmation,
    detectDraftConfirmationIntent,
    detectDraftRevisionIntent,
    mapConfirmationToSubPlan,
    mapRevisionToSubPlanField,
    applyDraftRevisionToReviewItem,
    computeDraftConfirmationStatus,
    buildDraftConfirmationActions,
    toSubPlanDraftConfirmationDisplayStatus
  };

  if (typeof window !== "undefined") {
    window.WeishanCommerceSubPlanDraftConfirmation = api;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
