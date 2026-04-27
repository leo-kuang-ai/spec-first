---
spec_id: cli-command-safety
title: CLI Command Safety
source: extracted
confirmation_status: confirmed
lifecycle_status: active
level: L3
scope:
  - common
  - cli
priority: 80
severity: medium
confidence: medium
---

# CLI Command Safety

## Summary for Agent

- All CLI subcommands must validate required inputs before performing any I/O.
- Multi-file writes must use a tmp directory and atomic rename; partial state must not be observable.
- Commands that read user-supplied payload files must check for secret-like values before writing.

## Rules

### RULE-CLI-SAFETY-001 Validate Inputs Before I/O

- Status: inferred
- Scope: common/cli
- Severity: medium
- Rule: Every CLI subcommand must resolve and validate all required options before creating any directories or writing any files.
- Check method: Inspect subcommand entry points to confirm validation runs before the first `fs.mkdirSync` or `fs.writeFileSync`.

### RULE-CLI-SAFETY-002 Use Atomic Tmp-Then-Rename For Multi-File Writes

- Status: inferred
- Scope: common/cli
- Severity: medium
- Rule: When a command writes multiple related files, write to a temporary directory first and rename to the final path only after all writes succeed; clean up the tmp dir on failure.
- Check method: Review multi-file write paths for tmp-then-rename pattern and error cleanup.
