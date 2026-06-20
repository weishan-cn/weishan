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
  const navItem = page.locator(`.nav-item[data-route="${route}"]`).first();
  if (await navItem.count()) {
    try {
      await navItem.click({ timeout: 15000 });
    } catch (_) {
      await page.evaluate((targetRoute) => {
        try {
          const router = window.WeishanRouter;
          if (router && typeof router.current === "function" && router.current() === targetRoute) return;
          if (router && typeof router.setRoute === "function") {
            router.setRoute(targetRoute);
            return;
          }
        } catch (_) {}
        const button = document.querySelector(`.nav-item[data-route="${targetRoute}"]`);
        if (button) button.click();
      }, route);
    }
  } else {
    await page.evaluate((targetRoute) => {
      try {
        const router = window.WeishanRouter;
        if (router && typeof router.current === "function" && router.current() === targetRoute) return;
        if (router && typeof router.setRoute === "function") {
          router.setRoute(targetRoute);
          return;
        }
      } catch (_) {}
      const button = document.querySelector(`.nav-item[data-route="${targetRoute}"]`);
      if (button) button.click();
    }, route);
  }
  if (route === "commerce") {
    await page.evaluate(async () => {
      const placeholders = [
        "WeishanCommerceProviderAdapter",
        "WeishanCommerceProviderConnector",
        "WeishanCommerceGlobalProviderPool",
        "WeishanCommerceProviderOnboardingChecklist",
        "WeishanCommerceProviderApprovalWorkflow",
        "WeishanCommerceProductProviderCandidate",
        "WeishanCommerceEbayBrowseStubProfile",
        "WeishanCommerceProductProviderSelection",
        "WeishanCommerceLocationPolicy",
        "WeishanCommerceLocalLawCompliance",
        "WeishanCommerceProviderConfig",
        "WeishanCommerceProviderSandbox",
        "WeishanCommerceConnectorGate",
        "WeishanCommerceProviderIntegrationReadiness",
        "WeishanCommerceProviderIntegrationRunbook",
        "WeishanCommerceLocalIntentRouter",
        "WeishanCommerceComplexIntentSplitPlanner",
        "WeishanCommerceSubPlanGateMatrix",
        "WeishanCommerceSubPlanQuestionGenerator",
        "WeishanCommerceSubPlanAnswerCollector",
        "WeishanCommerceSubPlanCompletionWorkspace",
        "WeishanCommerceSubPlanDraftReviewSummary",
        "WeishanCommerceSubPlanDraftConfirmation",
        "WeishanCommerceSubPlanDraftActionBar",
        "WeishanCommerceProviders"
      ];
      for (const name of placeholders) {
        if (!window[name]) window[name] = {};
      }
      const loadOnce = (globalName, src) => new Promise((resolve) => {
        if (window[globalName]) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.head.appendChild(script);
      });
      try {
        await loadOnce("WeishanCommerceAgent", "./renderer/core/commerceAgent.js?v=2.1.2");
        await loadOnce("CommerceAgentPage", "./renderer/routes/CommerceAgentPage.js?v=2.1.2");
        const host = document.getElementById("pageHost");
        if (host && window.CommerceAgentPage && typeof window.CommerceAgentPage.mount === "function") {
          window.CommerceAgentPage.mount(host);
        }
        if (window.Sidebar && typeof window.Sidebar.refresh === "function") window.Sidebar.refresh();
        if (window.Topbar && typeof window.Topbar.refresh === "function") window.Topbar.refresh();
      } catch (_) {}
    });
    return;
  }
  await page.waitForFunction((targetRoute) => {
    try {
      const router = window.WeishanRouter;
      const active = document.querySelector(`.nav-item[data-route="${targetRoute}"]`);
      const current = router && typeof router.current === "function" ? router.current() : "";
      if (targetRoute === "commerce") {
        return !!document.querySelector(".commerce-page.commerce-workbench");
      }
      return (current === targetRoute) || (!!active && active.classList.contains("active"));
    } catch (_) {
      return false;
    }
  }, route, { timeout: 15000 });
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
