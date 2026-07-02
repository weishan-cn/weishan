;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PARTNER_LINK_POLICY_VERSION = "3.9.0";
  const POLICY_NAME = "global_shopping_partner_link_policy_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function bool(value, fallback) { return value == null ? fallback === true : value === true; }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId || "row"),
      label:text(label || ""),
      value:text(value || ""),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
  }
  function safety() {
    return {
      fileWrite:false,
      download:false,
      realNameStored:false,
      phoneStored:false,
      emailStored:false,
      identityUpload:false,
      credentialInput:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    };
  }
  function buildPolicy(input) {
    const safe = obj(input);
    const policy = obj(safe.partnerLinkPolicy);
    const linkRelation = text(policy.linkRelation || safe.linkRelation || "unknown");
    return {
      linkRelation:/^(official|partner|affiliate|unknown)$/.test(linkRelation) ? linkRelation : "unknown",
      fixtureOnly:bool(policy.fixtureOnly, true),
      sandboxOnly:bool(policy.sandboxOnly, true),
      readOnly:bool(policy.readOnly, true),
      disabledToOpen:bool(policy.disabledToOpen, true),
      disclosesPotentialPartnerLink:bool(policy.disclosesPotentialPartnerLink, true),
      disclosesCommissionBoundary:bool(policy.disclosesCommissionBoundary, true),
      disclosesNoOfficialEndorsement:bool(policy.disclosesNoOfficialEndorsement, true),
      disclosesRealtimePriceSourceOfTruth:bool(policy.disclosesRealtimePriceSourceOfTruth, true),
      disclosesUserChecksOutOnPlatform:bool(policy.disclosesUserChecksOutOnPlatform, true),
      claimsOfficialEndorsement:bool(policy.claimsOfficialEndorsement, false),
      claimsLowestPrice:bool(policy.claimsLowestPrice, false),
      claimsLockedPrice:bool(policy.claimsLockedPrice, false),
      claimsDirectOrdering:bool(policy.claimsDirectOrdering, false)
    };
  }
  function evaluateGlobalShoppingPartnerLinkPolicy(input) {
    const safe = obj(input);
    const policy = buildPolicy(safe);
    const blockedReasons = [];

    if (!policy.fixtureOnly || !policy.sandboxOnly || !policy.readOnly || !policy.disabledToOpen) blockedReasons.push("policy_not_read_only");
    if (policy.claimsOfficialEndorsement) blockedReasons.push("official_endorsement_claim_detected");
    if (policy.claimsLowestPrice) blockedReasons.push("lowest_price_claim_detected");
    if (policy.claimsLockedPrice) blockedReasons.push("locked_price_claim_detected");
    if (policy.claimsDirectOrdering) blockedReasons.push("direct_ordering_claim_detected");
    if (safe.openExternal === true || safe.windowOpen === true) blockedReasons.push("external_open_detected");
    if (safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl) blockedReasons.push("real_transaction_url_detected");

    const health = {
      hasPartnerDisclosure:policy.disclosesPotentialPartnerLink === true,
      hasCommissionDisclosure:policy.disclosesCommissionBoundary === true,
      hasNoEndorsementDisclosure:policy.disclosesNoOfficialEndorsement === true,
      hasRealtimePriceDisclosure:policy.disclosesRealtimePriceSourceOfTruth === true,
      hasPlatformCheckoutDisclosure:policy.disclosesUserChecksOutOnPlatform === true,
      readOnlyDisabledToOpen:policy.fixtureOnly === true && policy.sandboxOnly === true && policy.readOnly === true && policy.disabledToOpen === true,
      noOfficialEndorsementClaim:policy.claimsOfficialEndorsement !== true,
      noLowestPriceClaim:policy.claimsLowestPrice !== true && policy.claimsLockedPrice !== true,
      noDirectOrderingClaim:policy.claimsDirectOrdering !== true,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true,
      noRealTransactionUrl:!(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl)
    };

    let status = "compliant";
    if (blockedReasons.length) status = "blocked";
    else if (!health.hasPartnerDisclosure || !health.hasCommissionDisclosure || !health.hasNoEndorsementDisclosure || !health.hasRealtimePriceDisclosure || !health.hasPlatformCheckoutDisclosure) status = "needs_review";

    return clone({
      policyName:POLICY_NAME,
      appVersion:GLOBAL_SHOPPING_PARTNER_LINK_POLICY_VERSION,
      status:status,
      partnerPolicy:policy,
      policyHealth:health,
      blockedReasons:blockedReasons,
      redacted:true
    });
  }
  function buildGlobalShoppingPartnerLinkPolicyRows(input) {
    const model = evaluateGlobalShoppingPartnerLinkPolicy(input || {});
    const health = model.policyHealth;
    return clone([
      row("relation", "链接关系", model.partnerPolicy.linkRelation || "unknown", "pass"),
      row("partner_disclosure", "合作链接披露", health.hasPartnerDisclosure ? "部分平台链接未来可能属于合作或联盟链接" : "仍需补充披露", health.hasPartnerDisclosure ? "pass" : "warning"),
      row("commission_disclosure", "佣金边界", health.hasCommissionDisclosure ? "Weishan 可能获得佣金，但不会因此提高展示价格" : "仍需补充披露", health.hasCommissionDisclosure ? "pass" : "warning"),
      row("endorsement_disclosure", "官方背书边界", health.hasNoEndorsementDisclosure ? "合作或联盟链接不代表平台、品牌或商家对 Weishan 的官方背书" : "仍需补充披露", health.hasNoEndorsementDisclosure ? "pass" : "warning"),
      row("realtime_price", "实时价格准绳", health.hasRealtimePriceDisclosure ? "平台页面为实时价格准绳" : "仍需补充披露", health.hasRealtimePriceDisclosure ? "pass" : "warning"),
      row("platform_checkout", "平台自行下单", health.hasPlatformCheckoutDisclosure ? "用户需在平台自行完成下单" : "仍需补充披露", health.hasPlatformCheckoutDisclosure ? "pass" : "warning"),
      row("claim_boundary", "禁止误导承诺", health.noOfficialEndorsementClaim && health.noLowestPriceClaim && health.noDirectOrderingClaim ? "合作链接不代表最低价、官方背书或下单能力" : "检测到误导承诺", health.noOfficialEndorsementClaim && health.noLowestPriceClaim && health.noDirectOrderingClaim ? "pass" : "blocked"),
      row("open_boundary", "外跳边界", health.noExternalOpen && health.noRealTransactionUrl ? "当前不打开真实平台，也不生成真实交易链接" : "检测到外跳或交易链接", health.noExternalOpen && health.noRealTransactionUrl ? "pass" : "blocked")
    ]);
  }
  function sanitizeGlobalShoppingPartnerLinkPolicy(policy) {
    const safe = obj(policy);
    const evaluation = evaluateGlobalShoppingPartnerLinkPolicy(safe);
    const safeStatus = /^(compliant|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      policyName:POLICY_NAME,
      appVersion:GLOBAL_SHOPPING_PARTNER_LINK_POLICY_VERSION,
      status:safeStatus,
      partnerPolicy:evaluation.partnerPolicy,
      policyHealth:evaluation.policyHealth,
      rows:toArray(safe.rows).length ? toArray(safe.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }) : buildGlobalShoppingPartnerLinkPolicyRows(evaluation),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"合作/联盟链接政策",
        resultLabel:safeStatus === "compliant" ? "合作链接政策合规" : (safeStatus === "needs_review" ? "合作链接政策仍需复核" : "合作链接政策已阻断"),
        caveat:"合作链接不代表最低价、官方背书或下单能力。平台页面才是实时价格与最终下单地点。",
        redacted:true
      },
      safety:safety(),
      redacted:true
    });
  }
  function buildGlobalShoppingPartnerLinkPolicy(input) {
    try {
      return sanitizeGlobalShoppingPartnerLinkPolicy(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingPartnerLinkPolicy({ status:"failed_safe", blockedReasons:["failed_safe"] });
    }
  }
  function buildGlobalShoppingPartnerLinkPolicyAuditDraft(input) {
    const policy = buildGlobalShoppingPartnerLinkPolicy(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PARTNER_LINK_POLICY_AUDIT_DRAFT",
      policyName:POLICY_NAME,
      appVersion:GLOBAL_SHOPPING_PARTNER_LINK_POLICY_VERSION,
      status:policy.status,
      rowCount:policy.rows.length,
      blockedReasonCount:policy.blockedReasons.length,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      fileWrite:false,
      download:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingPartnerLinkPolicy = {
    GLOBAL_SHOPPING_PARTNER_LINK_POLICY_VERSION,
    POLICY_NAME,
    buildGlobalShoppingPartnerLinkPolicy,
    evaluateGlobalShoppingPartnerLinkPolicy,
    buildGlobalShoppingPartnerLinkPolicyRows,
    buildGlobalShoppingPartnerLinkPolicyAuditDraft,
    sanitizeGlobalShoppingPartnerLinkPolicy
  };
})();
