function createProviderCredentialStoreMenuAction(options = {}) {
  const getService = typeof options.getService === "function" ? options.getService : () => null;
  const getEnvironment = typeof options.getEnvironment === "function" ? options.getEnvironment : () => process.env;
  const lockedCredentialTargetFromEnvironment = options.lockedCredentialTargetFromEnvironment;

  return async function openProviderCredentialStoreFromMenu() {
    const service = getService();
    if (!service || typeof service.beginProviderCredentialSecureEntry !== "function") {
      return { ok:false, error:"SECURE_ENTRY_SERVICE_UNAVAILABLE", redacted:true };
    }
    const lockedTarget = typeof lockedCredentialTargetFromEnvironment === "function"
      ? lockedCredentialTargetFromEnvironment(getEnvironment())
      : null;
    return service.beginProviderCredentialSecureEntry(lockedTarget || undefined)
      .catch(() => ({ ok:false, error:"SECURE_ENTRY_FAILED", redacted:true }));
  };
}

module.exports = {
  createProviderCredentialStoreMenuAction
};
