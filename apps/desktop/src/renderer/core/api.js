(function(){
  const apiBase = (window.weishan && window.weishan.apiBase) || "http://127.0.0.1:8787";
  const connectorStatusSubscribers = new Set();
  function perfApi(){ return window.WeishanPerf || null; }
  function isPerfEnabled(){
    const perf = perfApi();
    return !!(perf && perf.isPerfEnabled && perf.isPerfEnabled());
  }
  function perfMeta(featureAction, meta){
    const perf = perfApi();
    if (meta && meta.enabled && meta.traceId && meta.featureAction) return meta;
    return perf && perf.createPerfMeta ? perf.createPerfMeta(featureAction || "api.aiChat") : { traceId:"", featureAction:featureAction || "api.aiChat", enabled:false };
  }
  function perfStart(meta, stage, extra){
    const perf = perfApi();
    return perf && meta && meta.enabled ? perf.perfStart(meta.traceId, meta.featureAction, stage, extra || {}) : 0;
  }
  function perfEnd(meta, stage, startedAt, extra){
    const perf = perfApi();
    if (perf && meta && meta.enabled) perf.perfEnd(meta.traceId, meta.featureAction, stage, startedAt, extra || {});
  }
  function perfMark(meta, stage, extra){
    const perf = perfApi();
    if (perf && meta && meta.enabled && perf.perfMark) perf.perfMark(meta.traceId, meta.featureAction, stage, extra || {});
  }
  function perfError(meta, stage, startedAt, err, extra){
    const perf = perfApi();
    if (!perf || !meta || !meta.enabled) return;
    perf.perfEnd(meta.traceId, meta.featureAction, stage, startedAt, Object.assign({}, extra || {}, perf.safeError ? perf.safeError(err) : { errorName:"Error" }));
  }
  function countMessageChars(messages){
    const perf = perfApi();
    return perf && perf.countMessageChars ? perf.countMessageChars(messages) : 0;
  }
  function createStreamId(){
    const perf = perfApi();
    if (perf && perf.createTraceId) return perf.createTraceId("stream");
    return "stream-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }
  function account(){ return window.AccountApi ? window.AccountApi.current() : { loggedIn:false, accountId:"" }; }
  function connectorKey(){ const a = account(); return a.loggedIn && a.accountId ? "api.connector." + a.accountId : ""; }
  function safePart(value){
    return String(value || "").trim().toLowerCase().replace(/[^a-z0-9._:-]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function apiKeySecureKey(){
    const a = account();
    return a.loggedIn && a.accountId ? "ai.provider." + safePart(a.accountId) + ".apiKey" : "";
  }
  function blankConnector(){
    return { mode:"fusion", protocol:"auto", provider:"fusion", baseUrl:"", chatModel:"", embeddingModel:"", providerType:"custom", hasApiKey:false, keyStorageMode:"none", testStatus:"empty", testMessage:"", testDetail:"", savedAt:"", testedAt:"" };
  }
  function scrubConnector(config, hasApiKey){
    const next = Object.assign(blankConnector(), config || {}, { mode:"fusion", protocol:"auto", provider:"fusion" });
    delete next.apiKey;
    delete next.hasRequestApiKey;
    delete next.secureUnavailable;
    next.hasApiKey = Boolean(hasApiKey != null ? hasApiKey : next.hasApiKey);
    return next;
  }
  function rawConnector(){
    const key = connectorKey();
    return key ? window.WeishanStore.read(key, {}) || {} : {};
  }
  function connector(){
    const raw = rawConnector();
    const hasApiKey = Boolean(raw.hasApiKey);
    return scrubConnector(raw, hasApiKey);
  }
  function exportedConnectorOverride(){
    return window.WeishanAPI && typeof window.WeishanAPI.connector === "function" && window.WeishanAPI.connector !== connector
      ? window.WeishanAPI.connector
      : null;
  }
  function currentConnectorForSummary(){
    const override = exportedConnectorOverride();
    if (!override) return connector();
    try {
      const next = override() || {};
      return scrubConnector(next, Boolean(next.hasApiKey));
    } catch (_) {
      return connector();
    }
  }
  function exportedConnectorStatusOverride(){
    return window.WeishanAPI && typeof window.WeishanAPI.connectorStatus === "function" && window.WeishanAPI.connectorStatus !== connectorStatus
      ? window.WeishanAPI.connectorStatus
      : null;
  }
  function connectorRuntimeState(){
    const state = window.__WEISHAN_AI_CONNECTOR_RUNTIME_STATE__;
    return state && typeof state === "object" ? state : null;
  }
  function activeConnectorRuntimeState(){
    const runtime = connectorRuntimeState();
    const accountId = String(account().accountId || "");
    if (!runtime || String(runtime.accountId || "") !== accountId) return "";
    return String(runtime.state || "");
  }
  function connectorSummaryPayload(detail){
    return Object.assign({}, connectorSummary(), detail || {});
  }
  function notifyConnectorStatusSubscribers(payload){
    connectorStatusSubscribers.forEach((listener) => {
      try { listener(payload); } catch (_) {}
    });
  }
  function subscribeConnectorStatus(listener){
    if (typeof listener !== "function") return function(){};
    connectorStatusSubscribers.add(listener);
    try { listener(connectorSummaryPayload()); } catch (_) {}
    return function unsubscribeConnectorStatus(){
      connectorStatusSubscribers.delete(listener);
    };
  }
  function setConnectorRuntimeState(state, options){
    const nextState = String(state || "").trim();
    const accountId = String(account().accountId || "");
    const shouldEmit = !(options && options.emit === false);
    if (!nextState) {
      delete window.__WEISHAN_AI_CONNECTOR_RUNTIME_STATE__;
      if (shouldEmit) emitConnectorStatusChanged({ source:"setConnectorRuntimeState", runtimeState:"" });
      return;
    }
    window.__WEISHAN_AI_CONNECTOR_RUNTIME_STATE__ = {
      state:nextState,
      accountId,
      updatedAt:window.WeishanStore && window.WeishanStore.now ? window.WeishanStore.now() : new Date().toISOString()
    };
    if (shouldEmit) emitConnectorStatusChanged({ source:"setConnectorRuntimeState", runtimeState:nextState });
  }
  function normalizeConnectorSummaryState(status){
    const runtimeState = activeConnectorRuntimeState();
    if (runtimeState === "testing") return "testing";
    if (status === "success") return "connected";
    if (status === "failed") return "failed";
    if (status === "saved") return "saved_untested";
    return "not_configured";
  }
  function connectorSummaryLabel(state, provider, model){
    if (state === "connected") return "AI 已连接";
    if (state === "testing") return "AI 测试中";
    if (state === "failed") return "AI 连接失败";
    if (state === "saved_untested") return "AI 未测试";
    return "AI 未配置";
  }
  function connectorStatus(c = connector()){
    if (arguments.length === 0) {
      const override = exportedConnectorStatusOverride();
      if (override) {
        try {
          return String(override() || "empty");
        } catch (_) {}
      }
      c = currentConnectorForSummary();
    }
    if (!account().loggedIn) return "locked";
    if (!c.baseUrl && !c.hasApiKey && !c.chatModel) return "empty";
    if (c.testStatus === "success") return "success";
    if (c.testStatus === "failed") return "failed";
    return "saved";
  }
  function connectorSummary(c = connector()){
    const implicit = arguments.length === 0;
    if (implicit) c = currentConnectorForSummary();
    const status = implicit ? connectorStatus() : connectorStatus(c);
    const provider = c.providerType || c.provider || "model_gateway";
    const model = c.chatModel || "";
    const state = normalizeConnectorSummaryState(status);
    return {
      connected:state === "connected",
      state,
      status,
      rawStatus:status,
      provider,
      model,
      label:connectorSummaryLabel(state, provider, model),
      connector:scrubConnector(c, c.hasApiKey)
    };
  }
  function emitConnectorStatusChanged(detail){
    const payload = connectorSummaryPayload(detail);
    try {
      window.dispatchEvent(new CustomEvent("weishan:ai-connector-status-changed", {
        detail:payload
      }));
    } catch (_) {}
    notifyConnectorStatusSubscribers(payload);
  }
  function secureBridge(){
    if (window.SecureStorageApi) return window.SecureStorageApi;
    return window.weishan && window.weishan.secure ? window.weishan.secure : null;
  }
  async function secureSetApiKey(value){
    const secure = secureBridge();
    const key = apiKeySecureKey();
    if (!key || !value) return { ok:false, error:"SECURE_KEY_UNAVAILABLE" };
    if (!secure || typeof secure.set !== "function") return { ok:false, error:"SECURE_STORAGE_UNAVAILABLE" };
    return secure.set(key, value);
  }
  async function secureStatus(meta){
    const secure = secureBridge();
    if (!secure || typeof secure.status !== "function") return { ok:false, available:false, encryptedAtRest:false, sessionOnly:false };
    return secure.status();
  }
  async function secureReadApiKey(meta){
    const secure = secureBridge();
    const key = apiKeySecureKey();
    if (!key || !secure || typeof secure.get !== "function") return { ok:false, exists:false, value:"", error:"SECURE_STORAGE_UNAVAILABLE" };
    const startedAt = perfStart(meta, "renderer.secureStorage.getKey.start");
    try {
      const res = await secure.get(key, meta && meta.enabled ? meta : undefined);
      const normalized = Object.assign({ ok:false, exists:false, value:"" }, res || {});
      perfEnd(meta, "renderer.secureStorage.getKey.done", startedAt, { hasKey:!!(normalized.ok && normalized.exists && normalized.value) });
      return normalized;
    } catch (err) {
      perfError(meta, "renderer.secureStorage.getKey.error", startedAt, err, { hasKey:false });
      throw err;
    }
  }
  async function secureGetApiKey(meta){
    const res = await secureReadApiKey(meta);
    return res && res.ok && res.exists ? String(res.value || "") : "";
  }
  async function secureDeleteApiKey(){
    const secure = secureBridge();
    const key = apiKeySecureKey();
    if (key && secure && typeof secure.delete === "function") {
      await secure.delete(key);
    }
  }
  async function migrateLegacyApiKey(){
    const key = connectorKey();
    if (!key) return { ok:false, changed:false };
    const raw = rawConnector();
    const legacy = String(raw.apiKey || "").trim();
    if (!legacy) return { ok:true, changed:false, connector:connector() };
    const saved = await secureSetApiKey(legacy);
    if (!saved || !saved.ok) return { ok:false, changed:false, error:saved && saved.error || "SECURE_STORAGE_UNAVAILABLE", connector:connector() };
    const securelySaved = !!(saved.encryptedAtRest && !saved.sessionOnly);
    const mode = securelySaved ? "secure" : (saved.sessionOnly ? "session" : "none");
    const next = Object.assign(scrubConnector(raw, securelySaved), { keyStorageMode:mode });
    window.WeishanStore.write(key, next);
    return { ok:true, changed:true, connector:next };
  }
  async function syncApiKeyPresence(){
    const key = connectorKey();
    if (!key) return { ok:false, changed:false, connector:blankConnector() };
    const migrated = await migrateLegacyApiKey();
    if (migrated && migrated.changed) return migrated;

    const raw = rawConnector();
    if (!raw.hasApiKey) return { ok:true, changed:false, connector:connector() };

    const stored = await secureReadApiKey();
    const hasSecureKey = !!(stored && stored.ok && stored.exists && stored.value && stored.encryptedAtRest && !stored.sessionOnly);
    if (hasSecureKey) {
      if (raw.keyStorageMode !== "secure") {
        const nextSecure = Object.assign(scrubConnector(raw, true), { keyStorageMode:"secure" });
        window.WeishanStore.write(key, nextSecure);
        emitConnectorStatusChanged({ source:"syncApiKeyPresence" });
        return { ok:true, changed:true, connector:nextSecure };
      }
      return { ok:true, changed:false, connector:connector() };
    }

    const next = Object.assign(scrubConnector(raw, false), { keyStorageMode:"none" });
    window.WeishanStore.write(key, next);
    emitConnectorStatusChanged({ source:"syncApiKeyPresence" });
    return { ok:true, changed:true, connector:next };
  }
  async function saveConnector(config){
    const key = connectorKey();
    if (!key) return blankConnector();
    await syncApiKeyPresence();
    const current = connector();
    const apiKey = String(config && config.apiKey || "").trim();
    let hasApiKey = Boolean(current.hasApiKey);
    let keyStorageMode = hasApiKey ? "secure" : "none";
    let keySaved = false;
    let keyUnavailable = false;

    if (apiKey) {
      const status = await secureStatus();
      const saved = await secureSetApiKey(apiKey);
      const persistent = !!(saved && saved.ok && saved.encryptedAtRest && !saved.sessionOnly);
      const sessionOnly = !!(saved && saved.ok && (saved.sessionOnly || status && status.sessionOnly) && !persistent);
      hasApiKey = persistent;
      keySaved = persistent || sessionOnly;
      keyStorageMode = persistent ? "secure" : (sessionOnly ? "session" : "none");
      keyUnavailable = !saved || !saved.ok;
    } else if (current.hasApiKey) {
      const stored = await secureReadApiKey();
      hasApiKey = !!(stored && stored.ok && stored.exists && stored.value && stored.encryptedAtRest && !stored.sessionOnly);
      keyStorageMode = hasApiKey ? "secure" : "none";
      keySaved = hasApiKey;
    } else {
      const stored = await secureReadApiKey();
      if (stored && stored.ok && stored.exists && stored.value && stored.sessionOnly) {
        keyStorageMode = "session";
        keySaved = true;
      }
    }
    const next = Object.assign(scrubConnector(Object.assign(current, config || {}), hasApiKey), { keyStorageMode, savedAt:window.WeishanStore.now(), testStatus:"saved", testMessage:"", testDetail:"", testedAt:"" });
    window.WeishanStore.write(key, next);
    setConnectorRuntimeState("", { emit:false });
    emitConnectorStatusChanged({ source:"saveConnector" });
    return Object.assign({}, next, {
      ok:true,
      configSaved:true,
      keySaved,
      keyStorageMode,
      secureSessionOnly:keyStorageMode === "session",
      secureUnavailable:keyUnavailable
    });
  }
  function saveTest(config, res){
    const key = connectorKey();
    if (!key) return blankConnector();
    const current = connector();
    const next = Object.assign(scrubConnector(Object.assign(current, config || {}), Boolean(current.hasApiKey || config && config.hasApiKey)), {
      testStatus:res.ok ? "success" : "failed",
      testMessage:res.message || res.error || "",
      testDetail:res.testDetail || res.detail || "",
      testedAt:window.WeishanStore.now(),
      detectedProtocol:res.detectedProtocol || "",
      providerType:res.providerType || config && config.providerType || current.providerType || "custom"
    });
    const saved = window.WeishanStore.write(key, next);
    setConnectorRuntimeState("", { emit:false });
    emitConnectorStatusChanged({ source:"saveTest" });
    return saved;
  }
  function saveRuntimeFailure(config){
    if (config && account().loggedIn) return saveTest(config, { ok:false, message:"AI 调用失败" });
    setConnectorRuntimeState("", { emit:false });
    emitConnectorStatusChanged({ source:"saveRuntimeFailure" });
    return blankConnector();
  }
  async function clearConnector(){
    const key = connectorKey();
    if (!key) return blankConnector();
    await secureDeleteApiKey();
    const cleared = window.WeishanStore.write(key, blankConnector());
    setConnectorRuntimeState("", { emit:false });
    emitConnectorStatusChanged({ source:"clearConnector" });
    return cleared;
  }
  async function connectorForRequest(input, meta){
    await syncApiKeyPresence();
    const current = connector();
    const cfg = Object.assign({}, current, input || {});
    const typedKey = String(input && input.apiKey || "").trim();
    cfg.apiKey = typedKey || await secureGetApiKey(meta);
    cfg.hasRequestApiKey = Boolean(cfg.apiKey);
    return cfg;
  }
  async function testConnector(input){
    if (!account().loggedIn) return { ok:false, message:"请先登录后再配置 AI。" };
    const meta = perfMeta("api.aiTest", input && input.__perf);
    let cfg = null;
    setConnectorRuntimeState("testing");
    try {
      cfg = await connectorForRequest(input || {}, meta);
    } catch (err) {
      saveRuntimeFailure(cfg);
      throw err;
    }
    const startedAt = perfStart(meta, "renderer.ipc.invoke.start", { messageCount:1, inputChars:4, hasKey:!!cfg.apiKey });
    let res;
    try {
      res = await window.weishan.ai.testConnector(Object.assign({}, cfg, { __perf:meta.enabled ? meta : undefined }));
      perfEnd(meta, "renderer.ipc.invoke.done", startedAt, { status:res && res.ok ? 200 : 0, messageCount:1, inputChars:4, outputChars:String(res && (res.message || res.error) || "").length, hasKey:!!cfg.apiKey });
    } catch (err) {
      perfError(meta, "renderer.ipc.invoke.error", startedAt, err, { messageCount:1, inputChars:4, hasKey:!!cfg.apiKey });
      saveRuntimeFailure(cfg);
      throw err;
    }
    saveTest(cfg, res);
    return res;
  }
  async function chat(messages, options){
    if (!account().loggedIn) return { ok:false, error:"请先登录，然后到设置中心配置 AI。" };
    const meta = perfMeta("api.aiChat", options && options.__perf);
    const cfg = await connectorForRequest({}, meta);
    if (!cfg.baseUrl) return { ok:false, error:"接口地址未配置。" };
    if (!cfg.apiKey) return { ok:false, error:"AI Key 未配置。" };
    if (!cfg.chatModel) return { ok:false, error:"模型名未配置。" };
    const messageCount = Array.isArray(messages) ? messages.length : 0;
    const inputChars = countMessageChars(messages);
    perfMark(meta, "renderer.api.chat.beforeInvoke", { messageCount, inputChars });
    const startedAt = perfStart(meta, "renderer.ipc.invoke.start", { messageCount, inputChars, hasKey:!!cfg.apiKey });
    let res;
    try {
      res = await window.weishan.ai.chat({ connector:cfg, messages, __perf:meta.enabled ? meta : undefined });
      perfEnd(meta, "renderer.ipc.invoke.done", startedAt, { status:res && res.ok ? 200 : 0, messageCount, inputChars, outputChars:String(res && res.content || "").length, hasKey:!!cfg.apiKey });
    } catch (err) {
      perfError(meta, "renderer.ipc.invoke.error", startedAt, err, { messageCount, inputChars, hasKey:!!cfg.apiKey });
      saveRuntimeFailure(cfg);
      throw err;
    }
    if (res.ok) saveTest(cfg, { ok:true, message:"AI 调用成功", detectedProtocol:res.detectedProtocol });
    else saveRuntimeFailure(cfg);
    return res;
  }
  async function chatStream(messages, options){
    if (!account().loggedIn) return { ok:false, error:"请先登录，然后到设置中心配置 AI。" };
    if (!window.weishan || !window.weishan.ai || typeof window.weishan.ai.chatStream !== "function") {
      return { ok:false, error:"当前桌面端不支持流式 AI 调用。" };
    }
    const meta = perfMeta("api.aiChatStream", options && options.__perf);
    const cfg = await connectorForRequest({}, meta);
    if (!cfg.baseUrl) return { ok:false, error:"接口地址未配置。" };
    if (!cfg.apiKey) return { ok:false, error:"AI Key 未配置。" };
    if (!cfg.chatModel) return { ok:false, error:"模型名未配置。" };
    const messageCount = Array.isArray(messages) ? messages.length : 0;
    const inputChars = countMessageChars(messages);
    const streamId = String(options && options.streamId || createStreamId());
    let chunkCount = 0;
    let outputChars = 0;
    let sawFirstChunk = false;
    const startedAt = perfStart(meta, "renderer.stream.invoke.start", { messageCount, inputChars, hasKey:!!cfg.apiKey });
    let res;
    try {
      res = await window.weishan.ai.chatStream({
        streamId,
        connector:cfg,
        messages,
        __perf:meta.enabled ? meta : undefined
      }, (event) => {
        if (!event) return;
        if (event.type === "delta") {
          const delta = String(event.delta || "");
          if (!sawFirstChunk) {
            sawFirstChunk = true;
            perfEnd(meta, "renderer.stream.firstChunk.done", startedAt, { messageCount, inputChars, outputChars:delta.length });
          }
          chunkCount += 1;
          outputChars += delta.length;
          if (options && typeof options.onDelta === "function") options.onDelta(delta);
        } else if (event.type === "done") {
          if (options && typeof options.onDone === "function") options.onDone(event);
        } else if (event.type === "error" && options && typeof options.onError === "function") {
          options.onError(event.error || {});
        }
      });
      perfEnd(meta, "renderer.stream.invoke.done", startedAt, { status:res && res.ok ? 200 : 0, messageCount, inputChars, outputChars:res && res.content ? String(res.content).length : outputChars, chunkCount, hasKey:!!cfg.apiKey });
    } catch (err) {
      perfError(meta, "renderer.stream.invoke.error", startedAt, err, { messageCount, inputChars, outputChars, chunkCount, hasKey:!!cfg.apiKey });
      saveRuntimeFailure(cfg);
      throw err;
    }
    if (res && res.ok) saveTest(cfg, { ok:true, message:"AI 调用成功", detectedProtocol:res.detectedProtocol });
    else saveRuntimeFailure(cfg);
    return res;
  }
  async function health(){ const r = await fetch(apiBase + "/health"); return r.json(); }
  window.WeishanAPI = { apiBase, connector, connectorKey, connectorStatus, connectorSummary, saveConnector, saveTest, clearConnector, connectorForRequest, migrateLegacyApiKey, syncApiKeyPresence, subscribeConnectorStatus, setConnectorRuntimeState, chat, chatStream, testConnector, health };
})();
