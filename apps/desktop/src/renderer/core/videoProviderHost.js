(function(){
  const HOST_ERROR_CODE = Object.freeze({
    PROVIDER_NOT_FOUND:"PROVIDER_NOT_FOUND",
    PROVIDER_DISABLED:"PROVIDER_DISABLED",
    ADAPTER_NOT_BOUND:"ADAPTER_NOT_BOUND",
    ADAPTER_INVALID:"ADAPTER_INVALID",
    REQUEST_INVALID:"REQUEST_INVALID",
    CAPABILITY_UNSUPPORTED:"CAPABILITY_UNSUPPORTED",
    LIMIT_EXCEEDED:"LIMIT_EXCEEDED",
    SUBMIT_FAILED:"SUBMIT_FAILED",
    QUERY_FAILED:"QUERY_FAILED",
    CANCEL_FAILED:"CANCEL_FAILED",
    DOWNLOAD_FAILED:"DOWNLOAD_FAILED",
    NORMALIZATION_FAILED:"NORMALIZATION_FAILED",
    HOST_DISPOSED:"HOST_DISPOSED",
    UNKNOWN:"UNKNOWN"
  });
  const RESULT_STATUS = Object.freeze(["QUEUED", "RUNNING", "SUCCEEDED", "FAILED", "CANCELLED", "UNKNOWN"]);
  const ARTIFACT_TYPES = Object.freeze(["video", "cover", "subtitle", "project", "storyboard", "prompt", "log"]);
  const ADAPTER_METHODS = Object.freeze(["validate", "submit", "query", "cancel", "download", "normalizeResult", "normalizeError"]);
  const SENSITIVE_KEY = /token|accessToken|refreshToken|apiKey|secret|password|authorization|cookie|endpoint|baseUrl|oauth|credential|privateKey|clientSecret/i;
  const MAX_METADATA_DEPTH = 5;

  function text(value){ return String(value == null ? "" : value).trim(); }
  function ensure(condition, error){ if (!condition) throw error; }
  function plainObject(value){ return !!value && typeof value === "object" && !Array.isArray(value); }
  function issue(code, field, message){ return { code, field:field || null, message }; }
  function hostError(code, input){
    const data = plainObject(input) ? input : {};
    return {
      code:Object.prototype.hasOwnProperty.call(HOST_ERROR_CODE, code) ? code : HOST_ERROR_CODE.UNKNOWN,
      message:text(data.message) || "处理失败，请重试",
      providerId:text(data.providerId) || null,
      retryable:data.retryable === true,
      details:sanitizeMetadata(data.details)
    };
  }
  function sanitizeValue(value, depth, seen){
    if (depth > MAX_METADATA_DEPTH) return null;
    if (value == null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
    if (typeof value === "function") return null;
    if (typeof value !== "object" || seen.has(value)) return null;
    seen.add(value);
    if (Array.isArray(value)) return value.map((item) => sanitizeValue(item, depth + 1, seen)).filter((item) => item !== null);
    const output = {};
    Object.keys(value).forEach((key) => {
      if (SENSITIVE_KEY.test(key)) return;
      const item = sanitizeValue(value[key], depth + 1, seen);
      if (item !== null) output[key] = item;
    });
    return output;
  }
  function sanitizeMetadata(value){ return plainObject(value) ? sanitizeValue(value, 0, new Set()) : {}; }
  function cloneRequest(input){
    const data = plainObject(input) ? input : {};
    return {
      title:text(data.title),
      prompt:text(data.prompt),
      negativePrompt:text(data.negativePrompt) || null,
      images:Array.isArray(data.images) ? data.images.map((image) => text(image)).filter(Boolean) : [],
      duration:data.duration == null || data.duration === "" ? null : Number(data.duration),
      resolution:text(data.resolution) || null,
      fps:data.fps == null || data.fps === "" ? null : Number(data.fps),
      seed:data.seed == null || data.seed === "" ? null : Number(data.seed),
      style:text(data.style) || null,
      camera:text(data.camera) || null,
      motion:text(data.motion) || null,
      metadata:sanitizeMetadata(data.metadata)
    };
  }
  function validNumber(value){ return value == null || Number.isFinite(value); }
  function resolveRequiredCapabilities(request){
    const required = [];
    if (request.prompt) required.push("textToVideo");
    if (request.images.length > 0) required.push("imageToVideo");
    if (request.negativePrompt) required.push("negativePrompt");
    if (request.seed != null) required.push("seed");
    if (request.camera) required.push("cameraControl");
    if (request.motion) required.push("motionControl");
    if (request.style) required.push("styleControl");
    if (request.duration != null) required.push("durationControl");
    if (request.resolution) required.push("resolutionControl");
    if (request.fps != null) required.push("fpsControl");
    return required;
  }
  function validateProviderLimits(descriptor, request){
    const limits = descriptor && descriptor.limits ? descriptor.limits : {};
    const errors = [];
    if (limits.maxPromptLength != null && request.prompt.length > limits.maxPromptLength) errors.push(issue("LIMIT_EXCEEDED", "prompt", "内容长度超过限制"));
    if (limits.maxImages != null && request.images.length > limits.maxImages) errors.push(issue("LIMIT_EXCEEDED", "images", "素材数量超过限制"));
    if (request.duration != null && limits.minDurationSeconds != null && request.duration < limits.minDurationSeconds) errors.push(issue("LIMIT_EXCEEDED", "duration", "时长低于限制"));
    if (request.duration != null && limits.maxDurationSeconds != null && request.duration > limits.maxDurationSeconds) errors.push(issue("LIMIT_EXCEEDED", "duration", "时长超过限制"));
    if (request.metadata.batchSize != null && limits.maxBatchSize != null && Number(request.metadata.batchSize) > limits.maxBatchSize) errors.push(issue("LIMIT_EXCEEDED", "batchSize", "批量数量超过限制"));
    return errors;
  }
  function validateAdapterContract(adapter){
    const source = plainObject(adapter) ? adapter : {};
    const missingMethods = ADAPTER_METHODS.filter((name) => typeof source[name] !== "function");
    return { valid:!!text(source.providerId) && missingMethods.length === 0, missingMethods, providerId:text(source.providerId) || null };
  }
  function safeUsage(value){
    const source = plainObject(value) ? value : {};
    return {
      inputUnits:Number.isFinite(Number(source.inputUnits)) ? Number(source.inputUnits) : null,
      outputUnits:Number.isFinite(Number(source.outputUnits)) ? Number(source.outputUnits) : null,
      durationSeconds:Number.isFinite(Number(source.durationSeconds)) ? Number(source.durationSeconds) : null,
      estimatedCost:Number.isFinite(Number(source.estimatedCost)) ? Number(source.estimatedCost) : null,
      currency:text(source.currency) || null
    };
  }
  function safeUri(value){
    const uri = text(value);
    return /^local-placeholder:\/\/[a-z0-9._-]+$/i.test(uri) ? uri : null;
  }
  function sanitizeProviderResult(input, providerId){
    const data = plainObject(input) ? input : {};
    return {
      providerId:text(providerId),
      providerTaskId:text(data.providerTaskId),
      status:RESULT_STATUS.includes(text(data.status)) ? text(data.status) : "UNKNOWN",
      artifacts:Array.isArray(data.artifacts) ? data.artifacts.map((artifact) => {
        const source = plainObject(artifact) ? artifact : {};
        const type = text(source.type);
        if (!ARTIFACT_TYPES.includes(type)) return null;
        return { type, name:text(source.name), mimeType:text(source.mimeType) || null, sizeBytes:Number.isFinite(Number(source.sizeBytes)) && Number(source.sizeBytes) >= 0 ? Number(source.sizeBytes) : null, uri:safeUri(source.uri), metadata:sanitizeMetadata(source.metadata) };
      }).filter(Boolean) : [],
      usage:safeUsage(data.usage),
      metadata:sanitizeMetadata(data.metadata)
    };
  }
  function createFakeVideoProviderAdapter(options){
    const config = plainObject(options) ? options : {};
    const providerId = text(config.providerId) || "fake-video";
    const failureMode = text(config.failureMode);
    function failWhen(mode){ if (failureMode === mode) throw { mode }; }
    function result(status){ return { providerTaskId:"fake-task", status, artifacts:[{ type:"video", name:"placeholder", mimeType:"video/placeholder", sizeBytes:0, uri:"local-placeholder://video.mp4", metadata:{ localOnly:true } }], usage:{ inputUnits:1, outputUnits:1, durationSeconds:0, estimatedCost:0, currency:"LOCAL" }, metadata:{ localOnly:true, ignored:"not-sensitive" }, ignored:"remove" }; }
    return {
      providerId,
      validate(){ if (failureMode === "validate") return { valid:false, errors:[issue("REQUEST_INVALID", "prompt", "请求无效")], warnings:[] }; return { valid:true, errors:[], warnings:[] }; },
      submit(){ failWhen("submit"); return result("QUEUED"); },
      query(){ failWhen("query"); return result("RUNNING"); },
      cancel(){ failWhen("cancel"); return result("CANCELLED"); },
      download(){ failWhen("download"); return { providerTaskId:"fake-task", status:"SUCCEEDED", artifacts:result("SUCCEEDED").artifacts, usage:{}, metadata:{} }; },
      normalizeResult(value){ failWhen("normalize"); return value; },
      normalizeError(){ return { code:"UNKNOWN", message:"处理失败，请重试" }; }
    };
  }

  function createVideoProviderHost(options){
    const config = plainObject(options) ? options : {};
    const platform = config.platform;
    ensure(platform && typeof platform.get === "function", hostError("UNKNOWN", { message:"Provider Platform 不可用" }));
    const bindings = new Map();
    const activeCounts = new Map();
    let disposed = false;
    function ensureActive(){ ensure(!disposed, hostError("HOST_DISPOSED", { message:"服务已关闭" })); }
    function registeredDescriptorFor(providerId){
      const descriptor = platform.get(providerId);
      ensure(descriptor, hostError("PROVIDER_NOT_FOUND", { providerId, message:"未找到服务" }));
      return descriptor;
    }
    function descriptorFor(providerId){
      const descriptor = registeredDescriptorFor(providerId);
      ensure(descriptor.enabled === true && descriptor.status !== "DISABLED", hostError("PROVIDER_DISABLED", { providerId, message:"服务当前不可用" }));
      return descriptor;
    }
    function bindingFor(providerId){
      const binding = bindings.get(text(providerId));
      ensure(binding, hostError("ADAPTER_NOT_BOUND", { providerId, message:"服务尚未准备好" }));
      return binding;
    }
    function withInvocation(providerId, descriptor, code, callback){
      const current = activeCounts.get(providerId) || 0;
      ensure(descriptor.limits.maxConcurrentTasks == null || current < descriptor.limits.maxConcurrentTasks, hostError("LIMIT_EXCEEDED", { providerId, message:"当前任务数量超过限制", details:{ field:"maxConcurrentTasks" } }));
      activeCounts.set(providerId, current + 1);
      try { return callback(); }
      catch (error) { throw hostError(code, { providerId, message:"处理失败，请重试" }); }
      finally { activeCounts.set(providerId, Math.max(0, (activeCounts.get(providerId) || 1) - 1)); }
    }
    function registerAdapter(providerId, adapter, metadata){
      ensureActive();
      const descriptor = registeredDescriptorFor(providerId);
      const contract = validateAdapterContract(adapter);
      ensure(contract.valid && contract.providerId === descriptor.providerId, hostError("ADAPTER_INVALID", { providerId, message:"服务适配器无效", details:{ missingMethods:contract.missingMethods } }));
      ensure(!bindings.has(descriptor.providerId), hostError("ADAPTER_INVALID", { providerId, message:"服务适配器已绑定" }));
      bindings.set(descriptor.providerId, { providerId:descriptor.providerId, adapter, descriptor, createdAt:"local-binding", metadata:sanitizeMetadata(metadata) });
      return { providerId:descriptor.providerId, createdAt:"local-binding", metadata:sanitizeMetadata(metadata) };
    }
    function unregisterAdapter(providerId){ ensureActive(); return bindings.delete(text(providerId)); }
    function hasAdapter(providerId){ ensureActive(); return bindings.has(text(providerId)); }
    function listAdapters(){ ensureActive(); return Array.from(bindings.values()).map((binding) => ({ providerId:binding.providerId, createdAt:binding.createdAt, metadata:sanitizeMetadata(binding.metadata) })); }
    function validateRequest(providerId, request){
      ensureActive();
      const errors = [];
      const warnings = [];
      let descriptor;
      let binding;
      try { descriptor = descriptorFor(providerId); } catch (error) { return { valid:false, errors:[issue(error.code || "UNKNOWN", null, error.message || "处理失败，请重试")], warnings, normalizedRequest:null }; }
      try { binding = bindingFor(providerId); } catch (error) { return { valid:false, errors:[issue(error.code || "UNKNOWN", null, error.message || "处理失败，请重试")], warnings, normalizedRequest:null }; }
      const normalizedRequest = cloneRequest(request);
      if (!validNumber(normalizedRequest.duration)) errors.push(issue("REQUEST_INVALID", "duration", "时长无效"));
      if (!validNumber(normalizedRequest.fps)) errors.push(issue("REQUEST_INVALID", "fps", "帧率无效"));
      if (!validNumber(normalizedRequest.seed)) errors.push(issue("REQUEST_INVALID", "seed", "随机种子无效"));
      const required = resolveRequiredCapabilities(normalizedRequest);
      required.forEach((capability) => { if (descriptor.capabilities[capability] !== true) errors.push(issue("CAPABILITY_UNSUPPORTED", capability, "服务不支持该能力")); });
      errors.push(...validateProviderLimits(descriptor, normalizedRequest));
      if (errors.length === 0) {
        try {
          const adapterValidation = binding.adapter.validate(normalizedRequest) || {};
          if (adapterValidation.valid !== true) errors.push(issue("REQUEST_INVALID", null, "请求无效"));
          if (Array.isArray(adapterValidation.warnings)) adapterValidation.warnings.forEach(() => warnings.push(issue("REQUEST_WARNING", null, "请确认请求设置")));
        } catch (_) { errors.push(issue("REQUEST_INVALID", null, "请求无效")); }
      }
      return { valid:errors.length === 0, errors, warnings, normalizedRequest };
    }
    function normalizeResult(providerId, rawResult){
      ensureActive();
      const binding = bindingFor(providerId);
      try { return sanitizeProviderResult(binding.adapter.normalizeResult(rawResult), providerId); }
      catch (_) { throw hostError("NORMALIZATION_FAILED", { providerId, message:"处理失败，请重试" }); }
    }
    function normalizeError(providerId, rawError){
      if (disposed) return hostError("HOST_DISPOSED", { providerId, message:"服务已关闭" });
      const binding = bindings.get(text(providerId));
      if (!binding) return hostError("ADAPTER_NOT_BOUND", { providerId, message:"服务尚未准备好" });
      try { binding.adapter.normalizeError(rawError); } catch (_) {}
      return hostError("UNKNOWN", { providerId, message:"处理失败，请重试" });
    }
    function submitTask(providerId, request){
      ensureActive();
      const validation = validateRequest(providerId, request);
      ensure(validation.valid, hostError("REQUEST_INVALID", { providerId, message:"请求无效", details:{ errors:validation.errors.map((entry) => entry.code) } }));
      const descriptor = descriptorFor(providerId);
      const binding = bindingFor(providerId);
      const rawResult = withInvocation(providerId, descriptor, "SUBMIT_FAILED", () => binding.adapter.submit(validation.normalizedRequest));
      return normalizeResult(providerId, rawResult);
    }
    function queryTask(providerId, providerTaskId){
      ensureActive();
      const descriptor = descriptorFor(providerId);
      const binding = bindingFor(providerId);
      const rawResult = withInvocation(providerId, descriptor, "QUERY_FAILED", () => binding.adapter.query(text(providerTaskId)));
      return normalizeResult(providerId, rawResult);
    }
    function cancelTask(providerId, providerTaskId){
      ensureActive();
      const descriptor = descriptorFor(providerId);
      const binding = bindingFor(providerId);
      const rawResult = withInvocation(providerId, descriptor, "CANCEL_FAILED", () => binding.adapter.cancel(text(providerTaskId)));
      return normalizeResult(providerId, rawResult);
    }
    function downloadArtifacts(providerId, providerTaskId){
      ensureActive();
      const descriptor = descriptorFor(providerId);
      const binding = bindingFor(providerId);
      const rawResult = withInvocation(providerId, descriptor, "DOWNLOAD_FAILED", () => binding.adapter.download(text(providerTaskId)));
      return normalizeResult(providerId, rawResult).artifacts;
    }
    function dispose(){
      if (disposed) return;
      bindings.clear();
      activeCounts.clear();
      disposed = true;
    }
    return { registerAdapter, unregisterAdapter, hasAdapter, listAdapters, validateRequest, submitTask, queryTask, cancelTask, downloadArtifacts, dispose };
  }

  window.WeishanVideoProviderHost = {
    HOST_ERROR_CODE,
    validateAdapterContract,
    resolveRequiredCapabilities,
    validateProviderLimits,
    sanitizeProviderResult,
    createFakeVideoProviderAdapter,
    createVideoProviderHost
  };
})();
