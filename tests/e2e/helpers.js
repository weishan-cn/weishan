const { _electron: electron } = require("@playwright/test");
const { existsSync } = require("fs");
const { createRequire } = require("module");
const path = require("path");

const repoRoot = path.resolve(__dirname, "../..");
const desktopDir = path.join(repoRoot, "apps/desktop");
const indexFile = path.join(desktopDir, "src/index.html");

async function launchWeishan(browser) {
  const electronPackage = path.join(desktopDir, "node_modules/electron");
  if (existsSync(electronPackage)) {
    const desktopRequire = createRequire(path.join(desktopDir, "package.json"));
    const executablePath = desktopRequire("electron");
    const app = await electron.launch({ executablePath, args: ["."], cwd: desktopDir });
    const page = await app.firstWindow();
    await page.waitForLoadState("domcontentloaded");
    return { page, close: () => app.close(), mode: "electron" };
  }
  const context = await browser.newContext({ acceptDownloads: false });
  const page = await context.newPage();
  await page.goto("file://" + indexFile);
  await page.waitForLoadState("domcontentloaded");
  return { page, close: () => context.close(), mode: "browser" };
}

async function withWeishan(browser, fn) {
  const app = await launchWeishan(browser);
  try {
    await fn(app.page, app.mode);
  } finally {
    await app.close();
  }
}

async function gotoRoute(page, route) {
  await page.locator(`.nav-item[data-route="${route}"]`).click();
}

async function clearLocalStorage(page, keys) {
  await page.evaluate((storageKeys) => {
    storageKeys.forEach((key) => window.localStorage.removeItem(key));
  }, keys);
}

async function cleanupE2EData(page, runId) {
  await page.evaluate((id) => {
    function safeRead(key, fallback) {
      try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (_) {
        return fallback;
      }
    }
    function safeWrite(key, value) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
    function hasRunId(value) {
      try {
        return JSON.stringify(value || "").includes(id);
      } catch (_) {
        return false;
      }
    }
    const memoryKey = "weishan:memory:v1";
    const projectKey = "weishan:projects:v1";
    const historyKey = "weishan.v2.history.items";
    const commandQueueKey = "command.queue.v205";
    const commandHistoryKey = "command.history.v205";
    const dispatchPendingKey = "weishan:dispatch:pending:v1";
    safeWrite(memoryKey, safeRead(memoryKey, []).filter((item) => !hasRunId(item)));
    safeWrite(projectKey, safeRead(projectKey, []).filter((item) => !hasRunId(item)));
    safeWrite(historyKey, safeRead(historyKey, []).filter((item) => !hasRunId(item)));
    safeWrite(commandQueueKey, safeRead(commandQueueKey, []).filter((item) => !hasRunId(item)));
    safeWrite(commandHistoryKey, safeRead(commandHistoryKey, []).filter((item) => !hasRunId(item)));
    const pending = safeRead(dispatchPendingKey, null);
    if (pending && hasRunId(pending)) window.localStorage.removeItem(dispatchPendingKey);
    try {
      const sessionPending = window.sessionStorage && window.sessionStorage.getItem(dispatchPendingKey);
      if (sessionPending && sessionPending.includes(id)) window.sessionStorage.removeItem(dispatchPendingKey);
    } catch (_) {}
  }, runId);
}

module.exports = {
  launchWeishan,
  withWeishan,
  gotoRoute,
  clearLocalStorage,
  cleanupE2EData
};
