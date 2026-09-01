const { test, expect } = require("@playwright/test");
const { launchWeishan } = require("./helpers");

test("standard and advanced navigation remain reversible and fail closed", async () => {
  const app = await launchWeishan(null);
  try {
    await app.page.evaluate(() => window.WeishanExperienceMode.setAdvanced(false));
    for (const route of ["home", "mail", "commerce", "plugins"]) await expect(app.page.locator(`[data-route="${route}"]`)).toBeVisible();
    for (const route of ["crawler", "builder", "audit"]) await expect(app.page.locator(`[data-route="${route}"]`)).toHaveCount(0);
    await expect(app.page.locator("#aiConnectionStatus")).toHaveCount(0);

    await app.page.evaluate(() => window.WeishanRouter.setRoute("audit"));
    await expect.poll(() => app.page.evaluate(() => window.WeishanRouter.current())).toBe("home");

    await app.page.evaluate(() => window.WeishanRouter.setRoute("settings"));
    await expect(app.page.locator('[data-settings-section="account"]')).toBeVisible();
    await expect(app.page.locator('[data-settings-section="credentials"]')).toHaveCount(0);
    await app.page.locator("#experienceModeToggle").check();
    await expect(app.page.locator(".advanced-mode-indicator")).toBeVisible();
    for (const route of ["crawler", "builder", "audit"]) await expect(app.page.locator(`[data-route="${route}"]`)).toBeVisible();
    await expect(app.page.locator('[data-settings-section="developer-diagnostics"]')).toBeVisible();

    await app.page.evaluate(() => window.WeishanRouter.setRoute("audit"));
    await expect.poll(() => app.page.evaluate(() => window.WeishanRouter.current())).toBe("audit");
    await app.page.evaluate(() => window.WeishanRouter.setRoute("security"));
    await expect(app.page.locator('[data-security-section="consumer-privacy"]')).toBeVisible();
    await expect(app.page.locator('[data-security-section="diagnostics"]')).toBeVisible();

    await app.page.evaluate(() => window.WeishanExperienceMode.setAdvanced(false));
    await expect(app.page.locator('[data-route="audit"]')).toHaveCount(0);
    await expect(app.page.locator('[data-security-section="consumer-privacy"]')).toBeVisible();
    await expect(app.page.locator('[data-security-section="diagnostics"]')).toHaveCount(0);

    for (const width of [560, 900, 1440]) {
      await app.page.setViewportSize({ width, height:900 });
      expect(await app.page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    }
  } finally {
    await app.close();
  }
});
