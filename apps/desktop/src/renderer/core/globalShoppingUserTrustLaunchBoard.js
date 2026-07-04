;(function () {
  "use strict";

  const GLOBAL_SHOPPING_USER_TRUST_LAUNCH_BOARD_VERSION = "4.2.4";
  const BOARD_NAME = "global_shopping_user_trust_launch_board_v1";

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
  function safeMode(value) { return /^(disabled|trust_launch_board_only|readonly|offline_mock)$/.test(text(value)) ? text(value) : "trust_launch_board_only"; }
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
  function blockedReasons(input) {
    const safe = obj(input);
    return [
      safe.executeRealLaunch === true ? "real_launch_detected" : "",
      safe.persistLaunchResult === true ? "launch_persistence_detected" : "",
      safe.generateRealUserAssurance === true ? "real_user_assurance_detected" : "",
      safe.generateRealPublicClaim === true ? "real_public_claim_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.mail === true ? "mail_detected" : "",
      safe.openExternalDocument === true ? "external_document_detected" : "",
      safe.persistRawUserText === true ? "raw_user_text_persistence_detected" : "",
      safe.persistRawProviderData === true ? "raw_provider_persistence_detected" : "",
      safe.provider === true ? "provider_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : ""
    ].filter(Boolean);
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

  function buildGlobalShoppingUserTrustLaunchBoardSections(input) {
    const safe = obj(input);
    const publicBetaShellSummary = resolveSummary(safe, "globalShoppingReadOnlyPublicBetaShellSummary", "WeishanGlobalShoppingReadOnlyPublicBetaShell", "buildGlobalShoppingReadOnlyPublicBetaShell");
    const providerZeroRuntimeLockSummary = resolveSummary(safe, "providerZeroRuntimeLockSummary", "WeishanGlobalShoppingProviderZeroRuntimeLock", "buildGlobalShoppingProviderZeroRuntimeLock");
    const finalUserTrustSummarySummary = resolveSummary(safe, "finalUserTrustSummarySummary", "WeishanGlobalShoppingFinalUserTrustSummary", "buildGlobalShoppingFinalUserTrustSummary");
    const userVisibleSafetyBoundaryExplainerSummary = resolveSummary(safe, "userVisibleSafetyBoundaryExplainerSummary", "WeishanGlobalShoppingUserVisibleSafetyBoundaryExplainer", "buildGlobalShoppingUserVisibleSafetyBoundaryExplainer");
    const publicSafetyStatementPreviewSummary = resolveSummary(safe, "publicSafetyStatementPreviewSummary", "WeishanGlobalShoppingPublicSafetyStatementPreview", "buildGlobalShoppingPublicSafetyStatementPreview");
    return clone([
      section("global_shopping_read_only_public_beta_shell", "Global Shopping Read-Only Public Beta Shell", publicBetaShellSummary.status, labelOf(publicBetaShellSummary, "Global Shopping Read-Only Public Beta Shell 仍需复核"), "Public Beta 只提供候选价证据。"),
      section("provider_zero_runtime_lock", "Provider-Zero Runtime Lock", providerZeroRuntimeLockSummary.status, labelOf(providerZeroRuntimeLockSummary, "Provider-Zero Runtime Lock 仍需复核"), "Provider-Zero Lock 不接真实 provider、不读密钥、不联网。"),
      section("final_user_trust_summary", "Final User Trust Summary", finalUserTrustSummarySummary.status, labelOf(finalUserTrustSummarySummary, "Final User Trust Summary 仍需复核"), "User Trust Launch 不生成真实用户保证书。"),
      section("user_visible_safety_boundary_explainer", "User-Visible Safety Boundary Explainer", userVisibleSafetyBoundaryExplainerSummary.status, labelOf(userVisibleSafetyBoundaryExplainerSummary, "User-Visible Safety Boundary Explainer 仍需复核"), "用户必须在平台自行确认价格、登录、填写资料并完成下单。"),
      section("public_safety_statement_preview", "Public Safety Statement Preview", publicSafetyStatementPreviewSummary.status, labelOf(publicSafetyStatementPreviewSummary, "Public Safety Statement Preview 仍需复核"), "Safety Statement 不承诺最低价、最终价或官方背书。")
    ]);
  }

  function buildGlobalShoppingUserTrustLaunchBoardChecklist(input) {
    const safe = obj(input);
    const status = safeStatus(safe.status || "needs_review");
    return clone([
      row("user_trust_launch_user_boundary", "用户确认边界", "Weishan 可尽量带入搜索条件，但用户需在对应平台自行确认价格、登录、填写资料并完成下单", status === "blocked" ? "blocked" : "pass"),
      row("user_trust_launch_price_boundary", "价格边界", "价格以跳转后平台实时页面为准", status === "blocked" ? "blocked" : "pass"),
      row("user_trust_launch_action_boundary", "交易边界", "当前仅提供只读候选证据，不提供付款、下单或出票能力", status === "blocked" ? "blocked" : "pass")
    ]);
  }

  function buildGlobalShoppingUserTrustLaunchBoardRows(input) {
    const safe = obj(input);
    const sections = toArray(safe.userTrustLaunchBoardSections).length ? toArray(safe.userTrustLaunchBoardSections) : buildGlobalShoppingUserTrustLaunchBoardSections(safe);
    const checklist = toArray(safe.userTrustLaunchBoardChecklist).length ? toArray(safe.userTrustLaunchBoardChecklist) : buildGlobalShoppingUserTrustLaunchBoardChecklist(safe);
    return clone([
      row("user_trust_launch_board_status", "User Trust Launch Board", obj(safe.userFacingSummary).resultLabel || "User Trust Launch Board 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("user_trust_launch_board_boundary", "User Trust Launch 边界", "当前只展示 user trust launch board。", "pass"),
      row("user_trust_launch_board_guard", "只读说明", "不接真实 provider，不读取密钥，不联网，不打开平台，不付款、不下单、不出票。", "pass")
    ].concat(checklist).concat(sections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingUserTrustLaunchBoard(input) {
    const safe = obj(input);
    const sections = buildGlobalShoppingUserTrustLaunchBoardSections(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedSections = sections.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewSections = sections.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedSections.length ? "blocked" : (needsReviewSections.length ? "needs_review" : "ready");
    const result = {
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_USER_TRUST_LAUNCH_BOARD_VERSION,
      status:status,
      boardMode:safeMode(safe.boardMode),
      userTrustLaunchBoardBoundary:{
        trustLaunchBoardOnly:true,
        offlineMock:true,
        readOnly:true,
        canExecuteRealLaunch:false,
        canPersistLaunchResult:false,
        canGenerateRealUserAssurance:false,
        canGenerateRealPublicClaim:false,
        canWriteFile:false,
        canDownload:false,
        canUpload:false,
        canSendMail:false,
        canOpenExternalDocument:false,
        canStoreRawUserText:false,
        canStoreRawProviderData:false,
        canUseProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false
      },
      userTrustLaunchBoardSummary:{
        hasPublicBetaShell:present(resolveSummary(safe, "globalShoppingReadOnlyPublicBetaShellSummary", "WeishanGlobalShoppingReadOnlyPublicBetaShell", "buildGlobalShoppingReadOnlyPublicBetaShell")),
        hasProviderZeroRuntimeLock:present(resolveSummary(safe, "providerZeroRuntimeLockSummary", "WeishanGlobalShoppingProviderZeroRuntimeLock", "buildGlobalShoppingProviderZeroRuntimeLock")),
        hasFinalUserTrustSummary:present(resolveSummary(safe, "finalUserTrustSummarySummary", "WeishanGlobalShoppingFinalUserTrustSummary", "buildGlobalShoppingFinalUserTrustSummary")),
        hasUserVisibleSafetyBoundaryExplainer:present(resolveSummary(safe, "userVisibleSafetyBoundaryExplainerSummary", "WeishanGlobalShoppingUserVisibleSafetyBoundaryExplainer", "buildGlobalShoppingUserVisibleSafetyBoundaryExplainer")),
        hasPublicSafetyStatementPreview:present(resolveSummary(safe, "publicSafetyStatementPreviewSummary", "WeishanGlobalShoppingPublicSafetyStatementPreview", "buildGlobalShoppingPublicSafetyStatementPreview")),
        sectionCount:sections.length,
        needsReviewSectionCount:needsReviewSections.length,
        blockedSectionCount:directBlockedReasons.length + blockedSections.length,
        readyForPublicBetaSafetyCopyCenter:status === "ready"
      },
      userTrustLaunchBoardSections:sections,
      userTrustLaunchBoardChecklist:[],
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"User Trust Launch Board",
        resultLabel:status === "ready" ? "User Trust Launch Board 已准备" : (status === "blocked" ? "User Trust Launch Board 已阻断" : "User Trust Launch Board 仍需复核"),
        caveat:"User Trust Launch 不执行真实 launch。"
      },
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
    };
    result.userTrustLaunchBoardChecklist = buildGlobalShoppingUserTrustLaunchBoardChecklist(result);
    result.rows = buildGlobalShoppingUserTrustLaunchBoardRows(result);
    return clone(result);
  }

  function buildGlobalShoppingUserTrustLaunchBoardAuditDraft(input) {
    const board = buildGlobalShoppingUserTrustLaunchBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_USER_TRUST_LAUNCH_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_USER_TRUST_LAUNCH_BOARD_VERSION,
      status:board.status,
      sectionCount:obj(board.userTrustLaunchBoardSummary).sectionCount || 0,
      blockedSectionCount:obj(board.userTrustLaunchBoardSummary).blockedSectionCount || 0,
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

  function sanitizeGlobalShoppingUserTrustLaunchBoard(board) {
    return evaluateGlobalShoppingUserTrustLaunchBoard(board || {});
  }

  function buildGlobalShoppingUserTrustLaunchBoard(input) {
    try {
      return evaluateGlobalShoppingUserTrustLaunchBoard(input || {});
    } catch (_) {
      return evaluateGlobalShoppingUserTrustLaunchBoard({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingUserTrustLaunchBoard = {
    GLOBAL_SHOPPING_USER_TRUST_LAUNCH_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingUserTrustLaunchBoard,
    evaluateGlobalShoppingUserTrustLaunchBoard,
    buildGlobalShoppingUserTrustLaunchBoardRows,
    buildGlobalShoppingUserTrustLaunchBoardSections,
    buildGlobalShoppingUserTrustLaunchBoardChecklist,
    buildGlobalShoppingUserTrustLaunchBoardAuditDraft,
    sanitizeGlobalShoppingUserTrustLaunchBoard
  };
})();
