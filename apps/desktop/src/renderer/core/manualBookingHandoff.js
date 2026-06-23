;(function () {
  "use strict";

  const MANUAL_BOOKING_HANDOFF_VERSION = "2.1.61";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value === undefined || value === null ? "" : value).trim();
  }

  function defaultSearchConditions(overrides) {
    return Object.assign({
      origin: "上海",
      destination: "成都",
      departureDate: "7 月 15 日",
      passengerCount: "待用户确认",
      cabinClass: "经济舱 / 待确认",
      directOnly: "用户要求直达 / 如已识别",
      baggagePreference: "手动核对行李规则",
      sortPreference: "低价优先"
    }, overrides || {});
  }

  function defaultPriceEvidence(overrides) {
    return Object.assign({
      providerName: "Flight Provider Sandbox",
      sourceHostDisplayName: "Flight Provider Sandbox",
      currency: "CNY",
      total: 1010,
      taxes: 110,
      fees: 40,
      updatedAt: "2026-06-20T00:00:00.000Z",
      priceObservedAt: "2026-06-20T00:00:00.000Z",
      inventoryReliability: "limited beta readonly evidence only",
      finalPageDisclaimer: "最终价格、税费、库存/余票、退改签和行李规则，以平台页面为准。"
    }, overrides || {});
  }

  function checklist() {
    return [
      "打开官方航空公司或可信平台",
      "手动输入出发地 / 目的地 / 日期",
      "手动核对是否直飞",
      "手动核对乘机人数和舱位",
      "手动核对基础票价",
      "手动核对税费",
      "手动核对附加费",
      "手动核对行李规则",
      "手动核对退改签规则",
      "手动核对余票 / 座位状态",
      "手动确认最终价格",
      "付款前再次确认域名",
      "不向未知平台提交身份证 / 护照 / 银行卡",
      "weishan 不代付、不下单"
    ];
  }

  function buildCopyPayload(searchConditions, priceEvidenceSummary, hidePrice) {
    const priceLine = hidePrice
      ? "价格：价格已隐藏，请用户在官方平台重新核对"
      : "参考价格：仅 Limited Beta 只读价格，不代表最终成交价";
    return [
      "【weishan 人工核对清单】",
      "路线：" + text(searchConditions.origin) + " → " + text(searchConditions.destination),
      "日期：" + text(searchConditions.departureDate),
      "排序：" + text(searchConditions.sortPreference),
      "直飞偏好：" + text(searchConditions.directOnly),
      priceLine,
      "来源平台：" + text(priceEvidenceSummary.sourceHostDisplayName || priceEvidenceSummary.providerName),
      "更新时间：" + text(priceEvidenceSummary.updatedAt),
      "重要提示：最终价格、税费、库存/余票、退改签和行李规则，以平台页面为准。",
      "操作方式：请用户自行打开官方航空公司或可信平台核对。weishan 不自动跳转、不付款、不下单。"
    ].join("\n");
  }

  function buildManualBookingHandoff(input) {
    const raw = input && typeof input === "object" ? input : {};
    const providerCategory = text(raw.providerCategory || "flight");
    const providerId = text(raw.providerId || "flight_provider");
    const restricted = ["restricted", "restricted_provider", "restricted_or_blocked"].includes(providerCategory);
    const allowed = providerCategory === "flight" && providerId === "flight_provider" && !restricted;
    const rollbackActive = raw.rollbackActive === true || raw.rollbackDecision === "rollback_active";
    if (!allowed) {
      return clone({
        version: MANUAL_BOOKING_HANDOFF_VERSION,
        handoffType: "manual_booking_handoff",
        providerCategory,
        providerId,
        status: restricted ? "blocked" : "not_allowed",
        noAutoOpen: true,
        noAutoBooking: true,
        noPayment: true,
        noOrder: true,
        noIdentityUpload: true,
        noBankCardSave: true,
        noBookingUrl: true,
        userMustVerifyOnOfficialPlatform: true,
        blockedReason: restricted ? "restricted category blocked" : "manual booking handoff flight only",
        copyPayload: "",
        redacted: true
      });
    }
    const searchConditions = defaultSearchConditions(raw.searchConditions);
    const evidence = defaultPriceEvidence(raw.priceEvidenceSummary);
    const safeEvidence = rollbackActive
      ? Object.assign({}, evidence, { total:"价格已隐藏", taxes:"价格已隐藏", fees:"价格已隐藏" })
      : evidence;
    const result = {
      version: MANUAL_BOOKING_HANDOFF_VERSION,
      handoffType: "manual_booking_handoff",
      providerCategory: "flight",
      providerId: "flight_provider",
      status: "manual_only",
      noAutoOpen: true,
      noAutoBooking: true,
      noPayment: true,
      noOrder: true,
      noIdentityUpload: true,
      noBankCardSave: true,
      noBookingUrl: true,
      userMustVerifyOnOfficialPlatform: true,
      searchConditions,
      priceEvidenceSummary: safeEvidence,
      userChecklist: checklist(),
      copyPayload: buildCopyPayload(searchConditions, safeEvidence, rollbackActive),
      redacted: true
    };
    result.auditDraft = buildManualBookingHandoffAuditDraft(result);
    return clone(result);
  }

  function buildManualBookingHandoffAuditDraft(handoffInput) {
    const handoff = handoffInput && typeof handoffInput === "object" ? handoffInput : buildManualBookingHandoff();
    return clone({
      eventType: "MANUAL_BOOKING_HANDOFF_AUDIT_DRAFT",
      schemaVersion: MANUAL_BOOKING_HANDOFF_VERSION,
      providerCategory: handoff.providerCategory,
      providerId: handoff.providerId,
      handoffType: "manual_booking_handoff",
      noAutoOpen: true,
      noBookingUrl: true,
      noPayment: true,
      noOrder: true,
      noIdentityUpload: true,
      noBankCardSave: true,
      copyChecklistCount: handoff.status === "manual_only" ? 1 : 0,
      autoOpenAttemptCount: 0,
      bookingUrlGeneratedCount: 0,
      paymentAttemptCount: 0,
      orderAttemptCount: 0,
      identityUploadAttemptCount: 0,
      redacted: true
    });
  }

  function assertManualBookingHandoffSafe(value) {
    const handoff = value && typeof value === "object" ? value : buildManualBookingHandoff();
    const audit = handoff.auditDraft || buildManualBookingHandoffAuditDraft(handoff);
    if (handoff.providerCategory !== "flight" || handoff.providerId !== "flight_provider") throw new Error("handoff must stay flight_provider only");
    if (handoff.noAutoOpen !== true || handoff.noBookingUrl !== true || handoff.noPayment !== true || handoff.noOrder !== true || handoff.noIdentityUpload !== true || handoff.noBankCardSave !== true) {
      throw new Error("handoff transaction surfaces must stay disabled");
    }
    ["autoOpenAttemptCount", "bookingUrlGeneratedCount", "paymentAttemptCount", "orderAttemptCount", "identityUploadAttemptCount"].forEach(function (key) {
      if ((audit[key] || 0) !== 0) throw new Error(key + " must stay zero");
    });
    const product = buildManualBookingHandoff({ providerCategory:"product", providerId:"product_provider" });
    if (product.status !== "not_allowed") throw new Error("product handoff must be blocked");
    const restricted = buildManualBookingHandoff({ providerCategory:"restricted_or_blocked", providerId:"restricted_provider" });
    if (restricted.status !== "blocked") throw new Error("restricted handoff must be blocked");
    return true;
  }

  window.WeishanManualBookingHandoff = {
    MANUAL_BOOKING_HANDOFF_VERSION,
    buildManualBookingHandoff,
    buildManualBookingHandoffAuditDraft,
    assertManualBookingHandoffSafe
  };
})();
