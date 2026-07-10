;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_HEALTH_SIMULATOR_VERSION = "4.2.8";
  const SIMULATOR_NAME = "global_shopping_provider_health_simulator_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function buildGlobalShoppingProviderHealthSimulation(input) {
    const safe = obj(input);
    const healthStatus = text(
      safe.simulatedStatus
      || obj(safe.payload).simulatedHealthStatus
      || obj(safe.provider).simulatedHealthStatus
      || "healthy"
    );
    const mapping = {
      healthy:{ reason:"sandbox_adapter_ready", retryable:false },
      slow:{ reason:"sandbox_latency_warning", retryable:true },
      timeout:{ reason:"sandbox_timeout_simulation", retryable:true },
      rate_limit:{ reason:"sandbox_rate_limit_simulation", retryable:true },
      disabled:{ reason:"sandbox_provider_disabled", retryable:false }
    };
    const selected = mapping[healthStatus] || { reason:"sandbox_status_unknown", retryable:false };
    return clone({
      simulatorName:SIMULATOR_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_HEALTH_SIMULATOR_VERSION,
      providerId:text(safe.providerId || obj(safe.provider).providerId || ""),
      healthStatus:healthStatus,
      reason:selected.reason,
      retryable:selected.retryable,
      sourceType:"sandbox",
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderHealthSimulator = {
    GLOBAL_SHOPPING_PROVIDER_HEALTH_SIMULATOR_VERSION,
    SIMULATOR_NAME,
    buildGlobalShoppingProviderHealthSimulation
  };
})();
