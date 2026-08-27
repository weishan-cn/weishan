(function(){
  const ACCEPTED_MIME = ["image/png", "image/jpeg"];
  let cleanup = null;

  function t(key){ return window.I18n && typeof window.I18n.t === "function" ? window.I18n.t(key) : key; }
  function node(tag, attrs, text){
    const value = document.createElement(tag);
    Object.keys(attrs || {}).forEach((key) => {
      if (key === "class") value.className = attrs[key];
      else if (key === "for") value.htmlFor = attrs[key];
      else if (key === "hidden") value.hidden = attrs[key] === true;
      else if (key === "disabled") value.disabled = attrs[key] === true;
      else value.setAttribute(key, String(attrs[key]));
    });
    if (text !== undefined) value.textContent = text;
    return value;
  }
  function append(parent, ...children){ children.filter(Boolean).forEach((child) => parent.appendChild(child)); return parent; }
  function field(id, label, attrs){
    const wrap = node("label", { class:"image-tools-field", for:id });
    append(wrap, node("span", {}, label), node("input", Object.assign({ id }, attrs || {})));
    return wrap;
  }
  function requestId(sequence){ return "image_tools_" + Date.now().toString(36) + "_" + String(sequence); }
  function outputExtension(mime){ return mime === "image/jpeg" ? "jpg" : "png"; }
  function baseName(name){
    const safe = String(name || "image").replace(/\.[^.]*$/, "").replace(/[^A-Za-z0-9._ -]+/g, "_").trim();
    return (safe || "image").slice(0, 80);
  }
  function errorText(code){
    const map = {
      IMAGE_TOO_LARGE:"imageToolsErrorTooLarge",
      IMAGE_DIMENSIONS_TOO_LARGE:"imageToolsErrorTooLarge",
      OUTPUT_DIMENSIONS_TOO_LARGE:"imageToolsErrorTooLarge",
      UNSUPPORTED_FORMAT:"imageToolsErrorUnsupported",
      UNSUPPORTED_OUTPUT_FORMAT:"imageToolsErrorUnsupported",
      UNSUPPORTED_OR_MALFORMED_IMAGE:"imageToolsErrorOpen",
      EMPTY_IMAGE:"imageToolsErrorOpen",
      INVALID_RESIZE:"imageToolsErrorResize",
      INVALID_CROP:"imageToolsErrorCrop",
      PROCESSING_TIMEOUT:"imageToolsErrorTimeout",
      CANCELLED:"imageToolsStatusCancelled"
    };
    return t(map[String(code || "")] || "imageToolsErrorProcess");
  }

  function build(){
    const page = node("section", { class:"ws-page image-tools-workspace", id:"imageToolsWorkspace", "data-image-tools-state":"empty" });
    const hero = node("header", { class:"ws-card image-tools-hero" });
    append(hero, append(node("div"), node("h2", {}, t("imageToolsName")), node("p", { class:"ws-muted" }, t("imageToolsSubtitle"))), node("span", { class:"image-tools-local-badge" }, t("imageToolsLocalBadge")));

    const preview = node("section", { class:"ws-card image-tools-preview", "aria-labelledby":"imageToolsPreviewTitle" });
    const previewTitle = node("h3", { id:"imageToolsPreviewTitle", tabindex:"-1" }, t("imageToolsPreviewTitle"));
    const empty = node("div", { class:"image-tools-empty", "data-image-tools-empty":"" });
    const input = node("input", { id:"imageToolsFile", type:"file", accept:".png,.jpg,.jpeg,image/png,image/jpeg", hidden:true, "data-image-tools-file":"" });
    const choose = node("button", { type:"button", class:"ws-btn primary", "data-image-tools-choose":"" }, t("imageToolsChoose"));
    append(empty, node("div", { class:"image-tools-empty-icon", "aria-hidden":"true" }, "▧"), node("p", {}, t("imageToolsEmptyHint")), choose, input);
    const image = node("img", { class:"image-tools-image", alt:t("imageToolsPreviewAlt"), hidden:true, "data-image-tools-preview":"" });
    const meta = node("p", { class:"ws-muted image-tools-meta", hidden:true, "data-image-tools-meta":"" });
    append(preview, previewTitle, empty, image, meta);

    const tools = node("section", { class:"ws-card image-tools-controls", hidden:true, "data-image-tools-controls":"", "aria-label":t("imageToolsControls") });
    const resize = node("fieldset", { class:"image-tools-group" });
    const resizeLegend = node("legend", {}, t("imageToolsResize"));
    const resizeGrid = node("div", { class:"image-tools-field-grid" });
    const width = field("imageToolsWidth", t("imageToolsWidth"), { type:"number", min:"1", max:"6000", inputmode:"numeric" });
    const height = field("imageToolsHeight", t("imageToolsHeight"), { type:"number", min:"1", max:"6000", inputmode:"numeric" });
    const aspect = node("label", { class:"image-tools-check" });
    append(aspect, node("input", { type:"checkbox", checked:"checked", "data-image-tools-aspect":"" }), node("span", {}, t("imageToolsKeepAspect")));
    append(resizeGrid, width, height);
    append(resize, resizeLegend, resizeGrid, aspect);

    const crop = node("fieldset", { class:"image-tools-group" });
    const cropToggle = node("label", { class:"image-tools-check" });
    append(cropToggle, node("input", { type:"checkbox", "data-image-tools-crop-toggle":"" }), node("span", {}, t("imageToolsEnableCrop")));
    const cropGrid = node("div", { class:"image-tools-field-grid image-tools-crop-grid", hidden:true, "data-image-tools-crop":"" });
    [["X","imageToolsCropX"],["Y","imageToolsCropY"],[t("imageToolsWidth"),"imageToolsCropWidth"],[t("imageToolsHeight"),"imageToolsCropHeight"]].forEach(([label,id]) => cropGrid.appendChild(field(id, label, { type:"number", min:id.endsWith("X") || id.endsWith("Y") ? "0" : "1", inputmode:"numeric" })));
    append(crop, node("legend", {}, t("imageToolsCrop")), cropToggle, cropGrid);

    const adjust = node("fieldset", { class:"image-tools-group" });
    const adjustGrid = node("div", { class:"image-tools-field-grid" });
    const rotateLabel = node("label", { class:"image-tools-field", for:"imageToolsRotate" });
    const rotate = node("select", { id:"imageToolsRotate" });
    [["0",t("imageToolsNoRotation")],["90","90°"],["180","180°"],["270","270°"]].forEach(([value,label]) => rotate.appendChild(node("option", { value }, label)));
    append(rotateLabel, node("span", {}, t("imageToolsRotate")), rotate);
    const flipH = node("label", { class:"image-tools-check" });
    append(flipH, node("input", { type:"checkbox", "data-image-tools-flip-horizontal":"" }), node("span", {}, t("imageToolsFlipHorizontal")));
    const flipV = node("label", { class:"image-tools-check" });
    append(flipV, node("input", { type:"checkbox", "data-image-tools-flip-vertical":"" }), node("span", {}, t("imageToolsFlipVertical")));
    append(adjustGrid, rotateLabel, flipH, flipV);
    append(adjust, node("legend", {}, t("imageToolsRotateFlip")), adjustGrid);

    const format = node("fieldset", { class:"image-tools-group" });
    const formatGrid = node("div", { class:"image-tools-field-grid" });
    const formatLabel = node("label", { class:"image-tools-field", for:"imageToolsFormat" });
    const formatSelect = node("select", { id:"imageToolsFormat", "data-image-tools-format":"" });
    formatSelect.appendChild(node("option", { value:"image/png" }, "PNG"));
    formatSelect.appendChild(node("option", { value:"image/jpeg" }, "JPEG"));
    append(formatLabel, node("span", {}, t("imageToolsFormat")), formatSelect);
    const quality = field("imageToolsQuality", t("imageToolsQuality"), { type:"range", min:"60", max:"95", value:"85" });
    append(formatGrid, formatLabel, quality);
    append(format, node("legend", {}, t("imageToolsExportSettings")), formatGrid);

    const actions = node("div", { class:"image-tools-actions" });
    append(actions,
      node("button", { type:"button", class:"ws-btn primary", "data-image-tools-apply":"" }, t("imageToolsApply")),
      node("button", { type:"button", class:"ws-btn", "data-image-tools-export":"", disabled:true }, t("imageToolsExport")),
      node("button", { type:"button", class:"ws-btn", "data-image-tools-replace":"" }, t("imageToolsReplace")),
      node("button", { type:"button", class:"ws-btn ghost", "data-image-tools-reset":"" }, t("imageToolsReset"))
    );
    const status = node("p", { class:"image-tools-status", role:"status", "aria-live":"polite", "data-image-tools-status":"" }, t("imageToolsStatusReady"));
    const error = node("p", { class:"image-tools-error", role:"alert", hidden:true, "data-image-tools-error":"" });
    append(tools, resize, crop, adjust, format, actions, status, error);

    append(page, hero, preview, tools);
    page._elements = { input, choose, empty, image, meta, previewTitle, tools, width:width.querySelector("input"), height:height.querySelector("input"), aspect:aspect.querySelector("input"), cropToggle:cropToggle.querySelector("input"), cropGrid, cropX:cropGrid.querySelector("#imageToolsCropX"), cropY:cropGrid.querySelector("#imageToolsCropY"), cropWidth:cropGrid.querySelector("#imageToolsCropWidth"), cropHeight:cropGrid.querySelector("#imageToolsCropHeight"), rotate, flipH:flipH.querySelector("input"), flipV:flipV.querySelector("input"), format:formatSelect, quality:quality.querySelector("input"), apply:actions.querySelector("[data-image-tools-apply]"), export:actions.querySelector("[data-image-tools-export]"), replace:actions.querySelector("[data-image-tools-replace]"), reset:actions.querySelector("[data-image-tools-reset]"), status, error };
    return page;
  }

  function bind(page, runtimeOverride){
    const el = page._elements;
    const runtime = runtimeOverride || (window.weishan && window.weishan.imageTools);
    const policy = runtime && typeof runtime.getPolicy === "function" ? runtime.getPolicy() : { maxFileBytes:12 * 1024 * 1024 };
    let sequence = 0;
    let generation = 0;
    let activeRequestId = "";
    let sourceBytes = null;
    let sourceMime = "";
    let sourceName = "image";
    let sourceWidth = 0;
    let sourceHeight = 0;
    let result = null;
    let previewUrl = "";
    const listeners = [];
    const listen = (target,event,handler) => { target.addEventListener(event,handler); listeners.push(() => target.removeEventListener(event,handler)); };

    function revokePreview(){ if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = ""; } }
    function setBusy(busy){ el.apply.disabled = busy; el.export.disabled = busy || !result; el.replace.disabled = busy; el.status.textContent = busy ? t("imageToolsStatusProcessing") : (result ? t("imageToolsStatusReady") : ""); }
    function showError(code){ el.error.textContent = errorText(code); el.error.hidden = false; el.status.textContent = ""; }
    function clearError(){ el.error.hidden = true; el.error.textContent = ""; }
    function cancelActive(){ if (activeRequestId && runtime && typeof runtime.cancel === "function") runtime.cancel(activeRequestId); activeRequestId = ""; }
    function resetFields(width,height,mime){
      el.width.value = String(width); el.height.value = String(height);
      el.cropX.value = "0"; el.cropY.value = "0"; el.cropWidth.value = String(width); el.cropHeight.value = String(height);
      el.cropToggle.checked = false; el.cropGrid.hidden = true; el.rotate.value = "0"; el.flipH.checked = false; el.flipV.checked = false; el.format.value = ACCEPTED_MIME.includes(mime) ? mime : "image/png"; el.quality.value = "85";
    }
    function transform(){
      return {
        resize:{ width:Number(el.width.value), height:Number(el.height.value) },
        crop:el.cropToggle.checked ? { x:Number(el.cropX.value), y:Number(el.cropY.value), width:Number(el.cropWidth.value), height:Number(el.cropHeight.value) } : null,
        rotation:Number(el.rotate.value),
        flipHorizontal:el.flipH.checked,
        flipVertical:el.flipV.checked,
        outputMime:el.format.value,
        jpegQuality:Number(el.quality.value)
      };
    }
    async function run(nextTransform, focusPreview){
      if (!runtime || typeof runtime.process !== "function") { showError("PROCESSING_UNAVAILABLE"); return false; }
      cancelActive(); clearError(); setBusy(true);
      const currentGeneration = ++generation;
      const id = requestId(++sequence);
      activeRequestId = id;
      let response;
      try { response = await runtime.process({ requestId:id, bytes:sourceBytes, transform:nextTransform }); }
      catch (_) { response = { ok:false, error:"PROCESSING_FAILED" }; }
      if (currentGeneration !== generation || activeRequestId !== id) return false;
      activeRequestId = "";
      if (!response || response.ok !== true) { result = null; setBusy(false); showError(response && response.error); return false; }
      result = { bytes:response.bytes, mime:response.mime, width:response.width, height:response.height };
      revokePreview();
      previewUrl = URL.createObjectURL(new Blob([result.bytes], { type:result.mime }));
      el.image.src = previewUrl; el.image.hidden = false; el.empty.hidden = true; el.meta.hidden = false;
      el.meta.textContent = result.width + " × " + result.height + " · " + (result.mime === "image/jpeg" ? "JPEG" : "PNG");
      page.dataset.imageToolsState = "ready"; el.tools.hidden = false; setBusy(false);
      if (focusPreview) el.previewTitle.focus();
      return true;
    }
    async function selectFile(file){
      if (!file) return;
      cancelActive(); generation += 1; clearError(); result = null; sourceBytes = null; revokePreview();
      el.image.removeAttribute("src"); el.image.hidden = true; el.meta.hidden = true; el.empty.hidden = false; el.tools.hidden = true; page.dataset.imageToolsState = "empty"; setBusy(false);
      if (file.size <= 0 || file.size > Number(policy.maxFileBytes || 0)) { showError("IMAGE_TOO_LARGE"); return; }
      let buffer;
      try { buffer = await file.arrayBuffer(); } catch (_) { showError("UNSUPPORTED_OR_MALFORMED_IMAGE"); return; }
      sourceBytes = new Uint8Array(buffer); sourceMime = String(file.type || ""); sourceName = baseName(file.name);
      const ok = await run({ outputMime:ACCEPTED_MIME.includes(sourceMime) ? sourceMime : "image/png" }, true);
      if (!ok || !result) return;
      sourceWidth = result.width; sourceHeight = result.height; sourceMime = result.mime;
      resetFields(sourceWidth, sourceHeight, sourceMime);
    }
    function clearWorkspace(){
      cancelActive(); generation += 1; revokePreview(); sourceBytes = null; result = null; sourceWidth = 0; sourceHeight = 0; sourceName = "image"; el.input.value = ""; el.image.removeAttribute("src"); el.image.hidden = true; el.meta.hidden = true; el.empty.hidden = false; el.tools.hidden = true; clearError(); page.dataset.imageToolsState = "empty"; el.choose.focus();
    }
    function adjustFromWidth(){ if (!el.aspect.checked || !sourceWidth || !sourceHeight) return; const width=Number(el.width.value); if (Number.isFinite(width) && width > 0) el.height.value=String(Math.max(1,Math.round(width * sourceHeight / sourceWidth))); }
    function adjustFromHeight(){ if (!el.aspect.checked || !sourceWidth || !sourceHeight) return; const height=Number(el.height.value); if (Number.isFinite(height) && height > 0) el.width.value=String(Math.max(1,Math.round(height * sourceWidth / sourceHeight))); }
    async function exportResult(){
      if (!result) return;
      if (!runtime || typeof runtime.export !== "function") { showError("EXPORT_FAILED"); return; }
      clearError(); el.export.disabled = true; el.status.textContent = t("imageToolsStatusExporting");
      let response;
      try { response = await runtime.export({ requestId:requestId(++sequence), bytes:result.bytes, mime:result.mime, suggestedName:sourceName + "-weishan." + outputExtension(result.mime) }); }
      catch (_) { response = { ok:false, error:"EXPORT_FAILED" }; }
      el.export.disabled = false;
      if (response && response.ok && response.saved) el.status.textContent = t("imageToolsStatusExported");
      else if (response && response.ok && response.cancelled) el.status.textContent = t("imageToolsStatusExportCancelled");
      else showError(response && response.error || "EXPORT_FAILED");
    }

    listen(el.choose,"click",()=>el.input.click());
    listen(el.replace,"click",()=>el.input.click());
    listen(el.input,"change",()=>selectFile(el.input.files && el.input.files[0]));
    listen(el.apply,"click",()=>run(transform(),true));
    listen(el.export,"click",exportResult);
    listen(el.reset,"click",clearWorkspace);
    listen(el.width,"input",adjustFromWidth);
    listen(el.height,"input",adjustFromHeight);
    listen(el.cropToggle,"change",()=>{ el.cropGrid.hidden=!el.cropToggle.checked; if(el.cropToggle.checked) el.cropX.focus(); });

    return () => { listeners.splice(0).forEach((off)=>off()); cancelActive(); generation += 1; revokePreview(); sourceBytes = null; result = null; };
  }

  function mount(host, options){ if (cleanup) cleanup(); const page=build(); host.replaceChildren(page); cleanup=bind(page, options && options.runtime); }
  function unmount(){ if (cleanup) { cleanup(); cleanup=null; } }
  window.ImageToolsWorkspace = { mount, unmount };
})();
