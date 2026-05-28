(function(){
  const NS = "weishan.v2.";
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(NS + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (_) { return fallback; }
  }
  function write(key, value) {
    localStorage.setItem(NS + key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("weishan:store", { detail: { key } }));
    return value;
  }
  function remove(key) { localStorage.removeItem(NS + key); }
  function now() { return new Date().toISOString(); }
  function uuid(prefix) { return (prefix || "ws") + "-" + Math.random().toString(36).slice(2, 10) + "-" + Date.now().toString(36); }
  window.WeishanStore = { read, write, remove, now, uuid, NS };
})();
