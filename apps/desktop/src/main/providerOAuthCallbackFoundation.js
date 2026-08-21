"use strict";

const crypto = require("crypto");

const PROVIDER_OAUTH_CALLBACK_FOUNDATION_VERSION = "1.0.0";
const PROVIDER_OAUTH_CALLBACK_CLASSIFICATION = "PROVIDER_OAUTH_CALLBACK_FOUNDATION";
const DEFAULT_TRANSACTION_TTL_MS = 10 * 60 * 1000;
const MAX_CALLBACK_URL_LENGTH = 4096;
const MAX_TOKEN_RESPONSE_BYTES = 64 * 1024;
const IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9_-]{1,63}$/;
const APPLICATION_PATTERN = /^[^\u0000-\u001f\u007f]{2,120}$/;
const AUTHORIZATION_CODE_PATTERN = /^[A-Za-z0-9._~+\-/=]{8,2048}$/;

const DAISYCON_OAUTH_POLICY = Object.freeze({
  provider:"daisycon",
  environment:"production",
  application:"Weishan Global Commerce",
  authorizationEndpoint:"https://login.daisycon.com/oauth/authorize",
  tokenEndpoint:"https://login.daisycon.com/oauth/access-token",
  redirectUri:"https://login.daisycon.com/oauth/cli",
  pkceRequired:true,
  pkceMethod:"S256",
  stateRequired:true,
  credentialDescriptor:Object.freeze({
    provider:"daisycon",
    environment:"production",
    application:"Weishan Global Commerce"
  }),
  clientSecretCredentialType:"client_secret",
  refreshTokenCredentialType:"refresh_token",
  productionTraffic:false,
  providerOAuthExecution:false,
  redacted:true
});

function text(value) {
  return String(value == null ? "" : value).trim();
}

function safeError(code, stage) {
  return {
    ok:false,
    classification:PROVIDER_OAUTH_CALLBACK_CLASSIFICATION,
    stage:text(stage || "oauth"),
    error:{
      code:text(code || "PROVIDER_OAUTH_FAILED").slice(0, 80),
      redacted:true
    },
    executionGate:"CLOSED",
    authorizesExecution:false,
    providerOAuthExecution:false,
    productionTraffic:false,
    productionAffected:false,
    tokenPersisted:false,
    rawResponsePersisted:false,
    redacted:true
  };
}

function base64Url(buffer) {
  return Buffer.from(buffer).toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function randomBase64Url(bytes) {
  return base64Url(crypto.randomBytes(bytes));
}

function sha256Base64Url(value) {
  return base64Url(crypto.createHash("sha256").update(String(value), "utf8").digest());
}

function cleanIdentifier(value) {
  const cleaned = text(value).toLowerCase();
  return IDENTIFIER_PATTERN.test(cleaned) ? cleaned : "";
}

function cleanApplication(value) {
  const cleaned = text(value);
  return APPLICATION_PATTERN.test(cleaned) ? cleaned : "";
}

function cleanClientId(value) {
  const cleaned = text(value);
  if (cleaned.length < 4 || cleaned.length > 240) return "";
  if (/[\s\u0000-\u001f\u007f]/.test(cleaned)) return "";
  return cleaned;
}

function normalizeEndpoint(value, allowedProtocols) {
  try {
    const parsed = new URL(text(value));
    parsed.username = "";
    parsed.password = "";
    parsed.hash = "";
    if (!allowedProtocols.includes(parsed.protocol)) return "";
    if (!parsed.hostname || /[\s\u0000-\u001f\u007f]/.test(parsed.hostname)) return "";
    return parsed.toString();
  } catch (_) {
    return "";
  }
}

function normalizeRedirectUri(value) {
  try {
    const parsed = new URL(text(value));
    parsed.username = "";
    parsed.password = "";
    parsed.hash = "";
    const host = parsed.hostname.toLowerCase();
    const isHttps = parsed.protocol === "https:";
    const isLoopback = parsed.protocol === "http:" && (host === "127.0.0.1" || host === "localhost" || host === "[::1]");
    const isCustomProtocol = /^[a-z][a-z0-9+.-]*:$/.test(parsed.protocol) && !["http:", "https:", "file:", "javascript:", "data:"].includes(parsed.protocol);
    if (!isHttps && !isLoopback && !isCustomProtocol) return "";
    if (parsed.href.length > 512) return "";
    return parsed.toString();
  } catch (_) {
    return "";
  }
}

function sameRedirectUri(left, right) {
  return normalizeRedirectUri(left) === normalizeRedirectUri(right);
}

function normalizePolicy(rawPolicy) {
  const provider = cleanIdentifier(rawPolicy && rawPolicy.provider);
  const environment = cleanIdentifier(rawPolicy && rawPolicy.environment);
  const application = cleanApplication(rawPolicy && rawPolicy.application);
  const authorizationEndpoint = normalizeEndpoint(rawPolicy && rawPolicy.authorizationEndpoint, ["https:"]);
  const tokenEndpoint = normalizeEndpoint(rawPolicy && rawPolicy.tokenEndpoint, ["https:"]);
  const redirectUri = normalizeRedirectUri(rawPolicy && rawPolicy.redirectUri);
  const credentialDescriptor = rawPolicy && rawPolicy.credentialDescriptor || {};
  const descriptorProvider = cleanIdentifier(credentialDescriptor.provider);
  const descriptorEnvironment = cleanIdentifier(credentialDescriptor.environment);
  const descriptorApplication = cleanApplication(credentialDescriptor.application);
  const clientSecretCredentialType = cleanIdentifier(rawPolicy && rawPolicy.clientSecretCredentialType || "client_secret");
  const refreshTokenCredentialType = cleanIdentifier(rawPolicy && rawPolicy.refreshTokenCredentialType || "refresh_token");
  if (!provider || !environment || !application || !authorizationEndpoint || !tokenEndpoint || !redirectUri
    || descriptorProvider !== provider || descriptorEnvironment !== environment || descriptorApplication !== application
    || !clientSecretCredentialType || !refreshTokenCredentialType) {
    return null;
  }
  return Object.freeze({
    provider,
    environment,
    application,
    authorizationEndpoint,
    tokenEndpoint,
    redirectUri,
    pkceRequired:rawPolicy.pkceRequired !== false,
    pkceMethod:rawPolicy.pkceMethod === "plain" ? "plain" : "S256",
    stateRequired:rawPolicy.stateRequired !== false,
    scopes:Array.isArray(rawPolicy.scopes) ? rawPolicy.scopes.map(text).filter(Boolean).slice(0, 20) : [],
    credentialDescriptor:Object.freeze({ provider, environment, application }),
    clientSecretCredentialType,
    refreshTokenCredentialType,
    productionTraffic:false,
    providerOAuthExecution:false,
    redacted:true
  });
}

function parseCallbackUrl(value) {
  const raw = text(value);
  if (!raw || raw.length > MAX_CALLBACK_URL_LENGTH) return null;
  try {
    const parsed = new URL(raw);
    parsed.username = "";
    parsed.password = "";
    parsed.hash = "";
    return parsed;
  } catch (_) {
    return null;
  }
}

async function readJsonResponse(response, maximumBytes) {
  const body = response && typeof response.text === "function" ? await response.text() : "";
  if (Buffer.byteLength(String(body || ""), "utf8") > maximumBytes) return { ok:false, error:"TOKEN_RESPONSE_TOO_LARGE", status:Number(response && response.status || 0) };
  let payload;
  try {
    payload = body ? JSON.parse(body) : {};
  } catch (_) {
    return { ok:false, error:"TOKEN_RESPONSE_INVALID_JSON", status:Number(response && response.status || 0) };
  }
  if (!response || response.ok !== true) return { ok:false, error:"TOKEN_HTTP_ERROR", status:Number(response && response.status || 0) };
  return { ok:true, value:payload, status:Number(response.status || 0) };
}

function createProviderOAuthCallbackFoundation(options = {}) {
  const policies = new Map();
  const sourcePolicies = Array.isArray(options.policies) && options.policies.length ? options.policies : [DAISYCON_OAUTH_POLICY];
  sourcePolicies.forEach((policy) => {
    const normalized = normalizePolicy(policy);
    if (normalized) policies.set(normalized.provider, normalized);
  });
  const transactions = new Map();
  const now = typeof options.now === "function" ? options.now : () => Date.now();
  const ttlMs = Math.max(30 * 1000, Math.min(30 * 60 * 1000, Number(options.ttlMs || DEFAULT_TRANSACTION_TTL_MS)));

  function getPolicy(provider) {
    return policies.get(cleanIdentifier(provider)) || null;
  }

  function listPolicies() {
    return Array.from(policies.values()).map((policy) => ({
      provider:policy.provider,
      environment:policy.environment,
      application:policy.application,
      authorizationEndpoint:policy.authorizationEndpoint,
      tokenEndpoint:policy.tokenEndpoint,
      redirectUri:policy.redirectUri,
      pkceRequired:policy.pkceRequired,
      stateRequired:policy.stateRequired,
      credentialDescriptor:policy.credentialDescriptor,
      executionGate:"CLOSED",
      authorizesExecution:false,
      providerOAuthExecution:false,
      productionTraffic:false,
      redacted:true
    }));
  }

  function beginAuthorization(input = {}) {
    const policy = getPolicy(input.provider);
    if (!policy) return safeError("UNAPPROVED_PROVIDER", "begin");
    const clientId = cleanClientId(input.clientId);
    if (!clientId) return safeError("INVALID_CLIENT_ID", "begin");
    if (input.redirectUri && !sameRedirectUri(input.redirectUri, policy.redirectUri)) {
      return safeError("UNAPPROVED_REDIRECT_URI", "begin");
    }
    const state = randomBase64Url(32);
    const codeVerifier = randomBase64Url(64).slice(0, 96);
    const codeChallenge = policy.pkceMethod === "plain" ? codeVerifier : sha256Base64Url(codeVerifier);
    const transactionId = randomBase64Url(24);
    const startedAt = now();
    const expiresAt = startedAt + ttlMs;
    const authorizationUrl = new URL(policy.authorizationEndpoint);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("client_id", clientId);
    authorizationUrl.searchParams.set("redirect_uri", policy.redirectUri);
    authorizationUrl.searchParams.set("state", state);
    authorizationUrl.searchParams.set("code_challenge", codeChallenge);
    if (policy.pkceMethod === "S256") authorizationUrl.searchParams.set("code_challenge_method", "S256");
    if (policy.scopes.length) authorizationUrl.searchParams.set("scope", policy.scopes.join(" "));
    transactions.set(transactionId, {
      transactionId,
      provider:policy.provider,
      clientId,
      state,
      codeVerifier,
      codeChallenge,
      startedAt,
      expiresAt,
      status:"authorization_started",
      code:"",
      callbackConsumed:false,
      tokenExchangeAttempted:false
    });
    return {
      ok:true,
      classification:PROVIDER_OAUTH_CALLBACK_CLASSIFICATION,
      transactionId,
      provider:policy.provider,
      redirectUri:policy.redirectUri,
      authorizationUrl:authorizationUrl.toString(),
      stateRequired:policy.stateRequired,
      pkceRequired:policy.pkceRequired,
      pkceMethod:policy.pkceMethod,
      expiresAt,
      executionGate:"CLOSED",
      authorizesExecution:false,
      providerOAuthExecution:false,
      productionTraffic:false,
      productionAffected:false,
      redacted:true
    };
  }

  function receiveCallback(input = {}) {
    const policy = getPolicy(input.provider);
    if (!policy) return safeError("UNAPPROVED_PROVIDER", "callback");
    const parsed = parseCallbackUrl(input.callbackUrl);
    if (!parsed) return safeError("INVALID_CALLBACK_URL", "callback");
    if (!sameRedirectUri(parsed.origin + parsed.pathname, policy.redirectUri)) return safeError("REDIRECT_URI_MISMATCH", "callback");
    if (parsed.searchParams.has("error")) return safeError("OAUTH_PROVIDER_ERROR", "callback");
    const state = text(parsed.searchParams.get("state"));
    if (!state) return safeError("MISSING_STATE", "callback");
    const code = text(parsed.searchParams.get("code"));
    if (!AUTHORIZATION_CODE_PATTERN.test(code)) return safeError("MALFORMED_CODE", "callback");
    const transaction = Array.from(transactions.values()).find((item) => item.provider === policy.provider && item.state === state);
    if (!transaction) return safeError("STATE_MISMATCH", "callback");
    if (now() > transaction.expiresAt) {
      transaction.status = "expired";
      transaction.code = "";
      return safeError("OAUTH_TRANSACTION_EXPIRED", "callback");
    }
    if (transaction.callbackConsumed || transaction.status === "code_received" || transaction.status === "token_exchanged") {
      return safeError("AUTHORIZATION_CODE_ALREADY_CONSUMED", "callback");
    }
    transaction.code = code;
    transaction.callbackConsumed = true;
    transaction.status = "code_received";
    return {
      ok:true,
      classification:PROVIDER_OAUTH_CALLBACK_CLASSIFICATION,
      transactionId:transaction.transactionId,
      provider:policy.provider,
      codeReceived:true,
      stateValidated:true,
      redirectValidated:true,
      codeConsumed:true,
      executionGate:"CLOSED",
      authorizesExecution:false,
      providerOAuthExecution:false,
      productionTraffic:false,
      productionAffected:false,
      redacted:true
    };
  }

  function cancelTransaction(transactionId) {
    const transaction = transactions.get(text(transactionId));
    if (!transaction) return safeError("OAUTH_TRANSACTION_NOT_FOUND", "cancel");
    transaction.status = "cancelled";
    transaction.code = "";
    transaction.codeVerifier = "";
    return {
      ok:true,
      classification:PROVIDER_OAUTH_CALLBACK_CLASSIFICATION,
      transactionId:transaction.transactionId,
      status:"cancelled",
      executionGate:"CLOSED",
      authorizesExecution:false,
      providerOAuthExecution:false,
      productionTraffic:false,
      redacted:true
    };
  }

  async function exchangeToken(input = {}) {
    const transaction = transactions.get(text(input.transactionId));
    if (!transaction) return safeError("OAUTH_TRANSACTION_NOT_FOUND", "token");
    const policy = getPolicy(transaction.provider);
    if (!policy) return safeError("UNAPPROVED_PROVIDER", "token");
    if (transaction.status === "cancelled") return safeError("OAUTH_TRANSACTION_CANCELLED", "token");
    if (transaction.status === "expired" || now() > transaction.expiresAt) {
      transaction.status = "expired";
      transaction.code = "";
      return safeError("OAUTH_TRANSACTION_EXPIRED", "token");
    }
    if (transaction.status !== "code_received" || !transaction.code) return safeError("AUTHORIZATION_CODE_REQUIRED", "token");
    if (transaction.tokenExchangeAttempted) return safeError("AUTHORIZATION_CODE_ALREADY_CONSUMED", "token");
    const tokenTransport = input.tokenTransport;
    if (typeof tokenTransport !== "function") return safeError("TOKEN_TRANSPORT_UNAVAILABLE", "token");
    const credentialStore = input.credentialStore;
    if (!credentialStore || !credentialStore.mainProcess || typeof credentialStore.mainProcess.withCredentialBundle !== "function") {
      return safeError("CREDENTIAL_STORE_UNAVAILABLE", "token");
    }
    transaction.tokenExchangeAttempted = true;
    const persistRefreshToken = input.persistRefreshToken === true;
    const runtimeResult = await credentialStore.mainProcess.withCredentialBundle(
      policy.credentialDescriptor,
      [policy.clientSecretCredentialType],
      async (credentials) => {
        const body = new URLSearchParams({
          grant_type:"authorization_code",
          redirect_uri:policy.redirectUri,
          client_id:transaction.clientId,
          client_secret:credentials[policy.clientSecretCredentialType],
          code:transaction.code,
          code_verifier:transaction.codeVerifier
        }).toString();
        const response = await tokenTransport(policy.tokenEndpoint, {
          method:"POST",
          headers:{
            Accept:"application/json",
            "Content-Type":"application/x-www-form-urlencoded"
          },
          body,
          redirect:"error"
        });
        const payload = await readJsonResponse(response, Number(input.maximumBytes || MAX_TOKEN_RESPONSE_BYTES));
        if (!payload.ok) {
          return {
            ok:false,
            error:payload.error,
            status:payload.status,
            accessTokenReceived:false,
            refreshTokenReceived:false,
            refreshTokenPersisted:false,
            redacted:true
          };
        }
        const accessToken = text(payload.value && payload.value.access_token);
        const refreshToken = text(payload.value && payload.value.refresh_token);
        let refreshTokenPersisted = false;
        if (persistRefreshToken && refreshToken && credentialStore.mainProcess && typeof credentialStore.mainProcess.putCredentialBundle === "function") {
          const stored = credentialStore.mainProcess.putCredentialBundle(
            policy.credentialDescriptor,
            { [policy.refreshTokenCredentialType]:refreshToken },
            "main_process_runtime"
          );
          refreshTokenPersisted = stored && stored.ok === true;
        }
        return {
          ok:true,
          status:payload.status,
          accessTokenReceived:!!accessToken,
          refreshTokenReceived:!!refreshToken,
          accessTokenPersisted:false,
          refreshTokenPersisted,
          tokenType:text(payload.value && payload.value.token_type).slice(0, 40) || "unknown",
          expiresIn:Number(payload.value && payload.value.expires_in || 0),
          rawResponsePersisted:false,
          redacted:true
        };
      }
    );
    transaction.code = "";
    transaction.codeVerifier = "";
    if (!runtimeResult || runtimeResult.ok !== true) {
      transaction.status = "token_failed";
      return safeError(runtimeResult && runtimeResult.error || "TOKEN_EXCHANGE_FAILED", "token");
    }
    if (!runtimeResult.value || runtimeResult.value.ok !== true) {
      transaction.status = "token_failed";
      return Object.assign(safeError(runtimeResult.value && runtimeResult.value.error || "TOKEN_EXCHANGE_FAILED", "token"), {
        status:runtimeResult.value && runtimeResult.value.status || 0
      });
    }
    transaction.status = "token_exchanged";
    return {
      ok:true,
      classification:PROVIDER_OAUTH_CALLBACK_CLASSIFICATION,
      provider:policy.provider,
      oauth:"PASS",
      accessTokenReceived:runtimeResult.value.accessTokenReceived === true,
      refreshTokenReceived:runtimeResult.value.refreshTokenReceived === true,
      accessTokenPersisted:false,
      refreshTokenPersisted:runtimeResult.value.refreshTokenPersisted === true,
      tokenPersisted:runtimeResult.value.refreshTokenPersisted === true,
      rawResponsePersisted:false,
      tokenType:runtimeResult.value.tokenType,
      expiresIn:runtimeResult.value.expiresIn,
      executionGate:"CLOSED",
      authorizesExecution:false,
      providerOAuthExecution:false,
      productionTraffic:false,
      productionAffected:false,
      redacted:true
    };
  }

  return Object.freeze({
    version:PROVIDER_OAUTH_CALLBACK_FOUNDATION_VERSION,
    listPolicies,
    beginAuthorization,
    receiveCallback,
    exchangeToken,
    cancelTransaction
  });
}

module.exports = {
  PROVIDER_OAUTH_CALLBACK_FOUNDATION_VERSION,
  PROVIDER_OAUTH_CALLBACK_CLASSIFICATION,
  DAISYCON_OAUTH_POLICY,
  createProviderOAuthCallbackFoundation,
  _testOnly:{
    normalizePolicy,
    normalizeRedirectUri,
    sha256Base64Url
  }
};
