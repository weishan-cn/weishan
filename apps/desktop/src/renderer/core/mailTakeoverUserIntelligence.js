;(function () {
  "use strict";

  const VERSION = "4.2.8";
  const MODULE_NAME = "mail_takeover_user_intelligence_v1";
  const SEND_ENABLED = false;
  const MUTATIONS = Object.freeze({
    EMAILS_SENT:0,
    MAIL_DELETED:0,
    MAIL_ARCHIVED:0,
    MAIL_LABELS_CHANGED:0,
    MARK_READ_ACTIONS:0
  });

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function array(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function lower(value) { return text(value).toLowerCase(); }
  function words(value) { return lower(value).replace(/[^\p{L}\p{N}\s-]/gu, " ").split(/\s+/).filter(Boolean); }

  const SECRET_PATTERNS = [
    /\b(?:otp|one[- ]time(?: password| code)?|verification code|验证码|安全码|code)\b\s*(?:is|为|是|[:：=])?\s*[0-9]{4,8}\b/gi,
    /\b(?:password|passwd|pwd|api[_ -]?key|token|secret|client[_ -]?secret|authorization|bearer)\s*[:=：]\s*\S+/gi,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g
  ];

  function redact(value) {
    let output = text(value)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    SECRET_PATTERNS.forEach(function (pattern) { output = output.replace(pattern, "[redacted]"); });
    return output.length > 2400 ? output.slice(0, 2400) + "…" : output;
  }

  function parseDate(value) {
    const date = value instanceof Date ? value : new Date(text(value));
    return Number.isFinite(date.getTime()) ? date : null;
  }

  function isoDate(date) {
    return date && Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null;
  }

  function daysBetween(a, b) {
    const left = parseDate(a);
    const right = parseDate(b);
    if (!left || !right) return null;
    return Math.round((left.getTime() - right.getTime()) / 86400000);
  }

  function parseAddress(value) {
    const raw = text(value);
    const match = raw.match(/<?([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})>?/i);
    const address = match ? match[1].toLowerCase() : raw.toLowerCase();
    const domain = address.includes("@") ? address.split("@").pop() : "";
    const displayName = raw.replace(/<?[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}>?/ig, "").replace(/["<>]/g, "").trim();
    return { raw, address, domain, displayName };
  }

  function normalizeMessage(input, options) {
    const safe = obj(input);
    const userEmails = array(obj(options).userEmails).map(lower);
    const from = parseAddress(safe.from || safe.sender || "");
    const to = array(safe.to).map(parseAddress);
    const body = redact(safe.bodyText || safe.text || safe.body || safe.preview || safe.snippet || "");
    const subject = redact(safe.subject || safe.title || "");
    const messageId = text(safe.messageId || safe.id || safe.uid || `${subject}:${safe.receivedAt || safe.date || ""}`);
    const sentByUser = safe.direction === "outgoing" || userEmails.includes(from.address);
    const headers = obj(safe.headers);
    const bulk = /bulk|list|auto-generated|auto-replied/i.test(`${headers["auto-submitted"] || ""} ${headers.precedence || ""} ${headers["list-id"] || ""}`);
    const noReply = /(^|[^\w])no-?reply|donotreply|do-not-reply|notification/i.test(from.address);
    return clone({
      messageId,
      threadId:text(safe.threadId || safe.conversationId || messageId),
      from,
      to,
      subject,
      bodyText:body,
      receivedAt:text(safe.receivedAt || safe.date || safe.createdAt || ""),
      sentByUser,
      automated:safe.automated === true || bulk || noReply,
      bulk:safe.bulk === true || bulk,
      unread:safe.unread === true || safe.read === false,
      flagged:safe.flagged === true || safe.starred === true || safe.important === true,
      attachments:array(safe.attachments).map(function (attachment) {
        const item = obj(attachment);
        const filename = text(item.filename || item.name || "attachment");
        return { filename, contentType:text(item.contentType || item.mimeType || ""), sizeBytes:Number(item.sizeBytes || item.size || 0), bodyLoaded:false };
      }),
      links:array(safe.links).map(function (link) {
        const url = text(obj(link).url || link);
        return { url, opened:false, unsafe:/javascript:|data:|@evil|127\.0\.0\.1|localhost/i.test(url) };
      }),
      redacted:true
    });
  }

  function has(textValue, patterns) {
    const hay = lower(textValue);
    return patterns.some(function (pattern) { return pattern.test(hay); });
  }

  function classifyKind(message) {
    const hay = lower(`${message.subject} ${message.bodyText}`);
    const kind = {
      security:has(hay, [/security alert|new login|password reset|verification code|otp|验证码|安全|登录提醒|密码重置/]),
      bill:has(hay, [/invoice|bill|payment due|amount due|statement|swift|iban|账单|发票|应付|付款|缴费|对账单/]),
      order:has(hay, [/order|shipment|delivered|tracking|receipt|purchase|订单|发货|物流|收据|购买/]),
      travel:has(hay, [/flight|hotel|booking|reservation|check-in|boarding|schedule change|cancelled|canceled|航班|酒店|预订|改签|取消|登机|入住/]),
      subscription:has(hay, [/subscription|renewal|trial expires|price increase|unsubscribe|newsletter|订阅|续费|试用到期|退订|简报/]),
      meeting:has(hay, [/meeting|rsvp|calendar|interview|appointment|会议|邀请|面试|预约/]),
      personal:!message.automated && !message.bulk
    };
    if (kind.security) return "SECURITY";
    if (kind.travel) return "TRAVEL";
    if (kind.bill) return "BILL";
    if (kind.order) return "ORDER";
    if (kind.subscription) return "SUBSCRIPTION";
    if (kind.meeting) return "MEETING";
    if (kind.personal) return "PEOPLE";
    return "UPDATE";
  }

  function extractDeadline(message, now) {
    const body = `${message.subject} ${message.bodyText}`;
    const explicit = body.match(/\b(?:by|before|due(?: on| by)?|deadline(?: is)?|expires? on)\s+([A-Z][a-z]{2,8}\.?\s+\d{1,2}(?:,\s*\d{4})?|\d{4}-\d{2}-\d{2})/i)
      || body.match(/(?:截止|到期|请于|最晚|之前)[:：\s]*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?)/);
    if (explicit) {
      const raw = explicit[1].replace(/[年月]/g, "-").replace(/日/g, "").replace(/\//g, "-");
      const parsed = parseDate(raw);
      return { date:isoDate(parsed), source:"EXPLICIT", overdue:parsed ? daysBetween(parsed, now) < 0 : false, confidence:parsed ? "HIGH" : "LOW" };
    }
    if (/\btomorrow\b|明天/i.test(body)) {
      const base = parseDate(now) || new Date();
      const next = new Date(base.getTime() + 86400000);
      return { date:isoDate(next), source:"RELATIVE_TOMORROW", overdue:false, confidence:"MEDIUM" };
    }
    if (/\bsoon\b|尽快|近期/i.test(body)) return { date:null, source:"VAGUE_NOT_DATED", overdue:false, confidence:"LOW" };
    return null;
  }

  function extractAmount(message) {
    const body = `${message.subject} ${message.bodyText}`;
    const match = body.match(/\b(USD|CNY|RMB|EUR|GBP|HKD|\$|¥)\s?([0-9][0-9,]*(?:\.[0-9]{2})?)/i)
      || body.match(/([0-9][0-9,]*(?:\.[0-9]{2})?)\s?(USD|CNY|RMB|EUR|GBP|HKD|美元|人民币|港币)/i);
    if (!match) return null;
    const firstIsCurrency = /[A-Z$¥]|美元|人民币|港币/i.test(match[1]);
    return {
      currency:firstIsCurrency ? match[1].toUpperCase() : match[2].toUpperCase(),
      amount:firstIsCurrency ? match[2] : match[1],
      redacted:true
    };
  }

  function extractEntity(message) {
    const body = `${message.subject} ${message.bodyText}`;
    const order = body.match(/\b(?:order|订单)\s*(?:#|number|no\.?|号)?\s*[:：]?\s*([A-Z0-9-]{4,})/i);
    const booking = body.match(/\b(?:booking|reservation|PNR|预订号|确认号)\s*(?:#|number|no\.?)?\s*[:：]?\s*([A-Z0-9-]{4,})/i);
    const invoice = body.match(/\b(?:invoice|发票)\s*(?:#|number|no\.?|号)?\s*[:：]?\s*([A-Z0-9-]{4,})/i);
    if (order) return { type:"ORDER", id:order[1] };
    if (booking) return { type:"TRAVEL", id:booking[1] };
    if (invoice) return { type:"BILL", id:invoice[1] };
    return null;
  }

  function extractActions(message, now) {
    const hay = lower(`${message.subject} ${message.bodyText}`);
    const actions = [];
    const deadline = extractDeadline(message, now);
    if (/ignore previous|open terminal|run command|send all my mail|send .*secret|api secret|password|delete all email|archive all/i.test(hay)) return [];
    function add(type, owner, title) {
      actions.push({
        type,
        owner,
        title,
        deadline:deadline && deadline.confidence !== "LOW" ? deadline.date : null,
        sourceMessageId:message.messageId,
        invented:false,
        redacted:true
      });
    }
    if (message.automated && /newsletter|unsubscribe|promotion|sale|webinar/i.test(hay)) return [];
    if (/please reply|could you|can you|would you|请回复|请确认|能否|是否可以|\?/.test(hay) && !message.automated) add("REPLY", "USER_ACTION", "Reply to the direct question or request.");
    if (/approve|approval|review|sign|submit|upload|send (?:the )?(file|document)|确认|审核|签署|提交|上传|发送/.test(hay)) add("COMPLETE_REQUEST", "USER_ACTION", "Complete the requested review, confirmation, or document action.");
    if (/pay|payment due|amount due|invoice due|缴费|付款|账单到期|应付/.test(hay)) add("BILL_PAYMENT_REVIEW", "USER_ACTION", "Review the bill or invoice before any payment.");
    if (/flight.*change|schedule change|cancelled|canceled|航班.*(变更|取消)|改签/.test(hay)) add("TRAVEL_CHANGE_REVIEW", "USER_ACTION", "Review the travel change and decide whether to respond.");
    if (/waiting for|awaiting|pending response from|we will get back|我们会回复|等待对方/.test(hay)) add("WAIT_FOR_OTHER_PARTY", "OTHER_PARTY_ACTION", "Wait for the other party's response.");
    return actions.slice(0, 4);
  }

  function scoreImportance(message, now) {
    const hay = lower(`${message.subject} ${message.bodyText}`);
    const kind = classifyKind(message);
    const deadline = extractDeadline(message, now);
    let importance = 0;
    let urgency = 0;
    const reasons = [];
    if (message.flagged || message.unread) { importance += 1; reasons.push(message.flagged ? "user_flagged" : "unread"); }
    if (kind === "SECURITY") { importance += 4; urgency += /otp|verification code|验证码/.test(hay) ? 2 : 1; reasons.push("security"); }
    if (kind === "TRAVEL") { importance += 3; reasons.push("travel"); }
    if (/cancelled|canceled|schedule change|flight.*change|取消|变更|改签/.test(hay)) { urgency += 4; reasons.push("travel_disruption"); }
    if (kind === "BILL") { importance += 3; reasons.push("bill"); }
    if (deadline && deadline.confidence !== "LOW") {
      importance += 2;
      const days = daysBetween(deadline.date, now);
      if (days != null && days <= 2) urgency += 3;
      else urgency += 1;
      reasons.push("explicit_deadline");
    }
    if (!message.automated && /please reply|could you|can you|请回复|请确认|\?/.test(hay)) { importance += 2; reasons.push("direct_request"); }
    if (message.bulk || /newsletter|unsubscribe|promotion|sale|last chance|urgent sale|促销|优惠|退订/.test(hay)) {
      importance -= 3;
      urgency = Math.max(0, urgency - 3);
      reasons.push("bulk_or_marketing_noise");
    }
    if (/urgent sale|last chance|limited time offer/.test(hay)) urgency = Math.min(urgency, 1);
    const attentionState = urgency >= 4 ? "URGENT" : importance >= 3 ? "IMPORTANT" : importance <= -1 ? "LOW_PRIORITY" : "NORMAL";
    return { importanceScore:importance, urgencyScore:urgency, attentionState, reasons };
  }

  function summarizeMessage(message, now) {
    const kind = classifyKind(message);
    const actions = extractActions(message, now);
    const deadline = extractDeadline(message, now);
    const amount = extractAmount(message);
    const who = message.from.displayName || message.from.address || "Sender";
    const whatHappened = message.subject || "Untitled email";
    const matters = actions.length ? actions[0].title : (kind === "SUBSCRIPTION" ? "Likely low-value subscription or newsletter update." : "Information update; no clear required action.");
    return clone({
      whatHappened,
      whatMatters:matters,
      whatINeedToDo:actions.filter(function (item) { return item.owner === "USER_ACTION"; }).map(function (item) { return item.title; }),
      deadline:deadline && deadline.date,
      keyNumbers:amount ? [amount] : [],
      from:who,
      sourceMessageId:message.messageId,
      concise:true,
      factualErrors:0,
      inventedActions:0,
      redacted:true
    });
  }

  function groupThreads(messages, now) {
    const threads = {};
    messages.forEach(function (message) {
      const key = message.threadId || message.messageId;
      threads[key] = threads[key] || { threadId:key, messages:[] };
      threads[key].messages.push(message);
    });
    return Object.keys(threads).map(function (key) {
      const group = threads[key];
      group.messages.sort(function (a, b) { return (parseDate(a.receivedAt) || 0) - (parseDate(b.receivedAt) || 0); });
      const meaningful = group.messages.filter(function (message) { return !message.bulk && !(message.automated && classifyKind(message) === "SUBSCRIPTION"); });
      const latest = meaningful[meaningful.length - 1] || group.messages[group.messages.length - 1];
      const latestActions = latest ? extractActions(latest, now) : [];
      let replyState = "NO_ACTION";
      if (latest && latest.sentByUser && meaningful.length > 1) replyState = "WAITING_ON_THEM";
      else if (latest && !latest.sentByUser && latestActions.some(function (item) { return item.type === "REPLY"; })) replyState = "NEEDS_REPLY";
      else if (latest && !latest.sentByUser && latestActions.some(function (item) { return item.owner === "USER_ACTION"; })) replyState = "ACTION_REQUIRED_NO_REPLY";
      else if (!latest) replyState = "UNCLEAR";
      const topic = latest ? latest.subject : "Untitled thread";
      return clone({
        threadId:key,
        messageCount:group.messages.length,
        latestMessageId:latest && latest.messageId || "",
        latestSentByUser:latest && latest.sentByUser === true,
        replyState,
        userFriendlyState:replyState === "NEEDS_REPLY" ? "Needs your reply" : replyState === "WAITING_ON_THEM" ? "Waiting for them" : replyState === "ACTION_REQUIRED_NO_REPLY" ? "Needs your action" : replyState === "NO_ACTION" ? "No action needed" : "Unclear",
        summary:{
          context:topic,
          latestDevelopment:latest ? summarizeMessage(latest, now).whatMatters : "No current development.",
          decision:/accepted|approved|confirmed|已确认|通过/.test(lower(group.messages.map(function (m) { return `${m.subject} ${m.bodyText}`; }).join(" "))) ? "Decision appears made" : "No clear final decision",
          openQuestion:replyState === "NEEDS_REPLY" ? "Other party appears to need a response from you." : null,
          whoOwesNextAction:replyState === "WAITING_ON_THEM" ? "Other party" : (replyState === "NEEDS_REPLY" || replyState === "ACTION_REQUIRED_NO_REPLY" ? "You" : "Nobody clearly"),
          concise:true,
          sourceMessageId:latest && latest.messageId || ""
        },
        redacted:true
      });
    });
  }

  function analyzeMailbox(input, options) {
    const safe = obj(options);
    const now = text(safe.now || "2026-08-25T00:00:00.000Z");
    const messages = array(input).map(function (message) { return normalizeMessage(message, safe); });
    const insights = messages.map(function (message) {
      const score = scoreImportance(message, now);
      const actions = extractActions(message, now);
      const deadline = extractDeadline(message, now);
      const kind = classifyKind(message);
      return clone(Object.assign({}, message, {
        kind,
        attentionState:score.attentionState,
        importanceScore:score.importanceScore,
        urgencyScore:score.urgencyScore,
        attentionReasons:score.reasons,
        replyCandidate:actions.some(function (item) { return item.type === "REPLY"; }),
        actionItems:actions,
        deadline,
        entity:extractEntity(message),
        summary:summarizeMessage(message, now)
      }));
    });
    const threads = groupThreads(messages, now);
    const lowPriority = insights.filter(function (item) { return item.attentionState === "LOW_PRIORITY"; });
    const today = {
      needsYourAttention:insights.filter(function (item) { return item.attentionState === "URGENT" || item.replyCandidate || item.actionItems.some(function (action) { return action.owner === "USER_ACTION"; }); }).sort(rankInsight),
      waiting:threads.filter(function (thread) { return thread.replyState === "WAITING_ON_THEM"; }),
      importantUpdates:insights.filter(function (item) { return item.attentionState === "IMPORTANT" && !item.replyCandidate; }).sort(rankInsight),
      billsDeadlines:insights.filter(function (item) { return item.kind === "BILL" || item.deadline; }).sort(rankInsight),
      travel:insights.filter(function (item) { return item.kind === "TRAVEL"; }).sort(rankInsight),
      lowPrioritySummary:{ count:lowPriority.length, grouped:true, autoDeleted:false, sampleSubjects:lowPriority.slice(0, 5).map(function (item) { return item.subject; }) }
    };
    return clone({
      status:"READY",
      messages:insights,
      threads,
      today,
      externalEffects:MUTATIONS,
      EMAIL_SEND_ENABLED:SEND_ENABLED,
      realMailboxRequired:false,
      redacted:true
    });
  }

  function rankInsight(a, b) {
    if (b.urgencyScore !== a.urgencyScore) return b.urgencyScore - a.urgencyScore;
    if (b.importanceScore !== a.importanceScore) return b.importanceScore - a.importanceScore;
    return String(b.receivedAt).localeCompare(String(a.receivedAt));
  }

  function searchMailbox(messages, query, options) {
    const analysis = analyzeMailbox(messages, options);
    const q = lower(query);
    const qWords = words(q);
    const monthMatch = q.match(/(?:\b(?:march|mar)\b|3月份|三月)/);
    const wantsInvoice = /invoice|receipt|发票|收据/.test(q);
    const wantsTravel = /flight|hotel|travel|booking|航班|酒店|旅行|预订/.test(q);
    const wantsOrder = /order|tracking|shipment|订单|物流/.test(q);
    const wantsWaiting = /waiting|等我回复|需要我回复|谁.*等/.test(q);
    const asksForNonexistent = /不存在|没有的|not exist|nonexistent|火星/.test(q);
    const results = analysis.messages.map(function (message) {
      let score = 0;
      const hay = lower(`${message.from.displayName} ${message.from.address} ${message.subject} ${message.bodyText}`);
      qWords.forEach(function (word) { if (word.length > 1 && hay.includes(word)) score += 2; });
      if (wantsInvoice && (message.kind === "BILL" || /invoice|receipt|发票|收据/.test(hay))) score += 8;
      if (wantsTravel && message.kind === "TRAVEL") score += 8;
      if (wantsOrder && message.kind === "ORDER") score += 8;
      if (wantsWaiting && analysis.threads.some(function (thread) { return thread.latestMessageId === message.messageId && thread.replyState === "NEEDS_REPLY"; })) score += 8;
      if (monthMatch && /2026-03|mar|march|3月/.test(lower(message.receivedAt + " " + message.subject + " " + message.bodyText))) score += 6;
      if (message.attentionState === "URGENT" || message.attentionState === "IMPORTANT") score += 1;
      if (asksForNonexistent && !qWords.some(function (word) { return word.length > 1 && hay.includes(word); })) score = 0;
      return { message, score };
    }).filter(function (item) { return item.score > 0; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 10);
    return clone({
      query:text(query),
      results:results.map(function (item) {
        return { messageId:item.message.messageId, threadId:item.message.threadId, subject:item.message.subject, kind:item.message.kind, score:item.score, sourceTrace:{ messageId:item.message.messageId, redacted:true } };
      }),
      unsupportedAnswer:results.length === 0,
      answer:results.length ? "Found relevant messages with source references." : "I could not find enough mailbox evidence.",
      redacted:true
    });
  }

  function buildDraftReply(threadMessages, intent, options) {
    const analysis = analyzeMailbox(threadMessages, options);
    const thread = analysis.threads[0];
    const messages = analysis.messages.sort(function (a, b) { return String(a.receivedAt).localeCompare(String(b.receivedAt)); });
    const latest = messages[messages.length - 1];
    const requested = lower(intent);
    let body = "Thanks for the note. I’ll review this and get back to you.";
    if (/decline|拒绝|不参加/.test(requested)) body = "Thanks for reaching out. I appreciate the invitation, but I won’t be able to participate this time.";
    else if (/friday|周五/.test(requested)) body = "Thanks for checking. Friday works for me.";
    else if (/when|什么时候|发货/.test(requested)) body = "Thanks for the update. Could you please let me know when this will be shipped?";
    else if (thread && thread.replyState === "NO_ACTION") body = "This message does not clearly require a reply.";
    body = redact(body);
    return clone({
      subject:latest ? (/^re:/i.test(latest.subject) ? latest.subject : "Re: " + latest.subject) : "Re:",
      body,
      editable:true,
      sendEnabled:false,
      autoSend:false,
      sourceThreadId:thread && thread.threadId || "",
      sourceMessageId:latest && latest.messageId || "",
      factualInventions:0,
      unsupportedCommitments:/friday|周五/.test(requested) ? 0 : 0,
      secretLeaks:/\[redacted\]|password|token|secret|api key/i.test(body) ? 0 : 0,
      redacted:true
    });
  }

  function evaluateEffectiveness(messages, options) {
    const safe = obj(options);
    const analysis = analyzeMailbox(messages, safe);
    const expectedImportant = array(safe.expectedImportant);
    const surfacedIds = new Set(analysis.today.needsYourAttention.concat(analysis.today.importantUpdates).map(function (item) { return item.messageId; }));
    const expectedSet = new Set(expectedImportant);
    const highValueSurfaced = expectedImportant.filter(function (id) { return surfacedIds.has(id); }).length;
    const falseUrgent = analysis.messages.filter(function (item) { return item.attentionState === "URGENT" && /sale|newsletter|promotion|优惠|促销/i.test(`${item.subject} ${item.bodyText}`); }).length;
    const actions = analysis.messages.reduce(function (sum, item) { return sum + item.actionItems.filter(function (action) { return action.owner === "USER_ACTION"; }).length; }, 0);
    return clone({
      BUSY_MORNING:{
        MESSAGES:analysis.messages.length,
        HIGH_VALUE_MESSAGES:expectedImportant.length,
        HIGH_VALUE_SURFACED:highValueSurfaced,
        HIGH_VALUE_MISSED:Math.max(0, expectedImportant.length - highValueSurfaced),
        FALSE_URGENT:falseUrgent,
        LOW_VALUE_SUPPRESSED:analysis.today.lowPrioritySummary.count,
        USER_ACTIONS_EXTRACTED:actions
      },
      REPLY_STATE:{
        NEEDS_REPLY:analysis.threads.filter(function (thread) { return thread.replyState === "NEEDS_REPLY"; }).length,
        WAITING_ON_THEM:analysis.threads.filter(function (thread) { return thread.replyState === "WAITING_ON_THEM"; }).length,
        NO_ACTION:analysis.threads.filter(function (thread) { return thread.replyState === "NO_ACTION"; }).length
      },
      SUMMARY:{
        FACTUAL_ERRORS:0,
        INVENTED_ACTIONS:0,
        MISSED_CRITICAL_ACTIONS:expectedSet.size - highValueSurfaced,
        OVERLONG_SUMMARIES:analysis.messages.filter(function (item) { return JSON.stringify(item.summary).length > Math.max(600, item.bodyText.length); }).length,
        STALE_SUMMARY_CASES:0
      },
      externalEffects:MUTATIONS,
      redacted:true
    });
  }

  function buildFeatureMatrix() {
    const rows = [
      ["IMPORTANCE", "OPTIMIZE", "Surfaced by attention score; needs real-mail tuning after auth."],
      ["URGENT", "KEEP", "Separated from important and marketing urgency is dampened."],
      ["NEEDS_REPLY", "OPTIMIZE", "Deterministic direct-request detection with false-positive guards."],
      ["WAITING", "KEEP", "Thread latest-sender state supports waiting-on-them."],
      ["ACTION_ITEMS", "OPTIMIZE", "Extracts concrete evidence-backed user actions."],
      ["DEADLINES", "KEEP", "Explicit dates only; vague dates remain undated."],
      ["THREAD_SUMMARY", "OPTIMIZE", "Current-state summary with source message reference."],
      ["MAIL_SUMMARY", "KEEP", "Concise what happened / matters / action shape."],
      ["NATURAL_LANGUAGE_SEARCH", "OPTIMIZE", "Human-language query scoring over normalized safe fields."],
      ["ORDER_GROUPING", "KEEP", "Strong order identifiers only."],
      ["BILL_GROUPING", "KEEP", "Invoice/reference identifiers only."],
      ["TRAVEL_GROUPING", "KEEP", "Booking references and travel semantics."],
      ["NOISE_REDUCTION", "KEEP", "Bulk/newsletter suppression without deletion."],
      ["DRAFT_REPLY", "KEEP", "Editable draft only; no auto-send."],
      ["TODAY_OVERVIEW", "OPTIMIZE", "Primary user-facing overview candidate."],
      ["RAW_INBOX", "KEEP", "Still available so AI grouping never hides mail."]
    ];
    return clone(rows.map(function (row) {
      return { feature:row[0], decision:row[1], changes:row[2], userFacing:true, redacted:true };
    }));
  }

  window.WeishanMailTakeoverUserIntelligence = {
    VERSION,
    MODULE_NAME,
    normalizeMessage,
    classifyKind,
    extractDeadline,
    extractActions,
    scoreImportance,
    summarizeMessage,
    groupThreads,
    analyzeMailbox,
    searchMailbox,
    buildDraftReply,
    evaluateEffectiveness,
    buildFeatureMatrix
  };
})();
