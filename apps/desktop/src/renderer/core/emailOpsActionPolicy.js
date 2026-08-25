;(function () {
  "use strict";

  const VERSION = "4.2.8";
  const MODULE_NAME = "email_ops_action_policy_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }

  function classifyOutgoingPolicy(classification, config) {
    const safe = obj(classification);
    const category = text(safe.category || "UNKNOWN");
    const sendEnabled = obj(config).EMAIL_SEND_ENABLED === true;
    let communicationPolicy = "DRAFT_ONLY";
    if (category === "USER_BUG_REPORT" || category === "USER_FEEDBACK") communicationPolicy = "AUTO_ACK_ALLOWED";
    if (category === "USER_QUESTION" || category === "PROVIDER_REPLY") communicationPolicy = "DRAFT_ONLY";
    if (["BILLING_FINANCIAL", "KYC_IDENTITY", "SECURITY_REPORT"].includes(category)) communicationPolicy = "HUMAN_APPROVAL_REQUIRED";
    if (["LEGAL_CONTRACT", "SECURITY_OTP", "SECURITY_NOTIFICATION"].includes(category)) communicationPolicy = "NEVER_AUTO_SEND";
    if (safe.senderSpoofingSuspected === true || safe.promptInjectionDetected === true) communicationPolicy = "HUMAN_APPROVAL_REQUIRED";

    return clone({
      communicationPolicy,
      EMAIL_SEND_ENABLED:sendEnabled,
      realSendAllowed:false,
      draftAllowed:communicationPolicy === "DRAFT_ONLY" || communicationPolicy === "AUTO_ACK_ALLOWED",
      humanApprovalRequired:communicationPolicy === "HUMAN_APPROVAL_REQUIRED" || communicationPolicy === "NEVER_AUTO_SEND",
      reason:sendEnabled ? "global send remains blocked until separate approval" : "global send kill switch is off",
      redacted:true
    });
  }

  function buildHumanQueueItem(message, classification, policy) {
    const safe = obj(classification);
    const action = obj(policy).humanApprovalRequired === true || safe.confidence === "LOW";
    if (!action) return null;
    const priority = safe.category === "SECURITY_REPORT" || safe.riskFlags && safe.riskFlags.includes("SENDER_SPOOFING_REVIEW")
      ? "P0"
      : (safe.category === "BILLING_FINANCIAL" || safe.category === "KYC_IDENTITY" || safe.category === "LEGAL_CONTRACT" ? "P1" : "P2");
    return clone({
      type:safe.category,
      priority,
      entity:safe.providerId || safe.threadId || safe.messageId || "unknown",
      action:safe.category === "SECURITY_OTP" ? "Use only in an explicitly active provider verification workflow; otherwise discard when expired." : "Review message and approve next action if appropriate.",
      reason:safe.reason || "human review required",
      estimatedTime:priority === "P0" ? "2-5 minutes" : "1-3 minutes",
      blockingImpact:safe.providerId ? "provider workflow may remain blocked" : "support/triage remains pending",
      safeContext:{ messageId:obj(message).messageId || "", threadId:obj(message).threadId || "", category:safe.category, redacted:true },
      redacted:true
    });
  }

  function createAuditEvent(eventType, payload) {
    const safe = obj(payload);
    return clone({
      eventType:text(eventType),
      messageId:text(safe.messageId),
      threadId:text(safe.threadId),
      category:text(safe.category),
      providerId:text(safe.providerId),
      actor:text(safe.actor || "machine"),
      bodyStored:false,
      secretStored:false,
      redacted:true
    });
  }

  window.WeishanEmailOpsActionPolicy = {
    VERSION,
    MODULE_NAME,
    classifyOutgoingPolicy,
    buildHumanQueueItem,
    createAuditEvent
  };
})();
