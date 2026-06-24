;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_PILOT_SNAPSHOT_VIEW_MODEL_VERSION = "2.1.78";
  const VIEW_MODEL_NAME = "flight_workflow_pilot_snapshot_view_model_v1";
  const CAVEAT = "该快照只用于只读试点管理，不代表真实票价、库存、客服工单或出票能力。";
  const SENSITIVE_RE = /https?:\/\/\S+|(?:token|apiKey|key|secret|password|credential|cardNumber)\s*[:=]?\s*\S+|身份证|护照|银行卡|passport|raw feedback|rawUserText/ig;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).replace(SENSITIVE_RE, "redacted").trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function first() { for (let index = 0; index < arguments.length; index += 1) { const value = obj(arguments[index]); if (Object.keys(value).length) return value; } return {}; }
  function snapshotApi() { return window.WeishanFlightWorkflowPublicPilotReadinessSnapshot || {}; }
  function playbookApi() { return window.WeishanFlightWorkflowSupportPlaybookConsole || {}; }
  function snapshot(input) { const safe = obj(input); return first(safe.pilotReadinessSnapshotSummary, safe.publicPilotReadinessSnapshotSummary, safe.snapshotSummary, safe.readinessSnapshotSummary, typeof snapshotApi().buildFlightWorkflowPublicPilotReadinessSnapshot === "function" ? snapshotApi().buildFlightWorkflowPublicPilotReadinessSnapshot(safe) : null); }
  function playbook(input) { const safe = obj(input); return first(safe.supportPlaybookSummary, safe.playbookSummary, safe.supportPlaybookConsoleSummary, typeof playbookApi().buildFlightWorkflowSupportPlaybookConsole === "function" ? playbookApi().buildFlightWorkflowSupportPlaybookConsole(safe) : null); }
  function statusOf(snapshotSummary, playbookSummary) {
    const snapshotStatus = text(obj(snapshotSummary).status || "failed_safe");
    const playbookStatus = text(obj(playbookSummary).status || "ready");
    if (snapshotStatus === "blocked" || playbookStatus === "blocked") return "blocked";
    if (snapshotStatus === "needs_review" || playbookStatus === "needs_review") return "needs_review";
    if (snapshotStatus === "failed_safe" || playbookStatus === "failed_safe") return "failed_safe";
    if (snapshotStatus === "continue_small_pilot") return "continue_small_pilot";
    return "ready";
  }
  function card(cardId, label, value) { return { cardId: cardId, label: text(label), value: text(value), redacted: true }; }
  function rowsFromSnapshot(snapshotSummary) { return clone(toArray(obj(snapshotSummary).rows).map(function (row) { return { rowId: text(row.rowId || "row"), label: text(row.label || ""), value: text(row.value || ""), status: /^(pass|warning|blocked)$/.test(row.status) ? row.status : "pass", redacted: true }; })); }
  function rowsFromPlaybook(playbookSummary) { return clone(toArray(obj(playbookSummary).playbookItems).map(function (item) { return { rowId: text(item.itemId || "item"), label: text(item.issueLabel || ""), value: text(item.actionLabel || ""), status: item.status === "blocked" ? "blocked" : (item.status === "warning" ? "warning" : "pass"), redacted: true }; })); }
  function forbiddenRows(playbookSummary) { return clone(toArray(obj(playbookSummary).forbiddenSupportActions).map(function (item, index) { return { rowId: "forbidden_" + index, label: "禁止动作", value: text(item), status: "blocked", redacted: true }; })); }
  function buildFlightWorkflowPilotSnapshotCards(input) {
    const snapshotSummary = snapshot(input || {});
    const playbookSummary = playbook(input || {});
    const status = statusOf(snapshotSummary, playbookSummary);
    return clone([
      card("pilot", "试点状态", obj(snapshotSummary.userFacingSummary).resultLabel || status),
      card("support", "支持准备", obj(playbookSummary.userFacingSummary).resultLabel || playbookSummary.status || "支持处理路径已准备"),
      card("issues", "问题趋势", obj(snapshotSummary.issuePatternSummary).userFacingSummary && obj(snapshotSummary.issuePatternSummary.userFacingSummary).resultLabel || obj(snapshotSummary.issuePatternSummary).patternSummary && obj(snapshotSummary.issuePatternSummary).patternSummary.message || "暂无明显共性问题"),
      card("next_step", "下一步", obj(snapshotSummary.userFacingSummary).resultLabel || obj(playbookSummary.userFacingSummary).resultLabel || "继续观察只读试点反馈")
    ]);
  }
  function buildFlightWorkflowPilotSnapshotRows(input) { return rowsFromSnapshot(snapshot(input || {})); }
  function buildFlightWorkflowSupportPlaybookRows(input) { return rowsFromPlaybook(playbook(input || {})); }
  function sanitizeFlightWorkflowPilotSnapshotViewModel(vm) {
    const safe = obj(vm);
    const status = /^(ready|continue_small_pilot|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    return clone({
      viewModelName: VIEW_MODEL_NAME,
      appVersion: FLIGHT_WORKFLOW_PILOT_SNAPSHOT_VIEW_MODEL_VERSION,
      status: status,
      title: "只读试点状态快照",
      cards: Array.isArray(safe.cards) ? safe.cards.map(function (item) { return card(item.cardId || "card", item.label || "", item.value || ""); }) : [],
      snapshotRows: toArray(safe.snapshotRows),
      playbookRows: toArray(safe.playbookRows),
      forbiddenSupportRows: toArray(safe.forbiddenSupportRows),
      caveat: text(safe.caveat || CAVEAT),
      redacted: true,
      snapshotName: text(safe.snapshotName || "flight_workflow_public_pilot_readiness_snapshot_v1"),
      playbookName: text(safe.playbookName || "flight_workflow_support_playbook_console_v1")
    });
  }
  function buildFlightWorkflowPilotSnapshotViewModel(input) {
    try {
      const snapshotSummary = snapshot(input || {});
      const playbookSummary = playbook(input || {});
      const status = statusOf(snapshotSummary, playbookSummary);
      return sanitizeFlightWorkflowPilotSnapshotViewModel({
        viewModelName: VIEW_MODEL_NAME,
        appVersion: FLIGHT_WORKFLOW_PILOT_SNAPSHOT_VIEW_MODEL_VERSION,
        status: status,
        title: "只读试点状态快照",
        cards: buildFlightWorkflowPilotSnapshotCards(input || {}),
        snapshotRows: buildFlightWorkflowPilotSnapshotRows(input || {}),
        playbookRows: buildFlightWorkflowSupportPlaybookRows(input || {}),
        forbiddenSupportRows: forbiddenRows(playbookSummary),
        caveat: CAVEAT,
        snapshotName: obj(snapshotSummary).snapshotName || "flight_workflow_public_pilot_readiness_snapshot_v1",
        playbookName: obj(playbookSummary).playbookName || "flight_workflow_support_playbook_console_v1",
        redacted: true
      });
    } catch (error) {
      return sanitizeFlightWorkflowPilotSnapshotViewModel({ viewModelName: VIEW_MODEL_NAME, appVersion: FLIGHT_WORKFLOW_PILOT_SNAPSHOT_VIEW_MODEL_VERSION, status: "failed_safe", title: "只读试点状态快照", cards: [], snapshotRows: [], playbookRows: [], forbiddenSupportRows: [], caveat: CAVEAT, redacted: true });
    }
  }
  function buildFlightWorkflowPilotSnapshotViewModelAuditDraft(input) {
    const vm = buildFlightWorkflowPilotSnapshotViewModel(input || {});
    return clone({
      eventType: "FLIGHT_WORKFLOW_PILOT_SNAPSHOT_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName: VIEW_MODEL_NAME,
      appVersion: FLIGHT_WORKFLOW_PILOT_SNAPSHOT_VIEW_MODEL_VERSION,
      status: vm.status,
      cardCount: vm.cards.length,
      snapshotRowCount: vm.snapshotRows.length,
      playbookRowCount: vm.playbookRows.length,
      forbiddenSupportRowCount: vm.forbiddenSupportRows.length,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      rawUserTextStored: false,
      rawResponseStored: false,
      secretStored: false,
      fileWrite: false,
      download: false,
      autoOpen: false,
      autoRefresh: false,
      redacted: true
    });
  }

  window.WeishanFlightWorkflowPilotSnapshotViewModel = {
    FLIGHT_WORKFLOW_PILOT_SNAPSHOT_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildFlightWorkflowPilotSnapshotViewModel,
    buildFlightWorkflowPilotSnapshotCards,
    buildFlightWorkflowPilotSnapshotRows,
    buildFlightWorkflowSupportPlaybookRows,
    buildFlightWorkflowPilotSnapshotViewModelAuditDraft,
    sanitizeFlightWorkflowPilotSnapshotViewModel
  };
})();
