(function(){
  const NODES=["Created","Queued","Generating","PostProcessing","Completed","Cancelled","Failed"];
  const STATUS={PREPARING:"Created",QUEUED:"Queued",GENERATING:"Generating",POST_PROCESSING:"PostProcessing",COMPLETED:"Completed",CANCELLED:"Cancelled",FAILED:"Failed"};
  function createVideoWorkspaceTimeline(task){ const status=STATUS[task&&task.status]||"Failed"; const target=NODES.indexOf(status); return NODES.map((name,index)=>({id:name,status:name,label:({Created:"已创建",Queued:"等待中",Generating:"生成中",PostProcessing:"处理中",Completed:"已完成",Cancelled:"已取消",Failed:"失败"})[name],state:index<target?"complete":index===target?"current":"pending"})); }
  window.WeishanVideoWorkspaceTimeline={NODES,createVideoWorkspaceTimeline};
})();
