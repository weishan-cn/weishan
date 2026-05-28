const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute, cleanupE2EData } = require("./helpers");

const runId = "E2E-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

test.describe.serial("local workflows", () => {
  let app;
  let page;

  test.beforeAll(async ({ browser }) => {
    app = await launchWeishan(browser);
    page = app.page;
  });

  test.afterAll(async () => {
    if (page) await cleanupE2EData(page, runId);
    if (app) await app.close();
  });

  test("memory workflow creates, searches, and keeps export as visible entry point", async () => {
    const title = runId + " 记忆测试";

    await gotoRoute(page, "memory");
    await expect(page.locator("#memoryTitle")).toBeVisible();
    await page.locator("#memoryTitle").fill(title);
    await page.locator("#memoryContent").fill(runId + " Playwright 本地工作流测试记忆，用于验证搜索和列表展示。");
    await page.locator("#memoryTags").fill(runId + ",e2e,测试,记忆");
    await page.locator("#memorySource").selectOption({ label: "手动" });
    await page.locator("#saveMemory").click();

    await expect(page.getByText(title)).toBeVisible();
    await page.locator("#memorySearch").fill(runId);
    await expect(page.getByText(title)).toBeVisible();
    await expect(page.locator("#exportMemory")).toBeVisible();
  });

  test("project workflow creates, updates status, and keeps export as visible entry point", async () => {
    const projectName = runId + " 项目";
    const taskTitle = runId + " 项目任务";

    await gotoRoute(page, "projects");
    await expect(page.locator("#projectName")).toBeVisible();
    await page.locator("#projectName").fill(projectName);
    await page.locator("#taskTitle").fill(taskTitle);
    await page.locator("#taskDescription").fill(runId + " 验证本地项目任务创建和状态更新。");
    await page.locator("#taskPriority").selectOption({ label: "高" });
    await page.locator("#taskStatus").selectOption({ label: "待办" });
    await page.locator("#createProjectTask").click();

    await expect(page.getByText(taskTitle)).toBeVisible();
    await page.locator(".ws-card").filter({ hasText: taskTitle }).first().locator(".project-status-select").selectOption({ label: "进行中" });
    await expect(page.locator(".ws-card").filter({ hasText: taskTitle }).first().locator(".project-status-select")).toHaveValue("进行中");
    await page.locator(".ws-card").filter({ hasText: taskTitle }).first().locator(".project-status-select").selectOption({ label: "已完成" });
    await expect(page.locator(".ws-card").filter({ hasText: taskTitle }).first().locator(".project-status-select")).toHaveValue("已完成");
    await expect(page.locator("#downloadProjectTasks")).toBeVisible();
  });

  test("history page lists records without opening artifact downloads", async () => {
    await gotoRoute(page, "history");
    await expect(page.locator("#historySearch")).toBeVisible();
    await page.locator("#historySearch").fill(runId);
    await expect(page.locator("#historyList")).toBeVisible();
    await expect(page.getByText(runId).first()).toBeVisible();
  });
});
