(function(){
  const CAPABILITY_PATTERN = /^[a-z][a-z0-9-]{1,63}(?:\.[a-z][a-z0-9-]{1,63})+$/;
  const ALLOWED_PERMISSIONS = ["network", "filesystem", "camera", "microphone", "clipboard", "externalUrl"];
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
    const plugin = candidate && typeof candidate === "object" && !Array.isArray(candidate) ? candidate : {};
    const permissions = plugin.permissions && typeof plugin.permissions === "object" && !Array.isArray(plugin.permissions) ? plugin.permissions : {};
    const entryPoint = plugin.entryPoint && typeof plugin.entryPoint === "object" && !Array.isArray(plugin.entryPoint) ? plugin.entryPoint : {};
    const pluginId = text(plugin.pluginId);
    const routeId = text(entryPoint.routeId);
    const knownRoutes = Array.isArray(routeIds) ? routeIds : coreRouteIds();
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
      ALLOWED_PERMISSIONS.every((name) => permissions[name] === false || permissions[name] === true);
    return { valid, reason:valid ? "valid" : "invalid_plugin_declaration", plugin:clone(plugin) };
  }
  function validateDeclarations(declarations){
    const list = Array.isArray(declarations) ? declarations : [];
    const ids = new Set();
    const routes = new Set();
    return list.map((plugin) => {
      const result = validatePlugin(plugin);
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
    return validateDeclarations(source).filter((result) => result.valid).map((result) => clone(result.plugin));
  }
  function getEnabledSidebarEntries(declarations){
    const source = declarations === undefined ? declaredPlugins : declarations;
    return validateDeclarations(source).filter((result) => result.valid && result.plugin.enabled === true && result.plugin.entryPoint.type === "route").map((result) => clone(result.plugin));
  }
  function pageForRoute(routeId){
    const safeRouteId = text(routeId);
    return getEnabledSidebarEntries().some((plugin) => plugin.entryPoint.routeId === safeRouteId) ? workspaceForRoute(safeRouteId) : "";
  }

  window.WeishanPluginRegistry = { CAPABILITY_PATTERN, ALLOWED_PERMISSIONS, WORKSPACE_BY_ROUTE, getDeclaredPlugins, getPluginCenterEntries, presentationFor, validatePlugin, validateDeclarations, getEnabledSidebarEntries, workspaceForRoute, pageForRoute };
})();
