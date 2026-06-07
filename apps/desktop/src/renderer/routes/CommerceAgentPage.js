(function(){
  let draftText = "";
  let selectedTaskId = "";
  let lastViewedTaskId = "";

  function esc(s){
    return String(s || "").replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; });
  }

  function agent(){
    return window.WeishanCommerceAgent || null;
  }

  function searchApi(){
    return window.WeishanCommerceSearch || null;
  }

  function ensureSearchLoaded(host){
    if (!window.WeishanCommerceProviderAdapter && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceProviderAdapter"]')) {
      const adapter = document.createElement("script");
      adapter.src = "./renderer/core/commerceProviderAdapter.js?v=2.0.32";
      adapter.dataset.weishanDynamic = "WeishanCommerceProviderAdapter";
      adapter.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(adapter);
      return;
    }
    if (!window.WeishanCommerceProviderConnector && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceProviderConnector"]')) {
      const connector = document.createElement("script");
      connector.src = "./renderer/core/commerceProviderConnector.js?v=2.0.32";
      connector.dataset.weishanDynamic = "WeishanCommerceProviderConnector";
      connector.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(connector);
      return;
    }
    if (!window.WeishanCommerceGlobalProviderPool && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceGlobalProviderPool"]')) {
      const pool = document.createElement("script");
      pool.src = "./renderer/core/commerceGlobalProviderPool.js?v=2.0.32";
      pool.dataset.weishanDynamic = "WeishanCommerceGlobalProviderPool";
      pool.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(pool);
      return;
    }
    if (!window.WeishanCommerceProviderOnboardingChecklist && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceProviderOnboardingChecklist"]')) {
      const onboarding = document.createElement("script");
      onboarding.src = "./renderer/core/commerceProviderOnboardingChecklist.js?v=2.0.40";
      onboarding.dataset.weishanDynamic = "WeishanCommerceProviderOnboardingChecklist";
      onboarding.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(onboarding);
      return;
    }
    if (!window.WeishanCommerceProviderApprovalWorkflow && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceProviderApprovalWorkflow"]')) {
      const approval = document.createElement("script");
      approval.src = "./renderer/core/commerceProviderApprovalWorkflow.js?v=2.0.40";
      approval.dataset.weishanDynamic = "WeishanCommerceProviderApprovalWorkflow";
      approval.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(approval);
      return;
    }
    if (!window.WeishanCommerceProductProviderCandidate && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceProductProviderCandidate"]')) {
      const candidate = document.createElement("script");
      candidate.src = "./renderer/core/commerceProductProviderCandidate.js?v=2.0.32";
      candidate.dataset.weishanDynamic = "WeishanCommerceProductProviderCandidate";
      candidate.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(candidate);
      return;
    }
    if (!window.WeishanCommerceProductProviderSelection && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceProductProviderSelection"]')) {
      const selection = document.createElement("script");
      selection.src = "./renderer/core/commerceProductProviderSelection.js?v=2.0.32";
      selection.dataset.weishanDynamic = "WeishanCommerceProductProviderSelection";
      selection.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(selection);
      return;
    }
    if (!window.WeishanCommerceLocationPolicy && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceLocationPolicy"]')) {
      const location = document.createElement("script");
      location.src = "./renderer/core/commerceLocationPolicy.js?v=2.0.32";
      location.dataset.weishanDynamic = "WeishanCommerceLocationPolicy";
      location.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(location);
      return;
    }
    if (!window.WeishanCommerceLocalLawCompliance && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceLocalLawCompliance"]')) {
      const localLaw = document.createElement("script");
      localLaw.src = "./renderer/core/commerceLocalLawCompliance.js?v=2.0.40";
      localLaw.dataset.weishanDynamic = "WeishanCommerceLocalLawCompliance";
      localLaw.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(localLaw);
      return;
    }
    if (!window.WeishanCommerceProviderConfig && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceProviderConfig"]')) {
      const config = document.createElement("script");
      config.src = "./renderer/core/commerceProviderConfig.js?v=2.0.40";
      config.dataset.weishanDynamic = "WeishanCommerceProviderConfig";
      config.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(config);
      return;
    }
    if (!window.WeishanCommerceProviderSandbox && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceProviderSandbox"]')) {
      const sandbox = document.createElement("script");
      sandbox.src = "./renderer/core/commerceProviderSandbox.js?v=2.0.32";
      sandbox.dataset.weishanDynamic = "WeishanCommerceProviderSandbox";
      sandbox.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(sandbox);
      return;
    }
    if (!window.WeishanCommerceProviders && !document.querySelector('script[data-weishan-dynamic="WeishanCommerceProviders"]')) {
      const providers = document.createElement("script");
      providers.src = "./renderer/core/commerceProviders.js?v=2.0.40";
      providers.dataset.weishanDynamic = "WeishanCommerceProviders";
      providers.onload = () => ensureSearchLoaded(host);
      document.head.appendChild(providers);
      return;
    }
    if (window.WeishanCommerceSearch || document.querySelector('script[data-weishan-dynamic="WeishanCommerceSearch"]')) return;
    const script = document.createElement("script");
    script.src = "./renderer/core/commerceSearch.js?v=2.0.40";
    script.dataset.weishanDynamic = "WeishanCommerceSearch";
    script.onload = () => render(host);
    document.head.appendChild(script);
  }

  function record(action, task, outputSummary){
    const api = agent();
    if (!api || !window.HistoryApi || typeof window.HistoryApi.record !== "function") return;
    const creator = api.createCommerceTaskHistoryPayload || api.createCommerceHistoryPayload;
    if (!creator) return;
    window.HistoryApi.record(action, creator(action, Object.assign({}, task || {}, {
      outputSummary:outputSummary || ""
    })));
  }

  function recordSearch(action, payload){
    const api = searchApi();
    if (!api || !api.createCommerceSearchHistoryPayload || !window.HistoryApi || typeof window.HistoryApi.record !== "function") return;
    window.HistoryApi.record(action, api.createCommerceSearchHistoryPayload(action, payload || {}));
  }

  function timeLabel(value){
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function list(items, className){
    return `<ul class="${esc(className || "commerce-list")}">${(items || []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
  }

  function chips(items){
    return `<div class="commerce-chip-list">${(items || []).map((item) => `<span class="commerce-chip">${esc(item)}</span>`).join("")}</div>`;
  }

  function section(title, body, className){
    return `<section class="commerce-section ${esc(className || "")}">
      <h3>${esc(title)}</h3>
      ${body}
    </section>`;
  }

  function taskStatusLabel(status){
    const map = {
      planned:"计划中",
      comparing:"比较中",
      recommended:"已生成推荐框架",
      waitingConfirmation:"待确认",
      blocked:"已阻断",
      cleared:"已清理"
    };
    return map[status] || status || "计划中";
  }

  function searchStatusLabel(task){
    const status = String(task && task.searchStatus || "");
    if (status === "completed") return "已返回真实候选方案";
    if (status === "noResults" || status === "no_results") return "暂无可展示结果";
    if (status === "ready") return "搜索源已配置";
    if (status === "missingFields") return "搜索条件缺失";
    if (status === "local_law_compliance_required") return "当地法律合规未确认";
    if (status === "shipping_destination_required" || status === "location_required") return "需要设置收货目的地以计算精确最低到手价";
    if (status === "failed") return "搜索失败";
    if (status === "blocked") return "已阻断";
    if (status === "no_provider") return "暂未配置真实搜索适配器，无法返回实时价格";
    return "搜索适配器未配置，无法返回真实价格";
  }

  function commercePoolCategory(task){
    const category = String(task && task.category || "");
    if (category === "ecommerce" || category === "product") return "product";
    if (category === "flight") return "flight";
    if (category === "hotel") return "hotel";
    if (category === "ticketing" || category === "ticket") return "ticket";
    if (category === "serviceBooking" || category === "service") return "service";
    return "";
  }

  function providerPoolCopy(task, configInfo){
    const key = commercePoolCategory(task);
    const productCandidateName = configInfo && configInfo.productProviderProfile && (configInfo.productProviderProfile.selectedCandidateName || configInfo.productProviderProfile.candidateName) || "eBay Browse API";
    const map = {
      product:{
        scope:"商品电商平台、品牌官网、商品官网、区域电商平台",
        examples:"商品搜索试点候选：" + productCandidateName + " 等",
        noAccess:"当前不会访问任何真实平台。",
        noPrice:"当前不会返回价格。",
        noRedirect:"当前不会跳转购买页面。"
      },
      hotel:{
        scope:"酒店官网、酒店 OTA、区域住宿平台",
        examples:"示例候选类型：Booking / Agoda / Expedia / 携程 / 酒店官网 等",
        noAccess:"当前不会访问任何真实酒店平台。",
        noPrice:"当前不会返回房价。",
        noRedirect:"当前不会跳转预订页面。"
      },
      flight:{
        scope:"机票 OTA、航司官网、区域旅行平台",
        examples:"示例候选类型：Trip.com / Expedia / 航司官网 等",
        noAccess:"当前不会访问任何真实机票平台。",
        noPrice:"当前不会返回票价。",
        noRedirect:"当前不会跳转预订页面。"
      },
      ticket:{
        scope:"票务平台、活动官网、区域票务平台",
        examples:"示例候选类型：Ticketmaster / 大麦 / Eventbrite / 活动官网 等",
        noAccess:"当前不会访问任何真实票务平台。",
        noPrice:"当前不会返回票价。",
        noRedirect:"当前不会跳转购票页面。"
      },
      service:{
        scope:"本地服务预约平台、服务商官网、区域服务平台",
        examples:"示例候选类型：本地服务平台 / 服务商官网 / 区域预约平台 等",
        noAccess:"当前不会访问任何真实服务平台。",
        noPrice:"当前不会返回预约价格。",
        noRedirect:"当前不会跳转预约页面。"
      }
    };
    return map[key] || null;
  }

  function toOnboardingDisplayStatus(value){
    if (value === true) return "已完成";
    if (value === false) return "未完成";
    const raw = String(value || "");
    const map = {
      not_reviewed:"未审查",
      not_connected:"尚未接入",
      disabled:"未启用",
      unavailable:"不可用",
      blocked:"已阻断",
      ready:"可进入下一步",
      completed:"已完成",
      connected:"已接入",
      enabled:"已启用"
    };
    return map[raw] || "未完成";
  }

  function providerOnboardingReviewPanelHtml(onboardingInfo){
    const status = onboardingInfo || {};
    const checklist = status.checklist || {};
    const item = (label, value) => `<li><span>${esc(label)}</span><b>${esc(toOnboardingDisplayStatus(value))}</b></li>`;
    const group = (title, items) => `<section class="commerce-onboarding-group"><h4>${esc(title)}</h4><ul>${items.join("")}</ul></section>`;
    return `<section class="commerce-onboarding-review-panel" aria-label="Provider 接入审查面板">
        <div class="commerce-onboarding-panel-head">
          <div>
            <h3>Provider 接入审查面板</h3>
            <p>真实 provider 接入前必须完成以下审查。当前尚未接入任何真实 provider。</p>
          </div>
          <strong>总体状态：${status.canStartConnectorDevelopment === true ? "已完成，可进入下一步" : "未完成，暂不可接入真实 provider"}</strong>
        </div>
        <div class="commerce-onboarding-grid">
          ${group("合规与条款", [
            item("法律条款审查", checklist.legalTermsReviewed),
            item("隐私政策审查", checklist.privacyPolicyReviewed),
            item("合规风险审查", checklist.complianceRiskReviewed)
          ])}
          ${group("API 与接口", [
            item("API 文档审查", checklist.apiDocsReviewed),
            item("调用额度 / 频率限制审查", checklist.rateLimitReviewed),
            item("接口接入审查", checklist.endpointConnectionReviewed),
            item("API key 存储方案", checklist.apiKeyStoragePlanReviewed ? true : "not_reviewed")
          ])}
          ${group("价格与费用字段", [
            item("数据字段审查", checklist.dataFieldsReviewed),
            item("价格字段审查", checklist.priceFieldsReviewed),
            item("税费 / 关税 / 运费 / 预订费字段审查", checklist.taxAndFeeFieldsReviewed && checklist.shippingOrBookingFeeFieldsReviewed),
            item("no_provider fallback 审查", checklist.fallbackNoProviderStateReviewed)
          ])}
          ${group("安全边界", [
            item("不代付款确认", checklist.noPaymentConfirmed),
            item("不自动下单确认", checklist.noAutoOrderConfirmed),
            item("不保存证件/银行卡确认", checklist.noIdentityStorageConfirmed),
            item("外部跳转 URL 策略审查", checklist.redirectUrlPolicyReviewed)
          ])}
          <section class="commerce-onboarding-group commerce-onboarding-blocked-state">
            <h4>当前阻断状态</h4>
            <ul>
              <li><span>网络搜索</span><b>未启用</b></li>
              <li><span>实时价格</span><b>不可用</b></li>
              <li><span>精确跳转</span><b>待真实 provider 接入后启用</b></li>
              <li><span>支付/下单</span><b>不支持，由外部平台完成</b></li>
              <li><span>证件/银行卡</span><b>不保存</b></li>
              <li><span>连接方式</span><b>只读搜索准备中，暂未连接真实平台</b></li>
            </ul>
          </section>
        </div>
        <div class="commerce-onboarding-final-note">
          <p>只有以上审查全部完成，并通过 config / adapter / sandbox / connector gate 后，weishan 才允许进入真实 provider 连接。接通前不会访问真实平台、不会返回价格、不会跳转购买或预订页面。</p>
          <p>真实接通后的状态应为：Provider 接入审查已完成、接口已接入、网络搜索已启用、实时价格可用、精确跳转已启用。该状态只能在真实 provider 审查和接入完成后显示，不能提前模拟。</p>
        </div>
      </section>`;
  }

  function providerApprovalWorkflowPanelHtml(approvalInfo){
    const status = approvalInfo || {};
    const row = (label, value) => `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>`;
    const group = (title, items) => `<section class="commerce-approval-group"><h4>${esc(title)}</h4><ul>${items.map((item) => row(item[0], item[1])).join("")}</ul></section>`;
    return `<section class="commerce-provider-approval-panel" aria-label="Provider 审批流程">
      <div class="commerce-provider-approval-head">
        <div>
          <h3>Provider 审批流程</h3>
          <p>真实 provider 接入前必须完成分级审批。当前不会连接任何真实 provider。</p>
        </div>
        <strong>审批状态：${status.canConnectEndpoint === true ? "已批准进入下一步" : "未审查"}</strong>
      </div>
      <div class="commerce-provider-approval-grid">
        ${group("当前状态", [["当前阶段", "尚未进入审查流程"], ["Connector stub", "暂不可开发"], ["API key", "不可配置"], ["Endpoint", "不可连接"]])}
        ${group("连接与展示", [["网络搜索", "未启用"], ["实时价格", "不可用"], ["精确跳转", "未启用"]])}
        ${group("审批阶段清单", [["法律条款审查", "未开始"], ["API 文档审查", "未开始"], ["隐私政策审查", "未开始"], ["价格 / 税费 / 运费字段审查", "未开始"]])}
        ${group("安全审批", [["安全审查", "未开始"], ["当地法律合规审查", "未开始"], ["人工批准", "未完成"], ["只读 connector stub 开发许可", "未授予"]])}
      </div>
      <div class="commerce-provider-approval-note">
        <p>只有 provider 完成分级审批，并且本地法律合规、onboarding checklist、config / adapter / sandbox / connector gate 均通过后，weishan 才允许进入真实 provider 连接。当前不会连接真实平台，不会返回价格，不会跳转购买或预订页面。</p>
        <p>只读 connector stub 只允许开发准备，不连接真实平台。即使批准开发 stub，仍不会显示价格或跳转购买页面。</p>
      </div>
    </section>`;
  }

  function readOnlyConnectorStubPanelHtml(stubInfo){
    const row = (label, value) => `<li><span>${esc(label)}：</span><b>${esc(value)}</b></li>`;
    const group = (title, items) => `<section class="commerce-stub-group"><h4>${esc(title)}</h4><ul>${items.map((item) => row(item[0], item[1])).join("")}</ul></section>`;
    return `<section class="commerce-readonly-stub-panel" aria-label="只读 Connector Stub">
      <div class="commerce-readonly-stub-head">
        <div>
          <h3>只读 Connector Stub</h3>
          <p>真实 provider 接入前，weishan 只能准备只读 connector stub。当前不会连接任何真实平台。</p>
        </div>
        <strong>Stub 状态：未准备</strong>
      </div>
      <div class="commerce-readonly-stub-grid">
        ${group("Stub 准备状态", [["Connector 模式", "只读"], ["Stub 开发许可", "未授予"], ["Stub 执行", "未启用"]])}
        ${group("连接限制", [["API key", "不可配置"], ["Endpoint", "不可连接"], ["网络搜索", "未启用"]])}
        ${group("结果展示", [["真实价格", "不可用"], ["测试价格", "不可用"], ["精确跳转", "未启用"]])}
        ${group("交易与隐私", [["支付 / 下单", "不支持"], ["证件 / 银行卡", "不保存"]])}
      </div>
      <div class="commerce-readonly-stub-note">
        <p>只有 provider 审批状态达到 approved_for_stub 后，才允许开发只读 connector stub。</p>
        <p>即使允许开发 stub，也不会连接真实平台、不会配置真实 API key、不会启用网络搜索、不会显示价格、不会跳转购买或预订页面。</p>
      </div>
    </section>`;
  }

  function localLawCompliancePanelHtml(task){
    const health = task && task.complianceHealth || {};
    const regulated = health.complianceStatus === "compliance_review_required";
    const row = (label, value) => `<li><span>${esc(label)}</span><b>${esc(value)}</b></li>`;
    return `<section class="commerce-local-law-panel commerce-local-law-review-panel" aria-label="当地法律合规审查">
      <div class="commerce-local-law-head">
        <div>
          <h3>当地法律合规审查</h3>
          <p>购物和预订必须遵守当地法律。合法性未确认前，weishan 不显示价格、不跳转购买或预订页面。</p>
        </div>
        <strong>合规状态：未确认</strong>
      </div>
      <div class="commerce-local-law-grid">
        <section class="commerce-local-law-group">
          <h4>当前合规状态</h4>
          <ul>
            ${row("合规状态", "未确认")}
            ${row("合规处理", "未确认前不显示价格、不跳转购买或预订页面")}
            ${row("地区依据", "优先使用定位服务；无法精准定位时使用收货地址 / 目的地 / 服务发生地")}
            ${row("规则冲突处理", "当前位置与收货地 / 目的地冲突时，按更严格的一方处理")}
          </ul>
        </section>
        <section class="commerce-local-law-group commerce-local-law-privacy">
          <h4>隐私与法律说明</h4>
          <ul>
            ${row("隐私保护", "不保存原始 GPS 坐标，不上传定位到第三方，不用于广告、追踪或画像")}
            ${row("法律说明", "weishan 不提供法律意见，不帮助规避当地法律")}
          </ul>
        </section>
      </div>
      ${regulated ? `<div class="commerce-local-law-regulated">
        <b>该需求可能涉及当地法律限制</b>
        <span>需要先确认当前位置和收货地 / 目的地。</span>
        <span>合法性未确认前，weishan 不显示价格、不跳转购买或预订页面。</span>
        <span>当前仅做风险分类和阻断，不做真实法律结论。</span>
      </div>` : `<div class="commerce-local-law-regulated is-neutral">
        <b>合规依据：定位服务或收货 / 目的地信息未完成</b>
        <span>未确认前不显示价格、不跳转购买或预订页面。</span>
      </div>`}
    </section>`;
  }

  function providerPoolNoticeHtml(task, configInfo, onboardingInfo, approvalInfo){
    const copy = providerPoolCopy(task, configInfo || {});
    if (!copy) return "";
    const isProduct = commercePoolCategory(task) === "product";
    return `<div class="commerce-warning commerce-provider-pool-missing">
        <b>全球多源 provider 候选池：准备中，尚未接入。</b>
        <span>当前比较范围：${esc(copy.scope)}。</span>
        <span>${esc(copy.examples)}。</span>
        ${isProduct ? `<span>eBay Browse API 是商品搜索试点候选之一，尚未接入。</span>` : ""}
        <span>接口状态：尚未接入。</span>
        <span>Provider 接入审查：未完成，完成前不会连接真实平台。</span>
        <span>接口文档审查：未完成。</span>
        <span>API key 存储方案：未审查。</span>
        <span>价格/税费/运费字段审查：未完成。</span>
        <span>隐私与合规审查：未完成。</span>
        <span>搜索模式：只读搜索准备中。</span>
        <span>网络搜索：未启用。</span>
        <span>实时价格：不可用。</span>
        <span>精确跳转：待真实 provider 接入后启用。</span>
        <span>${esc(copy.noAccess)}</span>
        <span>${esc(copy.noPrice)}</span>
        <span>${esc(copy.noRedirect)}</span>
        <span>当前不会连接真实 provider。</span>
        <span>支付/下单：不支持，由外部平台完成。</span>
        <span>证件/银行卡：不保存。</span>
        <span>当前不会下单、付款或保存证件/银行卡。</span>
        ${providerOnboardingReviewPanelHtml(onboardingInfo || {})}
        ${providerApprovalWorkflowPanelHtml(approvalInfo || {})}
        ${readOnlyConnectorStubPanelHtml(configInfo && configInfo.connectorStubHealth || {})}
      </div>`;
  }

  function commerceDisplayTitle(task){
    const api = agent();
    if (api && api.createCommerceDisplayTitle) return api.createCommerceDisplayTitle(task, !!(task && Array.isArray(task.candidates) && task.candidates.length));
    if (!task) return "计划详情";
    if (task.status === "blocked") return "全球采购计划已阻断";
    if (task.category === "flight") return task.searchStatus === "completed" ? "机票搜索已完成" : "机票搜索已生成";
    return task.searchStatus === "completed" ? "搜索已完成" : "搜索已生成";
  }

  function taskCards(tasks){
    if (!tasks.length) {
      return `<div class="commerce-empty">
        <b>暂无采购计划。</b>
        <span>可在首页输入：</span>
        <span>帮我找成都到上海最便宜机票</span>
        <span>帮我比较 OpenRouter 和其他 AI 模型平台价格</span>
        <button class="cmd-btn gray" id="commerceEmptyBackHome" type="button">返回首页总调度</button>
      </div>`;
    }
    return tasks.map((task) => {
      const active = task.taskId === selectedTaskId ? " active" : "";
      const category = task.categoryLabel || task.category || "全球采购";
      return `<article class="commerce-task-card${active}" data-commerce-task-id="${esc(task.taskId)}">
        <div class="commerce-task-main">
          <strong>${esc(task.inputSummary || "全球采购任务")}</strong>
          <span>${esc(category)} · ${esc(timeLabel(task.createdAt))}</span>
        </div>
        <div class="commerce-task-meta">
          <span class="commerce-status ${esc(task.status)}">${esc(taskStatusLabel(task.status))}</span>
        </div>
        <div class="commerce-task-actions">
          <button class="cmd-btn gray commerce-view-task" type="button" data-task-id="${esc(task.taskId)}">查看计划</button>
          <button class="cmd-btn gray commerce-clear-task" type="button" data-task-id="${esc(task.taskId)}">清理计划</button>
        </div>
      </article>`;
    }).join("");
  }

  function detailHtml(task){
    const api = agent();
    const search = searchApi();
    if (!task) {
      return `<div class="commerce-detail commerce-detail-empty">
        <h2>计划详情</h2>
        <p>选择左侧采购计划后，这里会显示需求理解、搜索范围、比较维度、推荐规则和执行边界。</p>
      </div>`;
    }
    const detail = api && api.createCommercePlanDetail ? api.createCommercePlanDetail(task) : {};
    const request = search && search.createCommerceSearchRequest ? search.createCommerceSearchRequest(task) : { missingFields:task.missingFields || [] };
    const settings = search && search.getCommerceSearchSettings ? search.getCommerceSearchSettings() : {};
    const isModelPricing = task.category === "aiModelPricing";
    const health = search && search.getCommerceProviderHealth ? search.getCommerceProviderHealth(task.category, settings) : null;
    const hasProvider = isModelPricing || !!(health && health.hasProvider || search && search.hasCommerceSearchProvider && search.hasCommerceSearchProvider(settings));
    const category = detail.categoryLabel || task.categoryLabel || task.category || "全球采购";
    if (task.status === "blocked") {
      return `<div class="commerce-detail commerce-detail-compact" data-commerce-detail="${esc(task.taskId)}">
        <div class="commerce-detail-head">
          <div>
            <h2>${esc(commerceDisplayTitle(task))}</h2>
            <p>${esc(task.inputSummary)}</p>
          </div>
          <span class="commerce-status blocked">已阻断</span>
        </div>
        <div class="commerce-risk commerce-risk-strong">
          <b>该请求涉及下单 / 付款，已阻断。</b>
          <span>不会下单、付款或提交订单，也不会上传身份证/护照或提交询价表。</span>
        </div>
        ${section("需求理解", `<dl class="commerce-facts">
          <div><dt>用户需求</dt><dd>${esc(detail.demandUnderstanding || task.inputSummary)}</dd></div>
          <div><dt>类目</dt><dd>${esc(category)}</dd></div>
          <div><dt>当前状态</dt><dd>已阻断</dd></div>
        </dl>`)}
        ${section("执行边界", `<div class="commerce-risk">当前为计划阶段：不真实搜索、不下单、不付款、不提交订单。</div>${chips(["不访问外部网站", "不填写订单", "不保存支付或身份信息", "最终执行必须用户确认"])}`)}
        ${section("下一步建议", list(["移除直接下单、付款或提交订单要求。", "补充预算、时间、地区限制后重新生成计划。"]))}
      </div>`;
    }
    return `<div class="commerce-detail" data-commerce-detail="${esc(task.taskId)}">
      <div class="commerce-detail-head">
        <div>
          <h2>${esc(commerceDisplayTitle(task))}</h2>
          <p>${esc(task.inputSummary)}</p>
        </div>
        <span class="commerce-status ${esc(task.status)}">${esc(taskStatusLabel(task.status))}</span>
      </div>
      <div class="commerce-detail-grid">
        ${section("需求理解", `<dl class="commerce-facts">
          <div><dt>用户需求</dt><dd>${esc(detail.demandUnderstanding || task.inputSummary)}</dd></div>
          <div><dt>类目</dt><dd>${esc(category)}</dd></div>
          <div><dt>当前状态</dt><dd>${esc(taskStatusLabel(task.status))} · ${esc(searchStatusLabel(task))}</dd></div>
        </dl>`)}
        ${section("搜索源状态", searchStatusHtml(task, settings, hasProvider), "commerce-section-tight")}
        ${section("搜索条件确认", searchRequestHtml(request), "commerce-section-tight")}
        ${section("搜索范围", chips(detail.searchScope), "commerce-section-tight")}
        ${section("比较维度", chips(detail.comparisonDimensions), "commerce-section-tight")}
        ${section("决策规则", `<p>${esc(detail.decisionRule)}</p>`)}
        ${section("候选方案", candidatesHtml(task), "commerce-section-wide")}
        ${section("推荐结果", recommendationHtml(task), "commerce-section-wide")}
        ${section("推荐输出格式", `<p class="commerce-muted">后续真实搜索后会生成：</p>${chips(detail.recommendationTemplate && detail.recommendationTemplate.fields)}`)}
        ${section("候选方案字段模板", `<p class="commerce-muted">仅展示字段结构，不填真实价格，不伪造实时库存或可用性。</p>${chips(detail.candidateSchema)}`)}
        ${section("执行边界", `<div class="commerce-risk">当前只搜索和展示候选方案，不下单、不付款、不提交订单。</div>${chips(["不自动填写订单", "不保存支付或身份信息", "最终执行必须用户确认", "价格可能变化"])}`)}
        ${section("下一步建议", list(["补充预算、时间、地区限制。", "后续接入真实搜索插件后填入候选方案。", "下单或付款前必须再次确认。"]))}
      </div>
    </div>`;
  }

  function searchStatusHtml(task, settings, hasProvider){
    const missingFields = Array.isArray(task && task.missingFields) && task.missingFields.length ? task.missingFields : [];
    const isModelPricing = task && task.category === "aiModelPricing";
    const isFlight = task && task.category === "flight";
    const isProduct = task && task.category === "ecommerce";
    const locationInfo = searchApi() && searchApi().locationHealthForCommerce ? searchApi().locationHealthForCommerce() : {};
    const complianceRequired = task && task.searchStatus === "local_law_compliance_required";
    const localLawPanelRequired = !isModelPricing && task && task.complianceHealth && task.complianceHealth.canSearchProvider === false;
    const destinationRequired = !complianceRequired && isProduct && (task && (task.searchStatus === "shipping_destination_required" || task.searchStatus === "location_required") || locationInfo.hasShippingDestination !== true);
    const disabled = !hasProvider || missingFields.length > 0 || destinationRequired || complianceRequired;
    const isCruise = task && task.category === "cruise";
    const isPrivateJet = task && task.category === "privateJet";
    const normalized = task && task.normalizedFields || {};
    const flightOrigin = normalized.originText || "待补充";
    const flightDestination = normalized.destinationText || "待补充";
    const flightDate = normalized.dateText || normalized.timing || "待补充";
    const health = searchApi() && searchApi().getCommerceProviderHealth ? searchApi().getCommerceProviderHealth(task && task.category, settings) : {};
    const providerRow = Array.isArray(health.providerHealth) && health.providerHealth[0] || {};
    const adapterInfo = health.adapterHealth || {};
    const configInfo = health.configHealth || {};
    const connectorInfo = health.connectorHealth || task.connectorHealth || {};
    const onboardingInfo = health.onboardingHealth || task.onboardingHealth || {};
    const approvalInfo = health.approvalHealth || task.approvalHealth || {};
    const sandboxInfo = health.dryRunHealth || health.sandboxHealth || {};
    const globalReadiness = sandboxInfo.globalReadiness || {};
    const reasonWhenDisabled = providerRow.reasonWhenDisabled || "";
    const providerLabel = isModelPricing ? "OpenRouter" : hasProvider ? settings.providerName || "commerceProvider" : "未配置";
    const failedMessage = task && task.searchStatus === "failed" ? task.searchErrorMessage || (isModelPricing ? "OpenRouter 搜索源不可用，无法返回真实价格。" : "搜索失败，无法返回真实价格。") : "";
    const buttonLabel = isModelPricing ? "搜索 OpenRouter 模型价格" : missingFields.length ? "搜索真实价格" : hasProvider ? "搜索真实价格" : "搜索适配器未配置";
    return `<div class="commerce-search-panel">
      <p><b>${hasProvider ? "已配置：" : "未配置："}</b>${isModelPricing ? (hasProvider ? "OpenRouter provider 可用于模型价格搜索。" : "OpenRouter provider 不可用。") : hasProvider ? "可以搜索真实候选方案。" : isFlight ? "暂未配置真实机票搜索适配器，无法返回实时价格。" : isProduct ? "暂未配置真实商品搜索适配器，无法返回实时价格。" : "搜索适配器未配置，无法返回真实价格。"}</p>
      ${localLawPanelRequired ? localLawCompliancePanelHtml(task) : ""}
      ${destinationRequired ? `<div class="commerce-warning commerce-location-required">
        <b>需要设置收货目的地以计算精确最低到手价</b>
        <span>收货目的地：未设置。</span>
        <span>定位服务：关闭 / 未授权。</span>
        <span>价格状态：精确最低到手价不可用。</span>
        <span>原因：需要收货国家/地区/邮编用于运费、税费、关税和当地合规计算。</span>
        <span>当前不会搜索真实平台。</span>
        <span>当前不会显示价格。</span>
        <span>当前不会跳转购买/预订页面。</span>
        <span>当前不会下单、付款或保存证件/银行卡。</span>
        <span>为了精准计算最低到手价并遵守当地法律，请设置收货目的地，并可选择开启定位服务。实际价格、库存、税费和关税仍以外部平台和海关结算为准。</span>
        <button class="cmd-btn gray commerce-open-location-settings" type="button">去设置收货目的地</button>
      </div>` : ""}
      ${!isModelPricing && !hasProvider ? providerPoolNoticeHtml(task, configInfo, onboardingInfo, approvalInfo) : ""}
      ${isFlight && !hasProvider ? `<div class="commerce-warning commerce-flight-provider-missing">
        <b>已识别为机票搜索计划。</b>
        <span>出发地：${esc(flightOrigin)} · 目的地：${esc(flightDestination)} · 日期：${esc(flightDate)}</span>
        <span>暂未配置真实机票搜索适配器，当前无法返回实时价格。</span>
        <span>配置状态：未配置真实搜索源；网络请求未启用；实时价格不可用。</span>
        <span>weishan 面向全球采购场景设计，当前正在准备多国家、多平台、多币种的只读搜索能力；在真实 provider 启用前不会联网搜索、不会返回价格、不会下单或付款。</span>
        <span>未下单、未付款、未提交订单、未保存证件。</span>
      </div>` : ""}
      ${!isModelPricing && !hasProvider ? `<dl class="commerce-facts commerce-provider-health">
        <div><dt>搜索适配器</dt><dd>暂未配置</dd></div>
        <div><dt>接口状态</dt><dd>尚未接入</dd></div>
        <div><dt>Provider 接入审查</dt><dd>${onboardingInfo.canConnectEndpoint === true ? "已完成" : "未完成，完成前不会连接真实平台"}</dd></div>
        <div><dt>接口文档审查</dt><dd>未完成</dd></div>
        <div><dt>API key 存储方案</dt><dd>未审查</dd></div>
        <div><dt>价格/税费/运费字段审查</dt><dd>未完成</dd></div>
        <div><dt>隐私与合规审查</dt><dd>未完成</dd></div>
        <div><dt>连接方式</dt><dd>只读搜索准备中，暂未连接真实平台</dd></div>
        <div><dt>当前模式</dt><dd>只读搜索准备中</dd></div>
        <div><dt>配置状态</dt><dd>未配置真实搜索源</dd></div>
        <div><dt>网络搜索</dt><dd>未启用</dd></div>
        <div><dt>实时价格</dt><dd>不可用</dd></div>
        <div><dt>精确跳转</dt><dd>待真实 provider 接入后启用</dd></div>
        <div><dt>支付/下单</dt><dd>不支持，由外部平台完成</dd></div>
        <div><dt>证件/银行卡</dt><dd>不保存</dd></div>
        <div><dt>全球搜索准备</dt><dd>未启用</dd></div>
        <div><dt>Provider Dry Run</dt><dd>${sandboxInfo.canProceedToRealSearch === true ? "已通过" : "未通过"}</dd></div>
        <div><dt>跨境搜索</dt><dd>${globalReadiness.supportsCrossBorderSearch === true ? "已启用" : "未启用"}</dd></div>
      </dl>` : ""}
      <p class="commerce-muted">Provider：${esc(providerLabel)}</p>
      ${isCruise ? `<p class="commerce-warning">邮轮价格受航线、舱型、日期和人数影响较大。当前未接入真实搜索源时不显示价格。</p>` : ""}
      ${isPrivateJet ? `<p class="commerce-warning">公务机属于高价值定制服务，价格通常需要询价确认。当前仅生成搜索和询价计划，不自动提交询价、不付款、不签约。</p>` : ""}
      ${failedMessage ? `<p class="commerce-warning">${esc(failedMessage)}</p>` : ""}
      ${missingFields.length ? `<p class="commerce-warning">请补充${esc(missingFields.join("、"))}，否则不搜索价格。</p>` : ""}
      <button class="cmd-btn primary commerce-search-real" type="button" data-task-id="${esc(task.taskId)}" ${disabled ? "disabled" : ""}>${esc(destinationRequired ? "需要设置收货目的地" : disabled && !missingFields.length && !isModelPricing ? "搜索适配器未配置" : buttonLabel)}</button>
      <p class="commerce-muted">价格只来自已配置 provider 返回数据；未配置时不会显示假价格。</p>
    </div>`;
  }

  function searchRequestHtml(request){
    const fields = [
      ["需求", request.query],
      ["出发地", request.origin || "待补充"],
      ["目的地", request.destination || "待补充"],
      ["日期", request.date || "待补充"],
      ["币种", request.currency || "CNY"],
      ["人数 / 数量", String(request.passengers || 1)]
    ];
    return `<dl class="commerce-facts">${fields.map((item) => `<div><dt>${esc(item[0])}</dt><dd>${esc(item[1])}</dd></div>`).join("")}</dl>`;
  }

  function moneyText(amount, currency, fallback){
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0) return fallback || "待确认";
    const rounded = Math.round(value * 100) / 100;
    return `${esc(currency || "")} ${esc(String(rounded))}`.trim();
  }

  function feePartText(part, currency){
    const item = part || {};
    const certainty = String(item.certainty || "unknown");
    if (certainty === "unknown" || item.amount === null || item.amount === undefined || item.amount === "") return "待确认";
    const suffix = certainty === "estimated" ? "（预估）" : "";
    return moneyText(item.amount, item.currency || currency, "待确认") + suffix;
  }

  function landedCompletenessText(item){
    const completeness = String(item && item.landedCostCompleteness || "");
    if (completeness === "complete") return "完整";
    if (completeness === "estimated") return "部分预估";
    if (completeness === "partial") return "费用缺失";
    return "待确认";
  }

  function landedTotalLabel(item){
    const completeness = String(item && item.landedCostCompleteness || "");
    if (completeness === "complete" && !(item && item.hasEstimatedFees) && !(item && item.hasUnknownFees)) return "到手总价";
    if (completeness === "estimated" || item && item.hasEstimatedFees) return "预估到手总价";
    return "参考到手价";
  }

  function landedCostFields(item){
    const breakdown = item && item.landedCostBreakdown || {};
    return [
      ["商品价", breakdown.itemPrice],
      ["运费", breakdown.shippingFee],
      ["关税/进口税", breakdown.dutyFee],
      ["税费/VAT/GST/销售税", breakdown.taxFee],
      ["平台服务费", breakdown.platformFee],
      ["支付手续费", breakdown.paymentFee],
      ["清关/报关费", breakdown.brokerageFee],
      ["保险/必选服务费", breakdown.insuranceFee],
      ["其他必选费用", breakdown.requiredExtraFee]
    ];
  }

  function landedCostHtml(item){
    const total = item && item.totalLandedCost !== undefined && item.totalLandedCost !== null ? item.totalLandedCost : item && item.totalPrice;
    const route = [item && item.sourceCountry, item && item.destinationCountry].filter(Boolean).join(" → ");
    const hasRoute = route.trim();
    const feeNotice = item && item.feeNotice || "费用条件不完整，实际总价以外部商家页面/海关结算为准。";
    return `<div class="commerce-landed-cost">
      ${hasRoute ? `<p class="commerce-route">发货 / 收货：${esc(route)}${item.crossBorder ? " · 跨境" : ""}</p>` : ""}
      <dl class="commerce-fee-grid">
        ${landedCostFields(item).map(([label, part]) => `<div><dt>${esc(label)}</dt><dd>${esc(feePartText(part, item && item.currency))}</dd></div>`).join("")}
        <div class="is-total"><dt>${esc(landedTotalLabel(item))}</dt><dd>${esc(moneyText(total, item && item.currency, "待确认"))}</dd></div>
        <div><dt>费用完整性</dt><dd>${esc(landedCompletenessText(item))}</dd></div>
      </dl>
      <p class="commerce-warning">${esc(feeNotice)}</p>
      ${(item && item.hasEstimatedFees) ? `<p class="commerce-muted">含预估费用；实际以外部平台和海关结算为准。</p>` : ""}
      ${(item && item.hasUnknownFees) ? `<p class="commerce-muted">存在待确认费用；不可把商品裸价视为完整到手价。</p>` : ""}
    </div>`;
  }

  function candidatesHtml(task){
    const candidates = (Array.isArray(task && task.candidates) ? task.candidates : []).slice(0, 3);
    if (!candidates.length) {
      const status = String(task && task.searchStatus || "");
      const noResultText = status === "noResults" || status === "no_results" ? "provider 未返回可展示结果。" : "搜索适配器未配置或尚未执行真实搜索。";
      return `<p class="commerce-muted">${esc(noResultText)}不显示任何价格，不显示购买、预订或付款按钮。</p>`;
    }
    const isModelPricing = task && task.category === "aiModelPricing";
    const actionLabel = (item) => {
      if (isModelPricing) return "打开模型页";
      if (item.urlType === "checkout") return "去购买";
      if (item.urlType === "booking") return "去预订";
      return "查看详情";
    };
    const priceText = (item) => {
      if (isModelPricing) return item.priceLabel || "";
      const total = item.totalLandedCost !== undefined && item.totalLandedCost !== null ? item.totalLandedCost : item.totalPrice !== undefined && item.totalPrice !== null ? item.totalPrice : item.price;
      return item.currency && total !== "" && total !== undefined && total !== null ? item.currency + " " + total : item.priceLabel || "";
    };
    return `<div class="commerce-candidates">
      <p class="commerce-muted">weishan 当前提供免费的全球比价与跳转服务；同等条件下优先展示当前可比结果中的最低到手总价，实际价格、库存、关税和税费以外部平台/海关结算为准。</p>
      ${candidates.map((item, index) => `<article class="commerce-candidate-card">
        <div class="commerce-candidate-head">
          <div>
            <b>${index === 0 && !isModelPricing ? '<span class="commerce-lowest-badge">最低到手价推荐</span> ' : ""}${esc(item.title)}</b>
            <span>${esc(item.provider || item.sourceName)}${item.modelId ? " · " + esc(item.modelId) : ""} · ${esc(item.fetchedAt || item.collectedAt)}</span>
          </div>
          <strong>${isModelPricing ? esc(priceText(item)) : `${esc(landedTotalLabel(item))} ${esc(priceText(item))}`}</strong>
        </div>
        ${isModelPricing ? `<dl class="commerce-model-pricing">
          <div><dt>模型 ID</dt><dd>${esc(item.modelId || item.candidateId)}</dd></div>
          <div><dt>输入价格</dt><dd>${esc(item.inputPriceLabel || "价格字段不可解析")}</dd></div>
          <div><dt>输出价格</dt><dd>${esc(item.outputPriceLabel || "价格字段不可解析")}</dd></div>
          <div><dt>上下文长度</dt><dd>${esc(item.contextLength || "未提供")}</dd></div>
          <div><dt>币种</dt><dd>USD</dd></div>
        </dl>` : landedCostHtml(item)}
        <div class="commerce-candidate-meta">
          ${chips([item.departTime && item.arriveTime ? item.departTime + " → " + item.arriveTime : "", item.duration, item.conditions, item.refundPolicySummary, item.riskSummary, item.hiddenFeeNote].concat(item.extras || []).filter(Boolean))}
        </div>
        ${item.priceCompleteness === "provider_conditions_incomplete" ? `<p class="commerce-warning">费用条件不完整，请以跳转后 provider 页面为准。</p>` : ""}
        <p class="commerce-muted">推荐理由：${esc(item.recommendationReason || "按价格、条件和风险排序后进入候选。")}</p>
        ${item.bookingUrl || item.url ? `<p class="commerce-booking-note">点击后将在外部商家平台完成购买或预订。weishan 只提供比价与跳转，不代付款、不自动下单、不保存支付或证件信息。</p><button class="cmd-btn gray commerce-booking-link" type="button" data-url="${esc(item.bookingUrl || item.url)}">${esc(actionLabel(item))}</button>` : `<p class="commerce-warning">${isModelPricing ? "模型页链接不是 https 或不属于 openrouter.ai，已阻断打开。" : "provider URL 缺失或不是 https，已阻断打开。"}</p>`}
      </article>`).join("")}
    </div>`;
  }

  function isSafeExternalProviderUrl(url){
    try {
      const parsed = new URL(String(url || "").trim());
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch (_) {
      return false;
    }
  }

  function recommendationHtml(task){
    const rec = task && task.recommendation || null;
    if (!rec || !rec.title) return `<p class="commerce-muted">暂无推荐结果。候选方案返回后会按价格、风险和条件生成推荐。</p>`;
    return `<div class="commerce-recommendation">
      <b>${esc(rec.title)}</b>
      <p>${esc(rec.reason || "")}</p>
      <p class="commerce-muted">主要风险：${esc(rec.riskSummary || "价格可能变化，仍需用户确认。")}</p>
      <p class="commerce-warning">价格可能变化；最终以真实 provider 页面和实际结算为准。预订、下单或付款前必须再次确认。</p>
    </div>`;
  }

  function loadTasks(){
    const api = agent();
    return api && api.getCommerceTasks ? api.getCommerceTasks() : [];
  }

  function render(host){
    ensureSearchLoaded(host);
    const tasks = loadTasks();
    try {
      const requestedTaskId = window.sessionStorage && window.sessionStorage.getItem("weishan:commerceAgent:selectedTask:v1");
      if (requestedTaskId && tasks.some((task) => task.taskId === requestedTaskId)) {
        selectedTaskId = requestedTaskId;
        window.sessionStorage.removeItem("weishan:commerceAgent:selectedTask:v1");
      }
    } catch (_) {}
    if (!selectedTaskId || !tasks.some((task) => task.taskId === selectedTaskId)) {
      selectedTaskId = tasks[0] && tasks[0].taskId || "";
    }
    const selected = tasks.find((task) => task.taskId === selectedTaskId) || null;
    host.innerHTML = `<section class="commerce-page commerce-workbench">
      <div class="commerce-hero">
        <div>
          <h1>全球采购</h1>
          <p>搜索、比价、推荐、执行前确认</p>
        </div>
        <button class="cmd-btn gray" id="commerceBackHome" type="button">返回首页总调度</button>
      </div>

      <div class="commerce-safety">
        当前只搜索和展示候选方案，不下单、不付款、不提交订单。
      </div>

      <div class="commerce-toolbar">
        <textarea id="commerceInput" class="cmd-input commerce-input" placeholder="例如：帮我比较 OpenRouter 和其他 AI 模型平台价格">${esc(draftText)}</textarea>
        <div class="cmd-actions">
          <button class="cmd-btn primary" id="commerceGenerate" type="button">生成采购计划</button>
          <button class="cmd-btn gray" id="commerceClearAll" type="button">清理全部计划</button>
        </div>
      </div>

      <div class="commerce-layout">
        <aside class="commerce-task-list" aria-label="采购任务列表">
          <div class="commerce-list-head">
            <h2>采购任务列表</h2>
            <span>${tasks.length} 项</span>
          </div>
          ${taskCards(tasks)}
        </aside>
        ${detailHtml(selected)}
      </div>
    </section>`;
    bind(host, tasks, selected);
  }

  function bind(host, tasks, selected){
    const api = agent();
    const input = host.querySelector("#commerceInput");
    if (input) input.addEventListener("input", () => { draftText = input.value; });
    const back = host.querySelector("#commerceBackHome");
    if (back) back.addEventListener("click", () => window.WeishanRouter && window.WeishanRouter.setRoute("home"));
    const emptyBack = host.querySelector("#commerceEmptyBackHome");
    if (emptyBack) emptyBack.addEventListener("click", () => window.WeishanRouter && window.WeishanRouter.setRoute("home"));
    host.querySelectorAll(".commerce-open-location-settings").forEach((button) => {
      button.addEventListener("click", () => {
        try { window.sessionStorage && window.sessionStorage.setItem("weishan:settings:focus", "commerceLocation"); } catch (_) {}
        if (window.WeishanRouter && window.WeishanRouter.setRoute) window.WeishanRouter.setRoute("settings");
      });
    });
    const generate = host.querySelector("#commerceGenerate");
    if (generate) generate.addEventListener("click", () => {
      if (!api || !api.createCommerceTask || !api.addCommerceTask) return;
      const text = input && input.value.trim() || "生成全球采购计划";
      const task = api.addCommerceTask(api.createCommerceTask(text));
      selectedTaskId = task.taskId;
      record("commerceAgent.taskCreated", task, "已在全球采购工作台生成本地 mock-safe 采购计划。");
      render(host);
    });
    const clearAll = host.querySelector("#commerceClearAll");
    if (clearAll) clearAll.addEventListener("click", () => {
      if (api && api.clearCommerceTasks) api.clearCommerceTasks();
      selectedTaskId = "";
      record("commerceAgent.allTasksCleared", { inputSummary:"清理全部采购计划", status:"cleared" }, "用户已清理全部全球采购计划。");
      render(host);
    });
    host.querySelectorAll(".commerce-view-task").forEach((button) => {
      button.addEventListener("click", () => {
        selectedTaskId = button.getAttribute("data-task-id") || "";
        render(host);
      });
    });
    host.querySelectorAll(".commerce-clear-task").forEach((button) => {
      button.addEventListener("click", () => {
        const taskId = button.getAttribute("data-task-id") || "";
        const target = tasks.find((task) => task.taskId === taskId);
        const next = tasks.filter((task) => task.taskId !== taskId);
        if (api && api.saveCommerceTasks) api.saveCommerceTasks(next);
        if (selectedTaskId === taskId) selectedTaskId = next[0] && next[0].taskId || "";
        record("commerceAgent.taskCleared", Object.assign({}, target || {}, { status:"cleared" }), "用户已清理单个全球采购计划。");
        render(host);
      });
    });
    host.querySelectorAll(".commerce-search-real").forEach((button) => {
      button.addEventListener("click", async () => {
        const search = searchApi();
        if (!search || !search.searchCommerceCandidates || !api || !api.updateCommerceTask) return;
        const taskId = button.getAttribute("data-task-id") || "";
        const target = tasks.find((task) => task.taskId === taskId);
        if (!target) return;
        const isModelPricing = target.category === "aiModelPricing";
        button.disabled = true;
        recordSearch(isModelPricing ? "commerceAgent.openRouterSearchRequested" : "commerceAgent.searchRequested", Object.assign({}, target, {
          providerName:isModelPricing ? "OpenRouter" : target.searchProviderName || "",
          resultStatus:"requested"
        }));
        const result = await search.searchCommerceCandidates(target);
        if (!result.ok) {
          const status = result.code === "COMMERCE_MISSING_FIELDS" ? "missingFields" : result.code === "COMMERCE_LOCAL_LAW_COMPLIANCE_REQUIRED" ? "local_law_compliance_required" : result.code === "COMMERCE_SHIPPING_DESTINATION_REQUIRED" || result.code === "COMMERCE_LOCATION_REQUIRED" ? "shipping_destination_required" : result.code === "COMMERCE_NO_PROVIDER" || result.code === "COMMERCE_PROVIDER_NOT_CONFIGURED" || result.code === "COMMERCE_PROVIDER_CONFIG_NOT_READY" ? "no_provider" : result.code === "COMMERCE_NO_RESULTS" ? "no_results" : "failed";
          const updated = api.updateCommerceTask(taskId, {
            searchStatus:status,
            missingFields:result.request && result.request.missingFields || target.missingFields || [],
            searchProviderName:result.providerName || (isModelPricing ? "OpenRouter" : ""),
            providerHealth:result.providerHealth || target.providerHealth || [],
            configHealth:result.configHealth || target.configHealth || {},
            connectorHealth:result.connectorHealth || target.connectorHealth || {},
            onboardingHealth:result.onboardingHealth || target.onboardingHealth || {},
            sandboxHealth:result.sandboxHealth || target.sandboxHealth || {},
            dryRunHealth:result.dryRunHealth || result.sandboxHealth || target.dryRunHealth || target.sandboxHealth || {},
            locationHealth:result.locationHealth || target.locationHealth || {},
            complianceHealth:result.complianceHealth || target.complianceHealth || {},
            landedCostAccuracy:result.landedCostAccuracy || target.landedCostAccuracy || "",
            canShowPrice:result.canShowPrice === true,
            canShowBookingButton:result.canShowBookingButton === true,
            canShowCheckoutButton:result.canShowCheckoutButton === true,
            searchErrorMessage:result.message || "",
            searchResultSummary:{ candidateCount:0 },
            updatedAt:new Date().toISOString()
          });
          recordSearch(isModelPricing ? "commerceAgent.openRouterSearchFailed" : status === "no_provider" ? "commerceAgent.searchProviderMissing" : "commerceAgent.searchFailed", Object.assign({}, updated || target, {
            providerName:result.providerName || (isModelPricing ? "OpenRouter" : ""),
            resultStatus:status,
            outputSummary:result.message || "搜索失败。"
          }));
          render(host);
          return;
        }
        const recommendation = result.recommendation || search.createRecommendationFromCandidates(result.candidates || []);
        const sorted = result.candidates || [];
        const first = sorted[0] || {};
        const updated = api.updateCommerceTask(taskId, {
          status:"recommended",
          searchStatus:"completed",
          searchProviderName:result.providerName || "",
          providerHealth:result.providerHealth || target.providerHealth || [],
          configHealth:result.configHealth || target.configHealth || {},
          connectorHealth:result.connectorHealth || target.connectorHealth || {},
          onboardingHealth:result.onboardingHealth || target.onboardingHealth || {},
          sandboxHealth:result.sandboxHealth || target.sandboxHealth || {},
          dryRunHealth:result.dryRunHealth || result.sandboxHealth || target.dryRunHealth || target.sandboxHealth || {},
          canShowPrice:result.canShowPrice === true,
          canShowBookingButton:result.canShowBookingButton === true,
          canShowCheckoutButton:result.canShowCheckoutButton === true,
          candidates:sorted,
          recommendation,
          searchResultSummary:{
            candidateCount:sorted.length,
            lowestPrice:first.totalPrice || first.price || "",
            lowestLandedCost:first.totalLandedCost || first.totalPrice || first.price || "",
            currency:first.currency || "",
            lowestPromptPricePerMillion:first.promptPricePerMillion || "",
            lowestCompletionPricePerMillion:first.completionPricePerMillion || "",
            recommendationTitle:recommendation && recommendation.title || ""
          },
          updatedAt:new Date().toISOString()
        });
        recordSearch(isModelPricing ? "commerceAgent.openRouterSearchCompleted" : "commerceAgent.searchCompleted", Object.assign({}, updated || target, {
          providerName:result.providerName,
          candidates:sorted,
          resultStatus:"completed"
        }));
        recordSearch(isModelPricing ? "commerceAgent.openRouterCandidatesRendered" : "commerceAgent.candidatesRendered", Object.assign({}, updated || target, {
          providerName:result.providerName,
          candidates:sorted,
          resultStatus:"rendered"
        }));
        render(host);
      });
    });
    host.querySelectorAll(".commerce-booking-link").forEach((link) => {
      link.addEventListener("click", () => {
        const url = link.getAttribute("data-url") || link.getAttribute("href") || "";
        const taskId = selected && selected.taskId || "";
        if (!isSafeExternalProviderUrl(url)) {
          recordSearch("commerceAgent.bookingLinkBlocked", Object.assign({}, selected || {}, {
            taskId,
            resultStatus:"bookingLinkBlocked",
            outputSummary:"provider URL 不是 http/https，已安全拦截；weishan 不下单、不付款、不提交订单。"
          }));
          return;
        }
        recordSearch("commerceAgent.bookingLinkViewed", Object.assign({}, selected || {}, {
          taskId,
          resultStatus:"bookingLinkViewed",
          outputSummary:"用户查看 https provider URL；weishan 不下单、不付款、不提交订单。"
        }));
        if (url && window.WeishanAPI && typeof window.WeishanAPI.openExternal === "function") {
          window.WeishanAPI.openExternal(url);
          return;
        }
        if (url && window.weishan && typeof window.weishan.openExternal === "function") window.weishan.openExternal(url);
      });
    });
    if (selected && selected.taskId !== lastViewedTaskId) {
      lastViewedTaskId = selected.taskId;
      record("commerceAgent.planViewed", selected, "用户已查看全球采购计划详情。");
    }
  }

  window.CommerceAgentPage = { mount:render };
})();
