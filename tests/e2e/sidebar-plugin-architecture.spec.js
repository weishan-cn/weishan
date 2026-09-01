const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute } = require("./helpers");

async function resetCloudNavigation(page) {
  await page.evaluate(() => {
    const storeNamespace = window.WeishanStore && window.WeishanStore.NS || "weishan.v2.";
    const key = storeNamespace + "settings.cloudEnterpriseExpanded";
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
    window.WeishanRouter.setRoute("home");
  });
  await expect(page.locator("#cloudEnterpriseToggle")).toHaveCount(0);
  await expect(page.locator("#cloudEnterpriseNav")).toHaveCount(0);
}

test.describe.serial("sidebar plugin architecture", () => {
  let app;
  let page;

  test.beforeAll(async () => {
    app = await launchWeishan(null);
    page = app.page;
  });

  test.afterAll(async () => {
    if (app) await app.close();
  });

  test.beforeEach(async () => {
    await resetCloudNavigation(page);
    await page.evaluate(() => window.WeishanExperienceMode.setAdvanced(false));
  });

  test("deferred cloud navigation is removed while plugin navigation remains reachable", async () => {
    await expect(page.locator('.nav-item[data-route="storage"]')).toHaveCount(0);
    await expect(page.locator('[data-nav-group="execution"] .nav-item[data-route="plugins"]')).toBeVisible();
    await expect(page.locator('[data-nav-group="core"] .nav-item[data-route="plugins"]')).toHaveCount(0);
    await expect(page.locator('[data-nav-group="cloud"] .nav-item[data-route="plugins"]')).toHaveCount(0);
    await expect(page.locator('[data-nav-group="cloud"]')).toHaveCount(0);
  });

  test("deferred and advanced routes fail closed until advanced mode is enabled", async () => {
    await page.evaluate(() => window.WeishanRouter.setRoute("storage"));
    await expect(page.locator(".home-v205-page")).toBeVisible();
    const route = await page.evaluate(() => window.WeishanRouter.current());
    expect(route).toBe("home");
    await expect(page.locator("#cloudEnterpriseToggle")).toHaveCount(0);
    await page.evaluate(() => window.WeishanRouter.setRoute("audit"));
    await expect(page.locator(".home-v205-page")).toBeVisible();
    await page.evaluate(() => window.WeishanExperienceMode.setAdvanced(true));
    await gotoRoute(page, "audit");
    await expect(page.locator("#auditSearch")).toBeVisible();
    await expect(page.locator('[data-nav-group="advanced"] .nav-item[data-route="audit"]')).toBeVisible();
  });

  test("plugin center is always reachable while disabled workspaces remain guarded", async () => {
    await gotoRoute(page, "home");
    await page.locator('[data-nav-group="execution"] .nav-item[data-route="plugins"]').click();
    await expect(page.locator(".plugin-center-page")).toBeVisible();
    await expect(page.locator("#pluginSearch")).toBeVisible();
    await expect(page.locator('[data-plugin-section="installed"] [data-plugin-id="weishan.tools.image"]')).toBeVisible();
    await expect(page.locator('[data-plugin-section="developer-preview"]')).toHaveCount(0);
    const videoCard = page.locator('[data-plugin-id="video-generation"]');
    await expect(videoCard).toContainText("视频制作");
    await expect(videoCard).toContainText("用一句话生成和编辑视频");
    await expect(videoCard).toContainText("即将推出");
    await expect(videoCard).toContainText("视频生成服务尚未接入");
    await expect(videoCard).not.toContainText("video.generate");
    await expect(videoCard).not.toContainText("plugin.video");
    await expect(videoCard).not.toContainText("版本");
    await expect(videoCard).not.toContainText(/score|rating|rank|排名|评分|星级/i);
    await expect(videoCard).toHaveAttribute("data-plugin-enabled", "false");
    await expect(videoCard.locator("details")).not.toHaveAttribute("open", "");
    await page.locator("#pluginSearch").fill("nothing-matches-this-plugin");
    await expect(page.locator(".plugin-center-card:visible")).toHaveCount(0);
    await page.evaluate(() => window.WeishanRouter.setRoute("plugin.video"));
    await expect(page.locator("#videoPluginWorkspace")).toHaveCount(0);
    await expect(page.locator(".home-v205-page")).toBeVisible();
  });

  test("ready Image Tools opens through the guarded plugin route", async () => {
    await gotoRoute(page, "plugins");
    const imageCard = page.locator('[data-plugin-section="installed"] [data-plugin-id="weishan.tools.image"]');
    await expect(imageCard).toContainText("图片工具");
    await expect(imageCard).toContainText("在本地调整尺寸");
    await expect(imageCard).toHaveAttribute("data-plugin-enabled", "true");
    await imageCard.locator("[data-plugin-route]").click();
    await expect(page.locator("#imageToolsWorkspace")).toBeVisible();
    await expect(page.locator("[data-image-tools-choose]")).toBeVisible();
    await expect(page.locator('.nav-item[data-route="plugin.image-tools"]')).toHaveCount(0);
  });

  test("enabled plugin workspace route remains registry guarded without a sidebar shortcut", async () => {
    await page.evaluate(() => {
      window.WeishanPluginRegistry.pageForRoute = (routeId) => routeId === "plugin.video" ? "VideoPluginWorkspace" : "";
      window.WeishanRouter.setRoute("plugin.video");
    });
    await expect(page.locator("#videoPluginWorkspace")).toBeVisible();
    await expect(page.locator('.nav-item[data-route="plugin.video"]')).toHaveCount(0);
    await expect(page.locator("[data-video-simple-mode]")).toBeVisible();
    await expect(page.locator("#videoPrompt")).toHaveAttribute("placeholder", "帮我做一个 15 秒的咖啡广告，电影感，适合抖音");
    await expect(page.locator(".video-plugin-generate")).toBeDisabled();
    await expect(page.locator(".video-plugin-runtime-note")).toContainText("视频功能即将上线");
    await expect(page.locator("[data-video-advanced]")).not.toHaveAttribute("open", "");
    await expect(page.locator('[data-advanced-group="technical"]')).toBeHidden();
    await page.locator("[data-video-advanced] summary").click();
    await expect(page.locator('[data-advanced-group="creation"]')).toBeVisible();
    await expect(page.locator('[data-advanced-group="reference"]')).toBeVisible();
    await expect(page.locator('[data-advanced-group="audio"]')).toBeVisible();
    await expect(page.locator('[data-advanced-group="technical"]')).toBeVisible();
    await expect(page.locator("#videoPluginWorkspace")).toHaveAttribute("data-plugin-task-count", "0");
    await expect(page.locator("#videoPluginWorkspace progress")).toHaveCount(0);
    await expect(page.locator("#videoPluginWorkspace [data-plugin-task]")).toHaveCount(0);
  });
});
