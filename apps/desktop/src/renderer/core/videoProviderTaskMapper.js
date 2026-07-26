(function(){
  const MAP={CREATED:"PREPARING",PREPARING:"PREPARING",QUEUED:"QUEUED",RUNNING:"GENERATING",GENERATING:"GENERATING",POST_PROCESSING:"POST_PROCESSING",SUCCEEDED:"COMPLETED",COMPLETED:"COMPLETED",FAILED:"FAILED",CANCELLED:"CANCELLED"};
  function mapVideoProviderTask(value){const source=value&&typeof value==="object"?value:{};return{taskId:typeof source.taskId==="string"?source.taskId.slice(0,80):"",title:typeof source.title==="string"?source.title.slice(0,80):"",status:MAP[source.status]||"FAILED",progress:Number.isFinite(source.progress)?Math.max(0,Math.min(100,source.progress)):null,resultTypes:Array.isArray(source.resultTypes)?source.resultTypes.filter((item)=>typeof item==="string").slice(0,1):[],createdAt:typeof source.createdAt==="string"?source.createdAt.slice(0,80):"",updatedAt:typeof source.updatedAt==="string"?source.updatedAt.slice(0,80):""};}
  window.WeishanVideoProviderTaskMapper={MAP,mapVideoProviderTask};
})();
