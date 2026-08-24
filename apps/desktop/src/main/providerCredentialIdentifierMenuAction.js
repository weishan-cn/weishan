function createProviderCredentialIdentifierMenuAction(options = {}) {
  const getService = typeof options.getService === "function" ? options.getService : () => null;
  const getEnvironment = typeof options.getEnvironment === "function" ? options.getEnvironment : () => process.env;
  const lockedIdentifierTargetFromEnvironment = options.lockedIdentifierTargetFromEnvironment;

  return async function openProviderCredentialIdentifierFromMenu() {
    const service = getService();
    if (!service || typeof service.beginProviderCredentialIdentifierEntry !== "function") {
      return { ok:false, error:"IDENTIFIER_ENTRY_SERVICE_UNAVAILABLE", redacted:true };
    }
    const lockedTarget = typeof lockedIdentifierTargetFromEnvironment === "function"
      ? lockedIdentifierTargetFromEnvironment(getEnvironment())
      : null;
    return service.beginProviderCredentialIdentifierEntry(lockedTarget || undefined)
      .catch(() => ({ ok:false, error:"IDENTIFIER_ENTRY_FAILED", redacted:true }));
  };
}

module.exports = {
  createProviderCredentialIdentifierMenuAction
};
