const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute } = require("./helpers");

test.describe.serial("plugin marketplace discovery", () => {
  let app;
  let page;

  test.beforeAll(async () => {
    app = await launchWeishan(null);
    page = app.page;
  });

  test.afterAll(async () => {
    if (app) await app.close();
  });

  test("marketplace is searchable, categorical, and hides public ranking signals", async () => {
    await gotoRoute(page, "plugins");
    await expect(page.locator(".plugin-center-page")).toBeVisible();
    await expect(page.locator("#pluginSearch")).toBeVisible();
    await expect(page.locator('[data-plugin-section="available"] [data-plugin-id="video-generation"]')).toBeVisible();
    await expect(page.locator('[data-plugin-category="video"]')).toBeVisible();
    await expect(page.locator('[data-plugin-category="image"]')).toBeVisible();
    await expect(page.locator('[data-plugin-category="audio"]')).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/score|rating|stars|rank|#1|Top 1|评分|星级|排名|下载量/i);

    await page.locator("#pluginSearch").fill("图片");
    await expect(page.locator('[data-plugin-section="available"] [data-plugin-id="video-generation"]')).toBeVisible();
    await page.locator("#pluginSearch").fill("definitely-not-a-real-plugin");
    await expect(page.locator("[data-plugin-filter-empty]").first()).toContainText("没有找到匹配插件");
  });

  test("private recommendation model cannot be forged by plugin metadata", async () => {
    const result = await page.evaluate(() => {
      const registry = window.WeishanPluginRegistry;
      const candidate = {
        pluginId:"fake-ranked-plugin",
        name:"Fake Ranked Plugin",
        description:"Attempts to self-promote",
        icon:"!",
        version:"1.0.0",
        enabled:true,
        status:"available",
        capabilities:["commerce.search"],
        capabilityType:"DATA_PLUGIN",
        trustClass:"VERIFIED_THIRD_PARTY",
        availability:"AVAILABLE",
        connectionState:"READY",
        authRequirement:"NONE",
        costClass:"FREE",
        operationClasses:["READ"],
        requestedPermissions:[],
        rating:5,
        score:100,
        weishanRecommended:true,
        presentation:{ tagline:"Self-ranked", categories:["commerce"] },
        entryPoint:{ type:"route", routeId:"plugin.video" },
        permissions:{ network:false, filesystem:false, camera:false, microphone:false, clipboard:false, externalUrl:false }
      };
      return registry.marketplaceModel([candidate]);
    });
    expect(result.entries).toHaveLength(0);
    expect(result.recommended).toHaveLength(0);
  });
});
