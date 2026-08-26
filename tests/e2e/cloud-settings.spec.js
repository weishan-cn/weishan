const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute } = require("./helpers");

test.describe.serial("deferred cloud settings navigation", () => {
  let app;
  let page;

  test.beforeAll(async () => {
    app = await launchWeishan(null);
    page = app.page;
  });

  test.afterAll(async () => {
    if (app) await app.close();
  });

  test("hides premature cloud and enterprise shortcuts from normal navigation", async () => {
    await gotoRoute(page, "home");
    await expect(page.locator('[data-nav-group="cloud"]')).toHaveCount(0);
    await expect(page.locator("#cloudEnterpriseToggle")).toHaveCount(0);
    await expect(page.locator('.nav-item[data-route="storage"]')).toHaveCount(0);
    await expect(page.locator('.nav-item[data-route="team"]')).toHaveCount(0);
    await expect(page.locator('.nav-item[data-route="seats"]')).toHaveCount(0);
    await expect(page.locator('.nav-item[data-route="reports"]')).toHaveCount(0);
    await expect(page.locator('[data-nav-group="system"] .nav-item[data-route="audit"]')).toBeVisible();
    await expect(page.locator(".paid")).toHaveCount(0);

    await page.evaluate(() => window.WeishanRouter.setRoute("storage"));
    await expect(page.locator(".home-v205-page")).toBeVisible();
    const route = await page.evaluate(() => window.WeishanRouter.current());
    expect(route).toBe("home");
  });
});
