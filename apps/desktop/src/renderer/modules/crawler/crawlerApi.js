(function(){
  const KEY = "crawler.jobs";
  function list(){ return window.WeishanStore.read(KEY, []); }
  function createJob(data){ const job=Object.assign({ id:window.WeishanStore.uuid("crawl"), status:"queued", depth:1, createdAt:window.WeishanStore.now() }, data||{}); window.WeishanStore.write(KEY, [job].concat(list())); window.HistoryApi.record("crawler.create", job); return job; }
  window.CrawlerApi = { list, createJob };
})();
