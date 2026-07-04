;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_LAUNCH_CONTROL_VIEW_MODEL_VERSION = "4.2.6";
  const VIEW_MODEL_NAME = "global_shopping_provider_launch_control_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|providerClient/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function statusOf(summary) {
    const value = text(obj(summary).status || "");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(value) ? value : "needs_review";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function card(cardId, label, value) {
    return { cardId:text(cardId), label:text(label), value:text(value), redacted:true };
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
  function rowsFor(summary, emptyId, emptyLabel, emptyValue) {
    return toArray(obj(summary).rows).length ? clone(summary.rows) : [row(emptyId, emptyLabel, emptyValue, "warning")];
  }

  function buildGlobalShoppingLaunchControlRowsForView(input) {
    const summary = resolveSummary(input, "offlineProviderLaunchControlTowerSummary", "WeishanGlobalShoppingOfflineProviderLaunchControlTower", "buildGlobalShoppingOfflineProviderLaunchControlTower");
    return rowsFor(summary, "offline_provider_launch_control_tower_missing", "Offline Provider Launch Control Tower", "离线 Launch 控制塔仍需复核");
  }

  function buildGlobalShoppingAdapterPolicyRowsForView(input) {
    const summary = resolveSummary(input, "adapterPolicyEngineSummary", "WeishanGlobalShoppingAdapterPolicyEngine", "buildGlobalShoppingAdapterPolicyEngine");
    return rowsFor(summary, "adapter_policy_engine_missing", "Adapter Policy Engine", "Adapter 策略仍需复核");
  }

  function buildGlobalShoppingEvidenceTimelineRowsForView(input) {
    const summary = resolveSummary(input, "humanReleaseEvidenceTimelineSummary", "WeishanGlobalShoppingHumanReleaseEvidenceTimeline", "buildGlobalShoppingHumanReleaseEvidenceTimeline");
    return rowsFor(summary, "human_release_evidence_timeline_missing", "Human Release Evidence Timeline", "人工发布证据仍需复核");
  }

  function buildGlobalShoppingFinalReviewRowsForView(input) {
    const summary = resolveSummary(input, "sandboxActivationFinalReviewBoardSummary", "WeishanGlobalShoppingSandboxActivationFinalReviewBoard", "buildGlobalShoppingSandboxActivationFinalReviewBoard");
    return rowsFor(summary, "sandbox_activation_final_review_board_missing", "Sandbox Activation Final Review Board", "Sandbox 激活终审仍需复核");
  }

  function buildGlobalShoppingProviderLaunchControlCards(input) {
    const safe = obj(input);
    const offlineProviderLaunchControlTowerSummary = resolveSummary(safe, "offlineProviderLaunchControlTowerSummary", "WeishanGlobalShoppingOfflineProviderLaunchControlTower", "buildGlobalShoppingOfflineProviderLaunchControlTower");
    const adapterPolicyEngineSummary = resolveSummary(safe, "adapterPolicyEngineSummary", "WeishanGlobalShoppingAdapterPolicyEngine", "buildGlobalShoppingAdapterPolicyEngine");
    const humanReleaseEvidenceTimelineSummary = resolveSummary(safe, "humanReleaseEvidenceTimelineSummary", "WeishanGlobalShoppingHumanReleaseEvidenceTimeline", "buildGlobalShoppingHumanReleaseEvidenceTimeline");
    const sandboxActivationFinalReviewBoardSummary = resolveSummary(safe, "sandboxActivationFinalReviewBoardSummary", "WeishanGlobalShoppingSandboxActivationFinalReviewBoard", "buildGlobalShoppingSandboxActivationFinalReviewBoard");
    return clone([
      card("launch_control", "Launch Control", labelOf(offlineProviderLaunchControlTowerSummary, "离线 Launch 控制塔仍需复核")),
      card("adapter_policy", "Adapter Policy", labelOf(adapterPolicyEngineSummary, "Adapter 策略仍需复核")),
      card("evidence_timeline", "Evidence Timeline", labelOf(humanReleaseEvidenceTimelineSummary, "人工发布证据仍需复核")),
      card("final_review", "Final Review", labelOf(sandboxActivationFinalReviewBoardSummary, "Sandbox 激活终审仍需复核")),
      card("risk_disclosure", "风险说明", "Human launch control review 仍需人工复核")
    ]);
  }

  function buildGlobalShoppingProviderLaunchControlRows(input) {
    const safe = obj(input);
    return clone([
      row("provider_launch_control_view_model_status", "Provider Launch Control Tower", "当前只展示 provider launch control tower", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_launch_control_view_model_boundary", "只读边界", "不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push。", "pass")
    ]);
  }

  function sanitizeGlobalShoppingProviderLaunchControlViewModel(viewModel) {
    const safe = obj(viewModel);
    const offlineProviderLaunchControlTowerSummary = resolveSummary(safe, "offlineProviderLaunchControlTowerSummary", "WeishanGlobalShoppingOfflineProviderLaunchControlTower", "buildGlobalShoppingOfflineProviderLaunchControlTower");
    const adapterPolicyEngineSummary = resolveSummary(safe, "adapterPolicyEngineSummary", "WeishanGlobalShoppingAdapterPolicyEngine", "buildGlobalShoppingAdapterPolicyEngine");
    const humanReleaseEvidenceTimelineSummary = resolveSummary(safe, "humanReleaseEvidenceTimelineSummary", "WeishanGlobalShoppingHumanReleaseEvidenceTimeline", "buildGlobalShoppingHumanReleaseEvidenceTimeline");
    const sandboxActivationFinalReviewBoardSummary = resolveSummary(safe, "sandboxActivationFinalReviewBoardSummary", "WeishanGlobalShoppingSandboxActivationFinalReviewBoard", "buildGlobalShoppingSandboxActivationFinalReviewBoard");
    const statuses = [
      statusOf(offlineProviderLaunchControlTowerSummary),
      statusOf(adapterPolicyEngineSummary),
      statusOf(humanReleaseEvidenceTimelineSummary),
      statusOf(sandboxActivationFinalReviewBoardSummary)
    ];
    const blocked = statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const needsReview =
      !present(offlineProviderLaunchControlTowerSummary) ||
      !present(adapterPolicyEngineSummary) ||
      !present(humanReleaseEvidenceTimelineSummary) ||
      !present(sandboxActivationFinalReviewBoardSummary) ||
      statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_LAUNCH_CONTROL_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider Launch Control Tower",
      cards:buildGlobalShoppingProviderLaunchControlCards({
        offlineProviderLaunchControlTowerSummary:offlineProviderLaunchControlTowerSummary,
        adapterPolicyEngineSummary:adapterPolicyEngineSummary,
        humanReleaseEvidenceTimelineSummary:humanReleaseEvidenceTimelineSummary,
        sandboxActivationFinalReviewBoardSummary:sandboxActivationFinalReviewBoardSummary
      }),
      launchControlRows:buildGlobalShoppingLaunchControlRowsForView({ offlineProviderLaunchControlTowerSummary:offlineProviderLaunchControlTowerSummary }),
      adapterPolicyRows:buildGlobalShoppingAdapterPolicyRowsForView({ adapterPolicyEngineSummary:adapterPolicyEngineSummary }),
      evidenceTimelineRows:buildGlobalShoppingEvidenceTimelineRowsForView({ humanReleaseEvidenceTimelineSummary:humanReleaseEvidenceTimelineSummary }),
      finalReviewRows:buildGlobalShoppingFinalReviewRowsForView({ sandboxActivationFinalReviewBoardSummary:sandboxActivationFinalReviewBoardSummary }),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("provider_launch_control_disclosure_launch_control", "Offline Provider Launch Control Tower", "Launch Control 不保存真实决策", "pass"),
        row("provider_launch_control_disclosure_adapter_policy", "Adapter Policy Engine", "Adapter Policy 不修改配置、不启用 provider", "pass"),
        row("provider_launch_control_disclosure_evidence_timeline", "Human Release Evidence Timeline", "Evidence Timeline 不持久化时间线", "pass"),
        row("provider_launch_control_disclosure_final_review", "Sandbox Activation Final Review Board", "Final Review 不激活 sandbox", "pass"),
        row("provider_launch_control_disclosure_manual", "风险说明", "Human launch control review 仍需人工复核", "warning")
      ],
      caveat:"当前只展示 provider launch control tower，不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push。",
      offlineProviderLaunchControlTowerSummary:clone(offlineProviderLaunchControlTowerSummary),
      adapterPolicyEngineSummary:clone(adapterPolicyEngineSummary),
      humanReleaseEvidenceTimelineSummary:clone(humanReleaseEvidenceTimelineSummary),
      sandboxActivationFinalReviewBoardSummary:clone(sandboxActivationFinalReviewBoardSummary),
      safeToProceedWithHumanLaunchControlReview:status === "ready"
    });
  }

  function buildGlobalShoppingProviderLaunchControlViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderLaunchControlViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_LAUNCH_CONTROL_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_LAUNCH_CONTROL_VIEW_MODEL_VERSION,
      status:viewModel.status,
      cardCount:toArray(viewModel.cards).length,
      disclosureRowCount:toArray(viewModel.disclosureRows).length,
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

  function buildGlobalShoppingProviderLaunchControlViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderLaunchControlViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderLaunchControlViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderLaunchControlViewModel = {
    GLOBAL_SHOPPING_PROVIDER_LAUNCH_CONTROL_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderLaunchControlViewModel,
    buildGlobalShoppingProviderLaunchControlCards,
    buildGlobalShoppingProviderLaunchControlRows,
    buildGlobalShoppingLaunchControlRowsForView,
    buildGlobalShoppingAdapterPolicyRowsForView,
    buildGlobalShoppingEvidenceTimelineRowsForView,
    buildGlobalShoppingFinalReviewRowsForView,
    buildGlobalShoppingProviderLaunchControlViewModelAuditDraft,
    sanitizeGlobalShoppingProviderLaunchControlViewModel
  };
})();
