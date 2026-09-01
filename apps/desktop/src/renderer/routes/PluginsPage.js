(function(){
  function t(key){ return window.I18n && typeof window.I18n.t === "function" ? window.I18n.t(key) : key; }
  function esc(value){ return String(value == null ? "" : value).replace(/[&<>\"]/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" })[char]); }
  function advanced(){ return !!(window.WeishanExperienceMode && window.WeishanExperienceMode.isAdvanced()); }
  function legacyModel(){
    const registry = window.WeishanPluginRegistry;
    return registry && typeof registry.marketplaceModel === "function" ? registry.marketplaceModel() : { entries:[] };
  }
  function v2(){ return window.WeishanPluginRuntimeV2Catalog || {}; }
  function runtime(){ return v2().runtime || null; }
  function localeValue(value){
    const lang = window.I18n && typeof window.I18n.getLang === "function" ? window.I18n.getLang() : "zh";
    if (!value || typeof value !== "object") return "";
    return value[lang] || value[lang === "zh-Hant" ? "zh" : lang] || value.en || value.zh || "";
  }
  function permissionLabel(permission){
    const scopes = Array.isArray(permission.scopes) ? permission.scopes.join(", ") : "";
    return `${permission.permissionId}${scopes ? ` · ${scopes}` : ""}`;
  }
  function sizeLabel(bytes){
    const value = Number(bytes) || 0;
    if (!value) return t("pluginIncludedInApp");
    if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
    return `${Math.round(value / 1024 / 1024)} MB`;
  }
  function statusFor(manifest, installation){
    if (manifest.availability !== "READY") return t("pluginStatusFoundationOnly");
    if (!installation) return t("pluginStatusNotInstalled");
    if (installation.state === "ENABLED") return t("pluginStatusEnabled");
    if (installation.state === "PERMISSION_BLOCKED") return t("pluginStatusPermissionBlocked");
    return t("pluginStatusDisabled");
  }
  function permissionList(manifest){
    if (!manifest.permissions.length) return `<p class="plugin-permission-empty">${esc(t("pluginNoExtraPermissions"))}</p>`;
    return `<ul class="plugin-permission-list">${manifest.permissions.map((permission) => `<li><strong>${esc(permissionLabel(permission))}</strong><span>${esc(permission.description)}</span></li>`).join("")}</ul>`;
  }
  function v2Card(manifest){
    const activeRuntime = runtime();
    const installation = activeRuntime && activeRuntime.installation(manifest.pluginId);
    const isReady = manifest.availability === "READY";
    const isEnabled = installation && installation.state === "ENABLED";
    const name = localeValue(manifest.localizedName) || manifest.name;
    const description = localeValue(manifest.localizedDescription) || manifest.description;
    const largeWarning = manifest.largePack ? `<p class="plugin-large-warning">${esc(t("pluginLargePackWarning"))} · ${esc(manifest.additionalRuntimeSize)}</p>` : "";
    const requirements = manifest.externalServiceRequirement !== "NONE" ? `<p class="plugin-external-requirement">${esc(t("pluginExternalServiceRequired"))}</p>` : "";
    let actions = "";
    if (isReady && !installation) actions = `<button type="button" class="ws-btn" data-v2-install="${esc(manifest.pluginId)}">${esc(t("pluginInstall"))}</button>`;
    if (isReady && installation) {
      actions = `<div class="plugin-lifecycle-actions">
        ${isEnabled ? `<button type="button" class="ws-btn gray" data-v2-disable="${esc(manifest.pluginId)}">${esc(t("pluginDisable"))}</button>` : `<button type="button" class="ws-btn" data-v2-enable="${esc(manifest.pluginId)}">${esc(t("pluginEnable"))}</button>`}
        ${isEnabled && manifest.entrypoint.target === "plugin.image-tools" ? `<button type="button" class="ws-btn" data-plugin-route="plugin.image-tools">${esc(t("openPluginWorkspace"))}</button>` : ""}
        <label class="plugin-retention-choice"><span>${esc(t("pluginUninstallChoice"))}</span><select data-retention-for="${esc(manifest.pluginId)}"><option value="retain">${esc(t("pluginRemoveOnly"))}</option><option value="delete">${esc(t("pluginRemoveWithData"))}</option></select></label>
        <button type="button" class="ws-btn danger" data-v2-uninstall="${esc(manifest.pluginId)}">${esc(t("pluginUninstall"))}</button>
      </div>`;
    }
    return `<article class="plugin-center-card plugin-v2-card" data-plugin-id="${esc(manifest.pluginId)}" data-plugin-enabled="${isEnabled ? "true" : "false"}" data-plugin-v2="true">
      <div class="plugin-center-card-head"><span class="plugin-center-icon" aria-hidden="true">${manifest.pluginId.includes("image") ? "▧" : "◇"}</span><div><h3>${esc(name)}</h3><p>${esc(description)}</p></div><span class="plugin-center-status ${isEnabled ? "is-enabled" : "is-disabled"}">${esc(statusFor(manifest, installation))}</span></div>
      <div class="plugin-card-categories">${manifest.categories.map((category) => `<span>${esc(category)}</span>`).join("")}</div>${largeWarning}${requirements}
      <details class="plugin-center-details" data-plugin-details><summary>${esc(t("pluginViewDetails"))}</summary>
        <dl class="plugin-v2-meta"><div><dt>${esc(t("pluginDetailPublisher"))}</dt><dd>${esc(manifest.publisher.name)} · ${esc(manifest.publisher.trustClass)}</dd></div><div><dt>${esc(t("pluginDetailDownloadSize"))}</dt><dd>${esc(sizeLabel(manifest.downloadSize))}</dd></div><div><dt>${esc(t("pluginDetailInstallSize"))}</dt><dd>${esc(sizeLabel(manifest.installSize))}</dd></div><div><dt>${esc(t("pluginDetailOnlineDependency"))}</dt><dd>${esc(manifest.onlineDependency)}</dd></div></dl>
        <h4>${esc(t("pluginDetailPermissions"))}</h4>${permissionList(manifest)}
        ${advanced() ? `<div class="plugin-advanced-details" data-plugin-advanced-details><code>${esc(manifest.pluginId)}</code><span>Runtime ${esc(manifest.runtimeVersion)}</span><span>${esc(manifest.entrypoint.mode)}</span><span>${esc(manifest.capabilities.map((item) => item.capabilityId).join(", "))}</span></div>` : ""}
      </details>${actions}</article>`;
  }
  function legacyCard(plugin){
    const registry = window.WeishanPluginRegistry;
    const display = registry && registry.presentationFor ? registry.presentationFor(plugin) : {};
    const displayName = display.nameKey ? t(display.nameKey) : plugin.name;
    const tagline = display.taglineKey ? t(display.taglineKey) : (display.tagline || plugin.description);
    return `<article class="plugin-center-card" data-plugin-id="${esc(plugin.pluginId)}" data-plugin-enabled="false"><div class="plugin-center-card-head"><span class="plugin-center-icon" aria-hidden="true">${esc(plugin.icon)}</span><div><h3>${esc(displayName)}</h3><p>${esc(tagline)}</p></div><span class="plugin-center-status is-disabled">${esc(t(display.userStatus === "coming_soon" ? "pluginStatusComingSoon" : "pluginStatusUnavailable"))}</span></div><p class="plugin-center-note">${esc(display.runtimeNotice || t("pluginNotEnabledNote"))}</p><details class="plugin-center-details" data-plugin-details><summary>${esc(t("pluginViewDetails"))}</summary><p>${esc(t("pluginComingSoonDetails"))}</p></details></article>`;
  }
  function section(title, cards, attr, empty){ return `<section class="plugin-center-list" ${attr}><h3>${esc(title)}</h3><section class="plugin-center-grid">${cards.join("") || `<div class="ws-card plugin-empty-state"><p class="ws-muted">${esc(empty)}</p></div>`}</section></section>`; }
  function mount(host){
    const catalogApi = v2();
    const manifests = typeof catalogApi.catalog === "function" ? catalogApi.catalog() : [];
    const activeRuntime = runtime();
    const installed = manifests.filter((manifest) => activeRuntime && activeRuntime.installation(manifest.pluginId));
    const available = manifests.filter((manifest) => manifest.availability === "READY" && !(activeRuntime && activeRuntime.installation(manifest.pluginId)));
    const previews = advanced() ? manifests.filter((manifest) => manifest.developerPreviewOnly && manifest.availability !== "READY") : [];
    const legacy = legacyModel().entries.filter((plugin) => plugin.pluginId !== "image-tools");
    host.innerHTML = `<section class="ws-page plugin-center-page" data-runtime-version="2"><header class="ws-card plugin-center-hero"><h2>${esc(t("pluginCenter"))}</h2><p class="ws-muted">${esc(t("pluginCenterDescriptionV2"))}</p></header>
      <section class="plugin-discovery" aria-label="${esc(t("pluginMarketplace"))}"><label class="plugin-search-label" for="pluginSearch">${esc(t("pluginSearchLabel"))}</label><input id="pluginSearch" class="plugin-search-input" type="search" placeholder="${esc(t("pluginSearchPlaceholder"))}" autocomplete="off"><div class="plugin-discovery-sections"><span>${esc(t("installedPlugins"))}</span><span>${esc(t("pluginAddCapabilities"))}</span>${advanced() ? `<span>${esc(t("pluginDeveloperPreview"))}</span>` : ""}</div></section>
      ${section(t("installedPlugins"), installed.map(v2Card), 'data-plugin-section="installed"', t("pluginInstalledEmpty"))}
      ${section(t("pluginAddCapabilities"), available.map(v2Card).concat(legacy.map(legacyCard)), 'data-plugin-section="available"', t("pluginCenterEmpty"))}
      ${advanced() ? section(t("pluginDeveloperPreview"), previews.map(v2Card), 'data-plugin-section="developer-preview"', t("pluginCenterEmpty")) : ""}
      <div class="plugin-action-status" role="status" aria-live="polite" data-plugin-action-status></div></section>`;
    function remount(message){ mount(host); const status = host.querySelector("[data-plugin-action-status]"); if (status && message) status.textContent = message; }
    const search = host.querySelector("#pluginSearch");
    if (search) search.addEventListener("input", () => { const query = search.value.trim().toLowerCase(); host.querySelectorAll(".plugin-center-card").forEach((card) => card.classList.toggle("is-filtered-out", !!query && !card.textContent.toLowerCase().includes(query))); });
    host.querySelectorAll("[data-v2-install]").forEach((button) => button.addEventListener("click", () => {
      const manifest = activeRuntime.manifest(button.dataset.v2Install);
      const grants = manifest.permissions.filter((permission) => permission.required).flatMap((permission) => permission.scopes.map((scope) => `${permission.permissionId}:${scope}`));
      const result = activeRuntime.install(manifest.pluginId, { grants });
      if (result.ok) activeRuntime.enable(manifest.pluginId);
      remount(result.ok ? t("pluginInstalledSuccess") : t("pluginActionBlocked"));
    }));
    host.querySelectorAll("[data-v2-enable]").forEach((button) => button.addEventListener("click", () => { const result = activeRuntime.enable(button.dataset.v2Enable); remount(result.ok ? t("pluginEnabledSuccess") : t("pluginActionBlocked")); }));
    host.querySelectorAll("[data-v2-disable]").forEach((button) => button.addEventListener("click", () => { const result = activeRuntime.disable(button.dataset.v2Disable); remount(result.ok ? t("pluginDisabledSuccess") : t("pluginActionBlocked")); }));
    host.querySelectorAll("[data-v2-uninstall]").forEach((button) => button.addEventListener("click", () => {
      const id = button.dataset.v2Uninstall;
      const choice = host.querySelector(`[data-retention-for="${CSS.escape(id)}"]`);
      const result = activeRuntime.uninstall(id, { retainData:!choice || choice.value !== "delete" });
      remount(result.ok ? t("pluginUninstalledSuccess") : t("pluginActionBlocked"));
    }));
    host.querySelectorAll("[data-plugin-route]").forEach((button) => button.addEventListener("click", () => { if (window.WeishanRouter) window.WeishanRouter.setRoute(button.dataset.pluginRoute); }));
  }
  window.PluginsPage = { mount };
})();
