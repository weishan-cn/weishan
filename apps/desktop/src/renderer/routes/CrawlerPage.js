(function(){
  const JOB_KEY = "crawler.jobs";
  const MAX_AI_TEXT = 12000;
  const MAX_ARTIFACT_TEXT = 60000;
  const MAX_PREVIEW_TEXT = 1600;
  let captureTaskActive = false;

  function esc(s){ return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function t(key){ return window.I18n.t(key); }
  function isEn(){ return window.I18n && window.I18n.getLang && window.I18n.getLang() === "en"; }
  function label(zh, en){ return isEn() ? en : zh; }
  function policy(){ return window.WeishanCaptureCenterPolicy || null; }
  function pendingDispatch(){
    const router = window.WeishanDispatchRouter;
    return router && typeof router.readPendingPayload === "function" ? router.readPendingPayload("crawler") : null;
  }
  function dispatchNoticeHtml(payload){
    if (!payload) return "";
    const prefill = payload.prefill || {};
    const status = payload.status || "pending";
    const canAct = status === "pending" || status === "prefilled";
    const displayStatus = policy() ? policy().statusLabel(status, isEn() ? "en" : "zh") : status;
    return `<div class="ws-card" data-dispatch-prefill="crawler"><h3>${esc(label("来自首页调度中心的抓取任务", "Crawl task from Home dispatch center"))}</h3><p class="ws-muted">${esc(prefill.taskDescription || payload.inputSummary || "")}</p><p><b>${esc(prefill.suggestedAction || payload.action || "")}</b></p><p class="ws-muted">${esc(label("URL", "URL"))}：${esc(prefill.url || "")}</p><p class="ws-muted">${esc(label("状态", "Status"))}：<b data-dispatch-status>${esc(displayStatus)}</b></p><p class="ws-muted">${esc(label("用户确认后才继续。示例网址只生成本地模拟结果，不会访问外部网站。", "User confirmation is required. Example URLs create a local simulated result without accessing an external website."))}</p><div class="ws-row"><button id="crawlerDispatchConfirm" class="ws-btn" ${canAct ? "" : "disabled"}>${esc(label("确认抓取", "Confirm crawl"))}</button><button id="crawlerDispatchCancel" class="ws-btn gray" ${canAct ? "" : "disabled"}>${esc(label("取消任务", "Cancel task"))}</button></div></div>`;
  }
  function confirmDispatch(payload){
    const router = window.WeishanDispatchRouter;
    return router && router.confirmPendingPayload ? router.confirmPendingPayload(payload.dispatchId, {
      executionMode:"crawler_manual_continue",
      outputSummary:"抓取调度任务已确认；未自动访问外网。"
    }) : null;
  }
  function cancelDispatch(payload){
    const router = window.WeishanDispatchRouter;
    return router && router.cancelPendingPayload ? router.cancelPendingPayload(payload.dispatchId, {
      executionMode:"cancelled_by_user",
      outputSummary:"抓取调度任务已取消。"
    }) : null;
  }
  function dispatchHistoryPayload(payload, extra){
    const prefill = payload && payload.prefill || {};
    const detail = extra || {};
    const now = nowIso();
    return {
      schemaVersion:"weishan.task.v1",
      module:"crawler",
      action:detail.action || payload && payload.action || "crawler.webFetch",
      status:detail.status || payload && payload.status || "",
      dispatchId:payload && payload.dispatchId || "",
      targetRoute:payload && payload.targetRoute || "crawler",
      urlSummary:summarize(prefill.url || "", 240),
      inputSummary:summarize(payload && payload.inputSummary || prefill.taskDescription || "", 240),
      outputSummary:summarize(detail.outputSummary || "", 240),
      executionMode:summarize(detail.executionMode || "crawler_manual_continue", 120),
      realExecution:detail.realExecution === true,
      createdAt:detail.createdAt || now,
      updatedAt:now
    };
  }
  function recordCrawlerDispatch(type, payload, extra){
    if (window.HistoryApi && typeof window.HistoryApi.record === "function") {
      window.HistoryApi.record(type, dispatchHistoryPayload(payload, extra || {}));
    }
  }
  function isMockSafeCrawlerUrl(input){
    try {
      const parsed = validateUrl(input);
      const host = parsed.hostname.toLowerCase();
      return host === "example.com" || host === "e2e-local" || host === "mock.local";
    } catch (_) {
      return false;
    }
  }
  function buildMockCrawlerPage(rawUrl){
    const parsed = validateUrl(rawUrl);
    const host = parsed.hostname.toLowerCase();
    return {
      url:parsed.href,
      title:host === "example.com" ? "Example Domain" : "Mock Crawler Result",
      text:[
        "本地模拟抓取结果。",
        "该结果由首页调度确认桥生成，用于验证 CrawlerPage 用户确认后的安全执行路径。",
        "没有访问外网，也没有读取真实网页正文。",
        "未访问外部网站。"
      ].join("\n")
    };
  }
  async function executeDispatchCrawler(payload){
    const confirmed = confirmDispatch(payload);
    if (!confirmed) return { status:"failed", message:label("无法确认调度任务。", "Unable to confirm dispatch task.") };
    const prefill = confirmed.prefill || payload.prefill || {};
    const rawUrl = prefill.url || "";
    recordCrawlerDispatch("crawler.executionRequested", confirmed, {
      status:"confirmed",
      executionMode:"crawler_confirm_requested",
      realExecution:false,
      outputSummary:"用户已在抓取中心确认抓取任务。"
    });
    if (!isMockSafeCrawlerUrl(rawUrl)) {
      return {
        status:"confirmed",
        message:label("真实 URL 已确认，但本轮不会自动访问外网。请在抓取中心继续手动确认真实抓取。", "The real URL was confirmed, but this version does not auto-fetch external pages. Continue manually in Crawler."),
        page:null,
        summary:""
      };
    }
    try {
      const page = buildMockCrawlerPage(rawUrl);
      let task = createTask(page.url);
      task = transition(task, "running", { title:summarize(page.title, 80), inputSummary:summarize(page.url, 240), meta:{ sourceUrl:page.url, mockSafeExecution:true } });
      const outputSummary = label("本地模拟结果 · 未访问外部网站", "Local simulated result · No external website was accessed");
      task = transition(task, "done", { title:summarize(page.title, 80), outputSummary:summarize(outputSummary, 240), meta:{ sourceUrl:page.url, mockSafeExecution:true, realExecution:false } });
      const finalJob = Object.assign({}, task, { sourceUrl:page.url, pageTitle:page.title });
      upsertJob(finalJob);
      recordCrawlerDispatch("crawler.executed", confirmed, {
        status:"executed",
        executionMode:"crawler_mock_safe_execution",
        realExecution:false,
        outputSummary
      });
      if (window.WeishanDispatchRouter && window.WeishanDispatchRouter.markPendingExecuted) {
        window.WeishanDispatchRouter.markPendingExecuted(confirmed.dispatchId, {
          executionMode:"crawler_mock_safe_execution",
          realExecution:false,
          outputSummary
        });
      }
      return { status:"executed", message:outputSummary, page, summary:outputSummary };
    } catch (err) {
      const msg = safeError(err);
      recordCrawlerDispatch("crawler.failed", confirmed, {
        status:"failed",
        executionMode:"crawler_mock_safe_execution",
        realExecution:false,
        outputSummary:"本地模拟抓取失败：" + msg
      });
      if (window.WeishanDispatchRouter && window.WeishanDispatchRouter.markPendingFailed) {
        window.WeishanDispatchRouter.markPendingFailed(confirmed.dispatchId, {
          executionMode:"crawler_mock_safe_execution",
          realExecution:false,
          outputSummary:"本地模拟抓取失败：" + msg
        });
      }
      return { status:"failed", message:msg, page:null, summary:"" };
    }
  }
  function nowIso(){ return new Date().toISOString(); }
  function taskProtocol(){ return window.WeishanTaskProtocol || null; }
  function cleanAiText(text){
    const tp = taskProtocol();
    return tp && tp.stripAiReasoningArtifacts ? tp.stripAiReasoningArtifacts(text) : String(text || "");
  }
  function summarize(text, maxLength){
    const tp = taskProtocol();
    return tp && tp.summarizeTextSafe ? tp.summarizeTextSafe(text, maxLength) : String(text || "").replace(/\s+/g, " ").trim().slice(0, maxLength || 160);
  }
  function safeUrlInputSummary(input){
    const raw = String(input || "").trim();
    try {
      const parsed = new URL(raw);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.href;
      return parsed.protocol + "[blocked]";
    } catch (_) {
      return raw ? "[invalid url]" : "";
    }
  }
  function readJobs(){
    const items = window.WeishanStore.read(JOB_KEY, []);
    const safeItems = Array.isArray(items) ? items : [];
    return policy() ? policy().compactResults(safeItems) : safeItems.slice(0, 20);
  }
  function writeJobs(items){
    const p = policy();
    const limit = p ? p.MAX_VISIBLE_RESULTS : 20;
    window.WeishanStore.write(JOB_KEY, (Array.isArray(items) ? items : []).slice(0, limit));
  }
  function upsertJob(job){
    const p = policy();
    const items = p ? p.mergeResult(readJobs(), job) : [job].concat(readJobs().filter(x => x && x.taskId !== job.taskId)).slice(0, 20);
    writeJobs(items);
  }
  function transition(task, status, extra){
    const tp = taskProtocol();
    return tp && tp.transitionTaskStatus ? tp.transitionTaskStatus(task, status, extra || {}) : Object.assign({}, task || {}, extra || {}, { status, updatedAt:nowIso() });
  }
  function createTask(urlText){
    const tp = taskProtocol();
    if (tp && tp.createTaskRecord) {
      return tp.createTaskRecord({
        module:"crawler",
        action:"webFetch",
        routeMode:"module",
        title:summarize(urlText, 80),
        inputSummary:summarize(urlText, 240),
        status:"queued",
        executor:{ type:"module", id:"crawler.webFetch", label:"Crawler" },
        source:{ type:"module", module:"crawler" },
        target:{ type:"module", module:"crawler" },
        meta:{ sourceUrl:summarize(urlText, 240) }
      });
    }
    return {
      schemaVersion:"weishan.task.v1",
      taskId:"crawl-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
      module:"crawler",
      action:"webFetch",
      routeMode:"module",
      title:summarize(urlText, 80),
      inputSummary:summarize(urlText, 240),
      status:"queued",
      createdAt:nowIso(),
      queuedAt:nowIso(),
      artifacts:[]
    };
  }
  function safeError(err){
    return summarize(err && err.message ? err.message : String(err || ""), 240) || label("未知错误", "Unknown error");
  }
  function validateUrl(input){
    const maxLength = policy() ? policy().MAX_TARGET_LENGTH : 2048;
    const raw = String(input || "").trim();
    if (!raw) throw new Error(label("请输入 URL。", "Please enter a URL."));
    if (raw.length > maxLength) throw new Error(label("网址过长，请缩短后重试。", "The URL is too long. Shorten it and try again."));
    let parsed;
    try { parsed = new URL(raw); } catch (_) { throw new Error(label("URL 格式无效。", "Invalid URL format.")); }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error(label("只支持 http:// 或 https:// URL。", "Only http:// or https:// URLs are supported."));
    const host = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
    if (!host) throw new Error(label("URL 缺少主机名。", "URL host is missing."));
    if (host === "localhost" || host === "::1" || host === "0.0.0.0") throw new Error(label("不支持抓取本地或内网地址。", "Local or private network URLs are not supported."));
    const m = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (m) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      if (a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) || a === 0) {
        throw new Error(label("不支持抓取本地或内网地址。", "Local or private network URLs are not supported."));
      }
    }
    return parsed;
  }
  function decodeEntities(text){
    const textarea = document.createElement("textarea");
    textarea.innerHTML = String(text || "");
    return textarea.value;
  }
  function formatCrawlerLocalDateTime(value){
    const date = value ? new Date(value) : new Date();
    const valid = Number.isNaN(date.getTime()) ? new Date() : date;
    const pad = (n) => String(n).padStart(2, "0");
    return valid.getFullYear() + "/" + pad(valid.getMonth() + 1) + "/" + pad(valid.getDate()) + " " + pad(valid.getHours()) + ":" + pad(valid.getMinutes()) + ":" + pad(valid.getSeconds());
  }
  function spacedPlainText(root){
    const clone = root.cloneNode(true);
    Array.from(clone.querySelectorAll("p,div,section,article,header,footer,main,nav,aside,h1,h2,h3,h4,h5,h6,li,ul,ol,br,table,tr")).forEach(el => {
      el.insertAdjacentText("beforebegin", "\n");
      el.insertAdjacentText("afterend", "\n");
    });
    Array.from(clone.querySelectorAll("*")).forEach(el => {
      el.insertAdjacentText("beforebegin", " ");
      el.insertAdjacentText("afterend", " ");
    });
    return decodeEntities((clone.textContent || "").replace(/[ \t\f\v]+/g, " ").replace(/\s*\n\s*/g, "\n").replace(/\n{3,}/g, "\n\n").trim());
  }
  function extractText(html, sourceUrl){
    const raw = String(html || "");
    const doc = new DOMParser().parseFromString(raw, "text/html");
    Array.from(doc.querySelectorAll("script,style,noscript,svg")).forEach(el => el.remove());
    const title = (doc.querySelector("title") && doc.querySelector("title").textContent || "").replace(/\s+/g, " ").trim() || new URL(sourceUrl).hostname;
    const text = spacedPlainText(doc.body || doc.documentElement);
    return { title, text };
  }
  function buildSummaryFallback(text){
    if (!String(text || "").trim()) return label("无法提取正文。", "Unable to extract page text.");
    return summarize(text, 420);
  }
  async function summarizeWithAi(page){
    if (!window.WeishanAPI || typeof window.WeishanAPI.chat !== "function") return { ok:false, summary:buildSummaryFallback(page.text), error:label("AI 未配置，已保留抓取正文。", "AI is not configured; crawled text was preserved.") };
    const body = String(page.text || "").slice(0, MAX_AI_TEXT);
    if (!body.trim()) return { ok:false, summary:buildSummaryFallback(body), error:label("网页正文为空，无法生成 AI 摘要。", "Page text is empty; AI summary was not generated.") };
    try {
      const res = await window.WeishanAPI.chat([
        { role:"system", content:"你是 weishan 抓取中心摘要助手。请用中文总结网页正文，只基于提供内容，不编造，不输出推理过程。输出：摘要、关键点、可能用途。" },
        { role:"user", content:"URL: " + page.url + "\n标题: " + page.title + "\n正文:\n" + body }
      ], { __perf:window.WeishanPerf && window.WeishanPerf.createPerfMeta ? window.WeishanPerf.createPerfMeta("crawler.summarize") : undefined });
      if (res && res.ok && res.content) return { ok:true, summary:cleanAiText(res.content).trim() || buildSummaryFallback(body), error:"" };
      return { ok:false, summary:buildSummaryFallback(body), error:safeError(res && (res.error || res.message) || label("AI 摘要失败。", "AI summary failed.")) };
    } catch (err) {
      return { ok:false, summary:buildSummaryFallback(body), error:safeError(err) };
    }
  }
  function filename(dateLike){
    const d = dateLike ? new Date(dateLike) : new Date();
    const valid = Number.isNaN(d.getTime()) ? new Date() : d;
    const pad = (n) => String(n).padStart(2, "0");
    return "weishan-crawler-" + valid.getFullYear() + pad(valid.getMonth() + 1) + pad(valid.getDate()) + "-" + pad(valid.getHours()) + pad(valid.getMinutes()) + pad(valid.getSeconds()) + ".txt";
  }
  function textSize(text){ try { return new Blob([String(text || "")]).size; } catch (_) { return String(text || "").length; } }
  function buildArtifactContent(page, summary, fetchedAt){
    const text = String(page.text || "");
    const clipped = text.length > MAX_ARTIFACT_TEXT ? text.slice(0, MAX_ARTIFACT_TEXT).trim() + "\n\n[正文过长，已保留前 " + MAX_ARTIFACT_TEXT + " 字符。]" : text;
    return [
      "抓取结果",
      "URL: " + page.url,
      "标题: " + page.title,
      "时间: " + formatCrawlerLocalDateTime(fetchedAt),
      "",
      "摘要:",
      summary || "",
      "",
      "正文:",
      clipped || label("未提取到正文。", "No text extracted.")
    ].join("\n");
  }
  function addArtifact(task, page, summary){
    const tp = taskProtocol();
    if (!tp || !tp.addTaskArtifact) return task;
    const content = buildArtifactContent(page, summary, task.finishedAt || nowIso());
    return tp.addTaskArtifact(task, {
      taskId:task.taskId,
      type:"text",
      title:summarize(page.title || page.url || "Crawler result", 120),
      filename:filename(task.finishedAt || task.createdAt),
      mimeType:"text/plain;charset=utf-8",
      sizeBytes:textSize(content),
      content,
      meta:{ kind:"crawler-web-fetch", sourceUrl:page.url }
    });
  }
  function historyPayload(task, page){
    return {
      schemaVersion:task.schemaVersion || "weishan.task.v1",
      taskId:task.taskId,
      module:"crawler",
      action:"webFetch",
      status:task.status,
      createdAt:task.createdAt || "",
      startedAt:task.startedAt || "",
      finishedAt:task.finishedAt || "",
      inputSummary:summarize(task.inputSummary || page.url || "", 240),
      outputSummary:summarize(task.outputSummary || "", 240),
      sourceUrl:page.url || "",
      pageTitle:page.title || "",
      artifacts:Array.isArray(task.artifacts) ? task.artifacts : [],
      error:task.error || null
    };
  }
  function recordHistory(task, page){
    if (window.HistoryApi && typeof window.HistoryApi.record === "function") {
      window.HistoryApi.record("crawler.webFetch", historyPayload(task, page || {}));
    }
  }
  function renderJobs(){
    const list = document.getElementById("crawlerJobs");
    if (!list) return;
    const jobs = readJobs();
    list.replaceChildren();
    if (!jobs.length) {
      const empty = document.createElement("div");
      empty.className = "ws-card";
      empty.textContent = t("noCrawler");
      list.appendChild(empty);
      return;
    }
    const p = policy();
    jobs.forEach((job) => {
      const card = document.createElement("div");
      card.className = "ws-card";
      card.setAttribute("data-capture-result", "");
      const title = document.createElement("b");
      title.textContent = String(job.title || job.pageTitle || job.sourceUrl || job.url || job.goal || label("抓取结果", "Capture result"));
      const state = document.createElement("p");
      state.className = "capture-result-status";
      state.textContent = p ? p.statusLabel(job.status, isEn() ? "en" : "zh") : String(job.status || "");
      card.append(title, state);
      if (job.outputSummary) {
        const note = document.createElement("p");
        note.className = "ws-muted";
        note.textContent = p ? p.sanitizeUserCopy(job.outputSummary) : String(job.outputSummary || "");
        if (note.textContent && note.textContent !== state.textContent) card.appendChild(note);
      }
      list.appendChild(card);
    });
  }
  function preview(text){
    const value = String(text || "");
    return value.length > MAX_PREVIEW_TEXT ? value.slice(0, MAX_PREVIEW_TEXT).trim() + "..." : value;
  }
  function updateResult(status, message, page, summary){
    const box = document.getElementById("crawlerResult");
    if (!box) return;
    box.innerHTML = `<div class="ws-card"><h3>${esc(status)}</h3><p class="ws-muted">${esc(message || "")}</p>${summary ? `<h3>${esc(label("摘要", "Summary"))}</h3><p>${esc(summary)}</p>` : ""}${page && page.text ? `<h3>${esc(label("正文预览", "Text Preview"))}</h3><pre>${esc(preview(page.text))}</pre>` : ""}</div>`;
  }
  async function runCrawler(rawUrl){
    let task = createTask(safeUrlInputSummary(rawUrl));
    const page = { url:"", title:"", text:"" };
    try {
      const parsed = validateUrl(rawUrl);
      page.url = parsed.href;
      if (!isMockSafeCrawlerUrl(parsed.href)) throw new Error(label("当前仅支持本地模拟网址，不会访问外部网站。", "Only local simulated targets are available; external websites are not accessed."));
      task = transition(task, "running", { title:summarize(parsed.hostname, 80), inputSummary:summarize(parsed.href, 240), meta:{ sourceUrl:parsed.href, mockSafeExecution:true } });
      upsertJob(Object.assign({}, task, { sourceUrl:parsed.href }));
      updateResult(label("处理中", "In progress"), label("正在生成本地模拟结果...", "Generating a local simulated result..."));
      const localPage = buildMockCrawlerPage(parsed.href);
      page.title = localPage.title;
      page.text = localPage.text;
      const outputSummary = label("本地模拟结果 · 未访问外部网站", "Local simulated result · No external website was accessed");
      task = transition(task, "done", { title:summarize(page.title || parsed.hostname, 80), outputSummary, meta:{ sourceUrl:parsed.href, mockSafeExecution:true, realExecution:false } });
      const finalJob = Object.assign({}, task, { sourceUrl:parsed.href, pageTitle:page.title });
      upsertJob(finalJob);
      recordHistory(finalJob, page);
      updateResult(label("本地模拟结果", "Local simulated result"), label("未访问外部网站。", "No external website was accessed."), page, outputSummary);
    } catch (err) {
      const msg = safeError(err);
      task = transition(task, "failed", { outputSummary:summarize("抓取失败：" + msg, 240), error:{ name:err && err.name || "Error", message:msg } });
      upsertJob(Object.assign({}, task, { sourceUrl:page.url || safeUrlInputSummary(rawUrl) }));
      recordHistory(task, page);
      updateResult(label("处理失败", "Failed"), msg);
    }
    renderJobs();
  }
  function mount(host){
    const dispatchPayload = pendingDispatch();
    const prefill = dispatchPayload && dispatchPayload.prefill || {};
    const maxLength = policy() ? policy().MAX_TARGET_LENGTH : 2048;
    host.innerHTML=`<section class="ws-page">${dispatchNoticeHtml(dispatchPayload)}<div class="ws-card"><h2>${t("crawler")}</h2><p class="ws-muted">${t("crawlerDesc")}</p><div class="ws-row"><input id="crawlUrl" class="ws-input" maxlength="${maxLength}" placeholder="${t("crawlerPlaceholder")}" value="${esc(prefill.url || "")}"><button id="createCrawl" class="ws-btn">${t("createCrawler")}</button></div></div><div id="crawlerResult" role="status" aria-live="polite" aria-atomic="true"></div><div class="card-list" id="crawlerJobs"></div></section>`;
    renderJobs();
    const crawlerDispatchConfirm = document.getElementById("crawlerDispatchConfirm");
    if (crawlerDispatchConfirm && dispatchPayload) crawlerDispatchConfirm.addEventListener("click", async () => {
      if (captureTaskActive) return;
      captureTaskActive = true;
      crawlerDispatchConfirm.disabled = true;
      try {
        const result = await executeDispatchCrawler(dispatchPayload);
        mount(host);
        updateResult(policy() ? policy().statusLabel(result.status, isEn() ? "en" : "zh") : result.status, result.message || "", result.page, result.summary);
      } finally {
        captureTaskActive = false;
      }
    });
    const crawlerDispatchCancel = document.getElementById("crawlerDispatchCancel");
    if (crawlerDispatchCancel && dispatchPayload) crawlerDispatchCancel.addEventListener("click", () => { cancelDispatch(dispatchPayload); mount(host); });
    document.getElementById("createCrawl").addEventListener("click", async ()=>{
      const btn = document.getElementById("createCrawl");
      const input = document.getElementById("crawlUrl");
      if (captureTaskActive) return;
      captureTaskActive = true;
      btn.disabled = true;
      try { await runCrawler(input.value); } finally { captureTaskActive = false; if (btn.isConnected) btn.disabled = false; }
    });
  }
  window.CrawlerPage = { mount, policy:policy() };
})();
