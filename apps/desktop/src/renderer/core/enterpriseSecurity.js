(function(){
  function nowIso(){ return new Date().toISOString(); }
  function localTime(value){
    const date = value ? new Date(value) : new Date();
    const valid = Number.isNaN(date.getTime()) ? new Date() : date;
    const pad = (n) => String(n).padStart(2, "0");
    return valid.getFullYear() + "/" + pad(valid.getMonth() + 1) + "/" + pad(valid.getDate()) + " " + pad(valid.getHours()) + ":" + pad(valid.getMinutes()) + ":" + pad(valid.getSeconds());
  }
  function summarize(value, maxLength){
    const tp = window.WeishanTaskProtocol;
    if (tp && typeof tp.summarizeTextSafe === "function") return tp.summarizeTextSafe(value, maxLength || 160);
    const text = String(value || "").replace(/\s+/g, " ").trim();
    const max = Number(maxLength || 160);
    return text.length > max ? text.slice(0, max).trim() + "..." : text;
  }
  function getCurrentSecurityPrincipal(){
    return {
      userId:"local-user",
      displayName:"Local User",
      companyId:"local-company",
      companyName:"Local Company",
      role:"owner",
      planType:"personal",
      paidByUserId:"local-user",
      paidByName:"Local User"
    };
  }
  function textOf(payload, artifact){
    return [
      payload && payload.module,
      payload && payload.action,
      artifact && artifact.title,
      artifact && artifact.filename
    ].join(" ").toLowerCase();
  }
  function classifyDataScope(payload, artifact){
    const moduleId = payload && payload.module || "";
    if (moduleId === "team") return "team";
    if (moduleId === "seats") return "seats";
    if (moduleId === "reports") return "reports";
    if (moduleId === "project") return "project";
    if (moduleId === "mail") return "mail";
    if (moduleId === "audit") return "audit";
    if (moduleId === "memory") return "memory";
    if (moduleId === "crawler") return "crawler";
    if (moduleId === "softwareFactory") return "softwareFactory";
    if (moduleId === "home") return "home";
    const text = textOf(payload || {}, artifact || {});
    if (/财务|finance/.test(text)) return "finance";
    if (/人事|hr|payroll|薪资/.test(text)) return "hr";
    if (/customer|客户/.test(text)) return "customer";
    return moduleId || "general";
  }
  function isEnterpriseModule(module){
    return ["team", "seats", "reports", "audit"].indexOf(String(module || "")) >= 0;
  }
  function getModulePolicy(module){
    const m = String(module || "unknown");
    return {
      module:m,
      paid:isEnterpriseModule(m),
      requiresViewAudit:isEnterpriseModule(m),
      requiresCopyAudit:isEnterpriseModule(m),
      requiresExportAudit:isEnterpriseModule(m),
      requiresDownloadAudit:isEnterpriseModule(m),
      sensitiveScopes:isEnterpriseModule(m) ? [m] : []
    };
  }
  function getEnterpriseOrgCatalog(){
    return [
      { orgId:"org-exec", name:"管理层", scopes:["general", "project", "audit", "finance", "hr", "customer", "softwareFactory"] },
      { orgId:"org-tech", name:"技术研发", scopes:["general", "project", "softwareFactory", "crawler", "memory"] },
      { orgId:"org-product", name:"产品", scopes:["general", "project", "softwareFactory", "crawler"] },
      { orgId:"org-finance", name:"财务", scopes:["finance", "reports", "audit"] },
      { orgId:"org-hr", name:"人事", scopes:["hr", "seats", "audit"] },
      { orgId:"org-sales", name:"销售与客户", scopes:["customer", "reports"] },
      { orgId:"org-audit", name:"审计与合规", scopes:["audit", "finance", "hr", "customer", "reports"] }
    ];
  }
  function findEnterpriseOrg(orgId){
    return getEnterpriseOrgCatalog().find((org) => org.orgId === orgId) || null;
  }
  function inferProjectScope(projectType){
    const text = String(projectType || "").toLowerCase();
    if (/software|softwarefactory|软件制作/.test(text)) return "softwareFactory";
    if (/finance|财务/.test(text)) return "finance";
    if (/hr|人事|薪资/.test(text)) return "hr";
    if (/customer|客户/.test(text)) return "customer";
    if (/audit|审计/.test(text)) return "audit";
    if (/report|报告/.test(text)) return "reports";
    return "project";
  }
  function scopeInviteAllowList(projectScope){
    const scope = inferProjectScope(projectScope);
    if (scope === "softwareFactory") return ["org-tech", "org-product", "org-exec"];
    if (scope === "finance") return ["org-finance", "org-audit", "org-exec"];
    if (scope === "hr") return ["org-hr", "org-audit", "org-exec"];
    if (scope === "customer") return ["org-sales", "org-audit", "org-exec"];
    return null;
  }
  function canInviteOrganization(principal, projectScope, orgId){
    const p = principal || getCurrentSecurityPrincipal();
    const scope = inferProjectScope(projectScope);
    const org = findEnterpriseOrg(orgId);
    if (!org) {
      return { allowed:false, requiresApproval:false, reason:"未找到被邀请组织。", projectScope:scope, orgId:orgId || "", orgName:"" };
    }
    const allowList = scopeInviteAllowList(scope);
    const allowed = allowList ? allowList.indexOf(org.orgId) >= 0 : org.scopes.indexOf(scope) >= 0;
    let reason = "组织授权匹配。";
    if (!allowed && scope === "finance") reason = "财务数据项目不能邀请该组织。";
    else if (!allowed && scope === "hr") reason = "人事薪资项目不能邀请该组织。";
    else if (!allowed && scope === "customer") reason = "客户数据项目不能邀请该组织。";
    else if (!allowed && scope === "softwareFactory") reason = "软件制作项目通常只邀请技术研发、产品或管理层。";
    else if (!allowed) reason = "被邀请组织不在该项目数据范围授权内。";
    if (allowed && p.planType === "enterprise") reason = "企业组织授权匹配，协作动作将写入审计。";
    if (allowed && p.planType === "personal") reason = "本地预览模式，已按组织规则记录协作动作。";
    return {
      allowed,
      requiresApproval:false,
      reason,
      projectScope:scope,
      orgId:org.orgId,
      orgName:org.name
    };
  }
  function canAccessModule(principal, module){
    const p = principal || getCurrentSecurityPrincipal();
    const m = String(module || "unknown");
    if (!isEnterpriseModule(m)) return { allowed:true, requiresApproval:false, reason:"general" };
    if (p.planType === "personal") return { allowed:true, requiresApproval:false, reason:"本地预览模式" };
    if (p.role === "owner") return { allowed:true, requiresApproval:false, reason:"owner" };
    if (p.planType === "enterprise" && m === "seats") return { allowed:false, requiresApproval:true, reason:"需要 owner 或企业授权" };
    return { allowed:true, requiresApproval:false, reason:"enterprise audited" };
  }
  function canDownload(principal, scope){
    const p = principal || getCurrentSecurityPrincipal();
    const sensitive = scope === "finance" || scope === "hr" || scope === "customer";
    if (p.planType === "personal") {
      if (sensitive) return { allowed:false, requiresApproval:true, reason:"需要企业授权" };
      return { allowed:true, requiresApproval:false, reason:"personal" };
    }
    if (p.role === "owner") return { allowed:true, requiresApproval:false, reason:"owner" };
    if (p.planType === "enterprise" && sensitive) {
      return { allowed:false, requiresApproval:true, reason:"需要企业授权" };
    }
    return { allowed:true, requiresApproval:false, reason:"allowed" };
  }
  function createWatermark(principal, action, scope){
    const p = principal || getCurrentSecurityPrincipal();
    const tail = String(p.userId || "user").slice(-4);
    return [p.displayName || "Local User", tail, p.companyName || "Local Company", localTime(), action || "download", scope || "general"].join(" · ");
  }
  function createModuleWatermark(principal, module, action){
    const p = principal || getCurrentSecurityPrincipal();
    const tail = String(p.userId || "user").slice(-4);
    return [p.displayName || "Local User", tail, p.companyName || "Local Company", localTime(), module || "module", action || "action"].join(" · ");
  }
  function isTextMime(mimeType){
    return /text\/plain|text\/markdown|text\/csv/i.test(String(mimeType || ""));
  }
  function applyTextWatermark(content, watermark, principal, mimeType){
    const p = principal || getCurrentSecurityPrincipal();
    const text = String(content || "");
    if (p.planType !== "enterprise") return text;
    if (!isTextMime(mimeType)) return text;
    return ["---", "weishan watermark: " + String(watermark || ""), "---", "", text].join("\n");
  }
  function createAuditPayload(input){
    const data = input || {};
    const principal = data.principal || getCurrentSecurityPrincipal();
    const artifact = data.artifact || {};
    const payload = data.payload || {};
    return {
      schemaVersion:"weishan.audit.v1",
      module:"audit",
      action:data.action || "download",
      status:data.status || "done",
      actorUserId:principal.userId,
      actorName:principal.displayName,
      companyId:principal.companyId,
      scope:data.scope || "unknown",
      targetType:"artifact",
      targetId:artifact.artifactId || "",
      filename:artifact.filename || "",
      result:data.result || "",
      reason:summarize(data.reason || "", 160),
      watermark:data.watermark || "",
      sourceType:data.sourceType || data.recordType || "",
      sourceTaskId:payload.taskId || "",
      createdAt:data.createdAt || nowIso()
    };
  }
  function createSecurityAuditPayload(input){
    const data = input || {};
    const principal = data.principal || getCurrentSecurityPrincipal();
    return {
      schemaVersion:"weishan.task.v1",
      module:"audit",
      action:data.action || "view",
      status:data.status || "done",
      actorUserId:principal.userId,
      actorName:principal.displayName,
      companyId:principal.companyId,
      planType:principal.planType,
      sourceModule:data.sourceModule || data.module || "",
      scope:data.scope || data.sourceModule || data.module || "unknown",
      targetType:data.targetType || "module",
      targetId:data.targetId || data.sourceModule || data.module || "",
      result:data.result || "",
      reason:summarize(data.reason || "", 160),
      watermark:data.watermark || "",
      createdAt:data.createdAt || nowIso(),
      inputSummary:summarize(data.inputSummary || "", 240),
      outputSummary:summarize(data.outputSummary || "", 240)
    };
  }
  function sanitizeCollaborationNote(text){
    const raw = String(text || "");
    const redacted = raw
      .replace(/(api[-_ ]?key|authorization|bearer|password|token|secret)\s*[:=]\s*[^,\s;]+/gi, "$1=[redacted]")
      .replace(/sk-[A-Za-z0-9._-]+/g, "sk-[redacted]");
    return summarize(redacted, 1000);
  }
  function createCollaborationAuditPayload(input){
    const data = input || {};
    const principal = data.principal || getCurrentSecurityPrincipal();
    const ownerOrg = findEnterpriseOrg(data.ownerOrgId) || {};
    const invitedOrg = findEnterpriseOrg(data.invitedOrgId) || {};
    const createdAt = data.createdAt || nowIso();
    const scope = inferProjectScope(data.projectScope || data.projectType || "");
    return {
      schemaVersion:"weishan.task.v1",
      module:"audit",
      action:data.action || "invite",
      status:data.status || "done",
      actorUserId:principal.userId,
      actorName:principal.displayName,
      companyId:principal.companyId,
      companyName:principal.companyName,
      planType:principal.planType,
      projectId:data.projectId || "",
      projectName:summarize(data.projectName || "", 160),
      projectScope:scope,
      ownerOrgId:data.ownerOrgId || "",
      ownerOrgName:data.ownerOrgName || ownerOrg.name || "",
      invitedOrgId:data.invitedOrgId || "",
      invitedOrgName:data.invitedOrgName || invitedOrg.name || "",
      inviteeName:summarize(data.inviteeName || "", 120),
      inviteeRole:summarize(data.inviteeRole || "", 80),
      joinedAt:data.joinedAt || "",
      leftAt:data.leftAt || "",
      result:data.result || "",
      reason:summarize(data.reason || "", 240),
      noteSummary:sanitizeCollaborationNote(data.noteSummary || data.note || ""),
      createdAt,
      localTime:localTime(createdAt),
      inputSummary:summarize(data.inputSummary || data.projectName || "", 240),
      outputSummary:summarize(data.outputSummary || data.reason || "", 240)
    };
  }
  function recordSecurityAudit(type, input){
    if (!window.HistoryApi || typeof window.HistoryApi.record !== "function") return null;
    return window.HistoryApi.record(type, createSecurityAuditPayload(input || {}));
  }
  function previewNotice(module){
    const p = getCurrentSecurityPrincipal();
    if (p.planType === "personal") return "企业付费模块，本地预览模式。个人用户可继续查看，本地不会强制授权。";
    return "企业模式下，查看、复制、下载、导出会写入审计日志。";
  }
  function recordModuleViewOnce(module){
    const principal = getCurrentSecurityPrincipal();
    const decision = canAccessModule(principal, module);
    const minute = new Date().toISOString().slice(0, 16);
    const key = "weishan:audit:view:" + module + ":" + minute;
    try {
      if (window.sessionStorage && window.sessionStorage.getItem(key)) return decision;
      if (window.sessionStorage) window.sessionStorage.setItem(key, "1");
    } catch (_) {}
    recordSecurityAudit("audit.view", {
      principal,
      action:"view",
      status:decision.allowed ? "done" : "failed",
      sourceModule:module,
      scope:module,
      result:principal.planType === "personal" ? "preview" : (decision.allowed ? "allowed" : "denied"),
      reason:decision.reason,
      inputSummary:"view " + module,
      outputSummary:"module access " + (decision.allowed ? "allowed" : "denied")
    });
    return decision;
  }
  function bindModuleCopyAudit(root, module){
    if (!root || !root.addEventListener) return;
    root.addEventListener("copy", function(){
      const principal = getCurrentSecurityPrincipal();
      recordSecurityAudit("audit.copy", {
        principal,
        action:"copy",
        status:"done",
        sourceModule:module,
        scope:module,
        result:"copied",
        reason:"module selection copied",
        inputSummary:"copy in " + module,
        outputSummary:"copy event recorded"
      });
    });
  }
  function secureTextExport(input){
    const data = input || {};
    const principal = data.principal || getCurrentSecurityPrincipal();
    const module = data.module || "unknown";
    const action = data.action || "export";
    const scope = data.scope || module;
    const decision = canDownload(principal, scope);
    if (decision.requiresApproval) {
      const ok = typeof window.confirm === "function" ? window.confirm("该导出需要企业授权，是否以本地模拟授权继续？") : false;
      if (!ok) {
        recordSecurityAudit("audit.exportRejected", {
          principal,
          action:"export",
          status:"failed",
          sourceModule:module,
          scope,
          result:"rejected",
          reason:decision.reason,
          inputSummary:"export " + module,
          outputSummary:"export rejected"
        });
        return { ok:false, reason:"rejected" };
      }
      recordSecurityAudit("audit.exportApproved", {
        principal,
        action:"export",
        status:"done",
        sourceModule:module,
        scope,
        result:"approved",
        reason:decision.reason,
        inputSummary:"export " + module,
        outputSummary:"export approved"
      });
    }
    const watermark = createModuleWatermark(principal, module, action);
    const content = applyTextWatermark(data.content || "", watermark, principal, data.mimeType || "text/markdown;charset=utf-8");
    recordSecurityAudit("audit.export", {
      principal,
      action:"export",
      status:"done",
      sourceModule:module,
      scope,
      targetType:"file",
      targetId:data.filename || "",
      result:"exported",
      reason:decision.reason,
      watermark:principal.planType === "enterprise" ? watermark : "",
      inputSummary:data.inputSummary || "export " + module,
      outputSummary:data.outputSummary || "exported " + (data.filename || "file")
    });
    return { ok:true, content, watermark };
  }
  window.WeishanEnterpriseSecurity = {
    getCurrentSecurityPrincipal,
    classifyDataScope,
    isEnterpriseModule,
    getModulePolicy,
    getEnterpriseOrgCatalog,
    inferProjectScope,
    canInviteOrganization,
    canAccessModule,
    canDownload,
    createWatermark,
    createModuleWatermark,
    applyTextWatermark,
    createAuditPayload,
    createSecurityAuditPayload,
    createCollaborationAuditPayload,
    sanitizeCollaborationNote,
    recordSecurityAudit,
    previewNotice,
    recordModuleViewOnce,
    bindModuleCopyAudit,
    secureTextExport
  };
})();
