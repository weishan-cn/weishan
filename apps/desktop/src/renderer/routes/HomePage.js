(function(){
  let selectedHistoryId = "";
  let selectedHistoryText = "";
  let stagedAttachments = [];
  let expandedDesktopTasks = {};

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
    return (snap.queue || []).slice().reverse().find((item) => item && (item.meta && item.meta.dispatchModule === "desktopAssistant" || item.module === "desktopAssistant")) || null;
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
    if ((log && (log.type === "answer" || log.type === "ai")) || /<think|```think|```thinking|```reasoning/i.test(text)) {
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

  function taskTitle(task){
    if (!task) return "";
    if (task.status === "queued") return t("statusQueued");
    if (task.status === "running") return t("statusRunning");
    if (task.status === "done") return t("statusDone");
    if (task.status === "failed") return t("statusFailed");
    return task.status || "";
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
    const type = commerceTypeLabel(meta.commerceCategory);
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
    (tasks || []).filter((x) => x.status === "done" || x.status === "failed").slice().reverse().forEach(add);
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
    if (isCommerceTask(task)) return "全球采购 / " + commerceTypeLabel(meta.commerceCategory || stored && stored.category);
    if (meta.dispatchModule) return meta.dispatchModule;
    return task && task.module || "本地任务";
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
    return answer || "暂无结构化计划；显示当前任务摘要。";
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
        <h4>原始需求</h4>
        <p>${esc(task.text || "暂无原始需求")}</p>
      </section>
      <section class="cmd-history-main-section">
        <h4>识别结果 / 计划内容</h4>
        <p>${esc(taskHistoryPlanSummary(commerceTask || task, stored || commerceTask))}</p>
      </section>
      <section class="cmd-history-main-section is-safety">
        <h4>安全边界摘要</h4>
        <p>${esc(safety)}</p>
      </section>
      <section class="cmd-history-main-section">
        <h4>下一步</h4>
        <p>如需继续，请返回最新摘要或重新发起下一步指令；历史回看不会重新执行任务。</p>
      </section>
      ${historyCommerceDetail ? `<div class="cmd-history-commerce-detail">${historyCommerceDetail}</div>` : `<pre class="cmd-history-main-full">${esc(detail)}</pre>`}
    </div>`;
  }

  function mainLogs(snapshot){
    const tasks = snapshot.queue || [];
    const running = tasks.find((x) => x.status === "running");
    const selected = selectedHistoryTask(snapshot);
    if (selected) return taskHistoryDetailView(selected);

    const latest = running || tasks.slice().reverse().find((x) => x.status === "done" || x.status === "failed") || (snapshot.history || [])[0];

    if (!latest) {
      return `
        <div class="cmd-empty">
          <b>${window.I18n.format ? window.I18n.format("homeConsoleBanner", { version:appVersion() }) : "$ weishan v" + appVersion() + " command-center"}</b>
          <span>${t("homeConsoleEmpty")}</span>
        </div>`;
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

  function commerceOneScreenResultPanelHtml(task, options){
    const opts = options && typeof options === "object" ? options : {};
    const searchText = summary(task && (task.inputSummary || task.text || task.title || ""), 180);
    const complexTravelComputer = /东京|剪视频|32G|1T|7月12日|孩子8岁/.test(String(task && (task.inputSummary || task.text || task.rawInput || "") || ""));
    const searchConditionHtml = complexTravelComputer ? `<div class="commerce-one-screen-condition-summary">
          <p>我已整理好两个计划：</p>
          <p><b>旅行：</b>成都出发，7月12日去东京，7月12日入住，7月16日离店，孩子8岁，预算一万以内。建议优先比较总价、转机次数、起飞时间、酒店位置、家庭友好和取消政策。</p>
          <p><b>电脑：</b>适合剪视频的新电脑，按 32G 内存、1T 硬盘、品牌不限、收货地成都、不接受二手、一万以内筛选。建议重点看 CPU、显卡、散热、屏幕、售后和退换政策。</p>
        </div>` : `<p>${esc(searchText || "请继续补充搜索条件。")}</p>`;
    const historyAdvancedDebug = opts.historyMode ? disclosure("查看高级调试信息", `<section class="commerce-simple-flight-advanced-debug" aria-label="高级调试信息">
      <p>高级调试信息默认折叠，仅供排查与验证。</p>
      ${disclosure("查看可执行清单", commerceActionableChecklistPanelHtml(), "commerce-actionable-checklist-disclosure")}
      ${disclosure("查看平台模板", commercePlatformSearchTemplatePackHtml(), "commerce-platform-template-disclosure")}
    </section>`, "commerce-simple-flight-advanced-debug-disclosure") : "";
    const advancedDebugHtml = opts.advancedDebugDisclosure || historyAdvancedDebug;
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
        <p class="commerce-result-summary-status"><b>提示：</b>当前只是整理搜索条件，不访问真实平台，不返回价格，不跳转购买或预订，不付款或下单。</p>
      </div>
      <div class="commerce-one-screen-actions" aria-label="最终结果操作">
        <button class="cmd-btn gray commerce-result-summary-copy-btn" type="button" data-commerce-copy-kind="full">复制全部搜索条件</button>
        <button class="cmd-btn gray commerce-result-summary-copy-btn" type="button" data-commerce-copy-kind="travel">复制旅行搜索条件</button>
        <button class="cmd-btn gray commerce-result-summary-copy-btn" type="button" data-commerce-copy-kind="computer">复制电脑搜索条件</button>
      </div>
      <p class="commerce-result-summary-copy-feedback" data-commerce-copy-feedback aria-live="polite"></p>
      ${advancedDebugHtml}
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
      <p>安全密钥存储方案未完成前，表单保持禁用</p>
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
      <p>下一步是安全密钥存储方案</p>
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
      nextStepLine:"下一步：安全密钥存储方案",
      nextStepDetail:"先设计安全密钥存储方案。当前版本仍不能输入、保存或测试真实 API key。",
      statusLines:[
        "用户 API：未绑定",
        "平台目录：已建立",
        "API 绑定说明：已建立",
        "API 绑定表单：禁用预览",
        "API 绑定权限清单：只读预览",
        "安全密钥存储方案：未完成",
        "Provider 人工审查：未开始",
        "只读沙箱连接：未准备",
        "真实价格结果：暂无"
      ],
      blockerTitle:"为什么还不能绑定：",
      status:{
        blockers:[
          "安全密钥存储方案未完成",
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
      <h5>当前状态：</h5>
      <ul>${statusLines.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <h5>${esc(display.blockerTitle || "为什么还不能绑定：")}</h5>
      <ul>${blockers.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <h5>${esc(display.nextStepLine || "下一步：安全密钥存储方案")}</h5>
      <p>${esc(display.nextStepDetail || "先设计安全密钥存储方案。当前版本仍不能输入、保存或测试真实 API key。")}</p>
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
    if (api && typeof api.describeSecureKeyStoragePlan === "function") return api.describeSecureKeyStoragePlan(plan);
    return {
      summaryTitle: "安全密钥存储方案",
      planStatusLine: "安全密钥存储方案：计划中",
      currentStatusLine: "当前状态：仅计划，尚未实现真实安全密钥存储。",
      currentStageLine: "当前阶段：设计中",
      futureTargetsLine: "未来目标：macOS Keychain / Electron safeStorage",
      blockedChannelsLine: "禁止：明文、.env、localStorage、sessionStorage、日志",
      nextStepLine: "下一步：设计安全密钥存储实现",
      safetyLine: "当前版本不读取真实 API key，不保存明文，不写入 .env / localStorage / sessionStorage / 日志。",
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

  function commerceSecureKeyStoragePlanDisclosure(task){
    const display = commerceSecureKeyStoragePlanDisplay(task);
    const storageTargets = Array.isArray(display.storageTargets) ? display.storageTargets : [];
    const blockedChannels = Array.isArray(display.blockedChannels) ? display.blockedChannels : [];
    const capabilityLines = Array.isArray(display.capabilityLines) ? display.capabilityLines : [];
    const checklistGroups = Array.isArray(display.checklistGroups) ? display.checklistGroups : [];
    const body = `<section class="commerce-secure-key-storage-plan-panel" aria-label="安全密钥存储方案">
      <h4>${esc(display.summaryTitle || "安全密钥存储方案")}</h4>
      <p>${esc(display.planStatusLine || "安全密钥存储方案：计划中")}</p>
      <p>${esc(display.currentStatusLine || "当前状态：仅计划，尚未实现真实安全密钥存储。")}</p>
      <p>${esc(display.currentStageLine || "当前阶段：设计中")}</p>
      <p>${esc(display.futureTargetsLine || "未来目标：macOS Keychain / Electron safeStorage")}</p>
      <p>${esc(display.blockedChannelsLine || "禁止：明文、.env、localStorage、sessionStorage、日志")}</p>
      <p>${esc(display.nextStepLine || "下一步：设计安全密钥存储实现")}</p>
      <p>${esc(display.safetyLine || "当前版本不读取真实 API key，不保存明文，不写入 .env / localStorage / sessionStorage / 日志。")}</p>
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
      <p>API 绑定表单：禁用预览</p>
      <p>API 绑定权限清单：只读预览</p>
      <p>API 绑定准备状态：未准备</p>
      <p>下一步：安全密钥存储方案</p>
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

  function commerceSimpleFlightResultPanelHtml(task){
    const fields = commerceSimpleFlightFields(task);
    const copyTexts = commerceSimpleFlightCopyTexts(task);
    const externalUrls = commerceSimpleFlightExternalSearchUrls(task);
    const flightLowestOffers = commerceFlightLowestOffersDisplay(task);
    const searchModeDisplay = commerceUserApiSearchModeDisplay(task);
    const apiBindingDisplay = commerceApiBindingSafeShellDisplay(task);
    // marker:one screen actionable checklist collapsed
    // disclosure("查看可执行清单") ... commerceActionableChecklistPanelHtml
    // marker:one screen platform templates collapsed
    // disclosure("查看平台模板") ... commercePlatformSearchTemplatePackHtml
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
          <p>${esc(flightLowestOffers.futureLine || "接入可信价格源后，将只展示通过安全检查的真实价格结果。最终价格、库存、税费、运费、行李、退改签，以跳转后的平台页面为准。")}</p>
          <p>weishan 不收款、不下单、不保存身份证、护照或银行卡。</p>
        </section>
        <p class="commerce-result-summary-status"><b>提示：</b>当前只是帮你整理搜索条件，不会访问真实平台，不会返回价格，不会跳转购买或预订，不会付款或下单。</p>
      </div>
      <div class="commerce-one-screen-actions" aria-label="机票搜索条件操作">
        <button class="cmd-btn gray commerce-external-search-btn" type="button" data-commerce-external-search-kind="web" data-commerce-external-search-url="${commerceEncodedExternalUrl(externalUrls.web)}">打开全网搜索</button>
        <button class="cmd-btn gray commerce-external-search-btn" type="button" data-commerce-external-search-kind="googleFlights" data-commerce-external-search-url="${commerceEncodedExternalUrl(externalUrls.googleFlights)}">打开 Google Flights 搜索</button>
        <button class="cmd-btn gray commerce-external-search-btn" type="button" data-commerce-external-search-kind="tripCom" data-commerce-external-search-url="${commerceEncodedExternalUrl(externalUrls.tripCom)}">打开 Trip.com / 携程搜索</button>
        <button class="cmd-btn gray commerce-result-summary-copy-btn" type="button" data-commerce-copy-kind="simpleFlight" data-commerce-copy-text="${commerceEncodedCopyText(copyTexts.flight)}">复制搜索条件</button>
      </div>
      ${commerceApiBindingSafeShellDisclosure(task)}
      ${commerceUserApiProviderCatalogDisclosure(task)}
      ${commerceApiBindingMockFormDisclosure(task)}
      ${commerceApiBindingPermissionChecklistDisclosure(task)}
      ${commerceApiBindingReadinessDisclosure(task)}
      ${commerceSecureKeyStoragePlanDisclosure(task)}
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
    </section>`;
    return disclosure("查看高级调试信息", body, "commerce-simple-flight-advanced-debug-disclosure");
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
    if (commerceIsSimpleFlightTask(task)) return commerceSimpleFlightResultPanelHtml(task);
    if (!task) return "";
    return commerceOneScreenResultPanelHtml(task, options);
  }

  function commerceHistoryResultSummaryHomePanel(completionWorkspace, task){
    if (commerceIsSimpleFlightTask(task)) return commerceSimpleFlightResultPanelHtml(task);
    if (!task) return "";
    return commerceOneScreenResultPanelHtml(task, { historyMode:true });
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
    const approvalPanelRequired = !isModelPricing && ["ecommerce", "product", "hotel", "flight", "ticketing", "ticket", "serviceBooking", "service"].includes(stored.category);
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
    const showOnboardingHomePanel = !blocked && !isModelPricing && (providerMissing || destinationRequired || complianceRequired || ["ecommerce", "product", "hotel", "flight", "ticketing", "ticket", "serviceBooking"].includes(stored.category));
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
    const advancedDebugBody = !blocked ? `<section class="commerce-simple-flight-advanced-debug" aria-label="高级调试信息">
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
    </section>` : "";
    const advancedDebugDisclosure = advancedDebugBody ? disclosure("查看高级调试信息", advancedDebugBody, "commerce-simple-flight-advanced-debug-disclosure") : "";
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
        <p><b>安全边界：</b>${blocked ? "不会下单、付款或提交订单，也不会上传身份证/护照或提交询价表" : isFlightPlan ? flightSafetyText : isProductPlan && (providerMissing || destinationRequired || complianceRequired) ? productSafetyText : candidates.length ? "仅展示候选方案，未下单、未付款、未提交订单" : "未搜索、未下单、未付款、未提交订单"}</p>`;
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
      return `<button class="cmd-history-item ${selected ? "is-selected" : ""}" data-history-id="${esc(key)}" data-history-text="${esc(textKey)}" type="button" title="${t("historyOpenDetail")}" aria-pressed="${selected ? "true" : "false"}">
        <div>
          <b>${esc(task.text)}</b>
          <span class="cmd-history-meta">${esc(taskTime(task))} · ${esc(taskTitle(task))}</span>
          <p>${esc(isCommerceTask(task) ? commerceHistorySummary(task) : summary(displayAnswer(task), 190))}</p>
        </div>
        <small>${selected ? "查看中" : esc(t("historyOpenDetail"))}</small>
      </button>`;
    }).join("");
    return restoreHeader + list;
  }

  function modulePanel(){
    return "";
  }

  function syncHomeTopbar(snapshot){
    const topbar = document.querySelector(".topbar");
    if (!topbar) return;
    const title = topbar.querySelector("h1");
    const subtitle = topbar.querySelector("p");
    const actions = topbar.querySelector(".top-actions");
    const lang = topbar.querySelector("#langSelect");
    if (title) title.textContent = "首页总调度";
    if (subtitle) subtitle.textContent = "本地优先 · 模块隔离 · A/B 模式";
    if (!actions || !lang) return;
    let status = actions.querySelector("#homeAiStatus");
    if (!status) {
      status = document.createElement("span");
      status.id = "homeAiStatus";
      status.className = "home-ai-status";
      actions.insertBefore(status, lang);
    }
    const label = String(snapshot && snapshot.brain || "");
    const connected = /^AI 已连接/.test(label);
    status.className = "home-ai-status " + (connected ? "is-connected" : "is-disconnected");
    status.textContent = connected ? label : "AI 未连接";
  }

  function syncHomeTopbarSoon(snapshot){
    syncHomeTopbar(snapshot);
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(function(){ syncHomeTopbar(snapshot); });
    }
    setTimeout(function(){ syncHomeTopbar(snapshot); }, 30);
  }

  function render(host){
    const snap = window.CommandApi.snapshot();
    syncDesktopAssistantTasksFromSnapshot(snap);
    syncHomeTopbarSoon(snap);

    host.innerHTML = `
      <section class="home-v205-page">
        <div class="home-v205-main">
          <div class="cmd-card cmd-console-card">
            <div class="cmd-console" id="cmdConsole">
              ${mainLogs(snap)}
            </div>
          </div>

          <div class="cmd-card cmd-input-card">
            <div class="cmd-card-title small-title">
              <h3>${t("homeInputTitle")}</h3>
            </div>
            ${desktopAssistantStrip()}
            ${attachmentPanel()}
            <textarea id="commandInput" class="cmd-input" placeholder="${t("homePlaceholder")}"></textarea>
            <div class="cmd-actions">
              <button class="cmd-btn gray" id="uploadBtn">${t("uploadAttachment")}</button>
              <button class="cmd-btn primary" id="runBtn">${t("startRun")}</button>
              <button class="cmd-btn danger" id="clearFinishedBtn">${t("clearDone")}</button>
              <button class="cmd-btn gray" id="recordBtn">${t("recordAudio")}</button>
            </div>
          </div>
        </div>

        <aside class="home-v205-side">
          ${modulePanel()}
          <div class="cmd-side-card">
            <h3>${t("queueTitle")}</h3>
            <div id="cmdQueue">${queuePanel(snap)}</div>
          </div>
          <div class="cmd-side-card">
            <h3>${t("dispatchHistory")}</h3>
            <div id="cmdHistory">${historyPanel(snap)}</div>
          </div>
        </aside>
      </section>
    `;

    bind(host);
  }

  function bind(host){
    const input = host.querySelector("#commandInput");
    const runBtn = host.querySelector("#runBtn");

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
          render(currentHost);
          return;
        }
        const latestBtn = target && target.closest ? target.closest("#historyBackBtn, #taskHistoryLatestBtn") : null;
        if (latestBtn && currentHost && currentHost.contains(latestBtn)) {
          ev.preventDefault();
          selectedHistoryId = "";
          selectedHistoryText = "";
          render(currentHost);
        }
      }, true);
    }

    function submit(){
      let text = input.value.trim();
      if (!text && stagedAttachments.length) text = t("processAttachment") + stagedAttachments.map((file) => file.name).join(", ");
      if (!text && !stagedAttachments.length) return;
      const attachments = stagedAttachments.slice();
      window.CommandApi.enqueue(text, { attachments });
      input.value = "";
      stagedAttachments = [];
      input.focus();
      render(host);
    }

    runBtn.addEventListener("click", submit);

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

    input.addEventListener("keydown", function(ev){
      if (ev.key === "Enter" && !ev.shiftKey) {
        ev.preventDefault();
        submit();
      }
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
        const url = commerceDecodedInlineValue(externalButton, "data-commerce-external-search-url");
        commerceOpenTrustedExternalSearch(url).then(function(ok){
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

    const clearFinishedBtn = host.querySelector("#clearFinishedBtn");
    clearFinishedBtn.addEventListener("click", function(){
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
        const latest = window.CommandApi && window.CommandApi.snapshot ? (window.CommandApi.snapshot().queue || []).slice().reverse().find(isCommerceTask) : null;
        const task = latest && storedCommerceTask(latest);
        if (task && task.taskId) window.sessionStorage.setItem("weishan:commerceAgent:selectedTask:v1", task.taskId);
      } catch (_) {}
      const commerceNav = document.querySelector('.nav-item[data-route="commerce"]');
      if (commerceNav && typeof commerceNav.click === "function") {
        commerceNav.click();
        return;
      }
      if (window.WeishanRouter && window.WeishanRouter.setRoute) window.WeishanRouter.setRoute("commerce");
    });
    const locationSettingsBtn = host.querySelector("#commerceOpenLocationSettingsBtn");
    if (locationSettingsBtn) locationSettingsBtn.addEventListener("click", function(){
      try { window.sessionStorage && window.sessionStorage.setItem("weishan:settings:focus", "commerceLocation"); } catch (_) {}
      if (window.WeishanRouter && window.WeishanRouter.setRoute) window.WeishanRouter.setRoute("settings");
    });
    hydrateDisclosureSections(host);
  }

  function mount(host){
    render(host);
    if (!window.__WEISHAN_HOME_V205_BOUND__) {
      window.__WEISHAN_HOME_V205_BOUND__ = true;
      window.addEventListener("weishan:command", function(){
        const current = document.querySelector("#pageHost");
        if (current && window.WeishanRouter && window.WeishanRouter.current && window.WeishanRouter.current() === "home") {
          try { render(current); } catch (_) {}
        }
      });
    }
  }

  window.HomePage = { mount };
})();
