const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute } = require("./helpers");

test("global discovery runs the offline Tokyo hotel flow without external navigation", async ({ browser }) => {
  const app = await launchWeishan(browser);
  try {
    const page = app.page;
    await gotoRoute(page, "commerce");
    const workspace = page.locator("[data-global-discovery]");
    await expect(workspace).toBeVisible();
    await expect(workspace).toContainText("全球发现");
    await workspace.getByRole("button", { name:"酒店" }).click();
    await workspace.getByRole("button", { name:"查看平台报价" }).click();
    await expect(workspace).toContainText("目标市场：JP");
    await expect(workspace).toContainText("Japan Local OTA Demo");
    await expect(workspace.locator("[data-discovery-result]")).toHaveCount(3);
    await expect(workspace).toContainText("第三方平台完成");
    await workspace.locator("[data-discovery-redirect]").first().click();
    await expect(workspace.locator("[data-discovery-confirmation]")).toContainText("不会实际打开外部网站");
    await workspace.getByRole("button", { name:"确认意图" }).click();
    await expect(workspace.locator("[data-discovery-confirmation]")).toContainText("CONFIRMED");
  } finally {
    await app.close();
  }
});
