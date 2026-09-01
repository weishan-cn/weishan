(function(){
  if (!window.WeishanCommerceLocationPolicy && typeof document !== "undefined" && document.currentScript && document.write) {
    document.write('<scr' + 'ipt src="./renderer/core/commerceLocationPolicy.js?v=2.0.31"></scr' + 'ipt>');
  }

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
    if (!window.weishan || !window.weishan.ai || typeof window.weishan.ai.listModels !== "function") throw new Error(t("aiModelsUnavailable"));
    const res = await window.weishan.ai.listModels(input);
    if (!res || !res.ok) throw new Error(sanitizeDetail(res && (res.error || res.message) || t("aiModelsUnavailable"), input));
    return Array.isArray(res.models) ? res.models.map(String) : [];
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
    const summary = window.WeishanAPI.connectorSummary ? window.WeishanAPI.connectorSummary(c) : null;
    const rawStatus = summary ? summary.rawStatus || summary.status : window.WeishanAPI.connectorStatus(c);
    const state = summary ? summary.state : (rawStatus === "success" ? "connected" : rawStatus === "failed" ? "failed" : rawStatus === "saved" ? "saved_untested" : "not_configured");
    if (rawStatus === "locked") return { cls:"connector-locked", title:t("loginRequired"), text:t("aiKeyPrivate") };
    if (state === "connected") return { cls:"connector-success", title:t("aiServiceConnected"), text:(c.testMessage || detectedText(c, "", true)) + (c.testedAt ? " · " + c.testedAt : ""), detail:c.testDetail || "" };
    if (state === "testing") return { cls:"connector-saved", title:t("testing"), text:t("aiFetchingModels") };
    if (state === "failed") return { cls:"connector-failed", title:t("testFailed"), text:c.testMessage || t("testFailedHint"), detail:c.testDetail || "" };
    if (state === "saved_untested") return { cls:"connector-saved", title:t("savedUntested"), text:t("savedUntestedHint") };
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
        <button type="button" class="ws-btn auth-action-button auth-action-primary account-action-btn account-action-register" id="registerBtn" data-account-action="register">${t("registerLogin")}</button>
        <button type="button" class="ws-btn auth-action-button auth-action-success account-action-btn account-action-login" id="loginBtn" data-account-action="login">${t("loginExisting")}</button>
        <button type="button" class="ws-btn auth-action-button auth-action-secondary account-action-btn account-action-recover" id="recoverBtn" data-account-action="recover">${t("recoverPassword")}</button>
      </div>

      <div class="account-help">
        <div>${t("adminEmailHelp")}</div>
        <div>${t("userRegisterHelp")}</div>
      </div>

      <div class="ws-item account-status" id="accountStatus" aria-live="polite">${t("notLoggedIn")}</div>`;
  }

  function simpleList(items){
    return "<ul>" + (Array.isArray(items) ? items : []).map(function(item){
      return "<li>" + esc(typeof item === "string" ? item : JSON.stringify(item)) + "</li>";
    }).join("") + "</ul>";
  }

  function objectList(obj){
    return "<ul>" + Object.keys(obj || {}).map(function(key){
      return "<li>" + esc(key) + ": " + esc(String(obj[key])) + "</li>";
    }).join("") + "</ul>";
  }

  function settingsNoSecretPersistenceGuardPanel(){
    const api = window.WeishanCommerceNoSecretPersistenceGuard;
    const state = api && typeof api.buildNoSecretPersistenceGuard === "function" ? api.buildNoSecretPersistenceGuard() : {
      display:{ title:"no-secret persistence guard", establishedLine:"guard 已建立", statusLine:"status: local static scan only", modeLine:"mode: no real secret access", realKeyLine:"real API key read disabled", keychainLine:"Keychain access disabled", safeStorageLine:"safeStorage access disabled", envLine:".env secret write forbidden", localStorageLine:"localStorage secret write forbidden", sessionStorageLine:"sessionStorage secret write forbidden", rawPasswordLine:"raw password persistence forbidden", rawTokenLine:"raw token display forbidden", rawApiKeyLine:"rawApiKey display forbidden", providerCredentialLine:"provider credential persistence forbidden", endpointSecretLine:"endpoint secret persistence forbidden", scanResultLine:"scanResult: PASS", redactedLine:"redacted: true" },
      scanScope:["repo source files", "renderer modules", "account module", "commerce modules", "tests", "scripts", "package scripts", "docs / standards", "exclude node_modules", "exclude dist", "exclude user app data", "exclude Keychain", "exclude safeStorage", "exclude real environment secrets"],
      blockedPatterns:["localStorage.setItem apiKey", "localStorage.setItem token", "localStorage.setItem password", "sessionStorage.setItem apiKey", "sessionStorage.setItem token", "sessionStorage.setItem password", "writeFile .env", "rawApiKey display", "rawToken display", "raw password display", "Keychain secret read", "safeStorage secret read", "provider credential persisted", "endpoint secret persisted"],
      currentScanResult:{ scanResult:"PASS", blockedPatternCount:0, realSecretReadCount:0, keychainAccessCount:0, safeStorageAccessCount:0, envSecretWriteCount:0, localStorageSecretWriteCount:0, sessionStorageSecretWriteCount:0, rawPasswordPersistenceCount:0, rawApiKeyDisplayCount:0, providerCredentialPersistedCount:0, endpointSecretPersistedCount:0, redacted:true },
      audit:{ noSecretPersistenceGuardAuditDraft:{ eventType:"NO_SECRET_PERSISTENCE_GUARD_SCAN_DRAFT", redacted:true } }
    };
    const display = state.display || {};
    return `<details class="settings-evidence-disclosure commerce-no-secret-persistence-guard-disclosure">
      <summary>查看 no-secret persistence guard</summary>
      <section class="settings-evidence-panel">
        <h3>${esc(display.title || "no-secret persistence guard")}</h3>
        <p>${esc(display.establishedLine || "guard 已建立")}</p>
        <p>${esc(display.statusLine || "status: local static scan only")}</p>
        <p>${esc(display.modeLine || "mode: no real secret access")}</p>
        <p>${esc(display.realKeyLine || "real API key read disabled")}</p>
        <p>${esc(display.keychainLine || "Keychain access disabled")}</p>
        <p>${esc(display.safeStorageLine || "safeStorage access disabled")}</p>
        <p>${esc(display.envLine || ".env secret write forbidden")}</p>
        <p>${esc(display.localStorageLine || "localStorage secret write forbidden")}</p>
        <p>${esc(display.sessionStorageLine || "sessionStorage secret write forbidden")}</p>
        <p>${esc(display.rawPasswordLine || "raw password persistence forbidden")}</p>
        <p>${esc(display.rawTokenLine || "raw token display forbidden")}</p>
        <p>${esc(display.rawApiKeyLine || "rawApiKey display forbidden")}</p>
        <p>${esc(display.providerCredentialLine || "provider credential persistence forbidden")}</p>
        <p>${esc(display.endpointSecretLine || "endpoint secret persistence forbidden")}</p>
        <p>${esc(display.scanResultLine || "scanResult: PASS")}</p>
        <p>${esc(display.redactedLine || "redacted: true")}</p>
        <h4>scan scope 草案</h4>${simpleList(state.scanScope || [])}
        <h4>blocked persistence patterns</h4>${simpleList(state.blockedPatterns || [])}
        <h4>current scan result 草案</h4>${objectList(state.currentScanResult || {})}
        <h4>审计事件草案</h4><p>noSecretPersistenceGuardAuditDraft</p><p>redacted: true</p>
      </section>
    </details>`;
  }

  function settingsAuthLocalSecurityEvidencePanel(){
    const api = window.WeishanSettingsAuthLocalSecurityEvidence;
    const state = api && typeof api.buildSettingsAuthLocalSecurityEvidence === "function" ? api.buildSettingsAuthLocalSecurityEvidence() : {
      display:{ title:"settings auth local security evidence", establishedLine:"evidence 已建立", statusLine:"status: local auth evidence only", modeLine:"mode: no cloud auth", registerLine:"local register enabled", loginLine:"local login enabled", recoveryLine:"local recovery notice enabled", verifierLine:"passwordVerifier enabled", migrationLine:"legacy plain password migration compatible", emailLine:"real email sending disabled", networkLine:"real network disabled", keyLine:"real key read disabled", redactedLine:"redacted: true" },
      accountLocalObjectDraft:{ accountId:"local account id", emailAlias:"local email alias", passwordVerifier:"enabled", schemaVersion:"2.1.15", redacted:true },
      recoveryNoticeDraft:["本地模式不联网", "本地模式不发邮件", "本地模式不读取密钥", "本地模式不连接云账号", "找回密码不会清空表单", "找回密码不会跳路由", "找回密码不会发送真实邮件", "找回密码不会读取 API key", "找回密码不会触发 provider 连接"],
      authSafetyBoundaries:["raw password display forbidden", "raw password persistence forbidden", "passwordVerifier only", "raw token display forbidden", "rawApiKey display forbidden", "real API key input disabled", "real endpoint test disabled", "Keychain disabled", "safeStorage disabled", "cloud auth disabled", "provider auth disabled"],
      audit:{ settingsAuthLocalSecurityEvidenceAuditDraft:{ eventType:"SETTINGS_AUTH_LOCAL_SECURITY_EVIDENCE_DRAFT", redacted:true } }
    };
    const display = state.display || {};
    return `<details class="settings-evidence-disclosure commerce-settings-auth-local-security-evidence-disclosure">
      <summary>查看 settings auth local security evidence</summary>
      <section class="settings-evidence-panel">
        <h3>${esc(display.title || "settings auth local security evidence")}</h3>
        <p>${esc(display.establishedLine || "evidence 已建立")}</p>
        <p>${esc(display.statusLine || "status: local auth evidence only")}</p>
        <p>${esc(display.modeLine || "mode: no cloud auth")}</p>
        <p>${esc(display.registerLine || "local register enabled")}</p>
        <p>${esc(display.loginLine || "local login enabled")}</p>
        <p>${esc(display.recoveryLine || "local recovery notice enabled")}</p>
        <p>${esc(display.verifierLine || "passwordVerifier enabled")}</p>
        <p>${esc(display.migrationLine || "legacy plain password migration compatible")}</p>
        <p>${esc(display.emailLine || "real email sending disabled")}</p>
        <p>${esc(display.networkLine || "real network disabled")}</p>
        <p>${esc(display.keyLine || "real key read disabled")}</p>
        <p>${esc(display.redactedLine || "redacted: true")}</p>
        <h4>account local object 草案</h4>${objectList(state.accountLocalObjectDraft || {})}
        <h4>recovery notice 草案</h4>${simpleList(state.recoveryNoticeDraft || [])}
        <h4>auth safety boundaries</h4>${simpleList(state.authSafetyBoundaries || [])}
        <h4>审计事件草案</h4><p>settingsAuthLocalSecurityEvidenceAuditDraft</p><p>redacted: true</p>
      </section>
    </details>`;
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

  const LOCAL_STORAGE_WARNING = "当前使用本地存储模式，数据仅保存在本地电脑。若电脑损坏、丢失、卸载或清理缓存，数据可能无法恢复；但不影响其他本地功能使用。可在设置中开启云备份或自有云。";

  function safeJson(value, fallback){
    try { return JSON.parse(value); } catch (_) { return fallback; }
  }

  function enterprisePlansFallback(){
    if (window.PlansData && window.PlansData.byType) return window.PlansData.byType("enterprise");
    return [
      { plan_id:"CN_ENTERPRISE_BASIC", plan_name:"中国区企业基础版", region:"CN", storage_quota_gb:300, member_limit:5, monthly_price:299, yearly_price:2999, currency:"CNY" },
      { plan_id:"CN_ENTERPRISE_STANDARD", plan_name:"中国区企业标准版", region:"CN", storage_quota_gb:1024, member_limit:20, monthly_price:699, yearly_price:6999, currency:"CNY" },
      { plan_id:"CN_ENTERPRISE_PRO", plan_name:"中国区企业高级版", region:"CN", storage_quota_gb:5120, member_limit:50, monthly_price:1999, yearly_price:19999, currency:"CNY" },
      { plan_id:"GLOBAL_ENTERPRISE_BASIC", plan_name:"Global Enterprise Basic", region:"GLOBAL", storage_quota_gb:300, member_limit:5, monthly_price:49, yearly_price:499, currency:"USD" },
      { plan_id:"GLOBAL_ENTERPRISE_STANDARD", plan_name:"Global Enterprise Standard", region:"GLOBAL", storage_quota_gb:1024, member_limit:20, monthly_price:99, yearly_price:999, currency:"USD" },
      { plan_id:"GLOBAL_ENTERPRISE_PRO", plan_name:"Global Enterprise Pro", region:"GLOBAL", storage_quota_gb:5120, member_limit:50, monthly_price:299, yearly_price:2999, currency:"USD" }
    ];
  }

  function planByIdFallback(planId){
    return enterprisePlansFallback().find(function(plan){ return (plan.plan_id || plan.planId) === planId; }) || enterprisePlansFallback()[0];
  }

  function cloudState(){
    return window.WeishanStore.read("cloud.settings.mock.v1", {
      organizationId:"local-company",
      allocation:null,
      members:[]
    });
  }

  function writeCloudState(next){
    window.WeishanStore.write("cloud.settings.mock.v1", next);
  }

  function activeMemberCount(members){
    return (members || []).filter(function(member){ return member && member.status === "active"; }).length;
  }

  function mockOrganizationStatus(planId){
    const state = cloudState();
    const plan = planByIdFallback(planId || (state.allocation && state.allocation.planId) || "CN_ENTERPRISE_BASIC");
    const quotaGb = Number(plan.storage_quota_gb || plan.storageQuotaGb || 0);
    return {
      ok:true,
      organizationId:state.organizationId,
      planId:plan.plan_id || plan.planId,
      memberLimit:Number(plan.member_limit || plan.memberLimit || 0),
      activeMemberCount:activeMemberCount(state.members),
      storageQuotaGb:quotaGb,
      quotaGb,
      quotaBytes:quotaGb * 1024 * 1024 * 1024,
      pathPrefix:"organizations/" + state.organizationId + "/",
      provider:"local_mock",
      storageMode:"local_mock",
      storageStatus:{ mode:state.allocation ? "mock_cloud_allocated" : "local_only", quotaGb }
    };
  }

  function mockAllocateStorage(planId){
    const state = cloudState();
    const plan = planByIdFallback(planId || "CN_ENTERPRISE_BASIC");
    const quotaGb = Number(plan.storage_quota_gb || plan.storageQuotaGb || 0);
    const allocation = {
      ok:true,
      mock:true,
      planId:plan.plan_id || plan.planId,
      quotaGb,
      quotaBytes:quotaGb * 1024 * 1024 * 1024,
      pathPrefix:"organizations/" + state.organizationId + "/",
      provider:"local_mock",
      storageMode:"local_mock"
    };
    writeCloudState(Object.assign({}, state, { allocation }));
    return allocation;
  }

  function mockInviteMember(input){
    const state = cloudState();
    const status = mockOrganizationStatus(input.planId || "CN_ENTERPRISE_BASIC");
    if (status.activeMemberCount >= status.memberLimit) {
      return {
        ok:false,
        code:"MEMBER_LIMIT_REACHED",
        message:"当前企业套餐最多支持 " + status.memberLimit + " 名成员。如需继续邀请，请升级企业套餐。",
        memberLimit:status.memberLimit,
        activeMemberCount:status.activeMemberCount,
        ignoredStatuses:["invited", "removed", "rejected", "expired"]
      };
    }
    const member = {
      memberId:"mock-member-" + Date.now().toString(36),
      email:String(input.email || "").trim(),
      role:input.role || "member",
      status:"invited",
      createdAt:new Date().toISOString()
    };
    writeCloudState(Object.assign({}, state, { members:(state.members || []).concat(member) }));
    return { ok:true, result:"invited", member, memberLimit:status.memberLimit, activeMemberCount:status.activeMemberCount };
  }

  async function cloudRequest(path, options, fallback){
    const apiBase = (window.WeishanAPI && window.WeishanAPI.apiBase) || "http://127.0.0.1:8787";
    try {
      const controller = new AbortController();
      const timer = setTimeout(function(){ controller.abort(); }, 900);
      const res = await fetch(apiBase + path, Object.assign({ signal:controller.signal }, options || {}));
      clearTimeout(timer);
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } catch (_) {
      return fallback();
    }
  }

  function cloudHistory(type, payload){
    if (!window.HistoryApi || !window.HistoryApi.record) return;
    const safe = Object.assign({
      schemaVersion:"weishan.task.v1",
      module:"cloud",
      createdAt:new Date().toISOString()
    }, payload || {});
    window.HistoryApi.record(type, safe);
  }

  function cloudEnterprisePanel(){
    return `
      <div class="ws-card" id="cloudEnterpriseSettings">
        <h2>${t("settingsCloudTitle")}</h2>
        <p class="ws-muted">${t("settingsStorageMode")}：<b id="cloudStorageMode">${t("settingsLocalStorage")}</b> / weishan 云存储 / 自有云</p>
        <p class="danger-text">${LOCAL_STORAGE_WARNING}</p>
        <p class="ws-muted">Metadata provider / Storage provider 当前为 local mock。PocketBase 和 S3-compatible 仅作为可替换 provider skeleton，不是默认供应商。</p>
        <div class="ws-row">
          <button class="ws-btn" id="loadCloudPlans">${t("settingsReadPlans")}</button>
          <button class="ws-btn green" id="loadCloudStatus">${t("settingsReadCloudStatus")}</button>
          <button class="ws-btn gray" id="allocateCloudStorage">${t("settingsAllocateCloud")}</button>
        </div>
        <div class="ws-item" id="cloudPlanList">${t("settingsPlansPending")}</div>
        <div class="ws-item" id="cloudStatusBox">${t("settingsCloudStatusPending")}</div>
        <div class="ws-row">
          <input class="ws-input" id="cloudInviteEmail" placeholder="成员邮箱，例如 e2e-cloud@example.com">
          <select class="ws-input" id="cloudInviteRole">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
          <button class="ws-btn" id="cloudInviteMember">${t("settingsInviteMember")}</button>
        </div>
        <div class="ws-item" id="cloudInviteResult">${t("settingsInvitePending")}</div>
        <p class="ws-muted">扩容入口预留：云空间不够时未来可单独购买扩容包，本轮不接真实付款。</p>
      </div>`;
  }

  function desktopAssistantApi(){
    return window.WeishanDesktopAssistant || null;
  }

  function desktopAssistantSettings(){
    const api = desktopAssistantApi();
    return api && api.getDesktopAssistantSettings ? api.getDesktopAssistantSettings() : {
      enabled:false,
      allowPlanGeneration:true,
      allowKeyboardInput:false,
      allowMouseClick:false,
      allowScreenRead:false,
      requireSecondConfirmForHighRisk:true,
      autoStopAfterMinutes:30
    };
  }

  function desktopAssistantSession(){
    const api = desktopAssistantApi();
    return api && api.getDesktopAssistantSession ? api.getDesktopAssistantSession() : { enabled:false, status:"closed" };
  }

  function checked(value){
    return value ? " checked" : "";
  }

  function settingsUserControlApi(){
    return window.WeishanSettingsUserControl || null;
  }

  function settingsUserControlPanel(){
    const api = settingsUserControlApi();
    const settings = api && api.getSettings ? api.getSettings() : { analyticsEnabled:false, appearance:"system" };
    const analyticsState = settings.analyticsEnabled ? "已开启 / On" : "已关闭 / Off";
    return `
      <div class="ws-card settings-user-control" id="settingsUserControlPanel" data-settings-user-control="true">
        <div class="settings-title-row">
          <h2>偏好与隐私 / Preferences & Privacy</h2>
          <span class="connector-pill ${settings.analyticsEnabled ? "connector-saved" : "connector-empty"}" id="analyticsPreferenceState">${esc(analyticsState)}</span>
        </div>
        <p class="ws-muted">这里放可理解、可撤回的本地偏好。复杂连接与内部安全状态会留在后台，不打扰日常使用。</p>
        <section class="settings-control-group" aria-labelledby="analyticsPreferenceTitle">
          <h3 id="analyticsPreferenceTitle">匿名产品改进 / Anonymous product improvement</h3>
          <label class="settings-switch" for="anonymousAnalyticsToggle">
            <input type="checkbox" id="anonymousAnalyticsToggle" role="switch" aria-describedby="anonymousAnalyticsHelp"${checked(settings.analyticsEnabled)}>
            <span>帮助改进 Weishan，分享匿名使用数据。</span>
          </label>
          <p class="ws-muted" id="anonymousAnalyticsHelp">Help improve Weishan with anonymous usage signals. It does not collect query text, Mail content, saved keys, full URLs, account identity, IP addresses, or device fingerprints. 不收集搜索原文、邮件内容、已保存密钥、完整 URL、账号身份、IP 或设备指纹。</p>
          <div class="ws-row">
            <button type="button" class="ws-btn gray" id="resetAnonymousAnalytics">重置匿名分析身份 / Reset anonymous analytics</button>
          </div>
          <p class="ws-muted" id="analyticsPreferenceResult" role="status" aria-live="polite">核心功能无需开启此项。</p>
        </section>
        <section class="settings-control-group" aria-labelledby="displayPreferenceTitle">
          <h3 id="displayPreferenceTitle">显示 / Display</h3>
          <label for="appearancePreference">外观 / Appearance</label>
          <select class="ws-input" id="appearancePreference" aria-describedby="appearancePreferenceHelp">
            <option value="system"${settings.appearance === "system" ? " selected" : ""}>跟随系统 / System</option>
            <option value="light"${settings.appearance === "light" ? " selected" : ""}>浅色 / Light</option>
            <option value="dark"${settings.appearance === "dark" ? " selected" : ""}>深色 / Dark</option>
          </select>
          <p class="ws-muted" id="appearancePreferenceHelp">保存为本地偏好；不会重启应用或清空当前工作。</p>
        </section>
      </div>`;
  }

  function mountSettingsUserControlPanel(host){
    const panel = host.querySelector("#settingsUserControlPanel");
    const api = settingsUserControlApi();
    if (!panel || !api || !api.saveSettings) return;
    const toggle = panel.querySelector("#anonymousAnalyticsToggle");
    const state = panel.querySelector("#analyticsPreferenceState");
    const result = panel.querySelector("#analyticsPreferenceResult");
    const reset = panel.querySelector("#resetAnonymousAnalytics");
    const appearance = panel.querySelector("#appearancePreference");

    function setResult(text){ if (result) result.textContent = text; }
    function setState(enabled){
      if (!state) return;
      state.textContent = enabled ? "已开启 / On" : "已关闭 / Off";
      state.className = "connector-pill " + (enabled ? "connector-saved" : "connector-empty");
    }

    if (toggle) toggle.addEventListener("change", function(){
      const saved = api.setAnalyticsEnabled(toggle.checked);
      if (!saved.ok) {
        toggle.checked = api.isAnalyticsEnabled();
        setResult("未保存：偏好值无效或本地存储不可用。");
        return;
      }
      setState(saved.settings.analyticsEnabled);
      setResult(saved.settings.analyticsEnabled ? "匿名使用数据已开启。仅允许本地、匿名、allowlisted 事件。" : "匿名使用数据已关闭；待发送队列已清空，核心功能不受影响。");
    });

    if (reset) reset.addEventListener("click", function(){
      const resetResult = api.resetAnalytics();
      setResult(resetResult.ok ? "匿名分析身份和本地分析队列已重置；凭据、邮件设置和其他偏好未删除。" : "重置未完成：本地存储不可用。");
      setState(api.isAnalyticsEnabled());
    });

    if (appearance) appearance.addEventListener("change", function(){
      const saved = api.saveSettings({ appearance:appearance.value });
      if (!saved.ok) {
        appearance.value = api.getSettings().appearance;
        setResult("未保存：外观偏好值无效。");
        return;
      }
      setResult("外观偏好已保存；当前版本不会因此重启应用。");
    });
  }

  function helpFeedbackApi(){
    return window.WeishanInAppHelpFeedbackSupport || null;
  }

  function helpFeedbackPanel(){
    const advanced = advancedModeEnabled();
    const api = helpFeedbackApi();
    const model = api && api.buildHelpFeedbackViewModel ? api.buildHelpFeedbackViewModel({
      appVersion:window.weishan && window.weishan.version || "",
      platformClass:"desktop",
      locale:window.I18n && window.I18n.lang || "",
      moduleId:"settings",
      safeErrorClass:"none",
      buildType:"SOURCE_DEV"
    }) : null;
    const topics = model && model.helpTopics || [];
    const categories = model && model.categories || [
      { id:"general", zh:"使用问题", en:"Get Help" },
      { id:"bug", zh:"报告问题", en:"Report a Problem" },
      { id:"feature", zh:"功能建议", en:"Suggest a Feature" },
      { id:"other", zh:"其他", en:"Other" }
    ];
    return `
      <div class="ws-card help-feedback-support" id="helpFeedbackSupportPanel" data-help-feedback-support="true">
        <div class="settings-title-row">
          <h2>帮助与反馈 / Help & Feedback</h2>
          <span class="connector-pill connector-saved">support@weishan.ai</span>
        </div>
        <p class="ws-muted">先尝试页面内恢复提示；仍无法解决时，可以打开一封由你确认发送的支持邮件。内部合作邮箱不会作为普通用户支持入口显示。</p>
        <div class="help-feedback-layout">
          <section class="settings-control-group" aria-labelledby="helpTopicsTitle">
            <h3 id="helpTopicsTitle">快速帮助 / Quick help</h3>
            <div class="help-topic-list">
              ${topics.map(function(topic){
                return `<details class="help-topic"><summary>${esc(topic.titleZh)} / ${esc(topic.titleEn)}</summary><p>${esc(topic.bodyZh)}</p><p>${esc(topic.bodyEn)}</p></details>`;
              }).join("")}
            </div>
          </section>
          <section class="settings-control-group" aria-labelledby="feedbackComposerTitle">
            <h3 id="feedbackComposerTitle">联系支持 / Contact support</h3>
            <label for="supportCategory">类型 / Category</label>
            <select class="ws-input" id="supportCategory">
              ${categories.map(function(category){ return `<option value="${esc(category.id)}">${esc(category.zh)} / ${esc(category.en)}</option>`; }).join("")}
            </select>
            <label for="supportFeedbackText">发生了什么？/ What happened?</label>
            <textarea class="ws-input help-feedback-textarea" id="supportFeedbackText" maxlength="5000" rows="5" aria-describedby="supportFeedbackHelp"></textarea>
            <p class="ws-muted" id="supportFeedbackHelp">你输入的内容只会进入即将打开的邮件草稿；不会进入匿名分析，也不会被当作命令执行。</p>
            <label for="supportContactEmail">可选联系邮箱 / Optional contact email</label>
            <input class="ws-input" id="supportContactEmail" inputmode="email" placeholder="you@example.com">
            ${advanced ? `<label class="settings-switch" for="supportDiagnosticsToggle">
              <input type="checkbox" id="supportDiagnosticsToggle" role="switch" aria-describedby="supportDiagnosticsHelp">
              <span>包含基本诊断信息 / Include basic diagnostic information</span>
            </label>
            <p class="ws-muted" id="supportDiagnosticsHelp">${esc(model && model.diagnosticDisclosureZh || "只包含版本、平台、语言、当前模块、安全错误类别和构建类型。")} ${esc(model && model.diagnosticDisclosureEn || "Only version, platform, language, current module, safe error class, and build type are included.")}</p>
            <div class="help-feedback-diagnostics-preview" id="supportDiagnosticsPreview" aria-live="polite">当前不会附加诊断信息。/ Diagnostics are currently off.</div>` : ""}
            <div class="ws-row">
              <button type="button" class="ws-btn" id="openSupportDraft">打开邮件草稿 / Open mail draft</button>
              <button type="button" class="ws-btn gray" id="clearSupportDraft">清空 / Clear</button>
            </div>
            <p class="ws-muted" id="supportHandoffStatus" role="status" aria-live="polite">打开邮件应用不等于已经发送；请在邮件应用中自行确认发送。</p>
          </section>
        </div>
      </div>`;
  }

  function mountHelpFeedbackPanel(host){
    const panel = host.querySelector("#helpFeedbackSupportPanel");
    const api = helpFeedbackApi();
    if (!panel || !api) return;
    const category = panel.querySelector("#supportCategory");
    const feedback = panel.querySelector("#supportFeedbackText");
    const contact = panel.querySelector("#supportContactEmail");
    const diagnostics = panel.querySelector("#supportDiagnosticsToggle");
    const preview = panel.querySelector("#supportDiagnosticsPreview");
    const status = panel.querySelector("#supportHandoffStatus");
    const openButton = panel.querySelector("#openSupportDraft");
    const clearButton = panel.querySelector("#clearSupportDraft");

    function diagnosticSource(){
      return {
        appVersion:window.weishan && window.weishan.version || "",
        platformClass:"desktop",
        locale:window.I18n && window.I18n.lang || "",
        moduleId:"settings",
        safeErrorClass:"none",
        buildType:"SOURCE_DEV"
      };
    }
    function refreshPreview(){
      if (!preview) return;
      const result = api.safeDiagnostics(diagnosticSource(), { include:diagnostics && diagnostics.checked });
      if (!result.included) {
        preview.textContent = "当前不会附加诊断信息。/ Diagnostics are currently off.";
        return;
      }
      preview.textContent = "将包含基础诊断：appVersion, platformClass, locale, moduleId, safeErrorClass, buildType。不会包含搜索原文、邮件内容、凭据、完整 URL、日志或截图。";
    }
    if (diagnostics) diagnostics.addEventListener("change", refreshPreview);
    if (clearButton) clearButton.addEventListener("click", function(){
      if (feedback) feedback.value = "";
      if (contact) contact.value = "";
      if (status) status.textContent = "已清空本地输入；没有发送任何邮件。/ Cleared locally. No email was sent.";
      refreshPreview();
    });
    if (openButton) openButton.addEventListener("click", async function(){
      const draft = api.buildSupportMailto({
        category:category && category.value || "general",
        feedbackText:feedback && feedback.value || "",
        contactEmail:contact && contact.value || "",
        includeDiagnostics:diagnostics && diagnostics.checked,
        diagnostics:diagnosticSource()
      });
      if (!draft.ok) {
        if (status) status.textContent = "内容太长，无法安全打开邮件草稿；请缩短后再试。/ The draft is too long to open safely.";
        return;
      }
      openButton.disabled = true;
      try {
        const opener = window.weishan && typeof window.weishan.openExternal === "function" ? window.weishan.openExternal : null;
        const result = opener ? await opener(draft.url) : { ok:false };
        if (status) status.textContent = result && result.ok ? "已打开邮件应用草稿；Weishan 没有发送邮件。/ Your mail app draft was opened. Weishan did not send it." : "未能打开邮件应用；请手动发送到 support@weishan.ai。/ Could not open the mail app. Please email support@weishan.ai manually.";
      } finally {
        openButton.disabled = false;
      }
    });
    refreshPreview();
  }

  function commerceLocationApi(){
    return window.WeishanCommerceLocationPolicy || null;
  }

  function commerceLocationPolicy(){
    const api = commerceLocationApi();
    if (api && api.getCommerceLocationPolicy) return api.getCommerceLocationPolicy();
    return {
      locationPermissionMode:"off",
      locationPermissionStatus:"not_requested",
      shippingDestination:{ country:"", region:"", city:"", postalCode:"", source:"unknown", configured:false },
      shippingDestinationRequiredForAccuratePrice:true,
      hasShippingDestination:false,
      hasPreciseLocation:false,
      canCalculateAccurateLandedCost:false,
      canShowAccuratePrice:false,
      canShowRedirectButton:false,
      reason:"shipping_destination_required",
      privacy:{
        storeRawCoordinates:false,
        logRawCoordinates:false,
        shareWithThirdParty:false,
        useForAds:false,
        useForTracking:false
      },
      notice:"为了精准计算最低到手价并遵守当地法律，请设置收货目的地，并可选择开启定位服务。weishan 仅将位置信息用于价格、运费、税费、关税和合规区域计算，不会保存原始位置。"
    };
  }

  function commerceLocationPanel(){
    const policy = commerceLocationPolicy();
    const mode = policy.locationPermissionMode || "off";
    const destination = policy.shippingDestination || {};
    const destinationStatus = policy.hasShippingDestination ? "已设置" : "未设置";
    return `
      <div class="ws-card commerce-location-settings" id="commerceLocationSettingsPanel">
        <div class="settings-title-row">
          <h2>${t("settingsLocationTitle")}</h2>
          <span class="connector-pill ${mode === "off" ? "connector-empty" : "connector-saved"}">${mode === "off" ? t("settingsLocationOff") : t("settingsLocationWaiting")}</span>
        </div>
        <p class="ws-muted">为了精准计算最低到手价并遵守当地法律，请设置收货目的地，并可选择开启定位服务。weishan 仅将位置信息用于价格、运费、税费、关税和合规区域计算，不会保存原始位置。</p>
        <p class="ws-muted">最低到手价需要根据收货目的地计算运费、税费、关税和当地合规要求。</p>
        <div class="desktop-permission-grid commerce-destination-fields">
          <label>${t("settingsCountryRegion")}<input class="ws-input" id="commerceDestinationCountry" value="${esc(destination.country || "")}" placeholder="${t("settingsCountryRegion")}"></label>
          <label>${t("settingsStateCity")}<input class="ws-input" id="commerceDestinationRegion" value="${esc(destination.region || destination.city || "")}" placeholder="${t("settingsStateCity")}"></label>
          <label>${t("settingsPostalCode")}<input class="ws-input" id="commerceDestinationPostalCode" value="${esc(destination.postalCode || "")}" placeholder="${t("settingsPostalCode")}"></label>
        </div>
        <div class="desktop-permission-grid commerce-location-options">
          <label><input type="radio" name="commerceLocationMode" value="always"${mode === "always" ? " checked" : ""}> ${t("settingsAlwaysAllow")}</label>
          <label><input type="radio" name="commerceLocationMode" value="while_using_app"${mode === "while_using_app" ? " checked" : ""}> ${t("settingsAllowWhileUsing")}</label>
          <label><input type="radio" name="commerceLocationMode" value="off"${mode === "off" ? " checked" : ""}> ${t("settingsLocationOff")}</label>
        </div>
        <p class="ws-muted">定位服务偏好用于请求系统位置权限，不代表系统已经授权。系统授权成功前不会显示已定位，也不会把 hasPreciseLocation 设为 true。</p>
        <dl class="commerce-facts">
          <div><dt>${t("settingsDestination")}</dt><dd>${destinationStatus}</dd></div>
          <div><dt>国家/地区</dt><dd>${esc(destination.country || t("settingsNotSet"))}</dd></div>
          <div><dt>州/省/城市</dt><dd>${esc(destination.region || destination.city || t("settingsNotSet"))}</dd></div>
          <div><dt>邮编/邮政编码</dt><dd>${esc(destination.postalCode || t("settingsNotSet"))}</dd></div>
          <div><dt>定位状态</dt><dd>${esc(policy.locationPermissionStatus || "not_requested")}</dd></div>
          <div><dt>${t("settingsAccuratePrice")}</dt><dd>${policy.canCalculateAccurateLandedCost ? t("settingsAvailable") : t("settingsUnavailable")}</dd></div>
          <div><dt>原始坐标保存</dt><dd>false</dd></div>
          <div><dt>第三方共享</dt><dd>false</dd></div>
          <div><dt>广告 / 追踪</dt><dd>false</dd></div>
        </dl>
        <p class="commerce-warning">weishan 不会保存原始经纬度。定位服务仅用于辅助判断地区；最低到手价以收货目的地为准。</p>
      </div>`;
  }

  function mountCommerceLocationPanel(host){
    const panel = host.querySelector("#commerceLocationSettingsPanel");
    const api = commerceLocationApi();
    if (!panel || !api || !api.saveCommerceLocationPolicy) return;
    panel.querySelectorAll("input[name='commerceLocationMode']").forEach(function(input){
      input.addEventListener("change", function(){
        const mode = String(input.value || "off");
        api.saveCommerceLocationPolicy({
          locationPermissionMode:mode,
          locationPermissionStatus:"not_requested",
          hasPreciseLocation:false
        });
        window.WeishanRouter && window.WeishanRouter.refresh && window.WeishanRouter.refresh();
      });
    });
    function readDestination(){
      return {
        country:(panel.querySelector("#commerceDestinationCountry") && panel.querySelector("#commerceDestinationCountry").value) || "",
        region:(panel.querySelector("#commerceDestinationRegion") && panel.querySelector("#commerceDestinationRegion").value) || "",
        city:"",
        postalCode:(panel.querySelector("#commerceDestinationPostalCode") && panel.querySelector("#commerceDestinationPostalCode").value) || "",
        source:"manual"
      };
    }
    ["commerceDestinationCountry", "commerceDestinationRegion", "commerceDestinationPostalCode"].forEach(function(id){
      const input = panel.querySelector("#" + id);
      if (!input) return;
      input.addEventListener("change", function(){
        api.saveCommerceLocationPolicy({
          shippingDestination:readDestination(),
          locationPermissionStatus:"not_requested",
          hasPreciseLocation:false
        });
        window.WeishanRouter && window.WeishanRouter.refresh && window.WeishanRouter.refresh();
      });
    });
  }

  function desktopAssistantPanel(){
    const settings = desktopAssistantSettings();
    const session = desktopAssistantSession();
    const api = desktopAssistantApi();
    const guide = api && api.createDesktopPermissionGuide ? api.createDesktopPermissionGuide() : { permissions:[], message:"当前版本仅生成操作计划和模拟执行，不申请系统权限，不读取屏幕，不控制鼠标键盘。" };
    const status = session.enabled ? "允许本次会话使用" : session.status === "stopped" ? "已停止" : "已关闭";
    return `
      <div class="ws-card desktop-assistant-settings" id="desktopAssistantSettingsPanel">
        <div class="settings-title-row">
          <h2>桌面助手与自动操作</h2>
          <span class="connector-pill ${session.enabled ? "connector-success" : "connector-empty"}">${esc(status)}</span>
        </div>
        <p class="ws-muted">桌面助手可在用户明确授权后辅助操作本机软件。本轮为权限框架和操作计划，不会真实点击、输入或读取屏幕。</p>
        <div class="desktop-permission-grid">
          <label><input type="checkbox" id="desktopAssistantEnabled"${checked(settings.enabled)}> 启用桌面助手能力</label>
          <label><input type="checkbox" id="desktopAssistantPlan"${checked(settings.allowPlanGeneration)}> 允许生成操作计划</label>
          <label><input type="checkbox" id="desktopAssistantKeyboard"${checked(settings.allowKeyboardInput)}> 允许键盘输入（默认关）</label>
          <label><input type="checkbox" id="desktopAssistantMouse"${checked(settings.allowMouseClick)}> 允许鼠标点击（默认关）</label>
          <label><input type="checkbox" id="desktopAssistantScreen"${checked(settings.allowScreenRead)}> 允许读取屏幕（默认关）</label>
          <label><input type="checkbox" id="desktopAssistantSecondConfirm"${checked(settings.requireSecondConfirmForHighRisk)}> 高风险操作必须二次确认</label>
          <label><input type="checkbox" id="desktopAssistantAutoStop"${checked(settings.autoStopAfterMinutes > 0)}> 30 分钟无操作自动关闭</label>
        </div>
        <div class="desktop-real-open-app" data-real-open-app-setting="true">
          <h3>真实低风险操作</h3>
          <label><input type="checkbox" id="desktopAssistantRealOpenApp"${checked(settings.allowRealOpenApp)}> 允许真实打开白名单 App</label>
          <p class="ws-muted">开启后，weishan 只能在你本次开启桌面助手并点击“确认真实打开”后，打开或聚焦白名单 App。不会点击鼠标、不会输入键盘、不会读取屏幕、不会删除/发送/上传/付款/提交表单。</p>
          <p class="ws-muted">当前白名单：Chrome / Safari / Finder / WPS / Notes / Preview。</p>
          <ul class="desktop-policy-list">
            <li>只允许 openApp / focusApp。</li>
            <li>只允许白名单 App。</li>
            <li>不允许任意命令。</li>
            <li>不允许任意路径。</li>
            <li>不允许 URL 自动打开。</li>
          </ul>
          <div class="desktop-risk-note desktop-risk-medium">真实打开 App 属于低风险操作，但仍需要用户确认。</div>
        </div>
        <div class="desktop-risk-note desktop-risk-medium">中风险提醒：点击按钮、填写表单、保存/下载/移动文件或修改文档内容，需要用户继续确认。</div>
        <div class="desktop-risk-note desktop-risk-high">高风险操作包括发送邮件、删除文件、付款、提交表单、上传文件、输入密码、安装软件、修改系统设置。此类操作必须二次确认。</div>
        <div class="desktop-permission-guide" data-desktop-permission-guide="true">
          <h3>系统权限准备</h3>
          <p class="ws-muted">${esc(guide.message)}</p>
          <div class="desktop-permission-list">
            ${guide.permissions.map(function(item){
              return `<div class="desktop-permission-item">
                <b>${esc(item.label)}</b>
                <span>${esc(item.status)} / ${esc(item.purpose)}</span>
              </div>`;
            }).join("")}
          </div>
        </div>
      </div>`;
  }

  function mountDesktopAssistantPanel(host){
    const panel = host.querySelector("#desktopAssistantSettingsPanel");
    const api = desktopAssistantApi();
    if (!panel || !api || !api.saveDesktopAssistantSettings) return;
    if (window.HistoryApi && window.HistoryApi.record && api.createDesktopAssistantHistoryPayload) {
      window.HistoryApi.record("desktopAssistant.permissionGuideViewed", api.createDesktopAssistantHistoryPayload("desktopAssistant.permissionGuideViewed", {
        inputSummary:"用户查看桌面助手系统权限准备说明。",
        outputSummary:"当前版本仅生成操作计划和模拟执行，不申请系统权限。",
        riskLevel:"low",
        stepCount:0,
        realExecution:false
      }));
    }
    function readSettings(){
      return {
        enabled:!!host.querySelector("#desktopAssistantEnabled").checked,
        allowPlanGeneration:!!host.querySelector("#desktopAssistantPlan").checked,
        allowKeyboardInput:!!host.querySelector("#desktopAssistantKeyboard").checked,
        allowMouseClick:!!host.querySelector("#desktopAssistantMouse").checked,
        allowScreenRead:!!host.querySelector("#desktopAssistantScreen").checked,
        requireSecondConfirmForHighRisk:!!host.querySelector("#desktopAssistantSecondConfirm").checked,
        autoStopAfterMinutes:host.querySelector("#desktopAssistantAutoStop").checked ? 30 : 0,
        allowRealOpenApp:!!host.querySelector("#desktopAssistantRealOpenApp").checked
      };
    }
    Array.from(panel.querySelectorAll("input[type='checkbox']")).forEach(function(input){
      input.addEventListener("change", function(){
        api.saveDesktopAssistantSettings(readSettings());
      });
    });
  }

  function renderCloudPlans(host, plans){
    const box = host.querySelector("#cloudPlanList");
    const enterprise = (plans || []).filter(function(plan){
      return String(plan.plan_type || plan.planType || "").toLowerCase() === "enterprise" || /ENTERPRISE/.test(String(plan.plan_id || plan.planId || ""));
    });
    box.innerHTML = enterprise.map(function(plan){
      const id = plan.plan_id || plan.planId;
      const name = plan.plan_name || plan.planName || plan.name || id;
      const quota = plan.storage_quota_gb || plan.storageQuotaGb || plan.quotaGb || 0;
      const limit = plan.member_limit || plan.memberLimit || 0;
      return `<div><b>${esc(name)}</b> · ${esc(id)} · ${esc(plan.region || "")} · ${esc(quota)}GB · ${esc(limit)}人 · ${esc(plan.monthly_price || "-")}/${esc(plan.yearly_price || "-")} ${esc(plan.currency || "")}</div>`;
    }).join("") || "暂无企业套餐。";
  }

  function renderCloudStatus(host, status){
    const box = host.querySelector("#cloudStatusBox");
    box.innerHTML = [
      "plan_id: " + esc(status.planId || ""),
      "member_limit: " + esc(status.memberLimit),
      "active_member_count: " + esc(status.activeMemberCount),
      "storage_quota_gb: " + esc(status.storageQuotaGb || status.quotaGb || 0),
      "storage_status: " + esc((status.storageStatus && status.storageStatus.mode) || status.storageMode || "local_mock"),
      "pathPrefix: " + esc(status.pathPrefix || ""),
      "provider: " + esc(status.provider || "local_mock")
    ].join("<br>");
  }

  function mountCloudPanel(host){
    const plansBtn = host.querySelector("#loadCloudPlans");
    const statusBtn = host.querySelector("#loadCloudStatus");
    const allocateBtn = host.querySelector("#allocateCloudStorage");
    const inviteBtn = host.querySelector("#cloudInviteMember");
    if (!plansBtn || !statusBtn || !allocateBtn || !inviteBtn) return;

    plansBtn.addEventListener("click", async function(){
      const result = await cloudRequest("/api/plans", {}, function(){ return { ok:true, plans:enterprisePlansFallback(), localStorageWarning:LOCAL_STORAGE_WARNING }; });
      renderCloudPlans(host, result.plans || []);
      cloudHistory("cloud.plansViewed", {
        action:"plansViewed",
        status:"done",
        storageMode:"local_mock",
        provider:"local_mock",
        inputSummary:"读取企业套餐 mock",
        outputSummary:"已读取企业套餐 " + ((result.plans || []).length) + " 项。"
      });
    });

    statusBtn.addEventListener("click", async function(){
      const result = await cloudRequest("/api/organization/status?organizationId=local-company", {}, function(){ return mockOrganizationStatus("CN_ENTERPRISE_BASIC"); });
      renderCloudStatus(host, result);
      cloudHistory("cloud.organizationStatusViewed", {
        action:"organizationStatusViewed",
        status:"done",
        planId:result.planId,
        quotaGb:result.storageQuotaGb || result.quotaGb,
        memberLimit:result.memberLimit,
        activeMemberCount:result.activeMemberCount,
        storageMode:result.storageMode,
        provider:result.provider,
        ownerType:"organization",
        ownerId:"local-company",
        inputSummary:"读取企业空间状态 mock",
        outputSummary:"企业空间 " + result.planId + "，" + (result.storageQuotaGb || result.quotaGb || 0) + "GB / " + result.memberLimit + " 人。"
      });
    });

    allocateBtn.addEventListener("click", async function(){
      const body = { ownerType:"organization", ownerId:"local-company", planId:"CN_ENTERPRISE_BASIC" };
      const result = await cloudRequest("/api/storage/allocate", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify(body)
      }, function(){ return mockAllocateStorage(body.planId); });
      host.querySelector("#cloudStorageMode").textContent = "weishan 云存储（mock）";
      renderCloudStatus(host, Object.assign({ memberLimit:5, activeMemberCount:0, storageQuotaGb:result.quotaGb }, result));
      cloudHistory("cloud.storageAllocated", {
        action:"storageAllocated",
        status:"done",
        planId:body.planId,
        quotaGb:result.quotaGb,
        memberLimit:5,
        activeMemberCount:0,
        storageMode:result.storageMode || "local_mock",
        provider:result.provider || "local_mock",
        ownerType:body.ownerType,
        ownerId:body.ownerId,
        inputSummary:"分配企业云空间 mock",
        outputSummary:"已分配 " + result.quotaGb + "GB，路径 " + result.pathPrefix
      });
    });

    inviteBtn.addEventListener("click", async function(){
      const email = String(host.querySelector("#cloudInviteEmail").value || "").trim();
      const role = String(host.querySelector("#cloudInviteRole").value || "member");
      const body = { organizationId:"local-company", planId:"CN_ENTERPRISE_BASIC", email, role };
      const result = await cloudRequest("/api/organization/invite", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify(body)
      }, function(){ return mockInviteMember(body); });
      const type = result.ok ? "cloud.organizationInvite" : "cloud.organizationInviteRejected";
      host.querySelector("#cloudInviteResult").textContent = result.ok ? "邀请已记录：" + email : (result.code || "invite_failed") + " · " + (result.message || "邀请失败");
      cloudHistory(type, {
        action:result.ok ? "organizationInvite" : "organizationInviteRejected",
        status:result.ok ? "done" : "failed",
        planId:body.planId,
        memberLimit:result.memberLimit,
        activeMemberCount:result.activeMemberCount,
        storageMode:"local_mock",
        provider:"local_mock",
        ownerType:"organization",
        ownerId:"local-company",
        inputSummary:"邀请企业成员 mock：" + email,
        outputSummary:result.ok ? "成员邀请已记录。" : (result.message || "成员数量达到套餐上限。")
      });
    });
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

  function clearSettingsConnectorStatusRuntimeHook(){
    if (typeof window.__WEISHAN_SETTINGS_CONNECTOR_STATUS_UNSUBSCRIBE__ === "function") {
      try { window.__WEISHAN_SETTINGS_CONNECTOR_STATUS_UNSUBSCRIBE__(); } catch (_) {}
    }
    window.__WEISHAN_SETTINGS_CONNECTOR_STATUS_UNSUBSCRIBE__ = null;
  }

  function advancedModeEnabled(){
    return !!(window.WeishanExperienceMode && window.WeishanExperienceMode.isAdvanced());
  }

  function experienceModePanel(){
    const advanced = advancedModeEnabled();
    return `<div class="ws-card experience-mode-settings" data-settings-section="experience">
      <div class="settings-title-row">
        <div><h2>${t("advancedModeTitle")}</h2><p class="ws-muted">${t("advancedModeDescription")}</p></div>
        <span class="connector-pill ${advanced ? "connector-saved" : "connector-empty"}">${t(advanced ? "advancedModeOn" : "advancedModeOff")}</span>
      </div>
      <label class="settings-switch" for="experienceModeToggle">
        <input id="experienceModeToggle" type="checkbox" role="switch"${advanced ? " checked" : ""}>
        <span>${t(advanced ? "advancedModeDisable" : "advancedModeEnable")}</span>
      </label>
    </div>`;
  }

  function mountExperienceModePanel(host){
    const toggle = host.querySelector("#experienceModeToggle");
    if (!toggle || !window.WeishanExperienceMode) return;
    toggle.addEventListener("change", function(){
      window.WeishanExperienceMode.setAdvanced(toggle.checked);
    });
  }

  function refreshSettingsConnectorStatus(host){
    if (!host || !window.WeishanAPI || typeof window.WeishanAPI.connector !== "function") return;
    renderStatus(host, window.WeishanAPI.connector());
  }

  function bindSettingsConnectorStatusRuntimeHooks(host){
    clearSettingsConnectorStatusRuntimeHook();
    if (window.WeishanAPI && typeof window.WeishanAPI.subscribeConnectorStatus === "function") {
      window.__WEISHAN_SETTINGS_CONNECTOR_STATUS_UNSUBSCRIBE__ = window.WeishanAPI.subscribeConnectorStatus(function(){
        refreshSettingsConnectorStatus(host);
      });
    }
  }

  async function runConnectorTest(host, input){
    let requestInput = null;
    try {
      if (!input.baseUrl || !input.chatModel) {
        const classified = classifyTestResult(input, { ok:false, message:"" });
        renderStatus(host, writeClassifiedTest(input, classified));
        return;
      }

      requestInput = await window.WeishanAPI.connectorForRequest(input);
      if (!requestInput.hasRequestApiKey) {
        const classified = classifyTestResult(Object.assign({}, input, { hasApiKey:false, hasRequestApiKey:false }), { ok:false, message:"" });
        renderStatus(host, writeClassifiedTest(input, classified));
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
    } catch (err) {
      const classified = classifyTestResult(requestInput || input, { ok:false, message:err && err.message || String(err || "") });
      renderStatus(host, writeClassifiedTest(requestInput || input, classified));
      throw err;
    }
  }

  function mount(host){
    const acc = window.AccountApi.current();
    const advanced = advancedModeEnabled();
    host.innerHTML = `
      <section class="ws-page settings-experience-${advanced ? "advanced" : "standard"}" data-experience-mode="${advanced ? "advanced" : "standard"}">
        <div class="ws-card">
          <h2>${t("settings")}</h2>
          <p class="ws-muted">${t("standardSettingsIntro")}</p>
        </div>

        ${experienceModePanel()}

        <div class="ws-grid-2">
          <div class="ws-card" data-settings-section="account">
            <h2>${t("account")}</h2>
            ${accountPanel(acc)}
            ${advanced ? settingsAuthLocalSecurityEvidencePanel() : ""}
            ${advanced ? settingsNoSecretPersistenceGuardPanel() : ""}
          </div>
          ${advanced ? `<div data-settings-section="credentials" data-advanced-only="true">${aiPanel(acc)}</div>` : ""}
        </div>

        ${settingsUserControlPanel()}
        ${helpFeedbackPanel()}
        <div class="ws-card" id="officialWebsitePanel">
          <h2>${t("aboutWeishan")}</h2>
          <p class="ws-muted">${t("officialWebsiteDescription")}</p>
          <button type="button" id="openWeishanOfficialWebsite" class="ws-btn gray">${t("visitWeishanOfficialWebsite")}</button>
        </div>
        ${commerceLocationPanel()}
        ${advanced ? `<div class="advanced-settings-boundary" data-settings-section="developer-diagnostics" data-advanced-only="true"><div class="ws-card advanced-settings-intro"><h2>${t("advancedSettingsTitle")}</h2><p class="ws-muted">${t("advancedSettingsDescription")}</p></div>${desktopAssistantPanel()}</div>` : ""}
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

    function accountButton(action){
      return host.querySelector('[data-account-action="' + action + '"]');
    }

    function accountButtonIdleLabel(action){
      if (action === "register") return t("registerLogin");
      if (action === "login") return t("loginExisting");
      return t("recoverPassword");
    }

    function accountButtonFeedbackLabel(action, state){
      if (state === "processing") {
        if (action === "register") return t("settingsRegistering");
        if (action === "login") return t("settingsLoggingIn");
        return t("settingsPreparingRecovery");
      }
      if (state === "success") {
        if (action === "register") return t("settingsRegisterComplete");
        if (action === "login") return t("settingsLoginComplete");
        return t("settingsRecoveryShown");
      }
      if (state === "error") {
        if (action === "register") return t("settingsRegisterBlocked");
        if (action === "login") return t("settingsLoginBlocked");
        return t("settingsRecoveryBlocked");
      }
      return accountButtonIdleLabel(action);
    }

    function setAccountButtonState(action, state){
      const btn = accountButton(action);
      if (!btn) return;
      if (!btn.getAttribute("data-idle-label")) btn.setAttribute("data-idle-label", accountButtonIdleLabel(action));
      btn.classList.remove("is-processing", "is-success", "is-error");
      btn.removeAttribute("aria-busy");
      if (state && state !== "idle") {
        btn.classList.add("is-" + state);
        btn.setAttribute("data-feedback-state", state);
      } else {
        btn.setAttribute("data-feedback-state", "idle");
      }
      if (state === "processing") btn.setAttribute("aria-busy", "true");
      btn.textContent = accountButtonFeedbackLabel(action, state || "idle");
    }

    function resetOtherAccountButtons(action){
      ["register", "login", "recover"].forEach(function(name){
        if (name !== action) setAccountButtonState(name, "idle");
      });
    }

    function runAccountAction(action, worker){
      const btn = accountButton(action);
      if (btn && btn.getAttribute("data-feedback-state") === "processing") return;
      resetOtherAccountButtons(action);
      setAccountButtonState(action, "processing");
      status(action === "recover" ? t("settingsPreparingRecoveryStatus") : t("settingsProcessingAccount"));
      window.setTimeout(function(){
        const r = worker();
        if (!r.ok) {
          setAccountButtonState(action, "error");
          status(r.error);
          return;
        }
        setAccountButtonState(action, "success");
        status(r.message || t("settingsAccountComplete"));
        if (action === "register" || action === "login") {
          window.setTimeout(function(){ window.WeishanRouter.refresh(); }, 120);
        }
      }, 80);
    }

    function handleAccountAction(action, event){
      if (event && event.preventDefault) event.preventDefault();
      if (event && event.stopPropagation) event.stopPropagation();
      if (action === "register") {
        runAccountAction("register", function(){ return window.AccountApi.register(accountInput()); });
        return;
      }
      if (action === "login") {
        runAccountAction("login", function(){ return window.AccountApi.login(accountInput()); });
        return;
      }
      if (action === "recover") {
        runAccountAction("recover", function(){ return window.AccountApi.recover(accountInput()); });
      }
    }

    const accountActionHost = host.querySelector(".ws-card");
    if (accountActionHost) accountActionHost.addEventListener("click", function(event){
      const target = event.target && event.target.closest ? event.target.closest("[data-account-action]") : null;
      if (!target || !accountActionHost.contains(target)) return;
      handleAccountAction(target.getAttribute("data-account-action"), event);
    });

    const registerBtn = host.querySelector("#registerBtn");
    if (registerBtn) registerBtn.addEventListener("click", function(event){
      if (event && event.defaultPrevented) return;
      handleAccountAction("register", event);
    });

    const loginBtn = host.querySelector("#loginBtn");
    if (loginBtn) loginBtn.addEventListener("click", function(event){
      if (event && event.defaultPrevented) return;
      handleAccountAction("login", event);
    });

    const recoverBtn = host.querySelector("#recoverBtn");
    if (recoverBtn) recoverBtn.addEventListener("click", function(event){
      if (event && event.defaultPrevented) return;
      handleAccountAction("recover", event);
    });

    const logoutBtn2 = host.querySelector("#logoutBtn2");
    if (logoutBtn2) logoutBtn2.addEventListener("click", function(){
      window.AccountApi.logout();
      window.WeishanRouter.refresh();
    });

    const authBtn = host.querySelector("#authBtn");
    if (authBtn) authBtn.addEventListener("click", function(){
      if (window.WeishanUserNotice) window.WeishanUserNotice.show(host, t("authenticatorReserved"));
    });

    const officialWebsiteButton = host.querySelector("#openWeishanOfficialWebsite");
    if (officialWebsiteButton) officialWebsiteButton.addEventListener("click", async function(){
      if (!window.weishan || typeof window.weishan.openWeishanOfficialWebsite !== "function") return;
      officialWebsiteButton.disabled = true;
      try {
        await window.weishan.openWeishanOfficialWebsite();
      } finally {
        officialWebsiteButton.disabled = false;
      }
    });

    mountDesktopAssistantPanel(host);
    mountCommerceLocationPanel(host);
    mountSettingsUserControlPanel(host);
    mountHelpFeedbackPanel(host);
    mountExperienceModePanel(host);
    try {
      if (window.sessionStorage && window.sessionStorage.getItem("weishan:settings:focus") === "commerceLocation") {
        window.sessionStorage.removeItem("weishan:settings:focus");
        const target = host.querySelector("#commerceLocationSettingsPanel");
        if (target && target.scrollIntoView) target.scrollIntoView({ block:"start" });
      }
    } catch (_) {}

    if (!acc.loggedIn || !advanced) return;

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
      if (window.WeishanAPI && typeof window.WeishanAPI.setConnectorRuntimeState === "function") {
        window.WeishanAPI.setConnectorRuntimeState("testing");
      }

      const input = readConnector(host);
      try {
        await runConnectorTest(host, input);
      } finally {
        btn.disabled = false;
        btn.textContent = t("testConnection");
      }
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
        if (!resolvedInput.hasRequestApiKey) {
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

    bindSettingsConnectorStatusRuntimeHooks(host);
  }

  function unmount(){
    clearSettingsConnectorStatusRuntimeHook();
  }

  window.SettingsPage = {
    mount,
    unmount,
    __bindSettingsConnectorStatusRuntimeHooksForTest:bindSettingsConnectorStatusRuntimeHooks,
    __clearSettingsConnectorStatusRuntimeHookForTest:clearSettingsConnectorStatusRuntimeHook,
    __runConnectorTestForTest:runConnectorTest
  };
})();
