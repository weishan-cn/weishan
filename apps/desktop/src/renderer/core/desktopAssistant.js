(function(){
  const DESKTOP_ASSISTANT_STORAGE_KEY = "weishan:desktopAssistant:v1";
  const DESKTOP_ASSISTANT_SESSION_KEY = "weishan:desktopAssistant:session:v1";
  const SCHEMA_VERSION = "weishan.desktopAssistant.v1";

  const DEFAULT_SETTINGS = {
    enabled:false,
    allowPlanGeneration:true,
    allowKeyboardInput:false,
    allowMouseClick:false,
    allowScreenRead:false,
    requireSecondConfirmForHighRisk:true,
    autoStopAfterMinutes:30
  };

  const LOW_KEYWORDS = [
    "打开应用", "打开软件", "打开浏览器", "打开 Chrome", "打开 Finder", "切换窗口", "复制文本", "粘贴文本", "输入搜索词", "查看页面",
    "open app", "open browser", "switch window", "copy text", "paste text", "search"
  ];
  const MEDIUM_KEYWORDS = [
    "点击按钮", "点击", "填写表单", "保存文件", "下载文件", "移动文件", "修改文档内容",
    "click", "fill form", "save file", "download file", "move file", "edit document"
  ];
  const HIGH_KEYWORDS = [
    "发送邮件", "删除文件", "删除", "上传文件", "提交表单", "付款", "下单", "输入密码", "修改系统设置", "安装软件", "关闭安全功能", "发布内容",
    "send email", "delete file", "upload file", "submit form", "payment", "pay", "order", "password", "install software", "system settings", "publish"
  ];
  const DESKTOP_KEYWORDS = [
    "操作电脑", "接管电脑", "桌面助手", "电脑操作", "自动操作", "打开软件", "打开浏览器", "打开 Chrome", "打开 Finder", "打开 WPS",
    "点击", "输入", "复制", "粘贴", "切换窗口", "保存文件", "删除文件", "删除", "发送邮件", "提交表单", "付款", "安装软件", "输入密码",
    "desktop assistant", "control computer", "operate computer", "open Chrome", "click", "type", "paste", "copy", "switch window"
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

  function nowIso(){
    return new Date().toISOString();
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

  function step(stepId, title, description){
    const item = {
      stepId,
      title:summarize(title, 80),
      description:summarize(description, 180),
      realExecution:false
    };
    item.riskLevel = getRiskLevelForStep(item);
    item.requiresSecondConfirm = item.riskLevel === "high";
    return item;
  }

  function inferDesktopSteps(text, riskLevel){
    const clean = summarize(text, 220);
    const steps = [
      step("step-1", "确认用户目标", "确认本次只生成桌面操作计划，不控制鼠标、不操作键盘、不读取屏幕。"),
      step("step-2", "定位目标软件或页面", clean || "根据用户指令定位目标应用或页面，等待用户手动确认。")
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
      createdAt,
      updatedAt:createdAt
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
      riskLevel,
      stepCount:Number(data.stepCount || steps.length || 0),
      inputSummary:summarize(data.inputSummary || data.text || "", 240),
      outputSummary:summarize(data.outputSummary || data.title || "", 240),
      realExecution:false,
      requiresSecondConfirm:data.requiresSecondConfirm === true || riskLevel === "high",
      createdAt:data.createdAt || nowIso(),
      updatedAt:data.updatedAt || nowIso()
    };
  }

  window.WeishanDesktopAssistant = {
    DESKTOP_ASSISTANT_STORAGE_KEY,
    DESKTOP_ASSISTANT_SESSION_KEY,
    SCHEMA_VERSION,
    getDesktopAssistantSettings,
    saveDesktopAssistantSettings,
    getDesktopAssistantSession,
    setDesktopAssistantSession,
    toggleDesktopAssistantForSession,
    stopDesktopAssistantSession,
    classifyDesktopOperation,
    createDesktopOperationPlan,
    getRiskLevelForStep,
    sanitizeDesktopAssistantText,
    createDesktopAssistantHistoryPayload
  };
})();
