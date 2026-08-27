const { test, expect } = require("@playwright/test");
const { Jimp } = require("../../apps/desktop/node_modules/jimp");
const { launchWeishan, gotoRoute } = require("./helpers");

test.describe.serial("local Image Tools", () => {
  let app;
  let page;
  let png;

  test.beforeAll(async () => {
    png = await new Jimp({ width:64, height:48, color:0x3366ccff }).getBuffer("image/png");
    app = await launchWeishan(null);
    page = app.page;
  });

  test.afterAll(async () => { if (app) await app.close(); });

  test("recommended plugin completes the no-AI local edit and export flow", async () => {
    await page.evaluate(() => { window.I18n.setLang("zh"); window.WeishanRouter.setRoute("plugins"); });
    await expect(page.locator('[data-plugin-section="recommended"] [data-plugin-id="image-tools"]')).toBeVisible();
    await expect(page.locator('[data-plugin-section="recommended"] [data-plugin-id]')).toHaveCount(1);
    await expect(page.locator('[data-plugin-section="recommended"] [data-plugin-id="video-generation"]')).toHaveCount(0);
    await page.locator('[data-plugin-section="recommended"] [data-plugin-id="image-tools"] [data-plugin-route]').click();
    await expect(page.locator("#imageToolsWorkspace")).toBeVisible();
    await page.evaluate(() => {
      const actual = window.weishan.imageTools;
      window.ImageToolsWorkspace.mount(document.getElementById("pageHost"), { runtime:{
        getPolicy:actual.getPolicy,
        process:actual.process,
        cancel:actual.cancel,
        export:async (payload) => {
          window.__imageToolsE2eExport = { mime:payload.mime, byteLength:payload.bytes && payload.bytes.byteLength || 0, suggestedName:payload.suggestedName };
          return { ok:true, saved:true, cancelled:false };
        }
      } });
    });
    await expect(page.locator("[data-image-tools-choose]")).toContainText("选择图片");
    const bridgeSmoke = await page.evaluate(async (values) => {
      try {
        const response = await window.weishan.imageTools.process({ requestId:"image_tools_bridge_smoke", bytes:Uint8Array.from(values), transform:{ outputMime:"image/png" } });
        return { ok:response && response.ok === true, error:response && response.error || "", stage:response && response.stage || "", reason:response && response.reason || "", byteLength:response && response.bytes && response.bytes.byteLength || 0 };
      } catch (error) {
        return { ok:false, error:String(error && error.message || error || "bridge_failure"), stage:"", reason:"", byteLength:0 };
      }
    }, Array.from(png));
    expect(bridgeSmoke).toEqual({ ok:true, error:"", stage:"", reason:"", byteLength:png.length });
    await page.locator("[data-image-tools-file]").setInputFiles({ name:"fixture.png", mimeType:"image/png", buffer:png });
    await expect(page.locator("#imageToolsWorkspace")).toHaveAttribute("data-image-tools-state", "ready");
    await expect(page.locator("[data-image-tools-meta]")).toContainText("64 × 48");
    await page.locator("#imageToolsWidth").fill("32");
    await expect(page.locator("#imageToolsHeight")).toHaveValue("24");
    await page.locator("#imageToolsRotate").selectOption("90");
    await page.locator("[data-image-tools-flip-horizontal]").check();
    await page.locator("[data-image-tools-format]").selectOption("image/jpeg");
    await page.locator("[data-image-tools-apply]").click();
    await expect(page.locator("[data-image-tools-meta]")).toContainText("24 × 32 · JPEG");

    await page.locator("[data-image-tools-export]").click();
    await expect(page.locator("[data-image-tools-status]")).toContainText("已开始导出新文件");
    const exported = await page.evaluate(() => window.__imageToolsE2eExport);
    expect(exported.mime).toBe("image/jpeg");
    expect(exported.byteLength).toBeGreaterThan(0);
    expect(exported.suggestedName).toBe("fixture-weishan.jpg");
  });

  test("malformed input recovers and English controls remain accessible", async () => {
    await page.locator("[data-image-tools-file]").setInputFiles({ name:"broken.png", mimeType:"image/png", buffer:Buffer.from("broken") });
    await expect(page.locator("[data-image-tools-error]")).toBeVisible();
    await expect(page.locator("[data-image-tools-error]")).toContainText("无法打开此图片");
    await page.evaluate(() => { window.I18n.setLang("en"); window.WeishanRouter.refresh(); });
    await expect(page.locator("[data-image-tools-choose]")).toContainText("Choose image");
    await page.locator("[data-image-tools-choose]").focus();
    await expect(page.locator("[data-image-tools-choose]")).toBeFocused();
    await expect(page.locator("#imageToolsWorkspace")).toBeVisible();
  });
});
