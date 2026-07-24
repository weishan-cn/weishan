const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute } = require("./helpers");

test.describe.serial("sidebar plugin architecture", () => {
  let app;
  let page;

  test.beforeAll(async ({ browser }) => {
    app = await launchWeishan(browser);
    page = app.page;
  });

  test.afterAll(async () => {
    if (app) await app.close();
  });

  test("cloud navigation defaults to collapsed and is keyboard accessible", async () => {
    await page.evaluate(() => {
      window.localStorage.removeItem("settings.cloudEnterpriseExpanded");
      window.WeishanRouter.setRoute("home");
    });
    await expect(page.locator("#cloudEnterpriseToggle")).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#cloudEnterpriseNav")).toBeHidden();
    await expect(page.locator('.nav-item[data-route="storage"]')).toHaveCount(0);
    await expect(page.locator('[data-nav-group="execution"] .nav-item[data-route="plugins"]')).toBeVisible();
    await expect(page.locator('[data-nav-group="core"] .nav-item[data-route="plugins"]')).toHaveCount(0);
    await expect(page.locator('[data-nav-group="cloud"] .nav-item[data-route="plugins"]')).toHaveCount(0);
    await page.locator("#cloudEnterpriseToggle").press("Enter");
    await expect(page.locator("#cloudEnterpriseToggle")).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator('.nav-item[data-route="storage"]')).toBeVisible();
    await page.locator("#cloudEnterpriseToggle").press("Space");
    await expect(page.locator("#cloudEnterpriseToggle")).toHaveAttribute("aria-expanded", "false");
  });

  test("cloud routes remain directly reachable and reveal their active group", async () => {
    await page.evaluate(() => window.localStorage.removeItem("settings.cloudEnterpriseExpanded"));
    await gotoRoute(page, "audit");
    await expect(page.locator("#auditSearch")).toBeVisible();
    await expect(page.locator("#cloudEnterpriseToggle")).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator('.nav-item[data-route="audit"]')).toBeVisible();
  });

  test("plugin center is always reachable while disabled workspaces remain guarded", async () => {
    await gotoRoute(page, "home");
    await page.locator('[data-nav-group="execution"] .nav-item[data-route="plugins"]').click();
    await expect(page.locator(".plugin-center-page")).toBeVisible();
    const videoCard = page.locator('[data-plugin-id="video-generation"]');
    await expect(videoCard).toContainText("视频制作");
    await expect(videoCard).toContainText("用一句话生成和编辑视频");
    await expect(videoCard).toContainText("即将推出");
    await expect(videoCard).toContainText("视频生成服务尚未接入");
    await expect(videoCard).not.toContainText("video.generate");
    await expect(videoCard).not.toContainText("plugin.video");
    await expect(videoCard).not.toContainText("版本");
    await expect(videoCard).toHaveAttribute("data-plugin-enabled", "false");
    await expect(videoCard.locator("details")).not.toHaveAttribute("open", "");
    await page.evaluate(() => window.WeishanRouter.setRoute("plugin.video"));
    await expect(page.locator("#videoPluginWorkspace")).toHaveCount(0);
    await expect(page.locator(".home-v205-page")).toBeVisible();
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
    await expect(page.locator(".video-plugin-runtime-note")).toContainText("视频生成服务尚未接入");
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
