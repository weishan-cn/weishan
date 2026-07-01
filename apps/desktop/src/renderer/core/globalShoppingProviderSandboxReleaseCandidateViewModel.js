;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_SANDBOX_RELEASE_CANDIDATE_VIEW_MODEL_VERSION = "2.9.0";
  const VIEW_MODEL_NAME = "global_shopping_provider_sandbox_release_candidate_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
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
  function summaryLabel(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }

  function buildGlobalShoppingAdapterContractKitRowsForView(input) {
    const summary = resolveSummary(input, "offlineProviderAdapterContractKitSummary", "WeishanGlobalShoppingOfflineProviderAdapterContractKit", "buildGlobalShoppingOfflineProviderAdapterContractKit");
    return toArray(summary.rows).length ? clone(summary.rows) : clone([row("adapter_contract_kit_missing", "Adapter Contract Kit", "离线 Adapter 合同仍需复核", "warning")]);
  }

  function buildGlobalShoppingMockSandboxQaRowsForView(input) {
    const summary = resolveSummary(input, "mockSandboxQaMatrixSummary", "WeishanGlobalShoppingMockSandboxQaMatrix", "buildGlobalShoppingMockSandboxQaMatrix");
    return toArray(summary.rows).length ? clone(summary.rows) : clone([row("mock_sandbox_qa_matrix_missing", "Mock QA Matrix", "Mock Sandbox QA 仍需复核", "warning")]);
  }

  function buildGlobalShoppingHumanActivationRunbookRowsForView(input) {
    const summary = resolveSummary(input, "humanActivationRunbookCenterSummary", "WeishanGlobalShoppingHumanActivationRunbookCenter", "buildGlobalShoppingHumanActivationRunbookCenter");
    return toArray(summary.rows).length ? clone(summary.rows) : clone([row("human_activation_runbook_missing", "Human Runbook", "人工激活运行手册仍需复核", "warning")]);
  }

  function buildGlobalShoppingAdapterComplianceRowsForView(input) {
    const summary = resolveSummary(input, "providerAdapterComplianceChecklistSummary", "WeishanGlobalShoppingProviderAdapterComplianceChecklist", "buildGlobalShoppingProviderAdapterComplianceChecklist");
    return toArray(summary.rows).length ? clone(summary.rows) : clone([row("adapter_compliance_missing", "Adapter Compliance", "Adapter 合规清单仍需复核", "warning")]);
  }

  function buildGlobalShoppingProviderSandboxReleaseCandidateCards(input) {
    const safe = obj(input);
    const contractKit = resolveSummary(safe, "offlineProviderAdapterContractKitSummary", "WeishanGlobalShoppingOfflineProviderAdapterContractKit", "buildGlobalShoppingOfflineProviderAdapterContractKit");
    const qaMatrix = resolveSummary(safe, "mockSandboxQaMatrixSummary", "WeishanGlobalShoppingMockSandboxQaMatrix", "buildGlobalShoppingMockSandboxQaMatrix");
    const runbookCenter = resolveSummary(safe, "humanActivationRunbookCenterSummary", "WeishanGlobalShoppingHumanActivationRunbookCenter", "buildGlobalShoppingHumanActivationRunbookCenter");
    const complianceChecklist = resolveSummary(safe, "providerAdapterComplianceChecklistSummary", "WeishanGlobalShoppingProviderAdapterComplianceChecklist", "buildGlobalShoppingProviderAdapterComplianceChecklist");
    return clone([
      card("adapter_contract_kit", "Adapter Contract Kit", summaryLabel(contractKit, "离线 Adapter 合同仍需复核")),
      card("mock_qa_matrix", "Mock QA Matrix", summaryLabel(qaMatrix, "Mock Sandbox QA 仍需复核")),
      card("human_runbook", "Human Runbook", summaryLabel(runbookCenter, "人工激活运行手册仍需复核")),
      card("adapter_compliance", "Adapter Compliance", summaryLabel(complianceChecklist, "Adapter 合规清单仍需复核")),
      card("risk_disclosure", "风险说明", "Manual release candidate review 仍需人工复核")
    ]);
  }

  function buildGlobalShoppingProviderSandboxReleaseCandidateRows(input) {
    const safe = obj(input);
    return clone([
      row("provider_sandbox_release_candidate_status", "Provider Sandbox Release Candidate", "当前只展示 provider sandbox release candidate", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_sandbox_release_candidate_boundary", "只读边界", "不接真实 provider，不读取密钥，不联网，不生成 endpoint，不创建 release，不 push。", "pass")
    ]);
  }

  function sanitizeGlobalShoppingProviderSandboxReleaseCandidateViewModel(viewModel) {
    const safe = obj(viewModel);
    const contractKit = resolveSummary(safe, "offlineProviderAdapterContractKitSummary", "WeishanGlobalShoppingOfflineProviderAdapterContractKit", "buildGlobalShoppingOfflineProviderAdapterContractKit");
    const qaMatrix = resolveSummary(safe, "mockSandboxQaMatrixSummary", "WeishanGlobalShoppingMockSandboxQaMatrix", "buildGlobalShoppingMockSandboxQaMatrix");
    const runbookCenter = resolveSummary(safe, "humanActivationRunbookCenterSummary", "WeishanGlobalShoppingHumanActivationRunbookCenter", "buildGlobalShoppingHumanActivationRunbookCenter");
    const complianceChecklist = resolveSummary(safe, "providerAdapterComplianceChecklistSummary", "WeishanGlobalShoppingProviderAdapterComplianceChecklist", "buildGlobalShoppingProviderAdapterComplianceChecklist");
    const statuses = [contractKit, qaMatrix, runbookCenter, complianceChecklist].map(function (item) { return safeStatus(obj(item).status); });
    const blocked = statuses.indexOf("blocked") >= 0;
    const needsReview = !present(contractKit) || !present(qaMatrix) || !present(runbookCenter) || !present(complianceChecklist) || statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_SANDBOX_RELEASE_CANDIDATE_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider Sandbox Release Candidate",
      cards:buildGlobalShoppingProviderSandboxReleaseCandidateCards({
        offlineProviderAdapterContractKitSummary:contractKit,
        mockSandboxQaMatrixSummary:qaMatrix,
        humanActivationRunbookCenterSummary:runbookCenter,
        providerAdapterComplianceChecklistSummary:complianceChecklist
      }),
      adapterContractRows:buildGlobalShoppingAdapterContractKitRowsForView({ offlineProviderAdapterContractKitSummary:contractKit }),
      mockQaRows:buildGlobalShoppingMockSandboxQaRowsForView({ mockSandboxQaMatrixSummary:qaMatrix }),
      humanRunbookRows:buildGlobalShoppingHumanActivationRunbookRowsForView({ humanActivationRunbookCenterSummary:runbookCenter }),
      adapterComplianceRows:buildGlobalShoppingAdapterComplianceRowsForView({ providerAdapterComplianceChecklistSummary:complianceChecklist }),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("release_candidate_disclosure_contract", "Adapter Contract Kit 不生成真实 SDK", "Adapter Contract Kit 不生成真实 SDK", "pass"),
        row("release_candidate_disclosure_qa", "Mock QA Matrix 不运行真实 provider", "Mock QA Matrix 不运行真实 provider", "pass"),
        row("release_candidate_disclosure_runbook", "Human Runbook 不创建任务、不激活 sandbox", "Human Runbook 不创建任务、不激活 sandbox", "pass"),
        row("release_candidate_disclosure_compliance", "Adapter Compliance 不创建 provider client", "Adapter Compliance 不创建 provider client", "pass"),
        row("release_candidate_disclosure_manual", "Manual release candidate review 仍需人工复核", "Manual release candidate review 仍需人工复核", "warning")
      ],
      offlineProviderAdapterContractKitSummary:clone(contractKit),
      mockSandboxQaMatrixSummary:clone(qaMatrix),
      humanActivationRunbookCenterSummary:clone(runbookCenter),
      providerAdapterComplianceChecklistSummary:clone(complianceChecklist),
      caveat:"当前只展示 provider sandbox release candidate，不接真实 provider，不读取密钥，不联网，不生成 endpoint，不创建 release，不 push。"
    });
  }

  function buildGlobalShoppingProviderSandboxReleaseCandidateViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderSandboxReleaseCandidateViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_SANDBOX_RELEASE_CANDIDATE_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_SANDBOX_RELEASE_CANDIDATE_VIEW_MODEL_VERSION,
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
      secretStored:false,
      redacted:true
    });
  }

  function buildGlobalShoppingProviderSandboxReleaseCandidateViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderSandboxReleaseCandidateViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderSandboxReleaseCandidateViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderSandboxReleaseCandidateViewModel = {
    GLOBAL_SHOPPING_PROVIDER_SANDBOX_RELEASE_CANDIDATE_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderSandboxReleaseCandidateViewModel,
    buildGlobalShoppingProviderSandboxReleaseCandidateCards,
    buildGlobalShoppingProviderSandboxReleaseCandidateRows,
    buildGlobalShoppingAdapterContractKitRowsForView,
    buildGlobalShoppingMockSandboxQaRowsForView,
    buildGlobalShoppingHumanActivationRunbookRowsForView,
    buildGlobalShoppingAdapterComplianceRowsForView,
    buildGlobalShoppingProviderSandboxReleaseCandidateViewModelAuditDraft,
    sanitizeGlobalShoppingProviderSandboxReleaseCandidateViewModel
  };
})();
