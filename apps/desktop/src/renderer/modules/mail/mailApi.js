(function(){
  const API_BASE = (window.weishan && window.weishan.apiBase) || "http://127.0.0.1:8787";
  const sessionAuthorizationCodes = new Map();
  const sessionHtmlBodies = new Map();

  function now(){ return new Date().toISOString(); }
  function t(key){ return window.I18n ? window.I18n.t(key) : key; }
  function norm(email){ return String(email || "").trim().toLowerCase(); }
  function secretKey(email){
    const safeEmail = norm(email).replace(/[^a-z0-9._:-]+/g, "-");
    return safeEmail ? "mail.account." + safeEmail + ".authorizationCode" : "";
  }
  function bodyKey(email, uid){
    return norm(email) + ":" + String(uid || "");
  }
  function rememberBodyHtml(email, uid, html){
    const key = bodyKey(email, uid);
    const value = String(html || "");
    if (!key || /:$/.test(key)) return;
    if (value) sessionHtmlBodies.set(key, value);
    else sessionHtmlBodies.delete(key);
  }
  function bodyHtml(email, uid){
    return sessionHtmlBodies.get(bodyKey(email, uid)) || "";
  }
  function rememberAuthorizationCode(email, password){
    const safeEmail = norm(email);
    const value = String(password || "");
    if (!safeEmail) return;
    if (value) sessionAuthorizationCodes.set(safeEmail, value);
    else sessionAuthorizationCodes.delete(safeEmail);
  }
  function secureBridge(){
    if (window.SecureStorageApi) return window.SecureStorageApi;
    return window.weishan && window.weishan.secure ? window.weishan.secure : null;
  }

  function providerFor(email){
    const e = norm(email);
    if (/@qq\.com$/.test(e) || /@foxmail\.com$/.test(e)) return { provider:"qq", label:"QQ 邮箱", host:"imap.qq.com", port:993 };
    if (/@163\.com$/.test(e)) return { provider:"163", label:"网易 163", host:"imap.163.com", port:993 };
    if (/@126\.com$/.test(e)) return { provider:"126", label:"网易 126", host:"imap.126.com", port:993 };
    if (/@gmail\.com$/.test(e)) return { provider:"gmail", label:"Gmail", host:"imap.gmail.com", port:993 };
    if (/@outlook\.com$/.test(e) || /@hotmail\.com$/.test(e) || /@live\.com$/.test(e)) return { provider:"outlook", label:"Outlook", host:"outlook.office365.com", port:993 };
    if (/@icloud\.com$/.test(e) || /@me\.com$/.test(e) || /@mac\.com$/.test(e)) return { provider:"icloud", label:"iCloud", host:"imap.mail.me.com", port:993 };
    if (/@yahoo\.com$/.test(e)) return { provider:"yahoo", label:"Yahoo", host:"imap.mail.yahoo.com", port:993 };
    return { provider:"custom", label:"自定义 IMAP", host:"", port:993 };
  }

  function emptyState(){
    return { accounts:[], activeEmail:"", lastStatus:"idle", lastMessage:"", updatedAt:"" };
  }

  function scrubMessage(message){
    const next = Object.assign({}, message || {});
    delete next.bodyHtml;
    delete next.htmlText;
    delete next.rawHtml;
    delete next.rawBody;
    delete next.html;
    return next;
  }

  function scrubAccount(account){
    const next = Object.assign({}, account || {});
    delete next.password;
    delete next.appPassword;
    delete next.authorizationCode;
    delete next.authCode;
    delete next.token;
    delete next.accessToken;
    delete next.refreshToken;
    delete next.secret;
    if (Array.isArray(next.messages)) next.messages = next.messages.map(scrubMessage);
    return next;
  }

  function scrubState(next){
    const saved = Object.assign(emptyState(), next || {}, { updatedAt:now() });
    saved.accounts = (saved.accounts || []).map(scrubAccount);
    return saved;
  }

  function state(){
    const raw = Object.assign(emptyState(), window.WeishanStore.read("mail.state", emptyState()) || {});
    const clean = scrubState(raw);
    if (JSON.stringify(raw) !== JSON.stringify(clean)) window.WeishanStore.write("mail.state", clean);
    return clean;
  }

  function saveState(next){
    const saved = scrubState(next);
    window.WeishanStore.write("mail.state", saved);
    return saved;
  }

  function upsertAccount(account){
    const s = state();
    const email = norm(account.email);
    const list = (s.accounts || []).filter((x) => norm(x.email) !== email);
    const next = scrubAccount(Object.assign({
      email, label:"邮箱", provider:"custom", host:"", port:993,
      connected:false, status:"idle", message:"",
      total:0, unseen:0, messages:[], createdAt:now(), updatedAt:now()
    }, account || {}, { email, updatedAt:now() }));
    list.unshift(next);
    return saveState(Object.assign(s, { accounts:list, activeEmail:email, lastStatus:next.status, lastMessage:next.message || "" }));
  }

  function updateAccount(email, patch){
    const target = norm(email);
    const s = state();
    const list = (s.accounts || []).map((x) => norm(x.email) === target ? scrubAccount(Object.assign({}, x, patch || {}, { updatedAt:now() })) : scrubAccount(x));
    return saveState(Object.assign(s, {
      accounts:list,
      activeEmail:target || s.activeEmail,
      lastStatus:(patch && patch.status) || s.lastStatus,
      lastMessage:(patch && patch.message) || s.lastMessage
    }));
  }

  function removeAccount(email){
    const target = norm(email);
    const s = state();
    const list = (s.accounts || []).filter((x) => norm(x.email) !== target);
    return saveState(Object.assign(s, { accounts:list, activeEmail:s.activeEmail === target ? ((list[0] && list[0].email) || "") : s.activeEmail }));
  }

  function activeAccount(){
    const s = state();
    return (s.accounts || []).find((x) => norm(x.email) === norm(s.activeEmail)) || (s.accounts || [])[0] || null;
  }

  async function health(){
    try {
      const r = await fetch(API_BASE + "/health");
      const data = await r.json();
      return { ok:!!data.ok, message:data.ok ? "本地后端已连接。" : "本地后端返回异常。", data };
    } catch (err) {
      return { ok:false, message:"本地后端未启动。请先运行 npm run dev:server。", error:String(err && err.message || err) };
    }
  }

  function readableError(err){
    const msg = String((err && err.message) || err || "");
    if (/Failed to fetch|ECONNREFUSED|Couldn.t connect|connect to server/i.test(msg)) return "本地后端未启动。请先运行 npm run dev:server。";
    if (/AUTHENTICATIONFAILED|authentication|login failed|Invalid credentials/i.test(msg)) return "邮箱认证失败。请确认 IMAP 已开启，并使用授权码 / App Password，不要用网页登录密码。";
    if (/timeout|ETIMEDOUT/i.test(msg)) return "连接超时。请检查网络、IMAP host 和端口。";
    return msg || "邮箱连接失败。";
  }

  async function postJson(path, body){
    const r = await fetch(API_BASE + path, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify(body || {})
    });
    const text = await r.text();
    let data = null;
    try { data = JSON.parse(text); } catch (_) { data = { ok:false, raw:text }; }
    if (!r.ok) {
      const err = new Error(data.error || data.message || text || ("HTTP " + r.status));
      err.data = data;
      throw err;
    }
    return data;
  }

  async function getJson(path){
    const r = await fetch(API_BASE + path);
    const text = await r.text();
    let data = null;
    try { data = JSON.parse(text); } catch (_) { data = { ok:false, raw:text }; }
    if (!r.ok) {
      const err = new Error(data.error || data.message || text || ("HTTP " + r.status));
      err.data = data;
      throw err;
    }
    return data;
  }

  function payload(input){
    const email = norm(input.email);
    const detected = providerFor(email);
    return {
      email,
      password:String(input.password || "").trim(),
      provider:detected.provider,
      label:detected.label,
      host:String(input.host || detected.host || "").trim(),
      port:Number(input.port || detected.port || 993),
      secure:true
    };
  }

  async function secureStatus(){
    const secure = secureBridge();
    if (!secure || typeof secure.status !== "function") return { ok:false, available:false, sessionOnly:true, encryptedAtRest:false };
    try { return await secure.status(); } catch (_) { return { ok:false, available:false, sessionOnly:true, encryptedAtRest:false }; }
  }

  async function saveAuthorizationCode(email, password){
    const secure = secureBridge();
    const key = secretKey(email);
    if (!secure || !key || typeof secure.set !== "function") return { ok:false, saved:false, unavailable:true };
    const status = await secureStatus();
    if (!status.available) return { ok:false, saved:false, unavailable:true };
    const res = await secure.set(key, password);
    return Object.assign({ saved:!!(res && res.ok) }, res || {});
  }

  async function loadAuthorizationCode(email){
    return "";
  }

  async function deleteAuthorizationCode(email){
    const secure = secureBridge();
    const key = secretKey(email);
    if (!secure || !key || typeof secure.delete !== "function") return { ok:false };
    rememberAuthorizationCode(email, "");
    try { return await secure.delete(key); } catch (_) { return { ok:false }; }
  }

  async function resolvePasswordForAccount(account){
    if (!account || !account.email) return "";
    const sessionValue = sessionAuthorizationCodes.get(norm(account.email)) || "";
    if (sessionValue) return sessionValue;
    if (!account.hasAuthorizationCode) return "";
    return loadAuthorizationCode(account.email);
  }

  async function getMailAuthorizationCodeForRequest(account){
    const password = await resolvePasswordForAccount(account);
    if (password) return { ok:true, password };
    return { ok:false, password:"", message:t("mailSavedAuthorizationMissing") };
  }

  async function connect(input){
    const p = payload(input || {});
    const saveSecret = !!(input && input.saveAuthorizationCode);
    if (!p.email || !p.email.includes("@")) return { ok:false, status:"failed", message:"请输入邮箱地址。" };
    if (!p.password) return { ok:false, status:"failed", message:"请输入邮箱授权码 / App Password。" };
    if (!p.host) return { ok:false, status:"failed", message:"无法自动识别 IMAP host，请展开高级 IMAP 手动填写。" };

    upsertAccount(Object.assign({}, p, { connected:false, status:"connecting", message:"正在连接邮箱...", hasAuthorizationCode:false }));

    const h = await health();
    if (!h.ok) {
      updateAccount(p.email, { connected:false, status:"failed", message:h.message });
      return { ok:false, status:"failed", message:h.message };
    }

    try {
      const data = await postJson("/v1/email/connect/imap-test", p);
      if (!data.ok) throw new Error(data.error || data.message || "邮箱连接失败。");
      rememberAuthorizationCode(p.email, p.password);

      try { await postJson("/v1/email/account/save", p); } catch (_) {}

      let secretSaved = false;
      let secretUnavailable = false;
      if (saveSecret) {
        const savedSecret = await saveAuthorizationCode(p.email, p.password);
        secretSaved = !!(savedSecret && savedSecret.ok);
        secretUnavailable = !!(savedSecret && savedSecret.unavailable);
      }

      const mailbox = data.mailbox || {};
      let messages = Array.isArray(data.messages) ? data.messages : [];
      let synced = null;
      try {
        synced = await syncSnapshot(200, p.password);
        messages = Array.isArray(synced.messages) && synced.messages.length ? synced.messages : messages;
      } catch (_) {}

      const syncedCount = synced ? Number(synced.indexed || messages.length || 0) : messages.length;
      const total = Number((synced && synced.mailbox && synced.mailbox.total) || mailbox.total || messages.length || 0);
      const account = scrubAccount(Object.assign({}, p, {
        connected:true,
        status:"connected",
        message:`连接成功，已同步 ${syncedCount || messages.length} 封邮件。`,
        total,
        unseen:(synced && synced.mailbox && synced.mailbox.unseen) || mailbox.unseen || 0,
        secure:true,
        hasAuthorizationCode:secretSaved,
        lastConnectedAt:now(),
        syncLimit:synced ? 200 : messages.length,
        syncedCount,
        canSyncMore:total > syncedCount,
        messages,
        lastReadAt:now()
      }));
      upsertAccount(account);
      return { ok:true, status:"connected", message:account.message, account, raw:data, secureUnavailable:secretUnavailable };
    } catch (err) {
      const msg = readableError(err);
      updateAccount(p.email, { connected:false, status:"failed", message:msg });
      return { ok:false, status:"failed", message:msg, error:String(err && err.message || err) };
    }
  }

  async function syncSnapshot(limit, password){
    const safeLimit = Math.max(1, Math.min(Number(limit || 200), 1000));
    const body = { limit:safeLimit };
    if (password) body.password = password;
    const index = await postJson("/v1/email/sync/index", body);
    const data = await getJson("/v1/email/sync/messages");
    return {
      ok:true,
      limit:safeLimit,
      mailbox:index.mailbox || {},
      indexed:Number(index.indexed || data.total || (data.messages || []).length || 0),
      categories:index.categories || {},
      updatedAt:index.updatedAt || now(),
      messages:Array.isArray(data.messages) ? data.messages : []
    };
  }

  async function syncMore(limit){
    const active = activeAccount();
    if (!active || !active.email) return { ok:false, message:"请先连接邮箱。" };
    try {
      const secret = await getMailAuthorizationCodeForRequest(active);
      if (!secret.ok) return { ok:false, message:secret.message };
      const synced = await syncSnapshot(limit || Math.min(Number(active.syncLimit || 200) + 200, 1000), secret.password);
      const total = Number((synced.mailbox && synced.mailbox.total) || active.total || synced.indexed || 0);
      const syncedCount = Number(synced.indexed || synced.messages.length || 0);
      updateAccount(active.email, {
        connected:true,
        status:"connected",
        message:`已同步 ${syncedCount} 封邮件。`,
        total,
        unseen:(synced.mailbox && synced.mailbox.unseen) || active.unseen || 0,
        syncLimit:synced.limit,
        syncedCount,
        canSyncMore:total > syncedCount,
        messages:synced.messages,
        lastReadAt:now()
      });
      return { ok:true, message:`已同步 ${syncedCount} 封邮件。`, syncedCount, total, account:activeAccount() };
    } catch (err) {
      return { ok:false, message:readableError(err), error:String(err && err.message || err) };
    }
  }

  async function loadBody(uid){
    const active = activeAccount();
    if (!active || !active.email) return { ok:false, message:"请先连接邮箱。" };
    const safeUid = Number(uid || 0);
    if (!safeUid) return { ok:false, message:"缺少邮件 UID。" };

    try {
      const secret = await getMailAuthorizationCodeForRequest(active);
      if (!secret.ok) return { ok:false, message:secret.message };
      const body = { password:secret.password };
      const data = await postJson("/v1/email/sync/body/" + encodeURIComponent(String(safeUid)), body);
      const full = data.message || null;
      if (!full) return { ok:false, message:"没有读取到邮件正文。" };
      rememberBodyHtml(active.email, safeUid, full.bodyHtml || full.html || full.htmlText || "");

      const safeFull = scrubMessage(full);
      const messages = (active.messages || []).map((m) => Number(m && m.uid) === safeUid ? Object.assign({}, m, safeFull) : m);
      if (!messages.some((m) => Number(m && m.uid) === safeUid)) messages.unshift(safeFull);

      updateAccount(active.email, {
        messages,
        lastReadAt:now(),
        message:"正文已加载。"
      });

      return { ok:true, message:"正文已加载。", mail:full, account:activeAccount() };
    } catch (err) {
      return { ok:false, message:readableError(err), error:String(err && err.message || err) };
    }
  }

  window.MailApi = {
    API_BASE, state, saveState, providerFor, upsertAccount,
    updateAccount, removeAccount, activeAccount, health, connect, syncMore, loadBody,
    secureStatus, saveAuthorizationCode, loadAuthorizationCode, deleteAuthorizationCode,
    getMailAuthorizationCodeForRequest, bodyHtml
  };
})();
