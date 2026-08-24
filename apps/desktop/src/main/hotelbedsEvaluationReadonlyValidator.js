"use strict";

const crypto = require("node:crypto");

const HOTELBEDS_EVALUATION_READONLY_VALIDATOR_VERSION = "1.0.0";
const HOTELBEDS_EVALUATION_CLASSIFICATION = "SANDBOX_TEST_DATA";
const HOTELBEDS_EVALUATION_AVAILABILITY_ENDPOINT = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
const HOTELBEDS_CREDENTIAL_DESCRIPTOR = Object.freeze({
  provider:"hotelbeds",
  environment:"evaluation",
  application:"Weishan"
});

function text(value) {
  return String(value == null ? "" : value).trim();
}

function cleanApiKey(value) {
  const apiKey = text(value);
  if (apiKey.length < 8 || apiKey.length > 256) return "";
  if (/[\s:\u0000-\u001f\u007f]/.test(apiKey)) return "";
  return apiKey;
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
    classification:HOTELBEDS_EVALUATION_CLASSIFICATION,
    availability:"FAIL",
    hotelReturned:false,
    rateReturned:false,
    priceCurrencyReturned:false,
    cancellationReturned:false,
    requestCount:Number(requestCount || 0),
    error:{
      stage:text(stage || "availability").slice(0, 40),
      code:text(code || "HOTELBEDS_EVALUATION_VALIDATION_FAILED").slice(0, 80),
      status:Number(status || 0),
      redacted:true
    },
    executionGate:"CLOSED",
    authorizesExecution:false,
    executed:false,
    productionTraffic:false,
    productionAffected:false,
    transactionalCapabilities:false,
    booking:false,
    order:false,
    payment:false,
    redacted:true
  };
}

function isoDate(daysFromNow) {
  const now = new Date();
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysFromNow));
  return date.toISOString().slice(0, 10);
}

function createDefaultAvailabilityRequest() {
  return {
    stay:{
      checkIn:isoDate(60),
      checkOut:isoDate(61)
    },
    occupancies:[{
      rooms:1,
      adults:2,
      children:0
    }],
    hotels:{
      hotel:[3424, 168]
    }
  };
}

function xSignature(apiKey, secret, timestampSeconds) {
  return crypto.createHash("sha256")
    .update(String(apiKey) + String(secret) + String(timestampSeconds))
    .digest("hex");
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

function numberText(value) {
  const candidate = text(value);
  return /^[0-9]+(?:\.[0-9]+)?$/.test(candidate) ? candidate : "";
}

function findFirstRate(payload) {
  const hotels = payload && payload.hotels && Array.isArray(payload.hotels.hotels) ? payload.hotels.hotels : [];
  for (const hotel of hotels) {
    const rooms = Array.isArray(hotel && hotel.rooms) ? hotel.rooms : [];
    for (const room of rooms) {
      const rates = Array.isArray(room && room.rates) ? room.rates : [];
      for (const rate of rates) {
        return { hotel, room, rate };
      }
    }
  }
  return null;
}

function normalizeAvailabilityEvidence(payload, request, observedAt) {
  const match = findFirstRate(payload);
  if (!match) {
    return {
      hotelReturned:false,
      rateReturned:false,
      priceCurrencyReturned:false,
      cancellationReturned:false,
      evidence:null
    };
  }
  const price = numberText(match.rate.net || match.rate.sellingRate || match.rate.hotelSellingRate);
  const currency = text(match.rate.currency).toUpperCase();
  const cancellationPolicies = Array.isArray(match.rate.cancellationPolicies) ? match.rate.cancellationPolicies : [];
  const stayContextValidated = !!(request.stay && request.stay.checkIn && request.stay.checkOut);
  const propertyIdentityValidated = match.hotel.code != null || !!text(match.hotel.name);
  const roomRateIdentityValidated = !!(text(match.room.code) || text(match.room.name) || text(match.rate.rateKey));
  return {
    hotelReturned:true,
    rateReturned:true,
    priceCurrencyReturned:!!(price && currency),
    cancellationReturned:cancellationPolicies.length > 0,
    evidence:{
      provider:"hotelbeds",
      environment:"evaluation",
      classification:HOTELBEDS_EVALUATION_CLASSIFICATION,
      request:{
        checkIn:request.stay && request.stay.checkIn || null,
        checkOut:request.stay && request.stay.checkOut || null,
        occupancy:Array.isArray(request.occupancies) ? request.occupancies[0] : null,
        hotelCount:Array.isArray(request.hotels && request.hotels.hotel) ? request.hotels.hotel.length : 0
      },
      hotel:{
        code:match.hotel.code == null ? null : String(match.hotel.code),
        name:text(match.hotel.name) || null,
        destinationCode:text(match.hotel.destinationCode) || null
      },
      room:{
        code:text(match.room.code) || null,
        name:text(match.room.name) || null
      },
      rate:{
        rateType:text(match.rate.rateType) || null,
        rateKeyReturned:!!text(match.rate.rateKey),
        boardCode:text(match.rate.boardCode) || null,
        boardName:text(match.rate.boardName) || null,
        paymentType:text(match.rate.paymentType) || null,
        price:price ? { value:price, currency } : null,
        cancellationPolicyReturned:cancellationPolicies.length > 0
      },
      priceTruth:{
        domain:"HOTEL",
        provider:"hotelbeds",
        environment:"evaluation",
        sourceType:"EVALUATION",
        dataClass:HOTELBEDS_EVALUATION_CLASSIFICATION,
        propertyIdentityValidated,
        stayContextValidated,
        roomRateIdentityValidated,
        priceCurrencyValidated:!!(price && currency),
        priceBasis:"TOTAL_STAY",
        taxFeeBasis:"PROVIDER_EVALUATION_RESPONSE_SEMANTICS",
        availabilityValidated:true,
        cancellationSemanticsReturned:cancellationPolicies.length > 0,
        providerHandoffCapability:"NOT_VALIDATED_IN_EVALUATION_AVAILABILITY_RESPONSE",
        publicBetaEligible:false,
        realCurrentMarketPrice:false,
        productionRate:false,
        reason:"Evaluation endpoint data is controlled validation evidence only and cannot be presented as public live hotel pricing."
      },
      availability:"AVAILABLE_EVALUATION_RATE_RETURNED",
      observedAt,
      realCurrentMarketPrice:false,
      evaluationData:true,
      rawResponsePersisted:false,
      redacted:true
    }
  };
}

function createHotelbedsEvaluationReadonlyValidator(options = {}) {
  const credentialStore = options.credentialStore;
  const fetchImpl = options.fetchImpl || defaultFetchImpl();
  const timeoutMs = positiveInteger(options.timeoutMs, 10000, 1000, 30000);
  const maximumBytes = positiveInteger(options.maximumBytes, 1024 * 1024, 1024, 2 * 1024 * 1024);
  const nowSeconds = typeof options.nowSeconds === "function" ? options.nowSeconds : () => Math.floor(Date.now() / 1000);
  const nowIso = typeof options.nowIso === "function" ? options.nowIso : () => new Date().toISOString();

  async function validate(input = {}) {
    if (!credentialStore || !credentialStore.mainProcess || typeof credentialStore.mainProcess.withCredentialBundle !== "function") {
      return safeFailure("credential", "CREDENTIAL_STORE_UNAVAILABLE", 0, 0);
    }
    if (!credentialStore.mainProcess.getProviderCredentialIdentifierForMainProcess) {
      return safeFailure("credential", "IDENTIFIER_BINDING_UNAVAILABLE", 0, 0);
    }
    if (!fetchImpl) return safeFailure("transport", "TRANSPORT_UNAVAILABLE", 0, 0);
    const identifier = credentialStore.mainProcess.getProviderCredentialIdentifierForMainProcess(HOTELBEDS_CREDENTIAL_DESCRIPTOR, "api_key");
    if (!identifier || identifier.ok !== true) return safeFailure("credential", identifier && identifier.error || "API_KEY_IDENTIFIER_MISSING", 0, 0);
    const apiKey = cleanApiKey(identifier.value);
    if (!apiKey) return safeFailure("credential", "INVALID_API_KEY_IDENTIFIER", 0, 0);
    const request = input.request && typeof input.request === "object" ? input.request : createDefaultAvailabilityRequest();

    const runtimeResult = await credentialStore.mainProcess.withCredentialBundle(
      HOTELBEDS_CREDENTIAL_DESCRIPTOR,
      ["api_secret"],
      async (credentials) => {
        let signature = "";
        let requestCount = 0;
        try {
          signature = xSignature(apiKey, credentials.api_secret, nowSeconds());
          requestCount += 1;
          const availabilityResponse = await fetchWithTimeout(fetchImpl, HOTELBEDS_EVALUATION_AVAILABILITY_ENDPOINT, {
            method:"POST",
            headers:{
              Accept:"application/json",
              "Accept-Encoding":"gzip",
              "Api-key":apiKey,
              "X-Signature":signature,
              "Content-Type":"application/json"
            },
            body:JSON.stringify(request)
          }, timeoutMs);
          const availabilityPayload = await readJsonResponse(availabilityResponse, maximumBytes);
          if (!availabilityPayload.ok) return safeFailure("availability", availabilityPayload.error, availabilityPayload.status, requestCount);
          const normalized = normalizeAvailabilityEvidence(availabilityPayload.value, request, nowIso());
          return {
            ok:true,
            classification:HOTELBEDS_EVALUATION_CLASSIFICATION,
            availability:"PASS",
            hotelReturned:normalized.hotelReturned,
            rateReturned:normalized.rateReturned,
            priceCurrencyReturned:normalized.priceCurrencyReturned,
            cancellationReturned:normalized.cancellationReturned,
            evidence:normalized.evidence,
            requestCount,
            endpoint:"api.test.hotelbeds.com/hotel-api/1.0/hotels",
            signaturePersisted:false,
            rawResponsePersisted:false,
            executionGate:"CLOSED",
            authorizesExecution:false,
            executed:false,
            productionTraffic:false,
            productionAffected:false,
            transactionalCapabilities:false,
            booking:false,
            order:false,
            payment:false,
            redacted:true
          };
        } catch (error) {
          const code = error && error.name === "AbortError" ? "REQUEST_TIMEOUT" : "NETWORK_ERROR";
          return safeFailure("availability", code, 0, requestCount);
        } finally {
          signature = "";
        }
      }
    );

    if (!runtimeResult || runtimeResult.ok !== true) {
      return safeFailure("credential", runtimeResult && runtimeResult.error || "CREDENTIAL_RUNTIME_FAILED", 0, 0);
    }
    return runtimeResult.value;
  }

  return Object.freeze({
    version:HOTELBEDS_EVALUATION_READONLY_VALIDATOR_VERSION,
    validate
  });
}

module.exports = {
  HOTELBEDS_EVALUATION_READONLY_VALIDATOR_VERSION,
  HOTELBEDS_EVALUATION_CLASSIFICATION,
  HOTELBEDS_EVALUATION_AVAILABILITY_ENDPOINT,
  HOTELBEDS_CREDENTIAL_DESCRIPTOR,
  createDefaultAvailabilityRequest,
  createHotelbedsEvaluationReadonlyValidator
};
