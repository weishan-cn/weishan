(function(){
  function registry(){ return window.WeishanPluginRegistry || {}; }
  function evaluate(plugin, capability){
    const api = registry();
    const requested = String(capability == null ? "" : capability).trim();
    const validation = typeof api.validatePlugin === "function" ? api.validatePlugin(plugin) : { valid:false, reason:"registry_unavailable" };
    if (!validation.valid) return { allowed:false, reason:"invalid_plugin" };
    if (validation.plugin.enabled !== true) return { allowed:false, reason:"plugin_disabled" };
    if (!Array.isArray(api.ALLOWED_CAPABILITIES) || !api.ALLOWED_CAPABILITIES.includes(requested)) return { allowed:false, reason:"unknown_capability" };
    if (!validation.plugin.capabilities.includes(requested)) return { allowed:false, reason:"capability_not_declared" };
    return { allowed:true, reason:"declared_capability_only", runtimeGranted:false };
  }
  window.WeishanPluginCapabilityGate = { evaluate };
})();
