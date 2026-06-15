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
    if (category === "ticketing" || category === "ticket") return "ticket";
    if (category === "serviceBooking" || category === "service") return "service";
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
    if (task.category === "flight") return task.searchStatus === "completed" ? "机票搜索已完成" : "机票搜索已生成";
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
      const category = task.categoryLabel || task.category || "全球采购";
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

  function commerceOneScreenResultPanelHtml(){
    return `<section class="commerce-result-summary-panel commerce-one-screen-result" aria-label="最终结果">
      <div class="commerce-result-summary-head">
        <div class="commerce-result-summary-headline">
          <span>结果摘要</span>
          <strong>最终结果</strong>
        </div>
        <p>普通用户默认只看这一屏结果；清单、平台模板、分析过程、安全边界和技术细节均可按需展开。</p>
      </div>
      <div class="commerce-one-screen-body">
        <p class="commerce-one-screen-lead">我已整理好两个计划：</p>
        <section class="commerce-one-screen-card">
          <h4>旅行：</h4>
          <p>成都出发，7月12日去东京，7月12日入住，7月16日离店，孩子8岁，预算一万以内。建议优先比较总价、转机次数、起飞时间、酒店位置、家庭友好和取消政策。</p>
        </section>
        <section class="commerce-one-screen-card">
          <h4>电脑：</h4>
          <p>适合剪视频的新电脑，按 32G 内存、1T 硬盘、品牌不限、收货地成都、不接受二手、一万以内筛选。建议重点看 CPU、显卡、散热、屏幕、售后和退换政策。</p>
        </section>
        <p class="commerce-result-summary-status"><b>提示：</b>当前只是整理搜索条件，不访问真实平台，不返回价格，不跳转购买或预订，不付款或下单。</p>
      </div>
      <div class="commerce-one-screen-actions" aria-label="最终结果操作">
        <button class="cmd-btn gray commerce-result-summary-copy-btn" type="button" data-commerce-copy-kind="full">复制全部搜索条件</button>
        <button class="cmd-btn gray commerce-result-summary-copy-btn" type="button" data-commerce-copy-kind="travel">复制旅行搜索条件</button>
        <button class="cmd-btn gray commerce-result-summary-copy-btn" type="button" data-commerce-copy-kind="computer">复制电脑搜索条件</button>
      </div>
      <p class="commerce-result-summary-copy-feedback" data-commerce-copy-feedback aria-live="polite"></p>
      ${disclosure("查看可执行清单", commerceActionableChecklistPanelHtml(), "commerce-actionable-checklist-disclosure")}
      ${disclosure("查看平台模板", commercePlatformSearchTemplatePackHtml(), "commerce-platform-template-disclosure")}
    </section>`;
  }
  function commerceSimpleFlightFields(task){
    const normalized = task && (task.normalizedFields || task.normalized) || {};
    const raw = String(task && (task.inputSummary || task.rawInput || task.title || task.text) || "");
    const origin = String(normalized.originText || "").trim();
    const destination = String(normalized.destinationText || "").trim();
    const date = String(normalized.dateText || normalized.timing || "").trim();
    const lowPrice = /最便宜|低价|便宜/.test(raw) || /低价优先/.test(String(normalized.constraints || ""));
    return {
      origin,
      destination,
      date,
      goal:lowPrice ? "低价优先" : "按条件筛选"
    };
  }

  function commerceIsSimpleFlightTask(task){
    const raw = String(task && (task.inputSummary || task.rawInput || task.title || task.text) || "");
    const fields = commerceSimpleFlightFields(task);
    return !!(task && task.category === "flight" && fields.origin && fields.destination && /\d{1,2}月\d{1,2}日/.test(fields.date) && !/(酒店|住宿|电脑|商品|剪视频|内存|硬盘|采购计划)/.test(raw));
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
        "搜索目标：" + fields.goal,
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
        "搜索目标：" + fields.goal,
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
      contractVersion:"2.0.83",
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
        summaryTitle:"机票搜索条件已整理",
        currentStatusLine:"当前状态：未接入真实机票价格源，暂不能返回实时价格。",
        priceStateLine:"价格状态：暂未接入真实机票价格源，当前不能显示最低价两家。",
        futureLine:"接入真实只读价格源后，weishan 会只展示通过安全检查的最低价前 2 家。最终价格、库存、出票规则和付款以外部平台为准。"
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
      summaryTitle:display.summaryTitle || "机票搜索条件已整理",
      currentStatusLine:display.currentStatusLine || "当前状态：未接入真实机票价格源，暂不能返回实时价格。",
      priceStateLine:display.priceStateLine || "价格状态：暂未接入真实机票价格源，当前不能显示最低价两家。",
      futureLine:display.futureLine || "接入真实只读价格源后，weishan 会只展示通过安全检查的最低价前 2 家。最终价格、库存、出票规则和付款以外部平台为准。"
    };
  }

  function commerceFlightProviderCandidatesRegistry(task){
    const fallback = {
      contractVersion:"2.0.83",
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
      sandboxDryRunVersion:"2.0.83",
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
      matrixVersion:"2.0.83",
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
      permissionVersion:"2.0.83",
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
      adapterVersion:"2.0.83",
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
      approvalVersion:"2.0.83",
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

  function commerceSimpleFlightResultPanelHtml(task){
    const fields = commerceSimpleFlightFields(task);
    const copyTexts = commerceSimpleFlightCopyTexts(task);
    const externalUrls = commerceSimpleFlightExternalSearchUrls(task);
    const flightLowestOffers = commerceFlightLowestOffersDisplay(task);
    return `<section class="commerce-result-summary-panel commerce-one-screen-result commerce-simple-flight-result" aria-label="机票搜索条件已整理">
      <div class="commerce-result-summary-head">
        <div class="commerce-result-summary-headline">
          <span>最终结果</span>
          <strong>机票搜索条件已整理</strong>
        </div>
        <p>简单机票请求只整理搜索条件；当前不能返回实时价格。</p>
      </div>
      <div class="commerce-one-screen-body">
        <section class="commerce-one-screen-card">
          <h4>机票：</h4>
          <p>出发地：${esc(fields.origin)}</p>
          <p>目的地：${esc(fields.destination)}</p>
          <p>出发日期：${esc(fields.date)}</p>
          <p>搜索目标：${esc(fields.goal)}</p>
          <p>${esc(flightLowestOffers.currentStatusLine)}</p>
          <p>${esc(flightLowestOffers.priceStateLine)}</p>
          <p>${esc(flightLowestOffers.futureLine)}</p>
        </section>
        <p class="commerce-result-summary-status"><b>提示：</b>当前只是帮你整理搜索条件，不会访问真实平台，不会返回价格，不会跳转购买或预订，不会付款或下单。</p>
      </div>
      <div class="commerce-one-screen-actions" aria-label="机票搜索条件操作">
        <button class="cmd-btn gray commerce-external-search-btn" type="button" data-commerce-external-search-kind="web" data-commerce-external-search-url="${commerceEncodedExternalUrl(externalUrls.web)}">打开全网搜索</button>
        <button class="cmd-btn gray commerce-external-search-btn" type="button" data-commerce-external-search-kind="googleFlights" data-commerce-external-search-url="${commerceEncodedExternalUrl(externalUrls.googleFlights)}">打开 Google Flights 搜索</button>
        <button class="cmd-btn gray commerce-external-search-btn" type="button" data-commerce-external-search-kind="tripCom" data-commerce-external-search-url="${commerceEncodedExternalUrl(externalUrls.tripCom)}">打开 Trip.com / 携程搜索</button>
        <button class="cmd-btn gray commerce-result-summary-copy-btn" type="button" data-commerce-copy-kind="simpleFlight" data-commerce-copy-text="${commerceEncodedCopyText(copyTexts.flight)}">复制机票搜索条件</button>
        <button class="cmd-btn gray commerce-platform-template-copy-btn" type="button" data-commerce-template-kind="simpleGoogleFlights" data-commerce-template-text="${commerceEncodedCopyText(copyTexts.googleFlights)}">复制 Google Flights 模板</button>
        <button class="cmd-btn gray commerce-platform-template-copy-btn" type="button" data-commerce-template-kind="simpleTripCom" data-commerce-template-text="${commerceEncodedCopyText(copyTexts.tripCom)}">复制 Trip.com / 携程模板</button>
        <button class="cmd-btn gray commerce-sandbox-dry-run-btn" type="button">查看 Sandbox Dry Run</button>
        <button class="cmd-btn gray commerce-sandbox-provider-matrix-btn" type="button">查看候选平台沙箱矩阵</button>
      </div>
      ${commerceFlightProviderCandidatesDisclosure(task)}
      ${commerceFlightProviderApprovalDisclosure(task)}
      ${commerceFlightReadonlyStubPermissionDisclosure(task)}
      ${commerceFlightReadonlyStubAdapterDisclosure(task)}
      ${commerceFlightSandboxDryRunDisclosure(task)}
      ${commerceFlightSandboxProviderMatrixDisclosure(task)}
      <p class="commerce-result-summary-status"><b>外部搜索提示：</b>点击后会打开外部搜索或外部平台。实时价格、库存、出票规则和付款均以外部平台为准。weishan 当前不返回价格，不付款，不下单。全网搜索结果由外部搜索引擎提供，weishan 不保证结果网站安全。请优先选择官方平台、知名旅行平台和航空公司官网。</p>
      <p class="commerce-result-summary-copy-feedback" data-commerce-copy-feedback data-commerce-platform-template-feedback aria-live="polite"></p>
    </section>`;
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
    const workspace = commerceSubPlanCompletionWorkspaceForTask(task);
    const display = commerceSubPlanCompletionWorkspaceDisplay(workspace);
    const items = Array.isArray(display.items) ? display.items : [];
    const hasTravelPlan = items.some((item) => /旅行计划/.test(String(item && item.title || "")));
    const hasProductPlan = items.some((item) => /商品采购计划|商品/.test(String(item && item.title || "")));
    const completedCount = Number(display.completedFieldCountLabel || 0);
    if (!hasTravelPlan || !hasProductPlan || completedCount < 9) return "";
    return commerceOneScreenResultPanelHtml();
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
    const analysisProcessBody = !blocked ? [
      commerceLocalIntentPanelHtml(task),
      commerceComplexIntentSplitPanelHtml(task),
      commerceSubPlanGateMatrixPanelHtml(task),
      commerceSubPlanQuestionsPanelHtml(task),
      commerceSubPlanAnswerCollectionPanelHtml(task),
      commerceSubPlanCompletionWorkspacePanelHtml(task)
    ].join("") : "";
    const analysisProcessDisclosure = analysisProcessBody ? disclosure("查看分析过程", analysisProcessBody, "commerce-process-disclosure") : "";
    const technicalDetails = technicalDetailsDisclosure([
      `<p>技术细节只用于内部说明，不影响默认结果。这里会显示 provider、API key、endpoint、Connector Gate、Sandbox Dry Run、Provider Approval、Provider Onboarding、Secret Storage、Stub、dispatch、gate、AI fallback，以及本地规则优先 + AI fallback 等内部状态。</p>`,
      providerPoolNoticeHtml(task, configInfo, onboardingInfo, approvalInfo),
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
          <b>该请求涉及下单 / 付款，已阻断。</b>
          <span>不会下单、付款或提交订单，也不会上传身份证/护照或提交询价表。</span>
        </div>
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
    const simpleFlightResultMode = commerceIsSimpleFlightTask(task);
    const oneScreenResultMode = !!resultSummaryPanel && !blocked;
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
    if (selected && selected.taskId !== lastViewedTaskId) {
      lastViewedTaskId = selected.taskId;
      record("commerceAgent.planViewed", selected, "用户已查看全球采购计划详情。");
    }
  }

  window.CommerceAgentPage = { mount:render };
})();
