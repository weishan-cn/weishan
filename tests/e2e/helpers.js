const { _electron: electron } = require("@playwright/test");
const { existsSync, mkdtempSync, rmSync } = require("fs");
const { createRequire } = require("module");
const os = require("os");
const path = require("path");

const repoRoot = path.resolve(__dirname, "../..");
const desktopDir = path.join(repoRoot, "apps/desktop");
const indexFile = path.join(desktopDir, "src/index.html");
const desktopPackage = require(path.join(desktopDir, "package.json"));

function normalizePathForGuard(value) {
  return path.resolve(String(value || ""));
}

function hasPathSegment(filePath, segment) {
  const normalized = normalizePathForGuard(filePath);
  return normalized.split(path.sep).includes(segment);
}

function isPathInside(childPath, parentPath) {
  const child = normalizePathForGuard(childPath);
  const parent = normalizePathForGuard(parentPath);
  return child === parent || child.startsWith(parent + path.sep);
}

function assertCanonicalE2ERuntime(candidate) {
  const mode = candidate && candidate.mode;
  if (mode === "electron") {
    const cwd = normalizePathForGuard(candidate.cwd);
    const executablePath = normalizePathForGuard(candidate.executablePath);
    const electronPackage = path.join(desktopDir, "node_modules/electron");
    const args = Array.isArray(candidate.args) ? candidate.args : [];
    const userDataArg = args.find((arg) => /^--user-data-dir=/.test(String(arg || "")));
    const unsupportedArgs = args.filter((arg, index) => index > 0 && !/^--user-data-dir=/.test(String(arg || "")));
    const userDataDir = userDataArg ? normalizePathForGuard(userDataArg.replace(/^--user-data-dir=/, "")) : "";
    const e2eUserDataRoot = path.join(os.tmpdir(), "weishan-e2e-user-data-");

    if (cwd !== desktopDir) {
      throw new Error(`E2E_CANONICAL_RUNTIME_VIOLATION: cwd must be apps/desktop, got ${cwd}`);
    }
    if (args[0] !== ".") {
      throw new Error(`E2E_CANONICAL_RUNTIME_VIOLATION: first arg must be ".", got ${args[0] || "<empty>"}`);
    }
    if (unsupportedArgs.length) {
      throw new Error(`E2E_CANONICAL_RUNTIME_VIOLATION: unsupported args ${unsupportedArgs.join(" ")}`);
    }
    if (userDataDir && !userDataDir.startsWith(e2eUserDataRoot)) {
      throw new Error("E2E_CANONICAL_RUNTIME_VIOLATION: E2E userData must be an isolated temp profile");
    }
    if (!isPathInside(executablePath, electronPackage)) {
      throw new Error("E2E_CANONICAL_RUNTIME_VIOLATION: Electron executable must resolve from apps/desktop/node_modules/electron");
    }
    if (/\/[Ww]eishan\.app\/Contents\/MacOS\/[Ww]eishan(?:$|\/)/.test(executablePath)) {
      throw new Error("E2E_CANONICAL_RUNTIME_VIOLATION: packaged Weishan.app executable is not an E2E runtime");
    }
    if (isPathInside(executablePath, path.join(repoRoot, "apps/desktop/dist")) || hasPathSegment(executablePath, "weishan-package-prep")) {
      throw new Error("E2E_CANONICAL_RUNTIME_VIOLATION: packaged dist/tmp build is not an E2E runtime");
    }

    return {
      product: "weishan",
      version: desktopPackage.version,
      mode: "electron",
      buildType: "SOURCE_DEV_ELECTRON",
      launchRoot: "REPO_APPS_DESKTOP",
      executableSource: "APPS_DESKTOP_NODE_MODULES_ELECTRON",
      userDataIsolation: userDataDir ? "TEMP_E2E_PROFILE" : "DEFAULT_PROFILE"
    };
  }

  if (mode === "browser") {
    const rendererFile = normalizePathForGuard(candidate.rendererFile);
    if (rendererFile !== indexFile) {
      throw new Error("E2E_CANONICAL_RUNTIME_VIOLATION: browser fallback must load apps/desktop/src/index.html");
    }
    if (isPathInside(rendererFile, path.join(repoRoot, "apps/desktop/dist")) || hasPathSegment(rendererFile, "weishan-package-prep")) {
      throw new Error("E2E_CANONICAL_RUNTIME_VIOLATION: packaged renderer build is not an E2E fallback runtime");
    }
    return {
      product: "weishan",
      version: desktopPackage.version,
      mode: "browser",
      buildType: "SOURCE_FILE_RENDERER_FALLBACK",
      launchRoot: "REPO_APPS_DESKTOP_SRC",
      executableSource: "PLAYWRIGHT_BROWSER_FILE_URL"
    };
  }

  throw new Error(`E2E_CANONICAL_RUNTIME_VIOLATION: unsupported runtime mode ${mode || "<missing>"}`);
}

function getCanonicalE2ERuntimeDescriptor() {
  const electronPackage = path.join(desktopDir, "node_modules/electron");
  if (existsSync(electronPackage)) {
    const desktopRequire = createRequire(path.join(desktopDir, "package.json"));
    const executablePath = desktopRequire("electron");
    const args = [".", "--user-data-dir=" + path.join(os.tmpdir(), "weishan-e2e-user-data-descriptor")];
    return assertCanonicalE2ERuntime({
      mode: "electron",
      executablePath,
      args,
      cwd: desktopDir
    });
  }
  return assertCanonicalE2ERuntime({
    mode: "browser",
    rendererFile: indexFile
  });
}

async function launchWeishan(browser) {
  const electronPackage = path.join(desktopDir, "node_modules/electron");
  if (existsSync(electronPackage)) {
    const desktopRequire = createRequire(path.join(desktopDir, "package.json"));
    const executablePath = desktopRequire("electron");
    const e2eUserDataDir = mkdtempSync(path.join(os.tmpdir(), "weishan-e2e-user-data-"));
    const args = [".", "--user-data-dir=" + e2eUserDataDir];
    const runtimeIdentity = assertCanonicalE2ERuntime({
      mode: "electron",
      executablePath,
      args,
      cwd: desktopDir
    });
    let app;
    try {
      app = await electron.launch({ executablePath, args, cwd: desktopDir });
      const page = await Promise.race([
        app.firstWindow(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("E2E_RUNTIME_WINDOW_TIMEOUT: canonical source Electron launched but no first window appeared within 15000ms")), 15000))
      ]);
      await page.waitForLoadState("domcontentloaded");
      return {
        page,
        close: async () => {
          try { await app.close(); } finally { rmSync(e2eUserDataDir, { recursive:true, force:true }); }
        },
        mode: "electron",
        electronApp: app,
        runtimeIdentity
      };
    } catch (error) {
      try { if (app) await app.close(); } catch (_) {}
      try { rmSync(e2eUserDataDir, { recursive:true, force:true }); } catch (_) {}
      throw error;
    }
  }
  const runtimeIdentity = assertCanonicalE2ERuntime({
    mode: "browser",
    rendererFile: indexFile
  });
  const context = await browser.newContext({ acceptDownloads: false });
  const page = await context.newPage();
  await page.goto("file://" + indexFile);
  await page.waitForLoadState("domcontentloaded");
  return { page, close: () => context.close(), mode: "browser", runtimeIdentity };
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
        try { delete window[globalName]; } catch (_) { window[globalName] = undefined; }
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
    await page.waitForFunction(() => {
      try {
        return !!(
          window.WeishanCommerceAgent
          && typeof window.WeishanCommerceAgent.createCommerceTask === "function"
          && typeof window.WeishanCommerceAgent.addCommerceTask === "function"
          && window.CommerceAgentPage
          && typeof window.CommerceAgentPage.mount === "function"
          && document.querySelector(".commerce-page.commerce-workbench")
          && document.querySelector("#commerceInput")
          && document.querySelector("#commerceGenerate")
        );
      } catch (_) {
        return false;
      }
    }, { timeout: 15000 });
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
  repoRoot,
  desktopDir,
  indexFile,
  assertCanonicalE2ERuntime,
  getCanonicalE2ERuntimeDescriptor,
  launchWeishan,
  withWeishan,
  gotoRoute,
  clearLocalStorage,
  cleanupE2EData
};
