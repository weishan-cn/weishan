const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute, cleanupE2EData } = require("./helpers");

const runId = "E2ESETTINGS-AUTH-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
const email = `${runId.toLowerCase()}@example.test`;
const name = `本地测试用户 ${runId}`;
const password = `local-pass-${runId}`;

async function clearAuthData(page) {
  await page.evaluate((id) => {
    try {
      const prefix = "weishan.v2.";
      const keys = [];
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (!key) continue;
        const value = window.localStorage.getItem(key) || "";
        if (key.includes(id.toLowerCase()) || key.includes(id) || value.includes(id)) keys.push(key);
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
    await expect(page.getByText("登录后才能配置 AI Key")).toBeVisible();
    await expect(page.locator("#apiKey")).toHaveCount(0);
    await expect(page.locator("#saveConnector")).toHaveCount(0);
    await expect(page.locator("#testConnector")).toHaveCount(0);
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

    const status = page.locator("#accountStatus");
    await expect(status).toContainText("本地测试账号存在");
    await expect(status).toContainText("本地测试账号不支持客户端找回密码");
    await expect(status).toContainText("当前不会联网、不会发送邮件、不会读取密钥");
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
    await expect(result).toContainText("暂无真实价格结果");
    await expect(result).not.toContainText("日上海");
    await expect(result).not.toContainText("日期：待补充");
    await expect(result).not.toContainText(/fake price|mock price|demo price|AI 估价/i);
    await expect(result).not.toContainText(/¥|￥|最低价\s*[¥￥]|去预订|预订按钮|付款按钮|下单按钮|提交订单/);
  });
});
