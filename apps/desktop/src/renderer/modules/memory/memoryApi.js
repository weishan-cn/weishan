(function(){
  const KEY = "memory.items";
  function list(){ return window.WeishanStore.read(KEY, []); }
  function save(type, content, tags){ const item={ id:window.WeishanStore.uuid("mem"), type:type||"note", content:String(content||""), tags:tags||[], createdAt:window.WeishanStore.now() }; window.WeishanStore.write(KEY, [item].concat(list()).slice(0, 2000)); window.HistoryApi.record("memory.save", { id:item.id, type:item.type }); return item; }
  function search(q){ const s=String(q||"").toLowerCase(); return list().filter(x => (x.content + " " + (x.tags||[]).join(" ")).toLowerCase().includes(s)); }
  window.MemoryApi = { list, save, search };
})();
