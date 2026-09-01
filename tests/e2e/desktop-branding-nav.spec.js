const { test, expect } = require("@playwright/test");
const { launchWeishan } = require("./helpers");

test.skip(process.env.CODEX_SANDBOX === "seatbelt", "Codex seatbelt blocks Electron GUI launch; API runtime guard remains enforced.");

test("source startup shows Weishan branding and hides deferred cloud enterprise navigation", async () => {
  const app = await launchWeishan(null);
  try {
    await expect(app.page.locator(".home-v205-page")).toBeVisible();
    await expect(app.page.locator(".brand-name")).toHaveText("Weishan");
    await expect(app.page.locator('.brand-logo img[alt="Weishan logo"]')).toHaveCount(1);
    await expect(app.page.getByText(/Electron v\d+\.\d+\.\d+/)).toHaveCount(0);
    await expect(app.page.getByText("API Demos")).toHaveCount(0);
    await expect(app.page.getByText("Forge")).toHaveCount(0);
    await expect(app.page.getByText("Repository")).toHaveCount(0);
    await expect(app.page.locator("body")).not.toContainText("Electron");

    await expect(app.page.locator('[data-nav-group="cloud"]')).toHaveCount(0);
    await expect(app.page.getByText("云与企业")).toHaveCount(0);
    await expect(app.page.getByText("Cloud & Enterprise")).toHaveCount(0);
    await expect(app.page.getByText("存储与云")).toHaveCount(0);
    await expect(app.page.getByText("Storage")).toHaveCount(0);
    await expect(app.page.getByText("团队协作")).toHaveCount(0);
    await expect(app.page.getByText("团队与席位")).toHaveCount(0);
    await expect(app.page.getByText("报告中心")).toHaveCount(0);
    await expect(app.page.locator('.nav-item[data-route="audit"]')).toHaveCount(0);
    await expect(app.page.locator(".paid")).toHaveCount(0);

    await app.page.evaluate(() => window.I18n.setLang("en"));
    await expect(app.page.getByText("Cloud & Enterprise")).toHaveCount(0);
    await expect(app.page.getByText("Storage")).toHaveCount(0);
    await expect(app.page.getByText("Team")).toHaveCount(0);
    await expect(app.page.getByText("Seats")).toHaveCount(0);
    await expect(app.page.getByText("Reports")).toHaveCount(0);
    await expect(app.page.locator('.nav-item[data-route="audit"]')).toHaveCount(0);

    await app.page.evaluate(() => window.WeishanRouter.setRoute("storage"));
    await expect(app.page.locator(".home-v205-page")).toBeVisible();
    const route = await app.page.evaluate(() => window.WeishanRouter.current());
    expect(route).toBe("home");
    await expect(app.page.locator("#cloudEnterpriseToggle")).toHaveCount(0);
  } finally {
    await app.close();
  }
});
