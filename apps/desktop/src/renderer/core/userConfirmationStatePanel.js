;(function () {
  "use strict";

  const USER_CONFIRMATION_STATE_PANEL_VERSION = "2.1.73";
  const PANEL_NAME = "user_confirmation_state_panel_v1";
  const FORBIDDEN_NAME_RE = /(rawText|rawInput|rawProviderResponse|rawResponse|rawPayload|token|key|secret|password|auth|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|identity|passport|bank|card|idNumber|passportNumber)/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function stripUnsafe(value) {
    if (Array.isArray(value)) return value.map(stripUnsafe).filter(function (item) { return item !== undefined; });
    if (!value || typeof value !== "object") return typeof value === "string" ? text(value).replace(/https?:\/\/\S+|token|key|secret|password/ig, "redacted") : value;
    const result = {};
    Object.keys(value).forEach(function (name) {
      const raw = value[name];
      const allowedNullUrl = /Url$/.test(name) && raw === null;
      const allowedFalse = /^(canPayHere|canOrderHere|canUploadIdentityHere|payment|order|identityUpload|secretStored|rawResponseStored)$/.test(name) && raw === false;
      if (FORBIDDEN_NAME_RE.test(name) && !allowedNullUrl && !allowedFalse) return;
      const next = stripUnsafe(raw);
      if (next !== undefined) result[name] = next;
    });
    return result;
  }
  function safety() { return { canPayHere:false, canOrderHere:false, canUploadIdentityHere:false, bookingUrl:null, payment:false, order:false, identityUpload:false, redacted:true }; }

  function confirmationsFor(input) {
    const safe = input && typeof input === "object" ? input : {};
    const receipt = safe.handoffReceiptSummary || safe.handoffReceipt || {};
    const manualCheck = safe.platformCheckSummary || safe.manualPlatformCheckSummary || safe.manualPlatformCheckEvidence || {};
    return {
      candidateSelected:!!(safe.selectedCandidate || safe.selectedCandidateSummary || safe.candidateSelected),
      providerHandoffConfirmed:safe.providerHandoffConfirmed === true || safe.userConfirmedProviderHandoff === true || receipt.userConfirmed === true || receipt.status === "confirmed",
      providerHandoffCancelled:safe.providerHandoffCancelled === true || receipt.status === "cancelled",
      safetyChecklistAccepted:safe.safetyChecklistAccepted === true || safe.handoffChecklistSummary && safe.handoffChecklistSummary.accepted === true || safe.handoffChecklistSummary && safe.handoffChecklistSummary.status === "accepted",
      platformCheckRecorded:manualCheck.status === "accepted" || manualCheck.status === "recorded" || safe.platformCheckRecorded === true,
      sensitiveInputBlocked:safe.sensitiveInputBlocked === true || manualCheck.sensitiveInputBlocked === true
    };
  }

  function labelsFor(confirmations) {
    const labels = [];
    if (confirmations.candidateSelected) labels.push("已选择候选");
    if (confirmations.safetyChecklistAccepted) labels.push("已确认安全提示");
    if (confirmations.providerHandoffConfirmed) labels.push("已确认前往平台");
    if (confirmations.providerHandoffCancelled) labels.push("已取消平台确认");
    if (confirmations.platformCheckRecorded) labels.push("已记录平台核对结果");
    if (confirmations.sensitiveInputBlocked) labels.push("敏感输入已阻断");
    return labels;
  }

  function nextRequired(confirmations) {
    if (!confirmations.candidateSelected) return { required:true, confirmationType:"select_candidate", message:"请先选择一个只读候选。" };
    if (!confirmations.providerHandoffConfirmed && !confirmations.providerHandoffCancelled) return { required:true, confirmationType:"provider_handoff", message:"请确认是否前往平台核对。" };
    if (confirmations.providerHandoffCancelled) return { required:true, confirmationType:"provider_handoff", message:"已取消平台确认；不会自动打开平台。" };
    if (!confirmations.platformCheckRecorded) return { required:true, confirmationType:"platform_check", message:"请手动记录平台核对结果。" };
    return { required:false, confirmationType:"none", message:"用户确认状态已完整，仅用于本地只读流程。" };
  }

  function evaluateUserConfirmationState(input) {
    try {
      if (!input || typeof input !== "object" || Array.isArray(input)) return "empty";
      if (input.status === "blocked" || input.restrictedCategory === true) return "blocked";
      const confirmations = confirmationsFor(input);
      return Object.keys(confirmations).some(function (key) { return confirmations[key] === true; }) ? "ready" : "empty";
    } catch (error) {
      return "failed_safe";
    }
  }

  function buildUserConfirmationStatePanel(input) {
    try {
      const safe = input && typeof input === "object" ? input : {};
      const confirmations = confirmationsFor(safe);
      const status = evaluateUserConfirmationState(safe);
      return clone({ panelName:PANEL_NAME, appVersion:USER_CONFIRMATION_STATE_PANEL_VERSION, status:status, confirmations:confirmations, labels:labelsFor(confirmations), nextRequiredConfirmation:nextRequired(confirmations), actionQueueSummary:stripUnsafe(safe.actionQueueSummary || null), progressTimelineSummary:stripUnsafe(safe.progressTimelineSummary || null), safeResumeCenterSummary:stripUnsafe(safe.safeResumeCenterSummary || null), blockedActions:stripUnsafe(safe.blockedActions || []), currentActionLabel:text(safe.currentActionLabel || ""), nextSafeActionLabel:text(safe.nextSafeActionLabel || ""), actionQueueTitle:"当前可继续操作", progressTimelineTitle:"进度时间线", blockedActionsTitle:"已阻断动作", safetyLimitTitle:"安全限制", safety:safety(), redacted:true });
    } catch (error) {
      return clone({ panelName:PANEL_NAME, appVersion:USER_CONFIRMATION_STATE_PANEL_VERSION, status:"failed_safe", confirmations:confirmationsFor({}), labels:[], nextRequiredConfirmation:{ required:true, confirmationType:"select_candidate", message:"确认状态已安全降级。" }, safety:safety(), redacted:true });
    }
  }

  function buildUserConfirmationStateAuditDraft(input) {
    const panel = buildUserConfirmationStatePanel(input || {});
    return clone({ eventType:"USER_CONFIRMATION_STATE_AUDIT_DRAFT", panelName:PANEL_NAME, appVersion:USER_CONFIRMATION_STATE_PANEL_VERSION, status:panel.status, nextRequiredConfirmation:panel.nextRequiredConfirmation, canPayHere:false, canOrderHere:false, canUploadIdentityHere:false, bookingUrl:null, payment:false, order:false, identityUpload:false, redacted:true });
  }

  window.WeishanUserConfirmationStatePanel = { USER_CONFIRMATION_STATE_PANEL_VERSION, PANEL_NAME, buildUserConfirmationStatePanel, evaluateUserConfirmationState, buildUserConfirmationStateAuditDraft };
})();
