Target: `example/support-api`, head `fix/export-tenant` → base `release/2026-10`.
Range: `release/2026-10...fix/export-tenant`.

Title: `fix(export): prevent cross-tenant rows in monthly CSV exports`

### Summary

Monthly CSV exports now include only the requesting tenant’s records, preventing rows from other tenants from appearing. Filtering uses `req.tenantId` and preserves the UTC interval from inclusive month start to exclusive next month start. The existing CSV serializer is reused; no dependencies change.

### Validation

The supplied local receipt reports `node --test test/export.test.cjs` exited with code 0: 4 tests passed, covering tenant isolation, month bounds, header columns, and empty results.

### Related work

Related to example/support-api#412, the broader scheduled-export initiative. This patch addresses tenant isolation only; scheduling remains outside its scope and the issue stays open.

### Rollout

Targets `release/2026-10`. No CI, deployment, or public release evidence was supplied. This is a description-only draft; no PR was created or updated.
