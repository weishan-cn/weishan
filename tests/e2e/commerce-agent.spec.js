const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute, cleanupE2EData } = require("./helpers");

const runId = "E2ECOMMERCE-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

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

test.describe.serial("commerce agent", () => {
  let app;
  let page;

  test.beforeAll(async ({ browser }) => {
    app = await launchWeishan(browser);
    page = app.page;
  });

  test.afterAll(async () => {
    if (page) {
      await page.evaluate((id) => {
        try {
          const key = "weishan:commerceAgent:lastPlan:v1";
          const raw = window.localStorage.getItem(key);
          if (raw && raw.includes(id)) window.localStorage.removeItem(key);
        } catch (_) {}
      }, runId);
      await cleanupE2EData(page, runId);
    }
    if (app) await app.close();
  });

  test("sidebar entry opens the commerce agent page", async () => {
    await expect(page.locator('.nav-item[data-route="commerce"]')).toBeVisible();
    await page.locator('.nav-item[data-route="commerce"]').click();
    await expect(page.getByRole("heading", { name:"全球采购" })).toBeVisible();
    await expect(page.getByText("搜索、比价、推荐、执行前确认")).toBeVisible();
  });

  test("home routes purchase demand to commerce agent plan", async () => {
    const command = runId + " 帮我找成都到上海最便宜机票";
    await submitHomeCommand(page, command);
    await expect(currentTaskLogs(page)).toContainText("路由判断：全球采购");
    await expect(currentTaskLogs(page)).toContainText("commerceAgent.plan");
    await expect(currentTaskLogs(page)).toContainText("realExecution=false");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");
    await expect(currentTaskLogs(page)).toContainText(/未下单|未付款|未提交订单/);
  });

  test("commerce plan includes search scope criteria and boundaries", async () => {
    const command = runId + " 帮我比较 OpenRouter 和其他 AI 模型平台价格";
    await submitHomeCommand(page, command);
    await expect(currentTaskLogs(page)).toContainText("搜索范围");
    await expect(currentTaskLogs(page)).toContainText("比较维度");
    await expect(currentTaskLogs(page)).toContainText("决策目标");
    await expect(currentTaskLogs(page)).toContainText("执行边界");
    await expect(currentTaskLogs(page)).toContainText(/未下单|未付款/);
    await page.locator('.nav-item[data-route="commerce"]').click();
    await expect(page.getByText(/来自首页总调度的采购任务/).first()).toBeVisible();
    await expect(page.getByText(/搜索范围|比较维度|推荐规则|执行边界/).first()).toBeVisible();
  });

  test("ordinary travel advice remains chat instead of commerce when no buying intent is present", async () => {
    await setMockSettingsAi(page);
    const command = runId + " 成都到上海怎么最经济？";
    await submitHomeCommand(page, command);
    await expect(currentTaskLogs(page)).toContainText(/准备调用 AI 网关|高铁|飞机|实时票价/);
    await expect(currentTaskLogs(page)).not.toContainText("commerceAgent.plan");
    await expect(currentTaskLogs(page)).not.toContainText("路由判断：全球采购");
  });

  test("direct order and payment request stays plan-only with confirmation boundary", async () => {
    const command = runId + " 帮我直接下单并付款";
    await submitHomeCommand(page, command);
    await expect(currentTaskLogs(page)).toContainText("commerceAgent.plan");
    await expect(currentTaskLogs(page)).toContainText("realExecution=false");
    await expect(currentTaskLogs(page)).toContainText(/未下单|未付款|未提交订单|最终执行必须用户确认/);
  });
});
