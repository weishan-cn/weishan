(function(){
  function t(key){ return window.I18n && typeof window.I18n.t === "function" ? window.I18n.t(key) : key; }
  function developmentPanel(){
    return `<section data-video-development-panel="true" class="ws-card" aria-label="本地开发模式"><h3>本地开发模式</h3><p aria-live="polite">本地模拟，不会生成真实视频</p><label>标题<input data-video-dev-title></label><label>Prompt<textarea data-video-dev-prompt></textarea></label><label>负向 Prompt<input data-video-dev-negative-prompt></label><label>时长<input data-video-dev-duration type="number"></label><label>分辨率<input data-video-dev-resolution></label><label>FPS<input data-video-dev-fps type="number"></label><button type="button" data-video-dev-create>创建任务</button><button type="button" data-video-dev-refresh>刷新任务</button><button type="button" data-video-dev-cancel>取消任务</button><button type="button" data-video-dev-list>刷新列表</button><button type="button" data-video-dev-artifacts>查看占位 Artifact</button><p data-video-dev-status role="status" aria-live="polite"></p><p data-video-dev-error role="alert"></p><div data-video-dev-tasks></div></section>`;
  }
  function bindDevelopmentPanel(host, controller){
    const panel=host.querySelector("[data-video-development-panel]"); if(!panel)return; const status=panel.querySelector("[data-video-dev-status]"); const output=panel.querySelector("[data-video-dev-tasks]"); const render=(state)=>{ status.textContent=state.statusText; output.textContent=(state.tasks||[]).map((item)=>item.title+" · "+item.status).join("\n"); };
    controller.subscribe(render); controller.initialize().then(render); panel.querySelector("[data-video-dev-create]").addEventListener("click",()=>controller.createTask({title:panel.querySelector("[data-video-dev-title]").value,prompt:panel.querySelector("[data-video-dev-prompt]").value,negativePrompt:panel.querySelector("[data-video-dev-negative-prompt]").value,duration:Number(panel.querySelector("[data-video-dev-duration]").value)||null,resolution:panel.querySelector("[data-video-dev-resolution]").value,fps:Number(panel.querySelector("[data-video-dev-fps]").value)||null}).catch(()=>{})); panel.querySelector("[data-video-dev-refresh]").addEventListener("click",()=>{const state=controller.getState();if(state.activeTask)controller.refreshTask(state.activeTask.taskId).catch(()=>{});}); panel.querySelector("[data-video-dev-cancel]").addEventListener("click",()=>{const state=controller.getState();if(state.activeTask)controller.cancelTask(state.activeTask.taskId).catch(()=>{});}); panel.querySelector("[data-video-dev-list]").addEventListener("click",()=>controller.refreshTaskList());
  }
  function mount(host, options){
    host.innerHTML = `<section class="ws-page video-plugin-workspace" id="videoPluginWorkspace" data-plugin-runtime="unavailable" data-plugin-task-count="0">
      <header class="ws-card video-plugin-hero"><div><h2>${t("videoPluginWorkspace")}</h2><p>${t("videoPluginSubtitle")}</p></div><span class="video-plugin-status">${t("pluginStatusComingSoon")}</span></header>
      <section class="video-plugin-layout" aria-label="${t("videoPluginWorkspace")}">
        <section class="ws-card video-plugin-simple" data-video-simple-mode>
          <div class="video-plugin-section-head"><h3>${t("videoSimpleMode")}</h3><p>${t("videoSimpleModeHint")}</p></div>
          <label class="video-plugin-label" for="videoPrompt">${t("videoPromptLabel")}</label>
          <textarea id="videoPrompt" class="video-plugin-prompt" rows="5" placeholder="${t("videoPromptPlaceholder")}"></textarea>
          <div class="video-plugin-materials"><div><b>${t("videoMaterialsLabel")}</b><p>${t("videoMaterialsHint")}</p><div class="video-plugin-material-types"><span>${t("videoMaterialImage")}</span><span>${t("videoMaterialVideo")}</span><span>${t("videoMaterialAudio")}</span></div></div><button type="button" class="ws-btn video-plugin-material-button" disabled aria-disabled="true">${t("videoAddMaterials")}</button></div>
          <button type="button" class="ws-btn primary video-plugin-generate" disabled aria-disabled="true">${t("videoGenerate")}</button>
          <p class="video-plugin-runtime-note" role="status">${t("videoRuntimeUnavailable")}</p>
        </section>
        <aside class="ws-card video-plugin-preview" aria-label="${t("videoPreviewTitle")}"><h3>${t("videoPreviewTitle")}</h3><div class="video-plugin-preview-empty"><span aria-hidden="true">▹</span><p>${t("videoPreviewUnavailable")}</p></div></aside>
      </section>
      <details class="ws-card video-plugin-advanced" data-video-advanced>
        <summary>${t("videoAdvancedSettings")}</summary>
        <p class="ws-muted">${t("videoAdvancedNotice")}</p>
        <div class="video-plugin-advanced-grid">
          <section data-advanced-group="creation"><h3>${t("videoAdvancedCreation")}</h3><div>${["videoDuration", "videoAspectRatio", "videoResolution", "videoStyle", "videoShots", "videoQuality", "videoCount"].map((key) => `<button type="button" disabled>${t(key)}</button>`).join("")}</div></section>
          <section data-advanced-group="reference"><h3>${t("videoAdvancedReference")}</h3><div>${["videoReferenceImage", "videoReferenceVideo", "videoCharacterConsistency"].map((key) => `<button type="button" disabled>${t(key)}</button>`).join("")}</div></section>
          <section data-advanced-group="audio"><h3>${t("videoAdvancedAudio")}</h3><div>${["videoSubtitles", "videoVoiceover", "videoBackgroundMusic", "videoLanguage"].map((key) => `<button type="button" disabled>${t(key)}</button>`).join("")}</div></section>
          <section data-advanced-group="technical"><h3>${t("videoAdvancedTechnical")}</h3><div>${["videoModel", "videoSeed", "videoFps", "videoCodec", "videoBitrate"].map((key) => `<button type="button" disabled>${t(key)}</button>`).join("")}</div></section>
        </div>
      </details>
    </section>${options && options.workspaceIntegration===true && options.pluginEnabled===true && options.controller ? developmentPanel() : ""}`;
    if(options && options.workspaceIntegration===true && options.pluginEnabled===true && options.controller) bindDevelopmentPanel(host,options.controller);
  }
  window.VideoPluginWorkspace = { mount };
})();
