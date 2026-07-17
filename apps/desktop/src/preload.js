const { contextBridge, ipcRenderer, shell } = require("electron");

contextBridge.exposeInMainWorld("weishan", {
  version: "2.0.15",
  productName: "weishan",
  apiBase: process.env.WEISHAN_API_BASE || "http://127.0.0.1:8787",
  openExternal: (url) => shell.openExternal(url),
  chooseFiles: () => ipcRenderer.invoke("weishan:choose-files"),
  desktopAssistantOpenApp: (appId) => ipcRenderer.invoke("desktopAssistant:openWhitelistedApp", String(appId || "")),
  secure: {
    set: (key, value) => {
      const safeKey = String(key || "").trim();
      if (!safeKey) return Promise.resolve({ ok: false, error: "INVALID_KEY" });
      return ipcRenderer.invoke("weishan:secure-set", { key: safeKey, value: String(value || "") });
    },
    get: (key, perfMeta) => {
      const safeKey = String(key || "").trim();
      if (!safeKey) return Promise.resolve({ ok: false, error: "INVALID_KEY" });
      return ipcRenderer.invoke("weishan:secure-get", { key: safeKey, __perf:perfMeta && perfMeta.enabled ? perfMeta : undefined });
    },
    delete: (key) => {
      const safeKey = String(key || "").trim();
      if (!safeKey) return Promise.resolve({ ok: false, error: "INVALID_KEY" });
      return ipcRenderer.invoke("weishan:secure-delete", { key: safeKey });
    },
    status: () => ipcRenderer.invoke("weishan:secure-status")
  },
  ai: {
    testConnector: (connector) => ipcRenderer.invoke("weishan:ai-test", connector || {}),
    chat: (payload) => ipcRenderer.invoke("weishan:ai-chat", payload || {}),
    chatStream: (payload, onEvent) => {
      const request = payload || {};
      const streamId = String(request.streamId || "");
      const listener = (_event, message) => {
        if (!message || String(message.streamId || "") !== streamId) return;
        if (typeof onEvent === "function") onEvent(message);
      };
      ipcRenderer.on("weishan:ai-chat-stream:event", listener);
      return ipcRenderer.invoke("weishan:ai-chat-stream", request).finally(() => {
        ipcRenderer.removeListener("weishan:ai-chat-stream:event", listener);
      });
    }
  }
});

contextBridge.exposeInMainWorld("weishanLimitedBetaPreference", {
  getLimitedBetaPreference: () => ipcRenderer.invoke("limited-beta-preference:get"),
  setLimitedBetaPreferenceDraft: (preference) => ipcRenderer.invoke("limited-beta-preference:set-draft", { preference:preference || {} }),
  turnOffLimitedBetaPreference: (payload) => ipcRenderer.invoke("limited-beta-preference:turn-off", { reason:String(payload && payload.reason || "") }),
  requestRestoreLimitedBetaPreference: (payload) => ipcRenderer.invoke("limited-beta-preference:request-restore", { reason:String(payload && payload.reason || "") }),
  confirmRestoreLimitedBetaPreference: (payload) => ipcRenderer.invoke("limited-beta-preference:confirm-restore", { reason:String(payload && payload.reason || "") }),
  forceRollbackLimitedBetaPreference: (payload) => ipcRenderer.invoke("limited-beta-preference:force-rollback", { reason:String(payload && payload.reason || "") }),
  clearLimitedBetaPreference: () => ipcRenderer.invoke("limited-beta-preference:clear"),
  getLimitedBetaPreferenceAuditDraft: (payload) => ipcRenderer.invoke("limited-beta-preference:audit-draft", { action:String(payload && payload.action || "") })
});

contextBridge.exposeInMainWorld("weishanSecureApiKeyStorage", {
  listProviderKeys: () => ipcRenderer.invoke("secure-api-key:list"),
  saveProviderKey: (providerId, credential) => ipcRenderer.invoke("secure-api-key:save", { providerId:String(providerId || ""), credential:String(credential || "") }),
  deleteProviderKey: (providerId) => ipcRenderer.invoke("secure-api-key:delete", { providerId:String(providerId || "") }),
  rotateProviderKey: (providerId) => ipcRenderer.invoke("secure-api-key:rotate", { providerId:String(providerId || "") }),
  getProviderKeyStatus: (providerId) => ipcRenderer.invoke("secure-api-key:get-status", { providerId:String(providerId || "") }),
  runSecureStorageSelfTest: () => ipcRenderer.invoke("secure-api-key:self-test")
});

contextBridge.exposeInMainWorld("weishanGlobalShopping", {
  rakutenReadonlySearch: (payload) => ipcRenderer.invoke("global-shopping:rakuten-readonly-search", payload || {}),
  getRakutenReadonlyStatus: () => ipcRenderer.invoke("global-shopping:rakuten-readonly-status")
});
