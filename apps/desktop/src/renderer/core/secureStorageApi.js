(function(){
  function normalizePart(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._:-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function normalizeSecureKey(type, id, field) {
    const safeType = normalizePart(type);
    const safeId = normalizePart(id);
    const safeField = normalizePart(field);
    if (!safeType || !safeId || !safeField) return "";
    return [safeType, safeId, safeField].join(".");
  }

  function bridge() {
    return window.weishan && window.weishan.secure ? window.weishan.secure : null;
  }

  async function status(key) {
    const secure = bridge();
    if (!secure || typeof secure.status !== "function") {
      return { ok:false, available:false, encryptedAtRest:false, sessionOnly:true, error:"SECURE_BRIDGE_UNAVAILABLE" };
    }
    return secure.status(key);
  }

  async function set(key, value) {
    const secure = bridge();
    if (!secure || typeof secure.set !== "function") return { ok:false, error:"SECURE_BRIDGE_UNAVAILABLE" };
    return secure.set(key, value);
  }

  async function get(key) {
    return { ok:false, exists:false, value:"", error:"RAW_READBACK_BLOCKED", redacted:true };
  }

  async function remove(key) {
    const secure = bridge();
    if (!secure || typeof secure.delete !== "function") return { ok:false, error:"SECURE_BRIDGE_UNAVAILABLE" };
    return secure.delete(key);
  }

  window.SecureStorageApi = {
    set,
    get,
    delete: remove,
    status,
    normalizeSecureKey
  };
})();
