(function(){
  const contract = window.WeishanPluginRuntimeV2Contract;
  if (!contract) return;
  const STORE_KEY = "plugins.runtimeV2.installState";
  const RUNTIME_VERSION = "2.0.0";
  const MAX_ACTIVITY = 200;

  function clone(value){ return contract.clone(value); }
  function text(value){ return contract.text(value); }
  function grantKey(permissionId, scope){ return `${text(permissionId)}:${text(scope)}`; }
  function defaultStorage(){
    return {
      read(key, fallback){ return window.WeishanStore && typeof window.WeishanStore.read === "function" ? window.WeishanStore.read(key, fallback) : fallback; },
      write(key, value){ if (window.WeishanStore && typeof window.WeishanStore.write === "function") window.WeishanStore.write(key, value); },
      remove(key){ if (window.WeishanStore && typeof window.WeishanStore.remove === "function") window.WeishanStore.remove(key); }
    };
  }
  function safeState(value){
    if (!contract.isPlainObject(value)) return { plugins:{}, activity:[] };
    const plugins = contract.isPlainObject(value.plugins) ? value.plugins : {};
    const cleanPlugins = {};
    Object.keys(plugins).slice(0, 200).forEach((pluginId) => {
      const item = plugins[pluginId];
      if (!contract.isPlainObject(item)) return;
      cleanPlugins[pluginId] = {
        version:text(item.version),
        state:contract.LIFECYCLE_STATES.includes(text(item.state)) ? text(item.state) : "DISABLED",
        installedAt:Number.isFinite(item.installedAt) ? item.installedAt : 0,
        publisher:text(item.publisher),
        grantedPermissions:Array.isArray(item.grantedPermissions) ? item.grantedPermissions.map(text).filter(Boolean).slice(0, 100) : [],
        retainData:item.retainData !== false,
        dataNamespace:text(item.dataNamespace),
        cacheNamespace:text(item.cacheNamespace),
        logNamespace:text(item.logNamespace)
      };
    });
    return { plugins:cleanPlugins, activity:Array.isArray(value.activity) ? value.activity.slice(-MAX_ACTIVITY) : [] };
  }
  function permissionKeys(manifest){
    return manifest.permissions.flatMap((permission) => permission.scopes.map((scope) => grantKey(permission.permissionId, scope)));
  }
  function requiredPermissionKeys(manifest){
    return manifest.permissions.filter((permission) => permission.required).flatMap((permission) => permission.scopes.map((scope) => grantKey(permission.permissionId, scope)));
  }
  function verifiedForActivation(manifest){
    return ["BUILTIN_TRUST_ANCHOR", "VERIFIED"].includes(text(manifest.signature && manifest.signature.status));
  }
  function readyForInstall(manifest){ return text(manifest.availability) === "READY" && verifiedForActivation(manifest); }

  function RuntimeV2(options){
    const opts = options || {};
    const source = Array.isArray(opts.catalog) ? opts.catalog : [];
    this.storage = opts.storage || defaultStorage();
    this.executor = typeof opts.executor === "function" ? opts.executor : null;
    this.now = typeof opts.now === "function" ? opts.now : Date.now;
    this.catalogById = new Map();
    source.forEach((candidate) => {
      const checked = contract.validateManifest(candidate);
      if (checked.valid && !this.catalogById.has(checked.manifest.pluginId)) this.catalogById.set(checked.manifest.pluginId, checked.manifest);
    });
    this.state = safeState(this.storage.read(STORE_KEY, { plugins:{}, activity:[] }));
  }
  RuntimeV2.prototype.persist = function(){ this.storage.write(STORE_KEY, clone(this.state)); };
  RuntimeV2.prototype.record = function(type, pluginId, detail){
    this.state.activity.push({ type:text(type), pluginId:text(pluginId), at:this.now(), detail:text(detail).slice(0, 160) });
    this.state.activity = this.state.activity.slice(-MAX_ACTIVITY);
    this.persist();
  };
  RuntimeV2.prototype.catalog = function(){ return Array.from(this.catalogById.values()).map(clone); };
  RuntimeV2.prototype.manifest = function(pluginId){ const value = this.catalogById.get(text(pluginId)); return value ? clone(value) : null; };
  RuntimeV2.prototype.installation = function(pluginId){ const value = this.state.plugins[text(pluginId)]; return value ? clone(value) : null; };
  RuntimeV2.prototype.install = function(pluginId, options){
    const id = text(pluginId);
    const manifest = this.catalogById.get(id);
    if (!manifest) return { ok:false, error:"PLUGIN_NOT_IN_APPROVED_CATALOG" };
    if (!readyForInstall(manifest)) return { ok:false, error:"PLUGIN_NOT_INSTALL_READY" };
    if (this.state.plugins[id]) return { ok:false, error:"PLUGIN_ALREADY_INSTALLED" };
    const requested = Array.isArray(options && options.grants) ? options.grants.map(text) : [];
    const declared = permissionKeys(manifest);
    if (requested.some((grant) => !declared.includes(grant))) return { ok:false, error:"UNDECLARED_PERMISSION_GRANT" };
    this.state.plugins[id] = {
      version:manifest.version,
      state:"INSTALLED",
      installedAt:this.now(),
      publisher:manifest.publisher.publisherId,
      grantedPermissions:Array.from(new Set(requested)),
      retainData:true,
      dataNamespace:`plugin-data:${id}`,
      cacheNamespace:`plugin-cache:${id}`,
      logNamespace:`plugin-log:${id}`
    };
    this.record("INSTALL", id, "installed_disabled_by_default");
    return { ok:true, state:"INSTALLED", pluginId:id };
  };
  RuntimeV2.prototype.grantPermissions = function(pluginId, grants){
    const id = text(pluginId);
    const manifest = this.catalogById.get(id);
    const installed = this.state.plugins[id];
    if (!manifest || !installed) return { ok:false, error:"PLUGIN_NOT_INSTALLED" };
    const next = Array.isArray(grants) ? grants.map(text) : [];
    const declared = permissionKeys(manifest);
    if (next.some((grant) => !declared.includes(grant))) return { ok:false, error:"UNDECLARED_PERMISSION_GRANT" };
    installed.grantedPermissions = Array.from(new Set(next));
    if (installed.state === "PERMISSION_BLOCKED") installed.state = "DISABLED";
    this.record("PERMISSIONS_REVIEWED", id, "explicit_user_grants_updated");
    return { ok:true, grantedPermissions:clone(installed.grantedPermissions) };
  };
  RuntimeV2.prototype.enable = function(pluginId){
    const id = text(pluginId);
    const manifest = this.catalogById.get(id);
    const installed = this.state.plugins[id];
    if (!manifest || !installed) return { ok:false, error:"PLUGIN_NOT_INSTALLED" };
    if (!readyForInstall(manifest)) return { ok:false, error:"PLUGIN_NOT_EXECUTABLE" };
    const missing = requiredPermissionKeys(manifest).filter((permission) => !installed.grantedPermissions.includes(permission));
    if (missing.length) {
      installed.state = "PERMISSION_BLOCKED";
      this.record("ENABLE_BLOCKED", id, "required_permissions_missing");
      return { ok:false, error:"PERMISSION_APPROVAL_REQUIRED", required:missing };
    }
    installed.state = "ENABLED";
    this.record("ENABLE", id, "enabled");
    return { ok:true, state:"ENABLED" };
  };
  RuntimeV2.prototype.disable = function(pluginId){
    const id = text(pluginId);
    const installed = this.state.plugins[id];
    if (!installed) return { ok:false, error:"PLUGIN_NOT_INSTALLED" };
    installed.state = "DISABLED";
    this.record("DISABLE", id, "disabled");
    return { ok:true, state:"DISABLED" };
  };
  RuntimeV2.prototype.uninstall = function(pluginId, options){
    const id = text(pluginId);
    const installed = this.state.plugins[id];
    if (!installed) return { ok:false, error:"PLUGIN_NOT_INSTALLED" };
    const retainData = !(options && options.retainData === false);
    const removed = {
      runtimeFiles:true,
      packageMetadata:true,
      cache:true,
      logs:true,
      generatedData:!retainData
    };
    delete this.state.plugins[id];
    if (!retainData) this.storage.remove(`plugin-data:${id}`);
    this.storage.remove(`plugin-cache:${id}`);
    this.storage.remove(`plugin-log:${id}`);
    this.record("UNINSTALL", id, retainData ? "plugin_removed_data_retained" : "plugin_and_data_removed");
    return { ok:true, retainData, removed };
  };
  RuntimeV2.prototype.reviewUpdate = function(pluginId, candidate){
    const id = text(pluginId);
    const installed = this.state.plugins[id];
    const checked = contract.validateManifest(candidate);
    if (!installed) return { ok:false, error:"PLUGIN_NOT_INSTALLED" };
    if (!checked.valid || checked.manifest.pluginId !== id) return { ok:false, error:"INVALID_UPDATE_MANIFEST" };
    const current = this.catalogById.get(id);
    if (!current || current.publisher.publisherId !== checked.manifest.publisher.publisherId) return { ok:false, error:"PUBLISHER_MISMATCH" };
    if (!verifiedForActivation(checked.manifest)) return { ok:false, error:"UPDATE_SIGNATURE_NOT_VERIFIED" };
    const currentPermissions = new Set(permissionKeys(current));
    const expanded = permissionKeys(checked.manifest).filter((permission) => !currentPermissions.has(permission));
    if (expanded.length) return { ok:false, error:"PERMISSION_EXPANSION_APPROVAL_REQUIRED", newPermissions:expanded };
    return { ok:true, updateAllowed:true, manifest:clone(checked.manifest) };
  };
  RuntimeV2.prototype.applyReviewedUpdate = function(pluginId, candidate){
    const review = this.reviewUpdate(pluginId, candidate);
    if (!review.ok) return review;
    const id = text(pluginId);
    this.catalogById.set(id, review.manifest);
    this.state.plugins[id].version = review.manifest.version;
    this.state.plugins[id].state = "DISABLED";
    this.record("UPDATE", id, "updated_disabled_pending_user_enable");
    return { ok:true, state:"DISABLED", version:review.manifest.version };
  };
  RuntimeV2.prototype.candidates = function(capabilityId, options){
    const id = text(capabilityId);
    const installedOnly = !!(options && options.installedOnly);
    return this.catalog().filter((manifest) => {
      if (!manifest.capabilities.some((capability) => capability.capabilityId === id)) return false;
      if (!installedOnly) return true;
      const installed = this.state.plugins[manifest.pluginId];
      return !!installed && installed.state === "ENABLED";
    }).map((manifest) => ({ manifest, installation:this.installation(manifest.pluginId) }));
  };
  RuntimeV2.prototype.invoke = async function(pluginId, capabilityId, input){
    const id = text(pluginId);
    const manifest = this.catalogById.get(id);
    const installed = this.state.plugins[id];
    if (!manifest || !installed || installed.state !== "ENABLED") return contract.normalizeResult({ status:"BLOCKED", warnings:["PLUGIN_NOT_ENABLED"] }, { capability:capabilityId, pluginVersion:manifest && manifest.version });
    const capability = manifest.capabilities.find((item) => item.capabilityId === text(capabilityId));
    if (!capability) return contract.normalizeResult({ status:"BLOCKED", warnings:["CAPABILITY_NOT_DECLARED"] }, { capability:capabilityId, pluginVersion:manifest.version });
    const required = manifest.permissions.filter((permission) => capability.permissionRequirements.includes(permission.permissionId)).flatMap((permission) => permission.scopes.map((scope) => grantKey(permission.permissionId, scope)));
    if (required.some((permission) => !installed.grantedPermissions.includes(permission))) return contract.normalizeResult({ status:"BLOCKED", warnings:["PERMISSION_APPROVAL_REQUIRED"] }, { capability:capabilityId, pluginVersion:manifest.version });
    if (!this.executor) return contract.normalizeResult({ status:"BLOCKED", warnings:["PLUGIN_HOST_NOT_AVAILABLE"] }, { capability:capabilityId, pluginVersion:manifest.version, permissionsUsed:capability.permissionRequirements });
    const started = this.now();
    try {
      const raw = await this.executor({ manifest:clone(manifest), capability:clone(capability), input:clone(input || {}), artifactHandlesOnly:true });
      const result = contract.normalizeResult(Object.assign({}, raw, { duration:Math.max(0, this.now() - started) }), { capability:capability.capabilityId, pluginVersion:manifest.version, permissionsUsed:capability.permissionRequirements });
      this.record("INVOKE", id, `${capability.capabilityId}:${result.status}`);
      return result;
    } catch (_) {
      this.record("INVOKE", id, `${capability.capabilityId}:FAILED`);
      return contract.normalizeResult({ status:"FAILED", warnings:["PLUGIN_HOST_FAILURE"] }, { capability:capability.capabilityId, pluginVersion:manifest.version, permissionsUsed:capability.permissionRequirements });
    }
  };
  RuntimeV2.prototype.snapshot = function(){ return clone({ runtimeVersion:RUNTIME_VERSION, plugins:this.state.plugins, activity:this.state.activity }); };
  RuntimeV2.prototype.bootstrapBuiltIn = function(pluginId, grants){
    const id = text(pluginId);
    if (!this.state.plugins[id]) {
      const installed = this.install(id, { grants:Array.isArray(grants) ? grants : [] });
      if (!installed.ok) return installed;
    }
    return this.enable(id);
  };

  window.WeishanPluginRuntimeV2 = Object.freeze({ STORE_KEY, RUNTIME_VERSION, RuntimeV2, grantKey });
})();
