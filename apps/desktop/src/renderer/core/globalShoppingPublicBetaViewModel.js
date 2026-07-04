;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_VIEW_MODEL_VERSION = "4.2.6";
  const VIEW_MODEL_NAME = "global_shopping_public_beta_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|externalUrl|platformUrl|providerUrl|endpoint|providerClient|rawTrace|rawResponse|rawRequest|rawUserText/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe)$/.test(text(value)) ? text(value) : "needs_review"; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function card(cardId, label, value) {
    return { cardId:text(cardId), label:text(label), value:text(value), redacted:true };
  }
  function rowsFor(summary, emptyId, emptyLabel, emptyValue) {
    return toArray(obj(summary).rows).length ? clone(summary.rows) : [row(emptyId, emptyLabel, emptyValue, "warning")];
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

  function buildGlobalShoppingPublicBetaCards(input) {
    const safe = obj(input);
    const publicBetaShellSummary = resolveSummary(safe, "globalShoppingReadOnlyPublicBetaShellSummary", "WeishanGlobalShoppingReadOnlyPublicBetaShell", "buildGlobalShoppingReadOnlyPublicBetaShell");
    const providerZeroRuntimeLockSummary = resolveSummary(safe, "providerZeroRuntimeLockSummary", "WeishanGlobalShoppingProviderZeroRuntimeLock", "buildGlobalShoppingProviderZeroRuntimeLock");
    const userTrustLaunchBoardSummary = resolveSummary(safe, "userTrustLaunchBoardSummary", "WeishanGlobalShoppingUserTrustLaunchBoard", "buildGlobalShoppingUserTrustLaunchBoard");
    const publicBetaSafetyCopyCenterSummary = resolveSummary(safe, "publicBetaSafetyCopyCenterSummary", "WeishanGlobalShoppingPublicBetaSafetyCopyCenter", "buildGlobalShoppingPublicBetaSafetyCopyCenter");
    const userFacingCopyPolishSummary = resolveSummary(safe, "globalShoppingPublicBetaUserFacingCopyPolishSummary", "WeishanGlobalShoppingPublicBetaUserFacingCopyPolish", "buildGlobalShoppingPublicBetaUserFacingCopyPolish");
    const providerZeroStatusPanelSummary = resolveSummary(safe, "globalShoppingProviderZeroStatusPanelSummary", "WeishanGlobalShoppingProviderZeroStatusPanel", "buildGlobalShoppingProviderZeroStatusPanel");
    const candidateEvidenceSummary = resolveSummary(safe, "globalShoppingReadOnlyCandidateEvidenceUnifierSummary", "WeishanGlobalShoppingReadOnlyCandidateEvidenceUnifier", "buildGlobalShoppingReadOnlyCandidateEvidenceUnifier");
    const feeNormalizationSummary = resolveSummary(safe, "globalShoppingFeeNormalizationViewSummary", "WeishanGlobalShoppingFeeNormalizationView", "buildGlobalShoppingFeeNormalizationView");
    const officialAnchorSummary = resolveSummary(safe, "globalShoppingOfficialAnchorComparisonViewSummary", "WeishanGlobalShoppingOfficialAnchorComparisonView", "buildGlobalShoppingOfficialAnchorComparisonView");
    const publicBetaFinalGateSummary = resolveSummary(safe, "publicBetaFinalGateSummary", "WeishanGlobalShoppingPublicBetaFinalGate", "buildGlobalShoppingPublicBetaFinalGate");
    const releaseCandidateConfidenceBoardSummary = resolveSummary(safe, "releaseCandidateConfidenceBoardSummary", "WeishanGlobalShoppingReleaseCandidateConfidenceBoard", "buildGlobalShoppingReleaseCandidateConfidenceBoard");
    const publicBetaFinalViewModelSummary = resolveSummary(safe, "publicBetaFinalViewModelSummary", "WeishanGlobalShoppingPublicBetaFinalViewModel", "buildGlobalShoppingPublicBetaFinalViewModel");
    return clone([
      card("public_beta", "Public Beta", labelOf(userFacingCopyPolishSummary, "全球购 Public Beta 仍需复核")),
      card("provider_zero_lock", "Provider-Zero Lock", labelOf(providerZeroStatusPanelSummary, "Provider-Zero Status Panel 仍需复核")),
      card("user_trust_launch", "User Trust Launch", labelOf(userTrustLaunchBoardSummary, "User Trust Launch Board 仍需复核")),
      card("safety_copy", "Safety Copy", labelOf(publicBetaSafetyCopyCenterSummary, "Public Beta Safety Copy Center 仍需复核")),
      card("candidate_evidence", "候选价证据", labelOf(candidateEvidenceSummary, "候选价证据仍需复核")),
      card("fee_normalization", "费用归一化", labelOf(feeNormalizationSummary, "费用归一化仍需复核")),
      card("official_anchor", "官方价锚点", labelOf(officialAnchorSummary, "官方价锚点仍需复核")),
      card("public_beta_final_gate", "Public Beta Final Gate", labelOf(publicBetaFinalGateSummary, "Public Beta Final Gate 仍需复核")),
      card("rc_confidence_board", "RC Confidence Board", labelOf(releaseCandidateConfidenceBoardSummary, "RC Confidence Board 仍需复核")),
      card("public_beta_final_view_model", "Next Manual Review", labelOf(publicBetaFinalViewModelSummary, "下一步仍需人工复核")),
      card("risk_disclosure", "风险说明", "Human public beta review 仍需人工复核")
    ]);
  }

  function buildGlobalShoppingPublicBetaShellRowsForView(input) {
    const summary = resolveSummary(input, "globalShoppingReadOnlyPublicBetaShellSummary", "WeishanGlobalShoppingReadOnlyPublicBetaShell", "buildGlobalShoppingReadOnlyPublicBetaShell");
    return rowsFor(summary, "global_shopping_read_only_public_beta_shell_missing", "Global Shopping Read-Only Public Beta Shell", "Global Shopping Read-Only Public Beta Shell 仍需复核");
  }

  function buildGlobalShoppingProviderZeroLockRowsForView(input) {
    const summary = resolveSummary(input, "providerZeroRuntimeLockSummary", "WeishanGlobalShoppingProviderZeroRuntimeLock", "buildGlobalShoppingProviderZeroRuntimeLock");
    return rowsFor(summary, "provider_zero_runtime_lock_missing", "Provider-Zero Runtime Lock", "Provider-Zero Runtime Lock 仍需复核");
  }

  function buildGlobalShoppingUserTrustLaunchRowsForView(input) {
    const summary = resolveSummary(input, "userTrustLaunchBoardSummary", "WeishanGlobalShoppingUserTrustLaunchBoard", "buildGlobalShoppingUserTrustLaunchBoard");
    return rowsFor(summary, "user_trust_launch_board_missing", "User Trust Launch Board", "User Trust Launch Board 仍需复核");
  }

  function buildGlobalShoppingSafetyCopyRowsForView(input) {
    const summary = resolveSummary(input, "publicBetaSafetyCopyCenterSummary", "WeishanGlobalShoppingPublicBetaSafetyCopyCenter", "buildGlobalShoppingPublicBetaSafetyCopyCenter");
    return rowsFor(summary, "public_beta_safety_copy_center_missing", "Public Beta Safety Copy Center", "Public Beta Safety Copy Center 仍需复核");
  }

  function buildGlobalShoppingPublicBetaRows(input) {
    const safe = obj(input);
    return clone([
      row("global_shopping_public_beta_view_model_status", "全球购 Public Beta", "当前只展示全球购 Public Beta", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("global_shopping_public_beta_view_model_boundary", "只读边界", "不接真实 provider，不读取密钥，不联网，不打开平台，不创建 release，不 push，当前不提供付款、下单或出票能力。", "pass")
    ]);
  }

  function sanitizeGlobalShoppingPublicBetaViewModel(viewModel) {
    const safe = obj(viewModel);
    const publicBetaShellSummary = resolveSummary(safe, "globalShoppingReadOnlyPublicBetaShellSummary", "WeishanGlobalShoppingReadOnlyPublicBetaShell", "buildGlobalShoppingReadOnlyPublicBetaShell");
    const providerZeroRuntimeLockSummary = resolveSummary(safe, "providerZeroRuntimeLockSummary", "WeishanGlobalShoppingProviderZeroRuntimeLock", "buildGlobalShoppingProviderZeroRuntimeLock");
    const userTrustLaunchBoardSummary = resolveSummary(safe, "userTrustLaunchBoardSummary", "WeishanGlobalShoppingUserTrustLaunchBoard", "buildGlobalShoppingUserTrustLaunchBoard");
    const publicBetaSafetyCopyCenterSummary = resolveSummary(safe, "publicBetaSafetyCopyCenterSummary", "WeishanGlobalShoppingPublicBetaSafetyCopyCenter", "buildGlobalShoppingPublicBetaSafetyCopyCenter");
    const userFacingCopyPolishSummary = resolveSummary(safe, "globalShoppingPublicBetaUserFacingCopyPolishSummary", "WeishanGlobalShoppingPublicBetaUserFacingCopyPolish", "buildGlobalShoppingPublicBetaUserFacingCopyPolish");
    const providerZeroStatusPanelSummary = resolveSummary(safe, "globalShoppingProviderZeroStatusPanelSummary", "WeishanGlobalShoppingProviderZeroStatusPanel", "buildGlobalShoppingProviderZeroStatusPanel");
    const candidateEvidenceSummary = resolveSummary(safe, "globalShoppingReadOnlyCandidateEvidenceUnifierSummary", "WeishanGlobalShoppingReadOnlyCandidateEvidenceUnifier", "buildGlobalShoppingReadOnlyCandidateEvidenceUnifier");
    const feeNormalizationSummary = resolveSummary(safe, "globalShoppingFeeNormalizationViewSummary", "WeishanGlobalShoppingFeeNormalizationView", "buildGlobalShoppingFeeNormalizationView");
    const officialAnchorSummary = resolveSummary(safe, "globalShoppingOfficialAnchorComparisonViewSummary", "WeishanGlobalShoppingOfficialAnchorComparisonView", "buildGlobalShoppingOfficialAnchorComparisonView");
    const publicBetaFinalGateSummary = resolveSummary(safe, "publicBetaFinalGateSummary", "WeishanGlobalShoppingPublicBetaFinalGate", "buildGlobalShoppingPublicBetaFinalGate");
    const releaseCandidateConfidenceBoardSummary = resolveSummary(safe, "releaseCandidateConfidenceBoardSummary", "WeishanGlobalShoppingReleaseCandidateConfidenceBoard", "buildGlobalShoppingReleaseCandidateConfidenceBoard");
    const publicBetaFinalViewModelSummary = resolveSummary(safe, "publicBetaFinalViewModelSummary", "WeishanGlobalShoppingPublicBetaFinalViewModel", "buildGlobalShoppingPublicBetaFinalViewModel");
    const statuses = [
      safeStatus(publicBetaShellSummary.status),
      safeStatus(providerZeroRuntimeLockSummary.status),
      safeStatus(userTrustLaunchBoardSummary.status),
      safeStatus(publicBetaSafetyCopyCenterSummary.status),
      safeStatus(userFacingCopyPolishSummary.status),
      safeStatus(providerZeroStatusPanelSummary.status),
      safeStatus(candidateEvidenceSummary.status),
      safeStatus(feeNormalizationSummary.status),
      safeStatus(officialAnchorSummary.status),
      safeStatus(publicBetaFinalGateSummary.status),
      safeStatus(releaseCandidateConfidenceBoardSummary.status),
      safeStatus(publicBetaFinalViewModelSummary.status)
    ];
    const blocked = statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const needsReview =
      !present(publicBetaShellSummary) ||
      !present(providerZeroRuntimeLockSummary) ||
      !present(userTrustLaunchBoardSummary) ||
      !present(publicBetaSafetyCopyCenterSummary) ||
      !present(userFacingCopyPolishSummary) ||
      !present(providerZeroStatusPanelSummary) ||
      !present(candidateEvidenceSummary) ||
      !present(feeNormalizationSummary) ||
      !present(officialAnchorSummary) ||
      !present(publicBetaFinalGateSummary) ||
      !present(releaseCandidateConfidenceBoardSummary) ||
      !present(publicBetaFinalViewModelSummary) ||
      statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_VIEW_MODEL_VERSION,
      status:status,
      title:"Global Shopping Public Beta Review",
      cards:buildGlobalShoppingPublicBetaCards({
        globalShoppingReadOnlyPublicBetaShellSummary:publicBetaShellSummary,
        providerZeroRuntimeLockSummary:providerZeroRuntimeLockSummary,
        userTrustLaunchBoardSummary:userTrustLaunchBoardSummary,
        publicBetaSafetyCopyCenterSummary:publicBetaSafetyCopyCenterSummary,
        globalShoppingPublicBetaUserFacingCopyPolishSummary:userFacingCopyPolishSummary,
        globalShoppingProviderZeroStatusPanelSummary:providerZeroStatusPanelSummary,
        globalShoppingReadOnlyCandidateEvidenceUnifierSummary:candidateEvidenceSummary,
        globalShoppingFeeNormalizationViewSummary:feeNormalizationSummary,
        globalShoppingOfficialAnchorComparisonViewSummary:officialAnchorSummary,
        publicBetaFinalGateSummary:publicBetaFinalGateSummary,
        releaseCandidateConfidenceBoardSummary:releaseCandidateConfidenceBoardSummary,
        publicBetaFinalViewModelSummary:publicBetaFinalViewModelSummary
      }),
      publicBetaShellRows:buildGlobalShoppingPublicBetaShellRowsForView({ globalShoppingReadOnlyPublicBetaShellSummary:publicBetaShellSummary }),
      providerZeroLockRows:buildGlobalShoppingProviderZeroLockRowsForView({ providerZeroRuntimeLockSummary:providerZeroRuntimeLockSummary }),
      userTrustLaunchRows:buildGlobalShoppingUserTrustLaunchRowsForView({ userTrustLaunchBoardSummary:userTrustLaunchBoardSummary }),
      safetyCopyRows:buildGlobalShoppingSafetyCopyRowsForView({ publicBetaSafetyCopyCenterSummary:publicBetaSafetyCopyCenterSummary }),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("public_beta_disclosure_candidate_only", "Global Shopping Public Beta", "全球购 Public Beta 只展示只读候选价，当前不提供付款、下单或出票能力", "pass"),
        row("public_beta_disclosure_candidate_evidence", "候选价证据", "当前仍为只读候选证据，来源与时间、可信度、风险说明仅用于辅助复核", "pass"),
        row("public_beta_disclosure_fee_normalization", "费用归一化", "归一化价格仅用于辅助比较，不代表真实最终价", "pass"),
        row("public_beta_disclosure_official_anchor", "官方价锚点", "官方价锚点只作为只读对比参考，以平台实时页面为准", "pass"),
        row("public_beta_disclosure_final_gate", "Public Beta Final Gate", "Public Beta Final Gate 只做只读收口，不执行 release、不创建 tag、不 push", "pass"),
        row("public_beta_disclosure_rc_confidence", "RC Confidence Board", "Provider-Zero 已锁定 / 未联网 / 未读取密钥 / 未生成 endpoint", "pass"),
        row("public_beta_disclosure_manual_review", "Next Manual Review", "下一步仍需人工复核", "warning"),
        row("public_beta_disclosure_provider_zero", "Provider-Zero", "Provider-Zero：未接入真实供应商，未读取密钥，未联网调用，未生成订单", "pass"),
        row("public_beta_disclosure_user_trust", "User Trust Launch", "User Trust Launch 不执行真实 launch", "pass"),
        row("public_beta_disclosure_safety_copy", "Safety Copy", "Safety Copy 不承诺最低价、最终价或官方背书，平台实时页面为准", "pass"),
        row("public_beta_disclosure_manual", "风险说明", "Human public beta review 仍需人工复核", "warning")
      ],
      rows:buildGlobalShoppingPublicBetaRows({ status:status }),
      caveat:"当前只展示全球购 Public Beta，不接真实 provider，不读取密钥，不联网，不打开平台，不创建 release，不 push，当前不提供付款、下单或出票能力。",
      globalShoppingReadOnlyPublicBetaShellSummary:clone(publicBetaShellSummary),
      providerZeroRuntimeLockSummary:clone(providerZeroRuntimeLockSummary),
      userTrustLaunchBoardSummary:clone(userTrustLaunchBoardSummary),
      publicBetaSafetyCopyCenterSummary:clone(publicBetaSafetyCopyCenterSummary),
      globalShoppingPublicBetaUserFacingCopyPolishSummary:clone(userFacingCopyPolishSummary),
      globalShoppingProviderZeroStatusPanelSummary:clone(providerZeroStatusPanelSummary),
      globalShoppingReadOnlyCandidateEvidenceUnifierSummary:clone(candidateEvidenceSummary),
      globalShoppingFeeNormalizationViewSummary:clone(feeNormalizationSummary),
      globalShoppingOfficialAnchorComparisonViewSummary:clone(officialAnchorSummary),
      publicBetaFinalGateSummary:clone(publicBetaFinalGateSummary),
      releaseCandidateConfidenceBoardSummary:clone(releaseCandidateConfidenceBoardSummary),
      publicBetaFinalViewModelSummary:clone(publicBetaFinalViewModelSummary),
      safeToProceedWithHumanPublicBetaReview:status === "ready",
      safeToProceedWithManualPublicBetaReview:status === "ready",
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

  function buildGlobalShoppingPublicBetaViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingPublicBetaViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_VIEW_MODEL_VERSION,
      status:viewModel.status,
      cardCount:toArray(viewModel.cards).length,
      disclosureRowCount:toArray(viewModel.disclosureRows).length,
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

  function buildGlobalShoppingPublicBetaViewModel(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaViewModel = {
    GLOBAL_SHOPPING_PUBLIC_BETA_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingPublicBetaViewModel,
    buildGlobalShoppingPublicBetaCards,
    buildGlobalShoppingPublicBetaRows,
    buildGlobalShoppingPublicBetaShellRowsForView,
    buildGlobalShoppingProviderZeroLockRowsForView,
    buildGlobalShoppingUserTrustLaunchRowsForView,
    buildGlobalShoppingSafetyCopyRowsForView,
    buildGlobalShoppingPublicBetaViewModelAuditDraft,
    sanitizeGlobalShoppingPublicBetaViewModel
  };
})();
