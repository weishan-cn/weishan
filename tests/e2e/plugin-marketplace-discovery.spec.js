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
    await expect(page.locator('[data-plugin-section="recommended"] [data-plugin-id]')).toHaveCount(0);
    await expect(page.locator('[data-plugin-section="recommended"]')).toContainText("暂无可推荐插件");
    await expect(page.locator('[data-plugin-section="available"] [data-plugin-id="video-generation"]')).toBeVisible();
    await expect(page.locator('[data-plugin-section="available"]')).toContainText("全部插件");
    await expect(page.locator('[data-plugin-category="video"]')).toBeVisible();
    await expect(page.locator('[data-plugin-category="image"]')).toBeVisible();
    await expect(page.locator('[data-plugin-category="audio"]')).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/score|rating|stars|rank|#1|Top 1|评分|星级|排名|下载量/i);

    await page.locator("#pluginSearch").fill("图片");
    await expect(page.locator('[data-plugin-section="available"] [data-plugin-id="video-generation"]')).toBeVisible();
    await page.locator("#pluginSearch").fill("definitely-not-a-real-plugin");
    await expect(page.locator("[data-plugin-filter-empty]").first()).toContainText("没有找到匹配插件");

    await page.locator("#pluginSearch").fill("");
    const details = page.locator('[data-plugin-id="video-generation"] [data-plugin-details]');
    await details.locator("summary").click();
    await expect(details).toContainText("许可证");
    await expect(details).toContainText("MIT License");
    await expect(details).toContainText("Weishan repository");
    await expect(details).toContainText("权限");
    await expect(details).toContainText("无需额外权限");
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
        license:{
          name:"MIT License",
          spdx:"MIT",
          licenseFile:"LICENSE",
          sourceReference:"Test fixture",
          openSource:true,
          commercialUseAllowed:true,
          modificationAllowed:true,
          redistributionAllowed:true,
          noticeRequired:true,
          sourceDisclosureObligation:false,
          reviewed:true
        },
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

    const capped = await page.evaluate(() => {
      const registry = window.WeishanPluginRegistry;
      Object.assign(registry.WORKSPACE_BY_ROUTE, {
        "plugin.alpha":"VideoPluginWorkspace",
        "plugin.beta":"VideoPluginWorkspace",
        "plugin.gamma":"VideoPluginWorkspace"
      });
      const license = {
        name:"MIT License",
        spdx:"MIT",
        licenseFile:"LICENSE",
        sourceReference:"Test fixture",
        openSource:true,
        commercialUseAllowed:true,
        modificationAllowed:true,
        redistributionAllowed:true,
        noticeRequired:true,
        sourceDisclosureObligation:false,
        reviewed:true
      };
      const candidate = (pluginId, name, routeId) => ({
        pluginId,
        name,
        description:"Read-only fixture",
        icon:"◇",
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
        license,
        presentation:{ tagline:"Read-only fixture", categories:["commerce"] },
        entryPoint:{ type:"route", routeId },
        permissions:{ network:false, filesystem:false, camera:false, microphone:false, clipboard:false, externalUrl:false }
      });
      return registry.marketplaceModel([
        candidate("gamma-reader", "Gamma Reader", "plugin.gamma"),
        candidate("alpha-reader", "Alpha Reader", "plugin.alpha"),
        candidate("beta-reader", "Beta Reader", "plugin.beta")
      ]);
    });
    expect(capped.defaultMarket).toHaveLength(3);
    expect(capped.recommended).toHaveLength(2);
    expect(capped.recommended.map((plugin) => plugin.pluginId)).toEqual(["alpha-reader", "beta-reader"]);
  });
});
