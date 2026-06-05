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
    if (window.WeishanCommerceSearch || document.querySelector('script[data-weishan-dynamic="WeishanCommerceSearch"]')) return;
    const script = document.createElement("script");
    script.src = "./renderer/core/commerceSearch.js?v=2.0.15";
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
    if (status === "completed") return "已返回真实候选方案";
    if (status === "noResults") return "暂无可展示结果";
    if (status === "ready") return "搜索源已配置";
    if (status === "missingFields") return "搜索条件缺失";
    if (status === "failed") return "搜索失败";
    if (status === "blocked") return "已阻断";
    return "搜索源未配置，无法返回真实价格";
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
    const hasProvider = isModelPricing || !!(search && search.hasCommerceSearchProvider && search.hasCommerceSearchProvider(settings));
    const category = detail.categoryLabel || task.categoryLabel || task.category || "全球采购";
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
    return `<div class="commerce-detail" data-commerce-detail="${esc(task.taskId)}">
      <div class="commerce-detail-head">
        <div>
          <h2>${esc(commerceDisplayTitle(task))}</h2>
          <p>${esc(task.inputSummary)}</p>
        </div>
        <span class="commerce-status ${esc(task.status)}">${esc(taskStatusLabel(task.status))}</span>
      </div>
      <div class="commerce-detail-grid">
        ${section("需求理解", `<dl class="commerce-facts">
          <div><dt>用户需求</dt><dd>${esc(detail.demandUnderstanding || task.inputSummary)}</dd></div>
          <div><dt>类目</dt><dd>${esc(category)}</dd></div>
          <div><dt>当前状态</dt><dd>${esc(taskStatusLabel(task.status))} · ${esc(searchStatusLabel(task))}</dd></div>
        </dl>`)}
        ${section("搜索源状态", searchStatusHtml(task, settings, hasProvider), "commerce-section-tight")}
        ${section("搜索条件确认", searchRequestHtml(request), "commerce-section-tight")}
        ${section("搜索范围", chips(detail.searchScope), "commerce-section-tight")}
        ${section("比较维度", chips(detail.comparisonDimensions), "commerce-section-tight")}
        ${section("决策规则", `<p>${esc(detail.decisionRule)}</p>`)}
        ${section("候选方案", candidatesHtml(task), "commerce-section-wide")}
        ${section("推荐结果", recommendationHtml(task), "commerce-section-wide")}
        ${section("推荐输出格式", `<p class="commerce-muted">后续真实搜索后会生成：</p>${chips(detail.recommendationTemplate && detail.recommendationTemplate.fields)}`)}
        ${section("候选方案字段模板", `<p class="commerce-muted">仅展示字段结构，不填真实价格，不伪造实时库存或可用性。</p>${chips(detail.candidateSchema)}`)}
        ${section("执行边界", `<div class="commerce-risk">当前只搜索和展示候选方案，不下单、不付款、不提交订单。</div>${chips(["不自动填写订单", "不保存支付或身份信息", "最终执行必须用户确认", "价格可能变化"])}`)}
        ${section("下一步建议", list(["补充预算、时间、地区限制。", "后续接入真实搜索插件后填入候选方案。", "下单或付款前必须再次确认。"]))}
      </div>
    </div>`;
  }

  function searchStatusHtml(task, settings, hasProvider){
    const missingFields = Array.isArray(task && task.missingFields) && task.missingFields.length ? task.missingFields : [];
    const disabled = !hasProvider || missingFields.length > 0;
    const isModelPricing = task && task.category === "aiModelPricing";
    const isFlight = task && task.category === "flight";
    const isCruise = task && task.category === "cruise";
    const isPrivateJet = task && task.category === "privateJet";
    const normalized = task && task.normalizedFields || {};
    const flightOrigin = normalized.originText || "待补充";
    const flightDestination = normalized.destinationText || "待补充";
    const flightDate = normalized.dateText || normalized.timing || "待补充";
    const providerLabel = isModelPricing ? "OpenRouter" : hasProvider ? settings.providerName || "commerceProvider" : "未配置";
    const failedMessage = task && task.searchStatus === "failed" ? task.searchErrorMessage || (isModelPricing ? "OpenRouter 搜索源不可用，无法返回真实价格。" : "搜索失败，无法返回真实价格。") : "";
    const buttonLabel = isModelPricing ? "搜索 OpenRouter 模型价格" : missingFields.length ? "搜索真实价格" : hasProvider ? "搜索真实价格" : "搜索源未配置";
    return `<div class="commerce-search-panel">
      <p><b>${hasProvider ? "已配置：" : "未配置："}</b>${isModelPricing ? (hasProvider ? "OpenRouter provider 可用于模型价格搜索。" : "OpenRouter provider 不可用。") : hasProvider ? "可以搜索真实候选方案。" : isFlight ? "搜索源未配置，无法返回真实机票价格。" : "搜索源未配置，无法返回真实价格。"}</p>
      ${isFlight && !hasProvider ? `<div class="commerce-warning commerce-flight-provider-missing">
        <b>已识别为机票搜索计划。</b>
        <span>出发地：${esc(flightOrigin)} · 目的地：${esc(flightDestination)} · 日期：${esc(flightDate)}</span>
        <span>未配置真实机票搜索 provider，当前不会返回实时机票价格。</span>
        <span>不会提交订单、不会请求付款，也不会上传或保存身份证/护照。</span>
      </div>` : ""}
      <p class="commerce-muted">Provider：${esc(providerLabel)}</p>
      ${isCruise ? `<p class="commerce-warning">邮轮价格受航线、舱型、日期和人数影响较大。当前未接入真实搜索源时不显示价格。</p>` : ""}
      ${isPrivateJet ? `<p class="commerce-warning">公务机属于高价值定制服务，价格通常需要询价确认。当前仅生成搜索和询价计划，不自动提交询价、不付款、不签约。</p>` : ""}
      ${failedMessage ? `<p class="commerce-warning">${esc(failedMessage)}</p>` : ""}
      ${missingFields.length ? `<p class="commerce-warning">请补充${esc(missingFields.join("、"))}，否则不搜索价格。</p>` : ""}
      <button class="cmd-btn primary commerce-search-real" type="button" data-task-id="${esc(task.taskId)}" ${disabled ? "disabled" : ""}>${esc(disabled && !missingFields.length && !isModelPricing ? "搜索源未配置" : buttonLabel)}</button>
      <p class="commerce-muted">价格只来自已配置 provider 返回数据；未配置时不会显示假价格。</p>
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

  function candidatesHtml(task){
    const candidates = (Array.isArray(task && task.candidates) ? task.candidates : []).slice(0, 3);
    if (!candidates.length) {
      const status = String(task && task.searchStatus || "");
      const noResultText = status === "noResults" ? "provider 未返回可展示结果。" : "搜索源未配置或尚未执行真实搜索。";
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
      const total = item.totalPrice !== undefined && item.totalPrice !== null ? item.totalPrice : item.price;
      return item.currency && total !== "" && total !== undefined && total !== null ? item.currency + " " + total : item.priceLabel || "";
    };
    return `<div class="commerce-candidates">
      ${candidates.map((item, index) => `<article class="commerce-candidate-card">
        <div class="commerce-candidate-head">
          <div>
            <b>${index === 0 && !isModelPricing ? '<span class="commerce-lowest-badge">最低价推荐</span> ' : ""}${esc(item.title)}</b>
            <span>${esc(item.provider || item.sourceName)}${item.modelId ? " · " + esc(item.modelId) : ""} · ${esc(item.fetchedAt || item.collectedAt)}</span>
          </div>
          <strong>${esc(priceText(item))}</strong>
        </div>
        ${isModelPricing ? `<dl class="commerce-model-pricing">
          <div><dt>模型 ID</dt><dd>${esc(item.modelId || item.candidateId)}</dd></div>
          <div><dt>输入价格</dt><dd>${esc(item.inputPriceLabel || "价格字段不可解析")}</dd></div>
          <div><dt>输出价格</dt><dd>${esc(item.outputPriceLabel || "价格字段不可解析")}</dd></div>
          <div><dt>上下文长度</dt><dd>${esc(item.contextLength || "未提供")}</dd></div>
          <div><dt>币种</dt><dd>USD</dd></div>
        </dl>` : ""}
        <div class="commerce-candidate-meta">
          ${chips([item.departTime && item.arriveTime ? item.departTime + " → " + item.arriveTime : "", item.duration, item.conditions, item.refundPolicySummary, item.riskSummary, item.hiddenFeeNote].concat(item.extras || []).filter(Boolean))}
        </div>
        <p class="commerce-muted">推荐理由：${esc(item.recommendationReason || "按价格、条件和风险排序后进入候选。")}</p>
        ${item.bookingUrl || item.url ? `<p class="commerce-booking-note">点击后将在外部平台完成预订或付款。weishan 不自动支付、不提交订单、不保存证件或银行卡。</p><button class="cmd-btn gray commerce-booking-link" type="button" data-url="${esc(item.bookingUrl || item.url)}">${esc(actionLabel(item))}</button>` : `<p class="commerce-warning">${isModelPricing ? "模型页链接不是 https 或不属于 openrouter.ai，已阻断打开。" : "provider URL 缺失或不是 https，已阻断打开。"}</p>`}
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
        当前只搜索和展示候选方案，不下单、不付款、不提交订单。
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
    const generate = host.querySelector("#commerceGenerate");
    if (generate) generate.addEventListener("click", () => {
      if (!api || !api.createCommerceTask || !api.addCommerceTask) return;
      const text = input && input.value.trim() || "生成全球采购计划";
      const task = api.addCommerceTask(api.createCommerceTask(text));
      selectedTaskId = task.taskId;
      record("commerceAgent.taskCreated", task, "已在全球采购工作台生成本地 mock-safe 采购计划。");
      render(host);
    });
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
          const status = result.code === "COMMERCE_MISSING_FIELDS" ? "missingFields" : result.code === "COMMERCE_PROVIDER_NOT_CONFIGURED" ? "providerMissing" : result.code === "COMMERCE_NO_RESULTS" ? "noResults" : "failed";
          const updated = api.updateCommerceTask(taskId, {
            searchStatus:status,
            missingFields:result.request && result.request.missingFields || target.missingFields || [],
            searchProviderName:result.providerName || (isModelPricing ? "OpenRouter" : ""),
            searchErrorMessage:result.message || "",
            searchResultSummary:{ candidateCount:0 },
            updatedAt:new Date().toISOString()
          });
          recordSearch(isModelPricing ? "commerceAgent.openRouterSearchFailed" : status === "providerMissing" ? "commerceAgent.searchProviderMissing" : "commerceAgent.searchFailed", Object.assign({}, updated || target, {
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
          candidates:sorted,
          recommendation,
          searchResultSummary:{
            candidateCount:sorted.length,
            lowestPrice:first.totalPrice || first.price || "",
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
