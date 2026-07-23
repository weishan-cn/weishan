(function(){
  function t(key){ return window.I18n && typeof window.I18n.t === "function" ? window.I18n.t(key) : key; }
  function esc(value){ return String(value == null ? "" : value).replace(/[&<>\"]/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" })[char]); }
  function entries(){
    const registry = window.WeishanPluginRegistry;
    return registry && typeof registry.getPluginCenterEntries === "function" ? registry.getPluginCenterEntries() : [];
  }
  function statusKey(plugin){
    if (plugin.enabled !== true) return "pluginStatusDisabled";
    return plugin.status === "available" ? "pluginStatusEnabled" : "pluginStatusUnavailable";
  }
  function card(plugin){
    const enabled = plugin.enabled === true && plugin.status === "available";
    const capabilities = Array.isArray(plugin.capabilities) ? plugin.capabilities : [];
    return `<article class="plugin-center-card" data-plugin-id="${esc(plugin.pluginId)}" data-plugin-enabled="${enabled ? "true" : "false"}">
      <div class="plugin-center-card-head"><span class="plugin-center-icon" aria-hidden="true">${esc(plugin.icon)}</span><div><h3>${esc(plugin.name)}</h3><p>${esc(plugin.description)}</p></div><span class="plugin-center-status ${enabled ? "is-enabled" : "is-disabled"}">${esc(t(statusKey(plugin)))}</span></div>
      <dl class="plugin-center-meta"><div><dt>${esc(t("pluginVersion"))}</dt><dd>${esc(plugin.version)}</dd></div><div><dt>${esc(t("pluginCapabilities"))}</dt><dd>${esc(capabilities.join(" · "))}</dd></div></dl>
      ${enabled ? `<button type="button" class="ws-btn plugin-workspace-open" data-plugin-route="${esc(plugin.entryPoint.routeId)}">${esc(t("openPluginWorkspace"))}</button>` : `<p class="plugin-center-note">${esc(t("pluginNotEnabledNote"))}</p>`}
    </article>`;
  }
  function mount(host){
    const plugins = entries();
    host.innerHTML = `<section class="ws-page plugin-center-page"><header class="ws-card plugin-center-hero"><h2>${t("pluginCenter")}</h2><p class="ws-muted">${t("pluginCenterDescription")}</p></header><section class="plugin-center-grid">${plugins.map(card).join("") || `<div class="ws-card"><p class="ws-muted">${t("pluginCenterEmpty")}</p></div>`}</section></section>`;
    host.querySelectorAll("[data-plugin-route]").forEach((button) => button.addEventListener("click", () => {
      if (window.WeishanRouter && typeof window.WeishanRouter.setRoute === "function") window.WeishanRouter.setRoute(button.dataset.pluginRoute);
    }));
  }
  window.PluginsPage = { mount };
})();
