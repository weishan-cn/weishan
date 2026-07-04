;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MANUAL_LAUNCH_HANDOFF_PACK_VERSION = "4.2.3";
  const PACK_NAME = "global_shopping_manual_launch_handoff_pack_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, manual_handoff_only:true };
  const BLOCKED_TEXT_RE = /production_ready|auto_launch|auto_publish|ready_to_publish/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safeMode(value) {
    const mode = text(value || "manual_handoff_only");
    return ALLOWED_MODES[mode] ? mode : "manual_handoff_only";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function section(sectionId, label, value) {
    return { sectionId:text(sectionId), label:text(label), value:text(value), redacted:true };
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function blockedReasons(input) {
    const safe = obj(input);
    const blocked = [];
    if (safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    if (safe.fileWrite === true || safe.writeFile === true || safe.persisted === true) blocked.push("file write");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.payment === true || safe.authorizePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    ["summary", "title", "subtitle", "nextDecisionOptionsLabel"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("auto launch language");
    });
    return blocked.filter(function (value, index, array) { return array.indexOf(value) === index; });
  }

  function evaluateGlobalShoppingManualLaunchHandoffPack(input) {
    const safe = obj(input);
    const hasStabilitySummary = present(safe.publicBetaStabilityAuditSummary);
    const publicBetaStabilityAuditSummary = resolveSummary(safe, "publicBetaStabilityAuditSummary", "WeishanGlobalShoppingPublicBetaStabilityAudit", "buildGlobalShoppingPublicBetaStabilityAudit");
    const stabilityStatus = text(publicBetaStabilityAuditSummary.status || "needs_review");
    const blocked = blockedReasons(safe);
    const manualChecklist = [
      "确认当前仍为只读 Public Beta 候选",
      "确认不自动发布、不接 provider、不启用交易",
      "确认仅可继续人工试用和问题记录"
    ];
    const rollbackNotes = [
      "若稳定性审计转为 blocked，则继续保持 continue_testing / blocked 决策",
      "既有 secret scan WARN 仅作为已知警告展示，不扩展为新能力"
    ];
    const operatorNotes = [
      "当前仍为只读 Public Beta 候选",
      "可继续人工试用和问题记录"
    ];
    const nextDecisionOptions = blocked.length || stabilityStatus === "blocked"
      ? ["blocked"]
      : (!hasStabilitySummary || stabilityStatus !== "ready" ? ["manual_review_required", "continue_testing"] : ["manual_review_required", "continue_testing"]);
    const status = blocked.length || stabilityStatus === "blocked"
      ? "blocked"
      : (!hasStabilitySummary || stabilityStatus !== "ready" ? "needs_review" : "ready");

    return clone({
      packName:PACK_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_LAUNCH_HANDOFF_PACK_VERSION,
      packMode:safeMode(safe.packMode),
      status,
      title:"Manual Launch Handoff Pack",
      summary:status === "ready" ? "Manual Launch Handoff Pack 已准备" : (status === "blocked" ? "Manual Launch Handoff Pack 已阻断" : "Manual Launch Handoff Pack 仍需复核"),
      lockedCapabilities:[
        "no release",
        "no push",
        "no provider",
        "no network",
        "no transaction",
        "no external open"
      ],
      manualChecklist:manualChecklist,
      nextDecisionOptions:nextDecisionOptions,
      rollbackNotes:rollbackNotes,
      operatorNotes:operatorNotes,
      blockedCapabilities:blocked,
      manualReviewRequired:true,
      publicBetaStabilityAuditSummary:publicBetaStabilityAuditSummary,
      userFacingSummary:{
        title:"Manual Launch Handoff Pack",
        resultLabel:status === "ready" ? "Manual Launch Handoff Pack 已准备" : (status === "blocked" ? "Manual Launch Handoff Pack 已阻断" : "Manual Launch Handoff Pack 仍需复核"),
        caveat:"名称里有 launch，但不执行 launch；只做人工交接摘要。"
      },
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

  function buildGlobalShoppingManualLaunchHandoffRows(input) {
    const safe = evaluateGlobalShoppingManualLaunchHandoffPack(input || {});
    return clone([
      row("manual_launch_handoff_status", "Manual Launch Handoff Pack", safe.userFacingSummary.resultLabel, safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("manual_launch_handoff_locked", "Locked Capabilities", safe.lockedCapabilities.join(" / "), "warning"),
      row("manual_launch_handoff_next", "Next Decision Options", safe.nextDecisionOptions.join(" / "), safe.status === "blocked" ? "blocked" : "warning"),
      row("manual_launch_handoff_manual_review", "Manual Review Required", "不自动发布、不接 provider、不启用交易", "warning")
    ]);
  }

  function buildGlobalShoppingManualLaunchHandoffSections(input) {
    const safe = evaluateGlobalShoppingManualLaunchHandoffPack(input || {});
    return clone([
      section("manual_launch_handoff_summary", "Manual Launch Handoff Pack", safe.summary),
      section("manual_launch_handoff_notes", "Operator Notes", safe.operatorNotes.join(" / ")),
      section("manual_launch_handoff_next", "Next Decision Options", safe.nextDecisionOptions.join(" / "))
    ]);
  }

  function buildGlobalShoppingManualLaunchHandoffPackAuditDraft(input) {
    const safe = evaluateGlobalShoppingManualLaunchHandoffPack(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_MANUAL_LAUNCH_HANDOFF_PACK_AUDIT_DRAFT",
      packName:PACK_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_LAUNCH_HANDOFF_PACK_VERSION,
      status:safe.status,
      nextDecisionOptions:safe.nextDecisionOptions.slice(),
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingManualLaunchHandoffPack(pack) {
    const safe = evaluateGlobalShoppingManualLaunchHandoffPack(pack || {});
    safe.rows = buildGlobalShoppingManualLaunchHandoffRows(safe);
    safe.sections = buildGlobalShoppingManualLaunchHandoffSections(safe);
    return safe;
  }

  function buildGlobalShoppingManualLaunchHandoffPack(input) {
    try {
      return sanitizeGlobalShoppingManualLaunchHandoffPack(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingManualLaunchHandoffPack({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingManualLaunchHandoffPack = {
    GLOBAL_SHOPPING_MANUAL_LAUNCH_HANDOFF_PACK_VERSION,
    PACK_NAME,
    buildGlobalShoppingManualLaunchHandoffPack,
    evaluateGlobalShoppingManualLaunchHandoffPack,
    buildGlobalShoppingManualLaunchHandoffRows,
    buildGlobalShoppingManualLaunchHandoffSections,
    buildGlobalShoppingManualLaunchHandoffPackAuditDraft,
    sanitizeGlobalShoppingManualLaunchHandoffPack
  };
})();
