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

test.describe.serial("commerce agent workbench", () => {
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
          const keys = ["weishan:commerceAgent:lastPlan:v1", "weishan:commerceAgent:tasks:v1"];
          for (const key of keys) {
            const raw = window.localStorage.getItem(key);
            if (raw && raw.includes(id)) window.localStorage.removeItem(key);
          }
        } catch (_) {}
      }, runId);
      await cleanupE2EData(page, runId);
    }
    if (app) await app.close();
  });

  test("global commerce workbench entry shows safety boundary", async () => {
    await expect(page.locator('.nav-item[data-route="commerce"]')).toBeVisible();
    await page.locator('.nav-item[data-route="commerce"]').click();
    await expect(page.getByRole("heading", { name:"全球采购" })).toBeVisible();
    await expect(page.getByText("搜索、比价、推荐、执行前确认")).toBeVisible();
    await expect(page.getByText("不真实搜索、不下单、不付款、不提交订单")).toBeVisible();
  });

  test("home commerce summary stays compact and links to workbench detail", async () => {
    const command = runId + " 帮我找成都到上海最便宜机票";
    await submitHomeCommand(page, command);
    await expect(currentTaskLogs(page)).toContainText("路由判断：全球采购");
    await expect(currentTaskLogs(page)).toContainText("commerceAgent.plan");
    await expect(currentTaskLogs(page)).toContainText("realExecution=false");
    await expect(currentTaskLogs(page)).toContainText(/未下单|未付款|未提交订单/);
    await expect(page.locator("#commerceViewPlanBtn")).toBeVisible();
    await expect(currentTaskLogs(page)).not.toContainText("搜索范围：");
    await expect(currentTaskLogs(page)).not.toContainText("比较维度：");
    await expect(currentTaskLogs(page)).not.toContainText("决策目标：同等条件下价格最低");
    await expect(currentTaskLogs(page)).not.toContainText("执行边界：不真实搜索外部网站");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");

    await page.locator("#commerceViewPlanBtn").click();
    await expect(page.getByRole("heading", { name:"全球采购" })).toBeVisible();
    await expect(page.locator(".commerce-task-list")).toContainText(runId + " 帮我找成都到上海最便宜机票");
    await page.getByRole("button", { name:"查看计划" }).first().click();
    await expect(page.getByRole("heading", { name:"需求理解" })).toBeVisible();
    await expect(page.getByRole("heading", { name:"搜索范围" })).toBeVisible();
    await expect(page.getByRole("heading", { name:"比较维度" })).toBeVisible();
    await expect(page.getByRole("heading", { name:"决策规则" })).toBeVisible();
    await expect(page.getByRole("heading", { name:"执行边界" })).toBeVisible();
  });

  test("ai model pricing plan uses candidate schema without fake live prices", async () => {
    const command = runId + " 帮我比较 OpenRouter 和其他 AI 模型平台价格";
    await submitHomeCommand(page, command);
    await page.locator('.nav-item[data-route="commerce"]').click();
    await expect(page.getByText(/AI 模型价格|全球采购/).first()).toBeVisible();
    await page.getByRole("button", { name:"查看计划" }).first().click();
    await expect(page.getByText("候选方案字段模板")).toBeVisible();
    await expect(page.getByText(/计费单位|上下文\/额度|调用稳定性/).first()).toBeVisible();
    await expect(page.getByText("当前不填真实价格，不伪造实时库存或可用性")).toBeVisible();
    await expect(page.locator(".commerce-detail")).not.toContainText("已找到");
  });

  test("direct order and payment request remains blocked and plan-only", async () => {
    const command = runId + " 帮我直接下单并付款";
    await submitHomeCommand(page, command);
    await expect(currentTaskLogs(page)).toContainText("commerceAgent.plan");
    await expect(currentTaskLogs(page)).toContainText("realExecution=false");
    await expect(currentTaskLogs(page)).toContainText("状态：已阻断");
    await expect(currentTaskLogs(page)).toContainText("原因：涉及下单 / 付款");
    await expect(currentTaskLogs(page)).toContainText(/不会下单、付款或提交订单|未下单|未付款|未提交订单/);
    await expect(currentTaskLogs(page)).not.toContainText("搜索范围：");
    await expect(currentTaskLogs(page)).not.toContainText("决策目标：同等条件下价格最低");
    await page.locator('.nav-item[data-route="commerce"]').click();
    await expect(page.getByText("已阻断").first()).toBeVisible();
    await expect(page.locator(".commerce-safety")).toContainText("当前为计划与推荐阶段，不真实搜索、不下单、不付款、不提交订单");
  });

  test("home dispatch record keeps commerce entries compact", async () => {
    const command = runId + " 帮我订东京酒店";
    await submitHomeCommand(page, command);
    await expect(page.locator("#cmdHistory")).toContainText("全球采购");
    await expect(page.locator("#cmdHistory")).toContainText(/未搜索|未下单|未付款|realExecution=false/);
    await expect(page.locator("#cmdHistory")).not.toContainText("候选方案字段模板");
    await expect(page.locator("#cmdHistory")).not.toContainText("决策目标：同等条件下价格最低");
  });

  test("clears a commerce plan from the workbench", async () => {
    const command = runId + " 帮我买一台性价比高的 MacBook";
    await submitHomeCommand(page, command);
    await page.locator('.nav-item[data-route="commerce"]').click();
    await expect(page.locator(".commerce-task-list")).toContainText(command);
    await page.getByRole("button", { name:"清理此计划" }).first().click();
    await expect(page.locator(".commerce-task-list")).not.toContainText(command);
    await gotoRoute(page, "history");
    await page.locator("#historySearch").fill(runId);
    await expect(page.locator("#historyList")).toContainText(/commerceAgent\.taskCleared|taskCleared/);
  });

  test("ordinary travel advice remains chat instead of commerce when no buying intent is present", async () => {
    await setMockSettingsAi(page);
    const command = runId + " 成都到上海怎么最经济？";
    await submitHomeCommand(page, command);
    await expect(currentTaskLogs(page)).toContainText(/准备调用 AI 网关|高铁|飞机|实时票价/);
    await expect(currentTaskLogs(page)).not.toContainText("commerceAgent.plan");
    await expect(currentTaskLogs(page)).not.toContainText("路由判断：全球采购");
  });
});
