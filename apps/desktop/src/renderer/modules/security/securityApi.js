(function(){
  function checks(){ return [
    { name:"客户数据", status:"本地优先", detail:"默认不上传客户数据。" },
    { name:"AI Key", status:window.WeishanPermissions.isLoggedIn() ? "账号隔离" : "未登录锁定", detail:"登录后按账号保存。" },
    { name:"企业 token", status:"预留", detail:"仅企业项目使用，不得用于私人任务。" },
    { name:"bug 信息", status:"确认后上传", detail:"自动修复和 bug 上传必须确认。" },
    { name:"清空", status:"三次确认", detail:"只清空当前用户本软件内容。" }
  ]; }
  window.SecurityApi = { checks };
})();
