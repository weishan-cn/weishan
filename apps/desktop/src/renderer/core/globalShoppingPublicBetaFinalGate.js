;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_GATE_VERSION = "4.0.7";
  const GATE_NAME = "global_shopping_public_beta_final_gate_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, final_gate_only:true };
  const FORBIDDEN_CLAIM_RE = /全网最低|最低价保证|已锁价|真实最终价|官方背书|平台授权|已接入 provider|可调用 provider|已发布|已 push|Release 已创建/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|rawRequest|rawResponse|rawUserText|endpoint|providerClient/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function safeMode(value) {
    const mode = text(value || "final_gate_only");
    return ALLOWED_MODES[mode] ? mode : "final_gate_only";
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
  function summarizeRule(ruleId, label, summary, fallback) {
    const status = safeStatus(summary.status);
    return row(ruleId, label, labelOf(summary, fallback), status === "ready" ? "pass" : (status === "blocked" || status === "failed_safe" ? "blocked" : "warning"));
  }
  function blockedReasons(input) {
    const safe = obj(input);
    const reasons = [];
    if (safe.appVersion && text(safe.appVersion) !== GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_GATE_VERSION) reasons.push("app_version_mismatch");
    if (safe.provider === true || safe.enableProvider === true || safe.productionProvider === true) reasons.push("provider_detected");
    if (safe.network === true) reasons.push("network_detected");
    if (safe.readApiKey === true || safe.key === true) reasons.push("api_key_detected");
    if (safe.endpoint === true || safe.providerClient === true) reasons.push("endpoint_detected");
    if (safe.openExternal === true || safe.windowOpen === true || safe.externalOpen === true) reasons.push("external_open_detected");
    if (safe.payment === true || safe.checkout === true || safe.order === true || safe.ticketing === true || safe.booking === true) reasons.push("transaction_detected");
    if (safe.persistRawProviderData === true || safe.persistRawUserText === true || safe.rawPersistence === true) reasons.push("raw_persistence_detected");
    if (safe.createRelease === true || safe.release === true) reasons.push("release_detected");
    if (safe.createTag === true || safe.tag === true) reasons.push("tag_detected");
    if (safe.push === true) reasons.push("push_detected");
    if (safe.gitMutation === true) reasons.push("git_mutation_detected");
    if (safe.fileWrite === true || safe.writeFile === true) reasons.push("file_write_detected");
    if (FORBIDDEN_CLAIM_RE.test(JSON.stringify(safe))) reasons.push("forbidden_claim_detected");
    if (safe.externalUrl != null || safe.platformUrl != null || safe.providerUrl != null) reasons.push("external_url_detected");
    if (safe.bookingUrl != null || safe.checkoutUrl != null || safe.paymentUrl != null || safe.orderUrl != null) reasons.push("transaction_url_detected");
    if (safe.buyButtonEnabled === true || safe.checkoutButtonEnabled === true || safe.paymentButtonEnabled === true) reasons.push("transaction_button_enabled");
    return reasons;
  }

  function buildGlobalShoppingPublicBetaFinalGateRules(input) {
    const safe = obj(input);
    const publicBetaShellSummary = resolveSummary(safe, "globalShoppingReadOnlyPublicBetaShellSummary", "WeishanGlobalShoppingReadOnlyPublicBetaShell", "buildGlobalShoppingReadOnlyPublicBetaShell");
    const providerZeroRuntimeLockSummary = resolveSummary(safe, "providerZeroRuntimeLockSummary", "WeishanGlobalShoppingProviderZeroRuntimeLock", "buildGlobalShoppingProviderZeroRuntimeLock");
    const candidateEvidenceSummary = resolveSummary(safe, "globalShoppingReadOnlyCandidateEvidenceUnifierSummary", "WeishanGlobalShoppingReadOnlyCandidateEvidenceUnifier", "buildGlobalShoppingReadOnlyCandidateEvidenceUnifier");
    const feeNormalizationSummary = resolveSummary(safe, "globalShoppingFeeNormalizationViewSummary", "WeishanGlobalShoppingFeeNormalizationView", "buildGlobalShoppingFeeNormalizationView");
    const officialAnchorSummary = resolveSummary(safe, "globalShoppingOfficialAnchorComparisonViewSummary", "WeishanGlobalShoppingOfficialAnchorComparisonView", "buildGlobalShoppingOfficialAnchorComparisonView");
    const safetyCopyCenterSummary = resolveSummary(safe, "publicBetaSafetyCopyCenterSummary", "WeishanGlobalShoppingPublicBetaSafetyCopyCenter", "buildGlobalShoppingPublicBetaSafetyCopyCenter");
    return clone([
      summarizeRule("public_beta_shell", "Public Beta Shell", publicBetaShellSummary, "Global Shopping Read-Only Public Beta Shell 仍需复核"),
      summarizeRule("provider_zero_runtime_lock", "Provider-Zero Runtime Lock", providerZeroRuntimeLockSummary, "Provider-Zero Runtime Lock 仍需复核"),
      summarizeRule("candidate_evidence_unifier", "Candidate Evidence Unifier", candidateEvidenceSummary, "候选价证据仍需复核"),
      summarizeRule("fee_normalization_view", "Fee Normalization View", feeNormalizationSummary, "费用归一化仍需复核"),
      summarizeRule("official_anchor_view", "Official Anchor Comparison View", officialAnchorSummary, "官方价锚点仍需复核"),
      summarizeRule("safety_copy_center", "Safety Copy Center", safetyCopyCenterSummary, "Public Beta Safety Copy Center 仍需复核")
    ]);
  }

  function evaluateGlobalShoppingPublicBetaFinalGate(input) {
    const safe = obj(input);
    const publicBetaShellSummary = resolveSummary(safe, "globalShoppingReadOnlyPublicBetaShellSummary", "WeishanGlobalShoppingReadOnlyPublicBetaShell", "buildGlobalShoppingReadOnlyPublicBetaShell");
    const providerZeroRuntimeLockSummary = resolveSummary(safe, "providerZeroRuntimeLockSummary", "WeishanGlobalShoppingProviderZeroRuntimeLock", "buildGlobalShoppingProviderZeroRuntimeLock");
    const candidateEvidenceSummary = resolveSummary(safe, "globalShoppingReadOnlyCandidateEvidenceUnifierSummary", "WeishanGlobalShoppingReadOnlyCandidateEvidenceUnifier", "buildGlobalShoppingReadOnlyCandidateEvidenceUnifier");
    const feeNormalizationSummary = resolveSummary(safe, "globalShoppingFeeNormalizationViewSummary", "WeishanGlobalShoppingFeeNormalizationView", "buildGlobalShoppingFeeNormalizationView");
    const officialAnchorSummary = resolveSummary(safe, "globalShoppingOfficialAnchorComparisonViewSummary", "WeishanGlobalShoppingOfficialAnchorComparisonView", "buildGlobalShoppingOfficialAnchorComparisonView");
    const safetyCopyCenterSummary = resolveSummary(safe, "publicBetaSafetyCopyCenterSummary", "WeishanGlobalShoppingPublicBetaSafetyCopyCenter", "buildGlobalShoppingPublicBetaSafetyCopyCenter");
    const rules = buildGlobalShoppingPublicBetaFinalGateRules({
      globalShoppingReadOnlyPublicBetaShellSummary:publicBetaShellSummary,
      providerZeroRuntimeLockSummary:providerZeroRuntimeLockSummary,
      globalShoppingReadOnlyCandidateEvidenceUnifierSummary:candidateEvidenceSummary,
      globalShoppingFeeNormalizationViewSummary:feeNormalizationSummary,
      globalShoppingOfficialAnchorComparisonViewSummary:officialAnchorSummary,
      publicBetaSafetyCopyCenterSummary:safetyCopyCenterSummary
    });
    const statuses = [
      safeStatus(publicBetaShellSummary.status),
      safeStatus(providerZeroRuntimeLockSummary.status),
      safeStatus(candidateEvidenceSummary.status),
      safeStatus(feeNormalizationSummary.status),
      safeStatus(officialAnchorSummary.status),
      safeStatus(safetyCopyCenterSummary.status)
    ];
    const directBlockedReasons = blockedReasons(safe);
    const hasMissing =
      !present(publicBetaShellSummary) ||
      !present(providerZeroRuntimeLockSummary) ||
      !present(candidateEvidenceSummary) ||
      !present(feeNormalizationSummary) ||
      !present(officialAnchorSummary) ||
      !present(safetyCopyCenterSummary);
    const blocked = directBlockedReasons.length > 0 || statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const needsReview = hasMissing || statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_GATE_VERSION,
      status:status,
      gateMode:safeMode(safe.gateMode),
      title:"Public Beta Final Gate",
      rules:rules,
      rows:buildGlobalShoppingPublicBetaFinalGateRows({ status:status, rules:rules }),
      auditDraft:buildGlobalShoppingPublicBetaFinalGateAuditDraft({ status:status, rules:rules }),
      blockedReasons:directBlockedReasons,
      userFacingSummary:{
        title:"Public Beta Final Gate",
        resultLabel:status === "ready" ? "Public Beta Final Gate 已准备" : (status === "blocked" ? "Public Beta Final Gate 已阻断" : "Public Beta Final Gate 仍需复核"),
        caveat:"Public Beta Final Gate 只做只读收口，不执行 release、不创建 tag、不 push。"
      },
      globalShoppingReadOnlyPublicBetaShellSummary:clone(publicBetaShellSummary),
      providerZeroRuntimeLockSummary:clone(providerZeroRuntimeLockSummary),
      globalShoppingReadOnlyCandidateEvidenceUnifierSummary:clone(candidateEvidenceSummary),
      globalShoppingFeeNormalizationViewSummary:clone(feeNormalizationSummary),
      globalShoppingOfficialAnchorComparisonViewSummary:clone(officialAnchorSummary),
      publicBetaSafetyCopyCenterSummary:clone(safetyCopyCenterSummary),
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

  function buildGlobalShoppingPublicBetaFinalGateRows(input) {
    const safe = obj(input);
    const status = safeStatus(safe.status);
    const rules = toArray(safe.rules);
    return clone([
      row("public_beta_final_gate_status", "Public Beta Final Gate", status === "ready" ? "Public Beta Final Gate 已准备" : (status === "blocked" ? "Public Beta Final Gate 已阻断" : "Public Beta Final Gate 仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("public_beta_final_gate_boundary", "Final Gate 边界", "不执行 release / 不创建 tag / 不 push / 不联网 / 不写文件", "pass")
    ].concat(rules));
  }

  function buildGlobalShoppingPublicBetaFinalGateAuditDraft(input) {
    const safe = obj(input);
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_GATE_AUDIT_DRAFT",
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_GATE_VERSION,
      status:safeStatus(safe.status),
      ruleCount:toArray(safe.rules).length,
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
      fileWrite:false,
      download:false,
      upload:false,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaFinalGate(gate) {
    return evaluateGlobalShoppingPublicBetaFinalGate(gate || {});
  }

  function buildGlobalShoppingPublicBetaFinalGate(input) {
    try {
      return evaluateGlobalShoppingPublicBetaFinalGate(input || {});
    } catch (_) {
      return evaluateGlobalShoppingPublicBetaFinalGate({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaFinalGate = {
    GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_GATE_VERSION,
    GATE_NAME,
    buildGlobalShoppingPublicBetaFinalGate,
    evaluateGlobalShoppingPublicBetaFinalGate,
    buildGlobalShoppingPublicBetaFinalGateRows,
    buildGlobalShoppingPublicBetaFinalGateRules,
    buildGlobalShoppingPublicBetaFinalGateAuditDraft,
    sanitizeGlobalShoppingPublicBetaFinalGate
  };
})();
