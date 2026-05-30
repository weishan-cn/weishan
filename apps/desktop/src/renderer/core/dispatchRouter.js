(function(){
  const DISPATCH_MODULES = {
    mail:"mail",
    crawler:"crawler",
    softwareFactory:"softwareFactory",
    document:"document",
    ppt:"ppt",
    codex:"codex",
    chat:"chat",
    coordination:"coordination"
  };

  const DISPATCH_ACTIONS = {
    mailOpen:"mail.open",
    mailSummarize:"mail.summarize",
    mailDraftReply:"mail.draftReply",
    mailExtractTodos:"mail.extractTodos",
    mailTranslate:"mail.translate",
    crawlerOpen:"crawler.open",
    crawlerWebFetch:"crawler.webFetch",
    softwareFactoryOpen:"softwareFactory.open",
    softwareFactoryGeneratePlan:"softwareFactory.generatePlan",
    documentGenerateDraft:"document.generateDraft",
    pptGenerateOutline:"ppt.generateOutline",
    codexGenerateInstruction:"codex.generateInstruction",
    chatAnswer:"chat.answer",
    coordinationPlan:"coordination.plan"
  };
  const DISPATCH_STATUS = {
    pending:"pending",
    prefilled:"prefilled",
    confirmed:"confirmed",
    executed:"executed",
    failed:"failed",
    cancelled:"cancelled"
  };
  const DISPATCH_HISTORY_ACTIONS = {
    pending:"dispatch.pending",
    confirmed:"dispatch.confirmed",
    executed:"dispatch.executed",
    failed:"dispatch.failed",
    cancelled:"dispatch.cancelled"
  };
  const PENDING_DISPATCH_KEY = "weishan:dispatch:pending:v1";

  const MODULE_KEYWORDS = [
    { module:"mail", keywords:[/邮件|邮箱|收件箱|回复邮件|总结邮件|提取待办|翻译邮件/i, /\b(mail|email|inbox|reply)\b/i] },
    { module:"crawler", keywords:[/抓取|网页|网址|链接|爬取/i, /\b(URL|crawler|fetch|scrape)\b/i, /https?:\/\//i] },
    { module:"softwareFactory", keywords:[/软件|工具|系统|桌面工具|生成软件|软件工厂|应用/i, /\b(software|factory|app)\b/i] },
    { module:"ppt", keywords:[/PPT|幻灯片|演示|路演/i, /\b(slide|slides|presentation|deck)\b/i] },
    { module:"codex", keywords:[/Codex|给\s*Codex|精确指令|开发指令|修复指令|测试指令/i] },
    { module:"document", keywords:[/文档|合同|协议|报告|说明书|计划书|合作协议/i, /\b(memo|document|doc|report|proposal)\b/i] }
  ];

  function redactDispatchText(text){
    return String(text || "")
      .replace(/(bearer|authorization|api[-_ ]?key|token|password|secret|cookie|providerBody|provider body)\s*[:=]\s*[^,\s;]+/gi, "$1=[redacted]")
      .replace(/sk-[A-Za-z0-9._-]+/g, "sk-[redacted]");
  }

  function sanitizeDispatchText(text){
    return redactDispatchText(text)
      .replace(/\s+/g, " ")
      .trim();
  }

  function summarizeDispatchText(text, maxLength){
    const clean = sanitizeDispatchText(text);
    const max = Number(maxLength || 160);
    return clean.length > max ? clean.slice(0, max).trim() + "..." : clean;
  }

  function hasKeyword(text, item){
    return item.keywords.some((pattern) => pattern.test(text));
  }

  function detectModules(text){
    return MODULE_KEYWORDS.filter((item) => hasKeyword(text, item)).map((item) => item.module);
  }

  function extractUrl(text){
    const match = String(text || "").match(/https?:\/\/[^\s，。；,;]+/i);
    return match ? match[0] : "";
  }

  function mailAction(text){
    if (/回复|draft\s*reply/i.test(text)) return DISPATCH_ACTIONS.mailDraftReply;
    if (/待办|todo/i.test(text)) return DISPATCH_ACTIONS.mailExtractTodos;
    if (/翻译|translate/i.test(text)) return DISPATCH_ACTIONS.mailTranslate;
    if (/总结|摘要|summary|summarize/i.test(text)) return DISPATCH_ACTIONS.mailSummarize;
    return DISPATCH_ACTIONS.mailOpen;
  }

  function classifyCommand(text){
    const raw = String(text || "");
    const modules = detectModules(raw);
    const uniqueModules = Array.from(new Set(modules));

    if (uniqueModules.includes("codex") && /给\s*Codex|Codex.*(指令|修复|开发|测试)/i.test(raw)) {
      return {
        module:DISPATCH_MODULES.codex,
        action:DISPATCH_ACTIONS.codexGenerateInstruction,
        routeMode:"console",
        modules:[DISPATCH_MODULES.codex],
        targetRoute:"home",
        confidence:"rule"
      };
    }

    if (uniqueModules.length > 1) {
      return {
        module:DISPATCH_MODULES.coordination,
        action:DISPATCH_ACTIONS.coordinationPlan,
        routeMode:"console",
        modules:uniqueModules,
        confidence:"rule",
        targetRoute:"home"
      };
    }

    const module = uniqueModules[0] || DISPATCH_MODULES.chat;
    if (module === "mail") return { module, action:mailAction(raw), routeMode:"module", modules:[module], targetRoute:"mail", confidence:"rule" };
    if (module === "crawler") return { module, action:extractUrl(raw) ? DISPATCH_ACTIONS.crawlerWebFetch : DISPATCH_ACTIONS.crawlerOpen, routeMode:"module", modules:[module], targetRoute:"crawler", confidence:"rule" };
    if (module === "softwareFactory") return { module, action:DISPATCH_ACTIONS.softwareFactoryGeneratePlan, routeMode:"module", modules:[module], targetRoute:"builder", confidence:"rule" };
    if (module === "document") return { module, action:DISPATCH_ACTIONS.documentGenerateDraft, routeMode:"console", modules:[module], targetRoute:"home", confidence:"rule" };
    if (module === "ppt") return { module, action:DISPATCH_ACTIONS.pptGenerateOutline, routeMode:"console", modules:[module], targetRoute:"home", confidence:"rule" };
    if (module === "codex") return { module, action:DISPATCH_ACTIONS.codexGenerateInstruction, routeMode:"console", modules:[module], targetRoute:"home", confidence:"rule" };
    return { module:DISPATCH_MODULES.chat, action:DISPATCH_ACTIONS.chatAnswer, routeMode:"console", modules:[DISPATCH_MODULES.chat], targetRoute:"home", confidence:"fallback" };
  }

  function createDispatchPlan(text){
    const intent = classifyCommand(text);
    const cleanInput = sanitizeDispatchText(text);
    const title = summarizeDispatchText(cleanInput, 80) || "weishan dispatch task";
    const url = extractUrl(cleanInput);
    const plan = Object.assign({}, intent, {
      schemaVersion:"weishan.dispatch.v1",
      title,
      inputSummary:summarizeDispatchText(cleanInput, 240),
      source:"home",
      url,
      createdAt:new Date().toISOString()
    });
    if (plan.module === DISPATCH_MODULES.coordination) plan.stepQueue = createCoordinationStepQueue(plan.modules, cleanInput);
    return plan;
  }

  function dispatchId(){
    return "dispatch-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function storage(){
    try {
      if (window.sessionStorage) return window.sessionStorage;
    } catch (_) {}
    try {
      if (window.localStorage) return window.localStorage;
    } catch (_) {}
    return null;
  }

  function actionLabel(action){
    const map = {
      "mail.open":"打开邮件接管",
      "mail.summarize":"总结邮件",
      "mail.draftReply":"生成回复草稿",
      "mail.extractTodos":"提取邮件待办",
      "mail.translate":"翻译邮件",
      "crawler.open":"打开抓取中心",
      "crawler.webFetch":"抓取网页",
      "softwareFactory.open":"打开软件工厂",
      "softwareFactory.generatePlan":"生成软件方案",
      "document.generateDraft":"生成文档草稿",
      "ppt.generateOutline":"生成 PPT 大纲",
      "codex.generateInstruction":"生成 Codex 指令",
      "coordination.plan":"生成多模块协调计划"
    };
    return map[action] || action || "调度任务";
  }

  function prefillForPlan(plan, text){
    const summary = summarizeDispatchText(text, 240);
    if (plan.module === "crawler") {
      return {
        url:plan.url || extractUrl(text),
        taskTitle:"抓取中心任务",
        taskDescription:summary,
        draftRequirement:"",
        suggestedAction:actionLabel(plan.action)
      };
    }
    if (plan.module === "softwareFactory") {
      return {
        url:"",
        taskTitle:"软件工厂任务",
        taskDescription:summary,
        draftRequirement:summarizeDispatchText(text, 700),
        suggestedAction:actionLabel(plan.action)
      };
    }
    if (plan.module === "mail") {
      return {
        url:"",
        taskTitle:"邮件接管任务",
        taskDescription:summary,
        draftRequirement:"",
        suggestedAction:actionLabel(plan.action)
      };
    }
    return {
      url:"",
      taskTitle:plan.title || "首页调度任务",
      taskDescription:summary,
      draftRequirement:"",
      suggestedAction:actionLabel(plan.action)
    };
  }

  function createPendingPayload(plan, text){
    const safePlan = plan || {};
    const now = new Date().toISOString();
    return {
      schemaVersion:"weishan.dispatch.pending.v1",
      dispatchId:dispatchId(),
      createdAt:now,
      updatedAt:now,
      source:"home",
      targetModule:safePlan.module || "unknown",
      targetRoute:safePlan.targetRoute || "home",
      action:safePlan.action || "",
      inputSummary:summarizeDispatchText(text, 240),
      prefill:prefillForPlan(safePlan, text),
      status:DISPATCH_STATUS.pending,
      realExecution:false,
      requiresUserConfirmation:true
    };
  }

  function savePendingPayload(payload){
    const s = storage();
    if (!s || !payload) return payload;
    try { s.setItem(PENDING_DISPATCH_KEY, JSON.stringify(payload)); } catch (_) {}
    window.WeishanDispatchPayload = payload;
    return payload;
  }

  function readPendingPayload(targetModule){
    let payload = window.WeishanDispatchPayload || null;
    if (!payload) {
      const s = storage();
      try {
        const raw = s && s.getItem(PENDING_DISPATCH_KEY);
        payload = raw ? JSON.parse(raw) : null;
      } catch (_) {
        payload = null;
      }
    }
    if (!payload || payload.schemaVersion !== "weishan.dispatch.pending.v1") return null;
    if (targetModule && payload.targetModule !== targetModule) return null;
    return payload;
  }

  function clearPendingPayload(dispatchIdValue){
    const current = readPendingPayload();
    if (dispatchIdValue && current && current.dispatchId !== dispatchIdValue) return false;
    const s = storage();
    try { if (s) s.removeItem(PENDING_DISPATCH_KEY); } catch (_) {}
    if (!dispatchIdValue || (window.WeishanDispatchPayload && window.WeishanDispatchPayload.dispatchId === dispatchIdValue)) {
      window.WeishanDispatchPayload = null;
    }
    return true;
  }

  function updatePendingPayload(dispatchIdValue, patch){
    const current = readPendingPayload();
    if (!current || (dispatchIdValue && current.dispatchId !== dispatchIdValue)) return null;
    const next = Object.assign({}, current, patch || {}, {
      dispatchId:current.dispatchId,
      schemaVersion:current.schemaVersion,
      prefill:Object.assign({}, current.prefill || {}, patch && patch.prefill || {}),
      realExecution:patch && Object.prototype.hasOwnProperty.call(patch, "realExecution") ? !!patch.realExecution : false,
      requiresUserConfirmation:patch && Object.prototype.hasOwnProperty.call(patch, "requiresUserConfirmation") ? !!patch.requiresUserConfirmation : true,
      updatedAt:new Date().toISOString()
    });
    savePendingPayload(next);
    return next;
  }

  function createDispatchHistoryPayload(payload, historyAction, extra){
    const data = payload || {};
    const detail = extra || {};
    return {
      schemaVersion:"weishan.task.v1",
      module:"dispatch",
      action:String(historyAction || "").replace(/^dispatch\./, "") || "event",
      status:detail.status || data.status || "",
      dispatchId:data.dispatchId || "",
      targetModule:data.targetModule || "",
      targetRoute:data.targetRoute || "",
      inputSummary:summarizeDispatchText(data.inputSummary || "", 240),
      outputSummary:summarizeDispatchText(detail.outputSummary || "", 240),
      executionMode:summarizeDispatchText(detail.executionMode || "manual_confirmation_only", 120),
      realExecution:detail.realExecution === true,
      createdAt:detail.createdAt || new Date().toISOString()
    };
  }

  function recordDispatchHistory(historyAction, payload, extra){
    if (!window.HistoryApi || typeof window.HistoryApi.record !== "function") return null;
    return window.HistoryApi.record(historyAction, createDispatchHistoryPayload(payload, historyAction, extra));
  }

  function confirmPendingPayload(dispatchIdValue, extra){
    const next = updatePendingPayload(dispatchIdValue, {
      status:DISPATCH_STATUS.confirmed,
      realExecution:false,
      requiresUserConfirmation:true
    });
    if (next) {
      recordDispatchHistory(DISPATCH_HISTORY_ACTIONS.confirmed, next, Object.assign({
        status:DISPATCH_STATUS.confirmed,
        executionMode:"manual_confirmation_only",
        realExecution:false,
        outputSummary:"用户已确认首页调度任务，等待模块内继续执行。"
      }, extra || {}));
    }
    return next;
  }

  function cancelPendingPayload(dispatchIdValue, extra){
    const next = updatePendingPayload(dispatchIdValue, {
      status:DISPATCH_STATUS.cancelled,
      realExecution:false,
      requiresUserConfirmation:true
    });
    if (next) {
      recordDispatchHistory(DISPATCH_HISTORY_ACTIONS.cancelled, next, Object.assign({
        status:DISPATCH_STATUS.cancelled,
        executionMode:"cancelled_by_user",
        realExecution:false,
        outputSummary:"用户已取消首页调度任务。"
      }, extra || {}));
    }
    return next;
  }

  function markPendingExecuted(dispatchIdValue, extra){
    const next = updatePendingPayload(dispatchIdValue, {
      status:DISPATCH_STATUS.executed,
      realExecution:!!(extra && extra.realExecution),
      requiresUserConfirmation:true
    });
    if (next) {
      recordDispatchHistory(DISPATCH_HISTORY_ACTIONS.executed, next, Object.assign({
        status:DISPATCH_STATUS.executed,
        executionMode:"module_confirmed_execution",
        outputSummary:"模块已执行确认后的调度任务。"
      }, extra || {}));
    }
    return next;
  }

  function markPendingFailed(dispatchIdValue, extra){
    const next = updatePendingPayload(dispatchIdValue, {
      status:DISPATCH_STATUS.failed,
      realExecution:false,
      requiresUserConfirmation:true
    });
    if (next) {
      recordDispatchHistory(DISPATCH_HISTORY_ACTIONS.failed, next, Object.assign({
        status:DISPATCH_STATUS.failed,
        executionMode:"module_confirmed_execution",
        realExecution:false,
        outputSummary:"调度任务执行失败。"
      }, extra || {}));
    }
    return next;
  }

  function createCoordinationStepQueue(modules, text){
    return (modules || []).map((module, index) => ({
      stepId:"step-" + (index + 1),
      module,
      action:module === "crawler" ? DISPATCH_ACTIONS.crawlerWebFetch :
        module === "softwareFactory" ? DISPATCH_ACTIONS.softwareFactoryGeneratePlan :
        module === "ppt" ? DISPATCH_ACTIONS.pptGenerateOutline :
        module === "document" ? DISPATCH_ACTIONS.documentGenerateDraft :
        module === "mail" ? DISPATCH_ACTIONS.mailOpen :
        module + ".open",
      status:"planned",
      inputSummary:summarizeDispatchText(text, 180),
      realExecution:false,
      requiresUserConfirmation:true
    }));
  }

  function buildDocumentDraft(text, intent){
    const topic = summarizeDispatchText(text, 120) || "文档";
    return [
      "# 文档草稿",
      "",
      "## 1. 标题",
      topic,
      "",
      "## 2. 背景",
      "本草稿基于首页调度中心的本地规则生成，适合作为后续人工完善的初稿。",
      "",
      "## 3. 目标",
      "- 明确文档目的",
      "- 梳理关键信息",
      "- 形成可继续编辑的结构",
      "",
      "## 4. 主要内容",
      "- 事项概述：" + topic,
      "- 适用对象：待补充",
      "- 关键条款 / 要点：待人工确认",
      "",
      "## 5. 下一步",
      "- 补充具体事实和数据",
      "- 检查法律、财务或业务边界",
      "- 交由相关负责人确认"
    ].join("\n");
  }

  function buildPptOutline(text){
    const topic = summarizeDispatchText(text, 120) || "PPT";
    return [
      "# PPT 大纲",
      "",
      "## 封面",
      "- 标题：" + topic,
      "- 副标题：本地生成的大纲草案",
      "",
      "## 目录",
      "1. 核心问题",
      "2. 目标用户",
      "3. 方案概览",
      "4. 执行步骤",
      "5. 风险与对策",
      "6. 总结",
      "",
      "## 核心问题",
      "- 当前要解决什么问题",
      "- 为什么现在需要解决",
      "",
      "## 方案",
      "- 方案一：本地优先执行",
      "- 方案二：模块化协作",
      "- 方案三：历史记录与产物沉淀",
      "",
      "## 执行步骤",
      "- 明确输入",
      "- 分配模块",
      "- 生成结果",
      "- 验证并沉淀历史",
      "",
      "## 风险与对策",
      "- 信息不足：用待确认问题补齐",
      "- 执行范围过大：拆分阶段",
      "- 数据敏感：只保留安全摘要",
      "",
      "## 总结",
      "- 本大纲为 Markdown 文本产物，不是真实 PPTX。"
    ].join("\n");
  }

  function buildCodexInstruction(text){
    const goal = summarizeDispatchText(text, 180) || "请完成指定代码任务";
    return [
      "# Codex 精确指令",
      "",
      "工作目录：",
      "cd ~/Downloads/weishan-clean-release",
      "",
      "修改目标：",
      goal,
      "",
      "允许修改文件：",
      "- 根据任务相关模块小范围修改",
      "- 优先修改最接近问题的文件",
      "",
      "禁止修改文件：",
      "- 不要修改无关业务页面",
      "- 不要修改 package-lock.json",
      "- 不要写入真实密钥、token、cookie、password",
      "",
      "检查命令：",
      "- npm run verify",
      "- git diff --check",
      "",
      "安全边界：",
      "- 不读取或输出 AI key、prompt、messages、provider body",
      "- 不上传用户文件或源码",
      "",
      "提交要求：",
      "- 不 commit",
      "- 不 push"
    ].join("\n");
  }

  function buildCoordinationPlan(text, modules){
    const clean = summarizeDispatchText(text, 180);
    const queue = createCoordinationStepQueue(modules, text);
    const steps = queue.map((step, index) => (index + 1) + ". " + step.module + "：准备模块任务，等待用户确认后执行。realExecution=false");
    return [
      "# 多模块协调计划",
      "",
      "## 用户目标",
      clean,
      "",
      "## 涉及模块",
      (modules || []).map((module) => "- " + module).join("\n"),
      "",
      "## 执行顺序",
      steps.join("\n"),
      "",
      "## Step Queue",
      queue.map((step) => "- " + step.stepId + " · " + step.module + " · " + step.action + " · " + step.status + " · realExecution=false").join("\n"),
      "",
      "## v1 边界",
      "- 首页仅生成协调计划，不真实跨模块执行。",
      "- 抓取任务不会在首页访问外网。",
      "- PPT / 文档产物为 Markdown 文本，不是真实 PPTX / DOCX。"
    ].join("\n");
  }

  function buildSoftwareFactoryPlan(text){
    const clean = summarizeDispatchText(text, 180);
    return [
      "# 软件工厂调度草案",
      "",
      "## 识别结果",
      "已识别为软件工厂任务。",
      "",
      "## 可复制需求",
      clean,
      "",
      "## 建议下一步",
      "- 打开软件工厂模块",
      "- 粘贴上述需求",
      "- 生成正式软件方案文档",
      "",
      "本调度计划不会直接调用软件工厂业务函数。"
    ].join("\n");
  }

  function buildModuleDispatchPlan(plan, text){
    if (plan.module === "mail") {
      return "已识别为邮件接管任务，可从邮件接管模块继续执行：总结、回复、待办或翻译。本轮首页不直接调用 Mail AI。";
    }
    if (plan.module === "crawler") {
      return [
        "已识别为抓取中心任务。",
        plan.url ? "URL：" + plan.url : "未识别到明确 URL。",
        "请进入抓取中心执行真实抓取；本轮首页不会访问外网。"
      ].join("\n");
    }
    if (plan.module === "softwareFactory") return buildSoftwareFactoryPlan(text);
    return "已生成模块调度计划。";
  }

  function buildLocalAnswer(text){
    return [
      "# 本地回答",
      "",
      "已收到你的问题：",
      summarizeDispatchText(text, 240),
      "",
      "v1 首页调度优先使用本地规则。如果这是普通问答，可继续在已配置 AI 的情况下沿用原 Home chat 逻辑。"
    ].join("\n");
  }

  function resultForPlan(plan, text){
    if (plan.module === "document") return buildDocumentDraft(text, plan);
    if (plan.module === "ppt") return buildPptOutline(text, plan);
    if (plan.module === "codex") return buildCodexInstruction(text, plan);
    if (plan.module === "coordination") return buildCoordinationPlan(text, plan.modules);
    if (plan.module === "softwareFactory" || plan.module === "mail" || plan.module === "crawler") return buildModuleDispatchPlan(plan, text);
    return buildLocalAnswer(text);
  }

  function timestamp(){
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
  }

  function filenameForPlan(plan){
    const ts = timestamp();
    if (plan.module === "document") return "weishan-document-draft-" + ts + ".md";
    if (plan.module === "ppt") return "weishan-ppt-outline-" + ts + ".md";
    if (plan.module === "codex") return "weishan-codex-instruction-" + ts + ".md";
    if (plan.module === "coordination") return "weishan-coordination-plan-" + ts + ".md";
    return "weishan-" + plan.module + "-dispatch-plan-" + ts + ".md";
  }

  function byteSize(text){
    const value = String(text || "");
    try { return new Blob([value]).size; } catch (_) { return value.length; }
  }

  function createDispatchArtifact(plan, result){
    const content = redactDispatchText(result).trim();
    return {
      type:"markdown",
      title:(plan.module === "coordination" ? "多模块协调计划" : plan.module + " dispatch artifact"),
      filename:filenameForPlan(plan),
      mimeType:"text/markdown;charset=utf-8",
      sizeBytes:byteSize(content),
      content,
      meta:{
        kind:"home-dispatch",
        module:plan.module,
        action:plan.action,
        source:"home.dispatchRouter"
      }
    };
  }

  window.WeishanDispatchRouter = {
    DISPATCH_MODULES,
    DISPATCH_ACTIONS,
    DISPATCH_STATUS,
    DISPATCH_HISTORY_ACTIONS,
    classifyCommand,
    createDispatchPlan,
    buildDocumentDraft,
    buildPptOutline,
    buildCodexInstruction,
    buildCoordinationPlan,
    createDispatchArtifact,
    createPendingPayload,
    savePendingPayload,
    readPendingPayload,
    clearPendingPayload,
    updatePendingPayload,
    confirmPendingPayload,
    cancelPendingPayload,
    markPendingExecuted,
    markPendingFailed,
    createDispatchHistoryPayload,
    recordDispatchHistory,
    createCoordinationStepQueue,
    sanitizeDispatchText,
    summarizeDispatchText,
    resultForPlan
  };
})();
