(function(){
  let current = "home";
  const pages = {
    home:"HomePage", projects:"ProjectsPage", memory:"MemoryPage", history:"HistoryPage", mail:"MailPage", crawler:"CrawlerPage",
    builder:"BuilderPage", storage:"StoragePage", team:"TeamPage", seats:"SeatsPage", reports:"ReportsPage", audit:"AuditPage",
    settings:"SettingsPage", security:"SecurityPage"
  };
  function setRoute(id){ current = pages[id] ? id : "home"; refresh(); }
  function refresh(){
    const host = document.getElementById("pageHost");
    if (!host) return;
    host.innerHTML = "";
    const page = window[pages[current]];
    if (page && page.mount) page.mount(host);
    if (window.Sidebar) window.Sidebar.refresh();
    if (window.Topbar) window.Topbar.refresh();
  }
  function getCurrent(){ return current; }
  window.WeishanRouter = { setRoute, refresh, current:getCurrent };
})();
