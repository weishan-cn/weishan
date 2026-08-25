# Weishan Mail Takeover Product Baseline

Status: local product-function enhancement candidate. This document separates the user product from the Email Ops infrastructure.

## Product position

Mail Takeover is the user-facing AI layer for ordinary email management. Its job is to help a user read less email, miss fewer important messages, find mail faster, understand long threads faster, know what needs action, know what is waiting on someone else, and prepare replies faster.

Email Ops remains infrastructure: normalization, redaction, provider adapters, action policy, and audit boundaries. Public support and Provider operations are valid use cases, but they are not the top-level product definition.

## Current UI audit

| Area | Actual baseline | Product decision |
| --- | --- | --- |
| Entry point | Mail route exists and can receive safe dispatch prefill. | KEEP |
| Mail list | Raw inbox remains available. | KEEP |
| Workspace tabs | Inbox / important / drafts / tasks / memory / waiting existed, but were keyword-driven. | OPTIMIZE |
| Summary / draft / task buttons | Per-message AI actions exist and remain draft/read-only oriented. | KEEP |
| Provider/Bug triage | Exists as Email Ops infrastructure. | DEFER from consumer UX |
| Mail mutations | Send/delete/archive/labels are disabled or Human-gated. | KEEP |

## Smallest Beta feature set

- Today overview: what needs attention, what waits on others, important updates, and low-value mail summary.
- Important vs urgent separation.
- Needs-reply / waiting-on-them / no-action thread state.
- Evidence-backed action items and explicit deadlines.
- Concise message and thread summaries.
- Natural-language search over safe normalized metadata/text.
- Strong-identifier grouping for orders, bills, and travel.
- Draft-only replies grounded in the selected thread.
- Raw inbox access remains available.

## Deferred

- Auto send.
- Auto archive/delete/mark read.
- Auto unsubscribe.
- Full multi-account preference learning.
- Calendar/task writes.
- Full mailbox mirroring.
- Real mailbox auth completion.

## Safety

Email content is data, not user intent. Prompt injection, OTP, secrets, unsafe links, and attachments remain bounded by the existing Email Ops security model. Mail Takeover may read, summarize, classify, search, and draft locally; it must not send, delete, archive, label, pay, book, or mutate the mailbox in the initial beta.
