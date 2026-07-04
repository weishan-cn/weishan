(function(){
  window.WeishanConfig = {
    version: "4.1.8",
    localFirst: true,
    backend: {
      metadataBaseUrl: "",
      pocketbaseBaseUrl: "",
      collections: ["users","plans","subscriptions","organizations","organization_members","storage_allocations","storage_usage","notifications","audit_logs"],
      secretsPolicy: "真实管理员密码、对象存储密钥、企业 token 不写入客户端源码。"
    },
    planMode: { free: "A", pro: "A", team: "B", enterprise: "B", institution: "B" },
    policy: {
      customerData: "local_only_by_default",
      bugTelemetry: "confirm_before_upload",
      aiRepair: "confirm_before_upload",
      companyToken: "company_project_only",
      clearScope: "current_user_app_data_only"
    }
  };
})();
