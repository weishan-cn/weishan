const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute } = require("./helpers");

const runId = "E2ECLOUD-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

async function searchHistory(page, query, pattern) {
  await gotoRoute(page, "history");
  await expect(page.locator("#historySearch")).toBeVisible();
  await page.locator("#historySearch").fill(query);
  await expect(page.locator("#historyList")).toBeVisible();
  await expect(page.getByText(pattern).first()).toBeVisible();
}

test.describe.serial("cloud settings", () => {
  let app;
  let page;

  test.beforeAll(async ({ browser }) => {
    app = await launchWeishan(browser);
    page = app.page;
  });

  test.afterAll(async () => {
    if (app) await app.close();
  });

  test("shows enterprise cloud mock settings and writes history", async () => {
    await gotoRoute(page, "settings");
    await expect(page.getByText("云服务与企业空间")).toBeVisible();
    const cloudPanel = page.locator("#cloudEnterpriseSettings");
    await expect(cloudPanel.getByText(/当前使用本地存储模式，数据仅保存在本地电脑/)).toBeVisible();

    await page.locator("#loadCloudPlans").click();
    await expect(page.locator("#cloudPlanList").getByText(/中国区企业基础版.*CN_ENTERPRISE_BASIC.*300GB.*5人/)).toBeVisible();
    await expect(page.locator("#cloudPlanList").getByText(/中国区企业标准版.*CN_ENTERPRISE_STANDARD.*1024GB.*20人/)).toBeVisible();

    await page.locator("#allocateCloudStorage").click();
    await expect(page.getByText(/CN_ENTERPRISE_BASIC/).first()).toBeVisible();
    await expect(page.getByText(/300/).first()).toBeVisible();
    await expect(page.getByText(/organizations\/local-company\//)).toBeVisible();

    await page.locator("#cloudInviteEmail").fill(runId.toLowerCase() + "@example.com");
    await page.locator("#cloudInviteRole").selectOption("member");
    await page.locator("#cloudInviteMember").click();
    await expect(page.locator("#cloudInviteResult")).toContainText(/邀请已记录|MEMBER_LIMIT_REACHED/);

    await searchHistory(page, "cloud", /cloud\.storageAllocated|cloud\.organizationInvite|cloud\.organizationInviteRejected/);
  });
});
