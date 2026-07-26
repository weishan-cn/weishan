(function(){
  function terminal(status){ return ["COMPLETED","FAILED","CANCELLED"].includes(status); }
  function statusLabel(status){ return ({PREPARING:"准备中",QUEUED:"等待中",GENERATING:"生成中",POST_PROCESSING:"处理中",COMPLETED:"已完成",FAILED:"失败",CANCELLED:"已取消"})[status]||"失败"; }
  function selectVisibleVideoTasks(state){ const source=state||{}; const filter=source.filters||{}; const sort=source.sort||{}; const query=String(filter.search||"").trim().toLowerCase(); const rows=(source.taskOrder||[]).map((id)=>source.tasks&&source.tasks[id]).filter(Boolean).filter((row)=>{ const active=!terminal(row.status); const matches=filter.status==="ALL"||!filter.status||(filter.status==="ACTIVE"&&active)||row.status===filter.status; return matches&&(!query||String(row.title||"").toLowerCase().includes(query)); }); const field=["createdAt","updatedAt","title","status"].includes(sort.field)?sort.field:"createdAt"; const dir=sort.direction==="asc"?1:-1; return rows.slice().sort((a,b)=>String(a[field]||"").localeCompare(String(b[field]||""))*dir); }
  window.WeishanVideoWorkspaceSelectors={terminal,statusLabel,selectVisibleVideoTasks};
})();
