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
    return "";
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
