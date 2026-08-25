const { contextBridge, ipcRenderer, shell } = require("electron");
const { IPC_CHANNELS } = require("./shared/videoProviderIpcContract");
const desktopPackage = require("../package.json");

contextBridge.exposeInMainWorld("weishan", {
  version: desktopPackage.version,
  productName: desktopPackage.productName || "Weishan",
  apiBase: process.env.WEISHAN_API_BASE || "http://127.0.0.1:8787",
  openExternal: (url) => shell.openExternal(url),
  openWeishanOfficialWebsite: () => ipcRenderer.invoke("weishan:open-official-website"),
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
  },
  videoRuntime: {
    createTask: (input) => ipcRenderer.invoke(IPC_CHANNELS.createTask, input || {}),
    queryTask: (input) => ipcRenderer.invoke(IPC_CHANNELS.queryTask, input || {}),
    cancelTask: (input) => ipcRenderer.invoke(IPC_CHANNELS.cancelTask, input || {}),
    listTasks: (input) => ipcRenderer.invoke(IPC_CHANNELS.listTasks, input || {}),
    downloadArtifacts: (input) => ipcRenderer.invoke(IPC_CHANNELS.downloadArtifacts, input || {}),
    getCapabilities: (input) => ipcRenderer.invoke(IPC_CHANNELS.getCapabilities, input || {}),
    getStatus: (input) => ipcRenderer.invoke(IPC_CHANNELS.getStatus, input || {})
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
  getProviderKeyStatus: (providerId) => ipcRenderer.invoke("secure-api-key:get-status", { providerId:String(providerId || "") }),
  runSecureStorageSelfTest: () => ipcRenderer.invoke("secure-api-key:self-test")
});

contextBridge.exposeInMainWorld("weishanProviderCredentialStore", {
  status: () => ipcRenderer.invoke("provider-credential:status"),
  listMetadata: (filter) => ipcRenderer.invoke("provider-credential:list-metadata", {
    provider:String(filter && filter.provider || ""),
    environment:String(filter && filter.environment || "")
  })
});

contextBridge.exposeInMainWorld("weishanGlobalShopping", {
  rakutenReadonlySearch: (payload) => ipcRenderer.invoke("global-shopping:rakuten-readonly-search", payload || {}),
  getRakutenReadonlyStatus: () => ipcRenderer.invoke("global-shopping:rakuten-readonly-status")
});
