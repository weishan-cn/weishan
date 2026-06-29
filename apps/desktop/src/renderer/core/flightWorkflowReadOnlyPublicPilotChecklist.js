;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_READ_ONLY_PUBLIC_PILOT_CHECKLIST_VERSION = "2.2.1";
  const CHECKLIST_NAME = "flight_workflow_read_only_public_pilot_checklist_v1";
  const SENSITIVE_RE = /https?:\/\/\S+|(?:token|apiKey|key|secret|password|credential|cardNumber)\s*[:=]?\s*\S+|身份证|护照|银行卡|passport|raw feedback|rawUserText/ig;
  const TRADING_RE = /"(bookingUrl|checkoutUrl|paymentUrl|orderUrl)"\s*:\s*"https?:\/\//i;
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(SENSITIVE_RE, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }; }
  function blockedInput(input) { const source = JSON.stringify(input && typeof input === "object" ? input : {}); return /rawUserTextStored"?\s*:?\s*true/i.test(source) || /secretStored"?\s*:?\s*true/i.test(source) || TRADING_RE.test(source); }
  function gateOf(input) { const safe = input && typeof input === "object" ? input : {}; return safe.betaExpansionGateSummary || safe.expansionGateSummary || safe.betaExpansionGate || {}; }
  function snapshotOf(input) { const safe = input && typeof input === "object" ? input : {}; return safe.pilotReadinessSnapshotSummary || safe.publicPilotReadinessSnapshotSummary || safe.snapshotSummary || {}; }
  function playbookOf(input) { const safe = input && typeof input === "object" ? input : {}; return safe.supportPlaybookSummary || safe.supportPlaybookConsoleSummary || safe.playbookSummary || {}; }
  function item(itemId, label, status, message) { return { itemId:itemId, label:safeText(label), status:/^(checked|needs_review|blocked)$/.test(status) ? status : "needs_review", message:safeText(message), redacted:true }; }
  function evaluateFlightWorkflowPublicPilotReadiness(input) {
    const safe = input && typeof input === "object" ? input : {};
    const gate = gateOf(safe);
    const snapshot = snapshotOf(safe);
    const playbook = playbookOf(safe);
    const betaExpansionApproved = safe.betaExpansionApproved === true || gate.status === "approved" || gate.decision && gate.decision.safeToExpandReadOnlyBeta === true;
    const safetyCopyReady = safe.safetyCopyReady !== false && !(gate.decision && gate.decision.decisionId === "improve_safety_copy");
    const scenarioMatrixReady = safe.scenarioMatrixReady === false ? false : (safe.scenarioMatrixReady === true || safe.safetyMatrixPass === true || !!(safe.safetyTestMatrixSummary && (safe.safetyTestMatrixSummary.status === "pass" || safe.safetyTestMatrixSummary.status === "ready")));
    const userReviewReady = safe.userReviewReady === false ? false : (safe.userReviewReady === true || safe.humanReviewReady === true || !!(safe.humanReviewChecklistSummary && safe.humanReviewChecklistSummary.status === "ready"));
    const forbiddenCapabilitiesVisible = safe.forbiddenCapabilitiesVisible !== false;
    const supportFallbackReady = safe.supportFallbackReady !== false && playbook.status !== "blocked";
    const issueReview = safe.issueReviewSummary || safe.issueReviewBoard || {};
    const supportReadiness = safe.supportReadinessSummary || safe.supportReadinessGate || {};
    const issuePattern = safe.issuePatternSummary || safe.issuePatternRadar || {};
    const issueHealth = issueReview.issueHealth || {};
    const issueReviewReady = issueReview.status !== "blocked";
    const supportReadinessReady = supportReadiness.status !== "blocked";
    const blocked = blockedInput(safe) || scenarioMatrixReady === false || gate.status === "blocked" || issueReview.status === "blocked" || supportReadiness.status === "blocked" || snapshot.status === "blocked" || playbook.status === "blocked";
    const readiness = { betaExpansionApproved:betaExpansionApproved, safetyCopyReady:safetyCopyReady, scenarioMatrixReady:scenarioMatrixReady, userReviewReady:userReviewReady, forbiddenCapabilitiesVisible:forbiddenCapabilitiesVisible, supportFallbackReady:supportFallbackReady && issueReviewReady && supportReadinessReady, issueReviewReady:issueReviewReady, issueRequiresInternalReview:issueHealth.requiresInternalReview === true, issueAffectsPilotExpansion:issueHealth.affectsPilotExpansion === true || supportReadiness.status === "needs_review" || issuePattern.status === "needs_review", safeForSmallPublicPilot:false };
    readiness.safeForSmallPublicPilot = !blocked && betaExpansionApproved && safetyCopyReady && scenarioMatrixReady && userReviewReady && forbiddenCapabilitiesVisible && supportFallbackReady && issueReviewReady && supportReadinessReady;
    let status = "needs_review";
    if (blocked) status = "blocked";
    else if (!betaExpansionApproved) status = "needs_internal_testing";
    else if (!safetyCopyReady || !userReviewReady || !forbiddenCapabilitiesVisible || !supportFallbackReady || !issueReviewReady || !supportReadinessReady) status = "needs_review";
    else if (readiness.safeForSmallPublicPilot) status = "ready";
    return clone({ status:status, readiness:readiness, redacted:true });
  }
  function buildFlightWorkflowPublicPilotChecklistItems(input) {
    const safe = input && typeof input === "object" ? input : {};
    const evaluation = evaluateFlightWorkflowPublicPilotReadiness(safe);
    const r = evaluation.readiness;
    return clone([
      item("read_only_scope", "只读范围说明", r.betaExpansionApproved ? "checked" : "needs_review", r.betaExpansionApproved ? "已说明公开试点仍为只读候选证据流程。" : "先继续内部测试，确认只读范围说明。"),
      item("safety_boundaries", "安全边界展示", r.safetyCopyReady ? "checked" : "needs_review", r.safetyCopyReady ? "付款、下单、出票、证件银行卡上传保持关闭。" : "安全边界说明仍需改进。"),
      item("feedback_collection", "反馈收集与脱敏", r.userReviewReady ? "checked" : "needs_review", r.userReviewReady ? "反馈只收集脱敏摘要。" : "人工反馈复核仍需补齐。"),
      item("forbidden_capabilities", "禁止能力展示", r.forbiddenCapabilitiesVisible ? "checked" : "needs_review", r.forbiddenCapabilitiesVisible ? "禁止能力已对测试人员可见。" : "需要展示禁止能力。"),
      item("support_fallback", "异常处理与人工反馈", r.supportFallbackReady ? "checked" : "needs_review", r.supportFallbackReady ? "异常时回到人工反馈和内部复核。" : "仍需准备异常处理回退。"),
      item("support_playbook", "支持处理手册", (safe && safe.supportPlaybookSummary && safe.supportPlaybookSummary.status) === "ready" ? "checked" : "needs_review", (safe && safe.supportPlaybookSummary && safe.supportPlaybookSummary.userFacingSummary && safe.supportPlaybookSummary.userFacingSummary.resultLabel) || "支持处理仍需复核。")
    ]);
  }
  function sanitizeFlightWorkflowPublicPilotChecklist(checklist) {
    const safe = checklist && typeof checklist === "object" ? checklist : {};
    return clone({ checklistName:CHECKLIST_NAME, appVersion:FLIGHT_WORKFLOW_READ_ONLY_PUBLIC_PILOT_CHECKLIST_VERSION, status:safeText(safe.status || "failed_safe"), readiness:Object.assign({ betaExpansionApproved:false, safetyCopyReady:false, scenarioMatrixReady:false, userReviewReady:false, forbiddenCapabilitiesVisible:false, supportFallbackReady:false, safeForSmallPublicPilot:false }, safe.readiness || {}), checklistItems:toArray(safe.checklistItems).map(function (entry) { return item(entry.itemId || "item", entry.label || "", entry.status || "needs_review", entry.message || ""); }), blockedItems:toArray(safe.blockedItems).map(function (entry) { return item(entry.itemId || "blocked", entry.label || "", "blocked", entry.message || ""); }), issueReviewSummary:clone(safe.issueReviewSummary || null), supportTriageSummary:clone(safe.supportTriageSummary || null), issuePatternSummary:clone(safe.issuePatternSummary || null), supportReadinessSummary:clone(safe.supportReadinessSummary || null), issuePatternStatus:safeText(safe.issuePatternStatus || safe.readiness && safe.readiness.issuePatternStatus || ""), supportReadinessStatus:safeText(safe.supportReadinessStatus || safe.readiness && safe.readiness.supportReadinessStatus || ""), supportReadyForPublicPilot:safe.supportReadyForPublicPilot === true || safe.readiness && safe.readiness.supportReadyForPublicPilot === true, repeatedIssueRisk:safe.repeatedIssueRisk === true || safe.readiness && safe.readiness.repeatedIssueRisk === true, pilotIssueReviewStatus:safeText(safe.pilotIssueReviewStatus || ""), issueAffectsPilotExpansion:safe.issueAffectsPilotExpansion === true || safe.readiness && safe.readiness.issueAffectsPilotExpansion === true, issueRequiresInternalReview:safe.issueRequiresInternalReview === true || safe.readiness && safe.readiness.issueRequiresInternalReview === true, pilotOnboardingSummary:clone(safe.pilotOnboardingSummary || null), readOnlyConsentSummary:clone(safe.readOnlyConsentSummary || null), pilotEntryStatus:safeText(safe.pilotEntryStatus || ""), canEnterReadOnlyPilot:safe.canEnterReadOnlyPilot === true, pilotConsentRequired:safe.pilotConsentRequired === true, userFacingSummary:Object.assign({ title:"只读公开试点检查清单", resultLabel:"暂不可试点", caveat:"公开试点仍然只覆盖只读候选证据流程，不提供付款、下单或出票能力。", redacted:true }, safe.userFacingSummary || {}), safety:safety(), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false, redacted:true });
  }
  function buildFlightWorkflowReadOnlyPublicPilotChecklist(input) {
    try {
      if (!input || typeof input !== "object" || Array.isArray(input)) return sanitizeFlightWorkflowPublicPilotChecklist({ status:"failed_safe" });
      const evaluation = evaluateFlightWorkflowPublicPilotReadiness(input);
      const items = buildFlightWorkflowPublicPilotChecklistItems(input);
      const blockedItems = items.filter(function (entry) { return entry.status === "blocked" || evaluation.status === "blocked" && entry.status !== "checked"; });
      const label = evaluation.status === "ready" ? "可以进入小范围只读试点" : (evaluation.status === "needs_internal_testing" ? "继续内部测试" : (evaluation.status === "blocked" ? "暂不可试点" : "仍需复核"));
      return sanitizeFlightWorkflowPublicPilotChecklist({ status:evaluation.status, readiness:evaluation.readiness, checklistItems:items, blockedItems:blockedItems, issuePatternSummary:input.issuePatternSummary || null, supportReadinessSummary:input.supportReadinessSummary || null, issuePatternStatus:input.issuePatternStatus || "", supportReadinessStatus:input.supportReadinessStatus || "", supportReadyForPublicPilot:input.supportReadyForPublicPilot === true, repeatedIssueRisk:input.repeatedIssueRisk === true, userFacingSummary:{ title:"只读公开试点检查清单", resultLabel:label, caveat:"公开试点仍然只覆盖只读候选证据流程，不提供付款、下单或出票能力。", redacted:true } });
    } catch (error) { return sanitizeFlightWorkflowPublicPilotChecklist({ status:"failed_safe" }); }
  }
  function buildFlightWorkflowReadOnlyPublicPilotChecklistAuditDraft(input) { const checklist = buildFlightWorkflowReadOnlyPublicPilotChecklist(input || {}); return clone({ eventType:"FLIGHT_WORKFLOW_READ_ONLY_PUBLIC_PILOT_CHECKLIST_AUDIT_DRAFT", checklistName:CHECKLIST_NAME, appVersion:FLIGHT_WORKFLOW_READ_ONLY_PUBLIC_PILOT_CHECKLIST_VERSION, status:checklist.status, safeForSmallPublicPilot:checklist.readiness.safeForSmallPublicPilot === true, blockedItemCount:checklist.blockedItems.length, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }); }
  window.WeishanFlightWorkflowReadOnlyPublicPilotChecklist = { FLIGHT_WORKFLOW_READ_ONLY_PUBLIC_PILOT_CHECKLIST_VERSION, CHECKLIST_NAME, buildFlightWorkflowReadOnlyPublicPilotChecklist, evaluateFlightWorkflowPublicPilotReadiness, buildFlightWorkflowPublicPilotChecklistItems, buildFlightWorkflowReadOnlyPublicPilotChecklistAuditDraft, sanitizeFlightWorkflowPublicPilotChecklist };
})();
