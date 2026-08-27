(function(){
  const PLAN_KEY = "software.plans";

  function esc(s){ return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function t(key){ return window.I18n.t(key); }
  function isEn(){ return window.I18n && window.I18n.getLang && window.I18n.getLang() === "en"; }
  function label(zh, en){ return isEn() ? en : zh; }
  function pendingDispatch(){
    const router = window.WeishanDispatchRouter;
    return router && typeof router.readPendingPayload === "function" ? router.readPendingPayload("softwareFactory") : null;
  }
  function dispatchNoticeHtml(payload){
    if (!payload) return "";
    const prefill = payload.prefill || {};
    const status = payload.status || "pending";
    const canAct = status === "pending" || status === "prefilled";
    const result = payload.outputSummary ? `<p class="ws-muted"><b>${esc(label("本地模拟软件工厂任务结果", "Local mock Software Factory result"))}：</b>${esc(payload.outputSummary)}</p>` : "";
    return `<div class="ws-card" data-dispatch-prefill="softwareFactory"><h3>${esc(label("来自首页调度中心的软件工厂任务", "Software Factory task from Home dispatch center"))}</h3><p class="ws-muted">${esc(prefill.taskTitle || "软件工厂任务")}</p><p class="ws-muted">${esc(prefill.taskDescription || payload.inputSummary || "")}</p><p><b>${esc(prefill.suggestedAction || payload.action || "")}</b></p><p class="ws-muted">${esc(label("需求草案", "Requirement draft"))}：${esc(prefill.draftRequirement || "")}</p><p class="ws-muted">${esc(label("状态", "Status"))}：<b data-dispatch-status>${esc(status)}</b> · realExecution=false</p>${result}<p class="ws-muted">${esc(label("不会自动生成软件、不会调用 AI、不会创建项目文件；用户确认后只生成本地模拟软件工厂任务结果。", "No software is generated automatically, no AI is called, and no project files are created. Confirmation only creates a local mock Software Factory result."))}</p><div class="ws-row"><button id="builderDispatchConfirm" class="ws-btn" ${canAct ? "" : "disabled"}>${esc(label("确认生成", "Confirm generation"))}</button><button id="builderDispatchCancel" class="ws-btn gray" ${canAct ? "" : "disabled"}>${esc(label("取消任务", "Cancel task"))}</button></div></div>`;
  }
  function confirmDispatch(payload){
    const router = window.WeishanDispatchRouter;
    return router && router.confirmPendingPayload ? router.confirmPendingPayload(payload.dispatchId, {
      executionMode:"software_factory_manual_continue",
      outputSummary:"软件工厂调度任务已确认；未自动调用 AI 或生成软件。"
    }) : null;
  }
  function cancelDispatch(payload){
    const router = window.WeishanDispatchRouter;
    return router && router.cancelPendingPayload ? router.cancelPendingPayload(payload.dispatchId, {
      executionMode:"cancelled_by_user",
      outputSummary:"软件工厂调度任务已取消。"
    }) : null;
  }
  function dispatchSummary(text, maxLength){
    const router = window.WeishanDispatchRouter;
    if (router && router.summarizeDispatchText) return router.summarizeDispatchText(text, maxLength || 240);
    return summarize(text, maxLength || 240);
  }
  function buildMockSoftwareFactoryResult(payload){
    const prefill = payload && payload.prefill || {};
    const requirement = dispatchSummary(prefill.draftRequirement || prefill.taskDescription || payload && payload.inputSummary || "", 360);
    const ledgerLike = /账|财务|记账|账本|收支|发票|凭证|ledger|finance|account/i.test(requirement);
    const genericName = requirement ? requirement.replace(/[，。；,.!?！？]/g, " ").split(/\s+/).filter(Boolean).slice(0, 4).join(" ") : "本地优先软件方案";
    const names = ledgerLike
      ? ["企业记账助手", "企业账本管理系统", "Weishan Ledger Lite"]
      : [(genericName || "本地优先软件方案") + " MVP", "Weishan Local App Kit", "轻量业务管理系统"];
    return [
      "# 本地模拟软件工厂任务结果",
      "",
      "## 软件名称建议",
      "- " + names.join("\n- "),
      "",
      "## 产品定位",
      ledgerLike
        ? "面向小微企业、独立团队和项目负责人，用本地优先的方式管理收入、支出、凭证、项目和月度经营报表，降低企业日常记账与审计追踪成本。"
        : "面向需要快速落地内部工具的个人或团队，用本地优先的方式完成核心业务录入、统计、导出和审计追踪，先交付可演示的 MVP，再逐步扩展云协作能力。",
      "",
      "## 核心功能模块",
      "- 账目录入：记录收入、支出、转账、退款和备注。",
      "- 收入/支出分类：维护业务分类、默认科目和统计口径。",
      "- 发票/凭证附件：挂载附件 metadata，后续可接入本地文件索引或云备份。",
      "- 项目/客户维度：把账目关联到项目、客户、合同或成本中心。",
      "- 月度报表：按月份、分类、项目和成员生成汇总。",
      "- 权限与成员：区分所有者、财务、录入者、查看者。",
      "- 数据导出：导出 CSV / Markdown / JSON，便于交给会计或归档。",
      "- 审计日志：记录新增、修改、删除、导出等关键动作。",
      "",
      "## 数据结构草案",
      "- accounts：accountId、name、type、currency、openingBalance、createdAt、updatedAt。",
      "- transactions：transactionId、accountId、categoryId、projectId、amount、direction、occurredAt、note、createdBy、updatedAt。",
      "- categories：categoryId、name、direction、parentId、color、sortOrder、enabled。",
      "- attachments：attachmentId、transactionId、filename、mimeType、sizeBytes、localRef、createdAt。",
      "- projects：projectId、customerId、name、status、budgetAmount、ownerId、createdAt。",
      "- members：memberId、displayName、role、status、permissionScope、createdAt。",
      "- audit_logs：auditId、actorId、action、targetType、targetId、summary、createdAt。",
      "",
      "## 页面/窗口草案",
      "- 首页仪表盘：展示本月收入、支出、结余、待补凭证和最近账目。",
      "- 新增账目：录入金额、日期、分类、项目、客户、凭证附件 metadata。",
      "- 账目列表：按月份、分类、项目、金额区间和关键词筛选。",
      "- 分类管理：维护收入/支出分类、颜色和启用状态。",
      "- 报表中心：查看月度收支、项目成本、分类占比和导出入口。",
      "- 成员权限：配置角色、查看范围和操作权限。",
      "- 设置与导出：管理本地存储、备份、导出和后续云同步入口。",
      "",
      "## 用户流程",
      "登录或进入本地模式 → 创建账本 → 录入收支 → 挂载凭证附件 metadata → 选择分类与项目 → 查看月度报表 → 导出 CSV / Markdown → 审计日志留痕。",
      "",
      "## MVP 范围",
      "- 第一版做：本地账目录入、分类、列表筛选、月度统计、CSV/Markdown 导出、审计日志、基础成员角色。",
      "- 第一版不做：真实银行接口、自动发票识别、真实云同步、复杂审批流、多币种汇兑自动计算、真实会计凭证生成。",
      "",
      "## 验收标准",
      "- 能新增一条收入记录和一条支出记录，并在账目列表中看到。",
      "- 能按月份统计收入、支出和结余。",
      "- 能按分类查看统计结果。",
      "- 能为账目挂载凭证附件 metadata，但不上传文件内容。",
      "- 能导出 CSV 或 Markdown 报表。",
      "- 能查看新增、修改、删除、导出等审计日志。",
      "- 不同成员角色看到的操作入口不同。",
      "- 不创建真实项目目录，不写入代码文件，realExecution=false。",
      "",
      "## 下一步建议",
      "这是本地 mock-safe 软件工厂方案。真实生成代码或创建项目文件，需要用户在软件工厂模块内再次确认。"
    ].join("\n");
  }
  function softwareDispatchHistoryPayload(payload, extra){
    const detail = extra || {};
    const now = nowIso();
    return {
      schemaVersion:"weishan.task.v1",
      module:"softwareFactory",
      action:detail.action || payload && payload.action || "softwareFactory.generatePlan",
      status:detail.status || payload && payload.status || "",
      dispatchId:payload && payload.dispatchId || "",
      targetRoute:payload && payload.targetRoute || "builder",
      inputSummary:dispatchSummary(payload && payload.inputSummary || "", 240),
      outputSummary:dispatchSummary(detail.outputSummary || "", 240),
      executionMode:dispatchSummary(detail.executionMode || "software_factory_mock_safe_execution", 120),
      realExecution:detail.realExecution === true,
      createdAt:detail.createdAt || now,
      updatedAt:now
    };
  }
  function recordSoftwareDispatch(type, payload, extra){
    if (window.HistoryApi && typeof window.HistoryApi.record === "function") {
      window.HistoryApi.record(type, softwareDispatchHistoryPayload(payload, extra || {}));
    }
  }
  function executeDispatchSoftwareFactory(payload){
    const confirmed = confirmDispatch(payload);
    if (!confirmed) return null;
    const result = buildMockSoftwareFactoryResult(confirmed);
    const outputSummary = label("已生成本地模拟软件工厂任务结果。未调用 AI，未创建项目文件，realExecution=false。", "Local mock Software Factory result generated. No AI call, no project files created. realExecution=false.");
    recordSoftwareDispatch("softwareFactory.executionRequested", confirmed, {
      status:"confirmed",
      executionMode:"software_factory_confirm_requested",
      realExecution:false,
      outputSummary:"用户已在软件工厂模块确认生成任务。"
    });
    recordSoftwareDispatch("softwareFactory.executed", confirmed, {
      status:"executed",
      executionMode:"software_factory_mock_safe_execution",
      realExecution:false,
      outputSummary
    });
    if (window.WeishanDispatchRouter && window.WeishanDispatchRouter.markPendingExecuted) {
      window.WeishanDispatchRouter.markPendingExecuted(confirmed.dispatchId, {
        executionMode:"software_factory_mock_safe_execution",
        realExecution:false,
        outputSummary
      });
    }
    return { status:"executed", message:outputSummary, plan:result };
  }
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
    const dispatchPayload = pendingDispatch();
    const prefill = dispatchPayload && dispatchPayload.prefill || {};
    host.innerHTML=`<section class="ws-page">${dispatchNoticeHtml(dispatchPayload)}<div class="ws-card"><h2>${t("builder")}</h2><p class="ws-muted">${t("softwareDesc")}</p><label>${esc(label("软件类型", "Software type"))}</label><select id="softwareType" class="ws-select"><option>Web 应用</option><option>桌面工具</option><option>自动化脚本</option><option>文档模板</option><option>暂不确定</option></select><textarea id="softwareGoal" class="ws-textarea" placeholder="${t("softwarePlaceholder")}">${esc(prefill.draftRequirement || prefill.taskDescription || "")}</textarea><div class="ws-row"><button id="createPlan" class="ws-btn">${esc(label("生成软件方案", "Generate software plan"))}</button><button id="reportBug" class="ws-btn gray">${t("reportBug")}</button></div></div><div id="softwareResult" role="status" aria-live="polite"></div><div class="card-list" id="softwarePlans">${renderPlans()}</div></section>`;
    const builderDispatchConfirm = document.getElementById("builderDispatchConfirm");
    if (builderDispatchConfirm && dispatchPayload) builderDispatchConfirm.addEventListener("click", () => {
      const result = executeDispatchSoftwareFactory(dispatchPayload);
      mount(host);
      if (result) updateResult(result.status, result.message, result.plan);
    });
    const builderDispatchCancel = document.getElementById("builderDispatchCancel");
    if (builderDispatchCancel && dispatchPayload) builderDispatchCancel.addEventListener("click", () => { cancelDispatch(dispatchPayload); mount(host); });
    document.getElementById("createPlan").addEventListener("click", async ()=>{
      const btn = document.getElementById("createPlan");
      btn.disabled = true;
      try { await runFactory(document.getElementById("softwareGoal").value, document.getElementById("softwareType").value); } finally { btn.disabled = false; }
    });
    document.getElementById("reportBug").addEventListener("click",()=>{
      window.SoftwareApi.reportBug({ description:document.getElementById("softwareGoal").value });
      updateResult("saved", t("bugDraftSaved"));
    });
  }
  window.BuilderPage = { mount };
})();
