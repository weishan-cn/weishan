(function(){
  const DESKTOP_ASSISTANT_STORAGE_KEY = "weishan:desktopAssistant:v1";
  const DESKTOP_ASSISTANT_SESSION_KEY = "weishan:desktopAssistant:session:v1";
  const DESKTOP_ASSISTANT_QUEUE_KEY = "weishan:desktopAssistant:executionQueue:v1";
  const DESKTOP_ASSISTANT_TASKS_KEY = "weishan:desktopAssistant:tasks:v1";
  const REAL_OPEN_APP_SETTING_KEY = "weishan:desktopAssistant:realOpenApp:v1";
  const SCHEMA_VERSION = "weishan.desktopAssistant.v1";

  const DESKTOP_APP_WHITELIST = Object.freeze({
    chrome:{ appId:"chrome", appName:"Google Chrome", aliases:["chrome", "google chrome", "谷歌", "浏览器"] },
    safari:{ appId:"safari", appName:"Safari", aliases:["safari"] },
    finder:{ appId:"finder", appName:"Finder", aliases:["finder", "访达"] },
    wps:{ appId:"wps", appName:"WPS Office", aliases:["wps", "wps office"] },
    notes:{ appId:"notes", appName:"Notes", aliases:["notes", "备忘录"] },
    preview:{ appId:"preview", appName:"Preview", aliases:["preview", "预览"] }
  });

  const DEFAULT_SETTINGS = {
    enabled:false,
    allowPlanGeneration:true,
    allowKeyboardInput:false,
    allowMouseClick:false,
    allowScreenRead:false,
    requireSecondConfirmForHighRisk:true,
    autoStopAfterMinutes:30,
    allowRealOpenApp:false
  };

  const LOW_KEYWORDS = [
    "打开应用", "打开软件", "启动软件", "打开浏览器", "打开 Chrome", "打开 Google Chrome", "启动 Chrome", "打开 Safari", "启动 Safari", "打开 Finder", "打开 WPS", "打开 WPS Office", "打开备忘录", "打开 Notes", "打开 Preview", "聚焦 Chrome", "聚焦 Safari", "聚焦 Finder", "切换窗口", "复制文本", "粘贴文本", "输入搜索词", "查看页面",
    "open app", "open browser", "focus app", "open chrome", "open safari", "open finder", "open notes", "open preview", "switch window", "copy text", "paste text", "search"
  ];
  const MEDIUM_KEYWORDS = [
    "点击按钮", "点击", "填写表单", "保存文件", "下载文件", "移动文件", "修改文档内容",
    "click", "fill form", "save file", "download file", "move file", "edit document"
  ];
  const HIGH_KEYWORDS = [
    "发送邮件", "删除文件", "删除", "上传文件", "提交表单", "付款", "下单", "输入密码", "修改系统设置", "安装软件", "关闭安全功能", "发布内容",
    "send email", "delete file", "upload file", "submit form", "payment", "pay", "order", "password", "install software", "system settings", "publish", "terminal", "执行命令", "终端"
  ];
  const DESKTOP_KEYWORDS = [
    "操作电脑", "接管电脑", "桌面助手", "电脑操作", "自动操作", "打开软件", "启动软件", "打开浏览器", "打开 Chrome", "打开 Google Chrome", "启动 Chrome", "打开 Safari", "打开 Finder", "打开 WPS", "打开 WPS Office", "打开备忘录", "打开 Notes", "打开 Preview", "聚焦 Chrome", "聚焦 Safari", "打开 终端", "执行命令",
    "点击", "输入", "复制", "粘贴", "切换窗口", "保存文件", "删除文件", "删除", "发送邮件", "提交表单", "付款", "安装软件", "输入密码",
    "desktop assistant", "control computer", "operate computer", "open Chrome", "open Safari", "open Finder", "open app", "focus app", "click", "type", "paste", "copy", "switch window"
  ];

  function safeStorage(){
    try { return window.localStorage || null; } catch (_) { return null; }
  }

  function safeSessionStorage(){
    try { return window.sessionStorage || null; } catch (_) { return null; }
  }

  function readJson(storage, key, fallback){
    try {
      const raw = storage && storage.getItem(key);
      return raw ? Object.assign({}, fallback || {}, JSON.parse(raw)) : Object.assign({}, fallback || {});
    } catch (_) {
      return Object.assign({}, fallback || {});
    }
  }

  function writeJson(storage, key, value){
    try { if (storage) storage.setItem(key, JSON.stringify(value)); } catch (_) {}
    return value;
  }

  function readRawJson(storage, key, fallback){
    try {
      const raw = storage && storage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function nowIso(){
    return new Date().toISOString();
  }

  function createDesktopTaskId(){
    return "desktopTask-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function sanitizeDesktopAssistantText(value){
    return String(value || "")
      .replace(/(bearer|authorization|api[-_ ]?key|token|password|secret|cookie)\s*[:=]\s*[^,\s;，。]+/gi, "$1=[redacted]")
      .replace(/sk-[A-Za-z0-9._-]+/g, "sk-[redacted]")
      .replace(/\/Users\/[^\s，。；;]+/g, "[local-path]")
      .replace(/[A-Za-z]:\\[^\s，。；;]+/g, "[local-path]")
      .replace(/\s+/g, " ")
      .trim();
  }

  function summarize(value, maxLength){
    const clean = sanitizeDesktopAssistantText(value);
    const max = Number(maxLength || 160);
    return clean.length > max ? clean.slice(0, max).trim() + "..." : clean;
  }

  function getDesktopAssistantSettings(){
    return Object.assign({}, DEFAULT_SETTINGS, readJson(safeStorage(), DESKTOP_ASSISTANT_STORAGE_KEY, DEFAULT_SETTINGS));
  }

  function saveDesktopAssistantSettings(settings){
    const next = Object.assign({}, DEFAULT_SETTINGS, settings || {});
    next.enabled = next.enabled === true;
    next.allowPlanGeneration = next.allowPlanGeneration !== false;
    next.allowKeyboardInput = next.allowKeyboardInput === true;
    next.allowMouseClick = next.allowMouseClick === true;
    next.allowScreenRead = next.allowScreenRead === true;
    next.requireSecondConfirmForHighRisk = next.requireSecondConfirmForHighRisk !== false;
    next.autoStopAfterMinutes = Number(next.autoStopAfterMinutes || 30);
    next.allowRealOpenApp = next.allowRealOpenApp === true;
    return writeJson(safeStorage(), DESKTOP_ASSISTANT_STORAGE_KEY, next);
  }

  function defaultSession(){
    return {
      enabled:false,
      status:"closed",
      startedAt:"",
      stoppedAt:"",
      updatedAt:nowIso(),
      realExecution:false
    };
  }


  function getRealOpenAppEnabled(){
    const settings = getDesktopAssistantSettings();
    const raw = readRawJson(safeStorage(), REAL_OPEN_APP_SETTING_KEY, null);
    return raw === true || settings.allowRealOpenApp === true;
  }

  function setRealOpenAppEnabled(enabled){
    const next = enabled === true;
    const settings = getDesktopAssistantSettings();
    saveDesktopAssistantSettings(Object.assign({}, settings, { allowRealOpenApp:next }));
    writeJson(safeStorage(), REAL_OPEN_APP_SETTING_KEY, next);
    return next;
  }

  function desktopAppById(appId){
    return DESKTOP_APP_WHITELIST[String(appId || "").trim().toLowerCase()] || null;
  }

  function inferDesktopApp(text){
    const clean = String(text || "").toLowerCase();
    const values = Object.keys(DESKTOP_APP_WHITELIST).map((key) => DESKTOP_APP_WHITELIST[key]);
    return values.find((item) => item.aliases.some((alias) => clean.indexOf(String(alias).toLowerCase()) >= 0)) || null;
  }

  function inferDesktopAction(text){
    const clean = String(text || "").toLowerCase();
    if (/聚焦|focus/.test(clean)) return "focusApp";
    if (/打开|open/.test(clean)) return "openApp";
    return "planOnly";
  }

  function isOpenAppStep(step){
    const action = String(step && step.action || "");
    return action === "openApp" || action === "focusApp";
  }

  function markStepPolicy(step){
    const item = Object.assign({}, step || {});
    const riskLevel = item.riskLevel || getRiskLevelForStep(item);
    const appAllowed = !isOpenAppStep(item) || !!desktopAppById(item.appId);
    const blocked = riskLevel === "high" || (isOpenAppStep(item) && !appAllowed);
    const approvalState = blocked ? "blocked" : riskLevel === "medium" ? "needsApproval" : "allowed";
    return Object.assign({}, item, {
      riskLevel:blocked && isOpenAppStep(item) && !appAllowed ? "high" : riskLevel,
      approvalState,
      status:item.status || (blocked ? "blocked" : "queued"),
      realExecution:item.realExecution === true && item.status === "realExecuted",
      outputSummary:item.outputSummary || (isOpenAppStep(item) && !appAllowed ? "该 App 不在白名单，已阻断。当前只允许 Chrome / Safari / Finder / WPS / Notes / Preview。" : riskLevel === "high" ? "该动作属于高风险，已阻断。不会删除、发送、上传、付款、提交表单或输入密码。" : ""),
      requiresSecondConfirm:item.requiresSecondConfirm === true || blocked || riskLevel === "high"
    });
  }

  function canRealOpenApp(step, settings, session){
    const item = markStepPolicy(step || {});
    const currentSettings = Object.assign({}, getDesktopAssistantSettings(), settings || {});
    const currentSession = Object.assign({}, getDesktopAssistantSession(), session || {});
    return currentSettings.enabled === true &&
      currentSettings.allowRealOpenApp === true &&
      currentSession.enabled === true &&
      item.riskLevel === "low" &&
      item.approvalState === "allowed" &&
      isOpenAppStep(item) &&
      !!desktopAppById(item.appId);
  }

  function getRealOpenAppState(step, settings, session){
    const item = markStepPolicy(step || {});
    const currentSettings = Object.assign({}, getDesktopAssistantSettings(), settings || {});
    const currentSession = Object.assign({}, getDesktopAssistantSession(), session || {});
    const app = desktopAppById(item.appId);
    if (!isOpenAppStep(item)) {
      return {
        status:"riskNotAllowed",
        outputSummary:"该步骤不是 openApp / focusApp，保持干跑模拟。",
        canExecute:false,
        realExecution:false
      };
    }
    if (!app) {
      return {
        status:"appNotAllowed",
        outputSummary:"该 App 不在白名单，已阻断。",
        canExecute:false,
        realExecution:false
      };
    }
    if (item.riskLevel !== "low" || item.approvalState !== "allowed") {
      return {
        status:"riskNotAllowed",
        outputSummary:"该步骤不是低风险白名单打开操作，不能真实执行。",
        canExecute:false,
        realExecution:false
      };
    }
    if (currentSession.enabled !== true) {
      return {
        status:"sessionRequired",
        outputSummary:"桌面助手未开启，本次任务只能生成计划。",
        canExecute:false,
        realExecution:false
      };
    }
    if (currentSettings.enabled !== true || currentSettings.allowRealOpenApp !== true) {
      return {
        status:"realOpenDisabled",
        outputSummary:"真实打开白名单 App 当前关闭。",
        canExecute:false,
        realExecution:false
      };
    }
    return {
      status:"realOpenAvailable",
      outputSummary:"可以在用户确认后真实打开白名单 App：" + app.appName,
      canExecute:true,
      appId:app.appId,
      appName:app.appName,
      realExecution:false
    };
  }

  function createRealOpenAppRequest(step){
    const item = markStepPolicy(step || {});
    const app = desktopAppById(item.appId);
    return {
      action:"openWhitelistedApp",
      appId:app ? app.appId : String(item.appId || ""),
      appName:app ? app.appName : summarize(item.appName || "", 80),
      riskLevel:"low",
      realExecution:true
    };
  }

  function markRealOpenAppExecuted(step, result){
    const item = markStepPolicy(step || {});
    const app = desktopAppById(item.appId) || {};
    return Object.assign({}, item, {
      status:"realExecuted",
      lifecycleStatus:"realOpenAppExecuted",
      appId:app.appId || item.appId || "",
      appName:result && result.appName || app.appName || item.appName || "",
      realExecution:true,
      outputSummary:"已真实打开白名单 App：" + (result && result.appName || app.appName || item.appName || item.appId || ""),
      resultStatus:"realOpened",
      safetySummary:"未点击、未输入、未读屏、未截图",
      updatedAt:nowIso()
    });
  }

  function markRealOpenAppFailed(step, result){
    const item = markStepPolicy(step || {});
    return Object.assign({}, item, {
      status:"failed",
      lifecycleStatus:"realOpenAppFailed",
      realExecution:false,
      outputSummary:"打开白名单 App 失败：" + summarize(result && (result.message || result.code) || "系统打开失败", 120),
      resultStatus:"failed",
      safetySummary:"未点击、未输入、未读屏、未截图",
      updatedAt:nowIso()
    });
  }

  function getDesktopAssistantSession(){
    return Object.assign({}, defaultSession(), readJson(safeSessionStorage(), DESKTOP_ASSISTANT_SESSION_KEY, defaultSession()));
  }

  function setDesktopAssistantSession(session){
    const next = Object.assign({}, defaultSession(), session || {}, {
      enabled:(session && session.enabled) === true,
      realExecution:false,
      updatedAt:nowIso()
    });
    return writeJson(safeSessionStorage(), DESKTOP_ASSISTANT_SESSION_KEY, next);
  }

  function toggleDesktopAssistantForSession(enabled){
    const now = nowIso();
    if (enabled) {
      return setDesktopAssistantSession({
        enabled:true,
        status:"enabled_for_session",
        startedAt:now,
        stoppedAt:"",
        realExecution:false
      });
    }
    return stopDesktopAssistantSession();
  }

  function stopDesktopAssistantSession(){
    return setDesktopAssistantSession({
      enabled:false,
      status:"stopped",
      stoppedAt:nowIso(),
      realExecution:false
    });
  }

  function queueSummary(queue){
    const steps = Array.isArray(queue && queue.steps) ? queue.steps : [];
    return {
      stepCount:steps.length,
      simulatedStepCount:steps.filter((step) => step && step.status === "simulated").length,
      blockedStepCount:steps.filter((step) => step && step.status === "blocked").length
    };
  }

  function resultStatusFromPayload(data){
    const status = String(data && (data.resultStatus || data.status || data.lifecycleStatus || data.code) || "");
    if (/realOpenAppExecuted|realExecuted|realOpened/.test(status)) return "realOpened";
    if (/realOpenAppFailed|APP_OPEN_FAILED|failed/.test(status)) return "failed";
    if (/APP_NOT_ALLOWED|blocked|executionBlocked/.test(status)) return "blocked";
    if (/stopped/.test(status)) return "stopped";
    if (/cancelled/.test(status)) return "stopped";
    if (/planned|waitingApproval|queued|simulating/.test(status)) return status;
    if (/simulated|executionSimulated/.test(status)) return "simulated";
    return data && data.realExecution === true ? "realOpened" : "simulated";
  }

  function matchesAny(text, list){
    const raw = String(text || "").toLowerCase();
    return list.filter((item) => raw.indexOf(String(item).toLowerCase()) >= 0);
  }

  function getRiskLevelForStep(step){
    const text = sanitizeDesktopAssistantText(typeof step === "string" ? step : (step && (step.title + " " + step.description)));
    if (matchesAny(text, HIGH_KEYWORDS).length) return "high";
    if (matchesAny(text, MEDIUM_KEYWORDS).length) return "medium";
    return "low";
  }

  function classifyDesktopOperation(text){
    const clean = sanitizeDesktopAssistantText(text);
    const desktopMatches = matchesAny(clean, DESKTOP_KEYWORDS);
    const highMatches = matchesAny(clean, HIGH_KEYWORDS);
    const mediumMatches = matchesAny(clean, MEDIUM_KEYWORDS);
    const lowMatches = matchesAny(clean, LOW_KEYWORDS);
    const riskLevel = highMatches.length ? "high" : mediumMatches.length ? "medium" : "low";
    return {
      isDesktopOperation:desktopMatches.length > 0,
      riskLevel,
      matchedKeywords:desktopMatches.concat(highMatches, mediumMatches, lowMatches).slice(0, 12),
      requiresSecondConfirm:riskLevel === "high",
      realExecution:false
    };
  }

  function step(stepId, title, description, extra){
    const item = Object.assign({
      stepId,
      title:summarize(title, 80),
      description:summarize(description, 180),
      realExecution:false
    }, extra || {});
    item.riskLevel = item.riskLevel || getRiskLevelForStep(item);
    return markStepPolicy(item);
  }

  function inferDesktopSteps(text, riskLevel){
    const clean = summarize(text, 220);
    const app = inferDesktopApp(clean);
    const action = inferDesktopAction(clean);
    const openAppExtra = (action === "openApp" || action === "focusApp") ? { action, appId:app && app.appId || "", appName:app && app.appName || "", riskLevel:app ? "low" : "high" } : {};
    const steps = [
      step("step-1", "确认用户目标", "确认本次只生成桌面操作计划，不控制鼠标、不操作键盘、不读取屏幕。"),
      step("step-2", app ? (action === "focusApp" ? "聚焦白名单 App" : "打开白名单 App") : "定位目标软件或页面", clean || "根据用户指令定位目标应用或页面，等待用户手动确认。", openAppExtra)
    ];
    if (/搜索|search/i.test(clean)) {
      steps.push(step("step-3", "准备搜索词", "把搜索词作为文本计划，不自动打开浏览器，也不自动输入。"));
    } else if (/复制|粘贴|输入/i.test(clean)) {
      steps.push(step("step-3", "准备文本输入", "仅生成输入步骤说明，不真实复制、粘贴或键盘输入。"));
    } else {
      steps.push(step("step-3", "列出后续动作", "把下一步动作拆成可人工确认的步骤。"));
    }
    if (riskLevel === "medium") {
      steps.push(step("step-4", "中风险提醒", "涉及点击、填写、保存、下载或移动，需要用户继续确认。"));
    }
    if (riskLevel === "high") {
      steps.push(step("step-4", "高风险二次确认", "涉及发送、删除、上传、付款、提交、输入密码或系统设置，必须二次确认。"));
    }
    steps.push(step("step-final", "等待用户确认", "本轮不执行电脑操作，realExecution=false。"));
    return steps;
  }

  function highestRisk(steps){
    if ((steps || []).some((item) => item.riskLevel === "high")) return "high";
    if ((steps || []).some((item) => item.riskLevel === "medium")) return "medium";
    return "low";
  }

  function createDesktopOperationPlan(text){
    const classification = classifyDesktopOperation(text);
    const steps = inferDesktopSteps(text, classification.riskLevel);
    const riskLevel = highestRisk(steps);
    const createdAt = nowIso();
    return {
      schemaVersion:SCHEMA_VERSION,
      planId:"desktop-plan-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
      title:summarize(text, 80) || "桌面操作计划",
      inputSummary:summarize(text, 240),
      riskLevel,
      steps,
      stepCount:steps.length,
      requiresSecondConfirm:riskLevel === "high",
      realExecution:false,
      status:"planned",
      lifecycleStatus:"planCreated",
      createdAt,
      updatedAt:createdAt
    };
  }

  function normalizeQueue(queue){
    const now = nowIso();
    const data = queue || {};
    const steps = (Array.isArray(data.steps) ? data.steps : []).map((item, index) => {
      const step = Object.assign({}, item || {});
      const riskLevel = step.riskLevel || getRiskLevelForStep(step);
      return markStepPolicy({
        stepId:step.stepId || "step-" + (index + 1),
        title:summarize(step.title || "桌面助手步骤", 80),
        description:summarize(step.description || "", 180),
        riskLevel,
        action:step.action || "",
        appId:step.appId || "",
        appName:step.appName || "",
        outputSummary:step.outputSummary || "",
        resultStatus:step.resultStatus || "",
        safetySummary:step.safetySummary || "",
        approvalState:step.approvalState || (riskLevel === "high" ? "blocked" : riskLevel === "medium" ? "needsApproval" : "allowed"),
        status:step.status || (riskLevel === "high" ? "blocked" : "queued"),
        realExecution:step.realExecution === true && step.status === "realExecuted",
        requiresSecondConfirm:step.requiresSecondConfirm === true || riskLevel === "high",
        updatedAt:step.updatedAt || now
      });
    });
    const summary = queueSummary({ steps });
    const status = steps.some((step) => step.status === "stopped") ? "stopped" :
      steps.some((step) => step.status === "blocked") && summary.blockedStepCount === steps.length ? "blocked" :
      summary.simulatedStepCount && summary.simulatedStepCount + summary.blockedStepCount === steps.length ? "simulated" :
      data.status || "queued";
    return Object.assign({}, data, summary, {
      schemaVersion:"weishan.desktopAssistant.executionQueue.v1",
      queueId:data.queueId || "desktop-queue-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
      planId:data.planId || "",
      title:summarize(data.title || "桌面助手执行队列", 80),
      inputSummary:summarize(data.inputSummary || "", 240),
      riskLevel:data.riskLevel || highestRisk(steps),
      status,
      steps,
      realExecution:false,
      requiresSecondConfirm:data.requiresSecondConfirm === true || (data.riskLevel || highestRisk(steps)) === "high",
      createdAt:data.createdAt || now,
      updatedAt:now
    });
  }

  function taskStatusFromSteps(steps, fallback){
    const list = Array.isArray(steps) ? steps : [];
    if (list.length && list.every((step) => step && step.status === "stopped")) return "stopped";
    if (list.length && list.every((step) => step && step.status === "blocked")) return "blocked";
    if (list.some((step) => step && step.status === "failed")) return "failed";
    if (list.some((step) => step && step.status === "realExecuted")) return "realOpened";
    if (list.length && list.every((step) => step && (step.status === "simulated" || step.status === "blocked"))) return "simulated";
    return fallback || "planned";
  }

  function normalizeDesktopAssistantTask(task){
    const now = nowIso();
    const data = task || {};
    const steps = (Array.isArray(data.steps) ? data.steps : []).map((item, index) => markStepPolicy(Object.assign({}, item || {}, {
      stepId:item && item.stepId || "step-" + (index + 1),
      title:summarize(item && item.title || "桌面助手步骤", 80),
      description:summarize(item && item.description || "", 180),
      updatedAt:item && item.updatedAt || now
    })));
    const riskLevel = data.riskLevel || highestRisk(steps);
    const summary = queueSummary({ steps });
    const status = data.status === "stopped" || data.status === "cancelled" ? data.status :
      taskStatusFromSteps(steps, data.status || (riskLevel === "high" ? "blocked" : "planned"));
    return Object.assign({}, data, summary, {
      schemaVersion:"weishan.desktopAssistant.task.v1",
      taskId:data.taskId || createDesktopTaskId(),
      planId:data.planId || "",
      title:summarize(data.title || "桌面助手任务", 80),
      inputSummary:summarize(data.inputSummary || data.text || "", 240),
      riskLevel,
      approvalState:data.approvalState || (riskLevel === "high" ? "blocked" : riskLevel === "medium" ? "needsApproval" : "allowed"),
      status,
      steps,
      realExecution:data.realExecution === true && status === "realOpened",
      resultStatus:data.resultStatus || resultStatusFromPayload(Object.assign({}, data, { status })),
      outputSummary:summarize(data.outputSummary || "", 240),
      safetySummary:summarize(data.safetySummary || "未点击、未输入、未读屏、未截图", 120),
      sourceCommandId:data.sourceCommandId || "",
      createdAt:data.createdAt || now,
      updatedAt:data.updatedAt || now
    });
  }

  function createDesktopAssistantTask(plan){
    const data = plan || {};
    const task = normalizeDesktopAssistantTask({
      taskId:data.taskId || "",
      planId:data.planId || "",
      title:data.title || "桌面助手任务",
      inputSummary:data.inputSummary || "",
      riskLevel:data.riskLevel || highestRisk(data.steps || []),
      approvalState:data.approvalState || "",
      status:data.status || ((data.riskLevel || highestRisk(data.steps || [])) === "high" ? "blocked" : "planned"),
      steps:data.steps || [],
      realExecution:false,
      resultStatus:data.resultStatus || "",
      outputSummary:data.outputSummary || "桌面助手任务已创建，等待用户确认。",
      sourceCommandId:data.sourceCommandId || "",
      createdAt:data.createdAt || nowIso()
    });
    return task;
  }

  function getDesktopAssistantTasks(){
    const raw = readRawJson(safeSessionStorage(), DESKTOP_ASSISTANT_TASKS_KEY, []);
    return (Array.isArray(raw) ? raw : []).map(normalizeDesktopAssistantTask)
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }

  function saveDesktopAssistantTasks(tasks){
    const list = (Array.isArray(tasks) ? tasks : []).map(normalizeDesktopAssistantTask)
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    return writeJson(safeSessionStorage(), DESKTOP_ASSISTANT_TASKS_KEY, list);
  }

  function addDesktopAssistantTask(task){
    const next = normalizeDesktopAssistantTask(task || {});
    const tasks = getDesktopAssistantTasks().filter((item) => item.taskId !== next.taskId && (!next.sourceCommandId || item.sourceCommandId !== next.sourceCommandId));
    tasks.unshift(next);
    saveDesktopAssistantTasks(tasks);
    return next;
  }

  function updateDesktopAssistantTask(taskId, patch){
    const id = String(taskId || "");
    let updated = null;
    const tasks = getDesktopAssistantTasks().map((task) => {
      if (task.taskId !== id) return task;
      updated = normalizeDesktopAssistantTask(Object.assign({}, task, patch || {}, { taskId:id, updatedAt:nowIso() }));
      return updated;
    });
    saveDesktopAssistantTasks(tasks);
    return updated;
  }

  function stopDesktopAssistantTask(taskId){
    const current = getDesktopAssistantTasks().find((task) => task.taskId === String(taskId || ""));
    if (!current) return null;
    const steps = (current.steps || []).map((step) => Object.assign({}, step, {
      status:"stopped",
      realExecution:false,
      resultStatus:"stopped",
      outputSummary:step.outputSummary || "该任务已停止。",
      updatedAt:nowIso()
    }));
    return updateDesktopAssistantTask(current.taskId, {
      status:"stopped",
      resultStatus:"stopped",
      outputSummary:"已停止此桌面助手任务，不影响其他任务。",
      realExecution:false,
      steps
    });
  }

  function stopAllDesktopAssistantTasks(){
    stopDesktopAssistantSession();
    const stopped = getDesktopAssistantTasks().map((task) => {
      if (task.status === "stopped" || task.status === "cancelled") return task;
      return normalizeDesktopAssistantTask(Object.assign({}, task, {
        status:"stopped",
        resultStatus:"stopped",
        outputSummary:"全局停止接管，任务已停止。",
        realExecution:false,
        updatedAt:nowIso(),
        steps:(task.steps || []).map((step) => Object.assign({}, step, {
          status:"stopped",
          realExecution:false,
          resultStatus:"stopped",
          updatedAt:nowIso()
        }))
      }));
    });
    return saveDesktopAssistantTasks(stopped);
  }

  function getActiveDesktopAssistantTasks(){
    return getDesktopAssistantTasks().filter((task) => !/stopped|cancelled/.test(String(task.status || "")));
  }

  function createTaskStopHistoryPayload(task){
    const data = normalizeDesktopAssistantTask(task || {});
    return {
      schemaVersion:"weishan.task.v1",
      module:"desktopAssistant",
      action:"taskStopped",
      taskId:data.taskId,
      riskLevel:data.riskLevel,
      status:"stopped",
      resultStatus:"stopped",
      stepCount:Number(data.stepCount || 0),
      inputSummary:summarize(data.inputSummary || "", 240),
      outputSummary:summarize(data.outputSummary || "已停止此桌面助手任务。", 240),
      realExecution:false,
      safetySummary:summarize(data.safetySummary || "未点击、未输入、未读屏、未截图", 120),
      createdAt:data.createdAt || nowIso(),
      updatedAt:data.updatedAt || nowIso()
    };
  }

  function createDesktopExecutionQueue(plan){
    const data = plan || {};
    const queue = normalizeQueue({
      planId:data.planId || "",
      title:data.title || "桌面助手执行队列",
      inputSummary:data.inputSummary || "",
      riskLevel:data.riskLevel || highestRisk(data.steps || []),
      requiresSecondConfirm:data.requiresSecondConfirm === true,
      status:"executionQueued",
      steps:(data.steps || []).map((item) => Object.assign({}, item, {
        status:item.riskLevel === "high" || item.approvalState === "blocked" ? "blocked" : "queued",
        realExecution:false
      })),
      createdAt:nowIso()
    });
    return saveDesktopExecutionQueue(queue);
  }

  function getDesktopExecutionQueue(){
    const raw = readRawJson(safeSessionStorage(), DESKTOP_ASSISTANT_QUEUE_KEY, null);
    return raw ? normalizeQueue(raw) : null;
  }

  function saveDesktopExecutionQueue(queue){
    return writeJson(safeSessionStorage(), DESKTOP_ASSISTANT_QUEUE_KEY, normalizeQueue(queue));
  }

  function clearDesktopExecutionQueue(){
    try {
      const s = safeSessionStorage();
      if (s) s.removeItem(DESKTOP_ASSISTANT_QUEUE_KEY);
    } catch (_) {}
    return null;
  }

  function blockHighRiskStep(step){
    const item = Object.assign({}, step || {});
    return Object.assign({}, item, {
      riskLevel:item.riskLevel || "high",
      status:"blocked",
      realExecution:false,
      requiresSecondConfirm:true,
      outputSummary:item.outputSummary || "该动作属于高风险，已阻断。不会删除、发送、上传、付款、提交表单或输入密码。",
      updatedAt:nowIso()
    });
  }

  function simulateDesktopExecutionStep(step){
    const item = Object.assign({}, step || {});
    if ((item.riskLevel || getRiskLevelForStep(item)) === "high" || item.status === "blocked" || item.approvalState === "blocked") return blockHighRiskStep(item);
    return Object.assign({}, item, {
      status:"simulated",
      realExecution:false,
      outputSummary:item.outputSummary || "模拟执行：simulated。未真实控制电脑。",
      updatedAt:nowIso()
    });
  }

  function simulateDesktopExecutionQueue(queue){
    const current = normalizeQueue(queue || getDesktopExecutionQueue() || {});
    const next = normalizeQueue(Object.assign({}, current, {
      status:"executionSimulated",
      steps:(current.steps || []).map((item) => item.riskLevel === "high" ? blockHighRiskStep(item) : simulateDesktopExecutionStep(item))
    }));
    return saveDesktopExecutionQueue(next);
  }

  function stopDesktopAssistantExecution(){
    stopDesktopAssistantSession();
    const current = getDesktopExecutionQueue();
    if (!current) return null;
    return saveDesktopExecutionQueue(Object.assign({}, current, {
      status:"stopped",
      steps:(current.steps || []).map((item) => Object.assign({}, item, {
        status:item.status === "blocked" ? "blocked" : "stopped",
        realExecution:false,
        updatedAt:nowIso()
      }))
    }));
  }

  function createDesktopPermissionGuide(){
    return {
      schemaVersion:"weishan.desktopAssistant.permissionGuide.v1",
      permissions:[
        { name:"Accessibility", label:"辅助功能 Accessibility", status:"未启用", purpose:"后续真实控制需要" },
        { name:"Screen Recording", label:"屏幕录制 Screen Recording", status:"未启用", purpose:"后续观察屏幕需要" },
        { name:"Automation", label:"自动化 Automation", status:"未启用", purpose:"后续控制 App 需要" },
        { name:"Input Monitoring", label:"输入监控 Input Monitoring", status:"默认不建议开启", purpose:"本轮不使用" }
      ],
      message:"当前版本仅生成操作计划和模拟执行，不申请系统权限，不读取屏幕，不控制鼠标键盘。后续如果启用真实桌面控制，必须由用户在 macOS 系统设置中手动授权。",
      realExecution:false
    };
  }

  function createDesktopAssistantHistoryPayload(action, payload){
    const data = payload || {};
    const steps = Array.isArray(data.steps) ? data.steps : [];
    const riskLevel = data.riskLevel || highestRisk(steps);
    return {
      schemaVersion:"weishan.task.v1",
      module:"desktopAssistant",
      action:String(action || "").replace(/^desktopAssistant\./, "") || "event",
      taskId:summarize(data.taskId || "", 100),
      riskLevel,
      status:summarize(data.status || "", 40),
      stepCount:Number(data.stepCount || steps.length || 0),
      simulatedStepCount:Number(data.simulatedStepCount || 0),
      blockedStepCount:Number(data.blockedStepCount || 0),
      resultStatus:resultStatusFromPayload(data),
      inputSummary:summarize(data.inputSummary || data.text || "", 240),
      outputSummary:summarize(data.outputSummary || data.title || "", 240),
      safetySummary:summarize(data.safetySummary || "未点击、未输入、未读屏、未截图", 120),
      realExecution:false,
      requiresSecondConfirm:data.requiresSecondConfirm === true || riskLevel === "high",
      createdAt:data.createdAt || nowIso(),
      updatedAt:data.updatedAt || nowIso()
    };
  }


  function createRealOpenAppHistoryPayload(action, payload){
    const data = payload || {};
    const app = desktopAppById(data.appId) || {};
    return {
      schemaVersion:"weishan.task.v1",
      module:"desktopAssistant",
      action:String(action || "").replace(/^desktopAssistant./, "") || "realOpenApp",
      appId:app.appId || summarize(data.appId || "", 80),
      appName:app.appName || summarize(data.appName || "", 80),
      actionType:summarize(data.actionType || data.desktopAction || "openApp", 40),
      resultStatus:resultStatusFromPayload(data),
      riskLevel:"low",
      realExecution:data.realExecution === true,
      inputSummary:summarize(data.inputSummary || "打开白名单 App", 240),
      outputSummary:summarize(data.outputSummary || data.message || "桌面助手白名单 App 操作", 240),
      safetySummary:summarize(data.safetySummary || "未点击、未输入、未读屏、未截图", 120),
      createdAt:data.createdAt || nowIso()
    };
  }

  function createDesktopAssistantExecutionHistoryPayload(action, payload){
    const queue = normalizeQueue(payload || {});
    return Object.assign(createDesktopAssistantHistoryPayload(action, queue), queueSummary(queue));
  }

  window.WeishanDesktopAssistant = {
    DESKTOP_ASSISTANT_STORAGE_KEY,
    DESKTOP_ASSISTANT_SESSION_KEY,
    DESKTOP_ASSISTANT_QUEUE_KEY,
    DESKTOP_ASSISTANT_TASKS_KEY,
    REAL_OPEN_APP_SETTING_KEY,
    SCHEMA_VERSION,
    getDesktopAssistantSettings,
    saveDesktopAssistantSettings,
    getRealOpenAppEnabled,
    setRealOpenAppEnabled,
    canRealOpenApp,
    getRealOpenAppState,
    createRealOpenAppRequest,
    markRealOpenAppExecuted,
    markRealOpenAppFailed,
    createRealOpenAppHistoryPayload,
    getDesktopAssistantSession,
    setDesktopAssistantSession,
    toggleDesktopAssistantForSession,
    stopDesktopAssistantSession,
    createDesktopExecutionQueue,
    getDesktopExecutionQueue,
    saveDesktopExecutionQueue,
    clearDesktopExecutionQueue,
    simulateDesktopExecutionStep,
    simulateDesktopExecutionQueue,
    blockHighRiskStep,
    stopDesktopAssistantExecution,
    createDesktopAssistantTask,
    getDesktopAssistantTasks,
    saveDesktopAssistantTasks,
    addDesktopAssistantTask,
    updateDesktopAssistantTask,
    stopDesktopAssistantTask,
    stopAllDesktopAssistantTasks,
    getActiveDesktopAssistantTasks,
    createTaskStopHistoryPayload,
    createDesktopPermissionGuide,
    classifyDesktopOperation,
    createDesktopOperationPlan,
    getRiskLevelForStep,
    sanitizeDesktopAssistantText,
    createDesktopAssistantHistoryPayload,
    createDesktopAssistantExecutionHistoryPayload
  };
})();
