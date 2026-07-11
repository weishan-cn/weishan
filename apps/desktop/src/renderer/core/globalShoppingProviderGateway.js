;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_GATEWAY_VERSION = "4.2.8";
  const GATEWAY_NAME = "global_shopping_provider_gateway_v1";

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

  function permissionApi() { return window.WeishanGlobalShoppingProviderPermissionModel || {}; }
  function policyApi() { return window.WeishanGlobalShoppingProviderRequestPolicy || {}; }
  function filterApi() { return window.WeishanGlobalShoppingProviderResponseSafetyFilter || {}; }
  function errorApi() { return window.WeishanGlobalShoppingProviderErrorNormalizer || {}; }
  function registryApi() { return window.WeishanGlobalShoppingProviderRegistry || {}; }
  function adapterApi() { return window.WeishanGlobalShoppingSandboxProviderAdapter || {}; }
  function registrySandboxApi() { return window.WeishanGlobalShoppingSandboxAdapterRegistry || {}; }
  function contractApi() { return window.WeishanGlobalShoppingProviderAdapterContract || {}; }
  function normalizerApi() { return window.WeishanGlobalShoppingProviderResponseNormalizer || {}; }
  function healthSimulatorApi() { return window.WeishanGlobalShoppingProviderHealthSimulator || {}; }
  function configurationApi() { return window.WeishanGlobalShoppingProviderConfigurationSchema || {}; }
  function featureFlagApi() { return window.WeishanGlobalShoppingProviderFeatureFlag || {}; }
  function versionRegistryApi() { return window.WeishanGlobalShoppingProviderVersionRegistry || {}; }
  function productionReadinessApi() { return window.WeishanGlobalShoppingProviderProductionReadiness || {}; }
  function rakutenPreparationApi() { return window.WeishanGlobalShoppingRakutenRealProviderAdapterContractLayer || {}; }
  function rakutenRealAdapterApi() { return window.WeishanGlobalShoppingRakutenRealProviderAdapter || {}; }

  function findProvider(providerId) {
    const api = registryApi();
    if (typeof api.findGlobalShoppingProviderById === "function") {
      return api.findGlobalShoppingProviderById(providerId);
    }
    if (typeof api.listGlobalShoppingProviders === "function") {
      return (api.listGlobalShoppingProviders() || []).find(function (item) {
        return text(item.providerId || "") === text(providerId);
      }) || null;
    }
    return null;
  }

  function buildPermission(input) {
    return typeof permissionApi().buildGlobalShoppingProviderPermissionModel === "function"
      ? permissionApi().buildGlobalShoppingProviderPermissionModel(input)
      : { allowed:false, requiredPermission:"" };
  }

  function buildPolicy(input) {
    return typeof policyApi().buildGlobalShoppingProviderRequestPolicy === "function"
      ? policyApi().buildGlobalShoppingProviderRequestPolicy(input)
      : { allowed:false, reason:"policy_unavailable", warnings:[] };
  }

  function buildFilter(input) {
    return typeof filterApi().buildGlobalShoppingProviderResponseSafetyFilter === "function"
      ? filterApi().buildGlobalShoppingProviderResponseSafetyFilter(input)
      : { safe:true, filteredFields:[], warnings:[], filteredResult:input };
  }

  function buildError(input) {
    return typeof errorApi().buildGlobalShoppingProviderErrorNormalizer === "function"
      ? errorApi().buildGlobalShoppingProviderErrorNormalizer(input)
      : { code:0, category:"unknown", retryable:false, message:"provider_error_unknown" };
  }

  function buildNormalizedResponse(input) {
    return typeof normalizerApi().buildGlobalShoppingNormalizedProviderResponse === "function"
      ? normalizerApi().buildGlobalShoppingNormalizedProviderResponse(input)
      : { normalizedResults:[] };
  }

  function buildHealthSimulation(input) {
    return typeof healthSimulatorApi().buildGlobalShoppingProviderHealthSimulation === "function"
      ? healthSimulatorApi().buildGlobalShoppingProviderHealthSimulation(input)
      : { healthStatus:"healthy", reason:"simulator_unavailable", retryable:false };
  }

  function validateContract(input) {
    return typeof contractApi().validateAdapterContract === "function"
      ? contractApi().validateAdapterContract(input)
      : { valid:true, errors:[], checkedMethods:[] };
  }
  function validateRealContractAsync(input) {
    return typeof contractApi().validateRealProviderAdapterContractAsync === "function"
      ? contractApi().validateRealProviderAdapterContractAsync(input)
      : Promise.resolve({ valid:false, errors:["real_contract_validator_unavailable"], checkedMethods:[] });
  }

  function buildConfigurationCheck(input) {
    if (typeof configurationApi().buildGlobalShoppingProviderConfigurationSchema !== "function") {
      return { valid:false, status:"draft", reason:"configuration_schema_unavailable" };
    }
    const configuration = configurationApi().buildGlobalShoppingProviderConfigurationSchema(input);
    return Object.assign({}, configuration, {
      reason:configuration.valid === true ? "configuration_valid" : "configuration_invalid"
    });
  }

  function buildFeatureFlagCheck(input) {
    if (typeof featureFlagApi().buildGlobalShoppingProviderFeatureFlag !== "function") {
      return { providerEnabled:false, regionEnabled:false, categoryEnabled:false, effectiveState:"disabled" };
    }
    return featureFlagApi().buildGlobalShoppingProviderFeatureFlag(input);
  }

  function buildVersionCheck(input) {
    if (typeof versionRegistryApi().getGlobalShoppingProviderVersionRecord !== "function") {
      return { adapterVersion:"planned", contractVersion:"4.2.8", compatibility:"unknown", status:"testing" };
    }
    return versionRegistryApi().getGlobalShoppingProviderVersionRecord(input);
  }

  function buildProductionReadiness(input) {
    if (typeof productionReadinessApi().buildGlobalShoppingProviderProductionReadiness !== "function") {
      return { ready:false, readinessLevel:"unknown", blockers:["production_readiness_unavailable"], warnings:[] };
    }
    return productionReadinessApi().buildGlobalShoppingProviderProductionReadiness(input);
  }

  function buildRealProviderPreparation(input) {
    const safe = obj(input);
    if (text(safe.providerId || "") === "rakuten_japan" && typeof rakutenPreparationApi().buildGlobalShoppingRakutenRealProviderAdapterContractLayer === "function") {
      return rakutenPreparationApi().buildGlobalShoppingRakutenRealProviderAdapterContractLayer({
        providerId:"rakuten_japan",
        operation:text(safe.operation || "searchProducts")
      });
    }
    return {
      providerId:text(safe.providerId || ""),
      status:"sandbox_only",
      stage:"sandbox_only",
      blockers:[],
      warnings:[]
    };
  }

  function createAdapter(input) {
    const safe = obj(input);
    const sandboxEntry = typeof registrySandboxApi().findGlobalShoppingSandboxAdapter === "function"
      ? registrySandboxApi().findGlobalShoppingSandboxAdapter({
        providerId:text(obj(safe.provider).providerId || safe.providerId || ""),
        category:text(safe.category || "")
      })
      : null;
    const globalName = text(obj(sandboxEntry).adapterGlobal || "");
    if (globalName && window[globalName] && (typeof window[globalName].createGlobalShoppingSandboxAdapter === "function" || typeof window[globalName].createGlobalShoppingProviderAdapter === "function" || typeof window[globalName].createGlobalShoppingProviderSandboxAdapter === "function")) {
      return window[globalName].createGlobalShoppingSandboxAdapter
        ? window[globalName].createGlobalShoppingSandboxAdapter(safe)
        : (window[globalName].createGlobalShoppingProviderAdapter
          ? window[globalName].createGlobalShoppingProviderAdapter(safe)
          : window[globalName].createGlobalShoppingProviderSandboxAdapter(safe));
    }
    return typeof adapterApi().createGlobalShoppingSandboxProviderAdapter === "function"
      ? adapterApi().createGlobalShoppingSandboxProviderAdapter(safe)
      : null;
  }

  function createRealAdapter(input) {
    const safe = obj(input);
    if (text(obj(safe.provider).providerId || safe.providerId || "") === "rakuten_japan"
      && typeof rakutenRealAdapterApi().createGlobalShoppingRakutenRealProviderAdapter === "function") {
      return rakutenRealAdapterApi().createGlobalShoppingRakutenRealProviderAdapter(safe);
    }
    return null;
  }

  function gatewayTraceStep(step, details) {
    return {
      step:text(step || ""),
      details:clone(obj(details))
    };
  }

  function gatewayAudit(input) {
    const safe = obj(input);
    return {
      gatewayName:GATEWAY_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_GATEWAY_VERSION,
      providerId:text(safe.providerId || ""),
      operation:text(safe.operation || ""),
      providerStatus:text(safe.providerStatus || "unknown"),
      permissionResult:obj(safe.permissionResult),
      policyResult:obj(safe.policyResult),
      warnings:Array.isArray(safe.warnings) ? safe.warnings.slice() : [],
      gatewayTrace:Array.isArray(safe.gatewayTrace) ? safe.gatewayTrace.slice() : [],
      configurationCheck:obj(safe.configurationCheck),
      featureFlagCheck:obj(safe.featureFlagCheck),
      versionCheck:obj(safe.versionCheck),
      productionReadiness:obj(safe.productionReadiness),
      realProviderPreparation:obj(safe.realProviderPreparation),
      contractValidation:obj(safe.contractValidation),
      healthSimulation:obj(safe.healthSimulation),
      redacted:true
    };
  }

  function callAdapter(adapter, operation, payload) {
    if (!adapter || typeof adapter[operation] !== "function") {
      throw { code:404, message:"provider operation not found" };
    }
    return adapter[operation](payload);
  }

  async function callAdapterAsync(adapter, operation, payload) {
    if (!adapter || typeof adapter[operation] !== "function") {
      throw { code:404, message:"provider operation not found" };
    }
    return await adapter[operation](payload);
  }

  function buildGlobalShoppingProviderGatewayResult(input) {
    const safe = obj(input);
    const providerId = text(safe.providerId || "");
    const operation = text(safe.operation || "");
    const provider = obj(safe.provider || findProvider(providerId));
    const payloadCategory = text(obj(safe.payload).category || safe.category || "");
    const region = text(obj(safe.regionContext).country || "");
    const configurationCheck = buildConfigurationCheck({
      providerId:providerId,
      name:text(provider.name || ""),
      category:payloadCategory || text((provider.categories || [])[0] || "product"),
      regions:Array.isArray(provider.countries) ? provider.countries : [],
      languages:Array.isArray(provider.languages) ? provider.languages : [],
      capabilities:Array.isArray(provider.capabilities) ? provider.capabilities : [],
      officialDomains:Array.isArray(provider.officialDomains) ? provider.officialDomains : [],
      status:text(provider.status || "sandbox") === "disabled" ? "disabled" : "sandbox",
      adapterVersion:"4.2.8-sandbox"
    });
    const featureFlagCheck = buildFeatureFlagCheck({
      providerId:providerId,
      providerEnabled:configurationCheck.status !== "disabled",
      enabledRegions:Array.isArray(provider.countries) ? provider.countries : [],
      enabledCategories:Array.isArray(provider.categories) ? provider.categories : [],
      region:region,
      category:payloadCategory
    });
    const versionCheck = buildVersionCheck({ providerId:providerId });
    const realProviderPreparation = buildRealProviderPreparation({
      providerId:providerId,
      operation:operation
    });
    const productionReadiness = buildProductionReadiness({
      providerId:providerId,
      configuration:configurationCheck,
      featureFlag:featureFlagCheck,
      version:versionCheck,
      realProviderPreparation:realProviderPreparation,
      permissionAllowed:/^(searchProducts|searchFlights|searchHotels|getPrice|getAvailability|getShippingEstimate|getTaxEstimate|getOfficialUrl|healthCheck|syncMetadata|validateSource|getDataTimestamp)$/.test(operation),
      transactionAllowed:/^(createBooking|submitOrder|checkout|pay)$/i.test(operation),
      compliance:{ allowed:true, reason:"sandbox_read_only_allowed" },
      adapterStatus:{
        status:text(provider.status || "registry_only"),
        stage:versionCheck.status === "active" ? "ready" : "sandbox"
      }
    });
    const permissionResult = buildPermission({
      providerId:providerId,
      operation:operation,
      mode:text(safe.permissionMode || "read_only_sandbox")
    });
    const gatewayTrace = [
      gatewayTraceStep("configuration", configurationCheck),
      gatewayTraceStep("feature_flag", featureFlagCheck),
      gatewayTraceStep("version", versionCheck),
      gatewayTraceStep("real_provider_preparation", realProviderPreparation),
      gatewayTraceStep("production_readiness", productionReadiness),
      gatewayTraceStep("permission", permissionResult)
    ];
    if (configurationCheck.valid !== true || featureFlagCheck.effectiveState === "disabled" || versionCheck.status === "deprecated" || versionCheck.status === "disabled" || productionReadiness.readinessLevel === "blocked" || productionReadiness.readinessLevel === "unknown") {
      return clone({
        status:"blocked",
        result:null,
        metadata:{
          providerId:providerId,
          operation:operation,
          sourceType:"sandbox",
          gatewayMode:"sandbox_only",
          gatewayTrace:gatewayTrace,
          configurationCheck:configurationCheck,
          featureFlagCheck:featureFlagCheck,
          versionCheck:versionCheck,
          productionReadiness:productionReadiness,
          realProviderPreparation:realProviderPreparation
        },
        audit:gatewayAudit({
          providerId:providerId,
          operation:operation,
          providerStatus:text(provider.status || "unknown"),
          permissionResult:permissionResult,
          policyResult:{ allowed:false, reason:"production_readiness_blocked", warnings:[] },
          warnings:[
            configurationCheck.valid !== true ? "configuration_invalid" : "",
            featureFlagCheck.effectiveState === "disabled" ? "feature_flag_disabled" : "",
            versionCheck.status === "deprecated" ? "version_deprecated" : "",
            versionCheck.status === "disabled" ? "version_disabled" : ""
          ].concat(productionReadiness.blockers || []).filter(Boolean),
          gatewayTrace:gatewayTrace,
          configurationCheck:configurationCheck,
          featureFlagCheck:featureFlagCheck,
          versionCheck:versionCheck,
          productionReadiness:productionReadiness,
          realProviderPreparation:realProviderPreparation,
          contractValidation:null,
          healthSimulation:null
        }),
        error:null,
        redacted:true
      });
    }
    const policyResult = buildPolicy({
      provider:provider,
      providerId:providerId,
      operation:operation,
      permissionModel:permissionResult,
      regionContext:safe.regionContext,
      dataPolicy:Object.assign({
        noNetwork:true,
        noRealProvider:true,
        noCredentialRead:true,
        noRawPersistence:true
      }, obj(safe.dataPolicy))
    });
    gatewayTrace.push(gatewayTraceStep("policy", policyResult));

    if (policyResult.allowed !== true) {
      return clone({
        status:"blocked",
        result:null,
        metadata:{
          providerId:providerId,
          operation:operation,
          sourceType:"sandbox",
          gatewayMode:"sandbox_only",
          gatewayTrace:gatewayTrace,
          configurationCheck:configurationCheck,
          featureFlagCheck:featureFlagCheck,
          versionCheck:versionCheck,
          productionReadiness:productionReadiness,
          realProviderPreparation:realProviderPreparation
        },
        audit:gatewayAudit({
          providerId:providerId,
          operation:operation,
          providerStatus:text(provider.status || "unknown"),
          permissionResult:permissionResult,
          policyResult:policyResult,
          warnings:policyResult.warnings,
          gatewayTrace:gatewayTrace,
          configurationCheck:configurationCheck,
          featureFlagCheck:featureFlagCheck,
          versionCheck:versionCheck,
          productionReadiness:productionReadiness,
          realProviderPreparation:realProviderPreparation,
          contractValidation:null,
          healthSimulation:null
        }),
        error:null,
        redacted:true
      });
    }

    try {
      const healthSimulation = buildHealthSimulation({
        providerId:providerId,
        provider:provider,
        payload:safe.payload,
        simulatedStatus:text(safe.simulatedHealthStatus || "")
      });
      gatewayTrace.push(gatewayTraceStep("health", healthSimulation));
      if (healthSimulation.healthStatus === "disabled" || healthSimulation.healthStatus === "timeout" || healthSimulation.healthStatus === "rate_limit") {
        throw {
          code:healthSimulation.healthStatus === "rate_limit" ? 429 : 503,
          message:healthSimulation.reason
        };
      }
      const adapter = createAdapter({
        provider:provider,
        providerId:providerId,
        category:text(obj(safe.payload).category || safe.category || "")
      });
      const contractValidation = validateContract({
        adapter:adapter,
        providerId:providerId,
        operation:operation,
        payload:obj(safe.payload)
      });
      gatewayTrace.push(gatewayTraceStep("contract_validation", contractValidation));
      if (contractValidation.valid !== true) {
        return clone({
          status:"blocked",
          result:null,
          metadata:{
            providerId:providerId,
            operation:operation,
            sourceType:"sandbox",
            gatewayMode:"sandbox_only",
            gatewayTrace:gatewayTrace,
            realProviderPreparation:realProviderPreparation
          },
          audit:gatewayAudit({
            providerId:providerId,
            operation:operation,
            providerStatus:text(provider.status || "unknown"),
            permissionResult:permissionResult,
            policyResult:policyResult,
            warnings:["contract_invalid"],
            gatewayTrace:gatewayTrace,
            configurationCheck:configurationCheck,
            featureFlagCheck:featureFlagCheck,
            versionCheck:versionCheck,
            productionReadiness:productionReadiness,
            realProviderPreparation:realProviderPreparation,
            contractValidation:contractValidation,
            healthSimulation:healthSimulation
          }),
          error:buildError({ code:422, message:"adapter contract invalid" }),
          redacted:true
        });
      }
      const rawResult = callAdapter(adapter, operation, obj(safe.payload));
      gatewayTrace.push(gatewayTraceStep("adapter", { status:text(obj(rawResult).status || ""), sourceType:text(obj(rawResult).sourceType || "") }));
      const normalized = buildNormalizedResponse({
        providerId:providerId,
        category:text(obj(safe.payload).category || safe.category || ""),
        response:rawResult
      });
      gatewayTrace.push(gatewayTraceStep("normalizer", { resultCount:Array.isArray(normalized.normalizedResults) ? normalized.normalizedResults.length : 0 }));
      const safety = buildFilter({
        providerId:providerId,
        sourceType:"sandbox",
        confidence:"mock",
        timestamp:text(obj(rawResult).timestamp || ""),
        normalizedResults:normalized.normalizedResults
      });
      gatewayTrace.push(gatewayTraceStep("safety_filter", { safe:safety.safe, filteredFields:safety.filteredFields }));
      return clone({
        status:"sandbox",
        result:{
          providerId:providerId,
          status:"sandbox",
          sourceType:"sandbox",
          confidence:"mock",
          timestamp:text(obj(rawResult).timestamp || ""),
          normalizedResults:obj(safety.filteredResult).normalizedResults || [],
          rawStatus:text(obj(rawResult).status || "sandbox"),
          redacted:true
        },
        metadata:{
          providerId:providerId,
          operation:operation,
          sourceType:"sandbox",
          gatewayMode:"sandbox_only",
          providerStatus:text(provider.status || "registry_only"),
          filteredFields:safety.filteredFields,
          gatewayTrace:gatewayTrace,
          configurationCheck:configurationCheck,
          featureFlagCheck:featureFlagCheck,
          versionCheck:versionCheck,
          productionReadiness:productionReadiness,
          realProviderPreparation:realProviderPreparation,
          contractValidation:contractValidation,
          healthSimulation:healthSimulation
        },
        audit:gatewayAudit({
          providerId:providerId,
          operation:operation,
          providerStatus:text(provider.status || "registry_only"),
          permissionResult:permissionResult,
          policyResult:policyResult,
          warnings:(policyResult.warnings || []).concat(safety.warnings || []).concat(healthSimulation.healthStatus === "slow" ? ["sandbox_latency_warning"] : []),
          gatewayTrace:gatewayTrace,
          configurationCheck:configurationCheck,
          featureFlagCheck:featureFlagCheck,
          versionCheck:versionCheck,
          productionReadiness:productionReadiness,
          realProviderPreparation:realProviderPreparation,
          contractValidation:contractValidation,
          healthSimulation:healthSimulation
        }),
        error:null,
        redacted:true
      });
    } catch (error) {
      const normalizedError = buildError(error);
      gatewayTrace.push(gatewayTraceStep("error", normalizedError));
      return clone({
        status:"failed_safe",
        result:null,
        metadata:{
          providerId:providerId,
          operation:operation,
          sourceType:"sandbox",
          gatewayMode:"sandbox_only",
          providerStatus:text(provider.status || "unknown"),
          gatewayTrace:gatewayTrace,
          realProviderPreparation:realProviderPreparation
        },
        audit:gatewayAudit({
          providerId:providerId,
          operation:operation,
          providerStatus:text(provider.status || "unknown"),
          permissionResult:permissionResult,
          policyResult:policyResult,
          warnings:[normalizedError.category],
          gatewayTrace:gatewayTrace,
          configurationCheck:configurationCheck,
          featureFlagCheck:featureFlagCheck,
          versionCheck:versionCheck,
          productionReadiness:productionReadiness,
          realProviderPreparation:realProviderPreparation,
          contractValidation:null,
          healthSimulation:null
        }),
        error:normalizedError,
        redacted:true
      });
    }
  }

  async function buildGlobalShoppingProviderGatewayResultAsync(input) {
    const safe = obj(input);
    const providerId = text(safe.providerId || "");
    const operation = text(safe.operation || "");
    const executionMode = text(safe.executionMode || "");
    if (executionMode !== "real_provider_readonly") {
      return buildGlobalShoppingProviderGatewayResult(input);
    }
    const provider = obj(safe.provider || findProvider(providerId));
    const payloadCategory = text(obj(safe.payload).category || safe.category || "");
    const region = text(obj(safe.regionContext).country || "");
    const configurationCheck = buildConfigurationCheck({
      providerId:providerId,
      name:text(provider.name || ""),
      category:payloadCategory || text((provider.categories || [])[0] || "product"),
      regions:Array.isArray(provider.countries) ? provider.countries : [],
      languages:Array.isArray(provider.languages) ? provider.languages : [],
      capabilities:Array.isArray(provider.capabilities) ? provider.capabilities : [],
      officialDomains:Array.isArray(provider.officialDomains) ? provider.officialDomains : [],
      status:"sandbox",
      adapterVersion:"4.2.8-rakuten-real-readonly"
    });
    const featureFlagCheck = buildFeatureFlagCheck({
      providerId:providerId,
      providerEnabled:configurationCheck.status !== "disabled",
      enabledRegions:Array.isArray(provider.countries) ? provider.countries : [],
      enabledCategories:Array.isArray(provider.categories) ? provider.categories : [],
      region:region,
      category:payloadCategory || "product"
    });
    const versionCheck = buildVersionCheck({ providerId:providerId });
    const realProviderPreparation = buildRealProviderPreparation({
      providerId:providerId,
      operation:operation
    });
    const productionReadiness = buildProductionReadiness({
      providerId:providerId,
      configuration:configurationCheck,
      featureFlag:featureFlagCheck,
      version:versionCheck,
      realProviderPreparation:realProviderPreparation,
      permissionAllowed:/^(searchProducts|getPrice|getAvailability|getOfficialUrl|healthCheck)$/.test(operation),
      transactionAllowed:false,
      compliance:{ allowed:true, reason:"real_provider_read_only_allowed" },
      adapterStatus:{
        status:text(provider.status || "registry_only"),
        stage:"sandbox"
      }
    });
    const permissionResult = buildPermission({
      providerId:providerId,
      operation:operation,
      mode:"real_provider_readonly"
    });
    const gatewayTrace = [
      gatewayTraceStep("configuration", configurationCheck),
      gatewayTraceStep("feature_flag", featureFlagCheck),
      gatewayTraceStep("version", versionCheck),
      gatewayTraceStep("real_provider_preparation", realProviderPreparation),
      gatewayTraceStep("production_readiness", productionReadiness),
      gatewayTraceStep("permission", permissionResult)
    ];
    if (configurationCheck.valid !== true || featureFlagCheck.effectiveState === "disabled" || productionReadiness.readinessLevel === "blocked" || productionReadiness.readinessLevel === "unknown") {
      return clone({
        status:"blocked",
        result:null,
        metadata:{
          providerId:providerId,
          operation:operation,
          sourceType:"rakuten_api",
          gatewayMode:"real_provider_readonly",
          gatewayTrace:gatewayTrace,
          configurationCheck:configurationCheck,
          featureFlagCheck:featureFlagCheck,
          versionCheck:versionCheck,
          productionReadiness:productionReadiness,
          realProviderPreparation:realProviderPreparation
        },
        audit:gatewayAudit({
          providerId:providerId,
          operation:operation,
          providerStatus:text(provider.status || "unknown"),
          permissionResult:permissionResult,
          policyResult:{ allowed:false, reason:"production_readiness_blocked", warnings:[] },
          warnings:toArray(productionReadiness.blockers),
          gatewayTrace:gatewayTrace,
          configurationCheck:configurationCheck,
          featureFlagCheck:featureFlagCheck,
          versionCheck:versionCheck,
          productionReadiness:productionReadiness,
          realProviderPreparation:realProviderPreparation,
          contractValidation:null,
          healthSimulation:null
        }),
        error:null,
        redacted:true
      });
    }
    const policyResult = buildPolicy({
      provider:provider,
      providerId:providerId,
      operation:operation,
      permissionModel:permissionResult,
      regionContext:safe.regionContext,
      allowReadOnlyRealProvider:true,
      dataPolicy:Object.assign({
        noNetwork:false,
        noRealProvider:false,
        noCredentialRead:false,
        noRawPersistence:true
      }, obj(safe.dataPolicy))
    });
    gatewayTrace.push(gatewayTraceStep("policy", policyResult));
    if (policyResult.allowed !== true) {
      return clone({
        status:"blocked",
        result:null,
        metadata:{
          providerId:providerId,
          operation:operation,
          sourceType:"rakuten_api",
          gatewayMode:"real_provider_readonly",
          gatewayTrace:gatewayTrace,
          configurationCheck:configurationCheck,
          featureFlagCheck:featureFlagCheck,
          versionCheck:versionCheck,
          productionReadiness:productionReadiness,
          realProviderPreparation:realProviderPreparation
        },
        audit:gatewayAudit({
          providerId:providerId,
          operation:operation,
          providerStatus:text(provider.status || "unknown"),
          permissionResult:permissionResult,
          policyResult:policyResult,
          warnings:policyResult.warnings,
          gatewayTrace:gatewayTrace,
          configurationCheck:configurationCheck,
          featureFlagCheck:featureFlagCheck,
          versionCheck:versionCheck,
          productionReadiness:productionReadiness,
          realProviderPreparation:realProviderPreparation,
          contractValidation:null,
          healthSimulation:null
        }),
        error:null,
        redacted:true
      });
    }
    try {
      const adapter = createRealAdapter({
        provider:provider,
        providerId:providerId,
        category:payloadCategory,
        runtime:safe.runtime
      });
      const contractValidation = await validateRealContractAsync({
        adapter:adapter,
        providerId:providerId,
        operation:operation,
        payload:obj(safe.payload)
      });
      gatewayTrace.push(gatewayTraceStep("contract_validation", contractValidation));
      if (contractValidation.valid !== true) {
        return clone({
          status:"blocked",
          result:null,
          metadata:{
            providerId:providerId,
            operation:operation,
            sourceType:"rakuten_api",
            gatewayMode:"real_provider_readonly",
            gatewayTrace:gatewayTrace,
            realProviderPreparation:realProviderPreparation
          },
          audit:gatewayAudit({
            providerId:providerId,
            operation:operation,
            providerStatus:text(provider.status || "unknown"),
            permissionResult:permissionResult,
            policyResult:policyResult,
            warnings:["contract_invalid"],
            gatewayTrace:gatewayTrace,
            configurationCheck:configurationCheck,
            featureFlagCheck:featureFlagCheck,
            versionCheck:versionCheck,
            productionReadiness:productionReadiness,
            realProviderPreparation:realProviderPreparation,
            contractValidation:contractValidation,
            healthSimulation:null
          }),
          error:buildError({ code:422, message:"adapter contract invalid" }),
          redacted:true
        });
      }
      const rawResult = await callAdapterAsync(adapter, operation, Object.assign({}, obj(safe.payload), {
        runtime:safe.runtime
      }));
      gatewayTrace.push(gatewayTraceStep("adapter", {
        status:text(obj(rawResult).status || ""),
        sourceType:text(obj(rawResult).sourceType || "")
      }));
      if (text(obj(rawResult).status || "") !== "ready") {
        return clone({
          status:"failed_safe",
          result:null,
          metadata:{
            providerId:providerId,
            operation:operation,
            sourceType:"rakuten_api",
            gatewayMode:"real_provider_readonly",
            gatewayTrace:gatewayTrace,
            realProviderPreparation:realProviderPreparation
          },
          audit:gatewayAudit({
            providerId:providerId,
            operation:operation,
            providerStatus:text(provider.status || "unknown"),
            permissionResult:permissionResult,
            policyResult:policyResult,
            warnings:[text(obj(obj(rawResult).error).category || "unknown")],
            gatewayTrace:gatewayTrace,
            configurationCheck:configurationCheck,
            featureFlagCheck:featureFlagCheck,
            versionCheck:versionCheck,
            productionReadiness:productionReadiness,
            realProviderPreparation:realProviderPreparation,
            contractValidation:contractValidation,
            healthSimulation:null
          }),
          error:buildError(obj(rawResult).error || { code:0, message:"provider_request_failed" }),
          redacted:true
        });
      }
      const safety = buildFilter({
        providerId:providerId,
        sourceType:"rakuten_api",
        confidence:"official_api_readonly",
        timestamp:text(obj(rawResult).timestamp || ""),
        normalizedResults:toArray(rawResult.results)
      });
      gatewayTrace.push(gatewayTraceStep("safety_filter", { safe:safety.safe, filteredFields:safety.filteredFields }));
      return clone({
        status:"real_provider_readonly",
        result:{
          providerId:providerId,
          status:"real_provider_readonly",
          sourceType:"rakuten_api",
          confidence:"official_api_readonly",
          timestamp:text(obj(rawResult).timestamp || ""),
          normalizedResults:toArray(obj(safety.filteredResult).normalizedResults),
          rawStatus:text(obj(rawResult).status || "ready"),
          redacted:true
        },
        metadata:{
          providerId:providerId,
          operation:operation,
          sourceType:"rakuten_api",
          gatewayMode:"real_provider_readonly",
          filteredFields:safety.filteredFields,
          gatewayTrace:gatewayTrace,
          configurationCheck:configurationCheck,
          featureFlagCheck:featureFlagCheck,
          versionCheck:versionCheck,
          productionReadiness:productionReadiness,
          realProviderPreparation:realProviderPreparation,
          contractValidation:contractValidation,
          adapterAuditTrace:obj(rawResult.auditTrace),
          requestEnvironment:"real_provider_readonly"
        },
        audit:gatewayAudit({
          providerId:providerId,
          operation:operation,
          providerStatus:text(provider.status || "registry_only"),
          permissionResult:permissionResult,
          policyResult:policyResult,
          warnings:toArray(policyResult.warnings).concat(toArray(safety.warnings)),
          gatewayTrace:gatewayTrace,
          configurationCheck:configurationCheck,
          featureFlagCheck:featureFlagCheck,
          versionCheck:versionCheck,
          productionReadiness:productionReadiness,
          realProviderPreparation:realProviderPreparation,
          contractValidation:contractValidation,
          healthSimulation:null
        }),
        error:null,
        redacted:true
      });
    } catch (error) {
      const normalizedError = buildError(error);
      gatewayTrace.push(gatewayTraceStep("error", normalizedError));
      return clone({
        status:"failed_safe",
        result:null,
        metadata:{
          providerId:providerId,
          operation:operation,
          sourceType:"rakuten_api",
          gatewayMode:"real_provider_readonly",
          gatewayTrace:gatewayTrace,
          realProviderPreparation:realProviderPreparation
        },
        audit:gatewayAudit({
          providerId:providerId,
          operation:operation,
          providerStatus:text(provider.status || "unknown"),
          permissionResult:permissionResult,
          policyResult:policyResult,
          warnings:[normalizedError.category],
          gatewayTrace:gatewayTrace,
          configurationCheck:configurationCheck,
          featureFlagCheck:featureFlagCheck,
          versionCheck:versionCheck,
          productionReadiness:productionReadiness,
          realProviderPreparation:realProviderPreparation,
          contractValidation:null,
          healthSimulation:null
        }),
        error:normalizedError,
        redacted:true
      });
    }
  }

  window.WeishanGlobalShoppingProviderGateway = {
    GLOBAL_SHOPPING_PROVIDER_GATEWAY_VERSION,
    GATEWAY_NAME,
    buildGlobalShoppingProviderGatewayResult,
    buildGlobalShoppingProviderGatewayResultAsync
  };
})();
