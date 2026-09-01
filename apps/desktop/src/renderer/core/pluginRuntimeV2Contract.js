(function(){
  const PERMISSION_TAXONOMY = Object.freeze([
    "network", "filesystem.read", "filesystem.write", "browser.control", "shell.execute",
    "git.read", "git.write", "email.read", "email.draft", "email.send", "calendar.read",
    "calendar.write", "camera", "microphone", "clipboard", "local_app_control",
    "credential_access", "background_tasks", "high_compute"
  ]);
  const SIDE_EFFECT_CLASSES = Object.freeze(["READ_ONLY", "LOCAL_MUTATION", "EXTERNAL_MUTATION", "FINANCIAL", "COMMUNICATION", "DEVICE_CONTROL"]);
  const EXECUTION_MODES = Object.freeze(["IN_PROCESS_COMPATIBILITY", "OUT_OF_PROCESS", "REMOTE_CONNECTOR"]);
  const TRUST_CLASSES = Object.freeze(["WEISHAN_OFFICIAL", "VERIFIED_PUBLISHER", "COMMUNITY", "LOCAL_DEVELOPER"]);
  const AVAILABILITY_STATES = Object.freeze(["READY", "EXPERIMENTAL", "COMING_LATER", "CONNECTOR_FOUNDATION_NOT_READY_FOR_USER_EXECUTION", "INCOMPATIBLE", "REVOKED"]);
  const LIFECYCLE_STATES = Object.freeze(["NOT_INSTALLED", "INSTALLED", "ENABLED", "DISABLED", "UPDATE_AVAILABLE", "BROKEN", "PERMISSION_BLOCKED", "INCOMPATIBLE"]);
  const ONLINE_DEPENDENCIES = Object.freeze(["LOCAL", "ONLINE_SERVICE_REQUIRED", "HYBRID"]);
  const COST_CLASSES = Object.freeze(["FREE", "PAID", "EXTERNAL_SUBSCRIPTION_REQUIRED", "USAGE_COST", "UNKNOWN"]);
  const MANIFEST_REQUIRED_FIELDS = Object.freeze([
    "pluginId", "name", "publisher", "version", "runtimeVersion", "description", "capabilities",
    "permissions", "entrypoint", "supportedPlatforms", "minimumWeishanVersion", "installSize",
    "downloadSize", "dataPolicy", "updatePolicy", "signature", "integrityHash", "homepage",
    "license", "riskClass"
  ]);
  const ID_PATTERN = /^[a-z][a-z0-9_-]{1,63}(?:\.[a-z][a-z0-9_-]{1,63})+$/;
  const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/i;
  const HASH_PATTERN = /^(builtin|sha256):[a-zA-Z0-9._-]{8,128}$/;
  const FORBIDDEN_KEY = /(^|_)(secret|password|token|authorization|cookie|private[_-]?key|api[_-]?key|credential)(_|$)/i;

  function text(value){ return String(value == null ? "" : value).trim(); }
  function isPlainObject(value){
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || (!!proto && proto.constructor && proto.constructor.name === "Object");
  }
  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function hasUnsafeShape(value){
    if (Array.isArray(value)) return value.some(hasUnsafeShape);
    if (!isPlainObject(value)) return false;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    return Object.keys(descriptors).some((key) =>
      ["__proto__", "prototype", "constructor"].includes(key) ||
      typeof descriptors[key].get === "function" || typeof descriptors[key].set === "function" ||
      FORBIDDEN_KEY.test(key) || hasUnsafeShape(value[key])
    );
  }
  function uniqueTextList(value){
    if (!Array.isArray(value)) return null;
    const list = value.map(text).filter(Boolean);
    return list.length === value.length && new Set(list).size === list.length ? list : null;
  }
  function validPermission(permission){
    if (!isPlainObject(permission) || hasUnsafeShape(permission)) return false;
    const scopes = uniqueTextList(permission.scopes);
    return PERMISSION_TAXONOMY.includes(text(permission.permissionId)) &&
      typeof permission.required === "boolean" &&
      !!text(permission.description) &&
      Array.isArray(scopes) && scopes.length > 0 &&
      scopes.every((scope) => scope.length <= 240 && !/[\r\n<>]/.test(scope));
  }
  function validCapability(capability){
    if (!isPlainObject(capability) || hasUnsafeShape(capability)) return false;
    return ID_PATTERN.test(text(capability.capabilityId)) &&
      !!text(capability.description) &&
      isPlainObject(capability.inputSchema) && isPlainObject(capability.outputSchema) &&
      Array.isArray(uniqueTextList(capability.permissionRequirements)) &&
      capability.permissionRequirements.every((permission) => PERMISSION_TAXONOMY.includes(text(permission))) &&
      EXECUTION_MODES.includes(text(capability.executionMode)) &&
      ["SHORT", "STANDARD", "LONG"].includes(text(capability.timeoutClass)) &&
      SIDE_EFFECT_CLASSES.includes(text(capability.sideEffectClass));
  }
  function validateManifest(candidate){
    if (!isPlainObject(candidate) || hasUnsafeShape(candidate)) return { valid:false, reason:"unsafe_manifest", manifest:null };
    const missing = MANIFEST_REQUIRED_FIELDS.filter((field) => candidate[field] === undefined);
    if (missing.length) return { valid:false, reason:"missing_manifest_fields", missing, manifest:null };
    const capabilities = Array.isArray(candidate.capabilities) ? candidate.capabilities : [];
    const permissions = Array.isArray(candidate.permissions) ? candidate.permissions : [];
    const capabilityIds = capabilities.map((item) => text(item && item.capabilityId));
    const permissionIds = permissions.map((item) => text(item && item.permissionId));
    const entrypoint = candidate.entrypoint;
    const publisher = candidate.publisher;
    const signature = candidate.signature;
    const valid = ID_PATTERN.test(text(candidate.pluginId)) &&
      text(candidate.name).length > 0 && text(candidate.name).length <= 120 &&
      isPlainObject(publisher) && !!text(publisher.publisherId) && !!text(publisher.name) && TRUST_CLASSES.includes(text(publisher.trustClass)) &&
      VERSION_PATTERN.test(text(candidate.version)) && VERSION_PATTERN.test(text(candidate.runtimeVersion)) &&
      text(candidate.description).length > 0 && text(candidate.description).length <= 500 &&
      capabilities.length > 0 && capabilities.every(validCapability) && new Set(capabilityIds).size === capabilityIds.length &&
      permissions.every(validPermission) && new Set(permissionIds).size === permissionIds.length &&
      capabilities.every((capability) => capability.permissionRequirements.every((permission) => permissionIds.includes(text(permission)))) &&
      isPlainObject(entrypoint) && EXECUTION_MODES.includes(text(entrypoint.mode)) && !!text(entrypoint.target) &&
      Array.isArray(uniqueTextList(candidate.supportedPlatforms)) && candidate.supportedPlatforms.length > 0 &&
      VERSION_PATTERN.test(text(candidate.minimumWeishanVersion)) &&
      Number.isInteger(candidate.installSize) && candidate.installSize >= 0 &&
      Number.isInteger(candidate.downloadSize) && candidate.downloadSize >= 0 &&
      isPlainObject(candidate.dataPolicy) && ["ISOLATED", "NONE"].includes(text(candidate.dataPolicy.namespacePolicy)) &&
      isPlainObject(candidate.updatePolicy) && ["MANUAL", "AUTOMATIC_SAFE"].includes(text(candidate.updatePolicy.mode)) && candidate.updatePolicy.permissionExpansionRequiresApproval === true &&
      isPlainObject(signature) && ["BUILTIN_TRUST_ANCHOR", "VERIFIED", "NOT_VERIFIED"].includes(text(signature.status)) && !!text(signature.publisherId) &&
      HASH_PATTERN.test(text(candidate.integrityHash)) && /^https:\/\//.test(text(candidate.homepage)) &&
      !!text(candidate.license) && ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(text(candidate.riskClass)) &&
      AVAILABILITY_STATES.includes(text(candidate.availability)) && ONLINE_DEPENDENCIES.includes(text(candidate.onlineDependency)) && COST_CLASSES.includes(text(candidate.costClass));
    return valid ? { valid:true, reason:"valid", manifest:clone(candidate) } : { valid:false, reason:"invalid_manifest", manifest:null };
  }
  function normalizeResult(candidate, context){
    const value = isPlainObject(candidate) && !hasUnsafeShape(candidate) ? candidate : {};
    const ctx = isPlainObject(context) ? context : {};
    const status = ["SUCCESS", "PARTIAL", "FAILED", "BLOCKED", "CANCELLED"].includes(text(value.status)) ? text(value.status) : "FAILED";
    return Object.freeze({
      status,
      capability:text(ctx.capability),
      result:value.result === undefined ? null : clone(value.result),
      artifacts:Array.isArray(value.artifacts) ? clone(value.artifacts).slice(0, 100) : [],
      warnings:Array.isArray(value.warnings) ? value.warnings.map(text).filter(Boolean).slice(0, 50) : [],
      sideEffectsPerformed:Array.isArray(value.sideEffectsPerformed) ? value.sideEffectsPerformed.map(text).filter((item) => SIDE_EFFECT_CLASSES.includes(item)).slice(0, 20) : [],
      permissionsUsed:Array.isArray(ctx.permissionsUsed) ? ctx.permissionsUsed.map(text).filter((item) => PERMISSION_TAXONOMY.includes(item)) : [],
      duration:Number.isFinite(value.duration) && value.duration >= 0 ? Math.round(value.duration) : 0,
      pluginVersion:text(ctx.pluginVersion)
    });
  }

  window.WeishanPluginRuntimeV2Contract = Object.freeze({
    PERMISSION_TAXONOMY, SIDE_EFFECT_CLASSES, EXECUTION_MODES, TRUST_CLASSES, AVAILABILITY_STATES,
    LIFECYCLE_STATES, ONLINE_DEPENDENCIES, COST_CLASSES, MANIFEST_REQUIRED_FIELDS,
    validateManifest, normalizeResult, clone, text, isPlainObject
  });
})();
