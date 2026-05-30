(function(){
  let selectedIndex = 0;
  let activeWorkspaceTab = "inbox";
  const visibleImageKeys = new Set();
  let replyDraftState = { key:"", loading:false, error:"", subject:"", body:"" };
  let taskExtractState = { key:"", loading:false, error:"", body:"" };
  let translationState = { key:"", loading:false, error:"", body:"", view:"original", targetLabel:"", targetEnglish:"" };
  let summaryState = { key:"", loading:false, error:"", body:"" };
  let translationMenuKey = "";
  let copyFeedbackState = { key:"", type:"", status:"" };
  let copyFeedbackTimer = null;
  let replyOpenNoticeState = { key:"", message:"" };
  let replyOpenNoticeTimer = null;
  let collapsedAiCards = { summary:false, reply:false, tasks:false, translation:false };
  let aiClearVersion = 0;

  function esc(s){
    return String(s || "").replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; });
  }
  function t(key){ return window.I18n.t(key); }
  function pendingDispatch(){
    const router = window.WeishanDispatchRouter;
    return router && typeof router.readPendingPayload === "function" ? router.readPendingPayload("mail") : null;
  }
  function dispatchNoticeHtml(payload){
    if (!payload) return "";
    const prefill = payload.prefill || {};
    const status = payload.status || "pending";
    const canAct = status === "pending" || status === "prefilled";
    return `<div class="mail-card" data-dispatch-prefill="mail"><h2>来自首页调度中心的邮件任务</h2><p class="mail-muted">${esc(prefill.taskTitle || "邮件接管任务")}</p><p><b>${esc(prefill.suggestedAction || payload.action || "")}</b></p><p class="mail-muted">${esc(prefill.taskDescription || payload.inputSummary || "")}</p><p class="mail-muted">状态：<b data-dispatch-status>${esc(status)}</b></p><p class="mail-muted">不会自动读取邮箱、生成回复或调用邮件 AI；请确认后在邮件接管模块内继续选择具体操作。</p><div class="mail-button-row"><button class="mail-primary" id="mailDispatchConfirm" ${canAct ? "" : "disabled"}>确认执行</button><button class="mail-gray" id="mailDispatchCancel" ${canAct ? "" : "disabled"}>取消任务</button></div></div>`;
  }
  function confirmDispatch(payload){
    const router = window.WeishanDispatchRouter;
    return router && router.confirmPendingPayload ? router.confirmPendingPayload(payload.dispatchId, {
      executionMode:"mail_manual_continue",
      outputSummary:"邮件调度任务已确认；未自动读取邮箱或调用邮件 AI。"
    }) : null;
  }
  function cancelDispatch(payload){
    const router = window.WeishanDispatchRouter;
    return router && router.cancelPendingPayload ? router.cancelPendingPayload(payload.dispatchId, {
      executionMode:"cancelled_by_user",
      outputSummary:"邮件调度任务已取消。"
    }) : null;
  }
  function createMailPerf(featureAction){
    return window.WeishanPerf && window.WeishanPerf.createPerfMeta ? window.WeishanPerf.createPerfMeta(featureAction) : { enabled:false, traceId:"", featureAction };
  }
  function perfStart(meta, stage, extra){
    return window.WeishanPerf && meta && meta.enabled ? window.WeishanPerf.perfStart(meta.traceId, meta.featureAction, stage, extra || {}) : 0;
  }
  function perfEnd(meta, stage, startedAt, extra){
    if (window.WeishanPerf && meta && meta.enabled) window.WeishanPerf.perfEnd(meta.traceId, meta.featureAction, stage, startedAt, extra || {});
  }
  function mailPerfNow(){
    return window.performance && typeof window.performance.now === "function" ? window.performance.now() : Date.now();
  }
  function mailPerfStats(text){
    const raw = String(text || "");
    const visible = cleanMailStreamPreview(raw);
    return {
      rawChars:raw.length,
      visibleChars:visible.length,
      hiddenChars:Math.max(0, raw.length - visible.length)
    };
  }
  function perfMailDetail(meta, stage, startedAt, extra){
    if (!meta || meta.enabled !== true) return;
    const allowed = { durationMs:true, rawChars:true, visibleChars:true, hiddenChars:true, finalChars:true, chunkCount:true };
    const safe = {};
    if (startedAt != null) safe.durationMs = Math.round((mailPerfNow() - Number(startedAt || mailPerfNow())) * 10) / 10;
    Object.keys(extra || {}).forEach((key) => {
      const value = extra[key];
      if (allowed[key] && typeof value === "number" && isFinite(value)) safe[key] = value;
    });
    const body = Object.keys(safe).map((key) => key + "=" + String(safe[key])).join(" ");
    try { console.debug("[perf][trace=" + meta.traceId + "][" + meta.featureAction + "] " + stage + (body ? " " + body : "")); } catch (_) {}
  }
  function perfError(meta, stage, startedAt, err, extra){
    if (!window.WeishanPerf || !meta || !meta.enabled) return;
    window.WeishanPerf.perfEnd(meta.traceId, meta.featureAction, stage, startedAt, Object.assign({}, extra || {}, window.WeishanPerf.safeError ? window.WeishanPerf.safeError(err) : { errorName:"Error" }));
  }
  function date(s){ try { return s ? new Date(s).toLocaleString() : ""; } catch (_) { return String(s || ""); } }
  function cls(st){ return st === "connected" ? "mail-ok" : st === "failed" ? "mail-bad" : st === "connecting" ? "mail-pending" : "mail-idle"; }
  function stText(a){ return !a ? t("mailStatusDisconnected") : a.status === "connected" ? t("mailStatusSuccess") : a.status === "failed" ? t("mailStatusFailed") : a.status === "connecting" ? t("mailStatusConnecting") : t("mailStatusDisconnected"); }

  function mTitle(m){ return m.subject || m.title || t("mailUntitled"); }
  function mFrom(m){ return typeof m.from === "string" ? m.from : (m.from && m.from.text) || m.sender || ""; }
  function mDate(m){ return m.date || m.receivedAt || m.createdAt || ""; }
  function mBody(m){ return m.bodyText || m.text || m.body || m.htmlText || m.preview || ""; }
  function mHtml(a, m){ return m && (m.bodyHtml || m.html || m.htmlText) || (window.MailApi.bodyHtml && window.MailApi.bodyHtml(a && a.email, m && m.uid)) || ""; }
  function mailImageKey(a, m){ return String((a && a.email) || "") + ":" + String((m && (m.uid || m.date || m.subject)) || ""); }
  function mailReplyKey(a, m){ return mailImageKey(a, m); }
  const TRANSLATION_LANGUAGES = [
    { code:"zh", label:"中文", english:"Chinese" },
    { code:"en", label:"English", english:"English" },
    { code:"ja", label:"日本語", english:"Japanese" },
    { code:"ko", label:"한국어", english:"Korean" },
    { code:"fr", label:"Français", english:"French" },
    { code:"de", label:"Deutsch", english:"German" },
    { code:"es", label:"Español", english:"Spanish" },
    { code:"ru", label:"Русский", english:"Russian" },
    { code:"ar", label:"العربية", english:"Arabic" },
    { code:"pt", label:"Português", english:"Portuguese" }
  ];
  function hasFullBody(m){ return !!(m && (m.bodySynced || (m.bodyText && !m.indexedOnly))); }
  function safeUrl(value, allowMailto){
    const url = String(value || "").trim();
    if (/^https?:\/\//i.test(url)) return url;
    if (allowMailto && /^mailto:/i.test(url)) return url;
    return "";
  }
  function normalizeImageUrl(value){
    const raw = String(value || "").trim();
    if (!raw) return { url:"", reason:"empty" };
    if (/^\/\//.test(raw)) return { url:"https:" + raw, reason:"remote" };
    if (/^https?:\/\//i.test(raw)) return { url:raw, reason:"remote" };
    if (/^cid:/i.test(raw)) return { url:"", reason:"cid" };
    if (/^(javascript|data|file):/i.test(raw)) return { url:"", reason:"blocked" };
    return { url:"", reason:"relative" };
  }
  function normalizeSrcset(value){
    const raw = String(value || "").trim();
    if (!raw) return { srcset:"", reason:"empty" };
    const items = raw.split(",").map((item) => {
      const parts = item.trim().split(/\s+/).filter(Boolean);
      const normalized = normalizeImageUrl(parts.shift() || "");
      if (!normalized.url) return null;
      return [normalized.url].concat(parts).join(" ");
    }).filter(Boolean);
    if (items.length) return { srcset:items.join(", "), reason:"remote" };
    if (/cid:/i.test(raw)) return { srcset:"", reason:"cid" };
    if (/^(javascript|data|file):/i.test(raw)) return { srcset:"", reason:"blocked" };
    return { srcset:"", reason:"relative" };
  }
  function imageCandidate(el){
    const attrs = ["src", "data-src", "data-original", "data-lazy-src", "data-original-src"];
    let reason = "empty";
    for (const attr of attrs) {
      const normalized = normalizeImageUrl(el.getAttribute(attr));
      if (normalized.url) return { src:normalized.url, reason:"remote" };
      if (normalized.reason && normalized.reason !== "empty") reason = normalized.reason;
    }
    const srcset = normalizeSrcset(el.getAttribute("srcset"));
    if (srcset.srcset) {
      const first = srcset.srcset.split(",")[0].trim().split(/\s+/)[0] || "";
      return { src:first, srcset:srcset.srcset, reason:"remote" };
    }
    return { src:"", reason:srcset.reason !== "empty" ? srcset.reason : reason };
  }
  function imagePlaceholder(doc, text, src, srcset, className){
    const span = doc.createElement("span");
    span.className = className || "mail-hidden-image";
    span.textContent = text;
    if (src) span.setAttribute("data-mail-src", src);
    if (srcset) span.setAttribute("data-mail-srcset", srcset);
    return span;
  }
  function sanitizeMailHtml(html, options){
    const raw = String(html || "");
    const allowImages = !!(options && options.allowImages);
    if (!raw.trim()) return { html:"", hiddenImages:0 };
    const doc = new DOMParser().parseFromString(raw, "text/html");
    const blocked = "script,iframe,object,embed,form,input,button,meta,link,base";
    Array.from(doc.querySelectorAll(blocked)).forEach((node) => node.remove());
    Array.from(doc.querySelectorAll("style")).forEach((node) => node.remove());

    let hiddenImages = 0;
    Array.from(doc.body.querySelectorAll("*")).forEach((el) => {
      Array.from(el.attributes || []).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = String(attr.value || "").trim();
        const tag = el.tagName.toLowerCase();
        const imageAttr = (tag === "img" || tag === "source") && /^(src|srcset|data-src|data-original|data-lazy-src|data-original-src)$/.test(name);
        if (/^on/.test(name) || name === "srcdoc") el.removeAttribute(attr.name);
        if ((name === "href" || name === "src" || name === "xlink:href") && /^\s*javascript:/i.test(value)) el.removeAttribute(attr.name);
        if ((name === "href" || name === "xlink:href") && !safeUrl(value, true)) el.removeAttribute(attr.name);
        if ((name === "src" || name === "poster") && !imageAttr && !safeUrl(value, false)) el.removeAttribute(attr.name);
        if (name === "style" && /expression|javascript:|behavior\s*:|url\s*\(/i.test(value)) el.removeAttribute(attr.name);
      });
    });

    Array.from(doc.body.querySelectorAll("img,source")).forEach((el) => {
      const candidate = imageCandidate(el);
      const normalizedSrcset = normalizeSrcset(el.getAttribute("srcset"));
      const hasRemote = !!(candidate.src || normalizedSrcset.srcset);
      if (!hasRemote) {
        const reason = candidate.reason || normalizedSrcset.reason;
        const text = reason === "cid" ? t("mailEmbeddedImageUnsupported") : t("mailImageUnavailable");
        el.replaceWith(imagePlaceholder(doc, text, "", "", "mail-hidden-image mail-image-unavailable"));
        return;
      }
      if (!allowImages) {
        hiddenImages += 1;
        el.replaceWith(imagePlaceholder(doc, t("mailRemoteImagesHidden"), candidate.src, normalizedSrcset.srcset || candidate.srcset || "", "mail-hidden-image"));
        return;
      }
      if (el.tagName.toLowerCase() === "img" && candidate.src) el.setAttribute("src", candidate.src);
      if (normalizedSrcset.srcset || candidate.srcset) el.setAttribute("srcset", normalizedSrcset.srcset || candidate.srcset);
      if (el.tagName.toLowerCase() === "source" && !el.getAttribute("srcset")) {
        el.replaceWith(imagePlaceholder(doc, t("mailImageUnavailable"), "", "", "mail-hidden-image mail-image-unavailable"));
        return;
      }
      el.setAttribute("data-mail-image", "remote");
      el.removeAttribute("data-src");
      el.removeAttribute("data-original");
      el.removeAttribute("data-lazy-src");
      el.removeAttribute("data-original-src");
    });
    Array.from(doc.body.querySelectorAll("picture")).forEach((el) => {
      if (!el.querySelector("img,source")) el.remove();
    });

    Array.from(doc.body.querySelectorAll("a")).forEach((a) => {
      const href = String(a.getAttribute("href") || "").trim();
      const safeHref = safeUrl(href, true);
      if (safeHref) {
        a.setAttribute("href", "#");
        a.setAttribute("data-mail-url", safeHref);
        a.setAttribute("rel", "noreferrer noopener");
        a.classList.add("mail-html-link");
      } else {
        a.removeAttribute("href");
      }
      a.removeAttribute("target");
    });

    return { html:doc.body.innerHTML.trim(), hiddenImages };
  }
  function cleanMailBodyForPreview(text){
    const raw = String(text || "")
      .replace(/\r/g, "\n")
      .replace(/<style[\s\S]*?<\/style>/gi, "\n")
      .replace(/<script[\s\S]*?<\/script>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>|<\/div>|<\/li>|<\/tr>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, "\"");
    const lines = raw.split(/\n+/);
    const kept = [];
    const rawLinks = [];
    let hidden = 0;
    const urlRe = /https?:\/\/\S+|www\.\S+/gi;
    const noisyRe = /(jump_id|jump_transfer|tracking|track|utm_|unsubscribe|pixel|img\d*|\.gif|\.png|\.jpg|\.jpeg|\.webp|click|redirect|callback|spm=|scm=|jd\.com\/jump|mkt|newsletter)/i;

    for (const line of lines) {
      let s = String(line || "").replace(/\s+/g, " ").trim();
      if (!s) continue;
      const urls = s.match(urlRe) || [];
      const withoutUrls = s.replace(urlRe, "").replace(/[|·,，;；:：\-_=~*/\\()[\]{}<>]+/g, " ").replace(/\s+/g, " ").trim();
      const pureUrl = urls.length && withoutUrls.length < 8;
      const noisy = noisyRe.test(s);

      if (urls.length && (pureUrl || noisy || urls.join("").length > 100)) {
        hidden += urls.length;
        rawLinks.push(s);
        if (withoutUrls && withoutUrls.length >= 8 && !noisy) kept.push(withoutUrls);
        continue;
      }

      if (urls.length > 1) {
        hidden += urls.length;
        rawLinks.push(s);
        s = withoutUrls;
      } else if (urls.length === 1) {
        hidden += 1;
        rawLinks.push(urls[0]);
        s = withoutUrls || s.replace(urlRe, "[" + t("mailShowRawBody") + "]");
      }

      if (s && s.length >= 2) kept.push(s);
    }

    const compact = [];
    for (const line of kept) {
      if (compact[compact.length - 1] !== line) compact.push(line);
    }
    const cleaned = compact.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
    return { cleaned, hidden, rawLinks };
  }
  function resetReplyDraft(){
    aiClearVersion += 1;
    replyDraftState = { key:"", loading:false, error:"", subject:"", body:"" };
    taskExtractState = { key:"", loading:false, error:"", body:"" };
    translationState = { key:"", loading:false, error:"", body:"", view:"original", targetLabel:"", targetEnglish:"" };
    summaryState = { key:"", loading:false, error:"", body:"" };
    translationMenuKey = "";
    copyFeedbackState = { key:"", type:"", status:"" };
    replyOpenNoticeState = { key:"", message:"" };
    collapsedAiCards = { summary:false, reply:false, tasks:false, translation:false };
    if (copyFeedbackTimer) clearTimeout(copyFeedbackTimer);
    copyFeedbackTimer = null;
    if (replyOpenNoticeTimer) clearTimeout(replyOpenNoticeTimer);
    replyOpenNoticeTimer = null;
  }
  function isAiCardCollapsed(type){
    return !!collapsedAiCards[type];
  }
  function expandAiCard(type){
    collapsedAiCards = Object.assign({}, collapsedAiCards, { [type]:false });
  }
  function toggleAiCard(type){
    collapsedAiCards = Object.assign({}, collapsedAiCards, { [type]:!collapsedAiCards[type] });
  }
  function aiCollapseButton(type){
    const collapsed = isAiCardCollapsed(type);
    return `<button type="button" class="mail-ai-collapse-btn" data-toggle-ai-card="${esc(type)}">${collapsed ? t("mailExpand") : t("mailCollapse")}</button>`;
  }
  function clearAiResults(){
    aiClearVersion += 1;
    replyDraftState = { key:"", loading:false, error:"", subject:"", body:"" };
    taskExtractState = { key:"", loading:false, error:"", body:"" };
    translationState = { key:"", loading:false, error:"", body:"", view:"original", targetLabel:"", targetEnglish:"" };
    summaryState = { key:"", loading:false, error:"", body:"" };
    translationMenuKey = "";
    copyFeedbackState = { key:"", type:"", status:"" };
    replyOpenNoticeState = { key:"", message:"" };
    collapsedAiCards = { summary:false, reply:false, tasks:false, translation:false };
    if (copyFeedbackTimer) clearTimeout(copyFeedbackTimer);
    copyFeedbackTimer = null;
    if (replyOpenNoticeTimer) clearTimeout(replyOpenNoticeTimer);
    replyOpenNoticeTimer = null;
  }
  async function copyText(text){
    const value = String(text || "");
    if (!value) return false;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch (_) {}
    try {
      const area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "readonly");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      return !!ok;
    } catch (_) {
      return false;
    }
  }
  function copyButtonLabel(key, type, fallbackKey){
    if (copyFeedbackState.key === key && copyFeedbackState.type === type) {
      if (copyFeedbackState.status === "ok") return t("mailCopied");
      if (copyFeedbackState.status === "failed") return t("mailCopyFailed");
    }
    return t(fallbackKey);
  }
  function extractEmailAddress(value){
    const text = String(value || "");
    const angle = text.match(/<([^<>\s]+@[^<>\s]+)>/);
    if (angle) return angle[1].trim();
    const plain = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    return plain ? plain[0].trim() : "";
  }
  function externalOpen(url){
    if (window.WeishanAPI && typeof window.WeishanAPI.openExternal === "function") {
      return window.WeishanAPI.openExternal(url);
    }
    if (window.weishan && typeof window.weishan.openExternal === "function") {
      return window.weishan.openExternal(url);
    }
    return Promise.reject(new Error("OPEN_EXTERNAL_UNAVAILABLE"));
  }
  function currentDraftText(reader, key){
    const subjectInput = reader.querySelector(`[data-reply-subject-input="${CSS.escape(key)}"]`);
    const bodyInput = reader.querySelector(`[data-reply-body-input="${CSS.escape(key)}"]`);
    if (replyDraftState.key === key) {
      replyDraftState = Object.assign({}, replyDraftState, {
        subject:subjectInput ? subjectInput.value : replyDraftState.subject,
        body:bodyInput ? bodyInput.value : replyDraftState.body
      });
    }
    return {
      subject:replyDraftState.subject || "",
      body:replyDraftState.body || "",
      text:[replyDraftState.subject, "", replyDraftState.body].filter(Boolean).join("\n")
    };
  }
  function showReplyOpenNotice(reader, key, message){
    replyOpenNoticeState = { key, message };
    const account = window.MailApi.activeAccount();
    reader.innerHTML = readerHtml(account, messagesForTab(account, activeWorkspaceTab));
    if (replyOpenNoticeTimer) clearTimeout(replyOpenNoticeTimer);
    replyOpenNoticeTimer = setTimeout(() => {
      if (replyOpenNoticeState.key === key) {
        replyOpenNoticeState = { key:"", message:"" };
        const nextAccount = window.MailApi.activeAccount();
        reader.innerHTML = readerHtml(nextAccount, messagesForTab(nextAccount, activeWorkspaceTab));
      }
    }, 3500);
  }
  function detectMailLanguage(subject, body){
    const sample = String((subject || "") + "\n" + (body || "")).slice(0, 6000);
    const zh = (sample.match(/[\u3400-\u9fff]/g) || []).length;
    const en = (sample.match(/[A-Za-z]/g) || []).length;
    if (zh >= 20 && zh * 2 > en) return "中文";
    if (en >= 80 && en > zh * 3) return "English";
    return window.I18n && window.I18n.getLang && window.I18n.getLang() === "en" ? "English" : "中文";
  }
  function isPlaceholderOnly(text){
    return !String(text || "").replace(/[.\s。…\-_*`~[\](){}<>:：|]+/g, "").trim();
  }
  function isEmptyAiShell(text){
    return !String(text || "").replace(/[\s.,，。…\-_*`~[\](){}<>:：|"'“”‘’/\\]+/g, "").trim();
  }
  function stripAiBlocks(content){
    return stripAiReasoningArtifacts(content)
      .replace(/```(?:[\w-]+)?\s*/g, "")
      .replace(/```/g, "")
      .replace(/\r/g, "\n")
      .trim();
  }
  function stripAiReasoningArtifacts(text){
    if (typeof text !== "string") return "";
    let raw = text
      .replace(/\r/g, "\n")
      .replace(/<\s*think\b[^>]*>[\s\S]*?<\s*\/\s*think\s*>/gi, "")
      .replace(/<\s*reasoning\b[^>]*>[\s\S]*?<\s*\/\s*reasoning\s*>/gi, "")
      .replace(/```(?:think|thinking|reasoning|analysis)[\s\S]*?```/gi, "")
      .replace(/\[think\][\s\S]*?\[\/think\]/gi, "");
    raw = raw
      .replace(/<\s*think\b[^>]*>[\s\S]*$/gi, "")
      .replace(/<\s*reasoning\b[^>]*>[\s\S]*$/gi, "")
      .replace(/```(?:think|thinking|reasoning|analysis)[\s\S]*$/gi, "")
      .replace(/\[think\][\s\S]*$/gi, "");

    const metaLine = /^\s*(I\s+(?:will|would|should|must|need to|am going to|can|cannot|can't|won't|don't)\b|I\s+am\s+weishan\b|I\s+will\s+(?:not|just)\b|The\s+user\s+(?:wants|asked|needs|is asking)\b|The\s+email\s+(?:says|is|contains|appears|seems)\b|Let\s+me\b|First,|We\s+should\b|So,\s*should\s+I\b|Tone:|Output format:|Analysis:|Reasoning:|No analysis|No reasoning|No markdown|Just the draft)/i;
    const businessLine = /^\s*([{\["'“”‘’]|[-*•\d]+[.)、]|邮件摘要|Email Summary|待办|Tasks|回复主题|回复正文|Reply Subject|Reply Body|Subject:|Body:|未发现明确待办事项|No clear tasks found|[A-Za-z]*\s*[:：]|[\u3400-\u9fff])/i;
    const lines = raw.split("\n");
    const kept = [];
    let started = false;
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!started) {
        if (!trimmed || metaLine.test(trimmed)) return;
        if (businessLine.test(trimmed) || trimmed) started = true;
      }
      if (started) kept.push(line);
    });
    return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  function cleanMailStreamPreview(text){
    return stripAiReasoningArtifacts(text);
  }
  function mailStreamPlaceholder(featureAction){
    if (featureAction === "mail.summarize") return "AI 正在生成摘要…";
    if (featureAction === "mail.draftReply") return "AI 正在生成回复草稿…";
    if (featureAction === "mail.extractTodos") return "AI 正在提取待办…";
    if (featureAction === "mail.translate") return "AI 正在翻译邮件…";
    return "AI 正在生成…";
  }
  function cleanAiVisibleOutput(content, finalPattern){
    let raw = stripAiBlocks(content);

    const finalMatch = raw.match(finalPattern || /(?:回复主题|Reply Subject|Subject)\s*[:：]|(?:回复正文|Reply Body|Body)\s*[:：]|(?:待办|Tasks)\s*[:：]|未发现明确待办事项|No clear tasks found/i);
    if (finalMatch && finalMatch.index > 0) raw = raw.slice(finalMatch.index).trim();

    const analysisLine = /^\s*(First,|I need to|Let me check|Tone:|Output format:|I'll draft|I'll write|The user|The email|We should|So,\s*should I|Reasoning:|Analysis:|思考[:：]|分析[:：])/i;
    raw = raw.split("\n").filter((line) => !analysisLine.test(line)).join("\n").trim();
    raw = raw
      .replace(/^\s*(Here is|Here's|Below is|Sure,? here is|当然，?以下是).*$/gim, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return raw;
  }
  function cleanReplyDraftOutput(content){
    return cleanAiVisibleOutput(content, /(?:回复主题|Reply Subject|Subject)\s*[:：]|(?:回复正文|Reply Body|Body)\s*[:：]/i);
  }
  function cleanTaskOutput(content){
    const raw = String(content || "");
    if (isEmptyAiShell(raw)) return t("mailNoClearTasks");
    if (/未发现明确待办事项|No clear tasks found|没有明确待办|无明确待办|无待办|无需处理|不需要处理|no clear tasks|no tasks found|no action needed|does not require a reply|does not require action/i.test(raw)) return t("mailNoClearTasks");
    const cleaned = cleanAiVisibleOutput(raw, /(?:待办|Tasks)\s*[:：]|未发现明确待办事项|No clear tasks found/i);
    if (isEmptyAiShell(cleaned) || /^(?:待办|Tasks)\s*[:：]?\s*$/i.test(cleaned)) return t("mailNoClearTasks");
    return cleaned;
  }
  function mailAiErrorMessage(err, fallbackKey){
    const raw = String(err && err.message || err || "");
    if (/AI Key 未配置|api key.*(missing|not configured|empty)|请先.*AI Key/i.test(raw)) return t("mailAiKeyMissing");
    if (/session|会话|saved key|取不到|not found|missing saved/i.test(raw) && /key|AI/i.test(raw)) return t("mailAiSessionKeyMissing");
    if (/接口地址未配置|模型名未配置|base url|model|provider|route|network|fetch|unauthorized|quota|credits|rejected|prohibited|violation/i.test(raw)) return t("mailAiConnectorFailed");
    return t(fallbackKey);
  }
  function cleanSummaryOutput(content){
    return cleanAiVisibleOutput(content, /(?:邮件摘要|Email Summary)\s*[:：]/i);
  }
  function cleanTranslationOutput(content){
    return cleanAiVisibleOutput(content, /[\s\S]/);
  }
  function removeReplyConstraintResidue(text){
    const residueLine = /^\s*(No analysis|No reasoning|No markdown|Just the draft|Output format|Use this exact output format|Strict JSON|Return JSON|Only output|Do not output|不要输出|只输出|请按以下固定格式|回复应包含|语气[:：]|Tone[:：])/i;
    return String(text || "").split("\n").filter((line) => !residueLine.test(line)).join("\n");
  }
  function cleanReplyField(value, field){
    let text = stripAiBlocks(value);
    text = removeReplyConstraintResidue(text)
      .replace(/^\s*(?:回复主题|Reply Subject|Subject)\s*[:：]\s*/i, "")
      .replace(/^\s*(?:回复正文|Reply Body|Body)\s*[:：]\s*/i, "")
      .replace(/\n\s*(?:回复主题|Reply Subject|Subject)\s*[:：]\s*/gi, "\n")
      .replace(/\n\s*(?:回复正文|Reply Body|Body)\s*[:：]\s*/gi, "\n")
      .replace(/^\s*["'“”‘’`]+|["'“”‘’`]+\s*$/g, "")
      .replace(/^\s*,+\s*|\s*,+\s*$/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (field === "subject") text = text.split("\n")[0].trim();
    return text;
  }
  function isInvalidReplyDraftBody(text){
    const raw = String(text || "").trim();
    if (!raw) return true;
    const signal = raw.replace(/[\s.,，。…\-_*`~[\](){}<>:：|"'“”‘’/\\]+/g, "");
    if (!signal) return true;
    if (/^(No analysis|No reasoning|No markdown|Just the draft|Output format|Use this exact output format|Strict JSON|Return JSON)$/i.test(raw)) return true;
    if (/^(then\s*)?(回复正文|Reply Body|Body)\s*[:：]?$/i.test(raw)) return true;
    if (/^[",.:：，。]+$/.test(raw)) return true;
    return false;
  }
  function parseReplyJson(raw){
    const cleaned = stripAiBlocks(raw);
    const candidates = [cleaned];
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first >= 0 && last > first) candidates.push(cleaned.slice(first, last + 1));
    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate);
        if (parsed && typeof parsed === "object") return parsed;
      } catch (_) {}
    }
    return null;
  }
  function parseReplyDraftOutput(content, fallbackSubject){
    const parsedJson = parseReplyJson(content);
    if (parsedJson) {
      const subject = cleanReplyField(parsedJson.subject || "", "subject") || fallbackSubject;
      const body = cleanReplyField(parsedJson.body || "", "body");
      return { subject, body:isInvalidReplyDraftBody(body) ? "" : body };
    }

    const raw = cleanReplyDraftOutput(content);
    const subjectMatch = raw.match(/(?:^|\n)(?:回复主题|Reply Subject|Subject)\s*[:：]\s*(.+)/i);
    const bodyMatch = raw.match(/(?:回复正文|Reply Body|Body)\s*[:：]\s*([\s\S]*)/i);
    const subject = cleanReplyField(subjectMatch ? subjectMatch[1] : fallbackSubject, "subject") || fallbackSubject;
    let body = bodyMatch ? bodyMatch[1] : raw;
    if (subjectMatch && !bodyMatch) body = body.replace(subjectMatch[0], "").trim();
    body = cleanReplyField(body, "body");
    return { subject, body:isInvalidReplyDraftBody(body) ? "" : body };
  }
  function mailHasImages(account, message){
    return /<(img|picture|source)\b/i.test(mHtml(account, message));
  }
  function refreshMailReader(){
    const reader = document.querySelector(".mail-reader");
    if (!reader || !window.MailApi) return;
    const account = window.MailApi.activeAccount();
    reader.innerHTML = readerHtml(account, messagesForTab(account, activeWorkspaceTab));
  }
  async function mailAiChat(messages, meta, streamOptions){
    const inputChars = window.WeishanPerf && window.WeishanPerf.countMessageChars ? window.WeishanPerf.countMessageChars(messages) : 0;
    const canStream = window.WeishanAPI && typeof window.WeishanAPI.chatStream === "function";
    if (!canStream) return window.WeishanAPI.chat(messages, { __perf:meta });

    let partial = "";
    let flushTimer = 0;
    let flushStartedAt = 0;
    let hasFirstVisible = false;
    let chunkCount = 0;
    const flushMs = 140;
    const flush = (force) => {
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = 0;
      }
      if (!partial || !streamOptions || typeof streamOptions.onPartial !== "function") return;
      const cleanedPreview = cleanMailStreamPreview(partial);
      const visiblePreview = cleanedPreview || mailStreamPlaceholder(meta && meta.featureAction);
      if (cleanedPreview && !hasFirstVisible) {
        hasFirstVisible = true;
        perfMailDetail(meta, "renderer.stream.firstVisible.done", streamStartedAt, Object.assign(mailPerfStats(partial), { outputChars:cleanedPreview.length, chunkCount }));
      }
      flushStartedAt = perfStart(meta, "renderer.stream.ui.flush.start", { outputChars:partial.length });
      streamOptions.onPartial(visiblePreview);
      refreshMailReader();
      perfEnd(meta, "renderer.stream.ui.flush.done", flushStartedAt, { outputChars:partial.length });
      flushStartedAt = 0;
    };
    const scheduleFlush = () => {
      if (flushTimer) return;
      flushTimer = setTimeout(() => flush(false), flushMs);
    };

    const streamStartedAt = perfStart(meta, "renderer.stream.start", { inputChars, hasImages:!!(streamOptions && streamOptions.hasImages) });
    try {
      const res = await window.WeishanAPI.chatStream(messages, {
        __perf:meta,
        onDelta:function(delta){
          partial += String(delta || "");
          chunkCount += 1;
          scheduleFlush();
        }
      });
      flush(true);
      const finalText = String(res && res.content || partial || "");
      const finalStats = mailPerfStats(finalText);
      if (!hasFirstVisible && finalText) {
        perfMailDetail(meta, "renderer.stream.firstVisible.missing", null, Object.assign(finalStats, { chunkCount }));
      }
      perfEnd(meta, "renderer.stream.done", streamStartedAt, { inputChars, outputChars:finalText.length, hasImages:!!(streamOptions && streamOptions.hasImages) });
      perfMailDetail(meta, "renderer.stream.done", streamStartedAt, Object.assign(finalStats, { chunkCount }));
      return res;
    } catch (err) {
      if (flushTimer) clearTimeout(flushTimer);
      perfError(meta, "renderer.stream.error", streamStartedAt, err, { inputChars, outputChars:partial.length, hasImages:!!(streamOptions && streamOptions.hasImages) });
      throw err;
    }
  }
  async function generateReplyDraft(account, message, meta){
    meta = meta && meta.enabled ? meta : createMailPerf("mail.draftReply");
    const prepareStartedAt = perfStart(meta, "renderer.prepare.start", { hasImages:mailHasImages(account, message) });
    const key = mailReplyKey(account, message);
    const subject = mTitle(message);
    const from = mFrom(message);
    const mailDate = date(mDate(message));
    const body = cleanMailBodyForPreview(mBody(message)).cleaned.slice(0, 6000);
    const lang = detectMailLanguage(subject, body);
    const fallbackSubject = /^re:/i.test(subject) ? subject : "Re: " + subject;
    perfEnd(meta, "renderer.prepare.done", prepareStartedAt, { inputChars:body.length, hasImages:mailHasImages(account, message) });

    if (!window.WeishanAPI || typeof window.WeishanAPI.chat !== "function") {
      return { ok:false, message:t("mailReplyAiFailed") };
    }

    const prompt = [
      "请根据以下邮件生成一封回复草稿。",
      "必须只返回严格 JSON，不要 markdown，不要代码块，不要解释。",
      "JSON 格式必须是：",
      "{\"subject\":\"Re: ...\",\"body\":\"...\"}",
      "subject 是回复主题，只放主题文本。",
      "body 是可直接发送的完整邮件正文，不要包含 Subject: / Reply Subject / Reply Body / 回复主题 / 回复正文 标签。",
      "请使用与原邮件相同的语言：" + lang + "。",
      "语气礼貌、自然、专业，但不要过度客套，不要像模板或摘要。",
      "写成自然、完整、可直接发送的邮件回复，不要过短。",
      lang === "English" ? "Default length: 90 to 180 words, unless the original email only needs a very short reply." : "默认中文正文 120 到 220 字，除非原邮件本身只需要极短回复。",
      "回复正文应包含称呼、对来信内容的具体回应、明确但谨慎的态度、必要补充或下一步、自然结尾。",
      "根据原邮件内容写得具体一点，避免只写泛泛的感谢、收到、会考虑。",
      "不要输出分析过程、reasoning、think、markdown 代码块或格式解释。",
      "不要写 First, / I need to / Tone: / Output format: / The user / The email / We should / No analysis / no reasoning / no markdown / Just the draft / <think> / </think>。",
      "不要自动承诺用户未确认的事项。",
      "不要编造事实、时间、身份、付款、报名或参加承诺。",
      "对邀请或调研类邮件，可以表达感谢并表示愿意了解或考虑参与，但不要直接承诺一定参加。",
      lang === "English" ? "If the email usually does not require a reply, return JSON with body: This type of email usually does not require a reply." : "如果邮件通常无需回复，返回 JSON，body 写：这类邮件通常无需回复。",
      "不要发送邮件，不要声称已经发送。",
      "不要输出字面省略号或占位符，例如 ...。",
      "",
      "邮件标题：" + subject,
      "发件人：" + from,
      "时间：" + mailDate,
      "正文：",
      body || t("mailNoPlainBody")
    ].join("\n");

    expandAiCard("reply");
    replyDraftState = { key, loading:true, error:"", subject:"", body:"" };
    const clearVersion = aiClearVersion;
    try {
      const messages = [
        { role:"system", content:"你是 weishan 邮件回复草稿助手。只生成草稿，不发送邮件；不要索要或输出敏感凭据；不要编造用户未确认的承诺。" },
        { role:"user", content:prompt }
      ];
      const aiStartedAt = perfStart(meta, "renderer.ai.call.start", { messageCount:messages.length, inputChars:body.length, hasImages:mailHasImages(account, message) });
      let res;
      try {
        res = await mailAiChat(messages, meta, {
          hasImages:mailHasImages(account, message),
          onPartial:function(partial){
            if (clearVersion !== aiClearVersion) return;
            replyDraftState = { key, loading:true, error:"", subject:fallbackSubject, body:partial };
          }
        });
        perfEnd(meta, "renderer.ai.call.done", aiStartedAt, { messageCount:messages.length, inputChars:body.length, outputChars:String(res && res.content || "").length, hasImages:mailHasImages(account, message) });
      } catch (err) {
        perfError(meta, "renderer.ai.call.error", aiStartedAt, err, { messageCount:messages.length, inputChars:body.length, hasImages:mailHasImages(account, message) });
        throw err;
      }
      if (clearVersion !== aiClearVersion) return { ok:false, cancelled:true };
      if (!res || !res.ok) throw new Error(String((res && (res.error || res.message)) || ""));
      const rawResult = String(res.content || "");
      const rawStats = mailPerfStats(rawResult);
      const rawContent = stripAiReasoningArtifacts(rawResult);
      const parseStartedAt = perfStart(meta, "renderer.parse.start", { outputChars:String(rawContent || "").length });
      const parsed = parseReplyDraftOutput(rawContent, fallbackSubject);
      perfEnd(meta, "renderer.parse.done", parseStartedAt, { outputChars:String(parsed.body || "").length });
      perfMailDetail(meta, "renderer.parse.done", parseStartedAt, { finalChars:String(parsed.body || "").length, rawChars:rawStats.rawChars, hiddenChars:rawStats.hiddenChars });
      if (!parsed.body || !parsed.body.trim()) throw new Error("EMPTY_DRAFT");
      const stateStartedAt = perfStart(meta, "renderer.ui.commit.start", { outputChars:String(parsed.body || "").length });
      replyDraftState = { key, loading:false, error:"", subject:parsed.subject, body:parsed.body };
      perfEnd(meta, "renderer.ui.commit.done", stateStartedAt, { outputChars:String(parsed.body || "").length });
      return { ok:true };
    } catch (_) {
      if (clearVersion !== aiClearVersion) return { ok:false, cancelled:true };
      const messageText = _ && String(_.message || _) === "EMPTY_DRAFT" ? t("mailReplyEmpty") : mailAiErrorMessage(_, "mailReplyAiFailed");
      replyDraftState = { key, loading:false, error:messageText, subject:"", body:"" };
      return { ok:false, message:messageText };
    }
  }
  async function extractMailTasks(account, message, meta){
    meta = meta && meta.enabled ? meta : createMailPerf("mail.extractTodos");
    const prepareStartedAt = perfStart(meta, "renderer.prepare.start", { hasImages:mailHasImages(account, message) });
    const key = mailReplyKey(account, message);
    const subject = mTitle(message);
    const from = mFrom(message);
    const mailDate = date(mDate(message));
    const body = cleanMailBodyForPreview(mBody(message)).cleaned.slice(0, 6000);
    const lang = detectMailLanguage(subject, body);
    perfEnd(meta, "renderer.prepare.done", prepareStartedAt, { inputChars:body.length, hasImages:mailHasImages(account, message) });

    if (!window.WeishanAPI || typeof window.WeishanAPI.chat !== "function") {
      return { ok:false, message:t("mailTaskAiFailed") };
    }

    const prompt = [
      "请从以下邮件中提取待办建议。",
      "请使用与原邮件相同的语言：" + lang + "。",
      "只输出最终待办结果，不输出分析过程、reasoning、think、markdown 代码块或格式解释。",
      "不要写 First, / I need to / Tone: / Output format: / The user / The email / We should / <think> / </think>。",
      "不要写入日历，不要创建系统通知，不要自动提醒，不要发送邮件。",
      "重点识别会议、约定、面试、调研、截止日期、回复期限、金额、账单、付款、订单、需要确认、回复、提交、参加、填写、验证码、安全通知、异常登录。",
      "不要编造邮件里没有的截止日期；时间不明确时写“未明确”或 “Not specified”。",
      "如果只是系统通知或没有明确动作，请输出未发现明确待办事项。",
      "不要输出字面省略号或占位符，例如 ...。",
      lang === "English" ? "Use this exact output format:" : "请按以下固定格式输出：",
      lang === "English" ? "Tasks:" : "待办：",
      lang === "English" ? "1. Title: {task title}" : "1. 标题：{待办标题}",
      lang === "English" ? "   Time: {time or Not specified}" : "   时间：{时间或未明确}",
      lang === "English" ? "   Priority: High / Medium / Low" : "   优先级：高 / 中 / 低",
      lang === "English" ? "   Reason: {brief evidence}" : "   依据：{简短依据}",
      lang === "English" ? "If there are no tasks, output exactly: No clear tasks found." : "如果没有待办，输出：未发现明确待办事项。",
      "",
      "邮件标题：" + subject,
      "发件人：" + from,
      "时间：" + mailDate,
      "正文：",
      body || t("mailNoPlainBody")
    ].join("\n");

    expandAiCard("tasks");
    taskExtractState = { key, loading:true, error:"", body:"" };
    const clearVersion = aiClearVersion;
    try {
      const messages = [
        { role:"system", content:"你是 weishan 邮件待办提取助手。只提取页面内待办建议；不要写日历，不创建通知，不自动提醒，不发送邮件；不要索要或输出敏感凭据。" },
        { role:"user", content:prompt }
      ];
      const aiStartedAt = perfStart(meta, "renderer.ai.call.start", { messageCount:messages.length, inputChars:body.length, hasImages:mailHasImages(account, message) });
      let res;
      try {
        res = await mailAiChat(messages, meta, {
          hasImages:mailHasImages(account, message),
          onPartial:function(partial){
            if (clearVersion !== aiClearVersion) return;
            taskExtractState = { key, loading:true, error:"", body:partial };
          }
        });
        perfEnd(meta, "renderer.ai.call.done", aiStartedAt, { messageCount:messages.length, inputChars:body.length, outputChars:String(res && res.content || "").length, hasImages:mailHasImages(account, message) });
      } catch (err) {
        perfError(meta, "renderer.ai.call.error", aiStartedAt, err, { messageCount:messages.length, inputChars:body.length, hasImages:mailHasImages(account, message) });
        throw err;
      }
      if (clearVersion !== aiClearVersion) return { ok:false, cancelled:true };
      if (!res || !res.ok) throw new Error(String((res && (res.error || res.message)) || ""));
      const rawResult = String(res.content || "");
      const rawStats = mailPerfStats(rawResult);
      const rawContent = stripAiReasoningArtifacts(rawResult);
      const parseStartedAt = perfStart(meta, "renderer.parse.start", { outputChars:String(rawContent || "").length });
      const cleaned = cleanTaskOutput(rawContent);
      perfEnd(meta, "renderer.parse.done", parseStartedAt, { outputChars:String(cleaned || "").length });
      perfMailDetail(meta, "renderer.parse.done", parseStartedAt, { finalChars:String(cleaned || "").length, rawChars:rawStats.rawChars, hiddenChars:rawStats.hiddenChars });
      if (!cleaned || isPlaceholderOnly(cleaned)) throw new Error("EMPTY_TASKS");
      const stateStartedAt = perfStart(meta, "renderer.ui.commit.start", { outputChars:String(cleaned || "").length });
      taskExtractState = { key, loading:false, error:"", body:cleaned };
      perfEnd(meta, "renderer.ui.commit.done", stateStartedAt, { outputChars:String(cleaned || "").length });
      return { ok:true };
    } catch (_) {
      if (clearVersion !== aiClearVersion) return { ok:false, cancelled:true };
      const messageText = _ && String(_.message || _) === "EMPTY_TASKS" ? t("mailTaskEmptyResult") : mailAiErrorMessage(_, "mailTaskAiFailed");
      taskExtractState = { key, loading:false, error:messageText, body:"" };
      return { ok:false, message:messageText };
    }
  }
  async function translateMail(account, message, targetLanguage, meta){
    meta = meta && meta.enabled ? meta : createMailPerf("mail.translate");
    const prepareStartedAt = perfStart(meta, "renderer.prepare.start", { hasImages:mailHasImages(account, message) });
    const key = mailReplyKey(account, message);
    const subject = mTitle(message);
    const from = mFrom(message);
    const mailDate = date(mDate(message));
    const body = cleanMailBodyForPreview(mBody(message)).cleaned.slice(0, 8000);
    const target = targetLanguage || TRANSLATION_LANGUAGES[0];
    perfEnd(meta, "renderer.prepare.done", prepareStartedAt, { inputChars:body.length, hasImages:mailHasImages(account, message) });

    if (!window.WeishanAPI || typeof window.WeishanAPI.chat !== "function") {
      return { ok:false, message:t("mailTranslationAiFailed") };
    }

    const prompt = [
      "Translate the email into: " + target.english + ".",
      "只输出译文正文，不输出分析过程、reasoning、think、markdown 代码块或解释。",
      "保留邮件原意，不扩写，不总结，不添加解释。",
      "保留重要数字、日期、金额、链接文字、邮箱地址、验证码、订单号、账单金额、日期时间。",
      "不要写 First, / I need to / Tone: / Output format: / The user / The email / We should / <think> / </think>。",
      "",
      "邮件标题：" + subject,
      "发件人：" + from,
      "时间：" + mailDate,
      "正文：",
      body || t("mailNoPlainBody")
    ].join("\n");

    expandAiCard("translation");
    translationState = { key, loading:true, error:"", body:"", view:"original", targetLabel:target.label, targetEnglish:target.english };
    translationMenuKey = "";
    const clearVersion = aiClearVersion;
    try {
      const messages = [
        { role:"system", content:"你是 weishan 邮件翻译助手。只翻译用户提供的邮件纯文本，不输出分析过程，不发送邮件，不保存内容，不索要或输出敏感凭据。" },
        { role:"user", content:prompt }
      ];
      const aiStartedAt = perfStart(meta, "renderer.ai.call.start", { messageCount:messages.length, inputChars:body.length, hasImages:mailHasImages(account, message) });
      let res;
      try {
        res = await mailAiChat(messages, meta, {
          hasImages:mailHasImages(account, message),
          onPartial:function(partial){
            if (clearVersion !== aiClearVersion) return;
            translationState = { key, loading:true, error:"", body:partial, view:"translation", targetLabel:target.label, targetEnglish:target.english };
          }
        });
        perfEnd(meta, "renderer.ai.call.done", aiStartedAt, { messageCount:messages.length, inputChars:body.length, outputChars:String(res && res.content || "").length, hasImages:mailHasImages(account, message) });
      } catch (err) {
        perfError(meta, "renderer.ai.call.error", aiStartedAt, err, { messageCount:messages.length, inputChars:body.length, hasImages:mailHasImages(account, message) });
        throw err;
      }
      if (clearVersion !== aiClearVersion) return { ok:false, cancelled:true };
      if (!res || !res.ok) throw new Error(String((res && (res.error || res.message)) || ""));
      const rawResult = String(res.content || "");
      const rawStats = mailPerfStats(rawResult);
      const rawContent = stripAiReasoningArtifacts(rawResult);
      const parseStartedAt = perfStart(meta, "renderer.parse.start", { outputChars:String(rawContent || "").length });
      const cleaned = cleanTranslationOutput(rawContent);
      perfEnd(meta, "renderer.parse.done", parseStartedAt, { outputChars:String(cleaned || "").length });
      perfMailDetail(meta, "renderer.parse.done", parseStartedAt, { finalChars:String(cleaned || "").length, rawChars:rawStats.rawChars, hiddenChars:rawStats.hiddenChars });
      if (!cleaned) throw new Error("EMPTY_TRANSLATION");
      const stateStartedAt = perfStart(meta, "renderer.ui.commit.start", { outputChars:String(cleaned || "").length });
      translationState = { key, loading:false, error:"", body:cleaned, view:"translation", targetLabel:target.label, targetEnglish:target.english };
      perfEnd(meta, "renderer.ui.commit.done", stateStartedAt, { outputChars:String(cleaned || "").length });
      return { ok:true };
    } catch (_) {
      if (clearVersion !== aiClearVersion) return { ok:false, cancelled:true };
      const messageText = _ && String(_.message || _) === "EMPTY_TRANSLATION" ? t("mailTranslationEmpty") : mailAiErrorMessage(_, "mailTranslationAiFailed");
      translationState = { key, loading:false, error:messageText, body:"", view:"original", targetLabel:target.label, targetEnglish:target.english };
      return { ok:false, message:messageText };
    }
  }
  async function summarizeMail(account, message, meta){
    meta = meta && meta.enabled ? meta : createMailPerf("mail.summarize");
    const prepareStartedAt = perfStart(meta, "renderer.prepare.start", { hasImages:mailHasImages(account, message) });
    const key = mailReplyKey(account, message);
    const subject = mTitle(message);
    const from = mFrom(message);
    const mailDate = date(mDate(message));
    const body = cleanMailBodyForPreview(mBody(message)).cleaned.slice(0, 6000);
    const isEnglish = window.I18n && window.I18n.getLang && window.I18n.getLang() === "en";
    perfEnd(meta, "renderer.prepare.done", prepareStartedAt, { inputChars:body.length, hasImages:mailHasImages(account, message) });

    if (!window.WeishanAPI || typeof window.WeishanAPI.chat !== "function") {
      return { ok:false, message:t("mailSummaryAiFailed") };
    }

    const structure = isEnglish
      ? [
          "Email Summary:",
          "- Subject:",
          "- Main point:",
          "- Action needed:",
          "- Key time:",
          "- Key amount:",
          "- Key links or accounts:",
          "- Risk note:"
        ]
      : [
          "邮件摘要：",
          "- 主题：",
          "- 核心内容：",
          "- 是否需要处理：",
          "- 关键时间：",
          "- 关键金额：",
          "- 关键链接或账号：",
          "- 风险提示："
        ];
    const missingText = isEnglish ? "Not mentioned" : "未提及";
    const prompt = [
      isEnglish ? "Summarize the following email." : "请总结以下邮件。",
      isEnglish ? "Use English for the summary." : "请使用中文输出摘要。",
      "Only output the final summary. Do not output reasoning, think, analysis, markdown code blocks, or HTML.",
      "Do not write First, / I need to / Let me check / The user / The email / We should / So, should I / Tone: / Output format: / Analysis: / Reasoning: / <think> / </think>.",
      isEnglish ? "Use exactly this structure:" : "请严格使用以下结构：",
      structure.join("\n"),
      isEnglish ? "If information is missing, write: " + missingText + "." : "没有的信息写：" + missingText + "。",
      isEnglish ? "Do not invent times, amounts, links, accounts, identities, or obligations." : "不要编造时间、金额、链接、账号、身份或处理义务。",
      isEnglish ? "For verification codes, security notices, bills, orders, meetings, and research invitations, clearly state whether action is needed." : "对验证码、安全通知、账单、订单、会议、调研邮件，要特别标明是否需要处理。",
      isEnglish ? "For ads or marketing emails, note that they usually do not need action when appropriate." : "对广告或营销邮件，可以说明通常无需处理。",
      "",
      "邮件标题：" + subject,
      "发件人：" + from,
      "时间：" + mailDate,
      "正文：",
      body || t("mailNoPlainBody")
    ].join("\n");

    expandAiCard("summary");
    summaryState = { key, loading:true, error:"", body:"" };
    const clearVersion = aiClearVersion;
    try {
      const messages = [
        { role:"system", content:"你是 weishan 邮件摘要助手。只总结用户提供的邮件纯文本；不输出分析过程；不发送邮件；不保存内容；不创建任务、日历、提醒或通知；不要索要或输出敏感凭据。" },
        { role:"user", content:prompt }
      ];
      const aiStartedAt = perfStart(meta, "renderer.ai.call.start", { messageCount:messages.length, inputChars:body.length, hasImages:mailHasImages(account, message) });
      let res;
      try {
        res = await mailAiChat(messages, meta, {
          hasImages:mailHasImages(account, message),
          onPartial:function(partial){
            if (clearVersion !== aiClearVersion) return;
            summaryState = { key, loading:true, error:"", body:partial };
          }
        });
        perfEnd(meta, "renderer.ai.call.done", aiStartedAt, { messageCount:messages.length, inputChars:body.length, outputChars:String(res && res.content || "").length, hasImages:mailHasImages(account, message) });
      } catch (err) {
        perfError(meta, "renderer.ai.call.error", aiStartedAt, err, { messageCount:messages.length, inputChars:body.length, hasImages:mailHasImages(account, message) });
        throw err;
      }
      if (clearVersion !== aiClearVersion) return { ok:false, cancelled:true };
      if (!res || !res.ok) throw new Error(String((res && (res.error || res.message)) || ""));
      const rawResult = String(res.content || "");
      const rawStats = mailPerfStats(rawResult);
      const rawContent = stripAiReasoningArtifacts(rawResult);
      const parseStartedAt = perfStart(meta, "renderer.parse.start", { outputChars:String(rawContent || "").length });
      const cleaned = cleanSummaryOutput(rawContent);
      perfEnd(meta, "renderer.parse.done", parseStartedAt, { outputChars:String(cleaned || "").length });
      perfMailDetail(meta, "renderer.parse.done", parseStartedAt, { finalChars:String(cleaned || "").length, rawChars:rawStats.rawChars, hiddenChars:rawStats.hiddenChars });
      if (!cleaned || isPlaceholderOnly(cleaned)) throw new Error("EMPTY_SUMMARY");
      const stateStartedAt = perfStart(meta, "renderer.ui.commit.start", { outputChars:String(cleaned || "").length });
      summaryState = { key, loading:false, error:"", body:cleaned };
      perfEnd(meta, "renderer.ui.commit.done", stateStartedAt, { outputChars:String(cleaned || "").length });
      return { ok:true };
    } catch (_) {
      if (clearVersion !== aiClearVersion) return { ok:false, cancelled:true };
      const messageText = _ && String(_.message || _) === "EMPTY_SUMMARY" ? t("mailSummaryEmpty") : mailAiErrorMessage(_, "mailSummaryAiFailed");
      summaryState = { key, loading:false, error:messageText, body:"" };
      return { ok:false, message:messageText };
    }
  }
  function mFlags(m){ return Array.isArray(m.flags) ? m.flags.map((x) => String(x).toLowerCase()) : []; }
  function haystack(m){
    return [m.subject, m.from, m.to, m.preview, m.bodyText, m.text, m.body, m.sender].map((x) => String(x || "")).join(" ").toLowerCase();
  }
  function hasAny(text, patterns){
    return patterns.some((pattern) => pattern.test(text));
  }
  function classifyMailMessage(m){
    const text = haystack(m);
    const flags = mFlags(m);
    const flagged = !!(m.flagged || m.starred || m.important || flags.includes("\\flagged") || flags.includes("flagged") || flags.includes("important"));
    const security = /security|secure|login|sign.?in|password|2fa|verification|verify|code|otp|risk|fraud|suspicious|unusual|alert|验证码|校验码|动态码|安全|登录|登陆|密码|账户|账号|风险|异常|可疑|提醒|告警/.test(text);
    const money = /invoice|receipt|bill|billing|payment|pay now|paid|unpaid|refund|charge|statement|amount|due|order|purchase|transaction|subscription|renewal|发票|收据|账单|付款|支付|缴费|退款|扣款|金额|订单|交易|订阅|续费|尾款|定金/.test(text);
    const deadline = /deadline|due date|due by|expires?|expire|overdue|before|by \d|cutoff|last day|截止|到期|逾期|过期|最晚|期限|请于|之前|截至/.test(text);
    const meeting = /meeting|invite|invitation|calendar|schedule|appointment|interview|webinar|event|rsvp|会议|邀请|日程|预约|面试|活动|参会|报名|调研/.test(text);
    const action = /action required|please reply|reply|respond|confirm|confirmation|submit|fill|complete|review|approve|sign|join|attend|book|schedule|pay|upload|download|register|rsvp|需要.*(回复|确认|提交|填写|参加|付款|支付|处理)|请.*(回复|确认|提交|填写|参加|付款|支付|处理|查看|完成)|回复|确认|提交|填写|参加|付款|支付|预约|面试|会议|发票处理|处理|审核|签署|报名/.test(text);
    const memory = /account|order|contract|agreement|invoice|receipt|subscription|notice|login alert|security notice|transaction|statement|license|policy|warranty|账户|账号|订单|合同|协议|发票|收据|订阅|重要通知|登录提醒|安全通知|交易记录|流水|对账单|许可证|保修|凭证/.test(text);
    const waiting = /waiting|pending|awaiting|follow.?up|reminder|in progress|processing|not completed|unresolved|待回复|等待|待处理|处理中|未完成|跟进|提醒|等待确认|待确认|待审核|待支付|待发货|待收货/.test(text);

    return {
      important: flagged || security || money || deadline || meeting || hasAny(text, [/urgent|important|asap|priority|critical|紧急|重要|优先|请尽快/]),
      tasks: action || deadline || meeting || (/verify|verification|验证码|校验码|otp/.test(text) && /now|立即|马上|尽快/.test(text)),
      memory: memory || money || security,
      waiting: waiting
    };
  }
  function isImportant(m){
    return classifyMailMessage(m).important;
  }
  function isTask(m){
    return classifyMailMessage(m).tasks;
  }
  function isMemory(m){
    return classifyMailMessage(m).memory;
  }
  function isWaiting(m){
    return classifyMailMessage(m).waiting;
  }
  function messagesForTab(account, tab){
    const msgs = account && account.connected ? (account.messages || []) : [];
    if (tab === "important") return msgs.filter(isImportant);
    if (tab === "drafts") return [];
    if (tab === "tasks") return msgs.filter(isTask);
    if (tab === "memory") return msgs.filter(isMemory);
    if (tab === "waiting") return msgs.filter(isWaiting);
    return msgs;
  }
  function emptyTextForTab(tab){
    if (tab === "important") return t("mailImportantEmpty");
    if (tab === "drafts") return t("mailDraftsUnavailable");
    if (tab === "tasks") return t("mailTasksEmpty");
    if (tab === "memory") return t("mailMemoryEmpty");
    if (tab === "waiting") return t("mailWaitingEmpty");
    return t("mailFilteredEmpty");
  }
  function activeTabLabel(){
    const tab = workspaceTabs().find((x) => x[0] === activeWorkspaceTab) || workspaceTabs()[0];
    return t(tab[1]);
  }

  function accountsHtml(s){
    const list = s.accounts || [];
    if (!list.length) return `<div class="mail-empty-small">${t("mailNoAccounts")}</div>`;
    return list.map((a) => `
      <button class="mail-account-card ${s.activeEmail === a.email ? "is-active" : ""}" data-email="${esc(a.email)}">
        <div class="mail-account-top"><b>${esc(a.email)}</b><span class="mail-status ${cls(a.status)}">${stText(a)}</span></div>
        <div class="mail-account-meta">${esc(a.label || a.provider || t("mailProviderFallback"))} · ${esc(a.message || "")}</div>
      </button>
    `).join("");
  }

  function syncSummary(a){
    if (!a || !a.connected) return "";
    const synced = Number(a.syncedCount || (a.messages || []).length || 0);
    const total = Number(a.total || synced || 0);
    return window.I18n.format("mailSyncedSummary", { synced, total });
  }

  function listHtml(a, messages){
    if (!a) return `<div class="mail-empty">${t("mailConnectFirst")}</div>`;
    if (a.status === "connecting") return `<div class="mail-empty">${t("mailConnecting")}</div>`;
    if (a.status === "failed") return `<div class="mail-error-box"><b>${t("mailConnectFailed")}</b><p>${esc(a.message || t("mailConnectFailedText"))}</p></div>`;
    if (!a.connected) return `<div class="mail-empty">${t("mailNotConnected")}</div>`;
    const msgs = messages || [];
    if (!msgs.length) return `<div class="mail-empty">${t("mailNoMessages")}</div>`;
    return `
      <div class="mail-summary">
        <span>${t("mailAccount")}：${esc(a.email)}</span>
        <span>${t("mailTotal")}：${esc(msgs.length)}</span>
        <span>${t("mailUnread")}：${esc(a.unseen || 0)}</span>
        <span>${t("mailUpdated")}：${esc(date(a.lastReadAt))}</span>
      </div>
      <div class="mail-message-list">
        ${msgs.map((m, i) => `
          <button class="mail-message-item ${selectedIndex === i ? "is-active" : ""}" data-index="${i}">
            <b>${esc(mTitle(m))}</b>
            <span>${esc(mFrom(m))}</span>
            <small>${esc(date(mDate(m)))}</small>
            ${hasFullBody(m) ? "" : `<small>${t("mailBodyPreviewOnly")}</small>`}
          </button>
        `).join("")}
      </div>
    `;
  }

  function readerHtml(a, messages){
    if (!a || !a.connected) return `<div class="mail-reader-empty">${t("mailReaderEmpty")}</div>`;
    const msgs = messages || [];
    const m = msgs[selectedIndex] || msgs[0];
    if (!m) return `<div class="mail-reader-empty">${t("mailNoBody")}</div>`;
    const imageKey = mailImageKey(a, m);
    const replyKey = mailReplyKey(a, m);
    const allowImages = visibleImageKeys.has(imageKey);
    const rawHtml = mHtml(a, m);
    const safeHtml = sanitizeMailHtml(rawHtml, { allowImages });
    const rawBody = mBody(m);
    const body = cleanMailBodyForPreview(rawBody);
    const showHtml = !!safeHtml.html;
    const fallbackText = rawHtml && /不支持\s*html|不支持\s*HTML|does not support html|doesn.t support html|not support html/i.test(body.cleaned)
      ? ""
      : body.cleaned;
    const displayBody = fallbackText || (rawHtml ? t("mailEmptyOrRemoteImages") : (rawBody ? t("mailBodyMostlyLinks") : t("mailEmptyOrRemoteImages")));
    const draftActive = replyDraftState.key === replyKey ? replyDraftState : { key:replyKey, loading:false, error:"", subject:"", body:"" };
    const taskActive = taskExtractState.key === replyKey ? taskExtractState : { key:replyKey, loading:false, error:"", body:"" };
    const translationActive = translationState.key === replyKey ? translationState : { key:replyKey, loading:false, error:"", body:"", view:"original", targetLabel:"", targetEnglish:"" };
    const summaryActive = summaryState.key === replyKey ? summaryState : { key:replyKey, loading:false, error:"", body:"" };
    const copyDraftLabel = copyButtonLabel(replyKey, "draft", "mailCopyDraft");
    const copyTasksLabel = copyButtonLabel(replyKey, "tasks", "mailCopyTasks");
    const copyTranslationLabel = copyButtonLabel(replyKey, "translation", "mailCopyTranslation");
    const copySummaryLabel = copyButtonLabel(replyKey, "summary", "mailCopySummary");
    const replyOpenNotice = replyOpenNoticeState.key === replyKey ? replyOpenNoticeState.message : "";
    const summaryCollapsed = isAiCardCollapsed("summary");
    const replyCollapsed = isAiCardCollapsed("reply");
    const tasksCollapsed = isAiCardCollapsed("tasks");
    const translationCollapsed = isAiCardCollapsed("translation");
    const showTranslation = !!translationActive.body && translationActive.view === "translation" && !translationCollapsed;
    const translationOpen = translationMenuKey === replyKey;
    const translatingLabel = translationActive.targetLabel ? window.I18n.format("mailTranslatingTo", { language:translationActive.targetLabel }) : t("mailTranslating");
    const translationTitle = translationActive.targetLabel ? window.I18n.format("mailTranslationTitleWithLanguage", { language:translationActive.targetLabel }) : t("mailTranslationTitle");
    return `
      <div class="mail-reader-head">
        <h3>${esc(mTitle(m))}</h3>
        <p>${esc(mFrom(m))}</p>
        <small>${esc(date(mDate(m)))}</small>
      </div>
      <div class="mail-reply-actions">
        <button type="button" class="mail-ai-action-btn" data-generate-reply-draft="${esc(replyKey)}" ${draftActive.loading ? "disabled" : ""}>${draftActive.loading ? t("mailReplyGenerating") : t("mailGenerateReplyDraft")}</button>
        <button type="button" class="mail-ai-action-btn" data-extract-mail-tasks="${esc(replyKey)}" ${taskActive.loading ? "disabled" : ""}>${taskActive.loading ? t("mailTaskExtracting") : t("mailExtractTasks")}</button>
        <button type="button" class="mail-ai-action-btn" data-summarize-mail="${esc(replyKey)}" ${summaryActive.loading ? "disabled" : ""}>${summaryActive.loading ? t("mailSummarizing") : t("mailSummarizeEmail")}</button>
        <button type="button" class="mail-ai-action-btn is-muted" data-clear-ai-results="${esc(replyKey)}">${t("mailClearAiResults")}</button>
        <div class="mail-translate-menu-wrap">
          <button type="button" class="mail-ai-action-btn" data-translate-menu="${esc(replyKey)}" ${translationActive.loading ? "disabled" : ""}>${translationActive.loading ? esc(translatingLabel) : t("mailTranslateEmail") + " ▾"}</button>
          ${translationOpen ? `<div class="mail-translate-menu">
            ${TRANSLATION_LANGUAGES.map((lang) => `<button type="button" data-translate-mail="${esc(replyKey)}" data-lang-code="${esc(lang.code)}">${esc(lang.label)}</button>`).join("")}
          </div>` : ""}
        </div>
      </div>
      ${summaryActive.error ? `<div class="mail-error-box mail-reply-error">${esc(summaryActive.error)}</div>` : ""}
      ${summaryActive.body ? `
        <div class="mail-summary-result">
          <div class="mail-ai-card-header">
            <b class="mail-ai-card-title">${t("mailSummaryTitle")}</b>
            <div class="mail-ai-card-actions">
              ${summaryCollapsed ? "" : `<button type="button" class="mail-ai-action-btn is-soft" data-copy-mail-summary="${esc(replyKey)}">${esc(copySummaryLabel)}</button>`}
              ${aiCollapseButton("summary")}
            </div>
          </div>
          ${summaryCollapsed ? "" : `<pre>${esc(summaryActive.body)}</pre>`}
        </div>
      ` : ""}
      ${translationActive.error ? `<div class="mail-error-box mail-reply-error">${esc(translationActive.error)}</div>` : ""}
      ${translationActive.body ? `
        <div class="mail-translation-result">
          <div class="mail-ai-card-header">
            <b class="mail-ai-card-title">${esc(translationTitle)}</b>
            <div class="mail-ai-card-actions">
              ${translationCollapsed ? "" : `
                <button type="button" class="mail-ai-action-btn is-soft" data-toggle-mail-translation="${esc(replyKey)}">${translationActive.view === "translation" ? t("mailViewOriginal") : t("mailViewTranslation")}</button>
                <button type="button" class="mail-ai-action-btn is-soft" data-copy-mail-translation="${esc(replyKey)}">${esc(copyTranslationLabel)}</button>
              `}
              ${aiCollapseButton("translation")}
            </div>
          </div>
        </div>
      ` : ""}
      ${draftActive.error ? `<div class="mail-error-box mail-reply-error">${esc(draftActive.error)}</div>` : ""}
      ${draftActive.subject || draftActive.body ? `
        <div class="mail-reply-draft">
          <div class="mail-ai-card-header">
            <b class="mail-ai-card-title">${t("mailReplyDraftTitle")}</b>
            <div class="mail-ai-card-actions">
              ${replyCollapsed ? "" : `
                <button type="button" class="mail-ai-action-btn is-soft" data-open-mail-reply="${esc(replyKey)}">${t("mailOpenReply")}</button>
                <button type="button" class="mail-ai-action-btn is-soft" data-copy-reply-draft="${esc(replyKey)}">${esc(copyDraftLabel)}</button>
              `}
              ${aiCollapseButton("reply")}
            </div>
          </div>
          ${replyCollapsed ? "" : `
            ${replyOpenNotice ? `<div class="mail-reader-hint">${esc(replyOpenNotice)}</div>` : ""}
            <label>${t("mailReplySubject")}</label>
            <input class="mail-reply-subject-input" data-reply-subject-input="${esc(replyKey)}" value="${esc(draftActive.subject)}">
            <label>${t("mailReplyBody")}</label>
            <textarea class="mail-reply-body-input" data-reply-body-input="${esc(replyKey)}">${esc(draftActive.body)}</textarea>
          `}
        </div>
      ` : ""}
      ${taskActive.error ? `<div class="mail-error-box mail-reply-error">${esc(taskActive.error)}</div>` : ""}
      ${taskActive.body ? `
        <div class="mail-task-suggestions">
          <div class="mail-ai-card-header">
            <b class="mail-ai-card-title">${t("mailTaskSuggestionsTitle")}</b>
            <div class="mail-ai-card-actions">
              ${tasksCollapsed ? "" : `<button type="button" class="mail-ai-action-btn is-soft" data-copy-mail-tasks="${esc(replyKey)}">${esc(copyTasksLabel)}</button>`}
              ${aiCollapseButton("tasks")}
            </div>
          </div>
          ${tasksCollapsed ? "" : `<pre>${esc(taskActive.body)}</pre>`}
        </div>
      ` : ""}
      ${hasFullBody(m) ? "" : `<div class="mail-reader-hint">${t("mailBodyPreviewOnly")}</div>`}
      ${body.hidden ? `<div class="mail-reader-hint">${window.I18n.format("mailLinksHidden", { count:body.hidden })}</div>` : ""}
      ${safeHtml.hiddenImages ? `<div class="mail-image-hint"><span>${window.I18n.format("mailRemoteImagesHiddenCount", { count:safeHtml.hiddenImages })}</span><button type="button" data-show-mail-images="${esc(imageKey)}">${t("mailShowImages")}</button></div>` : ""}
      ${showTranslation ? `<pre class="mail-reader-body mail-translation-body">${esc(translationActive.body)}</pre>` : (showHtml ? `<div class="mail-reader-html">${safeHtml.html}</div>` : `<pre class="mail-reader-body">${esc(displayBody)}</pre>`)}
      ${rawBody ? `<details class="mail-raw-body"><summary>${t("mailShowRawBody")}</summary><pre>${esc(rawBody)}</pre></details>` : ""}
    `;
  }

  function workspaceTabs(){
    return [
      ["inbox", "mailWorkspaceInbox", "mailWorkspaceInboxEmpty"],
      ["important", "mailWorkspaceImportant", "mailWorkspaceImportantEmpty"],
      ["drafts", "mailWorkspaceDrafts", "mailWorkspaceDraftsEmpty"],
      ["tasks", "mailWorkspaceTasks", "mailWorkspaceTasksEmpty"],
      ["memory", "mailWorkspaceMemory", "mailWorkspaceMemoryEmpty"],
      ["waiting", "mailWorkspaceWaiting", "mailWorkspaceWaitingEmpty"]
    ];
  }

  function workspaceBody(account){
    const tab = workspaceTabs().find((x) => x[0] === activeWorkspaceTab) || workspaceTabs()[0];
    const count = messagesForTab(account, activeWorkspaceTab).length;
    return `
      <div class="mail-workspace-state">
        <b>${t(tab[1])} · ${window.I18n.format("mailTabCount", { count })}</b>
        <p>${count ? t(tab[2]) : emptyTextForTab(activeWorkspaceTab)}</p>
      </div>`;
  }

  function workspaceHtml(account){
    return `
      <h2>${t("mailWorkspaceTitle")}</h2>
      <p>${t("mailWorkspaceDesc")}</p>
      <div class="mail-workspace-grid">
        ${workspaceTabs().map((tab) => `
          <button class="mail-workspace-tab ${activeWorkspaceTab === tab[0] ? "is-active" : ""}" data-workspace-tab="${tab[0]}" type="button">${t(tab[1])}<span>${messagesForTab(account, tab[0]).length}</span></button>
        `).join("")}
      </div>
      <div id="mailWorkspaceBody">${workspaceBody(account)}</div>`;
  }

  function mount(host){
    const s = window.MailApi.state();
    const active = window.MailApi.activeAccount();
    const filtered = messagesForTab(active, activeWorkspaceTab);
    const dispatchPayload = pendingDispatch();
    if (selectedIndex >= filtered.length) selectedIndex = 0;

    host.innerHTML = `
      <section class="mail-v204-page">
        <div class="mail-left">
          ${dispatchNoticeHtml(dispatchPayload)}
          <div class="mail-card" id="mailWorkspace">
            ${workspaceHtml(active)}
          </div>

          <div class="mail-card">
            <h2>${t("mailConnectTitle")}</h2>
            <p class="mail-muted">${t("mailConnectDesc")}</p>
            <input class="mail-input" id="mailEmail" placeholder="${t("mailEmailPlaceholder")}">
            <input class="mail-input" id="mailPassword" type="password" placeholder="${t("mailPasswordPlaceholder")}">
            <div class="mail-secret-options">
              <label><input type="radio" name="mailSecretMode" value="save" checked> <span>${t("mailSaveAuthorizationCode")}</span></label>
              <label><input type="radio" name="mailSecretMode" value="once"> <span>${t("mailUseOnce")}</span></label>
              <p>${t("mailSecureStorageHelp")}</p>
              <p class="mail-secure-warning is-hidden" id="mailSecureWarning">${t("mailSecureUnavailable")}</p>
            </div>
            <button class="mail-link" id="mailAdvancedToggle">${t("mailAdvanced")}</button>
            <div class="mail-advanced is-collapsed" id="mailAdvanced">
              <input class="mail-input" id="mailHost" placeholder="${t("mailHostPlaceholder")}">
              <input class="mail-input" id="mailPort" placeholder="${t("mailPortPlaceholder")}">
            </div>
            <div class="mail-button-row">
              <button class="mail-primary" id="mailConnectBtn">${t("mailConnectButton")}</button>
              <button class="mail-gray" id="mailHealthBtn">${t("mailHealthButton")}</button>
            </div>
            <div class="mail-connect-status" id="mailStatus">${t("mailWaiting")}</div>
          </div>

          <div class="mail-card">
            <h2>${t("mailAccountsTitle")}</h2>
            <div id="mailAccounts">${accountsHtml(s)}</div>
          </div>
        </div>

        <div class="mail-main">
          <div class="mail-main-head">
            <div><h2>${activeTabLabel()}</h2><p>${active ? `${esc(active.email)} · ${syncSummary(active)}` : t("mailConnectFirst")}</p></div>
            <div class="mail-main-actions">
              <button class="mail-gray" id="mailSyncMoreBtn" ${active && active.connected ? "" : "disabled"}>${t("mailSyncMore")}</button>
              <button class="mail-danger" id="mailRemoveBtn">${t("mailRemove")}</button>
            </div>
          </div>
          <div id="mailList">${(!active || active.status === "connecting" || active.status === "failed" || !active.connected) ? listHtml(active, filtered) : (filtered.length ? listHtml(active, filtered) : `<div class="mail-empty">${emptyTextForTab(activeWorkspaceTab)}</div>`)}</div>
        </div>

        <div class="mail-reader">${readerHtml(active, filtered)}</div>
      </section>
    `;

    function rerender(){ window.MailPage.mount(host); }
    const mailDispatchConfirm = host.querySelector("#mailDispatchConfirm");
    if (mailDispatchConfirm && dispatchPayload) mailDispatchConfirm.addEventListener("click", () => { confirmDispatch(dispatchPayload); rerender(); });
    const mailDispatchCancel = host.querySelector("#mailDispatchCancel");
    if (mailDispatchCancel && dispatchPayload) mailDispatchCancel.addEventListener("click", () => { cancelDispatch(dispatchPayload); rerender(); });
    function setStatus(text, c){
      const el = host.querySelector("#mailStatus");
      el.textContent = text;
      el.className = "mail-connect-status " + (c || "");
    }
    function input(){
      const email = host.querySelector("#mailEmail").value;
      const d = window.MailApi.providerFor(email);
      return {
        email,
        password:host.querySelector("#mailPassword").value,
        saveAuthorizationCode:(host.querySelector("input[name='mailSecretMode']:checked") || {}).value !== "once",
        host:host.querySelector("#mailHost").value || d.host,
        port:host.querySelector("#mailPort").value || d.port || 993
      };
    }

    window.MailApi.secureStatus().then((secure) => {
      const warning = host.querySelector("#mailSecureWarning");
      const save = host.querySelector("input[name='mailSecretMode'][value='save']");
      const once = host.querySelector("input[name='mailSecretMode'][value='once']");
      if (warning && (!secure || !secure.available)) warning.classList.remove("is-hidden");
      if (save && once && (!secure || !secure.available)) {
        save.disabled = true;
        save.checked = false;
        once.checked = true;
      }
    }).catch(() => {});

    host.querySelector("#mailAdvancedToggle").addEventListener("click", () => host.querySelector("#mailAdvanced").classList.toggle("is-collapsed"));

    Array.from(host.querySelectorAll("[data-workspace-tab]")).forEach((btn) => {
      btn.addEventListener("click", () => {
        activeWorkspaceTab = btn.getAttribute("data-workspace-tab") || "inbox";
        Array.from(host.querySelectorAll("[data-workspace-tab]")).forEach((item) => {
          item.classList.toggle("is-active", item.getAttribute("data-workspace-tab") === activeWorkspaceTab);
        });
        selectedIndex = 0;
        resetReplyDraft();
        rerender();
      });
    });

    host.querySelector("#mailHealthBtn").addEventListener("click", async () => {
      setStatus(t("mailCheckingBackend"), "mail-pending");
      const h = await window.MailApi.health();
      setStatus(h.message, h.ok ? "mail-ok" : "mail-bad");
    });

    host.querySelector("#mailConnectBtn").addEventListener("click", async () => {
      const btn = host.querySelector("#mailConnectBtn");
      btn.disabled = true;
      btn.textContent = t("mailConnectingButton");
      setStatus(t("mailConnecting"), "mail-pending");
      const res = await window.MailApi.connect(input());
      host.querySelector("#mailPassword").value = "";
      const statusText = res.secureUnavailable ? t("mailSecureUnavailable") : (res.message || (res.ok ? t("mailConnectSuccess") : t("mailConnectFailedText")));
      setStatus(statusText, res.ok ? "mail-ok" : "mail-bad");
      btn.disabled = false;
      btn.textContent = t("mailConnectButton");
      setTimeout(rerender, res.ok ? 450 : 900);
    });

    host.querySelector("#mailSyncMoreBtn").addEventListener("click", async () => {
      const a = window.MailApi.activeAccount();
      if (!a || !a.connected) return;
      const btn = host.querySelector("#mailSyncMoreBtn");
      const nextLimit = Math.min(Number(a.syncLimit || a.syncedCount || 200) + 200, 1000);
      btn.disabled = true;
      btn.textContent = t("mailSyncingMore");
      const res = await window.MailApi.syncMore(nextLimit);
      setStatus(res.message || (res.ok ? window.I18n.format("mailSyncMoreDone", { count:res.syncedCount || 0 }) : t("mailConnectFailedText")), res.ok ? "mail-ok" : "mail-bad");
      rerender();
    });

    Array.from(host.querySelectorAll(".mail-account-card")).forEach((btn) => {
      btn.addEventListener("click", () => {
        const email = btn.getAttribute("data-email");
        const s = window.MailApi.state();
        window.MailApi.saveState(Object.assign(s, { activeEmail:email }));
        selectedIndex = 0;
        resetReplyDraft();
        rerender();
      });
    });

    Array.from(host.querySelectorAll(".mail-message-item")).forEach((btn) => {
      btn.addEventListener("click", async () => {
        selectedIndex = Number(btn.getAttribute("data-index") || 0);
        resetReplyDraft();
        let account = window.MailApi.activeAccount();
        let current = messagesForTab(account, activeWorkspaceTab)[selectedIndex];
        host.querySelector(".mail-reader").innerHTML = readerHtml(account, messagesForTab(account, activeWorkspaceTab));
        Array.from(host.querySelectorAll(".mail-message-item")).forEach((item) => item.classList.toggle("is-active", item === btn));

        if (current && current.uid && !hasFullBody(current)) {
          host.querySelector(".mail-reader").insertAdjacentHTML("afterbegin", `<div class="mail-connect-status mail-pending">${t("mailBodyLoading")}</div>`);
          const res = await window.MailApi.loadBody(current.uid);
          account = window.MailApi.activeAccount();
          const filtered = messagesForTab(account, activeWorkspaceTab);
          if (!res.ok) {
            host.querySelector(".mail-reader").innerHTML = `<div class="mail-error-box"><b>${t("mailBodyLoadFailed")}</b><p>${esc(res.message || "")}</p></div>` + readerHtml(account, filtered);
            return;
          }
          host.querySelector(".mail-reader").innerHTML = readerHtml(account, filtered);
        }
      });
    });

    const reader = host.querySelector(".mail-reader");
    if (reader) reader.addEventListener("input", (ev) => {
      const subjectInput = ev.target && ev.target.matches && ev.target.matches("[data-reply-subject-input]") ? ev.target : null;
      if (subjectInput && replyDraftState.key === (subjectInput.getAttribute("data-reply-subject-input") || "")) {
        replyDraftState = Object.assign({}, replyDraftState, { subject:subjectInput.value });
        return;
      }
      const bodyInput = ev.target && ev.target.matches && ev.target.matches("[data-reply-body-input]") ? ev.target : null;
      if (bodyInput && replyDraftState.key === (bodyInput.getAttribute("data-reply-body-input") || "")) {
        replyDraftState = Object.assign({}, replyDraftState, { body:bodyInput.value });
      }
    });
    if (reader) reader.addEventListener("click", (ev) => {
      const toggleCard = ev.target && ev.target.closest ? ev.target.closest("[data-toggle-ai-card]") : null;
      if (toggleCard) {
        ev.preventDefault();
        const type = toggleCard.getAttribute("data-toggle-ai-card") || "";
        if (/^(summary|reply|tasks|translation)$/.test(type)) {
          toggleAiCard(type);
          const account = window.MailApi.activeAccount();
          reader.innerHTML = readerHtml(account, messagesForTab(account, activeWorkspaceTab));
        }
        return;
      }
      const clearAi = ev.target && ev.target.closest ? ev.target.closest("[data-clear-ai-results]") : null;
      if (clearAi) {
        ev.preventDefault();
        clearAiResults();
        const account = window.MailApi.activeAccount();
        reader.innerHTML = readerHtml(account, messagesForTab(account, activeWorkspaceTab));
        return;
      }
      const generateReply = ev.target && ev.target.closest ? ev.target.closest("[data-generate-reply-draft]") : null;
      if (generateReply) {
        const meta = createMailPerf("mail.draftReply");
        const clickStartedAt = perfStart(meta, "renderer.action.start");
        ev.preventDefault();
        const account = window.MailApi.activeAccount();
        const filtered = messagesForTab(account, activeWorkspaceTab);
        const message = filtered[selectedIndex] || filtered[0];
        if (!account || !message) return;
        expandAiCard("reply");
        replyDraftState = { key:mailReplyKey(account, message), loading:true, error:"", subject:"", body:"" };
        reader.innerHTML = readerHtml(account, filtered);
        perfEnd(meta, "renderer.action.done", clickStartedAt, { hasImages:mailHasImages(account, message) });
        generateReplyDraft(account, message, meta).then(() => {
          const renderStartedAt = perfStart(meta, "renderer.ui.commit.start");
          const nextAccount = window.MailApi.activeAccount();
          reader.innerHTML = readerHtml(nextAccount, messagesForTab(nextAccount, activeWorkspaceTab));
          perfEnd(meta, "renderer.ui.commit.done", renderStartedAt);
        });
        return;
      }
      const openReply = ev.target && ev.target.closest ? ev.target.closest("[data-open-mail-reply]") : null;
      if (openReply) {
        ev.preventDefault();
        const account = window.MailApi.activeAccount();
        const filtered = messagesForTab(account, activeWorkspaceTab);
        const message = filtered[selectedIndex] || filtered[0];
        const draftKey = openReply.getAttribute("data-open-mail-reply") || "";
        const draft = currentDraftText(reader, draftKey);
        const to = extractEmailAddress(mFrom(message || {}));
        copyText(draft.text).then((copied) => {
          if (!to) {
            showReplyOpenNotice(reader, draftKey, copied ? t("mailOpenReplyManual") : t("mailOpenReplyFailed"));
            return;
          }
          const url = "mailto:" + encodeURIComponent(to) + "?subject=" + encodeURIComponent(draft.subject) + "&body=" + encodeURIComponent(draft.body);
          Promise.resolve(externalOpen(url)).then(() => {
            showReplyOpenNotice(reader, draftKey, t("mailOpenReplyOpened"));
          }).catch(() => {
            showReplyOpenNotice(reader, draftKey, copied ? t("mailOpenReplyManual") : t("mailOpenReplyFailed"));
          });
        });
        return;
      }
      const copyDraft = ev.target && ev.target.closest ? ev.target.closest("[data-copy-reply-draft]") : null;
      if (copyDraft) {
        ev.preventDefault();
        const draftKey = copyDraft.getAttribute("data-copy-reply-draft") || "";
        const draft = currentDraftText(reader, draftKey);
        copyText(draft.text).then((ok) => {
          const account = window.MailApi.activeAccount();
          const key = draftKey;
          copyFeedbackState = { key, type:"draft", status:ok ? "ok" : "failed" };
          reader.innerHTML = readerHtml(account, messagesForTab(account, activeWorkspaceTab));
          if (copyFeedbackTimer) clearTimeout(copyFeedbackTimer);
          copyFeedbackTimer = setTimeout(() => {
            if (copyFeedbackState.key === key && copyFeedbackState.type === "draft") {
              copyFeedbackState = { key:"", type:"", status:"" };
              const nextAccount = window.MailApi.activeAccount();
              reader.innerHTML = readerHtml(nextAccount, messagesForTab(nextAccount, activeWorkspaceTab));
            }
          }, 2000);
        });
        return;
      }
      const extractTasks = ev.target && ev.target.closest ? ev.target.closest("[data-extract-mail-tasks]") : null;
      if (extractTasks) {
        const meta = createMailPerf("mail.extractTodos");
        const clickStartedAt = perfStart(meta, "renderer.action.start");
        ev.preventDefault();
        const account = window.MailApi.activeAccount();
        const filtered = messagesForTab(account, activeWorkspaceTab);
        const message = filtered[selectedIndex] || filtered[0];
        if (!account || !message) return;
        expandAiCard("tasks");
        taskExtractState = { key:mailReplyKey(account, message), loading:true, error:"", body:"" };
        reader.innerHTML = readerHtml(account, filtered);
        perfEnd(meta, "renderer.action.done", clickStartedAt, { hasImages:mailHasImages(account, message) });
        extractMailTasks(account, message, meta).then(() => {
          const renderStartedAt = perfStart(meta, "renderer.ui.commit.start");
          const nextAccount = window.MailApi.activeAccount();
          reader.innerHTML = readerHtml(nextAccount, messagesForTab(nextAccount, activeWorkspaceTab));
          perfEnd(meta, "renderer.ui.commit.done", renderStartedAt);
        });
        return;
      }
      const summarizeMailBtn = ev.target && ev.target.closest ? ev.target.closest("[data-summarize-mail]") : null;
      if (summarizeMailBtn) {
        const meta = createMailPerf("mail.summarize");
        const clickStartedAt = perfStart(meta, "renderer.action.start");
        ev.preventDefault();
        const account = window.MailApi.activeAccount();
        const filtered = messagesForTab(account, activeWorkspaceTab);
        const message = filtered[selectedIndex] || filtered[0];
        if (!account || !message) return;
        expandAiCard("summary");
        summaryState = { key:mailReplyKey(account, message), loading:true, error:"", body:"" };
        reader.innerHTML = readerHtml(account, filtered);
        perfEnd(meta, "renderer.action.done", clickStartedAt, { hasImages:mailHasImages(account, message) });
        summarizeMail(account, message, meta).then(() => {
          const renderStartedAt = perfStart(meta, "renderer.ui.commit.start");
          const nextAccount = window.MailApi.activeAccount();
          reader.innerHTML = readerHtml(nextAccount, messagesForTab(nextAccount, activeWorkspaceTab));
          perfEnd(meta, "renderer.ui.commit.done", renderStartedAt);
        });
        return;
      }
      const translateMenu = ev.target && ev.target.closest ? ev.target.closest("[data-translate-menu]") : null;
      if (translateMenu) {
        ev.preventDefault();
        const key = translateMenu.getAttribute("data-translate-menu") || "";
        translationMenuKey = translationMenuKey === key ? "" : key;
        const account = window.MailApi.activeAccount();
        reader.innerHTML = readerHtml(account, messagesForTab(account, activeWorkspaceTab));
        return;
      }
      const translateMailBtn = ev.target && ev.target.closest ? ev.target.closest("[data-translate-mail]") : null;
      if (translateMailBtn) {
        const meta = createMailPerf("mail.translate");
        const clickStartedAt = perfStart(meta, "renderer.action.start");
        ev.preventDefault();
        const account = window.MailApi.activeAccount();
        const filtered = messagesForTab(account, activeWorkspaceTab);
        const message = filtered[selectedIndex] || filtered[0];
        if (!account || !message) return;
        const code = translateMailBtn.getAttribute("data-lang-code") || "zh";
        const targetLanguage = TRANSLATION_LANGUAGES.find((x) => x.code === code) || TRANSLATION_LANGUAGES[0];
        expandAiCard("translation");
        translationState = { key:mailReplyKey(account, message), loading:true, error:"", body:"", view:"original", targetLabel:targetLanguage.label, targetEnglish:targetLanguage.english };
        translationMenuKey = "";
        reader.innerHTML = readerHtml(account, filtered);
        perfEnd(meta, "renderer.action.done", clickStartedAt, { hasImages:mailHasImages(account, message) });
        translateMail(account, message, targetLanguage, meta).then(() => {
          const renderStartedAt = perfStart(meta, "renderer.ui.commit.start");
          const nextAccount = window.MailApi.activeAccount();
          reader.innerHTML = readerHtml(nextAccount, messagesForTab(nextAccount, activeWorkspaceTab));
          perfEnd(meta, "renderer.ui.commit.done", renderStartedAt);
        });
        return;
      }
      const toggleTranslation = ev.target && ev.target.closest ? ev.target.closest("[data-toggle-mail-translation]") : null;
      if (toggleTranslation) {
        ev.preventDefault();
        if (translationState.key === (toggleTranslation.getAttribute("data-toggle-mail-translation") || "")) {
          translationState = Object.assign({}, translationState, { view:translationState.view === "translation" ? "original" : "translation" });
          const account = window.MailApi.activeAccount();
          reader.innerHTML = readerHtml(account, messagesForTab(account, activeWorkspaceTab));
        }
        return;
      }
      const copyTasks = ev.target && ev.target.closest ? ev.target.closest("[data-copy-mail-tasks]") : null;
      if (copyTasks) {
        ev.preventDefault();
        const text = taskExtractState.body || "";
        copyText(text).then((ok) => {
          const account = window.MailApi.activeAccount();
          const key = copyTasks.getAttribute("data-copy-mail-tasks") || "";
          copyFeedbackState = { key, type:"tasks", status:ok ? "ok" : "failed" };
          reader.innerHTML = readerHtml(account, messagesForTab(account, activeWorkspaceTab));
          if (copyFeedbackTimer) clearTimeout(copyFeedbackTimer);
          copyFeedbackTimer = setTimeout(() => {
            if (copyFeedbackState.key === key && copyFeedbackState.type === "tasks") {
              copyFeedbackState = { key:"", type:"", status:"" };
              const nextAccount = window.MailApi.activeAccount();
              reader.innerHTML = readerHtml(nextAccount, messagesForTab(nextAccount, activeWorkspaceTab));
            }
          }, 2000);
        });
        return;
      }
      const copyTranslation = ev.target && ev.target.closest ? ev.target.closest("[data-copy-mail-translation]") : null;
      if (copyTranslation) {
        ev.preventDefault();
        const text = translationState.body || "";
        copyText(text).then((ok) => {
          const account = window.MailApi.activeAccount();
          const key = copyTranslation.getAttribute("data-copy-mail-translation") || "";
          copyFeedbackState = { key, type:"translation", status:ok ? "ok" : "failed" };
          reader.innerHTML = readerHtml(account, messagesForTab(account, activeWorkspaceTab));
          if (copyFeedbackTimer) clearTimeout(copyFeedbackTimer);
          copyFeedbackTimer = setTimeout(() => {
            if (copyFeedbackState.key === key && copyFeedbackState.type === "translation") {
              copyFeedbackState = { key:"", type:"", status:"" };
              const nextAccount = window.MailApi.activeAccount();
              reader.innerHTML = readerHtml(nextAccount, messagesForTab(nextAccount, activeWorkspaceTab));
            }
          }, 2000);
        });
        return;
      }
      const copySummary = ev.target && ev.target.closest ? ev.target.closest("[data-copy-mail-summary]") : null;
      if (copySummary) {
        ev.preventDefault();
        const text = summaryState.body || "";
        copyText(text).then((ok) => {
          const account = window.MailApi.activeAccount();
          const key = copySummary.getAttribute("data-copy-mail-summary") || "";
          copyFeedbackState = { key, type:"summary", status:ok ? "ok" : "failed" };
          reader.innerHTML = readerHtml(account, messagesForTab(account, activeWorkspaceTab));
          if (copyFeedbackTimer) clearTimeout(copyFeedbackTimer);
          copyFeedbackTimer = setTimeout(() => {
            if (copyFeedbackState.key === key && copyFeedbackState.type === "summary") {
              copyFeedbackState = { key:"", type:"", status:"" };
              const nextAccount = window.MailApi.activeAccount();
              reader.innerHTML = readerHtml(nextAccount, messagesForTab(nextAccount, activeWorkspaceTab));
            }
          }, 2000);
        });
        return;
      }
      const showImages = ev.target && ev.target.closest ? ev.target.closest("[data-show-mail-images]") : null;
      if (showImages) {
        ev.preventDefault();
        const key = showImages.getAttribute("data-show-mail-images") || "";
        if (key) visibleImageKeys.add(key);
        const account = window.MailApi.activeAccount();
        reader.innerHTML = readerHtml(account, messagesForTab(account, activeWorkspaceTab));
        return;
      }
      const link = ev.target && ev.target.closest ? ev.target.closest(".mail-html-link") : null;
      if (link) {
        ev.preventDefault();
        const url = link.getAttribute("data-mail-url") || "";
        if (url && window.weishan && typeof window.weishan.openExternal === "function") window.weishan.openExternal(url);
      }
    });
    if (reader) reader.addEventListener("error", (ev) => {
      const target = ev.target;
      if (!target || !target.matches || !target.matches("img[data-mail-image='remote']")) return;
      const span = document.createElement("span");
      span.className = "mail-hidden-image mail-image-failed";
      span.textContent = t("mailImageFailed");
      target.replaceWith(span);
    }, true);

    host.querySelector("#mailRemoveBtn").addEventListener("click", async () => {
      const a = window.MailApi.activeAccount();
      if (!a) return;
      if (!confirm(t("mailRemoveConfirm"))) return;
      if (a.hasAuthorizationCode) await window.MailApi.deleteAuthorizationCode(a.email);
      window.MailApi.removeAccount(a.email);
      selectedIndex = 0;
      rerender();
    });
  }

  window.MailPage = { mount };
})();
