(function(){
  let selectedHistoryId = "";
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
    return !!(meta.commerceTaskId || meta.commerceCategory || /全球采购计划已/.test(String(task && task.answer || "")));
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
    if (!api || !api.getCommerceTaskById || !meta.commerceTaskId) return null;
    return api.getCommerceTaskById(meta.commerceTaskId);
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
      subtitle:"复合需求会先拆成多个独立子计划，每个子计划分别走安全 gate。当前不会访问任何真实 provider。",
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
      note:"该拆分只生成计划，不访问真实 provider，不读取 API key，不连接 endpoint，不发起网络请求，不返回商品、价格或跳转链接。"
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
      subtitle:"每个子计划独立显示 gate、缺失信息和下一步动作。当前不会访问任何真实 provider。",
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
      note:"该矩阵只用于整理子计划、缺失信息和下一步动作，不访问真实 provider，不读取 API key，不连接 endpoint，不发起网络请求，不返回商品、价格或跳转链接。"
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

  function taskKey(task, idx){
    return String((task && (task.id || task.createdAt || task.finishedAt || task.updatedAt)) || idx || "");
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

  function mainLogs(snapshot){
    const tasks = snapshot.queue || [];
    const running = tasks.find((x) => x.status === "running");
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
    return `<div class="commerce-home-card ${blocked ? "is-blocked" : ""}" data-commerce-home-summary="true">
      <div class="commerce-home-card-main">
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
        ${blocked ? `<p><b>原因：</b>涉及下单 / 付款 / 敏感资料或询价提交</p>` : ""}
        ${!blocked ? commerceLocalIntentHomePanel(localIntentRoute) : ""}
        ${!blocked ? commerceComplexIntentSplitHomePanel(complexIntentSplit) : ""}
        ${!blocked ? commerceSubPlanGateMatrixHomePanel(subPlanGateMatrix) : ""}
        ${!blocked && localLawPanelRequired ? commerceLocalLawHomePanel(stored) : ""}
        ${showOnboardingHomePanel ? commerceProviderIntegrationReadinessHomePanel(stored.providerIntegrationReadiness || stored.configHealth && stored.configHealth.providerIntegrationReadiness || {}) : ""}
        ${showOnboardingHomePanel ? commerceProviderIntegrationRunbookHomePanel(stored.providerIntegrationRunbook || stored.configHealth && stored.configHealth.providerIntegrationRunbook || {}) : ""}
        ${showOnboardingHomePanel ? commerceProviderSecretStorageHomePanel(stored.providerSecretHealth || stored.configHealth && stored.configHealth.providerSecretHealth || {}) : ""}
        ${showOnboardingHomePanel ? commerceProviderSandboxDryRunHomePanel(stored.providerSandboxDryRunHealth || stored.configHealth && stored.configHealth.providerSandboxDryRunHealth || {}) : ""}
        ${showOnboardingHomePanel ? commerceConnectorGateHomePanel(stored.connectorGateHealth || stored.configHealth && stored.configHealth.connectorGateHealth || {}) : ""}
        ${!blocked && isProductPlan ? commerceProviderStubProfileHomePanel(stored.providerStubProfileHealth || stored.configHealth && stored.configHealth.providerStubProfileHealth || {}, stored.category) : ""}
        ${!blocked && approvalPanelRequired ? commerceReadOnlyConnectorStubHomePanel(stored.connectorStubHealth) : ""}
        ${!blocked && approvalPanelRequired ? commerceProviderApprovalHomePanel(stored.approvalHealth) : ""}
        ${!blocked && destinationRequired ? `<p><b>收货目的地：</b>未设置</p><p><b>定位服务：</b>关闭 / 未授权</p><p><b>价格状态：</b>精确最低到手价不可用</p><p><b>原因：</b>需要收货国家/地区/邮编用于运费、税费、关税和当地合规计算。</p><p class="commerce-warning">为了精准计算最低到手价并遵守当地法律，请设置收货目的地，并可选择开启定位服务。实际价格、库存、税费和关税仍以外部平台和海关结算为准。</p>` : ""}
        ${!blocked && (providerMissing || complianceRequired || isProductPlan && destinationRequired) ? `<p><b>搜索源：</b>${esc(providerMissingText)}</p>` : ""}
        ${!blocked && providerFailed ? `<p><b>搜索源：</b>${esc(stored.searchErrorMessage || "搜索源不可用，无法返回真实价格")}</p>` : ""}
        ${!blocked && noResults ? `<p><b>搜索结果：</b>provider 未返回可展示结果，当前不显示价格。</p>` : ""}
        ${!blocked && missingFields.length ? `<p><b>待补充：</b>${esc(missingFields.join("、"))}</p>` : ""}
        ${!blocked && candidates.length ? `<p><b>搜索结果：</b>${isModelPricing ? esc(modelPriceSummary) : genericResultSummary}</p>` : ""}
        ${showOnboardingHomePanel ? commerceOnboardingHomePanel() : ""}
        <p><b>安全边界：</b>${blocked ? "不会下单、付款或提交订单，也不会上传身份证/护照或提交询价表" : isFlightPlan ? flightSafetyText : isProductPlan && (providerMissing || destinationRequired || complianceRequired) ? productSafetyText : candidates.length ? "仅展示候选方案，未下单、未付款、未提交订单" : "未搜索、未下单、未付款、未提交订单"}</p>
      </div>
      <button class="cmd-btn primary commerce-view-plan-button" id="commerceViewPlanBtn" type="button">查看全球采购计划</button>
      ${!blocked && destinationRequired ? `<button class="cmd-btn gray commerce-open-location-settings" id="commerceOpenLocationSettingsBtn" type="button">去设置收货目的地</button>` : ""}
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
    const items = recentDone(snapshot.queue, snapshot.history);
    if (!items.length) return `<div class="cmd-mini-empty">${t("homeEmptyHistory")}</div>`;
    const selectedIndex = items.findIndex((task, idx) => taskKey(task, idx) === selectedHistoryId);
    if (selectedIndex >= 0) {
      const task = items[selectedIndex];
      const body = displayAnswer(task) || t("homeNoDisplayableAi");
      return `
        <div class="cmd-history-detail" id="cmdHistoryDetail">
          <div class="cmd-history-detail-head">
            <button class="cmd-history-back" id="historyBackBtn" type="button">‹ ${t("historyBack")}</button>
            <span class="cmd-pill ${statusCls(task)}">${esc(taskTitle(task))}</span>
          </div>
          <h4>${esc(task.text || t("historyDetail"))}</h4>
          <div class="cmd-history-meta">
            <span>${esc(taskTime(task))}</span>
            <span>${esc(taskTitle(task))}</span>
          </div>
          <p class="cmd-history-tip">${t("historyDoubleClickBack")}</p>
          <pre class="cmd-history-full">${esc(body)}</pre>
        </div>`;
    }
    return items.map((task, idx) => `
      <button class="cmd-history-item" data-history-id="${esc(taskKey(task, idx))}" type="button" title="${t("historyOpenDetail")}">
        <div>
          <b>${esc(task.text)}</b>
          <span class="cmd-history-meta">${esc(taskTime(task))} · ${esc(taskTitle(task))}</span>
          <p>${esc(isCommerceTask(task) ? commerceHistorySummary(task) : summary(displayAnswer(task), 190))}</p>
        </div>
        <small>${esc(t("historyOpenDetail"))}</small>
      </button>
    `).join("");
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

    Array.from(host.querySelectorAll("[data-history-id]")).forEach((btn) => {
      btn.addEventListener("click", function(){
        selectedHistoryId = btn.getAttribute("data-history-id") || "";
        render(host);
      });
    });

    const historyBackBtn = host.querySelector("#historyBackBtn");
    if (historyBackBtn) historyBackBtn.addEventListener("click", function(){
      selectedHistoryId = "";
      render(host);
    });

    const historyDetail = host.querySelector("#cmdHistoryDetail");
    if (historyDetail) historyDetail.addEventListener("dblclick", function(){
      selectedHistoryId = "";
      render(host);
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
