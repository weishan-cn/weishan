(function(){
  const OUTPUT_PROFILES = Object.freeze([
    { id:"vertical", aspectRatio:"9:16", examples:["Douyin-style short", "TikTok-style short", "YouTube Shorts-style short"] },
    { id:"landscape", aspectRatio:"16:9", examples:["Landscape video"] },
    { id:"square", aspectRatio:"1:1", examples:["Square social video"] }
  ]);
  function text(value){ return String(value == null ? "" : value).trim(); }
  function planFromBrief(brief, options){
    const safeBrief = text(brief).slice(0, 2000);
    const profileId = text(options && options.profile) || "vertical";
    const profile = OUTPUT_PROFILES.find((item) => item.id === profileId) || OUTPUT_PROFILES[0];
    if (!safeBrief) return { status:"BLOCKED", reason:"BRIEF_REQUIRED", renderedVideo:null, fakeGeneration:false };
    const durationSeconds = Math.min(180, Math.max(5, Number(options && options.durationSeconds) || 45));
    const artifacts = [
      { type:"script", status:"PLANNED", summary:`${durationSeconds}s script outline`, sourceBrief:safeBrief },
      { type:"storyboard", status:"PLANNED", scenes:[{ order:1, purpose:"hook" }, { order:2, purpose:"core message" }, { order:3, purpose:"closing" }] },
      { type:"project_timeline", status:"PLANNED", durationSeconds, aspectRatio:profile.aspectRatio, tracks:["visual", "subtitle", "voiceover", "music"] },
      { type:"cover_image", status:"PLANNED", aspectRatio:profile.aspectRatio },
      { type:"rendered_video", status:"NOT_RENDERED" }
    ];
    return {
      status:"FOUNDATION_PLAN_ONLY",
      capabilityChain:["video.script", "video.storyboard", "video.subtitle", "video.voiceover", "video.edit", "video.cover", "video.export"],
      artifacts,
      exportPlan:{ profile:profile.id, aspectRatio:profile.aspectRatio, publishingIncluded:false, rendererRequired:true },
      renderedVideo:null,
      fakeGeneration:false,
      providerSelected:false,
      externalEffects:0
    };
  }
  window.WeishanVideoStudioFoundation = Object.freeze({ OUTPUT_PROFILES, planFromBrief });
})();
