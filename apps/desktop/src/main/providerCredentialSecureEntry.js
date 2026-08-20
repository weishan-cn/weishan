const { execFile } = require("child_process");

const PROVIDER_CREDENTIAL_SECURE_ENTRY_VERSION = "1.0.0";
const CANCELLED_MARKER = "__WEISHAN_SECURE_ENTRY_CANCELLED__";
const METADATA_IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

const VISIBLE_PROMPT_SCRIPT = [
  "on run argv",
  "set promptText to item 1 of argv",
  "set defaultText to item 2 of argv",
  "try",
  "set response to display dialog promptText default answer defaultText buttons {\"Cancel\", \"Continue\"} default button \"Continue\" cancel button \"Cancel\" with title \"Weishan Provider Credential Store\"",
  "return text returned of response",
  "on error number -128",
  `return "${CANCELLED_MARKER}"`,
  "end try",
  "end run"
].join("\n");

const SECRET_PROMPT_SCRIPT = [
  "on run argv",
  "set promptText to item 1 of argv",
  "try",
  "set response to display dialog promptText default answer \"\" with hidden answer buttons {\"Cancel\", \"Store Securely\"} default button \"Store Securely\" cancel button \"Cancel\" with title \"Weishan Secret Entry Zone\"",
  "return text returned of response",
  "on error number -128",
  `return "${CANCELLED_MARKER}"`,
  "end try",
  "end run"
].join("\n");

function redactedFailure(code) {
  return { ok:false, error:String(code || "SECURE_ENTRY_FAILED"), redacted:true };
}

function createMacOSSecureEntry(options = {}) {
  const execFileRef = options.execFile || execFile;
  const platform = options.platform || process.platform;

  function runPrompt(script, args) {
    if (platform !== "darwin") return Promise.resolve(redactedFailure("SECURE_ENTRY_UNAVAILABLE"));
    return new Promise((resolve) => {
      execFileRef("/usr/bin/osascript", ["-e", script, "--", ...args.map((value) => String(value || ""))], {
        encoding:"utf8",
        maxBuffer:64 * 1024,
        windowsHide:true
      }, (error, stdout) => {
        if (error) {
          resolve(redactedFailure(error && error.killed ? "SECURE_ENTRY_INTERRUPTED" : "SECURE_ENTRY_FAILED"));
          return;
        }
        const value = String(stdout || "").replace(/[\r\n]+$/, "");
        if (value === CANCELLED_MARKER) {
          resolve(redactedFailure("SECURE_ENTRY_CANCELLED"));
          return;
        }
        resolve({ ok:true, value, redacted:true });
      });
    });
  }

  async function promptMetadata(label, defaultValue) {
    const result = await runPrompt(VISIBLE_PROMPT_SCRIPT, [label, defaultValue]);
    if (!result.ok) return result;
    const value = String(result.value || "").trim();
    return value ? { ok:true, value, redacted:true } : redactedFailure("METADATA_REQUIRED");
  }

  async function promptSecret(label) {
    const result = await runPrompt(SECRET_PROMPT_SCRIPT, [label]);
    if (!result.ok) return result;
    const value = String(result.value || "");
    return value ? { ok:true, value, redacted:true } : redactedFailure("SECRET_REQUIRED");
  }

  async function collectCredentialBundle(defaults = {}) {
    const provider = await promptMetadata("Credential target 1/4 — Provider identifier", defaults.provider || "ebay");
    if (!provider.ok) return provider;
    if (!METADATA_IDENTIFIER_PATTERN.test(provider.value)) return redactedFailure("INVALID_PROVIDER_IDENTIFIER");
    const environment = await promptMetadata("Credential target 2/4 — Environment", defaults.environment || "sandbox");
    if (!environment.ok) return environment;
    if (!METADATA_IDENTIFIER_PATTERN.test(environment.value)) return redactedFailure("INVALID_ENVIRONMENT_IDENTIFIER");
    if (provider.value.toLowerCase() === environment.value.toLowerCase()) return redactedFailure("PROVIDER_ENVIRONMENT_COLLISION");
    const application = await promptMetadata("Credential target 3/4 — Application name", defaults.application || "Weishan Global Commerce");
    if (!application.ok) return application;
    const typesResult = await promptMetadata("Credential target 4/4 — Credential types, comma separated", (defaults.credentialTypes || ["client_id", "client_secret"]).join(","));
    if (!typesResult.ok) return typesResult;
    const credentialTypes = typesResult.value.split(",").map((value) => value.trim()).filter(Boolean);
    if (!credentialTypes.length) return redactedFailure("CREDENTIAL_TYPES_REQUIRED");
    if (credentialTypes.some((credentialType) => !METADATA_IDENTIFIER_PATTERN.test(credentialType))) return redactedFailure("INVALID_CREDENTIAL_TYPE");

    const descriptor = Object.freeze({
      provider:provider.value,
      environment:environment.value,
      application:application.value
    });

    const credentials = {};
    for (const credentialType of credentialTypes) {
      const captured = await promptSecret(`${descriptor.provider} / ${descriptor.environment} / ${descriptor.application} / ${credentialType}`);
      if (!captured.ok) {
        Object.keys(credentials).forEach((key) => { credentials[key] = ""; });
        return captured;
      }
      credentials[credentialType] = captured.value;
    }

    return {
      ok:true,
      descriptor,
      credentials,
      entryZone:"macos_native_hidden_input",
      redacted:true
    };
  }

  return {
    version:PROVIDER_CREDENTIAL_SECURE_ENTRY_VERSION,
    collectCredentialBundle
  };
}

module.exports = {
  PROVIDER_CREDENTIAL_SECURE_ENTRY_VERSION,
  createMacOSSecureEntry
};
