;(function () {
  "use strict";

  const VERSION = "4.2.8";
  const MODULE_NAME = "email_ops_control_plane_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function array(value) { return Array.isArray(value) ? value.slice() : []; }

  function dependency(name) {
    return window[name] || {};
  }

  function processMailbox(messages, options) {
    const normalizer = dependency("WeishanEmailOpsNormalizer");
    const classifier = dependency("WeishanEmailOpsClassifier");
    const policy = dependency("WeishanEmailOpsActionPolicy");
    const bugs = dependency("WeishanEmailOpsBugTriage");
    const config = Object.assign({ EMAIL_SEND_ENABLED:false, expectedAccount:"api@weishan.ai" }, obj(options));
    const batch = normalizer.normalizeMailboxBatch ? normalizer.normalizeMailboxBatch(messages, config) : { accountStatus:"UNAVAILABLE", messages:[] };

    if (batch.accountStatus === "WRONG_ACCOUNT") {
      return clone({
        status:"EMAIL_OPS_UNAVAILABLE",
        accountStatus:"WRONG_ACCOUNT",
        processedMessages:0,
        classifications:[],
        bugClusters:[],
        providerThreads:[],
        humanQueue:[{
          type:"WRONG_MAILBOX_GUARD",
          priority:"P0",
          entity:config.expectedAccount,
          action:"Reconnect the expected Weishan operational mailbox before processing.",
          estimatedTime:"1-3 minutes",
          redacted:true
        }],
        audit:[policy.createAuditEvent ? policy.createAuditEvent("MAILBOX_WRONG_ACCOUNT", { actor:"machine" }) : {}],
        externalEffects:externalEffects(),
        EMAIL_SEND_ENABLED:false,
        redacted:true
      });
    }

    const seen = {};
    const classifications = [];
    const bugMessages = [];
    const providerThreads = {};
    const humanQueue = [];
    const audit = [];

    array(batch.messages).forEach(function (message) {
      if (!message.messageId || seen[message.messageId]) return;
      seen[message.messageId] = true;
      let classification;
      try {
        classification = classifier.classifyEmailMessage(message);
      } catch (_) {
        classification = { messageId:message.messageId, threadId:message.threadId, category:"UNKNOWN", confidence:"LOW", riskFlags:["CLASSIFIER_FAILED"], redacted:true };
      }
      classifications.push(classification);
      audit.push(policy.createAuditEvent("MESSAGE_CLASSIFIED", classification));

      const actionPolicy = policy.classifyOutgoingPolicy(classification, config);
      const queueItem = policy.buildHumanQueueItem(message, classification, actionPolicy);
      if (queueItem) humanQueue.push(queueItem);

      if (classification.category === "USER_BUG_REPORT") bugMessages.push(message);
      if (classification.category === "PROVIDER_REPLY" && classification.providerId) {
        providerThreads[classification.providerId] = providerThreads[classification.providerId] || {
          providerId:classification.providerId,
          messageCount:0,
          state:"RESPONSE_RECEIVED",
          actionPolicy:"DRAFT_ONLY",
          redacted:true
        };
        providerThreads[classification.providerId].messageCount += 1;
      }
    });

    const bugClusters = bugs.clusterBugReports ? bugs.clusterBugReports(bugMessages) : [];
    bugClusters.forEach(function (cluster) { audit.push(policy.createAuditEvent("BUG_CLUSTERED", { category:"USER_BUG_REPORT", messageId:cluster.canonicalIssueId })); });

    return clone({
      status:"READY_FOR_INTERNAL_EMAIL_OPS",
      accountStatus:batch.accountStatus,
      processedMessages:Object.keys(seen).length,
      classifications,
      bugClusters,
      providerThreads:Object.keys(providerThreads).map(function (key) { return providerThreads[key]; }),
      humanQueue:humanQueue.sort(function (a, b) { return String(a.priority).localeCompare(String(b.priority)); }),
      audit,
      dailySummary:{
        NEW_BUGS:bugMessages.length,
        NEW_BUG_CLUSTERS:bugClusters.length,
        P0_P1:bugClusters.filter(function (item) { return item.severity === "P0" || item.severity === "P1"; }).length,
        PROVIDER_REPLIES:Object.keys(providerThreads).length,
        HUMAN_ACTIONS:humanQueue.length,
        SECURITY_MAIL:classifications.filter(function (item) { return /^SECURITY/.test(item.category); }).length,
        AUTO_ACKS:0,
        DRAFTS:0,
        NOISE_SUPPRESSED:classifications.filter(function (item) { return item.category === "MARKETING" || item.category === "SPAM_NOISE"; }).length,
        redacted:true
      },
      externalEffects:externalEffects(),
      EMAIL_SEND_ENABLED:false,
      realMailReadValidated:false,
      realMailWritePerformed:false,
      redacted:true
    });
  }

  function externalEffects() {
    return {
      EMAILS_READ:0,
      EMAILS_SENT:0,
      DRAFTS_CREATED:0,
      MAIL_LABELS_CHANGED:0,
      MAIL_DELETED:0,
      PROVIDER_API_CALLS:0,
      PROVIDER_ACCOUNT_ACTIONS:0,
      WEBSITE_CHANGES:0,
      BOOKINGS:0,
      PAYMENTS:0,
      PRODUCTION_TRAFFIC:0
    };
  }

  function buildFeedbackAddressRecommendation() {
    return clone({
      RECOMMENDED_PUBLIC_FEEDBACK_ADDRESS:"feedback@weishan.ai",
      RECOMMENDED_PROVIDER_OPERATIONS_ADDRESS:"api@weishan.ai",
      RATIONALE:"Keep public beta feedback separate from Provider/API operations; do not create the mailbox until mail-admin authorization exists.",
      mailboxCreated:false,
      redacted:true
    });
  }

  window.WeishanEmailOpsControlPlane = {
    VERSION,
    MODULE_NAME,
    processMailbox,
    externalEffects,
    buildFeedbackAddressRecommendation
  };
})();
