(function(){
  let draftText = "";
  let lastViewedTaskId = "";

  function esc(s){
    return String(s || "").replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; });
  }

  function agent(){
    return window.WeishanCommerceAgent || null;
  }

  function record(action, plan, outputSummary){
    const api = agent();
    if (!api || !window.HistoryApi || typeof window.HistoryApi.record !== "function") return;
    window.HistoryApi.record(action, api.createCommerceHistoryPayload(action, Object.assign({}, plan || {}, {
      outputSummary:outputSummary || ""
    })));
  }

  function section(title, body){
    return `<div class="commerce-section">
      <h3>${esc(title)}</h3>
      ${body}
    </div>`;
  }

  function list(items){
    return `<ul>${(items || []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
  }

  function planHtml(plan){
    if (!plan) {
      return `<div class="commerce-empty">
        <b>暂无采购计划</b>
        <span>可以从首页总调度输入采购、比价、订票、订酒店、商品选择等需求，也可以在这里生成本地 mock-safe 采购计划。</span>
      </div>`;
    }
    return `<div class="commerce-plan" data-commerce-plan="true">
      <div class="commerce-plan-head">
        <div>
          <h2>来自首页总调度的采购任务</h2>
          <p>${esc(plan.inputSummary)}</p>
        </div>
        <span class="commerce-badge">${esc(plan.category)}</span>
      </div>
      ${section("需求理解", `<p>${esc(plan.normalizedFields && plan.normalizedFields.need || plan.inputSummary)}</p>`)}
      ${section("搜索范围", list(plan.searchScope))}
      ${section("比较维度", list(plan.decisionCriteria))}
      ${section("推荐规则", `<p>默认决策目标：同等条件下价格最低；同时综合评分、信誉、售后、退改政策、时效、地区限制、风险和隐性费用。</p>${list(plan.recommendationFormat)}`)}
      ${section("执行边界", `<p class="commerce-safe">当前为本地 mock-safe 采购计划。真实搜索、比价和下单将在后续插件接入后启用。</p>${list(plan.executionBoundary)}`)}
      ${section("下一步", `<p>进入搜索与比较前，需要用户确认搜索范围、预算、地区限制、付款边界和是否允许后续真实执行。</p>`)}
    </div>`;
  }

  function render(host){
    const api = agent();
    const plan = api && api.getCommercePlan ? api.getCommercePlan() : null;
    host.innerHTML = `<section class="commerce-page">
      <div class="commerce-hero">
        <div>
          <h1>全球采购</h1>
          <p>搜索、比价、推荐、执行前确认</p>
        </div>
        <button class="cmd-btn gray" id="commerceBackHome" type="button">返回首页总调度</button>
      </div>

      <div class="commerce-toolbar">
        <textarea id="commerceInput" class="cmd-input commerce-input" placeholder="例如：帮我比较 OpenRouter 和其他 AI 模型平台价格">${esc(draftText)}</textarea>
        <div class="cmd-actions">
          <button class="cmd-btn primary" id="commerceGenerate" type="button">生成采购计划</button>
          <button class="cmd-btn gray" id="commerceClear" type="button">清理计划</button>
        </div>
      </div>

      ${planHtml(plan)}
    </section>`;
    bind(host, plan);
  }

  function bind(host, plan){
    const api = agent();
    const input = host.querySelector("#commerceInput");
    if (input) input.addEventListener("input", () => { draftText = input.value; });
    const back = host.querySelector("#commerceBackHome");
    if (back) back.addEventListener("click", () => window.WeishanRouter && window.WeishanRouter.setRoute("home"));
    const generate = host.querySelector("#commerceGenerate");
    if (generate) generate.addEventListener("click", () => {
      if (!api || !api.createCommercePlan) return;
      const text = input && input.value.trim() || "生成全球采购计划";
      const nextPlan = api.saveCommercePlan(api.createCommercePlan(text));
      record("commerceAgent.planCreated", nextPlan, "已在全球采购模块生成本地 mock-safe 采购计划。");
      render(host);
    });
    const clear = host.querySelector("#commerceClear");
    if (clear) clear.addEventListener("click", () => {
      if (api && api.clearCommercePlan) api.clearCommercePlan();
      record("commerceAgent.planCleared", plan || {}, "用户已清理全球采购计划。");
      render(host);
    });
    if (plan && plan.taskId !== lastViewedTaskId) {
      lastViewedTaskId = plan.taskId;
      record("commerceAgent.planViewed", plan, "用户已查看全球采购计划。");
    }
  }

  window.CommerceAgentPage = { mount:render };
})();
