"use strict";

const EBAY_SANDBOX_READONLY_VALIDATOR_VERSION = "1.0.0";
const EBAY_SANDBOX_CLASSIFICATION = "SANDBOX_TEST_DATA";
const EBAY_SANDBOX_OAUTH_ENDPOINT = "https://api.sandbox.ebay.com/identity/v1/oauth2/token";
const EBAY_SANDBOX_BROWSE_ENDPOINT = "https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search";
const EBAY_BROWSE_SCOPE = "https://api.ebay.com/oauth/api_scope";
const EBAY_CREDENTIAL_DESCRIPTOR = Object.freeze({
  provider:"ebay",
  environment:"sandbox",
  application:"Weishan Global Commerce"
});

function text(value) {
  return String(value == null ? "" : value).trim();
}

function cleanClientId(value) {
  const clientId = text(value);
  if (clientId.length < 8 || clientId.length > 200) return "";
  if (/[:\s\u0000-\u001f\u007f]/.test(clientId)) return "";
  return clientId;
}

function defaultFetchImpl() {
  return typeof fetch === "function" ? fetch.bind(globalThis) : null;
}

function positiveInteger(value, fallback, minimum, maximum) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(minimum, Math.min(maximum, Math.round(parsed)));
}

function safeFailure(stage, code, status, requestCount) {
  return {
    ok:false,
    classification:EBAY_SANDBOX_CLASSIFICATION,
    oauth:stage === "oauth" ? "FAIL" : "PASS",
    browse:"FAIL",
    sandboxItemReturned:false,
    priceCurrencyReturned:false,
    officialUrlReturned:false,
    requestCount:Number(requestCount || 0),
    error:{
      stage:stage === "browse" ? "browse" : "oauth",
      code:text(code || "SANDBOX_VALIDATION_FAILED").slice(0, 80),
      status:Number(status || 0),
      redacted:true
    },
    executionGate:"CLOSED",
    authorizesExecution:false,
    executed:false,
    productionTraffic:false,
    productionAffected:false,
    transactionalCapabilities:false,
    redacted:true
  };
}

function parseOfficialItemWebUrl(value) {
  try {
    const parsed = new URL(text(value));
    const hostname = parsed.hostname.toLowerCase();
    if (parsed.protocol !== "https:" || !(hostname === "ebay.com" || hostname.endsWith(".ebay.com"))) return "";
    parsed.username = "";
    parsed.password = "";
    parsed.hash = "";
    return parsed.toString();
  } catch (_) {
    return "";
  }
}

function availabilityEvidence(item) {
  const buyingOptions = Array.isArray(item && item.buyingOptions)
    ? item.buyingOptions.map(text).filter(Boolean).slice(0, 8)
    : [];
  const itemEndDate = text(item && item.itemEndDate);
  let status = "UNKNOWN";
  if (itemEndDate && !Number.isNaN(Date.parse(itemEndDate)) && Date.parse(itemEndDate) <= Date.now()) status = "ENDED";
  else if (buyingOptions.length) status = "OFFERED_BY_SANDBOX_LISTING";
  return {
    status,
    buyingOptions,
    itemEndDate:itemEndDate || null,
    authoritativeCurrentStock:false,
    redacted:true
  };
}

function normalizeSandboxItem(payload) {
  const itemSummaries = Array.isArray(payload && payload.itemSummaries) ? payload.itemSummaries : [];
  const item = itemSummaries[0] && typeof itemSummaries[0] === "object" ? itemSummaries[0] : null;
  if (!item) return null;
  const price = item.price && typeof item.price === "object" ? item.price : {};
  const value = text(price.value);
  const currency = text(price.currency).toUpperCase();
  const officialItemWebUrl = parseOfficialItemWebUrl(item.itemWebUrl);
  return {
    classification:EBAY_SANDBOX_CLASSIFICATION,
    provider:"ebay",
    environment:"sandbox",
    itemId:text(item.itemId) || null,
    title:text(item.title) || null,
    price:value && /^[0-9]+(?:\.[0-9]+)?$/.test(value) ? { value, currency:currency || null } : null,
    officialItemWebUrl:officialItemWebUrl || null,
    availability:availabilityEvidence(item),
    realCurrentMarketPrice:false,
    purchasableAuthority:false,
    redacted:true
  };
}

async function readJsonResponse(response, maximumBytes) {
  const body = response && typeof response.text === "function" ? await response.text() : "";
  if (Buffer.byteLength(String(body || ""), "utf8") > maximumBytes) {
    return { ok:false, error:"RESPONSE_TOO_LARGE", status:Number(response && response.status || 0) };
  }
  let parsed;
  try {
    parsed = body ? JSON.parse(body) : {};
  } catch (_) {
    return { ok:false, error:"INVALID_JSON_RESPONSE", status:Number(response && response.status || 0) };
  }
  if (!response || response.ok !== true) {
    return { ok:false, error:"HTTP_ERROR", status:Number(response && response.status || 0) };
  }
  return { ok:true, value:parsed, status:Number(response.status || 0) };
}

async function fetchWithTimeout(fetchImpl, url, init, timeoutMs) {
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  let timer = null;
  if (controller) timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, Object.assign({}, init, {
      signal:controller ? controller.signal : undefined,
      redirect:"error"
    }));
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function createEbaySandboxReadonlyValidator(options = {}) {
  const credentialStore = options.credentialStore;
  const fetchImpl = options.fetchImpl || defaultFetchImpl();
  const timeoutMs = positiveInteger(options.timeoutMs, 8000, 1000, 30000);
  const maximumBytes = positiveInteger(options.maximumBytes, 512 * 1024, 1024, 1024 * 1024);

  async function validate(input = {}) {
    const clientId = cleanClientId(input.clientId);
    if (!clientId) return safeFailure("oauth", "INVALID_CLIENT_ID", 0, 0);
    if (!credentialStore || !credentialStore.mainProcess || typeof credentialStore.mainProcess.withCredentialBundle !== "function") {
      return safeFailure("oauth", "CREDENTIAL_STORE_UNAVAILABLE", 0, 0);
    }
    if (!fetchImpl) return safeFailure("oauth", "TRANSPORT_UNAVAILABLE", 0, 0);

    const runtimeResult = await credentialStore.mainProcess.withCredentialBundle(
      EBAY_CREDENTIAL_DESCRIPTOR,
      ["client_secret"],
      async (credentials) => {
        let basicAuthorization = "";
        let applicationToken = "";
        let requestCount = 0;
        try {
          basicAuthorization = "Basic " + Buffer.from(clientId + ":" + credentials.client_secret, "utf8").toString("base64");
          requestCount += 1;
          const oauthResponse = await fetchWithTimeout(fetchImpl, EBAY_SANDBOX_OAUTH_ENDPOINT, {
            method:"POST",
            headers:{
              Accept:"application/json",
              Authorization:basicAuthorization,
              "Content-Type":"application/x-www-form-urlencoded"
            },
            body:new URLSearchParams({
              grant_type:"client_credentials",
              scope:EBAY_BROWSE_SCOPE
            }).toString()
          }, timeoutMs);
          const oauthPayload = await readJsonResponse(oauthResponse, maximumBytes);
          if (!oauthPayload.ok) return safeFailure("oauth", oauthPayload.error, oauthPayload.status, requestCount);
          applicationToken = text(oauthPayload.value && oauthPayload.value.access_token);
          if (!applicationToken || applicationToken.length > 8192) {
            return safeFailure("oauth", "OAUTH_TOKEN_RESPONSE_INVALID", oauthPayload.status, requestCount);
          }

          const query = new URLSearchParams({ q:text(input.query) || "drone", limit:"1" });
          requestCount += 1;
          const browseResponse = await fetchWithTimeout(fetchImpl, EBAY_SANDBOX_BROWSE_ENDPOINT + "?" + query.toString(), {
            method:"GET",
            headers:{
              Accept:"application/json",
              Authorization:"Bearer " + applicationToken,
              "X-EBAY-C-MARKETPLACE-ID":"EBAY_US"
            }
          }, timeoutMs);
          const browsePayload = await readJsonResponse(browseResponse, maximumBytes);
          if (!browsePayload.ok) return safeFailure("browse", browsePayload.error, browsePayload.status, requestCount);
          const item = normalizeSandboxItem(browsePayload.value);
          return {
            ok:true,
            classification:EBAY_SANDBOX_CLASSIFICATION,
            oauth:"PASS",
            browse:"PASS",
            sandboxItemReturned:!!item,
            priceCurrencyReturned:!!(item && item.price && item.price.value && item.price.currency),
            officialUrlReturned:!!(item && item.officialItemWebUrl),
            item,
            requestCount,
            tokenPersisted:false,
            rawResponsePersisted:false,
            executionGate:"CLOSED",
            authorizesExecution:false,
            executed:false,
            productionTraffic:false,
            productionAffected:false,
            transactionalCapabilities:false,
            redacted:true
          };
        } catch (error) {
          const stage = requestCount > 1 ? "browse" : "oauth";
          const code = error && error.name === "AbortError" ? "REQUEST_TIMEOUT" : "NETWORK_ERROR";
          return safeFailure(stage, code, 0, requestCount);
        } finally {
          basicAuthorization = "";
          applicationToken = "";
        }
      }
    );

    if (!runtimeResult || runtimeResult.ok !== true) {
      return safeFailure("oauth", runtimeResult && runtimeResult.error || "CREDENTIAL_RUNTIME_FAILED", 0, 0);
    }
    return runtimeResult.value;
  }

  return Object.freeze({
    version:EBAY_SANDBOX_READONLY_VALIDATOR_VERSION,
    validate
  });
}

module.exports = {
  EBAY_SANDBOX_READONLY_VALIDATOR_VERSION,
  EBAY_SANDBOX_CLASSIFICATION,
  EBAY_SANDBOX_OAUTH_ENDPOINT,
  EBAY_SANDBOX_BROWSE_ENDPOINT,
  EBAY_CREDENTIAL_DESCRIPTOR,
  createEbaySandboxReadonlyValidator
};
