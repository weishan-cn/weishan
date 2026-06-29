;(function () {
  "use strict";

  const PROVIDER_CONNECTION_READINESS_DECISION_ENGINE_VERSION = "2.1.97";

  function text(value) {
    return String(value || "").trim();
  }

  function list(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
  }

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function includesFlag(source, key) {
    if (!source || typeof source !== "object") return false;
    return source[key] === true || source[key] === "enabled" || source[key] === "requested";
  }

  function evaluateProviderConnectionReadiness(input) {
    const raw = input && typeof input === "object" ? input : {};
    const providerCategory = text(raw.providerCategory || "unknown_provider");
    const featureFlags = raw.featureFlags && typeof raw.featureFlags === "object" ? raw.featureFlags : {};
    const safetyGates = raw.safetyGates && typeof raw.safetyGates === "object" ? raw.safetyGates : {};
    const credentialState = raw.credentialState && typeof raw.credentialState === "object" ? raw.credentialState : {};
    const adapterState = raw.adapterState && typeof raw.adapterState === "object" ? raw.adapterState : {};
    const manualReviewState = raw.manualReviewState && typeof raw.manualReviewState === "object" ? raw.manualReviewState : {};
    const reasons = [];
    const missingRequirements = [];
    const forbiddenActions = [];
    const nextAllowedSteps = [];

    function miss(key, label) {
      if (safetyGates[key] !== true) {
        missingRequirements.push(label);
        reasons.push(label + " missing");
      }
    }

    if (providerCategory === "restricted_provider" || featureFlags.restrictedCategory === true) {
      return clone({
        decisionEngineVersion: PROVIDER_CONNECTION_READINESS_DECISION_ENGINE_VERSION,
        providerCategory,
        decision: "blocked",
        finalDecision: "blocked",
        decisionReason: "restricted category blocked",
        realProvider: "disabled",
        realNetwork: "disabled",
        realApiKey: "disabled",
        credentialStorage: {
          secureStorageImplementation: "not allowed",
          realCredentialConnected: "not allowed",
          credentialConsent: "not allowed",
          credentialPlaintextDisplay: "disabled",
          credentialExport: "disabled",
          finalDecision: "blocked"
        },
        realEndpoint: "disabled",
        realPrice: "disabled",
        availability: "disabled",
        bookingUrl: "disabled",
        payment: "disabled",
        order: "disabled",
        identityUpload: "disabled",
        reasons: ["restricted category is permanently blocked"],
        missingRequirements: [],
        forbiddenActions: [
          "provider connection",
          "external search",
          "copy procurement condition",
          "purchase advice",
          "payment/order action",
          "identity upload"
        ],
        nextAllowedSteps: ["show restricted safety block only"],
        auditDraft: buildAuditDraft(providerCategory, "blocked", [], ["restricted category"], true),
        redacted: true
      });
    }

    miss("endpointAllowlist", "endpoint allowlist");
    miss("sandboxGate", "sandbox gate");
    miss("schemaGate", "schema gate");
    miss("sourceLabelGate", "source label gate");
    miss("priceIntegrityGate", "price integrity gate");

    if (credentialState.consentApproved !== true && credentialState.consentState !== "draft_ready") {
      missingRequirements.push("credential consent");
      reasons.push("credential consent missing");
    }
    if (credentialState.secureStorageImplementationReady !== true) {
      missingRequirements.push("secure storage implementation");
      reasons.push("secure storage implementation missing");
    }
    if (credentialState.realCredentialConnected !== true) {
      missingRequirements.push("real credential not connected");
      reasons.push("real credential not connected");
    }
    if (adapterState.readonlyAdapterApproved !== true && adapterState.adapterContractState !== "draft_ready") {
      missingRequirements.push("read-only adapter contract");
      reasons.push("read-only adapter contract missing");
    }
    if (manualReviewState.approved !== true) {
      missingRequirements.push("manual provider review");
      reasons.push("manual provider review missing");
    }

    if (includesFlag(featureFlags, "paymentRequested") || includesFlag(featureFlags, "orderRequested") || includesFlag(raw, "requestsPayment") || includesFlag(raw, "requestsOrder")) {
      forbiddenActions.push("payment/order action");
    }
    if (includesFlag(featureFlags, "identityUploadRequested") || includesFlag(raw, "requestsIdentityUpload")) {
      forbiddenActions.push("identity upload");
    }
    if (includesFlag(featureFlags, "realNetworkRequested") || includesFlag(raw, "requestsRealNetwork")) {
      forbiddenActions.push("real network requested");
    }
    if (includesFlag(featureFlags, "apiKeyPersistenceRequested") || includesFlag(raw, "requestsApiKeyPersistence")) {
      forbiddenActions.push("API key persistence requested");
    }

    const blocked = forbiddenActions.length > 0;
    const decision = blocked ? "blocked" : "no-go";
    nextAllowedSteps.push(
      "complete endpoint allowlist review",
      "complete sandbox gate review",
      "complete result schema gate review",
      "complete source label gate review",
      "complete price integrity gate review",
      "complete credential consent scope review",
      "complete manual provider review"
    );

    return clone({
      decisionEngineVersion: PROVIDER_CONNECTION_READINESS_DECISION_ENGINE_VERSION,
      providerCategory,
      decision,
      finalDecision: decision,
      decisionReason: blocked ? "forbidden capability requested" : "readiness gates incomplete",
      realProvider: "disabled",
      realNetwork: "disabled",
      realApiKey: "disabled",
      credentialStorage: {
        secureStorageImplementation: credentialState.secureStorageImplementationReady === true ? "ready" : "missing",
        realCredentialConnected: "no",
        credentialConsent: credentialState.consentApproved === true ? "approved" : (credentialState.consentState === "draft_ready" ? "draft-ready" : "missing"),
        readonlyAdapterContract: adapterState.adapterContractState === "draft_ready" ? "draft-ready" : "missing",
        flightAdapterV1: adapterState.flightAdapterV1State === "offline_fixture_ready" ? "offline fixture ready" : "not_started",
        endpointAllowlistEnforcement: adapterState.endpointAllowlistEnforcementState === "draft_ready" ? "draft-ready" : "missing",
        sandboxRealKeyDryRunGate: adapterState.sandboxRealKeyDryRunGateState === "draft_ready" ? "draft-ready" : "missing",
        sandboxResponseSchemaGate: adapterState.sandboxResponseSchemaGateState === "draft_ready" ? "draft-ready" : "missing",
        realProviderResultSchemaValidation: adapterState.realProviderResultSchemaValidationState === "draft_ready" ? "draft-ready" : "missing",
        providerResultSourceLabelGate: adapterState.providerResultSourceLabelGateState === "draft_ready" ? "draft-ready" : "missing",
        sandboxDryRunTransport: adapterState.sandboxDryRunTransport === "simulated_only" ? "simulated only" : "disabled",
        credentialPlaintextDisplay: "disabled",
        credentialExport: "disabled",
        finalDecision: decision
      },
      realEndpoint: "disabled",
      realPrice: "disabled",
      availability: "disabled",
      bookingUrl: "disabled",
      payment: "disabled",
      order: "disabled",
      identityUpload: "disabled",
      reasons: reasons.length ? reasons : ["all readiness gates must pass before provider connection"],
      missingRequirements,
      forbiddenActions,
      nextAllowedSteps,
      auditDraft: buildAuditDraft(providerCategory, decision, missingRequirements, forbiddenActions, true),
      redacted: true
    });
  }

  function buildAuditDraft(providerCategory, decision, missingRequirements, forbiddenActions, redacted) {
    return {
      eventType: "PROVIDER_CONNECTION_READINESS_CONSOLE_DRAFT",
      providerCategory: text(providerCategory),
      decision: text(decision),
      missingRequirements: list(missingRequirements),
      forbiddenActions: list(forbiddenActions),
      approvedProviderCount: 0,
      connectedProviderCount: 0,
      realProviderCallCount: 0,
      networkAttemptCount: 0,
      realApiKeyReadCount: 0,
      realEndpointConnectCount: 0,
      realPriceDisplayedCount: 0,
      realPriceReturnCount: 0,
      bookingUrlDisplayedCount: 0,
      bookingUrlReturnCount: 0,
      paymentAttemptCount: 0,
      orderAttemptCount: 0,
      identityUploadAttemptCount: 0,
      redacted: redacted === true
    };
  }

  function assertProviderConnectionReadinessDecisionSafe(decision) {
    const safe = decision && typeof decision === "object" ? decision : {};
    const audit = safe.auditDraft || {};
    if (!["no-go", "blocked", "review-required", "draft-only"].includes(safe.decision)) {
      throw new Error("provider connection readiness decision must stay no-go/blocked/review-only/draft-only");
    }
    if (safe.finalDecision && safe.finalDecision !== safe.decision) throw new Error("provider readiness finalDecision must match decision");
    for (const key of ["realProvider", "realNetwork", "realApiKey", "realEndpoint", "realPrice", "availability", "bookingUrl", "payment", "order", "identityUpload"]) {
      if (safe[key] !== "disabled") throw new Error("provider readiness decision must keep " + key + " disabled");
    }
    if (audit.realProviderCallCount !== 0) throw new Error("provider readiness audit must not call real provider");
    if (audit.networkAttemptCount !== 0) throw new Error("provider readiness audit must not use network");
    if (audit.realApiKeyReadCount !== 0) throw new Error("provider readiness audit must not read API key");
    if (audit.realEndpointConnectCount !== 0) throw new Error("provider readiness audit must not connect endpoint");
    if (audit.realPriceDisplayedCount !== 0) throw new Error("provider readiness audit must not display real price");
    if (audit.realPriceReturnCount !== 0) throw new Error("provider readiness audit must not return real price");
    if (audit.bookingUrlDisplayedCount !== 0) throw new Error("provider readiness audit must not display bookingUrl");
    if (audit.bookingUrlReturnCount !== 0) throw new Error("provider readiness audit must not return bookingUrl");
    if (audit.paymentAttemptCount !== 0) throw new Error("provider readiness audit must not attempt payment");
    if (audit.orderAttemptCount !== 0) throw new Error("provider readiness audit must not submit order");
    if (audit.identityUploadAttemptCount !== 0) throw new Error("provider readiness audit must not upload identity");
    if (audit.redacted !== true || safe.redacted !== true) throw new Error("provider readiness decision must stay redacted");
    return true;
  }

  window.WeishanProviderConnectionReadinessDecisionEngine = {
    PROVIDER_CONNECTION_READINESS_DECISION_ENGINE_VERSION,
    evaluateProviderConnectionReadiness,
    assertProviderConnectionReadinessDecisionSafe
  };
})();
