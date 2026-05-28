(function(){
  function exportLocalSnapshot(){ const data={}; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k && k.startsWith(window.WeishanStore.NS)) data[k]=localStorage.getItem(k); } return JSON.stringify({ product:"weishan", version:"2.0.0", exportedAt:window.WeishanStore.now(), data }, null, 2); }
  function restoreLocalSnapshot(text){ const p=JSON.parse(text); Object.keys(p.data||{}).forEach(k => localStorage.setItem(k, p.data[k])); return { ok:true }; }
  window.BackupApi = { exportLocalSnapshot, restoreLocalSnapshot };
})();
