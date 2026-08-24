const { execFile } = require("child_process");

const PROVIDER_CREDENTIAL_IDENTIFIER_ENTRY_VERSION = "1.0.0";
const CANCELLED_MARKER = "__WEISHAN_IDENTIFIER_ENTRY_CANCELLED__";
const METADATA_IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const LOCKED_IDENTIFIER_MODE = "locked";
const PLACEHOLDER_METADATA = new Set(["application", "credentialtype", "identifier", "identifiertype"]);

const IDENTIFIER_PROMPT_SCRIPT = [
  "on run argv",
  "set promptText to item 1 of argv",
  "set defaultText to item 2 of argv",
  "set hostAppName to item 3 of argv",
  "try",
  "if hostAppName is not \"\" then",
  "tell application hostAppName",
  "activate",
  "set response to display dialog promptText default answer defaultText buttons {\"Cancel\", \"Bind Identifier\"} default button \"Bind Identifier\" cancel button \"Cancel\" with title \"Weishan Provider Credential Identifier\"",
  "end tell",
  "else",
  "set response to display dialog promptText default answer defaultText buttons {\"Cancel\", \"Bind Identifier\"} default button \"Bind Identifier\" cancel button \"Cancel\" with title \"Weishan Provider Credential Identifier\"",
  "end if",
  "return text returned of response",
  "on error number -128",
  `return "${CANCELLED_MARKER}"`,
  "end try",
  "end run"
].join("\n");

function redactedFailure(code) {
  return { ok:false, error:String(code || "IDENTIFIER_ENTRY_FAILED"), redacted:true };
}

function cleanMetadataSegment(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!METADATA_IDENTIFIER_PATTERN.test(text)) return "";
  if (PLACEHOLDER_METADATA.has(text)) return "";
  return text;
}

function cleanApplication(value) {
  const text = String(value || "").trim();
  if (text.length < 2 || text.length > 160 || /[\u0000-\u001f\u007f]/.test(text)) return "";
  if (PLACEHOLDER_METADATA.has(text.toLowerCase())) return "";
  return text;
}

function normalizeLockedIdentifierTarget(defaults = {}) {
  const provider = cleanMetadataSegment(defaults.provider);
  const environment = cleanMetadataSegment(defaults.environment);
  const application = cleanApplication(defaults.application);
  const identifierType = cleanMetadataSegment(defaults.identifierType);

  if (!provider) return redactedFailure("INVALID_PROVIDER_IDENTIFIER");
  if (!environment) return redactedFailure("INVALID_ENVIRONMENT_IDENTIFIER");
  if (provider === environment) return redactedFailure("PROVIDER_ENVIRONMENT_COLLISION");
  if (!application) return redactedFailure("INVALID_APPLICATION_IDENTIFIER");
  if (!identifierType) return redactedFailure("INVALID_IDENTIFIER_TYPE");

  return {
    ok:true,
    descriptor:Object.freeze({ provider, environment, application }),
    identifierType,
    lockedMetadata:true,
    redacted:true
  };
}

function lockedIdentifierTargetFromEnvironment(environment = {}) {
  if (String(environment.WEISHAN_PROVIDER_IDENTIFIER_ENTRY_MODE || "").trim().toLowerCase() !== LOCKED_IDENTIFIER_MODE) return null;
  return {
    lockedMetadata:true,
    provider:environment.WEISHAN_PROVIDER_IDENTIFIER_PROVIDER,
    environment:environment.WEISHAN_PROVIDER_IDENTIFIER_ENVIRONMENT,
    application:environment.WEISHAN_PROVIDER_IDENTIFIER_APPLICATION,
    identifierType:environment.WEISHAN_PROVIDER_IDENTIFIER_TYPE
  };
}

function createMacOSIdentifierEntry(options = {}) {
  const execFileRef = options.execFile || execFile;
  const platform = options.platform || process.platform;
  const hostApplicationName = String(options.hostApplicationName || "").trim();

  function runPrompt(label, defaultValue) {
    if (platform !== "darwin") return Promise.resolve(redactedFailure("IDENTIFIER_ENTRY_UNAVAILABLE"));
    return new Promise((resolve) => {
      execFileRef("/usr/bin/osascript", ["-e", IDENTIFIER_PROMPT_SCRIPT, "--", String(label || ""), String(defaultValue || ""), hostApplicationName], {
        encoding:"utf8",
        maxBuffer:64 * 1024,
        windowsHide:true
      }, (error, stdout) => {
        if (error) {
          resolve(redactedFailure(error && error.killed ? "IDENTIFIER_ENTRY_INTERRUPTED" : "IDENTIFIER_ENTRY_FAILED"));
          return;
        }
        const value = String(stdout || "").replace(/[\r\n]+$/, "");
        if (value === CANCELLED_MARKER) {
          resolve(redactedFailure("IDENTIFIER_ENTRY_CANCELLED"));
          return;
        }
        resolve({ ok:true, value, redacted:true });
      });
    });
  }

  async function collectIdentifierBinding(defaults = {}) {
    const normalized = normalizeLockedIdentifierTarget(defaults);
    if (!normalized.ok) return normalized;
    const label = `${normalized.descriptor.provider} / ${normalized.descriptor.environment} / ${normalized.descriptor.application} / ${normalized.identifierType}`;
    const captured = await runPrompt(label, "");
    if (!captured.ok) return captured;
    const value = String(captured.value || "").trim();
    if (!value) return redactedFailure("IDENTIFIER_VALUE_REQUIRED");
    return {
      ok:true,
      descriptor:normalized.descriptor,
      identifierType:normalized.identifierType,
      value,
      entryZone:"macos_native_identifier_input",
      valueReturnedToMainProcessOnly:true,
      redacted:true
    };
  }

  return {
    version:PROVIDER_CREDENTIAL_IDENTIFIER_ENTRY_VERSION,
    collectIdentifierBinding
  };
}

module.exports = {
  PROVIDER_CREDENTIAL_IDENTIFIER_ENTRY_VERSION,
  createMacOSIdentifierEntry,
  lockedIdentifierTargetFromEnvironment,
  normalizeLockedIdentifierTarget
};
