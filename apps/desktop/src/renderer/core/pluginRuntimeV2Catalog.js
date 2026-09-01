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
    name:"Software Development / Codex",
    localizedName:{ zh:"软件开发 / Codex", en:"Software Development / Codex" },
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
    categories:["Development", "AI Agents", "Developer Tools"],
    onlineDependency:"ONLINE_SERVICE_REQUIRED",
    costClass:"EXTERNAL_SUBSCRIPTION_REQUIRED"
  });
  const openClawPack = agentPack({
    pluginId:"weishan.connector.openclaw",
    name:"OpenClaw Automation",
    localizedName:{ zh:"OpenClaw 自动化", en:"OpenClaw Automation" },
    description:"Connector foundation for browser and local-app automation. No runtime is bundled or executable.",
    localizedDescription:{ zh:"用于浏览器和本地应用自动化的连接器基础。未捆绑运行时，也尚不可执行。", en:"Connector foundation for browser and local-app automation. No runtime is bundled or executable." },
    capabilities:[
      capability("browser.control", "Control an explicitly approved browser session.", ["browser.control"], "OUT_OF_PROCESS", "DEVICE_CONTROL"),
      capability("browser.navigate", "Navigate an explicitly approved browser session.", ["browser.control", "network"], "OUT_OF_PROCESS", "DEVICE_CONTROL"),
      capability("automation.execute", "Run an approved automation workflow.", ["local_app_control"], "OUT_OF_PROCESS", "DEVICE_CONTROL", "LONG"),
      capability("workflow.execute", "Run a bounded workflow.", ["local_app_control"], "OUT_OF_PROCESS", "DEVICE_CONTROL", "LONG")
    ],
    permissions:[
      permission("browser.control", true, ["user-approved-session"], "Control only a browser session approved by the user."),
      permission("network", false, ["approved-domains"], "Connect only to domains approved for the task."),
      permission("local_app_control", false, ["approved-applications"], "Control only applications approved by the user.")
    ],
    entrypoint:{ mode:"OUT_OF_PROCESS", target:"connector-foundation:openclaw" },
    integrityHash:"builtin:openclaw-connector-foundation-v1",
    categories:["Automation", "Web", "AI Agents"]
  });
  const hermesPack = agentPack({
    pluginId:"weishan.connector.hermes",
    name:"Hermes Agent",
    localizedName:{ zh:"Hermes 智能代理", en:"Hermes Agent" },
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
    categories:["AI Agents", "Automation"]
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
  const catalog = Object.freeze([imageTools, codexPack, openClawPack, hermesPack].map(contract.clone));
  const runtime = new runtimeApi.RuntimeV2({ catalog });
  runtime.bootstrapBuiltIn("weishan.tools.image", ["filesystem.read:selected-files", "filesystem.write:user-selected-export"]);
  window.WeishanPluginRuntimeV2Catalog = Object.freeze({ catalog:() => catalog.map(contract.clone), safeFixture:() => contract.clone(safeFixture), imageTools:() => contract.clone(imageTools), runtime });
})();
