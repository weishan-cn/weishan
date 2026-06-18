(function(){
  const RESERVED_ADMIN_EMAILS = ["contact@weishan.ai"];

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function isReservedAdminEmail(email) {
    return RESERVED_ADMIN_EMAILS.includes(normalizeEmail(email));
  }

  function current() {
    return window.WeishanStore.read("account.current", {
      loggedIn:false,
      email:"",
      name:"",
      accountId:""
    });
  }

  function profile(email) {
    const key = normalizeEmail(email || current().email);
    if (!key) return null;
    return window.WeishanStore.read("account.profile." + key, null);
  }

  function publicName(acc) {
    const a = acc || current();
    return a.name || (a.email ? a.email.split("@")[0] : "");
  }

  function validateInput(input, mode) {
    const email = normalizeEmail(input.email);
    const name = String(input.name || "").trim();
    const password = String(input.password || "").trim();

    if (!email || !email.includes("@")) {
      return { ok:false, error:"请输入普通用户邮箱。" };
    }

    if (isReservedAdminEmail(email)) {
      return {
        ok:false,
        error:"这个邮箱是后台管理员账号，不用于客户端普通用户登录。请换一个普通用户邮箱注册。"
      };
    }

    if (mode === "register" && !name) {
      return { ok:false, error:"请填写用户名。注册成功后会显示用户名、邮箱和账号 ID。" };
    }

    if (!password || password.length < 4) {
      return { ok:false, error:"密码至少 4 位。" };
    }

    return { ok:true, email, name, password };
  }

  function passwordVerifier(email, password) {
    const raw = normalizeEmail(email) + "::" + String(password || "");
    let hash = 2166136261;
    for (let i = 0; i < raw.length; i += 1) {
      hash ^= raw.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return "local-v1:" + (hash >>> 0).toString(16);
  }

  function matchesPassword(saved, email, password) {
    if (!saved) return false;
    if (saved.passwordVerifier) return saved.passwordVerifier === passwordVerifier(email, password);
    return saved.password === password;
  }

  function withoutSensitiveProfileFields(profile) {
    const next = Object.assign({}, profile || {});
    delete next.password;
    delete next.token;
    delete next.secret;
    delete next.apiKey;
    return next;
  }

  function register(input) {
    const v = validateInput(input || {}, "register");
    if (!v.ok) return v;

    const existing = profile(v.email);
    if (existing) {
      return { ok:false, error:"该邮箱已注册。请点击“登录已有账号”。" };
    }

    const accountId = "ws-" + Math.random().toString(36).slice(2, 10) + "-" + Date.now().toString(36);
    const nextProfile = {
      email:v.email,
      name:v.name,
      passwordVerifier:passwordVerifier(v.email, v.password),
      accountId,
      emailVerified:false,
      authenticatorEnabled:false,
      recoveryCodes:[],
      localMode:true,
      createdAt:window.WeishanStore.now()
    };

    window.WeishanStore.write("account.profile." + v.email, nextProfile);

    const session = {
      loggedIn:true,
      email:v.email,
      name:v.name,
      accountId
    };

    window.WeishanStore.write("account.current", session);
    window.HistoryApi.record("account.register", {
      email:v.email,
      accountId,
      localMode:true
    });
    window.dispatchEvent(new CustomEvent("weishan:account"));
    return { ok:true, account:session, message:"注册成功，已登录。" };
  }

  function login(input) {
    const v = validateInput(input || {}, "login");
    if (!v.ok) return v;

    const saved = profile(v.email);
    if (!saved) {
      return { ok:false, error:"本地没有这个普通用户账号。请先点击“注册并登录”。" };
    }

    if (!matchesPassword(saved, v.email, v.password)) {
      return { ok:false, error:"邮箱或密码不匹配。" };
    }

    if (saved.password) {
      window.WeishanStore.write("account.profile." + v.email, Object.assign(withoutSensitiveProfileFields(saved), {
        passwordVerifier:passwordVerifier(v.email, v.password)
      }));
    }

    const session = {
      loggedIn:true,
      email:saved.email,
      name:saved.name,
      accountId:saved.accountId
    };

    window.WeishanStore.write("account.current", session);
    window.HistoryApi.record("account.login", {
      email:saved.email,
      accountId:saved.accountId
    });
    window.dispatchEvent(new CustomEvent("weishan:account"));
    return { ok:true, account:session, message:"登录成功。" };
  }

  function logout() {
    const c = current();
    window.WeishanStore.write("account.current", {
      loggedIn:false,
      email:"",
      name:"",
      accountId:""
    });
    window.HistoryApi.record("account.logout", {
      email:c.email,
      accountId:c.accountId
    });
    window.dispatchEvent(new CustomEvent("weishan:account"));
    return { ok:true };
  }

  function recover(input) {
    const email = normalizeEmail((input && input.email) || "");
    const notice = "本地模式说明：本地模式不联网，不发邮件，不读取密钥，不清空表单，不跳路由，不连接真实云账号，不显示发送成功提示。";
    if (!email) return { ok:false, error:"请输入邮箱。" + notice };

    if (isReservedAdminEmail(email)) {
      return { ok:false, error:"后台管理员账号不用于客户端普通用户登录；请到后台管理服务处理。" + notice };
    }

    const saved = profile(email);
    if (!saved) {
      return { ok:false, error:"本地没有该普通用户账号。" + notice };
    }

    return {
      ok:true,
      message:"本地测试账号存在，但当前客户端不执行真实找回密码。" + notice
    };
  }

  function updateSecurity(flags) {
    const cur = current();
    if (!cur.loggedIn) return { ok:false, error:"请先登录。" };

    const p = profile(cur.email);
    const next = Object.assign({}, p || {}, flags || {});
    window.WeishanStore.write("account.profile." + cur.email, next);
    return { ok:true, profile:next };
  }

  window.AccountApi = {
    current,
    profile,
    publicName,
    register,
    login,
    logout,
    recover,
    updateSecurity,
    isReservedAdminEmail
  };
})();
