;(function () {
  "use strict";

  const VERSION = "4.2.8";
  const MODULE_NAME = "email_ops_bug_triage_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function lower(value) { return text(value).toLowerCase(); }
  function padIssue(n) { return "BUG-" + String(n).padStart(4, "0"); }

  function domainFor(message) {
    const haystack = lower(`${obj(message).subject || ""} ${obj(message).sanitizedBody || ""}`);
    if (/security|secret|credential|漏洞|泄露/.test(haystack)) return "SECURITY";
    if (/flight|航班|机票|date|fare/.test(haystack)) return "FLIGHT";
    if (/hotel|酒店|room|total/.test(haystack)) return "HOTEL";
    if (/cruise|邮轮|游轮|cabin/.test(haystack)) return "CRUISE";
    if (/install|startup|crash|desktop|启动|安装|崩溃/.test(haystack)) return "DESKTOP";
    if (/price|variant|product|handoff|购物|商品|价格/.test(haystack)) return "SHOPPING";
    return "OTHER";
  }

  function severityFor(message) {
    const haystack = lower(`${obj(message).subject || ""} ${obj(message).sanitizedBody || ""}`);
    if (/secret|credential leak|payment happened|data corruption|all users|cannot open|无法启动|泄露/.test(haystack)) return "P0";
    if (/wrong price|wrong variant|wrong date|wrong total|test price shown live|bad handoff|价格不对|跳转错误/.test(haystack)) return "P1";
    if (/confusing|slow|layout|ui|minor|卡顿|显示/.test(haystack)) return "P2";
    return "UNKNOWN";
  }

  function signatureFor(message) {
    const raw = lower(`${obj(message).subject || ""} ${obj(message).sanitizedBody || ""}`);
    const domain = domainFor(message);
    const symptomTags = [];
    if (/wrong total|total.*wrong|tax|fee|taxes|fees|总价|费用/.test(raw)) symptomTags.push("wrong-total-tax-fee");
    if (/wrong price|price.*wrong|价格不对/.test(raw) && !symptomTags.includes("wrong-total-tax-fee")) symptomTags.push("wrong-price");
    if (/handoff|wrong provider|wrong merchant|跳转错误/.test(raw)) symptomTags.push("wrong-handoff");
    if (/crash|cannot open|startup|无法启动|崩溃/.test(raw)) symptomTags.push("crash-startup");
    if (/security|secret|credential|漏洞|泄露/.test(raw)) symptomTags.push("security");
    if (symptomTags.length > 0) return `${domain}:${symptomTags.sort().join("|")}`;

    const haystack = raw
      .replace(/\b\d{4,}\b/g, "n")
      .replace(/https?:\/\/\S+/g, "url")
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
      .trim();
    const tokens = haystack.split(/\s+/).filter(function (token) {
      return token.length > 2 && !["the", "and", "with", "from", "please", "thanks"].includes(token);
    }).slice(0, 10).join(" ");
    return `${domain}:${tokens}`;
  }

  function summarizeIssue(message) {
    const subject = text(obj(message).subject || "No subject");
    const body = text(obj(message).sanitizedBody || "");
    return (subject + (body ? " — " + body : "")).slice(0, 280);
  }

  function clusterBugReports(messages) {
    const clusters = [];
    const bySignature = {};
    messages.forEach(function (message) {
      const signature = signatureFor(message);
      let cluster = bySignature[signature];
      if (!cluster) {
        cluster = {
          canonicalIssueId:padIssue(clusters.length + 1),
          signature,
          domain:domainFor(message),
          messageCount:0,
          uniqueReporterCount:0,
          reporterRefs:{},
          firstSeen:obj(message).receivedAt || "",
          lastSeen:obj(message).receivedAt || "",
          affectedVersions:[],
          affectedOS:[],
          severity:severityFor(message),
          status:"NEW",
          confidence:"SINGLE_REPORT",
          representativeSymptoms:[summarizeIssue(message)]
        };
        bySignature[signature] = cluster;
        clusters.push(cluster);
      }
      cluster.messageCount += 1;
      const reporter = lower(obj(obj(message).from).address || obj(message).messageId || "unknown");
      cluster.reporterRefs[reporter] = true;
      cluster.uniqueReporterCount = Object.keys(cluster.reporterRefs).length;
      cluster.lastSeen = obj(message).receivedAt || cluster.lastSeen;
      const version = text(obj(message).appVersion || "");
      const os = text(obj(message).os || "");
      if (version && !cluster.affectedVersions.includes(version)) cluster.affectedVersions.push(version);
      if (os && !cluster.affectedOS.includes(os)) cluster.affectedOS.push(os);
      if (cluster.uniqueReporterCount > 1) cluster.confidence = "MULTIPLE_REPORTS";
      if (cluster.messageCount >= 10) cluster.confidence = "MULTIPLE_REPORTS";
    });
    return clone(clusters.map(function (cluster) {
      const safe = Object.assign({}, cluster);
      delete safe.reporterRefs;
      safe.duplicateConfidence = safe.messageCount > 1 ? "HIGH" : "LOW";
      safe.engineeringPackage = {
        issueSummary:safe.representativeSymptoms[0],
        steps:"Not yet verified from user report.",
        expected:"Do not invent missing facts.",
        actual:"Do not invent missing facts.",
        domain:safe.domain,
        severity:safe.severity,
        status:safe.status,
        redacted:true
      };
      safe.redacted = true;
      return safe;
    }));
  }

  window.WeishanEmailOpsBugTriage = {
    VERSION,
    MODULE_NAME,
    domainFor,
    severityFor,
    signatureFor,
    clusterBugReports
  };
})();
