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

  test("only valid enabled plugin declarations receive sidebar entries", async () => {
    await page.evaluate(() => {
      window.WeishanPluginRegistry.getEnabledSidebarEntries = () => [{
        pluginId:"local-video", name:"Local Video", description:"Static declaration only", icon:"▹", version:"1.0.0", enabled:true,
        status:"available", capabilities:["video.generate"], entryPoint:{ type:"route", routeId:"plugin.video" },
        permissions:{ network:false, filesystem:false, camera:false, microphone:false, clipboard:false, externalUrl:false }
      }];
      window.WeishanPluginRegistry.pageForRoute = (routeId) => routeId === "plugin.video" ? "VideoPluginWorkspace" : "";
      window.Sidebar.refresh();
    });
    await expect(page.locator('[data-nav-group="plugins"]')).toBeVisible();
    await page.locator('.nav-item[data-route="plugin.video"]').click();
    await expect(page.locator("#videoPluginWorkspace")).toBeVisible();
  });
});
