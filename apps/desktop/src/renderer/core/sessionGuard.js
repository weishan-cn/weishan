(function(){
  const NS = "weishan.v2.";
  const RESERVED_ADMIN_EMAILS = ["contact@weishan.ai"];

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(NS + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(NS + key, JSON.stringify(value));
  }

  function remove(key) {
    localStorage.removeItem(NS + key);
  }

  function clean() {
    const cur = read("account.current", { loggedIn:false, email:"", name:"", accountId:"" });
    const email = String(cur.email || "").trim().toLowerCase();

    if (RESERVED_ADMIN_EMAILS.includes(email)) {
      if (cur.accountId) remove("api.connector." + cur.accountId);
      remove("account.profile." + email);
      write("account.current", { loggedIn:false, email:"", name:"", accountId:"" });
      write("account.lastCleanup", {
        reason:"reserved_admin_email",
        email,
        accountId:cur.accountId || "",
        cleanedAt:new Date().toISOString()
      });
      console.warn("[weishan] cleaned reserved admin email session:", email);
    }

    RESERVED_ADMIN_EMAILS.forEach(function(adminEmail){
      const p = read("account.profile." + adminEmail, null);
      if (p && p.accountId) remove("api.connector." + p.accountId);
      remove("account.profile." + adminEmail);
    });
  }

  clean();
  window.WeishanSessionGuard = { clean };
})();
