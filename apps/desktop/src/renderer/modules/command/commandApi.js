(function(){
  const QUEUE_KEY = "command.queue.v205";
  const HISTORY_KEY = "command.history.v205";
  const MAX_HISTORY = 80;

  let processing = false;
  const taskPerf = {};

  function createPerfMeta(){
    return window.WeishanPerf && window.WeishanPerf.createPerfMeta ? window.WeishanPerf.createPerfMeta("home.taskDispatch") : { enabled:false, traceId:"", featureAction:"home.taskDispatch" };
  }

  function taskProtocol(){
    return window.WeishanTaskProtocol || null;
  }

  function taskSummary(text, maxLength){
    const tp = taskProtocol();
    return tp && tp.summarizeTextSafe ? tp.summarizeTextSafe(text, maxLength) : String(text || "").replace(/\s+/g, " ").trim().slice(0, maxLength || 160);
  }

  function createHomeTaskRecord(text){
    const tp = taskProtocol();
    if (!tp || !tp.createTaskRecord) return null;
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
      meta:{ inputChars:String(text || "").length }
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
    const item = entry("answer", "AI 已回答：" + String(answer || ""), { streamingAnswer:!!streaming });
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

  function enqueue(text){
    const clean = String(text || "").trim();
    if (!clean) return null;
    const meta = createPerfMeta();
    const startedAt = perfStart(meta, "renderer.action.start", { inputChars:clean.length });
    const record = createHomeTaskRecord(clean);

    const task = Object.assign({}, record || {}, {
      id:(record && record.taskId) || id(),
      text:clean,
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
        entry("queued", "已加入执行队列，等待调度。")
      ]
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
      mail:"邮件接管",
      settings:"设置中心"
    }[target] || target;
  }

  function brainLabel(){
    try {
      const c = window.WeishanAPI && window.WeishanAPI.connector ? window.WeishanAPI.connector() : null;
      if (!c || (!c.baseUrl && !c.chatModel)) return "AI 未配置 · 用户自选模型";
      if (!c.chatModel) return "AI 已保存 · 模型未填写";
      if (c.testStatus === "success") return "AI 已连接 · " + c.chatModel;
      if (c.testStatus === "failed") return "AI 连接失败 · " + c.chatModel;
      return "AI 已保存未测试 · " + c.chatModel;
    } catch (_) {
      return "AI 未配置 · 用户自选模型";
    }
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
        t = attachHomeTextArtifact(t);
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
