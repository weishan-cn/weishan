;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_USER_FACING_COPY_POLISH_VERSION = "4.2.5";
  const POLISH_NAME = "global_shopping_public_beta_user_facing_copy_polish_v1";
  const FORBIDDEN_COPY = [
    "全网最低",
    "最低价保证",
    "已锁价",
    "真实最终价",
    "官方背书",
    "平台授权",
    "已完成真实接入",
    "立即购买",
    "直接下单",
    "一键下单",
    "一键出票",
    "授权付款",
    "创建订单"
  ];

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|externalUrl|platformUrl|providerUrl|endpoint|providerClient|rawTrace|rawResponse|rawRequest|rawUserText/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe|pass|warning|fail)$/.test(text(value)) ? text(value) : "needs_review"; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function section(sectionId, label, status, summary, caveat) {
    return { sectionId:text(sectionId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function labelOf(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }
  function safety() {
    return {
      rawUserTextStored:false,
      rawResponseStored:false,
      rawRequestStored:false,
      externalUrl:null,
      platformUrl:null,
      providerUrl:null,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      buyButtonEnabled:false,
      checkoutButtonEnabled:false,
      paymentButtonEnabled:false,
      redacted:true
    };
  }
  function blockedReasons(input) {
    const safe = obj(input);
    const candidates = toArray(safe.copyCandidates || safe.userFacingCopyCandidates || safe.publicCopyCandidates).map(text);
    const forbiddenDetected = FORBIDDEN_COPY.filter(function (line) {
      return candidates.some(function (candidate) { return candidate.indexOf(line) >= 0; });
    });
    return forbiddenDetected
      .map(function (line) { return "forbidden_copy:" + line; })
      .concat([
        safe.persistRawUserText === true ? "raw_user_text_persistence_detected" : "",
        safe.persistRawProviderData === true ? "raw_provider_persistence_detected" : "",
        safe.externalUrl ? "external_url_detected" : "",
        safe.platformUrl ? "platform_url_detected" : "",
        safe.providerUrl ? "provider_url_detected" : "",
        safe.bookingUrl ? "booking_url_detected" : "",
        safe.checkoutUrl ? "checkout_url_detected" : "",
        safe.paymentUrl ? "payment_url_detected" : "",
        safe.orderUrl ? "order_url_detected" : "",
        safe.payment === true ? "payment_detected" : "",
        safe.order === true ? "order_detected" : "",
        safe.checkout === true ? "checkout_detected" : "",
        safe.ticketing === true ? "ticketing_detected" : "",
        safe.buyButtonEnabled === true ? "buy_button_enabled_detected" : "",
        safe.checkoutButtonEnabled === true ? "checkout_button_enabled_detected" : "",
        safe.paymentButtonEnabled === true ? "payment_button_enabled_detected" : "",
        safe.download === true ? "download_detected" : "",
        safe.export === true ? "export_detected" : "",
        safe.openExternal === true ? "open_external_detected" : "",
        safe.windowOpen === true ? "window_open_detected" : ""
      ].filter(Boolean));
  }

  function buildGlobalShoppingPublicBetaUserFacingCopySections(input) {
    const safe = obj(input);
    const publicBetaShellSummary = resolveSummary(safe, "globalShoppingReadOnlyPublicBetaShellSummary", "WeishanGlobalShoppingReadOnlyPublicBetaShell", "buildGlobalShoppingReadOnlyPublicBetaShell");
    const publicBetaSafetyCopyCenterSummary = resolveSummary(safe, "publicBetaSafetyCopyCenterSummary", "WeishanGlobalShoppingPublicBetaSafetyCopyCenter", "buildGlobalShoppingPublicBetaSafetyCopyCenter");
    const userTrustLaunchBoardSummary = resolveSummary(safe, "userTrustLaunchBoardSummary", "WeishanGlobalShoppingUserTrustLaunchBoard", "buildGlobalShoppingUserTrustLaunchBoard");
    const candidateEvidenceSummary = resolveSummary(safe, "globalShoppingReadOnlyCandidateEvidenceUnifierSummary", "WeishanGlobalShoppingReadOnlyCandidateEvidenceUnifier", "buildGlobalShoppingReadOnlyCandidateEvidenceUnifier");
    const feeNormalizationSummary = resolveSummary(safe, "globalShoppingFeeNormalizationViewSummary", "WeishanGlobalShoppingFeeNormalizationView", "buildGlobalShoppingFeeNormalizationView");
    const officialAnchorSummary = resolveSummary(safe, "globalShoppingOfficialAnchorComparisonViewSummary", "WeishanGlobalShoppingOfficialAnchorComparisonView", "buildGlobalShoppingOfficialAnchorComparisonView");
    return clone([
      section("global_shopping_public_beta_shell", "只读候选价", publicBetaShellSummary.status, labelOf(publicBetaShellSummary, "Global Shopping Read-Only Public Beta Shell 仍需复核"), "当前只展示候选价证据，不会付款、下单或出票。"),
      section("global_shopping_candidate_evidence", "候选价证据", candidateEvidenceSummary.status, labelOf(candidateEvidenceSummary, "候选价证据仍需复核"), "来源与时间、可信度、风险说明仅用于辅助复核。"),
      section("global_shopping_fee_normalization", "费用归一化", feeNormalizationSummary.status, labelOf(feeNormalizationSummary, "费用归一化仍需复核"), "归一化价格仅用于辅助比较，不代表真实最终价。"),
      section("global_shopping_official_anchor", "官方价锚点", officialAnchorSummary.status, labelOf(officialAnchorSummary, "官方价锚点仍需复核"), "官方价锚点仅作只读对比参考，以平台实时页面为准。"),
      section("global_shopping_public_beta_safety_copy", "平台实时页面为准", publicBetaSafetyCopyCenterSummary.status, labelOf(publicBetaSafetyCopyCenterSummary, "Public Beta Safety Copy Center 仍需复核"), "价格、税费和规则以平台实时页面为准。"),
      section("global_shopping_public_beta_user_trust_launch", "请在对应平台自行确认价格并完成下单", userTrustLaunchBoardSummary.status, labelOf(userTrustLaunchBoardSummary, "User Trust Launch Board 仍需复核"), "Weishan 不替用户登录、付款、下单或出票。")
    ]);
  }

  function buildGlobalShoppingPublicBetaUserFacingCopyRows(input) {
    const safe = obj(input);
    const sections = toArray(safe.userFacingCopySections).length ? toArray(safe.userFacingCopySections) : buildGlobalShoppingPublicBetaUserFacingCopySections(safe);
    return clone([
      row("public_beta_user_facing_copy_polish_status", "全球购 Public Beta", obj(safe.userFacingSummary).resultLabel || "全球购 Public Beta 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("public_beta_user_facing_copy_polish_candidate", "只读候选价", "当前仍为只读候选证据", "pass"),
      row("public_beta_user_facing_copy_polish_candidate_evidence", "候选价证据", "来源与时间 / 可信度 / 风险说明", "pass"),
      row("public_beta_user_facing_copy_polish_anchor", "官方价锚点", "与官方价对比", "pass"),
      row("public_beta_user_facing_copy_polish_fee", "费用归一化", "费用归一化", "pass"),
      row("public_beta_user_facing_copy_polish_fee_disclosure", "价格说明", "归一化价格仅用于辅助比较 / 不代表真实最终价", "pass"),
      row("public_beta_user_facing_copy_polish_realtime", "平台实时页面为准", "价格以跳转后平台实时页面为准", "pass"),
      row("public_beta_user_facing_copy_polish_guard", "当前不提供付款、下单或出票能力", "当前不提供付款、下单或出票能力", "pass")
    ].concat(sections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingPublicBetaUserFacingCopyPolish(input) {
    const safe = obj(input);
    const publicBetaShellSummary = resolveSummary(safe, "globalShoppingReadOnlyPublicBetaShellSummary", "WeishanGlobalShoppingReadOnlyPublicBetaShell", "buildGlobalShoppingReadOnlyPublicBetaShell");
    const publicBetaSafetyCopyCenterSummary = resolveSummary(safe, "publicBetaSafetyCopyCenterSummary", "WeishanGlobalShoppingPublicBetaSafetyCopyCenter", "buildGlobalShoppingPublicBetaSafetyCopyCenter");
    const userTrustLaunchBoardSummary = resolveSummary(safe, "userTrustLaunchBoardSummary", "WeishanGlobalShoppingUserTrustLaunchBoard", "buildGlobalShoppingUserTrustLaunchBoard");
    const candidateEvidenceSummary = resolveSummary(safe, "globalShoppingReadOnlyCandidateEvidenceUnifierSummary", "WeishanGlobalShoppingReadOnlyCandidateEvidenceUnifier", "buildGlobalShoppingReadOnlyCandidateEvidenceUnifier");
    const feeNormalizationSummary = resolveSummary(safe, "globalShoppingFeeNormalizationViewSummary", "WeishanGlobalShoppingFeeNormalizationView", "buildGlobalShoppingFeeNormalizationView");
    const officialAnchorSummary = resolveSummary(safe, "globalShoppingOfficialAnchorComparisonViewSummary", "WeishanGlobalShoppingOfficialAnchorComparisonView", "buildGlobalShoppingOfficialAnchorComparisonView");
    const statuses = [
      safeStatus(publicBetaShellSummary.status),
      safeStatus(publicBetaSafetyCopyCenterSummary.status),
      safeStatus(userTrustLaunchBoardSummary.status),
      safeStatus(candidateEvidenceSummary.status),
      safeStatus(feeNormalizationSummary.status),
      safeStatus(officialAnchorSummary.status)
    ];
    const directBlockedReasons = blockedReasons(safe);
    const status = directBlockedReasons.length || statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0
      ? "blocked"
      : (!present(publicBetaShellSummary) || !present(publicBetaSafetyCopyCenterSummary) || !present(userTrustLaunchBoardSummary) || !present(candidateEvidenceSummary) || !present(feeNormalizationSummary) || !present(officialAnchorSummary) || statuses.indexOf("needs_review") >= 0
        ? "needs_review"
        : "ready");
    const userFacingSummary = {
      title:"全球购 Public Beta",
      resultLabel:status === "ready" ? "全球购 Public Beta 已准备" : (status === "blocked" ? "全球购 Public Beta 已阻断" : "全球购 Public Beta 仍需复核"),
      caveat:"当前只提供只读候选价展示，平台实时页面为准。"
    };
    return clone({
      polishName:POLISH_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_USER_FACING_COPY_POLISH_VERSION,
      status:status,
      userFacingSummary:userFacingSummary,
      userFacingCopySections:buildGlobalShoppingPublicBetaUserFacingCopySections({
        globalShoppingReadOnlyPublicBetaShellSummary:publicBetaShellSummary,
        globalShoppingReadOnlyCandidateEvidenceUnifierSummary:candidateEvidenceSummary,
        globalShoppingFeeNormalizationViewSummary:feeNormalizationSummary,
        globalShoppingOfficialAnchorComparisonViewSummary:officialAnchorSummary,
        publicBetaSafetyCopyCenterSummary:publicBetaSafetyCopyCenterSummary,
        userTrustLaunchBoardSummary:userTrustLaunchBoardSummary
      }),
      rows:buildGlobalShoppingPublicBetaUserFacingCopyRows({
        status:status,
        userFacingSummary:userFacingSummary,
        userFacingCopySections:buildGlobalShoppingPublicBetaUserFacingCopySections({
          globalShoppingReadOnlyPublicBetaShellSummary:publicBetaShellSummary,
          globalShoppingReadOnlyCandidateEvidenceUnifierSummary:candidateEvidenceSummary,
          globalShoppingFeeNormalizationViewSummary:feeNormalizationSummary,
          globalShoppingOfficialAnchorComparisonViewSummary:officialAnchorSummary,
          publicBetaSafetyCopyCenterSummary:publicBetaSafetyCopyCenterSummary,
          userTrustLaunchBoardSummary:userTrustLaunchBoardSummary
        })
      }),
      globalShoppingReadOnlyCandidateEvidenceUnifierSummary:clone(candidateEvidenceSummary),
      globalShoppingFeeNormalizationViewSummary:clone(feeNormalizationSummary),
      globalShoppingOfficialAnchorComparisonViewSummary:clone(officialAnchorSummary),
      blockedReasons:directBlockedReasons,
      globalShoppingReadOnlyPublicBetaShellSummary:clone(publicBetaShellSummary),
      publicBetaSafetyCopyCenterSummary:clone(publicBetaSafetyCopyCenterSummary),
      userTrustLaunchBoardSummary:clone(userTrustLaunchBoardSummary),
      externalUrl:null,
      platformUrl:null,
      providerUrl:null,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      buyButtonEnabled:false,
      checkoutButtonEnabled:false,
      paymentButtonEnabled:false,
      safety:safety(),
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaUserFacingCopyPolish(copy) {
    return evaluateGlobalShoppingPublicBetaUserFacingCopyPolish(copy || {});
  }

  function buildGlobalShoppingPublicBetaUserFacingCopyPolish(input) {
    try {
      return evaluateGlobalShoppingPublicBetaUserFacingCopyPolish(input || {});
    } catch (_) {
      return evaluateGlobalShoppingPublicBetaUserFacingCopyPolish({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaUserFacingCopyPolish = {
    GLOBAL_SHOPPING_PUBLIC_BETA_USER_FACING_COPY_POLISH_VERSION,
    POLISH_NAME,
    buildGlobalShoppingPublicBetaUserFacingCopyPolish,
    evaluateGlobalShoppingPublicBetaUserFacingCopyPolish,
    buildGlobalShoppingPublicBetaUserFacingCopyRows,
    buildGlobalShoppingPublicBetaUserFacingCopySections,
    sanitizeGlobalShoppingPublicBetaUserFacingCopyPolish
  };
})();
