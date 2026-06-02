const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute, cleanupE2EData } = require("./helpers");

const runId = "E2EDESKTOP-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

async function resetDesktopAssistantSession(page) {
  await page.evaluate(() => {
    try {
      window.sessionStorage.removeItem("weishan:desktopAssistant:session:v1");
      window.sessionStorage.removeItem("weishan:desktopAssistant:executionQueue:v1");
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
  });

  test("default closed state asks user to enable before desktop plan confirmation", async () => {
    await gotoRoute(page, "home");
    await expect(page.getByText("桌面助手：关闭").first()).toBeVisible();
    await submitHomeCommand(page, runId + " 打开 Chrome 搜索 weishan");
    await expect(page.getByText(/桌面助手：关闭|需要先点击首页“桌面助手：本次开启”|realExecution=false/).first()).toBeVisible();
    await expect(page.getByText(/打开 Chrome|计划步骤/).first()).toBeVisible();
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
});
