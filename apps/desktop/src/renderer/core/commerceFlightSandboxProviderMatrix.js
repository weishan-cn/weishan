;(function () {
  "use strict";

  const MATRIX_VERSION = "2.1.96";
  const PHASE = "flight_sandbox_provider_matrix";
  const DEFAULT_MATRIX_STATUS = "readiness_matrix_only";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function defaultCapabilities() {
    return {
      canBuildProviderMatrix: true,
      canAttachCandidateProviders: true,
      canAttachDryRunShellStatus: true,
      canAttachReadonlyStubStatus: true,
      canAttachApprovalStatus: true,
      canAuditBlockedCapabilities: true,
      canShowReadinessState: true,
      canUseNetwork: false,
      canUseApiKey: false,
      canConnectEndpoint: false,
      canReturnPrice: false,
      canReturnBookingUrl: false,
      canOpenBookingUrl: false,
      canCreateOrder: false,
      canPay: false,
      canStoreIdentity: false
    };
  }

  function defaultDisplay() {
    return {
      summaryTitle: "候选平台沙箱矩阵",
      currentStatusLine: "当前状态：候选平台已进入沙箱矩阵，但尚未允许连接真实 provider。",
      matrixSummaryLine: "矩阵摘要：候选平台数量：0 · 可返回真实价格：0 · 可返回 bookingUrl：0 · 可下单：0 · 可付款：0 · 网络连接：全部禁用 · API key：全部禁用 · endpoint：全部禁用",
      conclusionLine: "当前结论：不能返回最低价两家",
      reasonLine: "候选平台沙箱矩阵只用于审计和准备，不代表已接入真实 provider。",
      providerCountLabel: "候选平台数量",
      readonlyPriceLabel: "可返回真实价格",
      bookingUrlLabel: "可返回 bookingUrl",
      orderLabel: "可下单",
      paymentLabel: "可付款",
      networkLabel: "网络连接",
      apiKeyLabel: "API key",
      endpointLabel: "endpoint",
      blockedConclusionLine: "候选平台沙箱矩阵默认全部阻断，只允许审计，不允许真实连接。",
      providerRowLabels: {
        candidateStatus: "候选状态",
        approvalStatus: "审批状态",
        readonlyStubPermission: "只读适配器开发许可",
        readonlyStubScaffold: "只读适配器空壳",
        sandboxDryRunShell: "Sandbox Dry Run",
        realProviderConnection: "真实 provider",
        apiKey: "API key",
        endpoint: "endpoint",
        network: "网络",
        priceReturn: "价格返回",
        bookingUrlReturn: "bookingUrl",
        orderCreation: "下单",
        payment: "付款",
        identityStorage: "证件 / 银行卡",
        readinessLevel: "当前结论",
        reason: "原因"
      }
    };
  }

  function defaultCandidateProfiles() {
    return [
      {
        providerId: "google_flights",
        providerName: "Google Flights",
        providerType: "flight_search_candidate",
        officialDomains: ["google.com", "google.com/travel/flights"],
        searchEntryUrl: "https://www.google.com/travel/flights"
      },
      {
        providerId: "trip_com_ctrip",
        providerName: "Trip.com / 携程",
        providerType: "flight_search_candidate",
        officialDomains: ["trip.com", "ctrip.com"],
        searchEntryUrl: "https://www.trip.com/flights/search/"
      },
      {
        providerId: "skyscanner",
        providerName: "Skyscanner",
        providerType: "flight_search_candidate",
        officialDomains: ["skyscanner.com"],
        searchEntryUrl: "https://www.skyscanner.com/flights"
      },
      {
        providerId: "kayak",
        providerName: "Kayak",
        providerType: "flight_search_candidate",
        officialDomains: ["kayak.com"],
        searchEntryUrl: "https://www.kayak.com/flights"
      },
      {
        providerId: "expedia",
        providerName: "Expedia",
        providerType: "flight_search_candidate",
        officialDomains: ["expedia.com"],
        searchEntryUrl: "https://www.expedia.com/Flights"
      },
      {
        providerId: "booking_flights",
        providerName: "Booking Flights",
        providerType: "flight_search_candidate",
        officialDomains: ["booking.com"],
        searchEntryUrl: "https://www.booking.com/flights"
      },
      {
        providerId: "airline_official_website",
        providerName: "航司官网占位",
        providerType: "flight_search_candidate",
        officialDomains: ["airline-official-website.placeholder"],
        searchEntryUrl: "https://www.google.com/search?q=airline+official+website+flight+search"
      }
    ];
  }

  function defaultBlockedModes() {
    return {
      networkMode: "disabled",
      apiKeyMode: "disabled",
      endpointMode: "disabled",
      providerMode: "candidate_only",
      priceMode: "disabled",
      bookingUrlMode: "disabled",
      orderMode: "disabled",
      paymentMode: "disabled",
      identityStorageMode: "disabled"
    };
  }

  function normalizeCandidate(candidate, index) {
    const raw = candidate && typeof candidate === "object" ? candidate : {};
    const providerName = String(raw.providerName || ("候选平台 " + (index + 1)));
    return {
      providerId: String(raw.providerId || ("candidate-" + (index + 1))),
      providerName,
      providerType: String(raw.providerType || "flight_search_candidate"),
      officialDomains: Array.isArray(raw.officialDomains) ? raw.officialDomains.slice() : [],
      searchEntryUrl: String(raw.searchEntryUrl || ""),
      candidateStatus: "candidate_only",
      approvalStatus: "not_reviewed",
      readonlyStubPermission: "not_granted",
      readonlyStubScaffold: "available",
      sandboxDryRunShell: "available_shell_only",
      realProviderConnection: "disabled",
      apiKey: "disabled",
      endpoint: "disabled",
      network: "disabled",
      priceReturn: "disabled",
      bookingUrlReturn: "disabled",
      orderCreation: "disabled",
      payment: "disabled",
      identityStorage: "disabled",
      readinessLevel: "not_ready_for_price",
      reason: "provider_matrix_no_real_connection"
    };
  }

  function normalizeFlightSandboxProviderMatrix(matrix) {
    const raw = matrix && typeof matrix === "object" ? matrix : {};
    const matrixRows = Array.isArray(raw.providerRows) && raw.providerRows.length
      ? raw.providerRows.map((row, index) => normalizeCandidate(row, index))
      : defaultCandidateProfiles().map((item, index) => normalizeCandidate(item, index));
    const summary = summarizeFlightSandboxProviderMatrix({ providerRows: matrixRows });
    const display = Object.assign(defaultDisplay(), raw.display && typeof raw.display === "object" ? raw.display : {});
    display.matrixSummaryLine = `矩阵摘要：候选平台数量：${summary.totalCandidates} · 可返回真实价格：${summary.readyForReadonlyPrice} · 可返回 bookingUrl：${summary.readyForBookingUrl} · 可下单：${summary.readyForPayment} · 可付款：${summary.readyForPayment} · 网络连接：全部禁用 · API key：全部禁用 · endpoint：全部禁用`;
    return clone({
      matrixVersion: String(raw.matrixVersion || MATRIX_VERSION),
      phase: String(raw.phase || PHASE),
      matrixStatus: String(raw.matrixStatus || DEFAULT_MATRIX_STATUS),
      ...defaultBlockedModes(),
      capabilities: Object.assign(defaultCapabilities(), raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      providerRows: matrixRows,
      summary,
      display
    });
  }

  function buildFlightSandboxProviderMatrix(options) {
    const raw = options && typeof options === "object" ? options : {};
    let candidates = Array.isArray(raw.candidates) && raw.candidates.length ? raw.candidates.slice() : null;
    if (!candidates && window.WeishanCommerceFlightProviderCandidates && typeof window.WeishanCommerceFlightProviderCandidates.getFlightProviderCandidatesRegistry === "function") {
      const registry = window.WeishanCommerceFlightProviderCandidates.getFlightProviderCandidatesRegistry();
      if (registry && Array.isArray(registry.candidateProfiles) && registry.candidateProfiles.length) {
        candidates = registry.candidateProfiles.slice();
      }
    }
    if (!candidates || !candidates.length) candidates = defaultCandidateProfiles();
    const providerRows = candidates.map((candidate, index) => normalizeCandidate(candidate, index));
    const summary = summarizeFlightSandboxProviderMatrix({ providerRows });
    return normalizeFlightSandboxProviderMatrix({
      matrixVersion: raw.matrixVersion || MATRIX_VERSION,
      phase: raw.phase || PHASE,
      matrixStatus: raw.matrixStatus || DEFAULT_MATRIX_STATUS,
      providerRows,
      capabilities: defaultCapabilities(),
      display: Object.assign(defaultDisplay(), {
        matrixSummaryLine: `矩阵摘要：候选平台数量：${summary.totalCandidates} · 可返回真实价格：${summary.readyForReadonlyPrice} · 可返回 bookingUrl：${summary.readyForBookingUrl} · 可下单：${summary.readyForPayment} · 可付款：${summary.readyForPayment} · 网络连接：全部禁用 · API key：全部禁用 · endpoint：全部禁用`,
        conclusionLine: "当前结论：不能返回最低价两家",
        blockedConclusionLine: "候选平台沙箱矩阵默认全部阻断，只允许审计，不允许真实连接。"
      }),
      dryRunContract: clone(raw.dryRunContract || null),
      readonlyStubContract: clone(raw.readonlyStubContract || null),
      approvalStatus: clone(raw.approvalStatus || null),
      permissionStatus: clone(raw.permissionStatus || null)
    });
  }

  function summarizeFlightSandboxProviderMatrix(matrix) {
    const rows = Array.isArray(matrix && matrix.providerRows) ? matrix.providerRows : Array.isArray(matrix) ? matrix : [];
    const totalCandidates = rows.length;
    return {
      totalCandidates,
      readyForReadonlyPrice: 0,
      readyForBookingUrl: 0,
      readyForPayment: 0,
      blockedFromNetwork: totalCandidates,
      blockedFromPrice: totalCandidates,
      blockedFromBookingUrl: totalCandidates,
      blockedFromOrder: totalCandidates,
      blockedFromPayment: totalCandidates,
      overallStatus: "not_ready_for_real_price",
      reason: "all_candidates_require_human_approval_and_real_provider_connection"
    };
  }

  function assertFlightSandboxProviderMatrixSafe(matrix, summary) {
    const safeMatrix = normalizeFlightSandboxProviderMatrix(matrix);
    const safeSummary = summary && typeof summary === "object" ? summary : summarizeFlightSandboxProviderMatrix(safeMatrix);
    const issues = [];

    if (safeMatrix.matrixStatus !== DEFAULT_MATRIX_STATUS) issues.push("matrixStatus");
    if (safeMatrix.networkMode !== "disabled") issues.push("networkMode");
    if (safeMatrix.apiKeyMode !== "disabled") issues.push("apiKeyMode");
    if (safeMatrix.endpointMode !== "disabled") issues.push("endpointMode");
    if (safeMatrix.providerMode !== "candidate_only") issues.push("providerMode");
    if (safeMatrix.priceMode !== "disabled") issues.push("priceMode");
    if (safeMatrix.bookingUrlMode !== "disabled") issues.push("bookingUrlMode");
    if (safeMatrix.orderMode !== "disabled") issues.push("orderMode");
    if (safeMatrix.paymentMode !== "disabled") issues.push("paymentMode");
    if (safeMatrix.identityStorageMode !== "disabled") issues.push("identityStorageMode");

    if (!safeMatrix.capabilities || safeMatrix.capabilities.canBuildProviderMatrix !== true) issues.push("canBuildProviderMatrix");
    if (!safeMatrix.capabilities || safeMatrix.capabilities.canAttachCandidateProviders !== true) issues.push("canAttachCandidateProviders");
    if (!safeMatrix.capabilities || safeMatrix.capabilities.canAttachDryRunShellStatus !== true) issues.push("canAttachDryRunShellStatus");
    if (!safeMatrix.capabilities || safeMatrix.capabilities.canAttachReadonlyStubStatus !== true) issues.push("canAttachReadonlyStubStatus");
    if (!safeMatrix.capabilities || safeMatrix.capabilities.canAttachApprovalStatus !== true) issues.push("canAttachApprovalStatus");
    if (!safeMatrix.capabilities || safeMatrix.capabilities.canAuditBlockedCapabilities !== true) issues.push("canAuditBlockedCapabilities");
    if (!safeMatrix.capabilities || safeMatrix.capabilities.canShowReadinessState !== true) issues.push("canShowReadinessState");
    if (!safeMatrix.capabilities || safeMatrix.capabilities.canUseNetwork !== false) issues.push("canUseNetwork");
    if (!safeMatrix.capabilities || safeMatrix.capabilities.canUseApiKey !== false) issues.push("canUseApiKey");
    if (!safeMatrix.capabilities || safeMatrix.capabilities.canConnectEndpoint !== false) issues.push("canConnectEndpoint");
    if (!safeMatrix.capabilities || safeMatrix.capabilities.canReturnPrice !== false) issues.push("canReturnPrice");
    if (!safeMatrix.capabilities || safeMatrix.capabilities.canReturnBookingUrl !== false) issues.push("canReturnBookingUrl");
    if (!safeMatrix.capabilities || safeMatrix.capabilities.canOpenBookingUrl !== false) issues.push("canOpenBookingUrl");
    if (!safeMatrix.capabilities || safeMatrix.capabilities.canCreateOrder !== false) issues.push("canCreateOrder");
    if (!safeMatrix.capabilities || safeMatrix.capabilities.canPay !== false) issues.push("canPay");
    if (!safeMatrix.capabilities || safeMatrix.capabilities.canStoreIdentity !== false) issues.push("canStoreIdentity");

    const rows = Array.isArray(safeMatrix.providerRows) ? safeMatrix.providerRows : [];
    rows.forEach((row, index) => {
      if (row.candidateStatus !== "candidate_only") issues.push(`providerRows[${index}].candidateStatus`);
      if (row.approvalStatus !== "not_reviewed") issues.push(`providerRows[${index}].approvalStatus`);
      if (row.readonlyStubPermission !== "not_granted") issues.push(`providerRows[${index}].readonlyStubPermission`);
      if (row.readonlyStubScaffold !== "available") issues.push(`providerRows[${index}].readonlyStubScaffold`);
      if (row.sandboxDryRunShell !== "available_shell_only") issues.push(`providerRows[${index}].sandboxDryRunShell`);
      if (row.realProviderConnection !== "disabled") issues.push(`providerRows[${index}].realProviderConnection`);
      if (row.apiKey !== "disabled") issues.push(`providerRows[${index}].apiKey`);
      if (row.endpoint !== "disabled") issues.push(`providerRows[${index}].endpoint`);
      if (row.network !== "disabled") issues.push(`providerRows[${index}].network`);
      if (row.priceReturn !== "disabled") issues.push(`providerRows[${index}].priceReturn`);
      if (row.bookingUrlReturn !== "disabled") issues.push(`providerRows[${index}].bookingUrlReturn`);
      if (row.orderCreation !== "disabled") issues.push(`providerRows[${index}].orderCreation`);
      if (row.payment !== "disabled") issues.push(`providerRows[${index}].payment`);
      if (row.identityStorage !== "disabled") issues.push(`providerRows[${index}].identityStorage`);
      if (row.readinessLevel !== "not_ready_for_price") issues.push(`providerRows[${index}].readinessLevel`);
      if (row.reason !== "provider_matrix_no_real_connection") issues.push(`providerRows[${index}].reason`);
    });

    if (safeSummary.totalCandidates !== rows.length) issues.push("summary.totalCandidates");
    if (safeSummary.readyForReadonlyPrice !== 0) issues.push("summary.readyForReadonlyPrice");
    if (safeSummary.readyForBookingUrl !== 0) issues.push("summary.readyForBookingUrl");
    if (safeSummary.readyForPayment !== 0) issues.push("summary.readyForPayment");
    if (safeSummary.blockedFromNetwork !== rows.length) issues.push("summary.blockedFromNetwork");
    if (safeSummary.blockedFromPrice !== rows.length) issues.push("summary.blockedFromPrice");
    if (safeSummary.blockedFromBookingUrl !== rows.length) issues.push("summary.blockedFromBookingUrl");
    if (safeSummary.blockedFromOrder !== rows.length) issues.push("summary.blockedFromOrder");
    if (safeSummary.blockedFromPayment !== rows.length) issues.push("summary.blockedFromPayment");
    if (safeSummary.overallStatus !== "not_ready_for_real_price") issues.push("summary.overallStatus");
    if (safeSummary.reason !== "all_candidates_require_human_approval_and_real_provider_connection") issues.push("summary.reason");

    if (issues.length > 0) {
      throw new Error("Flight Sandbox Provider Matrix must remain blocked: " + issues.join(", "));
    }
    return true;
  }

  function describeFlightSandboxProviderMatrix(matrix) {
    const safe = normalizeFlightSandboxProviderMatrix(matrix);
    const summary = summarizeFlightSandboxProviderMatrix(safe);
    const display = safe.display || defaultDisplay();
    return {
      matrixVersion: safe.matrixVersion,
      phase: safe.phase,
      matrixStatus: safe.matrixStatus,
      summaryTitle: display.summaryTitle || "候选平台沙箱矩阵",
      currentStatusLine: display.currentStatusLine || "当前状态：候选平台已进入沙箱矩阵，但尚未允许连接真实 provider。",
      matrixSummaryLine: display.matrixSummaryLine || `矩阵摘要：候选平台数量：${summary.totalCandidates} · 可返回真实价格：${summary.readyForReadonlyPrice} · 可返回 bookingUrl：${summary.readyForBookingUrl} · 可下单：${summary.readyForPayment} · 可付款：${summary.readyForPayment} · 网络连接：全部禁用 · API key：全部禁用 · endpoint：全部禁用`,
      conclusionLine: display.conclusionLine || "当前结论：不能返回最低价两家",
      reasonLine: display.reasonLine || "候选平台沙箱矩阵只用于审计和准备，不代表已接入真实 provider。",
      providerCountLabel: `${summary.totalCandidates}`,
      readonlyPriceLabel: `${summary.readyForReadonlyPrice}`,
      bookingUrlLabel: `${summary.readyForBookingUrl}`,
      orderLabel: `${summary.readyForPayment}`,
      paymentLabel: `${summary.readyForPayment}`,
      networkLabel: "全部禁用",
      apiKeyLabel: "全部禁用",
      endpointLabel: "全部禁用",
      blockedConclusionLine: display.blockedConclusionLine || "候选平台沙箱矩阵默认全部阻断，只允许审计，不允许真实连接。",
      providerRows: Array.isArray(safe.providerRows) ? safe.providerRows.map((row) => ({
        providerId: String(row.providerId || ""),
        providerName: String(row.providerName || ""),
        providerTypeLabel: String(row.providerType || "flight_search_candidate"),
        candidateStatusLabel: "候选平台",
        approvalStatusLabel: "未审查",
        readonlyStubPermissionLabel: "未授予",
        readonlyStubScaffoldLabel: "可用",
        sandboxDryRunShellLabel: "外壳可用",
        realProviderConnectionLabel: "未连接",
        apiKeyLabel: "禁用",
        endpointLabel: "禁用",
        networkLabel: "禁用",
        priceReturnLabel: "禁用",
        bookingUrlReturnLabel: "禁用",
        orderCreationLabel: "禁用",
        paymentLabel: "禁用",
        identityStorageLabel: "禁用",
        readinessLevelLabel: "未准备好返回价格",
        reasonLabel: "provider_matrix_no_real_connection",
        officialDomains: Array.isArray(row.officialDomains) ? row.officialDomains.slice() : [],
        searchEntryUrl: String(row.searchEntryUrl || "")
      })) : [],
      summary
    };
  }

  const defaultContract = normalizeFlightSandboxProviderMatrix();

  window.WeishanCommerceFlightSandboxProviderMatrix = {
    MATRIX_VERSION,
    PHASE,
    DEFAULT_MATRIX_STATUS,
    defaultCapabilities,
    defaultDisplay,
    defaultCandidateProfiles,
    defaultBlockedModes,
    flightSandboxProviderMatrixContract: defaultContract,
    getFlightSandboxProviderMatrixContract: normalizeFlightSandboxProviderMatrix,
    normalizeFlightSandboxProviderMatrix,
    buildFlightSandboxProviderMatrix,
    summarizeFlightSandboxProviderMatrix,
    assertFlightSandboxProviderMatrixSafe,
    describeFlightSandboxProviderMatrix
  };
})();
