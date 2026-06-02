const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute, cleanupE2EData } = require("./helpers");

const runId = "E2EDESKTOP-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

async function resetDesktopAssistantSession(page) {
  await page.evaluate(() => {
    try {
      window.sessionStorage.removeItem("weishan:desktopAssistant:session:v1");
      window.sessionStorage.removeItem("weishan:desktopAssistant:executionQueue:v1");
      window.localStorage.removeItem("weishan:desktopAssistant:realOpenApp:v1");
      window.localStorage.removeItem("weishan:desktopAssistant:v1");
      if (window.WeishanDesktopAssistant && window.WeishanDesktopAssistant.stopDesktopAssistantSession) {
        window.WeishanDesktopAssistant.stopDesktopAssistantSession();
      }
    } catch (_) {}
  });
}

async function submitHomeCommand(page, text) {
  await gotoRoute(page, "home");
  await expect(page.locator("#commandInput")).toBeVisible();
  await page.locator("#commandInput").fill(text);
  await page.locator("#runBtn").click();
}

async function expectHistory(page, query, pattern) {
  await gotoRoute(page, "history");
  await expect(page.locator("#historySearch")).toBeVisible();
  await page.locator("#historySearch").fill(query);
  await expect(page.locator("#historyList")).toContainText(pattern);
}

test.describe.serial("desktop assistant permission framework", () => {
  let app;
  let page;

  test.beforeAll(async ({ browser }) => {
    app = await launchWeishan(browser);
    page = app.page;
    await resetDesktopAssistantSession(page);
  });

  test.afterAll(async () => {
    if (page) await resetDesktopAssistantSession(page);
    if (page) await cleanupE2EData(page, runId);
    if (app) await app.close();
  });

  test("settings page shows desktop assistant system permission guide", async () => {
    await gotoRoute(page, "settings");
    await expect(page.getByText("桌面助手与自动操作").first()).toBeVisible();
    await expect(page.getByText("系统权限准备").first()).toBeVisible();
    await expect(page.getByText(/Accessibility|辅助功能/).first()).toBeVisible();
    await expect(page.getByText(/Screen Recording|屏幕录制/).first()).toBeVisible();
    await expect(page.getByText(/Automation|自动化/).first()).toBeVisible();
    await expect(page.getByText(/Input Monitoring|输入监控/).first()).toBeVisible();
    await expect(page.getByText(/不申请系统权限|不读取屏幕|不控制鼠标键盘/).first()).toBeVisible();
    await expect(page.getByText(/Chrome \/ Safari \/ Finder \/ WPS \/ Notes \/ Preview/).first()).toBeVisible();
    await expect(page.getByText(/只允许 openApp \/ focusApp|不允许任意命令|不允许 URL 自动打开/).first()).toBeVisible();
  });

  test("default closed state asks user to enable before desktop plan confirmation", async () => {
    await gotoRoute(page, "home");
    await expect(page.getByText("桌面助手：关闭").first()).toBeVisible();
    await submitHomeCommand(page, runId + " 打开 Chrome 搜索 weishan");
    await expect(page.getByText(/桌面助手：关闭|需要先点击首页“桌面助手：本次开启”|realExecution=false/).first()).toBeVisible();
    await expect(page.getByText(/路由判断：桌面助手|desktopAssistant \/ desktopAssistant\.plan|App：Google Chrome/).first()).toBeVisible();
    await expect(page.getByText(/chat\.answer|准备调用 AI 网关|如何打开 Chrome/)).toHaveCount(0);
    await expect(page.locator("#desktopQueueRealOpen")).toHaveCount(0);
  });

  test("open Safari is routed to desktop assistant before chat", async () => {
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + " 打开 Safari");
    await expect(page.getByText(/路由判断：桌面助手|desktopAssistant \/ desktopAssistant\.plan|App：Safari/).first()).toBeVisible();
    await expect(page.getByText(/realExecution=false/).first()).toBeVisible();
    await expect(page.getByText(/chat\.answer|准备调用 AI 网关|如何打开 Safari/)).toHaveCount(0);
  });

  test("session enabled queues and simulates low risk desktop steps without real control", async () => {
    await gotoRoute(page, "home");
    await page.locator("#desktopAssistantEnable").click();
    await expect(page.getByText("桌面助手：本次开启").first()).toBeVisible();
    await submitHomeCommand(page, runId + " 打开 Chrome 搜索 weishan");
    await expect(page.getByText(/桌面操作计划|计划步骤|普通提示/).first()).toBeVisible();
    await expect(page.getByText(/realExecution=false|不申请系统权限|不控制鼠标键盘/).first()).toBeVisible();
    await page.locator("#desktopPlanConfirm").click();
    await expect(page.getByText("桌面助手执行队列").first()).toBeVisible();
    await expect(page.getByText(/queued|executionQueued|realExecution=false/).first()).toBeVisible();
    await page.locator("#desktopQueueSimulate").click();
    await expect(page.getByText(/simulated|executionSimulated|realExecution=false/).first()).toBeVisible();
    await expectHistory(page, runId, /desktopAssistant\.planCreated|planCreated|桌面操作计划/);
    await expectHistory(page, runId, /desktopAssistant\.executionSimulated|executionSimulated|simulated/);
  });

  test("high risk operation is red and blocked after confirmation", async () => {
    await submitHomeCommand(page, runId + " 帮我删除桌面上的文件");
    await expect(page.getByText(/高风险|必须二次确认|requiresSecondConfirm=true/).first()).toBeVisible();
    await expect(page.locator(".desktop-risk-high").first()).toBeVisible();
    await expect(page.getByText(/不会删除文件|不会.*付款|realExecution=false/).first()).toBeVisible();
    await page.locator("#desktopPlanConfirm").click();
    await expect(page.getByText("桌面助手执行队列").first()).toBeVisible();
    await expect(page.getByText(/blocked|executionBlocked|高风险/).first()).toBeVisible();
    await expectHistory(page, runId, /desktopAssistant\.executionBlocked|executionBlocked|blocked/);
  });

  test("stop takeover disables session and stops the current queue", async () => {
    await gotoRoute(page, "home");
    await page.locator("#desktopAssistantStop").click();
    await expect(page.getByText("桌面助手：关闭").first()).toBeVisible();
    await expect(page.getByText(/stopped|桌面助手执行队列|停止/).first()).toBeVisible();
    await expectHistory(page, runId, /desktopAssistant\.stopped|stopped|停止接管/);
  });

  test("real open whitelisted app is disabled by default", async () => {
    await gotoRoute(page, "settings");
    await expect(page.getByText("允许真实打开白名单 App").first()).toBeVisible();
    await expect(page.locator("#desktopAssistantRealOpenApp")).not.toBeChecked();
    await gotoRoute(page, "home");
    await page.locator("#desktopAssistantEnable").click();
    await submitHomeCommand(page, runId + " 打开 Chrome");
    await page.locator("#desktopPlanConfirm").click();
    await expect(page.getByText(/真实打开白名单 App 当前关闭|当前仅模拟执行/).first()).toBeVisible();
    await expect(page.locator("#desktopQueueRealOpen")).toHaveCount(0);
  });

  test("real open whitelisted app uses mocked safe bridge after explicit setting and confirmation", async () => {
    await page.evaluate(() => {
      window.__DA_OPEN_APP_CALLS__ = [];
      window.WeishanAPI = Object.assign({}, window.WeishanAPI || {}, {
        desktopAssistantOpenApp: async (appId) => {
          window.__DA_OPEN_APP_CALLS__.push(appId);
          return { ok:true, action:"openWhitelistedApp", appId, appName:"Google Chrome", realExecution:true };
        }
      });
    });
    await gotoRoute(page, "settings");
    await page.locator("#desktopAssistantEnabled").check();
    await page.locator("#desktopAssistantRealOpenApp").check();
    await gotoRoute(page, "home");
    await page.locator("#desktopAssistantEnable").click();
    await submitHomeCommand(page, runId + " 打开 Chrome");
    await page.locator("#desktopPlanConfirm").click();
    await expect(page.locator("#desktopQueueRealOpen")).toBeVisible();
    await expect(page.getByText(/仅打开或聚焦白名单 App，不点击、不输入、不读屏/).first()).toBeVisible();
    await page.locator("#desktopQueueRealOpen").click();
    await expect(page.getByText(/已真实打开白名单 App|realExecution=true|Google Chrome/).first()).toBeVisible();
    await expect(page.getByText(/未点击、未输入、未读屏、未截图|下一步建议/).first()).toBeVisible();
    await expect.poll(async () => page.evaluate(() => (window.__DA_OPEN_APP_CALLS__ || []).join(","))).toContain("chrome");
    await expectHistory(page, runId, /desktopAssistant.realOpenAppRequested|realOpenAppRequested|realOpenAppExecuted/);
    await expectHistory(page, runId, /desktopAssistant.realOpenAppExecuted|realOpened|safetySummary|Google Chrome/);
  });

  test("real open failure shows a clear safe failure reason", async () => {
    await page.evaluate(() => {
      window.__DA_OPEN_APP_CALLS__ = [];
      window.WeishanAPI = Object.assign({}, window.WeishanAPI || {}, {
        desktopAssistantOpenApp: async (appId) => {
          window.__DA_OPEN_APP_CALLS__.push(appId);
          return { ok:false, code:"APP_OPEN_FAILED", appId, appName:"Google Chrome", message:"系统打开白名单 App 失败，请确认该 App 已安装。", realExecution:false };
        }
      });
    });
    await gotoRoute(page, "settings");
    await page.locator("#desktopAssistantEnabled").check();
    await page.locator("#desktopAssistantRealOpenApp").check();
    await gotoRoute(page, "home");
    await page.locator("#desktopAssistantEnable").click();
    await submitHomeCommand(page, runId + " 打开 Chrome 失败反馈");
    await page.locator("#desktopPlanConfirm").click();
    await expect(page.locator("#desktopQueueRealOpen")).toBeVisible();
    await page.locator("#desktopQueueRealOpen").click();
    await expect(page.getByText(/打开失败|检查该 App 是否已安装|WPS/).first()).toBeVisible();
    await expect.poll(async () => page.evaluate(() => (window.__DA_OPEN_APP_CALLS__ || []).join(","))).toContain("chrome");
    await expectHistory(page, runId, /desktopAssistant.realOpenAppFailed|failed|APP_OPEN_FAILED|检查该 App 是否已安装/);
  });

  test("non whitelist app and high risk operations do not expose real open", async () => {
    await page.evaluate(() => { window.__DA_OPEN_APP_CALLS__ = []; });
    await gotoRoute(page, "home");
    await page.locator("#desktopAssistantEnable").click();
    await submitHomeCommand(page, runId + " 打开 Terminal 执行命令");
    await expect(page.getByText(/路由判断：桌面助手|desktopAssistant \/ desktopAssistant\.plan/).first()).toBeVisible();
    await expect(page.getByText(/chat\.answer|准备调用 AI 网关/)).toHaveCount(0);
    await expect(page.getByText(/高风险|blocked|必须二次确认|该 App 不在白名单/).first()).toBeVisible();
    await page.locator("#desktopPlanConfirm").click();
    await expect(page.getByText(/blocked|高风险|Chrome \/ Safari \/ Finder \/ WPS \/ Notes \/ Preview/).first()).toBeVisible();
    await expect(page.locator("#desktopQueueRealOpen")).toHaveCount(0);
    await submitHomeCommand(page, runId + " 删除文件并发送邮件");
    await expect(page.getByText(/高风险|blocked|必须二次确认/).first()).toBeVisible();
    await expect(page.locator("#desktopQueueRealOpen")).toHaveCount(0);
    await expect.poll(async () => page.evaluate(() => (window.__DA_OPEN_APP_CALLS__ || []).length)).toBe(0);
  });

  test("stopped takeover prevents real open until session is enabled again", async () => {
    await page.evaluate(() => { window.__DA_OPEN_APP_CALLS__ = []; });
    await gotoRoute(page, "settings");
    await page.locator("#desktopAssistantEnabled").check();
    await page.locator("#desktopAssistantRealOpenApp").check();
    await gotoRoute(page, "home");
    await page.locator("#desktopAssistantEnable").click();
    await page.locator("#desktopAssistantStop").click();
    await submitHomeCommand(page, runId + " 打开 Chrome");
    await expect(page.getByText(/桌面助手：关闭|请点击“本次开启”|realExecution=false/).first()).toBeVisible();
    await expect(page.locator("#desktopQueueRealOpen")).toHaveCount(0);
    await expect.poll(async () => page.evaluate(() => (window.__DA_OPEN_APP_CALLS__ || []).length)).toBe(0);
  });
});
