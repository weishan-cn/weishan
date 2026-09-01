(function(){
  function title(){ return window.I18n.t(window.WeishanRouter.current()); }
  function accountLabel(){ const a=window.AccountApi.current(); return a.loggedIn ? window.AccountApi.publicName(a) : window.I18n.t("loginRegister"); }
  function labels(){
    return { ai:window.I18n.t("aiConnected"), workspace:window.I18n.t("workspace"), userMenu:window.I18n.t("userMenu"), profile:window.I18n.t("myAccount"), settings:window.I18n.t("settings"), mail:window.I18n.t("emailGateway"), logout:window.I18n.t("signOut"), follow:"🌐 " + window.I18n.t("followSystem"), current:window.I18n.t("currentLanguage"), system:window.I18n.t("systemLanguage") };
  }
  function languageMarkup(){
    const i18n = window.I18n;
    const preference = i18n.getLanguagePreference();
    const system = i18n.systemLanguage();
    const selected = preference.mode === "system" ? "system" : preference.language;
    const options = [`<option value="system">${labels().follow} · ${i18n.languageName(system)}</option>`]
      .concat(i18n.getLanguageOptions().map(function(option){ return `<option value="${option.code}">${option.nativeName}</option>`; }))
      .join("");
    const context = preference.mode === "system"
      ? `${labels().follow} · ${i18n.languageName(system)}`
      : `${labels().current}: ${i18n.languageName(preference.language)} · ${labels().system}: ${i18n.languageName(system)}`;
    return `<div class="language-control"><select id="langSelect" class="select-small" aria-label="Language">${options}</select><span class="language-context" id="languageContext">${context}</span><input type="hidden" id="languageSelection" value="${selected}"></div>`;
  }
  function html(){
    const text = labels();
    return `<header class="topbar"><div><h1>${title()}</h1><p>${window.I18n.t("topbarSubtitleConsumer")}</p></div><div class="top-actions">${languageMarkup()}<div class="user-menu"><button class="small" id="userMenuBtn" type="button" title="${text.userMenu}" aria-label="${text.userMenu}" aria-expanded="false" aria-controls="userMenu">${accountLabel()}</button><div class="user-menu-popover" id="userMenu" role="menu" hidden><button type="button" role="menuitem" data-user-menu-action="profile" disabled aria-disabled="true">${text.profile}</button><button type="button" role="menuitem" data-user-menu-action="workspace">${text.workspace}</button><button type="button" role="menuitem" data-user-menu-action="settings">${text.settings}</button><button type="button" role="menuitem" data-user-menu-action="mail">${text.mail}</button><span class="user-menu-divider" role="separator"></span><button type="button" role="menuitem" data-user-menu-action="logout">${text.logout}</button></div></div></div></header>`;
  }
  function bind(){
    const lang = document.getElementById("langSelect");
    const preference = window.I18n.getLanguagePreference();
    lang.value = preference.mode === "system" ? "system" : preference.language;
    lang.addEventListener("change", function(event){
      const value = event.target.value;
      window.I18n.setLanguagePreference(value === "system" ? { mode:"system" } : { mode:"manual", language:value });
    });
    const menuButton = document.getElementById("userMenuBtn");
    const menu = document.getElementById("userMenu");
    menuButton.addEventListener("click", function(){
      const open = menu.hidden;
      menu.hidden = !open;
      menuButton.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.addEventListener("click", function(event){
      const action = event.target && event.target.getAttribute("data-user-menu-action");
      if (!action) return;
      if (action === "workspace") window.WeishanRouter.setRoute("projects");
      if (action === "settings") window.WeishanRouter.setRoute("settings");
      if (action === "mail") window.WeishanRouter.setRoute("mail");
      if (action === "logout") { window.AccountApi.logout(); window.WeishanRouter.refresh(); return; }
      menu.hidden = true;
      menuButton.setAttribute("aria-expanded", "false");
    });
  }
  function mount(root){ root.querySelector(".main").insertAdjacentHTML("afterbegin", html()); bind(); }
  function refresh(){ const old=document.querySelector(".topbar"); if(!old) return; const parent=old.parentElement; old.remove(); parent.insertAdjacentHTML("afterbegin", html()); bind(); }
  window.Topbar = { mount, refresh };
})();
