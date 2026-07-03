;(function () {
  "use strict";

  const GLOBAL_SHOPPING_RELEASE_CANDIDATE_CONFIDENCE_BOARD_VERSION = "4.0.5";
  const BOARD_NAME = "global_shopping_release_candidate_confidence_board_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, rc_confidence_only:true };

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|endpoint|providerClient|rawRequest|rawResponse/ig, "redacted")
      .trim();
  }
  function bool(value) { return value === true; }
  function safeMode(value) {
    const mode = text(value || "rc_confidence_only");
    return ALLOWED_MODES[mode] ? mode : "rc_confidence_only";
  }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId),
      label:text(label),
      value:text(value),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
  }
  function blockedReasons(input) {
    const safe = obj(input);
    const reasons = [];
    if (safe.appVersion && text(safe.appVersion) !== GLOBAL_SHOPPING_RELEASE_CANDIDATE_CONFIDENCE_BOARD_VERSION) reasons.push("app_version_mismatch");
    if (safe.release === true || safe.createRelease === true) reasons.push("release_detected");
    if (safe.tag === true || safe.createTag === true) reasons.push("tag_detected");
    if (safe.push === true) reasons.push("push_detected");
    if (safe.fileWrite === true || safe.writeFile === true) reasons.push("file_write_detected");
    if (safe.provider === true || safe.enableProvider === true) reasons.push("provider_detected");
    if (safe.network === true) reasons.push("network_detected");
    if (safe.readApiKey === true || safe.key === true) reasons.push("key_detected");
    if (safe.endpoint === true || safe.providerClient === true) reasons.push("endpoint_detected");
    if (safe.openExternal === true || safe.windowOpen === true) reasons.push("external_open_detected");
    if (safe.payment === true || safe.order === true || safe.ticketing === true || safe.checkout === true || safe.booking === true) reasons.push("transaction_detected");
    if (safe.persistRawProviderData === true || safe.persistRawUserText === true || safe.noRawPersistence === false) reasons.push("raw_persistence_detected");
    if (safe.externalUrl != null || safe.platformUrl != null || safe.providerUrl != null) reasons.push("external_url_detected");
    if (safe.bookingUrl != null || safe.checkoutUrl != null || safe.paymentUrl != null || safe.orderUrl != null) reasons.push("transaction_url_detected");
    if (safe.buyButtonEnabled === true || safe.checkoutButtonEnabled === true || safe.paymentButtonEnabled === true) reasons.push("transaction_button_enabled");
    return reasons;
  }
  function buildBoolRow(rowId, label, value, readyLabel, warningLabel) {
    return row(rowId, label, value ? readyLabel : warningLabel, value ? "pass" : "warning");
  }

  function evaluateGlobalShoppingReleaseCandidateConfidenceBoard(input) {
    const safe = obj(input);
    const blocked = blockedReasons(safe);
    const providerZeroLocked = safe.providerZeroLocked !== false;
    const noNetwork = safe.noNetwork !== false;
    const noKey = safe.noKey !== false;
    const noEndpoint = safe.noEndpoint !== false;
    const noExternalOpen = safe.noExternalOpen !== false;
    const noPayment = safe.noPayment !== false;
    const noOrder = safe.noOrder !== false;
    const noTicketing = safe.noTicketing !== false;
    const noRawPersistence = safe.noRawPersistence !== false;
    const safetyCopyClean = bool(safe.safetyCopyClean);
    const candidateEvidenceReady = bool(safe.candidateEvidenceReady);
    const feeNormalizationReady = bool(safe.feeNormalizationReady);
    const officialAnchorReady = bool(safe.officialAnchorReady);
    const userBoundaryClear = bool(safe.userBoundaryClear);
    const manualReviewRequired = safe.manualReviewRequired !== false;
    const hardBlocked =
      !providerZeroLocked ||
      !noNetwork ||
      !noKey ||
      !noEndpoint ||
      !noExternalOpen ||
      !noPayment ||
      !noOrder ||
      !noTicketing ||
      !noRawPersistence;
    const needsReview =
      !safetyCopyClean ||
      !candidateEvidenceReady ||
      !feeNormalizationReady ||
      !officialAnchorReady ||
      !userBoundaryClear ||
      manualReviewRequired !== true;
    const status = blocked.length || hardBlocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_RELEASE_CANDIDATE_CONFIDENCE_BOARD_VERSION,
      status:status,
      boardMode:safeMode(safe.boardMode),
      title:"RC Confidence Board",
      rows:buildGlobalShoppingReleaseCandidateConfidenceRows({
        providerZeroLocked,
        noNetwork,
        noKey,
        noEndpoint,
        noExternalOpen,
        noPayment,
        noOrder,
        noTicketing,
        noRawPersistence,
        safetyCopyClean,
        candidateEvidenceReady,
        feeNormalizationReady,
        officialAnchorReady,
        userBoundaryClear,
        manualReviewRequired,
        status
      }),
      sections:buildGlobalShoppingReleaseCandidateConfidenceSections({
        providerZeroLocked,
        noNetwork,
        noKey,
        noEndpoint,
        noExternalOpen,
        noPayment,
        noOrder,
        noTicketing,
        noRawPersistence,
        safetyCopyClean,
        candidateEvidenceReady,
        feeNormalizationReady,
        officialAnchorReady,
        userBoundaryClear,
        manualReviewRequired
      }),
      blockedReasons:blocked,
      userFacingSummary:{
        title:"RC Confidence Board",
        resultLabel:status === "ready" ? "RC Confidence Board 已准备" : (status === "blocked" ? "RC Confidence Board 已阻断" : "RC Confidence Board 仍需复核"),
        caveat:"下一步仍需人工复核。"
      },
      providerZeroLocked,
      noNetwork,
      noKey,
      noEndpoint,
      noExternalOpen,
      noPayment,
      noOrder,
      noTicketing,
      noRawPersistence,
      safetyCopyClean,
      candidateEvidenceReady,
      feeNormalizationReady,
      officialAnchorReady,
      userBoundaryClear,
      manualReviewRequired,
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

  function buildGlobalShoppingReleaseCandidateConfidenceRows(input) {
    const safe = obj(input);
    const status = text(safe.status || "needs_review");
    return clone([
      row("rc_confidence_status", "RC Confidence Board", status === "ready" ? "RC Confidence Board 已准备" : (status === "blocked" ? "RC Confidence Board 已阻断" : "RC Confidence Board 仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      buildBoolRow("provider_zero_locked", "Provider-Zero 已锁定", safe.providerZeroLocked === true, "Provider-Zero 已锁定", "Provider-Zero 未锁定"),
      buildBoolRow("no_network", "未联网", safe.noNetwork === true, "未联网", "存在联网风险"),
      buildBoolRow("no_key", "未读取密钥", safe.noKey === true, "未读取密钥", "存在密钥风险"),
      buildBoolRow("no_endpoint", "未生成 endpoint", safe.noEndpoint === true, "未生成 endpoint", "存在 endpoint 风险"),
      buildBoolRow("no_external_open", "未打开外部平台", safe.noExternalOpen === true, "未打开外部平台", "存在外部打开风险"),
      buildBoolRow("no_payment", "未启用付款", safe.noPayment === true, "未启用付款", "存在付款风险"),
      buildBoolRow("no_order", "未创建订单", safe.noOrder === true, "未创建订单", "存在订单风险"),
      buildBoolRow("no_ticketing", "未出票", safe.noTicketing === true, "未出票", "存在出票风险"),
      buildBoolRow("no_raw_persistence", "未保存 raw provider 数据", safe.noRawPersistence === true, "未保存 raw provider 数据", "存在 raw persistence 风险"),
      buildBoolRow("safety_copy_clean", "安全文案通过", safe.safetyCopyClean === true, "安全文案通过", "安全文案仍需复核"),
      buildBoolRow("candidate_evidence_ready", "候选价证据已准备", safe.candidateEvidenceReady === true, "候选价证据已准备", "候选价证据仍需复核"),
      buildBoolRow("fee_normalization_ready", "费用归一化已准备", safe.feeNormalizationReady === true, "费用归一化已准备", "费用归一化仍需复核"),
      buildBoolRow("official_anchor_ready", "官方价锚点已准备", safe.officialAnchorReady === true, "官方价锚点已准备", "官方价锚点仍需复核"),
      buildBoolRow("user_boundary_clear", "用户边界清晰", safe.userBoundaryClear === true, "用户边界清晰", "用户边界仍需复核"),
      buildBoolRow("manual_review_required", "下一步仍需人工复核", safe.manualReviewRequired === true, "下一步仍需人工复核", "人工复核要求缺失")
    ]);
  }

  function buildGlobalShoppingReleaseCandidateConfidenceSections(input) {
    const rows = buildGlobalShoppingReleaseCandidateConfidenceRows(input || {});
    return clone([
      { sectionId:"locked_capabilities", title:"Locked Capabilities", rows:rows.slice(1, 10), redacted:true },
      { sectionId:"user_boundary", title:"User Boundary", rows:rows.slice(10), redacted:true }
    ]);
  }

  function buildGlobalShoppingReleaseCandidateConfidenceAuditDraft(input) {
    const safe = obj(input);
    return clone({
      eventType:"GLOBAL_SHOPPING_RELEASE_CANDIDATE_CONFIDENCE_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_RELEASE_CANDIDATE_CONFIDENCE_BOARD_VERSION,
      status:text(safe.status || "needs_review"),
      rowCount:toArray(safe.rows).length,
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

  function sanitizeGlobalShoppingReleaseCandidateConfidenceBoard(board) {
    return evaluateGlobalShoppingReleaseCandidateConfidenceBoard(board || {});
  }

  function buildGlobalShoppingReleaseCandidateConfidenceBoard(input) {
    try {
      return evaluateGlobalShoppingReleaseCandidateConfidenceBoard(input || {});
    } catch (_) {
      return evaluateGlobalShoppingReleaseCandidateConfidenceBoard({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingReleaseCandidateConfidenceBoard = {
    GLOBAL_SHOPPING_RELEASE_CANDIDATE_CONFIDENCE_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingReleaseCandidateConfidenceBoard,
    evaluateGlobalShoppingReleaseCandidateConfidenceBoard,
    buildGlobalShoppingReleaseCandidateConfidenceRows,
    buildGlobalShoppingReleaseCandidateConfidenceSections,
    buildGlobalShoppingReleaseCandidateConfidenceAuditDraft,
    sanitizeGlobalShoppingReleaseCandidateConfidenceBoard
  };
})();
