;(function () {
  "use strict";

  const GLOBAL_SHOPPING_RAKUTEN_REAL_PROVIDER_ADAPTER_VERSION = "4.2.8";
  const ADAPTER_NAME = "global_shopping_rakuten_real_provider_adapter_v1";

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

  function numberOrNull(value) {
    const next = Number(value);
    return Number.isFinite(next) ? next : null;
  }

  function nowIso(runtime) {
    const fixed = text(obj(runtime).now || "");
    return fixed || new Date().toISOString();
  }

  function contractLayerApi() { return window.WeishanGlobalShoppingRakutenRealProviderAdapterContractLayer || {}; }
  function qualityApi() { return window.WeishanGlobalShoppingDataQualityEngine || {}; }
  function freshnessApi() { return window.WeishanGlobalShoppingDataFreshnessEngine || {}; }
  function verifierApi() { return window.WeishanGlobalShoppingOfficialDomainVerifier || {}; }
  function auditApi() { return window.WeishanGlobalShoppingRecommendationAudit || {}; }
  function filterApi() { return window.WeishanGlobalShoppingProviderResponseSafetyFilter || {}; }
  function normalizerApi() { return window.WeishanGlobalShoppingProviderErrorNormalizer || {}; }
  function validationApi() { return window.WeishanGlobalShoppingRealDataValidationEngine || {}; }

  function planned(providerId, method) {
    return {
      providerId:text(providerId || "rakuten_japan"),
      status:"planned",
      available:false,
      method:text(method || ""),
      sourceType:"rakuten_api",
      redacted:true
    };
  }

  function sanitizeHits(value) {
    const next = Number(value);
    if (!Number.isFinite(next)) return 10;
    return Math.max(1, Math.min(30, Math.round(next)));
  }

  function sanitizePage(value) {
    const next = Number(value);
    if (!Number.isFinite(next)) return 1;
    return Math.max(1, Math.min(100, Math.round(next)));
  }

  function buildContractLayer(providerId, operation) {
    const api = contractLayerApi();
    if (typeof api.buildGlobalShoppingRakutenRealProviderAdapterContractLayer === "function") {
      return api.buildGlobalShoppingRakutenRealProviderAdapterContractLayer({
        providerId:providerId,
        operation:operation
      });
    }
    return {
      status:"blocked",
      blockers:["contract_layer_unavailable"]
    };
  }

  function buildFreshness(timestamp, runtime) {
    const api = freshnessApi();
    if (typeof api.buildGlobalShoppingDataFreshness === "function") {
      return api.buildGlobalShoppingDataFreshness({
        timestamp:timestamp,
        now:text(obj(runtime).now || "")
      });
    }
    return {
      freshnessLevel:"unknown",
      ageSeconds:null,
      isUsable:false,
      warning:"当前没有可验证的数据时间戳。",
      redacted:true
    };
  }

  function buildQuality(input) {
    const api = qualityApi();
    if (typeof api.buildGlobalShoppingDataQuality === "function") {
      return api.buildGlobalShoppingDataQuality(input);
    }
    return {
      qualityScore:0.45,
      qualityLevel:"low",
      warnings:["当前质量仅可作为只读参考。"],
      redacted:true
    };
  }

  function buildOfficialVerification(providerId, url) {
    const api = verifierApi();
    if (typeof api.buildGlobalShoppingOfficialDomainVerification === "function") {
      return api.buildGlobalShoppingOfficialDomainVerification({
        providerId:providerId,
        officialUrl:url
      });
    }
    return {
      verified:false,
      trustLevel:"unknown",
      reason:"official_domain_verifier_unavailable",
      redacted:true
    };
  }

  function buildRecommendationAudit(input) {
    const api = auditApi();
    if (typeof api.buildGlobalShoppingRecommendationAudit === "function") {
      return api.buildGlobalShoppingRecommendationAudit(input);
    }
    return {
      provider:text(input.provider || ""),
      gatewayPath:text(input.gatewayPath || ""),
      confidence:text(input.confidence || "low"),
      redacted:true
    };
  }

  function buildRealDataValidation(input) {
    const api = validationApi();
    if (typeof api.buildGlobalShoppingRealDataValidation === "function") {
      return api.buildGlobalShoppingRealDataValidation(input);
    }
    return {
      validationStatus:"needs_review",
      confidence:"low",
      warnings:["当前缺少真实数据验证引擎。"],
      blockers:[],
      qualityScore:Number(obj(obj(input).dataQuality).qualityScore || 0.4),
      redacted:true
    };
  }

  function buildSafetyFilter(input) {
    const api = filterApi();
    if (typeof api.buildGlobalShoppingProviderResponseSafetyFilter === "function") {
      return api.buildGlobalShoppingProviderResponseSafetyFilter(input);
    }
    return {
      safe:true,
      filteredFields:[],
      warnings:[],
      filteredResult:clone(input),
      redacted:true
    };
  }

  function normalizeError(error) {
    const api = normalizerApi();
    if (typeof api.buildGlobalShoppingProviderErrorNormalizer === "function") {
      return api.buildGlobalShoppingProviderErrorNormalizer(error);
    }
    return {
      code:Number(obj(error).code || 0),
      category:"unknown",
      retryable:false,
      message:text(obj(error).message || "provider_error_unknown"),
      redacted:true
    };
  }

  function runtimeConfig(adapterInput, params) {
    const adapterRuntime = obj(obj(adapterInput).runtime);
    const paramRuntime = obj(obj(params).runtime);
    return Object.assign({}, adapterRuntime, paramRuntime);
  }

  function resolveCredentials(runtime, params) {
    const safeRuntime = obj(runtime);
    const safeParams = obj(params);
    const provider = typeof safeRuntime.credentialProvider === "function"
      ? obj(safeRuntime.credentialProvider({
        providerId:"rakuten_japan",
        operation:"searchProducts"
      }))
      : {};
    const env = obj(safeRuntime.env);
    return {
      applicationId:text(
        safeParams.applicationId ||
        provider.applicationId ||
        safeRuntime.applicationId ||
        env.RAKUTEN_APPLICATION_ID
      ),
      accessKey:text(
        safeParams.accessKey ||
        provider.accessKey ||
        safeRuntime.accessKey ||
        env.RAKUTEN_ACCESS_KEY
      ),
      affiliateId:text(
        safeParams.affiliateId ||
        provider.affiliateId ||
        safeRuntime.affiliateId ||
        env.RAKUTEN_AFFILIATE_ID
      )
    };
  }

  function resolveFetch(runtime) {
    if (typeof obj(runtime).fetchImpl === "function") return obj(runtime).fetchImpl;
    if (typeof fetch === "function") return fetch.bind(typeof window === "object" ? window : globalThis);
    return null;
  }

  function requestTimeoutMs(runtime) {
    const next = Number(obj(runtime).timeoutMs);
    if (!Number.isFinite(next)) return 8000;
    return Math.max(1000, Math.min(30000, Math.round(next)));
  }

  function retryLimit(runtime) {
    const next = Number(obj(runtime).retryLimit);
    if (!Number.isFinite(next)) return 1;
    return Math.max(0, Math.min(3, Math.round(next)));
  }

  function retryDelayMs(runtime, attempt) {
    const base = Number(obj(runtime).retryDelayMs);
    const seed = Number.isFinite(base) ? Math.max(100, Math.min(3000, Math.round(base))) : 300;
    return seed * Math.max(1, attempt);
  }

  function runtimeApproved(runtime) {
    return obj(runtime).allowRealProviderReadonly === true;
  }

  function buildProductRequest(params, runtime, credentials) {
    const keyword = text(obj(params).keyword || obj(params).query || "");
    const contract = buildContractLayer("rakuten_japan", "searchProducts");
    const operation = obj(contract.requestSchema).operation || {};
    const endpointUrl = text(operation.endpointUrl || "");
    const url = new URL(endpointUrl);
    url.searchParams.set("applicationId", credentials.applicationId);
    url.searchParams.set("accessKey", credentials.accessKey);
    if (credentials.affiliateId) url.searchParams.set("affiliateId", credentials.affiliateId);
    url.searchParams.set("format", "json");
    url.searchParams.set("formatVersion", "2");
    url.searchParams.set("keyword", keyword);
    url.searchParams.set("hits", String(sanitizeHits(params.hits)));
    url.searchParams.set("page", String(sanitizePage(params.page)));
    url.searchParams.set("elements", "itemName,itemPrice,itemUrl,shopName,shopUrl,availability");
    if (text(params.sort || "")) url.searchParams.set("sort", text(params.sort));
    if (numberOrNull(params.minPrice) !== null) url.searchParams.set("minPrice", String(numberOrNull(params.minPrice)));
    if (numberOrNull(params.maxPrice) !== null) url.searchParams.set("maxPrice", String(numberOrNull(params.maxPrice)));
    return {
      endpointName:text(operation.endpointName || "rakuten_ichiba_item_search"),
      endpointUrl:endpointUrl,
      requestUrl:url.toString(),
      requestMethod:"GET",
      keywordPresent:Boolean(keyword),
      timeoutMs:requestTimeoutMs(runtime),
      redacted:true
    };
  }

  async function waitMs(ms) {
    await new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  async function runFetch(request, runtime) {
    const fetchImpl = resolveFetch(runtime);
    if (!fetchImpl) {
      throw { code:0, message:"fetch_unavailable" };
    }
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timeoutMs = requestTimeoutMs(runtime);
    let timer = null;
    if (controller && typeof setTimeout === "function") {
      timer = setTimeout(function () {
        controller.abort(new Error("timeout"));
      }, timeoutMs);
    }
    try {
      return await fetchImpl(request.requestUrl, {
        method:request.requestMethod,
        headers:{ "Accept":"application/json" },
        signal:controller ? controller.signal : undefined
      });
    } catch (error) {
      if (error && error.name === "AbortError") throw { code:408, message:"timeout" };
      throw error;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function parseResponse(response) {
    const rawText = typeof response.text === "function" ? await response.text() : "";
    let parsed = {};
    try {
      parsed = rawText ? JSON.parse(rawText) : {};
    } catch (_) {
      throw { code:502, message:"invalid_json_response" };
    }
    if (response.ok === false) {
      throw {
        code:Number(response.status || 0),
        message:text(obj(parsed).error || obj(parsed).message || ("http_" + String(response.status || 0)))
      };
    }
    return parsed;
  }

  function responseItems(payload) {
    return toArray(obj(payload).items);
  }

  function validateResponsePayload(payload) {
    const items = responseItems(payload);
    const errors = [];
    if (!payload || typeof payload !== "object") errors.push("response_not_object");
    if (!Array.isArray(obj(payload).items)) errors.push("items_missing");
    if (!items.length) errors.push("items_empty");
    items.forEach(function (item, index) {
      if (!text(obj(item).itemName || "")) errors.push("itemName_missing_" + index);
      if (numberOrNull(obj(item).itemPrice) === null) errors.push("itemPrice_missing_" + index);
      if (!text(obj(item).itemUrl || "")) errors.push("itemUrl_missing_" + index);
    });
    return {
      valid:errors.length === 0,
      errors:errors,
      items:items
    };
  }

  function buildMappedResult(item, params, fetchedAt) {
    const providerId = "rakuten_japan";
    const targetUrl = text(obj(item).itemUrl || "");
    const price = numberOrNull(obj(item).itemPrice);
    const freshness = buildFreshness(fetchedAt, obj(params).runtime);
    const officialVerification = buildOfficialVerification(providerId, targetUrl);
    const completeness = [
      text(obj(item).itemName || ""),
      targetUrl,
      text(obj(item).shopName || "")
    ].filter(Boolean).length / 3;
    const quality = buildQuality({
      sourceTrust:"high",
      sourceTrustScore:0.92,
      completeness:completeness,
      freshness:freshness,
      officialVerification:officialVerification.verified === true,
      consistency:price !== null && officialVerification.verified === true ? 0.88 : 0.62
    });
    const realDataValidation = buildRealDataValidation({
      providerId:providerId,
      title:text(obj(item).itemName || ""),
      price:price,
      currency:text(obj(params).currency || "JPY"),
      availability:text(obj(item).availability || "unknown"),
      officialUrl:targetUrl,
      dataFreshness:freshness,
      officialDomainStatus:officialVerification,
      responseProvenance:{
        providerIdentity:providerId,
        responseProvenance:"rakuten_official_api",
        sourceType:"rakuten_api"
      },
      dataQuality:quality,
      sourceType:"rakuten_api",
      expectedCurrency:text(obj(params).currency || "JPY")
    });
    const audit = buildRecommendationAudit({
      decisionId:providerId + ":" + text(obj(item).itemName || "item"),
      provider:"Rakuten",
      region:"JP",
      gatewayPath:"rakuten_api/read_only",
      providerStatus:"testing",
      providerConfigurationState:"sandbox",
      providerVersionState:"testing",
      featureFlagState:"sandbox_enabled",
      productionReadinessState:"sandbox",
      providerPreparationState:"documented",
      providerVersion:"4.2.8-rakuten-prep",
      rankingFactors:["官方 API", "只读真实价格字段", "官方域名校验"],
      confidence:text(realDataValidation.confidence || (price !== null && officialVerification.verified === true ? "high" : "medium")),
      warnings:(freshness.warning ? [freshness.warning] : []).concat(toArray(realDataValidation.warnings)),
      dataQuality:quality,
      dataSource:{
        sourceType:"rakuten_api",
        sourceStatus:"live_read_only"
      },
      realDataValidation:realDataValidation
    });
    return {
      providerId:providerId,
      platformName:"Rakuten",
      title:text(obj(item).itemName || ""),
      category:"product",
      price:price,
      priceLabel:price !== null ? "JPY " + String(price) : "价格以平台页面为准",
      currency:text(obj(params).currency || "JPY"),
      availability:text(obj(item).availability || "unknown"),
      targetUrl:targetUrl,
      officialUrl:targetUrl,
      sourceType:"rakuten_api",
      timestamp:fetchedAt,
      updatedAt:fetchedAt,
      confidence:text(realDataValidation.confidence || (price !== null ? "high" : "medium")),
      trustLevel:officialVerification.verified === true ? "high" : "medium",
      providerName:text(obj(item).shopName || "Rakuten"),
      providerUrl:text(obj(item).shopUrl || ""),
      dataSource:{
        sourceType:"rakuten_api",
        sourceStatus:"live_read_only",
        trustLevel:officialVerification.trustLevel || "verified"
      },
      priceFreshness:freshness,
      availabilityFreshness:{
        checkedAt:fetchedAt,
        availabilityStatus:text(obj(item).availability || "unknown"),
        freshnessLevel:text(freshness.freshnessLevel || "unknown"),
        redacted:true
      },
      dataFreshness:freshness,
      dataQuality:quality,
      realDataValidation:realDataValidation,
      officialDomainStatus:officialVerification,
      responseProvenance:{
        providerIdentity:providerId,
        responseProvenance:"rakuten_official_api",
        sourceType:"rakuten_api",
        redacted:true
      },
      recommendationAudit:audit,
      feeNote:"价格与费用以 Rakuten 官方页面为准。",
      riskNote:"Weishan 只做只读搜索与跳转，不下单、不付款、不保存第三方凭证。",
      redacted:true
    };
  }

  function buildErrorResult(message, error, requestInfo, contract, runtime) {
    const normalizedError = normalizeError(error);
    return {
      providerId:"rakuten_japan",
      status:"blocked",
      available:false,
      sourceType:"rakuten_api",
      dataConfidence:"official_api_readonly",
      timestamp:nowIso(runtime),
      results:[],
      error:{
        category:text(normalizedError.category || "unknown"),
        retryable:normalizedError.retryable === true,
        message:text(normalizedError.message || message || "provider_error_unknown"),
        code:Number(normalizedError.code || 0)
      },
      metadata:{
        endpointName:text(obj(requestInfo).endpointName || ""),
        requestMethod:text(obj(requestInfo).requestMethod || "GET"),
        providerPreparationStatus:text(obj(contract).status || "blocked")
      },
      redacted:true
    };
  }

  async function executeSearchProducts(adapterInput, params) {
    const runtime = runtimeConfig(adapterInput, params);
    const contract = buildContractLayer("rakuten_japan", "searchProducts");
    if (text(obj(contract).status || "") === "blocked") {
      return buildErrorResult("provider_preparation_blocked", { code:0, message:"provider_preparation_blocked" }, {}, contract, runtime);
    }
    if (!runtimeApproved(runtime)) {
      return buildErrorResult("real_provider_readonly_not_approved", { code:403, message:"real_provider_readonly_not_approved" }, {}, contract, runtime);
    }
    const credentials = resolveCredentials(runtime, params);
    if (!credentials.applicationId || !credentials.accessKey) {
      return buildErrorResult("runtime_credentials_missing", { code:401, message:"runtime_credentials_missing" }, {}, contract, runtime);
    }
    const requestInfo = buildProductRequest(params, runtime, credentials);
    if (!requestInfo.endpointUrl || !requestInfo.keywordPresent) {
      return buildErrorResult("request_schema_invalid", { code:422, message:"request_schema_invalid" }, requestInfo, contract, runtime);
    }

    let attempt = 0;
    const maxRetry = retryLimit(runtime);
    while (attempt <= maxRetry) {
      try {
        const response = await runFetch(requestInfo, runtime);
        const payload = await parseResponse(response);
        const validation = validateResponsePayload(payload);
        if (validation.valid !== true) {
          return buildErrorResult("invalid_response_schema", { code:422, message:validation.errors.join(",") || "invalid_response_schema" }, requestInfo, contract, runtime);
        }
        const fetchedAt = nowIso(runtime);
        const mappedResults = validation.items.map(function (item) {
          return buildMappedResult(item, Object.assign({}, params, { runtime:runtime }), fetchedAt);
        });
        const filtered = buildSafetyFilter({
          providerId:"rakuten_japan",
          sourceType:"rakuten_api",
          timestamp:fetchedAt,
          results:mappedResults
        });
        return clone({
          providerId:"rakuten_japan",
          status:"ready",
          available:true,
          sourceType:"rakuten_api",
          dataConfidence:"official_api_readonly",
          timestamp:fetchedAt,
          results:toArray(obj(obj(filtered).filteredResult).results),
          filteredFields:toArray(filtered.filteredFields),
          warnings:toArray(filtered.warnings),
          metadata:{
            endpointName:requestInfo.endpointName,
            requestMethod:requestInfo.requestMethod,
            providerPreparationStatus:text(obj(contract).status || "documented"),
            dataEnvironment:"real_provider_readonly",
            retryCount:attempt
          },
          auditTrace:{
            providerId:"rakuten_japan",
            executionMode:"real_provider_readonly",
            networkExecuted:true,
            credentialValuesStored:false,
            oauthTokenStored:false,
            passwordStored:false,
            filteredFieldCount:toArray(filtered.filteredFields).length,
            redacted:true
          },
          redacted:true
        });
      } catch (error) {
        const normalizedError = normalizeError(error);
        if (attempt < maxRetry && normalizedError.retryable === true) {
          attempt += 1;
          await waitMs(retryDelayMs(runtime, attempt));
          continue;
        }
        return buildErrorResult("provider_request_failed", error, requestInfo, contract, runtime);
      }
    }

    return buildErrorResult("provider_request_failed", { code:0, message:"provider_request_failed" }, requestInfo, contract, runtime);
  }

  function createGlobalShoppingRakutenRealProviderAdapter(input) {
    const providerId = text(obj(input).providerId || "rakuten_japan");
    return {
      adapterName:ADAPTER_NAME,
      appVersion:GLOBAL_SHOPPING_RAKUTEN_REAL_PROVIDER_ADAPTER_VERSION,
      providerId:providerId,
      searchProducts:function (params) {
        return executeSearchProducts(input, params);
      },
      searchFlights:function () { return Promise.resolve(clone(planned(providerId, "searchFlights"))); },
      searchHotels:function () { return Promise.resolve(clone(planned(providerId, "searchHotels"))); },
      getPrice:function (params) { return executeSearchProducts(input, params); },
      getAvailability:function (params) { return executeSearchProducts(input, params); },
      getShippingEstimate:function () { return Promise.resolve(clone(planned(providerId, "getShippingEstimate"))); },
      getTaxEstimate:function () { return Promise.resolve(clone(planned(providerId, "getTaxEstimate"))); },
      getOfficialUrl:function (params) { return executeSearchProducts(input, params); },
      healthCheck:function () {
        const runtime = runtimeConfig(input, {});
        const credentials = resolveCredentials(runtime, {});
        return Promise.resolve({
          providerId:providerId,
          status:runtimeApproved(runtime) && credentials.applicationId && credentials.accessKey ? "ready" : "sandbox",
          available:runtimeApproved(runtime) && credentials.applicationId && credentials.accessKey,
          sourceType:"rakuten_api",
          dataConfidence:"official_api_readonly",
          timestamp:nowIso(runtime),
          redacted:true
        });
      }
    };
  }

  window.WeishanGlobalShoppingRakutenRealProviderAdapter = {
    GLOBAL_SHOPPING_RAKUTEN_REAL_PROVIDER_ADAPTER_VERSION,
    ADAPTER_NAME,
    createGlobalShoppingRakutenRealProviderAdapter
  };
})();
