(function(){
  const V=window.WeishanVideoWorkspaceViewModel,T=window.WeishanVideoWorkspaceTimeline,A=window.WeishanVideoWorkspaceArtifacts,R=window.WeishanVideoWorkspaceRuntimeStatus,D=window.WeishanVideoWorkspaceDiagnostics;
  function createVideoWorkspacePresenter(state,options){const model=V.createVideoWorkspaceViewModel(state);const selected=model.selectedTask;return Object.freeze({header:{title:"本地开发模式",note:"本地模拟，不会生成真实视频"},runtime:R.createVideoWorkspaceRuntimeStatus(model.runtimeStatus),draft:model.draft,validation:model.validation,tasks:model.visibleTasks,selectedTask:selected,timeline:selected?T.createVideoWorkspaceTimeline(selected):[],artifacts:A.createVideoWorkspaceArtifactPreviews(model.artifacts),controls:model.controls,error:model.error,diagnostics:D.createVideoWorkspaceDiagnostics(state,options&&options.eventBus)});}
  window.WeishanVideoWorkspacePresenter={createVideoWorkspacePresenter};
})();
