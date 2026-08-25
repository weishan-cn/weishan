;(function () {
  "use strict";

  const VERSION = "4.2.8";
  const MODULE_NAME = "email_ops_real_mailbox_adapter_v1";
  const PUBLIC_SUPPORT_ADDRESS = "support@weishan.ai";
  const PROVIDER_OPERATIONS_ADDRESS = "api@weishan.ai";
  const STREAMS = Object.freeze({
    USER_SUPPORT_STREAM:"USER_SUPPORT_STREAM",
    PROVIDER_OPERATIONS_STREAM:"PROVIDER_OPERATIONS_STREAM",
    UNKNOWN_STREAM:"UNKNOWN_STREAM"
  });
  const STATES = Object.freeze({
    CONNECTED_READ_ONLY:"CONNECTED_READ_ONLY",
    AUTH_REQUIRED:"AUTH_REQUIRED",
    WRONG_ACCOUNT:"WRONG_ACCOUNT",
    UNAVAILABLE:"UNAVAILABLE"
  });

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function array(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function lower(value) { return text(value).toLowerCase(); }
  function dependency(name) { return window[name] || {}; }

  function canonicalAddress(value) {
    return lower(value).replace(/^mailto:/, "");
  }

  function detectStreamForMailbox(mailbox) {
    const address = canonicalAddress(mailbox);
    if (address === PUBLIC_SUPPORT_ADDRESS) return STREAMS.USER_SUPPORT_STREAM;
    if (address === PROVIDER_OPERATIONS_ADDRESS) return STREAMS.PROVIDER_OPERATIONS_STREAM;
    return STREAMS.UNKNOWN_STREAM;
  }

  function normalizeMailboxIdentity(input) {
    const safe = obj(input);
    const address = canonicalAddress(safe.email || safe.address || safe.mailbox);
    return clone({
      address,
      expectedAddress:canonicalAddress(safe.expectedAddress || safe.expectedMailbox || address),
      stream:detectStreamForMailbox(address),
      provider:text(safe.provider || ""),
      verified:address && address === canonicalAddress(safe.expectedAddress || safe.expectedMailbox || address),
      redacted:true
    });
  }

  function detectMailProviderFromMx(mxRecords) {
    const records = array(mxRecords).map(lower).filter(Boolean);
    const joined = records.join(" ");
    if (joined.includes("privateemail.com")) {
      return clone({
        providerId:"privateemail_imap",
        providerLabel:"PrivateEmail / IMAP",
        hostingEvidence:"MX_PRIVATEEMAIL",
        readOnlyCapability:"IMAP_READ_ONLY_POSSIBLE_WITH_EXPLICIT_AUTH",
        authState:"AUTH_REQUIRED",
        gmailConnectorApplicable:false,
        redacted:true
      });
    }
    if (joined.includes("google.com") || joined.includes("googlemail.com")) {
      return clone({
        providerId:"google_workspace",
        providerLabel:"Google Workspace / Gmail API",
        hostingEvidence:"MX_GOOGLE",
        readOnlyCapability:"GMAIL_READ_ONLY_SCOPE_REQUIRED",
        authState:"AUTH_REQUIRED",
        gmailConnectorApplicable:true,
        redacted:true
      });
    }
    if (records.length === 0) {
      return clone({
        providerId:"unknown",
        providerLabel:"Unknown",
        hostingEvidence:"MX_NOT_AVAILABLE",
        readOnlyCapability:"UNAVAILABLE",
        authState:"AUTH_REQUIRED",
        gmailConnectorApplicable:false,
        redacted:true
      });
    }
    return clone({
      providerId:"custom_imap_unknown",
      providerLabel:"Custom mail provider",
      hostingEvidence:"MX_PRESENT_UNCLASSIFIED",
      readOnlyCapability:"PROVIDER_DISCOVERY_REQUIRED",
      authState:"AUTH_REQUIRED",
      gmailConnectorApplicable:false,
      redacted:true
    });
  }

  function buildCanonicalAddressConfig() {
    return clone({
      PUBLIC_SUPPORT_ADDRESS,
      PROVIDER_OPERATIONS_ADDRESS,
      EXTRA_PUBLIC_FEEDBACK_ADDRESS_CREATED:false,
      INITIAL_BETA_AUTO_ACK:"OFF",
      EMAIL_SEND_ENABLED:false,
      streams:{
        USER_SUPPORT_STREAM:{ mailbox:PUBLIC_SUPPORT_ADDRESS, purpose:"Public Beta user bugs, feedback, questions, and support" },
        PROVIDER_OPERATIONS_STREAM:{ mailbox:PROVIDER_OPERATIONS_ADDRESS, purpose:"Provider/API portals, technical partnerships, and verification mail" }
      },
      redacted:true
    });
  }

  function buildConnectionState(input) {
    const safe = obj(input);
    const expectedMailbox = canonicalAddress(safe.expectedMailbox || safe.expectedAccount);
    const actualMailbox = canonicalAddress(safe.actualMailbox || safe.actualAccount);
    const provider = obj(safe.provider);
    const messages = array(safe.messages);
    const limit = Math.max(0, Math.min(Number.isFinite(Number(safe.limit)) ? Number(safe.limit) : 10, 25));
    if (expectedMailbox && actualMailbox && expectedMailbox !== actualMailbox) {
      return clone({
        state:STATES.WRONG_ACCOUNT,
        expectedMailbox,
        actualMailbox,
        stream:detectStreamForMailbox(expectedMailbox),
        messages:[],
        boundedReadLimit:limit,
        provider,
        failClosed:true,
        mailboxMutations:mailboxMutations(),
        redacted:true
      });
    }
    if (!safe.authAvailable) {
      return clone({
        state:STATES.AUTH_REQUIRED,
        expectedMailbox,
        actualMailbox:actualMailbox || null,
        stream:detectStreamForMailbox(expectedMailbox),
        messages:[],
        boundedReadLimit:limit,
        provider,
        failClosed:true,
        mailboxMutations:mailboxMutations(),
        redacted:true
      });
    }
    if (!actualMailbox) {
      return clone({
        state:STATES.UNAVAILABLE,
        expectedMailbox,
        actualMailbox:null,
        stream:detectStreamForMailbox(expectedMailbox),
        messages:[],
        boundedReadLimit:limit,
        provider,
        failClosed:true,
        mailboxMutations:mailboxMutations(),
        redacted:true
      });
    }
    return clone({
      state:STATES.CONNECTED_READ_ONLY,
      expectedMailbox,
      actualMailbox,
      stream:detectStreamForMailbox(actualMailbox),
      messages:messages.slice(0, limit),
      boundedReadLimit:limit,
      provider,
      failClosed:false,
      mailboxMutations:mailboxMutations(),
      redacted:true
    });
  }

  function mailboxMutations() {
    return {
      EMAILS_SENT:0,
      DRAFTS_CREATED:0,
      MAIL_LABELS_CHANGED:0,
      MAIL_DELETED:0,
      MAIL_ARCHIVED:0,
      MAIL_MARKED_READ:0,
      ATTACHMENT_BODIES_DOWNLOADED:0,
      LINKS_OPENED:0
    };
  }

  function attachmentMetadataOnly(attachments) {
    return array(attachments).map(function (attachment) {
      const safe = obj(attachment);
      return {
        attachmentId:text(safe.attachmentId || safe.id || safe.filename || safe.name || "attachment"),
        filename:text(safe.filename || safe.name || "attachment"),
        contentType:text(safe.contentType || safe.mimeType || "application/octet-stream"),
        sizeBytes:Number.isFinite(Number(safe.sizeBytes || safe.size)) ? Number(safe.sizeBytes || safe.size) : null,
        bodyLoaded:false,
        executableOpened:false
      };
    });
  }

  function adaptProviderMessage(raw, mailboxContext) {
    const message = obj(raw);
    const context = obj(mailboxContext);
    const mailbox = canonicalAddress(context.mailbox || context.actualMailbox || context.expectedMailbox || message.mailbox);
    return clone({
      messageId:text(message.messageId || message.id || message.providerMessageId),
      threadId:text(message.threadId || message.conversationId || message.messageId || message.id),
      providerMessageId:text(message.providerMessageId || message.id || message.messageId),
      from:text(message.from || message.sender || ""),
      to:array(message.to || [mailbox]).map(text).filter(Boolean),
      cc:array(message.cc).map(text).filter(Boolean),
      subject:text(message.subject || ""),
      bodyText:text(message.text || message.bodyText || message.body || message.snippet || ""),
      html:"",
      receivedAt:text(message.receivedAt || message.date || message.internalDate || ""),
      attachments:attachmentMetadataOnly(message.attachments),
      mailbox,
      mailboxStream:detectStreamForMailbox(mailbox),
      source:"REAL_MAIL_READ_ONLY",
      read:message.read === true,
      unread:message.unread === true || message.read === false,
      replyTo:text(message.replyTo || ""),
      authResults:obj(message.authResults),
      providerHints:array(message.providerHints).map(text).filter(Boolean),
      rawHtmlRetained:false,
      remoteContentLoaded:false,
      linksOpened:false,
      attachmentBodiesDownloaded:false,
      redacted:true
    });
  }

  function processReadOnlyMailboxSnapshot(snapshot, options) {
    const safe = obj(snapshot);
    const connection = buildConnectionState(safe);
    const control = dependency("WeishanEmailOpsControlPlane");
    if (connection.state !== STATES.CONNECTED_READ_ONLY) {
      return clone({
        status:"EMAIL_OPS_MAILBOX_NOT_CONNECTED",
        connectionState:connection.state,
        expectedMailbox:connection.expectedMailbox,
        actualMailbox:connection.actualMailbox,
        stream:connection.stream,
        processedMessages:0,
        realMailReadValidated:false,
        pipelineValidated:false,
        mailboxMutations:mailboxMutations(),
        redacted:true
      });
    }
    const normalizedInput = connection.messages.map(function (message) {
      return adaptProviderMessage(message, { mailbox:connection.actualMailbox });
    });
    const result = control.processMailbox
      ? control.processMailbox(normalizedInput, Object.assign({
        expectedAccount:connection.expectedMailbox,
        actualAccount:connection.actualMailbox,
        EMAIL_SEND_ENABLED:false
      }, obj(options)))
      : { status:"EMAIL_OPS_UNAVAILABLE", processedMessages:0, classifications:[], humanQueue:[] };
    result.connectionState = connection.state;
    result.mailboxStream = connection.stream;
    result.realMailReadValidated = true;
    result.realMessagesReadCount = normalizedInput.length;
    result.mailboxMutations = mailboxMutations();
    result.EMAIL_SEND_ENABLED = false;
    result.redacted = true;
    return clone(result);
  }

  function buildManualFallbackState(input) {
    const mailboxAvailable = obj(input).mailboxAvailable === true;
    return clone({
      MANUAL_SUPPORT_INBOX_FALLBACK:mailboxAvailable ? "AVAILABLE" : "NOT_AVAILABLE",
      EMAIL_FEEDBACK_GATE:mailboxAvailable ? "PASS_WITH_MANUAL_FALLBACK" : "FAIL",
      AUTO_ACK:"OFF",
      EMAIL_SEND_ENABLED:false,
      redacted:true
    });
  }

  window.WeishanEmailOpsRealMailboxAdapter = {
    VERSION,
    MODULE_NAME,
    PUBLIC_SUPPORT_ADDRESS,
    PROVIDER_OPERATIONS_ADDRESS,
    STREAMS,
    STATES,
    normalizeMailboxIdentity,
    detectStreamForMailbox,
    detectMailProviderFromMx,
    buildCanonicalAddressConfig,
    buildConnectionState,
    adaptProviderMessage,
    processReadOnlyMailboxSnapshot,
    buildManualFallbackState
  };
})();
