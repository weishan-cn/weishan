# Anonymous Product Analytics / Module Usage Intelligence

Status: internal foundation only. No cloud sink, third-party analytics SDK, website change, account wall, Provider call, mailbox read, credential mutation, packaging, billing, production traffic, or external send is introduced by this module.

Core rule:

MEASURE THE PRODUCT.

DO NOT MONITOR THE PERSON.

## What may be measured

The foundation supports bounded, privacy-safe aggregate product questions:

- approximate anonymous DAU / WAU / MAU;
- which user-facing modules are opened;
- coarse module action frequency;
- coarse success, partial success, no-result, failure, safe-block, and cancelled outcomes;
- repeat module use and conservative retention evidence;
- product prioritization evidence such as `INVEST_MORE`, `KEEP_OPTIMIZING`, `MAINTAIN`, `INVESTIGATE`, `DEPRIORITIZE`, `EVALUATE_FOR_REMOVAL`, or `INSUFFICIENT_DATA`.

Prioritization output is evidence for Human/product review. It does not delete modules, hide routes, change Provider readiness, change recommendations, change ranking, authorize execution, or freeze engineering work.

## What is forbidden

Analytics events must not contain raw or hashed versions of:

- shopping, flight, hotel, cruise, Home, or Mail query text;
- email subject, sender, recipient, body, thread content, attachment name, attachment contents, OTP, invoice details, order details, or travel details from Mail;
- API keys, tokens, passwords, authorization headers, OAuth tokens, mail auth codes, private keys, challenge passwords, Provider secrets, cookies, or credential values;
- full URLs;
- email, phone, person name, registered address, account identity, username, IP address, geolocation, MAC address, hardware serial, machine GUID, user agent, screen, font, CPU, GPU, timezone, or other fingerprint material.

The implementation rejects unknown event names, unknown module IDs, unknown properties, prototype-pollution keys, huge values, and secret-like values. It does not “repair” rejected payloads because repair could accidentally retain sensitive data.

## Identifier boundary

If an anonymous install identifier is needed, it is random. It is not derived from hardware, OS identifiers, IP address, username, email, browser state, or device fingerprint combinations. Reset creates a new anonymous installation identity; the old identity is not reconstructed.

Session IDs are random and conservative. They are not identity.

## Event contract

Allowed event fields are strictly bounded:

- `eventName`
- `eventVersion`
- `anonymousInstallId`
- `sessionId`
- `moduleId`
- `actionClass`
- `outcome`
- `timestamp`
- `durationBucket`
- `resultCountBucket`
- `errorClassSafe`
- `domainCategory`
- `appVersion`
- `platformClass`
- `locale`

Allowed modules are bounded to current user-facing product areas:

- `HOME`
- `SHOPPING`
- `FLIGHT`
- `HOTEL`
- `CRUISE`
- `MAIL`
- `PLUGINS`
- `SETTINGS`
- `SECURITY_PRIVACY`

Event names are bounded coarse product events such as `module_opened`, `search_completed`, `compare_completed`, `recommendation_shown`, `handoff_clicked`, and coarse Mail events. Button micro-click telemetry and arbitrary plugin payload analytics are deleted/deferred.

## Local aggregation and bounds

The current foundation is local and synthetic-testable:

event created → strict schema validation → privacy filter → bounded local queue → aggregation → module metrics → Human prioritization evidence.

Queue size is bounded. Overflow drops old analytics work rather than blocking the product. Analytics failure is isolated and non-blocking. There is no live network sink in this mission.

## Deferred work

Deferred until separate review:

- public Beta privacy disclosure copy/site update;
- Settings UI refinement for analytics preference/reset;
- any backend analytics sink;
- any dashboard;
- any cohort/deep retention analysis beyond coarse aggregate proof;
- any third-party analytics provider.
