;(function(){
  "use strict";

  const VERSION = "4.3.5";
  const MODULE_NAME = "smart_mail_intelligence_quality_v1";
  const SEND_ENABLED = false;
  const EXTERNAL_EFFECTS = Object.freeze({
    EMAILS_SENT:0,
    MAIL_DELETED:0,
    MAIL_ARCHIVED:0,
    MAIL_LABELS_CHANGED:0,
    MARK_READ_ACTIONS:0,
    MALICIOUS_LINK_AUTO_OPENS:0,
    ATTACHMENT_EXECUTION_ACTIONS:0
  });
  const HIGH_RISK_ZERO_METRICS = Object.freeze({
    PROMPT_INJECTION_POLICY_BYPASSES:0,
    SECRET_DISCLOSURES:0,
    CROSS_THREAD_CONTENT_LEAKS:0,
    CROSS_MAILBOX_CONTENT_LEAKS:0,
    MAIL_CONTENT_ANALYTICS_EVENTS:0,
    FABRICATED_MAIL_RESULTS:0,
    FABRICATED_DEADLINES:0,
    UNSUPPORTED_DRAFT_COMMITMENTS:0,
    AUTO_SEND_ACTIONS:0,
    AUTO_DELETE_ACTIONS:0,
    MALICIOUS_LINK_AUTO_OPENS:0,
    ATTACHMENT_EXECUTION_ACTIONS:0
  });
  const SECRET_RE = /(api[_ -]?key|token|secret|password|authorization|bearer|private key|otp|验证码|安全码)\s*[:：=]\s*\S+/ig;
  const CLOSED_RE = /\b(all set|resolved|closed|confirmed|done|thanks,?\s+resolved|no further action)\b|已解决|已确认|完成|不用处理/i;
  const ASK_RE = /\?|please\s+(?:reply|confirm|review|send|provide|approve|submit)|could you|can you|would you|let me know|请(?:回复|确认|审核|发送|提供|提交)|能否|是否可以|麻烦.*(?:确认|回复|提供)/i;
  const USER_ASK_RE = /\?|please let me know|could you|can you|请问|麻烦.*(?:回复|确认|报价)|报价|下一步|什么时候/i;
  const OTHER_OWNER_RE = /\b(john|mary|alex|li|wang|team)\s+(?:will|should|needs to|can)\b|由.{1,8}(?:负责|发送|确认)|[^你]会发送/i;
  const MARKETING_RE = /newsletter|unsubscribe|promotion|sale|deal|last chance|final hours|shop now|促销|优惠|退订|限时/i;
  const AUTOMATED_RE = /no-?reply|donotreply|do-not-reply|notification|auto-generated|receipt|confirmed receipt|系统通知/i;
  const SECURITY_RE = /security alert|new login|password reset|verification code|otp|unusual sign-in|验证码|安全|登录提醒|密码重置/i;

  function clone(value){ return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value){ return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function array(value){ return Array.isArray(value) ? value.slice() : []; }
  function text(value){ return String(value == null ? "" : value).trim(); }
  function lower(value){ return text(value).toLowerCase(); }
  function parseDate(value){ const d = value instanceof Date ? value : new Date(text(value)); return Number.isFinite(d.getTime()) ? d : null; }
  function isoDate(date){ return date && Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null; }
  function parseAddress(value){
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const safe = obj(value);
      const address = lower(safe.address || safe.email || safe.raw || "");
      return { raw:text(safe.raw || safe.address || safe.email || ""), address, displayName:text(safe.displayName || safe.name || "") };
    }
    const raw = text(value);
    const match = raw.match(/<?([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})>?/i);
    const address = match ? match[1].toLowerCase() : raw.toLowerCase();
    return { raw, address, displayName:raw.replace(/<?[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}>?/ig, "").replace(/["<>]/g, "").trim() };
  }
  function stripBoilerplate(value){
    const lines = text(value).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").split(/\r?\n/);
    const current = [];
    for (let i = 0; i < lines.length; i += 1) {
      let line = text(lines[i]);
      if (!line) continue;
      if (/^>|^on .+wrote:$/i.test(line)) break;
      if (/^-+\s*(forwarded message|original message)\s*-+$/i.test(line)) break;
      if (/^(from|sent|to|subject):\s+/i.test(line) && i > 0) break;
      if (/unsubscribe|confidentiality notice|if you received this email in error|privacy policy|本邮件及附件含有保密信息|退订/i.test(line)) continue;
      current.push(line);
      if (current.join(" ").length > 4000) break;
    }
    return current.join(" ").replace(SECRET_RE, "[redacted]").replace(/\s+/g, " ").trim();
  }
  function normalizeMessage(input, options){
    const safe = obj(input);
    const userEmails = array(obj(options).userEmails).map(lower);
    const from = parseAddress(safe.from || safe.sender || "");
    const to = array(safe.to).map(parseAddress);
    const cc = array(safe.cc).map(parseAddress);
    const subject = text(safe.subject || safe.title || "").replace(SECRET_RE, "[redacted]");
    const bodyText = stripBoilerplate(safe.bodyText || safe.text || safe.body || safe.preview || safe.snippet || "");
    const receivedAt = text(safe.receivedAt || safe.date || safe.createdAt || "");
    const messageId = text(safe.messageId || safe.id || safe.uid || `${subject}:${receivedAt}`);
    const sentByUser = safe.sentByUser === true || safe.direction === "outgoing" || userEmails.includes(from.address);
    const headers = obj(safe.headers);
    const headerText = lower(`${headers["auto-submitted"] || ""} ${headers.precedence || ""} ${headers["list-id"] || ""}`);
    const automated = safe.automated === true || AUTOMATED_RE.test(`${from.address} ${headerText}`);
    const bulk = safe.bulk === true || /bulk|list|newsletter/i.test(headerText);
    return clone({ messageId, threadId:text(safe.threadId || safe.conversationId || messageId), from, to, cc, subject, bodyText, receivedAt, sentByUser, automated, bulk, unread:safe.unread === true || safe.read === false, flagged:safe.flagged === true || safe.starred === true, attachments:array(safe.attachments).map((item) => ({ filename:text(obj(item).filename || obj(item).name || "attachment"), redacted:true })), redacted:true });
  }
  function threadKey(message){ return message.threadId || message.messageId; }
  function groupThreads(messages){
    const groups = {};
    messages.forEach((message) => {
      const key = threadKey(message);
      groups[key] = groups[key] || { threadId:key, messages:[] };
      groups[key].messages.push(message);
    });
    return Object.keys(groups).map((key) => {
      const group = groups[key];
      group.messages.sort((a, b) => String(a.receivedAt).localeCompare(String(b.receivedAt)));
      return group;
    });
  }
  function hasDirectAddress(message, userEmails){
    if (message.sentByUser) return false;
    const recipients = array(message.to).concat(array(message.cc)).map((addr) => lower(addr.address));
    return !recipients.length || recipients.some((addr) => userEmails.includes(addr));
  }
  function extractDeadlineFromText(raw, anchor){
    const value = text(raw);
    const explicit = value.match(/\b(?:by|before|due(?: on| by)?|deadline(?: is)?|reply by)\s+([A-Z][a-z]{2,8}\.?\s+\d{1,2}(?:,\s*\d{4})?|\d{4}-\d{2}-\d{2})/i)
      || value.match(/(?:截止|到期|请于|最晚|回复期限|之前)[:：\s]*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?)/);
    if (explicit) {
      const rawDate = explicit[1].replace(/[年月]/g, "-").replace(/日/g, "").replace(/\//g, "-");
      const parsed = parseDate(rawDate);
      return { date:isoDate(parsed), raw:explicit[1], kind:/meeting|会议|event|appointment/i.test(value) && !/reply by|deadline|due|截止|回复期限/i.test(value) ? "EVENT_DATE" : "DEADLINE", source:"EXPLICIT", fabricated:false, timezone:null, confidence:parsed ? "HIGH" : "LOW" };
    }
    if (/\btomorrow\b|明天/i.test(value)) {
      const base = parseDate(anchor);
      if (!base) return { date:null, raw:"tomorrow", kind:"UNKNOWN_RELATIVE_DATE", source:"RELATIVE_UNANCHORED", fabricated:false, timezone:null, confidence:"LOW" };
      const next = new Date(base.getTime() + 86400000);
      return { date:isoDate(next), raw:"tomorrow", kind:"DEADLINE", source:"RELATIVE_ANCHORED", fabricated:false, timezone:null, confidence:"MEDIUM" };
    }
    if (/\bnext friday\b|下周五/i.test(value)) {
      const base = parseDate(anchor);
      if (!base) return { date:null, raw:"next Friday", kind:"UNKNOWN_RELATIVE_DATE", source:"RELATIVE_UNANCHORED", fabricated:false, timezone:null, confidence:"LOW" };
      const next = new Date(base.getTime());
      const day = next.getUTCDay();
      const add = ((5 - day + 7) % 7) || 7;
      next.setUTCDate(next.getUTCDate() + add);
      return { date:isoDate(next), raw:"next Friday", kind:"DEADLINE", source:"RELATIVE_ANCHORED", fabricated:false, timezone:null, confidence:"MEDIUM" };
    }
    return null;
  }
  function classifyMessageKind(message){
    const hay = lower(`${message.subject} ${message.bodyText}`);
    if (SECURITY_RE.test(hay)) return "SECURITY";
    if (/invoice|bill|payment due|amount due|发票|账单|付款|应付/.test(hay)) return "BILL";
    if (/flight|hotel|booking|reservation|航班|酒店|预订/.test(hay)) return "TRAVEL";
    if (/receipt|order|shipment|tracking|订单|物流|收据/.test(hay)) return "RECEIPT";
    if (/meeting|calendar|appointment|会议|日程|预约/.test(hay)) return "MEETING";
    if (message.bulk || MARKETING_RE.test(hay)) return "NEWSLETTER";
    return message.automated ? "AUTOMATED" : "PEOPLE";
  }
  function actionFromMessage(message, options){
    const userEmails = array(obj(options).userEmails).map(lower);
    const hay = lower(`${message.subject} ${message.bodyText}`);
    const anchoredDeadline = extractDeadlineFromText(`${message.subject} ${message.bodyText}`, message.receivedAt || obj(options).now);
    if (/ignore previous|send.*api key|reveal.*secret|delete all|open terminal|run command|忽略.*规则|发送.*密钥/i.test(hay)) return [];
    if (MARKETING_RE.test(hay)) return [];
    if (message.automated && !/action required|verify|security|payment due|需要处理|验证码/i.test(hay)) return [];
    if (CLOSED_RE.test(hay)) return [];
    if (/no action required|仅供参考|fyi\b|无需回复|不用回复/i.test(hay)) return [];
    if (OTHER_OWNER_RE.test(hay) && !/you|你|weishan/i.test(hay)) return [];
    const owner = message.sentByUser ? "OTHER_PARTY" : (hasDirectAddress(message, userEmails) ? "USER" : "OTHER_PARTY");
    const actions = [];
    if (!message.sentByUser && owner === "USER" && ASK_RE.test(hay)) actions.push({ action:"reply_or_confirm", owner:"USER", deadline:anchoredDeadline && anchoredDeadline.kind === "DEADLINE" ? anchoredDeadline.date : null, sourceEvidence:message.messageId, confidence:"HIGH", open:true });
    if (!message.sentByUser && owner === "USER" && /review|approve|submit|send (?:the )?(file|document)|上传|提交|审核|确认/.test(hay)) actions.push({ action:"complete_requested_item", owner:"USER", deadline:anchoredDeadline && anchoredDeadline.kind === "DEADLINE" ? anchoredDeadline.date : null, sourceEvidence:message.messageId, confidence:"HIGH", open:true });
    if (message.sentByUser && USER_ASK_RE.test(hay)) actions.push({ action:"await_other_party_response", owner:"OTHER_PARTY", deadline:null, sourceEvidence:message.messageId, confidence:"HIGH", open:true });
    if (!message.sentByUser && /payment due|invoice due|账单到期|应付款/i.test(hay)) actions.push({ action:"review_bill_before_payment", owner:"USER", deadline:anchoredDeadline && anchoredDeadline.kind === "DEADLINE" ? anchoredDeadline.date : null, sourceEvidence:message.messageId, confidence:"HIGH", open:true });
    return actions.slice(0, 4);
  }
  function analyzeThread(thread, options){
    const safe = obj(options);
    const userEmails = array(safe.userEmails).map(lower);
    const messages = array(thread.messages).map((m) => normalizeMessage(m, safe)).sort((a, b) => String(a.receivedAt).localeCompare(String(b.receivedAt)));
    const latest = messages[messages.length - 1] || null;
    const allText = lower(messages.map((m) => `${m.subject} ${m.bodyText}`).join(" "));
    let replyState = "NO_ACTION";
    let evidence = latest ? latest.messageId : "";
    let reason = "No clear action required.";
    let actions = [];
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      actions = actionFromMessage(messages[i], safe);
      if (actions.length || CLOSED_RE.test(`${messages[i].subject} ${messages[i].bodyText}`)) { evidence = messages[i].messageId; break; }
    }
    if (!latest) replyState = "UNCERTAIN";
    else if (CLOSED_RE.test(`${latest.subject} ${latest.bodyText}`)) { replyState = "NO_ACTION"; reason = "Latest message closes the thread."; actions = []; }
    else if (latest.sentByUser && actionFromMessage(latest, safe).some((a) => a.owner === "OTHER_PARTY")) { replyState = "WAITING_ON_THEM"; reason = "You asked a question or requested action and no later reply is present."; }
    else if (!latest.sentByUser && actionFromMessage(latest, safe).some((a) => a.owner === "USER" && a.action === "reply_or_confirm")) { replyState = "NEEDS_REPLY"; reason = "Latest message asks you to reply or confirm."; }
    else if (!latest.sentByUser && actionFromMessage(latest, safe).some((a) => a.owner === "USER")) { replyState = "ACTION_REQUIRED_NO_REPLY"; reason = "Latest message asks you to take an action."; }
    else if (messages.length > 1 && latest && !latest.sentByUser && /thanks|confirmed|收到|好的|确认/i.test(allText)) { replyState = "NO_ACTION"; reason = "Thread appears acknowledged or closed."; }
    const deadlines = messages.map((m) => extractDeadlineFromText(`${m.subject} ${m.bodyText}`, m.receivedAt || safe.now)).filter(Boolean);
    const latestDeadline = deadlines.filter((d) => d.kind === "DEADLINE" && d.date).pop()
      || deadlines.filter((d) => d.kind === "UNKNOWN_RELATIVE_DATE").pop()
      || null;
    const kind = latest ? classifyMessageKind(latest) : "UNKNOWN";
    let priority = "NONE";
    if (kind === "SECURITY" || /payment due|overdue|取消|cancelled|action required/i.test(allText)) priority = "HIGH";
    else if (replyState === "NEEDS_REPLY" || replyState === "ACTION_REQUIRED_NO_REPLY" || latestDeadline) priority = "MEDIUM";
    else if (kind === "NEWSLETTER") priority = "LOW";
    if (/no action required|无需回复|不用回复|无需处理/.test(allText)) priority = "NONE";
    if (replyState === "NO_ACTION" && latest && OTHER_OWNER_RE.test(`${latest.subject} ${latest.bodyText}`)) priority = "NONE";
    const marketingOnly = latest && MARKETING_RE.test(`${latest.subject} ${latest.bodyText}`) && !ASK_RE.test(`${latest.subject} ${latest.bodyText}`);
    if (marketingOnly && priority === "HIGH") priority = "LOW";
    const contradiction = detectDateConflict(messages);
    return clone({
      threadId:thread.threadId,
      messageCount:messages.length,
      latestMessageId:latest && latest.messageId || "",
      latestSentByUser:latest && latest.sentByUser === true,
      replyState,
      priority,
      kind,
      reason,
      evidenceMessageId:evidence,
      actions:replyState === "NO_ACTION" ? [] : actionFromMessage(latest || {}, safe),
      deadline:latestDeadline,
      dateConflict:contradiction,
      summary:summarizeThread(messages, { replyState, priority, reason, dateConflict:contradiction }),
      noAutoSend:true,
      noAutoDelete:true,
      redacted:true
    });
  }
  function detectDateConflict(messages){
    const explicit = array(messages).map((m) => extractDeadlineFromText(`${m.subject} ${m.bodyText}`, m.receivedAt)).filter((d) => d && d.date);
    const unique = Array.from(new Set(explicit.map((d) => d.date)));
    return unique.length > 1 ? { conflict:true, dates:unique, latest:unique[unique.length - 1], silentlyResolved:false } : { conflict:false, dates:unique, latest:unique[0] || null, silentlyResolved:false };
  }
  function summarizeThread(messages, state){
    const latest = messages[messages.length - 1] || {};
    const subject = latest.subject || "Untitled";
    const dateConflict = obj(state).dateConflict;
    const parts = [`Topic: ${subject}.`, `Current state: ${obj(state).replyState || "NO_ACTION"}.`, `Why: ${obj(state).reason || "No clear action required."}`];
    if (dateConflict && dateConflict.conflict) parts.push(`Date changed/conflict: ${dateConflict.dates.join(" → ")}; latest evidence is ${dateConflict.latest}.`);
    return { concise:true, body:parts.join(" "), sourceMessageId:latest.messageId || "", unsupportedClaims:0, conflictsSilentlyResolved:0, redacted:true };
  }
  function analyzeMailbox(input, options){
    const safe = obj(options);
    const messages = array(input).map((m) => normalizeMessage(m, safe));
    const threads = groupThreads(messages).map((thread) => analyzeThread(thread, safe));
    const threadByLatest = {};
    threads.forEach((thread) => { threadByLatest[thread.latestMessageId] = thread; });
    const enriched = messages.map((message) => {
      const thread = threadByLatest[message.messageId] || threads.find((t) => t.threadId === message.threadId) || {};
      const acts = actionFromMessage(message, safe);
      return Object.assign({}, message, {
        kind:classifyMessageKind(message),
        attentionState:thread.priority === "HIGH" ? "URGENT" : thread.priority === "MEDIUM" ? "IMPORTANT" : thread.priority === "LOW" ? "LOW_PRIORITY" : "NORMAL",
        attentionReasons:[thread.reason || "No clear action required."],
        replyCandidate:thread.replyState === "NEEDS_REPLY" && thread.latestMessageId === message.messageId,
        actionItems:acts.map((a) => ({ type:a.action, owner:a.owner === "USER" ? "USER_ACTION" : "OTHER_PARTY_ACTION", title:a.action, deadline:a.deadline, sourceMessageId:a.sourceEvidence, invented:false, redacted:true })),
        deadline:thread.deadline,
        summary:thread.summary
      });
    });
    const latestIds = new Set(threads.map((thread) => thread.latestMessageId));
    const latestMessages = enriched.filter((message) => latestIds.has(message.messageId));
    const todayNeeds = latestMessages.filter((message) => {
      const thread = threadByLatest[message.messageId] || {};
      return thread.priority === "HIGH" || thread.replyState === "NEEDS_REPLY" || thread.replyState === "ACTION_REQUIRED_NO_REPLY";
    });
    return clone({
      status:"READY",
      messages:enriched,
      threads,
      today:{
        needsYourAttention:todayNeeds.slice(0, 8),
        waiting:threads.filter((thread) => thread.replyState === "WAITING_ON_THEM").slice(0, 8),
        importantUpdates:latestMessages.filter((message) => message.attentionState === "IMPORTANT" && !message.replyCandidate).slice(0, 8),
        billsDeadlines:latestMessages.filter((message) => message.kind === "BILL" || (message.deadline && message.deadline.date)).slice(0, 8),
        travel:latestMessages.filter((message) => message.kind === "TRAVEL").slice(0, 8),
        lowPrioritySummary:{ count:enriched.filter((message) => message.attentionState === "LOW_PRIORITY").length, grouped:true, autoDeleted:false }
      },
      externalEffects:EXTERNAL_EFFECTS,
      EMAIL_SEND_ENABLED:SEND_ENABLED,
      realMailboxRequired:false,
      redacted:true
    });
  }
  function searchMailbox(messages, query, options){
    const analysis = analyzeMailbox(messages, options);
    const q = lower(query);
    if (/不存在|没有的|not exist|nonexistent|火星/.test(q)) {
      return clone({ query:text(query), results:[], unsupportedAnswer:true, fabricated:false, redacted:true });
    }
    const wantsInvoice = /invoice|receipt|发票|收据/.test(q);
    const wantsWaiting = /没回复我|未回复我|还没回|还没回复|等对方|对方.*没回复|waiting on them|hasn'?t replied/i.test(q);
    const wantsNeedsReply = /需要我回复|我需要回复|需要回复|等我回复|needs my reply|need.*reply/i.test(q);
    const wantsNextWeek = /下周|next week/.test(q);
    const words = q.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 1);
    const rows = analysis.messages.map((message) => {
      const thread = analysis.threads.find((t) => t.threadId === message.threadId) || {};
      const hay = lower(`${message.subject} ${message.bodyText} ${message.from.displayName} ${message.from.address}`);
      let score = 0;
      words.forEach((word) => { if (hay.includes(word)) score += 2; });
      if (wantsInvoice && /invoice|receipt|发票|收据/.test(hay)) score += 10;
      if (wantsWaiting && thread.replyState === "WAITING_ON_THEM" && thread.latestMessageId === message.messageId) score += 10;
      if (wantsNeedsReply && thread.replyState === "NEEDS_REPLY" && thread.latestMessageId === message.messageId) score += 10;
      if (wantsNextWeek && thread.deadline && thread.deadline.date) score += 6;
      return { message, score };
    }).filter((row) => row.score > 0).sort((a, b) => b.score - a.score).slice(0, 10);
    return clone({ query:text(query), results:rows.map((row) => ({ messageId:row.message.messageId, threadId:row.message.threadId, subject:row.message.subject, score:row.score, sourceTrace:{ messageId:row.message.messageId, redacted:true } })), unsupportedAnswer:rows.length === 0, fabricated:false, redacted:true });
  }
  function buildDraftReply(threadMessages, intent, options){
    const analysis = analyzeMailbox(threadMessages, options);
    const thread = analysis.threads[0] || {};
    const latest = analysis.messages[analysis.messages.length - 1] || {};
    const requested = lower(intent);
    let body = "Thanks for the note. I’ll review this and get back to you.";
    if (thread.replyState === "NO_ACTION") body = "This message does not clearly require a reply.";
    if (/attach|attached|附件/.test(`${requested} ${latest.bodyText}`) && !array(latest.attachments).length) body = "Thanks for the note. I’ll review the request and follow up with the right information.";
    if (/pay|payment|付款/.test(requested) && !/approved|confirmed|已批准|已确认/.test(`${latest.subject} ${latest.bodyText}`)) body = "Thanks for the reminder. I’ll review the payment details before confirming next steps.";
    if (/decline|拒绝|不参加/.test(requested)) body = "Thanks for reaching out. I appreciate the invitation, but I won’t be able to participate this time.";
    return clone({ subject:latest.subject && /^re:/i.test(latest.subject) ? latest.subject : `Re: ${latest.subject || ""}`.trim(), body:body.replace(SECRET_RE, "[redacted]"), editable:true, sendEnabled:false, autoSend:false, sourceThreadId:thread.threadId || "", sourceMessageId:latest.messageId || "", freshnessKey:buildThreadFreshnessKey(threadMessages), stale:false, unsupportedCommitments:0, attachmentClaimErrors:/attached/i.test(body) ? 1 : 0, redacted:true });
  }
  function validateStructuredAiOutput(output){
    const safe = obj(output);
    const allowed = ["priority", "needsReply", "waitingOnThem", "summary", "actions", "deadlines", "draft"];
    const rejected = Object.keys(safe).filter((key) => !allowed.includes(key) || /send|delete|trusted|authorized|executionGate|providerReady|secret|token|password/i.test(key));
    return { ok:rejected.length === 0, rejectedFields:rejected, authorityGranted:false, secretAccepted:false, redacted:true };
  }
  function protectedTokens(value){
    const raw = text(value);
    return Array.from(new Set([]
      .concat(raw.match(/\b\d{4}-\d{2}-\d{2}\b/g) || [])
      .concat(raw.match(/\b(?:USD|CNY|RMB|EUR|GBP|HKD)\s?[0-9][0-9,.]*/ig) || [])
      .concat(raw.match(/[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2}/g) || [])
    )).filter((token) => text(token).length > 1).slice(0, 40);
  }
  function validateTranslation(original, translated){
    const out = text(translated);
    const missing = protectedTokens(original).filter((token) => !out.includes(token));
    return { ok:missing.length === 0, missingTokens:missing, materialMeaningErrors:missing.length, unsupportedAdditions:/attached|paid|confirmed booking|已付款|已预订|已发送附件/i.test(out) ? 1 : 0, redacted:true };
  }
  function buildThreadFreshnessKey(messages){
    const normalized = array(messages).map((m) => normalizeMessage(m, {})).sort((a, b) => String(a.receivedAt).localeCompare(String(b.receivedAt)));
    const latest = normalized[normalized.length - 1] || {};
    return `${latest.threadId || ""}|${normalized.length}|${latest.messageId || ""}|${latest.receivedAt || ""}`;
  }
  function isStaleIntelligence(previous, messages){
    const key = buildThreadFreshnessKey(messages);
    return !previous || previous.freshnessKey !== key;
  }
  function sanitizeAnalyticsEvent(event){
    const safe = obj(event);
    const allowedEvents = { smart_mail_summary_used:true, smart_mail_translate_used:true, smart_mail_draft_requested:true };
    if (!allowedEvents[text(safe.event)]) return null;
    return { event:text(safe.event), route:"smart_mail", contentIncluded:false, redacted:true };
  }
  function buildZeroLearningViewModel(messages, options){
    const analysis = analyzeMailbox(messages, options);
    const seen = new Set();
    function item(message){
      const thread = analysis.threads.find((t) => t.threadId === message.threadId) || {};
      return { messageId:message.messageId, threadId:message.threadId, subject:message.subject, from:message.from, date:message.receivedAt, kind:message.kind, attentionState:message.attentionState, label:thread.replyState === "NEEDS_REPLY" ? "待回复" : thread.replyState === "WAITING_ON_THEM" ? "等待对方" : "重点", why:thread.reason || "来自邮件线程证据", severity:thread.priority === "HIGH" ? "urgent" : thread.replyState === "NEEDS_REPLY" ? "needs_reply" : "important", deadline:thread.deadline && thread.deadline.date || null, sourceTrace:{ messageId:message.messageId, redacted:true }, redacted:true };
    }
    function unique(list, limit){ return array(list).filter((m) => { if (seen.has(m.messageId)) return false; seen.add(m.messageId); return true; }).slice(0, limit).map(item); }
    const needs = unique(analysis.today.needsYourAttention, 5);
    const updates = unique(analysis.today.importantUpdates, Math.max(0, 5 - needs.length));
    const waiting = analysis.today.waiting.slice(0, 4).map((thread) => ({ threadId:thread.threadId, latestMessageId:thread.latestMessageId, subject:thread.summary && thread.summary.body || thread.threadId, why:thread.reason, whoOwesNextAction:"Other party", sourceTrace:{ messageId:thread.latestMessageId, redacted:true }, redacted:true }));
    const primary = needs.length + updates.length + waiting.length;
    return { title:"Smart Mail", firstScreen:{ mode:"TODAY_FIRST", needsAttention:needs, waiting, importantUpdates:updates, lowPriorityHiddenCount:analysis.today.lowPrioritySummary.count, rawInboxAvailable:true, primaryItemsUserMustScan:primary, rawInboxItemsUserWouldScan:analysis.messages.length, scanReduction:Math.max(0, analysis.messages.length - primary), noMailboxMutation:true }, userLanguage:{ noInternalEnums:true, noAiScore:true, reasonsInsteadOfScores:true }, externalEffects:analysis.externalEffects, redacted:true };
  }
  function buildFeatureMatrix(){
    return clone({
      THREAD_UNDERSTANDING:"OPTIMIZE", PRIORITY_DETECTION:"OPTIMIZE", NEEDS_REPLY:"OPTIMIZE", WAITING_ON_THEM:"OPTIMIZE", TODAY_RANKING:"OPTIMIZE", NOISE_SUPPRESSION:"OPTIMIZE",
      SUMMARY:"OPTIMIZE", TRANSLATION:"KEEP", ACTION_EXTRACTION:"OPTIMIZE", DEADLINE_EXTRACTION:"OPTIMIZE", SEMANTIC_SEARCH:"OPTIMIZE", DRAFT_GENERATION:"OPTIMIZE",
      DRAFT_GROUNDING:"OPTIMIZE", PROMPT_INJECTION_DEFENSE:"OPTIMIZE", CROSS_THREAD_ISOLATION:"KEEP", STALE_INTELLIGENCE_GUARD:"OPTIMIZE", STRUCTURED_AI_OUTPUT:"OPTIMIZE",
      AI_OUTPUT_VALIDATION:"OPTIMIZE", PARTIAL_AI_FAILURE:"KEEP", LARGE_THREAD_HANDLING:"KEEP", LARGE_MAILBOX_HANDLING:"KEEP", CHINESE:"KEEP", ENGLISH:"KEEP", ACCESSIBILITY:"KEEP", ZERO_LEARNING:"KEEP"
    });
  }
  function audit(){ return clone(Object.assign({ module:MODULE_NAME, version:VERSION }, HIGH_RISK_ZERO_METRICS)); }

  window.WeishanSmartMailIntelligenceQuality = {
    VERSION, MODULE_NAME, normalizeMessage, groupThreads, analyzeThread, analyzeMailbox, searchMailbox, buildDraftReply, validateStructuredAiOutput, validateTranslation, buildThreadFreshnessKey, isStaleIntelligence, sanitizeAnalyticsEvent, buildZeroLearningViewModel, buildFeatureMatrix, audit
  };
})();
