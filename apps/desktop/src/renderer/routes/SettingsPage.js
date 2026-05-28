(function(){
  function esc(s){
    return String(s||"").replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; });
  }
  function t(key){ return window.I18n.t(key); }

  const providers = {
    openrouter:"OpenRouter",
    openai:"OpenAI",
    deepseek:"DeepSeek",
    anthropic:"Anthropic",
    gemini:"Google Gemini",
    doubao:"豆包 / Volcengine",
    dashscope:"通义千问 / DashScope",
    zhipu:"智谱 / Zhipu",
    moonshot:"Moonshot / Kimi",
    local:"Ollama / Local LLM",
    custom:""
  };

  function providerName(id){
    return id === "custom" || !id ? t("aiCustomProvider") : (providers[id] || t("aiCustomProvider"));
  }

  function detectProvider(input, responseText){
    const baseUrl = String(input && input.baseUrl || "").toLowerCase();
    const apiKey = String(input && input.apiKey || "");
    const model = String(input && input.chatModel || "").toLowerCase();
    const response = String(responseText || "").toLowerCase();

    if (/openrouter\.ai/.test(baseUrl)) return "openrouter";
    if (/api\.openai\.com/.test(baseUrl)) return "openai";
    if (/api\.deepseek\.com/.test(baseUrl)) return "deepseek";
    if (/anthropic\.com/.test(baseUrl)) return "anthropic";
    if (/generativelanguage\.googleapis\.com|googleapis\.com/.test(baseUrl)) return "gemini";
    if (/volcengine|doubao/.test(baseUrl)) return "doubao";
    if (/dashscope\.aliyuncs\.com/.test(baseUrl)) return "dashscope";
    if (/bigmodel\.cn/.test(baseUrl)) return "zhipu";
    if (/moonshot\.cn/.test(baseUrl)) return "moonshot";
    if (/localhost|127\.0\.0\.1|ollama/.test(baseUrl)) return "local";

    if (/^sk-or-/.test(apiKey)) return "openrouter";
    if (/^(openai|anthropic|deepseek)\//.test(model)) return "openrouter";
    if (/^deepseek-/.test(model)) return "deepseek";
    if (/^qwen-/.test(model)) return "dashscope";
    if (/^glm-/.test(model)) return "zhipu";
    if (/^(moonshot|kimi)-/.test(model)) return "moonshot";
    if (/openrouter/.test(response)) return "openrouter";
    if (/deepseek/.test(response)) return "deepseek";
    if (/dashscope|qwen/.test(response)) return "dashscope";
    if (/zhipu|bigmodel|glm/.test(response)) return "zhipu";
    return "custom";
  }

  function detectedText(input, responseText, inferred){
    return window.I18n.format(inferred ? "aiDetectedInferred" : "aiDetected", {
      provider:providerName(detectProvider(input, responseText))
    });
  }

  function sanitizeDetail(detail, input){
    let out = String(detail || "");
    const key = String(input && input.apiKey || "").trim();
    if (key) out = out.split(key).join("[API_KEY]");
    return out.slice(0, 600);
  }

  function classifyTestResult(input, res){
    const raw = sanitizeDetail(String((res && (res.message || res.error || res.raw)) || ""), input);
    const text = raw.toLowerCase();
    const providerType = detectProvider(input, raw);
    if (!input.baseUrl) return { ok:false, providerType, message:t("aiBaseUrlMissing"), detail:"" };
    if (!input.apiKey && !input.hasApiKey && !input.hasRequestApiKey) return { ok:false, providerType, message:t("aiKeyMissing"), detail:"" };
    if (!input.chatModel) return { ok:false, providerType, message:t("aiModelMissing"), detail:"" };
    if (res && res.ok) return { ok:true, providerType, message:detectedText(input, raw, true), detail:"" };
    if (/failed to fetch|fetch failed|econnrefused|enotfound|network|连接失败|无法连接/.test(text)) return { ok:false, providerType, message:t("aiNetworkFailed"), detail:raw };
    if (/401|unauthorized|invalid api key|invalid_api_key|incorrect api key|未授权|认证/.test(text)) return { ok:false, providerType, message:t("aiUnauthorized"), detail:raw };
    if (/403|prohibited|violation|terms of service|provider/.test(text)) return { ok:false, providerType, message:t("aiProviderRouteRejected"), detail:raw };
    if (/404|model not found|not found|模型不存在/.test(text)) return { ok:false, providerType, message:t("aiModelNotFound"), detail:raw };
    if (/rate limit|quota|insufficient credits|insufficient quota|too many requests|429|额度|频繁/.test(text)) return { ok:false, providerType, message:t("aiQuotaLimited"), detail:raw };
    if (/cannot post|cannot get|method not allowed|405|501|not openai|unsupported|unexpected token/i.test(raw)) return { ok:false, providerType, message:t("aiNotCompatible"), detail:raw };
    return { ok:false, providerType, message:t("testFailedHint"), detail:raw };
  }

  function normalizeModelsBaseUrl(value){
    let url = String(value || "").trim().replace(/\/+$/, "");
    url = url.replace(/\/chat\/completions$/i, "");
    url = url.replace(/\/models$/i, "");
    if (!url) return "";
    if (!/\/v1$/i.test(url)) url += "/v1";
    return url;
  }

  async function fetchModels(input){
    const base = normalizeModelsBaseUrl(input.baseUrl);
    if (!base) throw new Error(t("aiBaseUrlMissing"));
    const res = await fetch(base + "/models", {
      method:"GET",
      headers:{ Authorization:"Bearer " + input.apiKey }
    });
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch (_) {}
    if (!res.ok) throw new Error(sanitizeDetail((data && (data.error && data.error.message || data.message)) || text || ("HTTP " + res.status), input));
    const raw = Array.isArray(data) ? data : (Array.isArray(data && data.data) ? data.data : (Array.isArray(data && data.models) ? data.models : []));
    const ids = raw.map((item) => typeof item === "string" ? item : item && (item.id || item.name || item.model)).filter(Boolean);
    return Array.from(new Set(ids.map(String)));
  }

  function modelScore(model, providerType){
    const id = String(model || "").toLowerCase();
    let score = 100;
    if (/free|flash|mini|lite|small|deepseek|qwen/.test(id)) score -= 40;
    if (/gpt|claude|opus|sonnet|pro|preview/.test(id)) score += 30;
    if (providerType === "openrouter" && /\//.test(id)) score -= 5;
    if (/embedding|audio|image|vision|rerank|moderation|tts|whisper/.test(id)) score += 80;
    return score;
  }

  function candidateModels(models, providerType){
    return (models || [])
      .filter((id) => id && !/embedding|audio|image|rerank|moderation|tts|whisper/i.test(id))
      .sort((a, b) => modelScore(a, providerType) - modelScore(b, providerType) || String(a).localeCompare(String(b)))
      .slice(0, 10);
  }

  function renderTransientStatus(host, cls, title, text, detail){
    const box = host.querySelector("#connectorStatus");
    if (box) {
      box.className = "connector-status " + cls;
      box.innerHTML = `<div class="connector-status-title">${esc(title)}</div><div class="connector-status-text">${esc(text || "")}</div>${detail ? `<div class="connector-status-detail">${esc(window.I18n.format("aiRawDetail", { detail }))}</div>` : ""}`;
    }
    const pill = host.querySelector(".connector-pill");
    if (pill) {
      pill.textContent = title;
      pill.className = "connector-pill " + cls;
    }
  }

  function writeClassifiedTest(input, classified){
    return window.WeishanAPI.saveTest(input || {}, {
      ok:classified.ok,
      message:classified.message,
      testDetail:classified.detail || "",
      providerType:classified.providerType
    });
  }

  function statusView(c){
    const s = window.WeishanAPI.connectorStatus(c);
    if (s === "locked") return { cls:"connector-locked", title:t("loginRequired"), text:t("aiKeyPrivate") };
    if (s === "success") return { cls:"connector-success", title:t("aiServiceConnected"), text:(c.testMessage || detectedText(c, "", true)) + (c.testedAt ? " · " + c.testedAt : ""), detail:c.testDetail || "" };
    if (s === "failed") return { cls:"connector-failed", title:t("testFailed"), text:c.testMessage || t("testFailedHint"), detail:c.testDetail || "" };
    if (s === "saved") return { cls:"connector-saved", title:t("savedUntested"), text:t("savedUntestedHint") };
    return { cls:"connector-empty", title:t("aiNotConfigured"), text:t("aiNotConfiguredHint") };
  }

  function accountPanel(acc){
    if (acc.loggedIn) {
      return `
        <div class="account-logged">
          <div class="account-username">${esc(window.AccountApi.publicName(acc))}</div>
          <div class="account-id-line">${t("emailLabel")}：${esc(acc.email)}</div>
          <div class="account-id-line">${t("accountId")}：${esc(acc.accountId)}</div>
          <div class="account-sub">${t("loggedInAiSaved")}</div>
          <button class="ws-btn gray" id="logoutBtn2">${t("logoutAccount")}</button>
        </div>
        <div class="ws-card inner">
          <h3>${t("accountSecurity")}</h3>
          <p>${t("accountSecurityDesc")}</p>
          <button class="ws-btn gray" id="authBtn">${t("enableAuthenticator")}</button>
        </div>`;
    }

    return `
      <div class="local-login-warning">
        <b>${t("normalLoginTitle")}</b>
        <span>${t("normalLoginDesc")}</span>
      </div>

      <p class="ws-muted">
        ${t("localLoginReminder")}
      </p>

      <div class="ws-row">
        <input class="ws-input" id="accountEmail" placeholder="${t("accountEmailPlaceholder")}">
        <input class="ws-input" id="accountName" placeholder="${t("accountNamePlaceholder")}">
      </div>
      <div class="ws-row">
        <input class="ws-input" id="accountPassword" type="password" placeholder="${t("accountPasswordPlaceholder")}">
      </div>
      <div class="ws-row">
        <button class="ws-btn" id="registerBtn">${t("registerLogin")}</button>
        <button class="ws-btn green" id="loginBtn">${t("loginExisting")}</button>
        <button class="ws-btn gray" id="recoverBtn">${t("recoverPassword")}</button>
      </div>

      <div class="account-help">
        <div>${t("adminEmailHelp")}</div>
        <div>${t("userRegisterHelp")}</div>
      </div>

      <div class="ws-item account-status" id="accountStatus">${t("notLoggedIn")}</div>`;
  }

  function aiPanel(acc){
    if (!acc.loggedIn) {
      return `
        <div class="ws-card ai-locked-card">
          <div class="settings-title-row">
            <h2>${t("fusionTitle")}</h2>
            <span class="connector-pill connector-locked">${t("loginRequired")}</span>
          </div>
          <div class="ai-locked-box">
            <div class="ai-locked-icon">🔒</div>
            <div>
              <div class="ai-locked-title">${t("loginToConfigureAi")}</div>
              <div class="ai-locked-text">${t("aiLockedText")}</div>
            </div>
          </div>
        </div>`;
    }

    const c = window.WeishanAPI.connector();
    const st = statusView(c);
    const apiKeyPlaceholder = c.hasApiKey ? t("aiKeySavedPlaceholder") : "AI Key / API Key / Token";
    return `
      <div class="ws-card ai-simple-card">
        <div class="settings-title-row">
          <h2>${t("fusionTitle")}</h2>
          <span class="connector-pill ${st.cls}">${st.title}</span>
        </div>

        <div class="fusion-neutral-banner">
          <b>${t("neutralVendor")}</b>
          <span>${t("neutralVendorDesc")}</span>
        </div>

        <div class="simple-ai-steps">
          <div class="simple-step"><span>1</span><b>${t("pasteEndpoint")}</b></div>
          <div class="simple-step"><span>2</span><b>${t("pasteAiKey")}</b></div>
          <div class="simple-step"><span>3</span><b>${t("fillModelTest")}</b></div>
        </div>

        <input class="ws-input" id="endpointUrl" placeholder="${t("endpointPlaceholder")}" value="${esc(c.baseUrl)}">
        <input class="ws-input" id="apiKey" type="password" placeholder="${esc(apiKeyPlaceholder)}" value="">
        ${c.hasApiKey ? `<div class="connector-help">${t("aiKeySavedSecurely")}</div>` : ""}
        <input class="ws-input" id="chatModel" placeholder="${t("modelPlaceholder")}" value="${esc(c.chatModel)}">
        <div class="ai-provider-detect" id="providerDetect">${detectedText(c, "", false)}</div>

        <button type="button" class="advanced-toggle" id="advancedToggle">${t("advancedSettings")}</button>
        <div class="advanced-connector is-collapsed" id="advancedConnector">
          <input class="ws-input" id="embeddingModel" placeholder="${t("embeddingPlaceholder")}" value="${esc(c.embeddingModel)}">
          <div class="connector-help">${t("endpointHelp")}</div>
        </div>

        <div class="ws-row">
          <button class="ws-btn" id="saveConnector">${t("saveAiSettings")}</button>
          <button class="ws-btn green" id="testConnector">${t("testConnection")}</button>
          <button class="ws-btn gray" id="autoModelBtn">${t("autoSelectModel")}</button>
          <button class="ws-btn gray" id="clearConnector">${t("clear")}</button>
        </div>

        <div class="connector-status ${st.cls}" id="connectorStatus">
          <div class="connector-status-title">${st.title}</div>
          <div class="connector-status-text">${esc(st.text)}</div>
          ${st.detail ? `<div class="connector-status-detail">${esc(window.I18n.format("aiRawDetail", { detail:st.detail }))}</div>` : ""}
        </div>

        <div class="ws-card inner">
          <h3>${t("bModeReserved")}</h3>
          <p>${t("bModeDesc")}</p>
        </div>
      </div>`;
  }

  function readConnector(host){
    const current = window.WeishanAPI.connector();
    const typedApiKey = String(host.querySelector("#apiKey").value || "").trim();
    return {
      mode:"fusion",
      protocol:"auto",
      provider:"fusion",
      baseUrl:String(host.querySelector("#endpointUrl").value || "").trim(),
      apiKey:typedApiKey,
      hasApiKey:Boolean(current.hasApiKey),
      hasRequestApiKey:Boolean(current.hasApiKey || typedApiKey),
      chatModel:String(host.querySelector("#chatModel").value || "").trim(),
      embeddingModel:String(host.querySelector("#embeddingModel").value || "").trim(),
      providerType:detectProvider({
        baseUrl:String(host.querySelector("#endpointUrl").value || "").trim(),
        apiKey:typedApiKey,
        chatModel:String(host.querySelector("#chatModel").value || "").trim()
      })
    };
  }

  function renderStatus(host, c){
    const st = statusView(c);
    const box = host.querySelector("#connectorStatus");
    if (box) {
      box.innerHTML = `<div class="connector-status-title">${st.title}</div><div class="connector-status-text">${esc(st.text)}</div>${st.detail ? `<div class="connector-status-detail">${esc(window.I18n.format("aiRawDetail", { detail:st.detail }))}</div>` : ""}`;
      box.className = "connector-status " + st.cls;
    }
    const pill = host.querySelector(".connector-pill");
    if (pill) {
      pill.textContent = st.title;
      pill.className = "connector-pill " + st.cls;
    }
    const provider = host.querySelector("#providerDetect");
    if (provider) provider.textContent = detectedText(c, c.testDetail || c.testMessage || "", false);
  }

  function mount(host){
    const acc = window.AccountApi.current();
    host.innerHTML = `
      <section class="ws-page">
        <div class="ws-card">
          <h2>${t("settings")}</h2>
          <p class="ws-muted">${t("settingsDesc")}</p>
        </div>

        <div class="ws-grid-2">
          <div class="ws-card">
            <h2>${t("account")}</h2>
            ${accountPanel(acc)}
          </div>
          ${aiPanel(acc)}
        </div>

        <div class="ws-grid-2">
          <div class="ws-card">
            <h2>${t("cloudReserved")}</h2>
            <p>${t("baseUrl")}：${esc(window.WeishanConfig.backend.pocketbaseBaseUrl)}</p>
            <p>${t("collections")}：${esc(window.WeishanConfig.backend.collections.join(" / "))}</p>
            <p class="danger-text">${t("secretsWarning")}</p>
          </div>
          <div class="ws-card">
            <h2>${t("billingPermissions")}</h2>
            <p>${t("billingDesc")}</p>
            <p>free/pro → A；team/enterprise/institution → B。</p>
          </div>
        </div>
      </section>`;

    function accountInput(){
      return {
        email:(host.querySelector("#accountEmail") && host.querySelector("#accountEmail").value) || "",
        name:(host.querySelector("#accountName") && host.querySelector("#accountName").value) || "",
        password:(host.querySelector("#accountPassword") && host.querySelector("#accountPassword").value) || ""
      };
    }

    function status(text){
      const el = host.querySelector("#accountStatus");
      if (el) el.textContent = text;
    }

    const registerBtn = host.querySelector("#registerBtn");
    if (registerBtn) registerBtn.addEventListener("click", function(){
      const r = window.AccountApi.register(accountInput());
      if (!r.ok) status(r.error);
      else window.WeishanRouter.refresh();
    });

    const loginBtn = host.querySelector("#loginBtn");
    if (loginBtn) loginBtn.addEventListener("click", function(){
      const r = window.AccountApi.login(accountInput());
      if (!r.ok) status(r.error);
      else window.WeishanRouter.refresh();
    });

    const recoverBtn = host.querySelector("#recoverBtn");
    if (recoverBtn) recoverBtn.addEventListener("click", function(){
      const r = window.AccountApi.recover(accountInput());
      status(r.ok ? r.message : r.error);
    });

    const logoutBtn2 = host.querySelector("#logoutBtn2");
    if (logoutBtn2) logoutBtn2.addEventListener("click", function(){
      window.AccountApi.logout();
      window.WeishanRouter.refresh();
    });

    const authBtn = host.querySelector("#authBtn");
    if (authBtn) authBtn.addEventListener("click", function(){
      alert(t("authenticatorReserved"));
    });

    if (!acc.loggedIn) return;

    host.querySelector("#advancedToggle").addEventListener("click", function(){
      host.querySelector("#advancedConnector").classList.toggle("is-collapsed");
    });

    ["endpointUrl", "apiKey", "chatModel"].forEach(function(id){
      const el = host.querySelector("#" + id);
      if (!el) return;
      el.addEventListener("input", function(){
        const provider = host.querySelector("#providerDetect");
        if (provider) provider.textContent = detectedText(readConnector(host), "", false);
      });
    });

    if (window.WeishanAPI.syncApiKeyPresence) {
      window.WeishanAPI.syncApiKeyPresence().then(function(res){
        if (res && res.changed) window.WeishanRouter.refresh();
      });
    }

    host.querySelector("#saveConnector").addEventListener("click", async function(){
      const btn = host.querySelector("#saveConnector");
      btn.disabled = true;
      const saved = await window.WeishanAPI.saveConnector(readConnector(host));
      const apiKeyInput = host.querySelector("#apiKey");
      if (apiKeyInput) apiKeyInput.value = "";
      if (saved && saved.keyStorageMode === "secure") {
        renderTransientStatus(host, "connector-success", t("aiSettingsSaved"), t("aiKeySavedSecurely"), "");
      } else if (saved && saved.keyStorageMode === "session") {
        renderTransientStatus(host, "connector-success", t("aiServiceConnected"), t("aiSecureSessionOnly"), "");
      } else if (saved && saved.secureUnavailable) {
        renderTransientStatus(host, "connector-saved", t("aiSettingsSaved"), t("aiSettingsSavedKeyNotSaved"), "");
      } else if (!saved.hasApiKey && !readConnector(host).apiKey) {
        renderTransientStatus(host, "connector-saved", t("savedUntested"), t("aiKeyMissing"), "");
      } else {
        renderStatus(host, saved);
      }
      btn.disabled = false;
    });

    host.querySelector("#clearConnector").addEventListener("click", async function(){
      await window.WeishanAPI.clearConnector();
      window.WeishanRouter.refresh();
    });

    host.querySelector("#testConnector").addEventListener("click", async function(){
      const btn = host.querySelector("#testConnector");
      btn.disabled = true;
      btn.textContent = t("testing");

      const input = readConnector(host);
      if (!input.baseUrl || !input.chatModel) {
        const classified = classifyTestResult(input, { ok:false, message:"" });
        renderStatus(host, writeClassifiedTest(input, classified));
        btn.disabled = false;
        btn.textContent = t("testConnection");
        return;
      }

      const requestInput = await window.WeishanAPI.connectorForRequest(input);
      if (!requestInput.apiKey) {
        const classified = classifyTestResult(Object.assign({}, input, { hasApiKey:false, hasRequestApiKey:false }), { ok:false, message:"" });
        renderStatus(host, writeClassifiedTest(input, classified));
        btn.disabled = false;
        btn.textContent = t("testConnection");
        return;
      }

      const res = await window.weishan.ai.testConnector(requestInput);
      const classified = classifyTestResult(requestInput, res);
      let savedKey = null;
      if (classified.ok && input.apiKey) {
        savedKey = await window.WeishanAPI.saveConnector(input);
      }
      renderStatus(host, writeClassifiedTest(Object.assign({}, requestInput, { hasApiKey:savedKey ? savedKey.hasApiKey : requestInput.hasApiKey }), classified));
      if (classified.ok && savedKey && savedKey.secureSessionOnly) {
        renderTransientStatus(host, "connector-success", t("aiServiceConnected"), t("aiSecureSessionOnly"), "");
      } else if (classified.ok && savedKey && savedKey.secureUnavailable) {
        renderTransientStatus(host, "connector-success", t("aiServiceConnected"), t("aiSecureTestOnly"), "");
      }

      btn.disabled = false;
      btn.textContent = t("testConnection");
    });

    host.querySelector("#autoModelBtn").addEventListener("click", async function(){
      const btn = host.querySelector("#autoModelBtn");
      const testBtn = host.querySelector("#testConnector");
      const modelInput = host.querySelector("#chatModel");
      const input = readConnector(host);
      if (!input.baseUrl) {
        const classified = classifyTestResult(input, { ok:false, message:"" });
        renderTransientStatus(host, "connector-failed", t("testFailed"), classified.message, classified.detail);
        return;
      }

      btn.disabled = true;
      if (testBtn) testBtn.disabled = true;
      btn.textContent = t("aiFetchingModels");
      renderTransientStatus(host, "connector-saved", t("savedUntested"), t("aiFetchingModels"), "");

      try {
        const resolvedInput = await window.WeishanAPI.connectorForRequest(input);
        if (!resolvedInput.apiKey) {
          renderTransientStatus(host, "connector-failed", t("testFailed"), t("aiKeyMissing"), "");
          btn.disabled = false;
          if (testBtn) testBtn.disabled = false;
          btn.textContent = t("autoSelectModel");
          return;
        }
        const providerType = detectProvider(resolvedInput);
        const models = candidateModels(await fetchModels(resolvedInput), providerType);
        if (!models.length) throw new Error(t("aiModelsUnavailable"));

        let last = null;
        for (const model of models) {
          btn.textContent = window.I18n.format("aiTestingModel", { model });
          renderTransientStatus(host, "connector-saved", t("savedUntested"), window.I18n.format("aiTestingModel", { model }), "");
          const testInput = Object.assign({}, resolvedInput, { chatModel:model, providerType });
          const res = await window.weishan.ai.testConnector(testInput);
          const classified = classifyTestResult(testInput, res);
          last = classified;

          if (classified.ok) {
            modelInput.value = model;
            renderTransientStatus(host, "connector-success", t("aiServiceConnected"), window.I18n.format("aiSelectedModel", { model }), "");
            const provider = host.querySelector("#providerDetect");
            if (provider) provider.textContent = detectedText(readConnector(host), "", false);
            btn.disabled = false;
            if (testBtn) testBtn.disabled = false;
            btn.textContent = t("autoSelectModel");
            return;
          }

          if (classified.message === t("aiUnauthorized") || classified.message === t("aiNetworkFailed")) {
            renderTransientStatus(host, "connector-failed", t("testFailed"), classified.message, classified.detail);
            btn.disabled = false;
            if (testBtn) testBtn.disabled = false;
            btn.textContent = t("autoSelectModel");
            return;
          }
        }

        renderTransientStatus(host, "connector-failed", t("testFailed"), t("aiNoModelFound"), last && last.detail || "");
      } catch (err) {
        const detail = sanitizeDetail(err && err.message || String(err), input);
        const message = /fetch|network|failed|enotfound|econnrefused/i.test(detail) ? t("aiNetworkFailed") : t("aiModelsUnavailable");
        renderTransientStatus(host, "connector-failed", t("testFailed"), message, detail);
      }

      btn.disabled = false;
      if (testBtn) testBtn.disabled = false;
      btn.textContent = t("autoSelectModel");
    });
  }

  window.SettingsPage = { mount };
})();
