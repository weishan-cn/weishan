(function(){
  function t(key){ return window.I18n && typeof window.I18n.t === "function" ? window.I18n.t(key) : key; }
  function mount(host){
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
    </section>`;
  }
  window.VideoPluginWorkspace = { mount };
})();
