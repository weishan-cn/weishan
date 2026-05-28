(function(){
  function usage(){ const sub=window.SubscriptionApi.current(); const quota=sub.storage_quota_gb||0; const used=window.WeishanStore.read("storage.usedGb", 0); return { quota_gb:quota, used_gb:used, percent:quota ? Math.min(100, Math.round(used / quota * 100)) : 0 }; }
  function allocateDefaultSpace(userIds, gb){ const items=(userIds||[]).map(id => ({ user_id:id, quota_gb:gb||1, createdAt:window.WeishanStore.now() })); window.WeishanStore.write("storage.allocations", items); return items; }
  window.StorageApi = { usage, allocateDefaultSpace };
})();
