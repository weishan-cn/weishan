const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute } = require("./helpers");

test.describe.serial("smoke", () => {
  let app;
  let page;

  test.beforeAll(async ({ browser }) => {
    app = await launchWeishan(browser);
    page = app.page;
  });

  test.afterAll(async () => {
    if (app) await app.close();
  });

  test("app launches", async () => {
    await expect(page).toHaveTitle(/weishan/i);
    await expect(page.locator(".brand-name, .brand-logo").first()).toBeVisible();
  });

  test("home page visible", async () => {
    await gotoRoute(page, "home");
    await expect(page.getByRole("heading", { name: /首页总调度|Command Center/ })).toBeVisible();
    await expect(page.locator("#commandInput")).toBeVisible();
    await expect(page.locator("#runBtn")).toBeVisible();
  });

  test("history page visible", async () => {
    await gotoRoute(page, "history");
    await expect(page.getByText(/历史记录|History/).first()).toBeVisible();
    await expect(page.locator("#historySearch")).toBeVisible();
  });

  test("security selfcheck visible", async () => {
    await gotoRoute(page, "security");
    await expect(page.getByText(/系统诊断|自检中心|Security/).first()).toBeVisible();
    await expect(page.locator("#runSelfCheck")).toBeVisible();
  });

  test("crawler page visible", async () => {
    await gotoRoute(page, "crawler");
    await expect(page.getByText(/抓取中心|Crawler/).first()).toBeVisible();
    await expect(page.locator("#crawlUrl")).toBeVisible();
    await expect(page.locator("#createCrawl")).toBeVisible();
  });
});
