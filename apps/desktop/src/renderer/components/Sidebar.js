(function(){
  const modules = [
    { id:"home", icon:"⌂", section:"core" }, { id:"projects", icon:"▣", section:"core" }, { id:"memory", icon:"◎", section:"core", pill:"AI" }, { id:"history", icon:"◷", section:"core" },
    { id:"mail", icon:"✉", section:"execution" }, { id:"crawler", icon:"☷", section:"execution" }, { id:"builder", icon:"⚒", section:"execution" }, { id:"commerce", icon:"◇", section:"execution", label:"全球采购" },
    { id:"storage", icon:"◫", section:"cloud" }, { id:"team", icon:"👥", section:"cloud", paid:true }, { id:"seats", icon:"▥", section:"cloud", paid:true }, { id:"reports", icon:"▤", section:"cloud", paid:true }, { id:"audit", icon:"☑", section:"cloud", paid:true },
    { id:"settings", icon:"⚙", section:"system" }, { id:"security", icon:"🛡", section:"system" }
  ];
  const KEY = "settings.sidebarCollapsed";
  function isCollapsed(){ return !!window.WeishanStore.read(KEY, false); }
  function setCollapsed(value){
    window.WeishanStore.write(KEY, !!value);
    if (document.querySelector(".sidebar")) refresh();
    else applyShellState();
  }
  function applyShellState(){
    const shell = document.querySelector(".shell");
    if (shell) shell.classList.toggle("sidebar-collapsed", isCollapsed());
  }
  function appVersion(){
    return window.WeishanConfig && window.WeishanConfig.version || "2.0.35";
  }
  function html(){
    let currentSection = "";
    const collapsed = isCollapsed();
    const toggleLabel = window.I18n.t(collapsed ? "expandSidebar" : "collapseSidebar");
    return `<aside class="sidebar"><div class="brand"><div class="brand-logo"><img src="assets/ws-logo.png" alt="weishan logo"></div><div class="brand-name">weishan</div><button class="sidebar-toggle" id="sidebarToggle" title="${toggleLabel}" aria-label="${toggleLabel}" aria-expanded="${collapsed ? "false" : "true"}">${collapsed ? "›" : "‹"}</button></div><nav>` + modules.map(m => {
      const section = m.section !== currentSection ? (currentSection = m.section, `<div class="nav-section">${window.I18n.t(m.section)}</div>`) : "";
      const locked = m.paid && !window.WeishanPermissions.canUse(m.id);
      const label = m.label || window.I18n.t(m.id);
      return `${section}<button class="nav-item ${window.WeishanRouter.current()===m.id?'active':''}" data-route="${m.id}" title="${label}"><span class="nav-icon">${m.icon}</span><span class="nav-label">${label}</span>${m.pill?`<b class="pill">${m.pill}</b>`:""}${locked?`<b class="paid">${window.I18n.t("paidOnly")}</b>`:""}</button>`;
    }).join("") + `</nav><div class="sidebar-foot"><div>weishan v${appVersion()}</div><div class="local-dot">● ${window.I18n.t("localFirstMode")}</div></div></aside>`;
  }
  function bind(root){
    const toggle = root.querySelector("#sidebarToggle");
    if (toggle) toggle.addEventListener("click", () => setCollapsed(!isCollapsed()));
    root.querySelectorAll(".nav-item").forEach(btn => btn.addEventListener("click", () => window.WeishanRouter.setRoute(btn.dataset.route)));
  }
  function mount(root){
    applyShellState();
    root.insertAdjacentHTML("afterbegin", html());
    bind(root);
  }
  function refresh(){ const old=document.querySelector(".sidebar"); if(!old) return; const parent=old.parentElement; old.remove(); mount(parent); }
  window.Sidebar = { mount, refresh, isCollapsed };
})();
