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
  function marketplace(){
    const registry = window.WeishanPluginRegistry;
    if (registry && typeof registry.marketplaceModel === "function") return registry.marketplaceModel();
    const list = entries();
    return { entries:list, recommended:[], installed:list.filter((plugin) => plugin.enabled === true), categories:[] };
  }
  function statusKey(plugin){
    if (presentation(plugin).userStatus === "coming_soon") return "pluginStatusComingSoon";
    if (plugin.enabled !== true) return "pluginStatusDisabled";
    return plugin.status === "available" ? "pluginStatusEnabled" : "pluginStatusUnavailable";
  }
  function categoryLabel(category){
    const map = {
      video:"pluginCategoryVideo",
      image:"pluginCategoryImage",
      audio:"pluginCategoryAudio",
      office:"pluginCategoryOffice",
      ai:"pluginCategoryAi",
      developer:"pluginCategoryDeveloper",
      commerce:"pluginCategoryCommerce",
      travel:"pluginCategoryTravel"
    };
    return t(map[category] || "pluginCategoryUtility");
  }
  function card(plugin){
    const enabled = plugin.enabled === true && plugin.status === "available";
    const display = presentation(plugin);
    const categories = Array.isArray(display.categories) ? display.categories : [];
    const reasons = Array.isArray(display.marketplaceReasons) ? display.marketplaceReasons : [];
    const license = plugin.license || {};
    const licenseLine = license.name && license.sourceReference ? `${license.name} · ${license.sourceReference}` : t("pluginLicenseUnknown");
    const permissionLine = Array.isArray(plugin.requestedPermissions) && plugin.requestedPermissions.length ? plugin.requestedPermissions.join(", ") : t("pluginNoExtraPermissions");
    const displayName = display.nameKey ? t(display.nameKey) : plugin.name;
    const tagline = display.taglineKey ? t(display.taglineKey) : (display.tagline || plugin.description);
    const runtimeNotice = display.runtimeNoticeKey ? t(display.runtimeNoticeKey) : (display.runtimeNotice || t("pluginNotEnabledNote"));
    const details = display.detailsKey ? t(display.detailsKey) : t("pluginComingSoonDetails");
    return `<article class="plugin-center-card" data-plugin-id="${esc(plugin.pluginId)}" data-plugin-enabled="${enabled ? "true" : "false"}">
      <div class="plugin-center-card-head"><span class="plugin-center-icon" aria-hidden="true">${esc(plugin.icon)}</span><div><h3>${esc(displayName)}</h3><p>${esc(tagline)}</p></div><span class="plugin-center-status ${enabled ? "is-enabled" : "is-disabled"}">${esc(t(statusKey(plugin)))}</span></div>
      ${categories.length ? `<div class="plugin-card-categories">${categories.map((category) => `<span>${esc(categoryLabel(category))}</span>`).join("")}</div>` : ""}
      ${reasons.length ? `<p class="plugin-center-fit">${esc(t("pluginWhyShown"))}</p>` : ""}
      <p class="plugin-center-note">${esc(runtimeNotice)}</p>
      <details class="plugin-center-details" data-plugin-details><summary>${esc(t("pluginViewDetails"))}</summary><p>${esc(details)}</p><dl><div><dt>${esc(t("pluginDetailLicense"))}</dt><dd>${esc(licenseLine)}</dd></div><div><dt>${esc(t("pluginDetailPermissions"))}</dt><dd>${esc(permissionLine)}</dd></div><div><dt>${esc(t("pluginDetailAvailability"))}</dt><dd>${esc(t(statusKey(plugin)))}</dd></div></dl></details>
      ${enabled ? `<button type="button" class="ws-btn plugin-workspace-open" data-plugin-route="${esc(plugin.entryPoint.routeId)}">${esc(t("openPluginWorkspace"))}</button>` : ""}
    </article>`;
  }
  function listSection(titleKey, plugins, emptyKey, attrs){
    return `<section class="plugin-center-list" ${attrs || ""}><h3>${esc(t(titleKey))}</h3><section class="plugin-center-grid">${plugins.map(card).join("") || `<div class="ws-card plugin-empty-state"><p class="ws-muted">${esc(t(emptyKey || "pluginCenterEmpty"))}</p></div>`}</section></section>`;
  }
  function discovery(model){
    const categories = Array.isArray(model.categories) ? model.categories : [];
    return `<section class="plugin-discovery" aria-label="${esc(t("pluginMarketplace"))}">
      <label class="plugin-search-label" for="pluginSearch">${esc(t("pluginSearchLabel"))}</label>
      <input id="pluginSearch" class="plugin-search-input" type="search" placeholder="${esc(t("pluginSearchPlaceholder"))}" autocomplete="off">
      <div class="plugin-discovery-sections"><span>${esc(t("pluginMarketplace"))}</span><span>${esc(t("installedPlugins"))}</span><span>${esc(t("recommendedPlugins"))}</span></div>
      <div><h3>${esc(t("pluginCategories"))}</h3><div class="plugin-discovery-categories">${categories.map((category) => `<button type="button" data-plugin-category="${esc(category)}">${esc(categoryLabel(category))}</button>`).join("") || `<span>${esc(t("pluginNoCategories"))}</span>`}</div></div>
    </section>`;
  }
  function mount(host){
    const model = marketplace();
    const plugins = model.entries || entries();
    host.innerHTML = `<section class="ws-page plugin-center-page"><header class="ws-card plugin-center-hero"><h2>${esc(t("pluginCenter"))}</h2><p class="ws-muted">${esc(t("pluginCenterDescription"))}</p></header>${discovery(model)}${listSection("recommendedPlugins", model.recommended || [], "pluginRecommendedEmpty", "data-plugin-section=\"recommended\"")}${listSection("pluginAllPlugins", plugins, "pluginCenterEmpty", "data-plugin-section=\"available\"")}${listSection("installedPlugins", model.installed || [], "pluginInstalledEmpty", "data-plugin-section=\"installed\"")}</section>`;
    function applyFilter(){
      const query = (host.querySelector("#pluginSearch").value || "").trim().toLowerCase();
      const cards = Array.from(host.querySelectorAll(".plugin-center-card"));
      cards.forEach((item) => {
        const text = item.textContent.toLowerCase();
        item.classList.toggle("is-filtered-out", !!query && !text.includes(query));
      });
      Array.from(host.querySelectorAll("[data-plugin-section]")).forEach((section) => {
        const visibleCards = Array.from(section.querySelectorAll(".plugin-center-card")).filter((item) => !item.classList.contains("is-filtered-out"));
        let empty = section.querySelector("[data-plugin-filter-empty]");
        if (!visibleCards.length && query) {
          if (!empty) {
            empty = document.createElement("div");
            empty.className = "ws-card plugin-empty-state";
            empty.setAttribute("data-plugin-filter-empty", "true");
            empty.innerHTML = `<p class="ws-muted">${esc(t("pluginNoSearchResults"))}</p>`;
            section.querySelector(".plugin-center-grid").appendChild(empty);
          }
        } else if (empty) {
          empty.remove();
        }
      });
    }
    const search = host.querySelector("#pluginSearch");
    if (search) search.addEventListener("input", applyFilter);
    host.querySelectorAll("[data-plugin-category]").forEach((button) => button.addEventListener("click", () => {
      const searchInput = host.querySelector("#pluginSearch");
      searchInput.value = button.textContent.trim();
      searchInput.focus();
      applyFilter();
    }));
    host.querySelectorAll("[data-plugin-route]").forEach((button) => button.addEventListener("click", () => {
      if (window.WeishanRouter && typeof window.WeishanRouter.setRoute === "function") window.WeishanRouter.setRoute(button.dataset.pluginRoute);
    }));
  }
  window.PluginsPage = { mount };
})();
