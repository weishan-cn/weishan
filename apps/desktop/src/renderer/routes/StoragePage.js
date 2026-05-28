(function(){
  const planKeys = {
    CN_PERSONAL_20GB:["planCnPersonal20", "planDescCnPersonal20"],
    CN_PERSONAL_300GB:["planCnPersonal300", "planDescCnPersonal300"],
    CN_PERSONAL_1TB:["planCnPersonal1t", "planDescCnPersonal1t"],
    CN_PERSONAL_5TB:["planCnPersonal5t", "planDescCnPersonal5t"],
    CN_PERSONAL_10TB:["planCnPersonal10t", "planDescCnPersonal10t"],
    GLOBAL_PERSONAL_20GB:["planGlobalPersonal20", "planDescGlobalPersonal20"],
    GLOBAL_PERSONAL_300GB:["planGlobalPersonal300", "planDescGlobalPersonal300"],
    GLOBAL_PERSONAL_1TB:["planGlobalPersonal1t", "planDescGlobalPersonal1t"],
    GLOBAL_PERSONAL_5TB:["planGlobalPersonal5t", "planDescGlobalPersonal5t"],
    GLOBAL_PERSONAL_10TB:["planGlobalPersonal10t", "planDescGlobalPersonal10t"]
  };

  function t(key){ return window.I18n.t(key); }
  function planTitle(plan){
    const keys = planKeys[plan.plan_id];
    return keys ? t(keys[0]) : plan.plan_name;
  }
  function planDescription(plan){
    const keys = planKeys[plan.plan_id];
    return keys ? t(keys[1]) : plan.description;
  }

  function mount(host){
    const u = window.StorageApi.usage();
    const plans = window.PlansData.byType("personal_cloud");
    host.innerHTML = `
      <section class="ws-page">
        <div class="ws-card">
          <h2>${t("storage")}</h2>
          <p class="ws-muted">${t("storageDesc")}</p>
          <div class="usage-bar"><span style="width:${u.percent}%"></span></div>
          <p>${t("storageUsed")} ${u.used_gb}GB / ${u.quota_gb || t("storageLocal")}GB</p>
        </div>
        <div class="plan-grid">
          ${plans.map((p) => `
            <div class="ws-card">
              <h3>${planTitle(p)}</h3>
              <p>${planDescription(p)}</p>
              <b>${p.monthly_price} ${p.currency}/${t("month")}</b>
              <button class="ws-btn gray" data-plan="${p.plan_id}">${t("simulateOpen")}</button>
            </div>
          `).join("")}
        </div>
      </section>`;

    host.querySelectorAll("[data-plan]").forEach((btn) => btn.addEventListener("click", () => {
      window.SubscriptionApi.setPlan(btn.dataset.plan, "pro");
      window.WeishanRouter.refresh();
    }));
  }

  window.StoragePage = { mount };
})();
