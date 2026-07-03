;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_COVERAGE_DASHBOARD_VERSION = "4.1.1";
  const DASHBOARD_NAME = "global_shopping_provider_coverage_dashboard_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function allowedType(value) {
    const type = text(value || "unknown");
    return /^(official|authorized|partner|affiliate|aggregator|fixture|unknown)$/.test(type) ? type : "unknown";
  }
  function allowedItemType(value) {
    const type = text(value || "unknown");
    return /^(flight|hotel|product|local_service|unknown)$/.test(type) ? type : "unknown";
  }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId || "row"),
      label:text(label || ""),
      value:text(value || ""),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
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
  function collectSources(input) {
    const safe = obj(input);
    const sources = [];
    toArray(obj(safe.adapterRegistrySummary).adapters).forEach(function (item) {
      sources.push({
        sourceType:allowedType(item.providerType),
        itemType:allowedItemType(item.itemType || safe.itemType || "unknown"),
        region:text(item.region || safe.region || "global"),
        redacted:true
      });
    });
    toArray(obj(obj(safe.firstSandboxProviderConnectorSummary).connectorResult).normalizedSourceInputCount ? safe.normalizedSourceInputs : []).forEach(function (item) {
      sources.push(item);
    });
    toArray(safe.normalizedSourceInputs).forEach(function (item) { sources.push(item); });
    return sources;
  }
  function countBy(list, key, value, parser) {
    return toArray(list).filter(function (item) { return parser(obj(item)[key]) === value; }).length;
  }

  function evaluateGlobalShoppingProviderCoverage(input) {
    const safe = obj(input);
    const adapterRegistry = obj(safe.adapterRegistrySummary);
    const connector = obj(safe.firstSandboxProviderConnectorSummary);
    const coveredLowest = obj(safe.coveredLowestCandidateBoardSummary);
    const sources = collectSources(safe);
    const coverageSummary = {
      totalRegisteredAdapters:toArray(adapterRegistry.adapters).length,
      totalSandboxConnectors:connector.connectorName ? 1 : 0,
      officialSourceCount:countBy(sources, "sourceType", "official", allowedType),
      authorizedSourceCount:countBy(sources, "sourceType", "authorized", allowedType),
      partnerSourceCount:countBy(sources, "sourceType", "partner", allowedType),
      affiliateSourceCount:countBy(sources, "sourceType", "affiliate", allowedType),
      aggregatorSourceCount:countBy(sources, "sourceType", "aggregator", allowedType),
      fixtureSourceCount:countBy(sources, "sourceType", "fixture", allowedType),
      flightCoverageCount:countBy(sources, "itemType", "flight", allowedItemType),
      hotelCoverageCount:countBy(sources, "itemType", "hotel", allowedItemType),
      productCoverageCount:countBy(sources, "itemType", "product", allowedItemType),
      localServiceCoverageCount:countBy(sources, "itemType", "local_service", allowedItemType),
      coveredRegionCount:Array.from(new Set(toArray(sources).map(function (item) { return text(obj(item).region || "global"); }).filter(Boolean))).length,
      hasOfficialCoverage:false,
      hasAuthorizedCoverage:false,
      hasCoveredLowestCandidateSupport:text(coveredLowest.status || "") === "ready",
      doesNotClaimWholeNetworkCoverage:safe.doesNotClaimWholeNetworkCoverage !== false,
      doesNotClaimAllProductsCoverage:safe.doesNotClaimAllProductsCoverage !== false,
      doesNotImplyPlatformEndorsement:safe.doesNotImplyPlatformEndorsement !== false
    };
    coverageSummary.hasOfficialCoverage = coverageSummary.officialSourceCount > 0;
    coverageSummary.hasAuthorizedCoverage = coverageSummary.authorizedSourceCount > 0;
    const blockedReasons = [];
    if (safe.claimsWholeNetworkCoverage === true || coverageSummary.doesNotClaimWholeNetworkCoverage !== true) blockedReasons.push("whole_network_coverage_claim_detected");
    if (safe.claimsAllProductsCoverage === true || coverageSummary.doesNotClaimAllProductsCoverage !== true) blockedReasons.push("all_products_coverage_claim_detected");
    if (safe.claimsPlatformEndorsement === true || coverageSummary.doesNotImplyPlatformEndorsement !== true) blockedReasons.push("platform_endorsement_claim_detected");
    if (safe.realProviderEnabled === true || safe.networkEnabled === true || safe.checkout === true || safe.payment === true || safe.order === true || safe.ticketing === true) blockedReasons.push("real_provider_or_transaction_detected");
    return clone({
      coverageSummary:coverageSummary,
      blockedReasons:blockedReasons,
      status:blockedReasons.length ? "blocked" : (coverageSummary.totalRegisteredAdapters <= 0 ? "needs_review" : "ready"),
      redacted:true
    });
  }

  function buildGlobalShoppingProviderCoverageRows(input) {
    const evaluation = evaluateGlobalShoppingProviderCoverage(input || {});
    const summary = evaluation.coverageSummary;
    return clone([
      row("registered_adapters", "已注册来源", summary.totalRegisteredAdapters > 0 ? String(summary.totalRegisteredAdapters) : "仍需复核", summary.totalRegisteredAdapters > 0 ? "pass" : "warning"),
      row("sandbox_connectors", "Sandbox Connector", summary.totalSandboxConnectors > 0 ? String(summary.totalSandboxConnectors) : "仍需复核", summary.totalSandboxConnectors > 0 ? "pass" : "warning"),
      row("source_mix", "来源结构", "official:" + summary.officialSourceCount + " / authorized:" + summary.authorizedSourceCount + " / partner:" + summary.partnerSourceCount + " / affiliate:" + summary.affiliateSourceCount + " / aggregator:" + summary.aggregatorSourceCount + " / fixture:" + summary.fixtureSourceCount, "pass"),
      row("item_mix", "品类覆盖", "flight:" + summary.flightCoverageCount + " / hotel:" + summary.hotelCoverageCount + " / product:" + summary.productCoverageCount + " / local_service:" + summary.localServiceCoverageCount, "pass"),
      row("region_mix", "区域覆盖", summary.coveredRegionCount > 0 ? String(summary.coveredRegionCount) : "仍需复核", summary.coveredRegionCount > 0 ? "pass" : "warning")
    ]);
  }

  function buildGlobalShoppingProviderCoverageDashboard(input) {
    try {
      return sanitizeGlobalShoppingProviderCoverageDashboard(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingProviderCoverageDashboard({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingProviderCoverageDashboardAuditDraft(input) {
    const dashboard = buildGlobalShoppingProviderCoverageDashboard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_COVERAGE_DASHBOARD_AUDIT_DRAFT",
      dashboardName:DASHBOARD_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_COVERAGE_DASHBOARD_VERSION,
      status:dashboard.status,
      blockedReasons:dashboard.blockedReasons,
      totalRegisteredAdapters:obj(dashboard.coverageSummary).totalRegisteredAdapters || 0,
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

  function sanitizeGlobalShoppingProviderCoverageDashboard(dashboard) {
    const safe = obj(dashboard);
    const evaluation = evaluateGlobalShoppingProviderCoverage(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      dashboardName:DASHBOARD_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_COVERAGE_DASHBOARD_VERSION,
      status:status,
      coverageSummary:clone(evaluation.coverageSummary),
      coverageRows:toArray(safe.coverageRows).length ? toArray(safe.coverageRows) : buildGlobalShoppingProviderCoverageRows(safe),
      uncoveredRows:toArray(safe.uncoveredRows).length ? toArray(safe.uncoveredRows) : [
        row("whole_network", "全网覆盖", "当前不声称全网覆盖", "pass"),
        row("all_products", "所有商品覆盖", "当前不声称所有商品覆盖", "pass")
      ],
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("coverage_boundary", "覆盖来源边界", "覆盖来源不代表全网覆盖", "pass"),
        row("endorsement_boundary", "平台展示边界", "平台可展示不等于官方背书或可下单", "pass")
      ],
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"Provider 覆盖看板",
        resultLabel:status === "ready" ? "Provider 覆盖结构已准备" : (status === "needs_review" ? "Provider 覆盖仍需复核" : "Provider 覆盖已阻断"),
        caveat:"当前仅统计已注册的 fixture/dry-run/sandbox 来源，不代表全网覆盖、所有商品覆盖、官方背书或可下单能力。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderCoverageDashboard = {
    GLOBAL_SHOPPING_PROVIDER_COVERAGE_DASHBOARD_VERSION,
    DASHBOARD_NAME,
    buildGlobalShoppingProviderCoverageDashboard,
    evaluateGlobalShoppingProviderCoverage,
    buildGlobalShoppingProviderCoverageRows,
    buildGlobalShoppingProviderCoverageDashboardAuditDraft,
    sanitizeGlobalShoppingProviderCoverageDashboard
  };
})();
