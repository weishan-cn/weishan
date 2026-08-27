(function(){
  const INVITE_KEY = "weishan:enterprise:collaborationInvites:v1";
  const PROJECT_TYPES = [
    { value:"project", label:"普通项目" },
    { value:"softwareFactory", label:"软件制作" },
    { value:"finance", label:"财务数据" },
    { value:"hr", label:"人事薪资" },
    { value:"customer", label:"客户数据" },
    { value:"audit", label:"审计合规" }
  ];
  const INVITEE_ROLES = ["查看者", "编辑者", "审批者", "管理员"];
  const STATUS_LABEL = {
    invited:"已邀请",
    joined:"已加入",
    left:"已离开",
    rejected:"已拒绝",
    blocked:"已拦截"
  };

  function t(key){ return window.I18n.t(key); }
  function esc(s){ return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function security(){ return window.WeishanEnterpriseSecurity || null; }
  function notice(module){ const sec=security(); return sec && sec.previewNotice ? sec.previewNotice(module) : ""; }
  function nowIso(){ return new Date().toISOString(); }
  function localTime(value){
    const date = value ? new Date(value) : new Date();
    const valid = Number.isNaN(date.getTime()) ? new Date() : date;
    const pad = (n) => String(n).padStart(2, "0");
    return valid.getFullYear() + "/" + pad(valid.getMonth() + 1) + "/" + pad(valid.getDate()) + " " + pad(valid.getHours()) + ":" + pad(valid.getMinutes()) + ":" + pad(valid.getSeconds());
  }
  function createId(prefix){
    return String(prefix || "id") + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }
  function summarize(text, maxLength){
    const tp = window.WeishanTaskProtocol;
    if (tp && typeof tp.summarizeTextSafe === "function") return tp.summarizeTextSafe(text, maxLength || 180);
    const value = String(text || "").replace(/\s+/g, " ").trim();
    const max = Number(maxLength || 180);
    return value.length > max ? value.slice(0, max).trim() + "..." : value;
  }
  function orgCatalog(){
    const sec = security();
    return sec && sec.getEnterpriseOrgCatalog ? sec.getEnterpriseOrgCatalog() : [];
  }
  function orgById(orgId){
    return orgCatalog().find((org) => org.orgId === orgId) || { orgId:orgId || "", name:"" };
  }
  function readInvites(){
    try {
      const raw = window.localStorage ? window.localStorage.getItem(INVITE_KEY) : "";
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch (_) {
      return [];
    }
  }
  function writeInvites(items){
    if (!window.localStorage) return;
    window.localStorage.setItem(INVITE_KEY, JSON.stringify(Array.isArray(items) ? items : []));
  }
  function saveInvite(invite){
    const items = readInvites();
    const next = [invite].concat(items.filter((item) => item && item.inviteId !== invite.inviteId)).slice(0, 500);
    writeInvites(next);
    return next;
  }
  function updateInvite(inviteId, updater){
    const items = readInvites();
    let updated = null;
    const next = items.map((item) => {
      if (!item || item.inviteId !== inviteId) return item;
      updated = updater(item);
      return updated;
    });
    writeInvites(next);
    return updated;
  }
  function recordCollaboration(type, invite, extra){
    if (!window.HistoryApi || typeof window.HistoryApi.record !== "function") return null;
    const sec = security();
    const payloadInput = Object.assign({}, invite || {}, extra || {});
    const payload = sec && sec.createCollaborationAuditPayload ? sec.createCollaborationAuditPayload(payloadInput) : payloadInput;
    return window.HistoryApi.record(type, payload);
  }
  function options(items, selected){
    return items.map((item) => {
      const value = typeof item === "string" ? item : item.value || item.orgId;
      const label = typeof item === "string" ? item : item.label || item.name || value;
      return `<option value="${esc(value)}"${value === selected ? " selected" : ""}>${esc(label)}</option>`;
    }).join("");
  }
  function renderMembers(members){
    return members.map(m=>`<div class="ws-card"><b>${esc(m.email)}</b><p>${esc(m.role)} · ${esc(m.status)}</p></div>`).join("") || `<div class="ws-card">${t("noMembers")}</div>`;
  }
  function renderInvites(){
    const invites = readInvites();
    if (!invites.length) return `<div class="ws-card">暂无企业协作邀请。</div>`;
    return invites.map((invite) => {
      const status = STATUS_LABEL[invite.status] || invite.status || "";
      const blocked = invite.status === "blocked";
      return `<div class="ws-card" data-invite-card="${esc(invite.inviteId)}">
        <div class="ws-row" style="justify-content:space-between;align-items:flex-start">
          <div>
            <b>${esc(invite.projectName || "未命名企业项目")}</b>
            <p class="ws-muted">${esc(invite.projectScope || "project")} · ${esc(invite.ownerOrgName || "")} -> ${esc(invite.invitedOrgName || "")}</p>
          </div>
          <span class="tag">${esc(status)}</span>
        </div>
        <p>${esc(invite.inviteeName || "未填写被邀请人")} · ${esc(invite.inviteeRole || "查看者")}</p>
        <p class="ws-muted">邀请时间：${esc(localTime(invite.createdAt))}${invite.joinedAt ? " · 加入：" + esc(localTime(invite.joinedAt)) : ""}${invite.leftAt ? " · 离开：" + esc(localTime(invite.leftAt)) : ""}</p>
        ${invite.reason ? `<p class="ws-muted">授权结果：${esc(invite.reason)}</p>` : ""}
        ${invite.note ? `<p class="ws-muted">最近备注：${esc(summarize(invite.note, 180))}</p>` : ""}
        <textarea class="ws-textarea" data-note-input="${esc(invite.inviteId)}" placeholder="添加协作备注"></textarea>
        <div class="ws-row">
          <button type="button" class="ws-btn" data-collab-action="join" data-invite-id="${esc(invite.inviteId)}"${blocked ? " disabled" : ""}>标记加入</button>
          <button type="button" class="ws-btn gray" data-collab-action="leave" data-invite-id="${esc(invite.inviteId)}"${blocked ? " disabled" : ""}>标记离开</button>
          <button type="button" class="ws-btn gray" data-collab-action="reject" data-invite-id="${esc(invite.inviteId)}"${blocked ? " disabled" : ""}>拒绝邀请</button>
          <button type="button" class="ws-btn gray" data-collab-action="message" data-invite-id="${esc(invite.inviteId)}">添加协作备注</button>
        </div>
      </div>`;
    }).join("");
  }
  function collaborationForm(){
    const orgs = orgCatalog();
    return `<div class="ws-card">
      <h3>企业协作邀请</h3>
      <p class="ws-muted">本地 MVP：按项目数据范围和组织授权判断邀请，并写入审计历史。</p>
      <input id="collabProjectName" class="ws-input" placeholder="项目名称">
      <div class="ws-row">
        <select id="collabProjectType" class="ws-select">${options(PROJECT_TYPES, "project")}</select>
        <select id="collabOwnerOrg" class="ws-select">${options(orgs, "org-exec")}</select>
        <select id="collabInvitedOrg" class="ws-select">${options(orgs, "org-tech")}</select>
      </div>
      <div class="ws-row">
        <input id="collabInviteeName" class="ws-input" placeholder="被邀请人姓名">
        <select id="collabInviteeRole" class="ws-select">${options(INVITEE_ROLES, "查看者")}</select>
      </div>
      <textarea id="collabNote" class="ws-textarea" placeholder="邀请说明 / 协作备注"></textarea>
      <div class="ws-row"><button id="sendCollabInvite" type="button" class="ws-btn">发送邀请</button><span id="collabStatus" class="ws-muted"></span></div>
    </div>`;
  }
  function createCollaborationInvite(){
    const sec = security();
    const principal = sec && sec.getCurrentSecurityPrincipal ? sec.getCurrentSecurityPrincipal() : {};
    const projectName = document.getElementById("collabProjectName").value.trim() || "未命名企业项目";
    const projectType = document.getElementById("collabProjectType").value;
    const ownerOrgId = document.getElementById("collabOwnerOrg").value;
    const invitedOrgId = document.getElementById("collabInvitedOrg").value;
    const inviteeName = document.getElementById("collabInviteeName").value.trim() || "未填写被邀请人";
    const inviteeRole = document.getElementById("collabInviteeRole").value;
    const rawNote = document.getElementById("collabNote").value;
    const note = sec && sec.sanitizeCollaborationNote ? sec.sanitizeCollaborationNote(rawNote) : summarize(rawNote, 1000);
    const projectScope = sec && sec.inferProjectScope ? sec.inferProjectScope(projectType) : projectType;
    const decision = sec && sec.canInviteOrganization ? sec.canInviteOrganization(principal, projectScope, invitedOrgId) : { allowed:true, reason:"allowed", projectScope, orgId:invitedOrgId, orgName:orgById(invitedOrgId).name };
    const ownerOrg = orgById(ownerOrgId);
    const invitedOrg = orgById(invitedOrgId);
    const createdAt = nowIso();
    const invite = {
      inviteId:createId("invite"),
      projectId:createId("project"),
      projectName,
      projectScope,
      ownerOrgId,
      ownerOrgName:ownerOrg.name,
      invitedOrgId,
      invitedOrgName:invitedOrg.name,
      inviteeName,
      inviteeRole,
      status:decision.allowed ? "invited" : "blocked",
      note,
      createdAt,
      joinedAt:"",
      leftAt:"",
      updatedAt:createdAt,
      createdByUserId:principal.userId || "local-user",
      createdByName:principal.displayName || "Local User",
      result:decision.allowed ? "allowed" : "blocked",
      reason:decision.reason || ""
    };
    saveInvite(invite);
    recordCollaboration(decision.allowed ? "collaboration.invite" : "collaboration.inviteBlocked", invite, {
      action:decision.allowed ? "invite" : "inviteBlocked",
      status:decision.allowed ? "done" : "failed",
      result:decision.allowed ? "allowed" : "blocked",
      reason:decision.reason,
      inputSummary:projectName,
      outputSummary:decision.reason
    });
    const status = document.getElementById("collabStatus");
    if (status) status.textContent = decision.reason || (decision.allowed ? "邀请已记录。" : "邀请已拦截。");
    renderInviteList();
  }
  function renderInviteList(){
    const list = document.getElementById("collabInviteList");
    if (list) list.innerHTML = renderInvites();
  }
  function handleInviteAction(target){
    const inviteId = target.getAttribute("data-invite-id") || "";
    const action = target.getAttribute("data-collab-action") || "";
    const current = readInvites().find((invite) => invite && invite.inviteId === inviteId);
    if (!current) return;
    const noteInput = Array.from(document.querySelectorAll("[data-note-input]")).find((node) => node.getAttribute("data-note-input") === inviteId);
    const sec = security();
    const note = noteInput && noteInput.value ? (sec && sec.sanitizeCollaborationNote ? sec.sanitizeCollaborationNote(noteInput.value) : summarize(noteInput.value, 1000)) : current.note;
    const stamp = nowIso();
    const statusMap = { join:"joined", leave:"left", reject:"rejected", message:current.status };
    const historyType = { join:"collaboration.join", leave:"collaboration.leave", reject:"collaboration.reject", message:"collaboration.message" }[action];
    const actionName = { join:"join", leave:"leave", reject:"reject", message:"message" }[action] || action;
    const updated = updateInvite(inviteId, (invite) => Object.assign({}, invite, {
      status:statusMap[action] || invite.status,
      note,
      joinedAt:action === "join" ? stamp : invite.joinedAt,
      leftAt:action === "leave" ? stamp : invite.leftAt,
      updatedAt:stamp,
      result:actionName,
      reason:action === "message" ? "协作备注已记录。" : "协作状态已更新。"
    }));
    if (updated && historyType) {
      recordCollaboration(historyType, updated, {
        action:actionName,
        status:"done",
        result:actionName,
        createdAt:stamp,
        noteSummary:note,
        reason:updated.reason,
        inputSummary:updated.projectName,
        outputSummary:updated.reason
      });
    }
    renderInviteList();
  }
  function mount(host){
    const sec = security();
    if(sec && sec.recordModuleViewOnce) sec.recordModuleViewOnce("team");
    const members=window.TeamApi.members();
    host.innerHTML=`<section class="ws-page">
      <div class="ws-card">
        <h2>${t("team")}</h2>
        <p class="ws-muted">${t("teamDesc")}</p>
        <p class="ws-muted">${esc(notice("team"))}</p>
        <div class="ws-row"><input id="inviteEmail" class="ws-input" placeholder="${t("memberEmail")}"><button id="inviteBtn" type="button" class="ws-btn">${t("inviteMember")}</button></div>
      </div>
      ${collaborationForm()}
      <div class="card-list">${renderMembers(members)}</div>
      <div class="card-list" id="collabInviteList">${renderInvites()}</div>
    </section>`;
    if(sec && sec.bindModuleCopyAudit) sec.bindModuleCopyAudit(host, "team");
    document.getElementById("inviteBtn").addEventListener("click",()=>{
      const r=window.TeamApi.invite(document.getElementById("inviteEmail").value);
      if(!r.ok && window.WeishanUserNotice) window.WeishanUserNotice.show(host, r.error, { error:true });
      else window.WeishanRouter.refresh();
    });
    document.getElementById("sendCollabInvite").addEventListener("click", createCollaborationInvite);
    host.addEventListener("click", (ev) => {
      const button = ev.target && ev.target.closest ? ev.target.closest("[data-collab-action]") : null;
      if (button) handleInviteAction(button);
    });
  }
  window.TeamPage = { mount };
})();
