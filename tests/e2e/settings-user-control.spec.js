const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute } = require("./helpers");

test.describe.serial("settings preferences user control", () => {
  let app;
  let page;

  test.beforeAll(async () => {
    app = await launchWeishan(null);
    page = app.page;
  });

  test.afterAll(async () => {
    if (app) await app.close();
  });

  test("anonymous analytics control is local reversible and keeps deferred cloud hidden", async () => {
    await gotoRoute(page, "settings");
    await expect(page.locator("#settingsUserControlPanel")).toBeVisible();
    await expect(page.locator("#anonymousAnalyticsToggle")).toBeVisible();
    await expect(page.locator("#anonymousAnalyticsHelp")).toContainText("不收集搜索原文");
    await expect(page.locator("#anonymousAnalyticsHelp")).toContainText(/credential/i);
    await expect(page.locator("#cloudEnterpriseSettings")).toHaveCount(0);
    await expect(page.getByText("Cloud Services and Enterprise Space")).toHaveCount(0);
    await expect(page.getByText("Billing & Permissions")).toHaveCount(0);

    await page.evaluate(() => {
      window.localStorage.setItem("weishan.v2.analytics.queue.v1", JSON.stringify([{ synthetic:true }]));
    });
    await page.locator("#anonymousAnalyticsToggle").focus();
    await expect(page.locator("#anonymousAnalyticsToggle")).toBeFocused();
    await page.keyboard.press("Space");
    await expect(page.locator("#anonymousAnalyticsToggle")).toBeChecked();
    await page.keyboard.press("Space");
    await expect(page.locator("#anonymousAnalyticsToggle")).not.toBeChecked();
    await expect(page.locator("#analyticsPreferenceResult")).toContainText("待发送队列已清空");

    const state = await page.evaluate(() => ({
      queue:window.localStorage.getItem("weishan.v2.analytics.queue.v1"),
      settings:JSON.parse(window.localStorage.getItem("weishan.v2.settings.userControl.v1") || "{}")
    }));
    expect(state.queue).toBe(null);
    expect(state.settings.analyticsEnabled).toBe(false);
  });
});
