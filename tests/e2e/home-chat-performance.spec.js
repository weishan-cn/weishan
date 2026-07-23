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

  test("matching terminal stream answer persists the non-done answer state once", async () => {
    const taskId = runId + "-terminal-stream";
    await gotoRoute(page, "home");

    await page.evaluate((id) => {
      const originalWrite = window.WeishanStore.write.bind(window.WeishanStore);
      window.__homeChatTerminalStreamTest = {
        originalWrite,
        originalChatStream:window.WeishanAPI && window.WeishanAPI.chatStream,
        originalDispatchRouter:window.WeishanDispatchRouter,
        queueWrites:[]
      };
      window.WeishanStore.write = function(key, value) {
        if (key === "command.queue.v205") {
          window.__homeChatTerminalStreamTest.queueWrites.push(JSON.parse(JSON.stringify(value)));
        }
        return originalWrite(key, value);
      };
      window.WeishanAPI = window.WeishanAPI || {};
      window.WeishanAPI.chatStream = async function(_messages, options) {
        options.onDelta("terminal stream answer");
        return { ok:true, content:"terminal stream answer" };
      };
      window.WeishanDispatchRouter = { createDispatchPlan:() => null };
      window.CommandApi.enqueue(id, { attachments:[] });
    }, taskId);

    await page.waitForFunction((id) => {
      const task = (window.CommandApi.snapshot().queue || []).find((item) => item && item.text === id);
      return task && task.status === "done";
    }, taskId, { timeout:15000 });

    const result = await page.evaluate((id) => {
      const state = window.__homeChatTerminalStreamTest;
      const task = (window.CommandApi.snapshot().queue || []).find((item) => item && item.text === id);
      const terminalWrites = state.queueWrites.filter((items) => {
        const item = (items || []).find((candidate) => candidate && candidate.text === id);
        return item && item.status !== "done" && item.answer === "terminal stream answer";
      });
      window.WeishanStore.write = state.originalWrite;
      window.WeishanAPI.chatStream = state.originalChatStream;
      window.WeishanDispatchRouter = state.originalDispatchRouter;
      delete window.__homeChatTerminalStreamTest;
      return {
        terminalWriteCount:terminalWrites.length,
        queueWriteStates:state.queueWrites.map((items) => {
          const item = (items || []).find((candidate) => candidate && candidate.text === id);
          return item ? { status:item.status, route:item.route, answer:item.answer } : null;
        }),
        answer:task && task.answer,
        status:task && task.status,
        answerLogs:(task && task.logs || []).filter((log) => log && log.type === "answer").map((log) => ({ text:log.text, streamingAnswer:log.streamingAnswer })),
        historyMatches:(window.CommandApi.snapshot().history || []).filter((item) => item && item.text === id && item.status === "done").length
      };
    }, taskId);

    expect(result.terminalWriteCount, JSON.stringify(result.queueWriteStates)).toBe(1);
    expect(result.answer).toBe("terminal stream answer");
    expect(result.status).toBe("done");
    expect(result.answerLogs).toEqual([{ text:"回答结果：terminal stream answer", streamingAnswer:false }]);
    expect(result.historyMatches).toBe(1);
  });

  test("stream failure still persists the failed task", async () => {
    const taskId = runId + "-stream-failure";
    await gotoRoute(page, "home");

    await page.evaluate((id) => {
      const originalChatStream = window.WeishanAPI && window.WeishanAPI.chatStream;
      const originalDispatchRouter = window.WeishanDispatchRouter;
      window.__homeChatFailureStreamTest = { originalChatStream, originalDispatchRouter };
      window.WeishanAPI = window.WeishanAPI || {};
      window.WeishanAPI.chatStream = async function() {
        throw new Error("stream unavailable");
      };
      window.WeishanDispatchRouter = { createDispatchPlan:() => null };
      window.CommandApi.enqueue(id, { attachments:[] });
    }, taskId);

    await page.waitForFunction((id) => {
      const task = (window.CommandApi.snapshot().queue || []).find((item) => item && item.text === id);
      return task && task.status === "failed";
    }, taskId, { timeout:15000 });

    const result = await page.evaluate((id) => {
      const task = (window.CommandApi.snapshot().queue || []).find((item) => item && item.text === id);
      const state = window.__homeChatFailureStreamTest;
      window.WeishanAPI.chatStream = state.originalChatStream;
      window.WeishanDispatchRouter = state.originalDispatchRouter;
      delete window.__homeChatFailureStreamTest;
      return {
        status:task && task.status,
        answer:task && task.answer,
        error:task && task.error && task.error.message,
        historyMatches:(window.CommandApi.snapshot().history || []).filter((item) => item && item.text === id && item.status === "failed").length
      };
    }, taskId);

    expect(result.status).toBe("failed");
    expect(result.answer).toContain("stream unavailable");
    expect(result.error).toContain("stream unavailable");
    expect(result.historyMatches).toBe(1);
  });
});
