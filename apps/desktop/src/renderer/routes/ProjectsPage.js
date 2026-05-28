(function(){
  const PROJECT_TASK_KEY = "weishan:projects:v1";
  const STATUS_OPTIONS = ["待办", "进行中", "已完成", "失败"];
  const PRIORITY_OPTIONS = ["低", "中", "高"];

  function esc(s){ return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function t(key){ return window.I18n.t(key); }
  function isEn(){ return window.I18n && window.I18n.getLang && window.I18n.getLang() === "en"; }
  function label(zh, en){ return isEn() ? en : zh; }
  function nowIso(){ return new Date().toISOString(); }
  function localTime(value){
    const d = value ? new Date(value) : new Date();
    const valid = Number.isNaN(d.getTime()) ? new Date() : d;
    const pad = (n) => String(n).padStart(2, "0");
    return valid.getFullYear() + "/" + pad(valid.getMonth() + 1) + "/" + pad(valid.getDate()) + " " + pad(valid.getHours()) + ":" + pad(valid.getMinutes()) + ":" + pad(valid.getSeconds());
  }
  function taskProtocol(){ return window.WeishanTaskProtocol || null; }
  function summarize(text, maxLength){
    const tp = taskProtocol();
    return tp && tp.summarizeTextSafe ? tp.summarizeTextSafe(text, maxLength) : String(text || "").replace(/\s+/g, " ").trim().slice(0, maxLength || 160);
  }
  function readTasks(){
    try {
      const raw = window.localStorage.getItem(PROJECT_TASK_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }
  function writeTasks(items){
    window.localStorage.setItem(PROJECT_TASK_KEY, JSON.stringify(Array.isArray(items) ? items : []));
  }
  function createProjectTaskId(){
    return "project-task-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }
  function protocolStatus(status){
    if (status === "已完成") return "done";
    if (status === "失败") return "failed";
    if (status === "进行中") return "running";
    return "queued";
  }
  function createTaskRecord(task, action, oldStatus){
    const tp = taskProtocol();
    const status = protocolStatus(task.status);
    const base = tp && tp.createTaskRecord ? tp.createTaskRecord({
      module:"project",
      action,
      routeMode:"module",
      title:task.title,
      inputSummary:task.description,
      outputSummary:action === "updateTask" ? "状态从 " + (oldStatus || "") + " 更新为 " + task.status : "创建项目任务：" + task.title,
      status,
      source:{ type:"module", module:"project" },
      target:{ type:"module", module:"project" },
      executor:{ type:"system", id:"project.local", label:"Project Local" },
      meta:{ projectTaskId:task.projectTaskId, priority:task.priority }
    }) : {
      schemaVersion:"weishan.task.v1",
      taskId:"task-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
      module:"project",
      action,
      routeMode:"module",
      title:task.title,
      inputSummary:summarize(task.description, 240),
      outputSummary:summarize(action === "updateTask" ? "状态从 " + (oldStatus || "") + " 更新为 " + task.status : "创建项目任务：" + task.title, 240),
      status,
      createdAt:nowIso(),
      startedAt:"",
      finishedAt:"",
      artifacts:[]
    };
    const started = tp && tp.transitionTaskStatus ? tp.transitionTaskStatus(base, "running") : Object.assign({}, base, { status:"running", startedAt:nowIso() });
    return tp && tp.transitionTaskStatus ? tp.transitionTaskStatus(started, status, { outputSummary:base.outputSummary }) : Object.assign({}, started, { status, finishedAt:nowIso(), outputSummary:base.outputSummary });
  }
  function historyPayload(record, task, action, oldStatus, artifacts){
    return {
      schemaVersion:record.schemaVersion || "weishan.task.v1",
      taskId:record.taskId,
      module:"project",
      action,
      status:record.status,
      createdAt:record.createdAt || task.createdAt || "",
      startedAt:record.startedAt || "",
      finishedAt:record.finishedAt || "",
      inputSummary:summarize(task.description || task.title, 240),
      outputSummary:summarize(record.outputSummary || "", 240),
      projectTaskId:task.projectTaskId,
      title:task.title,
      priority:task.priority,
      oldStatus:oldStatus || "",
      newStatus:task.status,
      artifacts:Array.isArray(artifacts) ? artifacts : [],
      error:record.error || null
    };
  }
  function recordHistory(type, payload){
    if (window.HistoryApi && typeof window.HistoryApi.record === "function") window.HistoryApi.record(type, payload);
  }
  function filename(dateLike){
    const d = dateLike ? new Date(dateLike) : new Date();
    const valid = Number.isNaN(d.getTime()) ? new Date() : d;
    const pad = (n) => String(n).padStart(2, "0");
    return "weishan-project-tasks-" + valid.getFullYear() + pad(valid.getMonth() + 1) + pad(valid.getDate()) + "-" + pad(valid.getHours()) + pad(valid.getMinutes()) + pad(valid.getSeconds()) + ".md";
  }
  function textSize(text){ try { return new Blob([String(text || "")]).size; } catch (_) { return String(text || "").length; } }
  function countBy(items, field){
    return items.reduce((acc, item) => {
      const key = item[field] || label("未设置", "Unset");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }
  function linesForCounts(title, counts){
    const rows = Object.keys(counts).sort().map(key => "- " + key + "：" + counts[key]);
    return [title].concat(rows.length ? rows : ["- 无"]).join("\n");
  }
  function buildTaskListContent(items){
    return [
      "# 项目任务清单",
      "",
      "生成时间：" + localTime(),
      "任务总数：" + items.length,
      "",
      linesForCounts("按状态统计：", countBy(items, "status")),
      "",
      linesForCounts("按优先级统计：", countBy(items, "priority")),
      "",
      "## 任务列表",
      items.map((item, index) => [
        "### " + (index + 1) + ". " + item.title,
        "- 状态：" + item.status,
        "- 优先级：" + item.priority,
        "- 创建时间：" + localTime(item.createdAt),
        "- 更新时间：" + localTime(item.updatedAt),
        item.finishedAt ? "- 完成时间：" + localTime(item.finishedAt) : "",
        "- 说明：" + (item.description || "无")
      ].filter(Boolean).join("\n")).join("\n\n") || "暂无任务。"
    ].join("\n");
  }
  function createArtifact(content, taskRecord){
    const tp = taskProtocol();
    const artifact = {
      taskId:taskRecord && taskRecord.taskId || "",
      type:"markdown",
      title:"项目任务清单",
      filename:filename(),
      mimeType:"text/markdown;charset=utf-8",
      sizeBytes:textSize(content),
      content,
      meta:{ kind:"project-task-list", source:"project.exportTasks" }
    };
    if (!tp || !tp.addTaskArtifact) return artifact;
    const next = tp.addTaskArtifact(Object.assign({}, taskRecord || {}, { artifacts:[] }), artifact);
    return next.artifacts && next.artifacts[0] || artifact;
  }
  function createTask(){
    const projectName = document.getElementById("projectName").value.trim() || t("newProject");
    const title = document.getElementById("taskTitle").value.trim();
    const description = document.getElementById("taskDescription").value.trim();
    const priority = document.getElementById("taskPriority").value;
    const status = document.getElementById("taskStatus").value;
    if (!title) return;
    const now = nowIso();
    const item = {
      projectTaskId:createProjectTaskId(),
      projectName,
      title,
      description,
      priority,
      status,
      createdAt:now,
      updatedAt:now,
      finishedAt:status === "已完成" || status === "失败" ? now : "",
      taskRecordId:""
    };
    const record = createTaskRecord(item, "createTask");
    item.taskRecordId = record.taskId;
    const next = [item].concat(readTasks());
    writeTasks(next);
    recordHistory("project.createTask", historyPayload(record, item, "createTask", "", []));
    window.WeishanRouter.refresh();
  }
  function updateTaskStatus(projectTaskId, nextStatus){
    const items = readTasks();
    const now = nowIso();
    const updated = items.map(item => {
      if (item.projectTaskId !== projectTaskId) return item;
      const oldStatus = item.status;
      const next = Object.assign({}, item, {
        status:nextStatus,
        updatedAt:now,
        finishedAt:nextStatus === "已完成" || nextStatus === "失败" ? now : item.finishedAt || ""
      });
      const record = createTaskRecord(next, "updateTask", oldStatus);
      recordHistory("project.updateTask", historyPayload(record, next, "updateTask", oldStatus, []));
      return next;
    });
    writeTasks(updated);
    window.WeishanRouter.refresh();
  }
  function exportTasks(){
    const items = readTasks();
    const content = buildTaskListContent(items);
    const now = nowIso();
    const record = createTaskRecord({
      projectTaskId:"project-export-" + Date.now().toString(36),
      title:"项目任务清单",
      description:"导出当前本地项目任务清单。",
      priority:"中",
      status:"已完成",
      createdAt:now,
      updatedAt:now,
      finishedAt:now
    }, "exportTasks");
    const artifact = createArtifact(content, record);
    recordHistory("project.exportTasks", historyPayload(record, {
      projectTaskId:"project-export",
      title:"项目任务清单",
      description:"导出当前本地项目任务清单。",
      priority:"中",
      status:"已完成",
      createdAt:now,
      updatedAt:now,
      finishedAt:now
    }, "exportTasks", "", [artifact]));
    const blob = new Blob([content], { type:artifact.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = artifact.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
  function statusOptions(current, taskId){
    return `<select class="ws-select project-status-select" data-task-id="${esc(taskId)}">${STATUS_OPTIONS.map(s=>`<option value="${esc(s)}" ${s === current ? "selected" : ""}>${esc(s)}</option>`).join("")}</select>`;
  }
  function renderTasks(){
    const items = readTasks();
    return items.map(item => `<div class="ws-card"><h3>${esc(item.title)}</h3><p class="ws-muted">${esc(item.projectName || "")} · ${esc(item.priority)} · ${esc(localTime(item.updatedAt))}</p><p>${esc(item.description || "")}</p>${statusOptions(item.status, item.projectTaskId)}</div>`).join("") || `<div class='ws-card'>${t("noProjects")}</div>`;
  }
  function mount(host){
    host.innerHTML=`<section class="ws-page"><div class="ws-card"><h2>${t("projects")}</h2><p class="ws-muted">${t("projectsDesc")}</p><input id="projectName" class="ws-input" placeholder="${t("projectNamePlaceholder")}"><input id="taskTitle" class="ws-input" placeholder="${esc(label("任务标题", "Task title"))}"><textarea id="taskDescription" class="ws-textarea" placeholder="${esc(label("任务说明", "Task description"))}"></textarea><div class="ws-row"><select id="taskPriority" class="ws-select">${PRIORITY_OPTIONS.map(p=>`<option>${esc(p)}</option>`).join("")}</select><select id="taskStatus" class="ws-select">${STATUS_OPTIONS.map(s=>`<option>${esc(s)}</option>`).join("")}</select><button id="createProjectTask" class="ws-btn">${esc(label("创建任务", "Create task"))}</button><button id="downloadProjectTasks" class="ws-btn gray">${esc(label("下载任务清单", "Download task list"))}</button></div></div><div class="card-list" id="projectTaskList">${renderTasks()}</div></section>`;
    document.getElementById("createProjectTask").addEventListener("click", createTask);
    document.getElementById("downloadProjectTasks").addEventListener("click", exportTasks);
    document.getElementById("projectTaskList").addEventListener("change", e=>{
      const el = e.target;
      if (el && el.classList && el.classList.contains("project-status-select")) updateTaskStatus(el.getAttribute("data-task-id"), el.value);
    });
  }
  window.ProjectsPage = { mount };
})();
