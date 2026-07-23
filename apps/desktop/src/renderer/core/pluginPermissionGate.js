(function(){
  function registry(){ return window.WeishanPluginRegistry || {}; }
  function evaluate(plugin, permission){
    const api = registry();
    const requested = String(permission == null ? "" : permission).trim();
    const validation = typeof api.validatePlugin === "function" ? api.validatePlugin(plugin) : { valid:false, reason:"registry_unavailable" };
    if (!validation.valid) return { allowed:false, declared:false, reason:"invalid_plugin" };
    if (validation.plugin.enabled !== true) return { allowed:false, declared:false, reason:"plugin_disabled" };
    if (!Array.isArray(api.ALLOWED_PERMISSIONS) || !api.ALLOWED_PERMISSIONS.includes(requested)) return { allowed:false, declared:false, reason:"unknown_permission" };
    if (validation.plugin.permissions[requested] !== true) return { allowed:false, declared:false, reason:"permission_not_declared" };
    return { allowed:false, declared:true, reason:"runtime_permission_not_granted" };
  }
  window.WeishanPluginPermissionGate = { evaluate };
})();
