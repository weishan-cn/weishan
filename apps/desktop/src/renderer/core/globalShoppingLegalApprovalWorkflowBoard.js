;(function () {
  "use strict";

  const GLOBAL_SHOPPING_LEGAL_APPROVAL_WORKFLOW_BOARD_VERSION = "2.3.3";
  const BOARD_NAME = "global_shopping_legal_approval_workflow_board_v1";
  const REQUIRED_STAGES = [
    "法务审查",
    "安全审查",
    "隐私审查",
    "凭证隔离审查",
    "Provider 合同审查",
    "数据保留审查",
    "反爬/平台政策审查",
    "只读范围审查",
    "禁止自动下单/支付代理审查",
    "最终人工 release gate"
  ];

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawResponse|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function stage(stageId, label, status, summary, caveat) {
    return {
      stageId:text(stageId),
      label:text(label),
      status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review",
      summary:text(summary),
      caveat:text(caveat),
      redacted:true
    };
  }
  function safety(overrides) {
    return Object.assign({
      fileWrite:false,
      download:false,
      realNameStored:false,
      phoneStored:false,
      emailStored:false,
      identityUpload:false,
      credentialInput:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    }, obj(overrides));
  }

  function normalizedStages(input) {
    const provided = toArray(obj(input).approvalStages);
    if (provided.length) return provided.map(function (item, index) {
      const safe = obj(item);
      return stage(safe.stageId || ("approval_stage_" + index), safe.label || "", safe.status || "needs_review", safe.summary || "", safe.caveat || "");
    });
    return REQUIRED_STAGES.map(function (label, index) {
      return stage("required_stage_" + index, label, "needs_review", label + " 仍需人工补齐。", "当前不自动创建任何审批动作。");
    });
  }

  function evaluateGlobalShoppingLegalApprovalWorkflowBoard(input) {
    const safe = obj(input);
    const stages = normalizedStages(safe);
    const stageLabels = stages.map(function (item) { return text(item.label); }).filter(Boolean);
    const missingStages = REQUIRED_STAGES.filter(function (label) { return stageLabels.indexOf(label) === -1; });
    const blocked =
      safe.createApprovalTask === true ||
      safe.sendEmail === true ||
      safe.openExternalDoc === true ||
      safe.claimApprovalComplete === true ||
      safe.startProviderIntegration === true ||
      safe.enableProvider === true ||
      safe.callProvider === true ||
      safe.openExternal === true ||
      safe.windowOpen === true;
    return clone({
      status:blocked ? "blocked" : (missingStages.length ? "needs_review" : "ready"),
      approvalStages:stages,
      missingStages:missingStages,
      blockedReasons:blocked ? [
        safe.createApprovalTask === true ? "approval_task_detected" : "",
        safe.sendEmail === true ? "email_detected" : "",
        safe.openExternalDoc === true ? "external_doc_detected" : "",
        safe.claimApprovalComplete === true ? "approval_completion_claim_detected" : "",
        safe.startProviderIntegration === true ? "provider_integration_start_detected" : "",
        safe.enableProvider === true ? "provider_enablement_detected" : "",
        safe.callProvider === true ? "provider_call_detected" : "",
        safe.openExternal === true || safe.windowOpen === true ? "external_open_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingLegalApprovalWorkflowStages(input) {
    const evaluation = evaluateGlobalShoppingLegalApprovalWorkflowBoard(input);
    const missing = evaluation.missingStages;
    return clone(REQUIRED_STAGES.map(function (label, index) {
      return stage("required_stage_" + index, label, missing.indexOf(label) >= 0 ? "needs_review" : (evaluation.status === "blocked" ? "blocked" : "pass"), missing.indexOf(label) >= 0 ? (label + " 仍需人工补齐。") : (label + " 已纳入审批准备。"), "审批流程板只展示准备状态，不创建任务、不发邮件、不打开外部文档。");
    }));
  }

  function buildGlobalShoppingLegalApprovalWorkflowRows(input) {
    const evaluation = evaluateGlobalShoppingLegalApprovalWorkflowBoard(input);
    return clone(buildGlobalShoppingLegalApprovalWorkflowStages(input).map(function (item) {
      return row(item.stageId, item.label, item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    }).concat([
      row("legal_approval_board", "法务审批流程板", evaluation.status === "ready" ? "法务审批流程板已准备" : "法务审批流程板仍需复核", evaluation.status === "blocked" ? "blocked" : (evaluation.status === "ready" ? "pass" : "warning")),
      row("legal_approval_boundary", "审批流程不创建任务、不发邮件", "当前只记录审批步骤与人工 review requirement", evaluation.status === "blocked" ? "blocked" : "pass")
    ]));
  }

  function buildGlobalShoppingLegalApprovalWorkflowBoardAuditDraft(input) {
    const board = buildGlobalShoppingLegalApprovalWorkflowBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_LEGAL_APPROVAL_WORKFLOW_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_LEGAL_APPROVAL_WORKFLOW_BOARD_VERSION,
      status:board.status,
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

  function sanitizeGlobalShoppingLegalApprovalWorkflowBoard(board) {
    const safe = obj(board);
    const evaluation = evaluateGlobalShoppingLegalApprovalWorkflowBoard(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_LEGAL_APPROVAL_WORKFLOW_BOARD_VERSION,
      status:status,
      title:"法务审批流程板",
      approvalBoundary:{
        boardId:text(safe.boardId || "global-shopping-legal-approval-workflow-board"),
        boardMode:/^(disabled|planning_only|review_only|workflow_only)$/.test(text(safe.boardMode)) ? text(safe.boardMode) : "workflow_only",
        readOnly:true,
        planningOnly:true,
        workflowOnly:true,
        canCreateApprovalTask:false,
        canSendEmail:false,
        canOpenExternalDoc:false,
        canClaimApprovalComplete:false,
        canStartProviderIntegration:false,
        canEnableProvider:false,
        canCallProvider:false
      },
      approvalStages:toArray(safe.approvalStages).length ? normalizedStages(safe) : buildGlobalShoppingLegalApprovalWorkflowStages(safe),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingLegalApprovalWorkflowRows(safe),
      missingStages:evaluation.missingStages,
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"法务审批流程板",
        resultLabel:status === "ready" ? "法务审批流程板已准备" : (status === "blocked" ? "法务审批流程板已阻断" : "法务审批流程板仍需复核"),
        caveat:"当前只展示审批准备步骤，不创建任务、不发邮件、不打开外部文档，不启动 provider 接入。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingLegalApprovalWorkflowBoard(input) {
    try {
      return sanitizeGlobalShoppingLegalApprovalWorkflowBoard(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingLegalApprovalWorkflowBoard({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingLegalApprovalWorkflowBoard = {
    GLOBAL_SHOPPING_LEGAL_APPROVAL_WORKFLOW_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingLegalApprovalWorkflowBoard,
    evaluateGlobalShoppingLegalApprovalWorkflowBoard,
    buildGlobalShoppingLegalApprovalWorkflowRows,
    buildGlobalShoppingLegalApprovalWorkflowStages,
    buildGlobalShoppingLegalApprovalWorkflowBoardAuditDraft,
    sanitizeGlobalShoppingLegalApprovalWorkflowBoard
  };
})();
