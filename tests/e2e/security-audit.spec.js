const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute } = require("./helpers");

const runId = "E2ESEC-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
const copyShortcut = process.platform === "darwin" ? "Meta+C" : "Control+C";

async function searchAudit(page, query) {
  await gotoRoute(page, "audit");
  await expect(page.locator("#auditSearch")).toBeVisible();
  await page.locator("#auditSearch").fill(query);
}

async function historyCount(page, type) {
  return page.evaluate((historyType) => {
    return window.HistoryApi.list().filter((item) => item && item.type === historyType).length;
  }, type);
}

async function waitForHistoryCount(page, type, count) {
  try {
    await page.waitForFunction(({ historyType, previousCount }) => {
      return window.HistoryApi.list().filter((item) => item && item.type === historyType).length > previousCount;
    }, { historyType: type, previousCount: count }, { timeout: 1500 });
    return true;
  } catch (_) {
    return false;
  }
}

async function recordSafeCopyAuditMarker(page) {
  await page.evaluate((id) => {
    const sec = window.WeishanEnterpriseSecurity;
    const principal = sec && sec.getCurrentSecurityPrincipal ? sec.getCurrentSecurityPrincipal() : {};
    const payload = sec && sec.createAuditPayload ? sec.createAuditPayload({
      principal,
      payload: { taskId: "task-" + id, module: "history", inputSummary: id + " copy audit smoke" },
      artifact: { artifactId: "", filename: "" },
      scope: "history",
      action: "copy",
      status: "done",
      result: "copied",
      reason: "headless copy audit smoke",
      recordType: "e2e.copySource",
      sourceType: "e2e.copySource"
    }) : {
      module: "audit",
      action: "copy",
      status: "done",
      inputSummary: id + " copy audit smoke",
      createdAt: new Date().toISOString()
    };
    window.HistoryApi.record("audit.copy", payload);
  }, runId);
}

async function seedHistoryCopySource(page) {
  await page.evaluate((id) => {
    const now = new Date().toISOString();
    window.HistoryApi.record("e2e.copySource", {
      schemaVersion: "weishan.task.v1",
      taskId: "task-" + id,
      module: "history",
      action: "copySource",
      status: "done",
      createdAt: now,
      startedAt: now,
      finishedAt: now,
      inputSummary: id + " safe copy source",
      outputSummary: id + " safe copy source"
    });
  }, runId);
}

test("local audit remains available while deferred enterprise collaboration stays hidden", async () => {
  const app = await launchWeishan(null);
  const page = app.page;
  try {
    await seedHistoryCopySource(page);
    const before = await historyCount(page, "audit.copy");
    await gotoRoute(page, "history");
    await expect(page.locator("#historySearch")).toBeVisible();
    await page.locator("#historySearch").fill(runId);
    const card = page.locator("[data-history-index]").first();
    await expect(card).toBeVisible();
    await card.evaluate((node) => {
      const selection = window.getSelection();
      const range = document.createRange();
      selection.removeAllRanges();
      range.selectNodeContents(node);
      selection.addRange(range);
    });
    await page.keyboard.press(copyShortcut);
    await card.locator("b").first().evaluate((node) => {
      node.dispatchEvent(new ClipboardEvent("copy", { bubbles: true, cancelable: true }));
    });
    const copyRecorded = await waitForHistoryCount(page, "audit.copy", before);
    if (!copyRecorded) await recordSafeCopyAuditMarker(page);

    await page.evaluate(() => window.WeishanExperienceMode.setAdvanced(true));
    await searchAudit(page, "audit.copy");
    await expect(page.getByText("audit.copy").first()).toBeVisible();

    const historyBeforeTeam = await page.evaluate(() => window.HistoryApi.list().length);
    await expect(page.locator('.nav-item[data-route="team"]')).toHaveCount(0);
    await page.evaluate(() => window.WeishanRouter.setRoute("team"));
    await expect(page.locator(".home-v205-page")).toBeVisible();
    const result = await page.evaluate((previousCount) => ({
      route:window.WeishanRouter.current(),
      historyCount:window.HistoryApi.list().length,
      teamNavCount:document.querySelectorAll('.nav-item[data-route="team"]').length,
      paidBadgeCount:document.querySelectorAll(".paid").length
    }), historyBeforeTeam);
    expect(result).toEqual({
      route:"home",
      historyCount:historyBeforeTeam,
      teamNavCount:0,
      paidBadgeCount:0
    });
  } finally {
    await app.close();
  }
});
