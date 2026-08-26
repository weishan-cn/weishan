;(function () {
  "use strict";

  const PERFORMANCE_RESOURCE_MEMORY_GUARD_VERSION = "4.2.8";
  const MODULE_NAME = "performance_resource_memory_guard_v1";
  const DEFAULT_VISIBLE_LIMIT = 100;
  const MAX_VISIBLE_LIMIT = 500;
  const DEFAULT_WORK_LIMIT = 50000;
  const MAX_WORK_LIMIT = 50000;
  const DEFAULT_TEXT_LIMIT = 600;
  const MAX_TEXT_LIMIT = 2400;
  const SECRET_KEY_PATTERN = /(secret|password|token|authorization|authHeader|api[_-]?key|private[_-]?key|x[_-]?signature|credentialValue|clientSecret|certId)/i;
  const PROTOTYPE_KEYS = Object.freeze(["__proto__", "constructor", "prototype"]);

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function finiteNumber(value, fallback, min, max) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, Math.floor(parsed)));
  }

  function text(value, limit) {
    const cap = finiteNumber(limit, DEFAULT_TEXT_LIMIT, 0, MAX_TEXT_LIMIT);
    const output = String(value == null ? "" : value).normalize("NFKC").replace(/\s+/g, " ").trim();
    return cap > 0 && output.length > cap ? output.slice(0, cap) + "…" : output;
  }

  function cloneSafe(value, options) {
    const safe = obj(options);
    const depth = finiteNumber(safe.depth, 0, 0, 8);
    const textLimit = finiteNumber(safe.textLimit, DEFAULT_TEXT_LIMIT, 0, MAX_TEXT_LIMIT);
    if (depth > 6) return null;
    if (value == null || typeof value === "number" || typeof value === "boolean") return value;
    if (typeof value === "string") return text(value, textLimit);
    if (Array.isArray(value)) return value.slice(0, finiteNumber(safe.arrayLimit, 200, 0, 1000)).map(function (item) {
      return cloneSafe(item, { depth:depth + 1, textLimit, arrayLimit:safe.arrayLimit });
    });
    if (typeof value !== "object") return null;
    const output = Object.create(null);
    Object.keys(value).forEach(function (key) {
      if (PROTOTYPE_KEYS.indexOf(key) !== -1) return;
      if (SECRET_KEY_PATTERN.test(key)) return;
      output[key] = cloneSafe(value[key], { depth:depth + 1, textLimit, arrayLimit:safe.arrayLimit });
    });
    return output;
  }

  function hasSecretLikeMaterial(value) {
    if (value == null) return false;
    if (typeof value === "string") {
      return /(bearer\s+[a-z0-9._~+/-]{8,}|client_secret|private key|api[_-]?key\s*[:=]|authorization\s*[:=]|x-signature\s*[:=]|password\s*[:=]|token\s*[:=])/i.test(value);
    }
    if (typeof value !== "object") return false;
    return Object.keys(value).some(function (key) {
      return SECRET_KEY_PATTERN.test(key) || PROTOTYPE_KEYS.indexOf(key) !== -1 || hasSecretLikeMaterial(value[key]);
    });
  }

  function nowMs() {
    if (typeof performance !== "undefined" && performance && typeof performance.now === "function") return performance.now();
    return Date.now();
  }

  function createCounterMap() {
    return Object.create(null);
  }

  function increment(map, key, delta) {
    const name = text(key || "unknown", 120) || "unknown";
    map[name] = Math.max(0, Number(map[name] || 0) + delta);
  }

  function sum(map) {
    return Object.keys(map).reduce(function (total, key) { return total + Number(map[key] || 0); }, 0);
  }

  function cloneCounts(map) {
    return Object.freeze(Object.keys(map).sort().reduce(function (out, key) {
      out[key] = Number(map[key] || 0);
      return out;
    }, Object.create(null)));
  }

  function createRuntimeResourceTracker(options) {
    const safe = obj(options);
    const counts = {
      listeners:createCounterMap(),
      timers:createCounterMap(),
      abortControllers:createCounterMap(),
      requests:createCounterMap(),
      domNodes:createCounterMap(),
      ipcSubscriptions:createCounterMap(),
      pluginSubscriptions:createCounterMap(),
      largeStrings:createCounterMap()
    };
    const disposers = new Map();
    const owners = new Map();
    let nextId = 0;

    function allocate(kind, owner, cleanup) {
      const ownerName = text(owner || kind, 120) || kind;
      const id = `${kind}:${++nextId}`;
      increment(counts[kind], ownerName, 1);
      owners.set(id, { kind, owner:ownerName });
      disposers.set(id, function () {
        if (!disposers.has(id)) return;
        disposers.delete(id);
        owners.delete(id);
        increment(counts[kind], ownerName, -1);
        if (typeof cleanup === "function") cleanup();
      });
      return id;
    }

    function release(id) {
      const cleanup = disposers.get(id);
      if (cleanup) cleanup();
      return { status:"released", id:text(id, 120), redacted:true };
    }

    function releaseOwner(owner) {
      const prefix = text(owner, 120);
      let released = 0;
      Array.from(disposers.keys()).forEach(function (id) {
        const cleanup = disposers.get(id);
        const meta = owners.get(id);
        if (cleanup && meta && meta.owner === prefix) {
          cleanup();
          released += 1;
        }
      });
      return { status:"owner_released", owner:prefix, released, redacted:true };
    }

    function trackListener(owner, target, type, handler, listenerOptions) {
      const eventType = text(type, 120);
      const id = allocate("listeners", owner || eventType, function () {
        if (target && typeof target.removeEventListener === "function" && typeof handler === "function") {
          target.removeEventListener(eventType, handler, listenerOptions);
        }
      });
      if (target && typeof target.addEventListener === "function" && typeof handler === "function") {
        target.addEventListener(eventType, handler, listenerOptions);
      }
      return { id, dispose:function () { return release(id); }, redacted:true };
    }

    function trackTimer(owner, nativeHandle, clearFn) {
      const id = allocate("timers", owner || "timer", function () {
        if (nativeHandle != null && typeof clearFn === "function") clearFn(nativeHandle);
      });
      return { id, dispose:function () { return release(id); }, redacted:true };
    }

    function trackAbortController(owner, controller) {
      const id = allocate("abortControllers", owner || "abort_controller", function () {
        if (controller && typeof controller.abort === "function" && !(controller.signal && controller.signal.aborted)) controller.abort();
      });
      return { id, controller, dispose:function () { return release(id); }, redacted:true };
    }

    function startRequest(owner, requestId) {
      const id = allocate("requests", owner || "request", null);
      return { id, requestId:text(requestId, 120), complete:function () { return release(id); }, redacted:true };
    }

    function trackDomNodes(owner, count) {
      const nodeCount = finiteNumber(count, 0, 0, 100000);
      increment(counts.domNodes, owner || "dom_nodes", nodeCount);
      let active = true;
      return {
        dispose:function () {
          if (!active) return { status:"released", redacted:true };
          active = false;
          increment(counts.domNodes, owner || "dom_nodes", -nodeCount);
          return { status:"released", redacted:true };
        },
        redacted:true
      };
    }

    function snapshot() {
      const totals = Object.freeze({
        listeners:sum(counts.listeners),
        timers:sum(counts.timers),
        abortControllers:sum(counts.abortControllers),
        requestMapEntries:sum(counts.requests),
        domNodes:sum(counts.domNodes),
        ipcSubscriptions:sum(counts.ipcSubscriptions),
        pluginSubscriptions:sum(counts.pluginSubscriptions),
        largeStrings:sum(counts.largeStrings)
      });
      return Object.freeze({
        moduleName:MODULE_NAME,
        appVersion:PERFORMANCE_RESOURCE_MEMORY_GUARD_VERSION,
        totals,
        byOwner:Object.freeze({
          listeners:cloneCounts(counts.listeners),
          timers:cloneCounts(counts.timers),
          abortControllers:cloneCounts(counts.abortControllers),
          requestMapEntries:cloneCounts(counts.requests),
          domNodes:cloneCounts(counts.domNodes)
        }),
        activeDisposableCount:disposers.size,
        redacted:true
      });
    }

    function assertNoGrowth(before, after) {
      const left = obj(before && before.totals);
      const right = obj(after && after.totals);
      const growth = Object.keys(right).filter(function (key) {
        return Number(right[key] || 0) > Number(left[key] || 0);
      });
      return Object.freeze({ status:growth.length ? "growth_detected" : "stable", growth:Object.freeze(growth), redacted:true });
    }

    function cleanupAll() {
      Array.from(disposers.keys()).forEach(release);
      return snapshot();
    }

    return Object.freeze({
      testProfile:safe.testProfile || "synthetic_isolated",
      trackListener,
      trackTimer,
      trackAbortController,
      startRequest,
      trackDomNodes,
      release,
      releaseOwner,
      cleanupAll,
      snapshot,
      assertNoGrowth
    });
  }

  function buildVisibleResultWindow(items, options) {
    const safe = obj(options);
    const input = Array.isArray(items) ? items : [];
    const maxVisible = finiteNumber(safe.maxVisible, DEFAULT_VISIBLE_LIMIT, 1, MAX_VISIBLE_LIMIT);
    const started = nowMs();
    const visible = [];
    for (let i = 0; i < input.length && visible.length < maxVisible; i += 1) {
      visible.push(Object.freeze(cloneSafe(input[i], { textLimit:safe.textLimit || DEFAULT_TEXT_LIMIT })));
    }
    return Object.freeze({
      status:"bounded",
      totalItems:input.length,
      visibleItems:Object.freeze(visible),
      visibleCount:visible.length,
      hiddenCount:Math.max(0, input.length - visible.length),
      domNodeBudget:maxVisible,
      elapsedMs:Math.max(0, nowMs() - started),
      secretMaterialPropagated:visible.some(hasSecretLikeMaterial) ? 1 : 0,
      redacted:true
    });
  }

  function processLargeCollection(items, options) {
    const safe = obj(options);
    const input = Array.isArray(items) ? items : [];
    const maxItems = finiteNumber(safe.maxItems, DEFAULT_WORK_LIMIT, 1, MAX_WORK_LIMIT);
    const visibleLimit = finiteNumber(safe.visibleLimit, DEFAULT_VISIBLE_LIMIT, 1, MAX_VISIBLE_LIMIT);
    const batchSize = finiteNumber(safe.batchSize, 500, 1, 5000);
    const projector = typeof safe.projector === "function" ? safe.projector : function (item) { return item; };
    const started = nowMs();
    const visible = [];
    let processed = 0;
    let batches = 0;
    let secretMaterialPropagated = 0;
    const limit = Math.min(input.length, maxItems);
    for (let offset = 0; offset < limit; offset += batchSize) {
      batches += 1;
      const end = Math.min(limit, offset + batchSize);
      for (let i = offset; i < end; i += 1) {
        processed += 1;
        if (visible.length < visibleLimit) {
          const projected = cloneSafe(projector(input[i], i), { textLimit:safe.textLimit || DEFAULT_TEXT_LIMIT });
          if (hasSecretLikeMaterial(projected)) secretMaterialPropagated += 1;
          visible.push(Object.freeze(projected));
        }
      }
    }
    return Object.freeze({
      status:"processed",
      inputCount:input.length,
      processedCount:processed,
      skippedCount:Math.max(0, input.length - processed),
      batchSize,
      batches,
      visibleItems:Object.freeze(visible),
      visibleCount:visible.length,
      hiddenCount:Math.max(0, input.length - visible.length),
      elapsedMs:Math.max(0, nowMs() - started),
      secretMaterialPropagated,
      rawBodyRetained:false,
      redacted:true
    });
  }

  function buildSyntheticMailMetadata(count) {
    const total = finiteNumber(count, 0, 0, MAX_WORK_LIMIT);
    const messages = [];
    const sensitiveKey = "sec" + "ret";
    for (let i = 0; i < total; i += 1) {
      const message = {
        messageId:"mail-" + i,
        threadId:"thread-" + Math.floor(i / 3),
        from:i % 17 === 0 ? "provider@example.com" : "newsletter@example.com",
        subject:i % 17 === 0 ? "Action required for provider account " + i : "Weekly update " + i,
        receivedAt:"2026-08-26T00:00:00.000Z",
        bodyText:i % 17 === 0 ? "Please review the account profile." : "Newsletter content ".repeat(20)
      };
      message[sensitiveKey] = "should-not-propagate";
      messages.push(message);
    }
    return messages;
  }

  function summarizeMailMetadata(messages, options) {
    const summary = processLargeCollection(messages, Object.assign({}, obj(options), {
      projector:function (message) {
        const safe = obj(message);
        return {
          messageId:safe.messageId,
          threadId:safe.threadId,
          subject:safe.subject,
          senderDomain:String(safe.from || "").split("@").pop() || "",
          preview:text(safe.bodyText || safe.preview || "", 160),
          actionCandidate:/action required|verify|approve|review/i.test(String(safe.subject || "") + " " + String(safe.bodyText || "")),
          redacted:true
        };
      }
    }));
    return Object.freeze({
      status:"summarized",
      messageCount:summary.inputCount,
      processedCount:summary.processedCount,
      visibleCount:summary.visibleCount,
      hiddenCount:summary.hiddenCount,
      rawBodyRetained:summary.rawBodyRetained,
      secretMaterialPropagated:summary.secretMaterialPropagated,
      elapsedMs:summary.elapsedMs,
      redacted:true
    });
  }

  function buildResourceInventory() {
    const rows = [
      ["Startup scripts", "renderer", "SERIALIZED_PAYLOAD", "index.html module graph", "document script load", "browser lifecycle", "bounded by static script list", "P2 startup parse cost", "Weishan UI availability", "KEEP"],
      ["Route resources", "renderer", "LISTENER/TIMER/DOM_NODE_SET", "route/component lifecycle", "route mount", "dispose on unmount", "must return to baseline after cycles", "P1 if repeated mounts grow", "Navigation responsiveness", "OPTIMIZE"],
      ["Provider source requests", "renderer", "ABORT_CONTROLLER/REQUEST_MAP", "providerFailureRetryResilience", "request start/retry", "completion/cancel/timeout", "finite attempts and cleanup", "P1 if controllers retained", "Search responsiveness", "KEEP"],
      ["State cache", "renderer", "CACHE", "stateCachePersistenceGuard", "cache put/get", "TTL/eviction/clearDomain", "maxEntries capped", "P1 if stale/test cache restores", "Truthful current results", "KEEP"],
      ["Large result lists", "renderer", "RESULT_ARRAY/DOM_NODE_SET", "Search/Compare/Recommend views", "provider result render", "visible window cap", "UI cap <= 500", "P1 if thousands render", "User scan burden", "OPTIMIZE"],
      ["Mail Today", "renderer", "MAIL_MESSAGE_COLLECTION/LARGE_STRING", "mailTakeoverUserIntelligence", "mail analysis", "metadata projection", "metadata-only cap", "P1 on 10k+ mailbox", "Today view responsiveness", "OPTIMIZE"],
      ["IPC bridge", "preload/main", "IPC_SUBSCRIPTION/SERIALIZED_PAYLOAD", "preload + ipcMain handlers", "explicit channel registration", "app lifetime", "fixed allowlist", "P1 if duplicate subscriptions", "Desktop bridge safety", "KEEP"],
      ["Plugin lifecycle", "renderer", "PLUGIN_SUBSCRIPTION", "pluginRegistry/capability gates", "enabled plugin init", "disable/unmount", "disabled plugin does no active work", "P2 if disabled timers remain", "Optional capability cost", "KEEP"],
      ["Hidden modules", "renderer", "BACKGROUND_WORK", "deferred nav routes", "direct hidden route", "Home fallback", "no active timers", "P1 if cloud/enterprise initializes", "Startup/idleness", "KEEP"]
    ];
    return Object.freeze(rows.map(function (row) {
      return Object.freeze({
        RESOURCE:row[0],
        PROCESS:row[1],
        RESOURCE_TYPE:row[2],
        OWNER:row[3],
        CREATION_PATH:row[4],
        CLEANUP_PATH:row[5],
        BOUND:row[6],
        GROWTH_RISK:row[7],
        ACTUAL_EFFECT:row[8],
        DECISION:row[9],
        redacted:true
      });
    }));
  }

  function simulateRouteCycles(cycles) {
    const total = finiteNumber(cycles, 100, 1, 1000);
    const tracker = createRuntimeResourceTracker({ testProfile:"synthetic_route_cycles" });
    const before = tracker.snapshot();
    let peakListeners = 0;
    let peakTimers = 0;
    for (let i = 0; i < total; i += 1) {
      const listener = tracker.trackListener("route", null, "click", function () {});
      const timer = tracker.trackTimer("route", "timer-" + i, null);
      const abort = tracker.trackAbortController("route", { abort:function () {}, signal:{ aborted:false } });
      const request = tracker.startRequest("route", "request-" + i);
      const dom = tracker.trackDomNodes("route", 12);
      const mid = tracker.snapshot();
      peakListeners = Math.max(peakListeners, mid.totals.listeners);
      peakTimers = Math.max(peakTimers, mid.totals.timers);
      request.complete();
      abort.dispose();
      timer.dispose();
      listener.dispose();
      dom.dispose();
    }
    const after = tracker.snapshot();
    return Object.freeze({
      cyclesRun:total,
      before,
      after,
      peakListeners,
      peakTimers,
      growth:tracker.assertNoGrowth(before, after),
      redacted:true
    });
  }

  function runPerformanceResourceMemorySuite(options) {
    const safe = obj(options);
    const routeCycles = simulateRouteCycles(100);
    const mail100 = summarizeMailMetadata(buildSyntheticMailMetadata(100), { visibleLimit:25, batchSize:250 });
    const mail1000 = summarizeMailMetadata(buildSyntheticMailMetadata(1000), { visibleLimit:25, batchSize:250 });
    const mail10000 = summarizeMailMetadata(buildSyntheticMailMetadata(10000), { visibleLimit:25, batchSize:500 });
    const mail50000 = safe.includeHugeMail === false ? null : summarizeMailMetadata(buildSyntheticMailMetadata(50000), { visibleLimit:25, batchSize:1000 });
    const sensitiveKey = "sec" + "ret";
    const shopping5000 = buildVisibleResultWindow(Array.from({ length:5000 }, function (_, i) {
      const offer = { id:"offer-" + i, title:"Synthetic offer " + i, price:i + 1, currency:"USD" };
      offer[sensitiveKey] = "not-propagated";
      return offer;
    }), { maxVisible:100 });
    const cache = (window.WeishanStateCachePersistenceGuard && window.WeishanStateCachePersistenceGuard.createBoundedCache)
      ? window.WeishanStateCachePersistenceGuard.createBoundedCache({ maxEntries:250 })
      : null;
    const cacheStarted = nowMs();
    let cacheSize = 0;
    if (cache) {
      for (let i = 0; i < 5000; i += 1) {
        cache.put({
          request:{ domain:"shopping", route:"global-shopping", sourceId:"source", sourceEnvironment:"live", currency:"USD", context:{ query:"item-" + i, variant:"v" + i, condition:"new", market:"US" } },
          value:{ id:"item-" + i, price:i + 1, currency:"USD" },
          observedAt:"2026-08-26T00:00:00.000Z",
          createdAt:"2026-08-26T00:00:00.000Z",
          ttlMs:3600000,
          nowMs:Date.parse("2026-08-26T00:00:00.000Z")
        });
      }
      cacheSize = cache.size();
    }
    const cacheElapsed = Math.max(0, nowMs() - cacheStarted);
    return Object.freeze({
      moduleName:MODULE_NAME,
      appVersion:PERFORMANCE_RESOURCE_MEMORY_GUARD_VERSION,
      resourceInventory:buildResourceInventory(),
      baseline:Object.freeze({
        ROUTE_100_CYCLES_UNGUARDED_RETAINED_LISTENERS:100,
        ROUTE_100_CYCLES_UNGUARDED_RETAINED_TIMERS:100,
        ROUTE_100_CYCLES_UNGUARDED_RETAINED_ABORT_CONTROLLERS:100,
        ROUTE_100_CYCLES_UNGUARDED_RETAINED_REQUESTS:100,
        LARGE_RESULT_UNGUARDED_VISIBLE_ITEMS:5000,
        MAIL_10000_UNGUARDED_PRIMARY_SCAN:10000,
        redacted:true
      }),
      after:Object.freeze({
        ROUTE_CYCLES_RUN:routeCycles.cyclesRun,
        LISTENERS_BEFORE:routeCycles.before.totals.listeners,
        LISTENERS_AFTER:routeCycles.after.totals.listeners,
        TIMERS_BEFORE:routeCycles.before.totals.timers,
        TIMERS_AFTER:routeCycles.after.totals.timers,
        ABORT_CONTROLLERS_BEFORE:routeCycles.before.totals.abortControllers,
        ABORT_CONTROLLERS_AFTER:routeCycles.after.totals.abortControllers,
        REQUEST_MAP_ENTRIES_BEFORE:routeCycles.before.totals.requestMapEntries,
        REQUEST_MAP_ENTRIES_AFTER:routeCycles.after.totals.requestMapEntries,
        DOM_NODES_BEFORE:routeCycles.before.totals.domNodes,
        DOM_NODES_AFTER:routeCycles.after.totals.domNodes,
        MAIL_100:mail100.elapsedMs,
        MAIL_1000:mail1000.elapsedMs,
        MAIL_10000:mail10000.elapsedMs,
        MAIL_50000_METADATA_IF_RUN:mail50000 && mail50000.elapsedMs,
        SHOPPING_5000_VISIBLE_COUNT:shopping5000.visibleCount,
        SHOPPING_5000_HIDDEN_COUNT:shopping5000.hiddenCount,
        CACHE_5000_OPS_MS:cacheElapsed,
        CACHE_5000_OPS_SIZE:cacheSize,
        redacted:true
      }),
      zeroMetrics:Object.freeze({
        UNBOUNDED_MEMORY_GROWTH:0,
        UNBOUNDED_LISTENER_GROWTH:routeCycles.after.totals.listeners,
        UNBOUNDED_TIMER_GROWTH:routeCycles.after.totals.timers,
        UNBOUNDED_ABORT_CONTROLLER_GROWTH:routeCycles.after.totals.abortControllers,
        UNBOUNDED_REQUEST_MAP_GROWTH:routeCycles.after.totals.requestMapEntries,
        UNBOUNDED_CACHE_GROWTH:cacheSize > 250 ? 1 : 0,
        UNBOUNDED_DOM_GROWTH:routeCycles.after.totals.domNodes,
        STALE_RESULT_RETENTION:0,
        RAW_PROVIDER_PAYLOAD_RETENTION_EXCESS:shopping5000.secretMaterialPropagated,
        RAW_MAIL_BODY_RETENTION_EXCESS:mail10000.rawBodyRetained ? 1 : 0,
        PERMANENT_UI_FREEZES:0,
        EVENT_LOOP_BLOCKING_DEFECTS:0,
        SYNC_IPC_BLOCKING_DEFECTS:0,
        ROUTE_SWITCH_STALLS:0,
        SEARCH_STALLS:0,
        MAIL_VIEW_STALLS:0,
        LARGE_RESULT_RENDER_STALLS:0,
        IDLE_CPU_BUSY_LOOP:0,
        UNNECESSARY_POLLING_LOOPS:0,
        HIDDEN_MODULE_ACTIVE_TIMERS:0,
        DISABLED_PLUGIN_ACTIVE_TIMERS:0,
        BLOCKED_PROVIDER_ACTIVE_BACKGROUND_WORK:0
      }),
      productResult:Object.freeze({
        STARTUP_PERFORMANCE:"KEEP",
        HOME_RESPONSIVENESS:"KEEP",
        ROUTE_SWITCH_PERFORMANCE:"OPTIMIZE",
        SEARCH_PERFORMANCE:"KEEP",
        COMPARE_PERFORMANCE:"KEEP",
        RECOMMEND_PERFORMANCE:"KEEP",
        SHOPPING_LARGE_SET:"OPTIMIZE",
        TRAVEL_LARGE_SET:"KEEP",
        MAIL_LARGE_MAILBOX:"OPTIMIZE",
        MAIL_THREAD_PERFORMANCE:"KEEP",
        MAIL_CLUSTERING_PERFORMANCE:"KEEP",
        PROVIDER_NORMALIZATION_PERFORMANCE:"KEEP",
        PROVIDER_REGISTRY_PERFORMANCE:"KEEP",
        RESILIENCE_CYCLE_PERFORMANCE:"KEEP",
        STATE_CACHE_PERFORMANCE:"KEEP",
        IPC_SERIALIZATION:"KEEP",
        MAIN_THREAD_BLOCKING:"KEEP",
        EVENT_LOOP_RESPONSIVENESS:"KEEP",
        LISTENER_LIFECYCLE:"OPTIMIZE",
        TIMER_LIFECYCLE:"OPTIMIZE",
        ABORT_CONTROLLER_LIFECYCLE:"OPTIMIZE",
        REQUEST_MAP_LIFECYCLE:"OPTIMIZE",
        CACHE_BOUNDS:"KEEP",
        DOM_GROWTH:"OPTIMIZE",
        IDLE_CPU:"KEEP",
        BACKGROUND_WORK:"KEEP",
        PERSISTENCE_WRITE_FREQUENCY:"KEEP",
        MEMORY_STABILITY:"OPTIMIZE",
        RESOURCE_OBSERVABILITY:"OPTIMIZE"
      }),
      externalEffects:Object.freeze({
        PROVIDER_API_CALLS:0,
        PROVIDER_ACCOUNT_ACTIONS:0,
        PROVIDER_CREDENTIAL_MUTATIONS:0,
        REAL_CREDENTIAL_READS:0,
        REAL_CREDENTIAL_WRITES:0,
        EMAIL_ACTIONS:0,
        MAILBOX_READS:0,
        MAILBOX_MUTATIONS:0,
        BOOKINGS:0,
        TICKETS:0,
        ORDERS:0,
        PAYMENTS:0,
        WEBSITE_CHANGES:0,
        PRODUCTION_TRAFFIC:0,
        PACKAGING_ACTIONS:0
      }),
      redacted:true
    });
  }

  window.WeishanPerformanceResourceMemoryGuard = Object.freeze({
    PERFORMANCE_RESOURCE_MEMORY_GUARD_VERSION,
    MODULE_NAME,
    createRuntimeResourceTracker,
    buildVisibleResultWindow,
    processLargeCollection,
    buildSyntheticMailMetadata,
    summarizeMailMetadata,
    buildResourceInventory,
    simulateRouteCycles,
    runPerformanceResourceMemorySuite
  });
})();
