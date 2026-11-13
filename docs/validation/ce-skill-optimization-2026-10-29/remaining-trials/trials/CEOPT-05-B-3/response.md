Target: `example/support-api`, head `fix/export-tenant` → base `release/2026-10`.
Range: `release/2026-10...fix/export-tenant`.

Title: `fix(export): prevent cross-tenant monthly CSV exports`

### Summary

Monthly CSV exports could include another tenant’s records. Exports now include only records belonging to `req.tenantId`, while retaining inclusive UTC month-start and exclusive next-month-start bounds. The existing CSV serializer is reused without dependency changes.

### Validation

The supplied local receipt reports `node --test test/export.test.cjs` exited with code 0: all 4 tests passed, covering tenant isolation, month bounds, header columns and empty results. No CI evidence was supplied.

### Related work

Related to example/support-api#412, the broader scheduled-export initiative. Scheduling remains outside this patch’s scope.

### Rollout

Intended for `release/2026-10`. Deployment and public release are unverified. This is a description-only draft; no PR was created or updated.
