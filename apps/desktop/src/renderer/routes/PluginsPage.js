(function(){
  function t(key){ return window.I18n && typeof window.I18n.t === "function" ? window.I18n.t(key) : key; }
  function esc(value){ return String(value == null ? "" : value).replace(/[&<>\"]/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" })[char]); }
  function entries(){
    const registry = window.WeishanPluginRegistry;
    return registry && typeof registry.getPluginCenterEntries === "function" ? registry.getPluginCenterEntries() : [];
  }
  function presentation(plugin){
    const registry = window.WeishanPluginRegistry;
    return registry && typeof registry.presentationFor === "function" ? registry.presentationFor(plugin) : {};
  }
  function statusKey(plugin){
    if (presentation(plugin).userStatus === "coming_soon") return "pluginStatusComingSoon";
    if (plugin.enabled !== true) return "pluginStatusDisabled";
    return plugin.status === "available" ? "pluginStatusEnabled" : "pluginStatusUnavailable";
  }
  function card(plugin){
    const enabled = plugin.enabled === true && plugin.status === "available";
    const display = presentation(plugin);
    return `<article class="plugin-center-card" data-plugin-id="${esc(plugin.pluginId)}" data-plugin-enabled="${enabled ? "true" : "false"}">
      <div class="plugin-center-card-head"><span class="plugin-center-icon" aria-hidden="true">${esc(plugin.icon)}</span><div><h3>${esc(plugin.name)}</h3><p>${esc(display.tagline || plugin.description)}</p></div><span class="plugin-center-status ${enabled ? "is-enabled" : "is-disabled"}">${esc(t(statusKey(plugin)))}</span></div>
      <p class="plugin-center-note">${esc(display.runtimeNotice || t("pluginNotEnabledNote"))}</p>
      ${enabled ? `<button type="button" class="ws-btn plugin-workspace-open" data-plugin-route="${esc(plugin.entryPoint.routeId)}">${esc(t("openPluginWorkspace"))}</button>` : `<details class="plugin-center-details" data-plugin-details><summary>${esc(t("pluginViewDetails"))}</summary><p>${esc(t("pluginComingSoonDetails"))}</p></details>`}
    </article>`;
  }
  function discovery(){
    const categories = ["pluginCategoryVideo", "pluginCategoryImage", "pluginCategoryAudio", "pluginCategoryOffice", "pluginCategoryAi", "pluginCategoryDeveloper", "pluginCategoryCommerce", "pluginCategoryTravel"];
    return `<section class="plugin-discovery" aria-label="${esc(t("pluginCenter"))}"><div class="plugin-discovery-sections"><span>${esc(t("pluginMarketplace"))}</span><span>${esc(t("installedPlugins"))}</span><span>${esc(t("recommendedPlugins"))}</span><span>${esc(t("recentPlugins"))}</span></div><div><h3>${esc(t("pluginCategories"))}</h3><div class="plugin-discovery-categories">${categories.map((key) => `<span>${esc(t(key))}</span>`).join("")}<span>${esc(t("morePlugins"))}</span></div></div></section>`;
  }
  function mount(host){
    const plugins = entries();
    host.innerHTML = `<section class="ws-page plugin-center-page"><header class="ws-card plugin-center-hero"><h2>${t("pluginCenter")}</h2><p class="ws-muted">${t("pluginCenterDescription")}</p></header>${discovery()}<section class="plugin-center-list"><h3>${t("installedPlugins")}</h3><section class="plugin-center-grid">${plugins.map(card).join("") || `<div class="ws-card"><p class="ws-muted">${t("pluginCenterEmpty")}</p></div>`}</section></section></section>`;
    host.querySelectorAll("[data-plugin-route]").forEach((button) => button.addEventListener("click", () => {
      if (window.WeishanRouter && typeof window.WeishanRouter.setRoute === "function") window.WeishanRouter.setRoute(button.dataset.pluginRoute);
    }));
  }
  window.PluginsPage = { mount };
})();
