;(function () {
  "use strict";

  const SAFE_EXTERNAL_SEARCH_HANDOFF_VERSION = "2.1.53";
  const TRUSTED_HOSTS = ["www.google.com", "google.com", "www.bing.com", "bing.com", "duckduckgo.com", "www.trip.com", "trip.com"];

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalizeKindLabel(kind) {
    const raw = text(kind);
    if (raw === "web") return "打开全网搜索";
    if (raw === "googleFlights") return "打开 Google Flights 搜索";
    if (raw === "tripCom") return "打开 Trip.com / 携程搜索";
    return raw || "外部搜索入口";
  }

  function extractHost(url) {
    try {
      return new URL(text(url)).hostname;
    } catch (_) {
      return "";
    }
  }

  function evaluateExternalLinkRuntimeGuard(url, input) {
    const value = text(url);
    const safeInput = input && typeof input === "object" ? input : {};
    try {
      const parsed = new URL(value);
      const allowed = parsed.protocol === "https:" && TRUSTED_HOSTS.includes(parsed.hostname);
      return clone({
        handoffVersion: SAFE_EXTERNAL_SEARCH_HANDOFF_VERSION,
        phase: "safe_external_search_handoff_v1",
        status: allowed ? "allowed_after_manual_confirmation" : "blocked",
        allowed,
        reason: allowed ? "trusted https host" : "untrusted external search url",
        urlProtocol: parsed.protocol,
        urlHost: parsed.hostname,
        taskId: text(safeInput.taskId || ""),
        taskTitle: text(safeInput.taskTitle || ""),
        kind: text(safeInput.kind || ""),
        label: normalizeKindLabel(safeInput.kind || safeInput.label || ""),
        confirmationRequired: true,
        autoOpen: false,
        bookingUrl: "disabled",
        payment: "disabled",
        order: "disabled",
        realProvider: "disabled",
        realNetwork: "disabled",
        trustedHosts: TRUSTED_HOSTS.slice(),
        redacted: true,
        audit: {
          eventType: "SAFE_EXTERNAL_SEARCH_HANDOFF_DRAFT",
          allowed,
          confirmationRequired: true,
          autoOpen: false,
          bookingUrlDisplayedCount: 0,
          paymentActionDisplayedCount: 0,
          orderActionDisplayedCount: 0,
          redacted: true
        }
      });
    } catch (_) {
      return clone({
        handoffVersion: SAFE_EXTERNAL_SEARCH_HANDOFF_VERSION,
        phase: "safe_external_search_handoff_v1",
        status: "blocked",
        allowed: false,
        reason: "invalid external search url",
        urlProtocol: "",
        urlHost: extractHost(value),
        taskId: text(safeInput.taskId || ""),
        taskTitle: text(safeInput.taskTitle || ""),
        kind: text(safeInput.kind || ""),
        label: normalizeKindLabel(safeInput.kind || safeInput.label || ""),
        confirmationRequired: true,
        autoOpen: false,
        bookingUrl: "disabled",
        payment: "disabled",
        order: "disabled",
        realProvider: "disabled",
        realNetwork: "disabled",
        trustedHosts: TRUSTED_HOSTS.slice(),
        redacted: true,
        audit: {
          eventType: "SAFE_EXTERNAL_SEARCH_HANDOFF_DRAFT",
          allowed: false,
          confirmationRequired: true,
          autoOpen: false,
          bookingUrlDisplayedCount: 0,
          paymentActionDisplayedCount: 0,
          orderActionDisplayedCount: 0,
          redacted: true
        }
      });
    }
  }

  function buildSafeExternalSearchHandoffGate(input) {
    const safe = input && typeof input === "object" ? input : {};
    const guard = evaluateExternalLinkRuntimeGuard(safe.url, safe);
    return clone({
      handoffVersion: SAFE_EXTERNAL_SEARCH_HANDOFF_VERSION,
      phase: "safe_external_search_handoff_v1",
      status: guard.allowed ? "manual_confirmation_required" : "blocked",
      kind: guard.kind || text(safe.kind || ""),
      label: guard.label || normalizeKindLabel(safe.kind || safe.label || ""),
      taskId: guard.taskId || text(safe.taskId || ""),
      taskTitle: guard.taskTitle || text(safe.taskTitle || ""),
      url: text(safe.url || ""),
      urlHost: guard.urlHost || extractHost(safe.url),
      urlProtocol: guard.urlProtocol || "",
      allowed: guard.allowed === true,
      allowedHosts: TRUSTED_HOSTS.slice(),
      confirmationRequired: true,
      autoOpen: false,
      bookingUrl: "disabled",
      payment: "disabled",
      order: "disabled",
      realProvider: "disabled",
      realNetwork: "disabled",
      redacted: true,
      audit: {
        eventType: "SAFE_EXTERNAL_SEARCH_HANDOFF_DRAFT",
        manualConfirmationRequired: true,
        autoOpen: false,
        allowed: guard.allowed === true,
        urlHost: guard.urlHost || "",
        bookingUrlDisplayedCount: 0,
        paymentActionDisplayedCount: 0,
        orderActionDisplayedCount: 0,
        redacted: true
      }
    });
  }

  function buildTrustedExternalSearchUrls(input) {
    const safe = input && typeof input === "object" ? input : {};
    const result = {
      web: text(safe.web || ""),
      googleFlights: text(safe.googleFlights || ""),
      tripCom: text(safe.tripCom || "")
    };
    const guarded = {};
    for (const key of Object.keys(result)) {
      const url = result[key];
      const guard = evaluateExternalLinkRuntimeGuard(url, { kind: key });
      guarded[key] = guard.allowed ? url : "";
    }
    return clone(guarded);
  }

  function buildExternalSearchConfirmationUi(input) {
    const gate = input && typeof input === "object" ? input : buildSafeExternalSearchHandoffGate({});
    const label = normalizeKindLabel(gate.kind || gate.label || "");
    const host = text(gate.urlHost || "");
    return clone({
      handoffVersion: SAFE_EXTERNAL_SEARCH_HANDOFF_VERSION,
      phase: "safe_external_search_handoff_v1",
      title: "外部搜索确认",
      summaryLine: "点击后会先确认，再打开可信外部搜索入口。",
      currentStatusLine: "当前状态：需要用户手动确认后才会打开外部搜索链接。",
      currentEntryLine: "当前入口：" + label,
      hostLine: host ? "可信域名：" + host : "可信域名：google.com / bing.com / duckduckgo.com / trip.com",
      safetyLine: "weishan 不自动打开、不付款、不下单。",
      confirmButtonLabel: "确认打开外部搜索链接",
      cancelButtonLabel: "取消",
      redacted: true,
      audit: {
        eventType: "SAFE_EXTERNAL_SEARCH_CONFIRMATION_UI_DRAFT",
        confirmationRequired: true,
        autoOpen: false,
        bookingUrlDisplayedCount: 0,
        paymentActionDisplayedCount: 0,
        orderActionDisplayedCount: 0,
        redacted: true
      }
    });
  }

  function renderExternalSearchConfirmationHtml(input) {
    const ui = buildExternalSearchConfirmationUi(input);
    return `<section class="commerce-safe-external-search-handoff" aria-label="外部搜索确认">
      <h5>${escapeHtml(ui.title || "外部搜索确认")}</h5>
      <p>${escapeHtml(ui.summaryLine || "点击后会先确认，再打开可信外部搜索入口。")}</p>
      <p>${escapeHtml(ui.currentStatusLine || "当前状态：需要用户手动确认后才会打开外部搜索链接。")}</p>
      <p>${escapeHtml(ui.currentEntryLine || "")}</p>
      <p>${escapeHtml(ui.safetyLine || "weishan 不自动打开、不付款、不下单。")}</p>
      <p>bookings / payment / order：disabled</p>
      <div class="commerce-safe-external-search-handoff-actions">
        <button class="cmd-btn primary" type="button" data-commerce-external-search-confirm="true">${escapeHtml(ui.confirmButtonLabel || "确认打开外部搜索链接")}</button>
        <button class="cmd-btn gray" type="button" data-commerce-external-search-cancel="true">${escapeHtml(ui.cancelButtonLabel || "取消")}</button>
      </div>
    </section>`;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function(c){
      return { "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;" }[c];
    });
  }

  function assertSafeExternalSearchHandoffGate(gate) {
    const safe = gate && typeof gate === "object" ? gate : {};
    if (safe.autoOpen !== false) throw new Error("safe external search handoff must not auto open");
    if (safe.confirmationRequired !== true) throw new Error("safe external search handoff must require confirmation");
    if (safe.bookingUrl !== "disabled" || safe.payment !== "disabled" || safe.order !== "disabled") throw new Error("safe external search handoff must keep booking/payment/order disabled");
    if (safe.realProvider !== "disabled" || safe.realNetwork !== "disabled") throw new Error("safe external search handoff must keep provider/network disabled");
    if (safe.redacted !== true || !safe.audit || safe.audit.redacted !== true) throw new Error("safe external search handoff must stay redacted");
    if (safe.allowed === true) {
      const host = text(safe.urlHost || "");
      if (!TRUSTED_HOSTS.includes(host)) throw new Error("safe external search handoff must only allow trusted hosts");
    }
    return true;
  }

  function assertExternalSearchConfirmationUiSafe(ui) {
    const safe = ui && typeof ui === "object" ? ui : {};
    if (safe.redacted !== true || !safe.audit || safe.audit.redacted !== true) throw new Error("external search confirmation ui must stay redacted");
    const serialized = JSON.stringify(safe);
    if (/https?:\/\/.*(booking|checkout|payment|order)/i.test(serialized)) throw new Error("external search confirmation ui must not expose transaction urls");
    if (/api[_-]?key|token|secret|password/i.test(serialized)) throw new Error("external search confirmation ui must not expose secrets");
    return true;
  }

  function openTrustedExternalSearch(url) {
    const guard = evaluateExternalLinkRuntimeGuard(url, {});
    if (!guard.allowed) return Promise.resolve({ ok: false, guard });
    const value = text(url);
    if (typeof window.__WEISHAN_TEST_OPEN_EXTERNAL__ === "function") {
      return Promise.resolve(window.__WEISHAN_TEST_OPEN_EXTERNAL__(value)).then(() => ({ ok: true, guard })).catch(() => ({ ok: false, guard }));
    }
    if (window.WeishanAPI && typeof window.WeishanAPI.openExternal === "function") {
      return Promise.resolve(window.WeishanAPI.openExternal(value)).then(() => ({ ok: true, guard })).catch(() => ({ ok: false, guard }));
    }
    if (window.weishan && typeof window.weishan.openExternal === "function") {
      return Promise.resolve(window.weishan.openExternal(value)).then(() => ({ ok: true, guard })).catch(() => ({ ok: false, guard }));
    }
    return Promise.resolve({ ok: false, guard });
  }

  window.WeishanSafeExternalSearchHandoff = {
    SAFE_EXTERNAL_SEARCH_HANDOFF_VERSION,
    TRUSTED_HOSTS,
    buildTrustedExternalSearchUrls,
    evaluateExternalLinkRuntimeGuard,
    buildSafeExternalSearchHandoffGate,
    buildExternalSearchConfirmationUi,
    renderExternalSearchConfirmationHtml,
    assertSafeExternalSearchHandoffGate,
    assertExternalSearchConfirmationUiSafe,
    openTrustedExternalSearch
  };
})();
