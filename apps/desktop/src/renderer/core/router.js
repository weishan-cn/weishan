(function(){
  let current = "home";
  let mounted = "";
  function pageFor(id){
    const corePage = window.WeishanModules && typeof window.WeishanModules.pageFor === "function" ? window.WeishanModules.pageFor(id) : "";
    if (corePage) return corePage;
    return window.WeishanPluginRegistry && typeof window.WeishanPluginRegistry.pageForRoute === "function" ? window.WeishanPluginRegistry.pageForRoute(id) : "";
  }
  function setRoute(id){ current = pageFor(id) ? id : "home"; refresh(); }
  function refresh(){
    const host = document.getElementById("pageHost");
    if (!host) return;
    const previous = mounted && window[pageFor(mounted)];
    if (previous && typeof previous.unmount === "function") {
      try { previous.unmount(host); } catch (_) {}
    }
    host.innerHTML = "";
    mounted = current;
    const page = window[pageFor(current)];
    if (page && page.mount) page.mount(host);
    if (window.Sidebar) window.Sidebar.refresh();
    if (window.Topbar) window.Topbar.refresh();
    try {
      window.dispatchEvent(new CustomEvent("weishan:route-changed", { detail:{ route:current } }));
    } catch (_) {}
  }
  function getCurrent(){ return current; }
  window.WeishanRouter = { setRoute, refresh, current:getCurrent };
})();
