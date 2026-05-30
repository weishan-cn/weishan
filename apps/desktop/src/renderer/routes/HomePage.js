(function(){
  let selectedHistoryId = "";

  function esc(s){
    return String(s || "").replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; });
  }
  function t(key){ return window.I18n.t(key); }

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
    return `
      ${modelPanel()}
      <div class="cmd-side-card compact">
        <h3>${t("homeModulesTitle")}</h3>
        <p>${t("homeModulesList")}</p>
      </div>
      <div class="cmd-side-card compact">
        <h3>${t("homeBoundaryTitle")}</h3>
        <p>${t("homeBoundaryText")}</p>
      </div>
    `;
  }

  function modelInfo(){
    const router = window.WeishanDispatchRouter || {};
    const models = Array.isArray(router.AVAILABLE_MODELS) ? router.AVAILABLE_MODELS : [];
    const selectedId = router.selectedModelId ? router.selectedModelId() : "weishan-auto";
    const selected = router.modelById ? router.modelById(selectedId) : models.find((model) => model.id === selectedId);
    return {
      models,
      selected:selected || models[0] || { id:"weishan-auto", name:"weishan 自动选择", mode:"mock", description:"当前为本地模拟。" }
    };
  }

  function modelPanel(){
    const data = modelInfo();
    const options = data.models.length ? data.models : [data.selected];
    return `
      <div class="cmd-side-card compact" data-home-model-selector="true">
        <h3>模型选择</h3>
        <p class="cmd-history-meta">当前模型：${esc(data.selected.name)} · ${esc(data.selected.mode || "mock")}</p>
        <select id="homeModelSelect" class="ws-select">
          ${options.map((model) => `<option value="${esc(model.id)}" ${model.id === data.selected.id ? "selected" : ""}>${esc(model.name)}</option>`).join("")}
        </select>
        <p class="cmd-history-meta">模型由 weishan 后端统一管理，客户端不保存 provider key。当前为本地 mock-safe 模式，未接真实模型。</p>
      </div>`;
  }

  function render(host){
    const snap = window.CommandApi.snapshot();

    host.innerHTML = `
      <section class="home-v205-page">
        <div class="home-v205-main">
          <div class="cmd-card cmd-console-card">
            <div class="cmd-card-title">
              <div>
                <h2>${t("homeTitle")}</h2>
                <p>${t("homeSubtitle")}</p>
              </div>
              <span class="cmd-brain">${esc(snap.brain)}</span>
            </div>
            <div class="cmd-console" id="cmdConsole">
              ${mainLogs(snap)}
            </div>
          </div>

          <div class="cmd-card cmd-input-card">
            <div class="cmd-card-title small-title">
              <h3>${t("homeInputTitle")}</h3>
              <span>${t("homeInputHint")}</span>
            </div>
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
      const text = input.value.trim();
      if (!text) return;
      window.CommandApi.enqueue(text);
      input.value = "";
      input.focus();
      render(host);
    }

    runBtn.addEventListener("click", submit);

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

    const modelSelect = host.querySelector("#homeModelSelect");
    if (modelSelect) {
      modelSelect.addEventListener("change", function(){
        const router = window.WeishanDispatchRouter || {};
        const model = router.selectModel ? router.selectModel(modelSelect.value) : null;
        if (window.HistoryApi && typeof window.HistoryApi.record === "function") {
          window.HistoryApi.record("model.selected", {
            schemaVersion:"weishan.task.v1",
            module:"model",
            action:"selected",
            selectedModelId:model && model.id || modelSelect.value,
            selectedModelName:model && model.name || modelSelect.value,
            inputSummary:"首页模型选择",
            outputSummary:"已切换模型；当前为 mock-safe 模式，未接真实模型。",
            executionMode:"mock_safe",
            realExecution:false,
            createdAt:new Date().toISOString()
          });
        }
        render(host);
      });
    }

    const uploadBtn = host.querySelector("#uploadBtn");
    uploadBtn.addEventListener("click", async function(){
      if (window.weishan && typeof window.weishan.chooseFiles === "function") {
        const res = await window.weishan.chooseFiles();
        if (res && res.ok && res.files && res.files.length) {
          window.CommandApi.enqueue(t("processAttachment") + res.files.map((f) => f.name).join(", "));
          render(host);
        }
      } else {
        alert(t("attachmentReserved"));
      }
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
