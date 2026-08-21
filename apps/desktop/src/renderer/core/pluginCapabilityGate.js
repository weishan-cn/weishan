(function(){
  function registry(){ return window.WeishanPluginRegistry || {}; }
  function isTrustedDeclared(api, plugin){
    if (!api || typeof api.getDeclaredPlugins !== "function" || !plugin) return false;
    const routeId = plugin.entryPoint && plugin.entryPoint.routeId;
    return api.getDeclaredPlugins().some((declared) => declared.pluginId === plugin.pluginId && declared.entryPoint && declared.entryPoint.routeId === routeId);
  }
  function evaluate(plugin, capability){
    const api = registry();
    const requested = String(capability == null ? "" : capability).trim();
    const validation = typeof api.validatePluginWithPolicy === "function" ? api.validatePluginWithPolicy(plugin, undefined, { trustedRegistration:isTrustedDeclared(api, plugin) }) : { valid:false, reason:"registry_unavailable" };
    if (!validation.valid) return { allowed:false, reason:"invalid_plugin" };
    if (validation.plugin.enabled !== true) return { allowed:false, reason:"plugin_disabled" };
    if (!api.CAPABILITY_PATTERN || !api.CAPABILITY_PATTERN.test(requested)) return { allowed:false, reason:"unknown_capability" };
    if (!validation.plugin.capabilities.includes(requested)) return { allowed:false, reason:"capability_not_declared" };
    return { allowed:true, reason:"declared_capability_only", runtimeGranted:false };
  }
  window.WeishanPluginCapabilityGate = { evaluate };
})();
