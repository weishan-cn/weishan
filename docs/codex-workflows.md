# Codex Workflows for Open Source Maintenance

Weishan uses Codex as a maintainer assistant for ordinary repository work. It can speed up review, testing, and documentation tasks, but it does not replace human judgment for safety-sensitive or release-critical decisions.

## Intended Uses

- Issue triage.
- Pull request review.
- Regression testing.
- Release checks.
- Security review.
- Documentation maintenance.
- Maintainer automation.

## Issue Triage

Codex can summarize new issues, extract reproduction details, identify missing context, suggest labels, and route reports to the most relevant area of the codebase.

## Pull Request Review

Codex can review pull requests for regressions, missing tests, documentation gaps, and changes that affect safety boundaries. Human maintainers remain responsible for final review, approval, and merge decisions.

## Regression Testing

Codex can run local checks, compare results across runs, summarize failures, and help keep repeatable test workflows consistent during maintenance work.

## Release Checks

Codex can help run version checks, release postchecks, build checks, packaging verification, and other pre-release validation steps before maintainers publish a release.

## Security Review

Codex can help inspect changes for secrets, unsafe credential handling, automatic sending, payment or order execution, provider safety regressions, and other behaviors that should remain blocked in a public repository.

## Documentation Maintenance

Codex can help keep README files, contributor guides, security notes, changelogs, workflow docs, and architecture docs aligned with the codebase and current maintainer practice.

## Maintainer Automation

Codex can automate repetitive maintainer tasks such as checklists, review summaries, issue routing, test orchestration, and release preparation, as long as the task stays within the repository’s safety rules.

## Human Review Requirement

Codex output is advisory. A human maintainer must review any change that affects runtime behavior, release scope, security posture, external integrations, or user-facing safety boundaries before it is merged or published.

## Safety-Sensitive Change Boundaries

Codex must not be used to silently expand behavior into payment flows, order execution, email sending, secret storage, external provider access, or other high-risk operations unless the change has been explicitly reviewed and approved by a human maintainer.

## Data Handling Rules

Do not place secrets in prompts, issues, pull requests, logs, screenshots, or commit messages. This includes API keys, tokens, passwords, session credentials, and other sensitive identifiers.

## Explicit Non-Goals

- No automatic email sending.
- No payment execution.
- No order execution.
- No hidden provider side effects.
- No secret collection or reuse from conversational context.
