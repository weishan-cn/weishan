(function(){
  const TASK_PROTOCOL_VERSION = "weishan.task.v1";
  const TASK_STATUS = {
    queued:"queued",
    running:"running",
    done:"done",
    failed:"failed",
    canceled:"canceled"
  };
  const TASK_MODULE = {
    home:"home",
    mail:"mail",
    project:"project",
    memory:"memory",
    history:"history",
    crawler:"crawler",
    softwareFactory:"softwareFactory",
    document:"document",
    codex:"codex",
    coordination:"coordination",
    storage:"storage",
    team:"team",
    reports:"reports",
    audit:"audit",
    security:"security",
    customerSupport:"customerSupport",
    writing:"writing",
    ppt:"ppt",
    transcription:"transcription",
    unknown:"unknown"
  };
  const TASK_ROUTE_MODE = {
    console:"console",
    module:"module"
  };

  function nowIso(){
    return new Date().toISOString();
  }

  function safePart(value){
    return String(value || "").replace(/[^a-z0-9._-]+/gi, "").slice(0, 24);
  }

  function createTaskId(prefix){
    const p = safePart(prefix || "task") || "task";
    return p + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function redactSensitive(text){
    return String(text || "")
      .replace(/(bearer|authorization|api[-_ ]?key|token|password|secret|authorizationCode|appPassword)\s*[:=]\s*[^,\s;]+/gi, "$1=[redacted]")
      .replace(/sk-[A-Za-z0-9._-]+/g, "sk-[redacted]");
  }

  function stripAiReasoningArtifacts(text){
    let cleaned = String(text || "").replace(/\r/g, "\n");
    cleaned = cleaned
      .replace(/<\s*think\b[^>]*>[\s\S]*?<\s*\/\s*think\s*>/gi, "")
      .replace(/<\s*reasoning\b[^>]*>[\s\S]*?<\s*\/\s*reasoning\s*>/gi, "")
      .replace(/```(?:think|thinking|reasoning|analysis)[\s\S]*?```/gi, "")
      .replace(/\[think\][\s\S]*?\[\/think\]/gi, "");
    cleaned = cleaned
      .replace(/<\s*think\b[^>]*>[\s\S]*$/gi, "")
      .replace(/<\s*reasoning\b[^>]*>[\s\S]*$/gi, "")
      .replace(/```(?:think|thinking|reasoning|analysis)[\s\S]*$/gi, "")
      .replace(/\[think\][\s\S]*$/gi, "");

    const metaLine = /^\s*(I\s+(?:will|would|should|must|need to|am going to|can|cannot|can't|won't|don't)\b|The\s+user\b|The\s+email\b|Let\s+me\b|First,|We\s+should\b|So,\s*should\s+I\b|Tone:|Output format:|Analysis:|Reasoning:|No analysis|No reasoning|No markdown|Just the draft)/i;
    const lines = cleaned.split("\n");
    const kept = [];
    let hasStarted = false;
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!hasStarted) {
        if (!trimmed || metaLine.test(trimmed)) return;
        hasStarted = true;
      }
      kept.push(line);
    });
    return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  function summarizeTextSafe(text, maxLength){
    const raw = stripAiReasoningArtifacts(text);
    if (/(bearer|authorization|api[-_ ]?key|token|password|secret|authorizationCode|appPassword)/i.test(raw)) return "[redacted]";
    const compact = redactSensitive(raw).replace(/\s+/g, " ").trim();
    const max = Number(maxLength || 160);
    return compact.length > max ? compact.slice(0, max).trim() + "..." : compact;
  }

  function actor(input){
    return Object.assign({ type:"user", id:"local-user", label:"Local User" }, input || {});
  }

  function createTaskRecord(input){
    const data = input || {};
    const createdAt = data.createdAt || nowIso();
    const moduleId = data.module || TASK_MODULE.unknown;
    const taskId = data.taskId || createTaskId("task");
    return {
      schemaVersion:TASK_PROTOCOL_VERSION,
      taskId,
      parentTaskId:data.parentTaskId || null,
      module:moduleId,
      action:data.action || "unknown",
      routeMode:data.routeMode || TASK_ROUTE_MODE.console,
      title:summarizeTextSafe(data.title || data.inputSummary || "", 80),
      inputSummary:summarizeTextSafe(data.inputSummary || data.title || "", 240),
      outputSummary:summarizeTextSafe(data.outputSummary || "", 240),
      status:data.status || TASK_STATUS.queued,
      priority:data.priority || "normal",
      createdAt,
      queuedAt:data.queuedAt || createdAt,
      startedAt:data.startedAt || "",
      finishedAt:data.finishedAt || "",
      updatedAt:data.updatedAt || createdAt,
      actor:actor(data.actor),
      executor:Object.assign({ type:"ai", id:"", label:"" }, data.executor || {}),
      source:Object.assign({ type:"console", module:TASK_MODULE.home }, data.source || {}),
      target:Object.assign({ type:"console", module:moduleId }, data.target || {}),
      artifacts:Array.isArray(data.artifacts) ? data.artifacts.slice() : [],
      history:Array.isArray(data.history) ? data.history.slice() : [],
      audit:Array.isArray(data.audit) ? data.audit.slice() : [],
      error:data.error || null,
      meta:Object.assign({}, data.meta || {})
    };
  }

  function normalizeTaskRecord(record){
    const old = record || {};
    const base = createTaskRecord({
      taskId:old.taskId || old.id,
      parentTaskId:old.parentTaskId || null,
      module:old.module || TASK_MODULE.home,
      action:old.action || "taskDispatch",
      routeMode:old.routeMode || TASK_ROUTE_MODE.console,
      title:old.title || old.text || old.inputSummary || "",
      inputSummary:old.inputSummary || old.text || old.title || "",
      outputSummary:old.outputSummary || old.answer || "",
      status:old.status || TASK_STATUS.queued,
      priority:old.priority || "normal",
      createdAt:old.createdAt,
      queuedAt:old.queuedAt || old.createdAt,
      startedAt:old.startedAt,
      finishedAt:old.finishedAt,
      updatedAt:old.updatedAt || old.finishedAt || old.startedAt || old.createdAt,
      actor:old.actor,
      executor:old.executor,
      source:old.source,
      target:old.target,
      artifacts:old.artifacts,
      history:old.history,
      audit:old.audit,
      error:old.error,
      meta:old.meta
    });
    return Object.assign({}, base, old, {
      schemaVersion:old.schemaVersion || TASK_PROTOCOL_VERSION,
      taskId:old.taskId || old.id || base.taskId,
      id:old.id || old.taskId || base.taskId
    });
  }

  function transitionTaskStatus(task, nextStatus, extra){
    const now = nowIso();
    const current = normalizeTaskRecord(task);
    const patch = extra || {};
    const next = Object.assign({}, current, patch, {
      status:nextStatus,
      updatedAt:now
    });
    if (nextStatus === TASK_STATUS.running && !next.startedAt) next.startedAt = now;
    if (nextStatus === TASK_STATUS.done || nextStatus === TASK_STATUS.failed || nextStatus === TASK_STATUS.canceled) next.finishedAt = next.finishedAt || now;
    if (nextStatus === TASK_STATUS.failed && patch.error) next.error = patch.error;
    return next;
  }

  function appendTaskAudit(task, event){
    const current = normalizeTaskRecord(task);
    const item = event || {};
    const audit = Array.isArray(current.audit) ? current.audit.slice() : [];
    audit.push({
      eventId:item.eventId || createTaskId("audit"),
      type:item.type || "event",
      message:summarizeTextSafe(item.message || "", 240),
      createdAt:item.createdAt || nowIso(),
      actor:actor(item.actor),
      meta:Object.assign({}, item.meta || {})
    });
    return Object.assign({}, current, { audit, updatedAt:nowIso() });
  }

  function addTaskArtifact(task, artifact){
    const current = normalizeTaskRecord(task);
    const item = artifact || {};
    const artifacts = Array.isArray(current.artifacts) ? current.artifacts.slice() : [];
    artifacts.push({
      artifactId:item.artifactId || createTaskId("artifact"),
      taskId:item.taskId || current.taskId || "",
      type:item.type || "file",
      title:summarizeTextSafe(item.title || "Artifact", 120),
      filename:item.filename || "",
      mimeType:item.mimeType || "",
      sizeBytes:Number(item.sizeBytes || 0),
      path:item.path || "",
      content:typeof item.content === "string" ? item.content : "",
      createdAt:item.createdAt || nowIso(),
      meta:Object.assign({}, item.meta || {})
    });
    return Object.assign({}, current, { artifacts, updatedAt:nowIso() });
  }

  function createHistoryEntry(task, payload){
    const current = normalizeTaskRecord(task);
    const data = payload || {};
    return {
      historyId:data.historyId || createTaskId("history"),
      taskId:current.taskId,
      module:current.module,
      action:current.action,
      status:current.status,
      title:current.title,
      inputSummary:current.inputSummary,
      outputSummary:current.outputSummary,
      createdAt:current.createdAt,
      startedAt:current.startedAt,
      finishedAt:current.finishedAt,
      artifactIds:(current.artifacts || []).map((x) => x.artifactId).filter(Boolean),
      meta:Object.assign({}, data.meta || {})
    };
  }

  window.WeishanTaskProtocol = {
    TASK_PROTOCOL_VERSION,
    TASK_STATUS,
    TASK_MODULE,
    TASK_ROUTE_MODE,
    createTaskId,
    nowIso,
    createTaskRecord,
    normalizeTaskRecord,
    transitionTaskStatus,
    appendTaskAudit,
    addTaskArtifact,
    createHistoryEntry,
    stripAiReasoningArtifacts,
    summarizeTextSafe
  };
})();
