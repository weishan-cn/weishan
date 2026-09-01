(function(){
  const groups = [
    { id:"core", labelKey:"work" },
    { id:"execution", labelKey:"services" },
    { id:"advanced", labelKey:"advanced" },
    { id:"cloud", labelKey:"cloud", collapsible:true, stateKey:"settings.cloudEnterpriseExpanded", defaultExpanded:false, hideWhenNoVisibleModules:true },
    { id:"system", labelKey:"system" }
  ];
  const modules = [
    { id:"home", icon:"⌂", groupId:"core", page:"HomePage", experience:"standard" },
    { id:"projects", icon:"▣", groupId:"core", page:"ProjectsPage", experience:"standard" },
    { id:"memory", icon:"◎", groupId:"core", page:"MemoryPage", experience:"standard" },
    { id:"history", icon:"◷", groupId:"core", page:"HistoryPage", experience:"standard" },
    { id:"mail", icon:"✉", groupId:"execution", page:"MailPage", experience:"standard" },
    { id:"commerce", icon:"◇", groupId:"execution", page:"CommerceAgentPage", experience:"standard" },
    { id:"plugins", icon:"▦", groupId:"execution", page:"PluginsPage", experience:"standard" },
    { id:"crawler", icon:"☷", groupId:"advanced", page:"CrawlerPage", experience:"advanced" },
    { id:"builder", icon:"⚒", groupId:"advanced", page:"BuilderPage", experience:"advanced" },
    { id:"storage", icon:"◫", groupId:"cloud", page:"StoragePage", visibleInNavigation:false, routeEnabled:false, deferredNavigation:true },
    { id:"team", icon:"👥", groupId:"cloud", page:"TeamPage", paid:true, visibleInNavigation:false, routeEnabled:false, deferredNavigation:true },
    { id:"seats", icon:"▥", groupId:"cloud", page:"SeatsPage", paid:true, visibleInNavigation:false, routeEnabled:false, deferredNavigation:true },
    { id:"reports", icon:"▤", groupId:"cloud", page:"ReportsPage", paid:true, visibleInNavigation:false, routeEnabled:false, deferredNavigation:true },
    { id:"audit", icon:"☑", groupId:"advanced", page:"AuditPage", experience:"advanced" },
    { id:"settings", icon:"⚙", groupId:"system", page:"SettingsPage", experience:"standard" },
    { id:"security", icon:"🛡", groupId:"system", page:"SecurityPage", experience:"standard" }
  ];

  function unique(list, key){ return new Set(list.map((item) => item[key])).size === list.length; }
  function assertRegistry(){
    if (!unique(groups, "id") || !unique(modules, "id")) throw new Error("navigation registry ids must be unique");
    if (modules.some((item) => !groups.some((group) => group.id === item.groupId))) throw new Error("navigation entry has an unknown group");
  }
  function get(id){ return modules.find((item) => item.id === id) || null; }
  function getGroup(id){ return groups.find((item) => item.id === id) || null; }
  function experience(){ return window.WeishanExperienceMode || { allows:(item) => !!item && item.routeEnabled !== false }; }
  function isModuleVisible(item){ return !!item && item.visibleInNavigation !== false && experience().allows(item); }
  function isRouteEnabled(item){ return !!item && item.routeEnabled !== false && experience().allows(item); }
  function modulesForGroup(groupId, options){
    const includeHidden = options && options.includeHidden === true;
    return modules.filter((item) => item.groupId === groupId && (includeHidden || isModuleVisible(item)));
  }
  function isGroupVisible(groupId){
    const group = getGroup(groupId);
    if (!group) return false;
    if (group.hideWhenNoVisibleModules) return modulesForGroup(groupId).length > 0;
    return true;
  }
  function coreRouteIds(){ return modules.filter((item) => item.routeEnabled !== false).map((item) => item.id); }
  function hasRoute(id){ return isRouteEnabled(get(id)); }
  function pageFor(id){ const item = get(id); return isRouteEnabled(item) ? item.page : ""; }
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
  window.WeishanModules = { groups, modules, get, getGroup, modulesForGroup, isGroupVisible, isModuleVisible, isRouteEnabled, coreRouteIds, hasRoute, pageFor, route };
})();
