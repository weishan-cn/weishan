(function(){
  if (!window.WeishanCommerceLocationPolicy && typeof document !== "undefined" && document.currentScript && document.write) {
    document.write('<scr' + 'ipt src="./renderer/core/commerceLocationPolicy.js?v=2.0.30"></scr' + 'ipt>');
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
        <h2>云服务与企业空间</h2>
        <p class="ws-muted">当前存储模式：<b id="cloudStorageMode">本地存储</b> / weishan 云存储 / 自有云</p>
        <p class="danger-text">${LOCAL_STORAGE_WARNING}</p>
        <p class="ws-muted">Metadata provider / Storage provider 当前为 local mock。PocketBase 和 S3-compatible 仅作为可替换 provider skeleton，不是默认供应商。</p>
        <div class="ws-row">
          <button class="ws-btn" id="loadCloudPlans">读取企业套餐</button>
          <button class="ws-btn green" id="loadCloudStatus">读取企业空间状态</button>
          <button class="ws-btn gray" id="allocateCloudStorage">分配企业云空间 mock</button>
        </div>
        <div class="ws-item" id="cloudPlanList">企业套餐待读取。</div>
        <div class="ws-item" id="cloudStatusBox">企业空间状态待读取。</div>
        <div class="ws-row">
          <input class="ws-input" id="cloudInviteEmail" placeholder="成员邮箱，例如 e2e-cloud@example.com">
          <select class="ws-input" id="cloudInviteRole">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
          <button class="ws-btn" id="cloudInviteMember">邀请成员 mock</button>
        </div>
        <div class="ws-item" id="cloudInviteResult">成员邀请结果待执行。</div>
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
          <h2>位置与收货目的地</h2>
          <span class="connector-pill ${mode === "off" ? "connector-empty" : "connector-saved"}">${mode === "off" ? "关闭" : "待系统授权"}</span>
        </div>
        <p class="ws-muted">为了精准计算最低到手价并遵守当地法律，请设置收货目的地，并可选择开启定位服务。weishan 仅将位置信息用于价格、运费、税费、关税和合规区域计算，不会保存原始位置。</p>
        <p class="ws-muted">最低到手价需要根据收货目的地计算运费、税费、关税和当地合规要求。</p>
        <div class="desktop-permission-grid commerce-destination-fields">
          <label>国家/地区<input class="ws-input" id="commerceDestinationCountry" value="${esc(destination.country || "")}" placeholder="国家/地区"></label>
          <label>州/省/城市<input class="ws-input" id="commerceDestinationRegion" value="${esc(destination.region || destination.city || "")}" placeholder="州/省/城市"></label>
          <label>邮编/邮政编码<input class="ws-input" id="commerceDestinationPostalCode" value="${esc(destination.postalCode || "")}" placeholder="邮编/邮政编码"></label>
        </div>
        <div class="desktop-permission-grid commerce-location-options">
          <label><input type="radio" name="commerceLocationMode" value="always"${mode === "always" ? " checked" : ""}> 永远允许</label>
          <label><input type="radio" name="commerceLocationMode" value="while_using_app"${mode === "while_using_app" ? " checked" : ""}> 使用 App 时允许</label>
          <label><input type="radio" name="commerceLocationMode" value="off"${mode === "off" ? " checked" : ""}> 关闭</label>
        </div>
        <p class="ws-muted">定位服务偏好用于请求系统位置权限，不代表系统已经授权。系统授权成功前不会显示已定位，也不会把 hasPreciseLocation 设为 true。</p>
        <dl class="commerce-facts">
          <div><dt>收货目的地</dt><dd>${destinationStatus}</dd></div>
          <div><dt>国家/地区</dt><dd>${esc(destination.country || "未设置")}</dd></div>
          <div><dt>州/省/城市</dt><dd>${esc(destination.region || destination.city || "未设置")}</dd></div>
          <div><dt>邮编/邮政编码</dt><dd>${esc(destination.postalCode || "未设置")}</dd></div>
          <div><dt>定位状态</dt><dd>${esc(policy.locationPermissionStatus || "not_requested")}</dd></div>
          <div><dt>精确最低到手价</dt><dd>${policy.canCalculateAccurateLandedCost ? "可计算" : "不可用"}</dd></div>
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
            <p>${t("baseUrl")}：${esc(window.WeishanConfig.backend.metadataBaseUrl || window.WeishanConfig.backend.pocketbaseBaseUrl || "local metadata mock")}</p>
            <p>${t("collections")}：${esc(window.WeishanConfig.backend.collections.join(" / "))}</p>
            <p class="danger-text">${t("secretsWarning")}</p>
          </div>
          <div class="ws-card">
            <h2>${t("billingPermissions")}</h2>
            <p>${t("billingDesc")}</p>
            <p>free/pro → A；team/enterprise/institution → B。</p>
          </div>
        </div>
        ${commerceLocationPanel()}
        ${desktopAssistantPanel()}
        ${cloudEnterprisePanel()}
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

    mountDesktopAssistantPanel(host);
    mountCommerceLocationPanel(host);
    mountCloudPanel(host);
    try {
      if (window.sessionStorage && window.sessionStorage.getItem("weishan:settings:focus") === "commerceLocation") {
        window.sessionStorage.removeItem("weishan:settings:focus");
        const target = host.querySelector("#commerceLocationSettingsPanel");
        if (target && target.scrollIntoView) target.scrollIntoView({ block:"start" });
      }
    } catch (_) {}

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
