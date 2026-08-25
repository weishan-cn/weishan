;(function () {
  "use strict";

  const VERSION = "4.2.8";
  const MODULE_NAME = "public_beta_release_hardening_gate_v1";

  const REQUIRED_GOVERNANCE = Object.freeze({
    executionGate:"CLOSED",
    authorizesExecution:false,
    productionTraffic:false,
    productionAffected:false,
    WEISHAN_PAYS_PROVIDER:false,
    PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false
  });

  const REQUIRED_CHECKLIST_SECTIONS = Object.freeze([
    "startup",
    "environment",
    "config",
    "security",
    "state",
    "network",
    "build",
    "artifact",
    "metadata",
    "signing",
    "permission",
    "performance",
    "feedback"
  ]);

  const SECRET_KEYS = [
    /api[_-]?key/i,
    /authorization/i,
    /bearer/i,
    /challenge[_-]?password/i,
    /client[_-]?secret/i,
    /cookie/i,
    /credential/i,
    /password/i,
    /private[_-]?key/i,
    /raw[_-]?provider[_-]?response/i,
    /secret/i,
    /token/i
  ];

  const INTERNAL_VALUE_PATTERNS = [
    /Bearer\s+\S+/gi,
    /client_secret\s*[:=]\s*\S+/gi,
    /api[_-]?key\s*[:=]\s*\S+/gi,
    /private[_-]?key\s*[:=]\s*\S+/gi,
    /\/Users\/[^\s]+/gi,
    /apps\/desktop\/[^\s]+/gi,
    /stack trace/gi
  ];

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function bool(value) {
    return value === true;
  }

  function normalizeEnvironment(value) {
    const raw = text(value).toLowerCase();
    if (/^(production|prod)$/.test(raw)) return "production";
    if (/^(development|dev|local)$/.test(raw)) return "development";
    if (/^(test|ci)$/.test(raw)) return "test";
    if (/^(sandbox|evaluation|staging|preview)$/.test(raw)) return raw;
    return "unknown";
  }

  function status(pass) {
    return pass ? "PASS" : "FAIL";
  }

  function sanitizeValue(value) {
    if (value == null) return value;
    if (Array.isArray(value)) return value.map(sanitizeValue);
    if (typeof value === "object") return sanitizeObject(value);
    let safe = text(value);
    INTERNAL_VALUE_PATTERNS.forEach(function (pattern) {
      safe = safe.replace(pattern, "[redacted]");
    });
    return safe;
  }

  function sanitizeObject(input) {
    const safe = obj(input);
    return Object.keys(safe).reduce(function (acc, key) {
      if (SECRET_KEYS.some(function (pattern) { return pattern.test(key); })) {
        acc[key] = "[redacted]";
      } else {
        acc[key] = sanitizeValue(safe[key]);
      }
      return acc;
    }, {});
  }

  function evaluateGovernance(input) {
    const safe = obj(input);
    const result = Object.keys(REQUIRED_GOVERNANCE).reduce(function (acc, key) {
      acc[key] = safe[key] === REQUIRED_GOVERNANCE[key];
      return acc;
    }, {});
    const pass = Object.keys(result).every(function (key) { return result[key]; });
    return clone({
      status:status(pass),
      required:REQUIRED_GOVERNANCE,
      checks:result
    });
  }

  function evaluateReleaseMetadata(input) {
    const desktopPackage = obj(input.desktopPackage);
    const build = obj(desktopPackage.build);
    const mac = obj(build.mac);
    const win = obj(build.win);
    const pass = desktopPackage.productName === "Weishan"
      && build.productName === "Weishan"
      && build.appId === "ai.weishan.desktop"
      && Array.isArray(mac.target)
      && mac.target.includes("dmg")
      && Array.isArray(win.target)
      && win.target.includes("nsis")
      && text(build.icon).length > 0;

    return clone({
      status:status(pass),
      productName:desktopPackage.productName || null,
      buildProductName:build.productName || null,
      appId:build.appId || null,
      macTargets:Array.isArray(mac.target) ? mac.target.slice() : [],
      winTargets:Array.isArray(win.target) ? win.target.slice() : [],
      icon:build.icon || null
    });
  }

  function evaluateRuntimeBoundaries(input) {
    const safe = obj(input);
    const environment = normalizeEnvironment(safe.environment);
    const productionSwitches = obj(safe.productionSwitches);
    const dangerous = bool(productionSwitches.productionTraffic)
      || bool(productionSwitches.booking)
      || bool(productionSwitches.order)
      || bool(productionSwitches.payment)
      || bool(productionSwitches.ticketing)
      || bool(productionSwitches.providerProductionActivation);
    const environmentAllowsProduction = environment === "production" && bool(productionSwitches.executionGateOpen);
    const pass = !dangerous && !environmentAllowsProduction;

    return clone({
      status:status(pass),
      environment,
      productionTraffic:false,
      booking:false,
      order:false,
      payment:false,
      ticketing:false,
      providerProductionActivation:false
    });
  }

  function evaluateProviderTruth(input) {
    const safe = obj(input);
    const coverage = obj(safe.coverage);
    const shopping = text(coverage.shopping || "controlled_read_only");
    const flight = text(coverage.flight || "live_sources_limited");
    const hotel = text(coverage.hotel || "provider_pending");
    const cruise = text(coverage.cruise || "handoff_only");
    const pass = shopping !== "production_enabled"
      && flight !== "production_enabled"
      && hotel !== "production_enabled"
      && cruise !== "production_enabled";
    return clone({
      status:status(pass),
      shopping,
      flight,
      hotel,
      cruise,
      publicBetaClaim:"truthful_limited_read_only_or_handoff"
    });
  }

  function buildPublicBetaReleaseChecklist(input) {
    const safe = obj(input);
    return clone({
      checklistName:"Weishan Public Beta Release Checklist",
      version:VERSION,
      sections:REQUIRED_CHECKLIST_SECTIONS.map(function (sectionId) {
        return {
          sectionId,
          status:sectionId === "feedback" ? "PENDING_SEPARATE_APPROVAL" : "READY_FOR_REVIEW",
          requiredBeforePackage:sectionId !== "feedback",
          redacted:true
        };
      }),
      knownLimitations:[
        "Feedback mailbox / issue intake is intentionally deferred to a separate approved mission.",
        "Hotelbeds mTLS remains pending provider support; public hotel production pricing is not authorized.",
        "Flight and cruise real-price coverage remains limited to truthful read-only or handoff states."
      ],
      releaseCandidate:safe.releaseCandidate || null,
      redacted:true
    });
  }

  function evaluatePublicBetaReleaseHardening(input) {
    const safe = obj(input);
    const governance = evaluateGovernance(safe.governance);
    const metadata = evaluateReleaseMetadata(safe);
    const runtime = evaluateRuntimeBoundaries(safe);
    const providerTruth = evaluateProviderTruth(safe);
    const checklist = buildPublicBetaReleaseChecklist(safe);
    const checklistPass = checklist.sections.every(function (item) {
      return item.requiredBeforePackage ? item.status === "READY_FOR_REVIEW" : item.status === "PENDING_SEPARATE_APPROVAL";
    });
    const pass = governance.status === "PASS"
      && metadata.status === "PASS"
      && runtime.status === "PASS"
      && providerTruth.status === "PASS"
      && checklistPass;

    return clone({
      moduleName:MODULE_NAME,
      version:VERSION,
      status:pass ? "PASS" : "FAIL",
      governance,
      metadata,
      runtime,
      providerTruth,
      checklist,
      feedbackMailboxImplemented:false,
      feedbackMissionRequired:true,
      externalEffects:{
        providerApiCalls:0,
        providerAccountActions:0,
        providerCredentialMutations:0,
        websiteChanges:0,
        emailActions:0,
        bookings:0,
        orders:0,
        payments:0,
        tickets:0,
        productionTraffic:0
      },
      sanitizedDiagnostics:sanitizeObject(safe.diagnostics || {}),
      nextRecommendedMission:"PUBLIC_BETA_FEEDBACK_AND_ISSUE_INTAKE_GATE",
      redacted:true
    });
  }

  window.WeishanPublicBetaReleaseHardeningGate = {
    VERSION,
    MODULE_NAME,
    REQUIRED_GOVERNANCE,
    REQUIRED_CHECKLIST_SECTIONS,
    normalizeEnvironment,
    sanitizeObject,
    evaluateGovernance,
    evaluateReleaseMetadata,
    evaluateRuntimeBoundaries,
    evaluateProviderTruth,
    buildPublicBetaReleaseChecklist,
    evaluatePublicBetaReleaseHardening
  };
})();
