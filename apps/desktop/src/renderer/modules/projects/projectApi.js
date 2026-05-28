(function(){
  const KEY = "projects.items";
  function list(){ return window.WeishanStore.read(KEY, []); }
  function create(name, data){ const item=Object.assign({ id:window.WeishanStore.uuid("proj"), name:String(name||"新项目"), status:"active", progress:0, dueDate:"", tasks:[], createdAt:window.WeishanStore.now() }, data||{}); window.WeishanStore.write(KEY, [item].concat(list())); window.HistoryApi.record("project.create", { id:item.id, name:item.name }); return item; }
  function update(id, patch){ window.WeishanStore.write(KEY, list().map(x => x.id === id ? Object.assign({}, x, patch||{}, { updatedAt:window.WeishanStore.now() }) : x)); }
  window.ProjectApi = { list, create, update };
})();
