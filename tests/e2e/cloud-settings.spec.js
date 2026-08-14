const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute } = require("./helpers");

const runId = "E2ECLOUD-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

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
    const existingHistoryIds = await page.evaluate(() => window.HistoryApi.list().map((item) => item.id));
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

    const inviteEmail = runId.toLowerCase() + "@example.com";
    await page.locator("#cloudInviteEmail").fill(inviteEmail);
    await page.locator("#cloudInviteRole").selectOption("member");
    await page.locator("#cloudInviteMember").click();
    await expect(page.locator("#cloudInviteResult")).toContainText(/邀请已记录|MEMBER_LIMIT_REACHED/);

    const currentEvents = await page.evaluate(({ previousIds, email }) => {
      const previous = new Set(previousIds);
      return window.HistoryApi.list()
        .filter((item) => !previous.has(item.id) && item.payload && item.payload.module === "cloud")
        .map((item) => ({ id:item.id, type:item.type, payload:item.payload }));
    }, { previousIds:existingHistoryIds, email:inviteEmail });

    expect(currentEvents).toHaveLength(3);
    expect(currentEvents.map((item) => item.type)).toEqual(expect.arrayContaining([
      "cloud.plansViewed",
      "cloud.storageAllocated",
      expect.stringMatching(/^cloud\.organizationInvite(?:Rejected)?$/)
    ]));

    const storageEvent = currentEvents.find((item) => item.type === "cloud.storageAllocated");
    expect(storageEvent.payload).toMatchObject({
      action:"storageAllocated",
      status:"done",
      ownerType:"organization",
      ownerId:"local-company",
      planId:"CN_ENTERPRISE_BASIC",
      quotaGb:300
    });
    const inviteEvent = currentEvents.find((item) => /^cloud\.organizationInvite(?:Rejected)?$/.test(item.type));
    expect(inviteEvent.payload).toMatchObject({
      ownerType:"organization",
      ownerId:"local-company",
      planId:"CN_ENTERPRISE_BASIC"
    });
    expect(inviteEvent.payload.inputSummary).toContain(inviteEmail);

    await gotoRoute(page, "history");
    await page.locator("#historySearch").fill("cloud");
    const historyList = page.locator("#historyList");
    await expect(historyList).toBeVisible();
    const storageCard = historyList.locator("[data-history-index]", { hasText:"分配企业云空间 mock" }).first();
    await expect(storageCard).toContainText("已分配 300GB，路径 organizations/local-company/");
    const inviteCard = historyList.locator("[data-history-index]", { hasText:inviteEmail }).first();
    await expect(inviteCard).toContainText(/成员邀请已记录|最多支持 5 名成员/);
    await expect(historyList).not.toContainText(/cloud\.(?:storageAllocated|organizationInvite|organizationInviteRejected)/);
  });
});
