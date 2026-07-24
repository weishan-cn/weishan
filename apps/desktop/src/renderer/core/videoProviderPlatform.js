(function(){
  const PROVIDER_STATUS = Object.freeze({
    EXPERIMENTAL:"EXPERIMENTAL",
    PREVIEW:"PREVIEW",
    BETA:"BETA",
    GA:"GA",
    DEPRECATED:"DEPRECATED",
    DISABLED:"DISABLED"
  });
  const CAPABILITY_KEYS = Object.freeze([
    "textToVideo", "imageToVideo", "extendVideo", "upscaleVideo", "lipSync", "characterConsistency", "multiImageReference",
    "seed", "negativePrompt", "cameraControl", "motionControl", "styleControl", "durationControl", "resolutionControl",
    "fpsControl", "audioGeneration", "subtitleGeneration", "batchGeneration", "streaming", "webhook", "downloadArtifacts"
  ]);
  const LIMIT_KEYS = Object.freeze([
    "maxDurationSeconds", "minDurationSeconds", "maxResolution", "maxPromptLength", "maxImages", "maxConcurrentTasks",
    "maxBatchSize", "maxRetry", "rateLimitPerMinute", "dailyQuota", "monthlyQuota"
  ]);
  const ADAPTER_METHODS = Object.freeze(["validate", "submit", "query", "cancel", "download", "normalizeResult", "normalizeError"]);
  const DESCRIPTOR_FIELDS = Object.freeze(["providerId", "displayName", "vendor", "version", "status", "capabilities", "limits", "priority", "enabled", "metadata"]);
  const SENSITIVE_KEY = /api.?key|token|secret|oauth|endpoint|authorization/i;

  function text(value){ return String(value == null ? "" : value).trim(); }
  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function ensure(condition, message){ if (!condition) throw new Error(message); }
  function plainObject(value){ return !!value && typeof value === "object" && !Array.isArray(value); }
  function safeMetadata(value){
    const data = plainObject(value) ? value : {};
    Object.entries(data).forEach(([key, item]) => {
      ensure(!SENSITIVE_KEY.test(key), "sensitive_provider_metadata");
      if (plainObject(item)) safeMetadata(item);
    });
    return clone(data);
  }
  function providerId(value){
    const id = text(value);
    ensure(/^[a-z][a-z0-9.-]{2,63}$/.test(id), "invalid_provider_id");
    return id;
  }
  function providerStatus(value){
    const status = text(value || PROVIDER_STATUS.DISABLED);
    ensure(Object.prototype.hasOwnProperty.call(PROVIDER_STATUS, status), "invalid_provider_status");
    return status;
  }
  function numberOrNull(value, message){
    if (value == null || value === "") return null;
    const number = Number(value);
    ensure(Number.isFinite(number), message);
    return number;
  }
  function priority(value){
    const number = value == null ? 100 : Number(value);
    ensure(Number.isInteger(number), "invalid_provider_priority");
    return number;
  }
  function normalizeCapabilities(input){
    const source = plainObject(input) ? input : {};
    Object.keys(source).forEach((key) => ensure(CAPABILITY_KEYS.includes(key), "unknown_provider_capability"));
    return CAPABILITY_KEYS.reduce((result, key) => {
      ensure(source[key] === undefined || typeof source[key] === "boolean", "invalid_provider_capability");
      result[key] = source[key] === true;
      return result;
    }, {});
  }
  function normalizeLimits(input){
    const source = plainObject(input) ? input : {};
    Object.keys(source).forEach((key) => ensure(LIMIT_KEYS.includes(key), "unknown_provider_limit"));
    return LIMIT_KEYS.reduce((result, key) => {
      const value = source[key];
      ensure(value == null || (key === "maxResolution" ? typeof value === "string" : Number.isFinite(Number(value))), "invalid_provider_limit");
      result[key] = value == null ? null : (key === "maxResolution" ? text(value) : Number(value));
      return result;
    }, {});
  }
  function createProviderDescriptor(input){
    const data = plainObject(input) ? input : {};
    Object.keys(data).forEach((key) => ensure(DESCRIPTOR_FIELDS.includes(key), "unknown_provider_descriptor_field"));
    const status = providerStatus(data.status);
    ensure(text(data.displayName), "missing_provider_display_name");
    ensure(text(data.vendor), "missing_provider_vendor");
    ensure(text(data.version), "missing_provider_version");
    return {
      providerId:providerId(data.providerId),
      displayName:text(data.displayName),
      vendor:text(data.vendor),
      version:text(data.version),
      status,
      capabilities:normalizeCapabilities(data.capabilities),
      limits:normalizeLimits(data.limits),
      priority:priority(data.priority),
      enabled:data.enabled === true && status !== PROVIDER_STATUS.DISABLED,
      metadata:safeMetadata(data.metadata)
    };
  }
  function createVideoGenerationRequest(input){
    const data = plainObject(input) ? input : {};
    return {
      title:text(data.title),
      prompt:text(data.prompt),
      negativePrompt:text(data.negativePrompt) || null,
      images:Array.isArray(data.images) ? data.images.map((image) => text(image)).filter(Boolean) : [],
      duration:numberOrNull(data.duration, "invalid_video_request_duration"),
      resolution:text(data.resolution) || null,
      fps:numberOrNull(data.fps, "invalid_video_request_fps"),
      seed:numberOrNull(data.seed, "invalid_video_request_seed"),
      style:text(data.style) || null,
      camera:text(data.camera) || null,
      motion:text(data.motion) || null,
      metadata:safeMetadata(data.metadata)
    };
  }
  function createVideoGenerationResult(input){
    const data = plainObject(input) ? input : {};
    return {
      providerId:providerId(data.providerId),
      providerTaskId:text(data.providerTaskId),
      status:text(data.status),
      artifacts:Array.isArray(data.artifacts) ? data.artifacts.map((artifact) => ({ type:text(artifact && artifact.type), title:text(artifact && artifact.title) })).filter((artifact) => artifact.type) : [],
      usage:safeMetadata(data.usage),
      metadata:safeMetadata(data.metadata)
    };
  }
  function validateProviderAdapter(candidate){
    const adapter = plainObject(candidate) ? candidate : {};
    const missingMethods = ADAPTER_METHODS.filter((name) => typeof adapter[name] !== "function");
    return { valid:providerIdSafe(adapter.providerId) && missingMethods.length === 0, missingMethods, providerId:text(adapter.providerId) || null };
  }
  function providerIdSafe(value){ try { providerId(value); return true; } catch (_) { return false; } }

  function createVideoProviderRegistry(){
    const providers = new Map();
    function register(input){
      const descriptor = createProviderDescriptor(input);
      ensure(!providers.has(descriptor.providerId), "duplicate_provider_id");
      providers.set(descriptor.providerId, descriptor);
      return clone(descriptor);
    }
    function unregister(id){ return providers.delete(text(id)); }
    function get(id){ const descriptor = providers.get(text(id)); return descriptor ? clone(descriptor) : null; }
    function list(){ return Array.from(providers.values()).map(clone); }
    function exists(id){ return providers.has(text(id)); }
    function count(){ return providers.size; }
    function update(id, patch){
      const current = providers.get(text(id));
      ensure(current, "provider_not_found");
      return replace(Object.assign({}, current, patch || {}, { providerId:current.providerId }));
    }
    function replace(input){
      const descriptor = createProviderDescriptor(input);
      providers.set(descriptor.providerId, descriptor);
      return clone(descriptor);
    }
    function enable(id){ return update(id, { enabled:true, status:providers.get(text(id)).status === PROVIDER_STATUS.DISABLED ? PROVIDER_STATUS.PREVIEW : providers.get(text(id)).status }); }
    function disable(id){ return update(id, { enabled:false }); }
    function setPriority(id, value){ return update(id, { priority:value }); }
    function clear(){ providers.clear(); }
    return { register, unregister, get, list, exists, count, enable, disable, setPriority, clear };
  }

  function selectProvider(registry, requirements){
    const required = Array.isArray(requirements && requirements.capabilities) ? requirements.capabilities : [];
    required.forEach((capability) => ensure(CAPABILITY_KEYS.includes(capability), "unknown_provider_capability"));
    const candidates = registry.list().filter((descriptor) => descriptor.enabled && descriptor.status !== PROVIDER_STATUS.DISABLED && required.every((capability) => descriptor.capabilities[capability] === true));
    candidates.sort((left, right) => left.priority - right.priority || left.providerId.localeCompare(right.providerId));
    return candidates[0] || null;
  }
  function createProviderPlatform(){
    const registry = createVideoProviderRegistry();
    return {
      register:registry.register,
      unregister:registry.unregister,
      get:registry.get,
      list:registry.list,
      exists:registry.exists,
      count:registry.count,
      enable:registry.enable,
      disable:registry.disable,
      setPriority:registry.setPriority,
      clear:registry.clear,
      selectProvider(requirements){ return selectProvider(registry, requirements); }
    };
  }
  function createFakeProvider(input){
    const descriptor = createProviderDescriptor(input);
    const adapter = {
      providerId:descriptor.providerId,
      validate(){ return { valid:true }; },
      submit(){ return createVideoGenerationResult({ providerId:descriptor.providerId, providerTaskId:"fake-task", status:"accepted" }); },
      query(){ return createVideoGenerationResult({ providerId:descriptor.providerId, providerTaskId:"fake-task", status:"ready" }); },
      cancel(){ return createVideoGenerationResult({ providerId:descriptor.providerId, providerTaskId:"fake-task", status:"cancelled" }); },
      download(){ return []; },
      normalizeResult(result){ return createVideoGenerationResult(Object.assign({}, result || {}, { providerId:descriptor.providerId })); },
      normalizeError(){ return { code:"PROVIDER", message:"失败，请重试" }; }
    };
    return { descriptor, adapter };
  }

  window.WeishanVideoProviderPlatform = {
    PROVIDER_STATUS,
    CAPABILITY_KEYS,
    LIMIT_KEYS,
    ADAPTER_METHODS,
    createProviderDescriptor,
    createVideoGenerationRequest,
    createVideoGenerationResult,
    validateProviderAdapter,
    createVideoProviderRegistry,
    createProviderPlatform,
    selectProvider,
    createFakeProvider
  };
})();
