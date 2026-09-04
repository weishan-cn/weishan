(function(){
  const runtimeApi = window.WeishanPluginRuntimeV2;
  const contract = window.WeishanPluginRuntimeV2Contract;
  if (!runtimeApi || !contract) return;
  const schema = Object.freeze({ type:"object", additionalProperties:false });
  const resultSchema = Object.freeze({ type:"object" });
  function capability(capabilityId, description, permissions, executionMode, sideEffectClass, timeoutClass){
    return { capabilityId, description, inputSchema:schema, outputSchema:resultSchema, permissionRequirements:permissions, executionMode, timeoutClass:timeoutClass || "STANDARD", sideEffectClass };
  }
  function permission(permissionId, required, scopes, description){ return { permissionId, required, scopes, description }; }
  function officialPublisher(){ return { publisherId:"weishan.official", name:"Weishan", trustClass:"WEISHAN_OFFICIAL" }; }
  function shared(options){
    return Object.assign({
      runtimeVersion:"2.0.0",
      supportedPlatforms:["darwin-arm64", "darwin-x64"],
      minimumWeishanVersion:"2.1.0",
      dataPolicy:{ namespacePolicy:"ISOLATED", retentionChoice:true, generatedDataDefault:"RETAIN" },
      updatePolicy:{ mode:"MANUAL", permissionExpansionRequiresApproval:true, rollbackSupported:true },
      homepage:"https://weishan.ai",
      license:"MIT",
      onlineDependency:"LOCAL",
      costClass:"FREE",
      categories:["Productivity"],
      externalServiceRequirement:"NONE",
      availability:"READY",
      userVisible:true,
      developerPreviewOnly:false
    }, options);
  }
  const imageTools = shared({
    pluginId:"weishan.tools.image",
    name:"Image Tools",
    localizedName:{ zh:"图片工具", en:"Image Tools" },
    publisher:officialPublisher(),
    version:"1.0.0",
    description:"Resize, crop, rotate, flip, preview, and export images locally.",
    localizedDescription:{ zh:"在本地调整尺寸、裁剪、旋转、翻转、预览和导出图片。", en:"Resize, crop, rotate, flip, preview, and export images locally." },
    capabilities:[capability("image.transform", "Transform a user-selected local image.", ["filesystem.read", "filesystem.write"], "IN_PROCESS_COMPATIBILITY", "LOCAL_MUTATION")],
    permissions:[
      permission("filesystem.read", true, ["selected-files"], "Read only images explicitly selected by the user."),
      permission("filesystem.write", true, ["user-selected-export"], "Write only to an export location selected by the user.")
    ],
    entrypoint:{ mode:"IN_PROCESS_COMPATIBILITY", target:"plugin.image-tools" },
    installSize:0,
    downloadSize:0,
    signature:{ status:"BUILTIN_TRUST_ANCHOR", publisherId:"weishan.official" },
    integrityHash:"builtin:image-tools-v1",
    riskClass:"LOW",
    categories:["Images", "Productivity"],
    marketplacePriority:4,
    consumerOutcome:{ zh:"生成和编辑图片", en:"Create and edit images" },
    examples:{ zh:["修改商品图", "制作短视频封面", "裁剪和调整背景"], en:["Edit product images", "Create short-video covers", "Crop and adjust backgrounds"] },
    capabilityClass:"IMAGE_STUDIO",
    compatibility:{ legacyPluginId:"image-tools", runtimePath:"existing-image-tools" }
  });
  function agentPack(options){
    return shared(Object.assign({
      publisher:officialPublisher(),
      version:"0.1.0",
      availability:"CONNECTOR_FOUNDATION_NOT_READY_FOR_USER_EXECUTION",
      signature:{ status:"NOT_VERIFIED", publisherId:"weishan.official" },
      installSize:0,
      downloadSize:0,
      riskClass:"HIGH",
      onlineDependency:"HYBRID",
      costClass:"UNKNOWN",
      developerPreviewOnly:true,
      userVisible:false,
      largePack:true,
      externalServiceRequirement:"REQUIRES_SEPARATE_VALIDATION",
      additionalRuntimeSize:"NOT_DOWNLOADED_OR_BUNDLED"
    }, options));
  }
  const codexPack = agentPack({
    pluginId:"weishan.connector.codex",
    name:"Software Development",
    localizedName:{ zh:"软件开发", en:"Software Development" },
    description:"Connector foundation for repository inspection, code changes, tests, debugging, and review. External service access is not validated for user execution.",
    localizedDescription:{ zh:"用于检查项目、修改代码、运行测试、调试和审查的软件开发连接器基础。外部服务尚未验证为可执行。", en:"Connector foundation for repository inspection, code changes, tests, debugging, and review. External service access is not validated for user execution." },
    capabilities:[
      capability("software.repo.inspect", "Inspect a selected repository.", ["filesystem.read", "git.read"], "OUT_OF_PROCESS", "READ_ONLY"),
      capability("software.generate", "Generate software changes.", ["filesystem.read", "filesystem.write"], "OUT_OF_PROCESS", "LOCAL_MUTATION", "LONG"),
      capability("software.modify", "Modify selected project files.", ["filesystem.read", "filesystem.write"], "OUT_OF_PROCESS", "LOCAL_MUTATION", "LONG"),
      capability("software.test", "Run selected project tests.", ["filesystem.read", "shell.execute"], "OUT_OF_PROCESS", "LOCAL_MUTATION", "LONG"),
      capability("software.debug", "Diagnose software failures.", ["filesystem.read", "shell.execute"], "OUT_OF_PROCESS", "LOCAL_MUTATION", "LONG"),
      capability("software.review", "Review repository changes.", ["filesystem.read", "git.read"], "OUT_OF_PROCESS", "READ_ONLY"),
      capability("git.inspect", "Inspect repository history and state.", ["git.read"], "OUT_OF_PROCESS", "READ_ONLY"),
      capability("git.diff", "Produce a repository diff.", ["git.read"], "OUT_OF_PROCESS", "READ_ONLY")
    ],
    permissions:[
      permission("filesystem.read", true, ["selected-repository"], "Read a repository selected by the user."),
      permission("filesystem.write", false, ["selected-repository"], "Modify only the repository selected by the user."),
      permission("git.read", true, ["selected-repository"], "Inspect Git state in the selected repository."),
      permission("shell.execute", false, ["selected-repository:approved-commands"], "Run clearly disclosed commands in the selected repository.")
    ],
    entrypoint:{ mode:"OUT_OF_PROCESS", target:"connector-foundation:codex" },
    integrityHash:"builtin:codex-connector-foundation-v1",
    categories:["Software Development", "Productivity"],
    marketplacePriority:2,
    consumerOutcome:{ zh:"写代码和修项目", en:"Write code and fix projects" },
    examples:{ zh:["检查项目并修复测试", "修改登录页面", "审查代码变更"], en:["Inspect a project and fix tests", "Change a login page", "Review code changes"] },
    implementationProvider:"Codex",
    userVisible:true,
    developerPreviewOnly:false,
    onlineDependency:"ONLINE_SERVICE_REQUIRED",
    costClass:"EXTERNAL_SUBSCRIPTION_REQUIRED"
  });
  const openClawPack = agentPack({
    pluginId:"weishan.connector.openclaw",
    name:"Web Automation & Capture",
    localizedName:{ zh:"网页自动化与采集", en:"Web Automation & Capture" },
    description:"Connector foundation for browser and local-app automation. No runtime is bundled or executable.",
    localizedDescription:{ zh:"用于浏览器和本地应用自动化的连接器基础。未捆绑运行时，也尚不可执行。", en:"Connector foundation for browser and local-app automation. No runtime is bundled or executable." },
    capabilities:[
      capability("web.read", "Read an explicitly approved web page.", ["browser.control", "network"], "OUT_OF_PROCESS", "READ_ONLY"),
      capability("web.extract", "Extract structured information from an approved web page.", ["browser.control", "network"], "OUT_OF_PROCESS", "READ_ONLY"),
      capability("browser.control", "Control an explicitly approved browser session.", ["browser.control"], "OUT_OF_PROCESS", "DEVICE_CONTROL"),
      capability("browser.navigate", "Navigate an explicitly approved browser session.", ["browser.control", "network"], "OUT_OF_PROCESS", "DEVICE_CONTROL"),
      capability("browser.capture", "Capture an approved web page.", ["browser.control"], "OUT_OF_PROCESS", "READ_ONLY"),
      capability("browser.interact", "Interact with an approved web page.", ["browser.control"], "OUT_OF_PROCESS", "DEVICE_CONTROL"),
      capability("browser.form_fill", "Fill approved form fields without submission authority.", ["browser.control"], "OUT_OF_PROCESS", "DEVICE_CONTROL"),
      capability("automation.execute", "Run an approved automation workflow.", ["local_app_control"], "OUT_OF_PROCESS", "DEVICE_CONTROL", "LONG"),
      capability("workflow.execute", "Run a bounded workflow.", ["local_app_control"], "OUT_OF_PROCESS", "DEVICE_CONTROL", "LONG"),
      capability("workflow.web.execute", "Run a bounded web workflow.", ["browser.control", "network"], "OUT_OF_PROCESS", "DEVICE_CONTROL", "LONG")
    ],
    permissions:[
      permission("browser.control", true, ["user-approved-session"], "Control only a browser session approved by the user."),
      permission("network", false, ["approved-domains"], "Connect only to domains approved for the task."),
      permission("local_app_control", false, ["approved-applications"], "Control only applications approved by the user.")
    ],
    entrypoint:{ mode:"OUT_OF_PROCESS", target:"connector-foundation:openclaw" },
    integrityHash:"builtin:openclaw-connector-foundation-v1",
    categories:["Web & Automation", "Productivity"],
    marketplacePriority:3,
    consumerOutcome:{ zh:"自动操作和整理网页", en:"Automate and organize web tasks" },
    examples:{ zh:["整理网页商品", "截取网页内容", "自动填写但不提交表单"], en:["Organize products from a website", "Capture web content", "Fill—but do not submit—forms"] },
    implementationProvider:"OpenClaw",
    userVisible:true,
    developerPreviewOnly:false
  });
  const hermesPack = agentPack({
    pluginId:"weishan.connector.hermes",
    name:"Advanced Agent & Deep Work",
    localizedName:{ zh:"复杂任务与深度工作", en:"Advanced Agent & Deep Work" },
    description:"Connector foundation for planning and long-task orchestration. Weishan Brain remains the authority.",
    localizedDescription:{ zh:"用于规划和长任务编排的连接器基础。Weishan Brain 始终保留最高调度权。", en:"Connector foundation for planning and long-task orchestration. Weishan Brain remains the authority." },
    capabilities:[
      capability("agent.plan", "Create a subordinate execution plan.", [], "OUT_OF_PROCESS", "READ_ONLY"),
      capability("agent.reason", "Analyze a bounded task.", [], "OUT_OF_PROCESS", "READ_ONLY"),
      capability("agent.execute", "Execute an approved subordinate plan.", ["background_tasks"], "OUT_OF_PROCESS", "LOCAL_MUTATION", "LONG"),
      capability("skill.run", "Run an approved skill.", ["background_tasks"], "OUT_OF_PROCESS", "LOCAL_MUTATION", "LONG"),
      capability("long_task.orchestrate", "Orchestrate a bounded long task under Weishan gates.", ["background_tasks", "high_compute"], "OUT_OF_PROCESS", "LOCAL_MUTATION", "LONG")
    ],
    permissions:[
      permission("background_tasks", false, ["user-approved-task"], "Continue only the task approved by the user."),
      permission("high_compute", false, ["user-approved-task"], "Use additional compute only after explicit approval.")
    ],
    entrypoint:{ mode:"OUT_OF_PROCESS", target:"connector-foundation:hermes" },
    integrityHash:"builtin:hermes-connector-foundation-v1",
    categories:["Advanced AI", "Productivity"],
    marketplacePriority:6,
    consumerOutcome:{ zh:"完成复杂长任务", en:"Complete complex long-running tasks" },
    examples:{ zh:["规划并持续推进复杂任务", "协调多个受控步骤"], en:["Plan and continue a complex task", "Coordinate multiple controlled steps"] },
    implementationProvider:"Hermes",
    userVisible:true,
    developerPreviewOnly:false
  });
  function plannedPack(options){
    return shared(Object.assign({
      publisher:officialPublisher(),
      version:"0.1.0",
      availability:"FOUNDATION_PLANNED_NOT_READY_FOR_USER_EXECUTION",
      signature:{ status:"NOT_VERIFIED", publisherId:"weishan.official" },
      installSize:0,
      downloadSize:0,
      riskClass:"MEDIUM",
      onlineDependency:"HYBRID",
      costClass:"UNKNOWN",
      externalServiceRequirement:"REQUIRES_SEPARATE_VALIDATION",
      userVisible:true,
      developerPreviewOnly:false,
      optionalComponents:[]
    }, options));
  }
  const videoStudio = plannedPack({
    pluginId:"weishan.studio.video",
    name:"Weishan Video Studio",
    localizedName:{ zh:"Weishan 视频工作室", en:"Weishan Video Studio" },
    consumerOutcome:{ zh:"制作短视频", en:"Create short videos" },
    description:"Plan scripts, storyboards, captions, voice, edits, covers, and exports without claiming an unavailable rendering service.",
    localizedDescription:{ zh:"从脚本、分镜、字幕、配音、剪辑、封面到导出规划；尚未提供真实视频渲染。", en:"Plan scripts, storyboards, captions, voice, edits, covers, and exports without claiming an unavailable rendering service." },
    examples:{ zh:["把内容做成 45 秒竖屏短视频", "为短视频生成脚本和分镜", "规划字幕、配音和封面"], en:["Turn content into a 45-second vertical short", "Create a script and storyboard", "Plan captions, voiceover, and a cover"] },
    capabilities:[
      capability("video.script", "Create a video script plan.", [], "OUT_OF_PROCESS", "READ_ONLY"),
      capability("video.storyboard", "Create a storyboard representation.", [], "OUT_OF_PROCESS", "READ_ONLY"),
      capability("video.generate", "Generate video media through a separately validated provider.", ["network", "high_compute"], "OUT_OF_PROCESS", "LOCAL_MUTATION", "LONG"),
      capability("video.import", "Import selected source media.", ["filesystem.read"], "OUT_OF_PROCESS", "READ_ONLY"),
      capability("video.trim", "Trim source media.", ["filesystem.read", "filesystem.write"], "OUT_OF_PROCESS", "LOCAL_MUTATION"),
      capability("video.edit", "Edit a controlled project timeline.", ["filesystem.read", "filesystem.write"], "OUT_OF_PROCESS", "LOCAL_MUTATION", "LONG"),
      capability("video.subtitle", "Create subtitle artifacts.", ["filesystem.write"], "OUT_OF_PROCESS", "LOCAL_MUTATION"),
      capability("video.caption_style", "Apply a caption style to a project plan.", [], "OUT_OF_PROCESS", "LOCAL_MUTATION"),
      capability("video.voiceover", "Create voiceover through local or separately validated service components.", ["filesystem.write", "network"], "OUT_OF_PROCESS", "LOCAL_MUTATION", "LONG"),
      capability("video.audio_mix", "Plan or render an audio mix.", ["filesystem.read", "filesystem.write"], "OUT_OF_PROCESS", "LOCAL_MUTATION", "LONG"),
      capability("video.music", "Add user-approved music artifacts.", ["filesystem.read", "filesystem.write"], "OUT_OF_PROCESS", "LOCAL_MUTATION"),
      capability("video.cover", "Create a cover-image artifact.", ["filesystem.write"], "OUT_OF_PROCESS", "LOCAL_MUTATION"),
      capability("video.resize", "Adapt a project to 9:16, 16:9, or 1:1.", ["filesystem.write"], "OUT_OF_PROCESS", "LOCAL_MUTATION"),
      capability("video.export", "Export a rendered video when a validated renderer exists.", ["filesystem.write", "high_compute"], "OUT_OF_PROCESS", "LOCAL_MUTATION", "LONG")
    ],
    permissions:[
      permission("filesystem.read", false, ["selected-media"], "Read only media selected by the user."),
      permission("filesystem.write", false, ["user-selected-project-and-export"], "Write only project and export artifacts approved by the user."),
      permission("microphone", false, ["active-recording-session"], "Use the microphone only during an explicit recording session."),
      permission("network", false, ["approved-service-domains"], "Use only separately approved media-service domains."),
      permission("high_compute", false, ["approved-render-task"], "Use additional compute only for an approved render task.")
    ],
    entrypoint:{ mode:"OUT_OF_PROCESS", target:"foundation:video-studio" },
    integrityHash:"builtin:video-studio-foundation-v1",
    categories:["Video", "Images & Design"],
    marketplacePriority:1,
    largePack:true,
    additionalRuntimeSize:"OPTIONAL_COMPONENTS_NOT_DOWNLOADED",
    optionalComponents:["Video Editing Core", "Voiceover Pack", "AI Video Generation Pack", "Advanced Effects Pack"],
    artifactTypes:["source_media", "script", "storyboard", "audio", "subtitle", "project_timeline", "rendered_video", "cover_image"],
    directPublishing:false
  });
  const officeTools = plannedPack({
    pluginId:"weishan.tools.office",
    name:"Office & Document Tools",
    localizedName:{ zh:"办公与文档工具", en:"Office & Document Tools" },
    consumerOutcome:{ zh:"处理 PDF、表格和演示文稿", en:"Work with PDFs, spreadsheets, and presentations" },
    description:"Foundation for document reading, writing, conversion, spreadsheets, and presentations.",
    localizedDescription:{ zh:"用于读取、编写和转换文档、表格与演示文稿的能力基础。", en:"Foundation for document reading, writing, conversion, spreadsheets, and presentations." },
    examples:{ zh:["整理 PDF 内容", "把数据写成 Excel", "制作演示文稿"], en:["Organize PDF content", "Write data to Excel", "Create a presentation"] },
    capabilities:[
      capability("pdf.extract", "Extract text and structure from a selected PDF.", ["filesystem.read"], "OUT_OF_PROCESS", "READ_ONLY"),
      capability("pdf.create", "Create a PDF artifact.", ["filesystem.write"], "OUT_OF_PROCESS", "LOCAL_MUTATION"),
      capability("document.read", "Read a selected document.", ["filesystem.read"], "OUT_OF_PROCESS", "READ_ONLY"),
      capability("document.write", "Write a document artifact.", ["filesystem.write"], "OUT_OF_PROCESS", "LOCAL_MUTATION"),
      capability("spreadsheet.read", "Read a selected spreadsheet.", ["filesystem.read"], "OUT_OF_PROCESS", "READ_ONLY"),
      capability("spreadsheet.write", "Write a spreadsheet artifact.", ["filesystem.write"], "OUT_OF_PROCESS", "LOCAL_MUTATION"),
      capability("presentation.create", "Create a presentation artifact.", ["filesystem.write"], "OUT_OF_PROCESS", "LOCAL_MUTATION"),
      capability("file.convert", "Convert a selected file to an approved format.", ["filesystem.read", "filesystem.write"], "OUT_OF_PROCESS", "LOCAL_MUTATION")
    ],
    permissions:[
      permission("filesystem.read", false, ["selected-files"], "Read only files selected by the user."),
      permission("filesystem.write", false, ["user-selected-export"], "Write only to an export location selected by the user.")
    ],
    entrypoint:{ mode:"OUT_OF_PROCESS", target:"foundation:office-documents" },
    integrityHash:"builtin:office-documents-foundation-v1",
    categories:["Documents & Office", "Productivity"],
    marketplacePriority:5
  });
  const safeFixture = shared({
    pluginId:"local.fixture.text-reader",
    name:"Runtime V2 Test Reader",
    publisher:{ publisherId:"local.test", name:"Local Test", trustClass:"LOCAL_DEVELOPER" },
    version:"1.0.0",
    description:"A local test fixture that is never exposed in the marketplace.",
    capabilities:[capability("document.text.read", "Read a synthetic text artifact.", ["filesystem.read"], "OUT_OF_PROCESS", "READ_ONLY")],
    permissions:[permission("filesystem.read", true, ["fixture-artifact"], "Read the isolated synthetic fixture artifact.")],
    entrypoint:{ mode:"OUT_OF_PROCESS", target:"test-fixture:text-reader" },
    installSize:1024,
    downloadSize:0,
    signature:{ status:"VERIFIED", publisherId:"local.test" },
    integrityHash:"sha256:fixturetextreaderv100",
    homepage:"https://weishan.ai",
    riskClass:"LOW",
    availability:"READY",
    userVisible:false,
    developerPreviewOnly:true
  });
  const catalog = Object.freeze([videoStudio, codexPack, openClawPack, imageTools, officeTools, hermesPack].map(contract.clone));
  const runtime = new runtimeApi.RuntimeV2({ catalog });
  runtime.bootstrapBuiltIn("weishan.tools.image", ["filesystem.read:selected-files", "filesystem.write:user-selected-export"]);
  window.WeishanPluginRuntimeV2Catalog = Object.freeze({ catalog:() => catalog.map(contract.clone), safeFixture:() => contract.clone(safeFixture), imageTools:() => contract.clone(imageTools), runtime });
})();
