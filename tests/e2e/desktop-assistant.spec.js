const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute, cleanupE2EData } = require("./helpers");

const runId = "E2EDESKTOP-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

async function resetDesktopAssistantSession(page) {
  await page.evaluate((id) => {
    try {
      window.sessionStorage.removeItem("weishan:desktopAssistant:session:v1");
      window.sessionStorage.removeItem("weishan:desktopAssistant:executionQueue:v1");
      window.sessionStorage.removeItem("weishan:desktopAssistant:tasks:v1");
      window.localStorage.removeItem("weishan:desktopAssistant:realOpenApp:v1");
      window.localStorage.removeItem("weishan:desktopAssistant:v1");
      if (window.WeishanDesktopAssistant && window.WeishanDesktopAssistant.stopDesktopAssistantSession) {
        window.WeishanDesktopAssistant.stopDesktopAssistantSession();
      }
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
    await expect(page.getByText(/桌面助手：关闭|需要先点击首页“桌面助手：本次开启”|未控制电脑/).first()).toBeVisible();
    await expect(page.getByText(/路由判断：桌面助手|desktopAssistant \/ desktopAssistant\.plan|App：Google Chrome/).first()).toBeVisible();
    await expect(page.getByText(/chat\.answer|准备调用 AI 网关|如何打开 Chrome/)).toHaveCount(0);
    await expect(page.locator("#desktopPlanConfirm")).toHaveCount(0);
    await expect(page.locator("#desktopQueueSimulate")).toHaveCount(0);
    await expect(page.locator("#desktopQueueRealOpen")).toHaveCount(0);
  });

  test("open Safari is routed to desktop assistant before chat", async () => {
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + " 打开 Safari");
    await expect(page.getByText(/路由判断：桌面助手|desktopAssistant \/ desktopAssistant\.plan|App：Safari/).first()).toBeVisible();
    await expect(page.getByText(/桌面助手未开启|请先点击“本次开启”/).first()).toBeVisible();
    await expect(page.getByText(/chat\.answer|准备调用 AI 网关|如何打开 Safari/)).toHaveCount(0);
  });

  test("multiple desktop assistant tasks can coexist in the homepage queue", async () => {
    await resetDesktopAssistantSession(page);
    await gotoRoute(page, "home");
    await page.locator("#desktopAssistantEnable").click();
    await submitHomeCommand(page, runId + " 多任务 打开 Chrome");
    await submitHomeCommand(page, runId + " 多任务 打开 Safari");
    const rows = page.locator("[data-desktop-task-id]").filter({ hasText:runId }).filter({ hasText:"多任务" });
    await expect(rows).toHaveCount(2);
    await expect(page.locator("[data-desktop-task-queue]")).toContainText("打开 Chrome");
    await expect(page.locator("[data-desktop-task-queue]")).toContainText("Safari");
    await expect(rows.first()).toContainText("等待确认");
    await expect(rows.first()).not.toContainText(/taskId=|realExecution=false|allowed|queued|planned|steps=/);
    await rows.first().getByRole("button", { name:"查看步骤" }).click();
    await expect(rows.first()).toContainText(/taskId=desktopTask-|steps=/);
    await expect(page.getByText(/chat\.answer|准备调用 AI 网关/)).toHaveCount(0);
  });

  test("stopping one desktop assistant task does not stop another task", async () => {
    await resetDesktopAssistantSession(page);
    await gotoRoute(page, "home");
    await page.locator("#desktopAssistantEnable").click();
    await submitHomeCommand(page, runId + " 单停 打开 Chrome");
    await submitHomeCommand(page, runId + " 单停 打开 Safari");
    const chromeTask = page.locator("[data-desktop-task-id]").filter({ hasText:runId }).filter({ hasText:"单停" }).filter({ hasText:"打开 Chrome" }).first();
    const safariTask = page.locator("[data-desktop-task-id]").filter({ hasText:runId }).filter({ hasText:"单停" }).filter({ hasText:"Safari" }).first();
    await expect(chromeTask).toBeVisible();
    await expect(safariTask).toBeVisible();
    await chromeTask.getByRole("button", { name:"停止此任务" }).click();
    await expect(chromeTask).toContainText("已停止");
    await expect(safariTask).not.toContainText(/已停止/);
    await expectHistory(page, runId, /desktopAssistant\.taskStopped|taskStopped|stopped/);
  });

  test("global stop stops all desktop assistant tasks and disables session", async () => {
    await resetDesktopAssistantSession(page);
    await gotoRoute(page, "home");
    await page.locator("#desktopAssistantEnable").click();
    await submitHomeCommand(page, runId + " 全停 打开 Chrome");
    await submitHomeCommand(page, runId + " 全停 打开 Safari");
    await page.locator("#desktopQueueStop").click();
    await expect(page.getByText("桌面助手：关闭").first()).toBeVisible();
    await expect(page.locator("[data-desktop-task-id]").filter({ hasText:runId }).filter({ hasText:"全停" }).filter({ hasText:"已停止" })).toHaveCount(2);
    await expectHistory(page, runId, /desktopAssistant\.stoppedAll|stoppedAll|停止全部/);
  });

  test("desktop assistant task queue is scrollable and keeps command input visible", async () => {
    await resetDesktopAssistantSession(page);
    await gotoRoute(page, "home");
    await page.locator("#desktopAssistantEnable").click();
    const commands = ["打开 Chrome", "打开 Safari", "打开 Finder", "打开 WPS", "打开 Notes"];
    for (const command of commands) {
      await submitHomeCommand(page, runId + " 滚动 " + command);
    }
    const queue = page.locator("[data-desktop-task-queue]");
    await expect(queue).toBeVisible();
    await expect(page.locator("[data-desktop-task-id]").filter({ hasText:runId }).filter({ hasText:"滚动" })).toHaveCount(5);
    await expect.poll(async () => queue.evaluate((node) => window.getComputedStyle(node).overflowY)).toBe("auto");
    await expect(page.locator("#commandInput")).toBeVisible();
  });

  test("high risk desktop assistant task remains blocked and can be stopped individually", async () => {
    await resetDesktopAssistantSession(page);
    await gotoRoute(page, "home");
    await page.locator("#desktopAssistantEnable").click();
    await submitHomeCommand(page, runId + " 高危 删除文件并发送邮件");
    const task = page.locator("[data-desktop-task-id]").filter({ hasText:runId }).first();
    await expect(task).toContainText(/已阻断|高风险/);
    await expect(task.getByRole("button", { name:"确认计划" })).toHaveCount(0);
    await task.getByRole("button", { name:"停止此任务" }).click();
    await expect(task).toContainText("已停止");
    await expect(page.locator("#desktopQueueRealOpen")).toHaveCount(0);
  });

  test("session enabled queues and simulates low risk desktop steps without real control", async () => {
    await resetDesktopAssistantSession(page);
    await gotoRoute(page, "home");
    await page.locator("#desktopAssistantEnable").click();
    await expect(page.getByText("桌面助手：本次开启").first()).toBeVisible();
    await submitHomeCommand(page, runId + " 打开 Chrome 搜索 weishan");
    await expect(page.getByText(/桌面操作计划|普通提示/).first()).toBeVisible();
    await expect(page.locator(".cmd-log-list").first()).toContainText("请在下方“桌面助手任务队列”中查看和处理");
    await expect(page.locator(".cmd-log-list").first()).not.toContainText("## 计划步骤");
    await expect(page.getByText(/等待确认|仅生成计划/).first()).toBeVisible();
    await page.locator("#desktopPlanConfirm").click();
    await expect(page.getByText("桌面助手执行队列").first()).toBeVisible();
    await expect(page.getByText(/等待确认|模拟执行中|未控制电脑/).first()).toBeVisible();
    const task = page.locator("[data-desktop-task-id]").filter({ hasText:runId }).filter({ hasText:"打开 Chrome 搜索 weishan" }).first();
    await task.getByRole("button", { name:"模拟执行" }).click();
    await expect(task).toContainText(/模拟完成|未控制电脑/);
    await expectHistory(page, runId, /desktopAssistant\.planCreated|planCreated|桌面操作计划/);
    await expectHistory(page, runId, /desktopAssistant\.executionSimulated|executionSimulated|simulated/);
  });

  test("high risk operation is red and blocked after confirmation", async () => {
    await submitHomeCommand(page, runId + " 帮我删除桌面上的文件");
    await expect(page.getByText(/高风险|必须二次确认|需要二次确认/).first()).toBeVisible();
    await expect(page.locator(".desktop-risk-high").first()).toBeVisible();
    await expect(page.getByText(/高风险操作已阻断|不会删除、发送、上传、付款、提交表单或输入密码/).first()).toBeVisible();
    await expect(page.locator("#desktopPlanConfirm")).toHaveCount(0);
    const highRiskTask = page.locator("[data-desktop-task-id]").filter({ hasText:runId }).filter({ hasText:"帮我删除桌面上的文件" }).first();
    await expect(highRiskTask.getByRole("button", { name:"模拟执行" })).toHaveCount(0);
    await expect(highRiskTask.getByRole("button", { name:"确认计划" })).toHaveCount(0);
    await expect(page.getByText(/已阻断|高风险/).first()).toBeVisible();
    await expectHistory(page, runId, /desktopAssistant\.executionBlocked|executionBlocked|blocked/);
  });

  test("stop takeover disables session and stops the current queue", async () => {
    await gotoRoute(page, "home");
    await page.locator("#desktopAssistantStop").click();
    await expect(page.getByText("桌面助手：关闭").first()).toBeVisible();
    await expect(page.getByText(/已停止|桌面助手执行队列|停止/).first()).toBeVisible();
    await expectHistory(page, runId, /desktopAssistant\.stoppedAll|stoppedAll|停止全部/);
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
    const task = page.locator("[data-desktop-task-id]").filter({ hasText:runId }).filter({ hasText:"打开 Chrome" }).first();
    await expect(task.getByRole("button", { name:"确认真实打开" })).toHaveCount(0);
    await expect(task.getByRole("button", { name:"模拟执行" })).toBeVisible();
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
    const task = page.locator("[data-desktop-task-id]").filter({ hasText:runId }).filter({ hasText:"打开 Chrome" }).first();
    await expect(task.getByRole("button", { name:"确认真实打开" })).toBeVisible();
    await expect(page.getByText(/仅打开或聚焦白名单 App，不点击、不输入、不读屏/).first()).toBeVisible();
    await task.getByRole("button", { name:"确认真实打开" }).click();
    await expect(task).toContainText(/已真实打开白名单 App|Google Chrome/);
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
    const task = page.locator("[data-desktop-task-id]").filter({ hasText:runId }).filter({ hasText:"打开 Chrome 失败反馈" }).first();
    await expect(task.getByRole("button", { name:"确认真实打开" })).toBeVisible();
    await task.getByRole("button", { name:"确认真实打开" }).click();
    await expect(task).toContainText(/打开失败|检查该 App 是否已安装|WPS/);
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
    await expect(page.getByText(/高风险|已阻断|必须二次确认|该 App 不在白名单/).first()).toBeVisible();
    await expect(page.locator("#desktopPlanConfirm")).toHaveCount(0);
    const terminalTask = page.locator("[data-desktop-task-id]").filter({ hasText:runId }).filter({ hasText:"打开 Terminal 执行命令" }).first();
    await expect(terminalTask).toContainText(/已阻断|高风险|Chrome \/ Safari \/ Finder \/ WPS \/ Notes \/ Preview/);
    await expect(terminalTask.getByRole("button", { name:"确认真实打开" })).toHaveCount(0);
    await submitHomeCommand(page, runId + " 删除文件并发送邮件");
    await expect(page.getByText(/高风险|已阻断|必须二次确认/).first()).toBeVisible();
    const highRiskTask = page.locator("[data-desktop-task-id]").filter({ hasText:runId }).filter({ hasText:"删除文件并发送邮件" }).first();
    await expect(highRiskTask.getByRole("button", { name:"确认真实打开" })).toHaveCount(0);
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
    await expect(page.getByText(/桌面助手：关闭|请点击“本次开启”|未控制电脑/).first()).toBeVisible();
    const task = page.locator("[data-desktop-task-id]").filter({ hasText:runId }).filter({ hasText:"打开 Chrome" }).first();
    await expect(task.getByRole("button", { name:"确认真实打开" })).toHaveCount(0);
    await expect.poll(async () => page.evaluate(() => (window.__DA_OPEN_APP_CALLS__ || []).length)).toBe(0);
  });

  test("normal travel question still goes to chat and not desktop assistant", async () => {
    await resetDesktopAssistantSession(page);
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + " 成都到上海怎么最经济？");
    await expect(page.getByText(/chat\.answer|AI|高铁|飞机|实时票价|AI 网关/).first()).toBeVisible();
    await expect(page.locator("[data-desktop-task-id]").filter({ hasText:"成都到上海怎么最经济" })).toHaveCount(0);
    await expect(page.getByText(/桌面助手任务队列/).first()).toBeVisible();
  });
});
