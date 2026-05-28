(function(){
  function mount(){
    const root = document.getElementById("app");
    root.innerHTML = `<div class="shell"><main class="main"><div id="pageHost" class="page-host"></div></main></div>`;
    const shell = root.querySelector(".shell");
    window.Sidebar.mount(shell);
    window.Topbar.mount(shell);
    window.WeishanRouter.setRoute("home");
    window.addEventListener("weishan:lang", () => window.WeishanRouter.refresh());
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
