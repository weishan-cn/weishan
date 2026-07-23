const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute } = require("./helpers");

test.describe.serial("official website capability", () => {
  let app;
  let page;

  test.beforeAll(async ({ browser }) => {
    app = await launchWeishan(browser);
    page = app.page;
  });

  test.afterAll(async () => {
    if (app) await app.close();
  });

  test("exposes the fixed official-site action without automatic opening", async () => {
    await gotoRoute(page, "settings");
    await expect(page.locator("#openWeishanOfficialWebsite")).toBeVisible();
    await expect(page.locator("#videoPluginWorkspace")).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => {
      return {
        opener:typeof window.weishan.openWeishanOfficialWebsite,
        pluginDeclaresWebsite:(window.WeishanPluginRegistry.getDeclaredPlugins() || []).some((plugin) => plugin.entryPoint && plugin.entryPoint.routeId === "https://weishan.ai/")
      };
    })).toEqual({ opener:"function", pluginDeclaresWebsite:false });
  });
});
