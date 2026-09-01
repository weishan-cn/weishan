(function(){
  const INTENT_RULES = Object.freeze([
    { capabilityId:"browser.capture", terms:["capture website", "网页截图", "网页抓取", "截取网页"] },
    { capabilityId:"browser.navigate", terms:["open website", "navigate website", "打开网页", "访问网站"] },
    { capabilityId:"web.extract", terms:["extract website", "整理网站", "提取网页", "全部产品"] },
    { capabilityId:"spreadsheet.write", terms:["export spreadsheet", "write spreadsheet", "整理成 excel", "写入表格", "导出表格"] },
    { capabilityId:"document.pdf.extract", terms:["extract pdf", "read pdf", "读取 pdf", "提取 pdf"] },
    { capabilityId:"image.transform", terms:["resize image", "crop image", "edit image", "调整图片", "裁剪图片", "编辑图片"] },
    { capabilityId:"software.repo.inspect", terms:["inspect repository", "check project", "检查项目", "查看代码库"] },
    { capabilityId:"software.test", terms:["run tests", "fix test", "运行测试", "测试失败"] },
    { capabilityId:"software.modify", terms:["modify project", "change code", "改一下这个项目", "修改代码", "修复代码"] },
    { capabilityId:"agent.plan", terms:["plan task", "制定计划", "规划任务"] }
  ]);
  function text(value){ return String(value == null ? "" : value).trim().toLowerCase(); }
  function inferCapabilities(intent){
    const value = text(intent);
    if (!value) return [];
    return INTENT_RULES.filter((rule) => rule.terms.some((term) => value.includes(term))).map((rule) => rule.capabilityId);
  }
  function rankCandidate(item, preferences){
    const manifest = item.manifest || {};
    const installation = item.installation;
    const preferred = preferences && preferences[manifest.capabilities && manifest.capabilities[0] && manifest.capabilities[0].capabilityId];
    const trust = manifest.publisher && manifest.publisher.trustClass;
    return (installation && installation.state === "ENABLED" ? 100 : 0) +
      (preferred === manifest.pluginId ? 20 : 0) +
      (trust === "WEISHAN_OFFICIAL" ? 10 : trust === "VERIFIED_PUBLISHER" ? 5 : 0) +
      (manifest.costClass === "FREE" ? 3 : 0) -
      (manifest.riskClass === "HIGH" ? 5 : manifest.riskClass === "CRITICAL" ? 20 : 0);
  }
  function discoverForIntent(intent, runtime, options){
    const capabilities = inferCapabilities(intent);
    const preferences = options && options.preferences || {};
    const steps = capabilities.map((capabilityId) => {
      const candidates = runtime && typeof runtime.candidates === "function" ? runtime.candidates(capabilityId) : [];
      const ranked = candidates.map((candidate) => Object.assign({}, candidate, { score:rankCandidate(candidate, preferences) })).sort((a, b) => b.score - a.score || String(a.manifest.pluginId).localeCompare(String(b.manifest.pluginId)));
      const enabled = ranked.filter((candidate) => candidate.installation && candidate.installation.state === "ENABLED");
      if (enabled.length) return { capabilityId, status:"READY", candidates:enabled.map((candidate) => candidate.manifest.pluginId), selectedPluginId:enabled[0].manifest.pluginId, additionalPermissionReview:false };
      const eligible = ranked.filter((candidate) => candidate.manifest.availability === "READY" && ["BUILTIN_TRUST_ANCHOR", "VERIFIED"].includes(candidate.manifest.signature && candidate.manifest.signature.status));
      if (eligible.length) return { capabilityId, status:"INSTALL_RECOMMENDED", candidates:eligible.map((candidate) => candidate.manifest.pluginId), selectedPluginId:"", additionalPermissionReview:true, message:`Weishan needs ${capabilityId} capability to continue.` };
      return { capabilityId, status:"CAPABILITY_NOT_AVAILABLE", candidates:ranked.map((candidate) => candidate.manifest.pluginId), selectedPluginId:"", additionalPermissionReview:false, message:`Weishan needs ${capabilityId} capability, but no install-ready tool is available.` };
    });
    return { intent:String(intent == null ? "" : intent), capabilities, steps, authority:"WEISHAN_BRAIN", commissionInfluence:false };
  }
  function compose(capabilityIds, runtime){
    const requested = Array.isArray(capabilityIds) ? capabilityIds : [];
    return requested.map((capabilityId) => {
      const candidates = runtime && typeof runtime.candidates === "function" ? runtime.candidates(capabilityId, { installedOnly:true }) : [];
      return { capabilityId, candidates:candidates.map((item) => item.manifest.pluginId), permissionEvaluation:"PER_PLUGIN_CAPABILITY_STEP", transitivePermissionEscalation:false };
    });
  }
  window.WeishanBrainCapabilityDiscovery = Object.freeze({ INTENT_RULES, inferCapabilities, discoverForIntent, compose });
})();
