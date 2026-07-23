(function(){
  const groups = [
    { id:"core", labelKey:"core" },
    { id:"execution", labelKey:"execution" },
    { id:"plugins", labelKey:"plugins", dynamic:true },
    { id:"cloud", labelKey:"cloud", collapsible:true, stateKey:"settings.cloudEnterpriseExpanded", defaultExpanded:false },
    { id:"system", labelKey:"system" }
  ];
  const modules = [
    { id:"home", icon:"⌂", groupId:"core", page:"HomePage" },
    { id:"projects", icon:"▣", groupId:"core", page:"ProjectsPage" },
    { id:"memory", icon:"◎", groupId:"core", page:"MemoryPage", pill:"AI" },
    { id:"history", icon:"◷", groupId:"core", page:"HistoryPage" },
    { id:"mail", icon:"✉", groupId:"execution", page:"MailPage" },
    { id:"crawler", icon:"☷", groupId:"execution", page:"CrawlerPage" },
    { id:"builder", icon:"⚒", groupId:"execution", page:"BuilderPage" },
    { id:"commerce", icon:"◇", groupId:"execution", page:"CommerceAgentPage" },
    { id:"storage", icon:"◫", groupId:"cloud", page:"StoragePage" },
    { id:"team", icon:"👥", groupId:"cloud", page:"TeamPage", paid:true },
    { id:"seats", icon:"▥", groupId:"cloud", page:"SeatsPage", paid:true },
    { id:"reports", icon:"▤", groupId:"cloud", page:"ReportsPage", paid:true },
    { id:"audit", icon:"☑", groupId:"cloud", page:"AuditPage", paid:true },
    { id:"settings", icon:"⚙", groupId:"system", page:"SettingsPage" },
    { id:"security", icon:"🛡", groupId:"system", page:"SecurityPage" }
  ];

  function unique(list, key){ return new Set(list.map((item) => item[key])).size === list.length; }
  function assertRegistry(){
    if (!unique(groups, "id") || !unique(modules, "id")) throw new Error("navigation registry ids must be unique");
    if (modules.some((item) => !groups.some((group) => group.id === item.groupId))) throw new Error("navigation entry has an unknown group");
  }
  function get(id){ return modules.find((item) => item.id === id) || null; }
  function getGroup(id){ return groups.find((item) => item.id === id) || null; }
  function modulesForGroup(groupId){ return modules.filter((item) => item.groupId === groupId); }
  function coreRouteIds(){ return modules.map((item) => item.id); }
  function hasRoute(id){ return !!get(id); }
  function pageFor(id){ const item = get(id); return item ? item.page : ""; }
  function route(id){
    const base = get(id) || modules[0];
    const translate = window.I18n && typeof window.I18n.t === "function" ? window.I18n.t : (key) => key;
    const permissions = window.WeishanPermissions;
    return Object.assign({}, base, {
      label:translate(base.labelKey || base.id),
      title:translate("route." + base.id + ".title"),
      subtitle:translate("route." + base.id + ".subtitle"),
      locked:!!(permissions && typeof permissions.canUse === "function" && !permissions.canUse(base.id))
    });
  }

  assertRegistry();
  window.WeishanModules = { groups, modules, get, getGroup, modulesForGroup, coreRouteIds, hasRoute, pageFor, route };
})();
