(function(){
  const KEY = "settings.sidebarCollapsed";
  const CLOUD_KEY = "settings.cloudEnterpriseExpanded";

  function t(key){ return window.I18n && typeof window.I18n.t === "function" ? window.I18n.t(key) : key; }
  function esc(value){ return String(value == null ? "" : value).replace(/[&<>\"]/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" })[char]); }
  function isCollapsed(){ return !!window.WeishanStore.read(KEY, false); }
  function setCollapsed(value){
    window.WeishanStore.write(KEY, !!value);
    if (document.querySelector(".sidebar")) refresh();
    else applyShellState();
  }
  function isCloudExpanded(){ return !!window.WeishanStore.read(CLOUD_KEY, false); }
  function setCloudExpanded(value){ window.WeishanStore.write(CLOUD_KEY, !!value); refresh(); }
  function applyShellState(){
    const shell = document.querySelector(".shell");
    if (shell) shell.classList.toggle("sidebar-collapsed", isCollapsed());
  }
  function appVersion(){ return window.WeishanConfig && window.WeishanConfig.version || "2.0.38"; }
  function modules(){ return window.WeishanModules || { groups:[], modulesForGroup(){ return []; }, get(){ return null; } }; }
  function ensureCloudRouteVisible(){
    const current = window.WeishanRouter && window.WeishanRouter.current && window.WeishanRouter.current();
    const item = modules().get(current);
    if (item && item.groupId === "cloud" && !isCloudExpanded()) window.WeishanStore.write(CLOUD_KEY, true);
  }
  function navItem(item){
    const permissions = window.WeishanPermissions;
    const locked = item.paid && permissions && typeof permissions.canUse === "function" && !permissions.canUse(item.id);
    const id = item.id;
    const label = t(item.labelKey || item.id);
    const active = window.WeishanRouter.current() === id;
    return `<button type="button" class="nav-item ${active ? "active" : ""}" data-route="${esc(id)}" title="${esc(label)}"><span class="nav-icon">${esc(item.icon)}</span><span class="nav-label">${esc(label)}</span>${item.pill ? `<b class="pill">${esc(item.pill)}</b>` : ""}${locked ? `<b class="paid">${esc(t("paidOnly"))}</b>` : ""}</button>`;
  }
  function groupMarkup(group){
    const groupModules = modules().modulesForGroup(group.id);
    if (group.id === "cloud") {
      const expanded = isCloudExpanded();
      const controls = "cloudEnterpriseNav";
      const items = expanded ? groupModules.map((item) => navItem(item)).join("") : "";
      return `<section class="nav-group nav-group-cloud ${expanded ? "is-expanded" : "is-collapsed"}" data-nav-group="cloud"><button type="button" class="nav-section nav-section-toggle" id="cloudEnterpriseToggle" aria-expanded="${expanded ? "true" : "false"}" aria-controls="${controls}"><span>${esc(t(group.labelKey))}</span><span class="nav-section-indicator" aria-hidden="true">${expanded ? "⌄" : "›"}</span></button><div id="${controls}" class="nav-group-items" ${expanded ? "" : "hidden"}>${items}</div></section>`;
    }
    return groupModules.length ? `<section class="nav-group" data-nav-group="${esc(group.id)}"><div class="nav-section">${esc(t(group.labelKey))}</div>${groupModules.map((item) => navItem(item)).join("")}</section>` : "";
  }
  function html(){
    ensureCloudRouteVisible();
    const collapsed = isCollapsed();
    const toggleLabel = t(collapsed ? "expandSidebar" : "collapseSidebar");
    const groups = modules().groups || [];
    return `<aside class="sidebar"><div class="brand"><div class="brand-logo"><img src="assets/ws-logo.png" alt="weishan logo"></div><div class="brand-name">weishan</div><button type="button" class="sidebar-toggle" id="sidebarToggle" title="${esc(toggleLabel)}" aria-label="${esc(toggleLabel)}" aria-expanded="${collapsed ? "false" : "true"}">${collapsed ? "›" : "‹"}</button></div><nav>${groups.map(groupMarkup).join("")}</nav><div class="sidebar-foot"><div>weishan v${esc(appVersion())}</div><div class="local-dot">● ${esc(t("localFirstMode"))}</div></div></aside>`;
  }
  function bind(root){
    const toggle = root.querySelector("#sidebarToggle");
    if (toggle) toggle.addEventListener("click", () => setCollapsed(!isCollapsed()));
    const cloudToggle = root.querySelector("#cloudEnterpriseToggle");
    if (cloudToggle) cloudToggle.addEventListener("click", () => setCloudExpanded(!isCloudExpanded()));
    root.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => window.WeishanRouter.setRoute(button.dataset.route)));
  }
  function mount(root){ applyShellState(); root.insertAdjacentHTML("afterbegin", html()); bind(root); }
  function refresh(){ const old = document.querySelector(".sidebar"); if (!old) return; const parent = old.parentElement; old.remove(); mount(parent); }
  window.Sidebar = { mount, refresh, isCollapsed, isCloudExpanded, setCloudExpanded };
})();
