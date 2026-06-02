(function(){
  let selectedHistoryId = "";
  let stagedAttachments = [];

  function esc(s){
    return String(s || "").replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; });
  }
  function t(key){ return window.I18n.t(key); }

  function formatSize(size){
    const value = Number(size || 0);
    if (!value) return "0 B";
    if (value < 1024) return value + " B";
    if (value < 1024 * 1024) return Math.round(value / 1024) + " KB";
    return (value / 1024 / 1024).toFixed(1) + " MB";
  }

  function attachmentType(file){
    const name = String(file && file.name || "");
    const ext = (name.split(".").pop() || "").toLowerCase();
    if (/^(png|jpg|jpeg|gif|webp|svg)$/.test(ext)) return "image/" + ext.replace("jpg", "jpeg");
    if (/^(md|txt|csv|json|pdf|docx|pptx|xlsx)$/.test(ext)) return ext;
    return "file";
  }

  function normalizeAttachment(file){
    const name = String(file && file.name || "attachment").replace(/[<>]/g, "").slice(0, 120);
    return {
      attachmentId:"att-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
      name,
      type:String(file && file.type || attachmentType(file)).slice(0, 80),
      size:Number(file && file.size || 0)
    };
  }

  function attachmentPanel(){
    if (!stagedAttachments.length) return "";
    return `<div class="cmd-attachment-stage" data-attachment-stage="true">
      ${stagedAttachments.map((file, idx) => `<span class="cmd-pill">
        ${esc(file.name)} · ${esc(file.type)} · ${esc(formatSize(file.size))}
        <button class="cmd-history-back" type="button" data-remove-attachment="${idx}">×</button>
      </span>`).join("")}
      <p class="cmd-history-meta">附件已挂载，仅保存 metadata；不会自动执行、不会上传云、不会读取完整文件内容。</p>
    </div>`;
  }

  function desktopAssistantApi(){
    return window.WeishanDesktopAssistant || null;
  }

  function desktopAssistantSession(){
    const api = desktopAssistantApi();
    return api && api.getDesktopAssistantSession ? api.getDesktopAssistantSession() : { enabled:false, status:"closed" };
  }

  function desktopAssistantHistory(action, detail){
    const api = desktopAssistantApi();
    if (!api || !api.createDesktopAssistantHistoryPayload || !window.HistoryApi || !window.HistoryApi.record) return;
    const payload = api.createDesktopAssistantExecutionHistoryPayload ?
      api.createDesktopAssistantExecutionHistoryPayload(action, detail || {}) :
      api.createDesktopAssistantHistoryPayload(action, detail || {});
    window.HistoryApi.record(action, payload);
  }

  function desktopExecutionQueue(){
    const api = desktopAssistantApi();
    return api && api.getDesktopExecutionQueue ? api.getDesktopExecutionQueue() : null;
  }

  function latestDesktopTask(){
    const snap = window.CommandApi.snapshot();
    return (snap.queue || []).slice().reverse().find((item) => item && (item.meta && item.meta.dispatchModule === "desktopAssistant" || item.module === "desktopAssistant")) || null;
  }

  function desktopAssistantStrip(){
    const session = desktopAssistantSession();
    const enabled = session && session.enabled === true;
    return `<div class="desktop-assistant-strip" data-desktop-assistant-session="true">
      <span class="desktop-assistant-state ${enabled ? "is-on" : "is-off"}">桌面助手：${enabled ? "本次开启" : "关闭"}</span>
      <button class="cmd-btn gray" id="desktopAssistantEnable" type="button">本次开启</button>
      <button class="cmd-btn gray" id="desktopAssistantDisable" type="button">关闭</button>
      <button class="cmd-btn danger ghost" id="desktopAssistantStop" type="button">停止接管</button>
    </div>`;
  }

  function cleanAiDisplay(text){
    const raw = String(text || "");
    const cleaned = raw
      .replace(/<think[\s\S]*?<\/think>/gi, "")
      .replace(/<reasoning[\s\S]*?<\/reasoning>/gi, "")
      .replace(/```(?:think|thinking|reasoning)[\s\S]*?```/gi, "")
      .replace(/\[think\][\s\S]*?\[\/think\]/gi, "")
      .replace(/^\s*(thinking|reasoning)\s*:\s*[\s\S]*?(?=\n{2,}|$)/gim, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return cleaned || (raw.trim() ? t("homeNoDisplayableAi") : "");
  }

  function displayLogText(log){
    const text = String(log && log.text || "");
    if ((log && (log.type === "answer" || log.type === "ai")) || /<think|```think|```thinking|```reasoning/i.test(text)) {
      return cleanAiDisplay(text);
    }
    return text;
  }

  function displayAnswer(task){
    return cleanAiDisplay(task && task.answer || "");
  }

  function summary(text, limit){
    const clean = cleanAiDisplay(text).replace(/\s+/g, " ").trim();
    const max = limit || 160;
    return clean.length > max ? clean.slice(0, max).trim() + "..." : clean;
  }

  function taskTitle(task){
    if (!task) return "";
    if (task.status === "queued") return t("statusQueued");
    if (task.status === "running") return t("statusRunning");
    if (task.status === "done") return t("statusDone");
    if (task.status === "failed") return t("statusFailed");
    return task.status || "";
  }

  function statusCls(task){
    return "cmd-status-" + (task && task.status ? task.status : "idle");
  }

  function taskKey(task, idx){
    return String((task && (task.id || task.createdAt || task.finishedAt || task.updatedAt)) || idx || "");
  }

  function taskTime(task){
    return window.CommandApi.timeLabel(task && (task.finishedAt || task.updatedAt || task.createdAt));
  }

  function logLine(log){
    const time = window.CommandApi.timeLabel(log.time);
    return `
      <div class="cmd-log-line cmd-log-${esc(log.type || "info")}">
        <span class="cmd-time">${esc(time)}</span>
        <span class="cmd-text">${esc(displayLogText(log))}</span>
      </div>`;
  }

  function activeTasks(tasks){
    return (tasks || []).filter((x) => x.status === "queued" || x.status === "running");
  }

  function recentDone(tasks, history){
    const seen = {};
    const out = [];
    function add(task, idx){
      if (!task || (task.status !== "done" && task.status !== "failed")) return;
      const key = taskKey(task, idx);
      if (seen[key]) return;
      seen[key] = true;
      out.push(task);
    }
    (history || []).forEach(add);
    (tasks || []).filter((x) => x.status === "done" || x.status === "failed").slice().reverse().forEach(add);
    return out.slice(0, 8);
  }

  function mainLogs(snapshot){
    const tasks = snapshot.queue || [];
    const running = tasks.find((x) => x.status === "running");
    const latest = running || tasks.slice().reverse().find((x) => x.status === "done" || x.status === "failed") || (snapshot.history || [])[0];

    if (!latest) {
      return `
        <div class="cmd-empty">
          <b>${t("homeConsoleBanner")}</b>
          <span>${t("homeConsoleEmpty")}</span>
        </div>`;
    }

    return `
      <div class="cmd-current-head">
        <div>
          <b>${esc(taskTitle(latest))}</b>
          <span>${esc(latest.text)}</span>
        </div>
        <span class="cmd-pill ${statusCls(latest)}">${esc(taskTitle(latest))}</span>
      </div>
      <div class="cmd-log-list">
        ${(latest.logs || []).map(logLine).join("")}
      </div>
      ${desktopPlanActions(latest)}
      ${desktopExecutionQueuePanel()}`;
  }

  function desktopPlanActions(task){
    const meta = task && task.meta || {};
    if (meta.dispatchModule !== "desktopAssistant" && task && task.module !== "desktopAssistant") return "";
    const risk = meta.desktopRiskLevel || "low";
    const riskText = risk === "high" ? "高风险" : risk === "medium" ? "中风险" : "普通提示";
    return `<div class="desktop-plan-actions desktop-risk-${esc(risk)}" data-desktop-plan-actions="true">
      <div>
        <b>${esc(riskText)}桌面操作计划</b>
        <span>仅生成计划，未执行电脑操作。realExecution=false${meta.desktopRequiresSecondConfirm ? " · 必须二次确认" : ""}</span>
      </div>
      <div class="desktop-plan-buttons">
        <button class="cmd-btn gray" id="desktopPlanConfirm" type="button">确认计划</button>
        <button class="cmd-btn gray" id="desktopPlanCancel" type="button">取消计划</button>
        <button class="cmd-btn danger ghost" id="desktopPlanStop" type="button">停止接管</button>
      </div>
    </div>`;
  }

  function desktopExecutionQueuePanel(){
    const queue = desktopExecutionQueue();
    if (!queue || !Array.isArray(queue.steps) || !queue.steps.length) return "";
    const risk = queue.riskLevel || "low";
    const rows = queue.steps.map((step) => `<li class="desktop-queue-step desktop-risk-${esc(step.riskLevel || "low")}">
      <b>${esc(step.title)}</b>
      <span>${esc(step.description)} · ${esc(step.riskLevel)} · ${esc(step.status)} · realExecution=false</span>
    </li>`).join("");
    return `<div class="desktop-execution-queue desktop-risk-${esc(risk)}" data-desktop-execution-queue="true">
      <div class="desktop-execution-head">
        <div>
          <b>桌面助手执行队列</b>
          <span>状态：${esc(queue.status)} · simulated=${esc(queue.simulatedStepCount)} · blocked=${esc(queue.blockedStepCount)} · realExecution=false</span>
        </div>
        <div class="desktop-plan-buttons">
          <button class="cmd-btn gray" id="desktopQueueSimulate" type="button">模拟执行</button>
          <button class="cmd-btn gray" id="desktopQueueCancel" type="button">取消计划</button>
          <button class="cmd-btn danger ghost" id="desktopQueueStop" type="button">停止接管</button>
        </div>
      </div>
      <ol>${rows}</ol>
    </div>`;
  }

  function queuePanel(snapshot){
    const tasks = snapshot.queue || [];
    const pending = activeTasks(tasks);
    if (!pending.length) return `<div class="cmd-mini-empty">${t("homeEmptyQueue")}</div>`;

    return pending.map((task, idx) => `
      <div class="cmd-mini-task ${statusCls(task)}">
        <span class="cmd-mini-index">${idx + 1}</span>
        <div>
          <b>${esc(taskTitle(task))}</b>
          <p>${esc(task.text)}</p>
          <small>${esc(window.CommandApi.timeLabel(task.createdAt))}</small>
        </div>
      </div>
    `).join("");
  }

  function historyPanel(snapshot){
    const items = recentDone(snapshot.queue, snapshot.history);
    if (!items.length) return `<div class="cmd-mini-empty">${t("homeEmptyHistory")}</div>`;
    const selectedIndex = items.findIndex((task, idx) => taskKey(task, idx) === selectedHistoryId);
    if (selectedIndex >= 0) {
      const task = items[selectedIndex];
      const body = displayAnswer(task) || t("homeNoDisplayableAi");
      return `
        <div class="cmd-history-detail" id="cmdHistoryDetail">
          <div class="cmd-history-detail-head">
            <button class="cmd-history-back" id="historyBackBtn" type="button">‹ ${t("historyBack")}</button>
            <span class="cmd-pill ${statusCls(task)}">${esc(taskTitle(task))}</span>
          </div>
          <h4>${esc(task.text || t("historyDetail"))}</h4>
          <div class="cmd-history-meta">
            <span>${esc(taskTime(task))}</span>
            <span>${esc(taskTitle(task))}</span>
          </div>
          <p class="cmd-history-tip">${t("historyDoubleClickBack")}</p>
          <pre class="cmd-history-full">${esc(body)}</pre>
        </div>`;
    }
    return items.map((task, idx) => `
      <button class="cmd-history-item" data-history-id="${esc(taskKey(task, idx))}" type="button" title="${t("historyOpenDetail")}">
        <div>
          <b>${esc(task.text)}</b>
          <span class="cmd-history-meta">${esc(taskTime(task))} · ${esc(taskTitle(task))}</span>
          <p>${esc(summary(displayAnswer(task), 190))}</p>
        </div>
        <small>${esc(t("historyOpenDetail"))}</small>
      </button>
    `).join("");
  }

  function modulePanel(){
    return "";
  }

  function syncHomeTopbar(snapshot){
    const topbar = document.querySelector(".topbar");
    if (!topbar) return;
    const title = topbar.querySelector("h1");
    const subtitle = topbar.querySelector("p");
    const actions = topbar.querySelector(".top-actions");
    const lang = topbar.querySelector("#langSelect");
    if (title) title.textContent = "首页总调度";
    if (subtitle) subtitle.textContent = "本地优先 · 模块隔离 · A/B 模式";
    if (!actions || !lang) return;
    let status = actions.querySelector("#homeAiStatus");
    if (!status) {
      status = document.createElement("span");
      status.id = "homeAiStatus";
      status.className = "home-ai-status";
      actions.insertBefore(status, lang);
    }
    const label = String(snapshot && snapshot.brain || "");
    const connected = /^AI 已连接/.test(label);
    status.className = "home-ai-status " + (connected ? "is-connected" : "is-disconnected");
    status.textContent = connected ? label : "AI 未连接";
  }

  function syncHomeTopbarSoon(snapshot){
    syncHomeTopbar(snapshot);
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(function(){ syncHomeTopbar(snapshot); });
    }
    setTimeout(function(){ syncHomeTopbar(snapshot); }, 30);
  }

  function render(host){
    const snap = window.CommandApi.snapshot();
    syncHomeTopbarSoon(snap);

    host.innerHTML = `
      <section class="home-v205-page">
        <div class="home-v205-main">
          <div class="cmd-card cmd-console-card">
            <div class="cmd-console" id="cmdConsole">
              ${mainLogs(snap)}
            </div>
          </div>

          <div class="cmd-card cmd-input-card">
            <div class="cmd-card-title small-title">
              <h3>${t("homeInputTitle")}</h3>
            </div>
            ${desktopAssistantStrip()}
            ${attachmentPanel()}
            <textarea id="commandInput" class="cmd-input" placeholder="${t("homePlaceholder")}"></textarea>
            <div class="cmd-actions">
              <button class="cmd-btn gray" id="uploadBtn">${t("uploadAttachment")}</button>
              <button class="cmd-btn primary" id="runBtn">${t("startRun")}</button>
              <button class="cmd-btn danger" id="clearFinishedBtn">${t("clearDone")}</button>
              <button class="cmd-btn gray" id="recordBtn">${t("recordAudio")}</button>
            </div>
          </div>
        </div>

        <aside class="home-v205-side">
          ${modulePanel()}
          <div class="cmd-side-card">
            <h3>${t("queueTitle")}</h3>
            <div id="cmdQueue">${queuePanel(snap)}</div>
          </div>
          <div class="cmd-side-card">
            <h3>${t("dispatchHistory")}</h3>
            <div id="cmdHistory">${historyPanel(snap)}</div>
          </div>
        </aside>
      </section>
    `;

    bind(host);
  }

  function bind(host){
    const input = host.querySelector("#commandInput");
    const runBtn = host.querySelector("#runBtn");

    function submit(){
      let text = input.value.trim();
      if (!text && stagedAttachments.length) text = t("processAttachment") + stagedAttachments.map((file) => file.name).join(", ");
      if (!text && !stagedAttachments.length) return;
      const attachments = stagedAttachments.slice();
      window.CommandApi.enqueue(text, { attachments });
      input.value = "";
      stagedAttachments = [];
      input.focus();
      render(host);
    }

    runBtn.addEventListener("click", submit);

    const desktopEnable = host.querySelector("#desktopAssistantEnable");
    if (desktopEnable) desktopEnable.addEventListener("click", function(){
      const api = desktopAssistantApi();
      if (api && api.toggleDesktopAssistantForSession) api.toggleDesktopAssistantForSession(true);
      render(host);
    });

    const desktopDisable = host.querySelector("#desktopAssistantDisable");
    if (desktopDisable) desktopDisable.addEventListener("click", function(){
      const api = desktopAssistantApi();
      if (api && api.toggleDesktopAssistantForSession) api.toggleDesktopAssistantForSession(false);
      render(host);
    });

    function stopDesktopAssistant(){
      const api = desktopAssistantApi();
      const queue = api && api.stopDesktopAssistantExecution ? api.stopDesktopAssistantExecution() : null;
      const session = api && api.stopDesktopAssistantSession ? api.stopDesktopAssistantSession() : { enabled:false, status:"stopped" };
      const latest = latestDesktopTask();
      desktopAssistantHistory("desktopAssistant.stopped", Object.assign({}, queue || {}, {
        inputSummary:latest && (latest.inputSummary || latest.text) || "用户点击停止接管。",
        outputSummary:"桌面助手已停止。本轮未执行电脑操作。",
        riskLevel:"low",
        realExecution:false,
        createdAt:session && session.updatedAt || new Date().toISOString()
      }));
      render(host);
    }

    const desktopStop = host.querySelector("#desktopAssistantStop");
    if (desktopStop) desktopStop.addEventListener("click", stopDesktopAssistant);

    const desktopPlanStop = host.querySelector("#desktopPlanStop");
    if (desktopPlanStop) desktopPlanStop.addEventListener("click", stopDesktopAssistant);
    const desktopQueueStop = host.querySelector("#desktopQueueStop");
    if (desktopQueueStop) desktopQueueStop.addEventListener("click", stopDesktopAssistant);

    const desktopPlanConfirm = host.querySelector("#desktopPlanConfirm");
    if (desktopPlanConfirm) desktopPlanConfirm.addEventListener("click", function(){
      const api = desktopAssistantApi();
      const latest = latestDesktopTask();
      const meta = latest && latest.meta || {};
      const plan = api && api.createDesktopOperationPlan ? api.createDesktopOperationPlan(latest && (latest.inputSummary || latest.text) || "") : null;
      const queue = api && api.createDesktopExecutionQueue && plan ? api.createDesktopExecutionQueue(plan) : null;
      desktopAssistantHistory("desktopAssistant.planConfirmed", Object.assign({}, queue || plan || {}, {
        inputSummary:latest && latest.inputSummary || latest && latest.text || "确认桌面操作计划。",
        outputSummary:"用户已确认桌面操作计划；本轮仍不执行电脑操作。",
        riskLevel:meta.desktopRiskLevel || "low",
        stepCount:meta.desktopStepCount || 0,
        requiresSecondConfirm:meta.desktopRequiresSecondConfirm === true,
        realExecution:false
      }));
      if (queue) {
        desktopAssistantHistory("desktopAssistant.executionQueued", Object.assign({}, queue, {
          outputSummary:"桌面助手执行队列已生成；realExecution=false。"
        }));
        if (Number(queue.blockedStepCount || 0) > 0) {
          desktopAssistantHistory("desktopAssistant.executionBlocked", Object.assign({}, queue, {
            outputSummary:"高风险步骤已阻断，不允许模拟为已执行。"
          }));
        }
      }
      render(host);
    });

    const desktopPlanCancel = host.querySelector("#desktopPlanCancel");
    if (desktopPlanCancel) desktopPlanCancel.addEventListener("click", function(){
      const latest = latestDesktopTask();
      const meta = latest && latest.meta || {};
      desktopAssistantHistory("desktopAssistant.planCancelled", {
        inputSummary:latest && latest.inputSummary || latest && latest.text || "取消桌面操作计划。",
        outputSummary:"用户已取消桌面操作计划；未执行电脑操作。",
        riskLevel:meta.desktopRiskLevel || "low",
        stepCount:meta.desktopStepCount || 0,
        requiresSecondConfirm:meta.desktopRequiresSecondConfirm === true,
        realExecution:false
      });
      const api = desktopAssistantApi();
      if (api && api.clearDesktopExecutionQueue) api.clearDesktopExecutionQueue();
      render(host);
    });

    const desktopQueueCancel = host.querySelector("#desktopQueueCancel");
    if (desktopQueueCancel) desktopQueueCancel.addEventListener("click", function(){
      const queue = desktopExecutionQueue();
      desktopAssistantHistory("desktopAssistant.planCancelled", Object.assign({}, queue || {}, {
        outputSummary:"用户已取消桌面助手执行队列。"
      }));
      const api = desktopAssistantApi();
      if (api && api.clearDesktopExecutionQueue) api.clearDesktopExecutionQueue();
      render(host);
    });

    const desktopQueueSimulate = host.querySelector("#desktopQueueSimulate");
    if (desktopQueueSimulate) desktopQueueSimulate.addEventListener("click", function(){
      const api = desktopAssistantApi();
      const queue = api && api.simulateDesktopExecutionQueue ? api.simulateDesktopExecutionQueue(desktopExecutionQueue()) : null;
      if (queue) {
        desktopAssistantHistory("desktopAssistant.executionSimulated", Object.assign({}, queue, {
          outputSummary:"已完成桌面助手模拟执行；未真实控制电脑。"
        }));
        if (Number(queue.blockedStepCount || 0) > 0) {
          desktopAssistantHistory("desktopAssistant.executionBlocked", Object.assign({}, queue, {
            outputSummary:"高风险步骤保持 blocked，不执行。"
          }));
        }
      }
      render(host);
    });

    input.addEventListener("keydown", function(ev){
      if (ev.key === "Enter" && !ev.shiftKey) {
        ev.preventDefault();
        submit();
      }
    });

    const clearFinishedBtn = host.querySelector("#clearFinishedBtn");
    clearFinishedBtn.addEventListener("click", function(){
      window.CommandApi.clearFinished();
      render(host);
    });

    const uploadBtn = host.querySelector("#uploadBtn");
    uploadBtn.addEventListener("click", async function(){
      const chooseFiles = typeof window.__WEISHAN_TEST_CHOOSE_FILES__ === "function"
        ? window.__WEISHAN_TEST_CHOOSE_FILES__
        : window.weishan && typeof window.weishan.chooseFiles === "function"
          ? window.weishan.chooseFiles
          : null;
      if (chooseFiles) {
        const res = await chooseFiles();
        if (res && res.ok && res.files && res.files.length) {
          stagedAttachments = stagedAttachments.concat(res.files.map(normalizeAttachment)).slice(0, 8);
          render(host);
        }
      } else {
        alert(t("attachmentReserved"));
      }
    });

    Array.from(host.querySelectorAll("[data-remove-attachment]")).forEach((btn) => {
      btn.addEventListener("click", function(){
        const idx = Number(btn.getAttribute("data-remove-attachment"));
        stagedAttachments = stagedAttachments.filter((_, current) => current !== idx);
        render(host);
      });
    });

    const recordBtn = host.querySelector("#recordBtn");
    recordBtn.addEventListener("click", function(){
      alert(t("recordReserved"));
    });

    Array.from(host.querySelectorAll("[data-history-id]")).forEach((btn) => {
      btn.addEventListener("click", function(){
        selectedHistoryId = btn.getAttribute("data-history-id") || "";
        render(host);
      });
    });

    const historyBackBtn = host.querySelector("#historyBackBtn");
    if (historyBackBtn) historyBackBtn.addEventListener("click", function(){
      selectedHistoryId = "";
      render(host);
    });

    const historyDetail = host.querySelector("#cmdHistoryDetail");
    if (historyDetail) historyDetail.addEventListener("dblclick", function(){
      selectedHistoryId = "";
      render(host);
    });
  }

  function mount(host){
    render(host);
    if (!window.__WEISHAN_HOME_V205_BOUND__) {
      window.__WEISHAN_HOME_V205_BOUND__ = true;
      window.addEventListener("weishan:command", function(){
        const current = document.querySelector("#pageHost");
        if (current && window.WeishanRouter && window.WeishanRouter.current && window.WeishanRouter.current() === "home") {
          try { render(current); } catch (_) {}
        }
      });
    }
  }

  window.HomePage = { mount };
})();
