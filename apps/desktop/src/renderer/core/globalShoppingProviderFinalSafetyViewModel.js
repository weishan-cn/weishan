;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_FINAL_SAFETY_VIEW_MODEL_VERSION = "4.2.6";
  const VIEW_MODEL_NAME = "global_shopping_provider_final_safety_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|providerClient/ig, "redacted")
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

  function buildGlobalShoppingProviderFinalSafetyCards(input) {
    const safe = obj(input);
    const providerFinalSafetySealSummary = resolveSummary(safe, "providerFinalSafetySealSummary", "WeishanGlobalShoppingProviderFinalSafetySeal", "buildGlobalShoppingProviderFinalSafetySeal");
    const offlineActivationWarRoomSummary = resolveSummary(safe, "offlineActivationWarRoomSummary", "WeishanGlobalShoppingOfflineActivationWarRoom", "buildGlobalShoppingOfflineActivationWarRoom");
    const readOnlyProviderReadinessCertificateSummary = resolveSummary(safe, "readOnlyProviderReadinessCertificateSummary", "WeishanGlobalShoppingReadOnlyProviderReadinessCertificate", "buildGlobalShoppingReadOnlyProviderReadinessCertificate");
    const providerNoActivationGuaranteeBoardSummary = resolveSummary(safe, "providerNoActivationGuaranteeBoardSummary", "WeishanGlobalShoppingProviderNoActivationGuaranteeBoard", "buildGlobalShoppingProviderNoActivationGuaranteeBoard");
    return clone([
      card("provider_final_safety_seal", "Safety Seal", labelOf(providerFinalSafetySealSummary, "Safety Seal 仍需复核")),
      card("offline_activation_war_room", "Activation War Room", labelOf(offlineActivationWarRoomSummary, "Activation War Room 仍需复核")),
      card("read_only_provider_readiness_certificate", "Readiness Certificate", labelOf(readOnlyProviderReadinessCertificateSummary, "Readiness Certificate 仍需复核")),
      card("provider_no_activation_guarantee_board", "No-Activation Guarantee", labelOf(providerNoActivationGuaranteeBoardSummary, "No-Activation Guarantee 仍需复核")),
      card("risk_disclosure", "风险说明", "Human final safety review 仍需人工复核")
    ]);
  }

  function buildGlobalShoppingFinalSafetySealRowsForView(input) {
    const summary = resolveSummary(input, "providerFinalSafetySealSummary", "WeishanGlobalShoppingProviderFinalSafetySeal", "buildGlobalShoppingProviderFinalSafetySeal");
    return rowsFor(summary, "provider_final_safety_seal_missing", "Provider Final Safety Seal", "Provider Final Safety Seal 仍需复核");
  }

  function buildGlobalShoppingActivationWarRoomRowsForView(input) {
    const summary = resolveSummary(input, "offlineActivationWarRoomSummary", "WeishanGlobalShoppingOfflineActivationWarRoom", "buildGlobalShoppingOfflineActivationWarRoom");
    return rowsFor(summary, "offline_activation_war_room_missing", "Offline Activation War Room", "Offline Activation War Room 仍需复核");
  }

  function buildGlobalShoppingReadinessCertificateRowsForView(input) {
    const summary = resolveSummary(input, "readOnlyProviderReadinessCertificateSummary", "WeishanGlobalShoppingReadOnlyProviderReadinessCertificate", "buildGlobalShoppingReadOnlyProviderReadinessCertificate");
    return rowsFor(summary, "read_only_provider_readiness_certificate_missing", "Read-Only Provider Readiness Certificate", "Read-Only Provider Readiness Certificate 仍需复核");
  }

  function buildGlobalShoppingNoActivationGuaranteeRowsForView(input) {
    const summary = resolveSummary(input, "providerNoActivationGuaranteeBoardSummary", "WeishanGlobalShoppingProviderNoActivationGuaranteeBoard", "buildGlobalShoppingProviderNoActivationGuaranteeBoard");
    return rowsFor(summary, "provider_no_activation_guarantee_board_missing", "Provider No-Activation Guarantee Board", "Provider No-Activation Guarantee Board 仍需复核");
  }

  function buildGlobalShoppingProviderFinalSafetyRows(input) {
    const safe = obj(input);
    return clone([
      row("provider_final_safety_view_model_status", "Provider Final Safety Review", "当前只展示 provider final safety review", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_final_safety_view_model_boundary", "只读边界", "不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push。", "pass")
    ]);
  }

  function sanitizeGlobalShoppingProviderFinalSafetyViewModel(viewModel) {
    const safe = obj(viewModel);
    const providerFinalSafetySealSummary = resolveSummary(safe, "providerFinalSafetySealSummary", "WeishanGlobalShoppingProviderFinalSafetySeal", "buildGlobalShoppingProviderFinalSafetySeal");
    const offlineActivationWarRoomSummary = resolveSummary(safe, "offlineActivationWarRoomSummary", "WeishanGlobalShoppingOfflineActivationWarRoom", "buildGlobalShoppingOfflineActivationWarRoom");
    const readOnlyProviderReadinessCertificateSummary = resolveSummary(safe, "readOnlyProviderReadinessCertificateSummary", "WeishanGlobalShoppingReadOnlyProviderReadinessCertificate", "buildGlobalShoppingReadOnlyProviderReadinessCertificate");
    const providerNoActivationGuaranteeBoardSummary = resolveSummary(safe, "providerNoActivationGuaranteeBoardSummary", "WeishanGlobalShoppingProviderNoActivationGuaranteeBoard", "buildGlobalShoppingProviderNoActivationGuaranteeBoard");
    const statuses = [
      safeStatus(providerFinalSafetySealSummary.status),
      safeStatus(offlineActivationWarRoomSummary.status),
      safeStatus(readOnlyProviderReadinessCertificateSummary.status),
      safeStatus(providerNoActivationGuaranteeBoardSummary.status)
    ];
    const blocked = statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const needsReview =
      !present(providerFinalSafetySealSummary) ||
      !present(offlineActivationWarRoomSummary) ||
      !present(readOnlyProviderReadinessCertificateSummary) ||
      !present(providerNoActivationGuaranteeBoardSummary) ||
      statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_FINAL_SAFETY_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider Final Safety Review",
      cards:buildGlobalShoppingProviderFinalSafetyCards({
        providerFinalSafetySealSummary:providerFinalSafetySealSummary,
        offlineActivationWarRoomSummary:offlineActivationWarRoomSummary,
        readOnlyProviderReadinessCertificateSummary:readOnlyProviderReadinessCertificateSummary,
        providerNoActivationGuaranteeBoardSummary:providerNoActivationGuaranteeBoardSummary
      }),
      finalSafetySealRows:buildGlobalShoppingFinalSafetySealRowsForView({ providerFinalSafetySealSummary:providerFinalSafetySealSummary }),
      activationWarRoomRows:buildGlobalShoppingActivationWarRoomRowsForView({ offlineActivationWarRoomSummary:offlineActivationWarRoomSummary }),
      readinessCertificateRows:buildGlobalShoppingReadinessCertificateRowsForView({ readOnlyProviderReadinessCertificateSummary:readOnlyProviderReadinessCertificateSummary }),
      noActivationGuaranteeRows:buildGlobalShoppingNoActivationGuaranteeRowsForView({ providerNoActivationGuaranteeBoardSummary:providerNoActivationGuaranteeBoardSummary }),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("provider_final_safety_view_model_disclosure_seal", "Provider Final Safety Seal", "Safety Seal 不生成真实证书、不写文件", "pass"),
        row("provider_final_safety_view_model_disclosure_room", "Offline Activation War Room", "Activation War Room 不激活 sandbox、不启用 provider", "pass"),
        row("provider_final_safety_view_model_disclosure_certificate", "Read-Only Provider Readiness Certificate", "Readiness Certificate 不持久化证书", "pass"),
        row("provider_final_safety_view_model_disclosure_guarantee", "Provider No-Activation Guarantee Board", "No-Activation Guarantee 不修改配置、不执行真实阻断", "pass"),
        row("provider_final_safety_view_model_disclosure_manual", "风险说明", "Human final safety review 仍需人工复核", "warning")
      ],
      rows:buildGlobalShoppingProviderFinalSafetyRows({ status:status }),
      caveat:"当前只展示 provider final safety review，不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push。",
      providerFinalSafetySealSummary:clone(providerFinalSafetySealSummary),
      offlineActivationWarRoomSummary:clone(offlineActivationWarRoomSummary),
      readOnlyProviderReadinessCertificateSummary:clone(readOnlyProviderReadinessCertificateSummary),
      providerNoActivationGuaranteeBoardSummary:clone(providerNoActivationGuaranteeBoardSummary),
      safeToProceedWithHumanFinalSafetyReview:status === "ready"
    });
  }

  function buildGlobalShoppingProviderFinalSafetyViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderFinalSafetyViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_FINAL_SAFETY_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_FINAL_SAFETY_VIEW_MODEL_VERSION,
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
      rawRequestStored:false,
      secretStored:false,
      redacted:true
    });
  }

  function buildGlobalShoppingProviderFinalSafetyViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderFinalSafetyViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderFinalSafetyViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderFinalSafetyViewModel = {
    GLOBAL_SHOPPING_PROVIDER_FINAL_SAFETY_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderFinalSafetyViewModel,
    buildGlobalShoppingProviderFinalSafetyCards,
    buildGlobalShoppingProviderFinalSafetyRows,
    buildGlobalShoppingFinalSafetySealRowsForView,
    buildGlobalShoppingActivationWarRoomRowsForView,
    buildGlobalShoppingReadinessCertificateRowsForView,
    buildGlobalShoppingNoActivationGuaranteeRowsForView,
    buildGlobalShoppingProviderFinalSafetyViewModelAuditDraft,
    sanitizeGlobalShoppingProviderFinalSafetyViewModel
  };
})();
