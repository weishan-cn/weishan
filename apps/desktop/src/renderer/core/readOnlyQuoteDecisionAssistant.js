;(function () {
  "use strict";

  const READ_ONLY_QUOTE_DECISION_ASSISTANT_VERSION = "2.4.1";
  const ASSISTANT_NAME = "read_only_quote_decision_assistant_v1";
  const FORBIDDEN_NAME_RE = /(rawProviderResponse|rawResponse|rawPayload|token|key|secret|password|auth|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|identity|passport|bank|card)/i;
  const FORBIDDEN_TEXT_RE = /全网最低|最低价保证|真实最终价|已锁价|可以出票|可直接出票|付款|下单/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }

  function safeText(value) {
    return text(value).replace(FORBIDDEN_TEXT_RE, "本地只读候选证据");
  }

  function stripUnsafe(value) {
    if (Array.isArray(value)) return value.map(stripUnsafe).filter(function (item) { return item !== undefined; });
    if (!value || typeof value !== "object") return value;
    const result = {};
    Object.keys(value).forEach(function (name) {
      const raw = value[name];
      const allowedNullUrl = /Url$/.test(name) && raw === null;
      const allowedFalseSafetyFlag = /Stored$|Included$/.test(name) && raw === false;
      if (FORBIDDEN_NAME_RE.test(name) && !allowedNullUrl && !allowedFalseSafetyFlag) return;
      const next = stripUnsafe(raw);
      if (next !== undefined) result[name] = next;
    });
    return result;
  }

  function normalizeCandidate(candidate, index) {
    const safe = stripUnsafe(candidate && typeof candidate === "object" ? candidate : {}) || {};
    return {
      quoteId: safeText(safe.quoteId || safe.selectedQuoteId || ""),
      rank: number(safe.rank) || index + 1,
      providerName: safeText(safe.providerName || safe.selectedProviderName || "只读候选"),
      providerMode: safeText(safe.providerMode || "sandbox_read_only"),
      responseShape: safeText(safe.responseShape || "unsupported"),
      fareSource: safeText(safe.fareSource || "sandbox_read_only_import"),
      currency: safeText(safe.currency || "CNY"),
      totalPrice: number(safe.totalPrice),
      baseFare: number(safe.baseFare),
      taxesAndFees: number(safe.taxesAndFees),
      providerFees: number(safe.providerFees),
      freshnessMinutes: number(safe.freshnessMinutes),
      safeProviderHandoffReady: safe.safeProviderHandoffReady === true
    };
  }

  function topCandidatesFrom(input) {
    const safe = input && typeof input === "object" ? input : {};
    const list = Array.isArray(safe.candidates) ? safe.candidates
      : (Array.isArray(safe.topCandidates) ? safe.topCandidates
        : (Array.isArray(safe.dryRunTopCandidates) ? safe.dryRunTopCandidates
          : (safe.rankingPreview && Array.isArray(safe.rankingPreview.topCandidates) ? safe.rankingPreview.topCandidates : [])));
    return list.slice(0, 3).map(normalizeCandidate);
  }

  function selectedFrom(candidates, options) {
    const safeOptions = options && typeof options === "object" ? options : {};
    const selected = safeOptions.selectedCandidate && typeof safeOptions.selectedCandidate === "object" ? normalizeCandidate(safeOptions.selectedCandidate, 0) : null;
    if (selected && selected.quoteId) {
      const match = candidates.find(function (candidate) { return candidate.quoteId && candidate.quoteId === selected.quoteId; });
      if (match) return match;
    }
    return candidates.find(function (candidate) { return candidate.rank === 1; }) || candidates[0] || null;
  }

  function buildWarnings(candidate) {
    const warnings = [
      "平台最终为准，价格、库存、税费和规则以平台页面为准。",
      "本推荐仅基于本地只读候选证据，不代表真实最终价。",
      "未锁价，不代表可出票。",
      "仍需平台确认。"
    ];
    if (candidate && candidate.safeProviderHandoffReady !== true) warnings.push("当前推荐候选的平台确认链接不可用。");
    return warnings.map(safeText);
  }

  function evaluateReadOnlyQuoteCandidateDecision(candidates, options) {
    try {
      if (!Array.isArray(candidates)) {
        return clone({
          assistantName: ASSISTANT_NAME,
          appVersion: READ_ONLY_QUOTE_DECISION_ASSISTANT_VERSION,
          status: "failed_safe",
          decisionScope: "local_read_only_candidates",
          recommendationType: "candidate_evidence_only",
          recommendedCandidate: null,
          candidateCount: 0,
          rawResponseStored: false,
          secretStored: false,
          redacted: true
        });
      }
      const list = candidates.slice(0, 3).map(normalizeCandidate);
      const recommended = selectedFrom(list, options);
      return clone({
        assistantName: ASSISTANT_NAME,
        appVersion: READ_ONLY_QUOTE_DECISION_ASSISTANT_VERSION,
        status: list.length ? "ready" : "empty",
        decisionScope: "local_read_only_candidates",
        recommendationType: "candidate_evidence_only",
        recommendedCandidate: recommended,
        candidateCount: list.length,
        comparedFields: ["totalPrice", "baseFare", "taxesAndFees", "providerFees", "freshnessMinutes", "providerName", "safeProviderHandoffReady"],
        canClaimLowestAcrossWeb: false,
        canClaimFinalBookablePrice: false,
        rawResponseStored: false,
        secretStored: false,
        redacted: true
      });
    } catch (error) {
      return clone({
        assistantName: ASSISTANT_NAME,
        appVersion: READ_ONLY_QUOTE_DECISION_ASSISTANT_VERSION,
        status: "failed_safe",
        decisionScope: "local_read_only_candidates",
        recommendationType: "candidate_evidence_only",
        recommendedCandidate: null,
        candidateCount: 0,
        rawResponseStored: false,
        secretStored: false,
        redacted: true
      });
    }
  }

  function buildReadOnlyQuoteRecommendationExplanation(decision, options) {
    const safeDecision = decision && typeof decision === "object" ? decision : {};
    const candidate = safeDecision.recommendedCandidate || null;
    const supportingReasons = [
      "价格拆分完整。",
      "平台最终为准。",
      "未锁价，不代表可出票。"
    ];
    if (candidate && candidate.freshnessMinutes != null) supportingReasons.unshift("包含 freshness 证据。");
    return clone({
      primaryReason: candidate ? "该候选在本次只读候选样本中合计金额较低。" : "暂无可解释的本地只读候选证据。",
      supportingReasons: supportingReasons.map(safeText),
      riskWarnings: buildWarnings(candidate),
      platformCheckLine: options && options.manualPlatformCheckEvidence ? "平台核对结果已记录" : "仍需平台确认",
      platformDeltaLine: options && options.platformCheckDelta && options.platformCheckDelta.deltaDirection && options.platformCheckDelta.deltaDirection !== "same" && options.platformCheckDelta.deltaDirection !== "unknown" ? "平台页面结果与候选价存在差异，平台最终为准" : "平台最终为准",
      confidenceLine: options && options.confidenceLabelSummary && options.confidenceLabelSummary.confidenceLabel ? "候选价置信标签：" + safeText(options.confidenceLabelSummary.confidenceLabel) : "候选价置信标签：不可确认",
      nextStepLine: options && options.safeNextStepSummary && options.safeNextStepSummary.recommendation ? "下一步安全建议：" + safeText(options.safeNextStepSummary.recommendation) : "下一步安全建议：前往平台继续核对",
      redacted: true
    });
  }

  function workflowFields(input) {
    const safe = input && typeof input === "object" ? input : {};
    return {
      workflowStateSummary: stripUnsafe(safe.workflowStateSummary || null),
      clarificationSummary: stripUnsafe(safe.clarificationSummary || null),
      continuitySummary: stripUnsafe(safe.continuitySummary || null),
      confirmationStateSummary: stripUnsafe(safe.confirmationStateSummary || null),
      recoverySummary: stripUnsafe(safe.recoverySummary || null),
      resumeCoachSummary: stripUnsafe(safe.resumeCoachSummary || null),
      actionQueueSummary: stripUnsafe(safe.actionQueueSummary || safe.actionQueue || null),
      progressTimelineSummary: stripUnsafe(safe.progressTimelineSummary || safe.progressTimeline || null),
      safeResumeCenterSummary: stripUnsafe(safe.safeResumeCenterSummary || safe.safeResumeCenter || null),
      blockedActions: stripUnsafe(Array.isArray(safe.blockedActions) ? safe.blockedActions : (safe.actionQueueSummary && safe.actionQueueSummary.blockedActions || [])),
      currentActionLabel: safeText(safe.currentActionLabel || ""),
      nextSafeActionLabel: safeText(safe.nextSafeActionLabel || safe.nextSafeAction || ""),
      actionQueue: stripUnsafe(safe.actionQueueSummary || safe.actionQueue || null),
      progressTimeline: stripUnsafe(safe.progressTimelineSummary || safe.progressTimeline || null),
      safeResumeCenter: stripUnsafe(safe.safeResumeCenterSummary || safe.safeResumeCenter || null),
      nextSafeAction: safeText(safe.nextSafeActionLabel || safe.nextSafeAction || ""),
      currentStage: safeText(safe.currentStage || ""),
      workflowStageLabel: safeText(safe.workflowStageLabel || safe.continuitySummary && safe.continuitySummary.stageLabel || ""),
      nextStepLabel: safeText(safe.nextStepLabel || ""),
      canResumeWorkflow: safe.canResumeWorkflow === true,
      resumeActions: stripUnsafe(Array.isArray(safe.resumeActions) ? safe.resumeActions : (safe.resumeCoachSummary && safe.resumeCoachSummary.allowedActions || [])),
      workflowStepList: stripUnsafe(safe.workflowStepList || null),
      missingFields: Array.isArray(safe.missingFields) ? safe.missingFields.map(safeText) : [],
      clarificationQuestions: Array.isArray(safe.clarificationQuestions) ? safe.clarificationQuestions.map(safeText) : [],
      workflowUserMessage: safeText(safe.workflowUserMessage || "")
    };
  }

  function emptyOutput(status, input) {
    return Object.assign({
      assistantName: ASSISTANT_NAME,
      appVersion: READ_ONLY_QUOTE_DECISION_ASSISTANT_VERSION,
      status: status,
      decisionScope: "local_read_only_candidates",
      recommendationType: "candidate_evidence_only",
      recommendedCandidate: null,
      reasoning: buildReadOnlyQuoteRecommendationExplanation({ recommendedCandidate:null }),
      comparison: {
        candidateCount: 0,
        comparedFields: ["totalPrice", "baseFare", "taxesAndFees", "providerFees", "freshnessMinutes", "providerName", "safeProviderHandoffReady"],
        canClaimLowestAcrossWeb: false,
        canClaimFinalBookablePrice: false
      },
      actions: {
        canOpenProviderConfirmation: false,
        providerConfirmationRequiresUserConfirm: true,
        canPayHere: false,
        canOrderHere: false,
        canUploadIdentityHere: false
      },
      safety: {
        userFacingRealPriceEnabled: false,
        showableAsRealPrice: false,
        canReplaceMainResultCard: false,
        bookingUrl: null,
        checkoutUrl: null,
        paymentUrl: null,
        orderUrl: null,
        autoOpen: false,
        payment: false,
        order: false,
        identityUpload: false,
        rawResponseStored: false,
        secretStored: false,
        redacted: true
      },
      redacted: true
    }, workflowFields(input));
  }

  function sanitizeReadOnlyQuoteDecisionAssistantOutput(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    return clone(Object.assign({}, safe, {
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      rawResponseStored: false,
      secretStored: false,
      redacted: true
    }));
  }

  function buildReadOnlyQuoteDecisionAssistant(input) {
    try {
      if (!input || typeof input !== "object" || Array.isArray(input)) return clone(emptyOutput("failed_safe", input));
      const candidates = topCandidatesFrom(input);
      if (!candidates.length) return clone(emptyOutput("empty", input));
      const decision = evaluateReadOnlyQuoteCandidateDecision(candidates, { selectedCandidate: input.selectedCandidate });
      const reasoning = buildReadOnlyQuoteRecommendationExplanation(decision, input);
      const recommended = decision.recommendedCandidate;
      return sanitizeReadOnlyQuoteDecisionAssistantOutput({
        assistantName: ASSISTANT_NAME,
        appVersion: READ_ONLY_QUOTE_DECISION_ASSISTANT_VERSION,
        status: decision.status,
        decisionScope: "local_read_only_candidates",
        recommendationType: "candidate_evidence_only",
        recommendedCandidate: recommended,
        reasoning: reasoning,
        handoffChecklistSummary: stripUnsafe(input.handoffChecklistSummary || input.handoffChecklist || null),
        handoffReceiptSummary: stripUnsafe(input.handoffReceiptSummary || input.handoffReceipt || null),
        manualPlatformCheckSummary: stripUnsafe(input.manualPlatformCheckSummary || input.manualPlatformCheckEvidence || null),
        platformCheckDeltaSummary: stripUnsafe(input.platformCheckDeltaSummary || input.platformCheckDelta || null),
        reconciliationSummary: stripUnsafe(input.reconciliationSummary || input.platformCheckReconciliation || null),
        confidenceLabelSummary: stripUnsafe(input.confidenceLabelSummary || null),
        safeNextStepSummary: stripUnsafe(input.safeNextStepSummary || null),
        platformCheckOutcomeSummary: stripUnsafe(input.platformCheckOutcomeSummary || null),
        workflowStateSummary: stripUnsafe(input.workflowStateSummary || null),
        clarificationSummary: stripUnsafe(input.clarificationSummary || null),
        continuitySummary: stripUnsafe(input.continuitySummary || null),
        confirmationStateSummary: stripUnsafe(input.confirmationStateSummary || null),
        recoverySummary: stripUnsafe(input.recoverySummary || null),
        resumeCoachSummary: stripUnsafe(input.resumeCoachSummary || null),
        actionQueueSummary: stripUnsafe(input.actionQueueSummary || input.actionQueue || null),
        progressTimelineSummary: stripUnsafe(input.progressTimelineSummary || input.progressTimeline || null),
        safeResumeCenterSummary: stripUnsafe(input.safeResumeCenterSummary || input.safeResumeCenter || null),
        blockedActions: stripUnsafe(Array.isArray(input.blockedActions) ? input.blockedActions : (input.actionQueueSummary && input.actionQueueSummary.blockedActions || [])),
        currentActionLabel: safeText(input.currentActionLabel || ""),
        nextSafeActionLabel: safeText(input.nextSafeActionLabel || input.nextSafeAction || ""),
        actionQueue: stripUnsafe(input.actionQueueSummary || input.actionQueue || null),
        progressTimeline: stripUnsafe(input.progressTimelineSummary || input.progressTimeline || null),
        safeResumeCenter: stripUnsafe(input.safeResumeCenterSummary || input.safeResumeCenter || null),
        nextSafeAction: safeText(input.nextSafeActionLabel || input.nextSafeAction || ""),
        currentStage: safeText(input.currentStage || ""),
        workflowStageLabel: safeText(input.workflowStageLabel || input.continuitySummary && input.continuitySummary.stageLabel || ""),
        nextStepLabel: safeText(input.nextStepLabel || ""),
        canResumeWorkflow: input.canResumeWorkflow === true,
        resumeActions: stripUnsafe(Array.isArray(input.resumeActions) ? input.resumeActions : (input.resumeCoachSummary && input.resumeCoachSummary.allowedActions || [])),
        workflowStepList: stripUnsafe(input.workflowStepList || null),
        missingFields: Array.isArray(input.missingFields) ? input.missingFields.map(safeText) : [],
        clarificationQuestions: Array.isArray(input.clarificationQuestions) ? input.clarificationQuestions.map(safeText) : [],
        workflowUserMessage: safeText(input.workflowUserMessage || ""),
        platformCheckWarnings: input.manualPlatformCheckEvidence ? ["平台核对结果已记录", "平台最终为准"] : ["仍需平台确认"],
        comparison: {
          candidateCount: decision.candidateCount,
          comparedFields: decision.comparedFields,
          canClaimLowestAcrossWeb: false,
          canClaimFinalBookablePrice: false
        },
        actions: {
          canOpenProviderConfirmation: !!(recommended && recommended.safeProviderHandoffReady === true),
          providerConfirmationRequiresUserConfirm: true,
          canPayHere: false,
          canOrderHere: false,
          canUploadIdentityHere: false
        },
        safety: {
          userFacingRealPriceEnabled: false,
          showableAsRealPrice: false,
          canReplaceMainResultCard: false,
          bookingUrl: null,
          checkoutUrl: null,
          paymentUrl: null,
          orderUrl: null,
          autoOpen: false,
          payment: false,
          order: false,
          identityUpload: false,
          rawResponseStored: false,
          secretStored: false,
          redacted: true
        },
        redacted: true
      });
    } catch (error) {
      return clone(emptyOutput("failed_safe"));
    }
  }

  function buildReadOnlyQuoteDecisionAssistantAuditDraft(input) {
    const model = buildReadOnlyQuoteDecisionAssistant(input);
    return clone({
      eventType: "READ_ONLY_QUOTE_DECISION_ASSISTANT_AUDIT_DRAFT",
      assistantName: ASSISTANT_NAME,
      appVersion: READ_ONLY_QUOTE_DECISION_ASSISTANT_VERSION,
      status: model.status,
      recommendationType: model.recommendationType,
      recommendedRank: model.recommendedCandidate ? model.recommendedCandidate.rank : null,
      candidateCount: model.comparison.candidateCount,
      canClaimLowestAcrossWeb: false,
      canClaimFinalBookablePrice: false,
      rawResponseStored: false,
      secretStored: false,
      handoffChecklistSummary: model.handoffChecklistSummary || null,
      handoffReceiptSummary: model.handoffReceiptSummary || null,
      manualPlatformCheckSummary: model.manualPlatformCheckSummary || null,
      platformCheckDeltaSummary: model.platformCheckDeltaSummary || null,
      reconciliationSummary: model.reconciliationSummary || null,
      confidenceLabelSummary: model.confidenceLabelSummary || null,
      safeNextStepSummary: model.safeNextStepSummary || null,
      platformCheckOutcomeSummary: model.platformCheckOutcomeSummary || null,
      platformCheckWarnings: model.platformCheckWarnings || [],
      workflowStateSummary: model.workflowStateSummary || null,
      clarificationSummary: model.clarificationSummary || null,
      continuitySummary: model.continuitySummary || null,
      confirmationStateSummary: model.confirmationStateSummary || null,
      recoverySummary: model.recoverySummary || null,
      resumeCoachSummary: model.resumeCoachSummary || null,
      actionQueueSummary: model.actionQueueSummary || null,
      progressTimelineSummary: model.progressTimelineSummary || null,
      safeResumeCenterSummary: model.safeResumeCenterSummary || null,
      blockedActions: model.blockedActions || [],
      nextSafeAction: model.nextSafeAction || model.nextSafeActionLabel || "",
      currentStage: model.currentStage || "",
      workflowStageLabel: model.workflowStageLabel || "",
      nextStepLabel: model.nextStepLabel || "",
      canResumeWorkflow: model.canResumeWorkflow === true,
      resumeActions: model.resumeActions || [],
      workflowStepList: model.workflowStepList || null,
      missingFields: model.missingFields || [],
      clarificationQuestions: model.clarificationQuestions || [],
      workflowUserMessage: model.workflowUserMessage || "",
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    });
  }

  window.WeishanReadOnlyQuoteDecisionAssistant = {
    READ_ONLY_QUOTE_DECISION_ASSISTANT_VERSION,
    ASSISTANT_NAME,
    buildReadOnlyQuoteDecisionAssistant,
    evaluateReadOnlyQuoteCandidateDecision,
    buildReadOnlyQuoteRecommendationExplanation,
    buildReadOnlyQuoteDecisionAssistantAuditDraft,
    sanitizeReadOnlyQuoteDecisionAssistantOutput
  };
})();
