(function(){
  function text(value){ return String(value == null ? "" : value).trim(); }
  function ensure(condition, code){ if (!condition) { const error = new Error(code); error.code = code; throw error; } }
  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function terminal(status){ return ["COMPLETED", "FAILED", "CANCELLED"].includes(status); }
  function createVideoRuntimeProviderBridge(options){
    const config = options && typeof options === "object" ? options : {};
    const runtime = config.runtime;
    const host = config.host;
    ensure(runtime && host, "bridge_dependencies_required");
    const repository = config.repository || runtime.createInMemoryTaskRepository();
    const orchestrator = config.orchestrator || runtime.createTaskOrchestrator({ repository, providerSelector:{ select:() => ({ providerId:"local-development" }) } });
    const mappings = new Map();
    let disposed = false;
    let sequence = 0;
    function active(){ ensure(!disposed, "GATEWAY_DISPOSED"); }
    function id(){ sequence += 1; return "video-task-" + String(sequence).padStart(6, "0"); }
    function mapArtifacts(taskId, artifacts){ return (Array.isArray(artifacts) ? artifacts : []).map((artifact, index) => ({ artifactId:taskId + "-artifact-" + String(index + 1).padStart(3, "0"), taskId, type:text(artifact && artifact.type) || "video", title:text(artifact && artifact.name) || "视频结果", metadata:{} })); }
    function providerStatus(result){ const value = text(result && result.status); return value === "FAILED" ? "FAILED" : value === "CANCELLED" ? "CANCELLED" : value === "SUCCEEDED" ? "COMPLETED" : value === "RUNNING" ? "GENERATING" : value === "QUEUED" ? "QUEUED" : "FAILED"; }
    function update(taskId, result){
      let task = orchestrator.getTask(taskId); const target = providerStatus(result);
      if (terminal(task.status)) return task;
      if (target === "FAILED") return orchestrator.failTask(taskId, { code:"PROVIDER" });
      if (target === "CANCELLED") return orchestrator.cancelTask(taskId);
      if (target === "QUEUED") return task.status === "PREPARING" ? orchestrator.refreshTask(taskId, { status:"QUEUED" }) : task;
      if (target === "GENERATING") { if (task.status === "PREPARING") task = orchestrator.refreshTask(taskId, { status:"QUEUED" }); return task.status === "QUEUED" ? orchestrator.refreshTask(taskId, { status:"GENERATING" }) : task; }
      if (target === "COMPLETED") {
        if (task.status === "PREPARING") task = orchestrator.refreshTask(taskId, { status:"QUEUED" });
        if (task.status === "QUEUED") task = orchestrator.refreshTask(taskId, { status:"GENERATING" });
        if (task.status === "GENERATING") task = orchestrator.refreshTask(taskId, { status:"POST_PROCESSING" });
        return task.status === "POST_PROCESSING" ? orchestrator.completeTask(taskId, mapArtifacts(taskId, result.artifacts)) : task;
      }
      return task;
    }
    function submitRuntimeTask(input){ active(); const taskId = id(); let task = orchestrator.createTask({ taskId, title:text(input && input.title), userPrompt:text(input && input.prompt), createdAt:"local-runtime" }); task = orchestrator.startTask(taskId); try { const result = host.submitTask(config.providerId, clone(input || {})); mappings.set(taskId, { providerId:config.providerId, providerTaskId:text(result.providerTaskId), createdAt:"local-runtime", updatedAt:"local-runtime" }); return clone(update(taskId, result)); } catch (error) { orchestrator.failTask(taskId, { code:"PROVIDER" }); throw error; } }
    function mapping(taskId){ const value = mappings.get(text(taskId)); ensure(value, "TASK_NOT_FOUND"); return value; }
    function refreshRuntimeTask(taskId){ active(); const current = orchestrator.getTask(text(taskId)); if (terminal(current.status)) return clone(current); const link = mapping(taskId); try { return clone(update(taskId, host.queryTask(link.providerId, link.providerTaskId))); } catch (error) { orchestrator.failTask(taskId, { code:"PROVIDER" }); throw error; } }
    function cancelRuntimeTask(taskId){ active(); const current = orchestrator.getTask(text(taskId)); ensure(!terminal(current.status), "TASK_NOT_ACTIVE"); const link = mapping(taskId); host.cancelTask(link.providerId, link.providerTaskId); return clone(orchestrator.cancelTask(taskId)); }
    function downloadRuntimeArtifacts(taskId){ active(); const link = mapping(taskId); const artifacts = host.downloadArtifacts(link.providerId, link.providerTaskId); return mapArtifacts(taskId, artifacts); }
    function getRuntimeTask(taskId){ active(); const task = repository.get(text(taskId)); return task ? clone(task) : null; }
    function listRuntimeTasks(){ active(); return repository.list().map(clone); }
    function dispose(){ if (disposed) return; mappings.clear(); disposed = true; }
    return { submitRuntimeTask, refreshRuntimeTask, cancelRuntimeTask, downloadRuntimeArtifacts, getRuntimeTask, listRuntimeTasks, dispose };
  }
  window.WeishanVideoRuntimeProviderBridge = { createVideoRuntimeProviderBridge };
})();
