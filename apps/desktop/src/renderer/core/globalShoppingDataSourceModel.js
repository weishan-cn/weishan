;(function () {
  "use strict";

  const GLOBAL_SHOPPING_DATA_SOURCE_MODEL_VERSION = "4.2.8";
  const MODEL_NAME = "global_shopping_data_source_model_v1";
  const ALLOWED_SOURCE_TYPES = {
    official_api:true,
    official_web:true,
    sandbox:true,
    manual:true,
    unknown:true
  };
  const ALLOWED_SOURCE_STATUS = {
    sandbox:true,
    planned:true,
    disabled:true,
    unknown:true
  };
  const ALLOWED_TRUST_LEVELS = {
    high:true,
    medium:true,
    low:true,
    review:true
  };

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalizeSourceType(value) {
    const type = text(value || "sandbox");
    if (type === "official_api" || type === "official_web") return "unknown";
    return ALLOWED_SOURCE_TYPES[type] ? type : "unknown";
  }

  function normalizeSourceStatus(value) {
    const status = text(value || "planned");
    return ALLOWED_SOURCE_STATUS[status] ? status : "unknown";
  }

  function normalizeTrustLevel(value) {
    const level = text(value || "review");
    return ALLOWED_TRUST_LEVELS[level] ? level : "review";
  }

  function buildDefaultDataPolicy(sourceType, sourceStatus) {
    const readOnly = true;
    const sandboxOnly = sourceType === "sandbox" || sourceStatus === "sandbox" || sourceStatus === "planned";
    return {
      readOnly:readOnly,
      networkAccess:false,
      providerConnection:false,
      rawPayloadPersistence:false,
      tokenStorage:false,
      credentialStorage:false,
      paymentFlow:false,
      orderFlow:false,
      sandboxOnly:sandboxOnly,
      note:sandboxOnly
        ? "当前仅允许 sandbox / planned 数据来源，不连接真实 Provider。"
        : "当前数据来源需要人工复核。"
    };
  }

  function buildGlobalShoppingDataSourceModel(input) {
    const safe = obj(input);
    const sourceType = normalizeSourceType(safe.sourceType || "sandbox");
    const sourceStatus = normalizeSourceStatus(safe.sourceStatus || (sourceType === "sandbox" ? "sandbox" : "planned"));
    return clone({
      modelName:MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_DATA_SOURCE_MODEL_VERSION,
      sourceId:text(safe.sourceId || (text(safe.providerId || "provider") + ":" + sourceType + ":" + sourceStatus)),
      providerId:text(safe.providerId || ""),
      sourceType:sourceType,
      sourceStatus:sourceStatus,
      trustLevel:normalizeTrustLevel(safe.trustLevel || "review"),
      lastChecked:text(safe.lastChecked || ""),
      dataPolicy:Object.assign(
        buildDefaultDataPolicy(sourceType, sourceStatus),
        obj(safe.dataPolicy)
      ),
      redacted:true
    });
  }

  window.WeishanGlobalShoppingDataSourceModel = {
    GLOBAL_SHOPPING_DATA_SOURCE_MODEL_VERSION,
    MODEL_NAME,
    buildGlobalShoppingDataSourceModel
  };
})();
