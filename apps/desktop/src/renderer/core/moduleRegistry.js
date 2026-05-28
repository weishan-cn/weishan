(function(){
  const modules = [
    { id:"home", icon:"⌂", section:"core" },
    { id:"projects", icon:"▣", section:"core" },
    { id:"memory", icon:"◎", section:"core", pill:"AI" },
    { id:"history", icon:"◷", section:"core" },
    { id:"mail", icon:"✉", section:"execution" },
    { id:"crawler", icon:"☷", section:"execution" },
    { id:"builder", icon:"⚒", section:"execution" },
    { id:"storage", icon:"◫", section:"cloud" },
    { id:"team", icon:"👥", section:"cloud", premium:true },
    { id:"seats", icon:"▥", section:"cloud", premium:true },
    { id:"reports", icon:"▤", section:"cloud", premium:true },
    { id:"audit", icon:"☑", section:"cloud", premium:true },
    { id:"settings", icon:"⚙", section:"system" },
    { id:"security", icon:"🛡", section:"system" }
  ];
  function get(id) { return modules.find((m) => m.id === id) || modules[0]; }
  function route(id) {
    const base = get(id);
    return Object.assign({}, base, {
      label: window.I18n.t("nav." + base.id),
      title: window.I18n.t("route." + base.id + ".title"),
      subtitle: window.I18n.t("route." + base.id + ".subtitle"),
      locked: !window.WeishanPermissions.canUse(base.id)
    });
  }
  window.WeishanModules = { modules, get, route };
})();
