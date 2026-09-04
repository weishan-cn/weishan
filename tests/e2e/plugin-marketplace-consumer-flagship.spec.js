const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute } = require("./helpers");

test.describe.serial("consumer capability marketplace", () => {
  let app;
  let page;

  test.beforeAll(async () => {
    app = await launchWeishan(null);
    page = app.page;
  });

  test.afterAll(async () => { if (app) await app.close(); });

  test("Standard mode leads with outcomes and truthful Video Studio readiness", async () => {
    await page.evaluate(() => window.WeishanExperienceMode.setAdvanced(false));
    await gotoRoute(page, "plugins");
    const available = page.locator('[data-plugin-section="available"]');
    const cards = available.locator("[data-marketplace-priority]");
    await expect(cards).toHaveCount(5);
    await expect(cards.nth(0)).toHaveAttribute("data-plugin-id", "weishan.studio.video");
    await expect(cards.nth(0)).toContainText("制作短视频");
    await expect(cards.nth(1)).toContainText("写代码和修项目");
    await expect(cards.nth(2)).toContainText("自动操作和整理网页");
    await expect(cards.nth(3)).toContainText("处理 PDF、表格和演示文稿");
    await expect(cards.nth(4)).toContainText("完成复杂长任务");
    await expect(available).not.toContainText(/Codex|OpenClaw|Hermes/);
    const video = available.locator('[data-plugin-id="weishan.studio.video"]');
    await expect(video).toContainText("规划中 · 尚不可安装");
    await expect(video.locator("[data-v2-install]")).toHaveCount(0);
    await expect(video).toContainText("大型可选能力");
    await expect(video).toContainText("尚未验证所在地区可用性");
    await expect(page.locator('.nav-item[data-route="builder"]')).toHaveCount(0);
    await expect(page.locator('.nav-item[data-route="crawler"]')).toHaveCount(0);
  });

  test("Advanced details disclose implementations without promoting them to primary titles", async () => {
    await page.evaluate(() => window.WeishanExperienceMode.setAdvanced(true));
    await gotoRoute(page, "plugins");
    for (const [id, provider] of [["weishan.connector.codex", "Codex"], ["weishan.connector.openclaw", "OpenClaw"], ["weishan.connector.hermes", "Hermes"]]) {
      const card = page.locator(`[data-plugin-id="${id}"]`);
      await card.locator("summary").click();
      await expect(card.locator("[data-plugin-advanced-details]")).toContainText(provider);
    }
    await expect(page.locator('.nav-item[data-route="builder"]')).toBeVisible();
    await expect(page.locator('.nav-item[data-route="crawler"]')).toBeVisible();
  });
});
