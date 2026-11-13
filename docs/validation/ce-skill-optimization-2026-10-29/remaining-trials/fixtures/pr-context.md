# Caller-owned PR context

The public work owner requests description-only composition. Read-only context is supplied completely; remote probing is unnecessary and not authorized.
Target repo: example/support-api
Head branch: fix/export-tenant
Base branch: release/2026-10 (not main)
Range: release/2026-10...fix/export-tenant
One commit: restrict monthly CSV export to req.tenantId, preserving inclusive UTC month start and exclusive next month start. Existing CSV serializer reused. No dependency changes.
Local validation receipt: node --test test/export.test.cjs; exit_code 0; 4 tests passed. The check covered tenant isolation, month bounds, header columns and empty results. No CI, deploy or public release evidence.
Related issue: #412 tracks a broader scheduled-export initiative. This patch does not implement scheduling and must not close that issue.
Existing PR body: none (draft requested, no PR created).
Developer attribution: no co-author evidence supplied.
Active local config: pr_teaching_section: false; pr_teaching_archive: false.

## Project PULL_REQUEST_TEMPLATE.md
Use exactly these headings, preserve their order. Do not add other sections or branding.
### Summary
### Validation
### Related work
### Rollout
