(function(){
  let selectedHistoryId = "";
  let stagedAttachments = [];
  let expandedDesktopTasks = {};

  function esc(s){
    return String(s || "").replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; });
  }
  function t(key){ return window.I18n.t(key); }

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

  function taskKey(task, idx){
    return String((task && (task.id || task.createdAt || task.finishedAt || task.updatedAt)) || idx || "");
  }

  function taskTime(task){
    return window.CommandApi.timeLabel(task && (task.finishedAt || task.updatedAt || task.createdAt));
  }

  function logLine(log){
    const time = window.CommandApi.timeLabel(log.time);
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
          <b>${t("homeConsoleBanner")}</b>
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

  function commercePlanActions(task){
    const meta = task && task.meta || {};
    const answer = String(task && task.answer || "");
    const isCommerce = meta.commerceTaskId || meta.commerceCategory || /commerceAgent\.plan|路由判断：全球采购/.test(answer);
    if (!isCommerce) return "";
    return `<div class="commerce-home-actions" data-commerce-home-summary="true">
      <span>完整计划内容已放入全球采购工作台。</span>
      <button class="cmd-btn primary" id="commerceViewPlanBtn" type="button">查看全球采购计划</button>
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
          <p>${esc(summary(displayAnswer(task), 190))}</p>
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
      const commerceNav = document.querySelector('.nav-item[data-route="commerce"]');
      if (commerceNav && typeof commerceNav.click === "function") {
        commerceNav.click();
        return;
      }
      if (window.WeishanRouter && window.WeishanRouter.setRoute) window.WeishanRouter.setRoute("commerce");
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
