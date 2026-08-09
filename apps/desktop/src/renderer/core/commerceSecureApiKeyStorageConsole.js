;(function () {
  "use strict";

  const SECURE_API_KEY_STORAGE_CONSOLE_VERSION = "4.2.8";

  const PROVIDER_KEY_SLOTS = [
    { providerId:"flight_provider_key", label:"机票 Provider Key" },
    { providerId:"flight_provider_sandbox_key", label:"机票 Provider Sandbox/Test Key" },
    { providerId:"hotel_provider_key", label:"酒店 Provider Key" },
    { providerId:"local_service_provider_key", label:"本地服务 Provider Key" },
    { providerId:"ticket_activity_provider_key", label:"门票 / 活动 Provider Key" }
  ];

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function emptySlot(slot) {
    return {
      providerId:slot.providerId,
      label:slot.label,
      status:"empty",
      keyFingerprint:"",
      keyLast4:"",
      createdAt:"",
      updatedAt:"",
      expiresAt:"",
      storage:"encrypted local only",
      finalDecision:"storage-missing",
      redacted:true
    };
  }

  function buildAuditDraft(storageAvailable) {
    return {
      eventType:"SECURE_API_KEY_STORAGE_IMPLEMENTATION_DRAFT",
      storageProvider:storageAvailable === false ? "unavailable" : "electron_safeStorage",
      storageAvailable:storageAvailable !== false,
      plaintextPersistedCount:0,
      plaintextDisplayedCount:0,
      plaintextExportedCount:0,
      plaintextLoggedCount:0,
      localStorageSecretCount:0,
      sessionStorageSecretCount:0,
      realApiKeyInputCount:0,
      realProviderCallCount:0,
      networkAttemptCount:0,
      realEndpointConnectCount:0,
      realPriceDisplayedCount:0,
      bookingUrlDisplayedCount:0,
      paymentAttemptCount:0,
      orderAttemptCount:0,
      identityUploadAttemptCount:0,
      redacted:true
    };
  }

  function buildSecureApiKeyStorageConsole(snapshot) {
    const raw = snapshot && typeof snapshot === "object" ? snapshot : {};
    const slots = Array.isArray(raw.slots) && raw.slots.length
      ? PROVIDER_KEY_SLOTS.map((slot) => Object.assign(emptySlot(slot), raw.slots.find((item) => item && item.providerId === slot.providerId) || {}))
      : PROVIDER_KEY_SLOTS.map(emptySlot);
    const storageAvailable = raw.storageAvailable !== false;
    return clone({
      version:SECURE_API_KEY_STORAGE_CONSOLE_VERSION,
      status:"secure local storage only",
      mode:"no provider connection",
      realProvider:"disabled",
      realNetwork:"disabled",
      realEndpoint:"disabled",
      realPrice:"disabled",
      availability:"disabled",
      bookingUrl:"disabled",
      checkoutUrl:"disabled",
      paymentUrl:"disabled",
      orderUrl:"disabled",
      payment:"disabled",
      order:"disabled",
      identityUpload:"disabled",
      plaintextDisplay:"disabled",
      plaintextExport:"disabled",
      copyPlaintext:"disabled",
      providerKeySlots:slots,
      auditDraft:raw.auditDraft || buildAuditDraft(storageAvailable),
      display:{
        title:"安全 API Key 存储控制台",
        warning:"请勿输入真实 API Key。本版本仅用于本机安全存储能力验证。",
        statusLine:"status: secure local storage only",
        modeLine:"mode: no provider connection",
        realProviderLine:"real provider disabled",
        realNetworkLine:"real network disabled",
        realEndpointLine:"real endpoint disabled",
        realPriceLine:"real price disabled",
        bookingUrlLine:"bookingUrl disabled",
        paymentLine:"payment disabled",
        orderLine:"order disabled",
        identityUploadLine:"identity upload disabled",
        plaintextDisplayLine:"plaintext display disabled",
        plaintextExportLine:"plaintext export disabled",
        redactedLine:"redacted: true"
      },
      redacted:true
    });
  }

  function assertSecureApiKeyStorageConsoleSafe(state) {
    const safe = state && typeof state === "object" ? state : {};
    const audit = safe.auditDraft || {};
    ["realProvider", "realNetwork", "realEndpoint", "realPrice", "availability", "bookingUrl", "checkoutUrl", "paymentUrl", "orderUrl", "payment", "order", "identityUpload", "plaintextDisplay", "plaintextExport", "copyPlaintext"].forEach((key) => {
      if (safe[key] !== "disabled") throw new Error("secure API key storage console must keep " + key + " disabled");
    });
    ["plaintextPersistedCount", "plaintextDisplayedCount", "plaintextExportedCount", "plaintextLoggedCount", "localStorageSecretCount", "sessionStorageSecretCount", "realApiKeyInputCount", "realProviderCallCount", "networkAttemptCount", "realEndpointConnectCount", "realPriceDisplayedCount", "bookingUrlDisplayedCount", "paymentAttemptCount", "orderAttemptCount", "identityUploadAttemptCount"].forEach((key) => {
      if (audit[key] !== 0) throw new Error("secure API key storage audit counter must stay zero: " + key);
    });
    if (audit.redacted !== true || safe.redacted !== true) throw new Error("secure API key storage console must stay redacted");
    return true;
  }

  function setText(root, selector, value) {
    const node = root && root.querySelector(selector);
    if (node) node.textContent = String(value || "");
  }

  function updateSlot(root, metadata) {
    if (!root || !metadata || !metadata.providerId) return;
    const card = root.querySelector('[data-secure-api-key-slot="' + String(metadata.providerId).replace(/"/g, "") + '"]');
    if (!card) return;
    setText(card, "[data-secure-api-key-slot-status]", "status: " + (metadata.status || "empty"));
    setText(card, "[data-secure-api-key-slot-fingerprint]", "keyFingerprint: " + (metadata.keyFingerprint || ""));
    setText(card, "[data-secure-api-key-slot-last4]", "keyLast4: " + (metadata.keyLast4 || ""));
    setText(card, "[data-secure-api-key-slot-updated]", "updatedAt: " + (metadata.updatedAt || ""));
    setText(card, "[data-secure-api-key-slot-decision]", "final decision: " + (metadata.finalDecision || "storage-missing"));
  }

  function feedback(root, text) {
    setText(root, "[data-secure-api-key-storage-feedback]", text);
  }

  async function handleAction(button) {
    const root = button && button.closest("[data-secure-api-key-storage-console]");
    if (!root) return;
    const action = button.getAttribute("data-secure-api-key-storage-action") || "";
    const providerId = button.getAttribute("data-secure-api-key-provider-id") || "flight_provider_key";
    const bridge = window.weishanSecureApiKeyStorage;
    if (!bridge) {
      feedback(root, "安全存储桥接不可用 · storage unavailable · redacted: true");
      return;
    }
    try {
      let result = null;
      if (action === "save" && typeof bridge.saveProviderKey === "function") {
        const input = root.querySelector("[data-secure-api-key-sandbox-input]");
        const credential = input ? input.value : "";
        result = await bridge.saveProviderKey(providerId, credential);
        if (input) input.value = "";
      }
      else if (action === "rotate" && typeof bridge.rotateProviderKey === "function") result = await bridge.rotateProviderKey(providerId);
      else if (action === "delete" && typeof bridge.deleteProviderKey === "function") result = await bridge.deleteProviderKey(providerId);
      else if (action === "self-test" && typeof bridge.runSecureStorageSelfTest === "function") result = await bridge.runSecureStorageSelfTest();
      else result = { ok:false, error:"UNSUPPORTED_ACTION", redacted:true };

      if (result && result.metadata) updateSlot(root, result.metadata);
      if (action === "self-test") {
        feedback(root, result && result.ok ? "安全存储自检通过 · self-test PASS · redacted: true" : "安全存储自检未通过 · storage unavailable · redacted: true");
      } else if (result && result.ok) {
        feedback(root, "操作完成 · metadata only · redacted: true");
      } else {
        feedback(root, "操作未完成 · " + (result && result.error || "storage unavailable") + " · redacted: true");
      }
    } catch (_) {
      feedback(root, "操作失败 · redacted: true");
    }
  }

  if (typeof document !== "undefined" && !window.__WEISHAN_SECURE_API_KEY_STORAGE_CONSOLE_BOUND__) {
    window.__WEISHAN_SECURE_API_KEY_STORAGE_CONSOLE_BOUND__ = true;
    document.addEventListener("click", function (event) {
      const button = event.target && event.target.closest && event.target.closest("[data-secure-api-key-storage-action]");
      if (!button) return;
      event.preventDefault();
      handleAction(button);
    });
  }

  window.WeishanSecureApiKeyStorageConsole = {
    SECURE_API_KEY_STORAGE_CONSOLE_VERSION,
    PROVIDER_KEY_SLOTS,
    buildSecureApiKeyStorageConsole,
    assertSecureApiKeyStorageConsoleSafe
  };
})();
