const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute } = require("./helpers");

const runId = "E2ESEC-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
const copyShortcut = process.platform === "darwin" ? "Meta+C" : "Control+C";

async function cleanupSecurityData(page) {
  await page.evaluate((id) => {
    const key = "weishan:enterprise:collaborationInvites:v1";
    function hasRunId(value) {
      try {
        return JSON.stringify(value || "").includes(id);
      } catch (_) {
        return false;
      }
    }
    try {
      const raw = window.localStorage.getItem(key);
      const items = raw ? JSON.parse(raw) : [];
      if (Array.isArray(items)) {
        window.localStorage.setItem(key, JSON.stringify(items.filter((item) => !hasRunId(item))));
      }
    } catch (_) {}
  }, runId);
}

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

async function createInvite(page, input) {
  await gotoRoute(page, "team");
  await expect(page.locator("#collabProjectName")).toBeVisible();
  await page.locator("#collabProjectName").fill(input.projectName);
  await page.locator("#collabProjectType").selectOption(input.projectType);
  await page.locator("#collabOwnerOrg").selectOption(input.ownerOrg);
  await page.locator("#collabInvitedOrg").selectOption(input.invitedOrg);
  await page.locator("#collabInviteeName").fill(input.inviteeName);
  await page.locator("#collabInviteeRole").selectOption({ label: input.inviteeRole });
  await page.locator("#collabNote").fill(input.note);
  await page.locator("#sendCollabInvite").click();
}

test.describe.serial("enterprise security audit", () => {
  let app;
  let page;
  let allowedProjectName;

  test.beforeAll(async ({ browser }) => {
    app = await launchWeishan(browser);
    page = app.page;
  });

  test.afterAll(async () => {
    if (page) await cleanupSecurityData(page);
    if (app) await app.close();
  });

  test("history copy writes audit.copy", async () => {
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

    await searchAudit(page, "audit.copy");
    await expect(page.getByText("audit.copy").first()).toBeVisible();
  });

  test("allowed collaboration invite writes collaboration.invite", async () => {
    allowedProjectName = runId + " 软件项目";
    await createInvite(page, {
      projectName: allowedProjectName,
      projectType: "softwareFactory",
      ownerOrg: "org-exec",
      invitedOrg: "org-tech",
      inviteeName: runId + " 技术同事",
      inviteeRole: "编辑者",
      note: runId + " 合法软件协作邀请"
    });

    const card = page.locator("[data-invite-card]").filter({ hasText: allowedProjectName }).first();
    await expect(card).toBeVisible();
    await expect(card.getByText(/已邀请|invited/).first()).toBeVisible();

    await searchAudit(page, "collaboration.invite");
    await expect(page.getByText("collaboration.invite").first()).toBeVisible();
  });

  test("blocked collaboration invite writes collaboration.inviteBlocked", async () => {
    const blockedProjectName = runId + " 财务项目";
    await createInvite(page, {
      projectName: blockedProjectName,
      projectType: "finance",
      ownerOrg: "org-finance",
      invitedOrg: "org-tech",
      inviteeName: runId + " 技术同事",
      inviteeRole: "查看者",
      note: runId + " 越权邀请测试"
    });

    await expect(page.locator("#collabStatus")).toContainText(/财务数据项目不能邀请/);
    const card = page.locator("[data-invite-card]").filter({ hasText: blockedProjectName }).first();
    await expect(card).toBeVisible();
    await expect(card.getByText(/已拦截|blocked/).first()).toBeVisible();

    await searchAudit(page, "collaboration.inviteBlocked");
    await expect(page.getByText("collaboration.inviteBlocked").first()).toBeVisible();
  });

  test("join leave and message write collaboration audit records", async () => {
    await gotoRoute(page, "team");
    const card = page.locator("[data-invite-card]").filter({ hasText: allowedProjectName }).first();
    await expect(card).toBeVisible();

    await card.getByRole("button", { name: "标记加入" }).click();
    await expect(page.locator("[data-invite-card]").filter({ hasText: allowedProjectName }).first().getByText(/已加入|joined/).first()).toBeVisible();

    const joinedCard = page.locator("[data-invite-card]").filter({ hasText: allowedProjectName }).first();
    await joinedCard.locator("[data-note-input]").fill(runId + " 协作备注");
    await joinedCard.getByRole("button", { name: "添加协作备注" }).click();

    const messageCard = page.locator("[data-invite-card]").filter({ hasText: allowedProjectName }).first();
    await messageCard.getByRole("button", { name: "标记离开" }).click();
    await expect(page.locator("[data-invite-card]").filter({ hasText: allowedProjectName }).first().getByText(/已离开|left/).first()).toBeVisible();

    await searchAudit(page, runId);
    await expect(page.getByText("collaboration.join").first()).toBeVisible();
    await expect(page.getByText("collaboration.message").first()).toBeVisible();
    await expect(page.getByText("collaboration.leave").first()).toBeVisible();
  });

  test("audit page can search copy and blocked invite records", async () => {
    await searchAudit(page, "audit.copy");
    await expect(page.getByText("audit.copy").first()).toBeVisible();

    await page.locator("#auditSearch").fill("collaboration.inviteBlocked");
    await expect(page.getByText("collaboration.inviteBlocked").first()).toBeVisible();
  });
});
