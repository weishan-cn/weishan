(function(){
  if (!window.WeishanDispatchRouter && typeof document !== "undefined" && document.currentScript && document.write) {
    document.write('<scr' + 'ipt src="./renderer/core/dispatchRouter.js?v=2.0.7"></scr' + 'ipt>');
  }
  if (!window.WeishanDesktopAssistant && typeof document !== "undefined" && document.currentScript && document.write) {
    document.write('<scr' + 'ipt src="./renderer/core/desktopAssistant.js?v=2.0.7"></scr' + 'ipt>');
  }

  const QUEUE_KEY = "command.queue.v205";
  const HISTORY_KEY = "command.history.v205";
  const MAX_HISTORY = 80;
  const AI_GATEWAY_BASE = "http://127.0.0.1:8787";

  let processing = false;
  const taskPerf = {};

  function createPerfMeta(){
    return window.WeishanPerf && window.WeishanPerf.createPerfMeta ? window.WeishanPerf.createPerfMeta("home.taskDispatch") : { enabled:false, traceId:"", featureAction:"home.taskDispatch" };
  }

  function taskProtocol(){
    return window.WeishanTaskProtocol || null;
  }

  function dispatchRouter(){
    return window.WeishanDispatchRouter || null;
  }

  function desktopAssistant(){
    return window.WeishanDesktopAssistant || null;
  }

  function saveDispatchPrefill(text, plan){
    const router = dispatchRouter();
    if (!router || !router.createPendingPayload || !router.savePendingPayload || !plan) return null;
    if (plan.routeMode !== "module") return null;
    const payload = router.createPendingPayload(plan, text);
    router.savePendingPayload(payload);
    return payload;
  }

  function taskSummary(text, maxLength){
    const tp = taskProtocol();
    return tp && tp.summarizeTextSafe ? tp.summarizeTextSafe(text, maxLength) : String(text || "").replace(/\s+/g, " ").trim().slice(0, maxLength || 160);
  }

  function normalizeAttachments(items){
    return (Array.isArray(items) ? items : []).slice(0, 8).map((item) => ({
      attachmentId:String(item && item.attachmentId || "").slice(0, 80),
      name:taskSummary(item && item.name || "attachment", 120),
      type:taskSummary(item && item.type || "file", 80),
      size:Number(item && item.size || 0)
    })).filter((item) => item.name);
  }

  function attachmentMeta(attachments){
    const safe = normalizeAttachments(attachments);
    return {
      attachmentCount:safe.length,
      attachmentNames:safe.map((item) => item.name),
      attachmentTypes:safe.map((item) => item.type),
      attachments:safe
    };
  }

  function createHomeTaskRecord(text, attachments){
    const tp = taskProtocol();
    if (!tp || !tp.createTaskRecord) return null;
    const files = attachmentMeta(attachments);
    return tp.createTaskRecord({
      module:"home",
      action:"taskDispatch",
      routeMode:"console",
      title:taskSummary(text, 80),
      inputSummary:taskSummary(text, 240),
      status:"queued",
      executor:{ type:"ai", id:"home.command", label:"Home Command Center" },
      source:{ type:"console", module:"home" },
      target:{ type:"console", module:"home" },
      meta:Object.assign({ inputChars:String(text || "").length }, files)
    });
  }

  function normalizeTask(task){
    const tp = taskProtocol();
    return tp && tp.normalizeTaskRecord ? tp.normalizeTaskRecord(task) : task;
  }

  function transitionTask(task, status, extra){
    const tp = taskProtocol();
    return tp && tp.transitionTaskStatus ? tp.transitionTaskStatus(task, status, extra || {}) : Object.assign({}, task || {}, extra || {}, { status, updatedAt:nowIso() });
  }

  function redactArtifactContent(text){
    return String(text || "")
      .replace(/(bearer|authorization|api[-_ ]?key|token|password|secret|authorizationCode|appPassword)\s*[:=]\s*[^,\s;]+/gi, "$1=[redacted]")
      .replace(/sk-[A-Za-z0-9._-]+/g, "sk-[redacted]");
  }

  function artifactContentFromAnswer(answer, fallbackSummary){
    const tp = taskProtocol();
    const stripped = tp && tp.stripAiReasoningArtifacts ? tp.stripAiReasoningArtifacts(answer) : String(answer || "");
    const clean = redactArtifactContent(stripped);
    if (clean.trim()) return clean;
    return redactArtifactContent(fallbackSummary || taskSummary(answer, 240));
  }

  function artifactFilename(dateLike){
    const d = dateLike ? new Date(dateLike) : new Date();
    const valid = Number.isNaN(d.getTime()) ? new Date() : d;
    const pad = (n) => String(n).padStart(2, "0");
    return "weishan-home-task-" +
      valid.getFullYear() +
      pad(valid.getMonth() + 1) +
      pad(valid.getDate()) + "-" +
      pad(valid.getHours()) +
      pad(valid.getMinutes()) +
      pad(valid.getSeconds()) +
      ".txt";
  }

  function textSizeBytes(text){
    const content = String(text || "");
    try { return new Blob([content]).size; } catch (_) { return content.length; }
  }

  function attachHomeTextArtifact(task){
    const tp = taskProtocol();
    if (!tp || !tp.addTaskArtifact || !task || task.route !== "ai.chat" || task.status !== "done") return task;
    const content = artifactContentFromAnswer(task.answer || "", task.outputSummary || "");
    if (!content.trim()) return task;
    const artifacts = Array.isArray(task.artifacts) ? task.artifacts : [];
    if (artifacts.some(a => a && a.type === "text" && a.meta && a.meta.kind === "home-ai-output")) return task;
    return tp.addTaskArtifact(task, {
      taskId:task.taskId || task.id || "",
      type:"text",
      title:taskSummary(task.title || task.inputSummary || task.text || "Home task result", 120),
      filename:artifactFilename(task.finishedAt || task.updatedAt || task.createdAt),
      mimeType:"text/plain;charset=utf-8",
      sizeBytes:textSizeBytes(content),
      content,
      meta:{ kind:"home-ai-output", source:"home.taskDispatch" }
    });
  }

  function attachDispatchArtifact(task, plan, answer){
    const tp = taskProtocol();
    const router = dispatchRouter();
    if (!tp || !tp.addTaskArtifact || !router || !router.createDispatchArtifact || !task || task.status !== "done") return task;
    const artifacts = Array.isArray(task.artifacts) ? task.artifacts : [];
    if (artifacts.some(a => a && a.meta && a.meta.kind === "home-dispatch")) return task;
    const artifact = router.createDispatchArtifact(plan, answer);
    return tp.addTaskArtifact(task, Object.assign({}, artifact, {
      taskId:task.taskId || task.id || ""
    }));
  }

  function recordHomeDispatchAction(plan, inputText, answer){
    if (!window.HistoryApi || typeof window.HistoryApi.record !== "function" || !plan) return null;
    const type = plan.action === "model.status" ? "model.statusViewed" :
      plan.action === "model.select" ? "model.selected" :
      plan.action === "chat.answer" ? "chat.answered" : "";
    if (!type) return null;
    const payload = {
      schemaVersion:"weishan.task.v1",
      module:plan.module === "model" ? "model" : "chat",
      action:type.replace(/^(model|chat)\./, ""),
      selectedModelId:plan.selectedModelId || "",
      selectedModelName:"",
      inputSummary:taskSummary(inputText, 240),
      outputSummary:taskSummary(answer, 240),
      executionMode:"mock_safe",
      realExecution:false,
      createdAt:nowIso()
    };
    const router = dispatchRouter();
    if (router && router.modelById) {
      const model = router.modelById(plan.selectedModelId || (router.selectedModelId && router.selectedModelId()));
      if (model) payload.selectedModelName = model.name;
    }
    return window.HistoryApi.record(type, payload);
  }

  function recordChatHistory(type, inputText, answer, extra){
    if (!window.HistoryApi || typeof window.HistoryApi.record !== "function") return null;
    const detail = extra || {};
    return window.HistoryApi.record(type, {
      schemaVersion:"weishan.task.v1",
      module:"chat",
      action:String(type || "chat.event").replace(/^chat\./, ""),
      selectedModelId:detail.selectedModelId || "",
      selectedModelName:detail.selectedModelName || "",
      inputSummary:taskSummary(inputText, 240),
      outputSummary:taskSummary(answer, 240),
      provider:detail.provider || "",
      model:detail.model || "",
      executionMode:detail.executionMode || "gateway_required",
      realExecution:detail.realExecution === true,
      createdAt:nowIso()
    });
  }

  function recordDesktopAssistantHistory(type, plan, extra){
    const api = desktopAssistant();
    if (!api || !api.createDesktopAssistantHistoryPayload || !window.HistoryApi || typeof window.HistoryApi.record !== "function") return null;
    const detail = Object.assign({}, plan && plan.desktopOperationPlan || {}, extra || {});
    return window.HistoryApi.record(type, api.createDesktopAssistantHistoryPayload(type, detail));
  }

  function desktopAssistantAnswer(text, plan){
    const api = desktopAssistant();
    if (!api || !api.createDesktopOperationPlan) {
      return {
        answer:"桌面助手权限框架尚未加载。本轮不会控制电脑。realExecution=false",
        operationPlan:null,
        session:{ enabled:false }
      };
    }
    const operationPlan = plan && plan.desktopOperationPlan || api.createDesktopOperationPlan(text);
    const session = api.getDesktopAssistantSession ? api.getDesktopAssistantSession() : { enabled:false };
    const enabled = session && session.enabled === true;
    const riskLabel = operationPlan.riskLevel === "high" ? "高风险" : operationPlan.riskLevel === "medium" ? "中风险" : "普通提示";
    const lines = [
      "# 桌面操作计划",
      "",
      "任务：" + operationPlan.title,
      "桌面助手：" + (enabled ? "本次开启" : "关闭"),
      "风险等级：" + riskLabel,
      "requiresSecondConfirm=" + (operationPlan.requiresSecondConfirm ? "true" : "false"),
      "realExecution=false",
      "",
      enabled ? "当前仅生成操作计划，点击“确认计划”也只记录 confirmed，不会执行电脑操作。" : "桌面助手当前关闭。请点击“本次开启”后再确认计划。",
      "",
      "## 计划步骤"
    ];
    operationPlan.steps.forEach((step, index) => {
      lines.push((index + 1) + ". [" + step.riskLevel + "] " + step.title + " - " + step.description + " · realExecution=false");
    });
    lines.push("");
    if (operationPlan.riskLevel === "high") {
      lines.push("高风险操作必须二次确认。本轮不会删除文件、发送邮件、上传文件、付款、提交表单、输入密码、安装软件或修改系统设置。");
    } else {
      lines.push("本轮不申请系统权限、不读取屏幕、不控制鼠标键盘。");
    }
    return { answer:lines.join("\n"), operationPlan, session };
  }

  function isRealtimeQuestion(text){
    const raw = String(text || "");
    return /实时|当前|现在.*(天气|气温|航班|火车|票价|价格|汇率|股价|政策|限行)|今天.*(天气|气温|航班|火车|票价|价格|汇率|股价|政策|限行)|准确票价|当前航班状态|实时股价|实时汇率|实时天气/i.test(raw);
  }

  function settingsAiStatus(){
    const api = window.WeishanAPI || null;
    if (!api || typeof api.connector !== "function") {
      return { connected:false, provider:"", model:"", label:"AI 未接通", connector:null };
    }
    const connector = api.connector() || {};
    const status = typeof api.connectorStatus === "function" ? api.connectorStatus(connector) : "";
    const provider = connector.providerType || connector.provider || "model_gateway";
    const model = connector.chatModel || "";
    return {
      connected:status === "success",
      provider,
      model,
      label:status === "success" ? "AI 已连接 · " + provider + (model ? " / " + model : "") : "AI 未接通",
      connector
    };
  }

  async function aiGatewayStatus(){
    try {
      const res = await fetch(AI_GATEWAY_BASE + "/api/ai/status", { cache:"no-store" });
      const data = await res.json();
      return {
        ok:!!(data && data.ok),
        configured:!!(data && data.configured),
        provider:String(data && data.provider || "model_gateway"),
        model:data && data.model || null,
        supportsSearch:!!(data && data.supportsSearch),
        message:String(data && data.message || "")
      };
    } catch (_) {
      return {
        ok:false,
        configured:false,
        provider:"model_gateway",
        model:null,
        supportsSearch:false,
        message:"AI gateway status is unavailable."
      };
    }
  }

  function selectedModel(){
    const router = dispatchRouter();
    if (!router || !router.modelById) return null;
    const idValue = router.selectedModelId ? router.selectedModelId() : "weishan-auto";
    return router.modelById(idValue);
  }

  function unavailableAnswer(text, status){
    const realtime = isRealtimeQuestion(text);
    const reason = realtime && !(status && status.supportsSearch)
      ? "这个问题需要实时信息或联网搜索能力。当前 AI 网关未启用联网搜索，我不能给出可靠实时结果。"
      : "AI 网关未接通，无法可靠回答。";
    return [
      reason,
      "",
      "你仍可继续使用本地调度能力：",
      "- 文档草稿",
      "- PPT 大纲",
      "- Codex 指令",
      "- 邮件接管",
      "- 抓取中心",
      "- 软件工厂",
      "- coordination step queue",
      "",
      "客户端不保存 provider key，也不会把完整 prompt/messages/provider body 写入 History。"
    ].join("\n");
  }

  async function answerChatWithGateway(text, meta, onDelta){
    const settingsStatus = settingsAiStatus();
    const model = selectedModel();
    if (settingsStatus.connected && window.WeishanAPI && typeof window.WeishanAPI.chat === "function") {
      recordChatHistory("chat.aiRequested", text, "已请求设置中心 AI 服务回答。", {
        selectedModelId:model && model.id || "",
        selectedModelName:model && model.name || "",
        provider:settingsStatus.provider,
        model:settingsStatus.model,
        executionMode:"settings_ai_gateway_requested",
        realExecution:true
      });
      try {
        const res = await window.WeishanAPI.chat([{ role:"user", content:String(text || "") }], {
          __perf:meta && meta.enabled ? meta : undefined
        });
        if (res && res.ok) {
          const answer = String(res.content || res.answer || "");
          if (typeof onDelta === "function") onDelta(answer);
          recordChatHistory("chat.answered", text, answer, {
            selectedModelId:model && model.id || "",
            selectedModelName:model && model.name || "",
            provider:settingsStatus.provider,
            model:settingsStatus.model,
            executionMode:"settings_ai_gateway",
            realExecution:true
          });
          return answer || "AI 已返回空内容。";
        }
        const answer = String(res && (res.error || res.message) || "AI 调用失败，请检查设置中心 AI 配置。");
        recordChatHistory("chat.unavailable", text, answer, {
          selectedModelId:model && model.id || "",
          selectedModelName:model && model.name || "",
          provider:settingsStatus.provider,
          model:settingsStatus.model,
          executionMode:"settings_ai_gateway_failed",
          realExecution:false
        });
        return answer;
      } catch (_) {
        const answer = "AI 调用失败，请检查设置中心 AI 配置。";
        recordChatHistory("chat.unavailable", text, answer, {
          selectedModelId:model && model.id || "",
          selectedModelName:model && model.name || "",
          provider:settingsStatus.provider,
          model:settingsStatus.model,
          executionMode:"settings_ai_gateway_failed",
          realExecution:false
        });
        return answer;
      }
    }

    const status = await aiGatewayStatus();
    recordChatHistory("chat.aiRequested", text, "已请求 AI 网关回答。", {
      selectedModelId:model && model.id || "",
      selectedModelName:model && model.name || "",
      provider:status.provider || "model_gateway",
      model:status.model || "",
      executionMode:"gateway_requested",
      realExecution:true
    });

    try {
      const res = await fetch(AI_GATEWAY_BASE + "/api/ai/chat", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          input:String(text || ""),
          selectedModelId:model && model.id || "",
          realtime:isRealtimeQuestion(text),
          stream:false
        })
      });
      const data = await res.json();
      if (!res.ok || !data || !data.ok) {
        const answer = unavailableAnswer(text, Object.assign({}, status, {
          message:String(data && data.message || status.message || "")
        }));
        recordChatHistory("chat.unavailable", text, answer, {
          selectedModelId:model && model.id || "",
          selectedModelName:model && model.name || "",
          provider:data && data.provider || status.provider || "model_gateway",
          model:data && data.model || status.model || "",
          executionMode:"gateway_unavailable",
          realExecution:false
        });
        return answer;
      }
      const answer = String(data.answer || data.content || data.message || "");
      if (typeof onDelta === "function") onDelta(answer);
      recordChatHistory("chat.answered", text, answer, {
        selectedModelId:model && model.id || "",
        selectedModelName:model && model.name || "",
        provider:data.provider || status.provider || "model_gateway",
        model:data.model || status.model || "",
        executionMode:"gateway",
        realExecution:true
      });
      return answer || "AI 网关已返回空内容。";
    } catch (_) {
      const answer = unavailableAnswer(text, status);
      recordChatHistory("chat.unavailable", text, answer, {
        selectedModelId:model && model.id || "",
        selectedModelName:model && model.name || "",
        provider:status.provider || "model_gateway",
        model:status.model || "",
        executionMode:"gateway_unavailable",
        realExecution:false
      });
      return answer;
    }
  }

  function perfStart(meta, stage, extra){
    return window.WeishanPerf && meta && meta.enabled ? window.WeishanPerf.perfStart(meta.traceId, meta.featureAction, stage, extra || {}) : 0;
  }

  function perfEnd(meta, stage, startedAt, extra){
    if (window.WeishanPerf && meta && meta.enabled) window.WeishanPerf.perfEnd(meta.traceId, meta.featureAction, stage, startedAt, extra || {});
  }

  function perfError(meta, stage, startedAt, err, extra){
    if (!window.WeishanPerf || !meta || !meta.enabled) return;
    window.WeishanPerf.perfEnd(meta.traceId, meta.featureAction, stage, startedAt, Object.assign({}, extra || {}, window.WeishanPerf.safeError ? window.WeishanPerf.safeError(err) : { errorName:"Error" }));
  }

  function nowIso(){
    return new Date().toISOString();
  }

  function timeLabel(dateLike){
    const d = dateLike ? new Date(dateLike) : new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  }

  function id(){
    return "cmd-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function read(key, fallback){
    return window.WeishanStore && window.WeishanStore.read ? window.WeishanStore.read(key, fallback) : fallback;
  }

  function write(key, value){
    if (window.WeishanStore && window.WeishanStore.write) return window.WeishanStore.write(key, value);
    return value;
  }

  function queue(){
    return read(QUEUE_KEY, []);
  }

  function history(){
    return read(HISTORY_KEY, []);
  }

  function saveQueue(items){
    write(QUEUE_KEY, items || []);
    emit();
    return items || [];
  }

  function taskKey(task, idx){
    return String(task && (task.taskId || task.id || task.createdAt || task.finishedAt || task.updatedAt) || idx || "");
  }

  function saveHistory(items){
    const seen = {};
    const unique = [];
    (items || []).forEach((task, idx) => {
      const key = taskKey(task, idx);
      if (!key || seen[key]) return;
      seen[key] = true;
      unique.push(task && task.schemaVersion ? normalizeTask(task) : task);
    });
    write(HISTORY_KEY, unique.slice(0, MAX_HISTORY));
    emit();
  }

  function appendHistoryRecordForTask(task){
    if (!task || !window.HistoryApi || typeof window.HistoryApi.record !== "function") return null;
    const normalized = normalizeTask(task);
    const payload = {
      schemaVersion:normalized.schemaVersion || "weishan.task.v1",
      taskId:normalized.taskId || normalized.id || "",
      module:normalized.module || "home",
      action:normalized.action || "taskDispatch",
      status:normalized.status || "",
      createdAt:normalized.createdAt || "",
      startedAt:normalized.startedAt || "",
      finishedAt:normalized.finishedAt || "",
      inputSummary:taskSummary(normalized.inputSummary || normalized.text || "", 240),
      outputSummary:taskSummary(normalized.outputSummary || normalized.answer || "", 240)
    };
    const meta = normalized.meta || {};
    if (Number(meta.attachmentCount || 0) > 0) {
      payload.attachmentCount = Number(meta.attachmentCount || 0);
      payload.attachmentNames = Array.isArray(meta.attachmentNames) ? meta.attachmentNames.map((name) => taskSummary(name, 120)) : [];
      payload.attachmentTypes = Array.isArray(meta.attachmentTypes) ? meta.attachmentTypes.map((type) => taskSummary(type, 80)) : [];
    }
    if (Array.isArray(normalized.artifacts) && normalized.artifacts.length) {
      payload.artifacts = normalized.artifacts.map((artifact) => ({
        artifactId:artifact && artifact.artifactId || "",
        taskId:artifact && artifact.taskId || normalized.taskId || normalized.id || "",
        type:artifact && artifact.type || "",
        title:taskSummary(artifact && artifact.title || "Artifact", 120),
        filename:artifact && artifact.filename || "",
        mimeType:artifact && artifact.mimeType || "",
        sizeBytes:Number(artifact && artifact.sizeBytes || 0),
        createdAt:artifact && artifact.createdAt || "",
        content:typeof (artifact && artifact.content) === "string" ? artifact.content : "",
        meta:Object.assign({}, artifact && artifact.meta || {})
      }));
    }
    if (normalized.status === "failed" || normalized.error) {
      payload.error = {
        name:normalized.error && normalized.error.name || "Error",
        message:taskSummary(normalized.error && normalized.error.message || normalized.answer || "", 240)
      };
    }
    return window.HistoryApi.record("command.execute", payload);
  }

  function emit(){
    window.dispatchEvent(new CustomEvent("weishan:command"));
  }

  function entry(type, text, extra){
    return Object.assign({
      time: nowIso(),
      type: type || "info",
      text: text || ""
    }, extra || {});
  }

  function addLog(task, type, text, extra){
    const next = Object.assign({}, task);
    next.logs = Array.isArray(next.logs) ? next.logs.slice() : [];
    next.logs.push(entry(type, text, extra));
    next.updatedAt = nowIso();
    return next;
  }

  function putAnswerLog(task, answer, streaming){
    const next = Object.assign({}, task);
    const logs = Array.isArray(next.logs) ? next.logs.slice() : [];
    const idx = logs.findIndex((log) => log && log.streamingAnswer);
    const item = entry("answer", "回答结果：" + String(answer || ""), { streamingAnswer:!!streaming });
    if (idx >= 0) logs[idx] = item;
    else logs.push(item);
    next.logs = logs;
    next.answer = String(answer || "");
    next.updatedAt = nowIso();
    return next;
  }

  function patchTask(taskId, patcher){
    const items = queue();
    let patched = null;
    const next = items.map((task) => {
      if (task.id !== taskId) return task;
      patched = patcher(Object.assign({}, task));
      return patched;
    });
    saveQueue(next);
    return patched;
  }

  function enqueue(text, options){
    const clean = String(text || "").trim();
    if (!clean) return null;
    const attachments = normalizeAttachments(options && options.attachments);
    const files = attachmentMeta(attachments);
    const meta = createPerfMeta();
    const startedAt = perfStart(meta, "renderer.action.start", { inputChars:clean.length });
    const record = createHomeTaskRecord(clean, attachments);

    const task = Object.assign({}, record || {}, {
      id:(record && record.taskId) || id(),
      text:clean,
      attachments,
      status:"queued",
      route:"pending",
      answer:"",
      createdAt:(record && record.createdAt) || nowIso(),
      queuedAt:(record && record.queuedAt) || nowIso(),
      startedAt:"",
      finishedAt:"",
      updatedAt:(record && record.updatedAt) || nowIso(),
      logs:[
        entry("received", "收到指令：" + clean),
        files.attachmentCount ? entry("attachment", "已挂载附件 metadata：" + files.attachmentNames.join(", ") + "；未读取完整内容，未上传云。") : null,
        entry("queued", "已加入执行队列，等待调度。")
      ].filter(Boolean)
    });

    const items = queue();
    items.push(task);
    taskPerf[task.id] = meta;
    saveQueue(items);
    processQueue();
    perfEnd(meta, "renderer.action.done", startedAt, { inputChars:clean.length });
    return task;
  }

  function clearFinished(){
    saveQueue(queue().filter((x) => x.status === "queued" || x.status === "running"));
  }

  function clearAll(){
    saveQueue([]);
  }

  function classify(text){
    const t = String(text || "").trim();

    if (/^(今天|今日)?(星期几|周几)\??$/.test(t) || /今天.*(星期|周几)/.test(t)) {
      return { route:"local.time", label:"本地时间模块", action:"weekday" };
    }

    if (/^(现在|当前)?(几点|时间)\??$/.test(t) || /现在.*几点/.test(t)) {
      return { route:"local.time", label:"本地时间模块", action:"time" };
    }

    if (/^(今天|今日)?(日期|几号)\??$/.test(t) || /今天.*(几号|日期)/.test(t)) {
      return { route:"local.time", label:"本地时间模块", action:"date" };
    }

    if (isCalculation(t)) {
      return { route:"local.calc", label:"本地计算模块", action:"calculate" };
    }

    if (/^(打开|进入|去|切到|跳到).*(邮箱|邮件接管)/.test(t)) {
      return { route:"route.mail", label:"目录调度模块", action:"open", target:"mail" };
    }
    if (/^(打开|进入|去|切到|跳到).*(设置|设置中心)/.test(t)) {
      return { route:"route.settings", label:"目录调度模块", action:"open", target:"settings" };
    }
    if (/^(打开|进入|去|切到|跳到).*(记忆|记忆大脑)/.test(t)) {
      return { route:"route.memory", label:"目录调度模块", action:"open", target:"memory" };
    }
    if (/^(打开|进入|去|切到|跳到).*(项目|项目管理)/.test(t)) {
      return { route:"route.projects", label:"目录调度模块", action:"open", target:"projects" };
    }
    if (/^(打开|进入|去|切到|跳到).*(历史|历史记录)/.test(t)) {
      return { route:"route.history", label:"目录调度模块", action:"open", target:"history" };
    }

    if (/^(记住|保存|记录|帮我记住|帮我保存|加入记忆|存到记忆)/.test(t) || /(记到|保存到|写入).*(记忆|记忆大脑)/.test(t)) {
      return { route:"memory.save", label:"记忆模块", action:"saveMemory" };
    }

    const router = dispatchRouter();
    if (router && typeof router.createDispatchPlan === "function") {
      const plan = router.createDispatchPlan(t);
      if (plan && plan.module) {
        return {
          route:"dispatch." + plan.module,
          label:"首页调度中心",
          action:plan.action,
          target:plan.targetRoute || "home",
          dispatchPlan:plan
        };
      }
    }

    return { route:"ai.chat", label:"AI 大脑", action:"chat" };
  }

  function isCalculation(t){
    const x = String(t || "").trim();
    if (!x) return false;
    if (!/^[0-9+\-*/().%=\s×÷]+$/.test(x)) return false;
    return /[+\-*/×÷]/.test(x);
  }

  function calculate(text){
    const expr = String(text || "").replace(/=/g, "").replace(/×/g, "*").replace(/÷/g, "/").trim();
    if (!/^[0-9+\-*/().%\s]+$/.test(expr)) throw new Error("算式包含不支持的字符。");
    const value = Function('"use strict"; return (' + expr + ')')();
    if (typeof value !== "number" || !isFinite(value)) throw new Error("算式结果无效。");
    return String(value);
  }

  function weekdayAnswer(){
    const names = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    return "今天是" + names[new Date().getDay()] + "。";
  }

  function timeAnswer(){
    return "现在是 " + timeLabel() + "。";
  }

  function dateAnswer(){
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return "今天是 " + d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "。";
  }

  function cleanMemoryText(text){
    return String(text || "")
      .replace(/^(记住|保存|记录|帮我记住|帮我保存|加入记忆|存到记忆)[：:\s]*/,"")
      .replace(/(记到|保存到|写入).*(记忆|记忆大脑)[：:\s]*/,"")
      .trim();
  }

  async function saveMemory(text){
    const content = cleanMemoryText(text) || text;
    if (window.MemoryApi && typeof window.MemoryApi.saveMemory === "function") {
      window.MemoryApi.saveMemory(content);
      return "已记录到记忆大脑：" + content;
    }
    if (window.MemoryApi && typeof window.MemoryApi.save === "function") {
      window.MemoryApi.save(content);
      return "已记录到记忆大脑：" + content;
    }

    const list = read("memory.items", []);
    list.unshift({ id:id(), text:content, createdAt:nowIso(), source:"command-center" });
    write("memory.items", list.slice(0, 200));
    return "已记录到记忆大脑：" + content;
  }

  function openRoute(target){
    if (window.WeishanRouter && typeof window.WeishanRouter.setRoute === "function") {
      window.WeishanRouter.setRoute(target);
      return "已打开：" + routeName(target);
    }
    if (window.WeishanRouter && typeof window.WeishanRouter.go === "function") {
      window.WeishanRouter.go(target);
      return "已打开：" + routeName(target);
    }
    if (window.WeishanRouter && typeof window.WeishanRouter.navigate === "function") {
      window.WeishanRouter.navigate(target);
      return "已打开：" + routeName(target);
    }
    throw new Error("路由不可用，无法打开：" + routeName(target));
  }

  function routeName(target){
    return {
      home:"首页",
      projects:"项目管理",
      memory:"记忆大脑",
      history:"历史记录",
      crawler:"抓取中心",
      builder:"软件工厂",
      mail:"邮件接管",
      settings:"设置中心"
    }[target] || target;
  }

  function executeDispatchPlan(text, plan){
    const router = dispatchRouter();
    if (!router || typeof router.resultForPlan !== "function") {
      return "首页调度中心尚未加载，请稍后重试。";
    }
    return router.resultForPlan(plan, text);
  }

  function brainLabel(){
    return settingsAiStatus().label;
  }

  function aiErrorMessage(res){
    const raw = String((res && (res.error || res.message)) || "未知错误").trim();
    if (/provider Terms Of Service|prohibited|provider route|violation/i.test(raw)) {
      return "兼容 AI endpoint 已连接，但当前模型提供方拒绝了这次请求：" + raw;
    }
    return raw;
  }

  function preferredLanguage(text){
    const sample = String(text || "");
    const zh = (sample.match(/[\u3400-\u9fff]/g) || []).length;
    const en = (sample.match(/[A-Za-z]/g) || []).length;
    if (zh >= 2 && zh >= en / 2) return "Chinese";
    if (en > zh * 2) return "English";
    return window.I18n && window.I18n.getLang && window.I18n.getLang() === "en" ? "English" : "Chinese";
  }

  function homeMessages(text){
    const language = preferredLanguage(text);
    return [
      { role:"system", content:[
        "你是 weishan 首页总调度助手。",
        "Reply in the same language as the user's latest command. If the user writes Chinese, answer in Chinese. If the user writes English, answer in English.",
        "The detected response language for this request is: " + language + ".",
        "Do not invent facts, locations, company history, customers, dates, amounts, financial numbers, market size, or external data.",
        "Do not claim you searched the web or found external sources.",
        "If details are missing, use clear placeholders, assumptions, or ask a concise follow-up instead of making facts up.",
        "For document requests, create a usable draft based only on the user's input and known local product context.",
        "Known weishan context: local-first workspace, module isolation, Settings AI connector, Secure Storage, Mail handoff, Home command center, Projects, Memory, History, Crawler, Software Factory, Storage, Team, Reports, Audit, Security, Backup, with A/B mode reserved for personal and enterprise AI access.",
        "Keep answers useful and structured. Do not be a search-results page. Do not pretend to execute actions that were not executed."
      ].join("\n") },
      { role:"user", content:text }
    ];
  }

  async function aiChat(text, meta, onDelta){
    if (!window.WeishanAPI || typeof window.WeishanAPI.chat !== "function") {
      throw new Error("AI 大脑未接入。请到设置中心配置接口地址、AI Key 和模型。");
    }

    const messages = homeMessages(text);
    const canStream = typeof window.WeishanAPI.chatStream === "function";
    let res;
    if (canStream) {
      const streamStartedAt = perfStart(meta, "renderer.stream.start", { inputChars:String(text || "").length });
      res = await window.WeishanAPI.chatStream(messages, {
        __perf:meta,
        onDelta:typeof onDelta === "function" ? onDelta : null
      });
      perfEnd(meta, "renderer.stream.done", streamStartedAt, { inputChars:String(text || "").length, outputChars:String(res && res.content || "").length });
    } else {
      res = await window.WeishanAPI.chat(messages, { __perf:meta });
    }

    if (!res || !res.ok) {
      throw new Error("AI 大脑调用失败：" + aiErrorMessage(res));
    }
    return res.content || "AI 已返回空内容。";
  }

  async function runTask(task){
    const meta = taskPerf[task.id] || createPerfMeta();
    let active = patchTask(task.id, (t) => {
      t = transitionTask(t, "running");
      return addLog(t, "running", "开始执行。");
    });

    const routeStartedAt = perfStart(meta, "renderer.prepare.start", { inputChars:String(active.text || "").length });
    const intent = classify(active.text);
    perfEnd(meta, "renderer.prepare.done", routeStartedAt, { inputChars:String(active.text || "").length });
    active = patchTask(active.id, (t) => {
      t.route = intent.route;
      if (intent.dispatchPlan) {
        t.module = intent.dispatchPlan.module;
        t.action = intent.dispatchPlan.action;
        t.routeMode = intent.dispatchPlan.routeMode || "console";
        t.target = { type:intent.dispatchPlan.routeMode === "module" ? "module" : "console", module:intent.dispatchPlan.module };
        t.meta = Object.assign({}, t.meta || {}, {
          dispatchModule:intent.dispatchPlan.module,
          dispatchAction:intent.dispatchPlan.action,
          dispatchTargetRoute:intent.dispatchPlan.targetRoute || "home",
          desktopRiskLevel:intent.dispatchPlan.riskLevel || "",
          desktopRequiresSecondConfirm:intent.dispatchPlan.requiresSecondConfirm === true
        });
      }
      return addLog(t, "route", "路由判断：" + intent.label);
    });

    let answer = "";
    try {
      if (intent.route === "local.time") {
        if (intent.action === "weekday") answer = weekdayAnswer();
        else if (intent.action === "time") answer = timeAnswer();
        else answer = dateAnswer();

        active = patchTask(active.id, (t) => addLog(t, "local", "本地回答：" + answer));
      } else if (intent.route === "local.calc") {
        answer = calculate(active.text);
        active = patchTask(active.id, (t) => addLog(t, "local", "本地计算结果：" + answer));
      } else if (intent.route.indexOf("route.") === 0) {
        answer = openRoute(intent.target);
        active = patchTask(active.id, (t) => addLog(t, "dispatch", answer));
      } else if (intent.route === "memory.save") {
        answer = await saveMemory(active.text);
        active = patchTask(active.id, (t) => addLog(t, "memory", answer));
      } else if (intent.route.indexOf("dispatch.") === 0) {
        const plan = intent.dispatchPlan || {};
        if (plan.module === "chat") {
          active = patchTask(active.id, (t) => addLog(t, "ai", "准备调用 AI 网关：" + brainLabel()));
          const aiStartedAt = perfStart(meta, "renderer.ai.gateway.start", { inputChars:String(active.text || "").length });
          answer = await answerChatWithGateway(active.text, meta);
          perfEnd(meta, "renderer.ai.gateway.done", aiStartedAt, { inputChars:String(active.text || "").length, outputChars:String(answer || "").length });
          active = patchTask(active.id, (t) => putAnswerLog(t, answer, false));
        } else if (plan.module === "desktopAssistant") {
          const desktopResult = desktopAssistantAnswer(active.text, plan);
          answer = desktopResult.answer;
          const operationPlan = desktopResult.operationPlan;
          recordDesktopAssistantHistory("desktopAssistant.planCreated", plan, Object.assign({}, operationPlan || {}, {
            inputSummary:taskSummary(active.text, 240),
            outputSummary:operationPlan ? "已生成桌面操作计划：" + operationPlan.riskLevel + "，" + operationPlan.stepCount + " 步。" : "桌面助手计划模块未加载。",
            realExecution:false
          }));
          active = patchTask(active.id, (t) => {
            t.meta = Object.assign({}, t.meta || {}, {
              desktopPlanId:operationPlan && operationPlan.planId || "",
              desktopRiskLevel:operationPlan && operationPlan.riskLevel || "low",
              desktopRequiresSecondConfirm:operationPlan && operationPlan.requiresSecondConfirm === true,
              desktopStepCount:operationPlan && operationPlan.stepCount || 0,
              realExecution:false
            });
            return putAnswerLog(t, answer, false);
          });
        } else {
          answer = executeDispatchPlan(active.text, plan);
        }
        if (plan.module !== "chat") recordHomeDispatchAction(plan, active.text, answer);
        const pendingPayload = saveDispatchPrefill(active.text, plan);
        if (pendingPayload && pendingPayload.targetRoute && pendingPayload.targetRoute !== "home") {
          answer += "\n\n调度预填已准备：" + pendingPayload.targetModule + " / " + pendingPayload.action + "。";
          answer += "\nrealExecution=false；requiresUserConfirmation=true。";
          answer += "\n正在打开：" + routeName(pendingPayload.targetRoute) + "。";
          setTimeout(function(){
            try { openRoute(pendingPayload.targetRoute); } catch (_) {}
          }, 0);
        }
        active = patchTask(active.id, (t) => {
          t = addLog(t, "dispatch", "已生成调度计划：" + (plan.module || "unknown") + " / " + (plan.action || "unknown"));
          if (pendingPayload) t = addLog(t, "dispatch", "已写入模块预填参数：" + pendingPayload.targetRoute + "，realExecution=false。");
          return putAnswerLog(t, answer, false);
        });
      } else {
        active = patchTask(active.id, (t) => addLog(t, "ai", "调用 AI 大脑：" + brainLabel()));
        const aiStartedAt = perfStart(meta, "renderer.ai.call.start", { inputChars:String(active.text || "").length });
        let streamedAnswer = "";
        let flushTimer = 0;
        let flushStartedAt = 0;
        const flushStream = (force) => {
          if (flushTimer) {
            clearTimeout(flushTimer);
            flushTimer = 0;
          }
          if (!streamedAnswer) return;
          if (!flushStartedAt) flushStartedAt = perfStart(meta, "renderer.stream.ui.flush.start", { outputChars:streamedAnswer.length });
          active = patchTask(active.id, (t) => putAnswerLog(t, streamedAnswer, !force));
          perfEnd(meta, "renderer.stream.ui.flush.done", flushStartedAt, { outputChars:streamedAnswer.length });
          flushStartedAt = 0;
        };
        const scheduleFlush = () => {
          if (flushTimer) return;
          flushTimer = setTimeout(() => flushStream(false), 120);
        };
        try {
          answer = await aiChat(active.text, meta, (delta) => {
            streamedAnswer += String(delta || "");
            scheduleFlush();
          });
          flushStream(true);
          perfEnd(meta, "renderer.ai.call.done", aiStartedAt, { inputChars:String(active.text || "").length, outputChars:String(answer || "").length });
        } catch (err) {
          if (flushTimer) clearTimeout(flushTimer);
          perfError(meta, "renderer.ai.call.error", aiStartedAt, err, { inputChars:String(active.text || "").length });
          throw err;
        }
        active = patchTask(active.id, (t) => putAnswerLog(t, answer, false));
      }

      active = patchTask(active.id, (t) => {
        t = transitionTask(t, "done", { outputSummary:taskSummary(answer, 240) });
        t.answer = answer;
        if (intent.route.indexOf("dispatch.") === 0) t = attachDispatchArtifact(t, intent.dispatchPlan || {}, answer);
        else t = attachHomeTextArtifact(t);
        return addLog(t, "done", "状态：已完成。");
      });
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      active = patchTask(active.id, (t) => {
        t = transitionTask(t, "failed", {
          outputSummary:taskSummary("执行失败：" + msg, 240),
          error:{
            name:err && err.name || "Error",
            message:taskSummary(msg, 240)
          }
        });
        t.answer = "执行失败：" + msg;
        return addLog(t, "error", "执行失败：" + msg);
      });
    }

    const finalTask = queue().find((x) => x.id === task.id);
    if (finalTask) {
      const historyStartedAt = perfStart(meta, "renderer.history.write.start", { outputChars:String(finalTask.answer || "").length });
      const h = history();
      h.unshift(finalTask);
      saveHistory(h);
      appendHistoryRecordForTask(finalTask);
      perfEnd(meta, "renderer.history.write.done", historyStartedAt, { outputChars:String(finalTask.answer || "").length });
      delete taskPerf[task.id];
    }
  }

  async function processQueue(){
    if (processing) return;
    processing = true;

    try {
      while (true) {
        const next = queue().find((x) => x.status === "queued");
        if (!next) break;
        await runTask(next);
      }
    } finally {
      processing = false;
      emit();
    }
  }

  function snapshot(){
    return {
      queue:queue(),
      history:history(),
      processing,
      brain:brainLabel()
    };
  }

  window.CommandApi = {
    enqueue,
    processQueue,
    clearFinished,
    clearAll,
    classify,
    snapshot,
    timeLabel,
    brainLabel
  };
})();
