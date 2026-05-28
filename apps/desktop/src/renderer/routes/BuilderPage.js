(function(){
  const PLAN_KEY = "software.plans";

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
  function cleanAiText(text){
    const tp = taskProtocol();
    return tp && tp.stripAiReasoningArtifacts ? tp.stripAiReasoningArtifacts(text) : String(text || "");
  }
  function readPlans(){ return window.WeishanStore.read(PLAN_KEY, []); }
  function writePlans(items){ window.WeishanStore.write(PLAN_KEY, (items || []).slice(0, 100)); }
  function upsertPlan(plan){
    const items = readPlans().filter(x => x && x.taskId !== plan.taskId);
    writePlans([plan].concat(items));
  }
  function transition(task, status, extra){
    const tp = taskProtocol();
    return tp && tp.transitionTaskStatus ? tp.transitionTaskStatus(task, status, extra || {}) : Object.assign({}, task || {}, extra || {}, { status, updatedAt:nowIso() });
  }
  function createTask(goal, softwareType){
    const tp = taskProtocol();
    const title = summarize(goal || label("软件方案", "Software plan"), 80);
    if (tp && tp.createTaskRecord) {
      return tp.createTaskRecord({
        module:"softwareFactory",
        action:"generatePlan",
        routeMode:"module",
        title,
        inputSummary:summarize(goal, 240),
        status:"queued",
        executor:{ type:"ai", id:"softwareFactory.generatePlan", label:"Software Factory" },
        source:{ type:"module", module:"softwareFactory" },
        target:{ type:"module", module:"softwareFactory" },
        meta:{ softwareType }
      });
    }
    return {
      schemaVersion:"weishan.task.v1",
      taskId:"soft-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
      module:"softwareFactory",
      action:"generatePlan",
      routeMode:"module",
      title,
      inputSummary:summarize(goal, 240),
      status:"queued",
      createdAt:nowIso(),
      queuedAt:nowIso(),
      artifacts:[],
      meta:{ softwareType }
    };
  }
  function filename(dateLike){
    const date = dateLike ? new Date(dateLike) : new Date();
    const valid = Number.isNaN(date.getTime()) ? new Date() : date;
    const pad = (n) => String(n).padStart(2, "0");
    return "weishan-software-plan-" + valid.getFullYear() + pad(valid.getMonth() + 1) + pad(valid.getDate()) + "-" + pad(valid.getHours()) + pad(valid.getMinutes()) + pad(valid.getSeconds()) + ".md";
  }
  function textSize(text){ try { return new Blob([String(text || "")]).size; } catch (_) { return String(text || "").length; } }
  function safeError(err){ return summarize(err && err.message ? err.message : String(err || ""), 240) || label("未知错误", "Unknown error"); }
  function defaultPlan(goal, softwareType){
    const type = softwareType || "桌面工具";
    const goalText = summarize(goal, 700) || "用户希望设计一个本地优先的软件工具。";
    return [
      "# 软件方案",
      "",
      "## 1. 需求摘要",
      "用户希望构建一个可落地的 " + type + "，核心目标是把当前需求转化为清晰的软件范围、模块结构和开发步骤。",
      "本方案以本地优先、数据可控、易维护为默认假设，先完成可独立运行的 MVP，再逐步扩展高级能力。",
      "原始需求摘要：" + goalText,
      "",
      "## 2. 推荐软件类型",
      "推荐类型：" + type + "。",
      "选择理由：该类型适合快速交付独立功能，减少服务端依赖，便于本地保存数据、导出结果和后续迭代。",
      "",
      "## 3. 核心功能",
      "- 记录新增：提供清晰表单录入核心业务数据，支持必填校验和备注。",
      "- 记录编辑：允许修改已保存数据，并保留更新时间。",
      "- 记录删除：提供删除确认，避免误删。",
      "- 分类管理：支持用户自定义分类、颜色或排序。",
      "- 搜索与筛选：按关键词、分类、日期或状态查找数据。",
      "- 统计汇总：按月、分类或关键字段生成汇总视图。",
      "- 本地数据存储：默认把数据保存在本机，避免依赖云端。",
      "- 本地导出：支持导出为 CSV、JSON 或 Markdown，方便备份和迁移。",
      "- 备份与恢复：提供手动备份和导入恢复入口。",
      "",
      "## 4. 页面 / 模块结构",
      "- 仪表盘：展示关键指标、最近记录和快速入口。",
      "- 数据录入页：负责新增和编辑记录。",
      "- 记录列表页：展示全部记录，支持搜索、筛选、排序和删除。",
      "- 分类管理页：维护分类、标签或基础字典。",
      "- 统计报表页：展示月度、分类和趋势统计。",
      "- 设置 / 导出页：管理本地存储、导出、备份和恢复。",
      "",
      "## 5. 建议文件结构",
      "```text",
      "src/",
      "  main/",
      "    app.js",
      "    storage.js",
      "  renderer/",
      "    pages/",
      "      DashboardPage.js",
      "      EntryPage.js",
      "      RecordsPage.js",
      "      CategoriesPage.js",
      "      ReportsPage.js",
      "      SettingsPage.js",
      "    modules/",
      "      recordStore.js",
      "      reportService.js",
      "      exportService.js",
      "    styles/",
      "      app.css",
      "```",
      "以上是建议文件结构，本轮不创建真实代码文件。",
      "",
      "## 6. 数据结构",
      "```json",
      "{",
      "  \"Record\": { \"id\": \"string\", \"type\": \"string\", \"amount\": \"number\", \"categoryId\": \"string\", \"date\": \"YYYY-MM-DD\", \"note\": \"string\", \"createdAt\": \"ISO\", \"updatedAt\": \"ISO\" },",
      "  \"Category\": { \"id\": \"string\", \"name\": \"string\", \"type\": \"string\", \"color\": \"string\", \"sort\": \"number\" },",
      "  \"ReportSummary\": { \"month\": \"YYYY-MM\", \"totalIncome\": \"number\", \"totalExpense\": \"number\", \"categoryTotals\": \"array\" },",
      "  \"ExportJob\": { \"id\": \"string\", \"format\": \"csv|json|markdown\", \"createdAt\": \"ISO\", \"fileName\": \"string\" }",
      "}",
      "```",
      "",
      "## 7. 开发步骤",
      "- 明确需求边界",
      "- 设计数据结构",
      "- 实现本地存储读写",
      "- 实现新增、编辑、删除记录",
      "- 实现列表筛选和分类管理",
      "- 实现统计报表",
      "- 实现本地导出",
      "- 完成本地测试和异常状态处理",
      "",
      "## 8. 测试清单",
      "- 新增一条有效记录",
      "- 新增一条无效记录并验证错误提示",
      "- 编辑记录后确认列表和统计同步更新",
      "- 删除记录前出现确认提示",
      "- 按分类筛选记录",
      "- 按月份查看统计报表",
      "- 导出 CSV / JSON 文件",
      "- 空数据状态显示正常",
      "- 应用重启后本地数据仍存在",
      "- 备份恢复后数据完整",
      "",
      "## 9. 风险与待确认问题",
      "- 数据导出格式优先 CSV、JSON 还是 Markdown？",
      "- 是否需要多账户或多账本空间？",
      "- 是否需要密码保护或本地加密？",
      "- 是否需要图表展示趋势？",
      "- 是否需要跨设备同步？若需要，需要额外设计同步和冲突处理。"
    ].join("\n");
  }
  function sectionLines(content, heading){
    const pattern = new RegExp("##\\s*\\d+\\.\\s*" + heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\n([\\s\\S]*?)(?=\\n##\\s*\\d+\\.|$)", "i");
    const match = String(content || "").match(pattern);
    return match ? match[1].split("\n").map(x => x.trim()).filter(Boolean) : [];
  }
  function hasWeakPlan(content){
    const text = String(content || "");
    const pendingCount = (text.match(/待确认/g) || []).length;
    const featureLines = sectionLines(text, "核心功能");
    const moduleLines = sectionLines(text, "页面 / 模块结构");
    const dataLines = sectionLines(text, "数据结构");
    const testLines = sectionLines(text, "测试清单");
    return /待补充|待完善/.test(text) ||
      pendingCount > 3 ||
      featureLines.length < 4 ||
      moduleLines.length < 3 ||
      !/id|字段|Record|Transaction|Category|JSON|数据表|结构/i.test(dataLines.join(" ")) ||
      testLines.length < 5;
  }
  function validateSoftwarePlan(content, goal, softwareType){
    const clean = cleanAiText(content).trim();
    const base = clean || defaultPlan(goal, softwareType);
    if (!hasWeakPlan(base)) return base;
    return base + "\n\n## 方案完整性补充\n\n" + defaultPlan(goal, softwareType).replace(/^# 软件方案\s*/,"").trim();
  }
  function ensurePlanShape(text, goal, softwareType){
    return validateSoftwarePlan(text, goal, softwareType);
  }
  function buildRequest(goal, softwareType){
    return [
      { role:"system", content:[
        "你是 weishan 软件工厂方案助手。",
        "请生成中文 Markdown 软件方案文档。",
        "只基于用户输入生成方案，不编造不存在的外部 API、客户、数据、部署结果或测试结果。",
        "不要声称已经创建文件、写入源码、安装依赖、部署或运行测试。",
        "如果需求不完整，请列出待确认问题，但仍必须继续给出具体、可执行的默认方案。",
        "禁止用“待补充”“待完善”填充章节。禁止让“待确认”成为整节唯一内容。",
        "核心功能至少 6 项具体功能；页面 / 模块结构至少 4 个具体页面或模块；建议文件结构必须给示例树；数据结构必须列字段；开发步骤至少 6 步；测试清单至少 8 项。",
        "不要输出隐藏 reasoning、analysis、<think> 或代码块外壳。",
        "固定结构：# 软件方案；## 1. 需求摘要；## 2. 推荐软件类型；## 3. 核心功能；## 4. 页面 / 模块结构；## 5. 建议文件结构；## 6. 数据结构；## 7. 开发步骤；## 8. 测试清单；## 9. 风险与待确认问题。"
      ].join("\n") },
      { role:"user", content:"软件类型：" + softwareType + "\n需求：\n" + goal }
    ];
  }
  async function generatePlan(goal, softwareType, onDelta){
    if (!window.WeishanAPI || typeof window.WeishanAPI.chat !== "function") throw new Error(label("AI 未配置或调用失败，请先在设置中完成 AI 配置。", "AI is not configured or failed. Please configure AI in Settings first."));
    const request = buildRequest(goal, softwareType);
    const meta = window.WeishanPerf && window.WeishanPerf.createPerfMeta ? window.WeishanPerf.createPerfMeta("softwareFactory.generatePlan") : undefined;
    if (window.WeishanAPI.chatStream) {
      const res = await window.WeishanAPI.chatStream(request, { __perf:meta, onDelta });
      if (!res || !res.ok) throw new Error(res && (res.error || res.message) || label("AI 调用失败。", "AI call failed."));
      return ensurePlanShape(res.content || "", goal, softwareType);
    }
    const res = await window.WeishanAPI.chat(request, { __perf:meta });
    if (!res || !res.ok) throw new Error(res && (res.error || res.message) || label("AI 调用失败。", "AI call failed."));
    return ensurePlanShape(res.content || "", goal, softwareType);
  }
  function addArtifact(task, plan){
    const tp = taskProtocol();
    if (!tp || !tp.addTaskArtifact) return task;
    return tp.addTaskArtifact(task, {
      taskId:task.taskId,
      type:"markdown",
      title:summarize(task.title || "软件方案", 120),
      filename:filename(task.finishedAt || task.createdAt),
      mimeType:"text/markdown;charset=utf-8",
      sizeBytes:textSize(plan),
      content:plan,
      meta:{ kind:"software-plan", source:"softwareFactory.generatePlan" }
    });
  }
  function historyPayload(task, softwareType){
    return {
      schemaVersion:task.schemaVersion || "weishan.task.v1",
      taskId:task.taskId,
      module:"softwareFactory",
      action:"generatePlan",
      status:task.status,
      createdAt:task.createdAt || "",
      startedAt:task.startedAt || "",
      finishedAt:task.finishedAt || "",
      inputSummary:summarize(task.inputSummary || "", 240),
      outputSummary:summarize(task.outputSummary || "", 240),
      softwareType,
      artifacts:Array.isArray(task.artifacts) ? task.artifacts : [],
      error:task.error || null
    };
  }
  function recordHistory(task, softwareType){
    if (window.HistoryApi && typeof window.HistoryApi.record === "function") {
      window.HistoryApi.record("softwareFactory.generatePlan", historyPayload(task, softwareType));
    }
  }
  function renderPlans(){
    const plans = readPlans();
    return plans.map(p=>`<div class="ws-card"><b>${esc(p.title || p.name || t("planFallback"))}</b><p>${esc(p.status || "")}${p.softwareType ? " · " + esc(p.softwareType) : ""}</p>${p.outputSummary ? `<p class="ws-muted">${esc(p.outputSummary)}</p>` : ""}</div>`).join("") || `<div class='ws-card'>${t("noSoftware")}</div>`;
  }
  function preview(text){
    const value = String(text || "");
    return value.length > 2600 ? value.slice(0, 2600).trim() + "..." : value;
  }
  function updateResult(status, message, plan){
    const box = document.getElementById("softwareResult");
    if (!box) return;
    box.innerHTML = `<div class="ws-card"><h3>${esc(status)}</h3><p class="ws-muted">${esc(message || "")}</p>${plan ? `<pre>${esc(preview(plan))}</pre>` : ""}</div>`;
  }
  async function runFactory(goal, softwareType){
    const cleanGoal = String(goal || "").trim();
    let task = createTask(cleanGoal, softwareType);
    if (!cleanGoal) {
      task = transition(task, "failed", { outputSummary:label("需求为空。", "Requirement is empty."), error:{ name:"ValidationError", message:label("请先填写软件需求。", "Please enter the software requirement first.") } });
      upsertPlan(Object.assign({}, task, { softwareType }));
      recordHistory(task, softwareType);
      updateResult("failed", task.error.message);
      return;
    }

    task = transition(task, "running");
    upsertPlan(Object.assign({}, task, { softwareType }));
    updateResult("running", label("正在生成软件方案...", "Generating software plan..."));
    let partial = "";
    let flushTimer = 0;
    const flush = () => {
      flushTimer = 0;
      const clean = cleanAiText(partial).trim();
      if (clean) updateResult("running", label("正在生成软件方案...", "Generating software plan..."), clean);
    };
    try {
      const plan = await generatePlan(cleanGoal, softwareType, (delta) => {
        partial += String(delta || "");
        if (!flushTimer) flushTimer = setTimeout(flush, 160);
      });
      if (flushTimer) clearTimeout(flushTimer);
      const outputSummary = summarize(plan, 240);
      task = transition(task, "done", { outputSummary, meta:Object.assign({}, task.meta || {}, { softwareType }) });
      task = addArtifact(task, plan);
      const finalPlan = Object.assign({}, task, { softwareType, plan });
      upsertPlan(finalPlan);
      recordHistory(finalPlan, softwareType);
      updateResult("done", label("软件方案已生成，已写入历史记录并生成可下载产物。", "Software plan generated. History and downloadable artifact were created."), plan);
    } catch (err) {
      if (flushTimer) clearTimeout(flushTimer);
      const msg = safeError(err);
      task = transition(task, "failed", { outputSummary:summarize("生成失败：" + msg, 240), error:{ name:err && err.name || "Error", message:msg } });
      upsertPlan(Object.assign({}, task, { softwareType }));
      recordHistory(task, softwareType);
      updateResult("failed", msg);
    }
    const list = document.getElementById("softwarePlans");
    if (list) list.innerHTML = renderPlans();
  }
  function mount(host){
    host.innerHTML=`<section class="ws-page"><div class="ws-card"><h2>${t("builder")}</h2><p class="ws-muted">${t("softwareDesc")}</p><label>${esc(label("软件类型", "Software type"))}</label><select id="softwareType" class="ws-select"><option>Web 应用</option><option>桌面工具</option><option>自动化脚本</option><option>文档模板</option><option>暂不确定</option></select><textarea id="softwareGoal" class="ws-textarea" placeholder="${t("softwarePlaceholder")}"></textarea><div class="ws-row"><button id="createPlan" class="ws-btn">${esc(label("生成软件方案", "Generate software plan"))}</button><button id="reportBug" class="ws-btn gray">${t("reportBug")}</button></div></div><div id="softwareResult"></div><div class="card-list" id="softwarePlans">${renderPlans()}</div></section>`;
    document.getElementById("createPlan").addEventListener("click", async ()=>{
      const btn = document.getElementById("createPlan");
      btn.disabled = true;
      try { await runFactory(document.getElementById("softwareGoal").value, document.getElementById("softwareType").value); } finally { btn.disabled = false; }
    });
    document.getElementById("reportBug").addEventListener("click",()=>{
      window.SoftwareApi.reportBug({ description:document.getElementById("softwareGoal").value });
      alert(t("bugDraftSaved"));
    });
  }
  window.BuilderPage = { mount };
})();
