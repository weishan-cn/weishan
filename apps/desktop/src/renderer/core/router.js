(function(){
  let current = "home";
  let mounted = "";
  const pages = {
    home:"HomePage", projects:"ProjectsPage", memory:"MemoryPage", history:"HistoryPage", mail:"MailPage", crawler:"CrawlerPage",
    builder:"BuilderPage", storage:"StoragePage", team:"TeamPage", seats:"SeatsPage", reports:"ReportsPage", audit:"AuditPage",
    settings:"SettingsPage", security:"SecurityPage", commerce:"CommerceAgentPage"
  };
  function setRoute(id){ current = pages[id] ? id : "home"; refresh(); }
  function refresh(){
    const host = document.getElementById("pageHost");
    if (!host) return;
    const previous = mounted && window[pages[mounted]];
    if (previous && typeof previous.unmount === "function") {
      try { previous.unmount(host); } catch (_) {}
    }
    host.innerHTML = "";
    mounted = current;
    const page = window[pages[current]];
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
