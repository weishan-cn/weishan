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
    await expect(page.locator(".plugin-center-page")).toHaveAttribute("data-runtime-version", "2");
    await expect(page.locator("#pluginSearch")).toBeVisible();
    await expect(page.locator('[data-plugin-section="installed"] [data-plugin-id="weishan.tools.image"]')).toBeVisible();
    await expect(page.locator('[data-plugin-section="available"] [data-plugin-id="weishan.studio.video"]')).toBeVisible();
    await expect(page.locator('[data-plugin-section="installed"]')).toContainText("已安装工具");
    await expect(page.locator('[data-plugin-section="available"]')).toContainText("热门能力");
    await expect(page.locator('[data-plugin-section="developer-preview"]')).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText(/score|rating|stars|rank|#1|Top 1|评分|星级|排名|下载量/i);

    await page.locator("#pluginSearch").fill("图片工具");
    await expect(page.locator('[data-plugin-section="installed"] [data-plugin-id="weishan.tools.image"]')).toBeVisible();
    await expect(page.locator('[data-plugin-section="available"] [data-plugin-id="weishan.studio.video"]')).toBeHidden();
    await page.locator("#pluginSearch").fill("definitely-not-a-real-plugin");
    await expect(page.locator(".plugin-center-card:visible")).toHaveCount(0);

    await page.locator("#pluginSearch").fill("");
    const details = page.locator('[data-plugin-id="weishan.studio.video"] [data-plugin-details]');
    await details.locator("summary").click();
    await expect(details).toContainText("把内容做成 45 秒竖屏短视频");
    await expect(details).toContainText("filesystem.read");
    await expect(details).not.toContainText("OpenClaw");

    const imageDetails = page.locator('[data-plugin-section="installed"] [data-plugin-id="weishan.tools.image"] [data-plugin-details]');
    await imageDetails.locator("summary").click();
    await expect(imageDetails).toContainText("Weishan");
    await expect(imageDetails).toContainText("filesystem.read");
    await expect(imageDetails).toContainText("selected-files");
    await expect(imageDetails).toContainText("LOCAL");
    const priorities = await page.locator('[data-plugin-section="available"] [data-marketplace-priority]').evaluateAll((cards) => cards.map((card) => Number(card.dataset.marketplacePriority)));
    expect(priorities).toEqual([1, 2, 3, 5, 6]);
    await expect(page.locator('[data-plugin-section="available"]')).not.toContainText(/Codex|OpenClaw|Hermes/);
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
