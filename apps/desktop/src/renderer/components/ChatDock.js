(function(){
  const KEY = "weishan.v19.chatCollapsed";

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  }

  function msg(role, text) {
    return `<div class="chat-message ${role}"><div class="chat-role">${role === "user" ? "You" : "weishan"}</div><div class="chat-text">${escapeHtml(text)}</div></div>`;
  }

  function html() {
    return `<aside class="chat-dock"><button class="chat-collapse-tab" id="chatCollapse" type="button">›</button><div class="chat-head"><div><div class="chat-title">${window.I18n.t("chat.title")}</div><div class="chat-subtitle">${window.I18n.t("chat.subtitle")}</div></div><button class="chat-clear" id="chatClear" type="button">${window.I18n.t("chat.clear")}</button></div><div class="chat-context">当前页面：<b id="chatRouteName"></b></div><div class="chat-log" id="chatLog"></div><div class="chat-input-row"><textarea id="chatInput" class="chat-input" placeholder="告诉 Weishan 你想做什么"></textarea><button id="chatSend" class="chat-send" type="button">开始</button></div></aside>`;
  }

  function setCollapsed(shell, collapsed) {
    shell.classList.toggle("chat-collapsed", collapsed);
    localStorage.setItem(KEY, collapsed ? "1" : "0");
    const b = document.getElementById("chatCollapse");
    if (b) b.textContent = collapsed ? "‹" : "›";
  }

  function append(role, text) {
    const log = document.getElementById("chatLog");
    if (!log) return;
    log.insertAdjacentHTML("beforeend", msg(role, text));
    log.scrollTop = log.scrollHeight;
  }

  function updateRoute() {
    const el = document.getElementById("chatRouteName");
    if (el) el.textContent = window.WeishanModules.route(window.WeishanRouter.current()).label;
  }

  async function send() {
    const input = document.getElementById("chatInput");
    const sendBtn = document.getElementById("chatSend");
    const text = input.value.trim();
    if (!text) return;

    append("user", text);
    input.value = "";
    sendBtn.disabled = true;
    sendBtn.textContent = "...";

    try {
      const out = await window.CommandApi.execute(text);
      const r = out.results && out.results[0];
      append("assistant", r ? `${r.summary}\n${r.detail}` : "已完成。");
    } catch (err) {
      append("assistant", "失败，请重试。");
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = "开始";
    }
  }

  function mount(root) {
    root.insertAdjacentHTML("beforeend", html());
    const shell = document.getElementById("shell");
    setCollapsed(shell, localStorage.getItem(KEY) === "1");
    document.getElementById("chatCollapse").addEventListener("click", () => setCollapsed(shell, !shell.classList.contains("chat-collapsed")));
    document.getElementById("chatSend").addEventListener("click", send);
    document.getElementById("chatInput").addEventListener("keydown", (ev) => { if (ev.key === "Enter" && (ev.metaKey || ev.ctrlKey)) send(); });
    document.getElementById("chatClear").addEventListener("click", () => { document.getElementById("chatLog").innerHTML = ""; append("assistant", window.I18n.t("chat.hello")); });
    append("assistant", window.I18n.t("chat.hello"));
    updateRoute();
  }

  function refreshText() { updateRoute(); }

  window.ChatDock = { mount, refreshText, updateRoute };
})();
