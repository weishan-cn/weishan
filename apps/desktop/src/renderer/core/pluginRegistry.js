(function(){
  const CAPABILITY_PATTERN = /^[a-z][a-z0-9-]{1,63}(?:\.[a-z][a-z0-9-]{1,63})+$/;
  const ALLOWED_PERMISSIONS = ["network", "filesystem", "camera", "microphone", "clipboard", "externalUrl"];
  const CAPABILITY_TYPES = ["UTILITY_PLUGIN", "DATA_PLUGIN", "PROVIDER_PLUGIN", "APP_CONNECTOR", "AGENT_PLUGIN", "DEVELOPER_AGENT", "WORKFLOW_PLUGIN", "WEISHAN_OFFICIAL_PLUGIN"];
  const TRUST_CLASSES = ["OPENAI_OFFICIAL", "WEISHAN_OFFICIAL", "VERIFIED_THIRD_PARTY", "THIRD_PARTY", "LOCAL_PRIVATE", "UNKNOWN"];
  const CONNECTION_STATES = ["INSTALLED", "NOT_CONNECTED", "AUTH_REQUIRED", "CONNECTED", "PERMISSION_REQUIRED", "READY", "RUNNING", "UNAVAILABLE", "FAILED", "DEPRECATED", "DISABLED", "UNKNOWN"];
  const AUTH_REQUIREMENTS = ["NONE", "USER_ACCOUNT", "USER_API_KEY", "WEISHAN_SERVICE", "OAUTH", "LOCAL_SESSION", "UNKNOWN"];
  const COST_CLASSES = ["FREE", "USER_SUBSCRIPTION_REQUIRED", "USER_API_KEY_REQUIRED", "WEISHAN_FUNDED", "PAID_PROVIDER", "UNKNOWN"];
  const OPERATION_CLASSES = ["READ", "WRITE_LOCAL", "WRITE_EXTERNAL", "DESTRUCTIVE", "TRANSACTIONAL", "PRODUCTION", "EXTERNAL_COMMUNICATION", "LEGAL_ACCEPTANCE", "KYC", "PAYMENT"];
  const RESERVED_NAMESPACES = ["openai.", "weishan."];
  const SENSITIVE_METADATA_PATTERN = /(secret|token|password|authorization|cookie|credential|api[_-]?key|client[_-]?secret)/i;
  const WORKSPACE_BY_ROUTE = { "plugin.video":"VideoPluginWorkspace" };
  const declaredPlugins = [
    {
      pluginId:"video-generation",
      name:"视频制作",
      description:"内置视频制作插件声明，等待独立运行时与安全审计。",
      icon:"▹",
      version:"1.0.0",
      enabled:false,
      status:"disabled",
      capabilities:["video.generate"],
      capabilityType:"WORKFLOW_PLUGIN",
      trustClass:"WEISHAN_OFFICIAL",
      availability:"UNAVAILABLE",
      connectionState:"DISABLED",
      authRequirement:"UNKNOWN",
      costClass:"UNKNOWN",
      operationClasses:["READ"],
      requestedPermissions:[],
      presentation:{
        tagline:"用一句话生成和编辑视频",
        userStatus:"coming_soon",
        runtimeNotice:"视频生成服务尚未接入",
        simplePromptPlaceholder:"帮我做一个 15 秒的咖啡广告，电影感，适合抖音",
        supportedMaterialTypes:["image", "video", "audio"]
      },
      entryPoint:{ type:"route", routeId:"plugin.video" },
      permissions:{ network:false, filesystem:false, camera:false, microphone:false, clipboard:false, externalUrl:false }
    }
  ];

  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function text(value){ return String(value == null ? "" : value).trim(); }
  function coreRouteIds(){ return window.WeishanModules && typeof window.WeishanModules.coreRouteIds === "function" ? window.WeishanModules.coreRouteIds() : []; }
  function validText(value, pattern){ return pattern.test(text(value)); }
  function validCapability(value){ return CAPABILITY_PATTERN.test(text(value)); }
  function isPlainObject(value){
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || (!!proto && proto.constructor && proto.constructor.name === "Object");
  }
  function hasUnsafeDescriptor(value){
    if (!isPlainObject(value)) return false;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    return Object.keys(descriptors).some((key) => key === "__proto__" || key === "constructor" || key === "prototype" || typeof descriptors[key].get === "function" || typeof descriptors[key].set === "function");
  }
  function validEnum(value, allowed){ return allowed.includes(text(value)); }
  function arrayOfEnums(value, allowed){ return Array.isArray(value) && value.every((item) => validEnum(item, allowed)); }
  function hasSensitiveMetadata(value){
    if (Array.isArray(value)) return value.some(hasSensitiveMetadata);
    if (!isPlainObject(value)) return false;
    return Object.keys(value).some((key) => SENSITIVE_METADATA_PATTERN.test(key) || hasSensitiveMetadata(value[key]));
  }
  function reservedNamespace(value){ return RESERVED_NAMESPACES.some((prefix) => text(value).startsWith(prefix)); }
  function workspaceForRoute(routeId){ return WORKSPACE_BY_ROUTE[text(routeId)] || ""; }
  function presentationFor(plugin){
    const presentation = plugin && plugin.presentation && typeof plugin.presentation === "object" && !Array.isArray(plugin.presentation) ? plugin.presentation : {};
    return {
      tagline:text(presentation.tagline),
      userStatus:text(presentation.userStatus),
      runtimeNotice:text(presentation.runtimeNotice),
      simplePromptPlaceholder:text(presentation.simplePromptPlaceholder),
      supportedMaterialTypes:Array.isArray(presentation.supportedMaterialTypes) ? presentation.supportedMaterialTypes.map(text).filter(Boolean) : []
    };
  }
  function validatePlugin(candidate, routeIds){
    return validatePluginWithPolicy(candidate, routeIds, { trustedRegistration:false });
  }
  function validatePluginWithPolicy(candidate, routeIds, policy){
    const trustedRegistration = !!(policy && policy.trustedRegistration);
    const plugin = isPlainObject(candidate) ? candidate : {};
    const permissions = isPlainObject(plugin.permissions) ? plugin.permissions : {};
    const entryPoint = isPlainObject(plugin.entryPoint) ? plugin.entryPoint : {};
    const pluginId = text(plugin.pluginId);
    const routeId = text(entryPoint.routeId);
    const knownRoutes = Array.isArray(routeIds) ? routeIds : coreRouteIds();
    const privilegedTrust = ["OPENAI_OFFICIAL", "WEISHAN_OFFICIAL"].includes(text(plugin.trustClass));
    const capabilityType = text(plugin.capabilityType || "WORKFLOW_PLUGIN");
    const connectionState = text(plugin.connectionState || (plugin.enabled === true ? "NOT_CONNECTED" : "DISABLED"));
    const authRequirement = text(plugin.authRequirement || "UNKNOWN");
    const costClass = text(plugin.costClass || "UNKNOWN");
    const operationClasses = plugin.operationClasses === undefined ? ["READ"] : plugin.operationClasses;
    const requestedPermissions = plugin.requestedPermissions === undefined ? Object.keys(permissions).filter((name) => permissions[name] === true) : plugin.requestedPermissions;
    if (hasUnsafeDescriptor(plugin) || hasUnsafeDescriptor(permissions) || hasUnsafeDescriptor(entryPoint) || hasSensitiveMetadata(plugin)) {
      return { valid:false, reason:"unsafe_plugin_metadata", plugin:{} };
    }
    if (!trustedRegistration && (privilegedTrust || reservedNamespace(pluginId) || (Array.isArray(plugin.capabilities) && plugin.capabilities.some(reservedNamespace)))) {
      return { valid:false, reason:"reserved_identity_requires_trusted_registration", plugin:{} };
    }
    const valid = validText(pluginId, /^[a-z][a-z0-9.-]{2,63}$/) &&
      validText(plugin.name, /^[^<>]{1,120}$/) &&
      validText(plugin.description, /^[^<>]{1,300}$/) &&
      validText(plugin.icon, /^[^<>]{1,20}$/) &&
      validText(plugin.version, /^\d+\.\d+\.\d+$/) &&
      typeof plugin.enabled === "boolean" &&
      ["available", "disabled", "blocked"].includes(text(plugin.status)) &&
      Array.isArray(plugin.capabilities) && plugin.capabilities.length > 0 && plugin.capabilities.every(validCapability) &&
      entryPoint.type === "route" &&
      validText(routeId, /^plugin\.[a-z][a-z0-9.-]{2,63}$/) &&
      !knownRoutes.includes(routeId) &&
      !!workspaceForRoute(routeId) &&
      Object.keys(permissions).every((name) => ALLOWED_PERMISSIONS.includes(name)) &&
      ALLOWED_PERMISSIONS.every((name) => permissions[name] === false || permissions[name] === true) &&
      validEnum(capabilityType, CAPABILITY_TYPES) &&
      (plugin.trustClass === undefined || validEnum(plugin.trustClass, TRUST_CLASSES)) &&
      validEnum(connectionState, CONNECTION_STATES) &&
      validEnum(authRequirement, AUTH_REQUIREMENTS) &&
      validEnum(costClass, COST_CLASSES) &&
      arrayOfEnums(operationClasses, OPERATION_CLASSES) &&
      Array.isArray(requestedPermissions) && requestedPermissions.every((name) => ALLOWED_PERMISSIONS.includes(text(name))) &&
      !(plugin.grantedPermissions && plugin.grantedPermissions.length);
    if (!valid) return { valid:false, reason:"invalid_plugin_declaration", plugin:clone(plugin) };
    const normalized = clone(plugin);
    normalized.capabilityType = capabilityType;
    normalized.trustClass = trustedRegistration ? text(plugin.trustClass || "WEISHAN_OFFICIAL") : text(plugin.trustClass || "LOCAL_PRIVATE");
    normalized.connectionState = connectionState;
    normalized.authRequirement = authRequirement;
    normalized.costClass = costClass;
    normalized.operationClasses = operationClasses.map(text);
    normalized.requestedPermissions = requestedPermissions.map(text);
    normalized.grantedPermissions = [];
    normalized.ready = normalized.enabled === true && normalized.status === "available" && normalized.connectionState === "READY";
    return { valid:true, reason:"valid", plugin:normalized };
  }
  function validateDeclarations(declarations, policy){
    const list = Array.isArray(declarations) ? declarations : [];
    const ids = new Set();
    const routes = new Set();
    return list.map((plugin) => {
      const result = validatePluginWithPolicy(plugin, undefined, policy || { trustedRegistration:false });
      const pluginId = text(plugin && plugin.pluginId);
      const routeId = text(plugin && plugin.entryPoint && plugin.entryPoint.routeId);
      if (!result.valid || ids.has(pluginId) || routes.has(routeId)) return Object.assign(result, { valid:false, reason:result.valid ? "duplicate_plugin_id_or_route" : result.reason });
      ids.add(pluginId);
      routes.add(routeId);
      return result;
    });
  }
  function getDeclaredPlugins(){ return clone(declaredPlugins); }
  function getPluginCenterEntries(declarations){
    const source = declarations === undefined ? declaredPlugins : declarations;
    return validateDeclarations(source, { trustedRegistration:declarations === undefined }).filter((result) => result.valid).map((result) => clone(result.plugin));
  }
  function getEnabledSidebarEntries(declarations){
    const source = declarations === undefined ? declaredPlugins : declarations;
    return validateDeclarations(source, { trustedRegistration:declarations === undefined }).filter((result) => result.valid && result.plugin.enabled === true && result.plugin.entryPoint.type === "route").map((result) => clone(result.plugin));
  }
  function pageForRoute(routeId){
    const safeRouteId = text(routeId);
    return getEnabledSidebarEntries().some((plugin) => plugin.entryPoint.routeId === safeRouteId) ? workspaceForRoute(safeRouteId) : "";
  }

  window.WeishanPluginRegistry = { CAPABILITY_PATTERN, ALLOWED_PERMISSIONS, CAPABILITY_TYPES, TRUST_CLASSES, CONNECTION_STATES, AUTH_REQUIREMENTS, COST_CLASSES, OPERATION_CLASSES, RESERVED_NAMESPACES, WORKSPACE_BY_ROUTE, getDeclaredPlugins, getPluginCenterEntries, presentationFor, validatePlugin, validatePluginWithPolicy, validateDeclarations, getEnabledSidebarEntries, workspaceForRoute, pageForRoute };
})();
