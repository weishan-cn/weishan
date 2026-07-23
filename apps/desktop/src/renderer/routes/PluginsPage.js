(function(){
  function t(key){ return window.I18n && typeof window.I18n.t === "function" ? window.I18n.t(key) : key; }
  function mount(host){
    host.innerHTML = `<section class="ws-page"><div class="ws-card"><h2>${t("pluginCenter")}</h2><p class="ws-muted">${t("pluginCenterDescription")}</p></div></section>`;
  }
  window.PluginsPage = { mount };
})();
