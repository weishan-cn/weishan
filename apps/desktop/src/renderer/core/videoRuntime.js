(function(){
  const VIDEO_TASK_STATUS = Object.freeze({
    CREATED:"CREATED",
    PREPARING:"PREPARING",
    QUEUED:"QUEUED",
    GENERATING:"GENERATING",
    POST_PROCESSING:"POST_PROCESSING",
    COMPLETED:"COMPLETED",
    FAILED:"FAILED",
    CANCELLED:"CANCELLED"
  });
  const VIDEO_ARTIFACT_TYPES = Object.freeze(["video", "cover", "subtitle", "project", "storyboard", "prompt", "log"]);
  const VIDEO_ERROR_CODES = Object.freeze({
    NETWORK:"NETWORK",
    TIMEOUT:"TIMEOUT",
    AUTH:"AUTH",
    RATE_LIMIT:"RATE_LIMIT",
    UNSUPPORTED:"UNSUPPORTED",
    INVALID_REQUEST:"INVALID_REQUEST",
    PROVIDER:"PROVIDER",
    UNKNOWN:"UNKNOWN"
  });
  const PROVIDER_METHODS = Object.freeze(["createTask", "queryTask", "cancelTask", "downloadArtifacts", "normalizeResult", "normalizeError"]);
  const VIDEO_RUNTIME_EVENT = Object.freeze({
    TASK_CREATED:"TASK_CREATED",
    TASK_STARTED:"TASK_STARTED",
    TASK_UPDATED:"TASK_UPDATED",
    TASK_COMPLETED:"TASK_COMPLETED",
    TASK_FAILED:"TASK_FAILED",
    TASK_CANCELLED:"TASK_CANCELLED"
  });
  const EXECUTION_STATE = Object.freeze({
    IDLE:"IDLE",
    RUNNING:"RUNNING",
    WAITING:"WAITING",
    COMPLETED:"COMPLETED",
    FAILED:"FAILED",
    CANCELLED:"CANCELLED"
  });
  const STATUS_PRESENTATION = Object.freeze({
    CREATED:"准备中……",
    PREPARING:"准备中……",
    QUEUED:"准备中……",
    GENERATING:"正在生成……",
    POST_PROCESSING:"处理中……",
    COMPLETED:"已完成",
    FAILED:"失败，请重试",
    CANCELLED:"已取消"
  });
  const ERROR_PRESENTATION = Object.freeze({
    NETWORK:"网络连接失败",
    TIMEOUT:"请求超时",
    AUTH:"权限不足",
    RATE_LIMIT:"请稍后重试",
    UNSUPPORTED:"当前不支持此功能",
    INVALID_REQUEST:"请检查你的描述后重试",
    PROVIDER:"失败，请重试",
    UNKNOWN:"失败，请重试"
  });
  const TRANSITIONS = Object.freeze({
    CREATED:["PREPARING", "FAILED", "CANCELLED"],
    PREPARING:["QUEUED", "FAILED", "CANCELLED"],
    QUEUED:["GENERATING", "FAILED", "CANCELLED"],
    GENERATING:["POST_PROCESSING", "FAILED", "CANCELLED"],
    POST_PROCESSING:["COMPLETED", "FAILED", "CANCELLED"],
    COMPLETED:[],
    FAILED:[],
    CANCELLED:[]
  });

  function text(value){ return String(value == null ? "" : value).trim(); }
  function nowIso(){ return new Date().toISOString(); }
  function ensure(condition, message){ if (!condition) throw new Error(message); }
  function status(value){
    const next = text(value);
    ensure(Object.prototype.hasOwnProperty.call(VIDEO_TASK_STATUS, next), "invalid_video_task_status");
    return next;
  }
  function progress(value){
    if (value == null || value === "") return null;
    const next = Number(value);
    ensure(Number.isFinite(next) && next >= 0 && next <= 100, "invalid_video_task_progress");
    return next;
  }
  function errorCode(value){
    const next = text(value || VIDEO_ERROR_CODES.UNKNOWN);
    return Object.prototype.hasOwnProperty.call(VIDEO_ERROR_CODES, next) ? next : VIDEO_ERROR_CODES.UNKNOWN;
  }
  function clone(value){ return JSON.parse(JSON.stringify(value)); }

  function normalizeVideoError(input){
    const data = input && typeof input === "object" ? input : { code:input };
    const code = errorCode(data.code);
    return { code, userMessage:ERROR_PRESENTATION[code] };
  }

  function createVideoArtifact(input){
    const data = input && typeof input === "object" ? input : {};
    const type = text(data.type);
    ensure(VIDEO_ARTIFACT_TYPES.includes(type), "invalid_video_artifact_type");
    const artifactId = text(data.artifactId);
    ensure(artifactId, "missing_video_artifact_id");
    return {
      artifactId,
      taskId:text(data.taskId) || null,
      type,
      title:text(data.title) || type,
      createdAt:text(data.createdAt) || nowIso(),
      metadata:data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata) ? clone(data.metadata) : {}
    };
  }

  function createVideoTask(input){
    const data = input && typeof input === "object" ? input : {};
    const taskId = text(data.taskId);
    const userPrompt = text(data.userPrompt);
    ensure(taskId, "missing_video_task_id");
    ensure(userPrompt, "missing_video_user_prompt");
    const createdAt = text(data.createdAt) || nowIso();
    return {
      taskId,
      title:text(data.title) || userPrompt.slice(0, 80),
      userPrompt,
      optimizedPrompt:text(data.optimizedPrompt) || null,
      status:VIDEO_TASK_STATUS.CREATED,
      progress:null,
      provider:null,
      createdAt,
      updatedAt:text(data.updatedAt) || createdAt,
      artifacts:[],
      error:null
    };
  }

  function transitionVideoTask(task, nextStatus, patch){
    const current = task && typeof task === "object" ? task : {};
    const from = status(current.status);
    const next = status(nextStatus);
    ensure(canTransition(from, next), "invalid_video_task_transition");
    const data = patch && typeof patch === "object" ? patch : {};
    const nextArtifacts = data.artifacts === undefined ? current.artifacts : data.artifacts;
    ensure(Array.isArray(nextArtifacts), "invalid_video_task_artifacts");
    return Object.assign({}, current, {
      status:next,
      progress:data.progress === undefined ? progress(current.progress) : progress(data.progress),
      optimizedPrompt:data.optimizedPrompt === undefined ? current.optimizedPrompt : (text(data.optimizedPrompt) || null),
      provider:data.provider === undefined ? current.provider : (text(data.provider) || null),
      artifacts:nextArtifacts.map(createVideoArtifact),
      error:next === VIDEO_TASK_STATUS.FAILED ? normalizeVideoError(data.error || current.error) : null,
      updatedAt:text(data.updatedAt) || nowIso()
    });
  }

  function canTransition(fromStatus, nextStatus){
    const from = status(fromStatus);
    const next = status(nextStatus);
    return TRANSITIONS[from].includes(next);
  }

  function taskPresentation(task){
    const current = task && typeof task === "object" ? task : {};
    const currentStatus = status(current.status);
    return { status:STATUS_PRESENTATION[currentStatus], progress:progress(current.progress) };
  }

  function validateProviderInterface(candidate){
    const provider = candidate && typeof candidate === "object" ? candidate : {};
    const missing = PROVIDER_METHODS.filter((name) => typeof provider[name] !== "function");
    return {
      valid:text(provider.providerId).length > 0 && missing.length === 0,
      missingMethods:missing,
      providerId:text(provider.providerId) || null
    };
  }

  function createInMemoryTaskRepository(){
    const tasks = new Map();
    function save(task){
      ensure(task && typeof task === "object" && text(task.taskId), "invalid_video_task");
      tasks.set(task.taskId, clone(task));
      return clone(task);
    }
    function get(taskId){
      const task = tasks.get(text(taskId));
      return task ? clone(task) : null;
    }
    function update(taskId, task){
      ensure(tasks.has(text(taskId)), "video_task_not_found");
      ensure(task && text(task.taskId) === text(taskId), "video_task_id_mismatch");
      return save(task);
    }
    function remove(taskId){ return tasks.delete(text(taskId)); }
    function list(){ return Array.from(tasks.values()).map(clone); }
    return { save, get, update, remove, list };
  }

  function createRuntimeEventBus(){
    const listeners = new Set();
    const events = [];
    const knownEvents = new Set(Object.values(VIDEO_RUNTIME_EVENT));
    function emit(type, task){
      ensure(knownEvents.has(type), "invalid_video_runtime_event");
      const event = { type, taskId:text(task && task.taskId), task:clone(task), createdAt:nowIso() };
      events.push(event);
      listeners.forEach((listener) => listener(clone(event)));
      return clone(event);
    }
    function subscribe(listener){
      ensure(typeof listener === "function", "invalid_video_runtime_listener");
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
    function list(){ return events.map(clone); }
    return { emit, subscribe, list };
  }

  function createProviderSelector(){
    const stub = Object.freeze({ providerId:"stub", status:"unavailable", reason:"provider_not_configured" });
    return { select(){ return Object.assign({}, stub); } };
  }

  function createRetryPolicy(){
    return {
      shouldRetry(){ return false; },
      nextDelayMs(){ return null; }
    };
  }

  function createCancelPolicy(){
    return {
      canCancel(task){
        const current = task && typeof task === "object" ? task : {};
        const currentStatus = status(current.status);
        return currentStatus !== VIDEO_TASK_STATUS.COMPLETED && currentStatus !== VIDEO_TASK_STATUS.FAILED && currentStatus !== VIDEO_TASK_STATUS.CANCELLED;
      },
      cancel(task){
        ensure(this.canCancel(task), "video_task_already_terminal");
        return transitionVideoTask(task, VIDEO_TASK_STATUS.CANCELLED);
      }
    };
  }

  function normalizeVideoResult(input, taskId){
    const data = input && typeof input === "object" ? input : {};
    const artifacts = Array.isArray(data.artifacts) ? data.artifacts : [];
    return { artifacts:artifacts.map((artifact) => createVideoArtifact(Object.assign({}, artifact, { taskId:artifact.taskId || taskId }))) };
  }

  function createTaskOrchestrator(options){
    const config = options && typeof options === "object" ? options : {};
    const repository = config.repository || createInMemoryTaskRepository();
    const eventBus = config.eventBus || createRuntimeEventBus();
    const providerSelector = config.providerSelector || createProviderSelector();
    const retryPolicy = config.retryPolicy || createRetryPolicy();
    const cancelPolicy = config.cancelPolicy || createCancelPolicy();
    function requireTask(taskId){
      const task = repository.get(taskId);
      ensure(task, "video_task_not_found");
      return task;
    }
    function persist(task, eventType){
      const saved = repository.get(task.taskId) ? repository.update(task.taskId, task) : repository.save(task);
      eventBus.emit(eventType, saved);
      return saved;
    }
    function createTask(input){ return persist(createVideoTask(input), VIDEO_RUNTIME_EVENT.TASK_CREATED); }
    function startTask(taskId){
      const current = requireTask(taskId);
      const selected = providerSelector.select(current);
      return persist(transitionVideoTask(current, VIDEO_TASK_STATUS.PREPARING, { provider:text(selected.providerId) || null }), VIDEO_RUNTIME_EVENT.TASK_STARTED);
    }
    function refreshTask(taskId, update){
      const current = requireTask(taskId);
      const data = update && typeof update === "object" ? update : {};
      return persist(transitionVideoTask(current, data.status, data), VIDEO_RUNTIME_EVENT.TASK_UPDATED);
    }
    function finalizeArtifacts(taskId, artifacts){
      const current = requireTask(taskId);
      const result = normalizeVideoResult({ artifacts }, current.taskId);
      return persist(transitionVideoTask(current, VIDEO_TASK_STATUS.COMPLETED, result), VIDEO_RUNTIME_EVENT.TASK_COMPLETED);
    }
    function completeTask(taskId, artifacts){ return finalizeArtifacts(taskId, artifacts); }
    function failTask(taskId, error){
      const current = requireTask(taskId);
      return persist(transitionVideoTask(current, VIDEO_TASK_STATUS.FAILED, { error }), VIDEO_RUNTIME_EVENT.TASK_FAILED);
    }
    function cancelTask(taskId){
      const current = requireTask(taskId);
      return persist(cancelPolicy.cancel(current), VIDEO_RUNTIME_EVENT.TASK_CANCELLED);
    }
    return {
      createTask,
      startTask,
      refreshTask,
      cancelTask,
      completeTask,
      failTask,
      finalizeArtifacts,
      normalizeResult:normalizeVideoResult,
      normalizeError:normalizeVideoError,
      getTask:requireTask,
      listTasks:repository.list,
      retryPolicy
    };
  }

  function createCancellationToken(){
    let cancelled = false;
    let cancellationReason = null;
    return {
      get cancelled(){ return cancelled; },
      get reason(){ return cancellationReason; },
      cancel(reason){
        if (cancelled) return false;
        cancelled = true;
        cancellationReason = text(reason) || "cancelled";
        return true;
      },
      throwIfCancelled(){ ensure(!cancelled, "runtime_execution_cancelled"); }
    };
  }

  function createSynchronousScheduler(){
    const jobs = [];
    return {
      schedule(job){
        ensure(typeof job === "function", "invalid_runtime_execution_job");
        jobs.push(job);
        return jobs.length;
      },
      tick(){
        const job = jobs.shift();
        return job ? job() : null;
      },
      clear(){ jobs.splice(0, jobs.length); },
      pendingCount(){ return jobs.length; }
    };
  }

  function createExecutionHooks(input){
    const source = input && typeof input === "object" ? input : {};
    const names = ["beforeExecute", "afterExecute", "beforeComplete", "afterComplete", "beforeFail", "afterFail"];
    const hooks = {};
    names.forEach((name) => { hooks[name] = typeof source[name] === "function" ? source[name] : function(){}; });
    return hooks;
  }

  function createDefaultExecutionPipeline(){
    return {
      prepare(context){ return context; },
      execute(){ return {}; },
      finalize(context, result){ return result || {}; }
    };
  }

  function createExecutionContext(input){
    const data = input && typeof input === "object" ? input : {};
    ensure(data.task && typeof data.task === "object" && text(data.task.taskId), "invalid_runtime_execution_task");
    return {
      task:clone(data.task),
      repository:data.repository || null,
      provider:data.provider || null,
      eventBus:data.eventBus || null,
      cancellationToken:data.cancellationToken || createCancellationToken(),
      orchestrator:data.orchestrator || null,
      runtimeMetadata:data.runtimeMetadata && typeof data.runtimeMetadata === "object" && !Array.isArray(data.runtimeMetadata) ? clone(data.runtimeMetadata) : {}
    };
  }

  function createRuntimeExecutionEngine(options){
    const config = options && typeof options === "object" ? options : {};
    const scheduler = config.scheduler || createSynchronousScheduler();
    const pipeline = Object.assign(createDefaultExecutionPipeline(), config.pipeline || {});
    const hooks = createExecutionHooks(config.hooks);
    ["prepare", "execute", "finalize"].forEach((name) => ensure(typeof pipeline[name] === "function", "invalid_runtime_execution_pipeline"));
    let executionState = EXECUTION_STATE.IDLE;
    let context = null;
    let result = null;
    let failure = null;

    function state(){ return executionState; }
    function currentContext(){ return context; }
    function active(){ return executionState === EXECUTION_STATE.WAITING || executionState === EXECUTION_STATE.RUNNING; }
    function submit(input){
      ensure(executionState === EXECUTION_STATE.IDLE, "runtime_execution_not_idle");
      context = createExecutionContext(input);
      if (context.orchestrator && typeof context.orchestrator.startTask === "function") context.task = context.orchestrator.startTask(context.task.taskId);
      context = pipeline.prepare(context) || context;
      ensure(context && typeof context === "object" && context.cancellationToken, "invalid_runtime_execution_context");
      executionState = EXECUTION_STATE.WAITING;
      scheduler.schedule(() => execute());
      return currentContext();
    }
    function execute(){
      ensure(executionState === EXECUTION_STATE.WAITING, "runtime_execution_not_waiting");
      context.cancellationToken.throwIfCancelled();
      executionState = EXECUTION_STATE.RUNNING;
      hooks.beforeExecute(context);
      try {
        result = pipeline.execute(context) || {};
        hooks.afterExecute(context, result);
        return result;
      } catch (_) {
        return fail({ code:VIDEO_ERROR_CODES.UNKNOWN });
      }
    }
    function tick(){
      ensure(executionState === EXECUTION_STATE.WAITING, "runtime_execution_not_waiting");
      return scheduler.tick();
    }
    function complete(nextResult){
      ensure(executionState === EXECUTION_STATE.RUNNING, "runtime_execution_not_running");
      result = nextResult === undefined ? result : nextResult;
      hooks.beforeComplete(context, result);
      result = pipeline.finalize(context, result || {}) || {};
      if (context.orchestrator && typeof context.orchestrator.completeTask === "function") {
        context.task = context.orchestrator.completeTask(context.task.taskId, Array.isArray(result.artifacts) ? result.artifacts : []);
      }
      executionState = EXECUTION_STATE.COMPLETED;
      hooks.afterComplete(context, result);
      return result;
    }
    function fail(error){
      ensure(active(), "runtime_execution_not_active");
      failure = normalizeVideoError(error);
      hooks.beforeFail(context, failure);
      if (context.orchestrator && typeof context.orchestrator.failTask === "function") context.task = context.orchestrator.failTask(context.task.taskId, failure);
      executionState = EXECUTION_STATE.FAILED;
      hooks.afterFail(context, failure);
      return failure;
    }
    function cancel(reason){
      ensure(active(), "runtime_execution_not_active");
      context.cancellationToken.cancel(reason);
      if (context.orchestrator && typeof context.orchestrator.cancelTask === "function") context.task = context.orchestrator.cancelTask(context.task.taskId);
      executionState = EXECUTION_STATE.CANCELLED;
      return currentContext();
    }
    function dispose(){
      scheduler.clear();
      context = null;
      result = null;
      failure = null;
      executionState = EXECUTION_STATE.IDLE;
    }
    return { submit, execute, tick, cancel, complete, fail, dispose, state, currentContext, scheduler, pipeline, hooks, get result(){ return result; }, get error(){ return failure; } };
  }

  function simulationArtifacts(taskId){
    return [
      { artifactId:"local-video", taskId, type:"video", title:"模拟视频", metadata:{ placeholderFile:"video.mp4", simulated:true } },
      { artifactId:"local-cover", taskId, type:"cover", title:"模拟封面", metadata:{ placeholderFile:"cover.png", simulated:true } },
      { artifactId:"local-storyboard", taskId, type:"storyboard", title:"模拟分镜", metadata:{ placeholderFile:"storyboard.md", simulated:true } },
      { artifactId:"local-prompt", taskId, type:"prompt", title:"模拟提示词", metadata:{ placeholderFile:"prompt.txt", simulated:true } },
      { artifactId:"local-log", taskId, type:"log", title:"模拟日志", metadata:{ placeholderFile:"log.txt", simulated:true } }
    ];
  }

  function createLocalProviderStub(){
    return {
      providerId:"local-runtime-simulator",
      createTask(){ return { providerTaskId:"local-simulator-task", status:"accepted" }; },
      queryTask(){ return { providerTaskId:"local-simulator-task", status:"ready" }; },
      cancelTask(){ return { providerTaskId:"local-simulator-task", cancelled:true }; },
      downloadArtifacts(taskId){ return simulationArtifacts(taskId); },
      normalizeResult(){ return { status:"ready" }; },
      normalizeError(){ return normalizeVideoError(VIDEO_ERROR_CODES.UNKNOWN); }
    };
  }

  function createLocalRuntimeSimulator(options){
    const config = options && typeof options === "object" ? options : {};
    const repository = config.repository || createInMemoryTaskRepository();
    const eventBus = config.eventBus || createRuntimeEventBus();
    const provider = config.provider || createLocalProviderStub();
    const orchestrator = config.orchestrator || createTaskOrchestrator({ repository, eventBus });
    const engine = config.engine || createRuntimeExecutionEngine({
      pipeline:{
        prepare(context){ return context; },
        execute(context){ return { created:provider.createTask(context.task), current:provider.queryTask(context.task.taskId) }; },
        finalize(context){ return { artifacts:provider.downloadArtifacts(context.task.taskId) }; }
      }
    });
    let activeTaskId = null;
    function currentTask(){ return activeTaskId ? orchestrator.getTask(activeTaskId) : null; }
    function submit(input){
      const task = orchestrator.createTask(input);
      activeTaskId = task.taskId;
      return engine.submit({ task, repository, provider, eventBus, orchestrator, runtimeMetadata:{ simulator:true } });
    }
    function tick(){
      const task = currentTask();
      ensure(task, "local_runtime_simulator_task_missing");
      if (task.status === VIDEO_TASK_STATUS.PREPARING) return orchestrator.refreshTask(task.taskId, { status:VIDEO_TASK_STATUS.QUEUED });
      if (task.status === VIDEO_TASK_STATUS.QUEUED) return orchestrator.refreshTask(task.taskId, { status:VIDEO_TASK_STATUS.GENERATING });
      if (task.status === VIDEO_TASK_STATUS.GENERATING) {
        engine.tick();
        return orchestrator.refreshTask(task.taskId, { status:VIDEO_TASK_STATUS.POST_PROCESSING });
      }
      if (task.status === VIDEO_TASK_STATUS.POST_PROCESSING) {
        engine.complete();
        return currentTask();
      }
      throw new Error("local_runtime_simulator_terminal");
    }
    function fail(error){ return engine.fail(error); }
    function cancel(reason){ return engine.cancel(reason); }
    function dispose(){
      engine.dispose();
      activeTaskId = null;
    }
    return { submit, tick, fail, cancel, dispose, currentTask, repository, eventBus, provider, orchestrator, engine };
  }

  function toVideoTaskDTO(task){
    const current = task && typeof task === "object" ? task : {};
    const presentation = taskPresentation(current);
    return {
      title:text(current.title),
      status:presentation.status,
      progress:presentation.progress,
      resultTypes:Array.isArray(current.artifacts) ? current.artifacts.map((artifact) => text(artifact.type)).filter(Boolean) : [],
      createdAt:text(current.createdAt),
      updatedAt:text(current.updatedAt)
    };
  }

  function createVideoRuntimeFacade(options){
    const config = options && typeof options === "object" ? options : {};
    const featureEnabled = config.featureEnabled === true;
    const simulatorFactory = typeof config.simulatorFactory === "function" ? config.simulatorFactory : createLocalRuntimeSimulator;
    let simulator = config.simulator || null;
    function activeSimulator(){
      if (!simulator) simulator = simulatorFactory();
      return simulator;
    }
    function createVideoTask(input){
      if (!featureEnabled) return null;
      activeSimulator().submit(input);
      return toVideoTaskDTO(activeSimulator().currentTask());
    }
    function queryVideoTask(taskId){
      if (!featureEnabled || !simulator) return null;
      const task = simulator.repository.get(taskId);
      return task ? toVideoTaskDTO(task) : null;
    }
    function cancelVideoTask(taskId, reason){
      if (!featureEnabled || !simulator) return null;
      const current = simulator.currentTask();
      if (!current || current.taskId !== text(taskId)) return null;
      if ([VIDEO_TASK_STATUS.COMPLETED, VIDEO_TASK_STATUS.FAILED, VIDEO_TASK_STATUS.CANCELLED].includes(current.status)) return null;
      simulator.cancel(reason);
      return toVideoTaskDTO(simulator.currentTask());
    }
    function listVideoTasks(){
      if (!featureEnabled || !simulator) return [];
      return simulator.repository.list().map(toVideoTaskDTO);
    }
    return { createVideoTask, queryVideoTask, cancelVideoTask, listVideoTasks };
  }

  function createVideoRuntimeIntegration(options){
    return { facade:createVideoRuntimeFacade(options) };
  }

  window.WeishanVideoRuntime = {
    VIDEO_TASK_STATUS,
    VIDEO_ARTIFACT_TYPES,
    VIDEO_ERROR_CODES,
    PROVIDER_METHODS,
    VIDEO_RUNTIME_EVENT,
    EXECUTION_STATE,
    createVideoTask,
    createVideoArtifact,
    normalizeVideoError,
    taskPresentation,
    validateProviderInterface,
    canTransition,
    createInMemoryTaskRepository,
    createRuntimeEventBus,
    createProviderSelector,
    createRetryPolicy,
    createCancelPolicy,
    createTaskOrchestrator,
    createCancellationToken,
    createSynchronousScheduler,
    createExecutionHooks,
    createDefaultExecutionPipeline,
    createExecutionContext,
    createRuntimeExecutionEngine,
    createLocalProviderStub,
    createLocalRuntimeSimulator,
    toVideoTaskDTO,
    createVideoRuntimeFacade,
    createVideoRuntimeIntegration
  };
})();
