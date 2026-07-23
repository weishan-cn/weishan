const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute, cleanupE2EData } = require("./helpers");

const runId = "E2EHOMECHATPERF-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

test.describe.serial("home chat performance", () => {
  let app;
  let page;

  test.beforeAll(async ({ browser }) => {
    app = await launchWeishan(browser);
    page = app.page;
  });

  test.afterAll(async () => {
    if (page) await cleanupE2EData(page, runId);
    if (app) await app.close();
  });

  test("twenty streaming updates refresh panels without rebuilding the Home shell", async () => {
    await gotoRoute(page, "home");
    const input = page.locator("#commandInput");
    await expect(input).toBeVisible();
    await input.fill(runId + " draft remains editable");
    await input.focus();

    const result = await page.evaluate((id) => {
      const input = document.querySelector("#commandInput");
      window.__homePerformanceInput = input;
      window.HomePage.__resetPerformanceStatsForTest();
      for (let index = 1; index <= 20; index += 1) {
        const answer = "stream chunk " + index;
        const next = {
          id:id + "-task", text:id + " streaming response", status:"running", route:"ai.chat", module:"chat", answer,
          createdAt:"2026-07-23T00:00:00.000Z", updatedAt:"2026-07-23T00:00:00.000Z",
          logs:[
            { time:"2026-07-23T00:00:00.000Z", type:"ai", text:"调用 AI 大脑：AI 已连接" },
            { time:"2026-07-23T00:00:01.000Z", type:"answer", text:"回答结果：" + answer, streamingAnswer:true }
          ]
        };
        window.WeishanStore.write("command.queue.v205", [next]);
        window.dispatchEvent(new CustomEvent("weishan:command"));
      }
      const finalAnswer = "final streamed answer";
      const failed = {
        id:id + "-task", text:id + " streaming response", status:"failed", route:"ai.chat", module:"chat", answer:finalAnswer,
        createdAt:"2026-07-23T00:00:00.000Z", updatedAt:"2026-07-23T00:00:00.000Z",
        logs:[
          { time:"2026-07-23T00:00:00.000Z", type:"error", text:"执行失败：network failed" },
          { time:"2026-07-23T00:00:01.000Z", type:"answer", text:"回答结果：" + finalAnswer, streamingAnswer:false }
        ]
      };
      window.WeishanStore.write("command.queue.v205", [failed]);
      window.WeishanStore.write("command.history.v205", [failed]);
      window.dispatchEvent(new CustomEvent("weishan:command"));
      return {
        stats:window.HomePage.__getPerformanceStatsForTest(),
        sameInput:document.querySelector("#commandInput") === window.__homePerformanceInput,
        inputValue:document.querySelector("#commandInput").value,
        focused:document.activeElement === window.__homePerformanceInput,
        consoleText:document.querySelector("#cmdConsole").textContent,
        historyText:document.querySelector("#cmdHistory").textContent
      };
    }, runId);

    expect(result.stats.renderShellCount).toBe(0);
    expect(result.stats.refreshCommandPanelsCount).toBe(21);
    expect(result.sameInput).toBe(true);
    expect(result.focused).toBe(true);
    expect(result.inputValue).toBe(runId + " draft remains editable");
    expect(result.consoleText).toContain("final streamed answer");
    expect(result.consoleText).toContain("执行失败");
    expect(result.historyText).toContain(runId + " streaming response");
    expect(result.historyText).toContain("failed");
  });
});
