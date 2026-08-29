const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute } = require("./helpers");

test.skip(process.env.CODEX_SANDBOX === "seatbelt", "Codex seatbelt blocks Electron GUI launch; API runtime guard remains enforced.");

test("launches the canonical source dev runtime, not a packaged duplicate", async () => {
  const app = await launchWeishan(null);
  try {
    expect(app.runtimeIdentity.product).toBe("weishan");
    expect(app.runtimeIdentity.buildType).toBe("SOURCE_DEV_ELECTRON");
    expect(app.runtimeIdentity.launchRoot).toBe("REPO_APPS_DESKTOP");
    expect(app.runtimeIdentity.executableSource).toBe("APPS_DESKTOP_NODE_MODULES_ELECTRON");
    expect(app.electronApp).toBeTruthy();

    const mainRuntime = await app.electronApp.evaluate(({ app: electronApp, process }) => ({
      isPackaged: electronApp.isPackaged,
      appName: electronApp.getName(),
      userData: electronApp.getPath("userData"),
      title: process && process.title
    }));
    expect(mainRuntime.isPackaged).toBe(false);
    expect(mainRuntime.appName).toBe("Weishan");
    expect(mainRuntime.userData).toContain("weishan");
    if (mainRuntime.title) {
      expect(mainRuntime.title).toBe("Weishan");
    }

    await gotoRoute(app.page, "home");
    await gotoRoute(app.page, "commerce");
    await gotoRoute(app.page, "home");
    const currentRoute = await app.page.evaluate(() => window.WeishanRouter.current());
    expect(currentRoute).toBe("home");
  } finally {
    await app.close();
  }
});
