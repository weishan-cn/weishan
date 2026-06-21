const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute, cleanupE2EData } = require("./helpers");

const runId = "E2ESETTINGS-AUTH-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
const email = `${runId.toLowerCase()}@example.test`;
const name = `本地测试用户 ${runId}`;
const password = `local-pass-${runId}`;
const fixedEmail = "local-ui-check-v214@example.local";
const fixedName = "localv214";
const fixedPassword = "LocalOnly-v214-Password-Do-Not-Reuse";

async function clearAuthData(page) {
  await page.evaluate((id) => {
    try {
      const prefix = "weishan.v2.";
      const keys = [];
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (!key) continue;
        const value = window.localStorage.getItem(key) || "";
        if (
          key.includes(id.toLowerCase()) ||
          key.includes(id) ||
          key.includes("local-ui-check-v214@example.local") ||
          value.includes(id) ||
          value.includes("local-ui-check-v214@example.local") ||
          value.includes("localv214")
        ) keys.push(key);
      }
      keys.forEach((key) => window.localStorage.removeItem(key));
      window.localStorage.removeItem(prefix + "account.current");
    } catch (_) {}
  }, runId);
}

function httpRequests(requests) {
  return requests.filter((url) => /^https?:\/\//i.test(url));
}

async function openSettings(page) {
  await gotoRoute(page, "settings");
  await expect(page.locator("#pageHost").getByRole("heading", { name: "设置中心" })).toBeVisible();
}

test.describe.serial("settings local auth hotfix", () => {
  let app;
  let page;
  let requests;
  let pageErrors;

  test.beforeAll(async ({ browser }) => {
    app = await launchWeishan(browser);
    page = app.page;
    requests = [];
    pageErrors = [];
    page.on("request", (request) => requests.push(request.url()));
    page.on("pageerror", (error) => pageErrors.push(error.message || String(error)));
    await clearAuthData(page);
  });

  test.afterAll(async () => {
    if (page) await clearAuthData(page);
    if (page) await cleanupE2EData(page, runId);
    if (app) await app.close();
  });

  test("logged-out settings keeps AI key controls locked", async () => {
    await openSettings(page);

    await expect(page.locator("#accountEmail")).toBeVisible();
    await expect(page.locator("#accountName")).toBeVisible();
    await expect(page.locator("#accountPassword")).toBeVisible();
    await expect(page.locator("#registerBtn")).toBeVisible();
    await expect(page.locator("#loginBtn")).toBeVisible();
    await expect(page.locator("#recoverBtn")).toBeVisible();
    await expect(page.locator("#registerBtn")).toHaveAttribute("type", "button");
    await expect(page.locator("#loginBtn")).toHaveAttribute("type", "button");
    await expect(page.locator("#recoverBtn")).toHaveAttribute("type", "button");
    await expect(page.locator("#registerBtn")).not.toBeDisabled();
    await expect(page.locator("#loginBtn")).not.toBeDisabled();
    await expect(page.locator("#recoverBtn")).not.toBeDisabled();
    await expect(page.locator("#registerBtn")).toHaveClass(/account-action-btn/);
    await expect(page.locator("#loginBtn")).toHaveClass(/account-action-btn/);
    await expect(page.locator("#registerBtn")).toHaveClass(/auth-action-button/);
    await expect(page.locator("#loginBtn")).toHaveClass(/auth-action-button/);
    await expect(page.locator("#recoverBtn")).toHaveClass(/auth-action-button/);
    await expect(page.locator("#registerBtn")).toHaveClass(/auth-action-primary/);
    await expect(page.locator("#loginBtn")).toHaveClass(/auth-action-success/);
    await expect(page.locator("#recoverBtn")).toHaveClass(/auth-action-secondary/);
    await expect(page.locator("#recoverBtn")).toHaveClass(/account-action-recover/);
    await expect(page.locator("#recoverBtn")).not.toHaveClass(/\bgray\b/);
    await expect(page.locator("#recoverBtn")).not.toHaveAttribute("disabled", /.*/);
    await page.locator("#registerBtn").focus();
    await expect(page.locator("#registerBtn")).toBeFocused();
    await page.locator("#loginBtn").focus();
    await expect(page.locator("#loginBtn")).toBeFocused();
    await page.locator("#recoverBtn").focus();
    await expect(page.locator("#recoverBtn")).toBeFocused();
    const buttonStyles = await page.locator("#registerBtn").evaluate((register) => {
      const login = document.querySelector("#loginBtn");
      const recover = document.querySelector("#recoverBtn");
      const read = (el) => {
        const style = window.getComputedStyle(el);
        return {
          height: style.height,
          radius: style.borderRadius,
          weight: style.fontWeight,
          cursor: style.cursor,
          background: style.backgroundColor
        };
      };
      return { register: read(register), login: read(login), recover: read(recover) };
    });
    expect(buttonStyles.register.height).toBe(buttonStyles.login.height);
    expect(buttonStyles.register.height).toBe(buttonStyles.recover.height);
    expect(buttonStyles.register.radius).toBe(buttonStyles.login.radius);
    expect(buttonStyles.register.radius).toBe(buttonStyles.recover.radius);
    expect(buttonStyles.register.weight).toBe(buttonStyles.login.weight);
    expect(buttonStyles.register.weight).toBe(buttonStyles.recover.weight);
    expect(buttonStyles.recover.cursor).not.toBe("not-allowed");
    expect(buttonStyles.recover.background).not.toBe("rgb(229, 231, 235)");
    await expect(page.getByText("登录后才能配置 AI Key")).toBeVisible();
    await expect(page.locator("#apiKey")).toHaveCount(0);
    await expect(page.locator("#saveConnector")).toHaveCount(0);
    await expect(page.locator("#testConnector")).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });

  test("ordinary local auth buttons are clickable and admin email remains blocked", async () => {
    await openSettings(page);
    const before = requests.length;

    await page.locator("#accountEmail").fill("contact@weishan.ai");
    await page.locator("#accountName").fill("admin");
    await page.locator("#accountPassword").fill(fixedPassword);
    await page.locator("#registerBtn").click();
    await expect(page.locator("#registerBtn")).toHaveAttribute("data-feedback-state", "error");
    await expect(page.locator("#registerBtn")).toHaveClass(/is-error/);
    await expect(page.locator("#accountStatus")).toContainText("后台管理员账号，不用于客户端普通用户登录");

    await page.locator("#accountEmail").fill(fixedEmail);
    await page.locator("#accountName").fill(fixedName);
    await page.locator("#accountPassword").fill(fixedPassword);
    await page.locator("#registerBtn").click();
    await expect(page.locator("#pageHost .account-username")).toHaveText(fixedName);
    await expect(page.locator("#pageHost .account-id-line").first()).toContainText(fixedEmail);

    await page.locator("#logoutBtn2").click();
    await page.locator("#accountEmail").fill(fixedEmail);
    await page.locator("#accountPassword").fill(fixedPassword);
    await page.locator("#loginBtn").click();
    await expect(page.locator("#pageHost .account-username")).toHaveText(fixedName);
    await page.locator("#logoutBtn2").click();
    await expect(page.locator("#accountEmail")).toBeVisible();

    const newHttpRequests = httpRequests(requests.slice(before));
    expect(newHttpRequests).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test("local register and login stay offline and avoid plain password storage", async () => {
    await openSettings(page);
    const before = requests.length;

    await page.locator("#accountEmail").fill(email);
    await page.locator("#accountName").fill(name);
    await page.locator("#accountPassword").fill(password);
    await page.locator("#registerBtn").click();

    await expect(page.locator("#pageHost .account-username")).toHaveText(name);
    await expect(page.locator("#pageHost .account-id-line").first()).toContainText(email);
    await expect(page.getByText("已登录 · AI 设置保存到此账号")).toBeVisible();
    await expect(page.locator("#testConnector")).toBeVisible();

    const storedProfile = await page.evaluate((mail) => window.localStorage.getItem("weishan.v2.account.profile." + mail), email);
    expect(storedProfile).toContain("passwordVerifier");
    expect(storedProfile).not.toContain(password);
    expect(storedProfile).not.toContain('"password"');

    await page.locator("#logoutBtn2").click();
    await expect(page.locator("#accountEmail")).toBeVisible();
    await page.locator("#accountEmail").fill(email);
    await page.locator("#accountPassword").fill(password);
    await page.locator("#loginBtn").click();
    await expect(page.locator("#pageHost .account-username")).toHaveText(name);

    const newHttpRequests = httpRequests(requests.slice(before));
    expect(newHttpRequests).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test("recover password shows local-mode notice without network or form clearing", async () => {
    await openSettings(page);
    await page.locator("#logoutBtn2").click();
    await expect(page.locator("#accountEmail")).toBeVisible();

    const before = requests.length;
    await page.locator("#accountEmail").fill(email);
    await page.locator("#accountName").fill(name);
    await page.locator("#accountPassword").fill(password);
    await page.locator("#recoverBtn").click();
    await expect(page.locator("#recoverBtn")).toHaveAttribute("data-feedback-state", "success");
    await expect(page.locator("#recoverBtn")).toHaveClass(/is-success/);

    const status = page.locator("#accountStatus");
    await expect(status).toContainText("本地测试账号存在");
    await expect(status).toContainText("本地模式不联网");
    await expect(status).toContainText("不发邮件");
    await expect(status).toContainText("不读取密钥");
    await expect(status).toContainText("不清空表单");
    await expect(status).toContainText("不跳路由");
    await expect(status).toContainText("不连接真实云账号");
    await expect(status).not.toContainText("邮件已发送");
    await expect(page.locator("#accountEmail")).toHaveValue(email);
    await expect(page.locator("#accountName")).toHaveValue(name);
    await expect(page.locator("#accountPassword")).toHaveValue(password);
    await expect(page.locator("#apiKey")).toHaveCount(0);
    await expect(page.locator("#testConnector")).toHaveCount(0);
    await expect(page.getByText("macOS Keychain 已连接")).toHaveCount(0);
    await expect(page.getByText("Electron safeStorage 已实现")).toHaveCount(0);

    const newHttpRequests = httpRequests(requests.slice(before));
    expect(newHttpRequests).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test("commerce flight result remains stable after auth hotfix", async () => {
    await gotoRoute(page, "home");
    await page.locator("#commandInput").fill("7 月 15 日上海到成都最便宜的机票");
    await page.locator("#runBtn").click();

    const result = page.locator("[data-commerce-home-summary]");
    await expect(result).toContainText("上海");
    await expect(result).toContainText("成都");
    await expect(result).toContainText("7 月 15 日");
    await expect(result).toContainText("低价优先");
    await expect(result).toContainText("暂无生产真实价格结果");
    await expect(result).toContainText("Limited Beta");
    await expect(result).not.toContainText("日上海");
    await expect(result).not.toContainText("日期：待补充");
    await expect(result).not.toContainText(/fake price|mock price|demo price|AI 估价/i);
    await expect(result).not.toContainText(/最低价\s*[¥￥]|去预订|预订按钮|付款按钮|下单按钮|提交订单/);
  });
});
