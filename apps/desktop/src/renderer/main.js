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
    return loadScriptOnce("WeishanCommerceAgent", "./renderer/core/commerceAgent.js?v=2.1.2");
  }
  function loadCommerceAgentPage(){
    return loadScriptOnce("CommerceAgentPage", "./renderer/routes/CommerceAgentPage.js?v=2.1.2");
  }
  function commerceRouteFallbackHtml(state){
    const loading = state === "loading";
    return `<section class="commerce-page commerce-workbench commerce-route-fallback" data-commerce-route-fallback="${loading ? "loading" : "unavailable"}">
      <div class="commerce-hero">
        <div>
          <h1>全球采购</h1>
          <p>搜索商品、比较可信来源，并在确认后前往平台查看。</p>
        </div>
        <button class="cmd-btn gray" id="commerceFallbackBackHome" type="button">返回首页总调度</button>
      </div>
      <div class="commerce-toolbar commerce-toolbar-workspace">
        <div class="commerce-toolbar-input">
          <label class="commerce-toolbar-label" for="commerceFallbackInput">搜索需求</label>
          <textarea id="commerceFallbackInput" class="cmd-input commerce-input" placeholder="搜索商品或描述你想买什么"></textarea>
        </div>
        <div class="cmd-actions">
          <button class="cmd-btn primary" id="commerceFallbackRetry" type="button">${loading ? "正在准备…" : "重新加载"}</button>
        </div>
      </div>
      <div class="commerce-layout">
        <div class="commerce-detail commerce-detail-empty" data-commerce-empty-state="true">
          <h2>${loading ? "正在准备全球采购" : "全球采购暂时未能完整加载"}</h2>
          <p>${loading ? "你可以先输入想找的商品；Basic Mode 不依赖 AI。" : "你的需求尚未提交。请重新加载，或返回首页后再试。"}</p>
        </div>
      </div>
    </section>`;
  }
  function renderCommerceRouteFallback(host, state, retry){
    if (!host) return;
    host.innerHTML = commerceRouteFallbackHtml(state);
    const back = host.querySelector("#commerceFallbackBackHome");
    if (back) back.addEventListener("click", () => window.WeishanRouter && window.WeishanRouter.setRoute("home"));
    const retryButton = host.querySelector("#commerceFallbackRetry");
    if (retryButton) {
      retryButton.disabled = state === "loading";
      if (!retryButton.disabled && typeof retry === "function") retryButton.addEventListener("click", retry);
    }
  }
  function installCommerceRoute(){
    if (!window.WeishanRouter || window.WeishanRouter.__commerceRouteInstalled) return;
    const originalSetRoute = window.WeishanRouter.setRoute;
    const originalRefresh = window.WeishanRouter.refresh;
    const originalCurrent = window.WeishanRouter.current;
    let commerceActive = false;
    function mountCommerce(){
      const host = document.getElementById("pageHost");
      if (!host || !commerceActive) return;
      const pendingInput = host.querySelector("#commerceFallbackInput");
      const pendingDraft = pendingInput ? pendingInput.value : "";
      if (!window.CommerceAgentPage || typeof window.CommerceAgentPage.mount !== "function") {
        renderCommerceRouteFallback(host, "unavailable", () => window.WeishanRouter.refresh());
        return;
      }
      try {
        window.CommerceAgentPage.mount(host);
        const commerceInput = host.querySelector("#commerceInput");
        if (commerceInput && pendingDraft) {
          commerceInput.value = pendingDraft;
          commerceInput.dispatchEvent(new Event("input", { bubbles:true }));
        }
      } catch (_) {
        renderCommerceRouteFallback(host, "unavailable", () => window.WeishanRouter.refresh());
      }
      if (window.Sidebar) window.Sidebar.refresh();
      if (window.Topbar) window.Topbar.refresh();
    }
    function loadAndMountCommerce(){
      const host = document.getElementById("pageHost");
      if (host) renderCommerceRouteFallback(host, "loading");
      return loadCommerceAgent().then(loadCommerceAgentPage).then(mountCommerce).catch(() => {
        const currentHost = document.getElementById("pageHost");
        if (commerceActive && currentHost) renderCommerceRouteFallback(currentHost, "unavailable", loadAndMountCommerce);
      });
    }
    window.WeishanRouter.setRoute = function(id){
      if (id === "commerce") {
        commerceActive = true;
        loadAndMountCommerce();
        return;
      }
      commerceActive = false;
      return originalSetRoute.call(window.WeishanRouter, id);
    };
    window.WeishanRouter.refresh = function(){
      if (commerceActive) {
        loadAndMountCommerce();
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
    window.addEventListener("weishan:experience-mode", () => {
      const current = window.WeishanRouter.current();
      if (window.WeishanModules && !window.WeishanModules.hasRoute(current)) window.WeishanRouter.setRoute("home");
      else window.WeishanRouter.refresh();
    });
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
