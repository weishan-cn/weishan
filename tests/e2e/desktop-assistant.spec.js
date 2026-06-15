const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute, cleanupE2EData } = require("./helpers");

const runId = "E2EDESKTOPPAUSED-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

async function resetDesktopAssistantSession(page) {
  await page.evaluate((id) => {
    try {
      window.sessionStorage.removeItem("weishan:desktopAssistant:session:v1");
      window.sessionStorage.removeItem("weishan:desktopAssistant:executionQueue:v1");
      window.sessionStorage.removeItem("weishan:desktopAssistant:tasks:v1");
      window.localStorage.removeItem("weishan:desktopAssistant:realOpenApp:v1");
      window.localStorage.removeItem("weishan:desktopAssistant:v1");
      const keys = ["command.queue.v205", "command.history.v205"];
      keys.forEach((key) => {
        try {
          const value = JSON.parse(window.localStorage.getItem(key) || "[]");
          if (Array.isArray(value)) {
            window.localStorage.setItem(key, JSON.stringify(value.filter((item) => JSON.stringify(item || {}).indexOf(id) === -1)));
          }
        } catch (_) {}
      });
    } catch (_) {}
  }, runId);
}

async function submitHomeCommand(page, text) {
  await gotoRoute(page, "home");
  await expect(page.locator("#commandInput")).toBeVisible();
  await page.locator("#commandInput").fill(text);
  await page.locator("#runBtn").click();
}

function currentTaskLogs(page) {
  return page.locator(".cmd-log-list").first();
}

async function setMockSettingsAi(page) {
  await page.evaluate(() => {
    if (!window.WeishanAPI) return;
    window.WeishanAPI.connector = () => ({
      providerType:"OpenRouter",
      chatModel:"aion-labs/aion-1.0-mini",
      hasApiKey:true,
      testStatus:"success"
    });
    window.WeishanAPI.connectorStatus = () => "success";
    window.WeishanAPI.chat = async () => ({
      ok:true,
      content:"成都到上海的常规交通方案可以比较高铁、飞机和长途客车；实时票价以实际查询为准。"
    });
    window.dispatchEvent(new CustomEvent("weishan:command"));
  });
}

test.describe.serial("desktop assistant paused safety framework", () => {
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

  test("home hides desktop takeover controls and task queue", async () => {
    await gotoRoute(page, "home");
    await expect(page.getByText("桌面助手任务队列")).toHaveCount(0);
    await expect(page.getByRole("button", { name:"本次开启" })).toHaveCount(0);
    await expect(page.getByRole("button", { name:"确认真实打开" })).toHaveCount(0);
    await expect(page.getByRole("button", { name:"模拟执行" })).toHaveCount(0);
    await expect(page.getByRole("button", { name:"停止接管" })).toHaveCount(0);
  });

  test("open Chrome returns paused message without AI tutorial or real app open", async () => {
    await page.evaluate(() => {
      window.__DA_OPEN_APP_CALLS__ = [];
      window.WeishanAPI = Object.assign({}, window.WeishanAPI || {}, {
        desktopAssistantOpenApp: async (appId) => {
          window.__DA_OPEN_APP_CALLS__.push(appId);
          return { ok:true, appId, appName:"Google Chrome", realExecution:true };
        }
      });
    });
    await submitHomeCommand(page, runId + " 打开 Chrome");
    await expect(currentTaskLogs(page)).toContainText("桌面助手接管能力已暂停");
    await expect(currentTaskLogs(page)).toContainText("当前不会控制浏览器、鼠标、键盘或系统 App");
    await expect(currentTaskLogs(page)).toContainText("realExecution=false");
    await expect(currentTaskLogs(page)).not.toContainText("准备调用 AI 网关");
    await expect(currentTaskLogs(page)).not.toContainText("如何打开 Chrome");
    await expect(page.getByRole("button", { name:"确认真实打开" })).toHaveCount(0);
    await expect.poll(async () => page.evaluate(() => (window.__DA_OPEN_APP_CALLS__ || []).length)).toBe(0);
  });

  test("high risk desktop operation remains blocked while paused", async () => {
    await submitHomeCommand(page, runId + " 删除文件并发送邮件");
    await expect(currentTaskLogs(page)).toContainText("高风险操作已阻断");
    await expect(currentTaskLogs(page)).toContainText("不会删除、发送、上传、付款、提交表单或输入密码");
    await expect(currentTaskLogs(page)).toContainText("realExecution=false");
    await expect(page.getByRole("button", { name:"模拟执行" })).toHaveCount(0);
    await expect(page.getByRole("button", { name:"确认真实打开" })).toHaveCount(0);
  });

  test("commerce agent route remains active while desktop takeover is paused", async () => {
    await submitHomeCommand(page, runId + " 帮我找成都到上海最便宜机票");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最终结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(currentTaskLogs(page)).not.toContainText("commerceAgent.plan");
    await expect(currentTaskLogs(page)).not.toContainText("realExecution=false");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText(/不收款|不下单/);
    await expect(page.locator('.nav-item[data-route="commerce"]')).toBeVisible();
  });

  test("ordinary chat still uses AI/chat path and is not desktop assistant", async () => {
    await setMockSettingsAi(page);
    await submitHomeCommand(page, runId + " 成都到上海怎么最经济？");
    await expect(currentTaskLogs(page)).toContainText(/高铁|飞机|实时票价|准备调用 AI 网关/);
    await expect(currentTaskLogs(page)).not.toContainText("桌面助手接管能力已暂停");
    await expect(currentTaskLogs(page)).not.toContainText("desktopAssistant.paused");
  });
});
