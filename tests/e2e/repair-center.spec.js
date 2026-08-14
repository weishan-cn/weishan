const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute } = require("./helpers");

test.describe.serial("repair center", () => {
  let app;
  let page;
  const runId = "E2EREPAIR-" + Date.now().toString(36);

  test.beforeAll(async ({ browser }) => {
    app = await launchWeishan(browser);
    page = app.page;
    await page.waitForFunction(() => Boolean(window.WeishanRepairCenter));
    await page.evaluate((id) => {
      window.__WEISHAN_E2E_REPAIR_RUN_ID = id;
      if (window.WeishanRepairCenter && window.WeishanRepairCenter.cleanupE2ERepairIssues) {
        window.WeishanRepairCenter.cleanupE2ERepairIssues(id);
      }
    }, runId);
  });

  test.afterAll(async () => {
    if (page) {
      await page.evaluate((id) => {
        if (window.WeishanRepairCenter && window.WeishanRepairCenter.cleanupE2ERepairIssues) {
          window.WeishanRepairCenter.cleanupE2ERepairIssues(id);
        }
      }, runId).catch(() => {});
    }
    if (app) await app.close();
  });

  test("creates verifies and records a local repair report", async () => {
    await gotoRoute(page, "security");
    await expect(page.getByText("修护中心").first()).toBeVisible();
    await expect(page.locator("#createRepairTest")).toBeVisible();

    await page.locator("#createRepairTest").click();
    await expect(page.getByText(/RepairCenterTestIssue|本地修护中心测试记录/).first()).toBeVisible();

    await page.locator("#markRepairSuggested").click();
    await page.locator("#markRepairVerified").click();

    const exported = await page.evaluate(() => {
      const repair = window.WeishanRepairCenter;
      const latest = repair && repair.listRepairIssues && repair.listRepairIssues()[0];
      if (!repair || !latest) return null;
      const artifact = repair.createRepairReportArtifact(latest, "markdown");
      return {
        filename:artifact && artifact.filename,
        repairId:latest.repairId,
        historyTypes:window.HistoryApi.list()
          .filter((item) => item && item.payload && item.payload.taskId === latest.repairId)
          .map((item) => item.type)
      };
    });

    expect(exported && exported.filename).toMatch(/repair.*\.md$/);
    expect(exported && exported.historyTypes).toEqual([
      "repair.reportExported",
      "repair.verified",
      "repair.suggested",
      "repair.bugDetected"
    ]);

    await gotoRoute(page, "history");
    await page.locator("#historySearch").fill(exported.repairId);
    await expect(page.locator("#historyList [data-history-index]")).toHaveCount(4);
    const visibleSummaries = page.locator("#historyList > [data-history-index] > .history-line > p");
    await expect(visibleSummaries.filter({ hasText:"已生成本地修护报告。" })).toBeVisible();
    await expect(visibleSummaries.filter({ hasText:"已记录修护验证结果。" })).toBeVisible();
    await expect(visibleSummaries.filter({ hasText:"已生成本地修护记录。" })).toBeVisible();
  });
});
