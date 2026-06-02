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
    window.Sidebar.mount(shell);
    window.Topbar.mount(shell);
    window.WeishanRouter.setRoute("home");
    window.addEventListener("weishan:lang", () => window.WeishanRouter.refresh());
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
