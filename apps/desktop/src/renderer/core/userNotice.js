(function(){
  "use strict";

  function show(host, message, options){
    const root = host && host.querySelector ? host : document.getElementById("pageHost");
    if (!root) return null;
    let notice = root.querySelector("[data-user-notice]");
    if (!notice) {
      notice = document.createElement("p");
      notice.className = "ws-muted ws-inline-notice";
      notice.setAttribute("data-user-notice", "");
      notice.setAttribute("role", options && options.error ? "alert" : "status");
      notice.setAttribute("aria-live", options && options.error ? "assertive" : "polite");
      const anchor = root.querySelector(".ws-card");
      if (anchor) anchor.appendChild(notice); else root.prepend(notice);
    }
    notice.classList.toggle("is-error", !!(options && options.error));
    notice.textContent = String(message || "").replace(/\s+/g, " ").trim().slice(0, 360);
    return notice;
  }

  window.WeishanUserNotice = Object.freeze({ show });
})();
