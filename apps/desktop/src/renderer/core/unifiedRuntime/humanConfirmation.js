(function () {
  const V = window.WeishanUnifiedRuntimeValidation;
  const statuses = Object.freeze(["NOT_REQUESTED", "WAITING", "CONFIRMED", "DECLINED", "EXPIRED"]);
  const transitions = Object.freeze({ NOT_REQUESTED: [], WAITING: ["CONFIRMED", "DECLINED", "EXPIRED"], CONFIRMED: [], DECLINED: [], EXPIRED: [] });
  function exact(value, keys) { return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).every((key) => keys.includes(key)) && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key)); }
  function createConfirmationToken(review) {
    const value = V.copy(review);
    if (!value || value.schemaVersion !== "1.0" || typeof value.runtimeRequestId !== "string" || !value.confirmationSummary || !statuses.includes(value.confirmationSummary.status)) V.fail("invalid_runtime_review");
    return V.freeze({ schemaVersion: "1.0", confirmationId: "confirmation-" + value.runtimeRequestId, runtimeRequestId: value.runtimeRequestId,
      status: value.confirmationSummary.status, required: value.confirmationSummary.required, authorizesExecution: false, createdAt: value.createdAt });
  }
  function validateConfirmation(value) {
    const copy = V.copy(value);
    if (!exact(copy, ["schemaVersion", "confirmationId", "runtimeRequestId", "status", "required", "authorizesExecution", "createdAt"]) ||
      copy.schemaVersion !== "1.0" || typeof copy.confirmationId !== "string" || typeof copy.runtimeRequestId !== "string" ||
      !statuses.includes(copy.status) || typeof copy.required !== "boolean" || copy.authorizesExecution !== false || typeof copy.createdAt !== "string") V.fail("invalid_confirmation_contract");
    return V.freeze(copy);
  }
  function updateConfirmation(value, status) {
    const confirmation = validateConfirmation(value);
    if (!statuses.includes(status) || !transitions[confirmation.status].includes(status)) V.fail("invalid_confirmation_transition");
    return V.freeze(Object.assign({}, confirmation, { status, authorizesExecution: false }));
  }
  window.WeishanHumanConfirmation = Object.freeze({ STATUSES: statuses, createConfirmationToken, validateConfirmation, updateConfirmation });
})();
