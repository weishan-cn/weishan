;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_SAFETY_COPY_CENTER_VERSION = "4.2.0";
  const CENTER_NAME = "global_shopping_public_beta_safety_copy_center_v1";
  const ALLOWED_COPY = [
    "当前仍为只读候选证据",
    "来源与时间",
    "可信度",
    "风险说明",
    "与官方价对比",
    "含税/不含税",
    "含运费/不含运费",
    "服务费说明",
    "归一化价格仅用于辅助比较",
    "不代表真实最终价",
    "价格以跳转后平台实时页面为准",
    "当前不提供付款、下单或出票能力",
    "跳转至平台自行下单",
    "Weishan 可尽量带入搜索条件，但用户需在对应平台自行确认价格、登录、填写资料并完成下单"
  ];
  const FORBIDDEN_COPY = [
    "全网最低",
    "最低价保证",
    "已锁价",
    "真实最终价",
    "一键下单",
    "一键出票",
    "官方可订保证",
    "所有商品全覆盖",
    "立即购买",
    "直接下单",
    "官方背书",
    "平台授权",
    "已接入 provider",
    "可调用 provider",
    "已完成真实接入"
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
  function safeMode(value) { return /^(disabled|beta_copy_only|readonly|offline_mock)$/.test(text(value)) ? text(value) : "beta_copy_only"; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
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
  function blockedReasons(input) {
    const safe = obj(input);
    const candidateLines = toArray(safe.copyCandidates || safe.publicCopyCandidates).map(text);
    const forbiddenDetected = FORBIDDEN_COPY.filter(function (line) {
      return candidateLines.some(function (candidate) { return candidate.indexOf(line) >= 0; });
    });
    return forbiddenDetected
      .map(function (line) { return "forbidden_copy:" + line; })
      .concat([
        safe.persistRawUserText === true ? "raw_user_text_persistence_detected" : "",
        safe.persistRawProviderData === true ? "raw_provider_persistence_detected" : "",
        safe.writeFile === true ? "file_write_detected" : "",
        safe.download === true ? "download_detected" : "",
        safe.upload === true ? "upload_detected" : "",
        safe.mail === true ? "mail_detected" : "",
        safe.openExternalDocument === true ? "external_document_detected" : "",
        safe.provider === true ? "provider_detected" : "",
        safe.readApiKey === true ? "api_key_read_detected" : "",
        safe.network === true ? "network_detected" : "",
        safe.createRelease === true ? "release_creation_detected" : "",
        safe.createTag === true ? "tag_creation_detected" : "",
        safe.push === true ? "push_detected" : ""
      ].filter(Boolean));
  }
  function safety() {
    return {
      fileWrite:false,
      download:false,
      upload:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      rawRequestStored:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      externalUrl:null,
      platformUrl:null,
      providerUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      buyButtonEnabled:false,
      checkoutButtonEnabled:false,
      paymentButtonEnabled:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    };
  }

  function buildGlobalShoppingPublicBetaSafetyCopyRules(input) {
    const safe = obj(input);
    const publicBetaShellSummary = resolveSummary(safe, "globalShoppingReadOnlyPublicBetaShellSummary", "WeishanGlobalShoppingReadOnlyPublicBetaShell", "buildGlobalShoppingReadOnlyPublicBetaShell");
    const providerZeroRuntimeLockSummary = resolveSummary(safe, "providerZeroRuntimeLockSummary", "WeishanGlobalShoppingProviderZeroRuntimeLock", "buildGlobalShoppingProviderZeroRuntimeLock");
    const userTrustLaunchBoardSummary = resolveSummary(safe, "userTrustLaunchBoardSummary", "WeishanGlobalShoppingUserTrustLaunchBoard", "buildGlobalShoppingUserTrustLaunchBoard");
    const userSafePublicClaimVerifierSummary = resolveSummary(safe, "userSafePublicClaimVerifierSummary", "WeishanGlobalShoppingUserSafePublicClaimVerifier", "buildGlobalShoppingUserSafePublicClaimVerifier");
    const publicSafetyStatementPreviewSummary = resolveSummary(safe, "publicSafetyStatementPreviewSummary", "WeishanGlobalShoppingPublicSafetyStatementPreview", "buildGlobalShoppingPublicSafetyStatementPreview");
    const rows = [
      row("public_beta_shell", "Global Shopping Read-Only Public Beta Shell", labelOf(publicBetaShellSummary, "Global Shopping Read-Only Public Beta Shell 仍需复核"), safeStatus(publicBetaShellSummary.status) === "ready" ? "pass" : (safeStatus(publicBetaShellSummary.status) === "blocked" ? "blocked" : "warning")),
      row("provider_zero_runtime_lock", "Provider-Zero Runtime Lock", labelOf(providerZeroRuntimeLockSummary, "Provider-Zero Runtime Lock 仍需复核"), safeStatus(providerZeroRuntimeLockSummary.status) === "ready" ? "pass" : (safeStatus(providerZeroRuntimeLockSummary.status) === "blocked" ? "blocked" : "warning")),
      row("user_trust_launch_board", "User Trust Launch Board", labelOf(userTrustLaunchBoardSummary, "User Trust Launch Board 仍需复核"), safeStatus(userTrustLaunchBoardSummary.status) === "ready" ? "pass" : (safeStatus(userTrustLaunchBoardSummary.status) === "blocked" ? "blocked" : "warning")),
      row("user_safe_public_claim_verifier", "User-Safe Public Claim Verifier", labelOf(userSafePublicClaimVerifierSummary, "User-Safe Public Claim Verifier 仍需复核"), safeStatus(userSafePublicClaimVerifierSummary.status) === "ready" ? "pass" : (safeStatus(userSafePublicClaimVerifierSummary.status) === "blocked" ? "blocked" : "warning")),
      row("public_safety_statement_preview", "Public Safety Statement Preview", labelOf(publicSafetyStatementPreviewSummary, "Public Safety Statement Preview 仍需复核"), safeStatus(publicSafetyStatementPreviewSummary.status) === "ready" ? "pass" : (safeStatus(publicSafetyStatementPreviewSummary.status) === "blocked" ? "blocked" : "warning"))
    ];
    ALLOWED_COPY.forEach(function (line, index) {
      rows.push(row("allowed_copy_" + index, "允许文案", line, "pass"));
    });
    return clone(rows);
  }

  function buildGlobalShoppingPublicBetaSafetyCopyRows(input) {
    const safe = obj(input);
    const rules = toArray(safe.publicBetaSafetyCopyRules).length ? toArray(safe.publicBetaSafetyCopyRules) : buildGlobalShoppingPublicBetaSafetyCopyRules(safe);
    return clone([
      row("public_beta_safety_copy_center_status", "Public Beta Safety Copy Center", obj(safe.userFacingSummary).resultLabel || "Public Beta Safety Copy Center 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("public_beta_safety_copy_center_boundary", "Safety Copy 边界", "当前只展示 public beta safety copy center。", "pass"),
      row("public_beta_safety_copy_center_guard", "只读说明", "Safety Copy 不承诺最低价、最终价或官方背书，平台实时页面为准，当前不提供付款、下单或出票能力。", "pass")
    ].concat(rules));
  }

  function evaluateGlobalShoppingPublicBetaSafetyCopyCenter(input) {
    const safe = obj(input);
    const publicBetaShellSummary = resolveSummary(safe, "globalShoppingReadOnlyPublicBetaShellSummary", "WeishanGlobalShoppingReadOnlyPublicBetaShell", "buildGlobalShoppingReadOnlyPublicBetaShell");
    const providerZeroRuntimeLockSummary = resolveSummary(safe, "providerZeroRuntimeLockSummary", "WeishanGlobalShoppingProviderZeroRuntimeLock", "buildGlobalShoppingProviderZeroRuntimeLock");
    const userTrustLaunchBoardSummary = resolveSummary(safe, "userTrustLaunchBoardSummary", "WeishanGlobalShoppingUserTrustLaunchBoard", "buildGlobalShoppingUserTrustLaunchBoard");
    const userSafePublicClaimVerifierSummary = resolveSummary(safe, "userSafePublicClaimVerifierSummary", "WeishanGlobalShoppingUserSafePublicClaimVerifier", "buildGlobalShoppingUserSafePublicClaimVerifier");
    const publicSafetyStatementPreviewSummary = resolveSummary(safe, "publicSafetyStatementPreviewSummary", "WeishanGlobalShoppingPublicSafetyStatementPreview", "buildGlobalShoppingPublicSafetyStatementPreview");
    const rules = buildGlobalShoppingPublicBetaSafetyCopyRules({
      globalShoppingReadOnlyPublicBetaShellSummary:publicBetaShellSummary,
      providerZeroRuntimeLockSummary:providerZeroRuntimeLockSummary,
      userTrustLaunchBoardSummary:userTrustLaunchBoardSummary,
      userSafePublicClaimVerifierSummary:userSafePublicClaimVerifierSummary,
      publicSafetyStatementPreviewSummary:publicSafetyStatementPreviewSummary
    });
    const statuses = [
      safeStatus(publicBetaShellSummary.status),
      safeStatus(providerZeroRuntimeLockSummary.status),
      safeStatus(userTrustLaunchBoardSummary.status),
      safeStatus(userSafePublicClaimVerifierSummary.status),
      safeStatus(publicSafetyStatementPreviewSummary.status)
    ];
    const directBlockedReasons = blockedReasons(safe);
    const blocked = directBlockedReasons.length || statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const needsReview =
      !present(publicBetaShellSummary) ||
      !present(providerZeroRuntimeLockSummary) ||
      !present(userTrustLaunchBoardSummary) ||
      !present(userSafePublicClaimVerifierSummary) ||
      !present(publicSafetyStatementPreviewSummary) ||
      statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_SAFETY_COPY_CENTER_VERSION,
      status:status,
      centerMode:safeMode(safe.centerMode),
      publicBetaSafetyCopyCenterBoundary:{
        betaCopyOnly:true,
        offlineMock:true,
        readOnly:true,
        canUseForbiddenPublicClaim:false,
        canStoreRawUserText:false,
        canStoreRawProviderData:false,
        canWriteFile:false,
        canDownload:false,
        canUpload:false,
        canSendMail:false,
        canOpenExternalDocument:false,
        canUseProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false
      },
      publicBetaSafetyCopyRules:rules,
      allowedCopy:clone(ALLOWED_COPY),
      forbiddenCopyCategories:["price_claim", "ordering_claim", "endorsement_claim", "provider_connection_claim"],
      blockedReasons:directBlockedReasons,
      userFacingSummary:{
        title:"Public Beta Safety Copy Center",
        resultLabel:status === "ready" ? "Public Beta Safety Copy Center 已准备" : (status === "blocked" ? "Public Beta Safety Copy Center 已阻断" : "Public Beta Safety Copy Center 仍需复核"),
        caveat:"Safety Copy 不承诺最低价、最终价或官方背书，平台实时页面为准。"
      },
      rows:buildGlobalShoppingPublicBetaSafetyCopyRows({ status:status, userFacingSummary:{ resultLabel:status === "ready" ? "Public Beta Safety Copy Center 已准备" : (status === "blocked" ? "Public Beta Safety Copy Center 已阻断" : "Public Beta Safety Copy Center 仍需复核") }, publicBetaSafetyCopyRules:rules }),
      safety:safety(),
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
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaSafetyCopyCenterAuditDraft(input) {
    const center = buildGlobalShoppingPublicBetaSafetyCopyCenter(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_SAFETY_COPY_CENTER_AUDIT_DRAFT",
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_SAFETY_COPY_CENTER_VERSION,
      status:center.status,
      ruleCount:toArray(center.publicBetaSafetyCopyRules).length,
      blockedReasonCount:toArray(center.blockedReasons).length,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      externalUrl:null,
      platformUrl:null,
      providerUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      buyButtonEnabled:false,
      checkoutButtonEnabled:false,
      paymentButtonEnabled:false,
      autoOpen:false,
      autoRefresh:false,
      fileWrite:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      rawRequestStored:false,
      secretStored:false,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaSafetyCopyCenter(center) {
    return evaluateGlobalShoppingPublicBetaSafetyCopyCenter(center || {});
  }

  function buildGlobalShoppingPublicBetaSafetyCopyCenter(input) {
    try {
      return evaluateGlobalShoppingPublicBetaSafetyCopyCenter(input || {});
    } catch (_) {
      return evaluateGlobalShoppingPublicBetaSafetyCopyCenter({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaSafetyCopyCenter = {
    GLOBAL_SHOPPING_PUBLIC_BETA_SAFETY_COPY_CENTER_VERSION,
    CENTER_NAME,
    buildGlobalShoppingPublicBetaSafetyCopyCenter,
    evaluateGlobalShoppingPublicBetaSafetyCopyCenter,
    buildGlobalShoppingPublicBetaSafetyCopyRows,
    buildGlobalShoppingPublicBetaSafetyCopyRules,
    buildGlobalShoppingPublicBetaSafetyCopyCenterAuditDraft,
    sanitizeGlobalShoppingPublicBetaSafetyCopyCenter
  };
})();
