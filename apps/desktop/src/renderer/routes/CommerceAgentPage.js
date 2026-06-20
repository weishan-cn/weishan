(function(){
  let draftText = "";
  let selectedTaskId = "";
  let lastViewedTaskId = "";

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
            } catch (err) {
              body.textContent = template.dataset.commerceDisclosureHtml || "";
            }
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
      <p>real price disabled</p>
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
      <p>real price disabled</p>
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
        <p>real provider disabled</p>
        <p>real network disabled</p>
        <p>real API key disabled</p>
        <p>real endpoint disabled</p>
        <p>real price disabled</p>
        <p>availability disabled</p>
        <p>bookingUrl disabled</p>
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
        version:"2.1.25",
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
      ${commerceBookingUrlDomainSafetyGateDisclosure(task)}
      ${commerceManualProviderReviewWorkflowDisclosure(task)}
      ${commerceProviderActivationReadinessGateDisclosure(task)}
      ${commerceCredentialConsentScopeGateDisclosure(task)}
      ${commerceReadonlyAdapterContractGateDisclosure(task)}
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
      ${commerceProviderEndpointAllowlistGateDisclosure(task)}
      ${commerceReadonlyProviderSandboxGateDisclosure(task)}
      ${commerceReadonlyProviderResultSchemaGateDisclosure(task)}
      ${commerceProviderResultSourceLabelGateDisclosure(task)}
      ${commercePriceIntegrityTaxesFeesGateDisclosure(task)}
      ${commerceBookingUrlDomainSafetyGateDisclosure(task)}
      ${commerceManualProviderReviewWorkflowDisclosure(task)}
      ${commerceProviderActivationReadinessGateDisclosure(task)}
      ${commerceCredentialConsentScopeGateDisclosure(task)}
      ${commerceReadonlyAdapterContractGateDisclosure(task)}
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
      ${commerceBookingUrlDomainSafetyGateDisclosure(task)}
      ${commerceManualProviderReviewWorkflowDisclosure(task)}
      ${commerceProviderActivationReadinessGateDisclosure(task)}
      ${commerceCredentialConsentScopeGateDisclosure(task)}
      ${commerceReadonlyAdapterContractGateDisclosure(task)}
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
    const origin = String(normalized.originText || "").trim();
    const destination = String(normalized.destinationText || "").trim();
    const date = String(normalized.dateText || normalized.timing || "").trim().replace(/\s+/g, "");
    const dateDisplay = date.replace(/^(\d{1,2})月(\d{1,2})日$/, "$1 月 $2 日");
    const lowPrice = /最便宜|低价|便宜/.test(raw) || /低价优先/.test(String(normalized.constraints || ""));
    return {
      origin,
      destination,
      date,
      dateDisplay,
      goal:lowPrice ? "低价优先" : "按条件筛选"
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
      googleFlights:"https://www.google.com/travel/flights?q=" + encodeURIComponent(enQuery),
      tripCom:"https://www.trip.com/flights/search/?q=" + encodeURIComponent(enQuery)
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
    const quote = gate.quoteRequiredFields || {};
    const prereq = gate.displayPrerequisites || {};
    const policy = gate.currentPricePolicy || {};
    const tax = gate.taxFeeCompletenessRules || {};
    const risk = gate.riskScan || {};
    const audit = gate.audit && gate.audit.priceIntegrityAuditDraft || {};
    const body = '<section class="commerce-price-integrity-taxes-fees-gate-panel" aria-label="price integrity / taxes / fees gate">'
      + '<h4>' + esc(display.title || 'price integrity / taxes / fees gate') + '</h4>'
      + '<p>' + esc(display.establishedLine || 'price integrity / taxes / fees gate：已建立') + '</p>'
      + '<p>' + esc(display.gateStatusLine || 'gate 状态：关闭 / closed') + '</p>'
      + '<p>' + esc(display.modeLine || 'mode: draft only') + '</p>'
      + '<p>' + esc(display.realPriceLine || 'real price display disabled') + '</p>'
      + '<p>' + esc(display.providerPriceLine || 'real provider price disabled') + '</p>'
      + '<p>' + esc(display.taxFeeLine || 'tax / fee verification disabled until readonly provider result is available') + '</p>'
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
      + '<h5>与前置 gate 联动</h5>' + listHtml(gate.linkage || [])
      + '<p>' + esc(display.safetyLine || '当前版本仍隐藏价格，只显示暂无真实价格结果，不显示虚构价格或非真实报价。') + '</p>'
      + '</section>';
    return disclosure('查看 price integrity / taxes / fees gate', body, 'commerce-price-integrity-taxes-fees-gate-disclosure');
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
    const body = '<section class="commerce-credential-consent-scope-gate-panel" aria-label="credential consent scope gate">'
      + '<h4>' + esc(display.title || 'credential consent scope gate') + '</h4>'
      + '<p>' + esc(display.establishedLine || 'credential consent scope gate：gate 已建立') + '</p>'
      + '<p>' + esc(display.statusLine || 'status: closed') + '</p>'
      + '<p>' + esc(display.modeLine || 'mode: draft only') + '</p>'
      + '<p>' + esc(display.inputLine || 'real credential input disabled') + '</p>'
      + '<p>' + esc(display.saveLine || 'real credential save disabled') + '</p>'
      + '<p>' + esc(display.readLine || 'real credential read disabled') + '</p>'
      + '<p>' + esc(display.lifecycleLine || 'credential deletion / rotation / expiry real operations disabled') + '</p>'
      + '<p>' + esc(display.keychainLine || 'Keychain disabled') + '</p>'
      + '<p>' + esc(display.safeStorageLine || 'safeStorage disabled') + '</p>'
      + '<p>' + esc(display.encryptedStoreLine || 'encrypted local store disabled') + '</p>'
      + '<p>' + esc(display.envLine || '.env disabled') + '</p>'
      + '<p>' + esc(display.browserStorageLine || 'localStorage / sessionStorage disabled') + '</p>'
      + '<h5>未来 consent object 草案</h5>' + listHtml((gate.consentObjectDraft || {}).fields || [])
      + '<h5>credential scope 草案</h5>' + listHtml((gate.credentialScopeDraft || {}).credentialScopes || [])
      + '<h5>consent state 草案</h5>' + listHtml((gate.consentStateDraft || {}).states || [])
      + '<p>' + esc(display.noApprovedLine || '当前没有 consent 处于 approved_for_future_readonly') + '</p>'
      + '<p>' + esc(display.noInputLine || 'UI 不提供输入 key') + '</p>'
      + '<p>' + esc(display.noSaveLine || 'UI 不提供保存 key') + '</p>'
      + '<p>' + esc(display.noReadLine || 'UI 不提供读取 key') + '</p>'
      + '<p>' + esc(display.noTestLine || 'UI 不提供测试连接') + '</p>'
      + '<p>' + esc(display.noLifecycleLine || 'UI 不提供删除 / 轮换 / 过期真实操作') + '</p>'
      + '<p>' + esc(display.draftOnlyLine || '当前仅展示只读 consent 草案') + '</p>'
      + '<h5>权限边界</h5>' + listHtml((gate.permissionBoundaries || {}).boundaries || [])
      + '<h5>阻断规则</h5>' + listHtml((gate.blockingRules || {}).blockingRules || [])
      + '<h5>审计事件草案</h5><p>credentialConsentScopeAuditDraft</p>'
      + '<p>eventType：' + esc(audit.eventType || 'CREDENTIAL_CONSENT_SCOPE_EVALUATION_DRAFT') + '</p>'
      + '<p>schemaVersion：' + esc(audit.schemaVersion || '2.1.24') + '</p>'
      + '<p>gateState：' + esc(audit.gateState || 'closed') + '</p>'
      + '<p>consentState：' + esc(audit.consentState || 'draft_only') + '</p>'
      + '<p>providerId：' + esc(audit.providerId || 'none') + '</p>'
      + '<p>credentialAlias：' + esc(audit.credentialAlias || 'none') + '</p>'
      + '<p>blockedReason：' + esc(audit.blockedReason || 'credential_consent_scope_gate_closed') + '</p>'
      + '<p>consentCollectedAt：' + esc(audit.consentCollectedAt || 'none') + '</p>'
      + '<p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 credential consent scope gate', body, 'commerce-credential-consent-scope-gate-disclosure');
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

  function commerceSimpleFlightResultPanelHtml(task){
    const fields = commerceSimpleFlightFields(task);
    const copyTexts = commerceSimpleFlightCopyTexts(task);
    const externalUrls = commerceSimpleFlightExternalSearchUrls(task);
    const flightLowestOffers = commerceFlightLowestOffersDisplay(task);
    const searchModeDisplay = commerceUserApiSearchModeDisplay(task);
    const apiBindingDisplay = commerceApiBindingSafeShellDisplay(task);
    const resultCardRulesHtml = globalProcurementUserFacingResultCardsRulesDisclosure();
    return `<section class="commerce-result-summary-panel commerce-one-screen-result commerce-simple-flight-result" aria-label="机票搜索结果">
      <div class="commerce-result-summary-head">
        <div class="commerce-result-summary-headline">
          <span>真实结果优先</span>
          <strong>${esc(flightLowestOffers.summaryTitle || "机票搜索结果")}</strong>
        </div>
        <p>${esc(flightLowestOffers.currentStatusLine || "暂无真实价格结果")}</p>
      </div>
      <div class="commerce-one-screen-body">
        <section class="commerce-one-screen-card">
          <h4>${esc(flightLowestOffers.summaryTitle || "机票搜索结果")}</h4>
          <p>出发地：${esc(fields.origin)}</p>
          <p>目的地：${esc(fields.destination)}</p>
          <p>出发日期：${esc(fields.date)}</p>
          <p>日期：${esc(fields.dateDisplay || fields.date)}</p>
          <p>排序：${esc(fields.goal)}</p>
          <div class="commerce-search-mode-summary" aria-label="当前搜索模式">
            <h5>${esc(searchModeDisplay.title || "当前搜索模式")}</h5>
            <p>${esc(searchModeDisplay.userApiLine || "用户 API：未绑定")}</p>
            <p>${esc(searchModeDisplay.candidateProviderLine || "weishan 候选平台：可用")}</p>
            <p>${esc(searchModeDisplay.realPriceLine || "真实价格结果：暂无")}</p>
          </div>
          <div class="commerce-search-mode-summary commerce-api-binding-status" aria-label="API 绑定状态">
            <h5>${esc(apiBindingDisplay.title || "API 绑定状态")}</h5>
            <p>${esc(apiBindingDisplay.userApiLine || "用户 API：未绑定")}</p>
            <p>${esc(apiBindingDisplay.candidateProviderLine || "weishan 候选平台：可用")}</p>
            <p>${esc(apiBindingDisplay.realPriceLine || "真实价格结果：暂无")}</p>
          </div>
          <p class="commerce-simple-flight-empty">${esc(flightLowestOffers.currentStatusLine || "暂无真实价格结果")}</p>
          <p>${esc(flightLowestOffers.priceStateLine || "当前尚未接入真实只读机票价格源，不能展示价格。")}</p>
          <p>${esc(searchModeDisplay.futureLine || "绑定 API 后，将优先使用用户授权平台的只读价格结果")}</p>
          <p>${esc(searchModeDisplay.sourceLine || "未绑定 API 时，可使用 weishan 候选平台和外部搜索入口。")}</p>
          <p>${esc(flightLowestOffers.futureLine || "接入可信价格源后，将只显示通过安全检查的真实价格结果。最终价格、库存、税费、运费、行李、退改签，以跳转后的平台页面为准。")}</p>
          <p>weishan 不收款、不下单、不保存身份证、护照或银行卡。</p>
        </section>
        ${globalProcurementPlanHtml(task)}
        ${globalProcurementMissingInfoChecklistDisclosure(task)}
        ${globalProcurementSafeNextStepGuidanceDisclosure(task)}
        ${globalProcurementExternalSearchPolicyDisclosure(task)}
        ${resultCardRulesHtml}
        <p class="commerce-result-summary-status"><b>提示：</b>当前只是帮你整理搜索条件，不会访问真实平台，不会返回价格，不会跳转购买或预订，不会付款或下单。</p>
      </div>
      <div class="commerce-one-screen-actions" aria-label="机票搜索条件操作">
        <button class="cmd-btn gray commerce-external-search-btn" type="button" data-commerce-external-search-kind="web" data-commerce-external-search-url="${commerceEncodedExternalUrl(externalUrls.web)}">打开全网搜索</button>
        <button class="cmd-btn gray commerce-external-search-btn" type="button" data-commerce-external-search-kind="googleFlights" data-commerce-external-search-url="${commerceEncodedExternalUrl(externalUrls.googleFlights)}">打开 Google Flights 搜索</button>
        <button class="cmd-btn gray commerce-external-search-btn" type="button" data-commerce-external-search-kind="tripCom" data-commerce-external-search-url="${commerceEncodedExternalUrl(externalUrls.tripCom)}">打开 Trip.com / 携程搜索</button>
        <button class="cmd-btn gray commerce-result-summary-copy-btn" type="button" data-commerce-copy-kind="simpleFlight" data-commerce-copy-text="${commerceEncodedCopyText(copyTexts.flight)}">复制机票搜索条件</button>
      </div>
      ${commerceApiBindingSafeShellDisclosure(task)}
      ${commerceUserApiProviderCatalogDisclosure(task)}
      ${commerceApiBindingMockFormDisclosure(task)}
      ${commerceApiBindingPermissionChecklistDisclosure(task)}
      ${commerceApiBindingReadinessDisclosure(task)}
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
      ${commerceBookingUrlDomainSafetyGateDisclosure(task)}
      ${commerceManualProviderReviewWorkflowDisclosure(task)}
      ${commerceProviderActivationReadinessGateDisclosure(task)}
      ${commerceCredentialConsentScopeGateDisclosure(task)}
      ${commerceReadonlyAdapterContractGateDisclosure(task)}
      ${commerceProviderGateMatrixDashboardDisclosure(task)}
      ${commerceProviderNoNetworkRuntimeGuardDisclosure(task)}
      ${commerceOfflineProviderFixtureValidationHarnessDisclosure(task)}
      ${commerceProviderComplianceDecisionEngineDisclosure(task)}
      ${commerceOfflineProviderFixtureRunnerDisclosure(task)}
      ${commerceNoNetworkSentinelAuditDisclosure(task)}
      ${commerceProviderComplianceEvidenceReportDisclosure(task)}
      ${globalProcurementRestrictedCategoryGuardDisclosure(task)}
      ${globalProcurementEvidenceSafetySummaryDisclosure(task)}
      <p class="commerce-result-summary-status"><b>外部搜索提示：</b>点击后会打开外部搜索或外部平台。实时价格、库存、出票规则和付款均以外部平台为准。weishan 当前不返回价格，不付款，不下单。全网搜索结果由外部搜索引擎提供，weishan 不保证结果网站安全。请优先选择官方平台、知名旅行平台和航空公司官网。</p>
      <p class="commerce-result-summary-copy-feedback" data-commerce-copy-feedback data-commerce-platform-template-feedback aria-live="polite"></p>
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
      ${commerceProviderEndpointAllowlistGateDisclosure(task)}
      ${commerceReadonlyProviderSandboxGateDisclosure(task)}
      ${commerceReadonlyProviderResultSchemaGateDisclosure(task)}
      ${commerceProviderResultSourceLabelGateDisclosure(task)}
      ${commercePriceIntegrityTaxesFeesGateDisclosure(task)}
      ${commerceBookingUrlDomainSafetyGateDisclosure(task)}
      ${commerceManualProviderReviewWorkflowDisclosure(task)}
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
        ${section("下一步建议", list(["移除直接下单、付款或提交订单要求。", "补充预算、时间、地区限制后重新生成计划。"]))}
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
      const externalButton = target && target.closest("[data-commerce-external-search-url]");
      if (externalButton && host.contains(externalButton)) {
        const url = commerceDecodedInlineValue(externalButton, "data-commerce-external-search-url");
        commerceOpenTrustedExternalSearch(url).then((ok) => {
          showCommerceExternalSearchFeedback(host, ok ? "已打开外部搜索入口，请在外部平台确认实时价格和规则" : "外部搜索入口未打开，请手动复制搜索条件", !ok);
        });
        return;
      }
      const checklistButton = target && target.closest("[data-commerce-copy-kind]");
      if (checklistButton && host.contains(checklistButton)) {
        copyCommerceActionableChecklist(checklistButton.getAttribute("data-commerce-copy-kind") || "", commerceDecodedInlineCopyText(checklistButton, "data-commerce-copy-text"));
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
      record("commerceAgent.allTasksCleared", { inputSummary:"清理全部采购计划", status:"cleared" }, "用户已清理全部全球采购计划。");
      render(host);
    });
    host.querySelectorAll(".commerce-view-task").forEach((button) => {
      button.addEventListener("click", () => {
        selectedTaskId = button.getAttribute("data-task-id") || "";
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
