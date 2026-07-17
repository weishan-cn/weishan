"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { createGlobalShoppingReadonlyResultCache } = require("./globalShoppingReadonlyResultCache");

const GLOBAL_SHOPPING_RAKUTEN_READONLY_SERVICE_VERSION = "4.2.8";
const PROVIDER_ID = "rakuten_japan";
const ALLOWED_SORT_VALUES = Object.freeze(["standard", "+itemPrice", "-itemPrice", "+updateTimestamp", "-updateTimestamp"]);
const LIVE_STATUS_SKIPPED = "REAL_PROVIDER_LIVE_CHECK SKIPPED_NO_CREDENTIAL";
const LIVE_STATUS_BLOCKED = "REAL_PROVIDER_LIVE_CHECK BLOCKED_PROVIDER_CONFIGURATION";

function clone(value) {
  return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
}

function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function toArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function text(value) {
  return String(value == null ? "" : value).trim();
}

function integerInRange(value, fallback, min, max) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, Math.round(next)));
}

function loadBrowserGlobal(relativePath, globalName, dependencies = {}) {
  const absolutePath = path.resolve(__dirname, "..", relativePath);
  const source = fs.readFileSync(absolutePath, "utf8");
  const window = Object.assign({}, dependencies.window || {});
  window.window = window;
  const context = vm.createContext(Object.assign({
    window,
    console,
    URL,
    AbortController,
    setTimeout,
    clearTimeout
  }, dependencies.context || {}));
  vm.runInContext(source, context, { filename:absolutePath });
  return window[globalName];
}

function createSharedApis() {
  const providerRegistry = loadBrowserGlobal(
    "renderer/core/globalShoppingProviderRegistry.js",
    "WeishanGlobalShoppingProviderRegistry"
  );
  const requestSchema = loadBrowserGlobal(
    "renderer/core/globalShoppingRakutenRequestSchema.js",
    "WeishanGlobalShoppingRakutenRequestSchema"
  );
  const responseSchema = loadBrowserGlobal(
    "renderer/core/globalShoppingRakutenResponseSchema.js",
    "WeishanGlobalShoppingRakutenResponseSchema"
  );
  const fieldMapping = loadBrowserGlobal(
    "renderer/core/globalShoppingRakutenFieldMapping.js",
    "WeishanGlobalShoppingRakutenFieldMapping"
  );
  const errorMapping = loadBrowserGlobal(
    "renderer/core/globalShoppingRakutenErrorMapping.js",
    "WeishanGlobalShoppingRakutenErrorMapping"
  );
  const rateLimitModel = loadBrowserGlobal(
    "renderer/core/globalShoppingRakutenRateLimitModel.js",
    "WeishanGlobalShoppingRakutenRateLimitModel"
  );
  const configurationSchema = loadBrowserGlobal(
    "renderer/core/globalShoppingProviderConfigurationSchema.js",
    "WeishanGlobalShoppingProviderConfigurationSchema"
  );
  const featureFlag = loadBrowserGlobal(
    "renderer/core/globalShoppingProviderFeatureFlag.js",
    "WeishanGlobalShoppingProviderFeatureFlag"
  );
  const versionRegistry = loadBrowserGlobal(
    "renderer/core/globalShoppingProviderVersionRegistry.js",
    "WeishanGlobalShoppingProviderVersionRegistry"
  );
  const productionReadiness = loadBrowserGlobal(
    "renderer/core/globalShoppingProviderProductionReadiness.js",
    "WeishanGlobalShoppingProviderProductionReadiness"
  );
  const permissionModel = loadBrowserGlobal(
    "renderer/core/globalShoppingProviderPermissionModel.js",
    "WeishanGlobalShoppingProviderPermissionModel"
  );
  const responseSafetyFilter = loadBrowserGlobal(
    "renderer/core/globalShoppingProviderResponseSafetyFilter.js",
    "WeishanGlobalShoppingProviderResponseSafetyFilter"
  );
  const errorNormalizer = loadBrowserGlobal(
    "renderer/core/globalShoppingProviderErrorNormalizer.js",
    "WeishanGlobalShoppingProviderErrorNormalizer"
  );
  const dataFreshness = loadBrowserGlobal(
    "renderer/core/globalShoppingDataFreshnessEngine.js",
    "WeishanGlobalShoppingDataFreshnessEngine"
  );
  const dataQuality = loadBrowserGlobal(
    "renderer/core/globalShoppingDataQualityEngine.js",
    "WeishanGlobalShoppingDataQualityEngine"
  );
  const recommendationAudit = loadBrowserGlobal(
    "renderer/core/globalShoppingRecommendationAudit.js",
    "WeishanGlobalShoppingRecommendationAudit"
  );
  const validationWindow = {
    WeishanGlobalShoppingProviderRegistry:providerRegistry
  };
  const officialDomainVerifier = loadBrowserGlobal(
    "renderer/core/globalShoppingOfficialDomainVerifier.js",
    "WeishanGlobalShoppingOfficialDomainVerifier",
    { window:validationWindow }
  );
  Object.assign(validationWindow, {
    WeishanGlobalShoppingOfficialDomainVerifier:officialDomainVerifier
  });
  const realDataValidation = loadBrowserGlobal(
    "renderer/core/globalShoppingRealDataValidationEngine.js",
    "WeishanGlobalShoppingRealDataValidationEngine",
    { window:validationWindow }
  );
  return {
    providerRegistry,
    requestSchema,
    responseSchema,
    fieldMapping,
    errorMapping,
    rateLimitModel,
    configurationSchema,
    featureFlag,
    versionRegistry,
    productionReadiness,
    permissionModel,
    responseSafetyFilter,
    errorNormalizer,
    dataFreshness,
    dataQuality,
    officialDomainVerifier,
    recommendationAudit,
    realDataValidation
  };
}

function createDefaultProvider() {
  return {
    providerId:PROVIDER_ID,
    name:"Rakuten",
    countries:["JP"],
    languages:["ja", "en"],
    categories:["product", "hotel"],
    capabilities:["search", "price", "availability", "officialProduct"],
    officialDomains:["rakuten.co.jp", "travel.rakuten.com"],
    status:"sandbox"
  };
}

function looksSensitiveFieldName(key) {
  return /(api[_-]?key|token|secret|credential|password|cookie|authorization|session|rawResponse|rawRequest|personalData)/i.test(text(key));
}

function containsSensitiveValue(value) {
  const safe = text(value);
  return /(^sk-|^pk_|Bearer\s+|authorization=|cookie=|@|password)/i.test(safe);
}

function ensureNoSensitiveFields(value, trail = []) {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const nested = ensureNoSensitiveFields(value[i], trail.concat(String(i)));
      if (nested) return nested;
    }
    return "";
  }
  if (!value || typeof value !== "object") {
    return containsSensitiveValue(value) ? trail.join(".") || "value" : "";
  }
  for (const key of Object.keys(value)) {
    const nextTrail = trail.concat(key);
    if (looksSensitiveFieldName(key)) return nextTrail.join(".");
    const child = value[key];
    if (typeof child !== "object" && containsSensitiveValue(child)) return nextTrail.join(".");
    const nested = ensureNoSensitiveFields(child, nextTrail);
    if (nested) return nested;
  }
  return "";
}

function sanitizeKeyword(value) {
  const safe = text(value).replace(/[\u0000-\u001f\u007f]/g, " ");
  if (!safe) return { valid:false, reason:"keyword_required", value:"" };
  if (safe.length > 120) return { valid:false, reason:"keyword_too_long", value:safe.slice(0, 120) };
  if (/https?:\/\//i.test(safe)) return { valid:false, reason:"keyword_must_not_be_url", value:"" };
  if (/[<>]/.test(safe) || /script/i.test(safe)) return { valid:false, reason:"keyword_contains_script_like_content", value:"" };
  return { valid:true, reason:"", value:safe };
}

function sanitizeCountryCode(value) {
  const safe = text(value).toUpperCase();
  return /^[A-Z]{2}$/.test(safe) ? safe : "";
}

function sanitizeCurrency(value) {
  const safe = text(value).toUpperCase();
  return /^[A-Z]{3}$/.test(safe) ? safe : "";
}

function sanitizePayload(payload) {
  const safe = obj(payload);
  const forbiddenKeys = ["endpoint", "url", "host", "headers", "authorization", "apiKey", "token", "auth", "secret", "credential"];
  const rejectedFields = forbiddenKeys.filter((key) => safe[key] !== undefined);
  const keyword = sanitizeKeyword(safe.keyword);
  return {
    valid:keyword.valid && rejectedFields.length === 0,
    invalidReason:keyword.valid ? (rejectedFields.length ? "forbidden_renderer_fields" : "") : keyword.reason,
    rejectedFields,
    payload:{
      keyword:keyword.value,
      page:integerInRange(safe.page, 1, 1, 20),
      hits:integerInRange(safe.hits, 10, 1, 10),
      sort:ALLOWED_SORT_VALUES.includes(text(safe.sort)) ? text(safe.sort) : "standard",
      destinationCountry:sanitizeCountryCode(safe.destinationCountry),
      currency:sanitizeCurrency(safe.currency) || "JPY"
    }
  };
}

function buildConfigurationCheck(shared, provider) {
  return shared.configurationSchema.buildGlobalShoppingProviderConfigurationSchema({
    providerId:provider.providerId,
    name:provider.name,
    category:"product",
    regions:provider.countries,
    languages:provider.languages,
    capabilities:provider.capabilities,
    officialDomains:provider.officialDomains,
    status:"sandbox",
    adapterVersion:"4.2.8-rakuten-main-readonly",
    contractVersion:"4.2.8"
  });
}

function buildFeatureFlagCheck(shared, provider, payload) {
  return shared.featureFlag.buildGlobalShoppingProviderFeatureFlag({
    providerId:provider.providerId,
    providerEnabled:true,
    enabledRegions:provider.countries,
    enabledCategories:["product"],
    region:text(payload.destinationCountry || "JP"),
    category:"product",
    experimentEnabled:true
  });
}

function buildVersionCheck(shared, providerId) {
  return shared.versionRegistry.getGlobalShoppingProviderVersionRecord({ providerId });
}

function buildPermissionCheck(shared, providerId) {
  return shared.permissionModel.buildGlobalShoppingProviderPermissionModel({
    providerId,
    operation:"searchProducts",
    mode:"real_provider_readonly"
  });
}

function buildProductionReadinessCheck(shared, provider, configuration, featureFlag, version, permission, credentialAvailable) {
  return shared.productionReadiness.buildGlobalShoppingProviderProductionReadiness({
    providerId:provider.providerId,
    configuration,
    featureFlag,
    version,
    permissionAllowed:permission.allowed === true && credentialAvailable === true,
    transactionAllowed:false,
    compliance:{ allowed:true, reason:"real_provider_read_only_allowed" },
    realProviderPreparation:{
      status:"documented",
      stage:"real_provider_preparation",
      transactionEnabled:false,
      credentialStorageAllowed:false
    },
    adapterStatus:{
      status:"testing",
      stage:"sandbox"
    }
  });
}

function resolveCredentials(options) {
  const env = obj(options.env || process.env);
  return {
    applicationId:text(env.RAKUTEN_APPLICATION_ID),
    accessKey:text(env.RAKUTEN_ACCESS_KEY),
    affiliateId:text(env.RAKUTEN_AFFILIATE_ID)
  };
}

function buildStatusResult(shared, options = {}) {
  const provider = options.provider || createDefaultProvider();
  const credentials = resolveCredentials({ env:options.env || process.env });
  const configurationCheck = buildConfigurationCheck(shared, provider);
  const featureFlagCheck = buildFeatureFlagCheck(shared, provider, { destinationCountry:"JP" });
  const versionCheck = buildVersionCheck(shared, provider.providerId);
  const permissionCheck = buildPermissionCheck(shared, provider.providerId);
  const credentialAvailable = Boolean(credentials.applicationId && credentials.accessKey);
  const productionReadiness = buildProductionReadinessCheck(
    shared,
    provider,
    configurationCheck,
    featureFlagCheck,
    versionCheck,
    permissionCheck,
    credentialAvailable
  );
  const executionMode = credentialAvailable && permissionCheck.allowed === true && productionReadiness.readinessLevel !== "blocked"
    ? "real_provider_readonly"
    : "external_link_only";
  return {
    connected:credentialAvailable,
    readinessLevel:credentialAvailable ? productionReadiness.readinessLevel : "sandbox",
    executionMode,
    providerId:provider.providerId,
    configurationCheck,
    featureFlagCheck,
    versionCheck,
    permissionCheck,
    productionReadiness,
    redacted:true
  };
}

function requestTimeoutMs(options) {
  return integerInRange(obj(options).timeoutMs, 8000, 1000, 30000);
}

function retryLimit(options) {
  return integerInRange(obj(options).retryLimit, 1, 0, 2);
}

function maxResponseBytes(options) {
  return integerInRange(obj(options).maxResponseBytes, 1024 * 1024, 1024, 5 * 1024 * 1024);
}

function bucketDuration(ms) {
  if (ms < 500) return "<500ms";
  if (ms < 1500) return "500ms-1.5s";
  if (ms < 5000) return "1.5s-5s";
  return "5s+";
}

function defaultFetchImpl() {
  if (typeof fetch === "function") return fetch.bind(globalThis);
  return null;
}

function createRequestPlan(shared, payload, credentials) {
  const requestSchema = shared.requestSchema.buildGlobalShoppingRakutenRequestSchema({
    providerId:PROVIDER_ID,
    operation:"searchProducts"
  });
  const operation = obj(requestSchema.operation);
  const endpointUrl = text(operation.endpointUrl || "");
  const endpointHost = endpointUrl ? new URL(endpointUrl).hostname.toLowerCase() : "";
  const params = new URLSearchParams();
  params.set("applicationId", credentials.applicationId);
  params.set("accessKey", credentials.accessKey);
  if (credentials.affiliateId) params.set("affiliateId", credentials.affiliateId);
  params.set("format", "json");
  params.set("formatVersion", "2");
  params.set("keyword", payload.keyword);
  params.set("hits", String(payload.hits));
  params.set("page", String(payload.page));
  params.set("elements", "itemName,itemPrice,itemUrl,shopName,shopUrl,availability,imageFlag,smallImageUrls,mediumImageUrls");
  if (payload.sort && payload.sort !== "standard") params.set("sort", payload.sort);
  return {
    endpointName:text(operation.endpointName || "rakuten_ichiba_item_search"),
    endpointUrl,
    endpointHost,
    requestMethod:"GET",
    requestUrl:endpointUrl ? endpointUrl + "?" + params.toString() : "",
    redacted:true
  };
}

async function runRequest(fetchImpl, requestPlan, options) {
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutMs = requestTimeoutMs(options);
  const responseByteLimit = maxResponseBytes(options);
  let timer = null;
  if (controller) {
    timer = setTimeout(() => controller.abort(), timeoutMs);
  }
  try {
    const response = await fetchImpl(requestPlan.requestUrl, {
      method:requestPlan.requestMethod,
      headers:{ Accept:"application/json" },
      signal:controller ? controller.signal : undefined,
      redirect:"error"
    });
    const body = typeof response.text === "function" ? await response.text() : "";
    if (Buffer.byteLength(String(body || ""), "utf8") > responseByteLimit) {
      throw { code:413, message:"response_too_large" };
    }
    let parsed = {};
    try {
      parsed = body ? JSON.parse(body) : {};
    } catch (_) {
      throw { code:502, message:"invalid_json_response" };
    }
    if (!response.ok) {
      throw {
        code:Number(response.status || 0),
        message:text(obj(parsed).message || obj(parsed).error || "http_" + String(response.status || 0))
      };
    }
    return parsed;
  } catch (error) {
    if (error && error.name === "AbortError") throw { code:408, message:"timeout" };
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function validateResponseSchema(shared, payload) {
  const schema = shared.responseSchema.buildGlobalShoppingRakutenResponseSchema({
    providerId:PROVIDER_ID,
    operation:"searchProducts"
  });
  const operationSchema = obj(schema.operation);
  const topLevelFields = toArray(operationSchema.topLevelFields);
  const itemFields = toArray(operationSchema.itemFields);
  const safePayload = obj(payload);
  const items = Array.isArray(safePayload.items) ? safePayload.items : [];
  const errors = [];
  topLevelFields.forEach((field) => {
    if (safePayload[field] === undefined) errors.push(field + "_missing");
  });
  if (!items.length) errors.push("items_empty");
  items.forEach((rawItem, index) => {
    const item = obj(rawItem);
    itemFields.forEach((field) => {
      if (item[field] === undefined) errors.push(field + "_missing_" + index);
    });
  });
  return { valid:errors.length === 0, errors, items };
}

function buildMappedResult(shared, item, runtime) {
  const safeItem = obj(item);
  const fetchedAt = text(runtime.fetchedAt || new Date().toISOString());
  const officialUrl = text(safeItem.itemUrl || "");
  const imageUrls = Array.isArray(safeItem.smallImageUrls) ? safeItem.smallImageUrls : (Array.isArray(safeItem.mediumImageUrls) ? safeItem.mediumImageUrls : []);
  const imageUrl = text(obj(imageUrls[0]).imageUrl || "");
  const officialDomainStatus = shared.officialDomainVerifier.buildGlobalShoppingOfficialDomainVerification({
    providerId:PROVIDER_ID,
    officialUrl
  });
  const priceFreshness = shared.dataFreshness.buildGlobalShoppingDataFreshness({
    timestamp:fetchedAt,
    now:text(runtime.now || "")
  });
  const availabilityFreshness = {
    checkedAt:fetchedAt,
    availabilityStatus:text(safeItem.availability || "unknown"),
    freshnessLevel:text(priceFreshness.freshnessLevel || "unknown"),
    redacted:true
  };
  const dataQuality = shared.dataQuality.buildGlobalShoppingDataQuality({
    sourceTrust:"high",
    sourceTrustScore:0.92,
    completeness:[
      text(safeItem.itemName),
      text(safeItem.itemUrl),
      text(safeItem.shopName),
      text(safeItem.itemPrice)
    ].filter(Boolean).length / 4,
    freshness:priceFreshness,
    officialVerification:officialDomainStatus.verified === true,
    consistency:text(safeItem.itemPrice) ? 0.88 : 0.45
  });
    const realDataValidation = shared.realDataValidation.buildGlobalShoppingRealDataValidation({
      providerId:PROVIDER_ID,
      title:text(safeItem.itemName || ""),
      price:safeItem.itemPrice,
      currency:"JPY",
    expectedCurrency:text(runtime.currency || "JPY"),
    availability:text(safeItem.availability || "unknown"),
    officialUrl:officialUrl,
    dataFreshness:priceFreshness,
    officialDomainStatus,
      responseProvenance:{
        providerIdentity:PROVIDER_ID,
        responseProvenance:"rakuten_official_api",
        sourceType:"rakuten_api"
      },
      dataQuality,
      sourceType:"rakuten_api"
    });
  return {
    id:text(safeItem.itemCode || safeItem.itemUrl || safeItem.itemName || ""),
    platformName:"Rakuten",
    title:text(safeItem.itemName || ""),
    price:Number.isFinite(Number(safeItem.itemPrice)) ? Number(safeItem.itemPrice) : null,
    priceLabel:Number.isFinite(Number(safeItem.itemPrice)) ? "JPY " + String(Number(safeItem.itemPrice)) : "价格以平台页面为准",
    currency:"JPY",
    availability:text(safeItem.availability || "unknown"),
    imageUrl,
    shopName:text(safeItem.shopName || "Rakuten"),
    officialUrl:officialDomainStatus.verified === true ? officialUrl : "",
    targetUrl:officialDomainStatus.verified === true ? officialUrl : "",
    fetchedAt,
    updatedAt:fetchedAt,
    priceFreshness,
    availabilityFreshness,
    officialDomainStatus,
    dataQuality,
    realDataValidation,
    dataSource:{
      sourceType:"rakuten_official_api",
      sourceStatus:"live_read_only",
      trustLevel:officialDomainStatus.trustLevel || "unknown"
    },
    sourceType:"rakuten_official_api",
    trustLevel:officialDomainStatus.verified === true ? "high" : "medium",
    isOfficial:officialDomainStatus.verified === true,
    category:"product",
    feeNote:"最终价格以 Rakuten 页面与结算页为准。",
    riskNote:"Weishan 不收款、不代下单、不保存平台账号密码。",
    recommendationReason:"当前已知价格较低，且来源为 Rakuten 官方 API 只读结果。",
    responseProvenance:{
      providerIdentity:PROVIDER_ID,
      responseProvenance:"rakuten_official_api",
      sourceType:"rakuten_official_api",
      redacted:true
    },
    recommendationAudit:shared.recommendationAudit.buildGlobalShoppingRecommendationAudit({
      decisionId:PROVIDER_ID + ":" + text(safeItem.itemCode || safeItem.itemName || "item"),
      provider:"Rakuten",
      region:"JP",
      gatewayPath:"main_process_readonly_proxy",
      providerStatus:"testing",
      providerConfigurationState:"sandbox",
      providerVersionState:"testing",
      featureFlagState:"sandbox_enabled",
      productionReadinessState:"sandbox",
      providerPreparationState:"real_provider_preparation",
      providerVersion:"4.2.8-rakuten-main-readonly",
      rankingFactors:["官方 API", "主进程只读代理", "官方域名校验"],
      confidence:text(realDataValidation.confidence || "medium"),
      warnings:toArray(realDataValidation.warnings),
      dataQuality,
      dataSource:{
        sourceType:"rakuten_official_api",
        sourceStatus:"live_read_only"
      },
      realDataValidation
    }),
    redacted:true
  };
}

function sanitizeResultsForRenderer(shared, results) {
  const filter = shared.responseSafetyFilter.buildGlobalShoppingProviderResponseSafetyFilter({
    results
  });
  const sensitivePath = ensureNoSensitiveFields(filter.filteredResult);
  if (filter.safe !== true || sensitivePath) {
    return {
      ok:false,
      filteredFields:toArray(filter.filteredFields).concat(sensitivePath ? [sensitivePath] : []),
      warnings:toArray(filter.warnings).concat(sensitivePath ? ["blocked_sensitive_field:" + sensitivePath] : [])
    };
  }
  return {
    ok:true,
    filteredResults:toArray(obj(filter.filteredResult).results),
    filteredFields:toArray(filter.filteredFields),
    warnings:toArray(filter.warnings)
  };
}

function buildDegradedResult(mode, errorCategory, userMessage, metadata = {}) {
  return {
    status:"degraded",
    providerId:PROVIDER_ID,
    providerName:"Rakuten",
    sourceType:mode === "sandbox" ? "sandbox" : "external_link_only",
    fetchedAt:new Date().toISOString(),
    resultCount:0,
    results:[],
    metadata:Object.assign({
      executionMode:mode,
      filteredFields:[],
      redacted:true
    }, obj(metadata)),
    error:{
      category:errorCategory,
      userMessage,
      redacted:true
    },
    redacted:true
  };
}

function buildUnavailableResult(errorCategory, userMessage, metadata = {}) {
  return {
    status:"unavailable",
    providerId:PROVIDER_ID,
    providerName:"Rakuten",
    sourceType:"external_link_only",
    fetchedAt:new Date().toISOString(),
    resultCount:0,
    results:[],
    metadata:Object.assign({
      executionMode:"external_link_only",
      filteredFields:[],
      redacted:true
    }, obj(metadata)),
    error:{
      category:errorCategory,
      userMessage,
      redacted:true
    },
    redacted:true
  };
}

function createGlobalShoppingRakutenReadonlyService(options = {}) {
  const cache = options.cache || createGlobalShoppingReadonlyResultCache();
  const provider = options.provider || createDefaultProvider();
  const fetchImpl = options.fetchImpl || defaultFetchImpl();
  const env = options.env || process.env;
  const now = typeof options.now === "function" ? options.now : (() => new Date().toISOString());
  const sharedApisFactory = typeof options.createSharedApis === "function" ? options.createSharedApis : createSharedApis;
  let sharedApisCache = options.sharedApis || null;
  let sharedApisInitError = null;

  function getSharedApis() {
    if (sharedApisCache) return sharedApisCache;
    if (sharedApisInitError) return null;
    try {
      sharedApisCache = sharedApisFactory();
      return sharedApisCache;
    } catch (error) {
      sharedApisInitError = error || new Error("shared_api_initialization_failed");
      return null;
    }
  }

  function sharedApisUnavailableResult() {
    return buildUnavailableResult(
      "shared_api_initialization_failed",
      "Rakuten 实时查询初始化失败，已安全降级。",
      { initializationState:"failed_safe" }
    );
  }

  async function search(payload) {
    const shared = getSharedApis();
    if (!shared) return sharedApisUnavailableResult();
    const sanitizedInput = sanitizePayload(payload);
    if (!sanitizedInput.valid) {
      return buildDegradedResult("external_link_only", "request_invalid", "搜索参数不合法，已安全降级。", {
        invalidReason:sanitizedInput.invalidReason,
        rejectedFields:sanitizedInput.rejectedFields
      });
    }

    const status = buildStatusResult(shared, { provider, env });
    if (status.permissionCheck.allowed !== true) {
      return buildDegradedResult("external_link_only", "permission_denied", "Rakuten 实时查询当前不可用。", {
        permissionCheck:status.permissionCheck
      });
    }
    if (status.connected !== true) {
      return buildDegradedResult("external_link_only", "credential_unavailable", "Rakuten 实时查询尚未连接", {
        readinessLevel:status.readinessLevel
      });
    }
    if (status.executionMode !== "real_provider_readonly") {
      return buildDegradedResult("sandbox", "readonly_not_enabled", "Rakuten 实时查询当前处于只读降级模式。", {
        readinessLevel:status.readinessLevel
      });
    }

    const cached = cache.get(sanitizedInput.payload);
    if (cached.hit && cached.value) {
      return Object.assign(clone(cached.value), {
        metadata:Object.assign({}, obj(cached.value.metadata), {
          cacheStatus:cached.metadata.freshnessLevel,
          cacheAgeSeconds:cached.metadata.ageSeconds,
          redacted:true
        })
      });
    }

    const credentials = resolveCredentials({ env });
    const requestPlan = createRequestPlan(shared, sanitizedInput.payload, credentials);
    const endpointAllowed = provider.officialDomains.some((domain) => {
      const normalized = String(domain || "").toLowerCase();
      return requestPlan.endpointHost === normalized || requestPlan.endpointHost.endsWith("." + normalized);
    });
    if (!requestPlan.endpointUrl || !endpointAllowed) {
      return buildDegradedResult("external_link_only", "endpoint_not_allowlisted", "Rakuten 实时查询配置未通过安全校验。", {
        endpointName:requestPlan.endpointName
      });
    }
    if (!fetchImpl) {
      return buildDegradedResult("external_link_only", "transport_unavailable", "Rakuten 实时查询当前不可用。");
    }

    let attempt = 0;
    const startedAt = Date.now();
    while (attempt <= retryLimit(options)) {
      try {
        const responsePayload = await runRequest(fetchImpl, requestPlan, options);
        const validation = validateResponseSchema(shared, responsePayload);
        if (validation.valid !== true) {
          return buildDegradedResult("external_link_only", "schema_invalid", "Rakuten 返回结果暂不可用，已安全降级。", {
            schemaErrors:validation.errors.slice(0, 8)
          });
        }
        const fetchedAt = now();
        const mappedResults = validation.items
          .map((item) => buildMappedResult(shared, item, {
            fetchedAt,
            now:fetchedAt,
            currency:sanitizedInput.payload.currency
          }))
          .filter((item) => item.officialUrl);
        const filtered = sanitizeResultsForRenderer(shared, mappedResults);
        if (!filtered.ok) {
          return buildDegradedResult("external_link_only", "response_redacted_blocked", "Rakuten 返回结果未通过安全过滤。", {
            filteredFields:filtered.filteredFields,
            warnings:filtered.warnings
          });
        }
        const result = {
          status:"ready",
          providerId:PROVIDER_ID,
          providerName:"Rakuten",
          sourceType:"rakuten_official_api",
          fetchedAt,
          resultCount:filtered.filteredResults.length,
          results:filtered.filteredResults,
          metadata:{
            executionMode:"real_provider_readonly",
            endpointName:requestPlan.endpointName,
            durationBucket:bucketDuration(Date.now() - startedAt),
            resultCount:filtered.filteredResults.length,
            cacheStatus:"fresh",
            filteredFields:filtered.filteredFields,
            warnings:filtered.warnings,
            retryCount:attempt,
            redacted:true
          },
          error:null,
          redacted:true
        };
        cache.set(sanitizedInput.payload, result);
        return result;
      } catch (error) {
        const normalizedError = shared.errorNormalizer.buildGlobalShoppingProviderErrorNormalizer(error);
        if (normalizedError.category === "timeout" && attempt < retryLimit(options)) {
          attempt += 1;
          continue;
        }
        if (normalizedError.code === 429 && attempt < retryLimit(options)) {
          attempt += 1;
          continue;
        }
        return buildDegradedResult("external_link_only", normalizedError.category || "provider_error", "Rakuten 实时查询暂不可用，已安全降级。", {
          durationBucket:bucketDuration(Date.now() - startedAt),
          retryCount:attempt,
          errorCategory:text(normalizedError.category || "provider_error")
        });
      }
    }

    return buildDegradedResult("external_link_only", "provider_error", "Rakuten 实时查询暂不可用，已安全降级。");
  }

  return {
    version:GLOBAL_SHOPPING_RAKUTEN_READONLY_SERVICE_VERSION,
    getStatus:function () {
      const shared = getSharedApis();
      if (!shared) {
        return {
          connected:false,
          readinessLevel:"unknown",
          executionMode:"blocked",
          providerId:PROVIDER_ID,
          status:"unavailable",
          errorCategory:"shared_api_initialization_failed",
          redacted:true
        };
      }
      const status = buildStatusResult(shared, { provider, env });
      return {
        connected:status.connected,
        readinessLevel:status.readinessLevel,
        executionMode:status.executionMode,
        providerId:status.providerId,
        redacted:true
      };
    },
    search,
    manualLiveCheckStatus:function () {
      const shared = getSharedApis();
      if (!shared) return LIVE_STATUS_BLOCKED;
      const credentials = resolveCredentials({ env });
      if (!credentials.applicationId || !credentials.accessKey) return LIVE_STATUS_SKIPPED;
      const requestSchema = shared.requestSchema.buildGlobalShoppingRakutenRequestSchema({
        providerId:PROVIDER_ID,
        operation:"searchProducts"
      });
      return obj(requestSchema).operation ? "REAL_PROVIDER_LIVE_CHECK READY" : LIVE_STATUS_BLOCKED;
    }
  };
}

function registerGlobalShoppingRakutenReadonlyHandlers(ipcMain, options = {}) {
  const service = options.service || createGlobalShoppingRakutenReadonlyService(options);
  ipcMain.handle("global-shopping:rakuten-readonly-search", async (_event, payload) => {
    return service.search(payload || {});
  });
  ipcMain.handle("global-shopping:rakuten-readonly-status", async () => {
    return service.getStatus();
  });
  return service;
}

module.exports = {
  GLOBAL_SHOPPING_RAKUTEN_READONLY_SERVICE_VERSION,
  ALLOWED_SORT_VALUES,
  LIVE_STATUS_BLOCKED,
  LIVE_STATUS_SKIPPED,
  createGlobalShoppingRakutenReadonlyService,
  registerGlobalShoppingRakutenReadonlyHandlers
};
