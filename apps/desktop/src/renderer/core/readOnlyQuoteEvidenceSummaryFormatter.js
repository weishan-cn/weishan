;(function () {
  "use strict";

  const READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION = "2.2.0";
  const FORMATTER_NAME = "read_only_quote_evidence_summary_formatter_v1";
  const FORBIDDEN_NAME_RE = /(rawProviderResponse|rawResponse|rawPayload|token|key|secret|password|auth|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|identity|passport|bank|card)/i;
  const FORBIDDEN_TEXT_RE = /全网最低|最低价保证|已锁价|可以出票|可直接出票|真实最终价|立即购买|付款|下单/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }

  function stripUnsafe(value) {
    if (Array.isArray(value)) return value.map(stripUnsafe).filter(function (item) { return item !== undefined; });
    if (!value || typeof value !== "object") return value;
    const result = {};
    Object.keys(value).forEach(function (name) {
      if (FORBIDDEN_NAME_RE.test(name)) return;
      const next = stripUnsafe(value[name]);
      if (next !== undefined) result[name] = next;
    });
    return result;
  }

  function safeLine(value) {
    return text(value).replace(FORBIDDEN_TEXT_RE, "保守候选证据");
  }

  function priceLine(candidate) {
    const amount = number(candidate && candidate.totalPrice);
    const currency = text(candidate && candidate.currency || "CNY");
    return amount == null ? "价格未单独提供" : (currency === "CNY" ? "¥" + amount : currency + " " + amount);
  }

  function formatTopCandidateSummary(candidates, options) {
    const safeOptions = options && typeof options === "object" ? options : {};
    const list = Array.isArray(candidates) ? candidates.slice(0, 3).map(stripUnsafe) : [];
    const lines = list.map(function (candidate, index) {
      const provider = text(candidate.providerName || "只读沙盒");
      const source = text(candidate.responseShape || candidate.fareSource || "导入样本");
      return "#" + String(candidate.rank || index + 1) + " " + priceLine(candidate) + " · " + provider + " · " + source + " · 平台最终为准 · 未锁价 · 不代表可出票";
    });
    return clone({
      formatterName: FORMATTER_NAME,
      appVersion: READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION,
      title: "Top 3 候选报价",
      scope: safeLine(safeOptions.scope || "当前导入样本 / 沙盒运行中的候选价格"),
      lines: lines,
      empty: lines.length === 0,
      canClaimLowestAcrossWeb: false,
      canClaimFinalBookablePrice: false,
      canReplaceMainResultCard: false,
      redacted: true
    });
  }

  function formatSelectedCandidateSummary(candidate, options) {
    const safe = stripUnsafe(candidate && typeof candidate === "object" ? candidate : {}) || {};
    const safeOptions = options && typeof options === "object" ? options : {};
    const provider = text(safe.providerName || safe.selectedProviderName || "未选择");
    const quoteId = text(safe.quoteId || safe.selectedQuoteId || "");
    const line = provider === "未选择"
      ? "尚未选择候选报价。平台最终为准，未锁价，不代表可出票。"
      : "已选择候选：" + provider + (quoteId ? " / " + quoteId : "") + " · " + priceLine(safe) + " · 平台最终为准 · 未锁价 · 不代表可出票";
    return clone({
      formatterName: FORMATTER_NAME,
      appVersion: READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION,
      title: safeOptions.title || "已选择候选摘要",
      selected: provider !== "未选择",
      line: safeLine(line),
      providerName: provider,
      quoteId: quoteId,
      requiresUserConfirm: true,
      autoOpen: false,
      redacted: true
    });
  }

  function formatDeltaSummary(delta, options) {
    const safe = stripUnsafe(delta && typeof delta === "object" ? delta : {}) || {};
    const status = text(safe.status || safe.compareStatus || "not_enough_history");
    return clone({
      formatterName: FORMATTER_NAME,
      appVersion: READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION,
      title: options && options.title || "本地只读运行对比",
      status: status,
      line: safeLine("本地只读运行对比：" + (text(safe.summary) || (status === "compared" ? "已比较本地脱敏历史" : "历史不足")) + "。平台最终为准，未锁价，不代表可出票。"),
      redacted: true
    });
  }

  function formatReplaySummary(replay, options) {
    const safe = stripUnsafe(replay && typeof replay === "object" ? replay : {}) || {};
    const status = text(safe.status || "unavailable");
    return clone({
      formatterName: FORMATTER_NAME,
      appVersion: READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION,
      title: options && options.title || "Replay Guard",
      status: status,
      line: safeLine("Replay 只恢复本地脱敏候选证据，不重新请求 provider。平台最终为准，未锁价，不代表可出票。"),
      networkAllowed: false,
      autoOpen: false,
      redacted: true
    });
  }

  function formatReadOnlyQuoteEvidenceWarnings(input) {
    const safe = input && typeof input === "object" ? input : {};
    return clone({
      formatterName: FORMATTER_NAME,
      appVersion: READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION,
      warnings: [
        "平台最终为准",
        "未锁价",
        "不代表可出票",
        "当前导入样本 / 沙盒运行中的候选价格"
      ].concat(Array.isArray(safe.extraWarnings) ? safe.extraWarnings.map(safeLine).filter(Boolean) : []).slice(0, 8),
      canClaimLowestAcrossWeb: false,
      canClaimFinalBookablePrice: false,
      canPayHere: false,
      canOrderHere: false,
      redacted: true
    });
  }

  function formatDecisionReasoning(decision) {
    const safe = stripUnsafe(decision && typeof decision === "object" ? decision : {}) || {};
    const reasoning = safe.reasoning && typeof safe.reasoning === "object" ? safe.reasoning : safe;
    const primaryReason = safeLine(reasoning.primaryReason || "该候选在本次只读候选样本中合计金额较低。");
    const supportingReasons = Array.isArray(reasoning.supportingReasons) ? reasoning.supportingReasons.map(safeLine).filter(Boolean) : [
      "价格拆分完整。",
      "平台最终为准。",
      "未锁价，不代表可出票。"
    ];
    const riskWarnings = Array.isArray(reasoning.riskWarnings) ? reasoning.riskWarnings.map(safeLine).filter(Boolean) : [
      "价格、库存、税费和规则以平台页面为准。",
      "本推荐仅基于本地只读候选证据，不代表真实最终价。",
      "未锁价，不代表可出票。"
    ];
    return clone({
      formatterName: FORMATTER_NAME,
      appVersion: READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION,
      title: "推荐理由",
      primaryReason: primaryReason,
      supportingReasons: supportingReasons,
      riskWarnings: riskWarnings,
      line: safeLine(primaryReason + " 平台最终为准，未锁价，不代表可出票。"),
      canClaimLowestAcrossWeb: false,
      canClaimFinalBookablePrice: false,
      redacted: true
    });
  }

  function formatCandidateComparisonSummary(comparison) {
    const safe = stripUnsafe(comparison && typeof comparison === "object" ? comparison : {}) || {};
    const table = Array.isArray(safe.table) ? safe.table.slice(0, 3) : [];
    const summary = safe.summary && typeof safe.summary === "object" ? safe.summary : {};
    return clone({
      formatterName: FORMATTER_NAME,
      appVersion: READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION,
      title: "候选对比",
      candidateCount: table.length,
      lines: table.map(function (candidate) {
        return "#" + String(candidate.rank || "") + " " + (candidate.providerName || "只读候选") + " · " + priceLine(candidate) + " · " + (candidate.handoffStatus === "ready" ? "仍需前往平台确认" : "平台确认链接不可用") + " · 平台最终为准 · 未锁价 · 不代表可出票";
      }),
      lowestInLocalSampleRank: summary.lowestInLocalSampleRank || null,
      caveat: safeLine(summary.caveat || "仅比较本地只读候选样本，平台最终为准。"),
      forbiddenClaims: { lowestAcrossWeb:false, finalBookablePrice:false, priceLocked:false, ticketAvailable:false },
      redacted: true
    });
  }

  function formatProviderConfirmationWarning(candidate) {
    const safe = stripUnsafe(candidate && typeof candidate === "object" ? candidate : {}) || {};
    const ready = safe.safeProviderHandoffReady === true || safe.handoffStatus === "ready";
    return clone({
      formatterName: FORMATTER_NAME,
      appVersion: READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION,
      title: "仍需前往平台确认",
      ready: ready,
      warning: ready ? "仍需前往平台确认，平台最终为准，未锁价，不代表可出票。" : "当前推荐候选的平台确认链接不可用。平台最终为准，未锁价，不代表可出票。",
      providerConfirmationRequiresUserConfirm: true,
      autoOpen: false,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      redacted: true
    });
  }

  function formatFlightWorkflowSummary(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    const questions = Array.isArray(safe.clarificationQuestions) ? safe.clarificationQuestions.map(safeLine).filter(Boolean) : [];
    return clone({
      formatterName: FORMATTER_NAME,
      appVersion: READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION,
      title: "机票请求工作流",
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
      nextSafeAction: safeLine(safe.nextSafeActionLabel || safe.nextSafeAction || ""),
      actionQueue: stripUnsafe(safe.actionQueueSummary || safe.actionQueue || null),
      progressTimeline: stripUnsafe(safe.progressTimelineSummary || safe.progressTimeline || null),
      safeResumeCenter: stripUnsafe(safe.safeResumeCenterSummary || safe.safeResumeCenter || null),
      currentStage: safeLine(safe.currentStage || ""),
      workflowStageLabel: safeLine(safe.workflowStageLabel || safe.continuitySummary && safe.continuitySummary.stageLabel || ""),
      nextStepLabel: safeLine(safe.nextStepLabel || ""),
      canResumeWorkflow: safe.canResumeWorkflow === true,
      resumeActions: stripUnsafe(Array.isArray(safe.resumeActions) ? safe.resumeActions : (safe.resumeCoachSummary && safe.resumeCoachSummary.allowedActions || [])),
      workflowStepList: stripUnsafe(safe.workflowStepList || []),
      scenarioSimulationSummary: stripUnsafe(safe.scenarioSimulationSummary || null),
      safetyTestMatrixSummary: stripUnsafe(safe.safetyTestMatrixSummary || null),
      betaExpansionGateSummary: stripUnsafe(safe.betaExpansionGateSummary || null),
      publicPilotChecklistSummary: stripUnsafe(safe.publicPilotChecklistSummary || null),
      pilotReadinessSummary: stripUnsafe(safe.pilotReadinessSummary || null),
      safeForSmallPublicPilot: safe.safeForSmallPublicPilot === true,
      pilotNextStep: safeLine(safe.pilotNextStep || ""),
      pilotReadinessSnapshotSummary: stripUnsafe(safe.pilotReadinessSnapshotSummary || safe.publicPilotReadinessSnapshotSummary || safe.snapshotSummary || null),
      pilotInvitationGateSummary: stripUnsafe(safe.pilotInvitationGateSummary || safe.readOnlyPilotInvitationGateSummary || null),
      testerCohortEnrollmentConsoleSummary: stripUnsafe(safe.testerCohortEnrollmentConsoleSummary || null),
      pilotInvitationViewModelSummary: stripUnsafe(safe.pilotInvitationViewModelSummary || null),
      supportPlaybookSummary: stripUnsafe(safe.supportPlaybookSummary || safe.supportPlaybookConsoleSummary || null),
      pilotOpsSummary: stripUnsafe(safe.pilotOpsSummary || safe.readOnlyPilotOpsSummary || null),
      nextCohortDecisionSummary: stripUnsafe(safe.nextCohortDecisionSummary || safe.nextCohortDecisionBoard || null),
      freezeGateSummary: stripUnsafe(safe.freezeGateSummary || null),
      evidenceFreezePackSummary: stripUnsafe(safe.evidenceFreezePackSummary || null),
      rcRegressionAuditSummary: stripUnsafe(safe.rcRegressionAuditSummary || null),
      releaseRiskLedgerSummary: stripUnsafe(safe.releaseRiskLedgerSummary || null),
      rcRegressionViewModelSummary: stripUnsafe(safe.rcRegressionViewModelSummary || null),
      rcCopyFinalizationSummary: stripUnsafe(safe.rcCopyFinalizationSummary || null),
      safetyDisclosureReviewSummary: stripUnsafe(safe.safetyDisclosureReviewSummary || null),
      rcCopyReviewViewModelSummary: stripUnsafe(safe.rcCopyReviewViewModelSummary || null),
      globalShoppingProductGoalSummary: stripUnsafe(safe.globalShoppingProductGoalSummary || null),
      jumpToPlatformBoundarySummary: stripUnsafe(safe.jumpToPlatformBoundarySummary || null),
      globalShoppingProductGoalViewModelSummary: stripUnsafe(safe.globalShoppingProductGoalViewModelSummary || null),
      readOnlyProviderSandboxConnectorSummary: stripUnsafe(safe.readOnlyProviderSandboxConnectorSummary || null),
      fixtureReplayConsoleSummary: stripUnsafe(safe.fixtureReplayConsoleSummary || null),
      normalizedPriceCandidateBoardSummary: stripUnsafe(safe.normalizedPriceCandidateBoardSummary || null),
      realProviderSandboxGateSummary: stripUnsafe(safe.realProviderSandboxGateSummary || null),
      providerRequestEnvelopeSummary: stripUnsafe(safe.providerRequestEnvelopeSummary || null),
      providerCallAuditLedgerSummary: stripUnsafe(safe.providerCallAuditLedgerSummary || null),
      providerSandboxReadinessViewModelSummary: stripUnsafe(safe.providerSandboxReadinessViewModelSummary || null),
      providerSandboxDryRunHarnessSummary: stripUnsafe(safe.providerSandboxDryRunHarnessSummary || null),
      firstReadOnlyProviderAdapterShellSummary: stripUnsafe(safe.firstReadOnlyProviderAdapterShellSummary || null),
      providerSandboxSafetyKillSwitchSummary: stripUnsafe(safe.providerSandboxSafetyKillSwitchSummary || null),
      providerSandboxDryRunViewModelSummary: stripUnsafe(safe.providerSandboxDryRunViewModelSummary || null),
      providerAdapterRegistrySummary: stripUnsafe(safe.providerAdapterRegistrySummary || null),
      dryRunProviderResponseNormalizerSummary: stripUnsafe(safe.dryRunProviderResponseNormalizerSummary || null),
      sandboxProviderRunbookSummary: stripUnsafe(safe.sandboxProviderRunbookSummary || null),
      providerAdapterRegistryViewModelSummary: stripUnsafe(safe.providerAdapterRegistryViewModelSummary || null),
      legalProviderFixtureSummary: stripUnsafe(safe.legalProviderFixtureSummary || null),
      providerCredentialSafetySummary: stripUnsafe(safe.providerCredentialSafetySummary || null),
      sandboxPriceFeedSummary: stripUnsafe(safe.sandboxPriceFeedSummary || null),
      providerFixtureViewModelSummary: stripUnsafe(safe.providerFixtureViewModelSummary || null),
      sandboxDeepLinkCandidateSummary: stripUnsafe(safe.sandboxDeepLinkCandidateSummary || null),
      platformAvailabilitySummary: stripUnsafe(safe.platformAvailabilitySummary || null),
      partnerLinkPolicySummary: stripUnsafe(safe.partnerLinkPolicySummary || null),
      sandboxHandoffViewModelSummary: stripUnsafe(safe.sandboxHandoffViewModelSummary || null),
      rcRegressionStatus: safeLine(safe.rcRegressionStatus || ""),
      releaseRiskStatus: safeLine(safe.releaseRiskStatus || ""),
      safeToContinueReleaseCandidate: safe.safeToContinueReleaseCandidate === true,
      rcCopyReviewStatus: safeLine(safe.rcCopyReviewStatus || ""),
      safetyDisclosureStatus: safeLine(safe.safetyDisclosureStatus || ""),
      safeToFinalizeUserFacingCopy: safe.safeToFinalizeUserFacingCopy === true,
      globalShoppingGoalStatus: safeLine(safe.globalShoppingGoalStatus || ""),
      jumpBoundaryStatus: safeLine(safe.jumpBoundaryStatus || ""),
      readOnlyProviderSandboxConnectorStatus: safeLine(safe.readOnlyProviderSandboxConnectorStatus || ""),
      fixtureReplayStatus: safeLine(safe.fixtureReplayStatus || ""),
      normalizedPriceCandidateBoardStatus: safeLine(safe.normalizedPriceCandidateBoardStatus || ""),
      realProviderSandboxGateStatus: safeLine(safe.realProviderSandboxGateStatus || ""),
      providerRequestEnvelopeStatus: safeLine(safe.providerRequestEnvelopeStatus || ""),
      providerCallAuditLedgerStatus: safeLine(safe.providerCallAuditLedgerStatus || ""),
      providerSandboxReadinessStatus: safeLine(safe.providerSandboxReadinessStatus || ""),
      legalProviderFixtureStatus: safeLine(safe.legalProviderFixtureStatus || ""),
      providerCredentialSafetyStatus: safeLine(safe.providerCredentialSafetyStatus || ""),
      sandboxPriceFeedStatus: safeLine(safe.sandboxPriceFeedStatus || ""),
      providerAdapterRegistryStatus: safeLine(safe.providerAdapterRegistryStatus || ""),
      dryRunResponseNormalizerStatus: safeLine(safe.dryRunResponseNormalizerStatus || ""),
      sandboxProviderRunbookStatus: safeLine(safe.sandboxProviderRunbookStatus || ""),
      providerAdapterRegistryViewModelStatus: safeLine(safe.providerAdapterRegistryViewModelStatus || ""),
      safeToProceedWithReadOnlyPriceProviderSandbox: safe.safeToProceedWithReadOnlyPriceProviderSandbox === true,
      safeToProceedWithFirstSandboxProviderConnectorImplementation: safe.safeToProceedWithFirstSandboxProviderConnectorImplementation === true,
      safeToProceedWithJumpToPlatformMvp: safe.safeToProceedWithJumpToPlatformMvp === true,
      sandboxDeepLinkStatus: safeLine(safe.sandboxDeepLinkStatus || ""),
      platformAvailabilityStatus: safeLine(safe.platformAvailabilityStatus || ""),
      partnerLinkPolicyStatus: safeLine(safe.partnerLinkPolicyStatus || ""),
      sandboxHandoffStatus: safeLine(safe.sandboxHandoffStatus || ""),
      safeToProceedWithPartnerFixtureAdapter: safe.safeToProceedWithPartnerFixtureAdapter === true,
      safeToProceedWithFirstRealReadOnlyProviderSandbox: safe.safeToProceedWithFirstRealReadOnlyProviderSandbox === true,
      safeToProceedWithFirstReadOnlySandboxDryRun: safe.safeToProceedWithFirstReadOnlySandboxDryRun === true,
      pilotOpsStatus: safeLine(safe.pilotOpsStatus || ""),
      nextCohortDecisionStatus: safeLine(safe.nextCohortDecisionStatus || ""),
      pilotOpsPrimaryRisk: stripUnsafe(safe.pilotOpsPrimaryRisk || null),
      pilotSnapshotStatus: safeLine(safe.pilotSnapshotStatus || ""),
      pilotInvitationStatus: safeLine(safe.pilotInvitationStatus || ""),
      testerCohortStatus: safeLine(safe.testerCohortStatus || ""),
      pilotSnapshotNextStep: safeLine(safe.pilotSnapshotNextStep || ""),
      pilotInvitationNextStep: safeLine(safe.pilotInvitationNextStep || ""),
      supportPlaybookStatus: safeLine(safe.supportPlaybookStatus || ""),
      pilotOpsStatus: safeLine(safe.pilotOpsStatus || ""),
      nextCohortDecisionStatus: safeLine(safe.nextCohortDecisionStatus || ""),
      pilotOpsPrimaryRisk: stripUnsafe(safe.pilotOpsPrimaryRisk || null),
      pilotOnboardingSummary: stripUnsafe(safe.pilotOnboardingSummary || null),
      readOnlyConsentSummary: stripUnsafe(safe.readOnlyConsentSummary || null),
      pilotOnboardingViewModel: stripUnsafe(safe.pilotOnboardingViewModel || null),
      pilotEntryStatus: safeLine(safe.pilotEntryStatus || ""),
      canEnterReadOnlyPilot: safe.canEnterReadOnlyPilot === true,
      pilotConsentRequired: safe.pilotConsentRequired === true,
      releaseReadinessSummary: stripUnsafe(safe.releaseReadinessSummary || null),
      userSafetyCopySummary: stripUnsafe(safe.userSafetyCopySummary || null),
      forbiddenCapabilitySummary: stripUnsafe(safe.forbiddenCapabilitySummary || null),
      userFacingBetaReadiness: stripUnsafe(safe.userFacingBetaReadiness || null),
      copyValidationStatus: safeLine(safe.copyValidationStatus || ""),
      missingFields: Array.isArray(safe.missingFields) ? safe.missingFields.map(safeLine) : [],
      clarificationQuestions: questions,
      workflowUserMessage: safeLine(safe.workflowUserMessage || (questions.length ? "需要补充信息。信息完整后再生成候选证据。" : "候选证据已生成，平台最终为准。")),
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      redacted:true
    });
  }

  function formatFlightWorkflowAuditReviewSummary(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    return clone({ title:"本次机票工作流审计", line:safeLine(safe.statusLabel || safe.healthLabel || "安全检查通过"), findings:Array.isArray(safe.findings) ? safe.findings.map(function(item){ return safeLine(item.label || item.message || item.findingId || ""); }).filter(Boolean).slice(0, 6) : [], bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatSafeSessionExportPreviewSummary(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    return clone({ title:"脱敏会话摘要预览", line:safeLine(safe.readinessLabel || "仅预览，不写入文件"), sectionLabels:["工作流摘要", "候选证据摘要", "安全审计摘要"], canWriteFile:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatFlightWorkflowHumanReviewChecklistSummary(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    return clone({ title:"前往平台前请人工复核", line:safeLine(safe.userFacingSummary && safe.userFacingSummary.line || safe.line || "仍需补充复核"), sectionLabels:["人工复核清单", "已确认项", "未完成项"], bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatFlightWorkflowFinalSafeHandoffPacketSummary(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    return clone({ title:"最终安全交接包", line:safeLine(safe.userFacingSummary && safe.userFacingSummary.line || safe.line || "仍需补充复核"), sectionLabels:["行程摘要", "候选证据摘要", "平台核对摘要", "安全限制摘要"], canOpenExternalPlatform:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatFlightWorkflowOperatorConsoleSummary(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    return clone({ title:"机票工作流运营控制台", line:safeLine(safe.userFacingSummary && safe.userFacingSummary.resultLabel || safe.line || "存在需要注意的项目"), sectionLabels:["工作流状态", "安全状态", "最近事件", "已阻断动作", "平台确认准备状态"], bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatFlightWorkflowSafetyRegressionSummary(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    return clone({ title:"安全回归", line:safeLine(safe.status === "pass" ? "安全回归通过" : "安全回归失败"), sectionLabels:["无交易链接", "无付款/下单/出票", "无证件/银行卡/登录凭据", "无密钥或原始响应", "无自动打开或自动刷新"], bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatFlightWorkflowScenarioSimulationSummary(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    return clone({ title:"机票工作流场景模拟", line:safeLine(safe.userFacingSummary && safe.userFacingSummary.resultLabel || (safe.status === "pass" ? "场景模拟通过" : (safe.status === "warning" ? "场景模拟存在警告" : (safe.status === "fail" ? "场景模拟存在失败项" : "场景模拟已记录")))), scenarioCount:Number(safe.scenarioCount || 0), passedCount:Number(safe.passedCount || 0), warningCount:Number(safe.warningCount || 0), failedCount:Number(safe.failedCount || 0), blockedCount:Number(safe.blockedCount || 0), sectionLabels:["完整机票请求", "缺少出发地", "缺少目的地", "缺少日期", "平台价格变化", "平台库存变化", "敏感输入阻断", "受限品类阻断"], caveat:"场景模拟仅用于安全回归，不代表真实票价、库存或可出票。", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatFlightWorkflowSafetyTestMatrixSummary(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    return clone({ title:"安全测试矩阵", line:safeLine(safe.userFacingSummary && safe.userFacingSummary.resultLabel || (safe.status === "pass" ? "全部通过" : (safe.status === "warning" ? "存在警告" : (safe.status === "fail" ? "存在失败项" : "未知")))), scenarioCount:Number(safe.scenarioCount || 0), passedCount:Number(safe.passedCount || 0), warningCount:Number(safe.warningCount || 0), failedCount:Number(safe.failedCount || 0), blockedCount:Number(safe.blockedCount || 0), sectionLabels:["完整机票请求", "缺少出发地", "缺少目的地", "缺少日期", "非法交易链接阻断", "非法密钥阻断", "非法付款动作", "平台确认需要确认"], caveat:"该矩阵仅为本地安全回归检查，不代表真实票价或可出票。", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatIssuePatternSupportSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const pattern = safe.issuePatternSummary || {};
    const readiness = safe.supportReadinessSummary || {};
    return clone({ title:"试点问题趋势雷达", line:safeLine(pattern.userFacingSummary && pattern.userFacingSummary.resultLabel || readiness.userFacingSummary && readiness.userFacingSummary.resultLabel || "暂无明显共性问题"), sectionLabels:["问题数量", "主要问题趋势", "支持准备", "试点支持准备闸门"], caveat:"问题趋势仅用于改进只读候选证据流程，不代表客服工单、交易请求或出票请求。", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false, secretStored:false, redacted:true });
  }

  function formatPublicPilotReadinessSnapshotSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const snapshot = safe.pilotReadinessSnapshotSummary || safe.publicPilotReadinessSnapshotSummary || safe.snapshotSummary || {};
    const playbook = safe.supportPlaybookSummary || safe.supportPlaybookConsoleSummary || {};
    return clone({ title:"只读试点状态快照", line:safeLine(obj(snapshot.userFacingSummary).resultLabel || snapshot.status || "需要复核"), sectionLabels:["试点状态", "支持准备", "问题趋势", "下一步", "试点邀请闸门", "测试用户批次", "只读邀请视图模型", "只读试点进度追踪", "只读试点里程碑", "beta expansion gate", "public pilot checklist", "pilot onboarding guard", "issue pattern radar", "support readiness gate", "issue review board", "support triage dashboard", "operator console", "safety regression sentinel"], caveat:"该快照只适用于只读候选证据流程，不代表真实票价、库存或可出票。", supportPlaybookStatus:text(playbook.status || "ready"), pilotSnapshotStatus:text(snapshot.status || ""), pilotSnapshotNextStep:safeLine(obj(snapshot.userFacingSummary).resultLabel || snapshot.status || "需要复核"), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false, secretStored:false, redacted:true });
  }

  function formatSupportPlaybookConsoleSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const playbook = safe.supportPlaybookSummary || safe.supportPlaybookConsoleSummary || {};
    return clone({ title:"只读试点支持处理手册", line:safeLine(obj(playbook.userFacingSummary).resultLabel || playbook.status || "支持处理路径已准备"), sectionLabels:["看不懂候选证据", "平台页面与候选证据不一致", "安全说明不清楚", "只读范围确认无法完成", "反馈填写异常", "禁止动作", "试点邀请闸门", "测试用户批次", "只读邀请视图模型", "只读试点进度追踪", "只读试点里程碑"], forbiddenSupportActions:Array.isArray(playbook.forbiddenSupportActions) ? playbook.forbiddenSupportActions.slice() : ["代用户付款", "代用户下单", "承诺出票", "索要证件或银行卡", "索要登录凭据", "提供真实客服工单编号"], caveat:"该手册只用于只读试点问题处理，不代表客服工单、交易请求或出票请求。", supportPlaybookStatus:text(playbook.status || ""), supportPlaybookNextStep:safeLine(obj(playbook.userFacingSummary).resultLabel || playbook.status || "支持处理路径已准备"), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false, secretStored:false, redacted:true });
  }

  function formatReadOnlyPilotInvitationGateSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const gate = safe.pilotInvitationGateSummary || safe.readOnlyPilotInvitationGateSummary || safe.invitationGateSummary || {};
    return clone({ title:"只读试点邀请闸门", line:safeLine(obj(gate.userFacingSummary).resultLabel || obj(gate.decision).label || gate.status || "待邀请"), sectionLabels:["试点邀请", "测试用户批次", "只读范围确认", "支持复核", "安全限制"], testerSlotId:text(obj(gate.testerSlot).slotId || "tester-slot-001"), invitationStatus:text(gate.status || "waitlist"), invitationDecision:text(obj(gate.decision).message || obj(gate.decision).label || "当前只读试点邀请条件仍需复核。"), caveat:safeLine(obj(gate.userFacingSummary).caveat || "该判断只用于只读试点邀请与测试批次登记，不代表真实身份、联系方式、证件、支付或外部平台链接。"), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, invitationUrl:null, redacted:true });
  }

  function formatTesterCohortEnrollmentConsoleSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const consoleModel = safe.testerCohortEnrollmentConsoleSummary || safe.testerCohortSummary || safe.cohortSummary || {};
    const cohort = obj(consoleModel.cohort);
    return clone({ title:"测试用户批次登记控制台", line:safeLine(obj(consoleModel.userFacingSummary).resultLabel || consoleModel.status || "仍需更多测试用户"), sectionLabels:["测试批次", "邀请状态", "只读确认", "反馈状态"], cohortId:text(cohort.cohortId || "tester-cohort-001"), totalCount:Number(cohort.totalCount || 0), invitedCount:Number(cohort.invitedCount || 0), consentedCount:Number(cohort.consentedCount || 0), feedbackReadyCount:Number(cohort.feedbackReadyCount || 0), blockedCount:Number(cohort.blockedCount || 0), caveat:safeLine(obj(consoleModel.userFacingSummary).caveat || "该控制台只用于只读试点测试用户批次登记，不保存真实身份、联系方式、证件、支付或外部平台链接。"), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, invitationUrl:null, redacted:true });
  }

  function formatPilotInvitationViewModelSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const vm = safe.pilotInvitationViewModelSummary || safe.pilotInvitationSummary || {};
    return clone({ title:"只读试点邀请与测试批次", line:safeLine(obj(vm).title || obj(vm.userFacingSummary).resultLabel || vm.status || "需要复核"), sectionLabels:["试点邀请", "测试用户批次", "只读确认", "问题与支持", "只读试点进度追踪", "只读试点里程碑"], invitationGateName:text(vm.invitationGateName || "flight_workflow_read_only_pilot_invitation_gate_v1"), cohortConsoleName:text(vm.cohortConsoleName || "flight_workflow_tester_cohort_enrollment_console_v1"), cardCount:Array.isArray(vm.cards) ? vm.cards.length : Number(vm.cardCount || 0), cohortRowCount:Array.isArray(vm.cohortRows) ? vm.cohortRows.length : Number(vm.cohortRowCount || 0), riskRowCount:Array.isArray(vm.riskRows) ? vm.riskRows.length : Number(vm.riskRowCount || 0), caveat:safeLine(obj(vm).caveat || "该视图模型只用于只读试点邀请与测试批次登记，不代表真实身份、联系方式、证件、支付或外部平台链接。"), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, invitationUrl:null, redacted:true });
  }

  function formatPublicPilotCohortProgressTrackerSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const tracker = safe.cohortProgressSummary || safe.cohortProgressTrackerSummary || {};
    return clone({ title:"只读试点进度追踪", line:safeLine(obj(tracker).progressLabel || obj(tracker.userFacingSummary).resultLabel || "仍需更多测试者"), sectionLabels:["完成进度", "问题状态", "下一批测试", "只读试点里程碑"], cohortId:text(tracker.cohortId || "tester-cohort-001"), totalCount:Number(tracker.totalCount || 0), invitedCount:Number(tracker.invitedCount || 0), consentedCount:Number(tracker.consentedCount || 0), feedbackReadyCount:Number(tracker.feedbackReadyCount || 0), blockedCount:Number(tracker.blockedCount || 0), progressPercent:Number(tracker.progressPercent || 0), safeToAdvanceNextCohort:tracker.safeToAdvanceNextCohort === true, caveat:"该追踪器只用于只读试点批次进度追踪，不保存真实身份、联系方式、证件、支付或外部平台链接。", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, invitationUrl:null, redacted:true });
  }

  function formatReadOnlyTrialMilestoneBoardSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const board = safe.trialMilestoneSummary || safe.trialMilestoneBoardSummary || {};
    return clone({ title:"只读试点里程碑", line:safeLine(obj(board).nextBatchLabel || obj(board.userFacingSummary).resultLabel || "仍需更多测试者"), sectionLabels:["发布就绪确认", "试点进入确认", "测试批次启动", "反馈收集完成", "问题复核完成", "下一批测试准备"], milestoneCount:Number(board.milestoneCount || 0), completedCount:Number(board.completedCount || 0), pendingCount:Number(board.pendingCount || 0), blockedCount:Number(board.blockedCount || 0), safeToAdvanceNextCohort:board.safeToAdvanceNextCohort === true, caveat:"该里程碑板只追踪脱敏测试槽位，不保存真实身份、不发送真实邀请。", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, invitationUrl:null, redacted:true });
  }

  function formatCohortProgressViewModelSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const vm = safe.cohortProgressViewModelSummary || safe.cohortProgressSummary || {};
    return clone({ title:"只读试点进度追踪", line:safeLine(obj(vm).title || obj(vm.userFacingSummary).resultLabel || "仍需更多测试者"), sectionLabels:["只读试点进度追踪", "测试批次进度", "只读试点里程碑", "下一批测试"], trackerName:text(vm.trackerName || "flight_workflow_public_pilot_cohort_progress_tracker_v1"), boardName:text(vm.boardName || "flight_workflow_read_only_trial_milestone_board_v1"), caveat:safeLine(obj(vm).caveat || "该视图模型只用于只读试点进度追踪，不保存真实身份、不发送真实邀请。"), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, invitationUrl:null, redacted:true });
  }

  function formatReadOnlyPilotRolloutControlCenterSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const center = safe.rolloutControlSummary || safe.readOnlyPilotRolloutControlCenter || {};
    return clone({ title:"只读试点发布控制中心", line:safeLine(obj(center.userFacingSummary).resultLabel || obj(center.decision).label || "继续当前小范围试点"), sectionLabels:["发布控制", "批次健康", "问题风险", "下一步"], decisionId:text(obj(center.decision).decisionId || "continue_current_batch"), safeToAdvanceNextCohort:obj(center.decision).safeToAdvanceNextCohort === true, status:text(center.status || "continue_current_batch"), caveat:safeLine(obj(center.userFacingSummary).caveat || "该控制中心只管理只读试点流程，不代表真实账号、客服工单、交易请求或出票能力。"), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatCohortHealthDashboardSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const dashboard = safe.cohortHealthSummary || safe.cohortHealthDashboard || {};
    const health = obj(dashboard.cohortHealth);
    return clone({ title:"测试批次健康看板", line:safeLine(obj(dashboard.userFacingSummary).resultLabel || "批次进行中"), sectionLabels:["测试者数量", "只读确认", "反馈完成", "问题处理", "敏感数据风险", "真实身份风险"], testerSlotCount:Number(health.testerSlotCount || 0), healthyEnoughForNextCohort:health.healthyEnoughForNextCohort === true, status:text(dashboard.status || "in_progress"), caveat:safeLine(obj(dashboard.userFacingSummary).caveat || "该看板只统计脱敏测试槽位，不保存真实身份或联系方式。"), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatReadOnlyPilotExitCriteriaSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const criteria = safe.pilotExitCriteriaSummary || safe.exitCriteriaSummary || {};
    const health = obj(criteria.exitHealth);
    return clone({ title:"只读试点退出条件", line:safeLine(obj(criteria.userFacingSummary).resultLabel || "继续试点观察"), sectionLabels:["试点运营", "下一批决策", "批次健康", "支持准备", "问题趋势", "安全回归", "发布就绪", "发布候选"], readyForLaunchCandidate:health.readyForLaunchCandidate === true, status:text(criteria.status || "continue_pilot"), caveat:safeLine(obj(criteria.userFacingSummary).caveat || "该判断只适用于只读候选证据流程，不代表真实账号、客服工单、交易请求或出票能力。"), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatLaunchCandidateReadinessSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const board = safe.launchCandidateReadinessSummary || safe.launchCandidateSummary || {};
    const readiness = obj(board.launchCandidateReadiness);
    return clone({ title:"只读发布候选准备板", line:safeLine(obj(board.userFacingSummary).resultLabel || "继续试点观察"), sectionLabels:["试点退出条件", "发布就绪", "安全矩阵", "支持准备", "发布文案", "安全红线"], safeForReadOnlyLaunchCandidate:readiness.safeForReadOnlyLaunchCandidate === true, status:text(board.status || "continue_pilot"), caveat:safeLine(obj(board.userFacingSummary).caveat || "发布候选仍然只覆盖只读候选证据流程，不提供付款、下单或出票能力。"), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatRcCandidateReviewSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const review = safe.rcCandidateReviewSummary || safe.reviewConsoleSummary || (safe.status || safe.userFacingSummary ? safe : {});
    return clone({ title:"只读 RC 候选复核控制台", line:safeLine(obj(review.userFacingSummary).resultLabel || "证据仍需补充"), sectionLabels:["冻结检查", "证据复核", "候选准备", "试点退出", "发布就绪", "安全红线"], safeToStartRcReview:review.safeToStartRcReview === true, status:text(review.status || "evidence_incomplete"), caveat:safeLine(obj(review.userFacingSummary).caveat || "该控制台只用于只读 RC 候选复核，不代表真实账号、客服工单、交易请求或出票能力。"), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatRcEvidenceReviewChecklistSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const checklist = safe.rcEvidenceReviewSummary || safe.checklistSummary || (safe.status || safe.userFacingSummary ? safe : {});
    return clone({ title:"只读 RC 证据复核清单", line:safeLine(obj(checklist.userFacingSummary).resultLabel || "证据仍需补充"), sectionLabels:["发布就绪证据", "候选复核证据", "安全证据", "试点证据", "冻结决策", "阻断原因复核"], status:text(checklist.status || "incomplete"), caveat:safeLine(obj(checklist.userFacingSummary).caveat || "该清单只复核只读证据，不生成真实导出文件，不代表真实交易或出票能力。"), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatRcReviewViewModelSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const viewModel = safe.rcReviewViewModelSummary || safe.viewModelSummary || (safe.title || safe.status ? safe : {});
    return clone({ title:"只读 RC 候选复核", line:safeLine(viewModel.title || obj(viewModel.userFacingSummary).resultLabel || "只读 RC 候选复核"), sectionLabels:["候选复核", "证据复核", "安全红线", "下一步"], status:text(viewModel.status || "evidence_incomplete"), caveat:safeLine(viewModel.caveat || "该页面只用于只读 RC 候选复核，不保存真实身份、不发送真实邀请、不提供交易能力。"), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatRcRegressionAuditSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const summary = safe.rcRegressionAuditSummary || safe.auditPackSummary || (safe.status || safe.userFacingSummary ? safe : {});
    return clone({ title:"只读 RC 回归审计包", line:safeLine(obj(summary.userFacingSummary).resultLabel || "RC 回归仍需复核"), sectionLabels:["回归审计", "发布风险", "安全红线", "冻结检查"], status:text(summary.status || "needs_review"), caveat:"回归不代表交易能力。", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatReleaseRiskLedgerSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const summary = safe.releaseRiskLedgerSummary || safe.riskLedgerSummary || (safe.status || safe.userFacingSummary ? safe : {});
    return clone({ title:"只读发布风险台账", line:safeLine(obj(summary.userFacingSummary).resultLabel || "发布风险待处理"), sectionLabels:["回归审计", "发布风险", "安全红线", "下一步"], status:text(summary.status || "needs_review"), caveat:"回归不代表交易能力。", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatRcRegressionViewModelSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const viewModel = safe.rcRegressionViewModelSummary || safe.viewModelSummary || (safe.title || safe.status ? safe : {});
    return clone({ title:"只读 RC 回归审计", line:safeLine(viewModel.title || obj(viewModel.userFacingSummary).resultLabel || "只读 RC 回归审计"), sectionLabels:["回归审计", "发布风险", "安全红线", "下一步"], status:text(viewModel.status || "needs_review"), caveat:safeLine(viewModel.caveat || "该页面只用于只读 RC 回归审计，不保存真实身份、不发送真实邀请、不提供交易能力。"), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatRcUserFacingCopyFinalizationSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const summary = safe.rcCopyFinalizationSummary || safe.finalizationSummary || (safe.status || safe.userFacingSummary ? safe : {});
    return clone({ title:"只读 RC 用户可见文案定稿", line:safeLine(obj(summary.userFacingSummary).resultLabel || "RC 文案仍需复核"), sectionLabels:["文案定稿", "安全披露", "禁用措辞", "下一步"], status:text(summary.status || "needs_review"), caveat:"文案不代表交易能力。", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatSafetyDisclosureReviewBoardSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const summary = safe.safetyDisclosureReviewSummary || safe.reviewBoardSummary || (safe.status || safe.userFacingSummary ? safe : {});
    return clone({ title:"安全披露复核板", line:safeLine(obj(summary.userFacingSummary).resultLabel || "安全披露仍需复核"), sectionLabels:["安全披露", "禁用措辞", "敏感信息", "下一步"], status:text(summary.status || "needs_review"), caveat:"文案不代表交易能力。", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatRcCopyReviewViewModelSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const viewModel = safe.rcCopyReviewViewModelSummary || safe.viewModelSummary || (safe.title || safe.status ? safe : {});
    return clone({ title:"只读 RC 文案定稿与安全披露", line:safeLine(viewModel.title || obj(viewModel.userFacingSummary).resultLabel || "只读 RC 文案定稿与安全披露"), sectionLabels:["文案定稿", "安全披露", "禁用措辞", "下一步"], status:text(viewModel.status || "needs_review"), caveat:safeLine(viewModel.caveat || "该页面只用于只读 RC 文案定稿与安全披露复核，不保存真实身份、不发送真实邀请、不提供交易能力。"), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatGlobalShoppingCoverageSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const summary = safe.providerCoverageViewModelSummary || safe.viewModelSummary || (safe.title || safe.status ? safe : {});
    return clone({ title:"Provider 覆盖与来源可信度", line:safeLine(summary.title || obj(summary.userFacingSummary).resultLabel || "Provider 覆盖与来源可信度仍需复核"), sectionLabels:["第一个 Sandbox Provider Connector", "Provider 覆盖看板", "只读来源可信度评分", "只读边界"], status:text(summary.status || "needs_review"), caveat:safeLine(summary.caveat || "当前仅展示 fixture/dry-run/sandbox provider 覆盖和来源可信度，不代表全网覆盖、官方背书、真实价格或下单能力。"), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function buildReadOnlyQuoteEvidenceSummaryFormatterAuditDraft(input) {
    const warnings = formatReadOnlyQuoteEvidenceWarnings(input);
    return clone({
      eventType: "READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_AUDIT_DRAFT",
      formatterName: FORMATTER_NAME,
      appVersion: READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION,
      warningCount: warnings.warnings.length,
      forbiddenClaimCount: 0,
      rawResponseStored: false,
      secretStored: false,
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

  window.WeishanReadOnlyQuoteEvidenceSummaryFormatter = {
    READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION,
    FORMATTER_NAME,
    formatTopCandidateSummary,
    formatSelectedCandidateSummary,
    formatDeltaSummary,
    formatReplaySummary,
    formatReadOnlyQuoteEvidenceWarnings,
    formatDecisionReasoning,
    formatCandidateComparisonSummary,
    formatProviderConfirmationWarning,
    formatFlightWorkflowSummary,
    formatIssuePatternSupportSummary,
    formatReadOnlyPilotInvitationGateSummary,
    formatTesterCohortEnrollmentConsoleSummary,
    formatPilotInvitationViewModelSummary,
    formatPublicPilotReadinessSnapshotSummary,
    formatSupportPlaybookConsoleSummary,
    formatPublicPilotCohortProgressTrackerSummary,
    formatReadOnlyTrialMilestoneBoardSummary,
    formatCohortProgressViewModelSummary,
    formatReadOnlyPilotRolloutControlCenterSummary,
    formatCohortHealthDashboardSummary,
    formatReadOnlyPilotExitCriteriaSummary,
    formatLaunchCandidateReadinessSummary,
    formatRcCandidateReviewSummary,
    formatRcEvidenceReviewChecklistSummary,
    formatRcReviewViewModelSummary,
    formatRcRegressionAuditSummary,
    formatReleaseRiskLedgerSummary,
    formatRcRegressionViewModelSummary,
    formatRcUserFacingCopyFinalizationSummary,
    formatSafetyDisclosureReviewBoardSummary,
    formatRcCopyReviewViewModelSummary,
    formatGlobalShoppingCoverageSummary,
    formatFlightWorkflowAuditReviewSummary,
    formatSafeSessionExportPreviewSummary,
    formatFlightWorkflowHumanReviewChecklistSummary,
    formatFlightWorkflowFinalSafeHandoffPacketSummary,
    formatFlightWorkflowOperatorConsoleSummary,
    formatFlightWorkflowSafetyRegressionSummary,
    formatFlightWorkflowScenarioSimulationSummary,
    formatFlightWorkflowSafetyTestMatrixSummary,
    buildReadOnlyQuoteEvidenceSummaryFormatterAuditDraft
  };
})();
