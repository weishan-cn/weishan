(function(){
  function loadRepairCenter(){
    return new Promise((resolve) => {
      if (window.WeishanRepairCenter) {
        resolve(window.WeishanRepairCenter);
        return;
      }
      const script = document.createElement("script");
      script.src = "./renderer/core/repairCenter.js?v=2.0.15";
      script.onload = () => resolve(window.WeishanRepairCenter || null);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  }
  function loadScriptOnce(globalName, src){
    return new Promise((resolve) => {
      if (window[globalName]) {
        resolve(window[globalName]);
        return;
      }
      const existing = document.querySelector('script[data-weishan-dynamic="' + globalName + '"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(window[globalName] || null), { once:true });
        existing.addEventListener("error", () => resolve(null), { once:true });
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.dataset.weishanDynamic = globalName;
      script.onload = () => resolve(window[globalName] || null);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  }
  function loadCommerceAgent(){
    return loadScriptOnce("WeishanCommerceAgent", "./renderer/core/commerceAgent.js?v=2.0.63");
  }
  function loadCommerceAgentPage(){
    return loadScriptOnce("CommerceAgentPage", "./renderer/routes/CommerceAgentPage.js?v=2.0.63");
  }
  function installCommerceRoute(){
    if (!window.WeishanRouter || window.WeishanRouter.__commerceRouteInstalled) return;
    const originalSetRoute = window.WeishanRouter.setRoute;
    const originalRefresh = window.WeishanRouter.refresh;
    const originalCurrent = window.WeishanRouter.current;
    let commerceActive = false;
    function mountCommerce(){
      const host = document.getElementById("pageHost");
      if (!host) return;
      host.innerHTML = "";
      if (window.CommerceAgentPage && window.CommerceAgentPage.mount) window.CommerceAgentPage.mount(host);
      if (window.Sidebar) window.Sidebar.refresh();
      if (window.Topbar) window.Topbar.refresh();
    }
    window.WeishanRouter.setRoute = function(id){
      if (id === "commerce") {
        commerceActive = true;
        loadCommerceAgent().then(loadCommerceAgentPage).then(mountCommerce);
        return;
      }
      commerceActive = false;
      return originalSetRoute.call(window.WeishanRouter, id);
    };
    window.WeishanRouter.refresh = function(){
      if (commerceActive) {
        loadCommerceAgent().then(loadCommerceAgentPage).then(mountCommerce);
        return;
      }
      return originalRefresh.call(window.WeishanRouter);
    };
    window.WeishanRouter.current = function(){
      return commerceActive ? "commerce" : originalCurrent.call(window.WeishanRouter);
    };
    window.WeishanRouter.__commerceRouteInstalled = true;
  }
  function installRepairCenter(){
    loadRepairCenter().then((repair) => {
      try {
        if (repair && typeof repair.installRepairErrorCapture === "function") repair.installRepairErrorCapture();
      } catch (_) {}
    });
  }
  function mount(){
    const root = document.getElementById("app");
    root.innerHTML = `<div class="shell"><main class="main"><div id="pageHost" class="page-host"></div></main></div>`;
    const shell = root.querySelector(".shell");
    installRepairCenter();
    installCommerceRoute();
    loadCommerceAgent();
    window.Sidebar.mount(shell);
    window.Topbar.mount(shell);
    window.WeishanRouter.setRoute("home");
    window.addEventListener("weishan:lang", () => window.WeishanRouter.refresh());
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
