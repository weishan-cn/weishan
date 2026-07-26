(function(){
  const MESSAGES={INVALID_REQUEST:"请检查创作信息",NOT_SUPPORTED:"当前服务暂不支持此功能",SERVICE_UNAVAILABLE:"视频服务暂不可用",RATE_LIMITED:"请求过于频繁，请稍后重试",AUTH_REQUIRED:"需要完成服务授权",TASK_NOT_FOUND:"未找到任务",TASK_CANCELLED:"任务已取消",INTERNAL_ERROR:"失败，请重试"};
  function createVideoProviderError(value){const code=value&&MESSAGES[value.code]?value.code:"INTERNAL_ERROR";return{code,message:MESSAGES[code],retryable:["SERVICE_UNAVAILABLE","RATE_LIMITED","INTERNAL_ERROR"].includes(code)};}
  window.WeishanVideoProviderErrors={MESSAGES,createVideoProviderError};
})();
