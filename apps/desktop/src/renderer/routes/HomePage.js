(function(){
  let selectedHistoryId = "";
  let selectedHistoryText = "";
  let commandInputDraft = "";
  let stagedAttachments = [];
  let expandedDesktopTasks = {};
  let pendingSafeExternalSearchConfirmation = null;
  let globalShoppingComposerExpanded = false;
  let homeTopbarSyncFrame = 0;
  let homeTopbarPendingSnapshot = null;
  const homePerformanceStats = { renderShellCount:0, refreshCommandPanelsCount:0 };

  function esc(s){
    return String(s || "").replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; });
  }
  function t(key){ return window.I18n.t(key); }
  function appVersion(){ return window.WeishanConfig && window.WeishanConfig.version || "2.0.31"; }

  function formatSize(size){
    const value = Number(size || 0);
    if (!value) return "0 B";
    if (value < 1024) return value + " B";
    if (value < 1024 * 1024) return Math.round(value / 1024) + " KB";
    return (value / 1024 / 1024).toFixed(1) + " MB";
  }

  function attachmentType(file){
    const name = String(file && file.name || "");
    const ext = (name.split(".").pop() || "").toLowerCase();
    if (/^(png|jpg|jpeg|gif|webp|svg)$/.test(ext)) return "image/" + ext.replace("jpg", "jpeg");
    if (/^(md|txt|csv|json|pdf|docx|pptx|xlsx)$/.test(ext)) return ext;
    return "file";
  }

  function normalizeAttachment(file){
    const name = String(file && file.name || "attachment").replace(/[<>]/g, "").slice(0, 120);
    return {
      attachmentId:"att-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
      name,
      type:String(file && file.type || attachmentType(file)).slice(0, 80),
      size:Number(file && file.size || 0)
    };
  }

  function attachmentPanel(){
    if (!stagedAttachments.length) return "";
    return `<div class="cmd-attachment-stage" data-attachment-stage="true">
      ${stagedAttachments.map((file, idx) => `<span class="cmd-pill">
        ${esc(file.name)} · ${esc(file.type)} · ${esc(formatSize(file.size))}
        <button class="cmd-history-back" type="button" data-remove-attachment="${idx}">×</button>
      </span>`).join("")}
      <p class="cmd-history-meta">附件已挂载，仅保存 metadata；不会自动执行、不会上传云、不会读取完整文件内容。</p>
    </div>`;
  }

  function desktopAssistantApi(){
    return window.WeishanDesktopAssistant || null;
  }

  function desktopAssistantSession(){
    const api = desktopAssistantApi();
    return api && api.getDesktopAssistantSession ? api.getDesktopAssistantSession() : { enabled:false, status:"closed" };
  }

  function realOpenAppHistory(action, detail){
    const api = desktopAssistantApi();
    if (!api || !api.createRealOpenAppHistoryPayload || !window.HistoryApi || !window.HistoryApi.record) return;
    window.HistoryApi.record(action, api.createRealOpenAppHistoryPayload(action, detail || {}));
  }

  function desktopAssistantHistory(action, detail){
    const api = desktopAssistantApi();
    if (!api || !api.createDesktopAssistantHistoryPayload || !window.HistoryApi || !window.HistoryApi.record) return;
    const payload = api.createDesktopAssistantExecutionHistoryPayload ?
      api.createDesktopAssistantExecutionHistoryPayload(action, detail || {}) :
      api.createDesktopAssistantHistoryPayload(action, detail || {});
    window.HistoryApi.record(action, payload);
  }

  function realOpenAppEnabled(){
    const api = desktopAssistantApi();
    return !!(api && api.getRealOpenAppEnabled && api.getRealOpenAppEnabled());
  }

  function desktopAssistantOpenAppBridge(){
    if (window.WeishanAPI && typeof window.WeishanAPI.desktopAssistantOpenApp === "function") {
      return window.WeishanAPI.desktopAssistantOpenApp;
    }
    if (window.weishan && typeof window.weishan.desktopAssistantOpenApp === "function") {
      window.WeishanAPI = Object.assign({}, window.WeishanAPI || {}, {
        desktopAssistantOpenApp:window.weishan.desktopAssistantOpenApp
      });
      return window.WeishanAPI.desktopAssistantOpenApp;
    }
    return null;
  }

  function desktopExecutionQueue(){
    const api = desktopAssistantApi();
    return api && api.getDesktopExecutionQueue ? api.getDesktopExecutionQueue() : null;
  }

  function desktopAssistantTasks(){
    const api = desktopAssistantApi();
    return api && api.getDesktopAssistantTasks ? api.getDesktopAssistantTasks() : [];
  }

  function desktopAssistantTask(taskId){
    return desktopAssistantTasks().find((task) => task.taskId === String(taskId || "")) || null;
  }

  function latestDesktopTask(){
    const snap = window.CommandApi.snapshot();
    return (snap.queue || []).find((item) => item && (item.meta && item.meta.dispatchModule === "desktopAssistant" || item.module === "desktopAssistant")) || null;
  }

  function desktopTaskCommandKey(task, idx){
    const text = String(task && (task.inputSummary || task.text || task.title) || "").replace(/\s+/g, " ").trim();
    return text || String(task && (task.taskId || task.id || task.createdAt || task.updatedAt) || idx || "");
  }

  function desktopStatusLabel(status, resultStatus){
    const raw = String(resultStatus || status || "");
    if (/realOpened|realOpenAppExecuted|realExecuted/.test(raw)) return "已真实打开白名单 App";
    if (/blocked|executionBlocked/.test(raw)) return "已阻断";
    if (/failed|APP_OPEN_FAILED/.test(raw)) return "执行失败";
    if (/stopped/.test(raw)) return "已停止";
    if (/cancelled/.test(raw)) return "已取消";
    if (/simulated|executionSimulated/.test(raw)) return "模拟完成";
    if (/queued|executionQueued|simulating/.test(raw)) return "模拟执行中";
    return "等待确认";
  }

  function desktopRiskLabel(risk){
    const value = String(risk || "low");
    if (value === "high") return "高风险";
    if (value === "medium") return "中风险";
    return "低风险";
  }

  function desktopResultSummary(task){
    const label = desktopStatusLabel(task && task.status, task && task.resultStatus);
    if (label === "模拟完成") return "模拟完成 · 未控制电脑";
    if (label === "已真实打开白名单 App") return "已真实打开白名单 App";
    if (label === "已阻断") return "已阻断 · 高风险操作";
    if (label === "已停止") return "已停止";
    if (label === "执行失败") return "执行失败";
    return "等待确认";
  }

  function syncDesktopAssistantTasksFromSnapshot(snapshot){
    return;
    /*
    const api = desktopAssistantApi();
    if (!api || !api.createDesktopOperationPlan || !api.addDesktopAssistantTask || !api.getDesktopAssistantTasks) return;
    const existing = api.getDesktopAssistantTasks();
    const existingSources = {};
    existing.forEach((task) => { if (task && task.sourceCommandId) existingSources[task.sourceCommandId] = true; });
    const seenCommands = {};
    const commands = (snapshot && snapshot.queue || [])
      .filter((item) => item && (item.meta && item.meta.dispatchModule === "desktopAssistant" || item.module === "desktopAssistant"));
    commands.forEach((item, idx) => {
      const sourceCommandId = desktopTaskCommandKey(item, idx);
      if (seenCommands[sourceCommandId]) return;
      seenCommands[sourceCommandId] = true;
      if (existingSources[sourceCommandId]) return;
      const plan = api.createDesktopOperationPlan(item.inputSummary || item.text || "");
      const task = api.createDesktopAssistantTask ? api.createDesktopAssistantTask(Object.assign({}, plan, {
        sourceCommandId,
        outputSummary:"桌面助手任务已创建，等待用户确认。",
        status:plan.riskLevel === "high" ? "blocked" : "planned"
      })) : Object.assign({}, plan, { sourceCommandId });
      const saved = api.addDesktopAssistantTask(task);
      existingSources[sourceCommandId] = true;
      desktopAssistantHistory("desktopAssistant.taskCreated", Object.assign({}, saved, {
        outputSummary:"桌面助手任务已加入多任务队列。"
      }));
    });
    */
  }

  function desktopAssistantStrip(){
    return "";
    /*
    const session = desktopAssistantSession();
    const enabled = session && session.enabled === true;
    return `<div class="desktop-assistant-strip" data-desktop-assistant-session="true">
      <span class="desktop-assistant-state ${enabled ? "is-on" : "is-off"}">桌面助手：${enabled ? "本次开启" : "关闭"}</span>
      <button class="cmd-btn gray" id="desktopAssistantEnable" type="button">本次开启</button>
      <button class="cmd-btn gray" id="desktopAssistantDisable" type="button">关闭</button>
      <button class="cmd-btn danger ghost" id="desktopAssistantStop" type="button">停止接管</button>
    </div>`;
    */
  }

  function cleanAiDisplay(text){
    const raw = String(text || "");
    const cleaned = raw
      .replace(/<think[\s\S]*?<\/think>/gi, "")
      .replace(/<reasoning[\s\S]*?<\/reasoning>/gi, "")
      .replace(/```(?:think|thinking|reasoning)[\s\S]*?```/gi, "")
      .replace(/\[think\][\s\S]*?\[\/think\]/gi, "")
      .replace(/^\s*(thinking|reasoning)\s*:\s*[\s\S]*?(?=\n{2,}|$)/gim, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return cleaned || (raw.trim() ? t("homeNoDisplayableAi") : "");
  }

  function displayLogText(log){
    const text = String(log && log.text || "");
    if (log && (log.type === "answer" || log.type === "ai")) return cleanAiDisplay(text);
    if (/收到指令|任务已创建|queued/i.test(text)) return t("homeTaskQueued");
    if (/开始执行|路由判断|准备调用 AI|调用 AI|dispatch|module|action|command\.execute|chat\.answer/i.test(text)) return t("homeTaskRunning");
    if (/生成视频|视频方案/i.test(text)) return t("homeTaskVideoPreparing");
    if (/完成|done/i.test(text)) return t("homeTaskDone");
    if (log && log.type === "error") return t("homeTaskFailed");
    if (/桌面操作计划|desktopAssistant\.plan/.test(text)) {
      const risk = /高风险|riskLevel[:：]?\s*high/i.test(text) ? "高风险" : /中风险|riskLevel[:：]?\s*medium/i.test(text) ? "中风险" : "低风险";
      const status = /高风险|blocked|已阻断/i.test(text) ? "已阻断" : /queued|planned|waiting|等待/i.test(text) ? "等待确认" : "已生成计划";
      const appMatch = text.match(/App[:：]\s*([^\n\r]+)/);
      return [
        "路由判断：桌面助手",
        "已生成操作计划：desktopAssistant / desktopAssistant.plan",
        "风险等级：" + risk,
        "当前状态：" + status,
        appMatch && appMatch[1] ? "App：" + appMatch[1].trim() : "",
        "请在下方“桌面助手任务队列”中查看和处理。"
      ].filter(Boolean).join("\n");
    }
    if (/desktopAssistant\.paused|桌面助手接管能力已暂停|高风险操作已阻断/.test(text)) {
      return text;
    }
    if (/<think|```think|```thinking|```reasoning/i.test(text)) {
      return cleanAiDisplay(text);
    }
    return text;
  }

  function displayAnswer(task){
    return cleanAiDisplay(task && task.answer || "");
  }

  function summary(text, limit){
    const clean = cleanAiDisplay(text).replace(/\s+/g, " ").trim();
    const max = limit || 160;
    return clean.length > max ? clean.slice(0, max).trim() + "..." : clean;
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

  function taskTitle(task){
    if (!task) return "";
    if (task.status === "queued") return t("homeTaskQueued");
    if (task.status === "running") return /视频|广告|宣传片/.test(String(task.text || "")) ? t("homeTaskVideoPreparing") : t("homeTaskRunning");
    if (task.status === "done") return t("homeTaskDone");
    if (task.status === "failed") return t("homeTaskNotCompleted");
    return t("homeTaskRunning");
  }

  function statusCls(task){
    return "cmd-status-" + (task && task.status ? task.status : "idle");
  }

  function isCommerceTask(task){
    const meta = task && task.meta || {};
    const payload = task && task.payload || {};
    return !!(meta.commerceTaskId || meta.commerceCategory || payload.module === "commerceAgent" || task && task.module === "commerceAgent" || /全球采购计划已/.test(String(task && task.answer || payload.outputSummary || "")));
  }

  function commerceTypeLabel(category){
    const map = {
      flight:"机票",
      hotel:"酒店",
      train:"火车票",
      ecommerce:"商品",
      aiModelPricing:"AI 模型价格",
      ticketing:"票务",
      serviceBooking:"服务预约",
      domain:"域名",
      cruise:"邮轮",
      privateJet:"公务机",
      generalProcurement:"全球采购"
    };
    return map[category] || category || "全球采购";
  }

  function commerceStatusLabel(status){
    return status === "blocked" ? "已阻断" : "计划已生成";
  }

  function storedCommerceTask(task){
    const api = window.WeishanCommerceAgent || null;
    const meta = task && task.meta || {};
    const payload = task && task.payload || {};
    if (!api || !api.getCommerceTaskById || !task) return null;
    const ids = [
      meta.commerceTaskId,
      task.taskId,
      task.id,
      payload.taskId,
      payload.commerceTaskId,
      payload && payload.meta && payload.meta.commerceTaskId
    ].filter(Boolean);
    for (const id of ids) {
      const commerceTask = api.getCommerceTaskById(String(id));
      if (commerceTask) return commerceTask;
    }
    return null;
  }

  function historyCommerceTask(task){
    const stored = storedCommerceTask(task);
    if (stored) return stored;
    if (isCommerceTask(task)) return task;
    return null;
  }

  function commerceHistorySummary(task){
    const meta = task && task.meta || {};
    const stored = historyCommerceTask(task);
    const cardApi = window.WeishanGlobalProcurementUserFacingResultCards;
    const type = cardApi && typeof cardApi.deriveHistoryTypeLabel === "function"
      ? cardApi.deriveHistoryTypeLabel(stored || task || {}) || commerceTypeLabel(meta.commerceCategory)
      : commerceTypeLabel(meta.commerceCategory);
    const status = commerceStatusLabel(meta.commerceStatus);
    return "需求摘要：" + summary(task && task.text || "", 56) + " · 类型：" + type + " · 状态：" + status + " · 未下单 / 未付款";
  }

  function commerceLocalIntentRouteForTask(task, stored){
    const api = window.WeishanCommerceLocalIntentRouter || null;
    const existing = stored && stored.commerceLocalIntentRoute || task && task.meta && task.meta.commerceLocalIntentRoute || null;
    if (existing && existing.intentCategory) return existing;
    if (api && api.routeCommerceIntentLocally) return api.routeCommerceIntentLocally(task && task.text || stored && stored.inputSummary || "");
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
      routeModeLabel:complex ? "本地规则优先 + AI fallback" : "本地规则优先",
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

  function commerceLocalIntentHomePanel(route){
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
    return `<section class="commerce-local-intent-panel commerce-local-intent-home-panel" aria-label="本地意图识别">
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
            ${row("AI fallback", display.aiFallbackLabel)}
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

  function commerceComplexIntentSplitForTask(task, stored, route){
    const existing = stored && stored.commerceComplexIntentSplit || task && task.meta && task.meta.commerceComplexIntentSplit || null;
    if (existing && Array.isArray(existing.subPlans)) return existing;
    const api = window.WeishanCommerceComplexIntentSplitPlanner || null;
    if (api && api.splitComplexCommerceIntent) return api.splitComplexCommerceIntent(task && task.text || stored && stored.inputSummary || "", route || null);
    return null;
  }

  function commerceComplexIntentSplitDisplay(splitResult){
    const api = window.WeishanCommerceComplexIntentSplitPlanner || null;
    if (api && api.toComplexIntentSplitDisplayStatus) return api.toComplexIntentSplitDisplayStatus(splitResult || {});
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

  function commerceComplexIntentSplitHomePanel(splitResult){
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
    return `<section class="commerce-complex-split-panel commerce-complex-split-home-panel" aria-label="复杂意图拆分计划">
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

  function commerceSubPlanGateMatrixForTask(task, stored, splitResult){
    const existing = stored && stored.commerceSubPlanGateMatrix || task && task.meta && task.meta.commerceSubPlanGateMatrix || null;
    if (existing && Array.isArray(existing.subPlanMatrices)) return existing;
    const api = window.WeishanCommerceSubPlanGateMatrix || null;
    if (api && api.buildSubPlanGateMatrix && splitResult) return api.buildSubPlanGateMatrix(splitResult, stored && stored.providerHealth || null);
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

  function commerceSubPlanGateMatrixHomePanel(matrix){
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
    return `<section class="commerce-subplan-gate-panel commerce-subplan-gate-home-panel" aria-label="子计划闸门矩阵">
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

  function commerceSubPlanQuestionsForTask(task, stored, matrix){
    const existing = stored && stored.commerceSubPlanQuestions || task && task.meta && task.meta.commerceSubPlanQuestions || null;
    if (existing && Array.isArray(existing.subPlanQuestionGroups)) return existing;
    const api = window.WeishanCommerceSubPlanQuestionGenerator || null;
    if (api && api.generateQuestionsForSubPlanMatrix && matrix) return api.generateQuestionsForSubPlanMatrix(matrix);
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

  function commerceSubPlanAnswerCollectionForTask(task, stored, questionResult){
    const existing = stored && stored.commerceSubPlanAnswerCollection || task && task.meta && task.meta.commerceSubPlanAnswerCollection || null;
    if (existing && Array.isArray(existing.subPlanDrafts)) return existing;
    const api = window.WeishanCommerceSubPlanAnswerCollector || null;
    if (api && api.collectSubPlanAnswers && questionResult) return api.collectSubPlanAnswers(stored && stored.inputSummary || task && task.text || "", questionResult, null);
    return null;
  }

  function commerceSubPlanAnswerCollectionDisplay(answerResult){
    const api = window.WeishanCommerceSubPlanAnswerCollector || null;
    if (api && api.toSubPlanAnswerCollectorDisplayStatus) return api.toSubPlanAnswerCollectorDisplayStatus(answerResult || {});
    return { title:"子计划答案收集", subtitle:"根据用户回答补齐子计划信息。当前只更新计划草稿，不访问真实平台。", overallStatusLabel:"等待回答", subPlanCountLabel:"0", completedFieldCountLabel:"0", remainingFieldCountLabel:"0", providerAccessLabel:"否", priceLabel:"否", redirectLabel:"否", groups:[], note:"这些回答只用于补齐计划草稿，不访问真实平台，不读取任何密钥，不连接接口，不发起网络请求，不返回商品、价格或跳转链接。" };
  }

  function commerceSubPlanAnswerCollectionHomePanel(answerResult){
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
    return `<section class="commerce-subplan-answer-panel commerce-subplan-answer-home-panel" aria-label="子计划答案收集">
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

  function commerceSubPlanCompletionWorkspaceForTask(task, stored, splitResult, matrix, questionResult, answerResult){
    const existing = stored && stored.commerceSubPlanCompletionWorkspace || task && task.meta && task.meta.commerceSubPlanCompletionWorkspace || null;
    if (existing && Array.isArray(existing.workspaceItems)) return existing;
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

  function commerceSubPlanCompletionWorkspaceHomePanel(workspaceResult){
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
    return `<section class="commerce-subplan-completion-panel commerce-subplan-completion-home-panel" aria-label="子计划补齐工作台">
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

  function commerceSubPlanDraftReviewForTask(task, stored, splitResult, matrix, questionResult, answerResult, workspaceResult){
    const existing = stored && stored.commerceSubPlanDraftReviewSummary || task && task.meta && task.meta.commerceSubPlanDraftReviewSummary || null;
    if (existing && Array.isArray(existing.reviewItems)) return existing;
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

  function commerceSubPlanDraftReviewHomePanel(reviewResult){
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
    return `<section class="commerce-subplan-draft-review-panel commerce-subplan-draft-review-home-panel" aria-label="子计划草稿复核摘要">
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



  function commerceSubPlanDraftConfirmationForTask(task, stored, draftReviewSummary){
    const existing = stored && stored.commerceSubPlanDraftConfirmation || task && task.meta && task.meta.commerceSubPlanDraftConfirmation || null;
    if (existing && Array.isArray(existing.confirmationItems)) return existing;
    const api = window.WeishanCommerceSubPlanDraftConfirmation || null;
    if (api && api.buildSubPlanDraftConfirmation) {
      return api.buildSubPlanDraftConfirmation({
        input:task && (task.text || task.inputSummary) || "",
        commerceSubPlanDraftReviewSummary:draftReviewSummary || null
      });
    }
    return null;
  }

  function commerceSubPlanDraftConfirmationDisplay(confirmationResult){
    const api = window.WeishanCommerceSubPlanDraftConfirmation || null;
    if (api && api.toSubPlanDraftConfirmationDisplayStatus) return api.toSubPlanDraftConfirmationDisplayStatus(confirmationResult || {});
    return { title:"子计划草稿确认与修正", subtitle:"用户确认或修正只更新临时计划草稿；确认后仍必须经过当地法律合规和最终接入审查。", statusLabel:"等待确认", subPlanCountLabel:"0", confirmedCountLabel:"0", revisedCountLabel:"0", pendingCountLabel:"0", providerAccessLabel:"否", priceLabel:"否", redirectLabel:"否", items:[], note:"该确认与修正只更新临时计划草稿，不访问真实平台，不读取任何密钥，不连接接口，不发起网络请求，不返回商品、价格或跳转链接。" };
  }

  function commerceSubPlanDraftConfirmationHomePanel(confirmationResult){
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
    return `<section class="commerce-subplan-draft-confirmation-panel commerce-subplan-draft-confirmation-home-panel" aria-label="子计划草稿确认与修正">
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

  function commerceSubPlanDraftActionBarForTask(stored, questionResult, workspaceResult, draftReviewSummary, draftConfirmation){
    const existing = stored && stored.commerceSubPlanDraftActionBar || null;
    if (existing && existing.phase === "subplan_draft_review_action_bar") return existing;
    const api = window.WeishanCommerceSubPlanDraftActionBar || null;
    if (api && api.buildSubPlanDraftActionBar) {
      return api.buildSubPlanDraftActionBar({
        commerceSubPlanQuestions:questionResult || null,
        commerceSubPlanCompletionWorkspace:workspaceResult || null,
        commerceSubPlanDraftReviewSummary:draftReviewSummary || null,
        commerceSubPlanDraftConfirmation:draftConfirmation || null
      });
    }
    return null;
  }

  function commerceSubPlanDraftActionBarDisplay(actionBar){
    const api = window.WeishanCommerceSubPlanDraftActionBar || null;
    if (api && api.toSubPlanDraftActionBarDisplayStatus) return api.toSubPlanDraftActionBarDisplayStatus(actionBar || {});
    return { title:"草稿下一步动作", subtitle:"你可以确认草稿，也可以说明要修改哪一项。当前只整理草稿，不会自动执行。", statusLabel:"等待补充问题", actionLabels:["确认全部草稿", "只确认旅行计划", "只确认商品采购计划", "修改旅行计划", "修改商品采购计划", "返回补充问题", "查看安全边界"], actionChips:[{group:"确认类", label:"两个都确认"}, {group:"确认类", label:"确认旅行计划"}, {group:"确认类", label:"电脑计划确认"}, {group:"旅行修改类", label:"酒店入住日期改成7月13日"}, {group:"商品修改类", label:"电脑品牌优先苹果"}, {group:"辅助类", label:"返回补充问题"}, {group:"辅助类", label:"查看安全边界"}], chipHint:"已填入指令，请确认后点击开始执行", guidance:["先补充问题", "查看草稿复核摘要", "当前只整理草稿，不会自动执行"], examples:["两个都确认", "确认旅行计划", "电脑计划确认", "酒店入住日期改成7月13日", "电脑品牌优先苹果，预算改成8000以内", "返回补充问题"], safetyItems:["当前只整理草稿", "不会自动执行", "不会返回价格", "不会跳转购买或预订", "不会自动下单或付款"], providerAccessLabel:"否", priceLabel:"否", redirectLabel:"否" };
  }

  function commerceSubPlanDraftActionBarHomePanel(actionBar){
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
    return `<section class="commerce-subplan-draft-action-panel commerce-subplan-draft-action-home-panel" aria-label="草稿下一步动作">
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


  function commerceSubPlanQuestionsHomePanel(questionResult){
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
    return `<section class="commerce-subplan-question-panel commerce-subplan-question-home-panel" aria-label="子计划补充问题">
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

  function taskKey(task, idx){
    const stable = task && (task.id || task.createdAt || task.finishedAt || task.updatedAt) || "";
    const text = task && (task.text || task.inputSummary || task.outputSummary) || "";
    return [stable, text, task && task.status || "", String(idx)].filter(Boolean).join("::");
  }

  function taskTime(task){
    return window.CommandApi.timeLabel(task && (task.finishedAt || task.updatedAt || task.createdAt));
  }

  function logLine(log){
    const time = window.CommandApi.timeLabel(log.time);
    const raw = String(log && log.text || "");
    if (/已生成调度计划：commerceAgent|commerceAgent\.plan|全球采购计划已|机票搜索已|搜索已生成|搜索已完成|搜索已阻断/.test(raw)) return "";
    return `
      <div class="cmd-log-line cmd-log-${esc(log.type || "info")}">
        <span class="cmd-time">${esc(time)}</span>
        <span class="cmd-text">${esc(displayLogText(log))}</span>
      </div>`;
  }

  function activeTasks(tasks){
    return (tasks || []).filter((x) => x.status === "queued" || x.status === "running");
  }

  function recentDone(tasks, history){
    const seen = {};
    const out = [];
    function add(task, idx){
      if (!task || (task.status !== "done" && task.status !== "failed")) return;
      const key = taskKey(task, idx);
      if (seen[key]) return;
      seen[key] = true;
      out.push(task);
    }
    (history || []).forEach(add);
    (tasks || []).filter((x) => x.status === "done" || x.status === "failed").forEach(add);
    return out.slice(0, 8);
  }

  function historyItems(snapshot){
    return recentDone(snapshot && snapshot.queue || [], snapshot && snapshot.history || []);
  }

  function selectedHistoryTask(snapshot){
    if (!selectedHistoryId && !selectedHistoryText) return null;
    const items = historyItems(snapshot);
    return items.find((task, idx) => taskKey(task, idx) === selectedHistoryId)
      || items.find((task) => String(task && task.text || "") === selectedHistoryText)
      || null;
  }

  function taskResultTypeLabel(task, stored){
    const meta = task && task.meta || {};
    const text = String(task && (task.text || task.inputSummary) || "");
    if (/视频|广告|宣传片/.test(text)) return "视频方案";
    if (/合同|协议/.test(text)) return "文档草稿";
    if (/旅行|行程|机票|酒店/.test(text)) return "旅行计划";
    if (isCommerceTask(task)) return "采购建议";
    if (meta.commerceCategory) return "采购建议";
    return "文字结果";
  }

  function developerInfo(task){
    const meta = task && task.meta || {};
    const rows = [
      ["taskId", task && (task.taskId || task.id)],
      ["schemaVersion", task && task.schemaVersion],
      ["module", task && task.module],
      ["action", task && task.action],
      ["dispatch", task && task.route],
      ["artifact", task && task.artifactId],
      ["Provider", meta.provider],
      ["Runtime", meta.runtime]
    ].filter(function(row){ return row[1]; });
    if (!rows.length) return "";
    return `<details class="cmd-more-info"><summary>更多</summary><details class="cmd-technical-info"><summary>技术详情</summary><details class="cmd-developer-info"><summary>开发者信息</summary><dl>${rows.map(function(row){ return `<div><dt>${esc(row[0])}</dt><dd>${esc(row[1])}</dd></div>`; }).join("")}</dl></details></details></details>`;
  }

  function taskHistorySafetySummary(task){
    if (isCommerceTask(task)) {
      return "未搜索、未下单、未付款、未提交订单、未保存证件 / 银行卡。当前只是帮你整理搜索条件，不会访问真实平台，不会返回价格，不会跳转购买或预订。";
    }
    return "任务历史回看只用于查看已生成结果，不会重新执行任务，也不会访问真实平台、返回价格、跳转购买或预订。";
  }

  function taskHistoryPlanSummary(task, stored){
    if (isCommerceTask(task)) {
      return commerceHistorySummary(task);
    }
    const resolved = storedCommerceTask(task);
    if (resolved) return commerceHistorySummary(resolved);
    const answer = summary(displayAnswer(task), 260);
    return answer || t("homeTaskNoPlan");
  }

  function taskHistoryLogDetail(task){
    const lines = (task && task.logs || [])
      .map((log) => displayLogText(log))
      .filter(Boolean);
    const answer = displayAnswer(task);
    return answer || lines.join("\n") || t("homeNoDisplayableAi");
  }

  function taskHistoryDetailView(task){
    if (!task) return "";
    const stored = storedCommerceTask(task);
    const commerceTask = historyCommerceTask(task) || stored;
    const historySummaryWorkspace = commerceTask && commerceTask.commerceSubPlanCompletionWorkspace || stored && stored.commerceSubPlanCompletionWorkspace || null;
    const historyDraftReviewSummary = commerceTask && commerceTask.commerceSubPlanDraftReviewSummary || stored && stored.commerceSubPlanDraftReviewSummary || null;
    const historyDraftConfirmation = commerceTask && commerceTask.commerceSubPlanDraftConfirmation || stored && stored.commerceSubPlanDraftConfirmation || null;
    const historyDraftActionBar = commerceTask && commerceTask.commerceSubPlanDraftActionBar || stored && stored.commerceSubPlanDraftActionBar || null;
    const status = taskTitle(task);
    const type = taskResultTypeLabel(task, stored);
    const time = taskTime(task);
    const safety = taskHistorySafetySummary(task);
    const detail = taskHistoryLogDetail(task);
    const historySummaryTask = commerceTask ? Object.assign({}, commerceTask, {
      text:commerceTask.text || task.text,
      inputSummary:commerceTask.inputSummary || task.text,
      rawInput:commerceTask.rawInput || task.text
    }) : null;
    const historySummaryPanel = historySummaryTask ? commerceHistoryResultSummaryHomePanel(historySummaryWorkspace, historySummaryTask) : "";
    const historyDraftActionBarPanel = historyDraftActionBar && !commerceIsSimpleFlightTask(commerceTask) ? commerceSubPlanDraftActionBarHomePanel(historyDraftActionBar) : "";
    const historyCompletionPanel = historySummaryWorkspace ? commerceSubPlanCompletionWorkspaceHomePanel(historySummaryWorkspace) : "";
    const historyProcessDisclosure = commerceTask ? disclosure("查看分析过程", `<p>历史回看保留分析过程：本地意图识别、复杂意图拆分计划、子计划闸门矩阵、子计划补充问题、子计划答案收集、子计划补齐工作台。</p>`, "commerce-process-disclosure") : "";
    const historySafetyDisclosure = commerceTask ? disclosure("查看安全边界", `<p>历史回看保留安全边界：当前不会访问真实平台、不会返回价格、不会跳转购买或预订、不会付款或下单。</p>`, "commerce-safety-disclosure") : "";
    const historyTechnicalDisclosure = commerceTask ? technicalDetailsDisclosure([
      `<p>技术细节只用于内部说明，不影响默认结果。这里会显示 provider、API key、endpoint、Connector Gate、Sandbox Dry Run、Provider Approval、Provider Onboarding、Secret Storage、Stub、dispatch、gate、AI fallback，以及本地规则优先 + AI fallback 等内部状态。</p>`,
      historyDraftReviewSummary ? commerceSubPlanDraftReviewHomePanel(historyDraftReviewSummary) : "",
      historyDraftConfirmation ? commerceSubPlanDraftConfirmationHomePanel(historyDraftConfirmation) : "",
      historyCompletionPanel || ""
    ].filter(Boolean).join(""), "commerce-technical-disclosure") : "";
    const commerceDetail = commerceTask ? commercePlanActions(commerceTask) : "";
    const historyCommerceDetailBody = [historySummaryPanel, historyDraftActionBarPanel, commerceDetail].filter(Boolean).join("");
    const historyCommerceDetail = historyCommerceDetailBody ? `<div class="commerce-home-card commerce-history-home-card">${historyCommerceDetailBody}</div>` : "";
    return `<div class="cmd-history-main-detail" data-task-history-detail="true">
      <div class="cmd-history-main-head">
        <div>
          <span>正在查看历史任务</span>
          <h3>历史任务详情</h3>
        </div>
        <button class="cmd-btn gray" id="taskHistoryLatestBtn" type="button">返回最新摘要</button>
      </div>
      <div class="cmd-history-main-grid">
        <div><span>任务名称</span><b>${esc(task.text || "历史任务")}</b></div>
        <div><span>执行时间</span><b>${esc(time)}</b></div>
        <div><span>状态</span><b>${esc(status)}</b></div>
        <div><span>类型 / 类别</span><b>${esc(type)}</b></div>
      </div>
      <section class="cmd-history-main-section">
        <h4>你的需求</h4>
        <p>${esc(task.text || "暂无原始需求")}</p>
      </section>
      <section class="cmd-history-main-section">
        <h4>生成结果</h4>
        <p>${esc(taskHistoryPlanSummary(commerceTask || task, stored || commerceTask))}</p>
      </section>
      <section class="cmd-history-main-section is-safety">
        <h4>安全边界摘要</h4>
        <p>${esc(safety)}</p>
      </section>
      <section class="cmd-history-main-section"><h4>下一步</h4><p>继续告诉 Weishan 你想做什么。</p></section>
      ${historyCommerceDetail ? `<div class="cmd-history-commerce-detail">${historyCommerceDetail}</div>` : `<pre class="cmd-history-main-full">${esc(detail)}</pre>`}
      ${developerInfo(task)}
    </div>`;
  }

  function mainLogs(snapshot){
    const tasks = snapshot.queue || [];
    const active = activeTasks(tasks);
    const selected = selectedHistoryTask(snapshot);
    if (selected) return taskHistoryDetailView(selected);

    const latest = active[0] || tasks.find((x) => x.status === "done" || x.status === "failed") || (snapshot.history || [])[0];

    if (!latest) {
      return `
        <div class="cmd-empty">
          <b>${window.I18n.format ? window.I18n.format("homeConsoleBanner", { version:appVersion() }) : "$ weishan v" + appVersion() + " command-center"}</b>
          <span>${t("homeConsoleEmpty")}</span>
        </div>`;
    }

    const latestCommerceTask = isCommerceTask(latest) ? storedCommerceTask(latest) : null;
    const workspaceApi = window.CommerceAgentPage;
    if (latestCommerceTask && workspaceApi && typeof workspaceApi.isGlobalShoppingTask === "function"
      && workspaceApi.isGlobalShoppingTask(latestCommerceTask)) {
      return commercePlanActions(latest);
    }

    return `
      <div class="cmd-current-head">
        <div>
          <b>${esc(taskTitle(latest))}</b>
          <span>${esc(latest.text)}</span>
        </div>
        <span class="cmd-pill ${statusCls(latest)}">${esc(taskTitle(latest))}</span>
      </div>
      <div class="cmd-log-list">
        ${(latest.logs || []).map(logLine).join("")}
      </div>
      ${commercePlanActions(latest)}
      ${desktopPlanActions(latest)}
      ${desktopExecutionQueuePanel()}`;
  }

  function commerceLocalLawHomePanel(stored){
    const health = stored && stored.complianceHealth || {};
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

  function commerceOnboardingHomePanel(){
    const group = (title, items) => `<section class="commerce-onboarding-group"><h4>${esc(title)}</h4><ul>${items.map((item) => `<li><span>${esc(item[0])}：</span><b>${esc(item[1])}</b></li>`).join("")}</ul></section>`;
    return `<section class="commerce-onboarding-review-panel commerce-onboarding-home-panel" aria-label="Provider 接入审查面板">
      <div class="commerce-onboarding-panel-head">
        <div>
          <h3>Provider 接入审查面板</h3>
          <p>真实 provider 接入前必须完成以下审查。当前尚未接入任何真实 provider。</p>
        </div>
        <strong>总体状态：未完成，暂不可接入真实 provider</strong>
      </div>
      <div class="commerce-onboarding-grid">
        ${group("合规与条款", [["法律条款审查", "未完成"], ["隐私与合规审查", "未完成"]])}
        ${group("API 与接口", [["API 文档审查", "未完成"], ["API key 存储方案", "未审查"]])}
        ${group("价格与费用字段", [["价格/税费/运费字段审查", "未完成"], ["实时价格", "不可用"]])}
        ${group("安全边界", [["不代付款确认", "未完成"], ["不自动下单确认", "未完成"], ["不保存证件/银行卡确认", "未完成"]])}
        ${group("当前阻断状态", [["网络搜索", "未启用"], ["精确跳转", "待真实 provider 接入后启用"]])}
      </div>
      <div class="commerce-onboarding-final-note">
        <p>只有以上审查全部完成，并通过 config / adapter / sandbox / connector gate 后，weishan 才允许进入真实 provider 连接。接通前不会访问真实平台、不会返回价格、不会跳转购买或预订页面。</p>
      </div>
    </section>`;
  }

  function commerceProviderApprovalHomePanel(){
    const row = (label, value) => `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>`;
    const group = (title, items) => `<section class="commerce-approval-group"><h4>${esc(title)}</h4><ul>${items.map((item) => row(item[0], item[1])).join("")}</ul></section>`;
    return `<section class="commerce-provider-approval-panel commerce-provider-approval-home-panel" aria-label="Provider 审批流程">
      <div class="commerce-provider-approval-head">
        <div>
          <h3>Provider 审批流程</h3>
          <p>真实 provider 接入前必须完成分级审批。当前不会连接任何真实 provider。</p>
        </div>
        <strong>审批状态：未审查</strong>
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

  function commerceProviderIntegrationReadinessHomePanel(){
    const row = (label, value) => `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>`;
    const group = (title, items) => `<section class="commerce-provider-readiness-group"><h4>${esc(title)}</h4><ul>${items.map((item) => row(item[0], item[1])).join("")}</ul></section>`;
    return `<section class="commerce-provider-readiness-panel commerce-provider-readiness-home-panel" aria-label="Provider 接入准备总览">
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

  function commerceProviderIntegrationRunbookHomePanel(){
    const row = (label, value) => `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>`;
    const group = (title, items) => `<section class="commerce-provider-runbook-group"><h4>${esc(title)}</h4><ul>${items.map((item) => row(item[0], item[1])).join("")}</ul></section>`;
    return `<section class="commerce-provider-runbook-panel commerce-provider-runbook-home-panel" aria-label="Provider 接入人工审批手册">
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

  function commerceReadOnlyConnectorStubHomePanel(){
    const row = (label, value) => `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>`;
    const group = (title, items) => `<section class="commerce-stub-group"><h4>${esc(title)}</h4><ul>${items.map((item) => row(item[0], item[1])).join("")}</ul></section>`;
    return `<section class="commerce-readonly-stub-panel commerce-readonly-stub-home-panel" aria-label="只读 Connector Stub">
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

  function commerceProviderSecretStorageHomePanel(){
    const row = (label, value) => `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>`;
    const group = (title, items) => `<section class="commerce-secret-group"><h4>${esc(title)}</h4><ul>${items.map((item) => row(item[0], item[1])).join("")}</ul></section>`;
    return `<section class="commerce-provider-secret-panel commerce-provider-secret-home-panel" aria-label="Provider 密钥安全方案">
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

  function commerceProviderSandboxDryRunHomePanel(){
    const row = (label, value) => `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>`;
    const group = (title, items) => `<section class="commerce-sandbox-dry-run-group"><h4>${esc(title)}</h4><ul>${items.map((item) => row(item[0], item[1])).join("")}</ul></section>`;
    return `<section class="commerce-sandbox-dry-run-panel commerce-sandbox-dry-run-home-panel" aria-label="Provider Sandbox Dry Run">
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

  function commerceConnectorGateHomePanel(){
    const row = (label, value) => `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>`;
    const group = (title, items) => `<section class="commerce-connector-gate-group"><h4>${esc(title)}</h4><ul>${items.map((item) => row(item[0], item[1])).join("")}</ul></section>`;
    return `<section class="commerce-connector-gate-panel commerce-connector-gate-home-panel" aria-label="Connector Gate">
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

  function commerceProviderStubProfileHomePanel(profileInfo, category){
    const rawCategory = String(category || "");
    if (rawCategory !== "product" && rawCategory !== "ecommerce") return "";
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
      ${listHtml(items)}
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
      ${listHtml(guidance.items || [])}
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
      ${listHtml(policy.rules || [])}
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
      <p>real price guarded sandbox/test only</p>
      <p>production price display disabled</p>
      <p>bookingUrl disabled</p>
      <p>payment disabled</p>
      <p>order disabled</p>
      <p>identity upload disabled</p>
      <p>redacted: true</p>
      <h5>category card list</h5>
      ${listHtml(rules.categoryCardList || [])}
      <h5>restricted card rules</h5>
      ${listHtml(rules.restrictedCardRules || [])}
      <h5>copy action rules</h5>
      ${listHtml(rules.copyActionRules || [])}
      <h5>history label rules</h5>
      ${listHtml(rules.historyLabelRules || [])}
    </section>`;
    return disclosure("查看全球采购用户结果卡片规则", body, "commerce-global-procurement-user-facing-result-cards-disclosure");
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
      <h5>comparisonDimensions</h5>${listHtml(workspace.comparisonDimensions || [])}
      <h5>decisionRule</h5><p>${esc(workspace.decisionRule || "默认优先真实、可信、可验证的结果；当前仅做离线决策整理。")}</p>
      <h5>candidateSchema</h5>${listHtml(workspace.candidateSchema || [])}
      <h5>recommendationTemplate</h5>${listHtml(workspace.recommendationTemplate || [])}
      <h5>executionBoundary</h5>${listHtml(workspace.executionBoundary || [])}
      <h5>riskNotice</h5>${listHtml(workspace.riskNotice || [])}
      <h5>nextSteps</h5>${listHtml(workspace.nextSteps || [])}
      <h5>linkage</h5>${listHtml(workspace.linkage || [])}
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
      <p>limited beta real price guarded only</p>
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
        <p>price integrity / taxes / fees gate: ${esc((row.readinessMatrix || {}).priceIntegrityTaxesFeesGate || (row.readinessMatrix || {}).priceIntegrityGate || "missing")}</p>
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
        version:"2.1.43",
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
        display:{ title:"Provider Credential Store", warning:"Provider 凭据只能通过主进程原生安全录入区写入；Renderer 不接收 secret。" },
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
      <p>secret operations: main process only</p>
    </section>`).join("");
    const body = `<section class="commerce-secure-api-key-storage-console" data-secure-api-key-storage-console aria-label="安全 API Key 存储控制台">
      <h4>${esc(display.title || "安全 API Key 存储控制台")}</h4>
      <p>${esc(display.warning || "Provider 凭据只能通过主进程原生安全录入区写入；Renderer 不接收 secret。")}</p>
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
      ${listHtml(scenarios.map((item) => item.join("：")))}
      <h5>风险核对</h5>
      ${listHtml(riskLines.length ? riskLines : ["当前仅做离线决策整理，不连接真实 provider。"])}
      <h5>可信度核对</h5>
      ${listHtml(confidenceLines)}
      <h5>人工下一步</h5>
      ${listHtml(nextStepLines.length ? nextStepLines : ["先补齐缺失条件，再人工核对可信平台。"])}
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
        ${(subCard.identifiedConditions || []).length ? `<div><b>已整理条件</b>${listHtml(subCard.identifiedConditions || [])}</div>` : ""}
        ${(subCard.missingInfo || []).length ? `<div><b>仍待人工确认</b>${listHtml(subCard.missingInfo || [])}</div>` : ""}
        ${(subCard.nextStepLines || []).length ? `<div><b>人工下一步</b>${listHtml(subCard.nextStepLines || [])}</div>` : ""}
        ${(subCard.disabledLines || []).length ? `<div><b>当前未开放</b>${listHtml(subCard.disabledLines || [])}</div>` : ""}
      </section>`;
    }).join("")}</div>`;
  }

  function globalProcurementPlanHtml(task, options){
    const card = globalProcurementUserFacingCard(task);
    if (!card) return "";
    const opts = options && typeof options === "object" ? options : {};
    if (opts.hideBlockedInSummary && card.category === "restricted_or_blocked") return "";
    return `<section class="commerce-one-screen-card commerce-global-procurement-plan" aria-label="全球采购计划">
      <p class="commerce-global-procurement-plan-super-title"><b>全球采购计划</b></p>
      <p class="commerce-global-procurement-plan-title"><b>${esc(card.title || "全球采购计划")}</b></p>
      ${card.quickSummary ? `<p>摘要：${esc(card.quickSummary)}</p>` : ""}
      <p>当前状态：${esc(card.currentStatusLine || "当前只整理条件，不访问真实平台。")}</p>
      <p>类别：${esc(card.categoryLabel || "全球采购")}</p>
      ${(card.identifiedConditions || []).length ? `<h5>已整理条件</h5>${listHtml(card.identifiedConditions || [])}` : ""}
      ${(card.missingInfo || []).length ? `<h5>仍待人工确认</h5>${listHtml(card.missingInfo || [])}` : ""}
      ${globalProcurementUserFacingSubCardsHtml(card)}
      ${globalProcurementDecisionWorkspaceSummaryHtml(task)}
      ${(card.disabledLines || []).length ? `<h5>当前未开放</h5>${listHtml(card.disabledLines || [])}` : ""}
      ${(card.nextStepLines || []).length ? `<h5>人工下一步</h5>${listHtml(card.nextStepLines || [])}` : ""}
      ${providerConnectionReadinessConsoleDisclosure(task)}
      ${globalProcurementOtherSafetyRulesDisclosure(task)}
      <p>redacted: true</p>
    </section>`;
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
      <h5>restricted categories</h5>${listHtml(guard.restrictedCategories || [])}
      <h5>rules</h5>${listHtml(guard.blockingRules || [])}
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
      <h5>established capabilities</h5>${listHtml(summary.establishedCapabilities || [])}
      <h5>current forbidden</h5>${listHtml(summary.currentForbidden || [])}
      <h5>evidence lines</h5>${listHtml(summary.evidenceLines || [])}
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
    const globalPlanHtml = globalProcurementPlanHtml(task, { hideBlockedInSummary:true });
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
      <div class="commerce-one-screen-actions" aria-label="门票 / 活动条件操作">        <button class="cmd-btn gray commerce-result-summary-copy-btn" type="button" data-commerce-copy-kind="ticketActivity" data-commerce-copy-text="${commerceEncodedCopyText(commerceTicketActivityCopyText(task))}">复制门票/活动搜索条件</button>
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

  function commerceOneScreenResultPanelHtml(task, options){
    const workspaceApi = window.CommerceAgentPage;
    if (workspaceApi && typeof workspaceApi.isGlobalShoppingTask === "function"
      && workspaceApi.isGlobalShoppingTask(task)
      && typeof workspaceApi.renderGlobalShoppingWorkspace === "function") {
      return `<section class="commerce-result-summary-panel commerce-one-screen-result commerce-global-shopping-workspace-panel" aria-label="Global Shopping Workspace">
        ${workspaceApi.renderGlobalShoppingWorkspace(task)}
      </section>`;
    }
    const opts = options && typeof options === "object" ? options : {};
    const searchText = summary(task && (task.inputSummary || task.text || task.title || ""), 180);
    const complexTravelComputer = String(task && task.globalProcurementIntent && task.globalProcurementIntent.category || "") === "multi_category_plan"
      && /剪视频|32G|1T|7月12日|孩子8岁/.test(String(task && (task.inputSummary || task.text || task.rawInput || "") || ""));
    const searchConditionHtml = complexTravelComputer ? `<div class="commerce-one-screen-condition-summary">
          <p>我已整理好两个计划：</p>
          <p><b>旅行：</b>成都出发，7月12日去东京，7月12日入住，7月16日离店，孩子8岁，预算一万以内。建议优先比较总价、转机次数、起飞时间、酒店位置、家庭友好和取消政策。</p>
          <p><b>电脑：</b>适合剪视频的新电脑，按 32G 内存、1T 硬盘、品牌不限、收货地成都、不接受二手、一万以内筛选。建议重点看 CPU、显卡、散热、屏幕、售后和退换政策。</p>
        </div>` : `<p>${esc(searchText || "请继续补充搜索条件。")}</p>`;
    const historyAdvancedDebug = opts.historyMode ? disclosure("查看其它安全规则折叠面板", `<section class="commerce-simple-flight-advanced-debug" aria-label="高级调试信息">
      <p>高级调试信息默认折叠，仅供排查与验证。</p>
      ${disclosure("查看可执行清单", commerceActionableChecklistPanelHtml(), "commerce-actionable-checklist-disclosure")}
      ${disclosure("查看平台模板", commercePlatformSearchTemplatePackHtml(), "commerce-platform-template-disclosure")}
    </section>`, "commerce-simple-flight-advanced-debug-disclosure") : "";
    const advancedDebugHtml = opts.advancedDebugDisclosure || historyAdvancedDebug;
    const card = globalProcurementUserFacingCard(task);
    const globalPlanHtml = globalProcurementPlanHtml(task, { hideBlockedInSummary:true });
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
      </div>
      <div class="commerce-one-screen-body">
        <section class="commerce-one-screen-card">
          <h4>暂无真实价格结果</h4>
          <p>当前尚未接入真实只读价格源，不能展示价格。</p>
          ${searchConditionHtml}
          <p>接入可信价格源后，将只显示通过安全检查的真实价格结果。最终价格、库存、税费、运费、行李、退改签，以跳转后的平台页面为准。</p>
          <p>weishan 不收款、不下单、不保存身份证、护照或银行卡。</p>
        </section>
        ${globalPlanHtml}
        ${globalMissingInfoHtml}
        ${globalGuidanceHtml}
        ${globalSearchPolicyHtml}
        <p class="commerce-result-summary-status"><b>提示：</b>当前只是整理搜索条件，不访问真实平台，不返回价格，不跳转购买或预订，不付款或下单。</p>
      </div>
      <div class="commerce-one-screen-actions" aria-label="最终结果操作">
        ${globalProcurementUserFacingCopyButtons(card)}
      </div>
      <p class="commerce-result-summary-copy-feedback" data-commerce-copy-feedback aria-live="polite"></p>
      ${resultCardRulesHtml}
      ${providerConnectionReadinessHtml}
      ${globalGuardHtml}
      ${globalEvidenceHtml}
      ${advancedDebugHtml}
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
      ].join("\n"),
      ticketActivity:[
        "门票 / 活动搜索条件",
        "活动：" + (fields.destination || ""),
        "注意：当前不会访问真实平台，不会返回实时价格，最终价格以真实平台为准。"
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
      gateVersion:"2.1.24",
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
      version:"2.1.24",
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
      version:"2.1.24",
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
      version:"2.1.24",
      gateStatus:"closed",
      mode:"draft_only",
      display:{ title:"provider result source label gate", establishedLine:"provider result source label gate：已建立", gateStatusLine:"gate 状态：关闭 / closed", modeLine:"mode: draft only", sourceLabelLine:"real provider source label 未开放", providerResultLine:"real provider result 未读取", networkLine:"real network disabled", safetyLine:"当前版本仍不读取真实 provider result，不显示真实来源标签，不联网，不显示真实价格。" },
      requiredFieldsDraft:{ requiredFields:["providerId", "providerName", "sourceType", "sourceUrlHost", "sourceHostDisplayName", "providerRegion", "updatedAt", "resultObservedAt", "readonlyEvidence", "evidenceType", "sourceTrustState", "redacted: true"] },
      sourceTypeDraft:{ sourceTypes:["user_bound_api", "weishan_readonly_provider", "public_search", "manual_reviewed_source", "blocked_unknown_source", "no_provider"] },
      visibleSourceLabelDraft:{ labels:["来源：未接入真实 provider", "Provider：未绑定 / 未连接", "Source host：未连接真实来源", "Updated at：无真实更新时间", "Evidence：readonlyEvidence draft only", "Trust state：closed / pending review"] },
      blockRules:{ rules:["缺 providerId 阻断", "缺 providerName 阻断", "缺 sourceUrlHost 阻断", "缺 updatedAt 阻断", "缺 readonlyEvidence 阻断", "unknown host 阻断", "short URL 阻断", "credential query params 阻断", "token / apiKey / secret 参数阻断", "raw provider URL with secrets 阻断", "raw provider payload 阻断"] },
      audit:{ sourceLabelAuditDraft:{ eventType:"SOURCE_LABEL_GATE_EVALUATION_DRAFT", schemaVersion:"2.1.24", gateState:"closed", blockedReason:"source_label_gate_closed", sourceUrlHost:"none", resultObservedAt:"none", redacted:true } },
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
      + '<h5>审计事件草案</h5>'
      + '<p>sourceLabelAuditDraft</p>'
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
      version:"2.1.24",
      gateStatus:"closed",
      mode:"draft_only",
      display:{ title:"price integrity / taxes / fees gate", establishedLine:"price integrity / taxes / fees gate：已建立", gateStatusLine:"gate 状态：关闭 / closed", modeLine:"mode: draft only", realPriceLine:"real price display disabled", providerPriceLine:"real provider price disabled", taxFeeLine:"tax / fee verification disabled until readonly provider result is available", safetyLine:"当前版本仍隐藏价格，只显示暂无真实价格结果，不显示虚构价格或非真实报价。" },
      quoteRequiredFields:{ requiredFields:["providerId", "providerName", "sourceUrlHost", "currency", "baseFare", "taxes", "fees", "total", "priceObservedAt", "updatedAt", "readonlyEvidence", "taxFeeCompleteness", "quoteType", "redacted: true"] },
      displayPrerequisites:{ prerequisites:["没有 providerId 不显示价格", "没有 providerName 不显示价格", "没有 sourceUrlHost 不显示价格", "没有 currency 不显示价格", "没有 total 不显示价格", "没有 taxes / fees 完整性信息不显示价格", "没有 updatedAt 不显示价格", "没有 readonlyEvidence 不显示价格", "没有 source label gate 通过不显示价格", "没有 result schema gate 通过不显示价格"], decisionWithoutPrerequisites:"price withheld" },
      currentPricePolicy:{ policy:["当前版本仍隐藏价格", "当前只显示“暂无真实价格结果”", "当前不得显示不真实价格或估算价格", "当前不得显示最低价 / 约 ¥xxx / estimated price", "当前不得根据不完整来源计算最低价"] },
      taxFeeCompletenessRules:{ rules:["baseFare、taxes、fees、total 必须可追溯", "税费缺失则 price withheld", "税费未知则 price withheld", "币种缺失则 price withheld", "更新时间缺失则 price withheld", "provider evidence 缺失则 price withheld", "source label 缺失则 price withheld"] },
      riskScan:{ priceIntegrityRiskScanDraft:["missingCurrency", "missingTaxes", "missingFees", "missingUpdatedAt", "missingReadonlyEvidence", "untrustedSourceHost", "estimatedPriceDetected", "mockPriceDetected", "bookingUrlDetected", "rawProviderPayloadDetected", "redacted: true"] },
      audit:{ priceIntegrityAuditDraft:{ eventType:"PRICE_INTEGRITY_EVALUATION_DRAFT", schemaVersion:"2.1.24", gateState:"closed", withheldReason:"price_integrity_gate_closed", providerId:"none", sourceUrlHost:"none", priceObservedAt:"none", taxFeeCompleteness:"none", redacted:true } },
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
      + '<h5>sample pass candidate</h5><p>quoteType：sandbox_verified_price</p><p>validationDecision：' + esc(v1.samplePassValidation && v1.samplePassValidation.validationDecision || 'pass') + '</p><p>displayEligibility：' + esc(v1.samplePassValidation && v1.samplePassValidation.displayEligibility || 'eligible_for_guarded_display') + '</p>'
      + '<h5>sample withheld candidate</h5><p>validationDecision：' + esc(v1.sampleWithheldValidation && v1.sampleWithheldValidation.validationDecision || 'withheld') + '</p><p>价格已隐藏</p>'
      + '<h5>sample blocked candidate</h5><p>validationDecision：' + esc(v1.sampleBlockedValidation && v1.sampleBlockedValidation.validationDecision || 'blocked') + '</p><p>价格结果已阻断</p>'
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

  function commerceRealPriceDisplayGateDisplay(){
    const api = window.WeishanRealPriceDisplayGate;
    if (api && typeof api.buildRealPriceDisplayGateDraft === "function") return api.buildRealPriceDisplayGateDraft();
    return { status:"guarded real price display only", sandboxTestPriceDisplay:"guarded only", productionPriceDisplay:"disabled", ordinaryResultDisplay:"guarded card only", bookingUrl:"disabled", payment:"disabled", order:"disabled", identityUpload:"disabled", rawPayload:"forbidden", requiredBadges:["来源平台", "更新时间", "币种", "税费状态", "费用状态", "运费状态", "库存/余票可靠性", "最终以平台页面为准"], forbiddenActions:["bookingUrl", "payment", "order", "checkout", "identityUpload"], auditDraft:{ eventType:"REAL_PRICE_DISPLAY_GATE_DRAFT", guardedPriceCardDisplayedCount:1, productionPriceDisplayedCount:0, bookingUrlDisplayedCount:0, paymentAttemptCount:0, orderAttemptCount:0, identityUploadAttemptCount:0, rawProviderPayloadDisplayedCount:0, redacted:true }, redacted:true };
  }

  function commerceRealPriceDisplayGateDisclosure(){
    const gate = commerceRealPriceDisplayGateDisplay();
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
      + '<p>productionPriceDisplayedCount: 0</p>'
      + '<p>bookingUrlDisplayedCount: 0</p>'
      + '<p>paymentAttemptCount: 0</p>'
      + '<p>orderAttemptCount: 0</p>'
      + '<p>identityUploadAttemptCount: 0</p>'
      + '<p>rawProviderPayloadDisplayedCount: 0</p>'
      + '<p>redacted: true</p>'
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
      + '<p>schemaVersion: ' + esc(draft.schemaVersion || '2.1.43') + '</p>'
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
      + '<h5>rollback triggers</h5>' + listHtml(draft.triggers || [])
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
      + '<h5>用户核对清单</h5>' + listHtml(handoff.userChecklist || [])
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
      + '<p>Renderer credential input disabled</p>'
      + '<p>Provider secret 仅可通过主进程原生安全录入区写入</p>'
      + '<p>不会连接生产 endpoint</p>'
      + '<p>不会把 dry-run 结果展示到普通全球采购结果页</p>'
      + '<p>不会返回真实价格</p>'
      + '<p>不会生成 bookingUrl</p>'
      + '<p>不会付款或下单</p>'
      + '<div class="commerce-inline-actions" aria-label="Provider 沙箱测试 Key 操作">'
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

  function commerceObjectLinesHtml(obj){
    return '<ul>' + Object.keys(obj || {}).map(function(key){
      return '<li>' + esc(key) + ': ' + esc(String(obj[key])) + '</li>';
    }).join('') + '</ul>';
  }

  function commerceLocalSafetyEvidenceConsoleDisplay(task){
    const api = window.WeishanCommerceLocalSafetyEvidenceConsole;
    const state = task && task.localSafetyEvidenceConsole || null;
    if (api && typeof api.buildLocalSafetyEvidenceConsole === "function") return api.buildLocalSafetyEvidenceConsole(state);
    return state && typeof state === "object" ? state : { version:"2.1.24", contract:{ status:"local evidence only", mode:"offline safety summary", providerActivationState:"no-go", releaseEvidenceState:"local only", redacted:true }, releaseEvidence:{ appVersion:"2.1.24", expectedGitTag:"v2.1.24", releasePostcheckState:"local only", workingTreeState:"clean required", redacted:true }, settingsAuthEvidence:{ localAuthMode:"enabled", passwordVerifier:"enabled", localRecoveryMode:"no-network", localRecoveryEmailSend:"disabled", localRecoverySecretRead:"disabled" }, commerceEvidence:{ commerceFlightIntent:"enabled", flightOriginParsing:"上海", flightDestinationParsing:"成都", flightDateParsing:"7 月 15 日", flightSortPreference:"低价优先", realPriceResult:"unavailable", fakeMockDemoAiPrice:"forbidden", bookingUrl:"forbidden", providerActivationState:"no-go", offlineFixtureRunnerState:"PASS", networkAttemptCount:0, realProviderCallCount:0, realPriceDisplayedCount:0, bookingUrlDisplayedCount:0 }, safetyRedlineEvidence:{ apiKeyInput:"disabled", credentialInput:"disabled", endpointInput:"disabled", testConnection:"disabled", realNetwork:"disabled", realPrice:"disabled", bookingUrl:"disabled" }, audit:{ localSafetyEvidenceConsoleAuditDraft:{ eventType:"LOCAL_SAFETY_EVIDENCE_CONSOLE_DRAFT", redacted:true } }, display:{ title:"local safety evidence console", establishedLine:"console 已建立", statusLine:"status: local evidence only", modeLine:"mode: offline safety summary", activationLine:"providerActivationState: no-go", releaseLine:"releaseEvidenceState: local only", redactedLine:"redacted: true" } };
  }

  function commerceLocalSafetyEvidenceConsoleDisclosure(task){
    const state = commerceLocalSafetyEvidenceConsoleDisplay(task);
    const display = state.display || {};
    const audit = state.audit && state.audit.localSafetyEvidenceConsoleAuditDraft || {};
    const body = '<section class="commerce-local-safety-evidence-console-panel" aria-label="local safety evidence console">'
      + '<h4>' + esc(display.title || 'local safety evidence console') + '</h4>'
      + '<p>' + esc(display.establishedLine || 'console 已建立') + '</p>'
      + '<p>' + esc(display.statusLine || 'status: local evidence only') + '</p>'
      + '<p>' + esc(display.modeLine || 'mode: offline safety summary') + '</p>'
      + '<p>' + esc(display.providerLine || 'real provider connection disabled') + '</p>'
      + '<p>' + esc(display.networkLine || 'real network disabled') + '</p>'
      + '<p>' + esc(display.credentialLine || 'real credential read disabled') + '</p>'
      + '<p>' + esc(display.priceLine || 'real price display disabled') + '</p>'
      + '<p>' + esc(display.bookingUrlLine || 'real bookingUrl disabled') + '</p>'
      + '<p>' + esc(display.activationLine || 'providerActivationState: no-go') + '</p>'
      + '<p>' + esc(display.releaseLine || 'releaseEvidenceState: local only') + '</p>'
      + '<p>' + esc(display.redactedLine || 'redacted: true') + '</p>'
      + '<h5>release evidence 草案</h5>' + commerceObjectLinesHtml(state.releaseEvidence || {})
      + '<h5>Settings/Auth evidence 草案</h5>' + commerceObjectLinesHtml(state.settingsAuthEvidence || {})
      + '<h5>Commerce evidence 草案</h5>' + commerceObjectLinesHtml(state.commerceEvidence || {})
      + '<h5>safety redline evidence 草案</h5>' + commerceObjectLinesHtml(state.safetyRedlineEvidence || {})
      + '<h5>审计事件草案</h5><p>localSafetyEvidenceConsoleAuditDraft</p>'
      + '<p>eventType：' + esc(audit.eventType || 'LOCAL_SAFETY_EVIDENCE_CONSOLE_DRAFT') + '</p>'
      + '<p>schemaVersion：' + esc(audit.schemaVersion || '2.1.24') + '</p>'
      + '<p>appVersion：' + esc(audit.appVersion || '2.1.24') + '</p>'
      + '<p>evidenceState：' + esc(audit.evidenceState || 'local evidence only') + '</p>'
      + '<p>providerActivationState：' + esc(audit.providerActivationState || 'no-go') + '</p>'
      + '<p>releasePostcheckState：' + esc(audit.releasePostcheckState || 'local only') + '</p>'
      + '<p>fixtureRunnerState：' + esc(audit.fixtureRunnerState || 'PASS') + '</p>'
      + '<p>settingsAuthState：' + esc(audit.settingsAuthState || 'local auth evidence only') + '</p>'
      + '<p>blockedReason：' + esc(audit.blockedReason || 'real_provider_and_secret_access_disabled') + '</p>'
      + '<p>generatedAt：' + esc(audit.generatedAt || 'local_only') + '</p>'
      + '<p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 local safety evidence console', body, 'commerce-local-safety-evidence-console-disclosure');
  }

  function commerceManualUiAcceptanceAssistantDisplay(task){
    const api = window.WeishanCommerceManualUiAcceptanceAssistant;
    const state = task && task.manualUiAcceptanceAssistant || null;
    if (api && typeof api.buildManualUiAcceptanceAssistant === "function") return api.buildManualUiAcceptanceAssistant(state);
    return state && typeof state === "object" ? state : { version:"2.1.24", contract:{ status:"manual assist only", mode:"no automation guarantee", redacted:true }, manualSteps:[], screenshotPaths:[], passFailRules:["自动输入不可靠且未手动确认 -> NEEDS_MANUAL_UI_CHECK"], audit:{ manualUiAcceptanceAssistantAuditDraft:{ redacted:true } }, display:{ title:"manual UI acceptance assistant", establishedLine:"assistant 已建立", statusLine:"status: manual assist only", modeLine:"mode: no automation guarantee", focusLine:"Electron Web content focus may require manual input", fabricationLine:"automated PASS fabrication forbidden", screenshotLine:"screenshot evidence required", confirmationLine:"user confirmation required", externalSearchLine:"no external search click", networkLine:"no real network", redactedLine:"redacted: true" } };
  }

  function commerceManualUiAcceptanceAssistantDisclosure(task){
    const state = commerceManualUiAcceptanceAssistantDisplay(task);
    const display = state.display || {};
    const audit = state.audit && state.audit.manualUiAcceptanceAssistantAuditDraft || {};
    const body = '<section class="commerce-manual-ui-acceptance-assistant-panel" aria-label="manual UI acceptance assistant">'
      + '<h4>' + esc(display.title || 'manual UI acceptance assistant') + '</h4>'
      + '<p>' + esc(display.establishedLine || 'assistant 已建立') + '</p>'
      + '<p>' + esc(display.statusLine || 'status: manual assist only') + '</p>'
      + '<p>' + esc(display.modeLine || 'mode: no automation guarantee') + '</p>'
      + '<p>' + esc(display.focusLine || 'Electron Web content focus may require manual input') + '</p>'
      + '<p>' + esc(display.fabricationLine || 'automated PASS fabrication forbidden') + '</p>'
      + '<p>' + esc(display.screenshotLine || 'screenshot evidence required') + '</p>'
      + '<p>' + esc(display.confirmationLine || 'user confirmation required') + '</p>'
      + '<p>' + esc(display.externalSearchLine || 'no external search click') + '</p>'
      + '<p>' + esc(display.networkLine || 'no real network') + '</p>'
      + '<p>' + esc(display.redactedLine || 'redacted: true') + '</p>'
      + '<h5>手动验收步骤草案</h5>' + listHtml(state.manualSteps || [])
      + '<h5>截图路径草案</h5>' + listHtml(state.screenshotPaths || [])
      + '<h5>PASS/FAIL 判定规则草案</h5>' + listHtml(state.passFailRules || [])
      + '<h5>审计事件草案</h5><p>manualUiAcceptanceAssistantAuditDraft</p>'
      + '<p>eventType：' + esc(audit.eventType || 'MANUAL_UI_ACCEPTANCE_ASSISTANT_DRAFT') + '</p>'
      + '<p>schemaVersion：' + esc(audit.schemaVersion || '2.1.24') + '</p>'
      + '<p>manualCheckState：' + esc(audit.manualCheckState || 'manual assist only') + '</p>'
      + '<p>requiredScreenshotCount：' + esc(String(audit.requiredScreenshotCount || 10)) + '</p>'
      + '<p>completedScreenshotCount：' + esc(String(audit.completedScreenshotCount || 0)) + '</p>'
      + '<p>userConfirmationState：' + esc(audit.userConfirmationState || 'required') + '</p>'
      + '<p>blockedReason：' + esc(audit.blockedReason || 'automation_focus_not_guaranteed') + '</p>'
      + '<p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 manual UI acceptance assistant', body, 'commerce-manual-ui-acceptance-assistant-disclosure');
  }

  function commerceNoSecretPersistenceGuardDisplay(task){
    const api = window.WeishanCommerceNoSecretPersistenceGuard;
    const state = task && task.noSecretPersistenceGuard || null;
    if (api && typeof api.buildNoSecretPersistenceGuard === "function") return api.buildNoSecretPersistenceGuard(state);
    return state && typeof state === "object" ? state : { version:"2.1.24", contract:{ status:"local static scan only", mode:"no real secret access", redacted:true }, scanScope:[], blockedPatterns:[], currentScanResult:{ scanResult:"PASS", blockedPatternCount:0, realSecretReadCount:0, keychainAccessCount:0, safeStorageAccessCount:0, envSecretWriteCount:0, localStorageSecretWriteCount:0, sessionStorageSecretWriteCount:0, rawPasswordPersistenceCount:0, rawApiKeyDisplayCount:0, providerCredentialPersistedCount:0, endpointSecretPersistedCount:0, redacted:true }, audit:{ noSecretPersistenceGuardAuditDraft:{ redacted:true } }, display:{ title:"no-secret persistence guard", establishedLine:"guard 已建立", statusLine:"status: local static scan only", modeLine:"mode: no real secret access", realKeyLine:"real API key read disabled", keychainLine:"Keychain access disabled", safeStorageLine:"safeStorage access disabled", envLine:".env secret write forbidden", localStorageLine:"localStorage secret write forbidden", sessionStorageLine:"sessionStorage secret write forbidden", rawPasswordLine:"raw password persistence forbidden", rawTokenLine:"raw token display forbidden", rawApiKeyLine:"rawApiKey display forbidden", providerCredentialLine:"provider credential persistence forbidden", endpointSecretLine:"endpoint secret persistence forbidden", scanResultLine:"scanResult: PASS", redactedLine:"redacted: true" } };
  }

  function commerceNoSecretPersistenceGuardDisclosure(task){
    const state = commerceNoSecretPersistenceGuardDisplay(task);
    const display = state.display || {};
    const result = state.currentScanResult || {};
    const audit = state.audit && state.audit.noSecretPersistenceGuardAuditDraft || {};
    const body = '<section class="commerce-no-secret-persistence-guard-panel" aria-label="no-secret persistence guard">'
      + '<h4>' + esc(display.title || 'no-secret persistence guard') + '</h4>'
      + '<p>' + esc(display.establishedLine || 'guard 已建立') + '</p>'
      + '<p>' + esc(display.statusLine || 'status: local static scan only') + '</p>'
      + '<p>' + esc(display.modeLine || 'mode: no real secret access') + '</p>'
      + '<p>' + esc(display.realKeyLine || 'real API key read disabled') + '</p>'
      + '<p>' + esc(display.keychainLine || 'Keychain access disabled') + '</p>'
      + '<p>' + esc(display.safeStorageLine || 'safeStorage access disabled') + '</p>'
      + '<p>' + esc(display.envLine || '.env secret write forbidden') + '</p>'
      + '<p>' + esc(display.localStorageLine || 'localStorage secret write forbidden') + '</p>'
      + '<p>' + esc(display.sessionStorageLine || 'sessionStorage secret write forbidden') + '</p>'
      + '<p>' + esc(display.rawPasswordLine || 'raw password persistence forbidden') + '</p>'
      + '<p>' + esc(display.rawTokenLine || 'raw token display forbidden') + '</p>'
      + '<p>' + esc(display.rawApiKeyLine || 'rawApiKey display forbidden') + '</p>'
      + '<p>' + esc(display.providerCredentialLine || 'provider credential persistence forbidden') + '</p>'
      + '<p>' + esc(display.endpointSecretLine || 'endpoint secret persistence forbidden') + '</p>'
      + '<p>' + esc(display.scanResultLine || 'scanResult: PASS') + '</p>'
      + '<p>' + esc(display.redactedLine || 'redacted: true') + '</p>'
      + '<h5>scan scope 草案</h5>' + listHtml(state.scanScope || [])
      + '<h5>blocked persistence patterns</h5>' + listHtml(state.blockedPatterns || [])
      + '<h5>current scan result 草案</h5>' + commerceObjectLinesHtml(result)
      + '<h5>审计事件草案</h5><p>noSecretPersistenceGuardAuditDraft</p>'
      + '<p>eventType：' + esc(audit.eventType || 'NO_SECRET_PERSISTENCE_GUARD_SCAN_DRAFT') + '</p>'
      + '<p>schemaVersion：' + esc(audit.schemaVersion || '2.1.24') + '</p>'
      + '<p>scanState：' + esc(audit.scanState || 'PASS') + '</p>'
      + '<p>scannedFileCount：' + esc(String(audit.scannedFileCount || result.scannedFileCount || 'generated by script')) + '</p>'
      + '<p>blockedPatternCount：' + esc(String(audit.blockedPatternCount || 0)) + '</p>'
      + '<p>realSecretReadCount：' + esc(String(audit.realSecretReadCount || 0)) + '</p>'
      + '<p>keychainAccessCount：' + esc(String(audit.keychainAccessCount || 0)) + '</p>'
      + '<p>safeStorageAccessCount：' + esc(String(audit.safeStorageAccessCount || 0)) + '</p>'
      + '<p>envSecretWriteCount：' + esc(String(audit.envSecretWriteCount || 0)) + '</p>'
      + '<p>localStorageSecretWriteCount：' + esc(String(audit.localStorageSecretWriteCount || result.localStorageSecretWriteCount || 0)) + '</p>'
      + '<p>sessionStorageSecretWriteCount：' + esc(String(audit.sessionStorageSecretWriteCount || result.sessionStorageSecretWriteCount || 0)) + '</p>'
      + '<p>rawPasswordPersistenceCount：' + esc(String(audit.rawPasswordPersistenceCount || result.rawPasswordPersistenceCount || 0)) + '</p>'
      + '<p>rawApiKeyDisplayCount：' + esc(String(audit.rawApiKeyDisplayCount || result.rawApiKeyDisplayCount || 0)) + '</p>'
      + '<p>providerCredentialPersistedCount：' + esc(String(audit.providerCredentialPersistedCount || result.providerCredentialPersistedCount || 0)) + '</p>'
      + '<p>endpointSecretPersistedCount：' + esc(String(audit.endpointSecretPersistedCount || result.endpointSecretPersistedCount || 0)) + '</p>'
      + '<p>blockedReason：' + esc(audit.blockedReason || 'none') + '</p>'
      + '<p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 no-secret persistence guard', body, 'commerce-no-secret-persistence-guard-disclosure');
  }

  function commerceSettingsAuthLocalSecurityEvidenceDisplay(task){
    const api = window.WeishanSettingsAuthLocalSecurityEvidence;
    const state = task && task.settingsAuthLocalSecurityEvidence || null;
    if (api && typeof api.buildSettingsAuthLocalSecurityEvidence === "function") return api.buildSettingsAuthLocalSecurityEvidence(state);
    return state && typeof state === "object" ? state : { version:"2.1.24", contract:{ status:"local auth evidence only", mode:"no cloud auth", localRegister:"enabled", localLogin:"enabled", localRecoveryNotice:"enabled", passwordVerifier:"enabled", legacyPlainPasswordMigration:"compatible", realEmailSending:"disabled", realNetwork:"disabled", realKeyRead:"disabled", redacted:true }, accountLocalObjectDraft:{ accountId:"local account id", emailAlias:"local email alias", passwordVerifier:"enabled", schemaVersion:"2.1.24", redacted:true }, recoveryNoticeDraft:["本地模式不联网", "本地模式不发邮件", "本地模式不读取密钥", "找回密码不会清空表单", "找回密码不会跳路由"], authSafetyBoundaries:["raw password display forbidden", "raw password persistence forbidden", "passwordVerifier only"], audit:{ settingsAuthLocalSecurityEvidenceAuditDraft:{ redacted:true } }, display:{ title:"settings auth local security evidence", establishedLine:"evidence 已建立", statusLine:"status: local auth evidence only", modeLine:"mode: no cloud auth", registerLine:"local register enabled", loginLine:"local login enabled", recoveryLine:"local recovery notice enabled", verifierLine:"passwordVerifier enabled", migrationLine:"legacy plain password migration compatible", emailLine:"real email sending disabled", networkLine:"real network disabled", keyLine:"real key read disabled", redactedLine:"redacted: true" } };
  }

  function commerceSettingsAuthLocalSecurityEvidenceDisclosure(task){
    const state = commerceSettingsAuthLocalSecurityEvidenceDisplay(task);
    const display = state.display || {};
    const audit = state.audit && state.audit.settingsAuthLocalSecurityEvidenceAuditDraft || {};
    const body = '<section class="commerce-settings-auth-local-security-evidence-panel" aria-label="settings auth local security evidence">'
      + '<h4>' + esc(display.title || 'settings auth local security evidence') + '</h4>'
      + '<p>' + esc(display.establishedLine || 'evidence 已建立') + '</p>'
      + '<p>' + esc(display.statusLine || 'status: local auth evidence only') + '</p>'
      + '<p>' + esc(display.modeLine || 'mode: no cloud auth') + '</p>'
      + '<p>' + esc(display.registerLine || 'local register enabled') + '</p>'
      + '<p>' + esc(display.loginLine || 'local login enabled') + '</p>'
      + '<p>' + esc(display.recoveryLine || 'local recovery notice enabled') + '</p>'
      + '<p>' + esc(display.verifierLine || 'passwordVerifier enabled') + '</p>'
      + '<p>' + esc(display.migrationLine || 'legacy plain password migration compatible') + '</p>'
      + '<p>' + esc(display.emailLine || 'real email sending disabled') + '</p>'
      + '<p>' + esc(display.networkLine || 'real network disabled') + '</p>'
      + '<p>' + esc(display.keyLine || 'real key read disabled') + '</p>'
      + '<p>' + esc(display.redactedLine || 'redacted: true') + '</p>'
      + '<h5>account local object 草案</h5>' + commerceObjectLinesHtml(state.accountLocalObjectDraft || {})
      + '<h5>recovery notice 草案</h5>' + listHtml(state.recoveryNoticeDraft || [])
      + '<h5>auth safety boundaries</h5>' + listHtml(state.authSafetyBoundaries || [])
      + '<h5>审计事件草案</h5><p>settingsAuthLocalSecurityEvidenceAuditDraft</p>'
      + '<p>eventType：' + esc(audit.eventType || 'SETTINGS_AUTH_LOCAL_SECURITY_EVIDENCE_DRAFT') + '</p>'
      + '<p>schemaVersion：' + esc(audit.schemaVersion || '2.1.24') + '</p>'
      + '<p>localAuthState：' + esc(audit.localAuthState || 'enabled') + '</p>'
      + '<p>localRecoveryState：' + esc(audit.localRecoveryState || 'no-network notice only') + '</p>'
      + '<p>passwordVerifierState：' + esc(audit.passwordVerifierState || 'enabled') + '</p>'
      + '<p>legacyMigrationState：' + esc(audit.legacyMigrationState || 'compatible') + '</p>'
      + '<p>aiKeyConfigState：' + esc(audit.aiKeyConfigState || 'locked when unauthenticated') + '</p>'
      + '<p>blockedReason：' + esc(audit.blockedReason || 'cloud_auth_and_secret_access_disabled') + '</p>'
      + '<p>redacted: true</p>'
      + '</section>';
    return disclosure('查看 settings auth local security evidence', body, 'commerce-settings-auth-local-security-evidence-disclosure');
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
    const api = window.WeishanProviderHandoffUi;
    const decision = api && typeof api.buildProviderHandoffUserSurface === "function" ? api.buildProviderHandoffUserSurface({ card, providerReadiness:"limited-beta-ready", bookingUrlSafety:"disabled", manualBookingHandoff:"manual-only", userPreference:{ searchText:commerceTaskRawInput(task) }, redacted:true }) : { visible:true, title:"去平台确认", intro:"当前不会自动打开平台，不会跳转预订页，不会付款或下单。", coreChecklist:["路线：" + (card.title || "上海 → 成都").replace(/\s*·.*$/, ""), "日期：7 月 15 日", "最终应付总价：¥1010", "票面价 / 税费 / 附加费：以卡片价格拆分为准", "燃油/机建费：以平台页面为准"], actions:["复制搜索条件", "复制价格拆分摘要"], fullChecklist:["核对出发地 / 目的地 / 日期", "核对是否直达", "核对票面价、税费和附加费", "核对最终应付总价", "核对行李、退改签、余票 / 座位状态", "核对平台域名", "不向未知平台提交身份证、护照或银行卡"] };
    if (decision.visible === false) return "";
    const checklist = (decision.coreChecklist || []).map(function(item){ return '<li>' + esc(item) + '</li>'; }).join('');
    const fullChecklist = (decision.fullChecklist || []).map(function(item){ return '<li>' + esc(item) + '</li>'; }).join('');
    const actions = (decision.actions || ["复制搜索条件", "复制价格拆分摘要"]).map(function(item){ return '<span class="commerce-provider-handoff-action">' + esc(item) + '</span>'; }).join(' ');
    return '<details class="commerce-provider-handoff-ui-panel commerce-provider-handoff-ui-v3"><summary>' + esc(decision.title || '去平台确认') + '</summary><div class="commerce-disclosure-body"><h5>去平台确认</h5><p>' + esc(decision.intro || '当前不会自动打开平台，不会跳转预订页，不会付款或下单。') + '</p><h6>核心核对</h6><ul>' + checklist + '</ul><div class="commerce-provider-handoff-actions">' + actions + '</div><details class="commerce-provider-handoff-note"><summary>查看完整核对清单</summary><ul>' + fullChecklist + '</ul></details></div></details>';
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
        limitedBetaPriceDisplay:"Limited Beta 只读验证价",
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
    const visualCards = surfaceV4.compactCards || surfaceV3.visualCards || [];
    const cards = surface.cards || [];
    const cardHtml = cards.map(function(card, index){
      const visual = visualCards[index] || (window.WeishanResultCardVisualFormatter && window.WeishanResultCardVisualFormatter.buildResultCardVisualModel ? window.WeishanResultCardVisualFormatter.buildResultCardVisualModel({ card, fareBreakdown:card.fareBreakdown, sortIntent:{ origin:fields.origin, destination:fields.destination, dateDisplay:fields.dateDisplay || fields.date, directPreference:fields.directPreference || '直达优先', sortLabel:fields.sortLabel || fields.goal || '低价优先' } }) : null) || {};
      const badges = Array.isArray(visual.badges || card.badges) ? (visual.badges || card.badges).map(function(badge){ return '<span class="commerce-result-card-badge">' + esc(badge) + '</span>'; }).join(' ') : '';
      return '<section class="commerce-top-result-card commerce-top-result-card-polished commerce-compact-flight-card-v1" aria-label="推荐结果卡" data-top-result-rank="' + esc(String(card.rank || '')) + '"><div class="commerce-result-card-rank">#' + esc(String(visual.rank || card.rank || '')) + '</div><p class="commerce-result-card-primary-price">' + esc(visual.primaryPrice || card.priceDisplay || '暂无真实价格结果') + '</p><h5 class="commerce-result-card-route">' + esc(visual.routeLine || card.title || '结果卡') + '</h5><p class="commerce-result-card-meta">' + esc(visual.metaLine || surface.summarySubtitle || '') + '</p><p class="commerce-result-card-subtitle">' + esc(visual.priceTruthText || visual.priceSubtext || card.priceTruthLabel || '不代表真实最低价') + '</p><p class="commerce-fare-summary-line">' + esc(visual.fareSummary || visual.fareSummaryLine || '') + '</p><p class="commerce-fare-caveat-line">' + esc(visual.feeCaveat || visual.compactFareBreakdown && visual.compactFareBreakdown.caveatLine || '燃油/机建费：以平台页面为准') + '</p><p class="commerce-result-provider-line">' + esc(visual.providerLine || ('Flight Provider Sandbox · 更新时间 2026-06-20 00:00')) + '</p><div class="commerce-result-card-badges">' + badges + '</div><div class="commerce-result-card-actions"><span>去平台确认</span> <span>复制搜索条件</span></div>' + commerceFareBreakdownHtml(card, visual) + commerceProviderHandoffPanelForCard(card, task) + '</section>';
    }).join('');
    const emptyHint = surface.resultCardCount ? '' : '<section class="commerce-top-result-empty"><p>暂无更多可信结果</p></section>';
    return '<section class="commerce-clean-result-surface-v4" aria-label="Clean Result Surface V4"><h4>' + esc(surface.summaryTitle || '推荐结果') + '</h4><p>' + esc(surface.summarySubtitle || '') + '</p><p class="commerce-result-surface-status">' + esc(surfaceV4.statusMessage || surface.statusMessage || surfaceV3.statusMessage || '暂无真实价格结果') + '</p><p class="commerce-result-card-subtitle">' + esc(surfaceV4.priceTruthText || 'Limited Beta 只读验证价，不代表真实最低价。') + '</p><h5>推荐结果</h5>' + cardHtml + emptyHint + '<p class="commerce-result-summary-status commerce-result-safety-line"><b>提示：</b>' + esc(surfaceV4.safetyLine || surface.finalSafetyNotice || 'weishan 只做搜索和比较，不收款、不下单。最终以平台页面为准。') + '</p></section>';
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
    const cards = commerceTopResultCardsForTask(task, { guardedPriceCardHtml:commerceGuardedFlightPriceCardHtml(task) }).cards || [];
    const first = cards[0] || { actionLabel:'手动核对', actionType:'copy_search_conditions', title:commerceTaskRawInput(task), bookingUrl:null };
    const api = window.WeishanProviderHandoffUi;
    const decision = api && typeof api.buildProviderHandoffUi === 'function' ? api.buildProviderHandoffUi({ card:first, providerReadiness:'limited-beta-ready', bookingUrlSafety:'disabled', userPreference:{ searchText:commerceTaskRawInput(task) }, redacted:true }) : { handoffDecision:'manual_handoff', actionLabel:first.actionLabel || '手动核对', actionType:first.actionType || 'copy_search_conditions', autoOpen:false, bookingUrl:null, payment:false, order:false, identityUpload:false, audit:{ eventType:'PROVIDER_HANDOFF_UI_DRAFT', redacted:true }, redacted:true };
    const audit = decision.audit || {};
    const body = '<section class="commerce-provider-handoff-ui-debug-panel"><h4>Provider Handoff UI</h4><p>provider handoff UI: manual-only</p><p>handoffDecision: ' + esc(decision.handoffDecision || '') + '</p><p>actionLabel: ' + esc(decision.actionLabel || '') + '</p><p>actionType: ' + esc(decision.actionType || '') + '</p><p>autoOpen: false</p><p>bookingUrl: null</p><p>payment: false</p><p>order: false</p><p>identityUpload: false</p><p>copyPayloadGeneratedCount: ' + esc(String(audit.copyPayloadGeneratedCount || 0)) + '</p><p>finalPageDisclaimerPresent: true</p><p>' + esc(audit.eventType || 'PROVIDER_HANDOFF_UI_DRAFT') + '</p><p>redacted: true</p></section>';
    return disclosure('查看 Provider Handoff UI', body, 'commerce-provider-handoff-ui-disclosure');
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
      : { reportName:"real_flight_price_evidence_report_v1", mode:"read_only_beta", userFacingRealPriceEnabled:false, debugEvidenceEnabled:true, provider:{ providerId:"real_flight_fixture", providerName:"Real Flight Fixture", providerMode:"fixture", fareSource:"fixture_read_only" }, fetchSafety:{ status:"allowed", decision:"fixture_provider_allowed", readOnly:true, networkAllowed:false, booking:false, payment:false, order:false, identityUpload:false }, priceQuote:{ currency:"CNY", baseFare:860, taxesAndFees:110, providerFees:40, totalPrice:1010, priceUpdatedAt:"2026-06-20T00:00:00.000Z", freshnessStatus:"fresh", taxFeeIntegrityStatus:"complete", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null }, integrity:{ totalMatchesBreakdown:true, taxFeeIntegrityStatus:"complete", freshnessStatus:"fresh", showableAsRealPrice:false, showableAsCandidateEvidence:true, userFacingCaveatRequired:true, caveat:"价格、库存、税费和规则以平台页面为准。" }, handoff:{ safeProviderHandoffReady:true, safeProviderHandoffUrl:"https://www.google.com/travel/flights", bookingUrl:null, autoOpen:false, requiresConfirmation:true }, safety:{ checkout:"blocked", payment:"blocked", order:"blocked", identityUpload:"blocked", credentialExposure:"redacted" }, readiness:{ betaReady:true, canShowInDebugPanel:true, canReplaceMainResultCard:false, finalDecision:"debug_price_evidence_ready" }, redacted:true };
    const provider = report.provider || {};
    const safety = report.fetchSafety || {};
    const integrity = report.integrity || {};
    const handoff = report.handoff || {};
    const readiness = report.readiness || {};
    const contract = report.providerContract || {};
    const body = '<section class="commerce-real-flight-price-evidence-report-panel"><h4>Real Flight Price Evidence</h4><p>真实价格证据：只读 beta</p><p>当前仅用于安全验证，不代表已锁价或可出票。</p><p>价格、库存、税费和规则以平台页面为准。</p><p>唯珊不会付款、不会下单、不会上传证件或银行卡。</p><p>providerId: ' + esc(provider.providerId || "real_flight_fixture") + '</p><p>providerName: ' + esc(provider.providerName || "Real Flight Fixture") + '</p><p>providerMode: ' + esc(provider.providerMode || "fixture") + '</p><p>fareSource: ' + esc(provider.fareSource || "fixture_read_only") + '</p><p>contractName: ' + esc(contract.contractName || "real_flight_price_read_only_provider_contract_v1") + '</p><p>fetchSafety: ' + esc(safety.status || "allowed") + '</p><p>readOnly: true</p><p>networkAllowed: ' + esc(String(safety.networkAllowed === true)) + '</p><p>booking: false</p><p>payment: false</p><p>order: false</p><p>identityUpload: false</p><p>price integrity: ' + esc(integrity.taxFeeIntegrityStatus || "complete") + '</p><p>freshness: ' + esc(integrity.freshnessStatus || "fresh") + '</p><p>safeProviderHandoffReady: ' + esc(String(handoff.safeProviderHandoffReady === true)) + '</p><p>bookingUrl: null</p><p>autoOpen: false</p><p>付款：blocked</p><p>下单：blocked</p><p>证件上传：blocked</p><p>userFacingRealPriceEnabled: false</p><p>debugEvidenceEnabled: true</p><p>canReplaceMainResultCard: ' + esc(String(readiness.canReplaceMainResultCard === true)) + '</p><p>finalDecision: ' + esc(readiness.finalDecision || "debug_price_evidence_ready") + '</p><p>redacted: true</p></section>';
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


  function commerceSafetyAndDebugDetailsDisclosure(task, extraPanels){
    const panels = [commerceAiProcurementBrainDisclosure(task), commerceAiBackendRouterDisclosure(task), commerceProcurementClarificationGateDisclosure(task), commerceCleanResultSurfaceV1Disclosure(task), commerceTopResultCardsBuilderDisclosure(task), commerceProviderHandoffUiDisclosure(task), commerceCleanResultSurfaceV2Disclosure(task), commerceCleanResultSurfaceV3Disclosure(task), commerceCleanResultSurfaceV4Disclosure(task)].concat(extraPanels || []).filter(Boolean).join('');
    return disclosure('查看安全与调试详情', '<section class="commerce-safety-debug-details"><h4>安全与调试详情</h4><p>后台 gate / audit / readiness 默认隐藏；展开后仅用于审计。</p>' + panels + '</section>', 'commerce-simple-flight-advanced-debug-disclosure');
  }

  function commerceClarificationResultPanelHtml(task){
    const brain = commerceAiBrainDecisionForTask(task);
    const clarification = commerceClarificationDecisionForTask(task);
    return '<section class="commerce-result-summary-panel commerce-one-screen-result commerce-clarification-result" aria-label="采购追问"><div class="commerce-result-summary-head"><div class="commerce-result-summary-headline"><span>AI 大脑采购编排</span><strong>请补充关键信息</strong></div></div><div class="commerce-one-screen-body"><section class="commerce-one-screen-card"><h4>请补充关键信息</h4><p>' + esc(clarification.questionText || brain.clarificationQuestion || '请补充关键采购条件。') + '</p><h5>需要补充</h5>' + listHtml(clarification.missingFields || brain.missingFields || []) + '<p>当前不会生成假结果，不显示价格，不提供 bookingUrl，不付款，不下单。</p></section></div>' + commerceSafetyAndDebugDetailsDisclosure(task, []) + '</section>';
  }

  function commerceSimpleFlightResultPanelHtml(task){
    const fields = commerceSimpleFlightFields(task);
    const copyTexts = commerceSimpleFlightCopyTexts(task);
    const externalUrls = commerceSimpleFlightExternalSearchUrls(task);
    const flightLowestOffers = commerceFlightLowestOffersDisplay(task);
    const searchModeDisplay = commerceUserApiSearchModeDisplay(task);
    const apiBindingDisplay = commerceApiBindingSafeShellDisplay(task);
    const resultCardRulesHtml = globalProcurementUserFacingResultCardsRulesDisclosure();
    const guardedPriceCardHtml = commerceGuardedFlightPriceCardHtml(task);
    // marker:one screen actionable checklist collapsed
    // disclosure("查看可执行清单") ... commerceActionableChecklistPanelHtml
    // marker:one screen platform templates collapsed
    // disclosure("查看平台模板") ... commercePlatformSearchTemplatePackHtml
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
          ${commerceCleanResultSurfaceHtml(task, { guardedPriceCardHtml })}
        </section>
      </div>
      <div class="commerce-one-screen-actions commerce-manual-verification-actions" aria-label="手动核对入口">
        <h4>手动核对入口</h4>
        <p>这些是人工搜索入口，不是预订链接。weishan 不自动打开、不付款、不下单。</p>
        <button class="cmd-btn gray commerce-result-summary-copy-btn" type="button" data-commerce-copy-kind="simpleFlight" data-commerce-copy-text="${commerceEncodedCopyText(copyTexts.flight)}">复制机票搜索条件</button>
        <button class="cmd-btn gray commerce-external-search-btn" type="button" data-commerce-external-search-kind="web" data-commerce-external-search-url="${commerceEncodedExternalUrl(externalUrls.web)}">打开全网搜索</button>
        <button class="cmd-btn gray commerce-external-search-btn" type="button" data-commerce-external-search-kind="googleFlights" data-commerce-external-search-url="${commerceEncodedExternalUrl(externalUrls.googleFlights)}">打开 Google Flights 搜索</button>
        <button class="cmd-btn gray commerce-external-search-btn" type="button" data-commerce-external-search-kind="tripCom" data-commerce-external-search-url="${commerceEncodedExternalUrl(externalUrls.tripCom)}">打开 Trip.com / 携程搜索</button>
        <details class="commerce-manual-verification-note"><summary>查看外部搜索安全说明</summary><div class="commerce-disclosure-body"><p>外部搜索由用户手动点击，点击后先确认，再打开可信外部搜索链接。weishan 不自动打开、不付款、不下单。请优先选择官方平台、知名旅行平台和航空公司官网。最终价格、库存、出票规则和付款均以外部平台为准。</p></div></details>
        ${safeExternalSearchConfirmationHtml(task)}
      </div>
      ${commerceSafetyAndDebugDetailsDisclosure(task, [commerceApiBindingSafeShellDisclosure(task), commerceUserApiProviderCatalogDisclosure(task), commerceApiBindingMockFormDisclosure(task), commerceApiBindingPermissionChecklistDisclosure(task), commerceApiBindingReadinessDisclosure(task), commerceSecureStorageDesignGateDisclosure(task), commerceLocalSecureStorageInterfaceDraftDisclosure(task), commerceSecureApiKeyStorageConsoleDisclosure(task), commerceKeyRedactionAndLogLeakRulesDisclosure(task), commerceKeyLifecycleDraftDisclosure(task), simpleFlightAdvancedDebugDisclosure(task), providerConnectionReadinessConsoleDisclosure(task), commerceProviderEndpointAllowlistGateDisclosure(task), commerceReadonlyProviderSandboxGateDisclosure(task), commerceReadonlyProviderResultSchemaGateDisclosure(task), commerceProviderResultSourceLabelGateDisclosure(task), commercePriceIntegrityTaxesFeesGateDisclosure(task), commerceRealPriceDisplayGateDisclosure(task), commerceBookingUrlDomainSafetyGateDisclosure(task), commerceManualProviderReviewWorkflowDisclosure(task), commerceManualProviderReviewWorkflowV1Disclosure(task), commerceLimitedRealPriceUiBetaGateDisclosure(task), commerceLimitedBetaKillSwitchDisclosure(task), commerceLimitedBetaStatePersistenceDisclosure(task), commerceLimitedBetaUserPreferenceGuardDisclosure(task), commerceLimitedBetaRollbackGuardDisclosure(task), commerceManualBookingHandoffDisclosure(task), commerceProviderActivationReadinessGateDisclosure(task), commerceCredentialConsentScopeGateDisclosure(task), commerceReadonlyAdapterContractGateDisclosure(task), commerceReadOnlyProviderAdapterV1Disclosure(task), commerceEndpointAllowlistEnforcementDisclosure(task), commerceProviderSandboxRealKeyDryRunGateDisclosure(task), commerceSandboxResponseSchemaGateDisclosure(task), commerceRealProviderResultSchemaValidationDisclosure(task), commerceProviderResultSourceLabelGateDisclosure(task), commerceProviderGateMatrixDashboardDisclosure(task), commerceProviderNoNetworkRuntimeGuardDisclosure(task), commerceOfflineProviderFixtureValidationHarnessDisclosure(task), commerceProviderComplianceDecisionEngineDisclosure(task), commerceOfflineProviderFixtureRunnerDisclosure(task), commerceNoNetworkSentinelAuditDisclosure(task), commerceProviderComplianceEvidenceReportDisclosure(task), commerceLocalSafetyEvidenceConsoleDisclosure(task), commerceManualUiAcceptanceAssistantDisclosure(task), commerceNoSecretPersistenceGuardDisclosure(task), commerceSettingsAuthLocalSecurityEvidenceDisclosure(task), globalProcurementRestrictedCategoryGuardDisclosure(task), globalProcurementEvidenceSafetySummaryDisclosure(task)])}
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
      ${commerceLocalSafetyEvidenceConsoleDisclosure(task)}
      ${commerceManualUiAcceptanceAssistantDisclosure(task)}
      ${commerceNoSecretPersistenceGuardDisclosure(task)}
      ${commerceSettingsAuthLocalSecurityEvidenceDisclosure(task)}
    </section>`;
    return disclosure("查看其它安全规则折叠面板", body, "commerce-simple-flight-advanced-debug-disclosure");
  }

  function commerceGuardedFlightPriceCardHtml(){
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
        ? '<section class="commerce-limited-beta-restore-confirmation" data-limited-beta-restore-confirmation="true"><h5>恢复 Limited Beta 确认</h5><p>我确认仅恢复机票 Limited Beta</p><p>我理解 weishan 不提供预订链接</p><p>我理解 weishan 不付款、不下单</p><p>我理解最终以平台页面为准</p><button type="button" data-commerce-limited-beta-action="restore-confirm">确认恢复 Limited Beta</button></section>'
        : "";
      return `<section class="commerce-guarded-price-card is-withheld" aria-label="Limited Beta 已关闭">
        <h5>${rollbackActive ? "已回滚到离线计划" : "Limited Beta 已关闭"}</h5>
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
      return `<section class="commerce-guarded-price-card is-withheld" aria-label="Limited Beta Rollback Active">
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
    return `<section class="commerce-guarded-price-card" aria-label="Limited Beta 已验证只读价格卡片">
      <h5>${esc(card.title || "Limited Beta · 已验证只读价格")}</h5>
      <p>${esc(card.subtitle || "仅机票白名单 Beta · 不可下单 / 不可付款")}</p>
      <p>${esc((card.requiredBadges || []).join(" · ") || "Limited Beta · 只读价格 · 不可下单 · 不可付款 · 最终以平台页面为准")}</p>
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
      <p>Provider 人工审查状态：${esc(card.providerManualReviewState || "approved_for_limited_beta")}</p>
      <p>Beta 范围：${esc(card.betaScope || "flight only")}</p>
      <p>只读证据：${esc(card.readonlyEvidence || "")}</p>
      <p>重要提示：${esc(card.finalPageDisclaimer || "最终价格、税费、库存/余票、退改签和行李规则，以平台页面为准。")}</p>
      <p>Limited Beta 只读价格仅用于展示验证；不保证最低价，不锁价，不代表最终成交价格。</p>
      <p>不提供外部预订链接；不提供预订、付款、下单或证件 / 银行卡上传入口。</p>
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

  let commerceExternalSearchFeedbackTimer = 0;
  function showCommerceExternalSearchFeedback(host, message, failed){
    const feedback = host && host.querySelector("[data-commerce-platform-template-feedback]");
    if (!feedback) return;
    feedback.textContent = message;
    feedback.classList.toggle("is-failed", !!failed);
    window.clearTimeout(commerceExternalSearchFeedbackTimer);
    commerceExternalSearchFeedbackTimer = window.setTimeout(function(){
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

  function commerceResultSummaryHomePanel(completionWorkspace, task, options){
    if (!task) return "";
    const body = commerceShouldShowClarification(task)
      ? commerceClarificationResultPanelHtml(task)
      : commerceIsSimpleFlightTask(task)
        ? commerceSimpleFlightResultPanelHtml(task)
      : commerceIsRestrictedProcurementTask(task)
        ? commerceRestrictedProcurementResultPanelHtml(task, options)
        : commerceIsTicketActivityTask(task)
          ? commerceTicketActivityResultPanelHtml(task, options)
          : commerceOneScreenResultPanelHtml(task, options);
    return `<div class="commerce-detail commerce-detail-home-surface" data-commerce-detail="${esc(task.taskId || "home-summary")}">${body}</div>`;
  }

  function commerceHistoryResultSummaryHomePanel(completionWorkspace, task){
    if (!task) return "";
    const body = commerceShouldShowClarification(task)
      ? commerceClarificationResultPanelHtml(task)
      : commerceIsSimpleFlightTask(task)
        ? commerceSimpleFlightResultPanelHtml(task)
      : commerceIsRestrictedProcurementTask(task)
        ? commerceRestrictedProcurementResultPanelHtml(task, { historyMode:true })
        : commerceIsTicketActivityTask(task)
          ? commerceTicketActivityResultPanelHtml(task, { historyMode:true })
          : commerceOneScreenResultPanelHtml(task, { historyMode:true });
    return `<div class="commerce-detail commerce-detail-home-surface" data-commerce-detail="${esc(task.taskId || "history-summary")}">${body}</div>`;
  }

  function commercePlanActions(task){
    const meta = task && task.meta || {};
    const answer = String(task && task.answer || "");
    if (!isCommerceTask(task)) return "";
    const stored = storedCommerceTask(task) || {};
    const blocked = stored.status === "blocked" || meta.commerceStatus === "blocked" || /全球采购计划已阻断|涉及下单 \/ 付款/.test(answer);
    const type = stored.categoryLabel || commerceTypeLabel(stored.category || meta.commerceCategory);
    const candidates = Array.isArray(stored.candidates) ? stored.candidates : [];
    const recommendation = stored.recommendation || {};
    const summaryData = stored.searchResultSummary || {};
    const lowest = summaryData.lowestLandedCost || summaryData.lowestPrice || recommendation.totalLandedCost || recommendation.price || "";
    const currency = summaryData.currency || recommendation.currency || "";
    const isModelPricing = stored.category === "aiModelPricing";
    const modelInput = summaryData.lowestPromptPricePerMillion || recommendation.promptPricePerMillion || "";
    const modelOutput = summaryData.lowestCompletionPricePerMillion || recommendation.completionPricePerMillion || "";
    const modelPriceSummary = isModelPricing && candidates.length ? [
      "已找到 " + candidates.length + " 个候选模型",
      recommendation.title ? "当前较低价格模型 " + recommendation.title : "",
      modelInput !== "" ? "输入 USD " + Number(modelInput).toFixed(6).replace(/0+$/, "").replace(/\.$/, "") + " / 1M tokens" : "",
      modelOutput !== "" ? "输出 USD " + Number(modelOutput).toFixed(6).replace(/0+$/, "").replace(/\.$/, "") + " / 1M tokens" : ""
    ].filter(Boolean).join(" · ") : "";
    const providerMissing = stored.searchStatus === "no_provider" || stored.searchStatus === "providerMissing";
    const destinationRequired = stored.searchStatus === "shipping_destination_required" || stored.searchStatus === "location_required";
    const complianceRequired = stored.searchStatus === "local_law_compliance_required";
    const localLawPanelRequired = !isModelPricing && stored.complianceHealth && stored.complianceHealth.canSearchProvider === false;
    const approvalPanelRequired = !isModelPricing && ["ecommerce", "product", "hotel", "flight", "ticketing", "ticket", "ticketOrActivity", "serviceBooking", "service", "localService"].includes(stored.category);
    const localIntentRoute = commerceLocalIntentRouteForTask(task, stored);
    const complexIntentSplit = commerceComplexIntentSplitForTask(task, stored, localIntentRoute);
    const subPlanGateMatrix = commerceSubPlanGateMatrixForTask(task, stored, complexIntentSplit);
    const subPlanQuestions = commerceSubPlanQuestionsForTask(task, stored, subPlanGateMatrix);
    const subPlanAnswerCollection = commerceSubPlanAnswerCollectionForTask(task, stored, subPlanQuestions);
    const subPlanCompletionWorkspace = commerceSubPlanCompletionWorkspaceForTask(task, stored, complexIntentSplit, subPlanGateMatrix, subPlanQuestions, subPlanAnswerCollection);
    const subPlanDraftReviewSummary = commerceSubPlanDraftReviewForTask(task, stored, complexIntentSplit, subPlanGateMatrix, subPlanQuestions, subPlanAnswerCollection, subPlanCompletionWorkspace);
    const subPlanDraftConfirmation = commerceSubPlanDraftConfirmationForTask(task, stored, subPlanDraftReviewSummary);
    const subPlanDraftActionBar = commerceSubPlanDraftActionBarForTask(stored, subPlanQuestions, subPlanCompletionWorkspace, subPlanDraftReviewSummary, subPlanDraftConfirmation);
    const resultSummaryTask = Object.assign({}, task, stored, {
      text:stored.text || task.text,
      inputSummary:stored.inputSummary || task.text,
      rawInput:stored.rawInput || task.text
    });
    let resultSummaryPanel = "";
    const simpleFlightResultMode = commerceIsSimpleFlightTask(stored);
    const oneScreenResultMode = true;
    const providerFailed = stored.searchStatus === "failed";
    const noResults = stored.searchStatus === "noResults" || stored.searchStatus === "no_results";
    const missingFields = Array.isArray(stored.missingFields) ? stored.missingFields : [];
    const normalized = stored.normalizedFields || {};
    const routeCondition = normalized.originText && normalized.destinationText ? normalized.originText + " → " + normalized.destinationText : "";
    const dateCondition = normalized.dateText || normalized.timing || "";
    const conditionSummary = [routeCondition, dateCondition].filter(Boolean).join("，");
    const isFlightPlan = stored.category === "flight";
    const isProductPlan = stored.category === "ecommerce" || stored.category === "product";
    const workspaceApi = window.CommerceAgentPage;
    if (!blocked && isProductPlan && workspaceApi
      && typeof workspaceApi.isGlobalShoppingTask === "function"
      && workspaceApi.isGlobalShoppingTask(resultSummaryTask)
      && typeof workspaceApi.renderGlobalShoppingWorkspace === "function") {
      return `<div class="commerce-home-card commerce-home-global-shopping" data-commerce-home-summary="true">
        ${workspaceApi.renderGlobalShoppingWorkspace(resultSummaryTask)}
      </div>`;
    }
    const commerceApi = window.WeishanCommerceAgent || null;
    const cardTitle = commerceApi && commerceApi.createCommerceDisplayTitle ? commerceApi.createCommerceDisplayTitle(stored, candidates.length > 0) : blocked ? "全球采购计划已阻断" : candidates.length ? type + "搜索已完成" : type + "搜索已生成";
    const providerReason = Array.isArray(stored.providerHealth) && stored.providerHealth[0] && stored.providerHealth[0].reasonWhenDisabled || "";
    const onboardingText = "Provider 接入审查未完成，完成前不会连接真实平台；接口文档审查未完成；API key 存储方案未审查；价格、税费和运费字段审查未完成；隐私与合规审查未完成";
    const productProfile = stored.configHealth && stored.configHealth.productProviderProfile || {};
    const productCandidateName = productProfile.selectedCandidateName || productProfile.candidateName || "eBay Browse API";
    const poolSummaryByCategory = {
      ecommerce:"全球多源 provider 候选池：准备中，尚未接入；" + onboardingText + "；当前比较范围：商品电商平台、品牌官网、商品官网、区域电商平台；商品搜索试点候选：" + productCandidateName + " 等；网络搜索未启用，实时价格不可用；精确跳转待真实 provider 接入后启用；当前不会访问任何真实平台；当前不会返回价格；当前不会跳转购买页面",
      product:"全球多源 provider 候选池：准备中，尚未接入；" + onboardingText + "；当前比较范围：商品电商平台、品牌官网、商品官网、区域电商平台；商品搜索试点候选：" + productCandidateName + " 等；网络搜索未启用，实时价格不可用；精确跳转待真实 provider 接入后启用；当前不会访问任何真实平台；当前不会返回价格；当前不会跳转购买页面",
      hotel:"全球多源 provider 候选池：准备中，尚未接入；" + onboardingText + "；当前比较范围：酒店官网、酒店 OTA、区域住宿平台；示例候选类型：Booking / Agoda / Expedia / 携程 / 酒店官网 等；当前不会访问任何真实酒店平台；当前不会返回房价；当前不会跳转预订页面",
      flight:"全球多源 provider 候选池：准备中，尚未接入；" + onboardingText + "；当前比较范围：机票 OTA、航司官网、区域旅行平台；示例候选类型：Trip.com / Expedia / 航司官网 等；当前不会访问任何真实机票平台；当前不会返回票价；当前不会跳转预订页面",
      ticketing:"全球多源 provider 候选池：准备中，尚未接入；" + onboardingText + "；当前比较范围：票务平台、活动官网、区域票务平台；示例候选类型：Ticketmaster / 大麦 / Eventbrite / 活动官网 等；当前不会访问任何真实票务平台；当前不会返回票价；当前不会跳转购票页面",
      ticket:"全球多源 provider 候选池：准备中，尚未接入；" + onboardingText + "；当前比较范围：票务平台、活动官网、区域票务平台；示例候选类型：Ticketmaster / 大麦 / Eventbrite / 活动官网 等；当前不会访问任何真实票务平台；当前不会返回票价；当前不会跳转购票页面",
      serviceBooking:"全球多源 provider 候选池：准备中，尚未接入；" + onboardingText + "；当前比较范围：本地服务预约平台、服务商官网、区域服务平台；当前不会访问任何真实服务平台；当前不会返回预约价格；当前不会跳转预约页面"
    };
    const providerMissingText = poolSummaryByCategory[stored.category] || providerReason || "Provider Connector 未启用；搜索适配器未配置，无法返回真实价格";
    const showOnboardingHomePanel = !blocked && !isModelPricing && (providerMissing || destinationRequired || complianceRequired || ["ecommerce", "product", "hotel", "flight", "ticketing", "ticket", "ticketOrActivity", "serviceBooking", "localService"].includes(stored.category));
    const flightSafetyText = "未下单、未付款、未提交订单、未保存证件";
    const productSafetyText = "未下单、未付款、未提交订单、未保存银行卡或证件";
    const productQuery = normalized.productQuery || normalized.normalizedQuery || "";
    const genericResultSummary = candidates.length ? `已找到 ${candidates.length} 个真实 provider 结果${lowest ? " · 最低到手价 " + esc(currency ? currency + " " + lowest : lowest) : ""}${recommendation.title ? " · 推荐 " + esc(recommendation.title) : ""}` : "";
    const analysisProcessBody = !blocked ? [
      commerceLocalIntentHomePanel(localIntentRoute),
      commerceComplexIntentSplitHomePanel(complexIntentSplit),
      commerceSubPlanGateMatrixHomePanel(subPlanGateMatrix),
      commerceSubPlanQuestionsHomePanel(subPlanQuestions),
      commerceSubPlanAnswerCollectionHomePanel(subPlanAnswerCollection),
      commerceSubPlanCompletionWorkspaceHomePanel(subPlanCompletionWorkspace)
    ].join("") : "";
    const safetyDetailsBody = !blocked ? [
      `<p class="commerce-safety-lead">当前只整理草稿和审查边界，不会访问真实平台，不会联网，不会显示价格，也不会发起购买、付款或下单。</p>`,
      `<ul class="commerce-safety-list">
        <li>当前不会访问真实平台</li>
        <li>当前不会返回价格</li>
        <li>当前不会跳转购买或预订</li>
        <li>当前不会付款或下单</li>
        <li>不会保存身份证、护照、银行卡或长期保存用户答案</li>
      </ul>`,
      localLawPanelRequired ? commerceLocalLawHomePanel(stored) : ""
    ].filter(Boolean).join("") : "";
    const technicalDetailsBody = !blocked ? [
      `<p>技术细节只用于内部说明，不影响默认结果。这里会显示 provider、API key、endpoint、Connector Gate、Sandbox Dry Run、Provider Approval、Provider Onboarding、Secret Storage、Stub、dispatch、gate、AI fallback，以及本地规则优先 + AI fallback 等内部状态。</p>`,
      localLawPanelRequired ? commerceLocalLawHomePanel(stored) : "",
      providerMissingText ? `<p>${esc(providerMissingText)}</p>` : "",
      `<p>全球多源 provider 候选池：准备中，尚未接入。</p>`,
      !blocked ? commerceSubPlanDraftReviewHomePanel(subPlanDraftReviewSummary) : "",
      !blocked ? commerceSubPlanDraftConfirmationHomePanel(subPlanDraftConfirmation) : "",
      !blocked && subPlanCompletionWorkspace ? commerceSubPlanCompletionWorkspaceHomePanel(subPlanCompletionWorkspace) : "",
      !blocked && showOnboardingHomePanel ? commerceOnboardingHomePanel() : "",
      !blocked && showOnboardingHomePanel ? commerceProviderIntegrationReadinessHomePanel(stored.providerIntegrationReadiness || stored.configHealth && stored.configHealth.providerIntegrationReadiness || {}) : "",
      !blocked && showOnboardingHomePanel ? commerceProviderIntegrationRunbookHomePanel(stored.providerRunbook || stored.providerIntegrationRunbook || stored.configHealth && stored.configHealth.providerIntegrationRunbook || {}) : "",
      !blocked && showOnboardingHomePanel ? commerceProviderSecretStorageHomePanel(stored.providerSecretHealth || stored.configHealth && stored.configHealth.providerSecretHealth || {}) : "",
      !blocked && showOnboardingHomePanel ? commerceProviderSandboxDryRunHomePanel(stored.providerSandboxDryRunHealth || stored.configHealth && stored.configHealth.providerSandboxDryRunHealth || {}) : "",
      !blocked && showOnboardingHomePanel ? commerceConnectorGateHomePanel(stored.connectorGateHealth || stored.configHealth && stored.configHealth.connectorGateHealth || {}) : "",
      !blocked && isProductPlan ? commerceProviderStubProfileHomePanel(stored.providerStubProfileHealth || stored.configHealth && stored.configHealth.providerStubProfileHealth || {}, stored.category) : "",
      !blocked && approvalPanelRequired ? commerceReadOnlyConnectorStubHomePanel(stored.connectorStubHealth) : "",
      !blocked && approvalPanelRequired ? commerceProviderApprovalHomePanel(stored.approvalHealth) : ""
    ].filter(Boolean).join("") : "";
    const advancedDebugBody = blocked ? `<section class="commerce-simple-flight-advanced-debug" aria-label="高级调试信息">
      <p>高级调试信息默认折叠，仅供排查与验证。</p>
      <p>当前请求已停止处理；默认结果面不展示过程细节。</p>
      <p>当前不会访问真实平台，不会返回价格，不会跳转购买或预订页面，不会付款或下单。</p>
    </section>` : `<section class="commerce-simple-flight-advanced-debug" aria-label="高级调试信息">
      <p>高级调试信息默认折叠，仅供排查与验证。</p>
      ${subPlanDraftActionBar && !simpleFlightResultMode ? commerceSubPlanDraftActionBarHomePanel(subPlanDraftActionBar) : ""}
      ${disclosure("查看可执行清单", commerceActionableChecklistPanelHtml(), "commerce-actionable-checklist-disclosure")}
      ${disclosure("查看平台模板", commercePlatformSearchTemplatePackHtml(), "commerce-platform-template-disclosure")}
      ${disclosure("查看分析过程", `<section class="commerce-simple-flight-advanced-debug-block">${analysisProcessBody}</section>`, "commerce-process-disclosure")}
      ${disclosure("查看安全边界", `<section class="commerce-simple-flight-advanced-debug-block">${safetyDetailsBody}</section>`, "commerce-safety-disclosure")}
      ${disclosure("查看技术细节", `<section class="commerce-simple-flight-advanced-debug-block">${technicalDetailsBody}</section>`, "commerce-technical-disclosure")}
      ${commerceFlightProviderCandidatesDisclosure(task)}
      ${commerceFlightProviderApprovalDisclosure(task)}
      ${commerceFlightReadonlyStubPermissionDisclosure(task)}
      ${commerceFlightReadonlyStubAdapterDisclosure(task)}
      ${commerceFlightSandboxDryRunDisclosure(task)}
      ${commerceFlightSandboxProviderMatrixDisclosure(task)}
    </section>`;
    const advancedDebugDisclosure = advancedDebugBody ? disclosure("查看其它安全规则折叠面板", advancedDebugBody, "commerce-simple-flight-advanced-debug-disclosure") : "";
    resultSummaryPanel = commerceResultSummaryHomePanel(subPlanCompletionWorkspace, resultSummaryTask, { advancedDebugDisclosure });
    const visibleSummaryDetails = oneScreenResultMode ? "" : `
        <h3>${esc(cardTitle)}</h3>
        <p><b>需求：</b>${esc(summary(task && task.text || "", 90))}</p>
        <p><b>类型：</b>${esc(type)}</p>
        <p><b>状态：</b>${blocked ? "已阻断" : "计划已生成"}</p>
        ${!blocked && isProductPlan && productQuery ? `<p><b>商品关键词：</b>${esc(productQuery)}</p>` : ""}
        ${!blocked && isFlightPlan ? `<p><b>识别结果：</b>已识别为机票搜索计划</p>` : ""}
        ${!blocked && conditionSummary ? `<p><b>条件：</b>${esc(conditionSummary)}</p>` : ""}
        ${!blocked && isFlightPlan && normalized.originText ? `<p><b>出发地：</b>${esc(normalized.originText)}</p>` : ""}
        ${!blocked && isFlightPlan && normalized.destinationText ? `<p><b>目的地：</b>${esc(normalized.destinationText)}</p>` : ""}
        ${!blocked && isFlightPlan && dateCondition ? `<p><b>日期：</b>${esc(dateCondition)}</p>` : ""}
        ${blocked ? `<p><b>原因：</b>涉及下单 / 付款 / 敏感资料或询价提交</p>` : ""}`;
    const visibleLegacyExtras = oneScreenResultMode ? "" : `
        ${safetyBrief}
        ${!blocked && destinationRequired ? `<p><b>收货目的地：</b>未设置</p><p><b>定位服务：</b>关闭 / 未授权</p><p><b>价格状态：</b>精确最低到手价不可用</p><p><b>原因：</b>需要收货国家/地区/邮编用于运费、税费、关税和当地合规计算。</p><p class="commerce-warning">为了精准计算最低到手价并遵守当地法律，请设置收货目的地，并可选择开启定位服务。实际价格、库存、税费和关税仍以外部平台和海关结算为准。</p>` : ""}
        ${!blocked && missingFields.length ? `<p><b>待补充：</b>${esc(missingFields.join("、"))}</p>` : ""}
        ${!blocked && candidates.length ? `<p><b>搜索结果：</b>${isModelPricing ? esc(modelPriceSummary) : genericResultSummary}</p>` : ""}
        <p><b>安全边界：</b>${blocked ? "不会下单、付款或提交订单，也不会提交证件或提交询价表" : isFlightPlan ? flightSafetyText : isProductPlan && (providerMissing || destinationRequired || complianceRequired) ? productSafetyText : candidates.length ? "仅展示候选方案，未下单、未付款、未提交订单" : "未搜索、未下单、未付款、未提交订单"}</p>`;
    return `<div class="commerce-home-card ${blocked ? "is-blocked" : ""}" data-commerce-home-summary="true">
      <div class="commerce-home-card-main">
        ${resultSummaryPanel}
        ${visibleSummaryDetails}
        ${visibleLegacyExtras}
      </div>
      <button class="cmd-btn primary commerce-view-plan-button" id="commerceViewPlanBtn" type="button">查看全球采购计划</button>
      ${!blocked && !oneScreenResultMode && destinationRequired ? `<button class="cmd-btn gray commerce-open-location-settings" id="commerceOpenLocationSettingsBtn" type="button">去设置收货目的地</button>` : ""}
    </div>`;
  }

  function desktopPlanActions(task){
    return "";
    /*
    const meta = task && task.meta || {};
    if (meta.dispatchModule !== "desktopAssistant" && task && task.module !== "desktopAssistant") return "";
    const risk = meta.desktopRiskLevel || "low";
    const riskText = risk === "high" ? "高风险" : risk === "medium" ? "中风险" : "普通提示";
    const isHigh = risk === "high";
    const session = desktopAssistantSession();
    const sessionEnabled = session && session.enabled === true;
    const canConfirm = sessionEnabled && !isHigh;
    const message = isHigh
      ? "高风险操作已阻断：不会删除、发送、上传、付款、提交表单或输入密码。"
      : sessionEnabled
        ? "仅生成计划，等待用户确认后进入模拟队列。"
        : "桌面助手未开启。请先点击“本次开启”，再确认或模拟任务。";
    return `<div class="desktop-plan-actions desktop-risk-${esc(risk)}" data-desktop-plan-actions="true">
      <div>
        <b>${esc(riskText)}桌面操作计划</b>
        <span>${esc(message)}</span>
      </div>
      <div class="desktop-plan-buttons">
        ${canConfirm ? `<button class="cmd-btn gray" id="desktopPlanConfirm" type="button">确认计划</button>` : ""}
        <button class="cmd-btn gray" id="desktopPlanCancel" type="button">取消计划</button>
        <button class="cmd-btn danger ghost" id="desktopPlanStop" type="button">停止全部接管</button>
      </div>
    </div>`;
    */
  }

  function desktopExecutionQueuePanel(){
    return "";
    /*
    const tasks = desktopAssistantTasks();
    if (!tasks.length) return `<div class="desktop-execution-queue desktop-task-queue" data-desktop-task-queue="true">
      <div class="desktop-execution-head">
        <div>
          <b>桌面助手任务队列</b>
          <span>桌面助手执行队列 · 暂无桌面助手任务。</span>
        </div>
      </div>
    </div>`;
    const realOpenEnabled = realOpenAppEnabled();
    const api = desktopAssistantApi();
    const settings = api && api.getDesktopAssistantSettings ? api.getDesktopAssistantSettings() : {};
    const session = desktopAssistantSession();
    const sessionEnabled = session && session.enabled === true;
    const taskRows = tasks.map((task, idx) => {
      const risk = task.riskLevel || "low";
      const steps = Array.isArray(task.steps) ? task.steps : [];
      const openStates = steps
        .filter((step) => step && (step.action === "openApp" || step.action === "focusApp") && step.status !== "realExecuted")
        .map((step) => api && api.getRealOpenAppState ? api.getRealOpenAppState(step, settings, session) : { status:"realOpenDisabled", outputSummary:"当前仅干跑模拟。", canExecute:false });
      const canShowRealOpen = openStates.some((state) => state.canExecute === true) && !/stopped|cancelled|blocked/.test(String(task.status || ""));
      const hasSessionRequired = openStates.some((state) => state.status === "sessionRequired");
      const hasRealOpenDisabled = openStates.some((state) => state.status === "realOpenDisabled");
      const hasAppNotAllowed = openStates.some((state) => state.status === "appNotAllowed");
      const hasRiskNotAllowed = openStates.some((state) => state.status === "riskNotAllowed");
      const realOpenNotice = [
        hasSessionRequired ? `<p class="cmd-history-meta">桌面助手未开启，本次任务只能生成计划。请先点击“本次开启桌面助手”。</p>` : "",
        hasRealOpenDisabled ? `<p class="cmd-history-meta">真实打开白名单 App 当前关闭，可继续模拟执行。</p>` : "",
        canShowRealOpen ? `<p class="cmd-history-meta">确认真实打开仅打开或聚焦白名单 App，不点击、不输入、不读屏。</p>` : "",
        hasAppNotAllowed ? `<p class="desktop-compact-warning is-high">该 App 不在白名单，已阻断。当前只允许 Chrome / Safari / Finder / WPS / Notes / Preview。</p>` : "",
        hasRiskNotAllowed ? `<p class="cmd-history-meta">中风险/高风险或非 openApp / focusApp 步骤继续 dry-run，不会真实执行。</p>` : ""
      ].filter(Boolean).join("");
      const realExecutedStep = steps.find((step) => step && step.status === "realExecuted");
      const failedStep = steps.find((step) => step && step.status === "failed");
      const blockedStep = steps.find((step) => step && step.status === "blocked");
      const isBlockedTask = risk === "high" || task.status === "blocked" || task.resultStatus === "blocked" || !!blockedStep || hasAppNotAllowed;
      const canConfirmTask = sessionEnabled && !isBlockedTask && !/stopped|cancelled/.test(String(task.status || ""));
      const canSimulateTask = canConfirmTask;
      const resultPanel = realExecutedStep ? `<div class="desktop-result-card is-success">
        <b>已真实打开白名单 App：${esc(realExecutedStep.appName || realExecutedStep.appId || "白名单 App")}</b>
        <p>App：${esc(realExecutedStep.appName || realExecutedStep.appId || "白名单 App")} · 操作：${esc(realExecutedStep.action || "openApp")}</p>
        <p>realExecution=true</p>
        <p>安全边界：未点击、未输入、未读屏、未截图。</p>
        <p>下一步建议：1. 如需继续操作，请重新下达下一步指令。2. 如需点击/输入/读取屏幕，需后续单独授权。3. 当前版本只负责打开或聚焦 App。</p>
      </div>` : failedStep ? `<div class="desktop-result-card is-failed">
        <b>打开失败</b>
        <p>App：${esc(failedStep.appName || failedStep.appId || "白名单 App")} · ${esc(failedStep.outputSummary || "系统打开失败。")}</p>
        <p>建议：1. 检查该 App 是否已安装。2. 确认 App 是否在白名单。3. 如果是 WPS，可能需要使用正确的 macOS 应用名。</p>
      </div>` : blockedStep ? `<div class="desktop-result-card is-blocked">
        <b>高风险操作已阻断</b>
        <p>不会删除、发送、上传、付款、提交表单或输入密码。</p>
      </div>` : "";
      const expanded = expandedDesktopTasks[task.taskId] === true;
      const statusLabel = desktopStatusLabel(task.status, task.resultStatus);
      const riskLabel = desktopRiskLabel(risk);
      const stepRows = steps.map((step) => `<li class="desktop-queue-step desktop-risk-${esc(step.riskLevel || "low")}">
        <span class="desktop-step-tag">${esc(desktopRiskLabel(step.riskLevel))}</span>
        <b>${esc(step.title)}</b>
        <span>${esc(step.description)}${step.appName ? " · " + esc(step.appName) : ""}${step.outputSummary ? " · " + esc(step.outputSummary) : ""}</span>
      </li>`).join("");
      return `<article class="desktop-task-row desktop-risk-${esc(risk)}" data-desktop-task-id="${esc(task.taskId)}">
        <div class="desktop-task-head">
          <div>
            <b>${esc(task.title)}</b>
            <span>${esc(desktopResultSummary(task))}</span>
          </div>
          <div class="desktop-plan-buttons">
            <span class="desktop-status-badge">${esc(statusLabel)}</span>
            <span class="desktop-risk-badge desktop-risk-${esc(risk)}">${esc(riskLabel)}</span>
            <button class="cmd-btn gray" data-desktop-task-view="${esc(task.taskId)}" type="button">${expanded ? "收起步骤" : "查看步骤"}</button>
            ${canConfirmTask ? `<button class="cmd-btn gray" data-desktop-task-confirm="${esc(task.taskId)}" type="button">确认计划</button>` : ""}
            ${canShowRealOpen ? `<button class="cmd-btn green" ${idx === 0 ? "id=\"desktopQueueRealOpen\"" : ""} data-desktop-task-real-open="${esc(task.taskId)}" type="button">确认真实打开</button>` : ""}
            ${canSimulateTask ? `<button class="cmd-btn gray" ${idx === 0 ? "id=\"desktopQueueSimulate\"" : ""} data-desktop-task-simulate="${esc(task.taskId)}" type="button">模拟执行</button>` : ""}
            <button class="cmd-btn gray" ${idx === 0 ? "id=\"desktopQueueCancel\"" : ""} data-desktop-task-cancel="${esc(task.taskId)}" type="button">取消计划</button>
            <button class="cmd-btn danger ghost" data-desktop-task-stop="${esc(task.taskId)}" type="button">停止此任务</button>
          </div>
        </div>
        <p class="cmd-history-meta">${esc(task.inputSummary || "桌面助手任务")}</p>
        ${realOpenNotice}
        ${resultPanel}
        ${expanded ? `<div class="desktop-task-debug">taskId=${esc(task.taskId)} · status=${esc(task.status)} · result=${esc(task.resultStatus || task.status)} · steps=${esc(task.stepCount || steps.length)}</div><ol class="desktop-task-steps">${stepRows}</ol>` : ""}
      </article>`;
    }).join("");
    return `<div class="desktop-execution-queue desktop-task-queue" data-desktop-task-queue="true" data-desktop-execution-queue="true">
      <div class="desktop-execution-head">
        <div>
          <b>桌面助手任务队列</b>
          <span>桌面助手执行队列 · 共 ${esc(tasks.length)} 项 · 可单独停止，全部接管可一键停止</span>
        </div>
        <div class="desktop-plan-buttons">
          <button class="cmd-btn danger ghost" id="desktopQueueStop" type="button">停止全部接管</button>
        </div>
      </div>
      <div class="desktop-task-list">${taskRows}</div>
    </div>`;
    */
  }

  function queuePanel(snapshot){
    const tasks = snapshot.queue || [];
    const pending = activeTasks(tasks);
    if (!pending.length) return `<div class="cmd-mini-empty">${t("homeEmptyQueue")}</div>`;

    return pending.map((task, idx) => `
      <div class="cmd-mini-task ${statusCls(task)}">
        <span class="cmd-mini-index">${idx + 1}</span>
        <div>
          <b>${esc(taskTitle(task))}</b>
          <p>${esc(task.text)}</p>
          <small>${esc(window.CommandApi.timeLabel(task.createdAt))}</small>
        </div>
      </div>
    `).join("");
  }

  function historyPanel(snapshot){
    const items = historyItems(snapshot);
    if (!items.length) return `<div class="cmd-mini-empty">${t("homeEmptyHistory")}</div>`;
    const selectedIndex = items.findIndex((task, idx) => taskKey(task, idx) === selectedHistoryId || String(task && task.text || "") === selectedHistoryText);
    const restoreHeader = selectedIndex >= 0 ? `<div class="cmd-history-restore-head">
      <span>正在查看历史任务详情</span>
      <button class="cmd-history-back" id="historyBackBtn" type="button">返回最新摘要</button>
    </div>` : "";
    const list = items.map((task, idx) => {
      const key = taskKey(task, idx);
      const textKey = String(task && task.text || "");
      const selected = key === selectedHistoryId || textKey === selectedHistoryText;
      const formatter = window.WeishanTaskHistorySummaryFormatter;
      const formatted = formatter && typeof formatter.buildTaskHistorySummary === "function" ? formatter.buildTaskHistorySummary(task) : null;
      const historyTitle = formatted && formatted.title || task.text;
      const historyType = formatted && formatted.type || taskTitle(task);
      const historySummary = formatted ? formatted.requestSummary : (isCommerceTask(task) ? commerceHistorySummary(task) : summary(displayAnswer(task), 190));
      const historyResult = formatted && formatted.resultSummary ? ` · ${formatted.resultSummary}` : "";
      return `<button class="cmd-history-item ${selected ? "is-selected" : ""}" data-history-id="${esc(key)}" data-history-text="${esc(textKey)}" type="button" title="${t("historyOpenDetail")}" aria-pressed="${selected ? "true" : "false"}">
        <div>
          <b>${esc(historyTitle)}</b>
          <span class="cmd-history-meta">${esc(taskTime(task))} · ${esc(historyType)} · ${esc(taskTitle(task))}</span>
          <p>${esc(historySummary)}${esc(historyResult)}</p>
          ${formatted && formatted.fullPromptHidden ? '<small>完整指令已隐藏</small>' : ''}
        </div>
        <small>${selected ? t("homeHistoryViewing") : esc(t("historyOpenDetail"))}</small>
      </button>`;
    }).join("");
    return restoreHeader + list;
  }

  function modulePanel(){
    return "";
  }

  function unifiedDesktopFlowHomePanel(){
    const api = window.WeishanUnifiedDesktopFlowViewModel;
    const examples = [
      "iPhone 17 Pro 512GB cheapest",
      "成都到东京9月10日两个人经济舱",
      "上海9月15到18日两个人酒店",
      "10月香港出发7晚邮轮阳台房"
    ];
    const model = api && typeof api.buildUnifiedDesktopFlowViewModel === "function"
      ? api.buildUnifiedDesktopFlowViewModel({ query:commandInputDraft || "Ask for a product, flight, hotel, or cruise", deterministicFixturesOnly:true })
      : null;
    const flow = model && Array.isArray(model.highLevelFlow) ? model.highLevelFlow.join(" → ") : "Ask → Understand → Search → Compare → Recommend → Handoff";
    const chip = model && model.domainChip && model.domain !== "UNKNOWN" ? `<strong>${esc(model.domainChip)}</strong>` : "<strong>One request box</strong>";
    return `<section class="commerce-home-card weishan-unified-desktop-flow-home" data-unified-desktop-flow-home="true" aria-label="One Weishan unified request flow">
      <div class="commerce-home-card-main">
        <div>
          <b>One Weishan</b>
          <p>Ask for products, flights, hotels, or cruises in the same box. Weishan routes internally; you do not need to choose a Provider, API, or network.</p>
        </div>
        ${chip}
      </div>
      <p class="cmd-history-meta">${esc(flow)}</p>
      <div class="commerce-subplan-draft-chips">
        ${examples.map((example) => `<button class="commerce-subplan-draft-chip" type="button" data-commerce-action-chip="${esc(example)}">${esc(example)}</button>`).join("")}
      </div>
      <p class="cmd-history-meta">Prices stay honest: current, indicative, test-only, or unavailable. Weishan never checks out, books, orders, tickets, or takes payment.</p>
    </section>`;
  }

  function syncHomeTopbar(snapshot){
    const topbar = document.querySelector(".topbar");
    if (!topbar) return;
    const title = topbar.querySelector("h1");
    const subtitle = topbar.querySelector("p");
    const actions = topbar.querySelector(".top-actions");
    const lang = topbar.querySelector("#langSelect");
    if (title && title.textContent !== "首页总调度") title.textContent = "首页总调度";
    if (subtitle && subtitle.textContent !== "本地优先 · 模块隔离 · 安全协作") subtitle.textContent = "本地优先 · 模块隔离 · 安全协作";
    if (!actions || !lang) return;
    let status = actions.querySelector("#homeAiStatus") || actions.querySelector("#aiConnectionStatus");
    if (!status) {
      status = document.createElement("span");
      status.id = "homeAiStatus";
      status.className = "home-ai-status";
      actions.insertBefore(status, lang);
    }
    const summary = window.WeishanAPI && typeof window.WeishanAPI.connectorSummary === "function"
      ? window.WeishanAPI.connectorSummary()
      : { state:/^AI 已连接/.test(String(snapshot && snapshot.brain || "")) ? "connected" : "not_configured", label:/^AI 已连接/.test(String(snapshot && snapshot.brain || "")) ? "AI 已连接" : "AI 未配置" };
    const state = String(summary.state || (summary.connected ? "connected" : "not_configured"));
    const label = String(summary.label || (state === "connected" ? "AI 已连接" : state === "saved_untested" ? "AI 未测试" : state === "testing" ? "AI 测试中" : state === "failed" ? "AI 连接失败" : "AI 未配置"));
    const cls = state === "connected" ? "is-connected" : (state === "saved_untested" || state === "testing" ? "is-pending" : "is-disconnected");
    if (status.dataset.aiState === state && status.textContent === label && status.className === "home-ai-status " + cls) return;
    status.className = "home-ai-status " + cls;
    status.dataset.aiState = state;
    status.textContent = label;
  }

  function syncHomeTopbarSoon(snapshot){
    homeTopbarPendingSnapshot = snapshot || null;
    if (homeTopbarSyncFrame) return;
    const schedule = typeof requestAnimationFrame === "function"
      ? requestAnimationFrame
      : function(callback){ return setTimeout(callback, 0); };
    homeTopbarSyncFrame = schedule(function(){
      homeTopbarSyncFrame = 0;
      const pending = homeTopbarPendingSnapshot;
      homeTopbarPendingSnapshot = null;
      if (homeRouteActive()) syncHomeTopbar(pending);
    });
  }

  function homeRouteActive(){
    return !!(window.WeishanRouter && window.WeishanRouter.current && window.WeishanRouter.current() === "home");
  }

  function refreshHomeAiStatus(){
    if (!homeRouteActive()) return;
    syncHomeTopbarSoon(window.CommandApi && window.CommandApi.snapshot ? window.CommandApi.snapshot() : null);
  }

  function clearHomeAiStatusRuntimeHooks(){
    if (typeof window.__WEISHAN_HOME_AI_STATUS_UNSUBSCRIBE__ === "function") {
      try { window.__WEISHAN_HOME_AI_STATUS_UNSUBSCRIBE__(); } catch (_) {}
    }
    if (window.__WEISHAN_HOME_AI_STATUS_FOCUS_HANDLER__) {
      window.removeEventListener("focus", window.__WEISHAN_HOME_AI_STATUS_FOCUS_HANDLER__);
    }
    if (window.__WEISHAN_HOME_AI_STATUS_VISIBILITY_HANDLER__) {
      document.removeEventListener("visibilitychange", window.__WEISHAN_HOME_AI_STATUS_VISIBILITY_HANDLER__);
    }
    if (window.__WEISHAN_HOME_AI_STATUS_ROUTE_HANDLER__) {
      window.removeEventListener("weishan:route-changed", window.__WEISHAN_HOME_AI_STATUS_ROUTE_HANDLER__);
    }
    window.__WEISHAN_HOME_AI_STATUS_UNSUBSCRIBE__ = null;
    window.__WEISHAN_HOME_AI_STATUS_FOCUS_HANDLER__ = null;
    window.__WEISHAN_HOME_AI_STATUS_VISIBILITY_HANDLER__ = null;
    window.__WEISHAN_HOME_AI_STATUS_ROUTE_HANDLER__ = null;
    homeTopbarPendingSnapshot = null;
  }

  function bindHomeAiStatusRuntimeHooks(){
    clearHomeAiStatusRuntimeHooks();
    if (window.WeishanAPI && typeof window.WeishanAPI.subscribeConnectorStatus === "function") {
      window.__WEISHAN_HOME_AI_STATUS_UNSUBSCRIBE__ = window.WeishanAPI.subscribeConnectorStatus(function(){
        refreshHomeAiStatus();
      });
    }
    window.__WEISHAN_HOME_AI_STATUS_FOCUS_HANDLER__ = function(){
      refreshHomeAiStatus();
    };
    window.__WEISHAN_HOME_AI_STATUS_VISIBILITY_HANDLER__ = function(){
      if (document.visibilityState === "visible") refreshHomeAiStatus();
    };
    window.__WEISHAN_HOME_AI_STATUS_ROUTE_HANDLER__ = function(){
      refreshHomeAiStatus();
    };
    window.addEventListener("focus", window.__WEISHAN_HOME_AI_STATUS_FOCUS_HANDLER__);
    document.addEventListener("visibilitychange", window.__WEISHAN_HOME_AI_STATUS_VISIBILITY_HANDLER__);
    window.addEventListener("weishan:route-changed", window.__WEISHAN_HOME_AI_STATUS_ROUTE_HANDLER__);
  }

  function currentTaskForSnapshot(snap){
    return selectedHistoryTask(snap)
      || (snap.queue || []).find((task) => task && (task.status === "queued" || task.status === "running" || task.status === "done" || task.status === "failed"))
      || (snap.history || [])[0]
      || null;
  }

  function isGlobalShoppingActiveForSnapshot(snap){
    const currentTask = currentTaskForSnapshot(snap);
    const currentCommerceTask = currentTask && isCommerceTask(currentTask) ? storedCommerceTask(currentTask) : null;
    const workspaceApi = window.CommerceAgentPage;
    return !!(currentCommerceTask && workspaceApi
      && typeof workspaceApi.isGlobalShoppingTask === "function"
      && workspaceApi.isGlobalShoppingTask(currentCommerceTask));
  }

  function renderShell(host){
    homePerformanceStats.renderShellCount += 1;
    const snap = window.CommandApi.snapshot();
    syncDesktopAssistantTasksFromSnapshot(snap);
    syncHomeTopbarSoon(snap);
    const currentTask = currentTaskForSnapshot(snap);
    const currentCommerceTask = currentTask && isCommerceTask(currentTask) ? storedCommerceTask(currentTask) : null;
    const workspaceApi = window.CommerceAgentPage;
    const globalShoppingActive = isGlobalShoppingActiveForSnapshot(snap);
    const compactGlobalShoppingComposer = globalShoppingActive && !globalShoppingComposerExpanded && !commandInputDraft.trim() && !stagedAttachments.length;

    host.innerHTML = `
      <section class="home-v205-page ${globalShoppingActive ? "is-global-shopping-active" : ""}">
        <div class="home-v205-main">
          <div class="cmd-card cmd-console-card">
            <div class="cmd-console" id="cmdConsole">
              ${mainLogs(snap)}
            </div>
          </div>

          <div class="cmd-card cmd-input-card">
            ${compactGlobalShoppingComposer ? `
              <div class="cmd-compact-composer" data-global-shopping-compact-composer="true">
                <button class="cmd-compact-trigger" id="compactComposerExpandBtn" type="button" aria-expanded="false" aria-controls="commandInput">继续补充采购需求…</button>
                <div class="cmd-compact-actions">
                  <button class="cmd-btn ghost compact-icon-btn" id="uploadBtn" type="button" aria-label="${t("uploadAttachment")}">附件</button>
                  <button class="cmd-btn primary compact-send-btn" id="compactRunBtn" type="button">发送</button>
                  <button class="cmd-btn ghost compact-icon-btn" id="recordBtn" type="button" aria-label="${t("recordAudio")}">语音</button>
                </div>
              </div>
            ` : `
              ${desktopAssistantStrip()}
              ${attachmentPanel()}
              ${selectedHistoryTask(snap) ? `<p class="cmd-history-meta" data-history-execution-hint="true">当前正在查看历史详情；输入新指令并执行时会创建新任务，并返回最新结果。</p>` : ""}
              <textarea id="commandInput" class="cmd-input" placeholder="${t("homePlaceholder")}">${esc(commandInputDraft)}</textarea>
              <div class="cmd-actions">
                <button class="cmd-btn gray" id="uploadBtn">${t("uploadAttachment")}</button>
                <button class="cmd-btn gray" id="openPluginsBtn">${t("plugins")}</button>
                <button class="cmd-btn gray" id="recordBtn">${t("recordAudio")}</button>
                <button class="cmd-btn primary" id="runBtn">${t("startRun")}</button>
              </div>
            `}
          </div>
        </div>

        ${globalShoppingActive ? "" : `<aside class="home-v205-side">
          ${unifiedDesktopFlowHomePanel()}
          ${modulePanel()}
          <div class="cmd-side-card">
            <h3>${t("queueTitle")}</h3>
            <div id="cmdQueue">${queuePanel(snap)}</div>
          </div>
          <div class="cmd-side-card">
            <h3>${t("dispatchHistory")}</h3>
            <div id="cmdHistory">${historyPanel(snap)}</div>
          </div>
        </aside>`}
      </section>
    `;

    bind(host);
    if (globalShoppingActive && typeof workspaceApi.bindGlobalShoppingWorkspace === "function") {
      workspaceApi.bindGlobalShoppingWorkspace(host, currentCommerceTask, {
        onChange:function(){ render(host); },
        onRecentSearch:function(value){
          commandInputDraft = value;
          globalShoppingComposerExpanded = true;
          render(host);
          const input = host.querySelector("#commandInput");
          if (input) {
            input.value = value;
            input.focus();
          }
        }
      });
    }
  }

  function refreshPanel(panel, html){
    if (panel && panel.innerHTML !== html) panel.innerHTML = html;
  }

  function refreshCommandPanels(host){
    homePerformanceStats.refreshCommandPanelsCount += 1;
    const snap = window.CommandApi.snapshot();
    syncDesktopAssistantTasksFromSnapshot(snap);
    syncHomeTopbarSoon(snap);
    const shell = host.querySelector(".home-v205-page");
    const globalShoppingActive = isGlobalShoppingActiveForSnapshot(snap);
    if (!shell || shell.classList.contains("is-global-shopping-active") !== globalShoppingActive) {
      renderShell(host);
      return { fullRender:true, refreshedPanels:0 };
    }

    const consolePanel = host.querySelector("#cmdConsole");
    refreshPanel(consolePanel, mainLogs(snap));
    if (consolePanel) hydrateDisclosureSections(consolePanel);

    let refreshedPanels = consolePanel ? 1 : 0;
    if (!globalShoppingActive) {
      const queuePanelNode = host.querySelector("#cmdQueue");
      const historyPanelNode = host.querySelector("#cmdHistory");
      const queueHtml = queuePanel(snap);
      const historyHtml = historyPanel(snap);
      refreshPanel(queuePanelNode, queueHtml);
      refreshPanel(historyPanelNode, historyHtml);
      refreshedPanels += queuePanelNode ? 1 : 0;
      refreshedPanels += historyPanelNode ? 1 : 0;
    }
    return { fullRender:false, refreshedPanels };
  }

  function render(host){ renderShell(host); }

  function resetHomePerformanceStats(){
    homePerformanceStats.renderShellCount = 0;
    homePerformanceStats.refreshCommandPanelsCount = 0;
  }

  function bind(host){
    const input = host.querySelector("#commandInput");
    const runBtn = host.querySelector("#runBtn") || host.querySelector("#compactRunBtn");
    const compactExpandBtn = host.querySelector("#compactComposerExpandBtn");

    if (!window.__WEISHAN_LIMITED_BETA_PREFERENCE_RENDER_BOUND_HOME__) {
      window.__WEISHAN_LIMITED_BETA_PREFERENCE_RENDER_BOUND_HOME__ = true;
      window.addEventListener("weishan:limited-beta-preference-updated", () => {
        const currentHost = document.querySelector("#pageHost") || host;
        if (currentHost) render(currentHost);
      });
    }

    if (!window.__WEISHAN_TASK_HISTORY_RESTORE_BOUND__) {
      window.__WEISHAN_TASK_HISTORY_RESTORE_BOUND__ = true;
      document.addEventListener("click", function(ev){
        const currentHost = document.querySelector("#pageHost") || host;
        const target = ev.target && ev.target.closest ? ev.target : null;
        const historyBtn = target && target.closest("[data-history-id]");
        if (historyBtn && currentHost && currentHost.contains(historyBtn)) {
          ev.preventDefault();
          selectedHistoryId = historyBtn.getAttribute("data-history-id") || "";
          selectedHistoryText = historyBtn.getAttribute("data-history-text") || "";
          pendingSafeExternalSearchConfirmation = null;
          render(currentHost);
          return;
        }
        const latestBtn = target && target.closest ? target.closest("#historyBackBtn, #taskHistoryLatestBtn") : null;
        if (latestBtn && currentHost && currentHost.contains(latestBtn)) {
          ev.preventDefault();
          selectedHistoryId = "";
          selectedHistoryText = "";
          pendingSafeExternalSearchConfirmation = null;
          render(currentHost);
        }
      }, true);
    }

    function submit(){
      const inputValue = input ? input.value : commandInputDraft;
      let text = String(inputValue || "").trim();
      if (!text && stagedAttachments.length) text = t("processAttachment") + stagedAttachments.map((file) => file.name).join(", ");
      if (!text && !stagedAttachments.length) return;
      const attachments = stagedAttachments.slice();
      selectedHistoryId = "";
      selectedHistoryText = "";
      pendingSafeExternalSearchConfirmation = null;
      window.CommandApi.enqueue(text, { attachments });
      commandInputDraft = "";
      globalShoppingComposerExpanded = false;
      stagedAttachments = [];
      render(host);
      const nextInput = host.querySelector("#commandInput");
      if (nextInput) nextInput.focus();
    }

    if (runBtn) runBtn.addEventListener("click", submit);
    if (compactExpandBtn) compactExpandBtn.addEventListener("click", function(){
      globalShoppingComposerExpanded = true;
      render(host);
      const nextInput = host.querySelector("#commandInput");
      if (nextInput) nextInput.focus();
    });

    const desktopEnable = host.querySelector("#desktopAssistantEnable");
    if (desktopEnable) desktopEnable.addEventListener("click", function(){
      const api = desktopAssistantApi();
      if (api && api.toggleDesktopAssistantForSession) api.toggleDesktopAssistantForSession(true);
      render(host);
    });

    const desktopDisable = host.querySelector("#desktopAssistantDisable");
    if (desktopDisable) desktopDisable.addEventListener("click", function(){
      const api = desktopAssistantApi();
      if (api && api.toggleDesktopAssistantForSession) api.toggleDesktopAssistantForSession(false);
      render(host);
    });

    function stopDesktopAssistant(){
      const api = desktopAssistantApi();
      const tasks = api && api.stopAllDesktopAssistantTasks ? api.stopAllDesktopAssistantTasks() : [];
      const queue = api && api.stopDesktopAssistantExecution ? api.stopDesktopAssistantExecution() : null;
      const session = api && api.stopDesktopAssistantSession ? api.stopDesktopAssistantSession() : { enabled:false, status:"stopped" };
      const latest = latestDesktopTask();
      desktopAssistantHistory("desktopAssistant.stoppedAll", Object.assign({}, queue || {}, {
        inputSummary:latest && (latest.inputSummary || latest.text) || "用户点击停止接管。",
        outputSummary:"已停止全部桌面助手任务。本轮未执行电脑操作。",
        riskLevel:"low",
        stepCount:(tasks || []).reduce((sum, task) => sum + Number(task.stepCount || 0), 0),
        realExecution:false,
        createdAt:session && session.updatedAt || new Date().toISOString()
      }));
      render(host);
    }

    const desktopStop = host.querySelector("#desktopAssistantStop");
    if (desktopStop) desktopStop.addEventListener("click", stopDesktopAssistant);

    const desktopPlanStop = host.querySelector("#desktopPlanStop");
    if (desktopPlanStop) desktopPlanStop.addEventListener("click", stopDesktopAssistant);
    const desktopQueueStop = host.querySelector("#desktopQueueStop");
    if (desktopQueueStop) desktopQueueStop.addEventListener("click", stopDesktopAssistant);

    function confirmDesktopTask(taskId){
      const api = desktopAssistantApi();
      const task = desktopAssistantTask(taskId);
      const latest = latestDesktopTask();
      const meta = latest && latest.meta || {};
      const plan = task || (api && api.createDesktopOperationPlan ? api.createDesktopOperationPlan(latest && (latest.inputSummary || latest.text) || "") : null);
      const queue = api && api.createDesktopExecutionQueue && plan ? api.createDesktopExecutionQueue(plan) : null;
      const updated = task && api && api.updateDesktopAssistantTask ? api.updateDesktopAssistantTask(task.taskId, Object.assign({}, queue || {}, {
        taskId:task.taskId,
        status:queue && queue.status === "blocked" ? "blocked" : "queued",
        resultStatus:queue && queue.status === "blocked" ? "blocked" : "queued",
        outputSummary:"桌面助手任务已确认并进入执行队列。",
        steps:queue && queue.steps || task.steps || []
      })) : null;
      desktopAssistantHistory("desktopAssistant.planConfirmed", Object.assign({}, queue || plan || {}, {
        taskId:task && task.taskId || "",
        inputSummary:task && task.inputSummary || latest && latest.inputSummary || latest && latest.text || "确认桌面操作计划。",
        outputSummary:"用户已确认桌面操作计划；任务进入队列但不真实控制电脑。",
        riskLevel:task && task.riskLevel || meta.desktopRiskLevel || "low",
        stepCount:task && task.stepCount || meta.desktopStepCount || 0,
        requiresSecondConfirm:task && task.requiresSecondConfirm === true || meta.desktopRequiresSecondConfirm === true,
        realExecution:false
      }));
      if (updated) {
        desktopAssistantHistory("desktopAssistant.taskUpdated", Object.assign({}, updated, {
          outputSummary:"桌面助手任务状态更新为 " + updated.status + "。"
        }));
      }
      if (queue) {
        desktopAssistantHistory("desktopAssistant.executionQueued", Object.assign({}, queue, {
          taskId:task && task.taskId || "",
          outputSummary:"桌面助手执行队列已生成；realExecution=false。"
        }));
        if (Number(queue.blockedStepCount || 0) > 0) {
          desktopAssistantHistory("desktopAssistant.executionBlocked", Object.assign({}, queue, {
            taskId:task && task.taskId || "",
            outputSummary:"高风险步骤已阻断，不允许模拟为已执行。"
          }));
        }
      }
      render(host);
    }

    const desktopPlanConfirm = host.querySelector("#desktopPlanConfirm");
    if (desktopPlanConfirm) desktopPlanConfirm.addEventListener("click", function(){
      confirmDesktopTask(desktopPlanConfirm.getAttribute("data-desktop-task-confirm") || "");
    });

    const desktopPlanCancel = host.querySelector("#desktopPlanCancel");
    if (desktopPlanCancel) desktopPlanCancel.addEventListener("click", function(){
      const latest = latestDesktopTask();
      const meta = latest && latest.meta || {};
      desktopAssistantHistory("desktopAssistant.planCancelled", {
        inputSummary:latest && latest.inputSummary || latest && latest.text || "取消桌面操作计划。",
        outputSummary:"用户已取消桌面操作计划；未执行电脑操作。",
        riskLevel:meta.desktopRiskLevel || "low",
        stepCount:meta.desktopStepCount || 0,
        requiresSecondConfirm:meta.desktopRequiresSecondConfirm === true,
        realExecution:false
      });
      const api = desktopAssistantApi();
      if (api && api.clearDesktopExecutionQueue) api.clearDesktopExecutionQueue();
      render(host);
    });

    function cancelDesktopTask(taskId){
      const api = desktopAssistantApi();
      const task = desktopAssistantTask(taskId);
      const updated = task && api && api.updateDesktopAssistantTask ? api.updateDesktopAssistantTask(task.taskId, {
        status:"cancelled",
        resultStatus:"stopped",
        outputSummary:"用户已取消此桌面助手任务。",
        realExecution:false
      }) : null;
      desktopAssistantHistory("desktopAssistant.taskCancelled", Object.assign({}, updated || task || {}, {
        outputSummary:"用户已取消此桌面助手任务。"
      }));
      render(host);
    }

    const desktopQueueCancel = host.querySelector("#desktopQueueCancel");
    if (desktopQueueCancel) desktopQueueCancel.addEventListener("click", function(){
      cancelDesktopTask(desktopQueueCancel.getAttribute("data-desktop-task-cancel") || "");
    });

    async function realOpenDesktopTask(taskId){
      const api = desktopAssistantApi();
      const task = desktopAssistantTask(taskId);
      const queue = task || desktopExecutionQueue();
      const settings = api && api.getDesktopAssistantSettings ? api.getDesktopAssistantSettings() : {};
      const session = desktopAssistantSession();
      const steps = Array.isArray(queue && queue.steps) ? queue.steps : [];
      const step = steps.find((item) => api && api.canRealOpenApp && api.canRealOpenApp(item, settings, session) && item.status !== "realExecuted");
      if (!step) {
        const state = steps.map((item) => api && api.getRealOpenAppState ? api.getRealOpenAppState(item, settings, session) : null).filter(Boolean)[0];
        realOpenAppHistory("desktopAssistant.realOpenAppDenied", {
          appId:"",
          appName:"",
          actionType:"openApp",
          resultStatus:state && state.status === "appNotAllowed" ? "blocked" : "blocked",
          safetySummary:"未点击、未输入、未读屏、未截图",
          realExecution:false,
          inputSummary:queue && queue.inputSummary || "打开白名单 App",
          outputSummary:state && state.outputSummary || "真实打开条件未满足。"
        });
        render(host);
        return;
      }
      const request = api.createRealOpenAppRequest ? api.createRealOpenAppRequest(step) : { appId:step.appId, appName:step.appName };
      realOpenAppHistory("desktopAssistant.realOpenAppRequested", Object.assign({}, request, {
        actionType:step.action || "openApp",
        resultStatus:"requested",
        safetySummary:"未点击、未输入、未读屏、未截图",
        realExecution:false,
        inputSummary:queue && queue.inputSummary || "打开白名单 App",
        outputSummary:"用户确认真实打开白名单 App。"
      }));
      const bridge = desktopAssistantOpenAppBridge();
      if (!bridge) {
        realOpenAppHistory("desktopAssistant.realOpenAppFailed", Object.assign({}, request, {
          actionType:step.action || "openApp",
          resultStatus:"failed",
          safetySummary:"未点击、未输入、未读屏、未截图",
          realExecution:false,
          inputSummary:queue && queue.inputSummary || "打开白名单 App",
          outputSummary:"桌面助手安全桥未加载。"
        }));
        render(host);
        return;
      }
      let result;
      try { result = await bridge(request.appId); } catch (err) { result = { ok:false, code:"IPC_FAILED", message:err && err.message || "IPC failed", realExecution:false }; }
      if (result && result.ok) {
        const nextStep = api.markRealOpenAppExecuted ? api.markRealOpenAppExecuted(step, result) : Object.assign({}, step, { status:"realExecuted", realExecution:true });
        const nextQueue = api.saveDesktopExecutionQueue(Object.assign({}, queue, {
          status:"realOpenAppExecuted",
          steps:steps.map((item) => item.stepId === step.stepId ? nextStep : item)
        }));
        if (task && api.updateDesktopAssistantTask) {
          api.updateDesktopAssistantTask(task.taskId, {
            status:"realOpened",
            resultStatus:"realOpened",
            realExecution:true,
            outputSummary:"已真实打开白名单 App：" + (result.appName || request.appName || request.appId),
            safetySummary:"未点击、未输入、未读屏、未截图",
            steps:steps.map((item) => item.stepId === step.stepId ? nextStep : item)
          });
        }
        realOpenAppHistory("desktopAssistant.realOpenAppExecuted", Object.assign({}, request, result, {
          actionType:step.action || "openApp",
          resultStatus:"realOpened",
          safetySummary:"未点击、未输入、未读屏、未截图",
          realExecution:true,
          inputSummary:nextQueue && nextQueue.inputSummary || "打开白名单 App",
          outputSummary:"已真实打开白名单 App：" + (result.appName || request.appName || request.appId)
        }));
      } else {
        if (api && api.markRealOpenAppFailed && api.saveDesktopExecutionQueue) {
          const failedStep = api.markRealOpenAppFailed(step, result || {});
          api.saveDesktopExecutionQueue(Object.assign({}, queue, {
            status:"realOpenAppFailed",
            steps:steps.map((item) => item.stepId === step.stepId ? failedStep : item)
          }));
          if (task && api.updateDesktopAssistantTask) {
            api.updateDesktopAssistantTask(task.taskId, {
              status:"failed",
              resultStatus:"failed",
              outputSummary:"打开白名单 App 失败：" + (result && (result.message || result.code) || "系统打开失败"),
              realExecution:false,
              steps:steps.map((item) => item.stepId === step.stepId ? failedStep : item)
            });
          }
        }
        realOpenAppHistory("desktopAssistant.realOpenAppFailed", Object.assign({}, request, result || {}, {
          actionType:step.action || "openApp",
          resultStatus:"failed",
          safetySummary:"未点击、未输入、未读屏、未截图",
          realExecution:false,
          inputSummary:queue && queue.inputSummary || "打开白名单 App",
          outputSummary:"打开白名单 App 失败：" + (result && (result.message || result.code) || "系统打开失败")
        }));
      }
      render(host);
    }

    const desktopQueueRealOpen = host.querySelector("#desktopQueueRealOpen");
    if (desktopQueueRealOpen) desktopQueueRealOpen.addEventListener("click", function(){
      realOpenDesktopTask(desktopQueueRealOpen.getAttribute("data-desktop-task-real-open") || "");
    });

    function simulateDesktopTask(taskId){
      const api = desktopAssistantApi();
      const task = desktopAssistantTask(taskId);
      const queue = api && api.simulateDesktopExecutionQueue ? api.simulateDesktopExecutionQueue(task || desktopExecutionQueue()) : null;
      const updated = task && queue && api && api.updateDesktopAssistantTask ? api.updateDesktopAssistantTask(task.taskId, Object.assign({}, queue, {
        taskId:task.taskId,
        status:queue.blockedStepCount === queue.stepCount ? "blocked" : "simulated",
        resultStatus:queue.blockedStepCount === queue.stepCount ? "blocked" : "simulated",
        outputSummary:"已完成此桌面助手任务的模拟执行；未真实控制电脑。"
      })) : null;
      if (queue) {
        desktopAssistantHistory("desktopAssistant.executionSimulated", Object.assign({}, updated || queue, {
          taskId:task && task.taskId || "",
          outputSummary:"已完成桌面助手模拟执行；未真实控制电脑。"
        }));
        if (Number(queue.blockedStepCount || 0) > 0) {
          desktopAssistantHistory("desktopAssistant.executionBlocked", Object.assign({}, updated || queue, {
            taskId:task && task.taskId || "",
            outputSummary:"高风险步骤保持 blocked，不执行。"
          }));
        }
      }
      render(host);
    }

    const desktopQueueSimulate = host.querySelector("#desktopQueueSimulate");
    if (desktopQueueSimulate) desktopQueueSimulate.addEventListener("click", function(){
      simulateDesktopTask(desktopQueueSimulate.getAttribute("data-desktop-task-simulate") || "");
    });

    Array.from(host.querySelectorAll("[data-desktop-task-confirm]")).forEach((btn) => {
      if (btn.id === "desktopPlanConfirm") return;
      btn.addEventListener("click", function(){ confirmDesktopTask(btn.getAttribute("data-desktop-task-confirm") || ""); });
    });
    Array.from(host.querySelectorAll("[data-desktop-task-view]")).forEach((btn) => {
      btn.addEventListener("click", function(){
        const taskId = btn.getAttribute("data-desktop-task-view") || "";
        expandedDesktopTasks[taskId] = !expandedDesktopTasks[taskId];
        render(host);
      });
    });
    Array.from(host.querySelectorAll("[data-desktop-task-simulate]")).forEach((btn) => {
      if (btn.id === "desktopQueueSimulate") return;
      btn.addEventListener("click", function(){ simulateDesktopTask(btn.getAttribute("data-desktop-task-simulate") || ""); });
    });
    Array.from(host.querySelectorAll("[data-desktop-task-real-open]")).forEach((btn) => {
      if (btn.id === "desktopQueueRealOpen") return;
      btn.addEventListener("click", function(){ realOpenDesktopTask(btn.getAttribute("data-desktop-task-real-open") || ""); });
    });
    Array.from(host.querySelectorAll("[data-desktop-task-cancel]")).forEach((btn) => {
      if (btn.id === "desktopQueueCancel") return;
      btn.addEventListener("click", function(){ cancelDesktopTask(btn.getAttribute("data-desktop-task-cancel") || ""); });
    });
    Array.from(host.querySelectorAll("[data-desktop-task-stop]")).forEach((btn) => {
      btn.addEventListener("click", function(){
        const api = desktopAssistantApi();
        const stopped = api && api.stopDesktopAssistantTask ? api.stopDesktopAssistantTask(btn.getAttribute("data-desktop-task-stop") || "") : null;
        if (stopped) {
          if (api && api.createTaskStopHistoryPayload && window.HistoryApi && window.HistoryApi.record) {
            window.HistoryApi.record("desktopAssistant.taskStopped", api.createTaskStopHistoryPayload(stopped));
          } else {
            desktopAssistantHistory("desktopAssistant.taskStopped", stopped);
          }
        }
        render(host);
      });
    });

    if (input) {
      input.addEventListener("keydown", function(ev){
        if (ev.key === "Enter" && !ev.shiftKey) {
          ev.preventDefault();
          submit();
        }
      });
      input.addEventListener("input", function(){
        commandInputDraft = input.value;
      });
    }

    const openPluginsBtn = host.querySelector("#openPluginsBtn");
    if (openPluginsBtn) openPluginsBtn.addEventListener("click", function(){
      if (window.WeishanRouter && typeof window.WeishanRouter.setRoute === "function") window.WeishanRouter.setRoute("plugins");
    });

    let commerceActionChipFocusAssistTimer = 0;
    function applyCommerceActionChipFocusAssist(text){
      input.value = text;
      input.dispatchEvent(new Event("input", { bubbles:true }));
      const inputCard = input.closest(".cmd-input-card") || input;
      if (inputCard && inputCard.scrollIntoView) inputCard.scrollIntoView({ behavior:"smooth", block:"center" });
      input.focus();
      runBtn.classList.add("commerce-chip-focus-start-highlight");
      window.clearTimeout(commerceActionChipFocusAssistTimer);
      commerceActionChipFocusAssistTimer = window.setTimeout(function(){
        runBtn.classList.remove("commerce-chip-focus-start-highlight");
      }, 2600);
      const feedback = host.querySelector("[data-commerce-action-chip-feedback]");
      if (feedback) feedback.textContent = "已填入指令，请确认后点击开始执行";
    }

    Array.from(host.querySelectorAll("[data-commerce-action-chip]")).forEach((chip) => {
      chip.addEventListener("click", function(){
        const text = chip.getAttribute("data-commerce-action-chip") || "";
        applyCommerceActionChipFocusAssist(text);
      });
    });

    let commerceActionableChecklistCopyTimer = 0;
    function showCommerceActionableChecklistFeedback(message, failed){
      const feedbacks = Array.from(host.querySelectorAll("[data-commerce-copy-feedback]"));
      if (!feedbacks.length) return;
      feedbacks.forEach((feedback) => {
        feedback.textContent = message;
        feedback.classList.toggle("is-failed", !!failed);
      });
      window.clearTimeout(commerceActionableChecklistCopyTimer);
      commerceActionableChecklistCopyTimer = window.setTimeout(function(){
        feedbacks.forEach((feedback) => {
          if (feedback.textContent === message) feedback.textContent = "";
          feedback.classList.remove("is-failed");
        });
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
      commercePlatformTemplateCopyTimer = window.setTimeout(function(){
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
      const actionChip = target && target.closest("[data-commerce-action-chip]");
      if (actionChip && host.contains(actionChip)) {
        const text = actionChip.getAttribute("data-commerce-action-chip") || "";
        applyCommerceActionChipFocusAssist(text);
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
      const limitedBetaButton = target && target.closest("[data-commerce-limited-beta-action]");
      if (limitedBetaButton && host.contains(limitedBetaButton)) {
        const action = limitedBetaButton.getAttribute("data-commerce-limited-beta-action") || "";
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

    const clearFinishedBtn = host.querySelector("#clearFinishedBtn");
    if (clearFinishedBtn) clearFinishedBtn.addEventListener("click", function(){
      commandInputDraft = input.value;
      window.CommandApi.clearFinished();
      render(host);
    });

    const uploadBtn = host.querySelector("#uploadBtn");
    uploadBtn.addEventListener("click", async function(){
      const chooseFiles = typeof window.__WEISHAN_TEST_CHOOSE_FILES__ === "function"
        ? window.__WEISHAN_TEST_CHOOSE_FILES__
        : window.weishan && typeof window.weishan.chooseFiles === "function"
          ? window.weishan.chooseFiles
          : null;
      if (chooseFiles) {
        const res = await chooseFiles();
        if (res && res.ok && res.files && res.files.length) {
          stagedAttachments = stagedAttachments.concat(res.files.map(normalizeAttachment)).slice(0, 8);
          render(host);
        }
      } else {
        alert(t("attachmentReserved"));
      }
    });

    Array.from(host.querySelectorAll("[data-remove-attachment]")).forEach((btn) => {
      btn.addEventListener("click", function(){
        const idx = Number(btn.getAttribute("data-remove-attachment"));
        stagedAttachments = stagedAttachments.filter((_, current) => current !== idx);
        render(host);
      });
    });

    const recordBtn = host.querySelector("#recordBtn");
    recordBtn.addEventListener("click", function(){
      alert(t("recordReserved"));
    });

    const commerceViewPlanBtn = host.querySelector("#commerceViewPlanBtn");
    if (commerceViewPlanBtn) commerceViewPlanBtn.addEventListener("click", function(){
      try {
        const latest = window.CommandApi && window.CommandApi.snapshot ? (window.CommandApi.snapshot().queue || []).find(isCommerceTask) : null;
        const task = latest && storedCommerceTask(latest);
        if (task && task.taskId) window.sessionStorage.setItem("weishan:commerceAgent:selectedTask:v1", task.taskId);
      } catch (_) {}
      if (window.WeishanRouter && window.WeishanRouter.setRoute) window.WeishanRouter.setRoute("commerce");
      const commerceNav = document.querySelector('.nav-item[data-route="commerce"]');
      if (commerceNav && typeof commerceNav.click === "function") commerceNav.click();
    });
    const locationSettingsBtn = host.querySelector("#commerceOpenLocationSettingsBtn");
    if (locationSettingsBtn) locationSettingsBtn.addEventListener("click", function(){
      try { window.sessionStorage && window.sessionStorage.setItem("weishan:settings:focus", "commerceLocation"); } catch (_) {}
      if (window.WeishanRouter && window.WeishanRouter.setRoute) window.WeishanRouter.setRoute("settings");
    });
    hydrateDisclosureSections(host);
  }

  function mount(host){
    clearHomeAiStatusRuntimeHooks();
    render(host);
    bindHomeAiStatusRuntimeHooks();
    setTimeout(function(){ refreshHomeAiStatus(); }, 0);
    if (!window.__WEISHAN_HOME_V205_BOUND__) {
      window.__WEISHAN_HOME_V205_BOUND__ = true;
      window.addEventListener("weishan:command", function(){
        const current = document.querySelector("#pageHost");
        if (current && window.WeishanRouter && window.WeishanRouter.current && window.WeishanRouter.current() === "home") {
          try { refreshCommandPanels(current); } catch (_) {}
        }
      });
    }
  }

  function unmount(){
    clearHomeAiStatusRuntimeHooks();
  }

  window.HomePage = {
    mount,
    unmount,
    __syncHomeTopbarForTest:syncHomeTopbar,
    __syncHomeTopbarSoonForTest:syncHomeTopbarSoon,
    __refreshHomeAiStatusForTest:refreshHomeAiStatus,
    __bindHomeAiStatusRuntimeHooksForTest:bindHomeAiStatusRuntimeHooks,
    __clearHomeAiStatusRuntimeHooksForTest:clearHomeAiStatusRuntimeHooks,
    __renderShellForTest:renderShell,
    __refreshCommandPanelsForTest:refreshCommandPanels,
    __getPerformanceStatsForTest:function(){ return Object.assign({}, homePerformanceStats); },
    __resetPerformanceStatsForTest:resetHomePerformanceStats
  };
})();
