(function(){
  const MEMORY_KEY = "weishan:memory:v1";
  const SOURCE_OPTIONS = [
    "手动",
    "历史记录",
    "项目管理",
    "抓取中心",
    "软件工厂",
    "邮件接管"
  ];

  function esc(s){ return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function t(key){ return window.I18n.t(key); }
  function isEn(){ return window.I18n && window.I18n.getLang && window.I18n.getLang() === "en"; }
  function label(zh, en){ return isEn() ? en : zh; }
  function nowIso(){ return new Date().toISOString(); }
  function taskProtocol(){ return window.WeishanTaskProtocol || null; }
  function summarize(text, maxLength){
    const tp = taskProtocol();
    return tp && tp.summarizeTextSafe ? tp.summarizeTextSafe(text, maxLength) : String(text || "").replace(/\s+/g, " ").trim().slice(0, maxLength || 160);
  }
  function localTime(value){
    const d = value ? new Date(value) : new Date();
    const valid = Number.isNaN(d.getTime()) ? new Date() : d;
    const pad = (n) => String(n).padStart(2, "0");
    return valid.getFullYear() + "/" + pad(valid.getMonth() + 1) + "/" + pad(valid.getDate()) + " " + pad(valid.getHours()) + ":" + pad(valid.getMinutes()) + ":" + pad(valid.getSeconds());
  }
  function readMemories(){
    try {
      const raw = window.localStorage.getItem(MEMORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }
  function writeMemories(items){
    window.localStorage.setItem(MEMORY_KEY, JSON.stringify(Array.isArray(items) ? items : []));
  }
  function createMemoryId(){
    return "memory-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }
  function splitTags(value){
    return String(value || "").split(",").map(x => x.trim()).filter(Boolean).slice(0, 12);
  }
  function sourceValue(){
    const el = document.getElementById("memorySource");
    return el ? el.value : SOURCE_OPTIONS[0];
  }
  function createTaskRecord(memory, action, outputSummary){
    const tp = taskProtocol();
    if (tp && tp.createTaskRecord) {
      const base = tp.createTaskRecord({
        module:"memory",
        action,
        routeMode:"module",
        title:memory.title || label("记忆条目", "Memory entry"),
        inputSummary:memory.content || memory.title || "",
        outputSummary,
        status:"done",
        source:{ type:"module", module:"memory" },
        target:{ type:"module", module:"memory" },
        executor:{ type:"system", id:"memory.local", label:"Memory Local" },
        meta:{ memoryId:memory.memoryId || "", tags:memory.tags || [], source:memory.source || "" }
      });
      const started = tp.transitionTaskStatus ? tp.transitionTaskStatus(base, "running") : Object.assign({}, base, { status:"running", startedAt:nowIso() });
      return tp.transitionTaskStatus ? tp.transitionTaskStatus(started, "done", { outputSummary:base.outputSummary }) : Object.assign({}, started, { status:"done", finishedAt:nowIso(), outputSummary:base.outputSummary });
    }
    const now = nowIso();
    return {
      schemaVersion:"weishan.task.v1",
      taskId:"task-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
      module:"memory",
      action,
      routeMode:"module",
      title:summarize(memory.title || "Memory", 80),
      inputSummary:summarize(memory.content || memory.title || "", 240),
      outputSummary:summarize(outputSummary || "", 240),
      status:"done",
      createdAt:now,
      startedAt:now,
      finishedAt:now,
      artifacts:[]
    };
  }
  function historyPayload(record, memory, action, artifacts, extra){
    return Object.assign({
      schemaVersion:record.schemaVersion || "weishan.task.v1",
      taskId:record.taskId,
      module:"memory",
      action,
      status:record.status || "done",
      createdAt:record.createdAt || memory.createdAt || "",
      startedAt:record.startedAt || "",
      finishedAt:record.finishedAt || "",
      inputSummary:summarize(memory.content || memory.title || "", 240),
      outputSummary:summarize(record.outputSummary || "", 240),
      memoryId:memory.memoryId || "",
      title:memory.title || "",
      tags:Array.isArray(memory.tags) ? memory.tags : [],
      source:memory.source || "",
      artifacts:Array.isArray(artifacts) ? artifacts : [],
      error:null
    }, extra || {});
  }
  function recordHistory(type, payload){
    if (window.HistoryApi && typeof window.HistoryApi.record === "function") window.HistoryApi.record(type, payload);
  }
  function filename(dateLike){
    const d = dateLike ? new Date(dateLike) : new Date();
    const valid = Number.isNaN(d.getTime()) ? new Date() : d;
    const pad = (n) => String(n).padStart(2, "0");
    return "weishan-memory-" + valid.getFullYear() + pad(valid.getMonth() + 1) + pad(valid.getDate()) + "-" + pad(valid.getHours()) + pad(valid.getMinutes()) + pad(valid.getSeconds()) + ".md";
  }
  function textSize(text){ try { return new Blob([String(text || "")]).size; } catch (_) { return String(text || "").length; } }
  function countTags(items){
    return items.reduce((acc, item) => {
      const tags = Array.isArray(item.tags) && item.tags.length ? item.tags : [label("无标签", "Untagged")];
      tags.forEach(tag => { acc[tag] = (acc[tag] || 0) + 1; });
      return acc;
    }, {});
  }
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
  function buildMemoryLibraryContent(items){
    return [
      "# 记忆库导出",
      "",
      "生成时间：" + localTime(),
      "记忆总数：" + items.length,
      "",
      linesForCounts("标签统计：", countTags(items)),
      "",
      linesForCounts("来源统计：", countBy(items, "source")),
      "",
      "## 记忆列表",
      items.map((item, index) => [
        "### " + (index + 1) + ". " + (item.title || "未命名记忆"),
        "- 标签：" + ((item.tags || []).join(", ") || "无"),
        "- 来源：" + (item.source || "手动"),
        "- 创建时间：" + localTime(item.createdAt),
        "- 更新时间：" + localTime(item.updatedAt),
        "",
        item.content || "无内容"
      ].join("\n")).join("\n\n") || "暂无记忆。"
    ].join("\n");
  }
  function createArtifact(content, taskRecord){
    const tp = taskProtocol();
    const artifact = {
      taskId:taskRecord && taskRecord.taskId || "",
      type:"markdown",
      title:"记忆库导出",
      filename:filename(),
      mimeType:"text/markdown;charset=utf-8",
      sizeBytes:textSize(content),
      content,
      meta:{ kind:"memory-library", source:"memory.export" }
    };
    if (!tp || !tp.addTaskArtifact) return artifact;
    const next = tp.addTaskArtifact(Object.assign({}, taskRecord || {}, { artifacts:[] }), artifact);
    return next.artifacts && next.artifacts[0] || artifact;
  }
  function filteredMemories(){
    const query = String((document.getElementById("memorySearch") || {}).value || "").trim().toLowerCase();
    const items = readMemories();
    if (!query) return items;
    return items.filter(item => [
      item.title,
      item.content,
      item.source,
      (item.tags || []).join(" ")
    ].join(" ").toLowerCase().includes(query));
  }
  function saveMemory(){
    const title = document.getElementById("memoryTitle").value.trim();
    const content = document.getElementById("memoryContent").value.trim();
    const tags = splitTags(document.getElementById("memoryTags").value);
    const source = sourceValue();
    if (!title && !content) return;
    const now = nowIso();
    const memory = {
      memoryId:createMemoryId(),
      title:title || summarize(content, 40) || label("未命名记忆", "Untitled memory"),
      content,
      tags,
      source,
      createdAt:now,
      updatedAt:now
    };
    writeMemories([memory].concat(readMemories()).slice(0, 2000));
    const record = createTaskRecord(memory, "create", "新增记忆：" + memory.title);
    recordHistory("memory.create", historyPayload(record, memory, "create", []));
    window.WeishanRouter.refresh();
  }
  function deleteMemory(memoryId){
    const items = readMemories();
    const target = items.find(item => item.memoryId === memoryId);
    if (!target) return;
    writeMemories(items.filter(item => item.memoryId !== memoryId));
    const record = createTaskRecord(target, "delete", "删除记忆：" + (target.title || ""));
    recordHistory("memory.delete", historyPayload(record, target, "delete", []));
    window.WeishanRouter.refresh();
  }
  function exportMemories(){
    const items = readMemories();
    const content = buildMemoryLibraryContent(items);
    const now = nowIso();
    const memory = {
      memoryId:"memory-export-" + Date.now().toString(36),
      title:"记忆库导出",
      content:"导出当前本地记忆库。",
      tags:[],
      source:"手动",
      createdAt:now,
      updatedAt:now
    };
    const record = createTaskRecord(memory, "export", "导出记忆库，共 " + items.length + " 条。");
    const artifact = createArtifact(content, record);
    recordHistory("memory.export", historyPayload(record, memory, "export", [artifact], { memoryCount:items.length }));
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
  function renderMemoryList(items){
    return items.map(item => `<div class="ws-card"><h3>${esc(item.title || label("未命名记忆", "Untitled memory"))}</h3><p class="ws-muted">${esc(item.source || label("手动", "Manual"))} · ${esc(localTime(item.updatedAt || item.createdAt))}</p><p>${esc(summarize(item.content || "", 220))}</p><p>${(item.tags || []).map(tag => `<span class="tag">${esc(tag)}</span>`).join(" ")}</p><button type="button" class="small gray memory-delete" data-memory-id="${esc(item.memoryId)}">${esc(label("删除", "Delete"))}</button></div>`).join("") || `<div class='ws-card'>${t("noMemory")}</div>`;
  }
  function render(){
    return renderMemoryList(filteredMemories());
  }
  function mount(host){
    host.innerHTML=`<section class="ws-page"><div class="ws-card"><h2>${t("memory")}</h2><p class="ws-muted">${t("memoryDesc")}</p><input id="memoryTitle" class="ws-input" placeholder="${esc(label("记忆标题", "Memory title"))}"><textarea id="memoryContent" class="ws-textarea" placeholder="${t("memoryTextPlaceholder")}"></textarea><div class="ws-row"><input id="memoryTags" class="ws-input" placeholder="${t("memoryTagsPlaceholder")}"><select id="memorySource" class="ws-select">${SOURCE_OPTIONS.map(s=>`<option>${esc(s)}</option>`).join("")}</select><button id="saveMemory" class="ws-btn">${t("saveMemory")}</button><button id="exportMemory" class="ws-btn gray">${esc(label("导出记忆库", "Export memory library"))}</button></div></div><div class="ws-card"><input id="memorySearch" class="ws-input" placeholder="${esc(label("搜索标题、内容、标签或来源", "Search title, content, tags, or source"))}"></div><div class="card-list" id="memoryList">${renderMemoryList(readMemories())}</div></section>`;
    document.getElementById("saveMemory").addEventListener("click", saveMemory);
    document.getElementById("exportMemory").addEventListener("click", exportMemories);
    document.getElementById("memorySearch").addEventListener("input", () => {
      document.getElementById("memoryList").innerHTML = render();
    });
    document.getElementById("memoryList").addEventListener("click", e => {
      const btn = e.target && e.target.closest && e.target.closest(".memory-delete");
      if (!btn) return;
      deleteMemory(btn.getAttribute("data-memory-id"));
    });
  }
  window.MemoryPage = { mount };
})();
