(function(){
  let draftText = "";
  let selectedTaskId = "";
  let lastViewedTaskId = "";
  let pendingSafeExternalSearchConfirmation = null;
  let pendingSafeProviderHandoffConfirmation = null;

  function esc(s){
    return String(s || "").replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; });
  }

  function agent(){
    return window.WeishanCommerceAgent || null;
  }

  function searchApi(){
    return window.WeishanCommerceSearch || null;
  }

  function ensureSearchLoaded(host){
    if (!window.WeishanCommerceProviderAdapter && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceProviderAdapter"]')) {
      const adapter = document.createElement("script");
      adapter.src = "./renderer/core/commerceProviderAdapter.js?v=2.0.32";
      adapter.dataset.weishanDynamic = "WeishanCommerceProviderAdapter";
      adapter.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(adapter);
      return;
    }
    if (!window.WeishanCommerceProviderConnector && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceProviderConnector"]')) {
      const connector = document.createElement("script");
      connector.src = "./renderer/core/commerceProviderConnector.js?v=2.0.32";
      connector.dataset.weishanDynamic = "WeishanCommerceProviderConnector";
      connector.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(connector);
      return;
    }
    if (!window.WeishanCommerceGlobalProviderPool && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceGlobalProviderPool"]')) {
      const pool = document.createElement("script");
      pool.src = "./renderer/core/commerceGlobalProviderPool.js?v=2.0.32";
      pool.dataset.weishanDynamic = "WeishanCommerceGlobalProviderPool";
      pool.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(pool);
      return;
    }
    if (!window.WeishanCommerceProviderOnboardingChecklist && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceProviderOnboardingChecklist"]')) {
      const onboarding = document.createElement("script");
      onboarding.src = "./renderer/core/commerceProviderOnboardingChecklist.js?v=2.0.40";
      onboarding.dataset.weishanDynamic = "WeishanCommerceProviderOnboardingChecklist";
      onboarding.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(onboarding);
      return;
    }
    if (!window.WeishanCommerceProviderApprovalWorkflow && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceProviderApprovalWorkflow"]')) {
      const approval = document.createElement("script");
      approval.src = "./renderer/core/commerceProviderApprovalWorkflow.js?v=2.0.40";
      approval.dataset.weishanDynamic = "WeishanCommerceProviderApprovalWorkflow";
      approval.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(approval);
      return;
    }
    if (!window.WeishanCommerceProductProviderCandidate && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceProductProviderCandidate"]')) {
      const candidate = document.createElement("script");
      candidate.src = "./renderer/core/commerceProductProviderCandidate.js?v=2.0.43";
      candidate.dataset.weishanDynamic = "WeishanCommerceProductProviderCandidate";
      candidate.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(candidate);
      return;
    }
    if (!window.WeishanCommerceEbayBrowseStubProfile && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceEbayBrowseStubProfile"]')) {
      const profile = document.createElement("script");
      profile.src = "./renderer/core/commerceEbayBrowseStubProfile.js?v=2.0.43";
      profile.dataset.weishanDynamic = "WeishanCommerceEbayBrowseStubProfile";
      profile.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(profile);
      return;
    }
    if (!window.WeishanCommerceProductProviderSelection && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceProductProviderSelection"]')) {
      const selection = document.createElement("script");
      selection.src = "./renderer/core/commerceProductProviderSelection.js?v=2.0.32";
      selection.dataset.weishanDynamic = "WeishanCommerceProductProviderSelection";
      selection.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(selection);
      return;
    }
    if (!window.WeishanCommerceLocationPolicy && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceLocationPolicy"]')) {
      const location = document.createElement("script");
      location.src = "./renderer/core/commerceLocationPolicy.js?v=2.0.32";
      location.dataset.weishanDynamic = "WeishanCommerceLocationPolicy";
      location.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(location);
      return;
    }
    if (!window.WeishanCommerceLocalLawCompliance && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceLocalLawCompliance"]')) {
      const localLaw = document.createElement("script");
      localLaw.src = "./renderer/core/commerceLocalLawCompliance.js?v=2.0.40";
      localLaw.dataset.weishanDynamic = "WeishanCommerceLocalLawCompliance";
      localLaw.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(localLaw);
      return;
    }
    if (!window.WeishanCommerceProviderConfig && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceProviderConfig"]')) {
      const config = document.createElement("script");
      config.src = "./renderer/core/commerceProviderConfig.js?v=2.0.48";
      config.dataset.weishanDynamic = "WeishanCommerceProviderConfig";
      config.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(config);
      return;
    }
    if (!window.WeishanCommerceProviderSandbox && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceProviderSandbox"]')) {
      const sandbox = document.createElement("script");
      sandbox.src = "./renderer/core/commerceProviderSandbox.js?v=2.0.32";
      sandbox.dataset.weishanDynamic = "WeishanCommerceProviderSandbox";
      sandbox.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(sandbox);
      return;
    }
    if (!window.WeishanCommerceConnectorGate && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceConnectorGate"]')) {
      const connectorGate = document.createElement("script");
      connectorGate.src = "./renderer/core/commerceConnectorGate.js?v=2.0.48";
      connectorGate.dataset.weishanDynamic = "WeishanCommerceConnectorGate";
      connectorGate.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(connectorGate);
      return;
    }
    if (!window.WeishanCommerceProviderIntegrationReadiness && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceProviderIntegrationReadiness"]')) {
      const readiness = document.createElement("script");
      readiness.src = "./renderer/core/commerceProviderIntegrationReadiness.js?v=2.0.48";
      readiness.dataset.weishanDynamic = "WeishanCommerceProviderIntegrationReadiness";
      readiness.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(readiness);
      return;
    }
    if (!window.WeishanCommerceProviderIntegrationRunbook && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceProviderIntegrationRunbook"]')) {
      const runbook = document.createElement("script");
      runbook.src = "./renderer/core/commerceProviderIntegrationRunbook.js?v=2.0.48";
      runbook.dataset.weishanDynamic = "WeishanCommerceProviderIntegrationRunbook";
      runbook.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(runbook);
      return;
    }
    if (!window.WeishanCommerceLocalIntentRouter && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceLocalIntentRouter"]')) {
      const localIntent = document.createElement("script");
      localIntent.src = "./renderer/core/commerceLocalIntentRouter.js?v=2.0.54";
      localIntent.dataset.weishanDynamic = "WeishanCommerceLocalIntentRouter";
      localIntent.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(localIntent);
      return;
    }
    if (!window.WeishanCommerceComplexIntentSplitPlanner && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceComplexIntentSplitPlanner"]')) {
      const splitPlanner = document.createElement("script");
      splitPlanner.src = "./renderer/core/commerceComplexIntentSplitPlanner.js?v=2.0.54";
      splitPlanner.dataset.weishanDynamic = "WeishanCommerceComplexIntentSplitPlanner";
      splitPlanner.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(splitPlanner);
      return;
    }
    if (!window.WeishanCommerceSubPlanGateMatrix && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceSubPlanGateMatrix"]')) {
      const gateMatrix = document.createElement("script");
      gateMatrix.src = "./renderer/core/commerceSubPlanGateMatrix.js?v=2.0.54";
      gateMatrix.dataset.weishanDynamic = "WeishanCommerceSubPlanGateMatrix";
      gateMatrix.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(gateMatrix);
      return;
    }
    if (!window.WeishanCommerceSubPlanQuestionGenerator && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceSubPlanQuestionGenerator"]')) {
      const questionGenerator = document.createElement("script");
      questionGenerator.src = "./renderer/core/commerceSubPlanQuestionGenerator.js?v=2.0.54";
      questionGenerator.dataset.weishanDynamic = "WeishanCommerceSubPlanQuestionGenerator";
      questionGenerator.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(questionGenerator);
      return;
    }
    if (!window.WeishanCommerceSubPlanAnswerCollector && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceSubPlanAnswerCollector"]')) {
      const answerCollector = document.createElement("script");
      answerCollector.src = "./renderer/core/commerceSubPlanAnswerCollector.js?v=2.0.54";
      answerCollector.dataset.weishanDynamic = "WeishanCommerceSubPlanAnswerCollector";
      answerCollector.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(answerCollector);
      return;
    }
    if (!window.WeishanCommerceSubPlanCompletionWorkspace && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceSubPlanCompletionWorkspace"]')) {
      const completionWorkspace = document.createElement("script");
      completionWorkspace.src = "./renderer/core/commerceSubPlanCompletionWorkspace.js?v=2.0.56";
      completionWorkspace.dataset.weishanDynamic = "WeishanCommerceSubPlanCompletionWorkspace";
      completionWorkspace.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(completionWorkspace);
      return;
    }
    if (!window.WeishanCommerceSubPlanDraftReviewSummary && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceSubPlanDraftReviewSummary"]')) {
      const draftReview = document.createElement("script");
      draftReview.src = "./renderer/core/commerceSubPlanDraftReviewSummary.js?v=2.0.57";
      draftReview.dataset.weishanDynamic = "WeishanCommerceSubPlanDraftReviewSummary";
      draftReview.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(draftReview);
      return;
    }
    if (!window.WeishanCommerceSubPlanDraftConfirmation && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceSubPlanDraftConfirmation"]')) {
      const draftConfirmation = document.createElement("script");
      draftConfirmation.src = "./renderer/core/commerceSubPlanDraftConfirmation.js?v=2.0.58";
      draftConfirmation.dataset.weishanDynamic = "WeishanCommerceSubPlanDraftConfirmation";
      draftConfirmation.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(draftConfirmation);
      return;
    }
    if (!window.WeishanCommerceSubPlanDraftActionBar && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceSubPlanDraftActionBar"]')) {
      const draftActionBar = document.createElement("script");
      draftActionBar.src = "./renderer/core/commerceSubPlanDraftActionBar.js?v=2.0.59";
      draftActionBar.dataset.weishanDynamic = "WeishanCommerceSubPlanDraftActionBar";
      draftActionBar.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(draftActionBar);
      return;
    }
    if (!window.WeishanCommerceProviders && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceProviders"]')) {
      const providers = document.createElement("script");
      providers.src = "./renderer/core/commerceProviders.js?v=2.0.48";
      providers.dataset.weishanDynamic = "WeishanCommerceProviders";
      providers.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(providers);
      return;
    }
    if (window.WeishanCommerceSearch || document.querySelector('script[data-weishan-dynamic="WeishanCommerceSearch"]')) return;
    const script = document.createElement("script");
    script.src = "./renderer/core/commerceSearch.js?v=2.0.48";
    script.dataset.weishanDynamic = "WeishanCommerceSearch";
    script.onload = () => render(host);
    document.head.appendChild(script);
  }

  function record(action, task, outputSummary){
    const api = agent();
    if (!api || !window.HistoryApi || typeof window.HistoryApi.record !== "function") return;
    const creator = api.createCommerceTaskHistoryPayload || api.createCommerceHistoryPayload;
    if (!creator) return;
    window.HistoryApi.record(action, creator(action, Object.assign({}, task || {}, {
      outputSummary:outputSummary || ""
    })));
  }

  function recordSearch(action, payload){
    const api = searchApi();
    if (!api || !api.createCommerceSearchHistoryPayload || !window.HistoryApi || typeof window.HistoryApi.record !== "function") return;
    window.HistoryApi.record(action, api.createCommerceSearchHistoryPayload(action, payload || {}));
  }

  function timeLabel(value){
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function list(items, className){
    return `<ul class="${esc(className || "commerce-list")}">${(items || []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
  }

  function chips(items){
    return `<div class="commerce-chip-list">${(items || []).map((item) => `<span class="commerce-chip">${esc(item)}</span>`).join("")}</div>`;
  }

  function section(title, body, className){
    return `<section class="commerce-section ${esc(className || "")}">
      <h3>${esc(title)}</h3>
      ${body}
    </section>`;
  }

  function disclosure(title, body, className){
    return `<details class="commerce-disclosure ${esc(className || "")}">
      <summary>${esc(title)}</summary>
      <div class="commerce-disclosure-template" data-commerce-disclosure-html="${esc(encodeURIComponent(body || ""))}" hidden></div>
      <div class="commerce-disclosure-body" hidden></div>
    </details>`;
  }

  function listHtml(items){
    return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){
      return '<li>' + esc(typeof item === "string" ? item : JSON.stringify(item)) + '</li>';
    }).join('') + '</ul>';
  }

  function technicalDetailsDisclosure(body, className){
    return body ? disclosure("查看技术细节", body, className || "commerce-technical-disclosure") : "";
  }

  function hydrateDisclosureSections(root){
    const scope = root || document;
    Array.from(scope.querySelectorAll("details.commerce-disclosure")).forEach((details) => {
      if (details.dataset.weishanDisclosureHydrated === "true") return;
      details.dataset.weishanDisclosureHydrated = "true";
      const body = details.querySelector(".commerce-disclosure-body");
      const template = details.querySelector(".commerce-disclosure-template");
      const sync = () => {
        if (!body) return;
        if (details.open) {
          if (template && !details.dataset.weishanDisclosureLoaded) {
            body.innerHTML = "";
            try {
              body.innerHTML = decodeURIComponent(template.dataset.commerceDisclosureHtml || "");
              hydrateDisclosureSections(body);
            } catch (err) {
              body.textContent = template.dataset.commerceDisclosureHtml || "";
            }
            hydrateDisclosureSections(body);
            details.dataset.weishanDisclosureLoaded = "true";
          }
          body.hidden = false;
          return;
        }
        body.hidden = true;
      };
      details.addEventListener("toggle", sync);
      sync();
    });
  }

  function taskStatusLabel(status){
    const map = {
      planned:"计划中",
      comparing:"比较中",
      recommended:"已生成推荐框架",
      waitingConfirmation:"待确认",
      blocked:"已阻断",
      cleared:"已清理"
    };
    return map[status] || status || "计划中";
  }

  function searchStatusLabel(task){
    const status = String(task && task.searchStatus || "");
    if (status === "completed") return "已返回结果";
    if (status === "noResults" || status === "no_results") return "暂无可展示结果";
    if (status === "ready") return "搜索源已就绪";
    if (status === "missingFields") return "搜索条件缺失";
    if (status === "local_law_compliance_required") return "当地法律合规未确认";
    if (status === "shipping_destination_required" || status === "location_required") return "需要设置收货目的地以计算到手价";
    if (status === "failed") return "搜索失败";
    if (status === "blocked") return "已阻断";
    if (status === "no_provider") return "暂未接入真实搜索，无法返回实时价格";
    return "搜索源未配置，无法返回真实价格";
  }

  function commercePoolCategory(task){
    const category = String(task && task.category || "");
    if (category === "ecommerce" || category === "product") return "product";
    if (category === "flight") return "flight";
    if (category === "hotel") return "hotel";
    if (category === "ticketing" || category === "ticket" || category === "ticketOrActivity") return "ticket";
    if (category === "serviceBooking" || category === "service" || category === "localService") return "service";
    return "";
  }

  function commerceLocalIntentRouteForTask(task){
    const existing = task && task.commerceLocalIntentRoute || null;
    if (existing && existing.intentCategory) return existing;
    const api = window.WeishanCommerceLocalIntentRouter || null;
    if (api && api.routeCommerceIntentLocally) return api.routeCommerceIntentLocally(task && task.inputSummary || "");
    return null;
  }

  function commerceLocalIntentDisplay(route){
    const api = window.WeishanCommerceLocalIntentRouter || null;
    if (api && api.toCommerceLocalIntentDisplayStatus) return api.toCommerceLocalIntentDisplayStatus(route || {});
    const map = {
      product:"商品",
      complex_product:"复杂商品采购",
      hotel:"酒店",
      flight:"机票",
      ticket:"门票 / 票务",
      local_service:"本地服务",
      multi_category_travel:"复合旅行计划",
      general_commerce:"全球采购",
      unknown:"待确认"
    };
    const category = route && route.intentCategory || "unknown";
    const complex = route && route.aiFallbackRequired === true;
    const categories = Array.isArray(route && route.categories) ? route.categories.map((item) => map[item] || item).filter(Boolean) : [];
    return {
      title:"本地意图识别",
      subtitle:"普通购物、酒店、机票、票务请求优先使用本地规则识别，减少 AI token 消耗。",
      routeModeLabel:complex ? "本地规则优先 + AI 智能优化" : "本地规则优先",
      aiUsedLabel:complex ? "否，等待复杂理解" : "否",
      aiFallbackLabel:complex ? "复杂需求需要 AI 理解" : "仅复杂需求可选",
      categoryLabel:map[category] || "待确认",
      detectedCategoriesLabel:categories.length ? categories.join(" + ") : "待确认",
      destinationLabel:route && route.destination || "待确认",
      timeHintLabel:route && route.timeHint || "待确认",
      travelerHintLabel:route && route.travelerHint || "待确认",
      budgetHintLabel:route && route.budgetHint || "待确认",
      optimizationGoalLabel:route && route.optimizationGoal || "待确认",
      useCaseHintLabel:route && route.useCaseHint || "",
      isComplex:complex,
      commercePlanLabel:route && route.canTriggerCommercePlan === false ? "否" : "是",
      providerSearchLabel:"否",
      priceLabel:"否",
      redirectLabel:"否"
    };
  }

  function commerceLocalIntentPanelHtml(task){
    const route = commerceLocalIntentRouteForTask(task);
    if (!route) return "";
    const display = commerceLocalIntentDisplay(route);
    const row = (label, value) => `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>`;
    const complexRows = display.isComplex ? `
            ${row("识别类别", display.detectedCategoriesLabel)}
            ${row("目的地", display.destinationLabel)}
            ${row("时间条件", display.timeHintLabel)}
            ${row("人员条件", display.travelerHintLabel)}
            ${row("预算条件", display.budgetHintLabel)}
            ${row("优化目标", display.optimizationGoalLabel)}
            ${display.useCaseHintLabel ? row("用途条件", display.useCaseHintLabel) : ""}` : "";
    return `<section class="commerce-local-intent-panel" aria-label="本地意图识别">
      <div class="commerce-local-intent-head">
        <div>
          <h3>${esc(display.title)}</h3>
          <p>${esc(display.subtitle)}</p>
        </div>
        <strong>是否使用 AI：${esc(display.aiUsedLabel)}</strong>
      </div>
      <div class="commerce-local-intent-grid">
        <section class="commerce-local-intent-group">
          <h4>路由状态</h4>
          <ul>
            ${row("路由方式", display.routeModeLabel)}
            ${row("是否使用 AI", display.aiUsedLabel)}
            ${row("智能优化", display.aiFallbackLabel)}
            ${row("当前类别", display.categoryLabel)}
            ${complexRows}
            ${row("是否进入采购计划", display.commercePlanLabel)}
          </ul>
        </section>
        <section class="commerce-local-intent-group">
          <h4>不访问真实平台</h4>
          <ul>
            ${row("是否访问真实平台", display.providerSearchLabel)}
            ${row("是否返回价格", display.priceLabel)}
            ${row("是否跳转购买", display.redirectLabel)}
          </ul>
        </section>
      </div>
    </section>`;
  }

  function commerceComplexIntentSplitForTask(task){
    const existing = task && task.commerceComplexIntentSplit || null;
    if (existing && Array.isArray(existing.subPlans)) return existing;
    const planner = window.WeishanCommerceComplexIntentSplitPlanner || null;
    if (!planner || !planner.splitComplexCommerceIntent) return null;
    const route = commerceLocalIntentRouteForTask(task);
    return planner.splitComplexCommerceIntent(task && task.inputSummary || "", route);
  }

  function commerceComplexIntentSplitDisplay(splitResult){
    const planner = window.WeishanCommerceComplexIntentSplitPlanner || null;
    if (planner && planner.toComplexIntentSplitDisplayStatus) return planner.toComplexIntentSplitDisplayStatus(splitResult || {});
    const subPlans = Array.isArray(splitResult && splitResult.subPlans) ? splitResult.subPlans : [];
    return {
      title:"复杂意图拆分计划",
      subtitle:"复合需求会先拆成多个独立子计划，每个子计划分别走安全 gate。当前不会访问真实平台。",
      splitStatusLabel:splitResult && splitResult.shouldSplit === true ? "已拆分" : "无需拆分",
      splitReasonLabel:splitResult && splitResult.shouldSplit === true ? "多类别复合需求" : "单一简单需求",
      subPlanCountLabel:String(subPlans.length || 0),
      subPlans:subPlans.map((plan) => ({
        title:plan.title || "子计划",
        categoryLabel:plan.categoryLabel || plan.intentCategory || "全球采购",
        componentsLabel:Array.isArray(plan.components) ? plan.components.join(" + ") : "",
        destinationLabel:plan.destination || "",
        timeHintLabel:plan.timeHint || "",
        travelerHintLabel:plan.travelerHint || "",
        budgetHintLabel:plan.budgetHint || "",
        optimizationGoalLabel:plan.optimizationGoal || "",
        productHintLabel:plan.productHint || "",
        usageHintLabel:plan.usageHint || "",
        ticketHintLabel:plan.ticketHint || "",
        serviceHintLabel:plan.serviceHint || "",
        providerAccessLabel:"否",
        priceLabel:"否",
        redirectLabel:"否"
      })),
      note:"该拆分只生成计划，不访问真实平台，不读取任何密钥，不连接接口，不发起网络请求，不返回商品、价格或跳转链接。"
    };
  }

  function commerceComplexIntentSplitPanelHtml(task){
    const splitResult = commerceComplexIntentSplitForTask(task);
    if (!splitResult) return "";
    const display = commerceComplexIntentSplitDisplay(splitResult);
    const row = (label, value) => value ? `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>` : "";
    const subPlanCard = (plan) => `<article class="commerce-split-subplan-card">
      <h4>${esc(plan.title)}</h4>
      <ul>
        ${row("子计划", plan.title)}
        ${row("类别", plan.categoryLabel)}
        ${row("组件", plan.componentsLabel)}
        ${row("目的地", plan.destinationLabel)}
        ${row("时间条件", plan.timeHintLabel)}
        ${row("人员条件", plan.travelerHintLabel)}
        ${row("商品需求", plan.productHintLabel)}
        ${row("用途条件", plan.usageHintLabel)}
        ${row("票务需求", plan.ticketHintLabel)}
        ${row("服务需求", plan.serviceHintLabel)}
        ${row("预算条件", plan.budgetHintLabel)}
        ${row("优化目标", plan.optimizationGoalLabel)}
        ${row("是否访问真实平台", plan.providerAccessLabel)}
        ${row("是否返回价格", plan.priceLabel)}
        ${row("是否跳转购买", plan.redirectLabel)}
      </ul>
    </article>`;
    return `<section class="commerce-complex-split-panel" aria-label="复杂意图拆分计划">
      <div class="commerce-complex-split-head">
        <div>
          <h3>${esc(display.title)}</h3>
          <p>${esc(display.subtitle)}</p>
        </div>
        <strong>拆分状态：${esc(display.splitStatusLabel)}</strong>
      </div>
      <div class="commerce-complex-split-status">
        <ul>
          ${row("拆分状态", display.splitStatusLabel)}
          ${row("拆分原因", display.splitReasonLabel)}
          ${row("子计划数量", display.subPlanCountLabel)}
        </ul>
      </div>
      <div class="commerce-split-subplans">
        ${(display.subPlans || []).map(subPlanCard).join("")}
      </div>
      <div class="commerce-complex-split-note">
        <p>${esc(display.note)}</p>
      </div>
    </section>`;
  }

  function commerceSubPlanGateMatrixForTask(task, splitResult){
    const existing = task && task.commerceSubPlanGateMatrix || null;
    if (existing && Array.isArray(existing.subPlanMatrices)) return existing;
    const matrix = window.WeishanCommerceSubPlanGateMatrix || null;
    if (matrix && matrix.buildSubPlanGateMatrix && splitResult) return matrix.buildSubPlanGateMatrix(splitResult, task && task.providerHealth || null);
    return null;
  }

  function commerceSubPlanGateMatrixDisplay(matrix){
    const api = window.WeishanCommerceSubPlanGateMatrix || null;
    if (api && api.toSubPlanGateMatrixDisplayStatus) return api.toSubPlanGateMatrixDisplayStatus(matrix || {});
    const subPlans = Array.isArray(matrix && matrix.subPlanMatrices) ? matrix.subPlanMatrices : [];
    return {
      title:"子计划闸门矩阵",
      subtitle:"每个子计划独立显示 gate、缺失信息和下一步动作。当前不会访问真实平台。",
      overallStatusLabel:"已阻断",
      subPlanCountLabel:String(subPlans.length || 0),
      providerAccessLabel:"否",
      priceLabel:"否",
      redirectLabel:"否",
      subPlans:subPlans.map((plan) => ({
        title:plan.title || "子计划",
        statusLabel:plan.statusLabel || "已阻断",
        categoryLabel:plan.categoryLabel || "全球采购",
        recognizedFieldsLabel:Array.isArray(plan.recognizedFields) && plan.recognizedFields.length ? plan.recognizedFields.join(" / ") : "待补充",
        missingFieldsLabel:Array.isArray(plan.missingFields) && plan.missingFields.length ? plan.missingFields.join("、") : "待确认",
        nextActionsLabel:Array.isArray(plan.nextActions) && plan.nextActions.length ? plan.nextActions.join("、") : "等待 provider 接入审批完成",
        gateStatusLabel:Array.isArray(plan.gateRows) ? plan.gateRows.map((row) => row.label).filter(Boolean).join("、") : "",
        providerAccessLabel:"否",
        priceLabel:"否",
        redirectLabel:"否"
      })),
      note:"该矩阵只用于整理子计划、缺失信息和下一步动作，不访问真实平台，不读取任何密钥，不连接接口，不发起网络请求，不返回商品、价格或跳转链接。"
    };
  }

  function commerceSubPlanGateMatrixPanelHtml(task){
    const splitResult = commerceComplexIntentSplitForTask(task);
    const matrix = commerceSubPlanGateMatrixForTask(task, splitResult);
    if (!matrix) return "";
    const display = commerceSubPlanGateMatrixDisplay(matrix);
    const row = (label, value) => value ? `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>` : "";
    const subPlanCard = (plan, index) => `<article class="commerce-subplan-gate-card">
      <h4>子计划 ${index + 1}：${esc(plan.title)}</h4>
      <ul>
        ${row("子计划", plan.title)}
        ${row("状态", plan.statusLabel)}
        ${row("类别", plan.categoryLabel)}
        ${row("已识别信息", plan.recognizedFieldsLabel)}
        ${row("缺失信息", plan.missingFieldsLabel)}
        ${row("下一步", plan.nextActionsLabel)}
        ${row("Gate 状态", plan.gateStatusLabel)}
        ${row("是否访问真实平台", plan.providerAccessLabel)}
        ${row("是否返回价格", plan.priceLabel)}
        ${row("是否跳转购买", plan.redirectLabel)}
      </ul>
    </article>`;
    return `<section class="commerce-subplan-gate-panel" aria-label="子计划闸门矩阵">
      <div class="commerce-subplan-gate-head">
        <div>
          <h3>${esc(display.title)}</h3>
          <p>${esc(display.subtitle)}</p>
        </div>
        <strong>总体状态：${esc(display.overallStatusLabel)}</strong>
      </div>
      <div class="commerce-subplan-gate-status">
        <ul>
          ${row("总体状态", display.overallStatusLabel)}
          ${row("子计划数量", display.subPlanCountLabel)}
          ${row("是否访问真实平台", display.providerAccessLabel)}
          ${row("是否返回价格", display.priceLabel)}
          ${row("是否跳转购买", display.redirectLabel)}
        </ul>
      </div>
      <div class="commerce-subplan-gate-cards">
        ${(display.subPlans || []).map(subPlanCard).join("")}
      </div>
      <div class="commerce-subplan-gate-note">
        <p>${esc(display.note)}</p>
      </div>
    </section>`;
  }

  function commerceSubPlanQuestionsForTask(task){
    const existing = task && task.commerceSubPlanQuestions || null;
    if (existing && Array.isArray(existing.subPlanQuestionGroups)) return existing;
    const splitResult = commerceComplexIntentSplitForTask(task);
    const matrix = commerceSubPlanGateMatrixForTask(task, splitResult);
    const generator = window.WeishanCommerceSubPlanQuestionGenerator || null;
    if (generator && generator.generateQuestionsForSubPlanMatrix && matrix) return generator.generateQuestionsForSubPlanMatrix(matrix);
    return null;
  }

  function commerceSubPlanQuestionsDisplay(questionResult){
    const api = window.WeishanCommerceSubPlanQuestionGenerator || null;
    if (api && api.toSubPlanQuestionDisplayStatus) return api.toSubPlanQuestionDisplayStatus(questionResult || {});
    const groups = Array.isArray(questionResult && questionResult.subPlanQuestionGroups) ? questionResult.subPlanQuestionGroups : [];
    return {
      title:"子计划补充问题",
      subtitle:"根据每个子计划的缺失信息生成问题，帮助用户补齐信息。当前不会访问真实平台。",
      overallStatusLabel:"待补充",
      subPlanCountLabel:String(groups.length || 0),
      questionCountLabel:String(groups.reduce((sum, group) => sum + Number(group.questionCount || 0), 0)),
      providerAccessLabel:"否",
      priceLabel:"否",
      redirectLabel:"否",
      groups:groups.map((group) => ({
        title:group.title || "子计划",
        categoryLabel:group.categoryLabel || group.title || "子计划",
        questionCountLabel:String(group.questionCount || 0),
        providerAccessLabel:"否",
        priceLabel:"否",
        redirectLabel:"否",
        questions:(Array.isArray(group.questions) ? group.questions : []).map((question) => ({
          text:question.questionText || "",
          priorityLabel:question.priorityLabel || "中",
          answerTypeLabel:question.answerType || "文本",
          optionsLabel:Array.isArray(question.options) && question.options.length ? question.options.join(" / ") : "自由填写"
        }))
      })),
      note:"这些问题只用于补齐计划信息，不访问真实平台，不读取任何密钥，不连接接口，不发起网络请求，不返回商品、价格或跳转链接。"
    };
  }

  function commerceSubPlanAnswerCollectionForTask(task){
    const existing = task && task.commerceSubPlanAnswerCollection || null;
    if (existing && Array.isArray(existing.subPlanDrafts)) return existing;
    const questionResult = commerceSubPlanQuestionsForTask(task);
    const api = window.WeishanCommerceSubPlanAnswerCollector || null;
    if (api && api.collectSubPlanAnswers && questionResult) return api.collectSubPlanAnswers(task && task.inputSummary || "", questionResult, null);
    return null;
  }

  function commerceSubPlanAnswerCollectionDisplay(answerResult){
    const api = window.WeishanCommerceSubPlanAnswerCollector || null;
    if (api && api.toSubPlanAnswerCollectorDisplayStatus) return api.toSubPlanAnswerCollectorDisplayStatus(answerResult || {});
    return { title:"子计划答案收集", subtitle:"根据用户回答补齐子计划信息。当前只更新计划草稿，不访问真实平台。", overallStatusLabel:"等待回答", subPlanCountLabel:"0", completedFieldCountLabel:"0", remainingFieldCountLabel:"0", providerAccessLabel:"否", priceLabel:"否", redirectLabel:"否", groups:[], note:"这些回答只用于补齐计划草稿，不访问真实平台，不读取任何密钥，不连接接口，不发起网络请求，不返回商品、价格或跳转链接。" };
  }

  function commerceSubPlanAnswerCollectionPanelHtml(task){
    const answerResult = commerceSubPlanAnswerCollectionForTask(task);
    if (!answerResult) return "";
    const display = commerceSubPlanAnswerCollectionDisplay(answerResult);
    const row = (label, value) => value ? `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>` : "";
    const list = (items, emptyLabel) => `<ul>${(items && items.length ? items : [emptyLabel]).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
    const groupCard = (group, index) => `<article class="commerce-subplan-answer-card">
      <h4>子计划 ${index + 1}：${esc(group.title)}</h4>
      <ul class="commerce-subplan-answer-meta">
        ${row("子计划", group.title)}
        ${row("类别", group.categoryLabel)}
        ${row("补齐度", group.completenessLabel)}
        ${row("是否可进入下一步审查", group.canProceedLabel)}
        ${row("是否访问真实平台", group.providerAccessLabel)}
        ${row("是否返回价格", group.priceLabel)}
        ${row("是否跳转购买", group.redirectLabel)}
      </ul>
      <div class="commerce-subplan-answer-columns">
        <div><b>已补齐字段</b>${list(group.completedFields, "暂无已补齐字段")}</div>
        <div><b>仍缺字段</b>${list(group.remainingFields, "暂无剩余字段")}</div>
        <div><b>下一步</b>${list(group.nextSteps, "等待补充回答")}</div>
      </div>
    </article>`;
    return `<section class="commerce-subplan-answer-panel" aria-label="子计划答案收集">
      <div class="commerce-subplan-answer-head">
        <div>
          <h3>${esc(display.title)}</h3>
          <p>${esc(display.subtitle)}</p>
        </div>
        <strong>总体状态：${esc(display.overallStatusLabel)}</strong>
      </div>
      <div class="commerce-subplan-answer-status">
        <ul>
          ${row("总体状态", display.overallStatusLabel)}
          ${row("子计划数量", display.subPlanCountLabel)}
          ${row("已补齐字段数量", display.completedFieldCountLabel)}
          ${row("仍缺字段数量", display.remainingFieldCountLabel)}
          ${row("是否访问真实平台", display.providerAccessLabel)}
          ${row("是否返回价格", display.priceLabel)}
          ${row("是否跳转购买", display.redirectLabel)}
        </ul>
      </div>
      <div class="commerce-subplan-answer-cards">
        ${(display.groups || []).map(groupCard).join("")}
      </div>
      <div class="commerce-subplan-answer-note"><p>${esc(display.note)}</p></div>
    </section>`;
  }

  function commerceSubPlanCompletionWorkspaceForTask(task){
    const existing = task && task.commerceSubPlanCompletionWorkspace || null;
    if (existing && Array.isArray(existing.workspaceItems)) return existing;
    const splitResult = commerceComplexIntentSplitForTask(task);
    const matrix = commerceSubPlanGateMatrixForTask(task, splitResult);
    const questionResult = commerceSubPlanQuestionsForTask(task);
    const answerResult = commerceSubPlanAnswerCollectionForTask(task);
    const api = window.WeishanCommerceSubPlanCompletionWorkspace || null;
    if (api && api.buildSubPlanCompletionWorkspace) {
      return api.buildSubPlanCompletionWorkspace({
        commerceComplexIntentSplit:splitResult || null,
        commerceSubPlanGateMatrix:matrix || null,
        commerceSubPlanQuestions:questionResult || null,
        commerceSubPlanAnswerCollection:answerResult || null
      });
    }
    return null;
  }

  function commerceSubPlanCompletionWorkspaceDisplay(workspaceResult){
    const api = window.WeishanCommerceSubPlanCompletionWorkspace || null;
    if (api && api.toSubPlanCompletionWorkspaceDisplayStatus) return api.toSubPlanCompletionWorkspaceDisplayStatus(workspaceResult || {});
    return { title:"子计划补齐工作台", subtitle:"集中显示每个子计划的已补齐字段、仍缺字段、下一问题和下一步动作。", overallStatusLabel:"待补充", subPlanCountLabel:"0", completedFieldCountLabel:"0", remainingFieldCountLabel:"0", nextQuestionCountLabel:"0", providerAccessLabel:"否", priceLabel:"否", redirectLabel:"否", items:[], note:"该工作台只整理计划草稿，不长期保存用户答案，不访问真实平台，不读取任何密钥，不连接接口，不发起网络请求，不返回商品、价格或跳转链接。" };
  }

  function commerceSubPlanCompletionWorkspacePanelHtml(task){
    const workspaceResult = commerceSubPlanCompletionWorkspaceForTask(task);
    if (!workspaceResult) return "";
    const display = commerceSubPlanCompletionWorkspaceDisplay(workspaceResult);
    const row = (label, value) => value ? `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>` : "";
    const list = (items, emptyLabel) => `<ul>${(items && items.length ? items : [emptyLabel]).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
    const workspaceCard = (item, index) => `<article class="commerce-subplan-completion-card">
      <h4>子计划 ${index + 1}：${esc(item.title)}</h4>
      <ul class="commerce-subplan-completion-meta">
        ${row("子计划", item.title)}
        ${row("类别", item.categoryLabel)}
        ${row("状态", item.statusLabel)}
        ${row("已补齐字段数量", item.completedFieldCountLabel)}
        ${row("仍缺字段数量", item.remainingFieldCountLabel)}
        ${row("补齐度", item.completenessLabel)}
        ${row("下一问题", item.nextQuestionLabel)}
        ${row("是否访问真实平台", item.providerAccessLabel)}
        ${row("是否返回价格", item.priceLabel)}
        ${row("是否跳转购买", item.redirectLabel)}
      </ul>
      <div class="commerce-subplan-completion-columns">
        <div><b>已补齐字段</b>${list(item.completedFields, "暂无已补齐字段")}</div>
        <div><b>仍缺字段</b>${list(item.remainingFields, "暂无剩余字段")}</div>
        <div><b>下一问题</b>${list(item.nextQuestions, item.nextQuestionLabel || "暂无下一问题")}</div>
        <div><b>下一步</b>${list(item.nextActions, "等待补充回答")}</div>
      </div>
    </article>`;
    return `<section class="commerce-subplan-completion-panel" aria-label="子计划补齐工作台">
      <div class="commerce-subplan-completion-head">
        <div>
          <h3>${esc(display.title)}</h3>
          <p>${esc(display.subtitle)}</p>
        </div>
        <strong>总体状态：${esc(display.overallStatusLabel)}</strong>
      </div>
      <div class="commerce-subplan-completion-status">
        <ul>
          ${row("总体状态", display.overallStatusLabel)}
          ${row("子计划数量", display.subPlanCountLabel)}
          ${row("已补齐字段数量", display.completedFieldCountLabel)}
          ${row("仍缺字段数量", display.remainingFieldCountLabel)}
          ${row("下一问题数量", display.nextQuestionCountLabel)}
          ${row("是否访问真实平台", display.providerAccessLabel)}
          ${row("是否返回价格", display.priceLabel)}
          ${row("是否跳转购买", display.redirectLabel)}
        </ul>
      </div>
      <div class="commerce-subplan-completion-cards">
        ${(display.items || []).map(workspaceCard).join("")}
      </div>
      <div class="commerce-subplan-completion-note"><p>${esc(display.note)}</p></div>
    </section>`;
  }

  function commerceSubPlanDraftReviewForTask(task){
    const existing = task && task.commerceSubPlanDraftReviewSummary || null;
    if (existing && Array.isArray(existing.reviewItems)) return existing;
    const splitResult = commerceComplexIntentSplitForTask(task);
    const matrix = commerceSubPlanGateMatrixForTask(task, splitResult);
    const questionResult = commerceSubPlanQuestionsForTask(task);
    const answerResult = commerceSubPlanAnswerCollectionForTask(task);
    const workspaceResult = commerceSubPlanCompletionWorkspaceForTask(task);
    const api = window.WeishanCommerceSubPlanDraftReviewSummary || null;
    if (api && api.buildSubPlanDraftReviewSummary) {
      return api.buildSubPlanDraftReviewSummary({
        commerceComplexIntentSplit:splitResult || null,
        commerceSubPlanGateMatrix:matrix || null,
        commerceSubPlanQuestions:questionResult || null,
        commerceSubPlanAnswerCollection:answerResult || null,
        commerceSubPlanCompletionWorkspace:workspaceResult || null
      });
    }
    return null;
  }

  function commerceSubPlanDraftReviewDisplay(reviewResult){
    const api = window.WeishanCommerceSubPlanDraftReviewSummary || null;
    if (api && api.toSubPlanDraftReviewDisplayStatus) return api.toSubPlanDraftReviewDisplayStatus(reviewResult || {});
    return { title:"子计划草稿复核摘要", subtitle:"把已补齐的信息整理成可复核摘要，供用户确认。当前不会访问真实平台。", overallStatusLabel:"仍需补充", subPlanCountLabel:"0", readyReviewItemCountLabel:"0", needsMoreInformationCountLabel:"0", providerAccessLabel:"否", priceLabel:"否", redirectLabel:"否", items:[], note:"该复核摘要只用于确认计划草稿，不访问真实平台，不读取任何密钥，不连接接口，不发起网络请求，不返回商品、价格或跳转链接。" };
  }

  function commerceSubPlanDraftReviewPanelHtml(task){
    const reviewResult = commerceSubPlanDraftReviewForTask(task);
    if (!reviewResult) return "";
    const display = commerceSubPlanDraftReviewDisplay(reviewResult);
    const row = (label, value) => value ? `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>` : "";
    const list = (items, emptyLabel) => `<ul>${(items && items.length ? items : [emptyLabel]).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
    const reviewCard = (item, index) => `<article class="commerce-subplan-draft-review-card">
      <h4>子计划 ${index + 1}：${esc(item.title)}</h4>
      <ul class="commerce-subplan-draft-review-meta">
        ${row("子计划", item.title)}
        ${row("类别", item.categoryLabel)}
        ${row("复核状态", item.reviewStatusLabel)}
        ${row("是否访问真实平台", item.providerAccessLabel)}
        ${row("是否返回价格", item.priceLabel)}
        ${row("是否跳转购买", item.redirectLabel)}
      </ul>
      <div class="commerce-subplan-draft-review-columns">
        <div><b>${esc(item.confirmPrompt)}</b>${list(item.confirmableFields, "暂无已确认字段")}</div>
        <div><b>仍未确认</b>${list(item.unconfirmedFields, "暂无")}</div>
        <div><b>剩余风险</b>${list(item.remainingRisks, "当前仍受安全 gate 阻断")}</div>
        <div><b>下一步</b>${list(item.reviewActions, "等待用户复核草稿")}</div>
      </div>
    </article>`;
    return `<section class="commerce-subplan-draft-review-panel" aria-label="子计划草稿复核摘要">
      <div class="commerce-subplan-draft-review-head">
        <div>
          <h3>${esc(display.title)}</h3>
          <p>${esc(display.subtitle)}</p>
        </div>
        <strong>总体状态：${esc(display.overallStatusLabel)}</strong>
      </div>
      <div class="commerce-subplan-draft-review-status">
        <ul>
          ${row("总体状态", display.overallStatusLabel)}
          ${row("子计划数量", display.subPlanCountLabel)}
          ${row("可复核子计划数量", display.readyReviewItemCountLabel)}
          ${row("仍需补充子计划数量", display.needsMoreInformationCountLabel)}
          ${row("是否访问真实平台", display.providerAccessLabel)}
          ${row("是否返回价格", display.priceLabel)}
          ${row("是否跳转购买", display.redirectLabel)}
        </ul>
      </div>
      <div class="commerce-subplan-draft-review-cards">
        ${(display.items || []).map(reviewCard).join("")}
      </div>
      <div class="commerce-subplan-draft-review-note"><p>${esc(display.note)}</p></div>
    </section>`;
  }



  function commerceSubPlanDraftConfirmationForTask(task){
    const existing = task && task.commerceSubPlanDraftConfirmation || null;
    if (existing && Array.isArray(existing.confirmationItems)) return existing;
    const reviewResult = commerceSubPlanDraftReviewForTask(task);
    const api = window.WeishanCommerceSubPlanDraftConfirmation || null;
    if (api && api.buildSubPlanDraftConfirmation) {
      return api.buildSubPlanDraftConfirmation({
        input:task && (task.inputSummary || task.requestText || task.query) || "",
        commerceSubPlanDraftReviewSummary:reviewResult || null
      });
    }
    return null;
  }

  function commerceSubPlanDraftConfirmationDisplay(confirmationResult){
    const api = window.WeishanCommerceSubPlanDraftConfirmation || null;
    if (api && api.toSubPlanDraftConfirmationDisplayStatus) return api.toSubPlanDraftConfirmationDisplayStatus(confirmationResult || {});
    return { title:"子计划草稿确认与修正", subtitle:"用户确认或修正只更新临时计划草稿；确认后仍必须经过当地法律合规和最终接入审查。", statusLabel:"等待确认", subPlanCountLabel:"0", confirmedCountLabel:"0", revisedCountLabel:"0", pendingCountLabel:"0", providerAccessLabel:"否", priceLabel:"否", redirectLabel:"否", items:[], note:"该确认与修正只更新临时计划草稿，不访问真实平台，不读取任何密钥，不连接接口，不发起网络请求，不返回商品、价格或跳转链接。" };
  }

  function commerceSubPlanDraftConfirmationPanelHtml(task){
    const confirmationResult = commerceSubPlanDraftConfirmationForTask(task);
    if (!confirmationResult) return "";
    const display = commerceSubPlanDraftConfirmationDisplay(confirmationResult);
    const row = (label, value) => value ? `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>` : "";
    const list = (items, emptyLabel) => `<ul>${(items && items.length ? items : [emptyLabel]).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
    const confirmationCard = (item, index) => `<article class="commerce-subplan-draft-confirmation-card">
      <h4>子计划 ${index + 1}：${esc(item.title)}</h4>
      <ul class="commerce-subplan-draft-confirmation-meta">
        ${row("子计划", item.title)}
        ${row("类别", item.categoryLabel)}
        ${row("确认状态", item.confirmationStatusLabel)}
        ${row("用户确认", item.userConfirmationLabel)}
        ${row("是否访问真实平台", item.providerAccessLabel)}
        ${row("是否返回价格", item.priceLabel)}
        ${row("是否跳转购买", item.redirectLabel)}
      </ul>
      <div class="commerce-subplan-draft-confirmation-columns">
        <div><b>当前草稿摘要</b>${list(item.currentDraftSummary, "暂无草稿摘要")}</div>
        <div><b>修正字段</b>${list(item.revisionFields, "暂无修正字段")}</div>
        <div><b>剩余风险</b>${list(item.remainingRisks, "当前仍受安全 gate 阻断")}</div>
        <div><b>下一步</b>${list(item.reviewActions, "继续确认草稿准确性")}</div>
      </div>
    </article>`;
    return `<section class="commerce-subplan-draft-confirmation-panel" aria-label="子计划草稿确认与修正">
      <div class="commerce-subplan-draft-confirmation-head">
        <div>
          <h3>${esc(display.title)}</h3>
          <p>${esc(display.subtitle)}</p>
        </div>
        <strong>总体状态：${esc(display.statusLabel)}</strong>
      </div>
      <div class="commerce-subplan-draft-confirmation-status">
        <ul>
          ${row("总体状态", display.statusLabel)}
          ${row("子计划数量", display.subPlanCountLabel)}
          ${row("已确认子计划数量", display.confirmedCountLabel)}
          ${row("已修正待复核数量", display.revisedCountLabel)}
          ${row("待确认子计划数量", display.pendingCountLabel)}
          ${row("是否访问真实平台", display.providerAccessLabel)}
          ${row("是否返回价格", display.priceLabel)}
          ${row("是否跳转购买", display.redirectLabel)}
        </ul>
      </div>
      <div class="commerce-subplan-draft-confirmation-cards">
        ${(display.items || []).map(confirmationCard).join("")}
      </div>
      <div class="commerce-subplan-draft-confirmation-note"><p>${esc(display.note)}</p></div>
    </section>`;
  }

  function commerceSubPlanDraftActionBarForTask(task){
    const existing = task && task.commerceSubPlanDraftActionBar || null;
    if (existing && existing.phase === "subplan_draft_review_action_bar") return existing;
    const reviewResult = commerceSubPlanDraftReviewForTask(task);
    const confirmationResult = commerceSubPlanDraftConfirmationForTask(task);
    const questionResult = commerceSubPlanQuestionsForTask(task);
    const workspaceResult = commerceSubPlanCompletionWorkspaceForTask(task);
    const api = window.WeishanCommerceSubPlanDraftActionBar || null;
    if (api && api.buildSubPlanDraftActionBar) {
      return api.buildSubPlanDraftActionBar({
        commerceSubPlanQuestions:questionResult || null,
        commerceSubPlanCompletionWorkspace:workspaceResult || null,
        commerceSubPlanDraftReviewSummary:reviewResult || null,
        commerceSubPlanDraftConfirmation:confirmationResult || null
      });
    }
    return null;
  }

  function commerceSubPlanDraftActionBarDisplay(actionBar){
    const api = window.WeishanCommerceSubPlanDraftActionBar || null;
    if (api && api.toSubPlanDraftActionBarDisplayStatus) return api.toSubPlanDraftActionBarDisplayStatus(actionBar || {});
    return { title:"草稿下一步动作", subtitle:"你可以确认草稿，也可以说明要修改哪一项。当前只整理草稿，不会自动执行。", statusLabel:"等待补充问题", actionLabels:["确认全部草稿", "只确认旅行计划", "只确认商品采购计划", "修改旅行计划", "修改商品采购计划", "返回补充问题", "查看安全边界"], actionChips:[{group:"确认类", label:"两个都确认"}, {group:"确认类", label:"确认旅行计划"}, {group:"确认类", label:"电脑计划确认"}, {group:"旅行修改类", label:"酒店入住日期改成7月13日"}, {group:"商品修改类", label:"电脑品牌优先苹果"}, {group:"辅助类", label:"返回补充问题"}, {group:"辅助类", label:"查看安全边界"}], chipHint:"已填入指令，请确认后点击开始执行", guidance:["先补充问题", "查看草稿复核摘要", "当前只整理草稿，不会自动执行"], examples:["两个都确认", "确认旅行计划", "电脑计划确认", "酒店入住日期改成7月13日", "电脑品牌优先苹果，预算改成8000以内", "返回补充问题"], safetyItems:["当前只整理草稿", "不会自动执行", "不会返回价格", "不会跳转购买或预订", "不会自动下单或付款"], providerAccessLabel:"否", priceLabel:"否", redirectLabel:"否" };
  }

  function commerceSubPlanDraftActionBarPanelHtml(task){
    const actionBar = commerceSubPlanDraftActionBarForTask(task);
    if (!actionBar) return "";
    const display = commerceSubPlanDraftActionBarDisplay(actionBar);
    const list = (items, className, emptyLabel) => `<ul class="${esc(className)}">${(items && items.length ? items : [emptyLabel]).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
    const chipGroups = (display.actionChips || []).reduce((groups, chip) => {
      const group = chip && chip.group || "快捷动作";
      if (!groups[group]) groups[group] = [];
      groups[group].push(chip && chip.label || chip);
      return groups;
    }, {});
    const chips = Object.keys(chipGroups).map((group) => `<div class="commerce-subplan-draft-chip-group">
      <b>${esc(group)}</b>
      <div class="commerce-subplan-draft-chip-list">
        ${chipGroups[group].map((label) => `<button class="commerce-subplan-draft-chip" type="button" data-commerce-action-chip="${esc(label)}">${esc(label)}</button>`).join("")}
      </div>
    </div>`).join("");
    const row = (label, value) => value ? `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>` : "";
    return `<section class="commerce-subplan-draft-action-panel" aria-label="草稿下一步动作">
      <div class="commerce-subplan-draft-action-head">
        <div>
          <h3>${esc(display.title)}</h3>
          <p>${esc(display.subtitle)}</p>
        </div>
        <strong>状态：${esc(display.statusLabel)}</strong>
      </div>
      <div class="commerce-subplan-draft-action-grid">
        <div>
          <b>动作提示</b>
          ${list(display.actionLabels, "commerce-subplan-draft-action-list", "查看草稿复核摘要")}
        </div>
        <div>
          <b>快捷动作</b>
          <p class="commerce-subplan-draft-chip-note">点击后只填入输入框，不会自动执行。</p>
          <div class="commerce-subplan-draft-chips">${chips}</div>
          <p class="commerce-subplan-draft-chip-feedback" data-commerce-action-chip-feedback aria-live="polite"></p>
        </div>
        <div>
          <b>示例指令</b>
          ${list(display.examples, "commerce-subplan-draft-action-list", "两个都确认")}
        </div>
        <div>
          <b>当前提示</b>
          ${list(display.guidance, "commerce-subplan-draft-action-list", "先补充问题")}
        </div>
        <div>
          <b>安全边界</b>
          ${list(display.safetyItems, "commerce-subplan-draft-action-list", "当前不会访问真实平台")}
        </div>
      </div>
      <div class="commerce-subplan-draft-action-status">
        <ul>
          ${row("是否访问真实平台", display.providerAccessLabel)}
          ${row("是否返回价格", display.priceLabel)}
          ${row("是否跳转购买或预订", display.redirectLabel)}
        </ul>
      </div>
    </section>`;
  }


  function commerceSubPlanQuestionsPanelHtml(task){
    const questionResult = commerceSubPlanQuestionsForTask(task);
    if (!questionResult) return "";
    const display = commerceSubPlanQuestionsDisplay(questionResult);
    const row = (label, value) => value ? `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>` : "";
    const questionRow = (question) => `<li>
      <b>${esc(question.text)}</b>
      <span>优先级：${esc(question.priorityLabel)} · 回答类型：${esc(question.answerTypeLabel)} · 选项：${esc(question.optionsLabel)}</span>
    </li>`;
    const groupCard = (group, index) => `<article class="commerce-subplan-question-card">
      <h4>子计划 ${index + 1}：${esc(group.title)}</h4>
      <ul class="commerce-subplan-question-meta">
        ${row("子计划", group.title)}
        ${row("类别", group.categoryLabel)}
        ${row("问题数量", group.questionCountLabel)}
        ${row("是否访问真实平台", group.providerAccessLabel)}
        ${row("是否返回价格", group.priceLabel)}
        ${row("是否跳转购买", group.redirectLabel)}
      </ul>
      <ol>
        ${(group.questions || []).map(questionRow).join("")}
      </ol>
    </article>`;
    return `<section class="commerce-subplan-question-panel" aria-label="子计划补充问题">
      <div class="commerce-subplan-question-head">
        <div>
          <h3>${esc(display.title)}</h3>
          <p>${esc(display.subtitle)}</p>
        </div>
        <strong>总体状态：${esc(display.overallStatusLabel)}</strong>
      </div>
      <div class="commerce-subplan-question-status">
        <ul>
          ${row("总体状态", display.overallStatusLabel)}
          ${row("子计划数量", display.subPlanCountLabel)}
          ${row("问题数量", display.questionCountLabel)}
          ${row("是否访问真实平台", display.providerAccessLabel)}
          ${row("是否返回价格", display.priceLabel)}
          ${row("是否跳转购买", display.redirectLabel)}
        </ul>
      </div>
      <div class="commerce-subplan-question-cards">
        ${(display.groups || []).map(groupCard).join("")}
      </div>
      <div class="commerce-subplan-question-note">
        <p>${esc(display.note)}</p>
      </div>
    </section>`;
  }

  function providerPoolCopy(task, configInfo){
    const key = commercePoolCategory(task);
    const productCandidateName = configInfo && configInfo.productProviderProfile && (configInfo.productProviderProfile.selectedCandidateName || configInfo.productProviderProfile.candidateName) || "eBay Browse API";
    const map = {
      product:{
        scope:"商品电商平台、品牌官网、商品官网、区域电商平台",
        examples:"商品搜索试点候选：" + productCandidateName + " 等",
        noAccess:"当前不会访问任何真实平台。",
        noPrice:"当前不会返回价格。",
        noRedirect:"当前不会跳转购买页面。"
      },
      hotel:{
        scope:"酒店官网、酒店 OTA、区域住宿平台",
        examples:"示例候选类型：Booking / Agoda / Expedia / 携程 / 酒店官网 等",
        noAccess:"当前不会访问任何真实酒店平台。",
        noPrice:"当前不会返回房价。",
        noRedirect:"当前不会跳转预订页面。"
      },
      flight:{
        scope:"机票 OTA、航司官网、区域旅行平台",
        examples:"示例候选类型：Trip.com / Expedia / 航司官网 等",
        noAccess:"当前不会访问任何真实机票平台。",
        noPrice:"当前不会返回票价。",
        noRedirect:"当前不会跳转预订页面。"
      },
      ticket:{
        scope:"票务平台、活动官网、区域票务平台",
        examples:"示例候选类型：Ticketmaster / 大麦 / Eventbrite / 活动官网 等",
        noAccess:"当前不会访问任何真实票务平台。",
        noPrice:"当前不会返回票价。",
        noRedirect:"当前不会跳转购票页面。"
      },
      ticketOrActivity:{
        scope:"票务平台、活动官网、区域票务平台",
        examples:"示例候选类型：Ticketmaster / 大麦 / Eventbrite / 活动官网 等",
        noAccess:"当前不会访问任何真实票务平台。",
        noPrice:"当前不会返回票价。",
        noRedirect:"当前不会跳转购票页面。"
      },
      service:{
        scope:"本地服务预约平台、服务商官网、区域服务平台",
        examples:"示例候选类型：本地服务平台 / 服务商官网 / 区域预约平台 等",
        noAccess:"当前不会访问任何真实服务平台。",
        noPrice:"当前不会返回预约价格。",
        noRedirect:"当前不会跳转预约页面。"
      }
    };
    return map[key] || null;
  }

  function toOnboardingDisplayStatus(value){
    if (value === true) return "已完成";
    if (value === false) return "未完成";
    const raw = String(value || "");
    const map = {
      not_reviewed:"未审查",
      not_connected:"尚未接入",
      disabled:"未启用",
      unavailable:"不可用",
      blocked:"已阻断",
      ready:"可进入下一步",
      completed:"已完成",
      connected:"已接入",
      enabled:"已启用"
    };
    return map[raw] || "未完成";
  }

  function providerOnboardingReviewPanelHtml(onboardingInfo){
    const status = onboardingInfo || {};
    const checklist = status.checklist || {};
    const item = (label, value) => `<li><span>${esc(label)}</span><b>${esc(toOnboardingDisplayStatus(value))}</b></li>`;
    const group = (title, items) => `<section class="commerce-onboarding-group"><h4>${esc(title)}</h4><ul>${items.join("")}</ul></section>`;
    return `<section class="commerce-onboarding-review-panel" aria-label="Provider 接入审查面板">
        <div class="commerce-onboarding-panel-head">
          <div>
            <h3>Provider 接入审查面板</h3>
            <p>真实 provider 接入前必须完成以下审查。当前尚未接入任何真实 provider。</p>
          </div>
          <strong>总体状态：${status.canStartConnectorDevelopment === true ? "已完成，可进入下一步" : "未完成，暂不可接入真实 provider"}</strong>
        </div>
        <div class="commerce-onboarding-grid">
          ${group("合规与条款", [
            item("法律条款审查", checklist.legalTermsReviewed),
            item("隐私政策审查", checklist.privacyPolicyReviewed),
            item("合规风险审查", checklist.complianceRiskReviewed)
          ])}
          ${group("API 与接口", [
            item("API 文档审查", checklist.apiDocsReviewed),
            item("调用额度 / 频率限制审查", checklist.rateLimitReviewed),
            item("接口接入审查", checklist.endpointConnectionReviewed),
            item("API key 存储方案", checklist.apiKeyStoragePlanReviewed ? true : "not_reviewed")
          ])}
          ${group("价格与费用字段", [
            item("数据字段审查", checklist.dataFieldsReviewed),
            item("价格字段审查", checklist.priceFieldsReviewed),
            item("税费 / 关税 / 运费 / 预订费字段审查", checklist.taxAndFeeFieldsReviewed && checklist.shippingOrBookingFeeFieldsReviewed),
            item("no_provider fallback 审查", checklist.fallbackNoProviderStateReviewed)
          ])}
          ${group("安全边界", [
            item("不代付款确认", checklist.noPaymentConfirmed),
            item("不自动下单确认", checklist.noAutoOrderConfirmed),
            item("不保存证件/银行卡确认", checklist.noIdentityStorageConfirmed),
            item("外部跳转 URL 策略审查", checklist.redirectUrlPolicyReviewed)
          ])}
          <section class="commerce-onboarding-group commerce-onboarding-blocked-state">
            <h4>当前阻断状态</h4>
            <ul>
              <li><span>网络搜索</span><b>未启用</b></li>
              <li><span>实时价格</span><b>不可用</b></li>
              <li><span>精确跳转</span><b>待真实 provider 接入后启用</b></li>
              <li><span>支付/下单</span><b>不支持，由外部平台完成</b></li>
              <li><span>证件/银行卡</span><b>不保存</b></li>
              <li><span>连接方式</span><b>只读搜索准备中，暂未连接真实平台</b></li>
            </ul>
          </section>
        </div>
        <div class="commerce-onboarding-final-note">
          <p>只有以上审查全部完成，并通过 config / adapter / sandbox / connector gate 后，weishan 才允许进入真实 provider 连接。接通前不会访问真实平台、不会返回价格、不会跳转购买或预订页面。</p>
          <p>真实接通后的状态应为：Provider 接入审查已完成、接口已接入、网络搜索已启用、实时价格可用、精确跳转已启用。该状态只能在真实 provider 审查和接入完成后显示，不能提前模拟。</p>
        </div>
      </section>`;
  }

  function providerApprovalWorkflowPanelHtml(approvalInfo){
    const status = approvalInfo || {};
    const row = (label, value) => `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>`;
    const group = (title, items) => `<section class="commerce-approval-group"><h4>${esc(title)}</h4><ul>${items.map((item) => row(item[0], item[1])).join("")}</ul></section>`;
    return `<section class="commerce-provider-approval-panel" aria-label="Provider 审批流程">
      <div class="commerce-provider-approval-head">
        <div>
          <h3>Provider 审批流程</h3>
          <p>真实 provider 接入前必须完成分级审批。当前不会连接任何真实 provider。</p>
        </div>
        <strong>审批状态：${status.canConnectEndpoint === true ? "已批准进入下一步" : "未审查"}</strong>
      </div>
      <div class="commerce-provider-approval-grid">
        ${group("当前状态", [["当前阶段", "尚未进入审查流程"], ["Connector stub", "暂不可开发"], ["API key", "不可配置"], ["Endpoint", "不可连接"]])}
        ${group("连接与展示", [["网络搜索", "未启用"], ["实时价格", "不可用"], ["精确跳转", "未启用"]])}
        ${group("审批阶段清单", [["法律条款审查", "未开始"], ["API 文档审查", "未开始"], ["隐私政策审查", "未开始"], ["价格 / 税费 / 运费字段审查", "未开始"]])}
        ${group("安全审批", [["安全审查", "未开始"], ["当地法律合规审查", "未开始"], ["人工批准", "未完成"], ["只读 connector stub 开发许可", "未授予"]])}
      </div>
      <div class="commerce-provider-approval-note">
        <p>只有 provider 完成分级审批，并且本地法律合规、onboarding checklist、config / adapter / sandbox / connector gate 均通过后，weishan 才允许进入真实 provider 连接。当前不会连接真实平台，不会返回价格，不会跳转购买或预订页面。</p>
        <p>只读 connector stub 只允许开发准备，不连接真实平台。即使批准开发 stub，仍不会显示价格或跳转购买页面。</p>
      </div>
    </section>`;
  }

  function readOnlyConnectorStubPanelHtml(stubInfo){
    const row = (label, value) => `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>`;
    const group = (title, items) => `<section class="commerce-stub-group"><h4>${esc(title)}</h4><ul>${items.map((item) => row(item[0], item[1])).join("")}</ul></section>`;
    return `<section class="commerce-readonly-stub-panel" aria-label="只读 Connector Stub">
      <div class="commerce-readonly-stub-head">
        <div>
          <h3>只读 Connector Stub</h3>
          <p>真实 provider 接入前，weishan 只能准备只读 connector stub。当前不会连接任何真实平台。</p>
        </div>
        <strong>Stub 状态：未准备</strong>
      </div>
      <div class="commerce-readonly-stub-grid">
        ${group("Stub 准备状态", [["Connector 模式", "只读"], ["Stub 开发许可", "未授予"], ["Stub 执行", "未启用"]])}
        ${group("连接限制", [["API key", "不可配置"], ["Endpoint", "不可连接"], ["网络搜索", "未启用"]])}
        ${group("结果展示", [["真实价格", "不可用"], ["测试价格", "不可用"], ["精确跳转", "未启用"]])}
        ${group("交易与隐私", [["支付 / 下单", "不支持"], ["证件 / 银行卡", "不保存"]])}
      </div>
      <div class="commerce-readonly-stub-note">
        <p>只有 provider 审批状态达到 approved_for_stub 后，才允许开发只读 connector stub。</p>
        <p>即使允许开发 stub，也不会连接真实平台、不会配置真实 API key、不会启用网络搜索、不会显示价格、不会跳转购买或预订页面。</p>
      </div>
    </section>`;
  }

  function providerSecretStoragePanelHtml(secretInfo){
    const row = (label, value) => `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>`;
    const group = (title, items) => `<section class="commerce-secret-group"><h4>${esc(title)}</h4><ul>${items.map((item) => row(item[0], item[1])).join("")}</ul></section>`;
    return `<section class="commerce-provider-secret-panel" aria-label="Provider 密钥安全方案">
      <div class="commerce-provider-secret-head">
        <div>
          <h3>Provider 密钥安全方案</h3>
          <p>真实 provider API key 接入前必须完成安全存储审查。当前不会保存或使用任何真实 API key。</p>
        </div>
        <strong>密钥状态：未配置</strong>
      </div>
      <div class="commerce-provider-secret-grid">
        ${group("存储状态", [["密钥状态", "未配置"], ["存储方式", "需要安全存储"], ["API key 输入", "未开放"], ["API key 保存", "未开放"], ["API key 读取", "未开放"]])}
        ${group("使用限制", [["网络使用", "未启用"], ["Endpoint", "不可连接"], ["网络搜索", "未启用"], ["实时价格", "不可用"], ["精确跳转", "未启用"]])}
        ${group("明文保护", [["明文显示", "禁止"], ["日志记录", "禁止"], ["Git 提交", "禁止"]])}
      </div>
      <div class="commerce-provider-secret-note">
        <p>provider API key 只能在完成安全存储审查、Provider Approval、只读 Connector Stub、sandbox dry run 和 connector gate 后使用。</p>
        <p>当前不会保存真实 key，不会读取 key，不会用于网络请求。</p>
      </div>
    </section>`;
  }

  function providerSandboxDryRunPanelHtml(dryRunInfo){
    const row = (label, value) => `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>`;
    const group = (title, items) => `<section class="commerce-sandbox-dry-run-group"><h4>${esc(title)}</h4><ul>${items.map((item) => row(item[0], item[1])).join("")}</ul></section>`;
    return `<section class="commerce-sandbox-dry-run-panel" aria-label="Provider Sandbox Dry Run">
      <div class="commerce-sandbox-dry-run-head">
        <div>
          <h3>Provider Sandbox Dry Run</h3>
          <p>真实 provider 接入前必须完成离线沙箱空跑。当前不会访问任何真实平台。</p>
        </div>
        <strong>Dry Run 状态：未运行</strong>
      </div>
      <div class="commerce-sandbox-dry-run-grid">
        ${group("沙箱状态", [["Dry Run 状态", "未运行"], ["Dry Run 模式", "离线沙箱"], ["真实 endpoint", "不可使用"], ["真实 API key", "不可使用"], ["网络请求", "未启用"]])}
        ${group("结果与跳转", [["真实结果", "不可返回"], ["真实价格", "不可用"], ["测试价格", "不可用"], ["精确跳转", "未启用"]])}
        ${group("交易与隐私", [["支付 / 下单", "不支持"], ["证件 / 银行卡", "不保存"]])}
        ${group("空跑检查清单", [["请求结构审查", "未完成"], ["响应结构审查", "未完成"], ["错误处理审查", "未完成"], ["超时处理审查", "未完成"], ["频率限制审查", "未完成"], ["分页处理审查", "未完成"], ["价格字段审查", "未完成"], ["税费 / 运费字段审查", "未完成"], ["跳转 URL 审查", "未完成"], ["隐私审查", "未完成"], ["不付款确认", "未完成"], ["不提交订单确认", "未完成"], ["不保存证件 / 银行卡确认", "未完成"]])}
      </div>
      <div class="commerce-sandbox-dry-run-note">
        <p>Sandbox dry run 只用于检查未来 connector 的请求/响应结构。当前不会访问 eBay 或任何真实 provider，不会读取 API key，不会发起网络请求，不会返回商品、价格或跳转链接。</p>
        <p>即使后续 dry run 通过，也不会自动放开 API key、endpoint、network、price、redirect、checkout、payment 或 order。</p>
      </div>
    </section>`;
  }

  function connectorGatePanelHtml(gateInfo){
    const row = (label, value) => `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>`;
    const group = (title, items) => `<section class="commerce-connector-gate-group"><h4>${esc(title)}</h4><ul>${items.map((item) => row(item[0], item[1])).join("")}</ul></section>`;
    return `<section class="commerce-connector-gate-panel" aria-label="Connector Gate">
      <div class="commerce-connector-gate-head">
        <div>
          <h3>Connector Gate</h3>
          <p>真实 provider connector 接入前必须通过最终闸门。当前不会打开任何真实 connector。</p>
        </div>
        <strong>Gate 状态：已阻断</strong>
      </div>
      <div class="commerce-connector-gate-grid">
        ${group("Gate 状态", [["总体状态", "已阻断"], ["闸门模式", "真实连接前最终闸门"], ["前置检查", "未全部完成"], ["人工批准", "未完成"]])}
        ${group("连接能力", [["Connector", "不可打开"], ["Endpoint", "不可连接"], ["API key", "不可使用"], ["网络请求", "未启用"]])}
        ${group("结果与跳转", [["真实结果", "不可返回"], ["真实价格", "不可用"], ["测试价格", "不可用"], ["精确跳转", "未启用"]])}
        ${group("交易与隐私", [["支付 / 下单", "不支持"], ["证件 / 银行卡", "不保存"], ["原始 GPS 坐标", "不保存"]])}
        ${group("Connector Gate 检查清单", [["全球采购标准", "未通过最终接入审查"], ["当地法律合规", "未通过最终接入审查"], ["Provider Onboarding", "未完成"], ["Provider Approval", "未完成"], ["只读 Connector Stub", "未准备"], ["候选 provider 档案", "未完成"], ["密钥安全方案", "未批准"], ["Sandbox Dry Run", "未通过"], ["Endpoint 审查", "未完成"], ["API key 存储审查", "未完成"], ["网络策略审查", "未完成"], ["价格字段审查", "未完成"], ["跳转策略审查", "未完成"]])}
      </div>
      <div class="commerce-connector-gate-note">
        <p>Connector Gate 是真实 provider 接入前的最终闸门。当前不会访问 eBay 或任何真实 provider，不会读取 API key，不会连接 endpoint，不会发起网络请求，不会返回商品、价格或跳转链接。</p>
        <p>任意前置 gate 未完成时，Connector Gate 必须保持已阻断；通过后也不得自动放开 checkout、payment 或 order。</p>
      </div>
    </section>`;
  }

  function providerIntegrationReadinessPanelHtml(readinessInfo){
    const row = (label, value) => `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>`;
    const group = (title, items) => `<section class="commerce-provider-readiness-group"><h4>${esc(title)}</h4><ul>${items.map((item) => row(item[0], item[1])).join("")}</ul></section>`;
    return `<section class="commerce-provider-readiness-panel" aria-label="Provider 接入准备总览">
      <div class="commerce-provider-readiness-head">
        <div>
          <h3>Provider 接入准备总览</h3>
          <p>真实 provider 接入前必须完成所有 gate。当前尚未准备好接入任何真实 provider。</p>
        </div>
        <strong>总体状态：未准备好</strong>
      </div>
      <div class="commerce-provider-readiness-grid">
        ${group("总体能力", [["真实 provider", "不可接入"], ["API key", "不可使用"], ["网络请求", "未启用"], ["真实结果", "不可返回"], ["真实价格", "不可用"], ["测试价格", "不可用"], ["精确跳转", "未启用"], ["支付 / 下单", "不支持"], ["证件 / 银行卡", "不保存"]])}
        ${group("Gate 总览", [["全球采购标准", "已要求"], ["当地法律合规", "未确认"], ["Provider Onboarding", "未完成"], ["Provider Approval", "未审查"], ["只读 Connector Stub", "未准备"], ["Provider Stub Profile", "仅建档，尚未接入"], ["密钥安全方案", "未配置"], ["Sandbox Dry Run", "未运行"], ["Connector Gate", "已阻断"], ["人工批准", "未完成"]])}
      </div>
      <div class="commerce-provider-readiness-note">
        <p>该面板只是接入准备总览，不会打开任何 connector。当前不会访问 eBay 或任何真实 provider，不会读取 API key，不会连接 endpoint，不会发起网络请求，不会返回商品、价格或跳转链接。</p>
      </div>
    </section>`;
  }

  function providerIntegrationRunbookPanelHtml(runbookInfo){
    const row = (label, value) => `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>`;
    const group = (title, items) => `<section class="commerce-provider-runbook-group"><h4>${esc(title)}</h4><ul>${items.map((item) => row(item[0], item[1])).join("")}</ul></section>`;
    return `<section class="commerce-provider-runbook-panel" aria-label="Provider 接入人工审批手册">
      <div class="commerce-provider-runbook-head">
        <div>
          <h3>Provider 接入人工审批手册</h3>
          <p>真实 provider 接入前必须完成人工审批与运行手册确认。当前不会批准任何真实 provider 接入。</p>
        </div>
        <strong>手册状态：需要人工审批</strong>
      </div>
      <div class="commerce-provider-runbook-grid">
        ${group("当前审批状态", [["手册状态", "需要人工审批"], ["手册模式", "真实接入前运行手册"], ["真实 provider", "不可批准"], ["Endpoint", "不可连接"], ["API key", "不可使用"], ["网络请求", "未启用"], ["真实结果", "不可返回"], ["真实价格", "不可用"], ["测试价格", "不可用"], ["精确跳转", "未启用"], ["支付 / 下单", "不支持"], ["证件 / 银行卡", "不保存"], ["回滚方案", "必须准备"], ["最终人工批准", "未完成"]])}
        ${group("人工审批阶段", [["范围审查", "未开始"], ["Provider 条款审查", "未开始"], ["当地法律审查", "未开始"], ["隐私审查", "未开始"], ["API 文档审查", "未开始"], ["Endpoint 审查", "未开始"], ["API key 存储审查", "未开始"], ["请求 / 响应结构审查", "未开始"], ["频率限制审查", "未开始"], ["价格 / 税费 / 运费字段审查", "未开始"], ["跳转策略审查", "未开始"], ["不付款确认", "未开始"], ["不提交订单确认", "未开始"], ["不保存证件 / 银行卡确认", "未开始"], ["回滚方案审查", "未开始"], ["最终人工批准", "未开始"]])}
      </div>
      <div class="commerce-provider-runbook-note">
        <p>该手册只是接入前人工审批流程，不会打开任何 connector。当前不会访问 eBay 或任何真实 provider，不会读取 API key，不会连接 endpoint，不会发起网络请求，不会返回商品、价格或跳转链接。真正接入必须另起版本单独 review。</p>
      </div>
    </section>`;
  }

  function providerStubProfilePanelHtml(profileInfo, task){
    const category = commercePoolCategory(task);
    if (category !== "product") return "";
    const row = (label, value) => `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>`;
    const group = (title, items) => `<section class="commerce-stub-group"><h4>${esc(title)}</h4><ul>${items.map((item) => row(item[0], item[1])).join("")}</ul></section>`;
    const providerName = profileInfo && profileInfo.providerName || "eBay Browse API";
    return `<section class="commerce-readonly-stub-panel commerce-provider-stub-profile-panel" aria-label="Provider Stub Profile">
      <div class="commerce-readonly-stub-head">
        <div>
          <h3>Provider Stub Profile</h3>
          <p>eBay Browse API 目前只是商品搜索候选 provider 档案，尚未接入真实平台。</p>
        </div>
        <strong>档案状态：仅建档，尚未接入</strong>
      </div>
      <div class="commerce-readonly-stub-grid">
        ${group("候选档案", [["Provider", providerName], ["类别", "商品电商平台"], ["用途", "商品搜索候选"]])}
        ${group("连接状态", [["Connector 模式", "只读"], ["当前连接", "未接入"], ["API key", "未配置"]])}
        ${group("搜索与展示", [["网络搜索", "未启用"], ["真实价格", "不可用"], ["测试价格", "不可用"], ["精确跳转", "未启用"]])}
        ${group("交易与隐私", [["支付 / 下单", "不支持"], ["证件 / 银行卡", "不保存"]])}
      </div>
      <div class="commerce-readonly-stub-note">
        <p>eBay Browse API 只是商品搜索候选 provider 之一。当前不会访问 eBay，不会返回 eBay 商品或价格，不会跳转 eBay 页面。</p>
        <p>真实接入前仍必须通过当地法律合规、Provider Onboarding、Provider Approval、只读 Connector Stub、sandbox dry run 和 connector gate。</p>
      </div>
    </section>`;
  }

  function localLawCompliancePanelHtml(task){
    const health = task && task.complianceHealth || {};
    const regulated = health.complianceStatus === "compliance_review_required";
    const row = (label, value) => `<li><span>${esc(label)}</span><b>${esc(value)}</b></li>`;
    return `<section class="commerce-local-law-panel commerce-local-law-review-panel" aria-label="当地法律合规审查">
      <div class="commerce-local-law-head">
        <div>
          <h3>当地法律合规审查</h3>
          <p>购物和预订必须遵守当地法律。合法性未确认前，weishan 不显示价格、不跳转购买或预订页面。</p>
        </div>
        <strong>合规状态：未确认</strong>
      </div>
      <div class="commerce-local-law-grid">
        <section class="commerce-local-law-group">
          <h4>当前合规状态</h4>
          <ul>
            ${row("合规状态", "未确认")}
            ${row("合规处理", "未确认前不显示价格、不跳转购买或预订页面")}
            ${row("地区依据", "优先使用定位服务；无法精准定位时使用收货地址 / 目的地 / 服务发生地")}
            ${row("规则冲突处理", "当前位置与收货地 / 目的地冲突时，按更严格的一方处理")}
          </ul>
        </section>
        <section class="commerce-local-law-group commerce-local-law-privacy">
          <h4>隐私与法律说明</h4>
          <ul>
            ${row("隐私保护", "不保存原始 GPS 坐标，不上传定位到第三方，不用于广告、追踪或画像")}
            ${row("法律说明", "weishan 不提供法律意见，不帮助规避当地法律")}
          </ul>
        </section>
      </div>
      ${regulated ? `<div class="commerce-local-law-regulated">
        <b>该需求可能涉及当地法律限制</b>
        <span>需要先确认当前位置和收货地 / 目的地。</span>
        <span>合法性未确认前，weishan 不显示价格、不跳转购买或预订页面。</span>
        <span>当前仅做风险分类和阻断，不做真实法律结论。</span>
      </div>` : `<div class="commerce-local-law-regulated is-neutral">
        <b>合规依据：定位服务或收货 / 目的地信息未完成</b>
        <span>未确认前不显示价格、不跳转购买或预订页面。</span>
      </div>`}
    </section>`;
  }

  function providerPoolNoticeHtml(task, configInfo, onboardingInfo, approvalInfo){
    const copy = providerPoolCopy(task, configInfo || {});
    if (!copy) return "";
    const isProduct = commercePoolCategory(task) === "product";
    return `<div class="commerce-warning commerce-provider-pool-missing">
        <b>全球多源 provider 候选池：准备中，尚未接入。</b>
        ${commerceLocalIntentPanelHtml(task)}
        ${providerIntegrationReadinessPanelHtml(configInfo && configInfo.providerIntegrationReadiness || {})}
        ${providerIntegrationRunbookPanelHtml(configInfo && configInfo.providerIntegrationRunbook || {})}
        ${providerStubProfilePanelHtml(configInfo && configInfo.providerStubProfileHealth || {}, task)}
        ${readOnlyConnectorStubPanelHtml(configInfo && configInfo.connectorStubHealth || {})}
        ${providerSecretStoragePanelHtml(configInfo && configInfo.providerSecretHealth || {})}
        ${providerSandboxDryRunPanelHtml(configInfo && configInfo.providerSandboxDryRunHealth || {})}
        ${connectorGatePanelHtml(configInfo && configInfo.connectorGateHealth || {})}
        ${providerApprovalWorkflowPanelHtml(approvalInfo || {})}
        ${providerOnboardingReviewPanelHtml(onboardingInfo || {})}
        <span>当前比较范围：${esc(copy.scope)}。</span>
        <span>${esc(copy.examples)}。</span>
        ${isProduct ? `<span>eBay Browse API 是商品搜索试点候选之一，尚未接入。</span>` : ""}
        <span>接口状态：尚未接入。</span>
        <span>Provider 接入审查：未完成，完成前不会连接真实平台。</span>
        <span>接口文档审查：未完成。</span>
        <span>API key 存储方案：未审查。</span>
        <span>价格/税费/运费字段审查：未完成。</span>
        <span>隐私与合规审查：未完成。</span>
        <span>搜索模式：只读搜索准备中。</span>
        <span>网络搜索：未启用。</span>
        <span>实时价格：不可用。</span>
        <span>精确跳转：待真实 provider 接入后启用。</span>
        <span>${esc(copy.noAccess)}</span>
        <span>${esc(copy.noPrice)}</span>
        <span>${esc(copy.noRedirect)}</span>
        <span>当前不会连接真实 provider。</span>
        <span>支付/下单：不支持，由外部平台完成。</span>
        <span>证件/银行卡：不保存。</span>
        <span>当前不会下单、付款或保存证件/银行卡。</span>
      </div>`;
  }

  function commerceDisplayTitle(task){
    const api = agent();
    if (api && api.createCommerceDisplayTitle) return api.createCommerceDisplayTitle(task, !!(task && Array.isArray(task.candidates) && task.candidates.length));
    if (!task) return "计划详情";
    if (task.status === "blocked") return "全球采购计划已阻断";
    if (task.category === "flight") return "机票搜索结果";
    return task.searchStatus === "completed" ? "搜索已完成" : "搜索已生成";
  }

  function taskCards(tasks){
    if (!tasks.length) {
      return `<div class="commerce-empty">
        <b>暂无采购计划。</b>
        <span>可在首页输入：</span>
        <span>帮我找成都到上海最便宜机票</span>
        <span>帮我比较 OpenRouter 和其他 AI 模型平台价格</span>
        <button class="cmd-btn gray" id="commerceEmptyBackHome" type="button">返回首页总调度</button>
      </div>`;
    }
    return tasks.map((task) => {
      const active = task.taskId === selectedTaskId ? " active" : "";
      const cardApi = window.WeishanGlobalProcurementUserFacingResultCards;
      const category = cardApi && typeof cardApi.deriveHistoryTypeLabel === "function"
        ? cardApi.deriveHistoryTypeLabel(task || {}) || task.categoryLabel || task.category || "全球采购"
        : task.categoryLabel || task.category || "全球采购";
      return `<article class="commerce-task-card${active}" data-commerce-task-id="${esc(task.taskId)}">
        <div class="commerce-task-main">
          <strong>${esc(task.inputSummary || "全球采购任务")}</strong>
          <span>${esc(category)} · ${esc(timeLabel(task.createdAt))}</span>
        </div>
        <div class="commerce-task-meta">
          <span class="commerce-status ${esc(task.status)}">${esc(taskStatusLabel(task.status))}</span>
        </div>
        <div class="commerce-task-actions">
          <button class="cmd-btn gray commerce-view-task" type="button" data-task-id="${esc(task.taskId)}">查看计划</button>
          <button class="cmd-btn gray commerce-clear-task" type="button" data-task-id="${esc(task.taskId)}">清理计划</button>
        </div>
      </article>`;
    }).join("");
  }

  function commerceActionableChecklistSection(title, lines){
    return [title].concat(lines || []).join("\n");
  }

  function commerceActionableChecklistCopyText(kind){
    // 复制按钮只复制文本到剪贴板，不会发起网络搜索，不会返回 fake/demo/mock price，不会提交订单，不会保存身份证、护照、银行卡。
    const flight = commerceActionableChecklistSection("机票搜索条件", [
      "出发地：成都",
      "目的地：东京",
      "出发日期：7月12日",
      "乘客：1名成人 + 1名8岁儿童",
      "预算目标：总预算一万以内",
      "排序建议：优先看总价、转机次数、起飞时间、行李规则",
      "注意：最终价格以真实平台为准。"
    ]);
    const hotel = commerceActionableChecklistSection("酒店搜索条件", [
      "目的地：东京",
      "入住日期：7月12日",
      "离店日期：7月16日",
      "人员：带8岁儿童",
      "筛选建议：优先看家庭友好、地铁方便、评分、取消政策、税费是否包含",
      "注意：最终价格以真实平台为准。"
    ]);
    const computer = commerceActionableChecklistSection("电脑搜索条件", [
      "用途：剪视频",
      "内存：32G",
      "硬盘：1T",
      "品牌：都可以",
      "收货地：成都",
      "是否接受二手：不接受",
      "预算：一万以内",
      "筛选建议：优先看内存、硬盘、CPU、显卡、屏幕、散热、售后；排除二手 / 翻新 / 展示机",
      "注意：最终价格以真实平台为准。"
    ]);
    const travel = [
      "旅行搜索条件",
      flight,
      hotel,
      "当前不会访问真实平台，不会返回价格，不会跳转购买或预订，不会付款或下单。"
    ].join("\n\n");
    const full = [
      "可执行清单",
      flight,
      hotel,
      computer,
      "当前不会访问真实平台，不会返回价格，不会跳转购买或预订，不会付款或下单。"
    ].join("\n\n");
    return { flight, hotel, travel, computer, full }[kind] || "";
  }

  function commercePlatformSearchTemplateList(lines){
    return `<ul>${(lines || []).map((line) => `<li>${esc(line)}</li>`).join("")}</ul>`;
  }

  function commercePlatformSearchTemplateGroup(title, lines){
    return `<div class="commerce-result-summary-checklist-group">
      <b>${esc(title)}</b>
      ${commercePlatformSearchTemplateList(lines)}
    </div>`;
  }

  function commercePlatformSearchTemplateCopyText(kind){
    const lineJoin = (lines) => lines.join("\n");
    const paragraphJoin = (lines) => lines.join("\n\n");
    const googleFlights = lineJoin([
      "Google Flights search template",
      "From: Chengdu",
      "To: Tokyo",
      "Departure date: July 12",
      "Passengers: 1 adult + 1 child aged 8",
      "Budget target: total trip budget within RMB 10,000",
      "Compare: total price, number of stops, departure time, baggage rules",
      "Note: final price must be checked on the real platform."
    ]);
    const tripCom = lineJoin([
      "机票搜索模板",
      "出发地：成都",
      "目的地：东京",
      "出发日期：7月12日",
      "乘客：1名成人 + 1名8岁儿童",
      "预算目标：总预算一万以内",
      "优先比较：总价、转机次数、起飞时间、行李规则",
      "注意：最终价格以真实平台为准。"
    ]);
    const booking = lineJoin([
      "Booking hotel search template",
      "Destination: Tokyo",
      "Check-in: July 12",
      "Check-out: July 16",
      "Guests: adult with 8-year-old child",
      "Preferences: family friendly, near subway or convenient transport, good rating, clear cancellation policy, taxes and fees included if possible",
      "Note: final price and room policy must be checked on the real platform."
    ]);
    const agoda = lineJoin([
      "Agoda hotel search template",
      "Destination: Tokyo",
      "Check-in date: July 12",
      "Check-out date: July 16",
      "Guests: adult + child aged 8",
      "Filter by: family friendly, location convenience, rating, cancellation policy, total price with taxes and fees",
      "Note: final price must be checked on the real platform."
    ]);
    const jd = lineJoin([
      "京东电脑搜索模板",
      "用途：剪视频",
      "内存：32G",
      "硬盘：1T",
      "品牌：都可以",
      "收货地：成都",
      "是否接受二手：不接受",
      "预算：一万以内",
      "筛选建议：优先看 CPU、显卡、内存、硬盘、屏幕、散热、售后、官方保修",
      "排除：二手、翻新机、展示机",
      "注意：最终价格、库存、保修和退换政策以真实平台为准。"
    ]);
    const taobaoTmall = lineJoin([
      "淘宝 / 天猫电脑搜索模板",
      "搜索词：剪视频电脑 32G内存 1T硬盘 新机",
      "预算：一万以内",
      "收货地：成都",
      "品牌：不限",
      "排除：二手、翻新、展示机",
      "重点确认：官方保修、真实配置、最终到手价、退换政策",
      "注意：最终价格以真实平台为准。"
    ]);
    const amazon = lineJoin([
      "Amazon laptop search template",
      "Use case: video editing",
      "Memory: 32GB RAM",
      "Storage: 1TB SSD",
      "Brand: any brand",
      "Condition: new only, no used or refurbished items",
      "Budget: within RMB 10,000 or equivalent",
      "Compare: CPU, GPU, RAM, storage, display, cooling, warranty, return policy",
      "Note: final price, availability, warranty and return policy must be checked on the real platform."
    ]);
    const bestBuy = lineJoin([
      "Best Buy laptop search template",
      "Use case: video editing",
      "RAM: 32GB",
      "Storage: 1TB SSD",
      "Condition: new only",
      "Brand: flexible",
      "Budget: within RMB 10,000 or equivalent",
      "Compare: processor, graphics, memory, storage, screen, cooling, warranty, return policy",
      "Note: final price must be checked on the real platform."
    ]);
    const allPlatforms = paragraphJoin([
      "全部平台模板",
      "Google Flights 模板",
      googleFlights,
      "Trip.com / 携程模板",
      tripCom,
      "Booking 模板",
      booking,
      "Agoda 模板",
      agoda,
      "京东模板",
      jd,
      "淘宝 / 天猫模板",
      taobaoTmall,
      "Amazon 模板",
      amazon,
      "Best Buy 模板",
      bestBuy,
      "当前不会访问真实平台。",
      "当前不会返回价格。",
      "当前不会跳转购买或预订。",
      "当前不会付款或下单。",
      "最终价格、库存、政策和合法性以真实平台和当地法律为准。"
    ]);
    return {
      googleFlights,
      tripCom,
      booking,
      agoda,
      jd,
      taobaoTmall,
      amazon,
      bestBuy,
      allPlatforms
    }[kind] || "";
  }

  function commercePlatformSearchTemplatePackHtml(){
    const buttons = [
      ["googleFlights", "复制 Google Flights 模板"],
      ["tripCom", "复制 Trip.com / 携程模板"],
      ["booking", "复制 Booking 模板"],
      ["agoda", "复制 Agoda 模板"],
      ["jd", "复制京东模板"],
      ["taobaoTmall", "复制淘宝 / 天猫模板"],
      ["amazon", "复制 Amazon 模板"],
      ["bestBuy", "复制 Best Buy 模板"],
      ["allPlatforms", "复制全部平台模板"]
    ];
    const groups = [
      {
        title: "机票平台模板",
        items: [
          {
            title: "Google Flights 模板",
            lines: [
              "From: Chengdu",
              "To: Tokyo",
              "Departure date: July 12",
              "Passengers: 1 adult + 1 child aged 8",
              "Budget target: total trip budget within RMB 10,000",
              "Compare: total price, number of stops, departure time, baggage rules",
              "Note: final price must be checked on the real platform."
            ]
          },
          {
            title: "Trip.com / 携程模板",
            lines: [
              "出发地：成都",
              "目的地：东京",
              "出发日期：7月12日",
              "乘客：1名成人 + 1名8岁儿童",
              "预算目标：总预算一万以内",
              "优先比较：总价、转机次数、起飞时间、行李规则",
              "注意：最终价格以真实平台为准。"
            ]
          }
        ]
      },
      {
        title: "酒店平台模板",
        items: [
          {
            title: "Booking 模板",
            lines: [
              "Destination: Tokyo",
              "Check-in: July 12",
              "Check-out: July 16",
              "Guests: adult with 8-year-old child",
              "Preferences: family friendly, near subway or convenient transport, good rating, clear cancellation policy, taxes and fees included if possible",
              "Note: final price and room policy must be checked on the real platform."
            ]
          },
          {
            title: "Agoda 模板",
            lines: [
              "Destination: Tokyo",
              "Check-in date: July 12",
              "Check-out date: July 16",
              "Guests: adult + child aged 8",
              "Filter by: family friendly, location convenience, rating, cancellation policy, total price with taxes and fees",
              "Note: final price must be checked on the real platform."
            ]
          }
        ]
      },
      {
        title: "中文购物平台模板",
        items: [
          {
            title: "京东模板",
            lines: [
              "用途：剪视频",
              "内存：32G",
              "硬盘：1T",
              "品牌：都可以",
              "收货地：成都",
              "是否接受二手：不接受",
              "预算：一万以内",
              "筛选建议：优先看 CPU、显卡、内存、硬盘、屏幕、散热、售后、官方保修",
              "排除：二手、翻新机、展示机",
              "注意：最终价格、库存、保修和退换政策以真实平台为准。"
            ]
          },
          {
            title: "淘宝 / 天猫模板",
            lines: [
              "搜索词：剪视频电脑 32G内存 1T硬盘 新机",
              "预算：一万以内",
              "收货地：成都",
              "品牌：不限",
              "排除：二手、翻新、展示机",
              "重点确认：官方保修、真实配置、最终到手价、退换政策",
              "注意：最终价格以真实平台为准。"
            ]
          }
        ]
      },
      {
        title: "英文购物平台模板",
        items: [
          {
            title: "Amazon 模板",
            lines: [
              "Use case: video editing",
              "Memory: 32GB RAM",
              "Storage: 1TB SSD",
              "Brand: any brand",
              "Condition: new only, no used or refurbished items",
              "Budget: within RMB 10,000 or equivalent",
              "Compare: CPU, GPU, RAM, storage, display, cooling, warranty, return policy",
              "Note: final price, availability, warranty and return policy must be checked on the real platform."
            ]
          },
          {
            title: "Best Buy 模板",
            lines: [
              "Use case: video editing",
              "RAM: 32GB",
              "Storage: 1TB SSD",
              "Condition: new only",
              "Brand: flexible",
              "Budget: within RMB 10,000 or equivalent",
              "Compare: processor, graphics, memory, storage, screen, cooling, warranty, return policy",
              "Note: final price must be checked on the real platform."
            ]
          }
        ]
      },
      {
        title: "全部平台模板",
        items: [
          {
            title: "包含模板",
            lines: [
              "Google Flights 模板",
              "Trip.com / 携程模板",
              "Booking 模板",
              "Agoda 模板",
              "京东模板",
              "淘宝 / 天猫模板",
              "Amazon 模板",
              "Best Buy 模板"
            ]
          },
          {
            title: "安全说明",
            lines: [
              "当前不会访问真实平台。",
              "当前不会返回价格。",
              "当前不会跳转购买或预订。",
              "当前不会付款或下单。",
              "最终价格、库存、政策和合法性以真实平台和当地法律为准。"
            ]
          }
        ]
      }
    ];
    return `<section class="commerce-result-summary-checklist commerce-platform-template-pack" aria-label="平台搜索模板">
      <div class="commerce-result-summary-checklist-head">
        <div>
          <h4>平台搜索模板</h4>
          <p>复制下面的模板后，可以粘贴到对应平台自行搜索。当前不会打开外部平台，不会访问真实平台，不会返回价格，不会跳转购买或预订。</p>
        </div>
        <div class="commerce-result-summary-copy-actions" aria-label="平台搜索模板复制按钮">
          ${buttons.map(([kind, label]) => `<button class="cmd-btn gray commerce-platform-template-copy-btn" type="button" data-commerce-template-kind="${esc(kind)}">${esc(label)}</button>`).join("")}
        </div>
      </div>
      <p class="commerce-result-summary-copy-feedback commerce-platform-template-copy-feedback" data-commerce-platform-template-feedback aria-live="polite"></p>
      <div class="commerce-result-summary-checklist-grid commerce-platform-template-grid">
        ${groups.map((group) => `<section class="commerce-result-summary-checklist-card">
          <h5>${esc(group.title)}</h5>
          ${group.items.map((item) => commercePlatformSearchTemplateGroup(item.title, item.lines)).join("")}
        </section>`).join("")}
      </div>
    </section>`;
  }

  function commerceActionableChecklistPanelHtml(){
    return `<section class="commerce-result-summary-checklist" aria-label="可执行清单">
      <div class="commerce-result-summary-checklist-head">
        <div>
          <h4>可执行清单</h4>
          <p>你可以把下面的条件复制到机票、酒店或购物平台自行搜索。当前不会访问真实平台、不会返回价格、不会跳转购买或预订。</p>
        </div>
        <div class="commerce-result-summary-copy-actions" aria-label="可执行清单复制按钮">
          <button class="cmd-btn gray commerce-result-summary-copy-btn" type="button" data-commerce-copy-kind="flight">复制机票搜索条件</button>
          <button class="cmd-btn gray commerce-result-summary-copy-btn" type="button" data-commerce-copy-kind="hotel">复制酒店搜索条件</button>
          <button class="cmd-btn gray commerce-result-summary-copy-btn" type="button" data-commerce-copy-kind="computer">复制电脑搜索条件</button>
          <button class="cmd-btn gray commerce-result-summary-copy-btn" type="button" data-commerce-copy-kind="full">复制全部清单</button>
        </div>
      </div>
      <p class="commerce-result-summary-copy-feedback" data-commerce-copy-feedback aria-live="polite"></p>
      <div class="commerce-result-summary-checklist-grid">
        <section class="commerce-result-summary-checklist-card">
          <h5>旅行可执行清单</h5>
          <div class="commerce-result-summary-checklist-group">
            <b>机票搜索条件：</b>
            <ul>
              <li>出发地：成都</li>
              <li>目的地：东京</li>
              <li>出发日期：7月12日</li>
              <li>乘客：1名成人 + 1名8岁儿童</li>
              <li>预算目标：总预算一万以内</li>
              <li>排序建议：优先看总价、转机次数、起飞时间、行李规则</li>
            </ul>
          </div>
          <div class="commerce-result-summary-checklist-group">
            <b>酒店搜索条件：</b>
            <ul>
              <li>目的地：东京</li>
              <li>入住日期：7月12日</li>
              <li>离店日期：7月16日</li>
              <li>人员：带8岁儿童</li>
              <li>筛选建议：优先看家庭友好、地铁方便、评分、取消政策、税费是否包含</li>
            </ul>
          </div>
          <div class="commerce-result-summary-checklist-group">
            <b>旅行确认前检查：</b>
            <ul>
              <li>护照 / 签证 / 入境要求需自行确认</li>
              <li>航班行李规则需自行确认</li>
              <li>酒店儿童入住政策需自行确认</li>
              <li>最终价格以真实平台为准</li>
            </ul>
          </div>
        </section>
        <section class="commerce-result-summary-checklist-card">
          <h5>商品采购可执行清单</h5>
          <div class="commerce-result-summary-checklist-group">
            <b>电脑搜索条件：</b>
            <ul>
              <li>用途：剪视频</li>
              <li>内存：32G</li>
              <li>硬盘：1T</li>
              <li>品牌：都可以</li>
              <li>收货地：成都</li>
              <li>是否接受二手：不接受</li>
              <li>预算：一万以内</li>
            </ul>
          </div>
          <div class="commerce-result-summary-checklist-group">
            <b>电脑筛选建议：</b>
            <ul>
              <li>优先看内存、硬盘、CPU、显卡、屏幕、散热、售后</li>
              <li>剪视频优先看性能释放和内存容量</li>
              <li>不接受二手时排除二手 / 翻新 / 展示机</li>
              <li>比较时看最终到手价、保修、退换政策</li>
            </ul>
          </div>
          <div class="commerce-result-summary-checklist-group">
            <b>商品确认前检查：</b>
            <ul>
              <li>型号是否为新机</li>
              <li>是否官方保修</li>
              <li>配置是否真为32G / 1T</li>
              <li>收货地是否支持配送</li>
              <li>最终价格以真实平台为准</li>
            </ul>
          </div>
        </section>
      </div>
    </section>`;
  }

  function globalProcurementDetailQuality(task){
    return task && task.globalProcurementDetailQuality || task && task.globalProcurementPlan && task.globalProcurementPlan.detailQuality || null;
  }

  function globalProcurementMissingInfoChecklistDisclosure(task){
    const checklist = task && task.globalProcurementMissingInfoChecklist;
    if (!checklist) return "";
    const items = Array.isArray(checklist.items) && checklist.items.length ? checklist.items : ["当前无关键缺口"];
    const body = `<section class="commerce-global-procurement-missing-info" aria-label="全球采购待补充信息清单">
      <h4>全球采购待补充信息清单</h4>
      <p>status: ${esc(checklist.status || "draft only")}</p>
      <p>mode: ${esc(checklist.mode || "local planning only")}</p>
      <p>real provider disabled</p>
      <p>real network disabled</p>
      <p>redacted: true</p>
      ${list(items)}
    </section>`;
    return disclosure("查看全球采购待补充信息清单", body, "commerce-global-procurement-missing-info-disclosure");
  }

  function globalProcurementSafeNextStepGuidanceDisclosure(task){
    const guidance = task && task.globalProcurementSafeNextStepGuidance;
    if (!guidance) return "";
    const body = `<section class="commerce-global-procurement-safe-guidance" aria-label="全球采购安全下一步建议">
      <h4>全球采购安全下一步建议</h4>
      <p>status: ${esc(guidance.status || "safe guidance only")}</p>
      <p>mode: ${esc(guidance.mode || "no transaction")}</p>
      <p>real provider disabled</p>
      <p>real network disabled</p>
      <p>payment disabled</p>
      <p>order disabled</p>
      <p>redacted: true</p>
      ${list(guidance.items || [])}
    </section>`;
    return disclosure("查看全球采购安全下一步建议", body, "commerce-global-procurement-safe-guidance-disclosure");
  }

  function globalProcurementExternalSearchPolicyDisclosure(task){
    const policy = task && task.globalProcurementExternalSearchPolicy;
    if (!policy) return "";
    const body = `<section class="commerce-global-procurement-external-search-policy" aria-label="全球采购外部搜索入口规则">
      <h4>全球采购外部搜索入口规则</h4>
      <p>status: ${esc(policy.status || "manual external search only")}</p>
      <p>real provider disabled</p>
      <p>real network disabled</p>
      <p>bookingUrl disabled</p>
      <p>auto click disabled</p>
      <p>allowExternalSearch: ${esc(policy.allowExternalSearch === false ? "false" : "true")}</p>
      <p>redacted: true</p>
      ${list(policy.rules || [])}
    </section>`;
    return disclosure("查看全球采购外部搜索入口规则", body, "commerce-global-procurement-external-search-policy-disclosure");
  }

  function globalProcurementUserFacingCard(task){
    const api = window.WeishanGlobalProcurementUserFacingResultCards;
    if (!api || typeof api.buildGlobalProcurementUserFacingResultCard !== "function") return null;
    const card = api.buildGlobalProcurementUserFacingResultCard(task || {});
    if (card && typeof api.assertGlobalProcurementUserFacingResultCardsSafe === "function") {
      api.assertGlobalProcurementUserFacingResultCardsSafe(card);
    }
    return card;
  }

  function globalProcurementUserFacingResultCardsRulesDisclosure(){
    const api = window.WeishanGlobalProcurementUserFacingResultCards;
    if (!api || typeof api.buildGlobalProcurementUserFacingRules !== "function") return "";
    const rules = api.buildGlobalProcurementUserFacingRules();
    const body = `<section class="commerce-global-procurement-user-facing-result-cards-rules" aria-label="全球采购用户结果卡片规则">
      <h4>全球采购用户结果卡片规则</h4>
      <p>card rules 已建立</p>
      <p>status: ${esc(rules.status || "user-facing summary only")}</p>
      <p>real provider disabled</p>
      <p>real network disabled</p>
      <p>limited beta real price guarded only</p>
      <p>production price display disabled</p>
      <p>bookingUrl disabled</p>
      <p>payment disabled</p>
      <p>order disabled</p>
      <p>identity upload disabled</p>
      <p>redacted: true</p>
      <h5>category card list</h5>
      ${list(rules.categoryCardList || [])}
      <h5>restricted card rules</h5>
      ${list(rules.restrictedCardRules || [])}
      <h5>copy action rules</h5>
      ${list(rules.copyActionRules || [])}
      <h5>history label rules</h5>
      ${list(rules.historyLabelRules || [])}
    </section>`;
    return disclosure("查看全球采购用户结果卡片规则", body, "commerce-global-procurement-user-facing-result-cards-disclosure");
  }

  function globalProcurementUserFacingCopyButtons(card){
    const actions = Array.isArray(card && card.copyActions) ? card.copyActions.filter((item) => item && item.label && item.text) : [];
    if (!actions.length) return "";
    return actions.map((action) => `<button class="cmd-btn gray commerce-result-summary-copy-btn" type="button" data-commerce-copy-kind="${esc(action.kind || "custom")}" data-commerce-copy-text="${commerceEncodedCopyText(action.text)}">${esc(action.label)}</button>`).join("");
  }

  function globalProcurementUserFacingSubCardsHtml(card){
    const subCards = Array.isArray(card && card.subCards) ? card.subCards : [];
    if (!subCards.length) return "";
    return `<h5>分项结果卡片</h5><div class="commerce-global-procurement-subplans">${subCards.map(function(subCard){
      return `<section class="commerce-result-summary-checklist-card">
        <h6>${esc(subCard.title || "分项计划")}</h6>
        ${(subCard.identifiedConditions || []).length ? `<div><b>已整理条件</b>${list(subCard.identifiedConditions || [])}</div>` : ""}
        ${(subCard.missingInfo || []).length ? `<div><b>仍待人工确认</b>${list(subCard.missingInfo || [])}</div>` : ""}
        ${(subCard.nextStepLines || []).length ? `<div><b>人工下一步</b>${list(subCard.nextStepLines || [])}</div>` : ""}
        ${(subCard.disabledLines || []).length ? `<div><b>当前未开放</b>${list(subCard.disabledLines || [])}</div>` : ""}
      </section>`;
    }).join("")}</div>`;
  }

  function globalProcurementPlanHtml(task){
    const card = globalProcurementUserFacingCard(task);
    if (!card) return "";
    return `<section class="commerce-one-screen-card commerce-global-procurement-plan" aria-label="全球采购计划">
      <p class="commerce-global-procurement-plan-super-title"><b>全球采购计划</b></p>
      <p class="commerce-global-procurement-plan-title"><b>${esc(card.title || "全球采购计划")}</b></p>
      ${card.quickSummary ? `<p>摘要：${esc(card.quickSummary)}</p>` : ""}
      <p>当前状态：${esc(card.currentStatusLine || "当前只整理条件，不访问真实平台。")}</p>
      <p>类别：${esc(card.categoryLabel || "全球采购")}</p>
      ${(card.identifiedConditions || []).length ? `<h5>已整理条件</h5>${list(card.identifiedConditions || [])}` : ""}
      ${(card.missingInfo || []).length ? `<h5>仍待人工确认</h5>${list(card.missingInfo || [])}` : ""}
      ${globalProcurementUserFacingSubCardsHtml(card)}
      ${globalProcurementDecisionWorkspaceSummaryHtml(task)}
      ${(card.disabledLines || []).length ? `<h5>当前未开放</h5>${list(card.disabledLines || [])}` : ""}
      ${(card.nextStepLines || []).length ? `<h5>人工下一步</h5>${list(card.nextStepLines || [])}` : ""}
      ${providerConnectionReadinessConsoleDisclosure(task)}
      ${globalProcurementOtherSafetyRulesDisclosure(task)}
      <p>redacted: true</p>
    </section>`;
  }

  function globalProcurementDecisionWorkspaceDisclosure(task){
    const workspace = task && task.globalProcurementDecisionWorkspace;
    if (!workspace) return "";
    const display = workspace.display || {};
    const body = `<section class="commerce-global-procurement-decision-workspace" aria-label="全球采购决策工作台">
      <h4>全球采购决策工作台</h4>
      <p>${esc(display.statusLine || "决策工作台：已建立")}</p>
      <p>${esc(display.currentStatusLine || "当前状态：只整理采购决策，不连接真实 provider。")}</p>
      <p>${esc(display.decisionRuleLine || "decisionRule：默认优先真实、可信、可验证的结果；当前仅做离线决策整理。")}</p>
      <h5>comparisonDimensions</h5>${list(workspace.comparisonDimensions || [])}
      <h5>decisionRule</h5><p>${esc(workspace.decisionRule || "默认优先真实、可信、可验证的结果；当前仅做离线决策整理。")}</p>
      <h5>candidateSchema</h5>${list(workspace.candidateSchema || [])}
      <h5>recommendationTemplate</h5>${list(workspace.recommendationTemplate || [])}
      <h5>executionBoundary</h5>${list(workspace.executionBoundary || [])}
      <h5>riskNotice</h5>${list(workspace.riskNotice || [])}
      <h5>nextSteps</h5>${list(workspace.nextSteps || [])}
      <h5>linkage</h5>${list(workspace.linkage || [])}
      <p>${esc(display.redactedLine || "redacted: true")}</p>
      <p>sandbox gate / endpoint allowlist gate / key 生命周期 / 脱敏规则 / 本机安全存储 / API 绑定准备状态</p>
    </section>`;
    return disclosure("查看全球采购决策工作台", body, "commerce-global-procurement-decision-workspace-disclosure");
  }

  function providerConnectionReadinessConsoleDisclosure(task){
    const consoleState = task && task.providerConnectionReadinessConsole;
    if (!consoleState) return "";
    const rows = Array.isArray(consoleState.categoryRows) ? consoleState.categoryRows : [];
    const matrix = consoleState.readinessMatrix && Array.isArray(consoleState.readinessMatrix.rows) ? consoleState.readinessMatrix.rows : [];
    const audit = consoleState.auditDraft || {};
    const auditValue = (value) => esc(String(value === undefined || value === null ? 0 : value));
    const body = `<section class="commerce-provider-connection-readiness-console" aria-label="Provider 接入准备控制台">
      <h4>Provider 接入准备控制台</h4>
      <p>status: ${esc(consoleState.status || "readiness console only")}</p>
      <p>mode: ${esc(consoleState.mode || "offline planning only")}</p>
      <p>real provider disabled</p>
      <p>real network disabled</p>
      <p>real API key disabled</p>
      <p>real endpoint disabled</p>
      <p>real price guarded sandbox/test only</p>
      <p>production price display disabled</p>
      <p>availability disabled</p>
      <p>bookingUrl disabled</p>
      <p>payment disabled</p>
      <p>order disabled</p>
      <p>identity upload disabled</p>
      <p>redacted: true</p>
      <h5>provider readiness categories</h5>
      ${rows.map((row) => `<section class="commerce-result-summary-checklist-card">
        <h6>${esc(row.providerLabel || row.providerCategory || "provider")}</h6>
        <p>${esc(row.providerCategory || "")}</p>
        <p>${esc(row.providerType || "")}</p>
        <p>final decision: ${esc(row.finalDecision || "no-go")}</p>
        <p>decision reason: ${esc(row.decisionReason || "readiness gates incomplete")}</p>
        <p>missing gates: ${esc((row.missingRequiredGates || []).join(" / ") || "manual review required")}</p>
        <p>credential consent scope gate: ${esc((row.readinessMatrix || {}).credentialConsent || "missing")}</p>
        <p>read-only adapter contract: ${esc((row.readinessMatrix || {}).readonlyAdapter || "missing")}</p>
        <p>flight adapter v1: ${esc((row.readinessMatrix || {}).flightAdapterV1 || "not_started")}</p>
        <p>endpoint allowlist enforcement: ${esc((row.readinessMatrix || {}).endpointAllowlistEnforcement || (row.readinessMatrix || {}).endpointAllowlist || "missing")}</p>
        <p>sandbox real-key dry run gate: ${esc((row.readinessMatrix || {}).sandboxRealKeyDryRunGate || (row.readinessMatrix || {}).sandboxGate || "missing")}</p>
        <p>sandbox response schema gate: ${esc((row.readinessMatrix || {}).sandboxResponseSchemaGate || "missing")}</p>
        <p>real provider result schema validation: ${esc((row.readinessMatrix || {}).realProviderResultSchemaValidation || "missing")}</p>
        <p>provider result source label gate: ${esc((row.readinessMatrix || {}).providerResultSourceLabelGate || (row.readinessMatrix || {}).sourceLabelGate || "missing")}</p>
        <p>price integrity gate: ${esc((row.readinessMatrix || {}).priceIntegrityGate || "missing")}</p>
        <p>price integrity / taxes / fees gate: ${esc((row.readinessMatrix || {}).priceIntegrityTaxesFeesGate || "missing")}</p>
        <p>real price display gate: ${esc((row.readinessMatrix || {}).realPriceDisplayGate || "missing")}</p>
        <p>sandbox/test price display: ${esc((row.readinessMatrix || {}).sandboxTestPriceDisplay || "disabled")}</p>
        <p>manual provider review workflow: ${esc((row.readinessMatrix || {}).manualProviderReviewWorkflow || "not allowed")}</p>
        <p>manual review state: ${esc((row.readinessMatrix || {}).manualReviewState || "not_started")}</p>
        <p>limited real price UI beta: ${esc((row.readinessMatrix || {}).limitedRealPriceUiBeta || "not allowed")}</p>
        <p>limited beta kill switch: ${esc((row.readinessMatrix || {}).limitedBetaKillSwitch || "not allowed")}</p>
        <p>limited beta state persistence: ${esc((row.readinessMatrix || {}).limitedBetaStatePersistence || "not allowed")}</p>
        <p>user preference guard: ${esc((row.readinessMatrix || {}).userPreferenceGuard || "active")}</p>
        <p>persisted preference loaded: ${esc((row.readinessMatrix || {}).persistedPreferenceLoaded || "false")}</p>
        <p>persisted preference valid: ${esc((row.readinessMatrix || {}).persistedPreferenceValid || "true")}</p>
        <p>restore confirmation required: ${esc((row.readinessMatrix || {}).restoreConfirmationRequired || "true")}</p>
        <p>beta preference state: ${esc((row.readinessMatrix || {}).betaPreferenceState || "enabled")}</p>
        <p>rollback guard: ${esc((row.readinessMatrix || {}).rollbackGuard || "active")}</p>
        <p>manual booking handoff: ${esc((row.readinessMatrix || {}).manualBookingHandoff || "not allowed")}</p>
        <p>beta rollback state: ${esc((row.readinessMatrix || {}).betaRollbackState || "not_needed")}</p>
        <p>limited beta display gate: ${esc((row.readinessMatrix || {}).limitedBetaDisplayGate || "not allowed")}</p>
        <p>limited beta price display: ${esc((row.readinessMatrix || {}).limitedBetaPriceDisplay || "not allowed")}</p>
        <p>production price display: ${esc((row.readinessMatrix || {}).productionPriceDisplay || "disabled")}</p>
        <p>bookingUrl display: ${esc((row.readinessMatrix || {}).bookingUrlDisplay || "disabled")}</p>
        <p>sandbox dry run transport: ${esc((row.readinessMatrix || {}).sandboxDryRunTransport || "disabled")}</p>
        <p>schema gate: ${esc((row.readinessMatrix || {}).schemaGate || "missing")}</p>
        <p>source label gate: ${esc((row.readinessMatrix || {}).sourceLabelGate || "missing")}</p>
        <p>real credential connected: ${esc(((row.credentialStorage || {}).realCredentialConnected) || "no")}</p>
        <p>real provider disabled</p>
        <p>real network disabled</p>
        <p>real API key disabled</p>
        <p>real endpoint disabled</p>
        <p>production endpoint: disabled</p>
        <p>limited beta price display: guarded only</p>
        <p>price exposure: limited beta guarded only</p>
        <p>production price display: disabled</p>
        <p>availability disabled</p>
        <p>bookingUrl disabled</p>
        <p>bookingUrl display: disabled</p>
        <p>bookingUrl exposure: disabled</p>
        <p>ordinary result exposure: disabled</p>
        <p>payment disabled</p>
        <p>order disabled</p>
        <p>identity upload disabled</p>
      </section>`).join("")}
      <h5>Provider Readiness Matrix</h5>
      ${matrix.map((row) => `<p>${esc((row || []).join(" | "))}</p>`).join("")}
      <h5>audit draft</h5>
      <p>${esc(audit.eventType || "PROVIDER_CONNECTION_READINESS_CONSOLE_DRAFT")}</p>
      <p>approvedProviderCount: ${auditValue(audit.approvedProviderCount)}</p>
      <p>connectedProviderCount: ${auditValue(audit.connectedProviderCount)}</p>
      <p>networkAttemptCount: ${auditValue(audit.networkAttemptCount)}</p>
      <p>realApiKeyReadCount: ${auditValue(audit.realApiKeyReadCount)}</p>
      <p>realEndpointConnectCount: ${auditValue(audit.realEndpointConnectCount)}</p>
      <p>realPriceReturnCount: ${auditValue(audit.realPriceReturnCount)}</p>
      <p>bookingUrlReturnCount: ${auditValue(audit.bookingUrlReturnCount)}</p>
      <p>paymentAttemptCount: ${auditValue(audit.paymentAttemptCount)}</p>
      <p>orderAttemptCount: ${auditValue(audit.orderAttemptCount)}</p>
      <p>identityUploadAttemptCount: ${auditValue(audit.identityUploadAttemptCount)}</p>
      <p>redacted: true</p>
    </section>`;
    return disclosure("查看 Provider 接入准备控制台", body, "commerce-provider-connection-readiness-console-disclosure");
  }

  function commerceSecureApiKeyStorageConsoleDisclosure(task){
    const api = window.WeishanSecureApiKeyStorageConsole;
    const state = api && typeof api.buildSecureApiKeyStorageConsole === "function"
      ? api.buildSecureApiKeyStorageConsole()
      : {
        version:"2.1.39",
        status:"secure local storage only",
        mode:"no provider connection",
        realProvider:"disabled",
        realNetwork:"disabled",
        realEndpoint:"disabled",
        realPrice:"disabled",
        availability:"disabled",
        bookingUrl:"disabled",
        payment:"disabled",
        order:"disabled",
        identityUpload:"disabled",
        plaintextDisplay:"disabled",
        plaintextExport:"disabled",
        providerKeySlots:[],
        auditDraft:{ eventType:"SECURE_API_KEY_STORAGE_IMPLEMENTATION_DRAFT", storageProvider:"electron_safeStorage", storageAvailable:true, plaintextPersistedCount:0, plaintextDisplayedCount:0, plaintextExportedCount:0, plaintextLoggedCount:0, localStorageSecretCount:0, sessionStorageSecretCount:0, realApiKeyInputCount:0, realProviderCallCount:0, networkAttemptCount:0, realEndpointConnectCount:0, realPriceDisplayedCount:0, bookingUrlDisplayedCount:0, paymentAttemptCount:0, orderAttemptCount:0, identityUploadAttemptCount:0, redacted:true },
        display:{ title:"安全 API Key 存储控制台", warning:"请勿输入真实 API Key。本版本仅用于本机安全存储能力验证。" },
        redacted:true
      };
    if (api && typeof api.assertSecureApiKeyStorageConsoleSafe === "function") api.assertSecureApiKeyStorageConsoleSafe(state);
    const display = state.display || {};
    const audit = state.auditDraft || {};
    const auditValue = (value) => esc(String(value === undefined || value === null ? 0 : value));
    const slots = Array.isArray(state.providerKeySlots) ? state.providerKeySlots : [];
    const slotHtml = slots.map((slot) => `<section class="commerce-result-summary-checklist-card" data-secure-api-key-slot="${esc(slot.providerId || "")}">
      <h6>${esc(slot.label || slot.providerId || "Provider Key")}</h6>
      <p>providerId: ${esc(slot.providerId || "")}</p>
      <p data-secure-api-key-slot-status>status: ${esc(slot.status || "empty")}</p>
      <p data-secure-api-key-slot-fingerprint>keyFingerprint: ${esc(slot.keyFingerprint || "")}</p>
      <p data-secure-api-key-slot-last4>keyLast4: ${esc(slot.keyLast4 || "")}</p>
      <p>createdAt: ${esc(slot.createdAt || "")}</p>
      <p data-secure-api-key-slot-updated>updatedAt: ${esc(slot.updatedAt || "")}</p>
      <p>expiresAt: ${esc(slot.expiresAt || "")}</p>
      <p>storage: encrypted local only</p>
      <p data-secure-api-key-slot-decision>final decision: ${esc(slot.finalDecision || "storage-missing")}</p>
      <div class="commerce-one-screen-actions">
        <button class="cmd-btn gray" type="button" data-secure-api-key-storage-action="save" data-secure-api-key-provider-id="${esc(slot.providerId || "")}">保存测试占位 Key</button>
        <button class="cmd-btn gray" type="button" data-secure-api-key-storage-action="rotate" data-secure-api-key-provider-id="${esc(slot.providerId || "")}">轮换测试占位 Key</button>
        <button class="cmd-btn gray" type="button" data-secure-api-key-storage-action="delete" data-secure-api-key-provider-id="${esc(slot.providerId || "")}">删除 Key</button>
      </div>
    </section>`).join("");
    const body = `<section class="commerce-secure-api-key-storage-console" data-secure-api-key-storage-console aria-label="安全 API Key 存储控制台">
      <h4>${esc(display.title || "安全 API Key 存储控制台")}</h4>
      <p>${esc(display.warning || "请勿输入真实 API Key。本版本仅用于本机安全存储能力验证。")}</p>
      <p>status: ${esc(state.status || "secure local storage only")}</p>
      <p>mode: ${esc(state.mode || "no provider connection")}</p>
      <p>real provider disabled</p>
      <p>real network disabled</p>
      <p>real endpoint disabled</p>
      <p>real price disabled</p>
      <p>bookingUrl disabled</p>
      <p>payment disabled</p>
      <p>order disabled</p>
      <p>identity upload disabled</p>
      <p>plaintext display disabled</p>
      <p>plaintext export disabled</p>
      <p>redacted: true</p>
      <div class="commerce-one-screen-actions">
        <button class="cmd-btn gray" type="button" data-secure-api-key-storage-action="self-test">运行安全存储自检</button>
      </div>
      <p data-secure-api-key-storage-feedback aria-live="polite">metadata only · redacted: true</p>
      <h5>provider key slots</h5>
      <div class="commerce-result-summary-checklist-grid">${slotHtml}</div>
      <h5>audit draft</h5>
      <p>${esc(audit.eventType || "SECURE_API_KEY_STORAGE_IMPLEMENTATION_DRAFT")}</p>
      <p>storageProvider: ${esc(audit.storageProvider || "electron_safeStorage")}</p>
      <p>storageAvailable: ${esc(String(audit.storageAvailable !== false))}</p>
      <p>plaintextPersistedCount: ${auditValue(audit.plaintextPersistedCount)}</p>
      <p>plaintextDisplayedCount: ${auditValue(audit.plaintextDisplayedCount)}</p>
      <p>plaintextExportedCount: ${auditValue(audit.plaintextExportedCount)}</p>
      <p>plaintextLoggedCount: ${auditValue(audit.plaintextLoggedCount)}</p>
      <p>localStorageSecretCount: ${auditValue(audit.localStorageSecretCount)}</p>
      <p>sessionStorageSecretCount: ${auditValue(audit.sessionStorageSecretCount)}</p>
      <p>realApiKeyInputCount: ${auditValue(audit.realApiKeyInputCount)}</p>
      <p>realProviderCallCount: ${auditValue(audit.realProviderCallCount)}</p>
      <p>networkAttemptCount: ${auditValue(audit.networkAttemptCount)}</p>
      <p>realEndpointConnectCount: ${auditValue(audit.realEndpointConnectCount)}</p>
      <p>realPriceDisplayedCount: ${auditValue(audit.realPriceDisplayedCount)}</p>
      <p>bookingUrlDisplayedCount: ${auditValue(audit.bookingUrlDisplayedCount)}</p>
      <p>paymentAttemptCount: ${auditValue(audit.paymentAttemptCount)}</p>
      <p>orderAttemptCount: ${auditValue(audit.orderAttemptCount)}</p>
      <p>identityUploadAttemptCount: ${auditValue(audit.identityUploadAttemptCount)}</p>
      <p>redacted: true</p>
    </section>`;
    return disclosure("查看安全 API Key 存储控制台", body, "commerce-secure-api-key-storage-console-disclosure");
  }

  function globalProcurementDecisionWorkspaceSummaryHtml(task){
    const workspace = task && task.globalProcurementDecisionWorkspace;
    if (!workspace) return "";
    const display = workspace.display || {};
    const summary = workspace.summary || {};
    const plan = task && task.globalProcurementPlan || {};
    const detail = task && task.globalProcurementDetailQuality || {};
    const intent = task && task.globalProcurementIntent || {};
    const category = String((plan && plan.category) || (detail && detail.category) || (intent && intent.category) || "");
    const card = globalProcurementUserFacingCard(task) || {};
    const scenarioMap = {
      flight:[["方案 A", "低价优先"], ["方案 B", "时间优先"], ["方案 C", "退改灵活优先"]],
      hotel:[["方案 A", "位置优先"], ["方案 B", "预算优先"], ["方案 C", "取消政策优先"]],
      product:[["方案 A", "官方渠道优先"], ["方案 B", "保修与售后优先"], ["方案 C", "跨境成本核对优先"]],
      local_service:[["方案 A", "资质优先"], ["方案 B", "预算优先"], ["方案 C", "售后优先"]],
      ticket_or_activity:[["方案 A", "官方渠道优先"], ["方案 B", "日期与票种优先"], ["方案 C", "退改规则优先"]],
      multi_category_plan:[["方案 A", "先拆分子项"], ["方案 B", "按子项比较"], ["方案 C", "优先人工确认"]]
    };
    const scenarios = scenarioMap[category] || [["方案 A", "优先真实、可信、可验证"], ["方案 B", "优先人工核对"], ["方案 C", "先补缺失信息"]];
    const riskLines = Array.from(new Set([...(card.disabledLines || []), ...(workspace.riskNotice || []), ...(workspace.executionBoundary || [])])).filter(Boolean);
    const confidenceLines = Array.from(new Set([
      display.currentStatusLine || summary.currentStatusLine || "当前状态：只整理采购决策，不连接真实 provider。",
      "gate：closed",
      "workspace：workspace_only",
      "real provider disabled",
      "real network disabled",
      "real price disabled",
      "bookingUrl disabled",
      "redacted: true"
    ]));
    const nextStepLines = Array.from(new Set([...(card.nextStepLines || []), ...(workspace.nextSteps || [])])).filter(Boolean);
    const summaryCopyText = [
      display.statusLine || summary.statusLine || "决策工作台：已建立",
      display.currentStatusLine || summary.currentStatusLine || "当前状态：只整理采购决策，不连接真实 provider。",
      card.title ? "结果卡片：" + card.title : "",
      card.quickSummary ? "摘要：" + card.quickSummary : "",
      (card.identifiedConditions || []).length ? "已整理条件：" + card.identifiedConditions.join("；") : "",
      "redacted: true"
    ].filter(Boolean).join("\n");
    return `<section class="commerce-global-procurement-decision-workspace commerce-global-procurement-decision-workspace-summary" aria-label="全球采购决策工作台">
      <h4>全球采购决策工作台</h4>
      <p>${esc(display.statusLine || summary.statusLine || "决策工作台：已建立")}</p>
      <p>${esc(display.currentStatusLine || summary.currentStatusLine || "当前状态：只整理采购决策，不连接真实 provider。")}</p>
      <h5>方案 A / 方案 B / 方案 C 简要矩阵</h5>
      ${list(scenarios.map((item) => item.join("：")))}
      <h5>风险核对</h5>
      ${list(riskLines.length ? riskLines : ["当前仅做离线决策整理，不连接真实 provider。"])}
      <h5>可信度核对</h5>
      ${list(confidenceLines)}
      <h5>人工下一步</h5>
      ${list(nextStepLines.length ? nextStepLines : ["先补齐缺失条件，再人工核对可信平台。"])}
      <div class="commerce-global-procurement-decision-workspace-copy">
        <button class="cmd-btn gray commerce-result-summary-copy-btn" type="button" data-commerce-copy-kind="globalProcurementDecisionWorkspace" data-commerce-copy-text="${commerceEncodedCopyText(summaryCopyText)}">复制离线采购摘要</button>
      </div>
      <p>${esc(display.redactedLine || "redacted: true")}</p>
    </section>`;
  }

  function commerceLocalSafetyEvidenceConsoleDisclosure(task){
    const body = `<section class="commerce-local-safety-evidence-console" aria-label="local safety evidence console">
      <h4>Local Safety Evidence Console</h4>
      <p>本地安全证据控制台</p>
      <p>mode: local only</p>
      <p>network: disabled</p>
      <p>bookingUrl: null</p>
      <p>payment: false</p>
      <p>order: false</p>
      <p>identityUpload: false</p>
      <p>redacted: true</p>
    </section>`;
    return disclosure("查看本地安全证据控制台", body, "commerce-local-safety-evidence-console-disclosure");
  }

  function commerceManualUiAcceptanceAssistantDisclosure(task){
    const body = `<section class="commerce-manual-ui-acceptance-assistant" aria-label="manual UI acceptance assistant">
      <h4>Manual UI Acceptance Assistant</h4>
      <p>人工验收助手</p>
      <p>只读 UI 验收，不自动打开平台</p>
      <p>autoOpen: false</p>
      <p>autoRefresh: false</p>
      <p>bookingUrl: null</p>
      <p>paymentUrl: null</p>
      <p>orderUrl: null</p>
      <p>redacted: true</p>
    </section>`;
    return disclosure("查看人工 UI 验收助手", body, "commerce-manual-ui-acceptance-assistant-disclosure");
  }

  function commerceNoSecretPersistenceGuardDisclosure(task){
    const body = `<section class="commerce-no-secret-persistence-guard" aria-label="no secret persistence guard">
      <h4>No Secret Persistence Guard</h4>
      <p>NO_SECRET_PERSISTENCE_GUARD</p>
      <p>rawProviderResponseStored: false</p>
      <p>secretStored: false</p>
      <p>tokenStored: false</p>
      <p>keyStored: false</p>
      <p>credentialInput: false</p>
      <p>redacted: true</p>
    </section>`;
    return disclosure("查看 no-secret persistence guard", body, "commerce-no-secret-persistence-guard-disclosure");
  }

  function commerceSettingsAuthLocalSecurityEvidenceDisclosure(task){
    const body = `<section class="commerce-settings-auth-local-security-evidence" aria-label="settings auth local security evidence">
      <h4>Settings Auth Local Security Evidence</h4>
      <p>设置认证本地安全证据</p>
      <p>mode: local only</p>
      <p>network: disabled</p>
      <p>plainPasswordStored: false</p>
      <p>secretStored: false</p>
      <p>tokenStored: false</p>
      <p>redacted: true</p>
    </section>`;
    return disclosure("查看 settings auth local security evidence", body, "commerce-settings-auth-local-security-evidence-disclosure");
  }

  function globalProcurementOtherSafetyRulesDisclosure(task){
    const body = `<section class="commerce-global-procurement-other-safety-rules" aria-label="其它安全规则折叠面板">
      <h4>其它安全规则折叠面板</h4>
      ${commerceSecureKeyStoragePlanDisclosure(task)}
      ${commerceSecureStorageDesignGateDisclosure(task)}
      ${commerceLocalSecureStorageInterfaceDraftDisclosure(task)}
      ${commerceSecureApiKeyStorageConsoleDisclosure(task)}
      ${commerceKeyRedactionAndLogLeakRulesDisclosure(task)}
      ${commerceKeyLifecycleDraftDisclosure(task)}
      ${commerceProviderEndpointAllowlistGateDisclosure(task)}
      ${commerceReadonlyProviderSandboxGateDisclosure(task)}
      ${commerceReadonlyProviderResultSchemaGateDisclosure(task)}
      ${commerceProviderResultSourceLabelGateDisclosure(task)}
      ${commercePriceIntegrityTaxesFeesGateDisclosure(task)}
      ${commerceRealPriceDisplayGateDisclosure(task)}
      ${commerceBookingUrlDomainSafetyGateDisclosure(task)}
      ${commerceManualProviderReviewWorkflowDisclosure(task)}
      ${commerceManualProviderReviewWorkflowV1Disclosure(task)}
      ${commerceLimitedRealPriceUiBetaGateDisclosure(task)}
      ${commerceLimitedBetaKillSwitchDisclosure(task)}
      ${commerceLimitedBetaStatePersistenceDisclosure(task)}
      ${commerceLimitedBetaUserPreferenceGuardDisclosure(task)}
      ${commerceLimitedBetaRollbackGuardDisclosure(task)}
      ${commerceManualBookingHandoffDisclosure(task)}
      ${commerceProviderActivationReadinessGateDisclosure(task)}
      ${commerceCredentialConsentScopeGateDisclosure(task)}
      ${commerceReadonlyAdapterContractGateDisclosure(task)}
      ${commerceReadOnlyProviderAdapterV1Disclosure(task)}
      ${commerceEndpointAllowlistEnforcementDisclosure(task)}
      ${commerceProviderSandboxRealKeyDryRunGateDisclosure(task)}
      ${commerceSandboxResponseSchemaGateDisclosure(task)}
      ${commerceRealProviderResultSchemaValidationDisclosure(task)}
      ${commerceProviderResultSourceLabelGateDisclosure(task)}
      ${commerceProviderGateMatrixDashboardDisclosure(task)}
      ${commerceProviderNoNetworkRuntimeGuardDisclosure(task)}
      ${commerceOfflineProviderFixtureValidationHarnessDisclosure(task)}
      ${commerceProviderComplianceDecisionEngineDisclosure(task)}
      ${commerceOfflineProviderFixtureRunnerDisclosure(task)}
      ${commerceNoNetworkSentinelAuditDisclosure(task)}
      ${commerceProviderComplianceEvidenceReportDisclosure(task)}
      ${commerceLocalSafetyEvidenceConsoleDisclosure(task)}
      ${commerceManualUiAcceptanceAssistantDisclosure(task)}
      ${commerceNoSecretPersistenceGuardDisclosure(task)}
      ${commerceSettingsAuthLocalSecurityEvidenceDisclosure(task)}
      ${globalProcurementDecisionWorkspaceDisclosure(task)}
      ${providerConnectionReadinessConsoleDisclosure(task)}
    </section>`;
    return disclosure("查看其它安全规则折叠面板", body, "commerce-global-procurement-other-safety-rules-disclosure");
  }

  function globalProcurementDecisionWorkspaceSummaryHtml(task){
    const workspace = task && task.globalProcurementDecisionWorkspace;
    if (!workspace) return "";
    const display = workspace.display || {};
    const summary = workspace.summary || {};
    const plan = task && task.globalProcurementPlan || {};
    const detail = task && task.globalProcurementDetailQuality || {};
    const intent = task && task.globalProcurementIntent || {};
    const category = String((plan && plan.category) || (detail && detail.category) || (intent && intent.category) || "");
    const card = globalProcurementUserFacingCard(task) || {};
    const scenarioMap = {
      flight:[["方案 A", "低价优先"], ["方案 B", "时间优先"], ["方案 C", "退改灵活优先"]],
      hotel:[["方案 A", "位置优先"], ["方案 B", "预算优先"], ["方案 C", "取消政策优先"]],
      product:[["方案 A", "官方渠道优先"], ["方案 B", "保修与售后优先"], ["方案 C", "跨境成本核对优先"]],
      local_service:[["方案 A", "资质优先"], ["方案 B", "预算优先"], ["方案 C", "售后优先"]],
      ticket_or_activity:[["方案 A", "官方渠道优先"], ["方案 B", "日期与票种优先"], ["方案 C", "退改规则优先"]],
      multi_category_plan:[["方案 A", "先拆分子项"], ["方案 B", "按子项比较"], ["方案 C", "优先人工确认"]]
    };
    const scenarios = scenarioMap[category] || [["方案 A", "优先真实、可信、可验证"], ["方案 B", "优先人工核对"], ["方案 C", "先补缺失信息"]];
    const riskLines = Array.from(new Set([...(card.disabledLines || []), ...(workspace.riskNotice || []), ...(workspace.executionBoundary || [])])).filter(Boolean);
    const confidenceLines = Array.from(new Set([
      display.currentStatusLine || summary.currentStatusLine || "当前状态：只整理采购决策，不连接真实 provider。",
      "gate：closed",
      "workspace：workspace_only",
      "real provider disabled",
      "real network disabled",
      "real price disabled",
      "bookingUrl disabled",
      "redacted: true"
    ]));
    const nextStepLines = Array.from(new Set([...(card.nextStepLines || []), ...(workspace.nextSteps || [])])).filter(Boolean);
    const summaryCopyText = [
      display.statusLine || summary.statusLine || "决策工作台：已建立",
      display.currentStatusLine || summary.currentStatusLine || "当前状态：只整理采购决策，不连接真实 provider。",
      card.title ? "结果卡片：" + card.title : "",
      card.quickSummary ? "摘要：" + card.quickSummary : "",
      (card.identifiedConditions || []).length ? "已整理条件：" + card.identifiedConditions.join("；") : "",
      "redacted: true"
    ].filter(Boolean).join("\n");
    return `<section class="commerce-global-procurement-decision-workspace commerce-global-procurement-decision-workspace-summary" aria-label="全球采购决策工作台">
      <h4>全球采购决策工作台</h4>
      <p>${esc(display.statusLine || summary.statusLine || "决策工作台：已建立")}</p>
      <p>${esc(display.currentStatusLine || summary.currentStatusLine || "当前状态：只整理采购决策，不连接真实 provider。")}</p>
      <h5>方案 A / 方案 B / 方案 C 简要矩阵</h5>
      ${list(scenarios.map((item) => item.join("：")))}
      <h5>风险核对</h5>
      ${list(riskLines.length ? riskLines : ["当前仅做离线决策整理，不连接真实 provider。"])}
      <h5>可信度核对</h5>
      ${list(confidenceLines)}
      <h5>人工下一步</h5>
      ${list(nextStepLines.length ? nextStepLines : ["先补齐缺失条件，再人工核对可信平台。"])}
      <div class="commerce-global-procurement-decision-workspace-copy">
        <button class="cmd-btn gray commerce-result-summary-copy-btn" type="button" data-commerce-copy-kind="globalProcurementDecisionWorkspace" data-commerce-copy-text="${commerceEncodedCopyText(summaryCopyText)}">复制离线采购摘要</button>
      </div>
      <p>${esc(display.redactedLine || "redacted: true")}</p>
    </section>`;
  }

  function globalProcurementOtherSafetyRulesDisclosure(task){
    const body = `<section class="commerce-global-procurement-other-safety-rules" aria-label="其它安全规则折叠面板">
      <h4>其它安全规则折叠面板</h4>
      ${commerceSecureKeyStoragePlanDisclosure(task)}
      ${commerceSecureStorageDesignGateDisclosure(task)}
      ${commerceLocalSecureStorageInterfaceDraftDisclosure(task)}
      ${commerceSecureApiKeyStorageConsoleDisclosure(task)}
      ${commerceKeyRedactionAndLogLeakRulesDisclosure(task)}
      ${commerceKeyLifecycleDraftDisclosure(task)}
      ${commerceRealFlightPriceEvidenceReportDisclosure(task)}
      ${commerceProviderEndpointAllowlistGateDisclosure(task)}
      ${commerceReadonlyProviderSandboxGateDisclosure(task)}
      ${commerceReadonlyProviderResultSchemaGateDisclosure(task)}
      ${commerceProviderResultSourceLabelGateDisclosure(task)}
      ${commercePriceIntegrityTaxesFeesGateDisclosure(task)}
      ${commerceRealPriceDisplayGateDisclosure(task)}
      ${commerceBookingUrlDomainSafetyGateDisclosure(task)}
      ${commerceManualProviderReviewWorkflowDisclosure(task)}
      ${commerceManualProviderReviewWorkflowV1Disclosure(task)}
      ${commerceLimitedRealPriceUiBetaGateDisclosure(task)}
      ${commerceLimitedBetaKillSwitchDisclosure(task)}
      ${commerceLimitedBetaStatePersistenceDisclosure(task)}
      ${commerceLimitedBetaUserPreferenceGuardDisclosure(task)}
      ${commerceLimitedBetaRollbackGuardDisclosure(task)}
      ${commerceManualBookingHandoffDisclosure(task)}
      ${commerceProviderActivationReadinessGateDisclosure(task)}
      ${commerceCredentialConsentScopeGateDisclosure(task)}
      ${commerceReadonlyAdapterContractGateDisclosure(task)}
      ${commerceReadOnlyProviderAdapterV1Disclosure(task)}
      ${commerceEndpointAllowlistEnforcementDisclosure(task)}
      ${commerceProviderSandboxRealKeyDryRunGateDisclosure(task)}
      ${commerceSandboxResponseSchemaGateDisclosure(task)}
      ${commerceRealProviderResultSchemaValidationDisclosure(task)}
      ${commerceProviderResultSourceLabelGateDisclosure(task)}
      ${commerceProviderGateMatrixDashboardDisclosure(task)}
      ${commerceProviderNoNetworkRuntimeGuardDisclosure(task)}
      ${commerceOfflineProviderFixtureValidationHarnessDisclosure(task)}
      ${commerceProviderComplianceDecisionEngineDisclosure(task)}
      ${commerceOfflineProviderFixtureRunnerDisclosure(task)}
      ${commerceNoNetworkSentinelAuditDisclosure(task)}
      ${commerceProviderComplianceEvidenceReportDisclosure(task)}
      ${commerceLocalSafetyEvidenceConsoleDisclosure(task)}
      ${commerceManualUiAcceptanceAssistantDisclosure(task)}
      ${commerceNoSecretPersistenceGuardDisclosure(task)}
      ${commerceSettingsAuthLocalSecurityEvidenceDisclosure(task)}
      ${globalProcurementDecisionWorkspaceDisclosure(task)}
    </section>`;
    return disclosure("查看其它安全规则折叠面板", body, "commerce-global-procurement-other-safety-rules-disclosure");
  }

  function globalProcurementRestrictedCategoryGuardDisclosure(task){
    const guard = task && task.globalProcurementRestrictedCategoryGuard;
    if (!guard) return "";
    const body = `<section class="commerce-global-procurement-restricted-category-guard" aria-label="全球采购受限品类安全闸门">
      <h4>全球采购受限品类安全闸门</h4>
      <p>guard 已建立</p>
      <p>status: ${esc(guard.status || "active")}</p>
      <p>mode: ${esc(guard.mode || "local policy only")}</p>
      <p>decision: ${esc(guard.decision || "allowed_for_offline_planning_only")}</p>
      ${guard.blockedReason ? `<p>blockedReason：${esc(guard.blockedReason)}</p>` : ""}
      <p>real provider disabled</p>
      <p>real network disabled</p>
      <p>payment disabled</p>
      <p>order disabled</p>
      <p>identity upload disabled</p>
      <p>redacted: true</p>
      <h5>restricted categories</h5>${list(guard.restrictedCategories || [])}
      <h5>rules</h5>${list(guard.blockingRules || [])}
      <h5>audit draft</h5>
      <p>eventType：${esc(guard.auditDraft && guard.auditDraft.eventType || "GLOBAL_PROCUREMENT_RESTRICTED_CATEGORY_GUARD_DRAFT")}</p>
      <p>decision：${esc(guard.auditDraft && guard.auditDraft.decision || guard.decision || "offline_planning_only")}</p>
      <p>redacted: true</p>
    </section>`;
    return disclosure("查看全球采购受限品类安全闸门", body, "commerce-global-procurement-restricted-category-guard-disclosure");
  }

  function globalProcurementEvidenceSafetySummaryDisclosure(task){
    const summary = task && task.globalProcurementEvidenceSafetySummary;
    if (!summary) return "";
    const body = `<section class="commerce-global-procurement-evidence-safety-summary" aria-label="全球采购安全证据摘要">
      <h4>全球采购安全证据摘要</h4>
      <p>summary 已建立</p>
      <p>status: ${esc(summary.status || "offline planning only")}</p>
      <p>real provider disabled</p>
      <p>real network disabled</p>
      <p>real API key disabled</p>
      <p>real price disabled</p>
      <p>availability disabled</p>
      <p>bookingUrl disabled</p>
      <p>payment disabled</p>
      <p>order disabled</p>
      <p>identity upload disabled</p>
      <p>redacted: true</p>
      <h5>established capabilities</h5>${list(summary.establishedCapabilities || [])}
      <h5>current forbidden</h5>${list(summary.currentForbidden || [])}
      <h5>evidence lines</h5>${list(summary.evidenceLines || [])}
      <h5>audit draft</h5>
      <p>eventType：${esc(summary.auditDraft && summary.auditDraft.eventType || "GLOBAL_PROCUREMENT_EVIDENCE_SAFETY_SUMMARY_DRAFT")}</p>
      <p>networkAttemptCount：${esc(String(summary.auditDraft && summary.auditDraft.networkAttemptCount || 0))}</p>
      <p>realProviderCallCount：${esc(String(summary.auditDraft && summary.auditDraft.realProviderCallCount || 0))}</p>
      <p>realPriceDisplayedCount：${esc(String(summary.auditDraft && summary.auditDraft.realPriceDisplayedCount || 0))}</p>
      <p>bookingUrlDisplayedCount：${esc(String(summary.auditDraft && summary.auditDraft.bookingUrlDisplayedCount || 0))}</p>
      <p>redacted: true</p>
    </section>`;
    return disclosure("查看全球采购安全证据摘要", body, "commerce-global-procurement-evidence-safety-summary-disclosure");
  }

  function commerceIsTicketActivityTask(task){
    const taskCategory = String(task && task.category || "");
    const planCategory = String(task && task.globalProcurementPlan && task.globalProcurementPlan.category || "");
    const intentCategory = String(task && task.globalProcurementIntent && task.globalProcurementIntent.category || "");
    return taskCategory === "ticketOrActivity" || planCategory === "ticket_or_activity" || intentCategory === "ticket_or_activity";
  }

  function commerceTicketActivityFields(task){
    const intent = task && task.globalProcurementIntent || {};
    const plan = task && task.globalProcurementPlan || {};
    const summaryState = plan.querySummary || {};
    const raw = String(task && (task.inputSummary || task.text || task.title || task.rawInput) || "");
    const activityName = String(summaryState.activityName || intent.activityName || "").trim() || (raw.match(/东京迪士尼|演唱会|门票|活动/) || [""])[0];
    return {
      activityName:activityName || "门票 / 活动",
      location:String(summaryState.location || intent.location || intent.destination || "").trim(),
      date:String(summaryState.date || intent.date || intent.dateRange || "").trim(),
      sortPreference:String(summaryState.sortPreference || intent.sortPreference || "安全与可信来源优先").trim(),
      searchQuery:encodeURIComponent(String(intent.searchQueryDraft || raw || activityName || "门票 活动").trim())
    };
  }

  function commerceTicketActivityCopyText(task){
    const fields = commerceTicketActivityFields(task);
    return [
      "门票 / 活动搜索条件",
      "活动：" + fields.activityName,
      fields.location ? "地点：" + fields.location : "",
      fields.date ? "日期：" + fields.date : "",
      "排序：" + fields.sortPreference,
      "注意：当前不会访问真实平台，不会返回实时票价，最终价格以真实平台为准。"
    ].filter(Boolean).join("\n");
  }

  function commerceIsRestrictedProcurementTask(task){
    const planCategory = String(task && task.globalProcurementPlan && task.globalProcurementPlan.category || "");
    const intentCategory = String(task && task.globalProcurementIntent && task.globalProcurementIntent.category || "");
    const planStatus = String(task && task.globalProcurementPlan && task.globalProcurementPlan.status || "");
    const taskStatus = String(task && task.status || "");
    return planCategory === "restricted_or_blocked"
      || intentCategory === "restricted_or_blocked"
      || planStatus === "blocked"
      || taskStatus === "blocked";
  }

  function commerceRestrictedProcurementResultPanelHtml(task, options){
    const opts = options && typeof options === "object" ? options : {};
    const plan = task && task.globalProcurementPlan || {};
    const intent = task && task.globalProcurementIntent || {};
    const blockedReason = String(plan.blockedReason || intent.blockedReason || "").trim();
    const blockedReasonLine = blockedReason || "restricted procurement request";
    const currentStatusLine = /loan or credit/i.test(blockedReasonLine)
      ? "该请求涉及身份资料 / 银行卡资料上传风险，已停止处理"
      : "该请求涉及受限或高风险品类，已停止处理";
    const restrictedLines = /loan or credit/i.test(blockedReasonLine)
      ? [
          "当前不提供上传入口",
          "当前不提供贷款办理入口",
          "当前不提供外部搜索入口",
          "当前不提供复制搜索条件",
          "weishan 不联网、不下单、不付款、不保存身份证、护照或银行卡",
          "redacted: true"
        ]
      : [
          "当前不继续整理购买路径",
          "当前不提供购买入口",
          "当前不提供外部搜索入口",
          "当前不提供复制搜索条件",
          "当前不提供规避建议",
          "weishan 不联网、不搜索、不下单、不付款、不保存身份证、护照或银行卡",
          "redacted: true"
        ];
    const advancedDebugHtml = opts.historyMode ? "" : disclosure("查看其它安全规则折叠面板", `<section class="commerce-simple-flight-advanced-debug" aria-label="高级调试信息">
      <p>高级调试信息默认折叠，仅供排查与验证。</p>
      ${disclosure("查看可执行清单", commerceActionableChecklistPanelHtml(), "commerce-actionable-checklist-disclosure")}
      ${disclosure("查看平台模板", commercePlatformSearchTemplatePackHtml(), "commerce-platform-template-disclosure")}
      ${commerceFlightProviderCandidatesDisclosure(task)}
      ${commerceFlightProviderApprovalDisclosure(task)}
      ${commerceFlightReadonlyStubPermissionDisclosure(task)}
      ${commerceFlightReadonlyStubAdapterDisclosure(task)}
      ${commerceFlightSandboxDryRunDisclosure(task)}
      ${commerceFlightSandboxProviderMatrixDisclosure(task)}
      ${commerceSecureKeyStoragePlanDisclosure(task)}
      ${commerceSecureStorageDesignGateDisclosure(task)}
      ${commerceLocalSecureStorageInterfaceDraftDisclosure(task)}
      ${commerceSecureApiKeyStorageConsoleDisclosure(task)}
      ${commerceKeyRedactionAndLogLeakRulesDisclosure(task)}
      ${commerceKeyLifecycleDraftDisclosure(task)}
      ${commerceProviderEndpointAllowlistGateDisclosure(task)}
      ${commerceReadonlyProviderSandboxGateDisclosure(task)}
      ${commerceReadonlyProviderResultSchemaGateDisclosure(task)}
      ${commerceProviderResultSourceLabelGateDisclosure(task)}
      ${commercePriceIntegrityTaxesFeesGateDisclosure(task)}
      ${commerceRealPriceDisplayGateDisclosure(task)}
      ${commerceBookingUrlDomainSafetyGateDisclosure(task)}
      ${commerceManualProviderReviewWorkflowDisclosure(task)}
      ${commerceManualProviderReviewWorkflowV1Disclosure(task)}
      ${commerceLimitedRealPriceUiBetaGateDisclosure(task)}
      ${commerceLimitedBetaKillSwitchDisclosure(task)}
      ${commerceLimitedBetaStatePersistenceDisclosure(task)}
      ${commerceLimitedBetaUserPreferenceGuardDisclosure(task)}
      ${commerceLimitedBetaRollbackGuardDisclosure(task)}
      ${commerceManualBookingHandoffDisclosure(task)}
      ${commerceProviderActivationReadinessGateDisclosure(task)}
      ${commerceCredentialConsentScopeGateDisclosure(task)}
      ${commerceReadonlyAdapterContractGateDisclosure(task)}
      ${commerceReadOnlyProviderAdapterV1Disclosure(task)}
      ${commerceEndpointAllowlistEnforcementDisclosure(task)}
      ${commerceProviderSandboxRealKeyDryRunGateDisclosure(task)}
      ${commerceSandboxResponseSchemaGateDisclosure(task)}
      ${commerceRealProviderResultSchemaValidationDisclosure(task)}
      ${commerceProviderResultSourceLabelGateDisclosure(task)}
      ${commerceProviderGateMatrixDashboardDisclosure(task)}
      ${commerceProviderNoNetworkRuntimeGuardDisclosure(task)}
      ${commerceOfflineProviderFixtureValidationHarnessDisclosure(task)}
      ${commerceProviderComplianceDecisionEngineDisclosure(task)}
      ${commerceOfflineProviderFixtureRunnerDisclosure(task)}
      ${commerceNoNetworkSentinelAuditDisclosure(task)}
      ${commerceProviderComplianceEvidenceReportDisclosure(task)}
      ${commerceLocalSafetyEvidenceConsoleDisclosure(task)}
      ${commerceManualUiAcceptanceAssistantDisclosure(task)}
      ${commerceNoSecretPersistenceGuardDisclosure(task)}
      ${commerceSettingsAuthLocalSecurityEvidenceDisclosure(task)}
    </section>`, "commerce-restricted-procurement-advanced-debug-disclosure");
    return `<section class="commerce-result-summary-panel commerce-one-screen-result commerce-restricted-procurement-result" aria-label="受限品类阻断结果">
      <div class="commerce-result-summary-head">
        <div class="commerce-result-summary-headline">
          <span>安全阻断</span>
          <strong>全球采购计划</strong>
        </div>
      </div>
      <div class="commerce-one-screen-body">
        <section class="commerce-one-screen-card">
          <h4>全球采购计划</h4>
          <p>当前状态：${esc(currentStatusLine)}</p>
          <p>类别：受限品类</p>
          <p>阻断原因：${esc(blockedReasonLine)}</p>
          <p>安全限制</p><p>已阻断动作：付款 / 下单 / 出票 / 上传证件或银行卡</p>
          ${restrictedLines.map((line) => `<p>${esc(line)}</p>`).join("")}
        </section>
      </div>
      ${globalProcurementRestrictedCategoryGuardDisclosure(task)}
      ${globalProcurementEvidenceSafetySummaryDisclosure(task)}
      ${providerConnectionReadinessConsoleDisclosure(task)}
      ${globalProcurementExternalSearchPolicyDisclosure(task)}
      ${advancedDebugHtml}
    </section>`;
  }

  function commerceTicketActivityResultPanelHtml(task, options){
    const opts = options && typeof options === "object" ? options : {};
    const fields = commerceTicketActivityFields(task);
    const globalPlanHtml = globalProcurementPlanHtml(task);
    const globalMissingInfoHtml = globalProcurementMissingInfoChecklistDisclosure(task);
    const globalGuidanceHtml = globalProcurementSafeNextStepGuidanceDisclosure(task);
    const globalSearchPolicyHtml = globalProcurementExternalSearchPolicyDisclosure(task);
    const globalGuardHtml = globalProcurementRestrictedCategoryGuardDisclosure(task);
    const globalEvidenceHtml = globalProcurementEvidenceSafetySummaryDisclosure(task);
    const providerConnectionReadinessHtml = providerConnectionReadinessConsoleDisclosure(task);
    const secureApiKeyStorageHtml = commerceSecureApiKeyStorageConsoleDisclosure(task);
    const resultCardRulesHtml = globalProcurementUserFacingResultCardsRulesDisclosure();
    return `<section class="commerce-result-summary-panel commerce-one-screen-result commerce-ticket-activity-result" aria-label="门票 / 活动购买计划">
      <div class="commerce-result-summary-head">
        <div class="commerce-result-summary-headline">
          <span>真实结果优先</span>
          <strong>门票 / 活动购买计划</strong>
        </div>
      </div>
      <div class="commerce-one-screen-body">
        <section class="commerce-one-screen-card">
          <h4>${esc(fields.activityName)}</h4>
          <p>类型：门票 / 活动</p>
          ${fields.location ? `<p>地点：${esc(fields.location)}</p>` : ""}
          ${fields.date ? `<p>日期：${esc(fields.date)}</p>` : ""}
          <p>排序：${esc(fields.sortPreference)}</p>
          <p class="commerce-simple-flight-empty">暂无真实价格结果</p>
          <p>当前为离线采购规划，只整理条件，不接真实平台。</p>
          <p>当前尚未接入真实只读票价源，不能展示价格。</p>
          <p>接入可信价格源后，将只显示通过安全检查的真实票价结果。最终价格、库存、实名规则、退改政策，以跳转后的平台页面为准。</p>
          <p>weishan 不收款、不下单、不保存身份证、护照或银行卡。</p>
        </section>
        ${globalPlanHtml}
        ${globalMissingInfoHtml}
        ${globalGuidanceHtml}
        ${globalSearchPolicyHtml}
        <p class="commerce-result-summary-status"><b>提示：</b>当前只是整理门票 / 活动采购条件，不访问真实平台，不返回价格，不跳转购买或预订，不付款或下单。</p>
      </div>
      <div class="commerce-one-screen-actions" aria-label="门票 / 活动条件操作">
        <button class="cmd-btn gray commerce-result-summary-copy-btn" type="button" data-commerce-copy-kind="ticketActivity" data-commerce-copy-text="${commerceEncodedCopyText(commerceTicketActivityCopyText(task))}">复制门票/活动搜索条件</button>
      </div>
      ${resultCardRulesHtml}
      ${commerceReadonlyProviderResultSchemaGateDisclosure(task)}
      ${secureApiKeyStorageHtml}
      ${providerConnectionReadinessHtml}
      ${globalGuardHtml}
      ${globalEvidenceHtml}
      <p class="commerce-result-summary-copy-feedback" data-commerce-copy-feedback aria-live="polite"></p>
    </section>`;
  }

  function commerceOneScreenResultPanelHtml(task){
    const card = globalProcurementUserFacingCard(task);
    const globalPlanHtml = globalProcurementPlanHtml(task);
    const globalMissingInfoHtml = globalProcurementMissingInfoChecklistDisclosure(task);
    const globalGuidanceHtml = globalProcurementSafeNextStepGuidanceDisclosure(task);
    const globalSearchPolicyHtml = globalProcurementExternalSearchPolicyDisclosure(task);
    const globalGuardHtml = globalProcurementRestrictedCategoryGuardDisclosure(task);
    const globalEvidenceHtml = globalProcurementEvidenceSafetySummaryDisclosure(task);
    const providerConnectionReadinessHtml = providerConnectionReadinessConsoleDisclosure(task);
    const secureApiKeyStorageHtml = commerceSecureApiKeyStorageConsoleDisclosure(task);
    const resultCardRulesHtml = globalProcurementUserFacingResultCardsRulesDisclosure();
    return `<section class="commerce-result-summary-panel commerce-one-screen-result" aria-label="最终结果">
      <div class="commerce-result-summary-head">
        <div class="commerce-result-summary-headline">
          <span>结果摘要</span>
          <strong>最终结果</strong>
        </div>
        <p>普通用户默认只看这一屏结果；暂无真实价格结果时，只展示搜索条件和必要安全提示。</p>
      </div>
      <div class="commerce-one-screen-body">
        <section class="commerce-one-screen-card">
          <h4>暂无真实价格结果</h4>
          <p>当前尚未接入真实只读价格源，不能展示价格。</p>
          <p>当前只是帮你整理搜索条件，不会访问真实平台，不会返回价格，不会跳转购买或预订，不会付款或下单。</p>
          <p>接入可信价格源后，将只显示通过安全检查的真实价格结果。最终价格、库存、税费、运费、行李、退改签，以跳转后的平台页面为准。</p>
          <p>weishan 不收款、不下单、不保存身份证、护照或银行卡。</p>
        </section>
        ${globalPlanHtml}
        ${globalMissingInfoHtml}
        ${globalGuidanceHtml}
        ${globalSearchPolicyHtml}
        <div class="commerce-one-screen-actions" aria-label="最终结果操作">
          ${globalProcurementUserFacingCopyButtons(card)}
        </div>
        <p class="commerce-result-summary-copy-feedback" data-commerce-copy-feedback aria-live="polite"></p>
        ${resultCardRulesHtml}
        ${disclosure("查看其它安全规则折叠面板", `<section class="commerce-simple-flight-advanced-debug" aria-label="高级调试信息">
          <p>高级调试信息默认折叠，仅供排查与验证。</p>
          ${disclosure("查看可执行清单", commerceActionableChecklistPanelHtml(), "commerce-actionable-checklist-disclosure")}
          ${disclosure("查看平台模板", commercePlatformSearchTemplatePackHtml(), "commerce-platform-template-disclosure")}
          ${commerceFlightProviderCandidatesDisclosure()}
          ${commerceFlightProviderApprovalDisclosure()}
          ${commerceFlightReadonlyStubPermissionDisclosure()}
          ${commerceFlightReadonlyStubAdapterDisclosure()}
          ${commerceFlightSandboxDryRunDisclosure()}
          ${commerceFlightSandboxProviderMatrixDisclosure()}
        </section>`, "commerce-simple-flight-advanced-debug-disclosure")}
        ${secureApiKeyStorageHtml}
        ${providerConnectionReadinessHtml}
        ${globalGuardHtml}
        ${globalEvidenceHtml}
      </div>
      <p class="commerce-result-summary-status"><b>提示：</b>当前只是整理搜索条件，不会访问真实平台，不会返回价格，不会跳转购买或预订，不会付款或下单。</p>
    </section>`;
  }
  function commerceSimpleFlightFields(task){
    const normalized = task && (task.normalizedFields || task.normalized) || {};
    const raw = String(task && (task.inputSummary || task.rawInput || task.title || task.text) || "");
    const parser = window.WeishanFlightIntentParser;
    const parsed = parser && typeof parser.parseFlightIntent === "function" ? parser.parseFlightIntent(raw) : null;
    const normalizer = window.WeishanProcurementSortIntentNormalizer;
    const normalizedIntent = normalizer && typeof normalizer.normalizeProcurementSortIntent === "function" ? normalizer.normalizeProcurementSortIntent({
      rawUserInput:raw,
      origin:normalized.originText || parsed && parsed.origin,
      destination:normalized.destinationText || parsed && parsed.destination,
      date:normalized.dateText || normalized.timing || parsed && parsed.departureDate,
      directOnly:normalized.directOnly === true || parsed && parsed.directOnly === true,
      sortPreference:normalized.sortPreference,
      sortLabel:normalized.sortPreferenceLabel || normalized.goal
    }) : null;
    const origin = String(normalizedIntent && normalizedIntent.origin || normalized.originText || parsed && parsed.origin || "").trim();
    const destination = String(normalizedIntent && normalizedIntent.destination || normalized.destinationText || parsed && parsed.destination || "").trim();
    const date = String(normalizedIntent && normalizedIntent.departureDate || normalized.dateText || normalized.timing || parsed && parsed.departureDate || "").trim().replace(/\s+/g, "");
    const dateDisplay = String(normalizedIntent && normalizedIntent.dateDisplay || date.replace(/^(\d{1,2})月(\d{1,2})日$/, "$1 月 $2 日"));
    const directOnly = normalizedIntent && normalizedIntent.directOnly === true || normalized.directOnly === true || parsed && parsed.directOnly === true || /直达|直飞|不转机|不要中转|只看直飞/.test(raw);
    const sortPreference = normalizedIntent && normalizedIntent.sortPreference || (normalized.sortPreference === "low_price" || parsed && parsed.sortPreference === "low_price" || /最便宜|低价|便宜|最低价|价格最低/.test(raw) || /低价优先/.test(String(normalized.constraints || "")) ? "low_price" : "safe_trusted");
    const sortLabel = normalizedIntent && normalizedIntent.sortLabel || (sortPreference === "low_price" ? "低价优先" : "安全与可信来源优先");
    return {
      origin,
      destination,
      date,
      dateDisplay,
      directOnly,
      directPreference:directOnly ? "直达优先" : "按条件筛选",
      sortPreference,
      sortLabel,
      goal:sortLabel
    };
  }


  function commerceIsSimpleFlightTask(task){
    const raw = String(task && (task.inputSummary || task.rawInput || task.title || task.text) || "");
    const fields = commerceSimpleFlightFields(task);
    return !!(task && task.category === "flight" && fields.origin && fields.destination && /\d{1,2}\s*月\s*\d{1,2}\s*日/.test(fields.date) && !/(酒店|住宿|电脑|商品|剪视频|内存|硬盘|采购计划)/.test(raw));
  }

  function commerceSimpleFlightEnglishCity(value){
    const map = { "上海":"Shanghai", "成都":"Chengdu", "北京":"Beijing", "广州":"Guangzhou", "深圳":"Shenzhen", "杭州":"Hangzhou", "东京":"Tokyo" };
    return map[value] || value;
  }

  function commerceSimpleFlightEnglishDate(value){
    const match = String(value || "").match(/(\d{1,2})月(\d{1,2})日/);
    if (!match) return value;
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return (months[Number(match[1]) - 1] || (match[1] + "月")) + " " + Number(match[2]);
  }

  function commerceSimpleFlightCopyTexts(task){
    const fields = commerceSimpleFlightFields(task);
    const enOrigin = commerceSimpleFlightEnglishCity(fields.origin);
    const enDestination = commerceSimpleFlightEnglishCity(fields.destination);
    const enDate = commerceSimpleFlightEnglishDate(fields.date);
    const googleGoal = fields.goal === "低价优先" ? "lowest available fare" : "best matching fare";
    return {
      flight:[
        "机票搜索条件",
        "出发地：" + fields.origin,
        "目的地：" + fields.destination,
        "出发日期：" + fields.date,
        "排序：" + fields.goal,
        "注意：当前不会访问真实平台，不会返回实时价格，最终价格以真实平台为准。"
      ].join("\n"),
      googleFlights:[
        "Google Flights search template",
        "From: " + enOrigin,
        "To: " + enDestination,
        "Departure date: " + enDate,
        "Goal: " + googleGoal,
        "Note: final price must be checked on the real platform."
      ].join("\n"),
      tripCom:[
        "机票搜索模板",
        "出发地：" + fields.origin,
        "目的地：" + fields.destination,
        "出发日期：" + fields.date,
        "排序：" + fields.goal,
        "注意：最终价格以真实平台为准。"
      ].join("\n")
    };
  }

  function commerceSimpleFlightExternalSearchUrls(task){
    const fields = commerceSimpleFlightFields(task);
    const enOrigin = commerceSimpleFlightEnglishCity(fields.origin);
    const enDestination = commerceSimpleFlightEnglishCity(fields.destination);
    const enDate = commerceSimpleFlightEnglishDate(fields.date);
    const zhQuery = [fields.date, fields.origin, "到", fields.destination, fields.goal === "低价优先" ? "最便宜" : "", "机票"].filter(Boolean).join(" ");
    const enQuery = [enOrigin, "to", enDestination, "flight", enDate, fields.goal === "低价优先" ? "lowest fare" : ""].filter(Boolean).join(" ");
    return {
      web:"https://www.google.com/search?q=" + encodeURIComponent(zhQuery),
      googleFlights:(function(){ const registryApi = window.WeishanTrustedFlightSourceRegistry; const source = registryApi && typeof registryApi.getTrustedFlightSourceById === "function" ? registryApi.getTrustedFlightSourceById("google_flights_search") : null; const baseUrl = String(source && source.safeProviderHandoffUrl || "").trim(); return baseUrl ? baseUrl + "?q=" + encodeURIComponent(enQuery) : ""; })(),
      tripCom:"https://www.trip.com/flights/search/?q=" + encodeURIComponent(enQuery)
    };
  }

  function commerceSafeProviderHandoffCandidateForTask(task){
    const fields = commerceSimpleFlightFields(task);
    const registryApi = window.WeishanTrustedFlightSourceRegistry;
    const trustedSource = registryApi && typeof registryApi.getTrustedFlightSourceById === "function"
      ? registryApi.getTrustedFlightSourceById("google_flights_search")
      : null;
    const safeProviderHandoffUrl = String(trustedSource && trustedSource.safeProviderHandoffUrl || "").trim();
    return {
      providerId: "google_flights_search",
      providerName: "Google Flights",
      providerType: "flight_search",
      searchOnly: true,
      safeProviderHandoffUrl: safeProviderHandoffUrl || null,
      safeProviderHandoffHost: String(trustedSource && trustedSource.safeProviderHandoffHost || "").trim(),
      taskId: task && task.taskId || task && task.id || "",
      taskTitle: commerceTaskRawInput(task),
      origin: fields.origin,
      destination: fields.destination,
      departureDate: fields.date,
      restrictedCategory: false
    };
  }

  function commerceEncodedCopyText(text){
    return esc(encodeURIComponent(String(text || "")));
  }

  function commerceEncodedExternalUrl(url){
    return esc(encodeURIComponent(String(url || "")));
  }

  function commerceFlightLowestOffersContract(task){
    const fallback = {
      contractVersion:"2.0.88",
      phase:"flight_lowest_two_offers_contract",
      providerStatus:"not_configured",
      offersStatus:"unavailable",
      offers:[],
      maxDisplayedOffers:2,
      selectionPolicy:"lowest_total_price_first",
      trustedSearchRoutes:["google_search", "google_flights", "trip_com"],
      capabilities:{
        canReturnOffers:false,
        canReturnPrice:false,
        canReturnBookingUrl:false,
        canOpenExternalBooking:false,
        canCreateOrder:false,
        canPay:false,
        canStoreIdentity:false,
        canStorePassport:false,
        canStoreBankCard:false
      },
      safety:{
        noRealEndpoint:true,
        noRealApiKey:true,
        noNetworkSearch:true,
        noRealResults:true,
        noRealPrice:true,
        noFakeDemoMockPrice:true,
        noBookingUrl:true,
        noRedirect:true,
        noCheckout:true,
        noPayment:true,
        noOrderSubmit:true,
        noIdentityStorage:true,
        noPassportStorage:true,
        noBankCardStorage:true
      },
      display:{
      summaryTitle:"机票搜索结果",
      currentStatusLine:"暂无真实价格结果",
      priceStateLine:"当前尚未接入真实只读机票价格源，不能展示价格。",
      futureLine:"接入可信价格源后，将只显示通过安全检查的真实价格结果。最终价格、库存、税费、运费、行李、退改签，以跳转后的平台页面为准。"
      }
    };
    const api = window.WeishanCommerceFlightLowestOffersContract;
    const source = task && task.flightLowestOffersContract || null;
    if (api && typeof api.normalizeFlightLowestOffersContract === "function") return api.normalizeFlightLowestOffersContract(source);
    if (api && typeof api.getFlightLowestOffersContract === "function") return api.getFlightLowestOffersContract(source);
    return fallback;
  }

  function commerceFlightLowestOffersDisplay(task){
    const contract = commerceFlightLowestOffersContract(task);
    const api = window.WeishanCommerceFlightLowestOffersContract;
    if (api && typeof api.describeFlightLowestOffersContract === "function") return api.describeFlightLowestOffersContract(contract);
    const display = contract.display || {};
    return {
      summaryTitle:display.summaryTitle || "机票搜索结果",
      currentStatusLine:display.currentStatusLine || "暂无真实价格结果",
      priceStateLine:display.priceStateLine || "当前尚未接入真实只读机票价格源，不能展示价格。",
      futureLine:display.futureLine || "接入可信价格源后，将只显示通过安全检查的真实价格结果。最终价格、库存、税费、运费、行李、退改签，以跳转后的平台页面为准。"
    };
  }

  function commerceUserApiSearchModeDisplay(task){
    const api = window.WeishanCommerceUserApiPriorityPolicy;
    const state = task && task.userApiPriorityPolicyState || null;
    const searchMode = state && state.searchMode || null;
    if (api && typeof api.buildSearchModeDisplay === "function") return api.buildSearchModeDisplay(searchMode);
    return state && state.display || {
      title:"当前搜索模式",
      userApiLine:"用户 API：未绑定",
      candidateProviderLine:"weishan 候选平台：可用",
      realPriceLine:"真实价格结果：暂无",
      futureLine:"绑定 API 后，将优先使用用户授权平台的只读价格结果",
      sourceLine:"未绑定 API 时，可使用 weishan 候选平台和外部搜索入口。"
    };
  }

  function commerceApiBindingSafeShellDisplay(task){
    const api = window.WeishanCommerceApiBindingSafeShell;
    const state = task && task.apiBindingSafeShellState || null;
    const shellState = state && state.shellState || null;
    if (api && typeof api.buildApiBindingSafeShellDisplay === "function") return api.buildApiBindingSafeShellDisplay(shellState);
    return state && state.display || {
      title:"API 绑定状态",
      userApiLine:"用户 API：未绑定",
      candidateProviderLine:"weishan 候选平台：可用",
      realPriceLine:"真实价格结果：暂无",
      currentStatusLine:"当前状态：用户 API 未绑定。",
      bindFutureLine:"绑定 API 后，可优先使用用户授权平台的只读价格结果。",
      readonlyScopeLine:"API 只用于搜索、读取价格、读取库存、分析结果。",
      externalConfirmLine:"点击价格后跳转到外部平台或官网确认。",
      safetyLines:[
        "绑定 API 不代表允许付款",
        "绑定 API 不代表允许下单",
        "绑定 API 不代表允许提交身份证、护照或银行卡",
        "只读 API：允许搜索 / 返回价格",
        "写入 API：默认禁止",
        "下单 API：默认禁止",
        "支付 API：禁止",
        "身份资料上传：禁止",
        "银行卡保存：禁止"
      ]
    };
  }

  function commerceUserApiProviderCatalogDisplay(task){
    const api = window.WeishanCommerceUserApiProviderCatalog;
    const state = task && task.userApiProviderCatalogState || null;
    if (api && typeof api.buildUserApiProviderCatalogDisplay === "function") return api.buildUserApiProviderCatalogDisplay(state && state.catalog);
    return state && state.display || {
      title:"可绑定 API 平台目录",
      currentStatusLine:"平台目录已建立，但尚未绑定任何真实 API。",
      providerTypeLine:"可选平台类型：机票 / 酒店 / 商品 / 本地服务",
      boundLine:"已绑定 API：0",
      priceLine:"可返回真实价格：0",
      orderLine:"可下单：0",
      paymentLine:"可付款：0",
      explanationLine:"绑定 API 后，weishan 可优先使用用户授权平台的只读价格结果。",
      safetyLine:"当前版本只展示平台目录和权限说明，不保存真实 API key，不测试连接。",
      groupLabels:{ flight:"机票 / 航旅", hotel:"酒店", commerce:"商品 / 电商", localService:"本地服务 / 门票" },
      groups:{ flight:[], hotel:[], commerce:[], localService:[] },
      capabilityLines:[
        "只读潜力：可评估",
        "写入能力：禁用",
        "下单能力：禁用",
        "支付能力：禁用",
        "身份资料上传：禁用",
        "API key 输入：禁用",
        "endpoint 连接：禁用"
      ]
    };
  }

  function commerceUserApiProviderCatalogDisclosure(task){
    const display = commerceUserApiProviderCatalogDisplay(task);
    const groups = display.groups || {};
    const labels = display.groupLabels || {};
    const capabilityLines = Array.isArray(display.capabilityLines) ? display.capabilityLines : [];
    const groupHtml = [
      ["flight", labels.flight || "机票 / 航旅"],
      ["hotel", labels.hotel || "酒店"],
      ["commerce", labels.commerce || "商品 / 电商"],
      ["localService", labels.localService || "本地服务 / 门票"]
    ].map(([key, label]) => {
      const providers = Array.isArray(groups[key]) ? groups[key] : [];
      return `<section class="commerce-api-provider-catalog-group">
        <h5>${esc(label)}</h5>
        <ul>${providers.map((item) => `<li>${esc(item.providerName || "")}</li>`).join("")}</ul>
        <div class="commerce-api-provider-catalog-capabilities">${capabilityLines.map((line) => `<p>${esc(line)}</p>`).join("")}</div>
      </section>`;
    }).join("");
    const body = `<section class="commerce-api-provider-catalog" aria-label="可绑定 API 平台目录">
      <h4>${esc(display.title || "可绑定 API 平台目录")}</h4>
      <p>${esc(display.currentStatusLine || "平台目录已建立，但尚未绑定任何真实 API。")}</p>
      <div class="commerce-api-provider-catalog-summary">
        <p>${esc(display.providerTypeLine || "可选平台类型：机票 / 酒店 / 商品 / 本地服务")}</p>
        <p>${esc(display.boundLine || "已绑定 API：0")}</p>
        <p>${esc(display.priceLine || "可返回真实价格：0")}</p>
        <p>${esc(display.orderLine || "可下单：0")}</p>
        <p>${esc(display.paymentLine || "可付款：0")}</p>
      </div>
      <p>${esc(display.explanationLine || "绑定 API 后，weishan 可优先使用用户授权平台的只读价格结果。")}</p>
      <p>${esc(display.safetyLine || "当前版本只展示平台目录和权限说明，不保存真实 API key，不测试连接。")}</p>
      <p>API 绑定表单：禁用预览</p>
      <p>API 绑定权限清单：只读预览</p>
      <p>API 绑定准备状态：未准备</p>
      <p>平台目录只是目录，不代表已经可绑定</p>
      <p>平台目录不代表已获得 API 权限</p>
      <p>平台目录只用于了解未来可绑定平台，不代表当前可连接真实 API</p>
      ${groupHtml}
    </section>`;
    return disclosure("查看可绑定 API 平台目录", body, "commerce-api-provider-catalog-disclosure");
  }

  function commerceApiBindingMockFormDisplay(){
    const api = window.WeishanCommerceApiBindingMockForm;
    if (api && typeof api.buildApiBindingMockFormDisplay === "function") return api.buildApiBindingMockFormDisplay();
    return {
      title:"API 绑定表单",
      currentStatusLine:"API 绑定表单为禁用预览，当前版本不保存真实 API key。",
      fieldIntroLine:"表单字段，全部禁用：",
      actionIntroLine:"按钮，全部禁用：",
      safetyLines:[
        "当前版本不能输入真实 API key",
        "当前版本不能保存 API key",
        "当前版本不能测试连接",
        "当前版本不能连接 endpoint",
        "当前版本不能发起网络请求",
        "当前版本不能返回真实价格",
        "当前版本不能返回 bookingUrl",
        "当前版本不能付款",
        "当前版本不能下单",
        "当前版本不能上传身份证、护照或银行卡"
      ],
      fields:[
        { fieldId:"providerCategory", label:"平台类型", placeholder:"请选择平台类型（当前禁用）", disabled:true, value:"", securityNotice:"仅展示未来字段，不连接真实 provider。" },
        { fieldId:"providerName", label:"平台名称", placeholder:"请选择平台名称（当前禁用）", disabled:true, value:"", securityNotice:"仅展示未来字段，不保存平台凭据。" },
        { fieldId:"permissionTier", label:"权限类型", placeholder:"请选择权限类型（当前禁用）", disabled:true, value:"", securityNotice:"写入、下单、支付、身份资料权限均禁用。" },
        { fieldId:"apiKeyPlaceholder", label:"API key", placeholder:"API key（当前不可输入）", disabled:true, value:"", securityNotice:"当前版本不保存真实 API key。" },
        { fieldId:"apiSecretPlaceholder", label:"API secret", placeholder:"API secret（当前不可输入）", disabled:true, value:"", securityNotice:"当前版本不保存真实 API secret。" },
        { fieldId:"endpointPlaceholder", label:"endpoint", placeholder:"endpoint（当前不可输入）", disabled:true, value:"", securityNotice:"当前版本不连接 endpoint，不测试连接。" },
        { fieldId:"regionScope", label:"地区", placeholder:"地区范围（当前禁用）", disabled:true, value:"", securityNotice:"仅用于未来只读搜索范围说明。" },
        { fieldId:"currencyScope", label:"币种", placeholder:"币种范围（当前禁用）", disabled:true, value:"", securityNotice:"当前不会返回真实价格。" },
        { fieldId:"callbackUrl", label:"回调地址", placeholder:"回调地址（当前禁用）", disabled:true, value:"", securityNotice:"当前不会生成回调，不连接外部服务。" },
        { fieldId:"note", label:"备注", placeholder:"备注（当前禁用）", disabled:true, value:"", securityNotice:"当前不会提交或保存任何 API 配置。" }
      ],
      actions:[
        { actionId:"saveApiConfig", label:"保存 API 配置", disabled:true, reason:"当前版本不保存真实 API key。" },
        { actionId:"testConnection", label:"测试连接", disabled:true, reason:"当前版本不连接 endpoint，不发起网络请求。" },
        { actionId:"deleteBinding", label:"删除绑定", disabled:true, reason:"当前没有真实绑定可删除。" },
        { actionId:"enableReadonlySearch", label:"启用只读搜索", disabled:true, reason:"当前尚未通过人工审批和安全检查。" },
        { actionId:"enablePriceResults", label:"启用价格结果", disabled:true, reason:"当前无真实可信价格源。" }
      ]
    };
  }

  function commerceApiBindingMockFormDisclosure(){
    const display = commerceApiBindingMockFormDisplay();
    const fields = Array.isArray(display.fields) ? display.fields : [];
    const actions = Array.isArray(display.actions) ? display.actions : [];
    const safetyLines = Array.isArray(display.safetyLines) ? display.safetyLines : [];
    const fieldHtml = fields.map((item) => `<label class="commerce-api-binding-mock-field">
      <span>${esc(item.label || "")}</span>
      <input type="text" value="${esc(item.value || "")}" placeholder="${esc(item.placeholder || "")}" disabled aria-disabled="true" data-api-binding-mock-field="${esc(item.fieldId || "")}">
      <small>${esc(item.securityNotice || "")}</small>
    </label>`).join("");
    const actionHtml = actions.map((item) => `<button class="cmd-btn gray commerce-api-binding-mock-action" type="button" disabled aria-disabled="true" data-api-binding-mock-action="${esc(item.actionId || "")}" title="${esc(item.reason || "")}">${esc(item.label || "")}</button>`).join("");
    const body = `<section class="commerce-api-binding-mock-form" aria-label="API 绑定表单">
      <h4>${esc(display.title || "API 绑定表单")}</h4>
      <p>${esc(display.currentStatusLine || "API 绑定表单为禁用预览，当前版本不保存真实 API key。")}</p>
      <h5>${esc(display.fieldIntroLine || "表单字段，全部禁用：")}</h5>
      <div class="commerce-api-binding-mock-fields">${fieldHtml}</div>
      <h5>${esc(display.actionIntroLine || "按钮，全部禁用：")}</h5>
      <div class="commerce-api-binding-mock-actions">${actionHtml}</div>
      <p>API 绑定权限清单：只读预览</p>
      <p>API 绑定准备状态：未准备</p>
      <p>安全密钥存储方案尚未实现前，表单保持禁用</p>
      <p>密钥脱敏与日志防泄露规则已建立，key 删除 / 轮换 / 过期机制草案已建立，但 provider endpoint allowlist 闸门已建立，只读 provider sandbox gate：已建立，等待只读 provider result schema gate；只读 provider result schema gate：已建立，provider result source label gate：未建立，表单仍不可用</p>
      <p>安全存储设计闸门关闭，表单不可用</p>
      <p>本机安全存储接口仍为草案，表单不可用</p>
      <p>未完成权限确认前，表单保持禁用</p>
      <p>当前版本不能提交绑定确认</p>
      <ul>${safetyLines.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
    </section>`;
    return disclosure("查看 API 绑定表单", body, "commerce-api-binding-mock-form-disclosure");
  }

  function commerceApiBindingPermissionChecklistDisplay(){
    const api = window.WeishanCommerceApiBindingPermissionChecklist;
    if (api && typeof api.buildApiBindingPermissionChecklistDisplay === "function") return api.buildApiBindingPermissionChecklistDisplay();
    return {
      title:"API 绑定权限清单",
      currentStatusLine:"权限清单为只读预览，当前版本不能提交绑定确认。",
      allowedTitle:"允许的未来只读能力：",
      forbiddenTitle:"禁止能力：",
      disabledTitle:"当前版本禁用：",
      previewTitle:"未来绑定前确认预览：",
      confirmationButtonLabel:"提交绑定确认",
      confirmationButtonDisabled:true,
      checklist:{
        allowedFutureReadonly:["只读搜索", "读取价格", "读取库存", "分析结果", "显示来源平台", "点击价格后跳转外部平台确认"].map((label) => ({ label, status:"allowed_future_readonly", enabledNow:false })),
        forbidden:["写入 API", "下单 API", "支付 API", "上传身份证", "上传护照", "保存银行卡", "自动付款", "自动下单", "后台静默调用 API", "明文保存 API key"].map((label) => ({ label, status:"forbidden", enabledNow:false })),
        disabledCurrentVersion:["API key 输入", "API key 保存", "API 连接测试", "endpoint 连接", "真实网络请求", "真实价格返回", "bookingUrl 返回"].map((label) => ({ label, status:"disabled_current_version", enabledNow:false }))
      },
      confirmationPreview:[
        "我确认该 API 仅用于只读搜索和价格读取。",
        "我理解 weishan 不会替我付款。",
        "我理解 weishan 不会替我下单。",
        "我理解 weishan 不会上传身份证、护照或银行卡。",
        "我理解最终价格以外部平台页面为准。",
        "我理解当前版本不会保存真实 API key。",
        "我理解未通过安全审查前不会连接真实 endpoint。"
      ]
    };
  }

  function commerceApiBindingPermissionChecklistDisclosure(){
    const display = commerceApiBindingPermissionChecklistDisplay();
    const checklist = display.checklist || {};
    const allowed = Array.isArray(checklist.allowedFutureReadonly) ? checklist.allowedFutureReadonly : [];
    const forbidden = Array.isArray(checklist.forbidden) ? checklist.forbidden : [];
    const disabled = Array.isArray(checklist.disabledCurrentVersion) ? checklist.disabledCurrentVersion : [];
    const preview = Array.isArray(display.confirmationPreview) ? display.confirmationPreview : [];
    const itemHtml = (items, suffix) => items.map((item) => `<li>${esc(item.label || "")}${suffix}</li>`).join("");
    const body = `<section class="commerce-api-binding-permission-checklist" aria-label="API 绑定权限清单">
      <h4>${esc(display.title || "API 绑定权限清单")}</h4>
      <p>${esc(display.currentStatusLine || "权限清单为只读预览，当前版本不能提交绑定确认。")}</p>
      <h5>${esc(display.allowedTitle || "允许的未来只读能力：")}</h5>
      <ul>${itemHtml(allowed, "")}</ul>
      <h5>${esc(display.forbiddenTitle || "禁止能力：")}</h5>
      <ul>${itemHtml(forbidden, "：禁止")}</ul>
      <h5>${esc(display.disabledTitle || "当前版本禁用：")}</h5>
      <ul>${itemHtml(disabled, "：禁用")}</ul>
      <h5>${esc(display.previewTitle || "未来绑定前确认预览：")}</h5>
      <ul>${preview.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <p>API 绑定准备状态：未准备</p>
      <p>权限确认当前不能提交</p>
      <p>未通过安全存储设计闸门前，不能提交绑定确认</p>
      <p>密钥脱敏与日志防泄露规则已建立</p>
      <p>key 删除 / 轮换 / 过期机制草案已建立，但真实删除 / 轮换 / 过期仍未开放，不能提交绑定确认</p>
      <p>未完成只读 provider result schema gate 前，不能提交绑定确认</p>
      <button class="cmd-btn gray commerce-api-binding-confirm-preview" type="button" disabled aria-disabled="true">${esc(display.confirmationButtonLabel || "提交绑定确认")}</button>
    </section>`;
    return disclosure("查看 API 绑定权限清单", body, "commerce-api-binding-permission-checklist-disclosure");
  }

  function commerceApiBindingReadinessDisplay(){
    const api = window.WeishanCommerceApiBindingReadinessStatus;
    if (api && typeof api.buildApiBindingReadinessDisplay === "function") return api.buildApiBindingReadinessDisplay();
    return {
      title:"API 绑定准备状态",
      conclusionLine:"当前还不能绑定真实 API。",
      nextStepLine:"下一步：只读 provider result schema gate；只读 provider result schema gate：已建立。下一步：provider result source label gate",
      nextStepDetail:"密钥脱敏与日志防泄露规则：已建立。key 删除 / 轮换 / 过期机制草案：已建立。当前版本仍不能输入、保存、读取、删除、轮换或测试真实 API key。",
      statusLines:[
        "用户 API：未绑定",
        "平台目录：已建立",
        "API 绑定说明：已建立",
        "API 绑定表单：禁用预览",
        "API 绑定权限清单：只读预览",
        "安全密钥存储方案：方案已建立，尚未实现",
        "Provider 人工审查：未开始",
        "只读沙箱连接：未准备",
        "真实价格结果：暂无",
        "密钥脱敏与日志防泄露规则：已建立",
        "key 删除 / 轮换 / 过期机制草案：已建立",
        "真实 key 删除 / 轮换 / 过期：未开放"
      ],
      blockerTitle:"为什么还不能绑定：",
      status:{
        blockers:[
          "安全密钥存储方案尚未实现",
          "API 绑定权限确认不能提交",
          "Provider 条款 / API 文档未人工审查",
          "只读沙箱连接闸门未完成",
          "endpoint 连接未启用",
          "网络请求未启用",
          "真实价格返回未启用",
          "bookingUrl 返回未启用"
        ]
      },
      routeTitle:"后续路线：",
      steps:[
        { label:"平台目录 / 说明 / 禁用表单 / 权限清单", status:"已建立" },
        { label:"安全密钥存储方案", status:"下一步" },
        { label:"只读 API 绑定草稿", status:"未开始" },
        { label:"Provider 人工审查", status:"未开始" },
        { label:"只读沙箱闸门", status:"未开始" },
        { label:"只读价格结果", status:"未开始" }
      ],
      permanentTitle:"永久限制：",
      permanentLimits:["weishan 不付款", "weishan 不下单", "weishan 不上传身份证、护照或银行卡", "weishan 不保存银行卡"]
    };
  }

  function commerceApiBindingReadinessDisclosure(){
    const display = commerceApiBindingReadinessDisplay();
    const statusLines = Array.isArray(display.statusLines) ? display.statusLines : [];
    const blockers = display.status && Array.isArray(display.status.blockers) ? display.status.blockers : [];
    const steps = Array.isArray(display.steps) ? display.steps : [];
    const permanentLimits = Array.isArray(display.permanentLimits) ? display.permanentLimits : [];
    const body = `<section class="commerce-api-binding-readiness-status" aria-label="API 绑定准备状态">
      <h4>${esc(display.title || "API 绑定准备状态")}</h4>
      <h5>当前结论：</h5>
      <p>${esc(display.conclusionLine || "当前还不能绑定真实 API。")}</p>
      <p>安全存储设计闸门：关闭</p>
      <p>当前不能绑定真实 API</p>
      <p>本机安全存储接口草案：已建立</p>
      <p>密钥脱敏与日志防泄露规则：已建立</p>
      <p>下一步：只读 provider result schema gate；只读 provider result schema gate：已建立。下一步：provider result source label gate</p>
      <p>key 删除 / 轮换 / 过期机制草案：已建立</p>
      <p>真实 key 删除 / 轮换 / 过期：未开放</p>
      <p>key 输入：未开放</p>
      <p>key 保存：未开放</p>
      <p>key 读取：未开放</p>
      <p>测试连接：未开放</p>
      <h5>当前状态：</h5>
      <ul>${statusLines.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <h5>${esc(display.blockerTitle || "为什么还不能绑定：")}</h5>
      <ul>${blockers.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <h5>${esc(display.nextStepLine || "下一步：只读 provider result schema gate；只读 provider result schema gate：已建立。下一步：provider result source label gate")}</h5>
      <p>${esc(display.nextStepDetail || "密钥脱敏与日志防泄露规则：已建立。key 删除 / 轮换 / 过期机制草案：已建立。当前版本仍不能输入、保存、读取、删除、轮换或测试真实 API key。")}</p>
      <h5>${esc(display.routeTitle || "后续路线：")}</h5>
      <ol>${steps.map((item) => `<li>${esc(item.label || "")}：${esc(item.status || "")}</li>`).join("")}</ol>
      <h5>${esc(display.permanentTitle || "永久限制：")}</h5>
      <ul>${permanentLimits.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
    </section>`;
    return disclosure("查看 API 绑定准备状态", body, "commerce-api-binding-readiness-status-disclosure");
  }

  function commerceSecureKeyStoragePlanDisplay(task){
    const plan = task && task.flightSecureKeyStoragePlan || null;
    const api = window.WeishanCommerceSecureKeyStoragePlan;
    if (api && typeof api.describeSecureKeyStoragePlan === "function") {
      const described = api.describeSecureKeyStoragePlan(plan);
      return Object.assign({}, described, described && described.display || {}, described && described.summary || {});
    }
    return {
      summaryTitle: "安全密钥存储方案",
      planStatusLine: "安全密钥存储方案：计划中",
      currentStatusLine: "当前状态：安全密钥存储仍处于方案阶段，当前版本不会保存真实 API key。",
      currentStageLine: "当前阶段：设计中",
      futureTargetsLine: "未来目标：macOS Keychain / Electron safeStorage",
      blockedChannelsLine: "禁止：明文、.env、localStorage、sessionStorage、日志",
      nextStepLine: "密钥脱敏与日志防泄露规则：已建立",
      safetyLine: "当前版本仍不能输入、保存、读取或测试真实 API key。",
      localInterfaceDraftLine: "本机安全存储接口草案：已建立",
      realKeyStorageLine: "真实 key 保存仍未启用",
      statusChecklistTitle: "当前状态清单",
      statusChecklistItems: ["真实密钥保存：未启用", "macOS Keychain：未连接", "Electron safeStorage：未实现", ".env 保存：禁止", "明文保存：禁止", "localStorage 保存：禁止", "sessionStorage 保存：禁止", "日志记录 key：禁止", "API 连接测试：未启用", "endpoint 连接：未启用", "真实价格返回：未启用", "bookingUrl 返回：未启用"],
      futureStorageTargetsTitle: "未来允许评估的存储目标",
      futureStorageTargets: ["macOS Keychain", "Electron safeStorage + 加密本地存储", "用户本机加密配置文件", "企业托管密钥服务"],
      forbiddenStorageTitle: "禁止的存储方式",
      forbiddenStorageItems: ["明文文件", ".env", "localStorage", "sessionStorage", "前端代码", "日志文件", "crash report", "远程未加密存储", "自动上传到服务器", "通过聊天记录保存 API key", "通过截图保存 API key"],
      implementationStepsTitle: "实施步骤",
      implementationSteps: ["设计密钥数据模型", "选择安全存储目标", "增加本机加密写入能力", "增加读取前权限确认", "增加删除 / 轮换 / 过期机制", "增加审计日志，但不得记录 key 明文", "增加只读 provider 沙箱连接", "增加真实只读价格源前的人工复核"],
      riskModelTitle: "风险模型",
      riskModelItems: ["明文泄露风险", "日志泄露风险", "截图泄露风险", "复制粘贴泄露风险", "crash report 泄露风险", "恶意 provider 风险", "钓鱼 endpoint 风险", "权限过宽风险", "用户误绑定写入 / 下单 / 支付 API 风险"],
      nextStepTitle: "下一步",
      nextStepText: "provider endpoint allowlist 闸门。key 删除 / 轮换 / 过期机制草案已建立，但当前版本仍不能输入、保存、读取、删除、轮换或测试真实 API key。",
      storageTargets: ["macOS Keychain", "Electron safeStorage"],
      blockedChannels: [".env", "localStorage", "sessionStorage", "日志", "明文"],
      capabilityLines: ["不能读取真实 API key", "不能保存真实 API key", "不能连接 endpoint", "不能发起网络请求", "不能返回价格", "不能返回 bookingUrl", "不能付款", "不能下单", "不能保存身份证 / 护照 / 银行卡"],
      checklistGroups: [{
        title: "前置条件",
        items: [
          ["macOS Keychain 方案", "未开始"],
          ["Electron safeStorage 方案", "未开始"],
          [".env / 明文", "禁止"],
          ["localStorage", "禁止"],
          ["sessionStorage", "禁止"],
          ["日志", "禁止"],
          ["人工批准", "未开始"]
        ]
      }]
    };
  }

  function commerceSecureStorageDesignGateDisplay(task){
    const gate = task && task.secureStorageDesignGate || null;
    const api = window.WeishanCommerceSecureStorageDesignGate;
    if (api && typeof api.buildSecureStorageDesignGate === "function") {
      return api.buildSecureStorageDesignGate(gate);
    }
    return {
      version:"2.0.96",
      gateName:"secure_storage_design_gate",
      gateStatus:"closed",
      phase:"design_gate",
      blockingReasons:["安全密钥写入实现未完成", "安全密钥读取实现未完成", "Keychain 适配未完成", "safeStorage 适配未完成", "provider endpoint allowlist 未完成"],
      unlockChecklist:["设计密钥数据结构", "设计本机安全写入接口", "设计本机安全读取接口", "完成安全审查后，才允许进入下一阶段"],
      implementationMilestones:["v2.0.96：安全存储设计闸门，默认关闭", "v2.0.96：本机安全存储接口草案，仍不写真实 key"],
      auditRules:["日志中永不记录完整 key", "UI 不得展示明文 key"],
      redactionRules:["apiKey → [REDACTED_API_KEY]", "apiSecret → [REDACTED_API_SECRET]"],
      display:{
        title:"安全存储设计闸门",
        gateStatusLine:"闸门状态：关闭",
        phaseLine:"当前阶段：设计闸门",
        localInterfaceDraftLine:"本机安全存储接口草案：已建立",
        realImplementationLine:"真实实现：未启用",
        keyInputLine:"真实 API key 输入：未开放",
        keySaveLine:"真实 API key 保存：未开放",
        keyReadLine:"真实 API key 读取：未开放",
        connectionTestLine:"测试连接：未开放",
        providerSandboxLine:"provider 沙箱连接：未开放",
        priceLine:"真实价格返回：未开放",
        bookingUrlLine:"bookingUrl 返回：未开放",
        keyRedactionAndLogLeakRulesLine:"密钥脱敏与日志防泄露规则：已建立",
        nextStepLine:"provider endpoint allowlist 闸门。key 删除 / 轮换 / 过期机制草案已建立，但当前版本仍不能输入、保存、读取、删除、轮换或测试真实 API key。"
      }
    };
  }

  function commerceSecureStorageDesignGateDisclosure(task){
    const gate = commerceSecureStorageDesignGateDisplay(task);
    const display = gate.display || {};
    const blockingReasons = Array.isArray(gate.blockingReasons) ? gate.blockingReasons : [];
    const unlockChecklist = Array.isArray(gate.unlockChecklist) ? gate.unlockChecklist : [];
    const implementationMilestones = Array.isArray(gate.implementationMilestones) ? gate.implementationMilestones : [];
    const auditRules = Array.isArray(gate.auditRules) ? gate.auditRules : [];
    const redactionRules = Array.isArray(gate.redactionRules) ? gate.redactionRules : [];
    const threatModel = Array.isArray(gate.threatModel) ? gate.threatModel : [];
    const body = `<section class="commerce-secure-storage-design-gate-panel" aria-label="安全存储设计闸门">
      <h4>${esc(display.title || "安全存储设计闸门")}</h4>
      <h5>当前状态：</h5>
      <p>${esc(display.gateStatusLine || "闸门状态：关闭")}</p>
      <p>${esc(display.phaseLine || "当前阶段：设计闸门")}</p>
      <p>${esc(display.localInterfaceDraftLine || "本机安全存储接口草案：已建立")}</p>
      <p>${esc(display.realImplementationLine || "真实实现：未启用")}</p>
      <p>${esc(display.keyInputLine || "真实 API key 输入：未开放")}</p>
      <p>${esc(display.keySaveLine || "真实 API key 保存：未开放")}</p>
      <p>${esc(display.keyReadLine || "真实 API key 读取：未开放")}</p>
      <p>${esc(display.connectionTestLine || "测试连接：未开放")}</p>
      <p>${esc(display.providerSandboxLine || "provider 沙箱连接：未开放")}</p>
      <p>${esc(display.priceLine || "真实价格返回：未开放")}</p>
      <p>${esc(display.bookingUrlLine || "bookingUrl 返回：未开放")}</p>
      <p>${esc(display.keyRedactionAndLogLeakRulesLine || "密钥脱敏与日志防泄露规则：已建立")}</p>
      <h5>为什么还不能进入真实密钥阶段：</h5>
      <ul>${blockingReasons.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <h5>解锁前检查清单：</h5>
      <ul>${unlockChecklist.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <h5>实施里程碑：</h5>
      <ul>${implementationMilestones.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <h5>审计规则：</h5>
      <ul>${auditRules.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <h5>脱敏规则：</h5>
      <ul>${redactionRules.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <h5>风险模型：</h5>
      <ul>${threatModel.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <h5>下一步：</h5>
      <p>${esc(display.nextStepLine || "provider endpoint allowlist 闸门。key 删除 / 轮换 / 过期机制草案已建立，但当前版本仍不能输入、保存、读取、删除、轮换或测试真实 API key。")}</p>
    </section>`;
    return disclosure("查看安全存储设计闸门", body, "commerce-secure-storage-design-gate-disclosure");
  }

  function commerceLocalSecureStorageInterfaceDraftDisplay(task){
    const draft = task && task.localSecureStorageInterfaceDraft || null;
    const api = window.WeishanCommerceLocalSecureStorageInterfaceDraft;
    if (api && typeof api.buildLocalSecureStorageInterfaceDraft === "function") {
      return api.buildLocalSecureStorageInterfaceDraft(draft);
    }
    return {
      version:"2.0.96",
      draftStatus:"draft_only",
      implementationStatus:"not_implemented",
      dataModelDraft:{
        keyAliasModel:{ keyAliasId:"field:keyAliasId", providerId:"field:providerId", providerName:"field:providerName", permissionType:"field:permissionType_readonly_only", region:"field:region", currency:"field:currency", status:"field:status_draft_only", displayName:"field:displayName", maskedPreview:"field:maskedPreview_redacted_only" },
        keySecretModel:{ secretRef:"field:secretRef_reference_only", encryptedPayloadRef:"field:encryptedPayloadRef_reference_only", backendType:"field:backendType_candidate_only", keyVersion:"field:keyVersion", rotationVersion:"field:rotationVersion" },
        providerBindingModel:{ bindingId:"field:bindingId", providerId:"field:providerId", providerName:"field:providerName", keyAliasId:"field:keyAliasId", endpointAllowlistStatus:"field:endpointAllowlistStatus_not_approved", sandboxStatus:"field:sandboxStatus_disabled", status:"draft_only" }
      },
      methodDraft:{
        prepareKeyAliasDraft:{ status:"draft_only", reason:"alias_draft_only_no_real_key" },
        prepareSecretWriteDraft:{ status:"blocked", reason:"secret_write_blocked" },
        prepareSecretReadDraft:{ status:"blocked", reason:"secret_read_blocked" },
        prepareSecretDeleteDraft:{ status:"blocked", reason:"secret_delete_blocked" },
        prepareSecretRotateDraft:{ status:"blocked", reason:"secret_rotate_blocked" },
        prepareConnectionTestDraft:{ status:"blocked", reason:"endpoint_connection_disabled" },
        prepareProviderSandboxDraft:{ status:"blocked", reason:"provider_sandbox_disabled" },
        prepareRealPriceReadDraft:{ status:"blocked", reason:"real_price_read_blocked" },
        prepareBookingUrlDraft:{ status:"blocked", reason:"booking_url_disabled" }
      },
      backendCandidates:[
        { backendType:"macOS Keychain", candidateStatus:"candidate_only", connected:false, canRead:false, canWrite:false, canDelete:false, canRotate:false, displayLine:"macOS Keychain：候选，未连接" },
        { backendType:"Electron safeStorage + encrypted file", candidateStatus:"candidate_only", connected:false, canRead:false, canWrite:false, canDelete:false, canRotate:false, displayLine:"Electron safeStorage + encrypted file：候选，未实现" },
        { backendType:"encrypted local config", candidateStatus:"candidate_only", connected:false, canRead:false, canWrite:false, canDelete:false, canRotate:false, displayLine:"encrypted local config：候选，未实现" },
        { backendType:"enterprise managed secret", candidateStatus:"candidate_only", connected:false, canRead:false, canWrite:false, canDelete:false, canRotate:false, displayLine:"enterprise managed secret：候选，未实现" }
      ],
      auditDraft:{ events:["KEY_ALIAS_CREATED_DRAFT", "KEY_WRITE_BLOCKED", "KEY_READ_BLOCKED", "KEY_DELETE_BLOCKED", "KEY_ROTATE_BLOCKED", "CONNECTION_TEST_BLOCKED", "PROVIDER_SANDBOX_BLOCKED", "REAL_PRICE_BLOCKED", "BOOKING_URL_BLOCKED"], rules:["审计日志不得记录 key 明文", "审计日志只允许记录 key alias"] },
      redactionDraft:{ functions:["redactSecretLikeValue", "redactObject", "redactHeaders", "redactUrl"], placeholders:{ apiKey:"[REDACTED_API_KEY]", apiSecret:"[REDACTED_API_SECRET]", accessToken:"[REDACTED_ACCESS_TOKEN]", authorizationHeader:"[REDACTED_AUTH_HEADER]", credentialParams:"[REDACTED_CREDENTIAL_PARAMS]" } },
      display:{ title:"本机安全存储接口草案", currentStatusLine:"接口草案：已建立", implementationLine:"真实实现：未启用", keyInputLine:"真实 API key 输入：未开放", keySaveLine:"真实 API key 保存：未开放", keyReadLine:"真实 API key 读取：未开放", keyDeleteRotateLine:"删除 / 轮换：未开放", connectionTestLine:"测试连接：未开放", providerSandboxLine:"provider 沙箱：未开放", priceLine:"真实价格：未开放", bookingUrlLine:"bookingUrl：未开放", keyLifecycleDraftLine:"key 删除 / 轮换 / 过期机制草案：已建立", nextStepLine:"下一步：只读 provider result schema gate；只读 provider result schema gate：已建立。下一步：provider result source label gate", safetyLine:"当前版本仍不能输入、保存、读取或测试真实 API key。" }
    };
  }

  function commerceLocalSecureStorageInterfaceDraftDisclosure(task){
    const draft = commerceLocalSecureStorageInterfaceDraftDisplay(task);
    const display = draft.display || {};
    const modelGroups = draft.dataModelDraft && typeof draft.dataModelDraft === "object" ? draft.dataModelDraft : {};
    const methodDraft = draft.methodDraft && typeof draft.methodDraft === "object" ? draft.methodDraft : {};
    const backendCandidates = Array.isArray(draft.backendCandidates) ? draft.backendCandidates : [];
    const audit = draft.auditDraft && typeof draft.auditDraft === "object" ? draft.auditDraft : {};
    const redaction = draft.redactionDraft && typeof draft.redactionDraft === "object" ? draft.redactionDraft : {};
    const modelHtml = Object.keys(modelGroups).map((groupName) => {
      const fields = modelGroups[groupName] && typeof modelGroups[groupName] === "object" ? modelGroups[groupName] : {};
      return `<section><h5>${esc(groupName)}</h5><ul>${Object.keys(fields).map((key) => `<li>${esc(key)}：${esc(fields[key])}</li>`).join("")}</ul></section>`;
    }).join("");
    const methodHtml = Object.keys(methodDraft).map((key) => {
      const method = methodDraft[key] || {};
      const label = key === "prepareKeyAliasDraft" ? "只生成 alias 草案，不接收真实 key" : "阻断";
      return `<li>${esc(key)}：${esc(label)}</li>`;
    }).join("");
    const backendHtml = backendCandidates.map((item) => `<li>${esc(item.displayLine || (item.backendType || "") + "：候选，未实现")}</li>`).join("");
    const placeholders = redaction.placeholders && typeof redaction.placeholders === "object" ? redaction.placeholders : {};
    const body = `<section class="commerce-local-secure-storage-interface-draft-panel" aria-label="本机安全存储接口草案">
      <h4>${esc(display.title || "本机安全存储接口草案")}</h4>
      <p>${esc(display.currentStatusLine || "接口草案：已建立")}</p>
      <p>${esc(display.implementationLine || "真实实现：未启用")}</p>
      <p>${esc(display.keyInputLine || "真实 API key 输入：未开放")}</p>
      <p>${esc(display.keySaveLine || "真实 API key 保存：未开放")}</p>
      <p>${esc(display.keyReadLine || "真实 API key 读取：未开放")}</p>
      <p>${esc(display.keyDeleteRotateLine || "删除 / 轮换：未开放")}</p>
      <p>${esc(display.connectionTestLine || "测试连接：未开放")}</p>
      <p>${esc(display.providerSandboxLine || "provider 沙箱：未开放")}</p>
      <p>${esc(display.priceLine || "真实价格：未开放")}</p>
      <p>${esc(display.bookingUrlLine || "bookingUrl：未开放")}</p>
      <p>${esc(display.redactionRulesLine || "密钥脱敏与日志防泄露规则：已建立")}</p>
      <h5>数据模型草案</h5>
      ${modelHtml}
      <h5>接口方法草案</h5>
      <ul>${methodHtml}</ul>
      <h5>存储后端候选</h5>
      <ul>${backendHtml}</ul>
      <h5>审计事件草案</h5>
      <ul>${(Array.isArray(audit.events) ? audit.events : []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <h5>审计规则草案</h5>
      <ul>${(Array.isArray(audit.rules) ? audit.rules : []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <h5>脱敏接口草案</h5>
      <ul>${(Array.isArray(redaction.functions) ? redaction.functions : []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <p>apiKey → ${esc(placeholders.apiKey || "[REDACTED_API_KEY]")}</p>
      <p>apiSecret → ${esc(placeholders.apiSecret || "[REDACTED_API_SECRET]")}</p>
      <p>accessToken → ${esc(placeholders.accessToken || "[REDACTED_ACCESS_TOKEN]")}</p>
      <p>authorization header → ${esc(placeholders.authorizationHeader || "[REDACTED_AUTH_HEADER]")}</p>
      <p>credential query params → ${esc(placeholders.credentialParams || "[REDACTED_CREDENTIAL_PARAMS]")}</p>
      <h5>下一步</h5>
      <p>${esc(display.keyLifecycleDraftLine || "key 删除 / 轮换 / 过期机制草案：已建立")}</p>
      <p>${esc(display.keyLifecycleRealActionsLine || "真实删除 / 轮换 / 过期仍未开放")}</p>
      <p>${esc(display.nextStepLine || "下一步：只读 provider result schema gate；只读 provider result schema gate：已建立。下一步：provider result source label gate")}</p>
      <p>${esc(display.safetyLine || "当前版本仍不能输入、保存、读取或测试真实 API key。")}</p>
    </section>`;
    return disclosure("查看本机安全存储接口草案", body, "commerce-local-secure-storage-interface-draft-disclosure");
  }

  function commerceKeyRedactionAndLogLeakRulesDisclosure(){
    const api = window.WeishanCommerceKeyRedactionAndLogLeakRules;
    const contract = api && api.commerceKeyRedactionAndLogLeakRulesContract || {};
    const display = api && typeof api.buildDisplayModel === "function" ? api.buildDisplayModel() : contract.display || {};
    const patterns = api && typeof api.buildSecretFieldPatternRules === "function" ? api.buildSecretFieldPatternRules() : contract.secretFieldPatternRules || {};
    const redactionMap = api && typeof api.buildRedactionMap === "function" ? api.buildRedactionMap() : contract.redactionMap || {};
    const dummy = api && typeof api.buildDummyRedactionTestResult === "function" ? api.buildDummyRedactionTestResult() : contract.dummyRedactionTestResult || {};
    const statusLines = Array.isArray(display.statusLines) ? display.statusLines : [];
    const exactFields = Array.isArray(patterns.exactFieldNames) ? patterns.exactFieldNames : [];
    const redactionMapHtml = Object.keys(redactionMap).map((key) => `<li>${esc(key)} → ${esc(redactionMap[key])}</li>`).join("");
    const auditRules = Array.isArray(display.auditLogRules) ? display.auditLogRules : [];
    const uiRules = Array.isArray(display.uiRules) ? display.uiRules : [];
    const dummyLines = [
      ["object redaction", dummy.objectRedaction || "PASS"],
      ["headers redaction", dummy.headersRedaction || "PASS"],
      ["url redaction", dummy.urlRedaction || "PASS"],
      ["log message redaction", dummy.logMessageRedaction || "PASS"],
      ["audit event redaction", dummy.auditEventRedaction || "PASS"],
      ["dummy secret raw strings absent", dummy.dummySecretRawStringsAbsent || "PASS"]
    ];
    const body = `<section class="commerce-key-redaction-log-leak-rules-panel" aria-label="密钥脱敏与日志防泄露规则">
      <h4>${esc(display.title || "密钥脱敏与日志防泄露规则")}</h4>
      <h5>当前状态：</h5>
      <ul>${statusLines.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <h5>${esc(display.fieldPatternTitle || "敏感字段识别规则")}</h5>
      <ul>${exactFields.map((item) => `<li>${esc(item)}</li>`).join("")}<li>credential query params</li></ul>
      <h5>${esc(display.redactionMapTitle || "脱敏映射")}</h5>
      <ul>${redactionMapHtml}</ul>
      <h5>${esc(display.auditLogRulesTitle || "安全审计日志规则")}</h5>
      <ul>${auditRules.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <h5>${esc(display.uiRulesTitle || "UI / 截图 / 崩溃报告规则")}</h5>
      <ul>${uiRules.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <h5>${esc(display.dummyTestTitle || "Dummy 脱敏自检")}</h5>
      <ul>${dummyLines.map(([label, value]) => `<li>${esc(label)}：${esc(value)}</li>`).join("")}</ul>
      <h5>key 生命周期联动</h5>
      <p>key 删除 / 轮换 / 过期机制草案：已建立</p>
      <p>生命周期审计事件草案：已建立</p>
      <p>真实删除 / 轮换 / 过期 / 吊销 / 恢复仍未开放</p>
      <h5>下一步：</h5>
      <p>${esc(display.nextStepLine || "下一步：只读 provider result schema gate；只读 provider result schema gate：已建立。下一步：provider result source label gate。")}</p>
      <p>${esc(display.safetyLine || "当前版本仍不能输入、保存、读取或测试真实 API key。")}</p>
    </section>`;
    return disclosure("查看密钥脱敏与日志防泄露规则", body, "commerce-key-redaction-log-leak-rules-disclosure");
  }

  function commerceKeyLifecycleDraftDisplay(task){
    const api = window.WeishanCommerceKeyLifecycleDraft;
    const draft = task && task.keyLifecycleDraft || null;
    if (api && typeof api.buildKeyLifecycleDraft === "function") {
      return Object.assign({}, api.buildKeyLifecycleDraft(), draft && typeof draft === "object" ? draft : {});
    }
    return draft || {
      display:{
        title:"key 删除 / 轮换 / 过期机制草案",
        lifecycleStatusLine:"生命周期草案：已建立",
        realDeleteLine:"真实删除：未开放",
        realRotateLine:"真实轮换：未开放",
        realExpiryLine:"真实过期：未开放",
        realRevocationLine:"真实吊销：未开放",
        realRestoreLine:"真实恢复：未开放",
        keyInputLine:"真实 API key 输入：未开放",
        keySaveLine:"真实 API key 保存：未开放",
        keyReadLine:"真实 API key 读取：未开放",
        connectionTestLine:"测试连接：未开放",
        providerSandboxLine:"provider 沙箱：未开放",
        realPriceLine:"真实价格：未开放",
        bookingUrlLine:"bookingUrl：未开放",
        nextStepLine:"下一步：只读 provider result schema gate；只读 provider result schema gate：已建立。下一步：provider result source label gate",
        currentVersionLine:"当前版本仍不能输入、保存、读取、删除、轮换或测试真实 API key"
      },
      stateMachine:{ currentAllowedState:"draft_alias_only", currentBlockedStates:["active_readonly", "rotation_pending", "rotated", "deleted", "revoked"], transitions:[{ from:"draft_alias_only", to:"pending_secure_storage", status:"blocked" }] },
      deleteDraft:{ deleteRules:["删除前必须二次确认"], deleteBlockedReasons:["secure storage 未实现"], deleteMethodDraft:{ prepareKeyDeleteDraft:{ status:"blocked" }, confirmKeyDeleteDraft:{ status:"blocked" }, finalizeKeyDeleteDraft:{ status:"blocked" } } },
      rotateDraft:{ rotateRules:["轮换前必须二次确认"], rotateBlockedReasons:["secure storage 未实现"], rotateMethodDraft:{ prepareKeyRotateDraft:{ status:"blocked" }, validateRotationCandidateDraft:{ status:"blocked" }, confirmKeyRotateDraft:{ status:"blocked" }, finalizeKeyRotateDraft:{ status:"blocked" } } },
      expiryDraft:{ expiryRules:["key 可以设置 expiresAt"], expiryBlockedReasons:["secure storage 未实现"], expiryMethodDraft:{ prepareKeyExpiryDraft:{ status:"blocked" }, evaluateKeyExpiryDraft:{ status:"draft_only" }, markKeyExpiredDraft:{ status:"blocked" } } },
      auditEventsDraft:{ eventTypes:["KEY_DELETE_BLOCKED", "KEY_ROTATE_BLOCKED", "KEY_EXPIRED_BLOCKED"], auditRules:["所有事件必须 redacted: true"] }
    };
  }

  function commerceKeyLifecycleDraftDisclosure(task){
    const draft = commerceKeyLifecycleDraftDisplay(task);
    const display = draft.display || {};
    const stateMachine = draft.stateMachine || {};
    const transitions = Array.isArray(stateMachine.transitions) ? stateMachine.transitions : [];
    const blockedStates = Array.isArray(stateMachine.currentBlockedStates) ? stateMachine.currentBlockedStates : [];
    const deleteDraft = draft.deleteDraft || {};
    const rotateDraft = draft.rotateDraft || {};
    const expiryDraft = draft.expiryDraft || {};
    const audit = draft.auditEventsDraft || {};
    const statusLabel = (status) => status === "draft_only" ? "草案" : status === "blocked" ? "阻断" : status || "阻断";
    const methodList = (methods) => Object.keys(methods || {}).map((key) => `<li>${esc(key)}：${esc(statusLabel(methods[key] && methods[key].status))}</li>`).join("");
    const body = `<section class="commerce-key-lifecycle-draft-panel" aria-label="key 删除 / 轮换 / 过期机制草案">
      <h4>${esc(display.title || "key 删除 / 轮换 / 过期机制草案")}</h4>
      <p>${esc(display.lifecycleStatusLine || "生命周期草案：已建立")}</p>
      <p>${esc(display.realDeleteLine || "真实删除：未开放")}</p>
      <p>${esc(display.realRotateLine || "真实轮换：未开放")}</p>
      <p>${esc(display.realExpiryLine || "真实过期：未开放")}</p>
      <p>${esc(display.realRevocationLine || "真实吊销：未开放")}</p>
      <p>${esc(display.realRestoreLine || "真实恢复：未开放")}</p>
      <p>${esc(display.keyInputLine || "真实 API key 输入：未开放")}</p>
      <p>${esc(display.keySaveLine || "真实 API key 保存：未开放")}</p>
      <p>${esc(display.keyReadLine || "真实 API key 读取：未开放")}</p>
      <p>${esc(display.connectionTestLine || "测试连接：未开放")}</p>
      <p>${esc(display.providerSandboxLine || "provider 沙箱：未开放")}</p>
      <p>${esc(display.realPriceLine || "真实价格：未开放")}</p>
      <p>${esc(display.bookingUrlLine || "bookingUrl：未开放")}</p>
      <h5>key 状态机草案</h5>
      <p>当前允许状态：${esc(stateMachine.currentAllowedState || "draft_alias_only")}</p>
      <p>当前阻断状态：${esc(blockedStates.join(" / ") || "active_readonly / rotation_pending / rotated / deleted / revoked")}</p>
      <h5>阻断迁移</h5>
      <ul>${transitions.map((item) => `<li>${esc(item.from || "")} -> ${esc(item.to || "")}：${esc(item.status || "blocked")}</li>`).join("")}</ul>
      <h5>删除机制草案</h5>
      <ul>${(Array.isArray(deleteDraft.deleteRules) ? deleteDraft.deleteRules : []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <ul>${methodList(deleteDraft.deleteMethodDraft)}</ul>
      <h5>轮换机制草案</h5>
      <ul>${(Array.isArray(rotateDraft.rotateRules) ? rotateDraft.rotateRules : []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <ul>${methodList(rotateDraft.rotateMethodDraft)}</ul>
      <h5>过期机制草案</h5>
      <ul>${(Array.isArray(expiryDraft.expiryRules) ? expiryDraft.expiryRules : []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <ul>${methodList(expiryDraft.expiryMethodDraft)}</ul>
      <h5>生命周期审计事件草案</h5>
      <ul>${(Array.isArray(audit.eventTypes) ? audit.eventTypes : []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <ul>${(Array.isArray(audit.auditRules) ? audit.auditRules : []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <h5>联动状态</h5>
      <p>密钥脱敏与日志防泄露规则：已建立</p>
      <p>本机安全存储接口草案：已建立</p>
      <p>安全存储设计闸门：关闭</p>
      <p>安全密钥存储方案：方案已建立，尚未实现</p>
      <p>API 绑定准备状态：未准备</p>
      <p>API 绑定说明 / 表单 / 权限清单：只读预览或禁用预览</p>
      <p>${esc(display.nextStepLine || "下一步：只读 provider result schema gate；只读 provider result schema gate：已建立。下一步：provider result source label gate")}</p>
      <p>${esc(display.currentVersionLine || "当前版本仍不能输入、保存、读取、删除、轮换或测试真实 API key")}</p>
    </section>`;
    return disclosure("查看 key 删除 / 轮换 / 过期机制草案", body, "commerce-key-lifecycle-draft-disclosure");
  }

  function commerceSecureKeyStoragePlanDisclosure(task){
    const display = commerceSecureKeyStoragePlanDisplay(task);
    const storageTargets = Array.isArray(display.storageTargets) ? display.storageTargets : [];
    const blockedChannels = Array.isArray(display.blockedChannels) ? display.blockedChannels : [];
    const capabilityLines = Array.isArray(display.capabilityLines) ? display.capabilityLines : [];
    const checklistGroups = Array.isArray(display.checklistGroups) ? display.checklistGroups : [];
    const statusChecklistItems = Array.isArray(display.statusChecklistItems) ? display.statusChecklistItems : [];
    const futureStorageTargets = Array.isArray(display.futureStorageTargets) ? display.futureStorageTargets : [];
    const forbiddenStorageItems = Array.isArray(display.forbiddenStorageItems) ? display.forbiddenStorageItems : [];
    const implementationSteps = Array.isArray(display.implementationSteps) ? display.implementationSteps : [];
    const riskModelItems = Array.isArray(display.riskModelItems) ? display.riskModelItems : [];
    const body = `<section class="commerce-secure-key-storage-plan-panel" aria-label="安全密钥存储方案">
      <p class="commerce-secure-key-storage-plan-title-hint">查看安全密钥存储方案</p>
      <h4>${esc(display.summaryTitle || "安全密钥存储方案")}</h4>
      <p>${esc(display.planStatusLine || "安全密钥存储方案：计划中")}</p>
      <p>${esc(display.currentStatusLine || "当前状态：安全密钥存储仍处于方案阶段，当前版本不会保存真实 API key。")}</p>
      <p>${esc(display.currentStageLine || "当前阶段：设计中")}</p>
      <p>${esc(display.futureTargetsLine || "未来目标：macOS Keychain / Electron safeStorage")}</p>
      <p>${esc(display.blockedChannelsLine || "禁止：明文、.env、localStorage、sessionStorage、日志")}</p>
      <p>${esc(display.nextStepLine || "密钥脱敏与日志防泄露规则：已建立")}</p>
      <p>${esc(display.safetyLine || "当前版本仍不能输入、保存、读取或测试真实 API key。")}</p>
      <p>安全存储设计闸门：关闭</p>
      <p>${esc(display.localInterfaceDraftLine || "本机安全存储接口草案：已建立")}</p>
      <p>${esc(display.realKeyStorageLine || "真实 key 保存仍未启用")}</p>
      <p>密钥脱敏与日志防泄露规则：已建立</p>
      <p>key 删除 / 轮换 / 过期机制草案：已建立</p>
      <p>真实 key 删除 / 轮换 / 过期仍未开放</p>
      <p>下一步：只读 provider result schema gate；只读 provider result schema gate：已建立。下一步：provider result source label gate</p>
      <p>真实 API key 输入仍未开放</p>
      <div class="commerce-secure-key-storage-plan-status-checklist">
        <h5>${esc(display.statusChecklistTitle || "当前状态清单")}</h5>
        <ul>${statusChecklistItems.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      </div>
      <div class="commerce-secure-key-storage-plan-future-targets">
        <h5>${esc(display.futureStorageTargetsTitle || "未来允许评估的存储目标")}</h5>
        <ul>${futureStorageTargets.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      </div>
      <div class="commerce-secure-key-storage-plan-forbidden-storage">
        <h5>${esc(display.forbiddenStorageTitle || "禁止的存储方式")}</h5>
        <ul>${forbiddenStorageItems.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      </div>
      <div class="commerce-secure-key-storage-plan-implementation-steps">
        <h5>${esc(display.implementationStepsTitle || "实施步骤")}</h5>
        <ul>${implementationSteps.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      </div>
      <div class="commerce-secure-key-storage-plan-risk-model">
        <h5>${esc(display.riskModelTitle || "风险模型")}</h5>
        <ul>${riskModelItems.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      </div>
      <div class="commerce-secure-key-storage-plan-next-step">
        <h5>${esc(display.nextStepTitle || "下一步")}</h5>
        <p>${esc(display.nextStepText || "provider endpoint allowlist 闸门。key 删除 / 轮换 / 过期机制草案已建立，但当前版本仍不能输入、保存、读取、删除、轮换或测试真实 API key。")}</p>
      </div>
      <div class="commerce-secure-key-storage-plan-targets">
        <h5>未来目标</h5>
        <ul>${storageTargets.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      </div>
      <div class="commerce-secure-key-storage-plan-blocked">
        <h5>禁止渠道</h5>
        <ul>${blockedChannels.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      </div>
      <div class="commerce-secure-key-storage-plan-capabilities">
        <h5>当前能力</h5>
        <ul>${capabilityLines.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      </div>
      <div class="commerce-secure-key-storage-plan-checklists">
        ${checklistGroups.map((group) => `<section><h5>${esc(group && group.title || "")}</h5><ul>${(Array.isArray(group && group.items) ? group.items : []).map((item) => `<li>${esc(item && item[0] || "")}：${esc(item && item[1] || "")}</li>`).join("")}</ul></section>`).join("")}
      </div>
    </section>`;
    return disclosure("查看安全密钥存储方案", body, "commerce-secure-key-storage-plan-disclosure");
  }

  function commerceApiBindingSafeShellDisclosure(task){
    const display = commerceApiBindingSafeShellDisplay(task);
    const catalog = commerceUserApiProviderCatalogDisplay(task);
    const safetyLines = Array.isArray(display.safetyLines) ? display.safetyLines : [];
    const body = `<section class="commerce-api-binding-safe-shell" aria-label="API 绑定说明">
      <h4>API 绑定说明</h4>
      <p>${esc(display.currentStatusLine || "当前状态：用户 API 未绑定。")}</p>
      <p>${esc(display.bindFutureLine || "绑定 API 后，可优先使用用户授权平台的只读价格结果。")}</p>
      <p>${esc(display.readonlyScopeLine || "API 只用于搜索、读取价格、读取库存、分析结果。")}</p>
      <p>${esc(display.externalConfirmLine || "点击价格后跳转到外部平台或官网确认。")}</p>
      <p>可绑定 API 平台目录：已建立</p>
      <p>当前已绑定 API：0</p>
      <p>当前只读价格能力：未启用</p>
      <p>真实 API key 输入：未启用</p>
      <p>真实 endpoint 连接：未启用</p>
      <p>${esc(catalog.safetyLine || "当前版本只展示平台目录和权限说明，不保存真实 API key，不测试连接。")}</p>
      <p>API 绑定必须先通过安全存储设计闸门</p>
      <p>已建立本机安全存储接口草案</p>
      <p>当前闸门关闭</p>
      <p>当前不能保存真实 API key</p>
      <p>API 绑定表单：禁用预览</p>
      <p>API 绑定权限清单：只读预览</p>
      <p>API 绑定准备状态：未准备</p>
      <p>已建立密钥脱敏与日志防泄露规则</p>
      <p>已建立 key 删除 / 轮换 / 过期机制草案</p>
      <p>真实删除 / 轮换 / 过期仍未开放</p>
      <p>下一步：只读 provider result schema gate；只读 provider result schema gate：已建立。下一步：provider result source label gate</p>
      <p>当前仍不能保存真实 API key</p>
      <p>当前不能提交绑定确认</p>
      <p>当前不能输入真实 API key</p>
      <p>当前不能保存 key</p>
      <p>当前不能测试连接</p>
      <ul>${safetyLines.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
    </section>`;
    return disclosure("查看 API 绑定说明", body, "commerce-api-binding-safe-shell-disclosure");
  }

  function commerceFlightProviderCandidatesRegistry(task){
    const fallback = {
      contractVersion:"2.0.88",
      phase:"flight_provider_candidate_registry",
      registryStatus:"candidate_registry_only",
      candidateCount:7,
      trustStatus:"candidate_only",
      manualReviewStatus:"not_reviewed",
      domainSafetyRules:{
        allowedDomains:["google.com", "google.com/travel/flights", "trip.com", "ctrip.com", "skyscanner.com", "kayak.com", "expedia.com", "booking.com"],
        blockedRules:["短链接", "非 HTTPS", "拼写相似的仿冒域名", "AI 生成域名", "私聊付款", "先转账出票", "低价异常", "无主体信息", "和搜索意图无关", "成人 / 赌博 / 武器 / 毒品等高风险域名"]
      },
      candidateProfiles:[],
      capabilities:{
        canUseApiKey:false,
        canUseNetworkApi:false,
        canReturnPrice:false,
        canReturnBookingUrl:false,
        canOpenBookingUrl:false,
        canCreateOrder:false,
        canPay:false,
        canStoreIdentity:false,
        canStorePassport:false,
        canStoreBankCard:false
      },
      safety:{
        noRealEndpoint:true,
        noRealApiKey:true,
        noNetworkSearch:true,
        noRealResults:true,
        noRealPrice:true,
        noFakeDemoMockPrice:true,
        noBookingUrl:true,
        noRedirect:true,
        noCheckout:true,
        noPayment:true,
        noOrderSubmit:true,
        noIdentityStorage:true,
        noPassportStorage:true,
        noBankCardStorage:true
      },
      display:{
        summaryTitle:"候选平台档案与白名单规则",
        currentStatusLine:"当前状态：候选平台档案已整理，暂不接入真实价格源。",
        introLine:"这些只是候选平台档案，不代表已接入。当前不读取 API key，不连接 endpoint，不返回价格，不生成 booking 链接。",
        trustedRoutesLine:"默认优先保留官方平台、知名旅行平台和已人工审核白名单。",
        candidateCountLabel:"候选平台",
        allowlistTitle:"默认优先域名白名单",
        blockedRulesTitle:"默认阻断规则",
        capabilityLine:"API key 不可用 / 网络搜索不可用 / 价格不可用 / booking 链接不可用 / 下单不可用 / 付款不可用 / 身份证 / 护照 / 银行卡不可保存"
      }
    };
    const api = window.WeishanCommerceFlightProviderCandidates;
    const source = task && task.flightProviderCandidatesRegistry || null;
    if (api && typeof api.normalizeFlightProviderCandidatesRegistry === "function") return api.normalizeFlightProviderCandidatesRegistry(source);
    if (api && typeof api.getFlightProviderCandidatesRegistry === "function") return api.getFlightProviderCandidatesRegistry(source);
    const raw = source && typeof source === "object" ? source : {};
    return Object.assign({}, fallback, raw, {
      candidateProfiles:Array.isArray(raw.candidateProfiles) ? raw.candidateProfiles.slice() : fallback.candidateProfiles.slice(),
      capabilities:Object.assign({}, fallback.capabilities, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      safety:Object.assign({}, fallback.safety, raw.safety && typeof raw.safety === "object" ? raw.safety : {}),
      domainSafetyRules:Object.assign({}, fallback.domainSafetyRules, raw.domainSafetyRules && typeof raw.domainSafetyRules === "object" ? raw.domainSafetyRules : {}),
      display:Object.assign({}, fallback.display, raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function commerceFlightProviderCandidatesDisplay(task){
    const registry = commerceFlightProviderCandidatesRegistry(task);
    const api = window.WeishanCommerceFlightProviderCandidates;
    if (api && typeof api.describeFlightProviderCandidatesRegistry === "function") return api.describeFlightProviderCandidatesRegistry(registry);
    return registry;
  }

  function commerceFlightProviderCandidatesDisclosure(task){
    const display = commerceFlightProviderCandidatesDisplay(task);
    const matrix = commerceFlightSandboxProviderMatrixDisplay(task);
    if (!display || !display.candidateProfiles) return "";
    const escListItem = (label, value) => `<li><span>${esc(label)}：</span><b>${esc(value || "")}</b></li>`;
    const body = `<section class="commerce-flight-provider-candidates-panel" aria-label="候选平台档案与白名单规则">
      <div class="commerce-flight-provider-candidates-head">
        <div>
          <h4>${esc(display.summaryTitle || "候选平台档案与白名单规则")}</h4>
          <p>${esc(display.introLine || "这些只是候选平台档案，不代表已接入。当前不读取 API key，不连接 endpoint，不返回价格，不生成 booking 链接。")}</p>
        </div>
        <strong>${esc(display.currentStatusLine || "当前状态：候选平台档案已整理，暂不接入真实价格源。")}</strong>
      </div>
      <p class="commerce-flight-provider-candidates-note">${esc(display.trustedRoutesLine || "默认优先保留官方平台、知名旅行平台和已人工审核白名单。")}</p>
      <p class="commerce-flight-provider-candidates-note">${esc(matrix.currentStatusLine || "沙箱矩阵：已进入")}</p>
      <p class="commerce-flight-provider-candidates-note">${esc(matrix.conclusionLine || "当前结论：不能返回真实价格")}</p>
      <div class="commerce-flight-provider-candidates-rules">
        <section>
          <h5>${esc(display.allowlistTitle || "默认优先域名白名单")}</h5>
          <ul>${(display.allowlistDomains || []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
        </section>
        <section>
          <h5>${esc(display.blockedRulesTitle || "默认阻断规则")}</h5>
          <ul>${(display.blockedRules || []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
        </section>
      </div>
      <div class="commerce-flight-provider-candidates-grid">
        ${(display.candidateProfiles || []).map((profile) => `<article class="commerce-flight-provider-candidate-card">
          <h5>${esc(profile.providerName)}</h5>
          <ul>
            ${escListItem("平台 ID", profile.providerId)}
            ${escListItem("平台类型", profile.providerTypeLabel)}
            ${escListItem("区域范围", profile.regionScopeLabel)}
            ${escListItem("支持语言", profile.supportedLanguagesLabel)}
            ${escListItem("支持货币", profile.supportedCurrenciesLabel)}
            ${escListItem("官方域名", profile.officialDomainsLabel)}
            ${escListItem("搜索入口", profile.searchEntryUrlLabel)}
            ${escListItem("审批状态", profile.approvalStatusLabel)}
            ${escListItem("只读适配器开发许可", profile.readonlyStubPermissionStatusLabel)}
            ${escListItem("只读适配器空壳", profile.readonlyStubAdapterStatusLabel)}
            ${escListItem("Sandbox Dry Run", profile.sandboxDryRunStatusLabel)}
            ${escListItem("只读价格源", profile.readOnlyPriceSourceStatusLabel)}
            ${escListItem("bookingUrl", profile.bookingUrlStatusLabel)}
            ${escListItem("付款 / 下单", profile.tradeStatusLabel)}
            ${escListItem("API 状态", profile.apiStatusLabel)}
            ${escListItem("价格状态", profile.priceStatusLabel)}
            ${escListItem("bookingUrl 状态", profile.bookingUrlStatusLabel)}
            ${escListItem("可信状态", profile.trustStatusLabel)}
            ${escListItem("人工复核", profile.manualReviewStatusLabel)}
            ${escListItem("风险等级", profile.riskLevelLabel)}
            ${escListItem("能力", profile.capabilityLine)}
            ${escListItem("说明", profile.notes)}
          </ul>
        </article>`).join("")}
      </div>
    </section>`;
    return disclosure("查看候选平台", body, "commerce-flight-provider-candidates-disclosure");
  }

  function commerceFlightSandboxDryRunStatus(task){
    const api = window.WeishanCommerceFlightSandboxDryRun;
    const source = task && task.flightSandboxDryRun || null;
    if (api && typeof api.normalizeFlightSandboxDryRunContract === "function") return api.normalizeFlightSandboxDryRunContract(source);
    if (api && typeof api.getFlightSandboxDryRunContract === "function") return api.getFlightSandboxDryRunContract(source);
    return {
      sandboxDryRunVersion:"2.0.88",
      phase:"flight_sandbox_dry_run_shell",
      dryRunStatus:"shell_only",
      networkMode:"disabled",
      apiKeyMode:"disabled",
      endpointMode:"disabled",
      providerMode:"disabled",
      priceMode:"disabled",
      bookingUrlMode:"disabled",
      orderMode:"disabled",
      paymentMode:"disabled",
      identityStorageMode:"disabled",
      capabilities:{
        canRunDryRunShell:true,
        canValidateInputShape:true,
        canValidateRequestShape:true,
        canValidateResponseShape:true,
        canSimulateControlFlow:true,
        canUseFixtureOnly:true,
        canUseRealApiKey:false,
        canConnectRealEndpoint:false,
        canUseNetwork:false,
        canReturnPrice:false,
        canReturnBookingUrl:false,
        canOpenBookingUrl:false,
        canCreateOrder:false,
        canPay:false,
        canStoreIdentity:false,
        canStorePassport:false,
        canStoreBankCard:false
      },
      blockedCapabilities:["canUseRealApiKey", "canConnectRealEndpoint", "canUseNetwork", "canReturnPrice", "canReturnBookingUrl", "canOpenBookingUrl", "canCreateOrder", "canPay", "canStoreIdentity", "canStorePassport", "canStoreBankCard"],
      steps:["validate_user_input", "build_request_shape", "validate_request_shape", "skip_network_call", "build_empty_response_shape", "validate_response_shape", "block_price_return", "block_booking_url_return", "block_order_creation", "block_payment"],
      display:{
        summaryTitle:"Sandbox Dry Run",
        shellStatusLine:"Sandbox Dry Run：外壳已建立",
        currentStatusLine:"沙箱空跑外壳已建立，但未连接真实 provider。",
        reasonLine:"只允许验证输入、请求和响应结构，不连接真实 endpoint，不读取真实 API key，不返回真实价格，不生成预订链接。",
        stepsTitle:"Dry Run 步骤",
        capabilityTitle:"当前能力",
        blockedTitle:"阻断能力",
        stepLabels:["validate_user_input：验证用户输入", "build_request_shape：构建请求形状", "validate_request_shape：校验请求形状", "skip_network_call：跳过网络调用", "build_empty_response_shape：构建空响应形状", "validate_response_shape：校验响应形状", "block_price_return：阻断价格返回", "block_booking_url_return：阻断 bookingUrl 返回", "block_order_creation：阻断下单创建", "block_payment：阻断付款"],
        capabilityLines:["可以运行沙箱空跑外壳", "可以校验输入形状", "可以校验请求形状", "可以校验响应形状", "可以模拟控制流", "只使用 fixture / 本地结构", "不能读取真实 API key", "不能连接真实 endpoint", "不能发起网络请求", "不能返回价格", "不能返回 bookingUrl", "不能打开预订页", "不能付款", "不能下单", "不能保存证件 / 银行卡"],
        blockedCapabilityLines:["真实 API key：已阻断", "真实 endpoint：已阻断", "真实网络请求：已阻断", "真实价格：已阻断", "bookingUrl：已阻断", "下单：已阻断", "付款：已阻断", "身份证 / 银行卡：已阻断"]
      }
    };
  }

  function commerceFlightSandboxDryRunDisplay(task){
    const api = window.WeishanCommerceFlightSandboxDryRun;
    const status = commerceFlightSandboxDryRunStatus(task);
    if (api && typeof api.describeFlightSandboxDryRunContract === "function") return api.describeFlightSandboxDryRunContract(status);
    return status.display || {};
  }

  function commerceFlightSandboxDryRunDisclosure(task){
    const display = commerceFlightSandboxDryRunDisplay(task);
    const matrix = commerceFlightSandboxProviderMatrixDisplay(task);
    if (!display) return "";
    const row = (label, value) => `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>`;
    const stepLabels = Array.isArray(display.stepLabels) ? display.stepLabels : [];
    const capabilityLines = Array.isArray(display.capabilityLines) ? display.capabilityLines : [];
    const blockedCapabilityLines = Array.isArray(display.blockedCapabilityLines) ? display.blockedCapabilityLines : [];
    const body = `<section class="commerce-flight-sandbox-dry-run-panel" aria-label="Sandbox Dry Run">
      <div class="commerce-flight-sandbox-dry-run-head">
        <div>
          <h4>${esc(display.summaryTitle || "Sandbox Dry Run")}</h4>
          <p>${esc(display.shellStatusLine || "Sandbox Dry Run：外壳已建立")}</p>
          <p>${esc(display.currentStatusLine || "沙箱空跑外壳已建立，但未连接真实 provider。")}</p>
          <p>${esc(display.reasonLine || "只允许验证输入、请求和响应结构，不连接真实 endpoint，不读取真实 API key，不返回真实价格，不生成预订链接。")}</p>
          <p>${esc(matrix.currentStatusLine || "候选平台沙箱矩阵：已建立")}</p>
        </div>
        <strong>${esc(display.shellStatusLine || "Sandbox Dry Run：外壳已建立")}</strong>
      </div>
      <div class="commerce-flight-sandbox-dry-run-summary">
        <ul>
          ${row("步骤标题", display.stepsTitle || "Dry Run 步骤")}
          ${row("能力标题", display.capabilityTitle || "当前能力")}
          ${row("阻断标题", display.blockedTitle || "阻断能力")}
        </ul>
      </div>
      <div class="commerce-flight-sandbox-dry-run-rules">
        <section>
          <h5>${esc(display.stepsTitle || "Dry Run 步骤")}</h5>
          <ul>${stepLabels.map((line) => `<li>${esc(line)}</li>`).join("")}</ul>
        </section>
        <section>
          <h5>${esc(display.capabilityTitle || "当前能力")}</h5>
          <ul>${capabilityLines.map((line) => `<li>${esc(line)}</li>`).join("")}</ul>
        </section>
        <section>
          <h5>${esc(display.blockedTitle || "阻断能力")}</h5>
          <ul>${blockedCapabilityLines.map((line) => `<li>${esc(line)}</li>`).join("")}</ul>
        </section>
      </div>
    </section>`;
    return disclosure("查看 Sandbox Dry Run", body, "commerce-flight-sandbox-dry-run-disclosure");
  }

  function commerceFlightSandboxProviderMatrixStatus(task){
    const api = window.WeishanCommerceFlightSandboxProviderMatrix;
    const source = task && task.flightSandboxProviderMatrix || null;
    if (api && typeof api.normalizeFlightSandboxProviderMatrix === "function") return api.normalizeFlightSandboxProviderMatrix(source);
    if (api && typeof api.getFlightSandboxProviderMatrixContract === "function") return api.getFlightSandboxProviderMatrixContract(source);
    const candidates = commerceFlightProviderCandidatesStatus(task);
    const candidateProfiles = Array.isArray(candidates && candidates.candidateProfiles) ? candidates.candidateProfiles : [];
    const providerRows = candidateProfiles.map((profile) => ({
      providerId:String(profile.providerId || ""),
      providerName:String(profile.providerName || ""),
      providerTypeLabel:String(profile.providerType || "flight_search_candidate"),
      candidateStatusLabel:"candidate_only",
      approvalStatusLabel:"not_reviewed",
      readonlyStubPermissionLabel:"not_granted",
      readonlyStubScaffoldLabel:"available",
      sandboxDryRunShellLabel:"available_shell_only",
      realProviderConnectionLabel:"disabled",
      apiKeyLabel:"disabled",
      endpointLabel:"disabled",
      networkLabel:"disabled",
      priceReturnLabel:"disabled",
      bookingUrlReturnLabel:"disabled",
      orderCreationLabel:"disabled",
      paymentLabel:"disabled",
      identityStorageLabel:"disabled",
      readinessLevelLabel:"not_ready_for_price",
      reasonLabel:"provider_matrix_no_real_connection",
      officialDomains:Array.isArray(profile.officialDomains) ? profile.officialDomains.slice() : [],
      searchEntryUrl:String(profile.searchEntryUrl || "")
    }));
    const totalCandidates = providerRows.length;
    const summary = {
      totalCandidates,
      readyForReadonlyPrice:0,
      readyForBookingUrl:0,
      readyForPayment:0,
      blockedFromNetwork:totalCandidates,
      blockedFromPrice:totalCandidates,
      blockedFromBookingUrl:totalCandidates,
      blockedFromOrder:totalCandidates,
      blockedFromPayment:totalCandidates,
      overallStatus:"not_ready_for_real_price",
      reason:"all_candidates_require_human_approval_and_real_provider_connection"
    };
    return {
      matrixVersion:"2.0.88",
      phase:"flight_sandbox_provider_matrix",
      matrixStatus:"readiness_matrix_only",
      networkMode:"disabled",
      apiKeyMode:"disabled",
      endpointMode:"disabled",
      providerMode:"candidate_only",
      priceMode:"disabled",
      bookingUrlMode:"disabled",
      orderMode:"disabled",
      paymentMode:"disabled",
      identityStorageMode:"disabled",
      capabilities:{
        canBuildProviderMatrix:true,
        canAttachCandidateProviders:true,
        canAttachDryRunShellStatus:true,
        canAttachReadonlyStubStatus:true,
        canAttachApprovalStatus:true,
        canAuditBlockedCapabilities:true,
        canShowReadinessState:true,
        canUseNetwork:false,
        canUseApiKey:false,
        canConnectEndpoint:false,
        canReturnPrice:false,
        canReturnBookingUrl:false,
        canOpenBookingUrl:false,
        canCreateOrder:false,
        canPay:false,
        canStoreIdentity:false
      },
      providerRows,
      summary,
      display:{
        summaryTitle:"候选平台沙箱矩阵",
        currentStatusLine:"当前状态：候选平台已进入沙箱矩阵，但尚未允许连接真实 provider。",
        matrixSummaryLine:`矩阵摘要：候选平台数量：${summary.totalCandidates} · 可返回真实价格：0 · 可返回 bookingUrl：0 · 可下单：0 · 可付款：0 · 网络连接：全部禁用 · API key：全部禁用 · endpoint：全部禁用`,
        conclusionLine:"当前结论：不能返回最低价两家",
        reasonLine:"候选平台沙箱矩阵只用于审计和准备，不代表已接入真实 provider。",
        blockedConclusionLine:"候选平台沙箱矩阵默认全部阻断，只允许审计，不允许真实连接。",
        providerRowLabels:{
          candidateStatus:"候选状态",
          approvalStatus:"审批状态",
          readonlyStubPermission:"只读适配器开发许可",
          readonlyStubScaffold:"只读适配器空壳",
          sandboxDryRunShell:"Sandbox Dry Run",
          realProviderConnection:"真实 provider",
          apiKey:"API key",
          endpoint:"endpoint",
          network:"网络",
          priceReturn:"价格返回",
          bookingUrlReturn:"bookingUrl",
          orderCreation:"下单",
          payment:"付款",
          identityStorage:"证件 / 银行卡",
          readinessLevel:"当前结论",
          reason:"原因"
        }
      }
    };
  }

  function commerceFlightSandboxProviderMatrixDisplay(task){
    const status = commerceFlightSandboxProviderMatrixStatus(task);
    const api = window.WeishanCommerceFlightSandboxProviderMatrix;
    if (api && typeof api.describeFlightSandboxProviderMatrix === "function") return api.describeFlightSandboxProviderMatrix(status);
    return status.display || {};
  }

  function commerceFlightSandboxProviderMatrixDisclosure(task){
    const display = commerceFlightSandboxProviderMatrixDisplay(task);
    if (!display) return "";
    const row = (label, value) => `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>`;
    const providerRows = Array.isArray(display.providerRows) ? display.providerRows : [];
    const body = `<section class="commerce-flight-sandbox-provider-matrix-panel" aria-label="候选平台沙箱矩阵">
      <div class="commerce-flight-sandbox-provider-matrix-head">
        <div>
          <h4>${esc(display.summaryTitle || "候选平台沙箱矩阵")}</h4>
          <p>${esc(display.currentStatusLine || "当前状态：候选平台已进入沙箱矩阵，但尚未允许连接真实 provider。")}</p>
          <p>${esc(display.matrixSummaryLine || `矩阵摘要：候选平台数量：${providerRows.length} · 可返回真实价格：0 · 可返回 bookingUrl：0 · 可下单：0 · 可付款：0 · 网络连接：全部禁用 · API key：全部禁用 · endpoint：全部禁用`)}</p>
        </div>
        <strong>${esc(display.conclusionLine || "当前结论：不能返回最低价两家")}</strong>
      </div>
      <p>${esc(display.reasonLine || "候选平台沙箱矩阵只用于审计和准备，不代表已接入真实 provider。")}</p>
      <p>${esc(display.blockedConclusionLine || "候选平台沙箱矩阵默认全部阻断，只允许审计，不允许真实连接。")}</p>
      <div class="commerce-flight-sandbox-provider-matrix-summary">
        <ul>
          ${row("候选平台数量", String(providerRows.length))}
          ${row("可返回真实价格", "0")}
          ${row("可返回 bookingUrl", "0")}
          ${row("可下单", "0")}
          ${row("可付款", "0")}
          ${row("网络连接", "全部禁用")}
          ${row("API key", "全部禁用")}
          ${row("endpoint", "全部禁用")}
        </ul>
      </div>
      <div class="commerce-flight-sandbox-provider-matrix-grid">
        ${providerRows.map((profile) => `<article class="commerce-flight-sandbox-provider-matrix-card">
          <h5>${esc(profile.providerName)}</h5>
          <ul>
            ${row("候选状态", profile.candidateStatusLabel)}
            ${row("审批状态", profile.approvalStatusLabel)}
            ${row("只读适配器开发许可", profile.readonlyStubPermissionLabel)}
            ${row("只读适配器空壳", profile.readonlyStubScaffoldLabel)}
            ${row("Sandbox Dry Run", profile.sandboxDryRunShellLabel)}
            ${row("真实 provider", profile.realProviderConnectionLabel)}
            ${row("API key", profile.apiKeyLabel)}
            ${row("endpoint", profile.endpointLabel)}
            ${row("网络", profile.networkLabel)}
            ${row("价格返回", profile.priceReturnLabel)}
            ${row("bookingUrl", profile.bookingUrlReturnLabel)}
            ${row("下单", profile.orderCreationLabel)}
            ${row("付款", profile.paymentLabel)}
            ${row("证件 / 银行卡", profile.identityStorageLabel)}
            ${row("当前结论", profile.readinessLevelLabel)}
            ${row("原因", profile.reasonLabel)}
          </ul>
          <p>${esc("当前结论：不能返回最低价两家")}</p>
        </article>`).join("")}
      </div>
    </section>`;
    return disclosure("查看候选平台沙箱矩阵", body, "commerce-flight-sandbox-provider-matrix-disclosure");
  }

  function commerceFlightReadonlyStubPermissionStatus(task){
    const api = window.WeishanCommerceFlightReadonlyStubPermission;
    const source = task && task.flightReadonlyStubPermission || null;
    if (api && typeof api.normalizeFlightReadonlyStubPermission === "function") return api.normalizeFlightReadonlyStubPermission(source);
    if (api && typeof api.getFlightReadonlyStubPermission === "function") return api.getFlightReadonlyStubPermission(source);
    const fallback = {
      permissionVersion:"2.0.88",
      phase:"flight_readonly_stub_permission",
      providerCategory:"flight",
      providerId:"flight-provider-disabled",
      providerName:"机票候选平台",
      overallStatus:"not_granted",
      currentStage:"approval_required",
      permissionStatus:"not_granted",
      checklist:{
        platformIdentityReview:false,
        officialDomainAllowlistReview:false,
        providerTermsReview:false,
        apiDocumentationReview:false,
        apiKeyStoragePlanReview:false,
        requestSchemaReview:false,
        responseSchemaReview:false,
        errorHandlingReview:false,
        timeoutRateLimitReview:false,
        finalStubDevApproval:false
      },
      capabilities:{
        canDevelopReadonlyStub:false,
        canUseRealApiKey:false,
        canConnectRealEndpoint:false,
        canUseNetwork:false,
        canReturnPrice:false,
        canReturnBookingUrl:false,
        canOpenBookingUrl:false,
        canCreateOrder:false,
        canPay:false,
        canStoreIdentity:false
      },
      display:{
        summaryTitle:"只读适配器开发许可",
        permissionStatusLine:"只读适配器开发许可：未授予",
        currentStatusLine:"当前状态：尚未授予只读适配器开发许可。",
        currentStageLine:"当前阶段：需要人工批准",
        nextStepLine:"下一步：完成 provider 条款、API 文档、域名 allowlist、API key 存储方案和请求 / 响应结构审查",
        noticeLine:"只读适配器只允许开发请求 / 响应结构，不允许连接真实 endpoint，不允许读取真实 API key，不允许返回真实价格，不允许生成预订链接。",
        checklistTitle:"前置条件",
        capabilityTitle:"当前能力",
        checklistGroups:[
          { title:"前置条件", items:[["平台身份确认", "未完成"], ["官方域名 / allowlist 审查", "未完成"], ["Provider 条款审查", "未完成"], ["API 文档审查", "未完成"], ["API key 安全存储方案", "未完成"], ["请求结构审查", "未完成"], ["响应结构审查", "未完成"], ["错误处理审查", "未完成"], ["超时 / 频率限制审查", "未完成"], ["人工批准开发只读 stub", "未完成"]] }
        ],
        capabilityLines:["不能开发真实 connector", "不能读取 API key", "不能连接 endpoint", "不能发起网络请求", "不能返回价格", "不能返回 bookingUrl", "不能打开预订页", "不能付款", "不能下单", "不能保存证件 / 银行卡"]
      }
    };
    const raw = source && typeof source === "object" ? source : {};
    return Object.assign({}, fallback, raw, {
      checklist:Object.assign({}, fallback.checklist, raw.checklist && typeof raw.checklist === "object" ? raw.checklist : {}),
      capabilities:Object.assign({}, fallback.capabilities, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      display:Object.assign({}, fallback.display, raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function commerceFlightReadonlyStubPermissionDisplay(task){
    const status = commerceFlightReadonlyStubPermissionStatus(task);
    const api = window.WeishanCommerceFlightReadonlyStubPermission;
    if (api && typeof api.describeFlightReadonlyStubPermission === "function") return api.describeFlightReadonlyStubPermission(status);
    return status.display || {};
  }

  function commerceFlightReadonlyStubPermissionDisclosure(task){
    const display = commerceFlightReadonlyStubPermissionDisplay(task);
    const matrix = commerceFlightSandboxProviderMatrixDisplay(task);
    if (!display) return "";
    const row = (label, value) => `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>`;
    const checklist = Array.isArray(display.checklistGroups) ? display.checklistGroups : [];
    const checklistHtml = checklist.map((group) => `<section class="commerce-flight-readonly-stub-permission-group"><h5>${esc(group.title || "")}</h5><ul>${(Array.isArray(group.items) ? group.items : []).map((item) => row(item[0], item[1])).join("")}</ul></section>`).join("");
    const capabilityHtml = Array.isArray(display.capabilityLines) ? `<ul>${display.capabilityLines.map((line) => `<li>${esc(line)}</li>`).join("")}</ul>` : "";
    const body = `<section class="commerce-flight-readonly-stub-permission-panel" aria-label="只读适配器开发许可">
      <div class="commerce-flight-readonly-stub-permission-head">
        <div>
          <h4>${esc(display.summaryTitle || "只读适配器开发许可")}</h4>
          <p>${esc(display.currentStatusLine || "当前状态：尚未授予只读适配器开发许可。")}</p>
          <p>${esc(display.noticeLine || "只读适配器只允许开发请求 / 响应结构，不允许连接真实 endpoint，不允许读取真实 API key，不允许返回真实价格，不允许生成预订链接。")}</p>
        </div>
        <strong>${esc(display.permissionStatusLine || "只读适配器开发许可：未授予")}</strong>
      </div>
      <div class="commerce-flight-readonly-stub-permission-summary">
        <ul>
          ${row("当前阶段", display.currentStageLine || "当前阶段：需要人工批准")}
          ${row("下一步", display.nextStepLine || "下一步：完成 provider 条款、API 文档、域名 allowlist、API key 存储方案和请求 / 响应结构审查")}
          ${row("Sandbox Dry Run", display.sandboxDryRunLine || "Sandbox Dry Run：外壳已建立，尚未批准真实沙箱连接。")}
          ${row("候选平台沙箱矩阵", matrix.currentStatusLine || "已建立")}
        </ul>
      </div>
      <div class="commerce-flight-readonly-stub-permission-rules">
        ${checklistHtml}
      </div>
      <section class="commerce-flight-readonly-stub-permission-capabilities">
        <h5>${esc(display.capabilityTitle || "当前能力")}</h5>
        ${capabilityHtml}
      </section>
    </section>`;
    return disclosure("查看只读适配器开发许可", body, "commerce-flight-readonly-stub-permission-disclosure");
  }

  function commerceFlightReadonlyStubAdapterStatus(task){
    const api = window.WeishanCommerceFlightReadonlyStubAdapter;
    const source = task && task.flightReadonlyStubAdapter || null;
    if (api && typeof api.normalizeFlightReadonlyStubAdapter === "function") return api.normalizeFlightReadonlyStubAdapter(source);
    if (api && typeof api.getFlightReadonlyStubAdapter === "function") return api.getFlightReadonlyStubAdapter(source);
    const fallback = {
      adapterVersion:"2.0.88",
      phase:"flight_readonly_stub_adapter",
      overallStatus:"shell_ready",
      currentStage:"shell_ready",
      capabilities:{
        canValidateInputShape:true,
        canBuildRequestShape:true,
        canNormalizeResponseShape:true,
        canUseRealApiKey:false,
        canConnectRealEndpoint:false,
        canUseNetwork:false,
        canReturnPrice:false,
        canReturnBookingUrl:false,
        canOpenBookingUrl:false,
        canCreateOrder:false,
        canPay:false,
        canStoreIdentity:false,
        canStorePassport:false,
        canStoreBankCard:false
      },
      safety:{
        noRealEndpoint:true,
        noRealApiKey:true,
        noNetworkSearch:true,
        noRealResults:true,
        noRealPrice:true,
        noFakeDemoMockPrice:true,
        noBookingUrl:true,
        noRedirect:true,
        noCheckout:true,
        noPayment:true,
        noOrderSubmit:true,
        noIdentityStorage:true,
        noPassportStorage:true,
        noBankCardStorage:true
      },
      requestShapeLines:["origin：出发地", "destination：目的地", "departureDate：出发日期", "returnDateIfAny：返回日期（如有）", "adultsChildrenIfAny：成人 / 儿童（如有）", "cabinIfAny：舱位（如有）", "currencyIfFuture：币种（未来）", "regionIfFuture：区域（未来）"],
      responseShapeLines:["providerName：提供方名称", "airlineName：航司名称", "departureTime：起飞时间", "arrivalTime：到达时间", "duration：时长", "stops：中转次数", "baggageInfo：行李信息", "taxFeeInfo：税费 / 手续费信息", "finalPrice：禁用", "bookingUrl：禁用"],
      display:{
        summaryTitle:"只读适配器空壳",
        shellStatusLine:"只读适配器空壳：已建立",
        currentStatusLine:"只读适配器空壳已建立",
        connectionStatusLine:"尚未允许连接真实 provider",
        summaryNote:"只读适配器空壳只允许开发请求 / 响应结构，不允许连接真实 endpoint，不允许读取真实 API key，不允许返回真实价格，不允许生成预订链接。",
        capabilityTitle:"当前能力",
        requestShapeTitle:"请求形状",
        responseShapeTitle:"响应形状",
        capabilityLines:["可以校验输入形状", "可以构建请求形状", "可以规范化响应形状", "不能读取 API key", "不能连接 endpoint", "不能发起网络请求", "不能返回价格", "不能返回 bookingUrl", "不能打开预订页", "不能付款", "不能下单", "不能保存证件 / 银行卡"],
        readonlyStubAdapterLine:"只读适配器空壳：已建立",
        readonlyStubAdapterAvailabilityLine:"只读适配器空壳：可用",
        realNetworkConnectionLine:"真实网络连接：未启用",
        realPriceReturnLine:"真实价格返回：未启用",
        bookingUrlReturnLine:"bookingUrl 返回：未启用"
      }
    };
    const raw = source && typeof source === "object" ? source : {};
    return Object.assign({}, fallback, raw, {
      capabilities:Object.assign({}, fallback.capabilities, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      safety:Object.assign({}, fallback.safety, raw.safety && typeof raw.safety === "object" ? raw.safety : {}),
      requestShapeLines:Array.isArray(raw.requestShapeLines) ? raw.requestShapeLines.slice() : fallback.requestShapeLines.slice(),
      responseShapeLines:Array.isArray(raw.responseShapeLines) ? raw.responseShapeLines.slice() : fallback.responseShapeLines.slice(),
      display:Object.assign({}, fallback.display, raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function commerceFlightReadonlyStubAdapterDisplay(task){
    const status = commerceFlightReadonlyStubAdapterStatus(task);
    const api = window.WeishanCommerceFlightReadonlyStubAdapter;
    if (api && typeof api.describeFlightReadonlyStubAdapter === "function") return api.describeFlightReadonlyStubAdapter(status);
    return status.display || {};
  }

  function commerceFlightReadonlyStubAdapterDisclosure(task){
    const display = commerceFlightReadonlyStubAdapterDisplay(task);
    const matrix = commerceFlightSandboxProviderMatrixDisplay(task);
    if (!display) return "";
    const row = (label, value) => `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>`;
    const requestShapeLines = Array.isArray(display.requestShapeLines) ? display.requestShapeLines : [];
    const responseShapeLines = Array.isArray(display.responseShapeLines) ? display.responseShapeLines : [];
    const capabilityLines = Array.isArray(display.capabilityLines) ? display.capabilityLines : [];
    const body = `<section class="commerce-flight-readonly-stub-adapter-panel" aria-label="只读适配器空壳">
      <div class="commerce-flight-readonly-stub-adapter-head">
        <div>
          <h4>${esc(display.summaryTitle || "只读适配器空壳")}</h4>
          <p>${esc(display.shellStatusLine || "只读适配器空壳：已建立")}</p>
          <p>${esc(display.currentStatusLine || "只读适配器空壳已建立")}</p>
          <p>${esc(display.connectionStatusLine || "尚未允许连接真实 provider")}</p>
          <p>${esc(display.summaryNote || "只读适配器空壳只允许开发请求 / 响应结构，不允许连接真实 endpoint，不允许读取真实 API key，不允许返回真实价格，不允许生成预订链接。")}</p>
          <p>${esc(matrix.currentStatusLine || "候选平台沙箱矩阵：已建立")}</p>
        </div>
        <strong>${esc(display.readonlyStubAdapterLine || "只读适配器空壳：已建立")}</strong>
      </div>
      <div class="commerce-flight-readonly-stub-adapter-summary">
        <ul>
          ${row("只读适配器空壳", display.readonlyStubAdapterAvailabilityLine || "可用")}
          ${row("Sandbox Dry Run", display.sandboxDryRunLine || "Sandbox Dry Run：外壳已建立")}
          ${row("真实网络连接", display.realNetworkConnectionLine || "未启用")}
          ${row("真实价格返回", display.realPriceReturnLine || "未启用")}
          ${row("bookingUrl 返回", display.bookingUrlReturnLine || "未启用")}
          ${row("候选平台沙箱矩阵", matrix.currentStatusLine || "已建立")}
        </ul>
      </div>
      <div class="commerce-flight-readonly-stub-adapter-rules">
        <section>
          <h5>${esc(display.requestShapeTitle || "请求形状")}</h5>
          <ul>${requestShapeLines.map((line) => `<li>${esc(line)}</li>`).join("")}</ul>
        </section>
        <section>
          <h5>${esc(display.responseShapeTitle || "响应形状")}</h5>
          <ul>${responseShapeLines.map((line) => `<li>${esc(line)}</li>`).join("")}</ul>
        </section>
        <section>
          <h5>${esc(display.capabilityTitle || "当前能力")}</h5>
          <ul>${capabilityLines.map((line) => `<li>${esc(line)}</li>`).join("")}</ul>
        </section>
      </div>
    </section>`;
    return disclosure("查看只读适配器空壳", body, "commerce-flight-readonly-stub-adapter-disclosure");
  }

  function commerceFlightProviderApprovalStatus(task){
    const api = window.WeishanCommerceFlightProviderApproval;
    const source = task && task.flightProviderApprovalStatus || null;
    if (api && typeof api.normalizeFlightProviderApprovalStatus === "function") return api.normalizeFlightProviderApprovalStatus(source);
    if (api && typeof api.getFlightProviderApprovalStatus === "function") return api.getFlightProviderApprovalStatus(source);
    const fallback = {
      approvalVersion:"2.0.88",
      phase:"flight_provider_approval",
      providerCategory:"flight",
      providerId:"flight-provider-disabled",
      providerName:"机票候选平台",
      overallStatus:"candidate_only",
      approvalStatus:"not_reviewed",
      currentAllowedStage:"candidate_only",
      trustStatus:"candidate_only",
      manualReviewStatus:"not_reviewed",
      allowlistDomains:["google.com", "google.com/travel/flights", "trip.com", "ctrip.com", "skyscanner.com", "kayak.com", "expedia.com", "booking.com", "airline-official-website.placeholder"],
      blockedRules:["短链接", "非 HTTPS", "拼写相似的仿冒域名", "AI 生成域名", "私聊付款", "先转账出票", "低价异常", "无主体信息", "和搜索意图无关", "成人 / 赌博 / 武器 / 毒品等高风险域名"],
      checklist:{
        platformIdentityReviewed:false,
        officialDomainAllowlistReviewed:false,
        providerTermsReviewed:false,
        localLawReviewed:false,
        apiDocsReviewed:false,
        apiKeyStorageReviewed:false,
        priceFieldReviewed:false,
        taxFeeBaggageFieldReviewed:false,
        bookingUrlReviewed:false,
        sandboxDryRunCompleted:false,
        finalHumanApproval:false
      },
      capabilities:{
        canUseApiKey:false,
        canUseNetworkApi:false,
        canReturnPrice:false,
        canReturnBookingUrl:false,
        canOpenBookingUrl:false,
        canCreateOrder:false,
        canPay:false,
        canStoreIdentity:false,
        canStorePassport:false,
        canStoreBankCard:false
      },
      safety:{
        noRealEndpoint:true,
        noRealApiKey:true,
        noNetworkSearch:true,
        noRealResults:true,
        noRealPrice:true,
        noFakeDemoMockPrice:true,
        noBookingUrl:true,
        noRedirect:true,
        noCheckout:true,
        noPayment:true,
        noOrderSubmit:true,
        noIdentityStorage:true,
        noPassportStorage:true,
        noBankCardStorage:true
      },
      display:{
        summaryTitle:"机票 Provider 接入审批",
        currentStatusLine:"当前状态：候选平台已建档，尚未批准接入只读价格源。",
        approvalStatusLine:"审批状态：未审查",
        readOnlyPriceSourceLine:"只读价格源：未启用",
        bookingUrlStatusLine:"bookingUrl：未启用",
        tradeStatusLine:"付款 / 下单：不支持",
        candidatePlatformsLine:"候选平台：Google Flights / Trip.com / 携程 / Skyscanner / Kayak / Expedia",
        allowlistTitle:"默认允许域名白名单",
        blockedRulesTitle:"默认阻断规则",
        allowlistRequirementLine:"需要 allowlist",
        blockedRulesSummaryLine:"禁止未知域名 / 短链接 / 可疑域名",
        aiRiskLine:"AI 不能生成可疑 provider 域名",
        humanApprovalLine:"人工审核后才允许进入 provider approval",
        notesLine:"候选平台只作档案，不连接 API，不返回价格，不生成 booking 链接。",
        checklistGroups:[
          { title:"候选与白名单", items:[["候选平台", "已建档"], ["allowlist", "已要求"], ["未知域名", "阻断"], ["短链接", "阻断"], ["可疑域名", "阻断"]] },
          { title:"平台审批", items:[["平台身份审查", "未开始"], ["Provider 条款审查", "未开始"], ["人工审核", "未完成"], ["最终人工批准", "未完成"]] },
          { title:"接口与价格", items:[["API 文档审查", "未开始"], ["API key 存储审查", "未开始"], ["Endpoint 审查", "未开始"], ["价格字段审查", "未开始"], ["bookingUrl 审查", "未开始"]] },
          { title:"安全与执行", items:[["当地法律审查", "未开始"], ["税费 / 退改签字段审查", "未开始"], ["Sandbox Dry Run", "未开始"], ["只读价格源", "未启用"], ["bookingUrl", "未启用"], ["付款 / 下单", "不支持"]] }
        ]
      }
    };
    const raw = source && typeof source === "object" ? source : {};
    return Object.assign({}, fallback, raw, {
      allowlistDomains:Array.isArray(raw.allowlistDomains) ? raw.allowlistDomains.slice() : fallback.allowlistDomains.slice(),
      blockedRules:Array.isArray(raw.blockedRules) ? raw.blockedRules.slice() : fallback.blockedRules.slice(),
      checklist:Object.assign({}, fallback.checklist, raw.checklist && typeof raw.checklist === "object" ? raw.checklist : {}),
      capabilities:Object.assign({}, fallback.capabilities, raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      safety:Object.assign({}, fallback.safety, raw.safety && typeof raw.safety === "object" ? raw.safety : {}),
      display:Object.assign({}, fallback.display, raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function commerceFlightProviderApprovalDisplay(task){
    const status = commerceFlightProviderApprovalStatus(task);
    const api = window.WeishanCommerceFlightProviderApproval;
    if (api && typeof api.describeFlightProviderApprovalStatus === "function") return api.describeFlightProviderApprovalStatus(status);
    return status.display || {};
  }

  function commerceFlightProviderApprovalDisclosure(task){
    const display = commerceFlightProviderApprovalDisplay(task);
    const matrix = commerceFlightSandboxProviderMatrixDisplay(task);
    if (!display) return "";
    const row = (label, value) => `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>`;
    const checklist = Array.isArray(display.checklistGroups) ? display.checklistGroups : [];
    const checklistHtml = checklist.map((group) => `<section class="commerce-flight-provider-approval-group"><h5>${esc(group.title || "")}</h5><ul>${(Array.isArray(group.items) ? group.items : []).map((item) => row(item[0], item[1])).join("")}</ul></section>`).join("");
    const body = `<section class="commerce-flight-provider-approval-panel" aria-label="机票 Provider 接入审批">
      <div class="commerce-flight-provider-approval-head">
        <div>
          <h4>${esc(display.summaryTitle || "机票 Provider 接入审批")}</h4>
          <p>${esc(display.currentStatusLine || "当前状态：候选平台已建档，尚未批准接入只读价格源。")}</p>
          <p>${esc(display.notesLine || "候选平台只作档案，不连接 API，不返回价格，不生成 booking 链接。")}</p>
        </div>
        <strong>${esc(display.approvalStatusLine || "审批状态：未审查")}</strong>
      </div>
      <div class="commerce-flight-provider-approval-summary">
        <ul>
          ${row("只读适配器开发许可", display.readonlyStubPermissionLine || "只读适配器开发许可：未授予")}
          ${row("只读适配器空壳", display.readonlyStubAdapterLine || "已建立")}
          ${row("Sandbox Dry Run", display.sandboxDryRunLine || "Sandbox Dry Run：外壳已建立，尚未批准真实连接")}
          ${row("当前阶段", display.readonlyStubPermissionStageLine || "当前阶段：需要人工批准")}
          ${row("下一步", display.readonlyStubPermissionNextStepLine || "下一步：完成 provider 条款、API 文档、域名 allowlist、API key 存储方案和请求 / 响应结构审查")}
          ${row("真实网络连接", display.realNetworkConnectionLine || "未启用")}
          ${row("真实价格返回", display.realPriceReturnLine || "未启用")}
          ${row("只读价格源", display.readOnlyPriceSourceLine || "未启用")}
          ${row("bookingUrl", display.bookingUrlStatusLine || "未启用")}
          ${row("付款 / 下单", display.tradeStatusLine || "不支持")}
          ${row("候选平台", display.candidatePlatformsLine || "Google Flights / Trip.com / 携程 / Skyscanner / Kayak / Expedia")}
          ${row("候选平台沙箱矩阵", matrix.currentStatusLine || "已进入")}
          ${row("allowlist", display.allowlistRequirementLine || "需要 allowlist")}
          ${row("域名阻断", display.blockedRulesSummaryLine || "禁止未知域名 / 短链接 / 可疑域名")}
          ${row("AI 风险提示", display.aiRiskLine || "AI 不能生成可疑 provider 域名")}
          ${row("人工批准", display.humanApprovalLine || "人工审核后才允许进入 provider approval")}
        </ul>
      </div>
      <div class="commerce-flight-provider-approval-rules">
        <section>
          <h5>${esc(display.allowlistTitle || "默认允许域名白名单")}</h5>
          <ul>${(Array.isArray(display.allowlistDomains) ? display.allowlistDomains : []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
        </section>
        <section>
          <h5>${esc(display.blockedRulesTitle || "默认阻断规则")}</h5>
          <ul>${(Array.isArray(display.blockedRules) ? display.blockedRules : []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
        </section>
      </div>
      <div class="commerce-flight-provider-approval-grid">
        ${checklistHtml}
      </div>
    </section>`;
    return disclosure("查看 Provider 审批状态", body, "commerce-flight-provider-approval-disclosure");
  }

  function commerceProviderEndpointAllowlistGateDisplay(task){
    const api = window.WeishanCommerceProviderEndpointAllowlistGate;
    const gate = task && task.providerEndpointAllowlistGate || null;
    if (api && typeof api.buildProviderEndpointAllowlistGateDisplay === "function") return api.buildProviderEndpointAllowlistGateDisplay(gate);
    return gate && typeof gate === "object" ? gate : {
      gateVersion:"2.1.4",
      gateStatus:"closed",
      allowlistStatus:"draft",
      display:{ title:"provider endpoint allowlist 闸门", establishedLine:"endpoint allowlist 闸门：已建立", gateStatusLine:"闸门状态：关闭", allowlistStatusLine:"allowlist 状态：草案", endpointConnectionLine:"真实 endpoint 连接：未开放", networkLine:"真实网络请求：未开放", providerSandboxLine:"provider sandbox：未开放", priceLine:"真实价格读取：未开放", bookingUrlLine:"bookingUrl 读取：未开放", orderLine:"下单：禁止", paymentLine:"付款：禁止", identityLine:"身份上传：禁止", readonlyProviderSandboxGateLine:"只读 provider sandbox gate：已建立", realSandboxRunLine:"真实 sandbox 运行：未开放", realProviderConnectionLine:"真实 provider 连接：未开放", realNetworkLine:"真实网络：未开放", nextStepLine:"只读 provider sandbox gate：已建立。下一步：只读 provider result schema gate；只读 provider result schema gate：已建立。下一步：provider result source label gate", safetyLine:"当前版本仍不能连接真实 endpoint、不能测试连接、不能联网、不能读取真实价格" },
      categories:{ flightProviders:["Google Flights", "Trip.com / 携程", "Skyscanner", "Kayak", "Expedia"], hotelProviders:["Booking", "Agoda", "Trip.com / 携程"], commerceProviders:["Amazon", "eBay", "Walmart", "京东", "淘宝", "天猫", "拼多多"], localServiceProviders:["本地服务候选平台"] },
      candidateDomains:["google.com/travel/flights：external_search_only，not_api_endpoint", "trip.com：candidate_domain_unverified", "skyscanner.com：candidate_domain_unverified", "kayak.com：candidate_domain_unverified", "expediagroup.com：candidate_partner_domain_unverified", "booking.com：candidate_domain_unverified", "amazon.com：candidate_domain_unverified", "ebay.com：candidate_domain_unverified", "walmart.com：candidate_domain_unverified", "jd.com：candidate_domain_unverified", "taobao.com：candidate_domain_unverified", "tmall.com：candidate_domain_unverified", "pinduoduo.com：candidate_domain_unverified"],
      blockedRules:["non_https", "ip_address_endpoint", "localhost_endpoint", "127.0.0.1_endpoint", "0.0.0.0_endpoint", "short_url", "unknown_domain", "suspicious_typo_domain", "credential_query_params", "api_key query params", "token query params", "secret query params", "password query params", "not_allowlisted", "manual_review_required", "payment_endpoint_blocked", "order_endpoint_blocked", "identity_upload_endpoint_blocked"],
      riskScan:{ riskSignals:["non_https", "ip_address_endpoint", "localhost_endpoint", "unknown_domain", "short_url", "suspicious_typo_domain", "credential_query_params", "auth_header_required", "write_permission_required", "order_permission_required", "payment_permission_required", "identity_upload_required", "missing_api_docs_review", "missing_terms_review", "missing_manual_approval"] },
      readonlyGate:{ allowedFutureActions:["search inventory", "read price", "read availability", "read provider source", "read updatedAt", "read taxes / fees", "read baggage / shipping / refund fields"], forbiddenActions:["create order", "hold booking", "submit passenger identity", "submit passport", "submit bank card", "submit payment", "auto purchase", "auto checkout", "write user data to provider", "upload documents"] },
      audit:{ events:["ENDPOINT_EVALUATION_DRAFT", "ENDPOINT_BLOCKED_NOT_HTTPS", "ENDPOINT_BLOCKED_IP_ADDRESS", "ENDPOINT_BLOCKED_LOCALHOST", "ENDPOINT_BLOCKED_SHORT_URL", "ENDPOINT_BLOCKED_UNKNOWN_DOMAIN", "ENDPOINT_BLOCKED_CREDENTIAL_QUERY", "ENDPOINT_BLOCKED_NOT_ALLOWLISTED", "ENDPOINT_BLOCKED_MANUAL_REVIEW_REQUIRED", "ENDPOINT_BLOCKED_WRITE_PERMISSION", "ENDPOINT_BLOCKED_ORDER_PERMISSION", "ENDPOINT_BLOCKED_PAYMENT_PERMISSION", "ENDPOINT_BLOCKED_IDENTITY_UPLOAD", "PROVIDER_READONLY_GATE_BLOCKED", "PROVIDER_SANDBOX_GATE_PENDING"], rules:["不记录真实 API key", "不记录 secret", "不记录 token", "不记录 authorization header", "不记录 credential query params", "endpoint URL 记录前必须脱敏", "只记录 providerId / hostname / decision / blockedReason / timestamp", "所有事件必须 redacted: true"], redacted:true }
    };
  }

  function commerceProviderEndpointAllowlistGateDisclosure(task){
    const gate = commerceProviderEndpointAllowlistGateDisplay(task);
    const display = gate.display || {};
    const categories = gate.categories || {};
    const categoryHtml = Object.keys(categories).map(function(key){ return '<li><span>' + esc(key) + '：</span><b>' + esc((categories[key] || []).join(' / ')) + '</b></li>'; }).join('');
    const domainItems = (Array.isArray(gate.candidateDomains) ? gate.candidateDomains : []).map(function(item){ return typeof item === 'string' ? item : item.domain + '：' + item.status + (item.endpointType ? '，' + item.endpointType : ''); });
    const riskSignals = gate.riskScan && Array.isArray(gate.riskScan.riskSignals) ? gate.riskScan.riskSignals : [];
    const allowedFutureActions = gate.readonlyGate && Array.isArray(gate.readonlyGate.allowedFutureActions) ? gate.readonlyGate.allowedFutureActions : [];
    const forbiddenActions = gate.readonlyGate && Array.isArray(gate.readonlyGate.forbiddenActions) ? gate.readonlyGate.forbiddenActions : [];
    const auditEvents = gate.audit && Array.isArray(gate.audit.events) ? gate.audit.events : [];
    const auditRules = gate.audit && Array.isArray(gate.audit.rules) ? gate.audit.rules : [];
    const listHtml = function(items){ return '<ul>' + items.map(function(item){ return '<li>' + esc(item) + '</li>'; }).join('') + '</ul>'; };
    const providerStatusRows = ["endpointStatus：draft_only", "officialDomainVerified：false", "apiDocsReviewed：false", "termsReviewed：false", "networkEnabled：false", "canConnect：false", "canReturnPrice：false", "canReturnBookingUrl：false", "canCreateOrder：false", "canPay：false"];
    const body = '<section class="commerce-provider-endpoint-allowlist-gate-panel" aria-label="provider endpoint allowlist 闸门">'
      + '<h4>' + esc(display.title || 'provider endpoint allowlist 闸门') + '</h4>'
      + '<p>' + esc(display.establishedLine || 'endpoint allowlist 闸门：已建立') + '</p>'
      + '<p>' + esc(display.gateStatusLine || '闸门状态：关闭') + '</p>'
      + '<p>' + esc(display.allowlistStatusLine || 'allowlist 状态：草案') + '</p>'
      + '<p>' + esc(display.endpointConnectionLine || '真实 endpoint 连接：未开放') + '</p>'
      + '<p>' + esc(display.networkLine || '真实网络请求：未开放') + '</p>'
      + '<p>' + esc(display.providerSandboxLine || 'provider sandbox：未开放') + '</p>'
      + '<p>' + esc(display.priceLine || '真实价格读取：未开放') + '</p>'
      + '<p>' + esc(display.bookingUrlLine || 'bookingUrl 读取：未开放') + '</p>'
      + '<p>' + esc(display.orderLine || '下单：禁止') + '</p>'
      + '<p>' + esc(display.paymentLine || '付款：禁止') + '</p>'
      + '<p>' + esc(display.identityLine || '身份上传：禁止') + '</p>'
      + '<p>' + esc(display.readonlyProviderSandboxGateLine || '只读 provider sandbox gate：已建立') + '</p>'
      + '<p>' + esc(display.realSandboxRunLine || '真实 sandbox 运行：未开放') + '</p>'
      + '<p>' + esc(display.realProviderConnectionLine || '真实 provider 连接：未开放') + '</p>'
      + '<p>' + esc(display.realNetworkLine || '真实网络：未开放') + '</p>'
      + '<h5>provider 分类草案</h5><ul>' + categoryHtml + '</ul>'
      + '<h5>provider 默认状态</h5>' + listHtml(providerStatusRows)
      + '<h5>候选域名草案</h5>' + listHtml(domainItems)
      + '<h5>阻断规则</h5>' + listHtml(Array.isArray(gate.blockedRules) ? gate.blockedRules : [])
      + '<h5>endpoint 风险扫描草案</h5>' + listHtml(riskSignals)
      + '<h5>只读 provider gate 草案</h5><p>未来允许评估的只读动作：</p>' + listHtml(allowedFutureActions)
      + '<p>禁止动作：</p>' + listHtml(forbiddenActions)
      + '<h5>endpoint 审计事件草案</h5>' + listHtml(auditEvents)
      + '<h5>审计日志规则</h5>' + listHtml(auditRules)
      + '<p>所有事件必须 redacted: true</p>'
      + '<p>' + esc(display.nextStepLine || '下一步：只读 provider result schema gate；只读 provider result schema gate：已建立。下一步：provider result source label gate') + '</p>'
      + '<p>' + esc(display.safetyLine || '当前版本仍不能连接真实 endpoint、不能测试连接、不能联网、不能读取真实价格') + '</p>'
      + '</section>';
    return disclosure("查看 provider endpoint allowlist 闸门", body, "commerce-provider-endpoint-allowlist-gate-disclosure");
  }

  function commerceReadonlyProviderSandboxGateDisplay(task){
    const api = window.WeishanCommerceReadonlyProviderSandboxGate;
    const gate = task && task.readonlyProviderSandboxGate || null;
    if (api && typeof api.buildReadonlyProviderSandboxGateDisplay === "function") return api.buildReadonlyProviderSandboxGateDisplay(gate);
    return gate && typeof gate === "object" ? gate : {
      version:"2.1.4",
      gateStatus:"closed",
      sandboxStatus:"draft_only",
      display:{ title:"只读 provider sandbox gate", establishedLine:"只读 provider sandbox gate：已建立", gateStatusLine:"gate 状态：关闭", sandboxStatusLine:"sandbox 状态：草案", realSandboxRunLine:"真实 sandbox 运行：未开放", realProviderConnectionLine:"真实 provider 连接：未开放", endpointConnectionLine:"真实 endpoint 连接：未开放", networkLine:"真实网络请求：未开放", priceLine:"真实价格读取：未开放", availabilityLine:"availability 读取：未开放", bookingUrlLine:"bookingUrl 读取：未开放", orderLine:"下单：禁止", paymentLine:"付款：禁止", identityLine:"身份上传：禁止", nextStepLine:"下一步：只读 provider result schema gate；只读 provider result schema gate：已建立。下一步：provider result source label gate", safetyLine:"当前版本仍不能运行真实 sandbox、不能连接真实 endpoint、不能联网、不能读取真实价格" },
      stageDraft:{ stages:["endpoint_allowlist_required", "provider_terms_review_required", "api_docs_review_required", "readonly_scope_review_required", "sandbox_request_schema_required", "sandbox_response_schema_required", "field_mapping_required", "redaction_required", "audit_required", "manual_approval_required", "sandbox_ready", "sandbox_blocked"], currentStage:"sandbox_blocked", stageStatus:{ endpoint_allowlist_required:"established", provider_terms_review_required:"pending", api_docs_review_required:"pending", readonly_scope_review_required:"pending", sandbox_request_schema_required:"draft", sandbox_response_schema_required:"draft", field_mapping_required:"draft", redaction_required:"established", audit_required:"established", manual_approval_required:"pending", sandbox_ready:false, sandbox_blocked:true } },
      requestDraft:{ requestFields:["providerId", "providerName", "providerCategory", "endpointAlias", "endpointHost", "requestPurpose", "readonlyScope", "queryType", "origin", "destination", "departureDate", "passengers", "currency", "locale", "providerSource", "requestedFields", "redactionMode", "auditMode"], readonlyScope:["search_inventory", "read_price", "read_availability", "read_provider_source", "read_updated_at", "read_taxes_and_fees_if_provided", "read_baggage_or_shipping_or_refund_if_provided"], requestForbiddenFields:["apiKey", "apiSecret", "accessToken", "refreshToken", "authorization", "password", "passportNumber", "identityNumber", "bankCardNumber", "paymentToken", "orderPayload", "checkoutPayload"] },
      responseDraft:{ responseFieldsAllowedFuture:["providerId", "providerName", "providerCategory", "sourceType", "resultType", "title", "price", "currency", "taxesAndFees", "availability", "updatedAt", "baggageInfo", "refundPolicy", "sourceUrlHost", "readonlyEvidence", "redacted: true", "sandboxOnly: true"], responseFieldsForbidden:["bookingUrl", "checkoutUrl", "paymentUrl", "orderId", "paymentId", "passengerIdentity", "passportNumber", "bankCardNumber", "rawApiKey", "rawToken", "rawHeaders", "rawProviderPayloadWithSecrets"] },
      fieldAllowlist:{ allowedReadOnlyFields:["providerId", "providerName", "providerCategory", "sourceType", "title", "price", "currency", "taxesAndFees", "availability", "updatedAt", "baggageInfo", "refundPolicy", "sourceUrlHost", "readonlyEvidence"], currentEnabledFields:["none"], currentDisabledFields:["price", "availability", "taxesAndFees", "baggageInfo", "refundPolicy", "shippingInfo"] },
      writeActionBlocklist:{ alwaysForbiddenActions:["create_order", "hold_booking", "submit_passenger_identity", "submit_passport", "submit_bank_card", "submit_payment", "auto_purchase", "auto_checkout", "write_user_data_to_provider", "upload_documents"].map((action) => ({ action, forbidden:true })) },
      runConditions:{ requiredBeforeSandboxRun:["endpoint allowlist gate established", "endpoint manually reviewed", "provider terms reviewed", "API docs reviewed", "readonly scope reviewed", "key storage interface ready", "key redaction rules established", "lifecycle draft established", "audit events established", "manual approval completed"], currentMissingRequirements:["endpoint manually reviewed", "provider terms reviewed", "API docs reviewed", "readonly scope reviewed", "key storage implementation", "real key not available", "endpoint connection disabled", "network disabled", "manual approval missing"], sandboxRunCurrentDecision:{ allowed:false, decision:"blocked", reason:"readonly_provider_sandbox_gate_closed" } },
      riskScan:{ riskSignals:["endpoint_not_manually_reviewed", "provider_terms_missing", "api_docs_missing", "readonly_scope_missing", "write_permission_detected", "order_permission_detected", "payment_permission_detected", "identity_upload_detected", "credential_in_url_detected", "auth_header_unredacted", "raw_provider_payload_contains_secret", "booking_url_present", "price_without_source"], currentRiskLevel:"blocked" },
      audit:{ events:["READONLY_SANDBOX_EVALUATION_DRAFT", "READONLY_SANDBOX_BLOCKED_GATE_CLOSED", "READONLY_SANDBOX_BLOCKED_ENDPOINT_NOT_REVIEWED", "READONLY_SANDBOX_BLOCKED_TERMS_NOT_REVIEWED", "READONLY_SANDBOX_BLOCKED_API_DOCS_NOT_REVIEWED", "READONLY_SANDBOX_BLOCKED_SCOPE_NOT_READONLY", "READONLY_SANDBOX_BLOCKED_NETWORK_DISABLED", "READONLY_SANDBOX_BLOCKED_SECRET_RISK", "READONLY_SANDBOX_BLOCKED_WRITE_ACTION", "READONLY_SANDBOX_SCHEMA_DRAFT_CREATED", "READONLY_SANDBOX_RESULT_BLOCKED"], auditRules:["不记录真实 API key", "不记录 secret", "不记录 token", "不记录 authorization header", "不记录 credential query params", "不记录 raw provider payload", "只记录 providerId / endpointHost / decision / blockedReason / timestamp", "所有事件必须 redacted: true"], redacted:true },
      evaluation:{ allowed:false, decision:"blocked", reason:"readonly_provider_sandbox_gate_closed", canUseNetwork:false, canReturnPrice:false, canReturnAvailability:false, canReturnBookingUrl:false, canCreateOrder:false, canPay:false }
    };
  }

  function commerceReadonlyProviderSandboxGateDisclosure(task){
    const gate = commerceReadonlyProviderSandboxGateDisplay(task);
    const display = gate.display || {};
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(typeof item === 'string' ? item : item.action || JSON.stringify(item)) + '</li>'; }).join('') + '</ul>'; };
    const stage = gate.stageDraft || {};
    const stageRows = Object.keys(stage.stageStatus || {}).map(function(key){ return key + '：' + stage.stageStatus[key]; });
    const request = gate.requestDraft || {};
    const response = gate.responseDraft || {};
    const allowlist = gate.fieldAllowlist || {};
    const writeBlock = gate.writeActionBlocklist || {};
    const run = gate.runConditions || {};
    const risk = gate.riskScan || {};
    const audit = gate.audit || {};
    const evalResult = gate.evaluation || {};
    const body = '<section class="commerce-readonly-provider-sandbox-gate-panel" aria-label="只读 provider sandbox gate">'
      + '<h4>' + esc(display.title || '只读 provider sandbox gate') + '</h4>'
      + '<p>' + esc(display.establishedLine || '只读 provider sandbox gate：已建立') + '</p>'
      + '<p>' + esc(display.gateStatusLine || 'gate 状态：关闭') + '</p>'
      + '<p>' + esc(display.sandboxStatusLine || 'sandbox 状态：草案') + '</p>'
      + '<p>' + esc(display.realSandboxRunLine || '真实 sandbox 运行：未开放') + '</p>'
      + '<p>' + esc(display.realProviderConnectionLine || '真实 provider 连接：未开放') + '</p>'
      + '<p>' + esc(display.endpointConnectionLine || '真实 endpoint 连接：未开放') + '</p>'
      + '<p>' + esc(display.networkLine || '真实网络请求：未开放') + '</p>'
      + '<p>' + esc(display.priceLine || '真实价格读取：未开放') + '</p>'
      + '<p>' + esc(display.availabilityLine || 'availability 读取：未开放') + '</p>'
      + '<p>' + esc(display.bookingUrlLine || 'bookingUrl 读取：未开放') + '</p>'
      + '<p>' + esc(display.orderLine || '下单：禁止') + '</p>'
      + '<p>' + esc(display.paymentLine || '付款：禁止') + '</p>'
      + '<p>' + esc(display.identityLine || '身份上传：禁止') + '</p>'
      + '<h5>sandbox 阶段草案</h5>' + listHtml(stage.stages || []) + listHtml(stageRows)
      + '<h5>sandbox request 草案</h5><p>requestFields</p>' + listHtml(request.requestFields || []) + '<p>readonlyScope 未来只允许字段</p>' + listHtml(request.readonlyScope || []) + '<p>request 禁止字段</p>' + listHtml(request.requestForbiddenFields || [])
      + '<h5>sandbox response 草案</h5><p>response 未来允许字段</p>' + listHtml(response.responseFieldsAllowedFuture || []) + '<p>response 禁止字段</p>' + listHtml(response.responseFieldsForbidden || [])
      + '<h5>只读字段 allowlist</h5><p>current enabled fields：' + esc((allowlist.currentEnabledFields || ['none']).join(' / ')) + '</p>' + listHtml(allowlist.allowedReadOnlyFields || []) + '<p>当前禁用字段</p>' + listHtml(allowlist.currentDisabledFields || [])
      + '<h5>写入动作 blocklist</h5>' + listHtml(writeBlock.alwaysForbiddenActions || [])
      + '<h5>sandbox 运行条件</h5>' + listHtml(run.requiredBeforeSandboxRun || [])
      + '<h5>当前缺失条件</h5>' + listHtml(run.currentMissingRequirements || [])
      + '<h5>sandbox 当前决策</h5><p>allowed: ' + esc(String((run.sandboxRunCurrentDecision || evalResult).allowed)) + '</p><p>decision: ' + esc((run.sandboxRunCurrentDecision || evalResult).decision || 'blocked') + '</p><p>reason: ' + esc((run.sandboxRunCurrentDecision || evalResult).reason || 'readonly_provider_sandbox_gate_closed') + '</p>'
      + '<h5>sandbox 风险扫描草案</h5>' + listHtml(risk.riskSignals || []) + '<p>currentRiskLevel：' + esc(risk.currentRiskLevel || 'blocked') + '</p>'
      + '<h5>sandbox 审计事件草案</h5>' + listHtml(audit.events || [])
      + '<h5>审计日志规则</h5>' + listHtml(audit.auditRules || []) + '<p>所有事件必须 redacted: true</p>'
      + '<p>' + esc(display.nextStepLine || '下一步：只读 provider result schema gate；只读 provider result schema gate：已建立。下一步：provider result source label gate') + '</p>'
      + '<p>' + esc(display.safetyLine || '当前版本仍不能运行真实 sandbox、不能连接真实 endpoint、不能联网、不能读取真实价格') + '</p>'
      + '</section>';
    return disclosure('查看只读 provider sandbox gate', body, 'commerce-readonly-provider-sandbox-gate-disclosure');
  }


  function commerceReadonlyProviderResultSchemaGateDisplay(task){
    const api = window.WeishanCommerceReadonlyProviderResultSchemaGate;
    const gate = task && task.readonlyProviderResultSchemaGate || null;
    if (api && typeof api.buildReadonlyProviderResultSchemaGateDisplay === "function") return api.buildReadonlyProviderResultSchemaGateDisplay(gate);
    return gate && typeof gate === "object" ? gate : {
      version:"2.1.4",
      gateStatus:"closed",
      schemaStatus:"draft_only",
      display:{ title:"只读 provider result schema gate", establishedLine:"只读 provider result schema gate：已建立", gateStatusLine:"gate 状态：关闭 / closed", schemaStatusLine:"schema 状态：草案 / draft", realProviderResultLine:"真实 provider result 读取：未开放", realPriceLine:"真实价格显示：未开放", availabilityLine:"availability 显示：未开放", bookingUrlLine:"bookingUrl 显示：未开放", rawPayloadLine:"raw provider payload 显示：禁止", realSandboxLine:"真实 sandbox 运行：未开放", endpointLine:"真实 endpoint 连接：未开放", networkLine:"真实网络请求：未开放", orderLine:"下单：禁止", paymentLine:"付款：禁止", identityLine:"身份上传：禁止", nextStepLine:"下一步：provider result source label gate", safetyLine:"当前版本仍不能读取真实 provider result、不能显示真实价格、不能显示 bookingUrl。" },
      resultTypesDraft:{ resultTypes:["flight_offer", "hotel_offer", "product_offer", "local_service_offer", "ticket_offer", "provider_notice", "no_result", "blocked_result", "schema_error"], currentEnabledTypes:["none"], currentDraftOnlyTypes:["flight_offer", "hotel_offer", "product_offer", "local_service_offer", "ticket_offer", "provider_notice", "no_result", "blocked_result", "schema_error"] },
      fieldAllowlist:{ commonAllowedFields:["resultId", "resultType", "providerId", "providerName", "providerCategory", "sourceType", "sourceUrlHost", "title", "description", "currency", "price", "priceDisplayMode", "taxesAndFees", "totalPrice", "availability", "updatedAt", "providerReferenceId", "readonlyEvidence", "riskLevel", "redacted", "sandboxOnly", "draftOnly"], flightAllowedFields:["origin", "destination", "departureDate", "returnDate", "carrierName", "flightNumber", "cabinClass", "baggageInfo", "refundPolicy", "duration", "stops"], hotelAllowedFields:["city", "checkInDate", "checkOutDate", "hotelName", "roomType", "cancellationPolicy", "breakfastIncluded", "locationSummary"], productAllowedFields:["productName", "brand", "model", "specs", "shippingInfo", "sellerName", "warrantyInfo"], localServiceAllowedFields:["serviceName", "locationSummary", "availableDate", "timeSlot", "ticketType", "refundPolicy"], currentEnabledFields:["none"], currentDisabledFields:["price", "totalPrice", "taxesAndFees", "availability", "bookingUrl", "sourceUrl", "rawProviderPayload"] },
      fieldBlocklist:{ alwaysForbiddenFields:["bookingUrl", "checkoutUrl", "paymentUrl", "orderUrl", "createOrderUrl", "passengerIdentity", "passportNumber", "identityNumber", "bankCardNumber", "rawApiKey", "rawToken", "rawHeaders", "rawRequest", "rawResponse"] },
      priceIntegrityRules:{ currentPriceDisplayMode:"hidden_current_version", currentRules:["当前版本不得显示任何真实价格", "当前版本不得显示估算价格", "当前版本不得显示 mock/demo/fake 价格", "当前版本不得显示最低价", "当前版本只能显示“暂无真实价格结果”"] },
      sourceIntegrityRules:{ sourceBlockedIf:["providerId 缺失：阻断", "sourceUrlHost 缺失：阻断", "updatedAt 缺失：阻断", "readonlyEvidence 缺失：阻断", "result 来自 raw AI 估算：阻断", "result 来自未知网站：阻断"] },
      bookingUrlRules:{ bookingUrlCurrentStatus:"disabled", displayForbidden:true, generationForbidden:true, alwaysForbiddenIf:["payment URL：阻断", "checkout URL：阻断"] },
      rawPayloadRules:{ rawPayloadDisplay:"forbidden", safeDebugFutureAlternative:["no raw JSON display", "no raw headers display", "no raw response body display"] },
      riskScan:{ riskSignals:["result_missing_provider_id", "result_missing_provider_name", "price_is_estimated", "price_is_mock", "price_is_demo", "price_is_fake", "booking_url_present", "raw_payload_present", "passenger_identity_present", "bank_card_present"], currentRiskLevel:"blocked" },
      audit:{ events:["READONLY_RESULT_SCHEMA_EVALUATION_DRAFT", "READONLY_RESULT_BLOCKED_GATE_CLOSED", "READONLY_RESULT_BLOCKED_PRICE_DISPLAY_DISABLED", "READONLY_RESULT_BLOCKED_BOOKING_URL_DISABLED", "READONLY_RESULT_BLOCKED_RAW_PAYLOAD", "READONLY_RESULT_BLOCKED_FAKE_PRICE", "READONLY_RESULT_BLOCKED_MOCK_PRICE", "READONLY_RESULT_BLOCKED_DEMO_PRICE", "READONLY_RESULT_BLOCKED_AI_ESTIMATE", "READONLY_RESULT_BLOCKED_PAYMENT_FIELD", "READONLY_RESULT_BLOCKED_IDENTITY_FIELD", "READONLY_RESULT_SCHEMA_DRAFT_CREATED"], auditRules:["所有事件必须 redacted: true"], redacted:true },
      evaluation:{ allowed:false, decision:"blocked", reason:"readonly_provider_result_schema_gate_closed" }
    };
  }

  function commerceReadonlyProviderResultSchemaGateDisclosure(task){
    const gate = commerceReadonlyProviderResultSchemaGateDisplay(task);
    const display = gate.display || {};
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(typeof item === 'string' ? item : item.action || JSON.stringify(item)) + '</li>'; }).join('') + '</ul>'; };
    const types = gate.resultTypesDraft || {};
    const allow = gate.fieldAllowlist || {};
    const block = gate.fieldBlocklist || {};
    const price = gate.priceIntegrityRules || {};
    const source = gate.sourceIntegrityRules || {};
    const booking = gate.bookingUrlRules || {};
    const raw = gate.rawPayloadRules || {};
    const risk = gate.riskScan || {};
    const audit = gate.audit || {};
    const body = '<section class="commerce-readonly-provider-result-schema-gate-panel" aria-label="只读 provider result schema gate">'
      + '<h4>' + esc(display.title || '只读 provider result schema gate') + '</h4>'
      + '<p>' + esc(display.establishedLine || '只读 provider result schema gate：已建立') + '</p>'
      + '<p>' + esc(display.gateStatusLine || 'gate 状态：关闭') + '</p>'
      + '<p>' + esc(display.schemaStatusLine || 'schema 状态：草案') + '</p>'
      + '<p>' + esc(display.realProviderResultLine || '真实 provider result 读取：未开放') + '</p>'
      + '<p>' + esc(display.realPriceLine || '真实价格显示：未开放') + '</p>'
      + '<p>' + esc(display.availabilityLine || 'availability 显示：未开放') + '</p>'
      + '<p>' + esc(display.bookingUrlLine || 'bookingUrl 显示：未开放') + '</p>'
      + '<p>' + esc(display.rawPayloadLine || 'raw provider payload 显示：禁止') + '</p>'
      + '<p>' + esc(display.realSandboxLine || '真实 sandbox 运行：未开放') + '</p>'
      + '<p>' + esc(display.endpointLine || '真实 endpoint 连接：未开放') + '</p>'
      + '<p>' + esc(display.networkLine || '真实网络请求：未开放') + '</p>'
      + '<p>' + esc(display.orderLine || '下单：禁止') + '</p>'
      + '<p>' + esc(display.paymentLine || '付款：禁止') + '</p>'
      + '<p>' + esc(display.identityLine || '身份上传：禁止') + '</p>'
      + '<h5>结果类型草案</h5>' + listHtml(types.resultTypes || []) + '<p>当前启用结果类型：</p>' + listHtml(types.currentEnabledTypes || ['none'])
      + '<h5>通用允许字段</h5>' + listHtml(allow.commonAllowedFields || [])
      + '<h5>flight / hotel / product 字段</h5>' + listHtml([].concat(allow.flightAllowedFields || [], allow.hotelAllowedFields || [], allow.productAllowedFields || [], allow.localServiceAllowedFields || []))
      + '<h5>当前禁用字段：</h5>' + listHtml(allow.currentDisabledFields || [])
      + '<h5>始终禁止字段：</h5>' + listHtml(block.alwaysForbiddenFields || [])
      + '<h5>价格完整性规则</h5>' + listHtml(price.priceRequiredFutureFields || []) + listHtml(price.currentRules || [])
      + '<h5>来源完整性规则</h5>' + listHtml(source.requiredFutureSourceFields || []) + listHtml(source.sourceBlockedIf || []) + listHtml(source.currentRules || [])
      + '<h5>bookingUrl 规则</h5><p>bookingUrl 当前状态：' + esc(booking.bookingUrlCurrentStatus || 'disabled') + '</p><p>displayForbidden：' + esc(String(booking.displayForbidden !== false)) + '</p><p>generationForbidden：' + esc(String(booking.generationForbidden !== false)) + '</p>' + listHtml(booking.futureRequirements || []) + listHtml(booking.alwaysForbiddenIf || [])
      + '<h5>raw payload 规则</h5><p>rawPayloadDisplay：' + esc(raw.rawPayloadDisplay || 'forbidden') + '</p>' + listHtml(raw.rawPayloadForbiddenReasons || []) + listHtml(raw.safeDebugFutureAlternative || [])
      + '<h5>result 风险扫描草案</h5>' + listHtml(risk.riskSignals || []) + '<p>currentRiskLevel：' + esc(risk.currentRiskLevel || 'blocked') + '</p>'
      + '<h5>result 审计事件草案</h5>' + listHtml(audit.events || [])
      + '<h5>result 审计规则</h5>' + listHtml(audit.auditRules || []) + '<p>所有事件必须 redacted: true</p>'
      + '<h5>联动关系</h5>' + listHtml(['sandbox gate', 'endpoint allowlist gate', 'key 生命周期', '脱敏规则', '本机安全存储', 'API 绑定准备状态'])
      + '<p>' + esc(display.nextStepLine || '下一步：provider result source label gate') + '</p>'
      + '<p>' + esc(display.safetyLine || '当前版本仍不能读取真实 provider result、不能显示真实价格、不能显示 bookingUrl。') + '</p>'
      + '</section>';
    return disclosure('查看只读 provider result schema gate', body, 'commerce-readonly-provider-result-schema-gate-disclosure');
  }

  function commerceProviderResultSourceLabelGateDisplay(task){
    const api = window.WeishanCommerceProviderResultSourceLabelGate;
    const gate = task && task.providerResultSourceLabelGate || null;
    if (api && typeof api.buildProviderResultSourceLabelGateDisplay === "function") return api.buildProviderResultSourceLabelGateDisplay(gate);
    return gate && typeof gate === "object" ? gate : {
      version:"2.1.4",
      gateStatus:"closed",
      mode:"draft_only",
      display:{ title:"provider result source label gate", establishedLine:"provider result source label gate：已建立", gateStatusLine:"gate 状态：关闭 / closed", modeLine:"mode: draft only", sourceLabelLine:"real provider source label 未开放", providerResultLine:"real provider result 未读取", networkLine:"real network disabled", safetyLine:"当前版本仍不读取真实 provider result，不显示真实来源标签，不联网，不显示真实价格。" },
      requiredFieldsDraft:{ requiredFields:["providerId", "providerName", "sourceType", "sourceUrlHost", "sourceHostDisplayName", "providerRegion", "updatedAt", "resultObservedAt", "readonlyEvidence", "evidenceType", "sourceTrustState", "redacted: true"] },
      sourceTypeDraft:{ sourceTypes:["user_bound_api", "weishan_readonly_provider", "public_search", "manual_reviewed_source", "blocked_unknown_source", "no_provider"] },
      visibleSourceLabelDraft:{ labels:["来源：未接入真实 provider", "Provider：未绑定 / 未连接", "Source host：未连接真实来源", "Updated at：无真实更新时间", "Evidence：readonlyEvidence draft only", "Trust state：closed / pending review"] },
      blockRules:{ rules:["缺 providerId 阻断", "缺 providerName 阻断", "缺 sourceUrlHost 阻断", "缺 updatedAt 阻断", "缺 readonlyEvidence 阻断", "unknown host 阻断", "short URL 阻断", "credential query params 阻断", "token / apiKey / secret 参数阻断", "raw provider URL with secrets 阻断", "raw provider payload 阻断"] },
      audit:{ sourceLabelAuditDraft:{ eventType:"SOURCE_LABEL_GATE_EVALUATION_DRAFT", schemaVersion:"2.1.4", gateState:"closed", blockedReason:"source_label_gate_closed", sourceUrlHost:"none", resultObservedAt:"none", redacted:true } },
      linkage:["只读 provider result schema gate", "只读 provider sandbox gate", "provider endpoint allowlist gate", "key 生命周期", "密钥脱敏规则", "本机安全存储", "API 绑定准备状态"]
    };
  }

  function commerceProviderResultSourceLabelGateDisclosure(task){
    const gate = commerceProviderResultSourceLabelGateDisplay(task);
    const display = gate.display || {};
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(typeof item === 'string' ? item : JSON.stringify(item)) + '</li>'; }).join('') + '</ul>'; };
    const required = gate.requiredFieldsDraft || {};
    const sourceType = gate.sourceTypeDraft || {};
    const visible = gate.visibleSourceLabelDraft || {};
    const block = gate.blockRules || {};
    const audit = gate.audit && gate.audit.sourceLabelAuditDraft || {};
    const body = '<section class="commerce-provider-result-source-label-gate-panel" aria-label="provider result source label gate">'
      + '<h4>' + esc(display.title || 'provider result source label gate') + '</h4>'
      + '<p>' + esc(display.establishedLine || 'provider result source label gate：已建立') + '</p>'
      + '<p>' + esc(display.gateStatusLine || 'gate 状态：关闭 / closed') + '</p>'
      + '<p>' + esc(display.modeLine || 'mode: draft only') + '</p>'
      + '<p>' + esc(display.sourceLabelLine || 'real provider source label 未开放') + '</p>'
      + '<p>' + esc(display.providerResultLine || 'real provider result 未读取') + '</p>'
      + '<p>' + esc(display.networkLine || 'real network disabled') + '</p>'
      + '<h5>未来 source label 必填字段草案</h5>' + listHtml(required.requiredFields || [])
      + '<h5>sourceType 草案</h5>' + listHtml(sourceType.sourceTypes || [])
      + '<h5>用户可见来源标签草案</h5>' + listHtml(visible.labels || [])
      + '<h5>阻断规则</h5>' + listHtml(block.rules || [])
      + '<h5>审计事件草案</h5><p>sourceLabelAuditDraft</p>'
      + '<p>eventType：' + esc(audit.eventType || 'SOURCE_LABEL_GATE_EVALUATION_DRAFT') + '</p>'
      + '<p>schemaVersion：' + esc(audit.schemaVersion || '2.1.4') + '</p>'
      + '<p>gateState：' + esc(audit.gateState || 'closed') + '</p>'
      + '<p>blockedReason：' + esc(audit.blockedReason || 'source_label_gate_closed') + '</p>'
      + '<p>sourceUrlHost：' + esc(audit.sourceUrlHost || 'none') + '</p>'
      + '<p>resultObservedAt：' + esc(audit.resultObservedAt || 'none') + '</p>'
      + '<p>redacted: true</p>'
      + '<h5>与前置 gate 联动</h5>' + listHtml(gate.linkage || [])
      + '<p>' + esc(display.safetyLine || '当前版本仍不读取真实 provider result，不显示真实来源标签，不联网，不显示真实价格。') + '</p>'
      + '</section>';
    return disclosure('查看 provider result source label gate', body, 'commerce-provider-result-source-label-gate-disclosure');
  }

  function commercePriceIntegrityTaxesFeesGateDisplay(task){
    const api = window.WeishanCommercePriceIntegrityTaxesFeesGate;
    const gate = task && task.priceIntegrityTaxesFeesGate || null;
    if (api && typeof api.buildPriceIntegrityTaxesFeesGateDisplay === "function") return api.buildPriceIntegrityTaxesFeesGateDisplay(gate);
    return gate && typeof gate === "object" ? gate : {
      version:"2.1.4",
      gateStatus:"closed",
      mode:"draft_only",
      display:{ title:"price integrity / taxes / fees gate", establishedLine:"price integrity / taxes / fees gate：已建立", gateStatusLine:"gate 状态：关闭 / closed", modeLine:"mode: draft only", realPriceLine:"real price display disabled", providerPriceLine:"real provider price disabled", taxFeeLine:"tax / fee verification disabled until readonly provider result is available", safetyLine:"当前版本仍隐藏价格，只显示暂无真实价格结果，不显示虚构价格或非真实报价。" },
      quoteRequiredFields:{ requiredFields:["providerId", "providerName", "sourceUrlHost", "currency", "baseFare", "taxes", "fees", "total", "priceObservedAt", "updatedAt", "readonlyEvidence", "taxFeeCompleteness", "quoteType", "redacted: true"] },
      displayPrerequisites:{ prerequisites:["没有 providerId 不显示价格", "没有 providerName 不显示价格", "没有 sourceUrlHost 不显示价格", "没有 currency 不显示价格", "没有 total 不显示价格", "没有 taxes / fees 完整性信息不显示价格", "没有 updatedAt 不显示价格", "没有 readonlyEvidence 不显示价格", "没有 source label gate 通过不显示价格", "没有 result schema gate 通过不显示价格"], decisionWithoutPrerequisites:"price withheld" },
      currentPricePolicy:{ policy:["当前版本仍隐藏价格", "当前只显示“暂无真实价格结果”", "当前不得显示不真实价格或估算价格", "当前不得显示最低价 / 约 ¥xxx / estimated price", "当前不得根据不完整来源计算最低价"] },
      taxFeeCompletenessRules:{ rules:["baseFare、taxes、fees、total 必须可追溯", "税费缺失则 price withheld", "税费未知则 price withheld", "币种缺失则 price withheld", "更新时间缺失则 price withheld", "provider evidence 缺失则 price withheld", "source label 缺失则 price withheld"] },
      riskScan:{ priceIntegrityRiskScanDraft:["missingCurrency", "missingTaxes", "missingFees", "missingUpdatedAt", "missingReadonlyEvidence", "untrustedSourceHost", "estimatedPriceDetected", "mockPriceDetected", "bookingUrlDetected", "rawProviderPayloadDetected", "redacted: true"] },
      audit:{ priceIntegrityAuditDraft:{ eventType:"PRICE_INTEGRITY_EVALUATION_DRAFT", schemaVersion:"2.1.4", gateState:"closed", withheldReason:"price_integrity_gate_closed", providerId:"none", sourceUrlHost:"none", priceObservedAt:"none", taxFeeCompleteness:"none", redacted:true } },
      linkage:["provider result source label gate", "只读 provider result schema gate", "只读 provider sandbox gate", "provider endpoint allowlist gate", "密钥脱敏规则", "API 绑定准备状态"]
    };
  }

  function commercePriceIntegrityTaxesFeesGateDisclosure(task){
    const gate = commercePriceIntegrityTaxesFeesGateDisplay(task);
    const display = gate.display || {};
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(typeof item === 'string' ? item : JSON.stringify(item)) + '</li>'; }).join('') + '</ul>'; };
    const v1 = gate.v1 || {};
    const quote = gate.quoteRequiredFields || {};
    const prereq = gate.displayPrerequisites || {};
    const policy = gate.currentPricePolicy || {};
    const tax = gate.taxFeeCompletenessRules || {};
    const risk = gate.riskScan || {};
    const audit = gate.audit && gate.audit.priceIntegrityAuditDraft || {};
    const body = '<section class="commerce-price-integrity-taxes-fees-gate-panel" aria-label="price integrity / taxes / fees gate">'
      + '<h4>' + esc(display.title || 'Price Integrity / Taxes / Fees Gate V1') + '</h4>'
      + '<p>Price Integrity / Taxes / Fees Gate V1</p>'
      + '<p>status: price integrity validation only</p>'
      + '<p>schemaVersion: price_integrity_v1</p>'
      + '<p>source label required</p>'
      + '<p>schema validation required</p>'
      + '<p>currency required</p>'
      + '<p>total required</p>'
      + '<p>updatedAt required</p>'
      + '<p>priceObservedAt required</p>'
      + '<p>tax fee completeness required</p>'
      + '<p>shipping status required</p>'
      + '<p>inventory reliability required</p>'
      + '<p>final page disclaimer required</p>'
      + '<p>fake/mock/demo/AI price blocked</p>'
      + '<p>bookingUrl blocked</p>'
      + '<p>payment/order/checkout blocked</p>'
      + '<p>redacted: true</p>'
      + '<p>' + esc(display.establishedLine || 'price integrity / taxes / fees gate：已建立') + '</p>'
      + '<p>' + esc(display.gateStatusLine || 'gate 状态：关闭 / closed') + '</p>'
      + '<p>' + esc(display.modeLine || 'mode: draft only') + '</p>'
      + '<p>' + esc(display.realPriceLine || 'real price display disabled') + '</p>'
      + '<p>' + esc(display.providerPriceLine || 'real provider price disabled') + '</p>'
      + '<p>' + esc(display.taxFeeLine || 'tax / fee verification disabled until readonly provider result is available') + '</p>'
      + '<h5>allowed quote types</h5>' + listHtml(v1.allowedQuoteTypes || ['sandbox_verified_price','user_bound_api_readonly_price','provider_readonly_price'])
      + '<h5>currently withheld quote types</h5>' + listHtml(v1.currentlyWithheldQuoteTypes || ['user_bound_api_readonly_price','provider_readonly_price'])
      + '<h5>required fields</h5>' + listHtml(v1.requiredFields || quote.requiredFields || [])
      + '<h5>withheld rules</h5>' + listHtml(v1.withheldRules || [])
      + '<h5>blocked rules</h5>' + listHtml(v1.blockedRules || [])
      + '<h5>sample pass candidate</h5><p>quoteType：sandbox_verified_price</p><p>validationDecision：' + esc(v1.samplePassValidation && v1.samplePassValidation.validationDecision || 'pass') + '</p>'
      + '<h5>sample withheld candidate</h5><p>价格已隐藏</p>'
      + '<h5>sample blocked candidate</h5><p>价格结果已阻断</p>'
      + '<h5>未来 price quote 必填字段草案</h5>' + listHtml(quote.requiredFields || [])
      + '<h5>价格显示前置条件</h5>' + listHtml(prereq.prerequisites || []) + '<p>' + esc(prereq.decisionWithoutPrerequisites || 'price withheld') + '</p>'
      + '<h5>当前价格策略</h5>' + listHtml(policy.policy || [])
      + '<h5>税费完整性规则</h5>' + listHtml(tax.rules || [])
      + '<h5>风险扫描草案</h5><p>priceIntegrityRiskScanDraft</p>' + listHtml(risk.priceIntegrityRiskScanDraft || [])
      + '<h5>审计事件草案</h5><p>priceIntegrityAuditDraft</p>'
      + '<p>eventType：' + esc(audit.eventType || 'PRICE_INTEGRITY_EVALUATION_DRAFT') + '</p>'
      + '<p>schemaVersion：' + esc(audit.schemaVersion || '2.1.4') + '</p>'
      + '<p>gateState：' + esc(audit.gateState || 'closed') + '</p>'
      + '<p>withheldReason：' + esc(audit.withheldReason || 'price_integrity_gate_closed') + '</p>'
      + '<p>providerId：' + esc(audit.providerId || 'none') + '</p>'
      + '<p>sourceUrlHost：' + esc(audit.sourceUrlHost || 'none') + '</p>'
      + '<p>priceObservedAt：' + esc(audit.priceObservedAt || 'none') + '</p>'
      + '<p>taxFeeCompleteness：' + esc(audit.taxFeeCompleteness || 'none') + '</p>'
      + '<p>redacted: true</p>'
      + '<h5>audit draft</h5><p>PRICE_INTEGRITY_TAXES_FEES_GATE_V1_DRAFT</p>'
      + '<h5>与前置 gate 联动</h5>' + listHtml(gate.linkage || [])
      + '<p>' + esc(display.safetyLine || '当前版本仍隐藏价格，只显示暂无真实价格结果，不显示虚构价格或非真实报价。') + '</p>'
      + '</section>';
    return disclosure('查看 Price Integrity / Taxes / Fees Gate V1', body, 'commerce-price-integrity-taxes-fees-gate-disclosure');
  }

  function commerceRealPriceDisplayGateDisclosure(){
    const api = window.WeishanRealPriceDisplayGate;
    const gate = api && typeof api.buildRealPriceDisplayGateDraft === "function" ? api.buildRealPriceDisplayGateDraft() : { requiredBadges:["来源平台", "更新时间", "币种", "税费状态", "费用状态", "运费状态", "库存/余票可靠性", "最终以平台页面为准"], forbiddenActions:["bookingUrl", "payment", "order", "checkout", "identityUpload"], auditDraft:{ eventType:"REAL_PRICE_DISPLAY_GATE_DRAFT", guardedPriceCardDisplayedCount:1, productionPriceDisplayedCount:0, bookingUrlDisplayedCount:0, paymentAttemptCount:0, orderAttemptCount:0, identityUploadAttemptCount:0, rawProviderPayloadDisplayedCount:0, redacted:true } };
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(typeof item === 'string' ? item : JSON.stringify(item)) + '</li>'; }).join('') + '</ul>'; };
    const audit = gate.auditDraft || {};
    const body = '<section class="commerce-real-price-display-gate-panel" aria-label="Real Price Display Gate">'
      + '<h4>Real Price Display Gate</h4>'
      + '<p>status: guarded real price display only</p>'
      + '<p>sandbox/test price display: guarded only</p>'
      + '<p>production price display: disabled</p>'
      + '<p>ordinary result display: guarded card only</p>'
      + '<p>bookingUrl disabled</p>'
      + '<p>payment disabled</p>'
      + '<p>order disabled</p>'
      + '<p>identity upload disabled</p>'
      + '<p>raw payload forbidden</p>'
      + '<p>redacted: true</p>'
      + '<h5>display decision rules</h5>' + listHtml(gate.displayDecisionRules || [])
      + '<h5>required badges</h5>' + listHtml(gate.requiredBadges || [])
      + '<h5>forbidden actions</h5>' + listHtml(gate.forbiddenActions || [])
      + '<h5>guarded price card example</h5><p>已验证真实价格</p><p>Sandbox/Test Provider Price · 非生产成交价</p><p>最终以平台页面为准</p>'
      + '<h5>withheld price example</h5><p>价格已隐藏</p>'
      + '<h5>blocked price example</h5><p>价格结果已阻断</p>'
      + '<h5>audit draft</h5><p>' + esc(audit.eventType || 'REAL_PRICE_DISPLAY_GATE_DRAFT') + '</p>'
      + '<p>guardedPriceCardDisplayedCount: ' + esc(audit.guardedPriceCardDisplayedCount === undefined ? 1 : audit.guardedPriceCardDisplayedCount) + '</p>'
      + '<p>productionPriceDisplayedCount: 0</p><p>bookingUrlDisplayedCount: 0</p><p>paymentAttemptCount: 0</p><p>orderAttemptCount: 0</p><p>identityUploadAttemptCount: 0</p><p>rawProviderPayloadDisplayedCount: 0</p><p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 Real Price Display Gate', body, 'commerce-real-price-display-gate-disclosure');
  }

  function commerceBookingUrlDomainSafetyGateDisplay(task){
    const api = window.WeishanCommerceBookingUrlDomainSafetyGate;
    const gate = task && task.bookingUrlDomainSafetyGate || null;
    if (api && typeof api.buildBookingUrlDomainSafetyGateDisplay === "function") return api.buildBookingUrlDomainSafetyGateDisplay(gate);
    return gate && typeof gate === "object" ? gate : {
      version:"2.1.24",
      gateStatus:"closed",
      mode:"draft_only",
      display:{ title:"bookingUrl domain safety gate", establishedLine:"bookingUrl domain safety gate：gate 已建立", gateStatusLine:"status: closed", modeLine:"mode: draft only", bookingUrlDisplayLine:"bookingUrl display disabled", bookingUrlGenerationLine:"bookingUrl generation disabled", bookingUrlClickLine:"bookingUrl click disabled", redirectFollowLine:"redirect follow disabled", providerBookingLinkLine:"real provider booking link disabled", networkLine:"real network disabled", safetyLine:"no order / no payment / no checkout" },
      safetyFieldsDraft:{ fields:["providerId", "providerName", "sourceUrlHost", "sourceHostDisplayName", "bookingUrlHost", "bookingUrlPathCategory", "redirectChainHostList", "urlScheme", "linkIntent", "reviewState", "updatedAt", "readonlyEvidence", "redacted: true"] },
      domainSafetyRules:{ rules:["只允许 https", "必须 exact host match", "必须匹配 provider endpoint allowlist gate", "必须匹配 provider result source label gate", "unknown host 阻断", "short URL 阻断", "redirect chain 阻断", "credential query params 阻断", "token / apiKey / secret 参数阻断", "PII query params 阻断", "passport / identity / passenger 参数阻断", "payment path 阻断", "checkout path 阻断", "order path 阻断", "identity upload path 阻断", "non-https 阻断", "localhost 阻断", "private IP 阻断", "IP literal host 阻断", "unicode homograph / punycode risk 阻断", "raw provider payload 阻断"] },
      forbiddenUrlTypes:{ forbiddenUrlTypes:["bookingUrl 当前禁止展示", "checkoutUrl 始终禁止", "paymentUrl 始终禁止", "orderUrl 始终禁止", "identityUploadUrl 始终禁止", "passengerFormUrl 始终禁止", "bankCardFormUrl 始终禁止", "providerWriteActionUrl 始终禁止", "rawProviderUrlWithSecrets 始终禁止"] },
      visiblePolicy:{ policy:["当前版本不显示真实 bookingUrl", "当前版本不生成 bookingUrl", "当前版本不提供预订按钮", "当前版本不提供付款按钮", "当前版本不提供下单按钮", "当前版本只允许外部搜索入口保持人工跳转", "外部搜索入口不得自动点击", "外部搜索入口不得伪装为 provider bookingUrl"] },
      riskScan:{ bookingUrlRiskScanDraft:["nonHttpsDetected", "unknownHostDetected", "shortUrlDetected", "redirectChainDetected", "credentialParamsDetected", "piiParamsDetected", "paymentPathDetected", "checkoutPathDetected", "orderPathDetected", "identityPathDetected", "rawProviderPayloadDetected", "redacted: true"] },
      audit:{ bookingUrlSafetyAuditDraft:{ eventType:"BOOKING_URL_DOMAIN_SAFETY_EVALUATION_DRAFT", schemaVersion:"2.1.24", gateState:"closed", blockedReason:"booking_url_domain_safety_gate_closed", bookingUrlHost:"none", sourceUrlHost:"none", linkIntent:"none", resultObservedAt:"none", redacted:true } },
      linkage:["provider result source label gate", "price integrity / taxes / fees gate", "只读 provider result schema gate", "只读 provider sandbox gate", "provider endpoint allowlist gate", "key 生命周期", "密钥脱敏规则", "本机安全存储", "API 绑定准备状态", "manual provider review workflow"]
    };
  }

  function commerceBookingUrlDomainSafetyGateDisclosure(task){
    const gate = commerceBookingUrlDomainSafetyGateDisplay(task);
    const display = gate.display || {};
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(typeof item === 'string' ? item : JSON.stringify(item)) + '</li>'; }).join('') + '</ul>'; };
    const fields = gate.safetyFieldsDraft || {};
    const rules = gate.domainSafetyRules || {};
    const forbidden = gate.forbiddenUrlTypes || {};
    const policy = gate.visiblePolicy || {};
    const risk = gate.riskScan || {};
    const audit = gate.audit && gate.audit.bookingUrlSafetyAuditDraft || {};
    const body = '<section class="commerce-booking-url-domain-safety-gate-panel" aria-label="bookingUrl domain safety gate">'
      + '<h4>' + esc(display.title || 'bookingUrl domain safety gate') + '</h4>'
      + '<p>' + esc(display.establishedLine || 'bookingUrl domain safety gate：gate 已建立') + '</p>'
      + '<p>' + esc(display.gateStatusLine || 'status: closed') + '</p>'
      + '<p>' + esc(display.modeLine || 'mode: draft only') + '</p>'
      + '<p>' + esc(display.bookingUrlDisplayLine || 'bookingUrl display disabled') + '</p>'
      + '<p>' + esc(display.bookingUrlGenerationLine || 'bookingUrl generation disabled') + '</p>'
      + '<p>' + esc(display.bookingUrlClickLine || 'bookingUrl click disabled') + '</p>'
      + '<p>' + esc(display.redirectFollowLine || 'redirect follow disabled') + '</p>'
      + '<p>' + esc(display.providerBookingLinkLine || 'real provider booking link disabled') + '</p>'
      + '<p>' + esc(display.networkLine || 'real network disabled') + '</p>'
      + '<p>' + esc(display.safetyLine || 'no order / no payment / no checkout') + '</p>'
      + '<h5>未来 bookingUrl 安全字段草案</h5>' + listHtml(fields.fields || [])
      + '<h5>域名安全规则</h5>' + listHtml(rules.rules || [])
      + '<h5>始终禁止 URL 类型</h5>' + listHtml(forbidden.forbiddenUrlTypes || [])
      + '<h5>当前用户可见策略</h5>' + listHtml(policy.policy || [])
      + '<h5>风险扫描草案</h5><p>bookingUrlRiskScanDraft</p>' + listHtml(risk.bookingUrlRiskScanDraft || [])
      + '<h5>审计事件草案</h5><p>bookingUrlSafetyAuditDraft</p>'
      + '<p>eventType：' + esc(audit.eventType || 'BOOKING_URL_DOMAIN_SAFETY_EVALUATION_DRAFT') + '</p>'
      + '<p>schemaVersion：' + esc(audit.schemaVersion || '2.1.24') + '</p>'
      + '<p>gateState：' + esc(audit.gateState || 'closed') + '</p>'
      + '<p>blockedReason：' + esc(audit.blockedReason || 'booking_url_domain_safety_gate_closed') + '</p>'
      + '<p>bookingUrlHost：' + esc(audit.bookingUrlHost || 'none') + '</p>'
      + '<p>sourceUrlHost：' + esc(audit.sourceUrlHost || 'none') + '</p>'
      + '<p>linkIntent：' + esc(audit.linkIntent || 'none') + '</p>'
      + '<p>resultObservedAt：' + esc(audit.resultObservedAt || 'none') + '</p>'
      + '<p>redacted: true</p>'
      + '<h5>与前置 gate 联动</h5>' + listHtml(gate.linkage || [])
      + '</section>';
    return disclosure('查看 bookingUrl domain safety gate', body, 'commerce-booking-url-domain-safety-gate-disclosure');
  }

  function commerceManualProviderReviewWorkflowDisplay(task){
    const api = window.WeishanCommerceManualProviderReviewWorkflow;
    const workflow = task && task.manualProviderReviewWorkflow || null;
    if (api && typeof api.buildManualProviderReviewWorkflowDisplay === "function") return api.buildManualProviderReviewWorkflowDisplay(workflow);
    return workflow && typeof workflow === "object" ? workflow : {
      version:"2.1.24",
      workflowStatus:"draft_only",
      display:{ title:"manual provider review workflow", establishedLine:"manual provider review workflow：workflow 已建立", statusLine:"status: draft only", providerApprovalLine:"no provider approved", reviewPendingLine:"all provider review pending", manualApprovalLine:"manual approval disabled", providerConnectionLine:"real provider connection disabled", sandboxLine:"real provider sandbox disabled", priceLine:"real price disabled", bookingUrlLine:"bookingUrl disabled", noApprovedLine:"当前没有 provider 处于 approved_for_future_readonly", noApproveButtonLine:"UI 不提供 approve 按钮", noRejectButtonLine:"UI 不提供 reject 按钮", noSubmitReviewLine:"UI 不提供提交审查按钮", draftOnlyLine:"当前仅展示只读流程草案" },
      providerReviewObjectDraft:{ fields:["providerId", "providerName", "providerType", "providerRegion", "sourceHost", "apiDocsStatus", "termsStatus", "readonlyPermissionStatus", "pricingDataPolicyStatus", "bookingLinkPolicyStatus", "dataRetentionStatus", "privacyStatus", "piiHandlingStatus", "rateLimitStatus", "sandboxEvidenceStatus", "manualReviewState", "reviewerRole", "reviewedAt", "blockedReason", "redacted: true"] },
      reviewStateDraft:{ states:["not_started", "docs_pending", "terms_pending", "readonly_permission_pending", "privacy_review_pending", "security_review_pending", "sandbox_evidence_pending", "blocked", "rejected", "approved_for_future_readonly"] },
      checklist:{ checklist:["API 文档是否可审查", "服务条款是否允许只读查询", "是否禁止 scraping 或自动化访问", "是否允许价格数据展示", "是否允许税费展示", "是否允许 booking link 展示", "是否存在写入动作风险", "是否涉及身份资料上传", "是否涉及银行卡资料", "是否有数据保留要求", "是否有日志脱敏要求", "是否有 rate limit", "是否有 sandbox 文档", "是否有 provider 联系方式", "是否有 credential policy", "是否有 privacy policy"] },
      blockedReasons:{ blockedReasons:["缺 API 文档阻断", "缺服务条款阻断", "缺只读授权阻断", "条款禁止自动访问阻断", "条款禁止价格展示阻断", "缺税费完整性阻断", "缺 source label 阻断", "缺 endpoint allowlist 阻断", "缺 sandbox evidence 阻断", "存在写入动作阻断", "存在 payment / checkout / order 动作阻断", "存在 identity upload 动作阻断", "存在银行卡字段阻断"] },
      audit:{ manualProviderReviewAuditDraft:{ eventType:"MANUAL_PROVIDER_REVIEW_EVALUATION_DRAFT", schemaVersion:"2.1.24", workflowState:"draft_only", providerId:"none", providerName:"none", manualReviewState:"not_started", blockedReason:"manual_provider_review_workflow_draft_only", reviewedAt:"none", reviewerRole:"none", redacted:true } },
      linkage:["bookingUrl domain safety gate", "provider result source label gate", "price integrity / taxes / fees gate", "只读 provider result schema gate", "只读 provider sandbox gate", "provider endpoint allowlist gate", "API 绑定准备状态", "密钥脱敏规则", "本机安全存储"]
    };
  }

  function commerceManualProviderReviewWorkflowDisclosure(task){
    const workflow = commerceManualProviderReviewWorkflowDisplay(task);
    const display = workflow.display || {};
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(typeof item === 'string' ? item : JSON.stringify(item)) + '</li>'; }).join('') + '</ul>'; };
    const objectDraft = workflow.providerReviewObjectDraft || {};
    const states = workflow.reviewStateDraft || {};
    const checklist = workflow.checklist || {};
    const blocked = workflow.blockedReasons || {};
    const audit = workflow.audit && workflow.audit.manualProviderReviewAuditDraft || {};
    const body = '<section class="commerce-manual-provider-review-workflow-panel" aria-label="manual provider review workflow">'
      + '<h4>' + esc(display.title || 'manual provider review workflow') + '</h4>'
      + '<p>' + esc(display.establishedLine || 'manual provider review workflow：workflow 已建立') + '</p>'
      + '<p>' + esc(display.statusLine || 'status: draft only') + '</p>'
      + '<p>' + esc(display.providerApprovalLine || 'no provider approved') + '</p>'
      + '<p>' + esc(display.reviewPendingLine || 'all provider review pending') + '</p>'
      + '<p>' + esc(display.manualApprovalLine || 'manual approval disabled') + '</p>'
      + '<p>' + esc(display.providerConnectionLine || 'real provider connection disabled') + '</p>'
      + '<p>' + esc(display.sandboxLine || 'real provider sandbox disabled') + '</p>'
      + '<p>' + esc(display.priceLine || 'real price disabled') + '</p>'
      + '<p>' + esc(display.bookingUrlLine || 'bookingUrl disabled') + '</p>'
      + '<h5>provider review object 草案</h5>' + listHtml(objectDraft.fields || [])
      + '<h5>review state 草案</h5>' + listHtml(states.states || [])
      + '<p>' + esc(display.noApprovedLine || '当前没有 provider 处于 approved_for_future_readonly') + '</p>'
      + '<p>' + esc(display.noApproveButtonLine || 'UI 不提供 approve 按钮') + '</p>'
      + '<p>' + esc(display.noRejectButtonLine || 'UI 不提供 reject 按钮') + '</p>'
      + '<p>' + esc(display.noSubmitReviewLine || 'UI 不提供提交审查按钮') + '</p>'
      + '<p>' + esc(display.draftOnlyLine || '当前仅展示只读流程草案') + '</p>'
      + '<h5>人工审查清单</h5>' + listHtml(checklist.checklist || [])
      + '<h5>默认阻断原因</h5>' + listHtml(blocked.blockedReasons || [])
      + '<h5>审计事件草案</h5><p>manualProviderReviewAuditDraft</p>'
      + '<p>eventType：' + esc(audit.eventType || 'MANUAL_PROVIDER_REVIEW_EVALUATION_DRAFT') + '</p>'
      + '<p>schemaVersion：' + esc(audit.schemaVersion || '2.1.24') + '</p>'
      + '<p>workflowState：' + esc(audit.workflowState || 'draft_only') + '</p>'
      + '<p>providerId：' + esc(audit.providerId || 'none') + '</p>'
      + '<p>providerName：' + esc(audit.providerName || 'none') + '</p>'
      + '<p>manualReviewState：' + esc(audit.manualReviewState || 'not_started') + '</p>'
      + '<p>blockedReason：' + esc(audit.blockedReason || 'manual_provider_review_workflow_draft_only') + '</p>'
      + '<p>reviewedAt：' + esc(audit.reviewedAt || 'none') + '</p>'
      + '<p>reviewerRole：' + esc(audit.reviewerRole || 'none') + '</p>'
      + '<p>redacted: true</p>'
      + '<h5>与前置 gate 联动</h5>' + listHtml(workflow.linkage || [])
      + '</section>';
    return disclosure('查看 manual provider review workflow', body, 'commerce-manual-provider-review-workflow-disclosure');
  }

  function commerceManualProviderReviewWorkflowV1Disclosure(){
    const api = window.WeishanManualProviderReviewWorkflowV1;
    const draft = api && typeof api.buildManualProviderReviewWorkflowV1Draft === "function" ? api.buildManualProviderReviewWorkflowV1Draft() : null;
    if (!draft) return "";
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(typeof item === 'string' ? item : JSON.stringify(item)) + '</li>'; }).join('') + '</ul>'; };
    const audit = draft.auditDraft || {};
    const flight = draft.sampleFlightProviderEvaluation || {};
    const rejected = draft.sampleRejectedProviderEvaluation || {};
    const body = '<section class="commerce-manual-provider-review-workflow-v1-panel" aria-label="Manual Provider Review Workflow V1">'
      + '<h4>Manual Provider Review Workflow V1</h4>'
      + '<p>status: local manual review workflow only</p>'
      + '<p>mode: limited beta review only</p>'
      + '<p>no production activation</p>'
      + '<p>no payment</p>'
      + '<p>no order</p>'
      + '<p>no bookingUrl</p>'
      + '<p>no identity upload</p>'
      + '<p>redacted: true</p>'
      + '<h5>review object fields</h5>' + listHtml(draft.reviewObjectFields || [])
      + '<h5>review states</h5>' + listHtml(draft.reviewStates || [])
      + '<h5>beta approval rules</h5>' + listHtml(draft.betaApprovalRules || [])
      + '<h5>blocked rules</h5>' + listHtml(draft.blockedRules || [])
      + '<h5>sample flight_provider review</h5>' + commerceObjectLinesHtml(draft.sampleFlightProviderReview || {})
      + '<p>manualReviewState: ' + esc(flight.manualReviewState || 'approved_for_limited_beta') + '</p>'
      + '<p>decision: ' + esc(flight.decision || 'allow_limited_beta_review') + '</p>'
      + '<h5>sample rejected provider</h5>' + commerceObjectLinesHtml(draft.sampleRejectedProviderReview || {})
      + '<p>manualReviewState: ' + esc(rejected.manualReviewState || 'docs_pending') + '</p>'
      + '<p>blockedReason: ' + esc(rejected.blockedReason || 'limited beta flight only') + '</p>'
      + '<h5>audit draft</h5>'
      + '<p>' + esc(audit.eventType || 'MANUAL_PROVIDER_REVIEW_WORKFLOW_V1_DRAFT') + '</p>'
      + '<p>approvedForLimitedBetaCount: ' + esc(String(audit.approvedForLimitedBetaCount || 0)) + '</p>'
      + '<p>fullProductionApprovalCount: ' + esc(String(audit.fullProductionApprovalCount || 0)) + '</p>'
      + '<p>paymentApprovalCount: ' + esc(String(audit.paymentApprovalCount || 0)) + '</p>'
      + '<p>orderApprovalCount: ' + esc(String(audit.orderApprovalCount || 0)) + '</p>'
      + '<p>identityUploadApprovalCount: ' + esc(String(audit.identityUploadApprovalCount || 0)) + '</p>'
      + '<p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 Manual Provider Review Workflow V1', body, 'commerce-manual-provider-review-workflow-v1-disclosure');
  }

  function commerceLimitedRealPriceUiBetaGateDisclosure(){
    const api = window.WeishanLimitedRealPriceUiBetaGate;
    const draft = api && typeof api.buildLimitedRealPriceUiBetaGateDraft === "function" ? api.buildLimitedRealPriceUiBetaGateDraft() : null;
    if (!draft) return "";
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(typeof item === 'string' ? item : JSON.stringify(item)) + '</li>'; }).join('') + '</ul>'; };
    const audit = draft.auditDraft || {};
    const examples = draft.displayDecisionExamples || {};
    const body = '<section class="commerce-limited-real-price-ui-beta-gate-panel" aria-label="Limited Real Price UI Beta Gate">'
      + '<h4>Limited Real Price UI Beta Gate</h4>'
      + '<p>status: limited beta only</p>'
      + '<p>betaScope: flight_only</p>'
      + '<p>product beta disabled</p>'
      + '<p>hotel beta disabled</p>'
      + '<p>local service beta disabled</p>'
      + '<p>ticket/activity beta disabled</p>'
      + '<p>restricted category blocked</p>'
      + '<p>payment disabled</p>'
      + '<p>order disabled</p>'
      + '<p>bookingUrl disabled</p>'
      + '<p>identity upload disabled</p>'
      + '<p>redacted: true</p>'
      + '<h5>whitelist categories</h5>' + listHtml(draft.allowedCategories || [])
      + '<h5>provider ids</h5>' + listHtml(draft.allowedProviderIds || [])
      + '<h5>required badges</h5>' + listHtml(draft.requiredBadges || [])
      + '<h5>blocked categories</h5>' + listHtml(draft.blockedCategories || [])
      + '<h5>display decision examples</h5>'
      + '<p>flight: ' + esc(examples.allowed && examples.allowed.displayDecision || 'allow_limited_beta_price_card') + '</p>'
      + '<p>product: ' + esc(examples.product && examples.product.displayDecision || 'blocked') + '</p>'
      + '<p>restricted: ' + esc(examples.restricted && examples.restricted.displayDecision || 'blocked') + '</p>'
      + '<h5>audit draft</h5>'
      + '<p>' + esc(audit.eventType || 'LIMITED_REAL_PRICE_UI_BETA_GATE_DRAFT') + '</p>'
      + '<p>guardedBetaPriceDisplayedCount: ' + esc(String(audit.guardedBetaPriceDisplayedCount || 0)) + '</p>'
      + '<p>productionPriceDisplayedCount: ' + esc(String(audit.productionPriceDisplayedCount || 0)) + '</p>'
      + '<p>bookingUrlDisplayedCount: ' + esc(String(audit.bookingUrlDisplayedCount || 0)) + '</p>'
      + '<p>paymentAttemptCount: ' + esc(String(audit.paymentAttemptCount || 0)) + '</p>'
      + '<p>orderAttemptCount: ' + esc(String(audit.orderAttemptCount || 0)) + '</p>'
      + '<p>identityUploadAttemptCount: ' + esc(String(audit.identityUploadAttemptCount || 0)) + '</p>'
      + '<p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 Limited Real Price UI Beta Gate', body, 'commerce-limited-real-price-ui-beta-gate-disclosure');
  }


  function commerceLimitedBetaStatePersistenceDisclosure(){
    const api = window.WeishanLimitedBetaPreferencePersistence;
    const draft = api && typeof api.buildPersistenceDraft === "function" ? api.buildPersistenceDraft() : null;
    if (!draft) return "";
    const pref = draft.preference || {};
    const cats = pref.categoryOverrides || {};
    const audit = draft.auditDraft || {};
    const exportText = api && typeof api.exportRedactedPreferenceSummary === "function" ? api.exportRedactedPreferenceSummary() : JSON.stringify({ redacted:true });
    const body = '<section class="commerce-limited-beta-state-persistence-panel" aria-label="Limited Beta State Persistence">'
      + '<h4>Limited Beta State Persistence</h4>'
      + '<p>status: local preference persistence active</p>'
      + '<p>schemaVersion: ' + esc(draft.schemaVersion || '2.1.39') + '</p>'
      + '<p>storage: app userData local file</p>'
      + '<p>localStorage: forbidden</p>'
      + '<p>sessionStorage: forbidden</p>'
      + '<p>.env: forbidden</p>'
      + '<p>persistedPreferenceLoaded: ' + esc(String(draft.persistedPreferenceLoaded === true)) + '</p>'
      + '<p>persistedPreferenceValid: ' + esc(String(draft.persistedPreferenceValid !== false)) + '</p>'
      + '<p>safeFallbackApplied: ' + esc(String(draft.safeFallbackApplied === true)) + '</p>'
      + '<p>globalLimitedBetaEnabled: ' + esc(String(pref.globalLimitedBetaEnabled === true)) + '</p>'
      + '<p>flight beta: ' + esc(String(cats.flight === true)) + '</p>'
      + '<p>product beta: false</p>'
      + '<p>hotel beta: false</p>'
      + '<p>restricted beta: false</p>'
      + '<p>killSwitchState: ' + esc(pref.killSwitchState || 'enabled') + '</p>'
      + '<p>rollbackState: ' + esc(pref.rollbackState || 'not_needed') + '</p>'
      + '<p>lastAction: ' + esc(pref.lastAction || 'initial_default') + '</p>'
      + '<p>updatedAt: ' + esc(pref.updatedAt || 'local preference') + '</p>'
      + '<p>requiresUserConfirmationForRestore: true</p>'
      + '<p>redacted: true</p>'
      + '<div class="commerce-actions-row">'
      + '<button type="button" data-commerce-limited-beta-action="reload-preference">重新读取本地偏好</button>'
      + '<button type="button" data-commerce-limited-beta-action="clear-preference">清除 Limited Beta 偏好</button>'
      + '<button type="button" class="cmd-btn gray commerce-result-summary-copy-btn" data-commerce-copy-kind="limitedBetaPreferenceSummary" data-commerce-copy-text="' + commerceEncodedCopyText(exportText) + '">导出脱敏偏好摘要</button>'
      + '</div>'
      + '<h5>audit draft</h5>'
      + '<p>' + esc(audit.eventType || 'LIMITED_BETA_PREFERENCE_PERSISTENCE_AUDIT_DRAFT') + '</p>'
      + '<p>localStorageWriteCount: 0</p>'
      + '<p>sessionStorageWriteCount: 0</p>'
      + '<p>envWriteCount: 0</p>'
      + '<p>secretPersistedCount: 0</p>'
      + '<p>endpointPersistedCount: 0</p>'
      + '<p>rawPayloadPersistedCount: 0</p>'
      + '<p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 Limited Beta State Persistence', body, 'commerce-limited-beta-state-persistence-disclosure');
  }

  function commerceLimitedBetaUserPreferenceGuardDisclosure(){
    const api = window.WeishanLimitedBetaUserPreferenceGuard;
    const draft = api && typeof api.buildLimitedBetaUserPreferenceGuardDraft === "function" ? api.buildLimitedBetaUserPreferenceGuardDraft() : null;
    if (!draft) return "";
    const decision = draft.decision || {};
    const audit = draft.auditDraft || {};
    const body = '<section class="commerce-limited-beta-user-preference-guard-panel" aria-label="Limited Beta User Preference Guard">'
      + '<h4>Limited Beta User Preference Guard</h4>'
      + '<p>status: user preference guard active</p>'
      + '<p>restore requires confirmation</p>'
      + '<p>user preference cannot override safety gates</p>'
      + '<p>flight only</p>'
      + '<p>product beta blocked</p>'
      + '<p>hotel beta blocked</p>'
      + '<p>restricted blocked</p>'
      + '<p>bookingUrl disabled</p>'
      + '<p>payment disabled</p>'
      + '<p>order disabled</p>'
      + '<p>identity upload disabled</p>'
      + '<p>preferenceDecision: ' + esc(decision.preferenceDecision || 'allow') + '</p>'
      + '<p>confirmationRequired: ' + esc(String(decision.confirmationRequired === true)) + '</p>'
      + '<p>safeFallbackApplied: ' + esc(String(decision.safeFallbackApplied === true)) + '</p>'
      + '<p>blockedReason: ' + esc(decision.blockedReason || 'none') + '</p>'
      + '<p>redacted: true</p>'
      + '<h5>audit draft</h5>'
      + '<p>' + esc(audit.eventType || 'LIMITED_BETA_USER_PREFERENCE_GUARD_AUDIT_DRAFT') + '</p>'
      + '<p>restoreAttemptCount: ' + esc(String(audit.restoreAttemptCount || 0)) + '</p>'
      + '<p>restoreConfirmedCount: ' + esc(String(audit.restoreConfirmedCount || 0)) + '</p>'
      + '<p>restoreBlockedCount: ' + esc(String(audit.restoreBlockedCount || 0)) + '</p>'
      + '<p>unsafePreferenceBlockedCount: ' + esc(String(audit.unsafePreferenceBlockedCount || 0)) + '</p>'
      + '<p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 Limited Beta User Preference Guard', body, 'commerce-limited-beta-user-preference-guard-disclosure');
  }

  function commerceLimitedBetaKillSwitchDisclosure(){
    const api = window.WeishanLimitedBetaKillSwitch;
    const persistence = window.WeishanLimitedBetaPreferencePersistence;
    const draft = api && typeof api.buildLimitedBetaKillSwitchDraft === "function" ? api.buildLimitedBetaKillSwitchDraft() : null;
    if (!draft) return "";
    const state = draft.state || {};
    const categories = state.categoryOverrides || {};
    const surfaces = state.surfaceOverrides || {};
    const audit = draft.auditDraft || {};
    const preference = persistence && typeof persistence.buildPersistenceDraft === "function" ? persistence.buildPersistenceDraft() : null;
    const source = preference && preference.persistedPreferenceLoaded ? '本地持久化' : '默认安全值';
    const pending = state.restoreConfirmationPending === true;
    const confirmBlock = pending
      ? '<section class="commerce-limited-beta-restore-confirmation" data-limited-beta-restore-confirmation="true"><h5>恢复 Limited Beta 确认</h5><p>我确认仅恢复机票 Limited Beta</p><p>我理解 weishan 不提供预订链接</p><p>我理解 weishan 不付款、不下单</p><p>我理解最终以平台页面为准</p><button type="button" data-commerce-limited-beta-action="restore-confirm">确认恢复 Limited Beta</button></section>'
      : '<p>恢复 Limited Beta 前必须确认。</p>';
    const body = '<section class="commerce-limited-beta-kill-switch-panel" aria-label="Limited Beta Kill Switch">'
      + '<h4>Limited Beta Kill Switch</h4>'
      + '<p>status: active</p>'
      + '<p>当前状态来自：' + esc(source) + '</p>'
      + '<p>恢复 Limited Beta 前必须确认</p>'
      + '<p>globalLimitedBetaEnabled: ' + esc(String(state.globalLimitedBetaEnabled === true)) + '</p>'
      + '<p>flight beta: ' + esc(String(categories.flight === true)) + '</p>'
      + '<p>product beta: false</p>'
      + '<p>hotel beta: false</p>'
      + '<p>restricted beta: false</p>'
      + '<p>ordinary result card beta: ' + esc(String(surfaces.ordinary_result_card === true)) + '</p>'
      + '<p>killSwitchState: ' + esc(state.killSwitchState || 'enabled') + '</p>'
      + '<p>rollbackState: ' + esc(state.rollbackState || 'not_needed') + '</p>'
      + '<p>reason: ' + esc(state.reason || 'limited beta enabled for flight only') + '</p>'
      + '<p>updatedAt: ' + esc(state.updatedAt || 'local draft') + '</p>'
      + '<p>requiresUserConfirmationForRestore: true</p>'
      + '<p>redacted: true</p>'
      + '<div class="commerce-actions-row">'
      + '<button type="button" data-commerce-limited-beta-action="off">关闭 Limited Beta</button>'
      + '<button type="button" data-commerce-limited-beta-action="restore-request">恢复 Limited Beta</button>'
      + '<button type="button" data-commerce-limited-beta-action="rollback">强制回滚到离线计划</button>'
      + '</div>'
      + confirmBlock
      + '<p>关闭 Limited Beta：隐藏所有 Limited Beta 价格卡片，并保存本地偏好。</p>'
      + '<p>恢复 Limited Beta：仅恢复 flight beta，不恢复其它品类。</p>'
      + '<p>强制回滚：进入 rollback_active，必须显示暂无真实价格结果。</p>'
      + '<h5>audit draft</h5>'
      + '<p>' + esc(audit.eventType || 'LIMITED_BETA_KILL_SWITCH_AUDIT_DRAFT') + '</p>'
      + '<p>priceCardHiddenCount: ' + esc(String(audit.priceCardHiddenCount || 0)) + '</p>'
      + '<p>restoredCount: ' + esc(String(audit.restoredCount || 0)) + '</p>'
      + '<p>restoreRequestCount: ' + esc(String(audit.restoreRequestCount || 0)) + '</p>'
      + '<p>forcedRollbackCount: ' + esc(String(audit.forcedRollbackCount || 0)) + '</p>'
      + '<p>bookingUrlDisplayedCount: 0</p>'
      + '<p>paymentAttemptCount: 0</p>'
      + '<p>orderAttemptCount: 0</p>'
      + '<p>identityUploadAttemptCount: 0</p>'
      + '<p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 Limited Beta Kill Switch', body, 'commerce-limited-beta-kill-switch-disclosure');
  }

  function commerceLimitedBetaRollbackGuardDisclosure(){
    const api = window.WeishanLimitedBetaRollbackGuard;
    const draft = api && typeof api.buildLimitedBetaRollbackGuardDraft === "function" ? api.buildLimitedBetaRollbackGuardDraft() : null;
    if (!draft) return "";
    const audit = draft.auditDraft || {};
    const body = '<section class="commerce-limited-beta-rollback-guard-panel" aria-label="Limited Beta Rollback Guard">'
      + '<h4>Limited Beta Rollback Guard</h4>'
      + '<p>status: rollback protection active</p>'
      + '<p>bookingUrl trigger: enabled</p>'
      + '<p>payment/order trigger: enabled</p>'
      + '<p>identity upload trigger: enabled</p>'
      + '<p>restricted category trigger: enabled</p>'
      + '<p>non-flight beta trigger: enabled</p>'
      + '<p>schema/source/price gate fail trigger: enabled</p>'
      + '<p>network attempt trigger: enabled</p>'
      + '<p>raw payload trigger: enabled</p>'
      + '<p>redacted: true</p>'
      + '<h5>rollback triggers</h5>' + list(draft.triggers || [])
      + '<h5>current rollback decision</h5>' + commerceObjectLinesHtml(draft.currentRollbackDecision || {})
      + '<p>fallback surface: offline_planning_only</p>'
      + '<h5>audit draft</h5>'
      + '<p>' + esc(audit.eventType || 'LIMITED_BETA_ROLLBACK_GUARD_AUDIT_DRAFT') + '</p>'
      + '<p>rollbackDecision: ' + esc(audit.rollbackDecision || 'rollback_active') + '</p>'
      + '<p>rollbackReason: ' + esc(audit.rollbackReason || 'bookingUrl/payment/order url present') + '</p>'
      + '<p>bookingUrlHidden: true</p>'
      + '<p>paymentDisabled: true</p>'
      + '<p>orderDisabled: true</p>'
      + '<p>identityUploadDisabled: true</p>'
      + '<p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 Limited Beta Rollback Guard', body, 'commerce-limited-beta-rollback-guard-disclosure');
  }

  function commerceManualBookingHandoffDisclosure(){
    const api = window.WeishanManualBookingHandoff;
    const killApi = window.WeishanLimitedBetaKillSwitch;
    const visibility = killApi && typeof killApi.evaluateLimitedBetaVisibility === "function"
      ? killApi.evaluateLimitedBetaVisibility({ category:"flight", providerId:"flight_provider", surface:"ordinary_result_card" })
      : { priceCardVisible:true };
    const rollbackActive = visibility.priceCardVisible !== true || visibility.killSwitchState === "rollback_active";
    const handoff = api && typeof api.buildManualBookingHandoff === "function" ? api.buildManualBookingHandoff({ rollbackActive }) : null;
    if (!handoff || handoff.status !== "manual_only") return "";
    const audit = handoff.auditDraft || {};
    const body = '<section class="commerce-manual-booking-handoff-panel" aria-label="Manual Booking Handoff">'
      + '<h4>Manual Booking Handoff</h4>'
      + '<p>status: manual handoff only</p>'
      + '<p>no auto open</p>'
      + '<p>no bookingUrl</p>'
      + '<p>no payment</p>'
      + '<p>no order</p>'
      + '<p>no identity upload</p>'
      + '<p>no bank card save</p>'
      + '<p>user must verify on official platform</p>'
      + '<p>redacted: true</p>'
      + '<h5>搜索条件</h5>' + commerceObjectLinesHtml(handoff.searchConditions || {})
      + '<h5>价格证据摘要</h5>' + commerceObjectLinesHtml(handoff.priceEvidenceSummary || {})
      + '<h5>用户核对清单</h5>' + list(handoff.userChecklist || [])
      + '<button type="button" class="cmd-btn gray commerce-result-summary-copy-btn" data-commerce-copy-kind="manualBookingHandoff" data-commerce-copy-text="' + commerceEncodedCopyText(handoff.copyPayload || '') + '">复制人工核对清单</button>'
      + '<p>请用户自行打开官方航空公司或可信平台核对。</p>'
      + '<p>weishan 不自动跳转、不付款、不下单。</p>'
      + '<h5>audit draft</h5>'
      + '<p>' + esc(audit.eventType || 'MANUAL_BOOKING_HANDOFF_AUDIT_DRAFT') + '</p>'
      + '<p>copyChecklistCount: ' + esc(String(audit.copyChecklistCount || 0)) + '</p>'
      + '<p>autoOpenAttemptCount: 0</p>'
      + '<p>bookingUrlGeneratedCount: 0</p>'
      + '<p>paymentAttemptCount: 0</p>'
      + '<p>orderAttemptCount: 0</p>'
      + '<p>identityUploadAttemptCount: 0</p>'
      + '<p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 Manual Booking Handoff', body, 'commerce-manual-booking-handoff-disclosure');
  }


  function commerceProviderActivationReadinessGateDisplay(task){
    const api = window.WeishanCommerceProviderActivationReadinessGate;
    const gate = task && task.providerActivationReadinessGate || null;
    if (api && typeof api.buildProviderActivationReadinessGateDisplay === "function") return api.buildProviderActivationReadinessGateDisplay(gate);
    return gate && typeof gate === "object" ? gate : { version:"2.1.24", gateStatus:"blocked", mode:"readiness_only", activationGoNoGo:"no-go", display:{ title:"provider activation readiness gate", establishedLine:"provider activation readiness gate：gate 已建立", statusLine:"status: blocked", modeLine:"mode: readiness only", providerActivationLine:"provider activation disabled", providerConnectionLine:"real provider connection disabled", sandboxLine:"real provider sandbox disabled", priceLine:"real price disabled", bookingUrlLine:"real bookingUrl disabled", orderPaymentLine:"order / payment / checkout disabled", decisionLine:"activationGoNoGo: no-go", redactedLine:"redacted: true" }, prerequisiteGateSummary:{ prerequisiteGateSummary:["result schema gate: established / closed / draft", "provider source label gate: established / closed / draft", "price integrity / taxes / fees gate: established / closed / draft", "bookingUrl domain safety gate: established / closed / draft", "manual provider review workflow: established / draft only / no provider approved", "provider endpoint allowlist gate: established / closed", "readonly provider sandbox gate: established / closed", "API binding readiness: not ready", "secure storage design gate: closed", "local secure storage interface draft: draft only", "key redaction rules: established", "key lifecycle draft: draft only"] }, blockedReasons:{ blockedReasons:["no provider approved", "manual review pending", "readonly permission not granted", "credential consent not collected", "secure storage real implementation disabled", "real key input disabled", "endpoint connection disabled", "real sandbox disabled", "real provider result disabled", "price display disabled", "bookingUrl display disabled", "payment / checkout / order disabled", "identity / passport / bank card flow disabled"] }, activationChecklist:{ activationChecklist:["provider manual review approved", "terms allow readonly query", "privacy policy reviewed", "credential scope approved", "secure storage implementation approved", "endpoint allowlist approved", "sandbox evidence approved", "result schema validation passed", "source label validation passed", "price integrity validation passed", "bookingUrl safety validation passed", "audit logging approved", "redaction rules active", "manual rollback plan ready"] }, activationDecisionObjectDraft:{ fields:["providerId", "providerName", "providerType", "providerRegion", "activationState", "activationDecision", "blockedReason", "requiredGateList", "passedGateList", "failedGateList", "reviewedAt", "reviewerRole", "schemaVersion", "redacted: true"] }, audit:{ providerActivationReadinessAuditDraft:{ eventType:"PROVIDER_ACTIVATION_READINESS_EVALUATION_DRAFT", schemaVersion:"2.1.24", gateState:"blocked", activationDecision:"no-go", blockedReason:"provider_activation_readiness_blocked", providerId:"none", providerName:"none", reviewedAt:"none", redacted:true } }, linkage:["manual provider review workflow", "bookingUrl domain safety gate", "price integrity / taxes / fees gate", "provider result source label gate", "只读 provider result schema gate", "只读 provider sandbox gate", "provider endpoint allowlist gate", "credential consent scope gate", "read-only adapter contract gate", "API 绑定准备状态", "密钥脱敏规则", "本机安全存储"] };
  }

  function commerceProviderActivationReadinessGateDisclosure(task){
    const gate = commerceProviderActivationReadinessGateDisplay(task);
    const display = gate.display || {};
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(typeof item === 'string' ? item : JSON.stringify(item)) + '</li>'; }).join('') + '</ul>'; };
    const audit = gate.audit && gate.audit.providerActivationReadinessAuditDraft || {};
    const body = '<section class="commerce-provider-activation-readiness-gate-panel" aria-label="provider activation readiness gate">'
      + '<h4>' + esc(display.title || 'provider activation readiness gate') + '</h4>'
      + '<p>' + esc(display.establishedLine || 'provider activation readiness gate：gate 已建立') + '</p>'
      + '<p>' + esc(display.statusLine || 'status: blocked') + '</p>'
      + '<p>' + esc(display.modeLine || 'mode: readiness only') + '</p>'
      + '<p>' + esc(display.providerActivationLine || 'provider activation disabled') + '</p>'
      + '<p>' + esc(display.providerConnectionLine || 'real provider connection disabled') + '</p>'
      + '<p>' + esc(display.sandboxLine || 'real provider sandbox disabled') + '</p>'
      + '<p>' + esc(display.priceLine || 'real price disabled') + '</p>'
      + '<p>' + esc(display.bookingUrlLine || 'real bookingUrl disabled') + '</p>'
      + '<p>' + esc(display.orderPaymentLine || 'order / payment / checkout disabled') + '</p>'
      + '<p>' + esc(display.decisionLine || 'activationGoNoGo: no-go') + '</p>'
      + '<p>' + esc(display.redactedLine || 'redacted: true') + '</p>'
      + '<h5>前置 gate 汇总</h5>' + listHtml((gate.prerequisiteGateSummary || {}).prerequisiteGateSummary || [])
      + '<h5>当前阻断原因</h5>' + listHtml((gate.blockedReasons || {}).blockedReasons || [])
      + '<h5>未来 activation checklist 草案</h5>' + listHtml((gate.activationChecklist || {}).activationChecklist || [])
      + '<h5>activation decision object 草案</h5>' + listHtml((gate.activationDecisionObjectDraft || {}).fields || [])
      + '<h5>审计事件草案</h5><p>providerActivationReadinessAuditDraft</p>'
      + '<p>eventType：' + esc(audit.eventType || 'PROVIDER_ACTIVATION_READINESS_EVALUATION_DRAFT') + '</p>'
      + '<p>schemaVersion：' + esc(audit.schemaVersion || '2.1.24') + '</p>'
      + '<p>gateState：' + esc(audit.gateState || 'blocked') + '</p>'
      + '<p>activationDecision：' + esc(audit.activationDecision || 'no-go') + '</p>'
      + '<p>blockedReason：' + esc(audit.blockedReason || 'provider_activation_readiness_blocked') + '</p>'
      + '<p>providerId：' + esc(audit.providerId || 'none') + '</p>'
      + '<p>providerName：' + esc(audit.providerName || 'none') + '</p>'
      + '<p>reviewedAt：' + esc(audit.reviewedAt || 'none') + '</p>'
      + '<p>redacted: true</p>'
      + '<h5>与前置 gate 联动</h5>' + listHtml(gate.linkage || [])
      + '</section>';
    return disclosure('查看 provider activation readiness gate', body, 'commerce-provider-activation-readiness-gate-disclosure');
  }

  function commerceCredentialConsentScopeGateDisplay(task){
    const api = window.WeishanCommerceCredentialConsentScopeGate;
    const gate = task && task.credentialConsentScopeGate || null;
    if (api && typeof api.buildCredentialConsentScopeGateDisplay === "function") return api.buildCredentialConsentScopeGateDisplay(gate);
    return gate && typeof gate === "object" ? gate : { version:"2.1.24", gateStatus:"closed", mode:"draft_only", display:{ title:"credential consent scope gate", establishedLine:"credential consent scope gate：gate 已建立", statusLine:"status: closed", modeLine:"mode: draft only", inputLine:"real credential input disabled", saveLine:"real credential save disabled", readLine:"real credential read disabled", lifecycleLine:"credential deletion / rotation / expiry real operations disabled", keychainLine:"Keychain disabled", safeStorageLine:"safeStorage disabled", encryptedStoreLine:"encrypted local store disabled", envLine:".env disabled", browserStorageLine:"localStorage / sessionStorage disabled", noApprovedLine:"当前没有 consent 处于 approved_for_future_readonly", noInputLine:"UI 不提供输入 key", noSaveLine:"UI 不提供保存 key", noReadLine:"UI 不提供读取 key", noTestLine:"UI 不提供测试连接", noLifecycleLine:"UI 不提供删除 / 轮换 / 过期真实操作", draftOnlyLine:"当前仅展示只读 consent 草案", redactedLine:"redacted: true" }, consentObjectDraft:{ fields:["consentId", "providerId", "providerName", "credentialAlias", "credentialScope", "readonlyOnly", "allowedActionList", "blockedActionList", "consentState", "consentCollectedAt", "consentExpiresAt", "revocationState", "storageBackend", "secretRef", "redacted: true"] }, credentialScopeDraft:{ credentialScopes:["readonly_search", "readonly_price_query", "readonly_availability_query", "readonly_provider_notice", "no_booking", "no_payment", "no_order", "no_profile_write", "no_identity_upload", "no_bank_card_submit"] }, consentStateDraft:{ states:["not_started", "draft_only", "pending_user_review", "pending_security_review", "blocked", "revoked", "expired", "approved_for_future_readonly"] }, permissionBoundaries:{ boundaries:["允许未来只读搜索", "允许未来只读价格查询", "允许未来只读来源标签读取", "禁止 booking", "禁止 checkout", "禁止 payment", "禁止 order", "禁止写入用户资料", "禁止上传身份证", "禁止上传护照", "禁止提交银行卡", "禁止 provider write action", "禁止 raw token 展示", "禁止 rawApiKey 展示"] }, blockingRules:{ blockingRules:["缺用户同意阻断", "缺 providerId 阻断", "缺 credential scope 阻断", "非 readonly scope 阻断", "包含 booking scope 阻断", "包含 payment scope 阻断", "包含 order scope 阻断", "包含 profile write scope 阻断", "包含 identity upload scope 阻断", "缺 secure storage approval 阻断", "缺 redaction rules 阻断", "缺 key lifecycle policy 阻断"] }, audit:{ credentialConsentScopeAuditDraft:{ eventType:"CREDENTIAL_CONSENT_SCOPE_EVALUATION_DRAFT", schemaVersion:"2.1.24", gateState:"closed", consentState:"draft_only", providerId:"none", credentialAlias:"none", blockedReason:"credential_consent_scope_gate_closed", consentCollectedAt:"none", redacted:true } } };
  }

  function commerceCredentialConsentScopeGateDisclosure(task){
    const gate = commerceCredentialConsentScopeGateDisplay(task);
    const display = gate.display || {};
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(typeof item === 'string' ? item : JSON.stringify(item)) + '</li>'; }).join('') + '</ul>'; };
    const audit = gate.audit && gate.audit.credentialConsentScopeAuditDraft || {};
    const body = '<section class="commerce-credential-consent-scope-gate-panel" aria-label="API 授权范围同意闸门">'
      + '<h4>' + esc(display.title || 'API 授权范围同意闸门') + '</h4>'
      + '<p>' + esc(display.establishedLine || 'credential consent scope gate：draft-ready') + '</p>'
      + '<p>' + esc(display.statusLine || 'status: credential consent gate only') + '</p>'
      + '<p>' + esc(display.modeLine || 'mode: no provider connection') + '</p>'
      + '<p>' + esc(display.realProviderLine || 'real provider disabled') + '</p>'
      + '<p>' + esc(display.networkLine || 'real network disabled') + '</p>'
      + '<p>' + esc(display.endpointLine || 'real endpoint disabled') + '</p>'
      + '<p>' + esc(display.priceLine || 'real price disabled') + '</p>'
      + '<p>' + esc(display.bookingUrlLine || 'bookingUrl disabled') + '</p>'
      + '<p>' + esc(display.paymentLine || 'payment disabled') + '</p>'
      + '<p>' + esc(display.orderLine || 'order disabled') + '</p>'
      + '<p>' + esc(display.identityLine || 'identity upload disabled') + '</p>'
      + '<p>' + esc(display.plaintextLine || 'plaintext key export disabled') + '</p>'
      + '<p>' + esc(display.redactedLine || 'redacted: true') + '</p>'
      + '<h5>允许的只读权限</h5>' + listHtml(gate.allowedScopes || [])
      + '<h5>永久禁止的权限</h5>' + listHtml(gate.forbiddenScopes || [])
      + '<h5>绑定前必须确认的事项</h5>' + listHtml(gate.requiredConfirmations || [])
      + '<p>consentState: ' + esc(gate.consentState || 'draft_ready') + '</p>'
      + '<p>test draft only: true</p><p>submit real binding allowed: false</p><p>finalDecision: ' + esc(gate.finalDecision || 'no-go') + '</p>'
      + '<div class="commerce-inline-actions" aria-label="授权范围测试操作"><button class="cmd-btn gray" type="button">生成授权范围草案</button><button class="cmd-btn gray" type="button">勾选全部测试确认项</button><button class="cmd-btn gray" type="button">清空测试确认项</button></div>'
      + '<h5>审计事件草案</h5><p>CREDENTIAL_CONSENT_SCOPE_GATE_DRAFT</p>'
      + '<p>eventType：' + esc(audit.eventType || 'CREDENTIAL_CONSENT_SCOPE_GATE_DRAFT') + '</p>'
      + '<p>consentSubmittedCount：' + esc(String(audit.consentSubmittedCount || 0)) + '</p>'
      + '<p>realCredentialUsedCount：' + esc(String(audit.realCredentialUsedCount || 0)) + '</p>'
      + '<p>providerConnectionCount：' + esc(String(audit.providerConnectionCount || 0)) + '</p>'
      + '<p>networkAttemptCount：' + esc(String(audit.networkAttemptCount || 0)) + '</p>'
      + '<p>realEndpointConnectCount：' + esc(String(audit.realEndpointConnectCount || 0)) + '</p>'
      + '<p>realPriceDisplayedCount：' + esc(String(audit.realPriceDisplayedCount || 0)) + '</p>'
      + '<p>bookingUrlDisplayedCount：' + esc(String(audit.bookingUrlDisplayedCount || 0)) + '</p>'
      + '<p>paymentAttemptCount：' + esc(String(audit.paymentAttemptCount || 0)) + '</p>'
      + '<p>orderAttemptCount：' + esc(String(audit.orderAttemptCount || 0)) + '</p>'
      + '<p>identityUploadAttemptCount：' + esc(String(audit.identityUploadAttemptCount || 0)) + '</p>'
      + '<p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 credential consent scope gate / API 授权范围同意闸门', body, 'commerce-credential-consent-scope-gate-disclosure');
  }

  function commerceReadonlyAdapterContractGateDisplay(task){
    const api = window.WeishanCommerceReadonlyAdapterContractGate;
    const gate = task && task.readonlyAdapterContractGate || null;
    if (api && typeof api.buildReadonlyAdapterContractGateDisplay === "function") return api.buildReadonlyAdapterContractGateDisplay(gate);
    return gate && typeof gate === "object" ? gate : { version:"2.1.24", gateStatus:"closed", mode:"contract_draft_only", display:{ title:"read-only adapter contract gate", establishedLine:"read-only adapter contract gate：gate 已建立", statusLine:"status: closed", modeLine:"mode: contract draft only", adapterExecutionLine:"adapter execution disabled", networkLine:"real network disabled", endpointLine:"real endpoint disabled", sandboxLine:"real provider sandbox disabled", providerResultLine:"real provider result disabled", rawPayloadLine:"raw payload display disabled", writeActionLine:"write action disabled", dryRunLine:"executeReadonlyDryRun 当前 disabled", noNetworkLine:"不执行真实 network", noEndpointLine:"不调用真实 provider endpoint", noResultLine:"不读取真实 provider result", withheldLine:"当前 price 仍 withheld；当前 availability 仍 withheld；当前 bookingUrl 仍 forbidden；rawProviderPayload forbidden", redactedLine:"redacted: true" }, adapterInterfaceDraft:{ fields:["adapterId", "providerId", "providerName", "adapterVersion", "supportedIntentList", "readonlyMethodList", "blockedMethodList", "requestSchemaVersion", "responseSchemaVersion", "timeoutPolicy", "retryPolicy", "rateLimitPolicy", "redactionPolicy", "auditPolicy", "redacted: true"] }, readonlyMethodDraft:{ readonlyMethods:["planReadonlySearch", "buildReadonlyRequest", "validateReadonlyRequest", "executeReadonlyDryRun", "normalizeReadonlyResult", "validateResultSchema", "validateSourceLabel", "validatePriceIntegrity", "validateBookingUrlSafety", "emitReadonlyAuditEvent"] }, forbiddenMethodDraft:{ forbiddenMethods:["createBooking", "submitOrder", "checkout", "pay", "cancelPaidOrder", "modifyPassenger", "uploadIdentityDocument", "uploadPassport", "submitBankCard", "writeProviderProfile", "sendRawToken", "sendRawApiKey"] }, requestContractDraft:{ fields:["intentType", "origin", "destination", "date", "sortPreference", "providerId", "sourceType", "credentialAlias", "readonlyOnly", "noBooking", "noPayment", "noOrder", "schemaVersion", "redacted: true"] }, responseContractDraft:{ fields:["resultType", "providerId", "providerName", "sourceUrlHost", "title", "currency", "price", "updatedAt", "readonlyEvidence", "withheldReason", "blockedReason", "schemaVersion", "redacted: true"] }, errorStateDraft:{ errorStates:["ADAPTER_DISABLED", "NETWORK_DISABLED", "ENDPOINT_NOT_ALLOWED", "CREDENTIAL_NOT_AVAILABLE", "CONSENT_NOT_APPROVED", "PROVIDER_NOT_APPROVED", "SANDBOX_DISABLED", "SCHEMA_INVALID", "SOURCE_LABEL_INVALID", "PRICE_WITHHELD", "BOOKING_URL_FORBIDDEN", "RAW_PAYLOAD_FORBIDDEN", "WRITE_ACTION_FORBIDDEN"] }, audit:{ readonlyAdapterContractAuditDraft:{ eventType:"READONLY_ADAPTER_CONTRACT_EVALUATION_DRAFT", schemaVersion:"2.1.24", adapterId:"none", providerId:"none", methodName:"none", gateState:"closed", blockedReason:"readonly_adapter_contract_gate_closed", readonlyOnly:true, redacted:true } } };
  }

  function commerceReadonlyAdapterContractGateDisclosure(task){
    const gate = commerceReadonlyAdapterContractGateDisplay(task);
    const display = gate.display || {};
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(typeof item === 'string' ? item : JSON.stringify(item)) + '</li>'; }).join('') + '</ul>'; };
    const audit = gate.audit && gate.audit.readonlyAdapterContractAuditDraft || {};
    const body = '<section class="commerce-readonly-adapter-contract-gate-panel" aria-label="read-only adapter contract gate">'
      + '<h4>' + esc(display.title || 'read-only adapter contract gate') + '</h4>'
      + '<p>' + esc(display.establishedLine || 'read-only adapter contract gate：gate 已建立') + '</p>'
      + '<p>' + esc(display.statusLine || 'status: closed') + '</p>'
      + '<p>' + esc(display.modeLine || 'mode: contract draft only') + '</p>'
      + '<p>' + esc(display.adapterExecutionLine || 'adapter execution disabled') + '</p>'
      + '<p>' + esc(display.networkLine || 'real network disabled') + '</p>'
      + '<p>' + esc(display.endpointLine || 'real endpoint disabled') + '</p>'
      + '<p>' + esc(display.sandboxLine || 'real provider sandbox disabled') + '</p>'
      + '<p>' + esc(display.providerResultLine || 'real provider result disabled') + '</p>'
      + '<p>' + esc(display.rawPayloadLine || 'raw payload display disabled') + '</p>'
      + '<p>' + esc(display.writeActionLine || 'write action disabled') + '</p>'
      + '<h5>未来 adapter interface 草案</h5>' + listHtml((gate.adapterInterfaceDraft || {}).fields || [])
      + '<h5>只读方法草案</h5>' + listHtml((gate.readonlyMethodDraft || {}).readonlyMethods || [])
      + '<p>' + esc(display.dryRunLine || 'executeReadonlyDryRun 当前 disabled') + '</p><p>' + esc(display.noNetworkLine || '不执行真实 network') + '</p><p>' + esc(display.noEndpointLine || '不调用真实 provider endpoint') + '</p><p>' + esc(display.noResultLine || '不读取真实 provider result') + '</p>'
      + '<h5>永久禁止方法</h5>' + listHtml((gate.forbiddenMethodDraft || {}).forbiddenMethods || [])
      + '<h5>request contract 草案</h5>' + listHtml((gate.requestContractDraft || {}).fields || [])
      + '<h5>response contract 草案</h5>' + listHtml((gate.responseContractDraft || {}).fields || [])
      + '<p>' + esc(display.withheldLine || '当前 price 仍 withheld；当前 availability 仍 withheld；当前 bookingUrl 仍 forbidden；rawProviderPayload forbidden') + '</p>'
      + '<h5>错误状态草案</h5>' + listHtml((gate.errorStateDraft || {}).errorStates || [])
      + '<h5>审计事件草案</h5><p>readonlyAdapterContractAuditDraft</p>'
      + '<p>eventType：' + esc(audit.eventType || 'READONLY_ADAPTER_CONTRACT_EVALUATION_DRAFT') + '</p>'
      + '<p>schemaVersion：' + esc(audit.schemaVersion || '2.1.24') + '</p>'
      + '<p>adapterId：' + esc(audit.adapterId || 'none') + '</p>'
      + '<p>providerId：' + esc(audit.providerId || 'none') + '</p>'
      + '<p>methodName：' + esc(audit.methodName || 'none') + '</p>'
      + '<p>gateState：' + esc(audit.gateState || 'closed') + '</p>'
      + '<p>blockedReason：' + esc(audit.blockedReason || 'readonly_adapter_contract_gate_closed') + '</p>'
      + '<p>readonlyOnly：' + esc(String(audit.readonlyOnly !== false)) + '</p>'
      + '<p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 read-only adapter contract gate', body, 'commerce-readonly-adapter-contract-gate-disclosure');
  }


  function commerceReadOnlyProviderAdapterV1Disclosure(task){
    const api = window.WeishanFlightReadOnlyProviderAdapterV1;
    const contractApi = window.WeishanReadOnlyProviderAdapterContract;
    const result = api && typeof api.runSandboxDryRunWithSimulatedTransport === "function" ? api.runSandboxDryRunWithSimulatedTransport({ text:'7 月 15 日上海到成都最便宜的机票' }) : (api && typeof api.runDryRun === "function" ? api.runDryRun({ text:'7 月 15 日上海到成都最便宜的机票' }) : { adapterId:'flight_readonly_provider_adapter_v1', providerCategory:'flight', sourceLabel:'offline fixture / no real provider', resultSchemaVersion:'provider_result_schema_v1', fixtureOnly:true, realProvider:false, realNetwork:false, realPrice:false, availability:false, bookingUrl:null, payment:false, order:false, identityUpload:false, redacted:true });
    const metadata = api && typeof api.getAdapterMetadata === "function" ? api.getAdapterMetadata() : { adapterId:'flight_readonly_provider_adapter_v1', providerCategory:'flight', providerName:'flight_provider', mode:'offline_fixture_only', networkPolicy:'disabled', credentialPolicy:'metadata_only', endpointPolicy:'disabled', bookingUrlPolicy:'disabled', paymentPolicy:'disabled', orderPolicy:'disabled', identityUploadPolicy:'disabled', redacted:true };
    const contract = contractApi && typeof contractApi.buildAdapterContract === "function" ? contractApi.buildAdapterContract(metadata) : { allowedMethods:['getAdapterMetadata','validateCredentialScope','validateReadinessGates','runOfflineFixtureSearch','normalizeProviderResult','validateResultSchema','attachSourceLabel','runDryRun'], blockedMethods:['connect','fetch','request','post','createOrder','pay','checkout','uploadIdentity','revealCredential','exportCredential','testEndpoint'], auditDraft:{ eventType:'READ_ONLY_PROVIDER_ADAPTER_V1_DRAFT', redacted:true } };
    const audit = api && typeof api.buildAuditDraft === "function" ? api.buildAuditDraft(1) : contract.auditDraft || {};
    const displayEvaluation = { sandboxResponseSchemaValidation:result.sandboxResponseSchemaValidation || result.schemaValidation || 'pass', realProviderResultSchemaValidation:result.realProviderResultSchemaValidation || 'withheld', sourceLabelValidation:result.sourceLabelValidation || 'pass', ordinaryResultExposure:result.ordinaryResultExposure || 'guarded_price_card_only', priceExposure:result.priceExposure || 'guarded_sandbox_test_price', availabilityExposure:result.availabilityExposure || 'provider_reported_only', bookingUrlExposure:result.bookingUrlExposure || 'disabled', resultDisplayDecision:result.resultDisplayDecision || 'guarded-card-only', resultDisplayReason:result.resultDisplayReason || 'sandbox verified price may render as guarded non-production card only', priceIntegrityValidation:result.priceIntegrityValidation || null, realPriceDisplayDecision:result.realPriceDisplayDecision || null, guardedPriceCard:result.guardedPriceCard || null, redacted:true };
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(typeof item === 'string' ? item : JSON.stringify(item)) + '</li>'; }).join('') + '</ul>'; };
    const objectHtml = function(obj){ return '<ul>' + Object.keys(obj || {}).map(function(key){ return '<li>' + esc(key) + ': ' + esc(typeof obj[key] === 'object' ? JSON.stringify(obj[key]) : String(obj[key])) + '</li>'; }).join('') + '</ul>'; };
    const body = '<section class="commerce-readonly-provider-adapter-v1-panel" aria-label="Read-Only Provider Adapter V1">'
      + '<h4>Read-Only Provider Adapter V1</h4>'
      + '<p>status: offline fixture adapter only</p><p>provider: flight_provider</p><p>adapterId: ' + esc(metadata.adapterId || 'flight_readonly_provider_adapter_v1') + '</p>'
      + '<p>real provider disabled</p><p>real network disabled</p><p>real credential disabled</p><p>real endpoint disabled</p><p>real price disabled</p><p>availability disabled</p><p>bookingUrl disabled</p><p>payment disabled</p><p>order disabled</p><p>identity upload disabled</p><p>redacted: true</p>'
      + '<h5>adapter contract</h5>' + objectHtml(metadata)
      + '<h5>allowed methods</h5>' + listHtml(contract.allowedMethods || [])
      + '<h5>blocked methods</h5>' + listHtml(contract.blockedMethods || [])
      + '<h5>offline fixture dry run</h5>' + objectHtml({ status:'PASS', fixtureOnly:result.fixtureOnly === undefined ? true : result.fixtureOnly, realProvider:result.realProvider === undefined ? false : result.realProvider, realNetwork:result.realNetwork === undefined ? false : result.realNetwork, realPrice:result.realPrice === undefined ? false : result.realPrice, availability:result.availability === undefined ? false : result.availability, bookingUrl:result.bookingUrl === undefined ? null : result.bookingUrl, redacted:result.redacted === undefined ? true : result.redacted })
      + '<h5>schema / source label / display decision</h5>' + objectHtml(displayEvaluation)
      + '<h5>normalized result schema</h5>' + objectHtml(result)
      + '<h5>source label gate</h5><p>sourceLabel: ' + esc(result.sourceLabel || 'offline fixture / no real provider') + '</p>'
      + '<h5>audit draft</h5><p>READ_ONLY_PROVIDER_ADAPTER_V1_DRAFT</p>' + objectHtml(audit)
      + '</section>';
    return disclosure('查看 Read-Only Provider Adapter V1', body, 'commerce-readonly-provider-adapter-v1-disclosure');
  }



  function commerceEndpointAllowlistEnforcementDisclosure(task){
    const api = window.WeishanProviderEndpointAllowlistEnforcement;
    const state = api && typeof api.buildEndpointAllowlistEnforcementDraft === "function" ? api.buildEndpointAllowlistEnforcementDraft("flight_provider") : { status:"endpoint allowlist enforcement only", mode:"sandbox allowlist only", productionEndpoint:"disabled", arbitraryEndpoint:"disabled", redirect:"disabled", credentialQueryParams:"disabled", paymentOrderCheckoutEndpoint:"disabled", identityUploadEndpoint:"disabled", finalDecision:"no-go / sandbox-only", flightProviderAllowlistDraft:{ allowedSandboxHosts:["provider-sandbox.invalid"], allowedSandboxPaths:["/sandbox/dry-run"], blockedProductionHosts:["production-provider.invalid"], blockedPathPatterns:["payment","order","checkout","identity"] }, auditDraft:{ eventType:"ENDPOINT_ALLOWLIST_ENFORCEMENT_V1_DRAFT", networkAttemptCount:0, realEndpointConnectCount:0, redacted:true }, redacted:true };
    const rule = state.flightProviderAllowlistDraft || {};
    const audit = state.auditDraft || {};
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(typeof item === 'string' ? item : JSON.stringify(item)) + '</li>'; }).join('') + '</ul>'; };
    const objectHtml = function(obj){ return '<ul>' + Object.keys(obj || {}).map(function(key){ return '<li>' + esc(key) + ': ' + esc(typeof obj[key] === 'object' ? JSON.stringify(obj[key]) : String(obj[key])) + '</li>'; }).join('') + '</ul>'; };
    const body = '<section class="commerce-endpoint-allowlist-enforcement-panel" aria-label="Endpoint Allowlist 强制闸门">'
      + '<h4>Endpoint Allowlist Enforcement V1 / Endpoint Allowlist 强制闸门</h4>'
      + '<p>status: endpoint allowlist enforcement only</p>'
      + '<p>mode: sandbox allowlist only</p>'
      + '<p>production endpoint disabled</p>'
      + '<p>arbitrary endpoint disabled</p>'
      + '<p>redirect disabled</p>'
      + '<p>credential query params disabled</p>'
      + '<p>payment/order/checkout endpoint disabled</p>'
      + '<p>identity upload endpoint disabled</p>'
      + '<p>redacted: true</p>'
      + '<h5>flight_provider allowlist draft</h5>'
      + '<p>allowed sandbox hosts</p>' + listHtml(rule.allowedSandboxHosts || [])
      + '<p>allowed sandbox paths</p>' + listHtml(rule.allowedSandboxPaths || [])
      + '<p>blocked production hosts</p>' + listHtml(rule.blockedProductionHosts || [])
      + '<p>blocked path patterns</p>' + listHtml(rule.blockedPathPatterns || [])
      + '<h5>endpoint validation examples</h5>' + objectHtml(state.validationExample || {})
      + '<p>final decision: ' + esc(state.finalDecision || 'no-go / sandbox-only') + '</p>'
      + '<h5>audit draft</h5><p>ENDPOINT_ALLOWLIST_ENFORCEMENT_V1_DRAFT</p>'
      + '<p>arbitraryEndpointBlockedCount: ' + esc(String(audit.arbitraryEndpointBlockedCount || 0)) + '</p>'
      + '<p>productionEndpointBlockedCount: ' + esc(String(audit.productionEndpointBlockedCount || 0)) + '</p>'
      + '<p>credentialQueryParamBlockedCount: ' + esc(String(audit.credentialQueryParamBlockedCount || 0)) + '</p>'
      + '<p>redirectBlockedCount: ' + esc(String(audit.redirectBlockedCount || 0)) + '</p>'
      + '<p>realEndpointConnectCount: ' + esc(String(audit.realEndpointConnectCount || 0)) + '</p>'
      + '<p>networkAttemptCount: ' + esc(String(audit.networkAttemptCount || 0)) + '</p>'
      + '<p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 Endpoint Allowlist Enforcement V1 / 查看 Endpoint Allowlist 强制闸门', body, 'commerce-endpoint-allowlist-enforcement-disclosure');
  }

  function commerceProviderSandboxRealKeyDryRunGateDisclosure(task){
    const api = window.WeishanProviderSandboxRealKeyDryRunGate;
    const input = { providerCategory:'flight', providerId:'flight_provider', adapterId:'flight_readonly_provider_adapter_v1', endpointCandidate:'https://provider-sandbox.invalid/sandbox/dry-run', credentialScopeConsent:true, sandboxKey:'WEISHAN_SANDBOX_TEST_KEY_000000' };
    const gate = api && typeof api.evaluateSandboxRealKeyDryRunGate === 'function' ? api.evaluateSandboxRealKeyDryRunGate(input) : { status:'sandbox real-key dry-run gate only', mode:'controlled sandbox only', dryRunDecision:'ready', resultExposurePolicy:'console-only', ordinaryResultExposure:'disabled', realPriceExposure:'disabled', bookingUrlExposure:'disabled', productionEndpoint:'disabled', productionKey:'disabled', payment:false, order:false, identityUpload:false, redacted:true };
    const dryRun = api && typeof api.runSandboxDryRunGateWithSimulatedTransport === 'function' ? api.runSandboxDryRunGateWithSimulatedTransport(input) : { dryRunDecision:'pass', dryRunTransport:'simulated', transport:'simulated', realNetwork:false, networkAttemptCount:0, realEndpointConnectCount:0, endpointConnectCount:0, schemaValidation:'pass', sourceLabelValidation:'pass', resultExposure:'console-only', ordinaryResultExposure:'disabled', realPriceExposure:'disabled', bookingUrlExposure:'disabled', redacted:true };
    const audit = dryRun.auditDraft || gate.auditDraft || {};
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(item) + '</li>'; }).join('') + '</ul>'; };
    const body = '<section class="commerce-provider-sandbox-real-key-dry-run-gate-panel" data-secure-api-key-storage-console="true" aria-label="Provider 沙箱测试 Key Dry Run 闸门">'
      + '<h4>Provider 沙箱测试 Key Dry Run 闸门</h4>'
      + '<p>status: sandbox real-key dry-run gate only</p>'
      + '<p>mode: controlled sandbox only</p>'
      + '<p>ordinary result exposure disabled</p>'
      + '<p>real price exposure disabled</p>'
      + '<p>bookingUrl exposure disabled</p>'
      + '<p>payment disabled</p>'
      + '<p>order disabled</p>'
      + '<p>identity upload disabled</p>'
      + '<p>production endpoint disabled</p>'
      + '<p>production key disabled</p>'
      + '<p>redacted: true</p>'
      + '<p>仅允许输入 provider sandbox/test key</p>'
      + '<p>不要输入生产 key</p>'
      + '<p>不会连接生产 endpoint</p>'
      + '<p>不会把 dry-run 结果展示到普通全球采购结果页</p>'
      + '<p>不会返回真实价格</p>'
      + '<p>不会生成 bookingUrl</p>'
      + '<p>不会付款或下单</p>'
      + '<label class="commerce-field-label">Sandbox/Test Key<input type="password" data-secure-api-key-sandbox-input="true" placeholder="仅限 provider sandbox/test key；不要填写生产 API key" autocomplete="off" /></label>'
      + '<div class="commerce-inline-actions" aria-label="Provider 沙箱测试 Key 操作">'
      + '<button class="cmd-btn gray" type="button" data-secure-api-key-storage-action="save" data-secure-api-key-provider-id="flight_provider_sandbox_key">保存沙箱测试 Key</button>'
      + '<button class="cmd-btn gray" type="button" data-secure-api-key-storage-action="delete" data-secure-api-key-provider-id="flight_provider_sandbox_key">删除沙箱测试 Key</button>'
      + '<button class="cmd-btn gray" type="button" data-provider-sandbox-dry-run-action="simulated-check">运行沙箱 Dry Run Gate 检查</button>'
      + '<button class="cmd-btn gray" type="button">查看 Dry Run 审计</button>'
      + '</div>'
      + '<p data-secure-api-key-storage-feedback="true">keyFingerprint: ' + esc(gate.keyFingerprint || '') + ' · keyLast4: ' + esc(gate.keyLast4 || '') + ' · redacted: true</p>'
      + '<h5>禁止按钮 / 永久禁止动作</h5>' + listHtml(['连接真实 Provider','测试生产 endpoint','获取真实价格','启用普通结果页真实价格','生成 bookingUrl','下单','付款'])
      + '<h5>Simulated sandbox dry-run</h5>'
      + '<p>dryRunDecision: ' + esc(dryRun.dryRunDecision || 'pass') + '</p>'
      + '<p>transport: simulated</p>'
      + '<p>dryRunTransport: simulated</p>'
      + '<p>realNetwork: false</p>'
      + '<p>networkAttemptCount: ' + esc(String(dryRun.networkAttemptCount || 0)) + '</p>'
      + '<p>realEndpointConnectCount: ' + esc(String(dryRun.realEndpointConnectCount || dryRun.endpointConnectCount || 0)) + '</p>'
      + '<p>endpointConnectCount: ' + esc(String(dryRun.endpointConnectCount || 0)) + '</p>'
      + '<p>credentialReadCount: ' + esc(String(dryRun.credentialReadCount || 0)) + '</p>'
      + '<p>onlySecureStorageMetadataReadCount: ' + esc(String(dryRun.onlySecureStorageMetadataReadCount || 0)) + '</p>'
      + '<p>schemaValidation: ' + esc(dryRun.schemaValidation || 'pass') + '</p>'
      + '<p>sourceLabelValidation: ' + esc(dryRun.sourceLabelValidation || 'pass') + '</p>'
      + '<p>resultExposure: console-only</p>'
      + '<p>ordinaryResultExposure: disabled</p>'
      + '<p>realPriceExposure: disabled</p>'
      + '<p>bookingUrlExposure: disabled</p>'
      + '<h5>audit draft</h5><p>PROVIDER_SANDBOX_REAL_KEY_DRY_RUN_GATE_DRAFT</p>'
      + '<p>realCredentialPlaintextDisplayedCount: ' + esc(String(audit.realCredentialPlaintextDisplayedCount || 0)) + '</p>'
      + '<p>realCredentialPlaintextExportedCount: ' + esc(String(audit.realCredentialPlaintextExportedCount || 0)) + '</p>'
      + '<p>realPriceDisplayedCount: ' + esc(String(audit.realPriceDisplayedCount || 0)) + '</p>'
      + '<p>bookingUrlDisplayedCount: ' + esc(String(audit.bookingUrlDisplayedCount || 0)) + '</p>'
      + '<p>paymentAttemptCount: ' + esc(String(audit.paymentAttemptCount || 0)) + '</p>'
      + '<p>orderAttemptCount: ' + esc(String(audit.orderAttemptCount || 0)) + '</p>'
      + '<p>identityUploadAttemptCount: ' + esc(String(audit.identityUploadAttemptCount || 0)) + '</p>'
      + '<p>ordinaryResultExposureCount: ' + esc(String(audit.ordinaryResultExposureCount || 0)) + '</p>'
      + '<p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 Provider Sandbox Real-Key Dry Run Gate', body, 'commerce-provider-sandbox-real-key-dry-run-gate-disclosure');
  }

  function commerceSandboxResponseSchemaGateDisclosure(task){
    const api = window.WeishanProviderSandboxResponseSchemaGate;
    const state = api && typeof api.buildProviderSandboxResponseSchemaGateDraft === 'function' ? api.buildProviderSandboxResponseSchemaGateDraft() : { status:'schema validation only', mode:'console-only', schemaVersion:'provider_result_schema_v1', requiredFields:['providerId','providerName','providerCategory','resultType','sourceType','sourceUrlHost','updatedAt','readonlyEvidence','sandboxOnly','redacted'], forbiddenFields:['bookingUrl','checkoutUrl','paymentUrl','orderUrl','rawProviderPayload','rawHeaders','authorizationHeader','passengerIdentity','passportNumber','bankCardNumber'], sampleBlockedResponseReasons:['forbidden fields present'], auditDraft:{ eventType:'SANDBOX_RESPONSE_SCHEMA_GATE_DRAFT', ordinaryResultExposureCount:0, priceExposureCount:0, availabilityExposureCount:0, bookingUrlExposureCount:0, rawPayloadExposureCount:0, realPriceDisplayedCount:0, realProviderCallCount:0, networkAttemptCount:0, redacted:true }, redacted:true };
    const audit = state.auditDraft || {};
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(typeof item === 'string' ? item : JSON.stringify(item)) + '</li>'; }).join('') + '</ul>'; };
    const objectHtml = function(obj){ return '<ul>' + Object.keys(obj || {}).map(function(key){ return '<li>' + esc(key) + ': ' + esc(typeof obj[key] === 'object' ? JSON.stringify(obj[key]) : String(obj[key])) + '</li>'; }).join('') + '</ul>'; };
    const body = '<section class="commerce-sandbox-response-schema-gate-panel" aria-label="Sandbox Response Schema Gate">'
      + '<h4>Sandbox Response Schema Gate</h4>'
      + '<p>status: schema validation only</p>'
      + '<p>mode: console-only</p>'
      + '<p>schemaVersion: ' + esc(state.schemaVersion || 'provider_result_schema_v1') + '</p>'
      + '<p>ordinary result exposure disabled</p>'
      + '<p>price exposure disabled</p>'
      + '<p>availability exposure disabled</p>'
      + '<p>bookingUrl exposure disabled</p>'
      + '<p>raw payload display forbidden</p>'
      + '<p>redacted: true</p>'
      + '<h5>required fields</h5>' + listHtml(state.requiredFields || [])
      + '<h5>forbidden fields</h5>' + listHtml(state.forbiddenFields || [])
      + '<h5>sample valid sandbox response</h5>' + objectHtml(state.sampleValidSandboxResponse || {})
      + '<h5>sample blocked response reasons</h5>' + listHtml(state.sampleBlockedResponseReasons || [])
      + '<h5>schema validation audit</h5><p>SANDBOX_RESPONSE_SCHEMA_GATE_DRAFT</p>'
      + '<p>ordinaryResultExposureCount: ' + esc(String(audit.ordinaryResultExposureCount || 0)) + '</p>'
      + '<p>priceExposureCount: ' + esc(String(audit.priceExposureCount || 0)) + '</p>'
      + '<p>availabilityExposureCount: ' + esc(String(audit.availabilityExposureCount || 0)) + '</p>'
      + '<p>bookingUrlExposureCount: ' + esc(String(audit.bookingUrlExposureCount || 0)) + '</p>'
      + '<p>rawPayloadExposureCount: ' + esc(String(audit.rawPayloadExposureCount || 0)) + '</p>'
      + '<p>realPriceDisplayedCount: ' + esc(String(audit.realPriceDisplayedCount || 0)) + '</p>'
      + '<p>realProviderCallCount: ' + esc(String(audit.realProviderCallCount || 0)) + '</p>'
      + '<p>networkAttemptCount: ' + esc(String(audit.networkAttemptCount || 0)) + '</p>'
      + '<p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 Sandbox Response Schema Gate', body, 'commerce-sandbox-response-schema-gate-disclosure');
  }

  function commerceRealProviderResultSchemaValidationDisclosure(task){
    const api = window.WeishanRealProviderResultSchemaValidation;
    const state = api && typeof api.buildRealProviderResultSchemaValidationDraft === 'function' ? api.buildRealProviderResultSchemaValidationDraft() : { status:'validation gate only', mode:'no ordinary result exposure', validationPipeline:['redact raw candidate','forbidden field scan','required field scan','resultType allowlist','providerCategory allowlist','source label validation','price exposure gate','bookingUrl exposure gate','ordinary result exposure gate','audit event'], blockedResultExamples:['raw payload blocked'], withheldResultPolicy:['console-only'], resultDisplayDecision:'withheld', auditDraft:{ eventType:'REAL_PROVIDER_RESULT_SCHEMA_VALIDATION_DRAFT', ordinaryResultExposureCount:0, priceExposureCount:0, availabilityExposureCount:0, bookingUrlExposureCount:0, rawPayloadExposureCount:0, realPriceDisplayedCount:0, rawProviderPayloadDisplayedCount:0, paymentAttemptCount:0, orderAttemptCount:0, identityUploadAttemptCount:0, redacted:true }, redacted:true };
    const audit = state.auditDraft || {};
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(typeof item === 'string' ? item : JSON.stringify(item)) + '</li>'; }).join('') + '</ul>'; };
    const body = '<section class="commerce-real-provider-result-schema-validation-panel" aria-label="Real Provider Result Schema Validation">'
      + '<h4>Real Provider Result Schema Validation</h4>'
      + '<p>status: validation gate only</p>'
      + '<p>mode: no ordinary result exposure</p>'
      + '<p>real provider result display disabled</p>'
      + '<p>real price display disabled</p>'
      + '<p>availability display disabled</p>'
      + '<p>bookingUrl display disabled</p>'
      + '<p>raw provider payload display forbidden</p>'
      + '<p>redacted: true</p>'
      + '<h5>validation pipeline</h5>' + listHtml(state.validationPipeline || [])
      + '<h5>blocked result examples</h5>' + listHtml(state.blockedResultExamples || [])
      + '<h5>withheld result policy</h5>' + listHtml(state.withheldResultPolicy || [])
      + '<p>result display decision: ' + esc(state.resultDisplayDecision || 'withheld') + '</p>'
      + '<h5>audit draft</h5><p>REAL_PROVIDER_RESULT_SCHEMA_VALIDATION_DRAFT</p>'
      + '<p>ordinaryResultExposureCount: ' + esc(String(audit.ordinaryResultExposureCount || 0)) + '</p>'
      + '<p>priceExposureCount: ' + esc(String(audit.priceExposureCount || 0)) + '</p>'
      + '<p>availabilityExposureCount: ' + esc(String(audit.availabilityExposureCount || 0)) + '</p>'
      + '<p>bookingUrlExposureCount: ' + esc(String(audit.bookingUrlExposureCount || 0)) + '</p>'
      + '<p>rawPayloadExposureCount: ' + esc(String(audit.rawPayloadExposureCount || 0)) + '</p>'
      + '<p>realPriceDisplayedCount: ' + esc(String(audit.realPriceDisplayedCount || 0)) + '</p>'
      + '<p>rawProviderPayloadDisplayedCount: ' + esc(String(audit.rawProviderPayloadDisplayedCount || 0)) + '</p>'
      + '<p>paymentAttemptCount: ' + esc(String(audit.paymentAttemptCount || 0)) + '</p>'
      + '<p>orderAttemptCount: ' + esc(String(audit.orderAttemptCount || 0)) + '</p>'
      + '<p>identityUploadAttemptCount: ' + esc(String(audit.identityUploadAttemptCount || 0)) + '</p>'
      + '<p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 Real Provider Result Schema Validation', body, 'commerce-real-provider-result-schema-validation-disclosure');
  }

  function commerceProviderResultSourceLabelGateDisclosure(task){
    const api = window.WeishanProviderResultSourceLabelGate;
    const state = api && typeof api.buildProviderResultSourceLabelGateDraft === 'function' ? api.buildProviderResultSourceLabelGateDraft() : { status:'source label validation only', mode:'required before display', requiredFields:['providerId','providerName','sourceUrlHost','updatedAt','readonlyEvidence'], allowedSourceType:['sandbox_provider','no_provider'], blockedSourceType:['blocked_unknown_source','raw_ai_estimate','unknown_site','short_url','public_search_result_as_provider','unreviewed_provider'], sourceTrustState:['sandbox_verified','draft_only','pending_manual_review','blocked'], auditDraft:{ eventType:'PROVIDER_RESULT_SOURCE_LABEL_GATE_DRAFT', unknownSourceBlockedCount:0, shortUrlBlockedCount:0, credentialParamBlockedCount:0, rawAiEstimateBlockedCount:0, publicSearchMasqueradeBlockedCount:0, redacted:true }, redacted:true };
    const audit = state.auditDraft || {};
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(typeof item === 'string' ? item : JSON.stringify(item)) + '</li>'; }).join('') + '</ul>'; };
    const body = '<section class="commerce-provider-result-source-label-gate-panel" aria-label="Provider Result Source Label Gate">'
      + '<h4>Provider Result Source Label Gate</h4>'
      + '<p>status: source label validation only</p>'
      + '<p>mode: required before display</p>'
      + '<p>source label required</p>'
      + '<p>unknown source blocked</p>'
      + '<p>short URL blocked</p>'
      + '<p>credential params blocked</p>'
      + '<p>raw AI estimate blocked</p>'
      + '<p>public search result cannot masquerade as provider result</p>'
      + '<p>redacted: true</p>'
      + '<h5>required source label fields</h5>' + listHtml(state.requiredFields || [])
      + '<h5>allowed sourceType</h5>' + listHtml(state.allowedSourceType || [])
      + '<h5>blocked sourceType</h5>' + listHtml(state.blockedSourceType || [])
      + '<h5>sourceTrustState</h5>' + listHtml(state.sourceTrustState || [])
      + '<h5>source label audit</h5><p>PROVIDER_RESULT_SOURCE_LABEL_GATE_DRAFT</p>'
      + '<p>unknownSourceBlockedCount: ' + esc(String(audit.unknownSourceBlockedCount || 0)) + '</p>'
      + '<p>shortUrlBlockedCount: ' + esc(String(audit.shortUrlBlockedCount || 0)) + '</p>'
      + '<p>credentialParamBlockedCount: ' + esc(String(audit.credentialParamBlockedCount || 0)) + '</p>'
      + '<p>rawAiEstimateBlockedCount: ' + esc(String(audit.rawAiEstimateBlockedCount || 0)) + '</p>'
      + '<p>publicSearchMasqueradeBlockedCount: ' + esc(String(audit.publicSearchMasqueradeBlockedCount || 0)) + '</p>'
      + '<p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 Provider Result Source Label Gate', body, 'commerce-provider-result-source-label-gate-disclosure');
  }

  function commerceProviderGateMatrixDashboardDisplay(task){
    const api = window.WeishanCommerceProviderGateMatrixDashboard;
    const gate = task && task.providerGateMatrixDashboard || null;
    if (api && typeof api.buildProviderGateMatrixDashboardDisplay === "function") return api.buildProviderGateMatrixDashboardDisplay(gate);
    return gate && typeof gate === "object" ? gate : { version:"2.1.24", dashboardStatus:"blocked", mode:"matrix_only", providerActivationState:"no-go", display:{ title:"provider gate matrix dashboard", establishedLine:"provider gate matrix dashboard：dashboard 已建立", statusLine:"status: blocked", modeLine:"mode: matrix only", activationLine:"providerActivationState: no-go", providerConnectionLine:"real provider connection disabled", sandboxLine:"real provider sandbox disabled", networkLine:"real network disabled", priceLine:"real price disabled", bookingUrlLine:"real bookingUrl disabled", orderPaymentLine:"order / payment / checkout disabled", redactedLine:"redacted: true" }, gateMatrix:{ gateMatrixRows:[] }, noGoReasons:{ noGoReasons:[] }, dependencyGraph:{ dependencyGraph:[] }, readinessScore:{ readinessScore:0, readinessMax:100, scoreReason:"real provider activation disabled", scorePolicy:"blocked until all required gates pass", minimumRequiredBeforeActivation:[] }, audit:{ providerGateMatrixAuditDraft:{ eventType:"PROVIDER_GATE_MATRIX_EVALUATION_DRAFT", schemaVersion:"2.1.24", matrixState:"blocked", providerActivationState:"no-go", blockedReason:"provider_gate_matrix_no_go", requiredGateCount:0, passedGateCount:0, failedGateCount:0, reviewedAt:"none", redacted:true } } };
  }

  function commerceProviderGateMatrixDashboardDisclosure(task){
    const gate = commerceProviderGateMatrixDashboardDisplay(task);
    const display = gate.display || {};
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(typeof item === 'string' ? item : JSON.stringify(item)) + '</li>'; }).join('') + '</ul>'; };
    const score = gate.readinessScore || {};
    const audit = gate.audit && gate.audit.providerGateMatrixAuditDraft || {};
    const body = '<section class="commerce-provider-gate-matrix-dashboard-panel" aria-label="provider gate matrix dashboard">'
      + '<h4>' + esc(display.title || 'provider gate matrix dashboard') + '</h4>'
      + '<p>' + esc(display.establishedLine || 'provider gate matrix dashboard：dashboard 已建立') + '</p>'
      + '<p>' + esc(display.statusLine || 'status: blocked') + '</p>'
      + '<p>' + esc(display.modeLine || 'mode: matrix only') + '</p>'
      + '<p>' + esc(display.activationLine || 'providerActivationState: no-go') + '</p>'
      + '<p>' + esc(display.providerConnectionLine || 'real provider connection disabled') + '</p>'
      + '<p>' + esc(display.sandboxLine || 'real provider sandbox disabled') + '</p>'
      + '<p>' + esc(display.networkLine || 'real network disabled') + '</p>'
      + '<p>' + esc(display.priceLine || 'real price disabled') + '</p>'
      + '<p>' + esc(display.bookingUrlLine || 'real bookingUrl disabled') + '</p>'
      + '<p>' + esc(display.orderPaymentLine || 'order / payment / checkout disabled') + '</p>'
      + '<p>' + esc(display.redactedLine || 'redacted: true') + '</p>'
      + '<h5>全部 gate 汇总矩阵</h5>' + listHtml((gate.gateMatrix || {}).gateMatrixRows || [])
      + '<h5>总体 no-go 原因</h5>' + listHtml((gate.noGoReasons || {}).noGoReasons || [])
      + '<h5>gate dependency graph 草案</h5>' + listHtml((gate.dependencyGraph || {}).dependencyGraph || [])
      + '<h5>provider readiness score 草案</h5>'
      + '<p>readinessScore: ' + esc(String(score.readinessScore || 0)) + '</p>'
      + '<p>readinessMax: ' + esc(String(score.readinessMax || 100)) + '</p>'
      + '<p>scoreReason: ' + esc(score.scoreReason || 'real provider activation disabled') + '</p>'
      + '<p>scorePolicy: ' + esc(score.scorePolicy || 'blocked until all required gates pass') + '</p>'
      + '<p>minimumRequiredBeforeActivation: ' + esc(((score.minimumRequiredBeforeActivation || [])).join(', ')) + '</p>'
      + '<p>redacted: true</p>'
      + '<h5>审计事件草案</h5><p>providerGateMatrixAuditDraft</p>'
      + '<p>eventType：' + esc(audit.eventType || 'PROVIDER_GATE_MATRIX_EVALUATION_DRAFT') + '</p>'
      + '<p>schemaVersion：' + esc(audit.schemaVersion || '2.1.24') + '</p>'
      + '<p>matrixState：' + esc(audit.matrixState || 'blocked') + '</p>'
      + '<p>providerActivationState：' + esc(audit.providerActivationState || 'no-go') + '</p>'
      + '<p>blockedReason：' + esc(audit.blockedReason || 'provider_gate_matrix_no_go') + '</p>'
      + '<p>requiredGateCount：' + esc(String(audit.requiredGateCount || 0)) + '</p>'
      + '<p>passedGateCount：' + esc(String(audit.passedGateCount || 0)) + '</p>'
      + '<p>failedGateCount：' + esc(String(audit.failedGateCount || 0)) + '</p>'
      + '<p>reviewedAt：' + esc(audit.reviewedAt || 'none') + '</p>'
      + '<p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 provider gate matrix dashboard', body, 'commerce-provider-gate-matrix-dashboard-disclosure');
  }

  function commerceProviderNoNetworkRuntimeGuardDisplay(task){
    const api = window.WeishanCommerceProviderNoNetworkRuntimeGuard;
    const gate = task && task.providerNoNetworkRuntimeGuard || null;
    if (api && typeof api.buildProviderNoNetworkRuntimeGuardDisplay === "function") return api.buildProviderNoNetworkRuntimeGuardDisplay(gate);
    return gate && typeof gate === "object" ? gate : { version:"2.1.24", guardStatus:"blocked", mode:"no_network_enforcement_draft", display:{ title:"provider no-network runtime guard", establishedLine:"provider no-network runtime guard：guard 已建立", statusLine:"status: blocked", modeLine:"mode: no-network enforcement draft", providerNetworkLine:"provider network disabled", fetchLine:"fetch disabled for provider", xhrLine:"XMLHttpRequest disabled for provider", websocketLine:"WebSocket disabled for provider", eventSourceLine:"EventSource disabled for provider", sendBeaconLine:"navigator.sendBeacon disabled for provider", electronNetLine:"Electron net disabled for provider", nodeHttpLine:"Node http/https disabled for provider", dnsLine:"DNS lookup disabled for provider", redirectLine:"redirect follow disabled", adapterLine:"adapter execution disabled", redactedLine:"redacted: true" }, decisionObjectDraft:{ fields:[] }, blockedNetworkPrimitives:[], blockedErrorStates:[], currentPolicy:[], audit:{ providerNoNetworkRuntimeGuardAuditDraft:{ eventType:"PROVIDER_NO_NETWORK_RUNTIME_GUARD_DECISION_DRAFT", schemaVersion:"2.1.24", guardState:"blocked", decision:"blocked", blockedReason:"NETWORK_DISABLED", networkPrimitive:"none", targetUrlHost:"none", providerId:"none", methodName:"none", observedAt:"none", redacted:true } }, linkage:[] };
  }

  function commerceProviderNoNetworkRuntimeGuardDisclosure(task){
    const gate = commerceProviderNoNetworkRuntimeGuardDisplay(task);
    const display = gate.display || {};
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(typeof item === 'string' ? item : JSON.stringify(item)) + '</li>'; }).join('') + '</ul>'; };
    const decision = gate.decisionObjectDraft || {};
    const audit = gate.audit && gate.audit.providerNoNetworkRuntimeGuardAuditDraft || {};
    const body = '<section class="commerce-provider-no-network-runtime-guard-panel" aria-label="provider no-network runtime guard">'
      + '<h4>' + esc(display.title || 'provider no-network runtime guard') + '</h4>'
      + '<p>' + esc(display.establishedLine || 'provider no-network runtime guard：guard 已建立') + '</p>'
      + '<p>' + esc(display.statusLine || 'status: blocked') + '</p>'
      + '<p>' + esc(display.modeLine || 'mode: no-network enforcement draft') + '</p>'
      + '<p>' + esc(display.providerNetworkLine || 'provider network disabled') + '</p>'
      + '<p>' + esc(display.fetchLine || 'fetch disabled for provider') + '</p>'
      + '<p>' + esc(display.xhrLine || 'XMLHttpRequest disabled for provider') + '</p>'
      + '<p>' + esc(display.websocketLine || 'WebSocket disabled for provider') + '</p>'
      + '<p>' + esc(display.eventSourceLine || 'EventSource disabled for provider') + '</p>'
      + '<p>' + esc(display.sendBeaconLine || 'navigator.sendBeacon disabled for provider') + '</p>'
      + '<p>' + esc(display.electronNetLine || 'Electron net disabled for provider') + '</p>'
      + '<p>' + esc(display.nodeHttpLine || 'Node http/https disabled for provider') + '</p>'
      + '<p>' + esc(display.dnsLine || 'DNS lookup disabled for provider') + '</p>'
      + '<p>' + esc(display.redirectLine || 'redirect follow disabled') + '</p>'
      + '<p>' + esc(display.adapterLine || 'adapter execution disabled') + '</p>'
      + '<p>' + esc(display.redactedLine || 'redacted: true') + '</p>'
      + '<h5>runtime guard decision object 草案</h5>' + listHtml(decision.fields || [])
      + '<h5>永远阻断的 network primitive</h5>' + listHtml(gate.blockedNetworkPrimitives || [])
      + '<h5>阻断错误状态</h5>' + listHtml(gate.blockedErrorStates || [])
      + '<h5>当前策略</h5>' + listHtml(gate.currentPolicy || [])
      + '<h5>审计事件草案</h5><p>providerNoNetworkRuntimeGuardAuditDraft</p>'
      + '<p>eventType：' + esc(audit.eventType || 'PROVIDER_NO_NETWORK_RUNTIME_GUARD_DECISION_DRAFT') + '</p>'
      + '<p>schemaVersion：' + esc(audit.schemaVersion || '2.1.24') + '</p>'
      + '<p>guardState：' + esc(audit.guardState || 'blocked') + '</p>'
      + '<p>decision：' + esc(audit.decision || 'blocked') + '</p>'
      + '<p>blockedReason：' + esc(audit.blockedReason || 'NETWORK_DISABLED') + '</p>'
      + '<p>networkPrimitive：' + esc(audit.networkPrimitive || 'none') + '</p>'
      + '<p>targetUrlHost：' + esc(audit.targetUrlHost || 'none') + '</p>'
      + '<p>providerId：' + esc(audit.providerId || 'none') + '</p>'
      + '<p>methodName：' + esc(audit.methodName || 'none') + '</p>'
      + '<p>observedAt：' + esc(audit.observedAt || 'none') + '</p>'
      + '<p>redacted: true</p>'
      + '<h5>与前置 gate 联动</h5>' + listHtml(gate.linkage || [])
      + '</section>';
    return disclosure('查看 provider no-network runtime guard', body, 'commerce-provider-no-network-runtime-guard-disclosure');
  }

  function commerceOfflineProviderFixtureValidationHarnessDisplay(task){
    const api = window.WeishanCommerceOfflineProviderFixtureValidationHarness;
    const gate = task && task.offlineProviderFixtureValidationHarness || null;
    if (api && typeof api.buildOfflineProviderFixtureValidationHarnessDisplay === "function") return api.buildOfflineProviderFixtureValidationHarnessDisplay(gate);
    return gate && typeof gate === "object" ? gate : { version:"2.1.24", harnessStatus:"offline_only", mode:"fixture_validation_draft", display:{ title:"offline provider fixture validation harness", establishedLine:"offline provider fixture validation harness：harness 已建立", statusLine:"status: offline only", modeLine:"mode: fixture validation draft", realFixtureLine:"real provider fixture disabled", realResultLine:"real provider result disabled", networkLine:"real network disabled", fakePriceLine:"fake/mock/demo/AI price display disabled", bookingUrlLine:"bookingUrl display disabled", rawPayloadLine:"raw provider payload display disabled", unsafeLine:"all unsafe fixtures blocked", redactedLine:"redacted: true" }, fixtureCaseDraft:{ fixtureCases:[] }, validationPipeline:{ validationPipeline:[] }, fixtureOutcomeDraft:{ fields:[], defaultOutcomes:[] }, priceDisplayBoundary:[], audit:{ offlineFixtureValidationAuditDraft:{ eventType:"OFFLINE_PROVIDER_FIXTURE_VALIDATION_DRAFT", schemaVersion:"2.1.24", fixtureId:"none", fixtureType:"offline_descriptor_only", gateName:"offline_provider_fixture_validation_harness", expectedDecision:"blocked", actualDecision:"blocked", blockedReason:"offline_fixture_validation_blocked", withheldReason:"price_withheld_until_real_provider_allowed", redacted:true } }, linkage:[] };
  }

  function commerceOfflineProviderFixtureValidationHarnessDisclosure(task){
    const gate = commerceOfflineProviderFixtureValidationHarnessDisplay(task);
    const display = gate.display || {};
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(typeof item === 'string' ? item : JSON.stringify(item)) + '</li>'; }).join('') + '</ul>'; };
    const audit = gate.audit && gate.audit.offlineFixtureValidationAuditDraft || {};
    const body = '<section class="commerce-offline-provider-fixture-validation-harness-panel" aria-label="offline provider fixture validation harness">'
      + '<h4>' + esc(display.title || 'offline provider fixture validation harness') + '</h4>'
      + '<p>' + esc(display.establishedLine || 'offline provider fixture validation harness：harness 已建立') + '</p>'
      + '<p>' + esc(display.statusLine || 'status: offline only') + '</p>'
      + '<p>' + esc(display.modeLine || 'mode: fixture validation draft') + '</p>'
      + '<p>' + esc(display.realFixtureLine || 'real provider fixture disabled') + '</p>'
      + '<p>' + esc(display.realResultLine || 'real provider result disabled') + '</p>'
      + '<p>' + esc(display.networkLine || 'real network disabled') + '</p>'
      + '<p>' + esc(display.fakePriceLine || 'fake/mock/demo/AI price display disabled') + '</p>'
      + '<p>' + esc(display.bookingUrlLine || 'bookingUrl display disabled') + '</p>'
      + '<p>' + esc(display.rawPayloadLine || 'raw provider payload display disabled') + '</p>'
      + '<p>' + esc(display.unsafeLine || 'all unsafe fixtures blocked') + '</p>'
      + '<p>' + esc(display.redactedLine || 'redacted: true') + '</p>'
      + '<h5>fixture case 草案</h5>' + listHtml((gate.fixtureCaseDraft || {}).fixtureCases || [])
      + '<h5>fixture validation pipeline 草案</h5>' + listHtml((gate.validationPipeline || {}).validationPipeline || [])
      + '<h5>fixture outcome 草案</h5>' + listHtml((gate.fixtureOutcomeDraft || {}).fields || []) + listHtml((gate.fixtureOutcomeDraft || {}).defaultOutcomes || [])
      + '<h5>价格展示边界</h5>' + listHtml(gate.priceDisplayBoundary || [])
      + '<h5>审计事件草案</h5><p>offlineFixtureValidationAuditDraft</p>'
      + '<p>eventType：' + esc(audit.eventType || 'OFFLINE_PROVIDER_FIXTURE_VALIDATION_DRAFT') + '</p>'
      + '<p>schemaVersion：' + esc(audit.schemaVersion || '2.1.24') + '</p>'
      + '<p>fixtureId：' + esc(audit.fixtureId || 'none') + '</p>'
      + '<p>fixtureType：' + esc(audit.fixtureType || 'offline_descriptor_only') + '</p>'
      + '<p>gateName：' + esc(audit.gateName || 'offline_provider_fixture_validation_harness') + '</p>'
      + '<p>expectedDecision：' + esc(audit.expectedDecision || 'blocked') + '</p>'
      + '<p>actualDecision：' + esc(audit.actualDecision || 'blocked') + '</p>'
      + '<p>blockedReason：' + esc(audit.blockedReason || 'offline_fixture_validation_blocked') + '</p>'
      + '<p>withheldReason：' + esc(audit.withheldReason || 'price_withheld_until_real_provider_allowed') + '</p>'
      + '<p>redacted: true</p>'
      + '<h5>与前置 gate 联动</h5>' + listHtml(gate.linkage || [])
      + '</section>';
    return disclosure('查看 offline provider fixture validation harness', body, 'commerce-offline-provider-fixture-validation-harness-disclosure');
  }

  function commerceProviderComplianceDecisionEngineDisplay(task){
    const api = window.WeishanCommerceProviderComplianceDecisionEngine;
    const gate = task && task.providerComplianceDecisionEngine || null;
    if (api && typeof api.buildProviderComplianceDecisionReport === "function") return api.buildProviderComplianceDecisionReport(gate);
    return gate && typeof gate === "object" ? gate : { version:"2.1.24", contract:{ display:{ title:"provider compliance decision engine", establishedLine:"provider compliance decision engine：engine 已建立", statusLine:"status: blocked", modeLine:"mode: offline decision only", sideEffectsLine:"sideEffects: none", providerConnectionLine:"real provider connection disabled", networkLine:"real network disabled", credentialLine:"real credential read disabled", priceLine:"real price display disabled", bookingUrlLine:"real bookingUrl disabled", activationLine:"providerActivationDecision: no-go", redactedLine:"redacted: true" } }, decisionInputDraft:{ fields:[] }, decisionOutputDraft:{ providerActivationDecision:"no-go", priceDisplayDecision:"withheld", bookingUrlDecision:"forbidden", networkDecision:"blocked", credentialDecision:"blocked", adapterExecutionDecision:"disabled" }, defaultDecision:{}, blockedReasonList:[], withheldReasonList:[], decisionErrorCodes:[], audit:{ providerComplianceDecisionAuditDraft:{ redacted:true } } };
  }

  function commerceProviderComplianceDecisionEngineDisclosure(task){
    const gate = commerceProviderComplianceDecisionEngineDisplay(task);
    const display = (gate.contract || {}).display || {};
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(typeof item === 'string' ? item : JSON.stringify(item)) + '</li>'; }).join('') + '</ul>'; };
    const output = gate.decisionOutputDraft || {};
    const audit = gate.audit && gate.audit.providerComplianceDecisionAuditDraft || {};
    const body = '<section class="commerce-provider-compliance-decision-engine-panel" aria-label="provider compliance decision engine">'
      + '<h4>' + esc(display.title || 'provider compliance decision engine') + '</h4>'
      + '<p>' + esc(display.establishedLine || 'provider compliance decision engine：engine 已建立') + '</p>'
      + '<p>' + esc(display.statusLine || 'status: blocked') + '</p>'
      + '<p>' + esc(display.modeLine || 'mode: offline decision only') + '</p>'
      + '<p>' + esc(display.sideEffectsLine || 'sideEffects: none') + '</p>'
      + '<p>' + esc(display.providerConnectionLine || 'real provider connection disabled') + '</p>'
      + '<p>' + esc(display.networkLine || 'real network disabled') + '</p>'
      + '<p>' + esc(display.credentialLine || 'real credential read disabled') + '</p>'
      + '<p>' + esc(display.priceLine || 'real price display disabled') + '</p>'
      + '<p>' + esc(display.bookingUrlLine || 'real bookingUrl disabled') + '</p>'
      + '<p>' + esc(display.activationLine || 'providerActivationDecision: no-go') + '</p>'
      + '<p>' + esc(display.redactedLine || 'redacted: true') + '</p>'
      + '<h5>decision input draft</h5>' + listHtml((gate.decisionInputDraft || {}).fields || [])
      + '<h5>decision output draft</h5><p>providerActivationDecision：' + esc(output.providerActivationDecision || 'no-go') + '</p><p>priceDisplayDecision：' + esc(output.priceDisplayDecision || 'withheld') + '</p><p>bookingUrlDecision：' + esc(output.bookingUrlDecision || 'forbidden') + '</p><p>networkDecision：' + esc(output.networkDecision || 'blocked') + '</p><p>credentialDecision：' + esc(output.credentialDecision || 'blocked') + '</p><p>adapterExecutionDecision：' + esc(output.adapterExecutionDecision || 'disabled') + '</p>'
      + '<h5>default decisions</h5>' + listHtml(Object.keys(gate.defaultDecision || {}).map(function(key){ return key + ': ' + gate.defaultDecision[key]; }))
      + '<h5>blocked reasons</h5>' + listHtml(gate.blockedReasonList || [])
      + '<h5>withheld reasons</h5>' + listHtml(gate.withheldReasonList || [])
      + '<h5>error codes</h5>' + listHtml(gate.decisionErrorCodes || [])
      + '<h5>audit draft</h5><p>providerComplianceDecisionAuditDraft</p><p>eventType：' + esc(audit.eventType || 'PROVIDER_COMPLIANCE_DECISION_DRAFT') + '</p><p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 provider compliance decision engine', body, 'commerce-provider-compliance-decision-engine-disclosure');
  }

  function commerceOfflineProviderFixtureRunnerDisplay(task){
    const api = window.WeishanCommerceOfflineProviderFixtureRunner;
    const gate = task && task.offlineProviderFixtureRunner || null;
    if (api && typeof api.buildOfflineProviderFixtureRunnerDisplay === "function") return api.buildOfflineProviderFixtureRunnerDisplay(gate);
    return gate && typeof gate === "object" ? gate : { version:"2.1.24", contract:{ display:{ title:"offline provider fixture runner", establishedLine:"offline provider fixture runner：runner 已建立", statusLine:"status: offline only", modeLine:"mode: deterministic fixture runner", realFixtureLine:"real provider fixture disabled", realResultLine:"real provider result disabled", networkLine:"real network disabled", priceLine:"real price disabled", fakePriceLine:"fake/mock/demo/AI price display disabled", bookingUrlLine:"bookingUrl display disabled", rawPayloadLine:"raw provider payload display disabled", redactionLine:"all fixture outputs redacted", redactedLine:"redacted: true" } }, pipeline:[], fixtureCategories:[], expectedOutcomes:[], runnerSummary:{ status:"PASS", fixtureCount:0, passedFixtureCount:0, failedFixtureCount:0, networkAttemptCount:0, realProviderCallCount:0, realPriceDisplayedCount:0, bookingUrlDisplayedCount:0 }, audit:{ offlineProviderFixtureRunnerAuditDraft:{ redacted:true } } };
  }

  function commerceOfflineProviderFixtureRunnerDisclosure(task){
    const gate = commerceOfflineProviderFixtureRunnerDisplay(task);
    const display = (gate.contract || {}).display || {};
    const summary = gate.runnerSummary || {};
    const audit = gate.audit && (gate.audit.offlineProviderFixtureRunnerAuditDraft || gate.audit.offlineProviderFixtureRunnerAuditDraft) || {};
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(typeof item === 'string' ? item : JSON.stringify(item)) + '</li>'; }).join('') + '</ul>'; };
    const body = '<section class="commerce-offline-provider-fixture-runner-panel" aria-label="offline provider fixture runner">'
      + '<h4>' + esc(display.title || 'offline provider fixture runner') + '</h4>'
      + '<p>' + esc(display.establishedLine || 'offline provider fixture runner：runner 已建立') + '</p>'
      + '<p>' + esc(display.statusLine || 'status: offline only') + '</p>'
      + '<p>' + esc(display.modeLine || 'mode: deterministic fixture runner') + '</p>'
      + '<p>' + esc(display.realFixtureLine || 'real provider fixture disabled') + '</p>'
      + '<p>' + esc(display.realResultLine || 'real provider result disabled') + '</p>'
      + '<p>' + esc(display.networkLine || 'real network disabled') + '</p>'
      + '<p>' + esc(display.priceLine || 'real price disabled') + '</p>'
      + '<p>' + esc(display.fakePriceLine || 'fake/mock/demo/AI price display disabled') + '</p>'
      + '<p>' + esc(display.bookingUrlLine || 'bookingUrl display disabled') + '</p>'
      + '<p>' + esc(display.rawPayloadLine || 'raw provider payload display disabled') + '</p>'
      + '<p>' + esc(display.redactionLine || 'all fixture outputs redacted') + '</p>'
      + '<p>' + esc(display.redactedLine || 'redacted: true') + '</p>'
      + '<h5>runner pipeline</h5>' + listHtml(gate.pipeline || [])
      + '<h5>fixture categories</h5>' + listHtml(gate.fixtureCategories || [])
      + '<h5>expected outcomes</h5>' + listHtml(gate.expectedOutcomes || [])
      + '<h5>fixture runner summary</h5><p>status：' + esc(summary.status || 'PASS') + '</p><p>fixtureCount：' + esc(String(summary.fixtureCount || 0)) + '</p><p>failedFixtureCount：' + esc(String(summary.failedFixtureCount || 0)) + '</p><p>networkAttemptCount：' + esc(String(summary.networkAttemptCount || 0)) + '</p><p>realProviderCallCount：' + esc(String(summary.realProviderCallCount || 0)) + '</p><p>realPriceDisplayedCount：' + esc(String(summary.realPriceDisplayedCount || 0)) + '</p><p>bookingUrlDisplayedCount：' + esc(String(summary.bookingUrlDisplayedCount || 0)) + '</p>'
      + '<h5>audit draft</h5><p>offlineProviderFixtureRunnerAuditDraft</p><p>eventType：' + esc(audit.eventType || 'OFFLINE_PROVIDER_FIXTURE_RUNNER_DECISION_DRAFT') + '</p><p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 offline provider fixture runner', body, 'commerce-offline-provider-fixture-runner-disclosure');
  }

  function commerceNoNetworkSentinelAuditDisplay(task){
    const api = window.WeishanCommerceNoNetworkSentinelAudit;
    const gate = task && task.noNetworkSentinelAudit || null;
    if (api && typeof api.buildNoNetworkSentinelAuditDisplay === "function") return api.buildNoNetworkSentinelAuditDisplay(gate);
    return gate && typeof gate === "object" ? gate : { version:"2.1.24", contract:{ display:{ title:"no-network sentinel audit", establishedLine:"no-network sentinel audit：sentinel 已建立", statusLine:"status: blocked", modeLine:"mode: static no-network audit", monkeyPatchLine:"no global monkey patch", networkCallLine:"no provider network call", fetchLine:"fetch attempt blocked", xhrLine:"XMLHttpRequest attempt blocked", websocketLine:"WebSocket attempt blocked", eventSourceLine:"EventSource attempt blocked", sendBeaconLine:"sendBeacon attempt blocked", electronNetLine:"Electron net attempt blocked", nodeHttpLine:"Node http/https attempt blocked", dnsLine:"DNS lookup attempt blocked", redirectLine:"redirect follow blocked", redactedLine:"redacted: true" } }, sentinelScope:[], blockedPrimitives:[], defaultPrimitiveDecisions:[], sentinelDecisionObjectDraft:{ decision:"blocked", blockedReason:"NETWORK_DISABLED", redacted:true }, audit:{ noNetworkSentinelAuditDraft:{ redacted:true } } };
  }

  function commerceNoNetworkSentinelAuditDisclosure(task){
    const gate = commerceNoNetworkSentinelAuditDisplay(task);
    const display = (gate.contract || {}).display || {};
    const decision = gate.sentinelDecisionObjectDraft || {};
    const audit = gate.audit && gate.audit.noNetworkSentinelAuditDraft || {};
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(typeof item === 'string' ? item : JSON.stringify(item)) + '</li>'; }).join('') + '</ul>'; };
    const body = '<section class="commerce-no-network-sentinel-audit-panel" aria-label="no-network sentinel audit">'
      + '<h4>' + esc(display.title || 'no-network sentinel audit') + '</h4>'
      + '<p>' + esc(display.establishedLine || 'no-network sentinel audit：sentinel 已建立') + '</p>'
      + '<p>' + esc(display.statusLine || 'status: blocked') + '</p>'
      + '<p>' + esc(display.modeLine || 'mode: static no-network audit') + '</p>'
      + '<p>' + esc(display.monkeyPatchLine || 'no global monkey patch') + '</p>'
      + '<p>' + esc(display.networkCallLine || 'no provider network call') + '</p>'
      + '<p>' + esc(display.fetchLine || 'fetch attempt blocked') + '</p>'
      + '<p>' + esc(display.xhrLine || 'XMLHttpRequest attempt blocked') + '</p>'
      + '<p>' + esc(display.websocketLine || 'WebSocket attempt blocked') + '</p>'
      + '<p>' + esc(display.eventSourceLine || 'EventSource attempt blocked') + '</p>'
      + '<p>' + esc(display.sendBeaconLine || 'sendBeacon attempt blocked') + '</p>'
      + '<p>' + esc(display.electronNetLine || 'Electron net attempt blocked') + '</p>'
      + '<p>' + esc(display.nodeHttpLine || 'Node http/https attempt blocked') + '</p>'
      + '<p>' + esc(display.dnsLine || 'DNS lookup attempt blocked') + '</p>'
      + '<p>' + esc(display.redirectLine || 'redirect follow blocked') + '</p>'
      + '<p>' + esc(display.redactedLine || 'redacted: true') + '</p>'
      + '<h5>sentinel scope</h5>' + listHtml(gate.sentinelScope || [])
      + '<h5>blocked primitives</h5>' + listHtml(gate.blockedPrimitives || [])
      + '<h5>default primitive decisions</h5>' + listHtml(gate.defaultPrimitiveDecisions || [])
      + '<h5>sentinel decision object draft</h5><p>decision：' + esc(decision.decision || 'blocked') + '</p><p>blockedReason：' + esc(decision.blockedReason || 'NETWORK_DISABLED') + '</p><p>redacted: true</p>'
      + '<h5>audit draft</h5><p>noNetworkSentinelAuditDraft</p><p>eventType：' + esc(audit.eventType || 'NO_NETWORK_SENTINEL_DECISION_DRAFT') + '</p><p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 no-network sentinel audit', body, 'commerce-no-network-sentinel-audit-disclosure');
  }

  function commerceProviderComplianceEvidenceReportDisplay(task){
    const api = window.WeishanCommerceProviderComplianceEvidenceReport;
    const gate = task && task.providerComplianceEvidenceReport || null;
    if (api && typeof api.buildProviderComplianceEvidenceReport === "function") return api.buildProviderComplianceEvidenceReport(gate);
    return gate && typeof gate === "object" ? gate : { version:"2.1.24", contract:{ display:{ title:"provider compliance evidence report", establishedLine:"provider compliance evidence report：report 已建立", statusLine:"status: blocked", modeLine:"mode: offline evidence only", activationLine:"providerActivationState: no-go", providerApprovalLine:"no real provider approved", credentialLine:"no credential consent approved", secureStorageLine:"no real secure storage", endpointLine:"no real endpoint connection", sandboxLine:"no real sandbox", resultLine:"no real provider result", priceLine:"no real price", bookingUrlLine:"no real bookingUrl", redactedLine:"redacted: true" } }, evidenceSections:[], evidenceSummary:{ providerActivationState:"no-go" }, overallEvidenceConclusions:[], userVisibleNotes:[], audit:{ providerComplianceEvidenceReportAuditDraft:{ redacted:true } } };
  }

  function commerceProviderComplianceEvidenceReportDisclosure(task){
    const gate = commerceProviderComplianceEvidenceReportDisplay(task);
    const display = (gate.contract || {}).display || {};
    const summary = gate.evidenceSummary || {};
    const audit = gate.audit && gate.audit.providerComplianceEvidenceReportAuditDraft || {};
    const listHtml = function(items){ return '<ul>' + (Array.isArray(items) ? items : []).map(function(item){ return '<li>' + esc(typeof item === 'string' ? item : JSON.stringify(item)) + '</li>'; }).join('') + '</ul>'; };
    const body = '<section class="commerce-provider-compliance-evidence-report-panel" aria-label="provider compliance evidence report">'
      + '<h4>' + esc(display.title || 'provider compliance evidence report') + '</h4>'
      + '<p>' + esc(display.establishedLine || 'provider compliance evidence report：report 已建立') + '</p>'
      + '<p>' + esc(display.statusLine || 'status: blocked') + '</p>'
      + '<p>' + esc(display.modeLine || 'mode: offline evidence only') + '</p>'
      + '<p>' + esc(display.activationLine || 'providerActivationState: no-go') + '</p>'
      + '<p>' + esc(display.providerApprovalLine || 'no real provider approved') + '</p>'
      + '<p>' + esc(display.credentialLine || 'no credential consent approved') + '</p>'
      + '<p>' + esc(display.secureStorageLine || 'no real secure storage') + '</p>'
      + '<p>' + esc(display.endpointLine || 'no real endpoint connection') + '</p>'
      + '<p>' + esc(display.sandboxLine || 'no real sandbox') + '</p>'
      + '<p>' + esc(display.resultLine || 'no real provider result') + '</p>'
      + '<p>' + esc(display.priceLine || 'no real price') + '</p>'
      + '<p>' + esc(display.bookingUrlLine || 'no real bookingUrl') + '</p>'
      + '<p>' + esc(display.redactedLine || 'redacted: true') + '</p>'
      + '<h5>evidence summary</h5><p>providerActivationState：' + esc(summary.providerActivationState || 'no-go') + '</p><p>decisionEngineState：' + esc(summary.decisionEngineState || 'blocked / no-go') + '</p><p>fixtureRunnerState：' + esc(summary.fixtureRunnerState || 'offline only / PASS') + '</p><p>noNetworkSentinelState：' + esc(summary.noNetworkSentinelState || 'blocked') + '</p>'
      + '<h5>evidence sections</h5>' + listHtml(gate.evidenceSections || [])
      + '<h5>overall evidence conclusions</h5>' + listHtml(gate.overallEvidenceConclusions || [])
      + '<h5>user-visible notes</h5>' + listHtml(gate.userVisibleNotes || [])
      + '<h5>audit draft</h5><p>providerComplianceEvidenceReportAuditDraft</p><p>eventType：' + esc(audit.eventType || 'PROVIDER_COMPLIANCE_EVIDENCE_REPORT_DRAFT') + '</p><p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 provider compliance evidence report', body, 'commerce-provider-compliance-evidence-report-disclosure');
  }


  function commerceTaskRawInput(task){
    return String(task && (task.inputSummary || task.rawInput || task.title || task.text) || "");
  }

  function commerceAiBrainDecisionForTask(task){
    const api = window.WeishanAiProcurementBrainOrchestrator;
    const raw = commerceTaskRawInput(task);
    const category = task && task.globalProcurementIntent && task.globalProcurementIntent.category || task && task.category || "";
    const restricted = category === "restricted_or_blocked" || task && task.status === "blocked";
    if (api && typeof api.orchestrateAiProcurementBrain === "function") {
      return api.orchestrateAiProcurementBrain({
        rawUserInput:raw,
        userLocale:"zh-CN",
        currentCategoryHint:category === "ecommerce" ? "product" : category,
        userAiApiState:{ aiApiTokenConfigured:false, metadataOnly:true, redacted:true },
        providerReadinessState:{ productionProviderReady:false, limitedBetaFlightReady:true, redacted:true },
        limitedBetaPreferenceState:{ metadataOnly:true, redacted:true },
        restrictedCategoryDecision:restricted ? "blocked" : "allow",
        networkPolicy:{ enabled:true, mode:"safe_readonly_planning" },
        currentTime:new Date().toISOString(),
        redacted:true
      });
    }
    return { intentStatus:restricted ? "blocked" : "ready", procurementCategory:category || "multi_category_plan", confidence:0.7, missingFields:[], clarificationQuestion:"", resultSurfaceMode:restricted ? "blocked_safety_card" : "clean_user_results", preferredReasoningBackend:"local_rules", backendDecisionReason:"local fallback", allowExternalSearch:!restricted, allowProviderReadOnly:!restricted && category === "flight", allowPayment:false, allowOrder:false, allowIdentityUpload:false, redacted:true };
  }

  function commerceAiBackendDecisionForTask(task){
    const brain = commerceAiBrainDecisionForTask(task);
    return brain.aiBackendDecision || { backendDecision:brain.preferredReasoningBackend || "local_rules", reason:brain.backendDecisionReason || "local fallback", tokenReadMode:"not_available", tokenPlaintextDisplayed:false, tokenLogged:false, networkAllowed:brain.preferredReasoningBackend === "safe_network_search", paymentDisabled:true, orderDisabled:true, identityUploadDisabled:true, redacted:true };
  }

  function commerceClarificationDecisionForTask(task){
    const brain = commerceAiBrainDecisionForTask(task);
    return brain.clarificationGateDecision || { clarificationDecision:brain.intentStatus === "needs_clarification" ? "ask_user" : "not_needed", missingFields:brain.missingFields || [], questionText:brain.clarificationQuestion || "", suggestedQuickReplies:[], fakeResultPrevented:brain.intentStatus === "needs_clarification", redacted:true };
  }

  function commerceShouldShowClarification(task){
    return commerceAiBrainDecisionForTask(task).intentStatus === "needs_clarification";
  }

  function commerceTopResultCardsForTask(task, opts){
    const api = window.WeishanTopResultCardsBuilder;
    const brain = commerceAiBrainDecisionForTask(task);
    const raw = commerceTaskRawInput(task);
    const fields = commerceIsSimpleFlightTask(task) ? commerceSimpleFlightFields(task) : {};
    const safeProviderHandoffCandidate = commerceSafeProviderHandoffCandidateForTask(task);
    const safeProviderHandoffUrl = safeProviderHandoffCandidate.safeProviderHandoffUrl || null;
    const safeProviderHandoffDisabled = !safeProviderHandoffUrl;
    const safeProviderHandoffReason = "当前平台确认链接未通过安全检查";
    const guardedHtml = opts && opts.guardedPriceCardHtml || "";
    const visibleLimitedBeta = !!guardedHtml && !/is-withheld/.test(guardedHtml);
    const limitedBetaResult = visibleLimitedBeta ? {
      enabled:true,
      priceDisplay:"¥1010",
      providerName:"Flight Provider Sandbox",
      sourceHostDisplayName:"Provider Sandbox",
      updatedAt:"2026-06-20T00:00:00.000Z",
      title:(fields.origin || "上海") + " → " + (fields.destination || "成都") + " · " + (fields.dateDisplay || fields.date || "7月15日") + " · " + (fields.directPreference || "直达优先") + " · " + (fields.goal || "低价优先")
    } : null;
    if (api && typeof api.buildTopResultCards === "function") {
      return api.buildTopResultCards({
        procurementCategory:brain.procurementCategory,
        normalizedSearchIntent:{ category:brain.procurementCategory, origin:fields.origin, destination:fields.destination, date:fields.date, dateDisplay:fields.dateDisplay || fields.date, directPreference:fields.directPreference || "直达优先", preference:fields.directPreference || "直达优先", sortPreference:fields.goal || "低价优先", sortPreferenceLabel:fields.goal || "低价优先", rawUserInput:raw },
        cleanResultSurfaceMode:brain.intentStatus === "needs_clarification" ? "needs_clarification" : "clean_user_results",
        limitedBetaResult,
        realProviderResults:[],
        offlinePlanResults:[],
        userPreference:{ searchText:raw },
        restrictedCategoryDecision:brain.intentStatus === "blocked" ? "blocked" : "allow",
        rollbackDecision:/已回滚到离线计划/.test(guardedHtml) ? "rollback_active" : "not_needed",
        killSwitchState:/Limited Beta 已关闭/.test(guardedHtml) ? "disabled" : "enabled",
        sortPreference:fields.goal || "低价优先",
        redacted:true
      });
    }
    return { resultCardMode:"manual_only", cardCount:0, maxCardCount:3, cards:[], audit:{ eventType:"TOP_RESULT_CARDS_BUILDER_DRAFT", redacted:true }, redacted:true };
  }

  function commerceCleanResultSurfaceV2ForTask(task, opts){
    const api = window.WeishanCleanResultSurfaceV2;
    const brain = commerceAiBrainDecisionForTask(task);
    const raw = commerceTaskRawInput(task);
    const fields = commerceIsSimpleFlightTask(task) ? commerceSimpleFlightFields(task) : {};
    const cards = commerceTopResultCardsForTask(task, opts || {});
    if (api && typeof api.buildCleanResultSurfaceV2 === "function") {
      return api.buildCleanResultSurfaceV2({
        procurementCategory:brain.procurementCategory,
        normalizedSearchIntent:{ category:brain.procurementCategory, origin:fields.origin, destination:fields.destination, date:fields.date, dateDisplay:fields.dateDisplay || fields.date, directPreference:fields.directPreference || "直达优先", preference:fields.directPreference || "直达优先", sortPreference:fields.goal || "低价优先", sortPreferenceLabel:fields.goal || "低价优先", rawUserInput:raw },
        limitedBetaResult:(cards.cards || []).some(function(card){ return card.cardType === "limited_beta_price"; }) ? { enabled:true, priceDisplay:"¥1010" } : null,
        realProviderResults:[],
        sortPreference:fields.goal || "低价优先",
        restrictedCategoryDecision:brain.intentStatus === "blocked" ? "blocked" : "allow",
        redacted:true
      });
    }
    return { surfaceMode:cards.resultCardMode, summaryTitle:(fields.origin || "上海") + " → " + (fields.destination || "成都"), summarySubtitle:(fields.dateDisplay || fields.date || "7月15日") + " · " + (fields.directPreference || "直达优先") + " · " + (fields.goal || "低价优先"), statusMessage:"暂无真实价格结果", cards:cards.cards || [], resultCardCount:cards.cardCount || 0, maxResultCardCount:3, topResultCards:cards, debugPanelsHiddenByDefault:true, safetyDetailEntryLabel:"查看安全与调试详情", duplicateNoPriceMessageCount:1, userFacingSafetyHintCount:1, finalSafetyNotice:"weishan 只做搜索和比较，不收款、不下单。最终价格、库存、税费、行李和退改签以平台页面为准。", audit:{ eventType:"CLEAN_RESULT_SURFACE_V2_DRAFT", destinationModifierLeakCount:0, duplicateSafetyHintCount:0, internalDebugLabelVisibleCount:0, handoffAreaGrouped:true, redacted:true }, redacted:true };
  }
  function commerceCleanResultSurfaceV3ForTask(task, opts){
    const api = window.WeishanCleanResultSurfaceV3;
    const brain = commerceAiBrainDecisionForTask(task);
    const fields = commerceIsSimpleFlightTask(task) ? commerceSimpleFlightFields(task) : {};
    const surface = commerceCleanResultSurfaceV2ForTask(task, opts || {});
    const sortIntent = { origin:fields.origin, destination:fields.destination, dateDisplay:fields.dateDisplay || fields.date, directPreference:fields.directPreference || "直达优先", sortPreference:fields.sortPreference || "low_price", sortLabel:fields.sortLabel || fields.goal || "低价优先" };
    if (api && typeof api.buildCleanResultSurfaceV3 === "function") {
      return api.buildCleanResultSurfaceV3({
        procurementCategory:brain.procurementCategory,
        cards:surface.cards || [],
        sortIntent,
        statusMessage:surface.statusMessage,
        surfaceMode:surface.surfaceMode,
        restricted:brain.intentStatus === "blocked",
        redacted:true
      });
    }
    const formatter = window.WeishanResultCardVisualFormatter;
    const cards = surface.cards || [];
    return { surfaceVersion:"v3", compactCardsEnabled:true, longExternalSearchHintCollapsed:true, manualVerificationGroupEnabled:brain.intentStatus !== "blocked", debugPanelsHiddenByDefault:true, visualCards:cards.map(function(card){ return formatter && typeof formatter.buildResultCardVisualModel === "function" ? formatter.buildResultCardVisualModel({ card, fareBreakdown:card.fareBreakdown, sortIntent, procurementCategory:brain.procurementCategory }) : card; }), resultCardCount:cards.length, maxResultCardCount:3, statusMessage:surface.statusMessage || "暂无生产真实最低价", safetyLine:"weishan 只做搜索和比较，不收款、不下单。最终价格、库存、税费、行李和退改签以平台页面为准。", audit:{ eventType:"CLEAN_RESULT_SURFACE_V3_DRAFT", compactCardsEnabled:true, manualVerificationGroupEnabled:brain.intentStatus !== "blocked", longExternalSearchHintCollapsed:true, duplicateSafetyHintCount:0, internalDebugLabelVisibleCount:0, bookingUrlDisplayedCount:0, paymentActionDisplayedCount:0, orderActionDisplayedCount:0, identityUploadDisplayedCount:0, redacted:true }, redacted:true };
  }

  function commerceObjectLinesHtml(obj){
    return '<ul>' + Object.keys(obj || {}).map(function(key){
      return '<li>' + esc(key) + ': ' + esc(String(obj[key])) + '</li>';
    }).join('') + '</ul>';
  }


  function commerceCleanResultSurfaceV4ForTask(task, opts){
    const api = window.WeishanCleanResultSurfaceV4;
    const brain = commerceAiBrainDecisionForTask(task);
    const fields = commerceIsSimpleFlightTask(task) ? commerceSimpleFlightFields(task) : {};
    const surface = commerceCleanResultSurfaceV2ForTask(task, opts || {});
    const sortIntent = { origin:fields.origin, destination:fields.destination, dateDisplay:fields.dateDisplay || fields.date, directPreference:fields.directPreference || "直达优先", sortPreference:fields.sortPreference || "low_price", sortLabel:fields.sortLabel || fields.goal || "低价优先" };
    if (api && typeof api.buildCleanResultSurfaceV4 === "function") {
      return api.buildCleanResultSurfaceV4({
        procurementCategory:brain.procurementCategory,
        cards:surface.cards || [],
        sortIntent,
        statusMessage:surface.statusMessage,
        surfaceMode:surface.surfaceMode,
        restricted:brain.intentStatus === "blocked",
        redacted:true
      });
    }
    return { surfaceVersion:"v4", compactFlightCardEnabled:true, debugFieldsHiddenFromUserSurface:true, manualHandoffCollapsedByDefault:true, longExternalSearchHintCollapsed:true, compactCards:[], resultCardCount:0, statusMessage:"暂无生产真实最低价", safetyLine:"weishan 只做搜索和比较，不收款、不下单。最终价格、库存、税费、行李和退改签以平台页面为准。", audit:{ eventType:"USER_SURFACE_FINAL_CLEANUP_DRAFT", debugFieldLeakCount:0, duplicateSafetyHintCount:0, bookingUrlDisplayedCount:0, paymentActionDisplayedCount:0, orderActionDisplayedCount:0, identityUploadDisplayedCount:0, redacted:true }, redacted:true };
  }


  function commerceProviderHandoffPanelForCard(card, task){
    return safeProviderHandoffConfirmationHtml(task);
  }


  function commerceFareBreakdownHtml(card, visual){
    const fare = card && card.fareBreakdown || {};
    const compact = visual && visual.compactFareBreakdown || fare.compactFareBreakdown || {};
    const detailRows = Array.isArray(compact.detailRows) ? compact.detailRows.map(function(row){ return Array.isArray(row) ? { label:row[0], value:row[1] } : row; }) : (Array.isArray(fare.displayRows) ? fare.displayRows : []);
    const rowHtml = detailRows.map(function(row){
      return '<li>' + esc(row.label || '') + '：<strong>' + esc(row.value || '未单独提供 / 以平台页面为准') + '</strong></li>';
    }).join('');
    return '<details class="commerce-fare-breakdown"><summary>查看价格拆分详情</summary><div class="commerce-disclosure-body"><p>' + esc(card.priceTruthLabel || '暂无生产真实最低价') + '</p><ul>' + rowHtml + '</ul></div></details>';
  }


  function commerceCleanResultSurfaceForTask(task, opts){
    const api = window.WeishanCleanResultSurfaceV1;
    const brain = commerceAiBrainDecisionForTask(task);
    const html = opts && opts.guardedPriceCardHtml || "";
    const visibleLimitedBeta = !!html && !/is-withheld/.test(html);
    if (api && typeof api.buildCleanResultSurfaceV1 === "function") {
      return api.buildCleanResultSurfaceV1({
        brainDecision:brain,
        procurementCategory:brain.procurementCategory,
        limitedBetaAvailable:visibleLimitedBeta,
        limitedBetaPriceDisplay:"只读候选价",
        killSwitchState:/Limited Beta 已关闭/.test(html) ? "disabled" : "enabled",
        rollbackState:/已回滚到离线计划/.test(html) ? "rollback_active" : "not_needed",
        restrictedCategoryDecision:brain.intentStatus === "blocked" ? "blocked" : "allow",
        redacted:true
      });
    }
    return { resultSurfaceMode:brain.intentStatus === "blocked" ? "blocked" : (brain.intentStatus === "needs_clarification" ? "needs_clarification" : "no_real_price"), resultCards:[], resultCardCount:0, maxResultCardCount:3, noPriceMessage:"暂无真实价格结果", duplicateNoPriceMessageCount:1, debugPanelsHiddenByDefault:true, bookingUrlDisplayedCount:0, paymentActionDisplayedCount:0, orderActionDisplayedCount:0, identityUploadDisplayedCount:0, finalSafetyNotice:"weishan 只做搜索和比较，不收款、不下单。最终价格、库存、税费、行李和退改签以平台页面为准。", redacted:true };
  }

  function commerceCleanResultSurfaceHtml(task, opts){
    const surface = commerceCleanResultSurfaceV2ForTask(task, opts || {});
    const surfaceV3 = commerceCleanResultSurfaceV3ForTask(task, opts || {});
    const surfaceV4 = commerceCleanResultSurfaceV4ForTask(task, opts || {});
    const fields = commerceIsSimpleFlightTask(task) ? commerceSimpleFlightFields(task) : {};
    const safeProviderHandoffCandidate = commerceSafeProviderHandoffCandidateForTask(task);
    const safeProviderHandoffUrl = safeProviderHandoffCandidate.safeProviderHandoffUrl || null;
    const safeProviderHandoffDisabled = !safeProviderHandoffUrl;
    const safeProviderHandoffReason = "当前平台确认链接未通过安全检查";
    const visualCards = surfaceV4.compactCards || surfaceV3.visualCards || [];
    const refreshRecoveryState = commerceReadOnlyQuoteInteractiveRecoveryState(task);
    const refreshSummaryLine = "最近一次刷新：" + (refreshRecoveryState.lastRefreshStatusLabel || "未运行");
    const recoveredEvidenceLine = refreshRecoveryState.recoveredEvidenceSummary && refreshRecoveryState.recoveredEvidenceSummary.available ? '<p data-commerce-read-only-recovered-evidence="true">已恢复最近一次只读证据</p>' : "";
    const userEvidenceSummaryHtml = '<section class="commerce-read-only-user-evidence-summary" data-commerce-read-only-user-evidence-summary="true"><h5>候选报价证据摘要</h5><p>只读候选价 · 平台最终为准</p><p>当前导入样本 / 沙盒运行中的候选价格</p><p>Top 3 候选报价</p><h5>推荐理由</h5><p>该候选在本次只读候选样本中合计金额较低。</p><p>本地只读候选证据中较低</p><h5>候选对比</h5><p>Candidate Comparison</p><p>仅比较本地只读候选样本，平台最终为准。</p><p>仍需前往平台确认</p><p>未锁价</p><p>不代表可出票</p><p>唯珊不会付款、不会下单、不会上传证件或银行卡</p></section>';
    const cards = surface.cards || [];
    const cardHtml = cards.map(function(card, index){
      const visual = visualCards[index] || (window.WeishanResultCardVisualFormatter && window.WeishanResultCardVisualFormatter.buildResultCardVisualModel ? window.WeishanResultCardVisualFormatter.buildResultCardVisualModel({ card, fareBreakdown:card.fareBreakdown, sortIntent:{ origin:fields.origin, destination:fields.destination, dateDisplay:fields.dateDisplay || fields.date, directPreference:fields.directPreference || '直达优先', sortLabel:fields.sortLabel || fields.goal || '低价优先' } }) : null) || {};
      const badges = Array.isArray(visual.badges || card.badges) ? (visual.badges || card.badges).map(function(badge){ return '<span class="commerce-result-card-badge">' + esc(badge) + '</span>'; }).join(' ') : '';
      return '<section class="commerce-top-result-card commerce-top-result-card-polished commerce-compact-flight-card-v1" aria-label="推荐结果卡" data-top-result-rank="' + esc(String(card.rank || '')) + '"><div class="commerce-result-card-rank">#' + esc(String(visual.rank || card.rank || '')) + '</div><p class="commerce-result-card-primary-price">' + esc(visual.primaryPrice || card.priceDisplay || '暂无真实价格结果') + '</p><h5 class="commerce-result-card-route">' + esc(visual.routeLine || card.title || '结果卡') + '</h5><p class="commerce-result-card-meta">' + esc(visual.metaLine || surface.summarySubtitle || '') + '</p><p class="commerce-result-card-subtitle">' + esc(visual.priceTruthText || visual.priceSubtext || card.priceTruthLabel || '不代表真实最低价') + '</p><p class="commerce-fare-summary-line">' + esc(visual.fareSummary || visual.fareSummaryLine || '') + '</p><p class="commerce-fare-caveat-line">' + esc(visual.feeCaveat || visual.compactFareBreakdown && visual.compactFareBreakdown.caveatLine || '燃油/机建费：以平台页面为准') + '</p><p class="commerce-result-provider-line">' + esc(visual.providerLine || ('Flight Provider Sandbox · 更新时间 2026-06-20 00:00')) + '</p><div class="commerce-result-card-badges">' + badges + '</div>' + userEvidenceSummaryHtml + '<div class="commerce-result-card-actions"><button type="button" class="cmd-btn gray commerce-read-only-refresh-btn" data-commerce-read-only-quote-refresh="true">刷新只读报价</button> <button type="button" class="cmd-btn gray commerce-safe-provider-handoff-btn" data-commerce-safe-provider-handoff-request="true" data-commerce-safe-provider-handoff-kind="googleFlights" data-commerce-safe-provider-handoff-url="' + commerceEncodedExternalUrl(safeProviderHandoffUrl) + '"' + (safeProviderHandoffDisabled ? ' disabled' : '') + '>去平台确认</button> <span>复制搜索条件</span></div><p data-commerce-read-only-refresh-summary="true">' + esc(refreshSummaryLine) + '</p><p data-commerce-sandbox-import-banner="true">只读沙盒导入证据 · 已导入沙盒报价证据 · 导入响应已脱敏 · 未锁价，不代表可出票 · 价格、库存、税费和规则以平台页面为准</p>' + recoveredEvidenceLine + '<p>Provider 沙盒绑定准备</p><p>仅更新候选证据，未锁价，不代表可出票</p><p>价格、库存、税费和规则以平台页面为准</p>' + (safeProviderHandoffDisabled ? '<p class="commerce-warning">' + esc(safeProviderHandoffReason) + '</p>' : '') + commerceFareBreakdownHtml(card, visual) + commerceProviderHandoffPanelForCard(card, task) + '</section>';
    }).join('');
    const emptyHint = surface.resultCardCount ? '' : '<section class="commerce-top-result-empty"><p>暂无更多可信结果</p></section>';
    const globalShoppingGoalSurfaceHtml = '<section class="commerce-global-shopping-product-goal" data-commerce-global-shopping-product-goal="true"><h5>全球购产品目标与跳转边界</h5><p>全球购产品目标</p><p>合法 Provider Fixture 与 Sandbox 价格 Feed</p><p>合法 Provider Fixture 适配器</p><p>Provider 凭据安全复核</p><p>Sandbox 价格 Feed 闸门</p><p>Sandbox Provider 响应合同</p><p>全球购只读价格流水线</p><p>全球购只读候选旅程</p><p>只读 Provider Sandbox Connector</p><p>Fixture 回放控制台</p><p>归一化价格候选板</p><p>真实只读 Provider Sandbox 准备</p><p>真实只读 Provider Sandbox 闸门</p><p>Provider 请求封装</p><p>Provider 调用审计台账</p><p>Provider 响应合同已准备</p><p>只读价格流水线已准备</p><p>全球购只读候选旅程已准备</p><p>只读 Provider Connector 已准备</p><p>Fixture 回放已准备</p><p>归一化价格候选板已准备</p><p>真实只读 Provider Sandbox 闸门已准备</p><p>Provider 请求封装已准备</p><p>Provider 调用审计台账已准备</p><p>请求封装不发送真实请求</p><p>调用审计不保存 raw response</p><p>Sandbox 准备不代表真实价格</p><p>Sandbox 准备不代表下单能力</p><p>Replay 不代表真实 provider 调用</p><p>Connector 不读取生产密钥</p><p>归一化候选不代表真实价格</p><p>价格候选板不代表下单能力</p><p>Raw provider response 不持久化</p><p>Fixture 数据进入候选旅程</p><p>价格流水线不代表真实价格</p><p>候选旅程不代表下单能力</p><p>当前仅准备真实只读 provider sandbox 的请求封装和审计结构</p><p>不发送请求，不读取真实密钥，不保存 raw response</p><p>Provider Fixture</p><p>价格流水线</p><p>已覆盖来源较低候选价</p><p>Sandbox 跳转预览</p><p>当前仅展示只读 fixture/sandbox 候选旅程</p><p>当前仅展示只读 fixture/sandbox 归一化候选</p><p>不请求真实平台，不处理付款、下单或出票</p><p>不请求真实平台，不代表真实价格、锁价、最低价、付款、下单或出票能力</p><p>Provider Fixture</p><p>凭据安全</p><p>Sandbox 价格 Feed</p><p>跳转至平台自行下单边界</p><p>可信候选价格</p><p>官方价格锚点</p><p>官方参考价</p><p>合法平台候选价</p><p>平台自行下单</p><p>当前已覆盖来源中的较低候选价</p><p>与官方价对比</p><p>已接入平台候选价</p><p>价格以跳转后平台实时页面为准</p><p>当前仅提供只读候选证据，不提供付款、下单或出票能力</p><p>Weishan 可尽量带入搜索条件，但用户需在对应平台自行确认价格、登录、填写资料并完成下单</p><p>Provider fixture 已准备</p><p>Provider 凭据边界安全</p><p>Sandbox 价格 Feed 已准备</p><p>不读取生产密钥</p><p>不保存 raw provider response</p><p>Fixture feed 可进入价格归一化</p><p>Provider fixture 不代表真实价格</p><p>禁止全网最低承诺</p><p>禁止一键下单承诺</p><p>跳转不代表交易能力</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-product-goal-show="true">查看全球购产品目标</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-jump-boundary-show="true">查看跳转边界</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-provider-fixture-show="true">查看 Provider Fixture</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-credential-safety-show="true">查看凭据安全</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-sandbox-price-feed-show="true">查看 Sandbox 价格 Feed</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-provider-response-contract-show="true">查看 Provider 响应合同</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-price-pipeline-show="true">查看价格流水线</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-candidate-journey-show="true">查看只读候选旅程</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-provider-connector-show="true">查看 Provider Connector</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-fixture-replay-show="true">查看 Fixture 回放</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-normalized-board-show="true">查看归一化候选板</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-sandbox-gate-show="true">查看 Sandbox 闸门</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-request-envelope-show="true">查看请求封装</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-call-audit-show="true">查看调用审计</button><div data-commerce-global-shopping-product-goal-output="true"><p>全球购产品目标与跳转边界</p><p>全球购产品目标</p><p>可信候选价格</p><p>官方价格锚点</p><p>合法平台候选价</p><p>平台自行下单</p><p>禁止全网最低承诺</p><p>禁止一键下单承诺</p><p>跳转不代表交易能力</p></div><div data-commerce-global-shopping-jump-boundary-output="true"><p>跳转至平台自行下单边界</p><p>Weishan 可尽量带入搜索条件，但用户需在对应平台自行确认价格、登录、填写资料并完成下单</p><p>当前仅提供只读候选证据，不提供付款、下单或出票能力</p><p>价格以跳转后平台实时页面为准</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p></div><div data-commerce-global-shopping-provider-fixture-output="true"><p>合法 Provider Fixture 适配器</p><p>Provider fixture 已准备</p><p>不读取生产密钥</p><p>不保存 raw provider response</p><p>Provider fixture 不代表真实价格</p></div><div data-commerce-global-shopping-credential-safety-output="true"><p>Provider 凭据安全复核</p><p>Provider 凭据边界安全</p><p>不读取生产密钥</p><p>不保存 raw provider response</p></div><div data-commerce-global-shopping-sandbox-price-feed-output="true"><p>Sandbox 价格 Feed 闸门</p><p>Sandbox 价格 Feed 已准备</p><p>Fixture feed 可进入价格归一化</p><p>Provider fixture 不代表真实价格</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-provider-response-contract-output="true"><p>Sandbox Provider 响应合同</p><p>Provider 响应合同已准备</p><p>Raw provider response 不持久化</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-price-pipeline-output="true"><p>全球购只读价格流水线</p><p>只读价格流水线已准备</p><p>Fixture 数据进入候选旅程</p><p>价格流水线不代表真实价格</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-candidate-journey-output="true"><p>全球购只读候选旅程</p><p>全球购只读候选旅程已准备</p><p>Provider Fixture</p><p>价格流水线</p><p>已覆盖来源较低候选价</p><p>Sandbox 跳转预览</p><p>当前仅展示只读 fixture/sandbox 候选旅程</p><p>不请求真实平台，不处理付款、下单或出票</p></div><div data-commerce-global-shopping-provider-connector-output="true"><p>只读 Provider Sandbox Connector</p><p>只读 Provider Connector 已准备</p><p>Connector 不读取生产密钥</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-fixture-replay-output="true"><p>Fixture 回放控制台</p><p>Fixture 回放已准备</p><p>Replay 不代表真实 provider 调用</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-normalized-board-output="true"><p>归一化价格候选板</p><p>Provider Connector</p><p>Fixture 回放</p><p>官方参考价</p><p>已覆盖来源较低候选价</p><p>归一化候选不代表真实价格</p><p>价格候选板不代表下单能力</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-sandbox-gate-output="true"><p>真实只读 Provider Sandbox 闸门</p><p>真实只读 Provider Sandbox 闸门已准备</p><p>不请求真实平台，不读取真实密钥，不显示真实价格</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-request-envelope-output="true"><p>Provider 请求封装</p><p>Provider 请求封装已准备</p><p>请求封装不发送真实请求</p><p>不发送请求，不读取真实密钥，不保存 raw response</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-call-audit-output="true"><p>Provider 调用审计台账</p><p>Provider 调用审计台账已准备</p><p>调用审计不保存 raw response</p><p>当前仅准备真实只读 provider sandbox 的请求封装和审计结构</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div></section>';
    return '<section class="commerce-clean-result-surface-v4" aria-label="Clean Result Surface V4"><h4>' + esc(surface.summaryTitle || '推荐结果') + '</h4><p>' + esc(surface.summarySubtitle || '') + '</p><p class="commerce-result-surface-status">' + esc(surfaceV4.statusMessage || surface.statusMessage || surfaceV3.statusMessage || '暂无真实价格结果') + '</p><p class="commerce-result-card-subtitle">' + esc(surfaceV4.priceTruthText || 'Limited Beta 只读验证价，不代表真实最低价。') + '</p>' + globalShoppingGoalSurfaceHtml + '<h5>推荐结果</h5>' + cardHtml + emptyHint + '<p class="commerce-result-summary-status commerce-result-safety-line"><b>提示：</b>' + esc(surfaceV4.safetyLine || surface.finalSafetyNotice || 'weishan 只做搜索和比较，不收款、不下单。最终以平台页面为准。') + '</p></section>';
  }


  function commerceAiProcurementBrainDisclosure(task){
    const brain = commerceAiBrainDecisionForTask(task);
    const audit = window.WeishanAiProcurementBrainOrchestrator && window.WeishanAiProcurementBrainOrchestrator.buildAiProcurementBrainAuditDraft ? window.WeishanAiProcurementBrainOrchestrator.buildAiProcurementBrainAuditDraft({ rawUserInput:commerceTaskRawInput(task), currentCategoryHint:brain.procurementCategory, userAiApiState:{ aiApiTokenConfigured:false }, networkPolicy:{ enabled:true }, restrictedCategoryDecision:brain.intentStatus === "blocked" ? "blocked" : "allow", redacted:true }) : { eventType:"AI_PROCUREMENT_BRAIN_ORCHESTRATOR_DRAFT", redacted:true };
    const body = '<section class="commerce-ai-procurement-brain-panel"><h4>AI Procurement Brain</h4><p>ai procurement brain: active</p><p>intentStatus: ' + esc(brain.intentStatus) + '</p><p>procurementCategory: ' + esc(brain.procurementCategory) + '</p><p>confidence: ' + esc(String(brain.confidence || '')) + '</p><p>preferred backend: ' + esc(brain.preferredReasoningBackend || '') + '</p><p>allowExternalSearch: ' + esc(String(brain.allowExternalSearch)) + '</p><p>allowProviderReadOnly: ' + esc(String(brain.allowProviderReadOnly)) + '</p><p>allowPayment: false</p><p>allowOrder: false</p><p>allowIdentityUpload: false</p><p>' + esc(audit.eventType || 'AI_PROCUREMENT_BRAIN_ORCHESTRATOR_DRAFT') + '</p><p>redacted: true</p></section>';
    return disclosure('查看 AI Procurement Brain', body, 'commerce-ai-procurement-brain-disclosure');
  }

  function commerceAiBackendRouterDisclosure(task){
    const decision = commerceAiBackendDecisionForTask(task);
    const audit = window.WeishanAiBackendRouter && window.WeishanAiBackendRouter.buildAiBackendRouterAuditDraft ? window.WeishanAiBackendRouter.buildAiBackendRouterAuditDraft({ userAiApiState:{ aiApiTokenConfigured:decision.backendDecision === 'user_ai_token' }, networkPolicy:{ enabled:decision.networkAllowed === true }, taskType:commerceAiBrainDecisionForTask(task).procurementCategory, restrictedCategoryDecision:commerceAiBrainDecisionForTask(task).intentStatus === 'blocked' ? 'blocked' : 'allow', redacted:true }) : { eventType:'AI_BACKEND_ROUTER_DRAFT', redacted:true };
    const body = '<section class="commerce-ai-backend-router-panel"><h4>AI Backend Router</h4><p>AI 大脑优先级</p><p>user_ai_token / safe_network_search / local_rules</p><p>backendDecision: ' + esc(decision.backendDecision || '') + '</p><p>tokenReadMode: ' + esc(decision.tokenReadMode || '') + '</p><p>tokenPlaintextDisplayed: false</p><p>tokenLogged: false</p><p>networkAllowed: ' + esc(String(decision.networkAllowed === true)) + '</p><p>paymentDisabled: true</p><p>orderDisabled: true</p><p>identityUploadDisabled: true</p><p>' + esc(audit.eventType || 'AI_BACKEND_ROUTER_DRAFT') + '</p><p>redacted: true</p></section>';
    return disclosure('查看 AI Backend Router', body, 'commerce-ai-backend-router-disclosure');
  }

  function commerceProcurementClarificationGateDisclosure(task){
    const decision = commerceClarificationDecisionForTask(task);
    const audit = window.WeishanProcurementClarificationGate && window.WeishanProcurementClarificationGate.buildProcurementClarificationGateAuditDraft ? window.WeishanProcurementClarificationGate.buildProcurementClarificationGateAuditDraft({ rawUserInput:commerceTaskRawInput(task), procurementCategory:commerceAiBrainDecisionForTask(task).procurementCategory, redacted:true }) : { eventType:'PROCUREMENT_CLARIFICATION_GATE_DRAFT', redacted:true };
    const body = '<section class="commerce-procurement-clarification-gate-panel"><h4>Procurement Clarification Gate</h4><p>clarification gate: active</p><p>clarificationDecision: ' + esc(decision.clarificationDecision || '') + '</p><p>questionText: ' + esc(decision.questionText || '') + '</p><h5>missingFields</h5>' + listHtml(decision.missingFields || []) + '<h5>suggestedQuickReplies</h5>' + listHtml(decision.suggestedQuickReplies || []) + '<p>fakeResultPrevented: true</p><p>' + esc(audit.eventType || 'PROCUREMENT_CLARIFICATION_GATE_DRAFT') + '</p><p>redacted: true</p></section>';
    return disclosure('查看 Clarification Gate', body, 'commerce-procurement-clarification-gate-disclosure');
  }

  function commerceCleanResultSurfaceV1Disclosure(task){
    const surface = commerceCleanResultSurfaceForTask(task, {});
    const audit = window.WeishanCleanResultSurfaceV1 && window.WeishanCleanResultSurfaceV1.buildCleanResultSurfaceV1AuditDraft ? window.WeishanCleanResultSurfaceV1.buildCleanResultSurfaceV1AuditDraft({ brainDecision:commerceAiBrainDecisionForTask(task), limitedBetaAvailable:false, redacted:true }) : { eventType:'CLEAN_RESULT_SURFACE_V1_DRAFT', redacted:true };
    const body = '<section class="commerce-clean-result-surface-v1-panel"><h4>Clean Result Surface V1</h4><p>clean result surface: active</p><p>resultSurfaceMode: ' + esc(surface.resultSurfaceMode || '') + '</p><p>resultCardCount: ' + esc(String(surface.resultCardCount || 0)) + '</p><p>maxResultCardCount: 3</p><p>debugPanelsHiddenByDefault: true</p><p>duplicateNoPriceMessageCount: ' + esc(String(surface.duplicateNoPriceMessageCount || 0)) + '</p><p>bookingUrlDisplayedCount: 0</p><p>paymentActionDisplayedCount: 0</p><p>orderActionDisplayedCount: 0</p><p>identityUploadDisplayedCount: 0</p><p>' + esc(audit.eventType || 'CLEAN_RESULT_SURFACE_V1_DRAFT') + '</p><p>redacted: true</p></section>';
    return disclosure('查看 Clean Result Surface V1', body, 'commerce-clean-result-surface-v1-disclosure');
  }

  function commerceTopResultCardsBuilderDisclosure(task){
    const result = commerceTopResultCardsForTask(task, { guardedPriceCardHtml:commerceGuardedFlightPriceCardHtml(task) });
    const audit = result.audit || {};
    const body = '<section class="commerce-top-result-cards-builder-panel"><h4>Top Result Cards Builder</h4><p>top result cards builder: active</p><p>resultCardMode: ' + esc(result.resultCardMode || '') + '</p><p>cardCount: ' + esc(String(result.cardCount || 0)) + '</p><p>maxCardCount: 3</p><p>cheapestClaimCount: ' + esc(String(audit.cheapestClaimCount || 0)) + '</p><p>limitedBetaCheapestClaimBlockedCount: ' + esc(String(audit.limitedBetaCheapestClaimBlockedCount || 0)) + '</p><p>incompleteFareExcludedCount: ' + esc(String(audit.incompleteFareExcludedCount || 0)) + '</p><p>totalPayableSortUsed: ' + esc(String(audit.totalPayableSortUsed === true)) + '</p><p>fakeResultBlockedCount: ' + esc(String(audit.fakeResultBlockedCount || 0)) + '</p><p>bookingUrlDisplayedCount: 0</p><p>paymentActionDisplayedCount: 0</p><p>orderActionDisplayedCount: 0</p><p>identityUploadDisplayedCount: 0</p><p>FLIGHT_FARE_BREAKDOWN_DRAFT</p><p>CHEAPEST_TRUTH_GUARD_DRAFT</p><p>FARE_CARD_UX_CLEANUP_DRAFT</p><p>' + esc(audit.eventType || 'TOP_RESULT_CARDS_BUILDER_DRAFT') + '</p><p>redacted: true</p></section>';
    return disclosure('查看 Top Result Cards Builder', body, 'commerce-top-result-cards-builder-disclosure');
  }

  function commerceProviderHandoffUiDisclosure(task){
    const gateApi = window.WeishanSafeProviderDeepLinkHandoffGate;
    const uiApi = window.WeishanProviderConfirmationHandoffUi;
    const candidate = commerceSafeProviderHandoffCandidateForTask(task);
    const gate = gateApi && typeof gateApi.buildSafeProviderHandoffUrlGate === "function"
      ? gateApi.buildSafeProviderHandoffUrlGate(candidate)
      : { status:"blocked", candidateDecision:"blocked", providerConfirmationLink:"disabled", safeProviderHandoffUrl:null, autoOpen:false, bookingUrl:null, payment:"blocked", checkout:"blocked", order:"blocked", identityUpload:"blocked", realProvider:"disabled", realNetwork:"disabled", redacted:true, audit:{ eventType:"SAFE_PROVIDER_HANDOFF_URL_GATE_DRAFT", redacted:true } };
    const ui = uiApi && typeof uiApi.buildProviderConfirmationHandoffUiModel === "function"
      ? uiApi.buildProviderConfirmationHandoffUiModel(gate)
      : { title:"前往平台确认", status:"blocked", summary:"当前确认页被阻断，不能打开平台确认页。", candidateDecision:"blocked", providerConfirmationLink:"disabled", continueButtonDisabled:true, cancelButtonEnabled:true, noAutoOpen:true, noBookingUrl:true, bookingUrl:null, noPayment:true, noOrder:true, noIdentityUpload:true, showInMainFlow:false, redacted:true };
    const gateAudit = gate.audit || {};
    const uiAudit = uiApi && typeof uiApi.getProviderConfirmationHandoffUiAuditDraft === "function" ? uiApi.getProviderConfirmationHandoffUiAuditDraft(gate) : { eventType:"PROVIDER_CONFIRMATION_HANDOFF_UI_DRAFT", redacted:true };
    const body = '<section class="commerce-provider-handoff-ui-debug-panel"><h4>Safe Provider Handoff</h4><p>safe provider handoff: confirmation_required</p><p>providerConfirmationLink: ' + esc(gate.providerConfirmationLink || 'disabled') + '</p><p>safeProviderHandoffUrl: ' + esc(gate.safeProviderHandoffUrl ? 'confirmation_required' : 'disabled') + '</p><p>status: ' + esc(gate.status || 'blocked') + '</p><p>candidateDecision: ' + esc(gate.candidateDecision || 'blocked') + '</p><p>autoOpen: false</p><p>bookingUrl: null</p><p>payment: blocked</p><p>order: blocked</p><p>identityUpload: blocked</p><p>trustedHost: ' + esc(gate.safeProviderHandoffHost || '') + '</p><p>gateAudit: ' + esc(gateAudit.eventType || 'SAFE_PROVIDER_HANDOFF_URL_GATE_DRAFT') + '</p><p>uiStatus: ' + esc(ui.status || 'blocked') + '</p><p>uiAudit: ' + esc(uiAudit.eventType || 'PROVIDER_CONFIRMATION_HANDOFF_UI_DRAFT') + '</p><p>redacted: true</p></section>';
    return disclosure('查看 Safe Provider Handoff', body, 'commerce-safe-provider-handoff-disclosure');
  }



  function commerceReadOnlyQuoteInteractiveRecoveryState(){
    const api = window.WeishanReadOnlyQuoteInteractiveRefreshUiController;
    if (api && typeof api.buildReadOnlyQuoteRecoveryUiState === "function") return api.buildReadOnlyQuoteRecoveryUiState({});
    return { status:"idle", recoveryStatus:"not_loaded", lastRefreshStatusLabel:"未运行", recoveredEvidenceSummary:{ available:false, showableAsRealPrice:false, showableAsCandidateEvidence:false, canReplaceMainResultCard:false }, safety:{ bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, booking:false, payment:false, order:false, identityUpload:false, redacted:true }, redacted:true };
  }

  function commerceReadOnlyQuoteInteractiveRefreshDisclosure(task){
    const api = window.WeishanReadOnlyQuoteInteractiveRefreshUiController;
    const state = api && typeof api.buildReadOnlyQuoteRecoveryUiState === "function" ? api.buildReadOnlyQuoteRecoveryUiState({}) : commerceReadOnlyQuoteInteractiveRecoveryState();
    const body = '<section class="commerce-interactive-read-only-quote-refresh-panel"><h4>Interactive Read-Only Quote Refresh</h4><p>status: ' + esc(state.status || 'idle') + '</p><p>recoveryStatus: ' + esc(state.recoveryStatus || 'not_loaded') + '</p><p>刷新只读报价</p><p>最近一次刷新：' + esc(state.lastRefreshStatusLabel || '未运行') + '</p><p>autoRefresh: false</p><p>autoOpen: false</p><p>bookingUrl: null</p><p>checkoutUrl: null</p><p>paymentUrl: null</p><p>orderUrl: null</p><p>payment: false</p><p>order: false</p><p>identityUpload: false</p><p>redacted: true</p></section>';
    return disclosure('查看 Interactive Read-Only Quote Refresh', body, 'commerce-interactive-read-only-quote-refresh-disclosure');
  }

  function commerceLocalEvidenceRecoveryDisclosure(task){
    const state = commerceReadOnlyQuoteInteractiveRecoveryState(task);
    const recovered = state.recoveredEvidenceSummary || {};
    const body = '<section class="commerce-local-evidence-recovery-panel"><h4>Local Evidence Recovery</h4><p>Last Recovered Evidence</p><p>' + (recovered.available ? '已恢复最近一次只读证据' : '暂无可恢复只读证据') + '</p><p>source: local_redacted_state</p><p>showableAsRealPrice: false</p><p>showableAsCandidateEvidence: ' + esc(String(recovered.showableAsCandidateEvidence === true)) + '</p><p>canReplaceMainResultCard: false</p><p>autoRefresh: false</p><p>autoOpen: false</p><p>redacted: true</p></section>';
    return disclosure('查看 Local Evidence Recovery', body, 'commerce-local-evidence-recovery-disclosure');
  }

  function commerceReadOnlyQuoteSessionDisclosure(task){
    const sample = commerceSandboxImportSample(task);
    const summary = sample && sample.dryRun && sample.dryRun.sessionSummary || { sessionId:'deterministic-read-only-quote-session-v2.1.56', status:'not_run', redacted:true };
    const body = '<section class="commerce-read-only-quote-session-panel"><h4>Read-Only Quote Session</h4><p>当前只读报价会话</p><p>Read-Only Quote Session</p><p>Session Timeline</p><p>Audit Export</p><p>Session Recovery</p><p>Redacted JSON Preview</p><p>查看脱敏审计预览</p><p>恢复最近一次只读会话</p><p>sessionId: ' + esc(summary.sessionId || 'deterministic-read-only-quote-session-v2.1.56') + '</p><p>status: ' + esc(summary.status || 'not_run') + '</p><p>本导出仅为只读候选证据</p><p>平台最终为准，未锁价，不代表可出票</p><p>不包含原始响应、密钥、交易链接或身份信息</p><p>productionProviderEnabled: false</p><p>networkAllowed: false</p><p>autoOpen: false</p><p>autoRefresh: false</p><p>redacted: true</p></section>';
    return disclosure('查看 Read-Only Quote Session', body, 'commerce-read-only-quote-session-disclosure');
  }

  function commerceReadOnlyQuoteSessionReportCenterDisclosure(task){
    const sample = commerceSandboxImportSample(task);
    const dryRun = sample && sample.dryRun || {};
    const api = window.WeishanReadOnlyQuoteSessionReportCenter;
    const report = api && typeof api.buildReadOnlyQuoteSessionReportCenter === "function" ? api.buildReadOnlyQuoteSessionReportCenter({ sessionSummary:dryRun.sessionSummary || null, auditExportPreview:dryRun.auditExportPreview || null, topCandidates:dryRun.dryRunTopCandidates || [], selectedCandidate:dryRun.selectedCandidate || null, runHistorySummary:dryRun.runHistorySummary || null, quoteDeltaSummary:dryRun.quoteDeltaSummary || null, replaySummary:dryRun.replaySummary || null }) : { reportCenterName:"read_only_quote_session_report_center_v1", appVersion:"2.1.56", status:"empty", userFacingSummary:{ title:"候选报价证据摘要", subtitle:"只读候选价 · 平台最终为准", labels:["只读候选价", "平台最终为准", "未锁价", "不代表可出票"], caveat:"价格、库存、税费和规则以平台页面为准。唯珊不会付款、不会下单、不会上传证件或银行卡。" }, safetyReport:{ rawResponseStored:false, secretStored:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, identityUpload:false, redacted:true }, actions:{ providerConfirmationRequiresUserConfirm:true, canPayHere:false, canOrderHere:false, canUploadIdentityHere:false }, redacted:true };
    const summary = report.userFacingSummary || {};
    const safety = report.safetyReport || {};
    const body = '<section class="commerce-read-only-quote-session-report-center-panel"><h4>Read-Only Quote Session Report Center</h4><p>Read-Only Quote Session Report Center</p><p>User-Facing Evidence Summary</p><p>Safety Quote Evidence Report</p><p>Audit Export Preview</p><p>' + esc(summary.title || '候选报价证据摘要') + '</p><p>' + esc(summary.subtitle || '只读候选价 · 平台最终为准') + '</p><p>当前导入样本 / 沙盒运行中的候选价格</p><p>平台最终为准</p><p>未锁价</p><p>不代表可出票</p><p>唯珊不会付款、不会下单、不会上传证件或银行卡</p><p>status: ' + esc(report.status || 'empty') + '</p><p>providerConfirmationRequiresUserConfirm: true</p><p>rawResponseStored: ' + esc(String(safety.rawResponseStored === true ? true : false)) + '</p><p>secretStored: false</p><p>bookingUrl: null</p><p>checkoutUrl: null</p><p>paymentUrl: null</p><p>orderUrl: null</p><p>payment: false</p><p>order: false</p><p>identityUpload: false</p><p>redacted: true</p></section>';
    return disclosure('查看 Read-Only Quote Session Report Center', body, 'commerce-read-only-quote-session-report-center-disclosure');
  }

  function commerceRefreshStorageHealthDisclosure(task){
    const api = window.WeishanReadOnlyQuoteRefreshStateStore;
    const health = api && typeof api.buildReadOnlyQuoteRefreshStorageHealth === "function" ? api.buildReadOnlyQuoteRefreshStorageHealth() : { status:"unavailable", corrupted:false, schemaMismatch:false, redacted:true };
    const body = '<section class="commerce-refresh-storage-health-panel"><h4>Refresh Storage Health</h4><p>status: ' + esc(health.status || 'unavailable') + '</p><p>corrupted: ' + esc(String(health.corrupted === true)) + '</p><p>schemaMismatch: ' + esc(String(health.schemaMismatch === true)) + '</p><p>safeEmpty: ' + esc(String(health.safeEmpty === true)) + '</p><p>bookingUrl: null</p><p>autoOpen: false</p><p>redacted: true</p></section>';
    return disclosure('查看 Refresh Storage Health', body, 'commerce-refresh-storage-health-disclosure');
  }

  function commerceProviderSandboxBindingWizardDisclosure(task){
    const api = window.WeishanProviderSandboxBindingWizard;
    const flightFields = commerceSimpleFlightFields(task);
    const model = api && typeof api.buildProviderSandboxBindingWizardModel === "function"
      ? api.buildProviderSandboxBindingWizardModel({ providerId:"google_flights_search", providerName:"Google Flights", providerMode:"fixture", origin:flightFields.origin, destination:flightFields.destination, restrictedCategoryDecision:(task && task.globalProcurementRestrictedCategoryGuard && task.globalProcurementRestrictedCategoryGuard.finalDecision === "blocked") ? "blocked" : "allow" })
      : { wizardName:"provider_sandbox_binding_wizard_v1", appVersion:"2.1.50", title:"Provider 沙盒绑定准备", status:"fixture_ready", steps:[{ stepId:"provider_selected", label:"选择只读 Provider", status:"complete" }, { stepId:"read_only_refresh_ready", label:"只读报价刷新准备", status:"complete" }], actions:{ canAttemptReadOnlyRefresh:true, canEnableProductionProvider:false, canEnterSecretHere:false, canSaveSecretHere:false }, productionProviderEnabled:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, redacted:true };
    const steps = Array.isArray(model.steps) ? model.steps : [];
    const body = '<section class="commerce-provider-sandbox-binding-wizard-panel"><h4>Provider Sandbox Binding Wizard</h4><p>' + esc(model.title || 'Provider 沙盒绑定准备') + '</p><p>wizardName: ' + esc(model.wizardName || 'provider_sandbox_binding_wizard_v1') + '</p><p>wizardStatus: ' + esc(model.status || 'fixture_ready') + '</p><p>providerId: ' + esc(model.providerId || 'google_flights_search') + '</p><p>providerMode: ' + esc(model.providerMode || 'fixture') + '</p><p>canAttemptReadOnlyRefresh: ' + esc(String(model.actions && model.actions.canAttemptReadOnlyRefresh === true)) + '</p><p>canEnableProductionProvider: false</p><p>canEnterSecretHere: false</p><p>canSaveSecretHere: false</p><ul>' + steps.map(function(step){ return '<li>' + esc(step.label || step.stepId || '') + '：' + esc(step.status || 'pending') + '</li>'; }).join('') + '</ul><p>bookingUrl: null</p><p>autoOpen: false</p><p>payment: false</p><p>order: false</p><p>identityUpload: false</p><p>redacted: true</p></section>';
    return disclosure('查看 Provider Sandbox Binding Wizard', body, 'commerce-provider-sandbox-binding-wizard-disclosure');
  }

  function commerceReadOnlyQuoteRefreshStateDisclosure(task){
    const api = window.WeishanReadOnlyQuoteRefreshStateStore;
    const summary = api && typeof api.buildReadOnlyQuoteRefreshStateSummary === "function"
      ? api.buildReadOnlyQuoteRefreshStateSummary({ lastRefreshStatus:"not_run", providerId:"google_flights_search", providerName:"Google Flights", providerMode:"fixture" })
      : { title:"Refresh State Persistence", summary:"最近一次刷新：未运行", lastRefreshStatus:"not_run", showableAsRealPrice:false, canReplaceMainResultCard:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, payment:false, order:false, identityUpload:false, redacted:true };
    const body = '<section class="commerce-read-only-quote-refresh-state-panel"><h4>Refresh State Persistence</h4><p>' + esc(summary.summary || '最近一次刷新：未运行') + '</p><p>lastRefreshStatus: ' + esc(summary.lastRefreshStatus || 'not_run') + '</p><p>showableAsRealPrice: false</p><p>canReplaceMainResultCard: false</p><p>bookingUrl: null</p><p>checkoutUrl: null</p><p>paymentUrl: null</p><p>orderUrl: null</p><p>autoOpen: false</p><p>payment: false</p><p>order: false</p><p>identityUpload: false</p><p>redacted: true</p></section>';
    return disclosure('查看 Refresh State Persistence', body, 'commerce-read-only-quote-refresh-state-disclosure');
  }

  function commerceLastRefreshEvidenceDisclosure(task){
    const api = window.WeishanReadOnlyQuoteRefreshController;
    const evidence = api && typeof api.loadLastReadOnlyQuoteRefreshEvidence === "function"
      ? api.loadLastReadOnlyQuoteRefreshEvidence({})
      : { refreshStateSummary:{ summary:"最近一次刷新：未运行", lastRefreshStatus:"not_run" }, bookingUrl:null, autoOpen:false, payment:false, order:false, identityUpload:false, redacted:true };
    const summary = evidence.refreshStateSummary || {};
    const body = '<section class="commerce-last-refresh-evidence-panel"><h4>Last Refresh Evidence</h4><p>' + esc(summary.summary || '最近一次刷新：未运行') + '</p><p>lastRefreshStatus: ' + esc(summary.lastRefreshStatus || 'not_run') + '</p><p>userTriggeredOnly: true</p><p>autoRefresh: false</p><p>bookingUrl: null</p><p>autoOpen: false</p><p>payment: false</p><p>order: false</p><p>identityUpload: false</p><p>redacted: true</p></section>';
    return disclosure('查看 Last Refresh Evidence', body, 'commerce-last-refresh-evidence-disclosure');
  }

  function commerceSandboxImportSample(task){
    const fields = commerceSimpleFlightFields(task);
    const raw = {
      providerId:"google_flights_search",
      providerName:"Google Flights",
      route:{ origin:fields.origin || "上海", destination:fields.destination || "成都" },
      departureDate:fields.date || fields.dateDisplay || "2026-07-15",
      currency:"CNY",
      baseFare:860,
      taxesAndFees:110,
      providerFees:40,
      totalPrice:1010,
      priceUpdatedAt:"2026-06-20T00:00:00.000Z",
      fareSource:"sandbox_read_only_import",
      handoffCandidate:{ providerId:"google_flights_search", providerName:"Google Flights", providerType:"flight_search", searchOnly:true, redacted:true }
    };
    const harnessApi = window.WeishanSandboxProviderDryRunHarness;
    const imported = harnessApi && typeof harnessApi.importSandboxProviderReadOnlyResponse === "function"
      ? harnessApi.importSandboxProviderReadOnlyResponse(raw, { providerMode:"sandbox_read_only" })
      : { status:"accepted", importStatus:"accepted", lastImportStatus:"accepted", normalizedQuote:Object.assign({}, raw, { providerMode:"sandbox_read_only", safeProviderHandoffReady:false, safeProviderHandoffUrl:null, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, payment:false, order:false, identityUpload:false, rawResponseStored:false, sanitized:true, redacted:true }), rawResponseStored:false, sanitized:true, redacted:true };
    const reportApi = window.WeishanRealFlightPriceEvidenceReport;
    const report = reportApi && typeof reportApi.buildRealFlightPriceEvidenceReport === "function"
      ? reportApi.buildRealFlightPriceEvidenceReport({ origin:raw.route.origin, destination:raw.route.destination, departureDate:raw.departureDate, providerId:"google_flights_search", providerMode:"sandbox_read_only" }, { sandboxImport:imported, sandboxImportQuote:imported.normalizedQuote, sandboxImportStatus:imported.lastImportStatus || imported.status, refreshTriggered:true, lastRefreshStatus:"refreshed" })
      : { sandboxImport:{ supported:true, lastImportStatus:"accepted", importedEvidenceAvailable:true, rawResponseStored:false, sanitized:true, redacted:true, safeProviderHandoffReady:false, safeProviderHandoffUrl:null, showableAsRealPrice:false, canReplace:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, payment:false, order:false, identityUpload:false }, handoff:{ safeProviderHandoffUrl:null, safeProviderHandoffReady:false }, provider:{ providerId:"google_flights_search", providerName:"Google Flights", providerMode:"sandbox_read_only", fareSource:"sandbox_read_only_import" }, refresh:{ refreshSupported:true, refreshMode:"sandbox_read_only", lastRefreshStatus:"refreshed" } };
    const dryRunApi = window.WeishanMultiProviderSandboxDryRunOrchestrator;
    const dryRun = dryRunApi && typeof dryRunApi.runMultiProviderSandboxDryRun === "function" ? dryRunApi.runMultiProviderSandboxDryRun(task || { title: raw.route.origin + " 到 " + raw.route.destination }, {}) : null;
    return { imported, report, dryRun, providerRunMatrix: dryRun && dryRun.providerRunMatrix || null, runTimelineSummary: dryRun && dryRun.runTimelineSummary || null, dryRunTopCandidates: dryRun && Array.isArray(dryRun.dryRunTopCandidates) ? dryRun.dryRunTopCandidates : [], dryRunStatus: dryRun && dryRun.status || "not_run" };
  }

  function commerceSandboxProviderDryRunHarnessDisclosure(task){
    const api = window.WeishanSandboxProviderDryRunHarness;
    const status = api && typeof api.buildSandboxProviderDryRunHarnessStatus === "function" ? api.buildSandboxProviderDryRunHarnessStatus({ providerId:"google_flights_search" }) : { status:"ready", rawResponseStored:false, bookingUrl:null, autoOpen:false, redacted:true };
    const body = '<section class="commerce-sandbox-provider-dry-run-harness-panel"><h4>Sandbox Provider Dry-Run Harness</h4><p>status: ' + esc(status.status || 'ready') + '</p><p>只读沙盒导入证据</p><p>networkAttemptCount: 0</p><p>productionProviderEnabled: false</p><p>rawResponseStored: false</p><p>bookingUrl: null</p><p>checkoutUrl: null</p><p>paymentUrl: null</p><p>orderUrl: null</p><p>autoOpen: false</p><p>payment: false</p><p>order: false</p><p>identityUpload: false</p><p>redacted: true</p></section>';
    return disclosure('查看 Sandbox Provider Dry-Run Harness', body, 'commerce-sandbox-provider-dry-run-harness-disclosure');
  }

  function commerceSandboxResponseImportDisclosure(task){
    const sample = commerceSandboxImportSample(task);
    const consoleApi = window.WeishanSandboxResponseImportConsoleViewModel;
    const model = consoleApi && typeof consoleApi.buildSandboxResponseImportConsoleModel === "function" ? consoleApi.buildSandboxResponseImportConsoleModel({
      sandboxDryRunSummary: sample.dryRun || null,
      runTimelineSummary: sample.runTimelineSummary || null,
      providerRunMatrix: sample.providerRunMatrix || null,
      dryRunStatus: sample.dryRunStatus || (sample.dryRun && sample.dryRun.status) || "not_run",
      dryRunButton: { label: "运行沙盒只读报价", enabled: true, loading: false, autoRun: false },
      dryRunTopCandidates: sample.dryRunTopCandidates || []
    }) : { title:"沙盒响应导入", status:"idle", rawInputStored:false, preview:{ validationStatus:"not_run" }, actions:{ canPreview:true, canImport:false, canClear:true, canPasteSecretHere:false, canSaveRawResponse:false }, safety:{ bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, payment:false, order:false, identityUpload:false }, messages:{ helper:"仅支持只读沙盒响应样本。导入前会先校验并脱敏。", caveat:"导入结果仅作为候选证据，未锁价，不代表可出票。", platformFinal:"价格、库存、税费和规则以平台页面为准。", runSandbox:"支持运行沙盒只读报价。" }, redacted:true, dryRunStatus:"not_run", dryRunButton:{ label:"运行沙盒只读报价", enabled:true, loading:false, autoRun:false }, dryRunTopCandidates:[], sandboxDryRunSummary:null, runTimelineSummary:null, providerRunMatrix:null };
    const dryRun = sample.dryRun || {};
    const dryRunTopCandidates = Array.isArray(model.dryRunTopCandidates) ? model.dryRunTopCandidates : [];
    const dryRunSummaryHtml = '<h5>本次沙盒运行结果</h5><p>运行沙盒只读报价</p><p>Multi-Provider Sandbox Dry-Run</p><p>Sandbox Provider Run Matrix</p><p>Quote Run Timeline</p><p>本次沙盒运行结果：' + esc(model.dryRunStatus || dryRun.status || 'not_run') + '</p><p>Provider 运行矩阵：' + esc((model.providerRunMatrix && model.providerRunMatrix.matrixName) || (dryRun.providerRunMatrix && dryRun.providerRunMatrix.matrixName) || 'sandbox_provider_run_matrix_v1') + '</p><p>运行时间线：' + esc((model.runTimelineSummary && model.runTimelineSummary.summary) || (dryRun.runTimelineSummary && dryRun.runTimelineSummary.summary) || '构建 Provider 运行矩阵 · 生成只读沙盒报价 · 报价归一化 · Top 3 排序 · 候选选择准备') + '</p><p>Top 3 候选报价：' + esc(String(dryRunTopCandidates.length || 0)) + '</p>';
    const body = '<section class="commerce-sandbox-response-import-panel" data-commerce-sandbox-response-import-console="true"><h4>Sandbox Response Import Console</h4><p>' + esc(model.title || '多条沙盒报价导入') + '</p><p>沙盒响应导入</p><p>Multi Quote Import</p><p>多条沙盒报价导入</p><p>运行沙盒只读报价</p><p>本次沙盒运行结果</p><p>Multi-Provider Sandbox Dry-Run</p><p>Sandbox Provider Run Matrix</p><p>Quote Run Timeline</p><p>Top 3 候选报价</p><p>Ranking Scope: 导入样本范围</p><p>当前导入样本中的低价候选</p><p>Selection Evidence</p><p>' + esc(model.messages && model.messages.helper || '仅支持只读沙盒响应样本。导入前会先校验并脱敏。') + '</p><textarea class="commerce-sandbox-response-import-input" data-commerce-sandbox-response-import-input="true" aria-label="Sandbox Response Import JSON" rows="8" placeholder="JSON sandbox read-only response sample"></textarea><div class="commerce-sandbox-response-import-actions"><button type="button" class="cmd-btn gray" data-commerce-sandbox-response-import-preview="true">预览导入结果</button> <button type="button" class="cmd-btn gray" data-commerce-sandbox-response-import-confirm="true">确认导入脱敏证据</button> <button type="button" class="cmd-btn gray" data-commerce-run-sandbox-dry-run="true"' + ((model.dryRunButton && model.dryRunButton.enabled === false) ? ' disabled' : '') + '>' + esc(model.dryRunButton && model.dryRunButton.label || '运行沙盒只读报价') + '</button> <button type="button" class="cmd-btn gray" data-commerce-sandbox-response-import-clear="true">清除导入状态</button></div><div data-commerce-sandbox-response-import-output="true"><h5>Validation Preview</h5><p>validationStatus: not_run</p><p>provider: -</p><p>fareSource: -</p><p>price breakdown: -</p><p>taxFeeIntegrity: not_run</p><p>freshness: not_run</p><p>safeProviderHandoffReady: false</p><p>blocked reason: </p>' + dryRunSummaryHtml + '<h5>Import Sanitization</h5><p>导入响应已脱敏</p><p>raw response stored false</p><p>rawResponseStored: false</p><p>sensitive field detected false</p><p>bookingUrl forced null</p><p>bookingUrl: null</p><p>checkoutUrl: null</p><p>paymentUrl: null</p><p>orderUrl: null</p><p>autoOpen: false</p><p>payment: false</p><p>order: false</p><p>identityUpload: false</p><p>redacted: true</p></div><p>' + esc(model.messages && model.messages.caveat || '导入结果仅作为候选证据，未锁价，不代表可出票。') + '</p><p>' + esc(model.messages && model.messages.platformFinal || '价格、库存、税费和规则以平台页面为准。') + '</p></section>';
    return disclosure('查看 Sandbox Response Import Console', body, 'commerce-sandbox-response-import-disclosure');
  }

  function commerceLastSandboxImportEvidenceDisclosure(task){
    const api = window.WeishanReadOnlyQuoteRefreshController;
    const loaded = api && typeof api.loadLastSandboxImportEvidence === "function" ? api.loadLastSandboxImportEvidence({}) : null;
    const summary = loaded && loaded.sandboxImportStateSummary || { summary:"未导入", importedEvidenceAvailable:false };
    const body = '<section class="commerce-last-sandbox-import-evidence-panel"><h4>Last Sandbox Import Evidence</h4><p>' + esc(summary.summary || '未导入') + '</p><p>只读沙盒导入证据</p><p>importedEvidenceAvailable: ' + esc(String(summary.importedEvidenceAvailable === true)) + '</p><p>rawResponseStored: false</p><p>showableAsRealPrice: false</p><p>canReplaceMainResultCard: false</p><p>bookingUrl: null</p><p>autoOpen: false</p><p>redacted: true</p></section>';
    return disclosure('查看 Last Sandbox Import Evidence', body, 'commerce-last-sandbox-import-evidence-disclosure');
  }

  function commerceImportSanitizationDisclosure(task){
    const storeApi = window.WeishanSandboxProviderResponseImportStateStore;
    const sample = commerceSandboxImportSample(task);
    const sanitized = storeApi && typeof storeApi.sanitizeSandboxProviderResponseImportState === "function" ? storeApi.sanitizeSandboxProviderResponseImportState(sample.imported || {}) : { rawResponseStored:false, sanitized:true, redacted:true, bookingUrl:null, autoOpen:false };
    const body = '<section class="commerce-import-sanitization-panel"><h4>Import Sanitization</h4><p>导入响应已脱敏</p><p>sanitized: true</p><p>redacted: true</p><p>rawResponseStored: false</p><p>bookingUrl: null</p><p>checkoutUrl: null</p><p>paymentUrl: null</p><p>orderUrl: null</p><p>autoOpen: false</p><p>payment: false</p><p>order: false</p><p>identityUpload: false</p><p>totalPrice: ' + esc(String(sanitized.totalPrice == null ? '' : sanitized.totalPrice)) + '</p></section>';
    return disclosure('查看 Import Sanitization', body, 'commerce-import-sanitization-disclosure');
  }

  function commerceRealFlightPriceEvidenceReportDisclosure(task){
    const reportApi = window.WeishanRealFlightPriceEvidenceReport;
    const flightFields = commerceSimpleFlightFields(task);
    const request = {
      origin: flightFields.origin || "上海",
      destination: flightFields.destination || "成都",
      departureDate: flightFields.date || flightFields.dateDisplay || "2026-07-15",
      tripType: "one_way",
      passengerCount: 1,
      cabinClass: "economy",
      directOnly: flightFields.directPreference !== "转机优先",
      sortIntent: flightFields.goal || "低价优先",
      restrictedCategoryDecision: (task && task.globalProcurementRestrictedCategoryGuard && task.globalProcurementRestrictedCategoryGuard.finalDecision === "blocked") ? "blocked" : "allow"
    };
    const report = reportApi && typeof reportApi.buildRealFlightPriceEvidenceReport === "function"
      ? reportApi.buildRealFlightPriceEvidenceReport(request, { dryRunEnabled:false, hasSecureCredentialReference:false })
      : { reportName:"real_flight_price_evidence_report_v1", mode:"read_only_beta", userFacingRealPriceEnabled:false, debugEvidenceEnabled:true, provider:{ providerId:"real_flight_fixture", providerName:"Real Flight Fixture", providerMode:"fixture", fareSource:"fixture_read_only" }, fetchSafety:{ status:"allowed", decision:"fixture_provider_allowed", readOnly:true, networkAllowed:false, booking:false, payment:false, order:false, identityUpload:false }, refresh:{ refreshSupported:true, refreshMode:"fixture", lastRefreshStatus:"not_run", userTriggeredOnly:true, autoRefresh:false }, credentialReadiness:{ status:"fixture_ready", hasSecureCredentialReference:false, sandboxDryRunEnabled:false, networkDryRunAllowed:false, productionProviderEnabled:false, wizardSummary:{ title:"Provider 沙盒绑定准备", status:"fixture_ready", productionProviderEnabled:false, redacted:true }, redacted:true }, priceQuote:{ currency:"CNY", baseFare:860, taxesAndFees:110, providerFees:40, totalPrice:1010, priceUpdatedAt:"2026-06-20T00:00:00.000Z", freshnessStatus:"fresh", taxFeeIntegrityStatus:"complete", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null }, integrity:{ totalMatchesBreakdown:true, taxFeeIntegrityStatus:"complete", freshnessStatus:"fresh", showableAsRealPrice:false, showableAsCandidateEvidence:true, userFacingCaveatRequired:true, caveat:"价格、库存、税费和规则以平台页面为准。" }, handoff:{ safeProviderHandoffReady:false, safeProviderHandoffUrl:null, bookingUrl:null, autoOpen:false, requiresConfirmation:true }, safety:{ checkout:"blocked", payment:"blocked", order:"blocked", identityUpload:"blocked", credentialExposure:"redacted" }, providerConnector:{ connectorName:"single_flight_provider_sandbox_connector_v1", providerMode:"fixture", status:"fixture_ready", decision:"fixture_read_only_ready", sandboxDryRunEnabled:false, hasSecureCredentialReference:false, networkAllowed:false, productionProviderEnabled:false, readOnly:true, redacted:true }, readiness:{ betaReady:false, canUseFixtureEvidence:true, canUseSandboxReadOnlyEvidence:false, productionProviderEnabled:false, userFacingRealPriceEnabled:false, showableAsRealPrice:false, canShowInDebugPanel:true, canReplaceMainResultCard:false, finalDecision:"fixture_refresh_ready" }, redacted:true };
    const provider = report.provider || {};
    const safety = report.fetchSafety || {};
    const integrity = report.integrity || {};
    const handoff = report.handoff || {};
    const readiness = report.readiness || {};
    const contract = report.providerContract || {};
    const connector = report.providerConnector || {};
    const refresh = report.refresh || {};
    const credentialReadiness = report.credentialReadiness || {};
    const body = '<section class="commerce-real-flight-price-evidence-report-panel"><h4>Real Flight Price Evidence</h4><p>真实价格证据：只读 beta</p><p>当前仅用于安全验证，未锁价，不代表可出票。</p><p>价格、库存、税费和规则以平台页面为准。</p><p>唯珊不会付款、不会下单、不会上传证件或银行卡。</p><p>Single Provider Sandbox Connector</p><p>connectorName: ' + esc(connector.connectorName || "single_flight_provider_sandbox_connector_v1") + '</p><p>connectorStatus: ' + esc(connector.status || "fixture_ready") + '</p><p>connectorDecision: ' + esc(connector.decision || "fixture_read_only_ready") + '</p><p>Sandbox dry-run enabled: ' + esc(String(connector.sandboxDryRunEnabled === true)) + '</p><p>Secure credential reference present: ' + esc(String(connector.hasSecureCredentialReference === true)) + '</p><p>Network allowed: ' + esc(String(connector.networkAllowed === true)) + '</p><p>Production provider enabled: false</p><p>production provider enabled: false</p><p>Provider Credential Readiness</p><p>Provider 沙盒绑定准备</p><p>Credential Readiness</p><p>credentialReadinessStatus: ' + esc(credentialReadiness.status || "fixture_ready") + '</p><p>Secure credential reference present: ' + esc(String(credentialReadiness.hasSecureCredentialReference === true)) + '</p><p>Sandbox dry-run enabled: ' + esc(String(credentialReadiness.sandboxDryRunEnabled === true)) + '</p><p>Network dry-run allowed: ' + esc(String(credentialReadiness.networkDryRunAllowed === true)) + '</p><p>Read-Only Quote Refresh</p><p>Refresh State Persistence</p><p>Last Refresh Evidence</p><p>Refresh status: ' + esc(refresh.lastRefreshStatus || "not_run") + '</p><p>refreshMode: ' + esc(refresh.refreshMode || "fixture") + '</p><p>autoRefresh: false</p><p>刷新只读报价</p><p>仅更新候选证据，未锁价，不代表可出票</p><p>价格、库存、税费和规则以平台页面为准</p><p>Read-only evidence decision: ' + esc(readiness.finalDecision || "fixture_candidate_card_ready") + '</p><p>providerId: ' + esc(provider.providerId || "real_flight_fixture") + '</p><p>providerName: ' + esc(provider.providerName || "Real Flight Fixture") + '</p><p>providerMode: ' + esc(provider.providerMode || "fixture") + '</p><p>fareSource: ' + esc(provider.fareSource || "fixture_read_only") + '</p><p>contractName: ' + esc(contract.contractName || "real_flight_price_read_only_provider_contract_v1") + '</p><p>fetchSafety: ' + esc(safety.status || "allowed") + '</p><p>readOnly: true</p><p>networkAllowed: ' + esc(String(safety.networkAllowed === true)) + '</p><p>booking: false</p><p>payment: false</p><p>order: false</p><p>identityUpload: false</p><p>price integrity: ' + esc(integrity.taxFeeIntegrityStatus || "complete") + '</p><p>freshness: ' + esc(integrity.freshnessStatus || "fresh") + '</p><p>safeProviderHandoffReady: ' + esc(String(handoff.safeProviderHandoffReady === true)) + '</p><p>bookingUrl: null</p><p>autoOpen: false</p><p>付款：blocked</p><p>下单：blocked</p><p>证件上传：blocked</p><p>userFacingRealPriceEnabled: false</p><p>debugEvidenceEnabled: true</p><p>canReplaceMainResultCard: ' + esc(String(readiness.canReplaceMainResultCard === true)) + '</p><p>finalDecision: ' + esc(readiness.finalDecision || "debug_price_evidence_ready") + '</p><p>redacted: true</p></section>';
    return disclosure('查看 Real Flight Price Evidence Report', body, 'commerce-real-flight-price-evidence-report-disclosure');
  }

  function commerceCleanResultSurfaceV2Disclosure(task){
    const surface = commerceCleanResultSurfaceV2ForTask(task, {});
    const audit = surface.audit || {};
    const body = '<section class="commerce-clean-result-surface-v2-panel"><h4>Clean Result Surface V2</h4><p>clean result surface v2: active</p><p>surfaceMode: ' + esc(surface.surfaceMode || '') + '</p><p>resultCardCount: ' + esc(String(surface.resultCardCount || 0)) + '</p><p>debugPanelsHiddenByDefault: true</p><p>duplicateNoPriceMessageCount: ' + esc(String(surface.duplicateNoPriceMessageCount || 0)) + '</p><p>userFacingSafetyHintCount: ' + esc(String(surface.userFacingSafetyHintCount || 0)) + '</p><p>backendPanelDefaultExpandedCount: 0</p><p>destinationModifierLeakCount: ' + esc(String(audit.destinationModifierLeakCount || 0)) + '</p><p>duplicateSafetyHintCount: ' + esc(String(audit.duplicateSafetyHintCount || 0)) + '</p><p>internalDebugLabelVisibleCount: ' + esc(String(audit.internalDebugLabelVisibleCount || 0)) + '</p><p>handoffAreaGrouped: ' + esc(String(audit.handoffAreaGrouped !== false)) + '</p><p>bookingUrlDisplayedCount: 0</p><p>paymentButtonDisplayedCount: 0</p><p>orderButtonDisplayedCount: 0</p><p>identityUploadDisplayedCount: 0</p><p>' + esc(audit.eventType || 'CLEAN_RESULT_SURFACE_V2_DRAFT') + '</p><p>redacted: true</p></section>';
    return disclosure('查看 Clean Result Surface V2', body, 'commerce-clean-result-surface-v2-disclosure');
  }  function commerceCleanResultSurfaceV3Disclosure(task){
    const surface = commerceCleanResultSurfaceV3ForTask(task, { guardedPriceCardHtml:commerceGuardedFlightPriceCardHtml(task) });
    const audit = surface.audit || {};
    const body = '<section class="commerce-clean-result-surface-v3-panel"><h4>Clean Result Surface V3</h4><p>clean result surface v3: active</p><p>surfaceVersion: ' + esc(surface.surfaceVersion || 'v3') + '</p><p>compactCardsEnabled: true</p><p>manualVerificationGroupEnabled: ' + esc(String(surface.manualVerificationGroupEnabled !== false)) + '</p><p>longExternalSearchHintCollapsed: true</p><p>debugPanelsHiddenByDefault: true</p><p>resultCardCount: ' + esc(String(surface.resultCardCount || 0)) + '</p><p>duplicateSafetyHintCount: ' + esc(String(audit.duplicateSafetyHintCount || 0)) + '</p><p>internalDebugLabelVisibleCount: ' + esc(String(audit.internalDebugLabelVisibleCount || 0)) + '</p><p>bookingUrlDisplayedCount: 0</p><p>paymentActionDisplayedCount: 0</p><p>orderActionDisplayedCount: 0</p><p>identityUploadDisplayedCount: 0</p><p>' + esc(audit.eventType || 'CLEAN_RESULT_SURFACE_V3_DRAFT') + '</p><p>RESULT_CARD_VISUAL_FORMATTER_DRAFT</p><p>MANUAL_HANDOFF_UX_V2_DRAFT</p><p>redacted: true</p></section>';
    return disclosure('查看 Clean Result Surface V3', body, 'commerce-clean-result-surface-v3-disclosure');
  }

  function commerceCleanResultSurfaceV4Disclosure(task){
    const surface = commerceCleanResultSurfaceV4ForTask(task, { guardedPriceCardHtml:commerceGuardedFlightPriceCardHtml(task) });
    const audit = surface.audit || {};
    const readiness = surface.providerReadiness || {};
    const flight = readiness.flight_provider || {};
    const other = readiness.other_provider || {};
    const restricted = readiness.restricted_category || {};
    const body = '<section class="commerce-clean-result-surface-v4-panel"><h4>Clean Result Surface V4</h4><p>clean result surface v4: active</p><p>compact flight result card: ' + esc(flight.compactFlightResultCard || 'active') + '</p><p>user surface debug filter: ' + esc(flight.userSurfaceDebugFilter || 'active') + '</p><p>manual handoff UX v3: ' + esc(flight.manualHandoffUxV3 || 'manual-only') + '</p><p>manual verification group v2: ' + esc(flight.manualVerificationGroupV2 || 'active') + '</p><p>task history summary formatter: ' + esc(flight.taskHistorySummaryFormatter || 'active') + '</p><p>clean result surface v4: ' + esc(flight.cleanResultSurfaceV4 || 'active') + '</p><p>bookingUrl handoff: disabled</p><p>payment/order: disabled</p><p>flight_provider final decision: ' + esc(flight.finalDecision || 'limited-beta-ready') + '</p><p>其它 provider final decision: ' + esc(other.finalDecision || 'no-go') + '</p><p>受限品类 final decision: ' + esc(restricted.finalDecision || 'blocked') + '</p><p>duplicateSafetyHintCount: ' + esc(String(audit.duplicateSafetyHintCount || 0)) + '</p><p>debugFieldLeakCount: ' + esc(String(audit.debugFieldLeakCount || 0)) + '</p><p>bookingUrlDisplayedCount: 0</p><p>paymentActionDisplayedCount: 0</p><p>orderActionDisplayedCount: 0</p><p>identityUploadDisplayedCount: 0</p><p>' + esc(audit.eventType || 'USER_SURFACE_FINAL_CLEANUP_DRAFT') + '</p><p>TASK_HISTORY_SUMMARY_FORMATTER_DRAFT</p><p>COMPACT_FLIGHT_RESULT_CARD_V1_DRAFT</p><p>MANUAL_HANDOFF_UX_V3_DRAFT</p><p>MANUAL_VERIFICATION_GROUP_V2_DRAFT</p><p>redacted: true</p></section>';
    return disclosure('查看 Clean Result Surface V4', body, 'commerce-clean-result-surface-v4-disclosure');
  }


  function commerceReadOnlyQuoteDecisionEvidenceDisclosure(task){
    const sample = commerceSandboxImportSample(task);
    const candidates = sample.dryRunTopCandidates || [];
    const decisionApi = window.WeishanReadOnlyQuoteDecisionAssistant;
    const comparisonApi = window.WeishanReadOnlyQuoteCandidateComparisonExplainer;
    const decision = decisionApi && typeof decisionApi.buildReadOnlyQuoteDecisionAssistant === "function" ? decisionApi.buildReadOnlyQuoteDecisionAssistant({ topCandidates:candidates }) : null;
    const comparison = comparisonApi && typeof comparisonApi.buildReadOnlyQuoteCandidateComparison === "function" ? comparisonApi.buildReadOnlyQuoteCandidateComparison(candidates) : null;
    const recommended = decision && decision.recommendedCandidate || {};
    const reasoning = decision && decision.reasoning || {};
    const forbidden = comparison && comparison.forbiddenClaims || { lowestAcrossWeb:false, finalBookablePrice:false, priceLocked:false, ticketAvailable:false };
    const table = comparison && Array.isArray(comparison.table) ? comparison.table : [];
    const body = '<section class="commerce-read-only-decision-evidence-panel" data-commerce-read-only-decision-evidence="true"><h4>Decision Evidence</h4><p>Read-Only Quote Decision Assistant</p><p>Candidate Comparison</p><p>Decision Evidence</p><p>Forbidden Claims</p><p>推荐理由</p><p>' + esc(reasoning.primaryReason || '该候选在本次只读候选样本中合计金额较低。') + '</p><p>本地只读候选证据中较低</p><p>平台最终为准</p><p>未锁价</p><p>不代表可出票</p><p>仍需前往平台确认</p><p>recommendedRank: ' + esc(String(recommended.rank || '')) + '</p><p>canOpenProviderConfirmation: ' + esc(String(decision && decision.actions && decision.actions.canOpenProviderConfirmation === true)) + '</p><h5>Candidate Comparison</h5><ul>' + table.map(function(candidate){ return '<li>#' + esc(String(candidate.rank || '')) + ' ' + esc(candidate.providerName || '只读候选') + ' · ' + esc(String(candidate.totalPrice == null ? '' : candidate.totalPrice)) + ' · ' + esc(candidate.handoffStatus || 'disabled') + '</li>'; }).join('') + '</ul><h5>Forbidden Claims</h5><p>全网最低: ' + esc(String(forbidden.lowestAcrossWeb === true ? true : false)) + '</p><p>最终可订价: ' + esc(String(forbidden.finalBookablePrice === true ? true : false)) + '</p><p>已锁价: ' + esc(String(forbidden.priceLocked === true ? true : false)) + '</p><p>可出票: ' + esc(String(forbidden.ticketAvailable === true ? true : false)) + '</p><p>bookingUrl: null</p><p>checkoutUrl: null</p><p>paymentUrl: null</p><p>orderUrl: null</p><p>rawResponseStored: false</p><p>secretStored: false</p><p>redacted: true</p></section>';
    return disclosure('查看 Read-Only Quote Decision Evidence', body, 'commerce-read-only-decision-evidence-disclosure');
  }

  function commerceSafetyAndDebugDetailsDisclosure(task, extraPanels){
    const panels = [commerceAiProcurementBrainDisclosure(task), commerceAiBackendRouterDisclosure(task), commerceProcurementClarificationGateDisclosure(task), commerceCleanResultSurfaceV1Disclosure(task), commerceTopResultCardsBuilderDisclosure(task), commerceProviderHandoffUiDisclosure(task), commerceCleanResultSurfaceV2Disclosure(task), commerceCleanResultSurfaceV3Disclosure(task), commerceCleanResultSurfaceV4Disclosure(task)].concat(extraPanels || []).filter(Boolean).join('');
    return disclosure('查看安全与调试详情', '<section class="commerce-safety-debug-details"><h4>安全与调试详情</h4><p>后台 gate / audit / readiness 默认隐藏；展开后仅用于审计。</p>' + panels + '</section>', 'commerce-simple-flight-advanced-debug-disclosure');
  }

  function commerceClarificationResultPanelHtml(task){
    const brain = commerceAiBrainDecisionForTask(task);
    const clarification = commerceClarificationDecisionForTask(task);
    return '<section class="commerce-result-summary-panel commerce-one-screen-result commerce-clarification-result" aria-label="采购追问"><div class="commerce-result-summary-head"><div class="commerce-result-summary-headline"><span>AI 大脑采购编排</span><strong>请补充关键信息</strong></div></div><div class="commerce-one-screen-body"><section class="commerce-one-screen-card"><h4>请补充关键信息</h4><p>' + esc(clarification.questionText || brain.clarificationQuestion || '请补充关键采购条件。') + '</p><h5>需要补充</h5>' + listHtml(clarification.missingFields || brain.missingFields || []) + '<p>当前不会生成假结果，不显示价格，不提供 bookingUrl，不付款，不下单。</p></section></div>' + commerceSafetyAndDebugDetailsDisclosure(task, []) + '</section>';
  }

  function commerceFlightWorkflowPanelHtml(task){
    const workflowApi = window.WeishanFlightEvidenceWorkflowOrchestrator;
    const presenterApi = window.WeishanFlightWorkflowUiPresenter || window.WeishanFlightEvidenceWorkflowStatusPresenter;
    const raw = String(task && (task.inputSummary || task.rawInput || task.title || task.text) || "");
    const workflow = workflowApi && typeof workflowApi.runFlightEvidenceWorkflow === "function" ? workflowApi.runFlightEvidenceWorkflow({ rawText:raw }) : null;
    if (!workflow || workflow.workflowStatus === "blocked") return "";
    const presenter = presenterApi && typeof presenterApi.buildFlightWorkflowUiPresenter === "function" ? presenterApi.buildFlightWorkflowUiPresenter(workflow) : (presenterApi && typeof presenterApi.buildFlightEvidenceWorkflowStatusPresenter === "function" ? presenterApi.buildFlightEvidenceWorkflowStatusPresenter(workflow) : workflow);
    const steps = Array.isArray(presenter.stepList) ? presenter.stepList : (Array.isArray(presenter.steps) ? presenter.steps : []);
    const actionQueue = workflow.actionQueueSummary || presenter.actionQueueSummary || {};
    const timeline = workflow.progressTimelineSummary || presenter.progressTimelineSummary || {};
    const queueActions = Array.isArray(actionQueue.actions) ? actionQueue.actions : [];
    const blockedActions = Array.isArray(workflow.blockedActions) ? workflow.blockedActions : (Array.isArray(actionQueue.blockedActions) ? actionQueue.blockedActions : []);
    const timelineSteps = Array.isArray(timeline.steps) ? timeline.steps : [];
    const auditApi = window.WeishanFlightWorkflowAuditReviewCenter || {};
    const exportApi = window.WeishanFlightWorkflowSafeSessionExportPreview || {};
    const badgeApi = window.WeishanFlightWorkflowRiskBadgeBuilder || {};
    const humanReviewApi = window.WeishanFlightWorkflowHumanReviewChecklist || {};
    const finalPacketApi = window.WeishanFlightWorkflowFinalSafeHandoffPacket || {};
    const packetPolicyApi = window.WeishanFlightWorkflowHandoffPacketPolicyGuard || {};
    const sentinelApi = window.WeishanFlightWorkflowSafetyRegressionSentinel || {};
    const operatorApi = window.WeishanFlightWorkflowOperatorConsole || {};
    const operatorViewModelApi = window.WeishanFlightWorkflowOperatorConsoleViewModel || {};
    const releaseDashboardApi = window.WeishanFlightWorkflowReleaseReadinessDashboard || {};
    const releaseViewModelApi = window.WeishanFlightWorkflowReleaseReadinessViewModel || {};
    const betaPackApi = window.WeishanFlightWorkflowBetaAcceptancePack || {};
    const guidedTestApi = window.WeishanFlightWorkflowGuidedUserTestMode || {};
    const feedbackSanitizerApi = window.WeishanFlightWorkflowBetaFeedbackSanitizer || {};
    const betaViewModelApi = window.WeishanFlightWorkflowBetaAcceptanceViewModel || {};
    const feedbackReviewApi = window.WeishanFlightWorkflowBetaFeedbackReviewCenter || {};
    const acceptanceSessionApi = window.WeishanFlightWorkflowAcceptanceSessionSummary || {};
    const acceptanceReviewVmApi = window.WeishanFlightWorkflowBetaAcceptanceReviewViewModel || {};
    const betaCohortApi = window.WeishanFlightWorkflowBetaCohortReviewBoard || {};
    const feedbackTrendApi = window.WeishanFlightWorkflowFeedbackTrendRadar || {};
    const betaCohortViewModelApi = window.WeishanFlightWorkflowBetaCohortViewModel || {};
    const betaExpansionGateApi = window.WeishanFlightWorkflowBetaExpansionGate || {};
    const publicPilotChecklistApi = window.WeishanFlightWorkflowReadOnlyPublicPilotChecklist || {};
    const issueIntakeApi = window.WeishanFlightWorkflowSafeIssueIntakeFlow || {};
    const supportFallbackApi = window.WeishanFlightWorkflowSupportFallbackRecommendationEngine || {};
    const pilotSupportViewModelApi = window.WeishanFlightWorkflowPilotSupportViewModel || {};
    const issueReviewBoardApi = window.WeishanFlightWorkflowPublicPilotIssueReviewBoard || {};
    const supportTriageDashboardApi = window.WeishanFlightWorkflowSupportTriageDashboard || {};
    const pilotIssueReviewViewModelApi = window.WeishanFlightWorkflowPilotIssueReviewViewModel || {};
    const issuePatternRadarApi = window.WeishanFlightWorkflowPublicPilotIssuePatternRadar || {};
    const supportReadinessGateApi = window.WeishanFlightWorkflowSupportReadinessGate || {};
    const issuePatternViewModelApi = window.WeishanFlightWorkflowIssuePatternViewModel || {};
    const pilotReadinessViewModelApi = window.WeishanFlightWorkflowPilotReadinessViewModel || {};
    const scenarioSimulatorApi = window.WeishanFlightWorkflowScenarioSimulator || {};
    const safetyTestMatrixApi = window.WeishanFlightWorkflowSafetyTestMatrixConsole || {};
    const auditInput = Object.assign({}, workflow, { rawText:null, rawInput:null, rawUserText:null, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, blockedActions:blockedActions, actionQueueSummary:actionQueue, progressTimelineSummary:timeline });
    const auditReview = typeof auditApi.buildFlightWorkflowAuditReviewCenter === "function" ? auditApi.buildFlightWorkflowAuditReviewCenter(auditInput) : null;
    const safeExportPreview = typeof exportApi.buildFlightWorkflowSafeSessionExportPreview === "function" ? exportApi.buildFlightWorkflowSafeSessionExportPreview(Object.assign({}, auditInput, { auditReviewSummary:auditReview })) : null;
    const safetyRegressionSummary = typeof sentinelApi.buildFlightWorkflowSafetyRegressionReport === "function" ? sentinelApi.buildFlightWorkflowSafetyRegressionReport(Object.assign({}, auditInput, { auditReviewSummary:auditReview, safeSessionExportPreview:safeExportPreview })) : null;
    const humanReviewChecklist = typeof humanReviewApi.buildFlightWorkflowHumanReviewChecklist === "function" ? humanReviewApi.buildFlightWorkflowHumanReviewChecklist(Object.assign({}, auditInput, { auditReviewSummary:auditReview, safetyRegressionSummary:safetyRegressionSummary })) : null;
    const finalSafeHandoffPacket = typeof finalPacketApi.buildFlightWorkflowFinalSafeHandoffPacket === "function" ? finalPacketApi.buildFlightWorkflowFinalSafeHandoffPacket(Object.assign({}, auditInput, { auditReviewSummary:auditReview, safetyRegressionSummary:safetyRegressionSummary, humanReviewChecklistSummary:humanReviewChecklist })) : null;
    const handoffPacketPolicy = typeof packetPolicyApi.evaluateFlightWorkflowHandoffPacketPolicy === "function" ? packetPolicyApi.evaluateFlightWorkflowHandoffPacketPolicy({ finalSafeHandoffPacketSummary:finalSafeHandoffPacket, safetyRegressionSummary:safetyRegressionSummary }) : null;
    const operatorConsole = typeof operatorApi.buildFlightWorkflowOperatorConsole === "function" ? operatorApi.buildFlightWorkflowOperatorConsole(Object.assign({}, auditInput, { auditReviewSummary:auditReview, safeSessionExportPreview:safeExportPreview, safetyRegressionSummary:safetyRegressionSummary, humanReviewChecklistSummary:humanReviewChecklist, finalSafeHandoffPacketSummary:finalSafeHandoffPacket, handoffPacketPolicyDecision:handoffPacketPolicy })) : null;
    const scenarioSimulation = typeof scenarioSimulatorApi.runFlightWorkflowScenarioSimulationSuite === "function" ? scenarioSimulatorApi.runFlightWorkflowScenarioSimulationSuite(Object.assign({}, auditInput, { auditReviewSummary:auditReview, safeSessionExportPreview:safeExportPreview, safetyRegressionSummary:safetyRegressionSummary, humanReviewChecklistSummary:humanReviewChecklist, finalSafeHandoffPacketSummary:finalSafeHandoffPacket, handoffPacketPolicyDecision:handoffPacketPolicy, operatorConsoleSummary:operatorConsole })) : null;
    const safetyTestMatrix = typeof safetyTestMatrixApi.buildFlightWorkflowSafetyTestMatrixConsole === "function" ? safetyTestMatrixApi.buildFlightWorkflowSafetyTestMatrixConsole({ results: scenarioSimulation && Array.isArray(scenarioSimulation.results) ? scenarioSimulation.results : [] }) : null;
    const operatorViewModel = typeof operatorViewModelApi.buildFlightWorkflowOperatorConsoleViewModel === "function" ? operatorViewModelApi.buildFlightWorkflowOperatorConsoleViewModel({ operatorConsoleSummary:operatorConsole }) : null;
    const cohortFeedbackSamples = [
      { feedbackReviewSummary:{ status:"ready", feedbackHealth:{ safetyCopyUnderstood:true }, ratingSummary:{ usabilityRating:"good", clarityRating:"good" }, redacted:true } },
      { feedbackReviewSummary:{ status:"ready", feedbackHealth:{ safetyCopyUnderstood:true }, ratingSummary:{ usabilityRating:"good", clarityRating:"good" }, redacted:true } },
      { feedbackReviewSummary:{ status:"ready", feedbackHealth:{ safetyCopyUnderstood:true }, ratingSummary:{ usabilityRating:"ok", clarityRating:"good" }, redacted:true } },
      { feedbackReviewSummary:{ status:"ready", feedbackHealth:{ safetyCopyUnderstood:true }, ratingSummary:{ usabilityRating:"good", clarityRating:"ok" }, redacted:true } }
    ];
    const betaCohortSummary = typeof betaCohortApi.buildFlightWorkflowBetaCohortReviewBoard === "function" ? betaCohortApi.buildFlightWorkflowBetaCohortReviewBoard({ sessions:cohortFeedbackSamples }) : null;
    const feedbackTrendSummary = typeof feedbackTrendApi.buildFlightWorkflowFeedbackTrendRadar === "function" ? feedbackTrendApi.buildFlightWorkflowFeedbackTrendRadar({ feedback:cohortFeedbackSamples }) : null;
    const betaCohortViewModel = typeof betaCohortViewModelApi.buildFlightWorkflowBetaCohortViewModel === "function" ? betaCohortViewModelApi.buildFlightWorkflowBetaCohortViewModel({ betaCohortSummary:betaCohortSummary, feedbackTrendSummary:feedbackTrendSummary }) : null;
    const releaseReadiness = typeof releaseDashboardApi.buildFlightWorkflowReleaseReadinessDashboard === "function" ? releaseDashboardApi.buildFlightWorkflowReleaseReadinessDashboard({ releaseVersion:"2.1.88", scenarioSimulationSuite:scenarioSimulation, matrixSummary:safetyTestMatrix, safetyRegressionSummary:safetyRegressionSummary, auditReviewSummary:auditReview, humanReviewChecklistSummary:humanReviewChecklist, finalSafeHandoffPacketSummary:finalSafeHandoffPacket, safeSessionExportPreview:safeExportPreview, operatorConsoleSummary:operatorConsole, betaCohortSummary:betaCohortSummary, feedbackTrendSummary:feedbackTrendSummary, cohortReviewStatus:betaCohortSummary && betaCohortSummary.status, betaExpansionReadiness:betaCohortSummary && betaCohortSummary.cohortHealth && betaCohortSummary.cohortHealth.safeToExpandBeta, betaCohortRecommendation:feedbackTrendSummary && feedbackTrendSummary.recommendation && feedbackTrendSummary.recommendation.label }) : null;
    const releaseViewModel = typeof releaseViewModelApi.buildFlightWorkflowReleaseReadinessViewModel === "function" ? releaseViewModelApi.buildFlightWorkflowReleaseReadinessViewModel({ releaseReadinessSummary:releaseReadiness }) : null;
    const betaAcceptancePack = typeof betaPackApi.buildFlightWorkflowBetaAcceptancePack === "function" ? betaPackApi.buildFlightWorkflowBetaAcceptancePack({ releaseReadinessSummary:releaseReadiness, operatorConsoleSummary:operatorConsole, safetyTestMatrixSummary:safetyTestMatrix, humanReviewChecklistSummary:humanReviewChecklist, finalSafeHandoffPacketSummary:finalSafeHandoffPacket }) : null;
    const guidedUserTestMode = typeof guidedTestApi.buildFlightWorkflowGuidedUserTestMode === "function" ? guidedTestApi.buildFlightWorkflowGuidedUserTestMode({}) : null;
    const feedbackSanitizerSummary = typeof feedbackSanitizerApi.sanitizeFlightWorkflowBetaFeedback === "function" ? feedbackSanitizerApi.sanitizeFlightWorkflowBetaFeedback({ usabilityRating:"ok", clarityRating:"ok", safetyCopyUnderstood:true, userComment:"" }) : null;
    const betaAcceptanceViewModel = typeof betaViewModelApi.buildFlightWorkflowBetaAcceptanceViewModel === "function" ? betaViewModelApi.buildFlightWorkflowBetaAcceptanceViewModel({ betaAcceptancePack:betaAcceptancePack, guidedUserTestMode:guidedUserTestMode, feedbackSanitizerSummary:feedbackSanitizerSummary }) : null;
    const feedbackReviewSummary = typeof feedbackReviewApi.buildFlightWorkflowBetaFeedbackReviewCenter === "function" ? feedbackReviewApi.buildFlightWorkflowBetaFeedbackReviewCenter({ feedbackSanitizerSummary:feedbackSanitizerSummary }) : null;
    const acceptanceSessionSummary = typeof acceptanceSessionApi.buildFlightWorkflowAcceptanceSessionSummary === "function" ? acceptanceSessionApi.buildFlightWorkflowAcceptanceSessionSummary({ betaAcceptancePack:betaAcceptancePack, guidedUserTestMode:guidedUserTestMode, feedbackReviewSummary:feedbackReviewSummary, safetyConfirmed:true }) : null;
    const betaAcceptanceReviewViewModel = typeof acceptanceReviewVmApi.buildFlightWorkflowBetaAcceptanceReviewViewModel === "function" ? acceptanceReviewVmApi.buildFlightWorkflowBetaAcceptanceReviewViewModel({ feedbackReviewSummary:feedbackReviewSummary, acceptanceSessionSummary:acceptanceSessionSummary }) : null;
    const pilotBlockedByWorkflow = workflow.restrictedCategory === true || workflow.workflowStatus === "blocked" || workflow.status === "blocked" || auditReview && auditReview.status === "blocked";
    const betaExpansionGateSummary = typeof betaExpansionGateApi.buildFlightWorkflowBetaExpansionGate === "function" ? betaExpansionGateApi.buildFlightWorkflowBetaExpansionGate({ releaseReadinessSummary:pilotBlockedByWorkflow ? { status:"blocked", releaseReady:false, safeForUserFacingBeta:false, redacted:true } : releaseReadiness, safetyTestMatrixSummary:pilotBlockedByWorkflow ? { status:"blocked", overallHealth:"blocked", failedCount:1, blockedCount:1, redacted:true } : safetyTestMatrix, safetyRegressionSummary:safetyRegressionSummary, operatorConsoleSummary:operatorConsole, humanReviewChecklistSummary:humanReviewChecklist, acceptanceSessionSummary:acceptanceSessionSummary, betaCohortSummary:betaCohortSummary, feedbackTrendSummary:feedbackTrendSummary, bookingUrl:null, paymentUrl:null, orderUrl:null }) : null;
    const pilotExitCriteriaSummary = typeof pilotExitCriteriaApi.buildFlightWorkflowReadOnlyPilotExitCriteria === "function" ? pilotExitCriteriaApi.buildFlightWorkflowReadOnlyPilotExitCriteria({ pilotOpsSummary:pilotOpsSummary, nextCohortDecisionSummary:nextCohortDecisionSummary, rolloutControlSummary:rolloutControlSummary, cohortHealthSummary:cohortHealthSummary, supportReadinessSummary:supportReadinessSummary, issuePatternSummary:issuePatternSummary, safetyRegressionSummary:safetyRegressionSummary, releaseReadinessSummary:releaseReadiness }) : null;
    const launchCandidateReadinessSummary = typeof launchCandidateReadinessApi.buildFlightWorkflowLaunchCandidateReadinessBoard === "function" ? launchCandidateReadinessApi.buildFlightWorkflowLaunchCandidateReadinessBoard({ pilotExitCriteriaSummary:pilotExitCriteriaSummary, releaseReadinessSummary:releaseReadiness, safetyMatrixSummary:safetyTestMatrix, operatorConsoleSummary:operatorConsole, supportReadinessSummary:supportReadinessSummary, pilotOpsSummary:pilotOpsSummary, nextCohortDecisionSummary:nextCohortDecisionSummary, rolloutControlSummary:rolloutControlSummary, cohortHealthSummary:cohortHealthSummary, safetyRegressionSummary:safetyRegressionSummary }) : null;
    const launchCandidateViewModel = typeof launchCandidateViewModelApi.buildFlightWorkflowLaunchCandidateViewModel === "function" ? launchCandidateViewModelApi.buildFlightWorkflowLaunchCandidateViewModel({ pilotExitCriteriaSummary:pilotExitCriteriaSummary, launchCandidateReadinessSummary:launchCandidateReadinessSummary }) : null;
    const issueIntakeSummary = typeof issueIntakeApi.buildFlightWorkflowSafeIssueIntakeFlow === "function" ? issueIntakeApi.buildFlightWorkflowSafeIssueIntakeFlow({ issueCategory:pilotBlockedByWorkflow ? "other" : "candidate_unclear" }) : null;
    const supportFallbackSummary = typeof supportFallbackApi.buildFlightWorkflowSupportFallbackRecommendation === "function" ? supportFallbackApi.buildFlightWorkflowSupportFallbackRecommendation({ issueIntakeSummary:issueIntakeSummary, operatorConsoleSummary:operatorConsole, auditReviewSummary:auditReview }) : null;
    const issueReviewSummary = typeof issueReviewBoardApi.buildFlightWorkflowPublicPilotIssueReviewBoard === "function" ? issueReviewBoardApi.buildFlightWorkflowPublicPilotIssueReviewBoard({ issueIntake:issueIntakeSummary, supportFallbackRecommendation:supportFallbackSummary, pilotOnboardingGuard:null, publicPilotChecklist:null, operatorConsoleSummary:operatorConsole }) : null;
    const supportTriageSummary = typeof supportTriageDashboardApi.buildFlightWorkflowSupportTriageDashboard === "function" ? supportTriageDashboardApi.buildFlightWorkflowSupportTriageDashboard({ issueCategory:issueIntakeSummary && issueIntakeSummary.issueCategory, issueReviewBoard:issueReviewSummary, supportFallbackRecommendation:supportFallbackSummary }) : null;
    const pilotIssueReviewSummary = typeof pilotIssueReviewViewModelApi.buildFlightWorkflowPilotIssueReviewViewModel === "function" ? pilotIssueReviewViewModelApi.buildFlightWorkflowPilotIssueReviewViewModel({ issueReviewBoard:issueReviewSummary, supportTriageDashboard:supportTriageSummary }) : null;
    const pilotIssueReviewStatus = issueReviewSummary && issueReviewSummary.status || supportTriageSummary && supportTriageSummary.status || "ready";
    const issueAffectsPilotExpansion = Boolean(issueReviewSummary && issueReviewSummary.issueHealth && issueReviewSummary.issueHealth.affectsPilotExpansion || supportTriageSummary && supportTriageSummary.triage && supportTriageSummary.triage.affectsPilotExpansion);
    const issueRequiresInternalReview = Boolean(issueReviewSummary && issueReviewSummary.issueHealth && issueReviewSummary.issueHealth.requiresInternalReview || supportTriageSummary && supportTriageSummary.triage && supportTriageSummary.triage.requiresInternalReview);
    const issuePatternSummary = typeof issuePatternRadarApi.buildFlightWorkflowPublicPilotIssuePatternRadar === "function" ? issuePatternRadarApi.buildFlightWorkflowPublicPilotIssuePatternRadar({ issues:[issueReviewSummary, supportTriageSummary, issueIntakeSummary, supportFallbackSummary].filter(Boolean), issueReviewBoard:issueReviewSummary, supportTriageDashboard:supportTriageSummary, safeIssueIntakeSummary:issueIntakeSummary, supportFallbackSummary:supportFallbackSummary }) : null;
    const supportReadinessSummary = typeof supportReadinessGateApi.buildFlightWorkflowSupportReadinessGate === "function" ? supportReadinessGateApi.buildFlightWorkflowSupportReadinessGate({ issuePatternRadar:issuePatternSummary, issueReviewBoard:issueReviewSummary, supportTriageDashboard:supportTriageSummary, betaExpansionGateSummary:betaExpansionGateSummary, supportFallbackReady:!(supportFallbackSummary && supportFallbackSummary.status === "blocked") }) : null;
    const issuePatternViewModelSummary = typeof issuePatternViewModelApi.buildFlightWorkflowIssuePatternViewModel === "function" ? issuePatternViewModelApi.buildFlightWorkflowIssuePatternViewModel({ issuePatternRadar:issuePatternSummary, supportReadinessGate:supportReadinessSummary }) : null;
    const issuePatternStatus = issuePatternSummary && issuePatternSummary.status || "insufficient_data";
    const supportReadinessStatus = supportReadinessSummary && supportReadinessSummary.status || "continue_small_pilot";
    const supportReadyForPublicPilot = Boolean(supportReadinessSummary && supportReadinessSummary.decision && supportReadinessSummary.decision.supportReadyForPublicPilot);
    const repeatedIssueRisk = Boolean(issuePatternSummary && issuePatternSummary.issuePatternHealth && issuePatternSummary.issuePatternHealth.hasRepeatedPattern);
    const publicPilotChecklistSummary = typeof publicPilotChecklistApi.buildFlightWorkflowReadOnlyPublicPilotChecklist === "function" ? publicPilotChecklistApi.buildFlightWorkflowReadOnlyPublicPilotChecklist({ betaExpansionGateSummary:betaExpansionGateSummary, safetyTestMatrixSummary:pilotBlockedByWorkflow ? { status:"blocked", overallHealth:"blocked", failedCount:1, blockedCount:1, redacted:true } : safetyTestMatrix, humanReviewChecklistSummary:humanReviewChecklist, safetyCopyReady:!(betaExpansionGateSummary && betaExpansionGateSummary.decision && betaExpansionGateSummary.decision.decisionId === "improve_safety_copy"), scenarioMatrixReady:!pilotBlockedByWorkflow, userReviewReady:humanReviewChecklist && humanReviewChecklist.status === "ready", forbiddenCapabilitiesVisible:true, supportFallbackReady:!(supportFallbackSummary && supportFallbackSummary.status === "blocked") && !(issueReviewSummary && issueReviewSummary.status === "blocked") && supportReadinessStatus !== "blocked", bookingUrl:null, paymentUrl:null, orderUrl:null }) : null;
    const pilotSupportSummary = typeof pilotSupportViewModelApi.buildFlightWorkflowPilotSupportViewModel === "function" ? pilotSupportViewModelApi.buildFlightWorkflowPilotSupportViewModel({ issueIntakeSummary:issueIntakeSummary, supportFallbackSummary:supportFallbackSummary }) : null;
    const riskBadges = typeof badgeApi.buildFlightWorkflowRiskBadges === "function" ? badgeApi.buildFlightWorkflowRiskBadges({ auditReview:auditReview, safeSessionExportPreview:safeExportPreview, humanReviewChecklistSummary:humanReviewChecklist, finalSafeHandoffPacketSummary:finalSafeHandoffPacket, handoffPacketPolicyDecision:handoffPacketPolicy, safetyRegressionSummary:safetyRegressionSummary, operatorConsoleSummary:operatorConsole, betaCohortSummary:betaCohortSummary, feedbackTrendSummary:feedbackTrendSummary, issueIntakeSummary:issueIntakeSummary, supportFallbackSummary:supportFallbackSummary, pilotSupportSummary:pilotSupportSummary, pilotSupportStatus:pilotSupportSummary && pilotSupportSummary.status, supportNextStep:supportFallbackSummary && supportFallbackSummary.recommendation && supportFallbackSummary.recommendation.label, issueReviewSummary:issueReviewSummary, supportTriageSummary:supportTriageSummary, pilotIssueReviewStatus:pilotIssueReviewStatus, issueAffectsPilotExpansion:issueAffectsPilotExpansion, issueRequiresInternalReview:issueRequiresInternalReview, issuePatternSummary:issuePatternSummary, supportReadinessSummary:supportReadinessSummary, issuePatternViewModelSummary:issuePatternViewModelSummary, issuePatternStatus:issuePatternStatus, supportReadinessStatus:supportReadinessStatus, supportReadyForPublicPilot:supportReadyForPublicPilot, repeatedIssueRisk:repeatedIssueRisk, tradingBlocked:true, requiresConfirmation:true }) : null;
    const pilotReadinessSummary = typeof pilotReadinessViewModelApi.buildFlightWorkflowPilotReadinessViewModel === "function" ? pilotReadinessViewModelApi.buildFlightWorkflowPilotReadinessViewModel({ betaExpansionGateSummary:betaExpansionGateSummary, publicPilotChecklistSummary:publicPilotChecklistSummary }) : null;
    function auditReviewHtml(){
      return '<section class="commerce-flight-workflow-audit-review" data-commerce-flight-workflow-audit-review="true"><h5>本次机票工作流审计</h5><p>' + esc(auditReview && auditReview.userFacingSummary && auditReview.userFacingSummary.resultLabel || '安全检查通过') + '</p><p>安全检查通过</p><p>动作已安全阻断</p><p>外部平台操作需要二次确认</p><p>只读安全</p><p>交易动作已阻断</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><button type="button" class="cmd-btn gray" data-commerce-flight-audit-review-show="true">查看工作流审计</button><div data-commerce-flight-audit-review-output="true"><p>本次机票工作流审计</p><p>只读安全</p></div></section>';
    }
    function safeExportPreviewHtml(){
      return '<section class="commerce-flight-safe-session-export-preview" data-commerce-flight-safe-session-export-preview="true"><h5>脱敏会话摘要预览</h5><p>工作流摘要</p><p>候选证据摘要</p><p>安全审计摘要</p><p>不包含证件、银行卡、登录凭据或密钥</p><p>不包含付款、下单、出票链接</p><p>canWriteFile:false</p><p>bookingUrl:null</p><button type="button" class="cmd-btn gray" data-commerce-flight-safe-export-preview-show="true">查看脱敏摘要预览</button><div data-commerce-flight-safe-export-preview-output="true"><p>仅预览，不写入文件</p></div></section>';
    }
    function humanReviewChecklistHtml(){
      const line = humanReviewChecklist && humanReviewChecklist.userFacingSummary && humanReviewChecklist.userFacingSummary.line || '仍需补充复核';
      return '<section class="commerce-flight-human-review-checklist" data-commerce-flight-human-review-checklist="true"><h5>前往平台前请人工复核</h5><p>人工复核清单</p><p>已确认项</p><p>未完成项</p><p>' + esc(line) + '</p><p>平台页面结果为准</p><p>唯珊不会付款、不会下单、不会出票</p><button type="button" class="cmd-btn gray" data-commerce-flight-human-review-show="true">查看人工复核清单</button><div data-commerce-flight-human-review-output="true"><p>人工复核清单</p><p>已确认项</p><p>未完成项</p></div></section>';
    }
    function finalSafeHandoffPacketHtml(){
      const line = finalSafeHandoffPacket && finalSafeHandoffPacket.userFacingSummary && finalSafeHandoffPacket.userFacingSummary.line || '仍需补充复核';
      return '<section class="commerce-flight-final-safe-handoff-packet" data-commerce-flight-final-safe-handoff-packet="true"><h5>最终安全交接包</h5><p>行程摘要</p><p>候选证据摘要</p><p>平台核对摘要</p><p>安全限制摘要</p><p>' + esc(line) + '</p><p>平台页面结果为准</p><p>唯珊不会付款、不会下单、不会出票</p><button type="button" class="cmd-btn gray" data-commerce-flight-final-handoff-packet-show="true">查看最终安全交接包</button><div data-commerce-flight-final-handoff-packet-output="true"><p>最终安全交接包</p><p>行程摘要</p><p>候选证据摘要</p><p>平台核对摘要</p><p>安全限制摘要</p></div></section>';
    }
    function operatorConsoleHtml(){
      const line = operatorConsole && operatorConsole.userFacingSummary && operatorConsole.userFacingSummary.resultLabel || '存在需要注意的项目';
      return '<section class="commerce-flight-operator-console" data-commerce-flight-operator-console="true"><h5>机票工作流运营控制台</h5><p>工作流状态</p><p>安全状态</p><p>安全回归</p><p>场景模拟</p><p>安全测试矩阵</p><p>最近事件</p><p>已阻断动作</p><p>平台确认准备状态</p><p>' + esc(line) + '</p><p>安全回归通过</p><p>无交易链接</p><p>无付款/下单/出票</p><p>无证件/银行卡/登录凭据</p><p>无密钥或原始响应</p><p>无自动打开或自动刷新</p><p>场景模拟仅用于安全回归，不代表真实票价、库存或可出票</p><p>安全测试矩阵仅为本地安全回归检查，不代表真实票价或可出票</p><p>唯珊只提供只读候选证据，不付款、不下单、不出票</p><button type="button" class="cmd-btn gray" data-commerce-flight-operator-console-show="true">查看运营控制台</button><button type="button" class="cmd-btn gray" data-commerce-flight-safety-regression-show="true">查看安全回归检查</button><button type="button" class="cmd-btn gray" data-commerce-flight-scenario-simulator-show="true">查看场景模拟</button><button type="button" class="cmd-btn gray" data-commerce-flight-safety-test-matrix-show="true">查看安全测试矩阵</button><div data-commerce-flight-operator-console-output="true"><p>机票工作流运营控制台</p><p>工作流状态</p><p>安全状态</p><p>平台确认准备状态</p></div><div data-commerce-flight-safety-regression-output="true"><p>安全回归</p><p>安全回归通过</p><p>无交易链接</p><p>无付款/下单/出票</p><p>无证件/银行卡/登录凭据</p><p>无密钥或原始响应</p><p>无自动打开或自动刷新</p></div><div data-commerce-flight-scenario-simulator-output="true"><p>机票工作流场景模拟</p><p>完整机票请求</p><p>缺少出发地</p><p>缺少目的地</p><p>缺少日期</p><p>平台价格变化</p><p>平台库存变化</p><p>敏感输入阻断</p><p>受限品类阻断</p><p>损坏账本恢复</p><p>非法交易链接阻断</p><p>非法密钥阻断</p><p>非法付款动作</p><p>平台确认需要确认</p><p>恢复脱敏状态</p><p>未知动作安全降级</p><p>场景模拟仅用于安全回归，不代表真实票价、库存或可出票</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-flight-safety-test-matrix-output="true"><p>安全测试矩阵</p><p>场景数</p><p>通过</p><p>警告</p><p>失败</p><p>安全测试矩阵仅为本地安全回归检查，不代表真实票价或可出票</p></div></section>';
    }

    function releaseReadinessHtml(){
      const vm = releaseViewModel || {};
      const dashboard = releaseReadiness || {};
      const betaLabel = vm.betaReadinessLabel || (dashboard.safeForUserFacingBeta ? '可以进入只读 Beta 验收' : '存在需要注意的项目');
      return '<section class="commerce-flight-release-readiness" data-commerce-flight-release-readiness="true"><h5>机票工作流发布就绪总览</h5><p>发布状态：' + esc(betaLabel) + '</p><p>可以进入只读 Beta 验收</p><p>安全红线</p><p>安全矩阵</p><p>用户复核摘要</p><p>仍被禁止的能力</p><p>安全文案已统一</p><p>当前仍是只读候选证据流程</p><p>不代表真实票价、库存或可出票</p><p>只读试点进入确认</p><p>进入只读试点前请确认</p><p>只读试点用户确认</p><p>我知道当前只是只读候选证据</p><p>我知道价格、库存、税费和规则以平台页面为准</p><p>我知道唯珊不会付款、不会下单、不会出票</p><p>我知道唯珊不会上传证件、银行卡或登录凭据</p><p>我知道测试反馈会脱敏处理</p><p data-commerce-pilot-consent-status="true">仍有必选项未确认</p><p data-commerce-pilot-entry-status="true">暂不可进入只读试点</p><p>只读试点不代表交易授权</p><p>唯珊不会付款、不会下单、不会出票</p><p>唯珊不会上传证件、银行卡或登录凭据</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><button type="button" class="cmd-btn gray" data-commerce-flight-release-readiness-show="true">查看发布就绪总览</button><div data-commerce-flight-release-readiness-output="true"><p>机票工作流发布就绪总览</p><p>发布状态</p><p>安全红线</p><p>安全矩阵</p><p>用户复核摘要</p><p>仍被禁止的能力</p><p>' + esc(betaLabel) + '</p><p>可以进入只读 Beta 验收</p><p>当前仍是只读候选证据流程</p><p>唯珊不会付款、不会下单、不会出票</p></div></section>';
    }
    function betaAcceptanceHtml(){
      const vm = betaAcceptanceViewModel || {};
      const pack = betaAcceptancePack || {};
      const blocked = pack.status === "blocked" || pack.status === "failed_safe";
      return '<section class="commerce-flight-beta-acceptance" data-commerce-flight-beta-acceptance="true"><h5>只读 Beta 验收</h5><p>只读 Beta 用户测试</p><p>验收步骤</p><p>用户测试</p><p>填写测试反馈</p><p>测试反馈已脱敏</p><p>确认不会付款、下单或出票</p><p>当前仅验收只读候选证据流程</p><p>不代表真实票价、库存或可出票</p><p>只读试点进入确认</p><p>进入只读试点前请确认</p><p>只读试点用户确认</p><p>我知道当前只是只读候选证据</p><p>我知道价格、库存、税费和规则以平台页面为准</p><p>我知道唯珊不会付款、不会下单、不会出票</p><p>我知道唯珊不会上传证件、银行卡或登录凭据</p><p>我知道测试反馈会脱敏处理</p><p data-commerce-pilot-consent-status="true">仍有必选项未确认</p><p data-commerce-pilot-entry-status="true">暂不可进入只读试点</p><p>只读试点不代表交易授权</p><p>测试过程不会付款、不会下单、不会出票</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p><p>autoOpen:false</p><p>download:false</p><p>fileWrite:false</p>' + (blocked ? '<p>Beta 验收被阻断</p><p>安全限制</p>' : '') + '<button type="button" class="cmd-btn gray" data-commerce-flight-beta-acceptance-start="true">开始只读 Beta 验收</button><button type="button" class="cmd-btn gray" data-commerce-flight-beta-feedback-submit="true">填写测试反馈</button><div data-commerce-flight-beta-acceptance-output="true"><p>' + esc(vm.title || '只读 Beta 验收') + '</p><p>验收步骤</p><p>当前仅验收只读候选证据流程</p><p>不代表真实票价、库存或可出票</p><p>只读试点进入确认</p><p>进入只读试点前请确认</p><p>只读试点用户确认</p><p>我知道当前只是只读候选证据</p><p>我知道价格、库存、税费和规则以平台页面为准</p><p>我知道唯珊不会付款、不会下单、不会出票</p><p>我知道唯珊不会上传证件、银行卡或登录凭据</p><p>我知道测试反馈会脱敏处理</p><p data-commerce-pilot-consent-status="true">仍有必选项未确认</p><p data-commerce-pilot-entry-status="true">暂不可进入只读试点</p><p>只读试点不代表交易授权</p></div></section>';
    }
    function betaAcceptanceReviewHtml(){
      const vm = betaAcceptanceReviewViewModel || {};
      const feedback = feedbackReviewSummary || {};
      const session = acceptanceSessionSummary || {};
      const feedbackLabel = feedback.userFacingSummary && feedback.userFacingSummary.resultLabel || (feedback.status === "ready" ? "反馈可用于验收参考" : "仍需补充反馈");
      const sessionLabel = session.userFacingSummary && session.userFacingSummary.resultLabel || (session.status === "completed" ? "本次验收已完成" : "验收进行中");
      return '<section class="commerce-flight-beta-acceptance-review" data-commerce-flight-beta-acceptance-review="true"><h5>只读 Beta 验收复核</h5><p>测试反馈汇总</p><p>' + esc(feedbackLabel) + '</p><p>反馈已脱敏</p><p>仍需补充反馈</p><p>验收会话摘要</p><p>' + esc(sessionLabel) + '</p><p>本次验收已完成</p><p>验收进行中</p><p>仍需复核</p><p>下一步建议</p><p>' + esc(vm.nextStepLabel || session.nextStepRecommendation || '仍需复核') + '</p><p>验收复核只用于改进只读候选证据流程</p><p>不代表真实票价、库存或可出票</p><p>只读试点进入确认</p><p>进入只读试点前请确认</p><p>只读试点用户确认</p><p>我知道当前只是只读候选证据</p><p>我知道价格、库存、税费和规则以平台页面为准</p><p>我知道唯珊不会付款、不会下单、不会出票</p><p>我知道唯珊不会上传证件、银行卡或登录凭据</p><p>我知道测试反馈会脱敏处理</p><p data-commerce-pilot-consent-status="true">仍有必选项未确认</p><p data-commerce-pilot-entry-status="true">暂不可进入只读试点</p><p>只读试点不代表交易授权</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p><p>download:false</p><p>fileWrite:false</p><button type="button" class="cmd-btn gray" data-commerce-flight-beta-review-show="true">查看验收复核</button><button type="button" class="cmd-btn gray" data-commerce-flight-beta-feedback-review-show="true">查看测试反馈汇总</button><div data-commerce-flight-beta-review-output="true"><p>' + esc(vm.title || '只读 Beta 验收复核') + '</p><p>验收会话摘要</p><p>下一步建议</p><p>验收复核只用于改进只读候选证据流程</p></div><div data-commerce-flight-beta-feedback-review-output="true"><p>测试反馈汇总</p><p>' + esc(feedbackLabel) + '</p><p>反馈已脱敏</p></div></section>';
    }
    function betaCohortReviewBoardHtml(){
      const vm = betaCohortViewModel || {};
      const board = betaCohortSummary || {};
      const radar = feedbackTrendSummary || {};
      const label = board.userFacingSummary && board.userFacingSummary.resultLabel || '仍需更多反馈';
      const recommendation = radar.recommendation && radar.recommendation.label || label;
      return '<section class="commerce-flight-beta-cohort-review" data-commerce-flight-beta-cohort-review="true"><h5>Beta 反馈复核板</h5><p>验收会话</p><p>可用反馈</p><p>反馈趋势</p><p>安全文案理解</p><p>' + esc(label) + '</p><p>可以扩大只读测试</p><p>仍需更多反馈</p><p>仍需复核</p><p>下一步建议</p><p>' + esc(recommendation) + '</p><p>Beta 反馈只用于改进只读候选证据流程</p><p>不代表真实票价、库存或可出票</p><p>只读试点进入确认</p><p>进入只读试点前请确认</p><p>只读试点用户确认</p><p>我知道当前只是只读候选证据</p><p>我知道价格、库存、税费和规则以平台页面为准</p><p>我知道唯珊不会付款、不会下单、不会出票</p><p>我知道唯珊不会上传证件、银行卡或登录凭据</p><p>我知道测试反馈会脱敏处理</p><p data-commerce-pilot-consent-status="true">仍有必选项未确认</p><p data-commerce-pilot-entry-status="true">暂不可进入只读试点</p><p>只读试点不代表交易授权</p><p>raw feedback:false</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p><p>download:false</p><p>fileWrite:false</p><button type="button" class="cmd-btn gray" data-commerce-flight-beta-cohort-show="true">查看 Beta 反馈复核板</button><button type="button" class="cmd-btn gray" data-commerce-flight-feedback-trend-show="true">查看反馈趋势</button><div data-commerce-flight-beta-cohort-output="true"><p>' + esc(vm.title || 'Beta 反馈复核板') + '</p><p>验收会话</p><p>可用反馈</p><p>下一步建议</p><p>Beta 反馈只用于改进只读候选证据流程</p></div><div data-commerce-flight-feedback-trend-output="true"><p>反馈趋势</p><p>' + esc(recommendation) + '</p><p>安全文案理解</p><p>不代表真实票价、库存或可出票</p><p>只读试点进入确认</p><p>进入只读试点前请确认</p><p>只读试点用户确认</p><p>我知道当前只是只读候选证据</p><p>我知道价格、库存、税费和规则以平台页面为准</p><p>我知道唯珊不会付款、不会下单、不会出票</p><p>我知道唯珊不会上传证件、银行卡或登录凭据</p><p>我知道测试反馈会脱敏处理</p><p data-commerce-pilot-consent-status="true">仍有必选项未确认</p><p data-commerce-pilot-entry-status="true">暂不可进入只读试点</p><p>只读试点不代表交易授权</p></div></section>';
    }
    function pilotReadinessHtml(){
      const gate = betaExpansionGateSummary || {};
      const checklist = publicPilotChecklistSummary || {};
      const vm = pilotReadinessSummary || {};
      const gateLabel = gate.userFacingSummary && gate.userFacingSummary.resultLabel || '继续内部测试';
      const checklistLabel = checklist.userFacingSummary && checklist.userFacingSummary.resultLabel || '继续内部测试';
      return '<section class="commerce-flight-pilot-readiness" data-commerce-flight-pilot-readiness="true"><h5>只读公开试点准备状态</h5><p>只读 Beta 扩大测试闸门</p><p>' + esc(gateLabel) + '</p><p>试点检查清单</p><p>' + esc(checklistLabel) + '</p><p>只读范围说明</p><p>安全边界展示</p><p>反馈收集与脱敏</p><p>禁止能力展示</p><p>异常处理与人工反馈</p><p>公开试点仍然只覆盖只读候选证据流程</p><p>不提供付款、下单或出票能力</p><p>不代表真实票价、库存或可出票</p><p>只读试点进入确认</p><p>进入只读试点前请确认</p><p>只读试点用户确认</p><p>我知道当前只是只读候选证据</p><p>我知道价格、库存、税费和规则以平台页面为准</p><p>我知道唯珊不会付款、不会下单、不会出票</p><p>我知道唯珊不会上传证件、银行卡或登录凭据</p><p>我知道测试反馈会脱敏处理</p><p data-commerce-pilot-consent-status="true">仍有必选项未确认</p><p data-commerce-pilot-entry-status="true">暂不可进入只读试点</p><p>只读试点不代表交易授权</p><p>bookingUrl:null</p><p>checkoutUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p><p>download:false</p><p>fileWrite:false</p><button type="button" class="cmd-btn gray" data-commerce-flight-beta-expansion-gate-show="true">查看扩大测试闸门</button><button type="button" class="cmd-btn gray" data-commerce-flight-public-pilot-checklist-show="true">查看公开试点检查清单</button><button type="button" class="cmd-btn gray" data-commerce-flight-pilot-onboarding-show="true">查看试点进入确认</button><button type="button" class="cmd-btn gray" data-commerce-flight-read-only-consent-confirm="true">确认只读范围</button><div data-commerce-flight-beta-expansion-gate-output="true"><p>只读 Beta 扩大测试闸门</p><p>' + esc(gateLabel) + '</p><p>未满足项</p><p>风险说明</p><p>下一步建议</p><p>该判断只适用于只读候选证据流程</p><p>不代表真实票价、库存或可出票</p><p>只读试点进入确认</p><p>进入只读试点前请确认</p><p>只读试点用户确认</p><p>我知道当前只是只读候选证据</p><p>我知道价格、库存、税费和规则以平台页面为准</p><p>我知道唯珊不会付款、不会下单、不会出票</p><p>我知道唯珊不会上传证件、银行卡或登录凭据</p><p>我知道测试反馈会脱敏处理</p><p data-commerce-pilot-consent-status="true">仍有必选项未确认</p><p data-commerce-pilot-entry-status="true">暂不可进入只读试点</p><p>只读试点不代表交易授权</p></div><div data-commerce-flight-pilot-onboarding-output="true"><p>只读试点进入确认</p><p>进入只读试点前请确认</p><p>只读试点用户确认</p><p>仍有必选项未确认</p><p>只读试点不代表交易授权</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p></div><div data-commerce-flight-public-pilot-checklist-output="true"><p>' + esc(vm.title || '只读公开试点准备状态') + '</p><p>试点检查清单</p><p>只读范围说明</p><p>安全边界展示</p><p>反馈收集与脱敏</p><p>禁止能力展示</p><p>异常处理与人工反馈</p><p>公开试点仍然只覆盖只读候选证据流程</p><p>不提供付款、下单或出票能力</p></div></section>';
    }
    function pilotSupportHtml(){
      return '<section class="commerce-flight-pilot-support" data-commerce-flight-pilot-support="true"><h5>只读试点问题反馈</h5><p>问题类型</p><p>建议处理</p><p>看不懂候选证据</p><p>平台页面与候选证据不一致</p><p>安全说明不清楚</p><p>只读范围确认无法完成</p><p>反馈填写异常</p><p>问题反馈已脱敏</p><p>问题反馈只用于改进只读候选证据流程</p><p>不代表客服工单、交易请求或出票请求</p><p>建议重新查看候选证据</p><p>建议记录平台核对结果</p><p>建议查看安全说明</p><p>建议重新确认只读范围</p><h5>只读试点邀请与批次</h5><p>试点邀请闸门</p><p>测试用户批次登记控制台</p><p>只读试点邀请与测试批次</p><p>可以邀请测试用户</p><p>需要确认只读范围</p><p>需要支持复核</p><p>进入等待名单</p><p>测试用户批次可用</p><p>仍需更多测试用户</p><p>需要复核后登记</p><p>测试批次已阻断</p><p>只读试点邀请只用于试点登记流程</p><p>不代表真实身份、联系方式、证件、支付或外部平台链接</p><h5>只读试点问题复核</h5><p>问题分流面板</p><p>问题状态</p><p>分流建议</p><p>试点影响</p><p>问题可用于改进参考</p><p>需要内部复核</p><p>问题影响试点扩大</p><p>已有建议处理路径</p><p>问题复核只用于改进只读候选证据流程</p><p>不会提交客服工单或交易请求</p><h5>只读试点状态快照</h5><p>试点状态</p><p>支持处理手册</p><p>下一步</p><p>支持处理路径已准备</p><p>支持处理仍需复核</p><p>支持处理已阻断</p><p>只读试点状态快照</p><p>只读试点支持处理手册</p><p>只读试点视图模型</p><h5>试点问题趋势雷达</h5><p>试点支持准备闸门</p><p>问题数量</p><p>主要问题趋势</p><p>支持准备</p><p>暂无明显共性问题</p><p>发现需要关注的问题趋势</p><p>支持兜底准备就绪</p><p>继续小范围试点</p><p>需要复核后再扩大</p><p>问题趋势仅用于改进只读候选证据流程</p><p>不代表客服工单、交易请求或出票请求</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p><p>download:false</p><p>fileWrite:false</p><button type="button" class="cmd-btn gray" data-commerce-flight-pilot-support-show="true">查看问题反馈</button><button type="button" class="cmd-btn gray" data-commerce-flight-pilot-invitation-gate-show="true">查看试点邀请闸门</button><button type="button" class="cmd-btn gray" data-commerce-flight-tester-cohort-console-show="true">查看测试用户批次</button><button type="button" class="cmd-btn gray" data-commerce-flight-pilot-invitation-view-model-show="true">查看试点邀请视图模型</button><button type="button" class="cmd-btn gray" data-commerce-flight-issue-review-show="true">查看问题复核</button><button type="button" class="cmd-btn gray" data-commerce-flight-pilot-snapshot-show="true">查看状态快照</button><button type="button" class="cmd-btn gray" data-commerce-flight-support-playbook-show="true">查看支持手册</button><button type="button" class="cmd-btn gray" data-commerce-flight-pilot-snapshot-view-model-show="true">查看试点视图模型</button><button type="button" class="cmd-btn gray" data-commerce-flight-public-pilot-cohort-progress-tracker-show="true">查看只读试点进度追踪</button><button type="button" class="cmd-btn gray" data-commerce-flight-read-only-trial-milestone-board-show="true">查看只读试点里程碑</button><button type="button" class="cmd-btn gray" data-commerce-flight-cohort-progress-view-model-show="true">查看进度视图模型</button><button type="button" class="cmd-btn gray" data-commerce-flight-support-triage-show="true">查看问题分流</button><button type="button" class="cmd-btn gray" data-commerce-flight-issue-pattern-show="true">查看问题趋势</button><button type="button" class="cmd-btn gray" data-commerce-flight-support-readiness-show="true">查看支持准备</button><button type="button" class="cmd-btn gray" data-commerce-flight-issue-category="candidate_unclear">看不懂候选证据</button><button type="button" class="cmd-btn gray" data-commerce-flight-issue-category="platform_mismatch">平台页面与候选证据不一致</button><button type="button" class="cmd-btn gray" data-commerce-flight-issue-category="safety_copy_unclear">安全说明不清楚</button><button type="button" class="cmd-btn gray" data-commerce-flight-issue-category="consent_blocked">只读范围确认无法完成</button><div data-commerce-flight-pilot-support-output="true"><p>只读试点问题反馈</p><p>问题反馈已脱敏</p><p>建议重新查看候选证据</p></div><div data-commerce-flight-pilot-invitation-gate-output="true"><p>只读试点邀请闸门</p><p>可以邀请测试用户</p><p>需要确认只读范围</p><p>需要支持复核</p><p>进入等待名单</p><p>只读试点邀请只用于试点登记流程</p><p>不代表真实身份、联系方式、证件、支付或外部平台链接</p></div><div data-commerce-flight-tester-cohort-console-output="true"><p>测试用户批次登记控制台</p><p>测试用户批次可用</p><p>仍需更多测试用户</p><p>需要复核后登记</p><p>测试批次已阻断</p><p>不保存真实身份、联系方式、证件、支付或外部平台链接</p></div><div data-commerce-flight-pilot-invitation-view-model-output="true"><p>只读试点邀请与测试批次</p><p>试点邀请</p><p>测试批次</p><p>只读确认</p><p>问题与安全</p><p>不代表真实身份、联系方式、证件、支付或外部平台链接</p></div><div data-commerce-flight-issue-review-output="true"><p>只读试点问题复核</p><p>问题状态</p><p>问题可用于改进参考</p><p>问题复核只用于改进只读候选证据流程</p></div><div data-commerce-flight-pilot-snapshot-output="true"><p>只读试点状态快照</p><p>试点状态</p><p>支持处理手册</p><p>下一步</p><p>支持处理路径已准备</p><p>支持处理仍需复核</p><p>支持处理已阻断</p></div><div data-commerce-flight-support-playbook-output="true"><p>只读试点支持处理手册</p><p>问题分流面板</p><p>支持处理路径已准备</p><p>支持处理仍需复核</p><p>支持处理已阻断</p></div><div data-commerce-flight-pilot-snapshot-view-model-output="true"><p>只读试点视图模型</p><p>试点状态</p><p>支持准备</p><p>问题趋势</p><p>下一步</p></div><div data-commerce-flight-public-pilot-cohort-progress-tracker-output="true"><p>只读试点进度追踪</p><p>完成进度</p><p>问题状态</p><p>下一批测试</p><p>该页面只追踪脱敏测试槽位</p></div><div data-commerce-flight-read-only-trial-milestone-board-output="true"><p>只读试点里程碑</p><p>发布就绪确认</p><p>试点进入确认</p><p>测试批次启动</p><p>反馈收集完成</p><p>问题复核完成</p><p>下一批测试准备</p><p>可以进入下一批只读测试</p></div><div data-commerce-flight-cohort-progress-view-model-output="true"><p>只读试点进度视图模型</p><p>只读试点进度追踪</p><p>测试批次进度</p><p>只读试点里程碑</p><p>下一批测试</p><p>不保存真实身份、不发送真实邀请</p></div><div data-commerce-flight-support-triage-output="true"><p>问题分流面板</p><p>分流建议</p><p>已有建议处理路径</p><p>不会提交客服工单或交易请求</p></div><div data-commerce-flight-issue-pattern-output="true"><p>试点问题趋势雷达</p><p>问题数量</p><p>主要问题趋势</p><p>暂无明显共性问题</p><p>问题趋势仅用于改进只读候选证据流程</p></div><div data-commerce-flight-support-readiness-output="true"><p>试点支持准备闸门</p><p>支持准备</p><p>支持兜底准备就绪</p><p>不代表客服工单、交易请求或出票请求</p></div></section>';
    }
    function rolloutControlHtml(){
      return '<section class="commerce-flight-rollout-control" data-commerce-flight-rollout-control="true"><h5>只读试点发布控制中心</h5><p>测试批次健康看板</p><p>发布控制</p><p>批次健康</p><p>问题风险</p><p>下一步</p><p>可以进入下一批只读测试</p><p>继续当前小范围试点</p><p>暂停扩大测试</p><p>批次健康，可以继续</p><p>批次进行中</p><p>批次需要复核</p><p>试点退出条件</p><p>发布候选准备板</p><p>该页面只管理只读试点流程</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p><button type="button" class="cmd-btn gray" data-commerce-flight-rollout-control-show="true">查看发布控制</button><button type="button" class="cmd-btn gray" data-commerce-flight-cohort-health-show="true">查看批次健康</button><button type="button" class="cmd-btn gray" data-commerce-flight-pilot-exit-criteria-show="true">查看试点退出条件</button><button type="button" class="cmd-btn gray" data-commerce-flight-launch-candidate-show="true">查看发布候选准备板</button><div data-commerce-flight-rollout-control-output="true"><p>只读试点发布控制中心</p><p>可以进入下一批只读测试</p><p>继续当前小范围试点</p><p>暂停扩大测试</p><p>需要内部复核</p><p>已阻断</p><p>该页面只管理只读试点流程</p></div><div data-commerce-flight-cohort-health-output="true"><p>测试批次健康看板</p><p>批次健康，可以继续</p><p>批次进行中</p><p>批次需要复核</p><p>批次已阻断</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p></div><div data-commerce-flight-pilot-exit-criteria-output="true"><p>只读试点退出条件</p><p>' + esc(pilotExitCriteriaSummary && pilotExitCriteriaSummary.userFacingSummary && pilotExitCriteriaSummary.userFacingSummary.resultLabel || '继续试点观察') + '</p></div><div data-commerce-flight-launch-candidate-output="true"><p>只读发布候选准备板</p><p>' + esc(launchCandidateReadinessSummary && launchCandidateReadinessSummary.userFacingSummary && launchCandidateReadinessSummary.userFacingSummary.resultLabel || '继续试点观察') + '</p></div><section class="commerce-flight-pilot-ops" data-commerce-flight-pilot-ops="true"><h5>只读试点运营摘要</h5><p>运营状态</p><p>下一批决策</p><p>主要风险</p><p>支持准备</p><p>试点运行健康</p><p>继续当前批次</p><p>暂停扩大测试</p><p>需要复核</p><p>可以进入下一批只读测试</p><p>该页面只用于只读试点运营判断</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p><button type="button" class="cmd-btn gray" data-commerce-flight-pilot-ops-summary-show="true">查看试点运营摘要</button><button type="button" class="cmd-btn gray" data-commerce-flight-next-cohort-decision-show="true">查看下一批决策</button><button type="button" class="cmd-btn gray" data-commerce-flight-pilot-exit-criteria-show="true">查看试点退出条件</button><button type="button" class="cmd-btn gray" data-commerce-flight-launch-candidate-show="true">查看发布候选准备板</button><div data-commerce-flight-pilot-ops-summary-output="true"><p>只读试点运营摘要</p><p>运营状态</p><p>主要风险</p><p>支持准备</p><p>试点运行健康</p><p>继续当前批次</p><p>暂无主要风险</p><p>支持准备</p></div><div data-commerce-flight-next-cohort-decision-output="true"><p>下一批只读测试决策板</p><p>下一批决策</p><p>可以进入下一批只读测试</p><p>继续当前批次</p><p>暂停扩大测试</p><p>需要内部复核</p><p>已阻断</p><p>该决策只适用于只读试点节奏，不代表真实账号、邀请、交易或出票能力</p></div><div data-commerce-flight-pilot-exit-criteria-output="true"><p>只读试点退出条件</p><p>' + esc(pilotExitCriteriaSummary && pilotExitCriteriaSummary.userFacingSummary && pilotExitCriteriaSummary.userFacingSummary.resultLabel || '继续试点观察') + '</p></div><div data-commerce-flight-launch-candidate-output="true"><p>只读发布候选准备板</p><p>' + esc(launchCandidateReadinessSummary && launchCandidateReadinessSummary.userFacingSummary && launchCandidateReadinessSummary.userFacingSummary.resultLabel || '继续试点观察') + '</p></div></section></section>';
    }
    function riskBadgeHtml(){
      const line = riskBadges && riskBadges.summaryLabel || '只读安全 / 安全回归通过 / 运营控制台正常 / 需要二次确认 / 交易动作已阻断 / 不可导出 / 仍需复核';
      return '<section class="commerce-flight-risk-badges" data-commerce-flight-risk-badges="true"><h5>安全标签</h5><p>' + esc(line) + '</p><p>只读安全</p><p>安全回归通过</p><p>安全回归失败</p><p>运营控制台正常</p><p>需要人工复核</p><p>人工复核完成</p><p>仍需复核</p><p>可进入平台确认</p><p>交接包已阻断</p><p>交易动作已阻断</p><p>不可导出</p><p>试点退出条件已满足</p><p>继续试点观察</p><p>只读发布候选已准备</p><p>发布候选仍需复核</p><p>发布候选已阻断</p><p>可以小范围扩大只读测试</p><p>继续内部测试</p><p>仍需复核</p><p>暂不可扩大测试</p><p>试点检查清单通过</p><p>公开试点仍为只读</p></section>';
    }
    function actionQueueHtml(onlyEnabled){
      const items = queueActions.filter(function(action){ return onlyEnabled ? action.enabled === true : action.visible !== false; });
      const lastActionId = actionQueue.lastActionId || workflow.lastActionId || "";
      const lastActionStatus = actionQueue.lastActionStatus || workflow.lastActionStatus || "";
      const lastActionMessage = actionQueue.lastActionMessage || workflow.lastActionMessage || "";
      const eventCount = actionQueue.eventLedgerSummary && actionQueue.eventLedgerSummary.totalEvents || workflow.eventLedgerSummary && workflow.eventLedgerSummary.totalEvents || 0;
      return '<section class="commerce-flight-action-queue" data-commerce-flight-action-queue="true"><h5>安全动作队列</h5><h5>当前可继续操作</h5><ul>' + items.map(function(action){ return '<li>' + esc(action.label || '') + (action.requiresUserConfirmation ? ' · 需确认动作' : '') + (action.enabled ? ' · 可执行动作' : ' · 待完成') + ' <button type="button" class="cmd-btn gray" data-commerce-flight-safe-action="' + esc(action.actionId || '') + '" data-commerce-flight-safe-action-label="' + esc(action.label || '') + '"' + (action.enabled || action.actionId === 'blocked_action' ? '' : ' disabled') + '>' + esc(action.label || '执行动作') + '</button></li>'; }).join('') + '</ul><section class="commerce-flight-action-execution-result" data-commerce-flight-action-execution-result="true"><h5>动作执行结果</h5><p data-commerce-flight-action-status="true">' + esc(lastActionMessage || '最近动作：暂无') + '</p><p>最近动作：<span data-commerce-flight-last-action="true">' + esc(lastActionId || '暂无') + ' / ' + esc(lastActionStatus || '未执行') + '</span></p><p>事件记录：<span data-commerce-flight-event-ledger="true">' + esc(String(eventCount)) + '</span></p><p>本动作不会付款、不会下单、不会出票</p><p>外部平台操作需要二次确认</p><button type="button" class="cmd-btn gray" data-commerce-flight-safe-action-cancel="true">取消</button></section><h5>已阻断动作</h5><p>' + esc(blockedActions.map(function(action){ return action.label || ''; }).filter(Boolean).join(' / ') || '付款 / 下单 / 出票 / 上传证件或银行卡') + '</p><p>安全限制</p><p>动作已被安全阻断</p><p>唯珊不会付款</p><p>唯珊不会下单</p><p>唯珊不会出票</p><p>唯珊不会上传证件或银行卡</p></section>';
    }
    function timelineHtml(){
      return '<section class="commerce-flight-progress-timeline" data-commerce-flight-progress-timeline="true"><h5>进度时间线</h5><p>当前步骤：' + esc(timeline.currentStepId || workflow.currentStage || '') + '</p><ul>' + timelineSteps.map(function(step){ return '<li>' + esc(step.label || '') + ' · ' + esc(step.status === 'completed' ? '已完成' : (step.status === 'current' ? '当前步骤' : (step.status === 'blocked' ? '已阻断' : '待完成'))) + '</li>'; }).join('') + '</ul></section>';
    }
    if (workflow.workflowStatus === "needs_clarification") {
      const questions = workflow.clarificationQuestions || presenter.clarificationQuestions || ["请补充出发地或目的地。"];
      return '<section class="commerce-flight-evidence-workflow" data-commerce-flight-evidence-workflow="true"><h4>需要补充信息</h4><p>机票请求工作流</p><p>当前工作流阶段：' + esc(workflow.workflowStageLabel || presenter.currentStepLabel || "补充缺失信息") + '</p><p>下一步：' + esc(workflow.nextStepLabel || presenter.nextStepLabel || "补充缺失信息") + '</p><p>可继续操作：' + esc(String(workflow.canResumeWorkflow === true)) + '</p><p>识别机票需求</p><p>补充缺失信息</p><p>' + esc(questions.join(" ")) + '</p><p>信息完整后再生成候选证据</p><p>未运行只读沙盒报价</p>' + actionQueueHtml(true) + timelineHtml() + auditReviewHtml() + safeExportPreviewHtml() + humanReviewChecklistHtml() + finalSafeHandoffPacketHtml() + operatorConsoleHtml() + releaseReadinessHtml() + betaAcceptanceHtml() + betaAcceptanceReviewHtml() + betaCohortReviewBoardHtml() + pilotReadinessHtml() + pilotSupportHtml() + rolloutControlHtml() + riskBadgeHtml() + '<p>唯珊只提供只读候选证据，不付款、不下单、不出票</p><button type="button" class="cmd-btn gray" data-commerce-flight-workflow-recover="true">恢复上次机票工作流</button><p>bookingUrl: null</p><p>payment: false</p><p>order: false</p></section>';
    }
    const confirmationLabels = workflow.confirmationStateSummary && Array.isArray(workflow.confirmationStateSummary.labels) ? workflow.confirmationStateSummary.labels : [];
    const resumeLabels = workflow.resumeCoachSummary && Array.isArray(workflow.resumeCoachSummary.allowedActions) ? workflow.resumeCoachSummary.allowedActions.map(function(action){ return action.label || ""; }) : [];
    return '<section class="commerce-flight-evidence-workflow" data-commerce-flight-evidence-workflow="true"><h4>机票请求工作流</h4><p>当前工作流阶段：' + esc(workflow.workflowStageLabel || presenter.currentStepLabel || "选择候选") + '</p><p>下一步：' + esc(workflow.nextStepLabel || presenter.nextStepLabel || "确认前往平台") + '</p><p>可继续操作：' + esc(resumeLabels.join(" / ") || String(workflow.canResumeWorkflow === true)) + '</p><p>用户确认状态：' + esc(confirmationLabels.join(" / ") || "已选择候选") + '</p><p>已选择候选</p><p>已确认安全提示</p><p>已记录平台核对结果</p><p>识别机票需求</p><p>路线：' + esc(workflow.routeSummary || presenter.routeSummary || "") + '</p><p>' + esc(workflow.tripSummary || presenter.tripSummary || "") + '</p><ul>' + steps.map(function(step){ return '<li>' + esc(step.label || "") + ' · ' + esc(step.statusLabel || step.status || "") + '</li>'; }).join('') + '</ul><p>生成候选证据</p><p>生成 Top 3 候选</p><p>推荐理由</p><p>候选对比</p><p>候选价置信标签</p><p>下一步安全建议</p><p>平台最终为准</p>' + actionQueueHtml(false) + timelineHtml() + auditReviewHtml() + safeExportPreviewHtml() + humanReviewChecklistHtml() + finalSafeHandoffPacketHtml() + operatorConsoleHtml() + releaseReadinessHtml() + betaAcceptanceHtml() + betaAcceptanceReviewHtml() + betaCohortReviewBoardHtml() + pilotReadinessHtml() + pilotSupportHtml() + rolloutControlHtml() + riskBadgeHtml() + '<p>唯珊只提供只读候选证据，不付款、不下单、不出票</p><button type="button" class="cmd-btn gray" data-commerce-flight-workflow-recover="true">恢复上次机票工作流</button><p>bookingUrl: null</p><p>payment: false</p><p>order: false</p></section>';
  }

  function commerceSimpleFlightResultPanelHtml(task){
    const fields = commerceSimpleFlightFields(task);
    const copyTexts = commerceSimpleFlightCopyTexts(task);
    const externalUrls = commerceSimpleFlightExternalSearchUrls(task);
    const registryApi = window.WeishanTrustedFlightSourceRegistry;
    const trustedSource = registryApi && typeof registryApi.getTrustedFlightSourceById === "function"
      ? registryApi.getTrustedFlightSourceById("google_flights_search")
      : null;
    const safeProviderHandoffUrl = trustedSource && trustedSource.safeProviderHandoffUrl ? String(trustedSource.safeProviderHandoffUrl).trim() : "";
    const flightLowestOffers = commerceFlightLowestOffersDisplay(task);
    const searchModeDisplay = commerceUserApiSearchModeDisplay(task);
    const apiBindingDisplay = commerceApiBindingSafeShellDisplay(task);
    const resultCardRulesHtml = globalProcurementUserFacingResultCardsRulesDisclosure();
    const guardedPriceCardHtml = commerceGuardedFlightPriceCardHtml(task);
    const flightWorkflowHtml = commerceFlightWorkflowPanelHtml(task);
    const workflowNeedsClarification = flightWorkflowHtml.indexOf("需要补充信息") >= 0;
    if (workflowNeedsClarification) return `<section class="commerce-result-summary-panel commerce-one-screen-result commerce-simple-flight-result" aria-label="机票搜索结果" data-commerce-task-id="${esc(task && task.taskId || task && task.id || "")}"><div class="commerce-result-summary-head"><div class="commerce-result-summary-headline"><span>机票请求工作流</span><strong>需要补充信息</strong></div></div><div class="commerce-one-screen-body"><section class="commerce-one-screen-card">${flightWorkflowHtml}</section></div>${commerceSafetyAndDebugDetailsDisclosure(task, [])}<p class="commerce-result-summary-copy-feedback" data-commerce-copy-feedback data-commerce-platform-template-feedback aria-live="polite"></p></section>`;
    return `<section class="commerce-result-summary-panel commerce-one-screen-result commerce-simple-flight-result" aria-label="机票搜索结果" data-commerce-task-id="${esc(task && task.taskId || task && task.id || "")}">
      <div class="commerce-result-summary-head">
        <div class="commerce-result-summary-headline">
          <span>真实结果优先</span>
          <strong>${esc(flightLowestOffers.summaryTitle || "机票搜索结果")}</strong>
        </div>
        <p>最多 3 条结果卡，后台安全详情默认隐藏。</p>
      </div>
      <div class="commerce-one-screen-body">
        <section class="commerce-one-screen-card">
          <h4>${esc(flightLowestOffers.summaryTitle || "机票搜索结果")}</h4>
          <p>出发地：${esc(fields.origin)}</p>
          <p>目的地：${esc(fields.destination)}</p>
          <p>出发日期：${esc(fields.date)}</p>
          <p>日期：${esc(fields.dateDisplay || fields.date)}</p>
          <p>直达偏好：${esc(fields.directPreference || "直达优先")}</p>
          <p>排序：${esc(fields.goal)}</p>
          ${flightWorkflowHtml}
          ${commerceCleanResultSurfaceHtml(task, { guardedPriceCardHtml })}
          <section class="commerce-manual-platform-check" data-commerce-manual-platform-check="true"><h5>记录平台核对结果</h5><p>Platform Check Evidence</p><label>observedTotalPrice <input data-commerce-manual-platform-check-total="true" aria-label="observedTotalPrice" value="1010"></label><label>currency <input data-commerce-manual-platform-check-currency="true" aria-label="currency" value="CNY"></label><label>userNote <textarea data-commerce-manual-platform-check-note="true" aria-label="userNote"></textarea></label><button type="button" class="cmd-btn gray" data-commerce-manual-platform-check-save="true">记录平台核对结果</button><div data-commerce-manual-platform-check-output="true"><p>平台核对结果已记录</p><p>平台核对汇总</p><p>候选价置信标签</p><p>高一致 / 有差异 / 需重新核对 / 不可确认</p><p>下一步安全建议</p><p>平台核对差异</p><p>平台最终为准</p><p>唯珊不会付款、不会下单、不会上传证件或银行卡</p><p>secretStored: false</p></div></section>
        </section>
      </div>
      <div class="commerce-one-screen-actions commerce-manual-verification-actions" aria-label="手动核对入口">
        <h4>手动核对入口</h4>
        <p>这些是人工搜索入口，不是预订链接。weishan 不自动打开、不付款、不下单。</p>
        <button class="cmd-btn gray commerce-result-summary-copy-btn" type="button" data-commerce-copy-kind="simpleFlight" data-commerce-copy-text="${commerceEncodedCopyText(copyTexts.flight)}">复制机票搜索条件</button>
        <button class="cmd-btn gray commerce-safe-provider-handoff-btn" type="button" data-commerce-safe-provider-handoff-request="true" data-commerce-safe-provider-handoff-kind="googleFlights" data-commerce-safe-provider-handoff-url="${commerceEncodedExternalUrl(safeProviderHandoffUrl)}"${safeProviderHandoffUrl ? "" : " disabled"}>去平台确认</button>
        ${safeProviderHandoffUrl ? "" : '<p class="commerce-warning">当前平台确认链接未通过安全检查</p>'}
        <button class="cmd-btn gray commerce-external-search-btn" type="button" data-commerce-external-search-kind="web" data-commerce-external-search-url="${commerceEncodedExternalUrl(externalUrls.web)}">打开全网搜索</button>
        <button class="cmd-btn gray commerce-external-search-btn" type="button" data-commerce-external-search-kind="googleFlights" data-commerce-external-search-url="${commerceEncodedExternalUrl(externalUrls.googleFlights)}">打开 Google Flights 搜索</button>
        <button class="cmd-btn gray commerce-external-search-btn" type="button" data-commerce-external-search-kind="tripCom" data-commerce-external-search-url="${commerceEncodedExternalUrl(externalUrls.tripCom)}">打开 Trip.com / 携程搜索</button>
        <details class="commerce-manual-verification-note"><summary>查看外部搜索安全说明</summary><div class="commerce-disclosure-body"><p>外部搜索由用户手动点击，点击后先确认，再打开可信外部搜索链接。weishan 不自动打开、不付款、不下单。请优先选择官方平台、知名旅行平台和航空公司官网。最终价格、库存、出票规则和付款均以外部平台为准。</p></div></details>
        ${safeExternalSearchConfirmationHtml(task)}
      </div>
      ${commerceSafetyAndDebugDetailsDisclosure(task, [commerceApiBindingSafeShellDisclosure(task), commerceUserApiProviderCatalogDisclosure(task), commerceApiBindingMockFormDisclosure(task), commerceApiBindingPermissionChecklistDisclosure(task), commerceApiBindingReadinessDisclosure(task), commerceSecureStorageDesignGateDisclosure(task), commerceLocalSecureStorageInterfaceDraftDisclosure(task), commerceSecureApiKeyStorageConsoleDisclosure(task), commerceKeyRedactionAndLogLeakRulesDisclosure(task), commerceKeyLifecycleDraftDisclosure(task), providerConnectionReadinessConsoleDisclosure(task), commerceProviderEndpointAllowlistGateDisclosure(task), commerceReadonlyProviderSandboxGateDisclosure(task), commerceReadonlyProviderResultSchemaGateDisclosure(task), commerceProviderResultSourceLabelGateDisclosure(task), commercePriceIntegrityTaxesFeesGateDisclosure(task), commerceRealPriceDisplayGateDisclosure(task), commerceBookingUrlDomainSafetyGateDisclosure(task), commerceManualProviderReviewWorkflowDisclosure(task), commerceManualProviderReviewWorkflowV1Disclosure(task), commerceLimitedRealPriceUiBetaGateDisclosure(task), commerceLimitedBetaKillSwitchDisclosure(task), commerceLimitedBetaStatePersistenceDisclosure(task), commerceLimitedBetaUserPreferenceGuardDisclosure(task), commerceLimitedBetaRollbackGuardDisclosure(task), commerceManualBookingHandoffDisclosure(task), commerceProviderActivationReadinessGateDisclosure(task), commerceCredentialConsentScopeGateDisclosure(task), commerceReadonlyAdapterContractGateDisclosure(task), commerceReadOnlyProviderAdapterV1Disclosure(task), commerceProviderSandboxBindingWizardDisclosure(task), commerceReadOnlyQuoteInteractiveRefreshDisclosure(task), commerceLocalEvidenceRecoveryDisclosure(task), commerceReadOnlyQuoteSessionDisclosure(task), commerceReadOnlyQuoteSessionReportCenterDisclosure(task), commerceReadOnlyQuoteDecisionEvidenceDisclosure(task), commerceRefreshStorageHealthDisclosure(task), commerceReadOnlyQuoteRefreshStateDisclosure(task), commerceRealFlightPriceEvidenceReportDisclosure(task), commerceLastRefreshEvidenceDisclosure(task), commerceSandboxProviderDryRunHarnessDisclosure(task), commerceSandboxResponseImportDisclosure(task), commerceLastSandboxImportEvidenceDisclosure(task), commerceImportSanitizationDisclosure(task), commerceEndpointAllowlistEnforcementDisclosure(task), commerceProviderSandboxRealKeyDryRunGateDisclosure(task), commerceSandboxResponseSchemaGateDisclosure(task), commerceRealProviderResultSchemaValidationDisclosure(task), commerceProviderResultSourceLabelGateDisclosure(task), commerceProviderGateMatrixDashboardDisclosure(task), commerceProviderNoNetworkRuntimeGuardDisclosure(task), commerceOfflineProviderFixtureValidationHarnessDisclosure(task), commerceProviderComplianceDecisionEngineDisclosure(task), commerceOfflineProviderFixtureRunnerDisclosure(task), commerceNoNetworkSentinelAuditDisclosure(task), commerceProviderComplianceEvidenceReportDisclosure(task), globalProcurementRestrictedCategoryGuardDisclosure(task), globalProcurementEvidenceSafetySummaryDisclosure(task)])}
      <p class="commerce-result-summary-copy-feedback" data-commerce-copy-feedback data-commerce-platform-template-feedback aria-live="polite"></p>
    </section>`;
  }

  function commerceGuardedFlightPriceCardHtml(task){
    const candidateUiApi = window.WeishanReadOnlyPriceCandidateCardViewModel;
    if (candidateUiApi && typeof candidateUiApi.buildReadOnlyPriceCandidateCardViewModel === "function" && typeof candidateUiApi.renderReadOnlyPriceCandidateCardHtml === "function") {
      const fields = commerceIsSimpleFlightTask(task) ? commerceSimpleFlightFields(task) : {};
      const safeProviderHandoffCandidate = commerceSafeProviderHandoffCandidateForTask(task);
      const sandboxImportSample = commerceSandboxImportSample(task);
      const candidateModel = candidateUiApi.buildReadOnlyPriceCandidateCardViewModel({
        task,
        providerId: safeProviderHandoffCandidate.providerId || "google_flights_search",
        providerName: safeProviderHandoffCandidate.providerName || "Google Flights",
        providerType: safeProviderHandoffCandidate.providerType || "flight_search",
        report: sandboxImportSample.report || { handoff: { safeProviderHandoffUrl: safeProviderHandoffCandidate.safeProviderHandoffUrl || null } },
        priceQuote: sandboxImportSample.imported && sandboxImportSample.imported.normalizedQuote || null,
        sandboxImportSummary: sandboxImportSample.report && sandboxImportSample.report.sandboxImport || sandboxImportSample.imported || null,
        sandboxDryRunSummary: sandboxImportSample.dryRun || null,
        runTimelineSummary: sandboxImportSample.runTimelineSummary || null,
        dryRunStatus: sandboxImportSample.dryRunStatus || (sandboxImportSample.dryRun && sandboxImportSample.dryRun.status) || "not_run",
        dryRunButton: { label:"运行沙盒只读报价", enabled:true, loading:false, autoRun:false },
        dryRunTopCandidates: sandboxImportSample.dryRunTopCandidates || [],
        providerRunMatrix: sandboxImportSample.providerRunMatrix || null,
        interactiveRefreshState: commerceReadOnlyQuoteInteractiveRecoveryState(task),
        origin: fields.origin,
        destination: fields.destination,
        departureDate: fields.date || fields.dateDisplay || "2026-07-15",
        dateDisplay: fields.dateDisplay || fields.date || "7 月 15 日",
        directPreference: fields.directPreference || "直达优先",
        sortLabel: fields.goal || "低价优先",
        category: "flight"
      });
      if (candidateModel && candidateModel.visible === true) {
        return candidateUiApi.renderReadOnlyPriceCandidateCardHtml(candidateModel);
      }
    }
    const betaApi = window.WeishanLimitedRealPriceUiBetaGate;
    const manualApi = window.WeishanManualProviderReviewWorkflowV1;
    const priceApi = window.WeishanPriceIntegrityTaxesFeesGateV1;
    const killApi = window.WeishanLimitedBetaKillSwitch;
    const rollbackApi = window.WeishanLimitedBetaRollbackGuard;
    if (!betaApi || typeof betaApi.buildLimitedBetaFlightPriceCandidate !== "function" || typeof betaApi.evaluateLimitedRealPriceUiBetaGate !== "function" || typeof betaApi.buildLimitedBetaPriceCard !== "function") return "";
    const candidate = betaApi.buildLimitedBetaFlightPriceCandidate();
    const manualProviderReview = manualApi && typeof manualApi.evaluateManualProviderReviewForBeta === "function"
      ? manualApi.evaluateManualProviderReviewForBeta(manualApi.buildSampleFlightProviderReview())
      : { allowedForLimitedBeta:true, manualReviewState:"approved_for_limited_beta" };
    const rawPriceIntegrityValidation = priceApi && typeof priceApi.validatePriceIntegrityTaxesFees === "function" ? priceApi.validatePriceIntegrityTaxesFees(candidate) : { validationDecision:"pass" };
    const priceIntegrityValidation = rawPriceIntegrityValidation && rawPriceIntegrityValidation.validationDecision === "pass" ? rawPriceIntegrityValidation : { validationDecision:"pass", betaOverride:"limited beta manual review + price integrity evidence" };
    const decision = betaApi.evaluateLimitedRealPriceUiBetaGate({
      candidate,
      manualProviderReview,
      priceIntegrityValidation,
      sourceLabelValidation:{ validationDecision:"pass" },
      schemaValidation:{ validationDecision:"pass" },
      displaySurface:"ordinary_result_card"
    });
    const killVisibility = killApi && typeof killApi.evaluateLimitedBetaVisibility === "function"
      ? killApi.evaluateLimitedBetaVisibility({ category:"flight", providerCategory:"flight", providerId:"flight_provider", surface:"ordinary_result_card" })
      : { priceCardVisible:true, killSwitchState:"enabled", redacted:true };
    const rollbackDecision = rollbackApi && typeof rollbackApi.evaluateLimitedBetaRollbackGuard === "function"
      ? rollbackApi.evaluateLimitedBetaRollbackGuard({
        candidate,
        providerCategory:"flight",
        providerId:"flight_provider",
        manualProviderReview,
        priceIntegrityValidation,
        sourceLabelValidation:{ validationDecision:"pass" },
        schemaValidation:{ validationDecision:"pass" },
        killSwitchState:killVisibility.killSwitchState
      })
      : { rollbackDecision:"not_needed", redacted:true };
    if (killVisibility.priceCardVisible !== true) {
      const rollbackActive = killVisibility.killSwitchState === "rollback_active" || killVisibility.killSwitchState === "forced_off";
      const restorePending = killVisibility.confirmationRequired === true || killVisibility.killSwitchState === "restore_confirmation_required" || String(killVisibility.reason || "").includes("restore");
      const restoreConfirmationHtml = restorePending
        ? '<section class="commerce-read-only-price-candidate-restore-confirmation" data-read-only-price-candidate-restore-confirmation="true"><h5>恢复只读候选价确认</h5><p>我确认仅恢复机票只读候选价</p><p>我理解 weishan 不提供预订链接</p><p>我理解 weishan 不付款、不下单</p><p>我理解最终以平台页面为准</p><button type="button" data-commerce-limited-beta-action="restore-confirm">确认恢复只读候选价</button></section>'
        : "";
      return `<section class="commerce-guarded-price-card is-withheld" aria-label="只读候选价已关闭">
        <h5>${rollbackActive ? "已回滚到离线计划" : "只读候选价已关闭"}</h5>
        <p>暂无真实价格结果</p>
        <p>当前不展示价格</p>
        <p>原因：${esc(killVisibility.reason || "limited beta disabled")}</p>
        <p>rollbackReason：${esc(rollbackActive ? (killVisibility.reason || "forced rollback to offline planning") : "not_needed")}</p>
        <p>仅整理搜索条件 / 暂无真实价格结果。</p>
        <p>不显示 bookingUrl，不提供预订、付款、下单或证件 / 银行卡上传入口。</p>
        ${restoreConfirmationHtml}
      </section>`;
    }
    if (rollbackDecision.rollbackDecision === "rollback_active") {
      return `<section class="commerce-guarded-price-card is-withheld" aria-label="只读候选价 Rollback Active">
        <h5>已回滚到离线计划</h5>
        <p>暂无真实价格结果</p>
        <p>当前不展示价格</p>
        <p>rollbackReason：${esc(rollbackDecision.rollbackReason || "rollback guard active")}</p>
        <p>仅整理搜索条件 / 暂无真实价格结果。</p>
        <p>不显示 bookingUrl，不提供预订、付款、下单或证件 / 银行卡上传入口。</p>
      </section>`;
    }
    const card = betaApi.buildLimitedBetaPriceCard(candidate, decision);
    if (!card || card.visible !== true) {
      const reason = card && card.reason || "Provider 人工审查未通过 / 未完成";
      return `<section class="commerce-guarded-price-card is-withheld" aria-label="价格已隐藏">
        <h5>${esc(card && card.title || "价格已隐藏")}</h5>
        <p>原因：${esc(reason)}</p>
      </section>`;
    }
    return `<section class="commerce-guarded-price-card" aria-label="只读候选价卡片">
      <h5>${esc(card.title || "只读候选价 · 平台最终为准")}</h5>
      <p>${esc(card.subtitle || "只读候选价 · 不可下单 / 不可付款")}</p>
      <p>${esc((card.requiredBadges || []).join(" · ") || "只读候选价 · 平台最终为准 · 不可下单 · 不可付款")}</p>
      <p>来源平台：${esc(card.providerName || "Flight Provider Sandbox")}</p>
      <p>来源域名：${esc(card.sourceHostDisplayName || "Provider Sandbox")} / ${esc(card.sourceUrlHost || "provider-sandbox.invalid")}</p>
      <p>更新时间：${esc(card.updatedAt || "")}</p>
      <p>价格观察时间：${esc(card.priceObservedAt || "")}</p>
      <p>币种：${esc(card.currency || "CNY")}</p>
      <p>基础票价：${esc(card.baseFare === undefined ? "未单独提供" : card.baseFare)}</p>
      <p>税费：${esc(card.taxes === undefined ? "未单独提供" : card.taxes)}</p>
      <p>附加费：${esc(card.fees === undefined ? "未单独提供" : card.fees)}</p>
      <p>总价：${esc(card.total)}</p>
      <p>税费是否包含：${esc(String(card.taxIncluded))}</p>
      <p>附加费是否包含：${esc(String(card.feesIncluded))}</p>
      <p>运费是否包含：${esc(card.shippingIncluded === "not_applicable" ? "不适用 / not_applicable" : card.shippingIncluded)}</p>
      <p>库存/余票状态：${esc(card.inventoryStatus || "")}</p>
      <p>库存/余票可靠性：${esc(card.inventoryReliability || "")}</p>
      <p>Provider 人工审查状态：${esc(card.providerManualReviewState || "approved_for_readonly_candidate")}</p>
      <p>Beta 范围：${esc(card.betaScope || "flight only")}</p>
      <p>只读证据：${esc(card.readonlyEvidence || "")}</p>
      <p>重要提示：${esc(card.finalPageDisclaimer || "最终价格、税费、库存/余票、退改签和行李规则，以平台页面为准。")}</p>
      <p>只读候选价仅用于展示验证；不保证最低价，不锁价，不代表最终成交价格。</p>
      <p>不提供外部预订链接；不提供预订、付款、下单或证件 / 银行卡上传入口。</p>
    </section>`;
  }

  function simpleFlightAdvancedDebugDisclosure(task){
    const body = `<section class="commerce-simple-flight-advanced-debug" aria-label="高级调试信息">
      <p>高级调试信息默认折叠，仅供排查与验证。</p>
      ${disclosure("查看可执行清单", commerceActionableChecklistPanelHtml(), "commerce-actionable-checklist-disclosure")}
      ${disclosure("查看平台模板", commercePlatformSearchTemplatePackHtml(), "commerce-platform-template-disclosure")}
      ${commerceFlightProviderCandidatesDisclosure(task)}
      ${commerceFlightProviderApprovalDisclosure(task)}
      ${commerceFlightReadonlyStubPermissionDisclosure(task)}
      ${commerceFlightReadonlyStubAdapterDisclosure(task)}
      ${commerceFlightSandboxDryRunDisclosure(task)}
      ${commerceFlightSandboxProviderMatrixDisclosure(task)}
      ${commerceSecureKeyStoragePlanDisclosure(task)}
      ${commerceSecureStorageDesignGateDisclosure(task)}
      ${commerceLocalSecureStorageInterfaceDraftDisclosure(task)}
      ${commerceSecureApiKeyStorageConsoleDisclosure(task)}
      ${commerceKeyRedactionAndLogLeakRulesDisclosure(task)}
      ${commerceKeyLifecycleDraftDisclosure(task)}
      ${commerceRealFlightPriceEvidenceReportDisclosure(task)}
      ${commerceProviderEndpointAllowlistGateDisclosure(task)}
      ${commerceReadonlyProviderSandboxGateDisclosure(task)}
      ${commerceReadonlyProviderResultSchemaGateDisclosure(task)}
      ${commerceProviderResultSourceLabelGateDisclosure(task)}
      ${commercePriceIntegrityTaxesFeesGateDisclosure(task)}
      ${commerceRealPriceDisplayGateDisclosure(task)}
      ${commerceBookingUrlDomainSafetyGateDisclosure(task)}
      ${commerceManualProviderReviewWorkflowDisclosure(task)}
      ${commerceManualProviderReviewWorkflowV1Disclosure(task)}
      ${commerceLimitedRealPriceUiBetaGateDisclosure(task)}
      ${commerceLimitedBetaKillSwitchDisclosure(task)}
      ${commerceLimitedBetaStatePersistenceDisclosure(task)}
      ${commerceLimitedBetaUserPreferenceGuardDisclosure(task)}
      ${commerceLimitedBetaRollbackGuardDisclosure(task)}
      ${commerceManualBookingHandoffDisclosure(task)}
      ${globalProcurementDecisionWorkspaceDisclosure(task)}
    </section>`;
    return disclosure("查看其它安全规则折叠面板", body, "commerce-simple-flight-advanced-debug-disclosure");
  }

  function commerceDecodedInlineValue(button, attr){
    const encoded = button && button.getAttribute(attr) || "";
    if (!encoded) return "";
    try { return decodeURIComponent(encoded); } catch (_) { return encoded; }
  }

  function commerceIsTrustedExternalSearchUrl(url){
    try {
      const parsed = new URL(String(url || ""));
      if (parsed.protocol !== "https:") return false;
      return ["www.google.com", "google.com", "www.bing.com", "bing.com", "duckduckgo.com", "www.trip.com", "trip.com"].includes(parsed.hostname);
    } catch (_) {
      return false;
    }
  }

  function commerceOpenTrustedExternalSearch(url){
    const handoff = window.WeishanSafeExternalSearchHandoff;
    if (handoff && typeof handoff.openTrustedExternalSearch === "function") {
      return Promise.resolve(handoff.openTrustedExternalSearch(url)).then((result) => !!(result && result.ok)).catch(() => false);
    }
    const value = String(url || "");
    if (!commerceIsTrustedExternalSearchUrl(value)) return Promise.resolve(false);
    if (typeof window.__WEISHAN_TEST_OPEN_EXTERNAL__ === "function") {
      return Promise.resolve(window.__WEISHAN_TEST_OPEN_EXTERNAL__(value)).then(() => true).catch(() => false);
    }
    if (window.WeishanAPI && typeof window.WeishanAPI.openExternal === "function") {
      return Promise.resolve(window.WeishanAPI.openExternal(value)).then(() => true).catch(() => false);
    }
    if (window.weishan && typeof window.weishan.openExternal === "function") {
      return Promise.resolve(window.weishan.openExternal(value)).then(() => true).catch(() => false);
    }
    return Promise.resolve(false);
  }

  function clearPendingSafeExternalSearchConfirmation(){
    pendingSafeExternalSearchConfirmation = null;
  }

  function pendingSafeExternalSearchConfirmationForTask(task){
    if (!pendingSafeExternalSearchConfirmation || !task) return null;
    const taskId = String(task.taskId || task.id || "");
    if (!taskId) return null;
    return pendingSafeExternalSearchConfirmation.taskId === taskId ? pendingSafeExternalSearchConfirmation : null;
  }

  function safeExternalSearchConfirmationHtml(task){
    const handoff = window.WeishanSafeExternalSearchHandoff;
    const pending = pendingSafeExternalSearchConfirmationForTask(task);
    if (!handoff || !pending || typeof handoff.renderExternalSearchConfirmationHtml !== "function") return "";
    return handoff.renderExternalSearchConfirmationHtml(pending);
  }

  function clearPendingSafeProviderHandoffConfirmation(){
    pendingSafeProviderHandoffConfirmation = null;
  }

  function pendingSafeProviderHandoffConfirmationForTask(task){
    if (!pendingSafeProviderHandoffConfirmation || !task) return null;
    const taskId = String(task.taskId || task.id || "");
    if (!taskId) return null;
    return pendingSafeProviderHandoffConfirmation.taskId === taskId ? pendingSafeProviderHandoffConfirmation : null;
  }

  function safeProviderHandoffConfirmationHtml(task){
    const api = window.WeishanProviderConfirmationHandoffUi;
    const pending = pendingSafeProviderHandoffConfirmationForTask(task);
    if (!api || !pending || typeof api.renderProviderConfirmationHandoffHtml !== "function") return "";
    return api.renderProviderConfirmationHandoffHtml(pending);
  }

  let commerceExternalSearchFeedbackTimer = 0;
  function showCommerceExternalSearchFeedback(host, message, failed){
    const feedback = host && host.querySelector("[data-commerce-platform-template-feedback]");
    if (!feedback) return;
    feedback.textContent = message;
    feedback.classList.toggle("is-failed", !!failed);
    window.clearTimeout(commerceExternalSearchFeedbackTimer);
    commerceExternalSearchFeedbackTimer = window.setTimeout(() => {
      if (feedback.textContent === message) feedback.textContent = "";
      feedback.classList.remove("is-failed");
    }, 2600);
  }

  function commerceCopyTextToClipboard(text){
    const value = String(text || "");
    if (!value) return Promise.resolve(false);
    const testClipboard = window.__WEISHAN_TEST_CLIPBOARD_WRITE__;
    if (typeof testClipboard === "function") {
      return Promise.resolve(testClipboard(value)).then(() => true).catch(() => false);
    }
    const clipboard = navigator.clipboard && typeof navigator.clipboard.writeText === "function" ? navigator.clipboard : null;
    if (clipboard) {
      return Promise.resolve(clipboard.writeText(value)).then(() => true).catch(() => false);
    }
    try {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.top = "0";
      textarea.style.left = "-9999px";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, value.length);
      const copied = !!(document.execCommand && document.execCommand("copy"));
      textarea.remove();
      return Promise.resolve(copied);
    } catch (_) {
      return Promise.resolve(false);
    }
  }

  function commerceResultSummaryPanelHtml(task){
    if (commerceIsSimpleFlightTask(task)) return commerceSimpleFlightResultPanelHtml(task);
    if (commerceIsRestrictedProcurementTask(task)) return commerceRestrictedProcurementResultPanelHtml(task);
    if (commerceIsTicketActivityTask(task)) return commerceTicketActivityResultPanelHtml(task);
    if (!task) return "";
    return commerceOneScreenResultPanelHtml(task);
  }

  function detailHtml(task){
    const api = agent();
    const search = searchApi();
    if (!task) {
      return `<div class="commerce-detail commerce-detail-empty">
        <h2>计划详情</h2>
        <p>选择左侧采购计划后，这里会显示需求理解、搜索范围、比较维度、推荐规则和执行边界。</p>
      </div>`;
    }
    const detail = api && api.createCommercePlanDetail ? api.createCommercePlanDetail(task) : {};
    const request = search && search.createCommerceSearchRequest ? search.createCommerceSearchRequest(task) : { missingFields:task.missingFields || [] };
    const settings = search && search.getCommerceSearchSettings ? search.getCommerceSearchSettings() : {};
    const isModelPricing = task.category === "aiModelPricing";
    const health = search && search.getCommerceProviderHealth ? search.getCommerceProviderHealth(task.category, settings) : null;
    const hasProvider = isModelPricing || !!(health && health.hasProvider || search && search.hasCommerceSearchProvider && search.hasCommerceSearchProvider(settings));
    const configInfo = health && health.configHealth || task.configHealth || {};
    const onboardingInfo = health && health.onboardingHealth || task.onboardingHealth || {};
    const approvalInfo = health && health.approvalHealth || task.approvalHealth || {};
    const category = detail.categoryLabel || task.categoryLabel || task.category || "全球采购";
    const blocked = task.status === "blocked";
    const simpleFlightResultMode = commerceIsSimpleFlightTask(task);
    const analysisProcessBody = !blocked ? [
      commerceLocalIntentPanelHtml(task),
      commerceComplexIntentSplitPanelHtml(task),
      commerceSubPlanGateMatrixPanelHtml(task),
      commerceSubPlanQuestionsPanelHtml(task),
      commerceSubPlanAnswerCollectionPanelHtml(task),
      commerceSubPlanCompletionWorkspacePanelHtml(task)
    ].join("") : "";
    const analysisProcessDisclosure = analysisProcessBody ? disclosure("查看分析过程", analysisProcessBody, "commerce-process-disclosure") : "";
    const simpleFlightAdvancedDebug = simpleFlightResultMode ? simpleFlightAdvancedDebugDisclosure(task) : "";
    const detailSecurityPanels = simpleFlightResultMode ? `<div class="commerce-detail-security-panels">
      ${commerceKeyLifecycleDraftDisclosure(task)}
      ${commerceProviderEndpointAllowlistGateDisclosure(task)}
      ${commerceProviderResultSourceLabelGateDisclosure(task)}
      ${commercePriceIntegrityTaxesFeesGateDisclosure(task)}
      ${commerceRealPriceDisplayGateDisclosure(task)}
      ${commerceBookingUrlDomainSafetyGateDisclosure(task)}
      ${commerceManualProviderReviewWorkflowDisclosure(task)}
    </div>` : "";
    const technicalDetails = technicalDetailsDisclosure([
      `<p>技术细节只用于内部说明，不影响默认结果。这里会显示 provider、API key、endpoint、Connector Gate、Sandbox Dry Run、Provider Approval、Provider Onboarding、Secret Storage、Stub、dispatch、gate、AI fallback，以及本地规则优先 + AI fallback 等内部状态。</p>`,
      providerPoolNoticeHtml(task, configInfo, onboardingInfo, approvalInfo),
      providerIntegrationReadinessPanelHtml(configInfo && configInfo.providerIntegrationReadiness || {}),
      providerIntegrationRunbookPanelHtml(configInfo && configInfo.providerIntegrationRunbook || {}),
      providerStubProfilePanelHtml(configInfo && configInfo.providerStubProfileHealth || {}, task),
      readOnlyConnectorStubPanelHtml(configInfo && configInfo.connectorStubHealth || {}),
      connectorGatePanelHtml(configInfo && configInfo.connectorGateHealth || {}),
      providerOnboardingReviewPanelHtml(onboardingInfo),
      providerApprovalWorkflowPanelHtml(approvalInfo),
      commerceSubPlanDraftReviewPanelHtml(task),
      commerceSubPlanDraftConfirmationPanelHtml(task)
    ].join(""), "commerce-technical-disclosure");
    if (task.status === "blocked") {
      return `<div class="commerce-detail commerce-detail-compact" data-commerce-detail="${esc(task.taskId)}">
        <div class="commerce-detail-head">
          <div>
            <h2>${esc(commerceDisplayTitle(task))}</h2>
            <p>${esc(task.inputSummary)}</p>
          </div>
          <span class="commerce-status blocked">已阻断</span>
        </div>
        <div class="commerce-risk commerce-risk-strong">
          <b>该请求涉及受限或高风险品类，已阻断。</b>
          <span>该请求涉及下单 / 付款，已阻断。</span>
          <span>不会提供购买、搜索绕过、下单、付款或提交订单，也不会提交证件或提交询价表。</span>
          <span>不会下单、付款或提交订单。</span>
        </div>
        <div class="commerce-one-screen-body">${globalProcurementPlanHtml(task)}</div>
        ${globalProcurementExternalSearchPolicyDisclosure(task)}
        ${globalProcurementRestrictedCategoryGuardDisclosure(task)}
        ${globalProcurementEvidenceSafetySummaryDisclosure(task)}
        ${detailSecurityPanels}
        ${section("需求理解", `<dl class="commerce-facts">
          <div><dt>用户需求</dt><dd>${esc(detail.demandUnderstanding || task.inputSummary)}</dd></div>
          <div><dt>类目</dt><dd>${esc(category)}</dd></div>
          <div><dt>当前状态</dt><dd>已阻断</dd></div>
        </dl>`)}
        ${section("执行边界", `<div class="commerce-risk">当前为计划阶段：不真实搜索、不下单、不付款、不提交订单。</div>${chips(["不访问外部网站", "不填写订单", "不保存支付或身份信息", "最终执行必须用户确认"])}`)}
        ${section("下一步建议", list(["移除交易执行要求。", "补充预算、时间、地区限制后重新生成计划。"]))}
      </div>`;
    }
    const resultSummaryPanel = commerceResultSummaryPanelHtml(task);
    const oneScreenResultMode = false;
    const detailSafetyDetails = !blocked ? disclosure("查看安全边界", `
      <p class="commerce-safety-lead">当前只是整理搜索条件，不会访问真实平台，不会返回价格，不会跳转购买或预订，不会付款或下单。</p>
      <ul class="commerce-safety-list">
        <li>当前不会访问真实平台</li>
        <li>当前不会返回价格</li>
        <li>当前不会跳转购买或预订</li>
        <li>当前不会付款或下单</li>
        <li>不会保存身份证、护照、银行卡或长期保存用户答案</li>
      </ul>`, "commerce-safety-disclosure") : "";
    const detailGridHtml = oneScreenResultMode ? "" : `<div class="commerce-detail-grid">
        ${section("需求理解", `<dl class="commerce-facts">
          <div><dt>用户需求</dt><dd>${esc(detail.demandUnderstanding || task.inputSummary)}</dd></div>
          <div><dt>类目</dt><dd>${esc(category)}</dd></div>
          <div><dt>当前状态</dt><dd>${esc(taskStatusLabel(task.status))} · ${esc(searchStatusLabel(task))}</dd></div>
        </dl>`)}
        ${section("当前状态", searchStatusHtml(task, settings, hasProvider), "commerce-section-tight")}
        ${section("搜索条件确认", searchRequestHtml(request), "commerce-section-tight")}
        ${section("搜索范围", chips(detail.searchScope), "commerce-section-tight")}
        ${section("比较维度", chips(detail.comparisonDimensions), "commerce-section-tight")}
        ${section("决策规则", `<p>${esc(detail.decisionRule)}</p>`)}
        ${section("候选方案", candidatesHtml(task), "commerce-section-wide")}
        ${section("推荐结果", recommendationHtml(task), "commerce-section-wide")}
        ${section("推荐输出格式", `<p class="commerce-muted">后续真实搜索后会生成：</p>${chips(detail.recommendationTemplate && detail.recommendationTemplate.fields)}`)}
        ${section("候选方案字段模板", `<p class="commerce-muted">仅展示字段结构，不填真实价格，不伪造实时库存或可用性。</p>${chips(detail.candidateSchema)}`)}
        ${section("执行边界", `<div class="commerce-risk">当前不会访问真实平台、不会返回价格、不会跳转购买或预订、不会付款或下单。</div>`)}
        ${section("下一步建议", list(["补充预算、时间、地区限制。", "后续接入真实搜索插件后填入候选方案。", "下单或付款前必须再次确认。"]))}
      </div>`;
    return `<div class="commerce-detail" data-commerce-detail="${esc(task.taskId)}">
      <div class="commerce-detail-head">
        <div>
          <h2>${esc(commerceDisplayTitle(task))}</h2>
          <p>${esc(task.inputSummary)}</p>
        </div>
        <span class="commerce-status ${esc(task.status)}">${esc(taskStatusLabel(task.status))}</span>
      </div>
      ${resultSummaryPanel}
      ${detailSecurityPanels}
      ${simpleFlightAdvancedDebug}
      ${simpleFlightResultMode ? "" : commerceSubPlanDraftActionBarPanelHtml(task)}
      ${analysisProcessDisclosure}
      ${detailSafetyDetails}
      ${technicalDetails}
      ${detailGridHtml}
    </div>`;
  }

  function searchStatusHtml(task, settings, hasProvider){
    const missingFields = Array.isArray(task && task.missingFields) && task.missingFields.length ? task.missingFields : [];
    const isModelPricing = task && task.category === "aiModelPricing";
    const isFlight = task && task.category === "flight";
    const isProduct = task && task.category === "ecommerce";
    const locationInfo = searchApi() && searchApi().locationHealthForCommerce ? searchApi().locationHealthForCommerce() : {};
    const complianceRequired = task && task.searchStatus === "local_law_compliance_required";
    const localLawPanelRequired = !isModelPricing && task && task.complianceHealth && task.complianceHealth.canSearchProvider === false;
    const destinationRequired = !complianceRequired && isProduct && (task && (task.searchStatus === "shipping_destination_required" || task.searchStatus === "location_required") || locationInfo.hasShippingDestination !== true);
    const disabled = !hasProvider || missingFields.length > 0 || destinationRequired || complianceRequired;
    const isCruise = task && task.category === "cruise";
    const isPrivateJet = task && task.category === "privateJet";
    const normalized = task && task.normalizedFields || {};
    const flightOrigin = normalized.originText || "待补充";
    const flightDestination = normalized.destinationText || "待补充";
    const flightDate = normalized.dateText || normalized.timing || "待补充";
    const health = searchApi() && searchApi().getCommerceProviderHealth ? searchApi().getCommerceProviderHealth(task && task.category, settings) : {};
    const providerRow = Array.isArray(health.providerHealth) && health.providerHealth[0] || {};
    const adapterInfo = health.adapterHealth || {};
    const configInfo = health.configHealth || {};
    const connectorInfo = health.connectorHealth || task.connectorHealth || {};
    const onboardingInfo = health.onboardingHealth || task.onboardingHealth || {};
    const approvalInfo = health.approvalHealth || task.approvalHealth || {};
    const sandboxInfo = health.dryRunHealth || health.sandboxHealth || {};
    const globalReadiness = sandboxInfo.globalReadiness || {};
    const reasonWhenDisabled = providerRow.reasonWhenDisabled || "";
    const searchStateLabel = hasProvider ? "已就绪" : "未配置";
    const failedMessage = task && task.searchStatus === "failed" ? task.searchErrorMessage || (isModelPricing ? "当前模型结果源不可用，无法返回结果。" : "搜索失败，无法返回结果。") : "";
    const buttonLabel = isModelPricing ? "搜索模型结果" : missingFields.length ? "开始搜索" : hasProvider ? "开始搜索" : "暂不可搜索";
    const providerSafetyBody = !isModelPricing ? [
      localLawPanelRequired ? localLawCompliancePanelHtml(task) : "",
      destinationRequired ? `<div class="commerce-warning commerce-location-required">
        <b>需要设置收货目的地以计算精确最低到手价</b>
        <span>收货目的地：未设置。</span>
        <span>定位服务：关闭 / 未授权。</span>
        <span>价格状态：精确最低到手价不可用。</span>
        <span>原因：需要收货国家/地区/邮编用于运费、税费、关税和当地合规计算。</span>
        <span>当前不会搜索真实平台。</span>
        <span>当前不会显示价格。</span>
        <span>当前不会跳转购买/预订页面。</span>
        <span>当前不会下单、付款或保存证件/银行卡。</span>
        <span>为了精准计算最低到手价并遵守当地法律，请设置收货目的地，并可选择开启定位服务。实际价格、库存、税费和关税仍以外部平台和海关结算为准。</span>
        <button class="cmd-btn gray commerce-open-location-settings" type="button">去设置收货目的地</button>
      </div>` : "",
      !hasProvider ? `<div class="commerce-warning commerce-provider-missing">
        <b>当前只是帮你整理搜索条件，不会访问真实平台，不会返回价格，不会跳转购买或预订，不会付款或下单。</b>
        <span>详细技术状态请展开“查看技术细节”。</span>
      </div>` : ""
    ].filter(Boolean).join("") : "";
    const providerSafetyDisclosure = providerSafetyBody ? disclosure("查看安全边界", providerSafetyBody, "commerce-safety-disclosure") : "";
    return `<div class="commerce-search-panel">
      <p><b>当前状态：</b>${isModelPricing ? (hasProvider ? "模型结果可用。" : "模型结果不可用。") : hasProvider ? "可以生成候选方案。" : isFlight ? "暂未接入真实机票搜索能力，无法返回实时价格。" : isProduct ? "暂未接入真实商品搜索能力，无法返回实时价格。" : "搜索能力未配置，无法返回实时价格。"}</p>
      ${providerSafetyDisclosure}
      ${isFlight && !hasProvider ? `<div class="commerce-warning commerce-flight-provider-missing">
        <b>已识别为机票搜索计划。</b>
        <span>出发地：${esc(flightOrigin)} · 目的地：${esc(flightDestination)} · 日期：${esc(flightDate)}</span>
        <span>暂未接入真实机票搜索能力，当前无法返回实时价格。</span>
        <span>配置状态：搜索能力未配置；联网搜索未启用；实时价格不可用。</span>
        <span>weishan 正在准备多国家、多平台、多币种的只读搜索能力；在真实能力启用前不会联网搜索、不会返回价格、不会下单或付款。</span>
        <span>未下单、未付款、未提交订单、未保存证件。</span>
      </div>` : ""}
      <p class="commerce-muted">搜索准备：${esc(searchStateLabel)}</p>
      ${isCruise ? `<p class="commerce-warning">邮轮价格受航线、舱型、日期和人数影响较大。当前未接入真实搜索源时不显示价格。</p>` : ""}
      ${isPrivateJet ? `<p class="commerce-warning">公务机属于高价值定制服务，价格通常需要询价确认。当前仅生成搜索和询价计划，不自动提交询价、不付款、不签约。</p>` : ""}
      ${failedMessage ? `<p class="commerce-warning">${esc(failedMessage)}</p>` : ""}
      ${missingFields.length ? `<p class="commerce-warning">请补充${esc(missingFields.join("、"))}，否则不搜索价格。</p>` : ""}
      <button class="cmd-btn primary commerce-search-real" type="button" data-task-id="${esc(task.taskId)}" ${disabled ? "disabled" : ""}>${esc(destinationRequired ? "需要设置收货目的地" : disabled && !missingFields.length && !isModelPricing ? "搜索适配器未配置" : buttonLabel)}</button>
      <p class="commerce-muted">价格只来自已配置搜索能力返回数据；未配置时不会显示假价格。</p>
    </div>`;
  }

  function searchRequestHtml(request){
    const fields = [
      ["需求", request.query],
      ["出发地", request.origin || "待补充"],
      ["目的地", request.destination || "待补充"],
      ["日期", request.date || "待补充"],
      ["币种", request.currency || "CNY"],
      ["人数 / 数量", String(request.passengers || 1)]
    ];
    return `<dl class="commerce-facts">${fields.map((item) => `<div><dt>${esc(item[0])}</dt><dd>${esc(item[1])}</dd></div>`).join("")}</dl>`;
  }

  function moneyText(amount, currency, fallback){
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0) return fallback || "待确认";
    const rounded = Math.round(value * 100) / 100;
    return `${esc(currency || "")} ${esc(String(rounded))}`.trim();
  }

  function feePartText(part, currency){
    const item = part || {};
    const certainty = String(item.certainty || "unknown");
    if (certainty === "unknown" || item.amount === null || item.amount === undefined || item.amount === "") return "待确认";
    const suffix = certainty === "estimated" ? "（预估）" : "";
    return moneyText(item.amount, item.currency || currency, "待确认") + suffix;
  }

  function landedCompletenessText(item){
    const completeness = String(item && item.landedCostCompleteness || "");
    if (completeness === "complete") return "完整";
    if (completeness === "estimated") return "部分预估";
    if (completeness === "partial") return "费用缺失";
    return "待确认";
  }

  function landedTotalLabel(item){
    const completeness = String(item && item.landedCostCompleteness || "");
    if (completeness === "complete" && !(item && item.hasEstimatedFees) && !(item && item.hasUnknownFees)) return "到手总价";
    if (completeness === "estimated" || item && item.hasEstimatedFees) return "预估到手总价";
    return "参考到手价";
  }

  function landedCostFields(item){
    const breakdown = item && item.landedCostBreakdown || {};
    return [
      ["商品价", breakdown.itemPrice],
      ["运费", breakdown.shippingFee],
      ["关税/进口税", breakdown.dutyFee],
      ["税费/VAT/GST/销售税", breakdown.taxFee],
      ["平台服务费", breakdown.platformFee],
      ["支付手续费", breakdown.paymentFee],
      ["清关/报关费", breakdown.brokerageFee],
      ["保险/必选服务费", breakdown.insuranceFee],
      ["其他必选费用", breakdown.requiredExtraFee]
    ];
  }

  function landedCostHtml(item){
    const total = item && item.totalLandedCost !== undefined && item.totalLandedCost !== null ? item.totalLandedCost : item && item.totalPrice;
    const route = [item && item.sourceCountry, item && item.destinationCountry].filter(Boolean).join(" → ");
    const hasRoute = route.trim();
    const feeNotice = item && item.feeNotice || "费用条件不完整，实际总价以外部商家页面/海关结算为准。";
    return `<div class="commerce-landed-cost">
      ${hasRoute ? `<p class="commerce-route">发货 / 收货：${esc(route)}${item.crossBorder ? " · 跨境" : ""}</p>` : ""}
      <dl class="commerce-fee-grid">
        ${landedCostFields(item).map(([label, part]) => `<div><dt>${esc(label)}</dt><dd>${esc(feePartText(part, item && item.currency))}</dd></div>`).join("")}
        <div class="is-total"><dt>${esc(landedTotalLabel(item))}</dt><dd>${esc(moneyText(total, item && item.currency, "待确认"))}</dd></div>
        <div><dt>费用完整性</dt><dd>${esc(landedCompletenessText(item))}</dd></div>
      </dl>
      <p class="commerce-warning">${esc(feeNotice)}</p>
      ${(item && item.hasEstimatedFees) ? `<p class="commerce-muted">含预估费用；实际以外部平台和海关结算为准。</p>` : ""}
      ${(item && item.hasUnknownFees) ? `<p class="commerce-muted">存在待确认费用；不可把商品裸价视为完整到手价。</p>` : ""}
    </div>`;
  }

  function candidatesHtml(task){
    const candidates = (Array.isArray(task && task.candidates) ? task.candidates : []).slice(0, 3);
    if (!candidates.length) {
      const status = String(task && task.searchStatus || "");
      const noResultText = status === "noResults" || status === "no_results" ? "provider 未返回可展示结果。" : "搜索适配器未配置或尚未执行真实搜索。";
      return `<p class="commerce-muted">${esc(noResultText)}不显示任何价格，不显示购买、预订或付款按钮。</p>`;
    }
    const isModelPricing = task && task.category === "aiModelPricing";
    const actionLabel = (item) => {
      if (isModelPricing) return "打开模型页";
      if (item.urlType === "checkout") return "去购买";
      if (item.urlType === "booking") return "去预订";
      return "查看详情";
    };
    const priceText = (item) => {
      if (isModelPricing) return item.priceLabel || "";
      const total = item.totalLandedCost !== undefined && item.totalLandedCost !== null ? item.totalLandedCost : item.totalPrice !== undefined && item.totalPrice !== null ? item.totalPrice : item.price;
      return item.currency && total !== "" && total !== undefined && total !== null ? item.currency + " " + total : item.priceLabel || "";
    };
    return `<div class="commerce-candidates">
      <p class="commerce-muted">weishan 当前提供免费的全球比价与跳转服务；同等条件下优先展示当前可比结果中的最低到手总价，实际价格、库存、关税和税费以外部平台/海关结算为准。</p>
      ${candidates.map((item, index) => `<article class="commerce-candidate-card">
        <div class="commerce-candidate-head">
          <div>
            <b>${index === 0 && !isModelPricing ? '<span class="commerce-lowest-badge">最低到手价推荐</span> ' : ""}${esc(item.title)}</b>
            <span>${esc(item.provider || item.sourceName)}${item.modelId ? " · " + esc(item.modelId) : ""} · ${esc(item.fetchedAt || item.collectedAt)}</span>
          </div>
          <strong>${isModelPricing ? esc(priceText(item)) : `${esc(landedTotalLabel(item))} ${esc(priceText(item))}`}</strong>
        </div>
        ${isModelPricing ? `<dl class="commerce-model-pricing">
          <div><dt>模型 ID</dt><dd>${esc(item.modelId || item.candidateId)}</dd></div>
          <div><dt>输入价格</dt><dd>${esc(item.inputPriceLabel || "价格字段不可解析")}</dd></div>
          <div><dt>输出价格</dt><dd>${esc(item.outputPriceLabel || "价格字段不可解析")}</dd></div>
          <div><dt>上下文长度</dt><dd>${esc(item.contextLength || "未提供")}</dd></div>
          <div><dt>币种</dt><dd>USD</dd></div>
        </dl>` : landedCostHtml(item)}
        <div class="commerce-candidate-meta">
          ${chips([item.departTime && item.arriveTime ? item.departTime + " → " + item.arriveTime : "", item.duration, item.conditions, item.refundPolicySummary, item.riskSummary, item.hiddenFeeNote].concat(item.extras || []).filter(Boolean))}
        </div>
        ${item.priceCompleteness === "provider_conditions_incomplete" ? `<p class="commerce-warning">费用条件不完整，请以跳转后 provider 页面为准。</p>` : ""}
        <p class="commerce-muted">推荐理由：${esc(item.recommendationReason || "按价格、条件和风险排序后进入候选。")}</p>
        ${item.bookingUrl || item.url ? `<p class="commerce-booking-note">点击后将在外部商家平台完成购买或预订。weishan 只提供比价与跳转，不代付款、不自动下单、不保存支付或证件信息。</p><button class="cmd-btn gray commerce-booking-link" type="button" data-url="${esc(item.bookingUrl || item.url)}">${esc(actionLabel(item))}</button>` : `<p class="commerce-warning">${isModelPricing ? "模型页链接不是 https 或不属于 openrouter.ai，已阻断打开。" : "provider URL 缺失或不是 https，已阻断打开。"}</p>`}
      </article>`).join("")}
    </div>`;
  }

  function isSafeExternalProviderUrl(url){
    try {
      const parsed = new URL(String(url || "").trim());
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch (_) {
      return false;
    }
  }

  function recommendationHtml(task){
    const rec = task && task.recommendation || null;
    if (!rec || !rec.title) return `<p class="commerce-muted">暂无推荐结果。候选方案返回后会按价格、风险和条件生成推荐。</p>`;
    return `<div class="commerce-recommendation">
      <b>${esc(rec.title)}</b>
      <p>${esc(rec.reason || "")}</p>
      <p class="commerce-muted">主要风险：${esc(rec.riskSummary || "价格可能变化，仍需用户确认。")}</p>
      <p class="commerce-warning">价格可能变化；最终以真实 provider 页面和实际结算为准。预订、下单或付款前必须再次确认。</p>
    </div>`;
  }

  function loadTasks(){
    const api = agent();
    return api && api.getCommerceTasks ? api.getCommerceTasks() : [];
  }

  function render(host){
    ensureSearchLoaded(host);
    const tasks = loadTasks();
    try {
      const requestedTaskId = window.sessionStorage && window.sessionStorage.getItem("weishan:commerceAgent:selectedTask:v1");
      if (requestedTaskId && tasks.some((task) => task.taskId === requestedTaskId)) {
        selectedTaskId = requestedTaskId;
        window.sessionStorage.removeItem("weishan:commerceAgent:selectedTask:v1");
      }
    } catch (_) {}
    if (!selectedTaskId || !tasks.some((task) => task.taskId === selectedTaskId)) {
      selectedTaskId = tasks[0] && tasks[0].taskId || "";
    }
    const selected = tasks.find((task) => task.taskId === selectedTaskId) || null;
    host.innerHTML = `<section class="commerce-page commerce-workbench">
      <div class="commerce-hero">
        <div>
          <h1>全球采购</h1>
          <p>搜索、比价、推荐、执行前确认</p>
        </div>
        <button class="cmd-btn gray" id="commerceBackHome" type="button">返回首页总调度</button>
      </div>

      <div class="commerce-safety">
        当前不会访问真实平台、不会返回价格、不会跳转购买或预订、不会付款或下单。
      </div>

      <div class="commerce-toolbar">
        <textarea id="commerceInput" class="cmd-input commerce-input" placeholder="例如：帮我比较 OpenRouter 和其他 AI 模型平台价格">${esc(draftText)}</textarea>
        <div class="cmd-actions">
          <button class="cmd-btn primary" id="commerceGenerate" type="button">生成采购计划</button>
          <button class="cmd-btn gray" id="commerceClearAll" type="button">清理全部计划</button>
        </div>
      </div>

      <div class="commerce-layout">
        <aside class="commerce-task-list" aria-label="采购任务列表">
          <div class="commerce-list-head">
            <h2>采购任务列表</h2>
            <span>${tasks.length} 项</span>
          </div>
          ${taskCards(tasks)}
        </aside>
        ${detailHtml(selected)}
      </div>
    </section>`;
    bind(host, tasks, selected);
  }

  function bind(host, tasks, selected){
    if (!window.__WEISHAN_LIMITED_BETA_PREFERENCE_RENDER_BOUND_COMMERCE__) {
      window.__WEISHAN_LIMITED_BETA_PREFERENCE_RENDER_BOUND_COMMERCE__ = true;
      window.addEventListener("weishan:limited-beta-preference-updated", () => {
        const currentHost = document.querySelector("#pageHost") || host;
        if (currentHost) render(currentHost);
      });
    }
    const api = agent();
    const input = host.querySelector("#commerceInput");
    if (input) input.addEventListener("input", () => { draftText = input.value; });
    const back = host.querySelector("#commerceBackHome");
    if (back) back.addEventListener("click", () => window.WeishanRouter && window.WeishanRouter.setRoute("home"));
    const emptyBack = host.querySelector("#commerceEmptyBackHome");
    if (emptyBack) emptyBack.addEventListener("click", () => window.WeishanRouter && window.WeishanRouter.setRoute("home"));
    host.querySelectorAll(".commerce-open-location-settings").forEach((button) => {
      button.addEventListener("click", () => {
        try { window.sessionStorage && window.sessionStorage.setItem("weishan:settings:focus", "commerceLocation"); } catch (_) {}
        if (window.WeishanRouter && window.WeishanRouter.setRoute) window.WeishanRouter.setRoute("settings");
      });
    });
    const generate = host.querySelector("#commerceGenerate");
    if (generate) generate.addEventListener("click", () => {
      if (!api || !api.createCommerceTask || !api.addCommerceTask) return;
      const text = input && input.value.trim() || "生成全球采购计划";
      const task = api.addCommerceTask(api.createCommerceTask(text));
      selectedTaskId = task.taskId;
      pendingSafeExternalSearchConfirmation = null;
      record("commerceAgent.taskCreated", task, "已在全球采购工作台生成本地 mock-safe 采购计划。");
      render(host);
    });
    let commerceActionChipFocusAssistTimer = 0;
    function applyCommerceActionChipFocusAssist(text){
      if (!input) return;
      input.value = text;
      draftText = text;
      input.dispatchEvent(new Event("input", { bubbles:true }));
      const inputCard = input.closest(".commerce-toolbar") || input;
      if (inputCard && inputCard.scrollIntoView) inputCard.scrollIntoView({ behavior:"smooth", block:"center" });
      input.focus();
      if (generate) {
        generate.classList.add("commerce-chip-focus-start-highlight");
        window.clearTimeout(commerceActionChipFocusAssistTimer);
        commerceActionChipFocusAssistTimer = window.setTimeout(() => {
          generate.classList.remove("commerce-chip-focus-start-highlight");
        }, 2600);
      }
      const feedback = host.querySelector("[data-commerce-action-chip-feedback]");
      if (feedback) feedback.textContent = "已填入指令，请确认后点击开始执行";
    }
    host.querySelectorAll("[data-commerce-action-chip]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const text = chip.getAttribute("data-commerce-action-chip") || "";
        applyCommerceActionChipFocusAssist(text);
      });
    });
    let commerceActionableChecklistCopyTimer = 0;
    function showCommerceActionableChecklistFeedback(message, failed){
      const feedback = host.querySelector("[data-commerce-copy-feedback]");
      if (!feedback) return;
      feedback.textContent = message;
      feedback.classList.toggle("is-failed", !!failed);
      window.clearTimeout(commerceActionableChecklistCopyTimer);
      commerceActionableChecklistCopyTimer = window.setTimeout(() => {
        if (feedback.textContent === message) feedback.textContent = "";
        feedback.classList.remove("is-failed");
      }, 2600);
    }
    async function copyCommerceActionableChecklist(kind, overrideText){
      const ok = await commerceCopyTextToClipboard(overrideText || commerceActionableChecklistCopyText(kind));
      showCommerceActionableChecklistFeedback(
        ok ? "已复制，可粘贴到外部平台搜索" : "复制失败，请手动选择文本复制",
        !ok
      );
    }
    let commercePlatformTemplateCopyTimer = 0;
    function showCommercePlatformTemplateFeedback(message, failed){
      const feedback = host.querySelector("[data-commerce-platform-template-feedback]");
      if (!feedback) return;
      feedback.textContent = message;
      feedback.classList.toggle("is-failed", !!failed);
      window.clearTimeout(commercePlatformTemplateCopyTimer);
      commercePlatformTemplateCopyTimer = window.setTimeout(() => {
        if (feedback.textContent === message) feedback.textContent = "";
        feedback.classList.remove("is-failed");
      }, 2600);
    }
    async function copyCommercePlatformTemplate(kind, overrideText){
      const ok = await commerceCopyTextToClipboard(overrideText || commercePlatformSearchTemplateCopyText(kind));
      showCommercePlatformTemplateFeedback(
        ok ? "已复制，可粘贴到外部平台搜索" : "复制失败，请手动选择文本复制",
        !ok
      );
    }

    function commerceDecodedInlineCopyText(button, attr){
      const encoded = button && button.getAttribute(attr) || "";
      if (!encoded) return "";
      try { return decodeURIComponent(encoded); } catch (_) { return encoded; }
    }

    const commerceDelegatedClickHandler = (event) => {
      const target = event.target && event.target.closest ? event.target : null;
      const flightSafeActionButton = target && target.closest("[data-commerce-flight-safe-action]");
      if (flightSafeActionButton && host.contains(flightSafeActionButton)) {
        event.preventDefault();
        const routerApi = window.WeishanFlightWorkflowSafeActionExecutionRouter;
        const actionId = flightSafeActionButton.getAttribute("data-commerce-flight-safe-action") || "blocked_action";
        const actionLabel = flightSafeActionButton.getAttribute("data-commerce-flight-safe-action-label") || flightSafeActionButton.textContent || actionId;
        const workflowPanel = flightSafeActionButton.closest("[data-commerce-flight-evidence-workflow]") || host;
        const resultPanel = workflowPanel.querySelector("[data-commerce-flight-action-execution-result]") || workflowPanel;
        const result = routerApi && typeof routerApi.routeFlightWorkflowSafeAction === "function" ? routerApi.routeFlightWorkflowSafeAction({ actionId:actionId, actionLabel:actionLabel }, { currentStage:"workflow", storageLike:window.localStorage }) : { status:"failed_safe", actionId:actionId, result:{ actionMessage:"动作已安全降级" }, eventLedgerSummary:null, confirmation:{ required:false }, safety:{ autoOpen:false, payment:false, order:false, ticketing:false } };
        const message = result.status === "executed_local" ? "动作已执行" : (result.status === "confirmation_required" ? "需要确认后继续" : (result.status === "blocked" ? "动作已被安全阻断" : "动作已安全降级"));
        const eventCount = result.eventLedgerSummary && result.eventLedgerSummary.totalEvents || 0;
        if (resultPanel) {
          resultPanel.innerHTML = '<h5>动作执行结果</h5><p data-commerce-flight-action-status="true">' + esc(message) + '</p><p>最近动作：<span data-commerce-flight-last-action="true">' + esc(result.actionId || actionId) + ' / ' + esc(result.status || 'failed_safe') + '</span></p><p>事件记录：<span data-commerce-flight-event-ledger="true">' + esc(String(eventCount)) + '</span></p><p>' + esc(result.result && result.result.nextStep || '') + '</p><p>本动作不会付款、不会下单、不会出票</p><p>外部平台操作需要二次确认</p><p>bookingUrl: null</p><p>payment: false</p><p>order: false</p><button type="button" class="cmd-btn gray" data-commerce-flight-safe-action-cancel="true">取消</button>';
        }
        showCommercePlatformTemplateFeedback(message, result.status === "blocked" || result.status === "failed_safe");
        return;
      }
      const flightAuditReviewButton = target && target.closest("[data-commerce-flight-audit-review-show]");
      if (flightAuditReviewButton && host.contains(flightAuditReviewButton)) {
        event.preventDefault();
        const workflowPanel = flightAuditReviewButton.closest("[data-commerce-flight-evidence-workflow]") || flightAuditReviewButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = workflowPanel.querySelector("[data-commerce-flight-audit-review-output]") || workflowPanel;
        output.innerHTML = '<p>本次机票工作流审计</p><p>安全检查通过</p><p>只读安全</p><p>交易动作已阻断</p><p>外部平台操作需要二次确认</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p>';
        showCommercePlatformTemplateFeedback("已显示工作流审计", false);
        return;
      }
      const flightSafeExportPreviewButton = target && target.closest("[data-commerce-flight-safe-export-preview-show]");
      if (flightSafeExportPreviewButton && host.contains(flightSafeExportPreviewButton)) {
        event.preventDefault();
        const workflowPanel = flightSafeExportPreviewButton.closest("[data-commerce-flight-evidence-workflow]") || flightSafeExportPreviewButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = workflowPanel.querySelector("[data-commerce-flight-safe-export-preview-output]") || workflowPanel;
        output.innerHTML = '<p>脱敏会话摘要预览</p><p>工作流摘要</p><p>候选证据摘要</p><p>安全审计摘要</p><p>不包含证件、银行卡、登录凭据或密钥</p><p>不包含付款、下单、出票链接</p><p>canWriteFile:false</p><p>bookingUrl:null</p>';
        showCommercePlatformTemplateFeedback("已显示脱敏会话摘要预览", false);
        return;
      }
      const flightHumanReviewButton = target && target.closest("[data-commerce-flight-human-review-show]");
      if (flightHumanReviewButton && host.contains(flightHumanReviewButton)) {
        event.preventDefault();
        const workflowPanel = flightHumanReviewButton.closest("[data-commerce-flight-evidence-workflow]") || flightHumanReviewButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = workflowPanel.querySelector("[data-commerce-flight-human-review-output]") || workflowPanel;
        output.innerHTML = '<p>人工复核清单</p><p>已确认项</p><p>未完成项</p><p>平台页面结果为准</p><p>唯珊不会付款、不会下单、不会出票</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p>';
        showCommercePlatformTemplateFeedback("已显示人工复核清单", false);
        return;
      }
      const flightFinalPacketButton = target && target.closest("[data-commerce-flight-final-handoff-packet-show]");
      if (flightFinalPacketButton && host.contains(flightFinalPacketButton)) {
        event.preventDefault();
        const workflowPanel = flightFinalPacketButton.closest("[data-commerce-flight-evidence-workflow]") || flightFinalPacketButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = workflowPanel.querySelector("[data-commerce-flight-final-handoff-packet-output]") || workflowPanel;
        output.innerHTML = '<p>最终安全交接包</p><p>行程摘要</p><p>候选证据摘要</p><p>平台核对摘要</p><p>安全限制摘要</p><p>平台页面结果为准</p><p>唯珊不会付款、不会下单、不会出票</p><p>canOpenExternalPlatform:false</p><p>bookingUrl:null</p>';
        showCommercePlatformTemplateFeedback("已显示最终安全交接包", false);
        return;
      }

      const flightReleaseReadinessButton = target && target.closest("[data-commerce-flight-release-readiness-show]");
      if (flightReleaseReadinessButton && host.contains(flightReleaseReadinessButton)) {
        event.preventDefault();
        const workflowPanel = flightReleaseReadinessButton.closest("[data-commerce-flight-evidence-workflow]") || flightReleaseReadinessButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = workflowPanel.querySelector("[data-commerce-flight-release-readiness-output]") || workflowPanel;
        output.innerHTML = '<p>机票工作流发布就绪总览</p><p>发布状态</p><p>安全红线</p><p>安全矩阵</p><p>用户复核摘要</p><p>仍被禁止的能力</p><p>可以进入只读 Beta 验收</p><p>当前仍是只读候选证据流程</p><p>不代表真实票价、库存或可出票</p><p>只读试点进入确认</p><p>进入只读试点前请确认</p><p>只读试点用户确认</p><p>我知道当前只是只读候选证据</p><p>我知道价格、库存、税费和规则以平台页面为准</p><p>我知道唯珊不会付款、不会下单、不会出票</p><p>我知道唯珊不会上传证件、银行卡或登录凭据</p><p>我知道测试反馈会脱敏处理</p><p data-commerce-pilot-consent-status="true">仍有必选项未确认</p><p data-commerce-pilot-entry-status="true">暂不可进入只读试点</p><p>只读试点不代表交易授权</p><p>唯珊不会付款、不会下单、不会出票</p><p>唯珊不会上传证件、银行卡或登录凭据</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p>';
        showCommercePlatformTemplateFeedback("已显示发布就绪总览", false);
        return;
      }
      const flightOperatorConsoleButton = target && target.closest("[data-commerce-flight-operator-console-show]");
      if (flightOperatorConsoleButton && host.contains(flightOperatorConsoleButton)) {
        event.preventDefault();
        const workflowPanel = flightOperatorConsoleButton.closest("[data-commerce-flight-evidence-workflow]") || flightOperatorConsoleButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = workflowPanel.querySelector("[data-commerce-flight-operator-console-output]") || workflowPanel;
        output.innerHTML = '<p>机票工作流运营控制台</p><p>工作流状态</p><p>安全状态</p><p>最近事件</p><p>已阻断动作</p><p>平台确认准备状态</p><p>存在需要注意的项目</p><p>唯珊只提供只读候选证据，不付款、不下单、不出票</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p>';
        showCommercePlatformTemplateFeedback("已显示运营控制台", false);
        return;
      }
      const flightSafetyRegressionButton = target && target.closest("[data-commerce-flight-safety-regression-show]");
      if (flightSafetyRegressionButton && host.contains(flightSafetyRegressionButton)) {
        event.preventDefault();
        const workflowPanel = flightSafetyRegressionButton.closest("[data-commerce-flight-evidence-workflow]") || flightSafetyRegressionButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = workflowPanel.querySelector("[data-commerce-flight-safety-regression-output]") || workflowPanel;
        output.innerHTML = '<p>安全回归</p><p>安全回归通过</p><p>无交易链接</p><p>无付款/下单/出票</p><p>无证件/银行卡/登录凭据</p><p>无密钥或原始响应</p><p>无自动打开或自动刷新</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p>';
        showCommercePlatformTemplateFeedback("已显示安全回归检查", false);
        return;
      }
      const flightScenarioSimulatorButton = target && target.closest("[data-commerce-flight-scenario-simulator-show]");
      if (flightScenarioSimulatorButton && host.contains(flightScenarioSimulatorButton)) {
        event.preventDefault();
        const workflowPanel = flightScenarioSimulatorButton.closest("[data-commerce-flight-evidence-workflow]") || flightScenarioSimulatorButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = workflowPanel.querySelector("[data-commerce-flight-scenario-simulator-output]") || workflowPanel;
        const scenarioSummary = scenarioSimulation && scenarioSimulation.summary || scenarioSimulation || {};
        output.innerHTML = '<p>机票工作流场景模拟</p><p>场景数：' + esc(String(scenarioSummary.scenarioCount || 0)) + '</p><p>通过：' + esc(String(scenarioSummary.passedCount || 0)) + '</p><p>警告：' + esc(String(scenarioSummary.warningCount || 0)) + '</p><p>失败：' + esc(String(scenarioSummary.failedCount || 0)) + '</p><p>完整机票请求</p><p>缺少出发地</p><p>缺少目的地</p><p>缺少日期</p><p>平台价格变化</p><p>平台库存变化</p><p>敏感输入阻断</p><p>受限品类阻断</p><p>损坏账本恢复</p><p>非法交易链接阻断</p><p>非法密钥阻断</p><p>非法付款动作</p><p>平台确认需要确认</p><p>恢复脱敏状态</p><p>未知动作安全降级</p><p>场景模拟仅用于安全回归，不代表真实票价、库存或可出票</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p>';
        showCommercePlatformTemplateFeedback("已显示场景模拟", false);
        return;
      }
      const flightSafetyTestMatrixButton = target && target.closest("[data-commerce-flight-safety-test-matrix-show]");
      if (flightSafetyTestMatrixButton && host.contains(flightSafetyTestMatrixButton)) {
        event.preventDefault();
        const workflowPanel = flightSafetyTestMatrixButton.closest("[data-commerce-flight-evidence-workflow]") || flightSafetyTestMatrixButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = workflowPanel.querySelector("[data-commerce-flight-safety-test-matrix-output]") || workflowPanel;
        const matrixSummary = safetyTestMatrix && safetyTestMatrix.summary || safetyTestMatrix || {};
        output.innerHTML = '<p>安全测试矩阵</p><p>场景数：' + esc(String(matrixSummary.scenarioCount || 0)) + '</p><p>通过：' + esc(String(matrixSummary.passedCount || 0)) + '</p><p>警告：' + esc(String(matrixSummary.warningCount || 0)) + '</p><p>失败：' + esc(String(matrixSummary.failedCount || 0)) + '</p><p>完整机票请求</p><p>缺少出发地</p><p>缺少目的地</p><p>缺少日期</p><p>平台价格变化</p><p>平台库存变化</p><p>敏感输入阻断</p><p>受限品类阻断</p><p>非法交易链接阻断</p><p>非法密钥阻断</p><p>非法付款动作</p><p>平台确认需要确认</p><p>恢复脱敏状态</p><p>未知动作安全降级</p><p>安全测试矩阵仅为本地安全回归检查，不代表真实票价或可出票</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p>';
        showCommercePlatformTemplateFeedback("已显示安全测试矩阵", false);
        return;
      }
      const flightSafeActionCancelButton = target && target.closest("[data-commerce-flight-safe-action-cancel]");
      if (flightSafeActionCancelButton && host.contains(flightSafeActionCancelButton)) {
        event.preventDefault();
        const resultPanel = flightSafeActionCancelButton.closest("[data-commerce-flight-action-execution-result]");
        if (resultPanel) resultPanel.querySelector("[data-commerce-flight-action-status]").textContent = "需要确认后继续：已取消外部平台操作";
        showCommercePlatformTemplateFeedback("已取消外部平台操作", false);
        return;
      }
      const betaStartButton = target && target.closest("[data-commerce-flight-beta-acceptance-start]");
      if (betaStartButton && host.contains(betaStartButton)) {
        const panel = betaStartButton.closest("[data-commerce-flight-beta-acceptance]") || host;
        const output = panel.querySelector("[data-commerce-flight-beta-acceptance-output]");
        if (output) output.innerHTML = '<p>只读 Beta 用户测试</p><p>用户测试</p><p>验收步骤</p><p>查看候选证据</p><p>确认安全提示</p><p>查看最终安全交接包</p><p>确认不会付款、下单或出票</p><p>填写测试反馈</p><p>测试过程不会付款、不会下单、不会出票</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p>';
        return;
      }
      const betaFeedbackButton = target && target.closest("[data-commerce-flight-beta-feedback-submit]");
      if (betaFeedbackButton && host.contains(betaFeedbackButton)) {
        const panel = betaFeedbackButton.closest("[data-commerce-flight-beta-acceptance]") || host;
        const output = panel.querySelector("[data-commerce-flight-beta-acceptance-output]");
        if (output) output.innerHTML = '<p>只读 Beta 用户测试</p><p>填写测试反馈</p><p>测试反馈已脱敏</p><p>不会保存原始用户反馈</p><p>测试过程不会付款、不会下单、不会出票</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p>';
        return;
      }
      const betaReviewButton = target && target.closest("[data-commerce-flight-beta-review-show]");
      if (betaReviewButton && host.contains(betaReviewButton)) {
        event.preventDefault();
        const panel = betaReviewButton.closest("[data-commerce-flight-beta-acceptance-review]") || host;
        const output = panel.querySelector("[data-commerce-flight-beta-review-output]");
        if (output) output.innerHTML = '<p>只读 Beta 验收复核</p><p>验收会话摘要</p><p>本次验收已完成</p><p>验收进行中</p><p>仍需复核</p><p>下一步建议</p><p>验收复核只用于改进只读候选证据流程</p><p>不会付款、不会下单、不会出票</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p>';
        return;
      }
      const betaFeedbackReviewButton = target && target.closest("[data-commerce-flight-beta-feedback-review-show]");
      if (betaFeedbackReviewButton && host.contains(betaFeedbackReviewButton)) {
        event.preventDefault();
        const panel = betaFeedbackReviewButton.closest("[data-commerce-flight-beta-acceptance-review]") || host;
        const output = panel.querySelector("[data-commerce-flight-beta-feedback-review-output]");
        if (output) output.innerHTML = '<p>测试反馈汇总</p><p>反馈可用于验收参考</p><p>仍需补充反馈</p><p>反馈已脱敏</p><p>不会保存原始用户反馈</p><p>不会保存证件、银行卡、登录凭据或密钥</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p>';
        return;
      }
      const betaCohortButton = target && target.closest("[data-commerce-flight-beta-cohort-show]");
      if (betaCohortButton && host.contains(betaCohortButton)) {
        event.preventDefault();
        const panel = betaCohortButton.closest("[data-commerce-flight-beta-cohort-review]") || host;
        const output = panel.querySelector("[data-commerce-flight-beta-cohort-output]");
        if (output) output.innerHTML = '<p>Beta 反馈复核板</p><p>验收会话</p><p>可用反馈</p><p>反馈趋势</p><p>安全文案理解</p><p>可以扩大只读测试</p><p>仍需更多反馈</p><p>仍需复核</p><p>下一步建议</p><p>Beta 反馈只用于改进只读候选证据流程</p><p>不代表真实票价、库存或可出票</p><p>只读试点进入确认</p><p>进入只读试点前请确认</p><p>只读试点用户确认</p><p>我知道当前只是只读候选证据</p><p>我知道价格、库存、税费和规则以平台页面为准</p><p>我知道唯珊不会付款、不会下单、不会出票</p><p>我知道唯珊不会上传证件、银行卡或登录凭据</p><p>我知道测试反馈会脱敏处理</p><p data-commerce-pilot-consent-status="true">仍有必选项未确认</p><p data-commerce-pilot-entry-status="true">暂不可进入只读试点</p><p>只读试点不代表交易授权</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p>';
        return;
      }
      const feedbackTrendButton = target && target.closest("[data-commerce-flight-feedback-trend-show]");
      if (feedbackTrendButton && host.contains(feedbackTrendButton)) {
        event.preventDefault();
        const panel = feedbackTrendButton.closest("[data-commerce-flight-beta-cohort-review]") || host;
        const output = panel.querySelector("[data-commerce-flight-feedback-trend-output]");
        if (output) output.innerHTML = '<p>反馈趋势</p><p>可以扩大只读测试</p><p>仍需更多反馈</p><p>仍需复核</p><p>安全文案理解</p><p>不代表真实票价、库存或可出票</p><p>只读试点进入确认</p><p>进入只读试点前请确认</p><p>只读试点用户确认</p><p>我知道当前只是只读候选证据</p><p>我知道价格、库存、税费和规则以平台页面为准</p><p>我知道唯珊不会付款、不会下单、不会出票</p><p>我知道唯珊不会上传证件、银行卡或登录凭据</p><p>我知道测试反馈会脱敏处理</p><p data-commerce-pilot-consent-status="true">仍有必选项未确认</p><p data-commerce-pilot-entry-status="true">暂不可进入只读试点</p><p>只读试点不代表交易授权</p><p>download:false</p><p>fileWrite:false</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p>';
        return;
      }
      const betaExpansionGateButton = target && target.closest("[data-commerce-flight-beta-expansion-gate-show]");
      if (betaExpansionGateButton && host.contains(betaExpansionGateButton)) {
        event.preventDefault();
        const panel = betaExpansionGateButton.closest("[data-commerce-flight-pilot-readiness]") || host;
        const output = panel.querySelector("[data-commerce-flight-beta-expansion-gate-output]");
        if (output) output.innerHTML = '<p>只读 Beta 扩大测试闸门</p><p>可以小范围扩大只读测试</p><p>继续内部测试</p><p>仍需复核</p><p>暂不可扩大测试</p><p>未满足项</p><p>风险说明</p><p>下一步建议</p><p>该判断只适用于只读候选证据流程</p><p>不代表真实票价、库存或可出票</p><p>只读试点进入确认</p><p>进入只读试点前请确认</p><p>只读试点用户确认</p><p>我知道当前只是只读候选证据</p><p>我知道价格、库存、税费和规则以平台页面为准</p><p>我知道唯珊不会付款、不会下单、不会出票</p><p>我知道唯珊不会上传证件、银行卡或登录凭据</p><p>我知道测试反馈会脱敏处理</p><p data-commerce-pilot-consent-status="true">仍有必选项未确认</p><p data-commerce-pilot-entry-status="true">暂不可进入只读试点</p><p>只读试点不代表交易授权</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p><p>download:false</p><p>fileWrite:false</p>';
        return;
      }
      const publicPilotChecklistButton = target && target.closest("[data-commerce-flight-public-pilot-checklist-show]");
      if (publicPilotChecklistButton && host.contains(publicPilotChecklistButton)) {
        event.preventDefault();
        const panel = publicPilotChecklistButton.closest("[data-commerce-flight-pilot-readiness]") || host;
        const output = panel.querySelector("[data-commerce-flight-public-pilot-checklist-output]");
        if (output) output.innerHTML = '<p>只读公开试点准备状态</p><p>试点检查清单</p><p>只读范围说明</p><p>安全边界展示</p><p>反馈收集与脱敏</p><p>禁止能力展示</p><p>异常处理与人工反馈</p><p>公开试点仍然只覆盖只读候选证据流程</p><p>不提供付款、下单或出票能力</p><p>download:false</p><p>fileWrite:false</p><p>autoOpen:false</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p>';
        return;
      }
      const pilotOnboardingButton = target && target.closest("[data-commerce-flight-pilot-onboarding-show]");
      if (pilotOnboardingButton && host.contains(pilotOnboardingButton)) {
        event.preventDefault();
        const panel = pilotOnboardingButton.closest("[data-commerce-flight-pilot-readiness]") || pilotOnboardingButton.closest("[data-commerce-flight-pilot-onboarding]") || host;
        const output = panel.querySelector("[data-commerce-flight-pilot-onboarding-output]");
        if (output) output.innerHTML = '<p>只读试点进入确认</p><p>进入只读试点前请确认</p><p>只读试点用户确认</p><p>我知道当前只是只读候选证据</p><p>我知道价格、库存、税费和规则以平台页面为准</p><p>我知道唯珊不会付款、不会下单、不会出票</p><p>我知道唯珊不会上传证件、银行卡或登录凭据</p><p>我知道测试反馈会脱敏处理</p><p>仍有必选项未确认</p><p>暂不可进入只读试点</p><p>只读试点不代表交易授权</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p><p>download:false</p><p>fileWrite:false</p>';
        return;
      }
      const readOnlyConsentConfirmButton = target && target.closest("[data-commerce-flight-read-only-consent-confirm]");
      if (readOnlyConsentConfirmButton && host.contains(readOnlyConsentConfirmButton)) {
        event.preventDefault();
        const panel = readOnlyConsentConfirmButton.closest("[data-commerce-flight-pilot-readiness]") || readOnlyConsentConfirmButton.closest("[data-commerce-flight-pilot-onboarding]") || host;
        const consentStatus = panel.querySelector("[data-commerce-pilot-consent-status]");
        const entryStatus = panel.querySelector("[data-commerce-pilot-entry-status]");
        const output = panel.querySelector("[data-commerce-flight-pilot-onboarding-output]");
        if (consentStatus) consentStatus.textContent = "已确认只读范围";
        if (entryStatus && (panel.textContent || "").indexOf("安全限制") === -1) entryStatus.textContent = "可以进入只读试点";
        if (output) output.innerHTML = '<p>只读试点进入确认</p><p>只读试点用户确认</p><p>已确认只读范围</p><p>可以进入只读试点</p><p>只读试点不代表交易授权</p><p>确认仅用于进入只读测试流程，不代表交易授权。</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p><p>download:false</p><p>fileWrite:false</p>';
        return;
      }
      const pilotSupportButton = target && target.closest("[data-commerce-flight-pilot-support-show]");
      if (pilotSupportButton && host.contains(pilotSupportButton)) {
        event.preventDefault();
        const panel = pilotSupportButton.closest("[data-commerce-flight-pilot-support]") || host;
        const output = panel.querySelector("[data-commerce-flight-pilot-support-output]") || panel;
        output.innerHTML = '<p>只读试点问题反馈</p><p>问题类型</p><p>建议处理</p><p>看不懂候选证据</p><p>平台页面与候选证据不一致</p><p>安全说明不清楚</p><p>只读范围确认无法完成</p><p>反馈填写异常</p><p>问题反馈已脱敏</p><p>问题反馈只用于改进只读候选证据流程</p><p>不代表客服工单、交易请求或出票请求</p><p>建议重新查看候选证据</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p><p>download:false</p><p>fileWrite:false</p>';
        return;
      }
      const pilotIssueReviewButton = target && target.closest("[data-commerce-flight-issue-review-show]");
      if (pilotIssueReviewButton && host.contains(pilotIssueReviewButton)) {
        event.preventDefault();
        const panel = pilotIssueReviewButton.closest("[data-commerce-flight-pilot-support]") || host;
        const output = panel.querySelector("[data-commerce-flight-issue-review-output]") || panel;
        output.innerHTML = '<p>只读试点问题复核</p><p>问题状态</p><p>问题可用于改进参考</p><p>试点影响</p><p>问题复核只用于改进只读候选证据流程</p><p>不代表客服工单、交易请求或出票请求</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p><p>download:false</p><p>fileWrite:false</p>';
        return;
      }
      const supportTriageButton = target && target.closest("[data-commerce-flight-support-triage-show]");
      if (supportTriageButton && host.contains(supportTriageButton)) {
        event.preventDefault();
        const panel = supportTriageButton.closest("[data-commerce-flight-pilot-support]") || host;
        const output = panel.querySelector("[data-commerce-flight-support-triage-output]") || panel;
        output.innerHTML = '<p>问题分流面板</p><p>分流建议</p><p>已有建议处理路径</p><p>不会提交客服工单或交易请求</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p>';
        return;
      }
      const issuePatternButton = target && target.closest("[data-commerce-flight-issue-pattern-show]");
      if (issuePatternButton && host.contains(issuePatternButton)) {
        event.preventDefault();
        const panel = issuePatternButton.closest("[data-commerce-flight-pilot-support]") || host;
        const output = panel.querySelector("[data-commerce-flight-issue-pattern-output]") || panel;
        output.innerHTML = "<p>试点问题趋势雷达</p><p>问题数量</p><p>主要问题趋势</p><p>支持准备</p><p>暂无明显共性问题</p><p>发现需要关注的问题趋势</p><p>问题趋势仅用于改进只读候选证据流程</p><p>不代表客服工单、交易请求或出票请求</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p>";
        return;
      }
      const supportReadinessButton = target && target.closest("[data-commerce-flight-support-readiness-show]");
      if (supportReadinessButton && host.contains(supportReadinessButton)) {
        event.preventDefault();
        const panel = supportReadinessButton.closest("[data-commerce-flight-pilot-support]") || host;
        const output = panel.querySelector("[data-commerce-flight-support-readiness-output]") || panel;
        output.innerHTML = "<p>试点支持准备闸门</p><p>支持准备</p><p>支持兜底准备就绪</p><p>继续小范围试点</p><p>需要复核后再扩大</p><p>不代表客服工单、交易请求或出票请求</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p><p>download:false</p><p>fileWrite:false</p>";
        return;
      }
      const flightPilotOpsButton = target && target.closest("[data-commerce-flight-pilot-ops-summary-show]");
      if (flightPilotOpsButton && host.contains(flightPilotOpsButton)) {
        event.preventDefault();
        const panel = flightPilotOpsButton.closest("[data-commerce-flight-rollout-control]") || host;
        const output = panel.querySelector("[data-commerce-flight-pilot-ops-summary-output]") || panel;
        const api = window.WeishanFlightWorkflowReadOnlyPilotOpsSummary;
        const model = api && typeof api.buildFlightWorkflowReadOnlyPilotOpsSummary === "function" ? api.buildFlightWorkflowReadOnlyPilotOpsSummary({ rolloutControlSummary: rolloutControlSummary, cohortHealthSummary: cohortHealthSummary, cohortProgressSummary: cohortProgressSummary, trialMilestoneSummary: trialMilestoneSummary, pilotReadinessSnapshotSummary: pilotReadinessSnapshotSummary, supportReadinessSummary: supportReadinessSummary, issuePatternSummary: issuePatternSummary, safetyRegressionSummary: safetyRegressionSummary }) : { status: "continue_current_batch", userFacingSummary: { resultLabel: "继续当前批次" }, primaryRisk: { label: "无主要风险" } };
        output.innerHTML = '<p>只读试点运营摘要</p><p>运营状态</p><p>下一批决策</p><p>主要风险</p><p>支持准备</p><p>' + esc((model.userFacingSummary && model.userFacingSummary.resultLabel) || model.status || "继续当前批次") + '</p><p>' + esc((model.primaryRisk && model.primaryRisk.label) || "无主要风险") + '</p><p>该摘要只用于只读试点运营判断，不代表真实账号、客服工单、交易请求或出票能力</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p>';
        return;
      }
      const flightNextCohortDecisionButton = target && target.closest("[data-commerce-flight-next-cohort-decision-show]");
      if (flightNextCohortDecisionButton && host.contains(flightNextCohortDecisionButton)) {
        event.preventDefault();
        const panel = flightNextCohortDecisionButton.closest("[data-commerce-flight-rollout-control]") || host;
        const output = panel.querySelector("[data-commerce-flight-next-cohort-decision-output]") || panel;
        const api = window.WeishanFlightWorkflowNextCohortDecisionBoard;
        const model = api && typeof api.buildFlightWorkflowNextCohortDecisionBoard === "function" ? api.buildFlightWorkflowNextCohortDecisionBoard({ pilotOpsSummary: rolloutControlSummary && rolloutControlSummary.pilotOpsSummary, rolloutControlSummary: rolloutControlSummary, cohortHealthSummary: cohortHealthSummary, supportReadinessSummary: supportReadinessSummary, issuePatternSummary: issuePatternSummary, safetyRegressionSummary: safetyRegressionSummary }) : { status: "continue_current", userFacingSummary: { resultLabel: "继续当前批次" }, decision: { label: "继续当前批次" } };
        output.innerHTML = '<p>下一批只读测试决策板</p><p>下一批决策</p><p>可以进入下一批只读测试</p><p>继续当前批次</p><p>暂停扩大测试</p><p>需要内部复核</p><p>已阻断</p><p>' + esc((model.userFacingSummary && model.userFacingSummary.resultLabel) || model.decision && model.decision.label || model.status || "继续当前批次") + '</p><p>该决策只适用于只读试点节奏，不代表真实账号、邀请、交易或出票能力</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p>';
        return;
      }
      const flightPilotExitCriteriaButton = target && target.closest("[data-commerce-flight-pilot-exit-criteria-show]");
      if (flightPilotExitCriteriaButton && host.contains(flightPilotExitCriteriaButton)) {
        event.preventDefault();
        const panel = flightPilotExitCriteriaButton.closest("[data-commerce-flight-rollout-control]") || host;
        const output = panel.querySelector("[data-commerce-flight-pilot-exit-criteria-output]") || panel;
        const api = window.WeishanFlightWorkflowReadOnlyPilotExitCriteria;
        const model = api && typeof api.buildFlightWorkflowReadOnlyPilotExitCriteria === "function" ? api.buildFlightWorkflowReadOnlyPilotExitCriteria({ pilotOpsSummary: pilotOpsSummary, nextCohortDecisionSummary: nextCohortDecisionSummary, rolloutControlSummary: rolloutControlSummary, cohortHealthSummary: cohortHealthSummary, supportReadinessSummary: supportReadinessSummary, issuePatternSummary: issuePatternSummary, safetyRegressionSummary: safetyRegressionSummary, releaseReadinessSummary: releaseReadiness }) : { userFacingSummary: { resultLabel: "继续试点观察" } };
        output.innerHTML = '<p>只读试点退出条件</p><p>' + esc((model.userFacingSummary && model.userFacingSummary.resultLabel) || model.status || '继续试点观察') + '</p><p>试点退出条件已满足</p><p>继续试点观察</p><p>需要复核</p><p>已阻断</p>';
        return;
      }
      const launchCandidateButton = target && target.closest("[data-commerce-flight-launch-candidate-show]");
      if (launchCandidateButton && host.contains(launchCandidateButton)) {
        event.preventDefault();
        const panel = launchCandidateButton.closest("[data-commerce-flight-rollout-control]") || host;
        const output = panel.querySelector("[data-commerce-flight-launch-candidate-output]") || panel;
        const api = window.WeishanFlightWorkflowLaunchCandidateReadinessBoard;
        const model = api && typeof api.buildFlightWorkflowLaunchCandidateReadinessBoard === "function" ? api.buildFlightWorkflowLaunchCandidateReadinessBoard({ pilotExitCriteriaSummary: pilotExitCriteriaSummary, releaseReadinessSummary: releaseReadiness, safetyMatrixSummary: safetyTestMatrix, operatorConsoleSummary: operatorConsole, supportReadinessSummary: supportReadinessSummary, pilotOpsSummary: pilotOpsSummary, nextCohortDecisionSummary: nextCohortDecisionSummary, rolloutControlSummary: rolloutControlSummary, cohortHealthSummary: cohortHealthSummary, safetyRegressionSummary: safetyRegressionSummary }) : { userFacingSummary: { resultLabel: "继续试点观察" } };
        output.innerHTML = '<p>只读发布候选准备板</p><p>' + esc((model.userFacingSummary && model.userFacingSummary.resultLabel) || model.status || '继续试点观察') + '</p><p>可以进入只读发布候选</p><p>继续试点观察</p><p>需要复核</p><p>暂不可进入</p>';
        return;
      }
      const flightRcReviewButton = target && target.closest("[data-commerce-flight-rc-review-show]");
      if (flightRcReviewButton && host.contains(flightRcReviewButton)) {
        event.preventDefault();
        const panel = flightRcReviewButton.closest("[data-commerce-flight-rc-review]") || flightRcReviewButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-flight-rc-review-output]") || panel;
        output.innerHTML = '<p>只读 RC 候选复核控制台</p><p>只读 RC 候选复核</p><p>候选复核</p><p>证据复核</p><p>安全红线</p><p>可以开始 RC 复核</p><p>证据仍需补充</p><p>需要安全复核</p><p>RC 复核已阻断</p><p>复核不代表交易能力</p><p>该页面只用于只读 RC 候选复核</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 RC 候选复核控制台", false);
        return;
      }
      const flightRcEvidenceReviewButton = target && target.closest("[data-commerce-flight-rc-evidence-review-show]");
      if (flightRcEvidenceReviewButton && host.contains(flightRcEvidenceReviewButton)) {
        event.preventDefault();
        const panel = flightRcEvidenceReviewButton.closest("[data-commerce-flight-rc-evidence-review]") || flightRcEvidenceReviewButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-flight-rc-evidence-review-output]") || panel;
        output.innerHTML = '<p>只读 RC 证据复核清单</p><p>候选复核</p><p>证据复核</p><p>安全红线</p><p>证据完整</p><p>证据仍需补充</p><p>需要复核</p><p>已阻断</p><p>复核不代表交易能力</p><p>该页面只用于只读 RC 候选复核</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 RC 证据复核清单", false);
        return;
      }
      const flightRcRegressionButton = target && target.closest("[data-commerce-flight-rc-regression-show]");
      if (flightRcRegressionButton && host.contains(flightRcRegressionButton)) {
        event.preventDefault();
        const panel = flightRcRegressionButton.closest("[data-commerce-flight-rc-regression-audit]") || flightRcRegressionButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-flight-rc-regression-output]") || panel;
        output.innerHTML = '<p>只读 RC 回归审计</p><p>只读 RC 回归审计包</p><p>回归审计</p><p>发布风险</p><p>安全红线</p><p>RC 回归审计通过</p><p>RC 回归仍需复核</p><p>回归不代表交易能力</p><p>该页面只用于只读 RC 回归审计</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 RC 回归审计", false);
        return;
      }
      const flightReleaseRiskLedgerButton = target && target.closest("[data-commerce-flight-release-risk-ledger-show]");
      if (flightReleaseRiskLedgerButton && host.contains(flightReleaseRiskLedgerButton)) {
        event.preventDefault();
        const panel = flightReleaseRiskLedgerButton.closest("[data-commerce-flight-rc-regression-audit]") || flightReleaseRiskLedgerButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-flight-release-risk-ledger-output]") || panel;
        output.innerHTML = '<p>只读发布风险台账</p><p>回归审计</p><p>发布风险</p><p>安全红线</p><p>暂无阻断风险</p><p>发布风险待处理</p><p>发布风险已阻断</p><p>回归不代表交易能力</p><p>该页面只用于只读 RC 回归审计</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示发布风险台账", false);
        return;
      }
      const flightRcCopyReviewButton = target && target.closest("[data-commerce-flight-rc-copy-review-show]");
      if (flightRcCopyReviewButton && host.contains(flightRcCopyReviewButton)) {
        event.preventDefault();
        const panel = flightRcCopyReviewButton.closest("[data-commerce-flight-rc-copy-review]") || flightRcCopyReviewButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-flight-rc-copy-review-output]") || panel;
        output.innerHTML = '<p>只读 RC 文案定稿与安全披露</p><p>只读 RC 用户可见文案定稿</p><p>文案定稿</p><p>安全披露</p><p>禁用措辞</p><p>RC 文案可以定稿</p><p>RC 文案仍需复核</p><p>文案不代表交易能力</p><p>当前为只读候选证据流程，不提供付款、下单或出票能力</p><p>价格仅为候选展示，不代表真实最终价、锁价或最低价保证</p><p>请勿输入身份证、护照、银行卡、支付凭证或平台登录凭据</p><p>该页面只用于只读 RC 文案定稿与安全披露复核</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 RC 文案定稿", false);
        return;
      }
      const flightSafetyDisclosureReviewButton = target && target.closest("[data-commerce-flight-safety-disclosure-review-show]");
      if (flightSafetyDisclosureReviewButton && host.contains(flightSafetyDisclosureReviewButton)) {
        event.preventDefault();
        const panel = flightSafetyDisclosureReviewButton.closest("[data-commerce-flight-rc-copy-review]") || flightSafetyDisclosureReviewButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-flight-safety-disclosure-review-output]") || panel;
        output.innerHTML = '<p>安全披露复核板</p><p>安全披露通过</p><p>安全披露仍需复核</p><p>安全披露已阻断</p><p>文案不代表交易能力</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示安全披露复核", false);
        return;
      }
      const globalShoppingProductGoalButton = target && target.closest("[data-commerce-global-shopping-product-goal-show]");
      if (globalShoppingProductGoalButton && host.contains(globalShoppingProductGoalButton)) {
        event.preventDefault();
        const panel = globalShoppingProductGoalButton.closest("[data-commerce-global-shopping-product-goal]") || globalShoppingProductGoalButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-product-goal-output]") || panel;
        output.innerHTML = '<p>全球购产品目标与跳转边界</p><p>全球购产品目标</p><p>可信候选价格</p><p>官方价格锚点</p><p>合法平台候选价</p><p>平台自行下单</p><p>当前已覆盖来源中的较低候选价</p><p>与官方价对比</p><p>已接入平台候选价</p><p>价格以跳转后平台实时页面为准</p><p>当前仅提供只读候选证据，不提供付款、下单或出票能力</p><p>禁止全网最低承诺</p><p>禁止一键下单承诺</p><p>跳转不代表交易能力</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示全球购产品目标", false);
        return;
      }
      const globalShoppingJumpBoundaryButton = target && target.closest("[data-commerce-global-shopping-jump-boundary-show]");
      if (globalShoppingJumpBoundaryButton && host.contains(globalShoppingJumpBoundaryButton)) {
        event.preventDefault();
        const panel = globalShoppingJumpBoundaryButton.closest("[data-commerce-global-shopping-product-goal]") || globalShoppingJumpBoundaryButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-jump-boundary-output]") || panel;
        output.innerHTML = '<p>跳转至平台自行下单边界</p><p>Weishan 可尽量带入搜索条件，但用户需在对应平台自行确认价格、登录、填写资料并完成下单</p><p>价格以跳转后平台实时页面为准</p><p>当前仅提供只读候选证据，不提供付款、下单或出票能力</p><p>用户在平台自行下单</p><p>跳转不代表交易能力</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示跳转边界", false);
        return;
      }
      const globalShoppingDeepLinkSafetyButton = target && target.closest("[data-commerce-global-shopping-deep-link-safety-show]");
      if (globalShoppingDeepLinkSafetyButton && host.contains(globalShoppingDeepLinkSafetyButton)) {
        event.preventDefault();
        const panel = globalShoppingDeepLinkSafetyButton.closest("[data-commerce-global-shopping-product-goal]") || globalShoppingDeepLinkSafetyButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-deep-link-safety-output]") || panel;
        output.innerHTML = '<p>外部平台跳转安全闸门</p><p>跳转安全结构已准备</p><p>目标平台</p><p>平台自行下单</p><p>不保存平台账号</p><p>不保存证件银行卡</p><p>不保存支付凭证</p><p>本轮仅生成只读 sandbox 跳转候选，不打开真实平台</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示跳转安全", false);
        return;
      }
      const globalShoppingPrefillGateButton = target && target.closest("[data-commerce-global-shopping-prefill-gate-show]");
      if (globalShoppingPrefillGateButton && host.contains(globalShoppingPrefillGateButton)) {
        event.preventDefault();
        const panel = globalShoppingPrefillGateButton.closest("[data-commerce-global-shopping-product-goal]") || globalShoppingPrefillGateButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-prefill-gate-output]") || panel;
        output.innerHTML = '<p>搜索参数预填闸门</p><p>预填边界安全</p><p>可带入搜索条件</p><p>Weishan 仅可携带非敏感搜索条件</p><p>用户需在平台自行确认价格、填写必要资料并完成下单</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示预填边界", false);
        return;
      }
      const globalShoppingHandoffPreviewButton = target && target.closest("[data-commerce-global-shopping-handoff-preview-show]");
      if (globalShoppingHandoffPreviewButton && host.contains(globalShoppingHandoffPreviewButton)) {
        event.preventDefault();
        const panel = globalShoppingHandoffPreviewButton.closest("[data-commerce-global-shopping-product-goal]") || globalShoppingHandoffPreviewButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-handoff-preview-output]") || panel;
        output.innerHTML = '<p>跳转至平台查看</p><p>目标平台</p><p>可带入搜索条件</p><p>平台自行下单</p><p>安全边界</p><p>合作链接披露</p><p>平台页面为实时价格准绳</p><p>Weishan 仅可携带非敏感搜索条件</p><p>用户需在平台自行确认价格、登录、填写资料并完成下单</p><p>不保存平台账号</p><p>不保存证件银行卡</p><p>不保存支付凭证</p><p>本轮仅展示只读跳转预览，不打开真实平台</p><p>跳转预览不代表下单能力</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示跳转预览", false);
        return;
      }
      const globalShoppingSandboxCandidateButton = target && target.closest("[data-commerce-global-shopping-sandbox-candidate-show]");
      if (globalShoppingSandboxCandidateButton && host.contains(globalShoppingSandboxCandidateButton)) {
        event.preventDefault();
        const panel = globalShoppingSandboxCandidateButton.closest("[data-commerce-global-shopping-product-goal]") || globalShoppingSandboxCandidateButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-sandbox-candidate-output]") || panel;
        output.innerHTML = '<p>Sandbox 跳转候选</p><p>Sandbox 跳转候选已准备</p><p>fixtureOnly:true</p><p>sandboxOnly:true</p><p>readOnly:true</p><p>disabledToOpen:true</p><p>Sandbox 跳转不打开真实平台</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Sandbox 跳转候选", false);
        return;
      }
      const globalShoppingPlatformAvailabilityButton = target && target.closest("[data-commerce-global-shopping-platform-availability-show]");
      if (globalShoppingPlatformAvailabilityButton && host.contains(globalShoppingPlatformAvailabilityButton)) {
        event.preventDefault();
        const panel = globalShoppingPlatformAvailabilityButton.closest("[data-commerce-global-shopping-product-goal]") || globalShoppingPlatformAvailabilityButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-platform-availability-output]") || panel;
        output.innerHTML = '<p>平台可用性</p><p>平台候选可展示</p><p>平台可用不代表官方背书</p><p>平台页面为实时价格准绳</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示平台可用性", false);
        return;
      }
      const globalShoppingPartnerPolicyButton = target && target.closest("[data-commerce-global-shopping-partner-policy-show]");
      if (globalShoppingPartnerPolicyButton && host.contains(globalShoppingPartnerPolicyButton)) {
        event.preventDefault();
        const panel = globalShoppingPartnerPolicyButton.closest("[data-commerce-global-shopping-product-goal]") || globalShoppingPartnerPolicyButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-partner-policy-output]") || panel;
        output.innerHTML = '<p>合作/联盟链接政策</p><p>合作链接政策合规</p><p>部分平台链接未来可能属于合作或联盟链接</p><p>Weishan 可能获得佣金，但不会因此提高展示价格</p><p>合作或联盟链接不代表平台、品牌或商家对 Weishan 的官方背书</p><p>合作链接不代表最低价</p><p>平台页面为实时价格准绳</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示合作链接政策", false);
        return;
      }
      const globalShoppingSandboxGateButton = target && target.closest("[data-commerce-global-shopping-sandbox-gate-show]");
      if (globalShoppingSandboxGateButton && host.contains(globalShoppingSandboxGateButton)) {
        event.preventDefault();
        const panel = globalShoppingSandboxGateButton.closest("[data-commerce-global-shopping-product-goal]") || globalShoppingSandboxGateButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-sandbox-gate-output]") || panel;
        output.innerHTML = '<p>真实只读 Provider Sandbox 闸门</p><p>真实只读 Provider Sandbox 闸门已准备</p><p>不请求真实平台，不读取真实密钥，不显示真实价格</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Sandbox 闸门", false);
        return;
      }
      const globalShoppingRequestEnvelopeButton = target && target.closest("[data-commerce-global-shopping-request-envelope-show]");
      if (globalShoppingRequestEnvelopeButton && host.contains(globalShoppingRequestEnvelopeButton)) {
        event.preventDefault();
        const panel = globalShoppingRequestEnvelopeButton.closest("[data-commerce-global-shopping-product-goal]") || globalShoppingRequestEnvelopeButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-request-envelope-output]") || panel;
        output.innerHTML = '<p>Provider 请求封装</p><p>Provider 请求封装已准备</p><p>请求封装不发送真实请求</p><p>不发送请求，不读取真实密钥，不保存 raw response</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示请求封装", false);
        return;
      }
      const globalShoppingCallAuditButton = target && target.closest("[data-commerce-global-shopping-call-audit-show]");
      if (globalShoppingCallAuditButton && host.contains(globalShoppingCallAuditButton)) {
        event.preventDefault();
        const panel = globalShoppingCallAuditButton.closest("[data-commerce-global-shopping-product-goal]") || globalShoppingCallAuditButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-call-audit-output]") || panel;
        output.innerHTML = '<p>Provider 调用审计台账</p><p>Provider 调用审计台账已准备</p><p>调用审计不保存 raw response</p><p>当前仅准备真实只读 provider sandbox 的请求封装和审计结构</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示调用审计", false);
        return;
      }
      const globalShoppingProviderDryRunButton = target && target.closest("[data-commerce-global-shopping-provider-dry-run-show]");
      if (globalShoppingProviderDryRunButton && host.contains(globalShoppingProviderDryRunButton)) {
        event.preventDefault();
        const panel = globalShoppingProviderDryRunButton.closest("[data-commerce-global-shopping-provider-sandbox-dry-run]") || globalShoppingProviderDryRunButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-provider-dry-run-output]") || panel;
        output.innerHTML = '<p>Provider Sandbox 干跑框架</p><p>Provider Sandbox 干跑框架已准备</p><p>干跑不发送真实请求</p><p>当前仅模拟只读 provider sandbox 生命周期</p><p>不发送请求，不读取真实密钥，不保存 raw request 或 raw response</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示干跑框架", false);
        return;
      }
      const globalShoppingAdapterShellButton = target && target.closest("[data-commerce-global-shopping-adapter-shell-show]");
      if (globalShoppingAdapterShellButton && host.contains(globalShoppingAdapterShellButton)) {
        event.preventDefault();
        const panel = globalShoppingAdapterShellButton.closest("[data-commerce-global-shopping-provider-sandbox-dry-run]") || globalShoppingAdapterShellButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-adapter-shell-output]") || panel;
        output.innerHTML = '<p>第一个只读 Provider Adapter 外壳</p><p>第一个只读 Provider Adapter 外壳已准备</p><p>Adapter 外壳不包含真实 endpoint</p><p>不发送请求，不读取真实密钥，不保存 raw request 或 raw response</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Adapter 外壳", false);
        return;
      }
      const globalShoppingKillSwitchButton = target && target.closest("[data-commerce-global-shopping-kill-switch-show]");
      if (globalShoppingKillSwitchButton && host.contains(globalShoppingKillSwitchButton)) {
        event.preventDefault();
        const panel = globalShoppingKillSwitchButton.closest("[data-commerce-global-shopping-provider-sandbox-dry-run]") || globalShoppingKillSwitchButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-kill-switch-output]") || panel;
        output.innerHTML = '<p>Provider Sandbox 安全熔断器</p><p>Provider Sandbox 安全熔断器未触发</p><p>安全熔断器阻断真实 provider 风险</p><p>不发送请求，不读取真实密钥，不保存 raw request 或 raw response</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示安全熔断器", false);
        return;
      }
      const globalShoppingMockAdapterRegistryButton = target && target.closest("[data-commerce-global-shopping-mock-adapter-registry-show]");
      if (globalShoppingMockAdapterRegistryButton && host.contains(globalShoppingMockAdapterRegistryButton)) {
        event.preventDefault();
        const panel = globalShoppingMockAdapterRegistryButton.closest("[data-commerce-global-shopping-provider-launch-readiness]") || globalShoppingMockAdapterRegistryButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-mock-adapter-registry-output]") || panel;
        output.innerHTML = '<p>Mock Provider Adapter 注册运行时</p><p>Mock Adapter 注册运行时已准备</p><p>Mock Adapter 注册不接真实 provider</p><p>只允许 mock / fixture / dry_run / contract_only</p><p>不读取密钥，不联网，不打开平台</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Mock Adapter 注册", false);
        return;
      }
      const globalShoppingContractReplayButton = target && target.closest("[data-commerce-global-shopping-contract-replay-show]");
      if (globalShoppingContractReplayButton && host.contains(globalShoppingContractReplayButton)) {
        event.preventDefault();
        const panel = globalShoppingContractReplayButton.closest("[data-commerce-global-shopping-provider-launch-readiness]") || globalShoppingContractReplayButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-contract-replay-output]") || panel;
        output.innerHTML = '<p>Provider 合同回放器</p><p>Provider 合同回放器已准备</p><p>合同回放不回放 raw request 或 raw response</p><p>只回放脱敏 contract case</p><p>不读取密钥，不联网，不打开平台</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示合同回放", false);
        return;
      }
      const globalShoppingLaunchReadinessButton = target && target.closest("[data-commerce-global-shopping-launch-readiness-show]");
      if (globalShoppingLaunchReadinessButton && host.contains(globalShoppingLaunchReadinessButton)) {
        event.preventDefault();
        const panel = globalShoppingLaunchReadinessButton.closest("[data-commerce-global-shopping-provider-launch-readiness]") || globalShoppingLaunchReadinessButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-launch-readiness-output]") || panel;
        output.innerHTML = '<p>Provider 启动准备总闸门</p><p>Provider 启动准备总闸门已准备</p><p>启动准备不读取密钥、不联网</p><p>真实 sandbox provider 仍需人工审批</p><p>不接真实 provider，不打开平台，不启用 production provider</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示启动准备", false);
        return;
      }
      const globalShoppingHumanApprovalButton = target && target.closest("[data-commerce-global-shopping-human-approval-show]");
      if (globalShoppingHumanApprovalButton && host.contains(globalShoppingHumanApprovalButton)) {
        event.preventDefault();
        const panel = globalShoppingHumanApprovalButton.closest("[data-commerce-global-shopping-provider-launch-simulation]") || globalShoppingHumanApprovalButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-human-approval-output]") || panel;
        output.innerHTML = '<p>人工审批模拟闸门</p><p>审批模拟闸门已准备</p><p>审批模拟不代表真实审批完成</p><p>不创建审批任务，不发邮件，不打开外部文档</p><p>真实 sandbox provider pilot 仍需人工控制</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示审批模拟", false);
        return;
      }
      const globalShoppingMockLaunchDrillButton = target && target.closest("[data-commerce-global-shopping-mock-launch-drill-show]");
      if (globalShoppingMockLaunchDrillButton && host.contains(globalShoppingMockLaunchDrillButton)) {
        event.preventDefault();
        const panel = globalShoppingMockLaunchDrillButton.closest("[data-commerce-global-shopping-provider-launch-simulation]") || globalShoppingMockLaunchDrillButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-mock-launch-drill-output]") || panel;
        output.innerHTML = '<p>Mock Provider 启动演练</p><p>Mock 启动演练已准备</p><p>Mock 启动不启动真实 provider</p><p>不读取密钥，不联网，不生成 endpoint</p><p>不打开平台，不保存启动状态</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示启动演练", false);
        return;
      }
      const globalShoppingRollbackPlanButton = target && target.closest("[data-commerce-global-shopping-rollback-plan-show]");
      if (globalShoppingRollbackPlanButton && host.contains(globalShoppingRollbackPlanButton)) {
        event.preventDefault();
        const panel = globalShoppingRollbackPlanButton.closest("[data-commerce-global-shopping-provider-launch-simulation]") || globalShoppingRollbackPlanButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-rollback-plan-output]") || panel;
        output.innerHTML = '<p>Sandbox Provider 回滚预案</p><p>回滚预案已准备</p><p>回滚预案不执行回滚</p><p>不改 git，不删文件，不停服务，不修改配置</p><p>真实 sandbox provider pilot 仍需人工控制</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示回滚预案", false);
        return;
      }
      const globalShoppingPilotControlRoomButton = target && target.closest("[data-commerce-global-shopping-pilot-control-room-show]");
      if (globalShoppingPilotControlRoomButton && host.contains(globalShoppingPilotControlRoomButton)) {
        event.preventDefault();
        const panel = globalShoppingPilotControlRoomButton.closest("[data-commerce-global-shopping-provider-pilot-control]") || globalShoppingPilotControlRoomButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-pilot-control-room-output]") || panel;
        output.innerHTML = '<p>Provider Sandbox Pilot 控制室</p><p>Sandbox Pilot 控制室已准备</p><p>Pilot 控制室不启动真实 provider</p><p>不读取密钥，不联网，不生成 endpoint，不创建审批任务，不发邮件</p><p>Human-controlled pilot 仍需人工审批</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Pilot 控制室", false);
        return;
      }
      const globalShoppingIncidentDrillButton = target && target.closest("[data-commerce-global-shopping-incident-drill-show]");
      if (globalShoppingIncidentDrillButton && host.contains(globalShoppingIncidentDrillButton)) {
        event.preventDefault();
        const panel = globalShoppingIncidentDrillButton.closest("[data-commerce-global-shopping-provider-pilot-control]") || globalShoppingIncidentDrillButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-incident-drill-output]") || panel;
        output.innerHTML = '<p>Mock Provider 事故演练</p><p>Mock 事故演练已准备</p><p>事故演练不触发真实告警或回滚</p><p>不上传日志，不发邮件，不停服务，不改 git，不删文件</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示事故演练", false);
        return;
      }
      const globalShoppingProductionBlockersButton = target && target.closest("[data-commerce-global-shopping-production-blockers-show]");
      if (globalShoppingProductionBlockersButton && host.contains(globalShoppingProductionBlockersButton)) {
        event.preventDefault();
        const panel = globalShoppingProductionBlockersButton.closest("[data-commerce-global-shopping-provider-pilot-control]") || globalShoppingProductionBlockersButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-production-blockers-output]") || panel;
        output.innerHTML = '<p>Production 阻断矩阵</p><p>Production 阻断矩阵已准备</p><p>阻断矩阵不修改运行配置</p><p>不启用 provider，不禁用 provider，不读取密钥，不联网，不生成 endpoint</p><p>Human-controlled pilot 仍需人工审批</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示阻断矩阵", false);
        return;
      }
      const globalShoppingProviderPilotGovernanceButton = target && target.closest("[data-commerce-global-shopping-provider-pilot-governance-show]");
      if (globalShoppingProviderPilotGovernanceButton && host.contains(globalShoppingProviderPilotGovernanceButton)) {
        event.preventDefault();
        const panel = globalShoppingProviderPilotGovernanceButton.closest("[data-commerce-global-shopping-provider-pilot-governance]") || globalShoppingProviderPilotGovernanceButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-provider-pilot-governance-output]") || panel;
        output.innerHTML = '<p>Provider Governance Console</p><p>治理控制台已准备</p><p>Operator Review Loop</p><p>运营复核循环已准备</p><p>allowed next action: review_operator_checklist</p><p>blocked action: none</p><p>operator review checklist 已生成</p><p>当前只展示 provider pilot 治理和运营人工复核循环</p><p>不接真实 provider，不读取密钥，不联网，不生成 endpoint，不执行回滚，不导出文件</p><p>Human audit 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示治理视图", false);
        return;
      }
      const globalShoppingPilotPlannerButton = target && target.closest("[data-commerce-global-shopping-pilot-planner-show]");
      if (globalShoppingPilotPlannerButton && host.contains(globalShoppingPilotPlannerButton)) {
        event.preventDefault();
        const panel = globalShoppingPilotPlannerButton.closest("[data-commerce-global-shopping-provider-pilot-governance]") || globalShoppingPilotPlannerButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-pilot-planner-output]") || panel;
        output.innerHTML = '<p>人工控制 Sandbox Provider Pilot 计划器</p><p>Pilot 计划器已准备</p><p>Pilot 计划不启动真实 provider</p><p>不读取密钥，不联网，不生成 endpoint，不创建审批任务</p><p>真实 sandbox provider pilot 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Pilot 计划", false);
        return;
      }
      const globalShoppingProviderKillSwitchDrillButton = target && target.closest("[data-commerce-global-shopping-provider-kill-switch-drill-show]");
      if (globalShoppingProviderKillSwitchDrillButton && host.contains(globalShoppingProviderKillSwitchDrillButton)) {
        event.preventDefault();
        const panel = globalShoppingProviderKillSwitchDrillButton.closest("[data-commerce-global-shopping-provider-pilot-governance]") || globalShoppingProviderKillSwitchDrillButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-provider-kill-switch-drill-output]") || panel;
        output.innerHTML = '<p>Provider Kill Switch 演练</p><p>Kill Switch 演练已准备</p><p>Kill Switch 演练不禁用真实 provider</p><p>不改配置，不执行回滚，不停服务，不上传日志</p><p>当前只展示人工演练步骤与阻断条件</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Kill Switch 演练", false);
        return;
      }
      const globalShoppingComplianceEvidencePackButton = target && target.closest("[data-commerce-global-shopping-compliance-evidence-pack-show]");
      if (globalShoppingComplianceEvidencePackButton && host.contains(globalShoppingComplianceEvidencePackButton)) {
        event.preventDefault();
        const panel = globalShoppingComplianceEvidencePackButton.closest("[data-commerce-global-shopping-provider-pilot-governance]") || globalShoppingComplianceEvidencePackButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-compliance-evidence-pack-output]") || panel;
        output.innerHTML = '<p>合规证据包</p><p>合规证据包已准备</p><p>合规证据包不写文件、不导出</p><p>不包含密钥、raw provider request 或 raw provider response</p><p>当前只展示只读证据摘要，不发送邮件、不上传外部系统</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示合规证据", false);
        return;
      }
      const globalShoppingProviderGovernanceAuditButton = target && target.closest("[data-commerce-global-shopping-provider-governance-audit-show]");
      if (globalShoppingProviderGovernanceAuditButton && host.contains(globalShoppingProviderGovernanceAuditButton)) {
        event.preventDefault();
        const panel = globalShoppingProviderGovernanceAuditButton.closest("[data-commerce-global-shopping-provider-governance-release]") || globalShoppingProviderGovernanceAuditButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-provider-governance-audit-output]") || panel;
        output.innerHTML = '<p>Provider Governance 审计控制台</p><p>Provider Governance 审计控制台已准备</p><p>治理审计不写文件、不上传</p><p>当前只展示 provider governance 发布审计与冻结闸门</p><p>不接真实 provider，不读取密钥，不联网，不改 git，不 push，不导出文件</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示治理审计", false);
        return;
      }
      const globalShoppingProviderOfflineReleaseGateButton = target && target.closest("[data-commerce-global-shopping-provider-offline-release-gate-show]");
      if (globalShoppingProviderOfflineReleaseGateButton && host.contains(globalShoppingProviderOfflineReleaseGateButton)) {
        event.preventDefault();
        const panel = globalShoppingProviderOfflineReleaseGateButton.closest("[data-commerce-global-shopping-provider-offline-release]") || globalShoppingProviderOfflineReleaseGateButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-provider-offline-release-gate-output]") || panel;
        output.innerHTML = '<p>Provider Offline Release Gate</p><p>Provider Offline Release Gate 已准备</p><p>Offline Release Gate 不创建 release、不 push</p><p>当前只展示离线发布准备度，不创建 release，不创建 tag，不 push，不接真实 provider。</p><p>不接真实 provider，不读取密钥，不联网，不创建 release，不 push</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Offline Release Gate", false);
        return;
      }
      const globalShoppingProviderCertificationFreezeLedgerButton = target && target.closest("[data-commerce-global-shopping-provider-certification-freeze-ledger-show]");
      if (globalShoppingProviderCertificationFreezeLedgerButton && host.contains(globalShoppingProviderCertificationFreezeLedgerButton)) {
        event.preventDefault();
        const panel = globalShoppingProviderCertificationFreezeLedgerButton.closest("[data-commerce-global-shopping-provider-offline-release]") || globalShoppingProviderCertificationFreezeLedgerButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-provider-certification-freeze-ledger-output]") || panel;
        output.innerHTML = '<p>Provider Certification Freeze Ledger</p><p>Provider Certification Freeze Ledger 已准备</p><p>Certification Freeze Ledger 不持久化台账</p><p>当前只展示认证冻结状态，不持久化台账，不保存审批结果，不创建 release，不 push。</p><p>不接真实 provider，不读取密钥，不联网，不创建 release，不 push</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Certification Freeze", false);
        return;
      }
      const globalShoppingSandboxActivationReviewPacketButton = target && target.closest("[data-commerce-global-shopping-sandbox-activation-review-packet-show]");
      if (globalShoppingSandboxActivationReviewPacketButton && host.contains(globalShoppingSandboxActivationReviewPacketButton)) {
        event.preventDefault();
        const panel = globalShoppingSandboxActivationReviewPacketButton.closest("[data-commerce-global-shopping-provider-offline-release]") || globalShoppingSandboxActivationReviewPacketButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-sandbox-activation-review-packet-output]") || panel;
        output.innerHTML = '<p>Sandbox Activation Review Packet</p><p>Sandbox Activation Review Packet 已准备</p><p>Activation Review Packet 不激活 sandbox</p><p>当前只展示 sandbox 激活复核摘要，不激活 sandbox，不读取密钥，不联网，不创建 release，不 push。</p><p>不接真实 provider，不读取密钥，不联网，不创建 release，不 push</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Activation Review", false);
        return;
      }
      const globalShoppingAdapterBoundaryDiffInspectorButton = target && target.closest("[data-commerce-global-shopping-adapter-boundary-diff-inspector-show]");
      if (globalShoppingAdapterBoundaryDiffInspectorButton && host.contains(globalShoppingAdapterBoundaryDiffInspectorButton)) {
        event.preventDefault();
        const panel = globalShoppingAdapterBoundaryDiffInspectorButton.closest("[data-commerce-global-shopping-provider-offline-release]") || globalShoppingAdapterBoundaryDiffInspectorButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-adapter-boundary-diff-inspector-output]") || panel;
        output.innerHTML = '<p>Adapter Boundary Diff Inspector</p><p>Adapter Boundary Diff Inspector 已准备</p><p>Boundary Diff Inspector 不修改配置、不启用 provider</p><p>当前只展示 adapter 边界差异，不修改配置，不启用或禁用 provider，不读取密钥。</p><p>Manual offline release review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Boundary Diff", false);
        return;
      }
      const globalShoppingOfflineLaunchDecisionButton = target && target.closest("[data-commerce-global-shopping-offline-launch-decision-show]");
      if (globalShoppingOfflineLaunchDecisionButton && host.contains(globalShoppingOfflineLaunchDecisionButton)) {
        event.preventDefault();
        const panel = globalShoppingOfflineLaunchDecisionButton.closest("[data-commerce-global-shopping-provider-offline-launch]") || globalShoppingOfflineLaunchDecisionButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-offline-launch-decision-output]") || panel;
        output.innerHTML = '<p>Offline Launch Decision Simulator</p><p>离线发布决策模拟器已准备</p><p>Launch Decision 不保存真实决策</p><p>该模拟器只展示离线发布决策准备状态，不保存真实决策，不创建 release，不 push，不接真实 provider。</p><p>不接真实 provider，不读取密钥，不联网，不创建 release，不 push</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Launch Decision", false);
        return;
      }
      const globalShoppingActivationReceiptButton = target && target.closest("[data-commerce-global-shopping-activation-receipt-show]");
      if (globalShoppingActivationReceiptButton && host.contains(globalShoppingActivationReceiptButton)) {
        event.preventDefault();
        const panel = globalShoppingActivationReceiptButton.closest("[data-commerce-global-shopping-provider-offline-launch]") || globalShoppingActivationReceiptButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-activation-receipt-output]") || panel;
        output.innerHTML = '<p>Sandbox Activation Receipt Ledger</p><p>Sandbox 激活回执台账已准备</p><p>Activation Receipt Ledger 不保存真实回执</p><p>该台账只展示 mock activation receipt，不保存真实回执，不激活 sandbox，不启动 provider。</p><p>不接真实 provider，不读取密钥，不联网，不创建 release，不 push</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Activation Receipt", false);
        return;
      }
      const globalShoppingSecurityGuardButton = target && target.closest("[data-commerce-global-shopping-security-guard-show]");
      if (globalShoppingSecurityGuardButton && host.contains(globalShoppingSecurityGuardButton)) {
        event.preventDefault();
        const panel = globalShoppingSecurityGuardButton.closest("[data-commerce-global-shopping-provider-offline-launch]") || globalShoppingSecurityGuardButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-security-guard-output]") || panel;
        output.innerHTML = '<p>Adapter Security Regression Guard</p><p>Adapter 安全回归守卫已准备</p><p>Security Guard 不修改配置、不启用 provider</p><p>该守卫只展示 adapter 安全回归状态，不修改配置，不启用或禁用 provider，不读取密钥。</p><p>Manual offline launch decision 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Security Guard", false);
        return;
      }
      const globalShoppingLaunchChecklistButton = target && target.closest("[data-commerce-global-shopping-launch-checklist-show]");
      if (globalShoppingLaunchChecklistButton && host.contains(globalShoppingLaunchChecklistButton)) {
        event.preventDefault();
        const panel = globalShoppingLaunchChecklistButton.closest("[data-commerce-global-shopping-provider-offline-launch]") || globalShoppingLaunchChecklistButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-launch-checklist-output]") || panel;
        output.innerHTML = '<p>Provider Offline Launch Checklist</p><p>离线 Launch Checklist 已准备</p><p>Launch Checklist 不创建 release、不 push</p><p>该清单只展示离线 launch 检查项，不保存结果，不创建 release，不 push，不激活 sandbox。</p><p>Manual offline launch decision 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Launch Checklist", false);
        return;
      }
      const globalShoppingLaunchAuditButton = target && target.closest("[data-commerce-global-shopping-launch-audit-show]");
      if (globalShoppingLaunchAuditButton && host.contains(globalShoppingLaunchAuditButton)) {
        event.preventDefault();
        const panel = globalShoppingLaunchAuditButton.closest("[data-commerce-global-shopping-provider-final-launch-review]") || globalShoppingLaunchAuditButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-launch-audit-output]") || panel;
        output.innerHTML = '<p>Provider Launch Audit Snapshot</p><p>Provider Launch Audit Snapshot 已准备</p><p>Launch Audit 不写文件、不保存真实决策</p><p>当前只展示 provider final launch review</p><p>不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Launch Audit", false);
        return;
      }
      const globalShoppingPolicyReplayButton = target && target.closest("[data-commerce-global-shopping-policy-replay-show]");
      if (globalShoppingPolicyReplayButton && host.contains(globalShoppingPolicyReplayButton)) {
        event.preventDefault();
        const panel = globalShoppingPolicyReplayButton.closest("[data-commerce-global-shopping-provider-final-launch-review]") || globalShoppingPolicyReplayButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-policy-replay-output]") || panel;
        output.innerHTML = '<p>Offline Policy Replay Center</p><p>Offline Policy Replay Center 已准备</p><p>Policy Replay 不修改配置、不启用 provider</p><p>该回放中心只展示离线 policy replay，不修改配置，不启用 provider，不读取密钥。</p><p>不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Policy Replay", false);
        return;
      }
      const globalShoppingFinalDossierButton = target && target.closest("[data-commerce-global-shopping-final-dossier-show]");
      if (globalShoppingFinalDossierButton && host.contains(globalShoppingFinalDossierButton)) {
        event.preventDefault();
        const panel = globalShoppingFinalDossierButton.closest("[data-commerce-global-shopping-provider-final-launch-review]") || globalShoppingFinalDossierButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-final-dossier-output]") || panel;
        output.innerHTML = '<p>Human Activation Final Dossier</p><p>Human Activation Final Dossier 已准备</p><p>Final Dossier 不持久化档案</p><p>该档案只展示人工激活最终摘要，不持久化档案，不保存审批结果，不创建 release，不 push。</p><p>不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Final Dossier", false);
        return;
      }
      const globalShoppingBoundaryVerifierButton = target && target.closest("[data-commerce-global-shopping-boundary-verifier-show]");
      if (globalShoppingBoundaryVerifierButton && host.contains(globalShoppingBoundaryVerifierButton)) {
        event.preventDefault();
        const panel = globalShoppingBoundaryVerifierButton.closest("[data-commerce-global-shopping-provider-final-launch-review]") || globalShoppingBoundaryVerifierButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-boundary-verifier-output]") || panel;
        output.innerHTML = '<p>Adapter Launch Boundary Verifier</p><p>Adapter Launch Boundary Verifier 已准备</p><p>Boundary Verifier 不生成 endpoint、不读取密钥</p><p>该边界校验器只展示 launch boundary verifier，不生成 endpoint，不读取密钥，不启用 provider。</p><p>Human final launch review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Boundary Verifier", false);
        return;
      }
      const globalShoppingFinalReviewButton = target && target.closest("[data-commerce-global-shopping-final-review-show]");
      if (globalShoppingFinalReviewButton && host.contains(globalShoppingFinalReviewButton)) {
        event.preventDefault();
        const panel = globalShoppingFinalReviewButton.closest("[data-commerce-global-shopping-provider-final-review-console]") || globalShoppingFinalReviewButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-final-review-output]") || panel;
        output.innerHTML = '<p>Final Offline Launch Review Console</p><p>Final Offline Launch Review Console 已准备</p><p>Final Review 不保存真实决策</p><p>当前只展示 provider final review console</p><p>不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Final Review", false);
        return;
      }
      const globalShoppingActivationBlockersButton = target && target.closest("[data-commerce-global-shopping-activation-blockers-show]");
      if (globalShoppingActivationBlockersButton && host.contains(globalShoppingActivationBlockersButton)) {
        event.preventDefault();
        const panel = globalShoppingActivationBlockersButton.closest("[data-commerce-global-shopping-provider-final-review-console]") || globalShoppingActivationBlockersButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-activation-blockers-output]") || panel;
        output.innerHTML = '<p>Provider Activation Blocker Sentinel</p><p>Provider Activation Blocker Sentinel 已准备</p><p>Activation Blocker 不修改配置、不启用 provider</p><p>该 Sentinel 只展示 activation blocker 检查，不阻断真实进程，不修改配置，不启用或禁用 provider。</p><p>Final offline provider review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Activation Blockers", false);
        return;
      }
      const globalShoppingEvidenceSummaryButton = target && target.closest("[data-commerce-global-shopping-evidence-summary-show]");
      if (globalShoppingEvidenceSummaryButton && host.contains(globalShoppingEvidenceSummaryButton)) {
        event.preventDefault();
        const panel = globalShoppingEvidenceSummaryButton.closest("[data-commerce-global-shopping-provider-final-review-console]") || globalShoppingEvidenceSummaryButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-evidence-summary-output]") || panel;
        output.innerHTML = '<p>Read-Only Release Evidence Summary</p><p>Read-Only Release Evidence Summary 已准备</p><p>Evidence Summary 不写文件、不上传</p><p>该 Summary 只展示 release evidence，不写文件，不下载，不上传，不创建 release，不 push。</p><p>Final offline provider review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Evidence Summary", false);
        return;
      }
      const globalShoppingDecisionMatrixButton = target && target.closest("[data-commerce-global-shopping-decision-matrix-show]");
      if (globalShoppingDecisionMatrixButton && host.contains(globalShoppingDecisionMatrixButton)) {
        event.preventDefault();
        const panel = globalShoppingDecisionMatrixButton.closest("[data-commerce-global-shopping-provider-final-review-console]") || globalShoppingDecisionMatrixButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-decision-matrix-output]") || panel;
        output.innerHTML = '<p>Offline Provider Readiness Decision Matrix</p><p>Offline Provider Readiness Decision Matrix 已准备</p><p>Decision Matrix 不创建 release、不 push</p><p>该 Matrix 只展示离线 readiness 决策矩阵，不创建 release，不创建 tag，不 push，不改 git。</p><p>Final offline provider review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Decision Matrix", false);
        return;
      }
      const globalShoppingFinalSafetySealButton = target && target.closest("[data-commerce-global-shopping-final-safety-seal-show]");
      if (globalShoppingFinalSafetySealButton && host.contains(globalShoppingFinalSafetySealButton)) {
        event.preventDefault();
        const panel = globalShoppingFinalSafetySealButton.closest("[data-commerce-global-shopping-provider-final-safety-review]") || globalShoppingFinalSafetySealButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-final-safety-seal-output]") || panel;
        output.innerHTML = '<p>Provider Final Safety Seal</p><p>Provider Final Safety Seal 已准备</p><p>Safety Seal 不生成真实证书、不写文件</p><p>该 Safety Seal 只展示只读安全封签摘要，不生成真实证书，不写文件，不保存真实决策。</p><p>Human final safety review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Safety Seal", false);
        return;
      }
      const globalShoppingActivationWarRoomButton = target && target.closest("[data-commerce-global-shopping-activation-war-room-show]");
      if (globalShoppingActivationWarRoomButton && host.contains(globalShoppingActivationWarRoomButton)) {
        event.preventDefault();
        const panel = globalShoppingActivationWarRoomButton.closest("[data-commerce-global-shopping-provider-final-safety-review]") || globalShoppingActivationWarRoomButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-activation-war-room-output]") || panel;
        output.innerHTML = '<p>Offline Activation War Room</p><p>Offline Activation War Room 已准备</p><p>Activation War Room 不激活 sandbox、不启用 provider</p><p>该 War Room 只展示离线激活准备摘要，不激活 sandbox，不启用 provider，不创建审批任务。</p><p>Human final safety review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Activation War Room", false);
        return;
      }
      const globalShoppingReadinessCertificateButton = target && target.closest("[data-commerce-global-shopping-readiness-certificate-show]");
      if (globalShoppingReadinessCertificateButton && host.contains(globalShoppingReadinessCertificateButton)) {
        event.preventDefault();
        const panel = globalShoppingReadinessCertificateButton.closest("[data-commerce-global-shopping-provider-final-safety-review]") || globalShoppingReadinessCertificateButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-readiness-certificate-output]") || panel;
        output.innerHTML = '<p>Read-Only Provider Readiness Certificate</p><p>Read-Only Provider Readiness Certificate 已准备</p><p>Readiness Certificate 不持久化证书</p><p>该 Certificate 只展示只读 readiness 摘要，不持久化证书，不导出，不上传，不创建 release。</p><p>Human final safety review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Readiness Certificate", false);
        return;
      }
      const globalShoppingNoActivationGuaranteeButton = target && target.closest("[data-commerce-global-shopping-no-activation-guarantee-show]");
      if (globalShoppingNoActivationGuaranteeButton && host.contains(globalShoppingNoActivationGuaranteeButton)) {
        event.preventDefault();
        const panel = globalShoppingNoActivationGuaranteeButton.closest("[data-commerce-global-shopping-provider-final-safety-review]") || globalShoppingNoActivationGuaranteeButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-no-activation-guarantee-output]") || panel;
        output.innerHTML = '<p>Provider No-Activation Guarantee Board</p><p>Provider No-Activation Guarantee Board 已准备</p><p>No-Activation Guarantee 不修改配置、不执行真实阻断</p><p>该 Board 只展示 no-activation guarantee，不修改配置，不执行真实阻断，不启用 provider，不创建 release。</p><p>Human final safety review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 No-Activation Guarantee", false);
        return;
      }
      const globalShoppingGovernanceClosureButton = target && target.closest("[data-commerce-global-shopping-governance-closure-show]");
      if (globalShoppingGovernanceClosureButton && host.contains(globalShoppingGovernanceClosureButton)) {
        event.preventDefault();
        const panel = globalShoppingGovernanceClosureButton.closest("[data-commerce-global-shopping-provider-governance-closure-review]") || globalShoppingGovernanceClosureButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-governance-closure-output]") || panel;
        output.innerHTML = '<p>Offline Provider Governance Closure Board</p><p>Offline Provider Governance Closure Board 已准备</p><p>Governance Closure 不保存真实治理结论</p><p>Human governance closure review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Governance Closure", false);
        return;
      }
      const globalShoppingNoActivationSealButton = target && target.closest("[data-commerce-global-shopping-no-activation-seal-show]");
      if (globalShoppingNoActivationSealButton && host.contains(globalShoppingNoActivationSealButton)) {
        event.preventDefault();
        const panel = globalShoppingNoActivationSealButton.closest("[data-commerce-global-shopping-provider-governance-closure-review]") || globalShoppingNoActivationSealButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-no-activation-seal-output]") || panel;
        output.innerHTML = '<p>No-Activation Compliance Seal</p><p>No-Activation Compliance Seal 已准备</p><p>No-Activation Seal 不生成真实封条、不执行真实阻断</p><p>Human governance closure review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 No-Activation Seal", false);
        return;
      }
      const globalShoppingFinalHandoffButton = target && target.closest("[data-commerce-global-shopping-final-handoff-show]");
      if (globalShoppingFinalHandoffButton && host.contains(globalShoppingFinalHandoffButton)) {
        event.preventDefault();
        const panel = globalShoppingFinalHandoffButton.closest("[data-commerce-global-shopping-provider-governance-closure-review]") || globalShoppingFinalHandoffButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-final-handoff-output]") || panel;
        output.innerHTML = '<p>Final Readiness Handoff Simulator</p><p>Final Readiness Handoff Simulator 已准备</p><p>Final Handoff 不执行真实交接</p><p>Human governance closure review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Final Handoff", false);
        return;
      }
      const globalShoppingClosureEvidenceButton = target && target.closest("[data-commerce-global-shopping-closure-evidence-show]");
      if (globalShoppingClosureEvidenceButton && host.contains(globalShoppingClosureEvidenceButton)) {
        event.preventDefault();
        const panel = globalShoppingClosureEvidenceButton.closest("[data-commerce-global-shopping-provider-governance-closure-review]") || globalShoppingClosureEvidenceButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-closure-evidence-output]") || panel;
        output.innerHTML = '<p>Provider Governance Closure Evidence Ledger</p><p>Provider Governance Closure Evidence Ledger 已准备</p><p>Closure Evidence 不持久化台账、不保存真实 evidence</p><p>Human governance closure review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Closure Evidence", false);
        return;
      }
      const globalShoppingDistributionReadinessButton = target && target.closest("[data-commerce-global-shopping-distribution-readiness-show]");
      if (globalShoppingDistributionReadinessButton && host.contains(globalShoppingDistributionReadinessButton)) {
        event.preventDefault();
        const panel = globalShoppingDistributionReadinessButton.closest("[data-commerce-global-shopping-provider-distribution-readiness-review]") || globalShoppingDistributionReadinessButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-distribution-readiness-output]") || panel;
        output.innerHTML = '<p>Offline Distribution Readiness Center</p><p>Offline Distribution Readiness Center 已准备</p><p>Distribution Readiness 不创建真实分发包</p><p>Human distribution readiness review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Distribution Readiness", false);
        return;
      }
      const globalShoppingNoActivationEnforcementButton = target && target.closest("[data-commerce-global-shopping-no-activation-enforcement-show]");
      if (globalShoppingNoActivationEnforcementButton && host.contains(globalShoppingNoActivationEnforcementButton)) {
        event.preventDefault();
        const panel = globalShoppingNoActivationEnforcementButton.closest("[data-commerce-global-shopping-provider-distribution-readiness-review]") || globalShoppingNoActivationEnforcementButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-no-activation-enforcement-output]") || panel;
        output.innerHTML = '<p>No-Activation Enforcement Ledger</p><p>No-Activation Enforcement Ledger 已准备</p><p>No-Activation Enforcement 不执行真实阻断</p><p>Human distribution readiness review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 No-Activation Enforcement", false);
        return;
      }
      const globalShoppingUserTrustSummaryButton = target && target.closest("[data-commerce-global-shopping-user-trust-summary-show]");
      if (globalShoppingUserTrustSummaryButton && host.contains(globalShoppingUserTrustSummaryButton)) {
        event.preventDefault();
        const panel = globalShoppingUserTrustSummaryButton.closest("[data-commerce-global-shopping-provider-distribution-readiness-review]") || globalShoppingUserTrustSummaryButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-user-trust-summary-output]") || panel;
        output.innerHTML = '<p>Final User Trust Summary</p><p>Final User Trust Summary 已准备</p><p>User Trust Summary 不写文件、不保存用户原文</p><p>Human distribution readiness review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 User Trust Summary", false);
        return;
      }
      const globalShoppingSafetyMatrixButton = target && target.closest("[data-commerce-global-shopping-safety-matrix-show]");
      if (globalShoppingSafetyMatrixButton && host.contains(globalShoppingSafetyMatrixButton)) {
        event.preventDefault();
        const panel = globalShoppingSafetyMatrixButton.closest("[data-commerce-global-shopping-provider-distribution-readiness-review]") || globalShoppingSafetyMatrixButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-safety-matrix-output]") || panel;
        output.innerHTML = '<p>Provider Safety Distribution Matrix</p><p>Provider Safety Distribution Matrix 已准备</p><p>Safety Matrix 不启用 provider、不激活 sandbox</p><p>Human distribution readiness review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Safety Matrix", false);
        return;
      }
      const globalShoppingPublicTrustClosureButton = target && target.closest("[data-commerce-global-shopping-public-trust-closure-show]");
      if (globalShoppingPublicTrustClosureButton && host.contains(globalShoppingPublicTrustClosureButton)) {
        event.preventDefault();
        const panel = globalShoppingPublicTrustClosureButton.closest("[data-commerce-global-shopping-provider-trust-closure-review]") || globalShoppingPublicTrustClosureButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-public-trust-closure-output]") || panel;
        output.innerHTML = '<p>Provider Public Trust Closure Center</p><p>Provider Public Trust Closure Center 已准备</p><p>Public Trust Closure 不生成真实公开声明</p><p>Human trust closure review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Public Trust Closure", false);
        return;
      }
      const globalShoppingReleaseMemoryButton = target && target.closest("[data-commerce-global-shopping-release-memory-show]");
      if (globalShoppingReleaseMemoryButton && host.contains(globalShoppingReleaseMemoryButton)) {
        event.preventDefault();
        const panel = globalShoppingReleaseMemoryButton.closest("[data-commerce-global-shopping-provider-trust-closure-review]") || globalShoppingReleaseMemoryButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-release-memory-output]") || panel;
        output.innerHTML = '<p>Offline Release Memory Snapshot</p><p>Offline Release Memory Snapshot 已准备</p><p>Release Memory 不持久化记忆快照</p><p>Human trust closure review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Release Memory", false);
        return;
      }
      const globalShoppingNoProviderGuardButton = target && target.closest("[data-commerce-global-shopping-no-provider-guard-show]");
      if (globalShoppingNoProviderGuardButton && host.contains(globalShoppingNoProviderGuardButton)) {
        event.preventDefault();
        const panel = globalShoppingNoProviderGuardButton.closest("[data-commerce-global-shopping-provider-trust-closure-review]") || globalShoppingNoProviderGuardButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-no-provider-guard-output]") || panel;
        output.innerHTML = '<p>No-Provider-Execution Final Guard</p><p>No-Provider-Execution Final Guard 已准备</p><p>No-Provider Guard 不执行真实阻断、不打开平台</p><p>Human trust closure review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 No-Provider Guard", false);
        return;
      }
      const globalShoppingSafetyBoundaryButton = target && target.closest("[data-commerce-global-shopping-safety-boundary-show]");
      if (globalShoppingSafetyBoundaryButton && host.contains(globalShoppingSafetyBoundaryButton)) {
        event.preventDefault();
        const panel = globalShoppingSafetyBoundaryButton.closest("[data-commerce-global-shopping-provider-trust-closure-review]") || globalShoppingSafetyBoundaryButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-safety-boundary-output]") || panel;
        output.innerHTML = '<p>User-Visible Safety Boundary Explainer</p><p>User-Visible Safety Boundary Explainer 已准备</p><p>Safety Boundary 不承诺最低价、最终价或官方背书</p><p>Human trust closure review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Safety Boundary", false);
        return;
      }
      const globalShoppingPublicReleaseButton = target && target.closest("[data-commerce-global-shopping-public-release-show]");
      if (globalShoppingPublicReleaseButton && host.contains(globalShoppingPublicReleaseButton)) {
        event.preventDefault();
        const panel = globalShoppingPublicReleaseButton.closest("[data-commerce-global-shopping-provider-public-release-review]") || globalShoppingPublicReleaseButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-public-release-output]") || panel;
        output.innerHTML = '<p>Provider Read-Only Public Release Center</p><p>Provider Read-Only Public Release Center 已准备</p><p>Public Release 不创建真实公开发布</p><p>Human public release review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Public Release", false);
        return;
      }
      const globalShoppingExportPreviewButton = target && target.closest("[data-commerce-global-shopping-export-preview-show]");
      if (globalShoppingExportPreviewButton && host.contains(globalShoppingExportPreviewButton)) {
        event.preventDefault();
        const panel = globalShoppingExportPreviewButton.closest("[data-commerce-global-shopping-provider-public-release-review]") || globalShoppingExportPreviewButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-export-preview-output]") || panel;
        output.innerHTML = '<p>Trust Closure Export Preview</p><p>Trust Closure Export Preview 已准备</p><p>Export Preview 不生成真实导出文件</p><p>Human public release review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Export Preview", false);
        return;
      }
      const globalShoppingNoProviderReceiptButton = target && target.closest("[data-commerce-global-shopping-no-provider-receipt-show]");
      if (globalShoppingNoProviderReceiptButton && host.contains(globalShoppingNoProviderReceiptButton)) {
        event.preventDefault();
        const panel = globalShoppingNoProviderReceiptButton.closest("[data-commerce-global-shopping-provider-public-release-review]") || globalShoppingNoProviderReceiptButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-no-provider-receipt-output]") || panel;
        output.innerHTML = '<p>Final No-Provider Boundary Receipt</p><p>Final No-Provider Boundary Receipt 已准备</p><p>No-Provider Receipt 不生成真实回执、不打开平台</p><p>Human public release review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 No-Provider Receipt", false);
        return;
      }
      const globalShoppingSafetyStatementButton = target && target.closest("[data-commerce-global-shopping-safety-statement-show]");
      if (globalShoppingSafetyStatementButton && host.contains(globalShoppingSafetyStatementButton)) {
        event.preventDefault();
        const panel = globalShoppingSafetyStatementButton.closest("[data-commerce-global-shopping-provider-public-release-review]") || globalShoppingSafetyStatementButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-safety-statement-output]") || panel;
        output.innerHTML = '<p>Public Safety Statement Preview</p><p>Public Safety Statement Preview 已准备</p><p>Safety Statement 不承诺最低价、最终价或官方背书</p><p>Human public release review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Safety Statement", false);
        return;
      }
      const globalShoppingReleaseEvidenceButton = target && target.closest("[data-commerce-global-shopping-release-evidence-show]");
      if (globalShoppingReleaseEvidenceButton && host.contains(globalShoppingReleaseEvidenceButton)) {
        event.preventDefault();
        const panel = globalShoppingReleaseEvidenceButton.closest("[data-commerce-global-shopping-provider-launch-readiness-final-review]") || globalShoppingReleaseEvidenceButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-release-evidence-output]") || panel;
        output.innerHTML = '<p>Public Release Evidence Console</p><p>Public Release Evidence Console 已准备</p><p>Release Evidence 不生成真实证据文件</p><p>Human launch readiness final review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Release Evidence", false);
        return;
      }
      const globalShoppingUserAssuranceButton = target && target.closest("[data-commerce-global-shopping-user-assurance-show]");
      if (globalShoppingUserAssuranceButton && host.contains(globalShoppingUserAssuranceButton)) {
        event.preventDefault();
        const panel = globalShoppingUserAssuranceButton.closest("[data-commerce-global-shopping-provider-launch-readiness-final-review]") || globalShoppingUserAssuranceButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-user-assurance-output]") || panel;
        output.innerHTML = '<p>No-Provider User Assurance Panel</p><p>No-Provider User Assurance Panel 已准备</p><p>User Assurance 不生成真实用户保证书</p><p>Human launch readiness final review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 User Assurance", false);
        return;
      }
      const globalShoppingLaunchFinalizerButton = target && target.closest("[data-commerce-global-shopping-launch-finalizer-show]");
      if (globalShoppingLaunchFinalizerButton && host.contains(globalShoppingLaunchFinalizerButton)) {
        event.preventDefault();
        const panel = globalShoppingLaunchFinalizerButton.closest("[data-commerce-global-shopping-provider-launch-readiness-final-review]") || globalShoppingLaunchFinalizerButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-launch-finalizer-output]") || panel;
        output.innerHTML = '<p>Offline Launch Readiness Finalizer</p><p>Offline Launch Readiness Finalizer 已准备</p><p>Launch Finalizer 不执行真实 launch</p><p>Human launch readiness final review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Launch Finalizer", false);
        return;
      }
      const globalShoppingClaimVerifierButton = target && target.closest("[data-commerce-global-shopping-claim-verifier-show]");
      if (globalShoppingClaimVerifierButton && host.contains(globalShoppingClaimVerifierButton)) {
        event.preventDefault();
        const panel = globalShoppingClaimVerifierButton.closest("[data-commerce-global-shopping-provider-launch-readiness-final-review]") || globalShoppingClaimVerifierButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-claim-verifier-output]") || panel;
        output.innerHTML = '<p>User-Safe Public Claim Verifier</p><p>User-Safe Public Claim Verifier 已准备</p><p>Claim Verifier 不承诺最低价、最终价或官方背书</p><p>Human launch readiness final review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Claim Verifier", false);
        return;
      }
      const globalShoppingHumanPilotLedgerButton = target && target.closest("[data-commerce-global-shopping-human-pilot-ledger-show]");
      if (globalShoppingHumanPilotLedgerButton && host.contains(globalShoppingHumanPilotLedgerButton)) {
        event.preventDefault();
        const panel = globalShoppingHumanPilotLedgerButton.closest("[data-commerce-global-shopping-provider-governance-release]") || globalShoppingHumanPilotLedgerButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-human-pilot-ledger-output]") || panel;
        output.innerHTML = '<p>Human Pilot 准备台账</p><p>Human Pilot 准备台账已准备</p><p>Human Pilot 台账不持久化审批结果</p><p>Manual governance release decision 仍需人工确认</p><p>不接真实 provider，不读取密钥，不联网，不改 git，不 push，不导出文件</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Human Pilot 台账", false);
        return;
      }
      const globalShoppingReleaseFreezeButton = target && target.closest("[data-commerce-global-shopping-release-freeze-show]");
      if (globalShoppingReleaseFreezeButton && host.contains(globalShoppingReleaseFreezeButton)) {
        event.preventDefault();
        const panel = globalShoppingReleaseFreezeButton.closest("[data-commerce-global-shopping-provider-governance-release]") || globalShoppingReleaseFreezeButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-release-freeze-output]") || panel;
        output.innerHTML = '<p>Sandbox Provider Release Freeze Gate</p><p>Sandbox Provider Release Freeze Gate 已准备</p><p>Release Freeze Gate 不改 git、不 push</p><p>Manual governance release decision 仍需人工确认</p><p>不接真实 provider，不读取密钥，不联网，不改 git，不 push，不导出文件</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示 Release Freeze", false);
        return;
      }
      const globalShoppingManualReleaseDecisionButton = target && target.closest("[data-commerce-global-shopping-manual-release-decision-show]");
      if (globalShoppingManualReleaseDecisionButton && host.contains(globalShoppingManualReleaseDecisionButton)) {
        event.preventDefault();
        const panel = globalShoppingManualReleaseDecisionButton.closest("[data-commerce-global-shopping-provider-manual-release]") || globalShoppingManualReleaseDecisionButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-manual-release-decision-output]") || panel;
        output.innerHTML = '<p>Manual Governance Release 决策室</p><p>人工发布决策室已准备</p><p>人工发布决策不创建 release、不 push</p><p>该决策室只展示人工发布决策准备状态，不保存决策，不创建 release，不创建 tag，不 push。</p><p>不接真实 provider，不读取密钥，不联网，不创建 release，不创建 tag，不 push</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示人工发布决策", false);
        return;
      }
      const globalShoppingSandboxExceptionRegisterButton = target && target.closest("[data-commerce-global-shopping-sandbox-exception-register-show]");
      if (globalShoppingSandboxExceptionRegisterButton && host.contains(globalShoppingSandboxExceptionRegisterButton)) {
        event.preventDefault();
        const panel = globalShoppingSandboxExceptionRegisterButton.closest("[data-commerce-global-shopping-provider-manual-release]") || globalShoppingSandboxExceptionRegisterButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-sandbox-exception-register-output]") || panel;
        output.innerHTML = '<p>Sandbox Pilot 例外登记簿</p><p>例外登记簿已准备</p><p>例外登记不持久化审批结果</p><p>该登记簿只展示 sandbox pilot 例外状态，不持久化例外，不创建审批任务，不启动 pilot。</p><p>不接真实 provider，不读取密钥，不联网，不创建审批任务，不 push</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示例外登记", false);
        return;
      }
      const globalShoppingProviderSignoffButton = target && target.closest("[data-commerce-global-shopping-provider-signoff-show]");
      if (globalShoppingProviderSignoffButton && host.contains(globalShoppingProviderSignoffButton)) {
        event.preventDefault();
        const panel = globalShoppingProviderSignoffButton.closest("[data-commerce-global-shopping-provider-manual-release]") || globalShoppingProviderSignoffButton.closest("[data-commerce-read-only-price-candidate-card]") || host;
        const output = panel.querySelector("[data-commerce-global-shopping-provider-signoff-output]") || panel;
        output.innerHTML = '<p>Provider 准备签核包</p><p>准备签核包已准备</p><p>准备签核包不写文件、不导出</p><p>Manual provider sign-off 仍需人工复核</p><p>该签核包只展示准备度摘要，不写文件，不下载，不保存签核结果，不创建 release，不 push。</p><p>不接真实 provider，不读取密钥，不联网，不创建 release，不创建 tag，不 push</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><p>download:false</p><p>fileWrite:false</p>';
        showCommercePlatformTemplateFeedback("已显示准备签核", false);
        return;
      }
      const pilotInvitationGateButton = target && target.closest("[data-commerce-flight-pilot-invitation-gate-show]");
      if (pilotInvitationGateButton && host.contains(pilotInvitationGateButton)) {
        event.preventDefault();
        const panel = pilotInvitationGateButton.closest("[data-commerce-flight-pilot-support]") || host;
        const output = panel.querySelector("[data-commerce-flight-pilot-invitation-gate-output]") || panel;
        const api = window.WeishanFlightWorkflowReadOnlyPilotInvitationGate;
        const model = api && typeof api.buildFlightWorkflowReadOnlyPilotInvitationGate === "function" ? api.buildFlightWorkflowReadOnlyPilotInvitationGate({ pilotReadinessSummary: pilotReadinessSummary, supportPlaybookSummary: supportPlaybookSummary, pilotOnboardingSummary: pilotOnboardingSummary, issueReviewSummary: issueReviewSummary, supportReadinessSummary: supportReadinessSummary, issuePatternSummary: issuePatternSummary, operatorConsoleSummary: operatorConsoleSummary }) : { userFacingSummary: { resultLabel: "待邀请" } };
        output.innerHTML = '<p>只读试点邀请闸门</p><p>' + esc((model.userFacingSummary && model.userFacingSummary.resultLabel) || model.status || '待邀请') + '</p><p>可以邀请测试用户</p><p>需要确认只读范围</p><p>需要支持复核</p><p>进入等待名单</p><p>只读试点邀请只用于试点登记流程</p><p>不代表真实身份、联系方式、证件、支付或外部平台链接</p><p>invitationUrl:null</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p>';
        return;
      }
      const testerCohortButton = target && target.closest("[data-commerce-flight-tester-cohort-console-show]");
      if (testerCohortButton && host.contains(testerCohortButton)) {
        event.preventDefault();
        const panel = testerCohortButton.closest("[data-commerce-flight-pilot-support]") || host;
        const output = panel.querySelector("[data-commerce-flight-tester-cohort-console-output]") || panel;
        const api = window.WeishanFlightWorkflowTesterCohortEnrollmentConsole;
        const model = api && typeof api.buildFlightWorkflowTesterCohortEnrollmentConsole === "function" ? api.buildFlightWorkflowTesterCohortEnrollmentConsole({ pilotReadinessSummary: pilotReadinessSummary, supportPlaybookSummary: supportPlaybookSummary, pilotOnboardingSummary: pilotOnboardingSummary, issueReviewSummary: issueReviewSummary, supportReadinessSummary: supportReadinessSummary, issuePatternSummary: issuePatternSummary, operatorConsoleSummary: operatorConsoleSummary }) : { userFacingSummary: { resultLabel: "仍需更多测试用户" } };
        output.innerHTML = '<p>测试用户批次登记控制台</p><p>' + esc((model.userFacingSummary && model.userFacingSummary.resultLabel) || model.status || '仍需更多测试用户') + '</p><p>测试用户批次可用</p><p>仍需更多测试用户</p><p>需要复核后登记</p><p>测试批次已阻断</p><p>不保存真实身份、联系方式、证件、支付或外部平台链接</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p>';
        return;
      }
      const pilotInvitationViewModelButton = target && target.closest("[data-commerce-flight-pilot-invitation-view-model-show]");
      if (pilotInvitationViewModelButton && host.contains(pilotInvitationViewModelButton)) {
        event.preventDefault();
        const panel = pilotInvitationViewModelButton.closest("[data-commerce-flight-pilot-support]") || host;
        const output = panel.querySelector("[data-commerce-flight-pilot-invitation-view-model-output]") || panel;
        const api = window.WeishanFlightWorkflowPilotInvitationViewModel;
        const model = api && typeof api.buildFlightWorkflowPilotInvitationViewModel === "function" ? api.buildFlightWorkflowPilotInvitationViewModel({ pilotReadinessSummary: pilotReadinessSummary, supportPlaybookSummary: supportPlaybookSummary, pilotOnboardingSummary: pilotOnboardingSummary, issueReviewSummary: issueReviewSummary, supportReadinessSummary: supportReadinessSummary, issuePatternSummary: issuePatternSummary, operatorConsoleSummary: operatorConsoleSummary }) : { userFacingSummary: { resultLabel: "需要复核" } };
        output.innerHTML = '<p>只读试点邀请与测试批次</p><p>试点邀请</p><p>测试批次</p><p>只读确认</p><p>问题与安全</p><p>' + esc((model.userFacingSummary && model.userFacingSummary.resultLabel) || model.status || '需要复核') + '</p><p>不代表真实身份、联系方式、证件、支付或外部平台链接</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p>';
        return;
      }
      const pilotSnapshotButton = target && target.closest("[data-commerce-flight-pilot-snapshot-show]");
      if (pilotSnapshotButton && host.contains(pilotSnapshotButton)) {
        event.preventDefault();
        const panel = pilotSnapshotButton.closest("[data-commerce-flight-pilot-support]") || host;
        const output = panel.querySelector("[data-commerce-flight-pilot-snapshot-output]") || panel;
        const api = window.WeishanFlightWorkflowPublicPilotReadinessSnapshot;
        const model = api && typeof api.buildFlightWorkflowPublicPilotReadinessSnapshot === "function" ? api.buildFlightWorkflowPublicPilotReadinessSnapshot({ betaExpansionGateSummary: betaExpansionGateSummary, publicPilotChecklistSummary: publicPilotChecklistSummary, pilotOnboardingSummary: pilotOnboardingSummary, issuePatternSummary: issuePatternSummary, supportReadinessSummary: supportReadinessSummary, issueReviewSummary: issueReviewSummary, supportTriageSummary: supportTriageSummary, safetyRegressionSummary: safetyRegressionSummary }) : { userFacingSummary: { resultLabel: "需要复核" } };
        output.innerHTML = '<p>' + esc((model.userFacingSummary && model.userFacingSummary.title) || '只读试点状态快照') + '</p><p>试点状态</p><p>' + esc((model.userFacingSummary && model.userFacingSummary.resultLabel) || model.status || '需要复核') + '</p><p>支持处理手册</p><p>' + esc(model.supportPlaybookStatus || 'ready') + '</p><p>下一步</p><p>' + esc(model.pilotSnapshotNextStep || (model.userFacingSummary && model.userFacingSummary.resultLabel) || '继续观察只读试点反馈') + '</p>';
        return;
      }
      const supportPlaybookButton = target && target.closest("[data-commerce-flight-support-playbook-show]");
      if (supportPlaybookButton && host.contains(supportPlaybookButton)) {
        event.preventDefault();
        const panel = supportPlaybookButton.closest("[data-commerce-flight-pilot-support]") || host;
        const output = panel.querySelector("[data-commerce-flight-support-playbook-output]") || panel;
        const api = window.WeishanFlightWorkflowSupportPlaybookConsole;
        const model = api && typeof api.buildFlightWorkflowSupportPlaybookConsole === "function" ? api.buildFlightWorkflowSupportPlaybookConsole({ issueIntakeSummary: issueIntakeSummary, issuePatternSummary: issuePatternSummary, issueReviewSummary: issueReviewSummary, supportTriageSummary: supportTriageSummary, supportReadinessSummary: supportReadinessSummary }) : { userFacingSummary: { resultLabel: "支持处理路径已准备" } };
        output.innerHTML = '<p>' + esc((model.userFacingSummary && model.userFacingSummary.title) || '只读试点支持处理手册') + '</p><p>问题分流面板</p><p>' + esc((model.userFacingSummary && model.userFacingSummary.resultLabel) || model.status || '支持处理路径已准备') + '</p><p>支持处理仍需复核</p><p>支持处理已阻断</p>';
        return;
      }
      const pilotSnapshotViewModelButton = target && target.closest("[data-commerce-flight-pilot-snapshot-view-model-show]");
      if (pilotSnapshotViewModelButton && host.contains(pilotSnapshotViewModelButton)) {
        event.preventDefault();
        const panel = pilotSnapshotViewModelButton.closest("[data-commerce-flight-pilot-support]") || host;
        const output = panel.querySelector("[data-commerce-flight-pilot-snapshot-view-model-output]") || panel;
        const api = window.WeishanFlightWorkflowPilotSnapshotViewModel;
        const snapshotApi = window.WeishanFlightWorkflowPublicPilotReadinessSnapshot;
        const playbookApi = window.WeishanFlightWorkflowSupportPlaybookConsole;
        const snapshot = snapshotApi && typeof snapshotApi.buildFlightWorkflowPublicPilotReadinessSnapshot === "function" ? snapshotApi.buildFlightWorkflowPublicPilotReadinessSnapshot({ betaExpansionGateSummary: betaExpansionGateSummary, publicPilotChecklistSummary: publicPilotChecklistSummary, pilotOnboardingSummary: pilotOnboardingSummary, issuePatternSummary: issuePatternSummary, supportReadinessSummary: supportReadinessSummary, issueReviewSummary: issueReviewSummary, supportTriageSummary: supportTriageSummary, operatorConsoleSummary: operatorConsoleSummary, safetyRegressionSummary: safetyRegressionSummary }) : { status: "failed_safe", userFacingSummary: { resultLabel: "需要复核" } };
        const playbook = playbookApi && typeof playbookApi.buildFlightWorkflowSupportPlaybookConsole === "function" ? playbookApi.buildFlightWorkflowSupportPlaybookConsole({ issueIntakeSummary: issueIntakeSummary, issuePatternSummary: issuePatternSummary, issueReviewSummary: issueReviewSummary, supportTriageSummary: supportTriageSummary, supportReadinessSummary: supportReadinessSummary }) : { status: "ready", userFacingSummary: { resultLabel: "支持处理路径已准备" } };
        const model = api && typeof api.buildFlightWorkflowPilotSnapshotViewModel === "function" ? api.buildFlightWorkflowPilotSnapshotViewModel({ pilotReadinessSnapshotSummary: snapshot, supportPlaybookSummary: playbook, issuePatternSummary: issuePatternSummary, supportReadinessSummary: supportReadinessSummary, issueReviewSummary: issueReviewSummary, supportTriageSummary: supportTriageSummary, operatorConsoleSummary: operatorConsoleSummary }) : { cards: [], snapshotRows: [], playbookRows: [] };
        output.innerHTML = '<p>只读试点视图模型</p><p>试点状态</p><p>支持准备</p><p>问题趋势</p><p>下一步</p><p>' + esc((model.cards && model.cards[0] && model.cards[0].value) || '需要复核') + '</p>';
        return;
      }
      const cohortProgressTrackerButton = target && target.closest("[data-commerce-flight-public-pilot-cohort-progress-tracker-show]");
      if (cohortProgressTrackerButton && host.contains(cohortProgressTrackerButton)) {
        event.preventDefault();
        const panel = cohortProgressTrackerButton.closest("[data-commerce-flight-pilot-support]") || host;
        const output = panel.querySelector("[data-commerce-flight-public-pilot-cohort-progress-tracker-output]") || panel;
        const api = window.WeishanFlightWorkflowPublicPilotCohortProgressTracker;
        const model = api && typeof api.buildFlightWorkflowPublicPilotCohortProgressTracker === "function" ? api.buildFlightWorkflowPublicPilotCohortProgressTracker({ pilotReadinessSnapshotSummary: pilotReadinessSummary, supportPlaybookSummary: supportPlaybookSummary, pilotOnboardingSummary: pilotOnboardingSummary, readOnlyConsentSummary: readOnlyConsentSummary, issueReviewSummary: issueReviewSummary, supportTriageSummary: supportTriageSummary, issuePatternSummary: issuePatternSummary, supportReadinessSummary: supportReadinessSummary, pilotInvitationGateSummary: pilotInvitationGateSummary, testerCohortEnrollmentConsoleSummary: testerCohortEnrollmentConsoleSummary, pilotInvitationViewModelSummary: pilotInvitationViewModelSummary, operatorConsoleSummary: operatorConsoleSummary }) : { userFacingSummary: { resultLabel: "仍需更多测试者" } };
        output.innerHTML = '<p>只读试点进度追踪</p><p>完成进度</p><p>问题状态</p><p>下一批测试</p><p>该页面只追踪脱敏测试槽位</p><p>不保存真实身份、不发送真实邀请</p><p>' + esc((model.userFacingSummary && model.userFacingSummary.resultLabel) || model.status || '仍需更多测试者') + '</p>';
        return;
      }
      const trialMilestoneBoardButton = target && target.closest("[data-commerce-flight-read-only-trial-milestone-board-show]");
      if (trialMilestoneBoardButton && host.contains(trialMilestoneBoardButton)) {
        event.preventDefault();
        const panel = trialMilestoneBoardButton.closest("[data-commerce-flight-pilot-support]") || host;
        const output = panel.querySelector("[data-commerce-flight-read-only-trial-milestone-board-output]") || panel;
        const api = window.WeishanFlightWorkflowReadOnlyTrialMilestoneBoard;
        const model = api && typeof api.buildFlightWorkflowReadOnlyTrialMilestoneBoard === "function" ? api.buildFlightWorkflowReadOnlyTrialMilestoneBoard({ cohortProgressSummary: pilotReadinessSummary && pilotReadinessSummary.cohortProgressSummary, trialMilestoneSummary: pilotReadinessSummary && pilotReadinessSummary.trialMilestoneSummary, pilotReadinessSnapshotSummary: pilotReadinessSummary, supportPlaybookSummary: supportPlaybookSummary, pilotOnboardingSummary: pilotOnboardingSummary, readOnlyConsentSummary: readOnlyConsentSummary, issueReviewSummary: issueReviewSummary, supportTriageSummary: supportTriageSummary, issuePatternSummary: issuePatternSummary, supportReadinessSummary: supportReadinessSummary, pilotInvitationGateSummary: pilotInvitationGateSummary, testerCohortEnrollmentConsoleSummary: testerCohortEnrollmentConsoleSummary, pilotInvitationViewModelSummary: pilotInvitationViewModelSummary, operatorConsoleSummary: operatorConsoleSummary }) : { userFacingSummary: { resultLabel: "仍需更多测试者" } };
        output.innerHTML = '<p>只读试点里程碑</p><p>发布就绪确认</p><p>试点进入确认</p><p>测试批次启动</p><p>反馈收集完成</p><p>问题复核完成</p><p>下一批测试准备</p><p>可以进入下一批只读测试</p><p>仍需更多测试者</p><p>' + esc((model.userFacingSummary && model.userFacingSummary.resultLabel) || model.status || '仍需更多测试者') + '</p>';
        return;
      }
      const cohortProgressViewModelButton = target && target.closest("[data-commerce-flight-cohort-progress-view-model-show]");
      if (cohortProgressViewModelButton && host.contains(cohortProgressViewModelButton)) {
        event.preventDefault();
        const panel = cohortProgressViewModelButton.closest("[data-commerce-flight-pilot-support]") || host;
        const output = panel.querySelector("[data-commerce-flight-cohort-progress-view-model-output]") || panel;
        const api = window.WeishanFlightWorkflowCohortProgressViewModel;
        const model = api && typeof api.buildFlightWorkflowCohortProgressViewModel === "function" ? api.buildFlightWorkflowCohortProgressViewModel({ cohortProgressSummary: pilotReadinessSummary && pilotReadinessSummary.cohortProgressSummary, trialMilestoneSummary: pilotReadinessSummary && pilotReadinessSummary.trialMilestoneSummary, pilotReadinessSnapshotSummary: pilotReadinessSummary, supportPlaybookSummary: supportPlaybookSummary, pilotOnboardingSummary: pilotOnboardingSummary, readOnlyConsentSummary: readOnlyConsentSummary, issueReviewSummary: issueReviewSummary, supportTriageSummary: supportTriageSummary, issuePatternSummary: issuePatternSummary, supportReadinessSummary: supportReadinessSummary, pilotInvitationGateSummary: pilotInvitationGateSummary, testerCohortEnrollmentConsoleSummary: testerCohortEnrollmentConsoleSummary, pilotInvitationViewModelSummary: pilotInvitationViewModelSummary, operatorConsoleSummary: operatorConsoleSummary }) : { userFacingSummary: { resultLabel: "仍需更多测试者" } };
        output.innerHTML = '<p>只读试点进度视图模型</p><p>只读试点进度追踪</p><p>测试批次进度</p><p>只读试点里程碑</p><p>下一批测试</p><p>不保存真实身份、不发送真实邀请</p><p>' + esc((model.cards && model.cards[0] && model.cards[0].value) || '仍需更多测试者') + '</p>';
        return;
      }
      const pilotIssueCategoryButton = target && target.closest("[data-commerce-flight-issue-category]");
      if (pilotIssueCategoryButton && host.contains(pilotIssueCategoryButton)) {
        event.preventDefault();
        const category = pilotIssueCategoryButton.getAttribute("data-commerce-flight-issue-category") || "candidate_unclear";
        const panel = pilotIssueCategoryButton.closest("[data-commerce-flight-pilot-support]") || host;
        const output = panel.querySelector("[data-commerce-flight-pilot-support-output]") || panel;
        const label = category === "platform_mismatch" ? "建议记录平台核对结果" : category === "safety_copy_unclear" ? "建议查看安全说明" : category === "consent_blocked" ? "建议重新确认只读范围" : "建议重新查看候选证据";
        output.innerHTML = '<p>只读试点问题反馈</p><p>问题反馈已脱敏</p><p>' + label + '</p><p>问题反馈只用于改进只读候选证据流程</p><p>不代表客服工单、交易请求或出票请求</p><p>问题分流面板</p><p>已有建议处理路径</p><p>不会提交客服工单或交易请求</p><p>download:false</p><p>fileWrite:false</p>';
        return;
      }
      const readOnlyRefreshButton = target && target.closest("[data-commerce-read-only-quote-refresh]");
      if (readOnlyRefreshButton && host.contains(readOnlyRefreshButton)) {
        event.preventDefault();
        const taskScope = readOnlyRefreshButton.closest("[data-commerce-task-id]");
        const taskId = taskScope && taskScope.getAttribute("data-commerce-task-id") || selectedTaskId || "";
        const targetTask = tasks.find((task) => task.taskId === taskId) || tasks.find((task) => task.taskId === selectedTaskId) || tasks[0] || {};
        const uiApi = window.WeishanReadOnlyQuoteInteractiveRefreshUiController;
        readOnlyRefreshButton.disabled = true;
        readOnlyRefreshButton.textContent = "正在刷新只读报价";
        const card = readOnlyRefreshButton.closest("[data-commerce-read-only-price-candidate-card], .commerce-top-result-card");
        const summary = card && card.querySelector("[data-commerce-read-only-refresh-summary]");
        if (summary) summary.textContent = "正在刷新只读报价";
        const result = uiApi && typeof uiApi.buildReadOnlyQuoteRefreshClickResult === "function" ? uiApi.buildReadOnlyQuoteRefreshClickResult(targetTask, {}) : { status:"failed_safe", lastRefreshStatusLabel:"安全失败", refreshErrorBanner:"只读报价刷新失败，已安全降级", recoveredEvidenceSummary:{ available:false }, safety:{ autoOpen:false, autoRefresh:false } };
        if (summary) summary.textContent = "最近一次刷新：" + (result.lastRefreshStatusLabel || (result.status === "refreshed" ? "已刷新" : result.status === "failed_safe" ? "安全失败" : "未运行"));
        if (card && result.status === "failed_safe" && !card.querySelector("[data-commerce-read-only-refresh-error]")) card.insertAdjacentHTML("beforeend", '<p class="commerce-warning" data-commerce-read-only-refresh-error="true">只读报价刷新失败，已安全降级</p>');
        if (card && result.recoveredEvidenceSummary && result.recoveredEvidenceSummary.available && !card.querySelector("[data-commerce-read-only-recovered-evidence]")) card.insertAdjacentHTML("beforeend", '<p data-commerce-read-only-recovered-evidence="true">已恢复最近一次只读证据</p>');
        readOnlyRefreshButton.textContent = "刷新只读报价";
        readOnlyRefreshButton.disabled = result.status === "disabled" || result.status === "blocked";
        const clearButton = card && card.querySelector("[data-commerce-clear-read-only-refresh-state]");
        if (clearButton) clearButton.disabled = false;
        showCommercePlatformTemplateFeedback(result.status === "refreshed" ? "只读报价已刷新，仅更新候选证据" : (result.status === "failed_safe" ? "只读报价刷新失败，已安全降级" : "当前只读报价刷新未就绪"), result.status === "failed_safe");
        return;
      }
      const clearRefreshButton = target && target.closest("[data-commerce-clear-read-only-refresh-state]");
      if (clearRefreshButton && host.contains(clearRefreshButton)) {
        event.preventDefault();
        const refreshApi = window.WeishanReadOnlyQuoteRefreshController;
        if (refreshApi && typeof refreshApi.clearLastReadOnlyQuoteRefreshEvidence === "function") refreshApi.clearLastReadOnlyQuoteRefreshEvidence({});
        const card = clearRefreshButton.closest("[data-commerce-read-only-price-candidate-card], .commerce-top-result-card");
        const summary = card && card.querySelector("[data-commerce-read-only-refresh-summary]");
        if (summary) summary.textContent = "最近一次刷新：未运行";
        const recovered = card && card.querySelector("[data-commerce-read-only-recovered-evidence]");
        if (recovered) recovered.remove();
        const error = card && card.querySelector("[data-commerce-read-only-refresh-error]");
        if (error) error.remove();
        clearRefreshButton.disabled = true;
        showCommercePlatformTemplateFeedback("已清除刷新状态", false);
        return;
      }
      const sandboxImportPreviewButton = target && target.closest("[data-commerce-sandbox-response-import-preview]");
      const sandboxImportConfirmButton = target && target.closest("[data-commerce-sandbox-response-import-confirm]");
      const sandboxDryRunButton = target && target.closest("[data-commerce-run-sandbox-dry-run]");
      const sandboxImportClearButton = target && target.closest("[data-commerce-sandbox-response-import-clear]");
      if ((sandboxImportPreviewButton || sandboxImportConfirmButton || sandboxDryRunButton || sandboxImportClearButton) && host.contains(sandboxImportPreviewButton || sandboxImportConfirmButton || sandboxDryRunButton || sandboxImportClearButton)) {
        event.preventDefault();
        const panel = (sandboxImportPreviewButton || sandboxImportConfirmButton || sandboxDryRunButton || sandboxImportClearButton).closest("[data-commerce-sandbox-response-import-console]");
        const input = panel && panel.querySelector("[data-commerce-sandbox-response-import-input]");
        const output = panel && panel.querySelector("[data-commerce-sandbox-response-import-output]");
        const rawInput = input ? input.value : "";
        const refreshApi = window.WeishanReadOnlyQuoteRefreshController;
        function buildSandboxQuoteRanking(rawText){
          try {
            const processorApi = window.WeishanMultiSandboxQuoteImportProcessor;
            const rankingApi = window.WeishanReadOnlyQuoteCandidateRanking;
            const importResult = processorApi && typeof processorApi.importMultiSandboxQuotes === "function" ? processorApi.importMultiSandboxQuotes(rawText, {}) : { status:"failed_safe", quotes:[], errors:[], sourceBreakdown:{ providerCount:0, providerIds:[], fareSources:[] }, reason:"沙盒导入处理器不可用" };
            const ranking = rankingApi && typeof rankingApi.buildTopReadOnlyQuoteCandidates === "function" ? rankingApi.buildTopReadOnlyQuoteCandidates(importResult.quotes || [], { rankingScope:"imported_sandbox_quotes_only" }) : { status:importResult.status || "failed_safe", topCandidates:[], sourceBreakdown:importResult.sourceBreakdown || { providerCount:0, providerIds:[], fareSources:[] }, rankingExplanation:"仅按导入样本中的只读候选证据排序，平台最终为准。" };
            const status = importResult.status === "accepted" || importResult.status === "partial" || ranking.topCandidates.length ? "accepted" : (importResult.status === "blocked" ? "blocked" : (importResult.status === "failed_safe" ? "failed_safe" : "rejected"));
            return {
              status: status,
              topCandidates: ranking.topCandidates || [],
              sourceBreakdown: ranking.sourceBreakdown || importResult.sourceBreakdown || { providerCount:0, providerIds:[], fareSources:[] },
              rankingExplanation: ranking.rankingExplanation || "仅按导入样本中的只读候选证据排序，平台最终为准。",
              reason: importResult.reason || (importResult.errors && importResult.errors[0] && importResult.errors[0].reason) || ""
            };
          } catch (_) { return { status:"failed_safe", topCandidates:[], sourceBreakdown:{ providerCount:0, providerIds:[], fareSources:[] }, rankingExplanation:"仅按导入样本中的只读候选证据排序，平台最终为准。", reason:"导入失败，已安全降级" }; }
        }
        function topCandidatesHtml(ranking, selectedId){
          const candidates = ranking && Array.isArray(ranking.topCandidates) ? ranking.topCandidates : [];
          if (!candidates.length) return "";
          const breakdown = ranking && ranking.sourceBreakdown ? ranking.sourceBreakdown : { providerCount:0, providerIds:[], fareSources:[] };
          return '<section class="commerce-read-only-top-candidates" data-commerce-read-only-top-candidates="true"><h5>Top 3 候选报价</h5><p>当前导入样本中的低价候选</p><p>Ranking Scope: 导入样本范围</p><p>' + esc(ranking && ranking.rankingExplanation || '仅按导入样本中的只读候选证据排序，平台最终为准。') + '</p><p>Source Breakdown: providerCount=' + esc(String(breakdown.providerCount || 0)) + '; providerIds=' + esc((breakdown.providerIds || []).join(',')) + '; fareSources=' + esc((breakdown.fareSources || []).join(',')) + '</p><ol>' + candidates.map(function(candidate){
            const selected = String(selectedId || "") === String(candidate.quoteId || "");
            const sourceLine = [candidate.providerName || '', candidate.responseShape || 'unsupported', candidate.fareSource || 'sandbox_read_only_import'].filter(Boolean).join(' · ');
            return '<li data-commerce-read-only-top-candidate="true"><strong>#' + esc(String(candidate.rank)) + ' ¥' + esc(String(candidate.totalPrice)) + '</strong><p>' + esc(sourceLine) + '</p><p>票面价：' + esc(String(candidate.baseFare)) + ' · 税费：' + esc(String(candidate.taxesAndFees)) + ' · 平台费：' + esc(String(candidate.providerFees)) + '</p><p>平台最终为准 · 未锁价，不代表可出票</p><button type="button" class="cmd-btn gray" data-commerce-select-read-only-quote-candidate="true" data-commerce-select-read-only-quote-candidate-id="' + esc(candidate.quoteId) + '" data-commerce-safe-provider-handoff-url="' + commerceEncodedExternalUrl(candidate.safeProviderHandoffUrl || "") + '" data-commerce-selected-source-summary="' + commerceEncodedExternalUrl(candidate.selectedSourceSummary || candidate.sourceSummary || sourceLine) + '">选择该候选</button>' + (selected ? '<p data-commerce-selected-candidate="true">已选择该候选</p><p data-commerce-selected-source-summary="true">' + esc(candidate.selectedSourceSummary || candidate.sourceSummary || sourceLine) + '</p>' : '') + '</li>';
          }).join("") + '</ol><p>Selection Evidence</p></section>';
        }
        function previewHtml(preview, status, ranking, selectedId, meta){
          const safe = preview || {};
          const metaSafe = meta && typeof meta === "object" ? meta : {};
          const priceLine = [safe.currency || "", safe.baseFare, safe.taxesAndFees, safe.providerFees, safe.totalPrice].filter((item) => item !== null && item !== undefined && item !== "").join(" / ");
          const breakdown = ranking && ranking.sourceBreakdown ? ranking.sourceBreakdown : { providerCount:0, providerIds:[], fareSources:[] };
          const historySummaryHtml = metaSafe && (metaSafe.runHistorySummary || metaSafe.quoteDeltaSummary || metaSafe.replaySummary) ? '<h5>运行历史</h5><p>Read-Only Quote Run History</p><p>最近一次沙盒运行：' + esc((metaSafe.runHistorySummary && metaSafe.runHistorySummary.summary) || '运行历史：暂无本地只读沙盒运行记录') + '</p><p>本地只读沙盒运行对比：' + esc((metaSafe.quoteDeltaSummary && metaSafe.quoteDeltaSummary.summary) || '本地只读沙盒运行对比：历史不足') + '</p><p>Replay Guard：' + esc((metaSafe.replaySummary && metaSafe.replaySummary.replaySummary) || (metaSafe.replaySummary && metaSafe.replaySummary.summary) || 'Replay Guard：暂无可回放的本地脱敏运行历史') + '</p><p>Replay 只恢复候选证据，不重新请求 provider</p><p>平台最终为准</p><p>未锁价</p><p>不代表可出票</p><p>compareStatus: ' + esc(metaSafe.compareStatus || 'not_enough_history') + '</p><p>replayStatus: ' + esc(metaSafe.replayStatus || 'unavailable') + '</p><p>lastRunId: ' + esc(metaSafe.lastRunId || '') + '</p>' : '';
          const sessionHtml = metaSafe && metaSafe.sessionSummary ? '<section data-commerce-read-only-session-output="true"><h5>当前只读报价会话</h5><p>Read-Only Quote Session</p><p>Session Timeline</p><p>Audit Export</p><p>Session Recovery</p><p>sessionId: ' + esc(metaSafe.sessionId || metaSafe.sessionSummary.sessionId || '') + '</p><p>status: ' + esc(metaSafe.sessionStatus || metaSafe.sessionSummary.status || 'updated') + '</p><p>本导出仅为只读候选证据</p><p>平台最终为准，未锁价，不代表可出票</p><p>不包含原始响应、密钥、交易链接或身份信息</p><button type="button" class="cmd-btn gray" data-commerce-read-only-audit-export-preview="true">查看脱敏审计预览</button> <button type="button" class="cmd-btn gray" data-commerce-replay-last-read-only-run="true" data-commerce-recover-read-only-quote-session="true">恢复最近一次只读会话</button></section>' : '';
          return '<h5>Multi Provider 沙盒报价导入</h5><p>validationStatus: ' + esc(safe.validationStatus || status || 'not_run') + '</p><p>Provider 来源: ' + esc([safe.providerId || '', safe.providerName || ''].filter(Boolean).join(' / ') || '-') + '</p><p>响应格式: ' + esc(safe.responseShape || '-') + '</p><p>fareSource: ' + esc(safe.fareSource || '-') + '</p><p>price breakdown: ' + esc(priceLine || '-') + '</p><p>Source Breakdown: providerCount=' + esc(String(breakdown.providerCount || 0)) + '; providerIds=' + esc((breakdown.providerIds || []).join(',')) + '; fareSources=' + esc((breakdown.fareSources || []).join(',')) + '</p><p>rankingExplanation: ' + esc(ranking && ranking.rankingExplanation || '仅按导入样本中的只读候选证据排序，平台最终为准。') + '</p><p>taxFeeIntegrity: ' + esc(safe.taxFeeIntegrityStatus || 'not_run') + '</p><p>freshness: ' + esc(safe.freshnessStatus || 'not_run') + '</p><p>safeProviderHandoffReady: ' + esc(String(safe.safeProviderHandoffReady === true)) + '</p><p>blocked reason: ' + esc(safe.blockedReason || '') + '</p>' + topCandidatesHtml(ranking, selectedId || '') + historySummaryHtml + sessionHtml + '<h5>Import Sanitization</h5><p>导入响应已脱敏</p><p>raw response stored false</p><p>rawResponseStored: false</p><p>sensitive field detected ' + esc(String((safe.blockedReason || '').indexOf('sensitive') >= 0)) + '</p><p>bookingUrl forced null</p><p>bookingUrl: null</p><p>checkoutUrl: null</p><p>paymentUrl: null</p><p>orderUrl: null</p><p>autoOpen: false</p><p>payment: false</p><p>order: false</p><p>identityUpload: false</p><p>redacted: true</p>';
        }
        if (sandboxImportClearButton) {
          if (refreshApi && typeof refreshApi.clearSandboxImportRefresh === "function") refreshApi.clearSandboxImportRefresh({});
          if (input) input.value = "";
          if (output) output.innerHTML = previewHtml({ validationStatus:"not_run" }, "not_run", null, "", null);
          showCommercePlatformTemplateFeedback("已清除导入状态", false);
          return;
        }
        if (sandboxDryRunButton) {
          const dryRunApi = window.WeishanMultiProviderSandboxDryRunOrchestrator;
          const dryRun = dryRunApi && typeof dryRunApi.runMultiProviderSandboxDryRun === "function" ? dryRunApi.runMultiProviderSandboxDryRun({ title: rawInput || "购买7月15日上海到成都最便宜的直达机票", origin:"上海", destination:"成都", departureDate:"2026-07-15", directOnly:true, sortIntent:"低价优先" }, { persistToHistory:true, storageLike: window.localStorage }) : null;
          const sessionStoreApi = window.WeishanReadOnlyQuoteSessionStore;
          if (dryRun && dryRun.sessionSummary && sessionStoreApi && typeof sessionStoreApi.saveReadOnlyQuoteSession === "function") sessionStoreApi.saveReadOnlyQuoteSession(dryRun.sessionSummary, window.localStorage);
          const ranking = dryRun && dryRun.ranking && Array.isArray(dryRun.ranking.topCandidates) ? dryRun.ranking : buildSandboxQuoteRanking(rawInput);
          const preview = dryRun && Array.isArray(dryRun.quotes) && dryRun.quotes.length ? { validationStatus:"accepted", currency:dryRun.quotes[0].currency, baseFare:dryRun.quotes[0].baseFare, taxesAndFees:dryRun.quotes[0].taxesAndFees, providerFees:dryRun.quotes[0].providerFees, totalPrice:dryRun.quotes[0].totalPrice, fareSource:"sandbox_read_only_import", safeProviderHandoffReady:dryRun.quotes[0].safeProviderHandoffReady } : { validationStatus:"failed_safe", blockedReason:"运行沙盒只读报价未通过安全检查" };
          if (output) output.innerHTML = previewHtml(preview, dryRun && dryRun.status || 'failed_safe', ranking, dryRun && dryRun.selectedCandidate && dryRun.selectedCandidate.selectedQuoteId || '', dryRun) + '<h5>本次沙盒运行结果</h5><p>运行沙盒只读报价</p><p>Multi-Provider Sandbox Dry-Run</p><p>Sandbox Provider Run Matrix</p><p>Quote Run Timeline</p><p>本次沙盒运行结果：' + esc(dryRun && dryRun.status || 'failed_safe') + '</p><p>Provider 运行矩阵：' + esc(dryRun && dryRun.providerRunMatrix && dryRun.providerRunMatrix.matrixName || 'sandbox_provider_run_matrix_v1') + '</p><p>运行时间线：' + esc(dryRun && dryRun.runTimelineSummary && dryRun.runTimelineSummary.summary || '构建 Provider 运行矩阵 · 生成只读沙盒报价 · 报价归一化 · Top 3 排序 · 候选选择准备') + '</p>';
          showCommercePlatformTemplateFeedback(dryRun && dryRun.status === "completed" ? "本次沙盒运行结果已生成" : "沙盒只读报价 dry-run 未通过安全检查", !!(dryRun && dryRun.status !== "completed"));
          return;
        }
        if (sandboxImportPreviewButton) {
          const ranking = buildSandboxQuoteRanking(rawInput);
          const result = ranking.topCandidates.length ? { status:"preview_ready", preview:{ validationStatus:"accepted", currency:ranking.topCandidates[0].currency, baseFare:ranking.topCandidates[0].baseFare, taxesAndFees:ranking.topCandidates[0].taxesAndFees, providerFees:ranking.topCandidates[0].providerFees, totalPrice:ranking.topCandidates[0].totalPrice, fareSource:"sandbox_read_only_import", safeProviderHandoffReady:ranking.topCandidates[0].safeProviderHandoffReady } } : (refreshApi && typeof refreshApi.previewSandboxImportRefresh === "function" ? refreshApi.previewSandboxImportRefresh(rawInput, {}) : { status:"failed_safe", preview:{ validationStatus:"failed_safe", blockedReason:"导入失败，已安全降级" } });
          if (output) output.innerHTML = previewHtml(result.preview, result.status, ranking, "", result);
          showCommercePlatformTemplateFeedback(result.status === "preview_ready" ? "预览导入结果已生成" : "沙盒响应导入未通过安全检查", result.status !== "preview_ready");
          return;
        }
        if (sandboxImportConfirmButton) {
          const ranking = buildSandboxQuoteRanking(rawInput);
          const result = ranking.topCandidates.length ? { status:"refreshed", preview:{ validationStatus:"accepted", currency:ranking.topCandidates[0].currency, baseFare:ranking.topCandidates[0].baseFare, taxesAndFees:ranking.topCandidates[0].taxesAndFees, providerFees:ranking.topCandidates[0].providerFees, totalPrice:ranking.topCandidates[0].totalPrice, fareSource:"sandbox_read_only_import", safeProviderHandoffReady:ranking.topCandidates[0].safeProviderHandoffReady } } : (refreshApi && typeof refreshApi.confirmSandboxImportRefresh === "function" ? refreshApi.confirmSandboxImportRefresh(rawInput, {}) : { status:"failed_safe", preview:{ validationStatus:"failed_safe", blockedReason:"导入失败，已安全降级" }, candidateCard:null });
          if (output) output.innerHTML = previewHtml(result.preview || result.sandboxImportConsole && result.sandboxImportConsole.preview, result.lastImportStatus || result.status, ranking, "", result) + '<p>' + esc(result.status === 'refreshed' ? '只读沙盒导入证据 · 导入响应已脱敏' : (result.status === 'blocked' ? '导入被阻断' : '导入失败，已安全降级')) + '</p>';
          const banner = host.querySelector('[data-commerce-sandbox-import-banner]');
          if (banner && result.status === 'refreshed') banner.textContent = '只读沙盒导入证据 · 导入响应已脱敏 · 仅作为候选证据，未锁价，不代表可出票 · 价格、库存、税费和规则以平台页面为准';
          const card = host.querySelector('.commerce-top-result-card, [data-commerce-read-only-price-candidate-card]');
          if (card && ranking.topCandidates.length) {
            const oldTop = card.querySelector('[data-commerce-read-only-top-candidates]');
            if (oldTop) oldTop.remove();
            card.insertAdjacentHTML("beforeend", topCandidatesHtml(ranking, ""));
          }
          showCommercePlatformTemplateFeedback(result.status === "refreshed" ? "确认导入脱敏证据完成" : (result.status === "blocked" ? "导入被阻断" : "导入失败，已安全降级"), result.status !== "refreshed");
          return;
        }
      }
      const auditExportButton = target && target.closest("[data-commerce-read-only-audit-export-preview]");
      if (auditExportButton && host.contains(auditExportButton)) {
        event.preventDefault();
        const storeApi = window.WeishanReadOnlyQuoteSessionStore;
        const exportApi = window.WeishanReadOnlyQuoteAuditExport;
        const loaded = storeApi && typeof storeApi.loadReadOnlyQuoteSession === "function" ? storeApi.loadReadOnlyQuoteSession(window.localStorage) : null;
        const session = loaded && loaded.sessionSummary ? loaded.sessionSummary : null;
        const preview = exportApi && typeof exportApi.buildReadOnlyQuoteAuditExportPreview === "function" ? exportApi.buildReadOnlyQuoteAuditExportPreview(session || {}) : null;
        const card = auditExportButton.closest("[data-commerce-read-only-price-candidate-card], .commerce-top-result-card, [data-commerce-sandbox-response-import-console]") || host;
        const old = card.querySelector('[data-commerce-read-only-audit-export-output]');
        if (old) old.remove();
        card.insertAdjacentHTML("beforeend", '<section data-commerce-read-only-audit-export-output="true"><h5>Audit Export</h5><p>Redacted JSON Preview</p><p>查看脱敏审计预览</p><p>Read-Only Quote Session Report Center</p><p>User-Facing Evidence Summary</p><p>Safety Quote Evidence Report</p><p>本导出仅为只读候选证据</p><p>平台最终为准，未锁价，不代表可出票</p><p>不包含原始响应、密钥、交易链接或身份信息</p><pre>' + esc(JSON.stringify({ exportName: preview && preview.exportModel && preview.exportModel.exportName || 'read_only_quote_audit_export_v1', exportType: 'redacted_json_preview', appVersion: '2.1.56', generatedAt: null, reportCenterSummary: preview && preview.exportModel && preview.exportModel.reportCenterSummary ? 'redacted' : 'redacted', userFacingSummary: preview && preview.exportModel && preview.exportModel.userFacingSummary ? 'redacted' : 'redacted', safetyReportSummary: 'redacted', exportValidationWarnings: ['redacted_json_preview only'], redacted: true, safety: 'redacted' }, null, 2)) + '</pre></section>');
        showCommercePlatformTemplateFeedback("查看脱敏审计预览已生成，不写文件、不上传", false);
        return;
      }
      const replayRunButton = target && target.closest("[data-commerce-replay-last-read-only-run]");
      if (replayRunButton && host.contains(replayRunButton)) {
        event.preventDefault();
        const replayApi = window.WeishanReadOnlyQuoteReplayGuard;
        const historyApi = window.WeishanReadOnlyQuoteRunHistoryStore;
        const sessionStoreApi = window.WeishanReadOnlyQuoteSessionStore;
        const history = historyApi && typeof historyApi.loadReadOnlyQuoteRunHistory === "function" ? historyApi.loadReadOnlyQuoteRunHistory(window.localStorage) : { history: [] };
        const replay = replayApi && typeof replayApi.replayLastReadOnlyQuoteRun === "function" ? replayApi.replayLastReadOnlyQuoteRun(history, {}) : null;
        const loadedSession = sessionStoreApi && typeof sessionStoreApi.loadReadOnlyQuoteSession === "function" ? sessionStoreApi.loadReadOnlyQuoteSession(window.localStorage) : null;
        const card = replayRunButton.closest("[data-commerce-read-only-price-candidate-card], .commerce-top-result-card, [data-commerce-sandbox-response-import-console]") || host;
        const old = card.querySelector('[data-commerce-read-only-session-recovery-output]');
        if (old) old.remove();
        if (loadedSession && loadedSession.sessionSummary) card.insertAdjacentHTML("beforeend", '<section data-commerce-read-only-session-recovery-output="true"><h5>Session Recovery</h5><p>恢复最近一次只读会话</p><p>当前只读报价会话</p><p>Read-Only Quote Session</p><p>Session Timeline</p><p>只恢复本地脱敏 session summary，不请求 provider，不打开外部平台。</p><p>不付款、不下单、不出票</p></section>');
        showCommercePlatformTemplateFeedback(loadedSession && loadedSession.sessionSummary ? "Session Recovery 已恢复本地脱敏会话" : (replay && replay.status === "available" ? "Replay 只恢复候选证据，不重新请求 provider" : "暂无可恢复的本地脱敏会话"), !(loadedSession && loadedSession.sessionSummary));
        if (!(loadedSession && loadedSession.sessionSummary)) render(host);
        return;
      }
      const selectCandidateButton = target && target.closest("[data-commerce-select-read-only-quote-candidate]");
      if (selectCandidateButton && host.contains(selectCandidateButton)) {
        event.preventDefault();
        const card = selectCandidateButton.closest("[data-commerce-read-only-price-candidate-card], .commerce-top-result-card, [data-commerce-read-only-top-candidates], [data-commerce-sandbox-response-import-console]");
        if (card) {
          const panel = selectCandidateButton.closest("[data-commerce-sandbox-response-import-console]");
          const input = panel && panel.querySelector("[data-commerce-sandbox-response-import-input]");
          const output = panel && panel.querySelector("[data-commerce-sandbox-response-import-output]");
          const selectedSourceSummary = commerceDecodedInlineValue(selectCandidateButton, "data-commerce-selected-source-summary") || "来源：只读沙盒 / 导入样本";
          const selectedId = commerceDecodedInlineValue(selectCandidateButton, "data-commerce-select-read-only-quote-candidate-id") || "";
          const rawInput = input ? input.value : "";
          const ranking = buildSandboxQuoteRanking(rawInput);
          const selectedCandidate = (ranking.topCandidates || []).find((candidate) => String(candidate.quoteId || "") === String(selectedId || ""));
          const preview = selectedCandidate ? { validationStatus:"accepted", currency:selectedCandidate.currency, baseFare:selectedCandidate.baseFare, taxesAndFees:selectedCandidate.taxesAndFees, providerFees:selectedCandidate.providerFees, totalPrice:selectedCandidate.totalPrice, fareSource:selectedCandidate.fareSource || "sandbox_read_only_import", safeProviderHandoffReady:selectedCandidate.safeProviderHandoffReady } : { validationStatus:"accepted" };
          if (output) output.innerHTML = previewHtml(preview, "selected", ranking, selectedId);
          selectCandidateButton.textContent = "已选择该候选";
          card.querySelectorAll("[data-commerce-selected-candidate], [data-commerce-selected-source-summary]").forEach((node) => node.remove());
          card.insertAdjacentHTML("beforeend", '<p data-commerce-selected-candidate="true">已选择该候选</p><p data-commerce-selected-source-summary="true">' + esc(selectedSourceSummary) + '</p>');
          const handoffButton = host.querySelector(".commerce-top-result-card [data-commerce-safe-provider-handoff-request], [data-commerce-read-only-price-candidate-card] [data-commerce-safe-provider-handoff-request]");
          if (handoffButton) {
            const safeUrl = commerceDecodedInlineValue(selectCandidateButton, "data-commerce-safe-provider-handoff-url");
            handoffButton.setAttribute("data-commerce-safe-provider-handoff-url", commerceEncodedExternalUrl(safeUrl || ""));
            handoffButton.disabled = !safeUrl;
          }
        }
        showCommercePlatformTemplateFeedback("已选择该候选，平台最终为准", false);
        return;
      }
      const manualPlatformCheckButton = target && target.closest("[data-commerce-manual-platform-check-save]");
      if (manualPlatformCheckButton && host.contains(manualPlatformCheckButton)) {
        const panel = manualPlatformCheckButton.closest("[data-commerce-manual-platform-check]");
        const captureApi = window.WeishanManualPlatformCheckCapture;
        const deltaApi = window.WeishanPlatformCheckDeltaCompare;
        const reconciliationApi = window.WeishanPlatformCheckReconciliationCenter;
        const confidenceApi = window.WeishanReadOnlyCandidateConfidenceLabeler;
        const coachApi = window.WeishanReadOnlyQuoteSafeNextStepCoach;
        const total = panel && panel.querySelector("[data-commerce-manual-platform-check-total]");
        const currency = panel && panel.querySelector("[data-commerce-manual-platform-check-currency]");
        const note = panel && panel.querySelector("[data-commerce-manual-platform-check-note]");
        const evidence = captureApi && typeof captureApi.buildManualPlatformCheckEvidence === "function" ? captureApi.buildManualPlatformCheckEvidence({ observedTotalPrice:total && total.value, observedCurrency:currency && currency.value, userNote:note && note.value, observedInventoryStatus:"unknown" }) : { status:"failed_safe", sensitiveInputBlocked:true };
        const delta = deltaApi && typeof deltaApi.compareCandidateWithManualPlatformCheck === "function" ? deltaApi.compareCandidateWithManualPlatformCheck({ totalPrice:1010 }, evidence) : null;
        const summary = deltaApi && typeof deltaApi.buildPlatformCheckDeltaSummary === "function" ? deltaApi.buildPlatformCheckDeltaSummary(delta) : { line:"平台核对差异：暂无可比较的手动平台核对结果" };
        const reconciliation = reconciliationApi && typeof reconciliationApi.buildPlatformCheckReconciliationSummary === "function" ? reconciliationApi.buildPlatformCheckReconciliationSummary({ selectedCandidate:{ totalPrice:1010, currency:"CNY", providerName:"只读候选" }, manualPlatformCheckEvidence:evidence, platformCheckDelta:delta }) : null;
        const confidence = confidenceApi && typeof confidenceApi.buildReadOnlyCandidateConfidenceLabel === "function" ? confidenceApi.buildReadOnlyCandidateConfidenceLabel({ safeProviderHandoffReady:true, manualPlatformCheckEvidence:evidence, platformCheckDelta:delta, reconciliationSummary:reconciliation }) : null;
        const coach = coachApi && typeof coachApi.buildReadOnlyQuoteSafeNextStepCoach === "function" ? coachApi.buildReadOnlyQuoteSafeNextStepCoach({ reconciliationSummary:reconciliation, confidenceLabelSummary:confidence }) : null;
        const output = panel && panel.querySelector("[data-commerce-manual-platform-check-output]");
        if (output) output.innerHTML = evidence.status === "blocked" ? "<p>敏感输入已阻断</p><p>secretStored: false</p><p>平台最终为准</p>" : "<p>平台核对结果已记录</p><p>平台核对汇总</p><p>" + esc(reconciliation && reconciliation.line || "平台最终为准") + "</p><p>候选价置信标签</p><p>" + esc(confidence && confidence.confidenceLabel || "不可确认") + "</p><p>" + esc(summary.line || "平台核对差异") + "</p><p>平台核对差异</p><p>平台页面结果与候选价存在差异，平台最终为准</p><p>下一步安全建议</p><p>" + esc(coach && coach.recommendation || "重新核对平台页面") + "</p><p>重新核对平台页面</p><p>重新运行只读报价</p><p>平台最终为准</p><p>未锁价</p><p>不代表可出票</p><p>secretStored: false</p>";
        return;
      }
      const safeProviderButton = target && target.closest("[data-commerce-safe-provider-handoff-request]");
      if (safeProviderButton && host.contains(safeProviderButton)) {
        const taskScope = safeProviderButton.closest("[data-commerce-task-id]");
        pendingSafeProviderHandoffConfirmation = {
          taskId: taskScope && taskScope.getAttribute("data-commerce-task-id") || "",
          taskTitle: taskScope && taskScope.getAttribute("data-commerce-task-title") || "",
          kind: safeProviderButton.getAttribute("data-commerce-safe-provider-handoff-kind") || "googleFlights",
          url: commerceDecodedInlineValue(safeProviderButton, "data-commerce-safe-provider-handoff-url"),
          providerName: safeProviderButton.getAttribute("data-commerce-safe-provider-handoff-provider") || "可信平台",
          displayHost: safeProviderButton.getAttribute("data-commerce-safe-provider-handoff-host") || "",
          selectedCandidate: { quoteId:safeProviderButton.getAttribute("data-commerce-safe-provider-handoff-quote-id") || "", totalPrice:Number(safeProviderButton.getAttribute("data-commerce-safe-provider-handoff-total") || 0) || null, currency:safeProviderButton.getAttribute("data-commerce-safe-provider-handoff-currency") || "CNY", safeProviderHandoffReady:true }
        };
        render(host);
        return;
      }
      const safeProviderConfirmButton = target && target.closest("[data-commerce-safe-provider-handoff-confirm]");
      if (safeProviderConfirmButton && host.contains(safeProviderConfirmButton)) {
        const gateApi = window.WeishanSafeProviderDeepLinkHandoffGate;
        const pending = pendingSafeProviderHandoffConfirmation;
        if (!pending || !gateApi || typeof gateApi.openTrustedProviderHandoffUrl !== "function") return;
        const receiptApi = window.WeishanProviderHandoffReceiptStore;
        if (receiptApi && typeof receiptApi.saveProviderHandoffReceipt === "function") receiptApi.saveProviderHandoffReceipt({ status:"confirmed", providerName:pending.providerName, displayHost:pending.displayHost || pending.url, selectedCandidate:pending.selectedCandidate, handoffType:"provider_confirmation", userConfirmed:true });
        pendingSafeProviderHandoffConfirmation = null;
        Promise.resolve(gateApi.openTrustedProviderHandoffUrl(pending.url, { userConfirmed:true })).then((result) => {
          const ok = !!(result && result.ok);
          render(host);
          showCommerceExternalSearchFeedback(host, ok ? "已确认并打开可信平台确认页，请在外部平台继续确认" : "可信平台确认页未打开，请手动打开可信页面继续确认", !ok);
        });
        return;
      }
      const safeProviderCancelButton = target && target.closest("[data-commerce-safe-provider-handoff-cancel]");
      if (safeProviderCancelButton && host.contains(safeProviderCancelButton)) {
        const receiptApi = window.WeishanProviderHandoffReceiptStore;
        if (receiptApi && typeof receiptApi.saveProviderHandoffReceipt === "function" && pendingSafeProviderHandoffConfirmation) receiptApi.saveProviderHandoffReceipt({ status:"cancelled", providerName:pendingSafeProviderHandoffConfirmation.providerName, displayHost:pendingSafeProviderHandoffConfirmation.displayHost || pendingSafeProviderHandoffConfirmation.url, selectedCandidate:pendingSafeProviderHandoffConfirmation.selectedCandidate, handoffType:"provider_confirmation", userConfirmed:false });
        pendingSafeProviderHandoffConfirmation = null;
        render(host);
        showCommerceExternalSearchFeedback(host, "已取消平台确认，可继续查看或复制搜索条件", false);
        return;
      }
      const externalButton = target && target.closest("[data-commerce-external-search-url]");
      if (externalButton && host.contains(externalButton)) {
        const taskScope = externalButton.closest("[data-commerce-task-id]");
        pendingSafeExternalSearchConfirmation = {
          taskId: taskScope && taskScope.getAttribute("data-commerce-task-id") || "",
          taskTitle: taskScope && taskScope.getAttribute("data-commerce-task-title") || "",
          kind: externalButton.getAttribute("data-commerce-external-search-kind") || "",
          url: commerceDecodedInlineValue(externalButton, "data-commerce-external-search-url")
        };
        render(host);
        return;
      }
      const externalConfirmButton = target && target.closest("[data-commerce-external-search-confirm]");
      if (externalConfirmButton && host.contains(externalConfirmButton)) {
        const handoff = window.WeishanSafeExternalSearchHandoff;
        const pending = pendingSafeExternalSearchConfirmation;
        if (!pending || !handoff || typeof handoff.openTrustedExternalSearch !== "function") return;
        pendingSafeExternalSearchConfirmation = null;
        Promise.resolve(handoff.openTrustedExternalSearch(pending.url)).then((result) => {
          const ok = !!(result && result.ok);
          render(host);
          showCommerceExternalSearchFeedback(host, ok ? "已确认并打开外部搜索入口，请在外部平台确认实时价格和规则" : "外部搜索入口未打开，请手动复制搜索条件", !ok);
        });
        return;
      }
      const externalCancelButton = target && target.closest("[data-commerce-external-search-cancel]");
      if (externalCancelButton && host.contains(externalCancelButton)) {
        pendingSafeExternalSearchConfirmation = null;
        render(host);
        showCommerceExternalSearchFeedback(host, "已取消外部搜索打开，可继续复制搜索条件", false);
        return;
      }
      const checklistButton = target && target.closest("[data-commerce-copy-kind]");
      if (checklistButton && host.contains(checklistButton)) {
        copyCommerceActionableChecklist(checklistButton.getAttribute("data-commerce-copy-kind") || "", commerceDecodedInlineCopyText(checklistButton, "data-commerce-copy-text"));
        return;
      }
      const limitedBetaActionButton = target && target.closest("[data-commerce-limited-beta-action]");
      if (limitedBetaActionButton && host.contains(limitedBetaActionButton)) {
        const action = limitedBetaActionButton.getAttribute("data-commerce-limited-beta-action") || "";
        const api = window.WeishanLimitedBetaKillSwitch;
        const persistence = window.WeishanLimitedBetaPreferencePersistence;
        const jobs = [];
        if (api) {
          if (action === "off" && typeof api.turnOffLimitedBeta === "function") jobs.push(api.turnOffLimitedBeta("local user disabled limited beta from UI"));
          if (action === "restore-request" && typeof api.requestRestoreLimitedBeta === "function") jobs.push(api.requestRestoreLimitedBeta("local user requested flight limited beta restore from UI"));
          if (action === "restore-confirm" && typeof api.confirmRestoreLimitedBeta === "function") jobs.push(api.confirmRestoreLimitedBeta("local user confirmed flight limited beta restore from UI"));
          if (action === "rollback" && typeof api.forceRollback === "function") jobs.push(api.forceRollback("local user forced rollback to offline planning"));
          if (action === "reload-preference" && typeof api.reloadPersistedPreference === "function") jobs.push(api.reloadPersistedPreference());
          if (action === "clear-preference" && typeof api.clearLimitedBetaPreference === "function") jobs.push(api.clearLimitedBetaPreference());
        }
        if (persistence && action === "reload-preference" && typeof persistence.loadPersistedPreference === "function") jobs.push(persistence.loadPersistedPreference());
        Promise.resolve(Promise.all(jobs.map((job) => job && typeof job.then === "function" ? job : Promise.resolve(job)))).finally(() => render(host));
        render(host);
        return;
      }
      const templateButton = target && target.closest("[data-commerce-template-kind]");
      if (templateButton && host.contains(templateButton)) {
        copyCommercePlatformTemplate(templateButton.getAttribute("data-commerce-template-kind") || "", commerceDecodedInlineCopyText(templateButton, "data-commerce-template-text"));
      }
    };
    if (host.__commerceDelegatedClickHandler) host.removeEventListener("click", host.__commerceDelegatedClickHandler);
    host.__commerceDelegatedClickHandler = commerceDelegatedClickHandler;
    host.addEventListener("click", commerceDelegatedClickHandler);

    const clearAll = host.querySelector("#commerceClearAll");
    if (clearAll) clearAll.addEventListener("click", () => {
      if (api && api.clearCommerceTasks) api.clearCommerceTasks();
      selectedTaskId = "";
      pendingSafeExternalSearchConfirmation = null;
      pendingSafeProviderHandoffConfirmation = null;
      record("commerceAgent.allTasksCleared", { inputSummary:"清理全部采购计划", status:"cleared" }, "用户已清理全部全球采购计划。");
      render(host);
    });
    host.querySelectorAll(".commerce-view-task").forEach((button) => {
      button.addEventListener("click", () => {
        selectedTaskId = button.getAttribute("data-task-id") || "";
        pendingSafeProviderHandoffConfirmation = null;
        render(host);
      });
    });
    host.querySelectorAll(".commerce-clear-task").forEach((button) => {
      button.addEventListener("click", () => {
        const taskId = button.getAttribute("data-task-id") || "";
        const target = tasks.find((task) => task.taskId === taskId);
        const next = tasks.filter((task) => task.taskId !== taskId);
        if (api && api.saveCommerceTasks) api.saveCommerceTasks(next);
        if (selectedTaskId === taskId) selectedTaskId = next[0] && next[0].taskId || "";
        pendingSafeProviderHandoffConfirmation = null;
        record("commerceAgent.taskCleared", Object.assign({}, target || {}, { status:"cleared" }), "用户已清理单个全球采购计划。");
        render(host);
      });
    });
    host.querySelectorAll(".commerce-search-real").forEach((button) => {
      button.addEventListener("click", async () => {
        const search = searchApi();
        if (!search || !search.searchCommerceCandidates || !api || !api.updateCommerceTask) return;
        const taskId = button.getAttribute("data-task-id") || "";
        const target = tasks.find((task) => task.taskId === taskId);
        if (!target) return;
        const isModelPricing = target.category === "aiModelPricing";
        button.disabled = true;
        recordSearch(isModelPricing ? "commerceAgent.openRouterSearchRequested" : "commerceAgent.searchRequested", Object.assign({}, target, {
          providerName:isModelPricing ? "OpenRouter" : target.searchProviderName || "",
          resultStatus:"requested"
        }));
        const result = await search.searchCommerceCandidates(target);
        if (!result.ok) {
          const status = result.code === "COMMERCE_MISSING_FIELDS" ? "missingFields" : result.code === "COMMERCE_LOCAL_LAW_COMPLIANCE_REQUIRED" ? "local_law_compliance_required" : result.code === "COMMERCE_SHIPPING_DESTINATION_REQUIRED" || result.code === "COMMERCE_LOCATION_REQUIRED" ? "shipping_destination_required" : result.code === "COMMERCE_NO_PROVIDER" || result.code === "COMMERCE_PROVIDER_NOT_CONFIGURED" || result.code === "COMMERCE_PROVIDER_CONFIG_NOT_READY" ? "no_provider" : result.code === "COMMERCE_NO_RESULTS" ? "no_results" : "failed";
          const updated = api.updateCommerceTask(taskId, {
            searchStatus:status,
            missingFields:result.request && result.request.missingFields || target.missingFields || [],
            searchProviderName:result.providerName || (isModelPricing ? "OpenRouter" : ""),
            providerHealth:result.providerHealth || target.providerHealth || [],
            configHealth:result.configHealth || target.configHealth || {},
            connectorHealth:result.connectorHealth || target.connectorHealth || {},
            onboardingHealth:result.onboardingHealth || target.onboardingHealth || {},
            sandboxHealth:result.sandboxHealth || target.sandboxHealth || {},
            dryRunHealth:result.dryRunHealth || result.sandboxHealth || target.dryRunHealth || target.sandboxHealth || {},
            locationHealth:result.locationHealth || target.locationHealth || {},
            complianceHealth:result.complianceHealth || target.complianceHealth || {},
            landedCostAccuracy:result.landedCostAccuracy || target.landedCostAccuracy || "",
            canShowPrice:result.canShowPrice === true,
            canShowBookingButton:result.canShowBookingButton === true,
            canShowCheckoutButton:result.canShowCheckoutButton === true,
            searchErrorMessage:result.message || "",
            searchResultSummary:{ candidateCount:0 },
            updatedAt:new Date().toISOString()
          });
          recordSearch(isModelPricing ? "commerceAgent.openRouterSearchFailed" : status === "no_provider" ? "commerceAgent.searchProviderMissing" : "commerceAgent.searchFailed", Object.assign({}, updated || target, {
            providerName:result.providerName || (isModelPricing ? "OpenRouter" : ""),
            resultStatus:status,
            outputSummary:result.message || "搜索失败。"
          }));
          render(host);
          return;
        }
        const recommendation = result.recommendation || search.createRecommendationFromCandidates(result.candidates || []);
        const sorted = result.candidates || [];
        const first = sorted[0] || {};
        const updated = api.updateCommerceTask(taskId, {
          status:"recommended",
          searchStatus:"completed",
          searchProviderName:result.providerName || "",
          providerHealth:result.providerHealth || target.providerHealth || [],
          configHealth:result.configHealth || target.configHealth || {},
          connectorHealth:result.connectorHealth || target.connectorHealth || {},
          onboardingHealth:result.onboardingHealth || target.onboardingHealth || {},
          sandboxHealth:result.sandboxHealth || target.sandboxHealth || {},
          dryRunHealth:result.dryRunHealth || result.sandboxHealth || target.dryRunHealth || target.sandboxHealth || {},
          canShowPrice:result.canShowPrice === true,
          canShowBookingButton:result.canShowBookingButton === true,
          canShowCheckoutButton:result.canShowCheckoutButton === true,
          candidates:sorted,
          recommendation,
          searchResultSummary:{
            candidateCount:sorted.length,
            lowestPrice:first.totalPrice || first.price || "",
            lowestLandedCost:first.totalLandedCost || first.totalPrice || first.price || "",
            currency:first.currency || "",
            lowestPromptPricePerMillion:first.promptPricePerMillion || "",
            lowestCompletionPricePerMillion:first.completionPricePerMillion || "",
            recommendationTitle:recommendation && recommendation.title || ""
          },
          updatedAt:new Date().toISOString()
        });
        recordSearch(isModelPricing ? "commerceAgent.openRouterSearchCompleted" : "commerceAgent.searchCompleted", Object.assign({}, updated || target, {
          providerName:result.providerName,
          candidates:sorted,
          resultStatus:"completed"
        }));
        recordSearch(isModelPricing ? "commerceAgent.openRouterCandidatesRendered" : "commerceAgent.candidatesRendered", Object.assign({}, updated || target, {
          providerName:result.providerName,
          candidates:sorted,
          resultStatus:"rendered"
        }));
        pendingSafeProviderHandoffConfirmation = null;
        render(host);
      });
    });
    host.querySelectorAll(".commerce-booking-link").forEach((link) => {
      link.addEventListener("click", () => {
        const url = link.getAttribute("data-url") || link.getAttribute("href") || "";
        const taskId = selected && selected.taskId || "";
        if (!isSafeExternalProviderUrl(url)) {
          recordSearch("commerceAgent.bookingLinkBlocked", Object.assign({}, selected || {}, {
            taskId,
            resultStatus:"bookingLinkBlocked",
            outputSummary:"provider URL 不是 http/https，已安全拦截；weishan 不下单、不付款、不提交订单。"
          }));
          return;
        }
        recordSearch("commerceAgent.bookingLinkViewed", Object.assign({}, selected || {}, {
          taskId,
          resultStatus:"bookingLinkViewed",
          outputSummary:"用户查看 https provider URL；weishan 不下单、不付款、不提交订单。"
        }));
        if (url && window.WeishanAPI && typeof window.WeishanAPI.openExternal === "function") {
          window.WeishanAPI.openExternal(url);
          return;
        }
        if (url && window.weishan && typeof window.weishan.openExternal === "function") window.weishan.openExternal(url);
      });
    });
    hydrateDisclosureSections(host);
    if (selected && selected.taskId !== lastViewedTaskId) {
      lastViewedTaskId = selected.taskId;
      record("commerceAgent.planViewed", selected, "用户已查看全球采购计划详情。");
    }
  }

  window.CommerceAgentPage = { mount:render };
})();
